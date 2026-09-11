MASTER PROMPT: E-COMMERCE MARKETPLACE FINANCIAL TRANSACTION SYSTEM

PROJECT CONTEXT
---------------
I am building an e-commerce marketplace platform similar to Amazon/Flipkart called DigiSewa.

The platform will have:
- Customers
- Sellers
- Products
- Orders
- Payments
- Payment gateways
- COD
- Shipping/couriers
- Returns
- Refunds
- Cancellations
- Seller commissions
- Seller settlements
- Seller payouts
- Coupons
- Cashback
- Wallet/store credit
- Referral/affiliate system
- Advertising
- Seller subscriptions
- GST/tax records
- TDS/TCS records where applicable
- Bank transactions
- Gateway settlements
- Chargebacks
- Company expenses
- Vendor payments
- Accounting ledger
- Financial reconciliation
- Admin adjustments
- Complete financial audit trail

IMPORTANT:
Do NOT design the financial system as only an "orders + payments" system.

Build a proper financial transaction architecture where every movement of money can be traced from:

ORDER
→ PAYMENT
→ PAYMENT GATEWAY
→ GATEWAY SETTLEMENT
→ BANK
→ SELLER LEDGER
→ SELLER SETTLEMENT
→ SELLER PAYOUT

The system must support double-entry accounting principles.

==================================================
1. CORE FINANCIAL PRINCIPLE
==================================================

Every financial event must create a unique financial transaction.

Each financial transaction should have:

- financial_transaction_id
- transaction_type
- transaction_reference
- order_id
- customer_id
- seller_id
- payment_id
- settlement_id
- parent_transaction_id
- amount
- currency
- debit_account
- credit_account
- transaction_date
- status
- description
- created_at
- updated_at
- created_by
- metadata

Never permanently modify historical financial transactions.

If something needs correction, create:
- reversal transaction
- adjustment transaction
- credit transaction
- debit transaction

Maintain complete audit history.

==================================================
2. CUSTOMER ORDER FINANCIAL RECORDS
==================================================

Maintain financial information for every order:

- Order ID
- Customer ID
- Seller ID
- Product ID
- SKU
- Quantity
- Item price
- Gross item value
- Product discount
- Seller-funded discount
- Platform-funded discount
- Coupon discount
- Shipping charge
- Handling charge
- Platform/convenience fee
- COD fee
- Tax/GST
- Other applicable charges
- Final customer payable amount
- Payment method
- Payment gateway
- Payment transaction ID
- Order financial status
- Settlement status

==================================================
3. CUSTOMER PAYMENT TRANSACTIONS
==================================================

Support:

- UPI
- Credit card
- Debit card
- Net banking
- Wallet
- BNPL
- COD
- EMI
- Gift card
- Store credit
- Bank transfer
- Payment gateway
- Partial payment
- Advance payment

Transaction types:

- PAYMENT_INITIATED
- PAYMENT_SUCCESS
- PAYMENT_FAILED
- PAYMENT_PENDING
- PAYMENT_CANCELLED
- PAYMENT_EXPIRED
- PAYMENT_REVERSED
- PAYMENT_REFUNDED
- PARTIAL_REFUND

Store:

- Payment ID
- Order ID
- Customer ID
- Amount
- Payment method
- Gateway
- Gateway transaction ID
- Gateway reference/RRN
- Payment date
- Payment status
- Settlement ID
- Settlement date
- Settlement status

==================================================
4. PAYMENT GATEWAY TRANSACTIONS
==================================================

Create a separate gateway transaction system.

Record:

- Gateway transaction ID
- Internal payment ID
- Order ID
- Customer ID
- Gross amount
- Gateway fee
- GST on gateway fee
- Net settlement amount
- Settlement ID
- Settlement date
- Gateway status
- Internal status
- Gateway response
- Gateway reference
- Reconciliation status

Support:

- Payment
- Failed payment
- Refund
- Partial refund
- Reversal
- Chargeback
- Chargeback reversal

==================================================
5. SELLER FINANCIAL LEDGER
==================================================

Every seller must have a financial account/ledger.

SELLER CREDITS:

- Product sales
- Shipping reimbursement
- Seller incentives
- Promotional reimbursement
- Return reimbursement
- Other credits
- Manual credits

