import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { X, Phone, User as UserIcon, Mail, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isCustomerAuthModalOpen, closeCustomerAuthModal, authIntent, loginAsCustomer } = useAuth();

  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isCustomerAuthModalOpen) return null;

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 600);
  };

  const handleVerifyAndLogin = () => {
    if (!otp || otp.length < 4) {
      setError('Please enter the 4-digit OTP sent to your phone (Use 1234 for demo).');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      loginAsCustomer(name || 'Customer', phone, email);
      // Reset form state
      setStep('details');
      setPhone('');
      setName('');
      setEmail('');
      setOtp('');
    }, 500);
  };

  const handleQuickDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      loginAsCustomer('Pabirul Islam', '+91 98765 01234', 'pabirul@digisewa.in');
    }, 400);
  };

  const getHeaderSubtitle = () => {
    if (authIntent === 'checkout') {
      return 'Please login or sign up to complete your purchase & track delivery.';
    }
    if (authIntent === 'orders') {
      return 'Login to view your active orders and purchase history.';
    }
    return 'Enter your mobile number to explore personalized deals and checkout faster.';
  };

  return (
    <Modal
      visible={isCustomerAuthModalOpen}
      transparent
      animationType="fade"
      onRequestClose={closeCustomerAuthModal}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.brandRow}>
                  <View style={styles.logoBadge}>
                    <Text style={styles.logoText}>DS</Text>
                  </View>
                  <Text style={styles.brandTitle}>DigiSewa Customer Auth</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeCustomerAuthModal}
                  activeOpacity={0.7}
                >
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <Text style={styles.title}>
                  {step === 'details' ? 'Welcome to DigiSewa' : 'Verify Mobile OTP'}
                </Text>
                <Text style={styles.subtitle}>{getHeaderSubtitle()}</Text>

                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {step === 'details' ? (
                  <View style={styles.formGroup}>
                    {/* Name Input */}
                    <View style={styles.inputContainer}>
                      <UserIcon size={18} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Full Name (Optional)"
                        placeholderTextColor="#94A3B8"
                        value={name}
                        onChangeText={setName}
                      />
                    </View>

                    {/* Phone Input */}
                    <View style={styles.inputContainer}>
                      <Phone size={18} color="#EA580C" style={styles.inputIcon} />
                      <Text style={styles.prefixText}>+91</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Mobile Number *"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phone}
                        onChangeText={setPhone}
                      />
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                      <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Email Address (Optional)"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleSendOtp}
                      activeOpacity={0.8}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>Continue with OTP</Text>
                          <ArrowRight size={18} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>OR FAST DEMO</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                      style={styles.demoButton}
                      onPress={handleQuickDemoLogin}
                      activeOpacity={0.8}
                    >
                      <Sparkles size={16} color="#EA580C" />
                      <Text style={styles.demoButtonText}>Quick 1-Click Demo Login</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.formGroup}>
                    <Text style={styles.otpSentText}>
                      Sent OTP to <Text style={{ fontWeight: '700' }}>+91 {phone}</Text>
                    </Text>

                    <View style={styles.inputContainer}>
                      <ShieldCheck size={20} color="#EA580C" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.textInput, { letterSpacing: 6, fontSize: 18, fontWeight: '700' }]}
                        placeholder="1234"
                        placeholderTextColor="#CBD5E1"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={setOtp}
                        autoFocus
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleVerifyAndLogin}
                      activeOpacity={0.8}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Verify & Proceed</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backLink}
                      onPress={() => setStep('details')}
                    >
                      <Text style={styles.backLinkText}>Edit phone number</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.footerInfo}>
                <ShieldCheck size={14} color="#10B981" />
                <Text style={styles.footerInfoText}>100% Safe & Secure DigiSewa OTP Verification</Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 440,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    backgroundColor: '#0F172A',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#EA580C',
    fontWeight: '900',
    fontSize: 12,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EDF2F7',
  },
  body: {
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 20,
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
  formGroup: {
    gap: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  inputIcon: {
    marginRight: 10,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  primaryButton: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  demoButton: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  demoButtonText: {
    color: '#EA580C',
    fontSize: 13,
    fontWeight: '700',
  },
  otpSentText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: 8,
  },
  backLinkText: {
    fontSize: 13,
    color: '#EA580C',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
  },
  footerInfoText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
});
