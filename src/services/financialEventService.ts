import { runTransaction, doc, collection, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import {
  FinancialTransaction,
  LedgerTransaction,
  LedgerEntry,
  TransactionType,
  FinancialStatus,
  LedgerAccount
} from '../types/financeTypes';

/**
 * Generate a unique ID for financial records.
 * Format: PREFIX-YYYYMMDD-RANDOM (e.g., FIN-20260904-1A2B3C)
 */
const generateFinancialId = (prefix: string): string => {
  const date = new Date();
  const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${dateString}-${randomStr}`;
};

/**
 * CORE FINANCIAL PRINCIPLE (Rule 51 & 49):
 * No direct balance manipulation without a Ledger Transaction.
 * 
 * This helper uses Firestore Transactions to ensure double-entry 
 * records are atomic. It updates account balances and writes the 
 * LedgerTransaction + LedgerEntries simultaneously.
 */
export const postLedgerTransaction = async (
  referenceId: string,
  description: string,
  debits: { accountId: string; amount: number; currency: string }[],
  credits: { accountId: string; amount: number; currency: string }[]
): Promise<string> => {
  
  // Validate Double-Entry Math before attempting DB transaction
  const totalDebit = debits.reduce((sum, d) => sum + d.amount, 0);
  const totalCredit = credits.reduce((sum, c) => sum + c.amount, 0);
  
  // Using small epsilon for floating point precision issues, 
  // though we should ideally use integers for cents in the real implementation.
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Double-entry mismatch! Debits (${totalDebit}) do not equal Credits (${totalCredit})`);
  }

  const ledgerTxnId = generateFinancialId('JRN');

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Fetch all involved accounts to ensure they exist and to get current balances
      const accountRefs = new Map();
      const accountDocs = new Map();

      for (const entry of [...debits, ...credits]) {
        if (!accountRefs.has(entry.accountId)) {
          const ref = doc(db, 'ledger_accounts', entry.accountId);
          accountRefs.set(entry.accountId, ref);
          const snap = await transaction.get(ref);
          if (!snap.exists()) {
             // In a robust system, we might lazily create accounts, 
             // but for strict accounting, they should be pre-seeded.
            throw new Error(`Ledger account ${entry.accountId} not found.`);
          }
          accountDocs.set(entry.accountId, snap.data() as LedgerAccount);
        }
      }

      // 2. Prepare Ledger Entries
      const entries: LedgerEntry[] = [];
      const timestamp = new Date().toISOString();

      debits.forEach(d => {
        entries.push({
          id: generateFinancialId('ENT'),
          ledgerTransactionId: ledgerTxnId,
          accountId: d.accountId,
          type: 'DEBIT',
          amount: d.amount,
          currency: d.currency,
          createdAt: timestamp
        });
        
        // Asset/Expense increases with Debit, Liability/Equity/Revenue decreases with Debit
        const acc = accountDocs.get(d.accountId);
        if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
          acc.balance += d.amount;
        } else {
          acc.balance -= d.amount;
        }
      });

      credits.forEach(c => {
        entries.push({
          id: generateFinancialId('ENT'),
          ledgerTransactionId: ledgerTxnId,
          accountId: c.accountId,
          type: 'CREDIT',
          amount: c.amount,
          currency: c.currency,
          createdAt: timestamp
        });
        
        // Asset/Expense decreases with Credit, Liability/Equity/Revenue increases with Credit
        const acc = accountDocs.get(c.accountId);
        if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
          acc.balance -= c.amount;
        } else {
          acc.balance += c.amount;
        }
      });

      // 3. Write Updated Balances
      accountDocs.forEach((acc, accountId) => {
        const ref = accountRefs.get(accountId);
        transaction.update(ref, { 
          balance: acc.balance,
          updatedAt: timestamp 
        });
      });

      // 4. Write Ledger Transaction and Entries
      const ledgerTxnRef = doc(db, 'ledger_transactions', ledgerTxnId);
      const newLedgerTxn: LedgerTransaction = {
        id: ledgerTxnId,
        referenceId,
        description,
        entries,
        createdAt: timestamp
      };
      transaction.set(ledgerTxnRef, newLedgerTxn);
    });

    console.log(`✅ Ledger Transaction posted successfully: ${ledgerTxnId}`);
    return ledgerTxnId;
  } catch (error) {
    console.error(`❌ Ledger Transaction failed: ${error}`);
    throw error;
  }
};


