import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, User, Building2, Phone, Mail, CheckCircle, AlertCircle, ExternalLink, Share2, QrCode } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ full_name: '', farm_name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    const loadUserAndProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      setUser(user);
      setProfile(prev => ({ ...prev, email: user.email }));
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile({
          full_name: data.full_name || user.user_metadata?.full_name || '',
          farm_name: data.farm_name || user.user_metadata?.farm_name || '',
          phone: data.phone || '',
          email: user.email
        });
      }
      setLoading(false);
    };
    loadUserAndProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const { error } = await supabase.rpc('update_profile', {
        p_user_id: user.id,
        p_full_name: profile.full_name,
        p_farm_name: profile.farm_name,
        p_phone: profile.phone
      });
      if (error) throw error;
      await supabase.auth.updateUser({ data: { full_name: profile.full_name, farm_name: profile.farm_name } });
      setMessage({ type: 'success', text: 'Profile updated! All listings synced.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const profileUrl = user ? `${window.location.origin}/farm/${user.id}` : '';
  const whatsappShareText = user && profile.farm_name
    ? `Check out ${profile.farm_name} on iBreedr — South Africa's livestock marketplace:%0A${profileUrl}`
    : '';

  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileUrl);
    alert('Profile link copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-stone-300 border-t-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/Browse"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <h1 className="text-xl font-bold">My Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Public Profile Card */}
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-amber-600" />
                Your Public Storefront
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Share this link anywhere — WhatsApp, Facebook, business cards. Anyone who opens it sees your farm and all your active listings.
            </p>
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border mb-3">
              <input type="text" value={profileUrl} readOnly className="flex-1 text-sm bg-transparent border-none outline-none text-gray-600" />
              <Button variant="outline" size="sm" onClick={copyProfileLink}>Copy</Button>
            </div>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/?text=${whatsappShareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" className="w-full gap-2 bg-green-50 border-green-200 hover:bg-green-100 text-green-700">
                  <Share2 className="w-4 h-4" />Share to WhatsApp
                </Button>
              </a>
              <Button variant="outline" size="icon" onClick={() => setShowShareOptions(!showShareOptions)}>
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
            {showShareOptions && (
              <div className="mt-3 p-3 bg-white rounded-lg border text-center">
                <p className="text-xs text-muted-foreground mb-2">Scan to view your farm</p>
                <div className="w-32 h-32 bg-muted rounded-lg mx-auto flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">QR code coming soon</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Profile Card */}
        <Card>
          <CardContent className="p-6">
            {message.text && (
              <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            <div className="mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Your <strong>Farm/Business Name</strong> appears on all your listings and your public profile. Changing it updates everything.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="farmName" className="flex items-center gap-2 text-base font-semibold"><Building2 className="w-4 h-4" />Farm/Business Name *</Label>
                <Input id="farmName" type="text" value={profile.farm_name} onChange={(e) => setProfile({ ...profile, farm_name: e.target.value })} placeholder="e.g., Green Valley Farm" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">This is your public identity on iBreedr</p>
              </div>
              <div>
                <Label htmlFor="fullName" className="flex items-center gap-2"><User className="w-4 h-4" />Full Name</Label>
                <Input id="fullName" type="text" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Your name" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="w-4 h-4" />Phone Number</Label>
                <Input id="phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+27 XX XXX XXXX" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center gap-2"><Mail className="w-4 h-4" />Email Address</Label>
                <Input id="email" type="email" value={profile.email} disabled className="mt-1 bg-gray-100 cursor-not-allowed" />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t">
              <Button onClick={handleSave} disabled={saving || !profile.farm_name} className="w-full gap-2">
                {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Saving...</> : <><Save className="w-4 h-4" />Save Profile</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}