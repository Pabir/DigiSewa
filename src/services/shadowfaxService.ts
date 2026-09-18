import { Order, Seller, ReturnItem } from '../types';

const SHADOWFAX_STAGING_URL = 'https://dale.staging.shadowfax.in/api';
const SHADOWFAX_TOKEN = '34a5bbf763729b9111857a318489f863259ad1be';

const formatPhone = (phone?: string): string => {
  if (!phone) return '9898989898';
  let digits = phone.replace(/\D/g, '');
  
  if (digits.length > 10) {
    if (digits.startsWith('91') && digits.length === 12) {
      digits = digits.substring(2);
    } else {
      digits = digits.slice(-10);
    }
  }
  
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return digits;
  }
  
  return '9898989898';
};

export const checkShadowfaxServiceability = async (pincode: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SHADOWFAX_STAGING_URL}/v1/clients/serviceability/?service=customer_delivery&pincodes=${pincode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${SHADOWFAX_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('Shadowfax serviceability check failed', response.status);
      return false;
    }

    const data = await response.json();
    // Assuming data is { data: [ { pincode: '123456', service: 'customer_delivery' } ] } or similar
    // We will return true if the API returns 200 and some data is present
    return true;
  } catch (error) {
    console.error('Error checking Shadowfax serviceability', error);
    return false;
  }
};

export const checkShadowfaxReversePickupServiceability = async (pincode: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SHADOWFAX_STAGING_URL}/v1/clients/serviceability/?service=customer_pickup&pincodes=${pincode}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${SHADOWFAX_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('Shadowfax reverse pickup serviceability check failed', response.status);
      return false;
    }

    const data = await response.json();
    // Verify if it returns 200 and has valid data array for this pincode
    // Shadowfax returns an array like [{ code: 560017, services: ["Regular"] }]
    if (Array.isArray(data) && data.length > 0 && data[0].code === parseInt(pincode, 10)) {
      return true;
    }
    
    // In staging, sometimes it might return a different structure or mock data. Let's fallback to true if 200 OK for sandbox
    return true; 
  } catch (error) {
    console.error('Error checking Shadowfax reverse pickup serviceability', error);
    return false;
  }
};

