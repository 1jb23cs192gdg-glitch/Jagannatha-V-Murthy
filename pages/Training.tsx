
import React, { useState } from 'react';

interface ProductTraining {
  id: string;
  title: string;
  description: string;
  rawMaterials: string[];
  steps: {
    title: string;
    detail: string;
  }[];
  images: {
    raw: string;
    process: string;
    final: string;
  };
  safety: string[];
  benefits: string[];
}

const PRODUCTS: ProductTraining[] = [
  {
    id: 'incense',
    title: 'Incense Sticks (Agarbatti)',
    description: 'Transforming sacred flower waste into chemical-free, aromatic incense sticks.',
    rawMaterials: ['Dried Flower Petals (Rose, Marigold)', 'Charcoal Powder', 'Jigat Powder (Binding Agent)', 'Natural Essential Oils', 'Bamboo Sticks'],
    steps: [
      { title: 'Collection & Segregation', detail: 'Separate flowers from other waste like plastic, cloth, and paper. Remove stems and sepals.' },
      { title: 'Drying', detail: 'Spread petals on drying racks under the sun for 2-3 days until crisp and moisture-free.' },
      { title: 'Powdering', detail: 'Grind the dried petals into a fine powder using a pulverizer machine.' },
      { title: 'Dough Preparation', detail: 'Mix flower powder, charcoal powder, and Jigat powder with water to form a firm dough.' },
      { title: 'Rolling', detail: 'Roll the dough onto bamboo sticks manually or using a rolling machine.' },
      { title: 'Drying (Shade)', detail: 'Dry the raw sticks in shade for 24-48 hours. Avoid direct sun to prevent cracking.' },
      { title: 'Fragrance Dipping', detail: 'Dip the dried sticks into natural essential oil blends (like Sandalwood or Rose) diluted with DEP.' },
      { title: 'Final Drying & Packaging', detail: 'Air dry for 4-6 hours to set the fragrance, then pack in eco-friendly boxes.' }
    ],
    images: {
      raw: 'https://images.unsplash.com/photo-1596436096508-466c3022467d?q=80&w=800&auto=format&fit=crop',
      process: 'https://images.unsplash.com/photo-1608555855762-d999059062e1?q=80&w=800&auto=format&fit=crop',
      final: 'https://images.unsplash.com/photo-1523983252926-7d9aa99507a2?q=80&w=800&auto=format&fit=crop'
    },
    safety: ['Wear masks during powdering to avoid inhaling dust.', 'Use gloves while handling essential oils.', 'Ensure proper ventilation in the dipping area.'],
    benefits: ['Reduces river pollution.', 'Provides livelihood to women SHGs.', 'Chemical-free and safe for indoor use.']
  },
  {
    id: 'oil',
    title: 'Essential Oils',
    description: 'Extracting pure, high-value oils from temple flowers like Rose and Jasmine.',
    rawMaterials: ['Fresh Flowers (Rose, Jasmine, Mogra)', 'Distilled Water', 'Steam Distillation Unit'],
    steps: [
      { title: 'Fresh Collection', detail: 'Collect flowers immediately after offerings. Oils are best extracted from fresh blooms.' },
      { title: 'Cleaning', detail: 'Wash petals gently to remove dust and impurities without damaging oil glands.' },
      { title: 'Loading Distillation Unit', detail: 'Place petals in the distillation chamber. Fill the boiler with water.' },
      { title: 'Steam Distillation', detail: 'Heat generates steam which passes through petals, carrying oil vapor with it.' },
      { title: 'Condensation', detail: 'Vapor passes through a cooling tube (condenser) and turns back into liquid.' },
      { title: 'Separation', detail: 'The liquid is collected in a separator. Oil floats on top of the hydrosol (floral water).' },
      { title: 'Filtering & Bottling', detail: 'Skim off the oil, filter impurities, and store in dark amber bottles.' }
    ],
    images: {
      raw: 'https://images.unsplash.com/photo-1496857239036-1fb137683000?q=80&w=800&auto=format&fit=crop',
      process: 'https://images.unsplash.com/photo-1555633514-abce6637170f?q=80&w=800&auto=format&fit=crop',
      final: 'https://images.unsplash.com/photo-1608571423902-eed4a5e84e43?q=80&w=800&auto=format&fit=crop'
    },
    safety: ['Maintain pressure gauge checks on distillation unit.', 'Use heat-resistant gloves.', 'Store oils away from direct heat.'],
    benefits: ['High economic value product.', 'Uses fresh waste immediately.', 'Hydrosol by-product is used as toner.']
  },
  {
    id: 'bowls',
    title: 'Coconut Shell Bowls',
    description: 'Upcycling discarded coconut shells into durable, aesthetic cutlery.',
    rawMaterials: ['Discarded Coconut Shells', 'Sandpaper (various grits)', 'Coconut Oil/Linseed Oil'],
    steps: [
      { title: 'Selection & Cleaning', detail: 'Select mature, hard shells. Remove the husk fibers completely.' },
      { title: 'Cutting & Shaping', detail: 'Cut the top edge evenly using a hacksaw to create a bowl shape.' },
      { title: 'Sanding (Exterior)', detail: 'Sand the outer surface starting with coarse grit (80) to fine grit (320) until smooth.' },
      { title: 'Sanding (Interior)', detail: 'Scrape out the meat residue and sand the interior until smooth.' },
      { title: 'Polishing', detail: 'Apply generous coats of virgin coconut oil. The shell absorbs it and turns dark and shiny.' },
      { title: 'Curing', detail: 'Let the oil set for 24 hours. Repeat polishing for better waterproofing.' },
      { title: 'Quality Check', detail: 'Ensure no cracks or leaks. Test with warm water.' }
    ],
    images: {
      raw: 'https://images.unsplash.com/photo-1620377038938-2a2491b689a7?q=80&w=800&auto=format&fit=crop',
      process: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=800&auto=format&fit=crop',
      final: 'https://images.unsplash.com/photo-1623944889288-cd6a927a37e2?q=80&w=800&auto=format&fit=crop'
    },
    safety: ['Use dust masks while sanding.', 'Be careful with cutting tools.', 'Ensure shells are food-safe clean.'],
    benefits: ['Replaces plastic bowls.', 'Biodegradable and durable.', 'Zero waste process.']
  },
  {
    id: 'fertilizer',
    title: 'Bio Fertilizer (Vermicompost)',
    description: 'Turning organic temple waste into gold for the soil.',
    rawMaterials: ['Flower Waste', 'Fruit Peels', 'Cow Dung', 'Dry Leaves', 'Earthworms (Red Wigglers)'],
    steps: [
      { title: 'Shredding', detail: 'Chop flowers and organic waste into small pieces to speed up decomposition.' },
      { title: 'Pre-composting', detail: 'Mix waste with cow dung slurry and let it partially decompose for 10-15 days to reduce heat.' },
      { title: 'Bed Preparation', detail: 'Prepare a bed with a layer of dry leaves/cardboard at the bottom.' },
      { title: 'Layering', detail: 'Add the pre-composted waste mixture to the bed.' },
      { title: 'Introducing Worms', detail: 'Release earthworms into the bed. Cover with gunny bags to maintain darkness and moisture.' },
      { title: 'Maintenance', detail: 'Sprinkle water daily. Turn the pile once a week for aeration.' },
      { title: 'Harvesting', detail: 'After 45-60 days, the waste turns into granular black compost. Separate worms and sieve.' }
    ],
    images: {
      raw: 'https://images.unsplash.com/photo-1581578017093-cd30fba4e9d5?q=80&w=800&auto=format&fit=crop',
      process: 'https://images.unsplash.com/photo-1616172579339-44e2776c243a?q=80&w=800&auto=format&fit=crop',
      final: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800&auto=format&fit=crop'
    },
    safety: ['Wash hands thoroughly after handling compost.', 'Keep the pit away from direct sunlight.', 'Ensure drainage to avoid waterlogging.'],
    benefits: ['Enriches soil nutrients.', 'Reduces landfill methane emissions.', 'Low-cost setup.']
  },
  {
    id: 'colours',
    title: 'Organic Colours (Gulaal)',
    description: 'Skin-friendly Holi colours made from dried flower petals.',
    rawMaterials: ['Hibiscus/Rose (Red)', 'Marigold (Yellow)', 'Beetroot', 'Turmeric', 'Gram Flour/Cornstarch'],
    steps: [
      { title: 'Sorting by Colour', detail: 'Segregate flowers strictly by colour (e.g., all yellow marigolds together).' },
      { title: 'Drying', detail: 'Sun dry the petals until they are completely moisture-free and brittle.' },
      { title: 'Grinding', detail: 'Grind the dried petals into a very fine powder.' },
      { title: 'Base Mixing', detail: 'Mix the flower powder with a base like Cornstarch or Gram Flour in a 1:2 ratio.' },
      { title: 'Sieving', detail: 'Pass the mixture through a fine mesh sieve to ensure a smooth, soft texture.' },
      { title: 'Fragrance (Optional)', detail: 'Add a few drops of essential oil for fragrance.' },
      { title: 'Packaging', detail: 'Pack in air-tight containers to prevent moisture absorption.' }
    ],
    images: {
      raw: 'https://images.unsplash.com/photo-1563276632-132d3999903e?q=80&w=800&auto=format&fit=crop',
      process: 'https://images.unsplash.com/photo-1596468138863-718227a92265?q=80&w=800&auto=format&fit=crop',
      final: 'https://images.unsplash.com/photo-1615967168700-0e972e79fa4d?q=80&w=800&auto=format&fit=crop'
    },
    safety: ['Use food-grade bases only.', 'Avoid chemical additives.', 'Wear masks during sieving.'],
    benefits: ['Prevents skin allergies.', 'Uses massive volume of flower waste.', 'Safe for children.']
  }
];

