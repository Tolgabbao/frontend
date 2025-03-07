"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Category, productsApi } from "@/api/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, Upload } from "lucide-react";

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  category_id: string;
  model: string;
  serial_number: string;
  warranty_months: number;
  distributor_info: string;
  is_visible: boolean;
  image?: File | null;
}

export default function NewProductPage() {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    category_id: "",
    model: "",
    serial_number: "",
    warranty_months: 12,
    distributor_info: "",
    is_visible: false,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user is staff
    if (isAuthenticated && !user?.is_staff) {
      toast.error("You do not have permission to access this page");
      router.push("/");
    } else if (!isAuthenticated) {
      router.push("/login?callbackUrl=/admin/products/new");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productsApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    // Convert numeric string inputs to numbers
    if (type === "number") {
      setFormData({
        ...formData,
        [name]: parseFloat(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (value: string, fieldName: string) => {
    setFormData({
      ...formData,
      [fieldName]: value,
    });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData({
      ...formData,
      [field]: checked,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData({
        ...formData,
        image: file,
      });

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create FormData object for multipart form submission
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "image") {
          submitData.append(key, value.toString());
        }
      });

      if (formData.image) {
        submitData.append("image", formData.image);
      }

      await productsApi.createProduct(submitData);
      toast.success("Product created successfully");
      router.push("/admin/products");
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Product</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/products")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Product Name *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Model *
                  </label>
                  <Input
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="Enter model number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Serial Number *
                  </label>
                  <Input
                    name="serial_number"
                    value={formData.serial_number}
                    onChange={handleInputChange}
                    placeholder="Enter serial number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description *
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    rows={5}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category *
                  </label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      handleSelectChange(value, "category_id")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pricing and Stock */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sale Price ($) *
                  </label>
                  <Input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min={0}
                    step={0.01}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cost Price ($) *
                  </label>
                  <Input
                    type="number"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleInputChange}
                    min={0}
                    step={0.01}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Stock Quantity *
                  </label>
                  <Input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    min={0}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Warranty (months) *
                  </label>
                  <Input
                    type="number"
                    name="warranty_months"
                    value={formData.warranty_months}
                    onChange={handleInputChange}
                    min={0}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Distributor Information *
                  </label>
                  <Textarea
                    name="distributor_info"
                    value={formData.distributor_info}
                    onChange={handleInputChange}
                    placeholder="Enter distributor information"
                    rows={2}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_visible"
                    checked={formData.is_visible}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("is_visible", checked === true)
                    }
                  />
                  <label
                    htmlFor="is_visible"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Make product visible to customers
                  </label>
                </div>
              </div>
            </div>

            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Image
              </label>
              <div className="flex items-center gap-4">
                <div className="border rounded-md p-2 flex-grow">
                  <label className="cursor-pointer flex flex-col items-center justify-center h-40 bg-background border-2 border-dashed border-gray-300 rounded-md">
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="object-contain w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          Click to upload image
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {imagePreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData({ ...formData, image: null });
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Recommended size: 800x800 pixels. JPG, PNG or GIF.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                    Saving...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Product
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
