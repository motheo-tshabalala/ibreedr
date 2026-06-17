import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, X, MapPin, ChevronDown, Grid, List } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/button";
import LivestockCard from './LivestockCard';

export default function LivestockGrid() {
  const [livestock, setLivestock] = useState([]);
  const [filteredLivestock, setFilteredLivestock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    animalType: '',
    breed: '',
    province: '',
    minPrice: '',
    maxPrice: '',
    verifiedOnly: false,
    transportAvailable: false,
    sortBy: 'newest',
    ageRange: '',
    weightRange: '',
    pregnancyStatus: '',
    pureBreedOnly: false
  });

  useEffect(() => {
    const loadLivestock = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('livestock')
        .select(`
          *,
          profiles!user_id (
            farm_name,
            verified_farmer,
            farm_location
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading livestock:', error);
      } else {
        setLivestock(data || []);
        setFilteredLivestock(data || []);
      }

      setLoading(false);
    };

    loadLivestock();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let results = [...livestock];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        item.breed_type?.toLowerCase().includes(query) ||
        item.profiles?.farm_name?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query)
      );
    }

    // Animal type filter
    if (filters.animalType) {
      results = results.filter(item => item.animal_type === filters.animalType);
    }

    // Breed filter
    if (filters.breed) {
      results = results.filter(item =>
        item.breed_type?.toLowerCase().includes(filters.breed.toLowerCase())
      );
    }

    // Province filter
    if (filters.province) {
      results = results.filter(item =>
        item.location?.toLowerCase().includes(filters.province.toLowerCase())
      );
    }

    // Price range
    if (filters.minPrice) {
      results = results.filter(item => item.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      results = results.filter(item => item.price <= parseFloat(filters.maxPrice));
    }

    // Verified only
    if (filters.verifiedOnly) {
      results = results.filter(item => item.profiles?.verified_farmer === true);
    }

    // ✅ Age Range Filter
    if (filters.ageRange) {
      switch (filters.ageRange) {
        case 'under-1':
          results = results.filter(item => (item.age_years || 0) < 1);
          break;
        case '1-2':
          results = results.filter(item => (item.age_years || 0) >= 1 && (item.age_years || 0) < 2);
          break;
        case '2-4':
          results = results.filter(item => (item.age_years || 0) >= 2 && (item.age_years || 0) < 4);
          break;
        case '4-plus':
          results = results.filter(item => (item.age_years || 0) >= 4);
          break;
        default:
          break;
      }
    }

    // ✅ Weight Range Filter
    if (filters.weightRange) {
      switch (filters.weightRange) {
        case 'under-100':
          results = results.filter(item => (item.weight_min || 0) < 100);
          break;
        case '100-200':
          results = results.filter(item => (item.weight_min || 0) >= 100 && (item.weight_min || 0) < 200);
          break;
        case '200-350':
          results = results.filter(item => (item.weight_min || 0) >= 200 && (item.weight_min || 0) < 350);
          break;
        case '350-plus':
          results = results.filter(item => (item.weight_min || 0) >= 350);
          break;
        default:
          break;
      }
    }

    // ✅ Pregnancy Status Filter
    if (filters.pregnancyStatus) {
      if (filters.pregnancyStatus === 'pregnant') {
        results = results.filter(item => item.pregnancy_status === 'pregnant');
      } else if (filters.pregnancyStatus === 'not-pregnant') {
        results = results.filter(item => item.pregnancy_status === 'open' || item.pregnancy_status === 'n/a' || !item.pregnancy_status);
      } else if (filters.pregnancyStatus === 'unknown') {
        results = results.filter(item => !item.pregnancy_status || item.pregnancy_status === '');
      }
    }

    // ✅ Pure Breed Only
    if (filters.pureBreedOnly) {
      results = results.filter(item => item.pure_cross === 'pure');
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        results.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        results.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      default: // newest
        results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setFilteredLivestock(results);
  }, [searchQuery, filters, livestock]);

  // Count active filters
  const activeFilterCount = [
    filters.animalType, filters.breed, filters.province,
    filters.minPrice, filters.maxPrice, filters.verifiedOnly ? 'verified' : null,
    filters.ageRange, filters.weightRange, filters.pregnancyStatus,
    filters.pureBreedOnly ? 'pure' : null
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      animalType: '',
      breed: '',
      province: '',
      minPrice: '',
      maxPrice: '',
      verifiedOnly: false,
      transportAvailable: false,
      sortBy: 'newest',
      ageRange: '',
      weightRange: '',
      pregnancyStatus: '',
      pureBreedOnly: false
    });
    setSearchQuery('');
  };

  const hasActiveFilters = searchQuery || filters.animalType || filters.breed ||
    filters.province || filters.minPrice || filters.maxPrice || filters.verifiedOnly ||
    filters.ageRange || filters.weightRange || filters.pregnancyStatus || filters.pureBreedOnly;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
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
            <h1 className="text-xl font-bold">Browse Livestock</h1>
            <span className="text-sm text-green-200">{filteredLivestock.length} animals</span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by breed, farm, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gold-accent outline-none"
            />
          </div>

          {/* Filter Toggle with Badge */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-3 flex items-center gap-2 text-sm text-green-100 hover:text-white transition"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            {activeFilterCount > 0 && (
              <span className="ml-auto bg-gold-accent text-white text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
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
                  <option value="">All</option>
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

            {/* ✅ Age Range Filter */}
            <div>
              <label className="text-xs font-medium text-gray-600">Age Range</label>
              <select
                value={filters.ageRange}
                onChange={(e) => setFilters({ ...filters, ageRange: e.target.value })}
                className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Any Age</option>
                <option value="under-1">Under 1 year</option>
                <option value="1-2">1–2 years</option>
                <option value="2-4">2–4 years</option>
                <option value="4-plus">4+ years</option>
              </select>
            </div>

            {/* ✅ Weight Range Filter */}
            <div>
              <label className="text-xs font-medium text-gray-600">Weight Range</label>
              <select
                value={filters.weightRange}
                onChange={(e) => setFilters({ ...filters, weightRange: e.target.value })}
                className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Any Weight</option>
                <option value="under-100">Under 100kg</option>
                <option value="100-200">100–200kg</option>
                <option value="200-350">200–350kg</option>
                <option value="350-plus">350kg+</option>
              </select>
            </div>

            {/* ✅ Pregnancy Status Filter */}
            <div>
              <label className="text-xs font-medium text-gray-600">Pregnancy Status</label>
              <select
                value={filters.pregnancyStatus}
                onChange={(e) => setFilters({ ...filters, pregnancyStatus: e.target.value })}
                className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Any Status</option>
                <option value="pregnant">Pregnant</option>
                <option value="not-pregnant">Not Pregnant</option>
                <option value="unknown">Unknown</option>
              </select>
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

            <div>
              <label className="text-xs font-medium text-gray-600">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-4">
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
                  checked={filters.pureBreedOnly}
                  onChange={(e) => setFilters({ ...filters, pureBreedOnly: e.target.checked })}
                  className="w-4 h-4 text-primary-green"
                />
                Pure Breed Only
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
        {filteredLivestock.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No animals found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-primary-green hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLivestock.map((animal) => (
              <LivestockCard
                key={animal.id}
                livestock={animal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}