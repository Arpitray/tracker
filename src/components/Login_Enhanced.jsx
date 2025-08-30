// Enhanced Login Component with Professional UI/UX
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, signInWithGoogle, sendPasswordReset } from '../lib/firebaseClient';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [ui, setUi] = useState({
    loading: false,
    error: '',
    showPassword: false,
    resetEmailSent: false,
    showForgotPassword: false
  });

  const [validation, setValidation] = useState({
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '' }
  });

  // Real-time email validation
  useEffect(() => {
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(formData.email);
      setValidation(prev => ({
        ...prev,
        email: {
          isValid,
          message: isValid ? '' : 'Please enter a valid email address'
        }
      }));
    }
  }, [formData.email]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (ui.error) setUi(prev => ({ ...prev, error: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUi(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const user = await loginUser(formData.email, formData.password);
      const userData = {
        id: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      };
      onLogin(userData);
      navigate('/dashboard');
    } catch (err) {
      let errorMessage = 'Failed to sign in';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }
      setUi(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setUi(prev => ({ ...prev, loading: false }));
    }
  };

  const handleGoogleSignIn = async () => {
    setUi(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const user = await signInWithGoogle();
      const userData = {
        id: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      };
      onLogin(userData);
      navigate('/dashboard');
    } catch (err) {
      let errorMessage = 'Google sign-in failed';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by browser';
      }
      setUi(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setUi(prev => ({ ...prev, loading: false }));
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setUi(prev => ({ ...prev, error: 'Please enter your email address first' }));
      return;
    }

    try {
      await sendPasswordReset(formData.email);
      setUi(prev => ({
        ...prev,
        resetEmailSent: true,
        showForgotPassword: false,
        error: ''
      }));
    } catch (err) {
      setUi(prev => ({ ...prev, error: 'Failed to send reset email' }));
    }
  };

  const isFormValid = validation.email.isValid && formData.email && formData.password;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF1B0] to-[#FFE082] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="text-5xl font-bold select-none mb-4">
            <span className="text-black drop-shadow-[2px_2px_0px_#FF3C00]">Trac</span>
            <span className="text-[#FF3C00] drop-shadow-[2px_2px_0px_black]">er</span>
          </div>
          <p className="text-gray-700 text-lg font-medium">Welcome back!</p>
          <p className="text-gray-600 text-sm mt-1">Sign in to continue your habit journey</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Sign In</h2>

          {/* Success Message */}
          {ui.resetEmailSent && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Password reset email sent! Check your inbox.
              </div>
            </div>
          )}

          {/* Error Message */}
          {ui.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {ui.error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    formData.email && !validation.email.isValid
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-[#FF8E42] focus:border-[#FF8E42]'
                  }`}
                  placeholder="Enter your email"
                  required
                />
                {formData.email && validation.email.isValid && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {formData.email && !validation.email.isValid && (
                <p className="mt-1 text-sm text-red-600">{validation.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={ui.showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8E42] focus:border-[#FF8E42] pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setUi(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                >
                  {ui.showPassword ? (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setUi(prev => ({ ...prev, showForgotPassword: !prev.showForgotPassword }))}
                className="text-sm text-[#FF3C00] hover:text-[#E6360A] font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Forgot Password Section */}
            {ui.showForgotPassword && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  Enter your email address above and click the button below to receive a password reset link.
                </p>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="w-full py-2 px-4 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Send Reset Email
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || ui.loading}
              className={`w-full py-3 px-4 font-semibold rounded-lg transition-all transform ${
                isFormValid && !ui.loading
                  ? 'bg-[#FF8E42] text-white hover:bg-[#E6763A] hover:scale-[1.02] shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {ui.loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={ui.loading}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8E42] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.8 0 7.1 1.3 9.8 3.9l7.3-7.3C36.1 2 30.5 0 24 0 14.8 0 6.9 5.6 3 13.7l8.6 6.7C13 15 18.1 9.5 24 9.5z" />
                <path fill="#34A853" d="M46.5 24c0-1.5-.1-3-.3-4.5H24v8.5h12.7c-.5 3.2-2.1 6-4.6 7.9l7.2 5.6C43.5 36.1 46.5 30.4 46.5 24z" />
                <path fill="#FBBC05" d="M9.6 31.3C8.9 29.7 8.5 27.9 8.5 26s.4-3.7 1.1-5.3L1 14.2C-.5 17.8-.5 22.1 1 25.7l8.6 5.6z" />
                <path fill="#4285F4" d="M24 48c6.5 0 12.4-2.1 17.3-5.7l-7.2-5.6C32.1 35 28.2 36 24 36c-5.9 0-11-4.8-12-10.9L4 30.5C6.9 39.4 14.9 48 24 48z" />
              </svg>
              Continue with Google
            </div>
          </button>

          {/* Navigation Links */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/signup')}
                  className="text-[#FF3C00] font-semibold hover:text-[#E6360A] transition-colors"
                >
                  Create account
                </button>
              </p>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors flex items-center justify-center mx-auto"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>By signing in, you agree to our{' '}
            <a href="/terms" className="text-[#FF3C00] hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-[#FF3C00] hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
