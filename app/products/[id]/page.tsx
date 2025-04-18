'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Product, productsApi } from '@/api/products';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Package,
  Info,
  MessageSquare,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import Image from 'next/image';
import ReviewSection from '@/components/product/ReviewSection';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addItem } = useCart();

  // Get the API base URL for constructing full image URLs
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchProduct = async () => {
    try {
      const productId = Array.isArray(id) ? parseInt(id[0]) : id ? parseInt(id.toString()) : 0;
      const data = await productsApi.getProduct(productId);
      setProduct(data);

      // Reset image index when product changes
      setCurrentImageIndex(0);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addItem(product.id, 1);
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  // Calculate total number of images
  const totalImages = product?.images?.length || 0;

  const goToPrevImage = () => {
    if (totalImages <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const goToNextImage = () => {
    if (totalImages <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="text-error">{error || 'Product not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden">
            {/* Main product image */}
            {product?.images && product.images.length > 0 ? (
              <div className="relative w-full h-full">
                <Image
                  src={
                    // Ensure the URL is pointing to the backend server
                    product.images[currentImageIndex].image_url.startsWith('http')
                      ? product.images[currentImageIndex].image_url
                      : `${apiBaseUrl}${product.images[currentImageIndex].image_url}`
                  }
                  alt={product.images[currentImageIndex].alt_text || product.name}
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            ) : (
              <div className="bg-light-gray w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-medium-gray" />
              </div>
            )}

            {/* Navigation arrows - only show if multiple images */}
            {totalImages > 1 && (
              <div className="absolute inset-0 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-background/80"
                  onClick={goToPrevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-background/80"
                  onClick={goToNextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>

          {/* Thumbnails - only show if multiple images */}
          {totalImages > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product?.images?.map((image, index) => (
                <div
                  key={image.id}
                  className={`relative w-16 h-16 cursor-pointer ${
                    index === currentImageIndex ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <Image
                    src={
                      // Ensure the URL is pointing to the backend server
                      image.image_url.startsWith('http')
                        ? image.image_url
                        : `${apiBaseUrl}${image.image_url}`
                    }
                    alt={image.alt_text || `${product.name} thumbnail ${index + 1}`}
                    fill
                    className="object-cover rounded"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

          <div className="flex items-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(product.average_rating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {product.average_rating ? product.average_rating.toFixed(1) : 'Not rated'}
            </span>
          </div>

          <div className="text-2xl font-bold text-primary mb-6">
            ${Number(product.price).toFixed(2)}
          </div>

          <div className="mb-6">
            <Badge
              variant={product.stock_quantity > 0 ? 'default' : 'destructive'}
              className="mb-4"
            >
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
            </Badge>

            <p className="text-foreground">{product.description}</p>
          </div>

          {product.stock_quantity > 0 && (
            <Button
              size="lg"
              className="bg-primary text-background hover:bg-primary/90 hover:scale-105 transition-all duration-200 w-full mb-4"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for Reviews and Product Details */}
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="reviews" className="text-base">
            <MessageSquare className="h-4 w-4 mr-2" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="details" className="text-base">
            <Info className="h-4 w-4 mr-2" />
            Product Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="py-4">
          <ReviewSection
            productId={product.id}
            currentRating={product.average_rating || 0}
            refreshProduct={fetchProduct}
          />
        </TabsContent>

        <TabsContent value="details" className="py-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 text-lg">Product Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Specifications</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Category:</span>
                      <span>{product.category?.name || 'Uncategorized'}</span>
                    </li>
                    <li className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Model:</span>
                      <span>{product.model || 'N/A'}</span>
                    </li>
                    {product.serial_number && (
                      <li className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">Serial Number:</span>
                        <span>{product.serial_number}</span>
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Additional Information</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Warranty:</span>
                      <span>{product.warranty_months || 0} months</span>
                    </li>
                    <li className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Stock:</span>
                      <span>{product.stock_quantity} units</span>
                    </li>
                    <li className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Price:</span>
                      <span>${Number(product.price).toFixed(2)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
