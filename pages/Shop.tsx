
import React, { useEffect, useState } from 'react';
import { SHOPPING_URL } from '../constants';
import { supabase } from '../lib/supabaseClient';

const Shop = () => {
  const [shopUrl, setShopUrl] = useState(SHOPPING_URL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopConfig = async () => {
      try {
        // Fetch dynamic URL set by admin, fallback to constant
        const { data } = await supabase.from('site_config').select('url').eq('id', 'shop_url').single();
        if (data && data.url) {
          setShopUrl(data.url);
        }
      } catch (error) {
        console.error("Error fetching shop config:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopConfig();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-stone-800 mb-4">Temple Eco-Shop</h1>
          <p className="text-stone-600 text-lg">Purchase sustainable, authentic Ayurvedic products made from recycled temple offerings.</p>
        </div>

        {/* External Link Highlight Banner */}
        <div className="bg-white rounded-3xl p-10 md:p-16 text-center shadow-2xl border border-stone-200 relative overflow-hidden group">
           
           <div className="relative z-10 flex flex-col items-center">
             <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">
               🛍️
             </div>

             <h2 className="text-3xl md:text-4xl font-bold mb-6 text-stone-800">Visit Our Partner Store</h2>
             
             <p className="text-stone-600 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
               We have moved our inventory to a dedicated platform to serve you better. 
               Browse our full catalog of <strong>Nirmalya Incense</strong>, <strong>Vermicompost</strong>, 
               and <strong>Bio-Enzymes</strong> on our official e-commerce website.
             </p>
             
             {loading ? (
                <div className="animate-pulse bg-stone-200 h-12 w-48 rounded-full"></div>
             ) : (
                <a 
                  href={shopUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-10 py-5 rounded-full font-bold text-xl hover:shadow-orange-500/40 shadow-xl transform hover:scale-105 transition-all flex items-center gap-2"
                >
                  Start Shopping Now 
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
             )}

             <p className="mt-6 text-sm text-stone-400">
               You will be redirected to an external secure payment gateway.
             </p>
           </div>
           
           {/* Background Decorations */}
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400"></div>
           <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-50"></div>
           <div className="absolute -top-20 -left-20 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50"></div>
        </div>

        {/* Categories Preview (Static Visual Only) */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-70">
           {['Incense Sticks', 'Essential Oils', 'Organic Manure', 'Holi Colors'].map((cat, i) => (
             <div key={i} className="text-center p-4">
               <div className="h-1 bg-stone-200 rounded mb-2 w-1/2 mx-auto"></div>
               <span className="text-stone-400 font-bold uppercase text-xs">{cat}</span>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
};

export default Shop;
