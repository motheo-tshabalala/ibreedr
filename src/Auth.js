import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Building2, Mail, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetMode, setResetMode] = useState(false);

  // ✅ FIXED - Detect email confirmation redirect and show a clear success message
  // Supabase redirects here with ?confirmed=true after the user clicks the
  // confirmation link in their email (see emailRedirectTo below).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('confirmed') === 'true') {
      setMessage('Email confirmed! You can now log in.');
      setIsLogin(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (resetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } else {
      // ✅ FIXED - explicitly set emailRedirectTo so the confirmation link
      // always sends the user back to the correct live domain (or localhost
      // during local testing), instead of relying on Supabase's dashboard
      // Site URL setting alone. window.location.origin automatically resolves
      // to https://www.ibreedr.co.za in production and http://localhost:3000
      // during local dev — no hardcoding needed.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            farm_name: farmName || fullName
          },
          emailRedirectTo: `${window.location.origin}/login?confirmed=true`
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Account created! Check your email and click the confirmation link to activate your account.');
        setTimeout(() => setIsLogin(true), 3000);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <Link to="/">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building2 className="w-8 h-8 text-primary-green" />
                <h1 className="text-3xl font-bold text-primary-green">iBreedr</h1>
              </div>
            </Link>
            <p className="text-sm text-gray-500">
              {resetMode
                ? 'Reset your password'
                : isLogin
                  ? 'Welcome back to your farm network'
                  : 'Join the livestock marketplace'}
            </p>
          </div>

          {/* Error / Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-green-600">{message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !resetMode && (
              <>
                <div>
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Farmer"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="farmName" className="text-sm font-medium text-gray-700">
                    Farm/Business Name <span className="text-gray-400 text-xs">(optional)</span>
                  </Label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="farmName"
                      type="text"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="Your farm name"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    This will appear on all your listings. You can change it later.
                  </p>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {!resetMode && (
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
                {!isLogin && (
                  <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-green hover:bg-primary-green-dark text-white py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Loading...
                </span>
              ) : resetMode ? (
                'Send Reset Link'
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            {!resetMode ? (
              <>
                <p className="text-sm text-gray-600">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setMessage('');
                    }}
                    className="text-primary-green hover:underline font-medium"
                  >
                    {isLogin ? 'Create Account' : 'Sign In'}
                  </button>
                </p>
                {isLogin && (
                  <button
                    onClick={() => {
                      setResetMode(true);
                      setError('');
                      setMessage('');
                    }}
                    className="text-sm text-gray-400 hover:text-primary-green transition"
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
                  setMessage('');
                }}
                className="text-sm text-primary-green hover:underline font-medium"
              >
                ← Back to Sign In
              </button>
            )}
          </div>

          {/* Trust Badge */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              By continuing, you agree to our Terms of Service and{' '}
              <Link to="/privacy" className="text-primary-green hover:underline">Privacy Policy</Link>
            </p>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-400">
              <span>🔒 Secure</span>
              <span>•</span>
              <span>🏆 Trusted</span>
              <span>•</span>
              <span>🌾 Farm Verified</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}