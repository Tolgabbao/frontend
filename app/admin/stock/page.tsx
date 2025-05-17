'use client';

import { useState, useEffect } from 'react';
import { productsApi } from '@/api/products';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, ArrowUp, ArrowDown, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ProductStock {
  id: number;
  name: string;
  model: string;
  serial_number: string;
  stock_quantity: number;
  price: number;
  category: {
    name: string;
  };
}

export default function StockManagementPage() {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const { user } = useAuth();

  // Redirect if not a product manager
  useEffect(() => {
    if (user && user.user_type !== 'PRODUCT_MANAGER' && !user.is_staff) {
      toast.error('Only product managers can access this page');
      // Consider redirecting here
    }
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.getAdminProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const handleOpenStockDialog = (product: ProductStock) => {
    setSelectedProduct(product);
    setStockQuantity(product.stock_quantity);
    setOpenDialog(true);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      // Use the updateProductStock API function to update product stock
      await productsApi.updateProductStock(selectedProduct.id, stockQuantity);
      toast.success('Stock quantity updated successfully');
      setOpenDialog(false);
      fetchProducts();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const getLowStockProducts = () => {
    return products.filter((p) => p.stock_quantity < 5).length;
  };

  const getOutOfStockProducts = () => {
    return products.filter((p) => p.stock_quantity === 0).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Stock summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{products.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-yellow-500">{getLowStockProducts()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-red-500">{getOutOfStockProducts()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Stock Management</CardTitle>
          <CardDescription>Manage product inventory and stock levels</CardDescription>

          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, model, or serial number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>{product.model}</TableCell>
                    <TableCell>{product.serial_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{product.stock_quantity}</span>
                        {product.stock_quantity === 0 ? (
                          <Badge variant="destructive">Out of stock</Badge>
                        ) : product.stock_quantity < 5 ? (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenStockDialog(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update Stock
                        </Button>

                        <Link href={`/admin/products/${product.id}`}>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    {searchTerm ? 'No products match your search criteria.' : 'No products found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Stock Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock Quantity</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <p className="text-lg font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">
                  Model: {selectedProduct.model} | Current Stock: {selectedProduct.stock_quantity}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_quantity">New Stock Quantity</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setStockQuantity(Math.max(0, stockQuantity - 1))}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>

                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                    required
                    className="text-center"
                  />

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setStockQuantity(stockQuantity + 1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Update Stock</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
