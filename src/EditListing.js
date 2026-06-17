import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, Video, Save, Package, Percent, Users } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/Badge";

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

export default function EditListing() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const listingId = urlParams.get('id');

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    farm_name: '',
    seller_name: '',
    seller_phone: '',
    location: '',
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
    price: '',
    quantity: 1,
    is_bundle: false,
    bundle_discount: 0,
    health_info: '',
    notes: '',
    images: [],
    video_url: '',
    facebook_url: '',
    instagram_url: '',
    whatsapp_number: '',
    website_url: '',
    gps_latitude: '',
    gps_longitude: ''
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      loadListing(user.id);
    };
    getUser();
  }, [navigate]);

  const loadListing = async (userId) => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('livestock')
      .select('*')
      .eq('id', listingId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error loading listing:', error);
      setMessage({ type: 'error', text: 'Failed to load listing' });
      setTimeout(() => navigate('/MyListings'), 1500);
    } else {
      setFormData({
        farm_name: data.farm_name || '',
        seller_name: data.seller_name || '',
        seller_phone: data.seller_phone || '',
        location: data.location || '',
        name: data.name || '',
        animal_type: data.animal_type || '',
        breed_type: data.breed_type || '',
        pure_cross: data.pure_cross || '',
        age_years: data.age_years || '',
        age_months: data.age_months || '',
        teeth_age: data.teeth_age || '',
        weight_min: data.weight_min || '',
        weight_max: data.weight_max || '',
        pregnancy_status: data.pregnancy_status || '',
        sire_used: data.sire_used || '',
        price: data.price || '',
        quantity: data.quantity || 1,
        is_bundle: data.is_bundle || false,
        bundle_discount: data.bundle_discount || 0,
        health_info: data.health_info || '',
        notes: data.notes || '',
        images: data.images || [],
        video_url: data.video_url || '',
        facebook_url: data.facebook_url || '',
        instagram_url: data.instagram_url || '',
        whatsapp_number: data.whatsapp_number || '',
        website_url: data.website_url || '',
        gps_latitude: data.gps_latitude || '',
        gps_longitude: data.gps_longitude || ''
      });
    }
    setIsLoading(false);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

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

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
      setMessage({ type: 'success', text: 'Images uploaded successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({ type: 'error', text: 'Failed to upload images: ' + error.message });
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
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // ✅ REMOVED total_price from updateData - DB trigger handles it
      const updateData = {
        farm_name: formData.farm_name,
        seller_name: formData.seller_name,
        seller_phone: formData.seller_phone,
        location: formData.location,
        name: formData.name,
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
        price: formData.price ? parseFloat(formData.price) : null,
        quantity: parseInt(formData.quantity) || 1,
        is_bundle: formData.is_bundle || false,
        bundle_discount: formData.bundle_discount || 0,
        health_info: formData.health_info,
        notes: formData.notes,
        images: formData.images,
        video_url: formData.video_url,
        facebook_url: formData.facebook_url,
        instagram_url: formData.instagram_url,
        whatsapp_number: formData.whatsapp_number,
        website_url: formData.website_url,
        gps_latitude: formData.gps_latitude ? parseFloat(formData.gps_latitude) : null,
        gps_longitude: formData.gps_longitude ? parseFloat(formData.gps_longitude) : null
      };

      const { error } = await supabase
        .from('livestock')
        .update(updateData)
        .eq('id', listingId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Listing updated successfully!' });
      setTimeout(() => {
        navigate('/MyListings');
      }, 1500);

    } catch (err) {
      console.error('Update error:', err);
      setMessage({ type: 'error', text: 'Error: ' + err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate price display
  const quantity = parseInt(formData.quantity) || 1;
  const pricePerHead = parseFloat(formData.price) || 0;
  const isBundle = formData.is_bundle || false;
  const discount = parseFloat(formData.bundle_discount) || 0;
  const totalPrice = isBundle
    ? pricePerHead * quantity * (1 - discount / 100)
    : pricePerHead * quantity;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white pb-20">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/MyListings">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Edit Listing</h1>
          {isBundle && (
            <Badge className="ml-auto bg-amber-500 text-white">Bundle</Badge>
          )}
          {quantity > 1 && !isBundle && (
            <Badge className="ml-auto bg-blue-500 text-white">{quantity} animals</Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ✅ Inline message replaces alert() */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Farm Information */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="text-lg font-bold text-primary-green">Farm Information</h3>

            <div>
              <Label>Farm/Business Name</Label>
              <Input
                value={formData.farm_name}
                onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Contact Name</Label>
              <Input
                value={formData.seller_name}
                onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                value={formData.seller_phone}
                onChange={(e) => setFormData({ ...formData, seller_phone: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Photos Section */}
          <div className="bg-white rounded-xl border p-6">
            <label className="text-lg font-bold block mb-4">Photos</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {formData.images.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={url} alt="Upload" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 p-1 bg-white/80 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary-green transition">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-400">Add Photo</span>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Quantity & Bundle Section */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="text-lg font-bold text-primary-green">Quantity & Pricing</h3>

            <div>
              <Label>Number of Animals</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
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
                className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_bundle ? 'bg-primary-green' : 'bg-gray-300'
                  }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_bundle ? 'translate-x-7' : 'translate-x-1'
                  }`} />
              </button>
            </div>

            {isBundle && (
              <div>
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
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label>Price per Animal (R)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="mt-1"
              />
            </div>

            {quantity > 0 && pricePerHead > 0 && (
              <div className="bg-primary-green/5 rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per head</span>
                  <span className="font-semibold">R {pricePerHead.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-semibold">{quantity} animals</span>
                </div>
                {isBundle && discount > 0 && (
                  <div className="flex justify-between text-sm mt-1 text-amber-600">
                    <span>Bundle discount ({discount}%)</span>
                    <span>- R {Math.round((pricePerHead * quantity * discount) / 100).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-primary-green/20">
                  <span>Total Price</span>
                  <span className="text-primary-green">R {Math.round(totalPrice).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="text-lg font-bold text-primary-green">Basic Information</h3>

            <div>
              <Label>Animal Name (Optional)</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Leave blank to use breed + quantity"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Animal Type *</Label>
              <select
                value={formData.animal_type}
                onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mt-1"
                required
              >
                <option value="">Select</option>
                {ANIMAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <Label>Breed Type *</Label>
              <Input
                value={formData.breed_type}
                onChange={(e) => setFormData({ ...formData, breed_type: e.target.value })}
                className="mt-1"
                required
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Age (Years)</Label>
                <Input
                  type="number"
                  value={formData.age_years}
                  onChange={(e) => setFormData({ ...formData, age_years: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Age (Months)</Label>
                <Input
                  type="number"
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
                placeholder="e.g., 8 teeth"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weight Min (KG)</Label>
                <Input
                  type="number"
                  value={formData.weight_min}
                  onChange={(e) => setFormData({ ...formData, weight_min: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Weight Max (KG)</Label>
                <Input
                  type="number"
                  value={formData.weight_max}
                  onChange={(e) => setFormData({ ...formData, weight_max: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

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

          {/* Health & Notes */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="text-lg font-bold text-primary-green">Health & Additional Information</h3>

            <div>
              <Label>Health Information</Label>
              <Textarea
                value={formData.health_info}
                onChange={(e) => setFormData({ ...formData, health_info: e.target.value })}
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="text-lg font-bold text-primary-green">Social Media (Optional)</h3>

            <div>
              <Label>Facebook</Label>
              <Input
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                placeholder="https://facebook.com/yourfarm"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Instagram</Label>
              <Input
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/yourfarm"
                className="mt-1"
              />
            </div>

            <div>
              <Label>WhatsApp</Label>
              <Input
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="+27 XX XXX XXXX"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Website</Label>
              <Input
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://yourfarm.com"
                className="mt-1"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full gap-2 bg-primary-green hover:bg-primary-green-dark"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  );
}