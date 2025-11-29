import React, { useEffect, useState } from 'react';
import { MOCK_TEMPLES } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { Temple } from '../types';

const Rankings = () => {
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
        .order('waste_donated_kg', { ascending: false });
      
      if (error) throw error;

      if (data && data.length > 0) {
        const formattedTemples: Temple[] = data.map(t => ({
          id: t.id,
          name: t.name,
          location: t.location,
          wasteDonatedKg: t.waste_donated_kg,
          greenStars: t.green_stars,
          imageUrl: t.image_url || 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&q=80&w=400',
          description: t.description,
          ngoId: t.ngo_id
        }));
        setTemples(formattedTemples);
      } else {
        // Fallback to mock if DB is empty for demo purposes
        setTemples([...MOCK_TEMPLES].sort((a, b) => b.wasteDonatedKg - a.wasteDonatedKg));
      }
    } catch (error) {
      console.error("Error fetching temples:", error);
      // Fallback on error
      setTemples([...MOCK_TEMPLES].sort((a, b) => b.wasteDonatedKg - a.wasteDonatedKg));
    } finally {
      setLoading(false);
    }
  };

  const handleViewPhotos = (templeName: string) => {
    alert(`Opening photo gallery for ${templeName}...\n(This would open a lightbox in the full version)`);
  };

  if (loading) return <div className="min-h-screen pt-20 text-center">Loading Rankings...</div>;

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-stone-800 mb-4">Green Temple Rankings</h1>
          <p className="text-stone-600">Celebrating temples that lead the way in sustainability and waste management.</p>
        </div>

        <div className="space-y-6">
          {temples.map((temple, index) => (
            <div key={temple.id} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex flex-col md:flex-row items-center gap-6 transform hover:scale-[1.01] transition-transform duration-300">
              <div className="flex-shrink-0 relative">
                <img src={temple.imageUrl} alt={temple.name} className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover shadow-inner" />
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold shadow-lg border-2 border-white">
                  #{index + 1}
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-stone-800">{temple.name}</h2>
                <p className="text-stone-500 font-medium mb-2">{temple.location}</p>
                <div className="flex justify-center md:justify-start gap-1 mb-3">
                   {[...Array(5)].map((_, i) => (
                     <span key={i} className={`text-lg ${i < temple.greenStars ? 'text-yellow-400' : 'text-stone-200'}`}>★</span>
                   ))}
                </div>
                <p className="text-sm text-stone-600 italic">"{temple.description}"</p>
              </div>

              <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6 min-w-[150px]">
                 <div className="text-3xl font-bold text-green-600">{temple.wasteDonatedKg.toLocaleString()}</div>
                 <div className="text-xs text-stone-400 uppercase font-bold tracking-wider">Kg Waste Recycled</div>
                 <button 
                   onClick={() => handleViewPhotos(temple.name)}
                   className="mt-4 text-orange-600 text-sm font-semibold hover:bg-orange-50 px-3 py-1 rounded transition-colors"
                 >
                   View Photos
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rankings;