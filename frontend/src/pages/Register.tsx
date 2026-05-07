import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        ...formData,
        profileIdentity: { avatar: '🐼', color: '#aa3bff' } // Default profile
      });
      navigate('/dashboard'); // We'll create this soon!
    } catch (err) {
      // Error is handled in store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h2>
          <p className="mt-2 text-sm text-muted-foreground">Join StudyVault today</p>
        </div>
        
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Username</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={30}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Email address</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
