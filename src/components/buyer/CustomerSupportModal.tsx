import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {
  X,
  Send,
  Bot,
  User
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { createSupportTicketInFirestore, getOrders } from '../../services/firebaseService';
import { SupportTicket, SupportTicketMessage } from '../../types/adminTypes';
import { Order } from '../../types';

interface CustomerSupportModalProps {
  visible: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

export interface ChatOption {
  id: string;
  label: string;
  subtitle?: string;
  imageUrl?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isOptions?: boolean;
  options?: (string | ChatOption)[];
}

export const CustomerSupportModal: React.FC<CustomerSupportModalProps> = ({
  visible,
  onClose,
  initialOrderId,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('General Support');
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>(undefined);
  
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      resetChat();
    }
  }, [visible, initialOrderId]);

  const resetChat = () => {
    setTicketCreated(false);
    setSelectedCategory('General Support');
    setActiveOrderId(initialOrderId);
    setInputText('');
    
    if (initialOrderId) {
      setSelectedCategory('Order & Delivery');
      setMessages([
        {
          id: '1',
          sender: 'bot',
          text: `Hi ${user?.name?.split(' ')[0] || 'there'}! I see you need help with order ${initialOrderId}. What seems to be the problem?`,
          isOptions: true,
          options: ['Order Delayed', 'Missing Items', 'Wrong Item Received', 'Request Return', 'Other'],
        }
      ]);
    } else {
      setMessages([
        {
          id: '1',
          sender: 'bot',
          text: `Hello ${user?.name?.split(' ')[0] || ''}! Welcome to DigiSewa Support. How can I assist you today?`,
          isOptions: true,
          options: ['Order & Delivery Issue', 'Payment & Refunds', 'Product Quality', 'General Query'],
        }
      ]);
    }
  };

  const handleSend = (text: string) => {
    if (!text.trim() || isSubmitting) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    if (ticketCreated) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: 'bot', text: 'Thank you. We have added this to your ticket notes.' }
        ]);
      }, 1000);
      return;
    }

    createTicketFromChat(text.trim());
  };

  const handleOptionSelect = (option: string | ChatOption) => {
    const isString = typeof option === 'string';
    const label = isString ? option : option.label;
    const optionId = isString ? option : option.id;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: label };
    
    setMessages((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].isOptions = false;
      }
      return [...updated, userMsg];
    });

    if (optionId === 'Order & Delivery Issue') {
      setSelectedCategory(optionId);
      
      setTimeout(async () => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: 'bot', text: 'Let me fetch your recent orders...' }
        ]);

        try {
          const orders = await getOrders();
          const userOrders = orders.filter(o => o.buyerId === user?.id);
          
          if (userOrders.length > 0) {
            // Sort by createdAt descending
            userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            // Take top 5
            const recentOrders = userOrders.slice(0, 5);
            const orderOptions: ChatOption[] = recentOrders.map(o => {
              const itemsCount = o.items.length;
              let subtitle = o.items[0]?.product?.title || 'Items';
              if (itemsCount > 1) {
                subtitle += ` + ${itemsCount - 1} more`;
              }
              return {
                id: `Order ORD-${o.id}`,
                label: `Order ${o.id} - ₹${o.totalAmount}`,
                subtitle: subtitle,
                imageUrl: o.items[0]?.product?.imageUrl
              };
            });
            
            setMessages((prev) => [
              ...prev,
              { 
                id: (Date.now() + 1).toString(), 
                sender: 'bot', 
                text: 'Please select the order you have an issue with:',
                isOptions: true,
                options: orderOptions
              }
            ]);
          } else {
             setMessages((prev) => [
              ...prev,
              { id: (Date.now() + 1).toString(), sender: 'bot', text: "I couldn't find any recent orders for your account. Please describe your issue in detail." }
            ]);
          }
        } catch (error) {
           setMessages((prev) => [
            ...prev,
            { id: (Date.now() + 1).toString(), sender: 'bot', text: 'I had trouble fetching your orders. Please describe your issue below.' }
          ]);
        }
      }, 500);

    } else if (optionId.startsWith('Order ORD-')) {
      // User selected an order from the list
      const extractedOrderId = optionId.split(' ')[1].replace('ORD-', ''); // e.g. "Order ORD-1234" -> "1234"
      setActiveOrderId(extractedOrderId);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { 
            id: Date.now().toString(), 
            sender: 'bot', 
            text: `You selected order ${extractedOrderId}. What seems to be the problem with it?`,
            isOptions: true,
            options: ['Order Delayed', 'Missing Items', 'Wrong Item Received', 'Request Return', 'Other']
          }
        ]);
      }, 500);
      
    } else if (['Payment & Refunds', 'Product Quality', 'General Query'].includes(optionId)) {
      setSelectedCategory(optionId);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: 'bot', text: `Please provide more details about your ${optionId.toLowerCase()}.` }
        ]);
      }, 500);
    } else if (activeOrderId) {
      // It's an order specific option (e.g. "Order Delayed")
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: 'bot', text: `I understand you are facing issues regarding "${label}". Please describe it in detail, or you can attach any relevant information.` }
        ]);
      }, 500);
    } else {
       setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: 'bot', text: `Please describe your issue.` }
        ]);
      }, 500);
    }
  };

  const createTicketFromChat = async (description: string) => {
    setIsSubmitting(true);
    try {
      const ticketNum = 'TCK-' + Math.floor(1000 + Math.random() * 9000);
      
      const firestoreMessages: SupportTicketMessage[] = messages.filter(m => !m.isOptions).map((m, index) => ({
        id: `msg-${index}`,
        senderRole: m.sender === 'user' ? 'user' : 'admin',
        senderName: m.sender === 'user' ? (user?.name || 'Customer') : 'DigiSewa Bot',
        message: m.text,
        timestamp: new Date().toISOString(),
      }));
      
      firestoreMessages.push({
        id: `msg-${messages.length}`,
        senderRole: 'user',
        senderName: user?.name || 'Customer',
        message: description,
        timestamp: new Date().toISOString(),
      });

      const newTicket: SupportTicket = {
        id: 'TCK-CUST-' + Math.floor(10000 + Math.random() * 90000),
        ticketNumber: ticketNum,
        ticketType: 'customer',
        userId: user?.id || 'cust-anon',
        userName: user?.name || 'Valued Customer',
        userEmail: user?.email || 'customer@DigiSewa.org',
        userPhone: user?.phone || '+91 98765 43210',
        category: selectedCategory,
        subject: activeOrderId ? `Issue with Order ${activeOrderId}` : `Support Inquiry: ${selectedCategory}`,
        description: description,
        orderId: activeOrderId,
        status: 'open',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: firestoreMessages,
      };

      await createSupportTicketInFirestore(newTicket);
      
      setTicketCreated(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { 
            id: Date.now().toString(), 
            sender: 'bot', 
            text: `Thank you! I have raised a ticket (${ticketNum}) for our support team. An agent will review it and get back to you shortly.` 
          }
        ]);
        setIsSubmitting(false);
      }, 1000);

    } catch (err) {
      console.error('Error submitting support ticket:', err);
      setIsSubmitting(false);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: 'bot', text: 'Sorry, I encountered an error while creating your ticket. Please try again later.' }
        ]);
      }, 500);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBox}>
                <Bot size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>DigiSewa Support</Text>
                <Text style={styles.headerSub}>Usually replies in a few minutes</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Chat Content */}
          <ScrollView 
            style={styles.chatArea} 
            contentContainerStyle={styles.chatInner}
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[
                styles.messageWrapper, 
                msg.sender === 'user' ? styles.messageWrapperUser : styles.messageWrapperBot
              ]}>
                {msg.sender === 'bot' && (
                  <View style={styles.botAvatar}>
                    <Bot size={14} color="#4F46E5" />
                  </View>
                )}
                <View style={[
                  styles.messageBubble,
                  msg.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleBot
                ]}>
                  <Text style={[
                    styles.messageText,
                    msg.sender === 'user' ? styles.messageTextUser : styles.messageTextBot
                  ]}>{msg.text}</Text>
                </View>
                {msg.sender === 'user' && (
                  <View style={styles.userAvatar}>
                    <User size={14} color="#FFFFFF" />
                  </View>
                )}
              </View>
            ))}

            {/* Options */}
            {messages.length > 0 && messages[messages.length - 1].isOptions && (
              <View style={styles.optionsContainer}>
                {messages[messages.length - 1].options?.map((opt, idx) => {
                  const isString = typeof opt === 'string';
                  const label = isString ? opt : opt.label;
                  const hasImage = !isString && !!opt.imageUrl;
                  
                  return (
                    <TouchableOpacity 
                      key={idx} 
                      style={[
                        styles.optionPill,
                        !isString && (opt.subtitle || opt.imageUrl) && styles.richOptionPill
                      ]}
                      onPress={() => handleOptionSelect(opt)}
                    >
                      {hasImage && (
                        <Image source={{ uri: (opt as ChatOption).imageUrl }} style={styles.optionImage} />
                      )}
                      <View style={styles.optionTextContainer}>
                        <Text style={styles.optionPillText}>{label}</Text>
                        {!isString && (opt as ChatOption).subtitle && (
                          <Text style={styles.optionSubtitleText}>{(opt as ChatOption).subtitle}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {isSubmitting && (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.typingText}>Bot is typing...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend(inputText)}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} 
              onPress={() => handleSend(inputText)}
              disabled={!inputText.trim() || isSubmitting}
            >
              <Send size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    height: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#4F46E5', // Distinct header for chat
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    color: '#E0E7FF',
    fontSize: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatArea: {
    flex: 1,
  },
  chatInner: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '85%',
  },
  messageWrapperUser: {
    alignSelf: 'flex-end',
  },
  messageWrapperBot: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleBot: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageBubbleUser: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextBot: {
    color: '#0F172A',
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  optionsContainer: {
    alignSelf: 'flex-start',
    marginLeft: 36,
    gap: 8,
    marginTop: 4,
  },
  optionPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  optionPillText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '600',
  },
  richOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 260,
    gap: 12,
  },
  optionImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionSubtitleText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 36,
    marginTop: 4,
  },
  typingText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  }
});
