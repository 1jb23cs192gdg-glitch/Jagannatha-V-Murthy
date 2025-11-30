import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Temple } from '../../types';

interface DashboardProps {
  onLogout?: () => void;
}

const AdminDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VOLUNTEERS' | 'ALLOCATION' | 'REQUESTS' | 'WASTE_LOGS' | 'SETTINGS'>('OVERVIEW');
  const [updateTitle, setUpdateTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [appLink, setAppLink] = useState('');
  const [temples, setTemples] = useState<Temple[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [pendingVolunteers, setPendingVolunteers] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  const [assignmentMap, setAssignmentMap] = useState<{[key: string]: string}>({});
  const [stats, setStats] = useState({
    pending: 0,
    waste: 0,
    ngos: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetchAdminData();
    fetchConfigs();
    fetchServiceRequests();
    fetchWasteLogs();
  }, []);

  const fetchConfigs = async () => {
    const { data: videoData } = await supabase.from('flash_updates').select('*').eq('type', 'VIDEO_CONFIG').single();
    if (videoData) setVideoUrl(videoData.content);

    const { data: appData } = await supabase.from('flash_updates').select('*').eq('type', 'APP_LINK_CONFIG').single();
    if (appData) setAppLink(appData.content);
  };

  const fetchServiceRequests = async () => {
    const { data } = await supabase
      .from('service_requests')
      .select('*, temples(name, location)')
      .neq('status', 'RESOLVED') // Show active stuff
      .order('created_at', { ascending: false });
    
    // Filter out messages for the general request tab if desired, or keep them
    // For now we show PENDING requests and MESSAGES that aren't resolved
    setServiceRequests(data || []);
  };

  const fetchWasteLogs = async () => {
    const { data } = await supabase.from('waste_logs').select('*');
    if (data) {
       const sorted = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
       setWasteLogs(sorted);
    }
  };

  const fetchAdminData = async () => {
    try {
      const { data: templeData } = await supabase.from('temples').select('*');
      if (templeData) {
        setTemples(templeData.map(t => ({
          ...t, 
          wasteDonatedKg: t.waste_donated_kg, 
          imageUrl: t.image_url,
          ngoId: t.ngo_id 
        })));
        
        const totalWaste = templeData.reduce((acc, curr) => acc + (curr.waste_donated_kg || 0), 0);
        setStats(prev => ({ ...prev, waste: totalWaste }));
      }

      const { data: ngoData } = await supabase.from('profiles').select('*').eq('role', 'NGO');
      setNgos(ngoData || []);
      setStats(prev => ({ ...prev, ngos: ngoData?.length || 0 }));

      const { data: volData } = await supabase.from('profiles').select('*').eq('volunteer_status', 'PENDING');
      setPendingVolunteers(volData || []);
      setStats(prev => ({ ...prev, pending: volData?.length || 0 }));

      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'PERSON');
      setStats(prev => ({ ...prev, totalUsers: userCount || 0 }));

    } catch (error) {
      console.error("Admin data fetch error:", error);
    }
  };

  // Helper
  const extractVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handlePostUpdate = async () => {
    if (!updateTitle.trim()) {
      alert("Please enter a title for the update.");
      return;
    }
    const { error } = await supabase.from('flash_updates').insert([{
      title: updateTitle,
      content: "New update from Admin console.",
      type: 'NEWS'
    }]);
    if (error) console.error(error);
    else {
      alert("Update Posted!");
      setUpdateTitle('');
    }
  };

  const handleUpdateVideo = async () => {
    if (!videoUrl.trim()) return;
    const id = extractVideoId(videoUrl);
    if (!id) {
       alert("Invalid YouTube URL");
       return;
    }
    const cleanUrl = `https://www.youtube.com/watch?v=${id}`;
    const { error } = await supabase.from('flash_updates').upsert([{ // Upsert allows updating if ID logic matches, but standard insert for log is safer unless we manage IDs. We'll stick to insert for log but for config we want single row. 
      // Simplified: Just insert new config, UI takes latest.
      title: 'Homepage Video',
      content: cleanUrl,
      type: 'VIDEO_CONFIG'
    }]);
    
    if (error) alert("Failed to update video.");
    else {
      setVideoUrl(cleanUrl); 
      alert("Homepage Video Updated!");
    }
  };

  const handleUpdateAppLink = async () => {
    if (!appLink.trim()) return;
    const { error } = await supabase.from('flash_updates').insert([{
      title: 'App Link',
      content: appLink,
      type: 'APP_LINK_CONFIG'
    }]);
    if (!error) alert("External Product App Link Updated!");
  };

  const handleApproveVolunteer = async (userId: string) => {
    const assignedTemple = assignmentMap[userId];
    if (!assignedTemple) {
      alert("Please assign a temple to the volunteer before approving.");
      return;
    }
    const { error } = await supabase.from('profiles').update({ 
        volunteer_status: 'APPROVED', 
        is_volunteer: true,
        assigned_temple_id: assignedTemple
      }).eq('id', userId);
    
    if (!error) {
      setPendingVolunteers(prev => prev.filter(v => v.id !== userId));
      setStats(prev => ({ ...prev, pending: prev.pending - 1 }));
      alert("Volunteer Approved and Assigned!");
    }
  };

  const handleAssignNgo = async (templeId: string, ngoId: string) => {
    const { error } = await supabase.from('temples').update({ ngo_id: ngoId }).eq('id', templeId);
    if (!error) {
      alert("NGO Assigned successfully.");
      await fetchAdminData();
    }
  };

  const resolveRequest = async (id: string) => {
    const { error } = await supabase.from('service_requests').update({ status: 'RESOLVED' }).eq('id', id);
    if (!error) {
      setServiceRequests(prev => prev.filter(r => r.id !== id));
      alert("Item marked as Resolved.");
    }
  };

  const handleApproveProof = async (req: any) => {
    const { error: photoError } = await supabase.from('temple_photos').insert([{
      temple_id: req.temple_id,
      image_url: req.image_url,
      caption: 'Verified Activity Proof'
    }]);
    if (photoError) { alert("Failed to publish."); return; }
    const { error: updateError } = await supabase.from('service_requests').update({ status: 'APPROVED' }).eq('id', req.id);
    if (!updateError) {
      setServiceRequests(prev => prev.filter(r => r.id !== req.id));
      alert("Approved & Published!");
    }
  };

  const handleAdvanceWasteStatus = async (log: any) => {
    const nextStatusMap: Record<string, string> = {
      'COLLECTED': 'SEGREGATED',
      'SEGREGATED': 'PROCESSED',
      'PROCESSED': 'PRODUCT'
    };
    const nextStatus = nextStatusMap[log.status];
    if (!nextStatus) return;
    const { error } = await supabase.from('waste_logs').update({ status: nextStatus }).eq('id', log.id);
    if (!error) {
       setWasteLogs(prev => prev.map(item => item.id === log.id ? { ...item, status: nextStatus } : item));
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">Admin Command Center</h1>
            <p className="text-stone-500">Monitor ecosystem, manage entities, and broadcast updates.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onLogout} className="bg-red-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-red-700 shadow-md">Logout</button>
          </div>
        </header>

        {/* Tab Nav */}
        <div className="flex space-x-2 mb-8 border-b border-stone-200 overflow-x-auto pb-1 scrollbar-hide">
          {['OVERVIEW', 'VOLUNTEERS', 'ALLOCATION', 'REQUESTS', 'WASTE_LOGS', 'SETTINGS'].map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`whitespace-nowrap pb-3 px-4 text-sm font-bold transition-all ${activeTab === tab ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-t-lg'}`}
             >
               {tab.replace('_', ' ')}
             </button>
          ))}
        </div>

        {activeTab === 'OVERVIEW' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200"><h3 className="text-xs font-bold text-stone-400 uppercase">Pending Volunteers</h3><p className="text-4xl font-bold text-orange-600 mt-2">{stats.pending}</p></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200"><h3 className="text-xs font-bold text-stone-400 uppercase">Total Waste Recycled</h3><p className="text-4xl font-bold text-green-600 mt-2">{stats.waste.toLocaleString()} <span className="text-lg text-stone-400">Kg</span></p></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200"><h3 className="text-xs font-bold text-stone-400 uppercase">Active NGOs</h3><p className="text-4xl font-bold text-blue-600 mt-2">{stats.ngos}</p></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200"><h3 className="text-xs font-bold text-stone-400 uppercase">Total Users</h3><p className="text-4xl font-bold text-purple-600 mt-2">{stats.totalUsers.toLocaleString()}</p></div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
              <h2 className="font-bold text-xl mb-4 text-stone-800">Post Flash Update</h2>
              <div className="flex flex-col md:flex-row gap-4">
                 <input type="text" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} placeholder="Update Title..." className="flex-1 rounded-xl border-stone-300 border p-4 text-sm outline-none" />
                 <button onClick={handlePostUpdate} className="bg-stone-800 text-white px-8 py-3 rounded-xl text-sm font-bold">Post Update</button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'VOLUNTEERS' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
             <div className="p-6 border-b border-stone-100"><h2 className="font-bold text-xl text-stone-800">Volunteer Management</h2></div>
             <div className="divide-y divide-stone-100">
               {pendingVolunteers.length === 0 ? <div className="p-12 text-center text-stone-400">No pending requests.</div> : pendingVolunteers.map(vol => (
                   <div key={vol.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                     <div><h3 className="font-bold text-stone-800 text-lg">{vol.full_name || vol.email}</h3><p className="text-sm text-stone-500">{vol.email}</p></div>
                     <div className="flex gap-3">
                        <select className="border rounded-xl p-3 text-sm md:w-64" value={assignmentMap[vol.id] || ''} onChange={(e) => setAssignmentMap({...assignmentMap, [vol.id]: e.target.value})}>
                          <option value="">Select Temple...</option>{temples.map(t => (<option key={t.id} value={t.id}>{t.name} ({t.location})</option>))}
                        </select>
                        <button onClick={() => handleApproveVolunteer(vol.id)} className="bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold">Approve</button>
                     </div>
                   </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'ALLOCATION' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
             <div className="p-6 border-b border-stone-100"><h2 className="font-bold text-xl text-stone-800">NGO Allocation</h2></div>
             <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold"><tr><th className="px-6 py-4">Temple</th><th className="px-6 py-4">Current NGO</th><th className="px-6 py-4">Action</th></tr></thead>
                 <tbody className="divide-y divide-stone-100">{temples.map(t => { const assignedNgo = ngos.find(n => n.id === t.ngoId); return (
                       <tr key={t.id}><td className="px-6 py-4 font-bold">{t.name}</td><td className="px-6 py-4">{assignedNgo ? <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{assignedNgo.full_name}</span> : <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">Unassigned</span>}</td>
                         <td className="px-6 py-4"><select onChange={(e) => handleAssignNgo(t.id, e.target.value)} className="border rounded-lg p-2 text-sm" value={assignedNgo ? assignedNgo.id : ""}><option value="" disabled>Select NGO</option>{ngos.map(n => (<option key={n.id} value={n.id}>{n.full_name}</option>))}</select></td></tr>
                     );})}</tbody></table></div>
          </div>
        )}
        
        {activeTab === 'REQUESTS' && (
           <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
             <div className="p-6 border-b border-stone-100"><h2 className="font-bold text-xl text-stone-800">Inbox & Requests</h2><p className="text-sm text-stone-500">Service requests, proofs, and communication.</p></div>
             <div className="divide-y divide-stone-100">
                {serviceRequests.length === 0 ? <div className="p-12 text-center text-stone-400">Inbox Empty</div> : serviceRequests.map(req => (
                    <div key={req.id} className="p-6 flex flex-col md:flex-row justify-between items-start gap-4">
                       <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1"><h3 className="font-bold text-stone-800">{req.temples?.name || 'User Request'}</h3></div>
                         <div className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold mb-2">{req.request_type}</div>
                         <p className="text-xs text-stone-400 mb-2">{new Date(req.created_at).toLocaleString()}</p>
                         {req.request_type === 'MESSAGE_TEMPLE' || req.request_type === 'MESSAGE_USER' ? (
                             <p className="text-sm text-stone-700 bg-stone-50 p-3 rounded border border-stone-200">"{req.message || 'No content'}"</p>
                         ) : null}
                         {req.request_type === 'ACTIVITY_PROOF' && req.image_url && <img src={req.image_url} alt="Proof" className="h-32 rounded-lg border shadow-sm mt-2" />}
                       </div>
                       <div className="flex gap-2">
                         {req.request_type === 'ACTIVITY_PROOF' ? (
                            <><button onClick={() => handleApproveProof(req)} className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">Approve</button><button onClick={() => resolveRequest(req.id)} className="bg-stone-500 text-white px-3 py-1 rounded text-sm font-bold">Dismiss</button></>
                         ) : (<button onClick={() => resolveRequest(req.id)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Mark Read / Resolved</button>)}
                       </div>
                    </div>
                ))}
             </div>
           </div>
        )}

        {activeTab === 'WASTE_LOGS' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
             <div className="p-6 border-b border-stone-100"><h2 className="font-bold text-xl text-stone-800">Lifecycle Management</h2></div>
             <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold"><tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Action</th></tr></thead>
                 <tbody className="divide-y divide-stone-100">{wasteLogs.map(log => (
                       <tr key={log.id}><td className="px-6 py-4 text-sm">{new Date(log.created_at).toLocaleDateString()}</td><td className="px-6 py-4 font-bold">{log.waste_type} ({log.amount_kg}kg)</td>
                         <td className="px-6 py-4"><span className="bg-stone-100 px-2 py-1 rounded text-xs font-bold">{log.status}</span></td>
                         <td className="px-6 py-4">{log.status !== 'PRODUCT' && <button onClick={() => handleAdvanceWasteStatus(log)} className="bg-orange-600 text-white px-3 py-1 rounded text-xs font-bold">Advance Status</button>}</td></tr>
                      ))}</tbody></table></div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
           <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 space-y-8">
              <div>
                 <h2 className="font-bold text-xl mb-4 text-stone-800">Homepage Video</h2>
                 <div className="flex gap-2"><input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube Link..." className="flex-1 rounded-xl border p-3 text-sm outline-none" /><button onClick={handleUpdateVideo} className="bg-stone-800 text-white px-6 py-3 rounded-xl text-sm font-bold">Update</button></div>
              </div>
              <div className="pt-8 border-t border-stone-100">
                 <h2 className="font-bold text-xl mb-4 text-stone-800">External Product App Link</h2>
                 <p className="text-sm text-stone-500 mb-4">Set the link where NGOs can register final products.</p>
                 <div className="flex gap-2"><input type="text" value={appLink} onChange={(e) => setAppLink(e.target.value)} placeholder="https://..." className="flex-1 rounded-xl border p-3 text-sm outline-none" /><button onClick={handleUpdateAppLink} className="bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold">Save Link</button></div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;