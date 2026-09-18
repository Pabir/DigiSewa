import { 
  collection, doc, setDoc, getDoc, getDocs, updateDoc, 
  query, where, deleteDoc, addDoc, limit, startAfter, orderBy, getCountFromServer, getAggregateFromServer, sum, onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Product, Order, Category, Seller, User, SystemAdmin, ReturnItem } from '../types';
import { SupportTicket, SystemSettings } from '../types/adminTypes';

// Mock Initial Products for Hyperlocal E-Commerce Platform Demo
export const INITIAL_MOCK_PRODUCTS: Product[] = [];

export const INITIAL_MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Men Fashion', iconName: 'shirt', color: '#2563EB' },
  { id: 'cat-2', name: 'Women Fashion', iconName: 'shopping-bag', color: '#EC4899' },
  { id: 'cat-3', name: 'Home & Living', iconName: 'home', color: '#10B981' },
  { id: 'cat-4', name: 'Kids & Toys', iconName: 'smile', color: '#F59E0B' },
  { id: 'cat-5', name: 'Personal Care & Wellness', iconName: 'heart', color: '#8B5CF6' },
  { id: 'cat-6', name: 'Mobiles & Tablets', iconName: 'smartphone', color: '#3B82F6' },
  { id: 'cat-7', name: 'Consumer Electronics', iconName: 'tv', color: '#6366F1' },
  { id: 'cat-8', name: 'Appliances', iconName: 'zap', color: '#6366F1' },
  { id: 'cat-9', name: 'Automotive', iconName: 'car', color: '#EF4444' },
  { id: 'cat-10', name: 'Beauty & Personal Care', iconName: 'sparkles', color: '#D946EF' },
  { id: 'cat-11', name: 'Home Utility', iconName: 'wrench', color: '#059669' },
  { id: 'cat-12', name: 'Kids', iconName: 'baby', color: '#F43F5E' },
  { id: 'cat-13', name: 'Grocery', iconName: 'apple', color: '#16A34A' },
  { id: 'cat-14', name: 'Women', iconName: 'user', color: '#F472B6' },
  { id: 'cat-15', name: 'Home & Kitchen', iconName: 'coffee', color: '#84CC16' },
  { id: 'cat-16', name: 'Health & Wellness', iconName: 'activity', color: '#06B6D4' },
  { id: 'cat-17', name: 'Beauty & Makeup', iconName: 'feather', color: '#E11D48' },
  { id: 'cat-18', name: 'Personal Care', iconName: 'shield', color: '#0284C7' },
  { id: 'cat-19', name: "Men'S Grooming", iconName: 'scissors', color: '#1D4ED8' },
  { id: 'cat-20', name: 'Craft & Office Supplies', iconName: 'box', color: '#D97706' },
  { id: 'cat-21', name: 'Sports & Fitness', iconName: 'dribbble', color: '#4F46E5' },
  { id: 'cat-22', name: 'Automotive Accessories', iconName: 'disc', color: '#64748B' },
  { id: 'cat-23', name: 'Pet Supplies', iconName: 'dog', color: '#A855F7' },
  { id: 'cat-24', name: 'Office Supplies & Stationery', iconName: 'paperclip', color: '#475569' },
  { id: 'cat-25', name: 'Industrial & Scientific Products', iconName: 'cpu', color: '#0F172A' },
  { id: 'cat-26', name: 'Musical Instruments', iconName: 'music', color: '#7C3AED' },
  { id: 'cat-27', name: 'Books', iconName: 'book', color: '#B45309' },
  { id: 'cat-28', name: 'Eye Utility', iconName: 'eye', color: '#0EA5E9' },
  { id: 'cat-29', name: 'Bags, Luggage & Travel Accessories', iconName: 'briefcase', color: '#4338CA' },
  { id: 'cat-30', name: 'Mens Personal Care & Grooming', iconName: 'user-check', color: '#2563EB' },
];

export const INITIAL_MOCK_ORDERS: Order[] = [];

// In-Memory Fallback State for dynamic updates during session
let localProducts: Product[] = [...INITIAL_MOCK_PRODUCTS];
let localOrders: Order[] = [...INITIAL_MOCK_ORDERS];

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  shiprocketEnabled: true,
  shadowfaxEnabled: true,
  maintenanceWarningEnabled: false,
};

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const docRef = doc(db, 'system', 'config');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_SYSTEM_SETTINGS, ...docSnap.data() } as SystemSettings;
    } else {
      await setDoc(docRef, DEFAULT_SYSTEM_SETTINGS);
      return DEFAULT_SYSTEM_SETTINGS;
    }
  } catch (err) {
    console.warn('Failed to fetch system settings, using default', err);
    return DEFAULT_SYSTEM_SETTINGS;
  }
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
  try {
    const docRef = doc(db, 'system', 'config');
    await updateDoc(docRef, settings);
  } catch (err) {
    console.error('Failed to update system settings', err);
    throw err;
  }
}

