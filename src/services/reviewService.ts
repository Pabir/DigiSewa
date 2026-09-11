import { collection, doc, getDocs, getDoc, setDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { ProductReview, Order } from '../types';
import { getOrders } from './firebaseService';
import { updateProductRating, getDynamicProducts } from './dynamicCatalogService';

const REVIEWS_COLLECTION = 'reviews';

// Local cache for faster demo interaction
let localReviews: ProductReview[] = [];

// Check if user has bought this specific product
export const checkVerifiedBuyer = async (userId: string, productId: string): Promise<boolean> => {
  try {
    const orders = await getOrders();
    // getOrders returns all orders (or we can filter by buyerId in a real prod app)
    const buyerOrders = orders.filter(o => o.buyerId === userId);
    
    // Check if any order item matches the productId
    for (const order of buyerOrders) {
      const itemMatch = order.items.some(item => 
        item.product.id === productId || 
        // For dynamic catalog items where product might be nested differently, check ID
        (item as any).productId === productId
      );
      if (itemMatch) return true;
    }
    return false;
  } catch (error) {
    console.error("Error checking verified buyer status:", error);
    return false;
  }
};

export const addProductReview = async (review: Omit<ProductReview, 'id' | 'createdAt'>): Promise<ProductReview> => {
  const newReview: ProductReview = {
    ...review,
    id: `rev-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  localReviews.push(newReview);

  try {
    const docRef = doc(db, REVIEWS_COLLECTION, newReview.id);
    await setDoc(docRef, newReview);
  } catch (e) {
    console.error('Error saving review to Firestore:', e);
  }

  // Update product aggregate rating
  await recalculateProductRating(review.productId);

  return newReview;
};

export const getProductReviews = async (productId: string): Promise<ProductReview[]> => {
  // If we have them in memory, return them (filtered). 
  // In a real app we fetch from firestore, but we'll try to fetch to populate local.
  try {
    const q = query(collection(db, REVIEWS_COLLECTION), where('productId', '==', productId));
    const querySnapshot = await getDocs(q);
    const fetched: ProductReview[] = [];
    querySnapshot.forEach((doc) => {
      fetched.push(doc.data() as ProductReview);
    });
    
    // Merge into localReviews
    fetched.forEach(f => {
      if (!localReviews.find(r => r.id === f.id)) {
        localReviews.push(f);
      }
    });
  } catch (e) {
    console.warn('Could not fetch reviews from Firestore, using local data', e);
  }
  
  return localReviews.filter(r => r.productId === productId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getSellerReviews = async (sellerId: string): Promise<ProductReview[]> => {
  try {
    const q = query(collection(db, REVIEWS_COLLECTION), where('sellerId', '==', sellerId));
    const querySnapshot = await getDocs(q);
    const fetched: ProductReview[] = [];
    querySnapshot.forEach((doc) => {
      fetched.push(doc.data() as ProductReview);
    });
    
    fetched.forEach(f => {
      if (!localReviews.find(r => r.id === f.id)) {
        localReviews.push(f);
      }
    });
  } catch (e) {
    console.warn('Could not fetch reviews from Firestore, using local data', e);
  }
  
  return localReviews.filter(r => r.sellerId === sellerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addSellerReply = async (reviewId: string, replyText: string): Promise<void> => {
  const index = localReviews.findIndex(r => r.id === reviewId);
  if (index !== -1) {
    localReviews[index].sellerReply = replyText;
    localReviews[index].repliedAt = new Date().toISOString();
    
    try {
      const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
      await setDoc(docRef, { sellerReply: replyText, repliedAt: localReviews[index].repliedAt }, { merge: true });
    } catch (e) {
      console.error('Error saving seller reply to Firestore:', e);
    }
  }
};

const recalculateProductRating = async (productId: string) => {
  const reviews = localReviews.filter(r => r.productId === productId);
  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  // Update in dynamicCatalogService
  await updateProductRating(productId, parseFloat(averageRating.toFixed(1)), reviews.length);
};
