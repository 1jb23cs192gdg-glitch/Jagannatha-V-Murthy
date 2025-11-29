import React from 'react';

const Guidelines = () => {
  const steps = [
    {
      title: "Scan & Drop",
      desc: "Devotee scans the QR code on the Smart Bin and drops the offering.",
      icon: "📱"
    },
    {
      title: "IoT Segregation",
      desc: "Smart sensors and AI cameras inside the bin identify the waste type (Flower, Plastic, Organic).",
      icon: "🤖"
    },
    {
      title: "Mapping & Collection",
      desc: "AI maps the waste quantity and notifies the nearest NGO for timely pickup.",
      icon: "🚛"
    },
    {
      title: "Processing",
      desc: "Waste is transported to processing units where SHGs convert them into products.",
      icon: "⚗️"
    },
    {
      title: "Blockchain Record",
      desc: "The entire lifecycle is recorded on the blockchain for transparency.",
      icon: "🔗"
    },
    {
      title: "Marketplace",
      desc: "Final eco-products are listed on the app for devotees to purchase.",
      icon: "🛍️"
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
           <h1 className="text-4xl font-bold text-stone-800 mb-4">How It Works</h1>
           <p className="text-stone-600 text-lg">A simple guide to our waste-to-wealth methodology.</p>
        </div>

        <div className="relative border-l-4 border-orange-200 ml-4 md:ml-0 md:pl-0 space-y-12">
          {steps.map((step, index) => (
            <div key={index} className="relative pl-8 md:pl-0">
               {/* Timeline Dot */}
               <div className="absolute -left-[11px] top-0 w-6 h-6 bg-orange-500 rounded-full border-4 border-white shadow-sm"></div>
               
               <div className="md:flex items-start gap-6 bg-white p-6 rounded-xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                 <div className="w-16 h-16 bg-orange-100 rounded-full flex-shrink-0 flex items-center justify-center text-3xl mb-4 md:mb-0">
                   {step.icon}
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-stone-800 mb-2">Step {index + 1}: {step.title}</h3>
                   <p className="text-stone-600 leading-relaxed">{step.desc}</p>
                 </div>
               </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-blue-50 p-8 rounded-2xl border border-blue-100 text-center">
          <h3 className="text-xl font-bold text-blue-900 mb-2">For Temples & Households</h3>
          <p className="text-blue-700">
            Ensure you separate liquid waste (milk/water) into the dedicated tanks provided next to the smart bins. 
            Dry waste should be dropped directly into the AI-bin opening.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Guidelines;