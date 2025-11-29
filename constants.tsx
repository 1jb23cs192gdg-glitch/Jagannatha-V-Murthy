import React from 'react';
import { Temple, FlashUpdate, UserRole } from './types';

// Bow and Arrow SVG Logo Component - Primary Brand Asset
export const BowArrowLogo = ({ className, color = "currentColor" }: { className?: string, color?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    {/* The Bow */}
    <path d="M20 20 C 5 50, 5 50, 20 80" />
    <path d="M20 20 L 20 80" strokeWidth="2" strokeDasharray="4 2" className="opacity-50" />
    {/* The Arrow */}
    <path d="M15 50 L 90 50" />
    <path d="M80 40 L 90 50 L 80 60" />
    {/* Fletching */}
    <path d="M20 50 L 10 40" />
    <path d="M20 50 L 10 60" />
  </svg>
);

// The main Logo Export used throughout the app
export const LOGO = (
  <div className="relative w-12 h-12 flex items-center justify-center bg-orange-600 rounded-full shadow-lg border-2 border-white">
    <BowArrowLogo className="w-8 h-8" color="white" />
  </div>
);

export const MOCK_TEMPLES: Temple[] = [
  {
    id: 't1',
    name: 'Shri Kashi Vishwanath',
    location: 'Varanasi',
    wasteDonatedKg: 12500,
    greenStars: 5,
    imageUrl: 'https://images.unsplash.com/photo-1561587428-f646d5810006?auto=format&fit=crop&q=80&w=800',
    description: 'Leading the initiative with 100% waste segregation.',
    ngoId: 'n1'
  },
  {
    id: 't2',
    name: 'Tirumala Tirupati',
    location: 'Tirupati',
    wasteDonatedKg: 45000,
    greenStars: 5,
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f5feee?auto=format&fit=crop&q=80&w=800',
    description: 'Massive scale bio-gas production from offerings.',
    ngoId: 'n2'
  },
  {
    id: 't3',
    name: 'Somnath Temple',
    location: 'Gujarat',
    wasteDonatedKg: 8900,
    greenStars: 4,
    imageUrl: 'https://images.unsplash.com/photo-1598889982431-755f84877f86?auto=format&fit=crop&q=80&w=800',
    description: 'Dedicated to marine conservation through waste management.',
    ngoId: 'n1'
  },
  {
    id: 't4',
    name: 'Meenakshi Amman',
    location: 'Madurai',
    wasteDonatedKg: 15600,
    greenStars: 5,
    imageUrl: 'https://images.unsplash.com/photo-1621831535780-877790b8f276?auto=format&fit=crop&q=80&w=800',
    description: 'Transforming flower waste into incense.',
    ngoId: 'n2'
  },
];

export const MOCK_UPDATES: FlashUpdate[] = [
  {
    id: 'u1',
    title: 'New Recycling Plant',
    content: 'We have inaugurated a new flower processing unit in Varanasi.',
    date: '2023-10-25',
    type: 'MILESTONE'
  },
  {
    id: 'u2',
    title: 'Plastic Ban',
    content: 'All partner temples have achieved 100% single-use plastic free status.',
    date: '2023-10-20',
    type: 'ALERT'
  },
  {
    id: 'u3',
    title: 'Green Coins Bonus',
    content: 'Double Green Coins for household donations this Diwali!',
    date: '2023-10-15',
    type: 'NEWS'
  }
];

// External Shop Link
export const SHOPPING_URL = "https://www.myshopify.com/temple-ayurveda";