import { Order, Seller } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SHIPROCKET_API_URL = 'https://apiv2.shiprocket.in/v1/external';
const CORS_PROXY = process.env.EXPO_PUBLIC_CORS_PROXY || 'https://corsproxy.io/?';

const getApiUrl = (endpoint: string) => {
  const url = `${SHIPROCKET_API_URL}${endpoint}`;
  if (Platform.OS === 'web') {
    return `${CORS_PROXY}${url}`;
  }
  return url;
};
const TOKEN_STORAGE_KEY = 'shiprocket_token_cache';

interface TokenCache {
  token: string;
  expiry: number; // timestamp in ms
}

let inMemoryToken: TokenCache | null = null;

export async function shiprocketLogin(): Promise<string> {
  const email = process.env.EXPO_PUBLIC_SHIPROCKET_EMAIL;
  const password = process.env.EXPO_PUBLIC_SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('Shiprocket credentials are not configured in environment variables.');
  }

  const now = Date.now();

  // 1. Check in-memory cache
  if (inMemoryToken && inMemoryToken.expiry > now) {
    return inMemoryToken.token;
  }

  // 2. Check AsyncStorage
  try {
    const cachedData = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (cachedData) {
      const parsed: TokenCache = JSON.parse(cachedData);
      if (parsed.expiry > now) {
        inMemoryToken = parsed;
        return parsed.token;
      }
    }
  } catch (error) {
    console.warn('Failed to read token from AsyncStorage', error);
  }

  // 3. Fetch new token
  const response = await fetch(getApiUrl('/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const token = data.token;
  
  // Cache the new token. Shiprocket tokens last 10 days. We'll cache for 9 days to be safe.
  const expiry = now + (9 * 24 * 60 * 60 * 1000);
  inMemoryToken = { token, expiry };
  
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(inMemoryToken));
  } catch (error) {
    console.warn('Failed to save token to AsyncStorage', error);
  }

  return token;
}


export async function createShiprocketOrder(
  order: Order, 
  seller: Seller, 
  token: string
): Promise<{ order_id: string; shipment_id: string; awb_code?: string }> {
  
  const payload = {
    order_id: order.id,
    order_date: new Date(order.createdAt || Date.now()).toISOString().split('T')[0],
    pickup_location: 'Primary', 
    billing_customer_name: order.buyerName?.split(' ')[0] || 'Buyer',
    billing_last_name: order.buyerName?.split(' ').slice(1).join(' ') || '.',
    billing_address: order.deliveryAddress || 'Test Address',
    billing_address_2: '',
    billing_city: 'New Delhi',
    billing_pincode: '110001',
    billing_state: 'Delhi',
    billing_country: 'India',
    billing_email: 'test@example.com',
    billing_phone: order.buyerPhone || '9999999999',
    shipping_is_billing: true,
    order_items: order.items.map(item => ({
      name: item.product.title,
      sku: item.product.id,
      units: item.quantity,
      selling_price: item.product.price,
      discount: 0,
      tax: 0,
      hsn: 441122
    })),
    payment_method: order.paymentMode === 'cod' ? 'COD' : 'Prepaid',
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: order.totalAmount,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5
  };

  const response = await fetch(getApiUrl('/orders/create/adhoc'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();

  if (!response.ok || !responseData.order_id) {
    console.error('Shiprocket order creation error:', responseData);
    throw new Error(`Shiprocket order creation failed: ${responseData.message || 'Unknown error'}`);
  }

  return {
    order_id: responseData.order_id.toString(),
    shipment_id: responseData.shipment_id.toString(),
    awb_code: responseData.awb_code
  };
}

export async function checkServiceability(pickupPincode: string, deliveryPincode: string, weight: number, token: string, isCod: boolean = false) {
  const codParam = isCod ? 1 : 0;
  const url = getApiUrl(`/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${codParam}`);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to check serviceability');
  }

  const data = await response.json();
  if (data.status === 200 && data.data && data.data.available_courier_companies.length > 0) {
    const couriers = data.data.available_courier_companies;
    const fastestCourier = couriers.reduce((prev: any, curr: any) => 
      (prev.estimated_delivery_days < curr.estimated_delivery_days ? prev : curr)
    );
    const cheapestCourier = couriers.reduce((prev: any, curr: any) => 
      (prev.rate < curr.rate ? prev : curr)
    );
    
    const options = [];
    options.push({
      type: 'fast',
      estimatedDeliveryDate: fastestCourier.etd,
      courierName: fastestCourier.courier_name,
      rate: fastestCourier.rate,
    });
    
    if (cheapestCourier.courier_company_id !== fastestCourier.courier_company_id) {
      options.push({
        type: 'budget',
        estimatedDeliveryDate: cheapestCourier.etd,
        courierName: cheapestCourier.courier_name,
        rate: cheapestCourier.rate,
      });
    }

    return options;
  }
  
  return null;
}

export async function generateShiprocketLabel(shipmentId: string, token: string): Promise<string> {
  const payload = { shipment_id: [parseInt(shipmentId, 10)] };
  const response = await fetch(getApiUrl('/courier/generate/label'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (data && data.label_created === 1 && data.label_url) {
    return data.label_url;
  }
  
  console.warn('Shiprocket label generation returned unexpected response:', data);
  throw new Error(`Label generation failed: ${data.message || JSON.stringify(data)}`);
}

// Simple in-memory cache for shipping estimates during catalog upload
const shippingEstimateCache: Record<string, { minShipping: number; maxShipping: number; rtoCharge: number }> = {};

export async function getEstimatedShippingCharges(
  pickupPincode: string,
  weightKg: number,
  token: string
): Promise<{ minShipping: number; maxShipping: number; rtoCharge: number }> {
  // Convert kg to weight for serviceability (Shiprocket uses KG)
  const weight = Math.max(0.5, weightKg);
  const cacheKey = `${pickupPincode}_${weight}`;

  if (shippingEstimateCache[cacheKey]) {
    return shippingEstimateCache[cacheKey];
  }

  try {
    // 1. Min Shipping (Local): Use pickup pincode as destination
    const localOptions = await checkServiceability(pickupPincode, pickupPincode, weight, token, false);
    
    // 2. Max Shipping (National): Use a distant pincode. If North (e.g. 110001), use South (695001). 
    // Just using a fixed far pincode for estimate.
    const FAR_PINCODE = '695001'; 
    const nationalOptions = await checkServiceability(pickupPincode, FAR_PINCODE, weight, token, false);

    const getLowestRate = (options: any[]) => {
      if (!options || options.length === 0) return null;
      return options.reduce((min, opt) => (opt.rate < min ? opt.rate : min), options[0].rate);
    };

    let minShipping = getLowestRate(localOptions) || 43; // fallback
    let maxShipping = getLowestRate(nationalOptions) || 74; // fallback

    // If national options failed for some reason, ensure max >= min
    if (maxShipping < minShipping) {
      maxShipping = minShipping + 31; // static markup if fallback needed
    }

    const rtoCharge = minShipping; // RTO base charge dynamically matching minShipping

    const result = { minShipping, maxShipping, rtoCharge };
    shippingEstimateCache[cacheKey] = result;
    return result;

  } catch (error) {
    console.warn('Error fetching estimated shipping charges, falling back to defaults:', error);
    return { minShipping: 43, maxShipping: 74, rtoCharge: 43 };
  }
}
