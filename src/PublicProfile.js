import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Share2, Package, Image } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";
import Logo from './components/ui/Logo';

export default function PublicProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(profileData);

      if (profileData) {
        const { data: livestockData } = await supabase.from('livestock').select('*').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false });
        setListings(livestockData || []);

        const { data: bundlesData } = await supabase.from('bundles').select('*').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false });
        setBundles(bundlesData || []);
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setIsLoading(false);
    };
    loadData();
  }, [userId]);

  const shareProfile = () => {
    const url = window.location.href;
    const text = `Check out ${profile?.farm_name || 'this farm'} on iBreedr:%0A${url}`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Farm not found</h2>
          <Link to="/"><Button>Go Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/"><Logo size="small" /></Link>
          <Button variant="outline" size="sm" onClick={shareProfile} className="gap-1">
            <Share2 className="w-3 h-3" />Share
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Farm Info */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-amber-600">
                {profile.farm_name?.charAt(0) || 'F'}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{profile.farm_name || 'Farm'}</h1>
            {profile.location && (
              <p className="flex items-center justify-center gap-1 text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />{profile.location}
              </p>
            )}
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center justify-center gap-1 text-sm text-primary mt-2 hover:underline">
                <Phone className="w-3 h-3" />{profile.phone}
              </a>
            )}
            <div className="flex gap-3 mt-4 justify-center">
              <Badge variant="secondary">{listings.length + bundles.length} active listings</Badge>
            </div>
            {user && user.id !== userId && (
              <Link to={`/ChatRoom?withUser=${userId}`} className="mt-4 inline-block">
                <Button className="gap-2"><MessageCircle className="w-4 h-4" />Message Farmer</Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Listings */}
        {listings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />Individual Animals
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {listings.map(livestock => (
                <Link to={`/BreedDetails?id=${livestock.id}`} key={livestock.id}>
                  <Card className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4 flex gap-3">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {livestock.images?.[0] ? (
                          <img src={livestock.images[0]} alt={livestock.breed_type} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
                            <Image className="w-6 h-6 text-amber-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{livestock.breed_type}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{livestock.animal_type}</p>
                        {livestock.price && <p className="text-sm font-bold text-primary mt-1">R {Number(livestock.price).toLocaleString()}</p>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bundles */}
        {bundles.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-green-600" />Bundles
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {bundles.map(bundle => (
                <Link to={`/BundleDetails?id=${bundle.id}`} key={bundle.id}>
                  <Card className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4 flex gap-3">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {bundle.images?.[0] ? (
                          <img src={bundle.images[0]} alt={bundle.bundle_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
                            <Package className="w-6 h-6 text-green-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{bundle.bundle_name}</h3>
                        <p className="text-xs text-muted-foreground">{bundle.quantity} animals</p>
                        {bundle.bundle_price && <p className="text-sm font-bold text-primary mt-1">R {Number(bundle.bundle_price).toLocaleString()}</p>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {listings.length === 0 && bundles.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active listings at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
}