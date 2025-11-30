
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Temple } from '../types';

const TempleList = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemples();
  }, []);

  const fetchTemples = async () => {
    try {
      const { data, error } = await supabase
        .from('temples')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;

      if (data) {
        const formattedTemples: Temple[] = data.map(t => ({
          id: t.id,
          name: t.name,
          location: t.location || 'Location Pending',
          wasteDonatedKg: t.waste_donated_kg,
          greenStars: t.green_stars,
          imageUrl: t.image_url || 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&q=80&w=400',
          description: t.description || 'Joining the renewable revolution.',
          ngoId: t.ngo_id
        }));
        setTemples(formattedTemples);
      } else {
        setTemples([]);
      }
    } catch (error) {
      console.error("Error fetching temples:", error);
      setTemples([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen pt-24 text-center">Loading Temples...</div>;

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-stone-800 mb-8">Our Partner Temples</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {temples.map(temple => (
            <div key={temple.id} className="group bg-stone-50 rounded-xl overflow-hidden border border-stone-100 hover:shadow-lg transition-all">
              <div className="relative h-48 overflow-hidden">
                <img src={temple.imageUrl} alt={temple.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-green-700 flex items-center gap-1">
                  <span>★</span> {temple.greenStars}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-stone-800 truncate">{temple.name}</h3>
                <p className="text-stone-500 text-sm mb-3">{temple.location}</p>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-stone-600">Recycled:</span>
                   <span className="font-bold text-orange-600">{temple.wasteDonatedKg.toLocaleString()} kg</span>
                </div>
              </div>
            </div>
          ))}
          
          {temples.length === 0 && (
             <div className="col-span-full py-20 text-center bg-stone-50 rounded-xl border border-stone-200">
                <p className="text-stone-400">No partner temples found.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TempleList;
