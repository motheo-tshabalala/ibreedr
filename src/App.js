import './App.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

// Pages
import Home from './Home';
import SearchPage from './pages/SearchPage';
import FarmsPage from './pages/FarmsPage';
import FarmStorefront from './components/FarmStorefront';
import LivestockGrid from './components/LivestockGrid';
import GetVerified from './pages/GetVerified';
import SellerHub from './pages/SellerHub';
import PrivacyPolicy from './pages/PrivacyPolicy';
import HelpCenter from './HelpCenter'; // ✅ ADDED

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
import Profile from './Profile';
import DeleteProfile from './DeleteProfile';
import BottomNav from './components/BottomNav';

function HelpCenterWrapper({ onClose }) {
  const navigate = useNavigate();
  return <HelpCenter onClose={() => { onClose(); navigate(-1); }} />;
}

function AppContent() {
  const location = useLocation();
  const [showHelpCenter, setShowHelpCenter] = useState(false);

  const hideNavPaths = ['/login', '/logout', '/DeleteProfile', '/ChatRoom'];
  const shouldShowNav = !hideNavPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-warm-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/farms" element={<FarmsPage />} />
        <Route path="/farm/:id" element={<FarmStorefront />} />
        <Route path="/livestock" element={<LivestockGrid />} />
        <Route path="/hub" element={<SellerHub setShowHelpCenter={setShowHelpCenter} />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/help" element={<HelpCenter onClose={() => setShowHelpCenter(false)} />} />

        <Route path="/SellerUpload" element={<SellerUpload />} />
        <Route path="/MyListings" element={<MyListings />} />
        <Route path="/Wishlist" element={<Wishlist />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/BreedDetails" element={<BreedDetails />} />
        <Route path="/EditListing" element={<EditListing />} />

        <Route path="/login" element={<Auth />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/DeleteProfile" element={<DeleteProfile />} />
        <Route path="/GetVerified" element={<GetVerified />} />

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