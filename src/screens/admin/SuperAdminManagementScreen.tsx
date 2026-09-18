import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ShieldCheck, Plus, CircleCheck, CircleX, Trash2, Check } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { SystemAdmin } from '../../types';
import { getPendingDeletionRequests, approveDeletionRequest, rejectDeletionRequest } from '../../services/dynamicCatalogService';
import { DeletionRequest } from '../../types/dynamicCatalog';

export const SuperAdminManagementScreen: React.FC = () => {
  const { registeredAdmins, addAdmin, updateAdminStatus } = useAuth();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  
  const [pendingRequests, setPendingRequests] = useState<DeletionRequest[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const reqs = await getPendingDeletionRequests();
      setPendingRequests(reqs);
    };
    fetchRequests();
  }, []);

  const handleApproveRequest = async (id: string) => {
    await approveDeletionRequest(id);
    const reqs = await getPendingDeletionRequests();
    setPendingRequests(reqs);
    alert('Deletion Request Approved & Executed.');
  };

  const handleRejectRequest = async (id: string) => {
    await rejectDeletionRequest(id);
    const reqs = await getPendingDeletionRequests();
    setPendingRequests(reqs);
    alert('Deletion Request Rejected.');
  };

  const handleAddAdmin = () => {
    if (!newAdminName || !newAdminEmail || !newAdminPassword) {
      alert('Please fill all fields');
      return;
    }

    if (registeredAdmins.some(a => a.email.toLowerCase() === newAdminEmail.toLowerCase())) {
      alert('An admin with this email already exists.');
      return;
    }

    const newAdmin: SystemAdmin = {
      id: `usr-admin-${Date.now().toString().slice(-4)}`,
      name: newAdminName,
      email: newAdminEmail,
      phone: '',
      role: 'admin',
      password: newAdminPassword,
      status: 'active',
      createdDate: new Date().toISOString(),
    };

    addAdmin(newAdmin);
    
    setNewAdminName('');
    setNewAdminEmail('');
    setNewAdminPassword('');
    setShowAddForm(false);
    
    alert('New Admin successfully added!');
  };

  const handleToggleStatus = (adminId: string, currentStatus: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    updateAdminStatus(adminId, nextStatus);
    alert(`Admin account is now ${nextStatus.toUpperCase()}.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ShieldCheck size={28} color="#7C3AED" />
          <Text style={styles.headerTitle}>Team Management</Text>
        </View>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{showAddForm ? 'Cancel' : 'Add New Admin'}</Text>
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create New Admin Account</Text>
          <Text style={styles.formSubtitle}>They will use these credentials to access the admin portal.</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Admin Name</Text>
            <TextInput 
              style={styles.input}
              placeholder="e.g. Ramesh Kumar"
              value={newAdminName}
              onChangeText={setNewAdminName}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={styles.input}
              placeholder="admin@TafDeal.in"
              autoCapitalize="none"
              keyboardType="email-address"
              value={newAdminEmail}
              onChangeText={setNewAdminEmail}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Temporary Password</Text>
            <TextInput 
              style={styles.input}
              placeholder="Enter secure password"
              secureTextEntry
              value={newAdminPassword}
              onChangeText={setNewAdminPassword}
            />
          </View>
          
          <TouchableOpacity style={styles.submitBtn} onPress={handleAddAdmin}>
            <Text style={styles.submitBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Registered Administrators</Text>
      
      <View style={styles.listContainer}>
        {registeredAdmins.map((admin) => (
          <View key={admin.id} style={styles.adminRow}>
            <View style={styles.adminInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{admin.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.adminName}>{admin.name}</Text>
                  {admin.role === 'super_admin' && (
                    <View style={styles.badgeSuperAdmin}>
                      <Text style={styles.badgeText}>SUPER ADMIN</Text>
                    </View>
                  )}
                  {admin.role === 'admin' && (
                    <View style={styles.badgeAdmin}>
                      <Text style={styles.badgeText}>ADMIN</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.adminEmail}>{admin.email}</Text>
                {admin.password && admin.role !== 'super_admin' && (
                  <Text style={styles.adminPassword}>Pwd: {admin.password}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.adminActions}>
              <View style={[styles.statusBadge, admin.status === 'active' ? styles.statusActive : styles.statusSuspended]}>
                {admin.status === 'active' ? <CircleCheck size={12} color="#10B981" /> : <CircleX size={12} color="#EF4444" />}
                <Text style={[styles.statusText, admin.status === 'active' ? styles.statusTextActive : styles.statusTextSuspended]}>
                  {admin.status.toUpperCase()}
                </Text>
              </View>

              {admin.role !== 'super_admin' && (
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={() => handleToggleStatus(admin.id, admin.status)}
                >
                  <Text style={styles.actionBtnText}>
                    {admin.status === 'active' ? 'Suspend' : 'Activate'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Pending Deletion Requests</Text>
      <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
        Review catalog attribute or category field mappings that Admins have requested to delete.
      </Text>

      <View style={styles.listContainer}>
        {pendingRequests.length > 0 ? (
          pendingRequests.map(req => (
            <View key={req.id} style={styles.requestRow}>
              <View style={styles.requestInfo}>
                <View style={styles.requestIconBadge}>
                  <Trash2 size={16} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.requestTitle}>
                    {req.type === 'global_attribute' ? 'Delete Global Attribute' : 'Delete Category Field'}
                  </Text>
                  <Text style={styles.requestSub}>
                    Target: <Text style={{ fontWeight: '700' }}>{req.targetName}</Text>
                  </Text>
                  {req.type === 'category_mapping' && (
                    <Text style={styles.requestSub}>Category: {req.categoryName}</Text>
                  )}
                  <Text style={styles.requestSub}>Requested By: {req.adminName}</Text>
                </View>
              </View>

              <View style={styles.requestActions}>
                <TouchableOpacity 
                  style={styles.btnApproveReq}
                  onPress={() => handleApproveRequest(req.id)}
                >
                  <Check size={14} color="#FFFFFF" />
                  <Text style={styles.btnApproveReqText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.btnRejectReq}
                  onPress={() => handleRejectRequest(req.id)}
                >
                  <CircleX size={14} color="#475569" />
                  <Text style={styles.btnRejectReqText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No pending deletion requests.</Text>
          </View>
        )}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 24,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  submitBtn: {
    backgroundColor: '#10B981',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 16,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  adminRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 16,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#7C3AED',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  badgeSuperAdmin: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeAdmin: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  adminEmail: {
    fontSize: 13,
    color: '#64748B',
  },
  adminPassword: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 4,
  },
  adminActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusSuspended: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextSuspended: {
    color: '#DC2626',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 16,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 250,
  },
  requestIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  requestSub: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnApproveReq: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  btnApproveReqText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  btnRejectReq: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  btnRejectReqText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
  },
});
