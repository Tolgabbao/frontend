'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authApi } from '@/api/auth';
import { cartApi } from '@/api/cart';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShoppingCart, User, LogOut, Package, Home } from "lucide-react";

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
    <nav className="border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Home className="w-6 h-6" />
            <span className="font-bold">E-Commerce</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/products">
                <Package className="w-4 h-4 mr-2" />
                Products
              </Link>
            </Button>
            
            {isLoggedIn ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/cart">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Cart ({cartItemCount})
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar>
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">
                        <Package className="w-4 h-4 mr-2" />
                        Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
