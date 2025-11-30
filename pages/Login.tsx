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
        localStorage.setItem('temple_mock_session', JSON.stringify(user));
        
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const role = profile?.role || activeTab;

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
      setErrorMsg(typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error));
    } finally {
      setLoading(false);
    }
  };

  const getEmailPlaceholder = () => {
    switch(activeTab) {
      case UserRole.ADMIN: return "admin@demo.com";
      case UserRole.TEMPLE: return "temple@demo.com";
      case UserRole.NGO: return "ngo@demo.com";
      default: return "user@demo.com";
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://wallpaperaccess.com/full/504997.jpg" 
          alt="Temple Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-stone-900/60 to-black/80 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-hidden min-h-[650px] animate-fade-in-up">
        
        {/* Left Side: Brand & Visuals */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-between bg-black/30 backdrop-blur-md border-r border-white/10 text-white relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500"></div>
           
           <div>
             <div className="flex items-center gap-3 mb-8">
                <div className="bg-orange-600/90 p-2 rounded-lg shadow-lg shadow-orange-500/30">
                  <BowArrowLogo className="w-8 h-8" color="white" />
                </div>
                <h1 className="text-2xl font-bold tracking-wide">Temple<span className="text-orange-400">2</span>Ayurveda</h1>
             </div>
             
             <h2 className="text-5xl font-bold leading-tight mb-6">
               Transforming <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">Devotion</span> into <br/>
               Sustainability
             </h2>
             <p className="text-stone-300 text-lg max-w-md">
               Join the ecosystem where AI, IoT, and ancient wisdom converge to turn sacred offerings into renewable resources.
             </p>
           </div>

           <div className="space-y-4 mt-12 md:mt-0">
             <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
               <div className="text-2xl">🌿</div>
               <div>
                 <p className="font-bold text-sm">Eco-Friendly Login</p>
                 <p className="text-xs text-stone-400">Secure access for Temples, NGOs & People</p>
               </div>
             </div>
           </div>
           
           <div className="text-xs text-stone-500 mt-8">
             &copy; 2025 SIH Innovation. Secure Environment.
           </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 bg-stone-900/80 backdrop-blur-xl p-10 flex flex-col justify-center relative">
          
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-2">{isRegistering ? 'Create Account' : 'Welcome Back'}</h3>
            <p className="text-stone-400 text-sm">Choose your role to continue</p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-4 gap-2 mb-8 bg-black/40 p-1 rounded-xl">
            {[UserRole.PERSON, UserRole.TEMPLE, UserRole.NGO, UserRole.ADMIN].map((role) => (
              <button
                key={role}
                onClick={() => { setActiveTab(role); setErrorMsg(null); }}
                className={`py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === role 
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg' 
                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {isRegistering && (
              <div className="group">
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1 ml-1 group-focus-within:text-orange-500 transition-colors">
                  {activeTab === UserRole.TEMPLE ? 'Temple Name' : 'Full Name'}
                </label>
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="block w-full rounded-xl bg-black/40 border border-stone-700 text-white p-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder-stone-600" 
                  placeholder="Enter Name" 
                />
              </div>
            )}
            
            <div className="group">
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1 ml-1 group-focus-within:text-orange-500 transition-colors">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="block w-full rounded-xl bg-black/40 border border-stone-700 text-white p-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder-stone-600" 
                placeholder={getEmailPlaceholder()} 
              />
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-stone-500 uppercase mb-1 ml-1 group-focus-within:text-orange-500 transition-colors">Password</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="block w-full rounded-xl bg-black/40 border border-stone-700 text-white p-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder-stone-600" 
                placeholder="••••••••" 
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-xs rounded-lg font-medium text-center">
                {errorMsg}
              </div>
            )}

            <button 
              onClick={handleAuth}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-xl shadow-orange-900/20 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Processing...
                </span>
              ) : (
                isRegistering ? 'Create Account' : 'Access Portal'
              )}
            </button>

            <div className="text-center pt-4">
               <button onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(null); }} className="text-sm text-stone-400 hover:text-white transition-colors">
                 {isRegistering ? 'Already have an account?' : 'New here?'}{' '}
                 <span className="text-orange-500 font-bold underline decoration-2 underline-offset-4">{isRegistering ? 'Login' : 'Create Account'}</span>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;