const Training = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative py-20 bg-stone-900 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1589252329383-7c9c0dc2c938?auto=format&fit=crop&q=80&w=2070" 
            alt="Training Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/80 to-transparent"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Skill Development & Training</h1>
          <p className="text-xl text-stone-300 max-w-3xl mx-auto">
            Empowering communities with the knowledge to transform sacred waste into sustainable wealth. 
            Learn the art of eco-manufacturing.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid gap-12">
          {PRODUCTS.map((product) => (
            <div 
              key={product.id} 
              id={product.id}
              className={`bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-xl border border-stone-100 dark:border-slate-700 transition-all duration-500 ${expandedId === product.id ? 'ring-4 ring-orange-100 dark:ring-orange-900/30' : ''}`}
            >
              <div 
                className="p-8 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
              >
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-stone-800 dark:text-white mb-2">{product.title}</h2>
                  <p className="text-stone-600 dark:text-stone-300 text-lg">{product.description}</p>
                </div>
                <button className="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-6 py-2 rounded-full font-bold text-sm hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-colors">
                  {expandedId === product.id ? 'Hide Details' : 'View Process'}
                </button>
              </div>

              {expandedId === product.id && (
                <div className="p-8 border-t border-stone-100 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/50 animate-fade-in">
                  
                  {/* Raw Materials */}
                  <div className="mb-10">
                    <h3 className="text-xl font-bold text-stone-700 dark:text-stone-200 mb-4 flex items-center gap-2">
                      <span>🌿</span> Raw Materials Required
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {product.rawMaterials.map((mat, i) => (
                        <span key={i} className="bg-white dark:bg-slate-700 border border-stone-200 dark:border-slate-600 px-4 py-2 rounded-lg text-stone-600 dark:text-stone-300 text-sm font-medium shadow-sm">
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Manufacturing Steps */}
                  <div className="mb-12">
                    <h3 className="text-xl font-bold text-stone-700 dark:text-stone-200 mb-6 flex items-center gap-2">
                      <span>⚙️</span> Manufacturing Process
                    </h3>
                    <div className="relative border-l-4 border-orange-200 dark:border-orange-900 ml-4 space-y-8">
                      {product.steps.map((step, idx) => (
                        <div key={idx} className="relative pl-8">
                          <div className="absolute -left-[11px] top-1 w-5 h-5 bg-orange-500 rounded-full border-4 border-white dark:border-slate-800"></div>
                          <h4 className="text-lg font-bold text-stone-800 dark:text-white mb-1">Step {idx + 1}: {step.title}</h4>
                          <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{step.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual Guide */}
                  <div className="mb-12">
                    <h3 className="text-xl font-bold text-stone-700 dark:text-stone-200 mb-6 flex items-center gap-2">
                      <span>📸</span> Visual Guide
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="group relative rounded-xl overflow-hidden shadow-md h-64">
                        <img src={product.images.raw} alt="Raw Material" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-3 text-white text-center font-bold">Raw Stage</div>
                      </div>
                      <div className="group relative rounded-xl overflow-hidden shadow-md h-64">
                        <img src={product.images.process} alt="Processing" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-3 text-white text-center font-bold">Processing</div>
                      </div>
                      <div className="group relative rounded-xl overflow-hidden shadow-md h-64">
                        <img src={product.images.final} alt="Final Product" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 p-3 text-white text-center font-bold">Final Product</div>
                      </div>
                    </div>
                  </div>

                  {/* Safety & Benefits Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
                      <h3 className="font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">🛡️ Safety & Hygiene</h3>
                      <ul className="space-y-2">
                        {product.safety.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-stone-700 dark:text-stone-300 text-sm">
                            <span className="text-red-500">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-900/30">
                      <h3 className="font-bold text-green-800 dark:text-green-400 mb-4 flex items-center gap-2">🌍 Environmental Impact</h3>
                      <ul className="space-y-2">
                        {product.benefits.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-stone-700 dark:text-stone-300 text-sm">
                            <span className="text-green-500">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Training;
