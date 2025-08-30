// Login.jsx
// Login page component
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, signInWithGoogle } from '../lib/firebaseClient';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await loginUser(email, password);
      // normalize user object
      const userData = { id: user.uid, email: user.email, name: user.displayName || user.email.split('@')[0], photoURL: user.photoURL };
      onLogin(userData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await signInWithGoogle();
      const userData = { id: user.uid, email: user.email, name: user.displayName || user.email.split('@')[0], photoURL: user.photoURL };
      onLogin(userData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF1B0] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl font-bold select-none">
            <span className="text-black drop-shadow-[2px_2px_0px_#FF3C00]">Trac</span>
            <span className="text-[#FF3C00] drop-shadow-[2px_2px_0px_black]">er</span>
          </div>
          <p className="text-gray-600 mt-2">Welcome back!</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Log In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8E42]"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8E42]"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-[#FF8E42] text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-[#FF8E42] disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          {error && <div className="text-red-600 mt-3">{error}</div>}

          <div className="mt-4">
            <button onClick={handleGoogle} type="button" className="w-full py-2 px-4 bg-white border border-gray-300 flex items-center justify-center gap-3 rounded-md mt-3">
              <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path fill="#EA4335" d="M24 9.5c3.8 0 7.1 1.3 9.8 3.9l7.3-7.3C36.1 2 30.5 0 24 0 14.8 0 6.9 5.6 3 13.7l8.6 6.7C13 15 18.1 9.5 24 9.5z" />
                <path fill="#34A853" d="M46.5 24c0-1.5-.1-3-.3-4.5H24v8.5h12.7c-.5 3.2-2.1 6-4.6 7.9l7.2 5.6C43.5 36.1 46.5 30.4 46.5 24z" />
                <path fill="#FBBC05" d="M9.6 31.3C8.9 29.7 8.5 27.9 8.5 26s.4-3.7 1.1-5.3L1 14.2C-.5 17.8-.5 22.1 1 25.7l8.6 5.6z" />
                <path fill="#4285F4" d="M24 48c6.5 0 12.4-2.1 17.3-5.7l-7.2-5.6C32.1 35 28.2 36 24 36c-5.9 0-11-4.8-12-10.9L4 30.5C6.9 39.4 14.9 48 24 48z" />
              </svg>
              Continue with Google
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-[#FF3C00] font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
