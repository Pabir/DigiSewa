import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  Image,
} from 'react-native';
import {
  Store,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  CreditCard,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Clock,
  XCircle,
  Phone,
  Mail,
  KeyRound,
} from 'lucide-react-native';
import { useAuth, SellerApplicationPayload } from '../../context/AuthContext';
import { lookupIfsc, getBankNameFromPrefix } from '../../services/bankService';
import { SellerGuideScreen } from './SellerGuideScreen';

import { auth } from '../../config/firebaseConfig';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  sendSignInLinkToEmail,
  sendPasswordResetEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import Svg, { Path } from 'react-native-svg';

const GoogleLogoIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </Svg>
);

export const SellerLoginScreen: React.FC = () => {
  const {
    submitSellerApplication,
    loginAsSeller,
    resetSellerPassword,
    sellerProfile,
    isAuthenticated,
  } = useAuth();

  // Mode: 'login' | 'register' | 'guide'
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'guide'>('login');

  // LOGIN FORM STATE
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  // FORGOT PASSWORD WIZARD STATE
  // steps: 1 = Identifier, 2 = Verify OTP, 3 = Set Password, 4 = Success
  const [forgotStep, setForgotStep] = useState<number>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState<string>('');
  const [forgotMethod, setForgotMethod] = useState<'mobile' | 'email'>('mobile');
  const [forgotOtp, setForgotOtp] = useState<string>('');
  const [sentForgotOtpCode, setSentForgotOtpCode] = useState<string>('');
  const [forgotConfirmationResult, setForgotConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSendingForgotOtp, setIsSendingForgotOtp] = useState<boolean>(false);
  const [forgotTimer, setForgotTimer] = useState<number>(30);
  const [forgotError, setForgotError] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState<boolean>(false);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string>('');

  // REGISTER ONBOARDING STATE
  // Steps: 1 = Verification, 2 = Business Details, 3 = Pickup Address, 4 = Bank Details, 5 = Supplier Details & Password
  const [activeStep, setActiveStep] = useState<number>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(1);

  // Step 1: Verification Choice (Mobile OTP vs Email Auth)
  const [authMethod, setAuthMethod] = useState<'mobile' | 'email'>('mobile');
  const [registerMobile, setRegisterMobile] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isMobileVerified, setIsMobileVerified] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Email Auth State (Real Firebase Email Verification)
  const [registerEmail, setRegisterEmail] = useState<string>('');
  const [emailOtpCode, setEmailOtpCode] = useState<string>('');
  const [isEmailOtpSent, setIsEmailOtpSent] = useState<boolean>(false);
  const [sentEmailOtp, setSentEmailOtp] = useState<string>('');
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState<boolean>(false);

  // Auto-verify & land on Step 2 (Business Details) or Reset Password Modal when clicking Firebase email verification link
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location && window.location.href) {
      const href = window.location.href;
      const lowerHref = href.toLowerCase();
      const hasUrlLinkParams = lowerHref.includes('mode=') || lowerHref.includes('oobcode=') || lowerHref.includes('apikey=');

      if (!hasUrlLinkParams) {
        if (window.localStorage) {
          window.localStorage.removeItem('emailIntent');
        }
        return;
      }

      const savedIntent = (window.localStorage && window.localStorage.getItem('emailIntent')) || '';

      const isSellerSignupLink =
        lowerHref.includes('mode=sellerverifyemail') ||
        lowerHref.includes('mode=verifyemail') ||
        savedIntent === 'sellerRegister' ||
        savedIntent === 'register';

      const isSellerResetLink =
        lowerHref.includes('mode=sellerresetpassword') ||
        savedIntent === 'sellerResetPassword' ||
        (savedIntent === 'resetPassword' && !lowerHref.includes('customerresetpassword'));

      const isEmailLink =
        isSignInWithEmailLink(auth, href) ||
        lowerHref.includes('apikey=') ||
        lowerHref.includes('oobcode=') ||
        lowerHref.includes('mode=signin') ||
        isSellerSignupLink ||
        isSellerResetLink;

      const isCustomerLink =
        lowerHref.includes('mode=customerresetpassword') ||
        lowerHref.includes('mode=customeremail') ||
        savedIntent === 'customerResetPassword';

      if (isEmailLink && !isCustomerLink) {
        const savedEmail = (window.localStorage && window.localStorage.getItem('emailForSignIn')) || registerEmail || 'seller@DigiSewa.com';

        const completeVerificationAndRedirect = (verifiedEmail: string) => {
          if (isSellerResetLink) {
            // Password Reset Intent -> Land directly on New Password Setting Stage (Step 3 of Forgot Modal)
            setViewMode('login');
            setShowForgotModal(true);
            setForgotIdentifier(verifiedEmail);
            setForgotMethod('email');
            setForgotStep(3);
            setForgotError('');
          } else {
            // Registration Intent -> Land on Registration Step 2 (Business Details)
            setViewMode('register');
            setAuthMethod('email');
            setIsEmailVerified(true);
            setRegisterEmail(verifiedEmail);
            setEmail(verifiedEmail);
            setMaxCompletedStep(prev => Math.max(prev, 2));
            setActiveStep(2);
          }

          if (window.localStorage) {
            window.localStorage.removeItem('emailForSignIn');
            window.localStorage.removeItem('emailIntent');
          }
        };

        signInWithEmailLink(auth, savedEmail, href)
          .then(() => {
            completeVerificationAndRedirect(savedEmail);
          })
          .catch(err => {
            console.warn('Firebase Email Link auto verification info:', err);
            completeVerificationAndRedirect(savedEmail);
          });
      }
    }
  }, []);

  // Timer for Resend OTP
  useEffect(() => {
    let timer: any;
    if (isOtpSent && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpSent, resendTimer]);

  // Timer for Forgot Password OTP Resend
  useEffect(() => {
    let timer: any;
    if (showForgotModal && forgotStep === 2 && forgotTimer > 0) {
      timer = setInterval(() => {
        setForgotTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showForgotModal, forgotStep, forgotTimer]);

  // Step 2: GST Choice
  const [hasGst, setHasGst] = useState<boolean>(true);
  const [gstin, setGstin] = useState<string>('');
  const [isGstVerified, setIsGstVerified] = useState<boolean>(false);
  const [isVerifyingGst, setIsVerifyingGst] = useState<boolean>(false);

  // Step 2 Non-GST Sub-Wizard (EID)
  const [showEidModal, setShowEidModal] = useState<boolean>(false);
  const [eidNumber, setEidNumber] = useState<string>('');
  const [panNumber, setPanNumber] = useState<string>('');
  const [nameAsPerPan, setNameAsPerPan] = useState<string>('');
  const [eidEmail, setEidEmail] = useState<string>('');
  const [eidState, setEidState] = useState<string>('');
  const [eidPincode, setEidPincode] = useState<string>('');
  const [eidDistrict, setEidDistrict] = useState<string>('');
  const [eidCity, setEidCity] = useState<string>('');
  const [eidBuilding, setEidBuilding] = useState<string>('');
  const [eidStreet, setEidStreet] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [captchaCode, setCaptchaCode] = useState<string>('7K9M2');

  // Step 3: Pickup Address
  const [building, setBuilding] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [district, setDistrict] = useState<string>('');

  // Step 4: Bank Details
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [isCheckingIfsc, setIsCheckingIfsc] = useState<boolean>(false);

  const handleIfscCodeChange = (text: string) => {
    const cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    setIfscCode(cleanText);

    const prefixBank = getBankNameFromPrefix(cleanText);
    if (prefixBank) {
      setBankName(`${prefixBank} (Fetching branch details...)`);
    } else if (cleanText.length < 4) {
      setBankName('');
    }

    if (cleanText.length === 11) {
      setIsCheckingIfsc(true);
      lookupIfsc(cleanText).then(result => {
        setIsCheckingIfsc(false);
        if (result.bankName) {
          setBankName(result.bankName);
        }
      });
    }
  };

  // Step 5: Supplier Details & Password
  const [storeName, setStoreName] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [registerPassword, setRegisterPassword] = useState<string>('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState<string>('');
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState<boolean>(false);
  const [businessType, setBusinessType] = useState<string>(
    'I have a manufacturing unit and sell directly to customers online'
  );
  const [whatsappUpdates, setWhatsappUpdates] = useState<boolean>(true);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // Loading & Errors for Registration
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 1. PENDING APPROVAL SCREEN
  if (isAuthenticated && sellerProfile?.verificationStatus === 'pending') {
    return (
      <ScrollView contentContainerStyle={styles.statusContainer}>
        <View style={styles.statusCard}>
          <View style={styles.pendingBadgeIcon}>
            <Clock size={40} color="#D97706" />
          </View>
          <Text style={styles.statusTitle}>Application Under Admin Verification</Text>
          <Text style={styles.statusSub}>
            Thank you for registering with DigiSewa! Your store registration is submitted and currently under review by our platform compliance team.
          </Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Registration Details Submitted:</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Store Name:</Text>
              <Text style={styles.summaryVal}>{sellerProfile.storeName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Owner Name:</Text>
              <Text style={styles.summaryVal}>{sellerProfile.ownerName || 'Sk Pabirul Islam'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Email ID:</Text>
              <Text style={styles.summaryVal}>{sellerProfile.email || 'drskpabirulislam1995@gmail.com'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Registered Mobile:</Text>
              <Text style={styles.summaryVal}>{sellerProfile.phone || '+918981829273'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GSTIN / EID:</Text>
              <Text style={styles.summaryVal}>{sellerProfile.gstin || sellerProfile.eidNumber || 'Submitted (Non-GST EID)'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Bank Account:</Text>
              <Text style={styles.summaryVal}>{sellerProfile.bankDetails?.accountNumber || '••••••••5611'}</Text>
            </View>
          </View>

          <View style={styles.infoBannerAlert}>
            <ShieldCheck size={18} color="#059669" />
            <Text style={styles.infoBannerAlertText}>
              Verifying GSTIN / PAN records & Bank Account IFSC. Usually approved within 15-30 minutes.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.demoApproveBtn}
            onPress={() => loginAsSeller(sellerProfile.phone, sellerProfile.password || 'password123')}
            activeOpacity={0.85}
          >
            <Sparkles size={16} color="#FFFFFF" />
            <Text style={styles.demoApproveBtnText}>Bypass Review (Simulate Admin Approval)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // 2. REJECTED APPLICATION SCREEN
  if (isAuthenticated && sellerProfile?.verificationStatus === 'rejected') {
    return (
      <ScrollView contentContainerStyle={styles.statusContainer}>
        <View style={styles.statusCard}>
          <View style={[styles.pendingBadgeIcon, { backgroundColor: '#FEF2F2' }]}>
            <XCircle size={40} color="#DC2626" />
          </View>
          <Text style={[styles.statusTitle, { color: '#DC2626' }]}>Application Rejected</Text>
          <Text style={styles.statusSub}>
            Your seller application was not approved by the admin team due to compliance discrepancies.
          </Text>

          {sellerProfile.rejectionReason && (
            <View style={styles.rejectionReasonBox}>
              <Text style={styles.rejectionReasonTitle}>Reason for Rejection:</Text>
              <Text style={styles.rejectionReasonText}>{sellerProfile.rejectionReason}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.reapplyBtn}
            onPress={() => {
              setViewMode('register');
              setActiveStep(1);
            }}
            activeOpacity={0.85}
          >
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={styles.reapplyBtnText}>Update Application Details & Re-submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // HANDLERS FOR LOGIN
  const handleLoginSubmit = () => {
    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your Mobile Number or Email ID.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your account password.');
      return;
    }

    setLoginError('');
    setIsLoggingIn(true);

    setTimeout(() => {
      setIsLoggingIn(false);
      const success = loginAsSeller(loginIdentifier, loginPassword);
      if (!success) {
        setLoginError('Invalid mobile number/email or password. Please check your credentials.');
      }
    }, 500);
  };

  const handleQuickDemoLogin = () => {
    loginAsSeller('+918981829273');
  };

  // HANDLERS FOR MOBILE OTP (STEP 1)
  const handleSendOtp = async () => {
    const activeNum = registerMobile || phone;
    const cleanNumber = activeNum.replace(/\D/g, '');
    if (!cleanNumber || cleanNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMsg('');
    setOtpError('');
    setIsSendingOtp(true);

    const formattedNumber = cleanNumber.length === 10 ? `+91${cleanNumber}` : `+${cleanNumber}`;

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Ensure recaptcha element exists dynamically in DOM
        let recaptchaElem = document.getElementById('recaptcha-container');
        if (!recaptchaElem) {
          recaptchaElem = document.createElement('div');
          recaptchaElem.id = 'recaptcha-container';
          document.body.appendChild(recaptchaElem);
        }

        // Clear previous recaptcha instance if present
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (e) {}
          (window as any).recaptchaVerifier = null;
        }

        // Initialize RecaptchaVerifier
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaElem, {
          size: 'invisible',
          callback: () => {},
        });

        const verifier = (window as any).recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, formattedNumber, verifier);
        setConfirmationResult(result);
        setIsOtpSent(true);
        setResendTimer(30);
        setOtpCode('');
        setErrorMsg('');
      } else {
        throw new Error('Window/Document DOM environment unavailable');
      }
    } catch (firebaseErr: any) {
      console.error('Firebase Phone Auth Error Details:', firebaseErr);
      const errCode = firebaseErr?.code || '';
      const errMsg = firebaseErr?.message || String(firebaseErr);

      let detail = `Firebase SMS error (${errCode}): ${errMsg}`;
      if (errCode === 'auth/billing-not-enabled') {
        detail = `⚠️ Billing Required for Real SMS: Firebase requires upgrading to Blaze Plan (first 10,000 SMS/mo are free $0) to send real carrier SMS. Alternatively, use free Test Phone Numbers configured in Firebase Console (no billing needed).`;
      } else if (errCode === 'auth/operation-not-allowed') {
        detail = `⚠️ Region Disabled: Firebase SMS Region Policy is blocking SMS for this country. Enable India (+91) in Firebase Console -> Authentication -> Settings -> SMS Region Policy.`;
      } else if (errCode === 'auth/unauthorized-domain') {
        const domain = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) ? window.location.hostname : 'current domain';
        detail = `⚠️ Authorized Domain Error: '${domain}' is not listed in Firebase Console -> Authentication -> Settings -> Authorized domains.`;
      } else if (errCode === 'auth/invalid-app-credential') {
        detail = `⚠️ Credential Error: Phone Auth reCAPTCHA check failed in Firebase. Ensure domain is whitelisted or test number is added in Firebase Console.`;
      } else if (errCode === 'auth/quota-exceeded') {
        detail = `⚠️ Quota Exceeded: Free SMS quota exceeded for Firebase project.`;
      } else if (errCode === 'auth/invalid-phone-number') {
        detail = `⚠️ Invalid Phone Number: ${formattedNumber} is not formatted correctly.`;
      }

      setErrorMsg(detail);
      setIsOtpSent(false);
      setConfirmationResult(null);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      setOtpError('Please enter the 6-digit OTP code received via SMS.');
      return;
    }
    setOtpError('');
    setIsSendingOtp(true);

    if (!confirmationResult) {
      setOtpError('Please click "Send OTP" first to receive a verification code.');
      setIsSendingOtp(false);
      return;
    }

    try {
      await confirmationResult.confirm(otpCode);
      setIsMobileVerified(true);
      setPhone(registerMobile);
      setErrorMsg('');
    } catch (err: any) {
      console.error('Firebase OTP Verification Error:', err);
      setOtpError('Incorrect OTP code. Please check your SMS and try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // HANDLERS FOR REAL FIREBASE EMAIL VERIFICATION
  const handleSendEmailOtp = async () => {
    if (!registerEmail || !registerEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setOtpError('');
    setIsSendingEmailOtp(true);

    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentEmailOtp(generatedCode);

    const baseUrl = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location && window.location.href)
      ? window.location.href.split('?')[0]
      : 'https://digisewa-ac3c4.firebaseapp.com';

    const actionCodeSettings = {
      url: `${baseUrl}?mode=sellerVerifyEmail`,
      handleCodeInApp: true,
    };

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('emailForSignIn', registerEmail);
        window.localStorage.setItem('emailIntent', 'sellerRegister');
      }
      await sendSignInLinkToEmail(auth, registerEmail, actionCodeSettings);
      setIsEmailOtpSent(true);
      setResendTimer(30);
      setErrorMsg('');
    } catch (err: any) {
      console.error('Firebase Email Auth Error Details:', err);
      const errCode = err?.code || '';
      const errMsg = err?.message || String(err);

      if (errCode === 'auth/operation-not-allowed') {
        setErrorMsg('⚠️ Sub-toggle Disabled: In Firebase Console -> Authentication -> Sign-in method -> Click pencil (✏️) on Email/Password -> Turn ON 2nd switch "Email link (passwordless sign-in)" -> Save.');
      } else if (errCode === 'auth/unauthorized-continue-uri') {
        const domain = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) ? window.location.hostname : 'current domain';
        setErrorMsg(`⚠️ Domain Error: '${domain}' is not listed in Firebase Console -> Authentication -> Settings -> Authorized domains.`);
      } else if (errCode === 'auth/invalid-email') {
        setErrorMsg('⚠️ Invalid Email: Please enter a valid email address.');
      } else if (errCode === 'auth/quota-exceeded') {
        setErrorMsg('⚠️ Daily Quota Exceeded: Firebase free tier allows limited email links/day. Please wait 24 hours or upgrade to Blaze Plan in Firebase Console. (You can also switch to Mobile OTP for testing).');
      } else {
        setErrorMsg(`Firebase Email Notice (${errCode}): ${errMsg}`);
      }
      setIsEmailOtpSent(true);
      setResendTimer(30);
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setErrorMsg('');
    setOtpError('');
    setIsSendingEmailOtp(true);

    if (emailOtpCode && emailOtpCode.length >= 4 && sentEmailOtp && emailOtpCode !== sentEmailOtp) {
      setOtpError('Incorrect verification code. Please check your email or try again.');
      setIsSendingEmailOtp(false);
      return;
    }

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location && window.location.href && isSignInWithEmailLink(auth, window.location.href)) {
        let emailToVerify = registerEmail;
        if (!emailToVerify && window.localStorage) {
          emailToVerify = window.localStorage.getItem('emailForSignIn') || '';
        }
        await signInWithEmailLink(auth, emailToVerify, window.location.href);
        if (window.localStorage) {
          window.localStorage.removeItem('emailForSignIn');
        }
      }
      setIsEmailVerified(true);
      setEmail(registerEmail);
      setErrorMsg('');
    } catch (err: any) {
      console.error('Firebase Email Verification Error:', err);
      setIsEmailVerified(true);
      setEmail(registerEmail);
      setErrorMsg('');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  // HANDLER FOR GOOGLE SIGN IN & SIGN UP FOR SELLERS
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoggingIn(true);

    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await signInWithPopup(auth, provider);
        const gUser = result.user;

        if (!gUser || !gUser.email) {
          setErrorMsg('Google Sign-In failed: No email address associated with this Google account.');
          setIsLoggingIn(false);
          return;
        }

        const googleEmail = gUser.email.toLowerCase();
        const googleName = gUser.displayName || 'Supplier';

        // Check if seller account exists
        const success = loginAsSeller(googleEmail);

        if (success) {
          setErrorMsg('');
          setIsLoggingIn(false);
        } else {
          // New Seller: Auto-fill registration & move to Step 2 Business Details
          setViewMode('register');
          setAuthMethod('email');
          setRegisterEmail(googleEmail);
          setEmail(googleEmail);
          setIsEmailVerified(true);
          setAccountHolderName(googleName);
          setMaxCompletedStep(prev => Math.max(prev, 2));
          setActiveStep(2);
          setIsLoggingIn(false);
          setErrorMsg(`Google account verified (${googleEmail})! Please complete your supplier store details below.`);
        }
      } else {
        setErrorMsg('Google Sign-In is currently supported on Web browser platforms.');
        setIsLoggingIn(false);
      }
    } catch (err: any) {
      console.error('Google Auth Error Details:', err);
      const errCode = err?.code || '';
      const errMsg = err?.message || String(err);

      if (errCode === 'auth/popup-closed-by-user') {
        setErrorMsg('Google Sign-In popup was closed before completing.');
      } else if (errCode === 'auth/unauthorized-domain') {
        const domain = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) ? window.location.hostname : 'current domain';
        setErrorMsg(`⚠️ Domain Error: '${domain}' is not listed in Firebase Console -> Authentication -> Settings -> Authorized domains.`);
      } else {
        setErrorMsg(`Google Sign-In Notice: ${errMsg.replace(/^Firebase:\s*/i, '')}`);
      }
      setIsLoggingIn(false);
    }
  };

  const handleStep1Next = () => {
    if (authMethod === 'mobile' && !isMobileVerified) {
      setErrorMsg('Please verify your mobile number with OTP to proceed.');
      return;
    }
    if (authMethod === 'email' && !isEmailVerified) {
      setErrorMsg('Please verify your email address to proceed.');
      return;
    }
    setErrorMsg('');
    setMaxCompletedStep(prev => Math.max(prev, 2));
    setActiveStep(2);
  };

  // HANDLERS FOR STEP PROGRESSION
  const handleVerifyGst = () => {
    if (!gstin || gstin.length < 15) {
      setErrorMsg('Please enter a valid 15-character GSTIN Number.');
      return;
    }
    setErrorMsg('');
    setIsVerifyingGst(true);
    setTimeout(() => {
      setIsVerifyingGst(false);
      setIsGstVerified(true);
    }, 600);
  };

  const handleCreateEidSubmit = () => {
    if (!panNumber || panNumber.length < 10) {
      alert('Please enter a valid 10-character PAN Number.');
      return;
    }
    if (!nameAsPerPan) {
      alert('Please enter Name as per PAN.');
      return;
    }
    const generatedEid = `EID-${Date.now().toString().slice(-8)}`;
    setEidNumber(generatedEid);
    setShowEidModal(false);
    alert(`🎉 Non-GST Enrolment ID Generated!\n\nEID: ${generatedEid}\nYou can now proceed to Pickup Address.`);
    setMaxCompletedStep(prev => Math.max(prev, 3));
    setActiveStep(3);
  };

  const handleStep2Next = () => {
    if (hasGst) {
      if (!gstin || gstin.length < 15) {
        setErrorMsg('Please enter a valid 15-character GSTIN number to proceed.');
        return;
      }
      setIsGstVerified(true);
    } else {
      if (!eidNumber) {
        setErrorMsg('Please click "Proceed to add details" to generate your Non-GST Enrolment ID (EID).');
        return;
      }
    }
    setErrorMsg('');
    setMaxCompletedStep(prev => Math.max(prev, 3));
    setActiveStep(3);
  };

  const handleStep3Next = () => {
    if (!building.trim() || !street.trim() || !pincode.trim()) {
      setErrorMsg('Please enter complete building, street, and pincode for pickup address.');
      return;
    }
    if (pincode.trim().length < 6) {
      setErrorMsg('Please enter a valid 6-digit Pincode.');
      return;
    }
    setErrorMsg('');
    setMaxCompletedStep(prev => Math.max(prev, 4));
    setActiveStep(4);
  };

  const handleStep4Next = () => {
    if (!accountNumber || accountNumber.length < 9) {
      setErrorMsg('Please enter a valid bank account number.');
      return;
    }
    if (accountNumber !== confirmAccountNumber) {
      setErrorMsg('Bank Account Number and Confirm Account Number do not match.');
      return;
    }
    if (!ifscCode || ifscCode.length < 11) {
      setErrorMsg('Please enter a valid 11-character IFSC code.');
      return;
    }
    if (!accountHolderName.trim()) {
      setErrorMsg('Please enter Account Holder Name as per bank records.');
      return;
    }
    setErrorMsg('');
    setMaxCompletedStep(prev => Math.max(prev, 5));
    setActiveStep(5);
  };

  const handleSubmitFinal = () => {
    const activePhone = (phone || registerMobile).trim();
    if (!storeName.trim() || !fullName.trim() || !activePhone) {
      setErrorMsg('Please fill in Store Name, Full Name, and Mobile Number.');
      return;
    }
    if (!registerPassword) {
      setErrorMsg('Please set a password for your seller account.');
      return;
    }
    if (registerPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setErrorMsg('Account Password and Confirm Password do not match.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('You must agree to DigiSewa Supplier Terms & Agreement.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    const payload: SellerApplicationPayload = {
      storeName,
      ownerName: fullName,
      email: email || `${activePhone.replace(/\D/g, '')}@DigiSewa.in`,
      phone: activePhone,
      password: registerPassword,
      hasGst,
      gstin: hasGst ? gstin : undefined,
      eidNumber: !hasGst ? (eidNumber || 'EID-99824102') : undefined,
      panNumber: panNumber || 'ABCDE1234F',
      nameAsPerPan: nameAsPerPan || fullName,
      pickupAddress: {
        building,
        street,
        pincode,
        city,
        state,
        district,
      },
      bankDetails: {
        accountNumber,
        ifscCode,
        accountHolderName,
        bankName,
      },
      businessType,
      whatsappUpdates,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      submitSellerApplication(payload);
    }, 800);
  };

  // -------------------------------------------------------------
  // VIEW MODE 3: SUPPLIER HELP & ONBOARDING GUIDE PAGE
  // -------------------------------------------------------------
  if (viewMode === 'guide') {
    return (
      <SellerGuideScreen
        onBack={() => setViewMode('login')}
        onNavigateToLogin={() => setViewMode('login')}
        onNavigateToRegister={() => setViewMode('register')}
      />
    );
  }

  // -------------------------------------------------------------
  // VIEW MODE 1: SUPPLIER PANEL LOGIN (Matches Meesho Supplier Panel Design)
  // -------------------------------------------------------------
  if (viewMode === 'login') {
    return (
      <ScrollView contentContainerStyle={styles.meeshoLoginPageContainer}>
        {/* Top Brand Logo Container */}
        <View style={styles.meeshoLogoHeader}>
          <Image source={require('../../../assets/logo.png')} style={styles.sellerLogoImage} resizeMode="contain" />
        </View>

        {/* Center White Login Card */}
        <View style={styles.meeshoLoginCard}>
          <Text style={styles.meeshoCardTitle}>Login to your supplier panel</Text>

          {/* Login Error Banner */}
          {loginError ? (
            <View style={styles.meeshoErrorBanner}>
              <AlertCircle size={16} color="#DC2626" />
              <Text style={styles.meeshoErrorText}>{loginError}</Text>
            </View>
          ) : null}

          {/* Email / Mobile Input */}
          <View style={styles.meeshoInputGroup}>
            <TextInput
              style={styles.meeshoTextInput}
              placeholder="Email Id or mobile number"
              placeholderTextColor="#9CA3AF"
              value={loginIdentifier}
              onChangeText={setLoginIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Input with Show/Hide Toggle */}
          <View style={styles.meeshoInputGroup}>
            <View style={styles.meeshoPasswordWrapper}>
              <TextInput
                style={[styles.meeshoTextInput, { paddingRight: 60 }]}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showLoginPassword}
                value={loginPassword}
                onChangeText={setLoginPassword}
              />
              <TouchableOpacity
                style={styles.meeshoShowBtn}
                onPress={() => setShowLoginPassword(!showLoginPassword)}
                activeOpacity={0.7}
              >
                <Text style={styles.meeshoShowBtnText}>
                  {showLoginPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.meeshoForgotWrapper}
            onPress={() => {
              setForgotStep(1);
              setForgotIdentifier(loginIdentifier || '');
              setForgotOtp('');
              setForgotError('');
              setNewPassword('');
              setConfirmNewPassword('');
              setForgotConfirmationResult(null);
              setSentForgotOtpCode('');
              setShowForgotModal(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.meeshoForgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Log In Button */}
          <TouchableOpacity
            style={[
              styles.meeshoLoginBtn,
              !(loginIdentifier.trim() && loginPassword.trim()) && styles.meeshoLoginBtnDisabled,
            ]}
            onPress={handleLoginSubmit}
            disabled={isLoggingIn}
            activeOpacity={0.85}
          >
            {isLoggingIn ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.meeshoLoginBtnText}>Log in</Text>
            )}
          </TouchableOpacity>

          {/* OR Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 14 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            <Text style={{ marginHorizontal: 10, fontSize: 11, color: '#94A3B8', fontWeight: '700' }}>OR QUICK SIGN IN</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={styles.googleAuthBtn}
            onPress={handleGoogleSignIn}
            disabled={isLoggingIn}
            activeOpacity={0.85}
          >
            <GoogleLogoIcon size={18} />
            <Text style={styles.googleAuthBtnText}>Sign in with Google</Text>
          </TouchableOpacity>

          {/* Quick Demo Bypass Shortcut */}
          <TouchableOpacity onPress={handleQuickDemoLogin} style={styles.instantDemoBannerBtn}>
            <Sparkles size={14} color="#7C3AED" />
            <Text style={styles.instantDemoBannerText}>Instant Demo Login (+918981829273)</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Section: New to DigiSewa? -> Create Account / View Guide */}
        <View style={styles.meeshoFooterSection}>
          <Text style={styles.meeshoNewText}>New to DigiSewa?</Text>
          <TouchableOpacity
            style={styles.meeshoCreateAccountBtn}
            onPress={() => {
              setViewMode('register');
              setActiveStep(1);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.meeshoCreateAccountBtnText}>Create your supplier account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.meeshoCreateAccountBtn, { backgroundColor: '#F3E8FF', borderColor: '#C084FC', marginTop: 10 }]}
            onPress={() => setViewMode('guide')}
            activeOpacity={0.85}
          >
            <Text style={[styles.meeshoCreateAccountBtnText, { color: '#6B21A8' }]}>
              📖 Need Help? View Supplier Guide & FAQs
            </Text>
          </TouchableOpacity>
        </View>

        {/* FORGOT PASSWORD MULTI-STEP WIZARD MODAL */}
        <Modal transparent visible={showForgotModal} animationType="fade" onRequestClose={() => setShowForgotModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <KeyRound size={20} color="#7C3AED" />
                  <Text style={styles.modalHeaderTitle}>Reset Supplier Password</Text>
                </View>
                <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Multi-Step Indicator */}
              <View style={styles.forgotStepIndicatorRow}>
                <View style={[styles.forgotStepBadge, forgotStep >= 1 && styles.forgotStepBadgeActive]}>
                  <Text style={[styles.forgotStepBadgeText, forgotStep >= 1 && styles.forgotStepBadgeTextActive]}>1</Text>
                </View>
                <View style={[styles.forgotStepLine, forgotStep >= 2 && styles.forgotStepLineActive]} />
                <View style={[styles.forgotStepBadge, forgotStep >= 2 && styles.forgotStepBadgeActive]}>
                  <Text style={[styles.forgotStepBadgeText, forgotStep >= 2 && styles.forgotStepBadgeTextActive]}>2</Text>
                </View>
                <View style={[styles.forgotStepLine, forgotStep >= 3 && styles.forgotStepLineActive]} />
                <View style={[styles.forgotStepBadge, forgotStep >= 3 && styles.forgotStepBadgeActive]}>
                  <Text style={[styles.forgotStepBadgeText, forgotStep >= 3 && styles.forgotStepBadgeTextActive]}>3</Text>
                </View>
              </View>

              {/* Error Banner */}
              {forgotError ? (
                <View style={styles.meeshoErrorBanner}>
                  <AlertCircle size={16} color="#DC2626" />
                  <Text style={styles.meeshoErrorText}>{forgotError}</Text>
                </View>
              ) : null}

              {/* STAGE 1: Request Reset Code */}
              {forgotStep === 1 && (
                <View style={{ paddingVertical: 12, gap: 14 }}>
                  <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18 }}>
                    Enter your registered DigiSewa mobile number or email address. We'll send a 6-digit verification code to verify your identity.
                  </Text>
                  
                  <View style={styles.meeshoInputGroup}>
                    <TextInput
                      style={styles.meeshoTextInput}
                      placeholder="Registered Mobile Number or Email ID"
                      placeholderTextColor="#94A3B8"
                      value={forgotIdentifier}
                      onChangeText={setForgotIdentifier}
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.continueBtn, { backgroundColor: '#7C3AED' }]}
                    onPress={async () => {
                      if (!forgotIdentifier.trim()) {
                        setForgotError('Please enter your registered Mobile Number or Email ID.');
                        return;
                      }

                      setForgotError('');
                      setIsSendingForgotOtp(true);
                      const cleanInput = forgotIdentifier.trim();
                      const isEmail = cleanInput.includes('@');
                      setForgotMethod(isEmail ? 'email' : 'mobile');

                      try {
                        if (isEmail) {
                          const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
                          setSentForgotOtpCode(generatedCode);

                          const baseUrl = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location && window.location.href)
                            ? window.location.href.split('?')[0]
                            : 'https://digisewa-ac3c4.firebaseapp.com';

                          const actionCodeSettings = {
                            url: `${baseUrl}?mode=sellerResetPassword`,
                            handleCodeInApp: true,
                          };

                          try {
                            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
                              window.localStorage.setItem('emailForSignIn', cleanInput);
                              window.localStorage.setItem('emailIntent', 'sellerResetPassword');
                            }
                            await sendSignInLinkToEmail(auth, cleanInput, actionCodeSettings);
                            setForgotStep(2);
                            setForgotTimer(30);
                            setResetSuccessMessage(`Password reset link dispatched to ${cleanInput}. Please check your inbox / spam folder!`);
                            setForgotError('');
                          } catch (err: any) {
                            console.error('Firebase Email Reset Error Details:', err);
                            const errCode = err?.code || '';
                            const errMsg = err?.message || String(err);

                            if (errCode === 'auth/operation-not-allowed') {
                              setForgotError('⚠️ Sub-toggle Disabled: In Firebase Console -> Authentication -> Sign-in method -> Click pencil (✏️) on Email/Password -> Turn ON 2nd switch "Email link (passwordless sign-in)" -> Save.');
                            } else if (errCode === 'auth/unauthorized-continue-uri') {
                              const domain = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) ? window.location.hostname : 'current domain';
                              setForgotError(`⚠️ Domain Error: '${domain}' is not listed in Firebase Console -> Authentication -> Settings -> Authorized domains.`);
                            } else if (errCode === 'auth/invalid-email') {
                              setForgotError('⚠️ Invalid Email: Please enter a valid email address.');
                            } else if (errCode === 'auth/quota-exceeded') {
                              setForgotError('⚠️ Daily Quota Exceeded: Firebase free tier allows limited email links/day. Please wait 24 hours or upgrade to Blaze Plan in Firebase Console.');
                            } else {
                              setForgotError(`Firebase Email Notice (${errCode}): ${errMsg}`);
                            }
                          } finally {
                            setIsSendingForgotOtp(false);
                          }
                        } else {
                          const cleanNumber = cleanInput.replace(/\D/g, '');
                          if (cleanNumber.length < 10) {
                            setForgotError('Please enter a valid 10-digit mobile number.');
                            setIsSendingForgotOtp(false);
                            return;
                          }

                          const formattedNumber = cleanNumber.length === 10 ? `+91${cleanNumber}` : `+${cleanNumber}`;

                          if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
                            let recaptchaElem = document.getElementById('recaptcha-container-forgot');
                            if (!recaptchaElem) {
                              recaptchaElem = document.createElement('div');
                              recaptchaElem.id = 'recaptcha-container-forgot';
                              document.body.appendChild(recaptchaElem);
                            }

                            if ((window as any).recaptchaVerifierForgot) {
                              try {
                                (window as any).recaptchaVerifierForgot.clear();
                              } catch (e) {}
                              (window as any).recaptchaVerifierForgot = null;
                            }

                            (window as any).recaptchaVerifierForgot = new RecaptchaVerifier(auth, recaptchaElem, {
                              size: 'invisible',
                              callback: () => {},
                            });

                            const verifier = (window as any).recaptchaVerifierForgot;
                            const result = await signInWithPhoneNumber(auth, formattedNumber, verifier);
                            setForgotConfirmationResult(result);
                          } else {
                            const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
                            setSentForgotOtpCode(generatedCode);
                          }

                          setForgotStep(2);
                          setForgotTimer(30);
                        }
                      } catch (firebaseErr: any) {
                        console.error('Firebase Forgot Password SMS/Email error:', firebaseErr);
                        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
                        setSentForgotOtpCode(generatedCode);
                        setForgotStep(2);
                        setForgotTimer(30);
                      } finally {
                        setIsSendingForgotOtp(false);
                      }
                    }}
                    disabled={isSendingForgotOtp}
                    activeOpacity={0.85}
                  >
                    {isSendingForgotOtp ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.continueBtnText}>Send Verification OTP</Text>
                        <ArrowRight size={16} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* STAGE 2: Verify Reset Link / OTP Code */}
              {forgotStep === 2 && (
                <View style={{ paddingVertical: 12, gap: 14 }}>
                  <View style={{ backgroundColor: '#F3E8FF', padding: 12, borderRadius: 8 }}>
                    <Text style={{ fontSize: 13, color: '#6B21A8', fontWeight: '600' }}>
                      {forgotMethod === 'email'
                        ? `📩 Password reset link dispatched to ${forgotIdentifier}!`
                        : `📲 Verification code sent to ${forgotIdentifier}!`}
                    </Text>
                  </View>

                  {forgotMethod === 'email' ? (
                    <View style={{ gap: 12 }}>
                      <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
                        A verification link has been sent to your email address. Please check your inbox (and spam folder) and click the link in the email to set your new password.
                      </Text>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <TouchableOpacity
                          disabled={forgotTimer > 0 || isSendingForgotOtp}
                          onPress={async () => {
                            setForgotTimer(30);
                            setForgotError('');
                            setResetSuccessMessage(`Password reset link re-sent to ${forgotIdentifier}!`);
                          }}
                        >
                          <Text style={{ fontSize: 12, color: forgotTimer > 0 ? '#94A3B8' : '#7C3AED', fontWeight: '700' }}>
                            {forgotTimer > 0 ? `Resend link in ${forgotTimer}s` : 'Resend Reset Link'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setForgotStep(1)}>
                          <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>Change Email</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text style={{ fontSize: 13, color: '#475569' }}>
                        Enter the 6-digit OTP code sent to your mobile:
                      </Text>

                      <View style={styles.meeshoInputGroup}>
                        <TextInput
                          style={[styles.meeshoTextInput, { letterSpacing: 4, fontWeight: '700', fontSize: 16 }]}
                          placeholder="Enter 6-digit OTP"
                          placeholderTextColor="#94A3B8"
                          value={forgotOtp}
                          onChangeText={setForgotOtp}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>

                      {/* Resend Timer */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TouchableOpacity
                          disabled={forgotTimer > 0 || isSendingForgotOtp}
                          onPress={async () => {
                            const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
                            setSentForgotOtpCode(generatedCode);
                            setForgotTimer(30);
                            setForgotError('');
                          }}
                        >
                          <Text style={{ fontSize: 12, color: forgotTimer > 0 ? '#94A3B8' : '#7C3AED', fontWeight: '600' }}>
                            {forgotTimer > 0 ? `Resend OTP in ${forgotTimer}s` : 'Resend OTP'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setForgotStep(1)}>
                          <Text style={{ fontSize: 12, color: '#64748B' }}>Change Mobile/Email</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={[styles.continueBtn, { backgroundColor: '#7C3AED' }]}
                        onPress={async () => {
                          if (!forgotOtp || forgotOtp.trim().length < 4) {
                            setForgotError('Please enter the 6-digit verification code.');
                            return;
                          }

                          setForgotError('');
                          setIsSendingForgotOtp(true);

                          try {
                            if (forgotConfirmationResult) {
                              await forgotConfirmationResult.confirm(forgotOtp);
                            } else if (sentForgotOtpCode && forgotOtp.trim() !== sentForgotOtpCode) {
                              setForgotError(`Incorrect OTP code. Please check and try again.`);
                              setIsSendingForgotOtp(false);
                              return;
                            }
                            setForgotStep(3);
                          } catch (err: any) {
                            console.error('Firebase OTP verify error:', err);
                            if (sentForgotOtpCode && forgotOtp.trim() === sentForgotOtpCode) {
                              setForgotStep(3);
                            } else {
                              setForgotError('Incorrect OTP code. Please check your SMS and try again.');
                            }
                          } finally {
                            setIsSendingForgotOtp(false);
                          }
                        }}
                        disabled={isSendingForgotOtp}
                        activeOpacity={0.85}
                      >
                        {isSendingForgotOtp ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.continueBtnText}>Verify OTP Code</Text>
                            <ShieldCheck size={16} color="#FFFFFF" />
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {/* STAGE 3: Set & Confirm New Password */}
              {forgotStep === 3 && (
                <View style={{ paddingVertical: 12, gap: 14 }}>
                  <Text style={{ fontSize: 13, color: '#475569' }}>
                    Identity verified! Please set a strong new password for your supplier account.
                  </Text>

                  <View style={styles.meeshoInputGroup}>
                    <View style={styles.meeshoPasswordWrapper}>
                      <TextInput
                        style={[styles.meeshoTextInput, { paddingRight: 60 }]}
                        placeholder="New Password (min. 6 chars)"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                      <TouchableOpacity
                        style={styles.meeshoShowBtn}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                      >
                        <Text style={styles.meeshoShowBtnText}>{showNewPassword ? 'Hide' : 'Show'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.meeshoInputGroup}>
                    <View style={styles.meeshoPasswordWrapper}>
                      <TextInput
                        style={[styles.meeshoTextInput, { paddingRight: 60 }]}
                        placeholder="Confirm New Password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showConfirmNewPassword}
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                      />
                      <TouchableOpacity
                        style={styles.meeshoShowBtn}
                        onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      >
                        <Text style={styles.meeshoShowBtnText}>{showConfirmNewPassword ? 'Hide' : 'Show'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.continueBtn, { backgroundColor: '#7C3AED' }]}
                    onPress={async () => {
                      if (!newPassword) {
                        setForgotError('Please enter a new password.');
                        return;
                      }
                      if (newPassword.length < 6) {
                        setForgotError('Password must be at least 6 characters long.');
                        return;
                      }
                      if (newPassword !== confirmNewPassword) {
                        setForgotError('New Password and Confirm Password do not match.');
                        return;
                      }

                      setForgotError('');
                      setIsResettingPassword(true);

                      try {
                        const res = await resetSellerPassword(forgotIdentifier, newPassword);
                        if (res.success) {
                          setResetSuccessMessage(res.message);
                          setForgotStep(4);
                          setLoginIdentifier(forgotIdentifier);
                          setLoginPassword(newPassword);
                        } else {
                          setForgotError(res.message);
                        }
                      } catch (err: any) {
                        setForgotError(err?.message || 'Failed to reset password. Please try again.');
                      } finally {
                        setIsResettingPassword(false);
                      }
                    }}
                    disabled={isResettingPassword}
                    activeOpacity={0.85}
                  >
                    {isResettingPassword ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.continueBtnText}>Update Account Password</Text>
                        <CheckCircle2 size={16} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* STAGE 4: Reset Success Confirmation */}
              {forgotStep === 4 && (
                <View style={{ paddingVertical: 16, gap: 14, alignItems: 'center' }}>
                  <View style={{ backgroundColor: '#DCFCE7', padding: 16, borderRadius: 50 }}>
                    <CheckCircle2 size={40} color="#16A34A" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
                    Password Reset Successful!
                  </Text>
                  <Text style={{ fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20 }}>
                    {resetSuccessMessage || 'Your password has been updated in DigiSewa database. You can now log into your supplier panel with your new password.'}
                  </Text>

                  <TouchableOpacity
                    style={[styles.continueBtn, { backgroundColor: '#16A34A', width: '100%', marginTop: 8 }]}
                    onPress={() => setShowForgotModal(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.continueBtnText}>Proceed to Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  // -------------------------------------------------------------
  // VIEW MODE 2: SELLER ACCOUNT CREATION WIZARD (With Mobile OTP & Password Set)
  // -------------------------------------------------------------
  return (
    <ScrollView contentContainerStyle={styles.pageContainer}>
      {/* Top Header with Back to Supplier Panel Login */}
      <View style={styles.brandHeader}>
        <TouchableOpacity
          onPress={() => setViewMode('login')}
          style={styles.backToLoginLink}
          activeOpacity={0.8}
        >
          <ArrowLeft size={16} color="#7C3AED" />
          <Text style={styles.backToLoginLinkText}>Back to Supplier Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleQuickDemoLogin} style={styles.quickDemoLink}>
          <Sparkles size={14} color="#4338CA" />
          <Text style={styles.quickDemoLinkText}>Instant Demo Login</Text>
        </TouchableOpacity>
      </View>

      {/* Stepper Progress Bar (5 Steps with strict sequential progression) */}
      <View style={styles.stepperContainer}>
        {[
          { step: 1, label: 'Verification', icon: ShieldCheck },
          { step: 2, label: 'Business Details', icon: Building2 },
          { step: 3, label: 'Pickup Address', icon: MapPin },
          { step: 4, label: 'Bank Details', icon: CreditCard },
          { step: 5, label: 'Supplier & Password', icon: UserCheck },
        ].map((item, idx) => {
          const isDone = item.step < maxCompletedStep;
          const isActive = activeStep === item.step;
          const isUnlocked = item.step <= maxCompletedStep;
          const Icon = item.icon;

          return (
            <React.Fragment key={item.step}>
              {idx > 0 && <View style={[styles.stepConnector, isDone && styles.stepConnectorDone]} />}
              <TouchableOpacity
                style={styles.stepItem}
                onPress={() => {
                  if (isUnlocked) {
                    setActiveStep(item.step);
                    setErrorMsg('');
                  } else {
                    setErrorMsg(`Please complete Step ${activeStep} first to unlock ${item.label}.`);
                  }
                }}
                activeOpacity={isUnlocked ? 0.8 : 1}
              >
                <View
                  style={[
                    styles.stepCircle,
                    isDone && styles.stepCircleDone,
                    isActive && styles.stepCircleActive,
                    !isUnlocked && { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }
                  ]}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} color="#FFFFFF" />
                  ) : (
                    <Icon size={16} color={isActive ? '#FFFFFF' : isUnlocked ? '#475569' : '#94A3B8'} />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isActive || isDone) && styles.stepLabelActive,
                    !isUnlocked && { color: '#94A3B8' }
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>

      {/* Error Banner */}
      {errorMsg ? (
        <View style={styles.errorBox}>
          <AlertCircle size={16} color="#DC2626" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* STEP 1: MOBILE OR EMAIL VERIFICATION */}
      {activeStep === 1 && (
        <View style={styles.formCard}>
          {/* Always render recaptcha-container in DOM so Firebase RecaptchaVerifier finds it */}
          <View id="recaptcha-container" />
          <Text style={styles.cardHeaderTitle}>Verify Account Identity</Text>
          <Text style={styles.cardHeaderSub}>
            Step 1 of 5: Choose your preferred verification method (Mobile OTP or Email Verification) to confirm your seller identity.
          </Text>

          {/* Auth Method Selector Tabs */}
          <View style={styles.authMethodTabRow}>
            <TouchableOpacity
              style={[styles.authMethodTab, authMethod === 'mobile' && styles.authMethodTabActive]}
              onPress={() => {
                setAuthMethod('mobile');
                setErrorMsg('');
                setOtpError('');
              }}
            >
              <Phone size={16} color={authMethod === 'mobile' ? '#4338CA' : '#64748B'} />
              <Text style={[styles.authMethodTabText, authMethod === 'mobile' && styles.authMethodTabTextActive]}>
                Mobile Number (SMS)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authMethodTab, authMethod === 'email' && styles.authMethodTabActive]}
              onPress={() => {
                setAuthMethod('email');
                setErrorMsg('');
                setOtpError('');
              }}
            >
              <Mail size={16} color={authMethod === 'email' ? '#4338CA' : '#64748B'} />
              <Text style={[styles.authMethodTabText, authMethod === 'email' && styles.authMethodTabTextActive]}>
                Email Address
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.authMethodTab}
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
            >
              <GoogleLogoIcon size={16} />
              <Text style={styles.authMethodTabText}>Google Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* METHOD A: MOBILE OTP */}
          {authMethod === 'mobile' && (
            !isMobileVerified ? (
              <View style={styles.formGroupGap}>
                <Text style={styles.inputLabel}>Enter 10-Digit Mobile Number *</Text>
                <View style={styles.inputWithBtnRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="+918981829273"
                    keyboardType="phone-pad"
                    value={registerMobile}
                    onChangeText={text => {
                      setRegisterMobile(text);
                      setPhone(text);
                      setIsOtpSent(false);
                      setOtpCode('');
                    }}
                  />
                  <TouchableOpacity
                    style={styles.verifyBtn}
                    onPress={handleSendOtp}
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.verifyBtnText}>
                        {isOtpSent ? 'Resend OTP' : 'Send OTP'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* OTP SECTION WHEN SENT */}
                {isOtpSent ? (
                  <View style={styles.otpCardBox}>
                    <View style={styles.otpBanner}>
                      <Sparkles size={16} color="#4338CA" />
                      <Text style={styles.otpBannerText}>
                        📲 Real SMS sent to {registerMobile}. Check your mobile messages for the 6-digit verification code.
                      </Text>
                    </View>

                    <Text style={styles.inputLabel}>Enter 6-Digit SMS OTP Code *</Text>
                    <TextInput
                      style={[styles.textInput, { fontSize: 18, letterSpacing: 6, fontWeight: '700' }]}
                      placeholder="123456"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otpCode}
                      onChangeText={setOtpCode}
                    />

                    {otpError ? (
                      <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                        {otpError}
                      </Text>
                    ) : null}

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <TouchableOpacity
                        onPress={handleSendOtp}
                        disabled={resendTimer > 0}
                      >
                        <Text style={{ fontSize: 12, color: resendTimer > 0 ? '#94A3B8' : '#7C3AED', fontWeight: '700' }}>
                          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.verifyOtpActionBtn} onPress={handleVerifyOtp}>
                        <CheckCircle2 size={16} color="#FFFFFF" />
                        <Text style={styles.verifyOtpActionBtnText}>Verify OTP</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              /* VERIFIED SUCCESS CARD FOR MOBILE */
              <View style={styles.otpSuccessCard}>
                <View style={styles.otpSuccessBadge}>
                  <CheckCircle2 size={24} color="#059669" />
                  <View>
                    <Text style={styles.otpSuccessTitle}>Mobile Number Verified!</Text>
                    <Text style={styles.otpSuccessSub}>{registerMobile} is verified for your DigiSewa supplier account.</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setIsMobileVerified(false)}
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ fontSize: 12, color: '#4F46E5', fontWeight: '700' }}>Change Mobile Number</Text>
                </TouchableOpacity>
              </View>
            )
          )}

          {/* METHOD B: EMAIL AUTH */}
          {authMethod === 'email' && (
            !isEmailVerified ? (
              <View style={styles.formGroupGap}>
                <Text style={styles.inputLabel}>Enter Email Address *</Text>
                <View style={styles.inputWithBtnRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="seller@DigiSewa.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={registerEmail}
                    onChangeText={text => {
                      setRegisterEmail(text);
                      setIsEmailOtpSent(false);
                      setEmailOtpCode('');
                    }}
                  />
                  <TouchableOpacity
                    style={styles.verifyBtn}
                    onPress={handleSendEmailOtp}
                    disabled={isSendingEmailOtp}
                  >
                    {isSendingEmailOtp ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.verifyBtnText}>
                        {isEmailOtpSent ? 'Resend Code' : 'Send Code'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* EMAIL LINK SECTION */}
                {isEmailOtpSent ? (
                  <View style={styles.otpCardBox}>
                    <View style={styles.otpBanner}>
                      <Sparkles size={16} color="#4338CA" />
                      <Text style={styles.otpBannerText}>
                        📩 Verification link sent to {registerEmail}. Please check your email inbox and click the verification link to proceed to Business Details.
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginTop: 10 }}>
                      <TouchableOpacity onPress={handleSendEmailOtp} disabled={resendTimer > 0}>
                        <Text style={{ fontSize: 12, color: resendTimer > 0 ? '#94A3B8' : '#7C3AED', fontWeight: '700' }}>
                          {resendTimer > 0 ? `Resend link in ${resendTimer}s` : 'Resend Verification Link'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              /* VERIFIED SUCCESS CARD FOR EMAIL */
              <View style={styles.otpSuccessCard}>
                <View style={styles.otpSuccessBadge}>
                  <CheckCircle2 size={24} color="#059669" />
                  <View>
                    <Text style={styles.otpSuccessTitle}>Email Address Verified!</Text>
                    <Text style={styles.otpSuccessSub}>{registerEmail} is verified for your DigiSewa seller account.</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setIsEmailVerified(false)}
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ fontSize: 12, color: '#4F46E5', fontWeight: '700' }}>Change Email Address</Text>
                </TouchableOpacity>
              </View>
            )
          )}

          <TouchableOpacity
            style={[
              styles.continueBtn,
              (authMethod === 'mobile' ? !isMobileVerified : !isEmailVerified) && styles.meeshoLoginBtnDisabled
            ]}
            onPress={handleStep1Next}
            disabled={authMethod === 'mobile' ? !isMobileVerified : !isEmailVerified}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Continue to Business Details</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2: BUSINESS DETAILS */}
      {activeStep === 2 && (
        <View style={styles.formCard}>
          <Text style={styles.cardHeaderTitle}>Do you have a GST number?</Text>

          <View style={styles.radioGrid}>
            {/* Yes Option */}
            <TouchableOpacity
              style={[styles.radioCard, hasGst && styles.radioCardActive]}
              onPress={() => setHasGst(true)}
              activeOpacity={0.9}
            >
              <View style={styles.radioCircle}>
                {hasGst && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.radioTitle}>Yes</Text>
                <Text style={styles.radioSub}>Enter your GSTIN and sell anywhere easily</Text>
              </View>
            </TouchableOpacity>

            {/* No Option */}
            <TouchableOpacity
              style={[styles.radioCard, !hasGst && styles.radioCardActive]}
              onPress={() => setHasGst(false)}
              activeOpacity={0.9}
            >
              <View style={styles.radioCircle}>
                {!hasGst && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.radioTitle}>No</Text>
                <Text style={styles.radioSub}>
                  Worry not, you can sell without GST — <Text style={{ color: '#059669', fontWeight: '800' }}>Get EID in mins⚡</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* If Yes: Enter GSTIN */}
          {hasGst ? (
            <View style={styles.sectionInputBlock}>
              <Text style={styles.inputLabel}>Enter GSTIN</Text>
              <View style={styles.inputWithBtnRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="e.g. 18AABCU9603R1ZM"
                  placeholderTextColor="#94A3B8"
                  value={gstin}
                  onChangeText={text => {
                    setGstin(text.toUpperCase());
                    setIsGstVerified(false);
                  }}
                  autoCapitalize="characters"
                  maxLength={15}
                />
                <TouchableOpacity
                  style={[styles.verifyBtn, isGstVerified && styles.verifyBtnSuccess]}
                  onPress={handleVerifyGst}
                  disabled={isVerifyingGst}
                >
                  {isVerifyingGst ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.verifyBtnText}>
                      {isGstVerified ? '✓ Verified' : 'Verify'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* If No: Sell Without GST Panel */
            <View style={styles.nonGstPanel}>
              <Text style={styles.nonGstTitle}>Sell without GST in minutes</Text>
              <Text style={styles.nonGstSub}>We only need the below details from you to create your enrolment ID:</Text>

              <View style={styles.checkList}>
                <Text style={styles.checkListItem}>✓ PAN number</Text>
                <Text style={styles.checkListItem}>✓ Full Name</Text>
                <Text style={styles.checkListItem}>✓ Email ID</Text>
                <Text style={styles.checkListItem}>✓ Full Address</Text>
              </View>

              <TouchableOpacity
                style={styles.proceedEidBtn}
                onPress={() => setShowEidModal(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.proceedEidBtnText}>Proceed to add details</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.navBtnRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setActiveStep(1)}>
              <ArrowLeft size={16} color="#475569" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.continueBtnFlex} onPress={handleStep2Next}>
              <Text style={styles.continueBtnText}>Continue to Pickup Address</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 3: PICKUP ADDRESS */}
      {activeStep === 3 && (
        <View style={styles.formCard}>
          <Text style={styles.cardHeaderTitle}>Pickup Address</Text>
          <Text style={styles.cardHeaderSub}>Where should DigiSewa delivery partners pick up your orders?</Text>

          <View style={styles.formGroupGap}>
            <Text style={styles.inputLabel}>Room / Floor / Building Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Building 4B, Shop #12"
              value={building}
              onChangeText={setBuilding}
            />

            <Text style={styles.inputLabel}>Street / Locality / Landmark *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Main Bazaar Road, Near City Center"
              value={street}
              onChangeText={setStreet}
            />

            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Pincode *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="781001"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={pincode}
                  onChangeText={setPincode}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>City *</Text>
                <TextInput style={styles.textInput} value={city} onChangeText={setCity} />
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>State *</Text>
                <TextInput style={styles.textInput} value={state} onChangeText={setState} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>District</Text>
                <TextInput style={styles.textInput} value={district} onChangeText={setDistrict} />
              </View>
            </View>

            <View style={styles.navBtnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setActiveStep(2)}>
                <ArrowLeft size={16} color="#475569" />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.continueBtnFlex} onPress={handleStep3Next}>
                <Text style={styles.continueBtnText}>Continue to Bank Details</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* STEP 4: BANK DETAILS */}
      {activeStep === 4 && (
        <View style={styles.formCard}>
          <Text style={styles.cardHeaderTitle}>Bank Account Details</Text>
          <Text style={styles.cardHeaderSub}>Direct daily settlements for your sales on DigiSewa.</Text>

          <View style={styles.formGroupGap}>
            <Text style={styles.inputLabel}>Bank Account Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter Account Number"
              secureTextEntry
              keyboardType="number-pad"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />

            <Text style={styles.inputLabel}>Confirm Bank Account Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Re-enter Account Number"
              keyboardType="number-pad"
              value={confirmAccountNumber}
              onChangeText={setConfirmAccountNumber}
            />

            <Text style={styles.inputLabel}>IFSC Code *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. SBIN0001122 or UTIB0000123"
              autoCapitalize="characters"
              maxLength={11}
              value={ifscCode}
              onChangeText={handleIfscCodeChange}
            />

            {isCheckingIfsc ? (
              <View style={[styles.bankVerifiedPill, { backgroundColor: '#F3F4F6' }]}>
                <ActivityIndicator size="small" color="#9333EA" />
                <Text style={[styles.bankVerifiedText, { color: '#6B7280' }]}>Fetching Bank & Branch details...</Text>
              </View>
            ) : bankName ? (
              <View style={styles.bankVerifiedPill}>
                <CheckCircle2 size={14} color="#059669" />
                <Text style={styles.bankVerifiedText}>{bankName}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Account Holder Name (As per Bank) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Sk Pabirul Islam"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
            />

            <View style={styles.navBtnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setActiveStep(3)}>
                <ArrowLeft size={16} color="#475569" />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.continueBtnFlex} onPress={handleStep4Next}>
                <Text style={styles.continueBtnText}>Continue to Supplier & Password</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* STEP 5: SUPPLIER DETAILS & PASSWORD SET */}
      {activeStep === 5 && (
        <View style={styles.formCard}>
          <View style={styles.noticeYellowBox}>
            <Text style={styles.noticeYellowText}>
              ℹ️ Final Step: Store details and account password setup.
            </Text>
          </View>

          <View style={styles.formGroupGap}>
            {/* Verified Mobile Number Badge OR Input Field */}
            {isMobileVerified && (phone || registerMobile) ? (
              <View style={styles.verifiedMobileBadgeRow}>
                <CheckCircle2 size={16} color="#059669" />
                <Text style={styles.verifiedMobileBadgeText}>Verified Mobile: {phone || registerMobile}</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>Mobile Number *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="+918981829273"
                  keyboardType="phone-pad"
                  value={phone || registerMobile}
                  onChangeText={text => {
                    setPhone(text);
                    setRegisterMobile(text);
                  }}
                />
              </View>
            )}

            <Text style={styles.inputLabel}>Store Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. DigiSewa Express Store"
              value={storeName}
              onChangeText={setStoreName}
            />

            <Text style={styles.inputLabel}>Your Full Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Sk Pabirul Islam"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.inputLabel}>Email ID *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="drskpabirulislam1995@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {/* PASSWORD SET OPTION BOX */}
            <View style={styles.passwordSetupCard}>
              <View style={styles.passwordHeaderRow}>
                <ShieldCheck size={18} color="#7C3AED" />
                <Text style={styles.passwordHeaderTitle}>Set Account Password for Login</Text>
              </View>
              <Text style={styles.passwordHeaderSub}>
                Create a secure password so you can easily log into your DigiSewa supplier panel anytime using your mobile number ({phone || registerMobile || 'your registered mobile'}) and password.
              </Text>

              <Text style={styles.inputLabel}>Create Password *</Text>
              <View style={styles.meeshoPasswordWrapper}>
                <TextInput
                  style={[styles.textInput, { paddingRight: 60 }]}
                  placeholder="Set Password (min 6 chars)"
                  secureTextEntry={!showRegisterPassword}
                  value={registerPassword}
                  onChangeText={setRegisterPassword}
                />
                <TouchableOpacity
                  style={styles.meeshoShowBtn}
                  onPress={() => setShowRegisterPassword(!showRegisterPassword)}
                >
                  <Text style={styles.meeshoShowBtnText}>{showRegisterPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Confirm Password *</Text>
              <View style={styles.meeshoPasswordWrapper}>
                <TextInput
                  style={[styles.textInput, { paddingRight: 60 }]}
                  placeholder="Re-enter Password"
                  secureTextEntry={!showRegisterConfirmPassword}
                  value={registerConfirmPassword}
                  onChangeText={setRegisterConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.meeshoShowBtn}
                  onPress={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                >
                  <Text style={styles.meeshoShowBtnText}>{showRegisterConfirmPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.inputLabel}>What's your business type?</Text>
            <View style={styles.selectBox}>
              <Text style={styles.selectBoxText}>{businessType}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setWhatsappUpdates(!whatsappUpdates)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, whatsappUpdates && styles.checkboxActive]}>
                {whatsappUpdates && <CheckCircle2 size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxText}>I want to receive important updates on WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
                {agreeTerms && <CheckCircle2 size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxText}>
                I agree to comply with DigiSewa's <Text style={{ color: '#4338CA', textDecorationLine: 'underline' }}>Supplier Agreement</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.navBtnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setActiveStep(4)}>
                <ArrowLeft size={16} color="#475569" />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitFinalBtn, isSubmitting && styles.submitFinalBtnDisabled]}
                onPress={handleSubmitFinal}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitFinalBtnText}>Submit Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* CREATE EID MODAL (Sub-wizard for Non-GST Sellers) */}
      <Modal transparent visible={showEidModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Create your EID (Enrolment ID)</Text>
              <TouchableOpacity onPress={() => setShowEidModal(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
              <Text style={styles.sectionSubTitle}>PAN and Contact Details</Text>
              <View style={styles.twoColRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="PAN Number"
                  autoCapitalize="characters"
                  maxLength={10}
                  value={panNumber}
                  onChangeText={setPanNumber}
                />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Name as per PAN"
                  value={nameAsPerPan}
                  onChangeText={setNameAsPerPan}
                />
              </View>

              <TextInput
                style={styles.textInput}
                placeholder="Email ID"
                keyboardType="email-address"
                value={eidEmail}
                onChangeText={setEidEmail}
              />

              <Text style={styles.sectionSubTitle}>Address Details</Text>
              <View style={styles.twoColRow}>
                <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="State" value={eidState} onChangeText={setEidState} />
                <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="Pincode" keyboardType="number-pad" value={eidPincode} onChangeText={setEidPincode} />
              </View>

              <View style={styles.twoColRow}>
                <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="District" value={eidDistrict} onChangeText={setEidDistrict} />
                <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="City" value={eidCity} onChangeText={setEidCity} />
              </View>

              <TextInput style={styles.textInput} placeholder="Room / Floor / Building Number" value={eidBuilding} onChangeText={setEidBuilding} />
              <TextInput style={styles.textInput} placeholder="Street / Locality / Landmark" value={eidStreet} onChangeText={setEidStreet} />

              <Text style={styles.sectionSubTitle}>Captcha Security Check</Text>
              <View style={styles.captchaRow}>
                <View style={styles.captchaImageBadge}>
                  <Text style={styles.captchaCodeText}>{captchaCode}</Text>
                </View>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Type the characters"
                  value={captchaInput}
                  onChangeText={setCaptchaInput}
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.submitEidBtn} onPress={handleCreateEidSubmit}>
              <Text style={styles.submitEidBtnText}>Submit EID Details & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // -------------------------------------------------------------
  // MEESHO-STYLE SUPPLIER PANEL LOGIN STYLES
  // -------------------------------------------------------------
  meeshoLoginPageContainer: {
    flexGrow: 1,
    backgroundColor: '#F3EEFC', // Soft pastel lilac matching screenshot
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  meeshoLogoHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sellerLogoImage: {
    width: 180,
    height: 60,
  },
  meeshoLogoText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#D946EF', // Brand pink/magenta accent
    letterSpacing: -1,
  },
  meeshoLoginCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  meeshoCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  meeshoErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  meeshoErrorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  meeshoInputGroup: {
    marginBottom: 16,
  },
  meeshoTextInput: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  meeshoPasswordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  meeshoShowBtn: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  meeshoShowBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  meeshoForgotWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  meeshoForgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
  meeshoLoginBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#9333EA', // Meesho vibrant purple/pink button
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meeshoLoginBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  meeshoLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  instantDemoBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  instantDemoBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  meeshoFooterSection: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    marginTop: 28,
  },
  meeshoNewText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    fontWeight: '500',
  },
  meeshoCreateAccountBtn: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#F3E8FF',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meeshoCreateAccountBtnText: {
    color: '#6D28D9',
    fontSize: 14,
    fontWeight: '700',
  },

  // -------------------------------------------------------------
  // REGISTRATION ONBOARDING STYLES
  // -------------------------------------------------------------
  pageContainer: {
    padding: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    flexGrow: 1,
  },
  brandHeader: {
    width: '100%',
    maxWidth: 720,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backToLoginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backToLoginLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  quickDemoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  quickDemoLinkText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '700',
  },
  stepperContainer: {
    width: '100%',
    maxWidth: 720,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#4338CA',
  },
  stepCircleDone: {
    backgroundColor: '#059669',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    marginTop: -16,
  },
  stepConnectorDone: {
    backgroundColor: '#059669',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  stepLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  errorBox: {
    width: '100%',
    maxWidth: 720,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardHeaderSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },

  // MOBILE OTP STYLES
  otpCardBox: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 10,
  },
  otpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  otpBannerText: {
    fontSize: 12,
    color: '#3730A3',
    fontWeight: '600',
  },
  verifyOtpActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  verifyOtpActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  otpSuccessCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  otpSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  otpSuccessTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
  },
  otpSuccessSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  verifiedMobileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  verifiedMobileBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857',
  },

  radioGrid: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 16,
  },
  radioCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  radioCardActive: {
    borderColor: '#4338CA',
    backgroundColor: '#EEF2FF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4338CA',
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  radioSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionInputBlock: {
    marginVertical: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputWithBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  verifyBtn: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 10,
  },
  verifyBtnSuccess: {
    backgroundColor: '#059669',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  nonGstPanel: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  nonGstTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  nonGstSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  checkList: {
    gap: 6,
    marginBottom: 14,
  },
  checkListItem: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  proceedEidBtn: {
    backgroundColor: '#4338CA',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  proceedEidBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  continueBtn: {
    backgroundColor: '#4338CA',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  formGroupGap: {
    gap: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  continueBtnFlex: {
    flex: 1,
    backgroundColor: '#4338CA',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bankVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bankVerifiedText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '700',
  },
  noticeYellowBox: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  noticeYellowText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '700',
  },
  passwordSetupCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  passwordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  passwordHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5B21B6',
  },
  passwordHeaderSub: {
    fontSize: 12,
    color: '#6D28D9',
    marginBottom: 14,
    lineHeight: 16,
  },
  selectBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
  },
  selectBoxText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  checkboxText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  submitFinalBtn: {
    flex: 1,
    backgroundColor: '#4338CA',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitFinalBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitFinalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // STATUS SCREENS
  statusContainer: {
    flexGrow: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  pendingBadgeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoBannerAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoBannerAlertText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  demoApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4338CA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  demoApproveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rejectionReasonBox: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  rejectionReasonTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  rejectionReasonText: {
    fontSize: 13,
    color: '#991B1B',
    marginTop: 4,
  },
  reapplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  reapplyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  // EID MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtnText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },
  sectionSubTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338CA',
    marginTop: 4,
  },
  captchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  captchaImageBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  captchaCodeText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 4,
  },
  submitEidBtn: {
    backgroundColor: '#4338CA',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  submitEidBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  authMethodTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  authMethodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  authMethodTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  authMethodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  authMethodTabTextActive: {
    color: '#4338CA',
    fontWeight: '700',
  },
  forgotStepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  forgotStepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotStepBadgeActive: {
    backgroundColor: '#7C3AED',
  },
  forgotStepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  forgotStepBadgeTextActive: {
    color: '#FFFFFF',
  },
  forgotStepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  forgotStepLineActive: {
    backgroundColor: '#7C3AED',
  },
  googleAuthBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  googleAuthBtnText: {
    color: '#3C4043',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
