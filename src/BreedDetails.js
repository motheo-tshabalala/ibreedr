import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Heart, Star, Phone, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function BreedDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const livestockId = urlParams.get('id');

  const [livestock, setLivestock] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  useEffect(() => {
    const loadLivestock = async () => {
      if (!livestockId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('livestock')
        .select('*')
        .eq('id', livestockId)
        .single();

      if (!error && data) {
        setLivestock(data);
      }
      setIsLoading(false);
    };

    loadLivestock();
  }, [livestockId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500"></div>
      </div>
    );
  }

  if (!livestock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Livestock not found</h2>
          <Link to="/Browse">
            <button className="bg-amber-500 text-white px-6 py-2 rounded-full">Back to Browse</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/Browse">
            <button className="flex items-center gap-2 text-stone-600 hover:text-amber-600">
              <ArrowLeft className="w-5 h-5" />
              Back to Browse
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-96 bg-amber-100 flex items-center justify-center">
            {livestock.images && livestock.images[0] ? (
              <img src={livestock.images[0]} alt={livestock.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl">🐄</span>
            )}
          </div>

          <div className="p-6">
            <h1 className="text-3xl font-bold text-stone-800 mb-2">{livestock.name}</h1>
            <div className="flex items-center gap-2 text-stone-600 mb-4">
              <MapPin className="w-4 h-4" />
              <span>{livestock.location}</span>
              <span className="mx-2">•</span>
              <span className="capitalize">{livestock.animal_type}</span>
              <span className="mx-2">•</span>
              <span>{livestock.breed_type}</span>
            </div>

            {livestock.price && (
              <div className="text-3xl font-bold text-amber-600 mb-4">
                R {Number(livestock.price).toLocaleString()}
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-1">
                <Heart className="w-5 h-5 text-rose-500" />
                <span>{livestock.likes_count || 0} likes</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold text-stone-800 mb-2">Contact Seller</h3>
              <p className="text-stone-600">{livestock.seller_name || 'Anonymous'}</p>
              {livestock.seller_phone && (
                <a href={`tel:${livestock.seller_phone}`} className="flex items-center gap-2 text-stone-600 mt-2">
                  <Phone className="w-4 h-4" />
                  {livestock.seller_phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}