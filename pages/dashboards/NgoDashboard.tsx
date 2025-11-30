import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Temple, FlashUpdate } from '../../types';

interface DashboardProps {
  onLogout?: () => void;
}

const NgoDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [assignedTemples, setAssignedTemples] = useState<Temple[]>([]);
  const [inputs, setInputs] = useState<{[key: string]: string}>({});
  const [totalImpact, setTotalImpact] = useState(0);
  const [adminUpdates, setAdminUpdates] = useState<FlashUpdate[]>([]);
  const [appLink, setAppLink] = useState('');
  
  // Communication State
  const [activeTab, setActiveTab] = useState<'COLLECTION' | 'COMMUNICATION'>('COLLECTION');
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchAssignedTemples();
    fetchUpdates();
    fetchAppLink();
    fetchMessages();
  }, []);

  const fetchAppLink = async () => {
    const { data } = await supabase.from('flash_updates').select('*').eq('type', 'APP_LINK_CONFIG').single();
    if (data) setAppLink(data.content);
  };

  const fetchUpdates = async () => {
    const { data } = await supabase.from('flash_updates').select('*').limit(5).order('created_at', { ascending: false });
    if (data) {
      setAdminUpdates(data.map(d => ({
        id: d.id,
        title: d.title,
        content: d.content,
        date: new Date(d.created_at).toLocaleDateString(),
        type: d.type as any
      })));
    }
  };

  const fetchMessages = async () => {
    // Fetch messages from Temples or Users (request_type = MESSAGE_TEMPLE or MESSAGE_USER)
    // In a real app we'd filter by NGO ID, but for demo we show all or simulate assignment
    const { data } = await supabase.from('service_requests')
      .select('*, temples(name)')
      .in('request_type', ['MESSAGE_TEMPLE', 'MESSAGE_USER'])
      .order('created_at', { ascending: false });
    if (data) setMessages(data);
  };

  const fetchAssignedTemples = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('temples').select('*'); 
    if (data) {
      setAssignedTemples(data.map(t => ({
        id: t.id,
        name: t.name,
        location: t.location,
        wasteDonatedKg: t.waste_donated_kg,
        greenStars: t.green_stars,
        imageUrl: t.image_url || 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?q=80&w=200&auto=format&fit=crop',
        description: t.description
      })));
      const total = data.reduce((acc, curr) => acc + (curr.waste_donated_kg || 0), 0);
      setTotalImpact(total / 1000);
    }
  };

  const handleInputChange = (id: string, value: string) => {
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleLogWaste = async (temple: Temple) => {
    const amount = parseFloat(inputs[temple.id]);
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    const { error } = await supabase.from('temples').update({ waste_donated_kg: temple.wasteDonatedKg + amount }).eq('id', temple.id);
    if (error) { alert("Failed."); } else {
      alert(`Successfully logged ${amount} kg collected.`);
      setInputs(prev => ({ ...prev, [temple.id]: '' }));
      fetchAssignedTemples();
    }
  };

  const handleReply = async (msgId: string) => {
    if (!replyText.trim()) return;
    // For this demo, we mark it resolved to "archive" it or ideally add a comment. 
    // Since we don't have a comments table in the mock, we'll just resolve it.
    const { error } = await supabase.from('service_requests').update({ status: 'RESOLVED' }).eq('id', msgId);
    if (!error) {
      alert("Message processed/resolved.");
      setReplyText('');
      fetchMessages();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
           <div>
             <h1 className="text-3xl font-bold text-stone-800">NGO Operations</h1>
             <p className="text-stone-500">Manage collections, products, and community interaction.</p>
           </div>
           <div className="flex gap-3">
              {appLink && (
                <a 
                  href={appLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow-lg animate-pulse"
                >
                  🚀 Register Final Products (App)
                </a>
              )}
             <button onClick={onLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">Logout</button>
           </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-stone-200">
           <button onClick={() => setActiveTab('COLLECTION')} className={`pb-2 font-bold text-sm ${activeTab === 'COLLECTION' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-500'}`}>Waste Collection</button>
           <button onClick={() => setActiveTab('COMMUNICATION')} className={`pb-2 font-bold text-sm ${activeTab === 'COMMUNICATION' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-500'}`}>Community Hub</button>
        </div>

        {activeTab === 'COLLECTION' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                 <div className="p-6 border-b border-stone-100"><h2 className="font-bold text-xl">Assigned Temples Collection</h2></div>
                 <div className="divide-y divide-stone-100">
                   {assignedTemples.map(t => (
                     <div key={t.id} className="p-6 flex flex-col sm:flex-row items-center gap-4">
                       <img src={t.imageUrl} className="w-16 h-16 rounded-lg object-cover" alt={t.name} />
                       <div className="flex-1"><h3 className="font-bold text-stone-800">{t.name}</h3><p className="text-sm text-stone-500">Current: {t.wasteDonatedKg} kg</p></div>
                       <div className="flex items-center gap-2"><input type="number" value={inputs[t.id] || ''} onChange={(e) => handleInputChange(t.id, e.target.value)} placeholder="Kg" className="w-24 border rounded-lg p-2 text-sm" /><button onClick={() => handleLogWaste(t)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700">Log Waste</button></div>
                     </div>
                   ))}
                   {assignedTemples.length === 0 && <div className="p-6 text-stone-500">No temples found.</div>}
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg transform transition hover:scale-105">
                <h3 className="text-lg font-semibold mb-2">Total Impact</h3>
                <p className="text-4xl font-bold mb-1">{totalImpact.toFixed(3)} Tons</p>
                <p className="text-blue-200 text-sm">Waste diverted from landfills.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                 <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><span>📢</span> Admin Updates</h2>
                 <div className="space-y-4 max-h-[400px] overflow-y-auto">
                   {adminUpdates.length === 0 ? <p className="text-stone-500 text-sm">No updates.</p> : adminUpdates.map(u => (
                       <div key={u.id} className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white mb-2 inline-block ${u.type === 'ALERT' ? 'bg-red-500' : 'bg-blue-500'}`}>{u.type}</span>
                         <h3 className="font-bold text-stone-800 text-sm">{u.title}</h3><p className="text-stone-600 text-xs mt-1">{u.content}</p>
                       </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'COMMUNICATION' && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 min-h-[500px]">
            <h2 className="font-bold text-xl mb-6">Discussion & Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="border-r border-stone-100 pr-4">
                  <h3 className="font-bold text-stone-600 mb-4 uppercase text-xs">Incoming Messages</h3>
                  <div className="space-y-4">
                     {messages.length === 0 ? (
                       <p className="text-stone-400 italic text-sm">No active discussions.</p>
                     ) : (
                       messages.map(msg => (
                         <div key={msg.id} className="bg-stone-50 p-4 rounded-lg border border-stone-100 hover:bg-orange-50 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start mb-2">
                               <span className={`text-[10px] font-bold px-2 py-1 rounded text-white ${msg.request_type === 'MESSAGE_TEMPLE' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                 {msg.request_type === 'MESSAGE_TEMPLE' ? 'TEMPLE' : 'PUBLIC'}
                               </span>
                               <span className="text-xs text-stone-400">{new Date(msg.created_at).toLocaleDateString()}</span>
                            </div>
                            <h4 className="font-bold text-stone-800 text-sm mb-1">{msg.temples?.name || 'Community Member'}</h4>
                            <p className="text-sm text-stone-600">"{msg.message}"</p>
                            <div className="mt-3 pt-3 border-t border-stone-200 hidden group-hover:block">
                               <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Write a reply/note..." 
                                    className="flex-1 text-xs border p-2 rounded"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                  />
                                  <button onClick={() => handleReply(msg.id)} className="bg-green-600 text-white text-xs px-3 rounded font-bold">Resolve</button>
                                </div>
                            </div>
                         </div>
                       ))
                     )}
                  </div>
               </div>
               <div>
                  <h3 className="font-bold text-stone-600 mb-4 uppercase text-xs">Broadcast Message</h3>
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                     <p className="text-blue-800 text-sm mb-4 font-medium">Post a general update or requirement to all assigned temples.</p>
                     <textarea className="w-full p-3 border border-blue-200 rounded-lg text-sm mb-4" rows={4} placeholder="E.g., We need more coconut shells this week..."></textarea>
                     <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Send Broadcast</button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NgoDashboard;