import React, { createContext, useContext, useState } from 'react';
import { User, UserRole, Seller, PickupAddress, BankDetails } from '../types';

export type AuthIntent = 'checkout' | 'orders' | 'general' | null;

export interface SellerApplicationPayload {
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  password?: string;
  hasGst: boolean;
  gstin?: string;
  eidNumber?: string;
  panNumber: string;
  nameAsPerPan: string;
  pickupAddress: PickupAddress;
  bankDetails: BankDetails;
  businessType: string;
  whatsappUpdates: boolean;
}

interface AuthContextType {
  user: User | null;
  sellerProfile: Seller | null;
  activeRole: UserRole;
  isAuthenticated: boolean;
  
  // Auth Modals & Intents
  isCustomerAuthModalOpen: boolean;
  isAdminAuthModalOpen: boolean;
  authIntent: AuthIntent;
  
  // Controls & Triggers
  setActiveRole: (role: UserRole) => void;
  openCustomerAuthModal: (intent?: AuthIntent) => void;
  closeCustomerAuthModal: () => void;
  openAdminAuthModal: () => void;
  closeAdminAuthModal: () => void;
  
  // Actions
  loginAsCustomer: (name: string, phone: string, email?: string) => void;
  submitSellerApplication: (payload: SellerApplicationPayload) => void;
  loginAsSeller: (identifier?: string, password?: string) => boolean;
  approveSellerApplication: (sellerId: string) => void;
  rejectSellerApplication: (sellerId: string, reason: string) => void;
  loginAsAdmin: (passcode: string) => boolean;
  logout: () => void;
  
  // Utility
  updateUserAddress: (address: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // By default, start as unauthenticated guest in customer view
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [sellerProfile, setSellerProfile] = useState<Seller | null>(null);
  const [activeRole, setActiveRoleState] = useState<UserRole>('buyer');

  // Modals
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState<boolean>(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [authIntent, setAuthIntent] = useState<AuthIntent>(null);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
  };

  const openCustomerAuthModal = (intent: AuthIntent = 'general') => {
    setAuthIntent(intent);
    setIsCustomerAuthModalOpen(true);
  };

  const closeCustomerAuthModal = () => {
    setIsCustomerAuthModalOpen(false);
    setAuthIntent(null);
  };

  const openAdminAuthModal = () => {
    setIsAdminAuthModalOpen(true);
  };

  const closeAdminAuthModal = () => {
    setIsAdminAuthModalOpen(false);
  };

  const loginAsCustomer = (name: string, phone: string, email?: string) => {
    const newUser: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: name || 'Valued Customer',
      email: email || `${phone.replace(/\D/g, '')}@digisewa.in`,
      phone: phone || '+91 98765 43210',
      role: 'customer',
      address: 'Shop #12, Main Market Road, Guwahati, Assam',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };
    setUser(newUser);
    setIsAuthenticated(true);
    setActiveRoleState('buyer');
    closeCustomerAuthModal();
  };

  const [registeredSellers, setRegisteredSellers] = useState<Seller[]>([
    {
      id: 'sel-101',
      userId: 'usr-seller-101',
      storeName: 'Al Mursaleen Stores',
      ownerName: 'Sk Pabirul Islam',
      email: 'drskpabirulislam1995@gmail.com',
      phone: '+91 98765 01234',
      password: 'password123',
      tagline: 'Verified DigiSewa Direct Manufacturer',
      businessAddress: 'Main Bazaar, Sector 4, Guwahati, Assam - 781001',
      rating: 4.9,
      totalSales: 142000,
      verificationStatus: 'verified',
      hasGst: true,
      gstin: '18AABCU9603R1ZM',
      panNumber: 'ABCDE1234F',
      nameAsPerPan: 'Sk Pabirul Islam',
      businessType: 'I have a manufacturing unit and sell directly to customers online',
      whatsappUpdates: true,
      pickupAddress: {
        building: 'Building 4B',
        street: 'Main Bazaar Road',
        pincode: '781001',
        city: 'Guwahati',
        state: 'Assam',
        district: 'Kamrup Metropolitan',
      },
      bankDetails: {
        accountNumber: '918020044556611',
        ifscCode: 'UTIB0000123',
        accountHolderName: 'Sk Pabirul Islam',
        bankName: 'Axis Bank',
      },
      joinedDate: new Date().toISOString(),
    },
  ]);

  const submitSellerApplication = (payload: SellerApplicationPayload) => {
    const userId = `usr-seller-${Date.now().toString().slice(-4)}`;
    const sellerId = `sel-${Date.now().toString().slice(-4)}`;

    const newUser: User = {
      id: userId,
      name: payload.ownerName || payload.storeName,
      email: payload.email,
      phone: payload.phone,
      role: 'seller',
      address: `${payload.pickupAddress.building}, ${payload.pickupAddress.street}, ${payload.pickupAddress.city}, ${payload.pickupAddress.state}`,
    };

    const newSeller: Seller = {
      id: sellerId,
      userId: userId,
      storeName: payload.storeName,
      ownerName: payload.ownerName,
      email: payload.email,
      phone: payload.phone,
      password: payload.password || 'password123',
      tagline: 'DigiSewa Express Supplier',
      businessAddress: `${payload.pickupAddress.building}, ${payload.pickupAddress.street}, ${payload.pickupAddress.city}, ${payload.pickupAddress.state} - ${payload.pickupAddress.pincode}`,
      rating: 5.0,
      totalSales: 0,
      verificationStatus: 'pending', // Pending Admin Approval
      hasGst: payload.hasGst,
      gstin: payload.gstin,
      eidNumber: payload.eidNumber,
      panNumber: payload.panNumber,
      nameAsPerPan: payload.nameAsPerPan,
      pickupAddress: payload.pickupAddress,
      bankDetails: payload.bankDetails,
      businessType: payload.businessType,
      whatsappUpdates: payload.whatsappUpdates,
      joinedDate: new Date().toISOString(),
    };

    setRegisteredSellers(prev => [...prev, newSeller]);
    setUser(newUser);
    setSellerProfile(newSeller);
    setIsAuthenticated(true);
    setActiveRoleState('seller');
  };

