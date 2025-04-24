"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  price: number | string;
  stock_quantity: number;
  average_rating: number;
  main_image_url?: string;
}

export default function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCart();

  const initialCategory = searchParams.get("category") || "all";
  const initialSort = searchParams.get("ordering") || "-created_at";

  const [category, setCategory] = useState<string>(initialCategory);
  const [sort, setSort] = useState<string>(initialSort);
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // fetch categories once
  useEffect(() => {
    productsApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  // fetch products when category/search changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    productsApi
      .getProducts({
        search: searchParams.get("search") ?? undefined,
        category: category !== "all" ? category : undefined,
      })
      .then((data) => {
        if (Array.isArray(data)) setRawProducts(data);
        else {
          console.error("Invalid products data", data);
          setRawProducts([]);
          setError("Invalid products data");
        }
      })
      .catch((err) => {
        console.error(err);
        setRawProducts([]);
        setError("Failed to load products");
      })
      .finally(() => setLoading(false));

    // update URL
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (sort !== "-created_at") params.set("ordering", sort);
    const qs = params.toString();
    router.replace(`/products${qs ? `?${qs}` : ""}`);
  }, [category, searchParams.get("search")]);

  // client-side sort whenever rawProducts or sort changes
  const products = useMemo(() => {
    const arr = [...rawProducts];
    switch (sort) {
      case "name":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "-name":
        return arr.sort((a, b) => b.name.localeCompare(a.name));
      case "price":
        return arr.sort((a, b) => Number(a.price) - Number(b.price));
      case "-price":
        return arr.sort((a, b) => Number(b.price) - Number(a.price));
      case "-created_at":
      default:
        return arr; // assume backend order is newest first
    }
  }, [rawProducts, sort]);

  const handleCategoryChange = (val: string) => setCategory(val);
  const handleSortChange = (val: string) => setSort(val);

  const handleAddToCart = async (id: number) => {
    try {
      await addItem(id, 1);
      toast.success("Added to cart");
    } catch {
      toast.error("Could not add to cart");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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
      <div className="mb-6 flex flex-wrap gap-4">
        <Select onValueChange={handleCategoryChange} defaultValue={category}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={handleSortChange} defaultValue={sort}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">A → Z</SelectItem>
            <SelectItem value="-name">Z → A</SelectItem>
            <SelectItem value="price">Low → High</SelectItem>
            <SelectItem value="-price">High → Low</SelectItem>
            <SelectItem value="-created_at">New Arrivals</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <Card key={p.id} className="overflow-hidden hover:shadow-lg">
              <Link
                href={`/products/${p.id}`}
                className="block aspect-square relative overflow-hidden"
              >
                {p.main_image_url ? (
                  <Image
                    src={
                      p.main_image_url.startsWith("http")
                        ? p.main_image_url
                        : `${apiBase}${p.main_image_url}`
                    }
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-contain hover:scale-105 transition-transform"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full bg-light-gray flex items-center justify-center">
                    <Package className="w-12 h-12 text-medium-gray" />
                  </div>
                )}
              </Link>
              <CardContent className="p-4">
                <Link href={`/products/${p.id}`} className="block hover:underline">
                  <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                    {p.name}
                  </h3>
                </Link>
                <p className="text-sm line-clamp-2">{p.description}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-lg font-bold">
                    ${Number(p.price).toFixed(2)}
                  </span>
                  <Badge
                    variant={p.stock_quantity > 0 ? "default" : "destructive"}
                  >
                    {p.stock_quantity > 0 ? "In stock" : "Out of stock"}
                  </Badge>
                </div>
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(p.average_rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart(p.id);
                  }}
                  disabled={p.stock_quantity <= 0}
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
          <p className="mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}

