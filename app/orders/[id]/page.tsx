'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi, Order } from '@/api/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ArrowLeft, Download } from 'lucide-react'; // Import Download icon
import { toast } from 'sonner';

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(false); // State for download button
  const [pageReady, setPageReady] = useState(false);

  // Get the API base URL for constructing full image URLs
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Handle authentication redirect in useEffect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/orders');
      return;
    }

    if (!authLoading) {
      setPageReady(true);
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch order details
  useEffect(() => {
    // Only fetch data if user is authenticated and page is ready
    if (!pageReady) return;

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const orderId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);
        const data = await orderApi.getOrder(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, pageReady]);

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!order) return;

    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancelling(true);
    try {
      await orderApi.cancelOrder(order.id);
      // Refresh the order details
      const updatedOrder = await orderApi.getOrder(order.id);
      setOrder(updatedOrder);
      toast.success('Order cancelled successfully');
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  // Handle invoice download
  const handleDownloadInvoice = async () => {
    if (!order) return;

    setDownloading(true);
    try {
      const blob = await orderApi.downloadOrderInvoice(order.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order_${order.id}_invoice.pdf`); // Set filename
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link); // Clean up
      window.URL.revokeObjectURL(url); // Free up memory
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      console.error('Error downloading invoice:', err);
      toast.error('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Show loading state until page is ready
  if (!pageReady || authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-error/10 rounded-lg text-error text-center">
        <p className="font-medium">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/orders')}>
          Go Back to Orders
        </Button>
      </div>
    );
  }

  // Order not found
  if (!order) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Order Details</h1>
        <Card className="text-center py-8 px-4">
          <CardContent className="flex flex-col items-center">
            <ShoppingBag className="h-16 w-16 text-medium-gray mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Order not found</h2>
            <p className="text-muted-foreground mb-6">
              The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission
              to view it
            </p>
            <Button
              className="bg-primary text-background hover:bg-primary/90 hover:scale-105 transition-all duration-200"
              asChild
            >
              <Link href="/orders">View All Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper function to get badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'default';
      case 'IN_TRANSIT':
        return 'secondary';
      case 'PROCESSING':
        return 'outline';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Order #{order.id}</h1>
        <Button variant="outline" asChild>
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Order details */}
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader className="border-b border-medium-gray">
              <div className="flex justify-between items-center">
                <CardTitle>Order Items</CardTitle>
                <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-0 py-0">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center py-4 px-6 border-b border-medium-gray last:border-0"
                >
                  <div className="h-16 w-16 relative mr-4 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                    <Image
                      src={`${apiBaseUrl}/api/products/${item.product}/image/`}
                      alt={item.product_name}
                      fill
                      sizes="64px"
                      className="object-cover"
                      onError={() => {}}
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.product_name}</p>
                    <p className="text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${item.price_at_time}</p>
                    <p className="text-muted-foreground text-sm">
                      Subtotal: ${(item.price_at_time * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-medium-gray">
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="whitespace-pre-line text-foreground">{order.shipping_address}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Order summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader className="border-b border-medium-gray">
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Order Date</span>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Last Updated</span>
                  <span>{new Date(order.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${Number(order.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-medium-gray my-2 pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {/* Download Invoice Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownloadInvoice}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice
                  </>
                )}
              </Button>

              {/* Cancel Order Button */}
              {order.status === 'PROCESSING' && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Order'
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
