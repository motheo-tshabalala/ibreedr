import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Heart, Eye, Package, Hash, Bookmark, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-stone-800 mb-2">Bundle not found</h2>
          <Link to="/Browse">
            <button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-4 py-2 text-sm transition">
              Back to Browse
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/Browse">
            <button className="p-1.5 -m-1.5 rounded-full hover:bg-stone-100 transition">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-stone-800">Bundle Details</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Image Section */}
        <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
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
            <div className="h-80 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <Package className="w-16 h-16 text-white/50" />
            </div>
          )}

          {bundle.images && bundle.images.length > 1 && (
            <div className="p-4 border-t border-stone-100">
              <p className="text-sm text-stone-500 mb-2">Additional photos</p>
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
        </div>

        {/* Main Info Card */}
        <div className="bg-white rounded-xl border border-stone-100 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4 text-stone-400" />
                <span className="text-xs text-stone-400">Ref: #{bundle.id}</span>
              </div>
              <h2 className="text-2xl font-bold text-stone-800 mb-1">{bundle.bundle_name}</h2>
              <div className="flex items-center gap-1 text-stone-500 text-sm">
                <MapPin className="w-3 h-3" />
                <span>{bundle.location}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={toggleWishlist} className="p-2 rounded-full hover:bg-stone-100 transition">
                <Bookmark className={`w-5 h-5 ${isInWishlist ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}`} />
              </button>
              <button onClick={toggleLike} className="p-2 rounded-full hover:bg-stone-100 transition">
                <Heart className={`w-5 h-5 ${hasLiked ? 'text-rose-500 fill-rose-500' : 'text-stone-400'}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-1.5 bg-blue-50 rounded-full px-3 py-1">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium text-blue-700 text-xs">0 views</span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-50 rounded-full px-3 py-1">
              <Package className="w-3.5 h-3.5 text-purple-500" />
              <span className="font-medium text-purple-700 text-xs">{bundle.quantity || 1} animals</span>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-600">R {Math.round(pricePerHead).toLocaleString()}<span className="text-sm">/head</span></span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">Total: R {Math.round(totalPrice).toLocaleString()} for {bundle.quantity} animals</p>
          </div>
        </div>

        {/* Specifications */}
        {(bundle.breed_type || bundle.pure_cross || bundle.age_display || bundle.weight_display || bundle.pregnancy_status) && (
          <div className="bg-white rounded-xl border border-stone-100 p-5">
            <h3 className="text-base font-bold text-stone-800 mb-3">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bundle.breed_type && (
                <div className="p-2.5 bg-stone-50 rounded-lg">
                  <p className="text-xs text-stone-400">Breed</p>
                  <p className="font-medium text-stone-700 text-sm">{bundle.breed_type}</p>
                </div>
              )}
              {bundle.pure_cross && (
                <div className="p-2.5 bg-stone-50 rounded-lg">
                  <p className="text-xs text-stone-400">Pure / Cross</p>
                  <p className="font-medium text-stone-700 text-sm capitalize">{bundle.pure_cross}</p>
                </div>
              )}
              {bundle.age_display && (
                <div className="p-2.5 bg-stone-50 rounded-lg">
                  <p className="text-xs text-stone-400">Age</p>
                  <p className="font-medium text-stone-700 text-sm">{bundle.age_display}</p>
                </div>
              )}
              {bundle.weight_display && (
                <div className="p-2.5 bg-stone-50 rounded-lg">
                  <p className="text-xs text-stone-400">Weight</p>
                  <p className="font-medium text-stone-700 text-sm">{bundle.weight_display}</p>
                </div>
              )}
              {bundle.pregnancy_status && bundle.pregnancy_status !== 'n/a' && (
                <div className="p-2.5 bg-pink-50 rounded-lg">
                  <p className="text-xs text-stone-400">Pregnancy Status</p>
                  <p className="font-medium text-pink-600 text-sm capitalize">{bundle.pregnancy_status}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {bundle.bundle_description && (
          <div className="bg-white rounded-xl border border-stone-100 p-5">
            <h3 className="text-base font-bold text-stone-800 mb-2">Description</h3>
            <p className="text-stone-600 text-sm leading-relaxed">{bundle.bundle_description}</p>
          </div>
        )}

        {/* Contact Seller - Hidden until login */}
        <div className="bg-white rounded-xl border border-stone-100 p-5">
          <h3 className="text-base font-bold text-stone-800 mb-3">Contact Seller</h3>

          {!user ? (
            <div className="text-center py-6">
              <p className="text-stone-500 text-sm mb-3">Login to contact the seller</p>
              <Link to="/login">
                <button className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-5 py-2 text-sm transition">
                  Login to Message
                </button>
              </Link>
            </div>
          ) : (
            <div>
              {user.id !== bundle.user_id && conversationId ? (
                <Link to={`/ChatRoom?conversation=${conversationId}&livestock=${bundle.id}`}>
                  <button className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-lg h-10 text-sm font-medium flex items-center justify-center gap-1.5 transition">
                    <MessageCircle className="w-4 h-4" />
                    Message Seller
                  </button>
                </Link>
              ) : user.id === bundle.user_id ? (
                <button className="w-full bg-stone-100 text-stone-400 rounded-lg h-10 text-sm font-medium cursor-not-allowed">
                  This is your bundle
                </button>
              ) : (
                <button className="w-full bg-stone-100 text-stone-400 rounded-lg h-10 text-sm font-medium cursor-not-allowed">
                  Loading...
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white text-3xl z-50 hover:scale-110 transition" onClick={() => setLightboxOpen(false)}>
            ✕
          </button>
          <img src={bundle.images[currentImageIndex]} alt={bundle.bundle_name} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          {bundle.images && bundle.images.length > 1 && (
            <>
              <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center transition" onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : bundle.images.length - 1));
              }}>
                ←
              </button>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center transition" onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev < bundle.images.length - 1 ? prev + 1 : 0));
              }}>
                →
              </button>
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