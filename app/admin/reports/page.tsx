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
import { toast } from 'sonner';

type ChartData = { month: string; revenue: number; profit: number };

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle authentication and authorization
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?callbackUrl=/admin/reports');
        return;
      }

      if (user && user.user_type !== 'SALES_MANAGER') {
        router.push('/');
        toast.error('You do not have permission to access this page');
        return;
      }
    }
  }, [authLoading, isAuthenticated, router, user]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user || user.user_type !== 'SALES_MANAGER') return;

    async function load() {
      try {
        // Use the proper API method from orderApi instead of fetch
        const { results } = await orderApi.getOrders();

        const agg: Record<string, { revenue: number; cost: number }> = {};

        // Process all orders (not just DELIVERED)
        results.forEach((order: Order) => {
          // Extract month and year from the order date
          const m = order.created_at.slice(0, 7); // YYYY-MM
          if (!agg[m]) agg[m] = { revenue: 0, cost: 0 };

          // Parse total_amount safely
          const totalAmount =
            typeof order.total_amount === 'string'
              ? parseFloat(order.total_amount)
              : Number(order.total_amount);

          // Only count revenue from non-cancelled orders
          if (order.status !== 'CANCELLED') {
            // Add to revenue
            if (!isNaN(totalAmount)) {
              agg[m].revenue += totalAmount;
            }
            // Use the actual cost_price from the order
            const orderCost =
              typeof order.cost_price === 'string'
                ? parseFloat(order.cost_price)
                : Number(order.cost_price);

            agg[m].cost += orderCost;
          }
        });

        const chart = Object.entries(agg)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, { revenue, cost }]) => {
            // Ensure we're working with valid numbers
            const safeRevenue = typeof revenue === 'number' ? revenue : 0;
            const safeCost = typeof cost === 'number' ? cost : 0;
            const safeProfit = safeRevenue - safeCost;

            return {
              month,
              revenue: Number(safeRevenue.toFixed(2)),
              profit: Number(safeProfit.toFixed(2)),
            };
          });

        setData(chart);
        setError(null);
      } catch (e) {
        console.error(e);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authLoading, isAuthenticated, user]);

  // Format currency values
  const formatCurrency = (value: number) => {
    // Guard against NaN or undefined values
    if (isNaN(value) || value === undefined) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  // Helper function to safely calculate total and avoid NaN
  const safeSum = (items: ChartData[], key: keyof Pick<ChartData, 'revenue' | 'profit'>) => {
    return items.reduce((sum, item) => {
      const value = Number(item[key]);
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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
      <h1 className="text-3xl font-bold mb-6">Financial Reports</h1>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Overview of revenue across all months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line
                  name="Revenue"
                  type="monotone"
                  dataKey="revenue"
                  dot={false}
                  stroke="#a855f7"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Profit & Loss</CardTitle>
            <CardDescription>Overview of profit across all months</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line name="Profit" type="monotone" dataKey="profit" dot={false} stroke="#c084fc" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Overview of all financial metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Month</th>
                    <th className="text-right p-3 font-medium">Revenue</th>
                    <th className="text-right p-3 font-medium">Profit</th>
                    <th className="text-right p-3 font-medium">Profit Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => {
                    const revenue = isNaN(Number(item.revenue)) ? 0 : Number(item.revenue);
                    const profit = isNaN(Number(item.profit)) ? 0 : Number(item.profit);
                    return (
                      <tr key={item.month} className="border-b">
                        <td className="p-3">{item.month}</td>
                        <td className="p-3 text-right">{formatCurrency(revenue)}</td>
                        <td className="p-3 text-right">{formatCurrency(profit)}</td>
                        <td className="p-3 text-right">
                          {revenue > 0 ? `${((profit / revenue) * 100).toFixed(1)}%` : '0.0%'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="font-semibold">
                    <td className="p-3">Total</td>
                    <td className="p-3 text-right">{formatCurrency(safeSum(data, 'revenue'))}</td>
                    <td className="p-3 text-right">{formatCurrency(safeSum(data, 'profit'))}</td>
                    <td className="p-3 text-right">
                      {(() => {
                        const totalRevenue = safeSum(data, 'revenue');
                        const totalProfit = safeSum(data, 'profit');
                        return totalRevenue > 0
                          ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%`
                          : '0.0%';
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
