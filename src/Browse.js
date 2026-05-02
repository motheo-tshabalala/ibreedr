import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X, Heart, Bookmark, MessageCircle, HelpCircle, MapPin, Menu, Filter, RotateCcw } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useHelp } from './HelpContext';
import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/button";

// Mobile Menu Component
function MobileMenu({ user, toggleHelpMode, helpMode, showHelp }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 border border-stone-200 text-stone-500 hover:border-amber-300"
      >
        <Menu className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 p-4 animate-in slide-in-from-left duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold">Menu</h3>
              <button onClick={() => setIsOpen(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => {
                  toggleHelpMode();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${helpMode ? 'bg-amber-100 text-amber-600' : 'hover:bg-stone-100'
                  }`}
              >
                <HelpCircle className="w-4 h-4 inline mr-2" />
                {helpMode ? 'Exit Help Mode' : 'Help Mode'}
              </button>
              <Link
                to="/ChatList"
                onClick={(e) => {
                  if (helpMode) {
                    e.preventDefault();
                    showHelp('chat');
                    setIsOpen(false);
                  }
                }}
              >
                <div className="px-3 py-2 rounded-lg hover:bg-stone-100">
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  Messages
                </div>
              </Link>
              <Link
                to="/Wishlist"
                onClick={(e) => {
                  if (helpMode) {
                    e.preventDefault();
                    showHelp('wishlist');
                    setIsOpen(false);
                  }
                }}
              >
                <div className="px-3 py-2 rounded-lg hover:bg-stone-100">
                  <Bookmark className="w-4 h-4 inline mr-2" />
                  Wishlist
                </div>
              </Link>
              <Link
                to="/MyListings"
                onClick={(e) => {
                  if (helpMode) {
                    e.preventDefault();
                    showHelp('myListings');
                    setIsOpen(false);
                  }
                }}
              >
                <div className="px-3 py-2 rounded-lg hover:bg-stone-100">
                  My Listings
                </div>
              </Link>
              <Link
                to="/Dashboard"
                onClick={(e) => {
                  if (helpMode) {
                    e.preventDefault();
                    showHelp('dashboard');
                    setIsOpen(false);
                  }
                }}
              >
                <div className="px-3 py-2 rounded-lg hover:bg-stone-100">
                  Dashboard
                </div>
              </Link>
              {user ? (
                <Link
                  to="/logout"
                  onClick={(e) => {
                    if (helpMode) {
                      e.preventDefault();
                      showHelp('logout');
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="px-3 py-2 rounded-lg hover:bg-red-50 text-red-600">
                    Logout
                  </div>
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={(e) => {
                    if (helpMode) {
                      e.preventDefault();
                      showHelp('login');
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-600">
                    Login
                  </div>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Filter Panel
function FilterPanel({ isOpen, onClose, onApply, initialFilters, helpMode, showHelp }) {
  const [filters, setFilters] = useState(initialFilters);

  const resetFilters = () => {
    setFilters({
      location: '',
      priceMin: '',
      priceMax: '',
      animalType: '',
      listingType: 'all',
      pureCross: ''
    });
  };

  if (!isOpen) return null;

  const handleApply = () => {
    if (helpMode) {
      showHelp('filter');
    } else {
      onApply(filters);
      onClose();
    }
  };

  const handleReset = () => {
    if (helpMode) {
      showHelp('filter');
    } else {
      resetFilters();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-sm h-full p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Filters</h2>
          <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">Animal Type</label>
            <select
              value={filters.animalType}
              onChange={(e) => setFilters({ ...filters, animalType: e.target.value })}
              className="w-full rounded-lg border p-3 text-sm"
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
            <label className="text-sm font-medium mb-2 block">Listing Type</label>
            <select
              value={filters.listingType}
              onChange={(e) => setFilters({ ...filters, listingType: e.target.value })}
              className="w-full rounded-lg border p-3 text-sm"
            >
              <option value="all">All</option>
              <option value="individual">Individual Only</option>
              <option value="bundle">Bundles Only</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Pure / Cross</label>
            <select
              value={filters.pureCross}
              onChange={(e) => setFilters({ ...filters, pureCross: e.target.value })}
              className="w-full rounded-lg border p-3 text-sm"
            >
              <option value="">All</option>
              <option value="pure">Pure Breed</option>
              <option value="cross">Cross Breed</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Min Price (R)</label>
              <input
                type="number"
                className="w-full rounded-lg border p-3 text-sm"
                value={filters.priceMin}
                onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Price (R)</label>
              <input
                type="number"
                className="w-full rounded-lg border p-3 text-sm"
                value={filters.priceMax}
                onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                placeholder="Any"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Location</label>
            <input
              type="text"
              className="w-full rounded-lg border p-3 text-sm"
              placeholder="City or town"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleApply} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold transition">
              Apply Filters
            </button>
            <button onClick={handleReset} className="px-4 py-3 border border-stone-300 rounded-lg hover:bg-stone-50 transition flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Livestock Card
function LivestockCard({ livestock, onWishlist, isInWishlist, onLike, hasLiked, helpMode, showHelp }) {
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

  if (!livestock) return null;

  const getWeightDisplay = () => {
    if (livestock.weight_min && livestock.weight_max) return `${livestock.weight_min} - ${livestock.weight_max} kg`;
    if (livestock.weight_min) return `${livestock.weight_min} kg`;
    if (livestock.weight_max) return `Up to ${livestock.weight_max} kg`;
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

  const price = livestock.price ? `R ${livestock.price.toLocaleString()}` : 'Price on request';
  const ageDisplay = getAgeDisplay();
  const weightDisplay = getWeightDisplay();

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (helpMode) {
      showHelp('wishlist');
    } else {
      onWishlist(livestock);
    }
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (helpMode) {
      showHelp('like');
    } else {
      onLike();
    }
  };

  const handleCardClick = () => {
    if (helpMode) {
      showHelp('tapCard');
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border shadow-lg hover:shadow-xl transition-all" onClick={handleCardClick}>
      <div className="relative bg-muted">
        {isVideo ? (
          <video
            src={mediaUrl}
            className="w-full h-auto max-h-80 object-contain"
            poster={livestock.images?.[0]}
            controls
            onClick={(e) => e.stopPropagation()}
          />
        ) : mediaUrl ? (
          <img src={mediaUrl} alt={livestock.name} className="w-full h-auto max-h-80 object-contain" />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
            <span className="text-6xl">🐄</span>
          </div>
        )}

        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm transition hover:scale-105"
        >
          <Bookmark className={`w-4 h-4 ${isInWishlist ? 'fill-amber-500 text-amber-500' : 'text-gray-500'}`} />
        </button>
      </div>

      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{livestock.name}</h3>
            <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{livestock.location?.split(',')[0] || 'Location'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-amber-600 text-lg">{price}</p>
            <p className="text-gray-400 text-xs capitalize">{livestock.animal_type}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600">{livestock.breed_type}</p>

        <div className="flex flex-wrap gap-1 pt-1">
          {livestock.pure_cross && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
              {livestock.pure_cross === 'pure' ? 'Pure Breed' : 'Cross Breed'}
            </Badge>
          )}
          {ageDisplay && <Badge variant="outline" className="text-xs">{ageDisplay}</Badge>}
          {weightDisplay && <Badge variant="outline" className="text-xs">{weightDisplay}</Badge>}
          {livestock.pregnancy_status && livestock.pregnancy_status !== 'n/a' && (
            <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 text-xs">
              {livestock.pregnancy_status === 'pregnant' ? '🤰 Pregnant' : livestock.pregnancy_status}
            </Badge>
          )}
        </div>

        <p className="text-xs text-gray-400 pt-1">Ref: {livestock.reference_number || 'N/A'}</p>
      </CardContent>

      <button
        onClick={handleLikeClick}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition active:scale-95 border border-stone-100 z-10"
      >
        <Heart className={`w-5 h-5 ${hasLiked ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
      </button>
    </Card>
  );
}

function BundleCard({ bundle }) {
  if (!bundle) return null;

  const totalPrice = bundle.bundle_price || (bundle.price_per_head * bundle.quantity);
  const pricePerHead = bundle.price_per_head || (totalPrice / bundle.quantity);

  return (
    <Card className="overflow-hidden rounded-2xl border shadow-lg hover:shadow-xl transition-all">
      <div className="relative bg-muted">
        {bundle.video_url ? (
          <video
            src={bundle.video_url}
            className="w-full h-auto max-h-80 object-contain"
            controls
            onClick={(e) => e.stopPropagation()}
          />
        ) : bundle.images && bundle.images[0] ? (
          <img src={bundle.images[0]} alt={bundle.bundle_name} className="w-full h-auto max-h-80 object-contain" />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
            <span className="text-6xl">📦</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-amber-500 text-white">Bundle</Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{bundle.bundle_name}</h3>
            <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{bundle.location?.split(',')[0] || 'Location'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-amber-600 text-lg">R {Math.round(pricePerHead).toLocaleString()}<span className="text-xs">/head</span></p>
            <p className="text-gray-400 text-xs">Total: R {Math.round(totalPrice).toLocaleString()}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600">{bundle.quantity} animals</p>

        {bundle.bundle_description && (
          <p className="text-sm text-gray-500 line-clamp-2">{bundle.bundle_description}</p>
        )}

        <div className="flex flex-wrap gap-1 pt-1">
          {bundle.breed_type && <Badge variant="secondary" className="text-xs bg-gray-100">{bundle.breed_type}</Badge>}
          {bundle.pure_cross && <Badge variant="outline" className="text-xs">{bundle.pure_cross === 'pure' ? 'Pure' : 'Cross'}</Badge>}
          {bundle.age_display && <Badge variant="outline" className="text-xs">{bundle.age_display}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Browse() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    priceMin: '',
    priceMax: '',
    animalType: '',
    listingType: 'all',
    pureCross: ''
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

    if (viewMode === 'individual') {
      items = items.filter(item => item.listing_type === 'individual');
    } else if (viewMode === 'bundles') {
      items = items.filter(item => item.listing_type === 'bundle');
    }

    if (filters.location) {
      items = items.filter(item =>
        (item.location || '').toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.animalType) {
      items = items.filter(item => item.animal_type === filters.animalType);
    }

    if (filters.listingType === 'individual') {
      items = items.filter(item => item.listing_type === 'individual');
    } else if (filters.listingType === 'bundle') {
      items = items.filter(item => item.listing_type === 'bundle');
    }

    if (filters.pureCross) {
      items = items.filter(item => item.pure_cross === filters.pureCross);
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

    return items;
  }, [allItems, searchQuery, viewMode, filters]);

  useEffect(() => {
    if (displayItems.length > 0 && currentIndex < displayItems.length) {
      setCurrentItem(displayItems[currentIndex]);
    } else if (currentIndex >= displayItems.length) {
      setCurrentIndex(displayItems.length);
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

  const handleSwipeRight = () => {
    if (helpMode) {
      showHelp('swipeRight');
    } else if (currentIndex < displayItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(displayItems.length);
    }
  };

  const handleSwipeLeft = () => {
    if (helpMode) {
      showHelp('swipeLeft');
    } else if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleCardClick = () => {
    if (helpMode) {
      showHelp('tapCard');
    } else if (currentItem) {
      if (currentItem.listing_type === 'bundle') {
        window.location.href = `/BundleDetails?id=${currentItem.id}`;
      } else {
        window.location.href = `/BreedDetails?id=${currentItem.id}`;
      }
    }
  };

  const toggleLike = () => {
    if (helpMode) {
      showHelp('like');
    } else {
      setHasLiked(!hasLiked);
    }
  };

  const handleFilterClick = () => {
    if (helpMode) {
      showHelp('filter');
    } else {
      setIsFilterOpen(true);
    }
  };

  const handleLeftArrowClick = () => {
    if (helpMode) {
      showHelp('swipeLeft');
    } else if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleRightArrowClick = () => {
    if (helpMode) {
      showHelp('swipeRight');
    } else if (currentIndex < displayItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSearchClick = () => {
    if (helpMode) {
      showHelp('search');
    }
  };

  const handleUploadClick = () => {
    if (helpMode) {
      showHelp('upload');
    } else {
      window.location.href = '/SellerUpload';
    }
  };

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
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-md mx-auto px-3 sm:px-4 py-4 space-y-3">
          <div className="text-center">
            <Link to="/">
              <h1 className="text-2xl font-bold text-amber-600">iBreedr</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <MobileMenu
              user={user}
              toggleHelpMode={toggleHelpMode}
              helpMode={helpMode}
              showHelp={showHelp}
            />

            <div className="flex-1 relative" onClick={handleSearchClick}>
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
              onClick={handleFilterClick}
              className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition"
            >
              <Filter className="w-4 h-4 text-stone-600" />
            </button>
          </div>

          <div className="flex gap-1 rounded-full p-1 bg-stone-100">
            <button
              onClick={() => setViewMode('both')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'both' ? 'bg-white shadow-sm text-amber-600' : 'text-stone-500'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'individual' ? 'bg-white shadow-sm text-amber-600' : 'text-stone-500'
                }`}
            >
              Individual
            </button>
            <button
              onClick={() => setViewMode('bundles')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${viewMode === 'bundles' ? 'bg-white shadow-sm text-amber-600' : 'text-stone-500'
                }`}
            >
              Bundles
            </button>
          </div>
        </div>
      </div>

      {/* Main Card Area with Side Arrows */}
      <div className="relative max-w-md mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-32">
        {/* Left Arrow - previous card */}
        {currentIndex > 0 && (
          <button
            onClick={handleLeftArrowClick}
            className="fixed left-1 sm:left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-md flex items-center justify-center text-lg sm:text-xl text-gray-500 hover:text-red-500 transition z-20"
          >
            &lt;
          </button>
        )}

        {/* Right Arrow - next card */}
        {currentIndex < displayItems.length - 1 && (
          <button
            onClick={handleRightArrowClick}
            className="fixed right-1 sm:right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-md flex items-center justify-center text-lg sm:text-xl text-gray-500 hover:text-green-500 transition z-20"
          >
            &gt;
          </button>
        )}

        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">No listings found</h3>
            <p className="text-stone-500 text-sm mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => { setFilters({ location: '', priceMin: '', priceMax: '', animalType: '', listingType: 'all', pureCross: '' }); setSearchQuery(''); }}
              className="text-amber-600 text-sm underline"
            >
              Clear all filters
            </button>
            <button
              onClick={() => window.location.href = '/SellerUpload'}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-full text-sm mt-6 transition"
            >
              + Add Your First Listing
            </button>
          </div>
        ) : currentIndex >= displayItems.length ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
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
          <>
            <div className="mb-4">
              <AnimatePresence>
                <motion.div
                  key={currentItem?.id || currentItem?.bundle_name}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  style={{ x, rotate, opacity }}
                  onClick={handleCardClick}
                  className="cursor-pointer w-full"
                >
                  {currentItem?.listing_type === 'bundle' ? (
                    <BundleCard bundle={currentItem} />
                  ) : (
                    <LivestockCard
                      livestock={currentItem}
                      onWishlist={addToWishlist}
                      isInWishlist={wishlistIds.includes(currentItem?.id)}
                      onLike={toggleLike}
                      hasLiked={hasLiked}
                      helpMode={helpMode}
                      showHelp={showHelp}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Heart Button - centered below card */}
            <div className="flex justify-center mt-2 sm:mt-4">
              <button
                onClick={toggleLike}
                className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition active:scale-95 border border-stone-100"
              >
                <Heart className={`w-5 h-5 ${hasLiked ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={setFilters}
        initialFilters={filters}
        helpMode={helpMode}
        showHelp={showHelp}
      />

      {/* FAB - Upload */}
      <button
        onClick={handleUploadClick}
        className="fixed bottom-6 right-6 w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg text-2xl transition active:scale-95 flex items-center justify-center"
      >
        +
      </button>
    </div>
  );
}