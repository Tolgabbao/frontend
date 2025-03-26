// When main address changed or address deleted functions works but gives error message
// When editing main address if set main address gets unticked then there is no main address
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Address type definition based on your backend model
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

interface AddressesSectionProps {
  profile: UserDetails | null;
  setProfile: React.Dispatch<React.SetStateAction<UserDetails | null>>; // Add this line
}

// Component for displaying and managing user addresses
export default function AddressesSection({ profile, setProfile }: AddressesSectionProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    name: "",
    street_address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    is_main: false
  });

  useEffect(() => {
    // If profile is loaded and has addresses, use them
    if (profile && profile.addresses) {
      setAddresses(profile.addresses);
      setLoading(false);
    } else {
      // Otherwise fetch addresses separately
      fetchAddresses();
    }
  }, [profile]);

  const fetchAddresses = async () => {
    try {
      const response = await fetch("http://localhost:8000/addresses/", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched addresses from backend:", data);
        setAddresses(Array.isArray(data) ? data : []);
      } else {
        throw new Error("Failed to fetch addresses");
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setError("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      street_address: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      is_main: false
    });
    setEditingAddressId(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (address: Address) => {
    setFormData({
      name: address.name,
      street_address: address.street_address,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_main: address.is_main
    });
    setEditingAddressId(address.id);
    setShowForm(true);
  };

  const getCSRFToken = () => {
    return document.cookie.split("; ")
      .find(row => row.startsWith("csrftoken="))
      ?.split("=")[1];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    try {
      const csrfToken = getCSRFToken();
      let response;
  
      if (formData.is_main) {
        // Ensure only one main address exists
        setAddresses(addresses.map(addr => ({ ...addr, is_main: false })));
      }
  
      if (editingAddressId) {
        response = await fetch(`http://localhost:8000/addresses/${editingAddressId}/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch("http://localhost:8000/addresses/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify(formData),
        });
      }
  
      const responseData = await response.json();
  
      if (response.ok) {
        setAddresses(prev =>
          editingAddressId
            ? prev.map(addr => (addr.id === editingAddressId ? responseData : addr))
            : [...prev, responseData]
        );
        setShowForm(false);
        resetForm();
      } else {
        throw new Error(responseData?.detail || "Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const csrfToken = getCSRFToken();
      const response = await fetch(`http://localhost:8000/addresses/${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken, // Include CSRF token
        },
      });
      
      if (response.ok) {
          let updatedAddresses = addresses.filter(addr => addr.id !== id);

          // Ensure updatedAddresses is always an array
          if (!Array.isArray(updatedAddresses)) {
            updatedAddresses = [];
          }
        
        // If the deleted address was main, assign the first available address as main
        if (updatedAddresses.length > 0 && updatedAddresses.every(addr => !addr.is_main)) {
          updatedAddresses[0].is_main = true;
        }

        setAddresses(updatedAddresses);
        updateProfileMainAddress(updatedAddresses);
        setError("");
      } else {
        throw new Error("Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      setError("Failed to delete address");
    } finally {
      setLoading(false);
    }
  };

  const handleSetMain = async (id: number) => {
    setLoading(true);
    setError(""); // Clear previous errors
  
    try {
      const csrfToken = getCSRFToken();
      const response = await fetch(`http://localhost:8000/addresses/${id}/set-main/`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
      });
  
      if (response.ok) {
        let updatedAddresses = addresses.map(addr => ({
          ...addr,
          is_main: addr.id === id,
        }));

        // Ensure updatedAddresses is always an array
        if (!Array.isArray(updatedAddresses)) {
          updatedAddresses = [];
        }
  
        setAddresses(updatedAddresses);
        
        // Find the new main address and update profile
        const newMainAddress = updatedAddresses.find(addr => addr.id === id);
        if (newMainAddress) {
          updateProfileMainAddress(newMainAddress);
        }
        setError("");
      } else {
        throw new Error("Failed to set as main address");
      }
    } catch (error) {
      console.error("Error setting main address:", error);
      setError("Failed to set as main address");
    } finally {
      setLoading(false);
    }
  };
  

  // Update profile's main address immediately
  const updateProfileMainAddress = (updatedAddresses) => {
    if (profile) {
      // Ensure updatedAddresses is an array, even if it's a single object
      if (!Array.isArray(updatedAddresses)) {
        updatedAddresses = [updatedAddresses]; // Wrap it in an array if it's a single object
      }
      
      // Now that we know updatedAddresses is an array, find the main address
      const mainAddress = updatedAddresses.find(addr => addr.is_main) || null;
      
      // Update the profile with the main address
      setProfile({ ...profile, main_address: mainAddress });
      
      console.log("Updated addresses: ", updatedAddresses);
    }
  };
  

  if (loading && addresses.length === 0) {
    return (
      <div className="bg-background border border-medium-gray rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Addresses</h2>
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border border-medium-gray rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground">Addresses</h2>
        <button
          onClick={handleAddNew}
          className="bg-primary text-background px-4 py-2 rounded hover:bg-opacity-90"
        >
          Add New Address
        </button>
      </div>

      {error && (
        <div className="bg-error bg-opacity-10 text-error p-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-light-gray p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingAddressId ? "Edit Address" : "Add New Address"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-dark-gray mb-1">Name/Label</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Home, Work, etc."
                  className="w-full p-2 border border-medium-gray rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-dark-gray mb-1">Street Address</label>
                <input
                  type="text"
                  name="street_address"
                  value={formData.street_address}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  className="w-full p-2 border border-medium-gray rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-dark-gray mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="w-full p-2 border border-medium-gray rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-dark-gray mb-1">State/Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State or province"
                  className="w-full p-2 border border-medium-gray rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-dark-gray mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  placeholder="Postal or ZIP code"
                  className="w-full p-2 border border-medium-gray rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-dark-gray mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                  className="w-full p-2 border border-medium-gray rounded"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_main"
                name="is_main"
                checked={formData.is_main}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="is_main" className="text-dark-gray">
                Set as main address
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="border border-medium-gray px-4 py-2 rounded hover:bg-light-gray"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary text-background px-4 py-2 rounded hover:bg-opacity-90"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Address"}
              </button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-dark-gray text-center py-8">
          <p>You haven't added any addresses yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="border border-medium-gray rounded-lg p-4 relative"
            >
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium text-foreground">{address.name}</h3>
                    {address.is_main && (
                      <span className="ml-2 bg-success text-background text-xs px-2 py-1 rounded">
                        Main
                      </span>
                    )}
                  </div>
                  <p className="text-dark-gray mt-1">{address.street_address}</p>
                  <p className="text-dark-gray">
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                  <p className="text-dark-gray">{address.country}</p>
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="text-primary text-sm hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-error text-sm hover:underline"
                  >
                    Delete
                  </button>
                  {!address.is_main && (
                    <button
                      onClick={() => handleSetMain(address.id)}
                      className="text-success text-sm hover:underline"
                    >
                      Set as Main
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}