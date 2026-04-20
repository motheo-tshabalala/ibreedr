import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

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

export default function SellerUpload() {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  const [listingType, setListingType] = useState('');

  // Individual form fields
  const [individualData, setIndividualData] = useState({
    name: '',
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
    location: '',
    price: '',
    health_info: '',
    notes: '',
    seller_name: '',
    seller_phone: '',
    images: [],
    video_url: '',
    facebook_url: '',
    instagram_url: '',
    whatsapp_number: '',
    website_url: ''
  });

  // Bundle form fields
  const [bundleData, setBundleData] = useState({
    bundle_name: '',
    bundle_description: '',
    quantity: '',
    price_per_head: '',
    breed_type: '',
    pure_cross: '',
    age_display: '',
    weight_display: '',
    pregnancy_status: '',
    sire_used: '',
    location: '',
    images: [],
    video_url: ''
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setIndividualData(prev => ({
          ...prev,
          seller_name: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
        }));
      } else {
        window.location.href = '/login';
      }
    };
    getUser();
  }, []);

  const handleImageUpload = async (e, isBundle = false) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      const imageUrls = [];
      for (const file of files) {
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

      if (isBundle) {
        setBundleData(prev => ({
          ...prev,
          images: [...prev.images, ...imageUrls]
        }));
      } else {
        setIndividualData(prev => ({
          ...prev,
          images: [...prev.images, ...imageUrls]
        }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload images: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e, isBundle = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file');
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

      if (isBundle) {
        setBundleData(prev => ({ ...prev, video_url: publicUrl }));
      } else {
        setIndividualData(prev => ({ ...prev, video_url: publicUrl }));
      }
      alert('Video uploaded successfully!');
    } catch (error) {
      console.error('Video upload failed:', error);
      alert('Failed to upload video: ' + error.message);
    } finally {
      setVideoUploading(false);
    }
  };

  const removeImage = (index, isBundle = false) => {
    if (isBundle) {
      setBundleData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      setIndividualData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please login first');
      window.location.href = '/login';
      return;
    }

    if (!listingType) {
      alert('Please select listing type (Individual or Bundle)');
      return;
    }

    setSubmitting(true);

    try {
      if (listingType === 'individual') {
        const submitData = {
          user_id: user.id,
          listing_type: 'individual',
          name: individualData.name,
          animal_type: individualData.animal_type,
          breed_type: individualData.breed_type,
          pure_cross: individualData.pure_cross,
          age_years: parseInt(individualData.age_years) || 0,
          age_months: parseInt(individualData.age_months) || 0,
          teeth_age: individualData.teeth_age,
          weight_min: individualData.weight_min ? parseFloat(individualData.weight_min) : null,
          weight_max: individualData.weight_max ? parseFloat(individualData.weight_max) : null,
          pregnancy_status: individualData.pregnancy_status,
          sire_used: individualData.sire_used,
          location: individualData.location,
          price: individualData.price ? parseFloat(individualData.price) : null,
          health_info: individualData.health_info,
          notes: individualData.notes,
          seller_name: individualData.seller_name,
          seller_phone: individualData.seller_phone,
          images: individualData.images,
          video_url: individualData.video_url,
          facebook_url: individualData.facebook_url,
          instagram_url: individualData.instagram_url,
          whatsapp_number: individualData.whatsapp_number,
          website_url: individualData.website_url,
          status: 'active',
          likes_count: 0,
          views_count: 0
        };

        const { error } = await supabase
          .from('livestock')
          .insert([submitData]);

        if (error) throw error;
        alert('Individual listing published successfully!');

      } else {
        const bundlePrice = bundleData.price_per_head * bundleData.quantity;

        const submitData = {
          user_id: user.id,
          listing_type: 'bundle',
          bundle_name: bundleData.bundle_name,
          bundle_description: bundleData.bundle_description,
          quantity: parseInt(bundleData.quantity),
          price_per_head: parseFloat(bundleData.price_per_head),
          bundle_price: bundlePrice,
          breed_type: bundleData.breed_type,
          pure_cross: bundleData.pure_cross,
          age_display: bundleData.age_display,
          weight_display: bundleData.weight_display,
          pregnancy_status: bundleData.pregnancy_status,
          sire_used: bundleData.sire_used,
          location: bundleData.location,
          images: bundleData.images,
          video_url: bundleData.video_url,
          status: 'active'
        };

        const { error } = await supabase
          .from('bundles')
          .insert([submitData]);

        if (error) throw error;
        alert('Bundle published successfully!');
      }

      window.location.href = '/MyListings';

    } catch (err) {
      console.error('Submit error:', err);
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (!listingType) return false;

    if (listingType === 'individual') {
      return individualData.name && individualData.animal_type && individualData.breed_type && individualData.location;
    } else {
      return bundleData.bundle_name && bundleData.quantity && bundleData.price_per_head && bundleData.location;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/Browse">
            <button className="p-2 hover:bg-stone-100 rounded-full">
              <ArrowLeft className="w-6 h-6 text-stone-800" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-stone-800">List Your Livestock</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Listing Type Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <label className="text-lg font-bold block mb-4">What are you listing?</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setListingType('individual')}
                className={`p-6 rounded-2xl border-2 transition-all ${listingType === 'individual'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-stone-200 hover:border-stone-300'
                  }`}
              >
                <div className="text-4xl mb-2">🐄</div>
                <div className="font-semibold">Individual Animal</div>
                <div className="text-sm text-stone-500">Single livestock</div>
              </button>

              <button
                type="button"
                onClick={() => setListingType('bundle')}
                className={`p-6 rounded-2xl border-2 transition-all ${listingType === 'bundle'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-stone-200 hover:border-stone-300'
                  }`}
              >
                <div className="text-4xl mb-2">📦</div>
                <div className="font-semibold">Bundle</div>
                <div className="text-sm text-stone-500">Multiple animals, one price</div>
              </button>
            </div>
          </div>

          {listingType === 'individual' && (
            <>
              {/* Images Upload */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <label className="text-lg font-bold block mb-4">Photos</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {individualData.images.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100">
                      <img src={url} alt="Upload" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(index, false)} className="absolute top-2 right-2 p-1 bg-white rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="w-8 h-8 text-stone-400 mb-2" />
                    <span className="text-sm text-stone-600">Add Photo</span>
                    <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, false)} className="hidden" disabled={uploading} />
                  </label>
                </div>
                {uploading && <p className="text-sm text-amber-600">Uploading images...</p>}
              </div>

              {/* Video Upload */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <label className="text-lg font-bold block mb-4">Video (Optional)</label>
                <div className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center">
                  <Video className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <p className="text-sm text-stone-600 mb-3">Upload a video of your livestock</p>
                  <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, false)} className="hidden" id="individualVideoUpload" />
                  <button type="button" onClick={() => document.getElementById('individualVideoUpload').click()} className="bg-stone-800 text-white rounded-full px-4 py-2 text-sm">
                    {videoUploading ? 'Uploading...' : 'Choose Video'}
                  </button>
                  {individualData.video_url && <p className="text-green-600 text-sm mt-2">✓ Video uploaded</p>}
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
                <h3 className="text-lg font-bold">Basic Information</h3>

                <div>
                  <label className="block font-semibold mb-2">Name *</label>
                  <input value={individualData.name} onChange={(e) => setIndividualData({ ...individualData, name: e.target.value })} className="w-full border-2 rounded-xl p-3" required />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Animal Type *</label>
                  <select value={individualData.animal_type} onChange={(e) => setIndividualData({ ...individualData, animal_type: e.target.value })} className="w-full border-2 rounded-xl p-3" required>
                    <option value="">Select</option>
                    {ANIMAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Breed Type *</label>
                  <input value={individualData.breed_type} onChange={(e) => setIndividualData({ ...individualData, breed_type: e.target.value })} className="w-full border-2 rounded-xl p-3" required />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Pure / Cross</label>
                  <select value={individualData.pure_cross} onChange={(e) => setIndividualData({ ...individualData, pure_cross: e.target.value })} className="w-full border-2 rounded-xl p-3">
                    <option value="">Select</option>
                    <option value="pure">Pure Breed</option>
                    <option value="cross">Cross Breed</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Age (Years)</label>
                    <input type="number" value={individualData.age_years} onChange={(e) => setIndividualData({ ...individualData, age_years: e.target.value })} className="w-full border-2 rounded-xl p-3" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Age (Months)</label>
                    <input type="number" value={individualData.age_months} onChange={(e) => setIndividualData({ ...individualData, age_months: e.target.value })} className="w-full border-2 rounded-xl p-3" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Teeth / Age Description</label>
                  <input value={individualData.teeth_age} onChange={(e) => setIndividualData({ ...individualData, teeth_age: e.target.value })} placeholder="e.g., 8 teeth" className="w-full border-2 rounded-xl p-3" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Weight Min (KG)</label>
                    <input type="number" value={individualData.weight_min} onChange={(e) => setIndividualData({ ...individualData, weight_min: e.target.value })} className="w-full border-2 rounded-xl p-3" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Weight Max (KG)</label>
                    <input type="number" value={individualData.weight_max} onChange={(e) => setIndividualData({ ...individualData, weight_max: e.target.value })} className="w-full border-2 rounded-xl p-3" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Pregnancy Status</label>
                  <select value={individualData.pregnancy_status} onChange={(e) => setIndividualData({ ...individualData, pregnancy_status: e.target.value })} className="w-full border-2 rounded-xl p-3">
                    <option value="">Select</option>
                    <option value="pregnant">Pregnant</option>
                    <option value="open">Open (Not Pregnant)</option>
                    <option value="n/a">N/A</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Sire Used</label>
                  <input value={individualData.sire_used} onChange={(e) => setIndividualData({ ...individualData, sire_used: e.target.value })} placeholder="e.g., Meatmaster Bull, Angus Bull" className="w-full border-2 rounded-xl p-3" />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Location *</label>
                  <input value={individualData.location} onChange={(e) => setIndividualData({ ...individualData, location: e.target.value })} className="w-full border-2 rounded-xl p-3" required />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Price (R)</label>
                  <input type="number" value={individualData.price} onChange={(e) => setIndividualData({ ...individualData, price: e.target.value })} className="w-full border-2 rounded-xl p-3" />
                </div>
              </div>

              {/* Health & Notes */}
              <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
                <h3 className="text-lg font-bold">Health & Additional Information</h3>
                <div>
                  <label className="block font-semibold mb-2">Health Information</label>
                  <textarea value={individualData.health_info} onChange={(e) => setIndividualData({ ...individualData, health_info: e.target.value })} rows={3} className="w-full border-2 rounded-xl p-3" />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Additional Notes</label>
                  <textarea value={individualData.notes} onChange={(e) => setIndividualData({ ...individualData, notes: e.target.value })} rows={3} className="w-full border-2 rounded-xl p-3" />
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
                <h3 className="text-lg font-bold">Contact Information</h3>
                <div>
                  <label className="block font-semibold mb-2">Your Name</label>
                  <input value={individualData.seller_name} onChange={(e) => setIndividualData({ ...individualData, seller_name: e.target.value })} className="w-full border-2 rounded-xl p-3" />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Phone Number</label>
                  <input type="tel" value={individualData.seller_phone} onChange={(e) => setIndividualData({ ...individualData, seller_phone: e.target.value })} placeholder="+27 XX XXX XXXX" className="w-full border-2 rounded-xl p-3" />
                </div>
              </div>

              {/* Social Media (Optional) */}
              <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
                <h3 className="text-lg font-bold">Social Media (Optional)</h3>
                <p className="text-sm text-stone-500 -mt-2">Share your social profiles to build trust with buyers</p>

                <div>
                  <label className="block font-semibold mb-2">Facebook Profile/Page</label>
                  <input
                    type="url"
                    value={individualData.facebook_url}
                    onChange={(e) => setIndividualData({ ...individualData, facebook_url: e.target.value })}
                    placeholder="https://facebook.com/yourfarm"
                    className="w-full border-2 rounded-xl p-3"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Instagram Profile</label>
                  <input
                    type="url"
                    value={individualData.instagram_url}
                    onChange={(e) => setIndividualData({ ...individualData, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/yourfarm"
                    className="w-full border-2 rounded-xl p-3"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={individualData.whatsapp_number}
                    onChange={(e) => setIndividualData({ ...individualData, whatsapp_number: e.target.value })}
                    placeholder="+27 XX XXX XXXX"
                    className="w-full border-2 rounded-xl p-3"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Website</label>
                  <input
                    type="url"
                    value={individualData.website_url}
                    onChange={(e) => setIndividualData({ ...individualData, website_url: e.target.value })}
                    placeholder="https://yourfarm.com"
                    className="w-full border-2 rounded-xl p-3"
                  />
                </div>
              </div>
            </>
          )}

          {listingType === 'bundle' && (
            <>
              {/* Bundle Images Upload */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <label className="text-lg font-bold block mb-4">Bundle Photos</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {bundleData.images.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100">
                      <img src={url} alt="Bundle" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(index, true)} className="absolute top-2 right-2 p-1 bg-white rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="w-8 h-8 text-stone-400 mb-2" />
                    <span className="text-sm text-stone-600">Add Photo</span>
                    <input type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Bundle Video Upload */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <label className="text-lg font-bold block mb-4">Bundle Video (Optional)</label>
                <div className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center">
                  <Video className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <input type="file" accept="video/*" onChange={(e) => handleVideoUpload(e, true)} className="hidden" id="bundleVideoUpload" />
                  <button type="button" onClick={() => document.getElementById('bundleVideoUpload').click()} className="bg-stone-800 text-white rounded-full px-4 py-2 text-sm">
                    {videoUploading ? 'Uploading...' : 'Choose Video'}
                  </button>
                  {bundleData.video_url && <p className="text-green-600 text-sm mt-2">✓ Video uploaded</p>}
                </div>
              </div>

              {/* Bundle Information */}
              <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
                <h3 className="text-lg font-bold">Bundle Information</h3>

                <div>
                  <label className="block font-semibold mb-2">Bundle Name *</label>
                  <input value={bundleData.bundle_name} onChange={(e) => setBundleData({ ...bundleData, bundle_name: e.target.value })} placeholder="e.g., 190 Kapaters" className="w-full border-2 rounded-xl p-3" required />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Description</label>
                  <textarea value={bundleData.bundle_description} onChange={(e) => setBundleData({ ...bundleData, bundle_description: e.target.value })} placeholder="Describe what's included..." rows={3} className="w-full border-2 rounded-xl p-3" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Quantity *</label>
                    <input type="number" value={bundleData.quantity} onChange={(e) => setBundleData({ ...bundleData, quantity: e.target.value })} placeholder="Number of animals" className="w-full border-2 rounded-xl p-3" required />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Price per Head (R) *</label>
                    <input type="number" value={bundleData.price_per_head} onChange={(e) => setBundleData({ ...bundleData, price_per_head: e.target.value })} placeholder="R 1,250" className="w-full border-2 rounded-xl p-3" required />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl">
                  <p className="text-sm text-stone-600">Total Bundle Price</p>
                  <p className="text-2xl font-bold text-amber-600">
                    R {(bundleData.price_per_head * bundleData.quantity).toLocaleString() || '0'}
                  </p>
                </div>

                <div className="border-t pt-4 mt-2">
                  <h4 className="font-semibold text-stone-800 mb-3">Animal Specifications</h4>

                  <div>
                    <label className="block font-semibold mb-2">Breed Type</label>
                    <input value={bundleData.breed_type} onChange={(e) => setBundleData({ ...bundleData, breed_type: e.target.value })} placeholder="e.g., Angora Goat" className="w-full border-2 rounded-xl p-3" />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Pure / Cross</label>
                    <select value={bundleData.pure_cross} onChange={(e) => setBundleData({ ...bundleData, pure_cross: e.target.value })} className="w-full border-2 rounded-xl p-3">
                      <option value="">Select</option>
                      <option value="pure">Pure Breed</option>
                      <option value="cross">Cross Breed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Age</label>
                    <input value={bundleData.age_display} onChange={(e) => setBundleData({ ...bundleData, age_display: e.target.value })} placeholder="e.g., 2tand, 8 teeth" className="w-full border-2 rounded-xl p-3" />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Weight</label>
                    <input value={bundleData.weight_display} onChange={(e) => setBundleData({ ...bundleData, weight_display: e.target.value })} placeholder="e.g., 45-50 KG" className="w-full border-2 rounded-xl p-3" />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Pregnancy Status</label>
                    <select value={bundleData.pregnancy_status} onChange={(e) => setBundleData({ ...bundleData, pregnancy_status: e.target.value })} className="w-full border-2 rounded-xl p-3">
                      <option value="">Select</option>
                      <option value="pregnant">Pregnant</option>
                      <option value="open">Open</option>
                      <option value="n/a">N/A</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Sire Used</label>
                    <input value={bundleData.sire_used} onChange={(e) => setBundleData({ ...bundleData, sire_used: e.target.value })} placeholder="e.g., Meatmaster Bull" className="w-full border-2 rounded-xl p-3" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Location *</label>
                  <input value={bundleData.location} onChange={(e) => setBundleData({ ...bundleData, location: e.target.value })} className="w-full border-2 rounded-xl p-3" required />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button type="submit" disabled={!isFormValid() || submitting} className="w-full h-14 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-lg font-semibold disabled:opacity-50">
            {submitting ? 'Publishing...' : `Publish ${listingType === 'individual' ? 'Listing' : 'Bundle'}`}
          </button>
        </form>
      </div>
    </div>
  );
}