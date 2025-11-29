import React, { useState, useEffect } from 'react';
import { SHOPPING_URL } from '../../constants';
import { supabase } from '../../lib/supabaseClient';
import BlockchainTracker from '../../components/BlockchainTracker';

interface DashboardProps {
  onLogout?: () => void;
}

const UserDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [profile, setProfile] = useState<any>(null);
  const [wasteInput, setWasteInput] = useState('');
  const [wasteType, setWasteType] = useState('Flower Waste');
  const [volunteerStatus, setVolunteerStatus] = useState<string>('NONE');
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'HISTORY'>('DASHBOARD');
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ');

  const extractVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    fetchProfile();
    fetchHistory();
    fetchVideo();
  }, []);

  const fetchVideo = async () => {
    const { data } = await supabase.from('flash_updates').select('*').eq('type', 'VIDEO_CONFIG').single();
    if (data && data.content) {
      const id = extractVideoId(data.content);
      if (id) setVideoId(id);
    }
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      if (data.volunteer_status) {
        setVolunteerStatus(data.volunteer_status);
      }
    }
  };

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Removed .order() to avoid Firestore index requirement.
      const { data } = await supabase
        .from('waste_logs')
        .select('*')
        .eq('user_id', user.id);
      
      const sortedData = (data || []).sort((a: any, b: any) => 
         new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setHistory(sortedData);
    }
  };

  const generateFakeHash = () => {
    return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const handleSubmitWaste = async () => {
    const amount = parseFloat(wasteInput);
    if (!amount || amount <= 0) {
      alert("Please enter a valid weight in Kg.");
      return;
    }

    const earnedCoins = Math.floor(amount * 10);
    const newCoins = (profile.green_coins || 0) + earnedCoins;
    const newWaste = (profile.waste_donated_kg || 0) + amount;

    // 1. Update Profile Totals
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ green_coins: newCoins, waste_donated_kg: newWaste })
      .eq('id', profile.id);

    // 2. Insert Log Entry
    const { error: logError } = await supabase
      .from('waste_logs')
      .insert([{
        user_id: profile.id,
        amount_kg: amount,
        waste_type: wasteType,
        status: 'COLLECTED',
        blockchain_hash: generateFakeHash()
      }]);

    if (profileError || logError) {
      alert("Error updating record");
      console.error(profileError, logError);
    } else {
      setProfile({ ...profile, green_coins: newCoins, waste_donated_kg: newWaste });
      setWasteInput('');
      fetchHistory(); // Refresh history
      alert(`Success! You logged ${amount}kg of ${wasteType}. You earned ${earnedCoins} Green Coins!`);
    }
  };

  const handleRedeem = async (type: 'SHOP' | 'DARSHAN') => {
    if (type === 'DARSHAN') {
      if (profile.green_coins < 50) {
        alert("You need at least 50 Green Coins for a free Darshan pass.");
        return;
      }
      const confirm = window.confirm("Redeem 50 coins for a Free Darshan Pass?");
      if (confirm) {
        const newCoins = profile.green_coins - 50;
        const { error } = await supabase.from('profiles').update({ green_coins: newCoins }).eq('id', profile.id);
        
        if (!error) {
          setProfile({...profile, green_coins: newCoins});
          alert("Coupon Code generated: DARSHAN-2025-FREE. Show this at the temple entrance.");
        }
      }
    }
  };

  const handleVolunteerRequest = async () => {
    if (volunteerStatus !== 'NONE') return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ volunteer_status: 'PENDING' })
      .eq('id', profile.id);

    if (error) {
      alert("Error sending request.");
      console.error(error);
    } else {
      setVolunteerStatus('PENDING');
      alert("Volunteer Request Sent to Admin!");
    }
  };

  if (!profile) return <div className="p-10 text-center">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-200 mb-8 flex flex-col md:flex-row items-center gap-8 relative">
           <button 
             onClick={onLogout}
             className="absolute top-4 right-4 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-100 md:hidden"
           >
             Logout
           </button>
           <div className="relative">
             <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-4xl">👤</div>
             <span className="absolute bottom-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-full border-2 border-white">Lvl 3</span>
           </div>
           <div className="flex-1 text-center md:text-left">
             <h1 className="text-3xl font-bold text-stone-800">{profile.full_name || 'Devotee'}</h1>
             <p className="text-stone-500">Devotee • Eco-Warrior</p>
             {volunteerStatus === 'APPROVED' && (
               <span className="inline-block mt-2 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-bold border border-purple-200">
                 Verified Sevak (Volunteer)
               </span>
             )}
           </div>
           <div className="flex gap-4">
             <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-center min-w-[120px] transition-all hover:scale-105">
               <div className="text-2xl font-bold text-yellow-600">{profile.green_coins}</div>
               <div className="text-xs font-bold text-yellow-700 uppercase">Green Coins</div>
             </div>
             <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center min-w-[120px] transition-all hover:scale-105">
               <div className="text-2xl font-bold text-orange-600">{profile.waste_donated_kg || 0} kg</div>
               <div className="text-xs font-bold text-orange-700 uppercase">Waste Given</div>
             </div>
           </div>
           <button 
             onClick={onLogout}
             className="hidden md:block ml-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 border border-red-200"
           >
             Logout
           </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-6 border-b border-stone-200 mb-6">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`pb-2 text-sm font-bold ${activeTab === 'DASHBOARD' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-500'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`pb-2 text-sm font-bold ${activeTab === 'HISTORY' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-500'}`}
          >
            Traceability & History
          </button>
        </div>

        {activeTab === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Left Column */}
             <div className="space-y-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                 <h2 className="font-bold text-xl mb-4">Log Household Waste</h2>
                 <div className="flex gap-2">
                   <select 
                     value={wasteType}
                     onChange={(e) => setWasteType(e.target.value)}
                     className="border rounded-lg p-2 flex-1 bg-stone-50"
                   >
                     <option>Flower Waste</option>
                     <option>Incense Ash</option>
                     <option>Paper/Packaging</option>
                   </select>
                   <input 
                     type="number" 
                     value={wasteInput}
                     onChange={(e) => setWasteInput(e.target.value)}
                     placeholder="Kg" 
                     className="w-20 border rounded-lg p-2" 
                   />
                 </div>
                 <button 
                   onClick={handleSubmitWaste}
                   className="w-full mt-4 bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 transition-colors"
                 >
                   Submit Record
                 </button>
                 <p className="text-xs text-stone-400 mt-2 text-center">1 Kg Waste = 10 Green Coins</p>
               </div>

               <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-xl shadow-lg text-white">
                 <h2 className="font-bold text-xl mb-2">Redeem Rewards</h2>
                 <p className="text-green-100 text-sm mb-4">Use coins for discounts or darshan tickets.</p>
                 <div className="flex gap-2">
                   <a 
                     href={SHOPPING_URL} 
                     target="_blank" 
                     rel="noreferrer" 
                     className="flex-1 bg-white text-green-700 py-2 rounded-lg font-bold text-center text-sm hover:bg-green-50 transition-colors"
                   >
                     Buy Products
                   </a>
                   <button 
                     onClick={() => handleRedeem('DARSHAN')}
                     className="flex-1 bg-green-800 text-white py-2 rounded-lg font-bold text-sm hover:bg-green-900 transition-colors"
                   >
                     Free Darshan
                   </button>
                 </div>
               </div>
             </div>

             {/* Right Column */}
             <div className="space-y-6">
                {/* Educational Video */}
                <div className="bg-stone-900 rounded-xl overflow-hidden shadow-lg border border-stone-800">
                  <div className="p-4 border-b border-stone-800 bg-black/50">
                    <h3 className="text-white font-bold flex items-center gap-2">
                      <span className="text-orange-500">▶</span> Educational Corner
                    </h3>
                  </div>
                  <div className="aspect-video bg-black relative">
                     {/* THUMBNAIL + REDIRECT LINK */}
                     <a 
                       href={`https://www.youtube.com/watch?v=${videoId}`} 
                       target="_blank" 
                       rel="noreferrer"
                       className="block w-full h-full relative group cursor-pointer"
                     >
                        <img 
                          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                          alt="Video Thumbnail" 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                           </div>
                        </div>
                     </a>
                  </div>
                  <div className="p-4 text-xs text-stone-400">
                    Learn how to keep temple premises clean and segregate waste properly.
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                   <h2 className="font-bold text-xl mb-4">Volunteer Program</h2>
                   <p className="text-stone-600 text-sm mb-4">Become a Sevak. Admin will verify and assign you to a nearby temple.</p>
                   
                   {volunteerStatus === 'PENDING' && (
                     <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-center font-bold border border-yellow-200">
                       ⏳ Verification Pending
                     </div>
                   )}

                   {volunteerStatus === 'APPROVED' && (
                     <div className="bg-green-50 text-green-800 p-4 rounded-lg text-center font-bold border border-green-200">
                       ✅ You are a Verified Volunteer
                     </div>
                   )}

                   {volunteerStatus === 'NONE' && (
                     <>
                       <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                         <input type="checkbox" id="volunteer" className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" />
                         <label htmlFor="volunteer" className="text-sm font-medium cursor-pointer">I agree to volunteer for 4 hours/week</label>
                       </div>
                       <button 
                         onClick={handleVolunteerRequest}
                         className="mt-4 w-full border border-stone-300 py-2 rounded-lg font-semibold hover:bg-stone-50"
                       >
                         Request Verification
                       </button>
                     </>
                   )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="space-y-4">
             {history.length === 0 ? (
               <div className="text-center py-10 text-stone-500">No waste contributions recorded yet.</div>
             ) : (
               history.map((item) => (
                 <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                    <div className="flex justify-between mb-4">
                       <div>
                         <h3 className="font-bold text-stone-800">{item.waste_type}</h3>
                         <p className="text-xs text-stone-500">{new Date(item.created_at).toLocaleString()}</p>
                       </div>
                       <div className="text-right">
                         <div className="font-bold text-orange-600">{item.amount_kg} kg</div>
                         <div className="text-xs font-bold text-green-600">+{Math.floor(item.amount_kg * 10)} Coins</div>
                       </div>
                    </div>
                    {/* Blockchain Visualizer */}
                    <BlockchainTracker status={item.status} hash={item.blockchain_hash} />
                 </div>
               ))
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;