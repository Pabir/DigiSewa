import { collection, getDocs, addDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Product, Order, Category, Seller } from '../types';

// Mock Initial Products for Hyperlocal E-Commerce Platform Demo
export const INITIAL_MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sellerId: 'sel-101',
    sellerName: 'Sharma Fresh Organics',
    title: 'Fresh Alphonso Mangoes (1 Box - 12 pcs)',
    description: 'Directly sourced from Ratnagiri farms. Naturally ripened, sweet and juicy premium Alphonso mangoes.',
    category: 'Fresh Produce',
    price: 650,
    originalPrice: 850,
    stock: 25,
    unit: 'box',
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviewCount: 42,
    tags: ['Organic', 'Hyperlocal', 'Fruits', 'Fresh'],
    isHyperlocalAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    sellerId: 'sel-102',
    sellerName: 'Gupta Electricals & Repairs',
    title: 'Smart LED Desk Lamp with Wireless Charging',
    description: '3 Lighting modes with dimmable touch control and built-in 10W fast wireless phone charger.',
    category: 'Electronics & Repairs',
    price: 1299,
    originalPrice: 1999,
    stock: 12,
    unit: 'piece',
    imageUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    reviewCount: 18,
    tags: ['Electronics', 'Home Office', 'Smart Device'],
    isHyperlocalAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    sellerId: 'sel-103',
    sellerName: 'Annapurna Sweets & Bakery',
    title: 'Pure Desi Ghee Kaju Katli (500g)',
    description: 'Handcrafted traditional Indian sweet made with 100% premium cashews and pure cow desi ghee.',
    category: 'Sweets & Snacks',
    price: 540,
    originalPrice: 600,
    stock: 40,
    unit: 'pack',
    imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviewCount: 89,
    tags: ['Festival', 'Sweets', 'Desi Ghee', 'Handmade'],
    isHyperlocalAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    sellerId: 'sel-101',
    sellerName: 'Sharma Fresh Organics',
    title: 'Pure Farm Fresh Cow Milk (1 Litre Pouch)',
    description: 'Chilled, unadulterated fresh cow milk delivered daily within 30 minutes in your neighborhood.',
    category: 'Dairy & Dairy Products',
    price: 66,
    originalPrice: 70,
    stock: 100,
    unit: 'litre',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviewCount: 154,
    tags: ['Daily Dairy', 'Fresh Milk', '30 Min Delivery'],
    isHyperlocalAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    sellerId: 'sel-104',
    sellerName: 'Apna Handloom & Textiles',
    title: 'Handcrafted Pure Cotton Chanderi Saree',
    description: 'Traditional Indian loom saree with intricate zari border and matching blouse piece.',
    category: 'Apparel & Fashion',
    subcategory: 'Sarees',
    price: 2499,
    originalPrice: 3499,
    stock: 8,
    unit: 'piece',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviewCount: 27,
    tags: ['Handloom', 'Fashion', 'Saree'],
    isHyperlocalAvailable: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    sellerId: 'sel-104',
    sellerName: 'Apna Handloom & Textiles',
    title: 'Women High-Waist Stretchable Denim Jeans (Dark Blue)',
    description: 'DigiSewa Special Collection: Premium stretchable denim ankle-length high waist jeans with 4 pockets.',
    category: 'Women Western',
    subcategory: 'Jeans & Trousers',
    price: 599,
    originalPrice: 1299,
    meeshoDiscountPrice: 549,
    stock: 45,
    unit: 'piece',
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=600&q=80',
    ],
    rating: 4.8,
    reviewCount: 112,
    tags: ['Jeans', 'DigiSewa Special', 'High Waist', 'Denim'],
    isHyperlocalAvailable: false,
    fabric: 'Stretchable Denim Cotton',
    pattern: 'Solid Plain',
    color: 'Dark Navy Blue',
    fitType: 'High Waist Slim Fit',
    catalogId: 'MSH-CAT-7701',
    sellerCode: 'DNM-JN-01',
    sizes: [
      { size: 'S', waistInches: 28, hipInches: 34, lengthInches: 38, stock: 10, price: 599, mrp: 1299, enabled: true },
      { size: 'M', waistInches: 30, hipInches: 36, lengthInches: 38.5, stock: 15, price: 599, mrp: 1299, enabled: true },
      { size: 'L', waistInches: 32, hipInches: 38, lengthInches: 39, stock: 12, price: 599, mrp: 1299, enabled: true },
      { size: 'XL', waistInches: 34, hipInches: 40, lengthInches: 39.5, stock: 8, price: 629, mrp: 1399, enabled: true },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    sellerId: 'sel-104',
    sellerName: 'Apna Handloom & Textiles',
    title: 'Designer Anarkali Floral Printed Rayon Kurti',
    description: 'Elegant flared Anarkali Kurti crafted with soft breathable rayon fabric and gold foil prints.',
    category: 'Women Ethnic',
    subcategory: 'Kurtis & Sets',
    price: 499,
    originalPrice: 999,
    meeshoDiscountPrice: 460,
    stock: 60,
    unit: 'piece',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    reviewCount: 84,
    tags: ['Kurti', 'Ethnic', 'Anarkali', 'Rayon'],
    isHyperlocalAvailable: true,
    fabric: '100% Pure Premium Rayon',
    pattern: 'Floral Gold Foil Print',
    color: 'Crimson Red',
    fitType: 'Regular Anarkali Fit',
    catalogId: 'MSH-CAT-8890',
    sellerCode: 'KRT-ANK-04',
    sizes: [
      { size: 'S', chestInches: 36, lengthInches: 44, stock: 15, price: 499, mrp: 999, enabled: true },
      { size: 'M', chestInches: 38, lengthInches: 44, stock: 20, price: 499, mrp: 999, enabled: true },
      { size: 'L', chestInches: 40, lengthInches: 45, stock: 15, price: 499, mrp: 999, enabled: true },
      { size: 'XL', chestInches: 42, lengthInches: 45, stock: 10, price: 519, mrp: 1049, enabled: true },
    ],
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Fresh Produce', iconName: 'apple', color: '#16A34A' },
  { id: 'cat-2', name: 'Sweets & Snacks', iconName: 'cookie', color: '#D97706' },
  { id: 'cat-3', name: 'Dairy & Milk', iconName: 'milk', color: '#2563EB' },
  { id: 'cat-4', name: 'Electronics & Repairs', iconName: 'zap', color: '#7C3AED' },
  { id: 'cat-5', name: 'Apparel & Fashion', iconName: 'shopping-bag', color: '#DB2777' },
  { id: 'cat-6', name: 'Home Services', iconName: 'wrench', color: '#EA580C' },
];

