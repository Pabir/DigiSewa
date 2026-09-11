import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Image, Linking } from 'react-native';
import { PackageCheck, ArrowRight, AlertCircle, ArrowLeft, Megaphone, ChevronDown, Search, CheckSquare, Download } from 'lucide-react-native';
import { Order, OrderStatus } from '../../types';
import { getOrders, updateOrderStatus, wipeAllOrders } from '../../services/firebaseService';
import { shiprocketLogin, createShiprocketOrder, generateShiprocketLabel } from '../../services/shiprocketService';
import { useAuth } from '../../context/AuthContext';
import { createSettlement } from '../../services/settlementService';

interface ManageOrdersScreenProps {
  onBack?: () => void;
}

export const ManageOrdersScreen: React.FC<ManageOrdersScreenProps> = ({ onBack }) => {
  const { sellerProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');

  useEffect(() => {
    if (sellerProfile?.id) {
      fetchOrders();
    }
  }, [sellerProfile?.id]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders(sellerProfile?.id);
      
      const myOrders = data.filter(order => {
        if (!sellerProfile?.id) return false;
        if (!order.items || !Array.isArray(order.items)) return false;
        return order.items.some(item => item.product?.sellerId === sellerProfile.id);
      });
      
      setOrders(myOrders);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'processing';
    if (currentStatus === 'pending') nextStatus = 'processing';
    else if (currentStatus === 'processing') nextStatus = 'shipped';
    else if (currentStatus === 'shipped') nextStatus = 'reached_hub';
    else if (currentStatus === 'reached_hub') nextStatus = 'out_for_delivery';
    else if (currentStatus === 'out_for_delivery') nextStatus = 'delivered';
    else return;

    try {
      setLoading(true);
      let shiprocketData = {};

      if (currentStatus === 'pending' && nextStatus === 'processing' && sellerProfile) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const token = await shiprocketLogin();
          const shiprocketResult = await createShiprocketOrder(order, sellerProfile, token);
          shiprocketData = {
            shiprocketOrderId: shiprocketResult.order_id,
            shiprocketShipmentId: shiprocketResult.shipment_id,
            awbCode: shiprocketResult.awb_code
          };
          alert(`Shiprocket Order created! ID: ${shiprocketResult.order_id}`);
        }
      }

      await updateOrderStatus(orderId, nextStatus, shiprocketData);
      
      if (nextStatus === 'delivered' && sellerProfile) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          await createSettlement(order, sellerProfile.id, sellerProfile.storeName);
        }
      }

      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: nextStatus, ...shiprocketData } : o))
      );
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectStatus = async (orderId: string) => {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, 'cancelled');
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
      alert('Order rejected successfully.');
    } catch (err: any) {
      console.error(err);
      alert(`Failed to reject order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLabel = async (orderId: string, shipmentId?: string) => {
    if (!shipmentId) {
      alert('Cannot Download label: Shipment ID is missing.');
      return;
    }
    try {
      setLoading(true);
      const token = await shiprocketLogin();
      let url = '';
      
      try {
        url = await generateShiprocketLabel(shipmentId, token);
      } catch (labelErr: any) {
        console.warn('Shiprocket API failed, using dummy label fallback.', labelErr);
        // Sandbox / wallet balance fallback
        url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
        alert('Notice: Opening a dummy PDF label for testing because Shiprocket requires wallet balance to generate real AWBs.');
      }
      
      await updateOrderStatus(orderId, 'processing', { labelUrl: url, isLabelDownloaded: true });
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, labelUrl: url, isLabelDownloaded: true } : o)));
      
      Linking.openURL(url);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to Download label: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWipeData = async () => {
    setLoading(true);
    await wipeAllOrders();
    setOrders([]);
    setLoading(false);
    alert('All orders wiped from database!');
  };

  const filteredOrders = orders.filter(o => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'shipped') return ['shipped', 'reached_hub', 'out_for_delivery'].includes(o.status);
    return o.status === activeFilter;
  });

  const flatItems = filteredOrders.flatMap(order => 
    order.items.map((item, index) => ({
      order,
      item,
      subOrderId: `${order.id.replace('ORD-', '')}_${index + 1}`
    }))
  );

  const renderTabs = () => {
    const tabs = [
      { id: 'all', label: 'All Orders' },
      { id: 'pending', label: 'Pending' },
      { id: 'processing', label: 'Ready to Ship' },
      { id: 'shipped', label: 'Shipped' },
      { id: 'delivered', label: 'Delivered' },
      { id: 'cancelled', label: 'Cancelled' },
    ];

    return (
      <View style={styles.tabContainer}>
        {tabs.map(tab => {
          const isActive = activeFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveFilter(tab.id as any)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
                {isActive && ` (${flatItems.length})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Container for main page content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity 
          style={{backgroundColor: '#DC2626', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16}} 
          onPress={handleWipeData}
        >
          <Text style={{color: 'white', fontWeight: '900', fontSize: 14}}>CLICK HERE TO WIPE DUMMY ORDERS FROM DATABASE</Text>
        </TouchableOpacity>

        {/* Banners */}
        <View style={styles.policyBanner}>
          <Megaphone size={18} color="#D97706" />
          <Text style={styles.policyText}>
            <Text style={{ fontWeight: 'bold' }}>Upcoming Policy Update:</Text> Next Day Dispatch is becoming the new platform standard for all orders.
          </Text>
          <TouchableOpacity>
            <Text style={styles.policyLink}>Know more</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.healthBanner}>
          <View style={styles.healthLeft}>
            <View style={styles.healthIconPlaceholder}>
              <ActivityIndicator size="small" color="#10B981" />
            </View>
            <View>
              <Text style={styles.healthTitle}>Get better visibility into your dispatch health</Text>
              <Text style={styles.healthSubtext}>Track dispatch health, catalog status and key order performance insights in one place.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.healthBtn}>
            <Text style={styles.healthBtnText}>Check Dispatch health</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Filter Row */}
        <View style={styles.filterRow}>
          <View style={styles.filterLeft}>
            <Text style={styles.filterByText}>Filter by:</Text>
            <View style={styles.dropdownBtn}>
              <Text style={styles.dropdownText}>SLA Status</Text>
              <ChevronDown size={14} color="#64748B" />
            </View>
            <View style={styles.dropdownBtn}>
              <Text style={styles.dropdownText}>Dispatch Date</Text>
              <ChevronDown size={14} color="#64748B" />
            </View>
            <View style={styles.dropdownBtn}>
              <Text style={styles.dropdownText}>Order Date</Text>
              <ChevronDown size={14} color="#64748B" />
            </View>
          </View>
          <View style={styles.searchBox}>
            <View style={styles.dropdownBtnSmall}>
              <Text style={styles.dropdownText}>SKU ID</Text>
              <ChevronDown size={14} color="#64748B" />
            </View>
            <TextInput style={styles.searchInput} placeholder="Search" />
            <Search size={16} color="#94A3B8" />
          </View>
        </View>

        {/* Horizontal Scroll for Table */}
        <ScrollView horizontal style={styles.tableWrapper} showsHorizontalScrollIndicator={true}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.thCell, { width: 40 }]}><CheckSquare size={16} color="#94A3B8" /></View>
              <View style={[styles.thCell, { width: 250 }]}><Text style={styles.thText}>Product Details</Text></View>
              <View style={[styles.thCell, { width: 150 }]}><Text style={styles.thText}>Sub-order ID</Text></View>
              <View style={[styles.thCell, { width: 120 }]}><Text style={styles.thText}>SKU ID</Text></View>
              <View style={[styles.thCell, { width: 120 }]}><Text style={styles.thText}>DigiSewa ID</Text></View>
              <View style={[styles.thCell, { width: 80 }]}><Text style={styles.thText}>Quantity</Text></View>
              <View style={[styles.thCell, { width: 80 }]}><Text style={styles.thText}>Size</Text></View>
              <View style={[styles.thCell, { width: 150 }]}><Text style={styles.thText}>Dispatch Date/SLA</Text></View>
              <View style={[styles.thCell, { width: 150, alignItems: 'center' }]}><Text style={styles.thText}>Action</Text></View>
            </View>

            {/* Table Body */}
            {loading ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 40 }} />
            ) : flatItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <AlertCircle size={32} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No orders found</Text>
              </View>
            ) : (
              flatItems.map(({ order, item, subOrderId }, index) => {
                const isPending = order.status === 'pending';
                
                return (
                  <View key={subOrderId} style={styles.tableRow}>
                    <View style={[styles.tdCell, { width: 40 }]}><View style={styles.checkboxPlaceholder} /></View>
                    
                    <View style={[styles.tdCell, { width: 250, flexDirection: 'row', gap: 10 }]}>
                      {item.product.imageUrl && <Image source={{ uri: item.product.imageUrl }} style={styles.productImage} />}
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.productTitle} numberOfLines={2}>{item.product.title}</Text>
                        <Text style={styles.orderIdText}>Order ID: {order.id.replace('ORD-', '')}</Text>
                      </View>
                    </View>

                    <View style={[styles.tdCell, { width: 150 }]}><Text style={styles.tdText}>{subOrderId}</Text></View>
                    {(() => {
                      const selectedSizeSku = item.product.sizes?.find(s => s.size === item.product.selectedSize)?.sku;
                      const displaySku = selectedSizeSku || item.product.sellerCode || item.product.catalogId || 'N/A';
                      return <View style={[styles.tdCell, { width: 120 }]}><Text style={styles.tdText}>{displaySku}</Text></View>;
                    })()}
                    <View style={[styles.tdCell, { width: 120 }]}><Text style={styles.tdText}>{order.id}</Text></View>
                    <View style={[styles.tdCell, { width: 80 }]}><Text style={styles.tdText}>{item.quantity}</Text></View>
                    <View style={[styles.tdCell, { width: 80 }]}><Text style={styles.tdText}>{item.product.selectedSize || 'Free Size'}</Text></View>
                    
                    <View style={[styles.tdCell, { width: 150 }]}>
                      <Text style={styles.tdText}>07 Aug</Text>
                      {isPending && (
                        <View style={styles.slaBadge}>
                          <AlertCircle size={10} color="#4F46E5" />
                          <Text style={styles.slaBadgeText}>Breaching Soon</Text>
                        </View>
                      )}
                    </View>

                    <View style={[styles.tdCell, { width: 150, paddingRight: 10, justifyContent: 'center' }]}>
                      {isPending ? (
                        <View style={{ gap: 8 }}>
                          <TouchableOpacity style={styles.btnPrimary} onPress={() => handleAdvanceStatus(order.id, order.status)}>
                            <Text style={styles.btnPrimaryText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.btnSecondary} onPress={() => handleRejectStatus(order.id)}>
                            <Text style={styles.btnSecondaryText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      ) : order.status === 'processing' ? (
                        <View style={{ gap: 8, alignItems: 'center', width: '100%' }}>
                          <TouchableOpacity 
                            style={[styles.btnPrimary, { flexDirection: 'row', gap: 6, width: '100%', justifyContent: 'center' }]} 
                            onPress={() => handleDownloadLabel(order.id, order.shiprocketShipmentId)}
                          >
                            <Download size={14} color="#FFF" />
                            <Text style={styles.btnPrimaryText}>Label</Text>
                          </TouchableOpacity>
                          <Text style={order.isLabelDownloaded ? styles.labelSuccess : styles.labelPending}>
                            {order.isLabelDownloaded ? 'Downloaded' : 'Not Downloaded'}
                          </Text>
                          {order.isLabelDownloaded && (
                            <TouchableOpacity style={[styles.btnSecondary, { width: '100%' }]} onPress={() => handleAdvanceStatus(order.id, order.status)}>
                              <Text style={styles.btnSecondaryText}>Dispatch</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : order.status === 'shipped' ? (
                        <TouchableOpacity style={styles.btnPrimary} onPress={() => handleAdvanceStatus(order.id, order.status)}>
                          <Text style={styles.btnPrimaryText}>Mark at Hub</Text>
                        </TouchableOpacity>
                      ) : order.status === 'reached_hub' ? (
                        <TouchableOpacity style={styles.btnPrimary} onPress={() => handleAdvanceStatus(order.id, order.status)}>
                          <Text style={styles.btnPrimaryText}>Out for Delivery</Text>
                        </TouchableOpacity>
                      ) : order.status === 'out_for_delivery' ? (
                        <TouchableOpacity style={styles.btnPrimary} onPress={() => handleAdvanceStatus(order.id, order.status)}>
                          <Text style={styles.btnPrimaryText}>Mark Delivered</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.statusCompletedText}>{order.status.toUpperCase()}</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  policyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  policyText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    marginLeft: 8,
  },
  policyLink: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginLeft: 16,
  },
  healthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  healthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  healthIconPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  healthSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  healthBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  healthBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#4F46E5',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  filterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterByText: {
    fontSize: 13,
    color: '#64748B',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  dropdownBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    height: '100%',
  },
  dropdownText: {
    fontSize: 13,
    color: '#334155',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 36,
    backgroundColor: '#FFFFFF',
    minWidth: 200,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
    fontSize: 13,
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  table: {
    minWidth: 1000,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  thCell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  thText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  tdCell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  tdText: {
    fontSize: 13,
    color: '#334155',
  },
  checkboxPlaceholder: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 2,
  },
  productImage: {
    width: 48,
    height: 64,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 11,
    color: '#64748B',
  },
  slaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  slaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  btnPrimary: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4F46E5',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  statusCompletedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  labelPending: {
    fontSize: 11,
    color: '#EF4444', // Red
    fontWeight: '600'
  },
  labelSuccess: {
    fontSize: 11,
    color: '#10B981', // Green
    fontWeight: '600'
  }
});


