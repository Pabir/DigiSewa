import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Download, FileText, Calendar } from 'lucide-react-native';

export const TaxReportsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tax Reports & Exports</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 20 }}>
        <View style={styles.grid}>
          
          {/* GSTR-1 Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <FileText size={20} color="#0F172A" />
                <Text style={styles.cardTitle}>GSTR-1</Text>
              </View>
              <Text style={styles.badge}>Monthly</Text>
            </View>
            <Text style={styles.cardText}>B2B, B2CL, B2CS, and HSN summary for outward supplies.</Text>
            <TouchableOpacity style={styles.downloadBtn}>
              <Download size={16} color="#FFF" />
              <Text style={styles.downloadBtnText}>Export CSV</Text>
            </TouchableOpacity>
          </View>

          {/* GSTR-8 (TCS) Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <FileText size={20} color="#0F172A" />
                <Text style={styles.cardTitle}>GSTR-8 (TCS)</Text>
              </View>
              <Text style={styles.badge}>Monthly</Text>
            </View>
            <Text style={styles.cardText}>Statement for tax collection at source by e-commerce operators.</Text>
            <TouchableOpacity style={styles.downloadBtn}>
              <Download size={16} color="#FFF" />
              <Text style={styles.downloadBtnText}>Export CSV</Text>
            </TouchableOpacity>
          </View>

          {/* TDS 194-O Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <FileText size={20} color="#0F172A" />
                <Text style={styles.cardTitle}>TDS Form 26Q</Text>
              </View>
              <Text style={styles.badge}>Quarterly</Text>
            </View>
            <Text style={styles.cardText}>Quarterly statement of TDS deduction under Section 194-O.</Text>
            <TouchableOpacity style={styles.downloadBtn}>
              <Download size={16} color="#FFF" />
              <Text style={styles.downloadBtnText}>Export CSV</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  content: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    minWidth: 300,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  badge: { backgroundColor: '#EEF2FF', color: '#4338CA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 11, fontWeight: '700' },
  cardText: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 8,
  },
  downloadBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
});
