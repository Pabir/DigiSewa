import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Search, Package, MapPin, CreditCard, Truck, User, Calendar, CircleCheck, Clock, CircleX, AlertCircle, MessageSquare } from 'lucide-react-native';
import { Order, OrderTrackingEvent } from '../../types';
import { SupportTicket } from '../../types/adminTypes';

interface AdminOrderTrackingScreenProps {
}

import { fetchOrderByIdOrAwb } from '../../services/firebaseService';

export const AdminOrderTrackingScreen: React.FC<AdminOrderTrackingScreenProps> = ({}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter an Order ID or AWB number.');
      setSearchedOrder(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchedOrder(null);

    const foundOrder = await fetchOrderByIdOrAwb(searchQuery);

    if (foundOrder) {
      setSearchedOrder(foundOrder);
    } else {
      setSearchError('No order found with the provided ID or AWB number.');
    }
    setIsSearching(false);
  };

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CircleCheck size={20} color="#10B981" />;
      case 'cancelled':
      case 'rto_delivered_to_seller':
        return <CircleX size={20} color="#EF4444" />;
      case 'pending':
      case 'processing':
        return <Clock size={20} color="#F59E0B" />;
      default:
        return <Truck size={20} color="#3B82F6" />;
    }
  };

  const getTimelineColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#10B981';
      case 'cancelled':
      case 'rto_delivered_to_seller':
        return '#EF4444';
      default:
        return '#3B82F6';
    }
  };

  const getStepProgress = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'ready_to_ship': return 1;
      case 'unshipped': return 1;
      case 'shipped': return 2;
      case 'reached_hub': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#EF4444';
      case 'in_progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'closed': return '#64748B';
      default: return '#94A3B8';
    }
  };

  const DELIVERY_STEPS = [
    { label: 'Placed' },
    { label: 'Processing' },
    { label: 'Shipped' },
    { label: 'Out for Delivery' },
    { label: 'Delivered' }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Global Order Tracking</Text>
        <Text style={styles.subtitle}>Track complete history using Order ID or AWB Number</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter Order ID or AWB Number..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <CircleX size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={isSearching}>
          {isSearching ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.searchButtonText}>Search</Text>}
        </TouchableOpacity>
      </View>

      {/* Error State */}
      {searchError && (
        <View style={styles.errorContainer}>
          <AlertCircle size={24} color="#EF4444" />
          <Text style={styles.errorText}>{searchError}</Text>
        </View>
      )}

      {searchedOrder && (() => {
        const tickets: SupportTicket[] = []; // Default to empty array for now since tickets are not fetched
        const relatedTickets = tickets.filter(t => t.orderId === searchedOrder.id);
        
        const fStatus = searchedOrder.fulfillmentStatus || (searchedOrder as any).status;
        const dStatus = searchedOrder.deliveryStatus || ((searchedOrder as any).status === 'shipped' ? 'shipped' : (searchedOrder as any).status === 'delivered' ? 'delivered' : undefined);
        const displayStatus = fStatus === 'cancelled' ? 'CANCELLED' : 
                              dStatus === 'delivered' ? 'DELIVERED' : 
                              (dStatus === 'rto_in_transit' || dStatus === 'rto_delivered_to_seller') ? 'RTO' :
                              (dStatus && dStatus !== 'unshipped') ? dStatus.toUpperCase() :
                              fStatus ? fStatus.toUpperCase() : 'PENDING';
        
        return (
        <View style={styles.detailsContainer}>
          
          {/* Top Banner - Status Overview */}
          <View style={styles.statusBanner}>
            <View>
              <Text style={styles.bannerLabel}>ORDER ID</Text>
              <Text style={styles.bannerValue}>{searchedOrder.id}</Text>
            </View>
            <View style={styles.badgeContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getTimelineColor(displayStatus.toLowerCase()) }]}>
                <Text style={styles.statusBadgeText}>{displayStatus.replace(/_/g, ' ')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.gridContainer}>
            {/* Left Column: Customer & Financial */}
            <View style={styles.gridCol}>
              {/* Customer Details Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <User size={18} color="#475569" />
                  <Text style={styles.cardTitle}>Customer Details</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{searchedOrder.buyerName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{searchedOrder.buyerPhone || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Address:</Text>
                    <Text style={[styles.infoValue, { flex: 1 }]} numberOfLines={3}>
                      {searchedOrder.deliveryAddress}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Financial Details Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <CreditCard size={18} color="#475569" />
                  <Text style={styles.cardTitle}>Financial Summary</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Amount:</Text>
                    <Text style={styles.infoValueHighlight}>₹{(searchedOrder.totalAmount || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Shipping Fee:</Text>
                    <Text style={styles.infoValue}>₹{searchedOrder.shippingFee || 0}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Payment Mode:</Text>
                    <Text style={styles.infoValue}>{searchedOrder.paymentMode?.toUpperCase() || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Payment Status:</Text>
                    <View style={styles.pillBadge}>
                      <Text style={styles.pillBadgeText}>{searchedOrder.paymentStatus?.toUpperCase() || 'PENDING'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Courier Details Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Package size={18} color="#475569" />
                  <Text style={styles.cardTitle}>Courier Details</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Partner:</Text>
                    <Text style={styles.infoValue}>{searchedOrder.courierPartner?.toUpperCase() || 'Not Assigned'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>AWB Number:</Text>
                    <Text style={styles.infoValueHighlight}>{searchedOrder.awbCode || searchedOrder.shadowfaxAwb || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Est. Delivery:</Text>
                    <Text style={styles.infoValue}>{searchedOrder.estimatedDelivery ? new Date(searchedOrder.estimatedDelivery).toLocaleDateString() : 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right Column: Timeline & Products */}
            <View style={styles.gridCol}>
              
              {/* Product Details Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Package size={18} color="#475569" />
                  <Text style={styles.cardTitle}>Product Details</Text>
                </View>
                <View style={styles.cardBody}>
                  {searchedOrder.items.map((item, index) => (
                    <View key={index} style={styles.productItem}>
                      <Image source={{ uri: item.product.imageUrl }} style={styles.productImage} />
                      <View style={styles.productInfo}>
                        <Text style={styles.productTitle} numberOfLines={2}>{item.product.title}</Text>
                        <Text style={styles.productMeta}>Qty: {item.quantity} | Seller: {item.product.sellerName}</Text>
                        <Text style={styles.productMeta}>
                          {item.product.selectedSize ? `Size: ${item.product.selectedSize} ` : ''}
                          {item.product.color ? `| Color: ${item.product.color}` : ''}
                        </Text>
                        <Text style={styles.productPrice}>₹{(item.product.price * item.quantity).toFixed(2)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Tracking Timeline Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MapPin size={18} color="#475569" />
                  <Text style={styles.cardTitle}>Tracking History & Delivery Graph</Text>
                </View>
                <View style={styles.cardBody}>
                  
                  {/* Graphical Delivery Stepper */}
                  <View style={styles.stepperContainer}>
                    {DELIVERY_STEPS.map((step, index) => {
                      const currentProgress = getStepProgress((dStatus === 'unshipped' || !dStatus) ? (fStatus || 'pending') : dStatus);
                      const isCompleted = index <= currentProgress;
                      const isLast = index === DELIVERY_STEPS.length - 1;
                      
                      return (
                        <View key={index} style={styles.stepWrapper}>
                          <View style={styles.stepVisuals}>
                            <View style={[styles.stepDot, isCompleted ? styles.stepDotActive : styles.stepDotInactive]} />
                            {!isLast && (
                              <View style={[styles.stepLine, isCompleted && index < currentProgress ? styles.stepLineActive : styles.stepLineInactive]} />
                            )}
                          </View>
                          <Text style={[styles.stepLabel, isCompleted ? styles.stepLabelActive : styles.stepLabelInactive]}>
                            {step.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  
                  <View style={styles.divider} />

                  {searchedOrder.trackingHistory && searchedOrder.trackingHistory.length > 0 ? (
                    <View style={styles.timelineContainer}>
                      {searchedOrder.trackingHistory.map((event, index) => (
                        <View key={index} style={styles.timelineRow}>
                          <View style={styles.timelineVisual}>
                            <View style={[styles.timelineDot, { backgroundColor: getTimelineColor(event.status) }]} />
                            {index < (searchedOrder.trackingHistory?.length || 0) - 1 && (
                              <View style={[styles.timelineLine, { backgroundColor: getTimelineColor(event.status) }]} />
                            )}
                          </View>
                          <View style={styles.timelineContent}>
                            <Text style={styles.timelineStatus}>{event.status.toUpperCase().replace(/_/g, ' ')}</Text>
                            <Text style={styles.timelineDesc}>{event.message || 'No additional details'}</Text>
                            <View style={styles.timelineMeta}>
                              <Calendar size={12} color="#94A3B8" />
                              <Text style={styles.timelineDate}>{new Date(event.timestamp).toLocaleString()}</Text>
                              {event.location && (
                                <>
                                  <Text style={styles.timelineDotSep}>•</Text>
                                  <MapPin size={12} color="#94A3B8" />
                                  <Text style={styles.timelineLocation}>{event.location}</Text>
                                </>
                              )}
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>Detailed tracking log is not available yet.</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Associated Support Tickets Card */}
              {relatedTickets.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <MessageSquare size={18} color="#475569" />
                    <Text style={styles.cardTitle}>Associated Support Tickets</Text>
                  </View>
                  <View style={styles.cardBody}>
                    {relatedTickets.map((ticket, index) => (
                      <View key={ticket.id} style={[styles.ticketItem, index < relatedTickets.length - 1 && styles.ticketItemBorder]}>
                        <View style={styles.ticketHeaderRow}>
                          <Text style={styles.ticketId}>#{ticket.ticketNumber}</Text>
                          <View style={[styles.ticketStatusBadge, { backgroundColor: getTicketStatusColor(ticket.status) }]}>
                            <Text style={styles.ticketStatusText}>{ticket.status.toUpperCase().replace(/_/g, ' ')}</Text>
                          </View>
                        </View>
                        <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                        <Text style={styles.ticketDesc} numberOfLines={2}>{ticket.description}</Text>
                        <View style={styles.ticketMetaRow}>
                          <View style={styles.ticketMetaItem}>
                            <User size={12} color="#64748B" />
                            <Text style={styles.ticketMetaText}>{ticket.userName}</Text>
                          </View>
                          <View style={styles.ticketMetaItem}>
                            <Calendar size={12} color="#64748B" />
                            <Text style={styles.ticketMetaText}>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
        );
      })()}
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
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  searchSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    maxWidth: 600,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#0F172A',
  },
  searchButton: {
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderRadius: 8,
    height: 48,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorText: {
    marginLeft: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  detailsContainer: {
    gap: 20,
  },
  statusBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bannerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  bannerValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  gridCol: {
    flex: 1,
    minWidth: 300,
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    width: 120,
  },
  infoValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
    textAlign: 'right',
  },
  infoValueHighlight: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800',
  },
  pillBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  productMeta: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineContainer: {
    paddingVertical: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineVisual: {
    alignItems: 'center',
    width: 24,
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: -4,
    marginBottom: -24,
    zIndex: 1,
    opacity: 0.3,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  timelineDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4,
  },
  timelineDotSep: {
    fontSize: 11,
    color: '#94A3B8',
    marginHorizontal: 6,
  },
  timelineLocation: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  stepVisuals: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 2,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  stepDotActive: {
    backgroundColor: '#3B82F6',
  },
  stepDotInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepLine: {
    height: 2,
    position: 'absolute',
    left: '50%',
    width: '100%',
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: '#3B82F6',
  },
  stepLineInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepLabel: {
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
  },
  stepLabelActive: {
    fontWeight: '700',
    color: '#1E293B',
  },
  stepLabelInactive: {
    fontWeight: '500',
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  ticketItem: {
    paddingVertical: 12,
  },
  ticketItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },
  ticketStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ticketStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  ticketDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ticketMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
});
