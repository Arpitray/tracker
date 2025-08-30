// AuthLandingPage.jsx
// Main landing page with site info and authentication
import React from 'react';
import { useNavigate } from 'react-router-dom';

function AuthLandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFF1B0] overflow-x-hidden">
      {/* Navbar */}
      <nav className="w-full bg-[#FF8E42] flex items-center justify-between px-8 py-6 border-b-2 border-orange-300">
        {/* Logo */}
        <div className="text-6xl font-bold select-none">
          <span className="text-black drop-shadow-[2px_2px_0px_#FF3C00]">Trac</span>
          <span className="text-[#FF3C00] drop-shadow-[2px_2px_0px_black]">er</span>
        </div>
        {/* Auth Buttons */}
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-yellow-300 text-black font-semibold rounded-lg shadow-md hover:bg-yellow-400 transition"
          >
            Log In
          </button>
          <button 
            onClick={() => navigate('/signup')}
            className="px-6 py-3 bg-[#FF3C00] text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-20 pb-16 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-7xl font-extrabold text-black mb-8 leading-tight">
            Track Your Habits,
            <br />
            <span className="text-[#FF3C00]">Transform Your Life</span>
          </h1>
          
          <p className="text-2xl text-gray-800 mb-12 max-w-3xl mx-auto leading-relaxed">
            Build lasting habits with our intuitive habit tracker. Set goals, track progress, 
            and celebrate your achievements with beautiful, interactive cards.
          </p>

          <div className="flex gap-6 justify-center mb-20">
            <button 
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-[#FF3C00] text-white text-xl font-bold rounded-lg shadow-lg hover:bg-red-600 transition transform hover:scale-105"
            >
              Get Started Free
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-transparent border-2 border-black text-black text-xl font-bold rounded-lg hover:bg-black hover:text-white transition"
            >
              I Have an Account
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/20">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-5xl font-bold text-center text-black mb-16">
            Why Choose Tracer?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#FF8E42] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Visual Progress</h3>
              <p className="text-gray-700">
                See your progress with beautiful circular progress bars and streak counters.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#FF8E42] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Goal Setting</h3>
              <p className="text-gray-700">
                Set deadlines and track completion rates to stay motivated and focused.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#FF8E42] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Interactive Cards</h3>
              <p className="text-gray-700">
                Drag and arrange your habit cards however you like. Make it your own!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto text-center px-8">
          <h2 className="text-5xl font-bold text-black mb-8">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-800 mb-8">
            Join thousands of users who are building better habits every day.
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="px-10 py-5 bg-[#FF3C00] text-white text-2xl font-bold rounded-lg shadow-lg hover:bg-red-600 transition transform hover:scale-105"
          >
            Start Tracking Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#FF8E42] py-8 mt-20">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <div className="text-4xl font-bold mb-4">
            <span className="text-black drop-shadow-[2px_2px_0px_#FF3C00]">Trac</span>
            <span className="text-[#FF3C00] drop-shadow-[2px_2px_0px_black]">er</span>
          </div>
          <p className="text-yellow-300">
            © 2025 Tracer. Build habits that last.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AuthLandingPage;
