import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { ArrowLeft, Trash2, MapPin, CreditCard, Banknote, ShieldCheck, Check } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../services/firebaseService';

interface CartScreenProps {
  onBack: () => void;
  onOrderSuccess: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({ onBack, onOrderSuccess }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { items, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const { user, isAuthenticated, openCustomerAuthModal } = useAuth();

  const [deliveryAddress, setDeliveryAddress] = useState<string>(user?.address || '');
  const [paymentMode, setPaymentMode] = useState<'upi' | 'cod' | 'card'>('upi');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);

  const deliveryFee = totalAmount > 500 ? 0 : 30;
  const platformFee = 5;
  const grandTotal = totalAmount + deliveryFee + platformFee;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    if (!isAuthenticated || !user) {
      openCustomerAuthModal('checkout');
      return;
    }

    if (!deliveryAddress.trim()) {
      alert('Please enter a valid delivery address.');
      return;
    }

    setIsPlacingOrder(true);
    await createOrder({
      buyerId: user.id,
      buyerName: user.name,
      buyerPhone: user.phone,
      deliveryAddress,
      items: [...items],
      totalAmount: grandTotal,
      paymentMode,
      paymentStatus: paymentMode === 'cod' ? 'pending' : 'paid',
      status: 'pending',
      estimatedDelivery: '30 mins Express',
    });

    setIsPlacingOrder(false);
    clearCart();
    onOrderSuccess();
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
                          {item.product.title}
                        </Text>
                        <Text style={styles.sellerSubtext}>Seller: {item.product.sellerName}</Text>
                        <Text style={styles.itemPrice}>₹{item.product.price} / {item.product.unit}</Text>
                      </View>

                      {/* Quantity controls */}
                      <View style={styles.qtyBox}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.trashBtn}
                        onPress={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Delivery Address Input */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <MapPin size={18} color="#EA580C" />
                    <Text style={styles.sectionHeading}>Delivery Address</Text>
                  </View>

                  <TextInput
                    style={styles.addressInput}
                    multiline
                    numberOfLines={3}
                    placeholder="Enter complete house no, street, landmark, city"
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                  />
                </View>
              </View>

              {/* Right Column: Payment & Bill Summary */}
              <View style={isDesktop ? styles.rightColDesktop : styles.colMobile}>
                {/* Payment Mode Selection */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading}>Payment Mode</Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.paymentOption, paymentMode === 'upi' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMode('upi')}
                  >
                    <CreditCard size={18} color={paymentMode === 'upi' ? '#EA580C' : '#64748B'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentTitle}>Instant UPI (GPay / PhonePe / Paytm)</Text>
                      <Text style={styles.paymentSubtext}>Zero transaction fee</Text>
                    </View>
                    {paymentMode === 'upi' && <Check size={18} color="#EA580C" />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.paymentOption, paymentMode === 'cod' && styles.paymentOptionActive]}
                    onPress={() => setPaymentMode('cod')}
                  >
                    <Banknote size={18} color={paymentMode === 'cod' ? '#EA580C' : '#64748B'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentTitle}>Cash on Delivery (COD)</Text>
                      <Text style={styles.paymentSubtext}>Pay cash or UPI upon delivery</Text>
                    </View>
                    {paymentMode === 'cod' && <Check size={18} color="#EA580C" />}
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
                      {deliveryFee === 0 ? <Text style={{ color: '#16A34A' }}>FREE</Text> : `₹${deliveryFee}`}
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
    backgroundColor: '#EA580C',
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
    color: '#EA580C',
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
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
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
    color: '#EA580C',
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
    backgroundColor: '#EA580C',
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