export const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-9841',
    buyerId: 'user-01',
    buyerName: 'Rahul Verma',
    buyerPhone: '+91 98765 43210',
    deliveryAddress: 'Flat 402, Green Valley Heights, Civil Lines',
    items: [
      { product: INITIAL_MOCK_PRODUCTS[0], quantity: 1 },
      { product: INITIAL_MOCK_PRODUCTS[2], quantity: 2 },
    ],
    totalAmount: 1730,
    paymentMode: 'upi',
    paymentStatus: 'paid',
    status: 'out_for_delivery',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    estimatedDelivery: '30 mins',
  },
  {
    id: 'ORD-9839',
    buyerId: 'user-01',
    buyerName: 'Priya Sundaram',
    buyerPhone: '+91 91234 56789',
    deliveryAddress: 'House No 14, Station Road, Main Market',
    items: [
      { product: INITIAL_MOCK_PRODUCTS[1], quantity: 1 },
    ],
    totalAmount: 1299,
    paymentMode: 'cod',
    paymentStatus: 'pending',
    status: 'processing',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    estimatedDelivery: 'Tomorrow, 11:00 AM',
  },
];

// In-Memory Fallback State for dynamic updates during session
let localProducts: Product[] = [...INITIAL_MOCK_PRODUCTS];
let localOrders: Order[] = [...INITIAL_MOCK_ORDERS];

/**
 * Fetch all products from Firestore with fallback to mock data
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    if (!querySnapshot.empty) {
      const products: Product[] = [];
      querySnapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      return products;
    }
  } catch (err) {
    console.warn('Firestore fetch products failed/offline, using in-memory state:', err);
  }
  return localProducts;
}

/**
 * Add a new product to Firestore / local state
 */
export async function addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const newProduct: Product = {
    ...product,
    id: 'prod-' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  // Strip undefined values for Firestore serialization compatibility
  const cleanProductData = JSON.parse(JSON.stringify(newProduct));

  try {
    const docRef = await addDoc(collection(db, 'products'), cleanProductData);
    console.log('✅ Successfully published catalog to Firestore with ID:', docRef.id);
    newProduct.id = docRef.id;
    alert(`🎉 Catalog Published to Firestore!\n\nDocument ID: ${docRef.id}\nProject: digisewa-ac3c4`);
  } catch (err: any) {
    console.error('❌ Firestore addProduct error:', err);
    alert(
      `⚠️ Firestore Error: ${err?.message || err}\n\nCode: ${err?.code || 'unknown'}\n\nIf error is permission-denied, go to Firebase Console -> Firestore Database -> Rules and set allow read, write: if true;`
    );
  }

  localProducts.unshift(newProduct);
  return newProduct;
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  return INITIAL_MOCK_CATEGORIES;
}

/**
 * Fetch orders for Seller / Buyer
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'orders'));
    if (!querySnapshot.empty) {
      const orders: Order[] = [];
      querySnapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() } as Order);
      });
      return orders;
    }
  } catch (err) {
    console.warn('Firestore fetch orders offline, returning local orders');
  }
  return localOrders;
}

/**
 * Update order status (Pending -> Processing -> Out for Delivery -> Delivered)
 */
export async function updateOrderStatus(orderId: string, newStatus: Order['status']): Promise<void> {
  const orderIndex = localOrders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    localOrders[orderIndex].status = newStatus;
  }

  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status: newStatus });
  } catch (err) {
    console.warn('Firestore update order status offline');
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
    await addDoc(collection(db, 'orders'), created);
  } catch (err) {
    console.warn('Firestore create order offline');
  }

  return created;
}