// ============================================================================
// STANDARD CHART OF ACCOUNTS (Mock IDs for demonstration)
// ============================================================================
export const SYSTEM_ACCOUNTS = {
  PG_RECEIVABLE: 'ACC_ASSET_PG_RECEIVABLE',
  SALES_REVENUE: 'ACC_REV_SALES', // Acts as a clearing account before moving to Seller
  GST_PAYABLE: 'ACC_LIAB_GST_PAYABLE',
  GATEWAY_EXPENSE: 'ACC_EXP_GATEWAY_FEE',
  INPUT_GST: 'ACC_ASSET_INPUT_GST',
  MARKETPLACE_COMMISSION_REV: 'ACC_REV_COMMISSION',
  SHIPPING_EXPENSE: 'ACC_EXP_SHIPPING',
  BANK_ACCOUNT: 'ACC_ASSET_BANK_MAIN'
};

const getSellerPayableAccountId = (sellerId: string) => `ACC_LIAB_SELLER_PAYABLE_${sellerId}`;

// ============================================================================
// FINANCIAL EVENT ENGINE (Rule 52)
// These functions orchestrate the creation of domain records AND ledger entries
// ============================================================================

export const recordCustomerPayment = async (
  orderId: string, 
  customerId: string, 
  grossAmount: number, // e.g., 1180
  netSales: number,    // e.g., 1000
  gstAmount: number,   // e.g., 180
  pgFee: number,       // e.g., 20
  pgGst: number,       // e.g., 3.60
  pgTxnId: string
) => {
  console.log(`Processing Customer Payment for Order ${orderId}...`);

  // 1. Create Master Financial Transaction Record for the Payment
  const paymentFinTxnId = generateFinancialId('FIN');
  const paymentFinTxn: FinancialTransaction = {
    id: paymentFinTxnId,
    transactionType: 'ORDER_PAYMENT',
    transactionReference: pgTxnId,
    orderId,
    customerId,
    amount: grossAmount,
    currency: 'INR',
    transactionDate: new Date().toISOString(),
    status: 'SUCCESS',
    description: `Customer payment for order ${orderId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM'
  };
  
  await setDoc(doc(db, 'financial_transactions', paymentFinTxnId), paymentFinTxn);

  // 2. Post Ledger Transaction for the Customer Payment (Rule 53)
  // Debit: Payment Gateway Receivable (1180)
  // Credit: Sales Revenue (1000)
  // Credit: GST Payable (180)
  await postLedgerTransaction(
    paymentFinTxnId,
    `Order Payment Collection ${orderId}`,
    [
      { accountId: SYSTEM_ACCOUNTS.PG_RECEIVABLE, amount: grossAmount, currency: 'INR' }
    ],
    [
      { accountId: SYSTEM_ACCOUNTS.SALES_REVENUE, amount: netSales, currency: 'INR' },
      { accountId: SYSTEM_ACCOUNTS.GST_PAYABLE, amount: gstAmount, currency: 'INR' }
    ]
  );

  // 3. Create Master Financial Transaction Record for the Gateway Fee Deduction
  const feeFinTxnId = generateFinancialId('FIN');
  const feeFinTxn: FinancialTransaction = {
    ...paymentFinTxn,
    id: feeFinTxnId,
    transactionType: 'GATEWAY_FEE',
    parentTransactionId: paymentFinTxnId,
    amount: pgFee + pgGst,
    description: `Gateway fee deduction for order ${orderId}`
  };

  await setDoc(doc(db, 'financial_transactions', feeFinTxnId), feeFinTxn);

  // 4. Post Ledger Transaction for Gateway Fees
  // Debit: Gateway Expense (20)
  // Debit: Input GST (3.60)
  // Credit: Payment Gateway Receivable (23.60)
  await postLedgerTransaction(
    feeFinTxnId,
    `Gateway Fee Deduction ${orderId}`,
    [
      { accountId: SYSTEM_ACCOUNTS.GATEWAY_EXPENSE, amount: pgFee, currency: 'INR' },
      { accountId: SYSTEM_ACCOUNTS.INPUT_GST, amount: pgGst, currency: 'INR' }
    ],
    [
      { accountId: SYSTEM_ACCOUNTS.PG_RECEIVABLE, amount: pgFee + pgGst, currency: 'INR' }
    ]
  );

  console.log(`✅ Completed Customer Payment Flow for ${orderId}`);
};

export const recordSellerSale = async (orderId: string, sellerId: string, amount: number) => {
  console.log(`Processing Seller Sale Allocation for Order ${orderId}...`);
  
  const finTxnId = generateFinancialId('FIN');
  const finTxn: FinancialTransaction = {
    id: finTxnId,
    transactionType: 'SELLER_SALE',
    transactionReference: `SALE-${orderId}`,
    orderId,
    sellerId,
    amount, // Net sales amount without GST (e.g., 1000)
    currency: 'INR',
    transactionDate: new Date().toISOString(),
    status: 'SUCCESS',
    description: `Allocated sale amount to seller ${sellerId} for order ${orderId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM'
  };

  await setDoc(doc(db, 'financial_transactions', finTxnId), finTxn);

  // Move funds from Sales Clearing Account to Seller Payable Liability Account
  await postLedgerTransaction(
    finTxnId,
    `Seller Sale Allocation ${orderId}`,
    [
      { accountId: SYSTEM_ACCOUNTS.SALES_REVENUE, amount, currency: 'INR' }
    ],
    [
      { accountId: getSellerPayableAccountId(sellerId), amount, currency: 'INR' }
    ]
  );
  
  console.log(`✅ Allocated ₹${amount} to Seller ${sellerId}`);
};

export const calculateCommission = async (orderId: string, sellerId: string, commissionAmount: number, gstOnCommission: number) => {
  console.log(`Processing Marketplace Commission for Order ${orderId}...`);

  const totalDeduction = commissionAmount + gstOnCommission;
  const finTxnId = generateFinancialId('FIN');
  
  const finTxn: FinancialTransaction = {
    id: finTxnId,
    transactionType: 'SELLER_COMMISSION',
    transactionReference: `COMM-${orderId}`,
    orderId,
    sellerId,
    amount: totalDeduction, 
    currency: 'INR',
    transactionDate: new Date().toISOString(),
    status: 'SUCCESS',
    description: `Commission deduction for order ${orderId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM'
  };

  await setDoc(doc(db, 'financial_transactions', finTxnId), finTxn);

  // Deduct from Seller Payable, Credit Platform Commission Revenue and GST Payable
  await postLedgerTransaction(
    finTxnId,
    `Marketplace Commission ${orderId}`,
    [
      { accountId: getSellerPayableAccountId(sellerId), amount: totalDeduction, currency: 'INR' }
    ],
    [
      { accountId: SYSTEM_ACCOUNTS.MARKETPLACE_COMMISSION_REV, amount: commissionAmount, currency: 'INR' },
      { accountId: SYSTEM_ACCOUNTS.GST_PAYABLE, amount: gstOnCommission, currency: 'INR' }
    ]
  );
  
  console.log(`✅ Deducted ₹${totalDeduction} commission from Seller ${sellerId}`);
};

export const recordSellerFee = async (sellerId: string, feeType: string, amount: number) => {
  // TODO: Implement
  console.log(`Stub: recordSellerFee for ${sellerId}`);
};

export const createRefund = async (orderId: string, customerId: string, grossRefund: number, netRefund: number, gstRefund: number) => {
  console.log(`Processing Refund for Order ${orderId}...`);

  const finTxnId = generateFinancialId('FIN');
  const finTxn: FinancialTransaction = {
    id: finTxnId,
    transactionType: 'REFUND',
    transactionReference: `REF-${orderId}`,
    orderId,
    customerId,
    amount: grossRefund,
    currency: 'INR',
    transactionDate: new Date().toISOString(),
    status: 'SUCCESS',
    description: `Customer refund for order ${orderId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM'
  };

  await setDoc(doc(db, 'financial_transactions', finTxnId), finTxn);

  // 1. Reverse the Customer Payment
  // Debit: Sales Revenue & GST Payable
  // Credit: PG Receivable (or Refund Payable)
  await postLedgerTransaction(
    finTxnId,
    `Customer Refund ${orderId}`,
    [
      { accountId: SYSTEM_ACCOUNTS.SALES_REVENUE, amount: netRefund, currency: 'INR' },
      { accountId: SYSTEM_ACCOUNTS.GST_PAYABLE, amount: gstRefund, currency: 'INR' }
    ],
    [
      { accountId: SYSTEM_ACCOUNTS.PG_RECEIVABLE, amount: grossRefund, currency: 'INR' }
    ]
  );
  
  console.log(`✅ Refunded ₹${grossRefund} to Customer for ${orderId}`);
};

export const reverseSellerSale = async (orderId: string, sellerId: string, amount: number) => {
  console.log(`Reversing Seller Sale Allocation for Order ${orderId}...`);
  
  const finTxnId = generateFinancialId('FIN');
  const finTxn: FinancialTransaction = {
    id: finTxnId,
    transactionType: 'REVERSAL',
    transactionReference: `REV-SALE-${orderId}`,
    orderId,
    sellerId,
    amount,
    currency: 'INR',
    transactionDate: new Date().toISOString(),
    status: 'SUCCESS',
    description: `Reversed sale amount from seller ${sellerId} for returned order ${orderId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM'
  };

  await setDoc(doc(db, 'financial_transactions', finTxnId), finTxn);

  // Reverse Seller Allocation: Debit Seller Payable, Credit Sales Revenue
  await postLedgerTransaction(
    finTxnId,
    `Seller Sale Reversal ${orderId}`,
    [
      { accountId: getSellerPayableAccountId(sellerId), amount, currency: 'INR' }
    ],
    [
      { accountId: SYSTEM_ACCOUNTS.SALES_REVENUE, amount, currency: 'INR' }
    ]
  );
  
  console.log(`✅ Reversed ₹${amount} from Seller ${sellerId}`);
};

export const reverseCommission = async (orderId: string, sellerId: string, commissionAmount: number, gstOnCommission: number) => {
  console.log(`Reversing Marketplace Commission for Order ${orderId}...`);

  const totalReversal = commissionAmount + gstOnCommission;
  const finTxnId = generateFinancialId('FIN');
  
  const finTxn: FinancialTransaction = {
    id: finTxnId,
    transactionType: 'REVERSAL',
    transactionReference: `REV-COMM-${orderId}`,
    orderId,
    sellerId,
    amount: totalReversal,
    currency: 'INR',
    transactionDate: new Date().toISOString(),
    status: 'SUCCESS',
    description: `Commission reversal for returned order ${orderId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM'
  };

  await setDoc(doc(db, 'financial_transactions', finTxnId), finTxn);

  // Reverse Commission: Debit Commission Rev & GST Payable, Credit Seller Payable
  await postLedgerTransaction(
    finTxnId,
    `Commission Reversal ${orderId}`,
    [
      { accountId: SYSTEM_ACCOUNTS.MARKETPLACE_COMMISSION_REV, amount: commissionAmount, currency: 'INR' },
      { accountId: SYSTEM_ACCOUNTS.GST_PAYABLE, amount: gstOnCommission, currency: 'INR' }
    ],
    [
      { accountId: getSellerPayableAccountId(sellerId), amount: totalReversal, currency: 'INR' }
    ]
  );
  
  console.log(`✅ Credited back ₹${totalReversal} commission to Seller ${sellerId}`);
};

export const recordShippingCost = async (orderId: string, amount: number) => {
  // TODO: Implement
  console.log(`Stub: recordShippingCost for ${orderId}`);
};

export const createSellerSettlement = async (
  sellerId: string, 
  periodStart: string, 
  periodEnd: string,
  breakdown: {
    grossSales: number,
    commission: number,
    fees: number,
    returns: number,
    netPayable: number
  }
) => {
  console.log(`Calculating Settlement for Seller ${sellerId}...`);
  
  // Note: In a production system, 'breakdown' is strictly derived by 
  // aggregating LedgerEntries for this seller's payable account over the period.

  const settlementId = generateFinancialId('SET');
  
  const settlement: SellerSettlement = {
    id: settlementId,
    sellerId,
    periodStart,
    periodEnd,
    openingBalance: 0, // Simplified
    grossSales: breakdown.grossSales,
    commission: breakdown.commission,
    marketplaceFees: breakdown.fees,
    shippingCharges: 0,
    returns: breakdown.returns,
    refunds: 0,
    penalties: 0,
    taxDeductions: 0, // e.g. TDS/TCS
    incentives: 0,
    adjustments: 0,
    netPayable: breakdown.netPayable,
    settlementStatus: 'APPROVED',
    settlementDate: new Date().toISOString(),
  };

  await setDoc(doc(db, 'seller_settlements', settlementId), settlement);
  console.log(`✅ Created Seller Settlement ${settlementId} for ₹${breakdown.netPayable}`);
  
  return settlementId;
};

export const processSellerPayout = async (settlementId: string, sellerId: string, netAmount: number, utr: string) => {
  console.log(`Processing Payout for Settlement ${settlementId}...`);

  const finTxnId = generateFinancialId('FIN');
  const finTxn: FinancialTransaction = {
    id: finTxnId,
    transactionType: 'SELLER_PAYOUT',
    transactionReference: utr,
    sellerId,
    settlementId,
    amount: netAmount,
    currency: 'INR',
    transactionDate: new Date().toISOString(),
    status: 'SUCCESS',
    description: `Payout processed for settlement ${settlementId}, UTR: ${utr}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM'
  };

  await setDoc(doc(db, 'financial_transactions', finTxnId), finTxn);

  // 1. Post Ledger Transaction for Bank Payout
  // Debit: Seller Payable Liability
  // Credit: Platform Bank Asset
  await postLedgerTransaction(
    finTxnId,
    `Seller Payout ${settlementId}`,
    [
      { accountId: getSellerPayableAccountId(sellerId), amount: netAmount, currency: 'INR' }
    ],
    [
      { accountId: SYSTEM_ACCOUNTS.BANK_ACCOUNT, amount: netAmount, currency: 'INR' }
    ]
  );

  // 2. Update Settlement Status
  await updateDoc(doc(db, 'seller_settlements', settlementId), {
    settlementStatus: 'PAID',
    payoutUtr: utr
  });
  
  console.log(`✅ Successfully Processed Payout of ₹${netAmount} to Seller ${sellerId}`);
};

export const recordGatewaySettlement = async (gatewaySettlementId: string) => {
  // TODO: Implement
  console.log(`Stub: recordGatewaySettlement for ${gatewaySettlementId}`);
};

export const reconcileBankTransaction = async (bankTxnId: string) => {
  // TODO: Implement
  console.log(`Stub: reconcileBankTransaction for ${bankTxnId}`);
};

export const createFinancialAdjustment = async (adminId: string, targetId: string, amount: number, type: 'CREDIT' | 'DEBIT') => {
  // TODO: Implement (Audit log + Ledger adjustment)
  console.log(`Stub: createFinancialAdjustment by ${adminId}`);
};
