
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Rankings from './pages/Rankings';
import TempleList from './pages/TempleList';
import Login from './pages/Login';
import About from './pages/About';
import Guidelines from './pages/Guidelines';
import Faqs from './pages/Faqs';
import Connect from './pages/Connect';
import AIStudio from './pages/AIStudio';
import WasteAnalysis from './pages/WasteAnalysis';
import Shop from './pages/Shop';
import NotFound from './pages/NotFound';
import AIChatBot from './components/AIChatBot';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TempleDashboard from './pages/dashboards/TempleDashboard';
import NgoDashboard from './pages/dashboards/NgoDashboard';
import UserDashboard from './pages/dashboards/UserDashboard';
import { User, UserRole } from './types';
import { supabase } from './lib/supabaseClient';
import { BowArrowLogo } from './constants';

// Protected Route Wrapper
interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles: UserRole[];
  user: User | null;
  loading: boolean;
}

const ProtectedRoute = ({ children, allowedRoles, user, loading }: ProtectedRouteProps) => {
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" />;
  
  return <>{children}</>;
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session (Mock or Real)
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data && data.user) {
          await fetchUserProfile(data.user.id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Session check failed", e);
        setLoading(false);
      }
    };

    checkSession();

    // 2. Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
       if(authListener && authListener.subscription) authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Self-healing: If profile missing in Firestore but Auth exists, create default profile
        if (error.message === "Document not found" || (typeof error.message === 'string' && error.message.includes("not found"))) {
           console.log("Profile missing for auth user. Creating default profile...");
           
           // Check if we can recover email from auth (mock or real)
           const { data: authData } = await supabase.auth.getUser();
           const email = authData?.user?.email || `user_${userId.substring(0,6)}@temple.com`;
           
           const { error: createError } = await supabase.from('profiles').insert({
             id: userId,
             email: email,
             full_name: 'Recovered User',
             role: UserRole.PERSON,
             green_coins: 0,
             waste_donated_kg: 0,
             is_disabled: false
           });
           
           if (!createError) {
             // Retry fetch recursively once
             const { data: retryData } = await supabase
               .from('profiles')
               .select('*')
               .eq('id', userId)
               .single();
               
             if (retryData) {
                setUser({
                  id: retryData.id,
                  name: retryData.full_name || 'User',
                  role: retryData.role as UserRole,
                  greenCoins: retryData.green_coins,
                  greenStars: retryData.green_stars,
                  isVolunteer: retryData.is_volunteer,
                  isDisabled: retryData.is_disabled
                });
                return; 
             }
           }
        }
        throw error;
      }
      
      if (data) {
        // Security Check: Disabled account
        if (data.is_disabled) {
          await handleLogout();
          alert("Your session has been terminated because your account is disabled. Please contact admin.");
          return;
        }

        setUser({
          id: data.id,
          name: data.full_name || 'User',
          role: data.role as UserRole,
          greenCoins: data.green_coins,
          greenStars: data.green_stars,
          isVolunteer: data.is_volunteer,
          isDisabled: data.is_disabled
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error.message || error);
      // On critical error, ensure we don't hang in loading state
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Force a profile refresh to ensure all data is loaded
    if (loggedInUser.id) {
        fetchUserProfile(loggedInUser.id);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('temple_mock_session'); // Clear mock session
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
       <div className="relative mb-4">
         <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20 rounded-full"></div>
         <BowArrowLogo className="w-16 h-16 text-orange-600 animate-pulse" color="#ea580c" />
       </div>
       <div className="text-stone-600 font-bold">Initializing Ecosystem...</div>
    </div>
  );

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="flex-grow pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/temples" element={<TempleList />} />
            <Route path="/ai-studio" element={<AIStudio />} />
            <Route path="/scan" element={<WasteAnalysis />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/guidelines" element={<Guidelines />} />
            <Route path="/faqs" element={<Faqs />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            
            {/* Protected Dashboards */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute user={user} loading={loading} allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            } />
            <Route path="/temple-dashboard" element={
              <ProtectedRoute user={user} loading={loading} allowedRoles={[UserRole.TEMPLE]}>
                <TempleDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            } />
            <Route path="/ngo-dashboard" element={
              <ProtectedRoute user={user} loading={loading} allowedRoles={[UserRole.NGO]}>
                <NgoDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            } />
            <Route path="/user-dashboard" element={
              <ProtectedRoute user={user} loading={loading} allowedRoles={[UserRole.PERSON]}>
                <UserDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            } />
            
            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <AIChatBot />
        <Footer />
      </div>
    </Router>
  );
};

export default App;
