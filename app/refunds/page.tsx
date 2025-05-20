'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { refundApi, RefundRequest } from '@/api/refund';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export default function MyRefundsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/refunds');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch refund requests
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const fetchRefunds = async () => {
      setLoading(true);
      try {
        const data = await refundApi.getMyRefunds();
        setRefundRequests(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching refund requests:', err);
        setError('Failed to load your refund requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRefunds();
  }, [authLoading, isAuthenticated]);

  const handleCancelRefund = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this refund request?')) {
      return;
    }

    setCancelling(id);
    try {
      await refundApi.cancelRefundRequest(id);
      // Remove the cancelled refund from the list
      setRefundRequests(refundRequests.filter((refund) => refund.id !== id));
      toast.success('Refund request cancelled successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel refund request';
      toast.error(errorMessage);
    } finally {
      setCancelling(null);
    }
  };

  // Helper function to get badge variant based on status
  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'PENDING':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-error/10 rounded-lg text-error text-center">
        <p className="font-medium">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">My Refund Requests</h1>

      {refundRequests.length === 0 ? (
        <Card className="text-center py-8 px-4">
          <CardContent className="flex flex-col items-center">
            <RefreshCw className="h-16 w-16 text-medium-gray mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No refund requests</h2>
            <p className="text-muted-foreground mb-6">
              You haven&apos;t made any refund requests yet.
            </p>
            <Button
              className="bg-primary text-background hover:bg-primary/90"
              onClick={() => router.push('/orders')}
            >
              View Your Orders
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
                  <Badge variant={getStatusBadgeVariant(refund.status)}>{refund.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div>
                  <p className="font-medium">{refund.product_name}</p>
                  <p className="text-sm text-muted-foreground mb-3">Reason: {refund.reason}</p>

                  {refund.status === 'APPROVED' && (
                    <div className="mt-2 p-2 bg-green-50 text-green-800 rounded-md text-sm">
                      <p>
                        <span className="font-semibold">Approved by:</span>{' '}
                        {refund.approved_by_name}
                      </p>
                      <p>
                        <span className="font-semibold">Date:</span>{' '}
                        {formatDate(refund.approval_date as string)}
                      </p>
                    </div>
                  )}

                  {refund.status === 'REJECTED' && (
                    <div className="mt-2 p-2 bg-red-50 text-red-800 rounded-md text-sm">
                      <p>
                        <span className="font-semibold">Rejection reason:</span>{' '}
                        {refund.rejection_reason}
                      </p>
                      <p>
                        <span className="font-semibold">Date:</span>{' '}
                        {formatDate(refund.approval_date as string)}
                      </p>
                    </div>
                  )}

                  {refund.status === 'PENDING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleCancelRefund(refund.id)}
                      disabled={cancelling === refund.id}
                    >
                      {cancelling === refund.id ? (
                        <>
                          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"></div>
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Request'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
