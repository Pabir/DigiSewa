import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { getOrders, getSellersFromFirestore } from '../../../services/firebaseService';
import { getAllSettlements } from '../../../services/settlementService';
import { Order, Settlement, Seller } from '../../../types';
import { 
  Store, 
  TrendingUp, 
  Banknote, 
  Wallet, 
  Landmark, 
  Receipt,
  X,
  ChevronRight,
  Package,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react-native';

interface SellerFinanceData {
  sellerId: string;
  storeName: string;
  totalGmv: number;
  netRevenue: number;
  totalPaid: number;
  unclearedFunds: number;
  taxLiabilities: number;
}

export const SellerWiseFinanceScreen: React.FC = () => {
  const [sellerData, setSellerData] = useState<SellerFinanceData[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allSettlements, setAllSettlements] = useState<Settlement[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<{ seller: SellerFinanceData, metric: 'gmv' | 'revenue' | 'paid' | 'uncleared' | 'tax' | 'all' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [orders, settlements, sellers] = await Promise.all([
        getOrders(),
        getAllSettlements(),
        getSellersFromFirestore(),
      ]);

      setAllOrders(orders);
      setAllSettlements(settlements);

      const dataMap = new Map<string, SellerFinanceData>();

      // Initialize with all sellers
      sellers.forEach((seller: Seller) => {
        if (!seller || !seller.id) return;
        dataMap.set(seller.id, {
          sellerId: seller.id,
          storeName: seller.storeName || 'Unknown Store',
          totalGmv: 0,
          netRevenue: 0,
          totalPaid: 0,
          unclearedFunds: 0,
          taxLiabilities: 0,
        });
      });

      // Calculate GMV and basic order metrics
      orders.forEach(order => {
        if (!order) return;
        const orderSellerId = order.items?.[0]?.product?.sellerId; // Assuming one seller per order
        if (orderSellerId) {
          if (!dataMap.has(orderSellerId)) {
            dataMap.set(orderSellerId, {
              sellerId: orderSellerId,
              storeName: order.items?.[0]?.product?.sellerName || 'Unknown Store',
              totalGmv: 0,
              netRevenue: 0,
              totalPaid: 0,
              unclearedFunds: 0,
              taxLiabilities: 0,
            });
          }
          const sellerStats = dataMap.get(orderSellerId)!;
          sellerStats.totalGmv += (order.totalAmount || 0);
        }
      });

      // Calculate settlements and revenue
      settlements.forEach(s => {
        if (!s || !s.sellerId) return;
        if (!dataMap.has(s.sellerId)) {
            dataMap.set(s.sellerId, {
              sellerId: s.sellerId,
              storeName: s.storeName || 'Unknown Store',
              totalGmv: 0,
              netRevenue: 0,
              totalPaid: 0,
              unclearedFunds: 0,
              taxLiabilities: 0,
            });
        }
        
        const sellerStats = dataMap.get(s.sellerId)!;

        if (s.status === 'pending') {
          sellerStats.unclearedFunds += (s.amountOwed || 0);
        } else if (s.status === 'settled') {
          sellerStats.totalPaid += (s.amountOwed || 0);
        }

        const order = orders.find(o => o?.id === s.orderId);
        if (order && (s.amountOwed || 0) > 0) {
          const baseAmount = order.productTotal !== undefined ? order.productTotal : (order.totalAmount || 0);
          sellerStats.netRevenue += (baseAmount || 0) * 0.05; // Base 5% commission calculation
        }
      });

      // Calculate tax liabilities
      dataMap.forEach(stats => {
          stats.taxLiabilities = (stats.netRevenue || 0) * 0.18; // 18% GST on platform revenue
      });

      setSellerData(Array.from(dataMap.values()));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Wallet color="#4F46E5" size={28} style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.title}>Seller-wise Financials</Text>
            <Text style={styles.subtitle}>Track revenue, payouts, and liabilities across all sellers</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {sellerData.map(seller => (
          <View 
            key={seller.sellerId} 
            style={styles.card} 
          >
            <View style={styles.cardHeader}>
              <View style={styles.storeInfo}>
                <View style={styles.storeIconContainer}>
                  <Store color="#4F46E5" size={20} />
                </View>
                <Text style={styles.storeName}>{seller.storeName}</Text>
              </View>
              <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => setSelectedSeller({ seller, metric: 'all' })}>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <ChevronRight color="#64748B" size={16} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.grid}>
                <TouchableOpacity style={[styles.statBox, styles.statBoxPrimary]} onPress={() => setSelectedSeller({ seller, metric: 'gmv' })}>
                    <View style={styles.statLabelRow}>
                      <TrendingUp size={14} color="#64748B" />
                      <Text style={styles.statLabel}>Total GMV</Text>
                    </View>
                    <Text style={[styles.statValue, { color: '#0F172A' }]} numberOfLines={1} adjustsFontSizeToFit>₹{(seller.totalGmv || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statBox} onPress={() => setSelectedSeller({ seller, metric: 'revenue' })}>
                    <View style={styles.statLabelRow}>
                      <ArrowUpRight size={14} color="#3B82F6" />
                      <Text style={styles.statLabel}>Platform Revenue</Text>
                    </View>
                    <Text style={[styles.statValue, {color: '#3B82F6'}]} numberOfLines={1} adjustsFontSizeToFit>₹{(seller.netRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statBox} onPress={() => setSelectedSeller({ seller, metric: 'paid' })}>
                    <View style={styles.statLabelRow}>
                      <Banknote size={14} color="#10B981" />
                      <Text style={styles.statLabel}>Paid Payouts</Text>
                    </View>
                    <Text style={[styles.statValue, {color: '#10B981'}]} numberOfLines={1} adjustsFontSizeToFit>₹{(seller.totalPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statBox} onPress={() => setSelectedSeller({ seller, metric: 'uncleared' })}>
                    <View style={styles.statLabelRow}>
                      <Clock size={14} color="#F59E0B" />
                      <Text style={styles.statLabel}>Uncleared Funds</Text>
                    </View>
                    <Text style={[styles.statValue, {color: '#F59E0B'}]} numberOfLines={1} adjustsFontSizeToFit>₹{(seller.unclearedFunds || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.statBox} onPress={() => setSelectedSeller({ seller, metric: 'tax' })}>
                    <View style={styles.statLabelRow}>
                      <Landmark size={14} color="#EF4444" />
                      <Text style={styles.statLabel}>Tax Liab. (GST 18%)</Text>
                    </View>
                    <Text style={[styles.statValue, {color: '#EF4444'}]} numberOfLines={1} adjustsFontSizeToFit>₹{(seller.taxLiabilities || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </TouchableOpacity>
            </View>
          </View>
        ))}
        {sellerData.length === 0 && (
          <View style={styles.emptyState}>
            <Receipt color="#CBD5E1" size={48} />
            <Text style={styles.emptyStateText}>No seller financial data found.</Text>
          </View>
        )}
      </ScrollView>

      {/* Seller Details Modal */}
      {selectedSeller && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.storeIconContainer, { backgroundColor: '#EEF2FF', marginRight: 12 }]}>
                  <Store color="#4F46E5" size={24} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>{selectedSeller.seller.storeName}</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedSeller.metric === 'all' ? 'Financial Details Overview' : 
                     selectedSeller.metric === 'gmv' ? 'Total GMV Breakdown' : 
                     selectedSeller.metric === 'revenue' ? 'Platform Revenue Details' : 
                     selectedSeller.metric === 'paid' ? 'Paid Payouts History' : 
                     selectedSeller.metric === 'uncleared' ? 'Uncleared Funds Overview' : 
                     'Tax Liabilities Breakdown'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedSeller(null)}>
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              
              {(selectedSeller.metric === 'gmv' || selectedSeller.metric === 'all') && (
                <>
                  <View style={styles.sectionHeader}>
                    <Package size={18} color="#4F46E5" />
                    <Text style={styles.sectionTitle}>
                      {selectedSeller.metric === 'gmv' ? 'GMV Breakdown (Orders)' : 'Orders'} ({allOrders.filter(o => o && o.items?.[0]?.product?.sellerId === selectedSeller.seller.sellerId).length})
                    </Text>
                  </View>
                  <View style={styles.listContainer}>
                    {allOrders.filter(o => o && o.items?.[0]?.product?.sellerId === selectedSeller.seller.sellerId).map((order, index, arr) => (
                      <View key={order.id} style={[styles.detailRow, index === arr.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={styles.detailRowLeft}>
                          <View style={styles.orderIconWrapper}>
                            <Receipt size={16} color="#64748B" />
                          </View>
                          <View>
                            <Text style={styles.detailText}>Order #{order.id?.substring(0, 8) || '...'}</Text>
                            <Text style={styles.detailSubText}>Total Amount</Text>
                          </View>
                        </View>
                        <Text style={styles.detailAmount}>₹{Number(order.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                      </View>
                    ))}
                    {allOrders.filter(o => o && o.items?.[0]?.product?.sellerId === selectedSeller.seller.sellerId).length === 0 && <Text style={{padding: 16, color: '#64748B'}}>No orders found.</Text>}
                  </View>
                </>
              )}

              {(selectedSeller.metric === 'revenue' || selectedSeller.metric === 'tax') && (
                <>
                  <View style={styles.sectionHeader}>
                    {selectedSeller.metric === 'revenue' ? <ArrowUpRight size={18} color="#3B82F6" /> : <Landmark size={18} color="#EF4444" />}
                    <Text style={[styles.sectionTitle, { color: selectedSeller.metric === 'revenue' ? '#3B82F6' : '#EF4444' }]}>
                      {selectedSeller.metric === 'revenue' ? 'Platform Revenue Breakdown' : 'Tax Liabilities (GST 18%)'}
                    </Text>
                  </View>
                  <View style={styles.listContainer}>
                    {allSettlements.filter(s => s && s.sellerId === selectedSeller.seller.sellerId && (s.amountOwed || 0) > 0).map((s, index, arr) => {
                      const order = allOrders.find(o => o?.id === s.orderId);
                      const baseAmount = order?.productTotal !== undefined ? order.productTotal : (order?.totalAmount || 0);
                      const rev = baseAmount * 0.05;
                      const tax = rev * 0.18;
                      const displayAmount = selectedSeller.metric === 'revenue' ? rev : tax;
                      
                      return (
                        <View key={s.id} style={[styles.detailRow, index === arr.length - 1 && { borderBottomWidth: 0 }]}>
                          <View style={styles.detailRowLeft}>
                            <View style={styles.orderIconWrapper}>
                              <Receipt size={16} color="#64748B" />
                            </View>
                            <View>
                              <Text style={styles.detailText}>Order #{s.orderId?.substring(0, 8)}</Text>
                              <Text style={styles.detailSubText}>{selectedSeller.metric === 'revenue' ? '5% Commission' : '18% GST on Commission'}</Text>
                            </View>
                          </View>
                          <Text style={styles.detailAmount}>₹{Number(displayAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                        </View>
                      )
                    })}
                    {allSettlements.filter(s => s && s.sellerId === selectedSeller.seller.sellerId && (s.amountOwed || 0) > 0).length === 0 && <Text style={{padding: 16, color: '#64748B'}}>No revenue data.</Text>}
                  </View>
                </>
              )}

              {(selectedSeller.metric === 'paid' || selectedSeller.metric === 'uncleared' || selectedSeller.metric === 'all') && (
                <>
                  <View style={styles.sectionHeader}>
                    <Banknote size={18} color="#10B981" />
                    <Text style={[styles.sectionTitle, { color: '#10B981' }]}>
                      {selectedSeller.metric === 'paid' ? 'Paid Payouts' : selectedSeller.metric === 'uncleared' ? 'Uncleared Funds' : 'Settlements'}
                    </Text>
                  </View>
                  <View style={styles.listContainer}>
                    {allSettlements.filter(s => s && s.sellerId === selectedSeller.seller.sellerId && (selectedSeller.metric === 'paid' ? s.status === 'settled' : selectedSeller.metric === 'uncleared' ? s.status === 'pending' : true)).map((s, index, arr) => (
                      <View key={s.id} style={[styles.detailRow, index === arr.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={styles.detailRowLeft}>
                           <View style={[styles.orderIconWrapper, { backgroundColor: s.status === 'settled' ? '#D1FAE5' : '#FEF3C7' }]}>
                             {s.status === 'settled' ? <CheckCircle2 size={16} color="#10B981" /> : <Clock size={16} color="#D97706" />}
                           </View>
                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.detailText}>{(s.status || 'unknown').toUpperCase()}</Text>
                              <View style={[styles.statusBadge, { backgroundColor: s.status === 'settled' ? '#10B981' : '#F59E0B' }]}>
                                <Text style={styles.statusBadgeText}>{s.status === 'settled' ? 'Paid' : 'Pending'}</Text>
                              </View>
                            </View>
                            <Text style={styles.detailSubText}>Order: #{s.orderId?.substring(0, 8)}</Text>
                          </View>
                        </View>
                        <Text style={styles.detailAmount}>₹{Number(s.amountOwed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
                      </View>
                    ))}
                    {allSettlements.filter(s => s && s.sellerId === selectedSeller.seller.sellerId && (selectedSeller.metric === 'paid' ? s.status === 'settled' : selectedSeller.metric === 'uncleared' ? s.status === 'pending' : true)).length === 0 && <Text style={{padding: 16, color: '#64748B'}}>No settlements found.</Text>}
                  </View>
                </>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: { 
    padding: 24, 
    paddingTop: 32,
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    } : {
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
    zIndex: 10,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  content: { 
    flex: 1 
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      transition: 'all 0.2s ease-in-out',
    } : {
      elevation: 2,
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    }),
  },
  cardHeader: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeName: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginRight: 4,
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 12,
  },
  statBox: {
    flex: 1,
    minWidth: 200,
    margin: 8,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxPrimary: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  statLabel: { 
    fontSize: 13, 
    color: '#64748B', 
    fontWeight: '600' 
  },
  statValue: { 
    fontSize: 18, 
    fontWeight: '800', 
    letterSpacing: -0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(4px)',
    } : {}),
  },
  modalContent: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    width: '90%',
    maxWidth: 700,
    maxHeight: '85%',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    } : {
      elevation: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flexGrow: 1,
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: -0.3,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
  },
  detailSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  detailAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  }
});
