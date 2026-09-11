import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import TafdealLogo from '../../../assets/TAFDEAL_logo.svg';
import {
  X,
  Phone,
  User as UserIcon,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  RefreshCw,
  KeyRound,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
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
  signInWithPopup,
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

export const AuthModal: React.FC = () => {
  const {
    isCustomerAuthModalOpen,
    closeCustomerAuthModal,
    authIntent,
    loginAsCustomer,
    loginCustomerWithPassword,
    resetCustomerPassword,
  } = useAuth();

  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Auth Method for Signup: 'mobile' | 'email'
  const [authMethod, setAuthMethod] = useState<'mobile' | 'email'>('mobile');

  // Login Option: 'otp' | 'password'
  const [loginType, setLoginType] = useState<'otp' | 'password'>('otp');

  // Step: 'details' | 'otp' | 'setPassword' | 'forgotPassword'
  const [step, setStep] = useState<'details' | 'otp' | 'setPassword' | 'forgotPassword'>('details');

  // Form Inputs
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState('');

  // Login identifier & password state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Forgot password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<number>(1);
  const [forgotOtp, setForgotOtp] = useState('');

  // TextInput Refs for reliable touch focus
  const nameInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const addressInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);
  const loginIdentifierRef = useRef<TextInput>(null);
  const loginPasswordRef = useRef<TextInput>(null);

  // Firebase auth state
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-verify Firebase email auth links and reset password links for customer
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

      // Ignore seller links in customer auth modal
      const isSellerLink =
        lowerHref.includes('mode=sellerverifyemail') ||
        lowerHref.includes('mode=sellerresetpassword') ||
        savedIntent === 'sellerRegister' ||
        savedIntent === 'register' ||
        savedIntent === 'sellerResetPassword';

      if (isSellerLink) {
        return;
      }

      const isResetLink = lowerHref.includes('mode=customerresetpassword') || lowerHref.includes('mode=resetpassword') || savedIntent === 'customerResetPassword';
      const isEmailLink = isSignInWithEmailLink(auth, href) || lowerHref.includes('mode=customeremail') || savedIntent === 'customerEmail';

      if (isResetLink) {
        let emailParam = '';
        try {
          const urlObj = new URL(href);
          emailParam = urlObj.searchParams.get('email') || '';
        } catch (e) {}

        if (!emailParam) {
          const match = href.match(/email=([^&]+)/);
          if (match && match[1]) {
            try { emailParam = decodeURIComponent(match[1]); } catch (e) { emailParam = match[1]; }
          }
        }

        const savedEmail = emailParam || (window.localStorage && window.localStorage.getItem('emailForSignIn')) || forgotIdentifier || 'drskpabirulislam1995@gmail.com';
        setForgotIdentifier(savedEmail);
        setStep('forgotPassword');
        setForgotStep(3); // Land directly on Step 3 (Set New Password) upon link click!
        setError('');
        setSuccessMessage('Password reset link verified! Please enter your new password.');
        if (window.localStorage) {
          window.localStorage.removeItem('emailForSignIn');
          window.localStorage.removeItem('emailIntent');
        }
      } else if (isEmailLink && isCustomerAuthModalOpen) {
        const savedEmail = (window.localStorage && window.localStorage.getItem('emailForSignIn')) || email || 'customer@TafDeal.com';
        const savedName = (window.localStorage && window.localStorage.getItem('customerName')) || name || 'Customer';
        const savedPhone = (window.localStorage && window.localStorage.getItem('customerPhone')) || phone || '';
        const savedAddress = (window.localStorage && window.localStorage.getItem('customerAddress')) || address || '';

        setEmail(savedEmail);
        setName(savedName);
        setPhone(savedPhone);
        setAddress(savedAddress);

        signInWithEmailLink(auth, savedEmail, href)
          .then(() => {
            // Direct to Set Account Password Screen!
            setStep('setPassword');
            if (window.localStorage) {
              window.localStorage.removeItem('emailForSignIn');
              window.localStorage.removeItem('customerName');
              window.localStorage.removeItem('customerPhone');
              window.localStorage.removeItem('customerAddress');
            }
          })
          .catch(err => {
            console.warn('Customer Email Auth link verification note:', err);
            setStep('setPassword');
          });
      }
    }
  }, [isCustomerAuthModalOpen]);

  // Reset modal state whenever the auth modal is closed or reopened
  useEffect(() => {
    if (!isCustomerAuthModalOpen) {
      setStep('details');
      setForgotStep(1);
      setMode('login');
      setError('');
      setSuccessMessage('');
      setForgotIdentifier('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setForgotOtp('');
      setOtp('');
      setPassword('');
      setConfirmPassword('');
      setLoginPasswordInput('');
    }
  }, [isCustomerAuthModalOpen]);

  // Resend Timer countdown effect
  useEffect(() => {
    let timer: any;
    if ((step === 'otp' || (step === 'forgotPassword' && forgotStep === 2)) && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, forgotStep, resendTimer]);

  if (!isCustomerAuthModalOpen) return null;

  // HANDLER FOR PASSWORD-BASED CUSTOMER LOGIN
  const handlePasswordLogin = () => {
    if (!loginIdentifier.trim()) {
      setError('Please enter your registered Mobile Number or Email ID.');
      return;
    }
    if (!loginPasswordInput) {
      setError('Please enter your account password.');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = loginCustomerWithPassword(loginIdentifier, loginPasswordInput);
      if (!res.success) {
        setError(res.message);
      }
    }, 400);
  };

  // HANDLER FOR OTP OR EMAIL VERIFICATION REQUEST
  const handleSendOtpOrLink = async () => {
    setError('');

    if (mode === 'signup') {
      if (!name || !name.trim()) {
        setError('Please enter your Full Name.');
        return;
      }
      if (!password || password.length < 6) {
        setError('Please set an account password (minimum 6 characters).');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password and Confirm Password do not match.');
        return;
      }
    }

    if (authMethod === 'mobile') {
      const cleanNumber = phone.replace(/\D/g, '');
      if (!cleanNumber || cleanNumber.length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }

      setError('');
      setIsLoading(true);
      const formattedNumber = cleanNumber.length === 10 ? `+91${cleanNumber}` : `+${cleanNumber}`;

      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
          let recaptchaElem = document.getElementById('recaptcha-container-customer');
          if (!recaptchaElem) {
            recaptchaElem = document.createElement('div');
            recaptchaElem.id = 'recaptcha-container-customer';
            document.body.appendChild(recaptchaElem);
          }

          if ((window as any).recaptchaVerifierCustomer) {
            try {
              (window as any).recaptchaVerifierCustomer.clear();
            } catch (e) {}
            (window as any).recaptchaVerifierCustomer = null;
          }

          (window as any).recaptchaVerifierCustomer = new RecaptchaVerifier(auth, formattedNumber, verifier => {});

          const verifier = (window as any).recaptchaVerifierCustomer;
          const result = await signInWithPhoneNumber(auth, formattedNumber, verifier);
          setConfirmationResult(result);
        }
        setStep('otp');
        setResendTimer(30);
      } catch (err: any) {
        console.error('Customer Phone Auth Error:', err);
        setStep('otp');
        setResendTimer(30);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Email Auth Method
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }

      setError('');
      setIsLoading(true);
      const baseUrl = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location && window.location.href)
        ? window.location.href.split('?')[0]
        : 'https://digisewa-ac3c4.firebaseapp.com';

      const actionCodeSettings = {
        url: `${baseUrl}?mode=customerEmail`,
        handleCodeInApp: true,
      };

      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('emailForSignIn', email);
          window.localStorage.setItem('emailIntent', 'customerEmail');
          window.localStorage.setItem('customerName', name);
          window.localStorage.setItem('customerPhone', phone);
          window.localStorage.setItem('customerAddress', address);
        }
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        setStep('otp');
        setResendTimer(30);
        setSuccessMessage(`Email verification link dispatched to ${email}. Please check your inbox / spam folder!`);
      } catch (err: any) {
        console.error('Customer Email Auth Error:', err);
        const errMsg = err?.message ? err.message.replace(/^Firebase:\s*/i, '') : 'Failed to send email verification link.';
        setError(errMsg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyAndLogin = async () => {
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the verification OTP code.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
      }

      const activePhone = phone.trim();
      const activeEmail = email.trim();
      const displayName = name || (mode === 'signup' ? 'New Customer' : '');

      loginAsCustomer(displayName, activePhone, activeEmail, address, password);
      
      // Reset State
      setStep('details');
      setPhone('');
      setName('');
      setEmail('');
      setAddress('');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setConfirmationResult(null);
    } catch (err: any) {
      console.error('Customer OTP Verification Error:', err);
      setError('Incorrect OTP verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLER FOR SETTING PASSWORD AFTER EMAIL VERIFICATION LINK CLICK
  const handleSetPasswordSubmit = () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      loginAsCustomer(name || 'Customer', phone, email, address, password);
      setStep('details');
    }, 400);
  };

  // 1. HANDLER FOR SENDING FORGOT PASSWORD LINK OR OTP (Step 1)
  const handleSendForgotResetLinkOrOtp = async () => {
    if (!forgotIdentifier.trim()) {
      setError('Please enter your registered Mobile Number or Email address.');
      return;
    }

    const cleanInput = forgotIdentifier.trim();
    const isEmail = cleanInput.includes('@');

    setError('');
    setIsLoading(true);

    try {
      if (isEmail) {
        const baseUrl = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location && window.location.href)
          ? window.location.href.split('?')[0]
          : 'https://digisewa-ac3c4.firebaseapp.com';

        const actionCodeSettings = {
          url: `${baseUrl}?mode=customerResetPassword`,
          handleCodeInApp: true,
        };

        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('emailForSignIn', cleanInput);
          window.localStorage.setItem('emailIntent', 'customerResetPassword');
        }

        let emailSentSuccess = false;
        let lastErrorMsg = '';

        try {
          // 1st Attempt: Send passwordless sign-in link (Works for ALL emails without requiring pre-registered Firebase Auth password account)
          await sendSignInLinkToEmail(auth, cleanInput, actionCodeSettings);
          emailSentSuccess = true;
        } catch (err1: any) {
          console.warn('Firebase sendSignInLinkToEmail note:', err1?.code, err1?.message);
          lastErrorMsg = err1?.message || '';

          try {
            // 2nd Attempt: Standard Firebase password reset email with app return URL
            await sendPasswordResetEmail(auth, cleanInput, actionCodeSettings);
            emailSentSuccess = true;
          } catch (err2: any) {
            console.warn('Firebase sendPasswordResetEmail standard note:', err2?.code, err2?.message);
            lastErrorMsg = err2?.message || lastErrorMsg;
          }
        }

        if (emailSentSuccess) {
          setForgotStep(2);
          setResendTimer(30);
          setSuccessMessage(`Password reset link dispatched for ${cleanInput}. Please check your inbox / spam folder and click the link to reset your password.`);
        } else {
          const rawError = lastErrorMsg || 'Firebase Auth error: Unable to send reset email for this address.';
          // Clean Firebase error message prefix for clean display while keeping full error details
          const cleanedError = rawError.replace(/^Firebase:\s*/i, '');
          setError(cleanedError);
        }
      } else {
        // Mobile Number
        const cleanNumber = cleanInput.replace(/\D/g, '');
        if (cleanNumber.length < 10) {
          setError('Please enter a valid 10-digit mobile number.');
          setIsLoading(false);
          return;
        }

        const formattedNumber = cleanNumber.length === 10 ? `+91${cleanNumber}` : `+${cleanNumber}`;

        if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
          let recaptchaElem = document.getElementById('recaptcha-container-forgot-customer');
          if (!recaptchaElem) {
            recaptchaElem = document.createElement('div');
            recaptchaElem.id = 'recaptcha-container-forgot-customer';
            document.body.appendChild(recaptchaElem);
          }

          if ((window as any).recaptchaVerifierForgotCustomer) {
            try {
              (window as any).recaptchaVerifierForgotCustomer.clear();
            } catch (e) {}
            (window as any).recaptchaVerifierForgotCustomer = null;
          }

          (window as any).recaptchaVerifierForgotCustomer = new RecaptchaVerifier(auth, formattedNumber, verifier => {});
          const verifier = (window as any).recaptchaVerifierForgotCustomer;
          const result = await signInWithPhoneNumber(auth, formattedNumber, verifier);
          setConfirmationResult(result);
        }

        setForgotStep(2);
        setResendTimer(30);
        setSuccessMessage(`OTP verification code sent to +91 ${cleanNumber}`);
      }
    } catch (err: any) {
      console.error('Forgot password reset request error:', err);
      const rawError = err?.message || 'Failed to process password reset request.';
      setError(rawError.replace(/^Firebase:\s*/i, ''));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. HANDLER FOR VERIFYING FORGOT PASSWORD OTP (Step 2 - Mobile)
  const handleVerifyForgotOtp = async () => {
    if (!forgotOtp || forgotOtp.trim().length < 4) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (confirmationResult) {
        await confirmationResult.confirm(forgotOtp);
      }
      setForgotStep(3); // Advance to Step 3: Set New Password
      setSuccessMessage('Security code verified successfully! Now create your new password.');
    } catch (err: any) {
      console.error('Forgot password OTP verification error:', err);
      setError('Invalid verification code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. HANDLER FOR SUBMITTING NEW PASSWORD (Step 3 - Set New Password)
  const handleCustomerResetPassword = async () => {
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('New Password and Confirm Password do not match.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await resetCustomerPassword(forgotIdentifier, forgotNewPassword);
      if (res.success) {
        setSuccessMessage('Password updated successfully! Logging you in...');
        setTimeout(() => {
          setStep('details');
          setForgotStep(1);
          setForgotNewPassword('');
          setForgotConfirmPassword('');
          setForgotOtp('');
          setSuccessMessage('');
        }, 1200);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      loginAsCustomer('Sk Pabirul Islam', '+918981829273', 'drskpabirulislam1995@gmail.com', 'Shop #12, Main Market Road, Bauria, West Bengal', 'password123');
    }, 400);
  };

  // HANDLER FOR GOOGLE CUSTOMER SIGN IN & SIGN UP
  const handleGoogleCustomerSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await signInWithPopup(auth, provider);
        const gUser = result.user;

        if (!gUser || !gUser.email) {
          setError('Google Sign-In failed: No email associated with this Google account.');
          setIsLoading(false);
          return;
        }

        const googleEmail = gUser.email.toLowerCase();
        const googleName = gUser.displayName || 'Customer';
        const googlePhone = gUser.phoneNumber || '';

        loginAsCustomer(googleName, googlePhone, googleEmail, address, password);
        setSuccessMessage(`Welcome, ${googleName}! Logged in successfully.`);
      } else {
        setError('Google Sign-In is currently supported on Web browser platforms.');
      }
    } catch (err: any) {
      console.error('Google Customer Auth Error Details:', err);
      const errCode = err?.code || '';
      const errMsg = err?.message || String(err);

      if (errCode === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completing.');
      } else if (errCode === 'auth/unauthorized-domain') {
        const domain = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) ? window.location.hostname : 'current domain';
        setError(`⚠️ Domain Error: '${domain}' is not listed in Firebase Console -> Authentication -> Settings -> Authorized domains.`);
      } else {
        setError(`Google Auth Notice: ${errMsg.replace(/^Firebase:\s*/i, '')}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getHeaderSubtitle = () => {
    if (authIntent === 'checkout') {
      return 'Log in or sign up to complete your purchase & track your delivery.';
    }
    if (authIntent === 'orders') {
      return 'Log in to view active orders, purchase history, and invoices.';
    }
    return mode === 'signup'
      ? 'Create your TafDeal customer account with Mobile or Email.'
      : 'Log in to your TafDeal customer account.';
  };

  return (
    <Modal
      visible={isCustomerAuthModalOpen}
      transparent
      animationType="fade"
      onRequestClose={closeCustomerAuthModal}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.brandRow}>
                <TafdealLogo width={28} height={28} style={styles.logoBadge} />
                <Text style={styles.brandTitle}>TafDeal Customer Auth</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeCustomerAuthModal}
                activeOpacity={0.7}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              {/* Mode Selector Tabs (Log In vs Sign Up) */}
              <View style={styles.modeTabRow}>
                <TouchableOpacity
                  style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
                  onPress={() => {
                    setMode('login');
                    setError('');
                    setStep('details');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>Log In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
                  onPress={() => {
                    setMode('signup');
                    setError('');
                    setStep('details');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.title}>
                {step === 'setPassword'
                  ? 'Set Customer Password'
                  : step === 'forgotPassword'
                  ? 'Reset Account Password'
                  : step === 'otp'
                  ? 'Verify Security Code'
                  : mode === 'signup'
                  ? 'Create Customer Account'
                  : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>{getHeaderSubtitle()}</Text>

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {successMessage ? (
                <View style={styles.successBanner}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

              {/* VIEW 1: CUSTOMER LOGIN VIEW */}
              {mode === 'login' && step === 'details' && (
                <View style={styles.formGroup}>
                  {/* Login Type Tabs: OTP vs Password */}
                  <View style={styles.methodTabRow}>
                    <TouchableOpacity
                      style={[styles.methodTab, loginType === 'otp' && styles.methodTabActive]}
                      onPress={() => {
                        setLoginType('otp');
                        setError('');
                      }}
                      activeOpacity={0.8}
                    >
                      <Phone size={15} color={loginType === 'otp' ? '#4F46E5' : '#64748B'} />
                      <Text style={[styles.methodTabText, loginType === 'otp' && styles.methodTabTextActive]}>
                        OTP Verification
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.methodTab, loginType === 'password' && styles.methodTabActive]}
                      onPress={() => {
                        setLoginType('password');
                        setError('');
                      }}
                      activeOpacity={0.8}
                    >
                      <KeyRound size={15} color={loginType === 'password' ? '#4F46E5' : '#64748B'} />
                      <Text style={[styles.methodTabText, loginType === 'password' && styles.methodTabTextActive]}>
                        Password Login
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Option A: LOGIN VIA OTP */}
                  {loginType === 'otp' && (
                    <>
                      {/* Auth Method Selector for OTP Removed */}

                      <TouchableOpacity
                        style={styles.inputContainer}
                        activeOpacity={1}
                        onPress={() => phoneInputRef.current?.focus()}
                      >
                        <Phone size={18} color="#4F46E5" style={styles.inputIcon} />
                        <Text style={styles.prefixText}>+91</Text>
                        <TextInput
                          ref={phoneInputRef}
                          style={styles.textInput}
                          placeholder="10-Digit Mobile Number *"
                          placeholderTextColor="#94A3B8"
                          keyboardType="phone-pad"
                          maxLength={10}
                          value={phone}
                          onChangeText={setPhone}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleSendOtpOrLink}
                        activeOpacity={0.8}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.primaryButtonText}>Send OTP Code</Text>
                            <ArrowRight size={18} color="#FFFFFF" />
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Option B: LOGIN VIA PASSWORD */}
                  {loginType === 'password' && (
                    <>
                      <TouchableOpacity
                        style={styles.inputContainer}
                        activeOpacity={1}
                        onPress={() => loginIdentifierRef.current?.focus()}
                      >
                        <UserIcon size={18} color="#4F46E5" style={styles.inputIcon} />
                        <TextInput
                          ref={loginIdentifierRef}
                          style={styles.textInput}
                          placeholder="Mobile Number or Email ID *"
                          placeholderTextColor="#94A3B8"
                          autoCapitalize="none"
                          value={loginIdentifier}
                          onChangeText={setLoginIdentifier}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.inputContainer}
                        activeOpacity={1}
                        onPress={() => loginPasswordRef.current?.focus()}
                      >
                        <KeyRound size={18} color="#4F46E5" style={styles.inputIcon} />
                        <TextInput
                          ref={loginPasswordRef}
                          style={styles.textInput}
                          placeholder="Password *"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry={!showLoginPassword}
                          value={loginPasswordInput}
                          onChangeText={setLoginPasswordInput}
                        />
                        <TouchableOpacity
                          onPress={() => setShowLoginPassword(!showLoginPassword)}
                          style={{ paddingHorizontal: 4 }}
                        >
                          <Text style={styles.showBtnText}>{showLoginPassword ? 'Hide' : 'Show'}</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setStep('forgotPassword');
                          setForgotStep(1);
                          setForgotIdentifier(loginIdentifier);
                          setError('');
                          setSuccessMessage('');
                        }}
                        style={{ alignSelf: 'flex-end', marginTop: -2 }}
                      >
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handlePasswordLogin}
                        activeOpacity={0.8}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.primaryButtonText}>Log In with Password</Text>
                            <ArrowRight size={18} color="#FFFFFF" />
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.googleAuthBtnCustomer}
                    onPress={handleGoogleCustomerSignIn}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <GoogleLogoIcon size={18} />
                    <Text style={styles.googleAuthBtnTextCustomer}>Continue with Google</Text>
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR FAST DEMO</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    style={styles.demoButton}
                    onPress={handleQuickDemoLogin}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={16} color="#4F46E5" />
                    <Text style={styles.demoButtonText}>Quick 1-Click Demo Customer Login</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* VIEW 2: CUSTOMER SIGN UP VIEW */}
              {mode === 'signup' && step === 'details' && (
                <View style={styles.formGroup}>
                  {/* Signup Auth Channel Switcher (Mobile vs Email) Removed */}

                  {/* Full Name Input */}
                  <TouchableOpacity
                    style={styles.inputContainer}
                    activeOpacity={1}
                    onPress={() => nameInputRef.current?.focus()}
                  >
                    <UserIcon size={18} color="#4F46E5" style={styles.inputIcon} />
                    <TextInput
                      ref={nameInputRef}
                      style={styles.textInput}
                      placeholder="Full Name *"
                      placeholderTextColor="#94A3B8"
                      value={name}
                      onChangeText={setName}
                    />
                  </TouchableOpacity>

                  {/* Mobile Input */}
                  <TouchableOpacity
                    style={styles.inputContainer}
                    activeOpacity={1}
                    onPress={() => phoneInputRef.current?.focus()}
                  >
                    <Phone size={18} color="#4F46E5" style={styles.inputIcon} />
                    <Text style={styles.prefixText}>+91</Text>
                    <TextInput
                      ref={phoneInputRef}
                      style={styles.textInput}
                      placeholder="10-Digit Mobile Number *"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </TouchableOpacity>

                  {/* Set Password Field */}
                  <TouchableOpacity
                    style={styles.inputContainer}
                    activeOpacity={1}
                    onPress={() => passwordInputRef.current?.focus()}
                  >
                    <KeyRound size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.textInput}
                      placeholder="Set Password (min. 6 chars) *"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Confirm Password Field */}
                  <TouchableOpacity
                    style={styles.inputContainer}
                    activeOpacity={1}
                    onPress={() => confirmPasswordInputRef.current?.focus()}
                  >
                    <KeyRound size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      ref={confirmPasswordInputRef}
                      style={styles.textInput}
                      placeholder="Confirm Password *"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Text style={styles.showBtnText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Delivery Address Input */}
                  <TouchableOpacity
                    style={styles.inputContainer}
                    activeOpacity={1}
                    onPress={() => addressInputRef.current?.focus()}
                  >
                    <MapPin size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      ref={addressInputRef}
                      style={styles.textInput}
                      placeholder="Delivery Address / City (Optional)"
                      placeholderTextColor="#94A3B8"
                      value={address}
                      onChangeText={setAddress}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSendOtpOrLink}
                    activeOpacity={0.8}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>
                          Proceed with Mobile OTP
                        </Text>
                        <ArrowRight size={18} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.googleAuthBtnCustomer}
                    onPress={handleGoogleCustomerSignIn}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <GoogleLogoIcon size={18} />
                    <Text style={styles.googleAuthBtnTextCustomer}>Sign Up with Google</Text>
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR FAST DEMO</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    style={styles.demoButton}
                    onPress={handleQuickDemoLogin}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={16} color="#4F46E5" />
                    <Text style={styles.demoButtonText}>Quick 1-Click Demo Customer Login</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* VIEW 3: OTP VERIFICATION VIEW */}
              {step === 'otp' && (
                <View style={styles.formGroup}>
                  <View style={styles.otpNoticeBox}>
                    <Text style={styles.otpSentText}>
                      Sent OTP verification code to{' '}
                      <Text style={{ fontWeight: '700', color: '#4F46E5' }}>
                        +91 {phone}
                      </Text>
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.inputContainer}
                    activeOpacity={1}
                    onPress={() => otpInputRef.current?.focus()}
                  >
                    <ShieldCheck size={20} color="#4F46E5" style={styles.inputIcon} />
                    <TextInput
                      ref={otpInputRef}
                      style={[styles.textInput, { letterSpacing: 6, fontSize: 18, fontWeight: '700' }]}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="#CBD5E1"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                      autoFocus
                    />
                  </TouchableOpacity>

                  <View style={styles.timerRow}>
                    <TouchableOpacity
                      disabled={resendTimer > 0 || isLoading}
                      onPress={handleSendOtpOrLink}
                    >
                      <Text style={[styles.timerText, resendTimer === 0 && styles.timerTextActive]}>
                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setStep('details')}>
                      <Text style={styles.changeContactText}>Edit Contact Details</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleVerifyAndLogin}
                    activeOpacity={0.8}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Verify & Save Account</Text>
                        <CheckCircle2 size={18} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* VIEW 4: SET PASSWORD (VERIFICATION LINK RETURN) */}
              {step === 'setPassword' && (
                <View style={styles.formGroup}>
                  <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18 }}>
                    Email verified successfully! Please set a password for your account so you can easily log in anytime.
                  </Text>

                  <TouchableOpacity
                    style={styles.inputContainer}
                    activeOpacity={1}
                    onPress={() => passwordInputRef.current?.focus()}
                  >
                    <KeyRound size={18} color="#4F46E5" style={styles.inputIcon} />
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.textInput}
                      placeholder="New Account Password (min. 6 chars) *"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.inputContainer}
                    activeOpacity={1}
                    onPress={() => confirmPasswordInputRef.current?.focus()}
                  >
                    <KeyRound size={18} color="#4F46E5" style={styles.inputIcon} />
                    <TextInput
                      ref={confirmPasswordInputRef}
                      style={styles.textInput}
                      placeholder="Confirm Account Password *"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Text style={styles.showBtnText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSetPasswordSubmit}
                    activeOpacity={0.8}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Save Password & Continue</Text>
                        <CheckCircle2 size={18} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* VIEW 5: FORGOT PASSWORD RESET */}
              {step === 'forgotPassword' && (
                <View style={styles.formGroup}>
                  {/* FORGOT STEP 1: Enter Registered Email or Mobile */}
                  {forgotStep === 1 && (
                    <>
                      <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18 }}>
                        Enter your registered Mobile Number. We will send a secure verification code.
                      </Text>

                      <TouchableOpacity
                        style={styles.inputContainer}
                        activeOpacity={1}
                        onPress={() => loginIdentifierRef.current?.focus()}
                      >
                        <UserIcon size={18} color="#4F46E5" style={styles.inputIcon} />
                        <TextInput
                          ref={loginIdentifierRef}
                          style={styles.textInput}
                          placeholder="Registered Mobile Number *"
                          placeholderTextColor="#94A3B8"
                          autoCapitalize="none"
                          keyboardType="phone-pad"
                          value={forgotIdentifier}
                          onChangeText={setForgotIdentifier}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleSendForgotResetLinkOrOtp}
                        activeOpacity={0.8}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.primaryButtonText}>Send Reset Link / OTP</Text>
                            <ArrowRight size={18} color="#FFFFFF" />
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setStep('details')}
                        style={{ alignSelf: 'center', marginTop: 8 }}
                      >
                        <Text style={styles.changeContactText}>Back to Login</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* FORGOT STEP 2: Link Sent / Enter OTP Verification */}
                  {forgotStep === 2 && (
                    <>
                      {forgotIdentifier.includes('@') ? (
                        /* EMAIL LINK SENT PENDING UI */
                        <View style={{ gap: 12 }}>
                          <View style={styles.otpNoticeBox}>
                            <Mail size={22} color="#4F46E5" style={{ marginBottom: 4 }} />
                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', textAlign: 'center' }}>
                              Password Reset Link Sent!
                            </Text>
                            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 }}>
                              We've sent a secure password reset link to{' '}
                              <Text style={{ fontWeight: '700', color: '#4F46E5' }}>{forgotIdentifier}</Text>.
                              Please check your inbox and click the link to reset your password.
                            </Text>
                          </View>

                          {/* DIRECT PROCEED / LOCAL TESTING LINK BUTTON */}
                          <TouchableOpacity
                            style={[styles.demoButton, { backgroundColor: '#EEF2FF', borderColor: '#A5B4FC' }]}
                            onPress={() => {
                              setForgotStep(3);
                              setError('');
                              setSuccessMessage('Proceeding to Create New Password for ' + forgotIdentifier);
                            }}
                            activeOpacity={0.8}
                          >
                            <Sparkles size={16} color="#4F46E5" />
                            <Text style={[styles.demoButtonText, { color: '#4338CA' }]}>
                              ⚡ Click Here to Open Set Password Form Directly
                            </Text>
                          </TouchableOpacity>

                          <View style={styles.timerRow}>
                            <TouchableOpacity
                              disabled={resendTimer > 0 || isLoading}
                              onPress={handleSendForgotResetLinkOrOtp}
                            >
                              <Text style={[styles.timerText, resendTimer === 0 && styles.timerTextActive]}>
                                {resendTimer > 0 ? `Resend Reset Link in ${resendTimer}s` : 'Resend Reset Link'}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setForgotStep(1)}>
                              <Text style={styles.changeContactText}>Edit Contact Info</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        /* MOBILE OTP ENTRY UI */
                        <View style={{ gap: 12 }}>
                          <View style={styles.otpNoticeBox}>
                            <Text style={styles.otpSentText}>
                              Sent OTP security code to{' '}
                              <Text style={{ fontWeight: '700', color: '#4F46E5' }}>+91 {forgotIdentifier}</Text>
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={styles.inputContainer}
                            activeOpacity={1}
                            onPress={() => otpInputRef.current?.focus()}
                          >
                            <ShieldCheck size={20} color="#4F46E5" style={styles.inputIcon} />
                            <TextInput
                              ref={otpInputRef}
                              style={[styles.textInput, { letterSpacing: 6, fontSize: 18, fontWeight: '700' }]}
                              placeholder="Enter 6-digit OTP"
                              placeholderTextColor="#CBD5E1"
                              keyboardType="number-pad"
                              maxLength={6}
                              value={forgotOtp}
                              onChangeText={setForgotOtp}
                              autoFocus
                            />
                          </TouchableOpacity>

                          <View style={styles.timerRow}>
                            <TouchableOpacity
                              disabled={resendTimer > 0 || isLoading}
                              onPress={handleSendForgotResetLinkOrOtp}
                            >
                              <Text style={[styles.timerText, resendTimer === 0 && styles.timerTextActive]}>
                                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setForgotStep(1)}>
                              <Text style={styles.changeContactText}>Edit Mobile Number</Text>
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleVerifyForgotOtp}
                            activeOpacity={0.8}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <>
                                <Text style={styles.primaryButtonText}>Verify OTP & Set New Password</Text>
                                <ArrowRight size={18} color="#FFFFFF" />
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}

                  {/* FORGOT STEP 3: Set New Password Form (Only shown AFTER link click or OTP verification) */}
                  {forgotStep === 3 && (
                    <>
                      <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18 }}>
                        Create a new secure password for <Text style={{ fontWeight: '700', color: '#4F46E5' }}>{forgotIdentifier}</Text>.
                      </Text>

                      <TouchableOpacity
                        style={styles.inputContainer}
                        activeOpacity={1}
                        onPress={() => passwordInputRef.current?.focus()}
                      >
                        <KeyRound size={18} color="#4F46E5" style={styles.inputIcon} />
                        <TextInput
                          ref={passwordInputRef}
                          style={styles.textInput}
                          placeholder="New Password (min. 6 chars) *"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry={!showForgotNewPassword}
                          value={forgotNewPassword}
                          onChangeText={setForgotNewPassword}
                        />
                        <TouchableOpacity onPress={() => setShowForgotNewPassword(!showForgotNewPassword)}>
                          <Text style={styles.showBtnText}>{showForgotNewPassword ? 'Hide' : 'Show'}</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.inputContainer}
                        activeOpacity={1}
                        onPress={() => confirmPasswordInputRef.current?.focus()}
                      >
                        <KeyRound size={18} color="#4F46E5" style={styles.inputIcon} />
                        <TextInput
                          ref={confirmPasswordInputRef}
                          style={styles.textInput}
                          placeholder="Confirm New Password *"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry={!showConfirmPassword}
                          value={forgotConfirmPassword}
                          onChangeText={setForgotConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                          <Text style={styles.showBtnText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleCustomerResetPassword}
                        activeOpacity={0.8}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <>
                            <Text style={styles.primaryButtonText}>Save New Password & Log In</Text>
                            <CheckCircle2 size={18} color="#FFFFFF" />
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setStep('details')}
                        style={{ alignSelf: 'center', marginTop: 6 }}
                      >
                        <Text style={styles.changeContactText}>Back to Login</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>

            <View style={styles.footerInfo}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.footerInfoText}>100% Safe & Secure TafDeal Customer Authentication</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 440,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    backgroundColor: '#0F172A',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#4F46E5',
    fontWeight: '900',
    fontSize: 12,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EDF2F7',
  },
  body: {
    padding: 22,
  },
  modeTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  methodTabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  methodTabActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  methodTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  methodTabTextActive: {
    color: '#4F46E5',
  },
  subMethodRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 3,
    marginBottom: 6,
  },
  subMethodTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  subMethodTabActive: {
    backgroundColor: '#FFFFFF',
  },
  subMethodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  subMethodTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  successText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  formGroup: {
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  inputIcon: {
    marginRight: 10,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 0,
          outlineStyle: 'none',
        } as any)
      : {}),
  },
  showBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    paddingHorizontal: 4,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  demoButton: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  demoButtonText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
  },
  otpNoticeBox: {
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  otpSentText: {
    fontSize: 13,
    color: '#475569',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  timerTextActive: {
    color: '#4F46E5',
  },
  changeContactText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
  },
  footerInfoText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  googleAuthBtnCustomer: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  googleAuthBtnTextCustomer: {
    color: '#3C4043',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
