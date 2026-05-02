import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Package, Percent, Truck, ChevronRight, ChevronLeft, Check, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";

export default function CreateBundle() {
  const [user, setUser] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const [selectedLivestock, setSelectedLivestock] = useState([]);
  const totalSteps = 5;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        loadListings(user.id);
      } else {
        window.location.href = '/login';
      }
    };
    getUser();
  }, []);

  const loadListings = async (userId) => {
    const { data, error } = await supabase
      .from('livestock')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error loading listings:', error);
    } else {
      setMyListings(data || []);
    }
  };

  const toggleLivestock = (id) => {
    setSelectedLivestock(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const calculateIndividualTotal = () => {
    return selectedLivestock.reduce((sum, id) => {
      const animal = myListings.find(l => l.id === id);
      return sum + (animal?.price || 0);
    }, 0);
  };

  const calculateDiscount = () => {
    const individual = calculateIndividualTotal();
    const bundle = (bundleData.price_per_head * bundleData.quantity);
    if (individual === 0) return 0;
    return Math.round(((individual - bundle) / individual) * 100);
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

  const createBundle = async () => {
    setIsSubmitting(true);

    const firstAnimal = myListings.find(l => l.id === selectedLivestock[0]);
    const images = selectedLivestock
      .map(id => myListings.find(l => l.id === id)?.images?.[0])
      .filter(Boolean);

    const bundlePrice = bundleData.price_per_head * bundleData.quantity;

    const { error: bundleError } = await supabase
      .from('bundles')
      .insert([{
        user_id: user.id,
        bundle_name: bundleData.bundle_name,
        bundle_description: bundleData.bundle_description,
        livestock_ids: selectedLivestock,
        bundle_price: bundlePrice,
        quantity: parseInt(bundleData.quantity),
        price_per_head: parseFloat(bundleData.price_per_head),
        discount_percentage: calculateDiscount(),
        breed_type: bundleData.breed_type,
        pure_cross: bundleData.pure_cross,
        age_display: bundleData.age_display,
        weight_display: bundleData.weight_display,
        pregnancy_status: bundleData.pregnancy_status,
        sire_used: bundleData.sire_used,
        location: bundleData.location,
        images: images,
        status: 'active'
      }]);

    if (bundleError) {
      console.error('Bundle error:', bundleError);
      alert('Failed to create bundle: ' + bundleError.message);
      setIsSubmitting(false);
      return;
    }

    for (const id of selectedLivestock) {
      await supabase
        .from('livestock')
        .update({ status: 'reserved' })
        .eq('id', id);
    }

    alert('Bundle created successfully!');
    window.location.href = '/MyListings';
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return selectedLivestock.length >= 2;
      case 2: return bundleData.bundle_name && bundleData.quantity && bundleData.price_per_head;
      case 3: return bundleData.location;
      case 4: return true; // Optional fields
      case 5: return true; // Review step always valid
      default: return true;
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex items-center">
          <button
            onClick={() => setCurrentStep(step)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${currentStep === step
                ? 'bg-primary text-white'
                : step < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
          >
            {step < currentStep ? <Check className="w-4 h-4" /> : step}
          </button>
          {step < 5 && (
            <div className={`w-full h-0.5 mx-2 ${step < currentStep ? 'bg-green-500' : 'bg-muted'}`} />
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
            <h2 className="text-xl font-semibold text-center">Select Livestock</h2>
            <p className="text-sm text-muted-foreground text-center">
              Choose at least 2 animals to bundle together
            </p>
            {myListings.length === 0 ? (
              <div className="text-center py-8 bg-muted rounded-lg">
                <p className="text-muted-foreground text-sm">No active listings available</p>
                <Link to="/SellerUpload">
                  <Button variant="link" className="mt-2">Create a listing first</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {myListings.map(animal => (
                  <button
                    key={animal.id}
                    onClick={() => toggleLivestock(animal.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${selectedLivestock.includes(animal.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }`}
                  >
                    {animal.images && animal.images[0] ? (
                      <img src={animal.images[0]} alt={animal.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-2xl">🐄</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{animal.name}</p>
                      <p className="text-xs text-muted-foreground">{animal.breed_type}</p>
                      <p className="text-xs font-medium">R {animal.price?.toLocaleString()}</p>
                    </div>
                    {selectedLivestock.includes(animal.id) && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            {selectedLivestock.length > 0 && (
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm">
                  Selected: <span className="font-semibold">{selectedLivestock.length}</span> animals
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Individual total: R {calculateIndividualTotal().toLocaleString()}
                </p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Bundle Details</h2>
            <div>
              <Label>Bundle Name *</Label>
              <Input
                value={bundleData.bundle_name}
                onChange={(e) => setBundleData({ ...bundleData, bundle_name: e.target.value })}
                placeholder="e.g., Starter Flock"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={bundleData.bundle_description}
                onChange={(e) => setBundleData({ ...bundleData, bundle_description: e.target.value })}
                placeholder="Describe what's included..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={bundleData.quantity}
                  onChange={(e) => setBundleData({ ...bundleData, quantity: e.target.value })}
                  placeholder="Number of animals"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Price per Head (R) *</Label>
                <Input
                  type="number"
                  value={bundleData.price_per_head}
                  onChange={(e) => setBundleData({ ...bundleData, price_per_head: e.target.value })}
                  placeholder="R 1,250"
                  className="mt-1"
                />
              </div>
            </div>
            {bundleData.quantity && bundleData.price_per_head && (
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Bundle Price</p>
                <p className="text-2xl font-bold text-primary">
                  R {(bundleData.price_per_head * bundleData.quantity).toLocaleString()}
                </p>
                {calculateDiscount() > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {calculateDiscount()}% discount vs individual prices
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Animal Specifications</h2>
            <div>
              <Label>Breed Type</Label>
              <Input
                value={bundleData.breed_type}
                onChange={(e) => setBundleData({ ...bundleData, breed_type: e.target.value })}
                placeholder="e.g., Angora Goat"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Pure / Cross</Label>
              <select
                value={bundleData.pure_cross}
                onChange={(e) => setBundleData({ ...bundleData, pure_cross: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              >
                <option value="">Select</option>
                <option value="pure">Pure Breed</option>
                <option value="cross">Cross Breed</option>
              </select>
            </div>
            <div>
              <Label>Age</Label>
              <Input
                value={bundleData.age_display}
                onChange={(e) => setBundleData({ ...bundleData, age_display: e.target.value })}
                placeholder="e.g., 2tand, 8 teeth"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Weight</Label>
              <Input
                value={bundleData.weight_display}
                onChange={(e) => setBundleData({ ...bundleData, weight_display: e.target.value })}
                placeholder="e.g., 45-50 KG"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Pregnancy Status</Label>
              <select
                value={bundleData.pregnancy_status}
                onChange={(e) => setBundleData({ ...bundleData, pregnancy_status: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              >
                <option value="">Select</option>
                <option value="pregnant">Pregnant</option>
                <option value="open">Open</option>
                <option value="n/a">N/A</option>
              </select>
            </div>
            <div>
              <Label>Sire Used</Label>
              <Input
                value={bundleData.sire_used}
                onChange={(e) => setBundleData({ ...bundleData, sire_used: e.target.value })}
                placeholder="e.g., Meatmaster Bull"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Location *</Label>
              <Input
                value={bundleData.location}
                onChange={(e) => setBundleData({ ...bundleData, location: e.target.value })}
                placeholder="City or province"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Delivery Options</h2>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-muted-foreground" />
                  <Label>Offer Delivery</Label>
                </div>
                <button
                  onClick={() => setBundleData(prev => ({ ...prev, transport_available: !prev.transport_available }))}
                  className={`w-10 h-5 rounded-full transition-colors ${bundleData.transport_available ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${bundleData.transport_available ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="text-center text-muted-foreground text-sm">
              <p>You can add photos in the final step</p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Review & Publish</h2>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Bundle Name</p>
                <p className="text-sm">{bundleData.bundle_name || 'Not specified'}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Animals Selected</p>
                <p className="text-sm">{selectedLivestock.length} animals</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Pricing</p>
                <p className="text-sm">
                  R {bundleData.price_per_head?.toLocaleString()} per head × {bundleData.quantity} ={' '}
                  <span className="font-bold text-primary">
                    R {(bundleData.price_per_head * bundleData.quantity).toLocaleString()}
                  </span>
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm">{bundleData.location || 'Not specified'}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/MyListings">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Create Bundle</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <StepIndicator />

            {renderStep()}

            <div className="flex justify-between gap-4 mt-8">
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}

              {currentStep < totalSteps ? (
                <Button onClick={nextStep} disabled={!isStepValid()} className="gap-2 ml-auto">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={createBundle} disabled={isSubmitting || !isStepValid()} className="gap-2 ml-auto">
                  {isSubmitting ? 'Creating...' : 'Create Bundle'}
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