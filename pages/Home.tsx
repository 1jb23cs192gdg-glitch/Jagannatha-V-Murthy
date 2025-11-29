import React, { useEffect, useState } from 'react';
import { MOCK_UPDATES, BowArrowLogo } from '../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { FlashUpdate } from '../types';
import { Link } from 'react-router-dom';

const Home = () => {
  const [updates, setUpdates] = useState<FlashUpdate[]>(MOCK_UPDATES);
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0");
  const [realStats, setRealStats] = useState({
    waste: 0,
    temples: 0,
    households: 0,
    coins: 0
  });

  useEffect(() => {
    const fetchContent = async () => {
      // 1. Fetch Flash Updates
      const { data: updateData, error } = await supabase
        .from('flash_updates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && updateData && updateData.length > 0) {
        const news = updateData.filter(u => u.type !== 'VIDEO_CONFIG');
        const videoConfig = updateData.find(u => u.type === 'VIDEO_CONFIG');

        if (news.length > 0) {
          setUpdates(news.map(u => ({
            id: u.id,
            title: u.title,
            content: u.content,
            type: u.type as any,
            date: new Date(u.created_at).toLocaleDateString()
          })));
        }

        if (videoConfig && videoConfig.content) {
          setVideoUrl(videoConfig.content);
        }
      }

      // 2. Fetch Real Stats
      // Get all temples to sum waste
      const { data: templeData } = await supabase.from('temples').select('waste_donated_kg');
      const totalWaste = templeData ? templeData.reduce((acc, curr) => acc + (curr.waste_donated_kg || 0), 0) : 12400;
      const templeCount = templeData ? templeData.length : 45;

      // Get user counts
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'PERSON');
      
      setRealStats({
        waste: totalWaste,
        temples: templeCount,
        households: userCount || 150, // Default if 0
        coins: Math.floor(totalWaste * 10) // Approx calculation based on waste
      });
    };
    fetchContent();
  }, []);

  const stats = [
    { label: 'Total Waste Collected', value: `${(realStats.waste / 1000).toFixed(1)} Tons`, icon: '🌿', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Temples Connected', value: `${realStats.temples}+`, icon: '🛕', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Households Active', value: `${realStats.households}+`, icon: '🏠', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Green Coins Earned', value: `${(realStats.coins / 1000).toFixed(1)}k`, icon: '🪙', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  const graphData = [
    { name: 'Jan', waste: 4000 },
    { name: 'Feb', waste: 3000 },
    { name: 'Mar', waste: 2000 },
    { name: 'Apr', waste: 2780 },
    { name: 'May', waste: 1890 },
    { name: 'Jun', waste: 2390 },
    { name: 'Jul', waste: 3490 },
  ];

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1561587428-f646d5810006?q=80&w=2070" 
            alt="Temple Background" 
            className="w-full h-full object-cover scale-105 animate-[pulse_20s_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/50 to-stone-900"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        </div>

        <div className="relative z-10 max-w-5xl px-4 flex flex-col items-center">
          <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-30 rounded-full"></div>
              <div className="p-6 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl relative">
                <BowArrowLogo className="w-20 h-20 md:w-28 md:h-28 rounded-full shadow-inner bg-gradient-to-br from-orange-500 to-red-600 p-5 text-white" color="white" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tight leading-tight drop-shadow-2xl">
            Temple to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">Ayurveda</span>
          </h1>
          
          <p className="text-lg md:text-2xl mb-10 text-stone-200 font-light max-w-3xl mx-auto drop-shadow-lg leading-relaxed">
            A sacred revolution transforming ritual offerings into sustainable life.
            <br className="hidden md:block"/> Join the movement of <span className="font-semibold text-orange-200">Waste to Wealth</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center w-full max-w-lg">
             <Link to="/login" className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 hover:shadow-orange-500/50 shadow-xl flex items-center justify-center gap-2">
               <span>🚀</span> Join the Mission
             </Link>
             <a href="#roadmap" className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
               <span>🗺️</span> Explore Roadmap
             </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
           <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
        </div>
      </section>

      {/* Flash Updates Ticker */}
      <div className="bg-white border-b border-stone-200 py-3 overflow-hidden relative shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 flex items-center">
           <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mr-4 shadow-md z-10 animate-pulse tracking-wider">LIVE UPDATES</span>
           <div className="flex-1 overflow-x-auto hide-scrollbar whitespace-nowrap mask-gradient-right">
             <div className="inline-flex gap-6 animate-[scroll_30s_linear_infinite]">
                {[...updates, ...updates].map((u, i) => (
                  <div key={`${u.id}-${i}`} className="inline-flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${u.type === 'ALERT' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    <span className="text-sm font-bold text-stone-800 uppercase text-[10px] tracking-wide">{u.title}:</span>
                    <span className="text-sm text-stone-600">{u.content}</span>
                    <span className="text-stone-300 mx-2">|</span>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>

      {/* Stats Section */}
      <section id="stats" className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-orange-600 font-bold tracking-widest uppercase text-sm">Our Impact</span>
            <h2 className="text-4xl md:text-5xl font-bold text-stone-800 mt-2">Making a Tangible Difference</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className={`group ${stat.bg} p-8 rounded-3xl border border-stone-100 text-center hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-500 hover:-translate-y-2`}>
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">{stat.icon}</div>
                <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-stone-500 font-bold uppercase tracking-wide text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
          
          {/* Chart Section */}
          <div className="mt-20 flex flex-col lg:flex-row gap-12 items-center">
             <div className="lg:w-1/3">
                <h3 className="text-3xl font-bold text-stone-800 mb-4">Real-Time Waste Analytics</h3>
                <p className="text-stone-600 text-lg leading-relaxed mb-6">
                  We track every kilogram of flower, coconut, and organic waste collected from our partner temples. Our transparency ensures you know exactly how your offering creates impact.
                </p>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl">⚡</div>
                  <div>
                    <div className="text-2xl font-bold text-stone-800">{realStats.waste > 1000 ? (realStats.waste/1000).toFixed(1) + ' Tons' : realStats.waste + ' Kg'}</div>
                    <div className="text-xs text-stone-500 uppercase">Processed Total</div>
                  </div>
                </div>
                <Link to="/rankings" className="text-orange-600 font-bold hover:underline flex items-center gap-2">
                  View Temple Rankings <span>→</span>
                </Link>
             </div>
             
             <div className="lg:w-2/3 w-full bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-stone-100 h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={graphData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '12px 16px' }}
                     cursor={{ fill: '#f5f5f4' }}
                   />
                   <Bar dataKey="waste" fill="url(#colorWaste)" radius={[8, 8, 0, 0]} barSize={50} />
                   <defs>
                      <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#fed7aa" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-24 bg-stone-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <svg width="100%" height="100%">
              <pattern id="pattern-circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor"></circle>
              </pattern>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)"></rect>
           </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <span className="text-orange-500 font-bold tracking-widest text-sm uppercase mb-3 block">Education & Awareness</span>
          <h2 className="text-4xl md:text-6xl font-bold mb-12">Clean Premises, Better Future</h2>
          
          <div className="max-w-5xl mx-auto aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(234,88,12,0.3)] border border-stone-800 relative group transform hover:scale-[1.01] transition-transform duration-500">
             <iframe 
               className="w-full h-full"
               src={videoUrl}
               title="Education Video" 
               frameBorder="0" 
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
               allowFullScreen
             ></iframe>
             <div className="absolute top-6 left-6 bg-red-600 text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-2">
               <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> Featured
             </div>
          </div>
          
          <p className="mt-12 text-stone-400 max-w-3xl mx-auto text-xl leading-relaxed font-light">
            Proper waste segregation at the source is the first step towards a sustainable future. 
            Watch how our partner temples are setting an example for the world.
          </p>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="py-24 bg-orange-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-stone-800 mb-4">The Journey of Devotion</h2>
            <p className="text-stone-600 text-lg">From Sacred Offering to Sustainable Product</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
             {/* Connector Line (Desktop) */}
             <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200 -translate-y-1/2 z-0"></div>
             
             {[
               { title: 'Collection', desc: 'Smart Bins at Temples & Homes', icon: '🗑️' },
               { title: 'AI Segregation', desc: 'Computer Vision sorts material', icon: '🤖' },
               { title: 'Processing', desc: 'Conversion to Gas, Compost, Products', icon: '⚗️' },
               { title: 'Distribution', desc: 'Eco-products back to the community', icon: '🎁' }
             ].map((step, i) => (
               <div key={i} className="relative z-10 bg-white p-8 rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-col items-center text-center hover:-translate-y-3 transition-transform duration-300 group">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-stone-800">{step.title}</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">{step.desc}</p>
                  <div className="absolute -bottom-5 bg-gradient-to-br from-orange-500 to-red-600 text-white text-sm font-bold w-10 h-10 flex items-center justify-center rounded-full border-4 border-white shadow-md">
                    {i + 1}
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-orange-600 to-red-700 text-white text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         <div className="max-w-4xl mx-auto px-4 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Contribute?</h2>
            <p className="text-orange-100 text-xl mb-10 max-w-2xl mx-auto">Join thousands of devotees, temples, and NGOs making a difference today. Earn Green Coins and blessings.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-5">
               <Link to="/login" className="bg-white text-orange-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-orange-50 shadow-2xl transition-all transform hover:scale-105">
                 Login / Register
               </Link>
               <Link to="/connect" className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all">
                 Contact Us
               </Link>
            </div>
         </div>
      </section>
    </div>
  );
};

export default Home;