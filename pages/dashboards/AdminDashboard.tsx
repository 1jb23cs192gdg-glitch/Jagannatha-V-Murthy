import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { User, Temple, FlashUpdate, AppSettings, UserRole } from '../../types';
import DashboardLayout from '../../components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  
  // Data States
  const [stats, setStats] = useState({ totalUsers: 0, totalTemples: 0, totalWaste: 0 });
  const [pendingVerifications, setPendingVerifications] = useState<User[]>([]);
  const [flashUpdates, setFlashUpdates] = useState<FlashUpdate[]>([]);
  
  // Settings States
  const [coinRate, setCoinRate] = useState(10);
  const [shopUrl, setShopUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  
  // Forms
  const [newUpdate, setNewUpdate] = useState({ title: '', content: '', type: 'NEWS', audience: 'PUBLIC' });

  // Dialogs
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchPendingVerifications();
    fetchUpdates();
    fetchSettings();
  }, []);

  const fetchStats = async () => {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'PERSON');
    const { count: templeCount } = await supabase.from('temples').select('*', { count: 'exact', head: true });
    
    const { data: templeData } = await supabase.from('temples').select('waste_donated_kg');
    const totalWaste = templeData ? templeData.reduce((acc: number, curr: any) => acc + (curr.waste_donated_kg || 0), 0) : 0;

    setStats({ totalUsers: userCount || 0, totalTemples: templeCount || 0, totalWaste });
  };

  const fetchPendingVerifications = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('verification_status', 'PENDING');
    if (data) setPendingVerifications(data);
  };

  const fetchUpdates = async () => {
    const { data } = await supabase.from('flash_updates').select('*').order('created_at', { ascending: false });
    if (data) setFlashUpdates(data);
  };

  const fetchSettings = async () => {
    // Video URL config
    const { data: videoData } = await supabase.from('flash_updates').select('*').eq('type', 'VIDEO_CONFIG').single();
    if (videoData) setVideoUrl(videoData.content);

    // App settings (Coin Rate)
    const { data: settings } = await supabase.from('app_settings').select('*').single();
    if (settings) {
        setCoinRate(settings.coin_rate || 10);
    }
  };

  const handleVerifyUser = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
      await supabase.from('profiles').update({ verification_status: status }).eq('id', userId);
      fetchPendingVerifications();
  };

  const handleCreateUpdate = async () => {
      await supabase.from('flash_updates').insert([{
          title: newUpdate.title,
          content: newUpdate.content,
          type: newUpdate.type,
          audience: newUpdate.audience,
          created_at: new Date().toISOString()
      }]);
      setNewUpdate({ title: '', content: '', type: 'NEWS', audience: 'PUBLIC' });
      fetchUpdates();
  };

  const handleSaveCoinRate = async () => {
      await supabase.from('app_settings').upsert({ id: '1', coin_rate: coinRate });
      alert("Coin Rate Updated");
  };

  const handleSaveVideoUrl = async () => {
      const { data } = await supabase.from('flash_updates').select('*').eq('type', 'VIDEO_CONFIG').single();
      if (data) {
          await supabase.from('flash_updates').update({ content: videoUrl }).eq('id', data.id);
      } else {
          await supabase.from('flash_updates').insert([{
              title: 'Home Video',
              content: videoUrl,
              type: 'VIDEO_CONFIG',
              audience: 'ALL',
              created_at: new Date().toISOString()
          }]);
      }
      alert("Video URL Updated");
  };

  const handleSaveShopUrl = async () => {
      // Mock save for shop URL as per requirement/context
      alert("Shop URL saved locally (feature pending)");
  };
  
  const sidebarItems = [
      { id: 'OVERVIEW', label: 'Overview', icon: '📊' },
      { id: 'VERIFY', label: 'Verifications', icon: '✅' },
      { id: 'UPDATES', label: 'Flash Updates', icon: '📢' },
      { id: 'SETTINGS', label: 'System Config', icon: '⚙️' },
  ];

  // Derived Counts
  const pendingDuCount = pendingVerifications.filter(u => u.role === UserRole.DRYING_UNIT).length;
  const pendingNgoCount = pendingVerifications.filter(u => u.role === UserRole.NGO).length;

  return (
    <>
      <DashboardLayout
        title="Admin Dashboard"
        user={{ name: 'System Admin', role: UserRole.ADMIN, id: 'admin' }}
        sidebarItems={sidebarItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => setShowLogoutDialog(true)}
      >
        {activeTab === 'OVERVIEW' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 animate-fade-in">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                     <h3 className="text-stone-500 text-xs font-bold uppercase">Total Users</h3>
                     <p className="text-3xl font-bold text-slate-800">{stats.totalUsers}</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                     <h3 className="text-stone-500 text-xs font-bold uppercase">Temples</h3>
                     <p className="text-3xl font-bold text-orange-600">{stats.totalTemples}</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                     <h3 className="text-stone-500 text-xs font-bold uppercase">Total Waste Recycled</h3>
                     <p className="text-3xl font-bold text-green-600">{stats.totalWaste} kg</p>
                 </div>
                 
                 {/* Pending Drying Units Box */}
                 <div className="bg-blue-50 p-6 rounded-2xl shadow-sm border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setActiveTab('VERIFY')}>
                     <h3 className="text-blue-500 text-xs font-bold uppercase">Pending Drying Units</h3>
                     <p className="text-3xl font-bold text-blue-800">{pendingDuCount}</p>
                 </div>

                 {/* Pending NGOs Box */}
                 <div className="bg-purple-50 p-6 rounded-2xl shadow-sm border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors" onClick={() => setActiveTab('VERIFY')}>
                     <h3 className="text-purple-500 text-xs font-bold uppercase">Pending NGOs</h3>
                     <p className="text-3xl font-bold text-purple-800">{pendingNgoCount}</p>
                 </div>
             </div>
        )}

        {activeTab === 'VERIFY' && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
                <h3 className="font-bold text-slate-800 mb-4">Pending Verifications</h3>
                <div className="space-y-4">
                    {pendingVerifications.map(u => (
                        <div key={u.id} className="flex justify-between items-center p-4 bg-stone-50 rounded-xl">
                            <div>
                                <p className="font-bold text-slate-800">{u.name || u.email}</p>
                                <p className="text-xs text-stone-500">{u.role} • {u.email}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleVerifyUser(u.id, 'APPROVED')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">Approve</button>
                                <button onClick={() => handleVerifyUser(u.id, 'REJECTED')} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">Reject</button>
                            </div>
                        </div>
                    ))}
                    {pendingVerifications.length === 0 && <p className="text-stone-400 text-center py-4">No pending verifications.</p>}
                </div>
            </div>
        )}

        {activeTab === 'UPDATES' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
                    <h3 className="font-bold text-slate-800 mb-4">Create Flash Update</h3>
                    <div className="space-y-4">
                        <input className="w-full p-3 border rounded-xl" placeholder="Title" value={newUpdate.title} onChange={e => setNewUpdate({...newUpdate, title: e.target.value})} />
                        <textarea className="w-full p-3 border rounded-xl" placeholder="Content" value={newUpdate.content} onChange={e => setNewUpdate({...newUpdate, content: e.target.value})} />
                        <div className="flex flex-wrap gap-4">
                            <select className="p-3 border rounded-xl" value={newUpdate.type} onChange={e => setNewUpdate({...newUpdate, type: e.target.value})}>
                                <option value="NEWS">News</option>
                                <option value="ALERT">Alert</option>
                            </select>
                            <select className="p-3 border rounded-xl" value={newUpdate.audience} onChange={e => setNewUpdate({...newUpdate, audience: e.target.value})}>
                                <option value="PUBLIC">Public</option>
                                <option value="TEMPLE">Temples Only</option>
                                <option value="ALL">All Users</option>
                            </select>
                            <button onClick={handleCreateUpdate} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors">Post Update</button>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
                    <h3 className="font-bold text-slate-800 mb-4">Recent Updates</h3>
                    <div className="space-y-2">
                        {flashUpdates.map(u => (
                            <div key={u.id} className="p-3 border-b border-stone-100 last:border-0">
                                <p className="font-bold text-sm">{u.title} <span className="text-[10px] text-stone-400 font-normal">({u.type})</span></p>
                                <p className="text-xs text-stone-600">{u.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'SETTINGS' && (
              <div className="bg-white p-8 rounded-3xl max-w-2xl mx-auto shadow-sm border border-stone-200">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">System Config</h3>
                  <div className="flex gap-4 mb-4">
                      <input type="number" value={coinRate} onChange={e => setCoinRate(Number(e.target.value))} className="border rounded-xl px-4 py-2 flex-1" placeholder="Coin Rate" />
                      <button onClick={handleSaveCoinRate} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold hover:bg-black transition-colors">Set Coin Rate</button>
                  </div>
                  <div className="flex gap-4 mb-4">
                      <input value={shopUrl} onChange={e => setShopUrl(e.target.value)} placeholder="Shop URL" className="border rounded-xl px-4 py-2 flex-1" />
                      <button onClick={handleSaveShopUrl} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold hover:bg-black transition-colors">Set Shop URL</button>
                  </div>
                  <div className="flex gap-4 mb-4">
                      <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="YouTube Video URL" className="border rounded-xl px-4 py-2 flex-1" />
                      <button onClick={handleSaveVideoUrl} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold hover:bg-black transition-colors">Set Video URL</button>
                  </div>
                  <button onClick={() => setShowLogoutDialog(true)} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Logout</button>
              </div>
        )}

      </DashboardLayout>
      
      {showLogoutDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 max-w-sm w-full mx-4 animate-fade-in">
            <h3 className="text-xl font-bold text-stone-800 mb-2">Confirm Logout</h3>
            <p className="text-stone-600 mb-6">Are you sure you want to end your session?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowLogoutDialog(false)} className="flex-1 px-4 py-2 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition-colors">Cancel</button>
              <button onClick={() => { if(onLogout) onLogout(); setShowLogoutDialog(false); }} className="flex-1 px-4 py-2 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;