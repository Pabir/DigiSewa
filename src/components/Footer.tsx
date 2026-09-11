import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ShieldAlert, Heart, Phone, Mail } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export const Footer: React.FC = () => {
  const { openAdminAuthModal, activeRole, setActiveRole, isAuthenticated, user } = useAuth();

  return (
    <View style={styles.footerContainer}>
      <View style={styles.footerContent}>
        {/* Brand Column */}
        <View style={styles.brandCol}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoBadge} resizeMode="contain" />
            <Text style={styles.brandTitle}>DigiSewa</Text>
          </View>
          <Text style={styles.brandSubtitle}>
            Connecting local sellers, customers, and express delivery in one unified digital ecosystem.
          </Text>
        </View>

        {/* Links Column */}
        <View style={styles.linksCol}>
          <Text style={styles.colTitle}>Quick Navigation</Text>
          {(!isAuthenticated || user?.role === 'customer') && (
            <TouchableOpacity onPress={() => setActiveRole('buyer')} style={styles.linkItem}>
              <Text style={styles.linkText}>Customer Marketplace</Text>
            </TouchableOpacity>
          )}
          {(!isAuthenticated || user?.role === 'seller') && (
            <TouchableOpacity onPress={() => setActiveRole('seller')} style={styles.linkItem}>
              <Text style={styles.linkText}>Seller & Supplier Hub</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Support & Admin Column */}
        <View style={styles.supportCol}>
          <Text style={styles.colTitle}>Support & Staff</Text>
          <View style={styles.contactRow}>
            <Phone size={14} color="#4F46E5" />
            <Text style={styles.contactText}>+918981829273</Text>
          </View>
          <View style={styles.contactRow}>
            <Mail size={14} color="#4F46E5" />
            <Text style={styles.contactText}>support@DigiSewa.org</Text>
          </View>

          {/* Hidden Discrete Admin Portal Link (Only shown when not in Seller role) */}
          {activeRole !== 'seller' && (
            <TouchableOpacity
              style={styles.adminPortalLink}
              onPress={openAdminAuthModal}
              activeOpacity={0.7}
            >
              <ShieldAlert size={14} color="#64748B" />
              <Text style={styles.adminPortalText}>Staff / Admin Portal Access</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.copyrightBar}>
        <Text style={styles.copyrightText}>
          © {new Date().getFullYear()} DigiSewa Inc. Built with <Heart size={12} color="#4F46E5" /> for Assam & India.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  footerContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  brandCol: {
    flex: 1,
    minWidth: 240,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    marginRight: 10,
  },
  logoText: {
    color: '#4F46E5',
    fontWeight: '900',
    fontSize: 14,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  linksCol: {
    flex: 1,
    minWidth: 180,
  },
  supportCol: {
    flex: 1,
    minWidth: 220,
  },
  colTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkItem: {
    marginBottom: 8,
  },
  linkText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  contactText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  adminPortalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#334155',
  },
  adminPortalText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  copyrightBar: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 16,
    alignItems: 'center',
  },
  copyrightText: {
    color: '#64748B',
    fontSize: 12,
  },
});
