import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  UploadCloud,
  CircleCheck,
  Sparkles,
  AlertTriangle,
  ShoppingBag,
  Search,
  Plus,
  Trash2,
  ShieldCheck,
  ArrowRight,
  Smartphone,
  Baby,
  Heart,
  Home,
  Shirt,
  Monitor,
  Headphones,
  Car,
  Utensils,
  Gem,
  Scissors,
  User,
  Footprints,
  Check,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import {
  CategoryNode,
  ProductVariant,
  ProductDraft,
  DynamicProductData,
} from '../../types/dynamicCatalog';
import {
  getCategoryHierarchy,
  getCategoryFormSchema,
  saveProductDraft,
  getProductDraft,
  saveCatalogProduct,
  subscribeToCatalogSettings,
  syncFromFirestore,
} from '../../services/dynamicCatalogService';
import { getEstimatedShippingCharges, shiprocketLogin } from '../../services/shiprocketService';
import { searchCategories } from '../../services/categoryService';
import { DynamicFormEngine } from '../../components/catalog/DynamicFormEngine';
import { VariantMatrixBuilder } from '../../components/catalog/VariantMatrixBuilder';
import { FootwearSizeGuideCard } from './FootwearSizeGuideCard';
import { MensWearSizeGuideCard } from './MensWearSizeGuideCard';
import { WomensWearSizeGuideCard } from './WomensWearSizeGuideCard';
import { getMeasurementInfo } from '../../utils/productSizeUtils';
import { ImageQualityCheckModal } from './ImageQualityCheckModal';

const PROHIBITED_GUIDELINE_IMAGE = require('../../assets/prohibited_image_types_guideline.png');
const WOMENS_WEAR_DIAGRAM = require('../../assets/womens_wear_size_guide_diagram.png');
const MENS_WEAR_DIAGRAM = require('../../assets/mens_wear_size_guide_diagram.png');
const FOOTWEAR_DIAGRAM = require('../../assets/footwear_size_guide_diagram.png');

interface DynamicCatalogUploadWizardProps {
  onBack: () => void;
  onSuccess: () => void;
  draftId?: string;
}

// Removed AnimatedCategoryColumn as we are using Drill-down layout

