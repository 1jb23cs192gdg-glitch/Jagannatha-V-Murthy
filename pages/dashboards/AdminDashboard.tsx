
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Temple, Order, TemplePhoto, CMSContent, FlashUpdate, Rating, PickupRequest, VolunteerRequest, StockRequest } from '../../types';
import { SHOPPING_URL } from '../../constants';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area, LineChart, Line 
} from 'recharts';

interface DashboardProps {
  onLogout?: () => void;
}

const AdminDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [user, setUser] = useState<any>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [stats, setStats] = useState({ 
      waste: 0, 
      coins: 0, 
      users: 0, 
      dus: 0, 
      temples: 0, 
      pending: 0,
      ngos: 0,
      volunteers: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [dus, setDus] = useState<any[]>([]); // Drying Units (Old NGOs)
  const [ngos, setNgos] = useState<any[]>([]); // New Partner NGOs
  const [pendingDus, setPendingDus] = useState<any[]>([]); 
  const [templeStats, setTempleStats] = useState<any[]>([]);
  const [flashUpdates, setFlashUpdates] = useState<FlashUpdate[]>([]);
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [stockRequests, setStockRequests] = useState<StockRequest[]>([]); // New for NGO Analytics
  
  // Volunteer Data
  const [volunteerRequests, setVolunteerRequests] = useState<VolunteerRequest[]>([]);
  const [activeVolunteers, setActiveVolunteers] = useState<VolunteerRequest[]>([]);
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  // Analytics State
  const [analyticsCategory, setAnalyticsCategory] = useState<'TEMPLE' | 'DRYING_UNIT' | 'USER' | 'NGO'>('TEMPLE');
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // App Config
  const [coinRate, setCoinRate] = useState(10);
  const [shopUrl, setShopUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  
  // Input
  const [updateInput, setUpdateInput] = useState({
    title: '', content: '', type: 'NEWS' as 'NEWS' | 'ALERT', audience: 'PUBLIC' as 'PUBLIC' | 'TEMPLE' | 'NGO' | 'USER' | 'ALL'
  });

  // Allocation State
  const [allocation, setAllocation] = useState({ 
      type: 'USER_TO_DU' as 'TEMPLE_TO_DU' | 'USER_TO_DU' | 'DU_TO_NGO' | 'VOLUNTEER_TO_DU', 
      sourceId: '', 
      targetId: '',
      district: '',
      taluk: ''
  });

  useEffect(() => {
    fetchUser();
    fetchAllData();
  }, []);

  // Auto-refresh lists when switching to ALLOCATION tab to ensure data consistency
  useEffect(() => {
      if (activeTab === 'ALLOCATION') {
          fetchDryingUnits();
          fetchUsers();
          fetchTempleStats();
          fetchActiveVolunteers();
          fetchPartnerNgos();
      }
  }, [activeTab]);

  useEffect(() => {
    const wasteFromPickups = pickups.filter(p => p.status === 'COMPLETED').reduce((acc, p) => acc + (Number(p.estimated_weight) || 0), 0);
    const totalCoins = Math.floor(wasteFromPickups * coinRate);
    const pendingTotal = pendingDus.length;

    setStats({
        waste: wasteFromPickups,
        coins: totalCoins,
        users: users.length, 
        dus: dus.length,
        temples: templeStats.length,
        pending: pendingTotal,
        ngos: ngos.length,
        volunteers: activeVolunteers.length
    });
  }, [pickups, users, dus, templeStats, pendingDus, coinRate, ngos, activeVolunteers]);

  const fetchAllData = () => {
    fetchUsers();
    fetchDryingUnits();
    fetchPartnerNgos();
    fetchPendingDryingUnits(); 
    fetchTempleStats();
    fetchUpdates();
    fetchSiteConfig();
    fetchCoinRate();
    fetchRatings();
    fetchPickups();
    fetchStockRequests();
    fetchVolunteerRequests();
    fetchActiveVolunteers();
  }

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) setUser({ name: 'Admin User', role: 'ADMIN' }); 
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'PERSON');
    if(data) setUsers(data);
  };
  const fetchDryingUnits = async () => {
    // Old NGO role is now Drying Unit
    const { data } = await supabase.from('profiles').select('*').eq('role', 'DRYING_UNIT').eq('verification_status', 'APPROVED');
    if(data) setDus(data);
  };
  const fetchPartnerNgos = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'NGO');
    if(data) setNgos(data);
  }
  const fetchPendingDryingUnits = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'DRYING_UNIT').eq('verification_status', 'PENDING');
    if(data) setPendingDus(data);
  };
  const fetchTempleStats = async () => {
      const { data } = await supabase.from('temples').select('*');
      if(data) setTempleStats(data.sort((a: any,b: any) => b.waste_donated_kg - a.waste_donated_kg));
  };
  const fetchUpdates = async () => {
      const { data } = await supabase.from('flash_updates').select('*').order('created_at', { ascending: false });
      if(data) setFlashUpdates(data.filter((u: any) => u.type !== 'VIDEO_CONFIG'));
  };
  const fetchRatings = async () => {
      const { data } = await supabase.from('ratings').select('*').order('created_at', { ascending: false });
      if(data) setRatings(data);
  };
  const fetchPickups = async () => {
      const { data } = await supabase.from('pickup_requests').select('*').order('created_at', { ascending: false });
      if(data) setPickups(data);
  }
  const fetchStockRequests = async () => {
      const { data } = await supabase.from('stock_requests').select('*');
      if(data) setStockRequests(data);
  }
  const fetchSiteConfig = async () => {
      const { data: shopData } = await supabase.from('site_config').select('url').eq('id', 'shop_url').single();
      setShopUrl(shopData?.url || SHOPPING_URL);
      const { data: videoData } = await supabase.from('flash_updates').select('content').eq('type', 'VIDEO_CONFIG').single();
      if(videoData) setVideoUrl(videoData.content);
  };
  const fetchCoinRate = async () => {
      const { data } = await supabase.from('app_settings').select('coin_rate').eq('id', 'config').single();
      if(data) setCoinRate(data.coin_rate);
  };
  
  const fetchVolunteerRequests = async () => {
      const { data } = await supabase.from('volunteer_requests').select('*').eq('status', 'PENDING');
      if (data) setVolunteerRequests(data);
  }

  const fetchActiveVolunteers = async () => {
      const { data } = await supabase.from('volunteer_requests').select('*').eq('status', 'APPROVED');
      if (data) setActiveVolunteers(data);
  }

  const getNameForId = (id: string) => {
      const t = templeStats.find(t => t.id === id);
      if(t) return { name: t.name, role: 'TEMPLE' };
      const u = users.find(u => u.id === id);
      if(u) return { name: u.full_name || 'User', role: 'USER' };
      const du = dus.find(n => n.id === id);
      if(du) return { name: du.full_name || 'Drying Unit', role: 'DU' };
      const ngo = ngos.find(n => n.id === id);
      if(ngo) return { name: ngo.full_name || 'NGO', role: 'NGO' };
      return { name: 'Unknown', role: '?' };
  };

  const handleApproveDu = async (duId: string, email: string, approve: boolean) => {
      if (approve) {
          await supabase.from('profiles').update({ verification_status: 'APPROVED', is_disabled: false }).eq('id', duId);
          alert(`Drying Unit Approved!`);
      } else {
          if(window.confirm("Reject this Drying Unit?")) {
              await supabase.from('profiles').delete().eq('id', duId);
          }
      }
      fetchPendingDryingUnits();
      fetchDryingUnits();
  };

  const handleVolunteerAction = async (req: VolunteerRequest, action: 'APPROVED' | 'REJECTED') => {
      if (action === 'APPROVED') {
          await supabase.from('volunteer_requests').update({ status: 'APPROVED' }).eq('id', req.id);
          await supabase.from('profiles').update({ volunteer_status: 'APPROVED', is_volunteer: true }).eq('id', req.user_id);
      } else {
          await supabase.from('volunteer_requests').update({ status: 'REJECTED' }).eq('id', req.id);
          await supabase.from('profiles').update({ volunteer_status: 'REJECTED' }).eq('id', req.user_id);
      }
      fetchVolunteerRequests();
      fetchActiveVolunteers();
  }

  const handleDeactivateVolunteer = async (req: VolunteerRequest) => {
      if(window.confirm("Remove this volunteer?")) {
          await supabase.from('volunteer_requests').update({ status: 'REJECTED' }).eq('id', req.id);
          await supabase.from('profiles').update({ volunteer_status: 'NONE', is_volunteer: false }).eq('id', req.user_id);
          fetchActiveVolunteers();
      }
  }

  const handleCreateUpdate = async () => {
      if(!updateInput.title) return alert("Fill title");
      const { error } = await supabase.from('flash_updates').insert([{ ...updateInput, created_at: new Date().toISOString() }]);
      if (!error) { setUpdateInput({ title: '', content: '', type: 'NEWS' as 'NEWS', audience: 'PUBLIC' }); fetchUpdates(); alert("Published!"); }
  };
  
  const handleSaveCoinRate = async () => {
      await supabase.from('app_settings').upsert({ id: 'config', coin_rate: coinRate }); alert("Rate Updated");
  };
  const handleSaveVideoUrl = async () => {
      if (!videoUrl) return;
      const { data: existing } = await supabase.from('flash_updates').select('id').eq('type', 'VIDEO_CONFIG').single();
      if (existing) await supabase.from('flash_updates').update({ content: videoUrl, created_at: new Date().toISOString() }).eq('id', existing.id);
      else await supabase.from('flash_updates').insert([{ title: 'Home Video', content: videoUrl, type: 'VIDEO_CONFIG', audience: 'ALL', created_at: new Date().toISOString() }]);
      alert("Home Video Updated Successfully");
  };
  const handleSaveShopUrl = async () => {
      await supabase.from('site_config').upsert({ id: 'shop_url', url: shopUrl }); alert("Link Saved");
  };

  const handleAllocation = async () => {
      try {
          if (allocation.type === 'USER_TO_DU') {
              if(!allocation.sourceId || !allocation.targetId) return alert("Select User and Drying Unit");
              await supabase.from('profiles').update({ 
                  assignedDuId: allocation.targetId,
                  district: allocation.district,
                  taluk: allocation.taluk
              }).eq('id', allocation.sourceId);
          } 
          else if (allocation.type === 'DU_TO_NGO') {
              if(!allocation.sourceId || !allocation.targetId) return alert("Select Drying Unit and NGO");
              await supabase.from('profiles').update({ assignedDuId: allocation.sourceId }).eq('id', allocation.targetId);
          }
          else if (allocation.type === 'VOLUNTEER_TO_DU') {
              if(!allocation.sourceId || !allocation.targetId) return alert("Select Volunteer and Drying Unit");
              // Update Volunteer Request to PENDING_DU_APPROVAL
              // sourceId is the VolunteerRequest ID (from activeVolunteers list)
              await supabase.from('volunteer_requests').update({ 
                  assigned_du_id: allocation.targetId,
                  assignment_status: 'PENDING_DU_APPROVAL'
              }).eq('id', allocation.sourceId);
          }
          else if (allocation.type === 'TEMPLE_TO_DU') {
              if(!allocation.sourceId || !allocation.targetId) return alert("Select Temple and Drying Unit");
              // Update Temple table with assigned DU ID
              await supabase.from('temples').update({ duId: allocation.targetId }).eq('id', allocation.sourceId);
          }
          
          alert("Allocation Successful!");
          setAllocation({ ...allocation, sourceId: '', targetId: '', district: '', taluk: '' }); 
          fetchAllData();
      } catch (error: any) {
          console.error("Allocation error:", error);
          alert("Failed to allocate: " + error.message);
      }
  }

  // --- ENTITY ANALYTICS RENDERERS ---

  const renderEntityAnalytics = () => {
      if (!selectedEntity) return null;

      let graphData: any[] = [];
      let title = selectedEntity.name || selectedEntity.full_name;
      let subtitle = "";
      
      if (analyticsCategory === 'TEMPLE') {
          subtitle = "Waste Generated over time";
          const entityPickups = pickups.filter(p => p.requester_id === selectedEntity.id && p.status === 'COMPLETED');
          // Group by Date
          const agg: any = {};
          entityPickups.forEach(p => {
              const date = new Date(p.scheduled_date).toLocaleDateString();
              agg[date] = (agg[date] || 0) + (p.estimated_weight || 0);
          });
          graphData = Object.keys(agg).map(d => ({ name: d, value: agg[d] }));
      } else if (analyticsCategory === 'USER') {
          subtitle = "Personal Contribution";
          const entityPickups = pickups.filter(p => p.requester_id === selectedEntity.id && p.status === 'COMPLETED');
          const agg: any = {};
          entityPickups.forEach(p => {
              const date = new Date(p.scheduled_date).toLocaleDateString();
              agg[date] = (agg[date] || 0) + (p.estimated_weight || 0);
          });
          graphData = Object.keys(agg).map(d => ({ name: d, value: agg[d] }));
      } else if (analyticsCategory === 'DRYING_UNIT') {
          subtitle = "Total Waste Collected";
          const entityPickups = pickups.filter(p => p.ngo_id === selectedEntity.id && p.status === 'COMPLETED');
          const agg: any = {};
          entityPickups.forEach(p => {
              const date = new Date(p.scheduled_date).toLocaleDateString();
              agg[date] = (agg[date] || 0) + (p.estimated_weight || 0);
          });
          graphData = Object.keys(agg).map(d => ({ name: d, value: agg[d] }));
      } else if (analyticsCategory === 'NGO') {
          subtitle = "Stock Requests Approved";
          const entityRequests = stockRequests.filter(r => r.ngo_id === selectedEntity.id && r.status === 'APPROVED');
          const agg: any = {};
          entityRequests.forEach(r => {
              agg[r.item_name] = (agg[r.item_name] || 0) + r.quantity;
          });
          graphData = Object.keys(agg).map(d => ({ name: d, value: agg[d] }));
      }

      return (
          <div className="space-y-6 animate-fade-in">
             <button onClick={() => setSelectedEntity(null)} className="text-blue-500 mb-4 font-bold flex items-center gap-2 hover:underline"><span>←</span> Back to List</button>
             <div className="glass-panel p-8 rounded-3xl shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
                        <p className="text-stone-500 text-sm mt-1">{subtitle}</p>
                    </div>
                    <div className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600">
                        {analyticsCategory}
                    </div>
                 </div>
                 
                 <div className="h-80 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={graphData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis dataKey="name" tick={{fontSize: 10}} />
                             <YAxis />
                             <RechartsTooltip />
                             <Bar dataKey="value" fill={analyticsCategory === 'TEMPLE' ? '#f97316' : analyticsCategory === 'DRYING_UNIT' ? '#3b82f6' : analyticsCategory === 'NGO' ? '#22c55e' : '#a855f7'} radius={[4,4,0,0]} name={analyticsCategory === 'NGO' ? 'Units' : 'Weight (kg)'} />
                         </BarChart>
                     </ResponsiveContainer>
                     {graphData.length === 0 && <div className="text-center text-stone-400 mt-4">No data available for this entity.</div>}
                 </div>
             </div>
          </div>
      );
  };

  const sidebarItems = [
    { id: 'OVERVIEW', label: 'Overview', icon: '📊' },
    { id: 'USERS', label: 'All Users', icon: '👥' },
    { id: 'VOLUNTEER_REQUESTS', label: 'Volunteer Requests', icon: '🙋' },
    { id: 'VOLUNTEERS', label: 'Volunteers', icon: '🎗️' },
    { id: 'ANALYTICS', label: 'Graph Analytics', icon: '📈' },
    { id: 'ALLOCATION', label: 'Allocations', icon: '🔗' },
    { id: 'VERIFICATION', label: 'Verifications', icon: '✅' },
    { id: 'RATINGS', label: 'Feedback', icon: '⭐' },
    { id: 'ANNOUNCEMENTS', label: 'Updates', icon: '📢' },
    { id: 'SETTINGS', label: 'Settings', icon: '⚙️' },
  ];

  // Helper for filtering available volunteers
  const availableVolunteers = activeVolunteers.filter(v => v.assignment_status !== 'ACCEPTED');

  return (
    <>
      <DashboardLayout 
          title="Admin Command Center" 
          user={user}
          sidebarItems={sidebarItems} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={() => setShowLogoutDialog(true)}
          onSearch={setSearchQuery}
        >
          {activeTab === 'OVERVIEW' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                  <div className="glass-card p-6 rounded-3xl border-l-4 border-green-500">
                      <p className="text-stone-500 text-xs font-bold uppercase">Total Waste Recycled</p>
                      <p className="text-3xl font-bold mt-2 text-stone-800">{stats.waste > 1000 ? (stats.waste/1000).toFixed(2) + ' Tons' : stats.waste.toFixed(1) + ' Kg'}</p>
                  </div>
                  <div className="glass-card p-6 rounded-3xl border-l-4 border-blue-500">
                      <p className="text-stone-500 text-xs font-bold uppercase">Drying Units</p>
                      <p className="text-3xl font-bold mt-2 text-stone-800">{stats.dus}</p>
                  </div>
                  <div className="glass-card p-6 rounded-3xl border-l-4 border-orange-500">
                      <p className="text-stone-500 text-xs font-bold uppercase">Temples</p>
                      <p className="text-3xl font-bold mt-2 text-stone-800">{stats.temples}</p>
                  </div>
                  <div className="glass-card p-6 rounded-3xl border-l-4 border-red-500 cursor-pointer" onClick={() => setActiveTab('VERIFICATION')}>
                      <p className="text-stone-500 text-xs font-bold uppercase">Pending DUs</p>
                      <p className="text-3xl font-bold mt-2 text-red-600">{stats.pending}</p>
                  </div>
                  
                  {/* New Stats Cards */}
                  <div className="glass-card p-6 rounded-3xl border-l-4 border-purple-500">
                      <p className="text-stone-500 text-xs font-bold uppercase">Total Users</p>
                      <p className="text-3xl font-bold mt-2 text-stone-800">{stats.users}</p>
                  </div>
                  <div className="glass-card p-6 rounded-3xl border-l-4 border-teal-500">
                      <p className="text-stone-500 text-xs font-bold uppercase">Total NGOs</p>
                      <p className="text-3xl font-bold mt-2 text-stone-800">{stats.ngos}</p>
                  </div>
                  <div className="glass-card p-6 rounded-3xl border-l-4 border-yellow-500">
                      <p className="text-stone-500 text-xs font-bold uppercase">Total Volunteers</p>
                      <p className="text-3xl font-bold mt-2 text-stone-800">{stats.volunteers}</p>
                  </div>
              </div>
          )}

          {activeTab === 'USERS' && (
              <div className="glass-panel p-6 rounded-3xl animate-fade-in">
                <h3 className="font-bold text-slate-800 mb-6 text-xl">All Registered Entities</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-slate-400 uppercase border-b border-slate-200">
                                <th className="pb-3 pl-2">Name</th>
                                <th className="pb-3">Contact / Location</th>
                                <th className="pb-3">Role</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right pr-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {/* 1. Temples */}
                            {templeStats.map((t, idx) => (
                                <tr key={`t-${t.id}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 pl-2 font-bold text-slate-700">{t.name}</td>
                                    <td className="py-3 text-slate-500">{t.location}</td>
                                    <td className="py-3"><span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">TEMPLE</span></td>
                                    <td className="py-3"><span className="text-green-600 font-bold text-xs">Active</span></td>
                                    <td className="py-3 text-right pr-4"><button className="text-xs text-blue-500 hover:underline">View</button></td>
                                </tr>
                            ))}
                            {/* 2. Drying Units */}
                            {dus.map((d, idx) => (
                                <tr key={`d-${d.id}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 pl-2 font-bold text-slate-700">{d.full_name}</td>
                                    <td className="py-3 text-slate-500">{d.email}</td>
                                    <td className="py-3"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">DRYING UNIT</span></td>
                                    <td className="py-3"><span className="text-green-600 font-bold text-xs">Verified</span></td>
                                    <td className="py-3 text-right pr-4"><button className="text-xs text-blue-500 hover:underline">View</button></td>
                                </tr>
                            ))}
                            {/* 3. NGOs */}
                            {ngos.map((n, idx) => (
                                <tr key={`n-${n.id}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 pl-2 font-bold text-slate-700">{n.full_name}</td>
                                    <td className="py-3 text-slate-500">{n.email}</td>
                                    <td className="py-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">NGO</span></td>
                                    <td className="py-3"><span className="text-green-600 font-bold text-xs">Active</span></td>
                                    <td className="py-3 text-right pr-4"><button className="text-xs text-blue-500 hover:underline">View</button></td>
                                </tr>
                            ))}
                            {/* 4. Users */}
                            {users.map((u, idx) => (
                                <tr key={`u-${u.id}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 pl-2 font-bold text-slate-700">{u.full_name || 'User'}</td>
                                    <td className="py-3 text-slate-500">{u.email}</td>
                                    <td className="py-3"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">USER</span></td>
                                    <td className="py-3"><span className="text-green-600 font-bold text-xs">Active</span></td>
                                    <td className="py-3 text-right pr-4"><button className="text-xs text-blue-500 hover:underline">View</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
          )}

          {activeTab === 'VOLUNTEER_REQUESTS' && (
              <div className="glass-panel p-6 rounded-3xl">
                  <h3 className="font-bold text-slate-700 mb-6 text-xl">Pending Volunteer Applications</h3>
                  <div className="space-y-4">
                      {volunteerRequests.map(req => (
                          <div key={req.id} className="p-4 bg-white rounded-xl border border-stone-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="flex-1">
                                  <h4 className="font-bold text-slate-800">{req.full_name}</h4>
                                  <p className="text-xs text-slate-500">📞 {req.contact}</p>
                                  <p className="text-xs text-slate-500">📍 {req.taluk}, {req.district}, {req.state}</p>
                                  {req.notes && <p className="text-xs text-slate-600 italic mt-1 bg-stone-50 p-2 rounded">"{req.notes}"</p>}
                                  <button 
                                      onClick={() => setViewingProof(req.id_proof_url)}
                                      className="text-xs text-blue-600 font-bold mt-2 hover:underline flex items-center gap-1"
                                  >
                                      🆔 View ID Proof
                                  </button>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => handleVolunteerAction(req, 'APPROVED')} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700">Approve</button>
                                  <button onClick={() => handleVolunteerAction(req, 'REJECTED')} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-200">Reject</button>
                              </div>
                          </div>
                      ))}
                      {volunteerRequests.length === 0 && <p className="text-center text-stone-400 py-10">No pending requests.</p>}
                  </div>
              </div>
          )}

          {activeTab === 'VOLUNTEERS' && (
              <div className="glass-panel p-6 rounded-3xl">
                  <h3 className="font-bold text-slate-700 mb-6 text-xl">Active Community Volunteers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeVolunteers.map(vol => {
                          const assignedDu = dus.find(d => d.id === vol.assigned_du_id);
                          return (
                              <div key={vol.id} className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm relative group">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <h4 className="font-bold text-slate-800">{vol.full_name}</h4>
                                          <p className="text-xs text-slate-500 font-medium">Joined: {new Date(vol.created_at).toLocaleDateString()}</p>
                                      </div>
                                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">ACTIVE</span>
                                  </div>
                                  <div className="mt-4 space-y-1">
                                      <p className="text-xs text-slate-600">📞 {vol.contact}</p>
                                      <p className="text-xs text-slate-600">📍 {vol.taluk}, {vol.district}</p>
                                  </div>
                                  
                                  <div className="mt-4 pt-3 border-t border-slate-100 bg-stone-50 p-2 rounded-lg">
                                      <p className="text-[10px] text-stone-400 uppercase font-bold">Assigned Unit</p>
                                      {assignedDu ? (
                                          <p className="text-xs font-bold text-blue-600">{assignedDu.full_name}</p>
                                      ) : (
                                          <p className="text-xs text-stone-500 italic">Not Assigned</p>
                                      )}
                                      {vol.assignment_status === 'PENDING_DU_APPROVAL' && (
                                          <p className="text-[10px] text-orange-500 font-bold mt-1">Status: Pending DU Approval</p>
                                      )}
                                      {vol.assignment_status === 'REJECTED_BY_DU' && (
                                          <p className="text-[10px] text-red-500 font-bold mt-1">Rejected by DU: {vol.rejection_reason}</p>
                                      )}
                                  </div>

                                  <div className="mt-2 flex justify-between items-center pt-2">
                                      <button onClick={() => setViewingProof(vol.id_proof_url)} className="text-xs text-blue-500 font-bold">View ID</button>
                                      <button onClick={() => handleDeactivateVolunteer(vol)} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                                  </div>
                              </div>
                          );
                      })}
                      {activeVolunteers.length === 0 && <p className="col-span-full text-center text-stone-400 py-10">No active volunteers.</p>}
                  </div>
              </div>
          )}

          {/* Modal for ID Proof */}
          {viewingProof && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setViewingProof(null)}>
                  <div className="bg-white p-2 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setViewingProof(null)} className="absolute top-2 right-2 bg-stone-100 rounded-full p-2 hover:bg-red-100 text-stone-600 hover:text-red-600">✕</button>
                      <img src={viewingProof} alt="ID Proof" className="w-full h-full object-contain" />
                  </div>
              </div>
          )}

          {activeTab === 'ANALYTICS' && (
            <div className="space-y-6">
              {/* 1. Category Selection */}
              {!selectedEntity && (
                  <div className="flex flex-col items-center">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-stone-100 mb-8">
                        {['TEMPLE', 'USER', 'NGO', 'DRYING_UNIT'].map(cat => (
                            <button 
                              key={cat}
                              onClick={() => setAnalyticsCategory(cat as any)} 
                              className={`px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all ${analyticsCategory === cat ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {cat === 'DRYING_UNIT' ? 'Drying Units' : cat + 's'}
                            </button>
                        ))}
                    </div>

                    <h3 className="font-bold text-slate-700 mb-6 text-xl">Select {analyticsCategory} to View Analytics</h3>
                    
                    {/* 2. Entity List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-6xl">
                        {analyticsCategory === 'TEMPLE' && templeStats.map(t => (
                            <div key={t.id} onClick={() => setSelectedEntity(t)} className="bg-white p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all border border-stone-100 group">
                                <h4 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{t.name}</h4>
                                <p className="text-xs text-stone-500">{t.location}</p>
                            </div>
                        ))}
                        {analyticsCategory === 'USER' && users.map(u => (
                            <div key={u.id} onClick={() => setSelectedEntity(u)} className="bg-white p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all border border-stone-100 group">
                                <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{u.full_name || 'User'}</h4>
                                <p className="text-xs text-stone-500">{u.email}</p>
                            </div>
                        ))}
                        {analyticsCategory === 'DRYING_UNIT' && dus.map(d => (
                            <div key={d.id} onClick={() => setSelectedEntity(d)} className="bg-white p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all border border-stone-100 group">
                                <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{d.full_name}</h4>
                                <p className="text-xs text-stone-500">{d.email}</p>
                            </div>
                        ))}
                        {analyticsCategory === 'NGO' && ngos.map(n => (
                            <div key={n.id} onClick={() => setSelectedEntity(n)} className="bg-white p-6 rounded-2xl cursor-pointer hover:shadow-lg transition-all border border-stone-100 group">
                                <h4 className="font-bold text-slate-800 group-hover:text-green-600 transition-colors">{n.full_name}</h4>
                                <p className="text-xs text-stone-500">{n.email}</p>
                            </div>
                        ))}
                    </div>
                    
                    {/* Empty States */}
                    {analyticsCategory === 'TEMPLE' && templeStats.length === 0 && <p className="text-stone-400">No temples found.</p>}
                    {analyticsCategory === 'USER' && users.length === 0 && <p className="text-stone-400">No users found.</p>}
                    {analyticsCategory === 'DRYING_UNIT' && dus.length === 0 && <p className="text-stone-400">No drying units found.</p>}
                    {analyticsCategory === 'NGO' && ngos.length === 0 && <p className="text-stone-400">No NGOs found.</p>}
                  </div>
              )}

              {/* 3. Detailed Graph View */}
              {selectedEntity && renderEntityAnalytics()}
            </div>
          )}

          {activeTab === 'ALLOCATION' && (
              <div className="glass-panel p-8 rounded-3xl max-w-4xl mx-auto">
                  <h3 className="text-2xl font-bold text-slate-800 mb-6">Resource Allocation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                          <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">1. Allocation Type</label>
                          <div className="flex flex-col gap-2 mb-6">
                              <button onClick={() => setAllocation({...allocation, type: 'USER_TO_DU'})} className={`py-3 px-4 rounded-xl font-bold border text-left ${allocation.type === 'USER_TO_DU' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200'}`}>User ➔ Drying Unit</button>
                              <button onClick={() => setAllocation({...allocation, type: 'TEMPLE_TO_DU'})} className={`py-3 px-4 rounded-xl font-bold border text-left ${allocation.type === 'TEMPLE_TO_DU' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-slate-500 border-slate-200'}`}>Temple ➔ Drying Unit</button>
                              <button onClick={() => setAllocation({...allocation, type: 'DU_TO_NGO'})} className={`py-3 px-4 rounded-xl font-bold border text-left ${allocation.type === 'DU_TO_NGO' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-500 border-slate-200'}`}>Drying Unit ➔ Partner NGO</button>
                              <button onClick={() => setAllocation({...allocation, type: 'VOLUNTEER_TO_DU'})} className={`py-3 px-4 rounded-xl font-bold border text-left ${allocation.type === 'VOLUNTEER_TO_DU' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-slate-200'}`}>Volunteer ➔ Drying Unit</button>
                          </div>
                      </div>
                      <div>
                          {allocation.type === 'USER_TO_DU' && (
                              <div className="space-y-4">
                                  <label className="block text-xs font-bold text-slate-400 uppercase">Select User</label>
                                  <select className="w-full p-3 rounded-xl border" value={allocation.sourceId} onChange={(e) => setAllocation({...allocation, sourceId: e.target.value})}>
                                      <option value="">-- Choose User --</option>
                                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                                  </select>
                                  <div className="flex gap-2">
                                      <input placeholder="District" className="flex-1 p-3 rounded-xl border" value={allocation.district} onChange={e => setAllocation({...allocation, district: e.target.value})} />
                                      <input placeholder="Taluk" className="flex-1 p-3 rounded-xl border" value={allocation.taluk} onChange={e => setAllocation({...allocation, taluk: e.target.value})} />
                                  </div>
                                  <label className="block text-xs font-bold text-slate-400 uppercase">Assign Drying Unit</label>
                                  <select className="w-full p-3 rounded-xl border" value={allocation.targetId} onChange={(e) => setAllocation({...allocation, targetId: e.target.value})}>
                                      <option value="">-- Choose DU --</option>
                                      {dus.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                                  </select>
                              </div>
                          )}
                          {allocation.type === 'TEMPLE_TO_DU' && (
                              <div className="space-y-4">
                                  <label className="block text-xs font-bold text-slate-400 uppercase">Select Temple</label>
                                  <select className="w-full p-3 rounded-xl border" value={allocation.sourceId} onChange={(e) => setAllocation({...allocation, sourceId: e.target.value})}>
                                      <option value="">-- Choose Temple --</option>
                                      {templeStats.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                                  <label className="block text-xs font-bold text-slate-400 uppercase">Assign Drying Unit</label>
                                  <select className="w-full p-3 rounded-xl border" value={allocation.targetId} onChange={(e) => setAllocation({...allocation, targetId: e.target.value})}>
                                      <option value="">-- Choose DU --</option>
                                      {dus.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                                  </select>
                              </div>
                          )}
                          {allocation.type === 'DU_TO_NGO' && (
                              <div className="space-y-4">
                                  <label className="block text-xs font-bold text-slate-400 uppercase">Select Drying Unit (Source)</label>
                                  <select className="w-full p-3 rounded-xl border" value={allocation.sourceId} onChange={(e) => setAllocation({...allocation, sourceId: e.target.value})}>
                                      <option value="">-- Choose DU --</option>
                                      {dus.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                                  </select>
                                  <label className="block text-xs font-bold text-slate-400 uppercase">Assign to Partner NGO</label>
                                  <select className="w-full p-3 rounded-xl border" value={allocation.targetId} onChange={(e) => setAllocation({...allocation, targetId: e.target.value})}>
                                      <option value="">-- Choose NGO --</option>
                                      {ngos.map(n => <option key={n.id} value={n.id}>{n.full_name}</option>)}
                                  </select>
                              </div>
                          )}
                          {allocation.type === 'VOLUNTEER_TO_DU' && (
                              <div className="space-y-4">
                                  <label className="block text-xs font-bold text-slate-400 uppercase">
                                      Select Approved Volunteer ({availableVolunteers.length})
                                  </label>
                                  <select className="w-full p-3 rounded-xl border" value={allocation.sourceId} onChange={(e) => setAllocation({...allocation, sourceId: e.target.value})}>
                                      <option value="">-- Choose Volunteer --</option>
                                      {availableVolunteers.length > 0 ? (
                                          availableVolunteers.map(v => (
                                              <option key={v.id} value={v.id}>{v.full_name} ({v.district})</option>
                                          ))
                                      ) : (
                                          <option disabled>No unassigned approved volunteers found</option>
                                      )}
                                  </select>
                                  <label className="block text-xs font-bold text-slate-400 uppercase">Assign to Drying Unit</label>
                                  <select className="w-full p-3 rounded-xl border" value={allocation.targetId} onChange={(e) => setAllocation({...allocation, targetId: e.target.value})}>
                                      <option value="">-- Choose DU --</option>
                                      {dus.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                                  </select>
                              </div>
                          )}
                          <button onClick={handleAllocation} className="w-full mt-6 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg">Confirm Allocation</button>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'VERIFICATION' && (
              <div className="glass-panel rounded-3xl p-6 bg-orange-50/50 border border-orange-100">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Pending Drying Unit Approvals</h3>
                    <div className="space-y-4">
                        {pendingDus.map(du => (
                            <div key={du.id} className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                                <div><p className="font-bold">{du.full_name}</p><p className="text-xs text-stone-500">{du.email}</p></div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleApproveDu(du.id, du.email, true)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">Approve</button>
                                    <button onClick={() => handleApproveDu(du.id, du.email, false)} className="bg-red-100 text-red-600 px-3 py-1 rounded text-xs font-bold">Reject</button>
                                </div>
                            </div>
                        ))}
                        {pendingDus.length === 0 && <p className="text-center text-stone-400">No pending approvals.</p>}
                    </div>
              </div>
          )}

          {activeTab === 'RATINGS' && (
              <div className="glass-panel p-6 rounded-3xl">
                  <h3 className="font-bold text-stone-800 mb-4">Feedback Overview</h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {ratings.map(r => {
                          const from = getNameForId(r.from_id);
                          const to = getNameForId(r.to_id);
                          return (
                              <div key={r.id} className="p-4 bg-white/80 rounded-xl border border-stone-100 shadow-sm">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-stone-400">
                                              <span>{from.role}</span><span>➔</span><span>{to.role}</span>
                                          </div>
                                          <p className="text-sm font-bold text-slate-800">{to.name}</p>
                                      </div>
                                      <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded">★ {r.rating}</span>
                                  </div>
                                  {r.reason && <p className="text-xs text-stone-600 italic bg-stone-50 p-2 rounded">"{r.reason}"</p>}
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {activeTab === 'ANNOUNCEMENTS' && (
              <div className="glass-panel p-6 rounded-3xl">
                  <h3 className="font-bold text-slate-800 mb-4">Create Update</h3>
                  <div className="space-y-4">
                    <input placeholder="Title" value={updateInput.title} onChange={e => setUpdateInput({...updateInput, title: e.target.value})} className="w-full p-3 rounded-xl border" />
                    <textarea placeholder="Content" value={updateInput.content} onChange={e => setUpdateInput({...updateInput, content: e.target.value})} className="w-full p-3 rounded-xl border h-24" />
                    <button onClick={handleCreateUpdate} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold">Publish</button>
                  </div>
              </div>
          )}

          {activeTab === 'SETTINGS' && (
              <div className="glass-panel p-8 rounded-3xl max-w-2xl mx-auto">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">System Config</h3>
                  <div className="flex gap-4 mb-4"><input type="number" value={coinRate} onChange={e => setCoinRate(Number(e.target.value))} className="border rounded px-4 py-2" /><button onClick={handleSaveCoinRate} className="bg-slate-800 text-white px-4 py-2 rounded">Set Coin Rate</button></div>
                  <div className="flex gap-4 mb-4"><input value={shopUrl} onChange={e => setShopUrl(e.target.value)} className="border rounded px-4 py-2 flex-1" /><button onClick={handleSaveShopUrl} className="bg-slate-800 text-white px-4 py-2 rounded">Set Shop URL</button></div>
                  <button onClick={() => setShowLogoutDialog(true)} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold">Logout</button>
              </div>
          )}
      </DashboardLayout>

      {/* Logout Confirmation Dialog */}
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
