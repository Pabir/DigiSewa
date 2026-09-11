import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Product } from '../../types';

interface DynamicProductAttributesProps {
  product: Product | any;
}

export const DynamicProductAttributes: React.FC<DynamicProductAttributesProps> = ({ product }) => {
  const attrValues: Record<string, any> = product.attributeValues || {};

  // Extract key-value pairs
  const specPairs: { label: string; value: string }[] = [];

  if (product.fabric || attrValues.fabric) specPairs.push({ label: 'Fabric / Material', value: product.fabric || attrValues.fabric });
  if (product.pattern || attrValues.pattern) specPairs.push({ label: 'Pattern', value: product.pattern || attrValues.pattern });
  if (product.fitType || attrValues.fit) specPairs.push({ label: 'Fit Type', value: product.fitType || attrValues.fit });

  Object.entries(attrValues).forEach(([key, val]) => {
    if (['fabric', 'pattern', 'fit'].includes(key)) return;
    if (val !== undefined && val !== null && val !== '') {
      const formattedLabel = key.replace(/_/g, ' ').toUpperCase();
      const formattedVal = Array.isArray(val) ? val.join(', ') : String(val);
      specPairs.push({ label: formattedLabel, value: formattedVal });
    }
  });

  if (specPairs.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Product Specifications & Details</Text>

      <View style={styles.specGrid}>
        {specPairs.map((item, idx) => (
          <View key={idx} style={styles.specRow}>
            <Text style={styles.specLabel}>{item.label}</Text>
            <Text style={styles.specValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  specGrid: {
    gap: 8,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
});
