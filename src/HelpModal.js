import React from 'react';
import { X, HelpCircle } from 'lucide-react';
import { useHelp } from './HelpContext';

const helpContent = {
  // Browse page
  swipeLeft: {
    title: "Swipe Left / Pass",
    description: "Not interested in this animal? Swipe left or tap the ← button to see the next listing.",
    tip: "The animal will still appear in search results. You can find it again.",
    video: null
  },
  swipeRight: {
    title: "Swipe Right / View Details",
    description: "Interested in this animal? Swipe right or tap the → button to see full details including health records, seller info, and pricing.",
    tip: "From the details page, you can message the seller directly.",
    video: null
  },
  like: {
    title: "Like / Save",
    description: "Like an animal to show interest. Sellers can see how many likes their listing has.",
    tip: "Liked animals appear in your activity feed (coming soon).",
    video: null
  },
  wishlist: {
    title: "Wishlist",
    description: "Save animals to your wishlist for later. You'll get notified if the price drops.",
    tip: "Go to My Wishlist to view all saved animals.",
    video: null
  },
  chat: {
    title: "Messages",
    description: "Chat with sellers directly. Ask questions about the animal, negotiate price, or arrange viewing.",
    tip: "Always communicate through iBreedr for safety.",
    video: null
  },
  filter: {
    title: "Filter",
    description: "Filter listings by price range, location, animal type, and more.",
    tip: "Use filters to find exactly what you're looking for.",
    video: null
  },
  myListings: {
    title: "My Listings",
    description: "View, edit, or delete your own listings. Mark animals as sold when they're gone.",
    tip: "Keep your listings updated for best results.",
    video: null
  },
  upload: {
    title: "Add Listing",
    description: "Upload new livestock for sale. Add photos, video, health records, and pricing.",
    tip: "Listings with photos get 3x more views.",
    video: null
  },
  dashboard: {
    title: "Dashboard",
    description: "See your sales stats, view counts, and listing performance.",
    tip: "Check your dashboard weekly to track success.",
    video: null
  },
  logout: {
    title: "Logout",
    description: "Sign out of your account.",
    tip: "Always logout on shared devices.",
    video: null
  },
  // Bundle page
  bundleType: {
    title: "Bundle vs Individual",
    description: "Choose 'Individual' for single animals. Choose 'Bundle' for multiple animals sold together at a discount.",
    tip: "Bundles are great for selling groups of similar animals.",
    video: null
  },
  // Upload form
  imageUpload: {
    title: "Upload Photos",
    description: "Add clear photos of your animal from different angles.",
    tip: "Include photos of teeth, hooves, and body condition for serious buyers.",
    video: null
  },
  videoUpload: {
    title: "Upload Video",
    description: "A short video helps buyers see the animal's movement and condition.",
    tip: "30-60 seconds is perfect.",
    video: null
  }
};

export default function HelpModal() {
  const { helpElement, closeHelp, helpMode } = useHelp();

  if (!helpMode || !helpElement) return null;

  const content = helpContent[helpElement] || {
    title: "Help",
    description: "Click on any button or feature to learn more about it.",
    tip: "This help mode explains how everything works.",
    video: null
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={closeHelp} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <button
          onClick={closeHelp}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5 text-stone-400" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-stone-800">{content.title}</h3>
        </div>

        <p className="text-stone-600 leading-relaxed mb-4">
          {content.description}
        </p>

        {content.tip && (
          <div className="bg-amber-50 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">💡 Tip</p>
            <p className="text-sm text-amber-700">{content.tip}</p>
          </div>
        )}

        {content.video && (
          <div className="mb-4">
            <video src={content.video} className="w-full rounded-xl" controls />
          </div>
        )}

        <button
          onClick={closeHelp}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-full py-3 font-semibold transition"
        >
          Got it
        </button>

        <p className="text-center text-xs text-stone-400 mt-3">
          Help mode: {helpMode ? "ON" : "OFF"} • Click "Got it" to continue
        </p>
      </div>
    </div>
  );
}