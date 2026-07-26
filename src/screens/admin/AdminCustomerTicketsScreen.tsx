import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SupportTicket, TicketStatus } from '../../types/adminTypes';
import { Search, ArrowRight, CheckCircle2, IndianRupee } from 'lucide-react-native';

interface AdminCustomerTicketsScreenProps {
  tickets: SupportTicket[];
  onReplyTicket: (ticketId: string, replyMessage: string, newStatus?: TicketStatus) => void;
  onProcessInstantRefund?: (ticketId: string, customerId: string, amount: number) => void;
}

export const AdminCustomerTicketsScreen: React.FC<AdminCustomerTicketsScreenProps> = ({
  tickets,
  onReplyTicket,
  onProcessInstantRefund,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<string>('');

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.screenTitle}>Customer Support Ticket Desk</Text>
          <Text style={styles.screenSub}>
            Resolve buyer inquiries, damaged item disputes, and process instant wallet refunds.
          </Text>
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
                </View>

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
                  <TouchableOpacity
                    style={styles.instantRefundBtn}
                    onPress={() => {
                      if (onProcessInstantRefund) {
                        onProcessInstantRefund(selectedTicket.id, selectedTicket.userId, 499);
                      }
                      onReplyTicket(
                        selectedTicket.id,
                        'Instant wallet refund of ₹499 has been processed to your DigiSewa wallet.',
                        'resolved'
                      );
                      setSelectedTicket(null);
                      alert('Instant Wallet Refund of ₹499 processed and ticket resolved!');
                    }}
                  >
                    <IndianRupee size={14} color="#FFFFFF" />
                    <Text style={styles.instantRefundBtnText}>Issue ₹499 Wallet Refund</Text>
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
});
