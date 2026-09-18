import { collection, getDocs, addDoc, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Settlement, Order, Seller } from '../types';
import { getOrders, getSellersFromFirestore } from './firebaseService';

export const createSettlement = async (order: Order, sellerId: string, storeName: string, commissionPercent: number = 5): Promise<void> => {
  try {
    // Check if a positive settlement already exists for this order to prevent duplicates
    const q = query(
      collection(db, 'settlements'),
      where('orderId', '==', order.id)
    );
    const snapshot = await getDocs(q);
    
    // Filter positive settlements in memory to avoid Firestore index requirements
    const hasPositiveSettlement = snapshot.docs.some(doc => {
      const data = doc.data();
      return data.amountOwed && data.amountOwed > 0;
    });

    if (hasPositiveSettlement) {
      console.log(`Positive settlement already exists for order ${order.id}. Skipping duplicate creation.`);
      return;
    }

    const baseAmount = order.productTotal !== undefined ? order.productTotal : order.totalAmount;
    
    let amountOwed = baseAmount - (baseAmount * (commissionPercent / 100));

    if (order.sellerOffersFreeShipping && order.actualShippingCost) {
      amountOwed -= order.actualShippingCost;
    }

    amountOwed = Math.max(0, Math.round(amountOwed * 100) / 100);
    
    const settlement: Omit<Settlement, 'id'> = {
      sellerId,
      storeName,
      orderId: order.id,
      amountOwed: Math.round(amountOwed * 100) / 100,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'settlements'), settlement);
    await updateDoc(docRef, { id: docRef.id });
    console.log('Settlement created:', docRef.id);
  } catch (error) {
    console.error('Error creating settlement:', error);
    throw error;
  }
};

export const chargeRTOPenalty = async (order: Order): Promise<void> => {
  try {
    const baseShippingCost = order.actualShippingCost || 49; // Fallback to 49 if no actual cost saved
    if (baseShippingCost <= 0) return; // No penalty if no shipping cost

    // Penalty includes BOTH forward shipping (seller to customer) AND reverse shipping (customer to seller)
    // Plus platform fee for both forward and reverse
    const basePenalty = (baseShippingCost * 2) + ((order.platformFee || 5) * 2);
    const totalRtoPenalty = basePenalty + (basePenalty * 0.18); // Including 18% GST 

    const sellerId = order.items[0]?.product?.sellerId;
    const storeName = order.items[0]?.product?.sellerName || 'Unknown Store';

    if (!sellerId) return;

    const settlement: Omit<Settlement, 'id'> = {
      sellerId,
      storeName,
      orderId: order.id,
      amountOwed: -Math.abs(totalRtoPenalty), // Negative settlement for penalty
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'settlements'), settlement);
    await updateDoc(docRef, { id: docRef.id });
    console.log('RTO Penalty Settlement created:', docRef.id);
  } catch (error) {
    console.error('Error creating RTO penalty:', error);
  }
};

export const chargeSellerFaultPenalty = async (order: Order, returnItem: any): Promise<void> => {
  try {
    const baseShippingCost = order.actualShippingCost || 49;
    if (baseShippingCost <= 0) return;

    // Penalty is Forward Shipping + Reverse Shipping + Platform Fee (Forward + Reverse) + 18% GST
    // Similar to RTO penalty, but marked as Seller Fault (Wrong Item/Defective)
    const basePenalty = (baseShippingCost * 2) + ((order.platformFee || 5) * 2);
    const totalFaultPenalty = basePenalty + (basePenalty * 0.18); 

    const sellerId = order.items[0]?.product?.sellerId;
    const storeName = order.items[0]?.product?.sellerName || 'Unknown Store';

    if (!sellerId) return;

    const settlement: Omit<Settlement, 'id'> = {
      sellerId,
      storeName,
      orderId: order.id,
      amountOwed: -Math.abs(totalFaultPenalty), // Negative settlement for penalty
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'settlements'), settlement);
    await updateDoc(docRef, { id: docRef.id });
    console.log('Seller Fault Penalty Settlement created:', docRef.id);
  } catch (error) {
    console.error('Error creating seller fault penalty:', error);
  }
};

export const getSettlementsBySeller = async (sellerId: string): Promise<Settlement[]> => {
  try {
    const q = query(collection(db, 'settlements'), where('sellerId', '==', sellerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Settlement).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching seller settlements:', error);
    return [];
  }
};

export const getAllSettlements = async (): Promise<Settlement[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'settlements'));
    return snapshot.docs.map(doc => doc.data() as Settlement).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching all settlements:', error);
    return [];
  }
};

export const markSettlementPaid = async (settlementId: string, payoutRef: string): Promise<void> => {
  try {
    const ref = doc(db, 'settlements', settlementId);
    await updateDoc(ref, {
      status: 'settled',
      settledAt: new Date().toISOString(),
      payoutReference: payoutRef
    });
  } catch (error) {
    console.error('Error marking settlement paid:', error);
    throw error;
  }
};

export const syncPastDeliveries = async (): Promise<number> => {
  try {
    const allOrders = await getOrders();
    const allSellers = await getSellersFromFirestore();
    const existingSettlements = await getAllSettlements();
    
    const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
    let syncCount = 0;

    for (const order of deliveredOrders) {
      // Check if settlement already exists for this order
      const exists = existingSettlements.some(s => s.orderId === order.id);
      if (!exists) {
        // Find the seller for this order (assuming one seller per order for simplicity, or grab from first item)
        const sellerId = order.items[0]?.product?.sellerId;
        const seller = allSellers.find((s: Seller) => s.id === sellerId);
        
        if (sellerId && seller) {
          await createSettlement(order, sellerId, seller.storeName);
          syncCount++;
        }
      }
    }
    return syncCount;
  } catch (error) {
    console.error('Error syncing past deliveries:', error);
    return 0;
  }
};

export const getCodRemittedOrders = async (): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('codRemitted', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Order).sort((a, b) => {
      const dateA = a.remittanceDate || a.createdAt;
      const dateB = b.remittanceDate || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  } catch (error) {
    console.error('Error fetching remitted orders:', error);
    return [];
  }
};

export const getPendingCodRemittances = async (): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('paymentMode', '==', 'cod'),
      where('status', '==', 'delivered')
    );
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => doc.data() as Order);
    // Firestore index on multiple fields might be tricky, so filtering codRemitted locally
    return orders.filter(o => !o.codRemitted).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error('Error fetching pending COD remittances:', error);
    return [];
  }
};

export const markCodAsRemitted = async (orders: Order[], utrNumber: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const order of orders) {
      const orderRef = doc(db, 'orders', order.id);
      batch.update(orderRef, {
        codRemitted: true,
        remittanceDate: now,
        utrNumber,
        remittanceAmount: order.totalAmount,
        paymentStatus: 'paid'
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error marking COD as remitted:', error);
    throw error;
  }
};
