
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

declare var process: {
  env: {
    API_KEY: string;
  };
};

const WasteAnalysis = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeWaste = async () => {
    if (!image) return;
    setLoading(true);

    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Analyze this image of temple/ritual waste. 
        Identify the items (e.g., Flowers, Coconuts, Plastic, Incense sticks, Cloth, Ash, Paper).
        Estimate the composition percentage.
        Determine if it is Biodegradable or Non-biodegradable.
        Suggest the recycling output (e.g., Flowers -> Incense, Coconut -> Biofuel).
        
        CRITICAL: Recommend the correct Bin(s) for the detected waste types from these options:
        1. "Flower Waste Bin" (for flowers, garlands, organic soft waste)
        2. "Plastic Waste Bin" (for bottles, wrappers, packets, non-biodegradable)
        3. "Coconut Shell Bin" (for hard coconut shells)
        4. "Paper/Cloth Bin" (for books, paper, religious cloth, chunri)

        If the image contains mixed waste (e.g. flowers mixed with plastic bottles), suggest MULTIPLE bins so the user can segregate them.
        
        Return the response in this JSON format ONLY:
        {
          "items": [
            {"name": "Item Name", "category": "Bio/Non-Bio", "percentage": "XX%", "recycleOutput": "Product Name"}
          ],
          "overallRecyclability": "High/Medium/Low",
          "recommendedBins": ["Bin Name 1", "Bin Name 2"],
          "summary": "One sentence summary"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: mimeType, data: base64Data } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        setAnalysis(JSON.parse(text));
      }

    } catch (error) {
      console.error("Analysis failed:", error);
      alert("AI Analysis failed. Please try a clearer image.");
    } finally {
      setLoading(false);
    }
  };

  const getBinColor = (binName: string) => {
      if (!binName) return 'bg-gray-600 shadow-gray-200';
      const name = binName.toLowerCase();
      if (name.includes('plastic')) return 'bg-blue-600 shadow-blue-200';
      if (name.includes('coconut')) return 'bg-amber-800 shadow-amber-200';
      if (name.includes('paper') || name.includes('cloth')) return 'bg-yellow-600 shadow-yellow-200';
      return 'bg-green-600 shadow-green-200'; 
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">AI Powered</span>
          <h1 className="text-4xl font-bold text-stone-800 mt-2 mb-4">Smart Bin Simulator</h1>
          <p className="text-stone-600">Upload a photo of waste to see how our IoT Bins segregate materials automatically.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h3 className="font-bold text-lg mb-4 text-stone-800">1. Upload Image</h3>
            <div className="border-2 border-dashed border-stone-300 rounded-xl min-h-[300px] flex flex-col items-center justify-center p-4 bg-stone-50 relative overflow-hidden">
              {image ? (
                <img src={image} alt="Uploaded Waste" className="w-full h-full object-contain z-10" />
              ) : (
                <div className="text-center text-stone-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <p>Click to upload waste photo</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
            </div>
            <button 
              onClick={analyzeWaste}
              disabled={!image || loading}
              className="w-full mt-4 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                   Analyzing...
                </>
              ) : (
                '🔍 Identify & Segregate'
              )}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h3 className="font-bold text-lg mb-4 text-stone-800">2. AI Analysis Results</h3>
            
            {analysis ? (
              <div className="space-y-6 animate-fade-in">
                <div className={`p-4 rounded-xl border-l-4 ${analysis.overallRecyclability === 'High' ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'}`}>
                  <p className="font-bold text-stone-800">Summary</p>
                  <p className="text-sm text-stone-600">{analysis.summary}</p>
                </div>

                <div className="space-y-3">
                  <p className="font-semibold text-sm text-stone-500 uppercase tracking-wider">Detected Composition</p>
                  {analysis.items.length > 0 ? analysis.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-stone-50 p-3 rounded-lg border border-stone-100">
                      <div>
                        <div className="font-bold text-stone-800">{item.name}</div>
                        <div className="text-xs text-stone-500">{item.category} • Output: <span className="text-orange-600 font-semibold">{item.recycleOutput}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-stone-700">{item.percentage}</div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-stone-500 italic text-sm text-center py-4 bg-stone-50 rounded-lg">No item detected</p>
                  )}
                </div>

                {/* Only show bin suggestion if items were actually detected */}
                {analysis.items.length > 0 && (
                    <div className="pt-4 border-t border-stone-100 text-center">
                      <p className="text-sm text-stone-500 mb-3">Segregate items into these bins:</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {analysis.recommendedBins?.map((bin: string, i: number) => (
                           <div key={i} className={`inline-flex items-center gap-2 text-white px-5 py-2 rounded-full font-bold shadow-lg transform hover:scale-105 transition-transform ${getBinColor(bin)}`}>
                             <span>{bin.toLowerCase().includes('plastic') ? '🔵' : bin.toLowerCase().includes('coconut') ? '🥥' : bin.toLowerCase().includes('paper') || bin.toLowerCase().includes('cloth') ? '📄' : '🌸'}</span>
                             {bin}
                           </div>
                        ))}
                      </div>
                    </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-50">
                <p className="text-6xl mb-4">🤖</p>
                <p className="text-center">Waiting for input data...<br/><span className="text-xs">Upload an image to start analysis</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteAnalysis;
