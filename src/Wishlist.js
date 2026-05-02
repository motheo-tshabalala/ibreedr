import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Bell, Trash2, TrendingDown, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";
import { Switch } from "./components/ui/switch";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/Browse">
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
        {enrichedWishlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground text-sm mb-6">Save livestock you're interested in</p>
            <Link to="/Browse">
              <Button>Browse Livestock</Button>
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
                    {/* Image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.livestock?.images && item.livestock.images[0] ? (
                        <img src={item.livestock.images[0]} alt={item.livestock_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl">🐄</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{item.livestock_name}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
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
                            <span className="text-sm text-muted-foreground line-through">
                              R {item.original_price?.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xl font-bold">
                            R {item.livestock?.price?.toLocaleString() || 'N/A'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
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
                        className="text-destructive hover:text-destructive"
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