export function listenToSystemSettings(callback: (settings: SystemSettings) => void): () => void {
  const docRef = doc(db, 'system', 'config');
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ ...DEFAULT_SYSTEM_SETTINGS, ...docSnap.data() } as SystemSettings);
    } else {
      callback(DEFAULT_SYSTEM_SETTINGS);
    }
  }, (err) => {
    console.warn('Failed to listen to system settings', err);
    callback(DEFAULT_SYSTEM_SETTINGS);
  });
  return unsubscribe;
}

/**
 * Fetch all products from Firestore with fallback to mock data
 */
/**
 * Fetch products from Firestore with optional filtering for only approved sellers
 */
export async function getProducts(onlyApproved: boolean = false, sellerId?: string): Promise<Product[]> {
  let allProducts: Product[] = [];

  try {
    let q = collection(db, 'products') as any;
    if (sellerId) {
      q = query(q, where('sellerId', '==', sellerId));
    }
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data() as any;
        let imageUrl = data.imageUrl;
        let title = data.title;
        allProducts.push({ ...data, id: docSnap.id, imageUrl } as Product);
      });
    } else {
      allProducts = localProducts;
    }
  } catch (err) {
    console.warn('Firestore fetch products failed/offline, using in-memory state:', err);
    allProducts = localProducts;
    if (sellerId) {
      allProducts = allProducts.filter(p => p.sellerId === sellerId);
    }
  }

  if (onlyApproved) {
    const sellers = await getSellersFromFirestore();
    const unapprovedSellerIds = new Set(
      sellers.filter(s => s.verificationStatus && s.verificationStatus !== 'verified').map(s => s.id)
    );
    return allProducts.filter(p => !unapprovedSellerIds.has(p.sellerId));
  }

  return allProducts;
}

/**
 * Add a new product to Firestore / local state (Validates Seller Status)
 */
export async function addProduct(
  product: Omit<Product, 'id' | 'createdAt'>,
  sellerVerificationStatus?: string
): Promise<Product> {
  if (sellerVerificationStatus && sellerVerificationStatus !== 'verified') {
    const msg =
      sellerVerificationStatus === 'rejected'
        ? '❌ Account Rejected: Your seller application was rejected by Admin. You cannot add products.'
        : sellerVerificationStatus === 'suspended'
        ? '⚠️ Account Suspended: Your seller account has been suspended by Admin.'
        : '⏳ Approval Pending: Your seller account is awaiting Admin approval. You cannot add or sell products until approved by Admin.';
    alert(msg);
    throw new Error(msg);
  }

  const docRef = doc(collection(db, 'products'));
  const newProduct: Product = {
    ...product,
    id: docRef.id,
    createdAt: new Date().toISOString(),
  };

  const cleanProductData = JSON.parse(JSON.stringify(newProduct));

  try {
    await Promise.race([
      setDoc(docRef, cleanProductData),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 10000))
    ]);
    console.log('✅ Successfully published catalog to Firestore with ID:', docRef.id);
  } catch (err: any) {
    console.error('❌ Firestore addProduct error:', err);
    throw err;
  }

  localProducts.unshift(newProduct);
  return newProduct;
}

  /**
   * Update an existing product in Firestore / local state
   */
  export async function updateProduct(
    productId: string,
    updatedData: Partial<Product>
  ): Promise<void> {
    try {
      const cleanData = JSON.parse(JSON.stringify(updatedData));
      const docRef = doc(db, 'products', productId);
      await updateDoc(docRef, cleanData);
      console.log('✅ Successfully updated catalog in Firestore with ID:', productId);
    } catch (err: any) {
      console.error('❌ Firestore updateProduct error:', err);
      alert(
        `⚠️ Firestore Update Error: ${err?.message || err}\n\nCode: ${err?.code || 'unknown'}`
      );
    }
  
    // Update local state
    const index = localProducts.findIndex(p => p.id === productId);
    if (index !== -1) {
      localProducts[index] = { ...localProducts[index], ...updatedData };
    }
  }

  /**
   * Get all categories
   */
export async function getCategories(): Promise<Category[]> {
  try {
    const q = collection(db, 'categories');
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const cats: Category[] = [];
      querySnapshot.forEach(docSnap => {
        cats.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });
      return cats;
    }
  } catch (err) {
    console.warn('Firestore fetch categories failed/offline, using mock data:', err);
  }
  return INITIAL_MOCK_CATEGORIES;
}

/**
 * Fetch orders for Seller / Buyer
 */
export async function getOrders(sellerId?: string): Promise<Order[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));
    if (!querySnapshot.empty) {
      let orders: Order[] = [];
      querySnapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });
      if (sellerId) {
        orders = orders.filter(order => order.items.some(item => item.product.sellerId === sellerId));
      }
      return orders;
    }
  } catch (err) {
    console.warn('Firestore fetch orders offline, returning local orders');
  }
  if (sellerId) {
    return localOrders.filter(order => order.items.some(item => item.product.sellerId === sellerId));
  }
  return localOrders;
}

/**
 * Update order status (Pending -> Processing -> Out for Delivery -> Delivered)
 */
