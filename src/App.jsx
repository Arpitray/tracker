import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthLandingPage from './components/AuthLandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import LandingPage from './LandingPage';
import { onAuthChange, signOutUser } from './lib/firebaseClient';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use Firebase auth observer to derive logged-in user
  useEffect(() => {
    const unsub = onAuthChange((u) => {
      if (u) {
        const userData = { id: u.uid, email: u.email, name: u.displayName || u.email.split('@')[0], photoURL: u.photoURL };
        setUser(userData);
        try { localStorage.setItem('tracer.user', JSON.stringify(userData)); } catch (e) {}
      } else {
        setUser(null);
        try { localStorage.removeItem('tracer.user'); } catch (e) {}
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    try { localStorage.setItem('tracer.user', JSON.stringify(userData)); } catch (e) {}
  };

  const handleLogout = (userData) => {
  // sign out from Firebase to end the session
  signOutUser().catch(() => {});
  setUser(null);
  try { localStorage.removeItem('tracer.user'); } catch (e) {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF1B0] flex items-center justify-center">
        <div className="text-4xl font-bold">
          <span className="text-black drop-shadow-[2px_2px_0px_#FF3C00]">Trac</span>
          <span className="text-[#FF3C00] drop-shadow-[2px_2px_0px_black]">er</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <AuthLandingPage />} 
        />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" replace /> : <Signup onLogin={handleLogin} />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={user ? <LandingPage user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />} 
        />
        
        {/* Catch all - redirect to appropriate page */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
