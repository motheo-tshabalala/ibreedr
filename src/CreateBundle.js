import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Package, Percent, Truck } from 'lucide-react';
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
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/MyListings">
            <button className="p-2 -m-2 rounded-full hover:bg-stone-100 transition">
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-bold text-stone-800">Create Bundle</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-xl border border-stone-100 p-5 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700 mb-1 block">Bundle Name *</label>
            <input
              type="text"
              placeholder="e.g., Breeding Starter Pack"
              value={bundleName}
              onChange={(e) => setBundleName(e.target.value)}
              className="w-full border border-stone-200 rounded-lg p-2.5 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 mb-1 block">Description</label>
            <textarea
              placeholder="Describe what's included and why it's a great deal..."
              value={bundleDescription}
              onChange={(e) => setBundleDescription(e.target.value)}
              rows={3}
              className="w-full border border-stone-200 rounded-lg p-2.5 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 mb-1 block">
              Select Livestock ({selectedLivestock.length} selected) *
            </label>
            {myListings.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-lg">
                <p className="text-stone-500 text-sm">No active listings available</p>
                <Link to="/SellerUpload">
                  <button className="mt-3 text-amber-600 text-sm underline">Create a listing first</button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {myListings.map(animal => (
                  <button
                    key={animal.id}
                    onClick={() => toggleLivestock(animal.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${selectedLivestock.includes(animal.id)
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-stone-200 hover:border-stone-300'
                      }`}
                  >
                    {animal.images && animal.images[0] ? (
                      <img src={animal.images[0]} alt={animal.name} className="w-14 h-14 rounded-lg object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-stone-100 flex items-center justify-center text-2xl">🐄</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-800 truncate text-sm">{animal.name}</p>
                      <p className="text-xs text-stone-500">{animal.breed_type}</p>
                      <p className="text-xs font-medium text-stone-800">R {animal.price?.toLocaleString()}</p>
                    </div>
                    {selectedLivestock.includes(animal.id) && (
                      <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedLivestock.length > 0 && (
            <div className="p-4 bg-stone-50 rounded-lg">
              <p className="text-sm text-stone-600 mb-1">Individual Total</p>
              <p className="text-xl font-bold text-stone-800 mb-3">
                R {calculateIndividualTotal().toLocaleString()}
              </p>

              <label className="text-sm font-medium text-stone-700 mb-1 block">Bundle Price *</label>
              <input
                type="number"
                placeholder="Enter bundle price"
                value={bundlePrice}
                onChange={(e) => setBundlePrice(e.target.value)}
                className="w-full border border-stone-200 rounded-lg p-2.5 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none transition"
              />

              {bundlePrice && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <Percent className="w-4 h-4" />
                  <span className="font-semibold">{calculateDiscount()}% discount</span>
                  <span className="text-stone-500 text-xs">
                    (Save R {(calculateIndividualTotal() - parseFloat(bundlePrice)).toLocaleString()})
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-stone-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-stone-500" />
                <label className="font-medium text-stone-700 text-sm">Offer Delivery</label>
              </div>
              <button
                onClick={() => setTransportAvailable(!transportAvailable)}
                className={`w-10 h-5 rounded-full transition-colors ${transportAvailable ? 'bg-amber-500' : 'bg-stone-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${transportAvailable ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {transportAvailable && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="text-sm text-stone-600 mb-1 block">Rate per KM (R)</label>
                  <input
                    type="number"
                    placeholder="e.g., 15"
                    value={transportRate}
                    onChange={(e) => setTransportRate(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg p-2.5 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-sm text-stone-600 mb-1 block">Max Radius (KM)</label>
                  <input
                    type="number"
                    placeholder="e.g., 200"
                    value={maxRadius}
                    onChange={(e) => setMaxRadius(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg p-2.5 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none transition"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={createBundle}
            disabled={!bundleName || selectedLivestock.length < 2 || !bundlePrice || isSubmitting || myListings.length === 0}
            className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-base font-semibold disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Creating...' : 'Create Bundle'}
          </button>
        </div>
      </div>
    </div>
  );
}