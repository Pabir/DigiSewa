import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export type AdminTab =
  | 'overview'
  | 'seller_approvals'
  | 'customers'
  | 'seller_tickets'
  | 'customer_tickets';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabSelect: (tab: AdminTab) => void;
  pendingSellersCount: number;
  openSellerTicketsCount: number;
  openCustomerTicketsCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabSelect,
  pendingSellersCount,
  openSellerTicketsCount,
  openCustomerTicketsCount,
}) => {
  const NAV_ITEMS: { id: AdminTab; label: string; icon: string; badge?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
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
  ];

  return (
    <View style={styles.sidebarContainer}>
      <ScrollView style={{ flex: 1 }}>
        <Text style={styles.sectionHeader}>SUPER ADMIN MODULES</Text>

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

      {/* Admin Panel Footer Branding */}
      <View style={styles.footerBox}>
        <Text style={styles.footerTitle}>DigiSewa Governance</Text>
        <Text style={styles.footerVersion}>v2.4 Super Admin Portal</Text>
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
