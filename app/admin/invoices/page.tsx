'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Order, orderApi } from '@/api/order';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, subMonths, isAfter, isBefore, isEqual } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, Printer } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type ChartData = { date: string; revenue: number; profit: number };
type FilteredOrdersData = {
  totalRevenue: number;
  totalProfit: number;
  filteredOrders: Order[];
  chartData: ChartData[];
};

export default function InvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filters
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 3));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Invoice downloading
  const [downloadingInvoice, setDownloadingInvoice] = useState<number | null>(null);

  // Order filtering state
  const [filteredData, setFilteredData] = useState<FilteredOrdersData>({
    totalRevenue: 0,
    totalProfit: 0,
    filteredOrders: [],
    chartData: [],
  });

  // Handle authentication and authorization
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?callbackUrl=/admin/invoices');
        return;
      }

      if (user && user.user_type !== 'SALES_MANAGER') {
        router.push('/');
        toast.error('You do not have permission to access this page');
        return;
      }
    }
  }, [authLoading, isAuthenticated, router, user]);

  // Fetch all orders
  useEffect(() => {
    if (authLoading || !isAuthenticated || !user || user.user_type !== 'SALES_MANAGER') return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await orderApi.getOrders();
        setOrders(data.results);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [authLoading, isAuthenticated, user]);

  // Filter orders and calculate metrics when date range or orders change
  useEffect(() => {
    filterOrdersByDateRange();
  }, [orders, startDate, endDate]);

  const filterOrdersByDateRange = () => {
    // Filter orders based on date range
    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return (
        (isAfter(orderDate, startDate) || isEqual(orderDate, startDate)) &&
        (isBefore(orderDate, endDate) || isEqual(orderDate, endDate))
      );
    });

    // Calculate daily revenue and profit data for the chart
    const dailyData: Record<string, { revenue: number; profit: number }> = {};
    let totalRevenue = 0;
    let totalProfit = 0;

    filteredOrders.forEach((order) => {
      // Skip cancelled orders
      if (order.status === 'CANCELLED') return;

      const dateKey = order.created_at.substring(0, 10); // YYYY-MM-DD

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { revenue: 0, profit: 0 };
      }

      // Parse total_amount safely
      const totalAmount =
        typeof order.total_amount === 'string'
          ? parseFloat(order.total_amount)
          : Number(order.total_amount);

      if (!isNaN(totalAmount)) {
        totalRevenue += totalAmount;
        // Use the actual cost_price from the order
        const orderCost =
          typeof order.cost_price === 'string'
            ? parseFloat(order.cost_price)
            : Number(order.cost_price);

        const profit = totalAmount - orderCost;
        totalProfit += profit;

        dailyData[dateKey].revenue += totalAmount;
        dailyData[dateKey].profit += profit;
      }
    });

    // Convert to chart data array and sort by date
    const chartData = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        revenue: Number(data.revenue.toFixed(2)),
        profit: Number(data.profit.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setFilteredData({
      totalRevenue,
      totalProfit,
      filteredOrders,
      chartData,
    });
  };

  const handleDownloadInvoice = async (orderId: number) => {
    setDownloadingInvoice(orderId);
    try {
      const blob = await orderApi.downloadOrderInvoice(orderId);

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_order_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success('Invoice downloaded successfully');
    } catch (err) {
      toast.error('Failed to download invoice');
      console.error(err);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handlePrintInvoice = async (orderId: number) => {
    setDownloadingInvoice(orderId);
    try {
      const blob = await orderApi.downloadOrderInvoice(orderId);

      // Create a blob URL and open in a new window for printing
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url);

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        toast.error('Pop-up blocked. Please allow pop-ups to print invoices.');
      }

      // Clean up after delay to allow printing
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      toast.error('Failed to print invoice');
      console.error(err);
    } finally {
      setDownloadingInvoice(null);
    }
  };
  // Format currency values with safety against NaN
  const formatCurrency = (amount: number) => {
    // Guard against NaN or undefined values
    if (isNaN(amount) || amount === undefined) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
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
      <h1 className="text-3xl font-bold mb-6">Invoice Management</h1>

      {/* Date Range Filter */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
          <CardDescription>
            Select a date range to filter invoices and view financial metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <div className="flex gap-2">
                <Popover open={showStartDatePicker} onOpenChange={setShowStartDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(date);
                          setShowStartDatePicker(false);
                        }
                      }}
                      disabled={(date) => isAfter(date, endDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <div className="flex gap-2">
                <Popover open={showEndDatePicker} onOpenChange={setShowEndDatePicker}>
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        if (date) {
                          setEndDate(date);
                          setShowEndDatePicker(false);
                        }
                      }}
                      disabled={(date) => isBefore(date, startDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>
              For selected period: {format(startDate, 'MMM d, yyyy')} -{' '}
              {format(endDate, 'MMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(filteredData.totalRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Profit</CardTitle>
            <CardDescription>
              For selected period: {format(startDate, 'MMM d, yyyy')} -{' '}
              {format(endDate, 'MMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(filteredData.totalProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredData.chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line
                  name="Revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#a855f7"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredData.chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line name="Profit" type="monotone" dataKey="profit" stroke="#c084fc" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            All invoices for the selected date range. You can download or print individual invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredData.filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-2 text-lg font-semibold">No invoices found</p>
              <p className="text-muted-foreground">
                Try adjusting your date range to see more results
              </p>
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
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{order.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.status}</Badge>
                      </TableCell>{' '}
                      <TableCell className="text-right">
                        {formatCurrency(
                          typeof order.total_amount === 'string'
                            ? parseFloat(order.total_amount)
                            : Number(order.total_amount)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadInvoice(order.id)}
                            disabled={downloadingInvoice === order.id}
                          >
                            {downloadingInvoice === order.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePrintInvoice(order.id)}
                            disabled={downloadingInvoice === order.id}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
