import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LayoutDashboard, PlusCircle, PackageCheck, ShoppingBag, History, Sparkles, Store, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onCloseSidebar?: () => void;
  isDesktop?: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onCloseSidebar, isDesktop = false }) => {
  const { activeRole, sellerProfile } = useAuth();

  const sellerMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'add_product', label: 'AI Product Lister', icon: PlusCircle, badge: 'Gemini AI' },
    { id: 'manage_orders', label: 'Orders Pipeline', icon: PackageCheck },
  ];

  const buyerMenuItems: MenuItem[] = [
    { id: 'home', label: 'Home Store', icon: ShoppingBag },
    { id: 'orders', label: 'Order History', icon: History },
  ];

  const menuItems = activeRole === 'seller' ? sellerMenuItems : buyerMenuItems;

  // Desktop Side-Drawer Navigation (>768px)
  if (isDesktop) {
    return (
      <View style={styles.desktopSidebar}>
        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarBox}>
            <Store size={22} color="#EA580C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.storeNameText}>
              {activeRole === 'seller' ? sellerProfile.storeName : 'DigiSewa Buyer'}
            </Text>
            <View style={styles.verifiedRow}>
              <Text style={styles.roleSubtext}>
                {activeRole === 'seller' ? 'Verified Seller' : 'Hyperlocal Shopper'}
              </Text>
            </View>
          </View>

          {onCloseSidebar && (
            <TouchableOpacity onPress={onCloseSidebar} style={{ padding: 4 }}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={[styles.desktopNavItem, isActive && styles.desktopNavItemActive]}
                onPress={() => onSelectTab(item.id)}
              >
                <Icon size={20} color={isActive ? '#EA580C' : '#64748B'} />
                <Text style={[styles.desktopNavText, isActive && styles.desktopNavTextActive]}>
                  {item.label}
                </Text>

                {item.badge && (
                  <View style={styles.aiBadge}>
                    <Sparkles size={10} color="#FFFFFF" />
                    <Text style={styles.aiBadgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  // Mobile Bottom Navigation Bar (<768px)
  return (
    <View style={styles.mobileBottomBar}>
      {menuItems.map(item => {
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
              <Icon size={20} color={isActive ? '#EA580C' : '#64748B'} />
            </View>
            <Text style={[styles.mobileTabText, isActive && styles.mobileTabTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  desktopSidebar: {
    width: 250,
    backgroundColor: '#0F172A',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    height: '100%',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  roleSubtext: {
    color: '#94A3B8',
    fontSize: 11,
  },
  menuContainer: {
    gap: 6,
  },
  desktopNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 12,
  },
  desktopNavItemActive: {
    backgroundColor: '#1E293B',
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
  },
  desktopNavText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    flex: 1,
  },
  desktopNavTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
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
    backgroundColor: '#FFF7ED',
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
    color: '#EA580C',
    fontWeight: '800',
  },
});
