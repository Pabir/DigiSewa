import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Zap,
  Sparkles,
  FileText,
  ArrowRight,
  Book,
  Truck,
  Tag,
  ShieldAlert,
  CheckCircle,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { ESignatureModal } from '../../components/seller/ESignatureModal';
import { BulkCatalogUploadModal } from '../../components/seller/BulkCatalogUploadModal';

interface MeeshoSupplierHomeScreenProps {
  onNavigateToAddSingleCatalog: () => void;
  onNavigateToManageCatalogs: () => void;
  onNavigateToOrders: () => void;
  isDesktop?: boolean;
}

export const MeeshoSupplierHomeScreen: React.FC<MeeshoSupplierHomeScreenProps> = ({
  onNavigateToAddSingleCatalog,
  onNavigateToManageCatalogs,
  onNavigateToOrders,
}) => {
  const { sellerProfile } = useAuth();
  const storeName = sellerProfile?.storeName || 'DigiSewa Express Store';

  const [showESignatureModal, setShowESignatureModal] = useState<boolean>(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState<boolean>(false);
  const [isSignatureAdded, setIsSignatureAdded] = useState<boolean>(false);

  const isApproved = sellerProfile?.verificationStatus === 'verified';
  const hasSignature = Boolean(sellerProfile?.eSignatureText || sellerProfile?.eSignatureUrl);

  const handleSingleCatalogPress = () => {
    if (!isApproved) {
      const status = sellerProfile?.verificationStatus || 'pending';
      const msg =
        status === 'rejected'
          ? '❌ Account Rejected: Your seller application was rejected by Admin. You cannot add or sell products.'
          : status === 'suspended'
          ? '⚠️ Account Suspended: Your seller account has been suspended by Admin. You cannot add or sell products.'
          : '⏳ Approval Pending: Your seller account is awaiting Admin approval. You cannot add or sell products until approved by Admin.';
      alert(msg);
      return;
    }
    onNavigateToAddSingleCatalog();
  };

  const handleBulkCatalogPress = () => {
    if (!isApproved) {
      const status = sellerProfile?.verificationStatus || 'pending';
      const msg =
        status === 'rejected'
          ? '❌ Account Rejected: Your seller application was rejected by Admin. You cannot add or sell products.'
          : status === 'suspended'
          ? '⚠️ Account Suspended: Your seller account has been suspended by Admin. You cannot add or sell products.'
          : '⏳ Approval Pending: Your seller account is awaiting Admin approval. You cannot add or sell products until approved by Admin.';
      alert(msg);
      return;
    }
    setShowBulkUploadModal(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* --- UNIFIED HEADER & ALERTS --- */}
      <View style={styles.headerSection}>
        {/* Welcome Header */}
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Welcome back, {storeName}</Text>
            <Text style={styles.welcomeSub}>Manage your catalog, track orders, and grow your business.</Text>
          </View>
          <View style={styles.welcomeIconBox}>
            <LayoutDashboard size={40} color="#4F46E5" opacity={0.2} />
          </View>
        </View>

        {/* Global Alerts */}
        <View style={styles.alertsContainer}>
          {/* E-Signature Alert */}
          {!hasSignature ? (
            <View style={[styles.alertBanner, styles.alertDanger]}>
              <View style={styles.alertIconBox}>
                <ShieldAlert size={20} color="#DC2626" />
              </View>
              <View style={styles.alertTextContent}>
                <Text style={styles.alertTitle}>Action Required: Missing E-Signature</Text>
                <Text style={styles.alertDesc}>Required for automated customer invoicing & credit notes.</Text>
              </View>
              <TouchableOpacity style={styles.alertActionBtn} onPress={() => setShowESignatureModal(true)}>
                <Text style={styles.alertActionBtnText}>Add Signature</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.alertBanner, styles.alertSuccess]}>
              <View style={styles.alertIconBox}>
                <CheckCircle size={20} color="#16A34A" />
              </View>
              <View style={styles.alertTextContent}>
                <Text style={[styles.alertTitle, { color: '#166534' }]}>E-Signature Verified</Text>
                <Text style={[styles.alertDesc, { color: '#15803D' }]}>Active for automated GST customer invoices.</Text>
              </View>
              <TouchableOpacity style={styles.alertActionBtnOutline} onPress={() => setShowESignatureModal(true)}>
                <Text style={styles.alertActionBtnTextOutline}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Verification Status */}
          {sellerProfile?.verificationStatus !== 'verified' ? (
            <View style={[styles.alertBanner, sellerProfile?.verificationStatus === 'rejected' ? styles.alertDanger : styles.alertWarning]}>
              <View style={styles.alertIconBox}>
                <Clock size={20} color={sellerProfile?.verificationStatus === 'rejected' ? '#DC2626' : '#D97706'} />
              </View>
              <View style={styles.alertTextContent}>
                <Text style={[styles.alertTitle, sellerProfile?.verificationStatus === 'rejected' && { color: '#991B1B' }]}>
                  {sellerProfile?.verificationStatus === 'rejected' ? 'Account Rejected' : sellerProfile?.verificationStatus === 'suspended' ? 'Account Suspended' : 'Approval Pending'}
                </Text>
                <Text style={[styles.alertDesc, sellerProfile?.verificationStatus === 'rejected' && { color: '#7F1D1D' }]}>
                  {sellerProfile?.verificationStatus === 'rejected'
                    ? `Reason: ${sellerProfile.rejectionReason || 'Document verification failed'}`
                    : sellerProfile?.verificationStatus === 'suspended'
                    ? 'Account suspended by Admin. Selling disabled.'
                    : 'Account under review. You cannot sell products yet.'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.alertBanner, styles.alertSuccess]}>
              <View style={styles.alertIconBox}>
                <CheckCircle size={20} color="#16A34A" />
              </View>
              <View style={styles.alertTextContent}>
                <Text style={[styles.alertTitle, { color: '#166534' }]}>Store Approved & Live</Text>
                <Text style={[styles.alertDesc, { color: '#15803D' }]}>Your store is verified. You can now publish catalogs.</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* --- DASHBOARD MAIN CONTENT --- */}
      <View style={styles.dashboardGrid}>
        
        {/* LEFT COLUMN: ACTION HUB */}
        <View style={styles.leftCol}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSub}>Select a method to upload your products</Text>
          </View>

          <View style={styles.actionCardsRow}>
            {/* Single Catalog Card */}
            <TouchableOpacity style={styles.actionCard} onPress={handleSingleCatalogPress} activeOpacity={0.8}>
              <View style={[styles.actionIconWrapper, { backgroundColor: '#EEF2FF' }]}>
                <FileText size={28} color="#4F46E5" />
              </View>
              <Text style={styles.actionCardTitle}>Upload Single Catalog</Text>
              <Text style={styles.actionCardDesc}>Perfect for adding one product with multiple variants interactively.</Text>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={14} color="#64748B" />
                  <Text style={styles.featureText}>Step-by-step wizard</Text>
                </View>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={14} color="#64748B" />
                  <Text style={styles.featureText}>No excel required</Text>
                </View>
              </View>
              <View style={styles.actionBtnPrimary}>
                <Text style={styles.actionBtnPrimaryText}>Add Single Catalog</Text>
              </View>
            </TouchableOpacity>

            {/* Bulk Catalog Card */}
            <TouchableOpacity style={styles.actionCard} onPress={handleBulkCatalogPress} activeOpacity={0.8}>
              <View style={[styles.actionIconWrapper, { backgroundColor: '#F0FDF4' }]}>
                <FileText size={28} color="#16A34A" />
              </View>
              <Text style={styles.actionCardTitle}>Upload Bulk Catalog</Text>
              <Text style={styles.actionCardDesc}>Fastest way to upload hundreds of products via a spreadsheet.</Text>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={14} color="#64748B" />
                  <Text style={styles.featureText}>Template provided</Text>
                </View>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={14} color="#64748B" />
                  <Text style={styles.featureText}>Automated validation</Text>
                </View>
              </View>
              <View style={[styles.actionBtnPrimary, styles.actionBtnOutline]}>
                <Text style={[styles.actionBtnPrimaryText, styles.actionBtnOutlineText]}>Upload Excel File</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* RIGHT COLUMN: WIDGETS */}
        <View style={styles.rightCol}>
          
          {/* Setup Checklist */}
          <View style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Account Setup</Text>
              <Text style={styles.widgetBadge}>1/2 Complete</Text>
            </View>
            <View style={styles.checklistContainer}>
              <TouchableOpacity style={styles.checklistItem}>
                <View style={[styles.checkCircle, styles.checkCircleDone]}>
                  <CheckCircle2 size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.checklistTextDone}>Set Password</Text>
              </TouchableOpacity>

              {!hasSignature ? (
                <TouchableOpacity style={styles.checklistItem} onPress={() => setShowESignatureModal(true)}>
                  <View style={styles.checkCircle}>
                    <Plus size={16} color="#4F46E5" />
                  </View>
                  <Text style={styles.checklistTextPending}>Add E-Signature</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.checklistItem}>
                  <View style={[styles.checkCircle, styles.checkCircleDone]}>
                    <CheckCircle2 size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.checklistTextDone}>Add E-Signature</Text>
                </View>
              )}
            </View>
          </View>

          {/* Resource Center */}
          <View style={styles.widgetCard}>
            <Text style={styles.widgetTitle}>Resource Center</Text>
            <Text style={styles.widgetSub}>Learn how to grow your sales</Text>
            
            <View style={styles.resourcesList}>
              <TouchableOpacity style={styles.resourceItem}>
                <View style={[styles.resourceIcon, { backgroundColor: '#FDF2F8' }]}>
                  <Book size={16} color="#DB2777" />
                </View>
                <View style={styles.resourceTextCol}>
                  <Text style={styles.resourceTitle}>Seller Guidelines</Text>
                  <Text style={styles.resourceDesc}>How to prepare your catalogs</Text>
                </View>
                <ArrowRight size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.resourceItem}>
                <View style={[styles.resourceIcon, { backgroundColor: '#FEF2F2' }]}>
                  <Tag size={16} color="#DC2626" />
                </View>
                <View style={styles.resourceTextCol}>
                  <Text style={styles.resourceTitle}>Pricing & Commission</Text>
                  <Text style={styles.resourceDesc}>Understand your payouts</Text>
                </View>
                <ArrowRight size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.resourceItem}>
                <View style={[styles.resourceIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Truck size={16} color="#16A34A" />
                </View>
                <View style={styles.resourceTextCol}>
                  <Text style={styles.resourceTitle}>Logistics & Returns</Text>
                  <Text style={styles.resourceDesc}>Shipping procedures</Text>
                </View>
                <ArrowRight size={16} color="#CBD5E1" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.resourceItem, { borderBottomWidth: 0 }]}>
                <View style={[styles.resourceIcon, { backgroundColor: '#EEF2FF' }]}>
                  <TrendingUp size={16} color="#4F46E5" />
                </View>
                <View style={styles.resourceTextCol}>
                  <Text style={styles.resourceTitle}>Live Training</Text>
                  <Text style={styles.resourceDesc}>Book an expert-led session</Text>
                </View>
                <ArrowRight size={16} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>

      {/* Modals */}
      <ESignatureModal
        visible={showESignatureModal}
        onClose={() => setShowESignatureModal(false)}
        onSave={() => setIsSignatureAdded(true)}
      />

      <BulkCatalogUploadModal
        visible={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={onNavigateToManageCatalogs}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 24,
    gap: 24,
  },
  headerSection: {
    gap: 16,
  },
  welcomeBanner: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeContent: {
    flex: 1,
    zIndex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 14,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  welcomeIconBox: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -20 }],
    zIndex: 0,
  },
  alertsContainer: {
    gap: 12,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  alertDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  alertSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  alertWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  alertIconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTextContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  alertDesc: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
  },
  alertActionBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  alertActionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertActionBtnTextOutline: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '700',
  },
  dashboardGrid: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  leftCol: {
    flex: 2,
    minWidth: 280,
  },
  rightCol: {
    flex: 1,
    minWidth: 260,
    gap: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  actionCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  actionCardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
    minHeight: 40,
  },
  featureList: {
    gap: 8,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  actionBtnPrimary: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#16A34A',
  },
  actionBtnOutlineText: {
    color: '#16A34A',
  },
  widgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  widgetBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  widgetSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  checklistContainer: {
    gap: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleDone: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  checklistTextDone: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  checklistTextPending: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '700',
  },
  resourcesList: {
    marginTop: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resourceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceTextCol: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  resourceDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});


