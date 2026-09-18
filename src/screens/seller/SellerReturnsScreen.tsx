import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ArrowLeft, PackageCheck, AlertTriangle, CircleCheck, Search, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getReturnsFromFirestore, updateReturnRequest, getOrders } from '../../services/firebaseService';
import { trackShadowfaxOrder } from '../../services/shadowfaxService';
import { chargeSellerFaultPenalty } from '../../services/settlementService';
import { ReturnItem } from '../../types';
import { Modal, ActivityIndicator } from 'react-native';

interface SellerReturnsScreenProps {
  onBack: () => void;
}

export const SellerReturnsScreen: React.FC<SellerReturnsScreenProps> = ({ onBack }) => {
  const { sellerProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'rto' | 'delivered' | 'claims'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tracking State
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isTrackingModalVisible, setIsTrackingModalVisible] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  React.useEffect(() => {
    const fetchReturns = async () => {
      setIsLoading(true);
      try {
        const data = await getReturnsFromFirestore(sellerProfile?.id);
        
        // The service now handles fetching and mapping Returns accurately 
        // using both sellerId and cross-referencing orderIds
        setReturns(data);
      } catch (err) {
        console.error(err);
        setReturns([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReturns();
  }, [sellerProfile?.id]);

  const handleQCAccept = async (item: ReturnItem) => {
    setIsLoading(true);
    try {
      if (item.returnReason === 'Wrong Item Delivered' || item.returnReason === 'Defective/Damaged') {
        const orders = await getOrders();
        const relatedOrder = orders.find(o => o.id === item.orderId);
        if (relatedOrder) {
          await chargeSellerFaultPenalty(relatedOrder, item);
        }
      }
      await updateReturnRequest(item.id, 'approved', 'passed', 'Seller accepted return');
      setReturns(prev => prev.map(r => r.id === item.id ? { ...r, status: 'approved', qcStatus: 'passed' } : r));
      alert('Return Accepted. Refund will be processed for the buyer.');
    } catch (e) {
      console.error(e);
      alert('Failed to accept return.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQCFail = async (item: ReturnItem) => {
    setIsLoading(true);
    try {
      await updateReturnRequest(item.id, 'qc_failed', 'failed_admin_review', 'Seller claimed buyer fraud/wrong item returned');
      setReturns(prev => prev.map(r => r.id === item.id ? { ...r, status: 'qc_failed', qcStatus: 'failed_admin_review' } : r));
      alert('QC Failed. This return is now paused for Admin review.');
    } catch (e) {
      console.error(e);
      alert('Failed to update QC status.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReturns = returns.filter(item => {
    if (activeTab === 'rto' && item.status !== 'rto_in_transit') return false;
    if (activeTab === 'delivered' && item.status !== 'delivered_to_seller') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.orderId.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: ReturnItem['status']) => {
    switch (status) {
      case 'rto_in_transit':
        return { bg: '#FEF3C7', text: '#B45309', label: 'RTO In-Transit' };
      case 'delivered_to_seller':
        return { bg: '#DCFCE7', text: '#15803D', label: 'Delivered to Store' };
      case 'qc_failed':
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'QC Failed / Damaged' };
      case 'replacement_requested':
        return { bg: '#E0E7FF', text: '#4338CA', label: 'Replacement Sent' };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: status };
    }
  };

  const handleTrackReturn = async (awbNumber: string) => {
    setIsTrackingLoading(true);
    setIsTrackingModalVisible(true);
    try {
      const data = await trackShadowfaxOrder(awbNumber);
      setTrackingData(data);
    } catch (error) {
      console.error(error);
      setTrackingData(null);
    } finally {
      setIsTrackingLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Returns & RTV Tracking</Text>
            <Text style={styles.subtitle}>Track customer returns, RTO shipments & dispute claims</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <PackageCheck size={20} color="#4F46E5" />
            <Text style={styles.metricLabel}>Total Returns</Text>
            <Text style={styles.metricValue}>{returns.length} Items</Text>
          </View>
          <View style={styles.metricCard}>
            <AlertTriangle size={20} color="#D97706" />
            <Text style={styles.metricLabel}>In-Transit (RTO)</Text>
            <Text style={styles.metricValue}>{returns.filter(r => r.status === 'rto_in_transit').length} Packages</Text>
          </View>
          <View style={styles.metricCard}>
            <CircleCheck size={20} color="#16A34A" />
            <Text style={styles.metricLabel}>Delivered</Text>
            <Text style={styles.metricValue}>{returns.filter(r => r.status === 'delivered_to_seller').length} Packages</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {[
            { id: 'all', label: 'All Returns' },
            { id: 'rto', label: 'RTO In-Transit' },
            { id: 'delivered', label: 'Delivered' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterChip, activeTab === tab.id && styles.filterChipActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text style={[styles.filterText, activeTab === tab.id && styles.filterTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search return ID, order ID, product name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Returns List */}
        {filteredReturns.map(item => {
          const badge = getStatusBadge(item.status);
          return (
            <View key={item.id} style={styles.returnCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.returnIdText}>{item.id}</Text>
                  <Text style={styles.orderIdText}>Order #{item.orderId}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                </View>
              </View>

              <Text style={styles.productName}>{item.productName}</Text>
              <Text style={styles.reasonText}>Reason: {item.returnReason}</Text>
              <Text style={[styles.reasonText, { fontWeight: '600', color: item.returnAction === 'refund' ? '#EA580C' : '#059669', marginTop: 4 }]}>
                Action Requested: {item.returnAction === 'refund' ? 'Refund' : (item.returnAction === 'replace' ? 'Replacement' : 'N/A')}
              </Text>
              
              {item.awbCode && (
                <View style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>Reverse AWB Number</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>{item.awbCode}</Text>
                  </View>
                  <TouchableOpacity 
                    style={{ backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                    onPress={() => handleTrackReturn(item.awbCode!)}
                  >
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>Track Status</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.customerText}>Buyer: {item.customerName} • {item.returnDate}</Text>
                <Text style={styles.amountText}>₹{item.amount}</Text>
              </View>

              {item.status === 'delivered_to_seller' && (
                <View style={styles.qcActionContainer}>
                  <TouchableOpacity 
                    style={[styles.qcBtn, { backgroundColor: '#DCFCE7', borderColor: '#22C55E' }]}
                    onPress={() => handleQCAccept(item)}
                  >
                    <CircleCheck size={16} color="#15803D" />
                    <Text style={[styles.qcBtnText, { color: '#15803D' }]}>Accept Return (QC Pass)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.qcBtn, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}
                    onPress={() => handleQCFail(item)}
                  >
                    <AlertTriangle size={16} color="#B91C1C" />
                    <Text style={[styles.qcBtnText, { color: '#B91C1C' }]}>Fail QC</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Tracking Modal */}
      <Modal visible={isTrackingModalVisible} transparent animationType="slide" onRequestClose={() => setIsTrackingModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Tracking Details</Text>
              <TouchableOpacity onPress={() => setIsTrackingModalVisible(false)} style={{ padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20 }}>
                <Text style={{ fontSize: 14, color: '#64748B', fontWeight: 'bold' }}>X</Text>
              </TouchableOpacity>
            </View>

            {isTrackingLoading ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 40 }} />
            ) : trackingData ? (
              <ScrollView>
                <View style={{ backgroundColor: '#EEF2FF', padding: 16, borderRadius: 12, marginBottom: 20 }}>
                  <Text style={{ fontSize: 12, color: '#4F46E5', fontWeight: '600' }}>Current Status</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#3730A3', marginTop: 4 }}>{trackingData.status || 'Unknown'}</Text>
                  {trackingData.location && (
                    <Text style={{ fontSize: 13, color: '#4338CA', marginTop: 4 }}>📍 {trackingData.location}</Text>
                  )}
                </View>

                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 12 }}>Tracking History</Text>
                {trackingData.tracking_history?.map((event: any, index: number) => (
                  <View key={index} style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: index === 0 ? '#4F46E5' : '#CBD5E1' }} />
                      {index !== trackingData.tracking_history.length - 1 && (
                        <View style={{ width: 2, height: 40, backgroundColor: '#E2E8F0', marginTop: 4 }} />
                      )}
                    </View>
                    <View style={{ flex: 1, paddingBottom: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: index === 0 ? '#0F172A' : '#475569' }}>{event.status}</Text>
                      {event.location && <Text style={{ fontSize: 12, color: '#64748B' }}>{event.location}</Text>}
                      {event.remarks && <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{event.remarks}</Text>}
                      <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                        {new Date(event.date).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={{ textAlign: 'center', color: '#EF4444', marginVertical: 20 }}>Failed to load tracking data.</Text>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  scrollBody: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  metricsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metricCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: { fontSize: 11, color: '#64748B', marginTop: 6 },
  metricValue: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  filterText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 13, color: '#0F172A' },
  returnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  returnIdText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  orderIdText: { fontSize: 11, color: '#64748B' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  productName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  reasonText: { fontSize: 12, color: '#64748B' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  customerText: { fontSize: 11, color: '#94A3B8' },
  amountText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  qcActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  qcBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    gap: 6,
  },
  qcBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
