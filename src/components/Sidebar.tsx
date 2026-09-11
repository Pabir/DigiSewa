import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import {
  LayoutDashboard,
  PlusCircle,
  PackageCheck,
  ShoppingBag,
  ShoppingCart,
  History,
  MapPin,
  CreditCard,
  AlertCircle,
  Store,
  LogOut,
  User,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onCloseSidebar?: () => void;
  onOpenCart?: () => void;
  onOpenSupport?: () => void;
  onOpenWallet?: () => void;
  isDesktop?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onCloseSidebar,
  onOpenCart,
  onOpenSupport,
  onOpenWallet,
  isDesktop = false,
}) => {
  const {
    user,
    activeRole,
    setActiveRole,
    isAuthenticated,
    sellerProfile,
    openSellerProfileModal,
    openCustomerProfileModal,
    logout,
  } = useAuth();

  const { totalItems } = useCart();

  const handleCustomerOptionPress = (id: string) => {
    if (onCloseSidebar) {
      onCloseSidebar();
    }

    switch (id) {
      case 'home':
        onSelectTab('home');
        break;
      case 'cart':
        if (onOpenCart) onOpenCart();
        else onSelectTab('cart');
        break;
      case 'orders':
        onSelectTab('orders');
        break;
      case 'addresses':
        openCustomerProfileModal();
        break;
      case 'wallet':
        if (onOpenWallet) onOpenWallet();
        break;
      case 'support':
        if (onOpenSupport) onOpenSupport();
        break;
      case 'switch_role':
        setActiveRole(activeRole === 'seller' ? 'buyer' : 'seller');
        break;
      case 'logout':
        logout();
        break;
      default:
        onSelectTab(id);
        break;
    }
  };


  if (activeRole === 'seller') {
    if (!isAuthenticated || user?.role !== 'seller') {
      return null;
    }

    if (!isDesktop && !onCloseSidebar) {
      const sellerMobileItems = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'add_catalog', label: 'Add Catalog', icon: PlusCircle },
        { id: 'manage_orders', label: 'Orders', icon: PackageCheck },
      ];

      return (
        <View style={styles.mobileBottomBar}>
          {sellerMobileItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={styles.mobileTabItem}
                onPress={() => onSelectTab(item.id)}
              >
                <View style={isActive ? styles.activeIconContainer : null}>
                  <Icon size={20} color={isActive ? '#4F46E5' : '#64748B'} />
                </View>
                <Text style={[styles.mobileTabText, isActive && styles.mobileTabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    return null;
  }

  // -------------------------------------------------------------
  // CUSTOMER HAMBURGER MENU (OFF-CANVAS DRAWER & DESKTOP SIDEBAR)
  // -------------------------------------------------------------
  const customerShoppingGroup = [
    { id: 'home', label: 'Home Store', icon: ShoppingBag, sub: 'Explore hyperlocal products' },
    { id: 'cart', label: 'My Cart & Checkout', icon: ShoppingCart, countBadge: totalItems },
    { id: 'orders', label: 'Order History', icon: History, sub: 'Track active & past orders' },
    { id: 'addresses', label: 'Saved Delivery Addresses', icon: MapPin, sub: 'Manage delivery locations' },
  ];

  const customerServicesGroup = [
    { id: 'wallet', label: 'DigiSewa Wallet & Refunds', icon: CreditCard, badge: '₹899 Bal' },
    { id: 'support', label: 'Help & Customer Support', icon: AlertCircle, sub: '24/7 Helpline & Tickets' },
  ];

  const customerActionsGroup = [];
  if (!isAuthenticated || user?.role !== 'customer') {
    customerActionsGroup.push({ id: 'switch_role', label: 'Switch to Seller Hub', icon: Store, accentColor: '#6366F1' });
  }
  if (isAuthenticated) {
    customerActionsGroup.push({ id: 'logout', label: 'Log Out of Account', icon: LogOut, accentColor: '#EF4444' });
  }

  // Mobile Bottom Bar (<768px when NOT in drawer overlay)
  if (!isDesktop && !onCloseSidebar) {
    const mobileBottomItems = [
      { id: 'home', label: 'Home Store', icon: ShoppingBag },
      { id: 'orders', label: 'Orders', icon: History },
    ];

    return (
      <View style={styles.mobileBottomBar}>
        {mobileBottomItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              style={styles.mobileTabItem}
              onPress={() => onSelectTab(item.id)}
            >
              <View style={isActive ? styles.activeIconContainer : null}>
                <Icon size={20} color={isActive ? '#4F46E5' : '#64748B'} />
              </View>
              <Text style={[styles.mobileTabText, isActive && styles.mobileTabTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={isDesktop ? styles.desktopSidebar : styles.mobileSidebarFull}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerInner}>
        {/* CUSTOMER USER PROFILE HEADER */}
        <TouchableOpacity
          style={styles.profileHeader}
          onPress={() => {
            openCustomerProfileModal();
            if (onCloseSidebar) onCloseSidebar();
          }}
          activeOpacity={0.85}
        >
          <View style={styles.customerAvatarBox}>
            <Text style={styles.customerAvatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.storeNameText}>
              {user?.name || 'Valued Customer'}
            </Text>
            <View style={styles.verifiedRow}>
              <CheckCircle2 size={12} color="#10B981" />
              <Text style={styles.roleSubtext}>Verified Customer • Edit Profile</Text>
            </View>
          </View>
          {onCloseSidebar && (
            <TouchableOpacity onPress={onCloseSidebar} style={{ padding: 4 }}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* SECTION 1: SHOPPING & ORDERS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderText}>SHOPPING & ORDERS</Text>
        </View>
        <View style={styles.menuContainer}>
          {customerShoppingGroup.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={[styles.desktopNavItem, isActive && styles.desktopNavItemActive]}
                onPress={() => handleCustomerOptionPress(item.id)}
              >
                <Icon size={19} color={isActive ? '#4F46E5' : '#94A3B8'} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.desktopNavText, isActive && styles.desktopNavTextActive]}>
                    {item.label}
                  </Text>
                  {item.sub && <Text style={styles.navSubtext}>{item.sub}</Text>}
                </View>
                {item.countBadge !== undefined && item.countBadge > 0 && (
                  <View style={styles.cartCountBadge}>
                    <Text style={styles.cartCountText}>{item.countBadge}</Text>
                  </View>
                )}
                <ArrowRight size={14} color="#475569" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SECTION 2: SERVICES & SUPPORT */}
        <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
          <Text style={styles.sectionHeaderText}>SERVICES & SUPPORT</Text>
        </View>
        <View style={styles.menuContainer}>
          {customerServicesGroup.map(item => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={styles.desktopNavItem}
                onPress={() => handleCustomerOptionPress(item.id)}
              >
                <Icon size={19} color="#94A3B8" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.desktopNavText}>{item.label}</Text>
                  {item.sub && <Text style={styles.navSubtext}>{item.sub}</Text>}
                </View>
                {item.badge && (
                  <View style={styles.walletBadge}>
                    <Text style={styles.walletBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <ArrowRight size={14} color="#475569" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SECTION 3: ACCOUNT ACTIONS */}
        <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
          <Text style={styles.sectionHeaderText}>ACCOUNT ACTIONS</Text>
        </View>
        <View style={styles.menuContainer}>
          {customerActionsGroup.map(item => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={[styles.desktopNavItem, styles.actionItemCard]}
                onPress={() => handleCustomerOptionPress(item.id)}
              >
                <Icon size={19} color={item.accentColor} />
                <Text style={[styles.desktopNavText, { color: item.accentColor, fontWeight: '700' }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  desktopSidebar: {
    width: 270,
    backgroundColor: '#0F172A',
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    height: '100%',
  },
  mobileSidebarFull: {
    width: '100%',
    backgroundColor: '#0F172A',
    paddingVertical: 20,
    paddingHorizontal: 14,
    height: '100%',
  },
  drawerInner: {
    paddingBottom: 30,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    marginBottom: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  storeNameText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  roleSubtext: {
    color: '#94A3B8',
    fontSize: 11,
  },
  sectionHeaderRow: {
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  menuContainer: {
    gap: 6,
  },
  desktopNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 10,
    backgroundColor: '#1E293B',
  },
  desktopNavItemActive: {
    backgroundColor: '#334155',
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  desktopNavText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  desktopNavTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navSubtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  cartCountBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cartCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  walletBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  walletBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  actionItemCard: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  mobileBottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  mobileTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeIconContainer: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  mobileTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  mobileTabTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
});
