"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { productsApi } from "@/api/products";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Edit, Trash, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ProductImage from "@/components/ProductImage";

interface AdminProduct {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  is_visible: boolean;
  category: {
    name: string;
  };
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProducts = async () => {
    try {
      // Fetch all products including invisible ones (admin only)
      const data = await productsApi.getAdminProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleVisibility = async (productId: number) => {
    try {
      await productsApi.toggleProductVisibility(productId);
      // Update products list with the toggled visibility
      setProducts(
        products.map((product) => {
          if (product.id === productId) {
            return {
              ...product,
              is_visible: !product.is_visible,
            };
          }
          return product;
        }),
      );
      toast.success("Product visibility updated");
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Failed to update product visibility");
    }
  };

  const deleteProduct = async (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await productsApi.deleteProduct(productId);
        setProducts(products.filter((product) => product.id !== productId));
        toast.success("Product deleted successfully");
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      }
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Button className="bg-purple-600 text-white hover:bg-purple-700 dark:hover:bg-purple-500 hover:scale-105 transition-all duration-200" asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New Product
          </Link>
        </Button>
      </div>

      <div className="flex mb-4">
        <Input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mr-2"
        />
        <Button variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="relative w-16 h-16 rounded-md overflow-hidden">
                    <ProductImage
                      productId={product.id}
                      alt={product.name}
                      className="rounded-md"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  {product.category?.name || "Uncategorized"}
                </TableCell>
                <TableCell className="text-right">
                  ${Number(product.price).toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={
                      product.stock_quantity > 0 ? "default" : "destructive"
                    }
                  >
                    {product.stock_quantity}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={product.is_visible ? "default" : "secondary"}>
                    {product.is_visible ? "Visible" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleVisibility(product.id)}
                      title={
                        product.is_visible ? "Hide product" : "Show product"
                      }
                    >
                      {product.is_visible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
