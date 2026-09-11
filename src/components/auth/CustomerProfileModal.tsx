import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  X,
  Check,
  LogOut,
  Sparkles,
  ShoppingBag,
  Clock,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export const CustomerProfileModal: React.FC = () => {
  const {
    user,
    isCustomerProfileModalOpen,
    closeCustomerProfileModal,
    updateUserProfile,
    logout,
  } = useAuth();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [addressInput, setAddressInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setPhoneInput(user.phone || '');
      setAddressInput(user.address || '');
    }
  }, [user, isCustomerProfileModalOpen]);

  if (!isCustomerProfileModalOpen || !user) return null;

  const handleSaveProfile = () => {
    if (!nameInput.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid full name.');
      return;
    }
    if (!phoneInput.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid mobile number.');
      return;
    }
    if (!addressInput.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid delivery address.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      updateUserProfile(nameInput, phoneInput, addressInput);
      setIsSaving(false);
      setIsEditing(false);
      setSuccessMessage('Profile updated and saved to Firestore!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }, 400);
  };

  const handleLogout = () => {
    closeCustomerProfileModal();
    logout();
  };

  return (
    <Modal
      visible={isCustomerProfileModalOpen}
      transparent
      animationType="fade"
      onRequestClose={closeCustomerProfileModal}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'C'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.userNameTitle}>
                  {user.name || 'Valued Customer'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={closeCustomerProfileModal}
              activeOpacity={0.7}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
            {/* Status Banner */}
            <View style={styles.statusBanner}>
              <View style={styles.statusLeft}>
                <CheckCircle2 size={18} color="#059669" />
                <View>
                  <Text style={styles.statusTitle}>Verified DigiSewa Customer</Text>
                  <Text style={styles.statusSubtext}>Express Delivery Active in your region</Text>
                </View>
              </View>
              <View style={styles.roleBadge}>
                <ShoppingBag size={12} color="#4F46E5" style={{ marginRight: 4 }} />
                <Text style={styles.roleBadgeText}>Shopper</Text>
              </View>
            </View>

            {successMessage !== '' && (
              <View style={styles.successBox}>
                <CheckCircle2 size={16} color="#15803D" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {/* Profile Fields Header & Edit Switch */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Customer Profile Details</Text>
              {!isEditing ? (
                <TouchableOpacity
                  style={styles.editToggleBtn}
                  onPress={() => setIsEditing(true)}
                  activeOpacity={0.8}
                >
                  <Sparkles size={14} color="#4F46E5" />
                  <Text style={styles.editToggleText}>Edit Details</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.cancelEditBtn}
                  onPress={() => {
                    setIsEditing(false);
                    setNameInput(user.name || '');
                    setPhoneInput(user.phone || '');
                    setAddressInput(user.address || '');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelEditText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Account Information Card */}
            <View style={styles.detailsCard}>
              {/* Full Name */}
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <UserIcon size={16} color="#475569" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.inputField}
                      value={nameInput}
                      onChangeText={setNameInput}
                      placeholder="Enter full name"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{user.name || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Email Address */}
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Mail size={16} color="#475569" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.labelRow}>
                    <Text style={styles.infoLabel}>Email Address</Text>
                    <View style={styles.verifiedTag}>
                      <Text style={styles.verifiedTagText}>Verified</Text>
                    </View>
                  </View>
                  <Text style={styles.infoValue}>{user.email || 'Not provided'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Phone Number */}
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}>
                  <Phone size={16} color="#475569" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Mobile Phone Number</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.inputField}
                      value={phoneInput}
                      onChangeText={setPhoneInput}
                      keyboardType="phone-pad"
                      placeholder="Enter mobile number"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{user.phone || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Delivery Address */}
              <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
                <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
                  <MapPin size={18} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.infoLabel}>Primary Delivery Address</Text>
                    {!isEditing && !isEditingAddress && (
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 3, paddingHorizontal: 10, backgroundColor: '#EEF2FF', borderRadius: 6, borderWidth: 1, borderColor: '#E0E7FF' }}
                        onPress={() => setIsEditingAddress(true)}
                        activeOpacity={0.8}
                      >
                        <Sparkles size={12} color="#4F46E5" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#4F46E5' }}>Edit Address</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {(isEditing || isEditingAddress) ? (
                    <View style={{ gap: 10, marginTop: 4 }}>
                      <TextInput
                        style={[styles.inputField, styles.multilineInput]}
                        value={addressInput}
                        onChangeText={setAddressInput}
                        multiline
                        numberOfLines={3}
                        placeholder="Enter house/flat no, street, landmark, city, state, pincode"
                        placeholderTextColor="#94A3B8"
                      />

                      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                        {isEditingAddress && !isEditing && (
                          <TouchableOpacity
                            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, backgroundColor: '#F1F5F9' }}
                            onPress={() => {
                              setIsEditingAddress(false);
                              setAddressInput(user.address || '');
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>Cancel</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: '#4F46E5' }}
                          onPress={() => {
                            if (!addressInput.trim()) {
                              Alert.alert('Validation Error', 'Please enter a valid delivery address.');
                              return;
                            }
                            setIsSaving(true);
                            setTimeout(() => {
                              updateUserProfile(nameInput || user.name, phoneInput || user.phone, addressInput);
                              setIsSaving(false);
                              setIsEditingAddress(false);
                              if (isEditing) setIsEditing(false);
                              setSuccessMessage('Primary delivery address updated & saved successfully!');
                              setTimeout(() => setSuccessMessage(''), 3000);
                            }, 300);
                          }}
                          disabled={isSaving}
                          activeOpacity={0.85}
                        >
                          {isSaving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Check size={14} color="#FFFFFF" />
                              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Save Delivery Address</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={[styles.infoValue, { lineHeight: 20 }]}>
                      {user.address || 'No delivery address saved yet. Click "Edit Address" to add your delivery location.'}
                    </Text>
                  )}
                </View>
              </View>

            </View>

            {/* Save Button (when editing) */}
            {isEditing && (
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Logout Action Button */}
            <TouchableOpacity
              style={styles.logoutActionBtn}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <LogOut size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.logoutActionText}>Log Out of Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  avatarText: {
    color: '#4F46E5',
    fontSize: 20,
    fontWeight: '800',
  },
  userNameTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  customerIdText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  boldId: {
    color: '#6366F1',
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 20,
    gap: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 12,
    padding: 14,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  statusSubtext: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 8,
  },
  successText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  cancelEditBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cancelEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  detailsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verifiedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 3,
    lineHeight: 20,
  },
  monoIdText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#475569',
    marginTop: 3,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#0F172A',
    marginTop: 4,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  logoutActionText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
