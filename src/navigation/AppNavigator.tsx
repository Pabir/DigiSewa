import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { MeeshoSupplierSidebar } from '../components/seller/MeeshoSupplierSidebar';
import { Footer } from '../components/Footer';
import { AuthModal } from '../components/auth/AuthModal';
import { AdminLoginScreen } from '../screens/admin/AdminLoginScreen';
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
import { SellerGuideScreen } from '../screens/seller/SellerGuideScreen';
import { CatalogUploadsScreen } from '../screens/seller/CatalogUploadsScreen';
import { SellerReturnsScreen } from '../screens/seller/SellerReturnsScreen';
import { SellerPricingScreen } from '../screens/seller/SellerPricingScreen';
import { SellerBulkUploadScreen } from '../screens/seller/SellerBulkUploadScreen';
import { SellerQualityScreen } from '../screens/seller/SellerQualityScreen';
import { SellerGenericTabScreen } from '../screens/seller/SellerGenericTabScreen';

// Admin Screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';

import { SellerProfileModal } from '../components/seller/SellerProfileModal';
import { CustomerProfileModal } from '../components/auth/CustomerProfileModal';
import { CustomerSupportModal } from '../components/buyer/CustomerSupportModal';
import { CustomerWalletModal } from '../components/buyer/CustomerWalletModal';

