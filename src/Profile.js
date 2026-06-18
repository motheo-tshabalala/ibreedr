import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Building2, Phone, Mail, CheckCircle, AlertCircle, MapPin, Info, Award, Camera, Upload, Trash2, Clock, Truck } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import VerificationBadge from './components/VerificationBadge';

export default function Profile() {
  const navigate = useNavigate();
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
    logo_image: '',
    operating_hours_weekdays: '',
    operating_hours_saturday: '',
    operating_hours_sunday: '',
    transport_responsibility: 'Negotiable',
    transport_range: '',
    transport_notes: '',
    gps_latitude: '',
    gps_longitude: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingImage, setDeletingImage] = useState(null);

  // ✅ FIXED - Profile strength recalculates live as user types, no page reload needed
  const profileStrength = useMemo(() => {
    const fields = [
      profile.farm_name,
      profile.phone,
      profile.farm_location,
      profile.farm_bio,
      profile.years_farming,
      profile.logo_image,
      profile.cover_image
    ].filter(Boolean).length;
    return Math.round((fields / 7) * 100);
  }, [profile]);

  const locationInputRef = useRef(null);

  useEffect(() => {
    const loadUserAndProfile = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      // ✅ FIXED - uses navigate() instead of window.location.href
      if (!user) {
        navigate('/login');
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
          logo_image: data.logo_image || '',
          operating_hours_weekdays: data.operating_hours_weekdays || '',
          operating_hours_saturday: data.operating_hours_saturday || '',
          operating_hours_sunday: data.operating_hours_sunday || '',
          transport_responsibility: data.transport_responsibility || 'Negotiable',
          transport_range: data.transport_range || '',
          transport_notes: data.transport_notes || '',
          gps_latitude: data.gps_latitude || '',
          gps_longitude: data.gps_longitude || ''
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
          logo_image: '',
          operating_hours_weekdays: '',
          operating_hours_saturday: '',
          operating_hours_sunday: '',
          transport_responsibility: 'Negotiable',
          transport_range: '',
          transport_notes: '',
          gps_latitude: '',
          gps_longitude: ''
        });
      }

      setLoading(false);
    };

    loadUserAndProfile();
  }, [navigate]);

  // ✅ FIXED - Google Maps Autocomplete initialises after loading completes
  // with a 150ms delay to ensure DOM is committed and Google script is ready
  useEffect(() => {
    if (loading) return; // only run after profile has loaded and DOM has rendered

    const initAutocomplete = () => {
      if (!locationInputRef.current) return;
      if (typeof window.google === 'undefined') return;
      if (!window.google.maps || !window.google.maps.places) return;

      try {
        const autocomplete = new window.google.maps.places.Autocomplete(
          locationInputRef.current,
          {
            componentRestrictions: { country: 'za' },
            types: ['geocode', 'establishment'],
            fields: ['formatted_address', 'geometry', 'name']
          }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            setProfile(prev => ({
              ...prev,
              farm_location: place.formatted_address,
              gps_latitude: place.geometry?.location?.lat() || '',
              gps_longitude: place.geometry?.location?.lng() || ''
            }));
          }
        });
      } catch (error) {
        console.warn('Google Maps Autocomplete not available:', error);
      }
    };

    // Small delay ensures DOM is committed and Google Places script is fully ready
    const timer = setTimeout(initAutocomplete, 150);
    return () => clearTimeout(timer);
  }, [loading]);

  // Cover image upload
  const handleCoverUpload = async (e) => {
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

    setUploadingCover(true);
    setMessage({ type: '', text: '' });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_cover_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_image: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, cover_image: publicUrl }));
      setMessage({ type: 'success', text: 'Cover image uploaded!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Cover upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload cover: ' + error.message });
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  // Logo upload
  const handleLogoUpload = async (e) => {
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

    setUploadingLogo(true);
    setMessage({ type: '', text: '' });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_logo_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_image: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, logo_image: publicUrl }));
      setMessage({ type: 'success', text: 'Logo uploaded!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Logo upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload logo: ' + error.message });
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  // ✅ FIXED - Remove image uses correct path extraction via split on bucket name
  const handleRemoveImage = async (type) => {
    const field = type === 'cover' ? 'cover_image' : 'logo_image';
    const currentUrl = profile[field];

    if (!currentUrl) return;

    setDeletingImage(type);
    setMessage({ type: '', text: '' });

    try {
      // Correctly extract storage path by splitting on bucket name
      const urlParts = currentUrl.split('/profile-images/');
      const filePath = urlParts[1];

      if (filePath) {
        const { error: deleteError } = await supabase.storage
          .from('profile-images')
          .remove([filePath]);

        if (deleteError) {
          console.error('Storage delete error:', deleteError);
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [field]: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, [field]: null }));
      setMessage({ type: 'success', text: 'Image removed!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error('Remove error:', error);
      setMessage({ type: 'error', text: 'Failed to remove image: ' + error.message });
    } finally {
      setDeletingImage(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Re-fetch image URLs before saving to prevent overwriting uploaded images
      const { data: freshImages } = await supabase
        .from('profiles')
        .select('cover_image, logo_image')
        .eq('id', user.id)
        .single();

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      const profileData = {
        full_name: profile.full_name,
        farm_name: profile.farm_name,
        farm_bio: profile.farm_bio,
        farm_location: profile.farm_location,
        years_farming: profile.years_farming ? parseInt(profile.years_farming) : null,
        phone: profile.phone,
        cover_image: freshImages?.cover_image || profile.cover_image,
        logo_image: freshImages?.logo_image || profile.logo_image,
        gps_latitude: profile.gps_latitude || null,
        gps_longitude: profile.gps_longitude || null,
        operating_hours_weekdays: profile.operating_hours_weekdays,
        operating_hours_saturday: profile.operating_hours_saturday,
        operating_hours_sunday: profile.operating_hours_sunday,
        transport_responsibility: profile.transport_responsibility,
        transport_range: profile.transport_range,
        transport_notes: profile.transport_notes,
        updated_at: new Date()
      };

      let profileError;
      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
        profileError = error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: profile.email,
            ...profileData
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

      // Update farm_name on all existing listings
      await supabase
        .from('livestock')
        .update({ farm_name: profile.farm_name })
        .eq('user_id', user.id);

      // ✅ FIXED - no window.location.reload(), useMemo keeps profile strength live
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

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
      {/* Header — ✅ FIXED back button goes to /hub not /farms */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/hub">
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

            {/* Message banner */}
            {message.text && (
              <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
                }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            {/* ✅ Cover Image Upload — htmlFor="coverUpload" fixes the click target */}
            <div className="mb-6">
              <Label className="text-sm font-medium text-gray-700">Farm Cover Image</Label>
              <div className="relative mt-1 h-40 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-primary-green transition">
                {profile.cover_image ? (
                  <>
                    <img
                      src={profile.cover_image}
                      alt="Farm cover"
                      className="w-full h-full object-cover"
                    />
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
                  <label
                    htmlFor="coverUpload"
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-400">Upload cover image</span>
                    <span className="text-xs text-gray-300">Recommended: 1200 x 400px</span>
                  </label>
                )}
                <input
                  id="coverUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={uploadingCover}
                />
                {uploadingCover && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-green border-t-transparent" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Cover image appears on your farm storefront</p>
            </div>

            {/* Logo Image Upload */}
            <div className="mb-6 -mt-10 ml-4 relative z-10">
              <div className="relative w-20 h-20 rounded-full bg-white border-4 border-white shadow-md overflow-hidden group">
                {profile.logo_image ? (
                  <>
                    <img
                      src={profile.logo_image}
                      alt="Farm logo"
                      className="w-full h-full object-cover"
                    />
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
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </div>
              <p className="text-xs text-gray-400 ml-1">Logo appears on your farm card</p>
            </div>

            {/* Profile Strength — updates live as you type */}
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

              {/* ✅ FIXED - Farm Location with Google Maps Autocomplete
                  - Changed defaultValue to value so saved location loads correctly
                  - Ref attached for Places Autocomplete to bind to
                  - Autocomplete initialises after 150ms delay in useEffect above */}
              <div>
                <Label htmlFor="farmLocation" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-green" />
                  Farm Location
                </Label>
                <input
                  ref={locationInputRef}
                  id="farmLocation"
                  type="text"
                  value={profile.farm_location}
                  onChange={(e) => setProfile({ ...profile, farm_location: e.target.value })}
                  placeholder="Start typing your farm location..."
                  className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-green focus:ring-1 focus:ring-primary-green outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Start typing and select from Google Maps suggestions
                </p>
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

              {/* Operating Hours */}
              <div className="space-y-3 pt-3 border-t">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-green" />
                  Operating Hours
                </h3>
                <div>
                  <Label>Weekdays</Label>
                  <Input
                    value={profile.operating_hours_weekdays || ''}
                    onChange={(e) => setProfile({ ...profile, operating_hours_weekdays: e.target.value })}
                    placeholder="e.g., 8:00 AM - 5:00 PM"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Saturday</Label>
                  <Input
                    value={profile.operating_hours_saturday || ''}
                    onChange={(e) => setProfile({ ...profile, operating_hours_saturday: e.target.value })}
                    placeholder="e.g., 8:00 AM - 1:00 PM"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Sunday</Label>
                  <Input
                    value={profile.operating_hours_sunday || ''}
                    onChange={(e) => setProfile({ ...profile, operating_hours_sunday: e.target.value })}
                    placeholder="e.g., Closed"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Transport */}
              <div className="space-y-3 pt-3 border-t">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary-green" />
                  Transport
                </h3>
                <div>
                  <Label>Transport Responsibility</Label>
                  <select
                    value={profile.transport_responsibility || 'Negotiable'}
                    onChange={(e) => setProfile({ ...profile, transport_responsibility: e.target.value })}
                    className="w-full mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="Buyer">Buyer Arranges</option>
                    <option value="Seller">Seller Arranges</option>
                    <option value="Negotiable">Negotiable</option>
                  </select>
                </div>
                <div>
                  <Label>Delivery Range</Label>
                  <Input
                    value={profile.transport_range || ''}
                    onChange={(e) => setProfile({ ...profile, transport_range: e.target.value })}
                    placeholder="e.g., 50km, Nationwide"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Transport Notes</Label>
                  <Textarea
                    value={profile.transport_notes || ''}
                    onChange={(e) => setProfile({ ...profile, transport_notes: e.target.value })}
                    placeholder="Any additional transport information..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Email — read only */}
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
                className="w-full gap-2 bg-primary-green hover:bg-primary-green-dark text-white"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
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

          </CardContent>
        </Card>
      </div>
    </div>
  );
}