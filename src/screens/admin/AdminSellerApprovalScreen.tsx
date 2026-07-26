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
import { AdminSeller, SellerApprovalStatus } from '../../types/adminTypes';
import { Search, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react-native';

interface AdminSellerApprovalScreenProps {
  sellers: AdminSeller[];
  onApproveSeller: (sellerId: string) => void;
  onRejectSeller: (sellerId: string, reason: string) => void;
  onSuspendSeller: (sellerId: string) => void;
}

export const AdminSellerApprovalScreen: React.FC<AdminSellerApprovalScreenProps> = ({
  sellers,
  onApproveSeller,
  onRejectSeller,
  onSuspendSeller,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<SellerApprovalStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSellerForReview, setSelectedSellerForReview] = useState<AdminSeller | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);

  const filteredSellers = sellers.filter((s) => {
    const matchesStatus = selectedStatusFilter === 'all' || s.status === selectedStatusFilter;
    const matchesSearch =
      s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.gstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: SellerApprovalStatus) => {
    switch (status) {
      case 'approved':
        return (
          <View style={[styles.statusBadge, styles.badgeApproved]}>
            <Text style={styles.badgeTextApproved}>Approved / Active</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.statusBadge, styles.badgePending]}>
            <Text style={styles.badgeTextPending}>Pending Approval</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusBadge, styles.badgeRejected]}>
            <Text style={styles.badgeTextRejected}>Rejected</Text>
          </View>
        );
      case 'suspended':
        return (
          <View style={[styles.statusBadge, styles.badgeSuspended]}>
            <Text style={styles.badgeTextSuspended}>Suspended</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Title Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.screenTitle}>Seller Account Approval & Verification</Text>
          <Text style={styles.screenSub}>
            Verify GSTIN certificates, Bank Accounts, and approve merchant store registrations.
          </Text>
        </View>

        <View style={styles.countTag}>
          <Text style={styles.countTagText}>
            {sellers.filter((s) => s.status === 'pending').length} Pending Review
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Status Filter Bar */}
        <View style={styles.filterControlsRow}>
          <View style={styles.pillsRow}>
            {[
              { key: 'all', label: `All Sellers (${sellers.length})` },
              { key: 'pending', label: `Pending (${sellers.filter((s) => s.status === 'pending').length})` },
              { key: 'approved', label: `Approved (${sellers.filter((s) => s.status === 'approved').length})` },
              { key: 'rejected', label: `Rejected (${sellers.filter((s) => s.status === 'rejected').length})` },
              { key: 'suspended', label: `Suspended (${sellers.filter((s) => s.status === 'suspended').length})` },
            ].map((pill) => (
              <TouchableOpacity
                key={pill.key}
                style={[
                  styles.filterPill,
                  selectedStatusFilter === pill.key && styles.filterPillActive,
                ]}
                onPress={() => setSelectedStatusFilter(pill.key as any)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedStatusFilter === pill.key && styles.filterPillTextActive,
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search Input */}
          <View style={styles.searchBar}>
            <Search size={16} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Store Name, Owner, GSTIN, Email"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Sellers Table */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 780 }}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.5 }]}>Store & Owner</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>GSTIN & PAN</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Bank Details</Text>
                <Text style={[styles.th, { flex: 1 }]}>Status</Text>
                <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Actions</Text>
              </View>

              {filteredSellers.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No seller accounts found matching criteria.</Text>
                </View>
              ) : (
                filteredSellers.map((seller) => (
                  <View key={seller.id} style={styles.tableRow}>
                    {/* Store Name & Owner */}
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.storeNameText}>{seller.storeName}</Text>
                      <Text style={styles.ownerText}>👤 {seller.ownerName}</Text>
                      <Text style={styles.subText}>{seller.email} | {seller.phone}</Text>
                    </View>

                    {/* GSTIN & PAN */}
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.gstinText}>GST: {seller.gstin}</Text>
                      <Text style={styles.panText}>PAN: {seller.panNumber}</Text>
                      <Text style={styles.subText}>{seller.city}, {seller.state}</Text>
                    </View>

                    {/* Bank Details */}
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.bankText}>{seller.bankName}</Text>
                      <Text style={styles.subText}>A/C: {seller.bankAccountNo}</Text>
                      <Text style={styles.subText}>IFSC: {seller.ifscCode}</Text>
                    </View>

                    {/* Status Badge */}
                    <View style={{ flex: 1 }}>{getStatusBadge(seller.status)}</View>

                    {/* Action Buttons */}
                    <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => setSelectedSellerForReview(seller)}
                      >
                        <Text style={styles.reviewBtnText}>Review Details</Text>
                      </TouchableOpacity>

                      {seller.status === 'pending' && (
                        <TouchableOpacity
                          style={styles.quickApproveBtn}
                          onPress={() => onApproveSeller(seller.id)}
                        >
                          <Text style={styles.quickApproveBtnText}>Approve</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Seller Verification Drawer Modal */}
      {selectedSellerForReview && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedSellerForReview.storeName}</Text>
                  <Text style={styles.modalSub}>Seller ID: {selectedSellerForReview.id}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedSellerForReview(null)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }}>
                {/* Status Banner */}
                <View style={styles.reviewStatusBox}>
                  <Text style={styles.reviewStatusLabel}>Current Account Status:</Text>
                  {getStatusBadge(selectedSellerForReview.status)}
                </View>

                {/* Verification Fields Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailBoxLabel}>Merchant Store Name</Text>
                    <Text style={styles.detailBoxVal}>{selectedSellerForReview.storeName}</Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailBoxLabel}>Owner / Authorized Contact</Text>
                    <Text style={styles.detailBoxVal}>{selectedSellerForReview.ownerName}</Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailBoxLabel}>GSTIN Certificate Number</Text>
                    <Text style={styles.detailBoxValBold}>{selectedSellerForReview.gstin}</Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailBoxLabel}>PAN Card Number</Text>
                    <Text style={styles.detailBoxValBold}>{selectedSellerForReview.panNumber}</Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailBoxLabel}>Bank Name & Account No.</Text>
                    <Text style={styles.detailBoxVal}>
                      {selectedSellerForReview.bankName} - {selectedSellerForReview.bankAccountNo}
                    </Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailBoxLabel}>IFSC Code</Text>
                    <Text style={styles.detailBoxValBold}>{selectedSellerForReview.ifscCode}</Text>
                  </View>

                  <View style={styles.detailBoxFullWidth}>
                    <Text style={styles.detailBoxLabel}>Registered Store Address</Text>
                    <Text style={styles.detailBoxVal}>
                      {selectedSellerForReview.storeAddress}, {selectedSellerForReview.city},{' '}
                      {selectedSellerForReview.state} - {selectedSellerForReview.pincode}
                    </Text>
                  </View>

                  <View style={styles.detailBoxFullWidth}>
                    <Text style={styles.detailBoxLabel}>Digital E-Signature Status</Text>
                    <Text style={{ fontSize: 12, color: '#059669', fontWeight: '800' }}>
                      ✓ E-Signature Verified on File
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalFooter}>
                {selectedSellerForReview.status !== 'approved' && (
                  <TouchableOpacity
                    style={styles.approveActionBtn}
                    onPress={() => {
                      onApproveSeller(selectedSellerForReview.id);
                      setSelectedSellerForReview(null);
                    }}
                  >
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.approveActionBtnText}>Approve & Activate Account</Text>
                  </TouchableOpacity>
                )}

                {selectedSellerForReview.status !== 'rejected' && (
                  <TouchableOpacity
                    style={styles.rejectActionBtn}
                    onPress={() => {
                      setShowRejectModal(true);
                    }}
                  >
                    <AlertTriangle size={16} color="#FFFFFF" />
                    <Text style={styles.rejectActionBtnText}>Reject Application</Text>
                  </TouchableOpacity>
                )}

                {selectedSellerForReview.status === 'approved' && (
                  <TouchableOpacity
                    style={styles.suspendActionBtn}
                    onPress={() => {
                      onSuspendSeller(selectedSellerForReview.id);
                      setSelectedSellerForReview(null);
                    }}
                  >
                    <Text style={styles.suspendActionBtnText}>Suspend Account</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && selectedSellerForReview && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: 450 }]}>
              <Text style={styles.modalTitle}>Reject Seller Application</Text>
              <Text style={styles.modalSub}>
                Specify why {selectedSellerForReview.storeName}'s application is being rejected.
              </Text>

              <TextInput
                style={styles.reasonInput}
                multiline
                numberOfLines={3}
                placeholder="Enter rejection reason (e.g. Invalid GSTIN certificate or mismatched bank name)"
                value={rejectionReasonInput}
                onChangeText={setRejectionReasonInput}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowRejectModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmRejectBtn}
                  onPress={() => {
                    if (!rejectionReasonInput.trim()) {
                      alert('Please provide a reason for rejection.');
                      return;
                    }
                    onRejectSeller(selectedSellerForReview.id, rejectionReasonInput);
                    setShowRejectModal(false);
                    setSelectedSellerForReview(null);
                    setRejectionReasonInput('');
                  }}
                >
                  <Text style={styles.confirmRejectBtnText}>Confirm Rejection</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  countTag: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  countTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  filterPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#4338CA',
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    flex: 1,
    minWidth: 220,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
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
  storeNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  ownerText: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  subText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  gstinText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  panText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  bankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeApproved: { backgroundColor: '#ECFDF5' },
  badgeTextApproved: { fontSize: 11, fontWeight: '800', color: '#059669' },
  badgePending: { backgroundColor: '#FEF2F2' },
  badgeTextPending: { fontSize: 11, fontWeight: '800', color: '#DC2626' },
  badgeRejected: { backgroundColor: '#F1F5F9' },
  badgeTextRejected: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  badgeSuspended: { backgroundColor: '#FFFBEB' },
  badgeTextSuspended: { fontSize: 11, fontWeight: '800', color: '#D97706' },
  reviewBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
  },
  quickApproveBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickApproveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
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
    maxWidth: 680,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748B',
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64748B',
  },
  reviewStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    marginBottom: 14,
  },
  reviewStatusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailBoxFullWidth: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  detailBoxVal: {
    fontSize: 12,
    color: '#0F172A',
    marginTop: 2,
  },
  detailBoxValBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338CA',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  approveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  approveActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  rejectActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  rejectActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  suspendActionBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  suspendActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  reasonInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 10,
    fontSize: 12,
    color: '#0F172A',
    marginTop: 12,
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
  confirmRejectBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  confirmRejectBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
