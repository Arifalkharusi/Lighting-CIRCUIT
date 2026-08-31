import React, { useState } from 'react';
import { useElectricalStore } from '../store/electricalStore';
import { COMPONENT_CATALOG, CATEGORY_ORDER } from '../data/componentCatalog';
import { CABLE_SIZES } from '../data/cableGuide';
import type { ComponentType, CoreColor, CableCSA } from '../types';

const CORE_COLORS: { id: CoreColor; name: string; bg: string }[] = [
  { id: 'Brown', name: 'Live (Brn)', bg: 'bg-amber-700' },
  { id: 'Blue', name: 'Neutral (Blu)', bg: 'bg-blue-500' },
  { id: 'GreenYellow', name: 'Earth (G/Y)', bg: 'bg-emerald-500' },
  { id: 'Yellow', name: 'Strap (Ylw)', bg: 'bg-yellow-400' },
  { id: 'Black', name: '3-Core (Blk)', bg: 'bg-slate-900 border border-slate-700' },
  { id: 'Grey', name: '3-Core (Gry)', bg: 'bg-slate-400' },
];

const CategorySection: React.FC<{
  category: string;
  onDragStart: (e: React.DragEvent, type: ComponentType) => void;
  onClick: (type: ComponentType) => void;
}> = ({ category, onDragStart, onClick }) => {
  const [open, setOpen] = useState(true);
  const items = COMPONENT_CATALOG.filter(c => c.category === category);
  return (
    <div className="border border-slate-800/80 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/70 hover:bg-slate-900 text-left"
      >
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{category}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-slate-500 transition-transform ${open ? 'rotate-90' : ''}`}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      {open && (
        <div className="p-2 space-y-1.5 bg-slate-950/40">
          {items.map(item => (
            <div
              key={item.type}
              draggable
              onDragStart={e => onDragStart(e, item.type)}
              onClick={() => onClick(item.type)}
              className="p-2.5 bg-slate-900 border border-slate-800/80 rounded cursor-pointer hover:bg-slate-800 hover:border-amber-700/50 active:scale-[0.98] select-none transition-all"
            >
              <div className="text-xs font-medium text-slate-200 flex justify-between items-center">
                {item.name}
                <span className="text-[8px] text-slate-600 font-mono tracking-tighter">drag/click</span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const Toolbox: React.FC = () => {
  const { selectedCoreColor, setCoreColor, selectedCSA, setCSA, clearWorkspace, undo, past, addComponent } = useElectricalStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCableInfo, setShowCableInfo] = useState(false);

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemClick = (type: ComponentType) => {
    const offset = Math.floor(Math.random() * 40) - 20;
    addComponent(type, 200 + offset, 200 + offset);
  };

  return (
    <aside
      className={`bg-[#0c0e13] border-r border-slate-800/90 text-slate-200 flex flex-col z-40 relative transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-0 border-r-0' : 'w-80'
      }`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-8 top-4 w-8 h-8 bg-[#0c0e13] border border-l-0 border-slate-800/90 rounded-r flex items-center justify-center text-slate-400 hover:text-white transition-colors z-50"
        title={isCollapsed ? 'Expand toolbox' : 'Collapse toolbox'}
      >
        {isCollapsed ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        )}
      </button>

      <div className={`flex flex-col h-full overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none hidden' : 'opacity-100'}`}>
        <div className="p-4 flex-1 overflow-y-auto space-y-5">

          {/* Wire spec: core color + cable size, side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Core Colour</span>
              <div className="grid grid-cols-1 gap-1">
                {CORE_COLORS.map(wire => (
                  <button key={wire.id} onClick={() => setCoreColor(wire.id)}
                    className={`p-1.5 rounded text-[10px] font-mono font-medium border flex items-center gap-2 transition-all ${selectedCoreColor === wire.id ? 'border-amber-400 bg-slate-900 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${wire.bg}`} />
                    {wire.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Cable CSA</span>
              <div className="grid grid-cols-1 gap-1">
                {CABLE_SIZES.map(cs => (
                  <button key={cs.csa} onClick={() => setCSA(cs.csa as CableCSA)}
                    className={`p-1.5 rounded text-[10px] font-mono font-medium border text-center transition-all ${selectedCSA === cs.csa ? 'border-amber-400 bg-slate-900 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'}`}>
                    {cs.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCableInfo(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-400 hover:text-slate-200 hover:border-amber-700/50 transition-colors"
          >
            <span>Cable size &amp; circuit reference</span>
            <span>{showCableInfo ? '▲' : '▼'}</span>
          </button>
          {showCableInfo && (
            <div className="bg-slate-950 border border-slate-800 rounded p-2 text-[9px] font-mono text-slate-500 space-y-1 max-h-40 overflow-y-auto">
              {CABLE_SIZES.map(cs => (
                <div key={cs.csa} className="flex justify-between gap-2">
                  <span className="text-amber-400 font-bold whitespace-nowrap">{cs.label}</span>
                  <span className="text-right">{cs.typicalUse}</span>
                </div>
              ))}
            </div>
          )}

          {/* Component catalog, grouped by category */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Component Inventory</span>
            {CATEGORY_ORDER.map(cat => (
              <CategorySection key={cat} category={cat} onDragStart={handleDragStart} onClick={handleItemClick} />
            ))}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-3 text-[9px] font-mono text-slate-500 space-y-1">
            <div className="text-amber-400 font-bold text-[10px] mb-1">Wiring tip</div>
            <div>Drag a wire between two terminal pins to connect them manually. Every connection uses the core colour and cable size currently selected above.</div>
          </div>
        </div>

        <div className="p-4 pt-0 space-y-3 border-t border-slate-800/80">
          <div className="flex gap-2 pt-3">
            <button
              onClick={undo}
              disabled={past.length === 0}
              className={`flex-1 py-2 text-xs rounded border transition-colors flex items-center justify-center gap-2
                ${past.length > 0
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
              Undo
            </button>
            <button
              onClick={clearWorkspace}
              className="flex-1 py-2 bg-red-950/20 hover:bg-red-900/40 border border-red-900/50 text-xs rounded text-red-400 transition-colors"
            >
              Reset Canvas
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
