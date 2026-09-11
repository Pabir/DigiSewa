import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole, Seller, PickupAddress, BankDetails, SystemAdmin } from '../types';
import {
  saveSellerToFirestore,
  getSellersFromFirestore,
  updateSellerStatusInFirestore,
  updateSellerSignatureInFirestore,
  updateSellerPasswordInFirestore,
  saveUserToFirestore,
  getUsersFromFirestore,
  saveAdminToFirestore,
  getAdminsFromFirestore,
} from '../services/firebaseService';

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

export interface AuthContextType {
  user: User | null;
  sellerProfile: Seller | null;
  activeRole: UserRole;
  isAuthenticated: boolean;
  authIntent: AuthIntent;
  
  // Role & Modal Triggers
  setActiveRole: (role: UserRole) => void;
  isCustomerAuthModalOpen: boolean;
  isAdminAuthModalOpen: boolean;
  isSellerProfileModalOpen: boolean;
  isCustomerProfileModalOpen: boolean;
  openCustomerAuthModal: (intent?: AuthIntent) => void;
  closeCustomerAuthModal: () => void;
  openAdminAuthModal: () => void;
  closeAdminAuthModal: () => void;
  openSellerProfileModal: () => void;
  closeSellerProfileModal: () => void;
  openCustomerProfileModal: () => void;
  closeCustomerProfileModal: () => void;
  updateUserProfile: (name: string, phone: string, address: string) => void;
  
