import React from 'react';
import { SHOPPING_URL } from '../constants';

const PRODUCTS = [
  {
    id: 1,
    name: "Nirmalya Incense Sticks",
    description: "Hand-rolled from recycled temple flowers. Charcoal-free & chemical-free.",
    price: 150,
    coins: 50,
    image: "https://images.unsplash.com/photo-1608649852336-7c98e25d481f?q=80&w=600&auto=format&fit=crop",
    tag: "Bestseller"
  },
  {
    id: 2,
    name: "Organic Vermicompost",
    description: "Nutrient-rich soil booster made from ritual organic waste and flowers.",
    price: 300,
    coins: 100,
    image: "https://images.unsplash.com/photo-1622383563227-0440114f6869?q=80&w=600&auto=format&fit=crop",
    tag: "Gardening"
  },
  {
    id: 3,
    name: "Coconut Shell Bowl",
    description: "Eco-friendly polished bowls made from offered coconuts.",
    price: 250,
    coins: 80,
    image: "https://images.unsplash.com/photo-1616409890479-78ae810c9d72?q=80&w=600&auto=format&fit=crop",
    tag: "Handicraft"
  },
  {
    id: 4,
    name: "Bio-Enzyme Cleaner",
    description: "Natural citrus cleaner made from fruit offerings. Pet safe.",
    price: 180,
    coins: 60,
    image: "https://images.unsplash.com/photo-1585832770485-e68a5db8e155?q=80&w=600&auto=format&fit=crop",
    tag: "Home Care"
  },
  {
    id: 5,
    name: "Upcycled Cloth Bag",
    description: "Stitched by women SHGs using clean temple fabrics.",
    price: 100,
    coins: 30,
    image: "https://images.unsplash.com/photo-1597484661643-2f6f3320387c?q=80&w=600&auto=format&fit=crop",
    tag: "Fashion"
  },
  {
    id: 6,
    name: "Temple Holi Colors",
    description: "100% natural herbal colors extracted from flower petals.",
    price: 400,
    coins: 150,
    image: "https://images.unsplash.com/photo-1615926578988-c8753239c878?q=80&w=600&auto=format&fit=crop",
    tag: "Festive"
  }
];

const Shop = () => {
  const handleBuy = (productName: string) => {
    alert(`Added ${productName} to cart! Proceed to checkout to redeem coins.`);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* External Link Highlight Banner */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 mb-12 text-center text-white shadow-xl relative overflow-hidden">
           <div className="relative z-10">
             <h2 className="text-3xl font-bold mb-4">Official Eco-Product Store</h2>
             <p className="text-orange-100 mb-8 max-w-2xl mx-auto text-lg">
               Browse our full catalog of Ayurvedic medicines, sustainable temple products, and bulk orders on our dedicated partner website.
             </p>
             <a 
               href={SHOPPING_URL}
               target="_blank"
               rel="noreferrer"
               className="bg-white text-orange-700 px-10 py-4 rounded-full font-bold hover:bg-orange-50 inline-block shadow-lg transform hover:scale-105 transition-all text-lg"
             >
               Start Shopping Now ↗
             </a>
           </div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-800 mb-1">Redeem Green Coins</h1>
            <p className="text-stone-600 text-sm">Use your earned credits for exclusive discounts.</p>
          </div>
          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold border border-green-200 flex items-center">
             Your Balance: 0 Coins
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {PRODUCTS.map(product => (
            <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 hover:shadow-xl transition-shadow group">
              <div className="relative h-64 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur text-stone-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.tag}
                </span>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-stone-800">{product.name}</h3>
                </div>
                <p className="text-stone-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <div>
                    <span className="block text-lg font-bold text-stone-800">₹{product.price}</span>
                    <span className="text-xs text-orange-600 font-bold">OR {product.coins} Coins</span>
                  </div>
                  <button 
                    onClick={() => handleBuy(product.name)}
                    className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors"
                  >
                    Redeem
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Shop;