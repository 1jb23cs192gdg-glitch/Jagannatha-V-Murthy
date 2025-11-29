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

// Detect if user has configured Firebase (Should be true now)
const isFirebaseConfigured = firebaseConfig.projectId !== "your-app-id";

// ==========================================
// 1. MOCK ENGINE (Local Fallback)
// ==========================================
const DB_KEY = 'temple_ayurveda_db';

const getLocalDB = () => {
  const dbStr = localStorage.getItem(DB_KEY);
  if (dbStr) return JSON.parse(dbStr);
  
  const initialDB = {
    users: [],
    profiles: [],
    temples: MOCK_TEMPLES.map(t => ({
      id: t.id,
      name: t.name,
      location: t.location,
      waste_donated_kg: t.wasteDonatedKg,
      green_stars: t.greenStars,
      image_url: t.imageUrl,
      description: t.description,
      ngo_id: t.ngoId,
      owner_id: 'mock_owner_' + t.id
    })),
    flash_updates: MOCK_UPDATES.map(u => ({
      id: u.id,
      title: u.title,
      content: u.content,
      type: u.type,
      created_at: new Date(u.date).toISOString()
    })),
    waste_logs: [],
    service_requests: []
  };
  localStorage.setItem(DB_KEY, JSON.stringify(initialDB));
  return initialDB;
};

const saveLocalDB = (db: any) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

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

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*', options?: any) {
    if (options?.count) this.filters.push({ type: 'count' });
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
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

  async insert(data: any | any[]) {
    const db = getLocalDB();
    if (!db[this.table]) db[this.table] = [];
    
    const items = Array.isArray(data) ? data : [data];
    const newItems = items.map((item: any) => ({
      ...item,
      id: item.id || Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    }));
    
    db[this.table].push(...newItems);
    saveLocalDB(db);
    return { data: newItems, error: null };
  }

  async update(data: any) {
    const db = getLocalDB();
    if (!db[this.table]) return { data: null, error: { message: `Table ${this.table} not found` } };

    const filterEq = this.filters.find(f => f.type === 'eq');
    if (!filterEq) return { data: null, error: { message: "Update requires a filter" } };

    let updatedCount = 0;
    db[this.table] = db[this.table].map((row: any) => {
      if (row[filterEq.column] === filterEq.value) {
        updatedCount++;
        return { ...row, ...data };
      }
      return row;
    });

    saveLocalDB(db);
    return { data: { count: updatedCount }, error: null };
  }

  async upsert(data: any, options?: any) {
    const db = getLocalDB();
    if (!db[this.table]) db[this.table] = [];

    const item = data;
    const existingIdx = db[this.table].findIndex((r: any) => r.id === item.id);

    if (existingIdx >= 0) {
      db[this.table][existingIdx] = { ...db[this.table][existingIdx], ...item };
    } else {
      db[this.table].push({ ...item, created_at: new Date().toISOString() });
    }
    
    saveLocalDB(db);
    return { data: item, error: null };
  }

  then(resolve: any, reject: any) {
    const db = getLocalDB();
    let data = db[this.table] || [];

    this.filters.forEach(filter => {
      if (filter.type === 'eq') {
        data = data.filter((row: any) => row[filter.column] === filter.value);
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
// 2. FIREBASE ADAPTER (Real Backend)
// ==========================================

let firebaseApp: any;
let firebaseAuth: any;
let firebaseDb: any;
let firebaseAnalytics: any;

if (isFirebaseConfigured) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    // Initialize Analytics only if supported in environment (usually browser)
    if (typeof window !== 'undefined') {
       firebaseAnalytics = getAnalytics(firebaseApp);
    }
    console.log("🔥 Firebase Connected:", firebaseConfig.projectId);
  } catch (e) {
    console.error("Firebase Initialization Failed:", e);
  }
}

class FirebaseAdapter {
  auth = {
    signUp: async ({ email, password, options }: any) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;
        if (options?.data?.full_name) {
          await updateProfile(user, { displayName: options.data.full_name });
        }
        return { 
          data: { 
            user: { id: user.uid, email: user.email, user_metadata: options?.data || {} }, 
            session: { access_token: await user.getIdToken(), user } 
          }, 
          error: null 
        };
      } catch (error: any) {
        return { data: { user: null, session: null }, error: { message: error.message } };
      }
    },
    signInWithPassword: async ({ email, password }: any) => {
      try {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;
        return { 
          data: { 
            user: { id: user.uid, email: user.email, user_metadata: {} }, 
            session: { access_token: await user.getIdToken(), user } 
          }, 
          error: null 
        };
      } catch (error: any) {
        return { data: { user: null, session: null }, error: { message: error.message } };
      }
    },
    signOut: async () => {
      try {
        await signOut(firebaseAuth);
        return { error: null };
      } catch (error: any) {
        return { error: { message: error.message } };
      }
    },
    getUser: async () => {
      const user = firebaseAuth.currentUser;
      if (user) {
        return { data: { user: { id: user.uid, email: user.email, user_metadata: {} } }, error: null };
      }
      return { data: { user: null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        if (user) {
          callback('SIGNED_IN', { user: { id: user.uid, email: user.email }, access_token: 'firebase-token' });
        } else {
          callback('SIGNED_OUT', null);
        }
      });
      return { data: { subscription: { unsubscribe } } };
    }
  };

  from(table: string) {
    return new FirestoreQueryBuilder(table);
  }
}

