/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types.js';
import Logo from './Logo.tsx';
import { Shield, Key, ArrowRight, UserPlus, LogIn, Ship, Briefcase, User, MapPin } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  initialRole?: 'customer' | 'agency';
  initialIsRegistering?: boolean;
}

export default function AuthPage({ onLoginSuccess, initialRole = 'customer', initialIsRegistering = false }: AuthPageProps) {
  const [isRegistering, setIsRegistering] = useState(initialIsRegistering);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'agency'>(initialRole);

  const [isOtpRequested, setIsOtpRequested] = useState(false);
  const [otp, setOtp] = useState('');
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState('');

  // Forgot password flow states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [isForgotOtpSent, setIsForgotOtpSent] = useState(false);

  useEffect(() => {
    setIsRegistering(initialIsRegistering);
    setRole(initialRole);
    setPassword('');
    setConfirmPassword('');
    setIsOtpRequested(false);
    setOtp('');
    setSandboxOtp(null);
    setInfoMessage('');
    setIsForgotPassword(false);
    setForgotEmail('');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setIsForgotOtpSent(false);
  }, [initialRole, initialIsRegistering]);
  
  // Agency specific fields
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Surat');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please input an email address.');
      return;
    }
    if (!password) {
      setError('Please input your password.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please input your registered email address.');
      return;
    }
    setLoading(true);
    setError('');
    setInfoMessage('');
    setSandboxOtp(null);

    try {
      const response = await fetch('/api/auth/forgot-password-send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch password reset OTP.');
      }

      setIsForgotOtpSent(true);
      if (data.simulated && data.sandboxOtp) {
        setSandboxOtp(data.sandboxOtp);
        setInfoMessage('Activated simulated email sandbox (SMTP not set up).');
      } else {
        setInfoMessage(`A 6-digit reset code has been sent to your email: ${forgotEmail}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Email address is required.');
      return;
    }
    if (!forgotOtp) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (!forgotNewPassword) {
      setError('Please enter your new password.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('Passwords do not match. Please verify them.');
      return;
    }
    if (forgotNewPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: forgotOtp.trim(),
          password: forgotNewPassword
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      setInfoMessage('Password reset successfully! You can now sign in with your brand new password.');
      // Back to standard login!
      setIsForgotPassword(false);
      setIsForgotOtpSent(false);
      setEmail(forgotEmail);
      setPassword(forgotNewPassword);
      
      setForgotEmail('');
      setForgotOtp('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setSandboxOtp(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    setInfoMessage('');
    setSandboxOtp(null);
    setOtp('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification OTP.');
      }

      if (data.simulated && data.sandboxOtp) {
        setSandboxOtp(data.sandboxOtp);
        setInfoMessage('New OTP code generated in sandbox simulator.');
      } else {
        setInfoMessage('A fresh verification OTP has been sent to your email.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Full Name and Email are required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify them.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (!isOtpRequested) {
      // Phase 1: Send registration verification OTP code to the email
      setLoading(true);
      setError('');
      setInfoMessage('');
      setSandboxOtp(null);

      try {
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to dispatch verification OTP.');
        }

        setIsOtpRequested(true);
        if (data.simulated && data.sandboxOtp) {
          setSandboxOtp(data.sandboxOtp);
          setInfoMessage('Activated simulated email sandbox (SMTP not set up).');
        } else {
          setInfoMessage(`A verification code was successfully sent to your email address: ${email}`);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to send verification code.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Phase 2: Enter OTP, let user register!
    if (!otp) {
      setError('Please enter the 6-digit registration OTP verification code.');
      return;
    }

    setLoading(true);
    setError('');

    const body: any = {
      name: name.trim(),
      email: email.trim(),
      password,
      otp: otp.trim(),
      role
    };

    if (role === 'agency') {
      body.phone = phone.trim() || '+91 99999 99999';
      body.city = city.trim();
      body.description = description.trim() || 'Premium fleet services and group tours.';
      body.address = address.trim() || 'Main Market Street';
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'OTP verification or registration failed');
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Demo account handlers
  const handleDemoLogin = async (selectedEmail: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail, password: 'password' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12 font-sans bg-sky-50">
      <div className="w-full max-w-md bg-white border border-sky-100 rounded-[32px] p-8 shadow-xl relative overflow-hidden">
        
        {/* Background decorative orange glow blur */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-orange-400/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-teal-450/10 rounded-full blur-xl pointer-events-none" />

        {/* Brand Logo Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" showText={true} textPosition="bottom" className="select-none" />
        </div>

        {infoMessage && (
          <div className="mb-6 p-4 bg-teal-50 text-teal-800 text-xs rounded-2xl border border-teal-200 font-bold flex items-start gap-2.5 shadow-sm">
            <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 shrink-0 animate-pulse" />
            <div className="leading-relaxed">{infoMessage}</div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-orange-50 text-orange-800 text-xs rounded-2xl border border-orange-200 font-bold space-y-3">
            <div>{error}</div>
            {error.toLowerCase().includes('register') && email && (
              <div className="pt-2.5 border-t border-orange-200/50 space-y-2">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-wide">⚡ Sandbox Auto-Register Options:</p>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      setError('');
                      try {
                        const baseName = email.trim().split('@')[0];
                        const formattedName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
                        const res = await fetch('/api/auth/register', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: formattedName,
                            email: email.trim(),
                            role: 'customer',
                            password: 'password'
                          })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Registration failed');
                        onLoginSuccess(data);
                      } catch (err: any) {
                        setError(err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full bg-orange-500 text-white font-black py-2 rounded-xl hover:bg-orange-600 transition text-[10px] uppercase text-center tracking-wider shadow-sm"
                  >
                    Register & Enter as Customer
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      setError('');
                      try {
                        const baseName = email.trim().split('@')[0];
                        const formattedName = baseName.charAt(0).toUpperCase() + baseName.slice(1) + ' Travels';
                        const res = await fetch('/api/auth/register', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: formattedName,
                            email: email.trim(),
                            role: 'agency',
                            password: 'password',
                            phone: '+91 98765 43210',
                            city: 'Surat',
                            description: 'Premium sandbox fleet provider and tourist coach specialists.',
                            address: 'Surat Central Ring Road'
                          })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Registration failed');
                        onLoginSuccess(data);
                      } catch (err: any) {
                        setError(err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full bg-teal-600 text-white font-black py-2 rounded-xl hover:bg-teal-700 transition text-[10px] uppercase text-center tracking-wider shadow-sm"
                  >
                    Register & Enter as Travel Agency
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isForgotPassword ? (
          <div className="space-y-5">
            <div className="flex items-center gap-1.5 mb-2 font-black text-slate-800 text-sm">
              <span className="text-orange-500 font-extrabold text-base">&larr;</span>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setInfoMessage('');
                  setSandboxOtp(null);
                }}
                className="hover:underline hover:text-orange-500 transition uppercase tracking-wider text-[10px]"
              >
                Back to Sign In
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {!isForgotOtpSent 
                ? "Enter your registered email address and we will generate a 6-digit confirmation code to securely update your password." 
                : "A secure reset OTP has been generated. Check your email or use test sandbox code to set your new password."}
            </p>

            {!isForgotOtpSent ? (
              <form onSubmit={handleForgotPasswordSendOtp} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition text-sm font-bold"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-orange-500 text-white font-black py-3.5 px-4 rounded-2xl hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.98] transition-all duration-150 shadow-lg shadow-orange-150 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-60"
                >
                  {loading ? 'Sending reset code...' : 'Send Password Reset Code'}
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordConfirm} className="space-y-4">
                <div className="bg-orange-50/50 border border-orange-100 rounded-[24px] p-5 space-y-4 shadow-sm">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] uppercase font-black text-slate-700 tracking-wider">ENTER 6-DIGIT RESET OTP</label>
                      <button
                        type="button"
                        onClick={handleForgotPasswordSendOtp}
                        disabled={loading}
                        className="text-[10px] font-black uppercase text-orange-600 hover:text-orange-700 hover:underline transition pr-1"
                      >
                        Resend OTP
                      </button>
                    </div>

                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="••••••"
                      className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-orange-200 text-center text-slate-800 text-lg font-mono font-black tracking-[8px] focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition shadow-sm"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    />

                    {sandboxOtp && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] text-amber-900 font-medium space-y-2 text-left">
                        <div className="font-extrabold flex items-center gap-1.5 text-amber-800 uppercase text-[9px] tracking-wider">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                          TEST PASSWORD RESET SANDBOX
                        </div>
                        <p className="leading-relaxed">PRVASIQ logged reset delivery. Auto-copy code to reset instantly:</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="bg-white border border-amber-300 rounded-lg font-mono font-black px-3 py-1.5 text-sm text-slate-800 tracking-widest">{sandboxOtp}</span>
                          <button
                            type="button"
                            onClick={() => setForgotOtp(sandboxOtp)}
                            className="px-3 py-1.5 text-[10px] font-black uppercase text-white bg-slate-850 hover:bg-slate-705 rounded-lg transition active:scale-95 shadow-md shadow-slate-100"
                          >
                            Auto-Fill OTP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition text-sm font-bold"
                    placeholder="••••••••"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition text-sm font-bold"
                    placeholder="••••••••"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-orange-500 text-white font-black py-3.5 px-4 rounded-2xl hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.98] transition-all duration-150 shadow-lg shadow-orange-150 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-60"
                >
                  {loading ? 'Updating Password...' : 'Verify OTP & Reset Password'}
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* Toggle between register / login */}
            <div className="flex border-b border-sky-50 mb-7 font-bold text-sm">
              <button
                onClick={() => {
                  setIsRegistering(false);
                  setError('');
                  setPassword('');
                  setConfirmPassword('');
                  setIsOtpRequested(false);
                  setOtp('');
                  setSandboxOtp(null);
                  setInfoMessage('');
                }}
                className={`flex-1 pb-3 text-center border-b-4 transition-all ${!isRegistering ? 'border-orange-500 text-orange-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsRegistering(true);
                  setError('');
                  setPassword('');
                  setConfirmPassword('');
                  setIsOtpRequested(false);
                  setOtp('');
                  setSandboxOtp(null);
                  setInfoMessage('');
                }}
                className={`flex-1 pb-3 text-center border-b-4 transition-all ${isRegistering ? 'border-orange-500 text-orange-600 font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Create Account
              </button>
            </div>

            {isRegistering ? (
              <form onSubmit={handleRegister} className="space-y-4">
                {isOtpRequested ? (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-[24px] p-5 space-y-4 shadow-sm animation-expand">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                      <span className="text-[10px] uppercase font-black text-emerald-700 tracking-wider">Account Verification Required</span>
                    </div>
                    
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      We've generated a 6-digit verification code and queued it for <strong className="text-slate-800">{email}</strong>.
                    </p>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5 shadow-sm">
                      <div className="text-[9px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Registration Summary</div>
                      <div><strong>Name:</strong> {name}</div>
                      <div><strong>Email:</strong> {email}</div>
                      <div><strong>Role:</strong> {role === 'agency' ? 'Travel Agency' : 'Customer'}</div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-black text-slate-700 tracking-wider">ENTER 6-DIGIT OTP</label>
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={loading}
                          className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 hover:underline transition pr-1"
                        >
                          Resend OTP Code
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="••••••"
                        className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-emerald-200 text-center text-slate-800 text-lg font-mono font-black tracking-[8px] focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition shadow-sm"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      />

                      {sandboxOtp && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] text-amber-900 font-medium space-y-2">
                          <div className="font-extrabold flex items-center gap-1.5 text-amber-800 uppercase text-[9px] tracking-wider">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                            TEST SANDBOX MODE (SMTP NOT CONFIGURED)
                          </div>
                          <p className="leading-relaxed">PRVASIQ logged delivery. Auto-copy this sandbox OTP code to verify instantly:</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="bg-white border border-amber-300 rounded-lg font-mono font-black px-3 py-1.5 text-sm text-slate-800 tracking-widest">{sandboxOtp}</span>
                            <button
                              type="button"
                              onClick={() => setOtp(sandboxOtp)}
                              className="px-3 py-1.5 text-[10px] font-black uppercase text-white bg-slate-850 hover:bg-slate-705 rounded-lg transition active:scale-95 shadow-md shadow-slate-100"
                            >
                              Auto-Fill OTP
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOtpRequested(false);
                          setOtp('');
                          setSandboxOtp(null);
                          setInfoMessage('');
                          setError('');
                        }}
                        className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition"
                      >
                        &larr; Correct Details / Go Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition text-sm font-bold"
                        placeholder="Rohan Sharma / Vikram Travels"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition text-sm font-bold"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition text-sm font-bold"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        required
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition text-sm font-bold"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">Register as:</label>
                      <div className="grid grid-cols-2 gap-3 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setRole('customer')}
                          className={`flex items-center justify-center gap-2 p-3 text-xs border rounded-2xl font-extrabold transition duration-200 ${role === 'customer' ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-100' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                        >
                          <User className="w-4 h-4" />
                          Customer
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('agency')}
                          className={`flex items-center justify-center gap-2 p-3 text-xs border rounded-2xl font-extrabold transition duration-200 ${role === 'agency' ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-100' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                        >
                          <Briefcase className="w-4 h-4" />
                          Travel Agency
                        </button>
                      </div>
                    </div>

                    {role === 'agency' && (
                      <div className="space-y-4 pt-4 border-t border-sky-50 animation-expand">
                        <div className="text-[10px] font-black text-teal-600 tracking-wider uppercase mb-1">Agency Setup parameters</div>
                        
                        <div>
                          <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">Contact Number</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition text-sm font-bold"
                            placeholder="+91 98XXX XXXXX"
                            required={role === 'agency'}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">Primary Base City</label>
                          <select
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition text-sm font-bold bg-white"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          >
                            <option value="Surat">Surat</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Goa">Goa</option>
                            <option value="Mumbai">Mumbai</option>
                            <option value="Bangalore">Bangalore</option>
                            <option value="Jaipur">Jaipur</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">Company Description</label>
                          <textarea
                            rows={2}
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition text-sm font-bold"
                            placeholder="Briefly describe your fleet services..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">Office Address</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition text-sm font-bold"
                            placeholder="Office floor, Market complex, landmark..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-orange-500 text-white font-black py-3.5 px-4 rounded-2xl hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.98] transition-all duration-150 shadow-lg shadow-orange-150 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isOtpRequested ? (
                    loading ? 'Verifying...' : 'Verify OTP & Create Account'
                  ) : (
                    loading ? 'Sending Code...' : 'Send Verification OTP'
                  )}
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition text-sm font-bold"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center ml-1 mb-1">
                    <label className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setInfoMessage('');
                        setIsForgotPassword(true);
                        if (email) setForgotEmail(email);
                        setForgotOtp('');
                        setIsForgotOtpSent(false);
                        setSandboxOtp(null);
                      }}
                      className="text-[10px] font-bold text-orange-500 hover:text-orange-600 hover:underline transition"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition text-sm font-bold"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-orange-500 text-white font-black py-3.5 px-4 rounded-2xl hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.98] transition-all duration-150 shadow-lg shadow-orange-150 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  {loading ? 'Verifying...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </form>
            )}
          </>
        )}



      </div>
    </div>
  );
}
