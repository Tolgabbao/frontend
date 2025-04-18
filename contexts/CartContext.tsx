'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartResponse, cartApi } from '@/api/cart';
import { toast } from 'sonner';

// Define the ApiErrorResponse interface here too for proper typing
interface ApiErrorResponse extends Error {
  response: Response;
}

interface CartContextType {
  cart: CartResponse | null;
  cartItemCount: number;
  isLoading: boolean;
  error: string | null;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cartItemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  const refreshCart = async () => {
    setError(null);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load cart data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addItem = async (productId: number, quantity = 1) => {
    setIsLoading(true);
    try {
      const updatedCart = await cartApi.addToCart(productId, quantity);
      setCart(updatedCart);
    } catch (err) {
      console.error('Error adding item to cart:', err);

      // Handle API error responses with proper typing
      const error = err as ApiErrorResponse;
      if (error.response) {
        try {
          const errorData = await error.response.json();
          if (errorData.error) {
            setError(errorData.error);
            toast.error(errorData.error);
            return;
          }
        } catch {
          const message = error.response.statusText || 'Failed to add item to cart';
          setError(message);
          toast.error(message);
          return;
        }
      }

      // Default error message
      setError('Failed to add item to cart');
      toast.error('Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Find the item in the cart to get its product ID
      const item = cart?.items.find((item) => item.id === itemId);

      if (!item) {
        throw new Error('Item not found in cart');
      }

      // Call the API with the product ID
      await cartApi.removeItem(item.product);

      // Refresh the cart to get the updated state
      await refreshCart();
    } catch (err) {
      console.error('Error removing item from cart:', err);

      // Handle API error responses with proper typing
      const error = err as ApiErrorResponse;
      if (error.response) {
        try {
          const errorData = await error.response.json();
          if (errorData.error) {
            setError(errorData.error);
            toast.error(errorData.error);
            return;
          }
        } catch {
          const message = error.response.statusText || 'Failed to remove item';
          setError(message);
          toast.error(message);
          return;
        }
      }

      // Default error message
      setError('Failed to remove item from cart');
      toast.error('Failed to remove item from cart');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Find the item in the cart to get its product ID
      const item = cart?.items.find((item) => item.id === itemId);

      if (!item) {
        throw new Error('Item not found in cart');
      }

      // Call the API with the product ID and new quantity
      await cartApi.updateQuantity(item.product, quantity);

      // Refresh the cart to get the updated state
      await refreshCart();
    } catch (err) {
      console.error('Error updating cart item quantity:', err);

      // Handle API error responses with proper typing
      const error = err as ApiErrorResponse;
      if (error.response) {
        try {
          const errorData = await error.response.json();
          if (errorData.error) {
            setError(errorData.error);
            toast.error(errorData.error);
            return;
          }
        } catch {
          const message = error.response.statusText || 'Failed to update quantity';
          setError(message);
          toast.error(message);
          return;
        }
      }

      // Default error message
      setError('Failed to update quantity');
      toast.error('Failed to update quantity');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItemCount,
        isLoading,
        error,
        addItem,
        removeItem,
        updateQuantity,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
