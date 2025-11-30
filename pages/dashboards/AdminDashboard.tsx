
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Temple, Order, TemplePhoto, CMSContent, TempleWasteLog, FlashUpdate } from '../../types';
import { SHOPPING_URL } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

interface DashboardProps {
  onLogout?: () => void;
}

const AdminDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VERIFICATION' | 'APPROVALS' | 'ANNOUNCEMENTS' | 'CMS' | 'ANALYTICS' | 'USERS' | 'SETTINGS' | 'REPORTS'>('OVERVIEW');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Data State
  const [stats, setStats] = useState({ waste: 0, coins: 0, users: 0, ngos: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<TemplePhoto[]>([]);
  const [pendingWaste, setPendingWaste] = useState<any[]>([]);
  const [templeStats, setTempleStats] = useState<any[]>([]);
  const [cmsContent, setCmsContent] = useState<CMSContent[]>([]);
  const [flashUpdates, setFlashUpdates] = useState<FlashUpdate[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wasteLogs, setWasteLogs] = useState<any[]>([]); // For analytics
  
  // Analytics State
  const [selectedTemple, setSelectedTemple] = useState<any | null>(null);

  // App Config
  const [coinRate, setCoinRate] = useState(10);
  const [shopUrl, setShopUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  
  // Inputs
  const [cmsInput, setCmsInput] = useState({ title: '', content: '', category: 'BLOG' });
  const [updateInput, setUpdateInput] = useState({
    title: '',
    content: '',
    type: 'NEWS' as 'NEWS' | 'ALERT',
    audience: 'PUBLIC' as 'PUBLIC' | 'TEMPLE' | 'NGO' | 'USER' | 'ALL'
  });

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchPendingPhotos();
    fetchPendingWaste();
    fetchTempleStats();
    fetchCMS();
    fetchUpdates();
    fetchSiteConfig();
    fetchOrders();
    fetchCoinRate();
    fetchWasteLogs();
  }, []);

  // --- DATA FETCHING ---

  const fetchStats = async () => {
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    setStats(prev => ({ ...prev, users: count || 0 }));
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if(data) setUsers(data);
  };

  const fetchPendingPhotos = async () => {
    // Explicitly fetching photos with PENDING status
    const { data } = await supabase.from('temple_photos').select('*').eq('status', 'PENDING');
    if(data) {
        setPendingPhotos(data);
    }
  };

  const fetchPendingWaste = async () => {
      const { data } = await supabase.from('waste_logs').select('*').eq('status', 'PENDING_VERIFICATION');
      if(data) setPendingWaste(data);
  };
  
  const fetchTempleStats = async () => {
      const { data } = await supabase.from('temples').select('id, name, waste_donated_kg, owner_id');
      if(data) setTempleStats(data.sort((a: any,b: any) => b.waste_donated_kg - a.waste_donated_kg));
  };
  
  const fetchWasteLogs = async () => {
      // Fetch user waste logs and temple waste logs for charts
      const { data: userLogs } = await supabase.from('waste_logs').select('*');
      const { data: templeLogs } = await supabase.from('temple_waste_logs').select('*');
      
      const allLogs = [
          ...(userLogs || []).map((l:any) => ({...l, source: 'USER'})),
          ...(templeLogs || []).map((l:any) => ({...l, source: 'TEMPLE'}))
      ];
      setWasteLogs(allLogs);
  };

  const fetchCMS = async () => {
      const { data } = await supabase.from('cms_content').select('*').order('created_at', { ascending: false });
      if(data) setCmsContent(data);
  };

  const fetchUpdates = async () => {
      const { data, error } = await supabase.from('flash_updates').select('*').order('created_at', { ascending: false });
      if(data) {
        const filtered = data.filter((u: any) => u.type !== 'VIDEO_CONFIG');
        setFlashUpdates(filtered);
      }
  };

  const fetchOrders = async () => {
      const { data } = await supabase.from('orders').select('*');
      if(data) setOrders(data);
  };

  const fetchSiteConfig = async () => {
      const { data: shopData } = await supabase.from('site_config').select('url').eq('id', 'shop_url').single();
      if(shopData && shopData.url) setShopUrl(shopData.url);
      else setShopUrl(SHOPPING_URL);

      // Fetch Video Config from Flash Updates table (special type)
      const { data: videoData } = await supabase.from('flash_updates').select('content').eq('type', 'VIDEO_CONFIG').single();
      if(videoData) setVideoUrl(videoData.content);
  };

  const fetchCoinRate = async () => {
      const { data } = await supabase.from('app_settings').select('coin_rate').eq('id', 'config').single();
      if(data) setCoinRate(data.coin_rate);
  };

  // --- HELPER FOR CSV ---
  const generateCSV = (data: any[], filename: string) => {
    if (!data.length) {
        alert("No data to export");
        return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- ACTIONS ---

  const handleVerifyWaste = async (logId: string, userId: string, amount: number, action: 'VERIFIED' | 'REJECTED') => {
      await supabase.from('waste_logs').update({ status: action }).eq('id', logId);
      
      if (action === 'VERIFIED') {
          const coins = amount * coinRate; // Use dynamic rate
          const { data: profile } = await supabase.from('profiles').select('green_coins, waste_donated_kg').eq('id', userId).single();
          if (profile) {
              await supabase.from('profiles').update({
                  green_coins: (profile.green_coins || 0) + coins,
                  waste_donated_kg: (profile.waste_donated_kg || 0) + amount
              }).eq('id', userId);
              
              await supabase.from('notifications').insert([{
                  user_id: userId,
                  title: 'Waste Verified!',
                  message: `Your waste of ${amount}kg has been verified. +${coins} Green Coins added!`,
                  type: 'REWARD',
                  read: false
              }]);
          }
      }
      fetchPendingWaste();
  };

  const handlePhotoAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await supabase.from('temple_photos').update({ status }).eq('id', id);
    fetchPendingPhotos(); 
  };
  
  const handlePostCMS = async () => {
      if(!cmsInput.title || !cmsInput.content) {
          alert("Please fill in both title and content.");
          return;
      }
      const { error } = await supabase.from('cms_content').insert([{
          title: cmsInput.title,
          content: cmsInput.content,
          category: cmsInput.category,
          author: 'Admin',
          created_at: new Date().toISOString()
      }]);

      if (!error) {
          setCmsInput({ title: '', content: '', category: 'BLOG' });
          fetchCMS(); 
          alert("Content Posted Successfully");
      }
  };

  const handleDeleteCMS = async (id: string) => {
      if(window.confirm("Delete this content?")) {
          const { error } = await supabase.from('cms_content').delete().eq('id', id);
          if(!error) fetchCMS(); 
      }
  };

  const handleCreateUpdate = async () => {
      if(!updateInput.title || !updateInput.content) {
          alert("Please fill in title and message.");
          return;
      }
      const { error } = await supabase.from('flash_updates').insert([{
          title: updateInput.title,
          content: updateInput.content,
          type: updateInput.type,
          audience: updateInput.audience,
          created_at: new Date().toISOString()
      }]);

      if (!error) {
          setUpdateInput({ title: '', content: '', type: 'NEWS', audience: 'PUBLIC' });
          fetchUpdates(); 
          alert("Announcement Published!");
      }
  };

  const handleDeleteUpdate = async (id: string) => {
      if (isDeleting) return;
      if(window.confirm("Delete this announcement?")) {
          setIsDeleting(id);
          try {
             await supabase.from('flash_updates').delete().eq('id', id);
             fetchUpdates(); 
          } catch(e) {
             console.error(e);
          } finally {
             setIsDeleting(null);
          }
      }
  };

  const handleDeleteTemple = async (templeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!window.confirm(`Are you sure you want to delete this temple?`)) return;
      await supabase.from('temples').delete().eq('id', templeId);
      if(selectedTemple?.id === templeId) setSelectedTemple(null);
      fetchTempleStats();
  };

  const handleToggleUserStatus = async (id: string, currentStatus: boolean) => {
      await supabase.from('profiles').update({ is_disabled: !currentStatus }).eq('id', id);
      fetchUsers();
  };
  
  const handleSaveCoinRate = async () => {
      await supabase.from('app_settings').upsert({ id: 'config', coin_rate: coinRate });
      alert(`Green Coin Exchange Rate Updated to ${coinRate} Coins/Kg`);
  };

  const handleSaveVideoUrl = async () => {
      if (!videoUrl) return;
      
      const { data: existing } = await supabase.from('flash_updates').select('id').eq('type', 'VIDEO_CONFIG').single();
      
      if (existing) {
          await supabase.from('flash_updates').update({ content: videoUrl, created_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
          await supabase.from('flash_updates').insert([{
              title: 'Home Video',
              content: videoUrl,
              type: 'VIDEO_CONFIG',
              audience: 'ALL',
              created_at: new Date().toISOString()
          }]);
      }
      alert("Home page video updated successfully!");
  };

  const handleSaveShopUrl = async () => {
      const { error } = await supabase.from('site_config').upsert({ id: 'shop_url', url: shopUrl });
      if (!error) {
          alert("Eco-Shop Link Saved Successfully!");
      } else {
          alert("Failed to save link.");
      }
  };
  
  const handleGenerateReport = (type: string) => {
      if (type === 'Financial') {
          const reportData = orders.map(o => ({
              OrderID: o.id,
              Product: o.product_name,
              Coins: o.coins_spent,
              Status: o.status,
              Date: new Date(o.ordered_at).toLocaleDateString()
          }));
          generateCSV(reportData, 'Temple_Financial_Report');
      } else {
          // PDF Logic via Print
          const printWindow = window.open('', '_blank');
          if (printWindow) {
              const htmlContent = `
                <html>
                <head>
                    <title>Monthly Impact Report</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        h1 { color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; }
                        .metric { margin-bottom: 20px; }
                        .metric label { font-weight: bold; display: block; color: #555; }
                        .metric span { font-size: 24px; color: #000; }
                        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f3f4f6; }
                    </style>
                </head>
                <body>
                    <h1>Temple to Ayurveda - Impact Report</h1>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    
                    <div class="metric"><label>Total Waste Processed</label><span>${templeStats.reduce((acc, t) => acc + t.waste_donated_kg, 0)} kg</span></div>
                    <div class="metric"><label>Total Users</label><span>${users.length}</span></div>
                    <div class="metric"><label>Active Temples</label><span>${templeStats.length}</span></div>

                    <h2>Top Performing Temples</h2>
                    <table>
                        <thead><tr><th>Name</th><th>Waste (Kg)</th></tr></thead>
                        <tbody>
                            ${templeStats.map(t => `<tr><td>${t.name}</td><td>${t.waste_donated_kg}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
              `;
              printWindow.document.write(htmlContent);
              printWindow.document.close();
              printWindow.print();
          }
      }
  };

  // --- ANALYTICS HELPERS ---
  const getTempleSpecificData = (tId: string) => {
      // 1. Composition Data
      const logs = wasteLogs.filter(l => l.temple_id === tId || l.source === 'TEMPLE' && l.temple_id === tId); // Fallback logic for mock data
      
      // If no logs, generate synthetic distribution based on total waste
      if (logs.length === 0) {
           const temple = templeStats.find(t => t.id === tId);
           const total = temple?.waste_donated_kg || 100;
           return [
               { name: 'Flower', value: Math.floor(total * 0.6) },
               { name: 'Organic', value: Math.floor(total * 0.25) },
               { name: 'Coconut', value: Math.floor(total * 0.1) },
               { name: 'Plastic', value: Math.floor(total * 0.05) }
           ];
      }

      const agg: {[key:string]: number} = {};
      logs.forEach(l => {
          agg[l.waste_type || 'Mixed'] = (agg[l.waste_type || 'Mixed'] || 0) + l.amount_kg;
      });
      return Object.keys(agg).map(k => ({ name: k, value: agg[k] }));
  };

  const getTotalComparisonData = () => {
      return templeStats.map(t => ({
          name: t.name.split(' ')[0], // Short name
          waste: t.waste_donated_kg
      }));
  };

  const COLORS = ['#ea580c', '#16a34a', '#2563eb', '#9333ea', '#db2777'];

  return (
    <div className="min-h-screen bg-stone-50 p-6 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-white/50 sticky top-4 z-40">
           <h1 className="text-2xl font-bold text-stone-800 bg-clip-text text-transparent bg-gradient-to-r from-stone-800 to-stone-600">Admin Command Center</h1>
           <button 
             onClick={() => setShowLogoutConfirm(true)} 
             className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-200 hover:shadow-red-300"
           >
             Logout
           </button>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
           {['OVERVIEW', 'VERIFICATION', 'APPROVALS', 'ANNOUNCEMENTS', 'CMS', 'ANALYTICS', 'USERS', 'SETTINGS', 'REPORTS'].map(tab => (
               <button 
                 key={tab} 
                 onClick={() => setActiveTab(tab as any)}
                 className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab 
                    ? 'bg-stone-800 text-white shadow-lg scale-105' 
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                 }`}
               >
                   {tab}
               </button>
           ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in-up">
                <div className="bg-white/70 backdrop-blur p-6 rounded-2xl shadow-sm border border-stone-100">
                    <p className="text-stone-500 text-xs uppercase font-bold tracking-wider">Total Users</p>
                    <p className="text-4xl font-bold text-stone-800 mt-2">{stats.users}</p>
                </div>
                <div className="bg-white/70 backdrop-blur p-6 rounded-2xl shadow-sm border border-stone-100">
                    <p className="text-stone-500 text-xs uppercase font-bold tracking-wider">Pending Waste</p>
                    <p className="text-4xl font-bold text-orange-600 mt-2">{pendingWaste.length}</p>
                </div>
                <div className="bg-white/70 backdrop-blur p-6 rounded-2xl shadow-sm border border-stone-100">
                    <p className="text-stone-500 text-xs uppercase font-bold tracking-wider">Orders Processed</p>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{orders.length}</p>
                </div>
                <div className="bg-white/70 backdrop-blur p-6 rounded-2xl shadow-sm border border-stone-100">
                     <p className="text-stone-500 text-xs uppercase font-bold tracking-wider">Active Temples</p>
                     <p className="text-4xl font-bold text-green-600 mt-2">{templeStats.length}</p>
                </div>
            </div>
        )}

        {/* USER VERIFICATION TAB */}
        {activeTab === 'VERIFICATION' && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-fade-in-up">
                <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                   <h2 className="font-bold text-lg">User Waste Verification Queue</h2>
                </div>
                <div className="p-6 grid gap-4">
                    {pendingWaste.map(log => (
                        <div key={log.id} className="flex flex-col md:flex-row gap-4 p-4 border border-stone-200 rounded-xl bg-white hover:shadow-md transition-shadow">
                            {log.image_url && <img src={log.image_url} className="w-32 h-32 object-cover rounded-lg shadow-sm" />}
                            <div className="flex-1">
                                <p className="font-bold text-stone-800 text-lg">User ID: <span className="font-mono text-sm">{log.user_id}</span></p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm"><span className="font-semibold text-stone-500">Type:</span> {log.waste_type}</p>
                                  <p className="text-sm"><span className="font-semibold text-stone-500">Weight:</span> <span className="text-orange-600 font-bold">{log.amount_kg} kg</span></p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 justify-center min-w-[150px]">
                                <button onClick={() => handleVerifyWaste(log.id, log.user_id, log.amount_kg, 'VERIFIED')} className="bg-green-600 text-white px-4 py-3 rounded-lg font-bold text-xs hover:bg-green-700">✓ Verify</button>
                                <button onClick={() => handleVerifyWaste(log.id, log.user_id, log.amount_kg, 'REJECTED')} className="bg-white border border-red-200 text-red-600 px-4 py-3 rounded-lg font-bold text-xs hover:bg-red-50">✕ Reject</button>
                            </div>
                        </div>
                    ))}
                    {pendingWaste.length === 0 && <div className="text-center py-16 text-stone-400">All caught up! No pending verifications.</div>}
                </div>
            </div>
        )}

        {/* APPROVALS TAB (Temple Photos) */}
        {activeTab === 'APPROVALS' && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-fade-in-up">
                <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                    <h2 className="font-bold text-lg">Temple Activity Photos (Pending Approval)</h2>
                    <button onClick={fetchPendingPhotos} className="text-xs text-blue-600 hover:underline">Refresh List</button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pendingPhotos.map(photo => (
                        <div key={photo.id} className="group relative rounded-xl overflow-hidden shadow-sm border border-stone-100 bg-white hover:shadow-lg transition-all">
                            <img src={photo.image_url} className="w-full h-48 object-cover" alt="Temple Activity" />
                            <div className="p-4">
                                <p className="text-xs text-stone-400 font-mono mb-1">ID: {photo.temple_id}</p>
                                <p className="text-sm font-bold text-stone-800 mb-4">{photo.description || 'No description'}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => handlePhotoAction(photo.id, 'APPROVED')} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-600">Approve</button>
                                    <button onClick={() => handlePhotoAction(photo.id, 'REJECTED')} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-600">Reject</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {pendingPhotos.length === 0 && <div className="col-span-3 text-center py-16 text-stone-400">No new photos to review.</div>}
                </div>
            </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'ANNOUNCEMENTS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                    <h2 className="font-bold text-lg mb-4 text-orange-700">📣 Post Announcement</h2>
                    <div className="space-y-4">
                        <input className="w-full border p-3 rounded-xl bg-stone-50" placeholder="Title" value={updateInput.title} onChange={e => setUpdateInput({...updateInput, title: e.target.value})} />
                        <textarea className="w-full border p-3 rounded-xl h-24 bg-stone-50" placeholder="Message..." value={updateInput.content} onChange={e => setUpdateInput({...updateInput, content: e.target.value})}></textarea>
                        <div className="grid grid-cols-2 gap-4">
                            <select className="w-full border p-3 rounded-xl bg-stone-50" value={updateInput.type} onChange={e => setUpdateInput({...updateInput, type: e.target.value as any})}><option value="NEWS">News</option><option value="ALERT">Alert</option></select>
                            <select className="w-full border p-3 rounded-xl bg-stone-50" value={updateInput.audience} onChange={e => setUpdateInput({...updateInput, audience: e.target.value as any})}><option value="PUBLIC">Public</option><option value="ALL">Everyone</option></select>
                        </div>
                        <button onClick={handleCreateUpdate} className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold">Publish</button>
                    </div>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                    <h2 className="font-bold text-lg mb-4">Active Announcements</h2>
                    <div className="space-y-3 h-[500px] overflow-y-auto pr-2">
                        {flashUpdates.map(u => (
                            <div key={u.id} className="flex justify-between items-start p-4 bg-stone-50 rounded-xl border border-stone-100">
                                <div>
                                    <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold bg-stone-200 px-2 rounded">{u.type}</span><h3 className="font-bold text-stone-800">{u.title}</h3></div>
                                    <p className="text-sm text-stone-600">{u.content}</p>
                                </div>
                                <button onClick={() => handleDeleteUpdate(u.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg">🗑️</button>
                            </div>
                        ))}
                        {flashUpdates.length === 0 && <p className="text-center text-stone-400 py-20">No active announcements.</p>}
                    </div>
                </div>
            </div>
        )}

        {/* CMS TAB */}
        {activeTab === 'CMS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                    <h2 className="font-bold text-lg mb-4 text-blue-700">✍️ Create Content</h2>
                    <div className="space-y-4">
                        <input className="w-full border p-3 rounded-xl bg-stone-50" value={cmsInput.title} onChange={e => setCmsInput({...cmsInput, title: e.target.value})} placeholder="Title" />
                        <select className="w-full border p-3 rounded-xl bg-stone-50" value={cmsInput.category} onChange={e => setCmsInput({...cmsInput, category: e.target.value as any})}><option value="BLOG">Blog</option><option value="TIP">Tip</option></select>
                        <textarea className="w-full border p-3 rounded-xl h-32 bg-stone-50" value={cmsInput.content} onChange={e => setCmsInput({...cmsInput, content: e.target.value})} placeholder="Body..."></textarea>
                        <button onClick={handlePostCMS} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Publish Content</button>
                    </div>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                    <h2 className="font-bold text-lg mb-4">Published Content</h2>
                    <div className="space-y-3 h-[500px] overflow-y-auto pr-2">
                        {cmsContent.map(item => (
                            <div key={item.id} className="p-4 bg-stone-50 rounded-xl border border-stone-100 flex justify-between items-start">
                                <div>
                                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{item.category}</span>
                                    <h3 className="font-bold text-stone-800 mt-1">{item.title}</h3>
                                    <p className="text-sm text-stone-600 line-clamp-1">{item.content}</p>
                                </div>
                                <button onClick={() => handleDeleteCMS(item.id)} className="text-red-400 hover:text-red-600">🗑️</button>
                            </div>
                        ))}
                        {cmsContent.length === 0 && <div className="text-center py-20 text-stone-400">No content published yet.</div>}
                    </div>
                </div>
            </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'ANALYTICS' && (
             <div className="space-y-8 animate-fade-in-up">
                 
                 {/* Detail View for Selected Temple */}
                 {selectedTemple && (
                    <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden transform transition-all duration-500 animate-slide-in">
                        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 flex justify-between items-center text-white">
                            <div>
                                <h2 className="font-bold text-2xl">{selectedTemple.name}</h2>
                                <p className="text-orange-100 text-sm opacity-90">{selectedTemple.location}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedTemple(null)}
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-xs font-bold transition-colors"
                            >
                                Close Analysis
                            </button>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col items-center justify-center">
                                <h3 className="font-bold text-stone-700 mb-4">Waste Composition</h3>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={getTempleSpecificData(selectedTemple.id)} 
                                                dataKey="value" 
                                                nameKey="name" 
                                                cx="50%" 
                                                cy="50%" 
                                                outerRadius={80} 
                                                fill="#ea580c"
                                                label
                                            >
                                                {getTempleSpecificData(selectedTemple.id).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="p-6 bg-stone-50 rounded-xl border border-stone-100">
                                    <p className="text-sm font-bold text-stone-500 uppercase">Total Verified Waste</p>
                                    <p className="text-4xl font-bold text-stone-800">{selectedTemple.waste_donated_kg} <span className="text-base font-normal text-stone-400">kg</span></p>
                                </div>
                                <div className="p-6 bg-green-50 rounded-xl border border-green-100">
                                    <p className="text-sm font-bold text-green-700 uppercase">Estimated Impact</p>
                                    <p className="text-lg text-green-900 mt-1">
                                        Generates approx <strong>{Math.floor(selectedTemple.waste_donated_kg * 0.6)} packets</strong> of Incense and 
                                        prevents <strong>{(selectedTemple.waste_donated_kg * 0.5).toFixed(1)} kg</strong> of CO2.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                 )}

                 {/* Rankings Table */}
                 <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                     <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                         <h2 className="font-bold text-lg">Temple Rankings & Analysis</h2>
                         <p className="text-xs text-stone-500">Click on any row to view detailed graphs for that temple.</p>
                     </div>
                     <table className="w-full text-sm text-left">
                         <thead className="bg-stone-50 uppercase font-bold text-stone-500"><tr><th className="p-4">Rank</th><th className="p-4">Temple</th><th className="p-4">Waste</th><th className="p-4">Actions</th></tr></thead>
                         <tbody className="divide-y divide-stone-100">
                             {templeStats.map((t, idx) => (
                                 <tr 
                                    key={t.id} 
                                    onClick={() => setSelectedTemple(t)}
                                    className={`cursor-pointer transition-colors ${selectedTemple?.id === t.id ? 'bg-orange-50' : 'hover:bg-stone-50'}`}
                                 >
                                     <td className="p-4">#{idx+1}</td>
                                     <td className="p-4 font-bold">{t.name}</td>
                                     <td className="p-4 text-green-700 font-bold">{t.waste_donated_kg} kg</td>
                                     <td className="p-4">
                                         <button 
                                            onClick={(e) => handleDeleteTemple(t.id, e)} 
                                            className="text-red-500 hover:bg-red-50 px-3 py-1 rounded border border-red-200"
                                         >
                                             Delete
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>

                 {/* Aggregate Graph */}
                 <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
                     <h2 className="font-bold text-lg mb-6">Total Ecosystem Analytics</h2>
                     <div className="h-80 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={getTotalComparisonData()}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                 <XAxis dataKey="name" tick={{fontSize: 12}} />
                                 <YAxis />
                                 <RechartsTooltip />
                                 <Legend />
                                 <Bar dataKey="waste" name="Total Waste (Kg)" fill="#16a34a" radius={[4,4,0,0]} />
                             </BarChart>
                         </ResponsiveContainer>
                     </div>
                 </div>
             </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'USERS' && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden animate-fade-in-up">
                 <div className="p-6 border-b border-stone-100 bg-stone-50/50"><h2 className="font-bold text-lg">User Management</h2></div>
                 <table className="w-full text-sm text-left">
                     <thead className="bg-stone-50 uppercase font-bold text-stone-500"><tr><th className="p-4">Identity</th><th className="p-4">Role</th><th className="p-4">Current Status</th><th className="p-4">Action</th></tr></thead>
                     <tbody>
                         {users.map(u => (
                             <tr key={u.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                                 <td className="p-4">
                                    <div className="font-bold text-stone-800">{u.full_name}</div>
                                    <div className="text-xs text-stone-400">{u.email}</div>
                                 </td>
                                 <td className="p-4"><span className="bg-stone-100 px-2 py-1 rounded text-xs font-bold text-stone-600">{u.role}</span></td>
                                 <td className="p-4">
                                     {u.is_disabled ? (
                                         <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded w-fit">
                                             <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> Disabled
                                         </span>
                                     ) : (
                                         <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded w-fit">
                                             <span className="w-2 h-2 bg-green-600 rounded-full"></span> Active
                                         </span>
                                     )}
                                 </td>
                                 <td className="p-4">
                                     <button 
                                       onClick={() => handleToggleUserStatus(u.id, u.is_disabled)} 
                                       className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                           u.is_disabled 
                                           ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
                                           : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                                       }`}
                                     >
                                       {u.is_disabled ? 'Enable Access' : 'Disable Account'}
                                     </button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
            </div>
        )}
        
        {/* SETTINGS TAB */}
        {activeTab === 'SETTINGS' && (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 max-w-2xl mx-auto animate-fade-in-up">
                <h2 className="text-xl font-bold mb-6">System Configuration</h2>
                
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-bold text-yellow-800 mb-2">Green Coin Exchange Rate</h3>
                    <p className="text-sm text-yellow-700 mb-4">Set how many coins a user earns per 1 KG of verified waste.</p>
                    <div className="flex items-center gap-4">
                        <input 
                           type="number" 
                           value={coinRate} 
                           onChange={(e) => setCoinRate(parseInt(e.target.value))} 
                           className="border p-2 rounded w-24 text-center font-bold text-lg" 
                        />
                        <span className="font-bold text-stone-600">Coins / KG</span>
                        <button onClick={handleSaveCoinRate} className="bg-stone-800 text-white px-4 py-2 rounded-lg font-bold">Update Rate</button>
                    </div>
                </div>
                
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-bold text-red-800 mb-2">Home Page Video</h3>
                    <div className="mb-2">
                        <label className="text-xs font-bold text-red-700 block mb-1">YouTube URL</label>
                        <input 
                          className="w-full border p-2 rounded text-sm" 
                          value={videoUrl} 
                          onChange={(e) => setVideoUrl(e.target.value)} 
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                    </div>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700" onClick={handleSaveVideoUrl}>Update Video</button>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-blue-800 mb-2">External Links</h3>
                    <div className="mb-2">
                        <label className="text-xs font-bold text-blue-700 block mb-1">Eco-Shop URL</label>
                        <input className="w-full border p-2 rounded text-sm" value={shopUrl} onChange={(e) => setShopUrl(e.target.value)} />
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm" onClick={handleSaveShopUrl}>Save Link</button>
                </div>
            </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'REPORTS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-xl font-bold mb-2">Monthly Impact Report</h3>
                    <p className="text-stone-500 mb-6">Comprehensive analysis of waste collection, NGO performance, and carbon footprint.</p>
                    <button onClick={() => handleGenerateReport('Monthly')} className="bg-stone-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors">Download PDF</button>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 text-center">
                    <div className="text-5xl mb-4">💰</div>
                    <h3 className="text-xl font-bold mb-2">Financial & Coin Report</h3>
                    <p className="text-stone-500 mb-6">Detailed ledger of coin issuance, redemption orders, and store revenue.</p>
                    <button onClick={() => handleGenerateReport('Financial')} className="bg-green-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-800 transition-colors">Download Excel</button>
                </div>
            </div>
        )}

        {/* Logout Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold mb-2">Logout?</h3>
              <div className="flex justify-end gap-3"><button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2">Cancel</button><button onClick={() => { setShowLogoutConfirm(false); onLogout && onLogout(); }} className="px-4 py-2 bg-red-600 text-white rounded">Logout</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
