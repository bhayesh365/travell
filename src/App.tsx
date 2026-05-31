/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile } from './types.js';
import AuthPage from './components/AuthPage.tsx';
import CustomerDashboard from './components/CustomerDashboard.tsx';
import AgencyDashboard from './components/AgencyDashboard.tsx';
import Logo from './components/Logo.tsx';
import { Truck, Shield, HelpCircle, Star, Users } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activePortal, setActivePortal] = useState<'landing' | 'app'>('landing');
  const [authRole, setAuthRole] = useState<'customer' | 'agency'>('customer');
  const [authRegister, setAuthRegister] = useState<boolean>(false);

  // Check if session exists on boot
  useEffect(() => {
    const saved = localStorage.getItem('travel_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
        setActivePortal('app');
      } catch (e) {
        localStorage.removeItem('travel_user');
      }
    }
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('travel_user', JSON.stringify(user));
    setActivePortal('app');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('travel_user');
    setActivePortal('landing');
  };

  // Demo shortcut handler
  const triggerDemoAccount = (role: 'customer' | 'agency') => {
    const demoEmail = role === 'customer' ? 'rohan@example.com' : 'surat.travels@example.com';
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoEmail, password: 'password' }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          handleLoginSuccess(data);
        }
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="min-h-screen bg-sky-50 text-slate-900 font-sans flex flex-col justify-between">
      


      {/* TOP DECORATIVE APP NAVBAR */}
      <nav className="h-16 bg-white border-b border-sky-100 px-4 sm:px-8 flex items-center justify-between shadow-sm shrink-0 sticky top-0 z-40">
        <div 
          onClick={() => { if (!currentUser) setActivePortal('landing'); }}
          className="cursor-pointer hover:opacity-90 transition select-none"
        >
          <Logo size="md" showText={true} textPosition="right" />
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          {currentUser && (
            <span className="bg-teal-50 px-3 py-1.5 text-[10px] uppercase font-black text-teal-850 rounded-full border border-teal-100">
              Logged in: {currentUser.role === 'customer' ? 'Customer' : 'Travel Agency'}
            </span>
          )}
          
          {!currentUser && (
            <button 
              onClick={() => {
                setAuthRole('customer');
                setAuthRegister(false);
                setActivePortal('app');
              }}
              className="bg-teal-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-teal-100 hover:bg-teal-700 transition"
            >
              Launch Portal
            </button>
          )}
        </div>
      </nav>

      {/* PORTAL ROUTER */}
      <main className="flex-grow">
        {activePortal === 'landing' && !currentUser ? (
          
          /* IMMERSIVE LANDING PAGE FOR PUBLIC VISIBILITY */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <span className="text-xs font-black bg-orange-100 text-orange-700 px-4 py-2 rounded-full border border-orange-200 uppercase tracking-wider block w-fit">
                Group Tour Solutions • B2B & B2C
              </span>
              
              <h1 className="text-4xl sm:text-5xl font-display font-black text-slate-900 tracking-tight leading-none">
                Don't stress about group logistics. <span className="text-orange-500">Find buses</span> in any city.
              </h1>
              
              <p className="text-slate-500 text-base leading-relaxed">
                Traveling with 20+ family members from Surat to Delhi? Easily hire regional tempo travellers and private luxury motorcoaches. Compare transparent quotes, chat with fleet managers, and map out itinerary enroute with our Gemini AI Companion.
              </p>

              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-sky-100">
                <div>
                  <span className="text-xl font-black font-display text-slate-900 block leading-none underline decoration-orange-500 decoration-2">7 ➔ 56 Seats</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Exact Capacities</span>
                </div>
                <div>
                  <span className="text-xl font-black font-display text-slate-900 block leading-none underline decoration-teal-500 decoration-2">Zero Commission</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Direct Agency Chat</span>
                </div>
                <div>
                  <span className="text-xl font-black font-display text-slate-900 block leading-none">AI Assisted</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Itinerary Assistant</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setAuthRole('customer');
                    setAuthRegister(false);
                    setActivePortal('app');
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-8 rounded-2xl transition duration-200 text-xs shadow-lg shadow-orange-150 text-center uppercase tracking-wider active:scale-95"
                >
                  Locate travel vehicles
                </button>
                <button
                  onClick={() => {
                    if (currentUser) {
                      setActivePortal('app');
                    } else {
                      setAuthRole('agency');
                      setAuthRegister(true);
                      setActivePortal('app');
                    }
                  }}
                  className="bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 font-bold py-4 px-8 rounded-2xl transition duration-200 text-xs text-center uppercase tracking-wider active:scale-95"
                >
                  Register Travels Agency
                </button>
              </div>
            </div>

            {/* Aesthetic Visual Side */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-[32px] border border-white shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wider">Recommended Vehicle capacities</span>
                </div>

                <div className="space-y-2">
                  {[
                    { label: '7 Seater', desc: 'SUV / Crysta - Small family, airport runs', rate: '₹14/km', isTeal: true },
                    { label: '12 Seater', desc: 'Tempo Traveller - Group weekend trips', rate: '₹18/km', isTeal: false },
                    { label: '25 Seater', desc: 'Group Mini Bus - Weddings, industrial tours', rate: '₹32/km', isTeal: true },
                    { label: '56 Seater', desc: 'Volvo Multi-axle coach - Grand highway tour', rate: '₹65/km', isTeal: false }
                  ].map((v, i) => (
                    <div key={i} className={`flex justify-between items-center p-4 rounded-3xl border text-xs transition duration-200 ${v.isTeal ? 'border-teal-100 bg-teal-50/20 hover:border-teal-200' : 'border-orange-100 bg-orange-50/25 hover:border-orange-200'}`}>
                      <div>
                        <span className="font-black text-slate-800">{v.label}</span>
                        <p className="text-[10px] text-slate-400 font-bold">{v.desc}</p>
                      </div>
                      <span className={`font-black font-mono text-sm ${v.isTeal ? 'text-teal-600' : 'text-orange-500'}`}>{v.rate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          
          /* ACTIVE USER WORKSPACE */
          <div className="transition-all duration-300">
            {!currentUser ? (
              <AuthPage 
                onLoginSuccess={handleLoginSuccess} 
                initialRole={authRole}
                initialIsRegistering={authRegister}
              />
            ) : currentUser.role === 'customer' ? (
              <CustomerDashboard user={currentUser} onLogout={handleLogout} />
            ) : (
              <AgencyDashboard user={currentUser} onLogout={handleLogout} />
            )}
          </div>

        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Prvasiq Logistics Ltd. All rights reserved.</p>
          <span className="text-[10px] block mt-1">Full-Stack B2B + B2C Private Transport Vehicle Network Solution</span>
        </div>
      </footer>

    </div>
  );
}

