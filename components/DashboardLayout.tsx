
import React, { useState } from 'react';
import { NamasteLogo } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { useTheme } from '../ThemeContext';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  user?: User | null;
  title: string;
  sidebarItems: SidebarItem[];
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  children: React.ReactNode;
  onSearch?: (query: string) => void; 
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  user, 
  title, 
  sidebarItems, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  children,
  onSearch
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-slate-900 relative overflow-hidden flex font-sans transition-colors duration-300">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/30 dark:bg-orange-900/20 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 left-0 z-50 p-4">
        <div className="glass-panel h-full rounded-3xl flex flex-col justify-between p-6 dark:border-slate-700">
          <div>
            {/* Brand */}
            <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <NamasteLogo className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">Temple<span className="text-orange-500">2</span>Ayurveda</h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">Dashboard</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                      isActive 
                        ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20 dark:bg-slate-700' 
                        : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {item.icon}
                    </span>
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl border border-orange-100 dark:border-slate-700 mb-4">
               <p className="text-xs font-bold text-orange-800 dark:text-orange-400 mb-1">Need Help?</p>
               <p className="text-[10px] text-orange-600 dark:text-orange-500 mb-2">Contact support for assistance.</p>
               <button onClick={() => navigate('/connect')} className="text-[10px] bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-lg font-bold shadow-sm border border-orange-100 dark:border-slate-600 w-full hover:bg-orange-50 dark:hover:bg-slate-600 transition-colors">Support</button>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-white hover:bg-red-500 rounded-2xl transition-colors text-sm font-bold shadow-sm border border-transparent hover:shadow-red-500/30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
           <div className="bg-white dark:bg-slate-900 w-64 h-full p-6 shadow-2xl flex flex-col justify-between" onClick={e => e.stopPropagation()}>
             <div>
               <div className="flex items-center gap-3 mb-8">
                  <NamasteLogo className="w-8 h-8 text-orange-500" />
                  <span className="font-bold text-slate-800 dark:text-white">Menu</span>
               </div>
               <nav className="space-y-2">
                  {sidebarItems.map(item => (
                    <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium ${activeTab === item.id ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'text-slate-500 dark:text-slate-400'}`}>
                      {item.label}
                    </button>
                  ))}
               </nav>
             </div>
             <button onClick={onLogout} className="mt-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold w-full text-center py-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
               Sign Out
             </button>
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 flex flex-col h-screen relative z-10">
        
        {/* Top Header */}
        <header className="px-6 py-4 md:py-6 flex justify-between items-center sticky top-0 z-40">
           <div className="flex items-center gap-4">
              <button className="md:hidden p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-500 dark:text-slate-400" onClick={() => setMobileMenuOpen(true)}>
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">Welcome back, {user?.name || 'User'}</p>
              </div>
           </div>

           <div className="flex items-center gap-4 relative">
              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-slate-700 px-4 py-2.5 rounded-full shadow-sm w-64 focus-within:w-80 transition-all duration-300">
                 <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                 <input 
                   type="text" 
                   onChange={handleSearchChange}
                   placeholder="Search..." 
                   className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-300 w-full placeholder-slate-400" 
                 />
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="w-10 h-10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 dark:border-slate-700 shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-yellow-400"
                title="Toggle Dark Mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative w-10 h-10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 dark:border-slate-700 shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                   <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                   <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                
                {/* Notification Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 top-12 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 z-50 animate-fade-in">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">Notifications</h4>
                      <button onClick={() => setNotificationsOpen(false)} className="text-xs text-orange-500 font-bold hover:underline">Close</button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto text-slate-700 dark:text-slate-300">
                      <div className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">New Temple Request</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Shri Krishna Mandir requested to join.</p>
                      </div>
                      <div className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">High Waste Alert</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Kashi Temple exceeded 100kg limit.</p>
                      </div>
                      <div className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">System Update</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Coin rate updated successfully.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200/50 dark:border-slate-700/50">
                 <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-700 dark:text-white">{user?.name || 'Profile'}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">{user?.role || 'Guest'}</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 p-0.5 shadow-md">
                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-orange-600 font-bold overflow-hidden">
                       {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                 </div>
                 {/* Logout Button in Header */}
                 <button 
                    onClick={onLogout}
                    className="ml-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors border border-red-100 dark:border-red-900/30 shadow-sm"
                    title="Logout"
                 >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 </button>
              </div>
           </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scroll-smooth">
          <div className="max-w-6xl mx-auto animate-fade-in">
             {children}
          </div>
        </div>

      </main>
    </div>
  );
};

export default DashboardLayout;
