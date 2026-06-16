import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, X, MapPin, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import FarmCard from '../components/FarmCard';
import { Button } from '../components/ui/button';

export default function FarmsPage() {
  const [farms, setFarms] = useState([]);
  const [filteredFarms, setFilteredFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    province: '',
    verifiedOnly: false,
    sortBy: 'newest'
  });

  useEffect(() => {
    const loadFarms = async () => {
      setLoading(true);

      // Only get farms that have active listings
      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          *,
          livestock:livestock(count)
        `)
        .eq('livestock.status', 'active')
        .order('created_at', { ascending: false });

      if (profiles) {
        const farmsWithCounts = profiles.map((farm) => ({
          ...farm,
          listing_count: farm.livestock?.[0]?.count || 0
        }));

        // Filter out farms with 0 listings
        const farmsWithListings = farmsWithCounts.filter(f => f.listing_count > 0);
        setFarms(farmsWithListings);
        setFilteredFarms(farmsWithListings);
      }

      setLoading(false);
    };

    loadFarms();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let results = [...farms];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(farm =>
        farm.farm_name?.toLowerCase().includes(query) ||
        farm.farm_location?.toLowerCase().includes(query) ||
        farm.farm_bio?.toLowerCase().includes(query)
      );
    }

    if (filters.province) {
      results = results.filter(farm =>
        farm.farm_location?.toLowerCase().includes(filters.province.toLowerCase())
      );
    }

    if (filters.verifiedOnly) {
      results = results.filter(farm => farm.verified_farmer === true);
    }

    switch (filters.sortBy) {
      case 'oldest':
        results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'listings':
        results.sort((a, b) => (b.listing_count || 0) - (a.listing_count || 0));
        break;
      case 'verified':
        results.sort((a, b) => (b.verified_farmer ? 1 : 0) - (a.verified_farmer ? 1 : 0));
        break;
      default:
        results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setFilteredFarms(results);
  }, [searchQuery, filters, farms]);

  const clearFilters = () => {
    setFilters({
      province: '',
      verifiedOnly: false,
      sortBy: 'newest'
    });
    setSearchQuery('');
  };

  const hasActiveFilters = searchQuery || filters.province || filters.verifiedOnly;

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white pb-20">
      {/* Header */}
      <div className="bg-primary-green text-white sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Farms</h1>
            <span className="text-sm text-green-200">{filteredFarms.length} farms</span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search farms by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gold-accent outline-none"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-3 flex items-center gap-2 text-sm text-green-100 hover:text-white transition"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-md mx-auto space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Province</label>
              <select
                value={filters.province}
                onChange={(e) => setFilters({ ...filters, province: e.target.value })}
                className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">All Provinces</option>
                <option value="Gauteng">Gauteng</option>
                <option value="Mpumalanga">Mpumalanga</option>
                <option value="Limpopo">Limpopo</option>
                <option value="North West">North West</option>
                <option value="Free State">Free State</option>
                <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                <option value="Eastern Cape">Eastern Cape</option>
                <option value="Western Cape">Western Cape</option>
                <option value="Northern Cape">Northern Cape</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="listings">Most Listings</option>
                <option value="verified">Verified First</option>
              </select>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                  className="w-4 h-4 text-primary-green"
                />
                Verified Farms Only
              </label>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-md mx-auto px-4 py-4">
        {filteredFarms.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No farms with listings</h3>
            <p className="text-gray-500 text-sm">Farms appear here once they have active listings</p>
            <Link to="/SellerUpload" className="mt-4 inline-block">
              <Button className="bg-primary-green hover:bg-primary-green-dark text-white">
                List Your Livestock
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFarms.map((farm) => (
              <FarmCard key={farm.id} farm={farm} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}