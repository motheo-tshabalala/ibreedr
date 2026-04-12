import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Package, Percent, MapPin, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function CreateBundle() {
  const [user, setUser] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [selectedLivestock, setSelectedLivestock] = useState([]);
  const [bundlePrice, setBundlePrice] = useState('');
  const [transportAvailable, setTransportAvailable] = useState(false);
  const [transportRate, setTransportRate] = useState('');
  const [maxRadius, setMaxRadius] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current user and their active listings
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        loadListings(user.id);
      } else {
        window.location.href = '/login';
      }
    };
    getUser();
  }, []);

  const loadListings = async (userId) => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('livestock')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error loading listings:', error);
    } else {
      setMyListings(data || []);
    }

    setIsLoading(false);
  };

  const toggleLivestock = (id) => {
    setSelectedLivestock(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const calculateIndividualTotal = () => {
    return selectedLivestock.reduce((sum, id) => {
      const animal = myListings.find(l => l.id === id);
      return sum + (animal?.price || 0);
    }, 0);
  };

  const calculateDiscount = () => {
    const individual = calculateIndividualTotal();
    const bundle = parseFloat(bundlePrice) || 0;
    if (individual === 0) return 0;
    return Math.round(((individual - bundle) / individual) * 100);
  };

  const createBundle = async () => {
    if (!bundleName || selectedLivestock.length < 2 || !bundlePrice) {
      alert('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    const firstAnimal = myListings.find(l => l.id === selectedLivestock[0]);
    const images = selectedLivestock
      .map(id => myListings.find(l => l.id === id)?.images?.[0])
      .filter(Boolean);

    // Create bundle
    const { error: bundleError } = await supabase
      .from('bundles')
      .insert([{
        user_id: user.id,
        bundle_name: bundleName,
        bundle_description: bundleDescription,
        livestock_ids: selectedLivestock,
        bundle_price: parseFloat(bundlePrice),
        discount_percentage: calculateDiscount(),
        location: firstAnimal?.location,
        images: images,
        seller_transport_available: transportAvailable,
        seller_transport_rate_per_km: transportAvailable ? parseFloat(transportRate) : null,
        seller_max_delivery_radius_km: transportAvailable ? parseFloat(maxRadius) : null,
        status: 'active'
      }]);

    if (bundleError) {
      console.error('Bundle error:', bundleError);
      alert('Failed to create bundle: ' + bundleError.message);
      setIsSubmitting(false);
      return;
    }

    // Mark livestock as reserved
    for (const id of selectedLivestock) {
      await supabase
        .from('livestock')
        .update({ status: 'reserved' })
        .eq('id', id);
    }

    alert('Bundle created successfully!');
    window.location.href = '/MyListings';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/MyListings">
            <button className="p-2 hover:bg-stone-100 rounded-full">
              <ArrowLeft className="w-6 h-6 text-stone-800" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-600" />
            <h1 className="text-xl font-bold text-stone-800">Create Bundle</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 block">Bundle Name *</label>
            <input
              type="text"
              placeholder="e.g., Breeding Starter Pack"
              value={bundleName}
              onChange={(e) => setBundleName(e.target.value)}
              className="w-full border-2 border-stone-200 rounded-xl p-3 focus:border-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 block">Description</label>
            <textarea
              placeholder="Describe what's included and why it's a great deal..."
              value={bundleDescription}
              onChange={(e) => setBundleDescription(e.target.value)}
              rows={3}
              className="w-full border-2 border-stone-200 rounded-xl p-3 focus:border-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 block">
              Select Livestock ({selectedLivestock.length} selected) *
            </label>
            {myListings.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-xl">
                <p className="text-stone-500">No active listings available</p>
                <Link to="/SellerUpload">
                  <button className="mt-3 text-amber-600 underline">Create a listing first</button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {myListings.map(animal => (
                  <button
                    key={animal.id}
                    onClick={() => toggleLivestock(animal.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${selectedLivestock.includes(animal.id)
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-stone-200 hover:border-stone-300'
                      }`}
                  >
                    {animal.images && animal.images[0] ? (
                      <img src={animal.images[0]} alt={animal.name} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center text-2xl">🐄</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-800 truncate">{animal.name}</p>
                      <p className="text-sm text-stone-600">{animal.breed_type}</p>
                      <p className="text-sm font-medium text-stone-800">R {animal.price?.toLocaleString()}</p>
                    </div>
                    {selectedLivestock.includes(animal.id) && (
                      <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedLivestock.length > 0 && (
            <div className="p-4 bg-stone-50 rounded-xl">
              <p className="text-sm text-stone-600 mb-1">Individual Total</p>
              <p className="text-2xl font-bold text-stone-800 mb-3">
                R {calculateIndividualTotal().toLocaleString()}
              </p>

              <label className="text-sm font-medium text-stone-700 mb-2 block">Bundle Price *</label>
              <input
                type="number"
                placeholder="Enter bundle price"
                value={bundlePrice}
                onChange={(e) => setBundlePrice(e.target.value)}
                className="w-full border-2 border-stone-200 rounded-xl p-3 focus:border-amber-400 outline-none"
              />

              {bundlePrice && (
                <div className="mt-3 flex items-center gap-2 text-green-600">
                  <Percent className="w-5 h-5" />
                  <span className="font-semibold">{calculateDiscount()}% discount</span>
                  <span className="text-sm text-stone-500">
                    (Save R {(calculateIndividualTotal() - parseFloat(bundlePrice)).toLocaleString()})
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-stone-600" />
                <label className="font-medium text-stone-700">Offer Delivery</label>
              </div>
              <button
                onClick={() => setTransportAvailable(!transportAvailable)}
                className={`w-12 h-6 rounded-full transition-colors ${transportAvailable ? 'bg-amber-500' : 'bg-stone-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${transportAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {transportAvailable && (
              <div className="grid grid-cols-2 gap-4 pl-7">
                <div>
                  <label className="text-sm text-stone-600 mb-2 block">Rate per KM (R)</label>
                  <input
                    type="number"
                    placeholder="e.g., 15"
                    value={transportRate}
                    onChange={(e) => setTransportRate(e.target.value)}
                    className="w-full border-2 border-stone-200 rounded-xl p-3 focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-stone-600 mb-2 block">Max Radius (KM)</label>
                  <input
                    type="number"
                    placeholder="e.g., 200"
                    value={maxRadius}
                    onChange={(e) => setMaxRadius(e.target.value)}
                    className="w-full border-2 border-stone-200 rounded-xl p-3 focus:border-amber-400 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={createBundle}
            disabled={!bundleName || selectedLivestock.length < 2 || !bundlePrice || isSubmitting || myListings.length === 0}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-full h-12 font-semibold disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Creating...' : 'Create Bundle'}
          </button>
        </div>
      </div>
    </div>
  );
}