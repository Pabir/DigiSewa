import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  ResolvedCategoryField,
  AttributeOption,
} from '../../types/dynamicCatalog';
import { evaluateConditions } from '../../services/dynamicCatalogService';
import { Check, AlertCircle } from 'lucide-react-native';

interface DynamicFormEngineProps {
  fields: ResolvedCategoryField[];
  formValues: Record<string, any>;
  errors?: Record<string, string>;
  onChangeField: (code: string, value: any) => void;
  sectionFilter?: 'common' | 'category_specific' | 'variant' | 'specifications' | 'all';
  renderCustomInsert?: (field: ResolvedCategoryField, index: number, visibleFields: ResolvedCategoryField[]) => React.ReactNode;
}

export const DynamicFormEngine: React.FC<DynamicFormEngineProps> = ({
  fields,
  formValues,
  errors = {},
  onChangeField,
  sectionFilter = 'all',
  renderCustomInsert,
}) => {
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  // Filter fields based on optional section and active status
  const visibleFields = fields.filter((f) => {
    if (!f.attribute.isActive) return false;
    if (sectionFilter !== 'all' && f.groupSection !== sectionFilter) return false;
    // Evaluate conditional rules against current formValues
    return evaluateConditions(f.attribute.conditions, formValues);
  });

  if (visibleFields.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <AlertCircle size={20} color="#64748B" />
        <Text style={styles.emptyText}>
          No additional dynamic attributes configured for this category selection.
        </Text>
      </View>
    );
  }

  const renderFieldInput = (field: ResolvedCategoryField) => {
    const { attribute, isRequired } = field;
    const value = formValues[attribute.code] ?? attribute.defaultValue ?? '';
    const fieldError = errors[attribute.code];
    
    const isColorAttribute = attribute.label.toLowerCase().includes('color');
    const getColorHex = (name: string): string | null => {
      const map: Record<string, string> = {
        'black': '#000000',
        'white': '#FFFFFF',
        'navy blue': '#000080',
        'blue': '#2563EB',
        'red': '#DC2626',
        'olive green': '#65a30d',
        'green': '#16A34A',
        'grey': '#64748B',
        'gray': '#64748B',
        'yellow': '#FACC15',
        'maroon': '#831843',
        'beige / cream': '#FEF3C7',
        'beige': '#FEF3C7',
        'cream': '#FFFBEB',
        'pink': '#F472B6',
        'purple': '#9333EA',
        'orange': '#4F46E5',
        'brown': '#78350F'
      };
      return map[name.toLowerCase()] || null;
    };

    switch (attribute.type) {
      case 'textarea':
        return (
          <TextInput
            style={[styles.input, styles.textarea, fieldError ? styles.inputError : null]}
            value={String(value)}
            onChangeText={(text) => onChangeField(attribute.code, text)}
            placeholder={attribute.placeholder || `Enter ${attribute.label}...`}
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
          />
        );

      case 'number':
      case 'integer':
      case 'decimal':
      case 'measurement':
        return (
          <View style={styles.numberRow}>
            <TextInput
              style={[styles.input, { flex: 1 }, fieldError ? styles.inputError : null]}
              value={value !== undefined && value !== null ? String(value) : ''}
              onChangeText={(text) => {
                const numeric = text.replace(/[^0-9.]/g, '');
                onChangeField(attribute.code, numeric);
              }}
              placeholder={attribute.placeholder || '0'}
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
            {attribute.unit && (
              <View style={styles.unitBadge}>
                <Text style={styles.unitBadgeText}>{attribute.unit}</Text>
              </View>
            )}
          </View>
        );

      case 'boolean':
        const isTrue = Boolean(value);
        return (
          <View style={styles.booleanRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, isTrue && styles.toggleBtnActive]}
              onPress={() => onChangeField(attribute.code, true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, isTrue && styles.toggleTextActive]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isTrue && styles.toggleBtnActive]}
              onPress={() => onChangeField(attribute.code, false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, !isTrue && styles.toggleTextActive]}>No</Text>
            </TouchableOpacity>
          </View>
        );

      case 'color':
        const options: AttributeOption[] = [...(attribute.options || [])].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.scrollContainer}>
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.colorChip,
                    isSelected && styles.colorChipSelected,
                  ]}
                  onPress={() => onChangeField(attribute.code, opt.value)}
                  activeOpacity={0.8}
                >
                  {opt.hexCode && opt.hexCode !== 'linear-gradient' && (
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: opt.hexCode },
                        opt.hexCode.toUpperCase() === '#FFFFFF' && { borderWidth: 1, borderColor: '#CBD5E1' },
                      ]}
                    />
                  )}
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={14} color="#4338CA" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        );

      case 'size_selector':
        const sizeOptions: AttributeOption[] = [...(attribute.options || [])].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
        const selectedSizes: string[] = Array.isArray(value) ? value : value ? [String(value)] : [];

        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.scrollContainer}>
            {sizeOptions.map((opt) => {
              const isSelected = selectedSizes.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.sizeBox, isSelected && styles.sizeBoxSelected]}
                  onPress={() => {
                    // Toggle in multiselect list
                    let next: string[];
                    if (isSelected) {
                      next = selectedSizes.filter((s) => s !== opt.value);
                    } else {
                      next = [...selectedSizes, opt.value];
                    }
                    onChangeField(attribute.code, next);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sizeText, isSelected && styles.sizeTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        );

      case 'select':
      case 'radio': {
        const selectOpts: AttributeOption[] = [...(attribute.options || [])].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
        const searchQuery = searchQueries[attribute.code] || '';
        const filteredOpts = attribute.isSearchable && searchQuery
          ? selectOpts.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
          : selectOpts;

        return (
          <View>
            {attribute.isSearchable && (
              <TextInput
                style={[styles.input, { marginBottom: 8, paddingVertical: 8 }]}
                placeholder={`Search ${attribute.label}...`}
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={(text) => setSearchQueries((prev) => ({ ...prev, [attribute.code]: text }))}
              />
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.scrollContainer}>
              {filteredOpts.map((opt) => {
              const isSelected = value === opt.value;
              const colorHex = isColorAttribute ? getColorHex(opt.label) : null;
              
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.selectChip, isSelected && styles.selectChipSelected, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                  onPress={() => onChangeField(attribute.code, opt.value)}
                  activeOpacity={0.8}
                >
                  {colorHex && (
                    <View style={{
                      width: 14, 
                      height: 14, 
                      borderRadius: 7, 
                      backgroundColor: colorHex,
                      borderWidth: 1,
                      borderColor: colorHex === '#FFFFFF' || colorHex === '#FEF3C7' || colorHex === '#FFFBEB' ? '#CBD5E1' : 'transparent'
                    }} />
                  )}
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={14} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
            </ScrollView>
          </View>
        );
      }

      case 'multiselect':
      case 'checkbox': {
        const multiOpts: AttributeOption[] = [...(attribute.options || [])].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
        const multiVals: string[] = Array.isArray(value) ? value : [];
        const searchQuery = searchQueries[attribute.code] || '';
        const filteredOpts = attribute.isSearchable && searchQuery
          ? multiOpts.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
          : multiOpts;

        return (
          <View>
            {attribute.isSearchable && (
              <TextInput
                style={[styles.input, { marginBottom: 8, paddingVertical: 8 }]}
                placeholder={`Search ${attribute.label}...`}
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={(text) => setSearchQueries((prev) => ({ ...prev, [attribute.code]: text }))}
              />
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={styles.scrollContainer}>
              {filteredOpts.map((opt) => {
              const isSelected = multiVals.includes(opt.value);
              const colorHex = isColorAttribute ? getColorHex(opt.label) : null;

              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.selectChip, isSelected && styles.selectChipSelected, colorHex ? { flexDirection: 'row', alignItems: 'center', gap: 6 } : null]}
                  onPress={() => {
                    const next = isSelected
                      ? multiVals.filter((v) => v !== opt.value)
                      : [...multiVals, opt.value];
                    onChangeField(attribute.code, next);
                  }}
                  activeOpacity={0.8}
                >
                  {colorHex && (
                    <View style={{
                      width: 14, 
                      height: 14, 
                      borderRadius: 7, 
                      backgroundColor: colorHex,
                      borderWidth: 1,
                      borderColor: colorHex === '#FFFFFF' || colorHex === '#FEF3C7' || colorHex === '#FFFBEB' ? '#CBD5E1' : 'transparent'
                    }} />
                  )}
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={14} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
            </ScrollView>
          </View>
        );
      }

      case 'text':
      case 'url':
      default:
        return (
          <TextInput
            style={[styles.input, fieldError ? styles.inputError : null]}
            value={String(value)}
            onChangeText={(text) => onChangeField(attribute.code, text)}
            placeholder={attribute.placeholder || `Enter ${attribute.label}`}
            placeholderTextColor="#94A3B8"
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {visibleFields.map((field, index) => {
        const { attribute, isRequired } = field;
        const fieldError = errors[attribute.code];

        return (
          <React.Fragment key={attribute.id || attribute.code}>
            {renderCustomInsert && renderCustomInsert(field, index, visibleFields)}
            <View style={styles.fieldCard}>
              <View style={styles.labelRow}>
              <Text style={styles.label}>
                {attribute.label}
                {isRequired && <Text style={styles.requiredStar}> *</Text>}
              </Text>

              {attribute.isVariantAttribute && (
                <View style={styles.variantTag}>
                  <Text style={styles.variantTagText}>Variant Attribute</Text>
                </View>
              )}
            </View>

            {attribute.helpText ? (
              <Text style={styles.helpText}>{attribute.helpText}</Text>
            ) : null}

            <View style={styles.inputContainer}>{renderFieldInput(field)}</View>

            {fieldError ? (
              <View style={styles.errorRow}>
                <AlertCircle size={12} color="#EF4444" />
                <Text style={styles.errorText}>{fieldError}</Text>
              </View>
            ) : null}
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  emptyBox: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    flex: 1,
  },
  fieldCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  requiredStar: {
    color: '#EF4444',
    fontWeight: '900',
  },
  variantTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  variantTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  helpText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  inputContainer: {
    marginTop: 4,
    width: '100%',
    overflow: 'hidden',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  unitBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  booleanRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  toggleBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  scrollContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  colorChipSelected: {
    borderColor: '#4338CA',
    backgroundColor: '#EEF2FF',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  selectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  selectChipSelected: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sizeBox: {
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBoxSelected: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  sizeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  sizeTextSelected: {
    color: '#FFFFFF',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
});
