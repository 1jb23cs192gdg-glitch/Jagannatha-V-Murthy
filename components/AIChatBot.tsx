
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { RobotLogo } from '../constants';

// Fix for process not defined error
declare var process: {
  env: {
    API_KEY: string;
  };
};

interface Message {
  role: 'user' | 'model';
  text: string;
  groundingLinks?: { title: string; uri: string }[];
}

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Namaste! I am VEDA, your AI Sustainability Guide. How can I assist you in your eco-spiritual journey today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-2.5-flash';
      
      const response = await ai.models.generateContent({
        model: model,
        contents: userMsg,
        config: {
          tools: [{ googleMaps: {} }],
          systemInstruction: "You are VEDA (Virtual Eco-Devotion Assistant), a highly advanced AI for 'Temple to Ayurveda'. You are polite, knowledgeable about Indian culture, Vedas, and modern recycling technology. Your tone is serene yet futuristic. When asked about locations or distances, use the Google Maps tool to provide accurate information.",
        }
      });

      const text = response.text || "I couldn't generate a response. Please try again.";
      
      // Extract Grounding Links
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = chunks
        .map((c: any) => {
           if (c.web?.uri) return { title: c.web.title || 'View on Map', uri: c.web.uri };
           return null;
        })
        .filter((l: any) => l !== null);

      setMessages(prev => [...prev, { role: 'model', text, groundingLinks: links }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Connection interrupted. Re-aligning satellites..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Holographic Orb Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 group transition-all duration-500 ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 bg-orange-600 rounded-full blur-lg opacity-75 animate-pulse-glow"></div>
          <div className="relative w-full h-full bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center border-2 border-white/30 shadow-2xl overflow-hidden">
             {/* Rotating Ring */}
             <div className="absolute w-full h-full border-2 border-dashed border-white/40 rounded-full animate-[spin_10s_linear_infinite]"></div>
             <RobotLogo className="w-8 h-8 text-white animate-float" />
          </div>
        </div>
      </button>

      {/* Glassmorphism Chat Interface */}
      <div 
        className={`fixed bottom-6 right-6 w-80 md:w-96 h-[550px] rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 transition-all duration-500 border border-white/20 backdrop-blur-2xl ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-20 pointer-events-none'
        }`}
        style={{ background: 'rgba(23, 23, 23, 0.85)' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600/90 to-red-600/90 p-4 flex justify-between items-center backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur border border-white/30">
              <RobotLogo className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm tracking-wider">VEDA AI</h3>
              <p className="text-[10px] text-orange-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Neural Grid Background */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #ea580c 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 scrollbar-thin scrollbar-thumb-orange-600/50 scrollbar-track-transparent">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-sm backdrop-blur-sm ${
                msg.role === 'user' 
                  ? 'bg-orange-600/90 text-white rounded-br-sm shadow-[0_4px_15px_rgba(234,88,12,0.3)]' 
                  : 'bg-white/10 border border-white/10 text-stone-100 rounded-bl-sm shadow-sm'
              }`}>
                {msg.text}
              </div>
              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                 <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                    {msg.groundingLinks.map((link, i) => (
                       <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-white/10 hover:bg-white/20 border border-white/20 px-2 py-1 rounded text-orange-200 flex items-center gap-1 transition-colors">
                          📍 {link.title}
                       </a>
                    ))}
                 </div>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className="bg-white/10 border border-white/10 p-3 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                 <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/20 backdrop-blur-md border-t border-white/10 relative z-10">
           <div className="relative">
             <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder="Ask VEDA anything..." 
               className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all shadow-inner"
             />
             <button 
               onClick={handleSend}
               disabled={!input.trim()}
               className="absolute right-1 top-1 p-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-full text-white hover:shadow-[0_0_10px_rgba(234,88,12,0.6)] transition-all disabled:opacity-50 disabled:shadow-none"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
             </button>
           </div>
        </div>
      </div>
    </>
  );
};

export default AIChatBot;
