import './App.css';
import React from 'react';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Browse" element={<Browse />} />
        <Route path="/SellerUpload" element={<SellerUpload />} />
        <Route path="/MyListings" element={<MyListings />} />
        <Route path="/Wishlist" element={<Wishlist />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/CreateBundle" element={<CreateBundle />} />
        <Route path="/BundleDetails" element={<BundleDetails />} />
        <Route path="/BreedDetails" element={<BreedDetails />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Router>
  );
}

export default App;