import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product, User } from '../types';
import { useAuth } from './AuthContext';
import { saveUserToFirestore } from '../services/firebaseService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, deliveryPreference?: 'fast' | 'budget') => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user, isAuthenticated } = useAuth();
  const isInitialMount = useRef(true);
  const prevAuth = useRef(isAuthenticated);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem('@digisewa_cart');
        if (storedCart) {
          setItems(JSON.parse(storedCart));
        }
      } catch (error) {
        console.error('Failed to load cart from storage', error);
      }
    };
    loadCart();
  }, []);

  // Sync cart from Firestore when user logs in
  useEffect(() => {
    const fetchRemoteCart = async () => {
      if (isAuthenticated && user && user.role === 'customer') {
        try {
          const userDocRef = doc(db, 'users', user.id);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const dbCart = userData.cart || [];
            
            setItems(prevItems => {
              if (dbCart.length > 0 && prevItems.length === 0) {
                // Local is empty, use DB cart
                AsyncStorage.setItem('@digisewa_cart', JSON.stringify(dbCart));
                return dbCart;
              } else if (prevItems.length > 0) {
                // Merge local and DB carts
                const merged = [...prevItems];
                let changed = false;
                dbCart.forEach(dbItem => {
                  if (!merged.find(i => i.product.id === dbItem.product.id)) {
                    merged.push(dbItem);
                    changed = true;
                  }
                });
                if (changed) {
                  AsyncStorage.setItem('@digisewa_cart', JSON.stringify(merged));
                  saveUserToFirestore({ ...user, cart: merged });
                  return merged;
                }
              }
              return prevItems;
            });
          }
        } catch (error) {
          console.error("Failed to fetch remote cart", error);
        }
      }
    };
    fetchRemoteCart();
  }, [isAuthenticated, user?.id]);

  // Clear cart on logout
  useEffect(() => {
    if (prevAuth.current === true && isAuthenticated === false) {
      setItems([]);
      AsyncStorage.removeItem('@digisewa_cart');
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  const saveCart = async (newItems: CartItem[], currentUser: User | null) => {
    try {
      await AsyncStorage.setItem('@digisewa_cart', JSON.stringify(newItems));
      if (currentUser && currentUser.role === 'customer') {
        saveUserToFirestore({ ...currentUser, cart: newItems });
      }
    } catch (error) {
      console.error('Failed to save cart to storage/db', error);
    }
  };

  const addToCart = (product: Product, quantity: number = 1, deliveryPreference: 'fast' | 'budget' = 'budget') => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(i => i.product.id === product.id);
      let newItems;
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        updated[existingIndex].deliveryPreference = deliveryPreference;
        newItems = updated;
      } else {
        newItems = [...prevItems, { product, quantity, deliveryPreference }];
      }
      saveCart(newItems, isAuthenticated ? user : null);
      return newItems;
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => {
      const newItems = prevItems.filter(i => i.product.id !== productId);
      saveCart(newItems, isAuthenticated ? user : null);
      return newItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      saveCart(newItems, isAuthenticated ? user : null);
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    saveCart([], isAuthenticated ? user : null);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
