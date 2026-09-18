import { db } from '../config/firebaseConfig';
import { 
  collection, 
  doc, 
  writeBatch, 
  increment, 
  updateDoc,
  getAggregateFromServer,
  sum
} from 'firebase/firestore';

const SHARDS_COUNT = 20;

/**
 * Initializes distributed counter shards for a given product or product variant.
 * @param productId Product ID
 * @param variantId Variant ID (optional, if tracking stock at variant level)
 * @param initialStock Total stock to distribute
 * @param numShards Number of shards (default 20)
 */
export const initializeStockShards = async (
  productId: string,
  variantId: string | null,
  initialStock: number,
  numShards: number = SHARDS_COUNT
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Determine the parent path
    // Products -> (productId) -> variants (optional) -> (variantId)
    // Then under that, a subcollection: stockShards
    
    let shardsRef;
    if (variantId) {
      shardsRef = collection(db, 'products', productId, 'variants', variantId, 'stockShards');
    } else {
      shardsRef = collection(db, 'products', productId, 'stockShards');
    }

    // Distribute stock evenly-ish
    const stockPerShard = Math.floor(initialStock / numShards);
    const remainder = initialStock % numShards;

    for (let i = 0; i < numShards; i++) {
      const shardDocRef = doc(shardsRef, i.toString());
      const shardStock = i === 0 ? stockPerShard + remainder : stockPerShard;
      
      batch.set(shardDocRef, { count: shardStock });
    }

    await batch.commit();
    console.log(`Initialized ${numShards} stock shards for ${variantId ? 'variant ' + variantId : 'product ' + productId}`);
  } catch (error) {
    console.error('Error initializing stock shards:', error);
    throw error;
  }
};

/**
 * Decrements stock by randomly picking a shard.
 * @param productId Product ID
 * @param variantId Variant ID (optional)
 * @param qty Amount to decrement
 * @param numShards Number of shards configured
 */
export const decrementStock = async (
  productId: string,
  variantId: string | null,
  qty: number = 1,
  numShards: number = SHARDS_COUNT
): Promise<void> => {
  try {
    const shardId = Math.floor(Math.random() * numShards).toString();
    
    let shardRef;
    if (variantId) {
      shardRef = doc(db, 'products', productId, 'variants', variantId, 'stockShards', shardId);
    } else {
      shardRef = doc(db, 'products', productId, 'stockShards', shardId);
    }

    await updateDoc(shardRef, {
      count: increment(-qty)
    });
    
    console.log(`Decremented stock by ${qty} on shard ${shardId}`);
  } catch (error) {
    console.error('Error decrementing stock shard:', error);
    throw error;
  }
};

/**
 * Aggregates all shards to calculate total available stock.
 * @param productId Product ID
 * @param variantId Variant ID (optional)
 * @returns Total stock count
 */
export const getTotalStock = async (
  productId: string,
  variantId: string | null
): Promise<number> => {
  try {
    let shardsRef;
    if (variantId) {
      shardsRef = collection(db, 'products', productId, 'variants', variantId, 'stockShards');
    } else {
      shardsRef = collection(db, 'products', productId, 'stockShards');
    }

    const snapshot = await getAggregateFromServer(shardsRef, {
      totalCount: sum('count')
    });
    
    return snapshot.data().totalCount || 0;
  } catch (error) {
    console.error('Error fetching total stock from shards:', error);
    throw error;
  }
};
