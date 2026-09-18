import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Upload, FileText, CircleCheck, AlertTriangle } from 'lucide-react-native';

export const ReconciliationScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reconciliations</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Upload size={16} color="#4338CA" />
            <Text style={styles.secondaryBtnText}>Upload PG Settlement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Upload size={16} color="#4338CA" />
            <Text style={styles.secondaryBtnText}>Upload Courier Billing</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 20 }}>
        <View style={styles.tabsContainer}>
          <Text style={[styles.tab, styles.activeTab]}>PG Reconciliations</Text>
          <Text style={styles.tab}>Courier Reconciliations</Text>
        </View>

        <View style={styles.emptyState}>
          <FileText size={48} color="#CBD5E1" />
          <Text style={styles.emptyStateTitle}>Upload a CSV to start</Text>
          <Text style={styles.emptyStateText}>
            Upload your Payment Gateway or Courier settlement reports to automatically match against your orders.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0' 
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  actions: { flexDirection: 'row', gap: 12 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryBtnText: { color: '#4338CA', fontWeight: '600', fontSize: 13 },
  content: { flex: 1 },
  tabsContainer: { flexDirection: 'row', gap: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 20 },
  tab: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  activeTab: { color: '#4338CA', borderBottomWidth: 2, borderBottomColor: '#4338CA', paddingBottom: 10 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: '#475569', marginTop: 16 },
  emptyStateText: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center', maxWidth: 400 },
});
