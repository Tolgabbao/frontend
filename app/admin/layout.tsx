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
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect non-staff users after authentication check is complete
    if (!isLoading && (!isAuthenticated || (user && !user.is_staff))) {
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

  // Only show admin interface to staff users
  if (!isAuthenticated || (user && !user.is_staff)) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 min-h-screen border-r bg-background">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-8">Admin Dashboard</h1>
          <nav className="space-y-1">
            <NavItem href="/admin" icon={<LayoutDashboard className="h-5 w-5" />}>
              Dashboard
            </NavItem>{' '}
            <NavItem href="/admin/products" icon={<Package className="h-5 w-5" />}>
              Products
            </NavItem>
            <NavItem href="/admin/comments" icon={<MessageCircle className="h-5 w-5" />}>
              Comments
            </NavItem>
            <NavItem href="/admin/orders" icon={<ShoppingBag className="h-5 w-5" />}>
              Orders
            </NavItem>
            <NavItem href="/admin/users" icon={<Users className="h-5 w-5" />}>
              Users
            </NavItem>
            <NavItem href="/admin/settings" icon={<Settings className="h-5 w-5" />}>
              Settings
            </NavItem>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">{children}</div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function NavItem({ href, icon, children }: NavItemProps) {
  return (
    <Link href={href} className="flex items-center p-3 rounded-lg text-sm group hover:bg-accent">
      <span className="mr-3">{icon}</span>
      <span>{children}</span>
      <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
