'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  MessageCircle,
  RefreshCcw,
  Clock,
  DollarSign,
  BarChart,
} from 'lucide-react';
import { productsApi } from '@/api/products';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
  lowStockProducts: number;
  pendingComments: number;
  pendingDeliveries: number;
  pendingRefunds: number;
  recentSales: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    revenue: 0,
    lowStockProducts: 0,
    pendingComments: 0,
    pendingDeliveries: 0,
    pendingRefunds: 0,
    recentSales: {
      daily: 0,
      weekly: 0,
      monthly: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, you would fetch this data from an API
        // For now, let's just get the product count from the existing API
        const products = await productsApi.getAdminProducts();

        setStats({
          totalProducts: products.length,
          totalOrders: 128, // Placeholder
          totalUsers: 45, // Placeholder
          revenue: 15680, // Placeholder
          lowStockProducts: products.filter((p) => p.stock_quantity < 10).length,
          pendingComments: 8, // Placeholder
          pendingDeliveries: 12, // Placeholder
          pendingRefunds: 3, // Placeholder
          recentSales: {
            daily: 1250, // Placeholder
            weekly: 7680, // Placeholder
            monthly: 32450, // Placeholder
          },
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userRole = user?.user_type || (user?.is_staff ? 'ADMIN' : '');
  const isProductManager = userRole === 'PRODUCT_MANAGER' || userRole === 'ADMIN';
  const isSalesManager = userRole === 'SALES_MANAGER' || userRole === 'ADMIN';

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
      <p className="text-muted-foreground mb-8">Welcome to your personalized admin dashboard</p>

      {/* Common stats for both user types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<Package className="h-8 w-8" />}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingBag className="h-8 w-8" />}
        />
        {isProductManager && (
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="h-8 w-8" />}
          />
        )}
        {isSalesManager && (
          <StatCard
            title="Total Revenue"
            value={`$${stats.revenue.toLocaleString()}`}
            icon={<TrendingUp className="h-8 w-8" />}
          />
        )}
      </div>

      {/* Product Manager Dashboard Content */}
      {isProductManager && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6">
                {stats.lowStockProducts === 0
                  ? 'All products are well-stocked.'
                  : `${stats.lowStockProducts} products have low stock levels.`}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/stock">
                  Manage Stock <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
                Comment Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6">
                {stats.pendingComments === 0
                  ? 'No comments are pending approval.'
                  : `${stats.pendingComments} comments are awaiting moderation.`}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/comments">
                  Moderate Comments <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-green-500" />
                Orders Ready for Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6">
                {stats.pendingDeliveries === 0
                  ? 'No orders are waiting for processing.'
                  : `${stats.pendingDeliveries} orders need to be processed.`}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/deliveries">
                  View Delivery Queue <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCcw className="h-5 w-5 mr-2 text-orange-500" />
                Product Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6">Quick access to product management functions.</p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/products">Products</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/categories">Categories</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Manager Dashboard Content */}
      {isSalesManager && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-purple-500" />
                Recent Sales
              </CardTitle>
              <CardDescription>Sales figures overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Daily</span>
                  <span className="font-medium">${stats.recentSales.daily.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Weekly</span>
                  <span className="font-medium">${stats.recentSales.weekly.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monthly</span>
                  <span className="font-medium">${stats.recentSales.monthly.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-6">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/reports">
                    View Detailed Reports <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCcw className="h-5 w-5 mr-2 text-red-500" />
                Pending Refund Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6">
                {stats.pendingRefunds === 0
                  ? 'No refund requests are pending.'
                  : `${stats.pendingRefunds} refund requests need your attention.`}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/refunds">
                  Handle Refunds <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                Pricing Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6">Manage product prices and discounts.</p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/pricing">Set Prices</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/discounts">Manage Discounts</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6">View recent orders and invoices.</p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/orders">Orders</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/invoices">Invoices</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="text-primary">{icon}</div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
