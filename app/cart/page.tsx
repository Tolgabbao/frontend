'use client';

import { useEffect, useState } from 'react';
import { CartItem, cartApi } from '@/api/cart';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const data = await cartApi.getCart();
      setCartItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setError('Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    try {
      await cartApi.updateQuantity(itemId, newQuantity);
      fetchCart();
    } catch (error) {
      setError('Failed to update quantity');
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await cartApi.removeItem(itemId);
      fetchCart();
    } catch (error) {
      setError('Failed to remove item');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const total = cartItems?.length ? cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b py-2">
              <div>
                <p>{item.product.name}</p>
                <p className="text-gray-500">${item.product.price}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                <button onClick={() => removeItem(item.id)}>Remove</button>
              </div>
            </div>
            ))}
            <div className="flex justify-between mt-4">
                <p className="font-bold">Total</p>
                <p>${total.toFixed(2)}</p>
            </div>
        </>
        )}
    </div>
    );

}