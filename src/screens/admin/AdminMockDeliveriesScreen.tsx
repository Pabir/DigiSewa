import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { PackageSearch, CircleCheck, RefreshCw } from 'lucide-react-native';
import { getOrders } from '../../services/firebaseService';
import { Order } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { createSettlement } from '../../services/settlementService';

export const AdminMockDeliveriesScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchMockDeliveries = async () => {
    setLoading(true);
    try {
      const allOrders = await getOrders();
      
      const pendingTasksList: any[] = [];
      const activeMockOrders = allOrders.filter(
        (o) => (o.isMockDelivery || (o.awbCode && (o.awbCode.includes('MOCK') || o.awbCode.startsWith('SFX-')))) && 
               ['processing', 'shipped', 'reached_hub', 'out_for_delivery'].includes(o.status)
      );
      
      activeMockOrders.forEach(o => {
        pendingTasksList.push({
          id: `mock-${o.id}`,
          type: 'MOCK_DELIVERY_PROGRESS',
          title: 'Advance Mock Delivery Status',
          description: `Test Order ${o.id} is currently '${o.status}'. Click to advance to the next delivery stage.`,
          orderId: o.id,
          amount: o.totalAmount,
          action: 'Advance Status',
          order: o
        });
      });

      setTasks(pendingTasksList);
    } catch (error) {
      console.error('Error fetching mock tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMockDeliveries();
  }, []);

  const handleAction = async (task: any) => {
    try {
      setProcessingId(task.id);
      
      const currentStatus = task.order.status;
      const statusProgression: Record<string, any> = {
        'processing': { next: 'shipped', msg: 'Package picked up from seller', loc: 'Origin Hub' },
        'shipped': { next: 'reached_hub', msg: 'Shipment arrived at destination hub', loc: 'Destination City' },
        'reached_hub': { next: 'out_for_delivery', msg: 'Out for delivery by executive', loc: 'Local Hub' },
        'out_for_delivery': { next: 'delivered', msg: 'Package delivered successfully', loc: 'Customer Address' }
      };

      const progress = statusProgression[currentStatus];
      if (progress) {
        const newHistory = [...(task.order.mockTrackingHistory || [])];
        newHistory.unshift({
          status: progress.next,
          location: progress.loc,
          message: progress.msg,
          timestamp: new Date().toISOString()
        });

        const updatePayload: any = { 
          status: progress.next,
          isMockDelivery: true,
          mockTrackingHistory: newHistory
        };

        if (progress.next === 'delivered') {
          updatePayload.deliveredAt = new Date().toISOString();
        }

        const orderRef = doc(db, 'orders', task.orderId);
        await updateDoc(orderRef, updatePayload);
        
        // Update local state immediately for visual feedback
        setTasks(prev => prev.map(t => {
          if (t.id === task.id) {
            return {
              ...t,
              description: `Test Order ${task.orderId} is currently '${progress.next}'. Click to advance to the next delivery stage.`,
              order: { ...t.order, status: progress.next, mockTrackingHistory: newHistory }
            };
          }
          return t;
        }));
        
        if (progress.next === 'delivered') {
          setTimeout(() => {
            setTasks(prev => prev.filter(t => t.id !== task.id));
          }, 1000);
        }
      }
      
      setProcessingId(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to advance mock delivery.');
      setProcessingId(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <PackageSearch size={24} color="#4F46E5" />
          <Text style={styles.title}>Mock Delivery Simulator</Text>
        </View>
        <TouchableOpacity onPress={fetchMockDeliveries} style={styles.refreshBtn}>
          <RefreshCw size={18} color="#4B5563" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.subtitle}>
        Manually advance the tracking status of test orders. Only orders flagged as mock deliveries or with test AWBs will appear here.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      ) : tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <CircleCheck size={48} color="#10B981" />
          <Text style={styles.emptyText}>No Active Test Orders</Text>
          <Text style={styles.emptySubtext}>There are currently no mock deliveries waiting to be advanced.</Text>
        </View>
      ) : (
        <View style={styles.taskList}>
          {tasks.map(task => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={styles.taskTypeChip}>
                  <Text style={styles.taskTypeText}>TEST ORDER</Text>
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
                    {processingId === task.id ? 'Advancing...' : task.action}
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
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
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
    borderLeftColor: '#4F46E5',
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
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  taskTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
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
