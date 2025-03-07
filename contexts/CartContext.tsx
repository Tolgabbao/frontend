"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { CartResponse, cartApi } from "@/api/cart";

interface CartContextType {
  cart: CartResponse | null;
  cartItemCount: number;
  isLoading: boolean;
  error: string | null;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cartItemCount =
    cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  const refreshCart = async () => {
    setError(null);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError("Failed to load cart data");
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
      console.error("Error adding item to cart:", err);
      setError("Failed to add item to cart");
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (productId: number) => {
    setIsLoading(true);
    try {
      await cartApi.removeItem(productId);
      // Refresh the cart after item removal
      await refreshCart();
    } catch (err) {
      console.error("Error removing item from cart:", err);
      setError("Failed to remove item from cart");
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    setIsLoading(true);
    try {
      const updatedCart = await cartApi.updateQuantity(productId, quantity);
      setCart(updatedCart);
    } catch (err) {
      console.error("Error updating cart item quantity:", err);
      setError("Failed to update quantity");
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
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
