'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { refundApi, RefundRequest } from '@/api/refund';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ManageRefundsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRefundId, setSelectedRefundId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Handle authentication and authorization
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?callbackUrl=/admin/refunds');
        return;
      }

      if (user && user.user_type !== 'SALES_MANAGER') {
        router.push('/');
        toast.error('You do not have permission to access this page');
        return;
      }
    }
  }, [authLoading, isAuthenticated, router, user]);

  // Fetch pending refund requests
  useEffect(() => {
    if (authLoading || !isAuthenticated || !user || user.user_type !== 'SALES_MANAGER') return;

    const fetchRefunds = async () => {
      setLoading(true);
      try {
        const data = await refundApi.getPendingRefunds();
        setRefundRequests(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching refund requests:', err);
        setError('Failed to load refund requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRefunds();
  }, [authLoading, isAuthenticated, user]);

  const handleApproveRefund = async (id: number) => {
    if (!confirm('Are you sure you want to approve this refund request?')) {
      return;
    }

    setProcessingId(id);
    try {
      await refundApi.approveRefundRequest(id);
      // Remove the approved refund from the list
      setRefundRequests(refundRequests.filter((refund) => refund.id !== id));
      toast.success('Refund request approved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve refund request';
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRefund = async () => {
    if (!selectedRefundId || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessingId(selectedRefundId);
    try {
      await refundApi.rejectRefundRequest(selectedRefundId, rejectionReason);
      // Remove the rejected refund from the list
      setRefundRequests(refundRequests.filter((refund) => refund.id !== selectedRefundId));
      toast.success('Refund request rejected successfully');
      setRejectDialogOpen(false);
      setRejectionReason('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject refund request';
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || (user && user.user_type !== 'SALES_MANAGER')) {
    return null; // Don't render anything - redirect handled in useEffect
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-error/10 rounded-lg text-error text-center">
        <p className="font-medium">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin')}>
          Go to Admin Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Manage Refund Requests</h1>

      {refundRequests.length === 0 ? (
        <Card className="text-center py-8 px-4">
          <CardContent className="flex flex-col items-center">
            <RefreshCw className="h-16 w-16 text-medium-gray mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No pending refund requests
            </h2>
            <p className="text-muted-foreground mb-6">
              There are no refund requests that need your attention.
            </p>
            <Button
              className="bg-primary text-background hover:bg-primary/90"
              onClick={() => router.push('/admin')}
            >
              Back to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {refundRequests.map((refund) => (
            <Card key={refund.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Order #{refund.order_id}</CardTitle>
                    <CardDescription>Requested on {formatDate(refund.created_at)}</CardDescription>
                  </div>
                  <Badge variant="secondary">PENDING</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div>
                  <p className="font-medium">{refund.product_name}</p>
                  <p className="text-sm text-muted-foreground mb-2">Customer: {refund.username}</p>
                  <p className="text-sm text-muted-foreground mb-3">Reason: {refund.reason}</p>

                  <div className="flex space-x-2 mt-3">
                    <Button
                      className="flex-1"
                      size="sm"
                      onClick={() => handleApproveRefund(refund.id)}
                      disabled={processingId === refund.id}
                    >
                      {processingId === refund.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedRefundId(refund.id);
                        setRejectDialogOpen(true);
                      }}
                      disabled={processingId === refund.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Refund Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this refund request. This will be shown to the
              customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this refund request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason('');
              }}
              disabled={processingId === selectedRefundId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectRefund}
              disabled={!rejectionReason.trim() || processingId === selectedRefundId}
            >
              {processingId === selectedRefundId ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Rejecting...
                </>
              ) : (
                'Reject Refund'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
