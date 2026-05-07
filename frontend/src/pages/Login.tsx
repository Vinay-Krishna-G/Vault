import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Redirect back to the page that triggered the auth guard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Clear stale errors when component mounts
  useEffect(() => { clearError(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch {
      // Error is already set in store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your StudyVault account</p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="font-bold">✕</button>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Email address</label>
              <input
                type="email"
                required
                id="login-email"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                required
                id="login-password"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
