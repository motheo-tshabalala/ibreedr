import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Bell, Trash2, TrendingDown, Building2, MapPin } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";
import { Switch } from "./components/ui/switch";

export default function Wishlist() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        navigate('/login');
      }
    };
    getUser();
  }, [navigate]);

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
        setMessage({ type: 'error', text: 'Failed to load wishlist' });
      } else {
        setWishlistItems(wishlistData || []);

        if (wishlistData && wishlistData.length > 0) {
          const livestockIds = wishlistData.map(item => item.livestock_id);
          const { data: livestockData } = await supabase
            .from('livestock')
            .select(`
              *,
              profiles!user_id (
                farm_name,
                verified_farmer,
                farm_location
              )
            `)
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
      setMessage({ type: 'error', text: 'Failed to remove from wishlist' });
    } else {
      setWishlistItems(wishlistItems.filter(item => item.id !== id));
      setMessage({ type: 'success', text: 'Removed from wishlist' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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
    const farmName = livestock?.profiles?.farm_name || 'Farm';

    return {
      ...item,
      livestock,
      priceDropped,
      priceDrop,
      farmName,
      isVerified: livestock?.profiles?.verified_farmer || false,
      statusChanged: livestock && livestock.status !== 'active'
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/livestock">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h1 className="text-xl font-bold">My Wishlist</h1>
          </div>
          <Badge variant="secondary">{wishlistItems.length} items</Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            }`}>
            {message.text}
          </div>
        )}

        {enrichedWishlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 text-sm mb-6">Save livestock you're interested in</p>
            <Link to="/livestock">
              <Button className="bg-primary-green hover:bg-primary-green-dark">Browse Livestock</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {enrichedWishlist.map(item => (
              <Card key={item.id} className="overflow-hidden">
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

                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.livestock?.images && item.livestock.images[0] ? (
                        <img src={item.livestock.images[0]} alt={item.livestock_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl">🐄</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary-green" />
                            <span className="font-semibold text-sm">{item.farmName}</span>
                            {item.isVerified && (
                              <span className="text-xs text-primary-green">Verified</span>
                            )}
                          </div>

                          <h3 className="font-semibold text-gray-900">{item.livestock_name}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {item.livestock?.breed_type} • {item.livestock?.location}
                          </p>
                        </div>
                        {item.livestock?.status !== 'active' && (
                          <Badge variant={item.livestock?.status === 'sold' ? 'secondary' : 'default'}>
                            {item.livestock?.status}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2">
                        {item.priceDropped ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-green-600">
                              R {item.livestock?.price?.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              R {item.original_price?.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xl font-bold text-primary-green">
                            R {item.livestock?.price?.toLocaleString() || 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <Switch
                          checked={item.notify_price_drop}
                          onCheckedChange={(checked) =>
                            updateNotification(item.id, 'notify_price_drop', checked)
                          }
                        />
                        Price alerts
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <Switch
                          checked={item.notify_status_change}
                          onCheckedChange={(checked) =>
                            updateNotification(item.id, 'notify_status_change', checked)
                          }
                        />
                        Status alerts
                      </label>
                    </div>

                    <div className="flex gap-2">
                      {item.livestock?.status === 'active' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/BreedDetails?id=${item.livestock_id}`}>
                            View
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeFromWishlist(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}