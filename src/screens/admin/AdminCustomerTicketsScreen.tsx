import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { SupportTicket, TicketStatus, AdminCustomer, TicketPriority } from '../../types/adminTypes';
import { Order, OrderTrackingEvent, OrderStatus } from '../../types';
import { Search, ArrowRight, CheckCircle2, IndianRupee, Truck, AlertTriangle, Package, MapPin, Clock, Plus, X } from 'lucide-react-native';
import { createShiprocketReturnOrder, shiprocketLogin } from '../../services/shiprocketService';
import { chargeRTOPenalty } from '../../services/settlementService';
import { createSupportTicketInFirestore } from '../../services/firebaseService';

interface AdminCustomerTicketsScreenProps {
  tickets: SupportTicket[];
  customers?: AdminCustomer[];
  orders?: Order[];
  onReplyTicket: (ticketId: string, replyMessage: string, newStatus?: TicketStatus) => void;
  onCreateTicket?: (ticket: SupportTicket) => void;
  onProcessInstantRefund?: (ticketId: string, customerId: string, amount: number) => void;
}

export const AdminCustomerTicketsScreen: React.FC<AdminCustomerTicketsScreenProps> = ({
  tickets,
  customers = [],
  orders = [],
  onReplyTicket,
  onCreateTicket,
  onProcessInstantRefund,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<string>('');
  const [isGeneratingReturn, setIsGeneratingReturn] = useState<boolean>(false);
  const [isChargingPenalty, setIsChargingPenalty] = useState<boolean>(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // New Ticket State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTicketCustomerSearch, setNewTicketCustomerSearch] = useState('');
  const [newTicketSelectedCustomer, setNewTicketSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [newTicketOrderSearch, setNewTicketOrderSearch] = useState('');
  const [newTicketOrderStartDate, setNewTicketOrderStartDate] = useState('');
  const [newTicketOrderEndDate, setNewTicketOrderEndDate] = useState('');
  const [newTicketOrder, setNewTicketOrder] = useState<Order | null>(null);
  const [newTicketCategory, setNewTicketCategory] = useState('Order & Delivery Issue');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<TicketPriority>('medium');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Handlers for New Ticket
  const resetCreateTicketForm = () => {
    setNewTicketCustomerSearch('');
    setNewTicketSelectedCustomer(null);
    setNewTicketOrderSearch('');
    setNewTicketOrderStartDate('');
    setNewTicketOrderEndDate('');
    setNewTicketOrder(null);
    setNewTicketCategory('Order & Delivery Issue');
    setNewTicketSubject('');
    setNewTicketDesc('');
    setNewTicketPriority('medium');
  };

  const handleCreateTicketSubmit = async () => {
    if (!newTicketSelectedCustomer) {
      Alert.alert('Error', 'Please select a customer first.');
      return;
    }
    if (!newTicketSubject.trim() || !newTicketDesc.trim()) {
      Alert.alert('Error', 'Please enter a subject and description.');
      return;
    }
    
    setIsSubmittingTicket(true);
    try {
      const ticketNum = 'TCK-' + Math.floor(1000 + Math.random() * 9000);
      const newTicket: SupportTicket = {
        id: 'TCK-CUST-' + Math.floor(10000 + Math.random() * 90000),
        ticketNumber: ticketNum,
        ticketType: 'customer',
        userId: newTicketSelectedCustomer.id,
        userName: newTicketSelectedCustomer.name,
        userEmail: newTicketSelectedCustomer.email,
        userPhone: newTicketSelectedCustomer.phone,
        category: newTicketCategory,
        subject: newTicketSubject,
        description: newTicketDesc,
        orderId: newTicketOrder?.id,
        status: 'open',
        priority: newTicketPriority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [{
          id: 'msg-0',
          senderRole: 'admin',
          senderName: 'TafDeal Admin',
          message: `Ticket created by Admin on behalf of customer via phone call.\n\nDescription: ${newTicketDesc}`,
          timestamp: new Date().toISOString(),
        }],
      };
      
      await createSupportTicketInFirestore(newTicket);
      if (onCreateTicket) onCreateTicket(newTicket);
      
      setIsCreateModalOpen(false);
      resetCreateTicketForm();
      Alert.alert('Success', `Ticket ${ticketNum} created successfully!`);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create ticket. Please try again.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const top5Customers = newTicketCustomerSearch.trim()
    ? customers
        .filter(c => 
          c.name.toLowerCase().includes(newTicketCustomerSearch.toLowerCase()) || 
          c.phone.includes(newTicketCustomerSearch) ||
          c.email.toLowerCase().includes(newTicketCustomerSearch.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const customerOrders = newTicketSelectedCustomer
    ? orders.filter(o => o.buyerId === newTicketSelectedCustomer.id)
    : [];

  const filteredCustomerOrders = customerOrders.filter(o => {
    let matchesSearch = true;
    if (newTicketOrderSearch.trim()) {
      matchesSearch = o.id.toLowerCase().includes(newTicketOrderSearch.toLowerCase());
    }
    
    let matchesDate = true;
    const orderDate = new Date(o.createdAt);
    if (newTicketOrderStartDate) {
      if (orderDate < new Date(newTicketOrderStartDate)) matchesDate = false;
    }
    if (newTicketOrderEndDate) {
      const end = new Date(newTicketOrderEndDate);
      end.setDate(end.getDate() + 1); // include the whole end day
      if (orderDate >= end) matchesDate = false;
    }
    
    return matchesSearch && matchesDate;
  });

  const linkedOrder = selectedTicket?.orderId && orders ? orders.find(o => o.id === selectedTicket.orderId) : null;

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = selectedStatusFilter === 'all' || t.status === selectedStatusFilter;
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.orderId && t.orderId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return <Text style={styles.priorityHigh}>🔴 High</Text>;
      case 'medium':
        return <Text style={styles.priorityMed}>🟡 Medium</Text>;
      case 'low':
        return <Text style={styles.priorityLow}>🟢 Low</Text>;
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return <Text style={styles.statusOpen}>● Open</Text>;
      case 'in_progress':
        return <Text style={styles.statusProgress}>⚡ In Progress</Text>;
      case 'resolved':
      case 'closed':
        return <Text style={styles.statusResolved}>✓ Resolved</Text>;
    }
  };

  const generateTrackingHistory = (order: Order): OrderTrackingEvent[] => {
    if (order.trackingHistory && order.trackingHistory.length > 0) return [...order.trackingHistory].reverse();
    
    const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'reached_hub', 'out_for_delivery', 'delivered'];
    const currentStatusIndex = statuses.indexOf(order.status);
    
    if (currentStatusIndex === -1 && order.status !== 'cancelled') return [];
    
    const history: OrderTrackingEvent[] = [];
    const baseDate = new Date(order.createdAt);
    
    if (order.status === 'cancelled') {
        history.push({ status: 'pending', timestamp: new Date(baseDate).toISOString(), message: 'Order Placed' });
        history.push({ status: 'cancelled', timestamp: new Date(baseDate.getTime() + 86400000).toISOString(), message: 'Order Cancelled' });
        return history.reverse();
    }

    for (let i = 0; i <= currentStatusIndex; i++) {
        const status = statuses[i];
        let message = '';
        let location = undefined;
        let timeOffset = i * 43200000; // 12 hours
        
        switch (status) {
            case 'pending': message = 'Order Placed'; break;
            case 'processing': message = 'Seller processing order'; break;
            case 'shipped': message = 'Order Shipped'; location = 'Origin Hub'; break;
            case 'reached_hub': message = 'Reached Delivery Hub'; location = 'Destination Hub'; break;
            case 'out_for_delivery': message = 'Out for Delivery'; break;
            case 'delivered': message = 'Order Delivered'; break;
        }
        
        history.push({
            status,
            message,
            location,
            timestamp: new Date(baseDate.getTime() + timeOffset).toISOString(),
        });
    }
    
    return history.reverse();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.screenTitle}>Customer Support Ticket Desk</Text>
            <Text style={styles.screenSub}>
              Resolve buyer inquiries, damaged item disputes, and process instant wallet refunds.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.createTicketBtn}
            onPress={() => {
              resetCreateTicketForm();
              setIsCreateModalOpen(true);
            }}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.createTicketBtnText}>Create Ticket</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Status Filters & Search */}
        <View style={styles.filterControlsRow}>
          <View style={styles.pillsRow}>
            {[
              { key: 'all', label: `All Customer Tickets (${tickets.length})` },
              { key: 'open', label: `Open (${tickets.filter((t) => t.status === 'open').length})` },
              { key: 'in_progress', label: `In Progress (${tickets.filter((t) => t.status === 'in_progress').length})` },
              { key: 'resolved', label: `Resolved (${tickets.filter((t) => t.status === 'resolved').length})` },
            ].map((pill) => (
              <TouchableOpacity
                key={pill.key}
                style={[
                  styles.filterPill,
                  selectedStatusFilter === pill.key && styles.filterPillActive,
                ]}
                onPress={() => setSelectedStatusFilter(pill.key as any)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedStatusFilter === pill.key && styles.filterPillTextActive,
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search */}
          <View style={styles.searchBar}>
            <Search size={16} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Ticket #, Customer Name, Order ID"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Tickets Table */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: 720 }}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.2 }]}>Ticket #</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Customer Profile</Text>
                <Text style={[styles.th, { flex: 2 }]}>Issue Subject & Order ID</Text>
                <Text style={[styles.th, { flex: 1 }]}>Priority</Text>
                <Text style={[styles.th, { flex: 1 }]}>Status</Text>
                <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Actions</Text>
              </View>

              {filteredTickets.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No customer tickets found matching criteria.</Text>
                </View>
              ) : (
                filteredTickets.map((t) => (
                  <View key={t.id} style={styles.tableRow}>
                    {/* Ticket ID */}
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.ticketNumText}>{t.ticketNumber}</Text>
                      <Text style={styles.subText}>{t.createdAt}</Text>
                    </View>

                    {/* Customer */}
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.boldText}>{t.userName}</Text>
                      <Text style={styles.subText}>{t.userEmail}</Text>
                    </View>

                    {/* Subject & Order ID */}
                    <View style={{ flex: 2 }}>
                      <Text style={styles.subjectText}>{t.subject}</Text>
                      {t.orderId && <Text style={styles.orderIdBadge}>Order: {t.orderId}</Text>}
                    </View>

                    {/* Priority */}
                    <View style={{ flex: 1 }}>{getPriorityBadge(t.priority)}</View>

                    {/* Status */}
                    <View style={{ flex: 1 }}>{getStatusBadge(t.status)}</View>

                    {/* Action */}
                    <View style={{ flex: 1.2, flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <TouchableOpacity
                        style={styles.replyBtn}
                        onPress={() => setSelectedTicket(t)}
                      >
                        <Text style={styles.replyBtnText}>Respond & Refund</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Ticket Response Drawer Modal */}
      {selectedTicket && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    Ticket {selectedTicket.ticketNumber} - {selectedTicket.subject}
                  </Text>
                  <Text style={styles.modalSub}>
                    Customer: {selectedTicket.userName} ({selectedTicket.userEmail})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Chat Thread */}
              <ScrollView style={styles.threadScroll}>
                <View style={styles.originalDescBox}>
                  <Text style={styles.descTitle}>Issue Description:</Text>
                  <Text style={styles.descBody}>{selectedTicket.description}</Text>
                  {selectedTicket.orderId && (
                    <Text style={styles.orderTagInDesc}>Order ID: {selectedTicket.orderId}</Text>
                  )}
                  {selectedTicket.attachmentUrls && selectedTicket.attachmentUrls.length > 0 && (
                    <View style={styles.attachmentGallery}>
                      <Text style={styles.attachmentTitle}>Customer Uploaded Proof:</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        {selectedTicket.attachmentUrls.map((url, idx) => (
                          <TouchableOpacity key={idx} onPress={() => setViewingImage(url)}>
                            <Image source={{ uri: url }} style={styles.attachmentThumb} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* --- ORDER SNAPSHOT CARD --- */}
                {linkedOrder && (
                  <View style={styles.orderSnapshotCard}>
                    <View style={styles.snapshotHeader}>
                      <Text style={styles.snapshotTitle}>Order Snapshot</Text>
                      <Text style={styles.snapshotStatus}>{linkedOrder.status.toUpperCase()}</Text>
                    </View>
                    <View style={styles.snapshotRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.snapshotLabel}>Total Amount</Text>
                        <Text style={styles.snapshotValue}>₹{linkedOrder.totalAmount}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.snapshotLabel}>Payment</Text>
                        <Text style={styles.snapshotValue}>{linkedOrder.paymentMode.toUpperCase()} ({linkedOrder.paymentStatus})</Text>
                        {linkedOrder.razorpayPaymentId && (
                          <Text style={styles.snapshotSubValue}>
                            ID: {linkedOrder.razorpayPaymentId}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.snapshotLabel}>Date</Text>
                        <Text style={styles.snapshotValue}>{linkedOrder.createdAt}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.snapshotSectionTitle}>Items Ordered:</Text>
                    {linkedOrder.items.map((item, idx) => (
                      <View key={idx} style={styles.snapshotItemRowEnhanced}>
                        {item.product.imageUrl ? (
                          <Image source={{ uri: item.product.imageUrl }} style={styles.snapshotItemImage} />
                        ) : (
                          <View style={styles.snapshotItemImagePlaceholder}>
                            <Package size={16} color="#94A3B8" />
                          </View>
                        )}
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={styles.snapshotItemNameEnhanced} numberOfLines={2}>
                            {item.quantity}x {item.product.title} {item.product.selectedSize ? `(Size: ${item.product.selectedSize})` : ''}
                          </Text>
                          <Text style={styles.snapshotItemSeller}>
                            Seller: {item.product.sellerName || 'TafDeal Fulfillment'}
                          </Text>
                          <Text style={styles.snapshotItemSku}>
                            ID: {item.product.sku || item.product.catalogId || item.product.id}
                          </Text>
                        </View>
                        <Text style={styles.snapshotItemPrice}>₹{item.product.price * item.quantity}</Text>
                      </View>
                    ))}

                    {/* Order Tracking Timeline */}
                    <View style={styles.trackingContainer}>
                      <Text style={styles.snapshotSectionTitle}>Order Lifecycle Tracking:</Text>
                      <View style={styles.timelineWrapper}>
                        {generateTrackingHistory(linkedOrder).map((event, idx, arr) => {
                          const isLatest = idx === 0;
                          return (
                            <View key={idx} style={styles.timelineEventRow}>
                              <View style={styles.timelineIconCol}>
                                <View style={[styles.timelineDot, isLatest ? styles.timelineDotActive : styles.timelineDotInactive]}>
                                  {event.status === 'delivered' ? <CheckCircle2 size={12} color={isLatest ? '#FFFFFF' : '#94A3B8'} /> : <Clock size={12} color={isLatest ? '#FFFFFF' : '#94A3B8'} />}
                                </View>
                                {idx !== arr.length - 1 && <View style={styles.timelineLine} />}
                              </View>
                              <View style={styles.timelineContentCol}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Text style={[styles.timelineStatusText, isLatest && styles.timelineStatusTextActive]}>
                                    {event.status.toUpperCase().replace('_', ' ')}
                                  </Text>
                                  <Text style={styles.timelineTimeText}>
                                    {new Date(event.timestamp).toLocaleString()}
                                  </Text>
                                </View>
                                {event.message && <Text style={styles.timelineMessageText}>{event.message}</Text>}
                                {event.location && (
                                  <View style={styles.timelineLocationRow}>
                                    <MapPin size={10} color="#64748B" />
                                    <Text style={styles.timelineLocationText}>{event.location}</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                )}

                <Text style={styles.threadHeading}>Customer Chat Thread</Text>
                {selectedTicket.messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.msgBubble,
                      msg.senderRole === 'admin' ? styles.msgBubbleAdmin : styles.msgBubbleUser,
                    ]}
                  >
                    <View style={styles.msgHeader}>
                      <Text style={styles.msgSenderName}>{msg.senderName}</Text>
                      <Text style={styles.msgTime}>{msg.timestamp}</Text>
                    </View>
                    <Text style={styles.msgBody}>{msg.message}</Text>
                    {msg.attachmentUrl && (
                      <TouchableOpacity style={{ marginTop: 8 }} onPress={() => setViewingImage(msg.attachmentUrl!)}>
                         <Image source={{ uri: msg.attachmentUrl }} style={styles.msgAttachmentThumb} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>

              {/* Instant Refund & Resolution Controls */}
              <View style={styles.replyBoxContainer}>
                <TextInput
                  style={styles.replyInput}
                  multiline
                  numberOfLines={2}
                  placeholder="Type response to customer..."
                  value={adminReplyText}
                  onChangeText={setAdminReplyText}
                />

                <View style={styles.replyActionsRow}>
                  {linkedOrder && (
                    <>
                      <TouchableOpacity
                        style={styles.chargePenaltyBtn}
                        disabled={isChargingPenalty}
                        onPress={async () => {
                          try {
                            setIsChargingPenalty(true);
                            await chargeRTOPenalty(linkedOrder);
                            
                            onReplyTicket(
                              selectedTicket.id,
                              `[Admin Action] Seller charged RTO Penalty for order ${linkedOrder.id}.`,
                              'in_progress'
                            );
                            alert(`RTO Penalty successfully deducted from seller's settlement ledger.`);
                          } catch (e: any) {
                            alert(`Failed to charge penalty: ${e.message}`);
                          } finally {
                            setIsChargingPenalty(false);
                          }
                        }}
                      >
                        <AlertTriangle size={14} color="#FFFFFF" />
                        <Text style={styles.chargePenaltyBtnText}>
                          {isChargingPenalty ? 'Charging...' : 'Charge Seller RTO'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.returnPickupBtn}
                        disabled={isGeneratingReturn}
                        onPress={async () => {
                          try {
                            setIsGeneratingReturn(true);
                            const token = await shiprocketLogin();
                            const result = await createShiprocketReturnOrder(linkedOrder, token);
                            
                            onReplyTicket(
                              selectedTicket.id,
                              `Return pickup generated successfully. AWB: ${result.return_awb_code || 'Pending'}`,
                              'in_progress'
                            );
                            alert(`Return AWB ${result.return_awb_code || ''} Generated! Delivery partner will pick up soon.`);
                          } catch (e: any) {
                            alert(`Failed to generate return: ${e.message}`);
                          } finally {
                            setIsGeneratingReturn(false);
                          }
                        }}
                      >
                        <Truck size={14} color="#FFFFFF" />
                        <Text style={styles.returnPickupBtnText}>
                          {isGeneratingReturn ? 'Generating...' : 'Generate Return Pickup'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.instantRefundBtn}
                    onPress={() => {
                      const amountToRefund = linkedOrder ? linkedOrder.totalAmount : 499;
                      
                      Alert.alert(
                        "Confirm Post-QC Refund",
                        `Has the returned item passed Quality Check? This will issue a refund of ₹${amountToRefund} to the customer's wallet.`,
                        [
                          { text: "Cancel", style: "cancel" },
                          { 
                            text: "Yes, Issue Refund", 
                            style: "destructive",
                            onPress: () => {
                              if (onProcessInstantRefund) {
                                onProcessInstantRefund(selectedTicket.id, selectedTicket.userId, amountToRefund);
                              }
                              onReplyTicket(
                                selectedTicket.id,
                                `Wallet refund of ₹${amountToRefund} has been processed to your TafDeal wallet after successful Quality Check.`,
                                'resolved'
                              );
                              setSelectedTicket(null);
                              alert(`Wallet Refund of ₹${amountToRefund} processed and ticket resolved!`);
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <IndianRupee size={14} color="#FFFFFF" />
                    <Text style={styles.instantRefundBtnText}>
                      Issue {linkedOrder ? `₹${linkedOrder.totalAmount}` : 'Refund'} (Post-QC)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sendReplyBtn}
                    onPress={() => {
                      if (!adminReplyText.trim()) return;
                      onReplyTicket(selectedTicket.id, adminReplyText, 'in_progress');
                      setAdminReplyText('');
                      setSelectedTicket(null);
                      alert('Reply sent to customer!');
                    }}
                  >
                    <ArrowRight size={14} color="#FFFFFF" />
                    <Text style={styles.sendReplyBtnText}>Send Reply</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resolveTicketBtn}
                    onPress={() => {
                      onReplyTicket(
                        selectedTicket.id,
                        adminReplyText || 'Issue investigated and resolved by customer support.',
                        'resolved'
                      );
                      setAdminReplyText('');
                      setSelectedTicket(null);
                      alert('Ticket marked as RESOLVED!');
                    }}
                  >
                    <CheckCircle2 size={14} color="#FFFFFF" />
                    <Text style={styles.resolveTicketBtnText}>Mark Resolved</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Create Ticket on Behalf of Customer</Text>
                  <Text style={styles.modalSub}>Log issues reported via phone or email</Text>
                </View>
                <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                {/* Search Customer */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Search Customer (Name, Phone, Email) *</Text>
                  {newTicketSelectedCustomer ? (
                    <View style={styles.selectedCustomerCard}>
                      <View>
                        <Text style={styles.selectedCustomerName}>{newTicketSelectedCustomer.name}</Text>
                        <Text style={styles.selectedCustomerDetails}>{newTicketSelectedCustomer.phone} • {newTicketSelectedCustomer.email}</Text>
                      </View>
                      <TouchableOpacity onPress={() => {
                        setNewTicketSelectedCustomer(null);
                        setNewTicketOrder(null);
                      }}>
                        <X size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Type to search customers..."
                        value={newTicketCustomerSearch}
                        onChangeText={setNewTicketCustomerSearch}
                      />
                      {newTicketCustomerSearch.trim().length > 0 && (
                        <View style={styles.searchResultsContainer}>
                          {top5Customers.length === 0 ? (
                            <Text style={styles.noResultsText}>No customers found</Text>
                          ) : (
                            top5Customers.map(c => (
                              <TouchableOpacity 
                                key={c.id} 
                                style={styles.searchResultItem}
                                onPress={() => setNewTicketSelectedCustomer(c)}
                              >
                                <Text style={styles.searchResultName}>{c.name}</Text>
                                <Text style={styles.searchResultDetails}>{c.phone} • {c.email}</Text>
                              </TouchableOpacity>
                            ))
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Optional Order Selection */}
                {newTicketSelectedCustomer && customerOrders.length > 0 && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Link Order (Optional)</Text>
                    
                    <TextInput
                      style={[styles.textInput, { marginBottom: 8 }]}
                      placeholder="Search by Order ID..."
                      value={newTicketOrderSearch}
                      onChangeText={setNewTicketOrderSearch}
                    />

                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { fontSize: 11, color: '#64748B' }]}>Start Date</Text>
                        <input 
                          type="date"
                          style={styles.webInput}
                          value={newTicketOrderStartDate}
                          onChange={(e) => setNewTicketOrderStartDate(e.target.value)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { fontSize: 11, color: '#64748B' }]}>End Date</Text>
                        <input 
                          type="date"
                          style={styles.webInput}
                          value={newTicketOrderEndDate}
                          onChange={(e) => setNewTicketOrderEndDate(e.target.value)}
                        />
                      </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                         style={[styles.orderSelectBtn, newTicketOrder === null && styles.orderSelectBtnActive]}
                         onPress={() => setNewTicketOrder(null)}
                      >
                         <Text style={[styles.orderSelectBtnText, newTicketOrder === null && styles.orderSelectBtnTextActive]}>No Order</Text>
                      </TouchableOpacity>
                      {filteredCustomerOrders.map(o => (
                        <TouchableOpacity
                          key={o.id}
                          style={[styles.orderSelectBtn, newTicketOrder?.id === o.id && styles.orderSelectBtnActive]}
                          onPress={() => setNewTicketOrder(o)}
                        >
                          <Text style={[styles.orderSelectBtnText, newTicketOrder?.id === o.id && styles.orderSelectBtnTextActive]}>
                            {o.id} (₹{o.totalAmount})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Order Details Preview */}
                    {newTicketOrder && (
                      <View style={[styles.orderSnapshotCard, { marginTop: 12 }]}>
                        <View style={styles.snapshotHeader}>
                          <Text style={styles.snapshotTitle}>Order Snapshot Preview</Text>
                          <Text style={styles.snapshotStatus}>{newTicketOrder.status.toUpperCase()}</Text>
                        </View>
                        <View style={styles.snapshotRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.snapshotLabel}>Total Amount</Text>
                            <Text style={styles.snapshotValue}>₹{newTicketOrder.totalAmount}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.snapshotLabel}>Payment</Text>
                            <Text style={styles.snapshotValue}>{newTicketOrder.paymentMode.toUpperCase()} ({newTicketOrder.paymentStatus})</Text>
                            {newTicketOrder.razorpayPaymentId && (
                              <Text style={styles.snapshotSubValue}>
                                ID: {newTicketOrder.razorpayPaymentId}
                              </Text>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.snapshotLabel}>Date</Text>
                            <Text style={styles.snapshotValue}>{newTicketOrder.createdAt}</Text>
                          </View>
                        </View>
                        
                        <Text style={styles.snapshotSectionTitle}>Items Ordered:</Text>
                        {newTicketOrder.items.map((item, idx) => (
                          <View key={idx} style={styles.snapshotItemRowEnhanced}>
                            {item.product.imageUrl ? (
                              <Image source={{ uri: item.product.imageUrl }} style={styles.snapshotItemImage} />
                            ) : (
                              <View style={styles.snapshotItemImagePlaceholder}>
                                <Package size={16} color="#94A3B8" />
                              </View>
                            )}
                            <View style={{ flex: 1, marginRight: 10 }}>
                              <Text style={styles.snapshotItemNameEnhanced} numberOfLines={2}>
                                {item.quantity}x {item.product.title} {item.product.selectedSize ? `(Size: ${item.product.selectedSize})` : ''}
                              </Text>
                              <Text style={styles.snapshotItemSeller}>
                                Seller: {item.product.sellerName || 'TafDeal Fulfillment'}
                              </Text>
                              <Text style={styles.snapshotItemSku}>
                                ID: {item.product.sku || item.product.catalogId || item.product.id}
                              </Text>
                            </View>
                            <Text style={styles.snapshotItemPrice}>₹{item.product.price * item.quantity}</Text>
                          </View>
                        ))}

                        {/* Order Tracking Timeline */}
                        <View style={styles.trackingContainer}>
                          <Text style={styles.snapshotSectionTitle}>Order Lifecycle Tracking:</Text>
                          <View style={styles.timelineWrapper}>
                            {generateTrackingHistory(newTicketOrder).map((event, idx, arr) => {
                              const isLatest = idx === 0;
                              return (
                                <View key={idx} style={styles.timelineEventRow}>
                                  <View style={styles.timelineIconCol}>
                                    <View style={[styles.timelineDot, isLatest ? styles.timelineDotActive : styles.timelineDotInactive]}>
                                      {event.status === 'delivered' ? <CheckCircle2 size={12} color={isLatest ? '#FFFFFF' : '#94A3B8'} /> : <Clock size={12} color={isLatest ? '#FFFFFF' : '#94A3B8'} />}
                                    </View>
                                    {idx !== arr.length - 1 && <View style={styles.timelineLine} />}
                                  </View>
                                  <View style={styles.timelineContentCol}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <Text style={[styles.timelineStatusText, isLatest && styles.timelineStatusTextActive]}>
                                        {event.status.toUpperCase().replace('_', ' ')}
                                      </Text>
                                      <Text style={styles.timelineTimeText}>
                                        {new Date(event.timestamp).toLocaleString()}
                                      </Text>
                                    </View>
                                    {event.message && <Text style={styles.timelineMessageText}>{event.message}</Text>}
                                    {event.location && (
                                      <View style={styles.timelineLocationRow}>
                                        <MapPin size={10} color="#64748B" />
                                        <Text style={styles.timelineLocationText}>{event.location}</Text>
                                      </View>
                                    )}
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Category & Priority */}
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Category</Text>
                    <View style={styles.pickerContainer}>
                      <select 
                        style={styles.webSelect}
                        value={newTicketCategory}
                        onChange={(e) => setNewTicketCategory(e.target.value)}
                      >
                        <option value="Order & Delivery Issue">Order & Delivery</option>
                        <option value="Payment & Refunds">Payment & Refunds</option>
                        <option value="Product Quality">Product Quality</option>
                        <option value="General Query">General Query</option>
                      </select>
                    </View>
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Priority</Text>
                    <View style={styles.pickerContainer}>
                      <select 
                        style={styles.webSelect}
                        value={newTicketPriority}
                        onChange={(e) => setNewTicketPriority(e.target.value as TicketPriority)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </View>
                  </View>
                </View>

                {/* Subject */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Subject *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Received wrong item size"
                    value={newTicketSubject}
                    onChangeText={setNewTicketSubject}
                  />
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description (Call Notes) *</Text>
                  <TextInput
                    style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
                    placeholder="Details about the customer's issue..."
                    multiline
                    numberOfLines={4}
                    value={newTicketDesc}
                    onChangeText={setNewTicketDesc}
                  />
                </View>

              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => setIsCreateModalOpen(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.submitBtn, (!newTicketSelectedCustomer || !newTicketSubject.trim() || !newTicketDesc.trim() || isSubmittingTicket) && { opacity: 0.5 }]}
                  disabled={!newTicketSelectedCustomer || !newTicketSubject.trim() || !newTicketDesc.trim() || isSubmittingTicket}
                  onPress={handleCreateTicketSubmit}
                >
                  <Text style={styles.submitBtnText}>{isSubmittingTicket ? 'Creating...' : 'Create Ticket'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <Modal transparent animationType="fade" visible={true}>
          <View style={styles.imageViewerOverlay}>
             <TouchableOpacity style={styles.imageViewerCloseBtn} onPress={() => setViewingImage(null)}>
                <Text style={styles.closeBtnTextWhite}>✕</Text>
             </TouchableOpacity>
             <Image source={{ uri: viewingImage }} style={styles.fullSizeImage} resizeMode="contain" />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  screenSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  filterPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#4338CA',
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    flex: 1,
    minWidth: 220,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  th: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ticketNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB',
  },
  boldText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  subText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderIdBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  priorityHigh: { fontSize: 11, fontWeight: '800', color: '#DC2626' },
  priorityMed: { fontSize: 11, fontWeight: '800', color: '#D97706' },
  priorityLow: { fontSize: 11, fontWeight: '800', color: '#059669' },
  statusOpen: { fontSize: 11, fontWeight: '800', color: '#DC2626' },
  statusProgress: { fontSize: 11, fontWeight: '800', color: '#D97706' },
  statusResolved: { fontSize: 11, fontWeight: '800', color: '#059669' },
  replyBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  replyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748B',
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64748B',
  },
  threadScroll: {
    maxHeight: 240,
    marginBottom: 12,
  },
  originalDescBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  descTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  descBody: {
    fontSize: 12,
    color: '#0F172A',
    lineHeight: 17,
  },
  orderTagInDesc: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
    marginTop: 4,
  },
  orderSnapshotCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  snapshotTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  snapshotStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  snapshotLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  snapshotValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  snapshotSubValue: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  snapshotSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  snapshotItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  snapshotItemName: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
    marginRight: 10,
  },
  snapshotItemPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  threadHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
  },
  msgBubble: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '85%',
  },
  msgBubbleUser: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
  },
  msgBubbleAdmin: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 12,
  },
  msgSenderName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4338CA',
  },
  msgTime: {
    fontSize: 9,
    color: '#94A3B8',
  },
  msgBody: {
    fontSize: 12,
    color: '#0F172A',
    lineHeight: 16,
  },
  replyBoxContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  replyInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 10,
  },
  replyActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
  },
  returnPickupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  returnPickupBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  chargePenaltyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#991B1B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  chargePenaltyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  instantRefundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  instantRefundBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sendReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4338CA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sendReplyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  resolveTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resolveTicketBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  attachmentGallery: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  attachmentTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  attachmentThumb: {
    width: 60,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  msgAttachmentThumb: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  closeBtnTextWhite: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  fullSizeImage: {
    width: '90%',
    height: '90%',
  },
  createTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  createTicketBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  pickerContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  webSelect: {
    width: '100%',
    padding: 10,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: 13,
    color: '#0F172A',
    outline: 'none',
  },
  webInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
  },
  searchResultsContainer: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchResultName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchResultDetails: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  noResultsText: {
    padding: 16,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  selectedCustomerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    padding: 12,
  },
  selectedCustomerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338CA',
  },
  selectedCustomerDetails: {
    fontSize: 11,
    color: '#4F46E5',
    marginTop: 2,
  },
  orderSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderSelectBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  orderSelectBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  orderSelectBtnTextActive: {
    color: '#4338CA',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  snapshotItemRowEnhanced: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 8,
  },
  snapshotItemImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  snapshotItemImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  snapshotItemNameEnhanced: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 2,
  },
  snapshotItemSeller: {
    fontSize: 10,
    color: '#64748B',
  },
  snapshotItemSku: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  trackingContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  timelineWrapper: {
    paddingLeft: 4,
    marginTop: 8,
  },
  timelineEventRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineDotActive: {
    backgroundColor: '#4338CA',
  },
  timelineDotInactive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
    minHeight: 24,
  },
  timelineContentCol: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  timelineStatusTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  timelineTimeText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  timelineMessageText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  timelineLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timelineLocationText: {
    fontSize: 10,
    color: '#64748B',
  },
});
