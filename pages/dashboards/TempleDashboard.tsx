
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Temple, FlashUpdate, TeamMember, PickupRequest, TemplePhoto } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardProps {
  onLogout?: () => void;
}

const TempleDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [temple, setTemple] = useState<Temple | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WASTE' | 'PICKUPS' | 'ACTIVITIES' | 'PROFILE'>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Waste Entry
  const [wasteInput, setWasteInput] = useState({ 
    type: 'Flower Waste', 
    amount: '', 
    date: new Date().toISOString().split('T')[0],
    time: '08:00 AM',
    remarks: '',
    photo: null as string | null 
  });
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  
  // Activity Entry
  const [activityInput, setActivityInput] = useState({ description: '', photo: null as string | null });
  const [activityFileKey, setActivityFileKey] = useState(Date.now() + 1);
  const [myPhotos, setMyPhotos] = useState<TemplePhoto[]>([]);

  // Profile Edit State
  const [editProfile, setEditProfile] = useState({
    name: '',
    address: '',
    timings: '',
    description: '',
    imageUrl: '',
    spocName: '',
    spocContact: '',
    spocRole: ''
  });
  
  // Pickups
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([]);
  
  // Data
  const [adminUpdates, setAdminUpdates] = useState<FlashUpdate[]>([]);
  const [wasteLogs, setWasteLogs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [coinBalance, setCoinBalance] = useState(0); 

  useEffect(() => {
    fetchTempleData();
    fetchUpdates();
  }, []);

  useEffect(() => {
    if (temple) {
      fetchWasteLogs();
      fetchPickupRequests();
      fetchMyPhotos();
      setCoinBalance(Math.floor(temple.wasteDonatedKg * 0.5));
      
      // Initialize edit profile state
      setEditProfile({
        name: temple.name || '',
        address: temple.address || '',
        timings: temple.timings || '',
        description: temple.description || '',
        imageUrl: temple.imageUrl || '',
        spocName: temple.spocDetails?.name || '',
        spocContact: temple.spocDetails?.contact || '',
        spocRole: temple.spocDetails?.role || 'Head Priest'
      });
    }
  }, [temple]);

  const fetchUpdates = async () => {
    const { data } = await supabase.from('flash_updates').select('*').order('created_at', { ascending: false });
    if (data) {
      const relevant = data.filter(d => d.type !== 'VIDEO_CONFIG' && (d.audience === 'TEMPLE' || d.audience === 'ALL'));
      setAdminUpdates(relevant.slice(0, 5));
    }
  };

  const fetchWasteLogs = async () => {
    if (!temple) return;
    const { data } = await supabase.from('temple_waste_logs').select('*').eq('temple_id', temple.id);
    if (data) {
       setWasteLogs(data.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
       const agg: {[key:string]: number} = {};
       data.forEach((log: any) => {
          agg[log.waste_type] = (agg[log.waste_type] || 0) + log.amount_kg;
       });
       setChartData(Object.keys(agg).map(k => ({ name: k, amount: agg[k] })));
    }
  };

  const fetchPickupRequests = async () => {
    if (!temple) return;
    const { data } = await supabase.from('pickup_requests').select('*').eq('requester_id', temple.id);
    if (data) setPickupRequests(data);
  };

  const fetchMyPhotos = async () => {
    if (!temple) return;
    const { data } = await supabase.from('temple_photos').select('*').eq('temple_id', temple.id).order('created_at', { ascending: false });
    if (data) setMyPhotos(data);
  };

  const fetchTempleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('temples').select('*').eq('owner_id', user.id).single();
      if (data) {
        setTemple({
          ...data,
          imageUrl: data.image_url || 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?q=80&w=200&auto=format&fit=crop',
          team: data.team || []
        });
      }
    } catch (error) {
      console.error("Error fetching temple:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setWasteInput(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleActivityFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setActivityInput(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitWaste = async () => {
    if (!temple || !wasteInput.amount || !wasteInput.photo) {
      alert("Please enter amount and upload a photo.");
      return;
    }

    // 1. Log Waste Locally
    await supabase.from('temple_waste_logs').insert([{
      temple_id: temple.id,
      ngo_id: temple.ngoId || 'unassigned',
      amount_kg: parseFloat(wasteInput.amount),
      waste_type: wasteInput.type,
      image_url: wasteInput.photo,
      created_at: new Date().toISOString()
    }]);

    // 2. Create Pickup Request
    const { error } = await supabase.from('pickup_requests').insert([{
      requester_id: temple.id,
      requester_type: 'TEMPLE',
      ngo_id: temple.ngoId || 'unassigned',
      status: 'PENDING',
      scheduled_date: wasteInput.date,
      time_slot: wasteInput.time,
      remarks: wasteInput.remarks,
      estimated_weight: parseFloat(wasteInput.amount),
      waste_type: wasteInput.type
    }]);

    if (!error) {
      alert("Daily Waste Submitted. Pickup Requested!");
      setWasteInput({ type: 'Flower Waste', amount: '', date: new Date().toISOString().split('T')[0], time: '08:00 AM', remarks: '', photo: null });
      setFileInputKey(Date.now());
      fetchWasteLogs();
      fetchPickupRequests();
    } else {
      alert("Failed to submit request.");
    }
  };

  const handleUploadActivity = async () => {
    if (!temple || !activityInput.photo) {
      alert("Please select a photo to upload.");
      return;
    }

    const { error } = await supabase.from('temple_photos').insert([{
      temple_id: temple.id,
      image_url: activityInput.photo,
      description: activityInput.description || 'Activity Proof',
      status: 'PENDING',
      created_at: new Date().toISOString()
    }]);

    if (!error) {
      alert("Activity photo uploaded successfully! Sent for Admin Approval.");
      setActivityInput({ description: '', photo: null });
      setActivityFileKey(Date.now());
      fetchMyPhotos();
    } else {
      alert("Failed to upload photo.");
    }
  };

  const handleSaveProfile = async () => {
      if(!temple) return;
      
      const updates = {
          name: editProfile.name,
          address: editProfile.address,
          timings: editProfile.timings,
          description: editProfile.description,
          image_url: editProfile.imageUrl,
          spocDetails: {
              ...temple.spocDetails,
              name: editProfile.spocName,
              contact: editProfile.spocContact,
              role: editProfile.spocRole
          }
      };

      const { error } = await supabase.from('temples').update(updates).eq('id', temple.id);
      if(!error) {
          setTemple({
              ...temple,
              name: editProfile.name,
              address: editProfile.address,
              timings: editProfile.timings,
              description: editProfile.description,
              imageUrl: editProfile.imageUrl,
              spocDetails: updates.spocDetails
          });
          alert("Profile Updated Successfully!");
      } else {
          alert("Failed to update profile.");
      }
  };
  
  const handleDonateCoins = () => {
      if(coinBalance <= 0) return;
      const amount = prompt(`Available Balance: ${coinBalance} Coins\nEnter amount to donate to NGO for community service:`);
      if(amount && parseInt(amount) > 0 && parseInt(amount) <= coinBalance) {
          alert(`Thank you! You donated ${amount} coins. This helps in waste processing logistics.`);
          setCoinBalance(prev => prev - parseInt(amount));
          // In a real backend, we'd add a transaction log here
      } else {
          alert("Invalid amount.");
      }
  }

  if (loading) return <div className="p-10 text-center">Loading Temple Data...</div>;
  if (!temple) return <div className="p-10">No Temple Assigned. Contact Admin. <button onClick={() => setShowLogoutConfirm(true)}>Logout</button></div>;

  return (
    <div className="min-h-screen bg-stone-50 p-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-8 flex flex-col md:flex-row gap-6 items-center relative">
           <img src={temple.imageUrl} className="w-24 h-24 rounded-full object-cover border-4 border-orange-100" />
           <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-stone-800">{temple.name}</h1>
              <p className="text-stone-500">{temple.location}</p>
              <div className="flex gap-1 justify-center md:justify-start mt-2">
                 {[...Array(5)].map((_,i) => <span key={i} className={i < temple.greenStars ? "text-yellow-400" : "text-stone-200"}>★</span>)}
              </div>
           </div>
           <div className="text-right">
              <div className="bg-green-50 px-6 py-3 rounded-xl border border-green-100 mb-2">
                 <p className="text-xs font-bold text-green-800 uppercase">Green Coins</p>
                 <p className="text-2xl font-bold text-green-600">{coinBalance}</p>
              </div>
              <button onClick={() => setShowLogoutConfirm(true)} className="text-red-600 text-sm font-bold hover:underline">Logout</button>
           </div>
        </header>

        {/* Navigation */}
        <div className="flex overflow-x-auto gap-4 mb-8 border-b border-stone-200 pb-2">
           {['OVERVIEW', 'WASTE', 'PICKUPS', 'ACTIVITIES', 'PROFILE'].map(tab => (
             <button 
               key={tab} 
               onClick={() => setActiveTab(tab as any)}
               className={`px-4 py-2 font-bold text-sm whitespace-nowrap ${activeTab === tab ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-400'}`}
             >
               {tab}
             </button>
           ))}
        </div>

        {activeTab === 'OVERVIEW' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
              <div className="md:col-span-2 space-y-8">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                    <h2 className="font-bold text-lg mb-4">Daily Waste Summary</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 text-center">
                            <span className="block text-2xl font-bold text-orange-700">{temple.wasteDonatedKg} kg</span>
                            <span className="text-xs text-orange-800 uppercase">Total Recycled</span>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
                            <span className="block text-2xl font-bold text-green-700">{Math.floor(temple.wasteDonatedKg * 0.8)}</span>
                            <span className="text-xs text-green-800 uppercase">Products Created</span>
                        </div>
                    </div>
                    <div className="h-48">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                             <YAxis axisLine={false} tickLine={false} />
                             <RechartsTooltip />
                             <Bar dataKey="amount" fill="#ea580c" radius={[4,4,0,0]} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
                 
                 <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-xl text-white shadow-lg">
                    <h2 className="font-bold text-xl mb-2">Rewards Wallet & Charity</h2>
                    <p className="mb-4 text-orange-100">Redeem your coins for products or donate them to assist NGOs.</p>
                    <div className="flex gap-4">
                       <button onClick={() => alert("Redirecting to Eco-Shop...")} className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm">Redeem Products</button>
                       <button onClick={handleDonateCoins} className="bg-orange-700 text-white px-4 py-2 rounded-lg font-bold text-sm border border-white/20">Donate Coins</button>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                    <h2 className="font-bold text-lg mb-4">📢 Admin Announcements</h2>
                    <div className="space-y-4">
                       {adminUpdates.map(u => (
                          <div key={u.id} className={`${u.type === 'ALERT' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} p-3 rounded-lg text-sm border`}>
                             <p className={`font-bold ${u.type === 'ALERT' ? 'text-red-800' : 'text-green-800'}`}>{u.title}</p>
                             <p className="text-stone-600 text-xs mt-1">{u.content}</p>
                          </div>
                       ))}
                       {adminUpdates.length === 0 && <p className="text-stone-400 text-sm">No new announcements.</p>}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'WASTE' && (
           <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-stone-200 animate-fade-in-up">
              <h2 className="text-xl font-bold mb-6">Log Daily Waste & Request Pickup</h2>
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1">Waste Type</label>
                    <select 
                      value={wasteInput.type}
                      onChange={e => setWasteInput({...wasteInput, type: e.target.value})}
                      className="w-full border p-3 rounded-lg bg-stone-50"
                    >
                       <option>Flower Waste</option>
                       <option>Organic/Food</option>
                       <option>Coconut Shells</option>
                       <option>Mixed Dry Waste</option>
                       <option>Plastic/Wrappers</option>
                    </select>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-stone-500 mb-1">Date</label>
                        <input 
                          type="date"
                          value={wasteInput.date}
                          onChange={e => setWasteInput({...wasteInput, date: e.target.value})}
                          className="w-full border p-3 rounded-lg"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-stone-500 mb-1">Time Slot</label>
                        <select 
                          value={wasteInput.time}
                          onChange={e => setWasteInput({...wasteInput, time: e.target.value})}
                          className="w-full border p-3 rounded-lg bg-white"
                        >
                           <option>08:00 AM</option>
                           <option>10:00 AM</option>
                           <option>02:00 PM</option>
                           <option>05:00 PM</option>
                        </select>
                     </div>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1">Estimated Weight (Kg)</label>
                    <input 
                      type="number" 
                      value={wasteInput.amount}
                      onChange={e => setWasteInput({...wasteInput, amount: e.target.value})}
                      className="w-full border p-3 rounded-lg"
                      placeholder="e.g. 50"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1">Remarks / Instructions</label>
                    <textarea 
                      value={wasteInput.remarks}
                      onChange={e => setWasteInput({...wasteInput, remarks: e.target.value})}
                      className="w-full border p-3 rounded-lg"
                      placeholder="e.g. Gate 2, near garden area."
                      rows={2}
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-stone-500 mb-1">Upload Photo Proof (Required)</label>
                    <input key={fileInputKey} type="file" onChange={handleFileSelect} className="w-full border p-2 rounded-lg" accept="image/*" />
                    {wasteInput.photo && <img src={wasteInput.photo} className="mt-2 h-32 rounded-lg object-cover" />}
                 </div>
                 <button onClick={handleSubmitWaste} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-md">Submit & Request Pickup</button>
              </div>
           </div>
        )}

        {/* ... (PICKUPS & ACTIVITIES kept similar, adding PROFILE below) */}
        
        {activeTab === 'PICKUPS' && (
           <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden animate-fade-in-up">
              <table className="w-full text-left text-sm">
                 <thead className="bg-stone-50 text-stone-500 font-bold uppercase">
                    <tr>
                       <th className="p-4">Scheduled</th>
                       <th className="p-4">Type</th>
                       <th className="p-4">Est. Weight</th>
                       <th className="p-4">Status</th>
                       <th className="p-4">Remarks</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-stone-100">
                    {pickupRequests.map(r => (
                       <tr key={r.id}>
                          <td className="p-4">
                              <span className="block font-bold">{r.scheduled_date}</span>
                              <span className="text-xs text-stone-500">{r.time_slot}</span>
                          </td>
                          <td className="p-4">{r.waste_type}</td>
                          <td className="p-4">{r.estimated_weight} kg</td>
                          <td className="p-4">
                             <span className={`px-2 py-1 rounded text-xs font-bold ${
                                r.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                r.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                                r.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                             }`}>{r.status}</span>
                          </td>
                          <td className="p-4 text-xs text-stone-500 max-w-xs truncate">{r.remarks || '-'}</td>
                       </tr>
                    ))}
                    {pickupRequests.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-stone-400">No requests found.</td></tr>}
                 </tbody>
              </table>
           </div>
        )}
        
        {activeTab === 'ACTIVITIES' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
              {/* Upload Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 md:col-span-1">
                 <h2 className="font-bold text-lg mb-4">Upload Activity Proof</h2>
                 <div className="space-y-4">
                    <div>
                       <label className="block text-sm font-bold text-stone-500 mb-1">Photo Description</label>
                       <input 
                         className="w-full border p-2 rounded-lg text-sm" 
                         placeholder="e.g. Clean Temple Drive 2024"
                         value={activityInput.description}
                         onChange={e => setActivityInput({...activityInput, description: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="block text-sm font-bold text-stone-500 mb-1">Select Image</label>
                       <input 
                         key={activityFileKey}
                         type="file" 
                         onChange={handleActivityFileSelect} 
                         className="w-full border p-2 rounded-lg text-sm" 
                         accept="image/*" 
                       />
                       {activityInput.photo && <img src={activityInput.photo} className="mt-2 h-32 w-full rounded-lg object-cover" alt="Preview" />}
                    </div>
                    <button onClick={handleUploadActivity} className="w-full bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700">
                       Upload for Approval
                    </button>
                 </div>
              </div>
              
              {/* Gallery Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 md:col-span-2">
                 <h2 className="font-bold text-lg mb-4">My Activity Gallery</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {myPhotos.map(photo => (
                       <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-stone-100">
                          <img src={photo.image_url} alt="Activity" className="w-full h-32 object-cover" />
                          <div className="p-2 bg-white">
                             <p className="text-xs font-bold truncate">{photo.description}</p>
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                photo.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                photo.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                             }`}>
                                {photo.status}
                             </span>
                          </div>
                       </div>
                    ))}
                    {myPhotos.length === 0 && <p className="text-stone-400 text-sm col-span-3 text-center py-8">No activity photos uploaded yet.</p>}
                 </div>
              </div>
            </div>
        )}

        {activeTab === 'PROFILE' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
               <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200">
                   <h2 className="font-bold text-xl mb-6">Edit Temple Details</h2>
                   <div className="space-y-4">
                       <div>
                          <label className="block text-xs font-bold uppercase text-stone-400">Temple Name</label>
                          <input className="w-full border p-2 rounded" value={editProfile.name} onChange={e => setEditProfile({...editProfile, name: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-xs font-bold uppercase text-stone-400">Address (Visible in Rankings)</label>
                          <input className="w-full border p-2 rounded" value={editProfile.address} onChange={e => setEditProfile({...editProfile, address: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-xs font-bold uppercase text-stone-400">Description (Visible in Rankings)</label>
                          <textarea className="w-full border p-2 rounded" rows={3} value={editProfile.description} onChange={e => setEditProfile({...editProfile, description: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-xs font-bold uppercase text-stone-400">Timings</label>
                          <input className="w-full border p-2 rounded" value={editProfile.timings} onChange={e => setEditProfile({...editProfile, timings: e.target.value})} />
                       </div>
                       <div>
                          <label className="block text-xs font-bold uppercase text-stone-400">Profile Image URL</label>
                          <input className="w-full border p-2 rounded" value={editProfile.imageUrl} onChange={e => setEditProfile({...editProfile, imageUrl: e.target.value})} placeholder="https://..." />
                       </div>
                   </div>
               </div>

               <div className="space-y-8">
                   <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200">
                       <h2 className="font-bold text-xl mb-6 text-orange-700">SPOC / Team Details</h2>
                       <p className="text-sm text-stone-500 mb-4">This information will be displayed in the Rankings page for transparency.</p>
                       <div className="space-y-4">
                           <div>
                              <label className="block text-xs font-bold uppercase text-stone-400">SPOC Name (Manager)</label>
                              <input className="w-full border p-2 rounded" value={editProfile.spocName} onChange={e => setEditProfile({...editProfile, spocName: e.target.value})} />
                           </div>
                           <div>
                              <label className="block text-xs font-bold uppercase text-stone-400">Role</label>
                              <input className="w-full border p-2 rounded" value={editProfile.spocRole} onChange={e => setEditProfile({...editProfile, spocRole: e.target.value})} placeholder="e.g. Head Priest" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold uppercase text-stone-400">SPOC Contact Number</label>
                              <input className="w-full border p-2 rounded" value={editProfile.spocContact} onChange={e => setEditProfile({...editProfile, spocContact: e.target.value})} />
                           </div>
                       </div>
                   </div>
                   
                   <button onClick={handleSaveProfile} className="w-full bg-stone-800 text-white px-6 py-4 rounded-xl font-bold hover:bg-black transition-colors shadow-lg">
                       💾 Save All Changes
                   </button>
               </div>
           </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-stone-200 animate-fade-in-up">
              <h3 className="text-lg font-bold text-stone-800 mb-2">Confirm Logout</h3>
              <p className="text-stone-600 mb-6">Are you sure you want to exit your temple dashboard?</p>
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

export default TempleDashboard;
