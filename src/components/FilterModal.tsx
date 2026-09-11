import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { X, Star } from 'lucide-react-native';

export type SortOption = 'price_asc' | 'price_desc' | 'newest' | 'rating_desc' | 'default';

export interface FilterState {
  minPrice: string;
  maxPrice: string;
  minRating: number;
  sortBy: SortOption;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
}

const SORT_OPTIONS = [
  { id: 'default', label: 'Relevance (Default)' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'newest', label: 'Newest Arrivals' },
  { id: 'rating_desc', label: 'Highest Rated' },
] as const;

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, currentFilters, onApplyFilters }) => {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  // Sync state when modal opens
  React.useEffect(() => {
    if (visible) {
      setFilters(currentFilters);
    }
  }, [visible, currentFilters]);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      minPrice: '',
      maxPrice: '',
      minRating: 0,
      sortBy: 'default'
    };
    setFilters(defaultFilters);
    onApplyFilters(defaultFilters);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters & Sort</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Sort Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.radioOption}
                  onPress={() => setFilters({ ...filters, sortBy: option.id as SortOption })}
                >
                  <View style={[styles.radioCircle, filters.sortBy === option.id && styles.radioCircleActive]}>
                    {filters.sortBy === option.id && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.radioText, filters.sortBy === option.id && styles.radioTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Range (₹)</Text>
              <View style={styles.priceInputsRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  keyboardType="numeric"
                  value={filters.minPrice}
                  onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
                />
                <Text style={styles.priceDash}>-</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  keyboardType="numeric"
                  value={filters.maxPrice}
                  onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
                />
              </View>
            </View>

            {/* Rating Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minimum Rating</Text>
              <View style={styles.ratingRow}>
                {[4, 3, 2, 1].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[styles.ratingChip, filters.minRating === rating && styles.ratingChipActive]}
                    onPress={() => setFilters({ ...filters, minRating: filters.minRating === rating ? 0 : rating })}
                  >
                    <Star size={16} color={filters.minRating === rating ? '#FFFFFF' : '#EAB308'} fill={filters.minRating === rating ? '#FFFFFF' : 'transparent'} />
                    <Text style={[styles.ratingText, filters.minRating === rating && styles.ratingTextActive]}>
                      {rating}+ Stars
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleActive: {
    borderColor: '#4F46E5',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
  },
  radioText: {
    fontSize: 15,
    color: '#475569',
  },
  radioTextActive: {
    color: '#0F172A',
    fontWeight: '600',
  },
  priceInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  priceDash: {
    color: '#64748B',
    fontSize: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  ratingChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  ratingTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 32, // for safe area
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  applyBtn: {
    flex: 2,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#4F46E5',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
