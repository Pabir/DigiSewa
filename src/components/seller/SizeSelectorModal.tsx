import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

interface SizeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (selectedSizes: string[]) => void;
  initialSelectedSizes?: string[];
}

const ALL_SIZE_OPTIONS = [
  'IND-2',
  'IND-3',
  'IND-4',
  'IND-5',
  'IND-6',
  'IND-7',
  'IND-8',
  'IND-9',
  'IND-10',
  'IND-11',
  'IND-12',
  'IND-13',
  '24',
  '26',
  '28',
  '30',
  '32',
  '34',
  '36',
  '38',
  '40',
  '42',
  '44',
  '46',
  '48',
  '50',
  '52',
  'Free Size',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXS',
  'XXXL',
  'XXXXL',
];

export const SizeSelectorModal: React.FC<SizeSelectorModalProps> = ({
  visible,
  onClose,
  onApply,
  initialSelectedSizes = ['28', '30', '32', '34'],
}) => {
  const [tempSizes, setTempSizes] = useState<string[]>(initialSelectedSizes);

  useEffect(() => {
    if (visible) {
      setTempSizes([...initialSelectedSizes]);
    }
  }, [visible, initialSelectedSizes]);

  const toggleSize = (sz: string) => {
    if (tempSizes.includes(sz)) {
      setTempSizes(tempSizes.filter((s) => s !== sz));
    } else {
      setTempSizes([...tempSizes, sz]);
    }
  };

  const handleApply = () => {
    onApply(tempSizes);
    onClose();
  };

  const handleClear = () => {
    setTempSizes([]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.popoverCard}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation?.()}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Select Sizes</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sizes Grid */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={true}>
            <View style={styles.gridContainer}>
              {ALL_SIZE_OPTIONS.map((sz) => {
                const isChecked = tempSizes.includes(sz);
                return (
                  <TouchableOpacity
                    key={sz}
                    activeOpacity={0.7}
                    style={styles.sizeItemRow}
                    onPress={() => toggleSize(sz)}
                  >
                    <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareChecked]}>
                      {isChecked && <Text style={styles.checkIcon}>✓</Text>}
                    </View>
                    <View style={[styles.blueBadge, isChecked && styles.blueBadgeActive]}>
                      <Text style={styles.badgeText}>{sz}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Clear Filter</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popoverCard: {
    width: 340,
    maxHeight: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
  },
  scrollArea: {
    maxHeight: 230,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
    columnGap: 10,
    paddingRight: 4,
  },
  sizeItemRow: {
    flex: 1,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquareChecked: {
    borderColor: '#4338CA',
    backgroundColor: '#4338CA',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  blueBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  blueBadgeActive: {
    backgroundColor: '#1D4ED8',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '800',
  },
  applyBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 6,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
