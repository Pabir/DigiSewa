import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import {
  Store,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Mail,
  Phone,
} from 'lucide-react-native';

interface SellerGuideScreenProps {
  onBack: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToRegister?: () => void;
}

export const SellerGuideScreen: React.FC<SellerGuideScreenProps> = ({
  onBack,
  onNavigateToLogin,
  onNavigateToRegister,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'registration' | 'ifsc' | 'login' | 'faqs'>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      id: 0,
      category: 'ifsc',
      question: 'Why is Bank Name not displaying or showing an incorrect bank after entering IFSC Code?',
      answer:
        'DigiSewa uses the free Razorpay IFSC Open API for real-time verification. Make sure you enter all 11 characters of your IFSC code (e.g. SBIN0001122, UTIB0000123, HDFC0000123). As soon as 11 valid characters are typed, the app automatically fetches and displays the exact Bank Name and Branch location.',
    },
    {
      id: 1,
      category: 'registration',
      question: 'I did not receive the OTP on my mobile phone. What should I do?',
      answer:
        'Ensure your phone has active mobile network reception. Wait for the 30-second timer to finish and click "Resend OTP". Alternatively, switch to the "Email Verification" tab on the registration screen to receive a verification code via email.',
    },
    {
      id: 2,
      category: 'registration',
      question: 'Can I register as a supplier if I do not have a GSTIN number?',
      answer:
        'Yes! DigiSewa supports non-GST and micro-suppliers. On Step 2 of registration, select "Enrollment ID / EID" or enter your PAN details to complete onboarding.',
    },
    {
      id: 3,
      category: 'login',
      question: 'What credentials do I use to log into my Supplier Panel?',
      answer:
        'Log in using the 10-digit mobile number (or email ID) and account password you created during Step 5 of registration. You can also use the Instant Demo Login feature for instant test access.',
    },
    {
      id: 4,
      category: 'account',
      question: 'How long does account approval take after submission?',
      answer:
        'Your application enters "Pending Review" status immediately after submission. DigiSewa Admins review supplier documents within 24 hours. Once verified, your status updates to "Approved" and you can start listing catalogs.',
    },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Top Banner Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={20} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Back to Panel</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleRow}>
            <Store size={28} color="#FDE047" />
            <Text style={styles.headerTitle}>DigiSewa Supplier Help & Onboarding Guide</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Complete step-by-step documentation for supplier registration, login, IFSC verification, and account setup.
          </Text>

          {/* Quick Action Pills */}
          <View style={styles.actionPillsRow}>
            {onNavigateToRegister && (
              <TouchableOpacity style={styles.actionPillPrimary} onPress={onNavigateToRegister}>
                <Sparkles size={16} color="#4C1D95" />
                <Text style={styles.actionPillPrimaryText}>Start Seller Registration</Text>
              </TouchableOpacity>
            )}
            {onNavigateToLogin && (
              <TouchableOpacity style={styles.actionPillSecondary} onPress={onNavigateToLogin}>
                <ShieldCheck size={16} color="#FFFFFF" />
                <Text style={styles.actionPillSecondaryText}>Login to Supplier Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* Search Bar Container */}
        <View style={styles.searchCard}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search guide (e.g., IFSC Code, OTP, GSTIN, Bank Name, Login...)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Category Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          <TouchableOpacity
            style={[styles.chip, activeCategory === 'all' && styles.chipActive]}
            onPress={() => setActiveCategory('all')}
          >
            <Text style={[styles.chipText, activeCategory === 'all' && styles.chipTextActive]}>All Topics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, activeCategory === 'registration' && styles.chipActive]}
            onPress={() => setActiveCategory('registration')}
          >
            <Text style={[styles.chipText, activeCategory === 'registration' && styles.chipTextActive]}>
              📝 Registration
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, activeCategory === 'ifsc' && styles.chipActive]}
            onPress={() => setActiveCategory('ifsc')}
          >
            <Text style={[styles.chipText, activeCategory === 'ifsc' && styles.chipTextActive]}>
              🏦 Bank & IFSC Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, activeCategory === 'login' && styles.chipActive]}
            onPress={() => setActiveCategory('login')}
          >
            <Text style={[styles.chipText, activeCategory === 'login' && styles.chipTextActive]}>🔐 Login Help</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, activeCategory === 'faqs' && styles.chipActive]}
            onPress={() => setActiveCategory('faqs')}
          >
            <Text style={[styles.chipText, activeCategory === 'faqs' && styles.chipTextActive]}>❓ Common FAQs</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* SECTION 1: 5-STEP REGISTRATION GUIDE */}
        {(activeCategory === 'all' || activeCategory === 'registration') && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Building2 size={22} color="#7C3AED" />
              <Text style={styles.sectionTitle}>1. Step-by-Step Onboarding Guide</Text>
            </View>

            <View style={styles.stepsGrid}>
              <View style={styles.stepBox}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>Step 1</Text>
                </View>
                <Text style={styles.stepTitle}>Mobile / Email Verification</Text>
                <Text style={styles.stepDesc}>
                  Enter your 10-digit mobile number. Click "Send OTP" to verify. You can also select Email Verification.
                </Text>
              </View>

              <View style={styles.stepBox}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>Step 2</Text>
                </View>
                <Text style={styles.stepTitle}>Tax Details (GSTIN / PAN)</Text>
                <Text style={styles.stepDesc}>
                  Provide your 15-digit GSTIN or select Enrollment ID (EID) if exempt. Enter PAN details.
                </Text>
              </View>

              <View style={styles.stepBox}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>Step 3</Text>
                </View>
                <Text style={styles.stepTitle}>Pickup Address Setup</Text>
                <Text style={styles.stepDesc}>
                  Set your warehouse dispatch address (Building, Street, Pincode, City, State) for logistics pickups.
                </Text>
              </View>

              <View style={styles.stepBox}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>Step 4</Text>
                </View>
                <Text style={styles.stepTitle}>Bank & Auto-IFSC Lookup</Text>
                <Text style={styles.stepDesc}>
                  Type your 11-digit IFSC code. The system automatically fetches your exact Bank Name and Branch via live lookup.
                </Text>
              </View>

              <View style={[styles.stepBox, { flex: 1, minWidth: 260 }]}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>Step 5</Text>
                </View>
                <Text style={styles.stepTitle}>Store & Account Password</Text>
                <Text style={styles.stepDesc}>
                  Set your Store / Brand Name, Owner Name, and create a login password. Submit for Admin verification.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* SECTION 2: AUTOMATIC IFSC BANK LOOKUP INFO */}
        {(activeCategory === 'all' || activeCategory === 'ifsc') && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <CreditCard size={22} color="#059669" />
              <Text style={styles.sectionTitle}>2. Automatic Bank & IFSC Verification</Text>
            </View>
            <Text style={styles.sectionParagraph}>
              DigiSewa features automated IFSC code resolution powered by free public API verification:
            </Text>

            <View style={styles.featureBoxGreen}>
              <CheckCircle2 size={20} color="#059669" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.featureBoxTitle}>Instant Bank Prefix Preview</Text>
                <Text style={styles.featureBoxText}>
                  As soon as you type 4 characters (e.g., <Text style={{ fontWeight: '700' }}>SBIN</Text>, <Text style={{ fontWeight: '700' }}>HDFC</Text>, <Text style={{ fontWeight: '700' }}>UTIB</Text>, <Text style={{ fontWeight: '700' }}>ICIC</Text>), the bank name previews immediately.
                </Text>
              </View>
            </View>

            <View style={styles.featureBoxPurple}>
              <Sparkles size={20} color="#7C3AED" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.featureBoxTitle}>Live Branch Location Fetching</Text>
                <Text style={styles.featureBoxText}>
                  Upon completing 11 characters (e.g., <Text style={{ fontWeight: '700' }}>SBIN0001122</Text>), the system retrieves the official branch location (e.g., <Text style={{ fontWeight: '700' }}>STATE BANK OF INDIA - MIDDLETON ROW Branch</Text>).
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* SECTION 3: FREQUENTLY ASKED QUESTIONS (FAQS) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={22} color="#D97706" />
            <Text style={styles.sectionTitle}>3. Frequently Asked Questions (FAQs)</Text>
          </View>

          {filteredFaqs.map(faq => {
            const isExpanded = expandedFaq === faq.id;
            return (
              <TouchableOpacity
                key={faq.id}
                style={[styles.faqAccordionCard, isExpanded && styles.faqAccordionCardActive]}
                activeOpacity={0.8}
                onPress={() => setExpandedFaq(isExpanded ? null : faq.id)}
              >
                <View style={styles.faqHeaderRow}>
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Text style={{ fontSize: 16, color: isExpanded ? '#7C3AED' : '#6B7280', fontWeight: '700' }}>
                    {isExpanded ? '▲' : '▼'}
                  </Text>
                </View>
                {isExpanded && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SECTION 4: HELPDESK & CONTACT SUPPORT */}
        <View style={styles.supportCard}>
          <View style={styles.supportHeaderRow}>
            <Phone size={24} color="#FFFFFF" />
            <Text style={styles.supportHeaderTitle}>Need Direct Supplier Assistance?</Text>
          </View>
          <Text style={styles.supportHeaderSub}>
            Our DigiSewa supplier operations team is here to assist you with onboarding, catalog publishing, and account verification.
          </Text>

          <View style={styles.supportInfoGrid}>
            <View style={styles.supportItem}>
              <Mail size={18} color="#FDE047" />
              <Text style={styles.supportItemText}>support@DigiSewa.org</Text>
            </View>
            <View style={styles.supportItem}>
              <Phone size={18} color="#FDE047" />
              <Text style={styles.supportItemText}>+918981829273 (Mon-Sat 9AM-7PM)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBanner: {
    backgroundColor: '#6B21A8',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 10,
  },
  headerSubtitle: {
    color: '#E9D5FF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionPillPrimary: {
    backgroundColor: '#FDE047',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionPillPrimaryText: {
    color: '#4C1D95',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  actionPillSecondary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  actionPillSecondaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  scrollBody: {
    padding: 16,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 8,
  },
  sectionParagraph: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stepBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    minWidth: 200,
  },
  stepBadge: {
    backgroundColor: '#DDD6FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  stepBadgeText: {
    color: '#5B21B6',
    fontSize: 11,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  featureBoxGreen: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  featureBoxPurple: {
    flexDirection: 'row',
    backgroundColor: '#F3E8FF',
    borderColor: '#DDD6FE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  featureBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  featureBoxText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  faqAccordionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  faqAccordionCardActive: {
    borderColor: '#A78BFA',
    backgroundColor: '#FAF5FF',
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 10,
  },
  faqAnswerContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  faqAnswerText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  supportCard: {
    backgroundColor: '#581C87',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  supportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  supportHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
  supportHeaderSub: {
    color: '#E9D5FF',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  supportInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportItemText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});
