
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { User, PickupRequest, VolunteerRequest, VolunteerDuty } from '../../types';
import DashboardLayout from '../../components/DashboardLayout';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps { onLogout?: () => void; }

const UserDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [wasteInput, setWasteInput] = useState({ type: 'Flower Waste', amount: '', photo: null as string | null, address: '' });
  const [chartData, setChartData] = useState<any[]>([]);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({});
  const [reportRange, setReportRange] = useState({ start: '', end: '' });
  
  // Rating State
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean, ngoId: string } | null>(null);
  const [ratingInput, setRatingInput] = useState({ rating: 5, reason: '' });
  const [profileRatingInput, setProfileRatingInput] = useState({ rating: 5, reason: '' });

  // Volunteer State
  const [volunteerStatus, setVolunteerStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');
  const [volunteerForm, setVolunteerForm] = useState({
    fullName: '',
    contact: '',
    taluk: '',
    district: '',
    state: '',
    idProof: null as string | null,
    notes: ''
  });
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  
  // New: Duties State
  const [duties, setDuties] = useState<VolunteerDuty[]>([]);
  const [assignedDuDetails, setAssignedDuDetails] = useState<any>(null);

  useEffect(() => { fetchProfile(); }, []);
  
  useEffect(() => { 
    if (profile) { 
        fetchHistory(); 
        fetchVolunteerStatus();
        setProfileForm({ full_name: profile.name, address: profile.address || '', imageUrl: profile.imageUrl }); 
        setWasteInput(prev => ({...prev, address: profile.address || ''}));
        setVolunteerForm(prev => ({...prev, fullName: profile.name, contact: profile.contact || ''}));
    } 
  }, [profile]);

  // Force refresh when tab changes to dashboard to update Green Coins
  useEffect(() => {
      if (activeTab === 'DASHBOARD') {
          fetchProfile();
      }
      if (activeTab === 'VOLUNTEER_DUTIES' && profile) {
          fetchDuties();
          fetchAssignedDu();
      }
  }, [activeTab]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      // Explicitly map snake_case to camelCase where needed
      setProfile({ 
          ...data, 
          name: data.full_name || 'User', 
          role: 'PERSON', 
          imageUrl: data.image_url,
          greenCoins: data.green_coins || 0,
          wasteDonatedKg: data.waste_donated_kg || 0,
          assignedDuId: data.assigned_du_id || data.assignedDuId,
          assignedNgoId: data.assigned_ngo_id || data.assignedNgoId
      });
    }
  };
  const fetchHistory = async () => {
    if(!profile) return;
    const { data } = await supabase.from('pickup_requests').select('*').eq('requester_id', profile.id);
    if(data) {
        // Sort client-side
        const sortedData = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPickups(sortedData);
        
        const agg: any = {};
        sortedData.forEach((i: any) => { 
            if (i.status === 'COMPLETED') {
               agg[i.waste_type] = (agg[i.waste_type] || 0) + i.estimated_weight; 
            }
        });
        setChartData(Object.keys(agg).map(k => ({ name: k, value: agg[k] })));
    }
  };

  const fetchVolunteerStatus = async () => {
      if(!profile) return;
      const { data } = await supabase.from('volunteer_requests').select('status').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(1);
      
      if (data && data.length > 0) {
          setVolunteerStatus(data[0].status);
      } else {
          setVolunteerStatus('NONE');
      }
  };

  const fetchDuties = async () => {
      if(!profile) return;
      const { data } = await supabase.from('volunteer_duties').select('*').eq('volunteer_id', profile.id);
      if(data) {
          const sorted = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setDuties(sorted);
      }
  }

  const fetchAssignedDu = async () => {
      if(!profile || !profile.assignedDuId) return;
      const { data } = await supabase.from('profiles').select('full_name, email, contact').eq('id', profile.assignedDuId).single();
      if(data) setAssignedDuDetails(data);
  }

  const handleUpdateDutyStatus = async (dutyId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
      await supabase.from('volunteer_duties').update({ status: newStatus }).eq('id', dutyId);
      fetchDuties();
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setWasteInput(prev => ({ ...prev, photo: reader.result as string }));
        reader.readAsDataURL(file);
      }
  };

  const handleVolunteerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVolunteerForm(prev => ({ ...prev, idProof: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitWaste = async () => {
      if (!profile || !wasteInput.amount) return alert("Please enter weight.");
      if (!wasteInput.address) return alert("Please confirm your pickup address.");
      if (!wasteInput.photo) return alert("Please upload a photo for proof.");
      
      const duId = profile.assignedDuId || 'du1'; 
      
      await supabase.from('pickup_requests').insert([{ 
          requester_id: profile.id, 
          requester_type: 'USER',
          ngo_id: duId, 
          status: 'PENDING',
          estimated_weight: parseFloat(wasteInput.amount), 
          waste_type: wasteInput.type, 
          address: wasteInput.address,
          scheduled_date: new Date().toISOString().split('T')[0],
          time_slot: '09:00 AM',
          image_url: wasteInput.photo, 
          created_at: new Date().toISOString()
      }]);
      alert("Pickup Request Sent! Drying Unit will review, assign a driver, and you will be notified."); 
      setWasteInput({ type: 'Flower Waste', amount: '', photo: null, address: profile.address || '' });
      setActiveTab('HISTORY');
      fetchHistory();
  };

  const handleSubmitVolunteer = async () => {
      if(!profile) return;
      if (!volunteerForm.fullName || !volunteerForm.contact || !volunteerForm.taluk || !volunteerForm.district || !volunteerForm.state || !volunteerForm.idProof) {
          alert("Please fill all required fields and upload ID proof.");
          return;
      }

      await supabase.from('volunteer_requests').insert([{
          user_id: profile.id,
          full_name: volunteerForm.fullName,
          contact: volunteerForm.contact,
          taluk: volunteerForm.taluk,
          district: volunteerForm.district,
          state: volunteerForm.state,
          id_proof_url: volunteerForm.idProof,
          notes: volunteerForm.notes,
          status: 'PENDING',
          created_at: new Date().toISOString()
      }]);

      await supabase.from('profiles').update({ volunteer_status: 'PENDING' }).eq('id', profile.id);

      alert("Volunteer Request Submitted! Status: Pending Verification.");
      setVolunteerStatus('PENDING');
      setShowVolunteerForm(false);
  };

  const handleUpdateProfile = async () => {
      if(!profile) return;
      await supabase.from('profiles').update({ full_name: profileForm.full_name, address: profileForm.address, image_url: profileForm.imageUrl }).eq('id', profile.id);
      setIsEditingProfile(false);
      fetchProfile();
  }

  const handleMarkLoaded = async (id: string) => {
      const { error } = await supabase.from('pickup_requests').update({ status: 'LOADED' }).eq('id', id);
      if (error) {
          alert("Error updating status. Please try again.");
      } else {
          fetchHistory();
          alert("Status updated to Loaded! Waiting for Drying Unit confirmation.");
      }
  }

  const openRatingModal = (ngoId: string) => {
      setRatingModal({ isOpen: true, ngoId });
  };

  const handleSubmitRating = async () => {
      if(!profile || !ratingModal) return;
      await supabase.from('ratings').insert([{
          from_id: profile.id,
          to_id: ratingModal.ngoId,
          rating: ratingInput.rating,
          reason: ratingInput.reason,
          created_at: new Date().toISOString()
      }]);
      alert("Feedback submitted successfully!");
      setRatingModal(null);
      setRatingInput({ rating: 5, reason: '' });
  };

  const handleRateAssignedDu = async () => {
      if(!profile || !profile.assignedDuId) return alert("No Drying Unit assigned.");
      await supabase.from('ratings').insert([{
          from_id: profile.id,
          to_id: profile.assignedDuId,
          rating: profileRatingInput.rating,
          reason: profileRatingInput.reason,
          created_at: new Date().toISOString()
      }]);
      alert("Feedback sent to Drying Unit!");
      setProfileRatingInput({ rating: 5, reason: '' });
  };

  const handleDownloadReport = () => {
      const filtered = pickups.filter(p => {
          if (!reportRange.start || !reportRange.end) return true;
          const d = new Date(p.scheduled_date);
          return d >= new Date(reportRange.start) && d <= new Date(reportRange.end);
      });

      const csv = "Date,Type,Weight(kg),Status,Driver\n" + 
          filtered.map(p => `${p.scheduled_date},${p.waste_type},${p.estimated_weight},${p.status},${p.driver_name || '-'}`).join("\n");
      
      const link = document.createElement("a");
      link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
      link.download = "my_waste_report.csv";
      link.click();
  }

  const initiateLogout = () => {
    setShowLogoutDialog(true);
  };

  const sidebarItems = [
      { id: 'DASHBOARD', label: 'Home', icon: '🏠' },
      { id: 'SUBMIT', label: 'Schedule Pickup', icon: '♻️' },
      { id: 'VOLUNTEERS', label: 'Volunteers', icon: '🙌' },
      { id: 'HISTORY', label: 'History & Status', icon: '📜' },
      { id: 'REPORTS', label: 'Reports', icon: '📈' },
      { id: 'PROFILE', label: 'Profile', icon: '👤' },
      { id: 'SETTINGS', label: 'Settings', icon: '⚙️' },
  ];
  
  if (volunteerStatus === 'APPROVED') {
      sidebarItems.splice(2, 0, { id: 'VOLUNTEER_DUTIES', label: 'Volunteer Duties', icon: '📋' });
  }

  const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7'];

  if (!profile) return <div className="p-20 text-center">Loading Profile...</div>;

  return (
    <>
      <DashboardLayout 
        title="Personal Dashboard" 
        user={profile}
        sidebarItems={sidebarItems} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={initiateLogout}
      >
          {activeTab === 'DASHBOARD' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-8 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-lg shadow-green-500/20">
                      <p className="text-green-100 text-xs font-bold uppercase">Carbon Saved</p>
                      <p className="text-5xl font-bold mt-2">{(chartData.reduce((acc, c) => acc + c.value, 0) * 0.5).toFixed(1)} kg</p>
                      <p className="text-xs text-green-100 mt-2 font-semibold">
                          Based on {chartData.reduce((acc, c) => acc + c.value, 0)} kg waste recycled
                      </p>
                  </div>
                  <div className="glass-card p-8 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/20">
                      <p className="text-yellow-100 text-xs font-bold uppercase">Green Coins</p>
                      <p className="text-5xl font-bold mt-2">{profile.greenCoins}</p>
                      <p className="text-xs text-orange-100 mt-2">Earned from confirmed pickups</p>
                  </div>
                  <div className="glass-panel p-6 rounded-3xl md:col-span-2 h-72 flex items-center relative">
                      <div className="w-full h-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                  </Pie>
                                  <Tooltip />
                                  <Legend verticalAlign="middle" align="right" />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                      {chartData.length === 0 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400">
                              <span className="text-4xl mb-2">📊</span>
                              <span>No contribution data yet.</span>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'SUBMIT' && (
              <div className="glass-panel max-w-lg mx-auto p-8 rounded-3xl bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                  <h3 className="font-bold text-slate-800 text-xl mb-6">Schedule Waste Pickup</h3>
                  <div className="space-y-4">
                      <select className="w-full p-3 rounded-xl bg-white border border-slate-200" value={wasteInput.type} onChange={e => setWasteInput({...wasteInput, type: e.target.value})}>
                          <option>Flower Waste</option>
                          <option>Plastic</option>
                          <option>Coconut Shells</option>
                          <option>Paper / Books</option>
                          <option>Religious Cloth</option>
                          <option>Other Organic</option>
                      </select>
                      <input type="number" placeholder="Est. Weight (kg)" className="w-full p-3 rounded-xl bg-white border border-slate-200" value={wasteInput.amount} onChange={e => setWasteInput({...wasteInput, amount: e.target.value})} />
                      
                      {/* Explicit Address Confirmation */}
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Confirm Pickup Address</label>
                        <input type="text" placeholder="Enter full address" className="w-full p-2 rounded-lg bg-white border border-slate-300 text-sm" value={wasteInput.address} onChange={e => setWasteInput({...wasteInput, address: e.target.value})} />
                      </div>

                      {/* Photo Upload */}
                      <div className="border border-dashed border-slate-300 p-4 rounded-xl text-center cursor-pointer bg-slate-50">
                          <input type="file" onChange={handleFileSelect} className="hidden" id="waste-pic-user" />
                          <label htmlFor="waste-pic-user" className="cursor-pointer text-sm text-slate-500 flex flex-col items-center gap-2">
                              {wasteInput.photo ? <img src={wasteInput.photo} className="h-24 w-24 object-cover rounded-lg" /> : <span>📸 Upload Proof (Mandatory)</span>}
                          </label>
                      </div>
                      
                      <button onClick={handleSubmitWaste} className="w-full py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition-colors">Request Drying Unit Pickup</button>
                  </div>
              </div>
          )}

          {activeTab === 'VOLUNTEERS' && (
              <div className="glass-panel p-8 rounded-3xl max-w-2xl mx-auto">
                  <h3 className="font-bold text-slate-800 text-2xl mb-6">Community Volunteering</h3>
                  
                  {volunteerStatus === 'APPROVED' && (
                      <div className="bg-green-100 p-6 rounded-2xl border border-green-200 text-center mb-6">
                          <div className="text-6xl mb-4">🎖️</div>
                          <h4 className="text-xl font-bold text-green-800">You are an Active Volunteer</h4>
                          <p className="text-green-700 mt-2">Thank you for your service! Check 'Volunteer Duties' tab for tasks.</p>
                      </div>
                  )}

                  {volunteerStatus === 'PENDING' && (
                      <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200 text-center mb-6">
                          <div className="text-6xl mb-4">⏳</div>
                          <h4 className="text-xl font-bold text-yellow-800">Verification Pending</h4>
                          <p className="text-yellow-700 mt-2">Your application is being reviewed by the Admin team.</p>
                      </div>
                  )}

                  {volunteerStatus === 'REJECTED' && (
                      <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-center mb-6">
                          <h4 className="text-xl font-bold text-red-800">Application Rejected</h4>
                          <p className="text-red-700 mt-2">Please contact support or try applying again later.</p>
                          <button onClick={() => setVolunteerStatus('NONE')} className="mt-4 text-xs font-bold underline text-red-600">Apply Again</button>
                      </div>
                  )}

                  {volunteerStatus === 'NONE' && !showVolunteerForm && (
                      <div className="text-center py-10">
                          <p className="text-lg text-slate-600 mb-6">Are you interested in volunteering and helping as a community volunteer?</p>
                          <button 
                            onClick={() => setShowVolunteerForm(true)}
                            className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-orange-700 transition-transform hover:scale-105"
                          >
                            YES, I want to help! 🙋
                          </button>
                      </div>
                  )}

                  {volunteerStatus === 'NONE' && showVolunteerForm && (
                      <div className="space-y-4 animate-fade-in">
                          <p className="text-sm text-slate-500 mb-2">Please provide your details for verification.</p>
                          
                          <input className="w-full p-3 rounded-xl border" placeholder="Full Name" value={volunteerForm.fullName} onChange={e => setVolunteerForm({...volunteerForm, fullName: e.target.value})} />
                          <input className="w-full p-3 rounded-xl border" placeholder="Contact Number" value={volunteerForm.contact} onChange={e => setVolunteerForm({...volunteerForm, contact: e.target.value})} />
                          
                          <div className="grid grid-cols-2 gap-4">
                              <input className="p-3 rounded-xl border" placeholder="Taluk" value={volunteerForm.taluk} onChange={e => setVolunteerForm({...volunteerForm, taluk: e.target.value})} />
                              <input className="p-3 rounded-xl border" placeholder="District" value={volunteerForm.district} onChange={e => setVolunteerForm({...volunteerForm, district: e.target.value})} />
                          </div>
                          <input className="w-full p-3 rounded-xl border" placeholder="State" value={volunteerForm.state} onChange={e => setVolunteerForm({...volunteerForm, state: e.target.value})} />
                          
                          <textarea className="w-full p-3 rounded-xl border h-20" placeholder="Additional Notes (Optional)" value={volunteerForm.notes} onChange={e => setVolunteerForm({...volunteerForm, notes: e.target.value})}></textarea>

                          <div className="border border-dashed border-slate-300 p-4 rounded-xl text-center cursor-pointer bg-slate-50">
                              <input type="file" onChange={handleVolunteerFileSelect} className="hidden" id="vol-id-proof" />
                              <label htmlFor="vol-id-proof" className="cursor-pointer text-sm text-slate-500 flex flex-col items-center gap-2">
                                  {volunteerForm.idProof ? <img src={volunteerForm.idProof} className="h-24 w-full object-contain rounded-lg" /> : <span>🆔 Upload ID Proof (Required)</span>}
                              </label>
                          </div>

                          <div className="flex gap-4 pt-4">
                              <button onClick={() => setShowVolunteerForm(false)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold">Cancel</button>
                              <button onClick={handleSubmitVolunteer} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg">Submit Request</button>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'VOLUNTEER_DUTIES' && (
              <div className="glass-panel p-6 rounded-3xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-slate-800 text-xl">Volunteer Dashboard</h3>
                      <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <span>🎖️</span> Official Volunteer
                      </div>
                  </div>

                  {/* DU Assignment Status */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 mb-8 flex items-center justify-between">
                      <div>
                          <p className="text-xs text-stone-400 uppercase font-bold tracking-wider">Assigned Drying Unit</p>
                          {assignedDuDetails ? (
                              <>
                                  <h2 className="text-2xl font-bold text-slate-800 mt-1">{assignedDuDetails.full_name}</h2>
                                  <p className="text-sm text-stone-600 mt-1">Status: <span className="text-green-600 font-bold">Accepted & Active</span></p>
                                  <p className="text-xs text-stone-500 mt-1">📞 {assignedDuDetails.contact}</p>
                              </>
                          ) : (
                              <p className="text-stone-500 mt-1 italic">Waiting for Drying Unit Acceptance...</p>
                          )}
                      </div>
                      <div className="text-4xl">🏢</div>
                  </div>

                  <h4 className="font-bold text-slate-700 mb-4 text-lg">Assigned Duties</h4>
                  <div className="space-y-4">
                      {duties.map(duty => (
                          <div key={duty.id} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                                  duty.status === 'COMPLETED' ? 'bg-green-500' : duty.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-orange-500'
                              }`}></div>
                              
                              <div className="flex justify-between items-start pl-3">
                                  <div className="flex-1">
                                      <h5 className="font-bold text-slate-800 text-lg">{duty.title}</h5>
                                      <p className="text-stone-600 text-sm mt-1">{duty.description}</p>
                                      <p className="text-xs text-stone-400 mt-3 flex items-center gap-1">
                                          <span>📅</span> Assigned: {new Date(duty.created_at).toLocaleString()}
                                      </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                          duty.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : duty.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                      }`}>
                                          {duty.status.replace('_', ' ')}
                                      </span>
                                      
                                      {duty.status !== 'COMPLETED' && (
                                          <div className="flex gap-2 mt-2">
                                              {duty.status === 'PENDING' && (
                                                  <button onClick={() => handleUpdateDutyStatus(duty.id, 'IN_PROGRESS')} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 font-bold transition-colors">Start Duty</button>
                                              )}
                                              {duty.status === 'IN_PROGRESS' && (
                                                  <button onClick={() => handleUpdateDutyStatus(duty.id, 'COMPLETED')} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 font-bold transition-colors">Mark Complete</button>
                                              )}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      ))}
                      {duties.length === 0 && (
                          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <p className="text-stone-400">No duties assigned yet.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'HISTORY' && (
              <div className="glass-panel p-6 rounded-3xl max-w-3xl mx-auto">
                  <h3 className="font-bold text-slate-800 mb-6">Request History</h3>
                  <div className="space-y-3">
                      {pickups.map((p, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border ${p.status === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-white/60 border-stone-200'}`}>
                              <div className="flex justify-between items-start">
                                  <div>
                                      <p className="font-bold text-slate-700">{p.waste_type} ({p.estimated_weight} kg)</p>
                                      <p className="text-xs text-slate-500">{p.scheduled_date}</p>
                                      {p.address && <p className="text-xs text-stone-500 mt-1">📍 {p.address}</p>}
                                      {p.driver_name ? (
                                          <p className="text-xs text-blue-600 mt-1 font-semibold">Driver: {p.driver_name}</p>
                                      ) : (
                                          <p className="text-xs text-stone-400 mt-1 italic">Waiting for assignment...</p>
                                      )}
                                      {p.rejection_reason && <p className="text-xs text-red-600 mt-2 font-bold">Reason: {p.rejection_reason}</p>}
                                  </div>
                                  
                                  <div className="flex flex-col items-end gap-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : p.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {p.status}
                                    </span>
                                    
                                    {p.status === 'ACCEPTED' && (
                                        <button 
                                            onClick={() => handleMarkLoaded(p.id)}
                                            className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 shadow-sm transition-colors animate-pulse"
                                        >
                                            Mark as Loaded 📦
                                        </button>
                                    )}
                                    
                                    {p.status === 'LOADED' && (
                                        <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">Waiting for DU Confirmation</span>
                                    )}

                                    {p.status === 'COMPLETED' && (
                                        <button onClick={() => openRatingModal(p.ngo_id)} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border hover:bg-slate-200">Rate DU</button>
                                    )}
                                  </div>
                              </div>
                          </div>
                      ))}
                      {pickups.length === 0 && <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl">No history found.</div>}
                  </div>
              </div>
          )}

          {activeTab === 'REPORTS' && (
              <div className="glass-panel p-8 rounded-3xl max-w-lg mx-auto text-center">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Generate Reports</h3>
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
                  <button onClick={handleDownloadReport} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-black transition-colors w-full">
                      Download CSV History
                  </button>
              </div>
          )}

          {activeTab === 'PROFILE' && (
              <div className="glass-panel max-w-lg mx-auto p-8 rounded-3xl text-center">
                  <div className="w-24 h-24 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-inner text-orange-600 font-bold overflow-hidden border-4 border-white">
                      {profile.imageUrl ? <img src={profile.imageUrl} className="w-full h-full object-cover" /> : profile.name.charAt(0)}
                  </div>
                  
                  {isEditingProfile ? (
                      <div className="space-y-4 mb-4">
                          <input className="border p-2 rounded w-full text-center" value={profileForm.full_name} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} />
                          <input className="border p-2 rounded w-full text-center" placeholder="Image URL" value={profileForm.imageUrl} onChange={e => setProfileForm({...profileForm, imageUrl: e.target.value})} />
                          <input className="border p-2 rounded w-full text-center" placeholder="Address" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} />
                          <button onClick={handleUpdateProfile} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm">Save</button>
                      </div>
                  ) : (
                      <>
                          <h2 className="text-2xl font-bold text-slate-800 mb-1">{profile.name}</h2>
                          <p className="text-slate-500 text-sm mb-6">{profile.address || 'Address Not Set'}</p>
                          <button onClick={() => setIsEditingProfile(true)} className="text-blue-500 text-xs hover:underline mb-4">Edit Profile</button>
                      </>
                  )}
                  
                  <div className="text-left space-y-4">
                      <div className="p-3 bg-white/50 rounded-xl">
                          <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Assigned Drying Unit</label>
                          <p className="text-slate-700 font-medium">{profile.assignedDuId || 'Not Assigned'}</p>
                      </div>
                  </div>

                  {/* Added Rate Your DU Section */}
                  <div className="mt-8 pt-8 border-t border-slate-200">
                      <h4 className="font-bold text-slate-700 mb-4">Rate Your Drying Unit</h4>
                      <div className="flex gap-2 mb-2 justify-center">
                          {[1,2,3,4,5].map(s => (
                              <button key={s} onClick={() => setProfileRatingInput({...profileRatingInput, rating: s})} className={`text-2xl ${profileRatingInput.rating >= s ? 'text-yellow-400' : 'text-gray-200'}`}>★</button>
                          ))}
                      </div>
                      <textarea 
                          className="w-full p-2 border rounded-lg text-sm mb-2" 
                          placeholder="Feedback on service..." 
                          value={profileRatingInput.reason} 
                          onChange={e => setProfileRatingInput({...profileRatingInput, reason: e.target.value})}
                      ></textarea>
                      <button onClick={handleRateAssignedDu} className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded font-bold hover:bg-orange-200">Submit Rating</button>
                  </div>
              </div>
          )}

          {activeTab === 'SETTINGS' && (
              <div className="glass-panel max-w-2xl mx-auto p-8 rounded-3xl">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Settings</h3>
                  <div className="mt-8 pt-8 border-t border-slate-200">
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

      {/* RATING MODAL (Transactional) */}
      {ratingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-fade-in">
               <h3 className="font-bold text-lg mb-2">Rate Service</h3>
               <p className="text-xs text-stone-500 mb-4">How was the pickup experience?</p>
               
               <div className="flex gap-2 justify-center mb-4">
                   {[1,2,3,4,5].map(s => (
                       <button key={s} onClick={() => setRatingInput({...ratingInput, rating: s})} className={`text-2xl ${ratingInput.rating >= s ? 'text-yellow-400' : 'text-stone-200'}`}>★</button>
                   ))}
               </div>
               
               <textarea 
                   className="w-full p-2 border rounded-lg text-sm mb-4 bg-stone-50" 
                   placeholder="Any comments?"
                   value={ratingInput.reason}
                   onChange={e => setRatingInput({...ratingInput, reason: e.target.value})}
               ></textarea>
               
               <div className="flex gap-3">
                   <button onClick={() => setRatingModal(null)} className="flex-1 bg-stone-100 text-stone-600 py-2 rounded-lg font-bold text-sm">Cancel</button>
                   <button onClick={handleSubmitRating} className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-bold text-sm">Submit</button>
               </div>
           </div>
        </div>
      )}

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
export default UserDashboard;
