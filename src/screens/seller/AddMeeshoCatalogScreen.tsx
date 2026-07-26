import React, { useState } from 'react';
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
} from 'react-native';
import {
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  ShoppingBag,
  Search,
  Plus,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { addProduct } from '../../services/firebaseService';
import { ClothSizeVariant } from '../../types';
import { ESignatureModal } from '../../components/seller/ESignatureModal';
import { ImageQualityCheckModal } from '../../components/seller/ImageQualityCheckModal';
import { SizeSelectorModal } from '../../components/seller/SizeSelectorModal';

interface AddMeeshoCatalogScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

// 4-Level Cascading Category Data Structure matching screenshot
interface CategoryTreeData {
  id: string;
  name: string;
  subgroups: {
    id: string;
    name: string;
    groups: {
      id: string;
      name: string;
      leaves: string[];
    }[];
  }[];
}

const CASCADING_CATEGORIES: CategoryTreeData[] = [
  {
    id: 'men_fashion',
    name: 'Men Fashion',
    subgroups: [
      {
        id: 'mens_clothing',
        name: 'Mens Clothing',
        groups: [
          {
            id: 'men_top_wear',
            name: 'Men Top Wear',
            leaves: ['Tshirts', 'Shirts', 'Top & Bottom Set', 'Personalized Tshirts', 'Dad & Daughter Tshirts', 'Dad & Son Tshirts', 'Active Tshirts'],
          },
          {
            id: 'men_sports_wear',
            name: 'Men Sports Wear',
            leaves: ['Sports Tshirts', 'Track Pants', 'Gym Vests', 'Shorts'],
          },
          {
            id: 'men_ethnic_wear',
            name: 'Men Ethnic Wear',
            leaves: ['Kurtas', 'Sherwanis', 'Nehru Jackets', 'Pyjamas'],
          },
          {
            id: 'men_bottom_wear',
            name: 'Men Bottom Wear',
            leaves: ['Jeans & Trousers', 'Three Fourths', 'Cargo Shorts', 'Chinos', 'Track Pants'],
          },
        ],
      },
      {
        id: 'footwear',
        name: 'Footwear',
        groups: [
          { id: 'casual_shoes', name: 'Casual Shoes', leaves: ['Sneakers', 'Loafers', 'Canvas Shoes'] },
          { id: 'formal_shoes', name: 'Formal Shoes', leaves: ['Oxfords', 'Derbys', 'Monk Straps'] },
        ],
      },
    ],
  },
  {
    id: 'women_fashion',
    name: 'Women Fashion',
    subgroups: [
      {
        id: 'women_ethnic',
        name: 'Women Ethnic',
        groups: [
          { id: 'kurtis_sets', name: 'Kurtis & Sets', leaves: ['Anarkali Kurtis', 'Straight Kurtis', 'Kurta Sets', 'Tunics'] },
          { id: 'sarees', name: 'Sarees', leaves: ['Cotton Sarees', 'Silk Sarees', 'Georgette Sarees'] },
        ],
      },
      {
        id: 'women_western',
        name: 'Women Western',
        groups: [
          { id: 'dresses', name: 'Dresses', leaves: ['Maxi Dresses', 'Bodycon Dresses', 'A-Line Dresses'] },
          { id: 'tops_tees', name: 'Tops & Tees', leaves: ['Crop Tops', 'Blouses', 'Casual Tees'] },
        ],
      },
    ],
  },
  {
    id: 'home_living',
    name: 'Home & Living',
    subgroups: [
      {
        id: 'home_decor',
        name: 'Home Decor',
        groups: [
          { id: 'bedding', name: 'Bedding', leaves: ['Bed Sheets', 'Blankets', 'Pillow Covers'] },
          { id: 'curtains', name: 'Curtains & Drapes', leaves: ['Window Curtains', 'Door Curtains'] },
        ],
      },
    ],
  },
  {
    id: 'kids_toys',
    name: 'Kids & Toys',
    subgroups: [
      {
        id: 'kids_clothing',
        name: 'Kids Clothing',
        groups: [
          { id: 'boys_wear', name: 'Boys Wear', leaves: ['Boys T-Shirts', 'Boys Shorts', 'Boys Jeans'] },
          { id: 'girls_wear', name: 'Girls Wear', leaves: ['Girls Frocks', 'Girls Tops', 'Girls Skirts'] },
        ],
      },
      {
        id: 'toys_games',
        name: 'Toys & Games',
        groups: [
          { id: 'educational_toys', name: 'Educational Toys', leaves: ['Puzzles', 'Building Blocks', 'Board Games'] },
        ],
      },
    ],
  },
  {
    id: 'personal_care_wellness',
    name: 'Personal Care & Wellness',
    subgroups: [
      {
        id: 'wellness_supplements',
        name: 'Wellness Supplements',
        groups: [
          { id: 'health_drinks', name: 'Health Drinks', leaves: ['Protein Powders', 'Immunity Boosters', 'Multivitamins'] },
        ],
      },
    ],
  },
  {
    id: 'mobiles_tablets',
    name: 'Mobiles & Tablets',
    subgroups: [
      {
        id: 'mobile_accessories',
        name: 'Mobile Accessories',
        groups: [
          { id: 'cases_covers', name: 'Cases & Covers', leaves: ['Back Covers', 'Flip Covers', 'Screen Protectors'] },
          { id: 'chargers_cables', name: 'Chargers & Cables', leaves: ['Fast Chargers', 'Type-C Cables', 'Power Banks'] },
        ],
      },
    ],
  },
  {
    id: 'consumer_electronics',
    name: 'Consumer Electronics',
    subgroups: [
      {
        id: 'audio',
        name: 'Audio Electronics',
        groups: [
          { id: 'headphones', name: 'Headphones & Earbuds', leaves: ['Bluetooth Earbuds', 'Over-Ear Headphones', 'Neckbands'] },
        ],
      },
    ],
  },
  {
    id: 'appliances',
    name: 'Appliances',
    subgroups: [
      {
        id: 'kitchen_appliances',
        name: 'Kitchen Appliances',
        groups: [
          { id: 'mixers_juicers', name: 'Mixer Grinders', leaves: ['3-Jar Mixers', 'Juicers', 'Blenders'] },
        ],
      },
    ],
  },
  {
    id: 'automotive',
    name: 'Automotive',
    subgroups: [
      {
        id: 'bike_accessories',
        name: 'Bike Accessories',
        groups: [
          { id: 'helmets', name: 'Riding Gear', leaves: ['Helmets', 'Riding Gloves', 'Bike Covers'] },
        ],
      },
    ],
  },
  {
    id: 'beauty_personal_care',
    name: 'Beauty & Personal Care',
    subgroups: [
      {
        id: 'skincare',
        name: 'Skincare',
        groups: [
          { id: 'face_care', name: 'Face Care', leaves: ['Face Wash', 'Moisturizers', 'Sunscreens', 'Face Serums'] },
        ],
      },
    ],
  },
  {
    id: 'home_utility',
    name: 'Home Utility',
    subgroups: [
      {
        id: 'cleaning_utility',
        name: 'Cleaning Utilities',
        groups: [
          { id: 'mops_brooms', name: 'Mops & Brooms', leaves: ['Spin Mops', 'Wipers', 'Dustbins'] },
        ],
      },
    ],
  },
  {
    id: 'kids',
    name: 'Kids',
    subgroups: [
      {
        id: 'baby_care',
        name: 'Baby Care',
        groups: [
          { id: 'diapering', name: 'Diapers & Wipes', leaves: ['Baby Diapers', 'Wet Wipes', 'Diaper Bags'] },
        ],
      },
    ],
  },
  {
    id: 'grocery',
    name: 'Grocery',
    subgroups: [
      {
        id: 'packaged_food',
        name: 'Staples & Spices',
        groups: [
          { id: 'spices_masala', name: 'Spices & Masala', leaves: ['Turmeric Powder', 'Garam Masala', 'Chilli Powder'] },
        ],
      },
    ],
  },
  {
    id: 'women',
    name: 'Women',
    subgroups: [
      {
        id: 'women_lingerie',
        name: 'Lingerie & Sleepwear',
        groups: [
          { id: 'innerwear', name: 'Innerwear', leaves: ['Bras', 'Briefs', 'Shapewear', 'Nightdresses'] },
        ],
      },
    ],
  },
  {
    id: 'home_kitchen',
    name: 'Home & Kitchen',
    subgroups: [
      {
        id: 'cookware_dining',
        name: 'Cookware & Dining',
        groups: [
          { id: 'dinner_sets', name: 'Dinnerware', leaves: ['Dinner Sets', 'Glassware', 'Water Bottles'] },
        ],
      },
    ],
  },
  {
    id: 'health_wellness',
    name: 'Health & Wellness',
    subgroups: [
      {
        id: 'fitness_supplements',
        name: 'Fitness Supplements',
        groups: [
          { id: 'proteins', name: 'Proteins & Amino', leaves: ['Whey Protein', 'BCAA', 'Creatine'] },
        ],
      },
    ],
  },
  {
    id: 'beauty_makeup',
    name: 'Beauty & Makeup',
    subgroups: [
      {
        id: 'makeup_cosmetics',
        name: 'Cosmetics',
        groups: [
          { id: 'lip_makeup', name: 'Lip Care', leaves: ['Lipsticks', 'Lip Gloss', 'Lip Liners'] },
        ],
      },
    ],
  },
  {
    id: 'personal_care_cat',
    name: 'Personal Care',
    subgroups: [
      {
        id: 'bath_body',
        name: 'Bath & Body',
        groups: [
          { id: 'soaps_wash', name: 'Soaps & Body Wash', leaves: ['Bathing Soaps', 'Body Wash', 'Hand Wash'] },
        ],
      },
    ],
  },
  {
    id: 'mens_grooming',
    name: 'Men\'S Grooming',
    subgroups: [
      {
        id: 'beard_shaving',
        name: 'Beard & Shaving Care',
        groups: [
          { id: 'beard_care', name: 'Beard Care', leaves: ['Beard Oil', 'Beard Wash', 'Trimmers', 'Shaving Foam'] },
        ],
      },
    ],
  },
  {
    id: 'craft_office_supplies',
    name: 'Craft & Office Supplies',
    subgroups: [
      {
        id: 'craft_tools',
        name: 'Craft Supplies',
        groups: [
          { id: 'art_craft', name: 'Art Materials', leaves: ['Acrylic Paints', 'Canvas Boards', 'Paint Brushes'] },
        ],
      },
    ],
  },
  {
    id: 'sports_fitness',
    name: 'Sports & Fitness',
    subgroups: [
      {
        id: 'fitness_equipment',
        name: 'Fitness Equipment',
        groups: [
          { id: 'gym_gear', name: 'Gym Gear', leaves: ['Dumbbells', 'Resistance Bands', 'Yoga Mats'] },
        ],
      },
    ],
  },
  {
    id: 'automotive_accessories',
    name: 'Automotive Accessories',
    subgroups: [
      {
        id: 'car_accessories',
        name: 'Car Accessories',
        groups: [
          { id: 'car_care', name: 'Car Interior', leaves: ['Car Seat Covers', 'Car Perfumes', 'Floor Mats'] },
        ],
      },
    ],
  },
  {
    id: 'pet_supplies',
    name: 'Pet Supplies',
    subgroups: [
      {
        id: 'dog_cat_supplies',
        name: 'Dog & Cat Supplies',
        groups: [
          { id: 'pet_food', name: 'Pet Food', leaves: ['Dog Food', 'Cat Treats', 'Pet Shampoos'] },
        ],
      },
    ],
  },
  {
    id: 'office_stationery',
    name: 'Office Supplies & Stationery',
    subgroups: [
      {
        id: 'stationery_items',
        name: 'Stationery',
        groups: [
          { id: 'notebooks_pens', name: 'Writing & Paper', leaves: ['Notebooks', 'Gel Pens', 'Markers', 'Files'] },
        ],
      },
    ],
  },
  {
    id: 'industrial_scientific',
    name: 'Industrial & Scientific Products',
    subgroups: [
      {
        id: 'lab_safety',
        name: 'Industrial Safety',
        groups: [
          { id: 'safety_gear', name: 'Safety Equipment', leaves: ['Safety Goggles', 'Work Gloves', 'Safety Shoes'] },
        ],
      },
    ],
  },
  {
    id: 'musical_instruments',
    name: 'Musical Instruments',
    subgroups: [
      {
        id: 'string_instruments',
        name: 'String Instruments',
        groups: [
          { id: 'guitars', name: 'Guitars & Ukuleles', leaves: ['Acoustic Guitars', 'Electric Guitars', 'Ukuleles'] },
        ],
      },
    ],
  },
  {
    id: 'books',
    name: 'Books',
    subgroups: [
      {
        id: 'academic_fiction',
        name: 'Literature & Academic',
        groups: [
          { id: 'novels', name: 'Novels & Fiction', leaves: ['Best Sellers', 'Self-Help Books', 'Competitive Exam Books'] },
        ],
      },
    ],
  },
  {
    id: 'eye_utility',
    name: 'Eye Utility',
    subgroups: [
      {
        id: 'eyewear',
        name: 'Eyewear & Accessories',
        groups: [
          { id: 'glasses', name: 'Glasses & Frames', leaves: ['Sunglasses', 'Computer Glasses', 'Reading Glasses'] },
        ],
      },
    ],
  },
  {
    id: 'bags_luggage',
    name: 'Bags, Luggage & Travel Accessories',
    subgroups: [
      {
        id: 'travel_bags',
        name: 'Luggage & Bags',
        groups: [
          { id: 'backpacks', name: 'Backpacks & Trolleys', leaves: ['Laptop Backpacks', 'Trolley Bags', 'Duffle Bags'] },
        ],
      },
    ],
  },
  {
    id: 'mens_personal_care_grooming',
    name: 'Mens Personal Care & Grooming',
    subgroups: [
      {
        id: 'men_grooming_kits',
        name: 'Grooming Kits',
        groups: [
          { id: 'hair_styling', name: 'Hair Care', leaves: ['Hair Wax', 'Hair Cream', 'Beard Trimmers'] },
        ],
      },
    ],
  },
];

const DEFAULT_BOTTOMWEAR_SIZES: ClothSizeVariant[] = [
  { size: '28', waistInches: 28, hipInches: 36, lengthInches: 40, stock: 25, price: 549, mrp: 1299, enabled: true, sku: 'JEAN-W28' },
  { size: '30', waistInches: 30, hipInches: 38, lengthInches: 40, stock: 40, price: 549, mrp: 1299, enabled: true, sku: 'JEAN-W30' },
  { size: '32', waistInches: 32, hipInches: 40, lengthInches: 41, stock: 35, price: 549, mrp: 1299, enabled: true, sku: 'JEAN-W32' },
  { size: '34', waistInches: 34, hipInches: 42, lengthInches: 41, stock: 20, price: 549, mrp: 1299, enabled: true, sku: 'JEAN-W34' },
];

const ALL_SIZE_OPTIONS = [
  '24',
  '26',
  '28',
  '30',
  '32',
  '34',
  '36',
  '38',
  '40',
  '42',
  '44',
  '46',
  '48',
  '50',
  '52',
  'Free Size',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXS',
  'XXXL',
  'XXXXL',
];

export const AddMeeshoCatalogScreen: React.FC<AddMeeshoCatalogScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 640;

  const { sellerProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showESignatureModal, setShowESignatureModal] = useState<boolean>(false);
  const [showQualityCheckModal, setShowQualityCheckModal] = useState<boolean>(false);
  const [isSignatureAdded, setIsSignatureAdded] = useState<boolean>(false);

  // Category Selection Cascading Tree State
  const [selectedL1, setSelectedL1] = useState<string | null>('men_fashion');
  const [selectedL2, setSelectedL2] = useState<string | null>('mens_clothing');
  const [selectedL3, setSelectedL3] = useState<string | null>('men_top_wear');
  const [selectedL4, setSelectedL4] = useState<string | null>('Tshirts');
  const [searchCategoryText, setSearchCategoryText] = useState<string>('');

  // Step 2 Form State
  const [productTitle, setProductTitle] = useState<string>('Men Regular Fit Solid Casual T-Shirt');
  const [productFabric, setProductFabric] = useState<string>('100% Pure Cotton');
  const [productPattern, setPattern] = useState<string>('Solid / Plain');
  const [productColor, setColor] = useState<string>('Navy Blue');
  const [productFitType, setFitType] = useState<string>('Regular Fit');
  const [mrpPrice, setMrpPrice] = useState<string>('1299');
  const [sellingPrice, setSellingPrice] = useState<string>('549');
  const [meeshoDiscountPrice, setMeeshoDiscountPrice] = useState<string>('499');
  const [selectedImages, setSelectedImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
  ]);
  const [backViewImage, setBackViewImage] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [sizes, setSizes] = useState<ClothSizeVariant[]>(DEFAULT_BOTTOMWEAR_SIZES);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Size Picker Popover State
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState<boolean>(false);
  const [selectedSizesList, setSelectedSizesList] = useState<string[]>(['28', '30', '32', '34']);
  const [tempSelectedSizes, setTempSelectedSizes] = useState<string[]>(['28', '30', '32', '34']);

  // New Step 2 Fields matching screenshot
  const [copyDetailsToAll, setCopyDetailsToAll] = useState<boolean>(true);
  const [netWeight, setNetWeight] = useState<string>('450');
  const [styleCode, setStyleCode] = useState<string>('STY-APP-984');
  const [selectedSizeSingle, setSelectedSizeSingle] = useState<string>('30');
  const [genericName, setGenericName] = useState<string>('Three Fourths');
  const [netQuantity, setNetQuantity] = useState<string>('1');
  const [countryOfOrigin, setCountryOfOrigin] = useState<string>('India');
  const [manufacturerName, setManufacturerName] = useState<string>('Al Mursaleen Apparel Pvt Ltd');
  const [manufacturerAddress, setManufacturerAddress] = useState<string>('Plot 42, Industrial Area, Sector 62');
  const [manufacturerPincode, setManufacturerPincode] = useState<string>('201301');
  const [packerName, setPackerName] = useState<string>('Al Mursaleen Logistics');
  const [packerAddress, setPackerAddress] = useState<string>('Plot 42, Industrial Area, Sector 62');
  const [packerPincode, setPackerPincode] = useState<string>('201301');
  const [sameAsManufacturer, setSameAsManufacturer] = useState<boolean>(true);
  const [importerName, setImporterName] = useState<string>('N/A');
  const [importerAddress, setImporterAddress] = useState<string>('N/A');
  const [importerPincode, setImporterPincode] = useState<string>('000000');

  // Other Attributes Fields
  const [bottomType, setBottomType] = useState<string>('Three Fourths');
  const [brand, setBrand] = useState<string>('Al Mursaleen');
  const [fitShape, setFitShape] = useState<string>('Regular Fit');
  const [numberOfPockets, setNumberOfPockets] = useState<string>('4');
  const [occasion, setOccasion] = useState<string>('Casual');
  const [original, setOriginal] = useState<string>('Yes');
  const [printPatternType, setPrintPatternType] = useState<string>('Solid');
  const [waistClosure, setWaistClosure] = useState<string>('Drawstring & Elastic');
  const [waistRise, setWaistRise] = useState<string>('Mid Rise');
  const [descriptionText, setDescriptionText] = useState<string>(
    'Comfortable 100% cotton Three Fourths for daily casual wear. Features durable stitching, multi-pockets, and adjustable drawstring waist.'
  );

  // Current L1 node
  const l1Node = CASCADING_CATEGORIES.find((c) => c.id === selectedL1) || null;
  // Current L2 node
  const l2Node = l1Node?.subgroups.find((s) => s.id === selectedL2) || null;
  // Current L3 node
  const l3Node = l2Node?.groups.find((g) => g.id === selectedL3) || null;
  // Current L4 leaves
  const l4Leaves = l3Node?.leaves || [];

  // Breadcrumb text
  const breadcrumbText = [
    l1Node?.name,
    l2Node?.name,
    l3Node?.name,
    selectedL4,
  ]
    .filter(Boolean)
    .join(' / ');

  // Net Payout Calculation
  const numericSellingPrice = parseFloat(sellingPrice) || 0;
  const estimatedShippingFee = 72;
  const estimatedPayout = Math.max(0, numericSellingPrice - estimatedShippingFee);

  const handlePublishCatalog = async () => {
    setIsSubmitting(true);
    try {
      const newProductData = {
        title: productTitle || `${l1Node.name} Apparel Item`,
        description: `Premium ${productFabric} ${selectedL4}. Features ${productFitType} cut with comfortable waist/chest fit. Ideal for daily casual and festive wear.`,
        price: numericSellingPrice,
        mrp: parseFloat(mrpPrice) || 1299,
        meeshoDiscountPrice: parseFloat(meeshoDiscountPrice) || 499,
        images: selectedImages,
        imageUrl: selectedImages[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        category: l1Node.name,
        subcategory: `${l2Node?.name} > ${selectedL4}`,
        sellerId: sellerProfile.id || 'seller_1',
        sellerName: sellerProfile.storeName || 'Al Mursaleen Stores',
        stock: sizes.reduce((sum, s) => sum + (s.enabled ? s.stock : 0), 0),
        unit: 'piece',
        rating: 4.8,
        reviewsCount: 14,
        reviewCount: 14,
        tags: [l1Node.name, selectedL4, productFabric],
        isHyperlocalAvailable: true,
        fabric: productFabric,
        pattern: productPattern,
        color: productColor,
        fitType: productFitType,
        sizes: sizes.filter((s) => s.enabled),
        catalogId: `MSH-CAT-${Math.floor(10000 + Math.random() * 90000)}`,
        sellerCode: `SLR-CODE-${Math.floor(100 + Math.random() * 900)}`,
      };

      await addProduct(newProductData);
      setIsSubmitting(false);
      onSuccess();
    } catch (err) {
      console.error('Error publishing catalog:', err);
      setIsSubmitting(false);
      onSuccess();
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP E-SIGNATURE MISSING RED BANNER */}
      {!isSignatureAdded && (
        <View style={styles.signatureBanner}>
          <View style={styles.signatureIconBox}>
            <AlertTriangle size={18} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.signatureBannerTitle}>Your E-Signature is missing!</Text>
            <Text style={styles.signatureBannerSub}>
              E-signature is required for raising invoices / credit notes on your behalf to customers
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addSigBtn}
            onPress={() => setShowESignatureModal(true)}
          >
            <Text style={styles.addSigBtnText}>Add Signature</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. TOP HEADER ROW */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Single Catalog</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerAddImagesBtn}
            onPress={() => setShowQualityCheckModal(true)}
          >
            <UploadCloud size={14} color="#FFFFFF" />
            <Text style={styles.headerAddImagesBtnText}>⬆ Add Product Images</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.learnVideoBtn}>
            <Sparkles size={14} color="#DC2626" />
            <Text style={styles.learnVideoText}>Learn to upload single catalog?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.needHelpBtn}>
            <Sparkles size={14} color="#4F46E5" />
            <Text style={styles.needHelpText}>Need Help?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. STEPPER TABS (1 SELECT CATEGORY | 2 ADD PRODUCT DETAILS) */}
      <View style={styles.stepperContainer}>
        <TouchableOpacity
          style={[styles.stepTabItem, currentStep === 1 && styles.stepTabItemActive]}
          onPress={() => setCurrentStep(1)}
        >
          <View style={[styles.stepNum, currentStep === 1 && styles.stepNumActive]}>
            <Text style={[styles.stepNumText, currentStep === 1 && styles.stepNumTextActive]}>1</Text>
          </View>
          <Text style={[styles.stepTabText, currentStep === 1 && styles.stepTabTextActive]}>
            Select Category
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepTabItem, currentStep === 2 && styles.stepTabItemActive]}
          onPress={() => setCurrentStep(2)}
        >
          <View style={[styles.stepNum, currentStep === 2 && styles.stepNumActive]}>
            <Text style={[styles.stepNumText, currentStep === 2 && styles.stepNumTextActive]}>2</Text>
          </View>
          <Text style={[styles.stepTabText, currentStep === 2 && styles.stepTabTextActive]}>
            Add Product Details
          </Text>
        </TouchableOpacity>
      </View>

      {currentStep === 1 ? (
        /* STEP 1: CASCADING CATEGORY BROWSER & UPLOAD CARD */
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
          {/* SEARCH CATEGORY BAR */}
          <Text style={styles.searchCategoryTitle}>Search Category</Text>
          <View style={styles.searchCategoryBar}>
            <Search size={16} color="#64748B" />
            <TextInput
              style={styles.searchCategoryInput}
              placeholder="Try Sarees, Toys, Charger, Mugs and more..."
              value={searchCategoryText}
              onChangeText={setSearchCategoryText}
            />
          </View>

          {/* CASCADING COLUMNS & RIGHT UPLOAD CARD GRID */}
          <View style={[styles.cascadingLayoutGrid, !isDesktop && styles.cascadingLayoutGridMobile]}>
            {/* 4 CASCADING COLUMNS BROWSER */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: isDesktop ? 3 : undefined, width: '100%' }}>
              <View style={[styles.cascadingColumnsRow, !isDesktop && { minWidth: 640 }]}>
                {/* COLUMN 1: ROOT L1 */}
                <View style={styles.categoryCol}>
                  <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                    {CASCADING_CATEGORIES.map((cat) => {
                      const isSelected = selectedL1 === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[styles.colItem, isSelected && styles.colItemActive]}
                          onPress={() => {
                            setSelectedL1(cat.id);
                            setSelectedL2(null);
                            setSelectedL3(null);
                            setSelectedL4(null);
                          }}
                        >
                          <Text style={[styles.colItemText, isSelected && styles.colItemTextActive]}>
                            {cat.name}
                          </Text>
                          {isSelected && <Text style={styles.arrowRibbon}>►</Text>}
                        </TouchableOpacity>
                      );
                    })}
                    <View style={styles.cantFindBox}>
                      <Text style={styles.cantFindText}>Can't find the category?</Text>
                      <Text style={styles.searchCatLink}>Search Category</Text>
                    </View>
                  </ScrollView>
                </View>

                {/* COLUMN 2: SUB-GROUP L2 */}
                {l1Node && l1Node.subgroups.length > 0 && (
                  <View style={styles.categoryCol}>
                    <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                      {l1Node.subgroups.map((sub) => {
                        const isSelected = selectedL2 === sub.id;
                        return (
                          <TouchableOpacity
                            key={sub.id}
                            style={[styles.colItem, isSelected && styles.colItemActive]}
                            onPress={() => {
                              setSelectedL2(sub.id);
                              setSelectedL3(null);
                              setSelectedL4(null);
                            }}
                          >
                            <Text style={[styles.colItemText, isSelected && styles.colItemTextActive]}>
                              {sub.name}
                            </Text>
                            {isSelected && <Text style={styles.arrowRibbon}>►</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* COLUMN 3: CATEGORY GROUP L3 */}
                {l2Node && l2Node.groups.length > 0 && (
                  <View style={styles.categoryCol}>
                    <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                      {l2Node.groups.map((grp) => {
                        const isSelected = selectedL3 === grp.id;
                        return (
                          <TouchableOpacity
                            key={grp.id}
                            style={[styles.colItem, isSelected && styles.colItemActive]}
                            onPress={() => {
                              setSelectedL3(grp.id);
                              setSelectedL4(null);
                            }}
                          >
                            <Text style={[styles.colItemText, isSelected && styles.colItemTextActive]}>
                              {grp.name}
                            </Text>
                            {isSelected && <Text style={styles.arrowRibbon}>►</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* COLUMN 4: LEAF CATEGORY L4 */}
                {l3Node && l4Leaves.length > 0 && (
                  <View style={styles.categoryCol}>
                    <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                      {l4Leaves.map((leaf) => {
                        const isSelected = selectedL4 === leaf;
                        return (
                          <TouchableOpacity
                            key={leaf}
                            style={[styles.colItem, isSelected && styles.colItemActive]}
                            onPress={() => setSelectedL4(leaf)}
                          >
                            <Text style={[styles.colItemText, isSelected && styles.colItemTextActive]}>
                              {leaf}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* RIGHT SIDE PREVIEW CARD & UPLOAD BUTTON */}
            <View style={[styles.rightPreviewCard, isDesktop && { flex: 1.8 }]}>
              <View style={styles.breadcrumbHeader}>
                <Text style={styles.breadcrumbText}>
                  {breadcrumbText || 'Please select category'}
                </Text>
              </View>

              <View style={styles.previewContent}>
                {/* Silhouette / Body Measurement Diagram Placeholder */}
                <View style={styles.silhouetteBox}>
                  <Image
                    source={{
                      uri: selectedImages[0] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80',
                    }}
                    style={styles.silhouetteImage}
                  />
                </View>

                <Text style={styles.uploadPromptText}>
                  {selectedL4
                    ? 'Please provide only front image for each product'
                    : 'Please select category & subcategory to upload product'}
                </Text>

                <TouchableOpacity
                  style={styles.addImagesBtn}
                  onPress={() => {
                    if (!selectedL4) {
                      alert('Please select a leaf category from the category list first (e.g. Tshirts, Sarees).');
                      return;
                    }
                    setShowQualityCheckModal(true);
                  }}
                >
                  <UploadCloud size={18} color="#FFFFFF" />
                  <Text style={styles.addImagesBtnText}>⬆ Add Product Images</Text>
                </TouchableOpacity>

                <View style={styles.imageGuideBox}>
                  <Text style={styles.imageGuideText}>
                    💡 Follow image resolution guide: High-res front view photo without watermarks.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* STEP 2: ADD PRODUCT DETAILS & ANGLE IMAGES */
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
          {/* PRODUCT TABS BAR */}
          <View style={styles.productTabsRow}>
            <View style={styles.activeProductTab}>
              <Image source={{ uri: selectedImages[0] }} style={styles.productTabThumb} />
              <Text style={styles.productTabText}>Product 1</Text>
            </View>

            <TouchableOpacity
              style={styles.addProductTabBtn}
              onPress={() => setShowQualityCheckModal(true)}
            >
              <Plus size={16} color="#4338CA" />
              <Text style={styles.addProductTabBtnText}>Add Product</Text>
            </TouchableOpacity>
          </View>

          {/* TWO-COLUMN GRID: LEFT FORM & RIGHT GUIDELINES / ANGLE UPLOADS */}
          <View style={[styles.step2LayoutGrid, !isDesktop && styles.step2LayoutGridMobile]}>
            {/* LEFT FORM COLUMN */}
            <View style={[styles.step2LeftFormCol, isDesktop && { flex: 1.8 }]}>
              <Text style={styles.addDetailsHeading}>Add Product Details</Text>

              {/* Copy input details banner */}
              <TouchableOpacity
                style={styles.copyDetailsBanner}
                onPress={() => setCopyDetailsToAll(!copyDetailsToAll)}
              >
                <View style={[styles.checkboxBox, copyDetailsToAll && styles.checkboxBoxChecked]}>
                  {copyDetailsToAll && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.copyDetailsTitle}>Copy input details to all product</Text>
                  <Text style={styles.copyDetailsSub}>
                    If you want to change specific fields for particular product like Color, Fabric etc, you can change it by selecting that product.
                  </Text>
                </View>
              </TouchableOpacity>

              {/* SECTION 1: PRODUCT, SIZE AND INVENTORY */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>Product, Size and Inventory</Text>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Net Weight (gms) <Text style={styles.redAsterisk}>*</Text></Text>
                <TextInput
                  style={styles.textInputFull}
                  placeholder="Enter Net Weight (gms)"
                  value={netWeight}
                  onChangeText={setNetWeight}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Style code/ Product ID (optional)</Text>
                <TextInput
                  style={styles.textInputFull}
                  placeholder="Enter Style code/ Product ID (opt)"
                  value={styleCode}
                  onChangeText={setStyleCode}
                />
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Size <Text style={styles.redAsterisk}>*</Text></Text>
                <TouchableOpacity
                  style={styles.dropdownBoxFull}
                  onPress={() => setIsSizeDropdownOpen(true)}
                >
                  <Text style={styles.dropdownValueText}>
                    {selectedSizesList.length > 0
                      ? selectedSizesList.join(', ')
                      : 'Select Sizes'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Sizes & Waist Inches Matrix Table */}
              <Text style={styles.matrixTableTitle}>Size & Measurement Matrix (Inches)</Text>
              <View style={styles.tableCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ minWidth: 540 }}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.th, { flex: 0.8 }]}>Size</Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>Waist (Inch)</Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>Length (Inch)</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Stock</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Price (₹)</Text>
                    </View>

                    {sizes.map((sz, idx) => (
                      <View key={sz.size} style={styles.tableRow}>
                        <Text style={[styles.tdBold, { flex: 0.8 }]}>{sz.size}</Text>
                        <Text style={[styles.tdText, { flex: 1.2 }]}>{sz.waistInches}" Waist</Text>
                        <Text style={[styles.tdText, { flex: 1.2 }]}>{sz.lengthInches}" Length</Text>
                        <TextInput
                          style={[styles.miniInput, { flex: 1 }]}
                          keyboardType="numeric"
                          value={String(sz.stock)}
                          onChangeText={(val) => {
                            const updated = [...sizes];
                            updated[idx].stock = parseInt(val) || 0;
                            setSizes(updated);
                          }}
                        />
                        <TextInput
                          style={[styles.miniInput, { flex: 1 }]}
                          keyboardType="numeric"
                          value={String(sz.price)}
                          onChangeText={(val) => {
                            const updated = [...sizes];
                            updated[idx].price = parseInt(val) || 0;
                            setSizes(updated);
                          }}
                        />
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* SECTION 2: PRODUCT DETAILS */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>Product Details</Text>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Color <Text style={styles.redAsterisk}>*</Text></Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{productColor}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Fabric <Text style={styles.redAsterisk}>*</Text></Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{productFabric}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Generic Name <Text style={styles.redAsterisk}>*</Text></Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{genericName}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Net Quantity (N) <Text style={styles.redAsterisk}>*</Text></Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{netQuantity}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Pattern <Text style={styles.redAsterisk}>*</Text></Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{productPattern}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>COUNTRY OF ORIGIN <Text style={styles.redAsterisk}>*</Text></Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{countryOfOrigin}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Manufacturer Name <Text style={styles.redAsterisk}>*</Text></Text>
                <TextInput style={styles.textInputFull} placeholder="Enter Manufacturer Name" value={manufacturerName} onChangeText={setManufacturerName} />
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Manufacturer Address <Text style={styles.redAsterisk}>*</Text></Text>
                <TextInput style={styles.textInputFull} placeholder="Enter Manufacturer Address" value={manufacturerAddress} onChangeText={setManufacturerAddress} />
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Manufacturer Pincode <Text style={styles.redAsterisk}>*</Text></Text>
                <TextInput style={styles.textInputFull} placeholder="Enter Manufacturer Pincode" value={manufacturerPincode} onChangeText={setManufacturerPincode} keyboardType="numeric" />
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Packer Name <Text style={styles.redAsterisk}>*</Text></Text>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.textInputFull} placeholder="Enter Packer Name" value={packerName} onChangeText={setPackerName} />
                  <TouchableOpacity style={styles.sameAsCheckboxRow} onPress={() => setSameAsManufacturer(!sameAsManufacturer)}>
                    <View style={[styles.checkboxBoxSmall, sameAsManufacturer && styles.checkboxBoxChecked]}>
                      {sameAsManufacturer && <Text style={styles.checkboxCheckSmall}>✓</Text>}
                    </View>
                    <Text style={styles.sameAsText}>Same as Manufacturer Details</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Packer Address <Text style={styles.redAsterisk}>*</Text></Text>
                <TextInput style={styles.textInputFull} placeholder="Enter Packer Address" value={packerAddress} onChangeText={setPackerAddress} />
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Packer Pincode <Text style={styles.redAsterisk}>*</Text></Text>
                <TextInput style={styles.textInputFull} placeholder="Enter Packer Pincode" value={packerPincode} onChangeText={setPackerPincode} keyboardType="numeric" />
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Importer Name <Text style={styles.redAsterisk}>*</Text></Text>
                <TextInput style={styles.textInputFull} placeholder="Enter Importer Name" value={importerName} onChangeText={setImporterName} />
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Importer Address <Text style={styles.redAsterisk}>*</Text></Text>
                <TextInput style={styles.textInputFull} placeholder="Enter Importer Address" value={importerAddress} onChangeText={setImporterAddress} />
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Importer Pincode <Text style={styles.redAsterisk}>*</Text></Text>
                <TextInput style={styles.textInputFull} placeholder="Enter Importer Pincode" value={importerPincode} onChangeText={setImporterPincode} keyboardType="numeric" />
              </View>

              {/* SECTION 3: OTHER ATTRIBUTES */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderTitle}>Other Attributes</Text>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Bottom Type</Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{bottomType}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Brand</Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{brand}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Fit / Shape</Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{fitShape}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Number of Pockets</Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{numberOfPockets}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Occasion</Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{occasion}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Original</Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{original}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Print or Pattern Type</Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{printPatternType}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Waist Closure</Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{waistClosure}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Waist Rise</Text>
                <View style={styles.dropdownBoxFull}>
                  <Text style={styles.dropdownValueText}>{waistRise}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </View>

              <View style={styles.formRowField}>
                <Text style={styles.fieldLabelRow}>Description</Text>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.textAreaFull}
                    multiline
                    numberOfLines={4}
                    placeholder="Enter Description"
                    value={descriptionText}
                    onChangeText={setDescriptionText}
                  />
                  <Text style={styles.charCountText}>0/1000</Text>
                </View>
              </View>

              {/* FOOTER ACTION BUTTONS */}
              <View style={styles.bottomBarRow}>
                <TouchableOpacity style={styles.discardBtn} onPress={onBack}>
                  <Text style={styles.discardBtnText}>Discard Catalog</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBackBtn} onPress={() => setCurrentStep(1)}>
                  <Text style={styles.saveBackBtnText}>Save and Go Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitCatalogBtn}
                  disabled={isSubmitting}
                  onPress={handlePublishCatalog}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitCatalogBtnText}>Submit Catalog</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* RIGHT GUIDELINES & ANGLE IMAGE UPLOADS COLUMN */}
            <View style={[styles.step2RightGuidelinesCol, isDesktop && { flex: 1 }]}>
              {/* Yellow Tip Box */}
              <View style={styles.guidelinesAlertBox}>
                <Sparkles size={16} color="#D97706" />
                <Text style={styles.guidelinesAlertText}>
                  Follow guidelines to reduce Quality-Check failure
                </Text>
              </View>

              {/* Image Guidelines */}
              <View style={styles.guidelinesCard}>
                <View style={styles.guidelinesHeader}>
                  <Text style={styles.guidelinesTitle}>Image Guidelines</Text>
                  <Text style={styles.guidelinesLink}>View Full Image Guidelines</Text>
                </View>

                <View style={styles.guidelineItemRow}>
                  <Text style={styles.guidelineNum}>1</Text>
                  <Text style={styles.guidelineText}>Images with text/Watermark are not acceptable as primary images.</Text>
                </View>
                <View style={styles.guidelineItemRow}>
                  <Text style={styles.guidelineNum}>2</Text>
                  <Text style={styles.guidelineText}>Product image should not have any text.</Text>
                </View>
                <View style={styles.guidelineItemRow}>
                  <Text style={styles.guidelineNum}>3</Text>
                  <Text style={styles.guidelineText}>Please add solo product image without any props.</Text>
                </View>
              </View>

              {/* Add images with details listed here */}
              <View style={styles.angleUploadsCard}>
                <Text style={styles.angleSectionTitle}>Add images with details listed here</Text>

                {/* Front View */}
                <View style={styles.angleRow}>
                  <Image source={{ uri: selectedImages[0] }} style={styles.angleThumbImage} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.angleTitle}>Front View <Text style={styles.redAsterisk}>*</Text></Text>
                    <Text style={styles.angleSub}>Upload Front View Image</Text>
                  </View>
                </View>

                {/* Back View */}
                <TouchableOpacity
                  style={styles.angleRow}
                  onPress={() => {
                    const sampleBack = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80';
                    setBackViewImage(sampleBack);
                  }}
                >
                  {backViewImage ? (
                    <Image source={{ uri: backViewImage }} style={styles.angleThumbImage} />
                  ) : (
                    <View style={styles.angleUploadPlaceholder}>
                      <UploadCloud size={20} color="#6366F1" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.angleTitle}>Back View <Text style={styles.redAsterisk}>*</Text></Text>
                    <Text style={styles.angleSub}>Upload Back View Image</Text>
                  </View>
                </TouchableOpacity>

                {/* Zoomed In */}
                <TouchableOpacity
                  style={styles.angleRow}
                  onPress={() => {
                    const sampleZoom = 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=400&q=80';
                    setZoomedImage(sampleZoom);
                  }}
                >
                  {zoomedImage ? (
                    <Image source={{ uri: zoomedImage }} style={styles.angleThumbImage} />
                  ) : (
                    <View style={styles.angleUploadPlaceholder}>
                      <UploadCloud size={20} color="#6366F1" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.angleTitle}>Zoomed In <Text style={styles.redAsterisk}>*</Text></Text>
                    <Text style={styles.angleSub}>Upload Close-Up View</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Uploaded Images / Video Slot */}
              <View style={styles.extraMediaCard}>
                <Text style={styles.extraMediaTitle}>Uploaded Images / Video</Text>
                <View style={styles.extraMediaRow}>
                  <View style={styles.extraMediaThumbWrapper}>
                    <Image source={{ uri: selectedImages[0] }} style={styles.extraMediaThumb} />
                    <Text style={styles.frontImageBadgeText}>Front Image <Text style={styles.redAsterisk}>*</Text></Text>
                    <Text style={styles.sampleBadgeText}>SAMPLE</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addMoreMediaSlot}
                    onPress={() => setShowQualityCheckModal(true)}
                  >
                    <Plus size={20} color="#4338CA" />
                    <Text style={styles.addMoreMediaSlotText}>Add Images</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* E-Signature Modal */}
      <ESignatureModal
        visible={showESignatureModal}
        onClose={() => setShowESignatureModal(false)}
        onSave={() => {
          setIsSignatureAdded(true);
          setShowESignatureModal(false);
        }}
      />

      {/* Image Quality Check & Catalog Products Modal */}
      <ImageQualityCheckModal
        visible={showQualityCheckModal}
        initialImages={selectedImages}
        onClose={() => setShowQualityCheckModal(false)}
        onConfirm={(imgs) => {
          setSelectedImages(imgs);
          setShowQualityCheckModal(false);
          setCurrentStep(2);
        }}
      />

      {/* Size Selector Modal */}
      <SizeSelectorModal
        visible={isSizeDropdownOpen}
        initialSelectedSizes={selectedSizesList}
        onClose={() => setIsSizeDropdownOpen(false)}
        onApply={(finalSelected) => {
          setSelectedSizesList(finalSelected);
          // Re-generate sizes measurement matrix table
          const updatedMatrix: ClothSizeVariant[] = finalSelected.map((s) => {
            const existing = sizes.find((existingSz) => existingSz.size === s);
            if (existing) return existing;
            const numSize = parseInt(s) || 30;
            return {
              size: s,
              waistInches: numSize,
              hipInches: numSize + 8,
              lengthInches: 39,
              stock: 20,
              price: parseInt(sellingPrice) || 549,
              mrp: parseInt(mrpPrice) || 1299,
              enabled: true,
            };
          });
          setSizes(updatedMatrix);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  signatureBanner: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
    gap: 12,
  },
  signatureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  signatureBannerSub: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 1,
  },
  addSigBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addSigBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerAddImagesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E00A67',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  headerAddImagesBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  learnVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  learnVideoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  needHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  needHelpText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  stepperContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 16,
  },
  stepTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  stepTabItemActive: {
    borderBottomColor: '#6366F1',
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumActive: {
    backgroundColor: '#6366F1',
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  stepNumTextActive: {
    color: '#FFFFFF',
  },
  stepTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  stepTabTextActive: {
    color: '#6366F1',
    fontWeight: '800',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  searchCategoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  searchCategoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    marginBottom: 18,
    maxWidth: 420,
  },
  searchCategoryInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  cascadingLayoutGrid: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  cascadingLayoutGridMobile: {
    flexDirection: 'column-reverse',
  },
  cascadingColumnsRow: {
    flex: 3,
    flexDirection: 'row',
    gap: 10,
    height: 340,
  },
  categoryCol: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  colItem: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colItemActive: {
    backgroundColor: '#4338CA',
  },
  colItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  colItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  arrowRibbon: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cantFindBox: {
    padding: 12,
    marginTop: 10,
  },
  cantFindText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  searchCatLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    marginTop: 2,
  },
  rightPreviewCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  breadcrumbHeader: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  breadcrumbText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  previewContent: {
    padding: 20,
    alignItems: 'center',
  },
  silhouetteBox: {
    width: 140,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  silhouetteImage: {
    width: '100%',
    height: '100%',
  },
  uploadPromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 16,
  },
  addImagesBtn: {
    backgroundColor: '#4338CA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  addImagesBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  imageGuideBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 10,
    marginTop: 16,
    width: '100%',
  },
  imageGuideText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
  },
  chipTextActive: {
    color: '#6366F1',
    fontWeight: '800',
  },
  tableCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tdBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  tdText: {
    fontSize: 12,
    color: '#475569',
  },
  miniInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  pricingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  priceBox: {
    flex: 1,
    minWidth: 140,
  },
  priceBoxLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  payoutCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
    marginBottom: 20,
  },
  payoutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  payoutLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  payoutLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  payoutVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  payoutGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  payoutRed: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  payoutDivider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 8,
  },
  payoutTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  payoutTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#6366F1',
  },
  btnActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  prevBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  publishBtn: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  /* STEP 2 NEW STYLES */
  productTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  activeProductTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  productTabThumb: {
    width: 24,
    height: 28,
    borderRadius: 4,
  },
  productTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338CA',
  },
  addProductTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#818CF8',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addProductTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  step2LayoutGrid: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  step2LayoutGridMobile: {
    flexDirection: 'column-reverse',
  },
  step2LeftFormCol: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    zIndex: 50,
    overflow: 'visible',
  },
  addDetailsHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  copyDetailsBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: '#4338CA',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  copyDetailsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#312E81',
  },
  copyDetailsSub: {
    fontSize: 11,
    color: '#4338CA',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  formRowField: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  fieldLabelRow: {
    width: 170,
    minWidth: 140,
    maxWidth: '100%',
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  redAsterisk: {
    color: '#DC2626',
    fontWeight: '800',
  },
  textInputFull: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  dropdownBoxFull: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownValueText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#64748B',
  },
  textAreaFull: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
    minHeight: 70,
  },
  charCountText: {
    fontSize: 10,
    color: '#94A3B8',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  sameAsCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  checkboxBoxSmall: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCheckSmall: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  sameAsText: {
    fontSize: 11,
    color: '#475569',
  },
  matrixTableTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 8,
  },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  discardBtn: {
    paddingHorizontal: 16,
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
  saveBackBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  saveBackBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
  },
  submitCatalogBtn: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#4338CA',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitCatalogBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  step2RightGuidelinesCol: {
    width: '100%',
    gap: 16,
  },
  guidelinesAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 10,
  },
  guidelinesAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
    lineHeight: 15,
  },
  guidelinesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  guidelinesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  guidelinesLink: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
  },
  guidelineItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  guidelineNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    color: '#4338CA',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 16,
  },
  guidelineText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
    lineHeight: 15,
  },
  angleUploadsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  angleSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  angleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  angleThumbImage: {
    width: 48,
    height: 58,
    borderRadius: 6,
  },
  angleUploadPlaceholder: {
    width: 48,
    height: 58,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#818CF8',
    borderStyle: 'dashed',
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  angleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  angleSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  extraMediaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  extraMediaTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  extraMediaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  extraMediaThumbWrapper: {
    position: 'relative',
  },
  extraMediaThumb: {
    width: 60,
    height: 72,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  frontImageBadgeText: {
    fontSize: 9,
    color: '#475569',
    marginTop: 3,
  },
  sampleBadgeText: {
    fontSize: 8,
    color: '#6366F1',
    fontWeight: '800',
  },
  addMoreMediaSlot: {
    width: 60,
    height: 72,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#818CF8',
    borderStyle: 'dashed',
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addMoreMediaSlotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4338CA',
  },
  /* SIZE PICKER POPOVER STYLES MATCHING SCREENSHOT */
  sizePickerPopoverCard: {
    position: 'absolute',
    top: 44,
    left: 0,
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 30,
    padding: 14,
    zIndex: 99999,
  },
  sizePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    columnGap: 8,
    paddingRight: 4,
  },
  sizePickerItem: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  sizeCheckboxBox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeCheckboxBoxChecked: {
    borderColor: '#4338CA',
    backgroundColor: '#4338CA',
  },
  sizeCheckIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  sizeBadgeBlue: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  sizeBadgeBlueActive: {
    backgroundColor: '#1D4ED8',
  },
  sizeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sizePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  clearFilterText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '800',
  },
  applySizeBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  applySizeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
