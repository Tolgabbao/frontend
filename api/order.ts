const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Function to get CSRF token from cookies
const getCSRFToken = () => {
  const name = 'csrftoken';
  if (typeof document === 'undefined') return '';

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
};

export interface OrderItem {
  product: number;
  quantity: number;
}

export interface PaymentInfo {
  card_last_four: string;
  card_holder: string;
  expiry_date: string; // Format: MM/YY
}

export interface OrderRequest {
  shipping_address: string;
  items: OrderItem[];
  total_amount: number;
  payment_info: PaymentInfo;
}

export interface Order {
  id: number;
  user: number;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  shipping_address: string;
  items: {
    id: number;
    product: number;
    product_name: string;
    quantity: number;
    price_at_time: number;
  }[];
}

export const orderApi = {
  getOrders: async (): Promise<Order[]> => {
    const response = await fetch(`${BASE_URL}/api/orders/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
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

  getOrder: async (id: number): Promise<Order> => {
    const response = await fetch(`${BASE_URL}/api/orders/${id}/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }

    return await response.json();
  },

  createOrder: async (orderData: OrderRequest): Promise<Order> => {
    const csrfToken = getCSRFToken();

    const response = await fetch(`${BASE_URL}/api/orders/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(orderData),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create order: ${errorText}`);
    }

    return await response.json();
  },

  cancelOrder: async (id: number): Promise<void> => {
    const csrfToken = getCSRFToken();

    const response = await fetch(`${BASE_URL}/api/orders/${id}/cancel_order/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to cancel order');
    }
  },
};
