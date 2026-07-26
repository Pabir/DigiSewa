import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar, AdminTab } from '../../components/admin/AdminSidebar';
import { AdminOverviewScreen } from './AdminOverviewScreen';
import { AdminSellerApprovalScreen } from './AdminSellerApprovalScreen';
import { AdminCustomerManagementScreen } from './AdminCustomerManagementScreen';
import { AdminSellerTicketsScreen } from './AdminSellerTicketsScreen';
import { AdminCustomerTicketsScreen } from './AdminCustomerTicketsScreen';
import {
  AdminSeller,
  AdminCustomer,
  SupportTicket,
  AdminOverviewMetrics,
  TicketStatus,
} from '../../types/adminTypes';

import { UserRole } from '../../types';

import { useAuth } from '../../context/AuthContext';

interface AdminDashboardScreenProps {
  onSwitchRole: (role: UserRole) => void;
}

// Initial Mock Data for Super Admin Panel
const INITIAL_SELLERS: AdminSeller[] = [
  {
    id: 'sel-101',
    storeName: 'Al Mursaleen Stores',
    ownerName: 'Sk Pabirul Islam',
    email: 'drskpabirulislam1995@gmail.com',
    phone: '+91 98765 01234',
    gstin: '18AABCU9603R1ZM',
    panNumber: 'ABCDE1234F',
    bankAccountNo: '918020044556611',
    ifscCode: 'UTIB0000123',
    bankName: 'Axis Bank - Guwahati Branch',
    storeAddress: 'Building 4B, Sector 2, Main Bazaar Road',
    city: 'Guwahati',
    state: 'Assam',
    pincode: '781001',
    eSignatureUrl: 'verified',
    status: 'pending',
    joinedDate: '2026-07-26',
    totalProductsCount: 4,
    totalSalesVolume: 125400,
  },
  {
    id: 'sel-102',
    storeName: 'Sharma Fresh Organics',
    ownerName: 'Ramesh Sharma',
    email: 'sharma.organics@gmail.com',
    phone: '+91 98111 22334',
    gstin: '07AAACS9876Q1Z5',
    panNumber: 'AAACS9876Q',
    bankAccountNo: '501002341123',
    ifscCode: 'ICIC0000456',
    bankName: 'ICICI Bank',
    storeAddress: 'Shop 12, Main Market',
    city: 'Guwahati',
    state: 'Assam',
    pincode: '781001',
    eSignatureUrl: 'verified',
    status: 'approved',
    joinedDate: '2026-06-15',
    totalProductsCount: 32,
    totalSalesVolume: 489000,
  },
  {
    id: 'sel-103',
    storeName: 'Gupta Electricals & Repairs',
    ownerName: 'Sanjay Gupta',
    email: 'gupta.repairs@gmail.com',
    phone: '+91 99222 33445',
    gstin: '09AABCG5432E1Z8',
    panNumber: 'AABCG5432E',
    bankAccountNo: '30981276345',
    ifscCode: 'SBIN0001122',
    bankName: 'State Bank of India',
    storeAddress: 'G-4, Sector 18',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    eSignatureUrl: 'verified',
    status: 'approved',
    joinedDate: '2026-05-10',
    totalProductsCount: 18,
    totalSalesVolume: 340000,
  },
  {
    id: 'sel-104',
    storeName: 'Royal Handlooms & Sarees',
    ownerName: 'Anita Verma',
    email: 'anita.royalhandlooms@yahoo.com',
    phone: '+91 97333 44556',
    gstin: '27AABCR1122M1Z3',
    panNumber: 'AABCR1122M',
    bankAccountNo: '887766554433',
    ifscCode: 'AXIS0000987',
    bankName: 'Axis Bank',
    storeAddress: 'Weaver Colony 8',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395003',
    eSignatureUrl: 'verified',
    status: 'pending',
    joinedDate: '2026-07-24',
    totalProductsCount: 8,
    totalSalesVolume: 92000,
  },
];

const INITIAL_CUSTOMERS: AdminCustomer[] = [
  {
    id: 'cust-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    phone: '+91 98989 89898',
    city: 'Noida',
    state: 'Uttar Pradesh',
    walletBalance: 450,
    totalOrders: 12,
    totalSpent: 14500,
    status: 'active',
    registeredDate: '2026-05-01',
    lastActive: '2026-07-25',
  },
  {
    id: 'cust-2',
    name: 'Vikram Malhotra',
    email: 'vikram.m@gmail.com',
    phone: '+91 97777 66666',
    city: 'New Delhi',
    state: 'Delhi',
    walletBalance: 200,
    totalOrders: 8,
    totalSpent: 9800,
    status: 'active',
    registeredDate: '2026-06-10',
    lastActive: '2026-07-24',
  },
  {
    id: 'cust-3',
    name: 'Amit Patel',
    email: 'amit.patel@gmail.com',
    phone: '+91 96666 55555',
    city: 'Ahmedabad',
    state: 'Gujarat',
    walletBalance: 0,
    totalOrders: 3,
    totalSpent: 3200,
    status: 'blocked',
    registeredDate: '2026-04-12',
    lastActive: '2026-07-15',
  },
];

