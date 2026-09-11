import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { ShieldAlert, KeyRound, X, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginModal: React.FC = () => {
  const { isAdminAuthModalOpen, closeAdminAuthModal, loginAsAdmin } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAdminAuthModalOpen) return null;

  const handleAdminSubmit = () => {
    if (!passcode) {
      setError('Please enter the Admin Security Key/PIN.');
      return;
    }
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const success = loginAsAdmin(passcode);
      if (!success) {
        setError('Invalid Admin Security Key. (Hint for demo: 8888)');
      } else {
        setPasscode('');
      }
    }, 500);
  };

  return (
    <Modal
      visible={isAdminAuthModalOpen}
      transparent
      animationType="fade"
      onRequestClose={closeAdminAuthModal}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {/* Dark Security Banner */}
            <View style={styles.securityHeader}>
              <View style={styles.iconCircle}>
                <ShieldAlert size={28} color="#4F46E5" />
              </View>
              <Text style={styles.securityHeaderTitle}>TafDeal Staff & Admin Portal</Text>
              <Text style={styles.securityHeaderSubtitle}>Restricted Area — Authorized Personnel Only</Text>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={closeAdminAuthModal}
                activeOpacity={0.7}
              >
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.body}>
              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Enter System Admin Security Key</Text>
              <View style={styles.inputContainer}>
                <KeyRound size={20} color="#64748B" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter PIN (Demo: 8888)"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  keyboardType="number-pad"
                  value={passcode}
                  onChangeText={setPasscode}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleAdminSubmit}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Unlock Admin Panel</Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.hintBox}>
                <CheckCircle2 size={14} color="#10B981" />
                <Text style={styles.hintText}>Demo Admin PIN: <Text style={{ fontWeight: '800' }}>8888</Text></Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  securityHeader: {
    backgroundColor: '#0F172A',
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  securityHeaderSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  body: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
    padding: 0,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#065F46',
  },
});
