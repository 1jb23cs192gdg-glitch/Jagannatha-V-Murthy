import React, { useState } from 'react';
import { UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { BowArrowLogo } from '../constants';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>(UserRole.PERSON);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async () => {
    setErrorMsg(null);
    setLoading(true);

    const email = formData.email.trim().toLowerCase();
    const password = formData.password.trim();
    const fullName = formData.fullName.trim();

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      let user = null;
      let session = null;

      if (isRegistering) {
        // --- SIGN UP ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: activeTab }
          }
        });
        if (error) throw error;
        user = data.user;
        session = data.session;

        // Create Profile (Mock DB)
        if (user) {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: email,
            full_name: fullName || 'New User',
            role: activeTab,
            green_coins: 0,
            waste_donated_kg: 0,
            volunteer_status: 'NONE'
          });

          // Create Temple if needed
          if (activeTab === UserRole.TEMPLE) {
             await supabase.from('temples').insert([{
               owner_id: user.id,
               name: fullName,
               location: 'Local Temple',
               waste_donated_kg: 0,
               green_stars: 0
             }]);
          }
        }
      } else {
        // --- LOGIN ---
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        user = data.user;
        session = data.session;
      }

      if (user) {
        // Persist Mock Session
        localStorage.setItem('temple_mock_session', JSON.stringify(user));
        
        // Fetch Role for Redirect
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const role = profile?.role || activeTab;

        alert(isRegistering ? "Account Created! Welcome." : "Login Successful!");

        // Redirect based on role
        switch (role) {
          case UserRole.ADMIN: navigate('/admin-dashboard'); break;
          case UserRole.TEMPLE: navigate('/temple-dashboard'); break;
          case UserRole.NGO: navigate('/ngo-dashboard'); break;
          case UserRole.PERSON: navigate('/user-dashboard'); break;
          default: navigate('/');
        }
      }

    } catch (error: any) {
      console.error("Auth Error:", error);
      setErrorMsg(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get placeholder based on role
  const getEmailPlaceholder = () => {
    switch(activeTab) {
      case UserRole.ADMIN: return "admin@demo.com";
      case UserRole.TEMPLE: return "temple@demo.com";
      case UserRole.NGO: return "ngo@demo.com";
      default: return "user@demo.com";
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex overflow-hidden min-h-[600px]">
        {/* Left Side - Visuals */}
        <div className="hidden lg:flex w-1/2 bg-stone-900 relative items-center justify-center overflow-hidden">
          <img src="https://images.unsplash.com/photo-1542397284385-6010376c5337?q=80&w=1000&auto=format&fit=crop" alt="Temple" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="relative z-10 text-center text-white p-12">
            <div className="w-32 h-32 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-white/20">
              <BowArrowLogo className="w-20 h-20" color="white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Temple to Ayurveda</h2>
            <p className="text-stone-300 text-lg">
              Join the sacred mission to transform devotion into sustainability.
            </p>
          </div>
          <div className="absolute bottom-0 w-full p-6 text-center text-white/30 text-xs">
            © 2025 SIH Innovation (Demo Mode)
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
             <div className="lg:hidden w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BowArrowLogo className="w-10 h-10" color="white" />
             </div>
             <h2 className="text-3xl font-bold text-stone-800">{isRegistering ? 'Join Us' : 'Welcome Back'}</h2>
             <p className="text-stone-500 mt-2">Select your role to access the portal</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[UserRole.PERSON, UserRole.TEMPLE, UserRole.NGO, UserRole.ADMIN].map((role) => (
              <button
                key={role}
                onClick={() => { setActiveTab(role); setErrorMsg(null); }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  activeTab === role 
                    ? 'bg-orange-600 text-white border-orange-600 shadow-md transform scale-105' 
                    : 'bg-white text-stone-500 border-stone-200 hover:border-orange-300 hover:text-orange-500'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="space-y-5 max-w-sm mx-auto w-full">
            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">
                  {activeTab === UserRole.TEMPLE ? 'Temple Name' : 'Full Name'}
                </label>
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="block w-full rounded-xl border-stone-200 bg-stone-50 p-3 text-stone-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                  placeholder="Enter Name" 
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="block w-full rounded-xl border-stone-200 bg-stone-50 p-3 text-stone-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                placeholder={getEmailPlaceholder()} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">Password</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="block w-full rounded-xl border-stone-200 bg-stone-50 p-3 text-stone-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
                placeholder="••••••••" 
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            <button 
              onClick={handleAuth}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold transition-all shadow-xl shadow-orange-200 bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed mt-4`}
            >
              {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Access Portal')}
            </button>

            <div className="text-center mt-6">
               <button onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(null); }} className="text-sm text-stone-500 hover:text-orange-600 font-medium transition-colors">
                 {isRegistering ? 'Already have an account? Login' : 'New here? Create an account'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;