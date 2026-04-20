import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X, Heart, Bookmark, MessageCircle, HelpCircle } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useHelp } from './HelpContext';

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
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="h-80 bg-gray-100 flex items-center justify-center">
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
    <div className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer relative">
      <div className="h-80 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center relative">
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
        className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition z-10"
      >
        <Bookmark className={`w-5 h-5 ${isInWishlist ? 'fill-amber-500 text-amber-500' : 'text-stone-500'}`} />
      </button>

      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-stone-800">{livestock.name || 'Unnamed'}</h2>
            <p className="text-xs text-stone-400 mt-0.5">Ref: {livestock.reference_number || 'N/A'}</p>
          </div>
          <p className="text-amber-600 font-bold text-lg">R{livestock.price ? Number(livestock.price).toLocaleString() : '0'}</p>
        </div>

        <div className="mt-2 space-y-1">
          <p className="text-stone-600 text-sm">{livestock.breed_type} • {livestock.animal_type}</p>
          <p className="text-stone-500 text-sm">{livestock.location}</p>

          <div className="flex flex-wrap gap-1 mt-2">
            {livestock.pure_cross && (
              <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full">
                {livestock.pure_cross === 'pure' ? 'Pure Breed' : 'Cross Breed'}
              </span>
            )}
            {ageDisplay && (
              <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full">
                {ageDisplay}
              </span>
            )}
            {weightDisplay && (
              <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full">
                {weightDisplay}
              </span>
            )}
            {livestock.pregnancy_status && livestock.pregnancy_status !== 'n/a' && (
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
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
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="h-80 bg-gray-100 flex items-center justify-center">
          <span className="text-6xl">📦</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer">
      <div className="h-80 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative">
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
        <h2 className="text-lg font-bold">{bundle.bundle_name || 'Bundle'}</h2>
        <p className="text-amber-600 font-semibold text-lg">R{bundle.bundle_price ? Number(bundle.bundle_price).toLocaleString() : '0'}</p>
        <p className="text-stone-500 text-sm mt-1">{bundle.location || 'No location'}</p>
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
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-end">
      <div className="bg-white w-full max-w-sm h-full p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-stone-800">Filters</h2>
          <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-stone-100">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block font-semibold text-stone-700 mb-2">Min Price (R)</label>
            <input
              type="number"
              className="w-full border border-stone-200 rounded-xl p-3 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
              value={filters.priceMin}
              onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-2">Max Price (R)</label>
            <input
              type="number"
              className="w-full border border-stone-200 rounded-xl p-3 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
              value={filters.priceMax}
              onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
              placeholder="Any"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-2">Location</label>
            <input
              type="text"
              className="w-full border border-stone-200 rounded-xl p-3 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
              placeholder="City or town"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
          <button
            onClick={() => { onApply(filters); onClose(); }}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold transition mt-4"
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

  const { helpMode, toggleHelpMode, showHelp } = useHelp();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
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

  const displayItems = useMemo(() => {
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
  }, [allItems, searchQuery, filters, viewMode]);

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
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-4 space-y-3">
          {/* Logo and Mobile Scrollable Buttons */}
          <div className="flex items-center justify-between">
            <Link to="/">
              <h1 className="text-2xl font-bold text-amber-600">iBreedr</h1>
            </Link>

            {/* Horizontal scrollable buttons for mobile */}
            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={toggleHelpMode}
                className={`rounded-full p-2 border transition flex-shrink-0 ${helpMode
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'border-stone-200 text-stone-500 hover:border-amber-300'
                  }`}
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  if (helpMode) {
                    e.stopPropagation();
                    showHelp('chat');
                  } else {
                    window.location.href = '/ChatList';
                  }
                }}
                className="rounded-full p-2 border border-amber-400 text-amber-500 flex-shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  if (helpMode) {
                    e.stopPropagation();
                    showHelp('wishlist');
                  } else {
                    window.location.href = '/Wishlist';
                  }
                }}
                className="rounded-full p-2 border border-amber-400 text-amber-500 flex-shrink-0"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  if (helpMode) {
                    e.stopPropagation();
                    showHelp('myListings');
                  } else {
                    window.location.href = '/MyListings';
                  }
                }}
                className="rounded-full px-3 py-1 border border-amber-400 text-amber-500 text-sm flex-shrink-0"
              >
                My Listings
              </button>

              {user ? (
                <button
                  onClick={(e) => {
                    if (helpMode) {
                      e.stopPropagation();
                      showHelp('logout');
                    } else {
                      window.location.href = '/logout';
                    }
                  }}
                  className="rounded-full px-3 py-1 border border-red-300 text-red-500 text-sm flex-shrink-0"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    if (helpMode) {
                      e.stopPropagation();
                      showHelp('login');
                    } else {
                      window.location.href = '/login';
                    }
                  }}
                  className="rounded-full px-3 py-1 border border-blue-400 text-blue-500 text-sm flex-shrink-0"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1 rounded-full p-1 bg-stone-100">
            <button
              onClick={() => { setViewMode('both'); setCurrentIndex(0); }}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'both' ? 'bg-white shadow-sm text-amber-600' : 'text-stone-500'
                }`}
            >
              All
            </button>
            <button
              onClick={() => { setViewMode('individual'); setCurrentIndex(0); }}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'individual' ? 'bg-white shadow-sm text-amber-600' : 'text-stone-500'
                }`}
            >
              Individual
            </button>
            <button
              onClick={() => { setViewMode('bundles'); setCurrentIndex(0); }}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'bundles' ? 'bg-white shadow-sm text-amber-600' : 'text-stone-500'
                }`}
            >
              Bundles
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                placeholder="Search livestock, breeds..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentIndex(0); }}
                className="w-full pl-9 pr-8 py-2 bg-white border border-stone-200 rounded-full focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition text-sm"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setCurrentIndex(0); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-stone-400" />
                </button>
              )}
            </div>
            <button
              onClick={(e) => {
                if (helpMode) {
                  e.stopPropagation();
                  showHelp('filter');
                } else {
                  setIsFilterOpen(true);
                }
              }}
              className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition"
            >
              <SlidersHorizontal className="w-4 h-4 text-stone-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Card Area */}
      <div className="max-w-md mx-auto px-4 pt-6 pb-32">
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">No listings found</h3>
            <p className="text-stone-500 text-sm mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => { setFilters({ location: '', priceMin: '', priceMax: '' }); setSearchQuery(''); }}
              className="text-amber-600 text-sm underline"
            >
              Clear all filters
            </button>
            <button
              onClick={(e) => {
                if (helpMode) {
                  e.stopPropagation();
                  showHelp('upload');
                } else {
                  window.location.href = '/SellerUpload';
                }
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-full text-sm mt-6 transition"
            >
              + Add Your First Listing
            </button>
          </div>
        ) : currentIndex >= displayItems.length ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">✨</span>
            </div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">That's all for now!</h3>
            <p className="text-stone-500 text-sm mb-6">Check back later for more listings</p>
            <button
              onClick={() => setCurrentIndex(0)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-full text-sm transition"
            >
              Start Over
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Card Container */}
            <div className="h-[500px] mb-6">
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
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-6">
              <button
                onClick={(e) => {
                  if (helpMode) {
                    e.stopPropagation();
                    showHelp('swipeLeft');
                  } else {
                    handleSwipeLeft();
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-14 h-14 shadow-md flex items-center justify-center text-xl font-bold transition active:scale-95"
              >
                ←
              </button>

              <button
                onClick={(e) => {
                  if (helpMode) {
                    e.stopPropagation();
                    showHelp('like');
                  } else {
                    toggleLike();
                  }
                }}
                className="bg-white hover:bg-gray-50 rounded-full w-14 h-14 shadow-md flex items-center justify-center transition active:scale-95 border border-stone-100"
              >
                <Heart className={`w-6 h-6 ${hasLiked ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
              </button>

              <button
                onClick={(e) => {
                  if (helpMode) {
                    e.stopPropagation();
                    showHelp('swipeRight');
                  } else {
                    handleSwipeRight();
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 shadow-md flex items-center justify-center text-xl font-bold transition active:scale-95"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={setFilters}
        initialFilters={filters}
      />

      {/* FAB - Upload */}
      <button
        onClick={(e) => {
          if (helpMode) {
            e.stopPropagation();
            showHelp('upload');
          } else {
            window.location.href = '/SellerUpload';
          }
        }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg text-2xl transition active:scale-95 flex items-center justify-center"
      >
        +
      </button>
    </div>
  );
}