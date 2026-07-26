import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { AdminCustomer } from '../../types/adminTypes';
import { Search, IndianRupee, AlertTriangle, CheckCircle2 } from 'lucide-react-native';

interface AdminCustomerManagementScreenProps {
  customers: AdminCustomer[];
  onUpdateWalletBalance: (customerId: string, newBalance: number) => void;
  onToggleBlockUser: (customerId: string) => void;
}

export const AdminCustomerManagementScreen: React.FC<AdminCustomerManagementScreenProps> = ({
  customers,
  onUpdateWalletBalance,
  onToggleBlockUser,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [refundAmountInput, setRefundAmountInput] = useState<string>('200');
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);

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
                      <Text style={styles.boldNum}>{cust.totalOrders} Orders</Text>
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
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Wallet Credit Refund Modal */}
      {showWalletModal && selectedCustomer && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Issue Wallet Refund / Credit</Text>
              <Text style={styles.modalSub}>
                Adding wallet credits to {selectedCustomer.name}'s DigiSewa Wallet.
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
