import React from 'react';

interface TrackerProps {
  status: string; // COLLECTED, SEGREGATED, PROCESSED, PRODUCT
  hash: string;
}

const BlockchainTracker: React.FC<TrackerProps> = ({ status, hash }) => {
  const steps = [
    { id: 'COLLECTED', label: 'Collected', icon: '🗑️' },
    { id: 'SEGREGATED', label: 'Segregated', icon: '🤖' },
    { id: 'PROCESSED', label: 'Processed', icon: '⚗️' },
    { id: 'PRODUCT', label: 'Eco-Product', icon: '🎁' },
  ];

  const currentIdx = steps.findIndex(s => s.id === status);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
      <div className="flex justify-between items-center mb-4 relative">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-stone-200 -z-0"></div>
        {/* Active Progress */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-green-500 -z-0 transition-all duration-1000"
          style={{ width: `${(activeIdx / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, idx) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors duration-500 ${idx <= activeIdx ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-stone-200 text-stone-500'}`}>
              {idx <= activeIdx ? '✓' : idx + 1}
            </div>
            <span className={`text-[10px] mt-1 font-semibold ${idx <= activeIdx ? 'text-green-700' : 'text-stone-400'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-2 bg-white p-2 rounded border border-stone-100">
        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center text-lg">🔗</div>
        <div className="overflow-hidden">
          <p className="text-[10px] text-stone-400 uppercase font-bold">Blockchain Hash</p>
          <p className="text-xs font-mono text-stone-600 truncate w-48 md:w-64">{hash || 'Generating...'}</p>
        </div>
      </div>
    </div>
  );
};

export default BlockchainTracker;