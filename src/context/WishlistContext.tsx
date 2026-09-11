import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, User } from '../types';
import { useAuth } from './AuthContext';
import { updateUserFieldsInFirestore, getUserFromFirestore } from '../services/firebaseService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>([]);
  const { user, isAuthenticated } = useAuth();
  const isInitialMount = useRef(true);
  const prevAuth = useRef(isAuthenticated);

  // Load wishlist from local storage on mount
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const storedWishlist = await AsyncStorage.getItem('@tafdeal_wishlist');
        if (storedWishlist) {
          setItems(JSON.parse(storedWishlist));
        }
      } catch (error) {
        console.error('Failed to load wishlist from storage', error);
      }
    };
    loadWishlist();
  }, []);

  // Sync wishlist from Firestore when user logs in
  useEffect(() => {
    const fetchRemoteWishlist = async () => {
      if (isAuthenticated && user && (user.role === 'customer' || user.role === 'buyer')) {
        try {
          const userData = await getUserFromFirestore(user.id);
          
          if (userData) {
            const dbWishlist = userData.wishlist || [];
            
            setItems(prevItems => {
              if (dbWishlist.length > 0 && prevItems.length === 0) {
                // Local is empty, use DB wishlist
                AsyncStorage.setItem('@tafdeal_wishlist', JSON.stringify(dbWishlist));
                return dbWishlist;
              } else if (prevItems.length > 0) {
                // Merge local and DB wishlists (prevent duplicates)
                const merged = [...prevItems];
                dbWishlist.forEach(dbItem => {
                  if (!merged.find(i => i.id === dbItem.id)) {
                    merged.push(dbItem);
                  }
                });
                
                if (merged.length !== dbWishlist.length || merged.length !== prevItems.length) {
                  AsyncStorage.setItem('@tafdeal_wishlist', JSON.stringify(merged));
                  updateUserFieldsInFirestore(user.id, { wishlist: merged });
                  return merged;
                }
              }
              return prevItems;
            });
          }
        } catch (error) {
          console.error("Failed to fetch remote wishlist", error);
        }
      }
    };
    fetchRemoteWishlist();
  }, [isAuthenticated, user?.id]);

  // Clear wishlist on logout
  useEffect(() => {
    if (prevAuth.current === true && isAuthenticated === false) {
      setItems([]);
      AsyncStorage.removeItem('@tafdeal_wishlist');
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  const saveWishlist = async (newItems: Product[], currentUser: User | null) => {
    try {
      await AsyncStorage.setItem('@tafdeal_wishlist', JSON.stringify(newItems));
      if (currentUser && (currentUser.role === 'customer' || currentUser.role === 'buyer')) {
        updateUserFieldsInFirestore(currentUser.id, { wishlist: newItems });
      }
    } catch (error) {
      console.error('Failed to save wishlist to storage/db', error);
    }
  };

  const addToWishlist = (product: Product) => {
    setItems(prev => {
      if (prev.find(p => p.id === product.id)) return prev; // Already in wishlist
      const newItems = [...prev, product];
      saveWishlist(newItems, isAuthenticated ? user : null);
      return newItems;
    });
  };

  const removeFromWishlist = (productId: string) => {
    setItems(prev => {
      const newItems = prev.filter(p => p.id !== productId);
      saveWishlist(newItems, isAuthenticated ? user : null);
      return newItems;
    });
  };

  const isInWishlist = (productId: string) => {
    return items.some(p => p.id === productId);
  };

  const clearWishlist = () => {
    setItems([]);
    saveWishlist([], isAuthenticated ? user : null);
  };

  const value = {
    items,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    totalItems: items.length,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
