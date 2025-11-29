import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

declare var process: {
  env: {
    API_KEY: string;
  };
};

const AIStudio = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Using Image generation model
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            setImage(`data:image/png;base64,${base64EncodeString}`);
          }
        }
      } else {
        alert("No image generated. Please try a different prompt.");
      }

    } catch (error) {
      console.error("Image generation error:", error);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-stone-800 mb-4">Temple AI Studio</h1>
          <p className="text-stone-600">Visualize clean temples and sustainable products with Gemini Intelligence.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Describe your vision</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., A futuristic sustainable temple made of bamboo with solar panels, surrounded by lush gardens..."
                  className="w-full border rounded-xl p-4 bg-stone-50 focus:ring-2 focus:ring-orange-500 h-40 resize-none"
                ></textarea>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isLoading || !prompt}
                className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>✨ Generate Concept Art</>
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-center bg-stone-100 rounded-xl min-h-[300px] border-2 border-dashed border-stone-300 relative overflow-hidden">
              {image ? (
                <img src={image} alt="Generated" className="w-full h-full object-contain" />
              ) : (
                <div className="text-stone-400 text-center p-6">
                  <p className="text-4xl mb-2">🎨</p>
                  <p>Your AI generated artwork will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStudio;