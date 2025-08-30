// Enhanced Signup Component with Professional UI/UX
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, signInWithGoogle, createOrUpdateUserDoc } from '../lib/firebaseClient_Enhanced';

function Signup({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [ui, setUi] = useState({
    loading: false,
    error: '',
    showPassword: false,
    showConfirmPassword: false,
    agreedToTerms: false
  });

  const [validation, setValidation] = useState({
    name: { isValid: true, message: '' },
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '', strength: 0 },
    confirmPassword: { isValid: true, message: '' }
  });

  // Real-time validation
  useEffect(() => {
    // Name validation
    if (formData.name) {
      const isValid = formData.name.trim().length >= 2;
      setValidation(prev => ({
        ...prev,
        name: {
          isValid,
          message: isValid ? '' : 'Name must be at least 2 characters'
        }
      }));
    }

    // Email validation
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

    // Password validation and strength
    if (formData.password) {
      const password = formData.password;
      let strength = 0;
      let message = '';
      
      if (password.length >= 8) strength += 1;
      if (/[a-z]/.test(password)) strength += 1;
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(password)) strength += 1;

      const isValid = password.length >= 6;
      if (!isValid) {
        message = 'Password must be at least 6 characters';
      } else if (strength < 3) {
        message = 'Consider using a stronger password';
      }

      setValidation(prev => ({
        ...prev,
        password: {
          isValid,
          message,
          strength
        }
      }));
    }

    // Confirm password validation
    if (formData.confirmPassword) {
      const isValid = formData.password === formData.confirmPassword;
      setValidation(prev => ({
        ...prev,
        confirmPassword: {
          isValid,
          message: isValid ? '' : 'Passwords do not match'
        }
      }));
    }
  }, [formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (ui.error) setUi(prev => ({ ...prev, error: '' }));
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
      case 1: return 'Very Weak';
      case 2: return 'Weak';
      case 3: return 'Fair';
      case 4: return 'Good';
      case 5: return 'Strong';
      default: return '';
    }
  };

  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 0:
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-blue-500';
      case 5: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ui.agreedToTerms) {
      setUi(prev => ({ ...prev, error: 'Please agree to the Terms of Service and Privacy Policy' }));
      return;
    }

    setUi(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const user = await registerUser(formData.email, formData.password);
      
      // Create user document in Firestore
      await createOrUpdateUserDoc(user);
      
      const userData = {
        id: user.uid,
        email: user.email,
        name: formData.name || user.email.split('@')[0],
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      };
      onLogin(userData);
      navigate('/dashboard');
    } catch (err) {
      let errorMessage = 'Failed to create account';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled';
      }
      setUi(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setUi(prev => ({ ...prev, loading: false }));
    }
  };

  const handleGoogleSignUp = async () => {
    setUi(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const user = await signInWithGoogle();
      
      // Create/update user document in Firestore
      await createOrUpdateUserDoc(user);
      
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
      let errorMessage = 'Google sign-up failed';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-up was cancelled';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by browser';
      }
      setUi(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setUi(prev => ({ ...prev, loading: false }));
    }
  };

  const isFormValid = 
    validation.name.isValid && 
    validation.email.isValid && 
    validation.password.isValid && 
    validation.confirmPassword.isValid &&
    formData.name && 
    formData.email && 
    formData.password && 
    formData.confirmPassword &&
    ui.agreedToTerms;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF1B0] to-[#FFE082] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="text-5xl font-bold select-none mb-4">
            <span className="text-black drop-shadow-[2px_2px_0px_#FF3C00]">Trac</span>
            <span className="text-[#FF3C00] drop-shadow-[2px_2px_0px_black]">er</span>
          </div>
          <p className="text-gray-700 text-lg font-medium">Start your journey!</p>
          <p className="text-gray-600 text-sm mt-1">Create an account to track your habits</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Create Account</h2>

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
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    formData.name && !validation.name.isValid
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-[#FF8E42] focus:border-[#FF8E42]'
                  }`}
                  placeholder="Enter your full name"
                  required
                />
                {formData.name && validation.name.isValid && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {formData.name && !validation.name.isValid && (
                <p className="mt-1 text-sm text-red-600">{validation.name.message}</p>
              )}
            </div>

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
                  placeholder="Create a password"
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
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Password strength:</span>
                    <span className={`font-medium ${
                      validation.password.strength >= 4 ? 'text-green-600' : 
                      validation.password.strength >= 3 ? 'text-blue-600' :
                      validation.password.strength >= 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getPasswordStrengthText(validation.password.strength)}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded ${
                          level <= validation.password.strength 
                            ? getPasswordStrengthColor(validation.password.strength)
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {formData.password && validation.password.message && (
                <p className="mt-1 text-sm text-gray-600">{validation.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={ui.showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 pr-12 ${
                    formData.confirmPassword && !validation.confirmPassword.isValid
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-[#FF8E42] focus:border-[#FF8E42]'
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setUi(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                >
                  {ui.showConfirmPassword ? (
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
                {formData.confirmPassword && validation.confirmPassword.isValid && (
                  <div className="absolute inset-y-0 right-12 flex items-center pr-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {formData.confirmPassword && !validation.confirmPassword.isValid && (
                <p className="mt-1 text-sm text-red-600">{validation.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={ui.agreedToTerms}
                onChange={(e) => setUi(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
                className="mt-1 h-4 w-4 text-[#FF8E42] focus:ring-[#FF8E42] border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <a href="/terms" className="text-[#FF3C00] hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-[#FF3C00] hover:underline">Privacy Policy</a>
              </label>
            </div>

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
                  Creating account...
                </div>
              ) : (
                'Create Account'
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

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
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
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#FF3C00] font-semibold hover:text-[#E6360A] transition-colors"
                >
                  Sign in
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
      </div>
    </div>
  );
}

export default Signup;
