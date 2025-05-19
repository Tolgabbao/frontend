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

}
