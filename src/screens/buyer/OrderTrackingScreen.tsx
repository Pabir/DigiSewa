import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { ArrowLeft, CheckCircle2, Circle, Truck, MapPin, Package, Clock, FileText, Phone, Activity } from 'lucide-react-native';
import { Order, OrderStatus } from '../../types';
import { trackShadowfaxOrder } from '../../services/shadowfaxService';

interface OrderTrackingScreenProps {
  order: Order;
  onBack: () => void;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', desc: 'We have received your order' },
  { key: 'processing', label: 'Order Accepted & Packed', desc: 'Seller is processing your items' },
  { key: 'shipped', label: 'Shipped', desc: 'Handed over to delivery partner' },
  { key: 'reached_hub', label: 'Reached Nearest Hub', desc: 'Arrived at destination city hub' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Delivery executive is on the way' },
  { key: 'delivered', label: 'Delivered', desc: 'Package delivered successfully' },
];

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({ order, onBack }) => {
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loadingTracking, setLoadingTracking] = useState<boolean>(false);

  useEffect(() => {
    if (order.courierPartner === 'shadowfax' && order.awbCode) {
      fetchTracking();
    }
  }, [order.awbCode, order.courierPartner]);

  const fetchTracking = async () => {
    setLoadingTracking(true);
    try {
      const data = await trackShadowfaxOrder(order.awbCode!);
      setTrackingData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTracking(false);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    return statusSteps.findIndex(s => s.key === status);
  };

  const currentStepIndex = order.status === 'cancelled' ? -1 : getStepIndex(order.status);
  
  const handleSupport = () => {
    // A placeholder for contacting support. Usually this might open mailto or dialer
    Linking.openURL('mailto:support@tafdeal.com');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
      </View>

      {/* Order Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Order ID:</Text>
          <Text style={styles.infoValue}>{order.id}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Placed On:</Text>
          <Text style={styles.infoValue}>
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estimated Delivery:</Text>
          <Text style={[styles.infoValue, { color: '#4F46E5', fontWeight: 'bold' }]}>
            {order.estimatedDelivery}
          </Text>
        </View>
      </View>

      {/* Carrier Info Card (if available) */}
      {(order.shiprocketOrderId || order.awbCode) && (
        <View style={styles.carrierCard}>
          <View style={styles.carrierHeader}>
            <Truck size={20} color="#4338CA" />
            <Text style={styles.carrierTitle}>Delivery Partner Info</Text>
          </View>
          {order.awbCode && (
            <View style={styles.carrierRow}>
              <Text style={styles.carrierLabel}>Tracking AWB:</Text>
              <Text style={styles.carrierValue}>{order.awbCode}</Text>
            </View>
          )}
          <Text style={styles.carrierSubtext}>
            {order.courierPartner === 'shadowfax' ? 'Track via Shadowfax using the AWB code.' : 'Track via Shiprocket using the AWB code.'}
          </Text>
        </View>
      )}

      {/* Realtime Shadowfax Tracking */}
      {order.courierPartner === 'shadowfax' && order.awbCode && (
        <View style={styles.realtimeCard}>
          <View style={styles.realtimeHeader}>
            <Activity size={18} color="#059669" />
            <Text style={styles.realtimeTitle}>Live Partner Updates</Text>
          </View>
          {loadingTracking ? (
            <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 10 }} />
          ) : trackingData ? (
            <View style={styles.realtimeContent}>
              <Text style={styles.realtimeStatus}>
                Current Status: {trackingData.status || trackingData.delivery_status || 'In Transit'}
              </Text>
              {trackingData.location && (
                <Text style={styles.realtimeLocation}>Location: {trackingData.location}</Text>
              )}
              {trackingData.remarks && (
                <Text style={styles.realtimeRemarks}>{trackingData.remarks}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.realtimeEmpty}>No live updates available yet.</Text>
          )}
        </View>
      )}

      {/* Timeline Section */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Tracking Updates</Text>
        
        {order.status === 'cancelled' ? (
          <View style={styles.cancelledState}>
            <CheckCircle2 size={32} color="#DC2626" />
            <Text style={styles.cancelledTitle}>Order Cancelled</Text>
            <Text style={styles.cancelledDesc}>This order was cancelled and will not be delivered.</Text>
          </View>
        ) : order.courierPartner === 'shadowfax' && trackingData?.tracking_history ? (
          <View style={styles.timelineContainer}>
            {(() => {
              const history = [...trackingData.tracking_history].reverse();
              const combinedHistory = [
                { status: 'Order Placed', location: '', remarks: 'We have received your order', date: order.createdAt },
                ...history
              ];
              
              return combinedHistory.map((step, index) => {
                const isCompleted = true; // All steps in history are completed
                const isCurrent = index === combinedHistory.length - 1; // Last step is current
                const isLast = index === combinedHistory.length - 1;

                return (
                  <View key={index} style={styles.stepWrapper}>
                    <View style={styles.stepIndicator}>
                      <CheckCircle2 size={24} color="#10B981" />
                      {!isLast && (
                        <View style={[styles.stepLine, { backgroundColor: '#10B981' }]} />
                      )}
                    </View>
                    
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}>
                        {step.status}
                      </Text>
                      <Text style={styles.stepDesc}>
                        {step.remarks}
                      </Text>
                      {step.location ? (
                        <Text style={[styles.stepDesc, { fontSize: 11, marginTop: 2, color: '#64748B' }]}>
                          Location: {step.location}
                        </Text>
                      ) : null}
                      <Text style={[styles.stepDesc, { fontSize: 10, marginTop: 4, color: '#94A3B8' }]}>
                        {new Date(step.date).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                );
              });
            })()}
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {statusSteps.map((step, index) => {
              const isCompleted = currentStepIndex >= index;
              const isCurrent = currentStepIndex === index;
              const isLast = index === statusSteps.length - 1;

              return (
                <View key={step.key} style={styles.stepWrapper}>
                  {/* Left Column (Icon + Line) */}
                  <View style={styles.stepIndicator}>
                    {isCompleted ? (
                      <CheckCircle2 size={24} color="#10B981" />
                    ) : (
                      <Circle size={24} color="#CBD5E1" />
                    )}
                    {!isLast && (
                      <View style={[styles.stepLine, { backgroundColor: currentStepIndex > index ? '#10B981' : '#E2E8F0' }]} />
                    )}
                  </View>
                  
                  {/* Right Column (Text Content) */}
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive, !isCompleted && styles.stepLabelInactive]}>
                      {step.label}
                    </Text>
                    <Text style={[styles.stepDesc, !isCompleted && styles.stepDescInactive]}>
                      {step.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Delivery Address */}
      <View style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <MapPin size={18} color="#64748B" />
          <Text style={styles.addressTitle}>Delivery Address</Text>
        </View>
        <Text style={styles.addressText}>{order.deliveryAddress}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={handleSupport}>
          <Phone size={18} color="#4F46E5" />
          <Text style={styles.actionBtnText}>Contact Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <FileText size={18} color="#4F46E5" />
          <Text style={styles.actionBtnText}>Invoice</Text>
        </TouchableOpacity>
      </View>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  carrierCard: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  carrierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  carrierTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4338CA',
  },
  carrierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  carrierLabel: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
    marginRight: 6,
  },
  carrierValue: {
    fontSize: 14,
    color: '#312E81',
    fontWeight: '800',
  },
  carrierSubtext: {
    fontSize: 11,
    color: '#6366F1',
    marginTop: 4,
  },
  realtimeCard: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  realtimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  realtimeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#047857',
  },
  realtimeContent: {
    gap: 4,
  },
  realtimeStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  realtimeLocation: {
    fontSize: 13,
    color: '#047857',
  },
  realtimeRemarks: {
    fontSize: 13,
    color: '#047857',
    fontStyle: 'italic',
  },
  realtimeEmpty: {
    fontSize: 13,
    color: '#059669',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  stepWrapper: {
    flexDirection: 'row',
  },
  stepIndicator: {
    alignItems: 'center',
    width: 24,
    marginRight: 16,
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 30,
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 24,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981', // green if completed
    marginBottom: 2,
  },
  stepLabelActive: {
    color: '#0F172A',
    fontSize: 16,
  },
  stepLabelInactive: {
    color: '#64748B',
    fontWeight: '600',
  },
  stepDesc: {
    fontSize: 12,
    color: '#475569',
  },
  stepDescInactive: {
    color: '#94A3B8',
  },
  cancelledState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  cancelledTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 12,
  },
  cancelledDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  addressText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  actionBtnText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '700',
  },
});
