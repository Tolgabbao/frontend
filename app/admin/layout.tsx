'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  ChevronRight,
  MessageCircle,
  CreditCard,
  DollarSign,
  FileText,
  BarChart4,
  Tag,
  Truck,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  roles?: string[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect non-admin users after authentication check is complete
    // Allow access to both PRODUCT_MANAGER and SALES_MANAGER user types
    const isAdmin =
      user?.is_staff ||
      user?.user_type === 'PRODUCT_MANAGER' ||
      user?.user_type === 'SALES_MANAGER';

    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/');
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only show admin interface to admin users
  const isAdmin =
    user?.is_staff || user?.user_type === 'PRODUCT_MANAGER' || user?.user_type === 'SALES_MANAGER';

  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  const userRole = user?.user_type;

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 min-h-screen border-r bg-background">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-8">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Logged in as:{' '}
            {userRole === 'PRODUCT_MANAGER'
              ? 'Product Manager'
              : userRole === 'SALES_MANAGER'
                ? 'Sales Manager'
                : 'Administrator'}
          </p>
          <nav className="space-y-4">
            {/* 1. Dashboard Section */}
            <div>
              <h2 className="text-xs uppercase font-semibold text-muted-foreground mb-2">
                Overview
              </h2>
              <div className="space-y-1">
                <NavLink
                  href="/admin"
                  icon={<LayoutDashboard className="h-5 w-5" />}
                  roles={['PRODUCT_MANAGER', 'SALES_MANAGER', 'ADMIN']}
                >
                  Dashboard
                </NavLink>
              </div>
            </div>

            {/* 2. Product Management Section */}
            <div>
              <h2 className="text-xs uppercase font-semibold text-muted-foreground mb-2">
                Product Management
              </h2>
              <div className="space-y-1">
                <NavLink
                  href="/admin/products"
                  icon={<Package className="h-5 w-5" />}
                  roles={['PRODUCT_MANAGER', 'SALES_MANAGER', 'ADMIN']}
                >
                  Products
                </NavLink>
                <NavLink
                  href="/admin/categories"
                  icon={<Tag className="h-5 w-5" />}
                  roles={['PRODUCT_MANAGER', 'ADMIN']}
                >
                  Categories
                </NavLink>
                <NavLink
                  href="/admin/stock"
                  icon={<Package className="h-5 w-5" />}
                  roles={['PRODUCT_MANAGER', 'ADMIN']}
                >
                  Stock Management
                </NavLink>
                <NavLink
                  href="/admin/comments"
                  icon={<MessageCircle className="h-5 w-5" />}
                  roles={['PRODUCT_MANAGER', 'ADMIN']}
                >
                  Comment Moderation
                </NavLink>
              </div>
            </div>

            {/* 3. Order Management Section */}
            <div>
              <h2 className="text-xs uppercase font-semibold text-muted-foreground mb-2">
                Order Management
              </h2>
              <div className="space-y-1">
                <NavLink
                  href="/admin/orders"
                  icon={<ShoppingBag className="h-5 w-5" />}
                  roles={['PRODUCT_MANAGER', 'SALES_MANAGER', 'ADMIN']}
                >
                  All Orders
                </NavLink>
                <NavLink
                  href="/admin/deliveries"
                  icon={<Truck className="h-5 w-5" />}
                  roles={['PRODUCT_MANAGER', 'ADMIN']}
                >
                  Delivery Queue
                </NavLink>
                <NavLink
                  href="/admin/refunds"
                  icon={<CreditCard className="h-5 w-5" />}
                  roles={['SALES_MANAGER', 'PRODUCT_MANAGER', 'ADMIN']}
                >
                  Refund Requests
                </NavLink>
              </div>
            </div>

            {/* 4. Sales & Pricing Section */}
            <div>
              <h2 className="text-xs uppercase font-semibold text-muted-foreground mb-2">
                Sales & Pricing
              </h2>
              <div className="space-y-1">
                <NavLink
                  href="/admin/pricing"
                  icon={<DollarSign className="h-5 w-5" />}
                  roles={['SALES_MANAGER', 'ADMIN']}
                >
                  Price Management
                </NavLink>
                <NavLink
                  href="/admin/discounts"
                  icon={<Tag className="h-5 w-5" />}
                  roles={['SALES_MANAGER', 'ADMIN']}
                >
                  Discount Management
                </NavLink>
                <NavLink
                  href="/admin/invoices"
                  icon={<FileText className="h-5 w-5" />}
                  roles={['SALES_MANAGER', 'PRODUCT_MANAGER', 'ADMIN']}
                >
                  Invoice Management
                </NavLink>
                <NavLink
                  href="/admin/reports"
                  icon={<BarChart4 className="h-5 w-5" />}
                  roles={['SALES_MANAGER', 'ADMIN']}
                >
                  Financial Reports
                </NavLink>
              </div>
            </div>

            {/* System Administration (for super admins only) */}
            {user?.is_staff && (
              <div>
                <h2 className="text-xs uppercase font-semibold text-muted-foreground mb-2">
                  Administration
                </h2>
                <div className="space-y-1">
                  <NavLink
                    href="/admin/users"
                    icon={<Users className="h-5 w-5" />}
                    roles={['ADMIN']}
                  >
                    User Management
                  </NavLink>
                  <NavLink
                    href="/admin/settings"
                    icon={<Settings className="h-5 w-5" />}
                    roles={['ADMIN']}
                  >
                    System Settings
                  </NavLink>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">{children}</div>
    </div>
  );
}

// This interface has been replaced by NavLinkProps

function NavLink({ href, icon, children, roles = [] }: NavLinkProps) {
  const { user } = useAuth();
  const userRole = user?.user_type || (user?.is_staff ? 'ADMIN' : '');

  // Hide menu item if user doesn't have required role
  if (roles.length > 0 && !roles.includes(userRole)) {
    return null;
  }

  return (
    <Link href={href} className="flex items-center p-3 rounded-lg text-sm group hover:bg-accent">
      <span className="mr-3">{icon}</span>
      <span>{children}</span>
      <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
