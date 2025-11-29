import React, { useState, useEffect } from 'react';
import { LOGO } from '../constants';
import { UserRole, User } from '../types';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
      case UserRole.NGO: return '/ngo-dashboard';
      case UserRole.PERSON: return '/user-dashboard';
      default: return '/';
    }
  };

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-lg shadow-lg py-1' : 'bg-white py-3 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
            <div className="flex-shrink-0 flex items-center gap-3">
              <div className="transform transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                {LOGO}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl md:text-2xl tracking-tight text-stone-800 leading-none">
                  Temple<span className="text-orange-600">2</span>Ayurveda
                </span>
                <span className="text-[10px] text-stone-500 font-medium tracking-widest uppercase hidden md:block">
                  Sacred Waste to Sustainable Life
                </span>
              </div>
            </div>
          </div>
          
          {/* Desktop Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${location.pathname === link.path ? 'text-orange-600 bg-orange-50' : 'text-stone-600 hover:text-orange-600 hover:bg-stone-50'}`}
              >
                {link.name}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-3 pl-4 ml-2 border-l border-stone-200">
                 <Link 
                  to={getDashboardLink()}
                  className="bg-stone-800 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-black transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Dashboard
                </Link>
                <button 
                  onClick={onLogout}
                  className="text-stone-400 hover:text-red-500 text-sm font-medium transition-colors px-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLoginClick}
                className="ml-4 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-full text-sm font-bold hover:from-orange-700 hover:to-red-700 shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all transform hover:-translate-y-0.5"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-stone-600 hover:text-orange-600 focus:outline-none p-2 rounded-lg hover:bg-stone-50">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`lg:hidden bg-white border-t border-stone-100 absolute w-full transition-all duration-300 ease-in-out overflow-hidden shadow-2xl ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 rounded-xl text-base font-medium text-stone-700 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            >
              {link.name}
            </Link>
          ))}
          {user ? (
            <div className="pt-4 mt-2 border-t border-stone-100 p-2 bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="font-bold text-stone-700">Welcome, {user.name}</span>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full uppercase">{user.role}</span>
              </div>
              <Link 
                to={getDashboardLink()}
                onClick={() => setIsOpen(false)}
                className="block w-full text-center px-4 py-3 rounded-xl text-base font-bold text-white bg-stone-800 mb-2 shadow-lg"
              >
                Go to Dashboard
              </Link>
              <button 
                onClick={() => { onLogout(); setIsOpen(false); }}
                className="block w-full text-center px-4 py-3 rounded-xl text-base font-medium text-stone-500 hover:text-red-600 hover:bg-white"
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