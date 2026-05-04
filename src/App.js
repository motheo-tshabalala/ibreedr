import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Browse from './Browse';
import SellerUpload from './SellerUpload';
import MyListings from './MyListings';
import Wishlist from './Wishlist';
import Dashboard from './Dashboard';
import CreateBundle from './CreateBundle';
import BundleDetails from './BundleDetails';
import BreedDetails from './BreedDetails';
import Auth from './Auth';
import Logout from './Logout';
import ChatList from './ChatList';
import ChatRoom from './ChatRoom';
import EditListing from './EditListing';
import HelpCenter from './HelpCenter';
import InteractiveTour from './InteractiveTour';

function App() {
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Check if user has seen the tour before
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('ibreedr_tour_completed');
    if (!hasSeenTour) {
      // Show tour after a short delay for first-time users
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Browse" element={<Browse setShowHelpCenter={setShowHelpCenter} setShowTour={setShowTour} />} />
        <Route path="/SellerUpload" element={<SellerUpload />} />
        <Route path="/MyListings" element={<MyListings />} />
        <Route path="/Wishlist" element={<Wishlist />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/CreateBundle" element={<CreateBundle />} />
        <Route path="/BundleDetails" element={<BundleDetails />} />
        <Route path="/BreedDetails" element={<BreedDetails />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/ChatList" element={<ChatList />} />
        <Route path="/ChatRoom" element={<ChatRoom />} />
        <Route path="/EditListing" element={<EditListing />} />
      </Routes>

      {/* Help Center Modal */}
      {showHelpCenter && (
        <HelpCenter
          onClose={() => setShowHelpCenter(false)}
          onStartTour={() => {
            setShowHelpCenter(false);
            setShowTour(true);
          }}
        />
      )}

      {/* Interactive Tour */}
      {showTour && (
        <InteractiveTour
          onComplete={() => {
            localStorage.setItem('ibreedr_tour_completed', 'true');
            setShowTour(false);
          }}
          onSkip={() => setShowTour(false)}
        />
      )}
    </Router>
  );
}

export default App;