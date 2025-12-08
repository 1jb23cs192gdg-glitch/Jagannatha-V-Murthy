
// ... (imports remain the same)
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Temple, FlashUpdate, PickupRequest, TemplePhoto, UserRole } from '../../types';
import DashboardLayout from '../../components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps { onLogout?: () => void; }

const TempleDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [temple, setTemple] = useState<Temple | null>(null);
  // ... (state definitions)
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [wasteInput, setWasteInput] = useState({ 
      type: 'Flower Waste', 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      time: '08:00', 
      remarks: '', 
      photo: null as string | null 
  });
  const [adminUpdates, setAdminUpdates] = useState<FlashUpdate[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  // coinBalance is less relevant for Temples now, focusing on Stars, but keeping calculation valid to avoid errors if used elsewhere
  const [coinBalance, setCoinBalance] = useState(0);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // New States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});
  const [galleryImages, setGalleryImages] = useState<TemplePhoto[]>([]);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [ratingInput, setRatingInput] = useState({ rating: 5, reason: '' });
  const [reportRange, setReportRange] = useState({ start: '', end: '' });

  useEffect(() => { fetchTempleData(); fetchUpdates(); }, []);
  
  // Real-time polling for updates when on Overview
  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (activeTab === 'OVERVIEW') {
          fetchTempleData(); // Initial fetch on switch
          interval = setInterval(fetchTempleData, 5000); // Poll every 5s for updates
      }
      return () => { if(interval) clearInterval(interval); };
  }, [activeTab]);

  useEffect(() => { 
      if (temple) { 
          fetchWasteLogs(); 
          fetchPickups(); 
          // Safe calculation ensuring wasteDonatedKg exists
          setCoinBalance(Math.floor((temple.wasteDonatedKg || 0) * 0.5)); 
          fetchGallery();
          setProfileForm({
              name: temple.name,
              location: temple.location,
              description: temple.description,
              imageUrl: temple.imageUrl,
              spocName: temple.spocDetails?.name,
              spocContact: temple.spocDetails?.contact,
              address: temple.address
          });
      } 
  }, [temple]);

  // ... (fetchUpdates, fetchWasteLogs, fetchPickups, fetchGallery remain same)

  const fetchUpdates = async () => {
    const { data } = await supabase.from('flash_updates').select('*').order('created_at', { ascending: false });
    if (data) {
        setAdminUpdates(data.filter(d => d.audience === 'ALL' || d.audience === 'PUBLIC' || d.audience === temple?.id || d.audience === 'TEMPLE').slice(0,5));
    }
  };
  const fetchWasteLogs = async () => {
    if (!temple) return;
    const { data } = await supabase.from('temple_waste_logs').select('*').eq('temple_id', temple.id);
    if (data) {
       const agg: any = {};
       data.forEach((log: any) => { agg[log.waste_type] = (agg[log.waste_type] || 0) + log.amount_kg; });
       setChartData(Object.keys(agg).map(k => ({ name: k, amount: agg[k] })));
    }
  };
  const fetchPickups = async () => {
      if (!temple) return;
      const { data } = await supabase.from('pickup_requests').select('*').eq('requester_id', temple.id);
      if(data) {
        const sortedData = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPickups(sortedData);
      }
  }
  const fetchGallery = async () => {
      if(!temple) return;
      const { data } = await supabase.from('temple_photos').select('*').eq('temple_id', temple.id);
      if(data) setGalleryImages(data);
  }

  // CORRECTED fetchTempleData with proper field mapping
  const fetchTempleData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('temples').select('*').eq('owner_id', user.id).single();
        if (data) {
             // Map DB fields (snake_case) to TypeScript interface (camelCase)
             setTemple({ 
                 ...data, 
                 ngoId: data.ngo_id, 
                 wasteDonatedKg: data.waste_donated_kg || 0, 
                 greenStars: data.green_stars || 0,
                 imageUrl: data.image_url || 'https://via.placeholder.com/150' 
             });
        }
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitWaste = async () => {
    if (!temple || !wasteInput.amount || !wasteInput.photo) return alert("Please include weight and proof photo.");
    
    // Ensure an NGO is selected. If not, use a default ID (crucial fix for visibility)
    // In a real app, we should block if no NGO is assigned, but for demo continuity we fallback
    const targetNgo = temple.ngoId || 'ngo1';

    // Log Record (Internal Temple Log)
    await supabase.from('temple_waste_logs').insert([{
      temple_id: temple.id, 
      ngo_id: targetNgo, 
      amount_kg: parseFloat(wasteInput.amount), 
      waste_type: wasteInput.type, 
      image_url: wasteInput.photo, 
      created_at: new Date().toISOString()
    }]);
    
    // Create Pickup Request - Mapping Description (remarks) correctly
    // This is the record the NGO dashboard will read
    await supabase.from('pickup_requests').insert([{
      requester_id: temple.id, 
      requester_type: 'TEMPLE', 
      ngo_id: targetNgo, 
      status: 'PENDING', 
      scheduled_date: wasteInput.date, 
      time_slot: wasteInput.time, 
      remarks: wasteInput.remarks || 'No description provided', // Ensure value is passed
      estimated_weight: parseFloat(wasteInput.amount), 
      waste_type: wasteInput.type, 
      image_url: wasteInput.photo, 
      created_at: new Date().toISOString()
    }]);
    
    alert("Pickup Requested successfully! Description and details sent to NGO."); 
    setWasteInput({ ...wasteInput, amount: '', photo: null, remarks: '' }); 
    fetchWasteLogs(); 
    fetchPickups();
    setActiveTab('PICKUPS');
  };

  // MARK LOADED: Only possible when status is ACCEPTED (Driver Assigned)
  const handleMarkLoaded = async (id: string) => {
      const { error } = await supabase.from('pickup_requests').update({ status: 'LOADED' }).eq('id', id);
      if (error) {
          alert("Error updating status. Please try again.");
      } else {
          fetchPickups();
          alert("Status updated to Loaded! Waiting for NGO final confirmation.");
      }
  }

  // ... (handleUpdateProfile, handleUploadGallery, handleDeletePhoto, handleRateNgo, handleDownloadReport remain same)
  const handleUpdateProfile = async () => {
      if(!temple) return;
      await supabase.from('temples').update({
          name: profileForm.name,
          location: profileForm.location,
          description: profileForm.description,
          image_url: profileForm.imageUrl,
          address: profileForm.address,
          spocDetails: { name: profileForm.spocName, contact: profileForm.spocContact, role: 'Admin' }
      }).eq('id', temple.id);
      setIsEditingProfile(false);
      fetchTempleData();
  };

  const handleUploadGallery = async () => {
      if(!uploadingImage || !temple) return;
      await supabase.from('temple_photos').insert([{
          temple_id: temple.id,
          image_url: uploadingImage,
          status: 'APPROVED',
          created_at: new Date().toISOString()
      }]);
      setUploadingImage(null);
      fetchGallery();
  };

  const handleDeletePhoto = async (id: string) => {
      if(window.confirm("Delete this proof?")) {
          await supabase.from('temple_photos').delete().eq('id', id);
          fetchGallery();
      }
  };

  const handleRateNgo = async () => {
      if(!temple || !temple.ngoId) return alert("No NGO assigned");
      await supabase.from('ratings').insert([{
          from_id: temple.id,
          to_id: temple.ngoId,
          rating: ratingInput.rating,
          reason: ratingInput.reason,
          created_at: new Date().toISOString()
      }]);
      alert("Feedback sent");
      setRatingInput({ rating: 5, reason: '' });
  };

  const handleDownloadReport = () => {
      const filtered = pickups.filter(p => {
          if (!reportRange.start || !reportRange.end) return true;
          const d = new Date(p.scheduled_date);
          return d >= new Date(reportRange.start) && d <= new Date(reportRange.end);
      });

      const csv = "Date,Type,Weight(kg),Status\n" + 
          filtered.map(p => `${p.scheduled_date},${p.waste_type},${p.estimated_weight},${p.status}`).join("\n");
      
      const link = document.createElement("a");
      link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
      link.download = "temple_waste_report.csv";
      link.click();
  }

  const initiateLogout = () => {
    setShowLogoutDialog(true);
  };

  const sidebarItems = [
      { id: 'OVERVIEW', label: 'Overview', icon: '🏯' },
      { id: 'WASTE', label: 'Log Waste', icon: '♻️' },
      { id: 'PICKUPS', label: 'Pickups', icon: '🚚' },
      { id: 'GALLERY', label: 'Proof Gallery', icon: '🖼️' },
      { id: 'REPORTS', label: 'Reports', icon: '📈' },
      { id: 'PROFILE', label: 'Profile', icon: '👤' },
      { id: 'SETTINGS', label: 'Settings', icon: '⚙️' },
  ];

  if (!temple) return <div className="p-20 text-center">Loading Temple...</div>;

  return (
    <>
      <DashboardLayout 
        title={temple.name} 
        user={{ name: temple.name, role: UserRole.TEMPLE, id: temple.id }}
        sidebarItems={sidebarItems} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={initiateLogout}
      >
          {activeTab === 'OVERVIEW' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                      <div className="glass-card p-6 rounded-3xl flex justify-between items-center bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30">
                          <div>
                              <p className="text-orange-100 text-xs font-bold uppercase mb-1">Total Recycled</p>
                              <p className="text-4xl font-bold">{temple.wasteDonatedKg} kg</p>
                          </div>
                          <div className="text-right">
                              {/* UPDATED: Show Green Stars instead of Coins to prevent NaN confusion and align with Temple rewards */}
                              <p className="text-orange-100 text-xs font-bold uppercase mb-1">Green Stars</p>
                              <p className="text-4xl font-bold">★ {temple.greenStars}</p>
                          </div>
                      </div>
                      <div className="glass-panel p-6 rounded-3xl h-64 relative">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData}>
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10}} />
                                  <Tooltip cursor={{fill:'transparent'}} />
                                  <Bar dataKey="amount" fill="#f97316" radius={[4,4,0,0]} />
                              </BarChart>
                          </ResponsiveContainer>
                          {chartData.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-sm">No waste data logged yet.</div>}
                      </div>
                  </div>
                  <div className="glass-panel p-6 rounded-3xl bg-blue-50/50 flex flex-col h-full">
                      <h3 className="font-bold text-slate-700 mb-4">Admin Updates</h3>
                      <div className="space-y-3 flex-1 overflow-y-auto">
                          {adminUpdates.map(u => (
                              <div key={u.id} className="p-3 bg-white rounded-xl text-xs border border-white/60 shadow-sm relative overflow-hidden">
                                  <div className={`absolute top-0 left-0 w-1 h-full ${u.type === 'ALERT' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                  <span className="font-bold block text-slate-800 ml-2">{u.title}</span>
                                  <span className="text-slate-500 ml-2">{u.content}</span>
                              </div>
                          ))}
                          {adminUpdates.length === 0 && <p className="text-xs text-stone-400 text-center py-10">No new updates.</p>}
                      </div>
                  </div>
              </div>
          )}

          {/* ... Rest of tabs (WASTE, PICKUPS, GALLERY, REPORTS, PROFILE, SETTINGS) remain unchanged */}
          {activeTab === 'WASTE' && (
              <div className="glass-panel max-w-xl mx-auto p-8 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full blur-3xl -z-10"></div>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Daily Waste Report</h3>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <input type="date" value={wasteInput.date} onChange={e => setWasteInput({...wasteInput, date: e.target.value})} className="p-3 rounded-xl bg-white/50 border border-slate-200" />
                          <input type="time" value={wasteInput.time} onChange={e => setWasteInput({...wasteInput, time: e.target.value})} className="p-3 rounded-xl bg-white/50 border border-slate-200" />
                      </div>
                      <select value={wasteInput.type} onChange={e => setWasteInput({...wasteInput, type: e.target.value})} className="w-full p-3 rounded-xl bg-white/50 border border-slate-200">
                          <option>Flower Waste</option>
                          <option>Coconut Shells</option>
                          <option>Milk Packets</option>
                          <option>Used Cloth</option>
                          <option>Paper / Books</option>
                          <option>Mixed Organic</option>
                      </select>
                      <input type="number" placeholder="Weight (kg)" value={wasteInput.amount} onChange={e => setWasteInput({...wasteInput, amount: e.target.value})} className="w-full p-3 rounded-xl bg-white/50 border border-slate-200" />
                      
                      <textarea 
                        placeholder="Description / Remarks (e.g. Extra garlands from festival)" 
                        value={wasteInput.remarks}
                        onChange={e => setWasteInput({...wasteInput, remarks: e.target.value})}
                        className="w-full p-3 rounded-xl bg-white/50 border border-slate-200 h-24"
                      ></textarea>

                      <div className="border border-dashed border-slate-300 p-4 rounded-xl text-center cursor-pointer bg-slate-50">
                          <input type="file" onChange={e => handleFileSelect(e, (res: string) => setWasteInput({...wasteInput, photo: res}))} className="hidden" id="waste-pic" />
                          <label htmlFor="waste-pic" className="cursor-pointer text-sm text-slate-500 flex flex-col items-center gap-2">
                              {wasteInput.photo ? <img src={wasteInput.photo} className="h-20 w-20 object-cover rounded-lg" /> : <span>📸 Upload Proof</span>}
                          </label>
                      </div>
                      <button onClick={handleSubmitWaste} className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-colors">Submit Report</button>
                  </div>
              </div>
          )}
          
          {activeTab === 'PICKUPS' && (
              <div className="glass-panel p-6 rounded-3xl">
                  <h3 className="font-bold text-slate-800 mb-6 text-xl">Pickup History & Status</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead>
                              <tr className="text-xs text-slate-400 uppercase border-b border-slate-200">
                                  <th className="pb-3 pl-2">Date</th>
                                  <th className="pb-3">Details</th>
                                  <th className="pb-3">Weight</th>
                                  <th className="pb-3">Driver Info</th>
                                  <th className="pb-3">Status / Action</th>
                              </tr>
                          </thead>
                          <tbody className="text-sm">
                              {pickups.map(p => (
                                  <tr key={p.id} className="border-b border-slate-100">
                                      <td className="py-3 pl-2">{p.scheduled_date}</td>
                                      <td className="py-3">
                                          <p className="font-medium text-slate-700">{p.waste_type}</p>
                                          {p.remarks && <p className="text-xs text-stone-500 truncate max-w-[150px]">"{p.remarks}"</p>}
                                      </td>
                                      <td className="py-3">{p.estimated_weight} kg</td>
                                      <td className="py-3">
                                          {p.driver_name ? (
                                              <div className="text-xs">
                                                  <p className="font-bold text-slate-700">{p.driver_name}</p>
                                                  <p className="text-slate-500">{p.vehicle_no}</p>
                                              </div>
                                          ) : (
                                              <span className="text-slate-400 text-xs">Waiting...</span>
                                          )}
                                      </td>
                                      <td className="py-3">
                                          {p.status === 'ACCEPTED' ? (
                                              <button onClick={() => handleMarkLoaded(p.id)} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 shadow-sm animate-pulse">Mark Loaded 📦</button>
                                          ) : (
                                              <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : p.status === 'LOADED' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                                  {p.status === 'LOADED' ? 'Loaded & Waiting' : p.status}
                                              </span>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      {pickups.length === 0 && <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl">No pickup requests found.</div>}
                  </div>
              </div>
          )}

          {activeTab === 'GALLERY' && (
              <div className="glass-panel p-6 rounded-3xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-slate-800">Rankings Proof Gallery</h3>
                      <div className="flex gap-2">
                          <input type="file" id="gal-upload" className="hidden" onChange={e => handleFileSelect(e, setUploadingImage)} />
                          <label htmlFor="gal-upload" className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg cursor-pointer hover:bg-black">+ Add Photo</label>
                          {uploadingImage && <button onClick={handleUploadGallery} className="bg-green-500 text-white text-xs px-3 py-2 rounded-lg">Confirm</button>}
                      </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {galleryImages.map(img => (
                          <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square">
                              <img src={img.image_url} className="w-full h-full object-cover" />
                              <button onClick={() => handleDeletePhoto(img.id)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          </div>
                      ))}
                      {galleryImages.length === 0 && <p className="col-span-full text-center text-stone-400 py-10 bg-stone-50 rounded-xl">Add photos to boost your ranking score.</p>}
                  </div>
              </div>
          )}

          {activeTab === 'REPORTS' && (
              <div className="glass-panel p-8 rounded-3xl max-w-lg mx-auto text-center">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Detailed Waste Reports</h3>
                  <div className="space-y-4 mb-6">
                      <div className="text-left">
                          <label className="text-xs font-bold text-slate-500">From</label>
                          <input type="date" className="w-full p-3 border rounded-xl" onChange={e => setReportRange({...reportRange, start: e.target.value})} />
                      </div>
                      <div className="text-left">
                          <label className="text-xs font-bold text-slate-500">To</label>
                          <input type="date" className="w-full p-3 border rounded-xl" onChange={e => setReportRange({...reportRange, end: e.target.value})} />
                      </div>
                  </div>
                  <button onClick={handleDownloadReport} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-colors w-full">
                      Download CSV Report
                  </button>
              </div>
          )}

          {activeTab === 'PROFILE' && (
              <div className="glass-panel max-w-2xl mx-auto p-8 rounded-3xl relative">
                  <div className="flex flex-col items-center mb-8 relative">
                      <img src={isEditingProfile ? profileForm.imageUrl : temple.imageUrl} alt="Temple" className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-white mb-4"/>
                      {isEditingProfile ? (
                          <input 
                              className="text-center text-2xl font-bold text-slate-800 border-b border-slate-300 focus:outline-none bg-transparent"
                              value={profileForm.name} 
                              onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                          />
                      ) : (
                          <h2 className="text-2xl font-bold text-slate-800">{temple.name}</h2>
                      )}
                      
                      {isEditingProfile ? (
                          <input 
                              className="text-center text-slate-500 mt-2 border-b border-slate-300 focus:outline-none bg-transparent w-full"
                              value={profileForm.location} 
                              onChange={e => setProfileForm({...profileForm, location: e.target.value})} 
                          />
                      ) : (
                          <p className="text-slate-500">{temple.location}</p>
                      )}
                  </div>

                  {isEditingProfile ? (
                      <div className="space-y-4 mb-6">
                          <input 
                              className="w-full p-3 border rounded-xl" 
                              placeholder="Full Address (for Maps)"
                              value={profileForm.address}
                              onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                          />
                          <textarea 
                              className="w-full p-3 border rounded-xl" 
                              placeholder="Description"
                              value={profileForm.description}
                              onChange={e => setProfileForm({...profileForm, description: e.target.value})}
                          ></textarea>
                          <input 
                              className="w-full p-3 border rounded-xl" 
                              placeholder="Image URL"
                              value={profileForm.imageUrl}
                              onChange={e => setProfileForm({...profileForm, imageUrl: e.target.value})}
                          />
                          <div className="grid grid-cols-2 gap-4">
                              <input className="p-3 border rounded-xl" placeholder="SPOC Name" value={profileForm.spocName} onChange={e => setProfileForm({...profileForm, spocName: e.target.value})} />
                              <input className="p-3 border rounded-xl" placeholder="SPOC Contact" value={profileForm.spocContact} onChange={e => setProfileForm({...profileForm, spocContact: e.target.value})} />
                          </div>
                          <div className="flex gap-4">
                              <button onClick={handleUpdateProfile} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold">Save Changes</button>
                              <button onClick={() => setIsEditingProfile(false)} className="flex-1 bg-slate-200 text-slate-600 py-2 rounded-xl font-bold">Cancel</button>
                          </div>
                      </div>
                  ) : (
                      <button onClick={() => setIsEditingProfile(true)} className="w-full mb-8 bg-slate-100 text-slate-600 py-2 rounded-xl font-bold hover:bg-slate-200">Edit Profile Details</button>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white/50 p-4 rounded-xl">
                          <label className="text-xs text-slate-400 font-bold uppercase">Spoc Name</label>
                          <p className="font-semibold text-slate-700">{temple.spocDetails?.name || 'N/A'}</p>
                      </div>
                      <div className="bg-white/50 p-4 rounded-xl">
                          <label className="text-xs text-slate-400 font-bold uppercase">NGO Partner</label>
                          <p className="font-semibold text-slate-700">{temple.ngoId || 'Unassigned'}</p>
                      </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-200">
                      <h4 className="font-bold text-slate-700 mb-4">Rate Your NGO</h4>
                      <div className="flex gap-2 mb-2">
                          {[1,2,3,4,5].map(s => <button key={s} onClick={() => setRatingInput({...ratingInput, rating: s})} className={`text-2xl ${ratingInput.rating >= s ? 'text-yellow-400' : 'text-gray-200'}`}>★</button>)}
                      </div>
                      <textarea className="w-full p-2 border rounded-lg text-sm mb-2" placeholder="Reason..." value={ratingInput.reason} onChange={e => setRatingInput({...ratingInput, reason: e.target.value})}></textarea>
                      <button onClick={handleRateNgo} className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded font-bold">Submit Rating</button>
                  </div>
              </div>
          )}

          {activeTab === 'SETTINGS' && (
              <div className="glass-panel max-w-2xl mx-auto p-8 rounded-3xl">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Temple Settings</h3>
                  <div className="mt-8 pt-8 border-t border-slate-200">
                      <h4 className="font-bold text-red-600 mb-4">Account Actions</h4>
                      <button 
                        onClick={initiateLogout} 
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100 w-full justify-center md:w-auto"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Log Out
                      </button>
                  </div>
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
export default TempleDashboard;
