export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export type TransactionType =
  | 'ORDER_PAYMENT'
  | 'ORDER_PAYMENT_FAILED'
  | 'ORDER_PAYMENT_REVERSED'
  | 'SELLER_SALE'
  | 'SELLER_COMMISSION'
  | 'SELLER_FEE'
  | 'SELLER_SETTLEMENT'
  | 'SELLER_PAYOUT'
  | 'REFUND'
  | 'PARTIAL_REFUND'
  | 'REFUND_REVERSAL'
  | 'RETURN'
  | 'CANCELLATION'
  | 'RTO'
  | 'COD_COLLECTION'
  | 'COD_SETTLEMENT'
  | 'SHIPPING_CHARGE'
  | 'REVERSE_SHIPPING'
  | 'RTO_SHIPPING'
  | 'COUPON_DISCOUNT'
  | 'CASHBACK'
  | 'WALLET_CREDIT'
  | 'WALLET_DEBIT'
  | 'REFERRAL_REWARD'
  | 'AFFILIATE_COMMISSION'
  | 'SUBSCRIPTION_FEE'
  | 'ADVERTISEMENT_FEE'
  | 'GATEWAY_FEE'
  | 'BANK_FEE'
  | 'GST_TRANSACTION'
  | 'TDS_TRANSACTION'
  | 'TCS_TRANSACTION'
  | 'CHARGEBACK'
  | 'CHARGEBACK_REVERSAL'
  | 'VENDOR_PAYMENT'
  | 'EMPLOYEE_PAYMENT'
  | 'OPERATING_EXPENSE'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE'
  | 'MANUAL_CREDIT'
  | 'MANUAL_DEBIT'
  | 'ADJUSTMENT'
  | 'REVERSAL';

export type FinancialStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'ON_HOLD'
  | 'RECONCILED'
  | 'UNRECONCILED';

// ---------------------------------------------------------
// 1. Double-Entry Accounting Core
// ---------------------------------------------------------

export interface LedgerAccount {
  id: string; // e.g., ACC_ASSET_BANK, ACC_REV_COMMISSION
  name: string;
  type: AccountType;
  currency: string;
  balance: number; // Derived balance
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  ledgerTransactionId: string; // Links to LedgerTransaction
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  createdAt: string;
}

export interface LedgerTransaction {
  id: string; // e.g., JRN-20260904-0001
  referenceId: string; // ID of the FinancialTransaction
  description: string;
  entries: LedgerEntry[]; // Must have at least one debit and one credit, total debit == total credit
  createdAt: string;
}

// ---------------------------------------------------------
// 2. Core Master Financial Transaction
// ---------------------------------------------------------

export interface FinancialTransaction {
  id: string; // FIN-20260904-000001
  transactionType: TransactionType;
  transactionReference: string; // External ref, e.g., PG Txn ID
  orderId?: string;
  customerId?: string;
  sellerId?: string;
  paymentId?: string;
  settlementId?: string;
  parentTransactionId?: string; // For reversals/adjustments
  
  amount: number; // DECIMAL equivalent in backend
  currency: string;
  
  transactionDate: string;
  status: FinancialStatus;
  description: string;
  
  createdAt: string;
  updatedAt: string;
  createdBy: string; // System or Admin UID
  metadata?: Record<string, any>; // Flexible payload
}

// ---------------------------------------------------------
// 3. Domain Specific Financial Entities
// ---------------------------------------------------------

export interface PaymentTransaction {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'COD' | string;
  gateway: string;
  gatewayTransactionId: string;
  gatewayReference?: string;
  paymentDate: string;
  paymentStatus: FinancialStatus;
  settlementId?: string;
}

export interface GatewaySettlement {
  id: string;
  gateway: string;
  settlementDate: string;
  grossAmount: number;
  gatewayFees: number;
  gstOnFees: number;
  refundsAmount: number;
  netAmount: number;
  bankReferenceUtr: string;
  reconciliationStatus: 'PENDING' | 'RECONCILED' | 'DISCREPANCY';
  createdAt: string;
}

export interface SellerCommission {
  id: string;
  orderId: string;
  sellerId: string;
  productId: string;
  commissionRate: number; // e.g. 10(%)
  taxableCommissionAmount: number;
  gstAmount: number; // 18% of taxableCommissionAmount typically
  totalDeduction: number;
  status: FinancialStatus;
  createdAt: string;
}

export interface SellerSettlement {
  id: string; // e.g. SET-SELLER-123
  sellerId: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  grossSales: number;
  commission: number;
  marketplaceFees: number;
  shippingCharges: number;
  returns: number;
  refunds: number;
  penalties: number;
  taxDeductions: number;
  incentives: number;
  adjustments: number;
  netPayable: number;
  
  settlementStatus: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'ON_HOLD';
  settlementDate: string;
}

export interface SellerPayout {
  id: string;
  sellerId: string;
  settlementId: string;
  bankAccountId?: string;
  amount: number;
  paymentMethod: string;
  utr?: string;
  initiatedDate: string;
  processedDate?: string;
  status: FinancialStatus;
  failureReason?: string;
}

export interface RefundTransaction {
  id: string;
  orderId: string;
  paymentId: string;
  customerId: string;
  sellerId?: string;
  refundAmount: number;
  refundReason: string;
  refundMethod: string;
  gatewayRefundId?: string;
  refundDate: string;
  refundStatus: FinancialStatus;
  originalTransactionId: string;
  reversalTransactionId?: string;
}

export interface FinancialAuditLog {
  id: string;
  userId: string; // UID of admin or 'SYSTEM'
  action: 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'REVERSE' | 'REFUND' | 'ADJUST' | 'SETTLE' | 'PAYOUT' | 'RECONCILE';
  module: string; // e.g. 'SELLER_SETTLEMENT'
  transactionId: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  reason: string;
  timestamp: string;
}