export async function updateOrderStatus(orderId: string, newStatus: Order['status'], additionalData?: Partial<Order>): Promise<void> {
  const orderIndex = localOrders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    localOrders[orderIndex].status = newStatus;
    if (additionalData) {
      Object.assign(localOrders[orderIndex], additionalData);
    }
  }

  try {
    const orderRef = doc(db, 'orders', orderId);
    const updatePayload: any = { status: newStatus };
    if (additionalData) {
      Object.assign(updatePayload, additionalData);
    }
    const cleanUpdatePayload = JSON.parse(JSON.stringify(updatePayload));
    await updateDoc(orderRef, cleanUpdatePayload);
  } catch (err) {
    console.warn('Firestore update order status offline');
  }

  // Handle RTO Penalty for Cancellations
  if (newStatus === 'cancelled') {
    try {
      const { chargeRTOPenalty } = await import('./settlementService');
      let orderToCancel: Order | undefined;

      if (orderIndex !== -1) {
        orderToCancel = localOrders[orderIndex];
      } else {
        // Fetch from Firestore if not in localOrders
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../config/firebaseConfig');
        const orderRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(orderRef);
        if (docSnap.exists()) {
          orderToCancel = { id: docSnap.id, ...docSnap.data() } as Order;
        }
      }

      if (orderToCancel) {
        await chargeRTOPenalty(orderToCancel);
      } else {
        console.warn('Order not found for RTO penalty deduction');
      }
    } catch (err) {
      console.warn('Failed to charge RTO penalty on cancellation', err);
    }
  }
}

/**
 * Create new Order
 */
export async function createOrder(newOrder: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  const created: Order = {
    ...newOrder,
    id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
    createdAt: new Date().toISOString(),
  };

  localOrders.unshift(created);

  try {
    const cleanOrderData = JSON.parse(JSON.stringify(created));
    await setDoc(doc(db, 'orders', created.id), cleanOrderData);
  } catch (err) {
    console.warn('Firestore create order offline', err);
  }

  return created;
}

/**
 * UTILITY: Wipe all orders from Firestore (for cleaning up dummy data)
 */
export async function wipeAllOrders(): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));
    const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, 'orders', docSnap.id)));
    await Promise.all(deletePromises);
    console.log('✅ Wiped all orders from Firestore');
  } catch (err) {
    console.error('❌ Error wiping orders:', err);
  }
  localOrders.length = 0; // Clear local array too
}

/**
 * UTILITY: Wipe all products from Firestore (for cleaning up dummy data)
 */
export async function wipeAllProducts(): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, 'products', docSnap.id)));
    await Promise.all(deletePromises);
    console.log('✅ Wiped all products from Firestore');
  } catch (err) {
    console.error('❌ Error wiping products:', err);
  }
  localProducts.length = 0;
}

// In-Memory Fallback for Sellers
let localSellers: Seller[] = [];

/**
 * Save / Update Seller Application Profile in Firestore
 */
export async function saveSellerToFirestore(seller: Seller): Promise<Seller> {
  // Sanitize undefined fields for Firestore compatibility
  const cleanSellerData = JSON.parse(JSON.stringify(seller));

  try {
    const sellerRef = doc(db, 'sellers', seller.id);
    await setDoc(sellerRef, cleanSellerData, { merge: true });
    console.log('✅ Successfully saved seller details to Firestore sellers collection:', seller.id);
  } catch (err: any) {
    console.error('❌ Firestore saveSeller error:', err);
  }

  // Update in-memory fallback list
  const existingIdx = localSellers.findIndex(s => s.id === seller.id);
  if (existingIdx !== -1) {
    localSellers[existingIdx] = seller;
  } else {
    localSellers.push(seller);
  }

  return seller;
}

/**
 * Fetch all Sellers from Firestore with fallback to local state
 */
export async function getSellersFromFirestore(): Promise<Seller[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'sellers'));
    if (!querySnapshot.empty) {
      const sellers: Seller[] = [];
      querySnapshot.forEach(docSnap => {
        sellers.push({ id: docSnap.id, ...docSnap.data() } as Seller);
      });
      localSellers = sellers;
      return sellers;
    }
  } catch (err) {
    console.warn('Firestore fetch sellers failed/offline, returning local sellers:', err);
  }
  return localSellers;
}

/**
 * Update Seller GST Details in Firestore
 */
export async function updateSellerGstInFirestore(
  sellerId: string,
  updatePayload: Partial<Seller>
): Promise<void> {
  const sellerIdx = localSellers.findIndex(s => s.id === sellerId);
  if (sellerIdx !== -1) {
    localSellers[sellerIdx] = { ...localSellers[sellerIdx], ...updatePayload };
  }

  try {
    const sellerRef = doc(db, 'sellers', sellerId);
    await updateDoc(sellerRef, updatePayload);
    console.log(`✅ Updated seller ${sellerId} GST details in Firestore`);
  } catch (err) {
    console.warn('Firestore update seller GST offline/error:', err);
  }
}

/**
 * Update Seller Verification Status (Pending -> Verified / Rejected / Suspended)
 */
