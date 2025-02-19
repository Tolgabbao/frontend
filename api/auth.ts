const BASE_URL = "http://localhost:8000";

function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}

export const authApi = {
  login: async (email: string, password: string) => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    
    if (!response.ok) throw new Error('Login failed');
    return response;
  },

  checkAuthStatus: async () => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/auth/user/`, {
      headers: {
        'X-CSRFToken': csrfToken
      },
      credentials: 'include'
    });
    return response.ok;
  },

  register: async (username: string, email: string, password: string) => {
    const csrfToken = getCookie('csrftoken');
    const response = await fetch(`${BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({ username, email, password }),
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Registration failed');
    return response;
  }
};
