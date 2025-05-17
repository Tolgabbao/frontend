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

// Define interface for paginated response
export interface PaginatedOrdersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

export const orderApi = {
  // Modify getOrders to accept optional URL and return PaginatedOrdersResponse
  getOrders: async (url?: string): Promise<PaginatedOrdersResponse> => {
    const fetchUrl = url || `${BASE_URL}/api/orders/`; // Use provided URL or default
    const response = await fetch(fetchUrl, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const data = await response.json();

    // Ensure the response matches the expected paginated structure
    if (
      typeof data === 'object' &&
      data !== null &&
      typeof data.count === 'number' &&
      Array.isArray(data.results) &&
      (data.next === null || typeof data.next === 'string') &&
      (data.previous === null || typeof data.previous === 'string')
    ) {
      return data as PaginatedOrdersResponse;
    } else {
      // Handle potential non-paginated response or error format
      console.error('Received unexpected data format from API:', data);
      // Return a default empty paginated structure or throw a more specific error
      return { count: 0, next: null, previous: null, results: [] };
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

  downloadOrderInvoice: async (id: number): Promise<Blob> => {
    const response = await fetch(`${BASE_URL}/api/orders/${id}/download-invoice/`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download invoice: ${errorText}`);
    }

    // Return the response body as a Blob
    return await response.blob();
  },

  // Product manager functions for delivery management
  getPendingDeliveries: async (): Promise<PaginatedOrdersResponse> => {
    const response = await fetch(`${BASE_URL}/api/orders/pending_deliveries/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pending deliveries');
    }

    return await response.json();
  },

  approveOrder: async (id: number): Promise<Order> => {
    const csrfToken = getCSRFToken();
    const response = await fetch(`${BASE_URL}/api/orders/${id}/approve_order/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to approve order');
    }

    return await response.json();
  },

  updateDeliveryStatus: async (
    id: number,
    statusData: { status: string; delivery_notes: string }
  ): Promise<Order> => {
    const csrfToken = getCSRFToken();
    const response = await fetch(`${BASE_URL}/api/orders/${id}/update_delivery_status/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(statusData),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to update delivery status');
    }

    return await response.json();
  },
};
