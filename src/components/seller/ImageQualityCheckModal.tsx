import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { Plus, Sparkles } from 'lucide-react-native';

interface ImageQualityCheckModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedImages: string[]) => void;
  initialImages?: string[];
}

const PROHIBITED_IMAGE_TYPES = [
  {
    title: 'Watermark image',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'Fake branded/1st copy',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'Image with price',
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'Pixelated image',
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'Inverted image',
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'Blur/unclear image',
    image: 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'Incomplete image',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'Stretched/shrunk image',
    image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'Image with props',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=200&q=80',
  },
  {
    title: 'Image with text',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=200&q=80',
  },
];

const SAMPLE_CLOTHING_PHOTOS = [
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
];

export const ImageQualityCheckModal: React.FC<ImageQualityCheckModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialImages = [
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
  ],
}) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialImages);
  const [showPhotoPickerOption, setShowPhotoPickerOption] = useState<boolean>(false);

  const handleRemoveImage = (index: number) => {
    if (uploadedImages.length <= 1) {
      alert('Minimum 1 product image is required to create a catalog.');
      return;
    }
    const updated = [...uploadedImages];
    updated.splice(index, 1);
    setUploadedImages(updated);
  };

  const pickImageFromDevice = () => {
    if (typeof window !== 'undefined' && document) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.onchange = (e: any) => {
        const files: FileList = e.target.files;
        if (!files || files.length === 0) return;

        const newUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const url = URL.createObjectURL(file);
          newUrls.push(url);
        }

        setUploadedImages((prev) => {
          const combined = [...prev, ...newUrls];
          if (combined.length > 9) {
            alert('Maximum 9 products allowed per catalog. First 9 selected.');
            return combined.slice(0, 9);
          }
          return combined;
        });
        setShowPhotoPickerOption(false);
      };
      input.click();
    }
  };

  const handleAddSampleImage = (imgUrl: string) => {
    if (uploadedImages.length >= 9) {
      alert('Maximum 9 products allowed per catalog.');
      return;
    }
    setUploadedImages([...uploadedImages, imgUrl]);
    setShowPhotoPickerOption(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Products in a catalog</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Please add only front image of your product. If you want to add multiple images for particular product, you can add it in next step.
          </Text>

          {/* Main Grid: Left Uploads & Right Prohibited Rules */}
          <View style={styles.bodyGrid}>
            {/* Left Side: Uploaded Product Images & Add Slot */}
            <View style={styles.leftCol}>
              {/* Yellow Limit Alert Box */}
              <View style={styles.yellowInfoAlert}>
                <Sparkles size={16} color="#D97706" />
                <Text style={styles.yellowInfoText}>
                  You can add minimum 1 and maximum 9 products to create a catalog
                </Text>
              </View>

              {/* Thumbnails & Add Slot Grid */}
              <ScrollView style={styles.thumbnailsScroll} contentContainerStyle={styles.thumbnailsGrid}>
                {uploadedImages.map((img, idx) => (
                  <View key={idx} style={styles.thumbWrapper}>
                    <Image source={{ uri: img }} style={styles.thumbImage} />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveImage(idx)}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add Product Slot Button */}
                {uploadedImages.length < 9 && (
                  <TouchableOpacity
                    style={styles.addProductSlotBtn}
                    onPress={() => pickImageFromDevice()}
                  >
                    <View style={styles.plusCircleIcon}>
                      <Plus size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.addProductSlotText}>Add Product</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              {/* Direct Device Upload & Sample Selection Button Bar */}
              <View style={styles.samplePickerBox}>
                <TouchableOpacity
                  style={styles.deviceUploadBtn}
                  onPress={pickImageFromDevice}
                >
                  <Text style={styles.deviceUploadBtnText}>📁 Upload Image from Device (PC / Phone)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.toggleSampleBtn}
                  onPress={() => setShowPhotoPickerOption(!showPhotoPickerOption)}
                >
                  <Text style={styles.toggleSampleBtnText}>
                    {showPhotoPickerOption ? '▲ Hide Sample Photos' : '⚡ Select Sample Photo'}
                  </Text>
                </TouchableOpacity>

                {showPhotoPickerOption && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {SAMPLE_CLOTHING_PHOTOS.map((src, i) => (
                      <TouchableOpacity key={i} onPress={() => handleAddSampleImage(src)}>
                        <Image source={{ uri: src }} style={styles.sampleChoiceImg} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* Right Side: Prohibited Image Types Panel */}
            <View style={styles.rightCol}>
              <View style={styles.prohibitedHeader}>
                <Text style={styles.prohibitedNotAllowedSymbol}>🚫</Text>
                <Text style={styles.prohibitedTitle}>Image types which are not allowed</Text>
              </View>

              <ScrollView style={styles.prohibitedScroll} showsVerticalScrollIndicator={true}>
                <View style={styles.prohibitedGrid}>
                  {PROHIBITED_IMAGE_TYPES.map((rule, idx) => (
                    <View key={idx} style={styles.prohibitedItemCard}>
                      <Image source={{ uri: rule.image }} style={styles.prohibitedThumb} />
                      <View style={styles.prohibitedMetaCol}>
                        <Text style={styles.prohibitedRuleTitle}>{rule.title}</Text>
                        <View style={styles.notAllowedTag}>
                          <Text style={styles.notAllowedTagText}>🚫 NOT ALLOWED</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Footer Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => {
                if (uploadedImages.length === 0) {
                  alert('Please add at least 1 product front image.');
                  return;
                }
                onConfirm(uploadedImages);
              }}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 880,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64748B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  bodyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    maxHeight: 520,
  },
  leftCol: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yellowInfoAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  yellowInfoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
    lineHeight: 15,
  },
  thumbnailsScroll: {
    flex: 1,
  },
  thumbnailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  thumbWrapper: {
    width: 90,
    height: 115,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  addProductSlotBtn: {
    width: 90,
    height: 115,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#818CF8',
    borderStyle: 'dashed',
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  plusCircleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addProductSlotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  samplePickerBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 6,
  },
  deviceUploadBtn: {
    backgroundColor: '#4338CA',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  deviceUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  toggleSampleBtn: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  toggleSampleBtnText: {
    fontSize: 11,
    color: '#6366F1',
    fontWeight: '700',
  },
  sampleChoiceImg: {
    width: 44,
    height: 54,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6366F1',
    marginRight: 6,
  },
  rightCol: {
    flex: 1.5,
    minWidth: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prohibitedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  prohibitedNotAllowedSymbol: {
    fontSize: 14,
  },
  prohibitedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  prohibitedScroll: {
    flex: 1,
  },
  prohibitedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  prohibitedItemCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  prohibitedThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  prohibitedMetaCol: {
    flex: 1,
  },
  prohibitedRuleTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  notAllowedTag: {
    marginTop: 2,
  },
  notAllowedTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  continueBtn: {
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 6,
    backgroundColor: '#4338CA',
  },
  continueBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
