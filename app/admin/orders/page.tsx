'use client';

import { useState, useEffect, useCallback } from 'react';
import { orderApi, Order } from '@/api/order';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Eye, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';

// Constant for page size
const PAGE_SIZE = 10;

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [count, setCount] = useState(0);
  const [downloadingInvoice, setDownloadingInvoice] = useState<number | null>(null);
  const { user } = useAuth();

  const fetchOrders = useCallback(async (url?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getOrders(url);
      setOrders(data.results);
      setCount(data.count);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);

      // Calculate current page from URL or set to 1 if no previous link
      let calculatedPage = 1;
      if (data.previous) {
        const prevMatch = data.previous.match(/page=(\d+)/);
        if (prevMatch) {
          calculatedPage = parseInt(prevMatch[1]) + 1;
        } else {
          calculatedPage = 2;
        }
      }
      setCurrentPage(calculatedPage);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const handleDownloadInvoice = async (orderId: number) => {
    setDownloadingInvoice(orderId);
    try {
      const blob = await orderApi.downloadOrderInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order_${orderId}_invoice.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      console.error('Error downloading invoice:', err);
      toast.error('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingInvoice(null);
    }
  };

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
  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center my-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <div>
          {user?.user_type === 'SALES_MANAGER' && (
            <Button variant="outline" asChild>
              <Link href="/admin/orders/reports">Sales Reports</Link>
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-destructive font-medium">{error}</p>
              <Button onClick={() => fetchOrders()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{order.username}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${Number(order.total_amount).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadInvoice(order.id)}
                              disabled={downloadingInvoice === order.id}
                            >
                              {downloadingInvoice === order.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              <span className="sr-only">Download</span>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {count > PAGE_SIZE && (
              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={!prevPageUrl || loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={!nextPageUrl || loading}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
