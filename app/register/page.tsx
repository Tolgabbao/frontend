'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { authApi } from '@/api/auth';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await authApi.register(
                formData.username,
                formData.email,
                formData.password
            );

            if (response.ok) {
                router.push('/login');
            } else {
                const data = await response.json();
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred during registration');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <h1 className="text-2xl font-bold mb-5 text-foreground">Register</h1>
            {error && <div className="text-error mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 text-foreground">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full border border-medium-gray rounded p-2 bg-background text-foreground"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1 text-foreground">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border border-medium-gray rounded p-2 bg-background text-foreground"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1 text-foreground">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full border border-medium-gray rounded p-2 bg-background text-foreground"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1 text-foreground">Confirm Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full border border-medium-gray rounded p-2 bg-background text-foreground"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-primary text-background p-2 rounded hover:bg-secondary"
                >
                    Register
                </button>
            </form>
            <p className="mt-4 text-center text-foreground">
                Already have an account? <Link href="/login" className="text-accent hover:text-secondary">Login</Link>
            </p>
        </div>
    );
}
