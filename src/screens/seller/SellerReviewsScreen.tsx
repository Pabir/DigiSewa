import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Star, MessageSquare } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { ProductReview } from '../../types';
import { getSellerReviews, addSellerReply } from '../../services/reviewService';

export const SellerReviewsScreen: React.FC = () => {
  const { sellerProfile } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadReviews();
  }, [sellerProfile]);

  const loadReviews = async () => {
    if (!sellerProfile) return;
    setLoading(true);
    try {
      const data = await getSellerReviews(sellerProfile.id);
      setReviews(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) return;
    
    try {
      await addSellerReply(reviewId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
      await loadReviews();
      Alert.alert('Success', 'Your reply has been posted.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not post reply. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customer Reviews</Text>
        <Text style={styles.subtitle}>Manage and reply to reviews for your products</Text>
      </View>

      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageSquare size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No reviews yet.</Text>
        </View>
      ) : (
        reviews.map(review => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View>
                <Text style={styles.reviewerName}>{review.userName}</Text>
                <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    color={review.rating >= star ? '#FFB800' : '#E5E7EB'}
                    fill={review.rating >= star ? '#FFB800' : 'transparent'}
                  />
                ))}
              </View>
            </View>

            {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
            <Text style={styles.reviewComment}>{review.comment}</Text>

            {/* Seller Reply Section */}
            {review.sellerReply ? (
              <View style={styles.sellerReplyCard}>
                <Text style={styles.sellerReplyLabel}>Your Reply:</Text>
                <Text style={styles.sellerReplyText}>{review.sellerReply}</Text>
              </View>
            ) : (
              <View style={styles.replyActionContainer}>
                {replyingTo === review.id ? (
                  <View style={styles.replyForm}>
                    <TextInput
                      style={styles.replyInput}
                      placeholder="Write your reply..."
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                    />
                    <View style={styles.replyFormActions}>
                      <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleReplySubmit(review.id)} 
                        style={[styles.submitBtn, !replyText.trim() && styles.submitBtnDisabled]}
                        disabled={!replyText.trim()}
                      >
                        <Text style={styles.submitBtnText}>Post Reply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => setReplyingTo(review.id)} style={styles.replyBtn}>
                    <MessageSquare size={16} color="#4F46E5" />
                    <Text style={styles.replyBtnText}>Reply to Customer</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  reviewCard: {
    backgroundColor: '#FFF',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  reviewComment: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  sellerReplyCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F3FF',
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
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  replyActionContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyBtnText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  replyForm: {
    marginTop: 8,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
  },
  replyFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#A5B4FC',
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
