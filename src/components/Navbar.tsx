import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import TafdealLogo from '../../assets/TAFDEAL_logo.svg';
import { MapPin, ShoppingCart, Store, UserCheck, LogOut, Menu, X, LogIn, User as UserIcon, Heart } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface NavbarProps {
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  isDesktop?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCart,
  onOpenWishlist,
  onToggleSidebar,
  isSidebarOpen = true,
  isDesktop = false,
}) => {
  const {
    user,
    sellerProfile,
    activeRole,
    setActiveRole,
    isAuthenticated,
    openCustomerAuthModal,
    openSellerProfileModal,
    openCustomerProfileModal,
    logout,
  } = useAuth();
  const { totalItems } = useCart();
  const { totalItems: wishlistTotal } = useWishlist();

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
          onPress={() => {
            if (!isAuthenticated || user?.role === 'customer') {
              setActiveRole('buyer');
            } else if (user?.role === 'seller') {
              setActiveRole('seller');
            }
          }}
          activeOpacity={0.8}
        >
          <TafdealLogo width={38} height={38} style={styles.logoBadge} />
          <View>
            <View style={styles.titleWithBadge}>
              <Text style={styles.brandTitle}>TafDeal</Text>
              <View style={styles.taglineBadge}>
                <Text style={styles.taglineText}>Your Deal, Simplified</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <MapPin size={12} color="#4F46E5" />
              <Text numberOfLines={1} style={styles.locationText}>
                {user?.address || 'Bauria, West Bengal'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Right Controls: Auth, Role Portal, Cart */}
      <View style={styles.rightControls}>
        {/* Navigation Portal Switcher (Customer vs Seller) */}
        <View style={styles.portalGroup}>
          {(!isAuthenticated || user?.role === 'customer') && (
            <TouchableOpacity
              style={[styles.portalBtn, activeRole === 'buyer' && styles.portalBtnActiveBuyer]}
              onPress={() => setActiveRole('buyer')}
            >
              <Text style={[styles.portalText, activeRole === 'buyer' && styles.portalTextActive]}>
                Customer
              </Text>
            </TouchableOpacity>
          )}

          {(!isAuthenticated || user?.role === 'seller') && (
            <TouchableOpacity
              style={[styles.portalBtn, activeRole === 'seller' && styles.portalBtnActiveSeller]}
              onPress={() => setActiveRole('seller')}
            >
              <Store size={12} color={activeRole === 'seller' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 4 }} />
              <Text style={[styles.portalText, activeRole === 'seller' && styles.portalTextActive]}>
                Seller Hub
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* User Account / Auth Actions */}
        {isAuthenticated && user ? (
          <TouchableOpacity
            style={styles.userProfilePill}
            onPress={() => {
              if (activeRole === 'seller' && sellerProfile) {
                openSellerProfileModal();
              } else {
                openCustomerProfileModal();
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.userAvatarBadge}>
              <UserIcon size={14} color="#0F172A" />
            </View>
            <Text style={styles.userNameText} numberOfLines={1}>
              {user.name.split(' ')[0]}
            </Text>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
              <LogOut size={16} color="#DC2626" />
            </TouchableOpacity>
          </TouchableOpacity>
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

        {/* Wishlist Button with Counter */}
        {activeRole === 'buyer' && (
          <TouchableOpacity activeOpacity={0.8} style={styles.cartButton} onPress={onOpenWishlist}>
            <Heart size={20} color="#0F172A" />
            {wishlistTotal > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{wishlistTotal}</Text>
              </View>
            )}
          </TouchableOpacity>
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
    width: 38,
    height: 38,
    marginRight: 10,
  },
  logoText: {
    color: '#4F46E5',
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
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  taglineText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4F46E5',
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
    backgroundColor: '#4F46E5',
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
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#4F46E5',
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
    backgroundColor: '#4F46E5',
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
