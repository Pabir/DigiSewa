import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  CreditCard,
  X,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

interface CustomerWalletModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CustomerWalletModal: React.FC<CustomerWalletModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();

  const walletTransactions = [
    {
      id: 'TXN-9841',
      type: 'refund',
      title: 'Instant Refund - Order #ORD-88192',
      date: '26 Jul 2026, 02:15 PM',
      amount: '+ ₹799.00',
      isCredit: true,
    },
    {
      id: 'TXN-8812',
      type: 'cashback',
      title: 'TafDeal Hyperlocal First Order Cashback',
      date: '20 Jul 2026, 11:30 AM',
      amount: '+ ₹100.00',
      isCredit: true,
    },
    {
      id: 'TXN-7701',
      type: 'purchase',
      title: 'Payment for Order #ORD-9841',
      date: '15 Jul 2026, 06:45 PM',
      amount: '- ₹540.00',
      isCredit: false,
    },
  ];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBox}>
                <CreditCard size={22} color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.headerTitle}>TafDeal Customer Wallet</Text>
                <Text style={styles.headerSub}>Instant Refunds & Store Credit</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>TOTAL AVAILABLE BALANCE</Text>
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>Active</Text>
                </View>
              </View>

              <Text style={styles.balanceAmount}>₹899.00</Text>
              <Text style={styles.balanceNote}>
                100% usable on your next hyperlocal order at checkout.
              </Text>
            </View>

            {/* Perks Row */}
            <View style={styles.perksRow}>
              <View style={styles.perkCard}>
                <RefreshCw size={18} color="#059669" />
                <View>
                  <Text style={styles.perkTitle}>Instant Refunds</Text>
                  <Text style={styles.perkSub}>No bank waiting time</Text>
                </View>
              </View>
              <View style={styles.perkCard}>
                <Sparkles size={18} color="#4F46E5" />
                <View>
                  <Text style={styles.perkTitle}>Cashbacks</Text>
                  <Text style={styles.perkSub}>Auto-credited rewards</Text>
                </View>
              </View>
            </View>

            {/* Transaction History Section */}
            <Text style={styles.sectionTitle}>Recent Wallet Activity</Text>
            <View style={styles.historyList}>
              {walletTransactions.map(txn => (
                <View key={txn.id} style={styles.txnRow}>
                  <View
                    style={[
                      styles.txnIconBox,
                      txn.isCredit ? styles.creditIconBox : styles.debitIconBox,
                    ]}
                  >
                    {txn.isCredit ? (
                      <ArrowLeft size={18} color="#059669" />
                    ) : (
                      <ArrowRight size={18} color="#DC2626" />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.txnTitle}>
                      {txn.title}
                    </Text>
                    <Text style={styles.txnDate}>{txn.date}</Text>
                  </View>

                  <Text
                    style={[
                      styles.txnAmount,
                      txn.isCredit ? styles.creditAmount : styles.debitAmount,
                    ]}
                  >
                    {txn.amount}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F172A',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 20,
    gap: 16,
  },
  balanceCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  activeTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 4,
  },
  balanceNote: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  perksRow: {
    flexDirection: 'row',
    gap: 10,
  },
  perkCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 12,
  },
  perkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  perkSub: {
    fontSize: 10,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  historyList: {
    gap: 10,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 12,
  },
  txnIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditIconBox: {
    backgroundColor: '#DCFCE7',
  },
  debitIconBox: {
    backgroundColor: '#FEF2F2',
  },
  txnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  txnDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  txnAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  creditAmount: {
    color: '#059669',
  },
  debitAmount: {
    color: '#DC2626',
  },
});
