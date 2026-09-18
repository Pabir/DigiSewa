import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { ArrowLeft, Trash2, MapPin, CreditCard, Banknote, ShieldCheck, Check, Landmark, Wallet } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder, getSellersFromFirestore, getProducts, listenToSystemSettings } from '../../services/firebaseService';
import { shiprocketLogin, checkServiceability } from '../../services/shiprocketService';
import { checkShadowfaxServiceability, generateShadowfaxAWB } from '../../services/shadowfaxService';
import { calculateShadowfaxDeliveryCharge } from '../../utils/shippingUtils';
import { Platform } from 'react-native';
import { functions } from '../../config/firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { SystemSettings } from '../../types/adminTypes';

interface CartScreenProps {
  onBack: () => void;
  onOrderSuccess: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({ onBack, onOrderSuccess }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { items, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const { user, isAuthenticated, openCustomerAuthModal, updateUserAddress } = useAuth();

  const addressStr = user?.address || '';
  const defaultPincodeMatch = addressStr.match(/\b\d{6}\b/);
  const defaultPincode = defaultPincodeMatch ? defaultPincodeMatch[0] : '';
  
  let initHouse = '';
  let initArea = '';
  let initDistrict = '';
  let initState = '';

  if (addressStr) {
    const firstLine = addressStr.split('\n')[0];
    const parts = firstLine.split(',').map(s => s.trim());
    if (parts.length >= 5) {
      initHouse = parts[0];
      initArea = parts[1];
      initDistrict = parts[2];
      initState = parts[3];
    } else if (parts.length >= 3) {
      initHouse = parts[0];
      initArea = parts[1];
    } else {
      initArea = parts[0] || '';
    }
  }

  const [houseName, setHouseName] = useState<string>(initHouse);
  const [area, setArea] = useState<string>(initArea);
  const [district, setDistrict] = useState<string>(initDistrict);
  const [state, setState] = useState<string>(initState);
  const [pincode, setPincode] = useState<string>(defaultPincode);
  const [fullName, setFullName] = useState<string>(user?.name || '');
  const [mobile, setMobile] = useState<string>(user?.phone || '');
  const [altMobile, setAltMobile] = useState<string>('');
  const [addressType, setAddressType] = useState<'home' | 'work'>('home');
  
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(user?.addresses?.find(a => a.isDefault)?.id || null);

  useEffect(() => {
    if (selectedAddressId && user?.addresses) {
      const addr = user.addresses.find(a => a.id === selectedAddressId);
      if (addr) {
        setFullName(addr.fullName || user.name || '');
        setMobile(addr.phone || user.phone || '');
        const parts = addr.fullAddress.split(',');
        setHouseName(parts[0]?.trim() || '');
        setArea(parts.slice(1).join(',')?.trim() || '');
        setDistrict(addr.city || '');
        setState(addr.state || '');
        setPincode(addr.pincode || '');
        setAddressType(addr.title.toLowerCase().includes('work') ? 'work' : 'home');
      }
    }
  }, [selectedAddressId, user?.addresses]);

  const [paymentMode, setPaymentMode] = useState<'upi' | 'card' | 'netbanking' | 'wallet' | 'cod'>('upi');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);

  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState<number | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState<boolean>(false);

  const [selectedCourier, setSelectedCourier] = useState<'shiprocket' | 'shadowfax'>('shiprocket');
  const [shiprocketFee, setShiprocketFee] = useState<number | null>(null);
  const [shadowfaxFee, setShadowfaxFee] = useState<number | null>(null);
  const [isShadowfaxServiceable, setIsShadowfaxServiceable] = useState<boolean>(true);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({ shiprocketEnabled: true, shadowfaxEnabled: true });

  useEffect(() => {
    const unsubscribe = listenToSystemSettings((settings) => {
      setSystemSettings(settings);
      // Auto fallback if currently selected courier was disabled
      if (!settings.shadowfaxEnabled && selectedCourier === 'shadowfax') {
        setSelectedCourier('shiprocket');
      }
      if (!settings.shiprocketEnabled && selectedCourier === 'shiprocket' && settings.shadowfaxEnabled) {
        setSelectedCourier('shadowfax');
      }
    });
    return () => unsubscribe();
  }, [selectedCourier]);

  useEffect(() => {
    const calculateShipping = async () => {
      if (!pincode || pincode.length !== 6 || items.length === 0) {
        setShiprocketFee(null);
        setShadowfaxFee(null);
        return;
      }
      setIsCalculatingShipping(true);
      try {
        const token = await shiprocketLogin();
        const sellers = await getSellersFromFirestore();
        const latestProducts = await getProducts();
        
        const sellerIds = Array.from(new Set(items.map(i => i.product.sellerId)));
        let totalShiprocket = 0;
        let totalShadowfax = 0;
        let shadowfaxServiceable = true;
        
        for (const sellerId of sellerIds) {
          const seller = sellers.find(s => s.id === sellerId);
          const pickupPincode = seller?.pickupAddress?.pincode || '110030';
          const weight = 0.5; // Mock 0.5kg base weight
          const infoArray = await checkServiceability(pickupPincode, pincode, weight, token, paymentMode === 'cod');
          const sfServiceable = await checkShadowfaxServiceability(pincode);
          if (!sfServiceable) shadowfaxServiceable = false;

          const sellerItems = items.filter(i => i.product.sellerId === sellerId);
          const wantsFast = sellerItems.some(i => i.deliveryPreference === 'fast');
          const sellerOffersFreeShipping = sellerItems.some(i => {
            const latestProduct = latestProducts.find(p => p.id === i.product.id);
            return latestProduct?.offerFreeShipping || i.product.offerFreeShipping;
          });

          if (sellerOffersFreeShipping) {
            totalShiprocket += 0;
            totalShadowfax += 0;
          } else {
            // Shiprocket
            if (infoArray && Array.isArray(infoArray) && infoArray.length > 0) {
              let selectedOption = infoArray.find(o => o.type === (wantsFast ? 'fast' : 'budget'));
              if (!selectedOption) selectedOption = infoArray[0];
              totalShiprocket += selectedOption.rate;
            }
            
            // Shadowfax
            totalShadowfax += calculateShadowfaxDeliveryCharge(pickupPincode, pincode);
          }
        }
        
        setShiprocketFee(totalShiprocket);
        setShadowfaxFee(totalShadowfax);
        setIsShadowfaxServiceable(shadowfaxServiceable);
        
        // Auto-select cheapest if Shadowfax is serviceable
        if (shadowfaxServiceable && totalShadowfax < totalShiprocket) {
          setSelectedCourier('shadowfax');
        } else {
          setSelectedCourier('shiprocket');
        }

      } catch (err) {
        console.warn('Failed to calculate dynamic shipping', err);
        setShiprocketFee(null);
        setShadowfaxFee(null);
      } finally {
        setIsCalculatingShipping(false);
      }
    };
    
    const timer = setTimeout(() => {
      calculateShipping();
    }, 800);
    return () => clearTimeout(timer);
  }, [pincode, items, paymentMode]);

  const deliveryFee = selectedCourier === 'shiprocket' ? shiprocketFee : shadowfaxFee;
  
  const validDeliveryFee = deliveryFee !== null ? deliveryFee : 0;
  const platformFee = 5;
  const grandTotal = totalAmount + validDeliveryFee + platformFee;

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    if (!isAuthenticated || !user) {
      openCustomerAuthModal('checkout');
      return;
    }

    if (!houseName.trim() || !area.trim() || !district.trim() || !state.trim() || !pincode.trim() || !fullName.trim() || !mobile.trim()) {
      alert('Please fill all mandatory address fields (House Name, Area, District, State, Pincode, Name, Mobile).');
      return;
    }

    setIsPlacingOrder(true);

    const fullDeliveryAddress = `${houseName}, ${area}, ${district}, ${state}, ${pincode}\nName: ${fullName}\nPhone: ${mobile}${altMobile ? `, Alt Phone: ${altMobile}` : ''}\nType: ${addressType.toUpperCase()}`;

    if (fullDeliveryAddress !== user.address) {
      updateUserAddress(fullDeliveryAddress);
    }

    // Split items by seller
    const ordersBySeller: Record<string, CartItem[]> = {};
    items.forEach(item => {
      if (!ordersBySeller[item.product.sellerId]) {
        ordersBySeller[item.product.sellerId] = [];
      }
      ordersBySeller[item.product.sellerId].push(item);
    });

    const processOrders = async (paymentId?: string, rzpOrderId?: string, initialFulfillmentStatus: any = 'pending', initialPaymentStatus: any = 'pending') => {
      const sellerIds = Object.keys(ordersBySeller);
      for (const sellerId of sellerIds) {
        const sellerItems = ordersBySeller[sellerId];
        const sellerTotal = sellerItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
        
        const isFirst = sellerIds.indexOf(sellerId) === 0;

        let estimatedDelivery = '30 mins Express';
        let actualShippingCost = 0;
        let shippingFee = 0;
        const sellerOffersFreeShipping = sellerItems.some(i => i.product.offerFreeShipping);
        try {
          let pickupPincode = '110030';
          const sellers = await getSellersFromFirestore();
          const seller = sellers.find(s => s.id === sellerId);
          if (seller?.pickupAddress?.pincode) {
            pickupPincode = seller.pickupAddress.pincode;
          }
          const deliveryPincode = pincode.trim() || '110001';
          const wantsFast = sellerItems.some(i => i.deliveryPreference === 'fast');
          
          if (selectedCourier === 'shadowfax') {
            actualShippingCost = calculateShadowfaxDeliveryCharge(pickupPincode, deliveryPincode);
            estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString();
          } else {
            const token = await shiprocketLogin();
            const infoArray = await checkServiceability(pickupPincode, deliveryPincode, 0.5, token, paymentMode === 'cod');
            
            if (infoArray && Array.isArray(infoArray) && infoArray.length > 0) {
              let selectedOption = infoArray.find(o => o.type === (wantsFast ? 'fast' : 'budget'));
              if (!selectedOption) selectedOption = infoArray[0];
              estimatedDelivery = new Date(selectedOption.estimatedDeliveryDate).toDateString();
              actualShippingCost = selectedOption.rate;
            }
          }
        } catch (e) {
          console.warn('Failed to fetch expected delivery for seller', e);
        }

        if (sellerOffersFreeShipping) {
          shippingFee = 0;
        } else {
          shippingFee = actualShippingCost;
        }

        const currentPlatformFee = isFirst ? platformFee : 0;
        const orderTotal = sellerTotal + shippingFee + currentPlatformFee;

        let shadowfaxAwb = '';
        if (selectedCourier === 'shadowfax') {
          const awbs = await generateShadowfaxAWB(1);
          if (awbs && awbs.length > 0) {
            shadowfaxAwb = awbs[0];
          }
        }

        await createOrder({
          buyerId: user.id,
          buyerName: user.name,
          buyerPhone: user.phone,
          deliveryAddress: fullDeliveryAddress,
          items: sellerItems,
          totalAmount: orderTotal,
          productTotal: sellerTotal,
          shippingFee: shippingFee,
          actualShippingCost: actualShippingCost,
          sellerOffersFreeShipping: sellerOffersFreeShipping,
          platformFee: currentPlatformFee,
          paymentMode,
          paymentStatus: initialPaymentStatus,
          fulfillmentStatus: initialFulfillmentStatus,
          deliveryStatus: 'unshipped',
          estimatedDelivery,
          courierPartner: selectedCourier,
          shadowfaxAwb,
          awbCode: shadowfaxAwb,
          razorpayPaymentId: paymentId,
          razorpayOrderId: rzpOrderId
        } as any); // cast to any to allow razorpayPaymentId if not in Order interface
      }
    };

    try {
      if (paymentMode !== 'cod') {
        if (Platform.OS !== 'web') {
           alert("Online payment is only supported on Web in this demo.");
           setIsPlacingOrder(false);
           return;
        }
        
        // 1. Create Razorpay Order Server-Side
        let rzpOrderId = '';
        try {
          const createRzpOrder = httpsCallable(functions, 'createRazorpayOrder');
          const result = await createRzpOrder({ amount: grandTotal });
          const data = result.data as any;
          rzpOrderId = data.orderId;
        } catch (err: any) {
          alert("Failed to initialize payment: " + err.message);
          setIsPlacingOrder(false);
          return;
        }

        // 2. Save Preliminary Orders as Payment Pending
        await processOrders(undefined, rzpOrderId, 'pending', 'payment_pending');

        const res = await loadRazorpay();
        if (!res) {
          alert("Razorpay SDK failed to load. Are you online?");
          setIsPlacingOrder(false);
          return;
        }

        const options = {
          key: "rzp_test_TM5arepb23gG9I", 
          amount: Math.round(grandTotal * 100),
          currency: "INR",
          name: "TafDeal",
          description: "Order Payment",
          order_id: rzpOrderId, // Crucial for Webhook integration
          handler: async function (response: any) {
             // Payment successful on frontend. Webhook will update backend.
             setIsPlacingOrder(false);
             clearCart();
             onOrderSuccess();
          },
          prefill: {
            name: fullName,
            contact: mobile,
            email: user.email || ""
          },
          theme: { color: "#4F46E5" }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert("Payment failed or cancelled. You can retry from My Orders.");
          setIsPlacingOrder(false);
          clearCart();
          onOrderSuccess();
        });
        rzp.open();
      } else {
        await processOrders(undefined, undefined, 'pending', 'pending');
        setIsPlacingOrder(false);
        clearCart();
        onOrderSuccess();
      }
    } catch (error: any) {
      console.error(error);
      alert(`Something went wrong during checkout: ${error?.message || error}`);
      setIsPlacingOrder(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart ({items.length} items)</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Add fresh local groceries and services to your cart.</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={onBack}>
            <Text style={styles.exploreBtnText}>Explore Local Market</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.contentContainer}>
            <View style={isDesktop ? styles.cartGridDesktop : styles.cartGridMobile}>
              {/* Left Column: Items & Address */}
              <View style={isDesktop ? styles.leftColDesktop : styles.colMobile}>
                {/* Cart Items List */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading}>Items in Cart</Text>
                  {items.map(item => (
                    <View key={item.product.id} style={styles.cartItemRow}>
                      <Image source={{ uri: item.product.imageUrl }} style={styles.itemImage} />

                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={styles.itemTitle}>
                          {item.product.title} {item.product.selectedSize ? `(Size: ${item.product.selectedSize})` : ''} {item.product.color ? `(Color: ${item.product.color})` : ''}
                        </Text>
                        <Text style={styles.sellerSubtext}>Seller: {item.product.sellerName}</Text>
                        <Text style={styles.itemPrice}>₹{item.product.price} / {item.product.unit}</Text>
                      </View>

                      {/* Quantity controls */}
                      <View style={styles.qtyBox}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.product.id, item.quantity - 1, item.product.selectedSize, item.product.color)}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.product.id, item.quantity + 1, item.product.selectedSize, item.product.color)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.trashBtn}
                        onPress={() => removeFromCart(item.product.id, item.product.selectedSize, item.product.color)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Delivery Address Input */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <MapPin size={18} color="#4F46E5" />
                    <Text style={styles.sectionHeading}>Deliver To</Text>
                  </View>

                  {user?.addresses && user.addresses.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={[styles.inputLabel, { marginBottom: 8 }]}>Select Saved Address</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                        {user.addresses.map(addr => (
                          <TouchableOpacity
                            key={addr.id}
                            style={[
                              { padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, width: 220, backgroundColor: '#FFFFFF' },
                              selectedAddressId === addr.id && { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' }
                            ]}
                            onPress={() => setSelectedAddressId(addr.id)}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: selectedAddressId === addr.id ? '#4F46E5' : '#0F172A' }}>{addr.title}</Text>
                              {addr.isDefault && <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}><Text style={{ fontSize: 9, color: '#15803D', fontWeight: '700' }}>Default</Text></View>}
                            </View>
                            <Text numberOfLines={2} style={{ fontSize: 12, color: '#475569', lineHeight: 16 }}>{addr.fullAddress}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 16 }} />
                    </View>
                  )}

                  <View style={styles.infoBanner}>
                    <Text style={styles.infoBannerText}>
                      Ensure your address details are accurate for a smooth delivery experience
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Flat/House/building name *</Text>
                    <TextInput
                      style={styles.detailedInput}
                      value={houseName}
                      onChangeText={setHouseName}
                      placeholder="e.g. Flat 101, Omkar Apartments"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Area/Sector/Locality *</Text>
                    <TextInput
                      style={styles.detailedInput}
                      value={area}
                      onChangeText={setArea}
                      placeholder="e.g. Sahapur, Nalpur"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>District *</Text>
                    <TextInput
                      style={styles.detailedInput}
                      value={district}
                      onChangeText={setDistrict}
                      placeholder="e.g. Howrah"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>State *</Text>
                    <TextInput
                      style={styles.detailedInput}
                      value={state}
                      onChangeText={setState}
                      placeholder="e.g. West Bengal"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Pincode *</Text>
                    <TextInput
                      style={styles.detailedInput}
                      value={pincode}
                      onChangeText={setPincode}
                      keyboardType="numeric"
                      maxLength={6}
                      placeholder="e.g. 711310"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Enter your full name *</Text>
                    <TextInput
                      style={styles.detailedInput}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Your full name"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>10-digit mobile number *</Text>
                    <TextInput
                      style={styles.detailedInput}
                      value={mobile}
                      onChangeText={setMobile}
                      keyboardType="numeric"
                      maxLength={10}
                      placeholder="Mobile number"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Alternate phone number (Optional)</Text>
                    <TextInput
                      style={styles.detailedInput}
                      value={altMobile}
                      onChangeText={setAltMobile}
                      keyboardType="numeric"
                      maxLength={10}
                      placeholder="Alternate phone number"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Type of address</Text>
                    <View style={styles.addressTypeRow}>
                      <TouchableOpacity
                        style={[styles.addressTypeBtn, addressType === 'home' && styles.addressTypeBtnActive]}
                        onPress={() => setAddressType('home')}
                      >
                        <Text style={[styles.addressTypeBtnText, addressType === 'home' && styles.addressTypeBtnTextActive]}>Home</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.addressTypeBtn, addressType === 'work' && styles.addressTypeBtnActive]}
                        onPress={() => setAddressType('work')}
                      >
                        <Text style={[styles.addressTypeBtnText, addressType === 'work' && styles.addressTypeBtnTextActive]}>Work</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Right Column: Payment & Bill Summary */}
              <View style={isDesktop ? styles.rightColDesktop : styles.colMobile}>
                {/* Delivery Options */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading}>Select Delivery Partner</Text>

                  {!systemSettings.shiprocketEnabled && !systemSettings.shadowfaxEnabled && (
                    <Text style={{ color: '#EF4444', marginBottom: 12 }}>Delivery services are temporarily unavailable.</Text>
                  )}

                  {systemSettings.shiprocketEnabled && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.paymentOption, selectedCourier === 'shiprocket' && styles.paymentOptionActive]}
                      onPress={() => setSelectedCourier('shiprocket')}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.paymentTitle}>Shiprocket Logistics</Text>
                        <Text style={styles.paymentSubtext}>Standard delivery</Text>
                      </View>
                      <Text style={{ fontWeight: '700', marginRight: 12, color: '#0F172A' }}>
                         {shiprocketFee !== null ? `₹${shiprocketFee}` : '...'}
                      </Text>
                      {selectedCourier === 'shiprocket' && <Check size={18} color="#4F46E5" />}
                    </TouchableOpacity>
                  )}

                  {systemSettings.shadowfaxEnabled && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.paymentOption, selectedCourier === 'shadowfax' && styles.paymentOptionActive, !isShadowfaxServiceable && { opacity: 0.5 }]}
                      onPress={() => isShadowfaxServiceable && setSelectedCourier('shadowfax')}
                      disabled={!isShadowfaxServiceable}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.paymentTitle}>Shadowfax Delivery</Text>
                        <Text style={styles.paymentSubtext}>
                           {isShadowfaxServiceable ? 'Reliable fulfillment' : 'Not serviceable at this pincode'}
                        </Text>
                      </View>
                      {isShadowfaxServiceable && (
                        <Text style={{ fontWeight: '700', marginRight: 12, color: '#0F172A' }}>
                           {shadowfaxFee !== null ? `₹${shadowfaxFee}` : '...'}
                        </Text>
                      )}
                      {selectedCourier === 'shadowfax' && <Check size={18} color="#4F46E5" />}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Payment Mode Selection */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading}>Payment Mode</Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.paymentOption, paymentMode === 'upi' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMode('upi')}
                  >
                    <Image source={{uri: 'https://cdn.razorpay.com/static/assets/upi/upi.png'}} style={{width: 20, height: 20}} resizeMode="contain" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentTitle}>UPI (GPay, PhonePe, Paytm)</Text>
                      <Text style={styles.paymentSubtext}>Pay instantly via UPI app</Text>
                    </View>
                    {paymentMode === 'upi' && <Check size={18} color="#4F46E5" />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.paymentOption, paymentMode === 'card' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMode('card')}
                  >
                    <CreditCard size={18} color={paymentMode === 'card' ? '#4F46E5' : '#64748B'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentTitle}>Credit / Debit / ATM Card</Text>
                      <Text style={styles.paymentSubtext}>Visa, MasterCard, RuPay & More</Text>
                    </View>
                    {paymentMode === 'card' && <Check size={18} color="#4F46E5" />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.paymentOption, paymentMode === 'netbanking' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMode('netbanking')}
                  >
                    <Landmark size={18} color={paymentMode === 'netbanking' ? '#4F46E5' : '#64748B'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentTitle}>Net Banking</Text>
                      <Text style={styles.paymentSubtext}>All major Indian banks supported</Text>
                    </View>
                    {paymentMode === 'netbanking' && <Check size={18} color="#4F46E5" />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.paymentOption, paymentMode === 'wallet' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMode('wallet')}
                  >
                    <Wallet size={18} color={paymentMode === 'wallet' ? '#4F46E5' : '#64748B'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentTitle}>Wallets</Text>
                      <Text style={styles.paymentSubtext}>Mobikwik, Freecharge, etc.</Text>
                    </View>
                    {paymentMode === 'wallet' && <Check size={18} color="#4F46E5" />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.paymentOption, paymentMode === 'cod' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMode('cod')}
                  >
                    <Banknote size={18} color={paymentMode === 'cod' ? '#4F46E5' : '#64748B'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentTitle}>Cash on Delivery (COD)</Text>
                      <Text style={styles.paymentSubtext}>Pay cash or UPI upon delivery</Text>
                    </View>
                    {paymentMode === 'cod' && <Check size={18} color="#4F46E5" />}
                  </TouchableOpacity>
                </View>

                {/* Bill Summary */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading}>Bill Breakdown</Text>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Item Total</Text>
                    <Text style={styles.billValue}>₹{totalAmount}</Text>
                  </View>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Delivery Charge</Text>
                    <Text style={styles.billValue}>
                      {isCalculatingShipping ? (
                        <Text style={{ color: '#4F46E5', fontSize: 12 }}>Calculating...</Text>
                      ) : (
                        deliveryFee === null ? (
                          <Text style={{ color: '#94A3B8', fontSize: 12 }}>Enter Pincode</Text>
                        ) : (
                          deliveryFee === 0 ? <Text style={{ color: '#16A34A' }}>FREE</Text> : `₹${deliveryFee}`
                        )
                      )}
                    </Text>
                  </View>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Hyperlocal Platform & Handling Fee</Text>
                    <Text style={styles.billValue}>₹{platformFee}</Text>
                  </View>

                  <View style={styles.billDivider} />

                  <View style={styles.billRowGrand}>
                    <Text style={styles.grandTotalLabel}>Grand Total</Text>
                    <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Place Order Sticky Footer */}
          <View style={styles.footerBar}>
            <View>
              <Text style={styles.footerLabel}>Total Amount</Text>
              <Text style={styles.footerPrice}>₹{grandTotal}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.placeOrderBtn, isPlacingOrder && styles.placeOrderBtnDisabled]}
              disabled={isPlacingOrder}
              onPress={handlePlaceOrder}
            >
              <ShieldCheck size={18} color="#FFFFFF" />
              <Text style={styles.placeOrderBtnText}>
                {isPlacingOrder ? 'Processing Order...' : 'Confirm Order'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  cartGridDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  cartGridMobile: {
    flexDirection: 'column',
    gap: 16,
  },
  leftColDesktop: {
    flex: 1.4,
    gap: 16,
  },
  rightColDesktop: {
    flex: 1,
    gap: 16,
  },
  colMobile: {
    gap: 16,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  sellerSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4F46E5',
    marginTop: 2,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  trashBtn: {
    padding: 6,
  },
  addressInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  infoBanner: {
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  infoBannerText: {
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  detailedInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  addressTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addressTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  addressTypeBtnActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  addressTypeBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  addressTypeBtnTextActive: {
    color: '#4F46E5',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  paymentOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  paymentSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  billRowGrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4F46E5',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  placeOrderBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  placeOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
