import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react-native';

interface ESignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signatureName: string) => void;
}

export const ESignatureModal: React.FC<ESignatureModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [signatureText, setSignatureText] = useState<string>('Al Mursaleen Authorized Signatory');

  const handleSave = () => {
    onSave(signatureText);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={20} color="#E00A67" />
              <Text style={styles.title}>Add Seller E-Signature</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 18, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            As per DigiSewa GST compliance, an official E-signature is required for generating automatic customer tax invoices & credit notes.
          </Text>

          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>Authorized Signatory Full Name / Business Seal</Text>
            <TextInput
              style={styles.textInput}
              value={signatureText}
              onChangeText={setSignatureText}
              placeholder="e.g. Mohd Al Mursaleen (Proprietor)"
            />
          </View>

          {/* Digital Signature Preview Box */}
          <View style={styles.signaturePreviewBox}>
            <Text style={styles.previewLabel}>Digital Signature Preview for Invoices:</Text>
            <Text style={styles.handwrittenFont}>{signatureText || 'Your Signature'}</Text>
            <View style={styles.verifiedRow}>
              <ShieldCheck size={14} color="#059669" />
              <Text style={styles.verifiedText}>Encrypted & Digitally Sealed for DigiSewa Invoices</Text>
            </View>
          </View>

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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
    marginBottom: 12,
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
  description: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  inputBox: {
    marginBottom: 14,
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
  },
  signaturePreviewBox: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#F0ABFC',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 11,
    color: '#9333EA',
    fontWeight: '600',
    marginBottom: 6,
  },
  handwrittenFont: {
    fontSize: 22,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#3B0764',
    marginVertical: 4,
    letterSpacing: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  verifiedText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
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
