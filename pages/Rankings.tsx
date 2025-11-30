
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Temple } from '../types';

const Rankings = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Gallery State
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentTemplePhotos, setCurrentTemplePhotos] = useState<string[]>([]);
  const [currentTempleName, setCurrentTempleName] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);

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

      if (data) {
        const formattedTemples: Temple[] = data.map(t => ({
          id: t.id,
          name: t.name,
          location: t.location,
          wasteDonatedKg: t.waste_donated_kg,
          greenStars: t.green_stars,
          imageUrl: t.image_url || 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&q=80&w=400',
          description: t.description,
          ngoId: t.ngo_id,
          spocDetails: t.spocDetails, // Include SPOC details
          address: t.address
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

  const handleViewPhotos = async (templeId: string, templeName: string, mainImage: string) => {
    setCurrentTempleName(templeName);
    setGalleryOpen(true);
    setPhotoLoading(true);
    
    // Start with the main profile image
    const images = [mainImage];

    try {
      // Fetch approved activity photos from DB
      const { data } = await supabase
        .from('temple_photos')
        .select('image_url')
        .eq('temple_id', templeId)
        .eq('status', 'APPROVED');
      
      if (data && data.length > 0) {
        data.forEach((item: any) => images.push(item.image_url));
      }
    } catch (error) {
      console.error("Error fetching photos", error);
    }

    setCurrentTemplePhotos(images);
    setPhotoLoading(false);
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
            <div key={temple.id} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex flex-col md:flex-row items-start gap-6 transform hover:scale-[1.01] transition-transform duration-300">
              <div className="flex-shrink-0 relative">
                <img src={temple.imageUrl} alt={temple.name} className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover shadow-inner" />
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold shadow-lg border-2 border-white">
                  #{index + 1}
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left w-full">
                <div className="flex flex-col md:flex-row justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-stone-800">{temple.name}</h2>
                        <p className="text-stone-500 font-medium mb-1 flex items-center gap-1 justify-center md:justify-start">
                            📍 {temple.address || temple.location}
                        </p>
                    </div>
                    <div className="text-center md:text-right mt-4 md:mt-0">
                        <div className="text-3xl font-bold text-green-600">{temple.wasteDonatedKg.toLocaleString()}</div>
                        <div className="text-xs text-stone-400 uppercase font-bold tracking-wider">Kg Waste Recycled</div>
                    </div>
                </div>

                <div className="flex justify-center md:justify-start gap-1 my-3">
                   {[...Array(5)].map((_, i) => (
                     <span key={i} className={`text-lg ${i < temple.greenStars ? 'text-yellow-400' : 'text-stone-200'}`}>★</span>
                   ))}
                </div>
                
                <p className="text-sm text-stone-600 italic mb-3">"{temple.description}"</p>

                {temple.spocDetails && (
                  <div className="text-xs bg-stone-100 p-3 rounded-lg inline-block text-left border border-stone-200">
                    <span className="font-bold text-stone-700 block mb-1">📋 Team Contact (SPOC)</span> 
                    <span className="block text-stone-600">{temple.spocDetails.name} <span className="text-stone-400">({temple.spocDetails.role})</span></span>
                    <span className="block text-stone-500">📞 {temple.spocDetails.contact}</span>
                  </div>
                )}
                
                <div className="mt-4 md:text-right text-center">
                    <button 
                    onClick={() => handleViewPhotos(temple.id, temple.name, temple.imageUrl)}
                    className="text-orange-600 text-sm font-semibold hover:bg-orange-50 px-3 py-1 rounded transition-colors"
                    >
                    View Photos
                    </button>
                </div>
              </div>
            </div>
          ))}
          
          {temples.length === 0 && (
             <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 shadow-sm">
                 <p className="text-4xl mb-4">🛕</p>
                 <h3 className="text-xl font-bold text-stone-800">No Active Temples</h3>
                 <p className="text-stone-500 mt-2">No temple data available in the rankings at this moment.</p>
             </div>
          )}
        </div>
      </div>

      {/* Gallery Modal */}
      {galleryOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setGalleryOpen(false)}
        >
           <div 
             className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
             onClick={e => e.stopPropagation()}
           >
              <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-4">
                 <div>
                   <h2 className="text-2xl font-bold text-stone-800">{currentTempleName}</h2>
                   <p className="text-sm text-stone-500">Activity Gallery</p>
                 </div>
                 <button onClick={() => setGalleryOpen(false)} className="bg-stone-100 p-2 rounded-full hover:bg-stone-200 text-stone-600 transition-colors">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                 {photoLoading ? (
                   <div className="flex items-center justify-center h-48">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                   </div>
                 ) : (
                   <>
                     {currentTemplePhotos.length === 0 ? (
                       <div className="text-center py-10 text-stone-400">No photos available for this temple yet.</div>
                     ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {currentTemplePhotos.map((img, idx) => (
                            <div key={idx} className="relative group overflow-hidden rounded-xl bg-stone-100 h-64">
                              <img 
                                src={img} 
                                alt={`Gallery ${idx}`} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                              />
                              {idx === 0 && (
                                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded">Profile Pic</span>
                              )}
                            </div>
                          ))}
                       </div>
                     )}
                   </>
                 )}
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100 text-center text-xs text-stone-400">
                Displaying verified proofs and temple activities.
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Rankings;