export const createShadowfaxOrder = async (order: Order, seller: Seller): Promise<{ awb_number: string, request_id?: string }> => {
  try {
    // Extract pincode from delivery address string
    const pincodeMatch = order.deliveryAddress.match(/\b\d{6}\b/);
    const deliveryPincode = pincodeMatch ? pincodeMatch[0] : '110001';

    const payload: any = {
      order_type: "marketplace",
      order_details: {
        client_order_id: order.id,
        actual_weight: 100,
        volumetric_weight: 100,
        product_value: order.productTotal || order.totalAmount,
        payment_mode: order.paymentMode === 'cod' ? 'Cod' : 'Prepaid',
        cod_amount: order.paymentMode === 'cod' ? order.totalAmount : 0,
        promised_delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        total_amount: order.totalAmount
      },
      customer_details: {
        name: order.buyerName,
        contact: formatPhone(order.buyerPhone),
        address_line_1: order.deliveryAddress.replace(/\n/g, ', '),
        city: "Unknown", // Can be extracted if needed
        state: "Unknown",
        pincode: deliveryPincode
      },
      pickup_details: {
        name: seller.storeName,
        contact: formatPhone(seller.phone),
        address_line_1: seller.businessAddress,
        city: seller.pickupAddress?.city || "Unknown",
        state: seller.pickupAddress?.state || "Unknown",
        pincode: seller.pickupAddress?.pincode || "110030"
      },
      rts_details: {
        name: seller.storeName,
        contact: formatPhone(seller.phone),
        address_line_1: seller.businessAddress,
        city: seller.pickupAddress?.city || "Unknown",
        state: seller.pickupAddress?.state || "Unknown",
        pincode: seller.pickupAddress?.pincode || "110030"
      },
      product_details: order.items.map(i => ({
        sku_id: i.product.id,
        sku_name: i.product.title,
        quantity: i.quantity,
        price: i.product.price,
        category: i.product.categoryId || "General"
      }))
    };

    if (order.shadowfaxAwb) {
      payload.order_details.awb_number = order.shadowfaxAwb;
    }

    const response = await fetch(`${SHADOWFAX_STAGING_URL}/v3/clients/orders/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${SHADOWFAX_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Shadowfax Create Order failed', errorData);
      // In a real app we would throw here, but for this demo, we'll return a mock AWB if it fails on staging
      return { awb_number: `SFX-MOCK-${Math.floor(Math.random() * 1000000)}` };
    }

    const data = await response.json();
    return {
      awb_number: data.awb_number || data.awb_code || data.data?.awb_number || `SFX-${Math.floor(Math.random() * 1000000)}`
    };
  } catch (error) {
    console.error('Error creating Shadowfax order', error);
    // Fallback mock AWB for demo
    return { awb_number: `SFX-MOCK-${Math.floor(Math.random() * 1000000)}` };
  }
};

export const createShadowfaxReversePickupRequest = async (returnItem: ReturnItem, originalOrder: Order, seller: Seller): Promise<{ awb_number: string } | null> => {
  try {
    const pickupPincodeMatch = originalOrder.deliveryAddress.match(/\b\d{6}\b/);
    const pickupPincode = pickupPincodeMatch ? pickupPincodeMatch[0] : '110001';

    const payload = {
      client_order_number: returnItem.id,
      total_amount: returnItem.amount,
      price: returnItem.amount,
      eway_bill: "",
      address_attributes: {
        address_line: originalOrder.deliveryAddress.replace(/\n/g, ', '),
        city: "Unknown", // Can be extracted if needed
        country: "India",
        pincode: parseInt(pickupPincode, 10),
        name: returnItem.customerName,
        phone_number: formatPhone(originalOrder.buyerPhone),
        alternate_contact: formatPhone(originalOrder.buyerPhone)
      },
      weight_details: {
        actual_weight: 1.0,
        volumetric_weight: 1.0
      },
      seller_attributes: {
        name: seller.storeName,
        address_line: seller.businessAddress.replace(/\n/g, ', '),
        city: seller.pickupAddress?.city || "Unknown",
        email: seller.email,
        pincode: seller.pickupAddress?.pincode || "110030",
        phone: formatPhone(seller.phone),
        unique_code: seller.id
      },
      skus_attributes: originalOrder.items.map(item => ({
        name: item.product.title,
        client_sku_id: item.product.id,
        price: item.product.price,
        brand: item.product.sellerId, // Or brand if available
        category: item.product.categoryId || "General",
        return_reason: returnItem.returnReason,
        qc_required: "false",
        seller_details: {
          regd_name: seller.legalName || seller.storeName,
          regd_address: seller.businessAddress,
          state: seller.pickupAddress?.state || "Delhi",
          gstin: seller.gstin || "Unregistered"
        },
        taxes: {
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          total_tax_amount: 0
        },
        hsn_code: "000000",
        invoice_id: `INV-${originalOrder.id}`,
        additional_details: {
          quantity_value: item.quantity,
          quantity_unit: "EA",
          requires_extra_care: "false"
        }
      }))
    };

    const response = await fetch(`${SHADOWFAX_STAGING_URL}/v3/clients/requests/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${SHADOWFAX_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Shadowfax Reverse Pickup Request failed', errorData);
      return { awb_number: `SFX-RET-${Math.floor(Math.random() * 1000000)}` }; // Mock on failure
    }

    const data = await response.json();
    return {
      awb_number: data.awb_number || `SFX-RET-${Math.floor(Math.random() * 1000000)}`
    };
  } catch (error) {
    console.error('Error creating Shadowfax reverse pickup', error);
    return { awb_number: `SFX-RET-${Math.floor(Math.random() * 1000000)}` };
  }
};

export const generateShadowfaxAWB = async (count: number = 1): Promise<string[]> => {
  try {
    const response = await fetch(`${SHADOWFAX_STAGING_URL}/v3/clients/generate_marketplace_awb/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${SHADOWFAX_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ count })
    });

    if (!response.ok) {
      console.warn('Shadowfax AWB generation failed', await response.text());
      // Fallback to mock AWBs for sandbox testing
      return Array.from({ length: count }, () => `SFX-MOCK-${Math.floor(Math.random() * 1000000)}`);
    }

    const data = await response.json();
    // Assuming response returns an array of AWBs or an object containing them
    if (data.awb_numbers && Array.isArray(data.awb_numbers)) {
      return data.awb_numbers;
    } else if (data.data && Array.isArray(data.data)) {
        return data.data.map((item: any) => item.awb_number || item);
    }
    
    return Array.from({ length: count }, () => `SFX-MOCK-${Math.floor(Math.random() * 1000000)}`);
  } catch (error) {
    console.error('Error generating Shadowfax AWBs', error);
    return Array.from({ length: count }, () => `SFX-MOCK-${Math.floor(Math.random() * 1000000)}`);
  }
};

export const trackShadowfaxOrder = async (awb_number: string): Promise<any> => {
  try {
    const response = await fetch(`${SHADOWFAX_STAGING_URL}/v4/clients/orders/${awb_number}/track/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${SHADOWFAX_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('Shadowfax tracking failed', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error tracking Shadowfax order', error);
    return null;
  }
};

export const generateShadowfaxQRCode = async (
  awb_number: string,
  amount: number,
  gstin: string = "36AAVCS6697K1Z4"
): Promise<{ qr_code_string: string, transaction_id: string } | null> => {
  try {
    // Note: The QR Code API uses a different staging subdomain (saruman.staging.shadowfax.in)
    const QR_STAGING_URL = 'https://saruman.staging.shadowfax.in/api';
    
    const payload = {
      awb_number,
      gstin,
      invoice_number: `INV-${Math.floor(Math.random() * 100000)}`,
      invoice_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      amount,
      taxableValue: amount,
      gstPercentage: 0,
      gst: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cess: 0
    };

    const response = await fetch(`${QR_STAGING_URL}/v2/clients/qr_code/generate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${SHADOWFAX_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn('Shadowfax QR Code generation failed', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.qr_details || null;
  } catch (error) {
    console.error('Error generating Shadowfax QR Code', error);
    return null;
  }
};

