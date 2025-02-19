'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { authApi } from '@/api/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const response = await authApi.login(email, password);
      if (response.ok) {
        router.push('/');
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-5 text-foreground">Login</h1>
      {error && <div className="text-error mb-4">{error}</div>}
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
        <button type="submit" className="w-full bg-primary text-background p-2 rounded hover:bg-secondary">
          Login
        </button>
      </form>
      <p className="mt-4 text-center text-foreground">
        Don't have an account? <Link href="/register" className="text-accent hover:text-secondary">Register</Link>
      </p>
    </div>
  );
}