const INITIAL_SELLER_TICKETS: SupportTicket[] = [
  {
    id: 'st-101',
    ticketNumber: 'STK-9041',
    ticketType: 'seller',
    userId: 'sel-101',
    userName: 'Al Mursaleen Apparel',
    userEmail: 'almursaleen@digisewa.com',
    userPhone: '+91 98765 43210',
    category: 'Weekly Payout Settlement',
    subject: 'Request for early payout disbursement for order #ORD-9841',
    description: 'Our weekly payout settlement for batch #9841 is currently showing pending. Please verify GSTIN invoice and clear payout.',
    priority: 'high',
    status: 'open',
    createdAt: '2026-07-25 09:30 AM',
    updatedAt: '2026-07-25 09:30 AM',
    messages: [
      {
        id: 'm1',
        senderRole: 'seller',
        senderName: 'Dr. SK P (Al Mursaleen)',
        message: 'Hello Admin team, please clear our payout of ₹8,450 for order #ORD-9841.',
        timestamp: '09:30 AM',
      },
    ],
  },
  {
    id: 'st-102',
    ticketNumber: 'STK-8920',
    ticketType: 'seller',
    userId: 'sel-102',
    userName: 'Sharma Fresh Organics',
    userEmail: 'sharma.organics@gmail.com',
    userPhone: '+91 98111 22334',
    category: 'Catalog Quality Check',
    subject: 'Image QC verification status for Organic Alphonso Mangoes',
    description: 'We updated white background high resolution photos. Kindly mark QC approved.',
    priority: 'medium',
    status: 'in_progress',
    createdAt: '2026-07-24 02:15 PM',
    updatedAt: '2026-07-24 04:30 PM',
    messages: [
      {
        id: 'm1',
        senderRole: 'seller',
        senderName: 'Ramesh Sharma',
        message: 'Reuploaded front and zoomed images as requested.',
        timestamp: '02:15 PM',
      },
      {
        id: 'm2',
        senderRole: 'admin',
        senderName: 'Admin Agent',
        message: 'Catalog quality team is reviewing the white background images.',
        timestamp: '04:30 PM',
      },
    ],
  },
];

