import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { ArrowLeft, Star, Store, ShieldCheck, Zap, Minus, Plus, ShoppingBag } from 'lucide-react-native';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductDetailScreenProps {
  product: Product;
  onBack: () => void;
  onNavigateToCart: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  onBack,
  onNavigateToCart,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0].size : 'M'
  );
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({ ...product, selectedSize }, quantity);
  };

  const handleBuyNow = () => {
    addToCart({ ...product, selectedSize }, quantity);
    onNavigateToCart();
  };

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>
          Product Details
        </Text>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.contentContainer}>
        <View style={isDesktop ? styles.desktopFlexLayout : styles.mobileFlexLayout}>
          {/* Main Product Image */}
          <View style={[styles.imageContainer, isDesktop && styles.imageContainerDesktop]}>
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="cover" />
            {product.isHyperlocalAvailable && (
              <View style={styles.hyperlocalBadge}>
                <Zap size={12} color="#FFFFFF" />
                <Text style={styles.hyperlocalText}>30 Min Hyperlocal Express</Text>
              </View>
            )}
          </View>

          {/* Content Section */}
          <View style={[styles.detailsCard, isDesktop && styles.detailsCardDesktop]}>
          {/* Seller Tag */}
          <View style={styles.sellerTagRow}>
            <Store size={14} color="#EA580C" />
            <Text style={styles.sellerText}>{product.sellerName}</Text>
            <View style={styles.verifiedChip}>
              <ShieldCheck size={12} color="#16A34A" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          {/* Product Title */}
          <Text style={styles.productTitle}>{product.title}</Text>

          {/* Rating & Reviews */}
          <View style={styles.ratingRow}>
            <View style={styles.starBadge}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingValue}>{product.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.reviewsText}>({product.reviewCount} customer reviews)</Text>
          </View>

          {/* Pricing Row */}
          <View style={styles.priceContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.currentPrice}>{product.price}</Text>
            <Text style={styles.unitText}>/{product.unit}</Text>

            {product.originalPrice && (
              <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
            )}

            {discountPercentage > 0 && (
              <View style={styles.discountChip}>
                <Text style={styles.discountChipText}>{discountPercentage}% OFF</Text>
              </View>
            )}
          </View>

          {/* Meesho Apparel Size Selector & Inch Details */}
          {product.sizes && product.sizes.length > 0 && (
            <View style={styles.sizeSection}>
              <View style={styles.sizeHeaderRow}>
                <Text style={styles.sizeHeadingText}>Select Size:</Text>
                <Text style={styles.sizeGuideBadge}>Size Guide (Inches)</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeScrollView}>
                {product.sizes.map((sz) => {
                  const isSelected = selectedSize === sz.size;
                  const inchLabel = sz.waistInches ? `${sz.waistInches}" Waist` : sz.chestInches ? `${sz.chestInches}" Chest` : null;

                  return (
                    <TouchableOpacity
                      key={sz.size}
                      style={[styles.sizePill, isSelected && styles.sizePillActive]}
                      onPress={() => setSelectedSize(sz.size)}
                    >
                      <Text style={[styles.sizePillText, isSelected && styles.sizePillTextActive]}>
                        {sz.size}
                      </Text>
                      {inchLabel && (
                        <Text style={[styles.sizePillSubtext, isSelected && styles.sizePillSubtextActive]}>
                          {inchLabel}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Size Chart Inch Breakdown Box */}
              <View style={styles.sizeChartCard}>
                <Text style={styles.chartTitle}>Apparel Measurements (Inches)</Text>
                <View style={styles.chartTable}>
                  {product.sizes.map((sz) => (
                    <View key={sz.size} style={[styles.chartRow, selectedSize === sz.size && styles.chartRowActive]}>
                      <Text style={styles.chartSizeLabel}>{sz.size}</Text>
                      {sz.waistInches && <Text style={styles.chartDetailText}>Waist: {sz.waistInches}"</Text>}
                      {sz.chestInches && <Text style={styles.chartDetailText}>Chest: {sz.chestInches}"</Text>}
                      {sz.hipInches && <Text style={styles.chartDetailText}>Hip: {sz.hipInches}"</Text>}
                      {sz.lengthInches && <Text style={styles.chartDetailText}>Length: {sz.lengthInches}"</Text>}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Fabric & Specs Section */}
          {(product.fabric || product.fitType || product.pattern) && (
            <View style={styles.specsSection}>
              <Text style={styles.sectionHeading}>Product Specifications</Text>
              <View style={styles.specsGrid}>
                {product.fabric && (
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Fabric</Text>
                    <Text style={styles.specVal}>{product.fabric}</Text>
                  </View>
                )}
                {product.fitType && (
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Fit Type</Text>
                    <Text style={styles.specVal}>{product.fitType}</Text>
                  </View>
                )}
                {product.pattern && (
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Pattern</Text>
                    <Text style={styles.specVal}>{product.pattern}</Text>
                  </View>
                )}
                {product.color && (
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Color</Text>
                    <Text style={styles.specVal}>{product.color}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={16} color="#0F172A" />
              </TouchableOpacity>

              <Text style={styles.quantityValue}>{quantity}</Text>

              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Plus size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionHeading}>Product Description</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {product.tags.map((tag, idx) => (
              <View key={idx} style={styles.tagChip}>
                <Text style={styles.tagChipText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
          <ShoppingBag size={18} color="#EA580C" />
          <Text style={styles.cartBtnText}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow}>
          <Text style={styles.buyNowBtnText}>Buy Now</Text>
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
  desktopFlexLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    padding: 20,
  },
  mobileFlexLayout: {
    flexDirection: 'column',
  },
  imageContainerDesktop: {
    flex: 1,
    minWidth: 320,
    height: 380,
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailsCardDesktop: {
    flex: 1.3,
    marginTop: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  imageContainer: {
    height: 280,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  hyperlocalBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  hyperlocalText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 20,
  },
  sellerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sellerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 26,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  reviewsText: {
    fontSize: 12,
    color: '#64748B',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
    gap: 4,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
  },
  unitText: {
    fontSize: 13,
    color: '#64748B',
  },
  originalPrice: {
    fontSize: 16,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  discountChip: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  discountChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qtyBtn: {
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagChipText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  sizeSection: {
    marginVertical: 14,
  },
  sizeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sizeHeadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sizeGuideBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9F2089',
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sizeScrollView: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  sizePill: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    minWidth: 54,
  },
  sizePillActive: {
    borderColor: '#9F2089',
    backgroundColor: '#FDF2F8',
  },
  sizePillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  sizePillTextActive: {
    color: '#9F2089',
  },
  sizePillSubtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  sizePillSubtextActive: {
    color: '#9F2089',
  },
  sizeChartCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  chartTable: {
    gap: 4,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 12,
  },
  chartRowActive: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  chartSizeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9F2089',
    width: 30,
  },
  chartDetailText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  specsSection: {
    marginVertical: 12,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  specItem: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cartBtnText: {
    color: '#EA580C',
    fontSize: 14,
    fontWeight: '800',
  },
  buyNowBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 12,
  },
  buyNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
