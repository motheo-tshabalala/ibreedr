import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Upload, Shield, Building2, Phone, MapPin, User, Award, Camera } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import VerificationBadge from '../components/VerificationBadge';

export default function GetVerified() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    id_document: null,
    selfie: null,
    farm_registration: null
  });

  // Checklist items
  const [checklist, setChecklist] = useState({
    farm_name: false,
    phone: false,
    farm_location: false,
    farm_bio: false,
    has_listing: false,
    has_photos: false
  });

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
        setChecklist({
          farm_name: !!profile.farm_name,
          phone: !!profile.phone,
          farm_location: !!profile.farm_location,
          farm_bio: !!profile.farm_bio,
          has_listing: false,
          has_photos: false
        });

        // Check if user has listings with photos
        const { data: listings } = await supabase
          .from('livestock')
          .select('id, images')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1);

        if (listings && listings.length > 0) {
          setChecklist(prev => ({
            ...prev,
            has_listing: true,
            has_photos: !!(listings[0].images && listings[0].images.length > 0)
          }));
        }
      }

      setLoading(false);
    };

    loadUserAndProfile();
  }, [navigate]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `verification/${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('verification-docs')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-docs')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        [type]: publicUrl
      }));

      setMessage({ type: 'success', text: `${type.replace('_', ' ')} uploaded successfully!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload file: ' + error.message });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Insert verification request
      const { error } = await supabase
        .from('verification_requests')
        .insert([{
          user_id: user.id,
          farm_name: profile.farm_name,
          id_document_url: formData.id_document,
          selfie_url: formData.selfie,
          farm_registration_url: formData.farm_registration,
          status: 'pending'
        }]);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Verification request submitted! We\'ll review your application and get back to you within 48 hours.'
      });

      setTimeout(() => {
        navigate('/Profile');
      }, 3000);

    } catch (error) {
      console.error('Submit error:', error);
      setMessage({ type: 'error', text: 'Failed to submit verification request: ' + error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const allChecklistComplete = Object.values(checklist).every(val => val === true);

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
          <Link to="/Profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Get Verified</h1>
          {profile?.verified_farmer && (
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
                  <XCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            {profile?.verified_farmer ? (
              // Already Verified
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Verified!</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Your farm has been verified. You have a verified badge on all your listings.
                </p>
                <Link to="/Profile">
                  <Button className="bg-primary-green hover:bg-primary-green-dark">Return to Profile</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Step 1: Checklist */}
                {step === 1 && (
                  <>
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-primary-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-primary-green" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Get Verified</h2>
                      <p className="text-gray-500 text-sm mt-2">
                        Complete these steps to earn a verified badge on your farm profile.
                        <br />
                        <span className="text-xs text-gray-400">Verified farms get more buyer trust and higher visibility.</span>
                      </p>
                    </div>

                    <div className="space-y-3 mb-8">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Requirements:</h3>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {checklist.farm_name ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">Complete farm profile</p>
                          <p className="text-xs text-gray-400">Farm name, location, bio, phone</p>
                        </div>
                        {!checklist.farm_name && (
                          <Link to="/Profile" className="ml-auto text-xs text-primary-green hover:underline">
                            Go to Profile
                          </Link>
                        )}
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {checklist.has_listing ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">Publish at least one listing</p>
                          <p className="text-xs text-gray-400">Active livestock listing with photos</p>
                        </div>
                        {!checklist.has_listing && (
                          <Link to="/SellerUpload" className="ml-auto text-xs text-primary-green hover:underline">
                            Create Listing
                          </Link>
                        )}
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {checklist.has_photos ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">Upload photos to your listing</p>
                          <p className="text-xs text-gray-400">Buyers want to see your livestock</p>
                        </div>
                        {!checklist.has_photos && checklist.has_listing && (
                          <Link to="/MyListings" className="ml-auto text-xs text-primary-green hover:underline">
                            Edit Listing
                          </Link>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => setStep(2)}
                      disabled={!allChecklistComplete}
                      className="w-full gap-2 bg-primary-green hover:bg-primary-green-dark"
                    >
                      {allChecklistComplete ? 'Continue to Identity Verification' : 'Complete all steps to continue'}
                      {!allChecklistComplete && '🔒'}
                    </Button>
                  </>
                )}

                {/* Step 2: Identity Verification */}
                {step === 2 && (
                  <>
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-amber-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
                      <p className="text-gray-500 text-sm mt-2">
                        Upload your documents to verify your identity and farm ownership.
                        <br />
                        <span className="text-xs text-amber-600">All documents are securely stored and only reviewed by iBreedr staff.</span>
                      </p>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="p-4 border-2 border-dashed rounded-lg hover:border-primary-green transition">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Camera className="w-4 h-4" />
                          ID Document (Driver's License or ID)
                        </Label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'id_document')}
                          className="mt-2 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-green/10 file:text-primary-green hover:file:bg-primary-green/20"
                        />
                        {formData.id_document && (
                          <p className="text-xs text-green-600 mt-1">✓ ID Document uploaded</p>
                        )}
                      </div>

                      <div className="p-4 border-2 border-dashed rounded-lg hover:border-primary-green transition">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Camera className="w-4 h-4" />
                          Selfie holding your ID
                        </Label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'selfie')}
                          className="mt-2 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-green/10 file:text-primary-green hover:file:bg-primary-green/20"
                        />
                        {formData.selfie && (
                          <p className="text-xs text-green-600 mt-1">✓ Selfie uploaded</p>
                        )}
                      </div>

                      <div className="p-4 border-2 border-dashed rounded-lg hover:border-primary-green transition">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Camera className="w-4 h-4" />
                          Farm Registration (Optional but recommended)
                        </Label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'farm_registration')}
                          className="mt-2 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-green/10 file:text-primary-green hover:file:bg-primary-green/20"
                        />
                        {formData.farm_registration && (
                          <p className="text-xs text-green-600 mt-1">✓ Farm Registration uploaded</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                        Back
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={!formData.id_document || !formData.selfie || submitting}
                        className="flex-1 gap-2 bg-primary-green hover:bg-primary-green-dark"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            Apply for Verification
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-3">
                      {!formData.id_document && '⚠️ ID Document is required'}
                      {formData.id_document && !formData.selfie && '⚠️ Selfie is required'}
                      {formData.id_document && formData.selfie && '✅ Ready to submit!'}
                    </p>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}