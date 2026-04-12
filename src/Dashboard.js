import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Eye, Package, TrendingUp, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [views, setViews] = useState([]);
  const [likes, setLikes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        window.location.href = '/login';
      }
    };
    getUser();
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setIsLoading(true);

      // Load user's listings
      const { data: listingsData } = await supabase
        .from('livestock')
        .select('*')
        .eq('user_id', user.id);

      setListings(listingsData || []);

      // Load views for user's listings
      if (listingsData && listingsData.length > 0) {
        const listingIds = listingsData.map(l => l.id);
        const { data: viewsData } = await supabase
          .from('views')
          .select('*')
          .in('livestock_id', listingIds);
        setViews(viewsData || []);

        // Load likes for user's listings
        const { data: likesData } = await supabase
          .from('likes')
          .select('*')
          .in('livestock_id', listingIds);
        setLikes(likesData || []);
      }

      setIsLoading(false);
    };

    loadData();
  }, [user]);

  // Calculate stats
  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.status !== 'sold').length;
  const soldListings = listings.filter(l => l.status === 'sold').length;

  const totalViews = views.length;
  const totalLikes = likes.length;

  const totalValue = listings.reduce((sum, l) => sum + (Number(l.price) || 0), 0);
  const soldValue = listings.filter(l => l.status === 'sold').reduce((sum, l) => sum + (Number(l.price) || 0), 0);

  // Get views per listing
  const viewsPerListing = {};
  views.forEach(view => {
    viewsPerListing[view.livestock_id] = (viewsPerListing[view.livestock_id] || 0) + 1;
  });

  // Get likes per listing
  const likesPerListing = {};
  likes.forEach(like => {
    likesPerListing[like.livestock_id] = (likesPerListing[like.livestock_id] || 0) + 1;
  });

  // Performance data
  const performanceData = listings.map(listing => ({
    id: listing.id,
    name: listing.name,
    breed: listing.breed_type,
    price: listing.price,
    status: listing.status,
    views: viewsPerListing[listing.id] || 0,
    likes: likesPerListing[listing.id] || 0
  }));

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-stone-800">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/MyListings">
              <button className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-stone-800" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-stone-800">Seller Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Listings" value={totalListings} icon={Package} color="bg-amber-500" />
          <StatCard title="Active Listings" value={activeListings} icon={TrendingUp} color="bg-green-500" />
          <StatCard title="Total Views" value={totalViews} icon={Eye} color="bg-blue-500" />
          <StatCard title="Total Likes" value={totalLikes} icon={Heart} color="bg-rose-500" />
        </div>

        {/* Sales Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Revenue Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-stone-600">Total Inventory Value</span>
                <span className="font-bold text-stone-800">R {totalValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-stone-600">Sold Value</span>
                <span className="font-bold text-green-600">R {soldValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-stone-600">Active Value</span>
                <span className="font-bold text-amber-600">R {(totalValue - soldValue).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-stone-600">Sold Animals</span>
                <span className="font-bold text-stone-800">{soldListings}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-stone-600">Average Price</span>
                <span className="font-bold text-stone-800">
                  R {soldListings > 0 ? Math.round(soldValue / soldListings).toLocaleString() : '0'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-stone-600">Conversion Rate</span>
                <span className="font-bold text-stone-800">
                  {totalViews > 0 ? Math.round((soldListings / totalViews) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Table */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-stone-800 mb-4">Listing Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-stone-200">
                <tr className="text-left">
                  <th className="pb-3 text-stone-600 font-medium">Name</th>
                  <th className="pb-3 text-stone-600 font-medium">Breed</th>
                  <th className="pb-3 text-stone-600 font-medium">Price</th>
                  <th className="pb-3 text-stone-600 font-medium">Views</th>
                  <th className="pb-3 text-stone-600 font-medium">Likes</th>
                  <th className="pb-3 text-stone-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((item) => (
                  <tr key={item.id} className="border-b border-stone-100">
                    <td className="py-3 font-medium text-stone-800">{item.name}</td>
                    <td className="py-3 text-stone-600">{item.breed || '-'}</td>
                    <td className="py-3 text-stone-800">R {Number(item.price).toLocaleString()}</td>
                    <td className="py-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-blue-500" />
                        {item.views}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-rose-500" />
                        {item.likes}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'sold' ? 'bg-stone-200 text-stone-800' : 'bg-green-100 text-green-800'
                        }`}>
                        {item.status || 'active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {performanceData.length === 0 && (
            <p className="text-center text-stone-500 py-8">No listings yet</p>
          )}
        </div>
      </div>
    </div>
  );
}