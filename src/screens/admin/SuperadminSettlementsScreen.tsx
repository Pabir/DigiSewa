import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CheckCircle2, Clock, IndianRupee, Landmark, RefreshCw, Truck, Plus, Minus } from 'lucide-react-native';
import { Settlement, Order } from '../../types';
import { getAllSettlements, markSettlementPaid, syncPastDeliveries, getCodRemittedOrders } from '../../services/settlementService';

export const SuperadminSettlementsScreen: React.FC = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [remittedOrders, setRemittedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'settled' | 'courier'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const [data, remittances] = await Promise.all([
        getAllSettlements(),
        getCodRemittedOrders()
      ]);
      setSettlements(data);
      setRemittedOrders(remittances);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleSellerPayout = async (sellerId: string, storeName: string, netAmount: number, sellerSettlements: Settlement[]) => {
    const processPayout = async () => {
      try {
        setProcessingId(sellerId);
        // Mocking RazorpayX Test Mode Payout delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockPayoutRef = `pout_test_${Date.now().toString().slice(-6)}`;
        
        const updatedSettlements = [...settlements];
        for (const settlement of sellerSettlements) {
           await markSettlementPaid(settlement.id, mockPayoutRef);
           const idx = updatedSettlements.findIndex(s => s.id === settlement.id);
           if (idx >= 0) {
             updatedSettlements[idx] = { 
               ...updatedSettlements[idx], 
               status: 'settled', 
               payoutReference: mockPayoutRef, 
               settledAt: new Date().toISOString() 
             };
           }
        }
        setSettlements(updatedSettlements);
        
        if (typeof window !== 'undefined' && window.alert) window.alert(`Success! Test payout initiated successfully! Ref: ${mockPayoutRef}`);
        else Alert.alert("Success", `Test payout initiated successfully! Ref: ${mockPayoutRef}`);
      } catch (error) {
        if (typeof window !== 'undefined' && window.alert) window.alert("Error: Failed to initiate payout.");
        else Alert.alert("Error", "Failed to initiate payout.");
      } finally {
        setProcessingId(null);
      }
    };

    const confirmMessage = `This will trigger a RazorpayX Test Mode payout of ₹${netAmount.toFixed(2)} to ${storeName}'s registered bank account.`;

    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(confirmMessage)) {
        processPayout();
      }
    } else {
      Alert.alert(
        "Confirm Payout",
        confirmMessage,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Proceed", onPress: processPayout }
        ]
      );
    }
  };

  const handleBulkPayout = async () => {
    try {
      // Process all pending settlements in the current view
      const eligibleSettlements = filteredSettlements;

      if (eligibleSettlements.length === 0) {
        if (typeof window !== 'undefined' && window.alert) window.alert("No pending settlements found.");
        else Alert.alert("No Data", "No pending settlements found.");
        return;
      }

      // Group by seller to calculate NET amounts
      const sellerTotals = new Map<string, { storeName: string, netAmount: number, settlements: Settlement[] }>();
      
      for (const s of eligibleSettlements) {
        const sId = s.sellerId || 'unknown_seller';
        if (!sellerTotals.has(sId)) {
          sellerTotals.set(sId, { storeName: s.storeName || 'Unknown Store', netAmount: 0, settlements: [] });
        }
        const data = sellerTotals.get(sId)!;
        const amt = Number(s.amountOwed) || 0;
        data.netAmount += amt;
        data.settlements.push(s);
      }

      // Filter out sellers where netAmount <= 0
      const sellersToPay = Array.from(sellerTotals.values()).filter(s => s.netAmount > 0);
      const totalToPay = sellersToPay.reduce((sum, s) => sum + s.netAmount, 0).toFixed(2);
      
      // Collect all individual settlements that belong to sellers getting paid
      const settlementsToMarkPaid = sellersToPay.reduce((acc, s) => acc.concat(s.settlements), [] as Settlement[]);

      if (sellersToPay.length === 0) {
        if (typeof window !== 'undefined' && window.alert) window.alert("No Valid Payouts: After adjusting for negative balances (penalties), no sellers have a positive net payout for this period.");
        else Alert.alert("No Valid Payouts", "After adjusting for negative balances, no sellers have a positive net payout.");
        return;
      }

      const processPayouts = async () => {
        try {
          setProcessingId('bulk');
          // Mocking RazorpayX Test Mode Payout delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const mockPayoutRef = `bulk_test_${Date.now().toString().slice(-6)}`;
          
          const updatedSettlements = [...settlements];
          for (const settlement of settlementsToMarkPaid) {
             await markSettlementPaid(settlement.id, mockPayoutRef);
             const idx = updatedSettlements.findIndex(s => s.id === settlement.id);
             if (idx >= 0) {
               updatedSettlements[idx] = { 
                 ...updatedSettlements[idx], 
                 status: 'settled', 
                 payoutReference: mockPayoutRef, 
                 settledAt: new Date().toISOString() 
               };
             }
          }
          setSettlements(updatedSettlements);
          
          if (typeof window !== 'undefined' && window.alert) window.alert(`Success! Bulk payout of ₹${totalToPay} initiated successfully!`);
          else Alert.alert("Success", `Bulk payout of ₹${totalToPay} initiated successfully!`);
        } catch (error) {
          if (typeof window !== 'undefined' && window.alert) window.alert("Error: Failed to initiate bulk payout. Check connection.");
          else Alert.alert("Error", "Failed to initiate bulk payout. Check connection.");
        } finally {
          setProcessingId(null);
        }
      };

      const confirmMessage = `Net pay total ₹${totalToPay} to ${sellersToPay.length} sellers? (This deducts any RTO penalties).`;
      
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm(confirmMessage)) {
          processPayouts();
        }
      } else {
        Alert.alert(
          "Confirm Bulk Payout",
          confirmMessage,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Proceed", onPress: processPayouts }
          ]
        );
      }
    } catch (e) {
      if (typeof window !== 'undefined' && window.alert) window.alert(`Application Error: ${String(e)}`);
      else Alert.alert("Application Error", String(e));
    }
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

  const groupedSettlements = useMemo(() => {
    if (activeTab === 'courier') return [];
    const map = new Map<string, { id: string, sellerId: string, storeName: string, netAmount: number, settlements: Settlement[], settledAt?: string, payoutReference?: string }>();
    
    for (const s of filteredSettlements) {
      const sId = s.sellerId || 'unknown_seller';
      const key = activeTab === 'pending' ? sId : `${sId}_${s.payoutReference || s.id}`;

      if (!map.has(key)) {
        map.set(key, { 
          id: key,
          sellerId: sId, 
          storeName: s.storeName || 'Unknown Store', 
          netAmount: 0, 
          settlements: [],
          settledAt: s.settledAt,
          payoutReference: s.payoutReference
        });
      }
      const data = map.get(key)!;
      data.netAmount += (Number(s.amountOwed) || 0);
      data.settlements.push(s);
    }
    return Array.from(map.values());
  }, [filteredSettlements, activeTab]);

  const calculateTotal = () => {
    if (activeTab === 'courier') {
      return remittedOrders.reduce((sum, o) => sum + (o.remittanceAmount || 0), 0).toFixed(2);
    }
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
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'courier' && styles.activeTab]}
          onPress={() => setActiveTab('courier')}
        >
          <Text style={[styles.tabText, activeTab === 'courier' && styles.activeTabText]}>Courier Remittances</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryBox}>
        <View>
          <Text style={styles.summaryLabel}>
            {activeTab === 'courier' ? 'Total Received from Courier:' : `Total ${activeTab === 'pending' ? 'Owed' : 'Paid'} to Sellers:`}
          </Text>
          <Text style={styles.summaryAmount}>₹{calculateTotal()}</Text>
        </View>
        
        {activeTab === 'pending' && filteredSettlements.length > 0 && (
          <TouchableOpacity 
            style={[styles.payBtn, { backgroundColor: '#10B981' }]} 
            onPress={handleBulkPayout}
            disabled={processingId === 'bulk'}
          >
            {processingId === 'bulk' ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.payBtnText}>Pay All Pending</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      ) : activeTab === 'courier' ? (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {remittedOrders.length === 0 ? (
            <Text style={styles.emptyText}>No courier remittances tracked yet.</Text>
          ) : (
            remittedOrders.map((order) => (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Truck size={18} color="#047857" />
                    <Text style={[styles.storeName, {color: '#047857'}]}>
                      {order.courierPartner === 'shadowfax' ? 'Shadowfax' : order.courierPartner}
                    </Text>
                  </View>
                  <Text style={styles.orderId}>AWB: {order.awbCode || order.shadowfaxAwb}</Text>
                </View>
                
                <View style={styles.amountRow}>
                  <IndianRupee size={20} color="#047857" />
                  <Text style={[styles.amountText, { color: '#047857' }]}>
                    {order.remittanceAmount?.toFixed(2) || '0.00'}
                  </Text>
                </View>

                <View style={styles.settledRow}>
                  <CheckCircle2 size={16} color="#15803D" />
                  <Text style={styles.settledText}>
                    Deposited on {order.remittanceDate ? new Date(order.remittanceDate).toLocaleDateString() : 'N/A'}
                  </Text>
                  <Text style={styles.refText}>UTR: {order.utrNumber || 'N/A'}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {groupedSettlements.length === 0 ? (
            <Text style={styles.emptyText}>No {activeTab} settlements found.</Text>
          ) : (
            groupedSettlements.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Text style={styles.storeName}>{item.storeName}</Text>
                    {item.netAmount < 0 && (
                      <View style={{backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>
                        <Text style={{fontSize: 10, color: '#B91C1C', fontWeight: 'bold'}}>NET NEGATIVE</Text>
                      </View>
                    )}
                  </View>
                  {item.settlements.length > 1 ? (
                    <TouchableOpacity 
                      style={{flexDirection: 'row', alignItems: 'center', gap: 4}}
                      onPress={() => toggleExpand(item.id)}
                    >
                      <Text style={styles.orderId}>{item.settlements.length} Orders</Text>
                      {expandedGroups.has(item.id) ? <Minus size={16} color="#64748B" /> : <Plus size={16} color="#64748B" />}
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.orderId}>1 Order</Text>
                  )}
                </View>
                
                <View style={styles.amountRow}>
                  <IndianRupee size={20} color={item.netAmount < 0 ? "#DC2626" : "#0F172A"} />
                  <Text style={[styles.amountText, item.netAmount < 0 && { color: '#DC2626' }]}>
                    {item.netAmount.toFixed(2)}
                  </Text>
                </View>

                {expandedGroups.has(item.id) && item.settlements.length > 1 && (
                  <View style={styles.expandedContainer}>
                    {item.settlements.map((s) => (
                      <View key={s.id} style={styles.expandedItemRow}>
                        <View>
                          <Text style={styles.expandedOrderId}>Order: {s.orderId}</Text>
                          {s.amountOwed < 0 && <Text style={styles.expandedPenaltyText}>RTO PENALTY</Text>}
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <IndianRupee size={12} color={s.amountOwed < 0 ? "#DC2626" : "#64748B"} />
                          <Text style={[styles.expandedAmount, s.amountOwed < 0 && { color: '#DC2626' }]}>
                            {s.amountOwed.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {activeTab === 'pending' ? (
                  <View style={styles.actionRow}>
                    <View style={styles.statusBadge}>
                      <Clock size={14} color="#B45309" />
                      <Text style={styles.statusText}>Pending Transfer</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.payBtn, item.netAmount <= 0 && styles.payBtnDisabled]}
                      onPress={() => {
                        if (item.netAmount <= 0) {
                          if (typeof window !== 'undefined' && window.alert) window.alert("Cannot pay a negative or zero balance.");
                          else Alert.alert("Invalid Payout", "Cannot pay a negative or zero balance.");
                        } else {
                          handleSellerPayout(item.sellerId, item.storeName, item.netAmount, item.settlements);
                        }
                      }}
                      disabled={processingId === item.sellerId}
                    >
                      {processingId === item.sellerId ? (
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
  payBtnDisabled: {
    backgroundColor: '#94A3B8',
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
  expandedContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  expandedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expandedOrderId: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  expandedPenaltyText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '700',
    marginTop: 2,
  },
  expandedAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 2,
  }
});
