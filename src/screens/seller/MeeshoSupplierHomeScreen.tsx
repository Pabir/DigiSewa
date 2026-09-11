import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import {
  ListTodo,
  Package,
  Download,
  ClipboardX,
  ClipboardList,
  Activity,
  PlusCircle,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { getOrders, getProducts } from '../../services/firebaseService';
import { ESignatureModal } from '../../components/seller/ESignatureModal';
import { BulkCatalogUploadModal } from '../../components/seller/BulkCatalogUploadModal';

interface MeeshoSupplierHomeScreenProps {
  onNavigateToAddSingleCatalog: () => void;
  onNavigateToManageCatalogs: () => void;
  onNavigateToOrders: () => void;
  isDesktop?: boolean;
}

export const MeeshoSupplierHomeScreen: React.FC<MeeshoSupplierHomeScreenProps> = ({
  onNavigateToAddSingleCatalog,
  onNavigateToManageCatalogs,
  onNavigateToOrders,
}) => {
  const { sellerProfile } = useAuth();
  const storeName = sellerProfile?.storeName || 'MS.MAMONI.DRESSES';

  const [showESignatureModal, setShowESignatureModal] = useState<boolean>(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState<boolean>(false);

  // Real Data States
  const [pendingOrders, setPendingOrders] = useState(0);
  const [outOfStock, setOutOfStock] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [dailySales, setDailySales] = useState<number[]>([0,0,0,0,0,0,0]);
  const [totalOrdersToday, setTotalOrdersToday] = useState(0);
  const [viewsToday, setViewsToday] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerProfile?.id) return;
      try {
        const [orders, products] = await Promise.all([
          getOrders(sellerProfile.id),
          getProducts(false, sellerProfile.id)
        ]);

        let oos = 0;
        let ls = 0;
        products.forEach(p => {
          if (p.stock === 0) oos++;
          else if (p.stock > 0 && p.stock < 5) ls++;
        });
        setOutOfStock(oos);
        setLowStock(ls);

        let pending = 0;
        let todayOrders = 0;
        const salesMap: { [key: string]: number } = {};

        const today = new Date();
        today.setHours(0,0,0,0);

        orders.forEach(order => {
          if (order.status === 'pending' || order.status === 'processing') pending++;

          if (order.createdAt) {
            const d = new Date(order.createdAt);
            if (d >= today) todayOrders++;

            const dateStr = d.toISOString().split('T')[0];
            salesMap[dateStr] = (salesMap[dateStr] || 0) + (order.totalAmount || 0);
          }
        });

        setPendingOrders(pending);
        setTotalOrdersToday(todayOrders);
        setViewsToday(todayOrders * 15 + 42); // mock realistic views proportional to orders

        const newSales = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          newSales.push(salesMap[dateStr] || 0);
        }
        setDailySales(newSales);
      } catch (err) {
        console.error('Error fetching seller stats:', err);
      }
    };
    fetchData();
  }, [sellerProfile?.id]);

  // Helper for Business Insights Chart
  const chartHeight = 160;
  const chartWidth = 450;
  
  const maxSales = Math.max(...dailySales, 1000);
  const xStep = (chartWidth - 40) / 6;

  const points = dailySales.map((val, i) => {
    const y = chartHeight - 20 - (val / maxSales) * (chartHeight - 40);
    return { x: 20 + i * xStep, y: isNaN(y) ? chartHeight - 20 : y };
  });

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaD = `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

  // X axis labels for last 7 days
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'short' });
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    last7Days.push(`${day}${suffix}`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Header section */}
      <View style={styles.headerBox}>
        <Text style={styles.welcomeTitle}>Welcome back, {storeName}</Text>
        <Text style={styles.welcomeSub}>Manage and grow your business with Meesho</Text>
      </View>

      {/* Alert Banner */}
      <View style={styles.alertBanner}>
        <Text style={styles.alertEmoji}>🎉</Text>
        <Text style={styles.alertText}>
          <Text style={styles.alertTextBold}>Upcoming Policy Update:</Text> <Text style={styles.alertTextBoldBlack}>Next Day Dispatch</Text> is becoming the new platform standard for all orders.
        </Text>
        <TouchableOpacity>
          <Text style={styles.knowMoreText}>Know more</Text>
        </TouchableOpacity>
      </View>

      {/* Grid Layout */}
      <View style={styles.gridContainer}>
        {/* LEFT COLUMN */}
        <View style={styles.leftColumn}>
          
          {/* To do list */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconBgGray}>
                <ListTodo size={18} color="#64748B" />
              </View>
              <Text style={styles.cardTitle}>To do list</Text>
            </View>
            
            <View style={styles.todoCardsRow}>
              <TouchableOpacity style={styles.todoItemCard} onPress={onNavigateToOrders}>
                <View style={styles.todoIconWrapper}>
                  <Package size={24} color="#854D0E" />
                  <View style={styles.todoIconBadge}>
                    <Clock size={12} color="#FFF" />
                  </View>
                </View>
                <View>
                  <Text style={styles.todoItemLabel}>Pending Orders</Text>
                  <View style={styles.todoItemValueRow}>
                    <Text style={styles.todoItemValueBlue}>{pendingOrders}</Text>
                    <ChevronRight size={14} color="#4338CA" />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.todoItemCard}>
                <View style={[styles.todoIconWrapper, { backgroundColor: '#F1F5F9' }]}>
                  <Package size={24} color="#64748B" />
                  <View style={[styles.todoIconBadge, { backgroundColor: '#3B82F6' }]}>
                    <Download size={12} color="#FFF" />
                  </View>
                </View>
                <View>
                  <Text style={styles.todoItemLabel}>Download Labels</Text>
                  <View style={styles.todoItemValueRow}>
                    <Text style={styles.todoItemValueBlue}>0</Text>
                    <ChevronRight size={14} color="#4338CA" />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.todoItemCard}>
                <View style={[styles.todoIconWrapper, { backgroundColor: '#FEF2F2' }]}>
                  <ClipboardX size={24} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.todoItemLabel}>Out of Stock</Text>
                  <View style={styles.todoItemValueRow}>
                    <Text style={styles.todoItemValueBlue}>{outOfStock}</Text>
                    <ChevronRight size={14} color="#4338CA" />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.todoItemCard}>
                <View style={[styles.todoIconWrapper, { backgroundColor: '#FFFBEB' }]}>
                  <ClipboardList size={24} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.todoItemLabel}>Low Stock</Text>
                  <View style={styles.todoItemValueRow}>
                    <Text style={styles.todoItemValueBlue}>{lowStock}</Text>
                    <ChevronRight size={14} color="#4338CA" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Business Insights */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconBgGray}>
                <Activity size={18} color="#64748B" />
              </View>
              <Text style={styles.cardTitle}>Business Insights</Text>
            </View>

            <View style={styles.insightsContent}>
              {/* Left Chart Area */}
              <View style={styles.chartArea}>
                <Text style={styles.chartTab}>Daily</Text>
                
                <View style={styles.chartWrapper}>
                  {/* Y Axis Labels */}
                  <View style={styles.yAxis}>
                    <Text style={styles.axisText}>₹{(maxSales).toLocaleString('en-IN')}</Text>
                    <Text style={styles.axisText}>₹{Math.floor(maxSales * 0.66).toLocaleString('en-IN')}</Text>
                    <Text style={styles.axisText}>₹{Math.floor(maxSales * 0.33).toLocaleString('en-IN')}</Text>
                    <Text style={styles.axisText}>0</Text>
                  </View>
                  
                  {/* SVG Chart */}
                  <View style={styles.svgContainer}>
                    <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                      <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor="#EEF2FF" stopOpacity="0.8" />
                          <Stop offset="1" stopColor="#EEF2FF" stopOpacity="0" />
                        </LinearGradient>
                      </Defs>
                      
                      {/* Grid Lines */}
                      <Line x1="0" y1="10" x2={chartWidth} y2="10" stroke="#F1F5F9" strokeWidth="1" />
                      <Line x1="0" y1="60" x2={chartWidth} y2="60" stroke="#F1F5F9" strokeWidth="1" />
                      <Line x1="0" y1="110" x2={chartWidth} y2="110" stroke="#F1F5F9" strokeWidth="1" />
                      <Line x1="0" y1="160" x2={chartWidth} y2="160" stroke="#F1F5F9" strokeWidth="1" />
                      
                      {/* Area & Line */}
                      <Path d={areaD} fill="url(#grad)" />
                      <Path d={pathD} fill="none" stroke="#6366F1" strokeWidth="2.5" />
                      
                      {/* Data Points */}
                      {points.map((p, i) => (
                        <Circle key={i} cx={p.x} cy={p.y} r="4" fill="#6366F1" stroke="#FFF" strokeWidth="2" />
                      ))}
                    </Svg>
                    
                    {/* X Axis Labels */}
                    <View style={styles.xAxis}>
                      <Text style={styles.axisText}>{last7Days[0]}</Text>
                      <Text style={styles.axisText}>{last7Days[1]}</Text>
                      <Text style={styles.axisText}>{last7Days[2]}</Text>
                      <Text style={[styles.axisText, {marginLeft: 10}]}>{last7Days[3]}</Text>
                      <Text style={styles.axisText}>{last7Days[4]}</Text>
                      <Text style={styles.axisText}>{last7Days[5]}</Text>
                      <Text style={styles.axisText}>{last7Days[6]}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.viewMoreBtn}>
                  <Text style={styles.viewMoreText}>View More Details</Text>
                </TouchableOpacity>
              </View>

              {/* Right Stats Area */}
              <View style={styles.statsArea}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Views <Text style={styles.statBoxDate}>(Today)</Text></Text>
                  <View style={styles.statBoxValueRow}>
                    <Text style={styles.statBoxValue}>{viewsToday.toLocaleString('en-IN')}</Text>
                    <Text style={styles.statBoxGrowth}>▲ 4.59%</Text>
                  </View>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Orders <Text style={styles.statBoxDate}>(Today)</Text></Text>
                  <View style={styles.statBoxValueRow}>
                    <Text style={styles.statBoxValue}>{totalOrdersToday}</Text>
                    <Text style={styles.statBoxGrowth}>▲ 32.14%</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

        </View>

        {/* RIGHT COLUMN */}
        <View style={styles.rightColumn}>
          
          {/* Account Setup */}
          <View style={styles.card}>
            <Text style={styles.cardTitleLarge}>Complete your account setup</Text>
            <Text style={styles.cardSubText}>Add the below information to improve your selling journey</Text>
            
            <TouchableOpacity style={styles.addBtnRow}>
              <PlusCircle size={20} color="#4338CA" />
              <Text style={styles.addBtnText}>Add Business Type</Text>
            </TouchableOpacity>
          </View>

          {/* Flash Sale Banner */}
          <View style={styles.card}>
            <View style={styles.flashHeaderRow}>
              <View style={styles.timerBadge}>
                <Clock size={12} color="#D97706" style={{marginRight: 4}} />
                <Text style={styles.timerText}>2h : 21m : 23s</Text>
              </View>
              {/* Fake logo for mega blockbuster sale */}
              <View style={styles.saleLogoMock}>
                <Text style={styles.saleLogoMockText}>MEGA BLOCKBUSTER SALE</Text>
              </View>
            </View>

            <Text style={styles.flashTitle}>
              Add timer on Mega Blockbuster Sale! Get <Text style={styles.flashTitlePurple}>extra 50% growth*</Text>
            </Text>

            {/* Growth Curve SVG */}
            <View style={styles.flashSvgContainer}>
              <Svg width="100%" height={100} viewBox="0 0 300 100">
                {/* Curved line (current to flash) */}
                <Path d="M 10 70 Q 100 90, 150 50 T 280 30" fill="none" stroke="#22C55E" strokeWidth="2" />
                <Path d="M 275 25 L 285 30 L 275 35 Z" fill="#22C55E" />
                
                {/* Points */}
                <Circle cx="80" cy="73" r="4" fill="#22C55E" />
                <Circle cx="240" cy="33" r="4" fill="#22C55E" />

                {/* Text Labels */}
                <SvgText x="80" y="90" fontSize="10" fill="#64748B" textAnchor="middle">150%</SvgText>
                <SvgText x="80" y="102" fontSize="10" fill="#94A3B8" textAnchor="middle">current growth</SvgText>

                <SvgText x="240" y="65" fontSize="12" fill="#334155" fontWeight="bold" textAnchor="middle">200%</SvgText>
                <SvgText x="240" y="80" fontSize="10" fill="#64748B" textAnchor="middle">flash growth</SvgText>
                
                <SvgText x="160" y="30" fontSize="10" fill="#22C55E" fontWeight="bold" textAnchor="middle">+ 50%</SvgText>
              </Svg>
            </View>

            <TouchableOpacity style={styles.flashBtn}>
              <Text style={styles.flashBtnText}>Add flash discount</Text>
            </TouchableOpacity>
            
            <Text style={styles.flashFooter}>*Based on internal projections. Actual figures may vary.</Text>
          </View>

        </View>
      </View>

      <ESignatureModal
        visible={showESignatureModal}
        onClose={() => setShowESignatureModal(false)}
        onSave={() => {}}
      />
      <BulkCatalogUploadModal
        visible={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={onNavigateToManageCatalogs}
      />
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
    gap: 16,
  },
  headerBox: {
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 14,
    color: '#64748B',
  },
  alertBanner: {
    backgroundColor: '#FEF9C3', // Light yellow
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  alertEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
  },
  alertTextBold: {
    fontWeight: '700',
    color: '#D97706',
  },
  alertTextBoldBlack: {
    fontWeight: '700',
    color: '#1E293B',
  },
  knowMoreText: {
    fontSize: 14,
    color: '#4338CA',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    fontWeight: '500',
    marginLeft: 8,
  },
  gridContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
  },
  leftColumn: {
    flex: 2,
    gap: 16,
  },
  rightColumn: {
    flex: 1,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  iconBgGray: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  todoCardsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  todoItemCard: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  todoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FEF3C7', // default brown/yellow
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  todoIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#D97706',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  todoItemLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  todoItemValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todoItemValueBlue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4338CA', // Indigo
  },
  insightsContent: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  chartArea: {
    flex: 3,
    minWidth: 300,
  },
  chartTab: {
    color: '#4338CA',
    fontWeight: '600',
    fontSize: 14,
    alignSelf: 'center',
    marginBottom: 16,
  },
  chartWrapper: {
    flexDirection: 'row',
    height: 180,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 12,
    paddingBottom: 20, // leave space for X axis
  },
  svgContainer: {
    flex: 1,
    position: 'relative',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    position: 'absolute',
    bottom: -15,
    left: 0,
    right: 0,
  },
  axisText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  viewMoreBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#4338CA',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 20,
  },
  viewMoreText: {
    color: '#4338CA',
    fontWeight: '600',
    fontSize: 14,
  },
  statsArea: {
    flex: 1,
    minWidth: 150,
    gap: 16,
  },
  statBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
  },
  statBoxLabel: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
  },
  statBoxDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statBoxValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  statBoxGrowth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  cardTitleLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardSubText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 20,
  },
  addBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtnText: {
    color: '#4338CA',
    fontWeight: '600',
    fontSize: 14,
  },
  flashHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  timerText: {
    color: '#D97706',
    fontWeight: '700',
    fontSize: 12,
  },
  saleLogoMock: {
    backgroundColor: '#DB2777',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    transform: [{ rotate: '5deg' }],
  },
  saleLogoMockText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  flashTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 8,
  },
  flashTitlePurple: {
    color: '#4338CA',
  },
  flashSvgContainer: {
    height: 100,
    marginVertical: 8,
  },
  flashBtn: {
    backgroundColor: '#4338CA',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  flashBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  flashFooter: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
