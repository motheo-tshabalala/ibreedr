import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Eye, Heart, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function MyListings() {
  const [user, setUser] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [myBundles, setMyBundles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        loadListings(user.id);
        loadBundles(user.id);
      } else {
        window.location.href = '/login';
      }
    };
    getUser();
  }, []);

  const loadListings = async (userId) => {
    const { data, error } = await supabase
      .from('livestock')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setMyListings(data || []);
    setIsLoading(false);
  };

  const loadBundles = async (userId) => {
    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setMyBundles(data || []);
  };

  const deleteListing = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    const table = type === 'bundle' ? 'bundles' : 'livestock';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      alert('Failed to delete: ' + error.message);
    } else {
      if (type === 'bundle') {
        setMyBundles(myBundles.filter(l => l.id !== id));
      } else {
        setMyListings(myListings.filter(l => l.id !== id));
      }
      alert('Deleted successfully');
    }
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('livestock')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      alert('Failed to update: ' + error.message);
    } else {
      setMyListings(myListings.map(l => l.id === id ? { ...l, status: newStatus } : l));
      alert(`Listing marked as ${newStatus}`);
    }
  };

  const displayAge = (livestock) => {
    const years = livestock?.age_years || 0;
    const months = livestock?.age_months || 0;
    if (years > 0 && months > 0) return `${years}y ${months}m`;
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
    return 'Age not specified';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'sold': return 'bg-stone-100 text-stone-600';
      case 'reserved': return 'bg-amber-100 text-amber-700';
      default: return 'bg-stone-100 text-stone-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  const allItems = [...myListings, ...myBundles.map(b => ({ ...b, isBundle: true }))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/Browse">
              <button className="p-2 -m-2 rounded-full hover:bg-stone-100 transition">
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-stone-800">My Listings</h1>
          </div>
          <Link to="/SellerUpload">
            <button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center gap-1 px-4 py-2 text-sm font-medium transition">
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4 opacity-50">📋</div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">No listings yet</h3>
            <p className="text-stone-500 text-sm mb-6">Start by adding your first livestock</p>
            <Link to="/SellerUpload">
              <button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-5 py-2 text-sm transition">
                Create Listing
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.map(livestock => (
              <div key={livestock.id} className="bg-white rounded-xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="h-40 bg-gradient-to-br from-amber-50 to-stone-100 relative overflow-hidden">
                  {livestock.images?.[0] ? (
                    <img src={livestock.images[0]} alt={livestock.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl opacity-30">🐄</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(livestock.status)}`}>
                      {livestock.status || 'active'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-bold text-stone-800">{livestock.name}</h3>
                  <p className="text-sm text-stone-500 mt-0.5">{livestock.breed_type} • {displayAge(livestock)}</p>
                  {livestock.price && <div className="text-lg font-bold text-amber-600 mt-2">R {Number(livestock.price).toLocaleString()}</div>}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-stone-100">
                    <Link to={`/BreedDetails?id=${livestock.id}`} className="flex-1">
                      <button className="w-full rounded-full px-3 py-1.5 border border-stone-200 text-sm hover:bg-stone-50 transition">
                        View
                      </button>
                    </Link>
                    {livestock.status === 'active' && (
                      <button onClick={() => updateStatus(livestock.id, 'sold')} className="px-3 py-1.5 border border-stone-200 rounded-full text-sm hover:bg-stone-50 transition">
                        Mark Sold
                      </button>
                    )}
                    <button onClick={() => deleteListing(livestock.id, 'individual')} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-full text-sm hover:bg-red-50 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {myBundles.map(bundle => (
              <div key={bundle.id} className="bg-white rounded-xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="h-40 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden">
                  {bundle.images?.[0] ? (
                    <img src={bundle.images[0]} alt={bundle.bundle_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-stone-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bundle.status)}`}>
                      {bundle.status || 'active'}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      Bundle
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-bold text-stone-800">{bundle.bundle_name}</h3>
                  <p className="text-sm text-stone-500 mt-0.5">{bundle.location}</p>
                  {bundle.bundle_price && <div className="text-lg font-bold text-amber-600 mt-2">R {Number(bundle.bundle_price).toLocaleString()}</div>}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-stone-100">
                    <Link to={`/BundleDetails?id=${bundle.id}`} className="flex-1">
                      <button className="w-full rounded-full px-3 py-1.5 border border-stone-200 text-sm hover:bg-stone-50 transition">
                        View
                      </button>
                    </Link>
                    <button onClick={() => deleteListing(bundle.id, 'bundle')} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-full text-sm hover:bg-red-50 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}