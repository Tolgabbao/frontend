const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Function to get CSRF token from cookies
const getCSRFToken = () => {
  const name = 'csrftoken';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`); 
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return '';
};

export interface CartResponse {
  id: number;
  items: CartItem[];
  total: number;
}

export interface CartItem {
  id: number;
  product: number;
  product_name: string;
  product_price: string;
  quantity: number;
}

export const cartApi = {
  getCart: async (): Promise<CartResponse> => {
    const response = await fetch(`${BASE_URL}/api/carts/items`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch cart');
    return response.json();
  },

  addToCart: async (productId: number, quantity: number) => {
    const response = await fetch(`${BASE_URL}/api/carts/add/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken() || ''
      },
      body: JSON.stringify({ product_id: productId, quantity }),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to add to cart');
    return response.json();
  },

  updateQuantity: async (itemId: number, quantity: number) => {
    const response = await fetch(`${BASE_URL}/api/carts/${itemId}/`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken() || ''
      },
      body: JSON.stringify({ quantity }),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to update quantity');
    return response.json();
  },

  removeItem: async (itemId: number) => {
    const response = await fetch(`${BASE_URL}/api/carts/${itemId}/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': getCSRFToken() || ''
      },
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to remove item');
  }
};