const INITIAL_CUSTOMER_TICKETS: SupportTicket[] = [
  {
    id: 'ct-201',
    ticketNumber: 'CTK-5410',
    ticketType: 'customer',
    userId: 'cust-1',
    userName: 'Priya Sharma',
    userEmail: 'priya.sharma@gmail.com',
    userPhone: '+91 98989 89898',
    category: 'Refund & Order Dispute',
    subject: 'Return requested for Size M Kurti - Wrong fit received',
    description: 'Received size M but waist fit was smaller than size chart. Requested return pickup and wallet refund.',
    orderId: 'ORD-8820',
    priority: 'high',
    status: 'open',
    createdAt: '2026-07-25 10:45 AM',
    updatedAt: '2026-07-25 10:45 AM',
    messages: [
      {
        id: 'm1',
        senderRole: 'user',
        senderName: 'Priya Sharma',
        message: 'Please initiate reverse pickup and refund ₹499 to my DigiSewa Wallet.',
        timestamp: '10:45 AM',
      },
    ],
  },
];

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onSwitchRole }) => {
  const { approveSellerApplication, rejectSellerApplication } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sellers, setSellers] = useState<AdminSeller[]>(INITIAL_SELLERS);
  const [customers, setCustomers] = useState<AdminCustomer[]>(INITIAL_CUSTOMERS);
  const [sellerTickets, setSellerTickets] = useState<SupportTicket[]>(INITIAL_SELLER_TICKETS);
  const [customerTickets, setCustomerTickets] = useState<SupportTicket[]>(INITIAL_CUSTOMER_TICKETS);

  // Computed Overview Metrics
  const pendingSellersCount = sellers.filter((s) => s.status === 'pending').length;
  const activeSellersCount = sellers.filter((s) => s.status === 'approved').length;
  const openSellerTicketsCount = sellerTickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const openCustomerTicketsCount = customerTickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const totalRevenue = sellers.reduce((sum, s) => sum + s.totalSalesVolume, 0);

  const metrics: AdminOverviewMetrics = {
    totalRevenue,
    activeSellersCount,
    pendingSellersCount,
    totalCustomersCount: customers.length,
    openSellerTicketsCount,
    openCustomerTicketsCount,
  };

  // Handlers for Seller Approvals
  const handleApproveSeller = (sellerId: string) => {
    approveSellerApplication(sellerId);
    setSellers((prev) =>
      prev.map((s) => (s.id === sellerId ? { ...s, status: 'approved' } : s))
    );
    alert('✅ Seller Store account APPROVED & Activated!');
  };

  const handleRejectSeller = (sellerId: string, reason: string) => {
    rejectSellerApplication(sellerId, reason);
    setSellers((prev) =>
      prev.map((s) =>
        s.id === sellerId ? { ...s, status: 'rejected', rejectionReason: reason } : s
      )
    );
    alert(`❌ Seller Application Rejected. Reason: ${reason}`);
  };

  const handleSuspendSeller = (sellerId: string) => {
    setSellers((prev) =>
      prev.map((s) => (s.id === sellerId ? { ...s, status: 'suspended' } : s))
    );
    alert('⚠️ Seller Store account SUSPENDED.');
  };

  // Handlers for Customer Management
  const handleUpdateWalletBalance = (customerId: string, newBalance: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, walletBalance: newBalance } : c))
    );
  };

  const handleToggleBlockUser = (customerId: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const nextStatus = c.status === 'active' ? 'blocked' : 'active';
          alert(`Customer account is now ${nextStatus.toUpperCase()}.`);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  // Handlers for Seller Tickets
  const handleReplySellerTicket = (ticketId: string, replyMessage: string, newStatus?: TicketStatus) => {
    setSellerTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updatedMessages = [
            ...t.messages,
            {
              id: 'm-' + Date.now(),
              senderRole: 'admin' as const,
              senderName: 'DigiSewa Super Admin',
              message: replyMessage,
              timestamp: 'Just now',
            },
          ];
          return {
            ...t,
            messages: updatedMessages,
            status: newStatus || t.status,
            updatedAt: 'Just now',
          };
        }
        return t;
      })
    );
  };

  // Handlers for Customer Tickets
  const handleReplyCustomerTicket = (ticketId: string, replyMessage: string, newStatus?: TicketStatus) => {
    setCustomerTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updatedMessages = [
            ...t.messages,
            {
              id: 'm-' + Date.now(),
              senderRole: 'admin' as const,
              senderName: 'DigiSewa Customer Support',
              message: replyMessage,
              timestamp: 'Just now',
            },
          ];
          return {
            ...t,
            messages: updatedMessages,
            status: newStatus || t.status,
            updatedAt: 'Just now',
          };
        }
        return t;
      })
    );
  };

  const handleProcessInstantRefund = (ticketId: string, customerId: string, amount: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, walletBalance: c.walletBalance + amount } : c))
    );
  };

  const handleSelectAdminTab = (tab: AdminTab) => {
    setActiveTab(tab);
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Super Admin Top Navigation Bar */}
      <AdminHeader
        activeRole="admin"
        onSwitchRole={onSwitchRole}
        pendingApprovalsCount={pendingSellersCount}
        openTicketsCount={openSellerTicketsCount + openCustomerTicketsCount}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Admin Body with Sidebar */}
      <View style={styles.bodyLayout}>
        {/* Desktop permanent/toggleable sidebar */}
        {isDesktop && isSidebarOpen && (
          <AdminSidebar
            activeTab={activeTab}
            onTabSelect={handleSelectAdminTab}
            pendingSellersCount={pendingSellersCount}
            openSellerTicketsCount={openSellerTicketsCount}
            openCustomerTicketsCount={openCustomerTicketsCount}
          />
        )}

        {/* Mobile / Tablet Off-Canvas Drawer Overlay */}
        {!isDesktop && isSidebarOpen && (
          <View style={styles.mobileDrawerOverlay}>
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={() => setIsSidebarOpen(false)}
            />
            <View style={styles.drawerContainer}>
              <AdminSidebar
                activeTab={activeTab}
                onTabSelect={handleSelectAdminTab}
                pendingSellersCount={pendingSellersCount}
                openSellerTicketsCount={openSellerTicketsCount}
                openCustomerTicketsCount={openCustomerTicketsCount}
              />
            </View>
          </View>
        )}

        {/* Tab Content Renderer */}
        <View style={styles.contentArea}>
          {activeTab === 'overview' && (
            <AdminOverviewScreen metrics={metrics} onNavigateTab={handleSelectAdminTab} />
          )}

          {activeTab === 'seller_approvals' && (
            <AdminSellerApprovalScreen
              sellers={sellers}
              onApproveSeller={handleApproveSeller}
              onRejectSeller={handleRejectSeller}
              onSuspendSeller={handleSuspendSeller}
            />
          )}

          {activeTab === 'customers' && (
            <AdminCustomerManagementScreen
              customers={customers}
              onUpdateWalletBalance={handleUpdateWalletBalance}
              onToggleBlockUser={handleToggleBlockUser}
            />
          )}

          {activeTab === 'seller_tickets' && (
            <AdminSellerTicketsScreen
              tickets={sellerTickets}
              onReplyTicket={handleReplySellerTicket}
            />
          )}

          {activeTab === 'customer_tickets' && (
            <AdminCustomerTicketsScreen
              tickets={customerTickets}
              onReplyTicket={handleReplyCustomerTicket}
              onProcessInstantRefund={handleProcessInstantRefund}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  bodyLayout: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mobileDrawerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  drawerContainer: {
    width: 270,
    height: '100%',
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
});
