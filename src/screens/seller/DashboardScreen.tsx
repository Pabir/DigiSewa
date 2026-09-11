import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IndianRupee, ShoppingBag, AlertTriangle, TrendingUp, Sparkles, ShieldCheck, PlusCircle, PackageCheck } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getProducts, getOrders } from '../../services/firebaseService';
import { getSettlementsBySeller } from '../../services/settlementService';
import { Product, Order, Settlement } from '../../types';
import { MeeshoSupplierSidebar } from '../../components/seller/MeeshoSupplierSidebar';
import { MeeshoSupplierHomeScreen } from '../../screens/seller/MeeshoSupplierHomeScreen';
import { CatalogUploadsScreen } from '../../screens/seller/CatalogUploadsScreen';
import { SellerGenericTabScreen } from './SellerGenericTabScreen';

interface DashboardScreenProps {
  onNavigateToAddProduct: () => void;
  onNavigateToManageCatalogs?: () => void;
  onNavigateToOrders: () => void;
  onNavigateTab?: (tab: string) => void;
  isDesktop?: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToAddProduct,
  onNavigateToManageCatalogs,
  onNavigateToOrders,
  onNavigateTab,
  isDesktop = false,
}) => {
  const { sellerProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    loadSellerMetrics();
  }, []);

  const loadSellerMetrics = async () => {
    const [pList, oList] = await Promise.all([getProducts(), getOrders()]);
    setProducts(pList);
    setOrders(oList);
    if (sellerProfile?.id) {
      const sList = await getSettlementsBySeller(sellerProfile.id);
      setSettlements(sList);
    }
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const lowStockItems = products.filter(p => p.stock < 10);
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0) + sellerProfile.totalSales;
  const pendingSettlementTotal = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amountOwed, 0);

  const handleSelectSidebarTab = (tab: string) => {
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else if (tab === 'inventory' && onNavigateToManageCatalogs) {
      onNavigateToManageCatalogs();
    } else if (tab === 'orders') {
      onNavigateToOrders();
    }
  };

  const renderContent = () => {
    if (activeTab === 'home') {
      return (
        <MeeshoSupplierHomeScreen
          onNavigateToAddSingleCatalog={onNavigateToAddProduct}
          onNavigateToManageCatalogs={onNavigateToManageCatalogs || (() => {})}
          onNavigateToOrders={onNavigateToOrders}
          isDesktop={isDesktop}
        />
      );
    }

    if (activeTab === 'catalog_uploads') {
      return (
        <CatalogUploadsScreen
          onNavigateToAddSingleCatalog={onNavigateToAddProduct}
          onNavigateToManageCatalogs={onNavigateToManageCatalogs || (() => {})}
        />
      );
    }

    if (activeTab === 'dashboard' || activeTab === 'overview') {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Quick Action Grid */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => {
              if (sellerProfile?.verificationStatus !== 'verified') {
                const status = sellerProfile?.verificationStatus || 'pending';
                const msg =
                  status === 'rejected'
                    ? '❌ Account Rejected: Your seller application was rejected by Admin. You cannot add or sell products.'
                    : status === 'suspended'
                    ? '⚠️ Account Suspended: Your seller account has been suspended by Admin. You cannot add or sell products.'
                    : '⏳ Approval Pending: Your seller account is awaiting Admin approval. You cannot add or sell products until approved by Admin.';
                alert(msg);
                return;
              }
              onNavigateToAddProduct();
            }}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#FDF2F8' }]}>
              <PlusCircle size={22} color="#E00A67" />
            </View>
            <Text style={styles.actionTitle}>Add DigiSewa Catalog</Text>
            <Text style={styles.actionSubtitle}>Clothing, Chest/Breast/Waist sizes & prices</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={onNavigateToManageCatalogs}>
            <View style={[styles.actionIconBg, { backgroundColor: '#EFF6FF' }]}>
              <PackageCheck size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionTitle}>Manage Size & Stock</Text>
            <Text style={styles.actionSubtitle}>Update Chest/Breast/Waist & stock per size</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={onNavigateToOrders}>
            <View style={[styles.actionIconBg, { backgroundColor: '#ECFDF5' }]}>
              <ShoppingBag size={22} color="#059669" />
            </View>
            <Text style={styles.actionTitle}>Orders & Dispatch</Text>
            <Text style={styles.actionSubtitle}>{pendingOrdersCount} pending orders to pack</Text>
          </TouchableOpacity>
        </View>

        {/* Overview Metric Cards */}
        <View style={[styles.metricsGrid, isDesktop && styles.metricsGridDesktop]}>
          <View style={[styles.metricCard, isDesktop ? styles.metricColDesktop : styles.metricColMobile]}>
            <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
              <IndianRupee size={20} color="#4F46E5" />
            </View>
            <Text style={styles.metricLabel}>Total Store Sales</Text>
            <Text style={styles.metricValue}>₹{totalRevenue.toLocaleString('en-IN')}</Text>

          </View>

          <TouchableOpacity
            style={[styles.metricCard, isDesktop ? styles.metricColDesktop : styles.metricColMobile]}
            onPress={onNavigateToOrders}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <ShoppingBag size={20} color="#D97706" />
            </View>
            <Text style={styles.metricLabel}>Pending & Active Orders</Text>
            <Text style={styles.metricValue}>{pendingOrdersCount} Orders</Text>
            <Text style={styles.subtextAlert}>Requires dispatch</Text>
          </TouchableOpacity>

          <View style={[styles.metricCard, isDesktop ? styles.metricColDesktop : styles.metricColMobile]}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
              <AlertTriangle size={20} color="#DC2626" />
            </View>
            <Text style={styles.metricLabel}>Low Stock Alerts</Text>
            <Text style={styles.metricValue}>{lowStockItems.length} Products</Text>
            <Text style={styles.subtextDanger}>Stock &lt; 10 units</Text>
          </View>

          <View style={[styles.metricCard, isDesktop ? styles.metricColDesktop : styles.metricColMobile]}>
            <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
              <IndianRupee size={20} color="#4F46E5" />
            </View>
            <Text style={styles.metricLabel}>Pending Payouts</Text>
            <Text style={styles.metricValue}>₹{pendingSettlementTotal.toLocaleString('en-IN')}</Text>
            <Text style={styles.subtext}>From delivered orders</Text>
          </View>
          </View>
        </ScrollView>
      );
    }

    return <SellerGenericTabScreen tabKey={activeTab} onBack={() => handleSelectSidebarTab('dashboard')} />;
  };

  return (
    <View style={styles.rootLayout}>
      {isDesktop && (
        <MeeshoSupplierSidebar
          currentTab={activeTab}
          onSelectTab={handleSelectSidebarTab}
          storeName={sellerProfile.storeName}
        />
      )}
      <View style={styles.mainContentArea}>{renderContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  sellerHero: {
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 20,
    gap: 16,
  },
  sellerHeroDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 28,
  },
  storeHeaderCol: {
    flex: 1,
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  storeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  storeTagline: {
    fontSize: 13,
    color: '#94A3B8',
  },
  aiListerCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  aiListerCTAText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricsGridDesktop: {
    marginHorizontal: -8,
  },
  metricColMobile: {
    width: '100%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  metricColDesktop: {
    width: '33.33%',
    paddingHorizontal: 8,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 4,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '700',
  },
  subtextAlert: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
  },
  subtext: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  subtextDanger: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  lowStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  lowStockName: {
    fontSize: 13,
    color: '#7F1D1D',
    fontWeight: '600',
  },
  stockCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  catalogCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catalogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnSmallText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  catalogItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  prodTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  prodCategoryText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  prodPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  prodStockText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  quickActionCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  rootLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
  },
  mainContentArea: {
    flex: 1,
  },
});
