import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldCheck, PlusCircle, PackageCheck, ShoppingBag, TrendingUp, Star, Sparkles } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

interface MeeshoSellerHeaderProps {
  activeTab: 'dashboard' | 'add_catalog' | 'manage_catalogs' | 'manage_orders';
  onSelectTab: (tab: 'dashboard' | 'add_catalog' | 'manage_catalogs' | 'manage_orders') => void;
  isDesktop?: boolean;
}

export const MeeshoSellerHeader: React.FC<MeeshoSellerHeaderProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const { sellerProfile, openSellerProfileModal } = useAuth();
  const sellerIdCode = `DigiSewa-SLR-${sellerProfile.id.replace(/[^0-9]/g, '') || '98421'}`;

  return (
    <View style={styles.container}>
      {/* Top Banner with DigiSewa Seller Brand */}
      <View style={styles.topBanner}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={openSellerProfileModal}
          activeOpacity={0.8}
        >
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{sellerProfile.storeName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.storeName}>{sellerProfile.storeName}</Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={13} color="#FFFFFF" />
                <Text style={styles.verifiedText}>DigiSewa Verified Seller</Text>
              </View>
            </View>
            <Text style={styles.sellerIdText}>Seller ID: <Text style={styles.boldId}>{sellerIdCode}</Text></Text>
          </View>
        </TouchableOpacity>

        {/* Quick Add Catalog Action Button */}
        <TouchableOpacity
          style={styles.addCatalogBtn}
          onPress={() => onSelectTab('add_catalog')}
        >
          <PlusCircle size={18} color="#FFFFFF" />
          <Text style={styles.addCatalogBtnText}>+ Add Product Catalog</Text>
        </TouchableOpacity>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View style={[styles.iconBg, { backgroundColor: '#EEF2FF' }]}>
            <Sparkles size={18} color="#6366F1" />
          </View>
          <View>
            <Text style={styles.metricLabel}>Catalog Views</Text>
            <Text style={styles.metricValue}>14,290</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
            <ShoppingBag size={18} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.metricLabel}>Orders Today</Text>
            <Text style={styles.metricValue}>28 Orders</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
            <TrendingUp size={18} color="#059669" />
          </View>
          <View>
            <Text style={styles.metricLabel}>Est. Payout</Text>
            <Text style={styles.metricValue}>₹48,250</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.iconBg, { backgroundColor: '#FFFBEB' }]}>
            <Star size={18} color="#D97706" />
          </View>
          <View>
            <Text style={styles.metricLabel}>Seller Rating</Text>
            <Text style={styles.metricValue}>{sellerProfile.rating || 4.8} ★</Text>
          </View>
        </View>
      </View>

      {/* Navigation Sub-Tabs */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'dashboard' && styles.activeNavTab]}
          onPress={() => onSelectTab('dashboard')}
        >
          <Text style={[styles.navTabText, activeTab === 'dashboard' && styles.activeNavTabText]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'add_catalog' && styles.activeNavTab]}
          onPress={() => onSelectTab('add_catalog')}
        >
          <PlusCircle size={15} color={activeTab === 'add_catalog' ? '#6366F1' : '#64748B'} />
          <Text style={[styles.navTabText, activeTab === 'add_catalog' && styles.activeNavTabText]}>
            Add Clothing Catalog
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'manage_catalogs' && styles.activeNavTab]}
          onPress={() => onSelectTab('manage_catalogs')}
        >
          <PackageCheck size={15} color={activeTab === 'manage_catalogs' ? '#6366F1' : '#64748B'} />
          <Text style={[styles.navTabText, activeTab === 'manage_catalogs' && styles.activeNavTabText]}>
            Manage Catalogs (Sizes/Stock)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'manage_orders' && styles.activeNavTab]}
          onPress={() => onSelectTab('manage_orders')}
        >
          <ShoppingBag size={15} color={activeTab === 'manage_orders' ? '#6366F1' : '#64748B'} />
          <Text style={[styles.navTabText, activeTab === 'manage_orders' && styles.activeNavTabText]}>
            Orders & Shipments
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  topBanner: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  sellerIdText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  boldId: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  addCatalogBtn: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addCatalogBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 140,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  navBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
    overflow: 'hidden',
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeNavTab: {
    borderBottomColor: '#6366F1',
  },
  navTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeNavTabText: {
    color: '#6366F1',
    fontWeight: '700',
  },
});
