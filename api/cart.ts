const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
  };
  quantity: number;
}

export const cartApi = {
  getCart: async (): Promise<CartItem[]> => {
    const response = await fetch(`${BASE_URL}/api/carts/`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch cart');
    return response.json();
  },

  addToCart: async (productId: number, quantity: number) => {
    const response = await fetch(`${BASE_URL}/api/carts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity }),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to add to cart');
    return response.json();
  },

  updateQuantity: async (itemId: number, quantity: number) => {
    const response = await fetch(`${BASE_URL}/api/carts/${itemId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to update quantity');
    return response.json();
  },

  removeItem: async (itemId: number) => {
    const response = await fetch(`${BASE_URL}/api/carts/${itemId}/`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to remove item');
  }
};
