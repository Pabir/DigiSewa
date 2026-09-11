import {
  COLOR_OPTIONS,
  FABRIC_OPTIONS,
  FIT_SHAPE_OPTIONS,
  GENERIC_NAME_OPTIONS,
  NET_QUANTITY_OPTIONS,
  NECK_OPTIONS,
  OCCASION_OPTIONS,
  PATTERN_OPTIONS,
  PRINT_PATTERN_TYPE_OPTIONS,
  SLEEVE_LENGTH_OPTIONS,
  COUNTRY_OF_ORIGIN_OPTIONS,
  SOLE_MATERIAL_OPTIONS,
  FASTENING_OPTIONS,
  TOE_TYPE_OPTIONS,
  UPPER_MATERIAL_OPTIONS,
} from '../constants/catalogDropdownOptions';

export type CategoryType = 'topwear' | 'bottomwear' | 'footwear' | 'ethnic' | 'accessories' | 'general';

export interface FieldAttributeConfig {
  key: string;
  label: string;
  required?: boolean;
  type: 'dropdown' | 'text' | 'number';
  options?: string[];
  defaultValue?: string;
  section: 'details' | 'attributes';
}

export interface CategoryAttributeSchema {
  categoryType: CategoryType;
  fields: FieldAttributeConfig[];
}

/**
 * Classify category into CategoryType based on category tree & title strings
 */
export function classifyCategory(
  l1?: string | null,
  l2?: string | null,
  l3?: string | null,
  l4?: string | null,
  title?: string | null
): CategoryType {
  const combined = [l1, l2, l3, l4, title].filter(Boolean).join(' ').toLowerCase();

  // Footwear
  const footwearKw = ['footwear', 'shoe', 'shoes', 'sneaker', 'sandal', 'boot', 'slipper', 'heel', 'flat', 'chappal', 'loafer'];
  if (footwearKw.some((kw) => combined.includes(kw))) {
    return 'footwear';
  }

  // Bottomwear
  const bottomKw = ['bottom', 'bottomwear', 'jeans', 'trouser', 'pant', 'pants', 'short', 'shorts', 'skirt', 'legging', 'trackpant', 'lower', 'pyjama', 'palazzo', 'jogger', 'three fourths', 'capri'];
  if (bottomKw.some((kw) => combined.includes(kw))) {
    return 'bottomwear';
  }

  // Ethnic
  const ethnicKw = ['saree', 'sarees', 'lehenga', 'anarkali', 'gown', 'dupatta', 'ethnic', 'blouse'];
  if (ethnicKw.some((kw) => combined.includes(kw))) {
    return 'ethnic';
  }

  // Topwear
  const topKw = ['top', 'topwear', 'tshirt', 't-shirt', 'shirt', 'shirts', 'kurta', 'kurti', 'jacket', 'hoodie', 'blazer', 'coat', 'sweatshirt', 'upper'];
  if (topKw.some((kw) => combined.includes(kw))) {
    return 'topwear';
  }

  // Accessories
  const accKw = ['bag', 'bags', 'watch', 'belt', 'wallet', 'jewellery', 'sunglasses', 'accessory', 'accessories'];
  if (accKw.some((kw) => combined.includes(kw))) {
    return 'accessories';
  }

  return 'general';
}

/**
 * Returns dynamic list of attribute field configurations for the given category parameters
 */
