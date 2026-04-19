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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const loadLivestock = async () => {
      if (!livestockId) return;

      setIsLoading(true);

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
      if (!user || !livestock) return;

      // Don't create conversation with yourself
      if (user.id === livestock.user_id) return;

      // Check if conversation exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('livestock_id', livestock.id)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (existing) {
        setConversationId(existing.id);
      } else {
        // Create new conversation
        const { data: newConvo, error } = await supabase
          .from('conversations')
          .insert([{
            livestock_id: livestock.id,
            buyer_id: user.id,
            seller_id: livestock.user_id
          }])
          .select()
          .single();

        if (!error && newConvo) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  if (!livestock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Livestock not found</h2>
          <Link to="/Browse">
            <button className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-6 py-2">
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
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/Browse">
            <button className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-stone-800" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-stone-800">Livestock Details</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
          {livestock.video_url ? (
            <video
              src={livestock.video_url}
              className="w-full h-96 object-cover"
              controls
              poster={livestock.images?.[0]}
            />
          ) : livestock.images && livestock.images[0] ? (
            <img src={livestock.images[0]} alt={livestock.name} className="w-full h-96 object-cover" />
          ) : (
            <div className="h-96 bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center">
              <span className="text-8xl">🐄</span>
            </div>
          )}

          {livestock.images && livestock.images.length > 1 && (
            <div className="p-4 border-t">
              <p className="text-sm text-stone-500 mb-2">Additional photos</p>
              <div className="flex gap-2 overflow-x-auto">
                {livestock.images.slice(1).map((img, idx) => (
                  <img key={idx} src={img} alt={`${livestock.name} ${idx + 2}`} className="w-20 h-20 rounded-lg object-cover" />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-stone-400" />
                <span className="text-sm text-stone-500">Ref: {livestock.reference_number || 'N/A'}</span>
              </div>
              <h2 className="text-3xl font-bold text-stone-800 mb-2">{livestock.name}</h2>
              <div className="flex items-center gap-2 text-stone-600 mb-3">
                <span className="font-medium">{livestock.breed_type}</span>
                <span>•</span>
                <span className="capitalize">{livestock.animal_type}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <MapPin className="w-4 h-4" />
                <span>{livestock.location}</span>
              </div>
            </div>

            {user && (
              <div className="flex gap-2">
                <button onClick={toggleWishlist} className="p-3 hover:bg-stone-100 rounded-full transition-colors">
                  <Bookmark className={`w-7 h-7 ${isInWishlist ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}`} />
                </button>
                <button onClick={toggleLike} className="p-3 hover:bg-stone-100 rounded-full transition-colors">
                  <Heart className={`w-7 h-7 ${hasLiked ? 'text-rose-500 fill-rose-500' : 'text-stone-400'}`} />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 pt-4 border-t border-stone-200">
            <div className="flex items-center gap-2 bg-amber-100 rounded-full px-4 py-2">
              <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
              <span className="font-semibold text-amber-900">{avgRating > 0 ? avgRating : 'No reviews'}</span>
            </div>
            <div className="flex items-center gap-2 bg-rose-100 rounded-full px-4 py-2">
              <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
              <span className="font-semibold text-rose-900">{livestock.likes_count || 0} likes</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">{livestock.views_count || 0} views</span>
            </div>
          </div>

          {livestock.price && (
            <div className="pt-4 border-t border-stone-200">
              <p className="text-sm text-stone-600 mb-1">Price</p>
              <p className="text-3xl font-bold text-stone-800">R {Number(livestock.price).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-stone-800 mb-4">Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {livestock.breed_type && (
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                <Info className="w-5 h-5 text-stone-500" />
                <div>
                  <p className="text-xs text-stone-500">Breed</p>
                  <p className="font-semibold text-stone-800">{livestock.breed_type}</p>
                </div>
              </div>
            )}

            {livestock.pure_cross && (
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                <Users className="w-5 h-5 text-stone-500" />
                <div>
                  <p className="text-xs text-stone-500">Pure / Cross</p>
                  <p className="font-semibold text-stone-800 capitalize">{livestock.pure_cross === 'pure' ? 'Pure Breed' : 'Cross Breed'}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
              <Calendar className="w-5 h-5 text-stone-500" />
              <div>
                <p className="text-xs text-stone-500">Age</p>
                <p className="font-semibold text-stone-800">{getAgeDisplay()}</p>
              </div>
            </div>

            {weightDisplay && (
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                <Weight className="w-5 h-5 text-stone-500" />
                <div>
                  <p className="text-xs text-stone-500">Weight</p>
                  <p className="font-semibold text-stone-800">{weightDisplay}</p>
                </div>
              </div>
            )}

            {livestock.pregnancy_status && livestock.pregnancy_status !== 'n/a' && (
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl">
                <Baby className="w-5 h-5 text-pink-500" />
                <div>
                  <p className="text-xs text-stone-500">Pregnancy Status</p>
                  <p className="font-semibold text-pink-700 capitalize">{livestock.pregnancy_status}</p>
                </div>
              </div>
            )}

            {livestock.rams_used && (
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                <Users className="w-5 h-5 text-stone-500" />
                <div>
                  <p className="text-xs text-stone-500">Rams Used</p>
                  <p className="font-semibold text-stone-800">{livestock.rams_used}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {livestock.health_info && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-stone-800 mb-3">Health & Vaccination</h3>
            <p className="text-stone-700 leading-relaxed">{livestock.health_info}</p>
          </div>
        )}

        {livestock.notes && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-stone-800 mb-3">Additional Information</h3>
            <p className="text-stone-700 leading-relaxed">{livestock.notes}</p>
          </div>
        )}

        {/* Contact Seller Section with Chat Button */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-stone-800 mb-4">Contact Seller</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-stone-600 mb-1">Seller</p>
              <p className="font-semibold text-stone-800">{livestock.seller_name || seller?.full_name || 'Anonymous'}</p>
            </div>
            {livestock.seller_phone && (
              <div>
                <p className="text-sm text-stone-600 mb-2">Phone</p>
                <a href={`tel:${livestock.seller_phone}`} className="flex items-center gap-2 text-stone-800 font-medium hover:text-amber-600">
                  <Phone className="w-5 h-5" />
                  {livestock.seller_phone}
                </a>
              </div>
            )}

            {/* Social Media Links */}
            {(livestock.facebook_url || livestock.instagram_url || livestock.whatsapp_number || livestock.website_url) && (
              <div className="mt-4 pt-3 border-t border-stone-100">
                <p className="text-sm text-stone-600 mb-2">Connect on Social Media</p>
                <div className="flex flex-wrap gap-3">
                  {livestock.facebook_url && (
                    <a href={livestock.facebook_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition">
                      📘 Facebook
                    </a>
                  )}
                  {livestock.instagram_url && (
                    <a href={livestock.instagram_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-pink-50 text-pink-700 rounded-full text-sm hover:bg-pink-100 transition">
                      📷 Instagram
                    </a>
                  )}
                  {livestock.whatsapp_number && (
                    <a href={`https://wa.me/${livestock.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-full text-sm hover:bg-green-100 transition">
                      💬 WhatsApp
                    </a>
                  )}
                  {livestock.website_url && (
                    <a href={livestock.website_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-stone-100 text-stone-700 rounded-full text-sm hover:bg-stone-200 transition">
                      🌐 Website
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Message Seller Button */}
            {user && user.id !== livestock.user_id && conversationId && (
              <div className="pt-4">
                <Link to={`/ChatRoom?conversation=${conversationId}&livestock=${livestock.id}`}>
                  <button className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-full h-12 font-semibold flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Message Seller
                  </button>
                </Link>
              </div>
            )}

            {/* Login prompt if not logged in */}
            {!user && (
              <div className="pt-4">
                <Link to="/login">
                  <button className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-full h-12 font-semibold">
                    Login to Message Seller
                  </button>
                </Link>
              </div>
            )}

            {/* Cannot message yourself */}
            {user && user.id === livestock.user_id && (
              <div className="pt-4">
                <button className="w-full bg-stone-300 text-stone-500 rounded-full h-12 font-semibold cursor-not-allowed">
                  This is your listing
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-stone-800">Reviews ({reviews.length})</h3>
            {user && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="rounded-full px-4 py-2 border-2 border-stone-300 hover:bg-stone-100"
              >
                Write Review
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="mb-6 p-4 bg-amber-50 rounded-xl space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">Your Name</label>
                <input
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full border-2 border-stone-200 rounded-xl p-3"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setRating(star)} className="p-1">
                      <Star className={`w-8 h-8 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full border-2 border-stone-200 rounded-xl p-3"
                  rows={3}
                />
              </div>
              <button
                onClick={submitReview}
                className="w-full bg-stone-800 hover:bg-stone-900 text-white rounded-full py-3"
              >
                Submit Review
              </button>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-center text-stone-500 py-8">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="border-b border-stone-200 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} />
                      ))}
                    </div>
                    <span className="font-semibold text-stone-800">{review.reviewer_name}</span>
                    <span className="text-xs text-stone-400">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.comment && <p className="text-stone-700">{review.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}