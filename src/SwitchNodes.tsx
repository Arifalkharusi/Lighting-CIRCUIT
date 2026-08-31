import type { ComponentProperties } from '../../types';
import React from 'react';
import { Handle, Position } from 'reactflow';
import { HS } from './shared';
import { useElectricalStore } from '../../store/electricalStore';

export const OneWaySwitchNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => {
  const isOpen = data.properties?.isOpen;
  const toggle = useElectricalStore(s => s.toggleSwitch);
  return (
    <div className="w-52 bg-slate-900 border-2 border-slate-700 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2">
      <div className="flex justify-between items-start border-b border-slate-800 pb-2">
        <div>
          <h3 className="text-xs font-bold text-slate-200">1-Way Switch</h3>
          <span className="text-[8px] font-mono text-slate-500">Single pole</span>
        </div>
        <button onClick={() => toggle(id)}
          className={`px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded border transition-all ${isOpen ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-amber-500 text-black border-amber-400 shadow-lg'}`}>
          {isOpen ? 'Open' : 'Closed'}
        </button>
      </div>
      <div className="space-y-2">
        {[{ id: 'COM', sub: 'Common feed' }, { id: 'L1', sub: 'Switched out' }].map(t => (
          <div key={t.id} className="bg-slate-950 border border-slate-800 rounded p-2 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-300 font-mono">{t.id}</span>
              <span className="text-[8px] text-slate-500">{t.sub}</span>
            </div>
            <div className="w-7 h-7 rounded bg-amber-900/40 border border-amber-600/50 flex items-center justify-center relative">
              <Handle type="source" position={Position.Right} id={`${id}::${t.id}`} className={`!bg-amber-500 ${HS}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-slate-950 border border-emerald-900/40 rounded p-2 flex items-center justify-between">
        <span className="text-[8px] font-bold font-mono text-emerald-400">EARTH</span>
        <div className="w-7 h-7 rounded bg-emerald-900/30 border border-emerald-600/50 flex items-center justify-center relative">
          <Handle type="source" position={Position.Bottom} id={`${id}::E`} className={`!bg-emerald-500 ${HS}`} />
        </div>
      </div>
    </div>
  );
};

export const DimmerSwitchNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => {
  const isOpen = data.properties?.isOpen;
  const toggle = useElectricalStore(s => s.toggleSwitch);
  return (
    <div className="w-52 bg-slate-900 border-2 border-orange-800/70 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2">
      <div className="flex justify-between items-start border-b border-slate-800 pb-2">
        <div>
          <h3 className="text-xs font-bold text-orange-300">Dimmer Switch</h3>
          <span className="text-[8px] font-mono text-slate-500">Rotary / push dimmer</span>
        </div>
        <button onClick={() => toggle(id)}
          className={`px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded border transition-all ${isOpen ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-orange-500 text-black border-orange-400 shadow-lg'}`}>
          {isOpen ? 'Off' : 'On'}
        </button>
      </div>
      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div className={`h-full transition-all ${isOpen ? 'w-0' : 'w-3/4'} bg-orange-500`} />
      </div>
      <div className="space-y-2">
        {[{ id: 'COM', sub: 'Common feed' }, { id: 'L1', sub: 'Switched out' }].map(t => (
          <div key={t.id} className="bg-slate-950 border border-slate-800 rounded p-2 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-300 font-mono">{t.id}</span>
              <span className="text-[8px] text-slate-500">{t.sub}</span>
            </div>
            <div className="w-7 h-7 rounded bg-orange-900/40 border border-orange-600/50 flex items-center justify-center relative">
              <Handle type="source" position={Position.Right} id={`${id}::${t.id}`} className={`!bg-orange-500 ${HS}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-slate-950 border border-emerald-900/40 rounded p-2 flex items-center justify-between">
        <span className="text-[8px] font-bold font-mono text-emerald-400">EARTH</span>
        <div className="w-7 h-7 rounded bg-emerald-900/30 border border-emerald-600/50 flex items-center justify-center relative">
          <Handle type="source" position={Position.Bottom} id={`${id}::E`} className={`!bg-emerald-500 ${HS}`} />
        </div>
      </div>
    </div>
  );
};

const TWO_WAY_TERM_STYLE: Record<string, { text: string; box: string; handle: string }> = {
  amber: { text: 'text-amber-300', box: 'bg-amber-900/40 border-amber-600/50', handle: '!bg-amber-500' },
  indigo: { text: 'text-indigo-300', box: 'bg-indigo-900/40 border-indigo-600/50', handle: '!bg-indigo-500' },
  violet: { text: 'text-violet-300', box: 'bg-violet-900/40 border-violet-600/50', handle: '!bg-violet-500' },
};

export const TwoWaySwitchNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => {
  const pos = data.properties?.switchPos ?? false;
  const toggle = useElectricalStore(s => s.toggleSwitch);
  return (
    <div className="w-56 bg-slate-900 border-2 border-indigo-800 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2">
      <div className="flex justify-between items-start border-b border-slate-800 pb-2">
        <div>
          <h3 className="text-xs font-bold text-indigo-300">2-Way Switch</h3>
          <span className="text-[8px] font-mono text-slate-500">Strapwire control</span>
        </div>
        <button onClick={() => toggle(id)}
          className={`px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded border transition-all ${!pos ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-violet-600 text-white border-violet-400'}`}>
          {!pos ? 'Pos A' : 'Pos B'}
        </button>
      </div>
      <div className="space-y-2">
        {[
          { id: 'COM', sub: 'Common', color: 'amber' },
          { id: 'L1', sub: 'Position A', color: 'indigo' },
          { id: 'L2', sub: 'Position B', color: 'violet' },
        ].map(t => {
          const s = TWO_WAY_TERM_STYLE[t.color];
          return (
            <div key={t.id} className="bg-slate-950 border border-slate-800 rounded p-2 flex items-center justify-between">
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold font-mono ${s.text}`}>{t.id}</span>
                <span className="text-[8px] text-slate-500">{t.sub}</span>
              </div>
              <div className={`w-7 h-7 rounded border flex items-center justify-center relative ${s.box}`}>
                <Handle type="source" position={Position.Right} id={`${id}::${t.id}`} className={`${s.handle} ${HS}`} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-slate-950 border border-emerald-900/40 rounded p-2 flex items-center justify-between">
        <span className="text-[8px] font-bold font-mono text-emerald-400">EARTH</span>
        <div className="w-7 h-7 rounded bg-emerald-900/30 border border-emerald-600/50 flex items-center justify-center relative">
          <Handle type="source" position={Position.Bottom} id={`${id}::E`} className={`!bg-emerald-500 ${HS}`} />
        </div>
      </div>
    </div>
  );
};

export const IntermediateSwitchNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => {
  const pos = data.properties?.switchPos ?? false;
  const toggle = useElectricalStore(s => s.toggleSwitch);
  return (
    <div className="w-64 bg-slate-900 border-2 border-fuchsia-800 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2">
      <div className="flex justify-between items-start border-b border-slate-800 pb-2">
        <div>
          <h3 className="text-xs font-bold text-fuchsia-300">Intermediate Switch</h3>
          <span className="text-[8px] font-mono text-slate-500">3-way midpoint</span>
        </div>
        <button onClick={() => toggle(id)}
          className={`px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded border transition-all ${!pos ? 'bg-fuchsia-600 text-white border-fuchsia-400' : 'bg-pink-600 text-white border-pink-400'}`}>
          {!pos ? 'Straight' : 'Crossed'}
        </button>
      </div>
      <div className="bg-slate-950 rounded p-3 flex flex-col items-center justify-center gap-2 text-[9px] font-mono border border-slate-800">
        <span className="text-slate-500 mb-1">Internal bridge</span>
        <div className="flex items-center gap-4 relative h-8 w-24">
          <span className="absolute left-0 top-0 text-slate-400">L1</span>
          <span className="absolute left-0 bottom-0 text-slate-400">L2</span>
          {!pos ? (
            <svg className="absolute left-4 top-1 w-16 h-6 stroke-fuchsia-400" viewBox="0 0 64 24" fill="none" strokeWidth="2">
              <path d="M0 2 L64 2" /><path d="M0 22 L64 22" />
            </svg>
          ) : (
            <svg className="absolute left-4 top-1 w-16 h-6 stroke-pink-400" viewBox="0 0 64 24" fill="none" strokeWidth="2">
              <path d="M0 2 L64 22" /><path d="M0 22 L64 2" />
            </svg>
          )}
          <span className="absolute right-0 top-0 text-slate-400">L3</span>
          <span className="absolute right-0 bottom-0 text-slate-400">L4</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          {[{ id: 'L1', sub: 'In A' }, { id: 'L2', sub: 'In B' }].map(t => (
            <div key={t.id} className="bg-slate-950 border border-slate-800 rounded p-2 flex flex-col items-start relative">
              <span className="text-[10px] font-bold font-mono text-fuchsia-300">{t.id}</span>
              <span className="text-[8px] text-slate-500">{t.sub}</span>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-fuchsia-900/40 border border-fuchsia-600/50 flex items-center justify-center">
                <Handle type="target" position={Position.Left} id={`${id}::${t.id}`} className={`!bg-fuchsia-500 ${HS}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[{ id: 'L3', sub: 'Out A' }, { id: 'L4', sub: 'Out B' }].map(t => (
            <div key={t.id} className="bg-slate-950 border border-slate-800 rounded p-2 flex flex-col items-end relative text-right">
              <span className="text-[10px] font-bold font-mono text-pink-300">{t.id}</span>
              <span className="text-[8px] text-slate-500">{t.sub}</span>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-pink-900/40 border border-pink-600/50 flex items-center justify-center">
                <Handle type="source" position={Position.Right} id={`${id}::${t.id}`} className={`!bg-pink-500 ${HS}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-950 border border-emerald-900/40 rounded p-2 flex items-center justify-between">
        <span className="text-[8px] font-bold font-mono text-emerald-400">EARTH</span>
        <div className="w-7 h-7 rounded bg-emerald-900/30 border border-emerald-600/50 flex items-center justify-center relative">
          <Handle type="source" position={Position.Bottom} id={`${id}::E`} className={`!bg-emerald-500 ${HS}`} />
        </div>
      </div>
    </div>
  );
};
