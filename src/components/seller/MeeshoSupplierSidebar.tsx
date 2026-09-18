import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  ShoppingBag,
  CircleCheck,
  CreditCard,
  Zap,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';

interface MeeshoSupplierSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onCloseSidebar?: () => void;
  storeName?: string;
}

export const MeeshoSupplierSidebar: React.FC<MeeshoSupplierSidebarProps> = ({
  currentTab,
  onSelectTab,
  onCloseSidebar,
  storeName,
}) => {
  const { openSellerProfileModal, sellerProfile } = useAuth();
  
  const displayStoreName = storeName || sellerProfile?.storeName || 'TafDeal Express Store';

  return (
    <View style={styles.sidebarContainer}>
      {/* Top Store Selector */}
      <TouchableOpacity
        style={styles.storeSelectorBox}
        onPress={openSellerProfileModal}
        activeOpacity={0.8}
      >
        <View style={styles.storeAvatar}>
          <Text style={styles.storeAvatarText}>{displayStoreName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.storeInfoCol}>
          <Text numberOfLines={1} style={styles.storeNameText}>{displayStoreName}</Text>
        </View>
        {onCloseSidebar ? (
          <TouchableOpacity onPress={onCloseSidebar} style={{ padding: 4 }}>
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        ) : (
          <Text style={{ color: '#64748B', fontSize: 12 }}>▼</Text>
        )}
      </TouchableOpacity>

      {/* Notices & Support Row */}
      <View style={styles.quickLinksRow}>
        <TouchableOpacity style={styles.quickLinkBtn}>
          <Sparkles size={13} color="#64748B" />
          <Text style={styles.quickLinkText}>Notices (1)</Text>
        </TouchableOpacity>
        <View style={styles.linkDivider} />
        <TouchableOpacity style={styles.quickLinkBtn}>
          <Sparkles size={13} color="#64748B" />
          <Text style={styles.quickLinkText}>Support</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollNav} showsVerticalScrollIndicator={true}>
        {/* Home Item */}
        <TouchableOpacity
          style={[styles.navItem, currentTab === 'home' && styles.navItemActive]}
          onPress={() => onSelectTab('home')}
        >
          <Sparkles size={18} color={currentTab === 'home' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.navItemText, currentTab === 'home' && styles.navItemTextActive]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* Section: Manage Business */}
        <Text style={styles.sectionHeader}>Manage Business</Text>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'orders' && styles.navItemActive]}
          onPress={() => onSelectTab('orders')}
        >
          <ShoppingBag size={17} color={currentTab === 'orders' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.navItemText, currentTab === 'orders' && styles.navItemTextActive]}>
            Orders
          </Text>
          <View style={styles.badgeNew}>
            <Text style={styles.badgeNewText}>NEW</Text>
          </View>
          <Text style={{ color: '#94A3B8', fontSize: 10, marginLeft: 'auto' }}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'returns' && styles.navItemActive]}
          onPress={() => onSelectTab('returns')}
        >
          <ShoppingBag size={17} color="#64748B" />
          <Text style={styles.navItemText}>Returns</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'pricing' && styles.navItemActive]}
          onPress={() => onSelectTab('pricing')}
        >
          <Sparkles size={17} color="#64748B" />
          <Text style={styles.navItemText}>Pricing</Text>
          <Text style={{ color: '#94A3B8', fontSize: 10, marginLeft: 'auto' }}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'claims' && styles.navItemActive]}
          onPress={() => onSelectTab('claims')}
        >
          <ShieldCheck size={17} color="#64748B" />
          <Text style={styles.navItemText}>Claims</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'inventory' && styles.navItemActive]}
          onPress={() => onSelectTab('inventory')}
        >
          <ShoppingBag size={17} color={currentTab === 'inventory' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.navItemText, currentTab === 'inventory' && styles.navItemTextActive]}>
            Inventory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'catalog_uploads' && styles.navItemActive]}
          onPress={() => onSelectTab('catalog_uploads')}
        >
          <Sparkles size={17} color={currentTab === 'catalog_uploads' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.navItemText, currentTab === 'catalog_uploads' && styles.navItemTextActive]}>
            Catalog Uploads
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'bulk_upload' && styles.navItemActive]}
          onPress={() => onSelectTab('bulk_upload')}
        >
          <ImageIcon size={17} color="#64748B" />
          <Text style={styles.navItemText}>Image Bulk Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'quality' && styles.navItemActive]}
          onPress={() => onSelectTab('quality')}
        >
          <CircleCheck size={17} color="#64748B" />
          <Text style={styles.navItemText}>Quality</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'payments' && styles.navItemActive]}
          onPress={() => onSelectTab('payments')}
        >
          <CreditCard size={17} color="#64748B" />
          <Text style={styles.navItemText}>Payments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'warehouse' && styles.navItemActive]}
          onPress={() => onSelectTab('warehouse')}
        >
          <ShieldCheck size={17} color="#64748B" />
          <Text style={styles.navItemText}>Warehouse</Text>
        </TouchableOpacity>

        {/* Section: Boost Sales */}
        <Text style={styles.sectionHeader}>Boost Sales</Text>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'influencer' && styles.navItemActive]}
          onPress={() => onSelectTab('influencer')}
        >
          <Sparkles size={17} color="#64748B" />
          <Text style={styles.navItemText}>Influencer Marketing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'promotions' && styles.navItemActive]}
          onPress={() => onSelectTab('promotions')}
        >
          <TrendingUp size={17} color="#64748B" />
          <Text style={styles.navItemText}>Promotions</Text>
          <View style={styles.badgeLive}>
            <Text style={styles.badgeLiveText}>Opt-in Live</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'instant_cash' && styles.navItemActive]}
          onPress={() => onSelectTab('instant_cash')}
        >
          <Zap size={17} color="#64748B" />
          <Text style={styles.navItemText}>Instant Cash</Text>
        </TouchableOpacity>

        {/* Section: Performance */}
        <Text style={styles.sectionHeader}>Performance</Text>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'dashboard' && styles.navItemActive]}
          onPress={() => onSelectTab('dashboard')}
        >
          <TrendingUp size={17} color={currentTab === 'dashboard' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.navItemText, currentTab === 'dashboard' && styles.navItemTextActive]}>
            Business Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'reviews' && styles.navItemActive]}
          onPress={() => onSelectTab('reviews')}
        >
          <Sparkles size={17} color={currentTab === 'reviews' ? '#4F46E5' : '#64748B'} />
          <Text style={[styles.navItemText, currentTab === 'reviews' && styles.navItemTextActive]}>
            Customer Reviews
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer TafDeal Seller Panel Branding */}
      <View style={styles.sidebarFooter}>
        <Text style={styles.footerBrand}>
          <Text style={styles.footerMeesho}>TafDeal </Text>Seller Panel
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  storeSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  storeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  storeInfoCol: {
    flex: 1,
  },
  storeNameText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  quickLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  quickLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  quickLinkText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  linkDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
  },
  scrollNav: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 10,
    letterSpacing: 0.5,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 6,
    gap: 10,
    marginVertical: 1,
  },
  navItemActive: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  navItemText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  navItemTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  badgeNew: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 4,
  },
  badgeNewText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  badgeLive: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  badgeLiveText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  sidebarFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  footerBrand: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  footerMeesho: {
    color: '#4F46E5',
    fontWeight: '900',
  },
});
