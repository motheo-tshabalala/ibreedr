import './App.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Pages
import Home from './Home';
import SearchPage from './pages/SearchPage';
import FarmsPage from './pages/FarmsPage';
import FarmStorefront from './components/FarmStorefront';
import LivestockGrid from './components/LivestockGrid';
import GetVerified from './pages/GetVerified';

// Components
import SellerUpload from './SellerUpload';
import MyListings from './MyListings';
import Wishlist from './Wishlist';
import Dashboard from './Dashboard';
import BreedDetails from './BreedDetails';
import Auth from './Auth';
import Logout from './Logout';
import ChatList from './ChatList';
import ChatRoom from './ChatRoom';
import EditListing from './EditListing';
import HelpCenter from './HelpCenter';
import Profile from './Profile';
import DeleteProfile from './DeleteProfile';
import BottomNav from './components/BottomNav';

function AppContent() {
  const location = useLocation();
  const [showHelpCenter, setShowHelpCenter] = useState(false);

  // Pages where BottomNav should NOT show
  const hideNavPaths = ['/login', '/logout', '/DeleteProfile', '/ChatRoom'];
  const shouldShowNav = !hideNavPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-warm-white">
      <Routes>
        {/* Main Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/farms" element={<FarmsPage />} />
        <Route path="/farm/:id" element={<FarmStorefront />} />
        <Route path="/livestock" element={<LivestockGrid />} />

        {/* Marketplace */}
        <Route path="/SellerUpload" element={<SellerUpload />} />
        <Route path="/MyListings" element={<MyListings />} />
        <Route path="/Wishlist" element={<Wishlist />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/BreedDetails" element={<BreedDetails />} />
        <Route path="/EditListing" element={<EditListing />} />

        {/* Auth */}
        <Route path="/login" element={<Auth />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/DeleteProfile" element={<DeleteProfile />} />
        <Route path="/GetVerified" element={<GetVerified />} />

        {/* Chat */}
        <Route path="/ChatList" element={<ChatList />} />
        <Route path="/ChatRoom" element={<ChatRoom />} />
      </Routes>

      {shouldShowNav && <BottomNav />}

      {showHelpCenter && (
        <HelpCenter onClose={() => setShowHelpCenter(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;