SELLER DEBITS:

- Marketplace commission
- Fixed commission
- Collection fee
- Shipping fee
- Reverse shipping
- RTO charges
- Cancellation fee
- Penalties
- Advertising fees
- Subscription fees
- Packaging fees
- Tax deductions
- Other marketplace charges
- Manual debits

Never calculate seller balance only from the current order table.

Seller balance must come from the financial ledger.

==================================================
6. SELLER COMMISSION SYSTEM
==================================================

For every seller order calculate:

- Sale value
- Commission type
- Commission percentage
- Commission amount
- Fixed commission
- GST on commission
- Total commission deduction

Store:

- Commission ID
- Order ID
- Seller ID
- Product ID
- SKU
- Commission rule
- Commission rate
- Taxable commission amount
- GST amount
- Total deduction
- Status
- Created date

Commission rules must be configurable by:
- Category
- Product
- Seller
- Seller tier
- Promotion
- Date range

Do not hard-code commission rates.

==================================================
7. SELLER SETTLEMENT SYSTEM
==================================================

Create seller settlement periods.

Example calculation:

Gross seller sales
- Seller commission
- Marketplace fees
- Shipping charges
- Reverse shipping
- RTO charges
- Returns
- Refund adjustments
- Penalties
- Tax deductions
+ Seller incentives
+ Other credits
= NET SELLER PAYABLE

Maintain:

- Settlement ID
- Seller ID
- Settlement period start
- Settlement period end
- Opening balance
- Gross sales
- Commission
- Marketplace fees
- Shipping charges
- Returns
- Refunds
- Penalties
- Tax deductions
- Incentives
- Adjustments
- Net payable
- Payout status
- Settlement status
- Settlement date

Settlement statuses:

- DRAFT
- CALCULATED
- APPROVED
- PROCESSING
- PAID
- FAILED
- REVERSED
- ON_HOLD

==================================================
8. SELLER PAYOUT SYSTEM
==================================================

Maintain separate payout records.

Fields:

- Payout ID
- Seller ID
- Settlement ID
- Bank account ID
- Amount
- Payment method
- UTR
- Bank reference
- Initiated date
- Processed date
- Status
- Failure reason

Statuses:

- PENDING
- PROCESSING
- SUCCESS
- FAILED
- REVERSED
- ON_HOLD

Never mark a payout successful without a successful payment response/UTR where applicable.

==================================================
9. REFUND SYSTEM
==================================================

Support:

- Full refund
- Partial refund
- Product refund
- Shipping refund
- COD fee refund
- Convenience fee refund
- Coupon adjustment
- Wallet refund
- Bank refund
- Gateway refund

Record:

- Refund ID
- Order ID
- Payment ID
- Customer ID
- Seller ID
- Refund amount
- Refund reason
- Refund method
- Gateway refund ID
- Refund date
- Refund status
- Original transaction ID
- Reversal transaction ID

Statuses:

- REQUESTED
- APPROVED
- PROCESSING
- SUCCESS
- FAILED
- REVERSED

==================================================
10. RETURN FINANCIAL TRANSACTIONS
==================================================

Maintain:

- Return ID
- Order ID
- Seller ID
- Customer ID
- Product ID
- SKU
- Original amount
- Refund amount
- Return shipping cost
- Seller liability
- Platform liability
- Restocking fee
- Tax adjustment
- Commission reversal
- Final financial adjustment
- Return status

==================================================
11. CANCELLATION FINANCIAL TRANSACTIONS
==================================================

Support:

- Customer cancellation
- Seller cancellation
- Admin cancellation
- Partial cancellation
- Cancellation before shipment
- Cancellation after shipment
- Cancellation after delivery

Record:

- Original order amount
- Cancellation fee
- Refund amount
- Shipping cost
- Seller adjustment
- Platform adjustment
- Commission reversal
- Tax adjustment

==================================================
12. COD FINANCIAL SYSTEM
==================================================

COD must have its own reconciliation system.

Record:

- COD order
- COD amount
- Courier
- AWB
- Amount collected
- Collection date
- COD fee
- Courier remittance
- Courier settlement ID
- Bank deposit
- Shortage
- Excess
- Difference
- Reconciliation status

Support:

- COD_COLLECTED
- COD_REMITTED
- COD_SETTLED
- COD_SHORT
- COD_EXCESS
- COD_RECONCILED

==================================================
13. SHIPPING FINANCIAL TRANSACTIONS
==================================================

Track:

- Forward shipping
- Reverse shipping
- RTO shipping
- Customer shipping charge
- Seller shipping charge
- Platform shipping subsidy
- Courier cost
- Weight discrepancy charge
- Shipping penalty
- Packaging charge
- Fulfilment charge

Record:

- Shipment ID
- Order ID
- Seller ID
- Courier ID
- AWB
- Shipping cost
- Customer charged amount
- Seller charged amount
- Platform subsidy
- GST
- Settlement status

==================================================
14. RTO FINANCIAL SYSTEM
==================================================

Track:

- RTO order
- Forward shipping
- Reverse shipping
- RTO shipping
- COD charge
- Refund
- Seller liability
- Platform liability
- Courier adjustment
- Seller settlement adjustment

==================================================
15. COUPON FINANCIAL SYSTEM
==================================================

Coupons can be:

- Seller-funded
- Platform-funded
- Shared-funded

For every coupon transaction record:

- Coupon ID
- Order ID
- Discount amount
- Seller-funded amount
- Platform-funded amount
- Customer-funded amount if applicable
- Tax impact
- Financial transaction ID

==================================================
16. CASHBACK SYSTEM
==================================================

Track:

- Cashback earned
- Cashback credited
- Cashback used
- Cashback expired
- Cashback reversed
- Cashback refunded

Every cashback event must create a ledger transaction.

==================================================
17. WALLET / STORE CREDIT
==================================================

If wallet functionality exists, create:

CUSTOMER WALLET

CREDITS:
- Refund
- Cashback
- Promotional credit
- Referral reward
- Manual credit

DEBITS:
- Order payment
- Wallet usage
- Expiry
- Manual adjustment

Never directly update wallet balance without creating a wallet ledger transaction.

Wallet balance should be:

SUM(CREDITS) - SUM(DEBITS)

or derived from a properly maintained ledger balance.

==================================================
18. REFERRAL FINANCIAL SYSTEM
==================================================

Track:

- Referral generated
- Referral qualified
- Referral reward
- Reward credited
- Reward used
- Reward expired
- Reward reversed

Maintain:

- Referral transaction ID
- Referrer ID
- Referred customer ID
- Order ID
- Reward amount
- Status
- Date

==================================================
19. AFFILIATE SYSTEM
==================================================

Track:

- Affiliate ID
- Order ID
- Commissionable amount
- Commission rate
- Commission amount
- Tax
- Withholding
- Net payable
- Payout
- Payout status

==================================================
20. SELLER SUBSCRIPTION SYSTEM
==================================================

If sellers have subscription plans, track:

- Subscription ID
- Seller ID
- Plan ID
- Amount
- GST
- Payment ID
- Start date
- End date
- Renewal
- Upgrade
- Downgrade
- Cancellation
- Refund

Transaction types:

- SUBSCRIPTION_PAYMENT
- SUBSCRIPTION_RENEWAL
- SUBSCRIPTION_REFUND
- SUBSCRIPTION_UPGRADE
- SUBSCRIPTION_CANCELLATION

==================================================
21. SELLER ADVERTISING SYSTEM
==================================================

Support future marketplace advertising.

Track:

- Campaign
- Seller
- Budget
- Amount charged
- Sponsored listing
- Sponsored product
- CPC charges
- Advertising credit
- Refund
- Adjustment

==================================================
22. PLATFORM SERVICE FEES
==================================================

Support configurable:

- Marketplace commission
- Listing fee
- Subscription fee
- Payment collection fee
- Shipping fee
- Packaging fee
- Advertising fee
- Cancellation fee
- Return fee
- RTO fee
- Convenience fee
- Fulfilment fee
- Warehousing fee

Every fee must have its own financial transaction.

==================================================
23. GST / TAX SYSTEM
==================================================

Create a configurable tax system.

Track where applicable:

- Output GST
- Input GST
- GST on marketplace services
- GST on shipping/services
- GST collected
- GST paid
- Tax adjustments
- Credit notes
- Debit notes
- Tax invoices

Do not hard-code tax rates.

Create configurable:

