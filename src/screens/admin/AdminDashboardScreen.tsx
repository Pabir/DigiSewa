import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar, AdminTab } from '../../components/admin/AdminSidebar';
import { AdminOverviewScreen } from './AdminOverviewScreen';
import { AdminSellerApprovalScreen } from './AdminSellerApprovalScreen';
import { AdminCustomerManagementScreen } from './AdminCustomerManagementScreen';
import { AdminSellerTicketsScreen } from './AdminSellerTicketsScreen';
import { AdminCustomerTicketsScreen } from './AdminCustomerTicketsScreen';
import { AdminCatalogFormBuilderScreen } from './AdminCatalogFormBuilderScreen';
import { SuperAdminManagementScreen } from './SuperAdminManagementScreen';
import { SuperadminSettlementsScreen } from './SuperadminSettlementsScreen';
import {
  AdminSeller,
  AdminCustomer,
  SupportTicket,
  AdminOverviewMetrics,
  TicketStatus,
} from '../../types/adminTypes';

import { UserRole, Seller } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getSellersFromFirestore, getSupportTicketsFromFirestore, getUsersFromFirestore, getOrders } from '../../services/firebaseService';

interface AdminDashboardScreenProps {
  onSwitchRole: (role: UserRole) => void;
}

// Initial Mock Data for Admin Panel
const INITIAL_SELLERS: AdminSeller[] = [];

const INITIAL_CUSTOMERS: AdminCustomer[] = [];

const INITIAL_SELLER_TICKETS: SupportTicket[] = [];

const INITIAL_CUSTOMER_TICKETS: SupportTicket[] = [];

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onSwitchRole }) => {
  const { activeRole, approveSellerApplication, rejectSellerApplication, suspendSellerApplication } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sellers, setSellers] = useState<AdminSeller[]>(INITIAL_SELLERS);
  const [customers, setCustomers] = useState<AdminCustomer[]>(INITIAL_CUSTOMERS);
  const [sellerTickets, setSellerTickets] = useState<SupportTicket[]>(INITIAL_SELLER_TICKETS);
  const [customerTickets, setCustomerTickets] = useState<SupportTicket[]>(INITIAL_CUSTOMER_TICKETS);

  useEffect(() => {
    getSellersFromFirestore().then(remoteSellers => {
      if (remoteSellers && remoteSellers.length > 0) {
        const mappedAdminSellers: AdminSeller[] = remoteSellers.map((s: Seller) => ({
          id: s.id,
          storeName: s.storeName,
          ownerName: s.ownerName || s.storeName,
          email: s.email || 'seller@DigiSewa.in',
          phone: s.phone,
          gstin: s.gstin || 'GST-NOT-PROVIDED',
          panNumber: s.panNumber || 'PAN-NOT-PROVIDED',
          bankAccountNo: s.bankDetails?.accountNumber || '918020044556611',
          ifscCode: s.bankDetails?.ifscCode || 'UTIB0000123',
          bankName: s.bankDetails?.bankName || 'Axis Bank',
          storeAddress: s.businessAddress || `${s.pickupAddress?.building || ''}, ${s.pickupAddress?.city || ''}`,
          city: s.pickupAddress?.city || 'Guwahati',
          state: s.pickupAddress?.state || 'Assam',
          pincode: s.pickupAddress?.pincode || '781001',
          status: s.verificationStatus === 'verified' ? 'approved' : s.verificationStatus === 'rejected' ? 'rejected' : 'pending',
          joinedDate: s.joinedDate ? s.joinedDate.split('T')[0] : new Date().toISOString().split('T')[0],
          totalProductsCount: 1,
          totalSalesVolume: s.totalSales || 0,
          rejectionReason: s.rejectionReason,
          eSignatureText: s.eSignatureText,
          eSignatureUrl: s.eSignatureUrl || (s.eSignatureText ? 'verified' : undefined),
        }));

        setSellers(prev => {
          const map = new Map<string, AdminSeller>();
          prev.forEach(item => map.set(item.id, item));
          mappedAdminSellers.forEach(item => map.set(item.id, item));
          return Array.from(map.values());
        });
      }
    });

    getSupportTicketsFromFirestore().then(remoteTickets => {
      if (remoteTickets && remoteTickets.length > 0) {
        setSellerTickets(remoteTickets.filter(t => t.ticketType === 'seller'));
        setCustomerTickets(remoteTickets.filter(t => t.ticketType === 'customer'));
      }
    });

    getUsersFromFirestore().then(async remoteUsers => {
      if (remoteUsers && remoteUsers.length > 0) {
        const customerUsers = remoteUsers.filter(u => u.role === 'customer' || u.role === 'buyer' || u.role === 'guest');
        if (customerUsers.length > 0) {
          try {
            const allOrders = await getOrders();
            const mappedAdminCustomers: AdminCustomer[] = customerUsers.map((u) => {
              const userOrders = allOrders.filter(order => order.buyerId === u.id);
              const totalOrders = userOrders.length;
              const totalSpent = userOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

              return {
                id: u.id,
                name: u.name || 'Unknown',
                email: u.email || 'N/A',
                phone: u.phone || 'N/A',
                city: 'N/A', 
                state: 'N/A',
                walletBalance: 0,
                totalOrders: totalOrders,
                totalSpent: totalSpent,
                orders: userOrders,
                status: 'active',
                registeredDate: new Date().toISOString().split('T')[0],
                lastActive: new Date().toISOString().split('T')[0]
              };
            });

            setCustomers(prev => {
              const map = new Map<string, AdminCustomer>();
              prev.forEach(item => map.set(item.id, item));
              mappedAdminCustomers.forEach(item => map.set(item.id, item));
              return Array.from(map.values());
            });
          } catch (error) {
            console.error('Failed to fetch orders for customers:', error);
          }
        }
      }
    });
  }, []);

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
    suspendSellerApplication(sellerId);
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
              senderName: 'DigiSewa Admin',
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
      {/* Admin Top Navigation Bar */}
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

          {activeTab === 'catalog_builder' && (
            <AdminCatalogFormBuilderScreen />
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

          {activeTab === 'settlements' && (
            <SuperadminSettlementsScreen />
          )}

          {activeTab === 'team_management' && activeRole === 'super_admin' && (
            <SuperAdminManagementScreen />
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
