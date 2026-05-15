import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [farmName, setFarmName] = useState('');  // ← NEW
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (resetMode) {
      // Password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the password reset link');
        setTimeout(() => setResetMode(false), 3000);
      }
      setLoading(false);
      return;
    }

    if (isLogin) {
      // Login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = '/Browse';
      }
    } else {
      // Signup - with farm name
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            farm_name: farmName  // ← ADDED
          },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for confirmation!');
        setTimeout(() => setIsLogin(true), 3000);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <Link to="/">
              <h1 className="text-3xl font-bold text-primary mb-2">iBreedr</h1>
            </Link>
            <p className="text-sm text-muted-foreground">
              {resetMode
                ? 'Reset your password'
                : isLogin
                  ? 'Welcome back!'
                  : 'Create your account'}
            </p>
          </div>

          {/* Error / Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-700 text-sm text-center">
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !resetMode && (
              <>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Farmer"
                    className="mt-1"
                    required={!isLogin}
                  />
                </div>
                <div>
                  <Label htmlFor="farmName">Farm/Business Name *</Label>
                  <Input
                    id="farmName"
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="Green Valley Farm"
                    className="mt-1"
                    required={!isLogin}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This name will appear on all your listings
                  </p>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1"
                required
              />
            </div>

            {!resetMode && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1"
                  required
                  minLength={6}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading
                ? 'Loading...'
                : resetMode
                  ? 'Send Reset Link'
                  : isLogin
                    ? 'Login'
                    : 'Sign Up'}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm space-y-2">
            {!resetMode ? (
              <>
                <p className="text-muted-foreground">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    {isLogin ? 'Sign Up' : 'Login'}
                  </button>
                </p>
                {isLogin && (
                  <button
                    onClick={() => {
                      setResetMode(true);
                      setError('');
                    }}
                    className="text-muted-foreground hover:text-primary text-xs"
                  >
                    Forgot password?
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => {
                  setResetMode(false);
                  setError('');
                }}
                className="text-primary hover:underline font-medium"
              >
                Back to Login
              </button>
            )}
          </div>

          {/* Trust Badge */}
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}