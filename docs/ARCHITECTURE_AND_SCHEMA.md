# Architecture and Schema

## Database Schema (Firestore NoSQL)

*Note: Since Firestore is NoSQL, these represent the primary document structures and sub-collections.*

### `users`
- `uid` (String, Document ID)
- `email` (String)
- `displayName` (String)
- `role` (String: 'customer', 'seller', 'admin')
- `createdAt` (Timestamp)
- `status` (String: 'active', 'suspended')

### `products`
- `id` (String, Document ID)
- `sellerId` (String, Ref to users.uid)
- `title` (String)
- `description` (String)
- `price` (Number)
- `inventory` (Number)
- `category` (String)
- `images` (Array of Strings/URLs)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### `orders`
- `orderId` (String, Document ID)
- `customerId` (String, Ref to users.uid)
- `items` (Array of Objects: {productId, quantity, price, sellerId})
- `totalAmount` (Number)
- `status` (String: 'pending', 'paid', 'shipped', 'delivered', 'cancelled', 'returned')
- `shippingDetails` (Object)
- `paymentDetails` (Object: {method, transactionId})
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### `sellers` (Extended details linked to `users`)
- `sellerId` (String, Document ID same as users.uid)
- `businessName` (String)
- `kycStatus` (String: 'pending', 'verified', 'rejected')
- `bankDetails` (Object)
- `gstNumber` (String)

## Core Service Integrations & Endpoints

### Logistics: Shiprocket
- Handled via MCP toolset (`shiprocket-mcp`)
- **Key flows**: 
  - `order_list`: Fetching shipments.
  - `order_exchange`: Managing returns.

### Payments: Razorpay
- Handled via backend Functions or Razorpay MCP.
- **Key flows**:
  - `create_order`
  - Webhooks handling for `payment.captured` or `payment.failed`.

### Backend (Firebase Functions)
- **REST APIs / Callable Functions**:
  - `createOrder`: Initializes transaction and returns Razorpay order ID.
  - `webhookRazorpay`: Endpoint for async payment status updates.
  - `updateInventory`: Triggered post-purchase.

## Security & RBAC (Role-Based Access Control)
- **Authentication**: Managed entirely by Firebase Auth (Email/Password, Phone OTP, Google).
- **Authorization (Firestore Rules)**:
  - Users can read/write their own profiles.
  - Anyone can read active products.
  - Sellers can only write to their own products.
  - Admins have read/write access to all collections.
- **Data Validation**: Enforced via Firestore Security Rules and Server-side functions.
