import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-stone-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-orange-600 font-bold tracking-widest uppercase text-sm">Mission & Vision</span>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mt-2 mb-6">Swadeshi for Atmanirbhar Bharat</h1>
          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Bridging the gap between ancient traditions and modern sustainability through AI, IoT, and Devotion.
          </p>
          
          {/* Featured Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <img 
              src="https://i.ytimg.com/vi/SBhfS5cC23Y/maxresdefault.jpg" 
              alt="Temple Innovation" 
              className="w-full h-[300px] md:h-[400px] object-cover transform hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-8">
              <p className="text-white/90 font-medium italic text-lg">"Preserving Sanctity, Protecting Nature"</p>
            </div>
          </div>
        </div>

        {/* Problem & Solution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-sm border-l-4 border-red-500">
            <h2 className="text-2xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <span className="text-3xl">⚠️</span> The Problem
            </h2>
            <p className="text-stone-600 leading-relaxed">
              Millions of tons of ritual waste (flowers, coconuts, cloth, plastics) are dumped into rivers annually. This "sacred pollution" causes severe environmental hazards, pollutes aquatic life, and contributes to landfill burdens, contradicting the very Sanatani values of respecting nature (Prakriti).
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border-l-4 border-green-500">
            <h2 className="text-2xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <span className="text-3xl">💡</span> The Solution
            </h2>
            <p className="text-stone-600 leading-relaxed">
              An AI + IoT powered ecosystem that collects, segregates, and transforms ritual waste into eco-products. We convert flowers to incense, coconuts to activated charcoal, and organic waste to bio-gas, creating a circular economy around temple offerings.
            </p>
          </div>
        </div>

        {/* Transformation Showcase */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">From Waste to Wealth</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
             <div className="p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
               <div className="text-4xl mb-2">🌸</div>
               <h3 className="font-bold text-stone-800">Flowers</h3>
               <p className="text-stone-500 text-sm">To Ayurvedic Oils & Incense</p>
             </div>
             <div className="p-4 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors">
               <div className="text-4xl mb-2">🥥</div>
               <h3 className="font-bold text-stone-800">Coconuts</h3>
               <p className="text-stone-500 text-sm">To Activated Charcoal</p>
             </div>
             <div className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
               <div className="text-4xl mb-2">🍚</div>
               <h3 className="font-bold text-stone-800">Rice/Milk</h3>
               <p className="text-stone-500 text-sm">To Bio-fertilizers</p>
             </div>
             <div className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
               <div className="text-4xl mb-2">👚</div>
               <h3 className="font-bold text-stone-800">Cloth</h3>
               <p className="text-stone-500 text-sm">To Eco-fabrics & Bags</p>
             </div>
          </div>
        </div>

        {/* Innovation Section */}
        <div className="text-center bg-stone-900 text-white rounded-3xl p-12">
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