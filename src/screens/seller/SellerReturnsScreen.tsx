import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ArrowLeft, PackageCheck, AlertTriangle, CheckCircle2, Search, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getReturnsFromFirestore } from '../../services/firebaseService';
import { ReturnItem } from '../../types';

interface SellerReturnsScreenProps {
  onBack: () => void;
}

export const SellerReturnsScreen: React.FC<SellerReturnsScreenProps> = ({ onBack }) => {
  const { sellerProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'rto' | 'delivered' | 'claims'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
            <CheckCircle2 size={20} color="#16A34A" />
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

              <View style={styles.cardFooter}>
                <Text style={styles.customerText}>Buyer: {item.customerName} • {item.returnDate}</Text>
                <Text style={styles.amountText}>₹{item.amount}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  customerText: { fontSize: 11, color: '#94A3B8' },
  amountText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
});
