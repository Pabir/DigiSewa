const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");

admin.initializeApp();

const SHIPROCKET_API_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken = null;
let tokenExpiry = 0;

async function getShiprocketToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now) {
    return cachedToken;
  }

  const email = process.env.EXPO_PUBLIC_SHIPROCKET_EMAIL;
  const password = process.env.EXPO_PUBLIC_SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Shiprocket credentials are not configured on the server."
    );
  }

  const response = await fetch(`${SHIPROCKET_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new functions.https.HttpsError(
      "internal",
      `Failed to authenticate with Shiprocket: ${errorData}`
    );
  }

  const data = await response.json();
  cachedToken = data.token;
  // Cache for 9 days
  tokenExpiry = now + 9 * 24 * 60 * 60 * 1000;

  return cachedToken;
}

exports.shiprocketProxy = functions.https.onCall(async (data, context) => {
  const { endpoint, method, payload } = data;

  if (!endpoint || !method) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Endpoint and method are required."
    );
  }

  try {
    const token = await getShiprocketToken();
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };

    const options = {
      method: method.toUpperCase(),
      headers,
    };

    if (payload && (options.method === "POST" || options.method === "PUT")) {
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(`${SHIPROCKET_API_URL}${endpoint}`, options);

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Shiprocket API Error:", responseData);
      throw new functions.https.HttpsError(
        "unknown",
        responseData?.message || "Shiprocket API returned an error"
      );
    }

    return responseData;
  } catch (error) {
    console.error("Shiprocket Proxy Error:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", error.message);
  }
});

exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  const { amount } = data;

  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Valid amount is required."
    );
  }

  // Check if user is authenticated (Optional for this prototype, but good practice)
  // if (!context.auth) {
  //   throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  // }

  try {
    const razorpay = new Razorpay({
      key_id: "rzp_test_TM5arepb23gG9I",
      key_secret: "2fbcu6X8Xkf26eKrPR8RkIGL",
    });

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    };
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    throw new functions.https.HttpsError("internal", "Failed to create Razorpay order.");
  }
});

// Webhook to handle Shadowfax COD Remittance updates
exports.shadowfaxWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const payload = req.body;
  console.log("Shadowfax Webhook received:", JSON.stringify(payload));

  // Verify the event type or ensure it contains remittance info
  // Actual field names depend on Shadowfax's exact webhook schema.
  // Using generic terms commonly found in courier webhooks for demonstration:
  const awbNumber = payload.awb_number || payload.awb;
  const status = payload.status || payload.event_type;
  
  // We're interested in the "remitted" or equivalent final settlement status
  if (status === 'remittance' || status === 'remitted' || payload.remittance_amount) {
    if (!awbNumber) {
      console.warn("Webhook received remittance event but no AWB number found.");
      return res.status(400).send("AWB Number missing");
    }

    try {
      const db = admin.firestore();
      
      // Since awbCode or shadowfaxAwb could be used, we query orders collection
      const ordersRef = db.collection('orders');
      
      // Query by awbCode
      let snapshot = await ordersRef.where('awbCode', '==', awbNumber).limit(1).get();
      
      if (snapshot.empty) {
        // Fallback: Query by shadowfaxAwb just in case
        snapshot = await ordersRef.where('shadowfaxAwb', '==', awbNumber).limit(1).get();
      }

      if (snapshot.empty) {
        console.warn(`No order found with AWB: ${awbNumber}`);
        return res.status(404).send("Order not found for AWB");
      }

      const orderDoc = snapshot.docs[0];
      const amount = payload.remittance_amount || payload.amount || 0;
      const utr = payload.utr_number || payload.utr || "UNKNOWN_UTR";

      await orderDoc.ref.update({
        codRemitted: true,
        remittanceAmount: amount,
        utrNumber: utr,
        remittanceDate: new Date().toISOString()
      });

      console.log(`Successfully updated order ${orderDoc.id} with COD Remittance details.`);
      return res.status(200).send("OK");
    } catch (error) {
      console.error("Error processing Shadowfax webhook:", error);
      return res.status(500).send("Internal Server Error");
    }
  }

  // Acknowledge other events without processing
  return res.status(200).send("Acknowledged");
});

// Webhook to handle Razorpay payment updates
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const payload = req.body;
  const event = payload.event;
  console.log("Razorpay Webhook received:", event);

  try {
    const db = admin.firestore();
    
    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = event === 'order.paid' ? payload.payload.order.entity : payload.payload.payment.entity;
      const orderId = event === 'order.paid' ? paymentEntity.id : paymentEntity.order_id;

      if (orderId) {
        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef.where('razorpayOrderId', '==', orderId).get();
        
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Only update if it's currently pending payment
            if (data.paymentStatus === 'pending') {
              batch.update(doc.ref, {
                paymentStatus: 'paid',
                status: 'processing',
                updatedAt: new Date().toISOString()
              });
            }
          });
          await batch.commit();
          console.log(`Updated orders for Razorpay Order ${orderId} to paid.`);
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      
      if (orderId) {
        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef.where('razorpayOrderId', '==', orderId).get();
        
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach(doc => {
             const data = doc.data();
             if (data.paymentStatus === 'pending') {
               batch.update(doc.ref, {
                 paymentStatus: 'payment_failed',
                 status: 'payment_failed',
                 updatedAt: new Date().toISOString()
               });
             }
          });
          await batch.commit();
          console.log(`Updated orders for Razorpay Order ${orderId} to failed.`);
        }
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing Razorpay webhook:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// --- FINANCE & ACCOUNTS PORTAL ---

// Helper function to update account balance
async function updateAccountBalance(transaction, db, accountId, amount, isDebit) {
  const accountRef = db.collection('chart_of_accounts').doc(accountId);
  const accountDoc = await transaction.get(accountRef);
  if (!accountDoc.exists) {
    throw new Error(`Account ${accountId} does not exist.`);
  }
  
  // For Assets/Expenses, debit increases balance, credit decreases.
  // For Liabilities/Equity/Revenue, credit increases balance, debit decreases.
  const type = accountDoc.data().type;
  let balanceChange = 0;
  
  if (type === 'ASSET' || type === 'EXPENSE') {
    balanceChange = isDebit ? amount : -amount;
  } else {
    balanceChange = isDebit ? -amount : amount;
  }
  
  transaction.update(accountRef, {
    balance: admin.firestore.FieldValue.increment(balanceChange),
    updatedAt: new Date().toISOString()
  });
}

// Automatically create journal entries when an order is delivered
exports.onOrderDelivered = functions.firestore.document('orders/{orderId}').onUpdate(async (change, context) => {
  const newValue = change.after.data();
  const previousValue = change.before.data();
  const orderId = context.params.orderId;

  // We only trigger this once when order is marked as delivered
  if (newValue.status === 'DELIVERED' && previousValue.status !== 'DELIVERED') {
    const db = admin.firestore();
    
    // Calculate values (simplified for prototype)
    const grossAmount = newValue.totalAmount || 0;
    const platformCommission = grossAmount * 0.10; // 10% commission example
    const gstOnCommission = platformCommission * 0.18; // 18% GST on commission
    const netToSeller = grossAmount - platformCommission - gstOnCommission;
    
    // We run a Firestore transaction to ensure atomic double-entry postings
    await db.runTransaction(async (transaction) => {
      const entryRef = db.collection('journal_entries').doc();
      const entryId = entryRef.id;
      const timestamp = new Date().toISOString();
      
      // Create the main Journal Entry
      transaction.set(entryRef, {
        id: entryId,
        referenceType: 'ORDER',
        referenceId: orderId,
        description: `Revenue recognition for Order ${orderId}`,
        status: 'POSTED',
        createdAt: timestamp
      });
      
      // Debit PG Clearing / Accounts Receivable (Asset)
      const debitRef = db.collection('ledger_postings').doc();
      transaction.set(debitRef, {
        id: debitRef.id,
        entryId,
        accountId: 'PG_CLEARING', // Hardcoded for demo, normally dynamic based on payment method
        debitAmount: grossAmount,
        creditAmount: 0,
        createdAt: timestamp
      });
      await updateAccountBalance(transaction, db, 'PG_CLEARING', grossAmount, true);
      
      // Credit Seller Payable (Liability)
      const creditSellerRef = db.collection('ledger_postings').doc();
      transaction.set(creditSellerRef, {
        id: creditSellerRef.id,
        entryId,
        accountId: 'SELLER_PAYABLES',
        debitAmount: 0,
        creditAmount: netToSeller,
        createdAt: timestamp
      });
      await updateAccountBalance(transaction, db, 'SELLER_PAYABLES', netToSeller, false);
      
      // Credit Platform Commission (Revenue)
      const creditCommRef = db.collection('ledger_postings').doc();
      transaction.set(creditCommRef, {
        id: creditCommRef.id,
        entryId,
        accountId: 'COMMISSION_REVENUE',
        debitAmount: 0,
        creditAmount: platformCommission,
        createdAt: timestamp
      });
      await updateAccountBalance(transaction, db, 'COMMISSION_REVENUE', platformCommission, false);
      
      // Credit GST Payable on Commission (Liability)
      const creditGstRef = db.collection('ledger_postings').doc();
      transaction.set(creditGstRef, {
        id: creditGstRef.id,
        entryId,
        accountId: 'GST_OUTPUT',
        debitAmount: 0,
        creditAmount: gstOnCommission,
        createdAt: timestamp
      });
      await updateAccountBalance(transaction, db, 'GST_OUTPUT', gstOnCommission, false);
    });
    console.log(`Journal entry posted for order ${orderId}`);
  }
});

// Callable function to generate a settlement batch for sellers
exports.generatePayoutBatch = functions.https.onCall(async (data, context) => {
  // Enforce accounts_staff role checking
  // if (!context.auth || !context.auth.token.accounts_staff) {
  //   throw new functions.https.HttpsError('permission-denied', 'Only accounts staff can generate payouts');
  // }
  
  const db = admin.firestore();
  
  // Find orders that are delivered or RTO, not yet settled, and past return window (e.g. 7 days)
  // For demo, we just find any 'DELIVERED' or 'RTO' order without a settlementId
  const snapshot = await db.collection('orders')
    .where('status', 'in', ['DELIVERED', 'RTO'])
    // .where('settlementId', '==', null)
    .get();
    
  if (snapshot.empty) {
    return { success: true, message: "No eligible orders for payout.", batchId: null };
  }
  
  const batchId = `BATCH-${Date.now()}`;
  const sellerAggregates = {};
  
  snapshot.docs.forEach(doc => {
    const order = doc.data();
    // Skip if already settled
    if (order.settlementId) return;
    
    const sellerId = order.sellerId || order.businessId; // depends on schema
    if (!sellerId) return;
    
    if (!sellerAggregates[sellerId]) {
      sellerAggregates[sellerId] = {
        sellerId,
        orderIds: [],
        grossSales: 0,
        platformCommission: 0,
        gstOnCommission: 0,
        logisticsDeduction: 0,
        tcsAmount: 0,
        tdsAmount: 0,
      };
    }
    
    let gross = 0;
    let comm = 0;
    let gst = 0;
    let tcs = 0;
    let tds = 0;
    let rtoFee = 0;

    if (order.status === 'DELIVERED') {
      gross = order.totalAmount || 0;
      comm = gross * 0.10;
      gst = comm * 0.18;
      tcs = gross * 0.01;
      tds = gross * 0.001; // 194-O
    } else if (order.status === 'RTO') {
      // Deduct RTO penalty, typically seller doesn't get gross sales for RTO
      rtoFee = 150; 
    }
    
    sellerAggregates[sellerId].orderIds.push(doc.id);
    sellerAggregates[sellerId].grossSales += gross;
    sellerAggregates[sellerId].platformCommission += comm;
    sellerAggregates[sellerId].gstOnCommission += gst;
    sellerAggregates[sellerId].tcsAmount += tcs;
    sellerAggregates[sellerId].tdsAmount += tds;
    sellerAggregates[sellerId].logisticsDeduction += rtoFee;
  });
  
  let count = 0;
  for (const sellerId in sellerAggregates) {
    const agg = sellerAggregates[sellerId];
    agg.netPayout = agg.grossSales 
      - agg.platformCommission 
      - agg.gstOnCommission 
      - agg.logisticsDeduction 
      - agg.tcsAmount 
      - agg.tdsAmount;
      
    agg.batchId = batchId;
    agg.status = 'PENDING';
    agg.createdAt = new Date().toISOString();
    
    const settlementRef = db.collection('seller_settlements').doc();
    agg.id = settlementRef.id;
    
    // Start batch write
    const writeBatch = db.batch();
    writeBatch.set(settlementRef, agg);
    
    // Mark orders as settled
    agg.orderIds.forEach(oId => {
      writeBatch.update(db.collection('orders').doc(oId), { settlementId: agg.id });
    });
    
    await writeBatch.commit();
    count++;
  }
  
  return { success: true, message: `Generated ${count} settlements.`, batchId };
});

// 1. Trigger when a Prepaid Order Payment is successful
exports.onPrepaidOrderPaymentCaptured = functions.firestore.document('orders/{orderId}').onUpdate(async (change, context) => {
  const order = change.after.data();
  const previousOrder = change.before.data();
  const orderId = context.params.orderId;

  // Assuming paymentType is 'prepaid' or 'online'
  if ((order.paymentType === 'prepaid' || order.paymentType === 'online' || order.paymentMode === 'upi' || order.paymentMode === 'card' || order.paymentMode === 'netbanking' || order.paymentMode === 'wallet') &&
      order.paymentStatus === 'paid' && previousOrder.paymentStatus !== 'paid') {
    const db = admin.firestore();
    const grossAmount = order.totalAmount || 0;
    
    await db.runTransaction(async (transaction) => {
      const entryRef = db.collection('journal_entries').doc();
      const entryId = entryRef.id;
      const timestamp = new Date().toISOString();
      
      transaction.set(entryRef, {
        id: entryId,
        referenceType: 'ORDER',
        referenceId: orderId,
        description: `Prepaid Booking Captured for Order ${orderId}`,
        status: 'POSTED',
        createdAt: timestamp
      });
      
      // Debit PG Clearing (Asset)
      const debitRef = db.collection('ledger_postings').doc();
      transaction.set(debitRef, {
        id: debitRef.id,
        entryId,
        accountId: 'PG_CLEARING',
        debitAmount: grossAmount,
        creditAmount: 0,
        createdAt: timestamp
      });
      await updateAccountBalance(transaction, db, 'PG_CLEARING', grossAmount, true);
      
      // Credit Unearned Revenue (Liability)
      const creditRef = db.collection('ledger_postings').doc();
      transaction.set(creditRef, {
        id: creditRef.id,
        entryId,
        accountId: 'UNEARNED_REVENUE',
        debitAmount: 0,
        creditAmount: grossAmount,
        createdAt: timestamp
      });
      await updateAccountBalance(transaction, db, 'UNEARNED_REVENUE', grossAmount, false);
    });
    console.log(`Prepaid booking entry posted for order ${orderId}`);
  }
});

// 2. Trigger when an Order is marked as RTO (Return to Origin)
exports.onOrderRTO = functions.firestore.document('orders/{orderId}').onUpdate(async (change, context) => {
  const newValue = change.after.data();
  const previousValue = change.before.data();
  const orderId = context.params.orderId;

  if (newValue.status === 'RTO' && previousValue.status !== 'RTO') {
    const db = admin.firestore();
    const rtoFee = 150; // Example static RTO penalty fee
    
    await db.runTransaction(async (transaction) => {
      const entryRef = db.collection('journal_entries').doc();
      const entryId = entryRef.id;
      const timestamp = new Date().toISOString();
      
      transaction.set(entryRef, {
        id: entryId,
        referenceType: 'ORDER',
        referenceId: orderId,
        description: `RTO Logistics Fee for Order ${orderId}`,
        status: 'POSTED',
        createdAt: timestamp
      });
      
      // Debit Logistics Expense (Expense)
      const debitRef = db.collection('ledger_postings').doc();
      transaction.set(debitRef, {
        id: debitRef.id,
        entryId,
        accountId: 'LOGISTICS_EXPENSE',
        debitAmount: rtoFee,
        creditAmount: 0,
        createdAt: timestamp
      });
      await updateAccountBalance(transaction, db, 'LOGISTICS_EXPENSE', rtoFee, true);
      
      // Credit Logistics Payable (Liability)
      const creditRef = db.collection('ledger_postings').doc();
      transaction.set(creditRef, {
        id: creditRef.id,
        entryId,
        accountId: 'LOGISTICS_PAYABLE',
        debitAmount: 0,
        creditAmount: rtoFee,
        createdAt: timestamp
      });
      await updateAccountBalance(transaction, db, 'LOGISTICS_PAYABLE', rtoFee, false);
      
      // Phase 3: Secure Inventory Restocking & COD Status update on RTO
      const orderData = newValue;
      if (orderData.items && Array.isArray(orderData.items)) {
         for (const item of orderData.items) {
           const pId = item.product?.id;
           const qty = item.quantity || 1;
           const selectedSize = item.product?.selectedSize;
           if (!pId) continue;
           
           const productRef = db.collection('products').doc(pId);
           const pSnap = await transaction.get(productRef);
           
           if (pSnap.exists) {
             const pData = pSnap.data();
             const pUpdate = {};
             
             if (selectedSize && pData.sizes) {
               const newSizes = pData.sizes.map(sz => 
                 sz.size === selectedSize ? { ...sz, stock: (sz.stock || 0) + qty } : sz
               );
               pUpdate.sizes = newSizes;
             } else {
               pUpdate.stock = admin.firestore.FieldValue.increment(qty);
             }
             transaction.update(productRef, pUpdate);
           }
         }
      }
      
      // Update COD Status if it was COD
      if (orderData.paymentMode === 'cod') {
         transaction.update(change.after.ref, {
            paymentStatus: 'payment_failed',
            codStatus: 'collection_failed',
            updatedAt: timestamp
         });
      }
      
    });
    console.log(`RTO penalty fee entry & inventory restocked for order ${orderId}`);
  }
});

// 3. Trigger when Seller Bank Settlement is Processed
exports.onSettlementProcessed = functions.firestore.document('seller_settlements/{settlementId}').onUpdate(async (change, context) => {
  const newValue = change.after.data();
  const previousValue = change.before.data();
  const settlementId = context.params.settlementId;

  if (newValue.status === 'PROCESSED' && previousValue.status !== 'PROCESSED') {
    const db = admin.firestore();
    const netPayout = newValue.netPayout || 0;
    
    await db.runTransaction(async (transaction) => {
      const entryRef = db.collection('journal_entries').doc();
      const entryId = entryRef.id;
      const timestamp = new Date().toISOString();
      
      transaction.set(entryRef, {
        id: entryId,
        referenceType: 'SETTLEMENT',
        referenceId: settlementId,
        description: `Bank Payout Processed for Settlement ${settlementId}`,
        status: 'POSTED',
        createdAt: timestamp
      });
      
      // Debit Seller Payables (Liability goes down)
      const debitRef = db.collection('ledger_postings').doc();
      transaction.set(debitRef, {
        id: debitRef.id,
        entryId,
        accountId: 'SELLER_PAYABLES',
        debitAmount: netPayout,
        creditAmount: 0,
        createdAt: timestamp
      });
      await updateAccountBalance(transaction, db, 'SELLER_PAYABLES', netPayout, true);
      
      // Credit Main Bank Account (Asset goes down)
      const creditRef = db.collection('ledger_postings').doc();
      transaction.set(creditRef, {
        id: creditRef.id,
        entryId,
        accountId: 'MAIN_BANK_ACCOUNT',
        debitAmount: 0,
        creditAmount: netPayout,
        createdAt: timestamp
      });
      await updateAccountBalance(transaction, db, 'MAIN_BANK_ACCOUNT', netPayout, false);
    });
    console.log(`Bank settlement entry posted for settlement ${settlementId}`);
  }
});

// Phase 3: Refresh Recommendations On-Demand
exports.refreshRecommendations = functions.https.onCall(async (data, context) => {
  const userId = data.userId;
  if (!userId) {
    throw new functions.https.HttpsError("invalid-argument", "userId is required");
  }

  const db = admin.firestore();
  
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return { success: true, recommendedIds: [] };
    
    const user = userDoc.data();
    
    // Fetch user's orders to find categories they buy
    const ordersSnap = await db.collection("orders").where("buyerId", "==", userId).get();
    const boughtCategories = new Set();
    
    ordersSnap.forEach(snap => {
      const order = snap.data();
      if (order.items) {
        order.items.forEach(item => {
          if (item.product && item.product.category) {
            boughtCategories.add(item.product.category);
          }
        });
      }
    });

    const searchKeywords = (user.searchHistory || []).map(s => s.toLowerCase());
    
    // Query products
    // Since this is backend, we can afford a bit heavier query, but still we want to optimize.
    // For simplicity, we fetch products from bought categories or general if none
    let productsQuery;
    if (boughtCategories.size > 0) {
      // get up to 10 categories (Firestore IN query limit)
      const categoriesArray = Array.from(boughtCategories).slice(0, 10);
      productsQuery = db.collection("products").where("category", "in", categoriesArray).limit(50);
    } else {
      productsQuery = db.collection("products").limit(50);
    }
    
    const productsSnap = await productsQuery.get();
    const products = [];
    productsSnap.forEach(snap => {
      products.push({ id: snap.id, ...snap.data() });
    });

    const recommended = products.filter(p => {
      if (user.recentlyViewed && user.recentlyViewed.includes(p.id)) return false;
      
      const inCategory = boughtCategories.has(p.category);
      const matchesSearch = searchKeywords.some(kw => 
        (p.name && p.name.toLowerCase().includes(kw)) || 
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(kw)))
      );
      
      return inCategory || matchesSearch;
    });

    // Fallback if not enough recommendations
    if (recommended.length < 5) {
      const fallbackSnap = await db.collection("products").orderBy("totalSales", "desc").limit(10).get();
      fallbackSnap.forEach(snap => {
        if (!recommended.find(r => r.id === snap.id) && !(user.recentlyViewed && user.recentlyViewed.includes(snap.id))) {
          recommended.push({ id: snap.id, ...snap.data() });
        }
      });
    }

    const finalIds = recommended.slice(0, 15).map(p => p.id);

    // Save to user_recommendations collection
    await db.collection("user_recommendations").doc(userId).set({
      recommendedIds: finalIds,
      updatedAt: new Date().toISOString()
    });

    return { success: true, recommendedIds: finalIds };
  } catch (error) {
    console.error("refreshRecommendations error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// --- CATALOG SETTINGS CDN ---
exports.getCatalogSettingsCDN = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  // Set Cache-Control header for Firebase Hosting CDN
  // Browser caches for 1 hour (3600s), CDN caches for 24 hours (86400s)
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');

  try {
    const db = admin.firestore();
    
    // Fetch all three settings documents concurrently
    const [catDoc, attrDoc, mapDoc] = await Promise.all([
      db.collection('catalog_settings').doc('categories_tree').get(),
      db.collection('catalog_settings').doc('attributes_repository').get(),
      db.collection('catalog_settings').doc('category_mappings').get()
    ]);

    const result = {
      categories: catDoc.exists ? (catDoc.data().categories || []) : [],
      attributes: attrDoc.exists ? (attrDoc.data().attributes || []) : [],
      mappings: mapDoc.exists ? (mapDoc.data().mappings || []) : []
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching catalog settings:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
