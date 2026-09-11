import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { getCategoryFormSchema } from '../../services/dynamicCatalogService';
import { Search, Check } from 'lucide-react-native';

interface DynamicCategoryFiltersProps {
  categoryId?: string;
  onFilterChange: (activeFilters: Record<string, string[]>) => void;
}

export const DynamicCategoryFilters: React.FC<DynamicCategoryFiltersProps> = ({
  categoryId = 'cat-men-tshirts',
  onFilterChange,
}) => {
  const schema = getCategoryFormSchema(categoryId);
  const filterableFields = schema.fields.filter((f) => f.attribute.isFilterable && f.attribute.options);

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const handleToggleOption = (code: string, value: string) => {
    const current = selectedFilters[code] || [];
    const exists = current.includes(value);
    const next = exists ? current.filter((v) => v !== value) : [...current, value];

    const updated = { ...selectedFilters, [code]: next };
    if (next.length === 0) delete updated[code];

    setSelectedFilters(updated);
    onFilterChange(updated);
  };

  if (filterableFields.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Search size={16} color="#4338CA" />
        <Text style={styles.headerTitle}>Category Dynamic Filters</Text>
      </View>

      <ScrollView style={{ maxHeight: 300 }}>
        {filterableFields.map((field) => {
          const { attribute } = field;
          const activeValues = selectedFilters[attribute.code] || [];

          return (
            <View key={attribute.code} style={styles.filterGroup}>
              <Text style={styles.filterTitle}>{attribute.label}</Text>
              <View style={styles.optionsRow}>
                {attribute.options?.map((opt) => {
                  const isChecked = activeValues.includes(opt.value);
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.optChip, isChecked && styles.optChipActive]}
                      onPress={() => handleToggleOption(attribute.code, opt.value)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.optText, isChecked && styles.optTextActive]}>
                        {opt.label}
                      </Text>
                      {isChecked && <Check size={12} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  optChipActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  optText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  optTextActive: {
    color: '#FFFFFF',
  },
});
