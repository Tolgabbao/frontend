'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product, Category, productsApi } from '@/api/products';
import { cartApi } from '@/api/cart';

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

  const handleRateProduct = async (productId: number, rating: number) => {
    try {
      await productsApi.rateProduct(productId, rating);
      // Refresh products to show updated rating
      fetchProducts();
    } catch (error) {
      console.error('Error rating product:', error);
      alert('You can only rate products you have purchased');
    }
  };

  const handleAddComment = async (productId: number, content: string) => {
    try {
      await productsApi.commentProduct(productId, content);
      // Refresh products to show new comment
      fetchProducts();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('You can only comment on products you have purchased');
    }
  };

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
        <select 
          onChange={(e) => {
            const params = new URLSearchParams(window.location.search);
            params.set('category', e.target.value);
            window.history.pushState({}, '', `?${params.toString()}`);
          }}
          className="border border-medium-gray p-2 rounded bg-background text-foreground"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="border border-medium-gray rounded-lg p-4 shadow hover:shadow-lg transition-shadow bg-background"
          >
            <h2 className="text-xl font-semibold mb-2 text-foreground">{product.name}</h2>
            <p className="text-dark-gray mb-4">{product.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-foreground">
                2 placeholder
              </span>
              <div className="flex items-center gap-2">
                <span className={`${product.stock_quantity > 0 ? 'text-success' : 'text-error'}`}>
                  {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                </span>
                {product.stock_quantity > 0 && (
                  <button
                    onClick={() => addToCart(product.id)}
                    className="bg-primary text-background px-4 py-2 rounded hover:bg-secondary"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="text-yellow-500">{'★'.repeat(Math.floor(product.average_rating))}</span>
              <span className="text-gray-400">{'★'.repeat(5 - Math.floor(product.average_rating))}</span>
              <span className="ml-2 text-sm text-gray-600">(average rating placeholder)</span>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold">Comments</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;