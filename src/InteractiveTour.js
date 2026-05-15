import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const tourSteps = [
  { title: "Welcome to iBreedr!", description: "Let's take a quick tour. You'll be buying and selling livestock in no time.", target: null, highlight: null },
  { title: "Swipe to Browse", description: "Swipe LEFT or RIGHT on any card to browse animals. You can also use the arrow buttons on the sides.", target: "swipe-area", highlight: "card-area" },
  { title: "Search & Filter", description: "Use the search bar to find specific breeds. Tap the filter button to narrow down by animal type, price, location, and more.", target: "search-filter", highlight: "top-bar" },
  { title: "Like Animals", description: "Tap the heart button at the bottom of any card to like an animal. This helps sellers know what's popular.", target: "like-button", highlight: "bottom-center" },
  { title: "Save to Wishlist", description: "Tap the bookmark icon at the top right to save animals to your wishlist for later.", target: "wishlist-button", highlight: "top-right" },
  { title: "Tap for Details", description: "Tap anywhere on a card to see full details - health records, breeding info, and seller contact.", target: "card", highlight: "center" },
  { title: "Menu", description: "Tap the menu button to access your messages, wishlist, listings, dashboard, and Help Center.", target: "menu-button", highlight: "top-left" },
  { title: "Sell Your Livestock", description: "Tap the + button to list your animals. Follow the step-by-step wizard to upload photos and details.", target: "upload-button", highlight: "bottom-right" }
];

export default function InteractiveTour({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState({});

  useEffect(() => {
    const step = tourSteps[currentStep];
    if (step.target) {
      const element = document.querySelector(`[data-tour-target="${step.target}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightStyle({ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 });
      } else { setHighlightStyle({}); }
    } else { setHighlightStyle({}); }
  }, [currentStep]);

  const handleNext = () => { if (currentStep < tourSteps.length - 1) setCurrentStep(currentStep + 1); else onComplete(); };
  const handlePrev = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  const step = tourSteps[currentStep];

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" />
      {highlightStyle.width > 0 && <div className="fixed rounded-2xl border-2 border-amber-500 shadow-2xl z-50 pointer-events-none transition-all duration-300" style={highlightStyle} />}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h3 className="text-xl font-bold mb-2">{step.title}</h3>
          <p className="text-gray-600 mb-6">{step.description}</p>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">Step {currentStep + 1} of {tourSteps.length}</div>
            <div className="flex gap-3">
              <button onClick={onSkip} className="px-4 py-2 text-gray-500 hover:text-gray-700">Skip</button>
              {currentStep > 0 && <button onClick={handlePrev} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></button>}
              <button onClick={handleNext} className="px-5 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium flex items-center gap-1">
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}<ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}