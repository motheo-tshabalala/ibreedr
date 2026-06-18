import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Star, Users, MessageCircle,
  CheckCircle, Phone, Mail, Calendar, Award,
  Heart, Share2, ExternalLink, Clock, Truck,
  User, Building2, Info, DollarSign, Shield,
  Clock3, BadgeCheck
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/Badge";
import VerificationBadge from './VerificationBadge';
import LivestockCard from './LivestockCard';
import LocationMap from './LocationMap';

export default function FarmStorefront() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState(null);
  const [listings, setListings] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const loadFarm = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) {
          console.error('Error loading farm:', profileError);
          setLoading(false);
          return;
        }

        if (profile) {
          setFarm(profile);

          const { data: livestock, error: livestockError } = await supabase
            .from('livestock')
            .select('*')
            .eq('user_id', id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

          if (livestockError) {
            console.error('Error loading listings:', livestockError);
          } else {
            setListings(livestock || []);
          }

          // ✅ FIXED BUG 6 - Get listing IDs first, then fetch reviews
          const { data: farmListings } = await supabase
            .from('livestock')
            .select('id')
            .eq('user_id', id);

          if (farmListings && farmListings.length > 0) {
            const listingIds = farmListings.map(l => l.id);
            const { data: reviewsData, error: reviewsError } = await supabase
              .from('reviews')
              .select('*, livestock(name, breed_type)')
              .in('livestock_id', listingIds)
              .order('created_at', { ascending: false })
              .limit(3);

            if (reviewsError) {
              console.error('Error loading reviews:', reviewsError);
            } else {
              setRecentReviews(reviewsData || []);
            }
          }
        }

        if (user) {
          const { data: follow } = await supabase
            .from('farm_followers')
            .select('*')
            .eq('farm_id', id)
            .eq('user_id', user.id)
            .single();

          setIsFollowing(!!follow);
        }

      } catch (error) {
        console.error('Error loading farm data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFarm();
  }, [id, user]);

  const toggleFollow = useCallback(async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from('farm_followers')
          .delete()
          .eq('farm_id', id)
          .eq('user_id', user.id);
        setIsFollowing(false);
      } else {
        await supabase
          .from('farm_followers')
          .insert({ farm_id: id, user_id: user.id });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  }, [user, isFollowing, id, navigate]);

  const googleMapsKey = useMemo(() => process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '', []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-green border-t-transparent" />
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Farm not found</h2>
          <Link to="/farms" className="text-primary-green mt-2 inline-block">Browse Farms</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white pb-20">
      <div className="relative h-48 md:h-64 bg-gray-200">
        {farm.cover_image ? (
          <img src={farm.cover_image} alt={farm.farm_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-green to-primary-green-dark flex items-center justify-center">
            <Building2 className="w-16 h-16 text-white/20" />
          </div>
        )}

        <Link to="/farms" className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-md">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-white shadow-md flex-shrink-0 overflow-hidden -mt-12">
              {farm.logo_image ? (
                <img src={farm.logo_image} alt={farm.farm_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl bg-primary-green/10 text-primary-green">
                  {farm.farm_name?.charAt(0) || 'F'}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{farm.farm_name || 'Unnamed Farm'}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {farm.verified_farmer && (
                      <VerificationBadge level="farm" size="md" />
                    )}
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {farm.farm_location || 'Location not set'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={toggleFollow}
                    variant={isFollowing ? 'outline' : 'default'}
                    className="gap-2"
                  >
                    <Heart className={`w-4 h-4 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button variant="outline" className="gap-2" asChild>
                    <Link to={`/ChatRoom?conversation=new&farm=${farm.id}`}>
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{listings.length}</span> Active Listings
            </div>
            {farm.years_farming > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">{farm.years_farming}</span> Years Farming
              </div>
            )}
            {farm.total_animals_sold > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Award className="w-4 h-4" />
                <span className="font-semibold">{farm.total_animals_sold}</span> Animals Sold
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="w-4 h-4 fill-gold-accent text-gold-accent" />
              <span className="font-semibold">{farm.rating || 0}</span>
              <span className="text-muted-foreground">
                ({farm.total_reviews || 0} reviews)
              </span>
            </div>
            {farm.created_at && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Member since {new Date(farm.created_at).getFullYear()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {farm.phone && (
          <a
            href={`https://wa.me/${farm.phone.replace(/\D/g, '')}?text=Hi, I found your farm on iBreedr and I'd like to enquire about your livestock.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white py-6 text-base font-semibold">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.438h-.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Farm
            </Button>
          </a>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary-green" />
                  About the Farm
                </h3>
                {farm.farm_bio ? (
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{farm.farm_bio}</p>
                ) : (
                  <p className="text-gray-400 text-sm italic">No farm bio provided yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary-green" />
                  Farm Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {farm.years_farming > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-primary-green" />
                      <div>
                        <p className="text-xs text-gray-500">Years Farming</p>
                        <p className="text-sm font-medium">{farm.years_farming} years</p>
                      </div>
                    </div>
                  )}
                  {farm.total_animals_sold > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <Award className="w-4 h-4 text-primary-green" />
                      <div>
                        <p className="text-xs text-gray-500">Animals Sold</p>
                        <p className="text-sm font-medium">{farm.total_animals_sold}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <Users className="w-4 h-4 text-primary-green" />
                    <div>
                      <p className="text-xs text-gray-500">Active Listings</p>
                      <p className="text-sm font-medium">{listings.length}</p>
                    </div>
                  </div>
                  {farm.verified_farmer && (
                    <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-lg">
                      <Shield className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Verification</p>
                        <p className="text-sm font-medium text-green-600">Verified Farm</p>
                      </div>
                    </div>
                  )}
                  {farm.farm_location && (
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-primary-green" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-medium">{farm.farm_location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary-green" />
                  Transport
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <BadgeCheck className="w-4 h-4 text-primary-green" />
                    <div>
                      <p className="text-xs text-gray-500">Responsibility</p>
                      <p className="text-sm font-medium">
                        {farm.transport_responsibility || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  {farm.transport_range && (
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-primary-green" />
                      <div>
                        <p className="text-xs text-gray-500">Delivery Range</p>
                        <p className="text-sm font-medium">{farm.transport_range}</p>
                      </div>
                    </div>
                  )}
                  {farm.transport_notes && (
                    <div className="p-2.5 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Notes</p>
                      <p className="text-sm font-medium">{farm.transport_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock3 className="w-5 h-5 text-primary-green" />
                  Operating Hours
                </h3>
                <div className="space-y-2">
                  {farm.operating_hours_weekdays && (
                    <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                      <span className="text-gray-500">Monday - Friday</span>
                      <span className="font-medium">{farm.operating_hours_weekdays}</span>
                    </div>
                  )}
                  {farm.operating_hours_saturday && (
                    <div className="flex justify-between text-sm py-1 border-b border-gray-100">
                      <span className="text-gray-500">Saturday</span>
                      <span className="font-medium">{farm.operating_hours_saturday}</span>
                    </div>
                  )}
                  {farm.operating_hours_sunday && (
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-500">Sunday</span>
                      <span className="font-medium">{farm.operating_hours_sunday}</span>
                    </div>
                  )}
                  {!farm.operating_hours_weekdays && (
                    <p className="text-sm text-gray-400 italic">No operating hours set</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {farm.farm_location && googleMapsKey && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-green" />
                    Farm Location
                  </h3>
                  <div className="h-48 rounded-lg overflow-hidden">
                    <iframe
                      title="Farm location"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsKey}&q=${encodeURIComponent(farm.farm_location)}&zoom=10`}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {farm.farm_location}
                  </p>
                </CardContent>
              </Card>
            )}

            {farm.farm_location && !googleMapsKey && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-green" />
                    Farm Location
                  </h3>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{farm.farm_location}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {recentReviews.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 fill-gold-accent text-gold-accent" />
            Recent Reviews ({farm.total_reviews || 0})
          </h3>
          <div className="space-y-3">
            {recentReviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-gold-accent text-gold-accent' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="font-medium text-sm">{review.reviewer_name || 'Anonymous'}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                  )}
                  {review.livestock && (
                    <p className="text-xs text-gray-400 mt-1">
                      on {review.livestock.name || review.livestock.breed_type}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Current Inventory</h2>

        {listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500">No active listings at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((animal) => (
              <LivestockCard
                key={`${animal.id}-${animal.updated_at || animal.created_at}`}
                livestock={animal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}