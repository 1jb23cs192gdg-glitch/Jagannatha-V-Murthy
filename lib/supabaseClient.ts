
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  QueryConstraint
} from "firebase/firestore";
import { MOCK_TEMPLES, MOCK_UPDATES } from '../constants';

// ============================================================================
// FIREBASE CONFIGURATION (Temple to Ayurveda)
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyCT3L9GdohyiZH0KNbM8e73bc-nR6VHGrU",
  authDomain: "temple-ayurveda.firebaseapp.com",
  projectId: "temple-ayurveda",
  storageBucket: "temple-ayurveda.firebasestorage.app",
  messagingSenderId: "281417763762",
  appId: "1:281417763762:web:170ef8b3f04552d43e72ab",
  measurementId: "G-SH4TX2HEVQ"
};

// ============================================================================

// FORCE MOCK MODE
const isFirebaseConfigured = false; 

// ==========================================
// 1. MOCK ENGINE (Local Fallback)
// ==========================================
// Increment DB Key to v15 to inject new mock data structure
const DB_KEY = 'temple_ayurveda_db_v15_advanced';

const getLocalDB = () => {
  const dbStr = localStorage.getItem(DB_KEY);
  if (dbStr) return JSON.parse(dbStr);
  
  const initialDB = {
    users: [],
    profiles: [],
    temples: MOCK_TEMPLES.map(t => ({
      id: String(t.id),
      name: t.name,
      location: t.location,
      waste_donated_kg: t.wasteDonatedKg,
      green_stars: t.greenStars,
      image_url: t.imageUrl,
      description: t.description,
      ngo_id: t.ngoId,
      owner_id: 'mock_owner_' + t.id,
      team: [],
      address: 'Varanasi Main Road',
      timings: '06:00 AM - 09:00 PM',
      spocDetails: { id: 'spoc1', name: 'Pt. Sharma', role: 'Head Priest', contact: '9876543210' }
    })),
    flash_updates: MOCK_UPDATES.map(u => ({
      id: String(u.id),
      title: u.title,
      content: u.content,
      type: u.type,
      audience: u.audience || 'PUBLIC',
      created_at: new Date(u.date).toISOString()
    })),
    waste_logs: [], 
    temple_waste_logs: [], 
    service_requests: [],
    pickup_requests: [],
    orders: [
      { id: 'ord1', user_id: 'u1', product_name: 'Incense Pack', coins_spent: 50, status: 'DELIVERED', ordered_at: new Date().toISOString(), tracking_id: 'TRK123' }
    ],
    inventory: [
      { id: 'i1', name: 'Incense Sticks', stock: 50, price_coins: 50 },
      { id: 'i2', name: 'Vermicompost', stock: 30, price_coins: 100 },
      { id: 'i3', name: 'Pooja Oil', stock: 100, price_coins: 150 }
    ],
    cms_content: [
       { id: 'c1', title: 'Why Segregate?', content: 'Segregation at source ensures purity of products.', category: 'TIP', author: 'Admin', created_at: new Date().toISOString() },
       { id: 'c2', title: 'Upcoming Festival Guidelines', content: 'Special bins will be placed for Maha Shivratri.', category: 'ANNOUNCEMENT', author: 'Admin', created_at: new Date().toISOString() }
    ],
    notifications: [],
    temple_photos: [
      { id: 'p1', temple_id: 't1', image_url: 'https://images.unsplash.com/photo-1542397284385-6010376c5337?q=80&w=400', description: 'Morning Flower Collection', status: 'PENDING', created_at: new Date().toISOString() },
      { id: 'p2', temple_id: 't1', image_url: 'https://images.unsplash.com/photo-1623941008538-46a23940170a?q=80&w=400', description: 'Waste Segregation Drive', status: 'PENDING', created_at: new Date().toISOString() }
    ],
    app_settings: [
      { id: 'config', coin_rate: 10 } // 10 coins per KG default
    ],
    site_config: []
  };
  localStorage.setItem(DB_KEY, JSON.stringify(initialDB));
  return initialDB;
};

