import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // keep this (Tailwind or default styles)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);