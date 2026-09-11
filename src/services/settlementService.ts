import { collection, getDocs, addDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Settlement, Order, Seller } from '../types';
import { getOrders, getSellersFromFirestore } from './firebaseService';

export const createSettlement = async (order: Order, sellerId: string, storeName: string, commissionPercent: number = 5): Promise<void> => {
  try {
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
    const totalRtoPenalty = baseShippingCost * 2; 

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
