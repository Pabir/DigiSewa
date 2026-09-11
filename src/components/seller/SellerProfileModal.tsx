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
  User,
  Building2,
  MapPin,
  CreditCard,
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Phone,
  Mail,
  Star,
  ShoppingBag,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { ESignatureModal } from './ESignatureModal';

export const SellerProfileModal: React.FC = () => {
  const { sellerProfile, isSellerProfileModalOpen, closeSellerProfileModal } = useAuth();
  const [showESignatureModal, setShowESignatureModal] = React.useState<boolean>(false);

  if (!sellerProfile) return null;

  const sellerIdCode = `DigiSewa-SLR-${sellerProfile.id.replace(/[^0-9]/g, '') || '98421'}`;

  const renderStatusBadge = () => {
    switch (sellerProfile.verificationStatus) {
      case 'verified':
        return (
          <View style={[styles.statusBadge, styles.statusVerified]}>
            <CheckCircle2 size={14} color="#059669" />
            <Text style={styles.statusVerifiedText}>Verified Seller Account</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Clock size={14} color="#D97706" />
            <Text style={styles.statusPendingText}>Pending Admin Approval</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusBadge, styles.statusRejected]}>
            <AlertTriangle size={14} color="#DC2626" />
            <Text style={styles.statusRejectedText}>Account Rejected</Text>
          </View>
        );
      case 'suspended':
        return (
          <View style={[styles.statusBadge, styles.statusSuspended]}>
            <XCircle size={14} color="#D97706" />
            <Text style={styles.statusSuspendedText}>Account Suspended</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={isSellerProfileModalOpen}
      transparent
      animationType="fade"
      onRequestClose={closeSellerProfileModal}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>
                  {sellerProfile.storeName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.storeTitle}>{sellerProfile.storeName}</Text>
                <Text style={styles.sellerIdText}>
                  Seller ID: <Text style={styles.boldId}>{sellerIdCode}</Text>
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={closeSellerProfileModal}
              activeOpacity={0.7}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Status Banner */}
            <View style={styles.statusSection}>
              <Text style={styles.sectionLabel}>Account Verification Status</Text>
              {renderStatusBadge()}
              {sellerProfile.rejectionReason && (
                <Text style={styles.rejectionReasonText}>
                  Rejection Reason: {sellerProfile.rejectionReason}
                </Text>
              )}
            </View>

            {/* Store Metrics Summary */}
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Star size={16} color="#D97706" />
                <Text style={styles.metricVal}>{sellerProfile.rating || 5.0} ★</Text>
                <Text style={styles.metricSub}>Store Rating</Text>
              </View>

              <View style={styles.metricBox}>
                <ShoppingBag size={16} color="#4F46E5" />
                <Text style={styles.metricVal}>
                  ₹{(sellerProfile.totalSales || 0).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.metricSub}>Total Sales</Text>
              </View>

              <View style={styles.metricBox}>
                <Sparkles size={16} color="#059669" />
                <Text style={styles.metricVal}>Active</Text>
                <Text style={styles.metricSub}>Merchant Level</Text>
              </View>
            </View>

            {/* 1. Contact & Owner Details */}
            <View style={styles.cardSection}>
              <View style={styles.sectionTitleRow}>
                <User size={16} color="#4F46E5" />
                <Text style={styles.cardTitle}>Owner & Contact Information</Text>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.fieldLabel}>Owner / Contact Name</Text>
                  <Text style={styles.fieldValue}>{sellerProfile.ownerName || sellerProfile.storeName}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  <Text style={styles.fieldValue}>{sellerProfile.phone}</Text>
                </View>

                <View style={styles.detailItemFull}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  <Text style={styles.fieldValue}>{sellerProfile.email || 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* 2. Business & Tax Identifiers */}
            <View style={styles.cardSection}>
              <View style={styles.sectionTitleRow}>
                <ShieldCheck size={16} color="#059669" />
                <Text style={styles.cardTitle}>Business & Tax Registrations</Text>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.fieldLabel}>GSTIN Certificate</Text>
                  <Text style={styles.fieldValueHighlight}>
                    {sellerProfile.hasGst && sellerProfile.gstin ? sellerProfile.gstin : 'GST Not Registered'}
                  </Text>
                </View>

                {sellerProfile.eidNumber && (
                  <View style={styles.detailItem}>
                    <Text style={styles.fieldLabel}>Enrolment ID (EID)</Text>
                    <Text style={styles.fieldValueHighlight}>{sellerProfile.eidNumber}</Text>
                  </View>
                )}

                <View style={styles.detailItem}>
                  <Text style={styles.fieldLabel}>PAN Card Number</Text>
                  <Text style={styles.fieldValueHighlight}>{sellerProfile.panNumber || 'N/A'}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.fieldLabel}>Name on PAN</Text>
                  <Text style={styles.fieldValue}>{sellerProfile.nameAsPerPan || sellerProfile.ownerName || 'N/A'}</Text>
                </View>

                <View style={styles.detailItemFull}>
                  <Text style={styles.fieldLabel}>Business Model Type</Text>
                  <Text style={styles.fieldValue}>
                    {sellerProfile.businessType || 'Direct Online Manufacturer & Retailer'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 2.5 GST Invoice E-Signature */}
            <View style={styles.cardSection}>
              <View style={[styles.sectionTitleRow, { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} color="#E00A67" />
                  <Text style={styles.cardTitle}>GST Tax Invoice E-Signature</Text>
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: '#FCE7F3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
                  onPress={() => setShowESignatureModal(true)}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#E00A67' }}>
                    {sellerProfile.eSignatureText || sellerProfile.eSignatureUrl ? 'Update Signature' : '+ Add Signature'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItemFull}>
                  <Text style={styles.fieldLabel}>Signatory Status</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: sellerProfile.eSignatureText || sellerProfile.eSignatureUrl ? '#059669' : '#DC2626', marginTop: 2 }}>
                    {sellerProfile.eSignatureText || sellerProfile.eSignatureUrl ? '✓ E-Signature Attached & Digitally Sealed' : '⚠️ Missing E-Signature'}
                  </Text>
                </View>
                {sellerProfile.eSignatureText && (
                  <View style={styles.detailItemFull}>
                    <Text style={styles.fieldLabel}>Signatory Name / Designation</Text>
                    <Text style={[styles.fieldValue, { fontStyle: 'italic', color: '#3B0764' }]}>
                      "{sellerProfile.eSignatureText}"
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* 3. Dispatch & Pickup Address */}
            <View style={styles.cardSection}>
              <View style={styles.sectionTitleRow}>
                <MapPin size={16} color="#4F46E5" />
                <Text style={styles.cardTitle}>Dispatch & Pickup Address</Text>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItemFull}>
                  <Text style={styles.fieldLabel}>Business Address</Text>
                  <Text style={styles.fieldValue}>{sellerProfile.businessAddress}</Text>
                </View>

                {sellerProfile.pickupAddress && (
                  <>
                    <View style={styles.detailItem}>
                      <Text style={styles.fieldLabel}>Building / Suite</Text>
                      <Text style={styles.fieldValue}>{sellerProfile.pickupAddress.building}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.fieldLabel}>Pincode</Text>
                      <Text style={styles.fieldValue}>{sellerProfile.pickupAddress.pincode}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.fieldLabel}>City / District</Text>
                      <Text style={styles.fieldValue}>{sellerProfile.pickupAddress.city}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.fieldLabel}>State</Text>
                      <Text style={styles.fieldValue}>{sellerProfile.pickupAddress.state}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* 4. Bank Account Payout Settlement Details */}
            <View style={styles.cardSection}>
              <View style={styles.sectionTitleRow}>
                <CreditCard size={16} color="#2563EB" />
                <Text style={styles.cardTitle}>Bank Account Settlement Details</Text>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.fieldLabel}>Bank Name</Text>
                  <Text style={styles.fieldValue}>
                    {sellerProfile.bankDetails?.bankName || 'ICICI Bank'}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.fieldLabel}>IFSC Code</Text>
                  <Text style={styles.fieldValueHighlight}>
                    {sellerProfile.bankDetails?.ifscCode || 'ICIC0000456'}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.fieldLabel}>Account Holder Name</Text>
                  <Text style={styles.fieldValue}>
                    {sellerProfile.bankDetails?.accountHolderName || sellerProfile.ownerName || sellerProfile.storeName}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.fieldLabel}>Bank Account Number</Text>
                  <Text style={styles.fieldValueHighlight}>
                    {sellerProfile.bankDetails?.accountNumber || '••••••••1123'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={closeSellerProfileModal}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Close Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ESignatureModal
        visible={showESignatureModal}
        onClose={() => setShowESignatureModal(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#818CF8',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  storeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  sellerIdText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  boldId: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  statusSection: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusVerified: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusVerifiedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  statusPending: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusPendingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  statusRejected: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  statusRejectedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  statusSuspended: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusSuspendedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  rejectionReasonText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  metricSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    width: '48%',
  },
  detailItemFull: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  fieldValueHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338CA',
    marginTop: 2,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'flex-end',
  },
  doneBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
