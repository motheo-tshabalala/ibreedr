import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Package, PlusCircle, BarChart2, Shield, Bookmark, Search, Building2, Settings, HelpCircle, LogOut, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function SellerHub({ setShowHelpCenter }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile && !error) {
        setProfile(profile);
      }
      setLoading(false);
    };
    loadUserAndProfile();
  }, [navigate]);

  const profileStrength = useMemo(() => {
    if (!profile) return 0;
    const fields = [
      profile.farm_name,
      profile.phone,
      profile.farm_location,
      profile.farm_bio,
      profile.years_farming,
      profile.logo_image,
      profile.cover_image
    ].filter(Boolean).length;
    return Math.round((fields / 7) * 100);
  }, [profile]);

  const isVerified = profile?.verified_farmer || false;

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">My Account</h1>
        </div>
      </div>

      {/* Identity Strip */}
      <div className="bg-white rounded-xl shadow-sm mx-4 mt-4 mb-2 p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary-green/10 flex items-center justify-center text-2xl text-primary-green flex-shrink-0 overflow-hidden">
            {profile?.logo_image ? (
              <img src={profile.logo_image} alt={profile.farm_name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-xl">{profile?.farm_name?.charAt(0) || 'F'}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 truncate">{profile?.farm_name || 'My Farm'}</h2>
              {isVerified && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${profileStrength >= 80 ? 'bg-green-500' :
                      profileStrength >= 50 ? 'bg-amber-500' :
                        'bg-gray-400'
                    }`}
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 font-medium flex-shrink-0">{profileStrength}%</span>
            </div>
          </div>

          <Link to="/Profile" className="text-xs text-primary-green hover:underline flex-shrink-0">
            Edit Profile →
          </Link>
        </div>
      </div>

      {/* Section 1 — MY FARM */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">My Farm</p>
      </div>
      <div className="bg-white divide-y divide-gray-100 mx-4 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer" onClick={() => navigate('/MyListings')}>
          <div className="w-9 h-9 rounded-xl bg-primary-green/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-primary-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">My Listings</p>
            <p className="text-xs text-gray-400 mt-0.5">Manage your listings</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer" onClick={() => navigate('/SellerUpload')}>
          <div className="w-9 h-9 rounded-xl bg-primary-green/10 flex items-center justify-center flex-shrink-0">
            <PlusCircle className="w-4 h-4 text-primary-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Add New Listing</p>
            <p className="text-xs text-gray-400 mt-0.5">List an animal for sale</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer" onClick={() => navigate('/Dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-primary-green/10 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-4 h-4 text-primary-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Dashboard</p>
            <p className="text-xs text-gray-400 mt-0.5">Stats and revenue</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </div>

        {!isVerified ? (
          <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer" onClick={() => navigate('/GetVerified')}>
            <div className="w-9 h-9 rounded-xl bg-primary-green/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">Get Verified</p>
              <p className="text-xs text-gray-400 mt-0.5">Build buyer trust</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3.5 opacity-75 cursor-default">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-700">Verified Farm</p>
              <p className="text-xs text-green-600 mt-0.5">Your farm is verified</p>
            </div>
          </div>
        )}
      </div>

      {/* Section 2 — BUYING */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Buying</p>
      </div>
      <div className="bg-white divide-y divide-gray-100 mx-4 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer" onClick={() => navigate('/Wishlist')}>
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Bookmark className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Saved Animals</p>
            <p className="text-xs text-gray-400 mt-0.5">Your wishlist</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer" onClick={() => navigate('/livestock')}>
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Search className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Browse Livestock</p>
            <p className="text-xs text-gray-400 mt-0.5">Find animals</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer" onClick={() => navigate('/farms')}>
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Browse Farms</p>
            <p className="text-xs text-gray-400 mt-0.5">Discover farms</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </div>
      </div>

      {/* Section 3 — ACCOUNT */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
      </div>
      <div className="bg-white divide-y divide-gray-100 mx-4 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer" onClick={() => navigate('/Profile')}>
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Settings className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Edit Profile</p>
            <p className="text-xs text-gray-400 mt-0.5">Update farm details</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </div>

        {/* ✅ FIXED - Help Center navigates to /help route */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer"
          onClick={() => navigate('/help')}
        >
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Help Center</p>
            <p className="text-xs text-gray-400 mt-0.5">FAQs and support</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer" onClick={() => navigate('/logout')}>
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Logout</p>
            <p className="text-xs text-gray-400 mt-0.5">Sign out</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 active:bg-red-100 transition cursor-pointer" onClick={() => navigate('/DeleteProfile')}>
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-600">Delete Account</p>
            <p className="text-xs text-red-500 mt-0.5">Permanently remove account</p>
          </div>
        </div>
      </div>

      {/* Footer spacer */}
      <div className="h-4" />
    </div>
  );
}