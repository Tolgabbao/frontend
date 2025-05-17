const BASE_URL = 'http://localhost:8000';

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface ProductComment {
  id: number;
  user_name: string;
  comment: string;
  is_approved: boolean;
  created_at: string;
  product: number;
  // The original interface only had user, content, and created_at
}

export interface ProductImage {
  id: number;
  image_url: string;
  alt_text: string;
  is_primary: boolean;
  upload_date: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price: number;
  discount_percent: number;
  has_discount: boolean;
  created_at: string;
  stock_quantity: number;
  average_rating: number;
  category: Category;
  comments: ProductComment[];
  image_url: string;
  is_visible: boolean; // Changed from boolean | undefined to boolean
  images: ProductImage[];
  main_image_url: string;
  model: string;
  serial_number: string;
  warranty_months: string;
  in_wishlist: boolean;
  price_approved: boolean;
}

interface ProductQueryParams {
  search?: string;
  category?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
  featured?: boolean;
}

function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}

export const productsApi = {
  // Category management
  createCategory: async (categoryData: {
    name: string;
    description: string;
  }): Promise<Category> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/categories/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(categoryData),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to create category');
    }

    return response.json();
  },

  updateCategory: async (
    id: number,
    categoryData: { name: string; description: string }
  ): Promise<Category> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/categories/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(categoryData),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to update category');
    }

    return response.json();
  },

  deleteCategory: async (id: number): Promise<void> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/categories/${id}/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete category');
    }
  },

  getProducts: async (params: ProductQueryParams = {}): Promise<Product[]> => {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.ordering) queryParams.append('ordering', params.ordering);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.featured) queryParams.append('featured', 'true');

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`${BASE_URL}/api/products/${queryString}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();

    // Handle different response formats
    if (Array.isArray(data)) {
      // If data is already an array, return it directly
      return data;
    } else if (data.results && Array.isArray(data.results)) {
      // If data has a results property that is an array (pagination response)
      return data.results;
    } else if (data && typeof data === 'object') {
      // If data is a single object, wrap it in an array
      console.warn('API returned a single object instead of an array, converting to array');
      return [data];
    } else {
      // If data is in an unexpected format, return an empty array and log an error
      console.error('Received unexpected data format from API:', data);
      return [];
    }
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await fetch(`${BASE_URL}/api/products/${id}/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }

    return response.json();
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await fetch(`${BASE_URL}/api/categories/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    return data.results || data;
  },

  getTopRatedProducts: async (limit: number = 5): Promise<Product[]> => {
    const response = await fetch(`${BASE_URL}/api/products/top_rated/?limit=${limit}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch top rated products');
    }

    const data = await response.json();
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else if (data && typeof data === 'object') {
      return [data];
    } else {
      console.error('Received unexpected data format from API:', data);
      return [];
    }
  },

  getNewestProducts: async (limit: number = 5): Promise<Product[]> => {
    const response = await fetch(`${BASE_URL}/api/products/newest/?limit=${limit}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch newest products');
    }

    const data = await response.json();
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else if (data && typeof data === 'object') {
      return [data];
    } else {
      console.error('Received unexpected data format from API:', data);
      return [];
    }
  },

  getBestSellingProducts: async (limit: number = 5): Promise<Product[]> => {
    const response = await fetch(`${BASE_URL}/api/products/best_selling/?limit=${limit}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch best selling products');
    }

    const data = await response.json();
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else if (data && typeof data === 'object') {
      return [data];
    } else {
      console.error('Received unexpected data format from API:', data);
      return [];
    }
  },

  getFeaturedProducts: async (limit: number = 5): Promise<Product[]> => {
    return productsApi.getProducts({
      featured: true,
      limit,
    });
  },

  rateProduct: async (productId: number, rating: number) => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/rate_product/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ rating, product: productId }), // Add product ID to request
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to rate product');
    }
    return response.json();
  },

  commentProduct: async (productId: number, comment: string) => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/comment_product/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ comment, product: productId }), // Add product ID to request
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add comment');
    }
    return response.json();
  },

  approveComment: async (commentId: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/api/comments/${commentId}/approve/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to approve comment');
    }

    return response.json();
  },

  // Admin functions
  getAdminProducts: async (): Promise<Product[]> => {
    const response = await fetch(`${BASE_URL}/api/products/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin products');
    }

    const data = await response.json();
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else if (data && typeof data === 'object') {
      return [data];
    } else {
      console.error('Received unexpected data format from API:', data);
      return [];
    }
  },

  toggleProductVisibility: async (productId: number): Promise<void> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/toggle_visibility/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to toggle product visibility');
    }

    return response.json();
  },

  createProduct: async (formData: FormData): Promise<Product> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/add-product/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create product: ${errorText}`);
    }

    return response.json();
  },

  updateProduct: async (id: number, formData: FormData): Promise<Product> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${id}/`, {
      method: 'PATCH',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to update product');
    }

    return response.json();
  },

  deleteProduct: async (id: number): Promise<void> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${id}/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
  },

  getProductImages: async (productId: number): Promise<ProductImage[]> => {
    const response = await fetch(`${BASE_URL}/api/products/${productId}/images/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product images');
    }

    return response.json();
  },

  addProductImage: async (
    productId: number,
    imageData: string,
    isPrimary: boolean = false
  ): Promise<ProductImage> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/images/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({
        image: imageData,
        is_primary: isPrimary,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to add product image');
    }

    return response.json();
  },

  setPrimaryImageById: async (productId: number, imageId: number): Promise<void> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(
      `${BASE_URL}/api/products/${productId}/images/${imageId}/set_primary/`,
      {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to set primary image');
    }
  },

  deleteProductImage: async (productId: number, imageId: number): Promise<void> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/images/${imageId}/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete product image');
    }
  },

  // Wishlist functionality
  addToWishlist: async (productId: number): Promise<void> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/add_to_wishlist/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add to wishlist');
    }
  },

  removeFromWishlist: async (productId: number): Promise<void> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/remove_from_wishlist/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove from wishlist');
    }
  },

  getWishlist: async (): Promise<Product[]> => {
    const response = await fetch(`${BASE_URL}/api/products/wishlist/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch wishlist');
    }

    const data = await response.json();
    return data.results || data;
  },

  async uploadProductImage(productId: number, formData: FormData): Promise<ProductImage> {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/add_image/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    return await response.json();
  },

  async removeProductImage(productId: number, imageId: number): Promise<void> {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(
      `${BASE_URL}/api/products/${productId}/remove_image/?image_id=${imageId}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrfToken,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  },

  async setPrimaryImage(productId: number, imageId: number): Promise<ProductImage> {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/set_primary_image/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ image_id: imageId }),
    });

    if (!response.ok) {
      throw new Error('Failed to set primary image');
    }

    return await response.json();
  },

  // Product Manager Stock Management
  updateProductStock: async (productId: number, stockQuantity: number): Promise<Product> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/update_stock/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ stock_quantity: stockQuantity }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update product stock');
    }

    return response.json();
  },

  // Sales Manager Discount Management
  setProductPrice: async (productId: number, price: number): Promise<Product> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/set_price/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ price }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set product price');
    }

    return response.json();
  },

  setProductDiscount: async (productId: number, discountPercent: number): Promise<Product> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/set_discount/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ discount_percent: discountPercent }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set product discount');
    }

    return response.json();
  },

  applyBulkDiscount: async (productIds: number[], discountPercent: number): Promise<void> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/bulk_discount/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({
        product_ids: productIds,
        discount_percent: discountPercent,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to apply bulk discount');
    }
  },

  approveProductPrice: async (productId: number): Promise<Product> => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/api/products/${productId}/approve_price/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to approve product price');
    }

    return response.json();
  },

  getPendingComments: async (): Promise<ProductComment[]> => {
    const response = await fetch(`${BASE_URL}/api/comments/pending/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pending comments');
    }

    return response.json();
  },
};