- Tax type
- Tax rate
- Effective date
- Product/category applicability
- Seller applicability
- State
- Transaction type

The system should support future tax-rate changes without modifying historical transactions.

IMPORTANT:
Tax calculations must be configurable according to the applicable Indian tax rules and business structure. Do not assume every marketplace transaction has the same tax treatment.

==================================================
24. TDS / TCS / WITHHOLDING
==================================================

Create a configurable withholding system.

Track:

- Seller
- Tax type
- Taxable amount
- Rate
- Deducted amount
- Settlement ID
- Transaction date
- Filing/reference number
- Adjustment
- Reversal

Do not hard-code tax rates.

==================================================
25. INVOICE SYSTEM
==================================================

Maintain financial documents for:

- Customer invoices
- Seller service invoices
- Commission invoices
- Advertising invoices
- Subscription invoices
- Shipping invoices
- Vendor invoices
- Credit notes
- Debit notes

Every invoice must have:

- Unique invoice number
- Invoice date
- Party
- Tax details
- Taxable value
- Tax
- Total amount
- Reference transaction
- Status

==================================================
26. CREDIT NOTE / DEBIT NOTE
==================================================

Support:

- Credit note
- Debit note
- Refund-related credit note
- Commission adjustment
- Tax adjustment
- Shipping adjustment
- Seller adjustment

Never delete the original invoice.

Reference the original invoice and create an adjustment document.

==================================================
27. BANK ACCOUNT SYSTEM
==================================================

Maintain platform bank accounts.

Track:

- Bank account
- Account type
- Bank name
- Account identifier
- Transaction date
- Credit
- Debit
- Balance
- UTR
- Reference
- Description
- Reconciliation status

Do not store unnecessary sensitive banking credentials.

==================================================
28. BANK TRANSACTIONS
==================================================

Support:

- Customer payment receipt
- Gateway settlement
- Seller payout
- Vendor payment
- Refund
- Bank charges
- Tax payment
- Salary payment
- Operating expense
- Manual bank adjustment

==================================================
29. GATEWAY SETTLEMENTS
==================================================

Create gateway settlement records.

Track:

- Settlement ID
- Gateway
- Settlement date
- Gross amount
- Gateway fees
- GST on fees
- Refunds
- Adjustments
- Net amount
- Bank reference
- UTR
- Reconciliation status

==================================================
30. BANK / GATEWAY RECONCILIATION
==================================================

Build a reconciliation module.

The system must compare:

ORDER AMOUNT
→ PAYMENT AMOUNT
→ GATEWAY TRANSACTION
→ GATEWAY SETTLEMENT
→ BANK TRANSACTION

Detect:

- Missing payment
- Duplicate payment
- Short settlement
- Excess settlement
- Missing bank entry
- Wrong amount
- Wrong transaction reference
- Failed settlement
- Refund mismatch

Every reconciliation issue should have:

- Reconciliation ID
- Transaction ID
- Expected amount
- Actual amount
- Difference
- Reason
- Status
- Resolved by
- Resolved date

==================================================
31. CHARGEBACK SYSTEM
==================================================

Track:

- Chargeback ID
- Payment ID
- Order ID
- Customer
- Amount
- Reason
- Gateway
- Chargeback date
- Representment amount
- Chargeback fee
- Final decision
- Debit/credit adjustment
- Status

Statuses:

- RECEIVED
- UNDER_REVIEW
- REPRESENTED
- WON
- LOST
- REVERSED

==================================================
32. VENDOR FINANCIAL SYSTEM
==================================================

Track vendor:

- Vendor invoice
- Invoice amount
- GST
- TDS if applicable
- Payment
- Due date
- Credit note
- Debit note
- Payment status

Vendors may include:

- Courier companies
- Warehouses
- Packaging suppliers
- Software providers
- Marketing agencies
- Cloud providers
- Professional services
- Other service providers

==================================================
33. COMPANY EXPENSE SYSTEM
==================================================

Track:

- Salary
- Rent
- Electricity
- Internet
- Software
- Advertising
- Marketing
- Travel
- Office expenses
- Equipment
- Legal fees
- Accounting fees
- Insurance
- Bank charges
- Other operating expenses

Each expense must have:

- Expense ID
- Category
- Vendor
- Amount
- Tax
- Payment method
- Payment transaction
- Date
- Attachment/reference
- Approval status

==================================================
34. MANUAL FINANCIAL ADJUSTMENTS
==================================================

Admin must be able to create:

- Customer credit
- Customer debit
- Seller credit
- Seller debit
- Commission adjustment
- Shipping adjustment
- Tax adjustment
- Refund adjustment
- Settlement adjustment

IMPORTANT:

Admin must NEVER directly edit historical ledger entries.

Instead:

Original transaction
→ Adjustment transaction
→ Audit log

Require:

- Adjustment reason
- Admin ID
- Timestamp
- Old reference
- New transaction
- Approval where required

==================================================
35. DOUBLE-ENTRY ACCOUNTING LEDGER
==================================================

This is the core financial system.

Create:

ledger_accounts
ledger_transactions
ledger_entries

Every financial transaction must contain at least:

- One debit entry
- One credit entry

Total debit must always equal total credit.

Example:

Customer pays ₹1,180.

Debit:
Payment Gateway Receivable = ₹1,180

Credit:
Customer/Sales Revenue = ₹1,000
GST Payable = ₹180

If gateway fee is ₹23.60:

Debit:
Gateway Expense = ₹20
Input GST = ₹3.60

Credit:
Payment Gateway Receivable = ₹23.60

The actual account mapping must be configurable according to the business/accounting model.

==================================================
36. CHART OF ACCOUNTS
==================================================

Create configurable accounts such as:

ASSETS:
- Bank
- Cash
- Payment Gateway Receivable
- COD Receivable
- Seller Receivable
- Other Receivables

LIABILITIES:
- Seller Payable
- Customer Wallet Liability
- Refund Payable
- GST Payable
- TDS/TCS Payable
- Vendor Payable

REVENUE:
- Marketplace Commission Revenue
- Shipping Revenue
- Advertising Revenue
- Subscription Revenue
- Convenience Fee Revenue
- Other Platform Revenue

EXPENSES:
- Payment Gateway Expense
- Shipping Expense
- Reverse Shipping Expense
- RTO Expense
- Advertising Expense
- Salary Expense
- Rent Expense
- Software Expense
- Bank Charges
- Other Operating Expenses

==================================================
37. FINANCIAL TRANSACTION TYPES
==================================================

Create a centralized transaction-type master.

Include at minimum:

ORDER_PAYMENT
ORDER_PAYMENT_FAILED
ORDER_PAYMENT_REVERSED

SELLER_SALE
SELLER_COMMISSION
SELLER_FEE
SELLER_SETTLEMENT
SELLER_PAYOUT

REFUND
PARTIAL_REFUND
REFUND_REVERSAL

RETURN
CANCELLATION
RTO

COD_COLLECTION
COD_SETTLEMENT

SHIPPING_CHARGE
REVERSE_SHIPPING
RTO_SHIPPING

COUPON_DISCOUNT
CASHBACK
WALLET_CREDIT
WALLET_DEBIT

REFERRAL_REWARD
AFFILIATE_COMMISSION

SUBSCRIPTION_FEE
ADVERTISEMENT_FEE

GATEWAY_FEE
BANK_FEE

GST_TRANSACTION
TDS_TRANSACTION
TCS_TRANSACTION

CHARGEBACK
CHARGEBACK_REVERSAL

VENDOR_PAYMENT
EMPLOYEE_PAYMENT
OPERATING_EXPENSE

CREDIT_NOTE
DEBIT_NOTE

MANUAL_CREDIT
MANUAL_DEBIT
ADJUSTMENT
REVERSAL

==================================================
38. FINANCIAL TRANSACTION STATUS
==================================================

Use standardized statuses:

PENDING
PROCESSING
SUCCESS
FAILED
CANCELLED
REVERSED
REFUNDED
PARTIALLY_REFUNDED
ON_HOLD
RECONCILED
UNRECONCILED

Do not use inconsistent status names across modules.

==================================================
39. UNIQUE FINANCIAL TRANSACTION ID
==================================================

Every financial transaction must have a unique ID.

Example:

FIN-20260904-000001
FIN-20260904-000002
FIN-20260904-000003

Also maintain:

- Internal transaction ID
- External transaction ID
- Gateway transaction ID
- Settlement ID
- UTR
- Order ID
- Seller ID

Allow complete traceability.

==================================================
40. FINANCIAL TRANSACTION TRACEABILITY
==================================================

The admin should be able to open any financial transaction and see:

Financial Transaction
↓
Order
↓
Customer
↓
Seller
↓
Payment
↓
Gateway Transaction
↓
Gateway Settlement
↓
Bank Transaction
↓
Commission
↓
Seller Ledger
↓
Seller Settlement
↓
Seller Payout

If refund/return exists:

Order
↓
Return
↓
Refund
↓
Gateway Refund
↓
Seller Adjustment
↓
Commission Reversal
↓
Tax Adjustment

==================================================
41. SELLER BALANCE CALCULATION
==================================================

Seller balance must be ledger-based.

Formula:

Opening Seller Balance
+ Product Sales
+ Seller Credits
+ Incentives
- Commission
- Marketplace Fees
- Shipping Charges
- Reverse Shipping
- RTO
- Returns
- Refunds
- Penalties
- Tax Deductions
- Seller Debits
- Previous Payouts
= Current Seller Payable/Receivable

Do not simply calculate seller balance using:

total orders - commission

==================================================
42. CUSTOMER FINANCIAL BALANCE
==================================================

Track:

- Total paid
- Total refunded
- Wallet balance
- Cashback balance
- Outstanding amount
- Store credit
- Promotional credit

Customer wallet and credit must be ledger-based.

==================================================
43. PLATFORM FINANCIAL VIEW
==================================================

Calculate separately:

GMV
Gross Sales
Net Sales
Marketplace Commission Revenue
Shipping Revenue
Advertising Revenue
Subscription Revenue
Convenience Fee Revenue
Other Platform Revenue

Expenses:

Gateway Fees
Shipping Costs
Reverse Shipping
RTO Costs
Refund Costs
Marketing
Salary
Rent
Software
Bank Charges
Other Operating Expenses

Display:

Gross Platform Revenue
Total Platform Expenses
Net Platform Operating Result

IMPORTANT:
Do not consider the entire customer payment as platform revenue.

Seller payable amounts must remain separate from platform revenue.

==================================================
44. FINANCIAL DASHBOARD
==================================================

Create admin dashboard showing:

GMV
Gross Sales
Net Sales
Platform Revenue
Commission Revenue
Shipping Revenue
Advertising Revenue
Refund Amount
Return Amount
COD Outstanding
Gateway Receivable
Seller Payable
Customer Wallet Liability
Tax Payable
Vendor Payable
Operating Expenses
Net Financial Result

Allow filters:

- Today
- Yesterday
- This week
- This month
- Previous month
- Current financial year
- Custom date range
- Seller
- Category
- Payment method
- Gateway
- Transaction type
- Status

==================================================
45. SELLER FINANCIAL DASHBOARD
==================================================

Seller should see:

- Total sales
- Gross sales
- Commission
- Marketplace fees
- Shipping charges
- Returns
- Refunds
- Penalties
- Tax deductions
- Incentives
- Current payable
- Pending settlement
- Completed settlement
- Payout history

Seller must NOT see other sellers' financial information.

==================================================
46. FINANCIAL REPORTS
==================================================

Generate reports:

1. Sales report
2. Payment report
3. Gateway report
4. Gateway settlement report
5. Seller settlement report
6. Seller payout report
7. Commission report
8. Refund report
9. Return report
10. Cancellation report
11. COD report
12. Shipping cost report
13. RTO report
14. Coupon report
15. Cashback report
16. Wallet report
17. Tax report
18. GST report
19. TDS/TCS report
20. Chargeback report
21. Bank reconciliation report
22. Vendor payment report
23. Expense report
24. Revenue report
25. Profit/loss report
26. Ledger report
27. Trial balance
28. Balance sheet support
29. Cash flow support
30. Financial audit report

Reports should support:

- CSV
- Excel
- PDF

==================================================
47. AUDIT LOG
==================================================

Every financial modification must create an immutable audit record.

Track:

- Audit ID
- User/Admin ID
- Action
- Module
- Transaction ID
- Old value
- New value
- Reason
- IP if appropriate
- Timestamp

Actions:

