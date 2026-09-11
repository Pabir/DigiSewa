import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Heart, ArrowLeft } from 'lucide-react-native';
import { useWishlist } from '../../context/WishlistContext';
import { ProductCard } from '../../components/ProductCard';
import { Product } from '../../types';

interface WishlistScreenProps {
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
}

export const WishlistScreen: React.FC<WishlistScreenProps> = ({ onSelectProduct, onBack }) => {
  const { items } = useWishlist();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const getCardColumnStyle = () => {
    if (width >= 1024) return { width: '25%' as const, paddingHorizontal: 8 };
    if (width >= 768) return { width: '33.33%' as const, paddingHorizontal: 8 };
    if (width >= 540) return { width: '50%' as const, paddingHorizontal: 6 };
    return { width: '50%' as const, paddingHorizontal: 6 };
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Heart size={64} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptyText}>
        Looks like you haven't saved any items yet. Start exploring and save your favorites here!
      </Text>
      <TouchableOpacity style={styles.exploreButton} onPress={onBack}>
        <Text style={styles.exploreButtonText}>Explore Products</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist ({items?.length || 0})</Text>
      </View>

      {!items || items.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.gridContainer, isDesktop && styles.gridContainerDesktop]}>
            {items.map((item, index) => {
              if (!item) return null;
              return (
                <View key={item.id || `wishlist-item-${index}`} style={getCardColumnStyle()}>
                  <View style={{ position: 'relative' }}>
                    <ProductCard product={item} onPress={() => onSelectProduct(item)} isWishlistView={true} />
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  scrollArea: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridContainerDesktop: {
    marginHorizontal: -8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  exploreButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
