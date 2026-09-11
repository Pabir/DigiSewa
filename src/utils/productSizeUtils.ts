import { ClothSizeVariant } from '../types';

export type WearType = 'upper' | 'lower' | 'footwear' | 'other';
export type GenderType = 'men' | 'women' | 'unisex';

export interface MeasurementInfo {
  wearType: WearType;
  gender: GenderType;
  primaryKey?: 'chestInches' | 'breastInches' | 'waistInches';
  fullLabel: string;      // e.g., "Chest (in inches)" / "Breast (in inches)" / "Waist (in inches)" / "Footwear Sizes (IND)"
  shortLabel: string;     // e.g., "Chest" / "Breast" / "Waist" / "Footwear"
  headerLabel: string;    // e.g., "Chest (Inch)" / "Breast (Inch)" / "Waist (Inch)" / "Footwear Size (IND)"
  pillSuffix: string;     // e.g., "Chest" / "Breast" / "Waist" / ""
}

/**
 * Determine wear type (upper vs lower vs footwear vs other) based on category inputs or strings
 */
export function getWearType(
  categoryOrL1?: string | null,
  subcategoryOrL2?: string | null,
  l3?: string | null,
  l4?: string | null,
  title?: string | null,
  tags?: string[]
): WearType {
  const combined = [
    categoryOrL1,
    subcategoryOrL2,
    l3,
    l4,
    title,
    ...(tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Footwear keywords
  const footwearKeywords = [
    'footwear',
    'shoe',
    'shoes',
    'sneaker',
    'sneakers',
    'sandal',
    'sandals',
    'boot',
    'boots',
    'slipper',
    'slippers',
    'flip flop',
    'flip flops',
    'flip-flop',
    'flip-flops',
    'loafer',
    'loafers',
    'heel',
    'heels',
    'flat',
    'flats',
    'chappal',
    'chappals',
    'jutti',
    'mojari',
    'crocs',
  ];

  for (const kw of footwearKeywords) {
    if (combined.includes(kw)) {
      return 'footwear';
    }
  }

  // Lower wear keywords
  const lowerKeywords = [
    'bottom',
    'bottomwear',
    'jeans',
    'trouser',
    'trousers',
    'pant',
    'pants',
    'short',
    'shorts',
    'skirt',
    'skirts',
    'legging',
    'leggings',
    'trackpant',
    'trackpants',
    'track pant',
    'track pants',
    'lower',
    'pyjama',
    'pyjamas',
    'pajama',
    'pajamas',
    'palazzo',
    'palazzos',
    'jogger',
    'joggers',
    'three fourths',
    'capri',
  ];

  for (const kw of lowerKeywords) {
    if (combined.includes(kw)) {
      return 'lower';
    }
  }

  // Upper wear keywords
  const upperKeywords = [
    'top',
    'topwear',
    'tshirt',
    'tshirts',
    't-shirt',
    't-shirts',
    'shirt',
    'shirts',
    'kurta',
    'kurtas',
    'kurti',
    'kurtis',
    'dress',
    'dresses',
    'tunic',
    'tunics',
    'jacket',
    'jackets',
    'hoodie',
    'hoodies',
    'blazer',
    'blazers',
    'coat',
    'coats',
    'sweatshirt',
    'sweatshirts',
    'upper',
    'blouse',
    'ethnic wear',
    'ethnic_wear',
  ];

  for (const kw of upperKeywords) {
    if (combined.includes(kw)) {
      return 'upper';
    }
  }

  // Default to upper if fashion category
  if (combined.includes('fashion') || combined.includes('clothing') || combined.includes('apparel')) {
    return 'upper';
  }

  return 'other';
}

/**
 * Determine gender (women vs men vs unisex)
 */
export function getGenderType(
  categoryOrL1?: string | null,
  subcategoryOrL2?: string | null,
  l3?: string | null,
  l4?: string | null,
  title?: string | null,
  tags?: string[]
): GenderType {
  // 1. Check Category Path First (Highest Priority)
  const categoryStr = [categoryOrL1, subcategoryOrL2, l3, l4]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Word boundary regex check for Men in Category
  if (/\b(men|mens|male|boys|boy)\b/i.test(categoryStr)) {
    if (!/\b(women|womens|female|ladies|girls|girl)\b/i.test(categoryStr)) {
      return 'men';
    }
  }

  // Word boundary regex check for Women in Category
  if (/\b(women|womens|female|ladies|girls|girl|kurti|kurtis|saree|sarees|lehenga|blouse)\b/i.test(categoryStr)) {
    return 'women';
  }

  // 2. Fallback to Title & Tags if category is gender-neutral
  const titleStr = [title, ...(tags || [])].filter(Boolean).join(' ').toLowerCase();

  if (/\b(women|womens|female|ladies|girls|girl|kurti|kurtis|saree|sarees|lehenga|blouse)\b/i.test(titleStr)) {
    return 'women';
  }

  if (/\b(men|mens|male|boys|boy)\b/i.test(titleStr)) {
    return 'men';
  }

  return 'men'; // default
}

/**
 * Get exact measurement field and labels for product or category details
 */
export function getMeasurementInfo(
  categoryOrL1?: string | null,
  subcategoryOrL2?: string | null,
  l3?: string | null,
  l4?: string | null,
  title?: string | null,
  tags?: string[]
): MeasurementInfo {
  const wearType = getWearType(categoryOrL1, subcategoryOrL2, l3, l4, title, tags);
  const gender = getGenderType(categoryOrL1, subcategoryOrL2, l3, l4, title, tags);

  if (wearType === 'footwear') {
    return {
      wearType: 'footwear',
      gender,
      fullLabel: 'Footwear Sizes (IND Standard)',
      shortLabel: 'Footwear Size',
      headerLabel: 'Footwear Size (IND)',
      pillSuffix: '',
    };
  }

  if (wearType === 'lower') {
    return {
      wearType: 'lower',
      gender,
      primaryKey: 'waistInches',
      fullLabel: 'Waist (in inches)',
      shortLabel: 'Waist',
      headerLabel: 'Waist (Inch)',
      pillSuffix: 'Waist',
    };
  }

  // Upper wear logic:
  // Mens upper wear -> Chest (in inches)
  // Womens upper wear -> Breast (in inches)
  if (gender === 'women') {
    return {
      wearType: 'upper',
      gender: 'women',
      primaryKey: 'breastInches',
      fullLabel: 'Breast (in inches)',
      shortLabel: 'Breast',
      headerLabel: 'Breast (Inch)',
      pillSuffix: 'Breast',
    };
  }

  return {
    wearType: 'upper',
    gender: 'men',
    primaryKey: 'chestInches',
    fullLabel: 'Chest (in inches)',
    shortLabel: 'Chest',
    headerLabel: 'Chest (Inch)',
    pillSuffix: 'Chest',
  };
}

/**
 * Helper to extract the numeric measurement value for a size variant given measurement info or size variant properties
 */
export function getSizeVariantMeasurement(
  sz: ClothSizeVariant,
  info: MeasurementInfo
): { val: number | undefined; label: string } {
  if (info.wearType === 'footwear') {
    return { val: undefined, label: '' };
  }
  if (info.primaryKey === 'breastInches') {
    const val = sz.breastInches ?? sz.chestInches; // fallback to chestInches if breastInches was not set
    return { val, label: 'Breast' };
  } else if (info.primaryKey === 'chestInches') {
    const val = sz.chestInches ?? sz.breastInches;
    return { val, label: 'Chest' };
  } else {
    const val = sz.waistInches;
    return { val, label: 'Waist' };
  }
}
