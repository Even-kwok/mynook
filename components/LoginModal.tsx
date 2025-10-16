/**
 * Login/Register Modal Component
 * Supports email/password and Google login
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconGoogle } from './Icons';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot-password';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, signInWithGoogle, sendPasswordResetEmail, user } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false); // 单独的 Google 登录加载状态
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-close modal when user successfully logs in
  useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  // Reset form
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError(null);
    setSuccessMessage(null);
    setLoading(false);
    setGoogleLoading(false); // 重置 Google 登录状态
  };

  // Toggle mode
  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  // Close modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle email/password sign in/sign up
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      
      if (mode === 'signin') {
        result = await signIn({ email, password });
      } else {
        result = await signUp({ email, password, fullName });
      }

      if (result.error) {
        // Localize error message
        const errorMessage = getErrorMessage(result.error);
        setError(errorMessage);
        setLoading(false);
      } else {
        // Optimistic UI update: close modal immediately without waiting for user profile to load
        // onAuthStateChange will automatically load user profile in the background
        handleClose();
        // Keep loading state until modal close animation completes
        setTimeout(() => setLoading(false), 300);
      }
    } catch (err) {
      setError('An unknown error occurred, please try again later');
      setLoading(false);
    }
  };

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true); // 使用独立的 Google loading 状态

    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setError('Google sign in failed, please try again later');
        setGoogleLoading(false);
      }
      // Note: If successful, Google OAuth will redirect the page.
      // Don't set loading to false here as the page will reload.
    } catch (err) {
      setError('Google sign in failed, please try again later');
      setGoogleLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const { error } = await sendPasswordResetEmail(email);
      
      if (error) {
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
      } else {
        setSuccessMessage('Password reset email sent! Please check your inbox and click the link to reset your password.');
        // Automatically switch back to sign in mode after 3 seconds
        setTimeout(() => {
          setMode('signin');
          resetForm();
        }, 3000);
      }
    } catch (err) {
      setError('Failed to send email, please try again later');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
          >
            <IconX className="w-5 h-5 text-slate-500" />
          </button>

          {/* Content area */}
          <div className="p-8">
            {/* Title */}
            <div className="text-center mb-8">
              {mode === 'signin' && (
                <div className="flex items-center justify-center">
                  <div className="text-8xl animate-bounce">
                    😎
                  </div>
                </div>
              )}
              {mode === 'signup' && (
                <div className="flex items-center justify-center">
                  <div className="text-8xl">
                    🎉
                  </div>
                </div>
              )}
              {mode === 'forgot-password' && (
                <div className="flex items-center justify-center">
                  <div className="text-8xl">
                    🔑
                  </div>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Success message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm"
              >
                {successMessage}
              </motion.div>
            )}

            {/* Forgot password form */}
            {mode === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  primary
                  disabled={loading}
                  className="w-full py-3 text-base font-semibold relative"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Email'
                  )}
                </Button>

                {/* Back to sign in */}
                <div className="mt-6 text-center text-sm text-slate-600">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      resetForm();
                    }}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Sign in/Sign up form */}
            {mode !== 'forgot-password' && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot-password');
                        resetForm();
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                {mode === 'signup' && (
                  <p className="mt-1 text-xs text-slate-500">At least 6 characters</p>
                )}
              </div>

              <Button
                type="submit"
                primary
                disabled={loading}
                className="w-full py-3 text-base font-semibold relative"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    {mode === 'signin' ? 'Signing in...' : 'Signing up...'}
                  </span>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Sign Up'
                )}
              </Button>
            </form>
            )}

            {/* Only show in sign in/sign up mode */}
            {mode !== 'forgot-password' && (
            <>
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">or</span>
              </div>
            </div>

            {/* Google sign in */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full"
                  />
                  Redirecting...
                </>
              ) : (
                <>
                  <IconGoogle className="w-5 h-5" />
                  {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
                </>
              )}
            </button>

            {/* Toggle mode */}
            <div className="mt-6 text-center text-sm text-slate-600">
              {mode === 'signin' ? 'Don\'t have an account?' : 'Already have an account?'}
              <button
                onClick={toggleMode}
                className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {mode === 'signin' ? 'Sign up now' : 'Go to Sign In'}
              </button>
            </div>
            </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Localize error messages
function getErrorMessage(error: any): string {
  const message = error?.message || '';
  
  // Common Supabase errors
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please verify your email first, or contact admin to disable email verification';
  }
  if (message.includes('User already registered')) {
    return 'This email is already registered';
  }
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters';
  }
  if (message.includes('Unable to validate email address')) {
    return 'Invalid email format';
  }
  if (message.includes('Email link is invalid')) {
    return 'Email link is invalid or has expired';
  }
  if (message.includes('User not found')) {
    return 'User not found, please sign up first';
  }
  
  // Display original error message for debugging
  console.error('Auth error:', error);
  return `Operation failed: ${message || 'Unknown error'}`;
}

