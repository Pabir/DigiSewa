import { BankAccountDetails } from '../types/adminTypes';

export interface BankValidationResponse {
  success: boolean;
  message: string;
  verifiedName?: string;
}

/**
 * Mocks a Penny Drop bank validation service for COD refunds.
 * In a real-world scenario, this would call an external API (like Razorpay, Cashfree, etc.)
 * to deposit a small amount (e.g. Rs 1) to verify the account details.
 */
export async function validateBankDetailsPennyDrop(details: BankAccountDetails): Promise<BankValidationResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Basic mock validation logic
      if (!details.accountNumber || details.accountNumber.length < 9) {
        resolve({
          success: false,
          message: 'Invalid account number length.',
        });
        return;
      }

      if (!details.ifscCode || details.ifscCode.length !== 11) {
        resolve({
          success: false,
          message: 'Invalid IFSC code format.',
        });
        return;
      }

      // Simulate a successful verification
      resolve({
        success: true,
        message: 'Bank account verified successfully.',
        verifiedName: details.accountName.toUpperCase(),
      });
    }, 1500); // Simulate network delay
  });
}