export async function updateSellerStatusInFirestore(
  sellerId: string,
  verificationStatus: Seller['verificationStatus'],
  rejectionReason?: string
): Promise<void> {
  const sellerIdx = localSellers.findIndex(s => s.id === sellerId);
  if (sellerIdx !== -1) {
    localSellers[sellerIdx].verificationStatus = verificationStatus;
    if (rejectionReason) {
      localSellers[sellerIdx].rejectionReason = rejectionReason;
    }
  }

  try {
    const sellerRef = doc(db, 'sellers', sellerId);
    const updatePayload: any = { verificationStatus };
    if (rejectionReason) updatePayload.rejectionReason = rejectionReason;
    await updateDoc(sellerRef, updatePayload);
    console.log(`✅ Updated seller ${sellerId} status to ${verificationStatus} in Firestore`);
  } catch (err) {
    console.warn('Firestore update seller status offline/error:', err);
  }
}

/**
 * Update Seller E-Signature in Firestore
 */
export async function updateSellerSignatureInFirestore(
  sellerId: string,
  signature: { text?: string; url?: string }
): Promise<void> {
  const sellerIdx = localSellers.findIndex(s => s.id === sellerId);
  if (sellerIdx !== -1) {
    if (signature.text !== undefined) localSellers[sellerIdx].eSignatureText = signature.text;
    if (signature.url !== undefined) localSellers[sellerIdx].eSignatureUrl = signature.url;
  }

  try {
    const sellerRef = doc(db, 'sellers', sellerId);
    const updatePayload: any = {};
    if (signature.text !== undefined) updatePayload.eSignatureText = signature.text;
    if (signature.url !== undefined) updatePayload.eSignatureUrl = signature.url;
    await updateDoc(sellerRef, updatePayload);
    console.log(`✅ Updated seller ${sellerId} E-Signature in Firestore`);
  } catch (err) {
    console.warn('Firestore update seller signature offline/error:', err);
  }
}

/**
 * Update Seller Password in Firestore
 */
export async function updateSellerPasswordInFirestore(
  sellerId: string,
  newPassword: string
): Promise<void> {
  const sellerIdx = localSellers.findIndex(s => s.id === sellerId);
  if (sellerIdx !== -1) {
    localSellers[sellerIdx].password = newPassword;
  }

  try {
    const sellerRef = doc(db, 'sellers', sellerId);
    await updateDoc(sellerRef, { password: newPassword });
    console.log(`✅ Updated seller ${sellerId} password in Firestore`);
  } catch (err) {
    console.warn('Firestore update seller password offline/error:', err);
  }
}

let localUsers: User[] = [];

/**
 * Save User profile to Firestore
 */
export async function saveUserToFirestore(user: User): Promise<User> {
  const cleanUserData = JSON.parse(JSON.stringify(user));
  try {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, cleanUserData, { merge: true });
    console.log('✅ User saved to Firestore:', user.id);
  } catch (err) {
    console.warn('Firestore save user offline/error:', err);
  }
  const idx = localUsers.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    localUsers[idx] = user;
  } else {
    localUsers.push(user);
  }
  return user;
}

/**
 * Update specific fields of a User profile in Firestore
 */
export async function updateUserFieldsInFirestore(userId: string, fields: Partial<User>): Promise<void> {
  const cleanFields = JSON.parse(JSON.stringify(fields));
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, cleanFields, { merge: true });
    console.log('✅ User fields updated in Firestore:', userId);
  } catch (err) {
    console.warn('Firestore update fields offline/error:', err);
  }
  const idx = localUsers.findIndex(u => u.id === userId);
  if (idx !== -1) {
    localUsers[idx] = { ...localUsers[idx], ...fields };
  } else {
    localUsers.push({ id: userId, role: 'customer', ...fields } as User);
  }
}

/**
 * Fetch all Users from Firestore
 */
export async function getUsersFromFirestore(): Promise<User[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    if (!querySnapshot.empty) {
      const users: User[] = [];
      querySnapshot.forEach(docSnap => {
        users.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
      localUsers = users;
      return users;
    }
  } catch (err) {
    console.warn('Firestore fetch users offline/error:', err);
  }
  return localUsers;
}

/**
 * Fetch Single User from Firestore
 */
export async function getUsersPaginated(lastVisibleDoc?: any, pageSize: number = 20): Promise<{ users: User[], lastDoc: any }> {
  let usersList: User[] = [];
  let lastDoc: any = null;
  try {
    let q = query(collection(db, 'users'), limit(pageSize));
    if (lastVisibleDoc) {
      q = query(collection(db, 'users'), startAfter(lastVisibleDoc), limit(pageSize));
    }
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      querySnapshot.forEach(docSnap => {
        usersList.push({ id: docSnap.id, ...(docSnap.data() as any) } as User);
      });
    }
  } catch (err) {
    console.warn('Firestore fetch users paginated failed:', err);
  }
  return { users: usersList, lastDoc };
}

export async function getUserFromFirestore(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
  } catch (err) {
    console.warn('Firestore fetch single user offline/error:', err);
  }
  const localUser = localUsers.find(u => u.id === userId);
  return localUser || null;
}

