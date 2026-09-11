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
  CreditCard,
  Plus,
  Trash2,
  Star,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { DeliveryAddress, PaymentMethod } from '../../types';

type TabType = 'profile' | 'addresses' | 'payments';

export const CustomerProfileModal: React.FC = () => {
  const {
    user,
    isCustomerProfileModalOpen,
    closeCustomerProfileModal,
    updateUserProfile,
    addDeliveryAddress,
    deleteDeliveryAddress,
    setDefaultDeliveryAddress,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Profile Form State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  
  // Address Form State
  const [isAddingAddress, setIsAddingAddress] = useState<boolean>(false);
  const [newAddrTitle, setNewAddrTitle] = useState<string>('');
  const [newAddrFull, setNewAddrFull] = useState<string>('');
  
  // Payment Form State
  const [isAddingPayment, setIsAddingPayment] = useState<boolean>(false);
  const [newPayType, setNewPayType] = useState<'card' | 'upi'>('card');
  const [newPayDetails, setNewPayDetails] = useState<string>('');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setPhoneInput(user.phone || '');
    }
  }, [user, isCustomerProfileModalOpen]);

  if (!isCustomerProfileModalOpen || !user) return null;

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSaveProfile = () => {
    if (!nameInput.trim() || !phoneInput.trim()) {
      Alert.alert('Validation Error', 'Please enter valid name and phone.');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      updateUserProfile(nameInput, phoneInput, user.address || '');
      setIsSaving(false);
      setIsEditingProfile(false);
      showSuccess('Profile updated successfully!');
    }, 400);
  };

  const handleAddAddress = () => {
    if (!newAddrTitle.trim() || !newAddrFull.trim()) {
      Alert.alert('Validation Error', 'Please enter title and full address.');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      addDeliveryAddress({
        title: newAddrTitle,
        fullName: user.name,
        phone: user.phone,
        fullAddress: newAddrFull,
        city: '', // simplified for demo
        state: '',
        pincode: '',
        isDefault: false
      });
      setIsSaving(false);
      setIsAddingAddress(false);
      setNewAddrTitle('');
      setNewAddrFull('');
      showSuccess('Address added successfully!');
    }, 400);
  };

  const handleAddPayment = () => {
    if (!newPayDetails.trim()) {
      Alert.alert('Validation Error', 'Please enter payment details.');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      addPaymentMethod({
        type: newPayType,
        details: newPayDetails,
        isDefault: false
      });
      setIsSaving(false);
      setIsAddingPayment(false);
      setNewPayDetails('');
      showSuccess('Payment method added successfully!');
    }, 400);
  };

  const handleLogout = () => {
    closeCustomerProfileModal();
    logout();
  };

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        {!isEditingProfile ? (
          <TouchableOpacity style={styles.editToggleBtn} onPress={() => setIsEditingProfile(true)}>
            <Sparkles size={14} color="#4F46E5" />
            <Text style={styles.editToggleText}>Edit Details</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cancelEditBtn} onPress={() => {
            setIsEditingProfile(false);
            setNameInput(user.name || '');
            setPhoneInput(user.phone || '');
          }}>
            <Text style={styles.cancelEditText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.infoRow}>
          <View style={styles.iconCircle}><UserIcon size={16} color="#475569" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Full Name</Text>
            {isEditingProfile ? (
              <TextInput style={styles.inputField} value={nameInput} onChangeText={setNameInput} placeholder="Enter full name" />
            ) : (
              <Text style={styles.infoValue}>{user.name || 'Not provided'}</Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconCircle}><Mail size={16} color="#475569" /></View>
          <View style={{ flex: 1 }}>
            <View style={styles.labelRow}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <View style={styles.verifiedTag}><Text style={styles.verifiedTagText}>Verified</Text></View>
            </View>
            <Text style={styles.infoValue}>{user.email || 'Not provided'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.iconCircle}><Phone size={16} color="#475569" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Mobile Phone Number</Text>
            {isEditingProfile ? (
              <TextInput style={styles.inputField} value={phoneInput} onChangeText={setPhoneInput} keyboardType="phone-pad" placeholder="Enter mobile number" />
            ) : (
              <Text style={styles.infoValue}>{user.phone || 'Not provided'}</Text>
            )}
          </View>
        </View>
      </View>

      {isEditingProfile && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={isSaving}>
          {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
            <><Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} /><Text style={styles.saveBtnText}>Save Changes</Text></>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutActionBtn} onPress={handleLogout}>
        <LogOut size={16} color="#DC2626" style={{ marginRight: 6 }} />
        <Text style={styles.logoutActionText}>Log Out of Account</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddressesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Saved Addresses</Text>
        {!isAddingAddress && (
          <TouchableOpacity style={styles.editToggleBtn} onPress={() => setIsAddingAddress(true)}>
            <Plus size={14} color="#4F46E5" />
            <Text style={styles.editToggleText}>Add New</Text>
          </TouchableOpacity>
        )}
      </View>

      {isAddingAddress && (
        <View style={[styles.detailsCard, { marginBottom: 16, backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
          <Text style={styles.infoLabel}>Address Title (e.g. Home, Work)</Text>
          <TextInput style={styles.inputField} value={newAddrTitle} onChangeText={setNewAddrTitle} placeholder="Home" />
          
          <Text style={[styles.infoLabel, { marginTop: 12 }]}>Full Address</Text>
          <TextInput style={[styles.inputField, { height: 60 }]} multiline value={newAddrFull} onChangeText={setNewAddrFull} placeholder="Flat no, Street, Area, City" />
          
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#94A3B8' }]} onPress={() => setIsAddingAddress(false)}>
              <Text style={styles.saveBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { flex: 1, marginTop: 0 }]} onPress={handleAddAddress} disabled={isSaving}>
              {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Save Address</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {user.addresses && user.addresses.length > 0 ? (
        user.addresses.map((addr) => (
          <View key={addr.id} style={[styles.detailsCard, { marginBottom: 12, padding: 12 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <View style={styles.labelRow}>
                  <Text style={styles.addressTitle}>{addr.title}</Text>
                  {addr.isDefault && <View style={styles.verifiedTag}><Text style={styles.verifiedTagText}>Default</Text></View>}
                </View>
                <Text style={styles.addressText}>{addr.fullAddress}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {!addr.isDefault && (
                  <TouchableOpacity onPress={() => setDefaultDeliveryAddress(addr.id)} style={{ padding: 4 }}>
                    <Star size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => deleteDeliveryAddress(addr.id)} style={{ padding: 4 }}>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No addresses saved yet.</Text>
      )}
    </View>
  );

  const renderPaymentsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        {!isAddingPayment && (
          <TouchableOpacity style={styles.editToggleBtn} onPress={() => setIsAddingPayment(true)}>
            <Plus size={14} color="#4F46E5" />
            <Text style={styles.editToggleText}>Add New</Text>
          </TouchableOpacity>
        )}
      </View>

      {isAddingPayment && (
        <View style={[styles.detailsCard, { marginBottom: 16, backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
          <Text style={styles.infoLabel}>Method Type</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 12 }}>
            <TouchableOpacity 
              style={[styles.typeBtn, newPayType === 'card' && styles.typeBtnActive]} 
              onPress={() => setNewPayType('card')}
            >
              <Text style={[styles.typeBtnText, newPayType === 'card' && styles.typeBtnTextActive]}>Card</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, newPayType === 'upi' && styles.typeBtnActive]} 
              onPress={() => setNewPayType('upi')}
            >
              <Text style={[styles.typeBtnText, newPayType === 'upi' && styles.typeBtnTextActive]}>UPI</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.infoLabel}>{newPayType === 'card' ? 'Card Number (last 4 digits)' : 'UPI ID'}</Text>
          <TextInput style={styles.inputField} value={newPayDetails} onChangeText={setNewPayDetails} placeholder={newPayType === 'card' ? '**** 4242' : 'user@upi'} />
          
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: '#94A3B8' }]} onPress={() => setIsAddingPayment(false)}>
              <Text style={styles.saveBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { flex: 1, marginTop: 0 }]} onPress={handleAddPayment} disabled={isSaving}>
              {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Save Method</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {user.paymentMethods && user.paymentMethods.length > 0 ? (
        user.paymentMethods.map((method) => (
          <View key={method.id} style={[styles.detailsCard, { marginBottom: 12, padding: 12 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.iconCircle}>
                  <CreditCard size={16} color="#475569" />
                </View>
                <View>
                  <View style={styles.labelRow}>
                    <Text style={styles.addressTitle}>{method.type === 'card' ? 'Credit/Debit Card' : 'UPI ID'}</Text>
                    {method.isDefault && <View style={styles.verifiedTag}><Text style={styles.verifiedTagText}>Default</Text></View>}
                  </View>
                  <Text style={styles.addressText}>{method.details}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {!method.isDefault && (
                  <TouchableOpacity onPress={() => setDefaultPaymentMethod(method.id)} style={{ padding: 4 }}>
                    <Star size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => deletePaymentMethod(method.id)} style={{ padding: 4 }}>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No payment methods saved yet.</Text>
      )}
    </View>
  );

  return (
    <Modal visible={isCustomerProfileModalOpen} transparent animationType="fade" onRequestClose={closeCustomerProfileModal}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : 'C'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.userNameTitle}>{user.name || 'Valued Customer'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeCustomerProfileModal} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]} onPress={() => setActiveTab('profile')}>
              <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'addresses' && styles.tabBtnActive]} onPress={() => setActiveTab('addresses')}>
              <Text style={[styles.tabText, activeTab === 'addresses' && styles.tabTextActive]}>Addresses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'payments' && styles.tabBtnActive]} onPress={() => setActiveTab('payments')}>
              <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>Payments</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
            {successMessage !== '' && (
              <View style={styles.successBox}>
                <CheckCircle2 size={16} color="#15803D" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'addresses' && renderAddressesTab()}
            {activeTab === 'payments' && renderPaymentsTab()}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90%', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#4F46E5' },
  avatarText: { color: '#4F46E5', fontSize: 20, fontWeight: '800' },
  userNameTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  tabBar: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#4F46E5' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#4F46E5', fontWeight: '700' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 20, gap: 16 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#DCFCE7', padding: 12, borderRadius: 8, marginBottom: 12 },
  successText: { fontSize: 13, color: '#15803D', fontWeight: '600' },
  tabContent: { flex: 1 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  editToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#E0E7FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  editToggleText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
  cancelEditBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  cancelEditText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  detailsCard: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  iconCircle: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  verifiedTag: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  verifiedTagText: { fontSize: 9, fontWeight: '700', color: '#15803D' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginTop: 3, lineHeight: 20 },
  inputField: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#0F172A', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 10, marginTop: 4 },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  logoutActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', paddingVertical: 12, borderRadius: 10, marginTop: 12 },
  logoutActionText: { color: '#DC2626', fontSize: 14, fontWeight: '700' },
  addressTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  addressText: { fontSize: 13, color: '#475569', lineHeight: 18, marginTop: 2 },
  typeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6 },
  typeBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  typeBtnTextActive: { color: '#4F46E5' },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center', paddingVertical: 20 },
});
