import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ClipboardList, Eye, MessageCircle, CheckCircle, Shield, Star, Users } from 'lucide-react';
import { Card, CardContent } from "./components/ui/card";
import Logo from './components/ui/Logo';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-100">
      <div className="max-w-lg mx-auto px-4 py-10 md:py-16">

        {/* Logo & Tagline */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Logo size="large" />
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            South Africa's trusted livestock marketplace
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4 mb-10">
          {/* I'm Buying */}
          <Link to="/Browse">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] border-2 hover:border-amber-300 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Search className="w-7 h-7 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">I'm Buying</h2>
                    <p className="text-sm text-muted-foreground">Browse livestock for sale</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-500 text-lg">→</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* I'm Selling */}
          <Link to="/SellerUpload">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] border-2 hover:border-amber-300 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">I'm Selling</h2>
                    <p className="text-sm text-muted-foreground">List your livestock for sale</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-500 text-lg">→</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* How It Works */}
        <div className="mb-10">
          <h3 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-6">
            How It Works
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                <Eye className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Browse</p>
              <p className="text-xs text-muted-foreground">View listings nationwide</p>
            </div>
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                <MessageCircle className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Connect</p>
              <p className="text-xs text-muted-foreground">Chat with sellers directly</p>
            </div>
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Trade</p>
              <p className="text-xs text-muted-foreground">Close the deal</p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Secure platform</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span>Verified sellers</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span>Growing community</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-200">
        <div className="max-w-lg mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} iBreedr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}