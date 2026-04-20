import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Bell, Trash2, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function Wishlist() {
  const [user, setUser] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [listings, setListings] = useState([]);
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
    const loadWishlist = async () => {
      if (!user) return;

      setIsLoading(true);

      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (wishlistError) {
        console.error('Error loading wishlist:', wishlistError);
      } else {
        setWishlistItems(wishlistData || []);

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
      alert('Failed to remove from wishlist');
    } else {
      setWishlistItems(wishlistItems.filter(item => item.id !== id));
      alert('Removed from wishlist');
    }
  };

  const updateNotification = async (id, field, value) => {
    await supabase
      .from('wishlist')
      .update({ [field]: value })
      .eq('id', id);
  };

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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/Browse">
            <button className="p-2 -m-2 rounded-full hover:bg-stone-100 transition">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h1 className="text-xl font-bold text-stone-800">My Wishlist</h1>
          </div>
          <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full text-xs">
            {wishlistItems.length} items
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {enrichedWishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-stone-800 mb-2">Your wishlist is empty</h3>
            <p className="text-stone-500 text-sm mb-6">Save livestock you're interested in</p>
            <Link to="/Browse">
              <button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-5 py-2 text-sm transition">
                Browse Livestock
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {enrichedWishlist.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-stone-100 overflow-hidden shadow-sm">
                {item.priceDropped && (
                  <div className="bg-green-500 text-white px-4 py-2 flex items-center gap-2 text-sm">
                    <TrendingDown className="w-4 h-4" />
                    <span className="font-medium">Price dropped by R {item.priceDrop.toLocaleString()}!</span>
                  </div>
                )}
                {item.statusChanged && (
                  <div className="bg-amber-500 text-white px-4 py-2 flex items-center gap-2 text-sm">
                    <Bell className="w-4 h-4" />
                    <span className="font-medium">Status changed to: {item.livestock?.status}</span>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex gap-4">
                    {item.livestock?.images && item.livestock.images[0] ? (
                      <img src={item.livestock.images[0]} alt={item.livestock_name} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-stone-100 flex items-center justify-center">
                        <span className="text-3xl">🐄</span>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-stone-800">{item.livestock_name}</h3>
                          <p className="text-sm text-stone-500 mt-0.5">
                            {item.livestock?.breed_type} • {item.livestock?.location}
                          </p>
                        </div>
                        {item.livestock?.status !== 'active' && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.livestock?.status === 'sold' ? 'bg-stone-100 text-stone-600' : 'bg-amber-100 text-amber-700'
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

                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <button
                            onClick={() => updateNotification(item.id, 'notify_price_drop', !item.notify_price_drop)}
                            className={`w-8 h-4 rounded-full transition-colors ${item.notify_price_drop ? 'bg-amber-500' : 'bg-stone-300'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${item.notify_price_drop ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <span className="text-sm text-stone-600">Price alerts</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <button
                            onClick={() => updateNotification(item.id, 'notify_status_change', !item.notify_status_change)}
                            className={`w-8 h-4 rounded-full transition-colors ${item.notify_status_change ? 'bg-amber-500' : 'bg-stone-300'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${item.notify_status_change ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <span className="text-sm text-stone-600">Status alerts</span>
                        </label>
                      </div>

                      <div className="flex gap-2">
                        {item.livestock?.status === 'active' && (
                          <Link to={`/BreedDetails?id=${item.livestock_id}`}>
                            <button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-3 py-1 text-sm transition">
                              View
                            </button>
                          </Link>
                        )}
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="px-3 py-1 border border-red-200 text-red-500 rounded-full text-sm hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
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