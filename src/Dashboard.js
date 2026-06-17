import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, TrendingUp, DollarSign, Users, Building2, Calendar, Award, BarChart3 } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/Badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "./components/ui/table";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      setUser(user);

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('farm_name, full_name, verified_farmer, years_farming, total_animals_sold')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Use RPC for farm stats (one call instead of loading all rows)
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_farm_stats', { p_user_id: user.id });

      if (statsError) {
        console.error('Error loading farm stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // Load listings for the performance table only
      const { data: listingsData } = await supabase
        .from('livestock')
        .select('id, name, breed_type, price, quantity, is_bundle, bundle_discount, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setListings(listingsData || []);
      setIsLoading(false);
    };

    loadData();
  }, [navigate]);

  const farmName = profile?.farm_name || profile?.full_name || 'My Farm';
  const isVerified = profile?.verified_farmer || false;
  const yearsFarming = profile?.years_farming || 0;

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
    // Handle value formatting safely
    const displayValue = typeof value === 'number' ? value.toLocaleString() : value || '0';

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{title}</p>
                <p className="text-3xl font-bold">{displayValue}</p>
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
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-green border-t-transparent" />
      </div>
    );
  }

  // Use stats from RPC, fallback to calculated values
  const totalListings = stats?.total_listings || 0;
  const activeListings = stats?.active_listings || 0;
  const soldListings = stats?.sold_listings || 0;
  const totalAnimals = stats?.total_animals || 0;
  const bundleCount = stats?.bundles_count || 0;
  const totalValue = stats?.total_value || 0;
  const soldValue = stats?.sold_value || 0;

  const performanceData = listings.map(listing => ({
    id: listing.id,
    name: listing.name || `${listing.breed_type} x${listing.quantity || 1}`,
    breed: listing.breed_type,
    price: listing.price,
    quantity: listing.quantity || 1,
    is_bundle: listing.is_bundle || false,
    bundle_discount: listing.bundle_discount || 0,
    status: listing.status
  }));

  return (
    <div className="min-h-screen bg-warm-white pb-20">
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/Profile">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Farm Dashboard</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="w-4 h-4" />
                <span>{farmName}</span>
                {isVerified && (
                  <Badge className="bg-primary-green text-white text-xs">Verified</Badge>
                )}
                {yearsFarming > 0 && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {yearsFarming} years
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid - Using RPC data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard
            title="Total Listings"
            value={totalListings}
            icon={Package}
            color="bg-primary-green"
            subtitle={`${activeListings} active`}
          />
          <StatCard
            title="Total Animals"
            value={totalAnimals}
            icon={Users}
            color="bg-blue-500"
            subtitle={`${bundleCount} bundles`}
          />
          <StatCard
            title="Revenue"
            value={`R ${totalValue.toLocaleString()}`}
            icon={DollarSign}
            color="bg-amber-500"
            subtitle={`R ${soldValue.toLocaleString()} sold`}
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
                  <span className="font-semibold text-primary-green">R {(totalValue - soldValue).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-primary-green" />
                Farm Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Years Farming</span>
                  <span className="font-semibold">{yearsFarming || 'Not set'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Animals Sold</span>
                  <span className="font-semibold">{profile?.total_animals_sold || 0}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">Listings Sold</span>
                  <span className="font-semibold">{soldListings}</span>
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
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.name}
                        {item.is_bundle && item.bundle_discount > 0 && (
                          <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-700 border-amber-200">
                            {item.bundle_discount}% off
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{item.breed || '-'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {item.is_bundle && item.bundle_discount > 0 ? (
                          <span className="text-sm">
                            R {Math.round(item.price * item.quantity * (1 - item.bundle_discount / 100)).toLocaleString()}
                            <span className="text-xs text-gray-400 ml-1">
                              (R {Number(item.price).toLocaleString()}/head)
                            </span>
                          </span>
                        ) : item.quantity > 1 ? (
                          <span className="text-sm">
                            R {(item.price * item.quantity).toLocaleString()}
                            <span className="text-xs text-gray-400 ml-1">
                              (R {Number(item.price).toLocaleString()}/head)
                            </span>
                          </span>
                        ) : (
                          <span>R {Number(item.price).toLocaleString()}</span>
                        )}
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
                    <Button variant="link" className="mt-2 text-primary-green">Create your first listing</Button>
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