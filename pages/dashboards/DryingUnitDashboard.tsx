
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { PickupRequest, InventoryItem, Vehicle, QueryTicket, User, Temple, StockRequest, VolunteerRequest } from '../../types';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import TrackDriver from '../TrackDriver'; 

declare var process: {
  env: {
    API_KEY: string;
  };
};

interface DashboardProps { onLogout?: () => void; }

const DryingUnitDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [activeTab, setActiveTab] = useState('PICKUPS');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [routes, setRoutes] = useState<Vehicle[]>([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [queries, setQueries] = useState<QueryTicket[]>([]);
  
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [assignedTemples, setAssignedTemples] = useState<Temple[]>([]);
  const [assignedNgos, setAssignedNgos] = useState<User[]>([]); 
  const [stockHistory, setStockHistory] = useState<StockRequest[]>([]);
  
  // Volunteer State
  const [duVolunteers, setDuVolunteers] = useState<VolunteerRequest[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingVolunteerId, setRejectingVolunteerId] = useState<string | null>(null);
  
  // New: Duty Assignment State
  const [assigningDutyTo, setAssigningDutyTo] = useState<string | null>(null); // Volunteer ID
  const [newDuty, setNewDuty] = useState({ title: '', description: '' });

  // Logistics & Map State
  const [vehicleLocations, setVehicleLocations] = useState<Record<string, string>>({});
  const [vehicleGrounding, setVehicleGrounding] = useState<Record<string, string>>({});
  const [loadingLocations, setLoadingLocations] = useState<Record<string, boolean>>({});
  const [liveTrackingModal, setLiveTrackingModal] = useState<string | null>(null); 

  // Updated Vehicle State for new driver fields
  const [newVehicle, setNewVehicle] = useState({ driver: '', vehicleNo: '', phone: '', license: '' });
  const [newItem, setNewItem] = useState({ name: '', stock: 0, price: 0 }); 
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean, targetId: string, targetType: string, targetName: string } | null>(null);
  const [ratingInput, setRatingInput] = useState({ rating: 5, reason: '' });
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [reportRange, setReportRange] = useState({ start: '', end: '' });
  const [replyInput, setReplyInput] = useState<{id: string, text: string} | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
        if (profile) {
            const userObj = { ...profile, name: profile.full_name, role: 'DRYING_UNIT' };
            setCurrentUser(userObj);
        }
      }
    };
    fetchUser();
  }, []);

  useEffect(() => { 
      if (currentUser) {
          fetchPickups(); 
          fetchInventory(); 
          fetchRoutes();
          fetchQueries();
          fetchAssignments();
          fetchStockHistory();
          fetchVolunteers();
      }
  }, [currentUser, activeTab]);
  
  const fetchPickups = async () => { 
      if (!currentUser) return;
      const { data } = await supabase.from('pickup_requests').select('*').eq('ngo_id', currentUser.id);
      if (data) {
         setPickups(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
  };
  
  const fetchAssignments = async () => {
      if (!currentUser) return;
      
      const { data: usersData } = await supabase.from('profiles').select('*').eq('assignedDuId', currentUser.id);
      if(usersData) {
          const mappedUsers = usersData.map((u: any) => ({ 
              ...u, 
              name: u.full_name || u.email, 
              waste_donated_kg: Number(u.waste_donated_kg) || 0 
          }));
          setAssignedUsers(mappedUsers);
      }

      const { data: templesData } = await supabase.from('temples').select('*').eq('duId', currentUser.id);
      if(templesData) {
          const mappedTemples = templesData.map((t: any) => ({ 
              ...t, 
              wasteDonatedKg: Number(t.waste_donated_kg) || 0,
              greenStars: Number(t.green_stars) || 0 
          }));
          setAssignedTemples(mappedTemples);
      }

      const { data: ngosData } = await supabase.from('profiles').select('*').eq('assignedDuId', currentUser.id).eq('role', 'NGO');
      if(ngosData) {
        const mappedNgos = ngosData.map((n: any) => ({
            ...n,
            name: n.full_name || n.email
        }));
        setAssignedNgos(mappedNgos);
      }
  }

  const fetchInventory = async () => {
      if (!currentUser) return;
      const { data } = await supabase.from('inventory').select('*').eq('ngo_id', currentUser.id);
      if (data) setInventory(data);
      else setInventory([]);
  };

  const fetchStockHistory = async () => {
    if(!currentUser) return;
    const { data } = await supabase.from('stock_requests').select('*').eq('du_id', currentUser.id);
    if(data) {
        const sorted = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setStockHistory(sorted);
    }
  }

  const fetchRoutes = async () => {
      if (!currentUser) return;
      const { data } = await supabase.from('vehicles').select('*').eq('ngo_id', currentUser.id);
      if (data) setRoutes(data);
      else setRoutes([]);
  }

  const fetchQueries = async () => {
      if (!currentUser) return;
      const { data } = await supabase.from('query_tickets').select('*').eq('to_id', currentUser.id);
      if (data) {
          const sorted = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setQueries(sorted);
      } else {
          setQueries([]);
      }
  }

  const fetchVolunteers = async () => {
      if (!currentUser) return;
      const { data } = await supabase.from('volunteer_requests').select('*').eq('assigned_du_id', currentUser.id);
      if (data) setDuVolunteers(data);
  }

  const handleVolunteerDecision = async (vol: VolunteerRequest, decision: 'ACCEPT' | 'REJECT') => {
      if(!currentUser) return;
      
      if (decision === 'ACCEPT') {
          await supabase.from('volunteer_requests').update({ assignment_status: 'ACCEPTED' }).eq('id', vol.id);
          // Also update Profile so user knows
          await supabase.from('profiles').update({ assignedDuId: currentUser.id }).eq('id', vol.user_id);
          alert("Volunteer Accepted and added to your team.");
      } else {
          if (!rejectionReason) return alert("Please provide a reason for rejection.");
          await supabase.from('volunteer_requests').update({ 
              assignment_status: 'REJECTED_BY_DU', 
              rejection_reason: rejectionReason 
          }).eq('id', vol.id);
          setRejectingVolunteerId(null);
          setRejectionReason('');
          alert("Volunteer Rejected.");
      }
      fetchVolunteers();
  }

  const handleAssignDuty = async (volunteerId: string, userId: string) => {
      if (!currentUser || !newDuty.title || !newDuty.description) return alert("Fill duty title and description.");
      
      await supabase.from('volunteer_duties').insert([{
          volunteer_id: userId,
          du_id: currentUser.id,
          title: newDuty.title,
          description: newDuty.description,
          status: 'PENDING',
          created_at: new Date().toISOString()
      }]);
      
      alert("Duty Assigned Successfully!");
      setAssigningDutyTo(null);
      setNewDuty({ title: '', description: '' });
  }

  const handleUpdateStatus = async (id: string, status: string, extraData: any = {}) => { 
      setPickups(prev => prev.map(p => p.id === id ? { ...p, status, ...extraData } : p));
      setAssigningId(null);
      setRejectingId(null);
      try {
          await supabase.from('pickup_requests').update({ status, ...extraData }).eq('id', id); 
          if (status === 'COMPLETED') {
              const req = pickups.find(p => p.id === id);
              if (req) {
                  if (req.requester_type === 'USER') {
                      const { data: user } = await supabase.from('profiles').select('green_coins, waste_donated_kg').eq('id', req.requester_id).single();
                      const currentCoins = Number(user?.green_coins) || 0;
                      const currentWaste = Number(user?.waste_donated_kg) || 0;
                      const earned = Math.floor(req.estimated_weight * 10);
                      await supabase.from('profiles').update({ green_coins: currentCoins + earned, waste_donated_kg: currentWaste + req.estimated_weight }).eq('id', req.requester_id);
                  } else if (req.requester_type === 'TEMPLE') {
                      const { data: templeData } = await supabase.from('temples').select('*').eq('id', req.requester_id).single();
                      if (templeData) {
                          const previousWaste = Number(templeData.waste_donated_kg) || 0;
                          const newTotalWaste = previousWaste + req.estimated_weight;
                          let newStars = Math.floor(newTotalWaste / 10);
                          if (newStars > 5) newStars = 5;
                          await supabase.from('temples').update({ waste_donated_kg: newTotalWaste, green_stars: newStars }).eq('id', req.requester_id);
                      }
                  }
              }
          }
          fetchPickups(); 
          fetchAssignments();
      } catch (error) {
          console.error("Failed to update status", error);
      }
  };

  const handleStockRequest = async (request: StockRequest, action: 'APPROVED' | 'REJECTED') => {
      if (action === 'APPROVED') {
          // Check inventory
          const item = inventory.find(i => i.name === request.item_name);
          if (!item || item.stock < request.quantity) {
              alert("Insufficient Stock in Warehouse.");
              return;
          }
          // Deduct Stock
          const newStock = item.stock - request.quantity;
          await supabase.from('inventory').update({ stock: newStock }).eq('id', item.id);
      }
      // Update Request Status
      await supabase.from('stock_requests').update({ status: action }).eq('id', request.id);
      fetchInventory();
      fetchStockHistory();
  };

  const handleReplyQuery = async (ticket: QueryTicket) => {
    if (!replyInput || replyInput.id !== ticket.id || !replyInput.text) return;
    
    // Save to DB
    await supabase.from('query_tickets').update({ response: replyInput.text, status: 'CLOSED' }).eq('id', ticket.id);
    
    // Simulate Email
    if (ticket.sender_email) {
        const subject = `Reply to your query: ${ticket.subject}`;
        const body = `Hello,\n\n regarding your query: "${ticket.message}"\n\nDrying Unit Response:\n${replyInput.text}\n\nThank you.`;
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(ticket.sender_email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(gmailUrl, '_blank');
    }
    
    setReplyInput(null);
    fetchQueries();
    alert("Reply sent and logged.");
  };

  const generateTrackingLink = () => {
      const trackingId = Math.random().toString(36).substring(7);
      const fullUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname.replace(/\/$/, '')}/#/track/${trackingId}`;
      return { id: trackingId, url: fullUrl };
  };

  const handleAddVehicle = async () => {
      if (!currentUser || !newVehicle.driver || !newVehicle.vehicleNo) return alert("Fill Driver Name and Vehicle No.");
      
      const { data } = await supabase.from('vehicles').insert([{ 
          ngo_id: currentUser.id, 
          driver_name: newVehicle.driver, 
          vehicle_no: newVehicle.vehicleNo, 
          phone: newVehicle.phone,
          license: newVehicle.license,
          status: 'IDLE', 
          current_location: 'Drying Unit Hub'
      }]);
      setNewVehicle({ driver: '', vehicleNo: '', phone: '', license: '' });
      alert("New Driver & Vehicle Added Successfully!");
      fetchRoutes();
  };

  const handleAddInventory = async () => {
    if (!currentUser || !newItem.name) return alert("Please fill item name");
    await supabase.from('inventory').insert([{
        ngo_id: currentUser.id, name: newItem.name, stock: newItem.stock, price_coins: newItem.price
    }]);
    setNewItem({ name: '', stock: 0, price: 0 });
    fetchInventory();
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
      await supabase.from('inventory').update({ stock: newStock, last_updated: new Date().toISOString() }).eq('id', id);
      fetchInventory();
  };

  const handleDeleteItem = async (id: string) => {
      if(confirm("Delete item?")) {
          await supabase.from('inventory').delete().eq('id', id);
          fetchInventory();
      }
  };

  const handleTrackVehicle = async (vehicleId: string, location: string | undefined) => {
      if (!location) return;
      setLoadingLocations(prev => ({...prev, [vehicleId]: true}));
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Locate "${location}" precisely in India. Return the formatted address.`,
              config: { tools: [{ googleMaps: {} }] },
          });
          let groundedLocation = response.text?.trim() || location;
          setVehicleLocations(prev => ({...prev, [vehicleId]: groundedLocation})); 
      } catch (error) {
          setVehicleLocations(prev => ({...prev, [vehicleId]: location})); 
      } finally {
          setLoadingLocations(prev => ({...prev, [vehicleId]: false}));
      }
  };

  const sidebarItems = [
      { id: 'PICKUPS', label: 'Pickups', icon: '🚚' },
      { id: 'VOLUNTEERS', label: 'Volunteers', icon: '🙌' },
      { id: 'ASSIGNMENTS', label: 'Assignments', icon: '📋' },
      { id: 'QUERIES', label: 'Queries', icon: '💬' },
      { id: 'WAREHOUSE', label: 'Warehouse Stock', icon: '🏭' }, // Inventory + Stock Request Mgmt
      { id: 'HISTORY', label: 'History', icon: '📜' },
      { id: 'ANALYTICS', label: 'Analytics', icon: '📊' },
      { id: 'LOGISTICS', label: 'Logistics', icon: '🗺️' },
      { id: 'SETTINGS', label: 'Settings', icon: '⚙️' },
  ];

  if (!currentUser) return <div className="p-20 text-center">Loading Drying Unit...</div>;
  const activeVehicles = routes.filter(v => v.status === 'EN_ROUTE' || v.status === 'LOADING');

  return (
    <>
      <DashboardLayout 
        title="Drying Unit Dashboard"
        user={currentUser}
        sidebarItems={sidebarItems} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={() => setShowLogoutDialog(true)}
      >
        {activeTab === 'PICKUPS' && (
            <div className="glass-panel rounded-3xl p-6">
                <h3 className="font-bold text-slate-700 mb-6">Active Pickup Requests</h3>
                <div className="space-y-4">
                      {pickups.map(req => (
                          <div key={req.id} className="p-4 bg-white/50 rounded-2xl border border-white/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.requester_type === 'USER' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>{req.requester_type}</span>
                                      <p className="font-bold text-slate-800">{req.waste_type} • {req.estimated_weight} kg</p>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">📅 {req.scheduled_date} @ {req.time_slot}</p>
                                  {req.address && <p className="text-xs text-stone-600 mt-1 font-semibold">📍 {req.address}</p>}
                                  {req.driver_name && <p className="text-xs text-green-600 mt-1">🚚 {req.driver_name}</p>}
                                  
                                  {req.image_url && (
                                      <button onClick={() => setViewingProof(req.image_url || null)} className="text-[10px] text-blue-500 underline mt-1">View Proof Photo</button>
                                  )}
                              </div>
                              <div className="flex gap-2 items-center">
                                  {req.status === 'PENDING' && (
                                      <>
                                          <button onClick={() => setAssigningId(req.id)} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black">Accept & Assign</button>
                                          <button onClick={() => setRejectingId(req.id)} className="bg-red-100 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-200">Decline</button>
                                      </>
                                  )}
                                  {req.status === 'ACCEPTED' && <div className="text-right"><span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full block">Driver Assigned</span></div>}
                                  {req.status === 'LOADED' && <div className="flex flex-col gap-1 items-end"><span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Ready</span><button onClick={() => handleUpdateStatus(req.id, 'COMPLETED')} className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600">Confirm Receipt</button></div>}
                                  {req.status === 'COMPLETED' && <span className="text-green-600 font-bold text-sm">Completed ✓</span>}
                              </div>
                              {assigningId === req.id && (
                                  <div className="w-full md:w-64 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                      <select className="w-full text-xs p-2 rounded border border-blue-200 mb-2" value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}>
                                          <option value="">Select Driver</option>
                                          {routes.map(v => <option key={v.id} value={v.driver_name}>{v.driver_name} ({v.vehicle_no})</option>)}
                                      </select>
                                      <button onClick={() => handleUpdateStatus(req.id, 'ACCEPTED', { driver_name: selectedDriver })} className="bg-blue-600 text-white text-xs px-2 py-1 rounded" disabled={!selectedDriver}>Assign</button>
                                  </div>
                              )}
                          </div>
                      ))}
                      {pickups.length === 0 && <div className="text-center py-10 text-slate-400">No active requests.</div>}
                  </div>
            </div>
        )}

        {activeTab === 'VOLUNTEERS' && (
            <div className="space-y-6">
                {/* Pending Requests */}
                <div className="glass-panel p-6 rounded-3xl">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <span>🔔</span> Volunteer Requests
                        <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">{duVolunteers.filter(v => v.assignment_status === 'PENDING_DU_APPROVAL').length} New</span>
                    </h3>
                    <div className="space-y-3">
                        {duVolunteers.filter(v => v.assignment_status === 'PENDING_DU_APPROVAL').map(vol => (
                            <div key={vol.id} className="bg-white border-l-4 border-orange-500 p-4 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h4 className="font-bold text-slate-800">{vol.full_name}</h4>
                                    <p className="text-xs text-slate-500">📞 {vol.contact}</p>
                                    <p className="text-xs text-slate-500">📍 {vol.taluk}, {vol.district}</p>
                                    <p className="text-[10px] text-stone-400 mt-1 uppercase font-bold tracking-wide">Assigned By Admin</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleVolunteerDecision(vol, 'ACCEPT')} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700">Accept</button>
                                    <button onClick={() => setRejectingVolunteerId(vol.id)} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-200">Reject</button>
                                </div>
                                {rejectingVolunteerId === vol.id && (
                                    <div className="w-full md:w-64 p-2 bg-red-50 rounded-lg">
                                        <input 
                                            placeholder="Reason for rejection..." 
                                            className="w-full text-xs p-2 border border-red-200 rounded mb-2" 
                                            value={rejectionReason}
                                            onChange={e => setRejectionReason(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleVolunteerDecision(vol, 'REJECT')} className="bg-red-600 text-white text-xs px-3 py-1 rounded font-bold">Confirm Reject</button>
                                            <button onClick={() => setRejectingVolunteerId(null)} className="text-slate-500 text-xs px-2">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {duVolunteers.filter(v => v.assignment_status === 'PENDING_DU_APPROVAL').length === 0 && <p className="text-stone-400 text-sm text-center py-6">No pending volunteer requests.</p>}
                    </div>
                </div>

                {/* Active Volunteers */}
                <div className="glass-panel p-6 rounded-3xl">
                    <h3 className="font-bold text-slate-700 mb-4">My Active Volunteers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {duVolunteers.filter(v => v.assignment_status === 'ACCEPTED').map(vol => (
                            <div key={vol.id} className="bg-green-50 p-4 rounded-xl border border-green-100 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800">{vol.full_name}</h4>
                                    <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                                </div>
                                <p className="text-xs text-slate-600">📞 {vol.contact}</p>
                                <p className="text-xs text-slate-600">📍 {vol.taluk}</p>
                                
                                <button onClick={() => setAssigningDutyTo(vol.id)} className="w-full mt-3 bg-slate-800 text-white text-xs py-2 rounded-lg font-bold hover:bg-black transition-colors">Assign Duty</button>
                                
                                {assigningDutyTo === vol.id && (
                                    <div className="absolute inset-0 bg-white/95 p-3 flex flex-col gap-2 rounded-xl z-10 border border-slate-200 animate-fade-in">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-800">New Duty</span>
                                            <button onClick={() => setAssigningDutyTo(null)} className="text-slate-400 hover:text-red-500">✕</button>
                                        </div>
                                        <input 
                                            placeholder="Title (e.g. Segregation)" 
                                            className="text-xs p-2 border rounded"
                                            value={newDuty.title}
                                            onChange={e => setNewDuty({...newDuty, title: e.target.value})}
                                        />
                                        <textarea 
                                            placeholder="Description..." 
                                            className="text-xs p-2 border rounded flex-1 resize-none"
                                            value={newDuty.description}
                                            onChange={e => setNewDuty({...newDuty, description: e.target.value})}
                                        ></textarea>
                                        <button onClick={() => handleAssignDuty(vol.id, vol.user_id)} className="bg-green-600 text-white text-xs py-1.5 rounded font-bold">Confirm</button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {duVolunteers.filter(v => v.assignment_status === 'ACCEPTED').length === 0 && <p className="col-span-full text-stone-400 text-sm text-center">No active volunteers yet.</p>}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'ASSIGNMENTS' && (
            <div className="space-y-6">
                {/* Assigned Temples */}
                <div className="glass-panel p-6 rounded-3xl">
                    <h3 className="font-bold text-slate-800 mb-4">Assigned Temples</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {assignedTemples.map(t => (
                            <div key={t.id} className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <h4 className="font-bold text-slate-800">{t.name}</h4>
                                <p className="text-xs text-stone-500">{t.location}</p>
                            </div>
                        ))}
                    </div>
                </div>
                 {/* Assigned Users */}
                 <div className="glass-panel p-6 rounded-3xl">
                    <h3 className="font-bold text-slate-800 mb-4">Assigned Households</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {assignedUsers.map(u => (
                            <div key={u.id} className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="font-bold text-slate-800">{u.name}</h4>
                                <p className="text-xs text-stone-500">{u.address}</p>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Assigned NGOs */}
                <div className="glass-panel p-6 rounded-3xl">
                    <h3 className="font-bold text-slate-800 mb-4">Assigned Partner NGOs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {assignedNgos.map(n => (
                            <div key={n.id} className="bg-green-50 p-4 rounded-xl border border-green-100">
                                <h4 className="font-bold text-slate-800">{n.name}</h4>
                                <p className="text-xs text-stone-500">{n.email}</p>
                                <p className="text-xs font-bold text-green-600">Active Partner</p>
                            </div>
                        ))}
                         {assignedNgos.length === 0 && <p className="text-stone-400 text-sm">No partner NGOs assigned.</p>}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'QUERIES' && (
              <div className="glass-panel p-6 rounded-3xl">
                  <h3 className="font-bold text-slate-700 mb-6">Received Queries</h3>
                  <div className="space-y-4">
                      {queries.map(q => (
                          <div key={q.id} className="p-4 bg-white/80 rounded-xl border border-blue-100 shadow-sm">
                              <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-800">{q.subject}</span>
                                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">{q.status}</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">From: {q.sender_name || 'Unknown'} ({q.sender_role || 'User'})</p>
                              <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg italic">"{q.message}"</p>
                              {q.response && <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">Reply: {q.response}</div>}
                              
                              {q.status === 'OPEN' && (
                                  <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                                      <input 
                                        placeholder="Type reply..." 
                                        className="flex-1 text-xs p-2 bg-white rounded border border-slate-200" 
                                        onChange={(e) => setReplyInput({id: q.id, text: e.target.value})}
                                      />
                                      <button onClick={() => handleReplyQuery(q)} className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold">Reply & Email</button>
                                  </div>
                              )}
                          </div>
                      ))}
                      {queries.length === 0 && <div className="text-center py-10 bg-slate-50 rounded-xl"><p className="text-slate-400">No open queries.</p></div>}
                  </div>
              </div>
        )}

        {activeTab === 'WAREHOUSE' && (
            <div className="space-y-6">
                <div className="glass-panel p-6 rounded-3xl">
                     <h3 className="font-bold text-slate-700 mb-4">Pending Stock Requests from NGOs</h3>
                     <div className="space-y-3">
                        {stockHistory.filter(s => s.status === 'PENDING').map(req => (
                            <div key={req.id} className="flex justify-between items-center bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                                <div>
                                    <p className="font-bold text-slate-800">{req.item_name}</p>
                                    <p className="text-xs text-slate-600">Requested Qty: {req.quantity} units</p>
                                    <p className="text-[10px] text-slate-400">Date: {new Date(req.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleStockRequest(req, 'APPROVED')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">Approve</button>
                                    <button onClick={() => handleStockRequest(req, 'REJECTED')} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">Reject</button>
                                </div>
                            </div>
                        ))}
                        {stockHistory.filter(s => s.status === 'PENDING').length === 0 && <p className="text-slate-400 text-sm">No pending requests.</p>}
                     </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-700">Warehouse Inventory</h3>
                  </div>
                  
                  <div className="mb-6 p-4 bg-stone-50 rounded-xl border border-stone-100 flex gap-2 flex-wrap md:flex-nowrap">
                      <input placeholder="Item Name" className="flex-1 p-2 rounded-lg border text-sm" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                      <input type="number" placeholder="Stock" className="w-24 p-2 rounded-lg border text-sm" value={newItem.stock || ''} onChange={e => setNewItem({...newItem, stock: parseInt(e.target.value) || 0})} />
                      <button onClick={handleAddInventory} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm">+ Add</button>
                  </div>

                  <table className="w-full text-left">
                      <thead><tr className="text-xs text-slate-400 uppercase border-b border-slate-200"><th className="pb-3 pl-2">Item Name</th><th className="pb-3">Stock Level</th><th className="pb-3 text-right pr-2">Action</th></tr></thead>
                      <tbody className="text-sm">
                          {inventory.map(item => (
                              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                  <td className="py-3 pl-2 font-medium text-slate-700">{item.name}</td>
                                  <td className="py-3"><span className={`font-bold ${item.stock < 50 ? 'text-red-500' : 'text-green-600'}`}>{item.stock} units</span></td>
                                  <td className="py-3 text-right pr-2 flex justify-end gap-2">
                                      <button onClick={() => {
                                          const newStock = prompt("Enter new stock level:", item.stock.toString());
                                          if(newStock) handleUpdateStock(item.id, parseInt(newStock));
                                      }} className="text-blue-500 font-bold text-xs hover:underline">Edit</button>
                                      <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 font-bold text-xs hover:underline">Delete</button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
            </div>
        )}

        {activeTab === 'HISTORY' && (
             <div className="glass-panel p-6 rounded-3xl">
                <h3 className="font-bold text-slate-700 mb-6">Stock Transfer History</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead><tr className="text-xs text-slate-400 uppercase border-b border-slate-200"><th className="pb-3 pl-2">Date</th><th className="pb-3">Item</th><th className="pb-3">Quantity</th><th className="pb-3">Status</th></tr></thead>
                        <tbody className="text-sm">
                            {stockHistory.map(h => (
                                <tr key={h.id} className="border-b border-slate-100">
                                    <td className="py-3 pl-2">{new Date(h.created_at).toLocaleDateString()}</td>
                                    <td className="py-3">{h.item_name}</td>
                                    <td className="py-3 font-bold">{h.quantity}</td>
                                    <td className="py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${h.status === 'APPROVED' ? 'bg-green-100 text-green-700' : h.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{h.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        )}

        {activeTab === 'ANALYTICS' && (
            <div className="space-y-6">
                 <div className="glass-panel p-6 rounded-3xl h-96">
                      <h3 className="font-bold text-slate-700 mb-4">Temple Waste Contribution</h3>
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={assignedTemples.map(t => ({ name: t.name.split(' ')[0], waste: Number(t.wasteDonatedKg) || 0 }))}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" tick={{fontSize:10}} />
                              <YAxis />
                              <RechartsTooltip cursor={{fill: 'transparent'}} />
                              <Bar dataKey="waste" fill="#f97316" radius={[4,4,0,0]} name="Waste (kg)" />
                          </BarChart>
                      </ResponsiveContainer>
                 </div>
            </div>
        )}

        {activeTab === 'LOGISTICS' && (
              <div className="space-y-6">
                  {/* Fleet Management - Create Driver */}
                  <div className="glass-panel p-6 rounded-3xl">
                      <h3 className="font-bold text-slate-800 text-xl mb-4">Fleet & Driver Management</h3>
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                          <h4 className="text-sm font-bold text-stone-600 mb-3 uppercase tracking-wide">Add New Driver</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <input 
                                  placeholder="Driver Name" 
                                  className="p-3 rounded-xl border border-stone-200 text-sm" 
                                  value={newVehicle.driver} 
                                  onChange={e => setNewVehicle({...newVehicle, driver: e.target.value})} 
                              />
                              <input 
                                  placeholder="Phone Number" 
                                  className="p-3 rounded-xl border border-stone-200 text-sm" 
                                  value={newVehicle.phone} 
                                  onChange={e => setNewVehicle({...newVehicle, phone: e.target.value})} 
                              />
                              <input 
                                  placeholder="Vehicle Number" 
                                  className="p-3 rounded-xl border border-stone-200 text-sm" 
                                  value={newVehicle.vehicleNo} 
                                  onChange={e => setNewVehicle({...newVehicle, vehicleNo: e.target.value})} 
                              />
                              <input 
                                  placeholder="License No." 
                                  className="p-3 rounded-xl border border-stone-200 text-sm" 
                                  value={newVehicle.license} 
                                  onChange={e => setNewVehicle({...newVehicle, license: e.target.value})} 
                              />
                          </div>
                          <button onClick={handleAddVehicle} className="bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-black transition-colors w-full md:w-auto">
                              + Create Driver Profile
                          </button>
                      </div>
                  </div>

                  {/* Live Operations Center */}
                  <div className="glass-panel p-6 rounded-3xl">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                              <h3 className="font-bold text-slate-800 text-xl">Live Fleet Operations Center</h3>
                              <p className="text-sm text-slate-500">Real-time tracking powered by AI Grounding</p>
                          </div>
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                              {activeVehicles.length} Active Vehicles
                          </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {activeVehicles.map(route => (
                              <div key={route.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 relative group">
                                  <div className="h-64 w-full relative bg-stone-100">
                                      <iframe 
                                          width="100%" 
                                          height="100%" 
                                          frameBorder="0" 
                                          scrolling="no" 
                                          src={`https://maps.google.com/maps?q=${encodeURIComponent(vehicleLocations[route.id] || route.current_location || 'India')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                          title={`Tracking ${route.vehicle_no}`}
                                          className="opacity-90 group-hover:opacity-100 transition-opacity"
                                      ></iframe>
                                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
                                          <span className="w-2 h-2 bg-green-50 rounded-full animate-pulse"></span>
                                          {route.status}
                                      </div>
                                      <div className="absolute bottom-3 right-3 flex gap-2">
                                          <button onClick={() => handleTrackVehicle(route.id, route.current_location)} disabled={loadingLocations[route.id]} className="bg-white text-stone-800 px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-stone-100 transition-colors flex items-center gap-2 border border-stone-200">
                                              {loadingLocations[route.id] ? <span className="animate-spin">⌛</span> : <span>🎯</span>} Update
                                          </button>
                                          <button onClick={() => setLiveTrackingModal(route.id)} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-black transition-colors flex items-center gap-2">
                                              👁️ Live View
                                          </button>
                                      </div>
                                  </div>
                                  <div className="p-4 bg-white relative z-10">
                                      <div className="flex justify-between items-start mb-2">
                                          <div>
                                              <h4 className="font-bold text-slate-800">{route.vehicle_no}</h4>
                                              <p className="text-xs text-slate-500 font-semibold">{route.driver_name}</p>
                                              {route.phone && <p className="text-[10px] text-stone-400 mt-1">📞 {route.phone}</p>}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                          {activeVehicles.length === 0 && <p className="col-span-full text-stone-400 text-center py-10 bg-stone-50 rounded-xl border border-dashed border-stone-200">No vehicles currently en-route.</p>}
                      </div>
                  </div>
              </div>
        )}
        
        {activeTab === 'SETTINGS' && (
             <div className="glass-panel p-6 rounded-3xl">
                  <h3 className="font-bold text-slate-800 mb-6">Settings</h3>
                  <button onClick={() => setShowLogoutDialog(true)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold">Logout</button>
             </div>
        )}

      </DashboardLayout>

      {/* Live Tracking Modal */}
      {liveTrackingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setLiveTrackingModal(null)}>
            <div className="w-full max-w-4xl h-[80vh] bg-stone-900 rounded-3xl overflow-hidden relative shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={() => setLiveTrackingModal(null)}
                    className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <TrackDriver embeddedId={liveTrackingModal} />
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

export default DryingUnitDashboard;
