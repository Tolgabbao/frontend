"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Category, productsApi } from "@/api/products";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  average_rating: number;
}

export default function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
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

  const handleImageError = (productId: number) => {
    setFailedImages((prev) => ({
      ...prev,
      [productId]: true,
    }));
  };

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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="border-medium-gray hover:border-primary transition-colors"
            >
              <CardHeader>
                <div className="aspect-square mb-3 relative">
                  {!failedImages[product.id] ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/api/products/${product.id}/image/`}
                      alt={product.name}
                      className="object-cover rounded-lg"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      onError={() => handleImageError(product.id)}
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-light-gray rounded-lg">
                      <Package className="w-16 h-16 text-medium-gray" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg font-semibold mb-1">
                  {product.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                        i < Math.floor(product.average_rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                {product.stock_quantity > 0 && (
                  <Button
                    className="w-full bg-primary text-background hover:bg-secondary"
                    onClick={() => handleAddToCart(product.id)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                )}
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
