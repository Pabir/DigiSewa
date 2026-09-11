import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ArrowLeft, Sparkles, TrendingUp, IndianRupee, CheckCircle2 } from 'lucide-react-native';

interface SellerPricingScreenProps {
  onBack: () => void;
}

export const SellerPricingScreen: React.FC<SellerPricingScreenProps> = ({ onBack }) => {
  const [discountPercent, setDiscountPercent] = useState('10');

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Smart Pricing & Discount Manager</Text>
            <Text style={styles.subtitle}>Optimize product pricing, customer discounts & profit margins</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <TrendingUp size={20} color="#16A34A" />
            <Text style={styles.metricLabel}>Price Competitiveness</Text>
            <Text style={styles.metricValue}>High (Top 15%)</Text>
          </View>
          <View style={styles.metricCard}>
            <IndianRupee size={20} color="#4F46E5" />
            <Text style={styles.metricLabel}>Avg. Margin Rate</Text>
            <Text style={styles.metricValue}>24.5%</Text>
          </View>
          <View style={styles.metricCard}>
            <Sparkles size={20} color="#6366F1" />
            <Text style={styles.metricLabel}>Active Smart Deals</Text>
            <Text style={styles.metricValue}>4 Products</Text>
          </View>
        </View>

        {/* Pricing Recommendation Banner */}
        <View style={styles.bannerBox}>
          <Sparkles size={20} color="#6366F1" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>AI Smart Price Recommendation</Text>
            <Text style={styles.bannerText}>
              Offering a 5% extra discount on Men Cotton T-Shirts can increase your weekly orders by up to 35%.
            </Text>
          </View>
        </View>

        {/* Price Adjustment Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Global Bulk Discount Setting</Text>
          <Text style={styles.cardSub}>Apply automatic customer discount across all catalog sizes</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={discountPercent}
              onChangeText={setDiscountPercent}
              keyboardType="numeric"
            />
            <Text style={styles.percentText}>% OFF</Text>
            <TouchableOpacity style={styles.applyBtn}>
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>Apply Pricing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  scrollBody: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  metricsRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metricCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: { fontSize: 11, color: '#64748B', marginTop: 6 },
  metricValue: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  bannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  bannerTitle: { fontSize: 14, fontWeight: '800', color: '#3730A3' },
  bannerText: { fontSize: 12, color: '#4338CA', marginTop: 2 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#64748B' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 70,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  percentText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  applyBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  applyBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
});
