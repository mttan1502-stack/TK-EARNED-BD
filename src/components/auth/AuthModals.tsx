import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { X, Lock, Mail, User as UserIcon, Phone, KeyRound, Sparkles, Shield, ArrowRight } from 'lucide-react';

export const AuthModals: React.FC = () => {
  const { authModal, setAuthModal, loginUser, registerUser, loginAdmin, addToast } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRefCode, setRegRefCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Admin login form state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotInfo, setForgotInfo] = useState<string | null>(null);

  if (!authModal) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await loginUser(loginEmail, loginPassword);
    } catch (err: any) {
      addToast('error', err.message || 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      await registerUser({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        referralCode: regRefCode,
      });
    } catch (err: any) {
      addToast('error', err.message || 'Registration failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoggingIn(true);
    try {
      await loginAdmin(adminUsername, adminPassword);
    } catch (err: any) {
      addToast('error', err.message || 'Admin authentication failed.');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setForgotInfo(data.message);
      addToast('info', data.message);
    } catch {
      addToast('error', 'Failed to request password recovery.');
    }
  };

  const autofillDemoUser = () => {
    setLoginEmail('user@example.com');
    setLoginPassword('User123!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setAuthModal(null)}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. USER LOGIN MODAL */}
        {authModal === 'login' && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Welcome Back
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">Log in to your TK EARNED BD account to start completing tasks.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. tanvir@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setAuthModal('forgot')}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? 'Verifying...' : 'Sign In to Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Autofill */}
            <div className="mt-4 p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-300">Demo User Account:</span>
              <button
                type="button"
                onClick={autofillDemoUser}
                className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-2"
              >
                Autofill Demo
              </button>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              Don't have an account yet?{' '}
              <button
                onClick={() => setAuthModal('register')}
                className="text-purple-400 hover:text-purple-300 font-semibold underline"
              >
                Register free
              </button>
              <div className="mt-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setAuthModal('admin_login')}
                  className="text-slate-500 hover:text-purple-400 inline-flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Administrator Portal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. USER REGISTER MODAL */}
        {authModal === 'register' && (
          <div>
            <div className="mb-5">
              <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Join TK EARNED BD
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">Get an instant ৳10 welcome bonus and start earning today.</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. tanvir@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Referral Code (Optional)</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={regRefCode}
                      onChange={(e) => setRegRefCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SULTAN1029"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none uppercase font-mono transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRegistering ? 'Creating Account...' : 'Complete Registration'}
                <Sparkles className="w-4 h-4 text-amber-300" />
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <button
                onClick={() => setAuthModal('login')}
                className="text-purple-400 hover:text-purple-300 font-semibold underline"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* 3. DEDICATED ADMIN LOGIN MODAL */}
        {authModal === 'admin_login' && (
          <div>
            <div className="mb-6">
              <div className="inline-flex p-2.5 rounded-xl bg-purple-500/20 text-purple-400 mb-3 border border-purple-500/30">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">
                Admin Console Authentication
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Restricted access for TK EARNED BD platform operators only.
              </p>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Administrator Username</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Enter admin username"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Security Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdminLoggingIn}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAdminLoggingIn ? 'Verifying Hashes...' : 'Authorize Operator Access'}
                <Shield className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={() => setAuthModal('login')}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Return to User Login
              </button>
            </div>
          </div>
        )}

        {/* 4. FORGOT PASSWORD MODAL */}
        {authModal === 'forgot' && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold tracking-tight text-white">Reset Account Password</h3>
              <p className="text-xs text-slate-400 mt-1">Enter your registered email address to receive recovery verification.</p>
            </div>

            {forgotInfo ? (
              <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs space-y-3">
                <p className="text-purple-200 leading-relaxed">{forgotInfo}</p>
                <button
                  type="button"
                  onClick={() => setAuthModal('login')}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. tanvir@example.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
                >
                  Send Recovery Verification
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setAuthModal('login')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
