
import React, { useState, useEffect } from 'react';
import { LOGO } from '../constants';
import { UserRole, User } from '../types';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../ThemeContext';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Training', path: '/training' },
    { name: 'Rankings', path: '/rankings' },
    { name: 'Smart Scan', path: '/scan' },
    { name: 'Eco-Shop', path: '/shop' },
    { name: 'About', path: '/about' },
    { name: 'Connect', path: '/connect' },
  ];

  const getDashboardLink = () => {
    switch (user?.role) {
      case UserRole.ADMIN: return '/admin-dashboard';
      case UserRole.TEMPLE: return '/temple-dashboard';
      case UserRole.DRYING_UNIT: return '/du-dashboard';
      case UserRole.NGO: return '/ngo-dashboard';
      case UserRole.PERSON: return '/user-dashboard';
      default: return '/';
    }
  };

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg py-2' : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-4 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
            <div className="flex-shrink-0 flex items-center gap-3">
              <div className="transform transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                {LOGO}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl md:text-2xl tracking-tight text-stone-800 dark:text-white leading-none font-outfit">
                  Temple<span className="text-orange-600">2</span>Ayurveda
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium tracking-widest uppercase hidden md:block mt-1">
                  Sacred Waste to Sustainable Life
                </span>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-2 xl:gap-4">
            <div className="flex items-center gap-2 bg-stone-100/50 dark:bg-slate-800/50 p-2 rounded-full border border-stone-100 dark:border-slate-700">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link 
                    key={link.name} 
                    to={link.path}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                      isActive 
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-none transform scale-105' 
                        : 'text-stone-600 dark:text-stone-300 hover:text-orange-600 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-yellow-400 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors shadow-sm ml-2"
              title="Toggle Dark Mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-4 ml-2 border-l border-stone-200 dark:border-slate-700">
                 <Link 
                  to={getDashboardLink()}
                  className="bg-stone-800 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-black dark:hover:bg-slate-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Dashboard
                </Link>
                <button 
                  onClick={onLogout}
                  className="text-stone-400 hover:text-red-500 text-sm font-medium transition-colors px-2"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLoginClick}
                className="ml-4 bg-gradient-to-r from-orange-600 to-red-600 text-white px-7 py-2.5 rounded-full text-sm font-bold hover:from-orange-700 hover:to-red-700 shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-0.5"
              >
                Login
              </button>
            )}
          </div>

          <div className="flex items-center lg:hidden gap-4">
            <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-yellow-400 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-stone-600 dark:text-stone-300 hover:text-orange-600 focus:outline-none p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-slate-800">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-stone-100 dark:border-slate-800 absolute w-full transition-all duration-300 ease-in-out overflow-hidden shadow-2xl ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.name} 
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-l-4 border-orange-600 pl-3 shadow-sm'
                      : 'text-stone-600 dark:text-stone-300 hover:text-orange-600 hover:bg-stone-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          {user ? (
            <div className="pt-4 mt-2 border-t border-stone-100 dark:border-slate-800 p-2 bg-stone-50 dark:bg-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="font-bold text-stone-700 dark:text-white">Welcome, {user.name}</span>
                <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full uppercase">{user.role}</span>
              </div>
              <Link 
                to={getDashboardLink()}
                onClick={() => setIsOpen(false)}
                className="block w-full text-center px-4 py-3 rounded-xl text-base font-bold text-white bg-stone-800 dark:bg-slate-700 mb-2 shadow-lg hover:bg-stone-900 transition-colors"
              >
                Go to Dashboard
              </Link>
              <button 
                onClick={() => { onLogout(); setIsOpen(false); }}
                className="block w-full text-center px-4 py-3 rounded-xl text-base font-medium text-stone-500 dark:text-stone-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLoginClick}
              className="block w-full text-center mt-4 px-5 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg"
            >
              Login / Register
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
