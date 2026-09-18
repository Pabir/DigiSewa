import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { AlertTriangle, CircleCheck, DollarSign, RefreshCw, Box } from 'lucide-react-native';
import { getOrders, getReturnsFromFirestore, updateOrderStatus, updateReturnRequest } from '../../services/firebaseService';
import { Order, ReturnItem } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { createSettlement, chargeRTOPenalty } from '../../services/settlementService';

export const AdminPendingTasksScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingTasks = async () => {
    setLoading(true);
    try {
      const allOrders = await getOrders();
      const allReturns = await getReturnsFromFirestore();

      const pendingTasksList = [];

      // Task 1: Pre-paid RTOs needing refunds
      const rtoRefunds = allOrders.filter(
        (o) => o.status === 'rto_delivered_to_seller' && o.paymentMode !== 'cod' && !(o as any).rtoRefundProcessed
      );
      rtoRefunds.forEach(o => {
        pendingTasksList.push({
          id: `rto-${o.id}`,
          type: 'RTO_REFUND',
          title: 'Manual Refund Required for RTO',
          description: `Order ${o.id} was returned to seller. Pre-paid order requires manual Razorpay refund.`,
          orderId: o.id,
          amount: o.totalAmount,
          action: 'Mark Refund Processed',
          order: o
        });
      });

      // Task 2: Unremitted COD Orders
      const unremittedCOD = allOrders.filter(
        (o) => o.status === 'delivered' && o.paymentMode === 'cod' && !o.codRemitted
      );
      unremittedCOD.forEach(o => {
        pendingTasksList.push({
          id: `cod-${o.id}`,
          type: 'COD_REMITTANCE',
          title: 'COD Cash Collection Pending',
          description: `Order ${o.id} was delivered. Courier needs to remit cash (₹${o.totalAmount}) to platform.`,
          orderId: o.id,
          amount: o.totalAmount,
          action: 'Mark COD Remitted',
          order: o
        });
      });

      // Task 3 & 4: Returns Needing Manual Payout/Refund (COD & Prepaid)
      // Find returns delivered to seller where refund hasn't been processed
      const deliveredReturns = allReturns.filter(
        (r) => r.status === 'delivered_to_seller' && !(r as any).refundProcessed
      );
      
      for (const ret of deliveredReturns) {
        const originalOrder = allOrders.find(o => o.id === ret.orderId);
        if (originalOrder) {
          if (originalOrder.paymentMode === 'cod') {
            pendingTasksList.push({
              id: `codret-${ret.id}`,
              type: 'COD_RETURN_PAYOUT',
              title: 'Manual Payout for COD Return',
              description: `Return ${ret.id} (Order ${ret.orderId}) delivered back to seller. Manual payout required. Bank Details: ${ret.refundDetails || 'None provided'}`,
              orderId: ret.orderId,
              amount: ret.amount,
              action: 'Mark Payout Processed',
              returnItem: ret
            });
          } else {
            pendingTasksList.push({
              id: `prepaidret-${ret.id}`,
              type: 'PREPAID_RETURN_REFUND',
              title: 'Manual Refund for Prepaid Return',
              description: `Return ${ret.id} (Order ${ret.orderId}) delivered back to seller. Manual Razorpay refund required for prepaid order.`,
              orderId: ret.orderId,
              amount: ret.amount,
              action: 'Mark Refund Processed',
              returnItem: ret
            });
          }
        }
      }

      // Task 4: Auto-cancel payment_pending orders older than 24h
      const now = new Date().getTime();
      const expiredPending = allOrders.filter(o => {
        if (o.status === 'payment_pending') {
          const orderDate = new Date(o.createdAt).getTime();
          const hoursPassed = (now - orderDate) / (1000 * 60 * 60);
          return hoursPassed > 24;
        }
        return false;
      });

      expiredPending.forEach(o => {
        pendingTasksList.push({
          id: `expire-${o.id}`,
          type: 'EXPIRED_PAYMENT',
          title: 'Cancel Expired Payment Order',
          description: `Order ${o.id} has been stuck in payment_pending for over 24 hours.`,
          orderId: o.id,
          amount: o.totalAmount,
          action: 'Cancel Order',
          order: o
        });
      });

      // Task 5: Cancelled COD Orders that need RTO Penalty & Return Tracking
      const cancelledCodShipped = allOrders.filter(
        (o) => o.status === 'cancelled' && o.paymentMode === 'cod' && (o.awbCode || o.shadowfaxAwb) && !(o as any).rtoPenaltyCharged
      );
      cancelledCodShipped.forEach(o => {
        pendingTasksList.push({
          id: `cancod-${o.id}`,
          type: 'CANCELLED_COD_RTO',
          title: 'Charge RTO Penalty for Cancelled COD',
          description: `Order ${o.id} was cancelled by customer but has an AWB. Convert to RTO in Transit and charge seller for forward & reverse shipping.`,
          orderId: o.id,
          amount: (o.actualShippingCost ? o.actualShippingCost * 2 : 98) + ((o.platformFee || 5) * 2),
          action: 'Charge Penalty & Mark RTO',
          order: o
        });
      });

      // Task 6: Prepaid Delivered Orders (Return Window Expired)
      // Temporarily set to 0 for testing. Revert back to 7 * 24 * 60 * 60 * 1000 when done.
      const SEVEN_DAYS_MS = 0; 
      const prepaidDelivered = allOrders.filter(o => {
        if (o.paymentMode !== 'cod' && (o.status === 'delivered' || o.deliveryStatus === 'delivered') && !o.settlementCreated) {
          const hasReturn = ['requested', 'approved', 'picked_up', 'refunded'].includes(o.returnStatus || 'not_requested');
          if (hasReturn) return false;
          if (o.deliveredAt) {
            const deliveredTime = new Date(o.deliveredAt).getTime();
            return (now - deliveredTime) >= SEVEN_DAYS_MS;
          }
        }
        return false;
      });

      prepaidDelivered.forEach(o => {
        pendingTasksList.push({
          id: `prepaid-settle-${o.id}`,
          type: 'PREPAID_SETTLEMENT_READY',
          title: 'Settle Prepaid Order (Return Window Expired)',
          description: `Order ${o.id} was delivered over 7 days ago. No active returns found. Ready to settle with seller.`,
          orderId: o.id,
          amount: o.productTotal !== undefined ? o.productTotal : o.totalAmount,
          action: 'Create Settlement',
          order: o
        });
      });

      setTasks(pendingTasksList);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTasks();
  }, []);

  const handleAction = async (task: any) => {
    const processTask = async () => {
      try {
        setProcessingId(task.id);
        if (task.type === 'RTO_REFUND') {
          await chargeRTOPenalty(task.order);
          const orderRef = doc(db, 'orders', task.orderId);
          await updateDoc(orderRef, { rtoRefundProcessed: true, rtoPenaltyCharged: true });
          Alert.alert('Success', 'Marked RTO refund as processed and charged seller RTO penalty.');
        } else if (task.type === 'COD_REMITTANCE') {
          const orderRef = doc(db, 'orders', task.orderId);
          await updateDoc(orderRef, { 
            codRemitted: true, 
            remittanceAmount: task.amount,
            remittanceDate: new Date().toISOString()
          });
          
          const sellerId = task.order.items[0]?.product?.sellerId;
          const storeName = task.order.items[0]?.product?.sellerName;
          if (sellerId && storeName) {
            await createSettlement(task.order, sellerId, storeName);
          }
          
          Alert.alert('Success', 'COD marked as remitted and seller settlement created.');
        } else if (task.type === 'COD_RETURN_PAYOUT') {
          await updateReturnRequest(task.returnItem.id, 'approved' as any);
          const returnRef = doc(db, 'returns', task.returnItem.id);
          await updateDoc(returnRef, { refundProcessed: true });
          Alert.alert('Success', 'Marked COD Return payout as processed.');
        } else if (task.type === 'PREPAID_RETURN_REFUND') {
          await updateReturnRequest(task.returnItem.id, 'approved' as any);
          const returnRef = doc(db, 'returns', task.returnItem.id);
          await updateDoc(returnRef, { refundProcessed: true });
          Alert.alert('Success', 'Marked Prepaid Return refund as processed.');
        } else if (task.type === 'EXPIRED_PAYMENT') {
          const orderRef = doc(db, 'orders', task.orderId);
          await updateDoc(orderRef, { status: 'cancelled' });
          Alert.alert('Success', 'Cancelled expired order.');
        } else if (task.type === 'CANCELLED_COD_RTO') {
          await chargeRTOPenalty(task.order);
          const orderRef = doc(db, 'orders', task.orderId);
          await updateDoc(orderRef, { 
            status: 'rto_in_transit',
            rtoPenaltyCharged: true 
          });
          Alert.alert('Success', 'Charged RTO penalty and marked order as RTO In Transit.');
        } else if (task.type === 'PREPAID_SETTLEMENT_READY') {
          const sellerId = task.order.items[0]?.product?.sellerId;
          const storeName = task.order.items[0]?.product?.sellerName;
          if (sellerId && storeName) {
            await createSettlement(task.order, sellerId, storeName);
            const orderRef = doc(db, 'orders', task.orderId);
            await updateDoc(orderRef, { settlementCreated: true });
            Alert.alert('Success', 'Settlement created for prepaid order.');
          } else {
             Alert.alert('Error', 'Missing seller details on order items.');
          }
        }
        
        fetchPendingTasks();
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to process task.');
        setProcessingId(null);
      }
    };

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to process this task: ${task.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: processTask }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={24} color="#DC2626" />
          <Text style={styles.title}>Pending Manual Interventions</Text>
        </View>
        <TouchableOpacity onPress={fetchPendingTasks} style={styles.refreshBtn}>
          <RefreshCw size={18} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      ) : tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <CircleCheck size={48} color="#10B981" />
          <Text style={styles.emptyText}>All Caught Up!</Text>
          <Text style={styles.emptySubtext}>There are no pending manual tasks right now.</Text>
        </View>
      ) : (
        <View style={styles.taskList}>
          {tasks.map(task => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={styles.taskTypeChip}>
                  <Text style={styles.taskTypeText}>{task.type.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.amountText}>₹{task.amount}</Text>
              </View>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDesc}>{task.description}</Text>
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, processingId === task.id && { opacity: 0.7 }]} 
                  onPress={() => handleAction(task)}
                  disabled={processingId === task.id}
                >
                  {processingId === task.id ? (
                     <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                     <CircleCheck size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.actionBtnText}>
                    {processingId === task.id ? 'Processing...' : task.action}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  taskList: {
    gap: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTypeChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  taskTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  taskDesc: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
