// src/DeleteProfile.js
import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, Trash2, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

export default function DeleteProfile() {
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) window.location.href = '/login';
      setUser(user);
    };
    getUser();
  }, []);

  const verifyPassword = async () => {
    setError('');
    setIsDeleting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (error) {
        setError('Incorrect password. Please try again.');
        setIsDeleting(false);
        return;
      }

      setStep(2);
      setIsDeleting(false);

    } catch (error) {
      setError('Failed to verify password');
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);

    try {
      const { error: deleteError } = await supabase.functions.invoke('delete-user', {
        body: { user_id: user.id }
      });

      if (deleteError) throw deleteError;

      await supabase.auth.signOut();
      alert('Your account has been permanently deleted');
      window.location.href = '/';

    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete account: ' + error.message);
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/Browse">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Delete Account</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="border-red-200">
          <CardContent className="p-6">
            {step === 1 ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">Delete Your Account</h2>
                  <p className="text-muted-foreground text-sm">
                    Please enter your password to continue
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <Input value={user.email} disabled className="bg-muted" />
                  </div>

                  <div>
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                        placeholder="Enter your password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={verifyPassword}
                    disabled={!password || isDeleting}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? 'Verifying...' : 'Verify Password'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">Permanent Deletion</h2>
                  <p className="text-muted-foreground text-sm">
                    This action cannot be undone
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h3 className="font-semibold text-red-800 mb-2">⚠️ You will permanently lose:</h3>
                    <ul className="space-y-1 text-sm text-red-700">
                      <li>• All your livestock listings</li>
                      <li>• All your bundles</li>
                      <li>• All your messages and conversations</li>
                      <li>• Your wishlist and saved items</li>
                      <li>• Your profile and farm information</li>
                      <li>• All uploaded photos and videos</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm text-amber-800 mb-2">
                      Type <strong className="font-mono bg-amber-100 px-1">DELETE</strong> to confirm:
                    </p>
                    <Input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="border-amber-300 focus:border-red-500"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={confirmText !== 'DELETE' || isDeleting}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}