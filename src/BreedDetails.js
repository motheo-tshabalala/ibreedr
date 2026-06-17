import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Star, Phone, Bookmark, Calendar, Weight, Info, Users, Baby, Hash, Eye, MessageCircle, Building2, CheckCircle, Package, Percent, Clock, Shield } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Separator } from "./components/ui/separator";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import LocationMap from './components/LocationMap';
import VerificationBadge from './components/VerificationBadge';

export default function BreedDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const livestockId = searchParams.get('id');

  const [user, setUser] = useState(null);
  const [livestock, setLivestock] = useState(null);
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
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const loadLivestock = async () => {
      if (!livestockId) {
        navigate('/livestock');
        return;
      }
      setIsLoading(true);

      const { data: livestockData, error: livestockError } = await supabase
        .from('livestock')
        .select(`
          *,
          profiles!user_id (
            id,
            farm_name,
            full_name,
            farm_location,
            farm_bio,
            verified_farmer,
            years_farming,
            total_animals_sold,
            phone,
            operating_hours_weekdays,
            operating_hours_saturday,
            operating_hours_sunday
          )
        `)
        .eq('id', livestockId)
        .single();

      if (livestockError) {
        console.error('Error loading livestock:', livestockError);
        setIsLoading(false);
        return;
      }

      if (livestockData) {
        const currentViews = livestockData.views_count || 0;

        const { error: viewError } = await supabase
          .from('livestock')
          .update({ views_count: currentViews + 1 })
          .eq('id', livestockId);

        if (viewError) {
          console.error('Error incrementing views:', viewError);
        }

        setLivestock({
          ...livestockData,
          views_count: currentViews + 1
        });
      }

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('livestock_id', livestockId)
        .order('created_at', { ascending: false });
      setReviews(reviewsData || []);

      if (user) {
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
  }, [livestockId, user, navigate]);

  useEffect(() => {
    const getOrCreateConversation = async () => {
      if (!user || !livestock) return;
      if (user.id === livestock.user_id) return;

      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('livestock_id', livestock.id)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (existing) {
        setConversationId(existing.id);
      } else {
        const { data: newConvo } = await supabase
          .from('conversations')
          .insert([{
            livestock_id: livestock.id,
            buyer_id: user.id,
            seller_id: livestock.user_id
          }])
          .select()
          .single();
        if (newConvo) setConversationId(newConvo.id);
      }
    };
    getOrCreateConversation();
  }, [user, livestock]);

  const toggleWishlist = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please login to save to wishlist' });
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    if (isInWishlist) {
      await supabase.from('wishlist').delete().eq('livestock_id', livestockId).eq('user_id', user.id);
      setIsInWishlist(false);
      setMessage({ type: 'success', text: 'Removed from wishlist' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } else {
      await supabase.from('wishlist').insert([{
        livestock_id: livestockId,
        user_id: user.id,
        livestock_name: livestock.name || `${livestock.breed_type} x${livestock.quantity || 1}`,
        original_price: livestock.price
      }]);
      setIsInWishlist(true);
      setMessage({ type: 'success', text: 'Added to wishlist' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }
  };

  const submitReview = async () => {
    if (!reviewerName) {
      setMessage({ type: 'error', text: 'Please enter your name' });
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
      setMessage({ type: 'error', text: 'Failed to submit review' });
    } else {
      setReviews([data[0], ...reviews]);
      setShowReviewForm(false);
      setComment('');
      setReviewerName('');
      setRating(5);
      setMessage({ type: 'success', text: 'Review submitted!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
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

  const quantity = livestock?.quantity || 1;
  const pricePerHead = livestock?.price || 0;
  const isBundle = livestock?.is_bundle || false;
  const discount = livestock?.bundle_discount || 0;
  const totalPrice = isBundle
    ? pricePerHead * quantity * (1 - discount / 100)
    : pricePerHead * quantity;

  // Calculate days since listing
  const daysSince = livestock?.created_at
    ? Math.floor((new Date() - new Date(livestock.created_at)) / (1000 * 60 * 60 * 24))
    : 0;

  const farmName = livestock?.profiles?.farm_name || livestock?.profiles?.full_name || 'Individual Seller';
  const isVerified = livestock?.profiles?.verified_farmer || false;
  const whatsappNumber = livestock?.whatsapp_number || livestock?.profiles?.phone;

  const handleShare = () => {
    const shareData = {
      title: `${livestock.breed_type} for sale on iBreedr`,
      text: `${livestock.name || livestock.breed_type} — R${Number(livestock.price).toLocaleString()}`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setMessage({ type: 'success', text: 'Link copied to clipboard!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = window.location.href;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setMessage({ type: 'success', text: 'Link copied to clipboard!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-green border-t-transparent" />
      </div>
    );
  }

  if (!livestock) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Livestock not found</h2>
          <Link to="/livestock">
            <Button>Back to Browse</Button>
          </Link>
        </div>
      </div>
    );
  }

  const weightDisplay = getWeightDisplay();

  return (
    <div className="min-h-screen bg-warm-white pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/livestock">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Livestock Details</h1>
          {isBundle && (
            <Badge className="ml-auto bg-amber-500 text-white">Bundle</Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Message */}
        {message.text && (
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            }`}>
            {message.text}
          </div>
        )}

        {/* ✅ 60+ Days Status Prompt */}
        {daysSince > 60 && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Still available? Contact seller to confirm.
            </p>
          </div>
        )}

        {/* Image Section */}
        <Card className="overflow-hidden rounded-xl">
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
              alt={livestock.name || `${livestock.breed_type}`}
              className="w-full h-80 object-cover cursor-pointer"
              onClick={() => {
                setCurrentImageIndex(0);
                setLightboxOpen(true);
              }}
            />
          ) : (
            <div className="h-80 bg-muted flex items-center justify-center">
              <span className="text-7xl">🐄</span>
            </div>
          )}

          {livestock.images && livestock.images.length > 1 && (
            <div className="p-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Additional photos</p>
              <div className="flex gap-2 overflow-x-auto">
                {livestock.images.slice(1).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${livestock.name || livestock.breed_type} ${idx + 2}`}
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

        {/* Farm Card */}
        <Link to={`/farm/${livestock.user_id}`}>
          <Card className="overflow-hidden border-primary-green/20 hover:border-primary-green transition cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-green/10 flex items-center justify-center text-xl text-primary-green flex-shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{farmName}</h3>
                    {isVerified && <VerificationBadge level="farm" size="sm" />}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span>{livestock.profiles?.farm_location || livestock.location || 'Location not set'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">View Farm</p>
                  <ArrowRight className="w-4 h-4 text-primary-green" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Main Info Card */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Ref: {livestock.reference_number || 'N/A'}</span>
                  {daysSince > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      Listed {daysSince} days ago
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {livestock.name || `${livestock.breed_type} x${quantity}`}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <span className="font-medium">{livestock.breed_type}</span>
                  <span>•</span>
                  <span className="capitalize">{livestock.animal_type}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MapPin className="w-3 h-3" />
                  <span>{livestock.location}</span>
                </div>
              </div>

              {user && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={toggleWishlist} className="rounded-full">
                    <Bookmark className={`w-5 h-5 ${isInWishlist ? 'fill-primary-green text-primary-green' : ''}`} />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-3 border-t">
              {quantity > 1 && (
                <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700">
                  <Users className="w-3 h-3" />
                  {quantity} animals
                </Badge>
              )}
              {isBundle && (
                <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700">
                  <Percent className="w-3 h-3" />
                  {discount}% bundle discount
                </Badge>
              )}
              <Badge variant="secondary" className="gap-1">
                <Star className="w-3 h-3" />
                {avgRating > 0 ? avgRating : 'No reviews'}
              </Badge>
              <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700">
                <Eye className="w-3 h-3" />
                {livestock.views_count || 0} views
              </Badge>
            </div>

            <div className="pt-3 border-t">
              {quantity === 1 ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                  <p className="text-2xl font-bold text-primary-green">R {Number(pricePerHead).toLocaleString()}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price per animal</span>
                    <span className="font-semibold">R {Number(pricePerHead).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity</span>
                    <span className="font-semibold">{quantity} animals</span>
                  </div>
                  {isBundle && discount > 0 && (
                    <div className="flex justify-between text-sm text-amber-600">
                      <span>Bundle discount ({discount}%)</span>
                      <span>- R {Math.round((pricePerHead * quantity * discount) / 100).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-2 border-t">
                    <span className="text-gray-700">Total</span>
                    <span className="text-primary-green">R {Math.round(totalPrice).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp & Contact Section */}
        <Card>
          <CardContent className="p-5 space-y-3">
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=Hi, I'm interested in your ${livestock.breed_type} listing on iBreedr (Ref: ${livestock.reference_number})`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white py-6 text-base font-semibold">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.438h-.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp Seller
                </Button>
              </a>
            )}

            <button
              onClick={handleShare}
              className="w-full mt-2 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Listing
            </button>

            {livestock.profiles?.operating_hours_weekdays && (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <Clock className="w-4 h-4 text-primary-green" />
                <span>
                  Reachable Mon–Fri {livestock.profiles.operating_hours_weekdays}
                  {livestock.profiles.operating_hours_saturday && `, Sat ${livestock.profiles.operating_hours_saturday}`}
                </span>
              </div>
            )}

            {user && user.id !== livestock.user_id && conversationId && (
              <Button className="w-full gap-2 bg-primary-green hover:bg-primary-green-dark" variant="outline" asChild>
                <Link to={`/ChatRoom?conversation=${conversationId}&livestock=${livestock.id}`}>
                  <MessageCircle className="w-4 h-4" />
                  Message on iBreedr
                </Link>
              </Button>
            )}

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setMessage({ type: 'info', text: 'Report submitted. We\'ll review this listing.' });
                  setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition"
              >
                Report listing
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'details'
                ? 'bg-white shadow-sm text-primary-green'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'health'
                ? 'bg-white shadow-sm text-primary-green'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Health
          </button>
          <button
            onClick={() => setActiveTab('seller')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'seller'
                ? 'bg-white shadow-sm text-primary-green'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Farm
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'location'
                ? 'bg-white shadow-sm text-primary-green'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Location
          </button>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-base font-semibold mb-3">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {livestock.breed_type && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Breed</p>
                      <p className="font-medium text-sm">{livestock.breed_type}</p>
                    </div>
                  </div>
                )}
                {livestock.pure_cross && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pure / Cross</p>
                      <p className="font-medium text-sm capitalize">{livestock.pure_cross}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="font-medium text-sm">{getAgeDisplay()}</p>
                  </div>
                </div>
                {weightDisplay && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                    <Weight className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="font-medium text-sm">{weightDisplay}</p>
                    </div>
                  </div>
                )}
                {livestock.pregnancy_status && livestock.pregnancy_status !== 'n/a' && (
                  <div className="flex items-center gap-2 p-2.5 bg-pink-50 rounded-lg">
                    <Baby className="w-4 h-4 text-pink-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Pregnancy Status</p>
                      <p className="font-medium text-sm text-pink-600 capitalize">{livestock.pregnancy_status}</p>
                    </div>
                  </div>
                )}
                {livestock.sire_used && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sire Used</p>
                      <p className="font-medium text-sm">{livestock.sire_used}</p>
                    </div>
                  </div>
                )}
                {quantity > 1 && (
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg">
                    <Users className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Animals</p>
                      <p className="font-medium text-sm">{quantity} animals</p>
                    </div>
                  </div>
                )}
                {isBundle && discount > 0 && (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg">
                    <Percent className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Bundle Discount</p>
                      <p className="font-medium text-sm">{discount}% off</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && (
          <Card>
            <CardContent className="p-5">
              {livestock.health_info ? (
                <>
                  <h3 className="text-base font-semibold mb-2">Health & Vaccination</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{livestock.health_info}</p>
                </>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-6">No health information provided</p>
              )}
              {livestock.notes && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-base font-semibold mb-2">Additional Notes</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{livestock.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Farm Tab */}
        {activeTab === 'seller' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              {!user ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm mb-3">Login to see farm contact information</p>
                  <Link to="/login">
                    <Button>Login to View</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{farmName.charAt(0) || 'F'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{farmName}</p>
                      <div className="flex items-center gap-2 text-xs">
                        {isVerified && <VerificationBadge level="farm" size="sm" />}
                        {livestock.profiles?.years_farming > 0 && (
                          <span className="text-muted-foreground">{livestock.profiles.years_farming} years farming</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {livestock.profiles?.farm_bio && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">About</p>
                      <p className="text-sm">{livestock.profiles.farm_bio}</p>
                    </div>
                  )}

                  {livestock.seller_phone && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Phone</p>
                      <a href={`tel:${livestock.seller_phone}`} className="flex items-center gap-2 text-sm hover:text-primary-green transition">
                        <Phone className="w-4 h-4" />
                        {livestock.seller_phone}
                      </a>
                    </div>
                  )}

                  {user.id !== livestock.user_id && conversationId && (
                    <Button className="w-full gap-2 bg-primary-green hover:bg-primary-green-dark" asChild>
                      <Link to={`/ChatRoom?conversation=${conversationId}&livestock=${livestock.id}`}>
                        <MessageCircle className="w-4 h-4" />
                        Message Farm
                      </Link>
                    </Button>
                  )}
                  {user.id === livestock.user_id && (
                    <Button className="w-full" variant="outline" disabled>This is your listing</Button>
                  )}

                  <Button className="w-full" variant="outline" asChild>
                    <Link to={`/farm/${livestock.user_id}`}>
                      <Building2 className="w-4 h-4 mr-2" />
                      View Full Farm Profile
                    </Link>
                  </Button>
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
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm mb-3">Login to see farm location</p>
                  <Link to="/login">
                    <Button>Login to View</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {livestock.gps_latitude && livestock.gps_longitude ? (
                    <LocationMap
                      latitude={livestock.gps_latitude}
                      longitude={livestock.gps_longitude}
                      locationName={livestock.location}
                    />
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground text-sm">Farm hasn't shared exact location.</p>
                      <p className="text-xs text-muted-foreground mt-2">📍 {livestock.location || 'Location not specified'}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reviews Section */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Reviews ({reviews.length})</h3>
              {user && (
                <Button variant="outline" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>
                  Write Review
                </Button>
              )}
            </div>

            {showReviewForm && (
              <div className="mb-4 p-4 bg-muted rounded-lg space-y-3">
                <div>
                  <Label htmlFor="reviewerName">Your Name</Label>
                  <input
                    id="reviewerName"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label>Rating</Label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setRating(star)} className="p-1">
                        <Star className={`w-6 h-6 ${star <= rating ? 'fill-gold-accent text-gold-accent' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <Button onClick={submitReview} className="w-full bg-primary-green hover:bg-primary-green-dark">Submit Review</Button>
              </div>
            )}

            <div className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-gold-accent text-gold-accent' : 'text-gray-300'}`} />
                        ))}
                      </div>
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
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full" onClick={() => setLightboxOpen(false)}>
            ✕
          </Button>
          <img src={livestock.images[currentImageIndex]} alt={livestock.name || livestock.breed_type} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          {livestock.images && livestock.images.length > 1 && (
            <>
              <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 text-white" onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : livestock.images.length - 1));
              }}>
                ←
              </Button>
              <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full w-10 h-10 text-white" onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev < livestock.images.length - 1 ? prev + 1 : 0));
              }}>
                →
              </Button>
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