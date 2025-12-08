
import React from 'react';
import { Temple, FlashUpdate, UserRole } from './types';

// Namaste (Anjali Mudra) Logo - Modern & Minimal
export const NamasteLogo = ({ className, color = "currentColor" }: { className?: string, color?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    {/* Left Hand Curve */}
    <path d="M50 85 C 30 80, 15 65, 15 45 C 15 25, 35 15, 50 10" />
    {/* Right Hand Curve */}
    <path d="M50 85 C 70 80, 85 65, 85 45 C 85 25, 65 15, 50 10" />
    {/* Middle Line (Joining) */}
    <path d="M50 15 L 50 75" strokeWidth="3" strokeOpacity="0.5" />
    {/* Spiritual Halo/Sun hint */}
    <circle cx="50" cy="45" r="25" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
  </svg>
);

// Robot Logo for AI Chatbot
export const RobotLogo = ({ className, color = "currentColor" }: { className?: string, color?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8.01" y2="16" />
    <line x1="16" y1="16" x2="16.01" y2="16" />
    <path d="M9 21v1a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-1" />
  </svg>
);

// Sudarshana Chakra Logo - The Golden Wheel of Dharma (Kept for reference/animations)
export const SudarshanaChakraLogo = ({ className, color = "currentColor" }: { className?: string, color?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" stroke="url(#goldGradient)" strokeWidth="4" />
    <circle cx="50" cy="50" r="40" stroke="#F59E0B" strokeWidth="1" strokeDasharray="1 3" />
    <g stroke="url(#goldGradient)" strokeWidth="3">
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
        <path key={i} d="M50 15 L50 40" transform={`rotate(${angle} 50 50)`} />
      ))}
    </g>
    <circle cx="50" cy="50" r="12" fill="#F59E0B" stroke="none" />
    <circle cx="50" cy="50" r="6" fill="#FFFBEB" stroke="none" />
    <g stroke="#F59E0B" strokeWidth="2">
       {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((angle, i) => (
         <path key={i} d="M50 2 L50 8" transform={`rotate(${angle} 50 50)`} />
       ))}
    </g>
  </svg>
);

// New Main Logo: Hindu Temple with Flag and Kalash
export const HinduTempleLogo = ({ className, color = "currentColor" }: { className?: string, color?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="divineGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#fdba74" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#fdba74" stopOpacity="0" />
      </radialGradient>
    </defs>
    
    {/* Soft Divine Glow */}
    <circle cx="50" cy="60" r="40" fill="url(#divineGlow)" />

    {/* Mandapa (Hall) - Lower structure in front */}
    <path d="M15 85 L 85 85 L 80 80 H 20 L 15 85 Z" fill="#57534e" /> {/* Base */}
    
    <path d="M25 80 V 65 L 40 55 L 55 65 V 80 H 25 Z" fill="#d6d3d1" stroke="#a8a29e" strokeWidth="1" /> {/* Hall Body */}
    <path d="M25 65 L 40 55 L 55 65" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="1" /> {/* Hall Roof */}

    {/* Shikhara (Spire) - Taller structure behind */}
    <path d="M45 80 V 50 L 55 20 L 65 50 V 80 H 45 Z" fill="#d6d3d1" stroke="#a8a29e" strokeWidth="1" />
    
    {/* Layered Details on Shikhara */}
    <path d="M48 65 H 62" stroke="#a8a29e" strokeWidth="1.5" />
    <path d="M50 55 H 60" stroke="#a8a29e" strokeWidth="1.5" />
    <path d="M52 45 H 58" stroke="#a8a29e" strokeWidth="1.5" />
    <path d="M53 35 H 57" stroke="#a8a29e" strokeWidth="1.5" />

    {/* Kalash (Golden Pot) */}
    <circle cx="55" cy="18" r="3.5" fill="#fbbf24" stroke="#b45309" strokeWidth="0.5" />
    <path d="M55 14.5 V 10" stroke="#b45309" strokeWidth="1" />

    {/* Saffron Flag (Waving) */}
    <path d="M55 10 L 55 2" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" /> {/* Pole */}
    <path d="M55 2 C 65 0, 75 8, 85 4 L 55 10 V 2 Z" fill="#f97316" stroke="#c2410c" strokeWidth="0.5" /> {/* Flag */}
  </svg>
);

// Alias BowArrowLogo to HinduTempleLogo for backward compatibility across pages
export const BowArrowLogo = HinduTempleLogo;

// The main Logo Export used throughout the app (Navbar)
export const LOGO = (
  <div className="relative w-12 h-12 flex items-center justify-center bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl shadow-lg border border-white/20 overflow-hidden group">
    <div className="absolute inset-0 bg-yellow-400 opacity-20 group-hover:opacity-30 transition-opacity"></div>
    <HinduTempleLogo className="w-10 h-10 text-white drop-shadow-md" />
  </div>
);

// External Shop Link
export const SHOPPING_URL = "https://www.myshopify.com/temple-ayurveda";
