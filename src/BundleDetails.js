import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, MapPin, Percent, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function BundleDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const bundleId = urlParams.get('id');

  const [bundle, setBundle] = useState(null);
  const [bundleLivestock, setBundleLivestock] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Load bundle details
  useEffect(() => {
    const loadBundle = async () => {
      if (!bundleId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Get bundle
      const { data: bundleData, error: bundleError } = await supabase
        .from('bundles')
        .select('*')
        .eq('id', bundleId)
        .single();

      if (bundleError) {
        console.error('Error loading bundle:', bundleError);
        setIsLoading(false);
        return;
      }

      setBundle(bundleData);

      // Get livestock in bundle
      if (bundleData.livestock_ids && bundleData.livestock_ids.length > 0) {
        const { data: livestockData } = await supabase
          .from('livestock')
          .select('*')
          .in('id', bundleData.livestock_ids);

        setBundleLivestock(livestockData || []);
      }

      setIsLoading(false);
    };

    loadBundle();
  }, [bundleId]);

  const individualTotal = bundleLivestock.reduce((sum, l) => sum + (Number(l.price) || 0), 0);
  const discount = bundle ? bundle.discount_percentage || Math.round(((individualTotal - bundle.bundle_price) / individualTotal) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-stone-300 border-t-amber-600"></div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Bundle not found</h2>
          <Link to="/Browse">
            <button className="bg-stone-800 hover:bg-stone-900 text-white rounded-full px-6 py-2">
              Back to Browse
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/Browse">
            <button className="p-2 hover:bg-stone-100 rounded-full">
              <ArrowLeft className="w-6 h-6 text-stone-800" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-stone-800">Bundle Details</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Images */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
          {bundle.images && bundle.images[0] ? (
            <img src={bundle.images[0]} alt={bundle.bundle_name} className="w-full h-80 object-cover" />
          ) : (
            <div className="w-full h-80 bg-gradient-to-br from-purple-200 to-purple-400 flex items-center justify-center">
              <Package className="w-24 h-24 text-white" />
            </div>
          )}
        </div>

        {/* Main Info */}
        <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Bundle Deal</span>
              </div>
              <h2 className="text-3xl font-bold text-stone-800 mb-2">{bundle.bundle_name}</h2>
              <div className="flex items-center gap-2 text-stone-600">
                <MapPin className="w-4 h-4" />
                <span>{bundle.location || 'Location not specified'}</span>
              </div>
            </div>
            {discount > 0 && (
              <div className="bg-green-100 text-green-800 rounded-full px-4 py-2 flex items-center gap-2">
                <Percent className="w-5 h-5" />
                <span className="font-bold">{discount}% OFF</span>
              </div>
            )}
          </div>

          {bundle.bundle_description && (
            <p className="text-stone-700 leading-relaxed">{bundle.bundle_description}</p>
          )}

          <div className="pt-4 border-t border-stone-200">
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-bold text-purple-600">
                R {Number(bundle.bundle_price).toLocaleString()}
              </p>
              {individualTotal > bundle.bundle_price && (
                <p className="text-lg text-stone-400 line-through">
                  R {individualTotal.toLocaleString()}
                </p>
              )}
            </div>
            {individualTotal > bundle.bundle_price && (
              <p className="text-sm text-stone-600 mt-1">
                Save R {(individualTotal - bundle.bundle_price).toLocaleString()} compared to individual prices
              </p>
            )}
          </div>
        </div>

        {/* Livestock in Bundle */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-stone-800 mb-4">Included in Bundle ({bundleLivestock.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundleLivestock.map(animal => (
              <Link key={animal.id} to={`/BreedDetails?id=${animal.id}`}>
                <div className="flex gap-3 p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition cursor-pointer">
                  {animal.images && animal.images[0] ? (
                    <img src={animal.images[0]} alt={animal.name} className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-stone-200 flex items-center justify-center text-3xl">🐄</div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-stone-800">{animal.name}</p>
                    <p className="text-sm text-stone-600">{animal.breed_type}</p>
                    <p className="text-sm font-medium text-stone-800">R {Number(animal.price).toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Transport Info */}
        {bundle.seller_transport_available && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-stone-800 mb-4">Delivery Available</h3>
            <div className="space-y-2">
              <p className="text-stone-600">Rate: R {bundle.seller_transport_rate_per_km} per km</p>
              <p className="text-stone-600">Max radius: {bundle.seller_max_delivery_radius_km} km</p>
            </div>
          </div>
        )}

        {/* Buy Button */}
        {user && bundle.user_id !== user.id && (
          <Link to={`/Payment?bundle=${bundle.id}`}>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full h-14 text-lg font-semibold">
              <CreditCard className="w-5 h-5 inline mr-2" />
              Buy Bundle - R {Number(bundle.bundle_price).toLocaleString()}
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}