CREATE
UPDATE
APPROVE
REJECT
REVERSE
REFUND
ADJUST
SETTLE
PAYOUT
RECONCILE

Never allow deletion of financial history.

==================================================
48. DATABASE DESIGN REQUIREMENTS
==================================================

Create separate tables for:

customers
sellers
orders
order_items

payments
payment_transactions
payment_gateways
gateway_settlements
gateway_fees

seller_accounts
seller_commissions
seller_fees
seller_settlements
seller_payouts

refunds
returns
cancellations
rto_transactions

shipments
shipping_transactions
courier_settlements

coupons
coupon_transactions
cashback_transactions

wallets
wallet_transactions

referrals
referral_transactions
affiliates
affiliate_transactions

seller_subscriptions
advertising_campaigns
advertising_transactions

tax_transactions
tax_invoices
credit_notes
debit_notes
tax_withholdings

bank_accounts
bank_transactions
bank_reconciliation

vendors
vendor_invoices
vendor_payments
company_expenses

ledger_accounts
ledger_transactions
ledger_entries

financial_transactions
financial_adjustments
financial_audit_logs

Use proper:

- Primary keys
- Foreign keys
- Unique constraints
- Indexes
- Decimal data types for money
- Timestamps
- Soft deletion only where appropriate

NEVER use FLOAT or DOUBLE for monetary values.

Use DECIMAL with suitable precision, e.g.:

DECIMAL(18,2)

For higher precision calculations where required, use an appropriate DECIMAL scale.

==================================================
49. FINANCIAL DATA SAFETY
==================================================

Money calculations must be precise.

Use database transactions for operations involving multiple financial records.

For example:

Order payment
→ payment record
→ ledger transaction
→ ledger entries
→ seller ledger

All required financial records should succeed together or rollback together.

Prevent:

- Duplicate payment
- Duplicate refund
- Duplicate seller payout
- Duplicate settlement
- Duplicate ledger entry

Use idempotency keys where appropriate.

==================================================
50. CONCURRENCY CONTROL
==================================================

The financial system must be safe when:

- Two payments arrive simultaneously
- Two refund requests occur simultaneously
- Settlement runs while an order is being returned
- Admin adjusts a seller account while payout is processing

Use:

- Database transactions
- Row locking where appropriate
- Idempotency
- Unique constraints
- Atomic balance updates where needed

==================================================
51. NO DIRECT BALANCE MANIPULATION
==================================================

Do NOT write code such as:

seller.balance = seller.balance + amount

without creating the corresponding ledger transaction.

Instead:

Financial Event
→ Ledger Transaction
→ Debit/Credit Entries
→ Derived/updated balance

Every balance change must have a financial explanation.

==================================================
52. FINANCIAL EVENT ENGINE
==================================================

Create a centralized financial service/module.

Examples:

recordCustomerPayment()
recordSellerSale()
calculateCommission()
recordSellerFee()
createRefund()
reverseCommission()
recordShippingCost()
createSellerSettlement()
processSellerPayout()
recordGatewaySettlement()
reconcileBankTransaction()
createFinancialAdjustment()

Business modules should call this financial service instead of directly manipulating financial balances.

==================================================
53. ORDER PAYMENT EXAMPLE
==================================================

Example:

Customer buys product for ₹1,000.

GST = ₹180.

Customer pays:

₹1,180

System should create:

Payment:
₹1,180

Ledger:

Debit:
Payment Gateway Receivable ₹1,180

Credit:
Sales/appropriate revenue account ₹1,000
GST Payable ₹180

Then gateway fee:

Gateway fee ₹20
GST on gateway fee ₹3.60

Ledger:

Debit:
Gateway Expense ₹20
Input GST ₹3.60

Credit:
Payment Gateway Receivable ₹23.60

The actual accounting treatment must remain configurable.

==================================================
54. RETURN EXAMPLE
==================================================

Original sale:

₹1,180

Customer returns product.

Create:

Return transaction
Refund transaction
Gateway refund
Seller adjustment
Commission reversal where applicable
Tax adjustment where applicable
Shipping adjustment where applicable
Ledger reversal/adjustment

Never delete the original sale.

==================================================
55. SELLER SETTLEMENT EXAMPLE
==================================================

Seller sales:

₹100,000

Commission:

₹10,000