export function getCategoryAttributeConfig(
  l1?: string | null,
  l2?: string | null,
  l3?: string | null,
  l4?: string | null,
  title?: string | null
): CategoryAttributeSchema {
  const categoryType = classifyCategory(l1, l2, l3, l4, title);

  // Common universal fields across all categories
  const baseFields: FieldAttributeConfig[] = [
    { key: 'color', label: 'Color', required: true, type: 'dropdown', options: COLOR_OPTIONS, defaultValue: 'Navy Blue', section: 'details' },
    { key: 'genericName', label: 'Generic Name', required: true, type: 'dropdown', options: GENERIC_NAME_OPTIONS, defaultValue: 'Garment', section: 'details' },
    { key: 'netQuantity', label: 'Net Quantity (N)', required: true, type: 'dropdown', options: NET_QUANTITY_OPTIONS, defaultValue: '1', section: 'details' },
    { key: 'countryOfOrigin', label: 'COUNTRY OF ORIGIN', required: true, type: 'dropdown', options: COUNTRY_OF_ORIGIN_OPTIONS, defaultValue: 'India', section: 'details' },
  ];

  if (categoryType === 'topwear') {
    return {
      categoryType,
      fields: [
        ...baseFields,
        { key: 'fabric', label: 'Fabric', required: true, type: 'dropdown', options: FABRIC_OPTIONS, defaultValue: 'Cotton', section: 'details' },
        { key: 'pattern', label: 'Pattern', required: true, type: 'dropdown', options: PATTERN_OPTIONS, defaultValue: 'Solid', section: 'details' },
        { key: 'neck', label: 'Neck', required: false, type: 'dropdown', options: NECK_OPTIONS, defaultValue: 'Round', section: 'attributes' },
        { key: 'sleeveLength', label: 'Sleeve Length', required: false, type: 'dropdown', options: SLEEVE_LENGTH_OPTIONS, defaultValue: 'Short Sleeves', section: 'attributes' },
        { key: 'fitShape', label: 'Fit / Shape', required: false, type: 'dropdown', options: FIT_SHAPE_OPTIONS, defaultValue: 'Regular', section: 'attributes' },
        { key: 'printPatternType', label: 'Print or Pattern Type', required: false, type: 'dropdown', options: PRINT_PATTERN_TYPE_OPTIONS, defaultValue: 'Solid', section: 'attributes' },
        { key: 'occasion', label: 'Occasion', required: false, type: 'dropdown', options: OCCASION_OPTIONS, defaultValue: 'Casual', section: 'attributes' },
      ],
    };
  }

  if (categoryType === 'bottomwear') {
    return {
      categoryType,
      fields: [
        ...baseFields,
        { key: 'fabric', label: 'Fabric', required: true, type: 'dropdown', options: FABRIC_OPTIONS, defaultValue: 'Cotton', section: 'details' },
        { key: 'pattern', label: 'Pattern', required: true, type: 'dropdown', options: PATTERN_OPTIONS, defaultValue: 'Solid', section: 'details' },
        { key: 'bottomType', label: 'Bottom Type', required: false, type: 'dropdown', options: ['Jeans', 'Trousers', 'Shorts', 'Trackpants', 'Three Fourths', 'Palazzos'], defaultValue: 'Jeans', section: 'attributes' },
        { key: 'waistClosure', label: 'Waist Closure', required: false, type: 'dropdown', options: ['Button & Zip', 'Drawstring & Elastic', 'Elasticated', 'Hook & Eye'], defaultValue: 'Button & Zip', section: 'attributes' },
        { key: 'waistRise', label: 'Waist Rise', required: false, type: 'dropdown', options: ['High Rise', 'Mid Rise', 'Low Rise'], defaultValue: 'Mid Rise', section: 'attributes' },
        { key: 'fitShape', label: 'Fit / Shape', required: false, type: 'dropdown', options: FIT_SHAPE_OPTIONS, defaultValue: 'Regular', section: 'attributes' },
        { key: 'numberOfPockets', label: 'Number of Pockets', required: false, type: 'dropdown', options: ['2', '3', '4', '5', '6'], defaultValue: '4', section: 'attributes' },
        { key: 'occasion', label: 'Occasion', required: false, type: 'dropdown', options: OCCASION_OPTIONS, defaultValue: 'Casual', section: 'attributes' },
      ],
    };
  }

  if (categoryType === 'footwear') {
    return {
      categoryType,
      fields: [
        ...baseFields,
        { key: 'pattern', label: 'Pattern', required: true, type: 'dropdown', options: PATTERN_OPTIONS, defaultValue: 'Solid', section: 'details' },
        { key: 'upperMaterial', label: 'Upper Material', required: false, type: 'dropdown', options: UPPER_MATERIAL_OPTIONS, defaultValue: 'Synthetic Leather', section: 'attributes' },
        { key: 'soleMaterial', label: 'Sole Material', required: false, type: 'dropdown', options: SOLE_MATERIAL_OPTIONS, defaultValue: 'Rubber', section: 'attributes' },
        { key: 'fastening', label: 'Fastening & Back Detail', required: false, type: 'dropdown', options: FASTENING_OPTIONS, defaultValue: 'Lace-Ups', section: 'attributes' },
        { key: 'toeType', label: 'Toe Type', required: false, type: 'dropdown', options: TOE_TYPE_OPTIONS, defaultValue: 'Round Toe', section: 'attributes' },
        { key: 'occasion', label: 'Occasion', required: false, type: 'dropdown', options: OCCASION_OPTIONS, defaultValue: 'Casual', section: 'attributes' },
      ],
    };
  }

  if (categoryType === 'ethnic') {
    return {
      categoryType,
      fields: [
        ...baseFields,
        { key: 'fabric', label: 'Fabric', required: true, type: 'dropdown', options: FABRIC_OPTIONS, defaultValue: 'Silk Blend', section: 'details' },
        { key: 'pattern', label: 'Pattern', required: true, type: 'dropdown', options: PATTERN_OPTIONS, defaultValue: 'Embroidered', section: 'details' },
        { key: 'neck', label: 'Neck', required: false, type: 'dropdown', options: NECK_OPTIONS, defaultValue: 'Round', section: 'attributes' },
        { key: 'sleeveLength', label: 'Sleeve Length', required: false, type: 'dropdown', options: SLEEVE_LENGTH_OPTIONS, defaultValue: 'Three-Quarter Sleeves', section: 'attributes' },
        { key: 'printPatternType', label: 'Print or Pattern Type', required: false, type: 'dropdown', options: PRINT_PATTERN_TYPE_OPTIONS, defaultValue: 'Ethnic Motif', section: 'attributes' },
        { key: 'occasion', label: 'Occasion', required: false, type: 'dropdown', options: OCCASION_OPTIONS, defaultValue: 'Festive', section: 'attributes' },
      ],
    };
  }

  // General / Accessories fallback
  return {
    categoryType,
    fields: [
      ...baseFields,
      { key: 'fabric', label: 'Material / Fabric', required: true, type: 'dropdown', options: FABRIC_OPTIONS, defaultValue: 'Cotton', section: 'details' },
      { key: 'pattern', label: 'Pattern', required: true, type: 'dropdown', options: PATTERN_OPTIONS, defaultValue: 'Solid', section: 'details' },
      { key: 'occasion', label: 'Occasion', required: false, type: 'dropdown', options: OCCASION_OPTIONS, defaultValue: 'Casual', section: 'attributes' },
    ],
  };
}
