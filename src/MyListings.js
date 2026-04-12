import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Eye, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function MyListings() {
  const [user, setUser] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        loadListings(user.id);
      } else {
        window.location.href = '/login';
      }
    };
    getUser();
  }, []);

  const loadListings = async (userId) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('livestock')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading listings:', error);
    } else {
      setMyListings(data || []);
    }
    setIsLoading(false);
  };

  const deleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    const { error } = await supabase
      .from('livestock')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      alert('Failed to delete: ' + error.message);
    } else {
      setMyListings(myListings.filter(l => l.id !== id));
      alert('Listing deleted');
    }
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('livestock')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Update error:', error);
      alert('Failed to update: ' + error.message);
    } else {
      setMyListings(myListings.map(l =>
        l.id === id ? { ...l, status: newStatus } : l
      ));
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
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-stone-200 text-stone-800';
      case 'reserved': return 'bg-amber-100 text-amber-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/Browse">
              <button className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-stone-800" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-stone-800">My Listings</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/Dashboard">
              <button className="rounded-full px-4 py-2 border-2 border-stone-300 text-sm hover:bg-stone-100">
                📊 Dashboard
              </button>
            </Link>
            <Link to="/SellerUpload">
              <button className="bg-stone-800 hover:bg-stone-900 text-white rounded-full flex items-center gap-2 px-4 py-2">
                <Plus className="w-5 h-5" />
                Add New
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {myListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-stone-800 mb-2">No listings yet</h3>
            <p className="text-stone-600 mb-6">Start by adding your first livestock</p>
            <Link to="/SellerUpload">
              <button className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-6 py-2">
                Create Listing
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.map(livestock => (
              <div key={livestock.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-amber-50 to-stone-100 relative overflow-hidden">
                  {livestock.images && livestock.images.length > 0 ? (
                    <img
                      src={livestock.images[0]}
                      alt={livestock.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl opacity-20">🐄</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(livestock.status)}`}>
                      {livestock.status || 'active'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-stone-800 mb-1">{livestock.name}</h3>
                    <p className="text-sm text-stone-600">
                      {livestock.breed_type} • {displayAge(livestock)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <span className="font-medium text-stone-700">{livestock.likes_count || 0}</span>
                    </div>
                  </div>

                  {livestock.price && (
                    <div className="text-lg font-bold text-stone-800">
                      R {Number(livestock.price).toLocaleString()}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-stone-200">
                    <Link to={`/BreedDetails?id=${livestock.id}`} className="flex-1">
                      <button className="w-full rounded-full px-3 py-2 border-2 border-stone-300 hover:bg-stone-100 flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </Link>

                    {livestock.status === 'active' && (
                      <button
                        onClick={() => updateStatus(livestock.id, 'sold')}
                        className="rounded-full px-3 py-2 border-2 border-stone-300 hover:bg-stone-100"
                      >
                        Mark Sold
                      </button>
                    )}

                    <button
                      onClick={() => deleteListing(livestock.id)}
                      className="rounded-full px-3 py-2 border-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
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