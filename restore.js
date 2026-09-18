import * as fs from 'fs';

const filePath = 'src/services/firebaseService.ts';
let code = fs.readFileSync(filePath, 'utf8');

const functionsToAdd = `
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
    const constraints: any[] = [];
    if (sellerId) constraints.push(where('sellerId', '==', sellerId));
    if (status) constraints.push(where('status', '==', status));
    
    let q;
    if (constraints.length > 0) {
      q = query(collection(db, 'orders'), ...constraints, orderBy('createdAt', 'desc'), limit(pageSize));
      if (lastVisibleDoc) {
        q = query(collection(db, 'orders'), ...constraints, orderBy('createdAt', 'desc'), startAfter(lastVisibleDoc), limit(pageSize));
      }
    } else {
      q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(pageSize));
      if (lastVisibleDoc) {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), startAfter(lastVisibleDoc), limit(pageSize));
      }
    }
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      querySnapshot.forEach(docSnap => {
        orders.push({ id: docSnap.id, ...(docSnap.data() as any) } as Order);
      });
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
    
    let q;
    if (constraints.length > 0) {
      q = query(collection(db, 'returns'), ...constraints, orderBy('returnDate', 'desc'), limit(pageSize));
      if (lastVisibleDoc) {
        q = query(collection(db, 'returns'), ...constraints, orderBy('returnDate', 'desc'), startAfter(lastVisibleDoc), limit(pageSize));
      }
    } else {
      q = query(collection(db, 'returns'), orderBy('returnDate', 'desc'), limit(pageSize));
      if (lastVisibleDoc) {
        q = query(collection(db, 'returns'), orderBy('returnDate', 'desc'), startAfter(lastVisibleDoc), limit(pageSize));
      }
    }
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      querySnapshot.forEach(docSnap => {
        returns.push({ id: docSnap.id, ...(docSnap.data() as any) } as ReturnItem);
      });
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
`;

// Add necessary imports if missing
if (!code.includes('getCountFromServer')) {
  code = code.replace(/import \{([^}]+)\} from 'firebase\/firestore';/, (match, imports) => {
    return \`import { \${imports}, getCountFromServer, getAggregateFromServer, sum, orderBy } from 'firebase/firestore';\`;
  });
}

if (!code.includes('getProductsPaginated')) {
  code += '\\n' + functionsToAdd;
  fs.writeFileSync(filePath, code);
  console.log('Added missing functions successfully!');
} else {
  console.log('Functions already exist?');
}
