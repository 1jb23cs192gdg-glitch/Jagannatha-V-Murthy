
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, 
  deleteDoc, setDoc, query, where, orderBy, limit, DocumentData, QueryConstraint
} from 'firebase/firestore';
import * as firebaseAuth from 'firebase/auth';
import { 
  getStorage, ref, uploadString, getDownloadURL 
} from 'firebase/storage';

// Workaround for Firebase Auth import issues in some TS environments
const { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider
} = firebaseAuth as any;

// ------------------------------------------------------------------
// FIREBASE CONFIGURATION (MAIN PRODUCTION DB)
// ------------------------------------------------------------------

const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key];
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return null;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || "AIzaSyAKVrdEyFnDj-v5GqE6NCpG_oJOiOGLh1c",
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || "temple-to-ayurveda-775121840946.us-west1.run.app",
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || "smart-india-hackathon-61947",
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || "smart-india-hackathon-61947.firebasestorage.app",
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || "865669856464",
  appId: getEnv('VITE_FIREBASE_APP_ID') || "1:865669856464:web:a70bfa60da1f193b8df2d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

console.log("🔥 Connected to Main Firebase Project:", firebaseConfig.projectId);

// ------------------------------------------------------------------
// SUPABASE ADAPTER WRAPPER (Lazy Execution)
// ------------------------------------------------------------------

