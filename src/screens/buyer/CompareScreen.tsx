import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { ArrowLeft, ShoppingBag, Trash2, Star, AlertCircle } from 'lucide-react-native';
import { useCompare } from '../../context/CompareContext';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';

interface CompareScreenProps {
  onBack: () => void;
  onNavigateToCart?: () => void;
}

export const CompareScreen: React.FC<CompareScreenProps> = ({ onBack, onNavigateToCart }) => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Refs for syncing horizontal scroll between fixed header and scrollable body
  const headerScrollRef = React.useRef<ScrollView>(null);
  const bodyScrollRef = React.useRef<ScrollView>(null);
  const isSyncing = React.useRef(false);

  const handleHeaderScroll = (e: any) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    bodyScrollRef.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false });
    setTimeout(() => { isSyncing.current = false; }, 32);
  };

  const handleBodyScroll = (e: any) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    headerScrollRef.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false });
    setTimeout(() => { isSyncing.current = false; }, 32);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1, 'budget');
    if (onNavigateToCart) {
      onNavigateToCart();
    }
  };

  if (compareItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compare Products</Text>
        </View>
        <View style={styles.emptyContainer}>
          <AlertCircle size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Nothing to compare</Text>
          <Text style={styles.emptySubtext}>Add items from the same category to compare them.</Text>
          <TouchableOpacity style={styles.browseButton} onPress={onBack}>
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare Products</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearCompare}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, width: width, paddingTop: 16 }}>
        {/* Fixed Header Row (Scrolls horizontally in sync) */}
        <View style={{ zIndex: 10, backgroundColor: '#FFFFFF' }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.horizontalScrollContent}
            ref={headerScrollRef}
            onScroll={handleHeaderScroll}
            scrollEventThrottle={16}
          >
            <View style={[styles.comparisonTable, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 }]}>
              <View style={styles.tableRow}>
                <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]} />
                {compareItems.map(product => (
                  <View key={`header-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCompare(product.id)}>
                      <Trash2 size={16} color="#DC2626" />
                    </TouchableOpacity>
                    <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" />
                    <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
                    
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceText}>₹{product.price}</Text>
                      {product.originalPrice && (
                        <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
                      )}
                    </View>

                    <TouchableOpacity style={styles.addToCartBtn} onPress={() => handleAddToCart(product)}>
                      <ShoppingBag size={14} color="#FFFFFF" />
                      <Text style={styles.addToCartBtnText}>Add to Cart</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Scrollable Body (Scrolls vertically, and horizontally in sync) */}
        <ScrollView 
          style={styles.scrollArea} 
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={true}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true} 
            contentContainerStyle={styles.horizontalScrollContent}
            ref={bodyScrollRef}
            onScroll={handleBodyScroll}
            scrollEventThrottle={16}
          >
            <View style={[styles.comparisonTable, { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0 }]}>
            {/* Rating Row */}
            <View style={styles.tableRow}>
              <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]}>
                <Text style={styles.attributeLabelText}>Rating</Text>
              </View>
              {compareItems.map(product => (
                <View key={`rating-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                  <View style={styles.ratingBadge}>
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>{product.rating.toFixed(1)} ({product.reviewCount})</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Seller/Brand Row */}
            <View style={styles.tableRow}>
              <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]}>
                <Text style={styles.attributeLabelText}>Seller</Text>
              </View>
              {compareItems.map(product => (
                <View key={`seller-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                  <Text style={styles.attributeValueText}>{product.sellerName}</Text>
                </View>
              ))}
            </View>

            {/* Unit/Quantity Row */}
            <View style={styles.tableRow}>
              <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]}>
                <Text style={styles.attributeLabelText}>Unit</Text>
              </View>
              {compareItems.map(product => (
                <View key={`unit-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                  <Text style={styles.attributeValueText}>{product.unit}</Text>
                </View>
              ))}
            </View>

            {/* Category Row */}
            <View style={styles.tableRow}>
              <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]}>
                <Text style={styles.attributeLabelText}>Category</Text>
              </View>
              {compareItems.map(product => (
                <View key={`cat-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                  <Text style={styles.attributeValueText}>{product.category}</Text>
                </View>
              ))}
            </View>

            {/* Subcategory Row */}
            <View style={styles.tableRow}>
              <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]}>
                <Text style={styles.attributeLabelText}>Subcategory</Text>
              </View>
              {compareItems.map(product => (
                <View key={`subcat-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                  <Text style={styles.attributeValueText}>{product.subcategory || '-'}</Text>
                </View>
              ))}
            </View>

            {/* Fabric Row */}
            <View style={styles.tableRow}>
              <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]}>
                <Text style={styles.attributeLabelText}>Fabric</Text>
              </View>
              {compareItems.map(product => (
                <View key={`fabric-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                  <Text style={styles.attributeValueText}>{product.fabric || '-'}</Text>
                </View>
              ))}
            </View>

            {/* Pattern Row */}
            <View style={styles.tableRow}>
              <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]}>
                <Text style={styles.attributeLabelText}>Pattern</Text>
              </View>
              {compareItems.map(product => (
                <View key={`pattern-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                  <Text style={styles.attributeValueText}>{product.pattern || '-'}</Text>
                </View>
              ))}
            </View>

            {/* Fit Type Row */}
            <View style={styles.tableRow}>
              <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]}>
                <Text style={styles.attributeLabelText}>Fit Type</Text>
              </View>
              {compareItems.map(product => (
                <View key={`fittype-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                  <Text style={styles.attributeValueText}>{product.fitType || '-'}</Text>
                </View>
              ))}
            </View>

            {/* Color Row */}
            <View style={styles.tableRow}>
              <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]}>
                <Text style={styles.attributeLabelText}>Color</Text>
              </View>
              {compareItems.map(product => (
                <View key={`color-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                  <Text style={styles.attributeValueText}>{product.color || '-'}</Text>
                </View>
              ))}
            </View>

            {/* Sizes Row */}
            <View style={styles.tableRow}>
              <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]}>
                <Text style={styles.attributeLabelText}>Sizes</Text>
              </View>
              {compareItems.map(product => (
                <View key={`sizes-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                  <Text style={styles.attributeValueText}>
                    {product.sizes && product.sizes.length > 0 ? product.sizes.map(s => s.size).join(', ') : '-'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Stock Row */}
            <View style={styles.tableRow}>
              <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]}>
                <Text style={styles.attributeLabelText}>Stock</Text>
              </View>
              {compareItems.map(product => (
                <View key={`stock-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                  <Text style={[styles.attributeValueText, { color: product.stock > 0 ? '#16A34A' : '#DC2626', fontWeight: '600' }]}>
                    {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Description Row */}
            <View style={styles.tableRow}>
              <View style={[styles.attributeLabelCol, isDesktop && styles.desktopLabelCol]}>
                <Text style={styles.attributeLabelText}>Description</Text>
              </View>
              {compareItems.map(product => (
                <View key={`desc-${product.id}`} style={[styles.productCol, isDesktop && styles.desktopProductCol]}>
                  <Text style={styles.descriptionText}>{product.description}</Text>
                </View>
              ))}
            </View>

            </View>
          </ScrollView>
        </ScrollView>
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
    paddingVertical: 12,
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
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
  },
  comparisonTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  attributeLabelCol: {
    width: 100,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    justifyContent: 'center',
  },
  desktopLabelCol: {
    width: 150,
  },
  attributeLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  productCol: {
    width: 160,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    position: 'relative',
  },
  desktopProductCol: {
    width: 220,
    padding: 16,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: '#FEE2E2',
    padding: 6,
    borderRadius: 20,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 18,
    height: 36, // Force exactly 2 lines
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  originalPrice: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  addToCartBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addToCartBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  attributeValueText: {
    fontSize: 13,
    color: '#0F172A',
  },
  descriptionText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});
