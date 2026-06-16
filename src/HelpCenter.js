import React, { useState } from 'react';
import { X, HelpCircle, ChevronRight, ChevronLeft, BookOpen, Video, MessageCircle, Heart, Bookmark, Upload, TrendingUp, MapPin, User, LogOut, Trash2, Building2, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

const helpArticles = {
  gettingStarted: [
    { id: 'browse-farms', title: 'How to find a farm', icon: <Building2 className="w-4 h-4" />, content: 'Browse verified farms on the Farms page. Each farm has a storefront showing all their livestock. You can follow farms you trust.' },
    { id: 'browse-livestock', title: 'How to find livestock', icon: <BookOpen className="w-4 h-4" />, content: 'Use the Livestock page to search by breed, location, or price. Every animal is linked to its farm, so you can see who is selling.' },
    { id: 'wishlist', title: 'How to save livestock', icon: <Bookmark className="w-4 h-4" />, content: 'Tap the bookmark icon on any livestock card to save it to your wishlist. You\'ll get notified if the price changes.' },
  ],
  selling: [
    { id: 'upload', title: 'How to list livestock', icon: <Upload className="w-4 h-4" />, content: 'Tap the Sell button in the bottom navigation. Follow the step-by-step wizard to add photos, details, and pricing. Your farm name appears automatically on all listings.' },
    { id: 'bundle', title: 'How to create a bundle', icon: <TrendingUp className="w-4 h-4" />, content: 'Select "Bundle" when listing. Choose multiple animals and set a discounted bundle price. Great for selling groups of livestock.' },
    { id: 'edit', title: 'How to edit or delete listings', icon: <MessageCircle className="w-4 h-4" />, content: 'Go to My Listings from the profile menu. Tap Edit or Delete on any listing. Changes update immediately.' },
    { id: 'dashboard', title: 'How to track sales', icon: <TrendingUp className="w-4 h-4" />, content: 'View your Dashboard to see views, likes, and sales analytics. Track which animals are getting the most interest.' },
  ],
  account: [
    { id: 'profile', title: 'How to update your farm profile', icon: <User className="w-4 h-4" />, content: 'Go to Profile from the bottom navigation. Update your farm name, location, bio, and contact details. Your farm name appears on all your listings.' },
    { id: 'verification', title: 'How to get verified', icon: <CheckCircle className="w-4 h-4" />, content: 'Verified farms get more visibility. Contact support to start the verification process. You\'ll need to provide proof of farm ownership and identity.' },
    { id: 'delete', title: 'Delete your account', icon: <Trash2 className="w-4 h-4" />, content: 'Warning: Deleting your account permanently removes all your listings, messages, and data. This cannot be undone. Go to Profile → Delete Account.' },
    { id: 'logout', title: 'How to logout', icon: <LogOut className="w-4 h-4" />, content: 'Tap the profile icon in the bottom navigation, then select Logout from the menu.' },
  ],
  chat: [
    { id: 'message', title: 'How to message a farm', icon: <MessageCircle className="w-4 h-4" />, content: 'On any livestock or farm page, tap "Message" to start a conversation. You\'ll receive replies in the Messages section. All messages are in real-time.' },
  ]
};

export default function HelpCenter({ onClose, onStartTour }) {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeCategory, setActiveCategory] = useState('gettingStarted');

  const categories = [
    { id: 'gettingStarted', label: 'Getting Started', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'selling', label: 'For Sellers', icon: <Upload className="w-4 h-4" /> },
    { id: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
    { id: 'chat', label: 'Messages', icon: <MessageCircle className="w-4 h-4" /> },
  ];

  const articles = helpArticles[activeCategory] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary-green" />
            <h2 className="text-xl font-bold">Help Center</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-48 border-r bg-gray-50 p-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedArticle(null);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${activeCategory === cat.id
                    ? 'bg-primary-green/10 text-primary-green font-medium'
                    : 'hover:bg-gray-100 text-gray-600'
                  }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* Articles */}
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedArticle ? (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {categories.find(c => c.id === activeCategory)?.label}
                </h3>
                {articles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {article.icon}
                      <span className="text-sm">{article.title}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
                {activeCategory === 'account' && (
                  <Link to="/DeleteProfile" onClick={onClose}>
                    <button className="w-full text-left p-3 rounded-lg hover:bg-red-50 transition flex items-center justify-between mt-2 border-t border-red-100">
                      <div className="flex items-center gap-2 text-red-600">
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Delete My Account</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-red-400" />
                    </button>
                  </Link>
                )}
                {articles.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">No articles yet</p>
                )}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="mb-4 text-sm text-primary-green flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to articles
                </button>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedArticle.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedArticle.content}</p>
                  {selectedArticle.id === 'delete' && (
                    <Link to="/DeleteProfile" onClick={onClose}>
                      <Button className="mt-4 w-full bg-red-600 hover:bg-red-700">
                        Delete My Account
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t text-center text-xs text-gray-400">
          Need more help? Contact support@ibreedr.com
        </div>
      </div>
    </div>
  );
}