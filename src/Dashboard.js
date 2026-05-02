import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Eye, Package, TrendingUp, DollarSign, Users, ShoppingBag, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "./components/ui/table";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [views, setViews] = useState([]);
  const [likes, setLikes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        window.location.href = '/login';
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setIsLoading(true);

      const { data: listingsData } = await supabase
        .from('livestock')
        .select('*')
        .eq('user_id', user.id);

      setListings(listingsData || []);

      if (listingsData && listingsData.length > 0) {
        const listingIds = listingsData.map(l => l.id);
        const { data: viewsData } = await supabase
          .from('views')
          .select('*')
          .in('livestock_id', listingIds);
        setViews(viewsData || []);

        const { data: likesData } = await supabase
          .from('likes')
          .select('*')
          .in('livestock_id', listingIds);
        setLikes(likesData || []);
      }

      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.status !== 'sold').length;
  const soldListings = listings.filter(l => l.status === 'sold').length;
  const totalViews = views.length;
  const totalLikes = likes.length;
  const totalValue = listings.reduce((sum, l) => sum + (Number(l.price) || 0), 0);
  const soldValue = listings.filter(l => l.status === 'sold').reduce((sum, l) => sum + (Number(l.price) || 0), 0);

  const viewsPerListing = {};
  views.forEach(view => {
    viewsPerListing[view.livestock_id] = (viewsPerListing[view.livestock_id] || 0) + 1;
  });

  const likesPerListing = {};
  likes.forEach(like => {
    likesPerListing[like.livestock_id] = (likesPerListing[like.livestock_id] || 0) + 1;
  });

  const performanceData = listings.map(listing => ({
    id: listing.id,
    name: listing.name,
    breed: listing.breed_type,
    price: listing.price,
    status: listing.status,
    views: viewsPerListing[listing.id] || 0,
    likes: likesPerListing[listing.id] || 0
  }));

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p className="text-3xl font-bold">{value.toLocaleString()}</p>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-full ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/MyListings">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Seller Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Listings"
            value={totalListings}
            icon={Package}
            color="bg-amber-500"
          />
          <StatCard
            title="Active Listings"
            value={activeListings}
            icon={TrendingUp}
            color="bg-green-500"
            subtitle={`${soldListings} sold`}
          />
          <StatCard
            title="Total Views"
            value={totalViews}
            icon={Eye}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Likes"
            value={totalLikes}
            icon={Heart}
            color="bg-rose-500"
          />
        </div>

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Revenue Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Inventory Value</span>
                  <span className="font-semibold">R {totalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Sold Value</span>
                  <span className="font-semibold text-green-600">R {soldValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">Active Value</span>
                  <span className="font-semibold text-amber-600">R {(totalValue - soldValue).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-base font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Sold Animals</span>
                  <span className="font-semibold">{soldListings}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Average Price</span>
                  <span className="font-semibold">
                    R {soldListings > 0 ? Math.round(soldValue / soldListings).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  <span className="font-semibold">
                    {totalViews > 0 ? Math.round((soldListings / totalViews) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Table */}
        <Card>
          <CardContent className="p-0">
            <div className="p-5 border-b">
              <h3 className="text-base font-semibold">Listing Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Breed</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Likes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.breed || '-'}</TableCell>
                      <TableCell>R {Number(item.price).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-muted-foreground" />
                          {item.views}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-muted-foreground" />
                          {item.likes}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'sold' ? 'secondary' : 'default'}>
                          {item.status || 'active'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {performanceData.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">No listings yet</p>
                  <Link to="/SellerUpload">
                    <Button variant="link" className="mt-2">Create your first listing</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}