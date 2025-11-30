
import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen relative py-16 px-4 overflow-hidden font-sans">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://www.gosahin.com/upload/destinations/1515608449_Tirupati-Balaji1.jpg" 
          alt="Temple Background" 
          className="w-full h-full object-cover fixed"
        />
        <div className="absolute inset-0 bg-stone-50/90 backdrop-blur-sm"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-orange-600 font-bold tracking-widest uppercase text-sm">Mission & Vision</span>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mt-2 mb-6">Swadeshi for Atmanirbhar Bharat</h1>
          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            Bridging the gap between ancient traditions and modern sustainability through AI, IoT, and Devotion.
          </p>
        </div>

        {/* Problem & Solution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div className="bg-white/80 backdrop-blur p-8 rounded-2xl shadow-sm border-l-4 border-red-500">
            <h2 className="text-2xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <span className="text-3xl">⚠️</span> The Problem
            </h2>
            <p className="text-stone-600 leading-relaxed">
              Millions of tons of ritual waste (flowers, coconuts, cloth, plastics) are dumped into rivers annually. This "sacred pollution" causes severe environmental hazards, pollutes aquatic life, and contributes to landfill burdens, contradicting the very Sanatani values of respecting nature (Prakriti).
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur p-8 rounded-2xl shadow-sm border-l-4 border-green-500">
            <h2 className="text-2xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <span className="text-3xl">💡</span> The Solution
            </h2>
            <p className="text-stone-600 leading-relaxed">
              An AI + IoT powered ecosystem that collects, segregates, and transforms ritual waste into eco-products. We convert flowers to incense, coconuts to activated charcoal, and organic waste to bio-gas, creating a circular economy around temple offerings.
            </p>
          </div>
        </div>

        {/* Transformation Showcase */}
        <div className="bg-white/80 backdrop-blur rounded-3xl p-8 md:p-12 shadow-lg mb-16">
          <h2 className="text-3xl font-bold text-center mb-10 text-stone-800">From Waste to Wealth</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
             <div className="p-4 bg-orange-50/80 rounded-xl border border-orange-100">
               <div className="text-4xl mb-2">🌸</div>
               <h3 className="font-bold text-stone-800">Flowers</h3>
               <p className="text-stone-500 text-sm">To Ayurvedic Oils & Incense</p>
             </div>
             <div className="p-4 bg-stone-100/80 rounded-xl border border-stone-200">
               <div className="text-4xl mb-2">🥥</div>
               <h3 className="font-bold text-stone-800">Coconuts</h3>
               <p className="text-stone-500 text-sm">To Activated Charcoal</p>
             </div>
             <div className="p-4 bg-green-50/80 rounded-xl border border-green-100">
               <div className="text-4xl mb-2">🍚</div>
               <h3 className="font-bold text-stone-800">Rice/Milk</h3>
               <p className="text-stone-500 text-sm">To Bio-fertilizers</p>
             </div>
             <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-100">
               <div className="text-4xl mb-2">👚</div>
               <h3 className="font-bold text-stone-800">Cloth</h3>
               <p className="text-stone-500 text-sm">To Eco-fabrics & Bags</p>
             </div>
          </div>
        </div>

        {/* Innovation Section */}
        <div className="text-center bg-stone-900/95 backdrop-blur text-white rounded-3xl p-12 shadow-2xl">
           <h2 className="text-3xl font-bold mb-6">Our Core Innovation</h2>
           <div className="flex flex-col md:flex-row justify-center gap-8">
             <div className="flex-1 p-6 border border-stone-700 rounded-xl hover:bg-stone-800 transition-colors">
               <h3 className="text-xl font-bold text-orange-400 mb-2">AI + IoT</h3>
               <p className="text-stone-400">Computer vision based automated segregation of mixed ritual waste.</p>
             </div>
             <div className="flex-1 p-6 border border-stone-700 rounded-xl hover:bg-stone-800 transition-colors">
               <h3 className="text-xl font-bold text-green-400 mb-2">Blockchain</h3>
               <p className="text-stone-400">End-to-end traceability of your offering from temple bin to final product.</p>
             </div>
             <div className="flex-1 p-6 border border-stone-700 rounded-xl hover:bg-stone-800 transition-colors">
               <h3 className="text-xl font-bold text-blue-400 mb-2">Social Impact</h3>
               <p className="text-stone-400">Employment for Self-Help Groups (SHGs) and cleaner rivers.</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default About;
