import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Temple, FlashUpdate } from '../../types';

interface DashboardProps {
  onLogout?: () => void;
}

const TempleDashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [temple, setTemple] = useState<Temple | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [adminUpdates, setAdminUpdates] = useState<FlashUpdate[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editImage, setEditImage] = useState('');
  const [assignedNgo, setAssignedNgo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTempleData();
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

  const fetchTempleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('temples')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      
      if (data) {
        setTemple({
          id: data.id,
          name: data.name,
          location: data.location || 'Location Not Set',
          wasteDonatedKg: data.waste_donated_kg,
          greenStars: data.green_stars,
          // Updated fallback image to a spiritual icon instead of generic placeholder
          imageUrl: data.image_url || 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?q=80&w=200&auto=format&fit=crop',
          description: data.description || '',
          ngoId: data.ngo_id
        });
        setEditDesc(data.description || '');
        setEditImage(data.image_url || '');

        // Fetch NGO details if assigned
        if (data.ngo_id) {
          const { data: ngoData } = await supabase.from('profiles').select('*').eq('id', data.ngo_id).single();
          setAssignedNgo(ngoData);
        }
      }
    } catch (error) {
      console.error("Error fetching temple:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!temple) return;
    const { error } = await supabase.from('temples').update({ 
      description: editDesc,
      image_url: editImage 
    }).eq('id', temple.id);
    
    if (!error) {
      setTemple({...temple, description: editDesc, imageUrl: editImage});
      setIsEditing(false);
      alert("Profile updated successfully!");
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      // Mock upload delay
      setTimeout(() => {
        setIsUploading(false);
        alert("Activity Proof uploaded successfully! Admin will verify and update your rankings.");
      }, 1000);
    }
  };

  const handleRequestVolunteers = async () => {
    if (!eventType || eventType === "Select Event Type") {
      alert("Please select an event type first.");
      return;
    }
    if (!temple) return;

    const { error } = await supabase.from('service_requests').insert([{
      temple_id: temple.id,
      request_type: eventType,
      status: 'PENDING'
    }]);

    if (error) {
      alert("Error sending request.");
      console.error(error);
    } else {
      alert(`Volunteer request for '${eventType}' has been sent to Admin for approval.`);
      setEventType('');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Temple Data...</div>;

  if (!temple) return (
    <div className="p-10 text-center">
      <h2 className="text-xl font-bold text-red-600">No Linked Temple Found</h2>
      <p>Please contact admin to link your account to a temple.</p>
      <button onClick={onLogout} className="mt-4 text-blue-600 underline">Logout</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 bg-white p-8 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row items-center gap-6 relative">
           <button 
             onClick={onLogout}
             className="absolute top-4 right-4 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-100 md:hidden"
           >
             Logout
           </button>
           <img src={temple.imageUrl} alt={temple.name} className="w-24 h-24 rounded-full object-cover border-4 border-orange-100 shadow-lg" />
           <div className="flex-1 text-center md:text-left w-full">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                   <h1 className="text-3xl font-bold text-stone-800">{temple.name}</h1>
                   <p className="text-stone-500">{temple.location} • ID: {temple.id.slice(0,8)}</p>
                </div>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-orange-600 text-xs font-bold border border-orange-200 px-3 py-1 rounded-full hover:bg-orange-50 mt-2 md:mt-0">
                    Edit Profile
                  </button>
                )}
             </div>
             
             {isEditing ? (
               <div className="mt-4 bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                 <div>
                   <label className="text-xs font-bold text-stone-500 uppercase">Description</label>
                   <input 
                     value={editDesc} 
                     onChange={(e) => setEditDesc(e.target.value)} 
                     className="border p-2 rounded text-sm w-full bg-white"
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-stone-500 uppercase">Image URL (For Rankings)</label>
                   <input 
                     value={editImage} 
                     onChange={(e) => setEditImage(e.target.value)} 
                     className="border p-2 rounded text-sm w-full bg-white"
                     placeholder="https://..."
                   />
                 </div>
                 <div className="flex gap-2 justify-end">
                   <button onClick={() => setIsEditing(false)} className="text-stone-500 px-3 py-1 text-xs">Cancel</button>
                   <button onClick={handleUpdateProfile} className="bg-green-600 text-white px-4 py-1 rounded-lg text-xs font-bold shadow-sm">Save Changes</button>
                 </div>
               </div>
             ) : (
               <p className="text-sm text-stone-600 mt-2 italic">
                 "{temple.description || 'Joining the renewable revolution.'}"
               </p>
             )}

             <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
               {[...Array(5)].map((_, i) => (
                 <span key={i} className={`text-xl ${i < temple.greenStars ? 'text-yellow-400' : 'text-stone-300'}`}>★</span>
               ))}
               <span className="ml-2 text-sm font-bold text-stone-600">Green Star Rating</span>
             </div>
           </div>
           <div className="flex flex-col items-end gap-3 w-full md:w-auto">
             <div className="text-center bg-green-50 p-4 rounded-xl w-full border border-green-100">
               <div className="text-3xl font-bold text-green-700">{temple.wasteDonatedKg.toLocaleString()} kg</div>
               <div className="text-xs text-green-800 font-semibold uppercase">Total Waste Donated</div>
             </div>
             <button 
               onClick={onLogout}
               className="hidden md:block text-red-600 text-sm font-semibold hover:underline"
             >
               Logout
             </button>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-2 space-y-6">
             {/* Assigned NGO Card */}
             <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">🚛</div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900">Waste Collection Partner</h3>
                  {assignedNgo ? (
                    <div>
                      <p className="text-blue-800 font-semibold">{assignedNgo.full_name}</p>
                      <p className="text-blue-600 text-xs">{assignedNgo.email}</p>
                      <button className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Contact NGO</button>
                    </div>
                  ) : (
                    <p className="text-blue-500 text-sm italic">No NGO assigned yet. Contact Admin.</p>
                  )}
                </div>
             </div>

             <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
               <h2 className="font-bold text-xl mb-4 text-stone-800">Upload Activity Proof</h2>
               <p className="text-sm text-stone-500 mb-4">Upload photos of waste segregation or bin usage to improve ranking.</p>
               <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center bg-stone-50 hover:bg-stone-100 transition-colors relative">
                 {isUploading ? (
                   <div className="text-orange-600 font-bold animate-pulse">Uploading...</div>
                 ) : (
                   <>
                     <svg className="w-10 h-10 text-stone-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                     <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleUpload}
                      className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                     />
                   </>
                 )}
               </div>
               <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-full mt-4 bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700"
               >
                  Submit for Verification
               </button>
             </div>

             <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h2 className="font-bold text-xl mb-4 text-stone-800">Volunteer & Service Request</h2>
                <div className="flex gap-2">
                   <select 
                     value={eventType}
                     onChange={(e) => setEventType(e.target.value)}
                     className="flex-1 border rounded-lg p-2 text-sm bg-stone-50"
                   >
                     <option>Select Event Type</option>
                     <option>Daily Cleaning Support</option>
                     <option>Festival Volunteer Request</option>
                     <option>Bin Maintenance Issue</option>
                   </select>
                   <button 
                     onClick={handleRequestVolunteers}
                     className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-black"
                   >
                     Request
                   </button>
                </div>
             </div>
           </div>

           {/* Admin Updates Panel */}
           <div className="md:col-span-1">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 h-full">
               <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
                 <span>📢</span> Admin Updates
               </h2>
               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                 {adminUpdates.length === 0 ? (
                   <p className="text-stone-500 text-sm">No updates yet.</p>
                 ) : (
                   adminUpdates.map(u => (
                     <div key={u.id} className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white mb-2 inline-block ${
                         u.type === 'ALERT' ? 'bg-red-500' : 'bg-blue-500'
                       }`}>
                         {u.type}
                       </span>
                       <h3 className="font-bold text-stone-800 text-sm">{u.title}</h3>
                       <p className="text-stone-600 text-xs mt-1">{u.content}</p>
                       <p className="text-[10px] text-stone-400 mt-2 text-right">{u.date}</p>
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

export default TempleDashboard;