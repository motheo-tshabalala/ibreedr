import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Heart, Star, Phone, Bookmark, Calendar, Weight, Info, Users, Baby, Hash, Eye, MessageCircle, Image, X, Shield, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Separator } from "./components/ui/separator";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import LocationMap from './components/LocationMap';
import PayModal from './PayModal';

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
  const [activeTab, setActiveTab] = useState('details');
  const [showPayModal, setShowPayModal] = useState(false);

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

      await supabase.rpc('increment_views', { p_livestock_id: parseInt(livestockId) });
      setLivestock(prev => prev ? { ...prev, views_count: (prev.views_count || 0) + 1 } : null);

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

  useEffect(() => {
    const getOrCreateConversation = async () => {
      if (!user || !livestock) return;
      if (user.id === livestock.user_id) return;

      const { data } = await supabase
        .from('conversations')
        .upsert(
          [{ livestock_id: livestock.id, buyer_id: user.id, seller_id: livestock.user_id }],
          { onConflict: 'livestock_id,buyer_id' }
        )
        .select()
        .single();

      if (data) setConversationId(data.id);
    };
    getOrCreateConversation();
  }, [user, livestock]);

  const toggleLike = async () => {
    if (!user) {
      alert('Please login to like');
      window.location.href = '/login';
      return;
    }
    const { data } = await supabase.rpc('toggle_like', {
      p_livestock_id: parseInt(livestockId),
      p_user_id: user.id
    });
    if (data) {
      setHasLiked(data[0].liked);
      setLivestock(prev => prev ? { ...prev, likes_count: Number(data[0].new_count) } : null);
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      alert('Please login to save to wishlist');
      window.location.href = '/login';
      return;
    }
    if (isInWishlist) {
      await supabase.from('wishlist').delete().eq('livestock_id', livestockId).eq('user_id', user.id);
      setIsInWishlist(false);
      alert('Removed from wishlist');
    } else {
      await supabase.from('wishlist').insert([{
        livestock_id: livestockId,
        user_id: user.id,
        livestock_name: livestock.farm_name || livestock.breed_type || 'Livestock',
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
    const { data, error } = await supabase.rpc('submit_review', {
      p_livestock_id: parseInt(livestockId),
      p_user_id: user?.id || null,
      p_rating: rating,
      p_comment: comment,
      p_reviewer_name: reviewerName
    });
    if (error) {
      console.error('Review error:', error);
      alert('Failed to submit review');
    } else if (data) {
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
    if (livestock?.weight_min && livestock?.weight_max) return `${livestock.weight_min} - ${livestock.weight_max} kg`;
    if (livestock?.weight_min) return `${livestock.weight_min} kg`;
    if (livestock?.weight_max) return `Up to ${livestock.weight_max} kg`;
    return null;
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!livestock) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Listing not found</h2>
          <Link to="/Browse"><Button>Back to Browse</Button></Link>
        </div>
      </div>
    );
  }

  const weightDisplay = getWeightDisplay();
  const titleDisplay = livestock.farm_name || livestock.breed_type || 'Livestock';

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
          <h1 className="text-lg font-semibold truncate">{titleDisplay}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Image Section */}
        <Card className="overflow-hidden rounded-xl">
          {livestock.video_url ? (
            <video src={livestock.video_url} className="w-full h-80 object-cover" controls poster={livestock.images?.[0]} />
          ) : livestock.images && livestock.images[0] ? (
            <img src={livestock.images[0]} alt={titleDisplay} className="w-full h-80 object-cover cursor-pointer" onClick={() => { setCurrentImageIndex(0); setLightboxOpen(true); }} />
          ) : (
            <div className="h-80 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
              <Image className="w-16 h-16 text-amber-300" />
            </div>
          )}
          {livestock.images && livestock.images.length > 1 && (
            <div className="p-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Additional photos</p>
              <div className="flex gap-2 overflow-x-auto">
                {livestock.images.slice(1).map((img, idx) => (
                  <img key={idx} src={img} alt={`${titleDisplay} ${idx + 2}`} className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition" onClick={() => { setCurrentImageIndex(idx + 1); setLightboxOpen(true); }} />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Main Info Card */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Ref: {livestock.reference_number || 'N/A'}</span>
                </div>
                <h2 className="text-2xl font-bold mb-1">{titleDisplay}</h2>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <span className="font-medium">{livestock.breed_type}</span>
                  <span className="text-stone-300">•</span>
                  <span className="capitalize">{livestock.animal_type}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MapPin className="w-3 h-3" /><span>{livestock.location}</span>
                </div>
              </div>
              {user && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={toggleWishlist} className="rounded-full">
                    <Bookmark className={`w-5 h-5 ${isInWishlist ? 'fill-primary text-primary' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleLike} className="rounded-full">
                    <Heart className={`w-5 h-5 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-3 border-t">
              <Badge variant="secondary" className="gap-1"><Star className="w-3 h-3" />{avgRating > 0 ? avgRating : 'No reviews'}</Badge>
              <Badge variant="secondary" className="gap-1 bg-rose-50 text-rose-700"><Heart className="w-3 h-3" />{livestock.likes_count || 0} likes</Badge>
              <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700"><Eye className="w-3 h-3" />{livestock.views_count || 0} views</Badge>
            </div>

            {livestock.price && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-primary">R {Number(livestock.price).toLocaleString()}</p>
                  {user && user.id !== livestock.user_id && (
                    <Button onClick={() => setShowPayModal(true)} className="gap-2">
                      <Shield className="w-4 h-4" /> Pay Now
                    </Button>
                  )}
                </div>
                {livestock.transport_responsibility && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Transport: {livestock.transport_responsibility === 'seller' ? 'Seller delivers' : livestock.transport_responsibility === 'buyer' ? 'Buyer arranges' : 'To be discussed'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 bg-stone-100 p-1 rounded-xl">
          {['details', 'health', 'seller', 'location'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-white shadow-sm text-amber-600' : 'text-stone-500 hover:text-stone-700'}`}>{tab}</button>
          ))}
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-base font-semibold mb-3">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {livestock.breed_type && <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg"><Info className="w-4 h-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Breed</p><p className="font-medium text-sm">{livestock.breed_type}</p></div></div>}
                {livestock.pure_cross && <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg"><Users className="w-4 h-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Pure / Cross</p><p className="font-medium text-sm capitalize">{livestock.pure_cross === 'pure' ? 'Pure Breed' : 'Cross Breed'}</p></div></div>}
                <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg"><Calendar className="w-4 h-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Age</p><p className="font-medium text-sm">{getAgeDisplay()}</p></div></div>
                {weightDisplay && <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg"><Weight className="w-4 h-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Weight</p><p className="font-medium text-sm">{weightDisplay}</p></div></div>}
                {livestock.pregnancy_status && livestock.pregnancy_status !== 'n/a' && <div className="flex items-center gap-2 p-2.5 bg-pink-50 rounded-lg"><Baby className="w-4 h-4 text-pink-500" /><div><p className="text-xs text-muted-foreground">Pregnancy Status</p><p className="font-medium text-sm text-pink-600 capitalize">{livestock.pregnancy_status}</p></div></div>}
                {livestock.sire_used && <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg"><Users className="w-4 h-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Sire Used</p><p className="font-medium text-sm">{livestock.sire_used}</p></div></div>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <Card>
            <CardContent className="p-5">
              {livestock.health_info ? (
                <><h3 className="text-base font-semibold mb-2">Health & Vaccination</h3><p className="text-muted-foreground text-sm leading-relaxed">{livestock.health_info}</p></>
              ) : (
                <div className="text-center py-6"><Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground text-sm">No health information provided</p></div>
              )}
              {livestock.notes && (
                <div className="mt-4 pt-4 border-t"><h3 className="text-base font-semibold mb-2">Additional Notes</h3><p className="text-muted-foreground text-sm leading-relaxed">{livestock.notes}</p></div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Seller Tab */}
        {activeTab === 'seller' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              {!user ? (
                <div className="text-center py-6"><Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground text-sm mb-3">Login to see seller contact information</p><Link to="/login"><Button>Login to View</Button></Link></div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarFallback>{seller?.farm_name?.charAt(0) || seller?.full_name?.charAt(0) || 'S'}</AvatarFallback></Avatar>
                    <div><p className="font-medium">{seller?.farm_name || seller?.full_name || 'Anonymous'}</p><p className="text-xs text-muted-foreground">Member since {seller?.created_at ? new Date(seller.created_at).getFullYear() : '2024'}</p></div>
                  </div>
                  <Separator />
                  {livestock.seller_phone && <div><p className="text-xs text-muted-foreground mb-1">Phone</p><a href={`tel:${livestock.seller_phone}`} className="flex items-center gap-2 text-sm hover:text-primary transition"><Phone className="w-4 h-4" />{livestock.seller_phone}</a></div>}
                  {(livestock.facebook_url || livestock.instagram_url || livestock.whatsapp_number || livestock.website_url) && (
                    <div><p className="text-xs text-muted-foreground mb-2">Social Media</p>
                      <div className="flex flex-wrap gap-2">
                        {livestock.facebook_url && <a href={livestock.facebook_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs hover:bg-blue-100 transition">Facebook</a>}
                        {livestock.instagram_url && <a href={livestock.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-pink-50 text-pink-600 rounded-full text-xs hover:bg-pink-100 transition">Instagram</a>}
                        {livestock.whatsapp_number && <a href={`https://wa.me/${livestock.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs hover:bg-green-100 transition">WhatsApp</a>}
                        {livestock.website_url && <a href={livestock.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition">Website</a>}
                      </div>
                    </div>
                  )}
                  {user.id !== livestock.user_id && conversationId && (
                    <Button className="w-full gap-2" asChild><Link to={`/ChatRoom?conversation=${conversationId}&livestock=${livestock.id}`}><MessageCircle className="w-4 h-4" />Message Seller</Link></Button>
                  )}
                  {user.id === livestock.user_id && <Button className="w-full" variant="outline" disabled>This is your listing</Button>}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Location Tab */}
        {activeTab === 'location' && (
          <Card>
            <CardContent className="p-5">
              {!user ? (
                <div className="text-center py-6"><MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground text-sm mb-3">Login to see farm location</p><Link to="/login"><Button>Login to View</Button></Link></div>
              ) : (
                <div className="space-y-4">
                  {livestock.gps_latitude && livestock.gps_longitude ? (
                    <LocationMap latitude={livestock.gps_latitude} longitude={livestock.gps_longitude} locationName={livestock.location} />
                  ) : (
                    <div className="text-center py-6"><MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground text-sm">Seller hasn't shared exact location.</p><p className="text-xs text-muted-foreground mt-2">{livestock.location || 'Location not specified'}</p></div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Reviews ({reviews.length})</h3>
              {user && <Button variant="outline" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>Write Review</Button>}
            </div>
            {showReviewForm && (
              <div className="mb-4 p-4 bg-muted rounded-lg space-y-3">
                <div><Label htmlFor="reviewerName">Your Name</Label><input id="reviewerName" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="Enter your name" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" /></div>
                <div><Label>Rating</Label><div className="flex gap-1 mt-1">{[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => setRating(star)} className="p-1"><Star className={`w-6 h-6 ${star <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} /></button>)}</div></div>
                <div><Label htmlFor="comment">Comment</Label><Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." className="mt-1" rows={3} /></div>
                <Button onClick={submitReview} className="w-full">Submit Review</Button>
              </div>
            )}
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="text-center py-6"><Star className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p></div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />)}</div>
                      <span className="font-medium text-sm">{review.reviewer_name}</span>
                      <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full" onClick={() => setLightboxOpen(false)}><X className="w-5 h-5" /></Button>
          <img src={livestock.images[currentImageIndex]} alt={titleDisplay} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          {livestock.images && livestock.images.length > 1 && (
            <>
              <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 text-white" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : livestock.images.length - 1)); }}><ArrowLeft className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 text-white" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev < livestock.images.length - 1 ? prev + 1 : 0)); }}><ArrowLeft className="w-5 h-5 rotate-180" /></Button>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">{livestock.images.map((_, idx) => <div key={idx} className={`w-1.5 h-1.5 rounded-full transition ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} />)}</div>
            </>
          )}
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && <PayModal listing={livestock} type="individual" user={user} onClose={() => setShowPayModal(false)} />}
    </div>
  );
}