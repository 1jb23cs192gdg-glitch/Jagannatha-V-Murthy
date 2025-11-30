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

          // Create Temple entry ONLY if registering as Temple
          if (activeTab === UserRole.TEMPLE) {
             const { error: templeError } = await supabase.from('temples').insert([{
               owner_id: user.id,
               name: fullName || 'My New Temple',
               location: 'Location Pending',
               waste_donated_kg: 0,
               green_stars: 1,
               description: 'New temple joining the network.'
             }]);
             if (templeError) console.error("Error creating temple:", templeError);
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
        
        // Fetch Profile to get authoritative Role
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        // If registering, trust activeTab. If logging in, trust profile role.
        const role = isRegistering ? activeTab : (profile?.role || activeTab);

        // Notify parent App component
        onLogin({...user, role: role});

        // Redirect based on role
        if (role === UserRole.ADMIN) navigate('/admin-dashboard');
        else if (role === UserRole.TEMPLE) navigate('/temple-dashboard');
        else if (role === UserRole.NGO) navigate('/ngo-dashboard');
        else navigate('/user-dashboard');
      }

    } catch (error: any) {
      console.error("Auth Error:", error);
      setErrorMsg(typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error));
    } finally {
      setLoading(false);
    }
  };

  // Helper to get placeholder based on role
  const getEmailPlaceholder = () => {
    switch(activeTab) {
      case UserRole.ADMIN: return "admin@demo.com";
      case UserRole.TEMPLE: return "kashi@temple.com";
      case UserRole.NGO: return "ngo@demo.com";
      default: return "user@demo.com";
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://www.mypuritour.com/wp-content/uploads/2022/10/mypuritourservice-1536x1020.jpg" 
          alt="Temple Background" 
          className="w-full h-full object-cover scale-105 animate-[pulse_60s_infinite]"
        />
        {/* Dark futuristic overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-stone-900/80 to-stone-900/50 backdrop-blur-[2px]"></div>
      </div>

      {/* Futuristic Glass Card */}
      <div className="relative z-10 w-full max-w-md bg-stone-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl ring-1 ring-white/20 animate-fade-in-up">
        
        {/* Logo & Header */}
        <div className="text-center mb-8">
           <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30 mb-4 ring-2 ring-white/20">
              <BowArrowLogo className="w-10 h-10 text-white" />
           </div>
           <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
             {isRegistering ? 'Initialize Identity' : 'Access Portal'}
           </h2>
           <p className="text-stone-300 text-sm mt-2 font-light tracking-wide">
             Temple to Ayurveda Ecosystem v2.0
           </p>
        </div>

        {/* Role Segmented Control */}
        <div className="bg-black/40 p-1 rounded-xl mb-6 flex justify-between border border-white/5 shadow-inner">
          {[UserRole.PERSON, UserRole.TEMPLE, UserRole.NGO, UserRole.ADMIN].map((role) => (
             <button
               key={role}
               onClick={() => { setActiveTab(role); setErrorMsg(null); }}
               className={`flex-1 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                 activeTab === role 
                   ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg' 
                   : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
               }`}
             >
               {role}
             </button>
          ))}
        </div>

        {/* Form Inputs */}
        <div className="space-y-5">
           {isRegistering && (
             <div className="group">
               <label className="block text-xs font-bold text-orange-400 uppercase tracking-wide mb-1 ml-1 group-focus-within:text-orange-300 transition-colors">
                 {activeTab === UserRole.TEMPLE ? 'Temple Name' : 'Full Name'}
               </label>
               <input 
                 type="text" 
                 value={formData.fullName}
                 onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                 className="block w-full rounded-xl border border-stone-600 bg-stone-800/50 p-3 text-white placeholder-stone-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all shadow-inner"
                 placeholder="Enter Identity"
               />
             </div>
           )}
           
           <div className="group">
             <label className="block text-xs font-bold text-orange-400 uppercase tracking-wide mb-1 ml-1 group-focus-within:text-orange-300 transition-colors">
               Email Address
             </label>
             <input 
               type="email" 
               value={formData.email}
               onChange={(e) => setFormData({...formData, email: e.target.value})}
               className="block w-full rounded-xl border border-stone-600 bg-stone-800/50 p-3 text-white placeholder-stone-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all shadow-inner"
               placeholder={getEmailPlaceholder()}
             />
           </div>

           <div className="group">
             <label className="block text-xs font-bold text-orange-400 uppercase tracking-wide mb-1 ml-1 group-focus-within:text-orange-300 transition-colors">
               Passcode
             </label>
             <input 
               type="password" 
               value={formData.password}
               onChange={(e) => setFormData({...formData, password: e.target.value})}
               className="block w-full rounded-xl border border-stone-600 bg-stone-800/50 p-3 text-white placeholder-stone-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all shadow-inner"
               placeholder="••••••••"
             />
           </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-xs rounded-lg font-semibold flex items-center gap-2 animate-shake">
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        <button 
          onClick={handleAuth}
          disabled={loading}
          className="w-full mt-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 shadow-lg shadow-orange-900/20 border border-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            isRegistering ? 'Establish Connection' : 'Enter System'
          )}
        </button>

        <div className="text-center mt-6">
           <button 
             onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(null); }} 
             className="text-sm text-stone-400 hover:text-orange-400 font-medium transition-colors"
           >
             {isRegistering ? 'Already have an ID? Login' : 'New user? Create Identity'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default Login;