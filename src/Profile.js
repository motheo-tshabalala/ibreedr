import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Building2, Phone, Mail, CheckCircle, AlertCircle, MapPin, Info, Award, Camera, Upload, Package, TrendingUp, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/Badge";
import VerificationBadge from './components/VerificationBadge';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '',
    farm_name: '',
    farm_bio: '',
    farm_location: '',
    years_farming: '',
    phone: '',
    email: '',
    verified_farmer: false,
    cover_image: '',
    logo_image: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    total_listings: 0,
    active_listings: 0,
    total_animals: 0,
    bundles_count: 0
  });

  useEffect(() => {
    const loadUserAndProfile = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login';
        return;
      }

      setUser(user);
      setProfile(prev => ({ ...prev, email: user.email }));

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setProfile({
          full_name: data.full_name || user.user_metadata?.full_name || '',
          farm_name: data.farm_name || user.user_metadata?.farm_name || '',
          farm_bio: data.farm_bio || '',
          farm_location: data.farm_location || '',
          years_farming: data.years_farming || '',
          phone: data.phone || '',
          email: user.email,
          verified_farmer: data.verified_farmer || false,
          cover_image: data.cover_image || '',
          logo_image: data.logo_image || ''
        });
      } else {
        setProfile({
          full_name: user.user_metadata?.full_name || '',
          farm_name: user.user_metadata?.farm_name || '',
          farm_bio: '',
          farm_location: '',
          years_farming: '',
          phone: '',
          email: user.email,
          verified_farmer: false,
          cover_image: '',
          logo_image: ''
        });
      }

      const { data: livestockData } = await supabase
        .from('livestock')
        .select('id, status, quantity, is_bundle')
        .eq('user_id', user.id);

      if (livestockData) {
        const activeListings = livestockData.filter(l => l.status === 'active').length;
        const totalAnimals = livestockData.reduce((sum, l) => sum + (l.quantity || 1), 0);
        const bundlesCount = livestockData.filter(l => l.is_bundle === true).length;

        setStats({
          total_listings: livestockData.length,
          active_listings: activeListings,
          total_animals: totalAnimals,
          bundles_count: bundlesCount
        });
      }

      setLoading(false);
    };

    loadUserAndProfile();
  }, []);

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading to:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Update profile with new image URL
      const updateField = type === 'cover' ? 'cover_image' : 'logo_image';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(updateError.message);
      }

      // Update local state
      setProfile(prev => ({
        ...prev,
        [updateField]: publicUrl
      }));

      setMessage({ type: 'success', text: 'Image uploaded successfully!' });

    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to upload image' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      let profileError;
      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: profile.full_name,
            farm_name: profile.farm_name,
            farm_bio: profile.farm_bio,
            farm_location: profile.farm_location,
            years_farming: profile.years_farming ? parseInt(profile.years_farming) : null,
            phone: profile.phone,
            cover_image: profile.cover_image,
            logo_image: profile.logo_image,
            updated_at: new Date()
          })
          .eq('id', user.id);
        profileError = error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: profile.full_name,
            farm_name: profile.farm_name,
            farm_bio: profile.farm_bio,
            farm_location: profile.farm_location,
            years_farming: profile.years_farming ? parseInt(profile.years_farming) : null,
            phone: profile.phone,
            email: profile.email,
            cover_image: profile.cover_image,
            logo_image: profile.logo_image
          });
        profileError = error;
      }

      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          farm_name: profile.farm_name
        }
      });

      if (metadataError) throw metadataError;

      const { error: livestockError } = await supabase
        .from('livestock')
        .update({ farm_name: profile.farm_name })
        .eq('user_id', user.id);

      if (livestockError) console.error('Error updating livestock:', livestockError);

      setMessage({ type: 'success', text: 'Profile updated successfully! All your listings have been updated.' });

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/farms">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Farm Profile</h1>
          {profile.verified_farmer && (
            <div className="ml-auto">
              <VerificationBadge level="farm" size="md" />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            {/* Message */}
            {message.text && (
              <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
                }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            {/* Cover Image Upload */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700">Farm Cover Image</Label>
              <div className="relative mt-1 h-40 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-primary-green transition">
                {profile.cover_image ? (
                  <>
                    <img src={profile.cover_image} alt="Farm cover" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => document.getElementById('coverUpload').click()}
                      className="absolute bottom-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-white transition"
                    >
                      <Camera className="w-4 h-4 text-gray-700" />
                    </button>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-400">Upload cover image</span>
                    <span className="text-xs text-gray-300">Recommended: 1200 x 400px</span>
                  </label>
                )}
                <input
                  id="coverUpload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'cover')}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-green border-t-transparent" />
                  </div>
                )}
              </div>
            </div>

            {/* Logo Image Upload */}
            <div className="mb-6 -mt-10 ml-4 relative z-10">
              <div className="relative w-20 h-20 rounded-full bg-white border-4 border-white shadow-md overflow-hidden">
                {profile.logo_image ? (
                  <img src={profile.logo_image} alt="Farm logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-primary-green/10 text-primary-green">
                    {profile.farm_name?.charAt(0) || 'F'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => document.getElementById('logoUpload').click()}
                  className="absolute bottom-0 right-0 p-1 bg-primary-green rounded-full"
                >
                  <Camera className="w-3 h-3 text-white" />
                </button>
                <input
                  id="logoUpload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mt-2 mb-6">
              <div className="bg-primary-green/5 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary-green">{stats.active_listings}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.total_animals}</p>
                <p className="text-xs text-gray-500">Animals</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.bundles_count}</p>
                <p className="text-xs text-gray-500">Bundles</p>
              </div>
            </div>

            {/* View Dashboard Button */}
            <Link to="/Dashboard">
              <Button className="w-full gap-2 bg-primary-green hover:bg-primary-green-dark mb-6">
                <TrendingUp className="w-4 h-4" />
                View Full Dashboard
              </Button>
            </Link>

            {/* Important Note about Farm Name */}
            <div className="mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Your <strong>Farm/Business Name</strong> appears on all your current and future listings.
                Changing it will update all your existing listings automatically.
              </p>
            </div>

            <div className="space-y-5">
              {/* Farm Name */}
              <div>
                <Label htmlFor="farmName" className="flex items-center gap-2 text-base font-semibold">
                  <Building2 className="w-4 h-4 text-primary-green" />
                  Farm/Business Name *
                </Label>
                <Input
                  id="farmName"
                  type="text"
                  value={profile.farm_name}
                  onChange={(e) => setProfile({ ...profile, farm_name: e.target.value })}
                  placeholder="e.g., Green Valley Farm"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This name appears on all your livestock listings
                </p>
              </div>

              {/* Farm Location */}
              <div>
                <Label htmlFor="farmLocation" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-green" />
                  Farm Location
                </Label>
                <Input
                  id="farmLocation"
                  type="text"
                  value={profile.farm_location}
                  onChange={(e) => setProfile({ ...profile, farm_location: e.target.value })}
                  placeholder="e.g., Mpumalanga, South Africa"
                  className="mt-1"
                />
              </div>

              {/* Farm Bio */}
              <div>
                <Label htmlFor="farmBio" className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary-green" />
                  Farm Bio
                </Label>
                <Textarea
                  id="farmBio"
                  value={profile.farm_bio}
                  onChange={(e) => setProfile({ ...profile, farm_bio: e.target.value })}
                  placeholder="Tell buyers about your farm, your practices, and what makes your livestock special..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Years Farming */}
              <div>
                <Label htmlFor="yearsFarming" className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary-green" />
                  Years of Farming Experience
                </Label>
                <Input
                  id="yearsFarming"
                  type="number"
                  value={profile.years_farming}
                  onChange={(e) => setProfile({ ...profile, years_farming: e.target.value })}
                  placeholder="e.g., 10"
                  className="mt-1"
                />
              </div>

              {/* Full Name */}
              <div>
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-green" />
                  Contact Person Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Your name"
                  className="mt-1"
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary-green" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+27 XX XXX XXXX"
                  className="mt-1"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary-green" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="mt-1 bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving || !profile.farm_name}
                className="w-full gap-2 bg-primary-green hover:bg-primary-green-dark"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Farm Profile
                  </>
                )}
              </Button>
            </div>

            {/* Logout & Delete Account */}
            <div className="mt-4 pt-4 border-t space-y-3">
              <Link to="/logout">
                <Button variant="outline" className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </Link>
              <div className="text-center">
                <Link to="/DeleteProfile" className="text-sm text-red-400 hover:text-red-600 hover:underline">
                  Delete Account
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}