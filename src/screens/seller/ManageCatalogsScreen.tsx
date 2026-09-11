import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Search, CheckCircle, ShoppingBag, Sparkles, ArrowLeft } from 'lucide-react-native';
import { getProducts, wipeAllProducts } from '../../services/firebaseService';
import { Product, ClothSizeVariant } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getMeasurementInfo, getSizeVariantMeasurement } from '../../utils/productSizeUtils';
import { ProductEditModal } from '../../components/seller/ProductEditModal';

interface ManageCatalogsScreenProps {
  onBack?: () => void;
}

export const ManageCatalogsScreen: React.FC<ManageCatalogsScreenProps> = ({ onBack }) => {
  const { sellerProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadCatalogs = async () => {
    setIsLoading(true);
    try {
      const data = await getProducts(false, sellerProfile?.id);
      
      // Client-side isolation check (bulletproof fallback)
      const myProducts = data.filter(product => {
        if (!sellerProfile?.id) return false;
        return product.sellerId === sellerProfile.id;
      });
      
      setProducts(myProducts);
      if (myProducts.length > 0) {
        setSelectedProduct(myProducts[0]);
      }
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sellerProfile?.id) {
      loadCatalogs();
    }
  }, [sellerProfile?.id]);

  const handleWipeProducts = async () => {
    setIsLoading(true);
    await wipeAllProducts();
    setProducts([]);
    setIsLoading(false);
    alert('All products wiped from database!');
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.catalogId && p.catalogId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={{backgroundColor: '#DC2626', padding: 16, margin: 16, borderRadius: 8, alignItems: 'center'}} 
        onPress={handleWipeProducts}
      >
        <Text style={{color: 'white', fontWeight: '900', fontSize: 16}}>CLICK HERE TO WIPE DUMMY PRODUCTS FROM DATABASE</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.topHeader}>
        <View style={styles.titleContainer}>
          {onBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
              <ArrowLeft size={22} color="#0F172A" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>DigiSewa Catalog Manager</Text>
            <Text style={styles.subtitle}>Update stock per size, waist measurements, and pricing</Text>
          </View>
        </View>
        <View style={{flexDirection: 'row', gap: 8}}>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadCatalogs}>
            <Sparkles size={16} color="#9F2089" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Search size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by catalog ID, title, or category..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#9F2089" />
          <Text style={styles.loadingText}>Loading Seller Catalogs...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.contentContainer}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={styles.catalogCard}>
              <View style={styles.cardHeader}>
                <Image source={{ uri: product.imageUrl }} style={styles.catalogThumb} />
                <View style={styles.catalogMeta}>
                  <View style={styles.tagRow}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Text style={styles.catalogIdTag}>
                        {product.catalogId || `MSH-CAT-${product.id}`}
                      </Text>
                      {product.subcategory && (
                        <Text style={styles.subCatTag}>{product.subcategory}</Text>
                      )}
                    </View>
                    <TouchableOpacity 
                      onPress={() => setEditingProduct(product)}
                      style={{ padding: 4 }}
                    >
                      <Text style={{ color: '#9F2089', fontSize: 13, fontWeight: '600' }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.productTitle} numberOfLines={2}>
                    {product.title}
                  </Text>
                  <Text style={styles.priceText}>
                    Price: <Text style={styles.boldPrice}>₹{product.price}</Text>{' '}
                    {product.originalPrice && (
                      <Text style={styles.mrpText}>MRP ₹{product.originalPrice}</Text>
                    )}
                  </Text>
                </View>
              </View>

              {/* Specs Badge Bar */}
              {(product.fabric || product.pattern || product.fitType) && (
                <View style={styles.specsBar}>
                  {product.fabric && <Text style={styles.specChip}>Fabric: {product.fabric}</Text>}
                  {product.fitType && <Text style={styles.specChip}>Fit: {product.fitType}</Text>}
                  {product.color && <Text style={styles.specChip}>Color: {product.color}</Text>}
                </View>
              )}

              {/* Size & Stock Breakdown Table */}
              {product.sizes && product.sizes.length > 0 ? (
                (() => {
                  const measInfo = getMeasurementInfo(
                    product.category,
                    product.subcategory,
                    null,
                    null,
                    product.title,
                    product.tags
                  );
                  return (
                    <View style={styles.sizesBox}>
                      <View style={styles.sizesHeader}>
                        <Sparkles size={14} color="#9F2089" />
                        <Text style={styles.sizesTitle}>Size & Inch Breakdown</Text>
                      </View>
                      <View style={styles.sizePillsRow}>
                        {product.sizes.map((sz, sIdx) => {
                          const { val: measVal, label: measLabel } = getSizeVariantMeasurement(sz, measInfo);

                          return (
                            <View key={sIdx} style={styles.sizePillCard}>
                              <Text style={styles.sizeName}>{sz.size}</Text>
                              {sz.sku ? (
                                <Text style={[styles.inchDetail, { color: '#64748B', fontSize: 10 }]}>SKU: {sz.sku}</Text>
                              ) : null}
                              {measVal !== undefined && (
                                <Text style={styles.inchDetail}>{measLabel}: {measVal}"</Text>
                              )}
                              <Text style={styles.stockBadge}>Stock: {sz.stock}</Text>
                              <Text style={styles.sizePrice}>₹{sz.price}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })()
              ) : (
                <View style={styles.singleStockBox}>
                  <ShoppingBag size={14} color="#64748B" />
                  <Text style={styles.singleStockText}>
                    Standard Inventory: {product.stock} {product.unit}s available
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Edit Product Modal */}
      <ProductEditModal
        visible={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={(updatedProduct) => {
          setEditingProduct(null);
          // Update local state instantly to reflect the change
          setProducts((prev) => 
            prev.map((p) => p.id === updatedProduct.id ? updatedProduct : p)
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9F2089',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  loaderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  scrollBody: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 14,
  },
  catalogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  catalogThumb: {
    width: 70,
    height: 85,
    borderRadius: 8,
  },
  catalogMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catalogIdTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subCatTag: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 13,
    color: '#64748B',
  },
  boldPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  mrpText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  specsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  specChip: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sizesBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sizesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sizesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  sizePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizePillCard: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 70,
  },
  sizeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6366F1',
  },
  inchDetail: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
    marginTop: 1,
  },
  stockBadge: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  sizePrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  singleStockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  singleStockText: {
    fontSize: 12,
    color: '#64748B',
  },
});
