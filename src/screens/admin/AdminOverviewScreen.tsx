import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AdminOverviewMetrics } from '../../types/adminTypes';
import { Sparkles, ArrowRight } from 'lucide-react-native';

interface AdminOverviewScreenProps {
  metrics: AdminOverviewMetrics;
  onNavigateTab: (tab: any) => void;
}

export const AdminOverviewScreen: React.FC<AdminOverviewScreenProps> = ({
  metrics,
  onNavigateTab,
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title Header */}
      <View style={styles.titleBanner}>
        <View>
          <Text style={styles.screenTitle}>Platform Dashboard Overview</Text>
          <Text style={styles.screenSub}>
            Real-time platform metrics, pending seller verifications, and active ticket status.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => onNavigateTab('seller_approvals')}
        >
          <Text style={styles.actionBtnPrimaryText}>Review Pending Sellers ({metrics.pendingSellersCount})</Text>
          <ArrowRight size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Platform GMV Revenue</Text>
          <Text style={styles.metricValue}>₹{metrics.totalRevenue.toLocaleString('en-IN')}</Text>
          <Text style={styles.metricHint}>💰 0% Platform Fee Model Active</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Active Approved Sellers</Text>
          <Text style={styles.metricValue}>{metrics.activeSellersCount}</Text>
          <Text style={styles.metricHintGreen}>🟢 Verified Merchant Stores</Text>
        </View>

        <TouchableOpacity
          style={[styles.metricCard, metrics.pendingSellersCount > 0 && styles.metricCardAlertRed]}
          onPress={() => onNavigateTab('seller_approvals')}
        >
          <Text style={styles.metricLabel}>Pending Seller Approvals</Text>
          <Text style={[styles.metricValue, metrics.pendingSellersCount > 0 && { color: '#DC2626' }]}>
            {metrics.pendingSellersCount}
          </Text>
          <Text style={styles.metricHintRed}>🚨 Requires GSTIN & Bank Verification</Text>
        </TouchableOpacity>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Registered Customers</Text>
          <Text style={styles.metricValue}>{metrics.totalCustomersCount}</Text>
          <Text style={styles.metricHint}>👥 Buyer Accounts</Text>
        </View>

        <TouchableOpacity
          style={styles.metricCard}
          onPress={() => onNavigateTab('seller_tickets')}
        >
          <Text style={styles.metricLabel}>Open Seller Support Tickets</Text>
          <Text style={[styles.metricValue, { color: '#D97706' }]}>
            {metrics.openSellerTicketsCount}
          </Text>
          <Text style={styles.metricHintAmber}>🎧 Payouts, Catalog QC & Claims</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.metricCard}
          onPress={() => onNavigateTab('customer_tickets')}
        >
          <Text style={styles.metricLabel}>Open Customer Support Tickets</Text>
          <Text style={[styles.metricValue, { color: '#2563EB' }]}>
            {metrics.openCustomerTicketsCount}
          </Text>
          <Text style={styles.metricHintBlue}>🎫 Orders, Returns & Refunds</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Governance Status Section */}
      <View style={styles.quickGovernanceSection}>
        <View style={styles.governanceCard}>
          <View style={styles.governanceHeader}>
            <Sparkles size={18} color="#4338CA" />
            <Text style={styles.governanceTitle}>Pending Governance Actions</Text>
          </View>

          {metrics.pendingSellersCount > 0 ? (
            <View style={styles.pendingActionAlert}>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  {metrics.pendingSellersCount} New Seller Registration(s) Awaiting Review
                </Text>
                <Text style={styles.alertSub}>
                  Verify seller GSTIN certificate, PAN card number, Bank Account IFSC, and E-Signature.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.reviewNowBtn}
                onPress={() => onNavigateTab('seller_approvals')}
              >
                <Text style={styles.reviewNowBtnText}>Review Applications</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.allClearBox}>
              <Text style={styles.allClearText}>
                ✅ All seller registration applications have been processed! No pending approvals.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 24,
  },
  titleBanner: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  screenSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionBtnPrimary: {
    backgroundColor: '#4338CA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  metricCardAlertRed: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricHint: {
    fontSize: 11,
    color: '#475569',
    marginTop: 8,
  },
  metricHintGreen: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    marginTop: 8,
  },
  metricHintRed: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
    marginTop: 8,
  },
  metricHintAmber: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
    marginTop: 8,
  },
  metricHintBlue: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 8,
  },
  quickGovernanceSection: {
    marginBottom: 20,
  },
  governanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
  },
  governanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  governanceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  pendingActionAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 14,
    gap: 16,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
  },
  alertSub: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
  },
  reviewNowBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reviewNowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  allClearBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 12,
  },
  allClearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
});
