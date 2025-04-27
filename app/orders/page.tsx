'use client';

import { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi, Order } from '@/api/order'; // Order interface is already imported
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react'; // Import ArrowLeft

// Define page size (adjust if your backend uses a different size)
const PAGE_SIZE = 10;

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Pagination state
  const [count, setCount] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // Track current page number

  // Fetch orders function with pagination support
  const fetchOrders = useCallback(
    async (url?: string) => {
      if (!isAuthenticated) {
        router.push('/login?callbackUrl=/orders');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await orderApi.getOrders(url); // Call API with optional URL
        setOrders(data.results);
        setCount(data.count);
        setNextPageUrl(data.next);
        setPrevPageUrl(data.previous);

        // Refined current page calculation
        let calculatedPage = 1;
        if (data.previous) {
          const prevMatch = data.previous.match(/page=(\d+)/);
          if (prevMatch) {
            // If previous URL has page number, current page is that number + 1
            calculatedPage = parseInt(prevMatch[1]) + 1;
          } else {
            // If previous URL exists but has no page number (e.g., base URL from page 2), assume page 2
            calculatedPage = 2;
          }
        } else {
          // No previous link, must be page 1
          calculatedPage = 1;
        }
        // Validate against total pages
        const totalPages = Math.ceil(data.count / PAGE_SIZE);
        calculatedPage = Math.min(calculatedPage, totalPages > 0 ? totalPages : 1); // Ensure it doesn't exceed total pages
        calculatedPage = Math.max(1, calculatedPage); // Ensure it's at least 1
        setCurrentPage(calculatedPage);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, router]
  ); // Add dependencies

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // Use fetchOrders as dependency

  // Handlers for pagination buttons
  const handleNextPage = () => {
    if (nextPageUrl) {
      fetchOrders(nextPageUrl);
    }
  };

  const handlePrevPage = () => {
    if (prevPageUrl) {
      fetchOrders(prevPageUrl);
    }
  };

  // ... getStatusBadgeVariant function remains the same ...
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

  // Loading state
  if (loading) {
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
        <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>
          Go Back Home
        </Button>
      </div>
    );
  }

  // Calculate total pages using PAGE_SIZE
  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Your Orders</h1>

      {orders.length === 0 && !loading ? ( // Check loading state as well
        <Card className="text-center py-8 px-4">
          <CardContent className="flex flex-col items-center">
            <ShoppingBag className="h-16 w-16 text-medium-gray mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to place your first order</p>
            <Button
              className="bg-primary text-background hover:bg-primary/90 hover:scale-105 transition-all duration-200"
              asChild
            >
              <Link href="/products">
                Explore Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="border-b border-medium-gray bg-muted/30">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div>
                      <CardTitle>Order #{order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                      <span className="font-bold">${order.total_amount}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Items</h3>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="text-sm px-3 py-1 bg-background border rounded-md"
                        >
                          {item.product_name} × {item.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                    </p>
                    <Button asChild>
                      <Link href={`/orders/${order.id}`}>
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {count > PAGE_SIZE && ( // Show pagination only if count > page size
            <div className="flex justify-between items-center mt-8">
              <Button variant="outline" onClick={handlePrevPage} disabled={!prevPageUrl || loading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {/* Display calculated total pages */}
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" onClick={handleNextPage} disabled={!nextPageUrl || loading}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
