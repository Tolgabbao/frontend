'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

// Create a separate client component that uses useSearchParams
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  // Get the redirect path from URL using useEffect to ensure it only runs client-side
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setRedirectPath(searchParams.get('redirect'));
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (redirectPath) {
        router.push(`/${redirectPath}`);
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, authLoading, router, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        if (redirectPath) {
          router.push(`/${redirectPath}`);
        } else {
          router.push('/');
        }
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      setError('An error occurred during login');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If still checking authentication or already authenticated, show loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // If already authenticated, the useEffect will handle the redirect
  if (isAuthenticated) {
    return null;
  }

  // Show login form
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-5 text-foreground">Login</h1>
      {error && <div className="text-error mb-4 p-3 rounded bg-error/10">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-medium-gray rounded p-2 bg-background text-foreground"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-foreground">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-medium-gray rounded p-2 bg-background text-foreground"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-primary text-background p-2 rounded hover:bg-secondary"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <p className="mt-4 text-center text-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-accent hover:text-secondary">
          Register
        </Link>
      </p>
    </div>
  );
}

// Loading fallback component
function LoginLoading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