/**
 * Record a user's search term (caps at 15 items)
 */
export async function recordSearchHistory(userId: string, searchTerm: string): Promise<void> {
  if (!searchTerm.trim()) return;
  const user = await getUserFromFirestore(userId);
  if (user) {
    let history = user.searchHistory || [];
    // Remove if exists to push to front
    history = history.filter(term => term.toLowerCase() !== searchTerm.toLowerCase());
    history.unshift(searchTerm.trim());
    if (history.length > 15) history = history.slice(0, 15);
    await updateUserFieldsInFirestore(userId, { searchHistory: history });
  }
}

/**
 * Record a user's viewed product (caps at 15 items)
 */
export async function recordProductView(userId: string, productId: string): Promise<void> {
  if (!productId) return;
  const user = await getUserFromFirestore(userId);
  if (user) {
    let viewed = user.recentlyViewed || [];
    // Remove if exists to push to front
    viewed = viewed.filter(id => id !== productId);
    viewed.unshift(productId);
    if (viewed.length > 15) viewed = viewed.slice(0, 15);
    await updateUserFieldsInFirestore(userId, { recentlyViewed: viewed });
  }
}

/**
 * Fetch Recommended and Recently Viewed Products for a User
 */
export async function getRecommendedProducts(userId: string): Promise<{ recommended: Product[], recentlyViewedProducts: Product[] }> {
  const user = await getUserFromFirestore(userId);
  if (!user) return { recommended: [], recentlyViewedProducts: [] };

  const allProducts = await getProducts();
  let recommended: Product[] = [];
  let recentlyViewedProducts: Product[] = [];

  // Get recently viewed products
  if (user.recentlyViewed && user.recentlyViewed.length > 0) {
    recentlyViewedProducts = user.recentlyViewed
      .map(id => allProducts.find(p => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }

  // Build recommended based on search history and past orders
  const searchKeywords = (user.searchHistory || []).map(s => s.toLowerCase());
  const userOrders = await getOrders();
  const myOrders = userOrders.filter(o => o.buyerId === userId);
  
  const boughtCategories = new Set<string>();
  myOrders.forEach(o => {
    o.items.forEach(item => boughtCategories.add(item.product.category));
  });

  recommended = allProducts.filter(p => {
    // Avoid recommending recently viewed as new recommendations
    if (user.recentlyViewed?.includes(p.id)) return false;

    // Match category of past purchases
    if (boughtCategories.has(p.category)) return true;

    // Match search keywords in title, category, or tags
    const titleLower = p.title.toLowerCase();
    const catLower = p.category.toLowerCase();
    return searchKeywords.some(keyword => 
      titleLower.includes(keyword) || 
      catLower.includes(keyword) || 
      p.tags?.some(t => t.toLowerCase().includes(keyword))
    );
  });

  // Limit recommendations, pick top rated
  recommended = recommended.sort((a, b) => b.rating - a.rating).slice(0, 15);

  return { recommended, recentlyViewedProducts };
}

/**
 * Save Support Ticket to Firestore
 */
export async function createSupportTicketInFirestore(ticket: SupportTicket): Promise<SupportTicket> {
  const cleanTicketData = JSON.parse(JSON.stringify(ticket));
  try {
    const ticketRef = doc(db, 'support_tickets', ticket.id);
    await setDoc(ticketRef, cleanTicketData, { merge: true });
    console.log('✅ Support ticket saved to Firestore:', ticket.id);
  } catch (err) {
    console.warn('Firestore create ticket error:', err);
  }
  return ticket;
}

/**
 * Fetch Support Tickets from Firestore
 */
export async function getSupportTicketsFromFirestore(): Promise<SupportTicket[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'support_tickets'));
    if (!querySnapshot.empty) {
      const tickets: SupportTicket[] = [];
      querySnapshot.forEach(docSnap => {
        tickets.push({ id: docSnap.id, ...docSnap.data() } as SupportTicket);
      });
      return tickets;
    }
  } catch (err) {
    console.warn('Firestore fetch tickets error:', err);
  }
  return [];
}

/**
 * Save SystemAdmin to Firestore
 */
export async function saveAdminToFirestore(admin: SystemAdmin): Promise<SystemAdmin> {
  const cleanAdminData = JSON.parse(JSON.stringify(admin));
  try {
    const adminRef = doc(db, 'admins', admin.id);
    await setDoc(adminRef, cleanAdminData, { merge: true });
    console.log('✅ Admin saved to Firestore:', admin.id);
  } catch (err) {
    console.warn('Firestore save admin offline/error:', err);
  }
  return admin;
}

/**
 * Fetch all SystemAdmins from Firestore
 */
export async function getAdminsFromFirestore(): Promise<SystemAdmin[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'admins'));
    if (!querySnapshot.empty) {
      const admins: SystemAdmin[] = [];
      querySnapshot.forEach(docSnap => {
        admins.push({ id: docSnap.id, ...docSnap.data() } as SystemAdmin);
      });
      return admins;
    }
  } catch (err) {
    console.warn('Firestore fetch admins offline/error:', err);
  }
  return [];
}

