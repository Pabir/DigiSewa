import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Sparkles, UploadCloud, CheckCircle2, ArrowLeft, Image as ImageIcon } from 'lucide-react-native';
import { generateProductDetailsFromImage } from '../../services/geminiAIService';
import { addProduct } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';

interface AddProductAIScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

const SAMPLE_DEMO_IMAGES = [
  {
    name: 'Ratnagiri Mangoes',
    url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Handloom Saree',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Kaju Katli Sweets',
    url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Desk Lamp',
    url: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=600&q=80',
  },
];

export const AddProductAIScreen: React.FC<AddProductAIScreenProps> = ({ onBack, onSuccess }) => {
  const { sellerProfile } = useAuth();

  const [selectedImageUrl, setSelectedImageUrl] = useState<string>(SAMPLE_DEMO_IMAGES[0].url);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Form Fields Auto-Populated by Gemini AI
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [unit, setUnit] = useState<string>('piece');
  const [stock, setStock] = useState<string>('20');
  const [tags, setTags] = useState<string[]>([]);
  const [aiGenerated, setAiGenerated] = useState<boolean>(false);

  const handleRunGeminiAI = async () => {
    setIsAnalyzing(true);
    // Call Gemini AI Vision helper
    const aiDetails = await generateProductDetailsFromImage(selectedImageUrl);

    setTitle(aiDetails.title);
    setDescription(aiDetails.description);
    setCategory(aiDetails.category);
    setPrice(aiDetails.suggestedPrice.toString());
    if (aiDetails.suggestedOriginalPrice) {
      setOriginalPrice(aiDetails.suggestedOriginalPrice.toString());
    }
    setTags(aiDetails.tags);
    setAiGenerated(true);
    setIsAnalyzing(false);
  };

  const handlePublishProduct = async () => {
    if (sellerProfile?.verificationStatus !== 'verified') {
      const status = sellerProfile?.verificationStatus || 'pending';
      const msg =
        status === 'rejected'
          ? '❌ Account Rejected: Your seller application was rejected by Admin. You cannot add products.'
          : status === 'suspended'
          ? '⚠️ Account Suspended: Your seller account has been suspended by Admin. You cannot add products.'
          : '⏳ Approval Pending: Your seller account is awaiting Admin approval. You cannot add or sell products until approved by Admin.';
      alert(msg);
      return;
    }

    if (!title.trim() || !price.trim()) {
      alert('Please fill product title and price.');
      return;
    }

    setIsPublishing(true);
    try {
      await addProduct(
        {
          sellerId: sellerProfile.id,
          sellerName: sellerProfile.storeName,
          title,
          description,
          category: category || 'General',
          price: Number(price) || 0,
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          stock: Number(stock) || 10,
          unit,
          imageUrl: selectedImageUrl,
          rating: 5.0,
          reviewCount: 1,
          tags,
          isHyperlocalAvailable: true,
        },
        sellerProfile?.verificationStatus
      );

      setIsPublishing(false);
      onSuccess();
    } catch (err) {
      console.error('Error publishing AI product:', err);
      setIsPublishing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gemini AI Product Lister</Text>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.contentContainer}>
        {/* Banner */}
        <View style={styles.aiBanner}>
          <Sparkles size={20} color="#FFFFFF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.aiBannerTitle}>Auto-Fill Details with Gemini AI</Text>
            <Text style={styles.aiBannerSubtext}>
              Upload or pick a product photo. Gemini Vision instantly generates title, SEO tags, price, & description.
            </Text>
          </View>
        </View>

        {/* Photo Selection Zone */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Product Photo</Text>
          
          <View style={styles.previewImageFrame}>
            <Image source={{ uri: selectedImageUrl }} style={styles.previewImage} resizeMode="cover" />
          </View>

          <Text style={styles.sampleLabel}>Choose a Sample Photo to Analyze:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.samplesRow}>
            {SAMPLE_DEMO_IMAGES.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.sampleItem,
                  selectedImageUrl === img.url && styles.sampleItemActive,
                ]}
                onPress={() => setSelectedImageUrl(img.url)}
              >
                <Image source={{ uri: img.url }} style={styles.sampleThumb} />
                <Text style={styles.sampleText}>{img.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* AI Trigger Action */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.analyzeBtn, isAnalyzing && styles.analyzeBtnDisabled]}
            disabled={isAnalyzing}
            onPress={handleRunGeminiAI}
          >
            {isAnalyzing ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.analyzeBtnText}>Gemini AI Analyzing Photo...</Text>
              </>
            ) : (
              <>
                <Sparkles size={18} color="#FFFFFF" />
                <Text style={styles.analyzeBtnText}>
                  {aiGenerated ? 'Re-Analyze Photo with AI' : 'Auto-Generate Details with Gemini AI'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Editable Form Inputs */}
        <View style={styles.sectionCard}>
          <View style={styles.formHeaderRow}>
            <Text style={styles.sectionHeading}>Product Specifications</Text>
            {aiGenerated && (
              <View style={styles.aiBadge}>
                <CheckCircle2 size={12} color="#16A34A" />
                <Text style={styles.aiBadgeText}>AI Populated</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.inputLabel}>Product Title *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Fresh Alphonso Mangoes"
          />

          {/* Description */}
          <Text style={styles.inputLabel}>Product Description</Text>
          <TextInput
            style={[styles.textInput, { height: 80 }]}
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="Describe product quality, origin, etc."
          />

          {/* Category & Unit */}
          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.textInput}
                value={category}
                onChangeText={setCategory}
                placeholder="Fresh Produce"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Selling Unit</Text>
              <TextInput
                style={styles.textInput}
                value={unit}
                onChangeText={setUnit}
                placeholder="kg, piece, box"
              />
            </View>
          </View>

          {/* Price & Stock */}
          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
                placeholder="499"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.inputLabel}>Original MRP (₹)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={originalPrice}
                onChangeText={setOriginalPrice}
                placeholder="999"
              />
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Stock Quantity</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
                placeholder="20"
              />
            </View>
          </View>

          {/* Tags */}
          <Text style={styles.inputLabel}>Category & SEO Tags</Text>
          <View style={styles.tagsRow}>
            {tags.map((t, idx) => (
              <View key={idx} style={styles.tagPill}>
                <Text style={styles.tagPillText}>#{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer Publish Action */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.publishBtn, isPublishing && styles.publishBtnDisabled]}
          disabled={isPublishing}
          onPress={handlePublishProduct}
        >
          <Text style={styles.publishBtnText}>
            {isPublishing ? 'Publishing Product...' : 'Publish to DigiSewa Catalog'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  aiBanner: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  aiBannerTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  aiBannerSubtext: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  previewImageFrame: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  sampleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  samplesRow: {
    gap: 8,
    marginBottom: 16,
  },
  sampleItem: {
    padding: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    width: 80,
  },
  sampleItemActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  sampleThumb: {
    width: 70,
    height: 50,
    borderRadius: 6,
  },
  sampleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
    textAlign: 'center',
  },
  analyzeBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  analyzeBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  analyzeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  aiBadgeText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagPill: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '700',
  },
  footerBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  publishBtn: {
    backgroundColor: '#0F172A',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  publishBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
