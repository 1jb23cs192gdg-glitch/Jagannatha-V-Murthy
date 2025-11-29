export enum UserRole {
  ADMIN = 'ADMIN',
  TEMPLE = 'TEMPLE',
  NGO = 'NGO',
  PERSON = 'PERSON',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  greenCoins?: number; // For Person
  greenStars?: number; // For Temple
  assignedTempleIds?: string[]; // For NGO
  isVolunteer?: boolean; // For Person
  volunteerStatus?: 'NONE' | 'PENDING' | 'APPROVED';
  assignedTempleId?: string; // For Volunteer
}

export interface Temple {
  id: string;
  name: string;
  location: string;
  wasteDonatedKg: number;
  greenStars: number;
  imageUrl: string;
  description: string;
  ngoId?: string;
}

export interface FlashUpdate {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'NEWS' | 'ALERT' | 'MILESTONE' | 'VIDEO_CONFIG';
}

export interface WasteRecord {
  id: string;
  date: string;
  amountKg: number;
  type: string; // e.g., "Flower", "Coconut"
  source: string;
}