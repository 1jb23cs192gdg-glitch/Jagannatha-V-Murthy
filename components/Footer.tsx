import React from 'react';
import { BowArrowLogo } from '../constants';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 py-16 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-stone-800 rounded-full border border-stone-700">
               <BowArrowLogo className="w-8 h-8" color="#ea580c" />
             </div>
             <h3 className="text-2xl font-bold text-white tracking-tight">Temple<span className="text-orange-500">2</span>Ayurveda</h3>
          </div>
          <p className="text-sm leading-relaxed text-stone-400">
            Bridging divinity and sustainability through technology and devotion. An Atmanirbhar Bharat Initiative transforming waste into wealth.
          </p>
          <div className="flex gap-4">
            {/* Social Icons Placeholder */}
            <div className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors cursor-pointer">𝕏</div>
            <div className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors cursor-pointer">in</div>
            <div className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center hover:bg-orange-600 hover:text-white transition-colors cursor-pointer">📸</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold text-white mb-6 text-lg">Quick Links</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/" className="hover:text-orange-500 transition-colors flex items-center gap-2"><span>›</span> Home</Link></li>
            <li><Link to="/about" className="hover:text-orange-500 transition-colors flex items-center gap-2"><span>›</span> About Project</Link></li>
            <li><Link to="/shop" className="hover:text-orange-500 transition-colors flex items-center gap-2"><span>›</span> Eco-Products</Link></li>
            <li><Link to="/rankings" className="hover:text-orange-500 transition-colors flex items-center gap-2"><span>›</span> Temple Rankings</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-white mb-6 text-lg">Support</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/guidelines" className="hover:text-orange-500 transition-colors flex items-center gap-2"><span>›</span> How it Works</Link></li>
            <li><Link to="/faqs" className="hover:text-orange-500 transition-colors flex items-center gap-2"><span>›</span> FAQs</Link></li>
            <li><Link to="/connect" className="hover:text-orange-500 transition-colors flex items-center gap-2"><span>›</span> Contact Us</Link></li>
            <li><Link to="/login" className="hover:text-orange-500 transition-colors flex items-center gap-2"><span>›</span> Volunteer Login</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-white mb-6 text-lg">Contact</h4>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-lg">📞</span>
              <div>
                <span className="block text-stone-500 text-xs uppercase">Helpline</span>
                <span className="text-white">1800-TEMPLE-00</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg">📧</span>
              <div>
                <span className="block text-stone-500 text-xs uppercase">Email</span>
                <span className="text-white">connect@temple2ayurveda.in</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-lg">📍</span>
              <div>
                <span className="block text-stone-500 text-xs uppercase">HQ</span>
                <span className="text-white">SIH Innovation Center,<br/>New Delhi, India</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-stone-800 mt-12 pt-8 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
           <p>&copy; 2025 Temple to Ayurveda. All Rights Reserved. Inspired by SIH 2025.</p>
           <div className="flex gap-6">
             <a href="#" className="hover:text-white">Privacy Policy</a>
             <a href="#" className="hover:text-white">Terms of Service</a>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;