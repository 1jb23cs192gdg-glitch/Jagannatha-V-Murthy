import React from 'react';
import { Link } from 'react-router-dom';
import { BowArrowLogo } from '../constants';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-12 rounded-3xl shadow-xl border border-stone-200 max-w-lg w-full">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
           <BowArrowLogo className="w-12 h-12" color="#ea580c" />
        </div>
        <h1 className="text-6xl font-bold text-stone-800 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-stone-600 mb-6">Path Not Found</h2>
        <p className="text-stone-500 mb-8">
          The sacred path you are looking for does not exist. Let's guide you back to the temple.
        </p>
        <Link 
          to="/" 
          className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition-transform hover:scale-105 shadow-lg"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;