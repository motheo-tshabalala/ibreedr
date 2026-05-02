import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Video, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function EditListing() {
  const urlParams = new URLSearchParams(window.location.search);
  const listingId = urlParams.get('id');
  const listingType = urlParams.get('type');
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);
      loadListing();
    };
    getUser();
  }, []);

  const loadListing = async () => {
    setIsLoading(true);

    const table = listingType === 'bundle' ? 'bundles' : 'livestock';
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) {
      console.error('Error loading listing:', error);
      alert('Failed to load listing');
      navigate('/MyListings');
    } else {
      setFormData(data);
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
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload images: ' + error.message);
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

    try {
      const table = listingType === 'bundle' ? 'bundles' : 'livestock';
      const { error } = await supabase
        .from(table)
        .update({
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
          location: formData.location,
          price: formData.price ? parseFloat(formData.price) : null,
          health_info: formData.health_info,
          notes: formData.notes,
          seller_name: formData.seller_name,
          seller_phone: formData.seller_phone,
          images: formData.images,
          video_url: formData.video_url,
          facebook_url: formData.facebook_url,
          instagram_url: formData.instagram_url,
          whatsapp_number: formData.whatsapp_number,
          website_url: formData.website_url
        })
        .eq('id', listingId);

      if (error) throw error;
      alert('Listing updated successfully!');
      navigate('/MyListings');
    } catch (err) {
      console.error('Update error:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/MyListings">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Edit Listing</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Section */}
          <div className="bg-card rounded-xl border p-6">
            <label className="text-lg font-bold block mb-4">Photos</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {formData.images.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={url} alt="Upload" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 p-1 bg-background/80 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Add Photo</span>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="text-lg font-bold">Basic Information</h3>

            <div>
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1" required />
            </div>

            <div>
              <Label>Animal Type *</Label>
              <select value={formData.animal_type} onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" required>
                <option value="">Select</option>
                {ANIMAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <Label>Breed Type *</Label>
              <Input value={formData.breed_type} onChange={(e) => setFormData({ ...formData, breed_type: e.target.value })} className="mt-1" required />
            </div>

            <div>
              <Label>Pure / Cross</Label>
              <select value={formData.pure_cross} onChange={(e) => setFormData({ ...formData, pure_cross: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                <option value="">Select</option>
                <option value="pure">Pure Breed</option>
                <option value="cross">Cross Breed</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Age (Years)</Label>
                <Input type="number" value={formData.age_years} onChange={(e) => setFormData({ ...formData, age_years: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Age (Months)</Label>
                <Input type="number" value={formData.age_months} onChange={(e) => setFormData({ ...formData, age_months: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Teeth / Age Description</Label>
              <Input value={formData.teeth_age} onChange={(e) => setFormData({ ...formData, teeth_age: e.target.value })} placeholder="e.g., 8 teeth" className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weight Min (KG)</Label>
                <Input type="number" value={formData.weight_min} onChange={(e) => setFormData({ ...formData, weight_min: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Weight Max (KG)</Label>
                <Input type="number" value={formData.weight_max} onChange={(e) => setFormData({ ...formData, weight_max: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Pregnancy Status</Label>
              <select value={formData.pregnancy_status} onChange={(e) => setFormData({ ...formData, pregnancy_status: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                <option value="">Select</option>
                <option value="pregnant">Pregnant</option>
                <option value="open">Open (Not Pregnant)</option>
                <option value="n/a">N/A</option>
              </select>
            </div>

            <div>
              <Label>Sire Used</Label>
              <Input value={formData.sire_used} onChange={(e) => setFormData({ ...formData, sire_used: e.target.value })} placeholder="e.g., Meatmaster Bull" className="mt-1" />
            </div>

            <div>
              <Label>Location *</Label>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="mt-1" required />
            </div>

            <div>
              <Label>Price (R)</Label>
              <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="mt-1" />
            </div>
          </div>

          {/* Health & Notes */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="text-lg font-bold">Health & Additional Information</h3>
            <div>
              <Label>Health Information</Label>
              <Textarea value={formData.health_info} onChange={(e) => setFormData({ ...formData, health_info: e.target.value })} rows={3} className="mt-1" />
            </div>
            <div>
              <Label>Additional Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="mt-1" />
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="text-lg font-bold">Contact Information</h3>
            <div>
              <Label>Your Name</Label>
              <Input value={formData.seller_name} onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input type="tel" value={formData.seller_phone} onChange={(e) => setFormData({ ...formData, seller_phone: e.target.value })} className="mt-1" />
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSaving} className="w-full gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  );
}