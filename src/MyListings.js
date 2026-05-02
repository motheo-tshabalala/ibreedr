import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Eye, Heart, Package, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";

export default function MyListings() {
  const [user, setUser] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [myBundles, setMyBundles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        loadListings(user.id);
        loadBundles(user.id);
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
      .order('created_at', { ascending: false });
    if (!error) setMyListings(data || []);
    setIsLoading(false);
  };

  const loadBundles = async (userId) => {
    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setMyBundles(data || []);
  };

  const deleteListing = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    const table = type === 'bundle' ? 'bundles' : 'livestock';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      alert('Failed to delete: ' + error.message);
    } else {
      if (type === 'bundle') {
        setMyBundles(myBundles.filter(l => l.id !== id));
      } else {
        setMyListings(myListings.filter(l => l.id !== id));
      }
      alert('Deleted successfully');
    }
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('livestock')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      alert('Failed to update: ' + error.message);
    } else {
      setMyListings(myListings.map(l => l.id === id ? { ...l, status: newStatus } : l));
      alert(`Listing marked as ${newStatus}`);
    }
  };

  const displayAge = (livestock) => {
    const years = livestock?.age_years || 0;
    const months = livestock?.age_months || 0;
    if (years > 0 && months > 0) return `${years}y ${months}m`;
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}`;
    return 'Age not specified';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const allItems = [...myListings, ...myBundles.map(b => ({ ...b, isBundle: true }))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/Browse">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">My Listings</h1>
          </div>
          <Link to="/SellerUpload">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4 opacity-50">📋</div>
            <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Start by adding your first livestock</p>
            <Link to="/SellerUpload">
              <Button>Create Listing</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Individual Listings */}
            {myListings.map(livestock => (
              <Card key={livestock.id} className="overflow-hidden">
                <div className="relative h-40 bg-muted">
                  {livestock.images?.[0] ? (
                    <img src={livestock.images[0]} alt={livestock.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl opacity-30">🐄</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant={livestock.status === 'sold' ? 'secondary' : 'default'}>
                      {livestock.status || 'active'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-base">{livestock.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{livestock.breed_type} • {displayAge(livestock)}</p>
                  {livestock.price && (
                    <p className="text-lg font-bold text-primary mt-2">R {Number(livestock.price).toLocaleString()}</p>
                  )}
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Link to={`/EditListing?id=${livestock.id}&type=individual`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1">
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                      <Link to={`/BreedDetails?id=${livestock.id}`}>
                        <Eye className="w-3 h-3" />
                        View
                      </Link>
                    </Button>
                    {livestock.status === 'active' && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(livestock.id, 'sold')}>
                        Mark Sold
                      </Button>
                    )}
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteListing(livestock.id, 'individual')}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Bundle Listings */}
            {myBundles.map(bundle => (
              <Card key={bundle.id} className="overflow-hidden">
                <div className="relative h-40 bg-muted">
                  {bundle.images?.[0] ? (
                    <img src={bundle.images[0]} alt={bundle.bundle_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant={bundle.status === 'sold' ? 'secondary' : 'default'}>
                      {bundle.status || 'active'}
                    </Badge>
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">Bundle</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-base">{bundle.bundle_name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{bundle.location}</p>
                  {bundle.bundle_price && (
                    <p className="text-lg font-bold text-primary mt-2">R {Number(bundle.bundle_price).toLocaleString()}</p>
                  )}
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    <Link to={`/EditListing?id=${bundle.id}&type=bundle`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1">
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                      <Link to={`/BundleDetails?id=${bundle.id}`}>
                        <Eye className="w-3 h-3" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteListing(bundle.id, 'bundle')}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}