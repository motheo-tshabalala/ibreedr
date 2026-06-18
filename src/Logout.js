import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Building2, CheckCircle, Loader2, LogOut } from 'lucide-react';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

export default function Logout() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('logging out');
  const [error, setError] = useState('');

  useEffect(() => {
    const logout = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setStatus('success');

        setTimeout(() => {
          navigate('/login');
        }, 2000);

      } catch (err) {
        console.error('Logout error:', err);
        setError(err.message || 'Failed to log out');
        setStatus('error');
      }
    };

    logout();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Building2 className="w-8 h-8 text-primary-green" />
            <h1 className="text-2xl font-bold text-primary-green">iBreedr</h1>
          </div>

          {status === 'logging out' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 text-primary-green animate-spin" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Logging out...</h2>
              <p className="text-sm text-gray-500">Please wait while we sign you out</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Logged Out Successfully</h2>
              <p className="text-sm text-gray-500">You have been signed out of your account</p>
              <p className="text-xs text-gray-400">Redirecting to login...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <LogOut className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-red-600">Logout Failed</h2>
              <p className="text-sm text-gray-500">{error || 'Something went wrong'}</p>
              <Button
                onClick={() => navigate('/')}
                className="bg-primary-green hover:bg-primary-green-dark text-white"
              >
                Return to Home
              </Button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {status === 'logging out' && 'See you soon!'}
              {status === 'success' && 'Thank you for using iBreedr'}
              {status === 'error' && 'Please try again'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}