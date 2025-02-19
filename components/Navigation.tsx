'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authApi } from '@/api/auth';
import { cartApi } from '@/api/cart';

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const status = await authApi.checkAuthStatus();
        setIsLoggedIn(status);
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    const fetchCartCount = async () => {
      try {
        const items = await cartApi.getCart();
        setCartItemCount(items.reduce((acc, item) => acc + item.quantity, 0));
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    checkAuth();
    //fetchCartCount();
  }, []);

  return (
    <nav className="bg-background shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-foreground">E-Commerce</Link>
          
          <div className="flex items-center space-x-4">
            <Link href="/products" className="text-foreground hover:text-secondary">Products</Link>
            {isLoggedIn ? (
              <>
                <Link href="/cart" className="text-foreground hover:text-secondary">
                  Cart ({cartItemCount})
                </Link>
                <Link href="/orders" className="text-foreground hover:text-secondary">Orders</Link>
                <Link href="/profile" className="text-foreground hover:text-secondary">Profile</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-foreground hover:text-secondary">Login</Link>
                <Link href="/register" className="text-foreground hover:text-secondary">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
