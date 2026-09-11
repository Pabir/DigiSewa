import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { CompareProvider } from './src/context/CompareContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CompareProvider>
          <CartProvider>
            <AppNavigator />
          </CartProvider>
        </CompareProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
