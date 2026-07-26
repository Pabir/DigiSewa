import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, ShoppingCart, Store, UserCheck, LogOut, Menu, X, LogIn, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onOpenCart?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  isDesktop?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCart,
  onToggleSidebar,
  isSidebarOpen = true,
  isDesktop = false,
}) => {
  const {
    user,
    activeRole,
    setActiveRole,
    isAuthenticated,
    openCustomerAuthModal,
    logout,
  } = useAuth();
  const { totalItems } = useCart();

  return (
    <View style={[styles.navHeader, isDesktop && styles.desktopNav]}>
      {/* Brand & Location */}
      <View style={styles.brandContainer}>
        {onToggleSidebar && (
          <TouchableOpacity
            style={styles.hamburgerBtn}
            onPress={onToggleSidebar}
            activeOpacity={0.7}
            accessibilityLabel="Toggle Navigation Sidebar"
          >
            {isSidebarOpen ? (
              <X size={22} color="#0F172A" />
            ) : (
              <Menu size={22} color="#0F172A" />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.brandTitleRow}
          onPress={() => setActiveRole('buyer')}
          activeOpacity={0.8}
        >
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>DS</Text>
          </View>
          <View>
            <View style={styles.titleWithBadge}>
              <Text style={styles.brandTitle}>DigiSewa</Text>
              <View style={styles.taglineBadge}>
                <Text style={styles.taglineText}>Har Sewa, Ab Digital</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <MapPin size={12} color="#EA580C" />
              <Text numberOfLines={1} style={styles.locationText}>
                {user?.address || 'Guwahati, Assam'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Right Controls: Auth, Role Portal, Cart */}
      <View style={styles.rightControls}>
        {/* Navigation Portal Switcher (Customer vs Seller) */}
        <View style={styles.portalGroup}>
          <TouchableOpacity
            style={[styles.portalBtn, activeRole === 'buyer' && styles.portalBtnActiveBuyer]}
            onPress={() => setActiveRole('buyer')}
          >
            <Text style={[styles.portalText, activeRole === 'buyer' && styles.portalTextActive]}>
              Customer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.portalBtn, activeRole === 'seller' && styles.portalBtnActiveSeller]}
            onPress={() => setActiveRole('seller')}
          >
            <Store size={12} color={activeRole === 'seller' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 4 }} />
            <Text style={[styles.portalText, activeRole === 'seller' && styles.portalTextActive]}>
              Seller Hub
            </Text>
          </TouchableOpacity>
        </View>

        {/* User Account / Auth Actions */}
        {isAuthenticated && user ? (
          <View style={styles.userProfilePill}>
            <View style={styles.userAvatarBadge}>
              <UserIcon size={14} color="#0F172A" />
            </View>
            <Text style={styles.userNameText} numberOfLines={1}>
              {user.name.split(' ')[0]}
            </Text>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
              <LogOut size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ) : (
          activeRole === 'buyer' && (
            <TouchableOpacity
              style={styles.loginCtaBtn}
              onPress={() => openCustomerAuthModal('general')}
              activeOpacity={0.85}
            >
              <LogIn size={15} color="#FFFFFF" />
              <Text style={styles.loginCtaText}>Login</Text>
            </TouchableOpacity>
          )
        )}

        {/* Shopping Cart Button with Counter */}
        {activeRole === 'buyer' && (
          <TouchableOpacity activeOpacity={0.8} style={styles.cartButton} onPress={onOpenCart}>
            <ShoppingCart size={20} color="#0F172A" />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 100,
  },
  desktopNav: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  hamburgerBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  logoBadge: {
    backgroundColor: '#0F172A',
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  logoText: {
    color: '#EA580C',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  taglineBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  taglineText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#EA580C',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    maxWidth: 160,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  portalGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  portalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  portalBtnActiveBuyer: {
    backgroundColor: '#EA580C',
  },
  portalBtnActiveSeller: {
    backgroundColor: '#4338CA',
  },
  portalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  portalTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  userProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userAvatarBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: 80,
  },
  logoutBtn: {
    padding: 2,
    marginLeft: 2,
  },
  loginCtaBtn: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  loginCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cartButton: {
    position: 'relative',
    backgroundColor: '#F1F5F9',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EA580C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
