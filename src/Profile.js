import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Building2, Phone, Mail, CheckCircle, AlertCircle, MapPin, Info, Award, Camera, Upload, Package, TrendingUp, LogOut, Shield, Trash2 } from 'lucide-react';
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
  const [deletingImage, setDeletingImage] = useState(null);
  const [profileStrength, setProfileStrength] = useState(0);
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

        const profileFields = [
          data.farm_name,
          data.phone,
          data.farm_location,
          data.farm_bio,
          data.years_farming,
          data.logo_image,
          data.cover_image
        ].filter(Boolean).length;

        const strength = Math.round((profileFields / 7) * 100);
        setProfileStrength(strength);
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

  // ✅ Image upload function
  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) {
      setMessage({ type: 'error', text: 'No file selected' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `profiles/${user.id}/${fileName}`;

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

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      const updateField = type === 'cover' ? 'cover_image' : 'logo_image';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(updateError.message);
      }

      setProfile(prev => ({
        ...prev,
        [updateField]: publicUrl
      }));

      // Recalculate profile strength
      updateProfileStrength(updateField, publicUrl);

      setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({ type: 'error', text: 'Failed to upload image: ' + error.message });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ✅ Remove image function
  const handleRemoveImage = async (type) => {
    const field = type === 'cover' ? 'cover_image' : 'logo_image';
    const currentUrl = profile[field];

    if (!currentUrl) return;

    setDeletingImage(type);
    setMessage({ type: '', text: '' });

    try {
      // Extract file path from URL
      const urlParts = currentUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('profiles')).join('/');

      // Delete from storage
      if (filePath) {
        const { error: deleteError } = await supabase.storage
          .from('profile-images')
          .remove([filePath]);

        if (deleteError) {
          console.error('Storage delete error:', deleteError);
          // Continue with profile update even if storage delete fails
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [field]: null })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(updateError.message);
      }

      setProfile(prev => ({
        ...prev,
        [field]: null
      }));

      // Recalculate profile strength
      updateProfileStrength(field, null);

      setMessage({ type: 'success', text: 'Image removed successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Remove error:', error);
      setMessage({ type: 'error', text: 'Failed to remove image: ' + error.message });
    } finally {
      setDeletingImage(null);
    }
  };

  // ✅ Update profile strength
  const updateProfileStrength = (field, value) => {
    const fields = [
      profile.farm_name,
      profile.phone,
      profile.farm_location,
      profile.farm_bio,
      profile.years_farming,
      field === 'logo_image' ? value : profile.logo_image,
      field === 'cover_image' ? value : profile.cover_image
    ].filter(Boolean).length;

    const strength = Math.round((fields / 7) * 100);
    setProfileStrength(strength);
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

            {/* Cover Image Upload with Remove Button */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700">Farm Cover Image</Label>
              <div className="relative mt-1 h-40 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-primary-green transition">
                {profile.cover_image ? (
                  <>
                    <img src={profile.cover_image} alt="Farm cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById('coverUpload').click()}
                          className="p-2 bg-white rounded-full shadow-lg hover:scale-105 transition"
                        >
                          <Camera className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('cover')}
                          disabled={deletingImage === 'cover'}
                          className="p-2 bg-red-500 rounded-full shadow-lg hover:scale-105 transition disabled:opacity-50"
                        >
                          {deletingImage === 'cover' ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
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
              <p className="text-xs text-gray-400 mt-1">Cover image appears on your farm storefront</p>
            </div>

            {/* Logo Image Upload with Remove Button */}
            <div className="mb-6 -mt-10 ml-4 relative z-10">
              <div className="relative w-20 h-20 rounded-full bg-white border-4 border-white shadow-md overflow-hidden group">
                {profile.logo_image ? (
                  <>
                    <img src={profile.logo_image} alt="Farm logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100 rounded-full">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => document.getElementById('logoUpload').click()}
                          className="p-1 bg-white rounded-full shadow-lg hover:scale-105 transition"
                        >
                          <Camera className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('logo')}
                          disabled={deletingImage === 'logo'}
                          className="p-1 bg-red-500 rounded-full shadow-lg hover:scale-105 transition disabled:opacity-50"
                        >
                          {deletingImage === 'logo' ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
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
              <p className="text-xs text-gray-400 ml-1">Logo appears on your farm card</p>
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

            {/* Profile Strength */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Profile Strength</span>
                <span className="text-sm font-semibold text-primary-green">{profileStrength}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${profileStrength >= 80 ? 'bg-green-500' :
                      profileStrength >= 50 ? 'bg-amber-500' :
                        'bg-gray-400'
                    }`}
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
              <div className="mt-2 space-y-1">
                {!profile.farm_name && (
                  <p className="text-xs text-gray-400">Add your farm name → buyers find you</p>
                )}
                {!profile.phone && (
                  <p className="text-xs text-gray-400">Add your phone number → buyers can contact you</p>
                )}
                {!profile.farm_location && (
                  <p className="text-xs text-gray-400">Add your farm location → buyers filter by province</p>
                )}
                {!profile.farm_bio && (
                  <p className="text-xs text-gray-400">Add a farm bio → tell buyers about your farm</p>
                )}
                {!profile.years_farming && (
                  <p className="text-xs text-gray-400">Add years farming → builds trust with buyers</p>
                )}
                {!profile.logo_image && (
                  <p className="text-xs text-gray-400">Add a logo → makes your farm memorable</p>
                )}
                {!profile.cover_image && (
                  <p className="text-xs text-gray-400">Add a cover image → showcases your farm</p>
                )}
              </div>
            </div>

            {/* View Dashboard Button */}
            <Link to="/Dashboard">
              <Button className="w-full gap-2 bg-primary-green hover:bg-primary-green-dark mb-6">
                <TrendingUp className="w-4 h-4" />
                View Full Dashboard
              </Button>
            </Link>

            {/* Get Verified Button */}
            {!profile.verified_farmer && (
              <Link to="/GetVerified">
                <Button className="w-full gap-2 bg-gold-accent hover:bg-gold-accent-light text-white mb-6">
                  <Shield className="w-4 h-4" />
                  Get Verified
                </Button>
              </Link>
            )}
            {profile.verified_farmer && (
              <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                <p className="text-sm text-green-700 flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  Your farm is verified ✓
                </p>
              </div>
            )}

            {/* Important Note */}
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