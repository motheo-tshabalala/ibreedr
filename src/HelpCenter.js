import React, { useState, useEffect } from 'react';
import { X, HelpCircle, ChevronRight, ChevronLeft, BookOpen, Video, MessageCircle, Heart, Bookmark, Upload, TrendingUp, MapPin, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

// Help articles data
const helpArticles = {
  gettingStarted: [
    { id: 'browse', title: 'How to browse animals', icon: <BookOpen className="w-4 h-4" />, content: 'Swipe left or right on any card to browse animals. You can also use the < and > buttons on the sides of the screen. Tap any card to view full details.' },
    { id: 'like', title: 'How to like an animal', icon: <Heart className="w-4 h-4" />, content: 'Tap the HEART button at the bottom of any card to like an animal. This helps sellers know what\'s popular.' },
    { id: 'wishlist', title: 'How to save to wishlist', icon: <Bookmark className="w-4 h-4" />, content: 'Tap the BOOKMARK icon at the top right of any card to save animals to your wishlist for later.' },
  ],
  selling: [
    { id: 'upload', title: 'How to list an animal', icon: <Upload className="w-4 h-4" />, content: 'Tap the + button at the bottom right. Follow the step-by-step wizard to add photos, details, and pricing.' },
    { id: 'bundle', title: 'How to create a bundle', icon: <TrendingUp className="w-4 h-4" />, content: 'Select "Bundle" when listing. Choose multiple animals and set a discounted bundle price.' },
    { id: 'edit', title: 'How to edit or delete listings', icon: <MessageCircle className="w-4 h-4" />, content: 'Go to My Listings from the menu. Tap Edit or Delete on any listing.' },
    { id: 'dashboard', title: 'How to track sales', icon: <TrendingUp className="w-4 h-4" />, content: 'View your Dashboard to see views, likes, and sales analytics.' },
  ],
  account: [
    { id: 'profile', title: 'How to update your profile', icon: <User className="w-4 h-4" />, content: 'Your profile is linked to your email. Contact support to update your information.' },
    { id: 'logout', title: 'How to logout', icon: <LogOut className="w-4 h-4" />, content: 'Tap the menu button (☰) and select Logout.' },
  ],
  chat: [
    { id: 'message', title: 'How to message a seller', icon: <MessageCircle className="w-4 h-4" />, content: 'On any listing, tap "Message Seller" to start a conversation. You\'ll receive replies in the Messages section.' },
  ]
};

// Interactive tour steps
const tourSteps = [
  {
    title: "👋 Welcome to iBreedr!",
    description: "Let's take a quick tour. You'll be buying and selling livestock in no time.",
    target: null,
    button: "Start Tour"
  },
  {
    title: "🔄 Swipe to Browse",
    description: "Swipe LEFT or RIGHT on any card to browse animals. You can also use the < and > buttons on the sides.",
    target: "swipe-area",
    button: "Next"
  },
  {
    title: "❤️ Like Animals",
    description: "Tap the HEART button at the bottom of any card to like an animal.",
    target: "like-button",
    button: "Next"
  },
  {
    title: "📑 Save to Wishlist",
    description: "Tap the BOOKMARK icon at the top right to save animals to your wishlist.",
    target: "wishlist-button",
    button: "Next"
  },
  {
    title: "👆 Tap for Details",
    description: "Tap anywhere on a card to see full details - health records, breeding info, and seller contact.",
    target: "card",
    button: "Next"
  },
  {
    title: "☰ Menu",
    description: "Tap the menu button to access your messages, wishlist, listings, dashboard, and logout.",
    target: "menu-button",
    button: "Next"
  },
  {
    title: "📤 Sell Your Livestock",
    description: "Tap the + button to list your animals. Follow the step-by-step wizard to upload photos and details.",
    target: "upload-button",
    button: "Finish"
  }
];

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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold">Help Center</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Tour Button */}
        <div className="p-4 bg-amber-50 border-b">
          <button
            onClick={onStartTour}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition"
          >
            <Video className="w-5 h-5" />
            Start Interactive Tour
          </button>
          <p className="text-xs text-amber-600 text-center mt-2">
            Take a step-by-step walkthrough of iBreedr
          </p>
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
                    ? 'bg-amber-100 text-amber-700 font-medium'
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
                {articles.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">No articles yet</p>
                )}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="mb-4 text-sm text-amber-600 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to articles
                </button>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedArticle.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedArticle.content}</p>
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