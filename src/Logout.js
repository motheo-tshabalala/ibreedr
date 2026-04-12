import { useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Logout() {
  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut();
      window.location.href = '/login';
    };
    logout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
    </div>
  );
}