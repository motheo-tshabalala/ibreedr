import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Star, Users, MessageCircle,
  CheckCircle, Phone, Mail, Calendar, Award,
  Heart, Share2, ExternalLink
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/Badge";
import VerificationBadge from './VerificationBadge';
import LivestockCard from './LivestockCard';

export default function FarmStorefront() {
  const { id } = useParams();
  const [farm, setFarm] = useState(null);
  const [listings, setListings] = useState([]);
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
      setLoading(true);

      // Load farm profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profile) {
        setFarm(profile);

        // Load their listings
        const { data: livestock } = await supabase
          .from('livestock')
          .select('*')
          .eq('user_id', id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        setListings(livestock || []);
      }

      // Check if following
      if (user) {
        const { data: follow } = await supabase
          .from('farm_followers')
          .select('*')
          .eq('farm_id', id)
          .eq('user_id', user.id)
          .single();

        setIsFollowing(!!follow);
      }

      setLoading(false);
    };

    if (id) {
      loadFarm();
    }
  }, [id, user]);

  const toggleFollow = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

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
  };

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
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gray-200">
        {farm.cover_image ? (
          <img src={farm.cover_image} alt={farm.farm_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-green to-primary-green-dark flex items-center justify-center">
            <span className="text-6xl opacity-20">🏠</span>
          </div>
        )}

        {/* Back Button */}
        <Link to="/farms" className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-md">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
      </div>

      {/* Farm Info */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            {/* Logo */}
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
                  <Button variant="outline" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
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
          </div>

          {/* Bio */}
          {farm.farm_bio && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-gray-700 text-sm leading-relaxed">{farm.farm_bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Inventory */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Current Inventory</h2>

        {listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500">No active listings at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((animal) => (
              <LivestockCard key={animal.id} livestock={animal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}