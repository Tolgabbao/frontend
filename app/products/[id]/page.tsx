"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Product, productsApi } from "@/api/products";
import ProductImage from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productId = Array.isArray(id)
          ? parseInt(id[0])
          : id
            ? parseInt(id.toString())
            : 0;
        const data = await productsApi.getProduct(productId);
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addItem(product.id, 1);
      toast.success("Product added to cart");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add product to cart");
    }
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
        <p className="text-error">{error || "Product not found"}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="relative aspect-square rounded-lg overflow-hidden">
        <ProductImage
          productId={product.id}
          alt={product.name}
          className="rounded-lg"
        />
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

        <div className="flex items-center mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < Math.floor(product.average_rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            (#AVERAGE RATING TO BE ADDED LATER)
          </span>
        </div>

        <div className="text-2xl font-bold text-primary mb-6">
          ${Number(product.price).toFixed(2)}
        </div>

        <div className="mb-6">
          <Badge
            variant={product.stock_quantity > 0 ? "default" : "destructive"}
            className="mb-4"
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
            className="w-full md:w-auto"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
        )}

        <Card className="mt-8 p-4">
          <h3 className="font-semibold mb-2">Product Details</h3>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span>{product.category?.name || "Uncategorized"}</span>
            </li>
            {/* Add more product details as needed */}
          </ul>
        </Card>
      </div>
    </div>
  );
}
