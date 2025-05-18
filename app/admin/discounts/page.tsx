'use client';

import { useState, useEffect } from 'react';
import { Product, productsApi } from '@/api/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Percent, X, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function DiscountsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [bulkDiscount, setBulkDiscount] = useState<string>('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [discountedOnly, setDiscountedOnly] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await productsApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter products client-side based on search term and filters
    fetchProducts();
  };

  const toggleProductSelection = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
    } else {
      setSelectedProducts((prev) => [...prev, productId]);
    }
  };

  const applyBulkDiscount = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    const discountValue = parseFloat(bulkDiscount);
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      toast.error('Discount must be between 0 and 100');
      return;
    }

    try {
      await productsApi.applyBulkDiscount(selectedProducts, discountValue);
      toast.success(`Applied ${discountValue}% discount to ${selectedProducts.length} products`);

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          selectedProducts.includes(p.id)
            ? {
                ...p,
                discount_percent: discountValue,
                has_discount: discountValue > 0,
                price: p.original_price * (1 - discountValue / 100),
              }
            : p
        )
      );

      // Clear selections
      setSelectedProducts([]);
      setBulkDiscount('');
    } catch (error) {
      console.error('Error applying bulk discount:', error);
      toast.error('Failed to apply bulk discount');
    }
  };

  const removeDiscount = async (productId: number) => {
    try {
      await productsApi.setProductDiscount(productId, 0);
      toast.success('Discount removed');

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                discount_percent: 0,
                has_discount: false,
                price: p.original_price,
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error removing discount:', error);
      toast.error('Failed to remove discount');
    }
  };

  const applyQuickDiscount = async (productId: number, discountValue: number) => {
    try {
      await productsApi.setProductDiscount(productId, discountValue);
      toast.success(`Applied ${discountValue}% discount`);

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                discount_percent: discountValue,
                has_discount: discountValue > 0,
                price: p.original_price * (1 - discountValue / 100),
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error('Failed to apply discount');
    }
  };

  const filteredProducts = products
    .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((product) =>
      categoryFilter === 'all' ? true : product.category.id.toString() === categoryFilter
    )
    .filter((product) => (discountedOnly ? product.has_discount : true));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Discount Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search & Filter Card */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find products to apply discounts</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search products by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="discountedOnly"
                    checked={discountedOnly}
                    onCheckedChange={(checked) => setDiscountedOnly(checked as boolean)}
                  />
                  <label htmlFor="discountedOnly" className="text-sm font-medium cursor-pointer">
                    Show only discounted products
                  </label>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Bulk Discount Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk Discount</CardTitle>
            <CardDescription>Apply the same discount to multiple products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="text-sm">Selected Products: {selectedProducts.length}</div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="Discount %"
                    min="0"
                    max="100"
                    value={bulkDiscount}
                    onChange={(e) => setBulkDiscount(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Percent className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <Button
                  onClick={applyBulkDiscount}
                  disabled={selectedProducts.length === 0 || !bulkDiscount}
                >
                  Apply Discount
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <div className="text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 inline-block mr-1" />
              Note: Discounts will be visible to customers immediately
            </div>
            {selectedProducts.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => setSelectedProducts([])}>
                Clear Selection
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Product Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Apply or modify discounts for individual products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedProducts.length > 0 &&
                        selectedProducts.length === filteredProducts.length
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedProducts(filteredProducts.map((p) => p.id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Original Price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Final Price</TableHead>
                  <TableHead className="w-40">Quick Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="relative w-12 h-12">
                          {product.main_image_url ? (
                            <Image
                              src={
                                product.main_image_url.startsWith('http')
                                  ? product.main_image_url
                                  : apiBaseUrl + product.main_image_url
                              }
                              alt={product.name}
                              fill
                              className="object-cover rounded"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-500">No image</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category.name}</TableCell>
                      <TableCell>${Number(product.original_price).toFixed(2)}</TableCell>
                      <TableCell>
                        {product.has_discount ? (
                          <Badge variant="destructive">
                            {Number(product.discount_percent).toFixed(0)}% OFF
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">No discount</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">${Number(product.price).toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {!product.has_discount ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => applyQuickDiscount(product.id, 10)}
                                title="Apply 10% discount"
                              >
                                10%
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => applyQuickDiscount(product.id, 25)}
                                title="Apply 25% discount"
                              >
                                25%
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => applyQuickDiscount(product.id, 50)}
                                title="Apply 50% discount"
                              >
                                50%
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeDiscount(product.id)}
                              title="Remove discount"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
