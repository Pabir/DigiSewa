import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions, TextInput, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, Star, Store, ShieldCheck, Zap, Minus, Plus, ShoppingBag, MapPin, Check, Truck } from 'lucide-react-native';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { getMeasurementInfo, getSizeVariantMeasurement } from '../../utils/productSizeUtils';
import { DynamicProductAttributes } from '../../components/buyer/DynamicProductAttributes';
import { shiprocketLogin, checkServiceability } from '../../services/shiprocketService';
import { getSellersFromFirestore } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import { ProductReview } from '../../types';
import { getProductReviews, checkVerifiedBuyer } from '../../services/reviewService';
import { WriteReviewModal } from '../../components/reviews/WriteReviewModal';

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

  const uniqueColors = product.variants 
    ? Array.from(new Set(product.variants.map(v => v.attributeValues?.color || v.attributeValues?.Color).filter(Boolean)))
    : (product.color ? [product.color] : []);

  const [selectedColor, setSelectedColor] = useState<string>(uniqueColors.length > 0 ? String(uniqueColors[0]) : '');

  let variantImages: string[] = [];
  if (selectedColor && product.variants) {
    const colorVariant = product.variants.find(v => 
      (v.attributeValues?.color === selectedColor || v.attributeValues?.Color === selectedColor) 
      && v.images && v.images.length > 0
    );
    if (colorVariant) {
      variantImages = colorVariant.images!;
    }
  }

  const allImages = variantImages.length > 0 
    ? variantImages 
    : [product.imageUrl, ...(product.additionalImages || [])].filter(Boolean);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const [imageContainerWidth, setImageContainerWidth] = useState(isDesktop ? 320 : width);

  React.useEffect(() => {
    setActiveImageIndex(0);
    scrollViewRef.current?.scrollTo({ x: 0, animated: false });
  }, [selectedColor, allImages.length]);

  const availableSizesForColor = selectedColor && product.variants
    ? product.variants
        .filter(v => v.attributeValues?.color === selectedColor || v.attributeValues?.Color === selectedColor)
        .map(v => {
          const sizeVal = v.attributeValues?.Size || v.attributeValues?.size || v.attributeValues?.['Shirt Size'] || v.attributeValues?.['Tshirt Size'] || v.title?.split('-')?.pop()?.trim() || 'Free Size';
          const szObj = product.sizes?.find(s => s.size === sizeVal) || { size: sizeVal, price: v.price, stock: v.stock };
          return szObj;
        })
    : product.sizes || [];

  const uniqueSizes: any[] = [];
  const seenSizes = new Set();
  availableSizesForColor.forEach(sz => {
    if (!seenSizes.has(sz.size)) {
      seenSizes.add(sz.size);
      uniqueSizes.push(sz);
    }
  });

  const displaySizes = product.variants ? uniqueSizes : (product.sizes || []);

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<string>(
    displaySizes.length > 0 ? displaySizes[0].size : 'M'
  );
  const { addToCart } = useCart();

  const measInfo = getMeasurementInfo(
    product.category,
    product.subcategory,
    null,
    null,
    product.title,
    product.tags
  );

  const { user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  React.useEffect(() => {
    loadReviews();
    if (user?.id) {
      checkVerifiedBuyer(user.id, product.id).then(setIsVerifiedBuyer);
    }
  }, [product.id, user?.id]);

  const loadReviews = async () => {
    const data = await getProductReviews(product.id);
    setReviews(data);
  };

  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<{ estimatedDeliveryDate: string; courierName: string; rate: number; type: 'fast' | 'budget' }[] | null>(null);
  const [selectedDeliveryPreference, setSelectedDeliveryPreference] = useState<'fast' | 'budget'>('budget');
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

  const handleCheckDelivery = async () => {
    setDeliveryError(null);
    setDeliveryInfo(null);
    
    if (!pincode || pincode.length !== 6) {
      setDeliveryError('Please enter a valid 6-digit pincode.');
      return;
    }
    
    try {
      setIsCheckingPincode(true);
      const token = await shiprocketLogin();
      
      let pickupPincode = '110030'; // fallback
      try {
        const sellers = await getSellersFromFirestore();
        const seller = sellers.find(s => s.id === product.sellerId);
        if (seller?.pickupAddress?.pincode) {
          pickupPincode = seller.pickupAddress.pincode;
        }
      } catch (e) {
        console.warn('Failed to fetch seller pincode, using fallback.', e);
      }
      
      const weight = 0.5; // Mock weight
      const info = await checkServiceability(pickupPincode, pincode, weight, token);
      
      if (info) {
        // Option 2: Override rate to 0 if seller offers free delivery
        const finalInfo = product.offerFreeShipping
          ? info.map(o => ({ ...o, rate: 0 }))
          : info;
        setDeliveryInfo(finalInfo);
      } else {
        setDeliveryError('Delivery is not available for this pincode.');
      }
    } catch (err: any) {
      console.error(err);
      setDeliveryError(err.message || 'Failed to check delivery date. Please try again.');
    } finally {
      setIsCheckingPincode(false);
    }
  };

  const handleAddToCart = () => {
    addToCart({ ...product, selectedSize, color: selectedColor || product.color }, quantity, selectedDeliveryPreference);
  };

  const handleBuyNow = () => {
    addToCart({ ...product, selectedSize, color: selectedColor || product.color }, quantity, selectedDeliveryPreference);
    onNavigateToCart();
  };

  // Calculate active price based on selected variants or sizes
  let activePrice = product.price;
  let activeOriginalPrice = product.originalPrice;

  if (product.variants && product.variants.length > 0) {
    const matchedVariant = product.variants.find(v => {
      const colorMatch = !selectedColor || v.attributeValues?.color === selectedColor || v.attributeValues?.Color === selectedColor;
      const vSize = v.attributeValues?.Size || v.attributeValues?.size || v.attributeValues?.['Shirt Size'] || v.attributeValues?.['Tshirt Size'] || v.title?.split('-')?.pop()?.trim() || 'Free Size';
      const sizeMatch = !selectedSize || vSize === selectedSize;
      return colorMatch && sizeMatch;
    });

    if (matchedVariant && matchedVariant.price) {
      activePrice = matchedVariant.price;
      activeOriginalPrice = (matchedVariant as any).mrp || (matchedVariant as any).originalPrice || activeOriginalPrice; 
    }
  } else if (product.sizes && product.sizes.length > 0) {
    const matchedSize = product.sizes.find(s => s.size === selectedSize);
    if (matchedSize && matchedSize.price) {
      activePrice = matchedSize.price;
      activeOriginalPrice = (matchedSize as any).mrp || (matchedSize as any).originalPrice || activeOriginalPrice;
    }
  }

  if (activeOriginalPrice && activePrice > activeOriginalPrice) {
    const temp = activeOriginalPrice;
    activeOriginalPrice = activePrice;
    activePrice = temp;
  }

  const discountPercentage = activeOriginalPrice && activeOriginalPrice > activePrice
    ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100)
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
          {/* Main Product Image Section */}
          <View 
            style={[styles.imageContainer, isDesktop && styles.imageContainerDesktop]}
            onLayout={(e) => setImageContainerWidth(e.nativeEvent.layout.width)}
          >
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(event) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const viewWidth = event.nativeEvent.layoutMeasurement.width || imageContainerWidth;
                if (viewWidth > 0) {
                  const index = Math.round(offsetX / viewWidth);
                  setActiveImageIndex(index);
                }
              }}
            >
              {allImages.map((imgUri, idx) => (
                <View key={idx} style={{ width: imageContainerWidth, height: '100%' }}>
                  <Image 
                    source={{ uri: imgUri }} 
                    style={styles.productImage} 
                    resizeMode="contain" 
                  />
                </View>
              ))}
            </ScrollView>

            {/* Pagination Dots */}
            {allImages.length > 1 && (
              <View style={styles.paginationContainer}>
                {allImages.map((_, idx) => (
                  <View 
                    key={idx} 
                    style={[
                      styles.paginationDot, 
                      activeImageIndex === idx && styles.paginationDotActive
                    ]} 
                  />
                ))}
              </View>
            )}
          </View>
          
          {/* Thumbnail Gallery (Moved outside image container for better responsiveness) */}
          {allImages.length > 1 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailGallery}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
            >
              {allImages.map((imgUri, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  onPress={() => {
                    setActiveImageIndex(idx);
                    scrollViewRef.current?.scrollTo({ x: idx * imageContainerWidth, animated: true });
                  }}
                  style={[
                    styles.thumbnailWrapper,
                    activeImageIndex === idx && styles.thumbnailActive
                  ]}
                >
                  <Image source={{ uri: imgUri }} style={styles.thumbnailImg} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Product Info Section */}
          <View style={[styles.detailsCard, isDesktop && styles.detailsCardDesktop]}>
          {/* Seller Tag */}
          <View style={styles.sellerTagRow}>
            <Store size={14} color="#4F46E5" />
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
            <Text style={styles.currentPrice}>{activePrice}</Text>
            <Text style={styles.unitText}>/{product.unit}</Text>

            {activeOriginalPrice && activeOriginalPrice > activePrice && (
              <Text style={styles.originalPrice}>₹{activeOriginalPrice}</Text>
            )}

            {discountPercentage > 0 && (
              <View style={styles.discountChip}>
                <Text style={styles.discountChipText}>{discountPercentage}% OFF</Text>
              </View>
            )}
          </View>

          {/* Delivery Pincode Check */}
          <View style={styles.deliveryCheckContainer}>
            <Text style={styles.deliveryCheckLabel}>Check Delivery Options</Text>
            <View style={styles.deliveryInputRow}>
              <View style={styles.deliveryInputWrapper}>
                <MapPin size={16} color="#64748B" style={styles.deliveryInputIcon} />
                <TextInput
                  style={styles.deliveryInput}
                  placeholder="Enter Pincode"
                  keyboardType="numeric"
                  maxLength={6}
                  value={pincode}
                  onChangeText={setPincode}
                />
              </View>
              <TouchableOpacity style={styles.deliveryCheckButton} onPress={handleCheckDelivery} disabled={isCheckingPincode}>
                {isCheckingPincode ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deliveryCheckButtonText}>Check</Text>
                )}
              </TouchableOpacity>
            </View>
            {deliveryError && (
              <Text style={styles.deliveryErrorText}>{deliveryError}</Text>
            )}
            {deliveryInfo && deliveryInfo.length > 0 && (
              <View style={{ marginTop: 12, gap: 8 }}>
                {deliveryInfo.map((option) => (
                  <TouchableOpacity 
                    key={option.type}
                    onPress={() => setSelectedDeliveryPreference(option.type)}
                    style={[
                      styles.deliveryResultBox, 
                      { borderWidth: 2 },
                      selectedDeliveryPreference === option.type ? { borderColor: '#16A34A', backgroundColor: '#F0FDF4' } : { borderColor: 'transparent' }
                    ]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.deliveryResultBold, { fontSize: 14, color: selectedDeliveryPreference === option.type ? '#16A34A' : '#0F172A' }]}>
                        {option.type === 'fast' ? 'Express Delivery' : 'Budget Delivery'}
                      </Text>
                      {selectedDeliveryPreference === option.type && <Check size={16} color="#16A34A" />}
                    </View>
                    <Text style={[styles.deliveryResultText, { marginTop: 4 }]}>
                      Expected: <Text style={styles.deliveryResultBold}>{new Date(option.estimatedDeliveryDate).toDateString()}</Text>
                    </Text>
                    <Text style={styles.deliveryResultText}>
                      Delivery Charge: <Text style={styles.deliveryResultBold}>₹{option.rate}</Text>
                    </Text>
                    <Text style={styles.deliveryResultCourier}>Courier: {option.courierName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Meesho Apparel Color Selector */}
          {uniqueColors.length > 0 && (
            <View style={styles.sizeSection}>
              <View style={styles.sizeHeaderRow}>
                <Text style={styles.sizeHeadingText}>Select Color:</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeScrollView}>
                {uniqueColors.map((color) => {
                  const isSelected = selectedColor === String(color);
                  return (
                    <TouchableOpacity
                      key={String(color)}
                      style={[styles.colorPill, isSelected && styles.colorPillActive]}
                      onPress={() => setSelectedColor(String(color))}
                    >
                      <Text style={[styles.colorPillText, isSelected && styles.colorPillTextActive]}>
                        {String(color)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Visual Color Thumbnails (Meesho Style) */}
              <Text style={[styles.sizeHeadingText, { marginTop: 12, marginBottom: 8 }]}>Available Colors ({uniqueColors.length}):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeScrollView}>
                {uniqueColors.map((color, idx) => {
                  const isSelected = selectedColor === String(color);
                  let imgUrl = product.imageUrl;
                  
                  if (product.variants) {
                    const v = product.variants.find(v => (v.attributeValues?.color === color || v.attributeValues?.Color === color) && v.images && v.images.length > 0);
                    if (v && v.images && v.images.length > 0) {
                      imgUrl = v.images[0];
                    }
                  }
                  
                  // Fallback: Use additional images sequentially if variant images aren't present
                  if (imgUrl === product.imageUrl && product.additionalImages && product.additionalImages.length >= uniqueColors.length) {
                    const allImgs = [product.imageUrl, ...product.additionalImages];
                    if (allImgs[idx]) {
                      imgUrl = allImgs[idx];
                    }
                  }
                  
                  return (
                    <TouchableOpacity
                      key={`img-${String(color)}`}
                      style={[styles.colorThumbnailWrapper, isSelected && styles.colorThumbnailWrapperActive]}
                      onPress={() => setSelectedColor(String(color))}
                    >
                      <Image source={{ uri: imgUrl }} style={styles.colorThumbnailImage} resizeMode="cover" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Meesho Apparel Size Selector & Inch Details */}
          {displaySizes.length > 0 && (
            <View style={styles.sizeSection}>
              <View style={styles.sizeHeaderRow}>
                <Text style={styles.sizeHeadingText}>Select Size:</Text>
                <Text style={styles.sizeGuideBadge}>Size Guide (Inches)</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeScrollView}>
                {displaySizes.map((sz) => {
                  const isSelected = selectedSize === sz.size;
                  const { val: mVal, label: mLabel } = getSizeVariantMeasurement(sz, measInfo);
                  const inchLabel = mVal ? `${mVal}" ${mLabel}` : null;

                  return (
                    <TouchableOpacity
                      key={sz.size}
                      style={[styles.sizePill, isSelected && styles.sizePillActive]}
                      onPress={() => setSelectedSize(sz.size)}
                    >
                      <Text style={[styles.sizePillText, isSelected && styles.sizePillTextActive]}>
                        {sz.size}
                      </Text>
                      {sz.sku ? (
                        <Text style={[styles.sizePillSubtext, { marginTop: 4, fontWeight: '600' }, isSelected && styles.sizePillSubtextActive]}>
                          SKU: {sz.sku}
                        </Text>
                      ) : null}
                      {inchLabel && (
                        <Text style={[styles.sizePillSubtext, isSelected && styles.sizePillSubtextActive]}>
                          {inchLabel}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Size Chart Breakdown Box */}
              <View style={styles.sizeChartCard}>
                <Text style={styles.chartTitle}>
                  {measInfo.wearType === 'footwear' ? 'Footwear Sizes (IND Standard)' : 'Apparel Measurements (Inches)'}
                </Text>
                <View style={styles.chartTable}>
                  {displaySizes.map((sz) => {
                    const { val: mVal, label: mLabel } = getSizeVariantMeasurement(sz, measInfo);

                    return (
                      <View key={sz.size} style={[styles.chartRow, selectedSize === sz.size && styles.chartRowActive]}>
                        <Text style={styles.chartSizeLabel}>{sz.size}</Text>
                        {measInfo.wearType === 'footwear' ? (
                          <Text style={styles.chartDetailText}>Indian Standard Fit</Text>
                        ) : (
                          <>
                            {mVal !== undefined && <Text style={styles.chartDetailText}>{mLabel}: {mVal}"</Text>}
                            {sz.hipInches && <Text style={styles.chartDetailText}>Hip: {sz.hipInches}"</Text>}
                            {sz.lengthInches && <Text style={styles.chartDetailText}>Length: {sz.lengthInches}"</Text>}
                          </>
                        )}
                      </View>
                    );
                  })}
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

          {/* Dynamic Category Attributes Specification Component */}
          <DynamicProductAttributes product={product} />

          {/* Tags */}
          <View style={styles.tagsRow}>
            {product.tags.map((tag, idx) => (
              <View key={idx} style={styles.tagChip}>
                <Text style={styles.tagChipText}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Customer Reviews Section */}
          <View style={styles.sectionDivider} />
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionHeading}>Customer Reviews</Text>
            {isVerifiedBuyer && (
              <TouchableOpacity style={styles.writeReviewBtn} onPress={() => setShowReviewModal(true)}>
                <Text style={styles.writeReviewBtnText}>Write a Review</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>No reviews yet. Be the first to review this product!</Text>
          ) : (
            reviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.userName}</Text>
                  <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      color={review.rating >= star ? '#FFB800' : '#E5E7EB'}
                      fill={review.rating >= star ? '#FFB800' : 'transparent'}
                      style={styles.starIcon}
                    />
                  ))}
                </View>
                {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
                <Text style={styles.reviewComment}>{review.comment}</Text>
                
                {review.sellerReply && (
                  <View style={styles.sellerReplyCard}>
                    <Text style={styles.sellerReplyLabel}>Seller's Reply:</Text>
                    <Text style={styles.sellerReplyText}>{review.sellerReply}</Text>
                  </View>
                )}
              </View>
            ))
          )}

          {/* Write Review Modal */}
          <WriteReviewModal
            visible={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            productId={product.id}
            sellerId={product.sellerId}
            productTitle={product.title}
            onReviewSubmitted={loadReviews}
          />
        </View>
      </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
          <ShoppingBag size={18} color="#4F46E5" />
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
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  paginationDotActive: {
    backgroundColor: '#4F46E5',
    width: 16,
  },
  thumbnailGallery: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
  },
  thumbnailWrapper: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  thumbnailActive: {
    borderColor: '#4F46E5',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
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
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 32,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  currentPrice: {
    fontSize: 32,
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
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  writeReviewBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: 8,
  },
  writeReviewBtnText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '600',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starIcon: {
    marginRight: 2,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  sellerReplyCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  sellerReplyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  sellerReplyText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
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
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    minWidth: 90,
  },
  sizePillActive: {
    borderColor: '#9F2089',
    backgroundColor: '#FDF2F8',
  },
  sizePillText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  sizePillTextActive: {
    color: '#9F2089',
  },
  sizePillSubtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  sizePillSubtextActive: {
    color: '#9F2089',
  },
  colorPill: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  colorPillActive: {
    borderColor: '#9F2089',
    backgroundColor: '#FDF2F8',
  },
  colorPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  colorPillTextActive: {
    color: '#9F2089',
  },
  colorThumbnailWrapper: {
    width: 64,
    height: 80,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  colorThumbnailWrapperActive: {
    borderColor: '#9F2089',
    borderWidth: 2,
  },
  colorThumbnailImage: {
    width: '100%',
    height: '100%',
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
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cartBtnText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '800',
  },
  buyNowBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
  },
  buyNowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  deliveryCheckContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  deliveryCheckLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  deliveryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deliveryInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
  },
  deliveryInputIcon: {
    marginRight: 8,
  },
  deliveryInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  deliveryCheckButton: {
    backgroundColor: '#0F172A',
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  deliveryCheckButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  deliveryResultBox: {
    marginTop: 12,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  deliveryResultText: {
    fontSize: 14,
    color: '#064E3B',
  },
  deliveryResultBold: {
    fontWeight: '600',
  },
  deliveryResultCourier: {
    fontSize: 12,
    color: '#047857',
    marginTop: 4,
  },
  deliveryErrorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
    fontWeight: '500',
  },
});
