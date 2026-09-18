import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingBag, Star, Zap, CircleCheck, Heart, Trash2, Scale } from 'lucide-react-native';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  isWishlistView?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, isWishlistView }) => {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();

  if (!product) return null;

  const isWished = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  const toggleWishlist = () => {
    if (isWished) removeFromWishlist(product.id);
    else addToWishlist(product);
  };

  const toggleCompare = () => {
    if (isCompared) removeFromCompare(product.id);
    else addToCompare(product);
  };

  const discountPercentage = product.originalPrice && product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.cardContainer} onPress={onPress}>
      {/* Product Image & Badges */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: product.imageUrl || 'https://via.placeholder.com/150' }} style={styles.productImage} resizeMode="cover" />
        
        {discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
          </View>
        )}

        {/* Wishlist Button */}
        <TouchableOpacity 
          style={styles.wishlistButton} 
          onPress={(e) => {
            e.stopPropagation();
            if (isWishlistView) {
              removeFromWishlist(product.id);
            } else {
              toggleWishlist();
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.wishlistIconContainer}>
            {isWishlistView ? (
              <Trash2 size={16} color="#DC2626" />
            ) : (
              <Heart size={18} color={isWished ? "#EF4444" : "#94A3B8"} fill={isWished ? "#EF4444" : "transparent"} />
            )}
          </View>
        </TouchableOpacity>

        {/* Compare Button */}
        {!isWishlistView && (
          <TouchableOpacity 
            style={styles.compareButton} 
            onPress={(e) => {
              e.stopPropagation();
              toggleCompare();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.wishlistIconContainer}>
              <Scale size={18} color={isCompared ? "#4F46E5" : "#94A3B8"} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Seller Info & Rating */}
        <View style={styles.headerRow}>
          <Text numberOfLines={1} style={styles.sellerName}>
            {product.sellerName || 'Unknown Seller'}
          </Text>
          <View style={styles.ratingBadge}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{(product.rating || 0).toFixed(1)}</Text>
          </View>
        </View>

        {/* Title */}
        <Text numberOfLines={2} style={styles.titleText}>
          {product.title || 'Untitled Product'}
        </Text>

        {/* Category Pill */}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{product.category || 'General'}</Text>
        </View>

        {/* Footer: Price & Add to Cart */}
        <View style={styles.footerRow}>
          <View>
            <View style={styles.priceRow}>
              <Text style={styles.priceSymbol}>₹</Text>
              <Text style={styles.priceValue}>{product.price || 0}</Text>
              <Text style={styles.unitText}>/{product.unit || 'unit'}</Text>
            </View>
            {product.originalPrice && (
              <Text style={styles.originalPriceText}>₹{product.originalPrice}</Text>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.addButton}
            onPress={() => addToCart(product, 1)}
          >
            <ShoppingBag size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>ADD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F8FAFC',
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  wishlistIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compareButton: {
    position: 'absolute',
    top: 50,
    right: 12,
    zIndex: 10,
  },
  contentContainer: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 18,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  categoryText: {
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  unitText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 2,
  },
  originalPriceText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginTop: -2,
  },
  addButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
