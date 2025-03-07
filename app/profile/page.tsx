"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/api/auth";
import { UserDetails } from "@/contexts/AuthContext";

interface Order {
  id: number;
  created_at: string;
  status: string;
  total: number;
  items: {
    product: {
      name: string;
      price: number;
    };
    quantity: number;
  }[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserDetails | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Fetch user profile
        const profile = await authApi.getUserDetails();
        setProfile(profile);

        // Fetch order history
        const ordersResponse = await fetch(
          "http://localhost:8000/api/orders/",
          {
            credentials: "include",
          },
        );
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();

          // Make sure ordersData is an array
          if (Array.isArray(ordersData)) {
            setOrders(ordersData);
          } else if (
            ordersData &&
            ordersData.results &&
            Array.isArray(ordersData.results)
          ) {
            // If API returns paginated results
            setOrders(ordersData.results);
          } else if (ordersData && typeof ordersData === "object") {
            // If API returns a single order as object
            setOrders([ordersData]);
          } else {
            console.error("Invalid orders data format:", ordersData);
            setOrders([]);
          }
        }
      } catch (error) {
        setError("Please log in to view your profile");
        console.error("Failed to fetch profile data:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      router.push("/login");
    } catch (error) {
      console.error("Failed to logout", error);
      setError("Failed to logout");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-error text-center mt-8">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-background border border-medium-gray rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>
        {profile && (
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
                {new Date(profile.date_joined || "").toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-error text-background px-4 py-2 rounded hover:bg-opacity-90"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="bg-background border border-medium-gray rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Order History
        </h2>
        {!orders || orders.length === 0 ? (
          <p className="text-dark-gray">No orders found</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border-b border-medium-gray pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-foreground font-medium">
                    Order #{order.id}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      order.status === "DELIVERED"
                        ? "bg-success text-background"
                        : order.status === "PROCESSING"
                          ? "bg-warning text-background"
                          : "bg-error text-background"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="text-dark-gray text-sm">
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
                <div className="mt-2">
                  {order.items && Array.isArray(order.items) ? (
                    order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.product.name} x{item.quantity}
                        </span>
                        <span>
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm">No items found</div>
                  )}
                </div>
                <div className="mt-2 text-right font-bold">
                  Total: ${(order.total || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
