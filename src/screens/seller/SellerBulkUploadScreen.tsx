import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, UploadCloud, CircleCheck, AlertCircle, Sparkles } from 'lucide-react-native';

interface SellerBulkUploadScreenProps {
  onBack: () => void;
}

export const SellerBulkUploadScreen: React.FC<SellerBulkUploadScreenProps> = ({ onBack }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Image Bulk Upload & Catalog Import</Text>
            <Text style={styles.subtitle}>Upload CSV / Excel templates and batch image zip files</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        <View style={styles.uploadCard}>
          <UploadCloud size={40} color="#4F46E5" />
          <Text style={styles.uploadTitle}>Drag & Drop Bulk Catalog (.xlsx / .zip)</Text>
          <Text style={styles.uploadSub}>Supports up to 500 product images and size variants per upload</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={handleSimulateUpload} disabled={isUploading}>
            <Sparkles size={16} color="#FFFFFF" />
            <Text style={styles.uploadBtnText}>{isUploading ? 'Uploading & Validating...' : 'Select File to Upload'}</Text>
          </TouchableOpacity>

          {uploadSuccess && (
            <View style={styles.successBanner}>
              <CircleCheck size={16} color="#16A34A" />
              <Text style={styles.successText}>File successfully uploaded & queued for QC inspection!</Text>
            </View>
          )}
        </View>

        {/* Template Downloads */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Download Catalog Excel Templates</Text>
          <View style={styles.templateRow}>
            <Sparkles size={20} color="#16A34A" />
            <Text style={styles.templateName}>TafDeal_Apparel_Catalog_Template_v2.xlsx</Text>
            <TouchableOpacity style={styles.downloadBtn}>
              <Text style={styles.downloadBtnText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  scrollBody: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C7D2FE',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  uploadTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  uploadSub: { fontSize: 12, color: '#64748B', textAlign: 'center' },
  uploadBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  uploadBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  successText: { color: '#15803D', fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  templateName: { flex: 1, fontSize: 12, fontWeight: '700', color: '#334155' },
  downloadBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  downloadBtnText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
});
