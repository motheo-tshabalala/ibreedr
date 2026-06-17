import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, Filter, MapPin, ChevronDown, Bell } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/button";

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    animalType: '',
    province: '',
    breed: '',
    minPrice: '',
    maxPrice: '',
    verifiedOnly: false,
    transportAvailable: false,
    sortBy: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestedSearches, setSuggestedSearches] = useState([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ibreedr_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // ✅ FIXED: Load suggested searches from DB
  useEffect(() => {
    const loadSuggestions = async () => {
      const { data, error } = await supabase
        .from('livestock')
        .select('animal_type')
        .eq('status', 'active');

      if (error) {
        console.error('Error loading suggestions:', error);
        return;
      }

      if (data && data.length > 0) {
        const counts = {};
        data.forEach(item => {
          if (item.animal_type) {
            counts[item.animal_type] = (counts[item.animal_type] || 0) + 1;
          }
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const topTypes = sorted.slice(0, 3).map(item => item[0]);
        setSuggestedSearches(topTypes);
      }
    };
    loadSuggestions();
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() && !filters.animalType && !filters.province) {
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

    if (searchQuery.trim()) {
      query = query.or(
        `name.ilike.%${searchQuery}%,` +
        `breed_type.ilike.%${searchQuery}%,` +
        `profiles.farm_name.ilike.%${searchQuery}%`
      );
    }

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

    switch (filters.sortBy) {
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Search error:', error);
    } else {
      setResults(data || []);

      if (searchQuery.trim()) {
        const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('ibreedr_recent_searches', JSON.stringify(newRecent));
      }
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setFilters({
      animalType: '',
      province: '',
      breed: '',
      minPrice: '',
      maxPrice: '',
      verifiedOnly: false,
      transportAvailable: false,
      sortBy: 'newest'
    });
    setSearchQuery('');
    setResults([]);
  };

  const hasActiveFilters = searchQuery || filters.animalType || filters.province ||
    filters.breed || filters.minPrice || filters.maxPrice || filters.verifiedOnly;

  const activeFilterCount = [
    filters.animalType, filters.province, filters.breed,
    filters.minPrice, filters.maxPrice, filters.verifiedOnly ? 'verified' : null
  ].filter(Boolean).length;

  // Handle search alert
  const handleSetAlert = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please login to set up alerts' });
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    setAlertSubmitting(true);
    try {
      const { error } = await supabase
        .from('search_alerts')
        .insert([{
          user_id: user.id,
          search_term: searchQuery || null,
          animal_type: filters.animalType || null,
          province: filters.province || null,
          breed: filters.breed || null,
          min_price: filters.minPrice ? parseFloat(filters.minPrice) : null,
          max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : null
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Alert set! We\'ll notify you when new listings match your search.' });
      setShowAlertModal(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('Alert error:', error);
      setMessage({ type: 'error', text: 'Failed to set alert: ' + error.message });
    } finally {
      setAlertSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white pb-20">
      {/* Header */}
      <div className="bg-primary-green text-white sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold mb-3">Search</h1>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search farms, breeds, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gold-accent outline-none"
            />
          </div>

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
                  <option value="donkeys">Donkeys</option>
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
                  {PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
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

            <div>
              <label className="text-xs font-medium text-gray-600">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
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

      {/* Recent Searches */}
      {!searchQuery && recentSearches.length > 0 && !showFilters && results.length === 0 && (
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
          disabled={!searchQuery.trim() && !filters.animalType && !filters.province}
          className="w-full py-3 bg-primary-green text-white rounded-xl font-semibold hover:bg-primary-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <div className="max-w-md mx-auto px-4 py-2 flex flex-wrap gap-2">
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); handleSearch(); }}
              className="flex items-center gap-1 px-3 py-1 bg-primary-green/10 text-primary-green rounded-full text-xs font-medium hover:bg-primary-green/20 transition"
            >
              {searchQuery}
              <X className="w-3 h-3" />
            </button>
          )}
          {filters.animalType && (
            <button
              onClick={() => { setFilters({ ...filters, animalType: '' }); handleSearch(); }}
              className="flex items-center gap-1 px-3 py-1 bg-primary-green/10 text-primary-green rounded-full text-xs font-medium hover:bg-primary-green/20 transition"
            >
              {filters.animalType}
              <X className="w-3 h-3" />
            </button>
          )}
          {filters.province && (
            <button
              onClick={() => { setFilters({ ...filters, province: '' }); handleSearch(); }}
              className="flex items-center gap-1 px-3 py-1 bg-primary-green/10 text-primary-green rounded-full text-xs font-medium hover:bg-primary-green/20 transition"
            >
              {filters.province}
              <X className="w-3 h-3" />
            </button>
          )}
          {filters.breed && (
            <button
              onClick={() => { setFilters({ ...filters, breed: '' }); handleSearch(); }}
              className="flex items-center gap-1 px-3 py-1 bg-primary-green/10 text-primary-green rounded-full text-xs font-medium hover:bg-primary-green/20 transition"
            >
              {filters.breed}
              <X className="w-3 h-3" />
            </button>
          )}
          {filters.minPrice && (
            <button
              onClick={() => { setFilters({ ...filters, minPrice: '' }); handleSearch(); }}
              className="flex items-center gap-1 px-3 py-1 bg-primary-green/10 text-primary-green rounded-full text-xs font-medium hover:bg-primary-green/20 transition"
            >
              R{filters.minPrice}+
              <X className="w-3 h-3" />
            </button>
          )}
          {filters.maxPrice && (
            <button
              onClick={() => { setFilters({ ...filters, maxPrice: '' }); handleSearch(); }}
              className="flex items-center gap-1 px-3 py-1 bg-primary-green/10 text-primary-green rounded-full text-xs font-medium hover:bg-primary-green/20 transition"
            >
              R{filters.maxPrice}+
              <X className="w-3 h-3" />
            </button>
          )}
          {filters.verifiedOnly && (
            <button
              onClick={() => { setFilters({ ...filters, verifiedOnly: false }); handleSearch(); }}
              className="flex items-center gap-1 px-3 py-1 bg-primary-green/10 text-primary-green rounded-full text-xs font-medium hover:bg-primary-green/20 transition"
            >
              Verified Only
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Results */}
      <div className="max-w-md mx-auto px-4">
        {results.length === 0 && !loading && (searchQuery || filters.animalType || filters.province) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No results found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-primary-green hover:underline"
            >
              Clear all filters
            </button>
            {suggestedSearches.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-gray-400 mb-2">Suggested searches:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setFilters({ ...filters, animalType: term });
                        setTimeout(handleSearch, 100);
                      }}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => setShowAlertModal(true)}
              className="mt-4 text-sm text-primary-green hover:underline flex items-center gap-1 mx-auto"
            >
              <Bell className="w-4 h-4" />
              Set up an alert for this search
            </button>
          </div>
        )}

        {loading ? (
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
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {animal.images && animal.images[0] ? (
                        <img src={animal.images[0]} alt={animal.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">🐄</div>
                      )}
                    </div>

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

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Set Up Search Alert</h2>
              <button onClick={() => setShowAlertModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              We'll notify you when new livestock matches your search criteria.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Search:</span> {searchQuery || 'All livestock'}
              </p>
              {filters.animalType && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Type:</span> {filters.animalType}
                </p>
              )}
              {filters.province && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Province:</span> {filters.province}
                </p>
              )}
              {filters.breed && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Breed:</span> {filters.breed}
                </p>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Price:</span>
                  {filters.minPrice && ` R${filters.minPrice}`}
                  {filters.maxPrice && ` - R${filters.maxPrice}`}
                </p>
              )}
            </div>
            <Button
              onClick={handleSetAlert}
              disabled={alertSubmitting}
              className="w-full bg-primary-green hover:bg-primary-green-dark"
            >
              {alertSubmitting ? 'Setting alert...' : 'Set Alert'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}