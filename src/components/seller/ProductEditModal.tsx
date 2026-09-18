import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { X, CircleCheck } from 'lucide-react-native';
import { Product } from '../../types';
import { updateProduct } from '../../services/firebaseService';

interface ProductEditModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  visible,
  product,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(product?.title || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice?.toString() || '');
  const [stock, setStock] = useState(product?.stock?.toString() || '');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || '');
  const [tagsList, setTagsList] = useState<string[]>(product?.tags || []);
  const [tagInput, setTagInput] = useState<string>('');

  const addTag = () => {
    if (tagInput.trim().length > 0) {
      const newTag = tagInput.trim();
      if (!tagsList.includes(newTag)) {
        setTagsList(prev => [...prev, newTag].slice(0, 15));
      }
      setTagInput('');
    }
  };

  const handleTagInputChange = (text: string) => {
    if (text.includes(',')) {
      const newTags = text.split(',')
                          .map(t => t.trim())
                          .filter(t => t.length > 0 && !tagsList.includes(t));
      if (newTags.length > 0) {
        setTagsList(prev => [...prev, ...newTags].slice(0, 15));
      }
      setTagInput('');
    } else {
      setTagInput(text);
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTagsList(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const editTag = (indexToEdit: number) => {
    const tagToEdit = tagsList[indexToEdit];
    setTagInput(tagToEdit);
    removeTag(indexToEdit);
  };
  
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when product changes
  React.useEffect(() => {
    if (product) {
      setTitle(product.title || '');
      setPrice(product.price?.toString() || '');
      setOriginalPrice(product.originalPrice?.toString() || '');
      setStock(product.stock?.toString() || '');
      setImageUrl(product.imageUrl || '');
      setTagsList(product.tags || []);
      setTagInput('');
    }
  }, [product]);

  const handleSave = async () => {
    if (!product) return;
    setIsSaving(true);
    
    const updatedData: Partial<Product> = {
      title,
      price: parseFloat(price) || 0,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      stock: parseInt(stock, 10) || 0,
      imageUrl: imageUrl,
      tags: tagsList,
    };
    
    await updateProduct(product.id, updatedData);
    
    setIsSaving(false);
    onSuccess({ ...product, ...updatedData });
  };

  if (!product) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Product</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Image Section */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Product Image URL</Text>
              <TextInput
                style={styles.input}
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="Enter image URL"
              />
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.previewImage} />
              ) : null}
            </View>

            {/* Title Section */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Product Title</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter product title"
                multiline
              />
            </View>

            {/* Tags Section */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Search Tags (Type comma or click Add to add, click tag to edit, max 15)</Text>
              
              <View style={[styles.tagsContainer, tagsList.length > 0 && { marginBottom: 12 }]}>
                {tagsList.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <TouchableOpacity onPress={() => editTag(index)}>
                      <Text style={styles.tagChipText}>{tag}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeTag(index)} style={styles.tagChipRemove}>
                      <X size={12} color="#4F46E5" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {tagsList.length < 15 && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={tagInput}
                    onChangeText={handleTagInputChange}
                    onSubmitEditing={addTag}
                    placeholder="e.g. red, cotton, summer"
                  />
                  <TouchableOpacity onPress={addTag} style={styles.addTagBtn}>
                    <Text style={styles.addTagBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.rowGroup}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Selling Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="e.g. 499"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Original MRP (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                  keyboardType="numeric"
                  placeholder="e.g. 999"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Standard Inventory (Stock)</Text>
              <TextInput
                style={styles.input}
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
                placeholder="Total available quantity"
              />
            </View>


          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSaving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <CircleCheck size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  scrollContent: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  rowGroup: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#9F2089',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tagChipText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    marginRight: 4,
  },
  tagChipRemove: {
    padding: 2,
  },
  addTagBtn: {
    marginLeft: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addTagBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

});
