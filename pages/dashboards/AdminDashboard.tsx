import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Temple } from '../../types';

interface DashboardProps {
  onLogout?: () => void;
}

const AdminDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VOLUNTEERS' | 'ALLOCATION' | 'REQUESTS' | 'SETTINGS'>('OVERVIEW');
  const [updateTitle, setUpdateTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [temples, setTemples] = useState<Temple[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [pendingVolunteers, setPendingVolunteers] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [assignmentMap, setAssignmentMap] = useState<{[key: string]: string}>({});
  const [stats, setStats] = useState({
    pending: 0,
    waste: 0,
    ngos: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetchAdminData();
    fetchVideoConfig();
    fetchServiceRequests();
  }, []);

  const fetchVideoConfig = async () => {
    const { data } = await supabase.from('flash_updates').select('*').eq('type', 'VIDEO_CONFIG').single();
    if (data) setVideoUrl(data.content);
  };

  const fetchServiceRequests = async () => {
    const { data } = await supabase
      .from('service_requests')
      .select('*, temples(name, location)')
      .eq('status', 'PENDING');
    setServiceRequests(data || []);
  };

  const fetchAdminData = async () => {
    try {
      // 1. Fetch Temples
      const { data: templeData } = await supabase.from('temples').select('*');
      if (templeData) {
        setTemples(templeData.map(t => ({...t, wasteDonatedKg: t.waste_donated_kg, imageUrl: t.image_url})));
        const totalWaste = templeData.reduce((acc, curr) => acc + (curr.waste_donated_kg || 0), 0);
        setStats(prev => ({ ...prev, waste: totalWaste }));
      }

      // 2. Fetch NGOs
      const { data: ngoData } = await supabase.from('profiles').select('*').eq('role', 'NGO');
      setNgos(ngoData || []);
      setStats(prev => ({ ...prev, ngos: ngoData?.length || 0 }));

      // 3. Fetch Pending Volunteers
      const { data: volData } = await supabase.from('profiles').select('*').eq('volunteer_status', 'PENDING');
      setPendingVolunteers(volData || []);
      setStats(prev => ({ ...prev, pending: volData?.length || 0 }));

      // 4. Fetch Users Count
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'PERSON');
      setStats(prev => ({ ...prev, totalUsers: userCount || 0 }));

    } catch (error) {
      console.error("Admin data fetch error:", error);
    }
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
    const { error } = await supabase.from('flash_updates').insert([{
      title: 'Homepage Video',
      content: videoUrl,
      type: 'VIDEO_CONFIG'
    }]);
    if (error) alert("Failed to update video.");
    else {
      alert("Homepage Video Updated!");
    }
  };

  const handleApproveVolunteer = async (userId: string) => {
    const assignedTemple = assignmentMap[userId];
    if (!assignedTemple) {
      alert("Please assign a temple to the volunteer before approving.");
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        volunteer_status: 'APPROVED', 
        is_volunteer: true,
        assigned_temple_id: assignedTemple
      })
      .eq('id', userId);
    
    if (!error) {
      setPendingVolunteers(prev => prev.filter(v => v.id !== userId));
      setStats(prev => ({ ...prev, pending: prev.pending - 1 }));
      alert("Volunteer Approved and Assigned!");
    } else {
      alert("Error approving volunteer.");
      console.error(error);
    }
  };

  const handleAssignNgo = async (templeId: string, ngoId: string) => {
    const { error } = await supabase
      .from('temples')
      .update({ ngo_id: ngoId })
      .eq('id', templeId);
    
    if (!error) {
      alert("NGO Assigned successfully.");
      fetchAdminData();
    }
  };

  const resolveRequest = async (id: string) => {
    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'RESOLVED' })
      .eq('id', id);
    if (!error) {
      setServiceRequests(prev => prev.filter(r => r.id !== id));
      alert("Request marked as Resolved.");
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
            <button onClick={onLogout} className="bg-red-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-red-700 shadow-md transition-all hover:scale-105">Logout</button>
          </div>
        </header>

        {/* Tab Nav */}
        <div className="flex space-x-2 mb-8 border-b border-stone-200 overflow-x-auto pb-1 scrollbar-hide">
          {['OVERVIEW', 'VOLUNTEERS', 'ALLOCATION', 'REQUESTS', 'SETTINGS'].map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`whitespace-nowrap pb-3 px-4 text-sm font-bold transition-all ${activeTab === tab ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-t-lg'}`}
             >
               {tab}
             </button>
          ))}
        </div>

        {activeTab === 'OVERVIEW' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 transform transition hover:-translate-y-1">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Pending Volunteers</h3>
                <p className="text-4xl font-bold text-orange-600 mt-2">{stats.pending}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 transform transition hover:-translate-y-1">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Waste Recycled</h3>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.waste.toLocaleString()} <span className="text-lg text-stone-400">Kg</span></p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 transform transition hover:-translate-y-1">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Active NGOs</h3>
                <p className="text-4xl font-bold text-blue-600 mt-2">{stats.ngos}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 transform transition hover:-translate-y-1">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Users</h3>
                <p className="text-4xl font-bold text-purple-600 mt-2">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
              <h2 className="font-bold text-xl mb-4 text-stone-800">Post Flash Update</h2>
              <div className="flex flex-col md:flex-row gap-4">
                 <input 
                   type="text" 
                   value={updateTitle}
                   onChange={(e) => setUpdateTitle(e.target.value)}
                   placeholder="Update Title (e.g. 'New Plastic Ban')" 
                   className="flex-1 rounded-xl border-stone-300 border p-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                 />
                 <button onClick={handlePostUpdate} className="bg-stone-800 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-black transition-colors">Post Update</button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'VOLUNTEERS' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
             <div className="p-6 border-b border-stone-100">
               <h2 className="font-bold text-xl text-stone-800">Pending Volunteer Requests</h2>
               <p className="text-sm text-stone-500">Assign a temple to the volunteer to approve them.</p>
             </div>
             <div className="divide-y divide-stone-100">
               {pendingVolunteers.length === 0 ? (
                 <div className="p-12 text-center text-stone-400">
                   <p className="text-4xl mb-2">✅</p>
                   <p>No pending requests. All clear!</p>
                 </div>
               ) : (
                 pendingVolunteers.map(vol => (
                   <div key={vol.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-stone-50 transition-colors">
                     <div>
                       <h3 className="font-bold text-stone-800 text-lg">{vol.full_name || vol.email}</h3>
                       <p className="text-sm text-stone-500">{vol.email}</p>
                     </div>
                     <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <select 
                          className="border rounded-xl p-3 text-sm flex-1 md:w-64 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                          value={assignmentMap[vol.id] || ''}
                          onChange={(e) => setAssignmentMap({...assignmentMap, [vol.id]: e.target.value})}
                        >
                          <option value="">Select Temple to Assign...</option>
                          {temples.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.location})</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => handleApproveVolunteer(vol.id)}
                          className="bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-700 whitespace-nowrap shadow-sm"
                        >
                          Approve & Assign
                        </button>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        )}

        {activeTab === 'ALLOCATION' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
             <div className="p-6 border-b border-stone-100">
               <h2 className="font-bold text-xl text-stone-800">Assign NGOs to Temples</h2>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold tracking-wider">
                   <tr>
                     <th className="px-6 py-4">Temple</th>
                     <th className="px-6 py-4">Current NGO</th>
                     <th className="px-6 py-4">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-stone-100">
                   {temples.map(t => {
                     const assignedNgo = ngos.find(n => n.id === t.ngoId);
                     return (
                       <tr key={t.id} className="hover:bg-stone-50">
                         <td className="px-6 py-4 font-bold text-stone-800">{t.name}</td>
                         <td className="px-6 py-4 text-stone-500">
                           {assignedNgo ? (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                               {assignedNgo.full_name}
                             </span>
                           ) : (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                               Unassigned
                             </span>
                           )}
                         </td>
                         <td className="px-6 py-4">
                           <select 
                             onChange={(e) => handleAssignNgo(t.id, e.target.value)}
                             className="border rounded-lg p-2 text-sm bg-white"
                             defaultValue=""
                           >
                             <option value="" disabled>Select NGO</option>
                             {ngos.map(n => (
                               <option key={n.id} value={n.id}>{n.full_name}</option>
                             ))}
                           </select>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
          </div>
        )}
        
        {activeTab === 'REQUESTS' && (
           <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
             <div className="p-6 border-b border-stone-100 flex justify-between items-center">
               <div>
                 <h2 className="font-bold text-xl text-stone-800">Temple Service Requests</h2>
                 <p className="text-sm text-stone-500">Manage support tickets from temple partners.</p>
               </div>
               <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">{serviceRequests.length} Pending</span>
             </div>
             <div className="divide-y divide-stone-100">
                {serviceRequests.length === 0 ? (
                  <div className="p-12 text-center text-stone-400">
                    <p className="text-4xl mb-2">🎉</p>
                    <p>No issues reported. Great job!</p>
                  </div>
                ) : (
                  serviceRequests.map(req => (
                    <div key={req.id} className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-stone-50 transition-colors">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <h3 className="font-bold text-stone-800 text-lg">{req.temples?.name}</h3>
                           <span className="text-xs text-stone-500">({req.temples?.location})</span>
                         </div>
                         <div className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold mb-1">
                           {req.request_type}
                         </div>
                         <p className="text-xs text-stone-400 mt-1">Requested: {new Date(req.created_at).toLocaleString()}</p>
                       </div>
                       <button 
                         onClick={() => resolveRequest(req.id)}
                         className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm"
                       >
                         Mark Resolved
                       </button>
                    </div>
                  ))
                )}
             </div>
           </div>
        )}

        {activeTab === 'SETTINGS' && (
           <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
              <h2 className="font-bold text-xl mb-4 text-stone-800">Homepage Configuration</h2>
              <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-bold text-stone-700 mb-2">Featured YouTube Video URL (Embed Link)</label>
                   <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={videoUrl}
                       onChange={(e) => setVideoUrl(e.target.value)}
                       placeholder="https://www.youtube.com/embed/..." 
                       className="flex-1 rounded-xl border-stone-300 border p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                     />
                     <button onClick={handleUpdateVideo} className="bg-stone-800 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-black transition-colors">Update</button>
                   </div>
                   <p className="text-xs text-stone-400 mt-2">Example: https://www.youtube.com/embed/VIDEO_ID</p>
                 </div>
                 
                 {videoUrl && (
                   <div className="aspect-video bg-black rounded-xl overflow-hidden max-w-lg shadow-lg">
                      <iframe 
                         src={videoUrl} 
                         className="w-full h-full" 
                         title="Preview"
                         frameBorder="0"
                         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      ></iframe>
                   </div>
                 )}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;