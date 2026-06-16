import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Filter, MapPin, Star, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/button";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    animalType: '',
    province: '',
    breed: '',
    minPrice: '',
    maxPrice: '',
    verifiedOnly: false,
    transportAvailable: false,
    distance: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ibreedr_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() && !filters.animalType) {
      return;
    }

    setLoading(true);

    let query = supabase
      .from('livestock')
      .select(`
        *,
        profiles!user_id (
          farm_name,
          full_name,
          verified_farmer,
          farm_location
        )
      `)
      .eq('status', 'active');

    // Search by query
    if (searchQuery.trim()) {
      query = query.or(
        `name.ilike.%${searchQuery}%,` +
        `breed_type.ilike.%${searchQuery}%,` +
        `profiles.farm_name.ilike.%${searchQuery}%`
      );
    }

    // Filters
    if (filters.animalType) {
      query = query.eq('animal_type', filters.animalType);
    }

    if (filters.province) {
      query = query.ilike('location', `%${filters.province}%`);
    }

    if (filters.breed) {
      query = query.ilike('breed_type', `%${filters.breed}%`);
    }

    if (filters.minPrice) {
      query = query.gte('price', parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      query = query.lte('price', parseFloat(filters.maxPrice));
    }

    if (filters.verifiedOnly) {
      query = query.eq('profiles.verified_farmer', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Search error:', error);
    } else {
      setResults(data || []);

      // Save search to recent
      if (searchQuery.trim()) {
        const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('ibreedr_recent_searches', JSON.stringify(newRecent));
      }
    }

    setLoading(false);
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      animalType: '',
      province: '',
      breed: '',
      minPrice: '',
      maxPrice: '',
      verifiedOnly: false,
      transportAvailable: false,
      distance: ''
    });
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-warm-white pb-20">
      {/* Header */}
      <div className="bg-primary-green text-white sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold mb-3">Search</h1>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search farms, breeds, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-gold-accent outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Animal Type</label>
                <select
                  value={filters.animalType}
                  onChange={(e) => setFilters({ ...filters, animalType: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="cattle">Cattle</option>
                  <option value="goats">Goats</option>
                  <option value="sheep">Sheep</option>
                  <option value="pigs">Pigs</option>
                  <option value="chickens">Chickens</option>
                  <option value="horses">Horses</option>
                </select>
              </div>
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
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Breed</label>
              <input
                type="text"
                placeholder="e.g., Angus, Bonsmara..."
                value={filters.breed}
                onChange={(e) => setFilters({ ...filters, breed: e.target.value })}
                className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Min Price (R)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Max Price (R)</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                  className="w-4 h-4 text-primary-green"
                />
                Verified Farms Only
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.transportAvailable}
                  onChange={(e) => setFilters({ ...filters, transportAvailable: e.target.checked })}
                  className="w-4 h-4 text-primary-green"
                />
                Transport Available
              </label>
            </div>

            <button
              onClick={clearFilters}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {!searchQuery && recentSearches.length > 0 && !showFilters && (
        <div className="max-w-md mx-auto px-4 py-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(term);
                  setTimeout(handleSearch, 100);
                }}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm hover:border-primary-green transition"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Button */}
      <div className="max-w-md mx-auto px-4 py-3">
        <button
          onClick={handleSearch}
          disabled={!searchQuery.trim() && !filters.animalType}
          className="w-full py-3 bg-primary-green text-white rounded-xl font-semibold hover:bg-primary-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      <div className="max-w-md mx-auto px-4">
        {results.length === 0 && !loading && (searchQuery || filters.animalType) ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No results found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-green border-t-transparent" />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{results.length} results found</p>
            {results.map((animal) => (
              <Link to={`/BreedDetails?id=${animal.id}`} key={animal.id}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex gap-4 p-4">
                    {/* Image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {animal.images && animal.images[0] ? (
                        <img src={animal.images[0]} alt={animal.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🐄</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{animal.name}</h3>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-sm text-gray-600">{animal.profiles?.farm_name || 'Farm'}</span>
                            {animal.profiles?.verified_farmer && (
                              <span className="text-xs text-primary-green">✓ Verified</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {animal.location || 'Location not set'}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary-green">R {Number(animal.price).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{animal.breed_type}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {animal.pure_cross && (
                          <Badge variant="secondary" className="text-xs">
                            {animal.pure_cross === 'pure' ? 'Pure' : 'Cross'}
                          </Badge>
                        )}
                        {animal.age_years > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {animal.age_years}y
                          </Badge>
                        )}
                        {animal.weight_min && (
                          <Badge variant="outline" className="text-xs">
                            {animal.weight_min}kg
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}