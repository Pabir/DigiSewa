import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Search, Sparkles, SlidersHorizontal, Zap, ShieldCheck, Truck } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';
import { Product, Category } from '../../types';
import { getProductsPaginated, getCategories, recordSearchHistory, getRecommendedProducts } from '../../services/firebaseService';
import { searchProductsWithAI } from '../../services/geminiAIService';
import { useAuth } from '../../context/AuthContext';
import { ProductCard } from '../../components/ProductCard';
import { FilterModal, FilterState } from '../../components/FilterModal';
import { useCompare } from '../../context/CompareContext';
import { Scale } from 'lucide-react-native';

interface HomeScreenProps {
  onSelectProduct: (product: Product) => void;
  onNavigateToCompare?: () => void;
  isDesktop?: boolean;
}

const DynamicIcon = ({ name, color, size }: { name: string; color: string; size: number }) => {
  if (!name) return null;
  // Convert kebab-case (e.g., 'shopping-bag') to PascalCase (e.g., 'ShoppingBag')
  const iconName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Circle;
  return <IconComponent color={color} size={size} />;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectProduct, onNavigateToCompare, isDesktop = false }) => {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { compareItems } = useCompare();
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAISearchEnabled, setIsAISearchEnabled] = useState<boolean>(false);
  const [aiResponseSummary, setAiResponseSummary] = useState<string | null>(null);
  const [aiMatchingIds, setAiMatchingIds] = useState<string[]>([]);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isSearchingAI, setIsSearchingAI] = useState<boolean>(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    minPrice: '',
    maxPrice: '',
    minRating: 0,
    sortBy: 'default'
  });

  const getCardColumnStyle = () => {
    if (width >= 1024) return { width: '25%' as const, paddingHorizontal: 8 };
    if (width >= 768) return { width: '33.33%' as const, paddingHorizontal: 8 };
    if (width >= 540) return { width: '50%' as const, paddingHorizontal: 6 };
    return { width: '50%' as const, paddingHorizontal: 6 };
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user?.id) {
      getRecommendedProducts(user.id).then(({ recommended, recentlyViewedProducts: viewed }) => {
        setRecommendedProducts(recommended);
        setRecentlyViewedProducts(viewed);
      });
    } else {
      setRecommendedProducts([]);
      setRecentlyViewedProducts([]);
    }
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    const [paginatedResult, fetchedCategories] = await Promise.all([
      getProductsPaginated(undefined, undefined, 20),
      getCategories(),
    ]);
    setProducts(paginatedResult.products);
    setLastVisibleDoc(paginatedResult.lastDoc);
    setCategories(fetchedCategories);
    setLoading(false);
  };

  const loadMoreProducts = async () => {
    if (!lastVisibleDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const paginatedResult = await getProductsPaginated(undefined, lastVisibleDoc, 20);
      setProducts(prev => [...prev, ...paginatedResult.products]);
      setLastVisibleDoc(paginatedResult.lastDoc);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) {
      setAiResponseSummary(null);
      return;
    }

    if (user?.id) {
      await recordSearchHistory(user.id, searchQuery);
      getRecommendedProducts(user.id).then(({ recommended, recentlyViewedProducts: viewed }) => {
        setRecommendedProducts(recommended);
        setRecentlyViewedProducts(viewed);
      });
    }

    if (isAISearchEnabled) {
      setIsSearchingAI(true);
      const aiResult = await searchProductsWithAI(searchQuery);
      setAiResponseSummary(aiResult.aiSummary);
      setAiMatchingIds(aiResult.matchingProductIds);
      setIsSearchingAI(false);
    }
  };

  // Filter products based on selected category & standard text search if AI mode is disabled
  let filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    if (isAISearchEnabled && aiResponseSummary) {
      return matchesCategory && aiMatchingIds.includes(product.id);
    }
    const matchesQuery =
      !searchQuery.trim() ||
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const price = product.price || 0;
    const minPriceMatch = !currentFilters.minPrice || price >= parseFloat(currentFilters.minPrice);
    const maxPriceMatch = !currentFilters.maxPrice || price <= parseFloat(currentFilters.maxPrice);
    const ratingMatch = !currentFilters.minRating || (product.rating || 0) >= currentFilters.minRating;

    return matchesCategory && matchesQuery && minPriceMatch && maxPriceMatch && ratingMatch;
  });

  if (currentFilters.sortBy === 'price_asc') {
    filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (currentFilters.sortBy === 'price_desc') {
    filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (currentFilters.sortBy === 'rating_desc') {
    filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (currentFilters.sortBy === 'newest') {
    filteredProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      {/* Hyperlocal Hero Banner */}
      <View style={[styles.heroBanner, isDesktop && styles.heroBannerDesktop]}>
        <View style={styles.bannerTextCol}>
          <Text style={styles.heroTitle}>Discover Quality Products & Services Nationwide</Text>
          <Text style={styles.heroSubtext}>
            Groceries, electronics, fashion, and professional services direct from verified sellers across the country.
          </Text>

          <View style={styles.perksRow}>
            <View style={styles.perkItem}>
              <ShieldCheck size={14} color="#16A34A" />
              <Text style={styles.perkText}>100% Verified Sellers</Text>
            </View>
            <View style={styles.perkItem}>
              <Truck size={14} color="#2563EB" />
              <Text style={styles.perkText}>Nationwide Delivery</Text>
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
                setAiMatchingIds([]);
              }}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Gemini AI Search Assistant Toggle & Filter Button */}
        <View style={styles.searchActionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.aiToggleBtn, isAISearchEnabled && styles.aiToggleBtnActive]}
            onPress={() => setIsAISearchEnabled(!isAISearchEnabled)}
          >
            <Sparkles size={16} color={isAISearchEnabled ? '#FFFFFF' : '#4F46E5'} />
            <Text style={[styles.aiToggleText, isAISearchEnabled && styles.aiToggleTextActive]}>
              {isAISearchEnabled ? 'Gemini AI Search Active' : 'Enable AI Assistant'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.filterToggleBtn}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <SlidersHorizontal size={16} color="#4F46E5" />
            <Text style={styles.filterToggleText}>Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Search Assistant Summary Banner */}
      {isSearchingAI && (
        <View style={styles.aiLoadingBanner}>
          <ActivityIndicator size="small" color="#4F46E5" />
          <Text style={styles.aiLoadingText}>Gemini AI is analyzing local product catalog...</Text>
        </View>
      )}

      {aiResponseSummary && !isSearchingAI && (
        <View style={styles.aiResponseCard}>
          <View style={styles.aiResponseHeader}>
            <Sparkles size={16} color="#4F46E5" />
            <Text style={styles.aiResponseTitle}>Gemini AI Shopping Assistant</Text>
          </View>
          <Text style={styles.aiResponseText}>{aiResponseSummary}</Text>
        </View>
      )}

      {/* RECENTLY VIEWED & RECOMMENDED SECTIONS */}
      {!searchQuery && selectedCategory === 'All' && recentlyViewedProducts.length > 0 && (
        <View style={styles.productsSection}>
          <View style={styles.productHeaderRow}>
            <Text style={styles.sectionTitle}>Recently Viewed</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -6 }}>
            {recentlyViewedProducts.map(product => (
               <View key={`rv-${product.id}`} style={{ width: 160, paddingHorizontal: 6 }}>
                 <ProductCard product={product} onPress={() => onSelectProduct(product)} />
               </View>
            ))}
          </ScrollView>
        </View>
      )}

      {!searchQuery && selectedCategory === 'All' && recommendedProducts.length > 0 && (
        <View style={[styles.productsSection, { marginTop: 24, marginBottom: 16 }]}>
          <View style={styles.productHeaderRow}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -6 }}>
            {recommendedProducts.map(product => (
               <View key={`rec-${product.id}`} style={{ width: 160, paddingHorizontal: 6 }}>
                 <ProductCard product={product} onPress={() => onSelectProduct(product)} />
               </View>
            ))}
          </ScrollView>
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
            <DynamicIcon 
              name="layout-grid" 
              color={selectedCategory === 'All' ? '#FFFFFF' : '#64748B'} 
              size={14} 
            />
            <Text style={[styles.categoryChipText, selectedCategory === 'All' && styles.categoryChipTextActive]}>
              All Items
            </Text>
          </TouchableOpacity>

          {categories.map(cat => {
            const isActive = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.name)}
              >
                <DynamicIcon 
                  name={cat.iconName} 
                  color={isActive ? '#FFFFFF' : cat.color || '#64748B'} 
                  size={14} 
                />
                <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
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
          <ActivityIndicator size="large" color="#4F46E5" style={{ marginVertical: 32 }} />
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
        
        {/* Load More Button for Pagination */}
        {!loading && !searchQuery && filteredProducts.length > 0 && lastVisibleDoc && (
          <TouchableOpacity 
            style={styles.loadMoreBtn} 
            onPress={loadMoreProducts}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
              <Text style={styles.loadMoreText}>Load More Products</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        currentFilters={currentFilters}
        onApplyFilters={(filters) => setCurrentFilters(filters)}
      />

      {/* Compare Floating Button */}
      {compareItems.length > 0 && onNavigateToCompare && (
        <TouchableOpacity style={styles.compareFab} onPress={onNavigateToCompare} activeOpacity={0.9}>
          <Scale size={20} color="#FFFFFF" />
          <Text style={styles.compareFabText}>Compare ({compareItems.length})</Text>
        </TouchableOpacity>
      )}
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
    padding: 0,
    outlineStyle: 'none',
  } as any,
  clearText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
  },
  searchActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  aiToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  aiToggleBtnActive: {
    backgroundColor: '#4F46E5',
  },
  aiToggleText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  aiToggleTextActive: {
    color: '#FFFFFF',
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  filterToggleText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  aiLoadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  aiLoadingText: {
    color: '#4338CA',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  compareFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100,
  },
  compareFabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
