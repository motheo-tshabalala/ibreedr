import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Upload, X, Video, ChevronRight, ChevronLeft, Check, TrendingUp, MapPin, Crosshair } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { LoadScript } from "@react-google-maps/api";

const ANIMAL_TYPES = [
  { value: 'cattle', label: 'Cattle' }, { value: 'goats', label: 'Goats' }, { value: 'sheep', label: 'Sheep' },
  { value: 'pigs', label: 'Pigs' }, { value: 'chickens', label: 'Chickens' }, { value: 'horses', label: 'Horses' },
  { value: 'donkeys', label: 'Donkeys' }, { value: 'rabbits', label: 'Rabbits' }
];

function PlacesAutocomplete({ onPlaceSelect, placeholder }) {
  const { ready, value, suggestions: { status, data }, setValue, clearSuggestions } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: "za" } }, debounce: 300,
  });
  const handleSelect = async (address) => {
    setValue(address, false); clearSuggestions();
    try { const results = await getGeocode({ address }); const { lat, lng } = await getLatLng(results[0]); onPlaceSelect(address, lat, lng); }
    catch (error) { console.error("Error: ", error); }
  };
  return (
    <div className="relative">
      <input value={value} onChange={(e) => setValue(e.target.value)} disabled={!ready} placeholder={placeholder} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      {status === "OK" && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {data.map((suggestion) => <li key={suggestion.place_id} onClick={() => handleSelect(suggestion.description)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">{suggestion.description}</li>)}
        </ul>
      )}
    </div>
  );
}

export default function SellerUpload() {
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [listingType, setListingType] = useState('');
  const [marketSuggestion, setMarketSuggestion] = useState(null);
  const [showPriceSuggestion, setShowPriceSuggestion] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  const [formData, setFormData] = useState({
    animal_type: '', breed_type: '', pure_cross: '', age_years: '', age_months: '', teeth_age: '',
    weight_min: '', weight_max: '', pregnancy_status: '', sire_used: '', location: '', price: '',
    transport_responsibility: 'buyer',
    health_info: '', notes: '', seller_name: '', seller_phone: '', images: [], video_url: '',
    facebook_url: '', instagram_url: '', whatsapp_number: '', website_url: '', gps_latitude: '', gps_longitude: ''
  });

  const totalSteps = 8;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUser(user); setFormData(prev => ({ ...prev, seller_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '' })); }
      else { window.location.href = '/login'; }
    };
    getUser();
  }, []);

  const fetchPriceSuggestion = useCallback(async () => {
    const animalType = formData.animal_type;
    if (!animalType) return;
    const { data } = await supabase.rpc('get_price_suggestion', { p_animal_type: animalType, p_weight: null });
    if (data && data.length > 0) { setMarketSuggestion(data[0]); setShowPriceSuggestion(true); }
    else { setMarketSuggestion(null); setShowPriceSuggestion(false); }
  }, [formData.animal_type]);

  useEffect(() => { if (formData.animal_type) fetchPriceSuggestion(); }, [formData.animal_type, fetchPriceSuggestion]);

  const handlePlaceSelect = (address, lat, lng) => setFormData({ ...formData, location: address, gps_latitude: lat, gps_longitude: lng });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files); setUploading(true);
    try {
      const imageUrls = [];
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error } = await supabase.storage.from('livestock-images').upload(`listings/${user?.id}/${fileName}`, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('livestock-images').getPublicUrl(`listings/${user?.id}/${fileName}`);
        imageUrls.push(publicUrl);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...imageUrls] }));
    } catch (error) { alert('Failed to upload images: ' + error.message); } finally { setUploading(false); }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.startsWith('video/')) { alert('Please upload a video file'); return; }
    setVideoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const { error } = await supabase.storage.from('livestock-videos').upload(`videos/${user?.id}/${Date.now()}.${fileExt}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('livestock-videos').getPublicUrl(`videos/${user?.id}/${Date.now()}.${fileExt}`);
      setFormData(prev => ({ ...prev, video_url: publicUrl }));
    } catch (error) { alert('Failed to upload video: ' + error.message); } finally { setVideoUploading(false); }
  };

  const removeImage = (index) => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  const nextStep = () => { if (currentStep < totalSteps) { setCurrentStep(currentStep + 1); window.scrollTo(0, 0); } };
  const prevStep = () => { if (currentStep > 1) { setCurrentStep(currentStep - 1); window.scrollTo(0, 0); } };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('livestock').insert([{
        user_id: user.id, listing_type: 'individual', farm_name: user.user_metadata?.farm_name,
        animal_type: formData.animal_type, breed_type: formData.breed_type, pure_cross: formData.pure_cross,
        age_years: parseInt(formData.age_years) || 0, age_months: parseInt(formData.age_months) || 0,
        teeth_age: formData.teeth_age, weight_min: formData.weight_min ? parseFloat(formData.weight_min) : null,
        weight_max: formData.weight_max ? parseFloat(formData.weight_max) : null,
        pregnancy_status: formData.pregnancy_status, sire_used: formData.sire_used,
        location: formData.location, price: formData.price ? parseFloat(formData.price) : null,
        transport_responsibility: formData.transport_responsibility,
        health_info: formData.health_info, notes: formData.notes,
        seller_name: formData.seller_name, seller_phone: formData.seller_phone,
        images: formData.images, video_url: formData.video_url,
        facebook_url: formData.facebook_url, instagram_url: formData.instagram_url,
        whatsapp_number: formData.whatsapp_number, website_url: formData.website_url,
        gps_latitude: formData.gps_latitude ? parseFloat(formData.gps_latitude) : null,
        gps_longitude: formData.gps_longitude ? parseFloat(formData.gps_longitude) : null,
        status: 'active', likes_count: 0, views_count: 0
      }]);
      if (error) throw error;
      alert('Listing published successfully!');
      window.location.href = '/MyListings';
    } catch (err) { alert('Error: ' + err.message); } finally { setSubmitting(false); }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return listingType !== '';
      case 2: return formData.animal_type && formData.breed_type;
      case 5: return formData.location && formData.price;
      case 8: return formData.images.length > 0;
      default: return true;
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
        <div key={step} className="flex items-center">
          <button onClick={() => setCurrentStep(step)} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${currentStep === step ? 'bg-primary text-white' : step < currentStep ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>{step < currentStep ? <Check className="w-4 h-4" /> : step}</button>
          {step < 8 && <div className={`w-full h-0.5 mx-2 ${step < currentStep ? 'bg-green-500' : 'bg-muted'}`} />}
        </div>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">What are you listing?</h2>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setListingType('individual')} className={`p-6 rounded-xl border-2 transition-all text-center ${listingType === 'individual' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3"><Upload className="w-6 h-6 text-amber-600" /></div>
                <div className="font-semibold">Individual Animal</div><div className="text-sm text-muted-foreground mt-0.5">Single livestock</div>
              </button>
              <button type="button" onClick={() => setListingType('bundle')} className={`p-6 rounded-xl border-2 transition-all text-center ${listingType === 'bundle' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><TrendingUp className="w-6 h-6 text-green-600" /></div>
                <div className="font-semibold">Bundle</div><div className="text-sm text-muted-foreground mt-0.5">Multiple animals, one price</div>
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Basic Information</h2>
            <div><Label>Farm/Business Name *</Label><Input value={user?.user_metadata?.farm_name || 'Loading...'} disabled className="bg-gray-100 cursor-not-allowed mt-1" /><p className="text-xs text-muted-foreground mt-1">From your profile.</p></div>
            <div><Label>Animal Type *</Label><select value={formData.animal_type} onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"><option value="">Select</option>{ANIMAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><Label>Breed Type *</Label><Input value={formData.breed_type} onChange={(e) => setFormData({ ...formData, breed_type: e.target.value })} placeholder="e.g., Angus" className="mt-1" /></div>
            <div><Label>Pure / Cross</Label><select value={formData.pure_cross} onChange={(e) => setFormData({ ...formData, pure_cross: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"><option value="">Select</option><option value="pure">Pure Breed</option><option value="cross">Cross Breed</option></select></div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Age & Weight</h2>
            <div className="grid grid-cols-2 gap-4"><div><Label>Age (Years)</Label><Input type="number" value={formData.age_years} onChange={(e) => setFormData({ ...formData, age_years: e.target.value })} className="mt-1" /></div><div><Label>Age (Months)</Label><Input type="number" value={formData.age_months} onChange={(e) => setFormData({ ...formData, age_months: e.target.value })} className="mt-1" /></div></div>
            <div><Label>Teeth / Age Description</Label><Input value={formData.teeth_age} onChange={(e) => setFormData({ ...formData, teeth_age: e.target.value })} placeholder="e.g., 8 teeth" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4"><div><Label>Weight Min (KG)</Label><Input type="number" value={formData.weight_min} onChange={(e) => setFormData({ ...formData, weight_min: e.target.value })} className="mt-1" /></div><div><Label>Weight Max (KG)</Label><Input type="number" value={formData.weight_max} onChange={(e) => setFormData({ ...formData, weight_max: e.target.value })} className="mt-1" /></div></div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Breeding Information</h2>
            <div><Label>Pregnancy Status</Label><select value={formData.pregnancy_status} onChange={(e) => setFormData({ ...formData, pregnancy_status: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"><option value="">Select</option><option value="pregnant">Pregnant</option><option value="open">Open (Not Pregnant)</option><option value="n/a">N/A</option></select></div>
            <div><Label>Sire Used</Label><Input value={formData.sire_used} onChange={(e) => setFormData({ ...formData, sire_used: e.target.value })} placeholder="e.g., Meatmaster Bull" className="mt-1" /></div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Location & Price</h2>
            <div><Label>Farm Location *</Label>
              <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={["places"]} onLoad={() => setScriptsLoaded(true)}>
                {scriptsLoaded && <PlacesAutocomplete onPlaceSelect={handlePlaceSelect} placeholder="Start typing your farm address..." />}
              </LoadScript>
              <button type="button" onClick={() => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition((position) => { setFormData({ ...formData, gps_latitude: position.coords.latitude, gps_longitude: position.coords.longitude, location: formData.location || "Location captured" }); alert("Location captured!"); }, () => alert("Could not get your location.")); } else { alert("Browser doesn't support location."); } }} className="w-full mt-2 py-2 border border-amber-500 rounded-lg text-amber-600 text-sm hover:bg-amber-50 transition flex items-center justify-center gap-2"><Crosshair className="w-4 h-4" /> Use my current location</button>
              {formData.gps_latitude && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location pinned on map</p>}
            </div>
            <div><Label>Transport Responsibility *</Label><select value={formData.transport_responsibility} onChange={(e) => setFormData({ ...formData, transport_responsibility: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"><option value="buyer">Buyer arranges transport</option><option value="seller">Seller delivers</option><option value="discuss">To be discussed</option></select></div>
            <div><Label>Price (R) *</Label><Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="Price per animal" className="mt-1" /></div>
            {showPriceSuggestion && marketSuggestion && (
              <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-primary" /><p className="text-xs font-medium text-primary">Market Price Suggestion</p></div><p className="text-xs text-muted-foreground">as of {new Date(marketSuggestion.effective_date).toLocaleDateString()}</p></div>
                <p className="text-sm font-semibold">R {marketSuggestion.price_min} - R {marketSuggestion.price_max} / {marketSuggestion.price_unit}</p>
                {marketSuggestion.grade && <p className="text-xs text-muted-foreground mt-1">Grade: {marketSuggestion.grade}</p>}
                <p className="text-xs text-muted-foreground mt-1">Source: {marketSuggestion.source}</p>
                <button type="button" onClick={() => { const suggestedPrice = Math.round((marketSuggestion.price_min + marketSuggestion.price_max) / 2); setFormData({ ...formData, price: suggestedPrice.toString() }); }} className="mt-2 text-xs text-primary hover:underline">Use suggested price (R {Math.round((marketSuggestion.price_min + marketSuggestion.price_max) / 2)})</button>
              </div>
            )}
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Health & Notes</h2>
            <div><Label>Health Information</Label><Textarea value={formData.health_info} onChange={(e) => setFormData({ ...formData, health_info: e.target.value })} placeholder="Vaccinations, health status, vet checks..." rows={3} className="mt-1" /></div>
            <div><Label>Additional Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any other information..." rows={3} className="mt-1" /></div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Contact & Social Media</h2>
            <div><Label>Your Name</Label><Input value={formData.seller_name} onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })} className="mt-1" /></div>
            <div><Label>Phone Number</Label><Input type="tel" value={formData.seller_phone} onChange={(e) => setFormData({ ...formData, seller_phone: e.target.value })} placeholder="+27 XX XXX XXXX" className="mt-1" /></div>
            <div><Label>Facebook (Optional)</Label><Input type="url" value={formData.facebook_url} onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })} placeholder="https://facebook.com/yourfarm" className="mt-1" /></div>
            <div><Label>Instagram (Optional)</Label><Input type="url" value={formData.instagram_url} onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })} placeholder="https://instagram.com/yourfarm" className="mt-1" /></div>
            <div><Label>WhatsApp (Optional)</Label><Input type="tel" value={formData.whatsapp_number} onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })} placeholder="+27 XX XXX XXXX" className="mt-1" /></div>
            <div><Label>Website (Optional)</Label><Input type="url" value={formData.website_url} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} placeholder="https://yourfarm.com" className="mt-1" /></div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Photos & Video</h2>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted"><img src={url} alt="Upload" className="w-full h-full object-cover" /><button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"><X className="w-3 h-3" /></button></div>
                ))}
                <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition"><Upload className="w-6 h-6 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Add Photo</span><input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} /></label>
              </div>
              {uploading && <p className="text-sm text-primary mt-2">Uploading images...</p>}
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <Video className="w-6 h-6 text-muted-foreground mx-auto mb-1" /><p className="text-sm text-muted-foreground mb-2">Upload a video (Optional)</p>
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" id="videoUpload" />
              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('videoUpload').click()} disabled={videoUploading}>{videoUploading ? 'Uploading...' : 'Choose Video'}</Button>
              {formData.video_url && <p className="text-green-600 text-sm mt-2">Video uploaded</p>}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-30"><div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4"><Link to="/Browse"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link><h1 className="text-xl font-bold">List Your Livestock</h1></div></div>
      <div className="max-w-2xl mx-auto px-4 py-6"><Card><CardContent className="p-6"><StepIndicator />{renderStep()}<div className="flex justify-between gap-4 mt-8">{currentStep > 1 && <Button variant="outline" onClick={prevStep} className="gap-2"><ChevronLeft className="w-4 h-4" />Back</Button>}{currentStep < totalSteps ? <Button onClick={nextStep} disabled={!isStepValid()} className="gap-2 ml-auto">Next<ChevronRight className="w-4 h-4" /></Button> : <Button onClick={handleSubmit} disabled={submitting || !isStepValid()} className="gap-2 ml-auto">{submitting ? 'Publishing...' : 'Publish Listing'}<Check className="w-4 h-4" /></Button>}</div></CardContent></Card></div>
    </div>
  );
}