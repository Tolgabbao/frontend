const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  average_rating: number;
  category: Category;
  comments: ProductComment[];
}

export interface ProductComment {
  id: number;
  user: string;
  content: string;
  created_at: string;
}

export const productsApi = {
  getProducts: async (params?: {
    search?: string;
    category?: string;
    ordering?: string;
  }): Promise<Product[]> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.ordering) queryParams.append('ordering', params.ordering);

    const response = await fetch(
      `${BASE_URL}/api/products/?${queryParams.toString()}`,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.results;
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await fetch(`${BASE_URL}/api/categories/`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return data.results;
  },

  rateProduct: async (productId: number, rating: number) => {
    const response = await fetch(`${BASE_URL}/api/products/${productId}/rate_product/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to rate product');
    return response.json();
  },

  commentProduct: async (productId: number, content: string) => {
    const response = await fetch(`${BASE_URL}/api/products/${productId}/comment_product/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
  }
};
