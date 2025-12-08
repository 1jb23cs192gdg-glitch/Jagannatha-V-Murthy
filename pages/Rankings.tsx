
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Temple } from '../types';
import { GoogleGenAI } from "@google/genai";

declare var process: {
  env: {
    API_KEY: string;
  };
};

const Rankings = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Gallery State
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentTemplePhotos, setCurrentTemplePhotos] = useState<string[]>([]);
  const [currentTempleName, setCurrentTempleName] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);

  // Maps Grounding State
  const [verifiedLocations, setVerifiedLocations] = useState<Record<string, string>>({});
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});

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
          spocDetails: t.spocDetails, 
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

  const handleVerifyLocation = async (temple: Temple) => {
    setVerifying(prev => ({ ...prev, [temple.id]: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Use Maps Grounding to get precise location
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find the exact address and location of ${temple.name} in ${temple.location || 'India'}. Return only the precise address formatted for Google Maps query.`,
        config: {
          tools: [{ googleMaps: {} }],
        }
      });

      const groundedAddress = response.text?.trim();
      if (groundedAddress) {
        setVerifiedLocations(prev => ({ ...prev, [temple.id]: groundedAddress }));
      }
    } catch (error) {
      console.error("Maps Grounding failed:", error);
    } finally {
      setVerifying(prev => ({ ...prev, [temple.id]: false }));
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
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-stone-800 mb-4">Green Temple Rankings</h1>
          <p className="text-stone-600">Celebrating temples that lead the way in sustainability and waste management.</p>
        </div>

        <div className="space-y-8">
          {temples.map((temple, index) => {
            const mapLocation = verifiedLocations[temple.id] || temple.address || temple.location;
            return (
              <div key={temple.id} className="bg-white rounded-3xl p-6 shadow-xl border border-stone-100 flex flex-col lg:flex-row gap-8 transform hover:-translate-y-1 transition-transform duration-300">
                {/* Left: Image & Rank */}
                <div className="relative w-full lg:w-1/3 h-64 lg:h-auto rounded-2xl overflow-hidden shadow-md">
                  <img src={temple.imageUrl} alt={temple.name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white">
                    #{index + 1}
                  </div>
                </div>
                
                {/* Middle: Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                      <div className="flex justify-between items-start">
                          <h2 className="text-3xl font-bold text-stone-800 mb-1">{temple.name}</h2>
                          <div className="text-right">
                              <span className="text-3xl font-bold text-green-600">{temple.wasteDonatedKg.toLocaleString()}</span>
                              <span className="block text-[10px] text-stone-400 uppercase font-bold tracking-wider">Kg Recycled</span>
                          </div>
                      </div>
                      
                      <p className="text-stone-500 font-medium mb-3 flex items-center gap-1">
                          📍 {mapLocation}
                          {verifiedLocations[temple.id] && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200" title="Verified by Google Maps Data">✓ Verified</span>}
                      </p>

                      <div className="flex gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-lg ${i < temple.greenStars ? 'text-yellow-400' : 'text-stone-200'}`}>★</span>
                          ))}
                      </div>
                      
                      <p className="text-stone-600 italic mb-4 bg-stone-50 p-3 rounded-lg border-l-4 border-orange-300">
                          "{temple.description}"
                      </p>

                      {temple.spocDetails && (
                          <div className="flex gap-4 items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-xl">👤</div>
                              <div>
                                  <p className="text-xs font-bold text-blue-800 uppercase">Temple SPOC</p>
                                  <p className="text-sm font-bold text-slate-700">{temple.spocDetails.name}</p>
                                  <p className="text-xs text-slate-500">{temple.spocDetails.contact}</p>
                              </div>
                          </div>
                      )}
                  </div>
                  
                  <div className="mt-6 flex gap-4">
                      <button 
                          onClick={() => handleViewPhotos(temple.id, temple.name, temple.imageUrl)}
                          className="flex-1 bg-stone-800 text-white py-2 rounded-xl text-sm font-bold hover:bg-black transition-colors"
                      >
                          View Proof Gallery
                      </button>
                  </div>
                </div>

                {/* Right: Map Embed */}
                <div className="w-full lg:w-1/3 h-64 rounded-2xl overflow-hidden border border-stone-200 relative bg-stone-100">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(mapLocation)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        title={`${temple.name} Location`}
                        className="absolute inset-0"
                    ></iframe>
                    <div className="absolute bottom-2 right-2 flex gap-2">
                        <button 
                          onClick={() => handleVerifyLocation(temple)}
                          disabled={verifying[temple.id]}
                          className="bg-white/90 hover:bg-white text-stone-700 px-3 py-1 text-[10px] font-bold rounded shadow transition-colors flex items-center gap-1"
                        >
                           {verifying[temple.id] ? <span className="animate-spin">⌛</span> : <span>🎯</span>} 
                           {verifiedLocations[temple.id] ? 'Update Location' : 'Verify Location'}
                        </button>
                        <div className="bg-white/90 px-2 py-1 text-[10px] font-bold rounded shadow text-stone-600 flex items-center">
                            Live Map
                        </div>
                    </div>
                </div>
              </div>
            );
          })}
          
          {temples.length === 0 && (
             <div className="text-center py-20">
                 <p className="text-stone-400">No temples currently ranked.</p>
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
                   <p className="text-sm text-stone-500">Activity Gallery & Verified Proofs</p>
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
                       <div className="text-center py-10 text-stone-400">No additional photos uploaded.</div>
                     ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {currentTemplePhotos.map((img, idx) => (
                            <div key={idx} className="relative group overflow-hidden rounded-xl bg-stone-100 h-64 shadow-md">
                              <img 
                                src={img} 
                                alt={`Gallery ${idx}`} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                              />
                            </div>
                          ))}
                       </div>
                     )}
                   </>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Rankings;
