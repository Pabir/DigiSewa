import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { RefreshCw, PackageX, CheckCircle, Truck, ExternalLink } from 'lucide-react-native';
import { ReturnItem } from '../../types';
import { getReturnsFromFirestore, approveReturnRequest } from '../../services/firebaseService';

export const AdminReturnsScreen: React.FC = () => {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const data = await getReturnsFromFirestore();
      // Sort by newest first
      data.sort((a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime());
      setReturns(data);
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleApprove = async (returnId: string) => {
    Alert.alert(
      "Approve Return Request",
      "This will automatically generate a Shadowfax Reverse Pickup Request. Are you sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Approve & Request Pickup", 
          style: "default",
          onPress: async () => {
            setProcessingId(returnId);
            try {
              const awb = await approveReturnRequest(returnId);
              Alert.alert("Success", `Return Approved. Reverse Pickup AWB Generated: ${awb}`);
              await fetchReturns(); // Refresh list
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to approve return and create pickup request.");
            } finally {
              setProcessingId(null);
            }
          }
        }
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'replacement_requested':
        return { bg: '#FEF3C7', text: '#B45309', label: 'Pending Approval' };
      case 'approved':
        return { bg: '#E0E7FF', text: '#4338CA', label: 'Approved (Pickup Scheduled)' };
      case 'rto_in_transit':
        return { bg: '#DBEAFE', text: '#1D4ED8', label: 'In Transit' };
      case 'delivered_to_seller':
        return { bg: '#DCFCE7', text: '#15803D', label: 'Returned to Seller' };
      case 'qc_failed':
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'QC Failed' };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: status };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <PackageX size={24} color="#0F172A" />
          <Text style={styles.title}>Returns & Pickups</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchReturns}>
          <RefreshCw size={18} color="#4F46E5" />
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
        ) : returns.length === 0 ? (
          <View style={styles.emptyState}>
            <PackageX size={48} color="#CBD5E1" />
            <Text style={styles.emptyStateTitle}>No Returns Found</Text>
            <Text style={styles.emptyStateText}>There are currently no return requests.</Text>
          </View>
        ) : (
          returns.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.returnId}>{item.id}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order ID:</Text>
                    <Text style={styles.detailValue}>{item.orderId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Customer:</Text>
                    <Text style={styles.detailValue}>{item.customerName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Product(s):</Text>
                    <Text style={styles.detailValue}>{item.productName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reason:</Text>
                    <Text style={styles.detailValue}>{item.returnReason}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={[styles.detailValue, { fontWeight: '700' }]}>₹{item.amount}</Text>
                  </View>
                  
                  {item.awbNumber && (
                    <View style={styles.awbBox}>
                      <Truck size={16} color="#059669" />
                      <Text style={styles.awbText}>Reverse Pickup AWB: {item.awbNumber}</Text>
                    </View>
                  )}
                </View>

                {item.status === 'replacement_requested' && (
                  <View style={styles.cardFooter}>
                    <TouchableOpacity 
                      style={[styles.approveBtn, processingId === item.id && styles.disabledBtn]} 
                      onPress={() => handleApprove(item.id)}
                      disabled={processingId === item.id}
                    >
                      {processingId === item.id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <CheckCircle size={16} color="#FFF" />
                          <Text style={styles.approveBtnText}>Approve & Create Pickup</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  returnId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailLabel: {
    width: 80,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
  },
  awbBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginTop: 8,
  },
  awbText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  cardFooter: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledBtn: {
    backgroundColor: '#94A3B8',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
