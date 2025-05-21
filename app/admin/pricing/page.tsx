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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, Save, Check, Percent } from 'lucide-react';
import Image from 'next/image';

export default function ProductPricingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [price, setPrice] = useState<string>('');
  const [discount, setDiscount] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [bulkDiscount, setBulkDiscount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending');

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (activeTab === 'all') {
      fetchProducts();
    } else {
      fetchPendingApprovalProducts();
    }
  }, [activeTab]);

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

  const fetchPendingApprovalProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.getPendingPriceApproval();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching pending approval products:', error);
      toast.error('Failed to load products pending approval');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter products client-side based on search term
    fetchProducts();
  };

  const startEditingPrice = (product: Product) => {
    setEditingProductId(product.id);
    setPrice(product.original_price.toString());
    setDiscount(product.discount_percent.toString());
  };

  const savePrice = async () => {
    if (!editingProductId) return;

    try {
      await productsApi.setProductPrice(editingProductId, parseFloat(price));
      toast.success('Price updated successfully');

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProductId ? { ...p, original_price: parseFloat(price) } : p
        )
      );

      setEditingProductId(null);
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    }
  };

  const saveDiscount = async () => {
    if (!editingProductId) return;

    try {
      const discountValue = parseFloat(discount);
      if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
        toast.error('Discount must be between 0 and 100');
        return;
      }

      await productsApi.setProductDiscount(editingProductId, discountValue);
      toast.success('Discount updated successfully');

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProductId
            ? {
                ...p,
                discount_percent: discountValue,
                has_discount: discountValue > 0,
                price: p.original_price * (1 - discountValue / 100),
              }
            : p
        )
      );

      setEditingProductId(null);
    } catch (error) {
      console.error('Error updating discount:', error);
      toast.error('Failed to update discount');
    }
  };

  const approvePrice = async (productId: number) => {
    try {
      await productsApi.approveProductPrice(productId);
      toast.success('Price approved');

      // Update local state
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, price_approved: true, is_visible: true } : p))
      );
    } catch (error) {
      console.error('Error approving price:', error);
      toast.error('Failed to approve price');
    }
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

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold">Product Pricing Management</h1>
      </div>

      <Tabs
        defaultValue="pending"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'all' | 'pending')}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="all">All Products</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search & Filter Card */}
        <Card>
          <CardHeader>
            <CardTitle>Search Products</CardTitle>
            <CardDescription>Find products by name to manage their pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
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
                <Button onClick={applyBulkDiscount} disabled={selectedProducts.length === 0}>
                  Apply Discount
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'pending' ? 'Products Pending Price Approval' : 'Product Pricing List'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'pending'
              ? 'Review and approve pricing for products added by Product Managers'
              : 'Manage product prices, discounts, and visibility'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md">
              {activeTab === 'pending' ? (
                <>
                  <Check className="w-12 h-12 text-green-500 mb-2" />
                  <h3 className="text-lg font-medium">No products pending approval</h3>
                  <p className="text-muted-foreground">All product prices have been approved</p>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">No products found</h3>
                  <p className="text-muted-foreground">Try adjusting your search</p>
                </>
              )}
            </div>
          )}

          {filteredProducts.length > 0 && (
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
                    <TableHead>Original Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Final Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-36">Actions</TableHead>
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
                        <TableCell>
                          {editingProductId === product.id ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-24"
                              />
                              <Button size="sm" variant="outline" onClick={savePrice}>
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="cursor-pointer hover:underline"
                              onClick={() => startEditingPrice(product)}
                            >
                              ${Number(product.original_price).toFixed(2)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingProductId === product.id ? (
                            <div className="flex items-center space-x-2">
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={discount}
                                  onChange={(e) => setDiscount(e.target.value)}
                                  className="w-20 pr-6"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                  <span className="text-gray-500">%</span>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" onClick={saveDiscount}>
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="cursor-pointer hover:underline"
                              onClick={() => startEditingPrice(product)}
                            >
                              {product.discount_percent}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold">${Number(product.price).toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          {product.price_approved ? (
                            <Badge className="bg-green-500 hover:bg-green-600" variant="default">
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!product.price_approved && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => approvePrice(product.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
