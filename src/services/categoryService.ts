import meeshoTreeData from '../data/meeshoCategoryTree.json';

export interface CategoryGroup {
  id: string;
  name: string;
  leaves: string[];
}

export interface CategorySubgroup {
  id: string;
  name: string;
  groups: CategoryGroup[];
}

export interface CategoryTreeData {
  id: string;
  name: string;
  subgroups: CategorySubgroup[];
}

const CATEGORY_SERVER_URL = 'https://digisewa-ac3c4.firebaseapp.com/category.json';
const CACHE_STORAGE_KEY = 'TafDeal_cached_category_tree_v2';

let inMemoryCategoryTree: CategoryTreeData[] = meeshoTreeData as CategoryTreeData[];

// Function to fetch live categories from server with offline cache fallback
export const loadCategoriesFromServer = async (): Promise<CategoryTreeData[]> => {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const liveServerUrl = `${window.location.origin}/category.json`;
      const response = await fetch(liveServerUrl);
      if (response.ok) {
        const rawJson = await response.json();
        if (rawJson && rawJson.items) {
          const parsedTree = parseRawMeeshoJsonToTree(rawJson);
          if (parsedTree.length > 0) {
            inMemoryCategoryTree = parsedTree;
            if (window.localStorage) {
              window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(parsedTree));
            }
            return parsedTree;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Live server category fetch note:', err);
  }

  // Try local cache
  if (typeof window !== 'undefined' && window.localStorage) {
    const cached = window.localStorage.getItem(CACHE_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryCategoryTree = parsed;
          return parsed;
        }
      } catch (e) {}
    }
  }

  return inMemoryCategoryTree;
};

// Helper to convert raw Meesho category.json format to 4-level tree
export const parseRawMeeshoJsonToTree = (rawJson: any): CategoryTreeData[] => {
  if (!rawJson || !rawJson.items) return meeshoTreeData as CategoryTreeData[];

  const superCats = rawJson.items.find((i: any) => i.type === 'super-category')?.data || [];
  const cats = rawJson.items.find((i: any) => i.type === 'category')?.data || [];
  const subCats = rawJson.items.find((i: any) => i.type === 'sub-category')?.data || [];
  const subSubCats = rawJson.items.find((i: any) => i.type === 'sub-sub-category')?.data || [];

  return superCats.map((sc: any) => {
    const scCats = cats.filter((c: any) => c.parent_id === sc.id);
    return {
      id: sc.id,
      name: sc.name,
      subgroups: scCats.map((c: any) => {
        const cSubCats = subCats.filter((sub: any) => sub.parent_id === c.id);
        return {
          id: c.id,
          name: c.name,
          groups: cSubCats.map((sub: any) => {
            const leaves = subSubCats.filter((ssc: any) => ssc.parent_id === sub.id).map((ssc: any) => ssc.name);
            return {
              id: sub.id,
              name: sub.name,
              leaves: leaves.length > 0 ? leaves : [sub.name],
            };
          }),
        };
      }),
    };
  });
};

export const getCategoryTree = (): CategoryTreeData[] => {
  return inMemoryCategoryTree;
};

export const searchCategories = (query: string) => {
  if (!query || !query.trim()) return [];
  const cleanQ = query.trim().toLowerCase();

  const results: {
    superCategoryId: string;
    superCategory: string;
    subgroupId: string;
    subgroup: string;
    groupId: string;
    group: string;
    leaf: string;
  }[] = [];

  for (const sc of inMemoryCategoryTree) {
    for (const sg of sc.subgroups) {
      for (const g of sg.groups) {
        for (const leaf of g.leaves) {
          if (
            leaf.toLowerCase().includes(cleanQ) ||
            g.name.toLowerCase().includes(cleanQ) ||
            sg.name.toLowerCase().includes(cleanQ) ||
            sc.name.toLowerCase().includes(cleanQ)
          ) {
            results.push({
              superCategoryId: sc.id,
              superCategory: sc.name,
              subgroupId: sg.id,
              subgroup: sg.name,
              groupId: g.id,
              group: g.name,
              leaf: leaf,
            });
            if (results.length >= 30) return results;
          }
        }
      }
    }
  }

  return results;
};
