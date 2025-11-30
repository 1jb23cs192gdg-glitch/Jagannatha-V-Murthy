
export enum UserRole {
  ADMIN = 'ADMIN',
  TEMPLE = 'TEMPLE',
  NGO = 'NGO',
  PERSON = 'PERSON',
  GUEST = 'GUEST'
}

export interface TeamMember {
  id: string;
  name: string;
  role: string; // e.g., SPOC, Manager
  contact: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type: 'REWARD' | 'ALERT' | 'UPDATE';
}

export interface CMSContent {
  id: string;
  title: string;
  content: string; // HTML or Text
  category: 'BLOG' | 'TIP' | 'ANNOUNCEMENT';
  author: string;
  created_at: string;
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
  badges?: string[]; // For Person
  carbonSaved?: number;
  address?: string;
  contact?: string;
  spocName?: string; // For Temple SPOC
  isDisabled?: boolean; // New field for account status
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
  team?: TeamMember[];
  spocDetails?: TeamMember; // Specific SPOC for Rankings
  address?: string;
  timings?: string;
  owner_id?: string;
}

export interface TemplePhoto {
  id: string;
  temple_id: string;
  image_url: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface FlashUpdate {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'NEWS' | 'ALERT' | 'MILESTONE' | 'VIDEO_CONFIG';
  audience?: 'PUBLIC' | 'TEMPLE' | 'NGO' | 'USER' | 'ALL';
}

export interface WasteRecord {
  id: string;
  date: string;
  amountKg: number;
  type: string; // e.g., "Flower", "Coconut"
  source: string;
}

export interface TempleWasteLog {
  id: string;
  temple_id: string;
  ngo_id: string;
  amount_kg: number;
  waste_type: string;
  collected_at: string;
  image_url?: string;
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED'; 
}

export interface PickupRequest {
  id: string;
  requester_id: string; // Temple or User ID
  requester_type: 'TEMPLE' | 'USER';
  ngo_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  scheduled_date: string;
  time_slot?: string; // New field
  remarks?: string; // New field
  estimated_weight: number;
  waste_type: string;
  actual_weight?: number; // Filled by NGO upon verification
  coins_issued?: number;
  driver_name?: string; // NGO Logic
  vehicle_no?: string; // NGO Logic
}

export interface Order {
  id: string;
  user_id: string;
  product_name: string;
  coins_spent: number;
  status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  ordered_at: string;
  tracking_id?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  price_coins: number;
}

export interface AppSettings {
  id: string;
  coin_rate: number; // Coins per KG
}
