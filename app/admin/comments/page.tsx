'use client';

import { useState, useEffect } from 'react';
import { productsApi, ProductComment } from '@/api/products';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Search, Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CommentsAdminPage() {
  const [comments, setComments] = useState<ProductComment[]>([]);
  const [filteredComments, setFilteredComments] = useState<ProductComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingComments, setProcessingComments] = useState<Record<number, boolean>>({});

  // Fetch pending comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getPendingComments();
      setComments(data);
      setFilteredComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load pending comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // Filter comments as user types in search box
  useEffect(() => {
    if (searchTerm) {
      const filtered = comments.filter(
        (comment) =>
          comment.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comment.user_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredComments(filtered);
    } else {
      setFilteredComments(comments);
    }
  }, [searchTerm, comments]);

  // Handle comment approval
  const handleApproveComment = async (commentId: number) => {
    try {
      setProcessingComments((prev) => ({ ...prev, [commentId]: true }));
      await productsApi.approveComment(commentId);

      // Remove the approved comment from the list
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));

      toast.success('Comment approved successfully');
    } catch (error) {
      console.error('Error approving comment:', error);
      toast.error('Failed to approve comment');
    } finally {
      setProcessingComments((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading comments...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pending Comments</h1>

      <div className="mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search comments or users..."
            className="w-full pl-8 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredComments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium">No pending comments to approve</p>
            <p className="text-muted-foreground">All comments have been reviewed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredComments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">{comment.user_name}</CardTitle>
                    <CardDescription>
                      {format(new Date(comment.created_at), 'PP p')}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Product ID: {comment.product}</Badge>
                </div>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-wrap">{comment.comment}</p>
              </CardContent>

              <CardFooter className="flex justify-end gap-2">
                <Button
                  onClick={() => handleApproveComment(comment.id)}
                  disabled={processingComments[comment.id]}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingComments[comment.id] ? (
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
