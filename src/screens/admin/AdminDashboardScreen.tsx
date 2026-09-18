import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
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
import { AdminReturnsScreen } from './AdminReturnsScreen';
import { AdminSystemSettingsScreen } from './AdminSystemSettingsScreen';
import { FinanceDashboardScreen } from './finance/FinanceDashboardScreen';
import { SellerWiseFinanceScreen } from './finance/SellerWiseFinanceScreen';
import { ReconciliationScreen } from './finance/ReconciliationScreen';
import { SettlementBatchesScreen } from './finance/SettlementBatchesScreen';
import { TaxReportsScreen } from './finance/TaxReportsScreen';
import { AdminPendingTasksScreen } from './AdminPendingTasksScreen';
import { AdminMockDeliveriesScreen } from './AdminMockDeliveriesScreen';
import { AdminOrderTrackingScreen } from './AdminOrderTrackingScreen';
import {
  AdminSeller,
  AdminCustomer,
  SupportTicket,
  AdminOverviewMetrics,
  TicketStatus,
  SystemSettings,
} from '../../types/adminTypes';

import { UserRole, Seller, Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { listenToSystemSettings, getAdminDashboardMetrics, updateSellerGstInFirestore } from '../../services/firebaseService';
import { Alert } from 'react-native';

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
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [maintenanceWarning, setMaintenanceWarning] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = listenToSystemSettings((settings) => {
      setMaintenanceWarning(settings.maintenanceWarningEnabled || false);
    });
    return () => unsubscribe();
  }, []);

  const [metrics, setMetrics] = useState<AdminOverviewMetrics>({
    totalRevenue: 0,
    activeSellersCount: 0,
    pendingSellersCount: 0,
    totalCustomersCount: 0,
    openSellerTicketsCount: 0,
    openCustomerTicketsCount: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      const data = await getAdminDashboardMetrics();
      setMetrics(data);
    };
    fetchMetrics();
  }, []);

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

  const handleApproveGst = async (sellerId: string, gstin: string) => {
    const seller = sellers.find(s => s.id === sellerId);
    if (!seller || !seller.gstAdditionRequest) return;

    try {
      await updateSellerGstInFirestore(sellerId, {
        gstin,
        hasGst: true,
        gstAdditionRequest: { ...seller.gstAdditionRequest, status: 'approved' },
      });
      setSellers((prev) =>
        prev.map((s) => {
          if (s.id === sellerId && s.gstAdditionRequest) {
            return {
              ...s,
              gstin: gstin,
              hasGst: true,
              gstAdditionRequest: { ...s.gstAdditionRequest, status: 'approved' },
            };
          }
          return s;
        })
      );
      alert('✅ GSTIN update approved successfully.');
    } catch (err) {
      alert('❌ Failed to approve GSTIN. Please try again.');
    }
  };

  const handleRejectGst = async (sellerId: string, reason: string) => {
    const seller = sellers.find(s => s.id === sellerId);
    if (!seller || !seller.gstAdditionRequest) return;

    try {
      await updateSellerGstInFirestore(sellerId, {
        gstAdditionRequest: { ...seller.gstAdditionRequest, status: 'rejected', rejectionReason: reason },
      });
      setSellers((prev) =>
        prev.map((s) => {
          if (s.id === sellerId && s.gstAdditionRequest) {
            return {
              ...s,
              gstAdditionRequest: { ...s.gstAdditionRequest, status: 'rejected', rejectionReason: reason },
            };
          }
          return s;
        })
      );
      alert(`❌ GSTIN request rejected. Reason: ${reason}`);
    } catch (err) {
      alert('❌ Failed to reject GSTIN. Please try again.');
    }
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
              senderName: 'TafDeal Admin',
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
  const handleCreateCustomerTicket = (newTicket: SupportTicket) => {
    setCustomerTickets((prev) => [newTicket, ...prev]);
  };

  const handleReplyCustomerTicket = (ticketId: string, replyMessage: string, newStatus?: TicketStatus) => {
    setCustomerTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updatedMessages = [
            ...t.messages,
            {
              id: 'm-' + Date.now(),
              senderRole: 'admin' as const,
              senderName: 'TafDeal Customer Support',
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
      {maintenanceWarning && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            {activeRole === 'super_admin' 
              ? "MAINTENANCE WARNING IS ON - Junior Admins are currently locked out." 
              : "SYSTEM MAINTENANCE - Super Admin is performing critical operations. Actions are temporarily disabled."}
          </Text>
        </View>
      )}

      <AdminHeader
        activeRole="admin"
        onSwitchRole={onSwitchRole}
        pendingApprovalsCount={metrics.pendingSellersCount}
        openTicketsCount={metrics.openSellerTicketsCount + metrics.openCustomerTicketsCount}
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
            pendingSellersCount={metrics.pendingSellersCount}
            openSellerTicketsCount={metrics.openSellerTicketsCount}
            openCustomerTicketsCount={metrics.openCustomerTicketsCount}
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
                pendingSellersCount={metrics.pendingSellersCount}
                openSellerTicketsCount={metrics.openSellerTicketsCount}
                openCustomerTicketsCount={metrics.openCustomerTicketsCount}
              />
            </View>
          </View>
        )}

        {/* Tab Content Renderer */}
        <View style={styles.contentArea}>
          {maintenanceWarning && activeRole !== 'super_admin' ? (
            <View style={styles.lockedContainer}>
              <Text style={styles.lockedIcon}>⚠️</Text>
              <Text style={styles.lockedTitle}>System Locked</Text>
              <Text style={styles.lockedDescription}>
                Operations are currently disabled as the Super Admin is performing critical delete operations. 
                Please wait until maintenance is complete.
              </Text>
            </View>
          ) : (
            <>
              {activeTab === 'overview' && (
                <AdminOverviewScreen metrics={metrics} onNavigateTab={handleSelectAdminTab} />
              )}

          {activeTab === 'catalog_builder' && (
            <AdminCatalogFormBuilderScreen />
          )}

          {activeTab === 'seller_approvals' && (
            <AdminSellerApprovalScreen
              onApproveSeller={handleApproveSeller}
              onRejectSeller={handleRejectSeller}
              onSuspendSeller={handleSuspendSeller}
              onApproveGst={handleApproveGst}
              onRejectGst={handleRejectGst}
            />
          )}

          {activeTab === 'customers' && (
            <AdminCustomerManagementScreen 
              onUpdateWalletBalance={handleUpdateWalletBalance} 
              onToggleBlockUser={handleToggleBlockUser} 
            />
          )}

          {activeTab === 'seller_tickets' && (
            <AdminSellerTicketsScreen
              onReplyTicket={handleReplySellerTicket}
              onResolveTicket={(ticketId) => handleReplySellerTicket(ticketId, 'Resolved', 'resolved')}
            />
          )}

          {activeTab === 'customer_tickets' && (
            <AdminCustomerTicketsScreen
              onReplyTicket={handleReplyCustomerTicket}
              onResolveTicket={(ticketId) => handleReplyCustomerTicket(ticketId, 'Resolved', 'resolved')}
              onCreateTicket={handleCreateCustomerTicket}
              onProcessInstantRefund={handleProcessInstantRefund}
            />
          )}

          {activeTab === 'settlements' && (
            <SuperadminSettlementsScreen />
          )}

          {activeTab === 'returns' && (
            <AdminReturnsScreen />
          )}

          {activeTab === 'team_management' && activeRole === 'super_admin' && (
            <SuperAdminManagementScreen />
          )}

          {activeTab === 'system_settings' && (
            <AdminSystemSettingsScreen />
          )}

          {activeTab === 'finance_dashboard' && (
            <FinanceDashboardScreen />
          )}

          {activeTab === 'finance_seller_wise' && (
            <SellerWiseFinanceScreen />
          )}

          {activeTab === 'finance_reconciliation' && (
            <ReconciliationScreen />
          )}

          {activeTab === 'finance_settlements' && (
            <SettlementBatchesScreen />
          )}

          {activeTab === 'finance_taxes' && (
            <TaxReportsScreen />
          )}

          {activeTab === 'pending_tasks' && (
            <AdminPendingTasksScreen />
          )}

          {activeTab === 'mock_deliveries' && (
            <AdminMockDeliveriesScreen />
          )}

          {activeTab === 'order_tracker' && (
            <AdminOrderTrackingScreen />
          )}
            </>
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
  warningBanner: {
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  warningText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#FEF2F2',
  },
  lockedIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 12,
  },
  lockedDescription: {
    fontSize: 15,
    color: '#7F1D1D',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
  },
});
