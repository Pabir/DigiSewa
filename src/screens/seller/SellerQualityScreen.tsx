import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, CircleCheck, AlertTriangle, Star, ShieldCheck, Sparkles } from 'lucide-react-native';

interface SellerQualityScreenProps {
  onBack: () => void;
}

export const SellerQualityScreen: React.FC<SellerQualityScreenProps> = ({ onBack }) => {
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Quality & Catalog Score Dashboard</Text>
            <Text style={styles.subtitle}>Monitor customer ratings, return rates, and high-res image compliance</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Star size={20} color="#EAB308" />
            <Text style={styles.metricLabel}>Store Quality Score</Text>
            <Text style={styles.metricValue}>4.8 / 5.0</Text>
          </View>
          <View style={styles.metricCard}>
            <CircleCheck size={20} color="#16A34A" />
            <Text style={styles.metricLabel}>QC Pass Rate</Text>
            <Text style={styles.metricValue}>98.2%</Text>
          </View>
          <View style={styles.metricCard}>
            <AlertTriangle size={20} color="#DC2626" />
            <Text style={styles.metricLabel}>Quality Return Rate</Text>
            <Text style={styles.metricValue}>1.4% (Low)</Text>
          </View>
        </View>

        {/* Quality Guidelines Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <ShieldCheck size={20} color="#16A34A" />
            <Text style={styles.cardTitle}>TafDeal Quality Verification Standard</Text>
          </View>
          <Text style={styles.bulletText}>✓ Clear front and back view images with clean backgrounds</Text>
          <Text style={styles.bulletText}>✓ Accurate measurement tables (Chest for Men's Upper, Breast for Women's Upper, Waist for Lower wear) provided for all apparel</Text>
          <Text style={styles.bulletText}>✓ Fabric details (100% pure cotton, rayon, denim) match physical stock</Text>
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
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  bulletText: { fontSize: 13, color: '#334155', fontWeight: '500' },
});
