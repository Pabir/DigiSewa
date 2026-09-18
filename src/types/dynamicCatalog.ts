export type AttributeType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'decimal'
  | 'integer'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'image'
  | 'multi_image'
  | 'video'
  | 'color'
  | 'size_selector'
  | 'range'
  | 'measurement'
  | 'url';

export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'in'
  | 'not_in'
  | 'greater_than'
  | 'less_than';

export interface AttributeValidationRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customErrorMessage?: string;
}

export interface AttributeOption {
  label: string;
  value: string;
  hexCode?: string; // For color picker
  icon?: string;
}

export interface AttributeCondition {
  id: string;
  fieldCode: string; // The attribute code to watch (e.g. "footwear_type")
  operator: ConditionalOperator;
  value: any; // Target value (e.g. "heels" or ["heels", "wedges"])
}

export interface AttributeDefinition {
  id: string;
  code: string; // Unique string key (e.g., "fabric", "heel_height")
  name: string; // Internal name
  label: string; // Display label shown to seller
  type: AttributeType;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  isActive: boolean;
  isVariantAttribute?: boolean; // Can be used to construct variants (e.g., color, size)
  isFilterable?: boolean; // Auto-generate search/category filters
  isSearchable?: boolean;
  sortOrder: number;
  defaultValue?: any;
  validationRules?: AttributeValidationRules;
  options?: AttributeOption[];
  conditions?: AttributeCondition[]; // Display condition rules
  unit?: string; // e.g. "cm", "inches", "g", "mAh"
  updatedByAdminId?: string;
  updatedByAdminEmail?: string;
  updatedAt?: string;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  level: number; // 1 = SuperCategory, 2 = Category, 3 = Subcategory, 4 = Leaf / Product Type
  iconName?: string;
  description?: string;
  sortOrder: number;
  minImagesRequired?: number;
  maxImagesAllowed?: number;
  children?: CategoryNode[];
}

export interface CategoryAttributeMapping {
  id: string;
  categoryId: string;
  attributeId: string;
  isRequired: boolean;
  sortOrder: number;
  isVariantAttribute?: boolean;
  overrideDefaultValue?: any;
  updatedByAdminId?: string;
  updatedByAdminEmail?: string;
  updatedAt?: string;
}

export interface CategoryTemplate {
  id: string;
  name: string;
  description: string;
  categoryType: string; // e.g. "tshirt", "footwear", "electronics"
  attributeIds: string[];
  createdAt: string;
}

export interface ResolvedCategoryField {
  attribute: AttributeDefinition;
  isRequired: boolean;
  sortOrder: number;
  isVariantAttribute: boolean;
  groupSection: 'common' | 'category_specific' | 'variant' | 'specifications';
}

export interface CategoryFormSchema {
  categoryId: string;
  categoryPath: string[]; // ['Fashion', 'Men', 'Topwear', 'T-Shirts']
  categoryName: string;
  minImagesRequired: number;
  maxImagesAllowed: number;
  fields: ResolvedCategoryField[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: number;
  mrp: number;
  discountPercentage?: number;
  stock: number;
  barcode?: string;
  images?: string[];
  attributeValues: Record<string, any>; // e.g., { color: 'Black', size: 'M' }
  enabled: boolean;
}

export interface ProductDraft {
  id: string;
  sellerId: string;
  categoryId: string;
  categoryPath: string[];
  step: number; // 1 to 8
  commonFields: {
    title?: string;
    brand?: string;
    description?: string;
    mrp?: number;
    sellingPrice?: number;
    hsn?: string;
    gstPercentage?: number;
    sku?: string;
    stock?: number;
    weightGrams?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    countryOfOrigin?: string;
    manufacturer?: string;
    packer?: string;
    importer?: string;
    packageContains?: string;
    offerFreeShipping?: boolean;
  };
  attributeValues: Record<string, any>;
  variants: ProductVariant[];
  variantAttributes: string[]; // Codes of attributes selected for matrix generation
  mainImage?: string;
  additionalImages: string[];
  updatedAt: string;
}

export interface DeletionRequest {
  id: string;
  type: 'global_attribute' | 'category_mapping';
  targetId: string;
  targetName: string;
  categoryId?: string;
  categoryName?: string;
  adminName: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface DynamicProductData {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  brand: string;
  description: string;
  categoryId: string;
  categoryPath: string[];
  price: number;
  originalPrice: number;
  stock: number;
  unit: string;
  imageUrl: string;
  additionalImages: string[];
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: string;
  hsn?: string;
  gstPercentage?: number;
  weightGrams?: number;
  dimensions?: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  countryOfOrigin?: string;
  manufacturer?: string;
  attributeValues: Record<string, any>;
  variants: ProductVariant[];
  isHyperlocalAvailable: boolean;
  offerFreeShipping?: boolean;
}

export interface StockShard {
  id: string; // "0" to "N-1"
  count: number;
}
