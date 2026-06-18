import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';

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
      icon: MessageCircle,
      label: 'Chat',
      path: '/ChatList'
    },
    // ✅ CHANGED: Profile → Me, path /hub
    {
      icon: User,
      label: 'Me',
      path: '/hub'
    },
  ];

  return (
    <>
      <div className="h-20" />

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex justify-around items-center h-16">
            {tabs.map((tab) => {
              // ✅ CHANGED: Active state includes all seller/account pages
              const isActive = location.pathname === tab.path ||
                (tab.path === '/hub' && [
                  '/Profile', '/MyListings', '/Dashboard', '/GetVerified',
                  '/Wishlist', '/DeleteProfile', '/EditListing', '/SellerUpload'
                ].includes(location.pathname));

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
                  {isActive && (
                    <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-green rounded-full" />
                  )}

                  <Icon className="w-5 h-5" />

                  <span className={`text-[10px] font-medium ${isActive ? 'text-primary-green' : ''
                    }`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}