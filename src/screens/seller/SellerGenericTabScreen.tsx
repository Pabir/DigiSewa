import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, CreditCard, ShieldCheck, MapPin, Sparkles, TrendingUp, Zap, IndianRupee, Clock, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getSettlementsBySeller } from '../../services/settlementService';
import { Settlement } from '../../types';
import { SellerReviewsScreen } from './SellerReviewsScreen';

interface SellerGenericTabScreenProps {
  tabKey: string;
  onBack: () => void;
}

export const SellerGenericTabScreen: React.FC<SellerGenericTabScreenProps> = ({ tabKey, onBack }) => {
  const { sellerProfile } = useAuth();
  const [pendingPayout, setPendingPayout] = React.useState(0);
  const [totalPaidOut, setTotalPaidOut] = React.useState(0);
  const [settlementsList, setSettlementsList] = React.useState<Settlement[]>([]);

  React.useEffect(() => {
    if (tabKey === 'payments' && sellerProfile?.id) {
      getSettlementsBySeller(sellerProfile.id).then(settlements => {
        const pending = settlements.filter(s => s.status === 'pending').reduce((acc, s) => acc + s.amountOwed, 0);
        const settled = settlements.filter(s => s.status === 'settled').reduce((acc, s) => acc + s.amountOwed, 0);
        setPendingPayout(pending);
        setTotalPaidOut(settled);
        setSettlementsList(settlements);
      });
    }
  }, [tabKey, sellerProfile?.id]);

  const getTabDetails = () => {
    switch (tabKey) {
      case 'payments':
        return {
          icon: CreditCard,
          title: 'Payments & Settlement Dashboard',
          subtitle: 'View payouts, scheduled transfers, TDS & GST invoice statements',
          metric1: { label: 'Next Payout', value: `₹${pendingPayout.toLocaleString('en-IN')}` },
          metric2: { label: 'Total Paid out', value: `₹${totalPaidOut.toLocaleString('en-IN')}` },
          metric3: { label: 'Settlement Status', value: 'Active / Verified' },
          info: 'Payments are transferred directly to your bank account after product dispatch confirmation.',
        };
      case 'claims':
        return {
          icon: ShieldCheck,
          title: 'Claims & Transit Protection',
          subtitle: 'File claims for damaged customer returns or lost packages',
          metric1: { label: 'Active Claims', value: '0 Open' },
          metric2: { label: 'Resolved Claims', value: '0 Approved' },
          metric3: { label: 'Claim Approval Rate', value: '0%' },
          info: 'Upload unboxing videos or image proof within 7 days of return delivery to claim instant refund.',
        };
      case 'warehouse':
        return {
          icon: MapPin,
          title: 'Warehouse & Pickup Hubs',
          subtitle: 'Manage inventory pickup addresses, state GST warehouses & courier hubs',
          metric1: { label: 'Primary Warehouse', value: 'Not Set' },
          metric2: { label: 'Serviceable Pincodes', value: '0' },
          metric3: { label: 'Courier Partner', value: 'Not Set' },
          info: 'Your primary warehouse is verified for hyperlocal seller order dispatch.',
        };
      case 'influencer':
        return {
          icon: Sparkles,
          title: 'Influencer Marketing & Creator Hub',
          subtitle: 'Collaborate with top social media influencers to promote your catalog',
          metric1: { label: 'Active Campaigns', value: '0 Live' },
          metric2: { label: 'Creator Reach', value: '0 Views' },
          metric3: { label: 'Conversion Boost', value: '0%' },
          info: 'Partner with verified regional influencers to drive direct buyers to your store.',
        };
      case 'promotions':
        return {
          icon: TrendingUp,
          title: 'Promotions & Festival Sales',
          subtitle: 'Participate in DigiSewa Mega Sale events and boost store visibility',
          metric1: { label: 'Current Sale Event', value: 'None' },
          metric2: { label: 'Enrolled Catalogs', value: '0 Items' },
          metric3: { label: 'Visibility Boost', value: '0x' },
          info: 'Enrolling your catalogs in promotions gives featured placement on customer home screen.',
        };
      case 'instant_cash':
        return {
          icon: Zap,
          title: 'Instant Cash & Working Capital',
          subtitle: 'Get instant early payouts on active orders before delivery',
          metric1: { label: 'Available Cash Limit', value: '₹0' },
          metric2: { label: 'Early Settlement Fee', value: '0% Interest' },
          metric3: { label: 'Disbursement Speed', value: '-' },
          info: 'Unlock instant working capital based on your store sales track record.',
        };
      default:
        return {
          icon: Sparkles,
          title: `${tabKey.replace(/_/g, ' ').toUpperCase()} Portal`,
          subtitle: 'DigiSewa Seller Hub Portal',
          metric1: { label: 'Status', value: 'Active' },
          metric2: { label: 'Verification', value: 'Verified' },
          metric3: { label: 'Sync Rate', value: 'Realtime' },
          info: 'Manage your store parameters, inventory, and customer orders seamlessly.',
        };
    }
  };

  const details = getTabDetails();
  const IconComponent = details.icon;

  if (tabKey === 'reviews') {
    return <SellerReviewsScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{details.title}</Text>
            <Text style={styles.subtitle}>{details.subtitle}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <IconComponent size={20} color="#4F46E5" />
            <Text style={styles.metricLabel}>{details.metric1.label}</Text>
            <Text style={styles.metricValue}>{details.metric1.value}</Text>
          </View>
          <View style={styles.metricCard}>
            <IconComponent size={20} color="#16A34A" />
            <Text style={styles.metricLabel}>{details.metric2.label}</Text>
            <Text style={styles.metricValue}>{details.metric2.value}</Text>
          </View>
          <View style={styles.metricCard}>
            <IconComponent size={20} color="#6366F1" />
            <Text style={styles.metricLabel}>{details.metric3.label}</Text>
            <Text style={styles.metricValue}>{details.metric3.value}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <IconComponent size={20} color="#4F46E5" />
            <Text style={styles.cardTitle}>Overview & Key Information</Text>
          </View>
          <Text style={styles.infoText}>{details.info}</Text>
        </View>

        {tabKey === 'payments' && settlementsList.length > 0 && (
          <View style={{marginTop: 16}}>
            <Text style={{fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12}}>Recent Settlements</Text>
            {settlementsList.map(item => (
              <View key={item.id} style={{backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0'}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Text style={{fontSize: 14, fontWeight: '600', color: '#0F172A'}}>Order: {item.orderId}</Text>
                    {item.amountOwed < 0 && (
                      <View style={{backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>
                        <Text style={{fontSize: 10, color: '#B91C1C', fontWeight: 'bold'}}>RTO PENALTY</Text>
                      </View>
                    )}
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <IndianRupee size={16} color={item.amountOwed < 0 ? "#DC2626" : "#0F172A"} />
                    <Text style={{fontSize: 16, fontWeight: '700', color: item.amountOwed < 0 ? '#DC2626' : '#0F172A'}}>
                      {item.amountOwed.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {item.status === 'pending' ? (
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Clock size={14} color="#B45309" />
                    <Text style={{fontSize: 12, color: '#B45309', fontWeight: '500'}}>Pending Transfer</Text>
                  </View>
                ) : (
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <CheckCircle2 size={14} color="#15803D" />
                    <Text style={{fontSize: 12, color: '#15803D', fontWeight: '500'}}>
                      Settled on {item.settledAt ? new Date(item.settledAt).toLocaleDateString() : ''}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  scrollBody: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  metricsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metricCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: { fontSize: 11, color: '#64748B', marginTop: 6 },
  metricValue: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  infoText: { fontSize: 13, color: '#334155', fontWeight: '500', lineHeight: 18 },
});
