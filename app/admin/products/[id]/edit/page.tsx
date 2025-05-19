'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Category, Product, productsApi } from '@/api/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Upload } from 'lucide-react';

interface ProductFormData {
  id?: number;
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
  image_upload: File | null;
}

export default function EditProductPage() {
  const { id } = useParams();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    category_id: '',
    model: '',
    serial_number: '',
    warranty_months: 12,
    distributor_info: '',
    is_visible: false,
    image_upload: null,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    useEffect(() => {
    // Check if user is staff
    if (isAuthenticated && !user?.is_staff) {
      toast.error('You do not have permission to access this page');
      router.push('/');
    } else if (!isAuthenticated) {
      router.push('/login?callbackUrl=/admin/products/${id}/edit');
    }
  }, [isAuthenticated, user, router, id]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productsApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productId = Array.isArray(id) ? parseInt(id[0]) : id ? +id : 0;
        const product = await productsApi.getProduct(productId);
        setFormData({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          cost_price: product.cost_price,
          stock_quantity: product.stock_quantity,
          category_id: product.category?.id.toString() || '',
          model: product.model,
          serial_number: product.serial_number,
          warranty_months: product.warranty_months,
          distributor_info: product.distributor_info,
          is_visible: product.is_visible,
          image_upload: null,
        });
        if (product.main_image_url) {
          setImagePreview(
            product.main_image_url.startsWith('http')
              ? product.main_image_url
              : `${apiBaseUrl}${product.main_image_url}`
          );
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, apiBaseUrl]);

    const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    // Convert numeric string inputs to numbers
    if (type === 'number') {
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
        image_upload: file,
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
        if (key !== 'image_upload' && key !== 'id') {
          submitData.append(key, value.toString());
        }
      });

      if (formData.image_upload) {
        submitData.append('image_upload', formData.image_upload);
      }

      if (formData.id) {
        await productsApi.editProduct(formData.id, submitData);
        toast.success('Product updated successfully');
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };
}
