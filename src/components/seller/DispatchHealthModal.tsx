import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Activity, CircleCheck, AlertTriangle, TrendingUp } from 'lucide-react-native';

interface DispatchHealthModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DispatchHealthModal: React.FC<DispatchHealthModalProps> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Activity size={24} color="#4F46E5" />
              <Text style={styles.title}>Dispatch Health</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.overallSection}>
              <Text style={styles.overallLabel}>Overall Health Score</Text>
              <Text style={styles.overallScore}>Excellent</Text>
              <Text style={styles.overallDesc}>Keep up the good work! Your dispatch performance is top-tier.</Text>
            </View>

            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <CircleCheck size={20} color="#10B981" />
                  <Text style={styles.metricTitle}>On-Time Dispatch</Text>
                </View>
                <Text style={styles.metricValue}>98.5%</Text>
                <Text style={styles.metricTarget}>Target: {">"} 95%</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <AlertTriangle size={20} color="#F59E0B" />
                  <Text style={styles.metricTitle}>Cancellation Rate</Text>
                </View>
                <Text style={styles.metricValue}>1.2%</Text>
                <Text style={styles.metricTarget}>Target: {"<"} 2%</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <TrendingUp size={20} color="#3B82F6" />
                  <Text style={styles.metricTitle}>SLA Breach</Text>
                </View>
                <Text style={styles.metricValue}>0.5%</Text>
                <Text style={styles.metricTarget}>Target: {"<"} 1%</Text>
              </View>
            </View>
            
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>Tips for improvement</Text>
              <Text style={styles.tipItem}>• Always keep your inventory updated to avoid cancellations.</Text>
              <Text style={styles.tipItem}>• Process orders as soon as they drop into the 'Pending' tab.</Text>
              <Text style={styles.tipItem}>• Hand over packages to the courier partner on time.</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  overallSection: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  overallLabel: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  overallScore: {
    fontSize: 28,
    fontWeight: '800',
    color: '#047857',
    marginBottom: 8,
  },
  overallDesc: {
    fontSize: 13,
    color: '#065F46',
    textAlign: 'center',
  },
  metricGrid: {
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  metricTarget: {
    fontSize: 12,
    color: '#64748B',
  },
  tipsSection: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4338CA',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 13,
    color: '#3730A3',
    lineHeight: 20,
    marginBottom: 8,
  }
});