/**
 * Save Return Item to Firestore
 */
export async function saveReturnToFirestore(returnItem: ReturnItem): Promise<ReturnItem> {
  const cleanReturnData = JSON.parse(JSON.stringify(returnItem));
  try {
    const returnRef = doc(db, 'returns', returnItem.id);
    await setDoc(returnRef, cleanReturnData, { merge: true });
    console.log('✅ Return saved to Firestore:', returnItem.id);
  } catch (err) {
    console.warn('Firestore save return offline/error:', err);
  }
  return returnItem;
}

/**
 * Create a new Return Request from a buyer
 */
export async function createReturnRequest(returnItem: Omit<ReturnItem, 'id'>): Promise<string> {
  try {
    const docRef = doc(collection(db, 'returns'));
    const newReturn: ReturnItem = {
      ...returnItem,
      id: docRef.id
    };
    
    const cleanReturnData = JSON.parse(JSON.stringify(newReturn));
    await setDoc(docRef, cleanReturnData);
    
    // Update the original order's returnStatus
    const orderRef = doc(db, 'orders', returnItem.orderId);
    await updateDoc(orderRef, { returnStatus: 'requested' });
    
    console.log('✅ Created Return Request in Firestore:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating return request", error);
    throw error;
  }
}

/**
 * Approve a Return Request and trigger Shadowfax Reverse Pickup
 */
export async function approveReturnRequest(returnId: string): Promise<string> {
  try {
    const returnRef = doc(db, 'returns', returnId);
    const returnSnap = await getDoc(returnRef);
    if (!returnSnap.exists()) {
      throw new Error("Return request not found");
    }
    const returnItem = returnSnap.data() as ReturnItem;

    const orderRef = doc(db, 'orders', returnItem.orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      throw new Error("Associated order not found");
    }
    const order = { id: orderSnap.id, ...orderSnap.data() } as Order;

    const sellerRef = doc(db, 'sellers', returnItem.sellerId || '');
    const sellerSnap = await getDoc(sellerRef);
    if (!sellerSnap.exists()) {
      throw new Error("Seller not found");
    }
    const seller = sellerSnap.data() as Seller;

    // Trigger Shadowfax Reverse Pickup Request
    const { createShadowfaxReversePickupRequest } = await import('./shadowfaxService');
    const result = await createShadowfaxReversePickupRequest(returnItem, order, seller);
    
    if (result?.awb_number) {
      await updateDoc(returnRef, { 
        status: 'approved',
        awbNumber: result.awb_number 
      });
      await updateDoc(orderRef, { returnStatus: 'approved' });
      return result.awb_number;
    } else {
      throw new Error("Failed to create Shadowfax reverse pickup request");
    }
  } catch (error) {
    console.error("Error approving return request:", error);
    throw error;
  }
}

/**
 * Fetch all Returns from Firestore
 */
export async function getReturnsFromFirestore(sellerId?: string): Promise<ReturnItem[]> {
  try {
    const q = collection(db, 'returns');
    const querySnapshot = await getDocs(q);
    let returns: ReturnItem[] = [];
    if (!querySnapshot.empty) {
      querySnapshot.forEach(docSnap => {
        returns.push({ id: docSnap.id, ...(docSnap.data() as any) } as ReturnItem);
      });
    }

    // Synthesize returns from cancelled orders if they are not explicitly in the returns collection
    const allOrders = await getOrders(sellerId);
    const returnedOrders = allOrders.filter(o => o.status === 'cancelled' || (o as any).status === 'returned' || (o as any).status === 'rto');
    
    returnedOrders.forEach(order => {
      if (!returns.some(r => r.orderId === order.id)) {
        const sellerItems = sellerId ? order.items.filter(i => i.product.sellerId === sellerId) : order.items;
        if (sellerItems.length > 0) {
          const productNames = sellerItems.map(i => i.product.title).join(', ');
          returns.push({
            id: `RET-${order.id}`,
            orderId: order.id,
            sellerId: sellerItems[0].product.sellerId,
            productName: productNames,
            returnReason: 'Customer Cancellation / RTO',
            customerName: order.buyerName,
            status: 'rto_in_transit', // Default synthetic status
            returnDate: new Date().toISOString().split('T')[0],
            amount: sellerItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0)
          });
        }
      }
    });

    if (sellerId) {
      const sellerOrderIds = new Set(allOrders.map(o => o.id));
      returns = returns.filter(r => r.sellerId === sellerId || sellerOrderIds.has(r.orderId));
    }

    return returns;
  } catch (err) {
    console.warn('Firestore fetch returns offline/error:', err);
  }
  return [];
}

/**
 * Fetch Paginated Products
 */