class FirestoreQueryBuilder {
  table: string;
  constraints: QueryConstraint[] = [];
  _single = false;
  _docId: string | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select() { return this; }

  eq(column: string, value: any) {
    if (column === 'id') this._docId = value;
    this.constraints.push(where(column, '==', value));
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
    this._single = true;
    return this;
  }

  async then(resolve: any, reject: any) {
    try {
      if (this._single && this._docId) {
         const docRef = doc(firebaseDb, this.table, this._docId);
         const docSnap = await getDoc(docRef);
         if (docSnap.exists()) {
           resolve({ data: { id: docSnap.id, ...docSnap.data() }, error: null });
         } else {
           resolve({ data: null, error: { message: "Document not found" } });
         }
         return;
      }

      const q = query(collection(firebaseDb, this.table), ...this.constraints);
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (this._single) {
        if (data.length > 0) resolve({ data: data[0], error: null });
        else resolve({ data: null, error: { message: "No rows found" } });
      } else {
        resolve({ data, count: data.length, error: null });
      }
    } catch (error: any) {
      console.error("Firebase Adapter Error:", error);
      resolve({ data: null, error: { message: error.message } });
    }
  }

  async insert(data: any | any[]) {
    try {
      const items = Array.isArray(data) ? data : [data];
      const results = [];
      for (const item of items) {
        const { id, ...rest } = item;
        let docRef;
        if (id || this._docId) {
          docRef = doc(firebaseDb, this.table, id || this._docId);
          await setDoc(docRef, { ...rest, created_at: new Date().toISOString() }, { merge: true });
        } else {
          docRef = await addDoc(collection(firebaseDb, this.table), { ...rest, created_at: new Date().toISOString() });
        }
        results.push({ id: docRef.id, ...rest });
      }
      return { data: results, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async update(data: any) {
    try {
      if (this._docId) {
         const docRef = doc(firebaseDb, this.table, this._docId);
         await updateDoc(docRef, data);
         return { data: { ...data }, error: null };
      }
      return { data: null, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }

  async upsert(data: any) {
    return this.insert(data);
  }
}

// ==========================================
// 3. EXPORT LOGIC
// ==========================================

let client;

if (isFirebaseConfigured) {
  client = new FirebaseAdapter();
} else {
  console.warn("%c⚠️ RUNNING IN OFFLINE MOCK MODE. Firebase keys not configured in lib/supabaseClient.ts", "background: #f59e0b; color: #000; padding: 4px; border-radius: 4px; font-weight: bold;");
  client = new MockSupabaseClient();
}

export const supabase = client as any;