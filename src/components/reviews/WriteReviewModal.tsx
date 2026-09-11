import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { X, Star } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { addProductReview } from '../../services/reviewService';

interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  productId: string;
  sellerId: string;
  productTitle: string;
  onReviewSubmitted: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({ visible, onClose, productId, sellerId, productTitle, onReviewSubmitted }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!visible) return null;

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to leave a review.');
      return;
    }
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a review comment.');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      await addProductReview({
        productId,
        sellerId,
        userId: user.id,
        userName: user.name || 'DigiSewa Customer',
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      setIsLoading(false);
      onReviewSubmitted();
      onClose();
    } catch (e) {
      console.error(e);
      setError('Failed to submit review. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={Keyboard.dismiss} activeOpacity={1} />
        <View style={styles.modalContainer}>
          <View style={styles.header}>
              <Text style={styles.headerTitle}>Write a Review</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <Text style={styles.productTitle}>For: {productTitle}</Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Text style={styles.label}>Overall Rating *</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Star
                      size={40}
                      color={rating >= star ? '#FFB800' : '#E5E7EB'}
                      fill={rating >= star ? '#FFB800' : 'transparent'}
                      style={styles.starIcon}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Review Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Summarize your experience (optional)"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />

              <Text style={styles.label}>Review Detail *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What did you like or dislike? What should other shoppers know?"
                placeholderTextColor="#9ca3af"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />

              <TouchableOpacity 
                style={[styles.submitBtn, isLoading || rating === 0 || !comment.trim() ? styles.submitBtnDisabled : {}]} 
                onPress={handleSubmit} 
                disabled={isLoading || rating === 0 || !comment.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  productTitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  starIcon: {
    marginRight: 10,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 10,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#FF6B00',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  submitBtnDisabled: {
    backgroundColor: '#A5B4FC',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
