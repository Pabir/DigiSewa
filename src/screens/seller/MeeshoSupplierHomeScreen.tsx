import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Zap,
  Sparkles,
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
  const storeName = sellerProfile.storeName || 'Al Mursaleen Stores';

  const [showESignatureModal, setShowESignatureModal] = useState<boolean>(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState<boolean>(false);
  const [isSignatureAdded, setIsSignatureAdded] = useState<boolean>(false);
  const [activeStepTab, setActiveStepTab] = useState<number>(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 1. TOP NOTIFICATION BANNERS */}

      {/* Red Banner: E-Signature Missing */}
      {!isSignatureAdded && (
        <View style={styles.bannerRed}>
          <View style={styles.bannerIconBoxRed}>
            <AlertTriangle size={18} color="#DC2626" />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerRedTitle}>Your E-Signature is missing!</Text>
            <Text style={styles.bannerRedSub}>
              E-signature is required for raising invoices / credit notes on your behalf to customers
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addSignatureBtn}
            onPress={() => setShowESignatureModal(true)}
          >
            <Text style={styles.addSignatureBtnText}>Add Signature</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Yellow Banner: Bank Verification Pending */}
      <View style={styles.bannerYellow}>
        <View style={styles.bannerIconBoxYellow}>
          <Clock size={18} color="#D97706" />
        </View>
        <View style={styles.bannerTextCol}>
          <Text style={styles.bannerYellowTitle}>Bank Verification Pending</Text>
          <Text style={styles.bannerYellowSub}>
            We will inform you once your account is verified, please continue to upload your catalogs.
          </Text>
        </View>
      </View>

      {/* 2. WELCOME HEADER & NEED HELP */}
      <View style={styles.welcomeRow}>
        <View>
          <Text style={styles.welcomeTitle}>Welcome {storeName}</Text>
          <Text style={styles.welcomeSub}>Let's get your business started in 3 steps</Text>
        </View>

        <TouchableOpacity style={styles.needHelpBtn}>
          <Sparkles size={16} color="#4F46E5" />
          <Text style={styles.needHelpBtnText}>Need Help?</Text>
        </TouchableOpacity>
      </View>

      {/* 3. MAIN DASHBOARD CONTENT (LEFT CATALOG CARDS & RIGHT WIDGETS) */}
      <View style={styles.dashboardGrid}>
        {/* LEFT COLUMN: 3-STEP PROGRESS & CATALOG UPLOADS */}
        <View style={styles.leftCol}>
          {/* 3-Step Progress Header */}
          <View style={styles.stepTabsCard}>
            <View style={styles.stepTabsHeader}>
              <TouchableOpacity
                style={[styles.stepTabItem, activeStepTab === 1 && styles.stepTabItemActive]}
                onPress={() => setActiveStepTab(1)}
              >
                <View style={[styles.stepNum, activeStepTab === 1 && styles.stepNumActive]}>
                  <Text style={[styles.stepNumText, activeStepTab === 1 && styles.stepNumTextActive]}>1</Text>
                </View>
                <Text style={[styles.stepTabText, activeStepTab === 1 && styles.stepTabTextActive]}>
                  Upload catalogs to get started
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stepTabItem, activeStepTab === 2 && styles.stepTabItemActive]}
                onPress={() => setActiveStepTab(2)}
              >
                <View style={[styles.stepNum, activeStepTab === 2 && styles.stepNumActive]}>
                  <Text style={[styles.stepNumText, activeStepTab === 2 && styles.stepNumTextActive]}>2</Text>
                </View>
                <Text style={[styles.stepTabText, activeStepTab === 2 && styles.stepTabTextActive]}>
                  Catalogs go live on DigiSewa
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stepTabItem, activeStepTab === 3 && styles.stepTabItemActive]}
                onPress={() => setActiveStepTab(3)}
              >
                <View style={[styles.stepNum, activeStepTab === 3 && styles.stepNumActive]}>
                  <Text style={[styles.stepNumText, activeStepTab === 3 && styles.stepNumTextActive]}>3</Text>
                </View>
                <Text style={[styles.stepTabText, activeStepTab === 3 && styles.stepTabTextActive]}>
                  Get your first order
                </Text>
              </TouchableOpacity>
            </View>

            {/* Catalog Upload Methods Row */}
            <View style={styles.uploadCardsRow}>
              {/* Card 1: Upload Single Catalog */}
              <View style={styles.uploadCard}>
                <Text style={styles.uploadCardTitle}>Upload Single Catalog</Text>

                {/* Banner Thumbnail */}
                <View style={styles.illustrationBox}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' }}
                    style={styles.presenterImage}
                  />
                  <View style={styles.playBadge}>
                    <Sparkles size={14} color="#FFFFFF" />
                  </View>
                </View>

                {/* Bullet Points */}
                <View style={styles.bulletsList}>
                  <View style={styles.bulletRow}>
                    <CheckCircle2 size={14} color="#059669" />
                    <Text style={styles.bulletText}>Add one catalog at a time</Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <CheckCircle2 size={14} color="#059669" />
                    <Text style={styles.bulletText}>Excel sheet not required</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.singleCatalogBtn} onPress={onNavigateToAddSingleCatalog}>
                  <Text style={styles.singleCatalogBtnText}>Add Single Catalog</Text>
                </TouchableOpacity>
              </View>

              {/* Card 2: Upload Bulk Catalog */}
              <View style={styles.uploadCard}>
                <Text style={styles.uploadCardTitle}>Upload Bulk Catalog</Text>

                {/* Banner Thumbnail */}
                <View style={styles.illustrationBox}>
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' }}
                    style={styles.presenterImage}
                  />
                  <View style={styles.excelBadge}>
                    <Sparkles size={16} color="#16A34A" />
                  </View>
                </View>

                {/* Bullet Points */}
                <View style={styles.bulletsList}>
                  <View style={styles.bulletRow}>
                    <CheckCircle2 size={14} color="#059669" />
                    <Text style={styles.bulletText}>Add multiple catalog at a time</Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <CheckCircle2 size={14} color="#059669" />
                    <Text style={styles.bulletText}>Requires excel sheet</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.bulkCatalogBtn} onPress={() => setShowBulkUploadModal(true)}>
                  <Text style={styles.bulkCatalogBtnText}>Add Catalogs in Bulk</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* RIGHT COLUMN: ACCOUNT SETUP & LEARN & GROW WIDGETS */}
        <View style={styles.rightCol}>
          {/* Widget 1: Complete your account setup */}
          <View style={styles.widgetCard}>
            <Text style={styles.widgetTitle}>Complete your account setup</Text>
            <Text style={styles.widgetSub}>Add the below information to improve your selling journey</Text>

            <TouchableOpacity style={styles.setupItemBtn}>
              <Plus size={16} color="#4F46E5" />
              <Text style={styles.setupItemText}>Set Password</Text>
            </TouchableOpacity>

            {!isSignatureAdded && (
              <TouchableOpacity style={styles.setupItemBtn} onPress={() => setShowESignatureModal(true)}>
                <Plus size={16} color="#E00A67" />
                <Text style={styles.setupItemTextAlt}>Add E-Signature</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Widget 2: Learn & Grow On DigiSewa */}
          <View style={styles.widgetCard}>
            <Text style={styles.widgetTitle}>Learn & Grow On DigiSewa</Text>

            <TouchableOpacity style={styles.learnRow}>
              <View style={styles.learnLeft}>
                <View style={[styles.learnIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Zap size={16} color="#4F46E5" />
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.learnTitle}>Book free live training</Text>
                    <View style={styles.expertBadge}>
                      <Text style={styles.expertBadgeText}>Expert Led</Text>
                    </View>
                  </View>
                  <Text style={styles.learnSub}>Learn to operate and grow your business on DigiSewa.</Text>
                </View>
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.learnRow}>
              <View style={styles.learnLeft}>
                <View style={[styles.learnIconBox, { backgroundColor: '#FEF2F2' }]}>
                  <Sparkles size={16} color="#DC2626" />
                </View>
                <Text style={styles.learnTitle}>Prepare catalogs for DigiSewa</Text>
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.learnRow}>
              <View style={styles.learnLeft}>
                <View style={[styles.learnIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#059669' }}>%</Text>
                </View>
                <Text style={styles.learnTitle}>Pricing & commission</Text>
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.learnRow}>
              <View style={styles.learnLeft}>
                <View style={[styles.learnIconBox, { backgroundColor: '#FDF2F8' }]}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#E00A67' }}>🚚</Text>
                </View>
                <Text style={styles.learnTitle}>Delivery & Returns</Text>
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>›</Text>
            </TouchableOpacity>
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
    backgroundColor: '#F3F4F6',
  },
  contentContainer: {
    padding: 20,
    gap: 14,
  },
  bannerRed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconBoxRed: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerRedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  bannerRedSub: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 2,
  },
  addSignatureBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  addSignatureBtnText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerYellow: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconBoxYellow: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerYellowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  bannerYellowSub: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 2,
  },
  welcomeRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  welcomeSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  needHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  needHelpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  dashboardGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  leftCol: {
    flex: 2,
    minWidth: 270,
  },
  rightCol: {
    flex: 1,
    minWidth: 260,
    gap: 14,
  },
  stepTabsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepTabsHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
    marginBottom: 20,
    gap: 12,
  },
  stepTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flex: 1,
  },
  stepTabItemActive: {
    borderBottomColor: '#4F46E5',
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  stepNumTextActive: {
    color: '#4F46E5',
  },
  stepTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  stepTabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  uploadCardsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  uploadCard: {
    flex: 1,
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  uploadCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  illustrationBox: {
    height: 120,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 14,
    position: 'relative',
  },
  presenterImage: {
    width: '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute',
    top: '40%',
    left: '42%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  excelBadge: {
    position: 'absolute',
    top: '36%',
    left: '42%',
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bulletsList: {
    gap: 8,
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bulletText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  singleCatalogBtn: {
    backgroundColor: '#4338CA',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  singleCatalogBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bulkCatalogBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3730A3',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  bulkCatalogBtnText: {
    color: '#3730A3',
    fontSize: 13,
    fontWeight: '700',
  },
  widgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  widgetSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 12,
  },
  setupItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  setupItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  setupItemTextAlt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  learnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  learnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  learnIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  learnTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  learnSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  expertBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  expertBadgeText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '800',
  },
});
