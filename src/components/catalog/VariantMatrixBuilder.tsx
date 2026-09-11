import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { ProductVariant, AttributeDefinition } from '../../types/dynamicCatalog';
import { generateVariantMatrix } from '../../services/dynamicCatalogService';
import { Sparkles, Trash2, Plus, CheckCircle2, ShoppingBag, Image as ImageIcon } from 'lucide-react-native';
import { ImageQualityCheckModal } from '../seller/ImageQualityCheckModal';

interface VariantMatrixBuilderProps {
  variantAttributes: AttributeDefinition[];
  attributeValues: Record<string, any>;
  variants: ProductVariant[];
  basePrice: number;
  baseMrp: number;
  onUpdateVariants: (variants: ProductVariant[]) => void;
}

export const VariantMatrixBuilder: React.FC<VariantMatrixBuilderProps> = ({
  variantAttributes,
  attributeValues,
  variants,
  basePrice,
  baseMrp,
  onUpdateVariants,
}) => {
  const [selectedAttributeCodes, setSelectedAttributeCodes] = useState<string[]>(
    variantAttributes.map((a) => a.code)
  );

  const [bulkPrice, setBulkPrice] = useState<string>(String(basePrice || ''));
  const [bulkMrp, setBulkMrp] = useState<string>(String(baseMrp || ''));
  const [bulkStock, setBulkStock] = useState<string>('20');
  const [bulkSku, setBulkSku] = useState<string>('SKU');
  
  const [activeImageGroupValue, setActiveImageGroupValue] = useState<string | null>(null);

  const imageGroupAttr = variantAttributes.find(a => a.type === 'color' || a.code === 'color') 
    || variantAttributes.find(a => a.code === selectedAttributeCodes[0]);
  const imageGroupAttributeCode = imageGroupAttr?.code;
  const imageGroupAttributeLabel = imageGroupAttr?.label || 'Variant';

  const imageGroups = imageGroupAttributeCode 
    ? Array.from(new Set(variants.map(v => v.attributeValues[imageGroupAttributeCode]).filter(Boolean))) 
    : [];

  // Auto generate combinations on initial load if variants list is empty
  useEffect(() => {
    if (variants.length === 0 && variantAttributes.length > 0) {
      handleAutoGenerate();
    }
  }, [variantAttributes]);

  const handleAutoGenerate = () => {
    const generated = generateVariantMatrix(
      selectedAttributeCodes,
      attributeValues,
      basePrice || 499,
      baseMrp || 999,
      bulkSku || 'SKU'
    );
    onUpdateVariants(generated);
  };

  const handleApplyBulkUpdate = () => {
    const priceNum = Number(bulkPrice) || basePrice;
    const mrpNum = Number(bulkMrp) || baseMrp;
    const stockNum = Number(bulkStock) || 20;
    const baseSkuStr = bulkSku.trim();

    const updated = variants.map((v) => {
      const titleParts = v.title.split(' / ').map(t => String(t).toUpperCase().replace(/\s+/g, ''));
      const skuSuffix = titleParts.join('-');
      const newSku = baseSkuStr ? `${baseSkuStr}-${skuSuffix}` : v.sku;

      return {
        ...v,
        price: priceNum,
        mrp: mrpNum,
        stock: stockNum,
        ...(baseSkuStr ? { sku: newSku } : {}),
        discountPercentage: mrpNum > 0 ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0,
      };
    });
    onUpdateVariants(updated);
  };

  const handleUpdateSingleVariant = (id: string, field: keyof ProductVariant, value: any) => {
    const updated = variants.map((v) => {
      if (v.id === id) {
        const next = { ...v, [field]: value };
        if (field === 'price' || field === 'mrp') {
          const mrp = field === 'mrp' ? Number(value) : v.mrp;
          const price = field === 'price' ? Number(value) : v.price;
          next.discountPercentage = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
        }
        return next;
      }
      return v;
    });
    onUpdateVariants(updated);
  };

  const handleDeleteVariant = (id: string) => {
    const updated = variants.filter((v) => v.id !== id);
    onUpdateVariants(updated);
  };

  const handleAddCustomVariant = () => {
    const newVar: ProductVariant = {
      id: `var-${Date.now()}`,
      sku: `SKU-CUSTOM-${variants.length + 1}`,
      title: `Custom Variant ${variants.length + 1}`,
      price: basePrice || 499,
      mrp: baseMrp || 999,
      stock: 10,
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      attributeValues: {},
      enabled: true,
    };
    onUpdateVariants([...variants, newVar]);
  };

  return (
    <View style={styles.container}>
      {/* Header & Attribute Selection */}
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <ShoppingBag size={18} color="#4338CA" />
          <Text style={styles.cardTitle}>Product Variant Matrix Generator</Text>
        </View>

        <TouchableOpacity
          style={styles.generateBtn}
          onPress={handleAutoGenerate}
          activeOpacity={0.8}
        >
          <Sparkles size={14} color="#FFFFFF" />
          <Text style={styles.generateBtnText}>Generate Combinations</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subText}>
        Select attributes to form product variant matrix (e.g., Color × Size combinations).
      </Text>

      {/* Attributes Selector Chips */}
      <View style={styles.attrChipRow}>
        {variantAttributes.map((attr) => {
          const isSelected = selectedAttributeCodes.includes(attr.code);
          return (
            <TouchableOpacity
              key={attr.code}
              style={[styles.attrChip, isSelected && styles.attrChipActive]}
              onPress={() => {
                const next = isSelected
                  ? selectedAttributeCodes.filter((c) => c !== attr.code)
                  : [...selectedAttributeCodes, attr.code];
                setSelectedAttributeCodes(next);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.attrChipText, isSelected && styles.attrChipTextActive]}>
                {attr.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Image Groups Upload */}
      {imageGroups.length > 0 && variants.length > 0 && (
        <View style={styles.imageGroupsContainer}>
          <Text style={styles.bulkTitle}>Upload Photos by {imageGroupAttributeLabel}:</Text>
          <View style={styles.imageGroupsGrid}>
            {imageGroups.map(group => {
              const sampleVariant = variants.find(v => v.attributeValues[imageGroupAttributeCode!] === group);
              const currentImages = sampleVariant?.images || [];
              return (
                <View key={String(group)} style={styles.imageGroupCard}>
                  <Text style={styles.imageGroupLabel}>{String(group)}</Text>
                  <TouchableOpacity
                    style={styles.imageIconBtn}
                    onPress={() => setActiveImageGroupValue(String(group))}
                  >
                    <ImageIcon size={16} color={currentImages.length > 0 ? "#10B981" : "#64748B"} />
                    {currentImages.length > 0 && (
                      <View style={styles.imageCountBadge}>
                        <Text style={styles.imageCountText}>{currentImages.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Bulk Apply Bar */}
      {variants.length > 0 && (
        <View style={styles.bulkBox}>
          <Text style={styles.bulkTitle}>Bulk Price & Inventory Apply:</Text>
          <View style={styles.bulkInputsRow}>
            <View style={styles.bulkField}>
              <Text style={styles.bulkLabel}>Selling Price (₹)</Text>
              <TextInput
                style={styles.bulkInput}
                value={bulkPrice}
                onChangeText={setBulkPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.bulkField}>
              <Text style={styles.bulkLabel}>MRP (₹)</Text>
              <TextInput
                style={styles.bulkInput}
                value={bulkMrp}
                onChangeText={setBulkMrp}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.bulkField}>
              <Text style={styles.bulkLabel}>Stock Qty</Text>
              <TextInput
                style={styles.bulkInput}
                value={bulkStock}
                onChangeText={setBulkStock}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.bulkField}>
              <Text style={styles.bulkLabel}>Base SKU/ Design Code</Text>
              <TextInput
                style={styles.bulkInput}
                value={bulkSku}
                onChangeText={setBulkSku}
                placeholder="e.g. MYPROD"
              />
            </View>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApplyBulkUpdate}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Apply All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Variant Combination Table */}
      {variants.length > 0 ? (
        <ScrollView horizontal style={styles.tableScroll}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { width: 140 }]}>SKU Code</Text>
              <Text style={[styles.th, { width: 150 }]}>Variant Title</Text>
              <Text style={[styles.th, { width: 100 }]}>Price (₹)</Text>
              <Text style={[styles.th, { width: 100 }]}>MRP (₹)</Text>
              <Text style={[styles.th, { width: 80 }]}>Stock</Text>
              <Text style={[styles.th, { width: 130 }]}>Barcode</Text>
              <Text style={[styles.th, { width: 70 }]}>Action</Text>
            </View>

            {variants.map((v) => (
              <View key={v.id} style={styles.tableRow}>
                <View style={{ width: 140 }}>
                  <TextInput
                    style={styles.tableInput}
                    value={v.sku}
                    onChangeText={(val) => handleUpdateSingleVariant(v.id, 'sku', val)}
                  />
                </View>

                <View style={{ width: 150 }}>
                  <Text style={styles.variantTitleText} numberOfLines={1}>
                    {v.title}
                  </Text>
                </View>

                <View style={{ width: 100 }}>
                  <TextInput
                    style={styles.tableInput}
                    value={String(v.price)}
                    onChangeText={(val) => handleUpdateSingleVariant(v.id, 'price', Number(val) || 0)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ width: 100 }}>
                  <TextInput
                    style={styles.tableInput}
                    value={String(v.mrp)}
                    onChangeText={(val) => handleUpdateSingleVariant(v.id, 'mrp', Number(val) || 0)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ width: 80 }}>
                  <TextInput
                    style={styles.tableInput}
                    value={String(v.stock)}
                    onChangeText={(val) => handleUpdateSingleVariant(v.id, 'stock', Number(val) || 0)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ width: 130 }}>
                  <TextInput
                    style={styles.tableInput}
                    value={v.barcode || ''}
                    onChangeText={(val) => handleUpdateSingleVariant(v.id, 'barcode', val)}
                  />
                </View>

                <View style={{ width: 70, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => handleDeleteVariant(v.id)}
                    style={styles.deleteIconBtn}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No variants generated yet.</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddCustomVariant}>
            <Plus size={14} color="#4338CA" />
            <Text style={styles.addBtnText}>Add Custom Variant</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {activeImageGroupValue && imageGroupAttributeCode && (
        <ImageQualityCheckModal
          visible={!!activeImageGroupValue}
          onClose={() => setActiveImageGroupValue(null)}
          initialImages={variants.find(v => String(v.attributeValues[imageGroupAttributeCode]) === activeImageGroupValue)?.images || []}
          onConfirm={(selectedImages) => {
            const updated = variants.map(v => {
              if (String(v.attributeValues[imageGroupAttributeCode]) === activeImageGroupValue) {
                return { ...v, images: selectedImages };
              }
              return v;
            });
            onUpdateVariants(updated);
            setActiveImageGroupValue(null);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  subText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4338CA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  attrChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  attrChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  attrChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4338CA',
  },
  attrChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  attrChipTextActive: {
    color: '#4338CA',
    fontWeight: '800',
  },
  bulkBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  bulkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  bulkInputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
  },
  bulkField: {
    flex: 1,
    minWidth: 80,
  },
  bulkLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  bulkInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
  },
  applyBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tableScroll: {
    marginVertical: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  tableInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 12,
    color: '#0F172A',
    marginRight: 8,
  },
  variantTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  deleteIconBtn: {
    padding: 6,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    gap: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  addBtnText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '700',
  },
  imageIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  imageCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10B981',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  imageGroupsContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  imageGroupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageGroupCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  }
});
