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

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setIsLoading(true);

      const { data: listingsData } = await supabase
        .from('livestock')
        .select('*')
        .eq('user_id', user.id);

      setListings(listingsData || []);

      if (listingsData && listingsData.length > 0) {
        const listingIds = listingsData.map(l => l.id);
        const { data: viewsData } = await supabase
          .from('views')
          .select('*')
          .in('livestock_id', listingIds);
        setViews(viewsData || []);

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

  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.status !== 'sold').length;
  const soldListings = listings.filter(l => l.status === 'sold').length;
  const totalViews = views.length;
  const totalLikes = likes.length;
  const totalValue = listings.reduce((sum, l) => sum + (Number(l.price) || 0), 0);
  const soldValue = listings.filter(l => l.status === 'sold').reduce((sum, l) => sum + (Number(l.price) || 0), 0);

  const viewsPerListing = {};
  views.forEach(view => {
    viewsPerListing[view.livestock_id] = (viewsPerListing[view.livestock_id] || 0) + 1;
  });

  const likesPerListing = {};
  likes.forEach(like => {
    likesPerListing[like.livestock_id] = (likesPerListing[like.livestock_id] || 0) + 1;
  });

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
    <div className="bg-white rounded-xl border border-stone-100 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-stone-800">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/MyListings">
              <button className="p-2 -m-2 rounded-full hover:bg-stone-100 transition">
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-stone-800">Seller Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid - Consistent spacing: gap-5 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Total Listings" value={totalListings} icon={Package} color="bg-amber-500" />
          <StatCard title="Active Listings" value={activeListings} icon={TrendingUp} color="bg-green-500" />
          <StatCard title="Total Views" value={totalViews} icon={Eye} color="bg-blue-500" />
          <StatCard title="Total Likes" value={totalLikes} icon={Heart} color="bg-rose-500" />
        </div>

        {/* Sales Summary - Consistent spacing: gap-5 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-stone-100 p-5 shadow-sm">
            <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Revenue Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-sm text-stone-500">Total Inventory Value</span>
                <span className="font-semibold text-stone-800">R {totalValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-sm text-stone-500">Sold Value</span>
                <span className="font-semibold text-green-600">R {soldValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-stone-500">Active Value</span>
                <span className="font-semibold text-amber-600">R {(totalValue - soldValue).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-100 p-5 shadow-sm">
            <h3 className="text-base font-bold text-stone-800 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-sm text-stone-500">Sold Animals</span>
                <span className="font-semibold text-stone-800">{soldListings}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-sm text-stone-500">Average Price</span>
                <span className="font-semibold text-stone-800">
                  R {soldListings > 0 ? Math.round(soldValue / soldListings).toLocaleString() : '0'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-stone-500">Conversion Rate</span>
                <span className="font-semibold text-stone-800">
                  {totalViews > 0 ? Math.round((soldListings / totalViews) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Table - Consistent spacing */}
        <div className="bg-white rounded-xl border border-stone-100 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-stone-100">
            <h3 className="text-base font-bold text-stone-800">Listing Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left p-4 text-sm font-semibold text-stone-600">Name</th>
                  <th className="text-left p-4 text-sm font-semibold text-stone-600">Breed</th>
                  <th className="text-left p-4 text-sm font-semibold text-stone-600">Price</th>
                  <th className="text-left p-4 text-sm font-semibold text-stone-600">Views</th>
                  <th className="text-left p-4 text-sm font-semibold text-stone-600">Likes</th>
                  <th className="text-left p-4 text-sm font-semibold text-stone-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((item) => (
                  <tr key={item.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition">
                    <td className="p-4 text-sm font-medium text-stone-800">{item.name}</td>
                    <td className="p-4 text-sm text-stone-600">{item.breed || '-'}</td>
                    <td className="p-4 text-sm text-stone-800">R {Number(item.price).toLocaleString()}</td>
                    <td className="p-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-blue-500" />
                        {item.views}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500" />
                        {item.likes}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'sold' ? 'bg-stone-100 text-stone-600' : 'bg-green-100 text-green-700'
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
            <div className="text-center py-12">
              <p className="text-stone-400 text-sm">No listings yet</p>
              <Link to="/SellerUpload">
                <button className="mt-4 text-amber-600 text-sm underline">Create your first listing</button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}