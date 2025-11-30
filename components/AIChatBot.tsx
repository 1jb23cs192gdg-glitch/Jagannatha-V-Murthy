import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

// Fix for process not defined error
declare var process: {
  env: {
    API_KEY: string;
  };
};

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Namaste! I am your AI Ayurveda Guide. Ask me anything about recycling, temple activities, or click "Fast Tip" for a quick fact!' }
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
      // Switched to gemini-2.5-flash for reliable text chat
      const model = 'gemini-2.5-flash';
      
      const response = await ai.models.generateContent({
        model: model,
        contents: userMsg,
        config: {
          systemInstruction: "You are a helpful assistant for 'Temple to Ayurveda', an app that recycles temple waste into ayurvedic products. Be polite, knowledgeable about Indian culture, and emphasize sustainability.",
        }
      });

      const text = response.text || "I couldn't generate a response. Please try again.";
      setMessages(prev => [...prev, { role: 'model', text }]);

    } catch (error) {
      console.error("ChatBot Error:", error);
      let errMsg = "Sorry, I encountered an error connecting to the service.";
      if (error instanceof Error) {
         if (error.message.includes("API key")) errMsg = "API Key Error: Please check configuration.";
      }
      setMessages(prev => [...prev, { role: 'model', text: errMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFastTip = async () => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Using Flash-Lite for fast, simple tasks
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: "Give me one short, fascinating sentence about Ayurveda or waste recycling.",
      });
      setMessages(prev => [...prev, { role: 'model', text: "⚡ Fast Tip: " + (response.text || "Recycling saves nature!") }]);
    } catch (error) {
      console.error("Fast Tip Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Could not fetch tip at the moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-orange-600 text-white rounded-full shadow-2xl hover:bg-orange-700 transition-all z-50 ${isOpen ? 'hidden' : 'block'}`}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-stone-200 font-sans">
          {/* Header */}
          <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span>🕉️</span> AI Guide
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-orange-700 p-1 rounded">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-stone-50 p-2 border-b border-stone-200 flex justify-center">
             <button 
               onClick={handleFastTip}
               className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold border border-yellow-200 hover:bg-yellow-200 transition-colors flex items-center gap-1"
             >
               ⚡ Get Fast Tip (Flash-Lite)
             </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-orange-600 text-white rounded-br-none' 
                    : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-white border border-stone-200 p-3 rounded-xl rounded-bl-none text-stone-500 text-xs flex items-center gap-1">
                   <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                   <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-stone-200">
             <div className="flex items-center gap-2">
               <input 
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 placeholder="Type your question..." 
                 className="flex-1 border border-stone-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
               />
               <button 
                 onClick={handleSend}
                 disabled={!input.trim()}
                 className="bg-orange-600 text-white p-2 rounded-full hover:bg-orange-700 disabled:opacity-50"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
               </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatBot;