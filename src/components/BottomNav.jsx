import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageCircle, User, Package } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  const tabs = [
    {
      icon: Home,
      label: 'Home',
      path: '/'
    },
    {
      icon: Search,
      label: 'Search',
      path: '/search'
    },
    {
      icon: PlusCircle,
      label: 'Sell',
      path: '/SellerUpload'
    },
    {
      icon: Package,
      label: 'Listings',
      path: '/MyListings'
    },
    {
      icon: User,
      label: 'Profile',
      path: '/Profile'
    },
  ];

  return (
    <>
      <div className="h-20" />

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex justify-around items-center h-16">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path ||
                (tab.path === '/MyListings' && location.pathname === '/EditListing');
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors relative ${isActive
                      ? 'text-primary-green'
                      : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'fill-primary-green/10' : ''}`}
                  />
                  <span className="text-[10px] font-medium">{tab.label}</span>

                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-green rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}