import React from 'react';

const Faqs = () => {
  const faqs = [
    {
      q: "What happens to the flowers I donate?",
      a: "Flowers are segregated and processed into organic incense sticks, natural dyes (Holi colors), and essential Ayurvedic oils by our partner Self-Help Groups."
    },
    {
      q: "Is the process religiously compliant?",
      a: "Absolutely. We treat all offerings (Nirmalya) with utmost reverence. They are never mixed with general garbage and are transformed into pure, useful products that can be used back in worship."
    },
    {
      q: "How do I earn Green Coins?",
      a: "By registering on our app and depositing segregated household ritual waste at our collection points or smart bins. You earn 10 Green Coins for every 1 kg of waste."
    },
    {
      q: "Where does the revenue go?",
      a: "Revenue from product sales is shared with the Temples (supporting their maintenance) and the NGOs/SHGs (providing employment to women). It creates a self-sustaining eco-economy."
    },
    {
      q: "Can I volunteer?",
      a: "Yes! You can register as a volunteer ('Sevak') through the user dashboard. Once verified by the admin, you will be assigned to a nearby temple to help with waste management during festivals."
    },
    {
      q: "How is blockchain used?",
      a: "Blockchain technology records every step of the waste's journey. You can scan a QR code on the final product (e.g., incense box) to see exactly which temple the flowers came from and when."
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-stone-800 mb-8 text-center">Frequently Asked Questions</h1>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <details className="group">
                <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-6 bg-stone-50 hover:bg-stone-100 transition-colors">
                  <span className="text-lg font-bold text-stone-700">{faq.q}</span>
                  <span className="transition group-open:rotate-180">
                    <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                  </span>
                </summary>
                <div className="text-stone-600 p-6 pt-2 border-t border-stone-100 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-stone-500">Still have questions?</p>
          <a href="#/connect" className="text-orange-600 font-bold hover:underline">Contact our Support Team</a>
        </div>
      </div>
    </div>
  );
};

export default Faqs;