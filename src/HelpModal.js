import React from 'react';
import { X, HelpCircle } from 'lucide-react';
import { useHelp } from './HelpContext';

const helpContent = {
  // Browse page - Navigation
  swipeLeft: {
    title: "← Swipe Left",
    description: "Go back to the previous listing. Swipe left on the card or tap the < button.",
    tip: "Use this to review an animal you passed on."
  },
  swipeRight: {
    title: "→ Swipe Right",
    description: "Move to the next listing. Swipe right on the card or tap the > button.",
    tip: "Keep swiping to browse all available animals."
  },
  like: {
    title: "❤️ Like Button",
    description: "Show interest in an animal. Tap the heart button at the bottom of the card.",
    tip: "Sellers can see how many likes their listing gets."
  },
  wishlist: {
    title: "📑 Wishlist Button",
    description: "Save an animal to your wishlist for later. Tap the bookmark icon on any card.",
    tip: "Go to Wishlist in the menu to see all saved animals."
  },
  tapCard: {
    title: "👆 Tap on Card",
    description: "Tap anywhere on the livestock card to view all the details - including health records, breeding information, seller contact, and more.",
    tip: "From the details page, you can message the seller directly and make an offer."
  },
  filter: {
    title: "🔽 Filter Button",
    description: "Filter listings to find exactly what you're looking for.",
    tip: "You can filter by animal type (cattle, goats, sheep), price range, location, pure/cross breed, and listing type (individual or bundle)."
  },
  search: {
    title: "🔍 Search Bar",
    description: "Search for specific animals by name or breed.",
    tip: "Type keywords like 'Angus' or 'Boer goat' to find matching listings instantly."
  },
  upload: {
    title: "+ Add Listing Button",
    description: "Tap the + button to sell your livestock. This will take you to the upload form where you can add photos, videos, and details about your animal.",
    tip: "Listings with good photos get 3x more views and sell faster."
  },
  menu: {
    title: "☰ Menu Button",
    description: "Tap the three lines to open the main menu. From here you can access your messages, wishlist, listings, dashboard, and logout.",
    tip: "You can also turn Help Mode on/off from the menu anytime."
  },
  myListings: {
    title: "My Listings",
    description: "View, edit, or delete all your listings. You can also mark animals as sold from here.",
    tip: "Keep your listings updated for best results."
  },
  dashboard: {
    title: "Dashboard",
    description: "See your sales stats, view counts, and listing performance all in one place.",
    tip: "Check your dashboard weekly to track your success."
  },
  chat: {
    title: "Messages",
    description: "Chat with buyers and sellers directly. Negotiate prices and arrange viewings.",
    tip: "Always communicate through iBreedr for safety."
  },
  logout: {
    title: "Logout",
    description: "Sign out of your account securely.",
    tip: "Always logout on shared devices for security."
  },
  login: {
    title: "Login / Sign Up",
    description: "Create an account or sign in to start buying or selling livestock.",
    tip: "It's free and takes less than a minute."
  },
  viewModeAll: {
    title: "All Tab",
    description: "Shows both individual animals and bundles together.",
    tip: "Use this to see everything available at once."
  },
  viewModeIndividual: {
    title: "Individual Tab",
    description: "Shows only single animals for sale.",
    tip: "Use this if you're looking for one specific animal."
  },
  viewModeBundles: {
    title: "Bundles Tab",
    description: "Shows only bundles (multiple animals sold together at a discount).",
    tip: "Bundles are great for buying in bulk."
  }
};

export default function HelpModal() {
  const { helpElement, closeHelp, helpMode } = useHelp();

  if (!helpMode || !helpElement) return null;

  const content = helpContent[helpElement] || {
    title: "Help",
    description: "Tap on any button or feature to learn more about it.",
    tip: "This help mode explains how everything works."
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeHelp} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <button onClick={closeHelp} className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-100 transition">
          <X className="w-5 h-5 text-stone-400" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-stone-800">{content.title}</h3>
        </div>
        <p className="text-stone-600 leading-relaxed mb-4">{content.description}</p>
        {content.tip && (
          <div className="bg-amber-50 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">💡 Tip</p>
            <p className="text-sm text-amber-700">{content.tip}</p>
          </div>
        )}
        <button onClick={closeHelp} className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-full py-3 font-semibold transition">
          Got it
        </button>
        <p className="text-center text-xs text-stone-400 mt-3">Help mode: ON - Tap any button to learn</p>
      </div>
    </div>
  );
}