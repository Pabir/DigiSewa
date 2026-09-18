import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { DollarSign, CircleCheck, Clock } from 'lucide-react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const SettlementBatchesScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<any[]>([]); // Stub for batches

  const handleGenerateBatch = async () => {
    setLoading(true);
    try {
      const functions = getFunctions();
      const generatePayoutBatch = httpsCallable(functions, 'generatePayoutBatch');
      const result = await generatePayoutBatch();
      const data = result.data as any;
      
      Alert.alert('Success', data.message);
      // Ideally fetch batches here
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to generate payout batch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Seller Settlements</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleGenerateBatch} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#FFF" /> : <DollarSign size={18} color="#FFF" />}
          <Text style={styles.primaryBtnText}>Generate Payout Batch</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 20 }}>
        {batches.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={48} color="#CBD5E1" />
            <Text style={styles.emptyStateTitle}>No Batches Generated</Text>
            <Text style={styles.emptyStateText}>Click the button above to generate a new settlement batch for eligible sellers.</Text>
          </View>
        ) : (
          <View>
             {/* List of batches would go here */}
          </View>
        )}
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
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4338CA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  content: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: '#475569', marginTop: 16 },
  emptyStateText: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center', maxWidth: 300 },
});
