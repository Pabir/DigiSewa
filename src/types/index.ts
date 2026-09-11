export type UserRole = 'guest' | 'buyer' | 'customer' | 'seller' | 'admin' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  address?: string;
  password?: string;
  cart?: CartItem[];
}

export interface SystemAdmin extends User {
  status: 'active' | 'suspended';
  createdDate: string;
}

export interface PickupAddress {
  building: string;
  street: string;
  pincode: string;
  city: string;
  state: string;
  district?: string;
}

export interface BankDetails {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  bankName?: string;
}

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  ownerName?: string;
  email?: string;
  tagline?: string;
  businessAddress: string;
  phone: string;
  rating: number;
  totalSales: number;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'suspended';

  // Comprehensive DigiSewa Onboarding Fields (Modeled after Supplier Signup)
  hasGst?: boolean;
  gstin?: string;
  eidNumber?: string;
  panNumber?: string;
  nameAsPerPan?: string;
  pickupAddress?: PickupAddress;
  bankDetails?: BankDetails;
  businessType?: string;
  whatsappUpdates?: boolean;
  password?: string;
  rejectionReason?: string;
  joinedDate?: string;
  eSignatureText?: string;
  eSignatureUrl?: string;
}

export interface ClothSizeVariant {
  size: string; // 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'
  waistInches?: number; // e.g., 28, 30, 32, 34
  chestInches?: number; // e.g., 36, 38, 40, 42
  breastInches?: number; // e.g., 32, 34, 36, 38 (for Women Upper Wear)
  hipInches?: number;
  lengthInches?: number;
  stock: number;
  price: number;
  mrp: number;
  sku?: string;
  enabled?: boolean;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  unit: string; // e.g., 'kg', 'piece', 'pack'
  imageUrl: string;
  additionalImages?: string[];
  rating: number;
  reviewCount: number;
  tags: string[];
  isHyperlocalAvailable: boolean;
  createdAt: string;

  // Meesho Apparel / Catalog Attributes
  fabric?: string;
  pattern?: string;
  color?: string;
  fitType?: string;
  sizes?: ClothSizeVariant[];
  catalogId?: string;
  sellerCode?: string;
  meeshoDiscountPrice?: number;
  selectedSize?: string;
  offerFreeShipping?: boolean;
  variants?: any[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  deliveryPreference?: 'fast' | 'budget';
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'reached_hub' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  items: CartItem[];
  totalAmount: number;
  productTotal?: number;
  shippingFee?: number;
  actualShippingCost?: number;
  sellerOffersFreeShipping?: boolean;
  platformFee?: number;
  paymentMode: 'cod' | 'upi' | 'card';
  paymentStatus: 'pending' | 'paid';
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  awbCode?: string;
  labelUrl?: string;
  isLabelDownloaded?: boolean;
  razorpayPaymentId?: string;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  color: string;
}

export interface AIProductSuggestion {
  title: string;
  description: string;
  category: string;
  suggestedPrice: number;
  suggestedOriginalPrice?: number;
  tags: string[];
}

export interface ReturnItem {
  id: string;
  orderId: string;
  sellerId?: string;
  productName: string;
  returnReason: string;
  customerName: string;
  status: 'rto_in_transit' | 'delivered_to_seller' | 'qc_failed' | 'replacement_requested';
  returnDate: string;
  amount: number;
}

export interface Settlement {
  id: string;
  sellerId: string;
  storeName: string;
  orderId: string;
  amountOwed: number;
  status: 'pending' | 'processing' | 'settled';
  createdAt: string;
  settledAt?: string;
  payoutReference?: string;
}
export interface ProductReview {
  id: string;
  productId: string;
  sellerId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  createdAt: string;
  sellerReply?: string;
  repliedAt?: string;
}
