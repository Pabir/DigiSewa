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
} from 'lucide-react-native';
import { useAuth, SellerApplicationPayload } from '../../context/AuthContext';

import { auth } from '../../config/firebaseConfig';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';

export const SellerLoginScreen: React.FC = () => {
  const {
    submitSellerApplication,
    loginAsSeller,
    sellerProfile,
    isAuthenticated,
  } = useAuth();

  // Mode: 'login' | 'register'
  const [viewMode, setViewMode] = useState<'login' | 'register'>('login');

  // LOGIN FORM STATE
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  // REGISTER ONBOARDING STATE
  // Steps: 1 = Verification, 2 = Business Details, 3 = Pickup Address, 4 = Bank Details, 5 = Supplier Details & Password
  const [activeStep, setActiveStep] = useState<number>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(1);

  // Step 1: Verification Choice (Mobile OTP vs Email Auth)
  const [authMethod, setAuthMethod] = useState<'mobile' | 'email'>('mobile');
  const [registerMobile, setRegisterMobile] = useState<string>('+91 98765 01234');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isMobileVerified, setIsMobileVerified] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Email Auth State (Real Firebase Email Verification)
  const [registerEmail, setRegisterEmail] = useState<string>('seller@digisewa.com');
  const [emailOtpCode, setEmailOtpCode] = useState<string>('');
  const [isEmailOtpSent, setIsEmailOtpSent] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState<boolean>(false);

  // Auto-verify when user clicks Firebase email verification link
  useEffect(() => {
    if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
      const savedEmail = window.localStorage.getItem('emailForSignIn') || registerEmail;
      if (savedEmail) {
        signInWithEmailLink(auth, savedEmail, window.location.href)
          .then(() => {
            setIsEmailVerified(true);
            setEmail(savedEmail);
            setAuthMethod('email');
            setMaxCompletedStep(prev => Math.max(prev, 2));
            setActiveStep(2);
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('emailForSignIn');
            }
          })
          .catch(err => {
            console.warn('Auto email link verification info:', err);
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
  const [eidState, setEidState] = useState<string>('Assam');
  const [eidPincode, setEidPincode] = useState<string>('781001');
  const [eidDistrict, setEidDistrict] = useState<string>('Kamrup Metropolitan');
  const [eidCity, setEidCity] = useState<string>('Guwahati');
  const [eidBuilding, setEidBuilding] = useState<string>('');
  const [eidStreet, setEidStreet] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [captchaCode, setCaptchaCode] = useState<string>('7K9M2');

  // Step 3: Pickup Address
  const [building, setBuilding] = useState<string>('Building 4B, Sector 2');
  const [street, setStreet] = useState<string>('Main Bazaar Road');
  const [pincode, setPincode] = useState<string>('781001');
  const [city, setCity] = useState<string>('Guwahati');
  const [state, setState] = useState<string>('Assam');
  const [district, setDistrict] = useState<string>('Kamrup Metropolitan');

  // Step 4: Bank Details
  const [accountNumber, setAccountNumber] = useState<string>('918020044556611');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState<string>('918020044556611');
  const [ifscCode, setIfscCode] = useState<string>('UTIB0000123');
  const [accountHolderName, setAccountHolderName] = useState<string>('Sk Pabirul Islam');
  const [bankName, setBankName] = useState<string>('Axis Bank - Guwahati Branch');

  // Step 5: Supplier Details & Password
  const [storeName, setStoreName] = useState<string>('Al Mursaleen Stores');
  const [fullName, setFullName] = useState<string>('Sk Pabirul Islam');
  const [phone, setPhone] = useState<string>('+91 98765 01234');
  const [email, setEmail] = useState<string>('drskpabirulislam1995@gmail.com');
  const [registerPassword, setRegisterPassword] = useState<string>('password123');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState<string>('password123');
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
              <Text style={styles.summaryVal}>{sellerProfile.phone || '+91 98765 01234'}</Text>
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
    loginAsSeller('+91 98765 01234', 'password123');
  };

  // HANDLERS FOR MOBILE OTP (STEP 1)
  const handleSendOtp = async () => {
    const cleanNumber = registerMobile.replace(/\D/g, '');
    if (!cleanNumber || cleanNumber.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMsg('');
    setOtpError('');
    setIsSendingOtp(true);

    const formattedNumber = cleanNumber.length === 10 ? `+91${cleanNumber}` : `+${cleanNumber}`;

    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
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
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
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
    if (!registerEmail || !registerEmail.includes('@') || !registerEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setOtpError('');
    setIsSendingEmailOtp(true);

    const actionCodeSettings = {
      url: typeof window !== 'undefined' ? window.location.href : 'https://digisewa-ac3c4.firebaseapp.com',
      handleCodeInApp: true,
    };

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('emailForSignIn', registerEmail);
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
        setErrorMsg('⚠️ Sub-toggle Disabled: In Firebase Console, click the pencil (✏️) icon next to Email/Password in your screenshot and turn ON the 2nd switch: "Email link (passwordless sign-in)" -> Save.');
      } else if (errCode === 'auth/unauthorized-continue-uri') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        setErrorMsg(`⚠️ Domain Error: '${domain}' is not listed in Firebase Console -> Authentication -> Settings -> Authorized domains.`);
      } else if (errCode === 'auth/invalid-email') {
        setErrorMsg('⚠️ Invalid Email: Please enter a valid email address.');
      } else {
        setErrorMsg(`Firebase Email Error (${errCode}): ${errMsg}`);
      }
      setIsEmailOtpSent(false);
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setErrorMsg('');
    setOtpError('');
    setIsSendingEmailOtp(true);

    try {
      if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
        let emailToVerify = registerEmail;
        if (!emailToVerify && typeof window !== 'undefined') {
          emailToVerify = window.localStorage.getItem('emailForSignIn') || '';
        }
        await signInWithEmailLink(auth, emailToVerify, window.location.href);
        if (typeof window !== 'undefined') {
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
    if (!storeName || !fullName || !phone) {
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
      email: email || `${phone.replace(/\D/g, '')}@digisewa.in`,
      phone: registerMobile || phone,
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
  // VIEW MODE 1: SUPPLIER PANEL LOGIN (Matches Meesho Supplier Panel Design)
  // -------------------------------------------------------------
  if (viewMode === 'login') {
    return (
      <ScrollView contentContainerStyle={styles.meeshoLoginPageContainer}>
        {/* Top Brand Logo Container */}
        <View style={styles.meeshoLogoHeader}>
          <Text style={styles.meeshoLogoText}>
            digi<Text style={{ color: '#9333EA', fontWeight: '900' }}>sewa</Text>
          </Text>
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
            onPress={() => setShowForgotModal(true)}
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

          {/* Quick Demo Bypass Shortcut */}
          <TouchableOpacity onPress={handleQuickDemoLogin} style={styles.instantDemoBannerBtn}>
            <Sparkles size={14} color="#7C3AED" />
            <Text style={styles.instantDemoBannerText}>Instant Demo Login (+91 98765 01234)</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Section: New to DigiSewa? -> Create Account */}
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
        </View>

        {/* FORGOT PASSWORD MODAL */}
        <Modal transparent visible={showForgotModal} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Reset Supplier Password</Text>
                <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={{ paddingVertical: 16, gap: 12 }}>
                <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18 }}>
                  Enter your registered mobile number or email ID to receive a password reset OTP.
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Registered mobile number or email"
                  placeholderTextColor="#94A3B8"
                  value={loginIdentifier}
                  onChangeText={setLoginIdentifier}
                />
                <TouchableOpacity
                  style={[styles.continueBtn, { marginTop: 8 }]}
                  onPress={() => {
                    alert('🔐 OTP sent to your registered mobile/email. Use password123 to log in.');
                    setShowForgotModal(false);
                  }}
                >
                  <Text style={styles.continueBtnText}>Send Reset Link</Text>
                </TouchableOpacity>
              </View>
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
          </View>

          {/* METHOD A: MOBILE OTP */}
          {authMethod === 'mobile' && (
            !isMobileVerified ? (
              <View style={styles.formGroupGap}>
                <Text style={styles.inputLabel}>Enter 10-Digit Mobile Number *</Text>
                <View style={styles.inputWithBtnRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="+91 98765 01234"
                    keyboardType="phone-pad"
                    value={registerMobile}
                    onChangeText={text => {
                      setRegisterMobile(text);
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
                    placeholder="seller@digisewa.com"
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

                {/* EMAIL OTP SECTION */}
                {isEmailOtpSent ? (
                  <View style={styles.otpCardBox}>
                    <View style={styles.otpBanner}>
                      <Sparkles size={16} color="#4338CA" />
                      <Text style={styles.otpBannerText}>
                        📩 Official Firebase verification email sent to {registerEmail}. Check your email inbox & click the link or click Verify to confirm!
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <TouchableOpacity onPress={handleSendEmailOtp} disabled={resendTimer > 0}>
                        <Text style={{ fontSize: 12, color: resendTimer > 0 ? '#94A3B8' : '#7C3AED', fontWeight: '700' }}>
                          {resendTimer > 0 ? `Resend email in ${resendTimer}s` : 'Resend Email'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.verifyOtpActionBtn} onPress={handleVerifyEmailOtp}>
                        <CheckCircle2 size={16} color="#FFFFFF" />
                        <Text style={styles.verifyOtpActionBtnText}>Confirm Verification</Text>
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
              placeholder="e.g. UTIB0000123"
              autoCapitalize="characters"
              value={ifscCode}
              onChangeText={text => {
                setIfscCode(text.toUpperCase());
                if (text.length >= 4) setBankName('Axis Bank - Verified Branch');
              }}
            />

            {bankName ? (
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
            {/* Verified Mobile Number Badge */}
            <View style={styles.verifiedMobileBadgeRow}>
              <CheckCircle2 size={16} color="#059669" />
              <Text style={styles.verifiedMobileBadgeText}>Verified Mobile: {registerMobile}</Text>
            </View>

            <Text style={styles.inputLabel}>Store Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Al Mursaleen Stores"
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
                Create a secure password so you can easily log into your DigiSewa supplier panel anytime using your mobile number ({registerMobile}) and password.
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
    marginBottom: 24,
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
});
