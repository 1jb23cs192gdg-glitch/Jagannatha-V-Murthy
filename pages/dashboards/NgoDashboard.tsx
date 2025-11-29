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

  useEffect(() => {
    fetchAssignedTemples();
    fetchUpdates();
  }, []);

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

  const fetchAssignedTemples = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch temples where ngo_id is current user OR all temples for demo if no specific assignment
    // For demo purposes, we might just fetch all if no specific column exists, but let's try the relation
    const { data } = await supabase.from('temples').select('*'); // Simplified for demo
    
    if (data) {
      setAssignedTemples(data.map(t => ({
        id: t.id,
        name: t.name,
        location: t.location,
        wasteDonatedKg: t.waste_donated_kg,
        greenStars: t.green_stars,
        // Updated fallback image
        imageUrl: t.image_url || 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?q=80&w=200&auto=format&fit=crop',
        description: t.description
      })));

      const total = data.reduce((acc, curr) => acc + (curr.waste_donated_kg || 0), 0);
      setTotalImpact(total / 1000); // Tons
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

    // Update Supabase
    const { error } = await supabase
      .from('temples')
      .update({ waste_donated_kg: temple.wasteDonatedKg + amount })
      .eq('id', temple.id);

    if (error) {
      alert("Failed to update waste record.");
      console.error(error);
    } else {
      alert(`Successfully logged ${amount} kg collected from ${temple.name}.`);
      setInputs(prev => ({ ...prev, [temple.id]: '' }));
      fetchAssignedTemples(); // Refresh UI
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-end">
           <div>
             <h1 className="text-3xl font-bold text-stone-800">NGO Operations</h1>
             <p className="text-stone-500">Manage collections and track impact.</p>
           </div>
           <button 
             onClick={onLogout}
             className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
           >
             Logout
           </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
               <div className="p-6 border-b border-stone-100">
                 <h2 className="font-bold text-xl">Assigned Temples Collection</h2>
               </div>
               <div className="divide-y divide-stone-100">
                 {assignedTemples.map(t => (
                   <div key={t.id} className="p-6 flex flex-col sm:flex-row items-center gap-4">
                     <img src={t.imageUrl} className="w-16 h-16 rounded-lg object-cover" alt={t.name} />
                     <div className="flex-1">
                       <h3 className="font-bold text-stone-800">{t.name}</h3>
                       <p className="text-sm text-stone-500">Current: {t.wasteDonatedKg} kg</p>
                     </div>
                     <div className="flex items-center gap-2">
                       <input 
                         type="number" 
                         value={inputs[t.id] || ''}
                         onChange={(e) => handleInputChange(t.id, e.target.value)}
                         placeholder="Kg" 
                         className="w-24 border rounded-lg p-2 text-sm" 
                       />
                       <button 
                         onClick={() => handleLogWaste(t)}
                         className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                       >
                         Log Waste
                       </button>
                     </div>
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
               <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
                 <span>📢</span> Admin Updates
               </h2>
               <div className="space-y-4 max-h-[400px] overflow-y-auto">
                 {adminUpdates.length === 0 ? (
                   <p className="text-stone-500 text-sm">No updates.</p>
                 ) : (
                   adminUpdates.map(u => (
                     <div key={u.id} className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white mb-2 inline-block ${
                         u.type === 'ALERT' ? 'bg-red-500' : 'bg-blue-500'
                       }`}>
                         {u.type}
                       </span>
                       <h3 className="font-bold text-stone-800 text-sm">{u.title}</h3>
                       <p className="text-stone-600 text-xs mt-1">{u.content}</p>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NgoDashboard;