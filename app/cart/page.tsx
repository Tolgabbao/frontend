"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const {
    cart,
    isLoading,
    error: cartError,
    updateQuantity,
    removeItem,
    refreshCart,
  } = useCart();
  const [updatingItems, setUpdatingItems] = useState<Record<number, boolean>>(
    {},
  );

  // Get the API base URL for constructing full image URLs - same approach as ProductsContent
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    // Don't allow quantity less than 1
    if (newQuantity < 1) return;

    // Set the specific item as updating
    setUpdatingItems((prev) => ({ ...prev, [itemId]: true }));

    try {
      await updateQuantity(itemId, newQuantity);
      toast.success("Quantity updated");
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    } finally {
      // Clear the updating state for this item
      setUpdatingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setUpdatingItems((prev) => ({ ...prev, [itemId]: true }));
    try {
      await removeItem(itemId);
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-error/10 rounded-lg text-error text-center">
        <p className="font-medium">{cartError}</p>
        <Button variant="outline" className="mt-4" onClick={refreshCart}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Shopping Cart</h1>

      {!cart?.items.length ? (
        <Card className="text-center py-8 px-4">
          <CardContent className="flex flex-col items-center">
            <ShoppingBag className="h-16 w-16 text-medium-gray mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to add items to your cart
            </p>
            <Button className="bg-primary text-background hover:bg-primary/90 hover:scale-105 transition-all duration-200" asChild>
              <Link href="/products">
                Explore Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6 border-medium-gray">
            <CardHeader className="border-b border-medium-gray">
              <CardTitle>Cart Items</CardTitle>
            </CardHeader>
            <CardContent className="px-0 py-0">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center py-4 px-6 border-b border-medium-gray last:border-0"
                >
                  <div className="h-16 w-16 relative mr-4 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                    {/* Using the same approach as ProductsContent for image URLs */}
                    <Image
                      src={`${apiBaseUrl}/api/products/${item.product}/image/`}
                      alt={item.product_name}
                      fill
                      sizes="64px"
                      className="object-cover"
                      onError={() =>
                        console.error(
                          `Failed to load image for product ${item.product}`,
                        )
                      }
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {item.product_name}
                      </p>
                      <p className="text-primary font-bold">
                        ${item.product_price}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={
                            updatingItems[item.id] || item.quantity <= 1
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={updatingItems[item.id]}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-error hover:text-error hover:bg-error/10"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={updatingItems[item.id]}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-medium-gray">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-medium-gray my-2 pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
              <Button className="bg-primary text-background hover:bg-primary/90 hover:scale-105 transition-all duration-200" asChild>
                <Link href="/checkout">Checkout</Link>
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