export async function getProductsPaginated(sellerId?: string, lastVisibleDoc?: any, pageSize: number = 20): Promise<{ products: Product[], lastDoc: any }> {
  let products: Product[] = [];
  let lastDoc: any = null;
  try {
    let q;
    if (sellerId) {
      q = query(collection(db, 'products'), where('sellerId', '==', sellerId), limit(pageSize));
      if (lastVisibleDoc) {
        q = query(collection(db, 'products'), where('sellerId', '==', sellerId), startAfter(lastVisibleDoc), limit(pageSize));
      }
    } else {
      q = query(collection(db, 'products'), limit(pageSize));
      if (lastVisibleDoc) {
        q = query(collection(db, 'products'), startAfter(lastVisibleDoc), limit(pageSize));
      }
    }
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      querySnapshot.forEach(docSnap => {
        products.push({ id: docSnap.id, ...(docSnap.data() as any) } as Product);
      });
    }
  } catch (err) {
    console.warn('Firestore fetch products paginated failed:', err);
  }
  return { products, lastDoc };
}

/**
 * Fetch Paginated Orders
 */
export async function getOrdersPaginated(sellerId?: string, status?: string, lastVisibleDoc?: any, pageSize: number = 20): Promise<{ orders: Order[], lastDoc: any }> {
  let orders: Order[] = [];
  let lastDoc: any = null;
  try {
    if (sellerId || status) {
      // Local sorting and filtering to avoid complex composite index/array constraints
      const q = query(collection(db, 'orders'));
      const querySnapshot = await getDocs(q);
      
      let allOrders: Order[] = [];
      querySnapshot.forEach(docSnap => {
        allOrders.push({ id: docSnap.id, ...(docSnap.data() as any) } as Order);
      });
      
      // Filter locally
      if (sellerId) {
        allOrders = allOrders.filter(order => order.items.some(item => item.product.sellerId === sellerId));
      }
      if (status) {
        allOrders = allOrders.filter(order => (order.status as any) === status || order.fulfillmentStatus === status);
      }
      
      allOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      let startIndex = typeof lastVisibleDoc === 'number' ? lastVisibleDoc : 0;
      orders = allOrders.slice(startIndex, startIndex + pageSize);
      lastDoc = startIndex + pageSize < allOrders.length ? startIndex + pageSize : null;
    } else {
      let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(pageSize));
      if (lastVisibleDoc && typeof lastVisibleDoc !== 'number') {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), startAfter(lastVisibleDoc), limit(pageSize));
      }
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        querySnapshot.forEach(docSnap => {
          orders.push({ id: docSnap.id, ...(docSnap.data() as any) } as Order);
        });
      }
    }
  } catch (err) {
    console.warn('Firestore fetch orders paginated failed:', err);
  }
  return { orders, lastDoc };
}

/**
 * Fetch Paginated Sellers
 */
export async function getSellersPaginated(lastVisibleDoc?: any, pageSize: number = 20): Promise<{ sellers: Seller[], lastDoc: any }> {
  let sellers: Seller[] = [];
  let lastDoc: any = null;
  try {
    let q = query(collection(db, 'sellers'), limit(pageSize));
    if (lastVisibleDoc) {
      q = query(collection(db, 'sellers'), startAfter(lastVisibleDoc), limit(pageSize));
    }
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      querySnapshot.forEach(docSnap => {
        sellers.push({ id: docSnap.id, ...(docSnap.data() as any) } as Seller);
      });
    }
  } catch (err) {
    console.warn('Firestore fetch sellers paginated failed:', err);
  }
  return { sellers, lastDoc };
}

/**
 * Fetch Paginated Support Tickets
 */
export async function getSupportTicketsPaginated(type?: 'seller' | 'customer', lastVisibleDoc?: any, pageSize: number = 20): Promise<{ tickets: any[], lastDoc: any }> {
  let tickets: any[] = [];
  let lastDoc: any = null;
  try {
    let q = query(collection(db, 'support_tickets'), limit(pageSize));
    if (type) {
      q = query(collection(db, 'support_tickets'), where('ticketType', '==', type), limit(pageSize));
      if (lastVisibleDoc) {
        q = query(collection(db, 'support_tickets'), where('ticketType', '==', type), startAfter(lastVisibleDoc), limit(pageSize));
      }
    } else {
      if (lastVisibleDoc) {
        q = query(collection(db, 'support_tickets'), startAfter(lastVisibleDoc), limit(pageSize));
      }
    }
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      querySnapshot.forEach(docSnap => {
        tickets.push({ id: docSnap.id, ...docSnap.data() });
      });
    }
  } catch (err) {
    console.warn('Firestore fetch tickets paginated failed:', err);
  }
  return { tickets, lastDoc };
}

/**
 * Fetch Paginated Returns
 */
