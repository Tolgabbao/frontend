'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product, Category, productsApi } from '@/api/products';
import { cartApi } from '@/api/cart';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Package2 } from "lucide-react";


const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productsApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setError(null);
    try {
      const data = await productsApi.getProducts({
        search: searchParams.get('search') ?? undefined,
        category: searchParams.get('category') ?? undefined,
        ordering: searchParams.get('ordering') ?? undefined,
      });
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  async function addToCart(id: number): Promise<void> {
    try {
      await cartApi.addToCart(id, 1);
      alert('Item added to cart successfully');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart');
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Select onValueChange={(value) => {
          const params = new URLSearchParams(window.location.search);
          if (value !== "all") {
            params.set('category', value);
          } else {
            params.delete('category');
          }
          window.history.pushState({}, '', `?${params.toString()}`);
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              {product.image_url && (
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="object-cover rounded-lg w-full h-48"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{product.description}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-lg font-bold">${product.price}</span>
                <Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"}>
                  <Package2 className="w-4 h-4 mr-1" />
                  {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                </Badge>
              </div>
              <div className="flex items-center mt-2">
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
                <span className="ml-2 text-sm text-muted-foreground">
                  (#TODO implement rating)
                </span>
              </div>
            </CardContent>
            <CardFooter>
              {product.stock_quantity > 0 && (
                <Button 
                  onClick={() => addToCart(product.id)}
                  className="w-full"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ProductList;