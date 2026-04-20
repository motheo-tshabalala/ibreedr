import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Heart, Star, Phone, Bookmark, Calendar, Weight, Info, Users, Baby, Hash, Eye, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function BreedDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const livestockId = urlParams.get('id');

  const [user, setUser] = useState(null);
  const [livestock, setLivestock] = useState(null);
  const [seller, setSeller] = useState(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      console.log('Current user:', user?.email);
    };
    getUser();
  }, []);

  useEffect(() => {
    const loadLivestock = async () => {
      if (!livestockId) return;
      setIsLoading(true);

      console.log('Loading livestock ID:', livestockId);

      const { data: livestockData, error: livestockError } = await supabase
        .from('livestock')
        .select('*')
        .eq('id', livestockId)
        .single();

      if (livestockError) {
        console.error('Error loading livestock:', livestockError);
        setIsLoading(false);
        return;
      }

      setLivestock(livestockData);
      console.log('Livestock loaded:', livestockData.name, 'Seller ID:', livestockData.user_id);

      if (livestockData) {
        await supabase
          .from('livestock')
          .update({ views_count: (livestockData.views_count || 0) + 1 })
          .eq('id', livestockId);
        setLivestock({ ...livestockData, views_count: (livestockData.views_count || 0) + 1 });
      }

      if (livestockData.user_id) {
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', livestockData.user_id)
          .single();
        setSeller(sellerData);
      }

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('livestock_id', livestockId)
        .order('created_at', { ascending: false });
      setReviews(reviewsData || []);

      if (user) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('*')
          .eq('livestock_id', livestockId)
          .eq('user_id', user.id)
          .maybeSingle();
        setHasLiked(!!likeData);

        const { data: wishlistData } = await supabase
          .from('wishlist')
          .select('*')
          .eq('livestock_id', livestockId)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsInWishlist(!!wishlistData);
      }

      setIsLoading(false);
    };

    loadLivestock();
  }, [livestockId, user]);

  // Get or create conversation for chat
  useEffect(() => {
    const getOrCreateConversation = async () => {
      if (!user || !livestock) {
        console.log('No user or livestock');
        return;
      }

      if (user.id === livestock.user_id) {
        console.log('Cannot message yourself');
        return;
      }

      console.log('Getting conversation for:', {
        buyerId: user.id,
        sellerId: livestock.user_id,
        livestockId: livestock.id
      });

      // Check if conversation exists
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('id')
        .eq('livestock_id', livestock.id)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (findError) {
        console.error('Error finding conversation:', findError);
      }

      if (existing) {
        console.log('Found existing conversation:', existing.id);
        setConversationId(existing.id);
      } else {
        // Create new conversation
        console.log('Creating new conversation...');
        const { data: newConvo, error: insertError } = await supabase
          .from('conversations')
          .insert([{
            livestock_id: livestock.id,
            buyer_id: user.id,
            seller_id: livestock.user_id
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating conversation:', insertError);
        } else if (newConvo) {
          console.log('Created new conversation:', newConvo.id);
          setConversationId(newConvo.id);
        }
      }
    };

    getOrCreateConversation();
  }, [user, livestock]);

  const toggleLike = async () => {
    if (!user) {
      alert('Please login to like');
      window.location.href = '/login';
      return;
    }
    if (hasLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('livestock_id', livestockId)
        .eq('user_id', user.id);
      await supabase
        .from('livestock')
        .update({ likes_count: (livestock.likes_count || 1) - 1 })
        .eq('id', livestockId);
      setHasLiked(false);
      setLivestock({ ...livestock, likes_count: (livestock.likes_count || 1) - 1 });
    } else {
      await supabase
        .from('likes')
        .insert([{ livestock_id: livestockId, user_id: user.id }]);
      await supabase
        .from('livestock')
        .update({ likes_count: (livestock.likes_count || 0) + 1 })
        .eq('id', livestockId);
      setHasLiked(true);
      setLivestock({ ...livestock, likes_count: (livestock.likes_count || 0) + 1 });
    }
  };

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
        .eq('livestock_id', livestockId)
        .eq('user_id', user.id);
      setIsInWishlist(false);
      alert('Removed from wishlist');
    } else {
      await supabase
        .from('wishlist')
        .insert([{
          livestock_id: livestockId,
          user_id: user.id,
          livestock_name: livestock.name,
          original_price: livestock.price
        }]);
      setIsInWishlist(true);
      alert('Added to wishlist');
    }
  };

  const submitReview = async () => {
    if (!reviewerName) {
      alert('Please enter your name');
      return;
    }
    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        livestock_id: parseInt(livestockId),
        rating,
        comment,
        reviewer_name: reviewerName,
        user_id: user?.id || null
      }])
      .select();
    if (error) {
      console.error('Review error:', error);
      alert('Failed to submit review');
    } else {
      const allRatings = [...reviews, { rating }];
      const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      await supabase
        .from('livestock')
        .update({ average_rating: avgRating })
        .eq('id', livestockId);
      setReviews([data[0], ...reviews]);
      setShowReviewForm(false);
      setComment('');
      setReviewerName('');
      setRating(5);
      alert('Review submitted!');
    }
  };

  const getAgeDisplay = () => {
    if (livestock?.teeth_age) return livestock.teeth_age;
    const years = livestock?.age_years || 0;
    const months = livestock?.age_months || 0;
    if (years > 0 && months > 0) return `${years} years, ${months} months`;
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
    return 'Not specified';
  };

  const getWeightDisplay = () => {
    if (livestock?.weight_min && livestock?.weight_max) {
      return `${livestock.weight_min} - ${livestock.weight_max} kg`;
    } else if (livestock?.weight_min) {
      return `${livestock.weight_min} kg`;
    } else if (livestock?.weight_max) {
      return `Up to ${livestock.weight_max} kg`;
    }
    return null;
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  if (!livestock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-bold text-stone-800 mb-2">Livestock not found</h2>
          <Link to="/Browse">
            <button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-4 py-2 text-sm transition">
              Back to Browse
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const weightDisplay = getWeightDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/Browse">
            <button className="p-1.5 -m-1.5 rounded-full hover:bg-stone-100 transition">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-stone-800">Livestock Details</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Image Section */}
        <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
          {livestock.video_url ? (
            <video
              src={livestock.video_url}
              className="w-full h-80 object-cover"
              controls
              poster={livestock.images?.[0]}
            />
          ) : livestock.images && livestock.images[0] ? (
            <img
              src={livestock.images[0]}
              alt={livestock.name}
              className="w-full h-80 object-cover cursor-pointer"
              onClick={() => {
                setCurrentImageIndex(0);
                setLightboxOpen(true);
              }}
            />
          ) : (
            <div className="h-80 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
              <span className="text-7xl">🐄</span>
            </div>
          )}

          {livestock.images && livestock.images.length > 1 && (
            <div className="p-4 border-t border-stone-100">
              <p className="text-sm text-stone-500 mb-2">Additional photos</p>
              <div className="flex gap-2 overflow-x-auto">
                {livestock.images.slice(1).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${livestock.name} ${idx + 2}`}
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
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4 text-stone-400" />
                <span className="text-xs text-stone-400">Ref: {livestock.reference_number || 'N/A'}</span>
              </div>
              <h2 className="text-2xl font-bold text-stone-800 mb-1">{livestock.name}</h2>
              <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
                <span className="font-medium">{livestock.breed_type}</span>
                <span>•</span>
                <span className="capitalize">{livestock.animal_type}</span>
              </div>
              <div className="flex items-center gap-1 text-stone-500 text-sm">
                <MapPin className="w-3 h-3" />
                <span>{livestock.location}</span>
              </div>
            </div>

            {user && (
              <div className="flex gap-1">
                <button onClick={toggleWishlist} className="p-2 rounded-full hover:bg-stone-100 transition">
                  <Bookmark className={`w-5 h-5 ${isInWishlist ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}`} />
                </button>
                <button onClick={toggleLike} className="p-2 rounded-full hover:bg-stone-100 transition">
                  <Heart className={`w-5 h-5 ${hasLiked ? 'text-rose-500 fill-rose-500' : 'text-stone-400'}`} />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-1.5 bg-amber-50 rounded-full px-3 py-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="font-medium text-amber-700 text-xs">{avgRating > 0 ? avgRating : 'No reviews'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-rose-50 rounded-full px-3 py-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span className="font-medium text-rose-700 text-xs">{livestock.likes_count || 0} likes</span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 rounded-full px-3 py-1">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium text-blue-700 text-xs">{livestock.views_count || 0} views</span>
            </div>
          </div>

          {livestock.price && (
            <div className="pt-3 border-t border-stone-100">
              <p className="text-xs text-stone-500 mb-0.5">Price</p>
              <p className="text-2xl font-bold text-stone-800">R {Number(livestock.price).toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Specifications Card */}
        <div className="bg-white rounded-xl border border-stone-100 p-5">
          <h3 className="text-base font-bold text-stone-800 mb-3">Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {livestock.breed_type && (
              <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-lg">
                <Info className="w-4 h-4 text-stone-400" />
                <div>
                  <p className="text-xs text-stone-400">Breed</p>
                  <p className="font-medium text-stone-700 text-sm">{livestock.breed_type}</p>
                </div>
              </div>
            )}
            {livestock.pure_cross && (
              <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-lg">
                <Users className="w-4 h-4 text-stone-400" />
                <div>
                  <p className="text-xs text-stone-400">Pure / Cross</p>
                  <p className="font-medium text-stone-700 text-sm capitalize">{livestock.pure_cross === 'pure' ? 'Pure Breed' : 'Cross Breed'}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-lg">
              <Calendar className="w-4 h-4 text-stone-400" />
              <div>
                <p className="text-xs text-stone-400">Age</p>
                <p className="font-medium text-stone-700 text-sm">{getAgeDisplay()}</p>
              </div>
            </div>
            {weightDisplay && (
              <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-lg">
                <Weight className="w-4 h-4 text-stone-400" />
                <div>
                  <p className="text-xs text-stone-400">Weight</p>
                  <p className="font-medium text-stone-700 text-sm">{weightDisplay}</p>
                </div>
              </div>
            )}
            {livestock.pregnancy_status && livestock.pregnancy_status !== 'n/a' && (
              <div className="flex items-center gap-2 p-2.5 bg-pink-50 rounded-lg">
                <Baby className="w-4 h-4 text-pink-400" />
                <div>
                  <p className="text-xs text-stone-400">Pregnancy Status</p>
                  <p className="font-medium text-pink-600 text-sm capitalize">{livestock.pregnancy_status}</p>
                </div>
              </div>
            )}
            {livestock.sire_used && (
              <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded-lg">
                <Users className="w-4 h-4 text-stone-400" />
                <div>
                  <p className="text-xs text-stone-400">Sire Used</p>
                  <p className="font-medium text-stone-700 text-sm">{livestock.sire_used}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Health Info */}
        {livestock.health_info && (
          <div className="bg-white rounded-xl border border-stone-100 p-5">
            <h3 className="text-base font-bold text-stone-800 mb-2">Health & Vaccination</h3>
            <p className="text-stone-600 text-sm leading-relaxed">{livestock.health_info}</p>
          </div>
        )}

        {/* Notes */}
        {livestock.notes && (
          <div className="bg-white rounded-xl border border-stone-100 p-5">
            <h3 className="text-base font-bold text-stone-800 mb-2">Additional Information</h3>
            <p className="text-stone-600 text-sm leading-relaxed">{livestock.notes}</p>
          </div>
        )}

        {/* Contact Seller - Hidden until login */}
        <div className="bg-white rounded-xl border border-stone-100 p-5">
          <h3 className="text-base font-bold text-stone-800 mb-3">Contact Seller</h3>

          {!user ? (
            <div className="text-center py-6">
              <p className="text-stone-500 text-sm mb-3">Login to see seller contact information</p>
              <Link to="/login">
                <button className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-5 py-2 text-sm transition">
                  Login to View
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Seller</p>
                <p className="font-medium text-stone-700 text-sm">{livestock.seller_name || seller?.full_name || 'Anonymous'}</p>
              </div>
              {livestock.seller_phone && (
                <div>
                  <p className="text-xs text-stone-400 mb-0.5">Phone</p>
                  <a href={`tel:${livestock.seller_phone}`} className="flex items-center gap-1 text-stone-600 text-sm hover:text-amber-600 transition">
                    <Phone className="w-3.5 h-3.5" />
                    {livestock.seller_phone}
                  </a>
                </div>
              )}

              {(livestock.facebook_url || livestock.instagram_url || livestock.whatsapp_number || livestock.website_url) && (
                <div className="mt-3 pt-2 border-t border-stone-100">
                  <p className="text-xs text-stone-400 mb-1.5">Connect on Social Media</p>
                  <div className="flex flex-wrap gap-2">
                    {livestock.facebook_url && (
                      <a href={livestock.facebook_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs hover:bg-blue-100 transition">
                        📘 Facebook
                      </a>
                    )}
                    {livestock.instagram_url && (
                      <a href={livestock.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-pink-50 text-pink-600 rounded-full text-xs hover:bg-pink-100 transition">
                        📷 Instagram
                      </a>
                    )}
                    {livestock.whatsapp_number && (
                      <a href={`https://wa.me/${livestock.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs hover:bg-green-100 transition">
                        💬 WhatsApp
                      </a>
                    )}
                    {livestock.website_url && (
                      <a href={livestock.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 text-stone-600 rounded-full text-xs hover:bg-stone-200 transition">
                        🌐 Website
                      </a>
                    )}
                  </div>
                </div>
              )}

              {user.id !== livestock.user_id && conversationId ? (
                <div className="pt-3">
                  <Link to={`/ChatRoom?conversation=${conversationId}&livestock=${livestock.id}`}>
                    <button className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-lg h-10 text-sm font-medium flex items-center justify-center gap-1.5 transition">
                      <MessageCircle className="w-4 h-4" />
                      Message Seller
                    </button>
                  </Link>
                </div>
              ) : user.id === livestock.user_id ? (
                <div className="pt-3">
                  <button className="w-full bg-stone-100 text-stone-400 rounded-lg h-10 text-sm font-medium cursor-not-allowed">
                    This is your listing
                  </button>
                </div>
              ) : (
                <div className="pt-3">
                  <button className="w-full bg-stone-100 text-stone-400 rounded-lg h-10 text-sm font-medium cursor-not-allowed">
                    Loading...
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-xl border border-stone-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-stone-800">Reviews ({reviews.length})</h3>
            {user && (
              <button onClick={() => setShowReviewForm(!showReviewForm)} className="text-sm text-amber-600 font-medium">
                Write Review
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="mb-4 p-4 bg-amber-50 rounded-lg space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Your Name</label>
                <input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="Enter your name" className="w-full border border-stone-200 rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setRating(star)} className="p-1">
                      <Star className={`w-6 h-6 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Comment</label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." className="w-full border border-stone-200 rounded-lg p-2 text-sm" rows={3} />
              </div>
              <button onClick={submitReview} className="w-full bg-stone-800 hover:bg-stone-900 text-white rounded-lg py-2 text-sm font-medium transition">
                Submit Review
              </button>
            </div>
          )}

          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-6">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="border-b border-stone-100 pb-3 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} />
                      ))}
                    </div>
                    <span className="font-medium text-stone-700 text-sm">{review.reviewer_name}</span>
                    <span className="text-xs text-stone-400">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.comment && <p className="text-stone-600 text-sm">{review.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white text-3xl z-50 hover:scale-110 transition" onClick={() => setLightboxOpen(false)}>
            ✕
          </button>
          <img src={livestock.images[currentImageIndex]} alt={livestock.name} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          {livestock.images && livestock.images.length > 1 && (
            <>
              <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center transition" onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : livestock.images.length - 1));
              }}>
                ←
              </button>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 flex items-center justify-center transition" onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev < livestock.images.length - 1 ? prev + 1 : 0));
              }}>
                →
              </button>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {livestock.images.map((_, idx) => (
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