export async function getReturnsPaginated(sellerId?: string, status?: string, lastVisibleDoc?: any, pageSize: number = 20): Promise<{ returns: ReturnItem[], lastDoc: any }> {
  let returns: ReturnItem[] = [];
  let lastDoc: any = null;
  try {
    const constraints: any[] = [];
    if (sellerId) constraints.push(where('sellerId', '==', sellerId));
    if (status) constraints.push(where('status', '==', status));
    
    if (constraints.length > 0) {
      // Local sorting to avoid composite index requirement
      const q = query(collection(db, 'returns'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      let allReturns: ReturnItem[] = [];
      querySnapshot.forEach(docSnap => {
        allReturns.push({ id: docSnap.id, ...(docSnap.data() as any) } as ReturnItem);
      });
      
      allReturns.sort((a, b) => new Date(b.returnDate || 0).getTime() - new Date(a.returnDate || 0).getTime());
      
      let startIndex = typeof lastVisibleDoc === 'number' ? lastVisibleDoc : 0;
      returns = allReturns.slice(startIndex, startIndex + pageSize);
      lastDoc = startIndex + pageSize < allReturns.length ? startIndex + pageSize : null;
    } else {
      let q = query(collection(db, 'returns'), orderBy('returnDate', 'desc'), limit(pageSize));
      if (lastVisibleDoc && typeof lastVisibleDoc !== 'number') {
        q = query(collection(db, 'returns'), orderBy('returnDate', 'desc'), startAfter(lastVisibleDoc), limit(pageSize));
      }
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        querySnapshot.forEach(docSnap => {
          returns.push({ id: docSnap.id, ...(docSnap.data() as any) } as ReturnItem);
        });
      }
    }
  } catch (err) {
    console.warn('Firestore fetch returns paginated failed:', err);
  }
  return { returns, lastDoc };
}

/**
 * Fetch Admin Dashboard Metrics
 */
export async function getAdminDashboardMetrics() {
  try {
    const totalCustomersCount = (await getCountFromServer(query(collection(db, 'users'), where('role', 'in', ['customer', 'buyer', 'guest'])))).data().count;
    const activeSellersCount = (await getCountFromServer(query(collection(db, 'sellers'), where('verificationStatus', '==', 'verified')))).data().count;
    const pendingSellersCount = (await getCountFromServer(query(collection(db, 'sellers'), where('verificationStatus', '==', 'pending')))).data().count;
    const openSellerTicketsCount = (await getCountFromServer(query(collection(db, 'support_tickets'), where('ticketType', '==', 'seller'), where('status', 'in', ['open', 'in_progress'])))).data().count;
    const openCustomerTicketsCount = (await getCountFromServer(query(collection(db, 'support_tickets'), where('ticketType', '==', 'customer'), where('status', 'in', ['open', 'in_progress'])))).data().count;
    
    let totalRevenue = 0;
    try {
      const revSnapshot = await getAggregateFromServer(collection(db, 'sellers'), {
        totalSales: sum('totalSales')
      });
      totalRevenue = revSnapshot.data().totalSales || 0;
    } catch (e) {}

    return {
      totalCustomersCount,
      activeSellersCount,
      pendingSellersCount,
      openSellerTicketsCount,
      openCustomerTicketsCount,
      totalRevenue
    };
  } catch (err) {
    console.warn('Firestore fetch dashboard metrics failed:', err);
    return {
      totalCustomersCount: 0,
      activeSellersCount: 0,
      pendingSellersCount: 0,
      openSellerTicketsCount: 0,
      openCustomerTicketsCount: 0,
      totalRevenue: 0
    };
  }
}

export async function updateReturnRequest(returnId: string, updates: Partial<ReturnItem>): Promise<void> {
  try {
    const returnRef = doc(db, 'returns', returnId);
    await updateDoc(returnRef, updates as any);
  } catch (err) {
    console.error('Error updating return request:', err);
    throw err;
  }
}

export async function updateSupportTicketStatus(ticketId: string, status: string, remarks?: string): Promise<void> {
  try {
    const ticketRef = doc(db, 'support_tickets', ticketId);
    const updates: any = { status };
    if (remarks) updates.remarks = remarks;
    await updateDoc(ticketRef, updates);
  } catch (err) {
    console.error('Error updating support ticket:', err);
    throw err;
  }
}

export async function fetchOrderByIdOrAwb(queryStr: string): Promise<Order | null> {
  const searchStr = queryStr.trim();
  if (!searchStr) return null;
  
  try {
    // Check if it matches exactly the ID
    const orderId = searchStr.toUpperCase().startsWith('ORD-') ? searchStr.toUpperCase() : `ORD-${searchStr.toUpperCase()}`;
    
    let docSnap = await getDoc(doc(db, 'orders', orderId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as any) } as Order;
    }
    
    // If not found by ID, query by awbCode
    const q1 = query(collection(db, 'orders'), where('awbCode', '==', searchStr));
    const qs1 = await getDocs(q1);
    if (!qs1.empty) {
      return { id: qs1.docs[0].id, ...(qs1.docs[0].data() as any) } as Order;
    }
    
    // Query by shadowfaxAwb
    const q2 = query(collection(db, 'orders'), where('shadowfaxAwb', '==', searchStr));
    const qs2 = await getDocs(q2);
    if (!qs2.empty) {
      return { id: qs2.docs[0].id, ...(qs2.docs[0].data() as any) } as Order;
    }
    
  } catch (err) {
    console.error("Error fetching order by ID or AWB", err);
  }
  return null;
}
