
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { User, Order, Notification, FlashUpdate } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface DashboardProps {
  onLogout?: () => void;
}

const UserDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SUBMIT' | 'WALLET' | 'ORDERS' | 'NOTIFICATIONS' | 'PROFILE'>('DASHBOARD');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Submit Waste
  const [wasteInput, setWasteInput] = useState({ type: 'Flower Waste', amount: '', photo: null as string | null });
  
  // Data
  const [history, setHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [adminUpdates, setAdminUpdates] = useState<FlashUpdate[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchUpdates();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchHistory();
      fetchOrders();
      fetchNotifications();
    }
  }, [profile]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
  };

  const fetchHistory = async () => {
    if(!profile) return;
    const { data } = await supabase.from('waste_logs').select('*').eq('user_id', profile.id);
    if(data) {
        setHistory(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        const agg: {[key:string]: number} = {};
        data.forEach((item: any) => {
          if (item.status === 'VERIFIED') {
             agg[item.waste_type] = (agg[item.waste_type] || 0) + item.amount_kg;
          }
        });
        setChartData(Object.keys(agg).map(k => ({ name: k, value: agg[k] })));
    }
  };

  const fetchOrders = async () => {
    if(!profile) return;
    const { data } = await supabase.from('orders').select('*').eq('user_id', profile.id);
    if(data) setOrders(data);
  };

  const fetchNotifications = async () => {
    if(!profile) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id);
    if(data) setNotifications(data);
  };

  const fetchUpdates = async () => {
    const { data } = await supabase.from('flash_updates').select('*').order('created_at', { ascending: false });
    if (data) {
      const relevant = data.filter(d => d.type !== 'VIDEO_CONFIG' && (d.audience === 'USER' || d.audience === 'ALL'));
      setAdminUpdates(relevant.slice(0, 3));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setWasteInput(prev => ({ ...prev, photo: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitWaste = async () => {
    if (!profile || !wasteInput.amount || !wasteInput.photo) {
        alert("Please provide amount and photo proof for admin verification.");
        return;
    }
    const amount = parseFloat(wasteInput.amount);
    
    // Log entry - KEY FIX: Submits to waste_logs with PENDING_VERIFICATION status
    // This allows admin to see it in the verification tab
    await supabase.from('waste_logs').insert([{
        user_id: profile.id,
        amount_kg: amount,
        waste_type: wasteInput.type,
        status: 'PENDING_VERIFICATION', // Waiting for Admin Approval
        image_url: wasteInput.photo,
        created_at: new Date().toISOString()
    }]);

    // Send notification to user that it is pending
    await supabase.from('notifications').insert([{
        user_id: profile.id,
        title: 'Waste Submitted',
        message: `Your contribution of ${amount}kg ${wasteInput.type} is pending verification.`,
        type: 'UPDATE',
        read: false
    }]);

    alert("Waste submitted successfully! Green coins will be credited after Admin verification.");
    setWasteInput({ type: 'Flower Waste', amount: '', photo: null });
    fetchHistory();
  };

  const handleRedeemCoupon = async () => {
      if(!profile || !profile.greenCoins || profile.greenCoins < 100) {
          alert("Insufficient Balance. You need at least 100 Green Coins.");
          return;
      }
      const confirm = window.confirm("Redeem 100 coins for a 20% discount coupon?");
      if(confirm) {
          await supabase.from('profiles').update({ green_coins: profile.greenCoins - 100 }).eq('id', profile.id);
          alert("Coupon Code: TEMPLE20 - Sent to your email!");
          fetchProfile();
      }
  };

  const handleUpdateProfile = async (updates: any) => {
      if(!profile) return;
      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if(!error) {
          setProfile({...profile, ...updates});
          alert("Profile updated.");
      }
  };

  const COLORS = ['#ea580c', '#16a34a', '#2563eb', '#9333ea', '#db2777'];
  
  // Calculate badges
  const getBadges = () => {
     const totalWaste = history.filter(h => h.status === 'VERIFIED').reduce((acc, curr) => acc + curr.amount_kg, 0);
     const badges = [];
     if(totalWaste > 10) badges.push("Eco Warrior");
     if(totalWaste > 50) badges.push("Top Saver");
     if(history.length > 5) badges.push("Consistent Contributor");
     return badges;
  };

  const calculateCarbon = () => {
      const totalWaste = history.filter(h => h.status === 'VERIFIED').reduce((acc, curr) => acc + curr.amount_kg, 0);
      return (totalWaste * 0.5).toFixed(2);
  };

  if (!profile) return <div className="p-10 text-center">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-stone-50 p-6 relative">
      <div className="max-w-5xl mx-auto">
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-2xl relative">
                   👤
                   {notifications.filter(n => !n.read).length > 0 && (
                       <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-full border-2 border-white"></span>
                   )}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-stone-800">{profile.name}</h1>
                    <p className="text-sm text-stone-500">Green Coins: <span className="text-green-600 font-bold">{profile.greenCoins || 0}</span></p>
                </div>
            </div>
            <button onClick={() => setShowLogoutConfirm(true)} className="text-red-600 font-bold text-sm hover:underline">Logout</button>
        </header>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {['DASHBOARD', 'SUBMIT', 'WALLET', 'ORDERS', 'NOTIFICATIONS', 'PROFILE'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 font-bold text-sm rounded-lg whitespace-nowrap ${activeTab === tab ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200'}`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {activeTab === 'DASHBOARD' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                
                {/* Announcements Section */}
                <div className="md:col-span-2 bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                     <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-3">📢 Community Announcements</h3>
                     {adminUpdates.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-3">
                            {adminUpdates.map(u => (
                                <div key={u.id} className="bg-white p-3 rounded-lg shadow-sm border border-stone-100">
                                     <p className={`text-xs font-bold ${u.type === 'ALERT' ? 'text-red-600' : 'text-green-600'} mb-1`}>{u.title}</p>
                                     <p className="text-xs text-stone-600 leading-snug">{u.content}</p>
                                </div>
                            ))}
                        </div>
                     ) : (
                        <p className="text-sm text-stone-500 italic">No new announcements from admin.</p>
                     )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                    <h2 className="font-bold text-lg mb-4">My Impact</h2>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-700">{calculateCarbon()} kg</p>
                            <p className="text-xs text-green-800 uppercase">CO2 Prevented</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                            <p className="text-2xl font-bold text-orange-700">{history.length}</p>
                            <p className="text-xs text-orange-800 uppercase">Contributions</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                    <h2 className="font-bold text-lg mb-4">Badges Earned</h2>
                    <div className="flex flex-wrap gap-2">
                        {getBadges().map(b => (
                            <span key={b} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">🏆 {b}</span>
                        ))}
                        {getBadges().length === 0 && <p className="text-stone-400 text-sm">Contribute more verified waste to earn badges!</p>}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 md:col-span-2">
                     <h2 className="font-bold text-lg mb-4">Contribution Mix (Verified)</h2>
                     <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData} dataKey="value" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Legend />
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                     </div>
                </div>
            </div>
        )}

        {activeTab === 'SUBMIT' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 max-w-xl mx-auto animate-fade-in-up">
                <h2 className="font-bold text-xl mb-6">Submit Daily Waste</h2>
                <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800 border border-blue-100">
                   <strong>Note:</strong> Your submission will be reviewed by the admin. Once approved, coins will be added to your wallet.
                </div>
                <div className="space-y-4">
                    <select 
                      className="w-full border p-3 rounded-lg bg-stone-50"
                      value={wasteInput.type}
                      onChange={e => setWasteInput({...wasteInput, type: e.target.value})}
                    >
                        <option>Flower Waste</option>
                        <option>Organic/Food</option>
                        <option>Recyclable Plastic</option>
                        <option>Coconut Shells</option>
                    </select>
                    <input 
                      type="number" 
                      placeholder="Weight (Kg)" 
                      className="w-full border p-3 rounded-lg"
                      value={wasteInput.amount}
                      onChange={e => setWasteInput({...wasteInput, amount: e.target.value})}
                    />
                    <div>
                        <p className="text-xs font-bold mb-1 text-stone-500">Photo Verification (Required)</p>
                        <input type="file" onChange={handleFileSelect} className="w-full border p-2 rounded-lg" accept="image/*" />
                        {wasteInput.photo && <img src={wasteInput.photo} className="mt-2 h-32 rounded object-cover" />}
                    </div>
                    <button onClick={handleSubmitWaste} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
                        Submit for Verification
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'WALLET' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 animate-fade-in-up">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 rounded-xl text-white mb-6 text-center shadow-lg">
                    <p className="text-sm opacity-90 uppercase tracking-widest">Available Balance</p>
                    <p className="text-5xl font-bold mt-2">{profile.greenCoins || 0}</p>
                    <p className="text-sm mt-1">Green Coins</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     <button onClick={() => alert("Redirecting to Eco-Shop...")} className="bg-stone-800 text-white p-4 rounded-xl font-bold hover:bg-stone-900 transition-colors text-center">
                        🛍️ Redeem Products
                     </button>
                     <button onClick={handleRedeemCoupon} className="bg-white border-2 border-orange-500 text-orange-600 p-4 rounded-xl font-bold hover:bg-orange-50 transition-colors text-center">
                        🎟️ Get Discount Coupon (100 Coins)
                     </button>
                </div>
                
                <h3 className="font-bold text-lg mb-4">Transaction History</h3>
                <div className="space-y-2">
                    {history.map(h => (
                        <div key={h.id} className="flex justify-between p-3 bg-stone-50 rounded border border-stone-100 items-center">
                            <div>
                                <p className="font-bold text-sm text-stone-700">Waste Deposit: {h.waste_type}</p>
                                <p className="text-xs text-stone-400">{new Date(h.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                {h.status === 'VERIFIED' ? (
                                    <span className="text-green-600 font-bold">+{h.amount_kg * 10}</span>
                                ) : h.status === 'REJECTED' ? (
                                    <span className="text-red-500 font-bold text-xs">Rejected</span>
                                ) : (
                                    <span className="text-yellow-600 font-bold text-xs bg-yellow-100 px-2 py-1 rounded">Pending</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <p className="text-stone-400 text-center">No transactions yet.</p>}
                </div>
            </div>
        )}
        
        {activeTab === 'ORDERS' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 animate-fade-in-up">
                <h2 className="font-bold text-lg mb-4">Order Tracking</h2>
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="border border-stone-100 rounded-lg p-4 bg-stone-50">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-stone-800">{order.product_name}</h4>
                                    <p className="text-xs text-stone-500">Ordered: {new Date(order.ordered_at).toLocaleDateString()}</p>
                                    <p className="text-xs text-stone-400 font-mono">ID: {order.tracking_id || 'Generating...'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-orange-600">-{order.coins_spent} Coins</p>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase mt-1 inline-block ${
                                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                                        order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                            {/* Simple Progress Bar */}
                            <div className="h-1 w-full bg-stone-200 rounded-full mt-2 overflow-hidden">
                                <div 
                                    className={`h-full ${order.status === 'DELIVERED' ? 'bg-green-500 w-full' : order.status === 'SHIPPED' ? 'bg-blue-500 w-2/3' : 'bg-yellow-500 w-1/3'}`}
                                ></div>
                            </div>
                        </div>
                    ))}
                    {orders.length === 0 && <p className="text-center text-stone-400 py-10">You haven't redeemed any products yet.</p>}
                </div>
            </div>
        )}

        {activeTab === 'NOTIFICATIONS' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 max-w-2xl mx-auto animate-fade-in-up">
                <h2 className="font-bold text-lg mb-4">Notification Center</h2>
                <div className="space-y-4">
                    {notifications.map(n => (
                        <div key={n.id} className={`p-4 rounded-lg border ${n.read ? 'bg-white border-stone-100' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-stone-800 text-sm">{n.title}</h4>
                                <span className="text-[10px] text-stone-400">{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-stone-600 text-sm mt-1">{n.message}</p>
                        </div>
                    ))}
                    {notifications.length === 0 && <p className="text-stone-400 text-center py-10">No notifications.</p>}
                </div>
            </div>
        )}

        {activeTab === 'PROFILE' && (
            <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-stone-200 space-y-4 animate-fade-in-up">
                <h2 className="font-bold text-xl mb-4">Edit Profile</h2>
                <div>
                   <label className="block text-xs font-bold text-stone-400 uppercase">Full Name</label>
                   <input className="w-full border p-2 rounded" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-stone-400 uppercase">Delivery Address</label>
                   <input className="w-full border p-2 rounded" value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} placeholder="Enter address for product delivery" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-stone-400 uppercase">Contact Number</label>
                   <input className="w-full border p-2 rounded" value={profile.contact || ''} onChange={e => setProfile({...profile, contact: e.target.value})} />
                </div>
                <button onClick={() => handleUpdateProfile({ name: profile.name, address: profile.address, contact: profile.contact })} className="w-full bg-stone-800 text-white py-2 rounded font-bold">Save Details</button>
            </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-stone-200 animate-fade-in-up">
              <h3 className="text-lg font-bold text-stone-800 mb-2">Confirm Logout</h3>
              <p className="text-stone-600 mb-6">Are you sure you want to end your session?</p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 text-stone-600 font-bold hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { setShowLogoutConfirm(false); onLogout && onLogout(); }}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserDashboard;