  // Auth Operations
  loginAsCustomer: (name: string, phone: string, email?: string, address?: string, password?: string) => void;
  loginCustomerWithPassword: (identifier: string, password: string) => { success: boolean; message: string };
  resetCustomerPassword: (identifier: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  submitSellerApplication: (payload: SellerApplicationPayload) => void;
  loginAsSeller: (identifier?: string, password?: string) => boolean;
  resetSellerPassword: (identifier: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  
  // Admin Operations
  approveSellerApplication: (sellerId: string) => void;
  rejectSellerApplication: (sellerId: string, reason: string) => void;
  suspendSellerApplication: (sellerId: string) => void;
  loginAsAdmin: (email: string, password?: string) => { success: boolean; message: string; role?: UserRole };
  
  // Super Admin Management
  registeredAdmins: SystemAdmin[];
  addAdmin: (admin: SystemAdmin) => void;
  updateAdminStatus: (id: string, status: 'active' | 'suspended') => void;
  updateSellerSignature: (signature: { text?: string; url?: string }) => void;
  
  // Utility
  updateUserAddress: (address: string) => void;
}

const STORAGE_KEY = 'DigiSewa_auth_session';

const getInitialAuthState = (): { user: User | null; sellerProfile: Seller | null; activeRole: UserRole; isAuthenticated: boolean } | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (err) {
    console.warn('Failed to parse initial auth state from localStorage:', err);
  }
  return null;
};

const initialSession = getInitialAuthState();

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialSession?.isAuthenticated ?? false);
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [sellerProfile, setSellerProfile] = useState<Seller | null>(initialSession?.sellerProfile ?? null);
  const [activeRole, setActiveRoleState] = useState<UserRole>(initialSession?.activeRole ?? 'buyer');

  const INITIAL_ADMINS: SystemAdmin[] = [
    {
      id: 'usr-admin-001',
      name: 'Super Admin',
      email: 'superadmin@DigiSewa.in',
      phone: '+91 90000 00000',
      role: 'super_admin',
      password: 'SuperAdmin@123',
      status: 'active',
      createdDate: new Date().toISOString(),
    }
  ];

  const getInitialAdmins = (): SystemAdmin[] => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('DigiSewa_registered_admins');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Ensure Super Admin is always present
          if (!parsed.some((a: SystemAdmin) => a.role === 'super_admin')) {
             return [...INITIAL_ADMINS, ...parsed];
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse admins from localStorage', err);
    }
    return INITIAL_ADMINS;
  };

  const [registeredAdmins, setRegisteredAdmins] = useState<SystemAdmin[]>(getInitialAdmins());

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('DigiSewa_registered_admins', JSON.stringify(registeredAdmins));
    }
  }, [registeredAdmins]);

  // Modals
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState<boolean>(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [isSellerProfileModalOpen, setIsSellerProfileModalOpen] = useState<boolean>(false);
  const [isCustomerProfileModalOpen, setIsCustomerProfileModalOpen] = useState<boolean>(false);
  const [authIntent, setAuthIntent] = useState<AuthIntent>(null);

  // Auto-open modal or switch role based on URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location && window.location.href) {
      const href = window.location.href.toLowerCase();
      const hasUrlLinkParams = href.includes('mode=') || href.includes('oobcode=') || href.includes('apikey=');

      if (!hasUrlLinkParams) {
        // Normal page refresh - clear any transient emailIntent
        if (window.localStorage) {
          window.localStorage.removeItem('emailIntent');
        }
        return;
      }

      const savedIntent = (window.localStorage && window.localStorage.getItem('emailIntent')) || '';

      const isSellerLink =
        href.includes('mode=sellerverifyemail') ||
        href.includes('mode=sellerresetpassword') ||
        savedIntent === 'sellerRegister' ||
        savedIntent === 'register' ||
        savedIntent === 'sellerResetPassword';

      const isCustomerLink =
        href.includes('mode=customerresetpassword') ||
        href.includes('mode=customeremail') ||
        savedIntent === 'customerResetPassword' ||
        savedIntent === 'customerEmail';

      if (isSellerLink) {
        setActiveRoleState('seller');
      } else if (isCustomerLink || href.includes('mode=resetpassword') || href.includes('oobcode')) {
        setIsCustomerAuthModalOpen(true);
      }
    }
  }, []);

  const persistSession = (u: User | null, sp: Seller | null, role: UserRole, auth: boolean) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (auth && (u || sp)) {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ user: u, sellerProfile: sp, activeRole: role, isAuthenticated: auth })
          );
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      console.warn('Failed to save auth session to localStorage:', err);
    }
  };

  const setActiveRole = (role: UserRole) => {
    if (isAuthenticated && user) {
      if (user.role === 'customer' && role !== 'buyer') return;
      if (user.role === 'seller' && role !== 'seller') return;
      if (user.role === 'admin' && role !== 'admin') return;
    }
    setActiveRoleState(role);
    persistSession(user, sellerProfile, role, isAuthenticated);
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

  const openSellerProfileModal = () => {
    setIsSellerProfileModalOpen(true);
  };

  const closeSellerProfileModal = () => {
    setIsSellerProfileModalOpen(false);
  };

  const openCustomerProfileModal = () => {
    setIsCustomerProfileModalOpen(true);
  };

  const closeCustomerProfileModal = () => {
    setIsCustomerProfileModalOpen(false);
  };

  const [registeredCustomers, setRegisteredCustomers] = useState<User[]>([]);

  const loginAsCustomer = (name: string, phone: string, email?: string, address?: string, password?: string) => {
    const cleanPhone = phone ? phone.trim() : '';
    const cleanEmail = email ? email.trim() : '';

    const existingMatch = registeredCustomers.find(c =>
      (cleanEmail && c.email?.toLowerCase() === cleanEmail.toLowerCase()) ||
      (cleanPhone && (c.phone || '').replace(/\D/g, '').includes(cleanPhone.replace(/\D/g, '')))
    );

    const defaultEmail = cleanEmail || existingMatch?.email || (cleanPhone ? `${cleanPhone.replace(/\D/g, '')}@DigiSewa.in` : 'customer@DigiSewa.in');

    const resolvedName = (name && name.trim() && name.trim() !== 'Valued Customer')
      ? name.trim()
      : (existingMatch?.name || (name && name.trim()) || 'Valued Customer');

    const newUser: User = {
      id: existingMatch?.id || `usr-cust-${Date.now().toString().slice(-4)}`,
      name: resolvedName,
      email: defaultEmail,
      phone: cleanPhone || existingMatch?.phone || '',
      role: 'customer',
      address: address && address.trim() ? address.trim() : (existingMatch?.address || ''),
      password: password || existingMatch?.password || undefined,
      avatarUrl: existingMatch?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    };

    saveUserToFirestore(newUser);

    setRegisteredCustomers(prev => {
      const idx = prev.findIndex(c => c.id === newUser.id || (cleanEmail && c.email?.toLowerCase() === cleanEmail.toLowerCase()));
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...newUser };
        return updated;
      }
      return [...prev, newUser];
    });

    setUser(newUser);
    setIsAuthenticated(true);
    setActiveRoleState('buyer');
    closeCustomerAuthModal();
    persistSession(newUser, null, 'buyer', true);
  };

  const loginCustomerWithPassword = (identifier: string, password: string): { success: boolean; message: string } => {
    if (!identifier || !identifier.trim()) {
      return { success: false, message: 'Please enter your Mobile Number or Email address.' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your account password.' };
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPhoneDigits = cleanId.replace(/\D/g, '');

    const match = registeredCustomers.find(c => {
      const cPhoneDigits = (c.phone || '').replace(/\D/g, '');
      const phoneMatch = cleanPhoneDigits.length >= 4 && cPhoneDigits.includes(cleanPhoneDigits);
      const emailMatch = c.email?.toLowerCase() === cleanId;
      return phoneMatch || emailMatch;
    });

    if (match) {
      if (match.password && match.password !== password) {
        return { success: false, message: 'Invalid mobile number/email or password. Please check your credentials.' };
      }

      setUser(match);
      setIsAuthenticated(true);
      setActiveRoleState('buyer');
      closeCustomerAuthModal();
      persistSession(match, null, 'buyer', true);
      return { success: true, message: 'Login successful' };
    }

    return { success: false, message: 'No registered account found for these details. Please check your mobile/email or sign up.' };
  };

  const resetCustomerPassword = async (identifier: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!identifier || !identifier.trim()) {
      return { success: false, message: 'Please provide a valid registered mobile number or email.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPhoneDigits = cleanId.replace(/\D/g, '');

    const match = registeredCustomers.find(c => {
      const cPhoneDigits = (c.phone || '').replace(/\D/g, '');
      const phoneMatch = cleanPhoneDigits.length >= 4 && cPhoneDigits.includes(cleanPhoneDigits);
      const emailMatch = c.email?.toLowerCase() === cleanId;
      return phoneMatch || emailMatch;
    });

    if (!match) {
      return { success: false, message: 'No registered customer account found matching these details. Please check or sign up.' };
    }

    // Update password on existing customer record (preserving existing Customer ID & profile)
    const updatedCustomer: User = {
      ...match,
      password: newPassword,
    };

    setRegisteredCustomers(prev => prev.map(c => (c.id === match.id ? updatedCustomer : c)));
    saveUserToFirestore(updatedCustomer);

    setUser(updatedCustomer);
    setIsAuthenticated(true);
    setActiveRoleState('buyer');
    closeCustomerAuthModal();
    persistSession(updatedCustomer, null, 'buyer', true);

    return { success: true, message: 'Password updated successfully! You are now logged in.' };
  };

  const [registeredSellers, setRegisteredSellers] = useState<Seller[]>([]);

  useEffect(() => {
    getUsersFromFirestore().then(remoteUsers => {
      if (remoteUsers && remoteUsers.length > 0) {
        setRegisteredCustomers(prev => {
          const mergedMap = new Map<string, User>();
          prev.forEach(u => mergedMap.set(u.id, u));
          remoteUsers.forEach(u => mergedMap.set(u.id, u));
          return Array.from(mergedMap.values());
        });

        if (user && user.role === 'customer') {
          const remoteMatch = remoteUsers.find(u => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase());
          if (remoteMatch) {
            setUser(remoteMatch);
            persistSession(remoteMatch, sellerProfile, activeRole, true);
          }
        }
      }
    });

    getSellersFromFirestore().then(remoteSellers => {
      if (remoteSellers && remoteSellers.length > 0) {
        setRegisteredSellers(prev => {
          const mergedMap = new Map<string, Seller>();
          prev.forEach(s => mergedMap.set(s.id, s));
          remoteSellers.forEach(s => mergedMap.set(s.id, s));
          return Array.from(mergedMap.values());
        });

        // Sync restored seller profile with Firestore database updates (e.g., admin approval changes)
        if (sellerProfile) {
          const remoteMatch = remoteSellers.find(s => s.id === sellerProfile.id || s.userId === sellerProfile.userId);
          if (remoteMatch) {
            setSellerProfile(remoteMatch);
            persistSession(user, remoteMatch, activeRole, true);
          }
        }
      }
    });

    getAdminsFromFirestore().then(remoteAdmins => {
      if (remoteAdmins && remoteAdmins.length > 0) {
        setRegisteredAdmins(prev => {
          const mergedMap = new Map<string, SystemAdmin>();
          prev.forEach(a => mergedMap.set(a.email.toLowerCase(), a));
          remoteAdmins.forEach(a => mergedMap.set(a.email.toLowerCase(), a));
          
          // Also push local ones that aren't in remote
          prev.forEach(a => {
            if (!remoteAdmins.some(r => r.email.toLowerCase() === a.email.toLowerCase())) {
              saveAdminToFirestore(a);
            }
          });
          
          return Array.from(mergedMap.values());
        });
      } else {
        INITIAL_ADMINS.forEach(a => saveAdminToFirestore(a));
      }
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'customer' && activeRole !== 'buyer') {
        setActiveRoleState('buyer');
        persistSession(user, sellerProfile, 'buyer', true);
      } else if (user.role === 'seller' && activeRole !== 'seller') {
        setActiveRoleState('seller');
        persistSession(user, sellerProfile, 'seller', true);
      } else if (user.role === 'admin' && activeRole !== 'admin') {
        setActiveRoleState('admin');
        persistSession(user, sellerProfile, 'admin', true);
      }
    }
  }, [user, isAuthenticated, activeRole]);

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

    // 🚀 PERSIST TO FIRESTORE DIRECTLY
    saveSellerToFirestore(newSeller);
    saveUserToFirestore(newUser);

    setRegisteredSellers(prev => [...prev, newSeller]);
    setUser(newUser);
    setSellerProfile(newSeller);
    setIsAuthenticated(true);
    setActiveRoleState('seller');
    persistSession(newUser, newSeller, 'seller', true);
  };

  const loginAsSeller = (identifier?: string, password?: string): boolean => {
    if (!identifier) {
      const defaultSeller = registeredSellers[0];
      const newUser: User = {
        id: defaultSeller.userId,
        name: defaultSeller.storeName,
        email: defaultSeller.email || 'seller@DigiSewa.in',
        phone: defaultSeller.phone,
        role: 'seller',
        address: defaultSeller.businessAddress,
      };
      setUser(newUser);
      setSellerProfile(defaultSeller);
      setIsAuthenticated(true);
      setActiveRoleState('seller');
      persistSession(newUser, defaultSeller, 'seller', true);
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
      if (password && match.password && match.password !== password) {
        return false;
      }
      const newUser: User = {
        id: match.userId,
        name: match.ownerName || match.storeName,
        email: match.email || 'seller@DigiSewa.in',
        phone: match.phone,
        role: 'seller',
        address: match.businessAddress,
      };
      setUser(newUser);
      setSellerProfile(match);
      setIsAuthenticated(true);
      setActiveRoleState('seller');
      persistSession(newUser, match, 'seller', true);
      return true;
    }

    // Return false if no registered seller profile with complete business details exists
    return false;
  };

  const approveSellerApplication = (sellerId: string) => {
    if (activeRole !== 'super_admin' && activeRole !== 'admin') {
      console.warn('Only Admin or Super Admin can approve sellers.');
      return;
    }
    updateSellerStatusInFirestore(sellerId, 'verified');
    setRegisteredSellers(prev =>
      prev.map(s => (s.id === sellerId ? { ...s, verificationStatus: 'verified', rejectionReason: undefined } : s))
    );
    if (sellerProfile && sellerProfile.id === sellerId) {
      const updatedSeller = { ...sellerProfile, verificationStatus: 'verified' as const, rejectionReason: undefined };
      setSellerProfile(updatedSeller);
      persistSession(user, updatedSeller, activeRole, isAuthenticated);
    }
  };

  const rejectSellerApplication = (sellerId: string, reason: string) => {
    updateSellerStatusInFirestore(sellerId, 'rejected', reason);
    setRegisteredSellers(prev =>
      prev.map(s => (s.id === sellerId ? { ...s, verificationStatus: 'rejected', rejectionReason: reason } : s))
    );
    if (sellerProfile && sellerProfile.id === sellerId) {
      const updatedSeller = { ...sellerProfile, verificationStatus: 'rejected' as const, rejectionReason: reason };
      setSellerProfile(updatedSeller);
      persistSession(user, updatedSeller, activeRole, isAuthenticated);
    }
  };

  const suspendSellerApplication = (sellerId: string) => {
    updateSellerStatusInFirestore(sellerId, 'suspended');
    setRegisteredSellers(prev =>
      prev.map(s => (s.id === sellerId ? { ...s, verificationStatus: 'suspended' as const } : s))
    );
    if (sellerProfile && sellerProfile.id === sellerId) {
      const updatedSeller = { ...sellerProfile, verificationStatus: 'suspended' as const };
      setSellerProfile(updatedSeller);
      persistSession(user, updatedSeller, activeRole, isAuthenticated);
    }
  };

  const addAdmin = (admin: SystemAdmin) => {
    setRegisteredAdmins(prev => [...prev, admin]);
    saveAdminToFirestore(admin);
  };

  const updateAdminStatus = (id: string, status: 'active' | 'suspended') => {
    setRegisteredAdmins(prev => {
      const updated = prev.map(a => {
        if (a.id === id) {
          // Prevent suspending the super admin account
          if (a.role === 'super_admin' && status === 'suspended') {
            return a;
          }
          return { ...a, status };
        }
        return a;
      });
      const admin = updated.find(a => a.id === id);
      if (admin) saveAdminToFirestore(admin);
      return updated;
    });
  };

  const loginAsAdmin = (email: string, password?: string): { success: boolean; message: string; role?: UserRole } => {
    let admin = registeredAdmins.find(a => a.email.toLowerCase() === email.toLowerCase());
    
    // HARD FALLBACK: Ensure superadmin@DigiSewa.in can ALWAYS log in
    if (email.toLowerCase() === 'superadmin@DigiSewa.in' && password === 'SuperAdmin@123') {
      admin = {
        id: admin ? admin.id : 'usr-admin-001',
        name: 'Super Admin',
        email: 'superadmin@DigiSewa.in',
        phone: '+91 90000 00000',
        role: 'super_admin',
        password: 'SuperAdmin@123',
        status: 'active',
        createdDate: admin ? admin.createdDate : new Date().toISOString(),
      };
      
      // Auto-save this recovered fallback to DB
      saveAdminToFirestore(admin);
      
      // Overwrite the in-memory array just in case
      setRegisteredAdmins(prev => {
        const others = prev.filter(a => a.email.toLowerCase() !== 'superadmin@DigiSewa.in');
        return [...others, admin!];
      });
    }

    if (admin) {
      // The superadmin above will have role 'super_admin' and status 'active', so it won't hit this.
      // But just in case, we add the explicit email check.
      if (admin.status === 'suspended' && email.toLowerCase() !== 'superadmin@DigiSewa.in') {
        return { success: false, message: 'This admin account is suspended.' };
      }
      if (admin.password && admin.password !== password) {
        return { success: false, message: 'Invalid password.' };
      }
      
      const adminUser: User = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      };
      setUser(adminUser);
      setIsAuthenticated(true);
      setActiveRoleState(admin.role);
      closeAdminAuthModal();
      persistSession(adminUser, null, admin.role, true);
      return { success: true, message: 'Logged in successfully', role: admin.role };
    }
    return { success: false, message: 'Invalid admin credentials.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setSellerProfile(null);
    setActiveRoleState('buyer');
    persistSession(null, null, 'buyer', false);
  };

  const updateUserAddress = (newAddress: string) => {
    if (user) {
      const updatedUser = { ...user, address: newAddress };
      setUser(updatedUser);
      saveUserToFirestore(updatedUser);
      persistSession(updatedUser, sellerProfile, activeRole, isAuthenticated);
    }
  };

  const updateUserProfile = (name: string, phone: string, address: string) => {
    if (user) {
      const updatedUser: User = {
        ...user,
        name: name.trim() || user.name,
        phone: phone.trim() || user.phone,
        address: address.trim() || user.address,
      };
      setUser(updatedUser);
      setRegisteredCustomers(prev =>
        prev.map(c => (c.id === updatedUser.id ? updatedUser : c))
      );
      saveUserToFirestore(updatedUser);
      persistSession(updatedUser, sellerProfile, activeRole, isAuthenticated);
    }
  };

  const updateSellerSignature = (signature: { text?: string; url?: string }) => {
    if (!sellerProfile) return;
    const updatedSeller: Seller = {
      ...sellerProfile,
      eSignatureText: signature.text !== undefined ? signature.text : sellerProfile.eSignatureText,
      eSignatureUrl: signature.url !== undefined ? signature.url : sellerProfile.eSignatureUrl,
    };
    setSellerProfile(updatedSeller);
    setRegisteredSellers(prev =>
      prev.map(s => (s.id === sellerProfile.id ? updatedSeller : s))
    );
    updateSellerSignatureInFirestore(sellerProfile.id, signature);
    persistSession(user, updatedSeller, activeRole, isAuthenticated);
  };

  const resetSellerPassword = async (identifier: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!identifier || !identifier.trim()) {
      return { success: false, message: 'Please provide a valid registered mobile number or email.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
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

    if (!match) {
      return { success: false, message: 'No registered seller account found matching these details.' };
    }

    const updatedSeller: Seller = {
      ...match,
      password: newPassword,
    };

    setRegisteredSellers(prev => prev.map(s => (s.id === match.id ? updatedSeller : s)));

    if (sellerProfile && sellerProfile.id === match.id) {
      setSellerProfile(updatedSeller);
      persistSession(user, updatedSeller, activeRole, isAuthenticated);
    }

    await updateSellerPasswordInFirestore(match.id, newPassword);

    return { success: true, message: 'Password updated successfully! You can now log in with your new password.' };
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
        isSellerProfileModalOpen,
        isCustomerProfileModalOpen,
        authIntent,
        setActiveRole,
        openCustomerAuthModal,
        closeCustomerAuthModal,
        openAdminAuthModal,
        closeAdminAuthModal,
        openSellerProfileModal,
        closeSellerProfileModal,
        openCustomerProfileModal,
        closeCustomerProfileModal,
        updateUserProfile,
        loginAsCustomer,
        loginCustomerWithPassword,
        resetCustomerPassword,
        submitSellerApplication,
        loginAsSeller,
        resetSellerPassword,
        approveSellerApplication,
        rejectSellerApplication,
        suspendSellerApplication,
        loginAsAdmin,
        logout,
        updateSellerSignature,
        registeredAdmins,
        addAdmin,
        updateAdminStatus,
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
