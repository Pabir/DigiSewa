import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { TrendingUp, DollarSign, Activity, AlertCircle, CheckCircle2, X } from 'lucide-react-native';
import { getOrders } from '../../../services/firebaseService';
import { getAllSettlements } from '../../../services/settlementService';
import { Order, Settlement } from '../../../types';

export const FinanceDashboardScreen: React.FC = () => {
  const [metrics, setMetrics] = useState({
    gmv: 0,
    netRevenue: 0,
    unclearedFunds: 0,
    taxLiabilities: 0,
    totalPaid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allSettlements, setAllSettlements] = useState<Settlement[]>([]);
  const [selectedCard, setSelectedCard] = useState<'gmv' | 'revenue' | 'paid' | 'uncleared' | 'tax' | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<Settlement | null>(null);

  const fetchMetrics = async () => {
    try {
      const [orders, settlements] = await Promise.all([
        getOrders(),
        getAllSettlements(),
      ]);

      setAllOrders(orders);
      setAllSettlements(settlements);

      let gmv = 0;
      let netRevenue = 0;
      let unclearedFunds = 0;
      let totalPaid = 0;

      orders.forEach(order => {
        gmv += (order.totalAmount || 0);
      });

      settlements.forEach(s => {
        if (s.status === 'pending') {
          unclearedFunds += s.amountOwed;
        } else if (s.status === 'settled') {
          totalPaid += s.amountOwed;
        }

        const order = orders.find(o => o.id === s.orderId);
        if (order && s.amountOwed > 0) {
          const baseAmount = order.productTotal !== undefined ? order.productTotal : order.totalAmount;
          netRevenue += baseAmount * 0.05; // Base 5% commission calculation
        }
      });

      const taxLiabilities = netRevenue * 0.18; // 18% GST on platform revenue

      setMetrics({
        gmv,
        netRevenue,
        unclearedFunds,
        taxLiabilities,
        totalPaid
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMetrics().finally(() => setLoading(false));
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchMetrics().finally(() => setRefreshing(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const renderModalContent = () => {
    switch(selectedCard) {
      case 'gmv':
        return (
          <ScrollView style={styles.modalScroll}>
            {allOrders.map(order => (
              <TouchableOpacity key={order.id} style={styles.detailRow} onPress={() => setSelectedOrder(order)}>
                <Text style={[styles.detailText, { color: '#4F46E5', textDecorationLine: 'underline' }]}>Order: {order.id}</Text>
                <Text style={styles.detailAmount}>₹{order.totalAmount?.toFixed(2) || '0.00'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
      case 'revenue':
        return (
          <ScrollView style={styles.modalScroll}>
            {allSettlements.filter(s => s.amountOwed > 0).map(s => {
              const order = allOrders.find(o => o.id === s.orderId);
              const baseAmount = order ? (order.productTotal !== undefined ? order.productTotal : order.totalAmount) : 0;
              const comm = baseAmount * 0.05;
              if (comm <= 0) return null;
              return (
                <TouchableOpacity key={s.id} style={styles.detailRow} onPress={() => { if(order) setSelectedOrder(order) }}>
                  <Text style={[styles.detailText, { color: '#4F46E5', textDecorationLine: 'underline' }]}>Commission (Order: {s.orderId})</Text>
                  <Text style={styles.detailAmount}>₹{comm.toFixed(2)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        );
      case 'paid':
        return (
          <ScrollView style={styles.modalScroll}>
            {allSettlements.filter(s => s.status === 'settled').map(s => (
              <TouchableOpacity key={s.id} style={styles.detailRow} onPress={() => setSelectedPayout(s)}>
                <View>
                  <Text style={styles.detailText}>{s.storeName}</Text>
                  <Text style={{fontSize: 12, color: '#4F46E5', textDecorationLine: 'underline'}}>Ref: {s.payoutReference}</Text>
                </View>
                <Text style={styles.detailAmount}>₹{s.amountOwed.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
      case 'uncleared':
        return (
          <ScrollView style={styles.modalScroll}>
            {allSettlements.filter(s => s.status === 'pending').map(s => (
              <TouchableOpacity key={s.id} style={styles.detailRow} onPress={() => { const ord = allOrders.find(o => o.id === s.orderId); if(ord) setSelectedOrder(ord); }}>
                <View>
                  <Text style={styles.detailText}>{s.storeName}</Text>
                  <Text style={{fontSize: 12, color: '#4F46E5', textDecorationLine: 'underline'}}>Order: {s.orderId}</Text>
                </View>
                <Text style={styles.detailAmount}>₹{s.amountOwed.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
      case 'tax':
        return (
          <View style={styles.modalScroll}>
             <View style={styles.detailRow}>
                <Text style={styles.detailText}>GST (18% of Revenue)</Text>
                <Text style={styles.detailAmount}>₹{metrics.taxLiabilities.toFixed(2)}</Text>
              </View>
          </View>
        );
      default: return null;
    }
  };

  const getModalTitle = () => {
    switch(selectedCard) {
      case 'gmv': return 'Total GMV Details';
      case 'revenue': return 'Net Revenue Details';
      case 'paid': return 'Settled Payouts Details';
      case 'uncleared': return 'Uncleared PG Funds Details';
      case 'tax': return 'Tax Liabilities Details';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Finance Dashboard</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        <View style={styles.grid}>
          {/* GMV Card */}
          <TouchableOpacity style={styles.card} onPress={() => setSelectedCard('gmv')}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Total GMV</Text>
              <TrendingUp size={20} color="#10B981" />
            </View>
            <Text style={styles.cardValue}>₹{metrics.gmv.toFixed(2)}</Text>
            <Text style={styles.cardSubtext}>Total GMV across platform</Text>
          </TouchableOpacity>

          {/* Revenue Card */}
          <TouchableOpacity style={styles.card} onPress={() => setSelectedCard('revenue')}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Net Platform Revenue</Text>
              <DollarSign size={20} color="#3B82F6" />
            </View>
            <Text style={styles.cardValue}>₹{metrics.netRevenue.toFixed(2)}</Text>
            <Text style={styles.cardSubtext}>Commission earned</Text>
          </TouchableOpacity>

          {/* Total Paid Card */}
          <TouchableOpacity style={styles.card} onPress={() => setSelectedCard('paid')}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Total Paid to Sellers</Text>
              <CheckCircle2 size={20} color="#15803D" />
            </View>
            <Text style={styles.cardValue}>₹{metrics.totalPaid.toFixed(2)}</Text>
            <Text style={styles.cardSubtext}>Settled payouts</Text>
          </TouchableOpacity>

          {/* Uncleared Funds Card */}
          <TouchableOpacity style={styles.card} onPress={() => setSelectedCard('uncleared')}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Uncleared PG Funds</Text>
              <Activity size={20} color="#F59E0B" />
            </View>
            <Text style={styles.cardValue}>₹{metrics.unclearedFunds.toFixed(2)}</Text>
            <Text style={styles.cardSubtext}>Pending T+2 settlement</Text>
          </TouchableOpacity>

          {/* Tax Liabilities Card */}
          <TouchableOpacity style={styles.card} onPress={() => setSelectedCard('tax')}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Tax Liabilities</Text>
              <AlertCircle size={20} color="#EF4444" />
            </View>
            <Text style={styles.cardValue}>₹{metrics.taxLiabilities.toFixed(2)}</Text>
            <Text style={styles.cardSubtext}>GST, TCS, TDS payable</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={selectedCard !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedCard(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              <TouchableOpacity onPress={() => setSelectedCard(null)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            {renderModalContent()}
          </View>
        </View>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        visible={selectedOrder !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {selectedOrder && (
                <View>
                  <Text style={{fontWeight: 'bold', marginBottom: 5, fontSize: 16}}>Order ID: {selectedOrder.id}</Text>
                  <Text style={{marginBottom: 2}}>Buyer: {selectedOrder.buyerName} ({selectedOrder.buyerPhone})</Text>
                  <Text style={{marginBottom: 2}}>Status: {selectedOrder.status.toUpperCase()}</Text>
                  <Text style={{marginBottom: 2}}>Payment Mode: {selectedOrder.paymentMode.toUpperCase()}</Text>
                  <Text style={{marginBottom: 2}}>Total Amount: ₹{selectedOrder.totalAmount?.toFixed(2)}</Text>
                  <Text style={{marginBottom: 10}}>Date: {new Date(selectedOrder.createdAt).toLocaleString()}</Text>
                  
                  <Text style={{marginTop: 10, fontWeight: 'bold', fontSize: 15, marginBottom: 5}}>Items:</Text>
                  {selectedOrder.items?.map((item, idx) => (
                    <Text key={idx} style={{marginBottom: 2}}>- {item.product?.title || 'Unknown Product'} (x{item.quantity})</Text>
                  ))}
                  
                  <Text style={{marginTop: 10, fontWeight: 'bold', fontSize: 15, marginBottom: 5}}>Shipping Details:</Text>
                  <Text style={{marginBottom: 2}}>Address: {selectedOrder.deliveryAddress}</Text>
                  {selectedOrder.awbCode && <Text style={{marginBottom: 2}}>AWB: {selectedOrder.awbCode}</Text>}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payout Details Modal */}
      <Modal
        visible={selectedPayout !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedPayout(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payout Details</Text>
              <TouchableOpacity onPress={() => setSelectedPayout(null)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {selectedPayout && (
                <View>
                  <Text style={{fontWeight: 'bold', marginBottom: 5, fontSize: 16}}>Payout Ref: {selectedPayout.payoutReference}</Text>
                  <Text style={{marginBottom: 2}}>Store Name: {selectedPayout.storeName}</Text>
                  <Text style={{marginBottom: 2}}>Order ID: {selectedPayout.orderId}</Text>
                  <Text style={{marginBottom: 2}}>Amount: ₹{selectedPayout.amountOwed?.toFixed(2)}</Text>
                  <Text style={{marginBottom: 2}}>Status: {selectedPayout.status.toUpperCase()}</Text>
                  <Text style={{marginBottom: 2}}>Created At: {new Date(selectedPayout.createdAt).toLocaleString()}</Text>
                  {selectedPayout.settledAt && (
                    <Text style={{marginBottom: 2}}>Settled At: {new Date(selectedPayout.settledAt).toLocaleString()}</Text>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  content: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    minWidth: 250,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  cardValue: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  cardSubtext: { fontSize: 12, color: '#94A3B8' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxWidth: 600,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalScroll: {
    flexGrow: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  detailAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});
