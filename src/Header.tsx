import React from 'react';
import { useElectricalStore } from '../store/electricalStore';
import type { UserMode } from '../types';

export const Header: React.FC<{ onOpenGuide: () => void }> = ({ onOpenGuide }) => {
  const { userMode, setMode, components, conductors } = useElectricalStore();
  const componentCount = Object.keys(components).length;

  return (
    <header className="h-14 flex-shrink-0 border-b border-slate-800/90 bg-[#0c0e13] flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold text-sm">⚡</div>
        <div>
          <h1 className="text-sm font-bold text-slate-100 leading-none">Domestic Electrical Designer</h1>
          <span className="text-[10px] text-slate-500 font-mono">
            {componentCount} component{componentCount === 1 ? '' : 's'} · {conductors.length} conductor{conductors.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenGuide}
          className="px-3 py-1.5 text-xs rounded border border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-600/60 hover:text-white transition-colors font-mono"
        >
          Cable Guide
        </button>

        <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded">
          {(['Apprentice', 'Electrician'] as UserMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1 text-xs rounded font-medium transition-all ${userMode === m ? 'bg-amber-500 text-black font-semibold' : 'text-slate-400 hover:text-slate-200'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
