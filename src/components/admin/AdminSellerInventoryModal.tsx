import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { X, Package, Truck, Landmark, User, Tag, ClipboardList, Clock, CheckCircle } from 'lucide-react-native';
import { Product, Order } from '../../types';
import { AdminSeller } from '../../types/adminTypes';
import { getProducts, getOrders } from '../../services/firebaseService';
import { OrderTrackingScreen } from '../../screens/buyer/OrderTrackingScreen';

interface AdminSellerInventoryModalProps {
  visible: boolean;
  seller: AdminSeller;
  onClose: () => void;
}

const DUMMY_SHIPPING_COST = 49;
const COMMISSION_PERCENT = 5;

export const AdminSellerInventoryModal: React.FC<AdminSellerInventoryModalProps> = ({
  visible,
  seller,
  onClose,
}) => {
  const sellerId = seller?.id;
  const sellerName = seller?.storeName;
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (visible && sellerId) {
      setIsLoading(true);
      setActiveTab('inventory');
      Promise.all([
        getProducts(false, sellerId),
        getOrders(sellerId)
      ])
        .then(([prodData, orderData]) => {
          setProducts(prodData);
          setOrders(orderData);
        })
        .catch(err => {
          console.error('Error fetching seller details:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [visible, sellerId]);

  const calculateSettlement = (product: Product) => {
    let amountOwed = product.price - (product.price * (COMMISSION_PERCENT / 100));
    if (product.offerFreeShipping) {
      amountOwed -= DUMMY_SHIPPING_COST;
    }
    return Math.max(0, Math.round(amountOwed * 100) / 100);
  };

  const calculateCustomerPrice = (product: Product) => {
    if (product.offerFreeShipping) {
      return product.price;
    }
    return product.price + DUMMY_SHIPPING_COST;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View>
                <Text style={styles.headerTitle}>Seller Inventory & Pricing</Text>
                <Text style={styles.headerSubtitle}>Viewing catalog for: {sellerName}</Text>
                {seller && (
                  <Text style={styles.sellerDetailsText}>
                    {seller.ownerName} | {seller.phone} | {seller.email}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {seller && (
              <View style={styles.extendedDetailsContainer}>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>GSTIN / PAN</Text>
                  <Text style={styles.detailValue}>{seller.gstin || 'N/A'} / {seller.panNumber || 'N/A'}</Text>
                </View>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Bank Details</Text>
                  <Text style={styles.detailValue}>{seller.bankName || 'N/A'}</Text>
                  <Text style={styles.detailSubValue}>A/C: {seller.bankAccountNo || 'N/A'}</Text>
                  <Text style={styles.detailSubValue}>IFSC: {seller.ifscCode || 'N/A'}</Text>
                </View>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{seller.storeAddress || 'N/A'}</Text>
                  <Text style={styles.detailSubValue}>{seller.city || ''}, {seller.state || ''} - {seller.pincode || ''}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}
              onPress={() => setActiveTab('inventory')}
            >
              <Package size={16} color={activeTab === 'inventory' ? '#4F46E5' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>Inventory ({products.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
              onPress={() => setActiveTab('orders')}
            >
              <ClipboardList size={16} color={activeTab === 'orders' ? '#4F46E5' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Orders ({orders.length})</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Fetching inventory...</Text>
            </View>
          ) : activeTab === 'inventory' && products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Package size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>This seller hasn't added any products yet.</Text>
            </View>
          ) : activeTab === 'orders' && orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ClipboardList size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No orders found for this seller.</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollContent} contentContainerStyle={{ padding: 16 }}>
              <View style={styles.tableWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ minWidth: 900 }}>
                    
                    {activeTab === 'inventory' ? (
                      <>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.th, { flex: 2 }]}>Product</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Inventory</Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>Delivery Profile</Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>Base Price</Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>Customer View</Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>Est. Settlement</Text>
                    </View>

                    {products.map(product => (
                      <View key={product.id} style={styles.tableRow}>
                        {/* Product Info */}
                        <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                          {product.imageUrl ? (
                            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                          ) : (
                            <View style={[styles.productImage, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
                              <Package size={20} color="#94A3B8" />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
                            <Text style={styles.productIdText}>ID: {product.id}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <Tag size={12} color="#64748B" />
                              <Text style={styles.productCategory}>{product.category}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Inventory */}
                        <View style={[styles.td, { flex: 1 }]}>
                          <Text style={styles.stockText}>{product.stock} units</Text>
                          {product.stock <= 5 && <Text style={styles.lowStockText}>Low Stock</Text>}
                        </View>

                        {/* Delivery Profile */}
                        <View style={[styles.td, { flex: 1.2 }]}>
                          <View style={[styles.badge, product.offerFreeShipping ? styles.badgeGreen : styles.badgeGray]}>
                            <Truck size={12} color={product.offerFreeShipping ? "#059669" : "#475569"} style={{ marginRight: 4 }} />
                            <Text style={product.offerFreeShipping ? styles.badgeTextGreen : styles.badgeTextGray}>
                              {product.offerFreeShipping ? 'Free Delivery' : 'Buyer Pays (₹49)'}
                            </Text>
                          </View>
                        </View>

                        {/* Base Price */}
                        <View style={[styles.td, { flex: 1.2 }]}>
                          <Text style={styles.priceText}>₹{product.price}</Text>
                          {product.originalPrice && (
                            <Text style={styles.originalPriceText}>MRP: ₹{product.originalPrice}</Text>
                          )}
                        </View>

                        {/* Customer View */}
                        <View style={[styles.td, { flex: 1.2 }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <User size={14} color="#0F172A" />
                            <Text style={styles.customerPriceText}>₹{calculateCustomerPrice(product)}</Text>
                          </View>
                          {!product.offerFreeShipping && (
                            <Text style={styles.subtext}>(Includes ₹49 Shipping)</Text>
                          )}
                        </View>

                        {/* Bank Settlement */}
                        <View style={[styles.td, { flex: 1.2 }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Landmark size={14} color="#4338CA" />
                            <Text style={styles.settlementPriceText}>₹{calculateSettlement(product)}</Text>
                          </View>
                          <Text style={styles.subtext}>(After {COMMISSION_PERCENT}% Comm.{product.offerFreeShipping ? ' & Shipping' : ''})</Text>
                        </View>
                      </View>
                    ))}
                      </>
                    ) : (
                      <>
                        <View style={styles.tableHeaderRow}>
                          <Text style={[styles.th, { flex: 1 }]}>Order ID / Date</Text>
                          <Text style={[styles.th, { flex: 2 }]}>Product Details</Text>
                          <Text style={[styles.th, { flex: 1 }]}>Qty & Price</Text>
                          <Text style={[styles.th, { flex: 1 }]}>Order Status</Text>
                          <Text style={[styles.th, { flex: 1.5 }]}>Customer Info</Text>
                        </View>

                        {orders.map(order => {
                          // A single order might have multiple items from this seller
                          const sellerItems = order.items.filter(item => item.product.sellerId === sellerId);
                          
                          return sellerItems.map((item, index) => (
                            <View key={`${order.id}-${index}`} style={styles.tableRow}>
                              {/* Order Info */}
                              <View style={[styles.td, { flex: 1 }]}>
                                <Text style={styles.orderIdText}>{order.id.slice(-8).toUpperCase()}</Text>
                                <Text style={styles.dateText}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                                {order.awbCode && (
                                  <TouchableOpacity onPress={() => setSelectedTrackingOrder(order)}>
                                    <Text style={styles.awbText}>AWB: {order.awbCode}</Text>
                                  </TouchableOpacity>
                                )}
                                {order.shadowfaxAwb && (
                                  <TouchableOpacity onPress={() => setSelectedTrackingOrder(order)}>
                                    <Text style={styles.awbText}>AWB: {order.shadowfaxAwb}</Text>
                                  </TouchableOpacity>
                                )}
                              </View>

                              {/* Product Info */}
                              <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                                {item.product.imageUrl ? (
                                  <Image source={{ uri: item.product.imageUrl }} style={styles.productImage} />
                                ) : (
                                  <View style={[styles.productImage, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Package size={20} color="#94A3B8" />
                                  </View>
                                )}
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.productTitle} numberOfLines={2}>{item.product.title}</Text>
                                  <Text style={styles.productIdText}>Product ID: {item.product.id}</Text>
                                  {item.product.selectedSize && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                      <Tag size={12} color="#64748B" />
                                      <Text style={styles.sizeText}>Size: {item.product.selectedSize}</Text>
                                    </View>
                                  )}
                                </View>
                              </View>

                              {/* Qty & Price */}
                              <View style={[styles.td, { flex: 1 }]}>
                                <Text style={styles.qtyText}>Qty: {item.quantity}</Text>
                                <Text style={styles.priceText}>₹{item.product.price * item.quantity}</Text>
                              </View>

                              {/* Status */}
                              <View style={[styles.td, { flex: 1 }]}>
                                <View style={[styles.statusBadge, order.status === 'delivered' ? styles.statusDelivered : order.status === 'cancelled' || order.status === 'rto' ? styles.statusCancelled : styles.statusPending]}>
                                  <Text style={[styles.statusText, order.status === 'delivered' ? styles.statusTextDelivered : order.status === 'cancelled' || order.status === 'rto' ? styles.statusTextCancelled : styles.statusTextPending]}>
                                    {order.status.toUpperCase().replace('_', ' ')}
                                  </Text>
                                </View>
                              </View>

                              {/* Customer Info */}
                              <View style={[styles.td, { flex: 1.5 }]}>
                                <Text style={styles.customerName}>{order.buyerName}</Text>
                                <Text style={styles.subtext}>{order.deliveryAddress.split(',').slice(-2).join(',')}</Text>
                              </View>
                            </View>
                          ));
                        })}
                      </>
                    )}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Tracking Modal */}
      {selectedTrackingOrder && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.trackingModalOverlay}>
            <View style={styles.trackingModalContainer}>
              <OrderTrackingScreen
                order={selectedTrackingOrder}
                onBack={() => setSelectedTrackingOrder(null)}
              />
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 1000,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  sellerDetailsText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  extendedDetailsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 24,
  },
  detailColumn: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  detailSubValue: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  activeTab: {
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#4F46E5',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  td: {
    justifyContent: 'center',
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  productIdText: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  productCategory: {
    fontSize: 11,
    color: '#64748B',
  },
  stockText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  lowStockText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: '#ECFDF5',
  },
  badgeGray: {
    backgroundColor: '#F1F5F9',
  },
  badgeTextGreen: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
  badgeTextGray: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  originalPriceText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  customerPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  settlementPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4338CA',
  },
  subtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  awbText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4F46E5',
    marginTop: 4,
  },
  sizeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  qtyText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusDelivered: {
    backgroundColor: '#ECFDF5',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextPending: {
    color: '#B45309',
  },
  statusTextDelivered: {
    color: '#059669',
  },
  statusTextCancelled: {
    color: '#DC2626',
  },
  trackingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  trackingModalContainer: {
    width: '100%',
    maxWidth: 600,
    height: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
});
