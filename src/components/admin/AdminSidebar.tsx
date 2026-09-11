import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export type AdminTab =
  | 'overview'
  | 'seller_approvals'
  | 'customers'
  | 'seller_tickets'
  | 'customer_tickets'
  | 'catalog_builder'
  | 'settlements'
  | 'returns'
  | 'team_management'
  | 'system_settings'
  | 'finance_dashboard'
  | 'finance_reconciliation'
  | 'finance_settlements'
  | 'finance_taxes'
  | 'finance_seller_wise'
  | 'pending_tasks';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabSelect: (tab: AdminTab) => void;
  pendingSellersCount: number;
  openSellerTicketsCount: number;
  openCustomerTicketsCount: number;
  onLogout?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabSelect,
  pendingSellersCount,
  openSellerTicketsCount,
  openCustomerTicketsCount,
  onLogout,
}) => {
  const { logout } = useAuth();

  const NAV_ITEMS: { id: AdminTab; label: string; icon: string; badge?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
    {
      id: 'catalog_builder',
      label: 'Catalog & Form Engine',
      icon: '⚡',
    },
    {
      id: 'seller_approvals',
      label: 'Seller Approvals',
      icon: '🏪',
      badge: pendingSellersCount,
      badgeColor: '#DC2626',
    },
    { id: 'customers', label: 'Customer Management', icon: '👥' },
    {
      id: 'seller_tickets',
      label: 'Seller Tickets',
      icon: '🎧',
      badge: openSellerTicketsCount,
      badgeColor: '#D97706',
    },
    {
      id: 'customer_tickets',
      label: 'Customer Tickets',
      icon: '🎫',
      badge: openCustomerTicketsCount,
      badgeColor: '#2563EB',
    },
    { id: 'returns', label: 'Returns & Pickups', icon: '🔄' },
    { id: 'settlements', label: 'Payouts & Settlements', icon: '💰' },
    { id: 'finance_dashboard', label: 'Finance Dashboard', icon: '📈' },
    { id: 'finance_seller_wise', label: 'Seller-wise Finance', icon: '🏪' },
    { id: 'finance_reconciliation', label: 'Reconciliations', icon: '⚖️' },
    { id: 'finance_settlements', label: 'Finance Settlements', icon: '💸' },
    { id: 'finance_taxes', label: 'Tax Reports', icon: '📄' },
    { id: 'system_settings', label: 'System Settings', icon: '⚙️' },
    { id: 'pending_tasks', label: 'Pending Interventions', icon: '⚠️', badgeColor: '#DC2626' },
  ];

  const { activeRole } = useAuth();
  if (activeRole === 'super_admin') {
    NAV_ITEMS.push({
      id: 'team_management',
      label: 'Team Management',
      icon: '🛡️',
    });
  }

  return (
    <View style={styles.sidebarContainer}>
      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.sectionHeader}>ADMIN MODULES</Text>

        <View style={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => onTabSelect(item.id)}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>

                {item.badge !== undefined && item.badge > 0 && (
                  <View style={[styles.badgePill, { backgroundColor: item.badgeColor || '#DC2626' }]}>
                    <Text style={styles.badgePillText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Admin Panel Footer Branding & Logout Action */}
      <View style={styles.footerBox}>
        <TouchableOpacity
          style={styles.adminLogoutBtn}
          onPress={() => {
            if (onLogout) {
              onLogout();
            } else {
              logout();
            }
          }}
          activeOpacity={0.8}
        >
          <LogOut size={16} color="#EF4444" />
          <Text style={styles.adminLogoutBtnText}>Log Out Admin</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 10 }}>
          <Text style={styles.footerTitle}>TafDeal Governance</Text>
          <Text style={styles.footerVersion}>v2.4 Admin Portal</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    width: 260,
    backgroundColor: '#0F172A',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  navList: {
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 10,
  },
  navItemActive: {
    backgroundColor: '#4338CA',
  },
  navIcon: {
    fontSize: 16,
  },
  navLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  footerBox: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingHorizontal: 8,
  },
  adminLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  adminLogoutBtnText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
  footerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  footerVersion: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
});
