'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { productsApi } from '@/api/products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ArrowRight, Truck, Package, ShieldCheck, ShoppingBag } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

// Featured product type
interface FeaturedProduct {
  id: number;
  name: string;
  price: number;
  average_rating: number;
  description: string;
  created_at: string;
}

// Category type
interface Category {
  id: number;
  name: string;
  description: string;
}

export default function ProductListContent() {
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<FeaturedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const searchParams = useSearchParams();
  // Keep 'sort' for New Arrivals, but Featured will ignore it
  const sort = searchParams.get('ordering') || '-created_at';

  const handleImageError = (productId: number) => {
    setFailedImages((prev) => ({
      ...prev,
      [productId]: true,
    }));
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Use Promise.allSettled instead of Promise.all to handle potential failures
        const [featuredResult, newestResult, categoriesResult] = await Promise.allSettled([
          productsApi.getTopRatedProducts(6),
          productsApi.getNewestProducts(6),
          productsApi.getCategories(),
        ]);

        // Handle each result safely
        if (featuredResult.status === 'fulfilled') {
          setFeaturedProducts(featuredResult.value);
        }

        if (newestResult.status === 'fulfilled') {
          setNewArrivals(newestResult.value);
        }

        if (categoriesResult.status === 'fulfilled') {
          setCategories(categoriesResult.value);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [searchParams]); // Added searchParams as dependency to react to URL changes

  // Client-side sorting for featured products - ALWAYS sort by popularity
  const sortedFeaturedProducts = useMemo(() => {
    const arr = [...featuredProducts];
    // Directly sort by average_rating descending
    return arr.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
  }, [featuredProducts]); // Only depend on featuredProducts

  // Client-side sorting for new arrivals - respects URL sort parameter
  const sortedNewArrivals = useMemo(() => {
    const arr = [...newArrivals];
    switch (
      sort // Use URL sort parameter here
    ) {
      case 'name':
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case '-name':
        return arr.sort((a, b) => b.name.localeCompare(a.name));
      case 'price':
        return arr.sort((a, b) => Number(a.price) - Number(b.price));
      case '-price':
        return arr.sort((a, b) => Number(b.price) - Number(a.price));
      case '-average_rating':
        return arr.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      case '-created_at':
        return arr.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // newest first
        });
      default:
        return arr; // maintain existing order for other sorts
    }
  }, [newArrivals, sort]); // Depend on newArrivals and the URL sort parameter

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero section */}
      <section className="relative mb-12 bg-gradient-to-r from-primary to-secondary text-background rounded-xl overflow-hidden">
        <div className="relative z-10 px-8 py-16 md:py-24 md:px-16 flex flex-col items-start max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Welcome to Our Store</h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            {isAuthenticated
              ? `Welcome back, ${user?.username}! Check out our latest products.`
              : 'Discover amazing products at unbeatable prices.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              size="lg"
              className="bg-primary text-white hover:bg-white hover:text-primary transition-all duration-200 transform hover:scale-105"
            >
              <Link href="/products">Shop Now</Link>
            </Button>
            {!isAuthenticated && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-background text-background hover:bg-primary/50"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full opacity-20">
          <div className="absolute transform rotate-12 -right-40 -top-10 h-80 w-80 rounded-full bg-highlight"></div>
          <div className="absolute -right-20 bottom-10 h-60 w-60 rounded-full bg-accent"></div>
        </div>
      </section>

      {/* Featured products carousel */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">Featured Products</h2>
          <Button variant="ghost" asChild className="group">
            {/* Link remains pointing to top rated as per original design */}
            <Link href="/products?ordering=-average_rating" className="flex items-center">
              View all
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <Carousel className="w-full">
          <CarouselContent>
            {/* Use the always-sorted-by-popularity array */}
            {sortedFeaturedProducts.map((product) => (
              <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                <Link href={`/products/${product.id}`} className="block h-full">
                  <Card className="h-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-primary hover:text-white hover:scale-105 transition-all duration-200">
                    <CardHeader className="relative h-52 p-0">
                      <div className="w-full h-full relative">
                        {!failedImages[product.id] ? (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL}/api/products/${product.id}/image/`}
                            alt={product.name}
                            fill
                            className="object-cover rounded-t-lg"
                            onError={() => handleImageError(product.id)}
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-light-gray rounded-t-lg">
                            <Package className="w-12 h-12 text-medium-gray" />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <p className="font-bold text-primary">${product.price}</p>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.average_rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-200 text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      </section>

      {/* New Arrivals */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">New Arrivals</h2>
          <Button variant="ghost" asChild className="group">
            {/* Link remains pointing to newest as per original design */}
            <Link href="/products?ordering=-created_at" className="flex items-center">
              View all
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Use the array sorted based on URL parameter */}
          {sortedNewArrivals.slice(0, 3).map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="h-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-primary hover:text-white hover:scale-105 transition-all duration-200">
                <CardHeader className="relative h-52 p-0">
                  <div className="w-full h-full relative">
                    {!failedImages[product.id] ? (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/api/products/${product.id}/image/`}
                        alt={product.name}
                        fill
                        className="object-cover rounded-t-lg"
                        onError={() => handleImageError(product.id)}
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-light-gray rounded-t-lg">
                        <Package className="w-12 h-12 text-medium-gray" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <p className="font-bold text-primary">${product.price}</p>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.average_rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="group block"
            >
              <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6 text-center transition-all duration-200 group-hover:bg-primary group-hover:text-white hover:scale-105">
                <ShoppingBag className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Benefits section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Why Shop With Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Truck className="w-12 h-12 mb-4 text-primary" />
              <CardTitle className="mb-2">Free Shipping</CardTitle>
              <p className="text-muted-foreground">Free shipping on orders over $50</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Package className="w-12 h-12 mb-4 text-primary" />
              <CardTitle className="mb-2">Easy Returns</CardTitle>
              <p className="text-muted-foreground">30 day money back guarantee</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <ShieldCheck className="w-12 h-12 mb-4 text-primary" />
              <CardTitle className="mb-2">Secure Checkout</CardTitle>
              <p className="text-muted-foreground">Protected by industry leading encryption</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gradient-to-r from-[#8b5cf6]/30 to-[#1e1b4b]/30 rounded-lg p-8 mb-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Subscribe to Our Newsletter</h2>
          <p className="text-muted-foreground mb-6">
            Stay updated with the latest products and offers.
          </p>
          <form className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-grow rounded-md border border-medium-gray px-4 py-2"
              required
            />
            <Button
              type="submit"
              className="w-full bg-primary text-white hover:bg-white hover:text-primary transition-colors"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
