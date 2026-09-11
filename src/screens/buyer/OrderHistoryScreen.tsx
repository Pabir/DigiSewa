import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PackageCheck, Clock, MapPin, Truck, CheckCircle2, AlertCircle, LogIn, ArrowLeft } from 'lucide-react-native';
import { Order, OrderStatus } from '../../types';
import { getOrders, updateOrderStatus } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import { WriteReviewModal } from '../../components/reviews/WriteReviewModal';

interface OrderHistoryScreenProps {
  onBack?: () => void;
  onOpenSupport?: (orderId: string) => void;
}

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ onBack, onOpenSupport }) => {
  const { isAuthenticated, openCustomerAuthModal } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewModalData, setReviewModalData] = useState<{
    productId: string;
    sellerId: string;
    productTitle: string;
  } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrderHistory();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, 'cancelled');
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
    } catch (error) {
      console.error('Failed to cancel order', error);
      alert('Failed to cancel the order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return { bg: '#DCFCE7', text: '#15803D', label: 'Delivered' };
      case 'out_for_delivery':
        return { bg: '#DBEAFE', text: '#1D4ED8', label: 'Out for Delivery' };
      case 'reached_hub':
        return { bg: '#E0E7FF', text: '#4338CA', label: 'Reached Hub' };
      case 'shipped':
        return { bg: '#F3E8FF', text: '#7E22CE', label: 'Shipped' };
      case 'processing':
        return { bg: '#FEF3C7', text: '#B45309', label: 'Accepted/Processing' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'Rejected/Cancelled' };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: 'Pending Approval' };
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            {onBack && (
              <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
                <ArrowLeft size={22} color="#4F46E5" />
              </TouchableOpacity>
            )}
            <PackageCheck size={24} color="#4F46E5" />
            <Text style={styles.headerTitle}>My Orders & Hyperlocal Deliveries</Text>
          </View>

          <View style={styles.emptyCard}>
            <AlertCircle size={36} color="#4F46E5" />
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
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#4F46E5" />
          </TouchableOpacity>
        )}
        <PackageCheck size={24} color="#4F46E5" />
        <Text style={styles.headerTitle}>My Orders & Hyperlocal Deliveries</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 30 }} />
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

              {/* Status Message Banner */}
              {order.status === 'processing' && (
                <View style={{ backgroundColor: '#ECFDF5', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#D1FAE5' }}>
                  <Text style={{ color: '#047857', fontSize: 12, fontWeight: '700' }}>
                    ✅ Your order is accepted and being processed.
                  </Text>
                </View>
              )}
              {order.status === 'shipped' && (
                <View style={{ backgroundColor: '#F3E8FF', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#E9D5FF' }}>
                  <Text style={{ color: '#7E22CE', fontSize: 12, fontWeight: '700' }}>
                    🚚 Your order has been dispatched.
                  </Text>
                </View>
              )}
              {order.status === 'reached_hub' && (
                <View style={{ backgroundColor: '#E0E7FF', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#C7D2FE' }}>
                  <Text style={{ color: '#4338CA', fontSize: 12, fontWeight: '700' }}>
                    🏢 Your order has reached the hub nearest to you.
                  </Text>
                </View>
              )}
              {order.status === 'out_for_delivery' && (
                <View style={{ backgroundColor: '#DBEAFE', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#BFDBFE' }}>
                  <Text style={{ color: '#1D4ED8', fontSize: 12, fontWeight: '700' }}>
                    🛵 Your order is out for delivery today!
                  </Text>
                </View>
              )}
              {order.status === 'delivered' && (
                <View style={{ backgroundColor: '#DCFCE7', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#BBF7D0' }}>
                  <Text style={{ color: '#15803D', fontSize: 12, fontWeight: '700' }}>
                    ✅ Your order has been successfully delivered.
                  </Text>
                </View>
              )}
              {order.status === 'cancelled' && (
                <View style={{ backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#FEE2E2' }}>
                  <Text style={{ color: '#B91C1C', fontSize: 12, fontWeight: '700' }}>
                    ❌ Your order could not be processed. Please try after sometime.
                  </Text>
                </View>
              )}

              {/* Order Items List */}
              <View style={styles.itemsBox}>
                {order.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={{flex: 1}}>
                      <Text style={styles.itemName}>
                        {item.quantity}x {item.product.title} {item.product.selectedSize ? `(Size: ${item.product.selectedSize})` : ''}
                      </Text>
                      {order.status === 'delivered' && (
                        <TouchableOpacity
                          style={{ marginTop: 6, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: '#FF6B00', borderRadius: 4 }}
                          onPress={() => setReviewModalData({
                            productId: item.product.id,
                            sellerId: item.product.sellerId,
                            productTitle: item.product.title
                          })}
                        >
                          <Text style={{ color: '#FF6B00', fontSize: 11, fontWeight: '600' }}>Rate & Review</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.itemPrice}>₹{item.product.price * item.quantity}</Text>
                  </View>
                ))}
              </View>

              {/* Order Footer */}
              <View style={styles.orderFooter}>
                <View style={styles.etaRow}>
                  <Truck size={14} color="#4F46E5" />
                  <Text style={styles.etaText}>Delivery: {order.estimatedDelivery}</Text>
                </View>

                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Paid Amount:</Text>
                  <Text style={styles.totalPrice}>₹{order.totalAmount}</Text>
                </View>
              </View>

              {/* Cancel Button */}
              {['pending', 'processing', 'shipped', 'reached_hub', 'out_for_delivery'].includes(order.status) && (
                <TouchableOpacity 
                  style={{
                    marginTop: 12,
                    backgroundColor: '#FEF2F2',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#FECACA'
                  }}
                  onPress={() => handleCancelOrder(order.id)}
                >
                  <Text style={{color: '#B91C1C', fontWeight: 'bold', fontSize: 13}}>Cancel Order</Text>
                </TouchableOpacity>
              )}

              {/* Support Button */}
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  backgroundColor: '#F8FAFC',
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6
                }}
                onPress={() => onOpenSupport && onOpenSupport(order.id)}
              >
                <AlertCircle size={16} color="#4F46E5" />
                <Text style={{color: '#4F46E5', fontWeight: 'bold', fontSize: 13}}>Need Help with this Order?</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      {/* Review Modal */}
      {reviewModalData && (
        <WriteReviewModal
          visible={!!reviewModalData}
          onClose={() => setReviewModalData(null)}
          productId={reviewModalData.productId}
          sellerId={reviewModalData.sellerId}
          productTitle={reviewModalData.productTitle}
          onReviewSubmitted={() => {
            alert('Review submitted successfully!');
          }}
        />
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
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
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
    color: '#4F46E5',
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
    backgroundColor: '#4F46E5',
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