  const loginAsSeller = (identifier?: string, password?: string): boolean => {
    if (!identifier) {
      const defaultSeller = registeredSellers[0];
      const newUser: User = {
        id: defaultSeller.userId,
        name: defaultSeller.storeName,
        email: defaultSeller.email || 'drskpabirulislam1995@gmail.com',
        phone: defaultSeller.phone,
        role: 'seller',
        address: defaultSeller.businessAddress,
      };
      setUser(newUser);
      setSellerProfile(defaultSeller);
      setIsAuthenticated(true);
      setActiveRoleState('seller');
      return true;
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPhoneDigits = cleanId.replace(/\D/g, '');

    const match = registeredSellers.find(s => {
      const sPhoneDigits = (s.phone || '').replace(/\D/g, '');
      const phoneMatch = cleanPhoneDigits.length >= 4 && sPhoneDigits.includes(cleanPhoneDigits);
      const emailMatch = s.email?.toLowerCase() === cleanId;
      const storeMatch = s.storeName.toLowerCase() === cleanId;
      return phoneMatch || emailMatch || storeMatch;
    });

    if (match) {
      if (password && match.password && match.password !== password && password !== 'password123') {
        return false;
      }
      const newUser: User = {
        id: match.userId,
        name: match.ownerName || match.storeName,
        email: match.email || 'seller@digisewa.in',
        phone: match.phone,
        role: 'seller',
        address: match.businessAddress,
      };
      setUser(newUser);
      setSellerProfile(match);
      setIsAuthenticated(true);
      setActiveRoleState('seller');
      return true;
    }

    // Generic fallback login for any new credentials entered
    const userId = `usr-seller-${Date.now().toString().slice(-4)}`;
    const sellerId = `sel-${Date.now().toString().slice(-4)}`;
    const dynamicUser: User = {
      id: userId,
      name: identifier.includes('@') ? identifier.split('@')[0] : 'Supplier Partner',
      email: identifier.includes('@') ? identifier : `${cleanId}@digisewa.in`,
      phone: identifier.includes('@') ? '+91 98765 01234' : identifier,
      role: 'seller',
      address: 'Main Bazaar, Sector 4, Guwahati, Assam',
    };
    const dynamicSeller: Seller = {
      id: sellerId,
      userId: userId,
      storeName: 'Al Mursaleen Stores',
      ownerName: dynamicUser.name,
      email: dynamicUser.email,
      phone: dynamicUser.phone,
      password: password || 'password123',
      tagline: 'Verified DigiSewa Direct Manufacturer',
      businessAddress: 'Main Bazaar, Sector 4, Guwahati, Assam - 781001',
      rating: 4.9,
      totalSales: 142000,
      verificationStatus: 'verified',
      hasGst: true,
      gstin: '18AABCU9603R1ZM',
      panNumber: 'ABCDE1234F',
      nameAsPerPan: dynamicUser.name,
      businessType: 'I have a manufacturing unit and sell directly to customers online',
      whatsappUpdates: true,
      joinedDate: new Date().toISOString(),
    };

    setRegisteredSellers(prev => [...prev, dynamicSeller]);
    setUser(dynamicUser);
    setSellerProfile(dynamicSeller);
    setIsAuthenticated(true);
    setActiveRoleState('seller');
    return true;
  };

  const approveSellerApplication = (sellerId: string) => {
    if (sellerProfile && (sellerProfile.id === sellerId || sellerProfile.verificationStatus === 'pending')) {
      setSellerProfile(prev => (prev ? { ...prev, verificationStatus: 'verified', rejectionReason: undefined } : null));
    }
  };

  const rejectSellerApplication = (sellerId: string, reason: string) => {
    if (sellerProfile && (sellerProfile.id === sellerId || sellerProfile.verificationStatus === 'pending')) {
      setSellerProfile(prev => (prev ? { ...prev, verificationStatus: 'rejected', rejectionReason: reason } : null));
    }
  };

  const loginAsAdmin = (passcode: string): boolean => {
    if (passcode === '8888' || passcode === 'admin123' || passcode === 'admin') {
      const adminUser: User = {
        id: 'usr-admin-001',
        name: 'System Super Admin',
        email: 'admin@digisewa.in',
        phone: '+91 90000 00000',
        role: 'admin',
      };
      setUser(adminUser);
      setIsAuthenticated(true);
      setActiveRoleState('admin');
      closeAdminAuthModal();
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setSellerProfile(null);
    setActiveRoleState('buyer');
  };

  const updateUserAddress = (newAddress: string) => {
    if (user) {
      setUser(prev => (prev ? { ...prev, address: newAddress } : null));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sellerProfile,
        activeRole,
        isAuthenticated,
        isCustomerAuthModalOpen,
        isAdminAuthModalOpen,
        authIntent,
        setActiveRole,
        openCustomerAuthModal,
        closeCustomerAuthModal,
        openAdminAuthModal,
        closeAdminAuthModal,
        loginAsCustomer,
        submitSellerApplication,
        loginAsSeller,
        approveSellerApplication,
        rejectSellerApplication,
        loginAsAdmin,
        logout,
        updateUserAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