const saveLocalDB = (db: any) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// ==========================================
// 2. FIREBASE ADAPTER
// ==========================================

class FirebaseAdapter {
  auth: any;
  private db: any;

  constructor() {
    // Only init if actually used
    try {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        this.db = getFirestore(app);
    
        this.auth = {
          signUp: async ({ email, password, options }: any) => {
            try {
              const res = await createUserWithEmailAndPassword(authInstance, email, password);
              return { data: { user: res.user, session: { user: res.user } }, error: null };
            } catch (error: any) {
              return { data: { user: null, session: null }, error };
            }
          },
          signInWithPassword: async ({ email, password }: any) => {
            try {
              const res = await signInWithEmailAndPassword(authInstance, email, password);
              return { data: { user: res.user, session: { user: res.user } }, error: null };
            } catch (error: any) {
              return { data: { user: null, session: null }, error };
            }
          },
          signOut: async () => {
            try {
              await signOut(authInstance);
              return { error: null };
            } catch (error: any) {
              return { error };
            }
          },
          getUser: async () => {
            const user = authInstance.currentUser;
            return { data: { user }, error: null };
          },
          onAuthStateChange: (callback: any) => {
            const unsubscribe = onAuthStateChanged(authInstance, (user) => {
              callback('SIGNED_IN', { user });
            });
            return { data: { subscription: { unsubscribe } } };
          }
        };
    } catch (e) {
        console.warn("Firebase failed to init in adapter", e);
    }
  }

  from(table: string) {
    return new FirebaseQueryBuilder(this.db, table);
  }
}

class FirebaseQueryBuilder {
  private db: any;
  private table: string;
  private constraints: any[] = [];
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any = null;
  private isSingle = false;

  constructor(db: any, table: string) {
    this.db = db;
    this.table = table;
  }

  select(columns?: string, options?: any) {
    this.op = 'select';
    return this;
  }

  eq(column: string, value: any) {
    this.constraints.push(where(column, '==', value));
    return this;
  }
  
  neq(column: string, value: any) {
    this.constraints.push(where(column, '!=', value));
    return this;
  }

  order(column: string, { ascending = true }: any = {}) {
    this.constraints.push(orderBy(column, ascending ? 'asc' : 'desc'));
    return this;
  }

  limit(count: number) {
    this.constraints.push(limit(count));
    return this;
  }

  single() {
    this.isSingle = true;
    this.constraints.push(limit(1));
    return this;
  }

  insert(data: any) {
    this.op = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.op = 'update';
    this.payload = data;
    return this;
  }

