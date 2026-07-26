import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PackageCheck, Clock, MapPin, ShoppingBag, ArrowRight, CheckCircle, Truck, AlertCircle } from 'lucide-react-native';
import { Order, OrderStatus } from '../../types';
import { getOrders, updateOrderStatus } from '../../services/firebaseService';

export const ManageOrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'processing' | 'out_for_delivery' | 'delivered'>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  };

  const handleAdvanceStatus = async (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'processing';
    if (currentStatus === 'pending') nextStatus = 'processing';
    else if (currentStatus === 'processing') nextStatus = 'out_for_delivery';
    else if (currentStatus === 'out_for_delivery') nextStatus = 'delivered';
    else return;

    await updateOrderStatus(orderId, nextStatus);
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
  };

  const filteredOrders = orders.filter(o => {
    if (activeFilter === 'all') return true;
    return o.status === activeFilter;
  });

  const getNextStatusActionText = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Mark as Processing';
      case 'processing':
        return 'Dispatch (Out for Delivery)';
      case 'out_for_delivery':
        return 'Mark as Delivered';
      case 'delivered':
        return 'Completed';
      default:
        return 'Update Status';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <PackageCheck size={24} color="#EA580C" />
        <Text style={styles.headerTitle}>Order Processing Pipeline</Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'pending', label: 'Pending' },
          { id: 'processing', label: 'Processing' },
          { id: 'out_for_delivery', label: 'Out for Delivery' },
          { id: 'delivered', label: 'Delivered' },
        ].map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterChip, activeFilter === filter.id && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter.id as any)}
          >
            <Text style={[styles.filterText, activeFilter === filter.id && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#EA580C" style={{ marginVertical: 30 }} />
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyCard}>
          <AlertCircle size={32} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No orders in this pipeline stage</Text>
          <Text style={styles.emptySubtext}>Orders from buyers will appear here automatically.</Text>
        </View>
      ) : (
        filteredOrders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            {/* Card Top */}
            <View style={styles.orderCardHeader}>
              <View>
                <Text style={styles.orderIdText}>{order.id}</Text>
                <Text style={styles.buyerNameText}>Buyer: {order.buyerName}</Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
              </View>
            </View>

            {/* Buyer Contact & Delivery Info */}
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <ShoppingBag size={14} color="#64748B" />
                <Text style={styles.infoText}>{order.buyerPhone}</Text>
              </View>

              <View style={styles.infoRow}>
                <MapPin size={14} color="#64748B" />
                <Text numberOfLines={2} style={styles.infoText}>
                  {order.deliveryAddress}
                </Text>
              </View>
            </View>

            {/* Ordered Items List */}
            <View style={styles.itemsBox}>
              {order.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {item.quantity}x {item.product.title}
                  </Text>
                  <Text style={styles.itemPrice}>₹{item.product.price * item.quantity}</Text>
                </View>
              ))}
            </View>

            {/* Pipeline Stage Advance Action */}
            <View style={styles.pipelineFooter}>
              <View>
                <Text style={styles.paymentModeText}>
                  Payment: {order.paymentMode.toUpperCase()} ({order.paymentStatus})
                </Text>
                <Text style={styles.totalPriceText}>Total: ₹{order.totalAmount}</Text>
              </View>

              {order.status !== 'delivered' && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.advanceBtn}
                  onPress={() => handleAdvanceStatus(order.id, order.status)}
                >
                  <Text style={styles.advanceBtnText}>{getNextStatusActionText(order.status)}</Text>
                  <ArrowRight size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  filtersRow: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  buyerNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  statusBadgeText: {
    color: '#EA580C',
    fontSize: 10,
    fontWeight: '800',
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  itemsBox: {
    marginBottom: 12,
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  pipelineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  paymentModeText: {
    fontSize: 11,
    color: '#64748B',
  },
  totalPriceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  advanceBtn: {
    backgroundColor: '#EA580C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  advanceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