export const DynamicCatalogUploadWizard: React.FC<DynamicCatalogUploadWizardProps> = ({
  onBack,
  onSuccess,
  draftId,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { sellerProfile, user } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1); // 1 = Select Category, 2 = Product Details & Form
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isImageModalVisible, setIsImageModalVisible] = useState<boolean>(false);

  // Category Tree Selection State (Starts Clean with Super Category)
  const [allCategories, setAllCategories] = useState<CategoryNode[]>(getCategoryHierarchy());
  const [selectedL1, setSelectedL1] = useState<string | null>(null);
  const [selectedL2, setSelectedL2] = useState<string | null>(null);
  const [selectedL3, setSelectedL3] = useState<string | null>(null);
  const [selectedLeafId, setSelectedLeafId] = useState<string | null>(null);
  const [categorySearchText, setCategorySearchText] = useState<string>('');

  useEffect(() => {
    syncFromFirestore().then(() => {
      setAllCategories(getCategoryHierarchy());
    });
    const unsub = subscribeToCatalogSettings(() => {
      setAllCategories(getCategoryHierarchy());
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Live Category Search Results
  const liveSearchResults = categorySearchText.trim().length >= 1
    ? searchCategories(categorySearchText)
    : [];

  // Resolved Dynamic Schema
  const activeLeafId = selectedLeafId || 'cat-women-kurtis';
  const schema = getCategoryFormSchema(activeLeafId);

  // Common Fields State
  const [productTitle, setProductTitle] = useState<string>('');
  const [productBrand, setProductBrand] = useState<string>('');
  const [productDescription, setProductDescription] = useState<string>('');
  const [mrpPrice, setMrpPrice] = useState<string>('1499');
  const [sellingPrice, setSellingPrice] = useState<string>('599');
  const [hsnCode, setHsnCode] = useState<string>('6211');
  const [gstPercentage, setGstPercentage] = useState<string>('5');
  const [stockQty, setStockQty] = useState<string>('40');
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  
  const handleTagInputChange = (text: string) => {
    if (text.includes(',')) {
      const newTags = text.split(',')
                          .map(t => t.trim())
                          .filter(t => t.length > 0 && !tagsList.includes(t));
      if (newTags.length > 0) {
        setTagsList(prev => [...prev, ...newTags].slice(0, 15));
      }
      setTagInput('');
    } else {
      setTagInput(text);
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTagsList(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Dynamic Attribute Values State
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({
    brand: 'Royal Handlooms',
    color: 'Red',
    size: ['S', 'M', 'L', 'XL'],
    fabric: 'Cotton',
    pattern: 'Printed',
    kurti_type: 'Straight',
    neck: 'Round Neck',
    sleeve_length: '3/4 Sleeves',
    country_of_origin: 'India',
  });

  // Variants State
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Images State
  const [mainImageUrl, setMainImageUrl] = useState<string>('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [customImageInput, setCustomImageInput] = useState<string>('');

  // Package & Shipping State
  const [weightGrams, setWeightGrams] = useState<string>('350');
  const [lengthCm, setLengthCm] = useState<string>('25');
  const [widthCm, setWidthCm] = useState<string>('20');
  const [heightCm, setHeightCm] = useState<string>('3');
  const [offerFreeShipping, setOfferFreeShipping] = useState<boolean>(false);
  const [sameAsManufacturer, setSameAsManufacturer] = useState<boolean>(false);

  const [estimatedShipping, setEstimatedShipping] = useState<{minShipping: number, maxShipping: number, rtoCharge: number}>({ minShipping: 43, maxShipping: 74, rtoCharge: 43 });
  const [isFetchingShipping, setIsFetchingShipping] = useState<boolean>(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchShipping = async () => {
      const pin = sellerProfile?.pickupAddress?.pincode;
      if (!pin) return;
      
      const wStr = weightGrams.trim();
      const deadWeightKg = (Number(wStr) || 0) / 1000;
      const l = Number(lengthCm) || 0;
      const w = Number(widthCm) || 0;
      const h = Number(heightCm) || 0;
      const volWeightKg = (l * w * h) / 5000;
      
      const applicableWeightKg = Math.max(deadWeightKg, volWeightKg);
      
      if (applicableWeightKg <= 0) return;

      setIsFetchingShipping(true);
      try {
        const token = await shiprocketLogin();
        const estimates = await getEstimatedShippingCharges(pin, applicableWeightKg, token);
        setEstimatedShipping(estimates);
      } catch (error) {
        console.warn('Failed to fetch dynamic shipping', error);
      } finally {
        setIsFetchingShipping(false);
      }
    };

    timeoutId = setTimeout(fetchShipping, 500);

    return () => clearTimeout(timeoutId);
  }, [weightGrams, lengthCm, widthCm, heightCm, sellerProfile?.pickupAddress?.pincode]);

  useEffect(() => {
    if (sameAsManufacturer) {
      const newValues = { ...attributeValues };
      let changed = false;

      const manufacturerFields = schema.fields.filter(f => f.attribute.label.toLowerCase().includes('manufacturer') || f.attribute.code.toLowerCase().includes('manufacturer'));

      manufacturerFields.forEach(mField => {
        const baseName = mField.attribute.label.toLowerCase().replace('manufacturer', '').trim();
        
        const packerField = schema.fields.find(f => 
          (f.attribute.label.toLowerCase().includes('packer') || f.attribute.code.toLowerCase().includes('packer')) && 
          f.attribute.label.toLowerCase().includes(baseName)
        );

        const importerField = schema.fields.find(f => 
          (f.attribute.label.toLowerCase().includes('importer') || f.attribute.code.toLowerCase().includes('importer')) && 
          f.attribute.label.toLowerCase().includes(baseName)
        );

        const mValue = newValues[mField.attribute.code];
        if (packerField && newValues[packerField.attribute.code] !== mValue) {
          newValues[packerField.attribute.code] = mValue;
          changed = true;
        }
        if (importerField && newValues[importerField.attribute.code] !== mValue) {
          newValues[importerField.attribute.code] = mValue;
          changed = true;
        }
      });

      if (changed) {
        setAttributeValues(newValues);
      }
    }
  }, [sameAsManufacturer, attributeValues, schema]);

  // Search result selector handler
  const handleSelectSearchResult = (res: {
    superCategoryId: string;
    superCategory: string;
    subgroupId: string;
    subgroup: string;
    groupId: string;
    group: string;
    leaf: string;
  }) => {
    const l1Node = allCategories.find(
      (c) => c.id === res.superCategoryId || c.name.toLowerCase() === res.superCategory.toLowerCase()
    ) || allCategories[0];

    setSelectedL1(l1Node.id);

    const l2Node = l1Node?.children?.find(
      (c) => c.id === res.subgroupId || c.name.toLowerCase() === res.subgroup.toLowerCase()
    ) || l1Node?.children?.[0];

    if (l2Node) {
      setSelectedL2(l2Node.id);

      const l3Node = l2Node.children?.find(
        (c) => c.id === res.groupId || c.name.toLowerCase() === res.group.toLowerCase()
      ) || l2Node.children?.[0];

      if (l3Node) {
        setSelectedL3(l3Node.id);

        const l4Node = l3Node.children?.find(
          (c) => c.name.toLowerCase() === res.leaf.toLowerCase()
        ) || l3Node.children?.[0];

        if (l4Node) {
          setSelectedLeafId(l4Node.id);
        } else {
          setSelectedLeafId(l3Node.id);
        }
      }
    }

    setCategorySearchText('');
  };

  // Quick Tags Preset Selection
  const handleQuickTagSelect = (tagName: string) => {
    const queryMap: Record<string, string> = {
      'T-Shirts': 'Tshirts',
      'Sarees & Kurtis': 'Kurtis',
      'Mobiles & Accessories': 'Mobile Accessories',
      'Fresh Grocery': 'Kitchen',
      'Footwear': 'Shoes',
    };
    const q = queryMap[tagName] || tagName;
    const results = searchCategories(q);
    if (results && results.length > 0) {
      handleSelectSearchResult(results[0]);
    }
  };

  // Selected Category Names for accurate gender & diagram detection
  const selectedL1Name = allCategories.find((c) => c.id === selectedL1)?.name || '';
  const selectedL2Name = allCategories
    .find((c) => c.id === selectedL1)
    ?.children?.find((c) => c.id === selectedL2)?.name || '';
  const selectedL3Name = allCategories
    .find((c) => c.id === selectedL1)
    ?.children?.find((c) => c.id === selectedL2)
    ?.children?.find((c) => c.id === selectedL3)?.name || '';
  const selectedL4Name = allCategories
    .find((c) => c.id === selectedL1)
    ?.children?.find((c) => c.id === selectedL2)
    ?.children?.find((c) => c.id === selectedL3)
    ?.children?.find((c) => c.id === selectedLeafId)?.name || '';

  // Measurement Info for Vector Diagrams & Size Charts
  const measInfo = getMeasurementInfo(
    selectedL1Name || schema.categoryPath[0],
    selectedL2Name || schema.categoryPath[1],
    selectedL3Name || schema.categoryPath[2],
    selectedL4Name || schema.categoryPath[3],
    productTitle
  );

  const handleSizeChartUpdate = (sizes: any[]) => {
    setAttributeValues((prev) => ({ ...prev, customSizeChart: sizes }));
  };

  const renderSizeGuideCard = () => {
    if (measInfo.wearType === 'footwear') {
      return <FootwearSizeGuideCard onSizeChartUpdate={handleSizeChartUpdate} />;
    }
    if (measInfo.wearType === 'upper' || measInfo.wearType === 'lower') {
      if (measInfo.gender === 'women') {
        return <WomensWearSizeGuideCard wearType={measInfo.wearType} onSizeChartUpdate={handleSizeChartUpdate} />;
      }
      return <MensWearSizeGuideCard wearType={measInfo.wearType} onSizeChartUpdate={handleSizeChartUpdate} />;
    }
    return null;
  };

  // Load Draft if supplied
  useEffect(() => {
    if (draftId) {
      const draft = getProductDraft(draftId);
      if (draft) {
        setSelectedLeafId(draft.categoryId);
        if (draft.commonFields.title) setProductTitle(draft.commonFields.title);
        if (draft.commonFields.brand) setProductBrand(draft.commonFields.brand);
        if (draft.commonFields.mrp) setMrpPrice(String(draft.commonFields.mrp));
        if (draft.commonFields.sellingPrice) setSellingPrice(String(draft.commonFields.sellingPrice));
        if (draft.attributeValues) setAttributeValues(draft.attributeValues);
        if (draft.variants) setVariants(draft.variants);
        if (draft.mainImage) setMainImageUrl(draft.mainImage);
        if (draft.additionalImages) setAdditionalImages(draft.additionalImages);
        if (draft.commonFields.offerFreeShipping !== undefined) setOfferFreeShipping(draft.commonFields.offerFreeShipping);
      }
    }
  }, [draftId]);

  // Handle Save Draft
  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    saveProductDraft({
      sellerId: sellerProfile?.id || user?.id || 'seller-default',
      categoryId: activeLeafId,
      categoryPath: schema.categoryPath,
      step: currentStep,
      commonFields: {
        title: productTitle,
        brand: productBrand,
        description: productDescription,
        mrp: Number(mrpPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        hsn: hsnCode,
        gstPercentage: Number(gstPercentage) || 5,
        stock: Number(stockQty) || 40,
        weightGrams: Number(weightGrams) || 350,
        lengthCm: Number(lengthCm) || 25,
        widthCm: Number(widthCm) || 20,
        heightCm: Number(heightCm) || 3,
        offerFreeShipping,
      },
      attributeValues,
      variants,
      mainImage: mainImageUrl,
      additionalImages,
    });

    setTimeout(() => {
      setIsSavingDraft(false);
      Alert.alert('💾 Catalog Draft Saved Successfully!');
    }, 400);
  };
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validate form fields before submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!productTitle.trim()) errors.title = 'Product title is required';
    if (!productBrand.trim()) errors.brand = 'Brand name is required';
    if (!mrpPrice || Number(mrpPrice) <= 0) errors.mrp = 'MRP must be greater than 0';
    if (!sellingPrice || Number(sellingPrice) <= 0) errors.sellingPrice = 'Selling price must be greater than 0';

    if (schema && schema.fields) {
      schema.fields.forEach((f) => {
        if (f.isRequired) {
          const val = attributeValues[f.attribute.code];
          if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
            errors[f.attribute.code] = `${f.attribute.label} is required`;
          }
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Final Submit Action
  const handleSubmitCatalog = async () => {
    setSubmitError(null);
    if (!schema) {
      setSubmitError('Validation Error: Please select a category first.');
      Alert.alert('Validation Error', 'Please select a category first.');
      return;
    }

    if (!validateForm()) {
      setSubmitError('Validation Error: Please fill all required dynamic fields marked with *');
      Alert.alert('Validation Error', 'Please fill all required dynamic fields marked with *');
      return;
    }

    // Validate that variants have images uploaded per primary color / group
    if (variants && variants.length > 0) {
      const variantAttributes = schema.fields.filter(f => f.isVariant).map(f => f.attribute);
      const imageGroupAttr = variantAttributes.find(a => a.type === 'color' || a.code === 'color') || variantAttributes[0];
      const imageGroupAttributeCode = imageGroupAttr?.code;

      if (imageGroupAttributeCode) {
        const imageGroups = Array.from(new Set(variants.map(v => v.attributeValues[imageGroupAttributeCode]).filter(Boolean)));
        for (const group of imageGroups) {
          const sampleVariant = variants.find(v => v.attributeValues[imageGroupAttributeCode] === group);
          if (!sampleVariant?.images || sampleVariant.images.length === 0) {
            setSubmitError(`Validation Error: Missing images for ${imageGroupAttr.label || 'Variant'} '${group}'`);
            Alert.alert('Missing Variant Images', `Please upload at least one product photo for ${imageGroupAttr.label || 'Variant'} '${group}' in the Variant Matrix section before submitting.`);
            return;
          }
        }
      }
    }

    const parsedSelling = Number(sellingPrice) || 599;
    const parsedMrp = Number(mrpPrice) || 1499;
    
    // Auto-swap if the seller accidentally mixed up Selling Price and MRP
    const finalSellingPrice = parsedSelling > parsedMrp ? parsedMrp : parsedSelling;
    const finalMrpPrice = parsedSelling > parsedMrp ? parsedSelling : parsedMrp;

    setIsSubmitting(true);
    try {
      await saveCatalogProduct({
        sellerId: sellerProfile?.id || user?.id || 'seller-1',
        sellerName: sellerProfile?.storeName || 'TafDeal Marketplace Seller',
        title: productTitle,
        brand: productBrand,
        description: productDescription,
        categoryId: activeLeafId,
        categoryPath: schema.categoryPath,
        price: finalSellingPrice,
        originalPrice: finalMrpPrice,
        stock: Number(stockQty) || 40,
        unit: 'piece',
        imageUrl: mainImageUrl,
        additionalImages,
        tags: tagsList,
        hsn: hsnCode,
        gstPercentage: Number(gstPercentage) || 5,
        weightGrams: Number(weightGrams) || 350,
        dimensions: {
          lengthCm: Number(lengthCm) || 25,
          widthCm: Number(widthCm) || 20,
          heightCm: Number(heightCm) || 3,
        },
        countryOfOrigin: attributeValues.country_of_origin || 'India',
        attributeValues,
        variants,
        offerFreeShipping,
      });

      setIsSubmitting(false);
      Alert.alert('Success', '🎉 Catalog Product Created & Published Successfully!');
      onSuccess();
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(`Error: ${err?.message || 'Failed to publish catalog.'}`);
      Alert.alert('Error', `Failed to publish catalog: ${err?.message || err}`);
    }
  };

  // Shipping costs are now dynamically fetched from Shiprocket API
  const { minShipping, maxShipping, rtoCharge } = estimatedShipping;

  // Calculated Bank Settlement Payout Amount
  const sellingNum = Number(sellingPrice) || 0;
  const gstVal = Number(gstPercentage) || 5;
  const pgFee = Math.round(sellingNum * 0.02);
  const productGst = Math.round(sellingNum * (gstVal / 100));
  const tcsTds = Math.round(sellingNum * 0.01);
  const baseSettlement = Math.max(0, Math.round(sellingNum - pgFee - productGst - tcsTds));
  
  const minEstimatedBankSettlement = offerFreeShipping ? Math.max(0, baseSettlement - maxShipping) : baseSettlement;
  const maxEstimatedBankSettlement = offerFreeShipping ? Math.max(0, baseSettlement - minShipping) : baseSettlement;

  return (
    <View style={styles.container}>
      {/* Top Header Bar matching attached screenshot */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={18} color="#0F172A" />
          <Text style={styles.backBtnText}>Single Catalog Upload</Text>
        </TouchableOpacity>

        {/* Modern Horizontal Line Stepper */}
        <View style={styles.horizontalStepper}>
          <TouchableOpacity
            style={styles.stepperStep}
            onPress={() => setCurrentStep(1)}
          >
            <View style={[styles.stepperDot, currentStep >= 1 && styles.stepperDotActive]}>
              <Text style={[styles.stepperNumber, currentStep >= 1 && styles.stepperNumberActive]}>1</Text>
            </View>
            <Text style={[styles.stepperLabel, currentStep >= 1 && styles.stepperLabelActive]}>Category Selection</Text>
          </TouchableOpacity>
          
          <View style={[styles.stepperLine, currentStep >= 2 && styles.stepperLineActive]} />
          
          <TouchableOpacity
            style={styles.stepperStep}
            onPress={() => setCurrentStep(2)}
          >
            <View style={[styles.stepperDot, currentStep >= 2 && styles.stepperDotActive]}>
              <Text style={[styles.stepperNumber, currentStep >= 2 && styles.stepperNumberActive]}>2</Text>
            </View>
            <Text style={[styles.stepperLabel, currentStep >= 2 && styles.stepperLabelActive]}>Media, Inventory & Payout</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveDraftBtn} onPress={handleSaveDraft} disabled={isSavingDraft}>
          {isSavingDraft ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : (
            <>
              <CircleCheck size={16} color="#4F46E5" />
              <Text style={styles.saveDraftBtnText}>Save Draft</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
        {/* ==================================================== */}
        {/* STEP 1: CATEGORY SELECTION (MATCHING ATTACHED PHOTO) */}
        {/* ==================================================== */}
        {currentStep === 1 && (
          <View style={{ gap: 16 }}>
            {/* Explore Marketplace Categories Header Card */}
            <View style={styles.card}>
              <Text style={styles.exploreTitle}>Explore Marketplace Categories</Text>
              <Text style={styles.exploreSubTitle}>
                Search across 3,700+ verified TafDeal subcategories for fast listing
              </Text>

              {/* Search Box Input */}
              <View style={styles.searchBarBox}>
                <Search size={18} color="#4F46E5" />
                <TextInput
                  style={styles.searchInput}
                  value={categorySearchText}
                  onChangeText={setCategorySearchText}
                  placeholder="Type category (e.g. Sarees, Tshirts, Mobiles, Kurtis, Speakers)..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Live Search Results Overlay Dropdown */}
              {liveSearchResults.length > 0 && (
                <View style={styles.searchResultsBox}>
                  {liveSearchResults.map((res, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectSearchResult(res)}
                    >
                      <Text style={styles.searchResultText}>
                        {res.superCategory} → {res.subgroup} → {res.group} → <Text style={{ fontWeight: '800', color: '#4F46E5' }}>{res.leaf}</Text>
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Quick Tags Row (Directly matching attached photo) */}
              <View style={styles.quickTagsRow}>
                {[
                  { tag: '🔥 T-Shirts' },
                  { tag: '👗 Sarees & Kurtis' },
                  { tag: '📱 Mobiles & Accessories' },
                  { tag: '🥦 Fresh Grocery' },
                  { tag: '👟 Footwear' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.tag}
                    style={styles.quickTagPill}
                    onPress={() => handleQuickTagSelect(item.tag.replace(/[^a-zA-Z &]/g, '').trim())}
                  >
                    <Text style={styles.quickTagText}>{item.tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Main Category Selector & Vector Preview Section (Matching Screenshot) */}
            <View style={isDesktop ? styles.desktopStep1Layout : styles.mobileLayout}>
              {/* Left Column: Drill-down Category Selection */}
              <View style={isDesktop ? styles.cascadingWrapperDesktop : styles.fullWidthCol}>
                <View style={styles.drillDownCard}>
                  {/* Breadcrumb Navigation */}
                  <View style={styles.breadcrumbBar}>
                    <TouchableOpacity onPress={() => setSelectedL1(null)} style={styles.breadcrumbItem}>
                      <Text style={[styles.breadcrumbText, !selectedL1 && styles.breadcrumbTextActive]}>All Categories</Text>
                    </TouchableOpacity>
                    {selectedL1 && (
                      <>
                        <Text style={styles.breadcrumbSeparator}>/</Text>
                        <TouchableOpacity onPress={() => { setSelectedL2(null); setSelectedL3(null); setSelectedLeafId(null); }} style={styles.breadcrumbItem}>
                          <Text style={[styles.breadcrumbText, !selectedL2 && styles.breadcrumbTextActive]}>{selectedL1Name}</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {selectedL2 && (
                      <>
                        <Text style={styles.breadcrumbSeparator}>/</Text>
                        <TouchableOpacity onPress={() => { setSelectedL3(null); setSelectedLeafId(null); }} style={styles.breadcrumbItem}>
                          <Text style={[styles.breadcrumbText, !selectedL3 && styles.breadcrumbTextActive]}>{selectedL2Name}</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {selectedL3 && (
                      <>
                        <Text style={styles.breadcrumbSeparator}>/</Text>
                        <TouchableOpacity onPress={() => { setSelectedLeafId(null); }} style={styles.breadcrumbItem}>
                          <Text style={[styles.breadcrumbText, !selectedLeafId && styles.breadcrumbTextActive]}>{selectedL3Name}</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  {/* Drill-down Content */}
                  <View style={styles.drillDownContainer}>
                    <ScrollView style={styles.drillDownScroll}>
                      {!selectedL1 && (
                        <View style={styles.drillDownGrid}>
                          {allCategories.map((c) => {
                            let CatIcon = <ShoppingBag size={24} color="#4F46E5" />;
                            const nameLower = c.name.toLowerCase();
                            
                            if (nameLower.includes('mobile') || nameLower.includes('tablet')) CatIcon = <Smartphone size={24} color="#4F46E5" />;
                            else if (nameLower.includes('kid') || nameLower.includes('toy') || nameLower.includes('baby')) CatIcon = <Baby size={24} color="#4F46E5" />;
                            else if (nameLower.includes('grooming') || nameLower.includes('salon') || nameLower.includes('shave')) CatIcon = <Scissors size={24} color="#4F46E5" />;
                            else if (nameLower.includes('personal') || nameLower.includes('health') || nameLower.includes('wellness') || nameLower.includes('care')) CatIcon = <Heart size={24} color="#4F46E5" />;
                            else if (nameLower.includes('home') || nameLower.includes('living')) CatIcon = <Home size={24} color="#4F46E5" />;
                            else if (nameLower.includes('electronics') || nameLower.includes('appliance')) CatIcon = <Monitor size={24} color="#4F46E5" />;
                            else if (nameLower.includes('women')) CatIcon = <User size={24} color="#4F46E5" />;
                            else if (nameLower.includes('men')) CatIcon = <User size={24} color="#4F46E5" />;
                            else if (nameLower.includes('apparel') || nameLower.includes('clothing') || nameLower.includes('fashion') || nameLower.includes('wear')) CatIcon = <Shirt size={24} color="#4F46E5" />;
                            else if (nameLower.includes('footwear') || nameLower.includes('shoe')) CatIcon = <Footprints size={24} color="#4F46E5" />;
                            else if (nameLower.includes('audio') || nameLower.includes('headphone')) CatIcon = <Headphones size={24} color="#4F46E5" />;
                            else if (nameLower.includes('auto') || nameLower.includes('car')) CatIcon = <Car size={24} color="#4F46E5" />;
                            else if (nameLower.includes('kitchen') || nameLower.includes('grocery')) CatIcon = <Utensils size={24} color="#4F46E5" />;
                            else if (nameLower.includes('jewel') || nameLower.includes('access')) CatIcon = <Gem size={24} color="#4F46E5" />;

                            return (
                              <TouchableOpacity key={c.id} style={styles.drillDownGridCard} onPress={() => setSelectedL1(c.id)}>
                                <View style={styles.drillDownIconPlaceholder}>
                                  {CatIcon}
                                </View>
                                <Text style={styles.drillDownGridText}>{c.name}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                      {selectedL1 && !selectedL2 && (
                        <View style={styles.drillDownList}>
                          {allCategories.find((c) => c.id === selectedL1)?.children?.map((c) => (
                            <TouchableOpacity key={c.id} style={styles.drillDownListItem} onPress={() => setSelectedL2(c.id)}>
                              <Text style={styles.drillDownListText}>{c.name}</Text>
                              <ArrowRight size={16} color="#94A3B8" />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      {selectedL2 && !selectedL3 && (
                        <View style={styles.drillDownList}>
                          {allCategories.find((c) => c.id === selectedL1)?.children?.find((c) => c.id === selectedL2)?.children?.map((c) => {
                            const hasChildren = c.children && c.children.length > 0;
                            return (
                              <TouchableOpacity key={c.id} style={styles.drillDownListItem} onPress={() => {
                                setSelectedL3(c.id);
                                if (!hasChildren) setSelectedLeafId(c.id);
                              }}>
                                <Text style={styles.drillDownListText}>{c.name}</Text>
                                <ArrowRight size={16} color="#94A3B8" />
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                      {selectedL3 && (
                        <View style={styles.drillDownList}>
                          {allCategories.find((c) => c.id === selectedL1)?.children?.find((c) => c.id === selectedL2)?.children?.find((c) => c.id === selectedL3)?.children?.map((c) => {
                            const isSelected = selectedLeafId === c.id;
                            return (
                              <TouchableOpacity key={c.id} style={[styles.drillDownListItem, isSelected && styles.drillDownListItemActive]} onPress={() => setSelectedLeafId(c.id)}>
                                <Text style={[styles.drillDownListText, isSelected && styles.drillDownListTextActive]}>{c.name}</Text>
                                {isSelected ? <CircleCheck size={18} color="#4F46E5" /> : <View style={styles.emptyCircle} />}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </View>
              </View>

              {/* Right Column: Active Path Header + Vector Image Diagram & Vibrant Orange CTA Button (Directly Matching Screenshot) */}
              <View style={isDesktop ? styles.previewColDesktop : styles.fullWidthCol}>
                <View style={styles.previewCard}>
                  {/* Category Path Header Banner */}
                  <View style={styles.pathBannerHeader}>
                    <Text style={styles.pathBannerHeaderText} numberOfLines={1}>
                      {schema.categoryPath.join(' / ')}
                    </Text>
                  </View>

                  {/* Vector Diagram Display Box */}
                  <View style={styles.vectorDiagramBox}>
                    <Image
                      source={
                        measInfo.wearType === 'footwear'
                          ? FOOTWEAR_DIAGRAM
                          : measInfo.gender === 'women'
                          ? WOMENS_WEAR_DIAGRAM
                          : MENS_WEAR_DIAGRAM
                      }
                      style={styles.vectorDiagramImage}
                      resizeMode="contain"
                    />
                  </View>

                  <Text style={styles.frontImageNoticeText}>
                    Please provide only front image for each product
                  </Text>

                  {/* Vibrant Orange Action Button (Directly matching attached photo) */}
                  <TouchableOpacity
                    style={styles.orangeAddProductsBtn}
                    onPress={() => setIsImageModalVisible(true)}
                  >
                    <UploadCloud size={18} color="#FFFFFF" />
                    <Text style={styles.orangeAddProductsBtnText}>↑ Add Product Images</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ==================================================== */}
        {/* STEP 2: PRODUCT DETAILS & MEDIA */}
        {/* ==================================================== */}
        {currentStep === 2 && (
          <View style={isDesktop ? styles.desktopTwoColLayout : styles.mobileLayout}>
            {/* LEFT COLUMN: DYNAMIC PRODUCT FIELDS & SIZING */}
            <View style={isDesktop ? styles.leftColDesktop : styles.fullWidthCol}>
              {/* Product Basic Details */}
              <View style={styles.card}>
                <Text style={styles.cardSectionHeader}>1. Product Basic Information</Text>

                <View style={styles.formField}>
                  <Text style={styles.label}>Product Title / Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={productTitle}
                    onChangeText={setProductTitle}
                    placeholder="e.g. Women Printed Cotton Kurti With Dupatta"
                  />
                  {validationErrors.title && <Text style={styles.errorText}>{validationErrors.title}</Text>}
                </View>

                <View style={styles.formField}>
                  <Text style={styles.label}>Brand Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={productBrand}
                    onChangeText={setProductBrand}
                    placeholder="e.g. Royal Handlooms, Custom Brand"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.label}>Product Description</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={productDescription}
                    onChangeText={setProductDescription}
                    multiline
                    numberOfLines={3}
                    placeholder="Detailed description of fabric, comfort, and design..."
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.label}>Search Tags (Type comma to add, max 15)</Text>
                  
                  <View style={[styles.tagsContainer, tagsList.length > 0 && { marginBottom: 12 }]}>
                    {tagsList.map((tag, index) => (
                      <View key={index} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>{tag}</Text>
                        <TouchableOpacity onPress={() => removeTag(index)} style={styles.tagChipRemove}>
                          <X size={12} color="#4F46E5" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  {tagsList.length < 15 && (
                    <TextInput
                      style={styles.input}
                      value={tagInput}
                      onChangeText={handleTagInputChange}
                      placeholder="e.g. red, cotton, summer"
                    />
                  )}
                </View>
              </View>

              {/* DYNAMIC FORM ENGINE CARD */}
              <View style={styles.card}>
                <Text style={styles.cardSectionHeader}>
                  2. {schema.categoryName} Dynamic Category Specifications
                </Text>

                <DynamicFormEngine
                  fields={schema.fields}
                  formValues={attributeValues}
                  errors={validationErrors}
                  onChangeField={(code, val) => {
                    setAttributeValues((prev) => ({ ...prev, [code]: val }));
                  }}
                  renderCustomInsert={(field, index, visibleFields) => {
                    const isPackerOrImporter = field.attribute.label.toLowerCase().includes('packer') || 
                                              field.attribute.code.toLowerCase().includes('packer') || 
                                              field.attribute.label.toLowerCase().includes('importer') || 
                                              field.attribute.code.toLowerCase().includes('importer');
                    
                    const firstIndex = visibleFields.findIndex(f => 
                      f.attribute.label.toLowerCase().includes('packer') || 
                      f.attribute.code.toLowerCase().includes('packer') || 
                      f.attribute.label.toLowerCase().includes('importer') || 
                      f.attribute.code.toLowerCase().includes('importer')
                    );

                    if (isPackerOrImporter && index === firstIndex) {
                      return (
                        <TouchableOpacity 
                          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}
                          onPress={() => setSameAsManufacturer(!sameAsManufacturer)}
                        >
                          <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#4F46E5', backgroundColor: sameAsManufacturer ? '#4F46E5' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            {sameAsManufacturer && <Check size={12} color="#FFFFFF" />}
                          </View>
                          <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600' }}>
                            Packer and Importer details should be same as Manufacturer
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                    return null;
                  }}
                />
              </View>

              {/* SUPPLIER PRICING & TAX BREAKDOWN CARD */}
              <View style={styles.card}>
                <Text style={styles.cardSectionHeader}>3. Pricing, GST Tax & Settlement Payout</Text>

                <View style={styles.rowTwo}>
                  <View style={[styles.formField, { flex: 1 }]}>
                    <Text style={styles.label}>MRP Price (₹) *</Text>
                    <TextInput
                      style={styles.input}
                      value={mrpPrice}
                      onChangeText={setMrpPrice}
                      keyboardType="numeric"
                      placeholder="1499"
                    />
                  </View>

                  <View style={[styles.formField, { flex: 1 }]}>
                    <Text style={styles.label}>Supplier Selling Price (₹) *</Text>
                    <TextInput
                      style={styles.input}
                      value={sellingPrice}
                      onChangeText={setSellingPrice}
                      keyboardType="numeric"
                      placeholder="599"
                    />
                  </View>
                </View>

                <View style={styles.rowTwo}>
                  <View style={[styles.formField, { flex: 1 }]}>
                    <Text style={styles.label}>HSN Code *</Text>
                    <TextInput
                      style={styles.input}
                      value={hsnCode}
                      onChangeText={setHsnCode}
                      placeholder="e.g. 6211"
                    />
                  </View>

                  <View style={[styles.formField, { flex: 1 }]}>
                    <Text style={styles.label}>GST Percentage (%) *</Text>
                    <TextInput
                      style={styles.input}
                      value={gstPercentage}
                      onChangeText={setGstPercentage}
                      keyboardType="numeric"
                      placeholder="e.g. 5, 12, 18, 28"
                    />
                  </View>
                </View>

                {/* Bank Payout Calculation Callout */}
                <View style={styles.payoutBox}>
                  <Text style={styles.payoutLabel}>Settlement Breakdown:</Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, marginTop: 8 }}>
                    <Text style={{ fontSize: 13, color: '#475569' }}>Selling Price (Tax Inclusive)</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>₹{sellingNum}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: '#475569' }}>Payment Gateway Fee (2%)</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>- ₹{pgFee}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: '#475569' }}>GST ({gstVal}%)</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>- ₹{productGst}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, color: '#475569' }}>TCS/TDS (1%)</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>- ₹{tcsTds}</Text>
                  </View>

                  {offerFreeShipping && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Text style={{ fontSize: 13, color: '#475569' }}>Shipping Fee Deduction</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>- ₹{minShipping} to ₹{maxShipping}</Text>
                    </View>
                  )}

                  <View style={[styles.payoutRow, { marginTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 }]}>
                    <Text style={[styles.payoutLabel, { color: '#0F172A', fontWeight: '800' }]}>Net Bank Settlement:</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {isFetchingShipping && <ActivityIndicator size="small" color="#059669" />}
                      <Text style={[styles.payoutValue, { color: '#059669', fontSize: 18 }]}>
                        {offerFreeShipping 
                          ? `₹${minEstimatedBankSettlement} - ₹${maxEstimatedBankSettlement}` 
                          : `₹${baseSettlement}`
                        }
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.payoutSub, { marginTop: 6 }]}>
                    Amount will be directly deposited to your registered bank account. Note: GST filing is the seller's responsibility.
                  </Text>
                </View>
              </View>

              {/* PACKAGE WEIGHT & SHIPPING ESTIMATE CARD */}
              <View style={styles.card}>
                <Text style={styles.cardSectionHeader}>4. Package Weight & Shipping Cost Estimate</Text>
                
                <View style={styles.formField}>
                  <Text style={styles.label}>Applicable Weight (Grams) *</Text>
                  <TextInput
                    style={styles.input}
                    value={weightGrams}
                    onChangeText={setWeightGrams}
                    keyboardType="numeric"
                    placeholder="e.g. 500 for 0.5 kg"
                  />
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                    Current Dead Weight: {Number(weightGrams) / 1000} kg
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Length (cm)</Text>
                    <TextInput
                      style={styles.input}
                      value={lengthCm}
                      onChangeText={setLengthCm}
                      keyboardType="numeric"
                      placeholder="e.g. 25"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Width (cm)</Text>
                    <TextInput
                      style={styles.input}
                      value={widthCm}
                      onChangeText={setWidthCm}
                      keyboardType="numeric"
                      placeholder="e.g. 20"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Height (cm)</Text>
                    <TextInput
                      style={styles.input}
                      value={heightCm}
                      onChangeText={setHeightCm}
                      keyboardType="numeric"
                      placeholder="e.g. 5"
                    />
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 16, marginTop: -8 }}>
                  Volumetric Weight: {((Number(lengthCm) * Number(widthCm) * Number(heightCm)) / 5000).toFixed(2)} kg
                </Text>

                <View style={[styles.payoutBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.payoutLabel, { color: '#166534' }]}>Estimated Shipping & RTO Charges:</Text>
                    {isFetchingShipping && <ActivityIndicator size="small" color="#166534" />}
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, marginTop: 8 }}>
                    <Text style={{ fontSize: 13, color: '#15803D' }}>Min. Shipping (Smallest Distance)</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#166534' }}>₹{minShipping}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: '#15803D' }}>Max. Shipping (Largest Distance)</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#166534' }}>₹{maxShipping}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, color: '#15803D' }}>RTO Charge (If Returned)</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#B91C1C' }}>₹{rtoCharge}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#166534', marginTop: 4 }}>
                    Shipping is calculated in 0.5 kg slabs. Actual shipping cost is deducted at settlement based on buyer distance.
                  </Text>
                  
                  <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: '#BBF7D0', paddingTop: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>Offer Free Delivery to Buyers</Text>
                        <Text style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                          {offerFreeShipping ? 'Buyers will see ₹0 shipping. Please inflate your Selling Price to cover these costs.' : 'Buyers will pay the shipping cost directly at checkout.'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: offerFreeShipping ? '#16A34A' : '#CBD5E1',
                          justifyContent: 'center',
                          alignItems: offerFreeShipping ? 'flex-end' : 'flex-start',
                          paddingHorizontal: 2,
                        }}
                        onPress={() => setOfferFreeShipping(!offerFreeShipping)}
                      >
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {offerFreeShipping && (
                    <View style={{ backgroundColor: '#DCFCE7', padding: 8, borderRadius: 6, marginTop: 10, borderWidth: 1, borderColor: '#BBF7D0' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534' }}>💡 Free Delivery Tip:</Text>
                      <Text style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>
                        Buyers love Free Shipping! We show ₹0 shipping to buyers to boost sales. Please inflate your Supplier Selling Price to cover these estimated delivery costs to maintain profitability.
                      </Text>
                    </View>
                  )}

                  <View style={{ backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: '#BFDBFE' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E3A8A', marginBottom: 4 }}>
                      Final Customer Price View:
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontWeight: '800', color: '#1D4ED8' }}>
                        {offerFreeShipping 
                          ? `₹${sellingPrice || '0'}` 
                          : `₹${Number(sellingPrice || 0) + Number(minShipping || 0)} - ₹${Number(sellingPrice || 0) + Number(maxShipping || 0)}`
                        }
                      </Text>
                      {!offerFreeShipping ? (
                        <Text style={{ fontSize: 12, color: '#3B82F6', marginLeft: 8 }}>
                          (₹{sellingPrice || '0'} + ₹{minShipping}-₹{maxShipping} Shipping)
                        </Text>
                      ) : (
                        <Text style={{ fontSize: 12, color: '#10B981', marginLeft: 8, fontWeight: '600' }}>
                          & Free Delivery
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* VECTOR SIZE GUIDE CARD (MEN / WOMEN / FOOTWEAR) */}
              {schema.fields.some(f => f.attribute.code.toLowerCase().includes('size') || f.attribute.type === 'size_selector') && (
                <View style={styles.card}>
                  <Text style={styles.cardSectionHeader}>5. Measurement & Size Guide Reference</Text>
                  {renderSizeGuideCard()}
                </View>
              )}

              {/* VARIANT MATRIX BUILDER CARD */}
              <View style={styles.card}>
                <Text style={styles.cardSectionHeader}>6. Size & Color Variant Matrix</Text>
                <VariantMatrixBuilder
                  variantAttributes={schema.fields.map((f) => f.attribute).filter((a) => a.type === 'dropdown' || a.type === 'color' || a.type === 'size_selector' || a.type === 'radio' || a.isVariantAttribute)}
                  defaultVariantAttributeCodes={schema.fields.map((f) => f.attribute).filter((a) => a.isVariantAttribute || a.type === 'color' || a.type === 'size_selector').map(a => a.code)}
                  attributeValues={attributeValues}
                  variants={variants}
                  basePrice={Number(sellingPrice) > Number(mrpPrice) ? (Number(mrpPrice) || 1499) : (Number(sellingPrice) || 599)}
                  baseMrp={Number(sellingPrice) > Number(mrpPrice) ? (Number(sellingPrice) || 599) : (Number(mrpPrice) || 1499)}
                  onUpdateVariants={setVariants}
                />
              </View>
            </View>

            {/* RIGHT COLUMN: GUIDELINES & ANGLE MEDIA UPLOADS */}
            <View style={isDesktop ? styles.rightColDesktop : styles.fullWidthCol}>
              {/* Guidelines & Prohibited Types Card */}
              <View style={styles.guidelinesCard}>
                <View style={styles.guidelinesHeader}>
                  <AlertTriangle size={18} color="#D97706" />
                  <Text style={styles.guidelinesTitle}>Catalog Image Guidelines</Text>
                </View>

                <Image
                  source={PROHIBITED_GUIDELINE_IMAGE}
                  style={styles.guidelineBannerImage}
                  resizeMode="contain"
                />

                <Text style={styles.guidelinesSub}>
                  Upload crisp photos with pure white background. Do not include watermarks, selfie poses, or cropped angles.
                </Text>
              </View>

              {/* Angle Upload Slots */}
              <View style={styles.card}>
                <Text style={styles.cardSectionHeader}>Image Uploads & Angles</Text>

                {/* Main Front Image */}
                <Text style={styles.label}>1. Front View (Main Image) *</Text>

                {mainImageUrl ? (
                  <View style={styles.mainPreviewBox}>
                    <Image source={{ uri: mainImageUrl }} style={styles.mainPreviewImage} />
                    <View style={styles.mainImageTag}>
                      <Text style={styles.mainImageTagText}>FRONT VIEW MAIN</Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={{ backgroundColor: '#EEF2FF', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#C7D2FE', borderStyle: 'dashed', marginBottom: 12 }}
                    onPress={() => setIsImageModalVisible(true)}
                  >
                    <UploadCloud size={24} color="#4F46E5" style={{ marginBottom: 8 }} />
                    <Text style={{ color: '#4F46E5', fontWeight: '600', fontSize: 13 }}>Upload Main Image</Text>
                  </TouchableOpacity>
                )}

                {/* Additional Gallery Images */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 12 }}>
                  <Text style={styles.label}>2. Additional Angle Photos</Text>
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}
                    onPress={() => setIsImageModalVisible(true)}
                  >
                    <Plus size={14} color="#4F46E5" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#4F46E5' }}>Manage Images</Text>
                  </TouchableOpacity>
                </View>

                {/* Additional Thumbnails Grid */}
                <View style={styles.thumbGrid}>
                  {additionalImages.map((img, idx) => (
                    <View key={idx} style={styles.thumbWrapper}>
                      <Image source={{ uri: img }} style={styles.thumbImage} />
                      <TouchableOpacity
                        style={styles.delThumbBtn}
                        onPress={() => setAdditionalImages(additionalImages.filter((_, i) => i !== idx))}
                      >
                        <Trash2 size={10} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      {currentStep === 2 && (
        <View style={styles.bottomActionBar}>
          <TouchableOpacity style={styles.discardBtn} onPress={() => setCurrentStep(1)}>
            <Text style={styles.discardBtnText}>Change Category</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveDraftBtnBar} onPress={handleSaveDraft}>
            <CircleCheck size={16} color="#4F46E5" />
            <Text style={styles.saveDraftBarText}>Save Draft</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'column', flex: 1, alignItems: 'flex-end' }}>
            {submitError && (
              <View style={{ backgroundColor: '#FEE2E2', padding: 8, borderRadius: 6, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                <AlertTriangle size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={{ color: '#DC2626', fontWeight: '500', fontSize: 12 }}>{submitError}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.submitCatalogBtn}
              onPress={handleSubmitCatalog}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CircleCheck size={18} color="#FFFFFF" />
                  <Text style={styles.submitCatalogBtnText}>Submit Product Catalog</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* IMAGE QUALITY CHECK MODAL */}
      <ImageQualityCheckModal
        visible={isImageModalVisible}
        onClose={() => setIsImageModalVisible(false)}
        onConfirm={(selectedImages) => {
          setIsImageModalVisible(false);
          if (selectedImages.length > 0) {
            setMainImageUrl(selectedImages[0]);
            setAdditionalImages(selectedImages.slice(1));
          } else {
            setMainImageUrl('');
            setAdditionalImages([]);
          }
          setCurrentStep(2);
        }}
        initialImages={mainImageUrl ? [mainImageUrl, ...additionalImages] : additionalImages}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Soft warm cream background matching screenshot
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DF',
    flexWrap: 'wrap',
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  horizontalStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stepperStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperDotActive: {
    backgroundColor: '#4F46E5',
  },
  stepperNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepperNumberActive: {
    color: '#FFFFFF',
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  stepperLabelActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  stepperLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E2E8F0',
  },
  stepperLineActive: {
    backgroundColor: '#4F46E5',
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  saveDraftBtnText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8DF',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  exploreTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  exploreSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  cardSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  quickTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  searchResultsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    maxHeight: 160,
    marginBottom: 16,
    overflow: 'hidden',
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2FF',
  },
  searchResultText: {
    fontSize: 12,
    color: '#334155',
  },
  desktopStep1Layout: {
    flexDirection: 'row',
    gap: 16,
  },
  cascadingWrapperDesktop: {
    flex: 2,
  },
  previewColDesktop: {
    flex: 1,
  },
  drillDownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    height: 400,
  },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
  },
  breadcrumbItem: {
    paddingVertical: 4,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumbTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  breadcrumbSeparator: {
    marginHorizontal: 8,
    color: '#CBD5E1',
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tagChipText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    marginRight: 4,
  },
  tagChipRemove: {
    padding: 2,
  },
  drillDownContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  drillDownScroll: {
    flex: 1,
    padding: 16,
  },
  drillDownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  drillDownGridCard: {
    width: '30%',
    minWidth: 100,
    aspectRatio: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  drillDownIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  drillDownGridText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  drillDownList: {
    flex: 1,
  },
  drillDownListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  drillDownListItemActive: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    borderBottomWidth: 0,
  },
  drillDownListText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  drillDownListTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  emptyCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    padding: 14,
    gap: 12,
  },
  pathBannerHeader: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  pathBannerHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3730A3',
  },
  vectorDiagramBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  vectorDiagramImage: {
    width: '100%',
    height: 180,
  },
  frontImageNoticeText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  orangeAddProductsBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  orangeAddProductsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  desktopTwoColLayout: {
    flexDirection: 'row',
    gap: 16,
  },
  mobileLayout: {
    flexDirection: 'column',
    gap: 16,
  },
  leftColDesktop: {
    flex: 2,
  },
  rightColDesktop: {
    flex: 1,
  },
  fullWidthCol: {
    width: '100%',
  },
  formField: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  textarea: {
    height: 70,
    textAlignVertical: 'top',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 12,
  },
  payoutBox: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 8,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payoutLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  payoutValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  payoutSub: {
    fontSize: 10,
    color: '#047857',
    marginTop: 4,
  },
  guidelinesCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: 16,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  guidelinesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  guidelineBannerImage: {
    width: '100%',
    height: 140,
    borderRadius: 6,
    marginBottom: 10,
  },
  guidelinesSub: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 15,
  },
  imageInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  mainPreviewBox: {
    width: 120,
    height: 140,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 6,
    position: 'relative',
  },
  mainPreviewImage: {
    width: '100%',
    height: '100%',
  },
  mainImageTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainImageTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  thumbWrapper: {
    width: 60,
    height: 72,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  delThumbBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderRadius: 8,
    padding: 3,
  },
  orangePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
    flexWrap: 'wrap',
  },
  discardBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  discardBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  saveDraftBtnBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
  },
  saveDraftBarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  submitCatalogBtn: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 6,
  },
  submitCatalogBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
  },
});