export const AppNavigator: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { activeRole, setActiveRole, isAuthenticated, user, openAdminAuthModal, openCustomerAuthModal } = useAuth();

  // Active Tab per role
  const [buyerTab, setBuyerTab] = useState<string>('home');
  const [sellerTab, setSellerTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Active Selected Product for Detail Screen
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewingCart, setIsViewingCart] = useState<boolean>(false);
  const [isCustomerSupportOpen, setIsCustomerSupportOpen] = useState<boolean>(false);
  const [supportOrderId, setSupportOrderId] = useState<string | undefined>(undefined);
  const [isCustomerWalletOpen, setIsCustomerWalletOpen] = useState<boolean>(false);

  // Auto-detect admin, seller or customer URL parameters
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location) {
      const href = window.location.href.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const savedIntent = (window.localStorage && window.localStorage.getItem('emailIntent')) || '';

      const isSellerLink =
        href.includes('mode=sellerverifyemail') ||
        href.includes('mode=sellerresetpassword') ||
        href.includes('mode=verifyemail') ||
        search.includes('verifyemail') ||
        savedIntent === 'sellerRegister' ||
        savedIntent === 'register' ||
        savedIntent === 'sellerResetPassword';

      const isCustomerLink =
        search.includes('customerresetpassword') ||
        search.includes('customeremail') ||
        href.includes('mode=customerresetpassword') ||
        href.includes('mode=customeremail') ||
        savedIntent === 'customerResetPassword' ||
        savedIntent === 'customerEmail';

      if (search.includes('admin') || hash.includes('admin') || href.includes('/admin')) {
        setActiveRole('admin');
      } else if (isSellerLink) {
        setActiveRole('seller');
      } else if (isCustomerLink) {
        openCustomerAuthModal();
      } else if (search.includes('oobcode') || href.includes('mode=resetpassword')) {
        if (savedIntent === 'sellerRegister' || savedIntent === 'register' || savedIntent === 'sellerResetPassword') {
          setActiveRole('seller');
        } else if (savedIntent === 'customerResetPassword' || search.includes('customerresetpassword')) {
          openCustomerAuthModal();
        }
      }
    }
  }, []);

  // Back action handler (for Android BackHandler, Browser popstate, and UI buttons)
  const handleBackAction = useCallback(() => {
    if (activeRole === 'seller') {
      if (sellerTab !== 'dashboard' && sellerTab !== 'home') {
        setSellerTab('dashboard');
        return true;
      }
    } else if (activeRole === 'buyer') {
      if (isViewingCart) {
        setIsViewingCart(false);
        return true;
      }
      if (selectedProduct) {
        setSelectedProduct(null);
        return true;
      }
      if (buyerTab !== 'home') {
        setBuyerTab('home');
        return true;
      }
    }
    return false;
  }, [activeRole, sellerTab, buyerTab, isViewingCart, selectedProduct]);

  // 1. Hardware Back Button on Android / React Native
  useEffect(() => {
    const onBackPress = () => {
      return handleBackAction();
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [handleBackAction]);

  // 2. Web Browser History (popstate) & pushState integration
  const isNavigatingFromPopState = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.addEventListener) return;

    const handlePopState = () => {
      isNavigatingFromPopState.current = true;
      handleBackAction();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBackAction]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.history) return;

    if (isNavigatingFromPopState.current) {
      isNavigatingFromPopState.current = false;
      return;
    }

    const isRoot = activeRole === 'seller'
      ? (sellerTab === 'dashboard' || sellerTab === 'home')
      : (buyerTab === 'home' && !isViewingCart && !selectedProduct);

    if (!isRoot) {
      window.history.pushState({ activeRole, sellerTab, buyerTab, isViewingCart, hasSelectedProduct: !!selectedProduct }, '');
    }
  }, [activeRole, sellerTab, buyerTab, isViewingCart, selectedProduct]);

  // 1. ADMIN FLOW (Requires authenticated admin user)
  const isAdminRole = activeRole === 'admin' || activeRole === 'super_admin';
  const isAdminAuthenticated = isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin');

  if (isAdminRole) {
    if (isAdminAuthenticated) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
          <AdminDashboardScreen onSwitchRole={setActiveRole} />
        </SafeAreaView>
      );
    }
    
    // Show new Admin Login Screen if not authenticated
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <AdminLoginScreen 
          onSuccess={() => {}} 
          onBack={() => setActiveRole('buyer')}
        />
      </SafeAreaView>
    );
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
          return <OrderHistoryScreen onBack={() => setBuyerTab('home')} onOpenSupport={(orderId) => {
            setSupportOrderId(orderId);
            setIsCustomerSupportOpen(true);
          }} />;
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
        case 'home':
          return (
            <DashboardScreen
              onNavigateToAddProduct={() => setSellerTab('add_catalog')}
              onNavigateToManageCatalogs={() => setSellerTab('manage_catalogs')}
              onNavigateToOrders={() => setSellerTab('manage_orders')}
              onNavigateTab={(tab) => setSellerTab(tab)}
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
        case 'inventory':
        case 'manage_catalogs':
          return <ManageCatalogsScreen onBack={() => setSellerTab('dashboard')} />;
        case 'orders':
        case 'manage_orders':
          return <ManageOrdersScreen onBack={() => setSellerTab('dashboard')} />;
        case 'catalog_uploads':
          return (
            <CatalogUploadsScreen
              onNavigateToAddSingleCatalog={() => setSellerTab('add_catalog')}
              onNavigateToManageCatalogs={() => setSellerTab('manage_catalogs')}
              onBack={() => setSellerTab('dashboard')}
            />
          );
        case 'returns':
          return <SellerReturnsScreen onBack={() => setSellerTab('dashboard')} />;
        case 'pricing':
          return <SellerPricingScreen onBack={() => setSellerTab('dashboard')} />;
        case 'bulk_upload':
          return <SellerBulkUploadScreen onBack={() => setSellerTab('dashboard')} />;
        case 'quality':
          return <SellerQualityScreen onBack={() => setSellerTab('dashboard')} />;
        case 'claims':
        case 'payments':
        case 'warehouse':
        case 'influencer':
        case 'promotions':
        case 'instant_cash':
          return <SellerGenericTabScreen tabKey={sellerTab} onBack={() => setSellerTab('dashboard')} />;
        case 'guide':
        case 'help':
          return <SellerGuideScreen onBack={() => setSellerTab('dashboard')} />;
        default:
          return (
            <DashboardScreen
              onNavigateToAddProduct={() => setSellerTab('add_catalog')}
              onNavigateToManageCatalogs={() => setSellerTab('manage_catalogs')}
              onNavigateToOrders={() => setSellerTab('manage_orders')}
              onNavigateTab={(tab) => setSellerTab(tab)}
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
        {isDesktop && isSidebarOpen && activeRole !== 'seller' && (
          <Sidebar
            currentTab={currentTab}
            onSelectTab={handleSelectTab}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            onOpenCart={() => setIsViewingCart(true)}
            onOpenSupport={() => {
              setSupportOrderId(undefined);
              setIsCustomerSupportOpen(true);
            }}
            onOpenWallet={() => setIsCustomerWalletOpen(true)}
            isDesktop={true}
          />
        )}

        {/* Mobile / Tablet Off-Canvas Drawer Overlay */}
        {!isDesktop && isSidebarOpen && (activeRole !== 'seller' || (isAuthenticated && user?.role === 'seller')) && (
          <View style={styles.mobileDrawerOverlay}>
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={() => setIsSidebarOpen(false)}
            />
            <View style={styles.drawerContainer}>
              {activeRole === 'seller' ? (
                <MeeshoSupplierSidebar
                  currentTab={currentTab}
                  onSelectTab={(tab) => {
                    handleSelectTab(tab);
                    setIsSidebarOpen(false);
                  }}
                  onCloseSidebar={() => setIsSidebarOpen(false)}
                />
              ) : (
                <Sidebar
                  currentTab={currentTab}
                  onSelectTab={(tab) => {
                    handleSelectTab(tab);
                    setIsSidebarOpen(false);
                  }}
                  onCloseSidebar={() => setIsSidebarOpen(false)}
                  onOpenCart={() => setIsViewingCart(true)}
                  onOpenSupport={() => {
                    setSupportOrderId(undefined);
                    setIsCustomerSupportOpen(true);
                  }}
                  onOpenWallet={() => setIsCustomerWalletOpen(true)}
                  isDesktop={true}
                />
              )}
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

      {/* Global Auth & Profile Modals */}
      <AuthModal />
      <SellerProfileModal />
      <CustomerProfileModal />
      <CustomerSupportModal
        visible={isCustomerSupportOpen}
        onClose={() => {
          setIsCustomerSupportOpen(false);
          setSupportOrderId(undefined);
        }}
        initialOrderId={supportOrderId}
      />
      <CustomerWalletModal
        visible={isCustomerWalletOpen}
        onClose={() => setIsCustomerWalletOpen(false)}
      />
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
