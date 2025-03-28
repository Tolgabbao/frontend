'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  AlertCircle,
  MapPin,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { orderApi } from '@/api/order';

// Define Address interface
interface Address {
  id: number;
  name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_main: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { cart, isLoading: cartLoading, error: cartError, refreshCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageReady, setPageReady] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');

  // Address form state
  const [address, setAddress] = useState({
    fullName: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  // Get the API base URL for constructing full image URLs
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Handle authentication redirect and fetch addresses in useEffect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/checkout');
      return;
    }

    // Only proceed if user is authenticated
    if (!authLoading && isAuthenticated) {
      // Fetch user addresses
      const fetchAddresses = async () => {
        try {
          setLoadingAddresses(true);
          const response = await fetch(`${apiBaseUrl}/addresses/`, {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            const addressList = Array.isArray(data) ? data : [];
            setAddresses(addressList);

            // If there's a main address, select it by default
            const mainAddress = addressList.find((addr) => addr.is_main);
            if (mainAddress) {
              setSelectedAddressId(mainAddress.id.toString());
              fillAddressForm(mainAddress);
            }
          }
        } catch (error) {
          console.error('Error fetching addresses:', error);
        } finally {
          setLoadingAddresses(false);
        }
      };

      fetchAddresses();

      // Set initial name from user data
      if (user && user.username) {
        setAddress((prev) => ({
          ...prev,
          fullName: user.username || '',
        }));
      }

      // Set page ready when authentication check is complete
      if (!cartLoading) {
        setPageReady(true);
      }
    }
  }, [authLoading, cartLoading, isAuthenticated, router, user, apiBaseUrl]);

  // Fill the address form with selected address data
  const fillAddressForm = (selectedAddress: Address) => {
    setAddress({
      fullName: user?.username || '',
      streetAddress: selectedAddress.street_address,
      city: selectedAddress.city,
      state: selectedAddress.state,
      postalCode: selectedAddress.postal_code,
      country: selectedAddress.country,
    });
  };

  // Handle address selection change
  const handleAddressChange = (value: string) => {
    setSelectedAddressId(value);

    if (value === 'new') {
      // Clear form for new address
      setAddress({
        fullName: user?.username || '',
        streetAddress: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      });
    } else {
      // Fill form with selected address
      const selectedAddress = addresses.find((addr) => addr.id.toString() === value);
      if (selectedAddress) {
        fillAddressForm(selectedAddress);
      }
    }
  };

  // Handle address field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit the order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in
    if (!isAuthenticated) {
      toast.error('Please log in to complete your order');
      router.push('/login?callbackUrl=/checkout');
      return;
    }

    // Validate address
    for (const [key, value] of Object.entries(address)) {
      if (!value.trim()) {
        toast.error(`Please enter your ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }

    // Format shipping address as string
    const shippingAddress = `${address.fullName}\n${address.streetAddress}\n${address.city}, ${address.state} ${address.postalCode}\n${address.country}`;

    // Ensure order items are properly structured
    const orderItems =
      cart?.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      })) || [];

    // Prepare order data
    const orderData = {
      shipping_address: shippingAddress,
      items: orderItems,
      total_amount: cart?.total || 0,
    };

    console.log('Submitting order with data:', orderData); // Debug log

    setSubmitting(true);
    setError(null);

    try {
      // Create the order
      const order = await orderApi.createOrder(orderData);

      // First try to explicitly clear the cart using our API
      try {
        // Manually clear the cart after successful order creation
        await fetch(`${apiBaseUrl}/api/carts/clear/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken':
              document.cookie
                .split('; ')
                .find((row) => row.startsWith('csrftoken='))
                ?.split('=')[1] || '',
          },
          credentials: 'include',
        });
      } catch (clearError) {
        console.error('Error clearing cart:', clearError);
        // Non-blocking - we'll still try to refresh the cart
      }

      // Refresh cart state in context to reflect empty cart
      await refreshCart();

      toast.success('Order placed successfully!');
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      setError('Failed to place order. Please try again.');
      toast.error('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state until page is ready
  if (!pageReady || authLoading || cartLoading) {
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

  // If cart is empty, show message (without redirect)
  if (!cart?.items.length) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Checkout</h1>
        <Card className="text-center py-8 px-4">
          <CardContent className="flex flex-col items-center">
            <ShoppingBag className="h-16 w-16 text-medium-gray mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add items to your cart before checking out</p>
            <Button
              className="bg-primary text-background hover:bg-primary/90 hover:scale-105 transition-all duration-200"
              asChild
            >
              <Link href="/products">
                Explore Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 bg-error/10 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-error mr-2 mt-0.5" />
          <p className="text-error">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Shipping address */}
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader className="border-b border-medium-gray">
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingAddresses ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <form className="space-y-6">
                  {/* Address Selection */}
                  <div className="mb-4">
                    <Label htmlFor="addressSelect" className="mb-2 block">
                      Select Address
                    </Label>
                    <Select value={selectedAddressId} onValueChange={handleAddressChange}>
                      <SelectTrigger id="addressSelect" className="w-full">
                        <SelectValue placeholder="Select an address" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new" className="flex items-center">
                          <Plus className="w-4 h-4 mr-2" />
                          <span>Use a new address</span>
                        </SelectItem>
                        {addresses.map((addr) => (
                          <SelectItem key={addr.id} value={addr.id.toString()}>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>
                                {addr.name}
                                {addr.is_main && ' (Main)'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={address.fullName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="streetAddress">Street Address</Label>
                      <Textarea
                        id="streetAddress"
                        name="streetAddress"
                        value={address.streetAddress}
                        onChange={handleInputChange}
                        placeholder="123 Main St, Apt 4B"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={address.city}
                          onChange={handleInputChange}
                          placeholder="New York"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          name="state"
                          value={address.state}
                          onChange={handleInputChange}
                          placeholder="NY"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={address.postalCode}
                          onChange={handleInputChange}
                          placeholder="10001"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={address.country}
                          onChange={handleInputChange}
                          placeholder="United States"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-medium-gray">
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="px-0 py-0">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center py-4 px-6 border-b border-medium-gray last:border-0"
                >
                  <div className="h-16 w-16 relative mr-4 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                    <Image
                      src={`${apiBaseUrl}/api/products/${item.product}/image/`}
                      alt={item.product_name}
                      fill
                      sizes="64px"
                      className="object-cover"
                      onError={() =>
                        console.error(`Failed to load image for product ${item.product}`)
                      }
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.product_name}</p>
                    <p className="text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${Number(item.product_price).toFixed(2)}</p>
                    <p className="text-muted-foreground text-sm">
                      Subtotal: ${(Number(item.product_price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Order summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader className="border-b border-medium-gray">
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
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
            <CardFooter className="flex-col gap-4">
              <Button
                className="w-full bg-primary text-background hover:bg-primary/90 hover:scale-105 transition-all duration-200"
                onClick={handleSubmitOrder}
                disabled={submitting || loadingAddresses}
              >
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Place Order
                  </>
                )}
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/cart">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Cart
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
