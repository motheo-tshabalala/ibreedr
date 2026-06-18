import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Video, ChevronRight, ChevronLeft, Check, Building2, MapPin, Phone, User, Package, Percent } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";

const ANIMAL_TYPES = [
  { value: 'cattle', label: 'Cattle' },
  { value: 'goats', label: 'Goats' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'pigs', label: 'Pigs' },
  { value: 'chickens', label: 'Chickens' },
  { value: 'horses', label: 'Horses' },
  { value: 'donkeys', label: 'Donkeys' },
  { value: 'rabbits', label: 'Rabbits' }
];

// Known SA provinces for matching — used to extract province from free-text location
const SA_PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape'
];

// ✅ FIXED - Extract province from any free-text location string
// Handles: "Mpumalanga", "Tzaneen, Limpopo", "Johannesburg, Gauteng, SA", etc.
const extractProvince = (locationString) => {
  if (!locationString) return null;
  const lower = locationString.toLowerCase();
  const match = SA_PROVINCES.find(p => lower.includes(p.toLowerCase()));
  return match || null;
};

const QUANTITY_OPTIONS = [1, 5, 10, 20, 50];

export default function SellerUpload() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [marketSuggestion, setMarketSuggestion] = useState(null);
  const [showPriceSuggestion, setShowPriceSuggestion] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    farm_name: '',
    seller_name: '',
    seller_phone: '',
    whatsapp_number: '',
    location: '',
    quantity: 1,
    is_bundle: false,
    bundle_discount: 0,
    animal_type: '',
    breed_type: '',
    pure_cross: '',
    age_years: '',
    age_months: '',
    teeth_age: '',
    weight_min: '',
    weight_max: '',
    pregnancy_status: '',
    sire_used: '',
    price: '',
    health_info: '',
    notes: '',
    images: [],
    video_url: '',
    facebook_url: '',
    instagram_url: '',
    website_url: '',
    gps_latitude: '',
    gps_longitude: ''
  });

  const totalSteps = 7;

  // Load user and profile
  useEffect(() => {
    const loadUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setProfile(profile);
        setFormData(prev => ({
          ...prev,
          farm_name: profile.farm_name || profile.full_name || '',
          seller_name: profile.full_name || '',
          seller_phone: profile.phone || '',
          whatsapp_number: profile.whatsapp_number || '',
          location: profile.farm_location || '',
          gps_latitude: profile.gps_latitude || '',
          gps_longitude: profile.gps_longitude || ''
        }));
      }
    };

    loadUserAndProfile();
  }, [navigate]);

  // ✅ ADDED - Read duplicate listing data from MyListings sessionStorage
  useEffect(() => {
    const duplicateData = sessionStorage.getItem('ibreedr_duplicate_listing');
    if (duplicateData) {
      try {
        const parsed = JSON.parse(duplicateData);
        setFormData(prev => ({ ...prev, ...parsed, images: [] })); // reset images
        sessionStorage.removeItem('ibreedr_duplicate_listing');
      } catch (e) {
        console.error('Failed to parse duplicate listing data', e);
      }
    }
  }, []);

  // ✅ FIXED - Fetch price suggestion with province fallback
  // Strategy:
  //   1. Try to match a known SA province from the location string
  //   2. If province match exists, query with that province
  //   3. If no result (province too specific or no match), fall back to national query
  //   4. Only hide the suggestion panel if BOTH queries return nothing
  const fetchPriceSuggestion = useCallback(async () => {
    const animalType = formData.animal_type;
    if (!animalType) {
      setShowPriceSuggestion(false);
      return;
    }

    try {
      const province = extractProvince(formData.location);

      let suggestion = null;

      // Step 1 — try province-specific query if we detected a province
      if (province) {
        const { data, error } = await supabase
          .rpc('get_price_suggestion', {
            p_animal_type: animalType,
            p_province: province
          });

        if (!error && data && data.length > 0) {
          suggestion = data[0];
        }
      }

      // Step 2 — fallback to national (no province filter) if province query returned nothing
      if (!suggestion) {
        const { data: nationalData, error: nationalError } = await supabase
          .rpc('get_price_suggestion', {
            p_animal_type: animalType,
            p_province: null
          });

        if (!nationalError && nationalData && nationalData.length > 0) {
          suggestion = nationalData[0];
        }
      }

      // Step 3 — if we have any suggestion data at all, show it
      if (suggestion) {
        setMarketSuggestion({
          range: {
            min: suggestion.min_price,
            max: suggestion.max_price
          },
          avg: suggestion.avg_price,
          demand: suggestion.demand_level,
          trend: suggestion.trend_direction,
          trend_percentage: suggestion.trend_percentage,
          sample_size: suggestion.sample_size,
          confidence: suggestion.confidence_score,
          suggested_sweet_spot: {
            min: Math.round(suggestion.avg_price * 0.9),
            max: Math.round(suggestion.avg_price * 1.1)
          }
        });
        setShowPriceSuggestion(true);
      } else {
        // Truly no data for this animal type at all
        setShowPriceSuggestion(false);
      }

    } catch (error) {
      console.error('Error fetching price suggestion:', error);
      setShowPriceSuggestion(false);
    }
  }, [formData.animal_type, formData.location]);

  // Trigger fetch when animal type or location changes, with 500ms debounce
  useEffect(() => {
    if (formData.animal_type) {
      const timer = setTimeout(() => {
        fetchPriceSuggestion();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.animal_type, formData.location, fetchPriceSuggestion]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      const imageUrls = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          setMessage({ type: 'error', text: `${file.name} is too large. Max 5MB per image.` });
          continue;
        }
        if (!file.type.startsWith('image/')) {
          setMessage({ type: 'error', text: `${file.name} is not an image file.` });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `listings/${user?.id}/${fileName}`;

        const { error } = await supabase.storage
          .from('livestock-images')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('livestock-images')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));

      if (imageUrls.length > 0) {
        setMessage({ type: 'success', text: `${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''} uploaded` });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({ type: 'error', text: 'Failed to upload images: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setMessage({ type: 'error', text: 'Please upload a video file' });
      return;
    }

    setVideoUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `videos/${user?.id}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('livestock-videos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('livestock-videos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, video_url: publicUrl }));
      setMessage({ type: 'success', text: 'Video uploaded successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      console.error('Video upload failed:', error);
      setMessage({ type: 'error', text: 'Failed to upload video: ' + error.message });
    } finally {
      setVideoUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const pricePerHead = parseFloat(formData.price) || 0;
      const quantity = parseInt(formData.quantity) || 1;
      const discount = parseFloat(formData.bundle_discount) || 0;

      const submitData = {
        user_id: user.id,
        farm_name: formData.farm_name,
        seller_name: formData.seller_name,
        seller_phone: formData.seller_phone,
        whatsapp_number: formData.whatsapp_number,
        location: formData.location,
        quantity: quantity,
        is_bundle: formData.is_bundle,
        bundle_discount: formData.is_bundle ? discount : 0,
        price: pricePerHead,
        animal_type: formData.animal_type,
        breed_type: formData.breed_type,
        pure_cross: formData.pure_cross,
        age_years: parseInt(formData.age_years) || 0,
        age_months: parseInt(formData.age_months) || 0,
        teeth_age: formData.teeth_age,
        weight_min: formData.weight_min ? parseFloat(formData.weight_min) : null,
        weight_max: formData.weight_max ? parseFloat(formData.weight_max) : null,
        pregnancy_status: formData.pregnancy_status,
        sire_used: formData.sire_used,
        health_info: formData.health_info,
        notes: formData.notes,
        images: formData.images,
        video_url: formData.video_url,
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url,
        website_url: formData.website_url,
        gps_latitude: formData.gps_latitude ? parseFloat(formData.gps_latitude) : null,
        gps_longitude: formData.gps_longitude ? parseFloat(formData.gps_longitude) : null,
        status: 'active'
        // total_price is NOT sent — calculated by DB trigger
      };

      const { error } = await supabase
        .from('livestock')
        .insert([submitData]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Listing published successfully!' });
      setTimeout(() => {
        navigate('/MyListings');
      }, 1500);

    } catch (err) {
      console.error('Submit error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to publish listing' });
    } finally {
      setSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.farm_name && formData.location;
      case 2: return formData.quantity > 0;
      case 3: return formData.animal_type && formData.breed_type;
      case 4: return true;
      case 5: return true;
      case 6: return formData.price && parseFloat(formData.price) > 0;
      case 7: return formData.images.length > 0;
      default: return true;
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {[1, 2, 3, 4, 5, 6, 7].map((step) => (
        <div key={step} className="flex items-center flex-1">
          <button
            onClick={() => {
              // ✅ FIXED - only allow backward navigation, forward requires Next button + validation
              if (step < currentStep) setCurrentStep(step);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all flex-shrink-0 ${currentStep === step
                ? 'bg-primary-green text-white'
                : step < currentStep
                  ? 'bg-green-500 text-white cursor-pointer'
                  : 'bg-gray-200 text-gray-500 cursor-default'
              }`}
          >
            {step < currentStep ? <Check className="w-4 h-4" /> : step}
          </button>
          {step < 7 && (
            <div className={`flex-1 h-0.5 mx-1 ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Your Farm Information</h2>
            <p className="text-sm text-gray-500 text-center">This information appears on all your listings</p>

            <div className="p-4 bg-primary-green/5 rounded-lg border border-primary-green/20">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Building2 className="w-4 h-4 text-primary-green" />
                <span>Farm/Business Name *</span>
              </div>
              <Input
                value={formData.farm_name}
                onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                placeholder="e.g., Green Valley Farm"
              />
            </div>

            <div className="p-4 bg-primary-green/5 rounded-lg border border-primary-green/20">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <MapPin className="w-4 h-4 text-primary-green" />
                <span>Farm Location *</span>
              </div>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Tzaneen, Limpopo"
              />
              <p className="text-xs text-gray-400 mt-1">
                Include your province for accurate market pricing (e.g. "Limpopo" or "Tzaneen, Limpopo")
              </p>
            </div>

            <div className="p-4 bg-primary-green/5 rounded-lg border border-primary-green/20">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <User className="w-4 h-4 text-primary-green" />
                <span>Contact Name</span>
              </div>
              <Input
                value={formData.seller_name}
                onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div className="p-4 bg-primary-green/5 rounded-lg border border-primary-green/20">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Phone className="w-4 h-4 text-primary-green" />
                <span>Phone Number</span>
              </div>
              <Input
                type="tel"
                value={formData.seller_phone}
                onChange={(e) => setFormData({ ...formData, seller_phone: e.target.value })}
                placeholder="+27 XX XXX XXXX"
              />
            </div>

            {/* WhatsApp — moved to Step 1 as primary contact channel */}
            <div className="p-4 bg-primary-green/5 rounded-lg border border-primary-green/20">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.438h-.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
                </svg>
                <span>
                  WhatsApp Number{' '}
                  <span className="text-[#25D366] text-[10px] font-semibold bg-green-50 px-1.5 py-0.5 rounded-full">
                    Recommended
                  </span>
                </span>
              </div>
              <Input
                type="tel"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="e.g. 0821234567 — buyers will contact you here"
              />
              <p className="text-xs text-gray-400 mt-1">
                Listings with WhatsApp receive significantly more enquiries
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">How Many Animals?</h2>

            <div className="grid grid-cols-3 gap-3">
              {QUANTITY_OPTIONS.map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setFormData({ ...formData, quantity: qty })}
                  className={`p-4 rounded-xl border-2 transition-all ${formData.quantity === qty
                      ? 'border-primary-green bg-primary-green/5'
                      : 'border-gray-200 hover:border-primary-green/50'
                    }`}
                >
                  <div className="text-2xl font-bold text-center">{qty}</div>
                  <div className="text-xs text-gray-500 text-center">Animals</div>
                </button>
              ))}
            </div>

            <div>
              <Label>Custom Quantity</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="mt-1"
              />
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-gray-900">Bundle Discount</p>
                    <p className="text-xs text-gray-500">Offer a discount for buying in bulk</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_bundle: !prev.is_bundle }))}
                  className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${formData.is_bundle ? 'bg-primary-green' : 'bg-gray-300'
                    }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_bundle ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                </button>
              </div>

              {formData.is_bundle && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <Label className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-600" />
                    Discount Percentage (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.bundle_discount}
                    onChange={(e) => setFormData({ ...formData, bundle_discount: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 10 for 10% off"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Animal Details</h2>

            <div>
              <Label>Animal Type *</Label>
              <select
                value={formData.animal_type}
                onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mt-1"
              >
                <option value="">Select animal type</option>
                {ANIMAL_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Breed Type *</Label>
              <Input
                value={formData.breed_type}
                onChange={(e) => setFormData({ ...formData, breed_type: e.target.value })}
                placeholder="e.g., Angus, Bonsmara, Dorper"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Pure / Cross</Label>
              <select
                value={formData.pure_cross}
                onChange={(e) => setFormData({ ...formData, pure_cross: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mt-1"
              >
                <option value="">Select</option>
                <option value="pure">Pure Breed</option>
                <option value="cross">Cross Breed</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Age & Weight</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Age (Years)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.age_years}
                  onChange={(e) => setFormData({ ...formData, age_years: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Age (Months)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.age_months}
                  onChange={(e) => setFormData({ ...formData, age_months: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Teeth / Age Description</Label>
              <Input
                value={formData.teeth_age}
                onChange={(e) => setFormData({ ...formData, teeth_age: e.target.value })}
                placeholder="e.g., 8 teeth, 2 tooth"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weight Min (kg)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.weight_min}
                  onChange={(e) => setFormData({ ...formData, weight_min: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Weight Max (kg)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.weight_max}
                  onChange={(e) => setFormData({ ...formData, weight_max: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Breeding Information</h2>

            <div>
              <Label>Pregnancy Status</Label>
              <select
                value={formData.pregnancy_status}
                onChange={(e) => setFormData({ ...formData, pregnancy_status: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mt-1"
              >
                <option value="">Select</option>
                <option value="pregnant">Pregnant</option>
                <option value="open">Open (Not Pregnant)</option>
                <option value="n/a">N/A</option>
              </select>
            </div>

            <div>
              <Label>Sire Used</Label>
              <Input
                value={formData.sire_used}
                onChange={(e) => setFormData({ ...formData, sire_used: e.target.value })}
                placeholder="e.g., Meatmaster Bull"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Price</h2>

            <div>
              <Label>Price per Animal (R) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., 18000"
                className="mt-1 text-lg font-semibold"
              />
            </div>

            {formData.quantity > 0 && formData.price && parseFloat(formData.price) > 0 && (
              <div className="bg-primary-green/5 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per head</span>
                  <span className="font-semibold">R {Number(formData.price).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-semibold">{formData.quantity} animals</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">R {(Number(formData.price) * formData.quantity).toLocaleString()}</span>
                </div>
                {formData.is_bundle && formData.bundle_discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-amber-600">
                      <span>Bundle discount ({formData.bundle_discount}%)</span>
                      <span>- R {Math.round(Number(formData.price) * formData.quantity * formData.bundle_discount / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary-green/20">
                      <span>Total Price</span>
                      <span className="text-primary-green">
                        R {Math.round(Number(formData.price) * formData.quantity * (1 - formData.bundle_discount / 100)).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
                {!formData.is_bundle && formData.quantity > 1 && (
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-primary-green/20">
                    <span>Total Price</span>
                    <span className="text-primary-green">
                      R {(Number(formData.price) * formData.quantity).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ✅ FIXED - Market Intelligence panel now always shows when data is available
                Uses province fallback so it works regardless of how specific the location is */}
            {showPriceSuggestion && marketSuggestion && (
              <div className="bg-primary-green/5 border border-primary-green/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-primary-green text-sm">Market Intelligence</h4>
                  <span className="text-xs text-gray-400">
                    {marketSuggestion.sample_size > 0
                      ? `Based on ${marketSuggestion.sample_size} listings`
                      : 'National average'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Market Range</p>
                    <p className="text-sm font-semibold">
                      R{Number(marketSuggestion.range?.min || 0).toLocaleString()} –{' '}
                      R{Number(marketSuggestion.range?.max || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Average</p>
                    <p className="text-sm font-semibold">
                      R{Number(marketSuggestion.avg || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Demand</p>
                    <p className={`text-sm font-semibold ${marketSuggestion.demand === 'high' ? 'text-green-600' :
                        marketSuggestion.demand === 'medium' ? 'text-amber-600' :
                          'text-gray-600'
                      }`}>
                      {marketSuggestion.demand === 'high' && '↑ High'}
                      {marketSuggestion.demand === 'medium' && '→ Medium'}
                      {marketSuggestion.demand === 'low' && '↓ Low'}
                      {!marketSuggestion.demand && '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    Trend:{' '}
                    {marketSuggestion.trend === 'up' && '📈 Rising'}
                    {marketSuggestion.trend === 'down' && '📉 Falling'}
                    {marketSuggestion.trend === 'stable' && '→ Stable'}
                    {!marketSuggestion.trend && '—'}
                  </span>
                  <span className="ml-auto">
                    Confidence: {Math.round((marketSuggestion.confidence || 0) * 100)}%
                  </span>
                </div>

                <div className="pt-3 border-t border-primary-green/10">
                  <p className="text-xs text-gray-600">
                    Suggested sweet spot:{' '}
                    <span className="font-semibold text-primary-green">
                      R{Number(marketSuggestion.suggested_sweet_spot?.min || 0).toLocaleString()} –{' '}
                      R{Number(marketSuggestion.suggested_sweet_spot?.max || 0).toLocaleString()}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const avg = marketSuggestion.avg || 0;
                      setFormData(prev => ({ ...prev, price: Math.round(avg).toString() }));
                    }}
                    className="mt-2 text-xs text-primary-green hover:underline font-medium"
                  >
                    Use average price →
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Health, Notes & Photos</h2>

            {message.text && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                {message.text}
              </div>
            )}

            {/* WhatsApp reminder if not filled in */}
            {!formData.whatsapp_number && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700">
                  💡 Your listing will get more enquiries with WhatsApp enabled.{' '}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="underline font-medium"
                  >
                    Add it now →
                  </button>
                </p>
              </div>
            )}

            <div>
              <Label>Health Information</Label>
              <Textarea
                value={formData.health_info}
                onChange={(e) => setFormData({ ...formData, health_info: e.target.value })}
                placeholder="Vaccinations, health status, vet checks, supplements..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any other information buyers should know..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-600 text-sm">Social Media (Optional)</Label>
              <div className="space-y-2 mt-1">
                <Input
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  placeholder="Facebook URL"
                />
                <Input
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="Instagram URL"
                />
                <Input
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="Website URL"
                />
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <Label>Photos * <span className="text-gray-400 font-normal text-xs">(at least 1 required)</span></Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 mt-1">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-white/90 rounded-full shadow"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary-green transition">
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">Add Photo</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                {uploading && (
                  <p className="text-sm text-primary-green text-center">Uploading images...</p>
                )}
                <p className="text-xs text-gray-400 text-center">Max 5MB per image. First photo is your cover photo.</p>
              </div>
            </div>

            {/* Video upload */}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
              <Video className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <p className="text-sm text-gray-400 mb-2">Upload a short video (optional)</p>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                id="videoUpload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('videoUpload').click()}
                disabled={videoUploading}
              >
                {videoUploading ? 'Uploading...' : 'Choose Video'}
              </Button>
              {formData.video_url && (
                <p className="text-green-600 text-sm mt-2 flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> Video uploaded
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-warm-white pb-20">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/hub">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">List Livestock</h1>
          <span className="ml-auto text-sm text-gray-400">Step {currentStep} of {totalSteps}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <StepIndicator />

            {renderStep()}

            <div className="flex justify-between gap-4 mt-8 pt-4 border-t">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={prevStep} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <div /> /* spacer so Next stays right-aligned on step 1 */
              )}

              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="gap-2 ml-auto bg-primary-green hover:bg-primary-green-dark text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !isStepValid()}
                  className="gap-2 ml-auto bg-primary-green hover:bg-primary-green-dark text-white"
                >
                  {submitting ? 'Publishing...' : 'Publish Listing'}
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}