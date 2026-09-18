import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Image, Linking } from 'react-native';
import { PackageCheck, ArrowRight, AlertCircle, ArrowLeft, Megaphone, ChevronDown, Search, SquareCheck, Download, Activity } from 'lucide-react-native';
import { Order, OrderStatus } from '../../types';
import { getOrdersPaginated, updateOrderStatus, wipeAllOrders } from '../../services/firebaseService';
import { shiprocketLogin, createShiprocketOrder, generateShiprocketLabel } from '../../services/shiprocketService';
import { createShadowfaxOrder } from '../../services/shadowfaxService';
import { useAuth } from '../../context/AuthContext';
import { createSettlement, chargeRTOPenalty } from '../../services/settlementService';
import ShippingLabelModal from '../../components/seller/ShippingLabelModal';
import { DispatchHealthModal } from '../../components/seller/DispatchHealthModal';

interface ManageOrdersScreenProps {
  onBack?: () => void;
}

export const ManageOrdersScreen: React.FC<ManageOrdersScreenProps> = ({ onBack }) => {
  const { sellerProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [labelModalVisible, setLabelModalVisible] = useState(false);
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<Order | null>(null);
  const [healthModalVisible, setHealthModalVisible] = useState(false);

  const [lastVisible, setLastVisible] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (sellerProfile?.id) {
      fetchOrders(false);
    }
  }, [sellerProfile?.id]);

  const fetchOrders = async (loadMore = false) => {
    if (loadMore) {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    } else {
      setLoading(true);
      setLastVisible(null);
    }

    try {
      const startAfterDoc = loadMore ? lastVisible : null;
      const { orders: newOrders, lastDoc } = await getOrdersPaginated(sellerProfile?.id, undefined, startAfterDoc, 20);
      
      // Native query inside getOrdersPaginated already filters by sellerId
      if (newOrders.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setLastVisible(lastDoc);
      setOrders(prev => loadMore ? [...prev, ...newOrders] : newOrders);
    } catch (err) {
      console.error(err);
      if (!loadMore) setOrders([]);
    } finally {
      if (loadMore) setLoadingMore(false);
      else setLoading(false);
    }
  };

  const handleAdvanceStatus = async (order: Order) => {
    let updatePayload: Partial<Order> = {};
    const { fulfillmentStatus, deliveryStatus } = order;

    if (fulfillmentStatus === 'pending') {
      updatePayload.fulfillmentStatus = 'processing';
    } else if (fulfillmentStatus === 'processing') {
      updatePayload.fulfillmentStatus = 'ready_to_ship';
      updatePayload.deliveryStatus = 'shipped';
    } else if (deliveryStatus === 'shipped') {
      updatePayload.deliveryStatus = 'reached_hub';
    } else if (deliveryStatus === 'reached_hub') {
      updatePayload.deliveryStatus = 'out_for_delivery';
    } else if (deliveryStatus === 'out_for_delivery') {
      updatePayload.deliveryStatus = 'delivered';
    } else return;

    try {
      setLoading(true);
      let courierData = {};

      if (fulfillmentStatus === 'pending' && updatePayload.fulfillmentStatus === 'processing' && sellerProfile) {
        if (order) {
          if (order.courierPartner === 'shadowfax') {
            const result = await createShadowfaxOrder(order, sellerProfile);
            courierData = {
              shadowfaxAwb: result.awb_number,
              awbCode: result.awb_number
            };
            alert(`Shadowfax Order created! AWB: ${result.awb_number}`);
          } else {
            const token = await shiprocketLogin();
            const shiprocketResult = await createShiprocketOrder(order, sellerProfile, token);
            courierData = {
              shiprocketOrderId: shiprocketResult.order_id,
              shiprocketShipmentId: shiprocketResult.shipment_id,
              awbCode: shiprocketResult.awb_code
            };
            alert(`Shiprocket Order created! ID: ${shiprocketResult.order_id}`);
          }
        }
      }

      await updateOrderStatus(order.id, updatePayload.status as any, { ...updatePayload, ...courierData });
      
      if (updatePayload.deliveryStatus === 'delivered' && sellerProfile) {
        await createSettlement(order, sellerProfile.id, sellerProfile.storeName);
      }

      setOrders(prev =>
        prev.map(o => (o.id === order.id ? { ...o, ...updatePayload, ...courierData } : o))
      );
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRTO = async (orderId: string, isDelivered: boolean) => {
    try {
      setLoading(true);
      const nextStatus = isDelivered ? 'rto_delivered_to_seller' : 'rto_in_transit';
      await updateOrderStatus(orderId, nextStatus as any, { deliveryStatus: nextStatus });
      
      if (isDelivered) {
        // Trigger penalty using settlementService (we need to make sure order object is passed if required)
        const order = orders.find(o => o.id === orderId);
        if (order) {
           // We will import chargeRTOPenalty and call it here.
           await chargeRTOPenalty(order);
        }
      }

      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, deliveryStatus: nextStatus } : o))
      );
      alert(`Order marked as ${isDelivered ? 'RTO Delivered' : 'RTO In Transit'}`);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to update RTO status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectStatus = async (orderId: string) => {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, 'cancelled', { fulfillmentStatus: 'cancelled' });
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, fulfillmentStatus: 'cancelled' } : o)));
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

  const handlePrintShadowfaxLabel = (order: Order) => {
    setSelectedOrderForLabel(order);
    setLabelModalVisible(true);
    // Mark as downloaded so they can proceed to Dispatch
    if (!order.isLabelDownloaded) {
      updateOrderStatus(order.id, 'processing', { isLabelDownloaded: true });
      setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, isLabelDownloaded: true } : o)));
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
    if (activeFilter === 'pending') return o.fulfillmentStatus === 'pending';
    if (activeFilter === 'processing') return o.fulfillmentStatus === 'processing' || o.fulfillmentStatus === 'ready_to_ship';
    if (activeFilter === 'shipped') return ['shipped', 'reached_hub', 'out_for_delivery', 'rto_in_transit'].includes(o.deliveryStatus);
    if (activeFilter === 'delivered') return o.deliveryStatus === 'delivered';
    if (activeFilter === 'cancelled') return o.fulfillmentStatus === 'cancelled';
    return false;
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
              <Activity size={24} color="#10B981" />
            </View>
            <View>
              <Text style={styles.healthTitle}>Get better visibility into your dispatch health</Text>
              <Text style={styles.healthSubtext}>Track dispatch health, catalog status and key order performance insights in one place.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.healthBtn} onPress={() => setHealthModalVisible(true)}>
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

        {/* Table Container */}
        <View style={styles.tableWrapper}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.thCell, { width: 40 }]}><SquareCheck size={16} color="#94A3B8" /></View>
              <View style={[styles.thCell, { flex: 2 }]}><Text style={styles.thText}>Product Details</Text></View>
              <View style={[styles.thCell, { flex: 1 }]}><Text style={styles.thText}>Sub-order ID</Text></View>
              <View style={[styles.thCell, { flex: 1 }]}><Text style={styles.thText}>SKU ID</Text></View>
              <View style={[styles.thCell, { flex: 1 }]}><Text style={styles.thText}>TafDeal ID</Text></View>
              <View style={[styles.thCell, { width: 50 }]}><Text style={styles.thText}>Qty</Text></View>
              <View style={[styles.thCell, { width: 80 }]}><Text style={styles.thText}>Size/Color</Text></View>
              <View style={[styles.thCell, { flex: 1.2 }]}><Text style={styles.thText}>Order Date</Text></View>
              <View style={[styles.thCell, { flex: 1.2 }]}><Text style={styles.thText}>SLA</Text></View>
              <View style={[styles.thCell, { width: 110, alignItems: 'center' }]}><Text style={styles.thText}>Action</Text></View>
            </View>

            {loading && orders.length === 0 ? (
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 40 }} />
            ) : flatItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <AlertCircle size={32} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No orders found</Text>
              </View>
              ) : (
                flatItems.map(({ order, item, subOrderId }, index) => {
                  const fStatus = order.fulfillmentStatus || (order as any).status || 'pending';
                  const dStatus = order.deliveryStatus || ((order as any).status === 'shipped' ? 'shipped' : (order as any).status === 'delivered' ? 'delivered' : 'unshipped');
                  const isPending = fStatus === 'pending';
                const orderDate = new Date(order.createdAt || Date.now());
                const slaDate = new Date(orderDate);
                slaDate.setDate(slaDate.getDate() + 2);
                const displaySla = slaDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                
                const formattedOrderDate = orderDate.toLocaleString('en-IN', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: true 
                });
                
                return (
                  <View key={subOrderId} style={styles.tableRow}>
                    <View style={[styles.tdCell, { width: 40 }]}><View style={styles.checkboxPlaceholder} /></View>
                    
                    <View style={[styles.tdCell, { flex: 2, flexDirection: 'row', gap: 10 }]}>
                      {item.product.imageUrl && <Image source={{ uri: item.product.imageUrl }} style={styles.productImage} />}
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.productTitle} numberOfLines={2}>{item.product.title}</Text>
                        <Text style={styles.orderIdText}>Order ID: {order.id.replace('ORD-', '')}</Text>
                      </View>
                    </View>

                    <View style={[styles.tdCell, { flex: 1 }]}><Text style={styles.tdText} numberOfLines={2}>{subOrderId}</Text></View>
                    {(() => {
                      let displaySku = item.product.sellerCode || item.product.catalogId || 'N/A';
                      
                      if (item.product.variants && item.product.variants.length > 0) {
                        const matchedVariant = item.product.variants.find((v: any) => {
                          const vColor = v.attributeValues?.color || v.attributeValues?.Color;
                          const vSize = v.attributeValues?.size || v.attributeValues?.Size;
                          // Match only if the property exists and matches, or if it wasn't selected
                          const colorMatch = !item.product.color || vColor === item.product.color;
                          const sizeMatch = !item.product.selectedSize || vSize === item.product.selectedSize;
                          return colorMatch && sizeMatch;
                        });
                        if (matchedVariant?.sku) {
                          displaySku = matchedVariant.sku;
                        }
                      } else if (item.product.sizes) {
                        const selectedSizeSku = item.product.sizes.find((s: any) => s.size === item.product.selectedSize)?.sku;
                        if (selectedSizeSku) {
                          displaySku = selectedSizeSku;
                        }
                      }
                      
                      return <View style={[styles.tdCell, { flex: 1 }]}><Text style={styles.tdText} numberOfLines={2}>{displaySku}</Text></View>;
                    })()}
                    <View style={[styles.tdCell, { flex: 1 }]}><Text style={styles.tdText} numberOfLines={2}>{order.id}</Text></View>
                    <View style={[styles.tdCell, { width: 50 }]}><Text style={styles.tdText}>{item.quantity}</Text></View>

                    {(() => {
                      let resolvedColor = item.product?.color || (item.product as any)?.selectedColor || (item as any).color || (item as any).selectedColor;
                      if (!resolvedColor && item.product?.variants && item.product?.selectedSize) {
                        const matchedVar = item.product.variants.find((v: any) => {
                          const vSize = v.attributeValues?.Size || v.attributeValues?.size || v.attributeValues?.['Shirt Size'] || v.title?.split('-')?.pop()?.trim();
                          return vSize === item.product?.selectedSize;
                        });
                        if (matchedVar) {
                          resolvedColor = matchedVar.attributeValues?.color || matchedVar.attributeValues?.Color;
                        }
                      }
                      const sizeText = item.product?.selectedSize || 'Free Size';
                      const colorText = resolvedColor ? `\n${resolvedColor}` : '';
                      return (
                        <View style={[styles.tdCell, { width: 80, justifyContent: 'center' }]}>
                          <Text style={styles.tdText} numberOfLines={2}>{sizeText}{colorText}</Text>
                        </View>
                      );
                    })()}
                    
                    <View style={[styles.tdCell, { flex: 1.2 }]}>
                      <Text style={styles.tdText} numberOfLines={2}>{formattedOrderDate}</Text>
                    </View>
                    
                    <View style={[styles.tdCell, { flex: 1.2 }]}>
                      <Text style={styles.tdText} numberOfLines={2}>{displaySla}</Text>
                      {isPending && (
                        <View style={styles.slaBadge}>
                          <AlertCircle size={10} color="#4F46E5" />
                          <Text style={styles.slaBadgeText}>Breaching</Text>
                        </View>
                      )}
                    </View>

                    <View style={[styles.tdCell, { width: 110, paddingRight: 10, justifyContent: 'center' }]}>
                      {isPending ? (
                        <View style={{ gap: 8 }}>
                          <TouchableOpacity style={styles.btnPrimary} onPress={() => handleAdvanceStatus(order)}>
                            <Text style={styles.btnPrimaryText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.btnSecondary} onPress={() => handleRejectStatus(order.id)}>
                            <Text style={styles.btnSecondaryText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (fStatus === 'processing' || fStatus === 'ready_to_ship') && dStatus === 'unshipped' ? (
                        <View style={{ gap: 8, alignItems: 'center', width: '100%' }}>
                          {order.courierPartner === 'shadowfax' ? (
                            <TouchableOpacity 
                              style={[styles.btnPrimary, { flexDirection: 'row', gap: 6, width: '100%', justifyContent: 'center' }]} 
                              onPress={() => handlePrintShadowfaxLabel(order)}
                            >
                              <Download size={14} color="#FFF" />
                              <Text style={styles.btnPrimaryText}>Print Label</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity 
                              style={[styles.btnPrimary, { flexDirection: 'row', gap: 6, width: '100%', justifyContent: 'center' }]} 
                              onPress={() => handleDownloadLabel(order.id, order.shiprocketShipmentId)}
                            >
                              <Download size={14} color="#FFF" />
                              <Text style={styles.btnPrimaryText}>Label</Text>
                            </TouchableOpacity>
                          )}
                          <Text style={order.isLabelDownloaded ? styles.labelSuccess : styles.labelPending}>
                            {order.isLabelDownloaded ? 'Downloaded' : 'Not Downloaded'}
                          </Text>
                          {order.isLabelDownloaded && dStatus === 'unshipped' && (
                            <TouchableOpacity style={[styles.btnSecondary, { width: '100%' }]} onPress={() => handleAdvanceStatus(order)}>
                              <Text style={styles.btnSecondaryText}>Dispatch</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : dStatus === 'shipped' ? (
                        <View style={{ gap: 8 }}>
                          <TouchableOpacity style={styles.btnPrimary} onPress={() => handleAdvanceStatus(order)}>
                            <Text style={styles.btnPrimaryText}>Mark at Hub</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.btnSecondary} onPress={() => handleMarkRTO(order.id, false)}>
                            <Text style={styles.btnSecondaryText}>Mark RTO</Text>
                          </TouchableOpacity>
                        </View>
                      ) : dStatus === 'reached_hub' ? (
                        <View style={{ gap: 8 }}>
                          <TouchableOpacity style={styles.btnPrimary} onPress={() => handleAdvanceStatus(order)}>
                            <Text style={styles.btnPrimaryText}>Out for Delivery</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.btnSecondary} onPress={() => handleMarkRTO(order.id, false)}>
                            <Text style={styles.btnSecondaryText}>Mark RTO</Text>
                          </TouchableOpacity>
                        </View>
                      ) : dStatus === 'out_for_delivery' ? (
                        <View style={{ gap: 8 }}>
                          <TouchableOpacity style={styles.btnPrimary} onPress={() => handleAdvanceStatus(order)}>
                            <Text style={styles.btnPrimaryText}>Mark Delivered</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.btnSecondary} onPress={() => handleMarkRTO(order.id, false)}>
                            <Text style={styles.btnSecondaryText}>Mark RTO</Text>
                          </TouchableOpacity>
                        </View>
                      ) : dStatus === 'rto_in_transit' ? (
                        <TouchableOpacity style={styles.btnPrimary} onPress={() => handleMarkRTO(order.id, true)}>
                          <Text style={styles.btnPrimaryText}>RTO Delivered</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.statusCompletedText}>{fStatus === 'cancelled' ? 'CANCELLED' : dStatus?.toUpperCase()}</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
          
          {hasMore && orders.length > 0 && (
            <TouchableOpacity 
              style={{ padding: 16, alignItems: 'center', backgroundColor: '#F8FAFC', borderTopWidth: 1, borderColor: '#E2E8F0' }}
              onPress={() => fetchOrders(true)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : (
                <Text style={{ color: '#4F46E5', fontWeight: '600' }}>Load More Orders</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <ShippingLabelModal 
        visible={labelModalVisible} 
        onClose={() => setLabelModalVisible(false)}
        order={selectedOrderForLabel}
        seller={sellerProfile}
      />

      <DispatchHealthModal 
        visible={healthModalVisible} 
        onClose={() => setHealthModalVisible(false)} 
      />
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
    width: '100%',
  },
  table: {
    width: '100%',
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


