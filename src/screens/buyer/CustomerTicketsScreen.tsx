import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AlertCircle, ArrowLeft, MessageSquare, PlusCircle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getSupportTicketsFromFirestore } from '../../services/firebaseService';
import { SupportTicket } from '../../types/adminTypes';

interface CustomerTicketsScreenProps {
  onBack?: () => void;
  onOpenNewTicket?: () => void;
}

export const CustomerTicketsScreen: React.FC<CustomerTicketsScreenProps> = ({ onBack, onOpenNewTicket }) => {
  const { user, isAuthenticated, openCustomerAuthModal } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchTickets();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const allTickets = await getSupportTicketsFromFirestore();
      const myTickets = allTickets.filter(t => t.userId === user?.id);
      
      // Sort by newest first
      myTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setTickets(myTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return { bg: '#FEF2F2', text: '#EF4444' };
      case 'in_progress': return { bg: '#FEF3C7', text: '#D97706' };
      case 'resolved': return { bg: '#DCFCE7', text: '#10B981' };
      case 'closed': return { bg: '#F1F5F9', text: '#64748B' };
      default: return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            {onBack && (
              <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
                <ArrowLeft size={22} color="#4F46E5" />
              </TouchableOpacity>
            )}
            <MessageSquare size={24} color="#4F46E5" />
            <Text style={styles.headerTitle}>My Support Tickets</Text>
          </View>

          <View style={styles.emptyCard}>
            <AlertCircle size={36} color="#4F46E5" />
            <Text style={styles.emptyTitle}>Login Required</Text>
            <Text style={styles.emptyText}>Please login to view your support tickets.</Text>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => openCustomerAuthModal('tickets')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>Login / Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#4F46E5" />
          </TouchableOpacity>
        )}
        <MessageSquare size={24} color="#4F46E5" />
        <Text style={styles.headerTitle}>My Support Tickets</Text>
        
        <View style={{ flex: 1 }} />
        
        {onOpenNewTicket && (
          <TouchableOpacity style={styles.newTicketBtn} onPress={onOpenNewTicket}>
            <PlusCircle size={16} color="#FFFFFF" />
            <Text style={styles.newTicketText}>New Ticket</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 30 }} />
      ) : tickets.length === 0 ? (
        <View style={styles.emptyCard}>
          <MessageSquare size={32} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No tickets found</Text>
          <Text style={styles.emptyText}>You haven't raised any support tickets yet.</Text>
          {onOpenNewTicket && (
            <TouchableOpacity style={[styles.btnPrimary, { marginTop: 16 }]} onPress={onOpenNewTicket}>
              <Text style={styles.btnPrimaryText}>Raise an Issue</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.ticketList}>
          {tickets.map(ticket => {
            const statusStyle = getStatusColor(ticket.status);
            const isExpanded = expandedTicketId === ticket.id;
            
            return (
              <View key={ticket.id} style={styles.ticketCard}>
                <TouchableOpacity 
                  style={styles.ticketHeader}
                  onPress={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                >
                  <View style={styles.ticketHeaderLeft}>
                    <Text style={styles.ticketId}>{ticket.ticketNumber}</Text>
                    <Text style={styles.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
                    <Text style={styles.ticketDate}>
                      {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.ticketBody}>
                    <View style={styles.messagesContainer}>
                      {ticket.messages.map(msg => (
                        <View 
                          key={msg.id} 
                          style={[
                            styles.messageBubble, 
                            msg.senderRole === 'user' ? styles.messageUser : styles.messageAdmin
                          ]}
                        >
                          <Text style={styles.messageSender}>{msg.senderName}</Text>
                          <Text style={styles.messageText}>{msg.message}</Text>
                          <Text style={styles.messageTime}>
                            {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      ))}
                    </View>
                    
                    {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                      <View style={styles.replyNotice}>
                        <Text style={styles.replyNoticeText}>
                          To reply, please open a new chat or wait for the support agent to respond.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  newTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  newTicketText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  btnPrimary: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  ticketList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  ticketHeaderLeft: {
    flex: 1,
    paddingRight: 16,
  },
  ticketId: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  ticketDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ticketBody: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  messagesContainer: {
    gap: 12,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  messageUser: {
    backgroundColor: '#E0E7FF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageAdmin: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  replyNotice: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  replyNoticeText: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'center',
  },
});