class QueryBuilder {
  private collectionName: string;
  private constraints: QueryConstraint[];
  private operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT';
  private operationData: any;
  private isSingle: boolean;
  private isCount: boolean;
  private orderConfig: { field: string, ascending: boolean } | null;
  private targetId: string | null;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.constraints = [];
    this.operation = 'SELECT';
    this.operationData = null;
    this.isSingle = false;
    this.isCount = false;
    this.orderConfig = null;
    this.targetId = null;
  }

  // --- Modifiers (Return this) ---

  select(columns: string = '*', options?: any) {
    this.operation = 'SELECT';
    if (options?.count) this.isCount = true;
    return this;
  }

  eq(field: string, value: any) {
    if (field === 'id') {
      this.targetId = value;
    } else {
      this.constraints.push(where(field, '==', value));
    }
    return this;
  }

  neq(field: string, value: any) {
    this.constraints.push(where(field, '!=', value));
    return this;
  }

  gt(field: string, value: any) {
    this.constraints.push(where(field, '>', value));
    return this;
  }

  lt(field: string, value: any) {
    this.constraints.push(where(field, '<', value));
    return this;
  }

  order(field: string, { ascending = true }: any = {}) {
    this.orderConfig = { field, ascending };
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

  // --- Operations (Defer Execution) ---

  insert(data: any) {
    this.operation = 'INSERT';
    this.operationData = data;
    return this; 
  }

  update(data: any) {
    this.operation = 'UPDATE';
    this.operationData = data;
    return this; 
  }

  upsert(data: any) {
    this.operation = 'UPSERT';
    this.operationData = data;
    return this;
  }

  delete() {
    this.operation = 'DELETE';
    return this; 
  }

  // --- Execution (Await) ---

  async then(resolve: (res: { data: any, error: any, count?: number | null }) => void, reject: (err: any) => void) {
    try {
      let result = { data: null as any, error: null as any, count: null as number | null };
      const colRef = collection(db, this.collectionName);

      // --- OPTIMIZED ID OPERATIONS ---
      // If targeting specific ID, bypass query engine for direct document operations
      if (this.targetId) {
         const docRef = doc(db, this.collectionName, this.targetId);

         if (this.operation === 'UPDATE') {
             await updateDoc(docRef, this.operationData);
             // Fetch updated data to simulate return
             const snap = await getDoc(docRef);
             result.data = snap.exists() ? [{ id: snap.id, ...snap.data() }] : [];
             if (this.isSingle) result.data = result.data[0];
         }
         else if (this.operation === 'DELETE') {
             await deleteDoc(docRef);
             result.data = null;
         }
         else if (this.operation === 'SELECT') {
             const snap = await getDoc(docRef);
             if (snap.exists()) {
                 const d = { id: snap.id, ...snap.data() };
                 result.data = this.isSingle ? d : [d];
                 if(this.isCount) result.count = 1;
             } else {
                 result.data = this.isSingle ? null : [];
                 if(this.isCount) result.count = 0;
                 if(this.isSingle) result.error = { message: 'Row not found', code: 'PGRST116' };
             }
         }
         
         resolve(result);
         return;
      }

      // --- EXECUTE INSERT ---
      if (this.operation === 'INSERT') {
        const items = Array.isArray(this.operationData) ? this.operationData : [this.operationData];
        const results = [];
        
        for (const item of items) {
          if (this.collectionName === 'temple_photos' && item.image_url && item.image_url.startsWith('data:')) {
             // Handle Base64 Image Upload
             const base64Data = item.image_url;
             const fileName = `photos/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
             const storageRef = ref(storage, fileName);
             await uploadString(storageRef, base64Data, 'data_url');
             const downloadURL = await getDownloadURL(storageRef);
             const docRef = await addDoc(colRef, { ...item, image_url: downloadURL });
             results.push({ id: docRef.id, ...item, image_url: downloadURL });
          } else {
             const docRef = await addDoc(colRef, item);
             results.push({ id: docRef.id, ...item });
          }
        }
        result.data = results;
      }

      // --- EXECUTE UPSERT ---
      else if (this.operation === 'UPSERT') {
        const items = Array.isArray(this.operationData) ? this.operationData : [this.operationData];
        const results = [];
        for (const item of items) {
            if (item.id) {
                await setDoc(doc(db, this.collectionName, item.id), item, { merge: true });
                results.push(item);
            } else if (item.email && this.collectionName === 'profiles') {
                const q = query(colRef, where('email', '==', item.email));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const existingId = snap.docs[0].id;
                    await setDoc(doc(db, 'profiles', existingId), item, { merge: true });
                    results.push({ ...item, id: existingId });
                } else {
                    const docRef = await addDoc(colRef, item);
                    results.push({ ...item, id: docRef.id });
                }
            } else {
                const docRef = await addDoc(colRef, item);
                results.push({ id: docRef.id, ...item });
            }
        }
        result.data = results;
      }

      // --- EXECUTE BULK UPDATE/DELETE/SELECT (Query Based) ---
      else {
        // Apply ordering
        if (this.orderConfig) {
          this.constraints.push(orderBy(this.orderConfig.field, this.orderConfig.ascending ? 'asc' : 'desc'));
        }

        const q = query(colRef, ...this.constraints);
        const snapshot = await getDocs(q);

        if (this.operation === 'UPDATE') {
           if (!snapshot.empty) {
               const updatePromises = snapshot.docs.map(d => updateDoc(doc(db, this.collectionName, d.id), this.operationData));
               await Promise.all(updatePromises);
               result.data = snapshot.docs.map(d => ({ id: d.id, ...d.data(), ...this.operationData }));
           } else {
               result.data = [];
           }
        }
        else if (this.operation === 'DELETE') {
            const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, this.collectionName, d.id)));
            await Promise.all(deletePromises);
            result.data = null;
        }
        else { // SELECT
            let data: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (this.isSingle) {
              result.data = data.length > 0 ? data[0] : null;
              if (!result.data) result.error = { message: 'Row not found', code: 'PGRST116' };
            } else {
              result.data = data;
              if (this.isCount) result.count = data.length;
            }
        }
      }

      resolve(result);
    } catch (error: any) {
      console.error(`Firebase Error (${this.operation} on ${this.collectionName}):`, error);
      resolve({ data: null, error, count: null });
    }
  }
}

class SupabaseFirebaseAdapter {
  auth = {
    signUp: async ({ email, password, options }: any) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        return { data: { user: { id: user.uid, email: user.email } }, error: null };
      } catch (error: any) {
        return { data: { user: null }, error };
      }
    },
    signInWithPassword: async ({ email, password }: any) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        return { data: { user: { id: user.uid, email: user.email } }, error: null };
      } catch (error: any) {
        return { data: { user: null }, error };
      }
    },
    signInWithOAuth: async ({ provider }: any) => {
      try {
        if (provider === 'google') {
           const googleProvider = new GoogleAuthProvider();
           const result = await signInWithPopup(auth, googleProvider);
           return { data: { user: result.user }, error: null };
        }
        return { data: null, error: { message: "Provider not supported" } };
      } catch (error: any) {
        return { data: null, error };
      }
    },
    signOut: async () => {
      try {
        await signOut(auth);
        return { error: null };
      } catch (error: any) {
        return { error };
      }
    },
    getUser: async () => {
      const user = auth.currentUser;
      return { data: { user: user ? { id: user.uid, email: user.email } : null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      const unsubscribe = onAuthStateChanged(auth, (user: any) => {
        if (user) {
          callback('SIGNED_IN', { user: { id: user.uid, email: user.email } });
        } else {
          callback('SIGNED_OUT', null);
        }
      });
      return { data: { subscription: { unsubscribe } } };
    }
  };

  from(table: string) {
    return new QueryBuilder(table);
  }
}

export const supabase = new SupabaseFirebaseAdapter() as any;
