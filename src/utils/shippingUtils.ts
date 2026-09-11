export const calculateShadowfaxDeliveryCharge = (
  originPincode: string,
  destinationPincode: string
): number => {
  let baseCharge = 59;
  
  if (!originPincode || !destinationPincode || originPincode.length !== 6 || destinationPincode.length !== 6) {
    // Default to Zone C/D if pincodes are invalid or not provided
    baseCharge = 59;
  } else if (originPincode.substring(0, 5) === destinationPincode.substring(0, 5)) {
    // Zone A: First 5 digits match, only 6th is different
    baseCharge = 39;
  } else if (originPincode.substring(0, 4) === destinationPincode.substring(0, 4)) {
    // Zone B: First 4 digits match, 5th and 6th are different
    baseCharge = 49;
  } else {
    // Rest: Zone C/D and E
    // We'll default to Zone C/D (Metro & ROI) for others, as it's the most common.
    baseCharge = 59;
  }

  // Add 18% GST and round to 2 decimal places
  return Number((baseCharge * 1.18).toFixed(2));
};
