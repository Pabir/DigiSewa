import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PackageCheck, Clock, MapPin, Truck, CheckCircle2, AlertCircle, LogIn } from 'lucide-react-native';
import { Order, OrderStatus } from '../../types';
import { getOrders } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';

export const OrderHistoryScreen: React.FC = () => {
  const { isAuthenticated, openCustomerAuthModal } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrderHistory();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchOrderHistory = async () => {
    setLoading(true);
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return { bg: '#DCFCE7', text: '#15803D', label: 'Delivered' };
      case 'out_for_delivery':
        return { bg: '#DBEAFE', text: '#1D4ED8', label: 'Out for Delivery' };
      case 'processing':
        return { bg: '#FEF3C7', text: '#B45309', label: 'Processing' };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: 'Order Placed' };
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <PackageCheck size={24} color="#EA580C" />
            <Text style={styles.headerTitle}>My Orders & Hyperlocal Deliveries</Text>
          </View>

          <View style={styles.emptyCard}>
            <AlertCircle size={36} color="#EA580C" />
            <Text style={styles.emptyTitle}>Login Required</Text>
            <Text style={styles.emptyText}>Please login to view your order history and track deliveries.</Text>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => openCustomerAuthModal('orders')}
              activeOpacity={0.85}
            >
              <LogIn size={16} color="#FFFFFF" />
              <Text style={styles.loginBtnText}>Login / Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <PackageCheck size={24} color="#EA580C" />
        <Text style={styles.headerTitle}>My Orders & Hyperlocal Deliveries</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#EA580C" style={{ marginVertical: 30 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <AlertCircle size={32} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No orders placed yet</Text>
          <Text style={styles.emptyText}>Your active and completed purchases will appear here.</Text>
        </View>
      ) : (
        orders.map(order => {
          const statusStyle = getStatusBadgeStyle(order.status);
          return (
            <View key={order.id} style={styles.orderCard}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderIdText}>{order.id}</Text>
                  <Text style={styles.dateText}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <View style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusChipText, { color: statusStyle.text }]}>
                    {statusStyle.label}
                  </Text>
                </View>
              </View>

              {/* Delivery Address */}
              <View style={styles.addressRow}>
                <MapPin size={14} color="#64748B" />
                <Text numberOfLines={1} style={styles.addressText}>
                  {order.deliveryAddress}
                </Text>
              </View>

              {/* Order Items List */}
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

              {/* Order Footer */}
              <View style={styles.orderFooter}>
                <View style={styles.etaRow}>
                  <Truck size={14} color="#EA580C" />
                  <Text style={styles.etaText}>Delivery: {order.estimatedDelivery}</Text>
                </View>

                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Paid Amount:</Text>
                  <Text style={styles.totalPrice}>₹{order.totalAmount}</Text>
                </View>
              </View>
            </View>
          );
        })
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
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptyText: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  itemsBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EA580C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
