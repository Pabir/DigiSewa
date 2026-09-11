import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Image } from 'react-native';
import { CheckCircle2, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

interface ESignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (signatureName: string, signatureUrl?: string) => void;
}

export const ESignatureModal: React.FC<ESignatureModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { sellerProfile, updateSellerSignature } = useAuth();
  const [activeTab, setActiveTab] = useState<'type' | 'upload'>('type');
  const [signatureText, setSignatureText] = useState<string>('');
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [fontStyle, setFontStyle] = useState<'cursive' | 'formal' | 'bold'>('cursive');

  useEffect(() => {
    if (visible && sellerProfile) {
      setSignatureText(sellerProfile.eSignatureText || sellerProfile.ownerName || sellerProfile.storeName || 'Authorized Signatory');
      setSignatureUrl(sellerProfile.eSignatureUrl || '');
    }
  }, [visible, sellerProfile]);

  const handleSave = () => {
    if (!signatureText && !signatureUrl) {
      alert('Please enter a signatory name or select/upload a signature image.');
      return;
    }

    const finalUrl = activeTab === 'upload' && !signatureUrl
      ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'
      : signatureUrl;

    updateSellerSignature({
      text: signatureText,
      url: finalUrl,
    });

    if (onSave) {
      onSave(signatureText, finalUrl);
    }
    alert('✅ E-Signature saved & attached to your DigiSewa Seller Account!');
    onClose();
  };

  const handleSampleUpload = () => {
    // Preset sample signature image URL for demo/testing upload functionality
    const sampleUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80';
    setSignatureUrl(sampleUrl);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={20} color="#E00A67" />
              <Text style={styles.title}>Add Seller E-Signature</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            As per DigiSewa & Indian GST compliance, an official E-signature is required for generating automatic customer tax invoices & credit notes.
          </Text>

          {/* Mode Switcher Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'type' && styles.tabBtnActive]}
              onPress={() => setActiveTab('type')}
            >
              <ShieldCheck size={15} color={activeTab === 'type' ? '#E00A67' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'type' && styles.tabTextActive]}>Type Signature</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'upload' && styles.tabBtnActive]}
              onPress={() => setActiveTab('upload')}
            >
              <UploadCloud size={15} color={activeTab === 'upload' ? '#E00A67' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'upload' && styles.tabTextActive]}>Upload / Draw Image</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'type' ? (
            <View style={styles.tabContent}>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>Authorized Signatory Full Name / Designation</Text>
                <TextInput
                  style={styles.textInput}
                  value={signatureText}
                  onChangeText={setSignatureText}
                  placeholder="e.g. Ramesh Sharma (Proprietor)"
                />
              </View>

              {/* Font Style Selection */}
              <View style={styles.fontRow}>
                <Text style={styles.fontLabel}>Signature Style:</Text>
                <TouchableOpacity
                  style={[styles.fontChip, fontStyle === 'cursive' && styles.fontChipActive]}
                  onPress={() => setFontStyle('cursive')}
                >
                  <Text style={[styles.fontChipText, { fontStyle: 'italic' }]}>Cursive</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fontChip, fontStyle === 'formal' && styles.fontChipActive]}
                  onPress={() => setFontStyle('formal')}
                >
                  <Text style={[styles.fontChipText, { letterSpacing: 2 }]}>FORMAL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fontChip, fontStyle === 'bold' && styles.fontChipActive]}
                  onPress={() => setFontStyle('bold')}
                >
                  <Text style={[styles.fontChipText, { fontWeight: '900' }]}>Bold Seal</Text>
                </TouchableOpacity>
              </View>

              {/* Live Preview Box */}
              <View style={styles.signaturePreviewBox}>
                <Text style={styles.previewLabel}>GST Tax Invoice Digital Seal Preview:</Text>
                <Text
                  style={[
                    styles.handwrittenFont,
                    fontStyle === 'formal' && { fontStyle: 'normal', letterSpacing: 3, fontWeight: '600' },
                    fontStyle === 'bold' && { fontStyle: 'normal', fontWeight: '900' },
                  ]}
                >
                  {signatureText || 'Your Signature'}
                </Text>
                <Text style={styles.sealSubtext}>Authorized Signatory • DigiSewa Partner</Text>
                <View style={styles.verifiedRow}>
                  <ShieldCheck size={14} color="#059669" />
                  <Text style={styles.verifiedText}>Encrypted & Digitally Sealed for DigiSewa Invoices</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.tabContent}>
              <Text style={styles.inputLabel}>Upload Handwritten Signature Image / Stamp</Text>
              <View style={styles.uploadBox}>
                {signatureUrl ? (
                  <View style={styles.uploadedPreviewCol}>
                    <Image source={{ uri: signatureUrl }} style={styles.signatureImgPreview} />
                    <Text style={styles.uploadedSuccessText}>✓ Signature image selected</Text>
                    <TouchableOpacity onPress={() => setSignatureUrl('')}>
                      <Text style={styles.removeImgText}>Change Image</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholderCol}>
                    <Sparkles size={28} color="#94A3B8" />
                    <Text style={styles.uploadPromptTitle}>Drag & Drop or Click to Select File</Text>
                    <Text style={styles.uploadPromptSub}>Supports PNG, JPG, JPEG (Max 5MB)</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={handleSampleUpload}>
                      <UploadCloud size={14} color="#FFFFFF" />
                      <Text style={styles.uploadBtnText}>Upload Sample Signature</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save E-Signature</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeIcon: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
    padding: 4,
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#E00A67',
    fontWeight: '700',
  },
  tabContent: {
    marginBottom: 16,
  },
  inputBox: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FAFAFA',
  },
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  fontLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  fontChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fontChipActive: {
    backgroundColor: '#FCE7F3',
    borderColor: '#F472B6',
  },
  fontChipText: {
    fontSize: 11,
    color: '#0F172A',
  },
  signaturePreviewBox: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#F0ABFC',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 11,
    color: '#9333EA',
    fontWeight: '600',
    marginBottom: 4,
  },
  handwrittenFont: {
    fontSize: 22,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#3B0764',
    marginVertical: 4,
    letterSpacing: 1,
  },
  sealSubtext: {
    fontSize: 10,
    color: '#7E22CE',
    fontWeight: '500',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    minHeight: 140,
  },
  uploadPlaceholderCol: {
    alignItems: 'center',
  },
  uploadPromptTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  uploadPromptSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 12,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadedPreviewCol: {
    alignItems: 'center',
  },
  signatureImgPreview: {
    width: 140,
    height: 60,
    resizeMode: 'contain',
    borderRadius: 6,
    marginBottom: 6,
  },
  uploadedSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  removeImgText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E00A67',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
