const BASE_URL = "http://localhost:8000";

export interface Category {
  id: number;
  name: string;
  description: string;
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
  image_url: string;
  is_visible: boolean; // Changed from boolean | undefined to boolean
}

export interface ProductComment {
  id: number;
  user: string;
  content: string;
  created_at: string;
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
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
}

export const productsApi = {
  getProducts: async (params: ProductQueryParams = {}): Promise<Product[]> => {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append("search", params.search);
    if (params.category) queryParams.append("category", params.category);
    if (params.ordering) queryParams.append("ordering", params.ordering);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());
    if (params.featured) queryParams.append("featured", "true");

    const queryString = queryParams.toString()
      ? `?${queryParams.toString()}`
      : "";
    const response = await fetch(`${BASE_URL}/api/products/${queryString}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await response.json();

    // Handle different response formats
    if (Array.isArray(data)) {
      // If data is already an array, return it directly
      return data;
    } else if (data.results && Array.isArray(data.results)) {
      // If data has a results property that is an array (pagination response)
      return data.results;
    } else if (data && typeof data === "object") {
      // If data is a single object, wrap it in an array
      console.warn(
        "API returned a single object instead of an array, converting to array",
      );
      return [data];
    } else {
      // If data is in an unexpected format, return an empty array and log an error
      console.error("Received unexpected data format from API:", data);
      return [];
    }
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await fetch(`${BASE_URL}/api/products/${id}/`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch product");
    }

    return response.json();
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await fetch(`${BASE_URL}/api/categories/`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await response.json();
    return data.results || data;
  },

  getTopRatedProducts: async (limit: number = 5): Promise<Product[]> => {
    const response = await fetch(
      `${BASE_URL}/api/products/top_rated/?limit=${limit}`,
      {
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch top rated products");
    }

    const data = await response.json();
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else if (data && typeof data === "object") {
      return [data];
    } else {
      console.error("Received unexpected data format from API:", data);
      return [];
    }
  },

  getNewestProducts: async (limit: number = 5): Promise<Product[]> => {
    const response = await fetch(
      `${BASE_URL}/api/products/newest/?limit=${limit}`,
      {
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch newest products");
    }

    const data = await response.json();
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else if (data && typeof data === "object") {
      return [data];
    } else {
      console.error("Received unexpected data format from API:", data);
      return [];
    }
  },

  getBestSellingProducts: async (limit: number = 5): Promise<Product[]> => {
    const response = await fetch(
      `${BASE_URL}/api/products/best_selling/?limit=${limit}`,
      {
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch best selling products");
    }

    const data = await response.json();
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else if (data && typeof data === "object") {
      return [data];
    } else {
      console.error("Received unexpected data format from API:", data);
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
    const response = await fetch(
      `${BASE_URL}/api/products/${productId}/rate_product/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Failed to rate product");
    return response.json();
  },

  commentProduct: async (productId: number, content: string) => {
    const response = await fetch(
      `${BASE_URL}/api/products/${productId}/comment_product/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Failed to add comment");
    return response.json();
  },

  // Admin functions
  getAdminProducts: async (): Promise<Product[]> => {
    const response = await fetch(`${BASE_URL}/api/products/`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch admin products");
    }

    const data = await response.json();
    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else if (data && typeof data === "object") {
      return [data];
    } else {
      console.error("Received unexpected data format from API:", data);
      return [];
    }
  },

  toggleProductVisibility: async (productId: number): Promise<void> => {
    const csrfToken = getCookie("csrftoken");
    const response = await fetch(
      `${BASE_URL}/api/products/${productId}/toggle_visibility/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to toggle product visibility");
    }

    return response.json();
  },

  createProduct: async (formData: FormData): Promise<Product> => {
    const csrfToken = getCookie("csrftoken");
    const response = await fetch(`${BASE_URL}/api/products/add-product/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": csrfToken,
      },
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create product: ${errorText}`);
    }

    return response.json();
  },

  updateProduct: async (id: number, formData: FormData): Promise<Product> => {
    const csrfToken = getCookie("csrftoken");
    const response = await fetch(`${BASE_URL}/api/products/${id}/`, {
      method: "PATCH",
      headers: {
        "X-CSRFToken": csrfToken,
      },
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to update product");
    }

    return response.json();
  },

  deleteProduct: async (id: number): Promise<void> => {
    const csrfToken = getCookie("csrftoken");
    const response = await fetch(`${BASE_URL}/api/products/${id}/`, {
      method: "DELETE",
      headers: {
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to delete product");
    }
  },
};
