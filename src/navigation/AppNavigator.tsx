import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, SafeAreaView, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { AuthModal } from '../components/auth/AuthModal';
import { AdminLoginModal } from '../components/auth/AdminLoginModal';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';

// Buyer Screens
import { HomeScreen } from '../screens/buyer/HomeScreen';
import { ProductDetailScreen } from '../screens/buyer/ProductDetailScreen';
import { CartScreen } from '../screens/buyer/CartScreen';
import { OrderHistoryScreen } from '../screens/buyer/OrderHistoryScreen';

// Seller Screens
import { SellerLoginScreen } from '../screens/seller/SellerLoginScreen';
import { DashboardScreen } from '../screens/seller/DashboardScreen';
import { AddProductAIScreen } from '../screens/seller/AddProductAIScreen';
import { AddMeeshoCatalogScreen } from '../screens/seller/AddMeeshoCatalogScreen';
import { ManageCatalogsScreen } from '../screens/seller/ManageCatalogsScreen';
import { ManageOrdersScreen } from '../screens/seller/ManageOrdersScreen';

// Admin Screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';

export const AppNavigator: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { activeRole, setActiveRole, isAuthenticated, user, openAdminAuthModal } = useAuth();

  // Active Tab per role
  const [buyerTab, setBuyerTab] = useState<string>('home');
  const [sellerTab, setSellerTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Active Selected Product for Detail Screen
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewingCart, setIsViewingCart] = useState<boolean>(false);

  // Auto-detect admin URL parameter (e.g. ?admin=true or #admin)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location) {
      const href = window.location.href.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (search.includes('admin') || hash.includes('admin') || href.includes('/admin')) {
        openAdminAuthModal();
      }
    }
  }, []);

  // 1. ADMIN FLOW (Requires authenticated admin user)
  if (activeRole === 'admin') {
    if (isAuthenticated && user?.role === 'admin') {
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
          <AdminDashboardScreen onSwitchRole={setActiveRole} />
          <AdminLoginModal />
        </SafeAreaView>
      );
    }
  }

  const currentTab = activeRole === 'seller' ? sellerTab : buyerTab;

  const handleSelectTab = (tab: string) => {
    if (activeRole === 'seller') {
      setSellerTab(tab);
    } else {
      setBuyerTab(tab);
      setSelectedProduct(null);
      setIsViewingCart(false);
    }
  };

  const renderScreenContent = () => {
    // 2. BUYER FLOW (Guests & Logged in customers)
    if (activeRole === 'buyer') {
      if (isViewingCart) {
        return (
          <CartScreen
            onBack={() => setIsViewingCart(false)}
            onOrderSuccess={() => {
              setIsViewingCart(false);
              setBuyerTab('orders');
            }}
          />
        );
      }

      if (selectedProduct) {
        return (
          <ProductDetailScreen
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onNavigateToCart={() => {
              setSelectedProduct(null);
              setIsViewingCart(true);
            }}
          />
        );
      }

      switch (buyerTab) {
        case 'home':
          return (
            <HomeScreen
              onSelectProduct={p => setSelectedProduct(p)}
              isDesktop={isDesktop}
            />
          );
        case 'orders':
          return <OrderHistoryScreen />;
        default:
          return <HomeScreen onSelectProduct={p => setSelectedProduct(p)} isDesktop={isDesktop} />;
      }
    }

    // 3. SELLER FLOW (Requires authenticated seller profile)
    if (activeRole === 'seller') {
      if (!isAuthenticated || user?.role !== 'seller') {
        return <SellerLoginScreen />;
      }

      switch (sellerTab) {
        case 'dashboard':
          return (
            <DashboardScreen
              onNavigateToAddProduct={() => setSellerTab('add_catalog')}
              onNavigateToManageCatalogs={() => setSellerTab('manage_catalogs')}
              onNavigateToOrders={() => setSellerTab('manage_orders')}
              isDesktop={isDesktop}
            />
          );
        case 'add_product':
        case 'add_catalog':
          return (
            <AddMeeshoCatalogScreen
              onBack={() => setSellerTab('dashboard')}
              onSuccess={() => setSellerTab('manage_catalogs')}
            />
          );
        case 'manage_catalogs':
          return <ManageCatalogsScreen />;
        case 'manage_orders':
          return <ManageOrdersScreen />;
        default:
          return (
            <DashboardScreen
              onNavigateToAddProduct={() => setSellerTab('add_catalog')}
              onNavigateToManageCatalogs={() => setSellerTab('manage_catalogs')}
              onNavigateToOrders={() => setSellerTab('manage_orders')}
              isDesktop={isDesktop}
            />
          );
      }
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header Navbar */}
      <Navbar
        onOpenCart={() => setIsViewingCart(true)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
        isDesktop={isDesktop}
      />

      {/* Layout Body: Desktop Side-Drawer vs Mobile Layout */}
      <View style={styles.mainLayout}>
        {/* Desktop Permanent / Toggleable Sidebar */}
        {isDesktop && isSidebarOpen && (
          <Sidebar
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            isDesktop={true}
          />
        )}

        {/* Mobile / Tablet Off-Canvas Drawer Overlay */}
        {!isDesktop && isSidebarOpen && (
          <View style={styles.mobileDrawerOverlay}>
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={() => setIsSidebarOpen(false)}
            />
            <View style={styles.drawerContainer}>
              <Sidebar
                currentTab={currentTab}
                onSelectTab={(tab) => {
                  handleSelectTab(tab);
                  setIsSidebarOpen(false);
                }}
                onCloseSidebar={() => setIsSidebarOpen(false)}
                isDesktop={true}
              />
            </View>
          </View>
        )}

        <ScrollView style={styles.contentArea} contentContainerStyle={styles.scrollContent}>
          {renderScreenContent()}
          <Footer />
        </ScrollView>
      </View>

      {/* Mobile Bottom Navigation Bar */}
      {!isDesktop && (
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isDesktop={false}
        />
      )}

      {/* Global Auth Modals */}
      <AuthModal />
      <AdminLoginModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mobileDrawerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  drawerContainer: {
    width: 270,
    height: '100%',
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
});
