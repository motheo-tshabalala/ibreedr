import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Bell, Trash2, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function Wishlist() {
  const [user, setUser] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [listings, setListings] = useState([]);
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

  // Load wishlist and listings
  useEffect(() => {
    const loadWishlist = async () => {
      if (!user) return;

      setIsLoading(true);

      // Get wishlist items
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (wishlistError) {
        console.error('Error loading wishlist:', wishlistError);
      } else {
        setWishlistItems(wishlistData || []);

        // Get all livestock for these wishlist items
        if (wishlistData && wishlistData.length > 0) {
          const livestockIds = wishlistData.map(item => item.livestock_id);
          const { data: livestockData } = await supabase
            .from('livestock')
            .select('*')
            .in('id', livestockIds);

          setListings(livestockData || []);
        }
      }

      setIsLoading(false);
    };

    loadWishlist();
  }, [user]);

  const removeFromWishlist = async (id) => {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Remove error:', error);
      alert('Failed to remove from wishlist');
    } else {
      setWishlistItems(wishlistItems.filter(item => item.id !== id));
      alert('Removed from wishlist');
    }
  };

  const updateNotification = async (id, field, value) => {
    const { error } = await supabase
      .from('wishlist')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      console.error('Update error:', error);
    }
  };

  // Enrich wishlist with current livestock data
  const enrichedWishlist = wishlistItems.map(item => {
    const livestock = listings.find(l => l.id === item.livestock_id);
    const priceDropped = livestock && item.original_price && livestock.price < item.original_price;
    const priceDrop = priceDropped ? item.original_price - livestock.price : 0;

    return {
      ...item,
      livestock,
      priceDropped,
      priceDrop,
      statusChanged: livestock && livestock.status !== 'active'
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/Browse">
            <button className="p-2 hover:bg-stone-100 rounded-full">
              <ArrowLeft className="w-6 h-6 text-stone-800" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <h1 className="text-xl font-bold text-stone-800">My Wishlist</h1>
          </div>
          <span className="px-2 py-1 bg-stone-100 text-stone-800 rounded-full text-sm">
            {wishlistItems.length} items
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {enrichedWishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-stone-800 mb-2">Your wishlist is empty</h3>
            <p className="text-stone-600 mb-6">Save livestock you're interested in</p>
            <Link to="/Browse">
              <button className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-6 py-2">
                Browse Livestock
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {enrichedWishlist.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {item.priceDropped && (
                  <div className="bg-green-500 text-white px-4 py-2 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    <span className="font-medium">Price dropped by R {item.priceDrop.toLocaleString()}!</span>
                  </div>
                )}
                {item.statusChanged && (
                  <div className="bg-amber-500 text-white px-4 py-2 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span className="font-medium">Status changed to: {item.livestock?.status}</span>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex gap-4">
                    {item.livestock?.images && item.livestock.images[0] ? (
                      <img
                        src={item.livestock.images[0]}
                        alt={item.livestock_name}
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-stone-100 flex items-center justify-center">
                        <span className="text-3xl">🐄</span>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-stone-800">{item.livestock_name}</h3>
                          <p className="text-sm text-stone-600">
                            {item.livestock?.breed_type} • {item.livestock?.location}
                          </p>
                        </div>
                        {item.livestock?.status !== 'active' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.livestock?.status === 'sold' ? 'bg-stone-200 text-stone-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                            {item.livestock?.status}
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        {item.priceDropped ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-green-600">
                              R {item.livestock?.price?.toLocaleString()}
                            </span>
                            <span className="text-sm text-stone-400 line-through">
                              R {item.original_price?.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xl font-bold text-stone-800">
                            R {item.livestock?.price?.toLocaleString() || 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-stone-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <button
                            onClick={() => updateNotification(item.id, 'notify_price_drop', !item.notify_price_drop)}
                            className={`w-10 h-5 rounded-full transition-colors ${item.notify_price_drop ? 'bg-amber-500' : 'bg-stone-300'}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.notify_price_drop ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                          <span className="text-sm text-stone-600">Price alerts</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <button
                            onClick={() => updateNotification(item.id, 'notify_status_change', !item.notify_status_change)}
                            className={`w-10 h-5 rounded-full transition-colors ${item.notify_status_change ? 'bg-amber-500' : 'bg-stone-300'}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.notify_status_change ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                          <span className="text-sm text-stone-600">Status alerts</span>
                        </label>
                      </div>

                      <div className="flex gap-2">
                        {item.livestock?.status === 'active' && (
                          <Link to={`/BreedDetails?id=${item.livestock_id}`}>
                            <button className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-4 py-1 text-sm">
                              View
                            </button>
                          </Link>
                        )}
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="px-3 py-1 border-2 border-red-300 text-red-600 rounded-full hover:bg-red-50 text-sm"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </div>
                    </div>
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