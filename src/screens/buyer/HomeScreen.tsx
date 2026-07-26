import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Search, Sparkles, SlidersHorizontal, Zap, ShieldCheck, Truck } from 'lucide-react-native';
import { Product, Category } from '../../types';
import { getProducts, getCategories } from '../../services/firebaseService';
import { searchProductsWithAI } from '../../services/geminiAIService';
import { ProductCard } from '../../components/ProductCard';

interface HomeScreenProps {
  onSelectProduct: (product: Product) => void;
  isDesktop?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectProduct, isDesktop = false }) => {
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAISearchEnabled, setIsAISearchEnabled] = useState<boolean>(false);
  const [aiResponseSummary, setAiResponseSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSearchingAI, setIsSearchingAI] = useState<boolean>(false);

  const getCardColumnStyle = () => {
    if (width >= 1024) return { width: '25%' as const, paddingHorizontal: 8 };
    if (width >= 768) return { width: '33.33%' as const, paddingHorizontal: 8 };
    if (width >= 540) return { width: '50%' as const, paddingHorizontal: 6 };
    return { width: '100%' as const, paddingHorizontal: 6 };
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [fetchedProducts, fetchedCategories] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);
    setProducts(fetchedProducts);
    setCategories(fetchedCategories);
    setLoading(false);
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) {
      setAiResponseSummary(null);
      return;
    }

    if (isAISearchEnabled) {
      setIsSearchingAI(true);
      const aiResult = await searchProductsWithAI(searchQuery, products);
      setAiResponseSummary(aiResult.aiSummary);
      setIsSearchingAI(false);
    }
  };

  // Filter products based on selected category & standard text search if AI mode is disabled
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    if (isAISearchEnabled && aiResponseSummary) {
      return matchesCategory;
    }
    const matchesQuery =
      !searchQuery.trim() ||
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesQuery;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hyperlocal Hero Banner */}
      <View style={[styles.heroBanner, isDesktop && styles.heroBannerDesktop]}>
        <View style={styles.bannerTextCol}>
          <View style={styles.hyperlocalTag}>
            <Zap size={14} color="#EA580C" />
            <Text style={styles.hyperlocalTagText}>Hyperlocal 30-Min Delivery</Text>
          </View>
          <Text style={styles.heroTitle}>Support Local Stores in Your Neighborhood</Text>
          <Text style={styles.heroSubtext}>
            Fresh produce, daily groceries, sweets, and instant home repair services direct from verified local shopkeepers.
          </Text>

          <View style={styles.perksRow}>
            <View style={styles.perkItem}>
              <ShieldCheck size={14} color="#16A34A" />
              <Text style={styles.perkText}>100% Verified Sellers</Text>
            </View>
            <View style={styles.perkItem}>
              <Truck size={14} color="#2563EB" />
              <Text style={styles.perkText}>Fastest Local Fulfillment</Text>
            </View>
          </View>
        </View>
      </View>

      {/* AI Assistant Powered Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBarWrapper}>
          <Search size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            placeholder={
              isAISearchEnabled
                ? 'Ask Gemini AI: "Ingredients for Butter Chicken under ₹500"'
                : 'Search products, local shops, items...'
            }
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setAiResponseSummary(null);
              }}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Gemini AI Search Assistant Toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.aiToggleBtn, isAISearchEnabled && styles.aiToggleBtnActive]}
          onPress={() => setIsAISearchEnabled(!isAISearchEnabled)}
        >
          <Sparkles size={16} color={isAISearchEnabled ? '#FFFFFF' : '#EA580C'} />
          <Text style={[styles.aiToggleText, isAISearchEnabled && styles.aiToggleTextActive]}>
            {isAISearchEnabled ? 'Gemini AI Search Active' : 'Enable AI Assistant'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI Search Assistant Summary Banner */}
      {isSearchingAI && (
        <View style={styles.aiLoadingBanner}>
          <ActivityIndicator size="small" color="#EA580C" />
          <Text style={styles.aiLoadingText}>Gemini AI is analyzing local product catalog...</Text>
        </View>
      )}

      {aiResponseSummary && !isSearchingAI && (
        <View style={styles.aiResponseCard}>
          <View style={styles.aiResponseHeader}>
            <Sparkles size={16} color="#EA580C" />
            <Text style={styles.aiResponseTitle}>Gemini AI Shopping Assistant</Text>
          </View>
          <Text style={styles.aiResponseText}>{aiResponseSummary}</Text>
        </View>
      )}

      {/* Category Pills Slider */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Explore Local Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'All' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[styles.categoryChipText, selectedCategory === 'All' && styles.categoryChipTextActive]}>
              All Items
            </Text>
          </TouchableOpacity>

          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategory === cat.name && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.name)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat.name && styles.categoryChipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <View style={styles.productsSection}>
        <View style={styles.productHeaderRow}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'Featured Local Products' : selectedCategory}
          </Text>
          <Text style={styles.productCountText}>{filteredProducts.length} items</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#EA580C" style={{ marginVertical: 32 }} />
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or category filter.</Text>
          </View>
        ) : (
          <View style={[styles.gridContainer, isDesktop && styles.gridContainerDesktop]}>
            {filteredProducts.map(product => (
              <View key={product.id} style={getCardColumnStyle()}>
                <ProductCard product={product} onPress={() => onSelectProduct(product)} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 20,
    margin: 16,
  },
  heroBannerDesktop: {
    marginHorizontal: 32,
    marginVertical: 20,
    paddingHorizontal: 36,
    paddingVertical: 32,
  },
  bannerTextCol: {
    maxWidth: 700,
  },
  hyperlocalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  hyperlocalTagText: {
    color: '#EA580C',
    fontSize: 11,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubtext: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  perksRow: {
    flexDirection: 'row',
    gap: 16,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perkText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  clearText: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '700',
  },
  aiToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#EA580C',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  aiToggleBtnActive: {
    backgroundColor: '#EA580C',
  },
  aiToggleText: {
    color: '#EA580C',
    fontSize: 12,
    fontWeight: '700',
  },
  aiToggleTextActive: {
    color: '#FFFFFF',
  },
  aiLoadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  aiLoadingText: {
    color: '#C2410C',
    fontSize: 13,
    fontWeight: '600',
  },
  aiResponseCard: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  aiResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiResponseTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  aiResponseText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  categorySection: {
    paddingLeft: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  categoriesList: {
    paddingRight: 16,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  productsSection: {
    paddingHorizontal: 16,
  },
  productHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridContainerDesktop: {
    marginHorizontal: -8,
  },
  gridColMobile: {
    width: '100%',
    paddingHorizontal: 6,
  },
  gridColDesktop: {
    width: '33.33%',
    paddingHorizontal: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
});
