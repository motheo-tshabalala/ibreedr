import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Eye } from 'lucide-react';
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

function SimpleCard({ livestock }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="h-96 bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center">
        {livestock.images && livestock.images[0] ? (
          <img src={livestock.images[0]} alt={livestock.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl">🐄</span>
        )}
      </div>
      <div className="p-4">
        <h2 className="text-xl font-bold">{livestock.name || 'Livestock Name'}</h2>
        <p className="text-amber-600 font-semibold">R{livestock.price ? Number(livestock.price).toLocaleString() : '0'}</p>
        <p className="text-stone-600">{livestock.animal_type || 'Type'} • {livestock.breed_type || 'Breed'}</p>
        <p className="text-stone-500 text-sm">{livestock.location || 'Location'}</p>
      </div>
    </div>
  );
}

export default function SellerUpload() {
  const [user, setUser] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    animal_type: '',
    breed_type: '',
    age_years: '',
    age_months: '',
    gender: '',
    weight: '',
    size_height: '',
    fertility_status: '',
    health_condition: '',
    location: '',
    price: '',
    health_info: '',
    notes: '',
    seller_name: '',
    seller_phone: '',
    images: []
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFormData(prev => ({
          ...prev,
          seller_name: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
        }));
      } else {
        window.location.href = '/login';
      }
    };
    getUser();
  }, []);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      const imageUrls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `livestock/${user?.id}/${fileName}`;

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
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload images: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please login first');
      window.location.href = '/login';
      return;
    }

    setSubmitting(true);

    try {
      const submitData = {
        user_id: user.id,
        name: formData.name,
        animal_type: formData.animal_type,
        breed_type: formData.breed_type,
        age_years: parseInt(formData.age_years) || 0,
        age_months: parseInt(formData.age_months) || 0,
        gender: formData.gender || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        size_height: formData.size_height || null,
        fertility_status: formData.fertility_status || null,
        health_condition: formData.health_condition || null,
        location: formData.location,
        price: formData.price ? parseFloat(formData.price) : null,
        health_info: formData.health_info || null,
        notes: formData.notes || null,
        seller_name: formData.seller_name,
        seller_phone: formData.seller_phone || null,
        images: formData.images,
        status: 'active',
        likes_count: 0
      };

      const { error } = await supabase
        .from('livestock')
        .insert([submitData]);

      if (error) {
        console.error('Supabase error:', error);
        alert('Error: ' + error.message);
      } else {
        alert('Listing published successfully!');
        window.location.href = '/MyListings';
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.name && formData.animal_type && formData.breed_type && formData.location;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/Browse">
              <button className="p-2 hover:bg-stone-100 rounded-full">
                <ArrowLeft className="w-6 h-6 text-stone-800" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-stone-800">List Your Livestock</h1>
          </div>
          <button onClick={() => setShowPreview(!showPreview)} className="rounded-full px-4 py-2 border-2 border-stone-300 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {showPreview ? (
          <div className="space-y-6">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold">Preview</h3>
              <p className="text-sm text-stone-600">How buyers will see your listing</p>
            </div>
            <div className="max-w-md mx-auto">
              <SimpleCard livestock={formData} />
            </div>
            <div className="flex justify-center">
              <button onClick={() => setShowPreview(false)} className="bg-stone-800 text-white rounded-full px-8 py-2">
                Back to Form
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <label className="text-lg font-bold block mb-4">Photos</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100">
                    <img src={url} alt="Upload" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 p-1 bg-white rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="w-8 h-8 text-stone-400 mb-2" />
                  <span className="text-sm text-stone-600">Add Photo</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
              {uploading && <p className="text-sm text-amber-600">Uploading...</p>}
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
              <h3 className="text-lg font-bold">Basic Information</h3>

              <div>
                <label className="block font-semibold mb-2">Name *</label>
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Bessie" className="w-full border-2 rounded-xl p-3" required />
              </div>

              <div>
                <label className="block font-semibold mb-2">Animal Type *</label>
                <select value={formData.animal_type} onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })} className="w-full border-2 rounded-xl p-3" required>
                  <option value="">Select</option>
                  {ANIMAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Breed Type *</label>
                <input value={formData.breed_type} onChange={(e) => setFormData({ ...formData, breed_type: e.target.value })} placeholder="e.g., Angus" className="w-full border-2 rounded-xl p-3" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Age (Years)</label>
                  <input type="number" value={formData.age_years} onChange={(e) => setFormData({ ...formData, age_years: e.target.value })} className="w-full border-2 rounded-xl p-3" />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Age (Months)</label>
                  <input type="number" value={formData.age_months} onChange={(e) => setFormData({ ...formData, age_months: e.target.value })} className="w-full border-2 rounded-xl p-3" />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Gender</label>
                <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full border-2 rounded-xl p-3">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-2">Location *</label>
                <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="City or province" className="w-full border-2 rounded-xl p-3" required />
              </div>

              <div>
                <label className="block font-semibold mb-2">Price (R)</label>
                <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="Optional" className="w-full border-2 rounded-xl p-3" />
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
              <h3 className="text-lg font-bold">Contact Information</h3>

              <div>
                <label className="block font-semibold mb-2">Your Name</label>
                <input value={formData.seller_name} onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })} placeholder="Your name" className="w-full border-2 rounded-xl p-3" />
              </div>

              <div>
                <label className="block font-semibold mb-2">Phone Number</label>
                <input type="tel" value={formData.seller_phone} onChange={(e) => setFormData({ ...formData, seller_phone: e.target.value })} placeholder="+27 XX XXX XXXX" className="w-full border-2 rounded-xl p-3" />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={!isFormValid() || submitting} className="w-full h-14 bg-stone-800 hover:bg-stone-900 text-white rounded-2xl text-lg font-semibold disabled:opacity-50">
              {submitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}