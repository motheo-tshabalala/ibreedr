import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Heart, Eye, Package, Hash, Bookmark, MessageCircle, Info, Calendar, Weight, Users, Baby, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";
import { Separator } from "./components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";

export default function BundleDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const bundleId = urlParams.get('id');

  const [user, setUser] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const loadBundle = async () => {
      if (!bundleId) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .eq('id', bundleId)
        .single();
      if (error) {
        console.error('Error loading bundle:', error);
      } else {
        setBundle(data);
        if (user) {
          const { data: wishlistData } = await supabase
            .from('wishlist')
            .select('*')
            .eq('livestock_id', bundleId)
            .eq('user_id', user.id)
            .maybeSingle();
          setIsInWishlist(!!wishlistData);
        }
      }
      setIsLoading(false);
    };
    loadBundle();
  }, [bundleId, user]);

  useEffect(() => {
    const getOrCreateConversation = async () => {
      if (!user || !bundle) return;
      if (user.id === bundle.user_id) return;
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('livestock_id', bundleId)
        .eq('buyer_id', user.id)
        .maybeSingle();
      if (existing) {
        setConversationId(existing.id);
      } else {
        const { data: newConvo } = await supabase
          .from('conversations')
          .insert([{
            livestock_id: bundleId,
            buyer_id: user.id,
            seller_id: bundle.user_id
          }])
          .select()
          .single();
        if (newConvo) setConversationId(newConvo.id);
      }
    };
    getOrCreateConversation();
  }, [user, bundle, bundleId]);

  const toggleWishlist = async () => {
    if (!user) {
      alert('Please login to save to wishlist');
      window.location.href = '/login';
      return;
    }
    if (isInWishlist) {
      await supabase
        .from('wishlist')
        .delete()
        .eq('livestock_id', bundleId)
        .eq('user_id', user.id);
      setIsInWishlist(false);
      alert('Removed from wishlist');
    } else {
      await supabase
        .from('wishlist')
        .insert([{
          livestock_id: bundleId,
          user_id: user.id,
          livestock_name: bundle.bundle_name,
          original_price: bundle.bundle_price
        }]);
      setIsInWishlist(true);
      alert('Added to wishlist');
    }
  };

  const toggleLike = () => setHasLiked(!hasLiked);

  const totalPrice = bundle?.bundle_price || (bundle?.price_per_head * bundle?.quantity);
  const pricePerHead = bundle?.price_per_head || (totalPrice / bundle?.quantity);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Bundle not found</h2>
          <Link to="/Browse">
            <Button>Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/Browse">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Bundle Details</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Image Section */}
        <Card className="overflow-hidden rounded-xl">
          {bundle.video_url ? (
            <video
              src={bundle.video_url}
              className="w-full h-80 object-cover"
              controls
              poster={bundle.images?.[0]}
            />
          ) : bundle.images && bundle.images[0] ? (
            <img
              src={bundle.images[0]}
              alt={bundle.bundle_name}
              className="w-full h-80 object-cover cursor-pointer"
              onClick={() => {
                setCurrentImageIndex(0);
                setLightboxOpen(true);
              }}
            />
          ) : (
            <div className="h-80 bg-muted flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground" />
            </div>
          )}

          {bundle.images && bundle.images.length > 1 && (
            <div className="p-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Additional photos</p>
              <div className="flex gap-2 overflow-x-auto">
                {bundle.images.slice(1).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${bundle.bundle_name} ${idx + 2}`}
                    className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition"
                    onClick={() => {
                      setCurrentImageIndex(idx + 1);
                      setLightboxOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Main Info Card */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Bundle #{bundle.id}</span>
                </div>
                <h2 className="text-2xl font-bold mb-1">{bundle.bundle_name}</h2>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MapPin className="w-3 h-3" />
                  <span>{bundle.location}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={toggleWishlist} className="rounded-full">
                  <Bookmark className={`w-5 h-5 ${isInWishlist ? 'fill-primary text-primary' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleLike} className="rounded-full">
                  <Heart className={`w-5 h-5 ${hasLiked ? 'fill-destructive text-destructive' : ''}`} />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-3 border-t">
              <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700">
                <Eye className="w-3 h-3" />
                0 views
              </Badge>
              <Badge variant="secondary" className="gap-1 bg-purple-50 text-purple-700">
                <Package className="w-3 h-3" />
                {bundle.quantity || 1} animals
              </Badge>
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">R {Math.round(pricePerHead).toLocaleString()}<span className="text-sm">/head</span></span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Total: R {Math.round(totalPrice).toLocaleString()} for {bundle.quantity} animals</p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Details and Description */}
        <Tabs>
          <TabsList className="w-full">
            <TabsTrigger active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Details</TabsTrigger>
            <TabsTrigger active={activeTab === 'description'} onClick={() => setActiveTab('description')}>Description</TabsTrigger>
            <TabsTrigger active={activeTab === 'seller'} onClick={() => setActiveTab('seller')}>Seller</TabsTrigger>
          </TabsList>

          <TabsContent active={activeTab === 'details'} className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-base font-semibold mb-3">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bundle.breed_type && (
                    <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Breed</p>
                        <p className="font-medium text-sm">{bundle.breed_type}</p>
                      </div>
                    </div>
                  )}
                  {bundle.pure_cross && (
                    <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                      <CheckCircle className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pure / Cross</p>
                        <p className="font-medium text-sm capitalize">{bundle.pure_cross}</p>
                      </div>
                    </div>
                  )}
                  {bundle.age_display && (
                    <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Age</p>
                        <p className="font-medium text-sm">{bundle.age_display}</p>
                      </div>
                    </div>
                  )}
                  {bundle.weight_display && (
                    <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                      <Weight className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p className="font-medium text-sm">{bundle.weight_display}</p>
                      </div>
                    </div>
                  )}
                  {bundle.pregnancy_status && bundle.pregnancy_status !== 'n/a' && (
                    <div className="flex items-center gap-2 p-2.5 bg-pink-50 rounded-lg">
                      <Baby className="w-4 h-4 text-pink-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pregnancy Status</p>
                        <p className="font-medium text-sm text-pink-600 capitalize">{bundle.pregnancy_status}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent active={activeTab === 'description'} className="space-y-4">
            <Card>
              <CardContent className="p-5">
                {bundle.bundle_description ? (
                  <>
                    <h3 className="text-base font-semibold mb-2">About this bundle</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{bundle.bundle_description}</p>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-8">No description provided</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent active={activeTab === 'seller'} className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                {!user ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground text-sm mb-3">Login to contact the seller</p>
                    <Link to="/login">
                      <Button>Login to Message</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {user.id !== bundle.user_id && conversationId ? (
                      <Button className="w-full gap-2" asChild>
                        <Link to={`/ChatRoom?conversation=${conversationId}&livestock=${bundle.id}`}>
                          <MessageCircle className="w-4 h-4" />
                          Message Seller
                        </Link>
                      </Button>
                    ) : user.id === bundle.user_id ? (
                      <Button className="w-full" variant="outline" disabled>This is your bundle</Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>Loading...</Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full" onClick={() => setLightboxOpen(false)}>
            ✕
          </Button>
          <img src={bundle.images[currentImageIndex]} alt={bundle.bundle_name} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          {bundle.images && bundle.images.length > 1 && (
            <>
              <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 text-white" onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : bundle.images.length - 1));
              }}>
                ←
              </Button>
              <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 text-white" onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev < bundle.images.length - 1 ? prev + 1 : 0));
              }}>
                →
              </Button>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {bundle.images.map((_, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full transition ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}