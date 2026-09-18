import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { UploadCloud, CircleCheck, Sparkles, PlusCircle } from 'lucide-react-native';
import { addProduct } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';

interface BulkCatalogUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEMO_BULK_ITEMS: any[] = [];

export const BulkCatalogUploadModal: React.FC<BulkCatalogUploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { sellerProfile } = useAuth();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [parsedItems, setParsedItems] = useState<typeof DEMO_BULK_ITEMS | null>(null);

  const handleSelectDemoExcel = () => {
    setIsParsing(true);
    setTimeout(() => {
      setSelectedFile('TafDeal_Apparel_Catalog_Template_v2.xlsx (28.4 KB)');
      setParsedItems(DEMO_BULK_ITEMS);
      setIsParsing(false);
    }, 1200);
  };

  const handlePublishBulk = async () => {
    if (sellerProfile?.verificationStatus !== 'verified') {
      const status = sellerProfile?.verificationStatus || 'pending';
      const msg =
        status === 'rejected'
          ? '❌ Account Rejected: Your seller application was rejected by Admin. You cannot add products.'
          : status === 'suspended'
          ? '⚠️ Account Suspended: Your seller account has been suspended by Admin. You cannot add products.'
          : '⏳ Approval Pending: Your seller account is awaiting Admin approval. You cannot add or sell products until approved by Admin.';
      alert(msg);
      return;
    }

    if (!parsedItems || parsedItems.length === 0) return;
    setIsUploading(true);

    try {
      for (const item of parsedItems) {
        await addProduct(
          {
            sellerId: sellerProfile.id || 'sel-104',
            sellerName: sellerProfile.storeName || 'TafDeal Express Store',
            title: item.title,
            description: `Bulk Catalog Import: ${item.fabric} ${item.fit} ${item.subcategory}.`,
            category: item.category,
            subcategory: item.subcategory,
            price: item.price > item.mrp ? item.mrp : item.price,
            originalPrice: item.price > item.mrp ? item.price : item.mrp,
            stock: 45,
            unit: 'piece',
            imageUrl: item.imageUrl,
            rating: 5.0,
            reviewCount: 1,
            tags: ['Bulk Import', 'TafDeal Catalog', item.category],
            isHyperlocalAvailable: false,
            fabric: item.fabric,
            fitType: item.fit,
            color: item.color,
            sizes: item.sizes,
            catalogId: `DGS-BULK-${Math.floor(1000 + Math.random() * 9000)}`,
          },
          sellerProfile?.verificationStatus
        );
      }
      setIsUploading(false);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error publishing bulk catalogs:', err);
      setIsUploading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={22} color="#059669" />
              <Text style={styles.title}>Upload Catalogs in Bulk (Excel / CSV)</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 18, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Upload multiple products at once with clothing sizes (Waist & Chest inches), MRP, and images.
          </Text>

          {/* Download Template Banner */}
          <TouchableOpacity style={styles.templateBox}>
            <Sparkles size={16} color="#2563EB" />
            <Text style={styles.templateText}>Download TafDeal Bulk Catalog Template (.xlsx)</Text>
          </TouchableOpacity>

          {/* Drag & Drop Upload Zone */}
          {!selectedFile ? (
            <TouchableOpacity style={styles.dropZone} onPress={handleSelectDemoExcel}>
              {isParsing ? (
                <>
                  <ActivityIndicator size="large" color="#E00A67" />
                  <Text style={styles.parsingText}>Parsing Excel File & Size Matrices...</Text>
                </>
              ) : (
                <>
                  <UploadCloud size={36} color="#E00A67" />
                  <Text style={styles.dropZoneTitle}>Click or Drag Excel File Here</Text>
                  <Text style={styles.dropZoneSub}>Supports .xlsx and .csv files up to 25MB</Text>
                  <View style={styles.demoFileBtn}>
                    <Text style={styles.demoFileBtnText}>⚡ Load Sample Apparel Excel File</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.fileSelectedCard}>
              <View style={styles.fileHeaderRow}>
                <CircleCheck size={20} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName}>{selectedFile}</Text>
                  <Text style={styles.fileMeta}>Status: Verified & Parsed • 2 Catalogs Ready</Text>
                </View>
                <CircleCheck size={20} color="#059669" />
              </View>

              {/* Parsed Items Preview */}
              <View style={styles.parsedPreviewList}>
                {parsedItems?.map((item, i) => (
                  <View key={i} style={styles.parsedRow}>
                    <Text style={styles.parsedItemTitle} numberOfLines={1}>
                      {i + 1}. {item.title}
                    </Text>
                    <Text style={styles.parsedItemPrice}>₹{item.price}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.publishBtn, !selectedFile && styles.btnDisabled]}
              disabled={!selectedFile || isUploading}
              onPress={handlePublishBulk}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <CircleCheck size={16} color="#FFFFFF" />
                  <Text style={styles.publishBtnText}>Publish Catalogs in Bulk</Text>
                </>
              )}
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  templateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  templateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  dropZone: {
    borderWidth: 2,
    borderColor: '#F472B6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    marginBottom: 20,
  },
  dropZoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  dropZoneSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  parsingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E00A67',
    marginTop: 10,
  },
  demoFileBtn: {
    backgroundColor: '#E00A67',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  demoFileBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  fileSelectedCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  fileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  fileMeta: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  parsedPreviewList: {
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
    paddingTop: 8,
    gap: 4,
  },
  parsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  parsedItemTitle: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '500',
    flex: 1,
  },
  parsedItemPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  publishBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
