import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Product, User } from '../types';
import { useAuth } from './AuthContext';
import { updateUserFieldsInFirestore, getUserFromFirestore } from '../services/firebaseService';

interface CompareContextType {
  compareItems: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_ITEMS = 3;

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const { user, isAuthenticated } = useAuth();
  const prevAuth = useRef(isAuthenticated);

  useEffect(() => {
    const loadCompareList = async () => {
      try {
        const stored = await AsyncStorage.getItem('@tafdeal_compare');
        if (stored) {
          setCompareItems(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load compare list from storage', error);
      }
    };
    loadCompareList();
  }, []);

  // Sync from Firestore when user logs in
  useEffect(() => {
    const fetchRemoteCompare = async () => {
      if (isAuthenticated && user && (user.role === 'customer' || user.role === 'buyer')) {
        try {
          const userData = await getUserFromFirestore(user.id);
          
          if (userData) {
            const dbCompare = userData.compareList || [];
            
            setCompareItems(prevItems => {
              if (dbCompare.length > 0 && prevItems.length === 0) {
                AsyncStorage.setItem('@tafdeal_compare', JSON.stringify(dbCompare));
                return dbCompare;
              } else if (prevItems.length > 0) {
                // Merge logic (keep local if conflict, or just take remote if simpler, but let's just union and slice to MAX)
                const mergedMap = new Map();
                [...prevItems, ...dbCompare].forEach(item => {
                  mergedMap.set(item.id, item);
                });
                
                // Ensure same category rule is applied to merged list
                const mergedList = Array.from(mergedMap.values());
                let validMergedList: Product[] = [];
                if (mergedList.length > 0) {
                  const targetCategory = mergedList[0].category;
                  const targetSubcategory = mergedList[0].subcategory;
                  validMergedList = mergedList.filter(p => p.category === targetCategory && p.subcategory === targetSubcategory).slice(0, MAX_COMPARE_ITEMS);
                }

                if (JSON.stringify(validMergedList) !== JSON.stringify(prevItems)) {
                  AsyncStorage.setItem('@tafdeal_compare', JSON.stringify(validMergedList));
                  updateUserFieldsInFirestore(user.id, { compareList: validMergedList });
                  return validMergedList;
                }
              }
              return prevItems;
            });
          }
        } catch (error) {
          console.error("Failed to fetch remote compare list", error);
        }
      }
    };
    fetchRemoteCompare();
  }, [isAuthenticated, user?.id]);

  // Clear on logout
  useEffect(() => {
    if (prevAuth.current === true && isAuthenticated === false) {
      setCompareItems([]);
      AsyncStorage.removeItem('@tafdeal_compare');
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  const saveCompareList = async (newItems: Product[], currentUser: User | null) => {
    try {
      await AsyncStorage.setItem('@tafdeal_compare', JSON.stringify(newItems));
      if (currentUser && (currentUser.role === 'customer' || currentUser.role === 'buyer')) {
        updateUserFieldsInFirestore(currentUser.id, { compareList: newItems });
      }
    } catch (error) {
      console.error('Failed to save compare list', error);
    }
  };

  const addToCompare = (product: Product) => {
    setCompareItems(prevItems => {
      // Check if already in list
      if (prevItems.some(p => p.id === product.id)) {
        return prevItems; // Do nothing
      }

      // Check category and subcategory consistency
      if (prevItems.length > 0) {
        const isSameCategory = prevItems[0].category === product.category;
        const isSameSubcategory = prevItems[0].subcategory === product.subcategory;
        
        if (!isSameCategory || !isSameSubcategory) {
          Alert.alert(
            "Different Category",
            "You can only compare products of the same category and subcategory. Please clear your compare list to add this product.",
            [{ text: "OK" }]
          );
          return prevItems;
        }
      }

      // Check max limit
      if (prevItems.length >= MAX_COMPARE_ITEMS) {
        Alert.alert(
          "Limit Reached",
          `You can only compare up to ${MAX_COMPARE_ITEMS} items at a time.`,
          [{ text: "OK" }]
        );
        return prevItems;
      }

      const newItems = [...prevItems, product];
      saveCompareList(newItems, isAuthenticated ? user : null);
      return newItems;
    });
  };

  const removeFromCompare = (productId: string) => {
    setCompareItems(prevItems => {
      const newItems = prevItems.filter(p => p.id !== productId);
      saveCompareList(newItems, isAuthenticated ? user : null);
      return newItems;
    });
  };

  const clearCompare = () => {
    setCompareItems([]);
    saveCompareList([], isAuthenticated ? user : null);
  };

  const isInCompare = (productId: string) => {
    return compareItems.some(p => p.id === productId);
  };

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
