"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Category, productsApi } from "@/api/products";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Package } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  average_rating: number;
  main_image_url?: string;
}

export default function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const { addItem } = useCart();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productsApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await productsApi.getProducts({
        search: searchParams.get("search") ?? undefined,
        category: searchParams.get("category") ?? undefined,
        ordering: searchParams.get("ordering") ?? undefined,
      });

      // Make sure we have valid data before setting state
      if (data && Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error("Invalid products data:", data);
        setProducts([]);
        setError("Failed to load products: invalid response format");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products. Please try again later.");
      setProducts([]); // Set empty array to prevent map issues
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleAddToCart(id: number): Promise<void> {
    try {
      await addItem(id, 1);
      toast.success("Item added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add item to cart");
    }
  }

  const handleCategoryChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value !== "all") {
      url.searchParams.set("category", value);
    } else {
      url.searchParams.delete("category");
    }
    window.history.pushState({}, "", url);
    // We need to manually trigger a refetch since pushState doesn't trigger a navigation
    fetchProducts();
  };

  // Get the API base URL for constructing full image URLs
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-error p-4 bg-error/10 rounded">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      <div className="mb-6">
        <Select
          onValueChange={handleCategoryChange}
          defaultValue={searchParams.get("category") || "all"}
        >
          <SelectTrigger className="w-[200px] bg-background border-medium-gray text-foreground">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent className="bg-background border-medium-gray">
            <SelectItem
              value="all"
              className="text-foreground hover:bg-light-gray"
            >
              All Categories
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem
                key={cat.id}
                value={cat.id.toString()}
                className="text-foreground hover:bg-light-gray"
              >
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden transition-shadow hover:shadow-lg"
            >
              <Link
                href={`/products/${product.id}`}
                className="block aspect-square relative overflow-hidden"
              >
                {product.main_image_url ? (
                  <Image
                    src={
                      // Ensure the URL is pointing to the backend server
                      product.main_image_url.startsWith("http")
                        ? product.main_image_url
                        : `${apiBaseUrl}${product.main_image_url}`
                    }
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-contain transition-transform duration-300 hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full bg-light-gray flex items-center justify-center">
                    <Package className="w-12 h-12 text-medium-gray" />
                  </div>
                )}
              </Link>
              <CardContent className="p-4">
                <Link
                  href={`/products/${product.id}`}
                  className="block hover:underline"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-dark-gray text-sm line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-lg font-bold text-foreground">
                    ${product.price}
                  </span>
                  <Badge
                    variant={
                      product.stock_quantity > 0 ? "default" : "destructive"
                    }
                    className="text-background"
                  >
                    {product.stock_quantity > 0 ? `In stock` : "Out of stock"}
                  </Badge>
                </div>
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(product.average_rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart(product.id);
                  }}
                  disabled={product.stock_quantity <= 0}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold">No products found</h3>
          <p className="text-muted-foreground mt-2">
            Try adjusting your filters
          </p>
        </div>
      )}
    </div>
  );
}
