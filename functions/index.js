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
