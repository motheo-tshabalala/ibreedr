import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Eye, Edit, Building2, Users, Percent } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";

export default function MyListings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('farm_name, full_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setProfile(profile);
        }

        loadListings(user.id);
      } else {
        navigate('/login');
      }
    };
    getUserAndProfile();
  }, [navigate]);

  const loadListings = async (userId) => {
    const { data, error } = await supabase
      .from('livestock')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setMyListings(data || []);
    setIsLoading(false);
  };

  const deleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;

    setDeletingId(id);
    setMessage({ type: '', text: '' });

    const { error } = await supabase.from('livestock').delete().eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: 'Failed to delete: ' + error.message });
      setDeletingId(null);
      return;
    }

    setMyListings(myListings.filter(l => l.id !== id));
    setMessage({ type: 'success', text: 'Deleted successfully' });
    setDeletingId(null);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('livestock')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: 'Failed to update: ' + error.message });
      return;
    }
    setMyListings(myListings.map(l => l.id === id ? { ...l, status: newStatus } : l));
    setMessage({ type: 'success', text: `Listing marked as ${newStatus}` });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const displayAge = (livestock) => {
    const years = livestock?.age_years || 0;
    const months = livestock?.age_months || 0;
    if (years > 0 && months > 0) return `${years}y ${months}m`;
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
    return 'Age not specified';
  };

  const farmName = profile?.farm_name || profile?.full_name || 'My Farm';

  // Calculate pricing display
  const getPriceDisplay = (listing) => {
    const quantity = listing.quantity || 1;
    const pricePerHead = listing.price || 0;
    const isBundle = listing.is_bundle || false;
    const discount = listing.bundle_discount || 0;
    const totalPrice = isBundle
      ? pricePerHead * quantity * (1 - discount / 100)
      : pricePerHead * quantity;

    if (quantity === 1) {
      return {
        display: `R ${Number(pricePerHead).toLocaleString()}`,
        detail: null
      };
    }

    if (isBundle && discount > 0) {
      return {
        display: `R ${Math.round(totalPrice).toLocaleString()}`,
        detail: `${discount}% off bundle`
      };
    }

    return {
      display: `R ${Math.round(totalPrice).toLocaleString()}`,
      detail: `${quantity} animals`
    };
  };

  if (isLoading) {
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/farms">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">My Listings</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="w-4 h-4" />
                <span>{farmName}</span>
                <span className="text-xs text-gray-400">• {myListings.length} listings</span>
              </div>
            </div>
          </div>
          <Link to="/SellerUpload">
            <Button className="gap-2 bg-primary-green hover:bg-primary-green-dark">
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            }`}>
            {message.text}
          </div>
        )}

        {myListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4 opacity-50">📋</div>
            <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
            <p className="text-gray-500 text-sm mb-6">Start by adding your first livestock</p>
            <Link to="/SellerUpload">
              <Button className="bg-primary-green hover:bg-primary-green-dark">Create Listing</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.map(listing => {
              const priceInfo = getPriceDisplay(listing);
              const isBundle = listing.is_bundle || false;
              const quantity = listing.quantity || 1;
              const discount = listing.bundle_discount || 0;

              return (
                <Card key={listing.id} className="overflow-hidden">
                  <div className="relative h-40 bg-gray-100">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.name || listing.breed_type} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-30">🐄</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {isBundle && (
                        <Badge className="bg-amber-500 text-white">Bundle</Badge>
                      )}
                      <Badge variant={listing.status === 'sold' ? 'secondary' : 'default'}>
                        {listing.status || 'active'}
                      </Badge>
                    </div>
                    {quantity > 1 && (
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          <Users className="w-3 h-3 mr-1" />
                          {quantity} animals
                        </Badge>
                      </div>
                    )}
                    {isBundle && discount > 0 && (
                      <div className="absolute bottom-3 left-3 ml-auto">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <Percent className="w-3 h-3 mr-1" />
                          {discount}% off
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    {/* Farm name */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Building2 className="w-3 h-3" />
                      <span>{farmName}</span>
                    </div>

                    <h3 className="font-bold text-base">
                      {listing.name || `${listing.breed_type} x${quantity}`}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{listing.breed_type} • {displayAge(listing)}</p>

                    {/* Price */}
                    <div className="mt-2">
                      <p className="text-lg font-bold text-primary-green">{priceInfo.display}</p>
                      {priceInfo.detail && (
                        <p className="text-xs text-gray-500">{priceInfo.detail}</p>
                      )}
                      {quantity > 1 && !isBundle && (
                        <p className="text-xs text-gray-500">R {Number(listing.price).toLocaleString()} per animal</p>
                      )}
                      {isBundle && discount > 0 && quantity > 1 && (
                        <p className="text-xs text-gray-500">
                          R {Number(listing.price).toLocaleString()}/head • {discount}% discount
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Link to={`/EditListing?id=${listing.id}&type=individual`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                        <Link to={`/BreedDetails?id=${listing.id}`}>
                          <Eye className="w-3 h-3" />
                          View
                        </Link>
                      </Button>
                      {listing.status === 'active' && (
                        <Button variant="outline" size="sm" onClick={() => updateStatus(listing.id, 'sold')}>
                          Mark Sold
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteListing(listing.id)}
                        disabled={deletingId === listing.id}
                      >
                        {deletingId === listing.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}