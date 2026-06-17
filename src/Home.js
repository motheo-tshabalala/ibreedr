import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Star, MapPin, Shield, Users, Award, ChevronRight, Building2, Calendar, Package, MessageCircle } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";
import FarmCard from './components/FarmCard';

export default function Home() {
  const [featuredFarms, setFeaturedFarms] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Load featured farms (only those with active listings)
      const { data: farms } = await supabase
        .from('profiles')
        .select(`
          *,
          livestock:livestock(count)
        `)
        .eq('livestock.status', 'active')
        .limit(6);

      if (farms) {
        const farmsWithCounts = farms.map((farm) => ({
          ...farm,
          listing_count: farm.livestock?.[0]?.count || 0
        }));

        const farmsWithListings = farmsWithCounts.filter(f => f.listing_count > 0);
        setFeaturedFarms(farmsWithListings);
      }

      // Load recent listings
      const { data: listings } = await supabase
        .from('livestock')
        .select(`
          *,
          profiles!user_id (
            farm_name,
            verified_farmer,
            farm_location,
            years_farming
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      setRecentListings(listings || []);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white pb-20">
      {/* Hero Section - With Background Image */}
      <div
        className="relative bg-primary-green text-white overflow-hidden"
        style={{
          background: 'linear-gradient(rgba(31, 77, 58, 0.82), rgba(31, 77, 58, 0.9)), url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600") center/cover'
        }}
      >
        <div className="max-w-md mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Your livestock. Your price. Your buyers.
            </h1>
            <p className="text-green-100 text-sm md:text-base max-w-sm mx-auto">
              South Africa's livestock marketplace — list in minutes, sell with confidence
            </p>
          </div>

          {/* Search Bar - Full width with larger padding */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search farms, breeds, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-32 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gold-accent outline-none transition text-base"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-green text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-green-dark transition"
            >
              Search
            </button>
          </form>

          {/* Quick Filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <Link to="/search?type=cattle">
              <span className="px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm whitespace-nowrap hover:bg-white/25 transition">
                Cattle
              </span>
            </Link>
            <Link to="/search?type=goats">
              <span className="px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm whitespace-nowrap hover:bg-white/25 transition">
                Goats
              </span>
            </Link>
            <Link to="/search?type=sheep">
              <span className="px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm whitespace-nowrap hover:bg-white/25 transition">
                Sheep
              </span>
            </Link>
            <Link to="/search?type=pigs">
              <span className="px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm whitespace-nowrap hover:bg-white/25 transition">
                Pigs
              </span>
            </Link>
            <Link to="/search?type=poultry">
              <span className="px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm whitespace-nowrap hover:bg-white/25 transition">
                Poultry
              </span>
            </Link>
            <Link to="/search?type=horses">
              <span className="px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm whitespace-nowrap hover:bg-white/25 transition">
                Horses
              </span>
            </Link>
            <Link to="/search?type=donkeys">
              <span className="px-4 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm whitespace-nowrap hover:bg-white/25 transition">
                Donkeys
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-md mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-6">How It Works</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-14 h-14 bg-primary-green/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Search className="w-6 h-6 text-primary-green" />
            </div>
            <p className="text-sm font-medium">1. Search</p>
            <p className="text-xs text-gray-500">Find farms or livestock</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-primary-green/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageCircle className="w-6 h-6 text-primary-green" />
            </div>
            <p className="text-sm font-medium">2. Connect</p>
            <p className="text-xs text-gray-500">Message the farm</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 bg-primary-green/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-primary-green" />
            </div>
            <p className="text-sm font-medium">3. Buy</p>
            <p className="text-xs text-gray-500">With confidence</p>
          </div>
        </div>
      </div>

      {/* Featured Farms */}
      <div className="max-w-md mx-auto px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Featured Farms</h2>
          <Link to="/farms" className="text-sm text-primary-green hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredFarms.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500 text-sm">No farms with active listings yet</p>
            <p className="text-xs text-gray-400 mt-1">Farms appear here once they list livestock</p>
            <Link to="/SellerUpload">
              <Button className="mt-3 bg-primary-green hover:bg-primary-green-dark text-white">
                List Your Livestock
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {featuredFarms.map((farm) => (
              <FarmCard key={farm.id} farm={farm} />
            ))}
          </div>
        )}
      </div>

      {/* Recently Listed */}
      <div className="max-w-md mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recently Listed</h2>
          <Link to="/livestock" className="text-sm text-primary-green hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentListings.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500 text-sm">No recent listings</p>
            <Link to="/SellerUpload">
              <Button className="mt-3 bg-primary-green hover:bg-primary-green-dark text-white">
                Be the first to list
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentListings.map((animal) => {
              const quantity = animal.quantity || 1;
              const farmName = animal.profiles?.farm_name || 'Farm';
              const isVerified = animal.profiles?.verified_farmer || false;
              const yearsFarming = animal.profiles?.years_farming || 0;
              const farmLocation = animal.profiles?.farm_location || animal.location || '';

              return (
                <Link to={`/BreedDetails?id=${animal.id}`} key={animal.id}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-primary-green">
                    <div className="flex gap-3 p-3">
                      {/* Image - increased to w-24 h-24 */}
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {animal.images && animal.images[0] ? (
                          <img src={animal.images[0]} alt={animal.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">🐄</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {/* Farm Name */}
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3 h-3 text-primary-green" />
                              <span className="font-semibold text-sm text-gray-900 truncate">{farmName}</span>
                              {isVerified && (
                                <span className="text-xs text-primary-green flex-shrink-0">✓</span>
                              )}
                            </div>

                            {/* Location */}
                            {farmLocation && (
                              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{farmLocation}</span>
                              </div>
                            )}

                            {/* Animal Details */}
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm font-medium text-gray-900">
                                {animal.name || `${animal.breed_type} x${quantity}`}
                              </p>
                              {quantity > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  {quantity} animals
                                </Badge>
                              )}
                              {animal.is_bundle && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                  Bundle
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{animal.breed_type}</p>

                            {/* Reference Number */}
                            {animal.reference_number && (
                              <p className="text-[10px] text-gray-300 mt-1">
                                Ref: {animal.reference_number}
                              </p>
                            )}
                          </div>

                          {/* Price */}
                          <div className="text-right flex-shrink-0 ml-2">
                            {quantity === 1 ? (
                              <p className="font-bold text-primary-green text-sm">R {Number(animal.price).toLocaleString()}</p>
                            ) : (
                              <>
                                <p className="font-bold text-primary-green text-sm">
                                  R {Math.round(animal.price * quantity * (animal.is_bundle ? (1 - (animal.bundle_discount || 0) / 100) : 1)).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-400">
                                  R {Number(animal.price).toLocaleString()}/head
                                </p>
                                {animal.is_bundle && animal.bundle_discount > 0 && (
                                  <p className="text-xs text-green-600">{animal.bundle_discount}% off</p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="max-w-md mx-auto px-4 pb-8">
        <div className="bg-primary-green rounded-2xl p-6 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Ready to sell your livestock?</h2>
          <p className="text-green-100 text-sm mb-4">Join thousands of farmers already using iBreedr</p>
          <Link to="/SellerUpload">
            <Button className="bg-gold-accent hover:bg-gold-accent-light text-white px-6 py-2 rounded-xl font-semibold">
              Start Selling
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}