'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Rating } from '@/components/ui/rating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { productsApi } from '@/api/products';
import { AlertCircle } from 'lucide-react';

interface ReviewSectionProps {
  productId: number;
  currentRating: number;
  refreshProduct: () => void;
}

interface Comment {
  id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

export default function ReviewSection({
  productId,
  currentRating,
  refreshProduct,
}: ReviewSectionProps) {
  const { isAuthenticated } = useAuth();
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [canReview, setCanReview] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Check if user can review
        if (isAuthenticated) {
          const response = await fetch(`${apiBaseUrl}/api/products/${productId}/can-review/`, {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            setCanReview(data.can_review);
          }
        }

        // Load comments - use the correct endpoint
        const commentsResponse = await fetch(`${apiBaseUrl}/api/products/${productId}/comments/`, {
          credentials: 'include',
        });

        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          setComments(Array.isArray(commentsData) ? commentsData : []);
        }
      } catch (err) {
        console.error('Error loading review data:', err);
        setError('Failed to load review data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId, isAuthenticated, apiBaseUrl]);

  const handleRateProduct = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to rate products');
      return;
    }

    if (!canReview) {
      toast.error('You can only rate products you have purchased and received');
      return;
    }

    setIsSubmitting(true);
    try {
      await productsApi.rateProduct(productId, userRating);
      toast.success('Rating submitted successfully!');
      refreshProduct(); // Refresh product data to show updated rating
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit rating';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      return;
    }

    if (!canReview) {
      toast.error('You can only comment on products you have purchased and received');
      return;
    }

    if (!userComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      await productsApi.commentProduct(productId, userComment);
      toast.success('Comment submitted successfully! It will be visible after approval.');
      setUserComment(''); // Clear the comment field after submission
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit comment';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/10 text-error p-4 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Rating value={currentRating} readOnly size="lg" />
        <span className="text-lg font-medium">
          {currentRating ? currentRating.toFixed(1) : 'No ratings'}
        </span>
      </div>

      {canReview ? (
        <div className="bg-muted p-4 rounded-md space-y-4">
          <h3 className="font-semibold text-lg">Rate & Review This Product</h3>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Your rating:</p>
            <Rating value={userRating} onChange={setUserRating} size="lg" />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Your comment:</p>
            <Textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Share your experience with this product..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleRateProduct} disabled={isSubmitting || userRating === 0}>
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
            <Button
              variant="outline"
              onClick={handleSubmitComment}
              disabled={isSubmitting || !userComment.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Comment'}
            </Button>
          </div>
        </div>
      ) : isAuthenticated ? (
        <div className="bg-muted p-4 rounded-md">
          <p className="text-muted-foreground">
            You can only rate and review products you have purchased and received.
          </p>
        </div>
      ) : (
        <div className="bg-muted p-4 rounded-md">
          <p className="text-muted-foreground">Please log in to rate and review this product.</p>
        </div>
      )}

      <div className="mt-8">
        <h3 className="font-semibold text-lg mb-4">Customer Reviews</h3>

        {comments.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b pb-4 last:border-0">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{comment.user_name}</span>
                  <span className="text-muted-foreground text-sm">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p>{comment.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
