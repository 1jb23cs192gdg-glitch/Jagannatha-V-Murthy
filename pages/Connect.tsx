import React, { useState } from 'react';

const Connect = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert("Please fill in all fields.");
      return;
    }
    // Simulate API call
    alert(`Thank you, ${formData.name}! Your message regarding "${formData.subject}" has been sent. Our team will contact you at ${formData.email} shortly.`);
    setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
  };

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-stone-800 mb-4">Connect With Us</h1>
          <p className="text-stone-600">Have questions or want to partner with us? Reach out!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="bg-stone-900 text-white rounded-2xl p-8 shadow-xl">
             <h2 className="text-2xl font-bold mb-6 text-orange-400">Project Details</h2>
             <div className="space-y-6">
               <div>
                 <p className="text-stone-400 text-sm uppercase tracking-wider">Team Name</p>
                 <p className="text-xl font-semibold">Idea Igniters</p>
               </div>
               <div>
                 <p className="text-stone-400 text-sm uppercase tracking-wider">Team ID</p>
                 <p className="text-xl font-semibold">113918</p>
               </div>
               <div>
                 <p className="text-stone-400 text-sm uppercase tracking-wider">Problem Statement ID</p>
                 <p className="text-xl font-semibold">SIH25133</p>
               </div>
               <div className="pt-6 border-t border-stone-700">
                 <p className="text-stone-400 text-sm uppercase tracking-wider mb-2">Office Address</p>
                 <p>SIH Innovation Center,<br/>New Delhi, India - 110001</p>
                 <p className="mt-4">📧 connect@temple2ayurveda.in</p>
                 <p>📞 +91 1800-TEMPLE-00</p>
               </div>
             </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-200">
             <h2 className="text-2xl font-bold text-stone-800 mb-6">Send a Message</h2>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-stone-700 mb-1">Your Name</label>
                 <input 
                   type="text" 
                   value={formData.name}
                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                   className="w-full border rounded-lg p-3 bg-stone-50 focus:ring-2 focus:ring-orange-500 outline-none" 
                   placeholder="John Doe" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
                 <input 
                   type="email" 
                   value={formData.email}
                   onChange={(e) => setFormData({...formData, email: e.target.value})}
                   className="w-full border rounded-lg p-3 bg-stone-50 focus:ring-2 focus:ring-orange-500 outline-none" 
                   placeholder="john@example.com" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-stone-700 mb-1">Subject</label>
                 <select 
                   value={formData.subject}
                   onChange={(e) => setFormData({...formData, subject: e.target.value})}
                   className="w-full border rounded-lg p-3 bg-stone-50 focus:ring-2 focus:ring-orange-500 outline-none"
                 >
                   <option>General Inquiry</option>
                   <option>Temple Partnership</option>
                   <option>NGO Registration</option>
                   <option>Report Issue</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-stone-700 mb-1">Message</label>
                 <textarea 
                   value={formData.message}
                   onChange={(e) => setFormData({...formData, message: e.target.value})}
                   className="w-full border rounded-lg p-3 bg-stone-50 focus:ring-2 focus:ring-orange-500 outline-none h-32" 
                   placeholder="How can we help you?"
                 ></textarea>
               </div>
               <button type="submit" className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition-colors">
                 Send Message
               </button>
             </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connect;