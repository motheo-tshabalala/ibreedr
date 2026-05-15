import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Heart, Bookmark, MessageCircle, HelpCircle, MapPin, Menu, Filter, RotateCcw, Building2, User, LogOut, Image, Package } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/button";
import Logo from './components/ui/Logo';

const PAGE_SIZE = 20;

// Mobile Menu Component
function MobileMenu({ user, onOpenHelpCenter }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 border border-stone-200 text-stone-500 hover:border-amber-300"
        data-tour-target="menu-button"
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
              <Link to="/Profile" onClick={() => setIsOpen(false)}>
                <div className="px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center gap-2">
                  <User className="w-4 h-4" />My Profile
                </div>
              </Link>
              <button onClick={() => { setIsOpen(false); onOpenHelpCenter(); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />Help Center
              </button>
              <Link to="/ChatList" onClick={() => setIsOpen(false)}>
                <div className="px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />Messages
                </div>
              </Link>
              <Link to="/Wishlist" onClick={() => setIsOpen(false)}>
                <div className="px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />Wishlist
                </div>
              </Link>
              <Link to="/MyListings" onClick={() => setIsOpen(false)}>
                <div className="px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />My Listings
                </div>
              </Link>
              <Link to="/Dashboard" onClick={() => setIsOpen(false)}>
                <div className="px-3 py-2 rounded-lg hover:bg-stone-100 flex items-center gap-2">Dashboard</div>
              </Link>
              {user ? (
                <Link to="/logout" onClick={() => setIsOpen(false)}>
                  <div className="px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2">
                    <LogOut className="w-4 h-4" />Logout
                  </div>
                </Link>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <div className="px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-600 flex items-center gap-2">Login</div>
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
function FilterPanel({ isOpen, onClose, onApply, initialFilters }) {
  const [filters, setFilters] = useState(initialFilters);

  const resetFilters = () => {
    setFilters({ farmName: '', location: '', priceMin: '', priceMax: '', animalType: '', listingType: 'all', pureCross: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-sm h-full p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Filters</h2>
          <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">Farm Name</label>
            <input type="text" className="w-full rounded-lg border p-3 text-sm" placeholder="Search by farm name" value={filters.farmName || ''} onChange={(e) => setFilters({ ...filters, farmName: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Animal Type</label>
            <select value={filters.animalType} onChange={(e) => setFilters({ ...filters, animalType: e.target.value })} className="w-full rounded-lg border p-3 text-sm">
              <option value="">All Types</option>
              <option value="cattle">Cattle</option><option value="goats">Goats</option><option value="sheep">Sheep</option>
              <option value="pigs">Pigs</option><option value="chickens">Chickens</option><option value="horses">Horses</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Listing Type</label>
            <select value={filters.listingType} onChange={(e) => setFilters({ ...filters, listingType: e.target.value })} className="w-full rounded-lg border p-3 text-sm">
              <option value="all">All</option><option value="individual">Individual Only</option><option value="bundle">Bundles Only</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Pure / Cross</label>
            <select value={filters.pureCross} onChange={(e) => setFilters({ ...filters, pureCross: e.target.value })} className="w-full rounded-lg border p-3 text-sm">
              <option value="">All</option><option value="pure">Pure Breed</option><option value="cross">Cross Breed</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-2 block">Min Price (R)</label><input type="number" className="w-full rounded-lg border p-3 text-sm" value={filters.priceMin} onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })} placeholder="0" /></div>
            <div><label className="text-sm font-medium mb-2 block">Max Price (R)</label><input type="number" className="w-full rounded-lg border p-3 text-sm" value={filters.priceMax} onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })} placeholder="Any" /></div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Location</label>
            <input type="text" className="w-full rounded-lg border p-3 text-sm" placeholder="City or town" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => { onApply(filters); onClose(); }} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold transition">Apply Filters</button>
            <button onClick={resetFilters} className="px-4 py-3 border border-stone-300 rounded-lg hover:bg-stone-50 transition flex items-center gap-2"><RotateCcw className="w-4 h-4" />Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Livestock Card
function LivestockCard({ livestock, onWishlist, isInWishlist, onLike, hasLiked }) {
  const [isVideo, setIsVideo] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');

  useEffect(() => {
    if (livestock?.video_url) { setIsVideo(true); setMediaUrl(livestock.video_url); }
    else if (livestock?.images && livestock.images[0]) { setIsVideo(false); setMediaUrl(livestock.images[0]); }
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
  const cardTitle = livestock.farm_name || livestock.breed_type || 'Unnamed';

  return (
    <Card className="overflow-hidden rounded-2xl border shadow-lg hover:shadow-xl transition-all" data-tour-target="card">
      <div className="relative h-64 bg-muted">
        {isVideo ? (
          <video src={mediaUrl} className="w-full h-full object-cover" poster={livestock.images?.[0]} controls onClick={(e) => e.stopPropagation()} />
        ) : mediaUrl ? (
          <img src={mediaUrl} alt={cardTitle} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
            <Image className="w-12 h-12 text-amber-300" />
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); onWishlist(livestock); }} className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-sm transition hover:scale-105" data-tour-target="wishlist-button">
          <Bookmark className={`w-4 h-4 ${isInWishlist ? 'fill-amber-500 text-amber-500' : 'text-gray-500'}`} />
        </button>
      </div>
      <CardContent className="p-4 space-y-2 pb-16">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{cardTitle}</h3>
            <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
              <MapPin className="w-3 h-3" /><span>{livestock.location?.split(',')[0] || 'Location'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-amber-600 text-lg">{price}</p>
            <p className="text-gray-400 text-xs capitalize">{livestock.animal_type}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">{livestock.breed_type}</p>
        <div className="flex flex-wrap gap-1 pt-1">
          {livestock.pure_cross && <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">{livestock.pure_cross === 'pure' ? 'Pure Breed' : 'Cross Breed'}</Badge>}
          {ageDisplay && <Badge variant="outline" className="text-xs">{ageDisplay}</Badge>}
          {weightDisplay && <Badge variant="outline" className="text-xs">{weightDisplay}</Badge>}
          {livestock.pregnancy_status && livestock.pregnancy_status !== 'n/a' && (
            <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 text-xs">{livestock.pregnancy_status === 'pregnant' ? 'Pregnant' : livestock.pregnancy_status}</Badge>
          )}
        </div>
        <p className="text-xs text-gray-400 pt-1">Ref: {livestock.reference_number || 'N/A'}</p>
      </CardContent>
      <button onClick={(e) => { e.stopPropagation(); onLike(); }} className="absolute bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition active:scale-95 border border-stone-100 z-10" data-tour-target="like-button">
        <Heart className={`w-5 h-5 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
      </button>
    </Card>
  );
}

// Bundle Card
function BundleCard({ bundle }) {
  if (!bundle) return null;

  const totalPrice = bundle.bundle_price || (bundle.price_per_head * bundle.quantity);
  const pricePerHead = bundle.price_per_head || (totalPrice / bundle.quantity);
  const bundleTitle = bundle.farm_name || bundle.bundle_name || 'Farm Bundle';

  return (
    <Card className="overflow-hidden cursor-pointer rounded-2xl border shadow-lg hover:shadow-xl transition-all">
      <div className="relative h-64 bg-muted">
        {bundle.video_url ? (
          <video src={bundle.video_url} className="w-full h-full object-cover" controls onClick={(e) => e.stopPropagation()} />
        ) : bundle.images && bundle.images[0] ? (
          <img src={bundle.images[0]} alt={bundleTitle} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
            <Package className="w-12 h-12 text-green-300" />
          </div>
        )}
        <div className="absolute bottom-3 left-3"><Badge className="bg-amber-500 text-white">Bundle</Badge></div>
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{bundleTitle}</h3>
            <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5"><MapPin className="w-3 h-3" /><span>{bundle.location?.split(',')[0] || 'Location'}</span></div>
          </div>
          <div className="text-right">
            <p className="font-bold text-amber-600 text-lg">R {Math.round(pricePerHead).toLocaleString()}<span className="text-xs font-normal">/head</span></p>
            <p className="text-gray-400 text-xs">Total: R {Math.round(totalPrice).toLocaleString()}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">{bundle.quantity} animals</p>
        {bundle.bundle_description && <p className="text-sm text-gray-500 line-clamp-2">{bundle.bundle_description}</p>}
        <div className="flex flex-wrap gap-1 pt-1">
          {bundle.breed_type && <Badge variant="secondary" className="text-xs bg-gray-100">{bundle.breed_type}</Badge>}
          {bundle.pure_cross && <Badge variant="outline" className="text-xs">{bundle.pure_cross === 'pure' ? 'Pure' : 'Cross'}</Badge>}
          {bundle.age_display && <Badge variant="outline" className="text-xs">{bundle.age_display}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Browse({ setShowHelpCenter, setShowTour }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ farmName: '', location: '', priceMin: '', priceMax: '', animalType: '', listingType: 'all', pureCross: '' });
  const [viewMode, setViewMode] = useState('both');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [realListings, setRealListings] = useState([]);
  const [realBundles, setRealBundles] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMoreListings, setHasMoreListings] = useState(true);
  const [hasMoreBundles, setHasMoreBundles] = useState(true);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  useEffect(() => {
    const getUser = async () => { const { data: { user } } = await supabase.auth.getUser(); setUser(user); };
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

  const loadListings = useCallback(async (pageNum = 0, append = false) => {
    const { data: livestockData } = await supabase
      .from('livestock')
      .select('*, profiles!user_id (farm_name, full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    const itemsWithType = (livestockData || []).map(item => ({
      ...item, listing_type: 'individual', isBundle: false,
      farm_name: item.profiles?.farm_name || item.profiles?.full_name || item.seller_name || 'Individual Seller'
    }));

    if (append) { setRealListings(prev => [...prev, ...itemsWithType]); }
    else { setRealListings(itemsWithType); }
    setHasMoreListings((livestockData || []).length === PAGE_SIZE);
  }, []);

  const loadBundles = useCallback(async (pageNum = 0, append = false) => {
    const { data: bundlesData } = await supabase
      .from('bundles')
      .select('*, profiles!user_id (farm_name, full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    const bundlesWithType = (bundlesData || []).map(item => ({
      ...item, listing_type: 'bundle', isBundle: true,
      farm_name: item.profiles?.farm_name || item.profiles?.full_name || 'Farm Bundle'
    }));

    if (append) { setRealBundles(prev => [...prev, ...bundlesWithType]); }
    else { setRealBundles(bundlesWithType); }
    setHasMoreBundles((bundlesData || []).length === PAGE_SIZE);
  }, []);

  useEffect(() => {
    const loadAll = async () => { setIsLoading(true); await Promise.all([loadListings(0), loadBundles(0)]); setIsLoading(false); };
    loadAll();
  }, [loadListings, loadBundles]);

  const addToWishlist = async (livestock) => {
    if (!user) { alert('Please login to save to wishlist'); window.location.href = '/login'; return; }
    const isInWishlist = wishlistIds.includes(livestock.id);
    if (isInWishlist) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('livestock_id', livestock.id);
      setWishlistIds(wishlistIds.filter(id => id !== livestock.id));
      alert('Removed from wishlist');
    } else {
      await supabase.from('wishlist').insert([{ user_id: user.id, livestock_id: livestock.id, livestock_name: livestock.farm_name || livestock.breed_type || livestock.bundle_name || 'Livestock', original_price: livestock.price || livestock.bundle_price }]);
      setWishlistIds([...wishlistIds, livestock.id]);
      alert('Added to wishlist');
    }
  };

  const allItems = useMemo(() => [...realListings, ...realBundles], [realListings, realBundles]);

  const displayItems = useMemo(() => {
    let items = [...allItems];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => (item.farm_name || '').toLowerCase().includes(query) || (item.bundle_name || '').toLowerCase().includes(query) || (item.breed_type || '').toLowerCase().includes(query));
    }
    if (filters.farmName) items = items.filter(item => (item.farm_name || '').toLowerCase().includes(filters.farmName.toLowerCase()));
    if (viewMode === 'individual') items = items.filter(item => item.listing_type === 'individual');
    else if (viewMode === 'bundles') items = items.filter(item => item.listing_type === 'bundle');
    if (filters.location) items = items.filter(item => (item.location || '').toLowerCase().includes(filters.location.toLowerCase()));
    if (filters.animalType) items = items.filter(item => item.animal_type === filters.animalType);
    if (filters.listingType === 'individual') items = items.filter(item => item.listing_type === 'individual');
    else if (filters.listingType === 'bundle') items = items.filter(item => item.listing_type === 'bundle');
    if (filters.pureCross) items = items.filter(item => item.pure_cross === filters.pureCross);
    if (filters.priceMin) { const price = parseFloat(filters.priceMin); items = items.filter(item => { const itemPrice = item.price || item.bundle_price || 0; return itemPrice >= price; }); }
    if (filters.priceMax) { const price = parseFloat(filters.priceMax); items = items.filter(item => { const itemPrice = item.price || item.bundle_price || 0; return itemPrice <= price; }); }
    return items;
  }, [allItems, searchQuery, viewMode, filters]);

  useEffect(() => {
    if (displayItems.length > 0 && currentIndex < displayItems.length) { setCurrentItem(displayItems[currentIndex]); }
    else if (currentIndex >= displayItems.length) { setCurrentIndex(Math.max(0, displayItems.length - 1)); }
  }, [currentIndex, displayItems]);

  const handleDragEnd = (event, info) => {
    if (Math.abs(info.offset.x) > 100) { if (info.offset.x > 0) handleSwipeRight(); else handleSwipeLeft(); }
    x.set(0);
  };

  const handleSwipeRight = () => { if (currentIndex < displayItems.length - 1) setCurrentIndex(prev => prev + 1); };
  const handleSwipeLeft = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };

  const handleCardClick = () => {
    if (currentItem) {
      if (currentItem.listing_type === 'bundle') window.location.href = `/BundleDetails?id=${currentItem.id}`;
      else window.location.href = `/BreedDetails?id=${currentItem.id}`;
    }
  };

  const toggleLike = () => setHasLiked(!hasLiked);

  if (isLoading && allItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-300 border-t-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-4 space-y-3">
          <div className="flex justify-center">
            <Link to="/"><Logo size="small" /></Link>
          </div>

          <div className="flex items-center gap-2" data-tour-target="search-filter">
            <MobileMenu user={user} onOpenHelpCenter={() => setShowHelpCenter(true)} />
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input placeholder="Search farm, livestock, breeds..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentIndex(0); }} className="w-full pl-9 pr-8 py-2 bg-white border border-stone-200 rounded-full focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition text-sm" />
              {searchQuery && <button onClick={() => { setSearchQuery(''); setCurrentIndex(0); }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-stone-400" /></button>}
            </div>
            <button onClick={() => setIsFilterOpen(true)} className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition"><Filter className="w-4 h-4 text-stone-600" /></button>
          </div>

          <div className="flex gap-1 rounded-full p-1 bg-stone-100">
            {['both', 'individual', 'bundles'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`flex-1 py-2 rounded-full text-sm font-medium transition-all capitalize ${viewMode === mode ? 'bg-white shadow-sm text-amber-600' : 'text-stone-500'}`}>{mode}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Card Area */}
      <div className="relative max-w-md mx-auto px-4 pt-6 pb-32" data-tour-target="swipe-area">
        {currentIndex > 0 && (
          <button onClick={handleSwipeLeft} className="fixed left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-xl text-gray-500 hover:text-red-500 transition z-20">&lt;</button>
        )}
        {currentIndex < displayItems.length - 1 && (
          <button onClick={handleSwipeRight} className="fixed right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-xl text-gray-500 hover:text-green-500 transition z-20">&gt;</button>
        )}

        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">No listings found</h3>
            <p className="text-stone-500 text-sm mb-6">Try adjusting your search or filters</p>
            <button onClick={() => { setFilters({ farmName: '', location: '', priceMin: '', priceMax: '', animalType: '', listingType: 'all', pureCross: '' }); setSearchQuery(''); }} className="text-amber-600 text-sm underline">Clear all filters</button>
            <Link to="/SellerUpload"><Button className="mt-6">+ Add Your First Listing</Button></Link>
          </div>
        ) : (
          <>
            <div className="h-[550px] mb-6">
              <AnimatePresence>
                <motion.div key={currentItem?.id || currentItem?.bundle_name} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={handleDragEnd} style={{ x, rotate, opacity }} onClick={handleCardClick} className="cursor-pointer absolute w-full">
                  {currentItem?.listing_type === 'bundle' ? <BundleCard bundle={currentItem} /> : <LivestockCard livestock={currentItem} onWishlist={addToWishlist} isInWishlist={wishlistIds.includes(currentItem?.id)} onLike={toggleLike} hasLiked={hasLiked} />}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex justify-center">
              <button onClick={toggleLike} className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition active:scale-95 border border-stone-100">
                <Heart className={`w-5 h-5 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
              </button>
            </div>
          </>
        )}
      </div>

      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApply={setFilters} initialFilters={filters} />

      {/* FAB */}
      <Link to="/SellerUpload">
        <button className="fixed bottom-6 right-6 w-12 h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg text-2xl transition active:scale-95 flex items-center justify-center" data-tour-target="upload-button">+</button>
      </Link>
    </div>
  );
}