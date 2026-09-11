export type SellerApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
import { Order } from './index';

export interface AdminSeller {
  id: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  gstin: string;
  panNumber: string;
  bankAccountNo: string;
  ifscCode: string;
  bankName: string;
  storeAddress: string;
  city: string;
  state: string;
  pincode: string;
  eSignatureUrl?: string;
  eSignatureText?: string;
  status: SellerApprovalStatus;
  joinedDate: string;
  totalProductsCount: number;
  totalSalesVolume: number;
  rejectionReason?: string;
  gstAdditionRequest?: {
    gstin: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    rejectionReason?: string;
  };
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  walletBalance: number;
  totalOrders: number;
  totalSpent: number;
  orders?: Order[];
  status: 'active' | 'blocked';
  registeredDate: string;
  lastActive: string;
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicketMessage {
  id: string;
  senderRole: 'user' | 'seller' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
  attachmentUrl?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  ticketType: 'seller' | 'customer';
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  category: string;
  subject: string;
  description: string;
  orderId?: string;
  catalogId?: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  assignedAgent?: string;
  attachmentUrls?: string[];
  messages: SupportTicketMessage[];
}

export interface AdminOverviewMetrics {
  totalRevenue: number;
  activeSellersCount: number;
  pendingSellersCount: number;
  totalCustomersCount: number;
  openSellerTicketsCount: number;
  openCustomerTicketsCount: number;
}

export interface SystemSettings {
  shiprocketEnabled: boolean;
  shadowfaxEnabled: boolean;
  maintenanceWarningEnabled?: boolean;
}
