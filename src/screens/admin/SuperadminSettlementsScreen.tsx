import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CheckCircle2, Clock, IndianRupee, Landmark, RefreshCw } from 'lucide-react-native';
import { Settlement } from '../../types';
import { getAllSettlements, markSettlementPaid, syncPastDeliveries } from '../../services/settlementService';

export const SuperadminSettlementsScreen: React.FC = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'settled'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    setLoading(true);
    const data = await getAllSettlements();
    setSettlements(data);
    setLoading(false);
  };

  const handlePayout = async (settlementId: string) => {
    Alert.alert(
      "Confirm Payout",
      "This will trigger a RazorpayX Test Mode payout to the seller's registered bank account.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Proceed", 
          onPress: async () => {
            try {
              setProcessingId(settlementId);
              // Mocking RazorpayX Test Mode Payout delay
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              const mockPayoutRef = `pout_test_${Date.now().toString().slice(-6)}`;
              await markSettlementPaid(settlementId, mockPayoutRef);
              
              setSettlements(prev => prev.map(s => 
                s.id === settlementId ? { ...s, status: 'settled', payoutReference: mockPayoutRef, settledAt: new Date().toISOString() } : s
              ));
              
              Alert.alert("Success", `Test payout initiated successfully! Ref: ${mockPayoutRef}`);
            } catch (error) {
              Alert.alert("Error", "Failed to initiate payout.");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const handleSyncOldOrders = async () => {
    setSyncing(true);
    const count = await syncPastDeliveries();
    if (count > 0) {
      Alert.alert("Sync Complete", `Successfully created ${count} missing settlement records.`);
      fetchSettlements();
    } else {
      Alert.alert("Sync Complete", "All delivered orders already have settlement records.");
    }
    setSyncing(false);
  };

  const filteredSettlements = settlements.filter(s => s.status === activeTab);

  const calculateTotal = () => {
    return filteredSettlements.reduce((sum, s) => sum + s.amountOwed, 0).toFixed(2);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Landmark size={24} color="#0F172A" />
          <Text style={styles.headerTitle}>Seller Payouts & Settlements</Text>
        </View>
        <TouchableOpacity 
          style={styles.syncBtn} 
          onPress={handleSyncOldOrders}
          disabled={syncing}
        >
          {syncing ? <ActivityIndicator size="small" color="#4F46E5" /> : <RefreshCw size={18} color="#4F46E5" />}
          <Text style={styles.syncBtnText}>{syncing ? 'Syncing...' : 'Sync Old Orders'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'settled' && styles.activeTab]}
          onPress={() => setActiveTab('settled')}
        >
          <Text style={[styles.tabText, activeTab === 'settled' && styles.activeTabText]}>Settled</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryLabel}>Total {activeTab === 'pending' ? 'Owed' : 'Paid'}:</Text>
        <Text style={styles.summaryAmount}>₹{calculateTotal()}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {filteredSettlements.length === 0 ? (
            <Text style={styles.emptyText}>No {activeTab} settlements found.</Text>
          ) : (
            filteredSettlements.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Text style={styles.storeName}>{item.storeName}</Text>
                    {item.amountOwed < 0 && (
                      <View style={{backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>
                        <Text style={{fontSize: 10, color: '#B91C1C', fontWeight: 'bold'}}>RTO PENALTY</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.orderId}>Order: {item.orderId}</Text>
                </View>
                
                <View style={styles.amountRow}>
                  <IndianRupee size={20} color={item.amountOwed < 0 ? "#DC2626" : "#0F172A"} />
                  <Text style={[styles.amountText, item.amountOwed < 0 && { color: '#DC2626' }]}>
                    {item.amountOwed.toFixed(2)}
                  </Text>
                </View>

                {activeTab === 'pending' ? (
                  <View style={styles.actionRow}>
                    <View style={styles.statusBadge}>
                      <Clock size={14} color="#B45309" />
                      <Text style={styles.statusText}>Pending Transfer</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.payBtn}
                      onPress={() => handlePayout(item.id)}
                      disabled={processingId === item.id}
                    >
                      {processingId === item.id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.payBtnText}>Pay Now</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.settledRow}>
                    <CheckCircle2 size={16} color="#15803D" />
                    <Text style={styles.settledText}>
                      Settled on {item.settledAt ? new Date(item.settledAt).toLocaleDateString() : ''}
                    </Text>
                    <Text style={styles.refText}>Ref: {item.payoutReference}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncBtnText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4F46E5',
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#EEF2FF',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3730A3',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 20,
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderId: {
    fontSize: 13,
    color: '#64748B',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
  },
  payBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  settledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 8,
  },
  settledText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '600',
  },
  refText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 'auto',
  },
});