  upsert(data: any) {
    this.op = 'upsert';
    this.payload = data;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  async then(resolve: any, reject: any) {
    if(!this.db) { resolve({ data: null, error: { message: "No DB Connection" } }); return; }
    try {
      if (this.op === 'select') {
        const q = query(collection(this.db, this.table), ...this.constraints);
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (this.isSingle) {
          resolve({ data: data[0] || null, error: data.length ? null : { message: 'Not found' } });
        } else {
          resolve({ data, error: null });
        }
      } else if (this.op === 'insert' || this.op === 'upsert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const resData = [];
        for (const item of items) {
          if (item.id) {
             await setDoc(doc(this.db, this.table, item.id), item, { merge: this.op === 'upsert' });
             resData.push(item);
          } else {
             const ref = await addDoc(collection(this.db, this.table), item);
             resData.push({ ...item, id: ref.id });
          }
        }
        resolve({ data: resData, error: null });
      } else if (this.op === 'update') {
        const q = query(collection(this.db, this.table), ...this.constraints);
        const snapshot = await getDocs(q);
        const updates = snapshot.docs.map(d => updateDoc(doc(this.db, this.table, d.id), this.payload));
        await Promise.all(updates);
        resolve({ data: snapshot.docs.map(d => ({ ...d.data(), ...this.payload })), error: null });
      } else if (this.op === 'delete') {
        const q = query(collection(this.db, this.table), ...this.constraints);
        const snapshot = await getDocs(q);
        const deletions = snapshot.docs.map(d => deleteDoc(doc(this.db, this.table, d.id)));
        await Promise.all(deletions);
        resolve({ data: null, error: null });
      }
    } catch (error) {
      resolve({ data: null, error });
    }
  }
}

// ==========================================
// 3. MOCK SUPABASE CLIENT
// ==========================================

class MockSupabaseClient {
  auth = {
    signUp: async ({ email, password, options }: any) => {
      const db = getLocalDB();
      if (db.users.find((u: any) => u.email === email)) {
        return { data: { user: null, session: null }, error: { message: "User already exists (Mock)" } };
      }
      
      const newUser = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        email,
        password,
        user_metadata: options?.data || {}
      };
      
      db.users.push(newUser);
      // Initialize profile with is_disabled: false
      db.profiles.push({
        id: newUser.id,
        email: email,
        full_name: options?.data?.full_name || 'User',
        role: options?.data?.role || 'PERSON',
        is_disabled: false,
        created_at: new Date().toISOString()
      });

      saveLocalDB(db);
      
      return { 
        data: { user: newUser, session: { access_token: 'mock_token', user: newUser } }, 
        error: null 
      };
    },
    signInWithPassword: async ({ email, password }: any) => {
      const db = getLocalDB();
      const user = db.users.find((u: any) => u.email === email && u.password === password);
      
      if (!user) {
        return { data: { user: null, session: null }, error: { message: "Invalid login credentials (Mock)" } };
      }

      // Check if disabled
      const profile = db.profiles.find((p: any) => p.id === user.id);
      if (profile && profile.is_disabled) {
        return { data: { user: null, session: null }, error: { message: "Your account has been disabled by the admin. Please contact support." } };
      }
      
      return { 
        data: { user, session: { access_token: 'mock_token', user } }, 
        error: null 
      };
    },
    signOut: async () => {
      return { error: null };
    },
    getUser: async () => {
      const sessionStr = localStorage.getItem('temple_mock_session');
      if (sessionStr) {
         return { data: { user: JSON.parse(sessionStr) }, error: null };
      }
      return { data: { user: null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  };

  from(table: string) {
    return new MockQueryBuilder(table);
  }
}

class MockQueryBuilder {
  table: string;
  filters: any[] = [];
  _order: any = null;
  _limit: number | null = null;
  _single: boolean = false;
  
  _operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  _payload: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*', options?: any) {
    this._operation = 'select';
    if (options?.count) this.filters.push({ type: 'count' });
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }
  
  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  order(column: string, { ascending = true }: any = {}) {
    this._order = { column, ascending };
    return this;
  }

  limit(count: number) {
    this._limit = count;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  insert(data: any | any[]) {
    this._operation = 'insert';
    this._payload = data;
    return this;
  }

  update(data: any) {
    this._operation = 'update';
    this._payload = data;
    return this;
  }

  upsert(data: any, options?: any) {
    this._operation = 'upsert';
    this._payload = data;
    return this;
  }

  delete() {
    this._operation = 'delete';
    return this;
  }

  async then(resolve: any, reject: any) {
    const db = getLocalDB();

    // --- INSERT ---
    if (this._operation === 'insert') {
        if (!db[this.table]) db[this.table] = [];
        const items = Array.isArray(this._payload) ? this._payload : [this._payload];
        const newItems = items.map((item: any) => ({
          ...item,
          id: item.id || Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString()
        }));
        db[this.table].push(...newItems);
        saveLocalDB(db);
        resolve({ data: newItems, error: null });
        return;
    }

    // --- UPDATE ---
    if (this._operation === 'update') {
        if (!db[this.table]) {
            resolve({ data: null, error: { message: `Table ${this.table} not found` } });
            return;
        }
        let updatedCount = 0;
        db[this.table] = db[this.table].map((row: any) => {
          let match = true;
          for (const filter of this.filters) {
            // Fuzzy compare to handle ID string/number mismatch
            if (filter.type === 'eq' && String(row[filter.column]) !== String(filter.value)) {
              match = false;
              break;
            }
          }
          if (match) {
            updatedCount++;
            return { ...row, ...this._payload };
          }
          return row;
        });
        saveLocalDB(db);
        resolve({ data: { count: updatedCount }, error: null });
        return;
    }

    // --- DELETE ---
    if (this._operation === 'delete') {
       if (!db[this.table]) {
           resolve({ data: null, error: { message: `Table ${this.table} not found` } });
           return;
       }
       let deletedCount = 0;
       
       if (this.filters.length === 0) {
           resolve({ data: null, count: 0, error: { message: "Delete requires a filter" } });
           return;
       }
       
       const initialLength = db[this.table].length;
       
       db[this.table] = db[this.table].filter((row: any) => {
          let match = true;
          for (const filter of this.filters) {
            // STRICT FIX: Ensure we compare everything as strings to avoid Type mismatches (e.g. "1" != 1)
            if (filter.type === 'eq' && String(row[filter.column]) !== String(filter.value)) {
              match = false;
              break;
            }
          }
          if (match) deletedCount++;
          // If match is true (it IS the item to delete), return FALSE to remove it from array.
          return !match; 
       });
       
       console.log(`[MOCK DB] Deleted ${deletedCount} rows from ${this.table}`);
       saveLocalDB(db);
       
       await new Promise(r => setTimeout(r, 50)); // Tiny delay
       
       resolve({ data: null, count: deletedCount, error: null });
       return;
    }

    // --- UPSERT ---
    if (this._operation === 'upsert') {
        if (!db[this.table]) db[this.table] = [];
        const items = Array.isArray(this._payload) ? this._payload : [this._payload];
        for (const item of items) {
            const existingIdx = db[this.table].findIndex((r: any) => String(r.id) === String(item.id));
            if (existingIdx >= 0) {
              // Deep merge logic if needed, but for now simple merge
              db[this.table][existingIdx] = { ...db[this.table][existingIdx], ...item };
            } else {
              db[this.table].push({ ...item, created_at: item.created_at || new Date().toISOString() });
            }
        }
        saveLocalDB(db);
        resolve({ data: items, error: null });
        return;
    }

    // --- SELECT (Default) ---
    let data = db[this.table] || [];

    this.filters.forEach(filter => {
      if (filter.type === 'eq') {
        data = data.filter((row: any) => String(row[filter.column]) === String(filter.value));
      } else if (filter.type === 'neq') {
        data = data.filter((row: any) => String(row[filter.column]) !== String(filter.value));
      }
    });

    if (this.filters.some(f => f.type === 'count')) {
      resolve({ count: data.length, data: null, error: null });
      return;
    }

    if (this._order) {
      data.sort((a: any, b: any) => {
        if (a[this._order.column] < b[this._order.column]) return this._order.ascending ? -1 : 1;
        if (a[this._order.column] > b[this._order.column]) return this._order.ascending ? 1 : -1;
        return 0;
      });
    }

    if (this._limit) {
      data = data.slice(0, this._limit);
    }

    if (this._single) {
      if (data.length === 0) resolve({ data: null, error: { message: "No rows found" } });
      else resolve({ data: data[0], error: null });
      return;
    }

    resolve({ data, error: null });
  }
}

// ==========================================
// 4. EXPORT LOGIC
// ==========================================

let client;

if (isFirebaseConfigured) {
  client = new FirebaseAdapter();
} else {
  // Always log when Mock Mode is active so developer knows why data isn't saving to cloud
  console.log("%c⚠️ FORCED MOCK MODE. Data will be saved to LocalStorage.", "background: #ea580c; color: #fff; padding: 4px; border-radius: 4px; font-weight: bold;");
  client = new MockSupabaseClient();
}

export const supabase = client as any;
