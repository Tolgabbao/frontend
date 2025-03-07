import { UserDetails } from "@/contexts/AuthContext";

const BASE_URL = "http://localhost:8000";

function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
  return "";
}

export const authApi = {
  login: async (email: string, password: string) => {
    const csrfToken = getCookie("csrftoken");
    return await fetch(`${BASE_URL}/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
  },

  checkAuthStatus: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BASE_URL}/auth/user/`, {
        credentials: "include",
      });
      return response.ok;
    } catch (error) {
      console.error("Error checking auth status:", error);
      return false;
    }
  },

  getUserDetails: async (): Promise<UserDetails> => {
    const response = await fetch(`${BASE_URL}/auth/user/`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user details");
    }

    const userData = await response.json();
    // Make sure is_staff is properly captured from the API response
    return {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      date_joined: userData.date_joined,
      is_staff: userData.is_staff,
    };
  },

  register: async (username: string, email: string, password: string) => {
    const csrfToken = getCookie("csrftoken");
    return await fetch(`${BASE_URL}/auth/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ username, email, password }),
      credentials: "include",
    });
  },

  logout: async () => {
    const csrfToken = getCookie("csrftoken");
    const response = await fetch(`${BASE_URL}/auth/logout/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": csrfToken,
      },
      credentials: "include",
    });

    if (!response.ok) throw new Error("Logout failed");
    return response;
  },
};
