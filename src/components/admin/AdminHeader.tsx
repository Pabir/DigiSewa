import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import TafdealLogo from '../../../assets/TAFDEAL_logo.svg';
import { Sparkles, ArrowRight, Menu, X } from 'lucide-react-native';

import { UserRole } from '../../types';

interface AdminHeaderProps {
  activeRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  pendingApprovalsCount: number;
  openTicketsCount: number;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeRole,
  onSwitchRole,
  pendingApprovalsCount,
  openTicketsCount,
  onToggleSidebar,
  isSidebarOpen = true,
}) => {
  return (
    <View style={styles.headerContainer}>
      {/* Brand & Badge */}
      <View style={styles.brandCol}>
        {onToggleSidebar && (
          <TouchableOpacity
            style={styles.hamburgerBtn}
            onPress={onToggleSidebar}
            activeOpacity={0.7}
            accessibilityLabel="Toggle Admin Sidebar"
          >
            {isSidebarOpen ? (
              <X size={20} color="#FFFFFF" />
            ) : (
              <Menu size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        )}

        <TafdealLogo width={24} height={24} style={styles.logoBadge} />
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.brandTitle}>TafDeal</Text>
            <View style={styles.adminRoleTag}>
              <Text style={styles.adminRoleTagText}>ADMIN</Text>
            </View>
          </View>
          <Text style={styles.brandSub}>Platform Governance & Support Control Center</Text>
        </View>
      </View>

      {/* Quick Alert Badges & Portal Role Switcher */}
      <View style={styles.headerRight}>
        {/* View Mode Switcher Options (Customer / Seller / Admin) */}
        <View style={styles.switcherContainer}>
          <TouchableOpacity
            style={[styles.switchBtn, activeRole === 'customer' && styles.switchBtnActive]}
            onPress={() => onSwitchRole('customer')}
          >
            <Text style={[styles.switchBtnText, activeRole === 'customer' && styles.switchBtnTextActive]}>
              Customer App
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchBtn, activeRole === 'seller' && styles.switchBtnActive]}
            onPress={() => onSwitchRole('seller')}
          >
            <Text style={[styles.switchBtnText, activeRole === 'seller' && styles.switchBtnTextActive]}>
              Seller Panel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchBtn, activeRole === 'admin' && styles.switchBtnActiveAdmin]}
            onPress={() => onSwitchRole('admin')}
          >
            <Text style={[styles.switchBtnText, activeRole === 'admin' && styles.switchBtnTextActiveAdmin]}>
              Admin Panel
            </Text>
          </TouchableOpacity>
        </View>

        {/* Alert Badges Row - Always Stacks Below Switcher and Wraps Within Screen */}
        {(pendingApprovalsCount > 0 || openTicketsCount > 0) && (
          <View style={styles.alertsRow}>
            {/* Pending Approvals Chip */}
            {pendingApprovalsCount > 0 && (
              <View style={styles.alertChipRed}>
                <Text style={styles.alertChipRedText}>
                  🚨 {pendingApprovalsCount} Seller Approvals Pending
                </Text>
              </View>
            )}

            {/* Open Support Tickets Chip */}
            {openTicketsCount > 0 && (
              <View style={styles.alertChipAmber}>
                <Text style={styles.alertChipAmberText}>
                  🎫 {openTicketsCount} Open Tickets
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  brandCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  hamburgerBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  logoBadge: {
    width: 32,
    height: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  adminRoleTag: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminRoleTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    maxWidth: '100%',
  },
  alertsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    maxWidth: '100%',
  },
  alertChipRed: {
    backgroundColor: '#7F1D1D',
    borderWidth: 1,
    borderColor: '#991B1B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  alertChipRedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FECACA',
  },
  alertChipAmber: {
    backgroundColor: '#78350F',
    borderWidth: 1,
    borderColor: '#92400E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  alertChipAmberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDE68A',
  },
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  switchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  switchBtnActive: {
    backgroundColor: '#334155',
  },
  switchBtnActiveAdmin: {
    backgroundColor: '#4338CA',
  },
  switchBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  switchBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  switchBtnTextActiveAdmin: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
