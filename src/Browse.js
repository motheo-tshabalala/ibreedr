import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X, Heart, Bookmark, Eye, MessageCircle } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

// Livestock Card
function LivestockCard({ livestock, onWishlist, isInWishlist }) {
  const [isVideo, setIsVideo] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');

  useEffect(() => {
    if (livestock?.video_url) {
      setIsVideo(true);
      setMediaUrl(livestock.video_url);
    } else if (livestock?.images && livestock.images[0]) {
      setIsVideo(false);
      setMediaUrl(livestock.images[0]);
    }
  }, [livestock]);

  if (!livestock) {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="h-96 bg-gray-200 flex items-center justify-center">
          <span className="text-6xl">🐄</span>
        </div>
      </div>
    );
  }

  const getWeightDisplay = () => {
    if (livestock.weight_min && livestock.weight_max) {
      return `${livestock.weight_min} - ${livestock.weight_max} KG`;
    } else if (livestock.weight_min) {
      return `${livestock.weight_min} KG`;
    } else if (livestock.weight_max) {
      return `Up to ${livestock.weight_max} KG`;
    }
    return null;
  };

  const getAgeDisplay = () => {
    if (livestock.teeth_age) return livestock.teeth_age;
    const years = livestock.age_years || 0;
    const months = livestock.age_months || 0;
    if (years > 0 && months > 0) return `${years}y ${months}m`;
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
    return null;
  };

  const weightDisplay = getWeightDisplay();
  const ageDisplay = getAgeDisplay();

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer relative">
      <div className="h-96 bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center relative">
        {isVideo ? (
          <video
            src={mediaUrl}
            className="w-full h-full object-cover"
            poster={livestock.images?.[0]}
            controls
            onClick={(e) => e.stopPropagation()}
          />
        ) : mediaUrl ? (
          <img src={mediaUrl} alt={livestock.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl">🐄</span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onWishlist(livestock);
        }}
        className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition z-10"
      >
        <Bookmark className={`w-6 h-6 ${isInWishlist ? 'fill-amber-500 text-amber-500' : 'text-stone-500'}`} />
      </button>

      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-stone-800">{livestock.name || 'Unnamed'}</h2>
            <p className="text-xs text-stone-400">Ref: {livestock.reference_number || 'N/A'}</p>
          </div>
          <p className="text-amber-600 font-bold text-lg">R{livestock.price ? Number(livestock.price).toLocaleString() : '0'}</p>
        </div>

        <div className="mt-2 space-y-1">
          <p className="text-stone-600">{livestock.breed_type} • {livestock.animal_type}</p>
          <p className="text-stone-500 text-sm">{livestock.location}</p>

          <div className="flex flex-wrap gap-2 mt-2">
            {livestock.pure_cross && (
              <span className="text-xs bg-stone-100 px-2 py-1 rounded-full">
                {livestock.pure_cross === 'pure' ? 'Pure Breed' : 'Cross Breed'}
              </span>
            )}
            {ageDisplay && (
              <span className="text-xs bg-stone-100 px-2 py-1 rounded-full">
                {ageDisplay}
              </span>
            )}
            {weightDisplay && (
              <span className="text-xs bg-stone-100 px-2 py-1 rounded-full">
                {weightDisplay}
              </span>
            )}
            {livestock.pregnancy_status && livestock.pregnancy_status !== 'n/a' && (
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                {livestock.pregnancy_status === 'pregnant' ? '🤰 Pregnant' : livestock.pregnancy_status}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BundleCard({ bundle }) {
  if (!bundle) {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="h-96 bg-gray-200 flex items-center justify-center">
          <span className="text-6xl">📦</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer">
      <div className="h-96 bg-gradient-to-br from-green-200 to-green-400 flex items-center justify-center relative">
        {bundle.video_url ? (
          <video
            src={bundle.video_url}
            className="w-full h-full object-cover"
            controls
            onClick={(e) => e.stopPropagation()}
          />
        ) : bundle.images && bundle.images[0] ? (
          <img src={bundle.images[0]} alt={bundle.bundle_name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl">📦</span>
        )}
      </div>
      <div className="p-4">
        <h2 className="text-xl font-bold">{bundle.bundle_name || 'Bundle'}</h2>
        <p className="text-amber-600 font-semibold">R{bundle.bundle_price ? Number(bundle.bundle_price).toLocaleString() : '0'}</p>
        <p className="text-stone-500 text-sm">{bundle.location || 'No location'}</p>
        {bundle.bundle_description && (
          <p className="text-stone-600 text-sm mt-2 line-clamp-2">{bundle.bundle_description}</p>
        )}
      </div>
    </div>
  );
}

function FilterPanel({ isOpen, onClose, onApply, initialFilters }) {
  const [filters, setFilters] = useState(initialFilters);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-sm h-full p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Filters</h2>
          <button onClick={onClose} className="p-2"><X /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">Min Price (R)</label>
            <input
              type="number"
              className="w-full border rounded-lg p-2"
              value={filters.priceMin}
              onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Max Price (R)</label>
            <input
              type="number"
              className="w-full border rounded-lg p-2"
              value={filters.priceMax}
              onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Location</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2"
              placeholder="City or town"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
          <button
            onClick={() => { onApply(filters); onClose(); }}
            className="w-full bg-amber-500 text-white py-2 rounded-lg font-semibold"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Browse() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    priceMin: '',
    priceMax: ''
  });
  const [viewMode, setViewMode] = useState('both');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [realListings, setRealListings] = useState([]);
  const [realBundles, setRealBundles] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const loadWishlist = async () => {
      if (!user) return;
      const { data } = await supabase.from('wishlist').select('livestock_id').eq('user_id', user.id);
      if (data) setWishlistIds(data.map(item => item.livestock_id));
    };
    loadWishlist();
  }, [user]);

  useEffect(() => {
    const loadListings = async () => {
      setIsLoading(true);

      const { data: livestockData } = await supabase
        .from('livestock')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const itemsWithType = (livestockData || []).map(item => ({ ...item, listing_type: 'individual', isBundle: false }));
      setRealListings(itemsWithType);

      const { data: bundlesData } = await supabase
        .from('bundles')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const bundlesWithType = (bundlesData || []).map(item => ({ ...item, listing_type: 'bundle', isBundle: true }));
      setRealBundles(bundlesWithType);

      setIsLoading(false);
    };

    loadListings();
  }, []);

  const addToWishlist = async (livestock) => {
    if (!user) {
      alert('Please login to save to wishlist');
      window.location.href = '/login';
      return;
    }

    const isInWishlist = wishlistIds.includes(livestock.id);

    if (isInWishlist) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('livestock_id', livestock.id);
      setWishlistIds(wishlistIds.filter(id => id !== livestock.id));
      alert('Removed from wishlist');
    } else {
      await supabase.from('wishlist').insert([{
        user_id: user.id,
        livestock_id: livestock.id,
        livestock_name: livestock.name || livestock.bundle_name,
        original_price: livestock.price || livestock.bundle_price
      }]);
      setWishlistIds([...wishlistIds, livestock.id]);
      alert('Added to wishlist');
    }
  };

  const allItems = useMemo(() => [...realListings, ...realBundles], [realListings, realBundles]);

  const getFilteredItems = () => {
    let items = [...allItems];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => {
        const name = item.name || item.bundle_name || '';
        const breed = item.breed_type || '';
        return name.toLowerCase().includes(query) || breed.toLowerCase().includes(query);
      });
    }

    if (filters.location) {
      items = items.filter(item =>
        (item.location || '').toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.priceMin) {
      const price = parseFloat(filters.priceMin);
      items = items.filter(item => {
        const itemPrice = item.price || item.bundle_price || 0;
        return itemPrice >= price;
      });
    }

    if (filters.priceMax) {
      const price = parseFloat(filters.priceMax);
      items = items.filter(item => {
        const itemPrice = item.price || item.bundle_price || 0;
        return itemPrice <= price;
      });
    }

    if (viewMode === 'individual') items = items.filter(item => item.listing_type === 'individual');
    else if (viewMode === 'bundles') items = items.filter(item => item.listing_type === 'bundle');

    return items;
  };

  const displayItems = useMemo(() => getFilteredItems(), [allItems, searchQuery, filters, viewMode]);

  useEffect(() => {
    if (displayItems.length > 0 && currentIndex < displayItems.length) {
      setCurrentItem(displayItems[currentIndex]);
    }
  }, [currentIndex, displayItems]);

  const handleDragEnd = (event, info) => {
    if (Math.abs(info.offset.x) > 100) {
      if (info.offset.x > 0) {
        handleSwipeRight();
      } else {
        handleSwipeLeft();
      }
    }
    x.set(0);
  };

  const handleSwipeRight = () => nextCard();
  const handleSwipeLeft = () => nextCard();

  const nextCard = () => {
    if (currentIndex < displayItems.length - 1) setCurrentIndex(prev => prev + 1);
    else setCurrentIndex(displayItems.length);
  };

  const handleCardClick = () => {
    if (currentItem) {
      if (currentItem.listing_type === 'bundle') {
        window.location.href = `/BundleDetails?id=${currentItem.id}`;
      } else {
        window.location.href = `/BreedDetails?id=${currentItem.id}`;
      }
    }
  };

  const toggleLike = () => setHasLiked(!hasLiked);

  if (isLoading && allItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <h1 className="text-2xl font-bold text-amber-600">iBreedr</h1>
            </Link>
            <div className="flex gap-2">
              {/* Chat Button */}
              <Link to="/ChatList">
                <button className="rounded-full p-2 border-2 border-amber-500 text-amber-500">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/Wishlist">
                <button className="rounded-full p-2 border-2 border-amber-500 text-amber-500">
                  <Bookmark className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/MyListings">
                <button className="rounded-full px-3 py-1 border-2 border-amber-500 text-amber-500 text-sm">
                  My Listings
                </button>
              </Link>
              {user ? (
                <Link to="/logout">
                  <button className="rounded-full px-3 py-1 border-2 border-red-500 text-red-500 text-sm">
                    Logout
                  </button>
                </Link>
              ) : (
                <Link to="/login">
                  <button className="rounded-full px-3 py-1 border-2 border-blue-500 text-blue-500 text-sm">
                    Login
                  </button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex gap-2 rounded-full p-1 bg-stone-100">
            <button
              onClick={() => { setViewMode('both'); setCurrentIndex(0); }}
              className={`flex-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${viewMode === 'both' ? 'bg-amber-500 text-white' : 'text-stone-600'
                }`}
            >
              All
            </button>
            <button
              onClick={() => { setViewMode('individual'); setCurrentIndex(0); }}
              className={`flex-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${viewMode === 'individual' ? 'bg-amber-500 text-white' : 'text-stone-600'
                }`}
            >
              Individual
            </button>
            <button
              onClick={() => { setViewMode('bundles'); setCurrentIndex(0); }}
              className={`flex-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${viewMode === 'bundles' ? 'bg-amber-500 text-white' : 'text-stone-600'
                }`}
            >
              Bundles
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                placeholder="Search livestock, breeds..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentIndex(0); }}
                className="w-full pl-10 pr-8 h-11 border-2 border-amber-300 rounded-full bg-white focus:outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setCurrentIndex(0); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-stone-400" />
                </button>
              )}
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="h-11 w-11 rounded-full border-2 border-amber-500 text-amber-500 flex items-center justify-center hover:bg-amber-50"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-8 pb-32">
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[600px] text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">No listings found</h3>
            <p className="text-stone-600">Try adjusting your search or filters</p>
            <button
              onClick={() => { setFilters({ location: '', priceMin: '', priceMax: '' }); setSearchQuery(''); }}
              className="mt-4 text-amber-600 underline"
            >
              Clear all filters
            </button>
            <Link to="/SellerUpload">
              <button className="mt-6 bg-amber-500 text-white px-6 py-2 rounded-full">
                + Add Your First Listing
              </button>
            </Link>
          </div>
        ) : currentIndex >= displayItems.length ? (
          <div className="flex flex-col items-center justify-center h-[600px] text-center">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-stone-800 mb-2">That's all for now!</h3>
            <p className="text-stone-600 mb-6">Check back later for more listings</p>
            <button
              onClick={() => setCurrentIndex(0)}
              className="rounded-full px-6 py-2 bg-amber-500 text-white font-semibold"
            >
              Start Over
            </button>
          </div>
        ) : (
          <div className="relative h-[600px]">
            <AnimatePresence>
              <motion.div
                key={currentItem?.id || currentItem?.bundle_name}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                style={{ x, rotate, opacity }}
                onClick={handleCardClick}
                className="cursor-pointer absolute w-full"
              >
                {currentItem?.listing_type === 'bundle' ? (
                  <BundleCard bundle={currentItem} />
                ) : (
                  <LivestockCard
                    livestock={currentItem}
                    onWishlist={addToWishlist}
                    isInWishlist={wishlistIds.includes(currentItem?.id)}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8">
              <button
                onClick={handleSwipeLeft}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 shadow-lg flex items-center justify-center text-2xl font-bold transition"
              >
                ←
              </button>

              <button
                onClick={toggleLike}
                className="bg-white hover:bg-gray-50 rounded-full w-16 h-16 shadow-lg flex items-center justify-center transition"
              >
                <Heart className={`w-8 h-8 ${hasLiked ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
              </button>

              <button
                onClick={handleSwipeRight}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 shadow-lg flex items-center justify-center text-2xl font-bold transition"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={setFilters}
        initialFilters={filters}
      />

      <Link to="/SellerUpload">
        <button className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-2xl text-3xl transition">
          +
        </button>
      </Link>
    </div>
  );
}