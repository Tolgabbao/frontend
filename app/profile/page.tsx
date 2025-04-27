'use client';

import { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { UserDetails } from '@/contexts/AuthContext';
import AddressesSection from '../../components/AddressesSection';
import { orderApi, Order } from '@/api/order'; // Order interface is already imported
import { Button } from '@/components/ui/button'; // Import Button
import { ArrowLeft, ArrowRight } from 'lucide-react'; // Import pagination icons

// Define page size (adjust if your backend uses a different size)
const PAGE_SIZE = 10;

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserDetails | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true); // Separate loading for profile
  const [loadingOrders, setLoadingOrders] = useState(false); // Separate loading for orders
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Pagination state for orders tab
  const [orderCount, setOrderCount] = useState(0);
  const [orderNextPageUrl, setOrderNextPageUrl] = useState<string | null>(null);
  const [orderPrevPageUrl, setOrderPrevPageUrl] = useState<string | null>(null);
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);

  // Fetch profile details
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const profileData = await authApi.getUserDetails();
        setProfile(profileData);
      } catch (err) {
        setError('Please log in to view your profile');
        console.error('Failed to fetch profile data:', err);
        router.push('/login');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [router]);

  // Fetch orders function with pagination support for profile tab
  const fetchOrdersForProfile = useCallback(async (url?: string) => {
    setLoadingOrders(true);
    setError(''); // Clear previous errors specific to orders
    try {
      const data = await orderApi.getOrders(url);
      setOrders(data.results);
      setOrderCount(data.count);
      setOrderNextPageUrl(data.next);
      setOrderPrevPageUrl(data.previous);

      // Refined current page calculation
      let calculatedPage = 1;
      if (data.previous) {
        const prevMatch = data.previous.match(/page=(\d+)/);
        if (prevMatch) {
          calculatedPage = parseInt(prevMatch[1]) + 1;
        } else {
          calculatedPage = 2; // Assume page 2 if previous exists but no page number
        }
      } else {
        calculatedPage = 1; // Must be page 1
      }
      // Validate against total pages
      const totalPages = Math.ceil(data.count / PAGE_SIZE);
      calculatedPage = Math.min(calculatedPage, totalPages > 0 ? totalPages : 1);
      calculatedPage = Math.max(1, calculatedPage);
      setOrderCurrentPage(calculatedPage);
    } catch (orderError) {
      console.error('Failed to fetch orders for profile:', orderError);
      setError('Failed to load order history.'); // Set specific error
    } finally {
      setLoadingOrders(false);
    }
  }, []); // No dependencies needed here as it's called manually or via effect below

  // Fetch initial orders when the 'orders' tab becomes active
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrdersForProfile(); // Fetch first page
    }
  }, [activeTab, fetchOrdersForProfile]);

  // Handlers for order pagination buttons
  const handleOrderNextPage = () => {
    if (orderNextPageUrl) {
      fetchOrdersForProfile(orderNextPageUrl);
    }
  };

  const handleOrderPrevPage = () => {
    if (orderPrevPageUrl) {
      fetchOrdersForProfile(orderPrevPageUrl);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to logout', error);
      setError('Failed to logout');
    }
  };

  if (loadingProfile) {
    // Only block based on profile loading initially
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate total pages for orders using PAGE_SIZE
  const totalOrderPages = Math.ceil(orderCount / PAGE_SIZE);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-foreground mb-6">My Account</h1>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-medium-gray">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-4 ${
              activeTab === 'profile' ? 'border-b-2 border-primary font-semibold' : 'text-dark-gray'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-2 px-4 ${
              activeTab === 'addresses'
                ? 'border-b-2 border-primary font-semibold'
                : 'text-dark-gray'
            }`}
          >
            Addresses
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-4 ${
              activeTab === 'orders' ? 'border-b-2 border-primary font-semibold' : 'text-dark-gray'
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && profile && (
        <div className="bg-background border border-medium-gray rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-6">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="text-dark-gray">Username</label>
              <p className="text-foreground font-medium">{profile.username}</p>
            </div>
            <div>
              <label className="text-dark-gray">Email</label>
              <p className="text-foreground font-medium">{profile.email}</p>
            </div>
            <div>
              <label className="text-dark-gray">Member Since</label>
              <p className="text-foreground font-medium">
                {new Date(profile.date_joined || '').toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-error text-white px-4 py-2 rounded hover:bg-white hover:text-error border border-error transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && <AddressesSection profile={profile} />}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-background border border-medium-gray rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Order History</h2>
          {loadingOrders ? (
            <div className="flex justify-center items-center min-h-[20vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error && activeTab === 'orders' ? ( // Show order-specific error
            <p className="text-error">{error}</p>
          ) : !orders || orders.length === 0 ? (
            <p className="text-dark-gray">No orders found</p>
          ) : (
            <>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border-b border-medium-gray pb-4 last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-foreground font-medium">Order #{order.id}</span>
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          order.status === 'DELIVERED'
                            ? 'bg-success text-background'
                            : order.status === 'PROCESSING'
                              ? 'bg-warning text-background'
                              : order.status === 'CANCELLED'
                                ? 'bg-error text-background'
                                : 'bg-secondary text-background' // For IN_TRANSIT or other statuses
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="text-dark-gray text-sm mb-2">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>

                    {/* Order items */}
                    <div className="mt-2 bg-muted p-2 rounded">
                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Items:</p>
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                {item.product_name} × {item.quantity}
                              </span>
                              <span>${(item.price_at_time * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm italic text-muted-foreground">No items found</div>
                      )}
                    </div>

                    <div className="mt-2 text-right font-bold">
                      Total: ${Number(order.total_amount).toFixed(2)}
                    </div>

                    <div className="mt-2 text-right">
                      <a
                        href={`/orders/${order.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View Order Details →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Pagination Controls */}
              {orderCount > PAGE_SIZE && ( // Show pagination only if count > page size
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-medium-gray">
                  <Button
                    variant="outline"
                    size="sm" // Smaller buttons for profile page
                    onClick={handleOrderPrevPage}
                    disabled={!orderPrevPageUrl || loadingOrders}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {/* Display calculated total pages */}
                    Page {orderCurrentPage} of {totalOrderPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOrderNextPage}
                    disabled={!orderNextPageUrl || loadingOrders}
                  >
                    Next
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