Shipping:

₹5,000

Returns:

₹3,000

Other fees:

₹1,000

Calculate:

Seller payable = ₹81,000

Create settlement:

Settlement ID
Gross sales
Commission
Shipping
Returns
Fees
Net payable
Payout status

Then create seller payout separately.

==================================================
56. FINANCIAL PERIOD CONTROL
==================================================

Support accounting periods.

Examples:

- Monthly
- Quarterly
- Financial year

Allow period closing.

Once a financial period is closed:

- Do not edit historical transactions.
- Use adjustment/reversal entries.

Maintain:

- Period ID
- Start date
- End date
- Status
- Closed by
- Closed date

Statuses:

OPEN
CLOSED
LOCKED

==================================================
57. ADMIN PERMISSIONS
==================================================

Create role-based permissions.

Examples:

FINANCE_VIEW
FINANCE_CREATE
FINANCE_ADJUST
FINANCE_APPROVE
REFUND_APPROVE
SELLER_SETTLEMENT
SELLER_PAYOUT
BANK_RECONCILIATION
TAX_VIEW
TAX_MANAGE
AUDIT_VIEW

Sensitive financial actions should require appropriate permissions.

==================================================
58. IMPLEMENTATION REQUIREMENT
==================================================

Before writing code:

1. Inspect the existing project.
2. Identify existing database structure.
3. Identify existing order/payment/seller tables.
4. Reuse existing architecture where appropriate.
5. Do not duplicate existing functionality.
6. Do not break existing order/payment functionality.
7. Create migration scripts for new tables.
8. Create proper foreign keys and indexes.
9. Create backend services.
10. Create APIs.
11. Create admin financial dashboard.
12. Create seller financial dashboard.
13. Add validation.
14. Add authorization.
15. Add audit logs.
16. Add reconciliation.
17. Add reporting.
18. Add automated tests.

==================================================
59. IMPORTANT DEVELOPMENT RULES
==================================================

DO NOT:

- Store money as FLOAT
- Delete financial transactions
- Directly modify seller balances
- Directly modify wallet balances
- Hard-code tax rates
- Hard-code commission rates
- Trust payment success based only on frontend response
- Mark gateway settlements manually without reconciliation
- Create duplicate financial records
- Mix seller money and platform revenue
- Treat GMV as platform revenue

DO:

- Use DECIMAL
- Use database transactions
- Use idempotency
- Use double-entry ledger
- Maintain audit logs
- Maintain transaction references
- Maintain reconciliation
- Maintain immutable financial history
- Use configurable commission rules
- Use configurable tax rules
- Use proper RBAC
- Use automated tests

==================================================
60. FINAL ARCHITECTURE
==================================================

The final architecture should follow:

CUSTOMER
   ↓
ORDER
   ↓
PAYMENT
   ↓
PAYMENT GATEWAY
   ↓
GATEWAY SETTLEMENT
   ↓
BANK
   ↓
FINANCIAL LEDGER
   ↓
SELLER ACCOUNT
   ↓
SELLER SETTLEMENT
   ↓
SELLER PAYOUT
   ↓
BANK

And for returns:

ORDER
   ↓
RETURN
   ↓
REFUND
   ↓
GATEWAY REFUND
   ↓
SELLER ADJUSTMENT
   ↓
COMMISSION REVERSAL
   ↓
TAX ADJUSTMENT
   ↓
LEDGER ADJUSTMENT

==================================================
FINAL TASK FOR ANTIGRAVITY
==================================================

First analyze my existing project and database.

Then provide an implementation plan showing:

1. Existing financial functionality
2. Missing financial functionality
3. New database tables required
4. Changes required to existing tables
5. Relationships/ER structure
6. Financial transaction lifecycle
7. Ledger architecture
8. Seller settlement architecture
9. Payment reconciliation architecture
10. Refund/return architecture
11. Tax architecture
12. Admin dashboard architecture
13. Seller dashboard architecture
14. API endpoints required
15. Security requirements
16. Migration strategy
17. Testing strategy

Do not immediately overwrite existing code.

After analysis, implement the financial system module-by-module while preserving all existing functionality.

The resulting system must be scalable enough for a large marketplace and must maintain a complete, auditable financial history for every rupee entering, leaving, or moving within the platform.