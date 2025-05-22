'use client';

import { useState, useEffect } from 'react';
import { orderApi, Order } from '@/api/order';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Truck, Clipboard, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DeliveryManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: '',
    delivery_notes: '',
  });
  const [downloadingInvoice, setDownloadingInvoice] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  // Redirect if not a product manager
  useEffect(() => {
    if (user && user.user_type !== 'PRODUCT_MANAGER' && !user.is_staff) {
      toast.error('Only product managers can access this page');
      // Consider redirecting here
    }
  }, [user]);

  const fetchPendingDeliveries = async () => {
    setLoading(true);
    try {
      // This endpoint will get all pending deliveries (status=IN_TRANSIT or PROCESSING)
      const data = await orderApi.getPendingDeliveries();
      setOrders(data.results || data);
    } catch (error) {
      console.error('Error fetching pending deliveries:', error);
      toast.error('Failed to load pending deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDeliveries();
  }, []);

  // Filter orders based on search term
  const filteredOrders = searchTerm
    ? orders.filter(
        (order) =>
          order.id.toString().includes(searchTerm) ||
          order.shipping_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.status.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : orders;

  const handleOpenStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setStatusUpdateForm({
      status: order.status,
      delivery_notes: '',
    });
    setOpenDialog(true);
  };

  const handleStatusInputChange = (field: string, value: string) => {
    setStatusUpdateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await orderApi.updateDeliveryStatus(selectedOrder.id, statusUpdateForm);
      toast.success('Delivery status updated successfully');
      setOpenDialog(false);
      fetchPendingDeliveries();
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('Failed to update delivery status');
    }
  };

  const handleApproveOrder = async (orderId: number) => {
    try {
      await orderApi.approveOrder(orderId);
      toast.success('Order approved for delivery');
      fetchPendingDeliveries();
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error('Failed to approve order');
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
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Delivery Management</CardTitle>
          <CardDescription>Track and manage product deliveries</CardDescription>

          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders by ID, address or status"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Delivery Address</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.status === 'DELIVERED'
                            ? 'bg-green-500'
                            : order.status === 'IN_TRANSIT'
                              ? 'bg-blue-500'
                              : order.status === 'PROCESSING'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.username}</TableCell>
                    <TableCell className="max-w-xs truncate">{order.shipping_address}</TableCell>
                    <TableCell>${Number(order.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadInvoice(order.id)}
                          disabled={!!downloadingInvoice}
                        >
                          {downloadingInvoice === order.id ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>

                        <Link href={`/admin/orders/${order.id}`}>
                          <Button size="sm" variant="outline">
                            <Clipboard className="h-4 w-4" />
                          </Button>
                        </Link>

                        {order.status === 'PROCESSING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleApproveOrder(order.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          onClick={() => handleOpenStatusDialog(order)}
                        >
                          <Truck className="h-4 w-4 mr-1" /> Update Status
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {searchTerm
                      ? 'No orders match your search criteria.'
                      : 'No pending deliveries at the moment.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Status</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusUpdateForm.status}
                onValueChange={(value) => handleStatusInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_notes">Delivery Notes</Label>
              <Textarea
                id="delivery_notes"
                value={statusUpdateForm.delivery_notes}
                onChange={(e) => handleStatusInputChange('delivery_notes', e.target.value)}
                placeholder="Add any notes about this delivery..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Update Status</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
