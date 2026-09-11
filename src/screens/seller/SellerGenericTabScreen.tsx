import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { ArrowLeft, CreditCard, ShieldCheck, MapPin, Sparkles, TrendingUp, Zap, IndianRupee, Clock, CheckCircle2, Download, ChevronDown, X } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getSettlementsBySeller } from '../../services/settlementService';
import { getOrders } from '../../services/firebaseService';
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
  
  // Download Modal States
  const [showDownloadMenu, setShowDownloadMenu] = React.useState(false);
  const [showGstModal, setShowGstModal] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState('2026');
  const [selectedMonth, setSelectedMonth] = React.useState('June');
  const [showYearDropdown, setShowYearDropdown] = React.useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = React.useState(false);

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

  const handleDownloadGST = async () => {
    if (!sellerProfile?.id) return;

    try {
      const orders = await getOrders(sellerProfile.id);
      
      const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(selectedMonth);
      
      const filteredOrders = orders.filter(order => {
        if (!order.createdAt) return false;
        const d = new Date(order.createdAt);
        return d.getFullYear() === parseInt(selectedYear) && d.getMonth() === monthIndex;
      });

      const headers = [
        'identifier', 'sup_name', 'gstin', 'sub_order_num', 'order_date', 'hsn_code', 'quantity', 'gst_rate', 'total_taxable_sale_value', 'tax_amount', 'total_invoice_value', 'taxable_shipping', 'end_customer_state_new', 'enrollment_no', 'cancel_return_date', 'manifest_date', 'transaction_type', 'eco_tcs_gstin', 'financial_year', 'month_number', 'supplier_id'
      ].join(',');

      const rows: string[] = [];

      filteredOrders.forEach(order => {
        order.items.forEach((item, index) => {
          if (item.product.sellerId !== sellerProfile.id) return;

          const hsnCode = '610910'; // default mockup if no hsn_code available
          const gstRate = 5.00;
          const totalInvoiceValue = item.product.price * item.quantity;
          const taxableValue = (totalInvoiceValue / (1 + gstRate / 100)).toFixed(2);
          const taxAmount = (totalInvoiceValue - parseFloat(taxableValue)).toFixed(2);
          const dateStr = new Date(order.createdAt).toISOString().split('T')[0];

          // Extract state from address (mock implementation, assumes ending with state or last word)
          const addressParts = order.deliveryAddress ? order.deliveryAddress.split(',') : [];
          const stateGuess = addressParts.length > 2 ? addressParts[addressParts.length - 2].trim().toUpperCase() : 'UNKNOWN';

          const row = [
            'osjpl', 
            sellerProfile.storeName?.replace(/,/g, '') || '',
            sellerProfile.gstin || '',
            `${order.id}_${index + 1}`,
            dateStr,
            hsnCode,
            item.quantity,
            gstRate.toFixed(2),
            taxableValue,
            taxAmount,
            totalInvoiceValue.toFixed(2),
            '0.00',
            stateGuess,
            '', // enrollment_no
            '', // cancel_return_date
            dateStr, // manifest_date
            '19AARCH3332R1CL', // transaction_type/eco_tcs
            '19AARCH3332R1CL',
            selectedYear,
            (monthIndex + 1).toString(),
            sellerProfile.id
          ].join(',');
          
          rows.push(row);
        });
      });

      const csvContent = [headers, ...rows].join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('url' in window ? 'a' : 'a') as HTMLAnchorElement;
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `GST_Report_${selectedMonth}_${selectedYear}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        alert('CSV Download is supported on Web only.');
      }
    } catch (err) {
      console.error('Failed to generate GST report', err);
      alert('Failed to generate GST report.');
    }
    
    setShowGstModal(false);
  };

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
          subtitle: 'Participate in TafDeal Mega Sale events and boost store visibility',
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
          subtitle: 'TafDeal Seller Hub Portal',
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

        {tabKey === 'payments' && (
          <View style={{ position: 'relative', zIndex: 50 }}>
            <TouchableOpacity 
              style={styles.downloadBtn} 
              onPress={() => setShowDownloadMenu(!showDownloadMenu)}
            >
              <Download size={16} color="#FFF" style={{marginRight: 6}} />
              <Text style={styles.downloadBtnText}>Download</Text>
              <ChevronDown size={16} color="#FFF" style={{marginLeft: 4}} />
            </TouchableOpacity>

            {showDownloadMenu && (
              <View style={styles.downloadMenu}>
                <TouchableOpacity 
                  style={styles.downloadMenuItem}
                  onPress={() => {
                    setShowDownloadMenu(false);
                    setShowGstModal(true);
                  }}
                >
                  <Text style={styles.downloadMenuItemText}>GST Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.downloadMenuItem}>
                  <Text style={styles.downloadMenuItemText}>Tax Invoice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.downloadMenuItem}>
                  <Text style={styles.downloadMenuItemText}>Supplier Tax Invoice</Text>
                  <View style={styles.newBadge}><Text style={styles.newBadgeText}>New</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.downloadMenuItem}>
                  <Text style={styles.downloadMenuItemText}>Payments to Date</Text>
                  <View style={styles.newBadge}><Text style={styles.newBadgeText}>New</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.downloadMenuItem}>
                  <Text style={styles.downloadMenuItemText}>Outstanding Payments</Text>
                  <View style={styles.newBadge}><Text style={styles.newBadgeText}>New</Text></View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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

      {/* GST Modal */}
      <Modal
        visible={showGstModal}
        transparent={true}
        animationType="fade"
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGstModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Download GST reports</Text>
              <TouchableOpacity onPress={() => setShowGstModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.dropdownRow}>
                {/* Year Dropdown */}
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.dropdownSelector}
                    onPress={() => {
                      setShowYearDropdown(!showYearDropdown);
                      setShowMonthDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownSelectedText}>{selectedYear}</Text>
                    <ChevronDown size={16} color="#64748B" />
                  </TouchableOpacity>
                  {showYearDropdown && (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {['2024', '2025', '2026'].map(year => (
                        <TouchableOpacity 
                          key={year} 
                          style={styles.dropdownListItem}
                          onPress={() => { setSelectedYear(year); setShowYearDropdown(false); }}
                        >
                          <Text style={styles.dropdownListItemText}>{year}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Month Dropdown */}
                <View style={[styles.dropdownContainer, { marginLeft: 12 }]}>
                  <TouchableOpacity 
                    style={styles.dropdownSelector}
                    onPress={() => {
                      setShowMonthDropdown(!showMonthDropdown);
                      setShowYearDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownSelectedText}>{selectedMonth}</Text>
                    <ChevronDown size={16} color="#64748B" />
                  </TouchableOpacity>
                  {showMonthDropdown && (
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                        <TouchableOpacity 
                          key={month} 
                          style={styles.dropdownListItem}
                          onPress={() => { setSelectedMonth(month); setShowMonthDropdown(false); }}
                        >
                          <Text style={styles.dropdownListItemText}>{month}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Text style={styles.modalFooterText}>For GST reports of Dec '21 and before <Text style={{color: '#4338CA', textDecorationLine: 'underline'}}>click here</Text></Text>
                <TouchableOpacity style={styles.modalDownloadBtn} onPress={handleDownloadGST}>
                  <Text style={styles.modalDownloadBtnText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    zIndex: 50,
    elevation: 5,
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
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  downloadBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  downloadMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 8,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  downloadMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  downloadMenuItemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  newBadge: {
    backgroundColor: '#3B82F6', // Changed from pink (#EC4899) to blue
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '90%',
    maxWidth: 450,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    padding: 20,
    minHeight: 200, // Make enough room for dropdowns
  },
  dropdownRow: {
    flexDirection: 'row',
    marginBottom: 20,
    zIndex: 100,
  },
  dropdownContainer: {
    flex: 1,
    position: 'relative',
  },
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: '#0F172A',
  },
  dropdownList: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownListItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownListItemText: {
    fontSize: 14,
    color: '#334155',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto', // Push to bottom if height expands
    paddingTop: 16,
  },
  modalFooterText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    marginRight: 12,
  },
  modalDownloadBtn: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalDownloadBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
