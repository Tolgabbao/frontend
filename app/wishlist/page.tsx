'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { productsApi, Product } from '@/api/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/wishlist');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch wishlist items
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getWishlist();
      setWishlistProducts(data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setError('Failed to load wishlist items. Please try again later.');
      toast.error('Failed to load wishlist items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      await productsApi.removeFromWishlist(productId);
      setWishlistProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Item removed from wishlist.');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item from wishlist.');
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(product.id, 1);
      toast.success('Item added to cart.');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart.');
    }
  };

  if (authLoading) {
    return (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-4">My Wishlist</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchWishlist}>Retry</Button>
        </div>
    );
  }

  return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

        {wishlistProducts.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Add items to your wishlist to keep track of products you're interested in.
              </p>
              <Button asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden flex flex-col">
                    <div className="aspect-square relative overflow-hidden">
                      {product.main_image_url && (
                          <Image
                              src={
                                product.main_image_url.startsWith('http')
                                    ? product.main_image_url
                                    : `${apiBaseUrl}${product.main_image_url}`
                              }
                              alt={product.name}
                              fill
                              className="object-cover cursor-pointer"
                              onClick={() => router.push(`/products/${product.id}`)}
                          />
                      )}
                      <button
                          onClick={() => handleRemoveFromWishlist(product.id)}
                          className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background"
                      >
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </button>
                    </div>

                    <CardContent className="p-4 flex-grow">
                      <h3
                          className="font-semibold text-lg mb-2 cursor-pointer hover:text-primary"
                          onClick={() => router.push(`/products/${product.id}`)}
                      >
                        {product.name}
                      </h3>

                      <div className="flex items-center space-x-2 mb-2">
                        {product.has_discount ? (
                            <>
                      <span className="text-lg font-bold text-primary">
                        ${Number(product.price).toFixed(2)}
                      </span>
                              <span className="text-sm line-through text-muted-foreground">
                        ${Number(product.original_price).toFixed(2)}
                      </span>
                              <Badge className="bg-destructive font-semibold" variant="outline">
                                {product.discount_percent}% OFF
                              </Badge>
                            </>
                        ) : (
                            <span className="text-lg font-bold text-primary">
                      ${Number(product.price).toFixed(2)}
                    </span>
                        )}
                      </div>

                      <Badge
                          className={
                            product.stock_quantity > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }
                      >
                        {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </CardContent>

                    <CardFooter className="p-4 pt-0">
                      <Button
                          onClick={() => handleAddToCart(product)}
                          className="w-full"
                          disabled={product.stock_quantity <= 0}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </Button>
                    </CardFooter>
                  </Card>
              ))}
            </div>
        )}
      </div>
  );
}