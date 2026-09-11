import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Plus, Sparkles } from 'lucide-react-native';

const PROHIBITED_GUIDELINE_IMAGE = require('../../assets/prohibited_image_types_guideline.png');

interface ImageQualityCheckModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedImages: string[]) => void;
  initialImages?: string[];
}

const SAMPLE_CLOTHING_PHOTOS = [
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
];

export const ImageQualityCheckModal: React.FC<ImageQualityCheckModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialImages = [],
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

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
      input.onchange = async (e: any) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const base64Promises = Array.from(files).map((file: any) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
              const img = new window.Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  // Compress to JPEG with 0.6 quality to drastically reduce size
                  resolve(canvas.toDataURL('image/jpeg', 0.6));
                } else {
                  resolve(event.target?.result as string); // Fallback
                }
              };
              img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
          });
        });

        try {
          const newUrls = await Promise.all(base64Promises);
          
          setUploadedImages((prev) => {
            const combined = [...prev, ...newUrls];
            if (combined.length > 9) {
              alert('Maximum 9 products allowed per catalog. First 9 selected.');
              return combined.slice(0, 9);
            }
            return combined;
          });
        } catch (err) {
          console.error("Error reading files", err);
          alert("Failed to read image files.");
        }
        
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
      <View style={[styles.modalOverlay, isMobile && styles.modalOverlayMobile]}>
        <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, isMobile && styles.titleMobile]}>Products in a catalog</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, isMobile && styles.subtitleMobile]}>
            Please add only front image of your product. If you want to add multiple images for particular product, you can add it in next step.
          </Text>

          {/* Scrollable Main Content Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollBodyContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <View style={[styles.bodyGrid, isMobile && styles.bodyGridMobile]}>
              {/* Left Side: Uploaded Product Images & Add Slot */}
              <View style={[styles.leftCol, isMobile && styles.leftColMobile]}>
                {/* Yellow Limit Alert Box */}
                <View style={styles.yellowInfoAlert}>
                  <Sparkles size={16} color="#D97706" />
                  <Text style={styles.yellowInfoText}>
                    You can add minimum 1 and maximum 9 products to create a catalog
                  </Text>
                </View>

                {/* Thumbnails & Add Slot Grid */}
                <View style={styles.thumbnailsGrid}>
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
                </View>

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
              <View style={[styles.rightCol, isMobile && styles.rightColMobile]}>
                <View style={styles.prohibitedHeader}>
                  <Text style={styles.prohibitedNotAllowedSymbol}>🚫</Text>
                  <Text style={styles.prohibitedTitle}>Image types which are not allowed</Text>
                </View>

                <View style={styles.infographicCard}>
                  <Image
                    source={PROHIBITED_GUIDELINE_IMAGE}
                    style={[styles.prohibitedInfographicBanner, isMobile && styles.prohibitedInfographicBannerMobile]}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={[styles.footerRow, isMobile && styles.footerRowMobile]}>
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
  modalOverlayMobile: {
    padding: 10,
  },
  modalCard: {
    width: '100%',
    maxWidth: 880,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  modalCardMobile: {
    padding: 14,
    maxHeight: '94%',
    borderRadius: 10,
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
  titleMobile: {
    fontSize: 16,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64748B',
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  subtitleMobile: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  scrollBody: {
    flex: 1,
    flexShrink: 1,
  },
  scrollBodyContent: {
    paddingBottom: 8,
  },
  bodyGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  bodyGridMobile: {
    flexDirection: 'column',
    gap: 12,
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
  leftColMobile: {
    minWidth: 0,
    width: '100%',
    padding: 10,
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
  thumbnailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  thumbWrapper: {
    width: 85,
    height: 110,
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  addProductSlotBtn: {
    width: 85,
    height: 110,
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
    flex: 1.2,
    minWidth: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rightColMobile: {
    minWidth: 0,
    width: '100%',
    padding: 10,
  },
  prohibitedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  prohibitedNotAllowedSymbol: {
    fontSize: 14,
  },
  prohibitedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  infographicCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prohibitedInfographicBanner: {
    width: '100%',
    height: 380,
    borderRadius: 6,
  },
  prohibitedInfographicBannerMobile: {
    height: 240,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  footerRowMobile: {
    marginTop: 8,
    paddingTop: 10,
    gap: 8,
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

