import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, TextInput, Alert, ScrollView, Image } from 'react-native';
import { X, ArrowRight, AlertCircle, CircleCheck, Upload } from 'lucide-react-native';
import { Order, ReturnItem } from '../../types';
import { checkShadowfaxReversePickupServiceability } from '../../services/shadowfaxService';
import { createReturnRequest } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';

interface ReturnRequestModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  visible,
  order,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isServiceable, setIsServiceable] = useState(false);
  const [reason, setReason] = useState('');
  const [returnAction, setReturnAction] = useState<'replace' | 'refund'>('replace');
  const [refundMethod, setRefundMethod] = useState<'bank' | 'upi' | 'original'>('upi');
  const [refundDetails, setRefundDetails] = useState('');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const RETURN_REASONS = [
    'Wrong Item Delivered',
    'Defective/Damaged',
    'Size/Fit Issue',
    'Quality Issue',
    'Other'
  ];

  useEffect(() => {
    if (visible && order) {
      checkServiceability();
    } else {
      setChecking(true);
      setIsServiceable(false);
      setReason('');
      setReturnAction('replace');
      setRefundMethod(order?.paymentMode === 'cod' ? 'upi' : 'original');
      setRefundDetails(order?.paymentMode === 'cod' ? '' : 'Original Payment Source');
      setReturnImages([]);
      setSubmitting(false);
    }
  }, [visible, order]);

  const checkServiceability = async () => {
    setChecking(true);
    try {
      const pincodeMatch = order?.deliveryAddress.match(/\b\d{6}\b/);
      const deliveryPincode = pincodeMatch ? pincodeMatch[0] : '110001';
      
      const serviceable = await checkShadowfaxReversePickupServiceability(deliveryPincode);
      setIsServiceable(serviceable);
    } catch (error) {
      console.error(error);
      setIsServiceable(false);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Error', 'Please select a reason for the return.');
      return;
    }
    if (reason === 'Wrong Item Delivered' && returnImages.length === 0) {
      Alert.alert('Error', 'Please upload at least one photo showing the wrong item.');
      return;
    }
    if (returnAction === 'refund' && refundMethod !== 'original' && !refundDetails.trim()) {
      Alert.alert('Error', 'Please provide refund account details.');
      return;
    }
    if (!order || !user) return;

    setSubmitting(true);
    try {
      const sellerId = order.items[0]?.product?.sellerId || 'unknown';
      const productNames = order.items.map(i => i.product.title).join(', ');
      
      const newReturn: Omit<ReturnItem, 'id'> = {
        orderId: order.id,
        sellerId: sellerId,
        productName: productNames,
        returnReason: reason,
        customerName: user.name,
        status: returnAction === 'refund' ? 'refund_requested' : 'replacement_requested',
        returnDate: new Date().toISOString().split('T')[0],
        amount: order.totalAmount,
        returnImages: returnImages.length > 0 ? returnImages : undefined,
        ...(returnAction === 'refund' && {
          refundMethod,
          refundDetails: refundMethod === 'original' ? 'Original Payment Source' : refundDetails
        })
      };

      await createReturnRequest(newReturn);
      onSuccess(order.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit return request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Return Order</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.orderText}>Order ID: {order.id}</Text>

            {checking ? (
              <View style={styles.statusBox}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.statusText}>Checking reverse pickup serviceability for your location...</Text>
              </View>
            ) : isServiceable ? (
              <View style={styles.formContainer}>
                <View style={styles.successBox}>
                  <CircleCheck size={20} color="#059669" />
                  <Text style={styles.successText}>Reverse pickup is available for your location!</Text>
                </View>
                
                <Text style={styles.label}>Reason for Return <Text style={{color: '#EF4444'}}>*</Text></Text>
                <View style={styles.reasonContainer}>
                  {RETURN_REASONS.map(r => (
                    <TouchableOpacity 
                      key={r}
                      style={[styles.reasonPill, reason === r && styles.reasonPillActive]}
                      onPress={() => setReason(r)}
                    >
                      <Text style={[styles.reasonPillText, reason === r && styles.reasonPillTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Action Requested <Text style={{color: '#EF4444'}}>*</Text></Text>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
                  <TouchableOpacity 
                    style={[styles.refundToggle, returnAction === 'replace' && styles.refundToggleActive]}
                    onPress={() => setReturnAction('replace')}
                  >
                    <Text style={[styles.refundToggleText, returnAction === 'replace' && styles.refundToggleTextActive]}>Replacement</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.refundToggle, returnAction === 'refund' && styles.refundToggleActive]}
                    onPress={() => setReturnAction('refund')}
                  >
                    <Text style={[styles.refundToggleText, returnAction === 'refund' && styles.refundToggleTextActive]}>Refund</Text>
                  </TouchableOpacity>
                </View>

                {reason === 'Wrong Item Delivered' && (
                  <View style={styles.uploadSection}>
                    <Text style={styles.label}>Upload Photos of Received Item <Text style={{color: '#EF4444'}}>*</Text></Text>
                    <View style={styles.imageRow}>
                      {returnImages.map((img, idx) => (
                        <Image key={idx} source={{ uri: img }} style={styles.previewImage} />
                      ))}
                      {returnImages.length < 3 && (
                        <TouchableOpacity 
                          style={styles.uploadBtn}
                          onPress={() => {
                            // Mock image upload
                            setReturnImages(prev => [...prev, 'https://picsum.photos/200?random=' + Math.random()]);
                          }}
                        >
                          <Upload size={24} color="#64748B" />
                          <Text style={styles.uploadText}>Add Photo</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.helperText}>Required to verify the wrong item claim.</Text>
                  </View>
                )}

                {returnAction === 'refund' && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.label}>Refund Method <Text style={{color: '#EF4444'}}>*</Text></Text>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                      {order.paymentMode !== 'cod' && (
                        <TouchableOpacity 
                          style={[styles.refundToggle, refundMethod === 'original' && styles.refundToggleActive]}
                          onPress={() => { setRefundMethod('original'); setRefundDetails('Original Payment Source'); }}
                        >
                          <Text style={[styles.refundToggleText, refundMethod === 'original' && styles.refundToggleTextActive]}>Original Source</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        style={[styles.refundToggle, refundMethod === 'upi' && styles.refundToggleActive]}
                        onPress={() => { setRefundMethod('upi'); setRefundDetails(refundDetails === 'Original Payment Source' ? '' : refundDetails); }}
                      >
                        <Text style={[styles.refundToggleText, refundMethod === 'upi' && styles.refundToggleTextActive]}>UPI</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.refundToggle, refundMethod === 'bank' && styles.refundToggleActive]}
                        onPress={() => { setRefundMethod('bank'); setRefundDetails(refundDetails === 'Original Payment Source' ? '' : refundDetails); }}
                      >
                        <Text style={[styles.refundToggleText, refundMethod === 'bank' && styles.refundToggleTextActive]}>Bank Account</Text>
                      </TouchableOpacity>
                    </View>
                    {refundMethod !== 'original' && (
                      <TextInput
                        style={[styles.input, { height: 48 }]}
                        placeholder={refundMethod === 'upi' ? "Enter UPI ID (e.g. name@okhdfcbank)" : "Enter A/C No. & IFSC Code"}
                        placeholderTextColor="#94A3B8"
                        value={refundDetails}
                        onChangeText={setRefundDetails}
                      />
                    )}
                    <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                      {refundMethod === 'original' 
                        ? "Refund will be credited to the original payment source." 
                        : "We need this to process your refund."}
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.submitBtn, (!reason || submitting) && styles.submitBtnDisabled]} 
                  onPress={handleSubmit}
                  disabled={!reason || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Submit Return Request</Text>
                      <ArrowRight size={18} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.errorBox}>
                <AlertCircle size={32} color="#EF4444" />
                <Text style={styles.errorTitle}>Pickup Not Available</Text>
                <Text style={styles.errorText}>
                  Sorry, Shadowfax reverse pickup is currently not serviceable at your pin code. 
                  Please contact our customer support for alternate return methods.
                </Text>
                <TouchableOpacity style={styles.supportBtn} onPress={onClose}>
                  <Text style={styles.supportBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '50%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
  },
  content: {
    padding: 20,
  },
  orderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 20,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  formContainer: {
    gap: 16,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  successText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    minHeight: 100,
  },
  refundToggle: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  refundToggleActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  refundToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  refundToggleTextActive: {
    color: '#4F46E5',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B91C1C',
  },
  errorText: {
    fontSize: 14,
    color: '#991B1B',
    textAlign: 'center',
    lineHeight: 20,
  },
  supportBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
  },
  supportBtnText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 14,
  },
  reasonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reasonPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  reasonPillText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  reasonPillTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  uploadSection: {
    marginBottom: 16,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  uploadBtn: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  }
});
