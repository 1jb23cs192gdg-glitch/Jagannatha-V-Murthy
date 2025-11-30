
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Temple, PickupRequest, InventoryItem, FlashUpdate } from '../../types';

interface DashboardProps {
  onLogout?: () => void;
}

const NgoDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'PICKUPS' | 'LOGISTICS' | 'INVENTORY' | 'PROFILE'>('PICKUPS');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Data
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [newItem, setNewItem] = useState({ name: '', stock: 0, price: 0 });
  const [verifyInput, setVerifyInput] = useState<{[key:string]: string}>({}); // Actual weight input per pickup ID
  const [adminUpdates, setAdminUpdates] = useState<FlashUpdate[]>([]);

  // Logistics
  const [drivers, setDrivers] = useState(['Ram Singh', 'Mohan Kumar', 'Suresh Yadav', 'Vikram Singh']); 
  const [selectedDriver, setSelectedDriver] = useState<{[key:string]: string}>({});

  useEffect(() => {
    fetchPickups();
    fetchInventory();
    fetchUpdates();
  }, []);

  const fetchPickups = async () => {
    const { data } = await supabase.from('pickup_requests').select('*');
    if (data) setPickups(data);
  };

  const fetchInventory = async () => {
    const { data } = await supabase.from('inventory').select('*');
    if (data) setInventory(data);
  };

  const fetchUpdates = async () => {
    const { data } = await supabase.from('flash_updates').select('*').order('created_at', { ascending: false });
    if (data) {
      const relevant = data.filter(d => d.type !== 'VIDEO_CONFIG' && (d.audience === 'NGO' || d.audience === 'ALL'));
      setAdminUpdates(relevant.slice(0, 5));
    }
  };

  // --- ACTIONS ---

  const handleUpdateStatus = async (id: string, status: string) => {
      const { error } = await supabase.from('pickup_requests').update({ status }).eq('id', id);
      if(!error) fetchPickups();
  };

  const handleAssignDriver = async (id: string) => {
      const driver = selectedDriver[id];
      if (!driver) return alert("Select a driver");
      
      const { error } = await supabase.from('pickup_requests').update({ 
          status: 'IN_PROGRESS', 
          driver_name: driver 
      }).eq('id', id);
      
      if(!error) {
          alert(`Driver ${driver} assigned successfully! Logistics updated.`);
          fetchPickups();
      }
  };

  const handleVerifyAndIssueCoins = async (req: PickupRequest) => {
      const actualWeight = parseFloat(verifyInput[req.id]);
      if(!actualWeight || actualWeight <= 0) {
          alert("Enter valid actual weight.");
          return;
      }

      // 1. Calculate Coins (Rate: 10 coins/kg - dynamic in real backend)
      const coins = Math.floor(actualWeight * 10);

      // 2. Update Pickup Request
      await supabase.from('pickup_requests').update({
          status: 'COMPLETED',
          actual_weight: actualWeight,
          coins_issued: coins
      }).eq('id', req.id);

      // 3. Issue Coins to User/Temple Profile
      const { data: profile } = await supabase.from('profiles').select('green_coins, waste_donated_kg').eq('id', req.requester_id).single();
      if(profile) {
          await supabase.from('profiles').update({
              green_coins: (profile.green_coins || 0) + coins,
              waste_donated_kg: (profile.waste_donated_kg || 0) + actualWeight
          }).eq('id', req.requester_id);
      }
      
      // 4. Update Temple Table if it's a temple
      if(req.requester_type === 'TEMPLE') {
         const { data: temple } = await supabase.from('temples').select('waste_donated_kg').eq('id', req.requester_id).single();
         if(temple) {
             await supabase.from('temples').update({ waste_donated_kg: (temple.waste_donated_kg || 0) + actualWeight }).eq('id', req.requester_id);
         }
      }

      alert(`Verified! Issued ${coins} coins to ID: ${req.requester_id}`);
      fetchPickups();
  };

  const handleAddInventory = async () => {
      if(!newItem.name) return;
      await supabase.from('inventory').insert([{
          name: newItem.name,
          stock: newItem.stock,
          price_coins: newItem.price
      }]);
      setNewItem({ name: '', stock: 0, price: 0 });
      fetchInventory();
  };

  const handleUpdateStock = async (id: string, currentStock: number, change: number) => {
      await supabase.from('inventory').update({ stock: currentStock + change }).eq('id', id);
      fetchInventory();
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6 relative">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-stone-200">
             <div>
                <h1 className="text-2xl font-bold text-stone-800">NGO Operations Center</h1>
                <p className="text-stone-500">Manage pickups, verify waste, and manufacturing inventory.</p>
             </div>
             <button 
               onClick={() => setShowLogoutConfirm(true)} 
               className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700 transition-colors"
             >
               Logout
             </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="md:col-span-3">
                <div className="flex gap-4">
                    {['PICKUPS', 'LOGISTICS', 'INVENTORY'].map(tab => (
                        <button 
                          key={tab} 
                          onClick={() => setActiveTab(tab as any)}
                          className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === tab ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            {/* Announcements for NGO */}
            <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-sm border border-stone-200 h-40 overflow-y-auto">
                <h3 className="font-bold text-sm mb-2 text-stone-700 flex items-center gap-1">📢 Admin Alerts</h3>
                {adminUpdates.length > 0 ? (
                    <div className="space-y-2">
                         {adminUpdates.map(u => (
                             <div key={u.id} className="text-xs p-2 bg-stone-50 rounded border border-stone-100">
                                 <p className={`font-bold ${u.type === 'ALERT' ? 'text-red-600' : 'text-green-600'}`}>{u.title}</p>
                                 <p className="text-stone-500 mt-1">{u.content}</p>
                             </div>
                         ))}
                    </div>
                ) : (
                    <p className="text-xs text-stone-400">No new announcements.</p>
                )}
            </div>
        </div>

        {activeTab === 'PICKUPS' && (
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden animate-fade-in-up">
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-stone-500 uppercase font-bold">
                        <tr>
                            <th className="p-4">Details</th>
                            <th className="p-4">Request</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {pickups.map(req => (
                            <tr key={req.id}>
                                <td className="p-4">
                                    <div className="font-bold text-stone-700">{req.requester_type}</div>
                                    <div className="text-xs text-stone-400">{req.requester_id}</div>
                                    <div className="text-xs mt-1 text-blue-600 font-semibold">{req.scheduled_date} @ {req.time_slot}</div>
                                </td>
                                <td className="p-4">
                                    <div>{req.waste_type}</div>
                                    <div className="font-bold">{req.estimated_weight} kg</div>
                                    {req.remarks && <div className="text-xs text-stone-500 italic mt-1">"{req.remarks}"</div>}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        req.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                        req.status === 'ACCEPTED' ? 'bg-orange-100 text-orange-800' :
                                        req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>{req.status}</span>
                                </td>
                                <td className="p-4">
                                    {req.status === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700">Accept</button>
                                            <button onClick={() => handleUpdateStatus(req.id, 'REJECTED')} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700">Reject</button>
                                        </div>
                                    )}
                                    {(req.status === 'ACCEPTED' || req.status === 'IN_PROGRESS') && (
                                        <div className="flex gap-2 items-center">
                                            <input 
                                              type="number" 
                                              placeholder="Actual Kg" 
                                              className="border p-1 rounded w-20 text-xs"
                                              onChange={(e) => setVerifyInput({...verifyInput, [req.id]: e.target.value})}
                                            />
                                            <button onClick={() => handleVerifyAndIssueCoins(req)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700">Verify & Issue</button>
                                        </div>
                                    )}
                                    {req.status === 'COMPLETED' && <span className="text-green-600 font-bold text-xs">✓ Issued: {req.coins_issued}</span>}
                                    {req.status === 'REJECTED' && <span className="text-red-400 font-bold text-xs">✘ Rejected</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'LOGISTICS' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 animate-fade-in-up">
                <h2 className="font-bold text-lg mb-4">Driver Assignment & Route Planning</h2>
                <div className="space-y-4">
                    {pickups.filter(p => p.status === 'ACCEPTED').map(req => (
                         <div key={req.id} className="p-4 border border-stone-100 rounded-lg flex justify-between items-center bg-stone-50">
                             <div>
                                 <p className="font-bold text-sm">Pickup from {req.requester_id} ({req.requester_type})</p>
                                 <p className="text-xs text-stone-500">{req.estimated_weight} kg • {req.waste_type}</p>
                                 <p className="text-xs text-blue-600 font-semibold">{req.scheduled_date} @ {req.time_slot}</p>
                             </div>
                             <div className="flex gap-2">
                                 <select 
                                   className="border p-1 rounded text-xs bg-white"
                                   onChange={(e) => setSelectedDriver({...selectedDriver, [req.id]: e.target.value})}
                                 >
                                     <option value="">Select Driver</option>
                                     {drivers.map(d => <option key={d} value={d}>{d}</option>)}
                                 </select>
                                 <button onClick={() => handleAssignDriver(req.id)} className="bg-stone-800 text-white px-3 py-1 rounded text-xs font-bold hover:bg-black">Assign</button>
                             </div>
                         </div>
                    ))}
                    {pickups.filter(p => p.status === 'ACCEPTED').length === 0 && <p className="text-stone-400">No accepted pickups waiting for assignment.</p>}
                    
                    <h3 className="font-bold text-stone-700 mt-8 mb-2">Active Trips (In Progress)</h3>
                    {pickups.filter(p => p.status === 'IN_PROGRESS').map(req => (
                         <div key={req.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
                              <span className="text-sm font-bold text-blue-800">{req.driver_name} is en route to {req.requester_id}</span>
                              <span className="text-xs text-blue-600">Expected Arrival: {req.time_slot}</span>
                         </div>
                    ))}
                    {pickups.filter(p => p.status === 'IN_PROGRESS').length === 0 && <p className="text-stone-400 text-sm">No vehicles currently on the road.</p>}
                </div>
            </div>
        )}

        {activeTab === 'INVENTORY' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                    <h2 className="font-bold text-lg mb-4">Add New Product</h2>
                    <div className="space-y-3">
                        <input className="w-full border p-2 rounded" placeholder="Product Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                        <input type="number" className="w-full border p-2 rounded" placeholder="Initial Stock" value={newItem.stock || ''} onChange={e => setNewItem({...newItem, stock: parseInt(e.target.value)})} />
                        <input type="number" className="w-full border p-2 rounded" placeholder="Price (Coins)" value={newItem.price || ''} onChange={e => setNewItem({...newItem, price: parseInt(e.target.value)})} />
                        <button onClick={handleAddInventory} className="w-full bg-stone-800 text-white py-2 rounded font-bold">Create Product</button>
                    </div>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                    <h2 className="font-bold text-lg mb-4">Manufacturing Inventory</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-stone-500">
                                <th className="pb-2">Product</th>
                                <th className="pb-2">Stock</th>
                                <th className="pb-2">Price</th>
                                <th className="pb-2">Manage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map(item => (
                                <tr key={item.id} className="border-t border-stone-100">
                                    <td className="py-2 font-bold">{item.name}</td>
                                    <td className="py-2">{item.stock} units</td>
                                    <td className="py-2 text-orange-600 font-bold">{item.price_coins} Coins</td>
                                    <td className="py-2 flex gap-1">
                                        <button onClick={() => handleUpdateStock(item.id, item.stock, 10)} className="px-2 bg-green-100 text-green-800 rounded text-xs font-bold">+10</button>
                                        <button onClick={() => handleUpdateStock(item.id, item.stock, -10)} className="px-2 bg-red-100 text-red-800 rounded text-xs font-bold">-10</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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

export default NgoDashboard;
