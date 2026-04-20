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

  // Get or create conversation for chat
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

  const toggleLike = () => {
    setHasLiked(!hasLiked);
  };

  const totalPrice = bundle?.bundle_price || (bundle?.price_per_head * bundle?.quantity);
  const pricePerHead = bundle?.price_per_head || (totalPrice / bundle?.quantity);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Bundle not found</h2>
          <Link to="/Browse">
            <button className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-6 py-2">
              Back to Browse
            </button>
          </Link>
        </div>
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
          <h1 className="text-xl font-bold text-stone-800">Bundle Details</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Image/Video Section with Lightbox */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
          {bundle.video_url ? (
            <video
              src={bundle.video_url}
              className="w-full h-96 object-cover"
              controls
              poster={bundle.images?.[0]}
            />
          ) : bundle.images && bundle.images[0] ? (
            <img
              src={bundle.images[0]}
              alt={bundle.bundle_name}
              className="w-full h-96 object-cover cursor-pointer"
              onClick={() => {
                setCurrentImageIndex(0);
                setLightboxOpen(true);
              }}
            />
          ) : (
            <div className="h-96 bg-gradient-to-br from-green-200 to-green-400 flex items-center justify-center">
              <Package className="w-24 h-24 text-white" />
            </div>
          )}

          {bundle.images && bundle.images.length > 1 && (
            <div className="p-4 border-t">
              <p className="text-sm text-stone-500 mb-2">Additional photos</p>
              <div className="flex gap-2 overflow-x-auto">
                {bundle.images.slice(1).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${bundle.bundle_name} ${idx + 2}`}
                    className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition"
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
        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-stone-400" />
                <span className="text-sm text-stone-500">Ref: #{bundle.id}</span>
              </div>
              <h2 className="text-3xl font-bold text-stone-800 mb-2">{bundle.bundle_name}</h2>
              <div className="flex items-center gap-2 text-stone-600">
                <MapPin className="w-4 h-4" />
                <span>{bundle.location}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleWishlist} className="p-3 hover:bg-stone-100 rounded-full">
                <Bookmark className={`w-7 h-7 ${isInWishlist ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}`} />
              </button>
              <button onClick={toggleLike} className="p-3 hover:bg-stone-100 rounded-full">
                <Heart className={`w-7 h-7 ${hasLiked ? 'text-rose-500 fill-rose-500' : 'text-stone-400'}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4 border-t border-stone-200">
            <div className="flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">0 views</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-100 rounded-full px-4 py-2">
              <Package className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-900">{bundle.quantity || 1} animals</span>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-green-600">R {Math.round(pricePerHead).toLocaleString()}<span className="text-base">/head</span></span>
            </div>
            <p className="text-sm text-stone-500 mt-1">Total: R {Math.round(totalPrice).toLocaleString()} for {bundle.quantity} animals</p>
          </div>
        </div>

        {/* Specifications Card */}
        {(bundle.breed_type || bundle.pure_cross || bundle.age_display || bundle.weight_display || bundle.pregnancy_status) && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-stone-800 mb-4">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bundle.breed_type && (
                <div className="p-3 bg-stone-50 rounded-xl">
                  <p className="text-xs text-stone-500">Breed</p>
                  <p className="font-semibold text-stone-800">{bundle.breed_type}</p>
                </div>
              )}
              {bundle.pure_cross && (
                <div className="p-3 bg-stone-50 rounded-xl">
                  <p className="text-xs text-stone-500">Pure / Cross</p>
                  <p className="font-semibold text-stone-800 capitalize">{bundle.pure_cross}</p>
                </div>
              )}
              {bundle.age_display && (
                <div className="p-3 bg-stone-50 rounded-xl">
                  <p className="text-xs text-stone-500">Age</p>
                  <p className="font-semibold text-stone-800">{bundle.age_display}</p>
                </div>
              )}
              {bundle.weight_display && (
                <div className="p-3 bg-stone-50 rounded-xl">
                  <p className="text-xs text-stone-500">Weight</p>
                  <p className="font-semibold text-stone-800">{bundle.weight_display}</p>
                </div>
              )}
              {bundle.pregnancy_status && bundle.pregnancy_status !== 'n/a' && (
                <div className="p-3 bg-pink-50 rounded-xl">
                  <p className="text-xs text-stone-500">Pregnancy Status</p>
                  <p className="font-semibold text-pink-700 capitalize">{bundle.pregnancy_status}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {bundle.bundle_description && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-stone-800 mb-3">Description</h3>
            <p className="text-stone-700 leading-relaxed">{bundle.bundle_description}</p>
          </div>
        )}

        {/* Contact Seller */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-stone-800 mb-4">Contact Seller</h3>
          {user && user.id !== bundle.user_id && conversationId ? (
            <Link to={`/ChatRoom?conversation=${conversationId}&livestock=${bundle.id}`}>
              <button className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-full h-12 font-semibold flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Message Seller
              </button>
            </Link>
          ) : !user ? (
            <Link to="/login">
              <button className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-full h-12 font-semibold">
                Login to Message Seller
              </button>
            </Link>
          ) : user && user.id === bundle.user_id ? (
            <button className="w-full bg-stone-300 text-stone-500 rounded-full h-12 font-semibold cursor-not-allowed">
              This is your bundle
            </button>
          ) : (
            <button className="w-full bg-stone-300 text-stone-500 rounded-full h-12 font-semibold cursor-not-allowed">
              Loading...
            </button>
          )}
        </div>
      </div>

      {/* Full Screen Image Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl z-50 hover:scale-110 transition"
            onClick={() => setLightboxOpen(false)}
          >
            ✕
          </button>
          <img
            src={bundle.images[currentImageIndex]}
            alt={bundle.bundle_name}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {bundle.images && bundle.images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black/50 hover:bg-black/70 rounded-full w-12 h-12 flex items-center justify-center transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : bundle.images.length - 1));
                }}
              >
                ←
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl bg-black/50 hover:bg-black/70 rounded-full w-12 h-12 flex items-center justify-center transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev < bundle.images.length - 1 ? prev + 1 : 0));
                }}
              >
                →
              </button>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {bundle.images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}