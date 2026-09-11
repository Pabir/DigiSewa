import {
  CategoryNode,
  AttributeDefinition,
  CategoryAttributeMapping,
  CategoryTemplate,
  CategoryFormSchema,
  ResolvedCategoryField,
  AttributeCondition,
  ProductDraft,
  DynamicProductData,
  ProductVariant,
  DeletionRequest,
} from '../types/dynamicCatalog';
import { doc, setDoc, getDoc, onSnapshot, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, ensureFirebaseAuth } from '../config/firebaseConfig';
import { addProduct } from './firebaseService';
import { getWearType, getGenderType } from '../utils/productSizeUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  CATEGORIES: 'TafDeal_dynamic_categories_v2',
  ATTRIBUTES: 'TafDeal_dynamic_attributes_v1',
  MAPPINGS: 'TafDeal_dynamic_mappings_v1',
  TEMPLATES: 'TafDeal_dynamic_templates_v1',
  DRAFTS: 'TafDeal_dynamic_drafts_v1',
  PRODUCTS: 'TafDeal_dynamic_products_v1',
  DELETION_REQUESTS: 'TafDeal_deletion_requests_v1',
};

// ==========================================
// SEED DATA: CATEGORIES
// ==========================================
export const SEED_CATEGORIES: CategoryNode[] = [
  {
    "id": "cat-men-fashion",
    "name": "Men Fashion",
    "slug": "men-fashion",
    "level": 1,
    "sortOrder": 1,
    "children": [
      {
        "id": "cat-men-fashion-mens-clothing",
        "name": "Mens Clothing",
        "slug": "mens-clothing",
        "parentId": "cat-men-fashion",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-men-fashion-mens-clothing-men-top-wear",
            "name": "Men Top Wear",
            "slug": "men-top-wear",
            "parentId": "cat-men-fashion-mens-clothing",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-men-fashion-mens-clothing-men-top-wear-tshirts",
                "name": "Tshirts",
                "slug": "tshirts",
                "parentId": "cat-men-fashion-mens-clothing-men-top-wear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-top-wear-shirts",
                "name": "Shirts",
                "slug": "shirts",
                "parentId": "cat-men-fashion-mens-clothing-men-top-wear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-top-wear-top-bottom-set",
                "name": "Top & Bottom Set",
                "slug": "top-bottom-set",
                "parentId": "cat-men-fashion-mens-clothing-men-top-wear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-top-wear-personalized-tshirts",
                "name": "Personalized Tshirts",
                "slug": "personalized-tshirts",
                "parentId": "cat-men-fashion-mens-clothing-men-top-wear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-top-wear-dad-daughter-tshirts",
                "name": "Dad & Daughter Tshirts",
                "slug": "dad-daughter-tshirts",
                "parentId": "cat-men-fashion-mens-clothing-men-top-wear",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-top-wear-dad-son-tshirts",
                "name": "Dad & Son Tshirts",
                "slug": "dad-son-tshirts",
                "parentId": "cat-men-fashion-mens-clothing-men-top-wear",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-top-wear-active-tshirts",
                "name": "Active Tshirts",
                "slug": "active-tshirts",
                "parentId": "cat-men-fashion-mens-clothing-men-top-wear",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-top-wear-brother-sister-tshirts",
                "name": "Brother & Sister Tshirts",
                "slug": "brother-sister-tshirts",
                "parentId": "cat-men-fashion-mens-clothing-men-top-wear",
                "level": 4,
                "sortOrder": 8
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-top-wear-jumpsuits",
                "name": "Jumpsuits",
                "slug": "jumpsuits",
                "parentId": "cat-men-fashion-mens-clothing-men-top-wear",
                "level": 4,
                "sortOrder": 9
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-top-wear-plus-size-tshirts",
                "name": "Plus Size Tshirts",
                "slug": "plus-size-tshirts",
                "parentId": "cat-men-fashion-mens-clothing-men-top-wear",
                "level": 4,
                "sortOrder": 10
              }
            ]
          },
          {
            "id": "cat-men-fashion-mens-clothing-men-sports-wear",
            "name": "Men Sports Wear",
            "slug": "men-sports-wear",
            "parentId": "cat-men-fashion-mens-clothing",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-men-fashion-mens-clothing-men-sports-wear-active-shorts",
                "name": "Active Shorts",
                "slug": "active-shorts",
                "parentId": "cat-men-fashion-mens-clothing-men-sports-wear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-sports-wear-gym-vests",
                "name": "Gym Vests",
                "slug": "gym-vests",
                "parentId": "cat-men-fashion-mens-clothing-men-sports-wear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-sports-wear-tracksuits",
                "name": "Tracksuits",
                "slug": "tracksuits",
                "parentId": "cat-men-fashion-mens-clothing-men-sports-wear",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-men-fashion-mens-clothing-men-ethnic-wear",
            "name": "Men Ethnic Wear",
            "slug": "men-ethnic-wear",
            "parentId": "cat-men-fashion-mens-clothing",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-men-fashion-mens-clothing-men-ethnic-wear-dhotis-mundus-lungis",
                "name": "Dhotis, Mundus & Lungis",
                "slug": "dhotis-mundus-lungis",
                "parentId": "cat-men-fashion-mens-clothing-men-ethnic-wear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-ethnic-wear-ethnic-jackets",
                "name": "Ethnic Jackets",
                "slug": "ethnic-jackets",
                "parentId": "cat-men-fashion-mens-clothing-men-ethnic-wear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-ethnic-wear-kurta-sets",
                "name": "Kurta Sets",
                "slug": "kurta-sets",
                "parentId": "cat-men-fashion-mens-clothing-men-ethnic-wear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-ethnic-wear-kurtas",
                "name": "Kurtas",
                "slug": "kurtas",
                "parentId": "cat-men-fashion-mens-clothing-men-ethnic-wear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-ethnic-wear-sherwanis",
                "name": "Sherwanis",
                "slug": "sherwanis",
                "parentId": "cat-men-fashion-mens-clothing-men-ethnic-wear",
                "level": 4,
                "sortOrder": 5
              }
            ]
          },
          {
            "id": "cat-men-fashion-mens-clothing-men-bottom-wear",
            "name": "Men Bottom Wear",
            "slug": "men-bottom-wear",
            "parentId": "cat-men-fashion-mens-clothing",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-men-fashion-mens-clothing-men-bottom-wear-jeans",
                "name": "Jeans",
                "slug": "jeans",
                "parentId": "cat-men-fashion-mens-clothing-men-bottom-wear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-bottom-wear-shorts",
                "name": "Shorts",
                "slug": "shorts",
                "parentId": "cat-men-fashion-mens-clothing-men-bottom-wear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-bottom-wear-track-pants",
                "name": "Track Pants",
                "slug": "track-pants",
                "parentId": "cat-men-fashion-mens-clothing-men-bottom-wear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-bottom-wear-trousers",
                "name": "Trousers",
                "slug": "trousers",
                "parentId": "cat-men-fashion-mens-clothing-men-bottom-wear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-bottom-wear-three-fourths",
                "name": "Three Fourths",
                "slug": "three-fourths",
                "parentId": "cat-men-fashion-mens-clothing-men-bottom-wear",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-bottom-wear-dungarees",
                "name": "Dungarees",
                "slug": "dungarees",
                "parentId": "cat-men-fashion-mens-clothing-men-bottom-wear",
                "level": 4,
                "sortOrder": 6
              }
            ]
          },
          {
            "id": "cat-men-fashion-mens-clothing-top-bottom-set",
            "name": "Top & Bottom Set",
            "slug": "top-bottom-set",
            "parentId": "cat-men-fashion-mens-clothing",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-men-fashion-mens-clothing-top-bottom-set-suit-sets",
                "name": "Suit Sets",
                "slug": "suit-sets",
                "parentId": "cat-men-fashion-mens-clothing-top-bottom-set",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-men-fashion-mens-clothing-men-inner-sleepwear",
            "name": "Men Inner & Sleepwear",
            "slug": "men-inner-sleepwear",
            "parentId": "cat-men-fashion-mens-clothing",
            "level": 3,
            "sortOrder": 6,
            "children": [
              {
                "id": "cat-men-fashion-mens-clothing-men-inner-sleepwear-boxers",
                "name": "Boxers",
                "slug": "boxers",
                "parentId": "cat-men-fashion-mens-clothing-men-inner-sleepwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-inner-sleepwear-briefs",
                "name": "Briefs",
                "slug": "briefs",
                "parentId": "cat-men-fashion-mens-clothing-men-inner-sleepwear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-inner-sleepwear-lounge-pants",
                "name": "Lounge Pants",
                "slug": "lounge-pants",
                "parentId": "cat-men-fashion-mens-clothing-men-inner-sleepwear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-inner-sleepwear-trunks",
                "name": "Trunks",
                "slug": "trunks",
                "parentId": "cat-men-fashion-mens-clothing-men-inner-sleepwear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-inner-sleepwear-vests",
                "name": "Vests",
                "slug": "vests",
                "parentId": "cat-men-fashion-mens-clothing-men-inner-sleepwear",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-inner-sleepwear-nightsuits",
                "name": "Nightsuits",
                "slug": "nightsuits",
                "parentId": "cat-men-fashion-mens-clothing-men-inner-sleepwear",
                "level": 4,
                "sortOrder": 6
              }
            ]
          },
          {
            "id": "cat-men-fashion-mens-clothing-men-unstiched-fabric",
            "name": "Men Unstiched Fabric",
            "slug": "men-unstiched-fabric",
            "parentId": "cat-men-fashion-mens-clothing",
            "level": 3,
            "sortOrder": 7,
            "children": [
              {
                "id": "cat-men-fashion-mens-clothing-men-unstiched-fabric-shirt-fabric",
                "name": "Shirt Fabric",
                "slug": "shirt-fabric",
                "parentId": "cat-men-fashion-mens-clothing-men-unstiched-fabric",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-unstiched-fabric-pant-fabric",
                "name": "Pant Fabric",
                "slug": "pant-fabric",
                "parentId": "cat-men-fashion-mens-clothing-men-unstiched-fabric",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-unstiched-fabric-top-bottom-fabric",
                "name": "Top & Bottom Fabric",
                "slug": "top-bottom-fabric",
                "parentId": "cat-men-fashion-mens-clothing-men-unstiched-fabric",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-unstiched-fabric-suit-fabric",
                "name": "Suit Fabric",
                "slug": "suit-fabric",
                "parentId": "cat-men-fashion-mens-clothing-men-unstiched-fabric",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-men-fashion-mens-clothing-men-raincoat",
            "name": "Men Raincoat",
            "slug": "men-raincoat",
            "parentId": "cat-men-fashion-mens-clothing",
            "level": 3,
            "sortOrder": 8,
            "children": [
              {
                "id": "cat-men-fashion-mens-clothing-men-raincoat-raincoat",
                "name": "Raincoat",
                "slug": "raincoat",
                "parentId": "cat-men-fashion-mens-clothing-men-raincoat",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-men-fashion-mens-clothing-men-winter-wear",
            "name": "Men Winter Wear",
            "slug": "men-winter-wear",
            "parentId": "cat-men-fashion-mens-clothing",
            "level": 3,
            "sortOrder": 9,
            "children": [
              {
                "id": "cat-men-fashion-mens-clothing-men-winter-wear-blazers",
                "name": "Blazers",
                "slug": "blazers",
                "parentId": "cat-men-fashion-mens-clothing-men-winter-wear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-winter-wear-jackets",
                "name": "Jackets",
                "slug": "jackets",
                "parentId": "cat-men-fashion-mens-clothing-men-winter-wear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-winter-wear-sweaters",
                "name": "Sweaters",
                "slug": "sweaters",
                "parentId": "cat-men-fashion-mens-clothing-men-winter-wear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-winter-wear-sweatshirts",
                "name": "SweatShirts",
                "slug": "sweatshirts",
                "parentId": "cat-men-fashion-mens-clothing-men-winter-wear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-winter-wear-shrungs",
                "name": "Shrungs",
                "slug": "shrungs",
                "parentId": "cat-men-fashion-mens-clothing-men-winter-wear",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-winter-wear-thermal-topwear",
                "name": "Thermal Topwear",
                "slug": "thermal-topwear",
                "parentId": "cat-men-fashion-mens-clothing-men-winter-wear",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-winter-wear-thermal-bottomwear",
                "name": "Thermal Bottomwear",
                "slug": "thermal-bottomwear",
                "parentId": "cat-men-fashion-mens-clothing-men-winter-wear",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-winter-wear-thermal-set",
                "name": "Thermal Set",
                "slug": "thermal-set",
                "parentId": "cat-men-fashion-mens-clothing-men-winter-wear",
                "level": 4,
                "sortOrder": 8
              },
              {
                "id": "cat-men-fashion-mens-clothing-men-winter-wear-men-shawls",
                "name": "Men Shawls",
                "slug": "men-shawls",
                "parentId": "cat-men-fashion-mens-clothing-men-winter-wear",
                "level": 4,
                "sortOrder": 9
              }
            ]
          }
        ]
      },
      {
        "id": "cat-men-fashion-footwear",
        "name": "Footwear",
        "slug": "footwear",
        "parentId": "cat-men-fashion",
        "level": 2,
        "sortOrder": 2,
        "children": [
          {
            "id": "cat-men-fashion-footwear-shoes",
            "name": "Shoes",
            "slug": "shoes",
            "parentId": "cat-men-fashion-footwear",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-men-fashion-footwear-shoes-casual-shoes",
                "name": "Casual Shoes",
                "slug": "casual-shoes",
                "parentId": "cat-men-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-footwear-shoes-formal-shoes",
                "name": "Formal Shoes",
                "slug": "formal-shoes",
                "parentId": "cat-men-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-footwear-shoes-sports-shoes",
                "name": "Sports Shoes",
                "slug": "sports-shoes",
                "parentId": "cat-men-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-men-fashion-footwear-shoes-loafers",
                "name": "Loafers",
                "slug": "loafers",
                "parentId": "cat-men-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-men-fashion-footwear-shoes-floaters",
                "name": "Floaters",
                "slug": "floaters",
                "parentId": "cat-men-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-men-fashion-footwear-shoes-boots",
                "name": "Boots",
                "slug": "boots",
                "parentId": "cat-men-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-men-fashion-footwear-shoes-sneakers",
                "name": "Sneakers",
                "slug": "sneakers",
                "parentId": "cat-men-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-men-fashion-footwear-shoes-safety-shoes",
                "name": "Safety Shoes",
                "slug": "safety-shoes",
                "parentId": "cat-men-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 8
              }
            ]
          },
          {
            "id": "cat-men-fashion-footwear-flipflops-slippers",
            "name": "Flipflops & Slippers",
            "slug": "flipflops-slippers",
            "parentId": "cat-men-fashion-footwear",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-men-fashion-footwear-flipflops-slippers-flip-flops",
                "name": "Flip Flops",
                "slug": "flip-flops",
                "parentId": "cat-men-fashion-footwear-flipflops-slippers",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-footwear-flipflops-slippers-sliders",
                "name": "Sliders",
                "slug": "sliders",
                "parentId": "cat-men-fashion-footwear-flipflops-slippers",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-footwear-flipflops-slippers-clogs",
                "name": "Clogs",
                "slug": "clogs",
                "parentId": "cat-men-fashion-footwear-flipflops-slippers",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-men-fashion-footwear-sandals-floaters",
            "name": "Sandals & Floaters",
            "slug": "sandals-floaters",
            "parentId": "cat-men-fashion-footwear",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-men-fashion-footwear-sandals-floaters-sandals",
                "name": "Sandals",
                "slug": "sandals",
                "parentId": "cat-men-fashion-footwear-sandals-floaters",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-footwear-sandals-floaters-floaters",
                "name": "Floaters",
                "slug": "floaters",
                "parentId": "cat-men-fashion-footwear-sandals-floaters",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-men-fashion-footwear-ethnic-footwear",
            "name": "Ethnic Footwear",
            "slug": "ethnic-footwear",
            "parentId": "cat-men-fashion-footwear",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-men-fashion-footwear-ethnic-footwear-other-ethnic-flats",
                "name": "Other Ethnic Flats",
                "slug": "other-ethnic-flats",
                "parentId": "cat-men-fashion-footwear-ethnic-footwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-footwear-ethnic-footwear-mojaris-juttis",
                "name": "Mojaris & Juttis",
                "slug": "mojaris-juttis",
                "parentId": "cat-men-fashion-footwear-ethnic-footwear",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-men-fashion-footwear-shoe-accessories",
            "name": "Shoe Accessories",
            "slug": "shoe-accessories",
            "parentId": "cat-men-fashion-footwear",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-men-fashion-footwear-shoe-accessories-mojaris-juttis",
                "name": "Mojaris & Juttis",
                "slug": "mojaris-juttis",
                "parentId": "cat-men-fashion-footwear-shoe-accessories",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-men-fashion-accessories",
        "name": "Accessories",
        "slug": "accessories",
        "parentId": "cat-men-fashion",
        "level": 2,
        "sortOrder": 3,
        "children": [
          {
            "id": "cat-men-fashion-accessories-belts",
            "name": "Belts",
            "slug": "belts",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-men-fashion-accessories-belts-belts",
                "name": "Belts",
                "slug": "belts",
                "parentId": "cat-men-fashion-accessories-belts",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-caps-hats",
            "name": "Caps & Hats",
            "slug": "caps-hats",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-men-fashion-accessories-caps-hats-caps-hats",
                "name": "Caps & Hats",
                "slug": "caps-hats",
                "parentId": "cat-men-fashion-accessories-caps-hats",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-accessories-caps-hats-caps",
                "name": "Caps",
                "slug": "caps",
                "parentId": "cat-men-fashion-accessories-caps-hats",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-accessories-caps-hats-hats",
                "name": "Hats",
                "slug": "hats",
                "parentId": "cat-men-fashion-accessories-caps-hats",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-mufflers-scarves-gloves",
            "name": "Mufflers & Scarves & Gloves",
            "slug": "mufflers-scarves-gloves",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-men-fashion-accessories-mufflers-scarves-gloves-mufflers",
                "name": "Mufflers",
                "slug": "mufflers",
                "parentId": "cat-men-fashion-accessories-mufflers-scarves-gloves",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-accessories-mufflers-scarves-gloves-scarves",
                "name": "Scarves",
                "slug": "scarves",
                "parentId": "cat-men-fashion-accessories-mufflers-scarves-gloves",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-accessories-mufflers-scarves-gloves-gloves",
                "name": "Gloves",
                "slug": "gloves",
                "parentId": "cat-men-fashion-accessories-mufflers-scarves-gloves",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-men-fashion-accessories-mufflers-scarves-gloves-bandanas",
                "name": "Bandanas",
                "slug": "bandanas",
                "parentId": "cat-men-fashion-accessories-mufflers-scarves-gloves",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-hankerchiefs",
            "name": "Hankerchiefs",
            "slug": "hankerchiefs",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-men-fashion-accessories-hankerchiefs-hankerchiefs",
                "name": "Hankerchiefs",
                "slug": "hankerchiefs",
                "parentId": "cat-men-fashion-accessories-hankerchiefs",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-jewellery",
            "name": "Jewellery",
            "slug": "jewellery",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-men-fashion-accessories-jewellery-jewellery",
                "name": "Jewellery",
                "slug": "jewellery",
                "parentId": "cat-men-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-accessories-jewellery-chains",
                "name": "Chains",
                "slug": "chains",
                "parentId": "cat-men-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-accessories-jewellery-bracelets",
                "name": "Bracelets",
                "slug": "bracelets",
                "parentId": "cat-men-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-men-fashion-accessories-jewellery-finger-rings",
                "name": "Finger Rings",
                "slug": "finger-rings",
                "parentId": "cat-men-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-men-fashion-accessories-jewellery-other-men-jewellery",
                "name": "Other Men Jewellery",
                "slug": "other-men-jewellery",
                "parentId": "cat-men-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-men-fashion-accessories-jewellery-necklace",
                "name": "Necklace",
                "slug": "necklace",
                "parentId": "cat-men-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-men-fashion-accessories-jewellery-men-earrings",
                "name": "Men Earrings",
                "slug": "men-earrings",
                "parentId": "cat-men-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 7
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-socks",
            "name": "Socks",
            "slug": "socks",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 6,
            "children": [
              {
                "id": "cat-men-fashion-accessories-socks-socks",
                "name": "Socks",
                "slug": "socks",
                "parentId": "cat-men-fashion-accessories-socks",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-sunglasses",
            "name": "Sunglasses",
            "slug": "sunglasses",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 7,
            "children": [
              {
                "id": "cat-men-fashion-accessories-sunglasses-sunglasses",
                "name": "Sunglasses",
                "slug": "sunglasses",
                "parentId": "cat-men-fashion-accessories-sunglasses",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-accessories-sunglasses-spectale-frames",
                "name": "Spectale Frames",
                "slug": "spectale-frames",
                "parentId": "cat-men-fashion-accessories-sunglasses",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-wallets",
            "name": "Wallets",
            "slug": "wallets",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 8,
            "children": [
              {
                "id": "cat-men-fashion-accessories-wallets-wallets",
                "name": "Wallets",
                "slug": "wallets",
                "parentId": "cat-men-fashion-accessories-wallets",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-watches",
            "name": "Watches",
            "slug": "watches",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 9,
            "children": [
              {
                "id": "cat-men-fashion-accessories-watches-analog-watches",
                "name": "Analog  Watches",
                "slug": "analog-watches",
                "parentId": "cat-men-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-accessories-watches-chronograph-watches",
                "name": "Chronograph Watches",
                "slug": "chronograph-watches",
                "parentId": "cat-men-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-accessories-watches-sports-watches",
                "name": "Sports Watches",
                "slug": "sports-watches",
                "parentId": "cat-men-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-men-fashion-accessories-watches-watch-boxes",
                "name": "Watch Boxes",
                "slug": "watch-boxes",
                "parentId": "cat-men-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-men-fashion-accessories-watches-digital-watches",
                "name": "Digital Watches",
                "slug": "digital-watches",
                "parentId": "cat-men-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-men-fashion-accessories-watches-watchbands",
                "name": "Watchbands",
                "slug": "watchbands",
                "parentId": "cat-men-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-men-fashion-accessories-watches-stop-watch",
                "name": "Stop Watch",
                "slug": "stop-watch",
                "parentId": "cat-men-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-men-fashion-accessories-watches-watch-case-covers",
                "name": "Watch Case Covers",
                "slug": "watch-case-covers",
                "parentId": "cat-men-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 8
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-earmuffs",
            "name": "Earmuffs",
            "slug": "earmuffs",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 10,
            "children": [
              {
                "id": "cat-men-fashion-accessories-earmuffs-earmuffs",
                "name": "Earmuffs",
                "slug": "earmuffs",
                "parentId": "cat-men-fashion-accessories-earmuffs",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-headbands",
            "name": "Headbands",
            "slug": "headbands",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 11,
            "children": [
              {
                "id": "cat-men-fashion-accessories-headbands-headbands",
                "name": "Headbands",
                "slug": "headbands",
                "parentId": "cat-men-fashion-accessories-headbands",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-wrist-bands",
            "name": "Wrist Bands",
            "slug": "wrist-bands",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 12,
            "children": [
              {
                "id": "cat-men-fashion-accessories-wrist-bands-wrist-bands",
                "name": "Wrist Bands",
                "slug": "wrist-bands",
                "parentId": "cat-men-fashion-accessories-wrist-bands",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-men-apparel-accessories",
            "name": "Men Apparel  Accessories",
            "slug": "men-apparel-accessories",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 13,
            "children": [
              {
                "id": "cat-men-fashion-accessories-men-apparel-accessories-cufflinks",
                "name": "Cufflinks",
                "slug": "cufflinks",
                "parentId": "cat-men-fashion-accessories-men-apparel-accessories",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-men-fashion-accessories-men-apparel-accessories-ties",
                "name": "Ties",
                "slug": "ties",
                "parentId": "cat-men-fashion-accessories-men-apparel-accessories",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-men-fashion-accessories-men-apparel-accessories-brooches",
                "name": "Brooches",
                "slug": "brooches",
                "parentId": "cat-men-fashion-accessories-men-apparel-accessories",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-men-fashion-accessories-men-apparel-accessories-tie-clips",
                "name": "Tie Clips",
                "slug": "tie-clips",
                "parentId": "cat-men-fashion-accessories-men-apparel-accessories",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-men-fashion-accessories-men-apparel-accessories-pocket-squares",
                "name": "Pocket Squares",
                "slug": "pocket-squares",
                "parentId": "cat-men-fashion-accessories-men-apparel-accessories",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-men-fashion-accessories-men-apparel-accessories-shirt-studs",
                "name": "Shirt Studs",
                "slug": "shirt-studs",
                "parentId": "cat-men-fashion-accessories-men-apparel-accessories",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-men-fashion-accessories-men-apparel-accessories-suspenders",
                "name": "Suspenders",
                "slug": "suspenders",
                "parentId": "cat-men-fashion-accessories-men-apparel-accessories",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-men-fashion-accessories-men-apparel-accessories-cummer-bands",
                "name": "Cummer Bands",
                "slug": "cummer-bands",
                "parentId": "cat-men-fashion-accessories-men-apparel-accessories",
                "level": 4,
                "sortOrder": 8
              },
              {
                "id": "cat-men-fashion-accessories-men-apparel-accessories-key-chains",
                "name": "Key Chains",
                "slug": "key-chains",
                "parentId": "cat-men-fashion-accessories-men-apparel-accessories",
                "level": 4,
                "sortOrder": 9
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-friendship-bands",
            "name": "Friendship Bands",
            "slug": "friendship-bands",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 14,
            "children": [
              {
                "id": "cat-men-fashion-accessories-friendship-bands-friendship-bands",
                "name": "Friendship Bands",
                "slug": "friendship-bands",
                "parentId": "cat-men-fashion-accessories-friendship-bands",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-men-fashion-accessories-men-hair-extension-wigs",
            "name": "Men Hair Extension Wigs",
            "slug": "men-hair-extension-wigs",
            "parentId": "cat-men-fashion-accessories",
            "level": 3,
            "sortOrder": 15,
            "children": [
              {
                "id": "cat-men-fashion-accessories-men-hair-extension-wigs-men-hair-extension-wigs",
                "name": "Men Hair Extension Wigs",
                "slug": "men-hair-extension-wigs",
                "parentId": "cat-men-fashion-accessories-men-hair-extension-wigs",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-women-fashion",
    "name": "Women Fashion",
    "slug": "women-fashion",
    "level": 1,
    "sortOrder": 2,
    "children": [
      {
        "id": "cat-women-fashion-ethnic-wear",
        "name": "Ethnic Wear",
        "slug": "ethnic-wear",
        "parentId": "cat-women-fashion",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-women-fashion-ethnic-wear-kurtis-sets-fabrics",
            "name": "Kurtis, Sets & Fabrics",
            "slug": "kurtis-sets-fabrics",
            "parentId": "cat-women-fashion-ethnic-wear",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-women-fashion-ethnic-wear-kurtis-sets-fabrics-kurti-with-bottomwear",
                "name": "Kurti with Bottomwear",
                "slug": "kurti-with-bottomwear",
                "parentId": "cat-women-fashion-ethnic-wear-kurtis-sets-fabrics",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-ethnic-wear-kurtis-sets-fabrics-kurti",
                "name": "Kurti",
                "slug": "kurti",
                "parentId": "cat-women-fashion-ethnic-wear-kurtis-sets-fabrics",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-ethnic-wear-kurtis-sets-fabrics-kurti-fabrics",
                "name": "Kurti Fabrics",
                "slug": "kurti-fabrics",
                "parentId": "cat-women-fashion-ethnic-wear-kurtis-sets-fabrics",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-ethnic-wear-kurtis-sets-fabrics-kurti-with-dupatta-bottomwear",
                "name": "Kurti with Dupatta & Bottomwear",
                "slug": "kurti-with-dupatta-bottomwear",
                "parentId": "cat-women-fashion-ethnic-wear-kurtis-sets-fabrics",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-women-fashion-ethnic-wear-kurtis-sets-fabrics-kurti-with-dupatta",
                "name": "Kurti with Dupatta",
                "slug": "kurti-with-dupatta",
                "parentId": "cat-women-fashion-ethnic-wear-kurtis-sets-fabrics",
                "level": 4,
                "sortOrder": 5
              }
            ]
          },
          {
            "id": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats",
            "name": "Sarees, Blouses & Peticoats",
            "slug": "sarees-blouses-peticoats",
            "parentId": "cat-women-fashion-ethnic-wear",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats-sarees",
                "name": "Sarees",
                "slug": "sarees",
                "parentId": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats-saree-shapewear-peticoats",
                "name": "Saree Shapewear & Peticoats",
                "slug": "saree-shapewear-peticoats",
                "parentId": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats-blouses",
                "name": "Blouses",
                "slug": "blouses",
                "parentId": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats-blouse-piece",
                "name": "Blouse Piece",
                "slug": "blouse-piece",
                "parentId": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats-ready-to-wear-saress",
                "name": "Ready to Wear Saress",
                "slug": "ready-to-wear-saress",
                "parentId": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats-saree-with-stitched-blouses",
                "name": "Saree with stitched Blouses",
                "slug": "saree-with-stitched-blouses",
                "parentId": "cat-women-fashion-ethnic-wear-sarees-blouses-peticoats",
                "level": 4,
                "sortOrder": 6
              }
            ]
          },
          {
            "id": "cat-women-fashion-ethnic-wear-suits-dress-material",
            "name": "Suits & Dress Material",
            "slug": "suits-dress-material",
            "parentId": "cat-women-fashion-ethnic-wear",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-women-fashion-ethnic-wear-suits-dress-material-suits",
                "name": "Suits",
                "slug": "suits",
                "parentId": "cat-women-fashion-ethnic-wear-suits-dress-material",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-ethnic-wear-suits-dress-material-semi-stitched-suits",
                "name": "Semi-Stitched Suits",
                "slug": "semi-stitched-suits",
                "parentId": "cat-women-fashion-ethnic-wear-suits-dress-material",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-women-fashion-ethnic-wear-ethnic-bottomwear",
            "name": "Ethnic Bottomwear",
            "slug": "ethnic-bottomwear",
            "parentId": "cat-women-fashion-ethnic-wear",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-women-fashion-ethnic-wear-ethnic-bottomwear-churidars",
                "name": "Churidars",
                "slug": "churidars",
                "parentId": "cat-women-fashion-ethnic-wear-ethnic-bottomwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-ethnic-wear-ethnic-bottomwear-patialas",
                "name": "Patialas",
                "slug": "patialas",
                "parentId": "cat-women-fashion-ethnic-wear-ethnic-bottomwear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-ethnic-wear-ethnic-bottomwear-salwars",
                "name": "Salwars",
                "slug": "salwars",
                "parentId": "cat-women-fashion-ethnic-wear-ethnic-bottomwear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-ethnic-wear-ethnic-bottomwear-sharara",
                "name": "Sharara",
                "slug": "sharara",
                "parentId": "cat-women-fashion-ethnic-wear-ethnic-bottomwear",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-women-fashion-ethnic-wear-dupattas-shawls",
            "name": "Dupattas & Shawls",
            "slug": "dupattas-shawls",
            "parentId": "cat-women-fashion-ethnic-wear",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-women-fashion-ethnic-wear-dupattas-shawls-dupatta",
                "name": "Dupatta",
                "slug": "dupatta",
                "parentId": "cat-women-fashion-ethnic-wear-dupattas-shawls",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-ethnic-wear-dupattas-shawls-shawls",
                "name": "Shawls",
                "slug": "shawls",
                "parentId": "cat-women-fashion-ethnic-wear-dupattas-shawls",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-women-fashion-ethnic-wear-ethnic-jackets",
            "name": "Ethnic Jackets",
            "slug": "ethnic-jackets",
            "parentId": "cat-women-fashion-ethnic-wear",
            "level": 3,
            "sortOrder": 6,
            "children": [
              {
                "id": "cat-women-fashion-ethnic-wear-ethnic-jackets-ethnic-jackets",
                "name": "Ethnic Jackets",
                "slug": "ethnic-jackets",
                "parentId": "cat-women-fashion-ethnic-wear-ethnic-jackets",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-ethnic-wear-gowns-kaftans",
            "name": "Gowns & Kaftans",
            "slug": "gowns-kaftans",
            "parentId": "cat-women-fashion-ethnic-wear",
            "level": 3,
            "sortOrder": 7,
            "children": [
              {
                "id": "cat-women-fashion-ethnic-wear-gowns-kaftans-gowns-kaftans",
                "name": "Gowns & Kaftans",
                "slug": "gowns-kaftans",
                "parentId": "cat-women-fashion-ethnic-wear-gowns-kaftans",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-ethnic-wear-lehenga-choli",
            "name": "Lehenga Choli",
            "slug": "lehenga-choli",
            "parentId": "cat-women-fashion-ethnic-wear",
            "level": 3,
            "sortOrder": 8,
            "children": [
              {
                "id": "cat-women-fashion-ethnic-wear-lehenga-choli-lehenga",
                "name": "Lehenga",
                "slug": "lehenga",
                "parentId": "cat-women-fashion-ethnic-wear-lehenga-choli",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-ethnic-wear-lehenga-choli-ready-to-wear-lehenga",
                "name": "Ready to wear Lehenga",
                "slug": "ready-to-wear-lehenga",
                "parentId": "cat-women-fashion-ethnic-wear-lehenga-choli",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-women-fashion-ethnic-wear-ethnic-skirts",
            "name": "Ethnic Skirts",
            "slug": "ethnic-skirts",
            "parentId": "cat-women-fashion-ethnic-wear",
            "level": 3,
            "sortOrder": 9,
            "children": [
              {
                "id": "cat-women-fashion-ethnic-wear-ethnic-skirts-skirts",
                "name": "Skirts",
                "slug": "skirts",
                "parentId": "cat-women-fashion-ethnic-wear-ethnic-skirts",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-ethnic-wear-islamic-wear",
            "name": "Islamic Wear",
            "slug": "islamic-wear",
            "parentId": "cat-women-fashion-ethnic-wear",
            "level": 3,
            "sortOrder": 10,
            "children": [
              {
                "id": "cat-women-fashion-ethnic-wear-islamic-wear-jaali",
                "name": "Jaali",
                "slug": "jaali",
                "parentId": "cat-women-fashion-ethnic-wear-islamic-wear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-ethnic-wear-islamic-wear-niqab",
                "name": "Niqab",
                "slug": "niqab",
                "parentId": "cat-women-fashion-ethnic-wear-islamic-wear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-ethnic-wear-islamic-wear-hijab",
                "name": "Hijab",
                "slug": "hijab",
                "parentId": "cat-women-fashion-ethnic-wear-islamic-wear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-ethnic-wear-islamic-wear-abayas",
                "name": "Abayas",
                "slug": "abayas",
                "parentId": "cat-women-fashion-ethnic-wear-islamic-wear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-women-fashion-ethnic-wear-islamic-wear-burqa",
                "name": "Burqa",
                "slug": "burqa",
                "parentId": "cat-women-fashion-ethnic-wear-islamic-wear",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-women-fashion-ethnic-wear-islamic-wear-other-islamic-wear",
                "name": "Other Islamic Wear",
                "slug": "other-islamic-wear",
                "parentId": "cat-women-fashion-ethnic-wear-islamic-wear",
                "level": 4,
                "sortOrder": 6
              }
            ]
          },
          {
            "id": "cat-women-fashion-ethnic-wear-regional-ethic-wear",
            "name": "Regional Ethic Wear",
            "slug": "regional-ethic-wear",
            "parentId": "cat-women-fashion-ethnic-wear",
            "level": 3,
            "sortOrder": 11,
            "children": [
              {
                "id": "cat-women-fashion-ethnic-wear-regional-ethic-wear-pherna",
                "name": "Pherna",
                "slug": "pherna",
                "parentId": "cat-women-fashion-ethnic-wear-regional-ethic-wear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-ethnic-wear-regional-ethic-wear-mekhala-chador",
                "name": "Mekhala Chador",
                "slug": "mekhala-chador",
                "parentId": "cat-women-fashion-ethnic-wear-regional-ethic-wear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-ethnic-wear-regional-ethic-wear-dakmanda",
                "name": "Dakmanda",
                "slug": "dakmanda",
                "parentId": "cat-women-fashion-ethnic-wear-regional-ethic-wear",
                "level": 4,
                "sortOrder": 3
              }
            ]
          }
        ]
      },
      {
        "id": "cat-women-fashion-western-wear",
        "name": "Western Wear",
        "slug": "western-wear",
        "parentId": "cat-women-fashion",
        "level": 2,
        "sortOrder": 2,
        "children": [
          {
            "id": "cat-women-fashion-western-wear-tops-tshirts-shirts",
            "name": "Tops, Tshirts & Shirts",
            "slug": "tops-tshirts-shirts",
            "parentId": "cat-women-fashion-western-wear",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-women-fashion-western-wear-tops-tshirts-shirts-shirts",
                "name": "Shirts",
                "slug": "shirts",
                "parentId": "cat-women-fashion-western-wear-tops-tshirts-shirts",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-western-wear-tops-tshirts-shirts-tshirts",
                "name": "Tshirts",
                "slug": "tshirts",
                "parentId": "cat-women-fashion-western-wear-tops-tshirts-shirts",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-western-wear-tops-tshirts-shirts-top-bottom-sets",
                "name": "Top & Bottom Sets",
                "slug": "top-bottom-sets",
                "parentId": "cat-women-fashion-western-wear-tops-tshirts-shirts",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-western-wear-tops-tshirts-shirts-top-tunics",
                "name": "Top & Tunics",
                "slug": "top-tunics",
                "parentId": "cat-women-fashion-western-wear-tops-tshirts-shirts",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-women-fashion-western-wear-tops-tshirts-shirts-women-formal-shirts-bottom-fabric",
                "name": "Women Formal  Shirts & Bottom Fabric",
                "slug": "women-formal-shirts-bottom-fabric",
                "parentId": "cat-women-fashion-western-wear-tops-tshirts-shirts",
                "level": 4,
                "sortOrder": 5
              }
            ]
          },
          {
            "id": "cat-women-fashion-western-wear-dresses-gowns-jumpsuits",
            "name": "Dresses, Gowns & Jumpsuits",
            "slug": "dresses-gowns-jumpsuits",
            "parentId": "cat-women-fashion-western-wear",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-women-fashion-western-wear-dresses-gowns-jumpsuits-dresses",
                "name": "Dresses",
                "slug": "dresses",
                "parentId": "cat-women-fashion-western-wear-dresses-gowns-jumpsuits",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-western-wear-dresses-gowns-jumpsuits-western-gowns",
                "name": "Western Gowns",
                "slug": "western-gowns",
                "parentId": "cat-women-fashion-western-wear-dresses-gowns-jumpsuits",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-western-wear-dresses-gowns-jumpsuits-jumpsuits",
                "name": "Jumpsuits",
                "slug": "jumpsuits",
                "parentId": "cat-women-fashion-western-wear-dresses-gowns-jumpsuits",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-women-fashion-western-wear-jeans-jeggings",
            "name": "Jeans & Jeggings",
            "slug": "jeans-jeggings",
            "parentId": "cat-women-fashion-western-wear",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-women-fashion-western-wear-jeans-jeggings-jeans",
                "name": "Jeans",
                "slug": "jeans",
                "parentId": "cat-women-fashion-western-wear-jeans-jeggings",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-western-wear-jeans-jeggings-jeggings",
                "name": "Jeggings",
                "slug": "jeggings",
                "parentId": "cat-women-fashion-western-wear-jeans-jeggings",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-women-fashion-western-wear-capes-shrunks-ponchos",
            "name": "Capes, Shrunks & Ponchos",
            "slug": "capes-shrunks-ponchos",
            "parentId": "cat-women-fashion-western-wear",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-women-fashion-western-wear-capes-shrunks-ponchos-capes-shrunks-ponchos",
                "name": "Capes, Shrunks & Ponchos",
                "slug": "capes-shrunks-ponchos",
                "parentId": "cat-women-fashion-western-wear-capes-shrunks-ponchos",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-western-wear-capris-trousers-pants",
            "name": "Capris & Trousers & Pants",
            "slug": "capris-trousers-pants",
            "parentId": "cat-women-fashion-western-wear",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-women-fashion-western-wear-capris-trousers-pants-capris",
                "name": "Capris",
                "slug": "capris",
                "parentId": "cat-women-fashion-western-wear-capris-trousers-pants",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-western-wear-capris-trousers-pants-trousers-pants",
                "name": "Trousers & Pants",
                "slug": "trousers-pants",
                "parentId": "cat-women-fashion-western-wear-capris-trousers-pants",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-women-fashion-western-wear-sweaters-cardigans",
            "name": "Sweaters & Cardigans",
            "slug": "sweaters-cardigans",
            "parentId": "cat-women-fashion-western-wear",
            "level": 3,
            "sortOrder": 6,
            "children": [
              {
                "id": "cat-women-fashion-western-wear-sweaters-cardigans-sweaters",
                "name": "Sweaters",
                "slug": "sweaters",
                "parentId": "cat-women-fashion-western-wear-sweaters-cardigans",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-western-wear-jackets",
            "name": "Jackets",
            "slug": "jackets",
            "parentId": "cat-women-fashion-western-wear",
            "level": 3,
            "sortOrder": 7,
            "children": [
              {
                "id": "cat-women-fashion-western-wear-jackets-coats-jackets",
                "name": "Coats & Jackets",
                "slug": "coats-jackets",
                "parentId": "cat-women-fashion-western-wear-jackets",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-western-wear-jackets-jackets",
                "name": "Jackets",
                "slug": "jackets",
                "parentId": "cat-women-fashion-western-wear-jackets",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-western-wear-jackets-blazers-coats",
                "name": "Blazers & Coats",
                "slug": "blazers-coats",
                "parentId": "cat-women-fashion-western-wear-jackets",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-women-fashion-western-wear-palazzos-leggings-tights",
            "name": "Palazzos, Leggings & Tights",
            "slug": "palazzos-leggings-tights",
            "parentId": "cat-women-fashion-western-wear",
            "level": 3,
            "sortOrder": 8,
            "children": [
              {
                "id": "cat-women-fashion-western-wear-palazzos-leggings-tights-leggings",
                "name": "Leggings",
                "slug": "leggings",
                "parentId": "cat-women-fashion-western-wear-palazzos-leggings-tights",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-western-wear-palazzos-leggings-tights-palazzos",
                "name": "Palazzos",
                "slug": "palazzos",
                "parentId": "cat-women-fashion-western-wear-palazzos-leggings-tights",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-women-fashion-western-wear-skirts-shorts",
            "name": "Skirts & Shorts",
            "slug": "skirts-shorts",
            "parentId": "cat-women-fashion-western-wear",
            "level": 3,
            "sortOrder": 9,
            "children": [
              {
                "id": "cat-women-fashion-western-wear-skirts-shorts-skirts",
                "name": "Skirts",
                "slug": "skirts",
                "parentId": "cat-women-fashion-western-wear-skirts-shorts",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-western-wear-skirts-shorts-shorts",
                "name": "Shorts",
                "slug": "shorts",
                "parentId": "cat-women-fashion-western-wear-skirts-shorts",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-women-fashion-western-wear-hoodies-sweatshirts",
            "name": "Hoodies & Sweatshirts",
            "slug": "hoodies-sweatshirts",
            "parentId": "cat-women-fashion-western-wear",
            "level": 3,
            "sortOrder": 10,
            "children": [
              {
                "id": "cat-women-fashion-western-wear-hoodies-sweatshirts-sweatshirts",
                "name": "Sweatshirts",
                "slug": "sweatshirts",
                "parentId": "cat-women-fashion-western-wear-hoodies-sweatshirts",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-western-wear-raincoat",
            "name": "Raincoat",
            "slug": "raincoat",
            "parentId": "cat-women-fashion-western-wear",
            "level": 3,
            "sortOrder": 11,
            "children": [
              {
                "id": "cat-women-fashion-western-wear-raincoat-raincoat",
                "name": "Raincoat",
                "slug": "raincoat",
                "parentId": "cat-women-fashion-western-wear-raincoat",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-women-fashion-accessories",
        "name": "Accessories",
        "slug": "accessories",
        "parentId": "cat-women-fashion",
        "level": 2,
        "sortOrder": 3,
        "children": [
          {
            "id": "cat-women-fashion-accessories-jewellery",
            "name": "Jewellery",
            "slug": "jewellery",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-women-fashion-accessories-jewellery-anklets-toe-rings",
                "name": "Anklets & Toe Rings",
                "slug": "anklets-toe-rings",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-pendants-lockets",
                "name": "Pendants & Lockets",
                "slug": "pendants-lockets",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-necklaces-chains",
                "name": "Necklaces & Chains",
                "slug": "necklaces-chains",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-rings",
                "name": "Rings",
                "slug": "rings",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-bracelet-bangles",
                "name": "Bracelet & Bangles",
                "slug": "bracelet-bangles",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-jewellery-set",
                "name": "Jewellery Set",
                "slug": "jewellery-set",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-earrings-studs",
                "name": "Earrings & Studs",
                "slug": "earrings-studs",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-maangtika",
                "name": "Maangtika",
                "slug": "maangtika",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 8
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-mangalsutras",
                "name": "Mangalsutras",
                "slug": "mangalsutras",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 9
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-nosepins",
                "name": "Nosepins",
                "slug": "nosepins",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 10
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-kamarband",
                "name": "Kamarband",
                "slug": "kamarband",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 11
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-jewellery-organizer-box",
                "name": "Jewellery Organizer Box",
                "slug": "jewellery-organizer-box",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 12
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-bajuband-armlets",
                "name": "Bajuband & Armlets",
                "slug": "bajuband-armlets",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 13
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-customised-jewellery",
                "name": "Customised Jewellery",
                "slug": "customised-jewellery",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 14
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-real-silver-rings",
                "name": "Real Silver Rings",
                "slug": "real-silver-rings",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 15
              },
              {
                "id": "cat-women-fashion-accessories-jewellery-mathapatti",
                "name": "Mathapatti",
                "slug": "mathapatti",
                "parentId": "cat-women-fashion-accessories-jewellery",
                "level": 4,
                "sortOrder": 16
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-belts",
            "name": "Belts",
            "slug": "belts",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-women-fashion-accessories-belts-belts",
                "name": "Belts",
                "slug": "belts",
                "parentId": "cat-women-fashion-accessories-belts",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-accessories-belts-belts-accessories",
                "name": "Belts Accessories",
                "slug": "belts-accessories",
                "parentId": "cat-women-fashion-accessories-belts",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-fashion-accessories",
            "name": "Fashion Accessories",
            "slug": "fashion-accessories",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-women-fashion-accessories-fashion-accessories-bindis",
                "name": "Bindis",
                "slug": "bindis",
                "parentId": "cat-women-fashion-accessories-fashion-accessories",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-accessories-fashion-accessories-hijab-pin",
                "name": "Hijab Pin",
                "slug": "hijab-pin",
                "parentId": "cat-women-fashion-accessories-fashion-accessories",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-accessories-fashion-accessories-saree-pin",
                "name": "Saree Pin",
                "slug": "saree-pin",
                "parentId": "cat-women-fashion-accessories-fashion-accessories",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-caps-hats",
            "name": "Caps & Hats",
            "slug": "caps-hats",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-women-fashion-accessories-caps-hats-caps",
                "name": "Caps",
                "slug": "caps",
                "parentId": "cat-women-fashion-accessories-caps-hats",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-accessories-caps-hats-hats",
                "name": "Hats",
                "slug": "hats",
                "parentId": "cat-women-fashion-accessories-caps-hats",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-hair-accessories",
            "name": "Hair Accessories",
            "slug": "hair-accessories",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-women-fashion-accessories-hair-accessories-hair-accessories",
                "name": "Hair Accessories",
                "slug": "hair-accessories",
                "parentId": "cat-women-fashion-accessories-hair-accessories",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-accessories-hair-accessories-hair-buns",
                "name": "Hair Buns",
                "slug": "hair-buns",
                "parentId": "cat-women-fashion-accessories-hair-accessories",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-accessories-hair-accessories-hair-bands",
                "name": "Hair Bands",
                "slug": "hair-bands",
                "parentId": "cat-women-fashion-accessories-hair-accessories",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-accessories-hair-accessories-gajrafloral-hair-accessories",
                "name": "Gajra/Floral Hair Accessories",
                "slug": "gajrafloral-hair-accessories",
                "parentId": "cat-women-fashion-accessories-hair-accessories",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-women-fashion-accessories-hair-accessories-hair-extensions-wigs",
                "name": "Hair Extensions & Wigs",
                "slug": "hair-extensions-wigs",
                "parentId": "cat-women-fashion-accessories-hair-accessories",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-women-fashion-accessories-hair-accessories-hair-clip-hair-pins",
                "name": "Hair clip & Hair pins",
                "slug": "hair-clip-hair-pins",
                "parentId": "cat-women-fashion-accessories-hair-accessories",
                "level": 4,
                "sortOrder": 6
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-scarves-stoles-gloves",
            "name": "Scarves, Stoles & Gloves",
            "slug": "scarves-stoles-gloves",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 6,
            "children": [
              {
                "id": "cat-women-fashion-accessories-scarves-stoles-gloves-gloves",
                "name": "Gloves",
                "slug": "gloves",
                "parentId": "cat-women-fashion-accessories-scarves-stoles-gloves",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-accessories-scarves-stoles-gloves-scarves",
                "name": "Scarves",
                "slug": "scarves",
                "parentId": "cat-women-fashion-accessories-scarves-stoles-gloves",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-accessories-scarves-stoles-gloves-stoles",
                "name": "Stoles",
                "slug": "stoles",
                "parentId": "cat-women-fashion-accessories-scarves-stoles-gloves",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-accessories-scarves-stoles-gloves-shawls",
                "name": "Shawls",
                "slug": "shawls",
                "parentId": "cat-women-fashion-accessories-scarves-stoles-gloves",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-socks",
            "name": "Socks",
            "slug": "socks",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 7,
            "children": [
              {
                "id": "cat-women-fashion-accessories-socks-socks",
                "name": "Socks",
                "slug": "socks",
                "parentId": "cat-women-fashion-accessories-socks",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-sunglasses",
            "name": "Sunglasses",
            "slug": "sunglasses",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 8,
            "children": [
              {
                "id": "cat-women-fashion-accessories-sunglasses-sunglasses",
                "name": "Sunglasses",
                "slug": "sunglasses",
                "parentId": "cat-women-fashion-accessories-sunglasses",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-accessories-sunglasses-spectale-frames",
                "name": "Spectale Frames",
                "slug": "spectale-frames",
                "parentId": "cat-women-fashion-accessories-sunglasses",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-accessories-sunglasses-sunglasses-spectales-cases",
                "name": "Sunglasses & Spectales Cases",
                "slug": "sunglasses-spectales-cases",
                "parentId": "cat-women-fashion-accessories-sunglasses",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-umbrellas",
            "name": "Umbrellas",
            "slug": "umbrellas",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 9,
            "children": [
              {
                "id": "cat-women-fashion-accessories-umbrellas-umbrellas",
                "name": "Umbrellas",
                "slug": "umbrellas",
                "parentId": "cat-women-fashion-accessories-umbrellas",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-watches",
            "name": "Watches",
            "slug": "watches",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 10,
            "children": [
              {
                "id": "cat-women-fashion-accessories-watches-analog-watches",
                "name": "Analog  Watches",
                "slug": "analog-watches",
                "parentId": "cat-women-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-accessories-watches-chronograph-watches",
                "name": "Chronograph Watches",
                "slug": "chronograph-watches",
                "parentId": "cat-women-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-accessories-watches-sports-watches",
                "name": "Sports Watches",
                "slug": "sports-watches",
                "parentId": "cat-women-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-accessories-watches-couple-watches",
                "name": "Couple Watches",
                "slug": "couple-watches",
                "parentId": "cat-women-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-women-fashion-accessories-watches-digital-watches",
                "name": "Digital Watches",
                "slug": "digital-watches",
                "parentId": "cat-women-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-women-fashion-accessories-watches-watch-boxes",
                "name": "Watch Boxes",
                "slug": "watch-boxes",
                "parentId": "cat-women-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-women-fashion-accessories-watches-watchbands",
                "name": "Watchbands",
                "slug": "watchbands",
                "parentId": "cat-women-fashion-accessories-watches",
                "level": 4,
                "sortOrder": 7
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-handkerchiefs",
            "name": "Handkerchiefs",
            "slug": "handkerchiefs",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 11,
            "children": [
              {
                "id": "cat-women-fashion-accessories-handkerchiefs-handkerchiefs",
                "name": "Handkerchiefs",
                "slug": "handkerchiefs",
                "parentId": "cat-women-fashion-accessories-handkerchiefs",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-earmuffs",
            "name": "Earmuffs",
            "slug": "earmuffs",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 12,
            "children": [
              {
                "id": "cat-women-fashion-accessories-earmuffs-earmuffs",
                "name": "Earmuffs",
                "slug": "earmuffs",
                "parentId": "cat-women-fashion-accessories-earmuffs",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-hijabs",
            "name": "Hijabs",
            "slug": "hijabs",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 13,
            "children": [
              {
                "id": "cat-women-fashion-accessories-hijabs-hijabs",
                "name": "Hijabs",
                "slug": "hijabs",
                "parentId": "cat-women-fashion-accessories-hijabs",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-keychains",
            "name": "Keychains",
            "slug": "keychains",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 14,
            "children": [
              {
                "id": "cat-women-fashion-accessories-keychains-keychains",
                "name": "Keychains",
                "slug": "keychains",
                "parentId": "cat-women-fashion-accessories-keychains",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-accessories-friendship-bands",
            "name": "Friendship Bands",
            "slug": "friendship-bands",
            "parentId": "cat-women-fashion-accessories",
            "level": 3,
            "sortOrder": 15,
            "children": [
              {
                "id": "cat-women-fashion-accessories-friendship-bands-friendship-bands",
                "name": "Friendship Bands",
                "slug": "friendship-bands",
                "parentId": "cat-women-fashion-accessories-friendship-bands",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-women-fashion-footwear",
        "name": "Footwear",
        "slug": "footwear",
        "parentId": "cat-women-fashion",
        "level": 2,
        "sortOrder": 4,
        "children": [
          {
            "id": "cat-women-fashion-footwear-flats",
            "name": "Flats",
            "slug": "flats",
            "parentId": "cat-women-fashion-footwear",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-women-fashion-footwear-flats-flats",
                "name": "Flats",
                "slug": "flats",
                "parentId": "cat-women-fashion-footwear-flats",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-footwear-flats-platforms",
                "name": "Platforms",
                "slug": "platforms",
                "parentId": "cat-women-fashion-footwear-flats",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-women-fashion-footwear-boots",
            "name": "Boots",
            "slug": "boots",
            "parentId": "cat-women-fashion-footwear",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-women-fashion-footwear-boots-boots",
                "name": "Boots",
                "slug": "boots",
                "parentId": "cat-women-fashion-footwear-boots",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-footwear-heels",
            "name": "Heels",
            "slug": "heels",
            "parentId": "cat-women-fashion-footwear",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-women-fashion-footwear-heels-heels",
                "name": "Heels",
                "slug": "heels",
                "parentId": "cat-women-fashion-footwear-heels",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-footwear-heels-stilletos",
                "name": "Stilletos",
                "slug": "stilletos",
                "parentId": "cat-women-fashion-footwear-heels",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-footwear-heels-pumps",
                "name": "Pumps",
                "slug": "pumps",
                "parentId": "cat-women-fashion-footwear-heels",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-women-fashion-footwear-flipflops-slippers",
            "name": "Flipflops & Slippers",
            "slug": "flipflops-slippers",
            "parentId": "cat-women-fashion-footwear",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-women-fashion-footwear-flipflops-slippers-flipflops-slippers",
                "name": "Flipflops & Slippers",
                "slug": "flipflops-slippers",
                "parentId": "cat-women-fashion-footwear-flipflops-slippers",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-footwear-flipflops-slippers-sliders",
                "name": "Sliders",
                "slug": "sliders",
                "parentId": "cat-women-fashion-footwear-flipflops-slippers",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-footwear-flipflops-slippers-clogs",
                "name": "Clogs",
                "slug": "clogs",
                "parentId": "cat-women-fashion-footwear-flipflops-slippers",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-women-fashion-footwear-shoes",
            "name": "Shoes",
            "slug": "shoes",
            "parentId": "cat-women-fashion-footwear",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-women-fashion-footwear-shoes-formal-shoes",
                "name": "Formal Shoes",
                "slug": "formal-shoes",
                "parentId": "cat-women-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-footwear-shoes-casual-shoes",
                "name": "Casual Shoes",
                "slug": "casual-shoes",
                "parentId": "cat-women-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-footwear-shoes-sports-shoes",
                "name": "Sports Shoes",
                "slug": "sports-shoes",
                "parentId": "cat-women-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-footwear-shoes-sneakers",
                "name": "Sneakers",
                "slug": "sneakers",
                "parentId": "cat-women-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-women-fashion-footwear-shoes-loafers-moccassins",
                "name": "Loafers & Moccassins",
                "slug": "loafers-moccassins",
                "parentId": "cat-women-fashion-footwear-shoes",
                "level": 4,
                "sortOrder": 5
              }
            ]
          },
          {
            "id": "cat-women-fashion-footwear-sandals",
            "name": "Sandals",
            "slug": "sandals",
            "parentId": "cat-women-fashion-footwear",
            "level": 3,
            "sortOrder": 6,
            "children": [
              {
                "id": "cat-women-fashion-footwear-sandals-floaters",
                "name": "Floaters",
                "slug": "floaters",
                "parentId": "cat-women-fashion-footwear-sandals",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-footwear-sandals-flat-sandals",
                "name": "Flat Sandals",
                "slug": "flat-sandals",
                "parentId": "cat-women-fashion-footwear-sandals",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-footwear-sandals-wedge-sandals",
                "name": "Wedge Sandals",
                "slug": "wedge-sandals",
                "parentId": "cat-women-fashion-footwear-sandals",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-footwear-sandals-platform-sandals",
                "name": "Platform Sandals",
                "slug": "platform-sandals",
                "parentId": "cat-women-fashion-footwear-sandals",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-women-fashion-footwear-sandals-heel-sandals",
                "name": "Heel Sandals",
                "slug": "heel-sandals",
                "parentId": "cat-women-fashion-footwear-sandals",
                "level": 4,
                "sortOrder": 5
              }
            ]
          },
          {
            "id": "cat-women-fashion-footwear-bellies-juttis",
            "name": "Bellies & Juttis",
            "slug": "bellies-juttis",
            "parentId": "cat-women-fashion-footwear",
            "level": 3,
            "sortOrder": 7,
            "children": [
              {
                "id": "cat-women-fashion-footwear-bellies-juttis-bellies",
                "name": "Bellies",
                "slug": "bellies",
                "parentId": "cat-women-fashion-footwear-bellies-juttis",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-footwear-bellies-juttis-juttis-mojaris",
                "name": "Juttis & Mojaris",
                "slug": "juttis-mojaris",
                "parentId": "cat-women-fashion-footwear-bellies-juttis",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-women-fashion-footwear-wedges",
            "name": "Wedges",
            "slug": "wedges",
            "parentId": "cat-women-fashion-footwear",
            "level": 3,
            "sortOrder": 8,
            "children": [
              {
                "id": "cat-women-fashion-footwear-wedges-wedges",
                "name": "Wedges",
                "slug": "wedges",
                "parentId": "cat-women-fashion-footwear-wedges",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-women-fashion-inner-sleepwear",
        "name": "Inner & Sleepwear",
        "slug": "inner-sleepwear",
        "parentId": "cat-women-fashion",
        "level": 2,
        "sortOrder": 5,
        "children": [
          {
            "id": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses",
            "name": "Nightsuits & Nightdresses",
            "slug": "nightsuits-nightdresses",
            "parentId": "cat-women-fashion-inner-sleepwear",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses-babydolls",
                "name": "Babydolls",
                "slug": "babydolls",
                "parentId": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses-nightdress",
                "name": "Nightdress",
                "slug": "nightdress",
                "parentId": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses-nightsuits",
                "name": "Nightsuits",
                "slug": "nightsuits",
                "parentId": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses-pyjamas",
                "name": "Pyjamas",
                "slug": "pyjamas",
                "parentId": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses-women-sleepwear-with-inbuilt-cups",
                "name": "Women Sleepwear with inbuilt cups",
                "slug": "women-sleepwear-with-inbuilt-cups",
                "parentId": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses-couple-nightsuits",
                "name": "Couple Nightsuits",
                "slug": "couple-nightsuits",
                "parentId": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses-unstitched-fabric",
                "name": "Unstitched Fabric",
                "slug": "unstitched-fabric",
                "parentId": "cat-women-fashion-inner-sleepwear-nightsuits-nightdresses",
                "level": 4,
                "sortOrder": 7
              }
            ]
          },
          {
            "id": "cat-women-fashion-inner-sleepwear-camisoles-thermals",
            "name": "Camisoles & Thermals",
            "slug": "camisoles-thermals",
            "parentId": "cat-women-fashion-inner-sleepwear",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-women-fashion-inner-sleepwear-camisoles-thermals-camisoles",
                "name": "Camisoles",
                "slug": "camisoles",
                "parentId": "cat-women-fashion-inner-sleepwear-camisoles-thermals",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-inner-sleepwear-camisoles-thermals-thermal-bottom",
                "name": "Thermal Bottom",
                "slug": "thermal-bottom",
                "parentId": "cat-women-fashion-inner-sleepwear-camisoles-thermals",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-inner-sleepwear-camisoles-thermals-thermal-top",
                "name": "Thermal Top",
                "slug": "thermal-top",
                "parentId": "cat-women-fashion-inner-sleepwear-camisoles-thermals",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-inner-sleepwear-camisoles-thermals-thermal-sets",
                "name": "Thermal Sets",
                "slug": "thermal-sets",
                "parentId": "cat-women-fashion-inner-sleepwear-camisoles-thermals",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-women-fashion-inner-sleepwear-bras-lingerie-sets",
            "name": "Bras & Lingerie Sets",
            "slug": "bras-lingerie-sets",
            "parentId": "cat-women-fashion-inner-sleepwear",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-women-fashion-inner-sleepwear-bras-lingerie-sets-bra",
                "name": "Bra",
                "slug": "bra",
                "parentId": "cat-women-fashion-inner-sleepwear-bras-lingerie-sets",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-inner-sleepwear-bras-lingerie-sets-lingerie-sets",
                "name": "Lingerie Sets",
                "slug": "lingerie-sets",
                "parentId": "cat-women-fashion-inner-sleepwear-bras-lingerie-sets",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-inner-sleepwear-bras-lingerie-sets-stockings",
                "name": "Stockings",
                "slug": "stockings",
                "parentId": "cat-women-fashion-inner-sleepwear-bras-lingerie-sets",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-inner-sleepwear-bras-lingerie-sets-lingerie-accessories",
                "name": "Lingerie Accessories",
                "slug": "lingerie-accessories",
                "parentId": "cat-women-fashion-inner-sleepwear-bras-lingerie-sets",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-women-fashion-inner-sleepwear-briefs",
            "name": "Briefs",
            "slug": "briefs",
            "parentId": "cat-women-fashion-inner-sleepwear",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-women-fashion-inner-sleepwear-briefs-briefs",
                "name": "Briefs",
                "slug": "briefs",
                "parentId": "cat-women-fashion-inner-sleepwear-briefs",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-inner-sleepwear-shapewear",
            "name": "Shapewear",
            "slug": "shapewear",
            "parentId": "cat-women-fashion-inner-sleepwear",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-women-fashion-inner-sleepwear-shapewear-shapewear",
                "name": "Shapewear",
                "slug": "shapewear",
                "parentId": "cat-women-fashion-inner-sleepwear-shapewear",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-inner-sleepwear-bathrobes",
            "name": "Bathrobes",
            "slug": "bathrobes",
            "parentId": "cat-women-fashion-inner-sleepwear",
            "level": 3,
            "sortOrder": 6,
            "children": [
              {
                "id": "cat-women-fashion-inner-sleepwear-bathrobes-bathrobes",
                "name": "Bathrobes",
                "slug": "bathrobes",
                "parentId": "cat-women-fashion-inner-sleepwear-bathrobes",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-inner-sleepwear-period-panty",
            "name": "Period Panty",
            "slug": "period-panty",
            "parentId": "cat-women-fashion-inner-sleepwear",
            "level": 3,
            "sortOrder": 7,
            "children": [
              {
                "id": "cat-women-fashion-inner-sleepwear-period-panty-period-panty",
                "name": "Period Panty",
                "slug": "period-panty",
                "parentId": "cat-women-fashion-inner-sleepwear-period-panty",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-women-fashion-sports-activewear",
        "name": "Sports & Activewear",
        "slug": "sports-activewear",
        "parentId": "cat-women-fashion",
        "level": 2,
        "sortOrder": 6,
        "children": [
          {
            "id": "cat-women-fashion-sports-activewear-sports-wear",
            "name": "Sports Wear",
            "slug": "sports-wear",
            "parentId": "cat-women-fashion-sports-activewear",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-women-fashion-sports-activewear-sports-wear-swimwear",
                "name": "Swimwear",
                "slug": "swimwear",
                "parentId": "cat-women-fashion-sports-activewear-sports-wear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-sports-activewear-sports-wear-active-tank-top",
                "name": "Active Tank Top",
                "slug": "active-tank-top",
                "parentId": "cat-women-fashion-sports-activewear-sports-wear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-sports-activewear-sports-wear-tracksuits",
                "name": "Tracksuits",
                "slug": "tracksuits",
                "parentId": "cat-women-fashion-sports-activewear-sports-wear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-sports-activewear-sports-wear-gym-socks",
                "name": "Gym Socks",
                "slug": "gym-socks",
                "parentId": "cat-women-fashion-sports-activewear-sports-wear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-women-fashion-sports-activewear-sports-wear-tenns-wear",
                "name": "Tenns Wear",
                "slug": "tenns-wear",
                "parentId": "cat-women-fashion-sports-activewear-sports-wear",
                "level": 4,
                "sortOrder": 5
              }
            ]
          },
          {
            "id": "cat-women-fashion-sports-activewear-inner-wear",
            "name": "Inner Wear",
            "slug": "inner-wear",
            "parentId": "cat-women-fashion-sports-activewear",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-women-fashion-sports-activewear-inner-wear-sports-bra",
                "name": "Sports Bra",
                "slug": "sports-bra",
                "parentId": "cat-women-fashion-sports-activewear-inner-wear",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-sports-activewear-active-wear",
            "name": "Active Wear",
            "slug": "active-wear",
            "parentId": "cat-women-fashion-sports-activewear",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-women-fashion-sports-activewear-active-wear-active-bottom-wear",
                "name": "Active Bottom Wear",
                "slug": "active-bottom-wear",
                "parentId": "cat-women-fashion-sports-activewear-active-wear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-sports-activewear-active-wear-active-top-wear",
                "name": "Active Top Wear",
                "slug": "active-top-wear",
                "parentId": "cat-women-fashion-sports-activewear-active-wear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-women-fashion-sports-activewear-active-wear-active-clothing-set",
                "name": "Active Clothing Set",
                "slug": "active-clothing-set",
                "parentId": "cat-women-fashion-sports-activewear-active-wear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-women-fashion-sports-activewear-active-wear-active-jackets-sweatshirts",
                "name": "Active Jackets & Sweatshirts",
                "slug": "active-jackets-sweatshirts",
                "parentId": "cat-women-fashion-sports-activewear-active-wear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-women-fashion-sports-activewear-active-wear-active-shorts",
                "name": "Active Shorts",
                "slug": "active-shorts",
                "parentId": "cat-women-fashion-sports-activewear-active-wear",
                "level": 4,
                "sortOrder": 5
              }
            ]
          }
        ]
      },
      {
        "id": "cat-women-fashion-women-ethnic-wear",
        "name": "Women Ethnic Wear",
        "slug": "women-ethnic-wear",
        "parentId": "cat-women-fashion",
        "level": 2,
        "sortOrder": 7,
        "children": [
          {
            "id": "cat-women-fashion-women-ethnic-wear-ethnic-skirts",
            "name": "Ethnic Skirts",
            "slug": "ethnic-skirts",
            "parentId": "cat-women-fashion-women-ethnic-wear",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-women-fashion-women-ethnic-wear-ethnic-skirts-ethic-skirt-top",
                "name": "Ethic Skirt & Top",
                "slug": "ethic-skirt-top",
                "parentId": "cat-women-fashion-women-ethnic-wear-ethnic-skirts",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-women-fashion-maternity",
        "name": "Maternity",
        "slug": "maternity",
        "parentId": "cat-women-fashion",
        "level": 2,
        "sortOrder": 8,
        "children": [
          {
            "id": "cat-women-fashion-maternity-feeding-topwear",
            "name": "Feeding Topwear",
            "slug": "feeding-topwear",
            "parentId": "cat-women-fashion-maternity",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-women-fashion-maternity-feeding-topwear-feeding-kurtis-kurta-sets",
                "name": "Feeding Kurtis & Kurta Sets",
                "slug": "feeding-kurtis-kurta-sets",
                "parentId": "cat-women-fashion-maternity-feeding-topwear",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-women-fashion-maternity-maternity-topwear",
            "name": "Maternity Topwear",
            "slug": "maternity-topwear",
            "parentId": "cat-women-fashion-maternity",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-women-fashion-maternity-maternity-topwear-dresses",
                "name": "Dresses",
                "slug": "dresses",
                "parentId": "cat-women-fashion-maternity-maternity-topwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-women-fashion-maternity-maternity-topwear-maternity-kurti-kurta-sets",
                "name": "Maternity Kurti & Kurta Sets",
                "slug": "maternity-kurti-kurta-sets",
                "parentId": "cat-women-fashion-maternity-maternity-topwear",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-women-fashion-maternity-maternity-accessories",
            "name": "Maternity Accessories",
            "slug": "maternity-accessories",
            "parentId": "cat-women-fashion-maternity",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-women-fashion-maternity-maternity-accessories-feeding-appron",
                "name": "Feeding Appron",
                "slug": "feeding-appron",
                "parentId": "cat-women-fashion-maternity-maternity-accessories",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-home-living",
    "name": "Home & Living",
    "slug": "home-living",
    "level": 1,
    "sortOrder": 3,
    "children": [
      {
        "id": "cat-home-living-bed-linen-furnishing",
        "name": "Bed Linen & Furnishing",
        "slug": "bed-linen-furnishing",
        "parentId": "cat-home-living",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-home-living-bed-linen-furnishing-bean-bags",
            "name": "Bean Bags",
            "slug": "bean-bags",
            "parentId": "cat-home-living-bed-linen-furnishing",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-living-bed-linen-furnishing-bean-bags-bean-bags",
                "name": "Bean Bags",
                "slug": "bean-bags",
                "parentId": "cat-home-living-bed-linen-furnishing-bean-bags",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-bed-linen-furnishing-bed-covers",
            "name": "Bed Covers",
            "slug": "bed-covers",
            "parentId": "cat-home-living-bed-linen-furnishing",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-home-living-bed-linen-furnishing-bed-covers-bed-covers",
                "name": "Bed Covers",
                "slug": "bed-covers",
                "parentId": "cat-home-living-bed-linen-furnishing-bed-covers",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-bed-linen-furnishing-bedding-set",
            "name": "Bedding Set",
            "slug": "bedding-set",
            "parentId": "cat-home-living-bed-linen-furnishing",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-home-living-bed-linen-furnishing-bedding-set-bedding-set",
                "name": "Bedding Set",
                "slug": "bedding-set",
                "parentId": "cat-home-living-bed-linen-furnishing-bedding-set",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-bed-linen-furnishing-blankets-quilts-dohars",
            "name": "Blankets, Quilts & Dohars",
            "slug": "blankets-quilts-dohars",
            "parentId": "cat-home-living-bed-linen-furnishing",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-home-living-bed-linen-furnishing-blankets-quilts-dohars-blankets",
                "name": "Blankets",
                "slug": "blankets",
                "parentId": "cat-home-living-bed-linen-furnishing-blankets-quilts-dohars",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-bed-linen-furnishing-cushions-cushion-covers",
            "name": "Cushions & Cushion Covers",
            "slug": "cushions-cushion-covers",
            "parentId": "cat-home-living-bed-linen-furnishing",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-home-living-bed-linen-furnishing-cushions-cushion-covers-cushions",
                "name": "Cushions",
                "slug": "cushions",
                "parentId": "cat-home-living-bed-linen-furnishing-cushions-cushion-covers",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-bed-linen-furnishing-diwan-sets",
            "name": "Diwan Sets",
            "slug": "diwan-sets",
            "parentId": "cat-home-living-bed-linen-furnishing",
            "level": 3,
            "sortOrder": 6,
            "children": [
              {
                "id": "cat-home-living-bed-linen-furnishing-diwan-sets-diwan-sets",
                "name": "Diwan Sets",
                "slug": "diwan-sets",
                "parentId": "cat-home-living-bed-linen-furnishing-diwan-sets",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-bed-linen-furnishing-pillows",
            "name": "Pillows",
            "slug": "pillows",
            "parentId": "cat-home-living-bed-linen-furnishing",
            "level": 3,
            "sortOrder": 7,
            "children": [
              {
                "id": "cat-home-living-bed-linen-furnishing-pillows-pillows",
                "name": "Pillows",
                "slug": "pillows",
                "parentId": "cat-home-living-bed-linen-furnishing-pillows",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-home-living-towels-bath-accessories",
        "name": "Towels & Bath Accessories",
        "slug": "towels-bath-accessories",
        "parentId": "cat-home-living",
        "level": 2,
        "sortOrder": 2,
        "children": [
          {
            "id": "cat-home-living-towels-bath-accessories-bath-rugs",
            "name": "Bath Rugs",
            "slug": "bath-rugs",
            "parentId": "cat-home-living-towels-bath-accessories",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-living-towels-bath-accessories-bath-rugs-bath-rugs",
                "name": "Bath Rugs",
                "slug": "bath-rugs",
                "parentId": "cat-home-living-towels-bath-accessories-bath-rugs",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-towels-bath-accessories-bath-towels",
            "name": "Bath Towels",
            "slug": "bath-towels",
            "parentId": "cat-home-living-towels-bath-accessories",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-home-living-towels-bath-accessories-bath-towels-bath-towels",
                "name": "Bath Towels",
                "slug": "bath-towels",
                "parentId": "cat-home-living-towels-bath-accessories-bath-towels",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-towels-bath-accessories-bathroom-accessories",
            "name": "Bathroom Accessories",
            "slug": "bathroom-accessories",
            "parentId": "cat-home-living-towels-bath-accessories",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-home-living-towels-bath-accessories-bathroom-accessories-bathroom-accessories",
                "name": "Bathroom Accessories",
                "slug": "bathroom-accessories",
                "parentId": "cat-home-living-towels-bath-accessories-bathroom-accessories",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-towels-bath-accessories-hand-towels",
            "name": "Hand Towels",
            "slug": "hand-towels",
            "parentId": "cat-home-living-towels-bath-accessories",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-home-living-towels-bath-accessories-hand-towels-hand-towels",
                "name": "Hand Towels",
                "slug": "hand-towels",
                "parentId": "cat-home-living-towels-bath-accessories-hand-towels",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-home-living-home-utility",
        "name": "Home Utility",
        "slug": "home-utility",
        "parentId": "cat-home-living",
        "level": 2,
        "sortOrder": 3,
        "children": [
          {
            "id": "cat-home-living-home-utility-covers",
            "name": "Covers",
            "slug": "covers",
            "parentId": "cat-home-living-home-utility",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-living-home-utility-covers-covers",
                "name": "Covers",
                "slug": "covers",
                "parentId": "cat-home-living-home-utility-covers",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-home-utility-electronic-utility",
            "name": "Electronic Utility",
            "slug": "electronic-utility",
            "parentId": "cat-home-living-home-utility",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-home-living-home-utility-electronic-utility-electronic-utility",
                "name": "Electronic Utility",
                "slug": "electronic-utility",
                "parentId": "cat-home-living-home-utility-electronic-utility",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-home-utility-gifts",
            "name": "Gifts",
            "slug": "gifts",
            "parentId": "cat-home-living-home-utility",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-home-living-home-utility-gifts-gifts",
                "name": "Gifts",
                "slug": "gifts",
                "parentId": "cat-home-living-home-utility-gifts",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-home-utility-laundry-bags",
            "name": "Laundry Bags",
            "slug": "laundry-bags",
            "parentId": "cat-home-living-home-utility",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-home-living-home-utility-laundry-bags-laundry-bags",
                "name": "Laundry Bags",
                "slug": "laundry-bags",
                "parentId": "cat-home-living-home-utility-laundry-bags",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-home-utility-other-home-utility",
            "name": "Other Home Utility",
            "slug": "other-home-utility",
            "parentId": "cat-home-living-home-utility",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-home-living-home-utility-other-home-utility-other-home-utility",
                "name": "Other Home Utility",
                "slug": "other-home-utility",
                "parentId": "cat-home-living-home-utility-other-home-utility",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-home-living-curtains",
        "name": "Curtains",
        "slug": "curtains",
        "parentId": "cat-home-living",
        "level": 2,
        "sortOrder": 4,
        "children": [
          {
            "id": "cat-home-living-curtains-curtains-sheers",
            "name": "Curtains & Sheers",
            "slug": "curtains-sheers",
            "parentId": "cat-home-living-curtains",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-living-curtains-curtains-sheers-curtains-sheers",
                "name": "Curtains & Sheers",
                "slug": "curtains-sheers",
                "parentId": "cat-home-living-curtains-curtains-sheers",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-curtains-shower-curtains",
            "name": "Shower Curtains",
            "slug": "shower-curtains",
            "parentId": "cat-home-living-curtains",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-home-living-curtains-shower-curtains-shower-curtains",
                "name": "Shower Curtains",
                "slug": "shower-curtains",
                "parentId": "cat-home-living-curtains-shower-curtains",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-home-living-festive-decor",
        "name": "Festive & Decor",
        "slug": "festive-decor",
        "parentId": "cat-home-living",
        "level": 2,
        "sortOrder": 5,
        "children": [
          {
            "id": "cat-home-living-festive-decor-festive",
            "name": "Festive",
            "slug": "festive",
            "parentId": "cat-home-living-festive-decor",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-living-festive-decor-festive-rakhi",
                "name": "Rakhi",
                "slug": "rakhi",
                "parentId": "cat-home-living-festive-decor-festive",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-home-living-floor-mats-dhurries",
        "name": "Floor Mats & Dhurries",
        "slug": "floor-mats-dhurries",
        "parentId": "cat-home-living",
        "level": 2,
        "sortOrder": 6,
        "children": [
          {
            "id": "cat-home-living-floor-mats-dhurries-doormats",
            "name": "Doormats",
            "slug": "doormats",
            "parentId": "cat-home-living-floor-mats-dhurries",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-living-floor-mats-dhurries-doormats-doormats",
                "name": "Doormats",
                "slug": "doormats",
                "parentId": "cat-home-living-floor-mats-dhurries-doormats",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-floor-mats-dhurries-floormats-dhurries",
            "name": "Floormats & Dhurries",
            "slug": "floormats-dhurries",
            "parentId": "cat-home-living-floor-mats-dhurries",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-home-living-floor-mats-dhurries-floormats-dhurries-floormats-dhurries",
                "name": "Floormats & Dhurries",
                "slug": "floormats-dhurries",
                "parentId": "cat-home-living-floor-mats-dhurries-floormats-dhurries",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-home-living-bedding-linen",
        "name": "Bedding & Linen",
        "slug": "bedding-linen",
        "parentId": "cat-home-living",
        "level": 2,
        "sortOrder": 7,
        "children": [
          {
            "id": "cat-home-living-bedding-linen-bed-runners-scavers",
            "name": "Bed Runners & Scavers",
            "slug": "bed-runners-scavers",
            "parentId": "cat-home-living-bedding-linen",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-living-bedding-linen-bed-runners-scavers-bed-runners-scavers",
                "name": "Bed Runners & Scavers",
                "slug": "bed-runners-scavers",
                "parentId": "cat-home-living-bedding-linen-bed-runners-scavers",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-bedding-linen-duvet-cover",
            "name": "Duvet Cover",
            "slug": "duvet-cover",
            "parentId": "cat-home-living-bedding-linen",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-home-living-bedding-linen-duvet-cover-duvet-cover",
                "name": "Duvet Cover",
                "slug": "duvet-cover",
                "parentId": "cat-home-living-bedding-linen-duvet-cover",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-home-living-baby-care",
        "name": "Baby Care",
        "slug": "baby-care",
        "parentId": "cat-home-living",
        "level": 2,
        "sortOrder": 8,
        "children": [
          {
            "id": "cat-home-living-baby-care-baby-mats-bed-protector",
            "name": "Baby Mats & Bed Protector",
            "slug": "baby-mats-bed-protector",
            "parentId": "cat-home-living-baby-care",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-living-baby-care-baby-mats-bed-protector-baby-mats-bed-protector",
                "name": "Baby Mats & Bed Protector",
                "slug": "baby-mats-bed-protector",
                "parentId": "cat-home-living-baby-care-baby-mats-bed-protector",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-baby-care-baby-blanket",
            "name": "Baby Blanket",
            "slug": "baby-blanket",
            "parentId": "cat-home-living-baby-care",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-home-living-baby-care-baby-blanket-baby-blanket",
                "name": "Baby Blanket",
                "slug": "baby-blanket",
                "parentId": "cat-home-living-baby-care-baby-blanket",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-baby-care-baby-mosquito-nets",
            "name": "Baby Mosquito Nets",
            "slug": "baby-mosquito-nets",
            "parentId": "cat-home-living-baby-care",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-home-living-baby-care-baby-mosquito-nets-baby-mosquito-nets",
                "name": "Baby Mosquito Nets",
                "slug": "baby-mosquito-nets",
                "parentId": "cat-home-living-baby-care-baby-mosquito-nets",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-baby-care-baby-pillows",
            "name": "Baby Pillows",
            "slug": "baby-pillows",
            "parentId": "cat-home-living-baby-care",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-home-living-baby-care-baby-pillows-baby-pillows",
                "name": "Baby Pillows",
                "slug": "baby-pillows",
                "parentId": "cat-home-living-baby-care-baby-pillows",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-baby-care-baby-sleeping-bag",
            "name": "Baby Sleeping Bag",
            "slug": "baby-sleeping-bag",
            "parentId": "cat-home-living-baby-care",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-home-living-baby-care-baby-sleeping-bag-baby-sleeping-bag",
                "name": "Baby Sleeping Bag",
                "slug": "baby-sleeping-bag",
                "parentId": "cat-home-living-baby-care-baby-sleeping-bag",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-baby-care-baby-towels",
            "name": "Baby Towels",
            "slug": "baby-towels",
            "parentId": "cat-home-living-baby-care",
            "level": 3,
            "sortOrder": 6,
            "children": [
              {
                "id": "cat-home-living-baby-care-baby-towels-baby-towels",
                "name": "Baby Towels",
                "slug": "baby-towels",
                "parentId": "cat-home-living-baby-care-baby-towels",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-baby-care-baby-hanging-cradle",
            "name": "Baby Hanging Cradle",
            "slug": "baby-hanging-cradle",
            "parentId": "cat-home-living-baby-care",
            "level": 3,
            "sortOrder": 7,
            "children": [
              {
                "id": "cat-home-living-baby-care-baby-hanging-cradle-baby-hanging-cradle",
                "name": "Baby Hanging Cradle",
                "slug": "baby-hanging-cradle",
                "parentId": "cat-home-living-baby-care-baby-hanging-cradle",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-home-living-pet-care",
        "name": "Pet Care",
        "slug": "pet-care",
        "parentId": "cat-home-living",
        "level": 2,
        "sortOrder": 9,
        "children": [
          {
            "id": "cat-home-living-pet-care-dog-mats",
            "name": "Dog Mats",
            "slug": "dog-mats",
            "parentId": "cat-home-living-pet-care",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-living-pet-care-dog-mats-dog-mats",
                "name": "Dog Mats",
                "slug": "dog-mats",
                "parentId": "cat-home-living-pet-care-dog-mats",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-home-living-carpets-doormats",
        "name": "Carpets & Doormats",
        "slug": "carpets-doormats",
        "parentId": "cat-home-living",
        "level": 2,
        "sortOrder": 10,
        "children": [
          {
            "id": "cat-home-living-carpets-doormats-medium-weight-carpets",
            "name": "Medium Weight Carpets",
            "slug": "medium-weight-carpets",
            "parentId": "cat-home-living-carpets-doormats",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-living-carpets-doormats-medium-weight-carpets-medium-weight-carpets",
                "name": "Medium Weight Carpets",
                "slug": "medium-weight-carpets",
                "parentId": "cat-home-living-carpets-doormats-medium-weight-carpets",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-home-living-soft-furnishing",
        "name": "Soft Furnishing",
        "slug": "soft-furnishing",
        "parentId": "cat-home-living",
        "level": 2,
        "sortOrder": 11,
        "children": [
          {
            "id": "cat-home-living-soft-furnishing-pet-furnishing",
            "name": "Pet Furnishing",
            "slug": "pet-furnishing",
            "parentId": "cat-home-living-soft-furnishing",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-living-soft-furnishing-pet-furnishing-pet-furnishing",
                "name": "Pet Furnishing",
                "slug": "pet-furnishing",
                "parentId": "cat-home-living-soft-furnishing-pet-furnishing",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-home-living-furniture",
        "name": "Furniture",
        "slug": "furniture",
        "parentId": "cat-home-living",
        "level": 2,
        "sortOrder": 12,
        "children": [
          {
            "id": "cat-home-living-furniture-storage-furniture",
            "name": "Storage Furniture",
            "slug": "storage-furniture",
            "parentId": "cat-home-living-furniture",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-living-furniture-storage-furniture-storage-furniture",
                "name": "Storage Furniture",
                "slug": "storage-furniture",
                "parentId": "cat-home-living-furniture-storage-furniture",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-home-living-furniture-living-room-furniture",
            "name": "Living room Furniture",
            "slug": "living-room-furniture",
            "parentId": "cat-home-living-furniture",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-home-living-furniture-living-room-furniture-living-room-furniture",
                "name": "Living room Furniture",
                "slug": "living-room-furniture",
                "parentId": "cat-home-living-furniture-living-room-furniture",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-kids-toys",
    "name": "Kids & Toys",
    "slug": "kids-toys",
    "level": 1,
    "sortOrder": 4,
    "children": [
      {
        "id": "cat-kids-toys-accessories",
        "name": "Accessories",
        "slug": "accessories",
        "parentId": "cat-kids-toys",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-kids-toys-accessories-unisex",
            "name": "Unisex",
            "slug": "unisex",
            "parentId": "cat-kids-toys-accessories",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-kids-toys-accessories-unisex-bags-backpacks",
                "name": "Bags & Backpacks",
                "slug": "bags-backpacks",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-accessories-unisex-towel-bathrobes-showercaps",
                "name": "Towel, Bathrobes & Showercaps",
                "slug": "towel-bathrobes-showercaps",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-accessories-unisex-bedsheets",
                "name": "Bedsheets",
                "slug": "bedsheets",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-accessories-unisex-blankets",
                "name": "Blankets",
                "slug": "blankets",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-accessories-unisex-bottles-lunchboxes",
                "name": "Bottles & Lunchboxes",
                "slug": "bottles-lunchboxes",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-accessories-unisex-caps",
                "name": "Caps",
                "slug": "caps",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-accessories-unisex-other-kids-accessories",
                "name": "Other Kids Accessories",
                "slug": "other-kids-accessories",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-kids-toys-accessories-unisex-caps-ties-belts-socks",
                "name": "Caps, Ties, Belts & Socks",
                "slug": "caps-ties-belts-socks",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 8
              },
              {
                "id": "cat-kids-toys-accessories-unisex-sunglasses",
                "name": "Sunglasses",
                "slug": "sunglasses",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 9
              },
              {
                "id": "cat-kids-toys-accessories-unisex-suspenders",
                "name": "Suspenders",
                "slug": "suspenders",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 10
              },
              {
                "id": "cat-kids-toys-accessories-unisex-handkerchiefs",
                "name": "Handkerchiefs",
                "slug": "handkerchiefs",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 11
              },
              {
                "id": "cat-kids-toys-accessories-unisex-balaclavas",
                "name": "Balaclavas",
                "slug": "balaclavas",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 12
              },
              {
                "id": "cat-kids-toys-accessories-unisex-kids-umbrella",
                "name": "Kids Umbrella",
                "slug": "kids-umbrella",
                "parentId": "cat-kids-toys-accessories-unisex",
                "level": 4,
                "sortOrder": 13
              }
            ]
          },
          {
            "id": "cat-kids-toys-accessories-watches",
            "name": "Watches",
            "slug": "watches",
            "parentId": "cat-kids-toys-accessories",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-kids-toys-accessories-watches-sports-watches",
                "name": "Sports Watches",
                "slug": "sports-watches",
                "parentId": "cat-kids-toys-accessories-watches",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-accessories-watches-analog-watches",
                "name": "Analog Watches",
                "slug": "analog-watches",
                "parentId": "cat-kids-toys-accessories-watches",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-accessories-watches-chronograph-watches",
                "name": "Chronograph Watches",
                "slug": "chronograph-watches",
                "parentId": "cat-kids-toys-accessories-watches",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-accessories-watches-digital-watches",
                "name": "Digital Watches",
                "slug": "digital-watches",
                "parentId": "cat-kids-toys-accessories-watches",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-accessories-watches-watchbands",
                "name": "Watchbands",
                "slug": "watchbands",
                "parentId": "cat-kids-toys-accessories-watches",
                "level": 4,
                "sortOrder": 5
              }
            ]
          },
          {
            "id": "cat-kids-toys-accessories-badges",
            "name": "Badges",
            "slug": "badges",
            "parentId": "cat-kids-toys-accessories",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-kids-toys-accessories-badges-badges",
                "name": "Badges",
                "slug": "badges",
                "parentId": "cat-kids-toys-accessories-badges",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-accessories-school-supplies",
            "name": "School Supplies",
            "slug": "school-supplies",
            "parentId": "cat-kids-toys-accessories",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-kids-toys-accessories-school-supplies-lunch-boxes-water-bottles",
                "name": "Lunch Boxes & Water Bottles",
                "slug": "lunch-boxes-water-bottles",
                "parentId": "cat-kids-toys-accessories-school-supplies",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-accessories-school-supplies-travel-items",
                "name": "Travel Items",
                "slug": "travel-items",
                "parentId": "cat-kids-toys-accessories-school-supplies",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-accessories-school-supplies-school-bags",
                "name": "School bags",
                "slug": "school-bags",
                "parentId": "cat-kids-toys-accessories-school-supplies",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-kids-toys-accessories-hats-caps",
            "name": "Hats & Caps",
            "slug": "hats-caps",
            "parentId": "cat-kids-toys-accessories",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-kids-toys-accessories-hats-caps-hats-caps",
                "name": "Hats & Caps",
                "slug": "hats-caps",
                "parentId": "cat-kids-toys-accessories-hats-caps",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-accessories-jewellery",
            "name": "Jewellery",
            "slug": "jewellery",
            "parentId": "cat-kids-toys-accessories",
            "level": 3,
            "sortOrder": 6,
            "children": [
              {
                "id": "cat-kids-toys-accessories-jewellery-bracelets",
                "name": "Bracelets",
                "slug": "bracelets",
                "parentId": "cat-kids-toys-accessories-jewellery",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-accessories-jewellery-bangles",
                "name": "Bangles",
                "slug": "bangles",
                "parentId": "cat-kids-toys-accessories-jewellery",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-accessories-jewellery-rings",
                "name": "Rings",
                "slug": "rings",
                "parentId": "cat-kids-toys-accessories-jewellery",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-kids-toys-accessories-soft-toys",
            "name": "Soft Toys",
            "slug": "soft-toys",
            "parentId": "cat-kids-toys-accessories",
            "level": 3,
            "sortOrder": 7,
            "children": [
              {
                "id": "cat-kids-toys-accessories-soft-toys-teddy-bears",
                "name": "Teddy Bears",
                "slug": "teddy-bears",
                "parentId": "cat-kids-toys-accessories-soft-toys",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-accessories-baby-safety-training",
            "name": "Baby Safety & Training",
            "slug": "baby-safety-training",
            "parentId": "cat-kids-toys-accessories",
            "level": 3,
            "sortOrder": 8,
            "children": [
              {
                "id": "cat-kids-toys-accessories-baby-safety-training-baby-safety-guards-locks",
                "name": "Baby Safety Guards & Locks",
                "slug": "baby-safety-guards-locks",
                "parentId": "cat-kids-toys-accessories-baby-safety-training",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-accessories-baby-safety-training-baby-hearing-protection-earmuffs",
                "name": "Baby Hearing Protection Earmuffs",
                "slug": "baby-hearing-protection-earmuffs",
                "parentId": "cat-kids-toys-accessories-baby-safety-training",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-accessories-baby-safety-training-baby-toddler-carriers",
                "name": "Baby & Toddler Carriers",
                "slug": "baby-toddler-carriers",
                "parentId": "cat-kids-toys-accessories-baby-safety-training",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-accessories-baby-safety-training-potty-seats-chairs",
                "name": "Potty Seats & Chairs",
                "slug": "potty-seats-chairs",
                "parentId": "cat-kids-toys-accessories-baby-safety-training",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-accessories-baby-safety-training-potty-step-stools",
                "name": "Potty Step Stools",
                "slug": "potty-step-stools",
                "parentId": "cat-kids-toys-accessories-baby-safety-training",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-accessories-baby-safety-training-safety-harnesses",
                "name": "Safety Harnesses",
                "slug": "safety-harnesses",
                "parentId": "cat-kids-toys-accessories-baby-safety-training",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-accessories-baby-safety-training-baby-walker",
                "name": "Baby Walker",
                "slug": "baby-walker",
                "parentId": "cat-kids-toys-accessories-baby-safety-training",
                "level": 4,
                "sortOrder": 7
              }
            ]
          }
        ]
      },
      {
        "id": "cat-kids-toys-apparel",
        "name": "Apparel",
        "slug": "apparel",
        "parentId": "cat-kids-toys",
        "level": 2,
        "sortOrder": 2,
        "children": [
          {
            "id": "cat-kids-toys-apparel-girls",
            "name": "Girls",
            "slug": "girls",
            "parentId": "cat-kids-toys-apparel",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-kids-toys-apparel-girls-kurta-suit-sets",
                "name": "Kurta Suit Sets",
                "slug": "kurta-suit-sets",
                "parentId": "cat-kids-toys-apparel-girls",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-apparel-girls-dungarees-jumpsuits",
                "name": "Dungarees & Jumpsuits",
                "slug": "dungarees-jumpsuits",
                "parentId": "cat-kids-toys-apparel-girls",
                "level": 4,
                "sortOrder": 2
              }
            ]
          }
        ]
      },
      {
        "id": "cat-kids-toys-toys",
        "name": "Toys",
        "slug": "toys",
        "parentId": "cat-kids-toys",
        "level": 2,
        "sortOrder": 3,
        "children": [
          {
            "id": "cat-kids-toys-toys-unisex",
            "name": "Unisex",
            "slug": "unisex",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-kids-toys-toys-unisex-educational-toys",
                "name": "Educational Toys",
                "slug": "educational-toys",
                "parentId": "cat-kids-toys-toys-unisex",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-electronic-toys",
            "name": "Electronic Toys",
            "slug": "electronic-toys",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-kids-toys-toys-electronic-toys-remote-control-toys",
                "name": "Remote Control Toys",
                "slug": "remote-control-toys",
                "parentId": "cat-kids-toys-toys-electronic-toys",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-electronic-toys-electronic-toys-games",
                "name": "Electronic Toys & games",
                "slug": "electronic-toys-games",
                "parentId": "cat-kids-toys-toys-electronic-toys",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-electronic-toys-musical-toys",
                "name": "Musical toys",
                "slug": "musical-toys",
                "parentId": "cat-kids-toys-toys-electronic-toys",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-electronic-toys-walkie-talkies",
                "name": "Walkie Talkies",
                "slug": "walkie-talkies",
                "parentId": "cat-kids-toys-toys-electronic-toys",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-toys-electronic-toys-plug-play-video-games",
                "name": "Plug & Play Video Games",
                "slug": "plug-play-video-games",
                "parentId": "cat-kids-toys-toys-electronic-toys",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-toys-electronic-toys-electronic-pets",
                "name": "Electronic Pets",
                "slug": "electronic-pets",
                "parentId": "cat-kids-toys-toys-electronic-toys",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-toys-electronic-toys-handheld-games",
                "name": "Handheld Games",
                "slug": "handheld-games",
                "parentId": "cat-kids-toys-toys-electronic-toys",
                "level": 4,
                "sortOrder": 7
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-soft-toys",
            "name": "Soft Toys",
            "slug": "soft-toys",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-kids-toys-toys-soft-toys-stuffed-toys",
                "name": "Stuffed Toys",
                "slug": "stuffed-toys",
                "parentId": "cat-kids-toys-toys-soft-toys",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-soft-toys-clip-on-toys-for-baby-gear",
                "name": "Clip-On Toys for Baby Gear",
                "slug": "clip-on-toys-for-baby-gear",
                "parentId": "cat-kids-toys-toys-soft-toys",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-soft-toys-stuffed-animals",
                "name": "Stuffed animals",
                "slug": "stuffed-animals",
                "parentId": "cat-kids-toys-toys-soft-toys",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-soft-toys-cartoon-characters",
                "name": "Cartoon Characters",
                "slug": "cartoon-characters",
                "parentId": "cat-kids-toys-toys-soft-toys",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-sport-outdoor",
            "name": "Sport & Outdoor",
            "slug": "sport-outdoor",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-kids-toys-toys-sport-outdoor-play-tents",
                "name": "Play Tents",
                "slug": "play-tents",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-slumber-bags",
                "name": "Slumber Bags",
                "slug": "slumber-bags",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-balance-boards",
                "name": "Balance Boards",
                "slug": "balance-boards",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-beanbags-foot-bags",
                "name": "Beanbags & Foot Bags",
                "slug": "beanbags-foot-bags",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-garden-tools",
                "name": "Garden Tools",
                "slug": "garden-tools",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-table-soccer-billiards",
                "name": "Table Soccer & Billiards",
                "slug": "table-soccer-billiards",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-racket-games",
                "name": "Racket Games",
                "slug": "racket-games",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-pogo-sticks",
                "name": "Pogo Sticks",
                "slug": "pogo-sticks",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 8
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-marbles",
                "name": "Marbles",
                "slug": "marbles",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 9
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-badminton",
                "name": "Badminton",
                "slug": "badminton",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 10
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-volleyballs-set",
                "name": "Volleyballs & Set",
                "slug": "volleyballs-set",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 11
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-cricket-set",
                "name": "Cricket Set",
                "slug": "cricket-set",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 12
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-foosball",
                "name": "Foosball",
                "slug": "foosball",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 13
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-basketballs-set",
                "name": "Basketballs & Set",
                "slug": "basketballs-set",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 14
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-baseball",
                "name": "Baseball",
                "slug": "baseball",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 15
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-yoga-mats-gym-accessories-361",
                "name": "Yoga Mats & Gym Accessories (361)",
                "slug": "yoga-mats-gym-accessories-361",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 16
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-cricket",
                "name": "Cricket",
                "slug": "cricket",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 17
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-balls",
                "name": "Balls",
                "slug": "balls",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 18
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-boxing-set",
                "name": "Boxing Set",
                "slug": "boxing-set",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 19
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-lawn-tennis",
                "name": "Lawn Tennis",
                "slug": "lawn-tennis",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 20
              },
              {
                "id": "cat-kids-toys-toys-sport-outdoor-table-tennis",
                "name": "Table Tennis",
                "slug": "table-tennis",
                "parentId": "cat-kids-toys-toys-sport-outdoor",
                "level": 4,
                "sortOrder": 21
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-pretend-play",
            "name": "Pretend Play",
            "slug": "pretend-play",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-kids-toys-toys-pretend-play-pretend-play-sets",
                "name": "Pretend Play Sets",
                "slug": "pretend-play-sets",
                "parentId": "cat-kids-toys-toys-pretend-play",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-pretend-play-dress-ups-costumes",
                "name": "Dress ups & costumes",
                "slug": "dress-ups-costumes",
                "parentId": "cat-kids-toys-toys-pretend-play",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-games",
            "name": "Games",
            "slug": "games",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 6,
            "children": [
              {
                "id": "cat-kids-toys-toys-games-board-games",
                "name": "Board Games",
                "slug": "board-games",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-games-playing-cards",
                "name": "Playing Cards",
                "slug": "playing-cards",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-games-travel-games",
                "name": "Travel games",
                "slug": "travel-games",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-games-indoor-climbers-play",
                "name": "Indoor Climbers & Play",
                "slug": "indoor-climbers-play",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-toys-games-travel-pocket-games",
                "name": "Travel & Pocket Games",
                "slug": "travel-pocket-games",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-toys-games-games-collections",
                "name": "Games Collections",
                "slug": "games-collections",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-toys-games-stacking-balancing-games",
                "name": "Stacking & Balancing Games",
                "slug": "stacking-balancing-games",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-kids-toys-toys-games-floor-games",
                "name": "Floor Games",
                "slug": "floor-games",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 8
              },
              {
                "id": "cat-kids-toys-toys-games-magic-supplies",
                "name": "Magic Supplies",
                "slug": "magic-supplies",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 9
              },
              {
                "id": "cat-kids-toys-toys-games-dice-dice-games",
                "name": "Dice & Dice Games",
                "slug": "dice-dice-games",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 10
              },
              {
                "id": "cat-kids-toys-toys-games-chess",
                "name": "Chess",
                "slug": "chess",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 11
              },
              {
                "id": "cat-kids-toys-toys-games-domino-tile-games",
                "name": "Domino & Tile Games",
                "slug": "domino-tile-games",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 12
              },
              {
                "id": "cat-kids-toys-toys-games-carrom-board",
                "name": "Carrom Board",
                "slug": "carrom-board",
                "parentId": "cat-kids-toys-toys-games",
                "level": 4,
                "sortOrder": 13
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-novelty-gag-toys",
            "name": "Novelty & Gag Toys",
            "slug": "novelty-gag-toys",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 7,
            "children": [
              {
                "id": "cat-kids-toys-toys-novelty-gag-toys-money-banks",
                "name": "Money Banks",
                "slug": "money-banks",
                "parentId": "cat-kids-toys-toys-novelty-gag-toys",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-baby-toddler-toys",
            "name": "Baby & Toddler Toys",
            "slug": "baby-toddler-toys",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 8,
            "children": [
              {
                "id": "cat-kids-toys-toys-baby-toddler-toys-bath-toys",
                "name": "Bath Toys",
                "slug": "bath-toys",
                "parentId": "cat-kids-toys-toys-baby-toddler-toys",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-baby-toddler-toys-toddler-toys",
                "name": "Toddler Toys",
                "slug": "toddler-toys",
                "parentId": "cat-kids-toys-toys-baby-toddler-toys",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-baby-toddler-toys-rattle-sets",
                "name": "Rattle Sets",
                "slug": "rattle-sets",
                "parentId": "cat-kids-toys-toys-baby-toddler-toys",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-baby-toddler-toys-spinning-battling-tops",
                "name": "Spinning & Battling Tops",
                "slug": "spinning-battling-tops",
                "parentId": "cat-kids-toys-toys-baby-toddler-toys",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-toys-baby-toddler-toys-animal-shaped-rattles",
                "name": "Animal Shaped Rattles",
                "slug": "animal-shaped-rattles",
                "parentId": "cat-kids-toys-toys-baby-toddler-toys",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-toys-baby-toddler-toys-baby-rattles",
                "name": "Baby Rattles",
                "slug": "baby-rattles",
                "parentId": "cat-kids-toys-toys-baby-toddler-toys",
                "level": 4,
                "sortOrder": 6
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-dolls",
            "name": "Dolls",
            "slug": "dolls",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 9,
            "children": [
              {
                "id": "cat-kids-toys-toys-dolls-dolls-doll-houses",
                "name": "Dolls & Doll houses",
                "slug": "dolls-doll-houses",
                "parentId": "cat-kids-toys-toys-dolls",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-dolls-candy-dolls",
                "name": "Candy Dolls",
                "slug": "candy-dolls",
                "parentId": "cat-kids-toys-toys-dolls",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-dolls-dolls-accessories",
                "name": "Dolls Accessories",
                "slug": "dolls-accessories",
                "parentId": "cat-kids-toys-toys-dolls",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-dolls-fashion-dolls",
                "name": "Fashion dolls",
                "slug": "fashion-dolls",
                "parentId": "cat-kids-toys-toys-dolls",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-learning-education",
            "name": "Learning & Education",
            "slug": "learning-education",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 10,
            "children": [
              {
                "id": "cat-kids-toys-toys-learning-education-reading-writing-toys",
                "name": "Reading & Writing Toys",
                "slug": "reading-writing-toys",
                "parentId": "cat-kids-toys-toys-learning-education",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-learning-education-magnets-magnetic-toys",
                "name": "Magnets & Magnetic Toys",
                "slug": "magnets-magnetic-toys",
                "parentId": "cat-kids-toys-toys-learning-education",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-learning-education-early-development-activity-toys",
                "name": "Early Development & Activity Toys",
                "slug": "early-development-activity-toys",
                "parentId": "cat-kids-toys-toys-learning-education",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-learning-education-toy-tablets-computers",
                "name": "Toy Tablets & Computers",
                "slug": "toy-tablets-computers",
                "parentId": "cat-kids-toys-toys-learning-education",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-toys-learning-education-math-toys",
                "name": "Math Toys",
                "slug": "math-toys",
                "parentId": "cat-kids-toys-toys-learning-education",
                "level": 4,
                "sortOrder": 5
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-puzzles",
            "name": "Puzzles",
            "slug": "puzzles",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 11,
            "children": [
              {
                "id": "cat-kids-toys-toys-puzzles-wooden-puzzle",
                "name": "Wooden Puzzle",
                "slug": "wooden-puzzle",
                "parentId": "cat-kids-toys-toys-puzzles",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-puzzles-jigsaw-puzzle",
                "name": "Jigsaw Puzzle",
                "slug": "jigsaw-puzzle",
                "parentId": "cat-kids-toys-toys-puzzles",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-puzzles-floor-puzzles",
                "name": "Floor Puzzles",
                "slug": "floor-puzzles",
                "parentId": "cat-kids-toys-toys-puzzles",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-puzzles-3-d-puzzles",
                "name": "3-D Puzzles",
                "slug": "3-d-puzzles",
                "parentId": "cat-kids-toys-toys-puzzles",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-toys-puzzles-sudoku-puzzles",
                "name": "Sudoku Puzzles",
                "slug": "sudoku-puzzles",
                "parentId": "cat-kids-toys-toys-puzzles",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-toys-puzzles-puzzle-mats",
                "name": "Puzzle Mats",
                "slug": "puzzle-mats",
                "parentId": "cat-kids-toys-toys-puzzles",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-toys-puzzles-framed-puzzles",
                "name": "Framed Puzzles",
                "slug": "framed-puzzles",
                "parentId": "cat-kids-toys-toys-puzzles",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-kids-toys-toys-puzzles-board-puzzle",
                "name": "Board Puzzle",
                "slug": "board-puzzle",
                "parentId": "cat-kids-toys-toys-puzzles",
                "level": 4,
                "sortOrder": 8
              },
              {
                "id": "cat-kids-toys-toys-puzzles-rubik-cubes",
                "name": "Rubik Cubes",
                "slug": "rubik-cubes",
                "parentId": "cat-kids-toys-toys-puzzles",
                "level": 4,
                "sortOrder": 9
              },
              {
                "id": "cat-kids-toys-toys-puzzles-knob-peg-puzzles",
                "name": "Knob & Peg Puzzles",
                "slug": "knob-peg-puzzles",
                "parentId": "cat-kids-toys-toys-puzzles",
                "level": 4,
                "sortOrder": 10
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-outdoor-games",
            "name": "Outdoor Games",
            "slug": "outdoor-games",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 12,
            "children": [
              {
                "id": "cat-kids-toys-toys-outdoor-games-pools-water-fun",
                "name": "Pools & Water Fun",
                "slug": "pools-water-fun",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-outdoor-sports-play-sets",
                "name": "Outdoor Sports Play & Sets",
                "slug": "outdoor-sports-play-sets",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-frisbees-and-boomerangs",
                "name": "Frisbees and Boomerangs",
                "slug": "frisbees-and-boomerangs",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-air-pump",
                "name": "Air Pump",
                "slug": "air-pump",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-bowling-set",
                "name": "Bowling Set",
                "slug": "bowling-set",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-hopscotch",
                "name": "Hopscotch",
                "slug": "hopscotch",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-picnic-tables",
                "name": "Picnic Tables",
                "slug": "picnic-tables",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-ball-pit",
                "name": "Ball Pit",
                "slug": "ball-pit",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 8
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-skipping-ropes-hula-hoops",
                "name": "Skipping Ropes & Hula Hoops",
                "slug": "skipping-ropes-hula-hoops",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 9
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-ring-toss-set",
                "name": "Ring Toss Set",
                "slug": "ring-toss-set",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 10
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-wooden-ladders-hoppers",
                "name": "Wooden Ladders & Hoppers",
                "slug": "wooden-ladders-hoppers",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 11
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-beach-toys-set",
                "name": "Beach Toys Set",
                "slug": "beach-toys-set",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 12
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-hit-me-toys",
                "name": "Hit Me Toys",
                "slug": "hit-me-toys",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 13
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-catcher-sling-shots",
                "name": "Catcher & Sling Shots",
                "slug": "catcher-sling-shots",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 14
              },
              {
                "id": "cat-kids-toys-toys-outdoor-games-trampoline",
                "name": "Trampoline",
                "slug": "trampoline",
                "parentId": "cat-kids-toys-toys-outdoor-games",
                "level": 4,
                "sortOrder": 15
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-building-construction-toys",
            "name": "Building & Construction Toys",
            "slug": "building-construction-toys",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 13,
            "children": [
              {
                "id": "cat-kids-toys-toys-building-construction-toys-building-toys",
                "name": "Building Toys",
                "slug": "building-toys",
                "parentId": "cat-kids-toys-toys-building-construction-toys",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-building-construction-toys-magnetic-building",
                "name": "Magnetic Building",
                "slug": "magnetic-building",
                "parentId": "cat-kids-toys-toys-building-construction-toys",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-building-construction-toys-block-toys",
                "name": "Block Toys",
                "slug": "block-toys",
                "parentId": "cat-kids-toys-toys-building-construction-toys",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-building-construction-toys-building-sets",
                "name": "Building sets",
                "slug": "building-sets",
                "parentId": "cat-kids-toys-toys-building-construction-toys",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-toy-vehicles",
            "name": "Toy Vehicles",
            "slug": "toy-vehicles",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 14,
            "children": [
              {
                "id": "cat-kids-toys-toys-toy-vehicles-die-cast-toy-vehicles",
                "name": "Die-Cast & Toy Vehicles",
                "slug": "die-cast-toy-vehicles",
                "parentId": "cat-kids-toys-toys-toy-vehicles",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-toy-vehicles-motor-vehicles",
                "name": "Motor vehicles",
                "slug": "motor-vehicles",
                "parentId": "cat-kids-toys-toys-toy-vehicles",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-toy-vehicles-free-wheel-toys",
                "name": "Free Wheel Toys",
                "slug": "free-wheel-toys",
                "parentId": "cat-kids-toys-toys-toy-vehicles",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-action-toy-figures",
            "name": "Action & Toy Figures",
            "slug": "action-toy-figures",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 15,
            "children": [
              {
                "id": "cat-kids-toys-toys-action-toy-figures-toy-figures",
                "name": "Toy Figures",
                "slug": "toy-figures",
                "parentId": "cat-kids-toys-toys-action-toy-figures",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-action-toy-figures-bendables",
                "name": "Bendables",
                "slug": "bendables",
                "parentId": "cat-kids-toys-toys-action-toy-figures",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-action-toy-figures-statues-maquettes-busts",
                "name": "Statues, Maquettes & Busts",
                "slug": "statues-maquettes-busts",
                "parentId": "cat-kids-toys-toys-action-toy-figures",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-action-toy-figures-buildings-scenery",
                "name": "Buildings & Scenery",
                "slug": "buildings-scenery",
                "parentId": "cat-kids-toys-toys-action-toy-figures",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-toys-action-toy-figures-props-replicas",
                "name": "Props & Replicas",
                "slug": "props-replicas",
                "parentId": "cat-kids-toys-toys-action-toy-figures",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-toys-action-toy-figures-battle-toys",
                "name": "Battle toys",
                "slug": "battle-toys",
                "parentId": "cat-kids-toys-toys-action-toy-figures",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-toys-action-toy-figures-bobbleheads",
                "name": "Bobbleheads",
                "slug": "bobbleheads",
                "parentId": "cat-kids-toys-toys-action-toy-figures",
                "level": 4,
                "sortOrder": 7
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-gun-toys",
            "name": "Gun Toys",
            "slug": "gun-toys",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 16,
            "children": [
              {
                "id": "cat-kids-toys-toys-gun-toys-gun-toys",
                "name": "Gun Toys",
                "slug": "gun-toys",
                "parentId": "cat-kids-toys-toys-gun-toys",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-gun-toys-dart-guns",
                "name": "Dart Guns",
                "slug": "dart-guns",
                "parentId": "cat-kids-toys-toys-gun-toys",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-bikes-trikes-ride-ons",
            "name": "Bikes, Trikes & Ride-Ons",
            "slug": "bikes-trikes-ride-ons",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 17,
            "children": [
              {
                "id": "cat-kids-toys-toys-bikes-trikes-ride-ons-baby-stroller",
                "name": "Baby Stroller",
                "slug": "baby-stroller",
                "parentId": "cat-kids-toys-toys-bikes-trikes-ride-ons",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-bikes-trikes-ride-ons-pedal-vehicles",
                "name": "Pedal Vehicles",
                "slug": "pedal-vehicles",
                "parentId": "cat-kids-toys-toys-bikes-trikes-ride-ons",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-bikes-trikes-ride-ons-rollerskates",
                "name": "Rollerskates",
                "slug": "rollerskates",
                "parentId": "cat-kids-toys-toys-bikes-trikes-ride-ons",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-bikes-trikes-ride-ons-trikes",
                "name": "Trikes",
                "slug": "trikes",
                "parentId": "cat-kids-toys-toys-bikes-trikes-ride-ons",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-toys-bikes-trikes-ride-ons-electrical-vehicles",
                "name": "Electrical Vehicles",
                "slug": "electrical-vehicles",
                "parentId": "cat-kids-toys-toys-bikes-trikes-ride-ons",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-toys-bikes-trikes-ride-ons-scooters",
                "name": "Scooters",
                "slug": "scooters",
                "parentId": "cat-kids-toys-toys-bikes-trikes-ride-ons",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-toys-bikes-trikes-ride-ons-pull-along-wagons",
                "name": "Pull-Along Wagons",
                "slug": "pull-along-wagons",
                "parentId": "cat-kids-toys-toys-bikes-trikes-ride-ons",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-kids-toys-toys-bikes-trikes-ride-ons-skateboards",
                "name": "Skateboards",
                "slug": "skateboards",
                "parentId": "cat-kids-toys-toys-bikes-trikes-ride-ons",
                "level": 4,
                "sortOrder": 8
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-model-building-kits",
            "name": "Model Building Kits",
            "slug": "model-building-kits",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 18,
            "children": [
              {
                "id": "cat-kids-toys-toys-model-building-kits-cars-vehicles",
                "name": "Cars & Vehicles",
                "slug": "cars-vehicles",
                "parentId": "cat-kids-toys-toys-model-building-kits",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-model-building-kits-motorcycles",
                "name": "Motorcycles",
                "slug": "motorcycles",
                "parentId": "cat-kids-toys-toys-model-building-kits",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-model-building-kits-robots",
                "name": "Robots",
                "slug": "robots",
                "parentId": "cat-kids-toys-toys-model-building-kits",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-model-building-kits-boats-watercraft",
                "name": "Boats & Watercraft",
                "slug": "boats-watercraft",
                "parentId": "cat-kids-toys-toys-model-building-kits",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-toys-model-building-kits-aircraft",
                "name": "Aircraft",
                "slug": "aircraft",
                "parentId": "cat-kids-toys-toys-model-building-kits",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-toys-model-building-kits-model-trains-accessories",
                "name": "Model Trains & Accessories",
                "slug": "model-trains-accessories",
                "parentId": "cat-kids-toys-toys-model-building-kits",
                "level": 4,
                "sortOrder": 6
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-cosmetics-jewellery",
            "name": "Cosmetics & Jewellery",
            "slug": "cosmetics-jewellery",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 19,
            "children": [
              {
                "id": "cat-kids-toys-toys-cosmetics-jewellery-earrings",
                "name": "Earrings",
                "slug": "earrings",
                "parentId": "cat-kids-toys-toys-cosmetics-jewellery",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-cosmetics-jewellery-makeup-bags-cases",
                "name": "Makeup Bags & Cases",
                "slug": "makeup-bags-cases",
                "parentId": "cat-kids-toys-toys-cosmetics-jewellery",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-cosmetics-jewellery-necklaces",
                "name": "Necklaces",
                "slug": "necklaces",
                "parentId": "cat-kids-toys-toys-cosmetics-jewellery",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-cosmetics-jewellery-makeup-hair-dressing-heads",
                "name": "Makeup & Hair Dressing Heads",
                "slug": "makeup-hair-dressing-heads",
                "parentId": "cat-kids-toys-toys-cosmetics-jewellery",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-coin-stamp-collecting",
            "name": "Coin & Stamp Collecting",
            "slug": "coin-stamp-collecting",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 20,
            "children": [
              {
                "id": "cat-kids-toys-toys-coin-stamp-collecting-coin-stamp-collecting",
                "name": "Coin & Stamp Collecting",
                "slug": "coin-stamp-collecting",
                "parentId": "cat-kids-toys-toys-coin-stamp-collecting",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-musical-toy-instruments",
            "name": "Musical Toy Instruments",
            "slug": "musical-toy-instruments",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 21,
            "children": [
              {
                "id": "cat-kids-toys-toys-musical-toy-instruments-accessories",
                "name": "Accessories",
                "slug": "accessories",
                "parentId": "cat-kids-toys-toys-musical-toy-instruments",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-musical-toy-instruments-wind-brass",
                "name": "Wind & Brass",
                "slug": "wind-brass",
                "parentId": "cat-kids-toys-toys-musical-toy-instruments",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-musical-toy-instruments-mouth-organ-harmonica",
                "name": "Mouth Organ / Harmonica",
                "slug": "mouth-organ-harmonica",
                "parentId": "cat-kids-toys-toys-musical-toy-instruments",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-musical-toy-instruments-xylophones",
                "name": "Xylophones",
                "slug": "xylophones",
                "parentId": "cat-kids-toys-toys-musical-toy-instruments",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-toys-musical-toy-instruments-pianos-keyboards",
                "name": "Pianos & Keyboards",
                "slug": "pianos-keyboards",
                "parentId": "cat-kids-toys-toys-musical-toy-instruments",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-toys-musical-toy-instruments-tambourine",
                "name": "Tambourine",
                "slug": "tambourine",
                "parentId": "cat-kids-toys-toys-musical-toy-instruments",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-toys-musical-toy-instruments-drums-percussion",
                "name": "Drums & Percussion",
                "slug": "drums-percussion",
                "parentId": "cat-kids-toys-toys-musical-toy-instruments",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-kids-toys-toys-musical-toy-instruments-guitars-strings",
                "name": "Guitars & Strings",
                "slug": "guitars-strings",
                "parentId": "cat-kids-toys-toys-musical-toy-instruments",
                "level": 4,
                "sortOrder": 8
              },
              {
                "id": "cat-kids-toys-toys-musical-toy-instruments-flute-whistles",
                "name": "Flute & Whistles",
                "slug": "flute-whistles",
                "parentId": "cat-kids-toys-toys-musical-toy-instruments",
                "level": 4,
                "sortOrder": 9
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-learning-educational-toys",
            "name": "Learning & Educational Toys",
            "slug": "learning-educational-toys",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 22,
            "children": [
              {
                "id": "cat-kids-toys-toys-learning-educational-toys-toy-camera",
                "name": "Toy Camera",
                "slug": "toy-camera",
                "parentId": "cat-kids-toys-toys-learning-educational-toys",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-learning-educational-toys-intellikit",
                "name": "Intellikit",
                "slug": "intellikit",
                "parentId": "cat-kids-toys-toys-learning-educational-toys",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-learning-educational-toys-augmented-reality",
                "name": "Augmented Reality",
                "slug": "augmented-reality",
                "parentId": "cat-kids-toys-toys-learning-educational-toys",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-toys-learning-educational-toys-kaleidoscope-projectors",
                "name": "Kaleidoscope & Projectors",
                "slug": "kaleidoscope-projectors",
                "parentId": "cat-kids-toys-toys-learning-educational-toys",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-dressing-up-costumes",
            "name": "Dressing Up & Costumes",
            "slug": "dressing-up-costumes",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 23,
            "children": [
              {
                "id": "cat-kids-toys-toys-dressing-up-costumes-face-paints",
                "name": "Face Paints",
                "slug": "face-paints",
                "parentId": "cat-kids-toys-toys-dressing-up-costumes",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-die-cast-toy-vehicles",
            "name": "Die-Cast & Toy Vehicles",
            "slug": "die-cast-toy-vehicles",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 24,
            "children": [
              {
                "id": "cat-kids-toys-toys-die-cast-toy-vehicles-finger-toys",
                "name": "Finger Toys",
                "slug": "finger-toys",
                "parentId": "cat-kids-toys-toys-die-cast-toy-vehicles",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-toys-die-cast-toy-vehicles-aircraft",
                "name": "Aircraft",
                "slug": "aircraft",
                "parentId": "cat-kids-toys-toys-die-cast-toy-vehicles",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-toys-die-cast-toy-vehicles-slot-cars-race-tracks-accessories",
                "name": "Slot Cars, Race Tracks & Accessories",
                "slug": "slot-cars-race-tracks-accessories",
                "parentId": "cat-kids-toys-toys-die-cast-toy-vehicles",
                "level": 4,
                "sortOrder": 3
              }
            ]
          },
          {
            "id": "cat-kids-toys-toys-dolls-accessories",
            "name": "Dolls & Accessories",
            "slug": "dolls-accessories",
            "parentId": "cat-kids-toys-toys",
            "level": 3,
            "sortOrder": 25,
            "children": [
              {
                "id": "cat-kids-toys-toys-dolls-accessories-paper-magnetic-dolls",
                "name": "Paper & Magnetic Dolls",
                "slug": "paper-magnetic-dolls",
                "parentId": "cat-kids-toys-toys-dolls-accessories",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-kids-toys-footwear",
        "name": "Footwear",
        "slug": "footwear",
        "parentId": "cat-kids-toys",
        "level": 2,
        "sortOrder": 4,
        "children": [
          {
            "id": "cat-kids-toys-footwear-girls",
            "name": "Girls",
            "slug": "girls",
            "parentId": "cat-kids-toys-footwear",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-kids-toys-footwear-girls-casual-shoes",
                "name": "Casual Shoes",
                "slug": "casual-shoes",
                "parentId": "cat-kids-toys-footwear-girls",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-footwear-girls-flip-flops",
                "name": "Flip Flops",
                "slug": "flip-flops",
                "parentId": "cat-kids-toys-footwear-girls",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-footwear-girls-sandals",
                "name": "Sandals",
                "slug": "sandals",
                "parentId": "cat-kids-toys-footwear-girls",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-footwear-girls-sports-shoes",
                "name": "Sports Shoes",
                "slug": "sports-shoes",
                "parentId": "cat-kids-toys-footwear-girls",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-footwear-girls-heels",
                "name": "Heels",
                "slug": "heels",
                "parentId": "cat-kids-toys-footwear-girls",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-footwear-girls-boots",
                "name": "Boots",
                "slug": "boots",
                "parentId": "cat-kids-toys-footwear-girls",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-footwear-girls-school-shoes",
                "name": "School Shoes",
                "slug": "school-shoes",
                "parentId": "cat-kids-toys-footwear-girls",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-kids-toys-footwear-girls-sneakers",
                "name": "Sneakers",
                "slug": "sneakers",
                "parentId": "cat-kids-toys-footwear-girls",
                "level": 4,
                "sortOrder": 8
              },
              {
                "id": "cat-kids-toys-footwear-girls-juttis-mojaris",
                "name": "Juttis & Mojaris",
                "slug": "juttis-mojaris",
                "parentId": "cat-kids-toys-footwear-girls",
                "level": 4,
                "sortOrder": 9
              },
              {
                "id": "cat-kids-toys-footwear-girls-clogs",
                "name": "Clogs",
                "slug": "clogs",
                "parentId": "cat-kids-toys-footwear-girls",
                "level": 4,
                "sortOrder": 10
              }
            ]
          },
          {
            "id": "cat-kids-toys-footwear-boys",
            "name": "Boys",
            "slug": "boys",
            "parentId": "cat-kids-toys-footwear",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-kids-toys-footwear-boys-casual-shoes",
                "name": "Casual Shoes",
                "slug": "casual-shoes",
                "parentId": "cat-kids-toys-footwear-boys",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-footwear-boys-flip-flops",
                "name": "Flip Flops",
                "slug": "flip-flops",
                "parentId": "cat-kids-toys-footwear-boys",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-footwear-boys-sandals",
                "name": "Sandals",
                "slug": "sandals",
                "parentId": "cat-kids-toys-footwear-boys",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-footwear-boys-sports-shoes",
                "name": "Sports Shoes",
                "slug": "sports-shoes",
                "parentId": "cat-kids-toys-footwear-boys",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-footwear-boys-heels",
                "name": "Heels",
                "slug": "heels",
                "parentId": "cat-kids-toys-footwear-boys",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-footwear-boys-boots",
                "name": "Boots",
                "slug": "boots",
                "parentId": "cat-kids-toys-footwear-boys",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-footwear-boys-school-shoes",
                "name": "School Shoes",
                "slug": "school-shoes",
                "parentId": "cat-kids-toys-footwear-boys",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-kids-toys-footwear-boys-sneakers",
                "name": "Sneakers",
                "slug": "sneakers",
                "parentId": "cat-kids-toys-footwear-boys",
                "level": 4,
                "sortOrder": 8
              },
              {
                "id": "cat-kids-toys-footwear-boys-juttis-mojaris",
                "name": "Juttis & Mojaris",
                "slug": "juttis-mojaris",
                "parentId": "cat-kids-toys-footwear-boys",
                "level": 4,
                "sortOrder": 9
              },
              {
                "id": "cat-kids-toys-footwear-boys-clogs",
                "name": "Clogs",
                "slug": "clogs",
                "parentId": "cat-kids-toys-footwear-boys",
                "level": 4,
                "sortOrder": 10
              }
            ]
          }
        ]
      },
      {
        "id": "cat-kids-toys-kids---boys-western-wear",
        "name": "Kids - Boys Western Wear",
        "slug": "kids---boys-western-wear",
        "parentId": "cat-kids-toys",
        "level": 2,
        "sortOrder": 5,
        "children": [
          {
            "id": "cat-kids-toys-kids---boys-western-wear-infants",
            "name": "Infants",
            "slug": "infants",
            "parentId": "cat-kids-toys-kids---boys-western-wear",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-kids-toys-kids---boys-western-wear-infants-bodysuit",
                "name": "Bodysuit",
                "slug": "bodysuit",
                "parentId": "cat-kids-toys-kids---boys-western-wear-infants",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids---boys-western-wear-infants-onesies-rompers",
                "name": "Onesies & Rompers",
                "slug": "onesies-rompers",
                "parentId": "cat-kids-toys-kids---boys-western-wear-infants",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-kids---boys-western-wear-infants-swimwear",
                "name": "Swimwear",
                "slug": "swimwear",
                "parentId": "cat-kids-toys-kids---boys-western-wear-infants",
                "level": 4,
                "sortOrder": 3
              }
            ]
          }
        ]
      },
      {
        "id": "cat-kids-toys-kids---girls-western-wear",
        "name": "Kids - Girls Western Wear",
        "slug": "kids---girls-western-wear",
        "parentId": "cat-kids-toys",
        "level": 2,
        "sortOrder": 6,
        "children": [
          {
            "id": "cat-kids-toys-kids---girls-western-wear-western-wear",
            "name": "Western Wear",
            "slug": "western-wear",
            "parentId": "cat-kids-toys-kids---girls-western-wear",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-kids-toys-kids---girls-western-wear-western-wear-swimwear",
                "name": "Swimwear",
                "slug": "swimwear",
                "parentId": "cat-kids-toys-kids---girls-western-wear-western-wear",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-kids-toys-kids-clothing",
        "name": "Kids Clothing",
        "slug": "kids-clothing",
        "parentId": "cat-kids-toys",
        "level": 2,
        "sortOrder": 7,
        "children": [
          {
            "id": "cat-kids-toys-kids-clothing-boys-winterwear",
            "name": "Boys Winterwear",
            "slug": "boys-winterwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-winterwear-jackets-coats",
                "name": "Jackets & Coats",
                "slug": "jackets-coats",
                "parentId": "cat-kids-toys-kids-clothing-boys-winterwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-winterwear-sweaters",
                "name": "Sweaters",
                "slug": "sweaters",
                "parentId": "cat-kids-toys-kids-clothing-boys-winterwear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-winterwear-sweatshirts-hoodies",
                "name": "Sweatshirts & Hoodies",
                "slug": "sweatshirts-hoodies",
                "parentId": "cat-kids-toys-kids-clothing-boys-winterwear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-winterwear-thermals",
                "name": "Thermals",
                "slug": "thermals",
                "parentId": "cat-kids-toys-kids-clothing-boys-winterwear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-winterwear-earmuffs",
                "name": "Earmuffs",
                "slug": "earmuffs",
                "parentId": "cat-kids-toys-kids-clothing-boys-winterwear",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-winterwear-boys-scarves",
                "name": "Boys Scarves",
                "slug": "boys-scarves",
                "parentId": "cat-kids-toys-kids-clothing-boys-winterwear",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-winterwear-gloves",
                "name": "Gloves",
                "slug": "gloves",
                "parentId": "cat-kids-toys-kids-clothing-boys-winterwear",
                "level": 4,
                "sortOrder": 7
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-boys-ethnicwear",
            "name": "Boys Ethnicwear",
            "slug": "boys-ethnicwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 2,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-ethnicwear-ethnic-jackets",
                "name": "Ethnic Jackets",
                "slug": "ethnic-jackets",
                "parentId": "cat-kids-toys-kids-clothing-boys-ethnicwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-ethnicwear-sherwanis",
                "name": "Sherwanis",
                "slug": "sherwanis",
                "parentId": "cat-kids-toys-kids-clothing-boys-ethnicwear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-ethnicwear-kurta-sets",
                "name": "Kurta Sets",
                "slug": "kurta-sets",
                "parentId": "cat-kids-toys-kids-clothing-boys-ethnicwear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-ethnicwear-ethnic-pyjamas-dhoti-pants",
                "name": "Ethnic Pyjamas & Dhoti Pants",
                "slug": "ethnic-pyjamas-dhoti-pants",
                "parentId": "cat-kids-toys-kids-clothing-boys-ethnicwear",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-boys-topwear",
            "name": "Boys Topwear",
            "slug": "boys-topwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 3,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-topwear-shirts",
                "name": "Shirts",
                "slug": "shirts",
                "parentId": "cat-kids-toys-kids-clothing-boys-topwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-topwear-tshirts-polos",
                "name": "Tshirts & Polos",
                "slug": "tshirts-polos",
                "parentId": "cat-kids-toys-kids-clothing-boys-topwear",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-boys-bottomwear",
            "name": "Boys Bottomwear",
            "slug": "boys-bottomwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 4,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-bottomwear-jeans",
                "name": "Jeans",
                "slug": "jeans",
                "parentId": "cat-kids-toys-kids-clothing-boys-bottomwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-bottomwear-pants",
                "name": "Pants",
                "slug": "pants",
                "parentId": "cat-kids-toys-kids-clothing-boys-bottomwear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-bottomwear-shorts-capris",
                "name": "Shorts & Capris",
                "slug": "shorts-capris",
                "parentId": "cat-kids-toys-kids-clothing-boys-bottomwear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-bottomwear-trackpants-joggers",
                "name": "Trackpants & Joggers",
                "slug": "trackpants-joggers",
                "parentId": "cat-kids-toys-kids-clothing-boys-bottomwear",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-boys-dungarees",
            "name": "Boys Dungarees",
            "slug": "boys-dungarees",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 5,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-dungarees-dungarees",
                "name": "Dungarees",
                "slug": "dungarees",
                "parentId": "cat-kids-toys-kids-clothing-boys-dungarees",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-boys-clothing-sets",
            "name": "Boys Clothing Sets",
            "slug": "boys-clothing-sets",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 6,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-clothing-sets-clothing-set",
                "name": "Clothing Set",
                "slug": "clothing-set",
                "parentId": "cat-kids-toys-kids-clothing-boys-clothing-sets",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-boys-sleepwear",
            "name": "Boys Sleepwear",
            "slug": "boys-sleepwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 7,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-sleepwear-nightsuits",
                "name": "Nightsuits",
                "slug": "nightsuits",
                "parentId": "cat-kids-toys-kids-clothing-boys-sleepwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-sleepwear-pajamas",
                "name": "Pajamas",
                "slug": "pajamas",
                "parentId": "cat-kids-toys-kids-clothing-boys-sleepwear",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-boys-suits",
            "name": "Boys Suits",
            "slug": "boys-suits",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 8,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-suits-boys-suits",
                "name": "Boys Suits",
                "slug": "boys-suits",
                "parentId": "cat-kids-toys-kids-clothing-boys-suits",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-boys-innerwear",
            "name": "Boys Innerwear",
            "slug": "boys-innerwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 9,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-innerwear-innerwear",
                "name": "Innerwear",
                "slug": "innerwear",
                "parentId": "cat-kids-toys-kids-clothing-boys-innerwear",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-boys-unstiched-fabrics",
            "name": "Boys Unstiched Fabrics",
            "slug": "boys-unstiched-fabrics",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 10,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-unstiched-fabrics-unstitched-fabric",
                "name": "Unstitched Fabric",
                "slug": "unstitched-fabric",
                "parentId": "cat-kids-toys-kids-clothing-boys-unstiched-fabrics",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-boys-oneseis-rompers",
            "name": "Boys Oneseis & Rompers",
            "slug": "boys-oneseis-rompers",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 11,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-oneseis-rompers-oneseis-rompers",
                "name": "Oneseis & Rompers",
                "slug": "oneseis-rompers",
                "parentId": "cat-kids-toys-kids-clothing-boys-oneseis-rompers",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-boys-swimwear",
            "name": "Boys Swimwear",
            "slug": "boys-swimwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 12,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-swimwear-swimwear",
                "name": "Swimwear",
                "slug": "swimwear",
                "parentId": "cat-kids-toys-kids-clothing-boys-swimwear",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-dresses-frocks",
            "name": "Dresses & Frocks",
            "slug": "dresses-frocks",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 13,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-dresses-frocks-frocks-dresses",
                "name": "Frocks & Dresses",
                "slug": "frocks-dresses",
                "parentId": "cat-kids-toys-kids-clothing-dresses-frocks",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-jumpsuits",
            "name": "Jumpsuits",
            "slug": "jumpsuits",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 14,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-jumpsuits-jumpsuits",
                "name": "Jumpsuits",
                "slug": "jumpsuits",
                "parentId": "cat-kids-toys-kids-clothing-jumpsuits",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-girls-winterwear",
            "name": "Girls Winterwear",
            "slug": "girls-winterwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 15,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-girls-winterwear-jackets-coats",
                "name": "Jackets & Coats",
                "slug": "jackets-coats",
                "parentId": "cat-kids-toys-kids-clothing-girls-winterwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-winterwear-sweaters",
                "name": "Sweaters",
                "slug": "sweaters",
                "parentId": "cat-kids-toys-kids-clothing-girls-winterwear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-winterwear-sweatshirts-hoodies",
                "name": "Sweatshirts & Hoodies",
                "slug": "sweatshirts-hoodies",
                "parentId": "cat-kids-toys-kids-clothing-girls-winterwear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-winterwear-thermals",
                "name": "Thermals",
                "slug": "thermals",
                "parentId": "cat-kids-toys-kids-clothing-girls-winterwear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-winterwear-girls-scarves-wraps",
                "name": "Girls Scarves & Wraps",
                "slug": "girls-scarves-wraps",
                "parentId": "cat-kids-toys-kids-clothing-girls-winterwear",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-winterwear-gloves",
                "name": "Gloves",
                "slug": "gloves",
                "parentId": "cat-kids-toys-kids-clothing-girls-winterwear",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-winterwear-earmuffs",
                "name": "Earmuffs",
                "slug": "earmuffs",
                "parentId": "cat-kids-toys-kids-clothing-girls-winterwear",
                "level": 4,
                "sortOrder": 7
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-girls-topwear",
            "name": "Girls Topwear",
            "slug": "girls-topwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 16,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-girls-topwear-tshirts",
                "name": "Tshirts",
                "slug": "tshirts",
                "parentId": "cat-kids-toys-kids-clothing-girls-topwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-topwear-tops-tunics",
                "name": "Tops & Tunics",
                "slug": "tops-tunics",
                "parentId": "cat-kids-toys-kids-clothing-girls-topwear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-topwear-shirts",
                "name": "Shirts",
                "slug": "shirts",
                "parentId": "cat-kids-toys-kids-clothing-girls-topwear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-topwear-shrugs",
                "name": "Shrugs",
                "slug": "shrugs",
                "parentId": "cat-kids-toys-kids-clothing-girls-topwear",
                "level": 4,
                "sortOrder": 4
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-girls-bottomwear",
            "name": "Girls Bottomwear",
            "slug": "girls-bottomwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 17,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-girls-bottomwear-jeans-jeggings",
                "name": "Jeans & Jeggings",
                "slug": "jeans-jeggings",
                "parentId": "cat-kids-toys-kids-clothing-girls-bottomwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-bottomwear-leggings-tights",
                "name": "Leggings & Tights",
                "slug": "leggings-tights",
                "parentId": "cat-kids-toys-kids-clothing-girls-bottomwear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-bottomwear-pants",
                "name": "Pants",
                "slug": "pants",
                "parentId": "cat-kids-toys-kids-clothing-girls-bottomwear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-bottomwear-shorts-capris",
                "name": "Shorts & Capris",
                "slug": "shorts-capris",
                "parentId": "cat-kids-toys-kids-clothing-girls-bottomwear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-bottomwear-skirts",
                "name": "Skirts",
                "slug": "skirts",
                "parentId": "cat-kids-toys-kids-clothing-girls-bottomwear",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-bottomwear-trackpants-joggers",
                "name": "Trackpants & Joggers",
                "slug": "trackpants-joggers",
                "parentId": "cat-kids-toys-kids-clothing-girls-bottomwear",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-bottomwear-ethnic-bottoms",
                "name": "Ethnic Bottoms",
                "slug": "ethnic-bottoms",
                "parentId": "cat-kids-toys-kids-clothing-girls-bottomwear",
                "level": 4,
                "sortOrder": 7
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-girls-ethnicwear",
            "name": "Girls Ethnicwear",
            "slug": "girls-ethnicwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 18,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-girls-ethnicwear-kurtis-kurtas",
                "name": "Kurtis & Kurtas",
                "slug": "kurtis-kurtas",
                "parentId": "cat-kids-toys-kids-clothing-girls-ethnicwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-ethnicwear-kurta-sets",
                "name": "Kurta Sets",
                "slug": "kurta-sets",
                "parentId": "cat-kids-toys-kids-clothing-girls-ethnicwear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-ethnicwear-lehenga-cholis",
                "name": "Lehenga Cholis",
                "slug": "lehenga-cholis",
                "parentId": "cat-kids-toys-kids-clothing-girls-ethnicwear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-ethnicwear-ethnic-gowns",
                "name": "Ethnic Gowns",
                "slug": "ethnic-gowns",
                "parentId": "cat-kids-toys-kids-clothing-girls-ethnicwear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-ethnicwear-sarees",
                "name": "Sarees",
                "slug": "sarees",
                "parentId": "cat-kids-toys-kids-clothing-girls-ethnicwear",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-ethnicwear-dupattas",
                "name": "Dupattas",
                "slug": "dupattas",
                "parentId": "cat-kids-toys-kids-clothing-girls-ethnicwear",
                "level": 4,
                "sortOrder": 6
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-girls-clothing-sets",
            "name": "Girls Clothing Sets",
            "slug": "girls-clothing-sets",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 19,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-girls-clothing-sets-clothing-set",
                "name": "Clothing Set",
                "slug": "clothing-set",
                "parentId": "cat-kids-toys-kids-clothing-girls-clothing-sets",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-girls-sleepwear",
            "name": "Girls Sleepwear",
            "slug": "girls-sleepwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 20,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-girls-sleepwear-nightsuits",
                "name": "Nightsuits",
                "slug": "nightsuits",
                "parentId": "cat-kids-toys-kids-clothing-girls-sleepwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-sleepwear-pyjamas",
                "name": "Pyjamas",
                "slug": "pyjamas",
                "parentId": "cat-kids-toys-kids-clothing-girls-sleepwear",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-girls-innerwear",
            "name": "Girls Innerwear",
            "slug": "girls-innerwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 21,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-girls-innerwear-innerwear",
                "name": "Innerwear",
                "slug": "innerwear",
                "parentId": "cat-kids-toys-kids-clothing-girls-innerwear",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-girls-oneseis-rompers",
            "name": "Girls Oneseis & Rompers",
            "slug": "girls-oneseis-rompers",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 22,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-girls-oneseis-rompers-oneseis-rompers",
                "name": "Oneseis & Rompers",
                "slug": "oneseis-rompers",
                "parentId": "cat-kids-toys-kids-clothing-girls-oneseis-rompers",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-girls-dungarees",
            "name": "Girls Dungarees",
            "slug": "girls-dungarees",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 23,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-girls-dungarees-dungarees",
                "name": "Dungarees",
                "slug": "dungarees",
                "parentId": "cat-kids-toys-kids-clothing-girls-dungarees",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-girls-swimwear",
            "name": "Girls Swimwear",
            "slug": "girls-swimwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 24,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-girls-swimwear-swimwear",
                "name": "Swimwear",
                "slug": "swimwear",
                "parentId": "cat-kids-toys-kids-clothing-girls-swimwear",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-girls-sportswear",
            "name": "Girls Sportswear",
            "slug": "girls-sportswear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 25,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-girls-sportswear-active-innerwear",
                "name": "Active Innerwear",
                "slug": "active-innerwear",
                "parentId": "cat-kids-toys-kids-clothing-girls-sportswear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-sportswear-active-shorts",
                "name": "Active Shorts",
                "slug": "active-shorts",
                "parentId": "cat-kids-toys-kids-clothing-girls-sportswear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-sportswear-active-undershorts",
                "name": "Active Undershorts",
                "slug": "active-undershorts",
                "parentId": "cat-kids-toys-kids-clothing-girls-sportswear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-sportswear-active-tshirts",
                "name": "Active Tshirts",
                "slug": "active-tshirts",
                "parentId": "cat-kids-toys-kids-clothing-girls-sportswear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-sportswear-active-clothing-set",
                "name": "Active Clothing set",
                "slug": "active-clothing-set",
                "parentId": "cat-kids-toys-kids-clothing-girls-sportswear",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-sportswear-active-skirts-skorts",
                "name": "Active Skirts & Skorts",
                "slug": "active-skirts-skorts",
                "parentId": "cat-kids-toys-kids-clothing-girls-sportswear",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-sportswear-unitards",
                "name": "Unitards",
                "slug": "unitards",
                "parentId": "cat-kids-toys-kids-clothing-girls-sportswear",
                "level": 4,
                "sortOrder": 7
              },
              {
                "id": "cat-kids-toys-kids-clothing-girls-sportswear-track-suits",
                "name": "Track suits",
                "slug": "track-suits",
                "parentId": "cat-kids-toys-kids-clothing-girls-sportswear",
                "level": 4,
                "sortOrder": 8
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-boys-sportswear",
            "name": "Boys Sportswear",
            "slug": "boys-sportswear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 26,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-boys-sportswear-active-shorts",
                "name": "Active Shorts",
                "slug": "active-shorts",
                "parentId": "cat-kids-toys-kids-clothing-boys-sportswear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-sportswear-active-undershorts",
                "name": "Active Undershorts",
                "slug": "active-undershorts",
                "parentId": "cat-kids-toys-kids-clothing-boys-sportswear",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-sportswear-active-tshirts",
                "name": "Active Tshirts",
                "slug": "active-tshirts",
                "parentId": "cat-kids-toys-kids-clothing-boys-sportswear",
                "level": 4,
                "sortOrder": 3
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-sportswear-active-innerwear",
                "name": "Active Innerwear",
                "slug": "active-innerwear",
                "parentId": "cat-kids-toys-kids-clothing-boys-sportswear",
                "level": 4,
                "sortOrder": 4
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-sportswear-unitards",
                "name": "Unitards",
                "slug": "unitards",
                "parentId": "cat-kids-toys-kids-clothing-boys-sportswear",
                "level": 4,
                "sortOrder": 5
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-sportswear-track-suits",
                "name": "Track suits",
                "slug": "track-suits",
                "parentId": "cat-kids-toys-kids-clothing-boys-sportswear",
                "level": 4,
                "sortOrder": 6
              },
              {
                "id": "cat-kids-toys-kids-clothing-boys-sportswear-active-clothing-set",
                "name": "Active Clothing set",
                "slug": "active-clothing-set",
                "parentId": "cat-kids-toys-kids-clothing-boys-sportswear",
                "level": 4,
                "sortOrder": 7
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-muslimwear",
            "name": "Muslimwear",
            "slug": "muslimwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 27,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-muslimwear-girls-muslimwear",
                "name": "Girls Muslimwear",
                "slug": "girls-muslimwear",
                "parentId": "cat-kids-toys-kids-clothing-muslimwear",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-kids-clothing-muslimwear-boys-muslimwear",
                "name": "Boys Muslimwear",
                "slug": "boys-muslimwear",
                "parentId": "cat-kids-toys-kids-clothing-muslimwear",
                "level": 4,
                "sortOrder": 2
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-kids-rainwear",
            "name": "Kids Rainwear",
            "slug": "kids-rainwear",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 28,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-kids-rainwear-rainwear",
                "name": "Rainwear",
                "slug": "rainwear",
                "parentId": "cat-kids-toys-kids-clothing-kids-rainwear",
                "level": 4,
                "sortOrder": 1
              }
            ]
          },
          {
            "id": "cat-kids-toys-kids-clothing-girls-unstiched-fabrics",
            "name": "Girls Unstiched Fabrics",
            "slug": "girls-unstiched-fabrics",
            "parentId": "cat-kids-toys-kids-clothing",
            "level": 3,
            "sortOrder": 29,
            "children": [
              {
                "id": "cat-kids-toys-kids-clothing-girls-unstiched-fabrics-unstitched-fabric",
                "name": "Unstitched Fabric",
                "slug": "unstitched-fabric",
                "parentId": "cat-kids-toys-kids-clothing-girls-unstiched-fabrics",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      },
      {
        "id": "cat-kids-toys-party-supplies",
        "name": "Party Supplies",
        "slug": "party-supplies",
        "parentId": "cat-kids-toys",
        "level": 2,
        "sortOrder": 8,
        "children": [
          {
            "id": "cat-kids-toys-party-supplies-party-supplies",
            "name": "Party Supplies",
            "slug": "party-supplies",
            "parentId": "cat-kids-toys-party-supplies",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-kids-toys-party-supplies-party-supplies-party-items",
                "name": "Party Items",
                "slug": "party-items",
                "parentId": "cat-kids-toys-party-supplies-party-supplies",
                "level": 4,
                "sortOrder": 1
              },
              {
                "id": "cat-kids-toys-party-supplies-party-supplies-party-tableware",
                "name": "Party Tableware",
                "slug": "party-tableware",
                "parentId": "cat-kids-toys-party-supplies-party-supplies",
                "level": 4,
                "sortOrder": 2
              },
              {
                "id": "cat-kids-toys-party-supplies-party-supplies-party-gift-bags",
                "name": "Party & Gift Bags",
                "slug": "party-gift-bags",
                "parentId": "cat-kids-toys-party-supplies-party-supplies",
                "level": 4,
                "sortOrder": 3
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-personal-care-wellness",
    "name": "Personal Care & Wellness",
    "slug": "personal-care-wellness",
    "level": 1,
    "sortOrder": 5,
    "children": [
      {
        "id": "cat-personal-care-wellness-personal-care-wellness",
        "name": "Personal Care & Wellness",
        "slug": "personal-care-wellness",
        "parentId": "cat-personal-care-wellness",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-personal-care-wellness-personal-care-wellness-personal-care-wellness",
            "name": "Personal Care & Wellness",
            "slug": "personal-care-wellness",
            "parentId": "cat-personal-care-wellness-personal-care-wellness",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-personal-care-wellness-personal-care-wellness-personal-care-wellness-personal-care-wellness",
                "name": "Personal Care & Wellness",
                "slug": "personal-care-wellness",
                "parentId": "cat-personal-care-wellness-personal-care-wellness-personal-care-wellness",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-mobiles-tablets",
    "name": "Mobiles & Tablets",
    "slug": "mobiles-tablets",
    "level": 1,
    "sortOrder": 6,
    "children": [
      {
        "id": "cat-mobiles-tablets-mobiles-tablets",
        "name": "Mobiles & Tablets",
        "slug": "mobiles-tablets",
        "parentId": "cat-mobiles-tablets",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-mobiles-tablets-mobiles-tablets-mobiles-tablets",
            "name": "Mobiles & Tablets",
            "slug": "mobiles-tablets",
            "parentId": "cat-mobiles-tablets-mobiles-tablets",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-mobiles-tablets-mobiles-tablets-mobiles-tablets-mobiles-tablets",
                "name": "Mobiles & Tablets",
                "slug": "mobiles-tablets",
                "parentId": "cat-mobiles-tablets-mobiles-tablets-mobiles-tablets",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-consumer-electronics",
    "name": "Consumer Electronics",
    "slug": "consumer-electronics",
    "level": 1,
    "sortOrder": 7,
    "children": [
      {
        "id": "cat-consumer-electronics-consumer-electronics",
        "name": "Consumer Electronics",
        "slug": "consumer-electronics",
        "parentId": "cat-consumer-electronics",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-consumer-electronics-consumer-electronics-consumer-electronics",
            "name": "Consumer Electronics",
            "slug": "consumer-electronics",
            "parentId": "cat-consumer-electronics-consumer-electronics",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-consumer-electronics-consumer-electronics-consumer-electronics-consumer-electronics",
                "name": "Consumer Electronics",
                "slug": "consumer-electronics",
                "parentId": "cat-consumer-electronics-consumer-electronics-consumer-electronics",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-appliances",
    "name": "Appliances",
    "slug": "appliances",
    "level": 1,
    "sortOrder": 8,
    "children": [
      {
        "id": "cat-appliances-appliances",
        "name": "Appliances",
        "slug": "appliances",
        "parentId": "cat-appliances",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-appliances-appliances-appliances",
            "name": "Appliances",
            "slug": "appliances",
            "parentId": "cat-appliances-appliances",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-appliances-appliances-appliances-appliances",
                "name": "Appliances",
                "slug": "appliances",
                "parentId": "cat-appliances-appliances-appliances",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-automotive",
    "name": "Automotive",
    "slug": "automotive",
    "level": 1,
    "sortOrder": 9,
    "children": [
      {
        "id": "cat-automotive-automotive",
        "name": "Automotive",
        "slug": "automotive",
        "parentId": "cat-automotive",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-automotive-automotive-automotive",
            "name": "Automotive",
            "slug": "automotive",
            "parentId": "cat-automotive-automotive",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-automotive-automotive-automotive-automotive",
                "name": "Automotive",
                "slug": "automotive",
                "parentId": "cat-automotive-automotive-automotive",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-beauty-personal-care",
    "name": "Beauty & Personal Care",
    "slug": "beauty-personal-care",
    "level": 1,
    "sortOrder": 10,
    "children": [
      {
        "id": "cat-beauty-personal-care-beauty-personal-care",
        "name": "Beauty & Personal Care",
        "slug": "beauty-personal-care",
        "parentId": "cat-beauty-personal-care",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-beauty-personal-care-beauty-personal-care-beauty-personal-care",
            "name": "Beauty & Personal Care",
            "slug": "beauty-personal-care",
            "parentId": "cat-beauty-personal-care-beauty-personal-care",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-beauty-personal-care-beauty-personal-care-beauty-personal-care-beauty-personal-care",
                "name": "Beauty & Personal Care",
                "slug": "beauty-personal-care",
                "parentId": "cat-beauty-personal-care-beauty-personal-care-beauty-personal-care",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-home-utility",
    "name": "Home Utility",
    "slug": "home-utility",
    "level": 1,
    "sortOrder": 11,
    "children": [
      {
        "id": "cat-home-utility-home-utility",
        "name": "Home Utility",
        "slug": "home-utility",
        "parentId": "cat-home-utility",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-home-utility-home-utility-home-utility",
            "name": "Home Utility",
            "slug": "home-utility",
            "parentId": "cat-home-utility-home-utility",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-utility-home-utility-home-utility-home-utility",
                "name": "Home Utility",
                "slug": "home-utility",
                "parentId": "cat-home-utility-home-utility-home-utility",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-kids",
    "name": "Kids",
    "slug": "kids",
    "level": 1,
    "sortOrder": 12,
    "children": [
      {
        "id": "cat-kids-kids",
        "name": "Kids",
        "slug": "kids",
        "parentId": "cat-kids",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-kids-kids-kids",
            "name": "Kids",
            "slug": "kids",
            "parentId": "cat-kids-kids",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-kids-kids-kids-kids",
                "name": "Kids",
                "slug": "kids",
                "parentId": "cat-kids-kids-kids",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-grocery",
    "name": "Grocery",
    "slug": "grocery",
    "level": 1,
    "sortOrder": 13,
    "children": [
      {
        "id": "cat-grocery-grocery",
        "name": "Grocery",
        "slug": "grocery",
        "parentId": "cat-grocery",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-grocery-grocery-grocery",
            "name": "Grocery",
            "slug": "grocery",
            "parentId": "cat-grocery-grocery",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-grocery-grocery-grocery-grocery",
                "name": "Grocery",
                "slug": "grocery",
                "parentId": "cat-grocery-grocery-grocery",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-women",
    "name": "Women",
    "slug": "women",
    "level": 1,
    "sortOrder": 14,
    "children": [
      {
        "id": "cat-women-women",
        "name": "Women",
        "slug": "women",
        "parentId": "cat-women",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-women-women-women",
            "name": "Women",
            "slug": "women",
            "parentId": "cat-women-women",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-women-women-women-women",
                "name": "Women",
                "slug": "women",
                "parentId": "cat-women-women-women",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-home-kitchen",
    "name": "Home & Kitchen",
    "slug": "home-kitchen",
    "level": 1,
    "sortOrder": 15,
    "children": [
      {
        "id": "cat-home-kitchen-home-kitchen",
        "name": "Home & Kitchen",
        "slug": "home-kitchen",
        "parentId": "cat-home-kitchen",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-home-kitchen-home-kitchen-home-kitchen",
            "name": "Home & Kitchen",
            "slug": "home-kitchen",
            "parentId": "cat-home-kitchen-home-kitchen",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-home-kitchen-home-kitchen-home-kitchen-home-kitchen",
                "name": "Home & Kitchen",
                "slug": "home-kitchen",
                "parentId": "cat-home-kitchen-home-kitchen-home-kitchen",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-health-wellness",
    "name": "Health & Wellness",
    "slug": "health-wellness",
    "level": 1,
    "sortOrder": 16,
    "children": [
      {
        "id": "cat-health-wellness-health-wellness",
        "name": "Health & Wellness",
        "slug": "health-wellness",
        "parentId": "cat-health-wellness",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-health-wellness-health-wellness-health-wellness",
            "name": "Health & Wellness",
            "slug": "health-wellness",
            "parentId": "cat-health-wellness-health-wellness",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-health-wellness-health-wellness-health-wellness-health-wellness",
                "name": "Health & Wellness",
                "slug": "health-wellness",
                "parentId": "cat-health-wellness-health-wellness-health-wellness",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-beauty-makeup",
    "name": "Beauty & Makeup",
    "slug": "beauty-makeup",
    "level": 1,
    "sortOrder": 17,
    "children": [
      {
        "id": "cat-beauty-makeup-beauty-makeup",
        "name": "Beauty & Makeup",
        "slug": "beauty-makeup",
        "parentId": "cat-beauty-makeup",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-beauty-makeup-beauty-makeup-beauty-makeup",
            "name": "Beauty & Makeup",
            "slug": "beauty-makeup",
            "parentId": "cat-beauty-makeup-beauty-makeup",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-beauty-makeup-beauty-makeup-beauty-makeup-beauty-makeup",
                "name": "Beauty & Makeup",
                "slug": "beauty-makeup",
                "parentId": "cat-beauty-makeup-beauty-makeup-beauty-makeup",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-personal-care",
    "name": "Personal Care",
    "slug": "personal-care",
    "level": 1,
    "sortOrder": 18,
    "children": [
      {
        "id": "cat-personal-care-personal-care",
        "name": "Personal Care",
        "slug": "personal-care",
        "parentId": "cat-personal-care",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-personal-care-personal-care-personal-care",
            "name": "Personal Care",
            "slug": "personal-care",
            "parentId": "cat-personal-care-personal-care",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-personal-care-personal-care-personal-care-personal-care",
                "name": "Personal Care",
                "slug": "personal-care",
                "parentId": "cat-personal-care-personal-care-personal-care",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-mens-grooming",
    "name": "Men'S Grooming",
    "slug": "mens-grooming",
    "level": 1,
    "sortOrder": 19,
    "children": [
      {
        "id": "cat-mens-grooming-mens-grooming",
        "name": "Men'S Grooming",
        "slug": "mens-grooming",
        "parentId": "cat-mens-grooming",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-mens-grooming-mens-grooming-mens-grooming",
            "name": "Men'S Grooming",
            "slug": "mens-grooming",
            "parentId": "cat-mens-grooming-mens-grooming",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-mens-grooming-mens-grooming-mens-grooming-mens-grooming",
                "name": "Men'S Grooming",
                "slug": "mens-grooming",
                "parentId": "cat-mens-grooming-mens-grooming-mens-grooming",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-craft-office-supplies",
    "name": "Craft & Office Supplies",
    "slug": "craft-office-supplies",
    "level": 1,
    "sortOrder": 20,
    "children": [
      {
        "id": "cat-craft-office-supplies-craft-office-supplies",
        "name": "Craft & Office Supplies",
        "slug": "craft-office-supplies",
        "parentId": "cat-craft-office-supplies",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-craft-office-supplies-craft-office-supplies-craft-office-supplies",
            "name": "Craft & Office Supplies",
            "slug": "craft-office-supplies",
            "parentId": "cat-craft-office-supplies-craft-office-supplies",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-craft-office-supplies-craft-office-supplies-craft-office-supplies-craft-office-supplies",
                "name": "Craft & Office Supplies",
                "slug": "craft-office-supplies",
                "parentId": "cat-craft-office-supplies-craft-office-supplies-craft-office-supplies",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-sports-fitness",
    "name": "Sports & Fitness",
    "slug": "sports-fitness",
    "level": 1,
    "sortOrder": 21,
    "children": [
      {
        "id": "cat-sports-fitness-sports-fitness",
        "name": "Sports & Fitness",
        "slug": "sports-fitness",
        "parentId": "cat-sports-fitness",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-sports-fitness-sports-fitness-sports-fitness",
            "name": "Sports & Fitness",
            "slug": "sports-fitness",
            "parentId": "cat-sports-fitness-sports-fitness",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-sports-fitness-sports-fitness-sports-fitness-sports-fitness",
                "name": "Sports & Fitness",
                "slug": "sports-fitness",
                "parentId": "cat-sports-fitness-sports-fitness-sports-fitness",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-automotive-accessories",
    "name": "Automotive Accessories",
    "slug": "automotive-accessories",
    "level": 1,
    "sortOrder": 22,
    "children": [
      {
        "id": "cat-automotive-accessories-automotive-accessories",
        "name": "Automotive Accessories",
        "slug": "automotive-accessories",
        "parentId": "cat-automotive-accessories",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-automotive-accessories-automotive-accessories-automotive-accessories",
            "name": "Automotive Accessories",
            "slug": "automotive-accessories",
            "parentId": "cat-automotive-accessories-automotive-accessories",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-automotive-accessories-automotive-accessories-automotive-accessories-automotive-accessories",
                "name": "Automotive Accessories",
                "slug": "automotive-accessories",
                "parentId": "cat-automotive-accessories-automotive-accessories-automotive-accessories",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-pet-supplies",
    "name": "Pet Supplies",
    "slug": "pet-supplies",
    "level": 1,
    "sortOrder": 23,
    "children": [
      {
        "id": "cat-pet-supplies-pet-supplies",
        "name": "Pet Supplies",
        "slug": "pet-supplies",
        "parentId": "cat-pet-supplies",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-pet-supplies-pet-supplies-pet-supplies",
            "name": "Pet Supplies",
            "slug": "pet-supplies",
            "parentId": "cat-pet-supplies-pet-supplies",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-pet-supplies-pet-supplies-pet-supplies-pet-supplies",
                "name": "Pet Supplies",
                "slug": "pet-supplies",
                "parentId": "cat-pet-supplies-pet-supplies-pet-supplies",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-office-supplies-stationery",
    "name": "Office Supplies & Stationery",
    "slug": "office-supplies-stationery",
    "level": 1,
    "sortOrder": 24,
    "children": [
      {
        "id": "cat-office-supplies-stationery-office-supplies-stationery",
        "name": "Office Supplies & Stationery",
        "slug": "office-supplies-stationery",
        "parentId": "cat-office-supplies-stationery",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-office-supplies-stationery-office-supplies-stationery-office-supplies-stationery",
            "name": "Office Supplies & Stationery",
            "slug": "office-supplies-stationery",
            "parentId": "cat-office-supplies-stationery-office-supplies-stationery",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-office-supplies-stationery-office-supplies-stationery-office-supplies-stationery-office-supplies-stationery",
                "name": "Office Supplies & Stationery",
                "slug": "office-supplies-stationery",
                "parentId": "cat-office-supplies-stationery-office-supplies-stationery-office-supplies-stationery",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-industrial-scientific-products",
    "name": "Industrial & Scientific Products",
    "slug": "industrial-scientific-products",
    "level": 1,
    "sortOrder": 25,
    "children": [
      {
        "id": "cat-industrial-scientific-products-industrial-scientific-products",
        "name": "Industrial & Scientific Products",
        "slug": "industrial-scientific-products",
        "parentId": "cat-industrial-scientific-products",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-industrial-scientific-products-industrial-scientific-products-industrial-scientific-products",
            "name": "Industrial & Scientific Products",
            "slug": "industrial-scientific-products",
            "parentId": "cat-industrial-scientific-products-industrial-scientific-products",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-industrial-scientific-products-industrial-scientific-products-industrial-scientific-products-industrial-scientific-products",
                "name": "Industrial & Scientific Products",
                "slug": "industrial-scientific-products",
                "parentId": "cat-industrial-scientific-products-industrial-scientific-products-industrial-scientific-products",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-musical-instruments",
    "name": "Musical Instruments",
    "slug": "musical-instruments",
    "level": 1,
    "sortOrder": 26,
    "children": [
      {
        "id": "cat-musical-instruments-musical-instruments",
        "name": "Musical Instruments",
        "slug": "musical-instruments",
        "parentId": "cat-musical-instruments",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-musical-instruments-musical-instruments-musical-instruments",
            "name": "Musical Instruments",
            "slug": "musical-instruments",
            "parentId": "cat-musical-instruments-musical-instruments",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-musical-instruments-musical-instruments-musical-instruments-musical-instruments",
                "name": "Musical Instruments",
                "slug": "musical-instruments",
                "parentId": "cat-musical-instruments-musical-instruments-musical-instruments",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-books",
    "name": "Books",
    "slug": "books",
    "level": 1,
    "sortOrder": 27,
    "children": [
      {
        "id": "cat-books-books",
        "name": "Books",
        "slug": "books",
        "parentId": "cat-books",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-books-books-books",
            "name": "Books",
            "slug": "books",
            "parentId": "cat-books-books",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-books-books-books-books",
                "name": "Books",
                "slug": "books",
                "parentId": "cat-books-books-books",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-eye-utility",
    "name": "Eye Utility",
    "slug": "eye-utility",
    "level": 1,
    "sortOrder": 28,
    "children": [
      {
        "id": "cat-eye-utility-eye-utility",
        "name": "Eye Utility",
        "slug": "eye-utility",
        "parentId": "cat-eye-utility",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-eye-utility-eye-utility-eye-utility",
            "name": "Eye Utility",
            "slug": "eye-utility",
            "parentId": "cat-eye-utility-eye-utility",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-eye-utility-eye-utility-eye-utility-eye-utility",
                "name": "Eye Utility",
                "slug": "eye-utility",
                "parentId": "cat-eye-utility-eye-utility-eye-utility",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-bags-luggage-travel-accessories",
    "name": "Bags, Luggage & Travel Accessories",
    "slug": "bags-luggage-travel-accessories",
    "level": 1,
    "sortOrder": 29,
    "children": [
      {
        "id": "cat-bags-luggage-travel-accessories-bags-luggage-travel-accessories",
        "name": "Bags, Luggage & Travel Accessories",
        "slug": "bags-luggage-travel-accessories",
        "parentId": "cat-bags-luggage-travel-accessories",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-bags-luggage-travel-accessories-bags-luggage-travel-accessories-bags-luggage-travel-accessories",
            "name": "Bags, Luggage & Travel Accessories",
            "slug": "bags-luggage-travel-accessories",
            "parentId": "cat-bags-luggage-travel-accessories-bags-luggage-travel-accessories",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-bags-luggage-travel-accessories-bags-luggage-travel-accessories-bags-luggage-travel-accessories-bags-luggage-travel-accessories",
                "name": "Bags, Luggage & Travel Accessories",
                "slug": "bags-luggage-travel-accessories",
                "parentId": "cat-bags-luggage-travel-accessories-bags-luggage-travel-accessories-bags-luggage-travel-accessories",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "cat-mens-personal-care-grooming",
    "name": "Mens Personal Care & Grooming",
    "slug": "mens-personal-care-grooming",
    "level": 1,
    "sortOrder": 30,
    "children": [
      {
        "id": "cat-mens-personal-care-grooming-mens-personal-care-grooming",
        "name": "Mens Personal Care & Grooming",
        "slug": "mens-personal-care-grooming",
        "parentId": "cat-mens-personal-care-grooming",
        "level": 2,
        "sortOrder": 1,
        "children": [
          {
            "id": "cat-mens-personal-care-grooming-mens-personal-care-grooming-mens-personal-care-grooming",
            "name": "Mens Personal Care & Grooming",
            "slug": "mens-personal-care-grooming",
            "parentId": "cat-mens-personal-care-grooming-mens-personal-care-grooming",
            "level": 3,
            "sortOrder": 1,
            "children": [
              {
                "id": "cat-mens-personal-care-grooming-mens-personal-care-grooming-mens-personal-care-grooming-mens-personal-care-grooming",
                "name": "Mens Personal Care & Grooming",
                "slug": "mens-personal-care-grooming",
                "parentId": "cat-mens-personal-care-grooming-mens-personal-care-grooming-mens-personal-care-grooming",
                "level": 4,
                "sortOrder": 1
              }
            ]
          }
        ]
      }
    ]
  }
];

// ==========================================
// SEED DATA: ATTRIBUTES REPOSITORY
// ==========================================
export const SEED_ATTRIBUTES: AttributeDefinition[] = [
  // 1. Common / Universal Attributes
  {
    id: 'attr-brand',
    code: 'brand',
    name: 'Brand',
    label: 'Brand Name',
    type: 'text',
    placeholder: 'e.g. Roadster, HRX, Samsung',
    helpText: 'Brand name under which product is registered',
    isRequired: true,
    isActive: true,
    isFilterable: true,
    isSearchable: true,
    sortOrder: 1,
  },
  {
    id: 'attr-color',
    code: 'color',
    name: 'Color',
    label: 'Primary Color',
    type: 'color',
    isRequired: true,
    isActive: true,
    isVariantAttribute: true,
    isFilterable: true,
    sortOrder: 2,
    options: [
      { label: 'Black', value: 'Black', hexCode: '#000000' },
      { label: 'White', value: 'White', hexCode: '#FFFFFF' },
      { label: 'Navy Blue', value: 'Navy Blue', hexCode: '#000080' },
      { label: 'Red', value: 'Red', hexCode: '#FF0000' },
      { label: 'Olive Green', value: 'Olive Green', hexCode: '#556B2F' },
      { label: 'Grey', value: 'Grey', hexCode: '#808080' },
      { label: 'Yellow', value: 'Yellow', hexCode: '#FFFF00' },
      { label: 'Maroon', value: 'Maroon', hexCode: '#800000' },
      { label: 'Beige / Cream', value: 'Beige', hexCode: '#F5F5DC' },
      { label: 'Pink', value: 'Pink', hexCode: '#FFC0CB' },
      { label: 'Multicolor', value: 'Multicolor', hexCode: 'linear-gradient' },
    ],
  },
  {
    id: 'attr-size',
    code: 'size',
    name: 'Size',
    label: 'Size Options',
    type: 'size_selector',
    isRequired: true,
    isActive: true,
    isVariantAttribute: true,
    isFilterable: true,
    sortOrder: 3,
    options: [
      { label: 'S', value: 'S' },
      { label: 'M', value: 'M' },
      { label: 'L', value: 'L' },
      { label: 'XL', value: 'XL' },
      { label: 'XXL', value: 'XXL' },
      { label: '3XL', value: '3XL' },
      { label: 'Free Size', value: 'Free Size' },
    ],
  },
  {
    id: 'attr-fabric',
    code: 'fabric',
    name: 'Fabric / Material',
    label: 'Fabric Material',
    type: 'select',
    isRequired: true,
    isActive: true,
    isFilterable: true,
    sortOrder: 4,
    options: [
      { label: '100% Pure Cotton', value: 'Pure Cotton' },
      { label: 'Cotton Blend', value: 'Cotton Blend' },
      { label: 'Polyester', value: 'Polyester' },
      { label: 'Denim', value: 'Denim' },
      { label: 'Rayon', value: 'Rayon' },
      { label: 'Silk Blend', value: 'Silk Blend' },
      { label: 'Georgette', value: 'Georgette' },
      { label: 'Chiffon', value: 'Chiffon' },
      { label: 'Linen', value: 'Linen' },
      { label: 'Lycra / Spandex', value: 'Lycra' },
      { label: 'Synthetic Leather', value: 'Synthetic' },
    ],
  },
  {
    id: 'attr-pattern',
    code: 'pattern',
    name: 'Pattern',
    label: 'Pattern / Design',
    type: 'select',
    isRequired: true,
    isActive: true,
    isFilterable: true,
    sortOrder: 5,
    options: [
      { label: 'Solid / Plain', value: 'Solid' },
      { label: 'Printed', value: 'Printed' },
      { label: 'Striped', value: 'Striped' },
      { label: 'Checked', value: 'Checked' },
      { label: 'Embroidered', value: 'Embroidered' },
      { label: 'Graphic Print', value: 'Graphic Print' },
      { label: 'Colorblocked', value: 'Colorblocked' },
      { label: 'Floral', value: 'Floral' },
    ],
  },

  // 2. Men Topwear Specific Attributes
  {
    id: 'attr-fit',
    code: 'fit',
    name: 'Fit',
    label: 'Fit Type',
    type: 'select',
    isRequired: true,
    isActive: true,
    isFilterable: true,
    sortOrder: 6,
    options: [
      { label: 'Regular Fit', value: 'Regular Fit' },
      { label: 'Slim Fit', value: 'Slim Fit' },
      { label: 'Oversized / Loose Fit', value: 'Oversized' },
      { label: 'Relaxed Fit', value: 'Relaxed' },
      { label: 'Skinny Fit', value: 'Skinny' },
    ],
  },
  {
    id: 'attr-neck',
    code: 'neck',
    name: 'Neck Style',
    label: 'Neck / Collar Type',
    type: 'select',
    isRequired: true,
    isActive: true,
    isFilterable: true,
    sortOrder: 7,
    options: [
      { label: 'Round Neck', value: 'Round Neck' },
      { label: 'V-Neck', value: 'V-Neck' },
      { label: 'Polo / Collar Neck', value: 'Polo Collar' },
      { label: 'Mandarin Collar', value: 'Mandarin Collar' },
      { label: 'Hooded Neck', value: 'Hooded' },
      { label: 'Turtle Neck', value: 'Turtle Neck' },
      { label: 'Henley Neck', value: 'Henley' },
    ],
  },
  {
    id: 'attr-sleeve-length',
    code: 'sleeve_length',
    name: 'Sleeve Length',
    label: 'Sleeve Length',
    type: 'select',
    isRequired: true,
    isActive: true,
    isFilterable: true,
    sortOrder: 8,
    options: [
      { label: 'Half Sleeves / Short Sleeves', value: 'Short Sleeves' },
      { label: 'Full Sleeves', value: 'Full Sleeves' },
      { label: 'Sleeveless', value: 'Sleeveless' },
      { label: 'Three-Quarter Sleeves', value: '3/4 Sleeves' },
    ],
  },

  // 3. Women Topwear / Kurti Attributes
  {
    id: 'attr-kurti-type',
    code: 'kurti_type',
    name: 'Kurti Type',
    label: 'Kurti / Top Style',
    type: 'select',
    isRequired: false,
    isActive: true,
    isFilterable: true,
    sortOrder: 9,
    options: [
      { label: 'Straight Kurti', value: 'Straight' },
      { label: 'Anarkali Kurti', value: 'Anarkali' },
      { label: 'A-Line Kurti', value: 'A-Line' },
      { label: 'Flared Kurti', value: 'Flared' },
      { label: 'Asymmetric Kurti', value: 'Asymmetric' },
      { label: 'Short Top', value: 'Short Top' },
      { label: 'Peplum Top', value: 'Peplum' },
    ],
  },
  {
    id: 'attr-dupatta-included',
    code: 'dupatta_included',
    name: 'Dupatta Included',
    label: 'Dupatta Included?',
    type: 'boolean',
    isRequired: false,
    isActive: true,
    sortOrder: 10,
  },

  // 4. Bottomwear Attributes (Jeans, Trousers)
  {
    id: 'attr-rise',
    code: 'rise',
    name: 'Waist Rise',
    label: 'Waist Rise',
    type: 'select',
    isRequired: false,
    isActive: true,
    sortOrder: 11,
    options: [
      { label: 'Mid Rise', value: 'Mid Rise' },
      { label: 'High Rise', value: 'High Rise' },
      { label: 'Low Rise', value: 'Low Rise' },
    ],
  },
  {
    id: 'attr-stretch',
    code: 'stretch',
    name: 'Stretchability',
    label: 'Stretch Fabric',
    type: 'select',
    isRequired: false,
    isActive: true,
    sortOrder: 12,
    options: [
      { label: 'Non Stretchable', value: 'Non Stretchable' },
      { label: 'Stretchable (2% Spandex)', value: 'Stretchable' },
      { label: 'Super Stretchable', value: 'Super Stretchable' },
    ],
  },

  // 5. Lingerie / Bra Attributes
  {
    id: 'attr-bra-type',
    code: 'bra_type',
    name: 'Bra Type',
    label: 'Bra Style',
    type: 'select',
    isRequired: false,
    isActive: true,
    sortOrder: 13,
    options: [
      { label: 'T-Shirt Bra', value: 'T-Shirt Bra' },
      { label: 'Sports Bra', value: 'Sports Bra' },
      { label: 'Padded Bra', value: 'Padded' },
      { label: 'Non-Padded Bra', value: 'Non-Padded' },
      { label: 'Bralette', value: 'Bralette' },
      { label: 'Push-Up Bra', value: 'Push-Up' },
    ],
  },
  {
    id: 'attr-coverage',
    code: 'coverage',
    name: 'Coverage',
    label: 'Cup Coverage',
    type: 'select',
    isRequired: false,
    isActive: true,
    sortOrder: 14,
    options: [
      { label: 'Full Coverage', value: 'Full Coverage' },
      { label: 'Medium Coverage', value: 'Medium Coverage' },
      { label: 'Demi Coverage', value: 'Demi Coverage' },
    ],
  },

  // 6. Footwear Attributes
  {
    id: 'attr-footwear-type',
    code: 'footwear_type',
    name: 'Footwear Type',
    label: 'Footwear Type',
    type: 'select',
    isRequired: true,
    isActive: true,
    isFilterable: true,
    sortOrder: 15,
    options: [
      { label: 'Sneakers', value: 'sneakers' },
      { label: 'Heels / Wedges', value: 'heels' },
      { label: 'Formal Shoes', value: 'formal' },
      { label: 'Sports / Running Shoes', value: 'running' },
      { label: 'Sandals & Floaters', value: 'sandals' },
      { label: 'Slippers & Flip Flops', value: 'slippers' },
    ],
  },
  {
    id: 'attr-upper-material',
    code: 'upper_material',
    name: 'Upper Material',
    label: 'Upper Material',
    type: 'select',
    isRequired: false,
    isActive: true,
    sortOrder: 16,
    options: [
      { label: 'Mesh & Canvas', value: 'Mesh' },
      { label: 'Synthetic Leather / PU', value: 'Synthetic PU' },
      { label: 'Genuine Leather', value: 'Leather' },
      { label: 'Suede', value: 'Suede' },
      { label: 'Rubber', value: 'Rubber' },
    ],
  },
  {
    id: 'attr-sole-material',
    code: 'sole_material',
    name: 'Sole Material',
    label: 'Sole Material',
    type: 'select',
    isRequired: false,
    isActive: true,
    sortOrder: 17,
    options: [
      { label: 'EVA Sole', value: 'EVA' },
      { label: 'TPR Rubber Sole', value: 'TPR' },
      { label: 'Air Cushioned Rubber', value: 'Air Rubber' },
      { label: 'Phylon', value: 'Phylon' },
      { label: 'PVC', value: 'PVC' },
    ],
  },
  {
    id: 'attr-heel-height',
    code: 'heel_height',
    name: 'Heel Height',
    label: 'Heel Height (Inches)',
    type: 'select',
    isRequired: false,
    isActive: true,
    sortOrder: 18,
    options: [
      { label: '1 to 2 Inches', value: '1-2 inch' },
      { label: '2 to 3 Inches', value: '2-3 inch' },
      { label: '3 to 4 Inches', value: '3-4 inch' },
      { label: '4+ Inches High Heels', value: '4+ inch' },
    ],
    conditions: [
      {
        id: 'cond-heel-1',
        fieldCode: 'footwear_type',
        operator: 'equals',
        value: 'heels',
      },
    ],
  },
  {
    id: 'attr-heel-type',
    code: 'heel_type',
    name: 'Heel Type',
    label: 'Heel Style',
    type: 'select',
    isRequired: false,
    isActive: true,
    sortOrder: 19,
    options: [
      { label: 'Block Heels', value: 'Block' },
      { label: 'Stiletto Heels', value: 'Stiletto' },
      { label: 'Wedge Heels', value: 'Wedge' },
      { label: 'Pencil Heels', value: 'Pencil' },
      { label: 'Kitten Heels', value: 'Kitten' },
    ],
    conditions: [
      {
        id: 'cond-heel-2',
        fieldCode: 'footwear_type',
        operator: 'equals',
        value: 'heels',
      },
    ],
  },
  {
    id: 'attr-sole-type',
    code: 'sole_type',
    name: 'Sole Type',
    label: 'Sneaker Sole Grip',
    type: 'select',
    isRequired: false,
    isActive: true,
    sortOrder: 20,
    options: [
      { label: 'Anti-Skid Memory Foam', value: 'Anti-Skid Foam' },
      { label: 'Chunky Rubber Platform', value: 'Chunky Platform' },
      { label: 'Flexible Track Sole', value: 'Track Sole' },
    ],
    conditions: [
      {
        id: 'cond-sneaker-1',
        fieldCode: 'footwear_type',
        operator: 'equals',
        value: 'sneakers',
      },
    ],
  },

  // 7. Electronics Attributes
  {
    id: 'attr-model',
    code: 'model_name',
    name: 'Model Name',
    label: 'Model Name / Series',
    type: 'text',
    placeholder: 'e.g. Bassheads 100, Smart Band 6',
    isRequired: true,
    isActive: true,
    sortOrder: 21,
  },
  {
    id: 'attr-connectivity',
    code: 'connectivity',
    name: 'Connectivity Technology',
    label: 'Connectivity Type',
    type: 'radio',
    isRequired: true,
    isActive: true,
    isFilterable: true,
    sortOrder: 22,
    options: [
      { label: 'Bluetooth Wireless', value: 'Bluetooth' },
      { label: 'Wired (3.5mm Aux)', value: 'Wired' },
      { label: 'USB Type-C', value: 'USB-C' },
      { label: '2.4GHz Wireless Dongle', value: '2.4GHz Dongle' },
    ],
  },
  {
    id: 'attr-bt-version',
    code: 'bluetooth_version',
    name: 'Bluetooth Version',
    label: 'Bluetooth Version',
    type: 'select',
    isRequired: false,
    isActive: true,
    sortOrder: 23,
    options: [
      { label: 'Bluetooth v5.3 (Latest)', value: 'v5.3' },
      { label: 'Bluetooth v5.2', value: 'v5.2' },
      { label: 'Bluetooth v5.1', value: 'v5.1' },
      { label: 'Bluetooth v5.0', value: 'v5.0' },
    ],
    conditions: [
      {
        id: 'cond-bt-1',
        fieldCode: 'connectivity',
        operator: 'equals',
        value: 'Bluetooth',
      },
    ],
  },
  {
    id: 'attr-battery-included',
    code: 'battery_included',
    name: 'Battery Included',
    label: 'Rechargeable Battery Included?',
    type: 'select',
    isRequired: false,
    isActive: true,
    sortOrder: 24,
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
  },
  {
    id: 'attr-battery-capacity',
    code: 'battery_capacity',
    name: 'Battery Capacity',
    label: 'Battery Capacity (mAh or Hours Playback)',
    type: 'text',
    placeholder: 'e.g. 500 mAh / 30 Hours Playtime',
    isRequired: false,
    isActive: true,
    sortOrder: 25,
    conditions: [
      {
        id: 'cond-bat-1',
        fieldCode: 'battery_included',
        operator: 'equals',
        value: 'Yes',
      },
    ],
  },
  {
    id: 'attr-warranty',
    code: 'warranty',
    name: 'Warranty Summary',
    label: 'Warranty Period',
    type: 'select',
    isRequired: true,
    isActive: true,
    sortOrder: 26,
    options: [
      { label: '1 Year Brand Warranty', value: '1 Year' },
      { label: '6 Months Manufacturer Warranty', value: '6 Months' },
      { label: '2 Years Extended Warranty', value: '2 Years' },
      { label: 'No Warranty', value: 'None' },
    ],
  },

  // 8. General / Compliance Attributes
  {
    id: 'attr-washcare',
    code: 'wash_care',
    name: 'Wash Care Instructions',
    label: 'Wash & Care Instructions',
    type: 'select',
    isRequired: false,
    isActive: true,
    sortOrder: 27,
    options: [
      { label: 'Machine Wash Cold', value: 'Machine Wash' },
      { label: 'Hand Wash Only', value: 'Hand Wash' },
      { label: 'Dry Clean Only', value: 'Dry Clean' },
      { label: 'Wipe with Clean Dry Cloth', value: 'Wipe Clean' },
    ],
  },
  {
    id: 'attr-country',
    code: 'country_of_origin',
    name: 'Country of Origin',
    label: 'Country of Origin',
    type: 'select',
    isRequired: true,
    isActive: true,
    sortOrder: 28,
    options: [
      { label: 'India', value: 'India' },
      { label: 'Vietnam', value: 'Vietnam' },
      { label: 'China', value: 'China' },
      { label: 'Bangladesh', value: 'Bangladesh' },
    ],
  },
  {
    id: 'attr-manufacturer',
    code: 'manufacturer_details',
    name: 'Manufacturer Details',
    label: 'Manufacturer & Packer Name',
    type: 'textarea',
    placeholder: 'Full address & entity name of manufacturer',
    isRequired: false,
    isActive: true,
    sortOrder: 29,
  },
];

// ==========================================
// SEED DATA: CATEGORY-ATTRIBUTE MAPPINGS
// ==========================================
export const SEED_MAPPINGS: CategoryAttributeMapping[] = [
  // Men T-Shirts
  { id: 'm1', categoryId: 'cat-men-tshirts', attributeId: 'attr-brand', isRequired: true, sortOrder: 1 },
  { id: 'm2', categoryId: 'cat-men-tshirts', attributeId: 'attr-color', isRequired: true, sortOrder: 2, isVariantAttribute: true },
  { id: 'm3', categoryId: 'cat-men-tshirts', attributeId: 'attr-size', isRequired: true, sortOrder: 3, isVariantAttribute: true },
  { id: 'm4', categoryId: 'cat-men-tshirts', attributeId: 'attr-fabric', isRequired: true, sortOrder: 4 },
  { id: 'm5', categoryId: 'cat-men-tshirts', attributeId: 'attr-pattern', isRequired: true, sortOrder: 5 },
  { id: 'm6', categoryId: 'cat-men-tshirts', attributeId: 'attr-fit', isRequired: true, sortOrder: 6 },
  { id: 'm7', categoryId: 'cat-men-tshirts', attributeId: 'attr-neck', isRequired: true, sortOrder: 7 },
  { id: 'm8', categoryId: 'cat-men-tshirts', attributeId: 'attr-sleeve-length', isRequired: true, sortOrder: 8 },
  { id: 'm9', categoryId: 'cat-men-tshirts', attributeId: 'attr-washcare', isRequired: false, sortOrder: 9 },
  { id: 'm10', categoryId: 'cat-men-tshirts', attributeId: 'attr-country', isRequired: true, sortOrder: 10 },

  // Women Kurtis
  { id: 'w1', categoryId: 'cat-women-kurtis', attributeId: 'attr-brand', isRequired: true, sortOrder: 1 },
  { id: 'w2', categoryId: 'cat-women-kurtis', attributeId: 'attr-color', isRequired: true, sortOrder: 2, isVariantAttribute: true },
  { id: 'w3', categoryId: 'cat-women-kurtis', attributeId: 'attr-size', isRequired: true, sortOrder: 3, isVariantAttribute: true },
  { id: 'w4', categoryId: 'cat-women-kurtis', attributeId: 'attr-fabric', isRequired: true, sortOrder: 4 },
  { id: 'w5', categoryId: 'cat-women-kurtis', attributeId: 'attr-pattern', isRequired: true, sortOrder: 5 },
  { id: 'w6', categoryId: 'cat-women-kurtis', attributeId: 'attr-kurti-type', isRequired: true, sortOrder: 6 },
  { id: 'w7', categoryId: 'cat-women-kurtis', attributeId: 'attr-neck', isRequired: true, sortOrder: 7 },
  { id: 'w8', categoryId: 'cat-women-kurtis', attributeId: 'attr-sleeve-length', isRequired: true, sortOrder: 8 },
  { id: 'w9', categoryId: 'cat-women-kurtis', attributeId: 'attr-dupatta-included', isRequired: false, sortOrder: 9 },
  { id: 'w10', categoryId: 'cat-women-kurtis', attributeId: 'attr-country', isRequired: true, sortOrder: 10 },

  // Men Jeans
  { id: 'j1', categoryId: 'cat-men-jeans', attributeId: 'attr-brand', isRequired: true, sortOrder: 1 },
  { id: 'j2', categoryId: 'cat-men-jeans', attributeId: 'attr-color', isRequired: true, sortOrder: 2, isVariantAttribute: true },
  { id: 'j3', categoryId: 'cat-men-jeans', attributeId: 'attr-size', isRequired: true, sortOrder: 3, isVariantAttribute: true },
  { id: 'j4', categoryId: 'cat-men-jeans', attributeId: 'attr-fabric', isRequired: true, sortOrder: 4 },
  { id: 'j5', categoryId: 'cat-men-jeans', attributeId: 'attr-fit', isRequired: true, sortOrder: 5 },
  { id: 'j6', categoryId: 'cat-men-jeans', attributeId: 'attr-rise', isRequired: false, sortOrder: 6 },
  { id: 'j7', categoryId: 'cat-men-jeans', attributeId: 'attr-stretch', isRequired: false, sortOrder: 7 },

  // Footwear
  { id: 'f1', categoryId: 'cat-footwear-men', attributeId: 'attr-brand', isRequired: true, sortOrder: 1 },
  { id: 'f2', categoryId: 'cat-footwear-men', attributeId: 'attr-footwear-type', isRequired: true, sortOrder: 2 },
  { id: 'f3', categoryId: 'cat-footwear-men', attributeId: 'attr-color', isRequired: true, sortOrder: 3, isVariantAttribute: true },
  { id: 'f4', categoryId: 'cat-footwear-men', attributeId: 'attr-size', isRequired: true, sortOrder: 4, isVariantAttribute: true },
  { id: 'f5', categoryId: 'cat-footwear-men', attributeId: 'attr-upper-material', isRequired: false, sortOrder: 5 },
  { id: 'f6', categoryId: 'cat-footwear-men', attributeId: 'attr-sole-material', isRequired: false, sortOrder: 6 },
  { id: 'f7', categoryId: 'cat-footwear-men', attributeId: 'attr-heel-height', isRequired: false, sortOrder: 7 },
  { id: 'f8', categoryId: 'cat-footwear-men', attributeId: 'attr-heel-type', isRequired: false, sortOrder: 8 },
  { id: 'f9', categoryId: 'cat-footwear-men', attributeId: 'attr-sole-type', isRequired: false, sortOrder: 9 },

  // Electronics Earphones
  { id: 'e1', categoryId: 'cat-elec-earphones', attributeId: 'attr-brand', isRequired: true, sortOrder: 1 },
  { id: 'e2', categoryId: 'cat-elec-earphones', attributeId: 'attr-model', isRequired: true, sortOrder: 2 },
  { id: 'e3', categoryId: 'cat-elec-earphones', attributeId: 'attr-connectivity', isRequired: true, sortOrder: 3 },
  { id: 'e4', categoryId: 'cat-elec-earphones', attributeId: 'attr-bt-version', isRequired: false, sortOrder: 4 },
  { id: 'e5', categoryId: 'cat-elec-earphones', attributeId: 'attr-battery-included', isRequired: false, sortOrder: 5 },
  { id: 'e6', categoryId: 'cat-elec-earphones', attributeId: 'attr-battery-capacity', isRequired: false, sortOrder: 6 },
  { id: 'e7', categoryId: 'cat-elec-earphones', attributeId: 'attr-color', isRequired: true, sortOrder: 7, isVariantAttribute: true },
  { id: 'e8', categoryId: 'cat-elec-earphones', attributeId: 'attr-warranty', isRequired: true, sortOrder: 8 },
];

// ==========================================
// SEED DATA: CATEGORY TEMPLATES
// ==========================================
export const SEED_TEMPLATES: CategoryTemplate[] = [
  {
    id: 'tpl-tshirt',
    name: 'Standard T-Shirt Template',
    description: 'Preset fields for Men & Women Topwear T-Shirts',
    categoryType: 'tshirt',
    attributeIds: ['attr-brand', 'attr-color', 'attr-size', 'attr-fabric', 'attr-pattern', 'attr-fit', 'attr-neck', 'attr-sleeve-length', 'attr-washcare', 'attr-country'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-footwear',
    name: 'Footwear Master Template',
    description: 'Preset fields with footwear type, sole, upper material, and heel conditions',
    categoryType: 'footwear',
    attributeIds: ['attr-brand', 'attr-footwear-type', 'attr-color', 'attr-size', 'attr-upper-material', 'attr-sole-material', 'attr-heel-height', 'attr-heel-type', 'attr-sole-type'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-electronics',
    name: 'Wireless Audio Electronics Template',
    description: 'Preset fields for earphones, speakers, smart watches with Bluetooth rules',
    categoryType: 'electronics',
    attributeIds: ['attr-brand', 'attr-model', 'attr-connectivity', 'attr-bt-version', 'attr-battery-included', 'attr-battery-capacity', 'attr-color', 'attr-warranty'],
    createdAt: new Date().toISOString(),
  },
];

// In-Memory state management
let memoryCategories: CategoryNode[] = SEED_CATEGORIES;
let memoryAttributes: AttributeDefinition[] = SEED_ATTRIBUTES;
let memoryMappings: CategoryAttributeMapping[] = SEED_MAPPINGS;
let memoryTemplates: CategoryTemplate[] = SEED_TEMPLATES;
let memoryDrafts: Record<string, ProductDraft> = {};
let memoryProducts: DynamicProductData[] = [];

// Storage loader
const initializeStore = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const catData = window.localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (catData) {
        const parsed = JSON.parse(catData);
        if (Array.isArray(parsed) && parsed.length >= 20 && parsed.some((c: any) => c.name === 'Men Fashion')) {
          memoryCategories = parsed;
        } else {
          memoryCategories = SEED_CATEGORIES;
          window.localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(SEED_CATEGORIES));
        }
      }

      const attrData = window.localStorage.getItem(STORAGE_KEYS.ATTRIBUTES);
      if (attrData) memoryAttributes = JSON.parse(attrData);

      const mapData = window.localStorage.getItem(STORAGE_KEYS.MAPPINGS);
      if (mapData) memoryMappings = JSON.parse(mapData);

      const tplData = window.localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (tplData) memoryTemplates = JSON.parse(tplData);

      const draftData = window.localStorage.getItem(STORAGE_KEYS.DRAFTS);
      if (draftData) memoryDrafts = JSON.parse(draftData);

      const prodData = window.localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (prodData) memoryProducts = JSON.parse(prodData);
    } catch (err) {
      console.warn('Storage sync warn:', err);
    }
  } else {
    // React Native AsyncStorage fallback
    AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES).then(data => {
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length >= 20) {
          memoryCategories = parsed;
        }
      }
    }).catch(e => console.warn(e));
    
    AsyncStorage.getItem(STORAGE_KEYS.ATTRIBUTES).then(data => {
      if (data) memoryAttributes = JSON.parse(data);
    }).catch(e => console.warn(e));
    
    AsyncStorage.getItem(STORAGE_KEYS.MAPPINGS).then(data => {
      if (data) memoryMappings = JSON.parse(data);
    }).catch(e => console.warn(e));
    
    AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES).then(data => {
      if (data) memoryTemplates = JSON.parse(data);
    }).catch(e => console.warn(e));
    
    AsyncStorage.getItem(STORAGE_KEYS.DRAFTS).then(data => {
      if (data) memoryDrafts = JSON.parse(data);
    }).catch(e => console.warn(e));
    
    AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS).then(data => {
      if (data) memoryProducts = JSON.parse(data);
    }).catch(e => console.warn(e));
  }
};

initializeStore();

export const deduplicateAttributes = (list: AttributeDefinition[]): AttributeDefinition[] => {
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
  const result: AttributeDefinition[] = [];

  for (const attr of list) {
    if (!attr || !attr.label) continue;

    const normalizedId = String(attr.id || '').trim();
    const normalizedCode = String(attr.code || attr.label || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_');

    if (normalizedId && seenIds.has(normalizedId)) {
      const existingIdx = result.findIndex((a) => a.id === normalizedId);
      if (existingIdx !== -1) {
        result[existingIdx] = { ...result[existingIdx], ...attr };
      }
      continue;
    }

    if (normalizedCode && seenCodes.has(normalizedCode)) {
      const existingIdx = result.findIndex(
        (a) =>
          String(a.code || a.label || '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, '_') === normalizedCode
      );
      if (existingIdx !== -1) {
        result[existingIdx] = { ...result[existingIdx], ...attr };
      }
      continue;
    }

    if (normalizedId) seenIds.add(normalizedId);
    if (normalizedCode) seenCodes.add(normalizedCode);
    result.push(attr);
  }

  // Ensure options are alphabetically ordered for all global attributes
  result.forEach(attr => {
    if (attr.options && attr.options.length > 0) {
      attr.options.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
    }
  });

  return result;
};

export const syncFromFirestore = async (): Promise<{ success: boolean; attrCount: number; catCount: number }> => {
  try {
    await ensureFirebaseAuth();
    let latestAttrs: AttributeDefinition[] = [...SEED_ATTRIBUTES];
    let collSuccess = false;

    // 1. Fetch from catalog_attributes collection docs (Primary Source of Truth)
    try {
      const collSnap = await getDocs(collection(db, 'catalog_attributes'));
      collSnap.docs.forEach((d) => {
        const data = d.data() as AttributeDefinition;
        if (data && data.id && data.label) {
          latestAttrs.push(data);
        }
      });
      collSuccess = true;
    } catch (e) {}

    // 2. Fetch from catalog_settings/attributes_repository doc (Fallback)
    if (!collSuccess) {
      try {
        const attrDoc = await getDoc(doc(db, 'catalog_settings', 'attributes_repository'));
        if (attrDoc.exists() && Array.isArray(attrDoc.data()?.attributes)) {
          latestAttrs.push(...attrDoc.data()?.attributes);
        }
      } catch (e) {}
      // retain memory if both fail
      latestAttrs.push(...memoryAttributes);
    }

    memoryAttributes = deduplicateAttributes(latestAttrs);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEYS.ATTRIBUTES, JSON.stringify(memoryAttributes));
    }

    // 3. Fetch Category Tree
    try {
      const catDoc = await getDoc(doc(db, 'catalog_settings', 'categories_tree'));
      if (catDoc.exists() && Array.isArray(catDoc.data()?.categories)) {
        const cloudCats = catDoc.data()?.categories;
        const isCloudValid = cloudCats.length >= 20 && cloudCats.some((c: any) => c.name === 'Men Fashion' || c.name === 'Women Fashion');
        if (isCloudValid) {
          memoryCategories = cloudCats;
        } else {
          memoryCategories = SEED_CATEGORIES;
          await setDoc(doc(db, 'catalog_settings', 'categories_tree'), { categories: SEED_CATEGORIES, updatedAt: new Date().toISOString() });
        }
      } else {
        memoryCategories = SEED_CATEGORIES;
        await setDoc(doc(db, 'catalog_settings', 'categories_tree'), { categories: SEED_CATEGORIES, updatedAt: new Date().toISOString() });
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(memoryCategories));
      }
    } catch (e) {}

    // 4. Fetch Category Mappings
    try {
      const mapDoc = await getDoc(doc(db, 'catalog_settings', 'category_mappings'));
      if (mapDoc.exists() && Array.isArray(mapDoc.data()?.mappings)) {
        memoryMappings = mapDoc.data()?.mappings;
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEYS.MAPPINGS, JSON.stringify(memoryMappings));
        }
      }
    } catch (e) {}

    return { success: true, attrCount: memoryAttributes.length, catCount: memoryCategories.length };
  } catch (err) {
    console.warn('Firestore sync load warning:', err);
    return { success: false, attrCount: memoryAttributes.length, catCount: memoryCategories.length };
  }
};

export const pushAllSettingsToFirestore = async (): Promise<boolean> => {
  try {
    const CHUNK_SIZE = 400;
    const commitPromises: Promise<void>[] = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;

    const addOperationToBatch = (docRef: any, data: any) => {
      currentBatch.set(docRef, data);
      operationCount++;
      if (operationCount >= CHUNK_SIZE) {
        commitPromises.push(currentBatch.commit());
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    };

    addOperationToBatch(doc(db, 'catalog_settings', 'attributes_repository'), { attributes: memoryAttributes, updatedAt: new Date().toISOString() });
    addOperationToBatch(doc(db, 'catalog_settings', 'categories_tree'), { categories: memoryCategories, updatedAt: new Date().toISOString() });
    addOperationToBatch(doc(db, 'catalog_settings', 'category_mappings'), { mappings: memoryMappings, updatedAt: new Date().toISOString() });

    for (const attr of memoryAttributes) {
      addOperationToBatch(doc(db, 'catalog_attributes', attr.id), attr);
    }

    if (operationCount > 0) {
      commitPromises.push(currentBatch.commit());
    }

    await Promise.all(commitPromises);

    return true;
  } catch (e) {
    console.error('Push to firestore error:', e);
    return false;
  }
};

export const exportCatalogSchemaJSON = (): string => {
  return JSON.stringify(
    {
      categories: memoryCategories,
      attributes: memoryAttributes,
      mappings: memoryMappings,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
};

export const importCatalogSchemaJSON = (jsonStr: string): boolean => {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.attributes && Array.isArray(parsed.attributes)) {
      memoryAttributes = deduplicateAttributes([...SEED_ATTRIBUTES, ...memoryAttributes, ...parsed.attributes]);
      persistLocal(STORAGE_KEYS.ATTRIBUTES, memoryAttributes);
    }

    if (parsed.categories && Array.isArray(parsed.categories)) {
      memoryCategories = parsed.categories;
      persistLocal(STORAGE_KEYS.CATEGORIES, memoryCategories);
    }

    if (parsed.mappings && Array.isArray(parsed.mappings)) {
      memoryMappings = parsed.mappings;
      persistLocal(STORAGE_KEYS.MAPPINGS, memoryMappings);
    }

    pushAllSettingsToFirestore();
    return true;
  } catch (err) {
    console.error('Import schema error:', err);
    return false;
  }
};

export const subscribeToCatalogSettings = (onUpdate: () => void) => {
  try {
    const unsubAttrs = onSnapshot(doc(db, 'catalog_settings', 'attributes_repository'), (snapshot) => {
      if (snapshot.exists() && Array.isArray(snapshot.data()?.attributes)) {
        const cloudAttrs: AttributeDefinition[] = snapshot.data()?.attributes;
        memoryAttributes = deduplicateAttributes([...SEED_ATTRIBUTES, ...cloudAttrs]);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEYS.ATTRIBUTES, JSON.stringify(memoryAttributes));
        }
        onUpdate();
      }
    });

    const unsubCats = onSnapshot(doc(db, 'catalog_settings', 'categories_tree'), (snapshot) => {
      if (snapshot.exists() && Array.isArray(snapshot.data()?.categories)) {
        const cloudCats = snapshot.data()?.categories;
        const isCloudValid = cloudCats.length >= 20 && cloudCats.some((c: any) => c.name === 'Men Fashion' || c.name === 'Women Fashion');
        if (isCloudValid) {
          memoryCategories = cloudCats;
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(memoryCategories));
          }
          onUpdate();
        }
      }
    });

    const unsubMappings = onSnapshot(doc(db, 'catalog_settings', 'category_mappings'), (snapshot) => {
      if (snapshot.exists() && Array.isArray(snapshot.data()?.mappings)) {
        memoryMappings = snapshot.data()?.mappings;
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEYS.MAPPINGS, JSON.stringify(memoryMappings));
        }
        onUpdate();
      }
    });

    const unsubAttrsCollection = onSnapshot(collection(db, 'catalog_attributes'), (snapshot) => {
      const cloudAttrs: AttributeDefinition[] = snapshot.docs.map((doc) => doc.data() as AttributeDefinition);
      memoryAttributes = deduplicateAttributes([...SEED_ATTRIBUTES, ...cloudAttrs]);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEYS.ATTRIBUTES, JSON.stringify(memoryAttributes));
      }
      onUpdate();
    });

    return () => {
      unsubAttrs();
      unsubAttrsCollection();
      unsubCats();
      unsubMappings();
    };
  } catch (e) {
    return () => {};
  }
};

const syncToFirestore = async (key: string, data: any) => {
  try {
    if (key === STORAGE_KEYS.CATEGORIES) {
      await setDoc(doc(db, 'catalog_settings', 'categories_tree'), { categories: data, updatedAt: new Date().toISOString() });
    } else if (key === STORAGE_KEYS.ATTRIBUTES) {
      await setDoc(doc(db, 'catalog_settings', 'attributes_repository'), { attributes: data, updatedAt: new Date().toISOString() });
    } else if (key === STORAGE_KEYS.MAPPINGS) {
      await setDoc(doc(db, 'catalog_settings', 'category_mappings'), { mappings: data, updatedAt: new Date().toISOString() });
    }
  } catch (err) {
    // Graceful offline fallback
  }
};

const persistLocal = (key: string, data: any) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  } else {
    try {
      AsyncStorage.setItem(key, JSON.stringify(data)).catch(e => console.warn(e));
    } catch (e) {}
  }
  syncToFirestore(key, data);
};

// ==========================================
// CONDITIONAL EVALUATOR ENGINE
// ==========================================
export const evaluateConditions = (
  conditions?: AttributeCondition[],
  formValues: Record<string, any> = {}
): boolean => {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((cond) => {
    const currentValue = formValues[cond.fieldCode];
    if (currentValue === undefined || currentValue === null) return false;

    switch (cond.operator) {
      case 'equals':
        return String(currentValue).toLowerCase() === String(cond.value).toLowerCase();

      case 'not_equals':
        return String(currentValue).toLowerCase() !== String(cond.value).toLowerCase();

      case 'contains':
        return String(currentValue).toLowerCase().includes(String(cond.value).toLowerCase());

      case 'in':
        if (Array.isArray(cond.value)) {
          return cond.value.map(v => String(v).toLowerCase()).includes(String(currentValue).toLowerCase());
        }
        return String(cond.value).toLowerCase().includes(String(currentValue).toLowerCase());

      case 'not_in':
        if (Array.isArray(cond.value)) {
          return !cond.value.map(v => String(v).toLowerCase()).includes(String(currentValue).toLowerCase());
        }
        return !String(cond.value).toLowerCase().includes(String(currentValue).toLowerCase());

      case 'greater_than':
        return Number(currentValue) > Number(cond.value);

      case 'less_than':
        return Number(currentValue) < Number(cond.value);

      default:
        return true;
    }
  });
};

// ==========================================
// SERVICE METHODS: CATEGORY HIERARCHY
// ==========================================
export const getCategoryHierarchy = (): CategoryNode[] => {
  initializeStore();
  return memoryCategories;
};

export const findCategoryById = (id: string, nodes: CategoryNode[] = memoryCategories): CategoryNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findCategoryById(id, node.children);
      if (found) return found;
    }
  }
  return null;
};

export const getCategoryPathNodes = (categoryId: string): CategoryNode[] => {
  const path: CategoryNode[] = [];
  let currentId: string | null | undefined = categoryId;

  while (currentId) {
    const node = findCategoryById(currentId);
    if (node) {
      path.unshift(node);
      currentId = node.parentId;
    } else {
      break;
    }
  }
  return path;
};

export const saveCategoryNode = (category: Partial<CategoryNode>): CategoryNode => {
  initializeStore();
  const isNew = !category.id;
  const newCat: CategoryNode = {
    id: category.id || `cat-${Date.now()}`,
    name: category.name || 'New Category',
    slug: category.slug || (category.name || 'new').toLowerCase().replace(/\s+/g, '-'),
    parentId: category.parentId || null,
    level: category.level || 1,
    iconName: category.iconName || 'folder',
    sortOrder: category.sortOrder || 1,
    minImagesRequired: category.minImagesRequired || 1,
    maxImagesAllowed: category.maxImagesAllowed || 9,
    children: category.children || [],
  };

  if (isNew) {
    if (newCat.parentId) {
      const parent = findCategoryById(newCat.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(newCat);
      } else {
        memoryCategories.push(newCat);
      }
    } else {
      memoryCategories.push(newCat);
    }
  } else {
    // Update existing node
    const existing = findCategoryById(newCat.id);
    if (existing) {
      Object.assign(existing, newCat);
    }
  }

  persistLocal(STORAGE_KEYS.CATEGORIES, memoryCategories);
  pushAllSettingsToFirestore().catch(e => console.warn(e));
  return newCat;
};

export const deleteCategoryNode = (categoryId: string): boolean => {
  initializeStore();
  const removeRecursive = (nodes: CategoryNode[]): boolean => {
    const idx = nodes.findIndex((n) => n.id === categoryId);
    if (idx !== -1) {
      nodes.splice(idx, 1);
      return true;
    }
    for (const node of nodes) {
      if (node.children && removeRecursive(node.children)) return true;
    }
    return false;
  };

  const removed = removeRecursive(memoryCategories);
  if (removed) {
    persistLocal(STORAGE_KEYS.CATEGORIES, memoryCategories);
    pushAllSettingsToFirestore().catch(e => console.warn(e));
  }
  return removed;
};

export const toggleCategoryAttributeVariant = (
  categoryId: string,
  attributeId: string,
  adminInfo?: { uid: string; email: string }
): boolean => {
  let mapping = memoryMappings.find(
    (m) => m.categoryId === categoryId && m.attributeId === attributeId
  );
  
  const timestamp = new Date().toISOString();
  
  if (mapping) {
    mapping.isVariantAttribute = !mapping.isVariantAttribute;
    mapping.updatedByAdminId = adminInfo?.uid;
    mapping.updatedByAdminEmail = adminInfo?.email;
    mapping.updatedAt = timestamp;
    persistLocal(STORAGE_KEYS.MAPPINGS, memoryMappings);
    pushAllSettingsToFirestore().catch(e => console.warn(e));
  }
  return true;
};

// ==========================================
// SERVICE METHODS: ATTRIBUTES & MAPPINGS
// ==========================================
export const getAllAttributes = (): AttributeDefinition[] => {
  initializeStore();
  memoryAttributes = deduplicateAttributes(memoryAttributes);
  memoryAttributes.forEach(attr => {
    if (attr.options && attr.options.length > 0) {
      attr.options.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
    }
  });
  return memoryAttributes;
};

export const saveAttribute = async (attributeData: Partial<AttributeDefinition>, adminInfo?: { uid: string; email: string }): Promise<AttributeDefinition> => {
  initializeStore();
  const normalizedCode = String(attributeData.code || attributeData.label || `attr_code_${Date.now()}`)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_');

  const existingIdx = memoryAttributes.findIndex(
    (a) => a.id === attributeData.id || String(a.code || '').toLowerCase().trim() === normalizedCode
  );

  const targetId = existingIdx !== -1 ? memoryAttributes[existingIdx].id : (attributeData.id || `attr-${Date.now()}`);
  
  const timestamp = new Date().toISOString();

  const attr: AttributeDefinition = {
    id: targetId,
    code: normalizedCode,
    name: attributeData.name || attributeData.label || 'New Attribute',
    label: attributeData.label || 'Attribute Label',
    type: attributeData.type || 'text',
    placeholder: attributeData.placeholder,
    helpText: attributeData.helpText,
    isRequired: attributeData.isRequired ?? false,
    isActive: attributeData.isActive ?? true,
    isVariantAttribute: attributeData.isVariantAttribute ?? false,
    isFilterable: attributeData.isFilterable ?? false,
    isSearchable: attributeData.isSearchable ?? false,
    sortOrder: attributeData.sortOrder || (existingIdx !== -1 ? memoryAttributes[existingIdx].sortOrder : memoryAttributes.length + 1),
    options: attributeData.options || [],
    conditions: attributeData.conditions || [],
    createdByAdminId: existingIdx !== -1 ? memoryAttributes[existingIdx].createdByAdminId : adminInfo?.uid,
    createdByAdminEmail: existingIdx !== -1 ? memoryAttributes[existingIdx].createdByAdminEmail : adminInfo?.email,
    createdAt: existingIdx !== -1 ? memoryAttributes[existingIdx].createdAt : timestamp,
    updatedByAdminId: adminInfo?.uid,
    updatedByAdminEmail: adminInfo?.email,
    updatedAt: timestamp,
  } as any;

  if (existingIdx !== -1) {
    memoryAttributes[existingIdx] = attr;
  } else {
    memoryAttributes.push(attr);
  }

  memoryAttributes = deduplicateAttributes(memoryAttributes);
  persistLocal(STORAGE_KEYS.ATTRIBUTES, memoryAttributes);

  try {
    await setDoc(doc(db, 'catalog_attributes', attr.id), attr);
  } catch (err) {
    console.warn('[Firestore Sync Error] saveAttribute:', err);
  }

  return attr;
};

export const deleteAttribute = async (attributeId: string): Promise<boolean> => {
  memoryAttributes = memoryAttributes.filter((a) => a.id !== attributeId);
  memoryMappings = memoryMappings.filter((m) => m.attributeId !== attributeId);
  persistLocal(STORAGE_KEYS.ATTRIBUTES, memoryAttributes);
  persistLocal(STORAGE_KEYS.MAPPINGS, memoryMappings);

  try {
    await deleteDoc(doc(db, 'catalog_attributes', attributeId));
  } catch (err) {
    console.warn('[Firestore Sync Error] deleteAttribute:', err);
  }

  return true;
};

export const getCategoryAttributeMappings = (categoryId: string): CategoryAttributeMapping[] => {
  const pathNodes = getCategoryPathNodes(categoryId);
  const pathIds = pathNodes.map((n) => n.id);
  return memoryMappings.filter((m) => pathIds.includes(m.categoryId));
};

export const mapAttributeToCategory = (
  categoryId: string,
  attributeId: string,
  isRequired: boolean = false,
  isVariant: boolean = false,
  adminInfo?: { uid: string; email: string }
): CategoryAttributeMapping => {
  let mapping = memoryMappings.find(
    (m) => m.categoryId === categoryId && m.attributeId === attributeId
  );
  
  const timestamp = new Date().toISOString();
  
  if (!mapping) {
    mapping = {
      id: `map-${Date.now()}`,
      categoryId,
      attributeId,
      isRequired,
      sortOrder: memoryMappings.length > 0 ? Math.max(...memoryMappings.map(m => m.sortOrder || 0)) + 1 : 1,
      isVariantAttribute: isVariant,
      createdByAdminId: adminInfo?.uid,
      createdByAdminEmail: adminInfo?.email,
      createdAt: timestamp,
      updatedByAdminId: adminInfo?.uid,
      updatedByAdminEmail: adminInfo?.email,
      updatedAt: timestamp,
    } as any;
    memoryMappings.push(mapping);
  } else {
    mapping.isRequired = isRequired;
    mapping.isVariantAttribute = isVariant;
    mapping.updatedByAdminId = adminInfo?.uid;
    mapping.updatedByAdminEmail = adminInfo?.email;
    mapping.updatedAt = timestamp;
  }

  persistLocal(STORAGE_KEYS.MAPPINGS, memoryMappings);
  pushAllSettingsToFirestore().catch(e => console.warn(e));
  return mapping;
};

export const unmapAttributeFromCategory = (categoryId: string, attributeId: string) => {
  memoryMappings = memoryMappings.filter(
    (m) => !(m.categoryId === categoryId && m.attributeId === attributeId)
  );
  persistLocal(STORAGE_KEYS.MAPPINGS, memoryMappings);
  pushAllSettingsToFirestore().catch(e => console.warn(e));
};

export const toggleCategoryAttributeRequired = (
  categoryId: string,
  attributeId: string,
  adminInfo?: { uid: string; email: string }
): boolean => {
  let mapping = memoryMappings.find(
    (m) => m.categoryId === categoryId && m.attributeId === attributeId
  );
  
  const timestamp = new Date().toISOString();
  
  if (mapping) {
    mapping.isRequired = !mapping.isRequired;
    mapping.updatedByAdminId = adminInfo?.uid;
    mapping.updatedByAdminEmail = adminInfo?.email;
    mapping.updatedAt = timestamp;
    persistLocal(STORAGE_KEYS.MAPPINGS, memoryMappings);
    pushAllSettingsToFirestore().catch(e => console.warn(e));
  }
};

export const reorderCategoryAttributeMapping = (
  categoryId: string,
  attributeId: string,
  direction: 'up' | 'down'
): void => {
  const mappings = getCategoryAttributeMappings(categoryId);
  // Sort them by current sortOrder to ensure correct adjacent items
  mappings.sort((a, b) => a.sortOrder - b.sortOrder);
  
  const currentIndex = mappings.findIndex(m => m.attributeId === attributeId);
  if (currentIndex === -1) return;

  const currentMapping = mappings[currentIndex];

  if (direction === 'up' && currentIndex > 0) {
    const swapMapping = mappings[currentIndex - 1];
    if (currentMapping.sortOrder === swapMapping.sortOrder) {
      currentMapping.sortOrder = swapMapping.sortOrder - 0.001;
    } else {
      const temp = currentMapping.sortOrder;
      currentMapping.sortOrder = swapMapping.sortOrder;
      swapMapping.sortOrder = temp;
    }
  } else if (direction === 'down' && currentIndex < mappings.length - 1) {
    const swapMapping = mappings[currentIndex + 1];
    if (currentMapping.sortOrder === swapMapping.sortOrder) {
      currentMapping.sortOrder = swapMapping.sortOrder + 0.001;
    } else {
      const temp = currentMapping.sortOrder;
      currentMapping.sortOrder = swapMapping.sortOrder;
      swapMapping.sortOrder = temp;
    }
  } else {
    return; // Nothing to do (already at top/bottom)
  }

  // Sync the updated mappings array back into memoryMappings
  mappings.forEach(m => {
    const idx = memoryMappings.findIndex(x => x.id === m.id);
    if (idx !== -1) memoryMappings[idx] = m;
  });

  persistLocal(STORAGE_KEYS.MAPPINGS, memoryMappings);
  pushAllSettingsToFirestore().catch(e => console.warn(e));
};

export const getToggleCategoryAttributeRequiredResult = (
  categoryId: string,
  attributeId: string,
  adminInfo?: { uid: string; email: string }
): boolean => {
  let mapping = memoryMappings.find(
    (m) => m.categoryId === categoryId && m.attributeId === attributeId
  );
  if (mapping) {
    return mapping.isRequired;
  } else {
    const parentMapping = getCategoryAttributeMappings(categoryId).find(
      (m) => m.attributeId === attributeId
    );
    const isRequired = parentMapping ? !parentMapping.isRequired : true;
    mapAttributeToCategory(
      categoryId,
      attributeId,
      isRequired,
      parentMapping?.isVariantAttribute || false,
      adminInfo
    );
    return isRequired;
  }
};

// ==========================================
// DYNAMIC FORM SCHEMA RESOLVER
// ==========================================
export const getCategoryFormSchema = (categoryId: string): CategoryFormSchema => {
  const categoryPathNodes = getCategoryPathNodes(categoryId);
  const leafNode = categoryPathNodes[categoryPathNodes.length - 1];
  const categoryName = leafNode ? leafNode.name : 'Product Category';
  const categoryPath = categoryPathNodes.map((n) => n.name);

  const minImagesRequired = leafNode?.minImagesRequired || 1;
  const maxImagesAllowed = leafNode?.maxImagesAllowed || 9;

  // Retrieve mappings for leaf and all ancestors
  const mappings = getCategoryAttributeMappings(categoryId);
  const mappedAttrIds = new Set(mappings.map((m) => m.attributeId));

  const resolvedFields: ResolvedCategoryField[] = [];

  mappings.forEach((mapping) => {
    const attrDef = memoryAttributes.find((a) => a.id === mapping.attributeId);
    if (attrDef && attrDef.isActive) {
      resolvedFields.push({
        attribute: attrDef,
        isRequired: mapping.isRequired || attrDef.isRequired,
        sortOrder: mapping.sortOrder,
        isVariantAttribute: Boolean(mapping.isVariantAttribute || attrDef.isVariantAttribute),
        groupSection: 'category_specific',
      });
    }
  });

  // Sort fields by mapping sortOrder
  resolvedFields.sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    categoryId,
    categoryPath,
    categoryName,
    minImagesRequired,
    maxImagesAllowed,
    fields: resolvedFields,
  };
};

// ==========================================
// SERVICE METHODS: TEMPLATES
// ==========================================
export const getCategoryTemplates = (): CategoryTemplate[] => memoryTemplates;

export const saveCategoryTemplate = (templateData: Partial<CategoryTemplate>): CategoryTemplate => {
  const tpl: CategoryTemplate = {
    id: templateData.id || `tpl-${Date.now()}`,
    name: templateData.name || 'New Template',
    description: templateData.description || '',
    categoryType: templateData.categoryType || 'general',
    attributeIds: templateData.attributeIds || [],
    createdAt: new Date().toISOString(),
  };

  const idx = memoryTemplates.findIndex((t) => t.id === tpl.id);
  if (idx !== -1) {
    memoryTemplates[idx] = tpl;
  } else {
    memoryTemplates.push(tpl);
  }

  persistLocal(STORAGE_KEYS.TEMPLATES, memoryTemplates);
  return tpl;
};

export const applyTemplateToCategory = (categoryId: string, templateId: string) => {
  const tpl = memoryTemplates.find((t) => t.id === templateId);
  if (!tpl) return;

  tpl.attributeIds.forEach((attrId) => {
    mapAttributeToCategory(categoryId, attrId, false, false);
  });
};

// ==========================================
// CARTESIAN VARIANT GENERATOR ENGINE
// ==========================================
export const generateVariantMatrix = (
  variantAttributeCodes: string[],
  attributeValues: Record<string, any>,
  basePrice: number = 499,
  baseMrp: number = 999,
  baseSku: string = 'SKU'
): ProductVariant[] => {
  if (variantAttributeCodes.length === 0) return [];

  // Extract selected option arrays per attribute
  const attributesWithOptions: { code: string; options: string[] }[] = [];

  variantAttributeCodes.forEach((code) => {
    const attr = memoryAttributes.find((a) => a.code === code);
    const rawVal = attributeValues[code];
    let selectedOptions: string[] = [];

    if (Array.isArray(rawVal)) {
      selectedOptions = rawVal;
    } else if (rawVal) {
      selectedOptions = [String(rawVal)];
    } else if (attr && attr.options) {
      // Pick first 3 as fallback if seller hasn't typed options
      selectedOptions = attr.options.slice(0, 4).map((o) => o.value);
    }

    if (selectedOptions.length > 0) {
      attributesWithOptions.push({ code, options: selectedOptions });
    }
  });

  if (attributesWithOptions.length === 0) return [];

  // Cartesian product algorithm
  const cartesian = (args: string[][]): string[][] => {
    const r: string[][] = [];
    const max = args.length - 1;
    function helper(arr: string[], i: number) {
      for (let j = 0, l = args[i].length; j < l; j++) {
        const a = [...arr, args[i][j]];
        if (i === max) r.push(a);
        else helper(a, i + 1);
      }
    }
    helper([], 0);
    return r;
  };

  const optionMatrix = attributesWithOptions.map((item) => item.options);
  const combinations = cartesian(optionMatrix);

  return combinations.map((combo, index) => {
    const comboMap: Record<string, any> = {};
    const titleParts: string[] = [];

    combo.forEach((val, i) => {
      const code = attributesWithOptions[i].code;
      comboMap[code] = val;
      titleParts.push(val);
    });

    const skuSuffix = titleParts.map((t) => String(t).toUpperCase().replace(/\s+/g, '')).join('-');
    const discountPct = baseMrp > 0 ? Math.round(((baseMrp - basePrice) / baseMrp) * 100) : 0;

    return {
      id: `var-${Date.now()}-${index}`,
      sku: `${baseSku}-${skuSuffix}`,
      title: titleParts.join(' / '),
      price: Number(basePrice),
      mrp: Number(baseMrp),
      discountPercentage: discountPct,
      stock: 25,
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      attributeValues: comboMap,
      enabled: true,
    };
  });
};

// ==========================================
// DRAFTS & CATALOG PRODUCT PERSISTENCE
// ==========================================
export const saveProductDraft = (draft: Partial<ProductDraft>): ProductDraft => {
  const id = draft.id || `draft-${Date.now()}`;
  const fullDraft: ProductDraft = {
    id,
    sellerId: draft.sellerId || 'seller-1',
    categoryId: draft.categoryId || '',
    categoryPath: draft.categoryPath || [],
    step: draft.step || 1,
    commonFields: draft.commonFields || {},
    attributeValues: draft.attributeValues || {},
    variants: draft.variants || [],
    variantAttributes: draft.variantAttributes || [],
    mainImage: draft.mainImage,
    additionalImages: draft.additionalImages || [],
    updatedAt: new Date().toISOString(),
  };

  memoryDrafts[id] = fullDraft;
  persistLocal(STORAGE_KEYS.DRAFTS, memoryDrafts);
  return fullDraft;
};

export const getProductDraft = (id: string): ProductDraft | null => {
  return memoryDrafts[id] || null;
};

export const saveCatalogProduct = async (productData: Partial<DynamicProductData>): Promise<DynamicProductData> => {
  const newProduct: DynamicProductData = {
    id: productData.id || `prod-${Date.now()}`,
    sellerId: productData.sellerId || 'seller-default',
    sellerName: productData.sellerName || 'Verified TafDeal Seller',
    title: productData.title || 'Dynamic Catalog Product',
    brand: productData.brand || 'Generic',
    description: productData.description || '',
    categoryId: productData.categoryId || 'cat-men-tshirts',
    categoryPath: productData.categoryPath || ['Fashion', 'Men', 'Topwear', 'T-Shirts'],
    price: productData.price || 499,
    originalPrice: productData.originalPrice || 999,
    stock: productData.stock || 50,
    unit: productData.unit || 'piece',
    imageUrl: productData.imageUrl || '',
    additionalImages: productData.additionalImages || [],
    rating: 4.8,
    reviewCount: 12,
    tags: productData.tags || ['Topwear', 'Fashion', 'Catalog Upload'],
    createdAt: new Date().toISOString(),
    hsn: productData.hsn,
    gstPercentage: productData.gstPercentage,
    weightGrams: productData.weightGrams,
    dimensions: productData.dimensions,
    countryOfOrigin: productData.countryOfOrigin,
    manufacturer: productData.manufacturer,
    attributeValues: productData.attributeValues || {},
    variants: productData.variants || [],
    isHyperlocalAvailable: true,
    offerFreeShipping: productData.offerFreeShipping || false,
  };

  // We do NOT add to memoryProducts yet. We'll wait for the sync to finish so we have the proper ID.
  
  // Determine context for standard size mapping
  const cLevel1 = newProduct.categoryPath[0];
  const cLevel2 = newProduct.categoryPath[1];
  const cLevel3 = newProduct.categoryPath[2];
  const cLevel4 = newProduct.categoryPath[3];
  const wearType = getWearType(cLevel1, cLevel2, cLevel3, cLevel4, newProduct.title, newProduct.tags);
  const gender = getGenderType(cLevel1, cLevel2, cLevel3, cLevel4, newProduct.title, newProduct.tags);

  const inferMeasurements = (szLabel: string) => {
    const upSz = szLabel.toUpperCase();
    let chest: number | undefined;
    let length: number | undefined;
    let waist: number | undefined;
    let hip: number | undefined;
    
    if (wearType === 'upper') {
      if (gender === 'men' || gender === 'unisex') {
        if (upSz === 'S') { chest = 38; length = 27; }
        else if (upSz === 'M' || upSz === 'FREE SIZE') { chest = 40; length = 28; }
        else if (upSz === 'L') { chest = 42; length = 29; }
        else if (upSz === 'XL') { chest = 44; length = 30; }
        else if (upSz === 'XXL' || upSz === '2XL') { chest = 46; length = 31; }
        else if (upSz === 'XXXL' || upSz === '3XL') { chest = 48; length = 32; }
      } else if (gender === 'women') {
        if (upSz === 'XS') { chest = 34; length = 25; }
        else if (upSz === 'S') { chest = 36; length = 26; }
        else if (upSz === 'M' || upSz === 'FREE SIZE') { chest = 38; length = 27; }
        else if (upSz === 'L') { chest = 40; length = 28; }
        else if (upSz === 'XL') { chest = 42; length = 29; }
        else if (upSz === 'XXL' || upSz === '2XL') { chest = 44; length = 30; }
      }
    } else if (wearType === 'lower') {
      if (gender === 'men' || gender === 'unisex') {
        if (upSz === 'S' || upSz === '28') { waist = 28; length = 40; }
        else if (upSz === 'M' || upSz === '30') { waist = 30; length = 41; }
        else if (upSz === 'L' || upSz === '32' || upSz === 'FREE SIZE') { waist = 32; length = 42; }
        else if (upSz === 'XL' || upSz === '34') { waist = 34; length = 42; }
        else if (upSz === 'XXL' || upSz === '36') { waist = 36; length = 43; }
      } else if (gender === 'women') {
        if (upSz === 'XS' || upSz === '26') { waist = 26; length = 37; hip = 34; }
        else if (upSz === 'S' || upSz === '28') { waist = 28; length = 38; hip = 36; }
        else if (upSz === 'M' || upSz === '30' || upSz === 'FREE SIZE') { waist = 30; length = 39; hip = 38; }
        else if (upSz === 'L' || upSz === '32') { waist = 32; length = 40; hip = 40; }
        else if (upSz === 'XL' || upSz === '34') { waist = 34; length = 41; hip = 42; }
      }
    }
    return { chest, length, waist, hip };
  };

  // Sync to Firebase Firestore asynchronously
  try {
    const syncedProduct = await addProduct({
      id: newProduct.id,
      sellerId: newProduct.sellerId,
      sellerName: newProduct.sellerName,
      title: newProduct.title,
      description: newProduct.description,
      category: newProduct.categoryPath[0] || 'Fashion',
      subcategory: newProduct.categoryPath[newProduct.categoryPath.length - 1] || 'Topwear',
      price: newProduct.price,
      originalPrice: newProduct.originalPrice,
      stock: newProduct.stock,
      unit: newProduct.unit,
      imageUrl: newProduct.imageUrl,
      additionalImages: newProduct.additionalImages,
      rating: newProduct.rating,
      reviewCount: newProduct.reviewCount,
      tags: newProduct.tags,
      isHyperlocalAvailable: true,
      offerFreeShipping: newProduct.offerFreeShipping,
      createdAt: newProduct.createdAt,
      fabric: newProduct.attributeValues.fabric,
      pattern: newProduct.attributeValues.pattern,
      color: newProduct.attributeValues.color,
      fitType: newProduct.attributeValues.fit,
      variants: newProduct.variants,
      sizes: newProduct.variants.length > 0 
        ? newProduct.variants.map((v) => {
            const sizeVal = v.attributeValues?.Size || v.attributeValues?.size || v.attributeValues?.['Shirt Size'] || v.attributeValues?.['Tshirt Size'] || v.title?.split('-')?.pop()?.trim() || 'Free Size';
            const sMeas = inferMeasurements(String(sizeVal));
            return {
              size: sizeVal,
              price: v.price,
              mrp: v.mrp,
              stock: v.stock,
              sku: v.sku,
              chestInches: sMeas.chest,
              lengthInches: sMeas.length,
              waistInches: sMeas.waist,
              hipInches: sMeas.hip,
              enabled: true
            };
          })
        : (() => {
            const fallbackSizes = newProduct.attributeValues?.size || newProduct.attributeValues?.Size || [];
            const sizeArray = Array.isArray(fallbackSizes) ? fallbackSizes : [fallbackSizes].filter(Boolean);
            return sizeArray.length > 0 
              ? sizeArray.map((sz) => {
                  const sMeas = inferMeasurements(String(sz));
                  return {
                    size: String(sz),
                    price: newProduct.price,
                    mrp: newProduct.originalPrice || newProduct.price,
                    stock: newProduct.stock,
                    sku: `SKU-${Date.now()}-${sz}`,
                    chestInches: sMeas.chest,
                    lengthInches: sMeas.length,
                    waistInches: sMeas.waist,
                    hipInches: sMeas.hip,
                    enabled: true
                  };
                })
              : [];
          })()
    } as any);

    if (syncedProduct && syncedProduct.id) {
      newProduct.id = syncedProduct.id;
    }
  } catch (err) {
    console.warn('Firebase sync warning:', err);
    throw err;
  }

  // Update memory store with final ID
  const idx = memoryProducts.findIndex(p => p.id === productData.id || p.id === newProduct.id);
  if (idx !== -1) {
    memoryProducts[idx] = newProduct;
  } else {
    memoryProducts.unshift(newProduct);
  }
  persistLocal(STORAGE_KEYS.PRODUCTS, memoryProducts);

  return newProduct;
};

export const getDynamicProducts = (): DynamicProductData[] => memoryProducts;

export const updateProductRating = async (productId: string, newRating: number, newReviewCount: number): Promise<void> => {
  const index = memoryProducts.findIndex(p => p.id === productId);
  if (index !== -1) {
    memoryProducts[index].rating = newRating;
    memoryProducts[index].reviewCount = newReviewCount;
    persistLocal(STORAGE_KEYS.PRODUCTS, memoryProducts);
    
    try {
      const docRef = doc(db, 'products', productId);
      await setDoc(docRef, { rating: newRating, reviewCount: newReviewCount }, { merge: true });
    } catch (e) {
      console.error('Error updating firestore product rating:', e);
    }
  }
};

// ==========================================
// DELETION REQUESTS (SUPER ADMIN WORKFLOW)
// ==========================================
const DELETION_REQUESTS_COLLECTION = 'deletion_requests';

export const getPendingDeletionRequests = async (): Promise<DeletionRequest[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, DELETION_REQUESTS_COLLECTION));
    const requests: DeletionRequest[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as DeletionRequest;
      if (data.status === 'pending') {
        requests.push(data);
      }
    });
    return requests;
  } catch (error) {
    console.error("Error fetching deletion requests:", error);
    return [];
  }
};

export const createDeletionRequest = async (
  type: 'global_attribute' | 'category_mapping',
  targetId: string,
  targetName: string,
  adminName: string,
  categoryId?: string,
  categoryName?: string
) => {
  const req: DeletionRequest = {
    id: `del-req-${Date.now()}`,
    type,
    targetId,
    targetName,
    categoryId,
    categoryName,
    adminName,
    status: 'pending',
    timestamp: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, DELETION_REQUESTS_COLLECTION, req.id), req);
  } catch (e) {
    console.error("Error creating deletion request", e);
  }
};

export const approveDeletionRequest = async (id: string) => {
  try {
    const docRef = doc(db, DELETION_REQUESTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const req = snap.data() as DeletionRequest;
    
    if (req.type === 'global_attribute') {
      await deleteAttribute(req.targetId);
    } else if (req.type === 'category_mapping' && req.categoryId) {
      unmapAttributeFromCategory(req.categoryId, req.targetId);
    }
    
    await setDoc(docRef, { status: 'approved' }, { merge: true });
  } catch (e) {
    console.error("Error approving deletion request", e);
  }
};

export const rejectDeletionRequest = async (id: string) => {
  try {
    const docRef = doc(db, DELETION_REQUESTS_COLLECTION, id);
    await setDoc(docRef, { status: 'rejected' }, { merge: true });
  } catch (e) {
    console.error("Error rejecting deletion request", e);
  }
};
