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

export interface RefundRequest {
  id: number;
  order_item: number;
  user: number;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
  approved_by: number | null;
  approval_date: string | null;
  rejection_reason: string;
  product_name: string;
  username: string;
  order_id: number;
  approved_by_name: string | null;
}

export interface CreateRefundRequest {
  order_item: number;
  reason: string;
}

export const refundApi = {
  getMyRefunds: async (): Promise<RefundRequest[]> => {
    const response = await fetch(`${BASE_URL}/api/refunds/my_refunds/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch refunds');
    }

    return await response.json();
  },

  getPendingRefunds: async (): Promise<RefundRequest[]> => {
    const response = await fetch(`${BASE_URL}/api/refunds/pending_refunds/`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pending refunds');
    }

    return await response.json();
  },

  createRefundRequest: async (data: CreateRefundRequest): Promise<RefundRequest> => {
    const csrfToken = getCSRFToken();

    const response = await fetch(`${BASE_URL}/api/refunds/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create refund request');
    }

    return await response.json();
  },

  cancelRefundRequest: async (id: number): Promise<void> => {
    const csrfToken = getCSRFToken();

    const response = await fetch(`${BASE_URL}/api/refunds/${id}/`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cancel refund request');
    }
  },

  approveRefundRequest: async (id: number): Promise<RefundRequest> => {
    const csrfToken = getCSRFToken();

    const response = await fetch(`${BASE_URL}/api/refunds/${id}/approve/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to approve refund request');
    }

    return await response.json();
  },

  rejectRefundRequest: async (id: number, rejection_reason: string): Promise<RefundRequest> => {
    const csrfToken = getCSRFToken();

    const response = await fetch(`${BASE_URL}/api/refunds/${id}/reject/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ rejection_reason }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to reject refund request');
    }

    return await response.json();
  },
};
