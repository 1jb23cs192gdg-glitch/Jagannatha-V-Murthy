
export enum UserRole {
  ADMIN = 'ADMIN',
  TEMPLE = 'TEMPLE',
  NGO = 'NGO', // New NGO Role
  DRYING_UNIT = 'DRYING_UNIT', // Old NGO Role renamed
  PERSON = 'PERSON',
  GUEST = 'GUEST'
}

export interface TeamMember {
  id: string;
  name: string;
  role: string; 
  contact: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  type: 'REWARD' | 'ALERT' | 'UPDATE' | 'QUERY';
}

export interface CMSContent {
  id: string;
  title: string;
  content: string; 
  category: 'BLOG' | 'TIP' | 'ANNOUNCEMENT';
  author: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  greenCoins?: number; 
  greenStars?: number; 
  assignedTempleIds?: string[]; 
  isVolunteer?: boolean; 
  volunteerStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  assignedTempleId?: string; 
  badges?: string[]; 
  carbonSaved?: number;
  address?: string;
  contact?: string;
  spocName?: string; 
  isDisabled?: boolean; 
  assignedNgoId?: string; // For Admin Allocation (User -> NGO or DU -> NGO)
  assignedDuId?: string; // New: User -> Drying Unit
  imageUrl?: string;
  waste_donated_kg?: number;
  district?: string; // New for Allocation
  taluk?: string; // New for Allocation
}

export interface Temple {
  id: string;
  name: string;
  location: string;
  wasteDonatedKg: number;
  greenStars: number;
  imageUrl: string;
  description: string;
  ngoId?: string; // Can be assigned to NGO or DU
  duId?: string; // New: Assigned Drying Unit
  team?: TeamMember[];
  spocDetails?: TeamMember; 
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
  audience?: 'PUBLIC' | 'TEMPLE' | 'NGO' | 'DRYING_UNIT' | 'USER' | 'ALL' | string;
}

export interface PickupRequest {
  id: string;
  requester_id: string; 
  requester_type: 'TEMPLE' | 'USER';
  ngo_id: string; // This handles ID for both NGO and Drying Unit based on role
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'LOADED' | 'COMPLETED' | 'REJECTED';
  scheduled_date: string;
  time_slot?: string; 
  remarks?: string; 
  estimated_weight: number;
  waste_type: string;
  actual_weight?: number; 
  coins_issued?: number;
  driver_name?: string; 
  vehicle_no?: string; 
  address?: string; 
  rejection_reason?: string;
  image_url?: string;
  created_at: string;
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
  ngo_id?: string; // Owner ID (can be DU)
  name: string;
  stock: number;
  price_coins: number;
  last_updated?: string;
}

export interface StockRequest {
  id: string;
  ngo_id: string; // Requester
  du_id: string; // Provider (Drying Unit)
  item_name: string;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface Vehicle {
  id: string;
  ngo_id: string;
  driver_name: string;
  vehicle_no: string;
  status: 'IDLE' | 'EN_ROUTE' | 'LOADING' | 'MAINTENANCE';
  current_location?: string;
  destination?: string;
}

export interface QueryTicket {
  id: string;
  from_id: string;
  to_id: string; // NGO ID, DU ID or 'ADMIN'
  sender_role?: string;
  sender_email?: string;
  sender_name?: string;
  subject: string;
  message: string;
  response?: string;
  status: 'OPEN' | 'CLOSED';
  created_at: string;
}

export interface Rating {
  id: string;
  from_id: string;
  to_id: string;
  rating: number; // 1-5
  reason: string;
  created_at: string;
}

export interface AppSettings {
  id: string;
  coin_rate: number; 
}

export interface VolunteerRequest {
  id: string;
  user_id: string;
  full_name: string;
  contact: string;
  taluk: string;
  district: string;
  state: string;
  id_proof_url: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  // Assignment Fields
  assigned_du_id?: string;
  assignment_status?: 'NONE' | 'PENDING_DU_APPROVAL' | 'ACCEPTED' | 'REJECTED_BY_DU';
  rejection_reason?: string;
}

export interface VolunteerDuty {
  id: string;
  volunteer_id: string;
  du_id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
}
