
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { User, InventoryItem, StockRequest, QueryTicket } from '../../types';
import DashboardLayout from '../../components/DashboardLayout';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardProps { onLogout?: () => void; }

const NgoDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('DU_STACK');
  const [duInventory, setDuInventory] = useState<InventoryItem[]>([]);
  const [myStockRequests, setMyStockRequests] = useState<StockRequest[]>([]);
  const [requestItem, setRequestItem] = useState({ itemName: '', quantity: 0 });
  const [queries, setQueries] = useState<QueryTicket[]>([]);
  const [newQuery, setNewQuery] = useState({ subject: '', message: '' });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
        if (profile) {
            setCurrentUser({ ...profile, name: profile.full_name, role: 'NGO' });
        }
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
      if (currentUser) {
          fetchDuStack();
          fetchStockRequests();
          fetchQueries();
      }
  }, [currentUser, activeTab]);

  const fetchDuStack = async () => {
      if (!currentUser || !currentUser.assignedDuId) return;
      // Fetch inventory of assigned Drying Unit
      const { data } = await supabase.from('inventory').select('*').eq('ngo_id', currentUser.assignedDuId);
      if (data) setDuInventory(data);
  };

  const fetchStockRequests = async () => {
      if (!currentUser) return;
      // Modified: Client-side sorting to avoid composite index requirement
      const { data } = await supabase.from('stock_requests').select('*').eq('ngo_id', currentUser.id);
      if(data) {
          const sorted = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setMyStockRequests(sorted);
      }
  };

  const fetchQueries = async () => {
      if(!currentUser) return;
      // Modified: Client-side sorting to avoid composite index requirement
      const { data } = await supabase.from('query_tickets').select('*').eq('from_id', currentUser.id);
      if(data) {
          const sorted = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setQueries(sorted);
      }
  };

  const handleSubmitRequest = async () => {
      if(!currentUser || !currentUser.assignedDuId || !requestItem.itemName || !requestItem.quantity) {
          alert("Please select item and quantity. Ensure you have an assigned Drying Unit.");
          return;
      }
      
      await supabase.from('stock_requests').insert([{
          ngo_id: currentUser.id,
          du_id: currentUser.assignedDuId,
          item_name: requestItem.itemName,
          quantity: requestItem.quantity,
          status: 'PENDING',
          created_at: new Date().toISOString()
      }]);
      alert("Stock Request Submitted.");
      setRequestItem({ itemName: '', quantity: 0 });
      fetchStockRequests();
  };

  const handleSubmitQuery = async () => {
      if(!currentUser || !currentUser.assignedDuId || !newQuery.subject || !newQuery.message) {
          alert("Fill all fields.");
          return;
      }
      await supabase.from('query_tickets').insert([{
          from_id: currentUser.id,
          to_id: currentUser.assignedDuId,
          sender_name: currentUser.name,
          sender_role: 'NGO',
          sender_email: currentUser.email,
          subject: newQuery.subject,
          message: newQuery.message,
          status: 'OPEN',
          created_at: new Date().toISOString()
      }]);
      alert("Query Sent.");
      setNewQuery({ subject: '', message: '' });
      fetchQueries();
  };

  const chartData = myStockRequests
    .filter(r => r.status === 'APPROVED')
    .reduce((acc: any[], curr) => {
        const existing = acc.find(x => x.name === curr.item_name);
        if(existing) existing.value += curr.quantity;
        else acc.push({ name: curr.item_name, value: curr.quantity });
        return acc;
    }, []);

  const sidebarItems = [
      { id: 'DU_STACK', label: 'DU Stack', icon: '🏭' },
      { id: 'STOCK_REQ', label: 'Stock Request', icon: '📝' },
      { id: 'ANALYSIS', label: 'NGO Analysis', icon: '📊' },
      { id: 'QUERY', label: 'Query', icon: '💬' },
      { id: 'SETTINGS', label: 'Settings', icon: '⚙️' },
  ];
  const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7'];

  if (!currentUser) return <div className="p-20 text-center">Loading NGO Dashboard...</div>;

  return (
    <>
      <DashboardLayout 
          title="Partner NGO Dashboard"
          user={currentUser}
          sidebarItems={sidebarItems} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={() => setShowLogoutDialog(true)}
      >
          {activeTab === 'DU_STACK' && (
              <div className="glass-panel p-6 rounded-3xl">
                  <div className="flex justify-between mb-6">
                      <h3 className="font-bold text-slate-800 text-xl">Drying Unit Warehouse Stack</h3>
                      <div className="text-right">
                          <p className="text-xs text-stone-500">Assigned Drying Unit ID</p>
                          <p className="font-mono font-bold text-slate-700">{currentUser.assignedDuId || 'Not Assigned'}</p>
                      </div>
                  </div>
                  {currentUser.assignedDuId ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {duInventory.map(item => (
                              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 hover:shadow-md transition-shadow">
                                  <h4 className="font-bold text-lg text-slate-800">{item.name}</h4>
                                  <div className="mt-4 flex justify-between items-end">
                                      <div>
                                          <p className="text-xs text-stone-500 uppercase">Available</p>
                                          <p className="text-2xl font-bold text-green-600">{item.stock}</p>
                                      </div>
                                      <button onClick={() => { setActiveTab('STOCK_REQ'); setRequestItem({ itemName: item.name, quantity: 10 }); }} className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded font-bold hover:bg-orange-200">Request Stock</button>
                                  </div>
                              </div>
                          ))}
                          {duInventory.length === 0 && <p className="text-stone-400">No stock available at Drying Unit.</p>}
                      </div>
                  ) : (
                      <div className="p-10 text-center bg-red-50 rounded-xl border border-red-200 text-red-600">
                          You have not been assigned to a Drying Unit by Admin yet. Please contact Admin.
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'STOCK_REQ' && (
              <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-3xl">
                      <h3 className="font-bold text-slate-700 mb-6">Create Stock Request</h3>
                      <div className="flex gap-4 items-end flex-wrap">
                          <div className="flex-1 min-w-[200px]">
                              <label className="text-xs font-bold text-stone-500 uppercase">Item Name</label>
                              <select className="w-full p-3 rounded-xl border mt-1" value={requestItem.itemName} onChange={e => setRequestItem({...requestItem, itemName: e.target.value})}>
                                  <option value="">-- Select Item from DU Stack --</option>
                                  {duInventory.map(i => <option key={i.id} value={i.name}>{i.name} (Avail: {i.stock})</option>)}
                              </select>
                          </div>
                          <div className="w-32">
                              <label className="text-xs font-bold text-stone-500 uppercase">Quantity</label>
                              <input type="number" className="w-full p-3 rounded-xl border mt-1" value={requestItem.quantity} onChange={e => setRequestItem({...requestItem, quantity: parseInt(e.target.value) || 0})} />
                          </div>
                          <button onClick={handleSubmitRequest} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold h-[50px] hover:bg-black">Submit Request</button>
                      </div>
                  </div>

                  <div className="glass-panel p-6 rounded-3xl">
                      <h3 className="font-bold text-slate-700 mb-4">Request History</h3>
                      <div className="space-y-3">
                          {myStockRequests.map(req => (
                              <div key={req.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-100">
                                  <div>
                                      <p className="font-bold text-slate-800">{req.item_name}</p>
                                      <p className="text-xs text-stone-500">{new Date(req.created_at).toLocaleDateString()}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-bold text-lg">{req.quantity} units</p>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : req.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{req.status}</span>
                                  </div>
                              </div>
                          ))}
                          {myStockRequests.length === 0 && <p className="text-stone-400">No requests yet.</p>}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'ANALYSIS' && (
              <div className="glass-panel p-6 rounded-3xl">
                  <h3 className="font-bold text-slate-700 mb-6">Stock Usage Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-80">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" tick={{fontSize:10}} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="#f97316" radius={[4,4,0,0]} name="Received Qty" />
                          </BarChart>
                      </ResponsiveContainer>
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                              </Pie>
                              <Tooltip />
                              <Legend />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          )}

          {activeTab === 'QUERY' && (
              <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-3xl">
                      <h3 className="font-bold text-slate-700 mb-4">Contact Drying Unit</h3>
                      <div className="space-y-4">
                          <input placeholder="Subject" className="w-full p-3 rounded-xl border" value={newQuery.subject} onChange={e => setNewQuery({...newQuery, subject: e.target.value})} />
                          <textarea placeholder="Message..." className="w-full p-3 rounded-xl border h-24" value={newQuery.message} onChange={e => setNewQuery({...newQuery, message: e.target.value})} />
                          <button onClick={handleSubmitQuery} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700">Send Query</button>
                      </div>
                  </div>
                  
                  <div className="glass-panel p-6 rounded-3xl">
                      <h3 className="font-bold text-slate-700 mb-4">Query History</h3>
                      <div className="space-y-4">
                          {queries.map(q => (
                              <div key={q.id} className="p-4 bg-white rounded-xl border border-stone-100 shadow-sm">
                                  <div className="flex justify-between">
                                      <span className="font-bold text-slate-800">{q.subject}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${q.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{q.status}</span>
                                  </div>
                                  <p className="text-sm text-stone-600 mt-2 bg-stone-50 p-2 rounded italic">"{q.message}"</p>
                                  {q.response ? (
                                      <div className="mt-3 bg-blue-50 p-3 rounded-xl">
                                          <p className="text-xs text-blue-500 font-bold uppercase mb-1">Response</p>
                                          <p className="text-slate-700">{q.response}</p>
                                      </div>
                                  ) : (
                                      <p className="text-xs text-stone-400 mt-2">Waiting for response...</p>
                                  )}
                              </div>
                          ))}
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
export default NgoDashboard;
