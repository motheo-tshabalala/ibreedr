import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Upload, Shield, Star, Users, ArrowRight, Eye, MessageCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from "./components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Buy Sell Cards */}
      <div className="max-w-lg mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">iBreedr</h1>
          <p className="text-muted-foreground">Your trusted livestock marketplace</p>
        </div>

        <div className="space-y-4">
          {/* I'm Buying Card */}
          <Link to="/Browse">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2 hover:border-primary/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">I'm Buying</h2>
                    <p className="text-sm text-muted-foreground">Browse livestock for sale</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* I'm Selling Card */}
          <Link to="/SellerUpload">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2 hover:border-primary/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                    <Upload className="w-7 h-7 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">I'm Selling</h2>
                    <p className="text-sm text-muted-foreground">List your livestock for sale</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* How It Works */}
        <div className="mt-10 pt-6 border-t">
          <h3 className="text-center font-semibold text-sm mb-5 text-muted-foreground">How it works</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-medium">1. Browse</p>
              <p className="text-xs text-muted-foreground">View listings</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-medium">2. Contact</p>
              <p className="text-xs text-muted-foreground">Message seller</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-medium">3. Complete</p>
              <p className="text-xs text-muted-foreground">Buy or sell</p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Secure payments</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3" />
            <span>Verified sellers</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>Trusted platform</span>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="border-t mt-6">
        <div className="max-w-lg mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} iBreedr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}