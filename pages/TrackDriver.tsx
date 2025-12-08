
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BowArrowLogo } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { GoogleGenAI } from "@google/genai";

declare var process: {
  env: {
    API_KEY: string;
  };
};

interface TrackDriverProps {
  embeddedId?: string; // Optional prop for when used inside Dashboard
}

const TrackDriver: React.FC<TrackDriverProps> = ({ embeddedId }) => {
  const { id: paramId } = useParams();
  const id = embeddedId || paramId;
  
  const [status, setStatus] = useState('CONNECTING');
  const [location, setLocation] = useState('Locating...');
  const [groundedLocation, setGroundedLocation] = useState<string | null>(null);
  const [routeInsight, setRouteInsight] = useState<string | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);
  const [dots, setDots] = useState('');
  const [isGrounding, setIsGrounding] = useState(false);

  // Animation for the "Live" indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Real-time Poll from Firebase
  useEffect(() => {
    if (!id) {
        setStatus('ERROR');
        setLocation('Invalid Tracking ID');
        return;
    }

    const fetchLocation = async () => {
        try {
            // Fetch directly from Firebase 'vehicles' table
            const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single();
            
            if (data) {
                setVehicleDetails(data);
                
                // Only trigger Grounding if location changed significantly or first load
                if (data.current_location !== location) {
                    setLocation(data.current_location || 'Unknown Location');
                    analyzeLogistics(data.current_location, data.destination);
                }
                
                if (data.status === 'EN_ROUTE') setStatus('LIVE');
                else if (data.status === 'LOADING') setStatus('LOADING');
                else setStatus('OFFLINE');
            } else {
                setStatus('NOT_FOUND');
                setLocation('Vehicle not found in system');
            }
        } catch (e) {
            console.error("Tracking Error:", e);
            setStatus('ERROR');
        }
    };

    // Initial Fetch
    fetchLocation();

    // Poll every 5 seconds for live updates
    const pollTimer = setInterval(fetchLocation, 5000);

    return () => clearInterval(pollTimer);
  }, [id]);

  const analyzeLogistics = async (rawLocation: string, destination?: string) => {
      if (!rawLocation) return;
      setIsGrounding(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          let prompt = `Locate "${rawLocation}" precisely in India using Google Maps data. Return the most accurate formatted address for a map query.`;
          
          if (destination) {
              prompt = `I am tracking a delivery vehicle. 
              Current reported location: "${rawLocation}".
              Destination: "${destination}".
              
              Task 1: Verify the current location precisely using Google Maps.
              Task 2: Calculate the driving route, distance, and estimated time to the destination.
              
              Return a concise summary in this format:
              "Verified at [Precise Address]. [Distance] km to destination ([Time] away)."`;
          }

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { tools: [{ googleMaps: {} }] },
          });
          
          const resultText = response.text?.trim();
          
          if (resultText) {
              // If we have a destination, the result is complex (Insight), otherwise it's just an address
              if (destination) {
                  // Heuristic: If it contains "Verified at", use the full text as insight
                  // and try to extract the address part for the map
                  setRouteInsight(resultText);
                  
                  // Simple extraction attempt for map pin (everything before first period or comma if plausible)
                  // This is a basic fallback; usually the whole text is too long for a map query.
                  // For map query, we might stick to raw location or try to extract.
                  // Let's use the Raw Location grounded by the first sentence if possible.
                  const firstPart = resultText.split('.')[0].replace('Verified at', '').trim();
                  setGroundedLocation(firstPart.length > 5 ? firstPart : rawLocation);
              } else {
                  setGroundedLocation(resultText);
                  setRouteInsight(null);
              }
          }
      } catch (error) {
          console.error("Grounding failed:", error);
      } finally {
          setIsGrounding(false);
      }
  };

  // Conditional styles based on whether it's a full page or embedded
  const containerClass = embeddedId 
    ? "w-full h-full relative overflow-hidden bg-stone-900 text-white rounded-2xl"
    : "min-h-screen bg-stone-900 text-white flex flex-col relative overflow-hidden";

  const mapQuery = groundedLocation || location;

  return (
    <div className={containerClass}>
      
      {/* Map Background Layer */}
      <div className="absolute inset-0 z-0 opacity-50">
        <iframe 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          scrolling="no" 
          src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=m&z=14&ie=UTF8&iwloc=&output=embed`}
          title="Driver Location"
          style={{ filter: 'grayscale(100%) invert(90%)' }}
        ></iframe>
      </div>

      {/* Overlay Content */}
      <div className="relative z-10 flex-1 flex flex-col p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <BowArrowLogo className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Logistics View</h1>
              <p className="text-[10px] text-stone-300 uppercase tracking-widest">ID: {id?.substring(0,8)}...</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-2 ${status === 'LIVE' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              <span className={`w-2 h-2 rounded-full ${status === 'LIVE' ? 'bg-green-500 animate-ping' : 'bg-yellow-500'}`}></span>
              {status}{status === 'LIVE' || status === 'LOADING' ? dots : ''}
            </div>
          </div>
        </div>

        {/* Route Insight Card (New) */}
        {vehicleDetails?.destination && (
            <div className="mb-4 animate-fade-in">
                <div className="bg-blue-600/20 backdrop-blur-md border border-blue-500/30 p-4 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider flex items-center gap-2">
                            <span>🗺️</span> AI Route Analysis
                        </h3>
                        {isGrounding && <span className="text-[10px] text-blue-300 animate-pulse">Updating...</span>}
                    </div>
                    {routeInsight ? (
                        <p className="text-white font-medium text-sm leading-relaxed">{routeInsight}</p>
                    ) : (
                        <p className="text-blue-300/70 text-xs italic">Calculating route to {vehicleDetails.destination}...</p>
                    )}
                </div>
            </div>
        )}

        {/* Center Info (Spacer) */}
        <div className="flex-1"></div>

        {/* Bottom Panel */}
        <div className="bg-stone-800/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6">
           
           <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="max-w-[70%]">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-stone-400 text-xs uppercase font-bold">Current Location</p>
                    {groundedLocation && !isGrounding && (
                        <span className="bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded border border-green-500/30 flex items-center gap-1">
                            ✓ Verified
                        </span>
                    )}
                </div>
                <h2 className="text-xl font-bold text-white truncate">{mapQuery}</h2>
              </div>
              <div className="text-right">
                <p className="text-stone-400 text-xs uppercase font-bold mb-1">Vehicle</p>
                <h2 className="text-xl font-bold text-orange-500">{vehicleDetails?.vehicle_no || '--'}</h2>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                 <p className="text-xs text-stone-400 mb-1">Driver</p>
                 <p className="text-lg font-mono font-bold text-white truncate">{vehicleDetails?.driver_name || 'Unassigned'}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                 <p className="text-xs text-stone-400 mb-1">Destination</p>
                 <p className="text-lg font-mono font-bold text-white truncate">{vehicleDetails?.destination || 'Not Set'}</p>
              </div>
           </div>

           {!embeddedId && (
             <button 
               className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl font-bold text-white shadow-lg shadow-orange-900/50 hover:scale-[1.02] transition-transform active:scale-95"
               onClick={() => alert("SOS Signal Sent to NGO HQ & Admin Dashboard")}
             >
               🚨 Report Emergency
             </button>
           )}

           <p className="text-center text-[10px] text-stone-500">
             Powered by Gemini Maps Grounding
           </p>
        </div>

      </div>
    </div>
  );
};

export default TrackDriver;
