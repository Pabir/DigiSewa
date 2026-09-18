import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import {
  Search,
  CircleCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  PlusCircle,
  UploadCloud,
  ArrowLeft,
} from 'lucide-react-native';
import { BulkCatalogUploadModal } from '../../components/seller/BulkCatalogUploadModal';
import { L1_SUPER_CATEGORY_OPTIONS } from '../../constants/catalogDropdownOptions';
import { useAuth } from '../../context/AuthContext';
import { getProductsPaginated } from '../../services/firebaseService';

interface CatalogUploadsScreenProps {
  onNavigateToAddSingleCatalog: () => void;
  onNavigateToManageCatalogs: () => void;
  onBack?: () => void;
}

export interface CatalogUploadRecord {
  fileId: string;
  title: string;
  category: string;
  uploadType: 'bulk' | 'single';
  itemCount: number;
  qcStatus: 'pass' | 'error' | 'in_progress' | 'action_required';
  uploadDate: string;
  errorMessage?: string;
}

const INITIAL_CATALOG_RECORDS: CatalogUploadRecord[] = [];

export const CatalogUploadsScreen: React.FC<CatalogUploadsScreenProps> = ({
  onNavigateToAddSingleCatalog,
  onNavigateToManageCatalogs,
  onBack,
}) => {
  const { sellerProfile } = useAuth();
  const [uploadRecordsList, setRecords] = useState<CatalogUploadRecord[]>(INITIAL_CATALOG_RECORDS);
  const [activeUploadTab, setActiveUploadTab] = useState<'bulk' | 'single'>('bulk');
  const [qcStatusFilter, setQcStatusFilter] = useState<'all' | 'action_required' | 'in_progress' | 'error' | 'pass'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBulkUploadModal, setShowBulkUploadModal] = useState<boolean>(false);

  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (sellerProfile?.id) {
      fetchUploads(false);
    }
  }, [sellerProfile?.id]);

  const fetchUploads = async (loadMore = false) => {
    if (!sellerProfile?.id) return;
    
    if (loadMore) {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    } else {
      setLastVisible(null);
    }

    try {
      const startAfterDoc = loadMore ? lastVisible : null;
      const { products, lastDoc } = await getProductsPaginated(sellerProfile.id, startAfterDoc, 20);
      
      const myProducts = products; // Already filtered by sellerId inside getProductsPaginated
        
        // Map products into mock "upload records" for the dashboard
        const mappedRecords: CatalogUploadRecord[] = myProducts.map(p => ({
          fileId: p.id,
          title: p.title || 'Untitled Upload',
          category: p.category || 'Apparel',
          uploadType: 'single',
          itemCount: 1,
          qcStatus: 'pass',
          uploadDate: p.createdAt || new Date().toISOString()
        }));
        setRecords(prev => loadMore ? [...prev, ...mappedRecords] : mappedRecords);
        setLastVisible(lastDoc);
        if (products.length < 20) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } catch (err) {
        console.error('Failed to fetch catalog uploads', err);
      } finally {
        if (loadMore) setLoadingMore(false);
      }
    };

  // Filtered list
  const filteredRecords = uploadRecordsList.filter((rec) => {
    // 1. Upload Type Tab
    if (rec.uploadType !== activeUploadTab) return false;

    // 2. QC Status Filter
    if (qcStatusFilter !== 'all' && rec.qcStatus !== qcStatusFilter) return false;

    // 3. Category Filter
    if (selectedCategoryFilter !== 'All' && rec.category !== selectedCategoryFilter) return false;

    // 4. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        rec.fileId.toLowerCase().includes(q) ||
        rec.title.toLowerCase().includes(q) ||
        rec.category.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Metrics Count
  const totalUploads = uploadRecordsList.length;
  const bulkUploadsCount = uploadRecordsList.filter((r) => r.uploadType === 'bulk').length;
  const singleUploadsCount = uploadRecordsList.filter((r) => r.uploadType === 'single').length;

  const countByStatus = (status: CatalogUploadRecord['qcStatus']) =>
    uploadRecordsList.filter((r) => r.uploadType === activeUploadTab && r.qcStatus === status).length;

  const ALL_CATEGORIES = ['All', ...L1_SUPER_CATEGORY_OPTIONS];

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER ROW */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <TouchableOpacity
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor: '#F1F5F9',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color="#0F172A" />
            </TouchableOpacity>
          )}
          <Text style={styles.screenTitle}>Upload Catalog</Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.learnVideoBtn}>
            <Sparkles size={15} color="#DC2626" />
            <Text style={styles.learnVideoText}>Learn how to upload catalogs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.needHelpBtn}>
            <Sparkles size={15} color="#4F46E5" />
            <Text style={styles.needHelpText}>Need Help?</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* 2. OVERVIEW METRICS CARDS */}
        <Text style={styles.overviewHeading}>Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Uploads Done</Text>
            <Text style={styles.metricValue}>{totalUploads}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Using Bulk Uploads</Text>
            <Text style={styles.metricValue}>{bulkUploadsCount}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Using Single Uploads</Text>
            <Text style={styles.metricValue}>{singleUploadsCount}</Text>
          </View>
        </View>

        {/* 3. PRIMARY UPLOAD TABS (BULK vs SINGLE) */}
        <View style={styles.primaryTabsContainer}>
          <TouchableOpacity
            style={[styles.primaryTab, activeUploadTab === 'bulk' && styles.primaryTabActive]}
            onPress={() => setActiveUploadTab('bulk')}
          >
            <Text style={[styles.primaryTabText, activeUploadTab === 'bulk' && styles.primaryTabTextActive]}>
              Bulk Uploads ({bulkUploadsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryTab, activeUploadTab === 'single' && styles.primaryTabActive]}
            onPress={() => setActiveUploadTab('single')}
          >
            <Text style={[styles.primaryTabText, activeUploadTab === 'single' && styles.primaryTabTextActive]}>
              Single Uploads ({singleUploadsCount})
            </Text>
          </TouchableOpacity>

          {/* Quick Action Button */}
          <TouchableOpacity
            style={styles.newUploadBtn}
            onPress={() => {
              if (activeUploadTab === 'bulk') setShowBulkUploadModal(true);
              else onNavigateToAddSingleCatalog();
            }}
          >
            <PlusCircle size={15} color="#FFFFFF" />
            <Text style={styles.newUploadBtnText}>
              + {activeUploadTab === 'bulk' ? 'New Bulk Upload' : 'New Single Catalog'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. SECONDARY QC STATUS PILLS */}
        <View style={styles.qcFilterBar}>
          {[
            { key: 'all', label: `All (${uploadRecordsList.filter((r) => r.uploadType === activeUploadTab).length})` },
            { key: 'action_required', label: `Action Required (${countByStatus('action_required')})` },
            { key: 'in_progress', label: `QC in Progress (${countByStatus('in_progress')})` },
            { key: 'error', label: `QC Error (${countByStatus('error')})` },
            { key: 'pass', label: `QC Pass (${countByStatus('pass')})` },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.qcPill, qcStatusFilter === item.key && styles.qcPillActive]}
              onPress={() => setQcStatusFilter(item.key as any)}
            >
              <Text style={[styles.qcPillText, qcStatusFilter === item.key && styles.qcPillTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. SEARCH & CATEGORY FILTER BAR WITH SCROLLABLE DROPDOWN */}
        <View style={styles.filterControlsRow}>
          <View style={styles.categoryDropdownWrapper}>
            <Text style={styles.filterLabel}>Filter by:</Text>
            <View style={{ position: 'relative', zIndex: 100 }}>
              <TouchableOpacity
                style={styles.dropdownBox}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Text style={styles.dropdownSelectedText}>{selectedCategoryFilter}</Text>
                <Text style={{ color: '#64748B', fontSize: 11 }}>{isDropdownOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isDropdownOpen && (
                <View style={styles.dropdownMenuContainer}>
                  <ScrollView
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    style={{ maxHeight: 220 }}
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.dropdownMenuItem,
                          selectedCategoryFilter === cat && styles.dropdownMenuItemActive,
                        ]}
                        onPress={() => {
                          setSelectedCategoryFilter(cat);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownMenuItemText,
                            selectedCategoryFilter === cat && styles.dropdownMenuItemTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={styles.searchBarWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search By File Id, Title or Category"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Search size={16} color="#64748B" />
          </View>
        </View>

        {/* 6. QC ADVICE ALERT TIP BOX */}
        <View style={styles.qcTipBox}>
          <Sparkles size={16} color="#D97706" />
          <Text style={styles.qcTipText}>
            💡 <Text style={{ fontWeight: '700' }}>QC (Quality-Check)</Text> error products can now be fixed as they appear. Try to fix QC errors faster to speed up your catalog creation process.
          </Text>
        </View>

        {/* 7. CATALOG RECORDS TABLE / CARDS */}
        {filteredRecords.length > 0 ? (
          <View style={styles.recordsCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { flex: 1.8 }]}>File ID & Title</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>Category</Text>
              <Text style={[styles.th, { flex: 1 }]}>Items</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>Uploaded On</Text>
              <Text style={[styles.th, { flex: 1.4 }]}>QC Status</Text>
              <Text style={[styles.th, { flex: 1 }]}>Action</Text>
            </View>

            {filteredRecords.map((rec) => (
              <View key={rec.fileId} style={styles.tableRow}>
                {/* File ID & Title */}
                <View style={{ flex: 1.8 }}>
                  <Text style={styles.fileIdText}>{rec.fileId}</Text>
                  <Text style={styles.recordTitle} numberOfLines={1}>
                    {rec.title}
                  </Text>
                  {rec.errorMessage && (
                    <Text style={styles.errorHintText} numberOfLines={1}>
                      ⚠️ {rec.errorMessage}
                    </Text>
                  )}
                </View>

                {/* Category Tag */}
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.categoryChip}>{rec.category}</Text>
                </View>

                {/* Item Count */}
                <Text style={[styles.tdText, { flex: 1 }]}>{rec.itemCount} items</Text>

                {/* Uploaded Date */}
                <Text style={[styles.tdText, { flex: 1.2 }]}>{rec.uploadDate}</Text>

                {/* QC Status Badge */}
                <View style={{ flex: 1.4 }}>
                  {rec.qcStatus === 'pass' && (
                    <View style={[styles.qcBadge, styles.qcBadgePass]}>
                      <CircleCheck size={12} color="#059669" />
                      <Text style={[styles.qcBadgeText, { color: '#059669' }]}>QC Pass</Text>
                    </View>
                  )}
                  {rec.qcStatus === 'error' && (
                    <View style={[styles.qcBadge, styles.qcBadgeError]}>
                      <AlertTriangle size={12} color="#DC2626" />
                      <Text style={[styles.qcBadgeText, { color: '#DC2626' }]}>QC Error</Text>
                    </View>
                  )}
                  {rec.qcStatus === 'in_progress' && (
                    <View style={[styles.qcBadge, styles.qcBadgeProgress]}>
                      <Clock size={12} color="#D97706" />
                      <Text style={[styles.qcBadgeText, { color: '#D97706' }]}>QC in Progress</Text>
                    </View>
                  )}
                  {rec.qcStatus === 'action_required' && (
                    <View style={[styles.qcBadge, styles.qcBadgeAction]}>
                      <AlertTriangle size={12} color="#4F46E5" />
                      <Text style={[styles.qcBadgeText, { color: '#4F46E5' }]}>Action Required</Text>
                    </View>
                  )}
                </View>

                {/* Action Button */}
                <View style={{ flex: 1 }}>
                  {rec.qcStatus === 'error' || rec.qcStatus === 'action_required' ? (
                    <TouchableOpacity
                      style={styles.fixBtn}
                      onPress={onNavigateToAddSingleCatalog}
                    >
                      <Text style={styles.fixBtnText}>Fix QC Error</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={onNavigateToManageCatalogs}
                    >
                      <Text style={styles.viewBtnText}>View Catalog</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* 8. EMPTY STATE AREA MATCHING SCREENSHOT */
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIllustrationBox}>
              <UploadCloud size={44} color="#6366F1" />
            </View>
            <Text style={styles.emptyTitle}>No Results</Text>
            <Text style={styles.emptySub}>
              No {activeUploadTab === 'bulk' ? 'Bulk' : 'Single'} catalogs exist matching the selected filter. Upload a new catalog using the button above.
            </Text>
            <TouchableOpacity
              style={styles.emptyUploadBtn}
              onPress={() => {
                if (activeUploadTab === 'bulk') setShowBulkUploadModal(true);
                else onNavigateToAddSingleCatalog();
              }}
            >
              <Text style={styles.emptyUploadBtnText}>+ Upload New Catalog</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {hasMore && uploadRecordsList.length > 0 && (
          <TouchableOpacity 
            style={{ padding: 16, alignItems: 'center', backgroundColor: '#F8FAFC', borderTopWidth: 1, borderColor: '#E2E8F0', marginTop: 12, borderRadius: 8 }}
            onPress={() => fetchUploads(true)}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <Text style={{ color: '#4F46E5', fontWeight: '600' }}>Loading...</Text>
            ) : (
              <Text style={{ color: '#4F46E5', fontWeight: '600' }}>Load More Catalogs</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bulk Upload Modal */}
      <BulkCatalogUploadModal
        visible={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={() => {
          // Add a new bulk record dynamically
          const newRecord: CatalogUploadRecord = {
            fileId: `BULK-FILE-${Math.floor(10000 + Math.random() * 90000)}`,
            title: 'Uploaded_Apparel_Catalog_Batch.xlsx',
            category: 'Women Western',
            uploadType: 'bulk',
            itemCount: 6,
            qcStatus: 'pass',
            uploadDate: 'Just Now',
          };
          setRecords([newRecord, ...uploadRecordsList]);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  learnVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  learnVideoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  needHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  needHelpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  overviewHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  primaryTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  primaryTab: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  primaryTabActive: {
    borderBottomColor: '#6366F1',
  },
  primaryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  primaryTabTextActive: {
    color: '#6366F1',
    fontWeight: '800',
  },
  newUploadBtn: {
    marginLeft: 'auto',
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  qcFilterBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 0,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  qcPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  qcPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  qcPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  qcPillTextActive: {
    color: '#6366F1',
    fontWeight: '800',
  },
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryDropdownWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  dropdownSelectedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropdownMenuContainer: {
    position: 'absolute',
    top: 38,
    left: 0,
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownMenuItemActive: {
    backgroundColor: '#EEF2FF',
  },
  dropdownMenuItemText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  dropdownMenuItemTextActive: {
    color: '#6366F1',
    fontWeight: '800',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    width: 260,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  qcTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  qcTipText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
    flex: 1,
  },
  recordsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fileIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6366F1',
  },
  recordTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  errorHintText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 2,
  },
  categoryChip: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  tdText: {
    fontSize: 12,
    color: '#475569',
  },
  qcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  qcBadgePass: {
    backgroundColor: '#ECFDF5',
  },
  qcBadgeError: {
    backgroundColor: '#FEF2F2',
  },
  qcBadgeProgress: {
    backgroundColor: '#FFFBEB',
  },
  qcBadgeAction: {
    backgroundColor: '#E0E7FF',
  },
  qcBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  fixBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  fixBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  viewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIllustrationBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 380,
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyUploadBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyUploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
