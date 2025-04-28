"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Product, productsApi } from "@/api/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Package,
  Info,
  MessageSquare,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import Image from "next/image";
import ReviewSection from "@/components/product/ReviewSection";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addItem } = useCart();

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchProduct = async () => {
    try {
      const pid = Array.isArray(id) ? parseInt(id[0]) : id ? +id : 0;
      const data = await productsApi.getProduct(pid);
      setProduct(data);
      setCurrentImageIndex(0);
    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Failed to load product details");
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
      toast.success("Added to cart!");
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error("Failed to add to cart");
    }
  };

  const totalImages = product?.images?.length || 0;
  const goPrev = () =>
    totalImages > 1 &&
    setCurrentImageIndex((i) => (i - 1 + totalImages) % totalImages);
  const goNext = () =>
    totalImages > 1 &&
    setCurrentImageIndex((i) => (i + 1) % totalImages);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="text-error">{error || "Product not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* --- Image gallery --- */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden">
            {totalImages > 0 ? (
              <Image
                src={
                  product.images[currentImageIndex].image_url.startsWith("http")
                    ? product.images[currentImageIndex].image_url
                    : apiBaseUrl + product.images[currentImageIndex].image_url
                }
                alt={
                  product.images[currentImageIndex].alt_text ||
                  product.name
                }
                fill
                className="object-contain"
                priority
                unoptimized
              />
            ) : (
              <div className="bg-light-gray w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-medium-gray" />
              </div>
            )}

            {totalImages > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-background/80"
                  onClick={goPrev}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-background/80"
                  onClick={goNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>

          {totalImages > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, idx) => (
                <div
                  key={img.id}
                  className={`relative w-16 h-16 cursor-pointer rounded overflow-hidden ${
                    idx === currentImageIndex
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <Image
                    src={
                      img.image_url.startsWith("http")
                        ? img.image_url
                        : apiBaseUrl + img.image_url
                    }
                    alt={img.alt_text || `${product.name} thumb ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Details --- */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

          <div className="flex items-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(product.average_rating || 0)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {product.average_rating
                ? product.average_rating.toFixed(1)
                : "Not rated"}
            </span>
          </div>

          <div className="text-2xl font-bold text-primary mb-6">
            ${Number(product.price).toFixed(2)}
          </div>

          {/* === Minimal stock badge change === */}
          <div className="mb-6">
            <Badge
              className={`mb-4 px-2 py-1 rounded ${
                product.stock_quantity > 0
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {product.stock_quantity > 0
                ? `${product.stock_quantity} in stock`
                : "Out of stock"}
            </Badge>

            <p className="text-foreground">{product.description}</p>
          </div>

          {product.stock_quantity > 0 && (
            <Button
              size="lg"
              className="bg-primary text-background hover:bg-primary/90 transition-all duration-200 w-full mb-4"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          )}
        </div>
      </div>

      {/* === Tabs with full-width triggers === */}
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger
            value="reviews"
            className="w-full justify-center"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Reviews
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="w-full justify-center"
          >
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
          {/* … your existing Product Details card … */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
