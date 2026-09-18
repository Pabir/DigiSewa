import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { AdminCustomer } from '../../types/adminTypes';
import { Search, IndianRupee, AlertTriangle, CircleCheck } from 'lucide-react-native';

interface AdminCustomerManagementScreenProps {
  onUpdateWalletBalance: (customerId: string, newBalance: number) => void;
  onToggleBlockUser: (customerId: string) => void;
}

import { getUsersPaginated } from '../../services/firebaseService';
import { ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

export const AdminCustomerManagementScreen: React.FC<AdminCustomerManagementScreenProps> = ({
  onUpdateWalletBalance,
  onToggleBlockUser,
}) => {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  React.useEffect(() => {
    fetchCustomers(false);
  }, []);

  const fetchCustomers = async (loadMore = false) => {
    if (loadMore) {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    } else {
      setLoading(true);
      setLastVisible(null);
    }

    try {
      const startAfterDoc = loadMore ? lastVisible : null;
      const { users, lastDoc } = await getUsersPaginated(startAfterDoc, 20);
      
      const customerUsers = users.filter(u => u.role === 'customer' || u.role === 'buyer' || u.role === 'guest');
      
      const mappedCustomers: AdminCustomer[] = await Promise.all(customerUsers.map(async (u) => {
        let totalOrders = 0;
        let totalSpent = 0;
        let orders: any[] = [];
        try {
          const q = query(collection(db, 'orders'), where('buyerId', '==', u.id));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach(docSnap => {
            const orderData = docSnap.data();
            orders.push({ id: docSnap.id, ...orderData });
            totalOrders++;
            totalSpent += (orderData.totalAmount || 0);
          });
          // Sort orders by createdAt descending
          orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (err) {
          console.warn("Error fetching orders for user", u.id, err);
        }

        return {
          id: u.id,
          name: u.name || 'Unknown',
          email: u.email || 'N/A',
          phone: u.phone || 'N/A',
          city: 'N/A',
          state: 'N/A',
          walletBalance: 0,
          totalOrders,
          totalSpent,
          orders,
          status: 'active',
          registeredDate: new Date().toISOString().split('T')[0],
          lastActive: new Date().toISOString().split('T')[0]
        };
      }));

      setLastVisible(lastDoc);
      if (users.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      setCustomers(prev => loadMore ? [...prev, ...mappedCustomers] : mappedCustomers);
    } catch (err) {
      console.error(err);
    } finally {
      if (loadMore) setLoadingMore(false);
      else setLoading(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [refundAmountInput, setRefundAmountInput] = useState<string>('200');
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [selectedCustomerForOrders, setSelectedCustomerForOrders] = useState<AdminCustomer | null>(null);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.screenTitle}>Customer Management & Wallet Controls</Text>
          <Text style={styles.screenSub}>
            Monitor customer accounts, wallet balances, order history, and account restrictions.
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={16} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Customer by Name, Email, Phone or City..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Customer Table */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 720 }}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.5 }]}>Customer Profile</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Location & Phone</Text>
                <Text style={[styles.th, { flex: 1 }]}>Total Orders</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Total Spent / Wallet</Text>
                <Text style={[styles.th, { flex: 1 }]}>Status</Text>
                <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>Actions</Text>
              </View>

              {filteredCustomers.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No customers found matching search query.</Text>
                </View>
              ) : (
                filteredCustomers.map((cust) => (
                  <View key={cust.id} style={styles.tableRow}>
                    {/* Profile */}
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.nameText}>{cust.name}</Text>
                      <Text style={styles.emailText}>{cust.email}</Text>
                      <Text style={styles.subText}>Registered: {cust.registeredDate}</Text>
                    </View>

                    {/* Location */}
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.phoneText}>📞 {cust.phone}</Text>
                      <Text style={styles.subText}>{cust.city}, {cust.state}</Text>
                    </View>

                    {/* Orders */}
                    <View style={{ flex: 1 }}>
                      <TouchableOpacity onPress={() => setSelectedCustomerForOrders(cust)}>
                        <Text style={[styles.boldNum, { color: '#4338CA', textDecorationLine: 'underline' }]}>
                          {cust.totalOrders} Orders
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Spent / Wallet */}
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.boldSpent}>₹{cust.totalSpent.toLocaleString('en-IN')} Spent</Text>
                      <Text style={styles.walletText}>Wallet Balance: ₹{cust.walletBalance}</Text>
                    </View>

                    {/* Status */}
                    <View style={{ flex: 1 }}>
                      {cust.status === 'active' ? (
                        <View style={styles.badgeActive}>
                          <Text style={styles.badgeActiveText}>Active</Text>
                        </View>
                      ) : (
                        <View style={styles.badgeBlocked}>
                          <Text style={styles.badgeBlockedText}>Blocked</Text>
                        </View>
                      )}
                    </View>

                    {/* Actions */}
                    <View style={{ flex: 1.5, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                      <TouchableOpacity
                        style={styles.walletBtn}
                        onPress={() => {
                          setSelectedCustomer(cust);
                          setShowWalletModal(true);
                        }}
                      >
                        <Text style={styles.walletBtnText}>+ Wallet Refund</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.blockBtn, cust.status === 'blocked' && styles.unblockBtn]}
                        onPress={() => onToggleBlockUser(cust.id)}
                      >
                        <Text style={[styles.blockBtnText, cust.status === 'blocked' && styles.unblockBtnText]}>
                          {cust.status === 'blocked' ? 'Unblock' : 'Block'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
              
              {hasMore && customers.length > 0 && (
                <TouchableOpacity 
                  style={{ padding: 16, alignItems: 'center', backgroundColor: '#F8FAFC', borderTopWidth: 1, borderColor: '#E2E8F0' }}
                  onPress={() => fetchCustomers(true)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                  ) : (
                    <Text style={{ color: '#4F46E5', fontWeight: '600' }}>Load More Customers</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Orders Modal */}
      {selectedCustomerForOrders && (
        <Modal transparent animationType="slide" visible={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: 600, maxHeight: '80%' }]}>
              <Text style={styles.modalTitle}>{selectedCustomerForOrders.name}'s Orders</Text>
              <Text style={styles.modalSub}>
                Viewing complete order history for this customer.
              </Text>

              <ScrollView style={{ marginTop: 10, marginBottom: 20 }}>
                {selectedCustomerForOrders.orders && selectedCustomerForOrders.orders.length > 0 ? (
                  selectedCustomerForOrders.orders.map((order, index) => (
                    <View key={order.id || index} style={{ padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 13 }}>Order #{order.id}</Text>
                        <Text style={{ fontWeight: 'bold', color: order.deliveryStatus === 'delivered' ? '#059669' : '#D97706', fontSize: 12 }}>
                          {order.fulfillmentStatus === 'cancelled' ? 'CANCELLED' : (order.deliveryStatus ? order.deliveryStatus.toUpperCase() : (order.fulfillmentStatus ? order.fulfillmentStatus.toUpperCase() : 'PENDING'))}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: '#475569', marginBottom: 2 }}>
                        Amount: ₹{order.productTotal || (order.totalAmount - (order.shippingFee || 0))} (Items) + ₹{order.shippingFee || 0} ({order.shippingFee === 0 || order.sellerOffersFreeShipping ? 'Free Shipping' : 'Shipping'}) = <Text style={{fontWeight: 'bold', color: '#0F172A'}}>₹{order.totalAmount}</Text>
                      </Text>
                      <Text style={{ fontSize: 12, color: '#475569', marginBottom: order.razorpayPaymentId ? 2 : 6 }}>Date: {new Date(order.createdAt).toLocaleDateString()}</Text>
                      {order.razorpayPaymentId && (
                        <Text style={{ fontSize: 12, color: '#4338CA', marginBottom: 6, fontWeight: '600' }}>
                          Payment ID: {order.razorpayPaymentId}
                        </Text>
                      )}
                      
                      {order.items && order.items.map((item: any, i: number) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                          {item.product?.imageUrl ? (
                            <Image 
                              source={{ uri: item.product.imageUrl }} 
                              style={{ width: 32, height: 32, borderRadius: 4, marginRight: 8, backgroundColor: '#F1F5F9' }} 
                            />
                          ) : (
                            <View style={{ width: 32, height: 32, borderRadius: 4, backgroundColor: '#E2E8F0', marginRight: 8, justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{ fontSize: 10, color: '#94A3B8' }}>No Img</Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: '#334155', fontWeight: '500' }}>
                              {item.product?.title}
                            </Text>
                            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                              ID: {item.product?.id} | Qty: {item.quantity} {item.product?.selectedSize ? `| Size: ${item.product.selectedSize}` : ''}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', padding: 20 }}>
                    No orders found for this customer.
                  </Text>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedCustomerForOrders(null)}>
                  <Text style={styles.cancelBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Wallet Credit Refund Modal */}
      {showWalletModal && selectedCustomer && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Issue Wallet Refund / Credit</Text>
              <Text style={styles.modalSub}>
                Adding wallet credits to {selectedCustomer.name}'s TafDeal Wallet.
              </Text>

              <View style={styles.currentWalletCard}>
                <Text style={styles.currentWalletLabel}>Current Wallet Balance:</Text>
                <Text style={styles.currentWalletVal}>₹{selectedCustomer.walletBalance}</Text>
              </View>

              <Text style={styles.fieldLabel}>Amount to Credit (₹)</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={refundAmountInput}
                onChangeText={setRefundAmountInput}
                placeholder="Enter credit amount in ₹"
              />

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWalletModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmCreditBtn}
                  onPress={() => {
                    const creditAmount = parseFloat(refundAmountInput) || 0;
                    if (creditAmount <= 0) {
                      alert('Please enter a valid credit amount.');
                      return;
                    }
                    const newBalance = selectedCustomer.walletBalance + creditAmount;
                    onUpdateWalletBalance(selectedCustomer.id, newBalance);
                    setShowWalletModal(false);
                    setSelectedCustomer(null);
                    alert(`Successfully credited ₹${creditAmount} to ${selectedCustomer.name}'s wallet!`);
                  }}
                >
                  <Text style={styles.confirmCreditBtnText}>Credit ₹{refundAmountInput || '0'} to Wallet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  screenSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  searchRow: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  th: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  nameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  emailText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  subText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  boldNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  boldSpent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  walletText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
    marginTop: 2,
  },
  badgeActive: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgeActiveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  badgeBlocked: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgeBlockedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  walletBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  walletBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
  },
  blockBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  blockBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  unblockBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  unblockBtnText: {
    color: '#059669',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  currentWalletCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  currentWalletLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  currentWalletVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4338CA',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  amountInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  confirmCreditBtn: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  confirmCreditBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
