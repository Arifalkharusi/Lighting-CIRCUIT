import type { ComponentProperties } from '../../types';
import React from 'react';
import { Handle, Position } from 'reactflow';
import { HS } from './shared';

export const CeilingRoseNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => {
  const isLit = data.properties?.isEnergized;
  return (
    <div className={`w-72 h-72 rounded-full bg-slate-900 border-4 transition-all duration-300 relative flex flex-col items-center justify-center p-4 ${isLit ? 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.5)]' : 'border-slate-700 shadow-2xl'}`}>
      <div className="absolute inset-2 border-2 border-dashed border-slate-800 rounded-full pointer-events-none" />
      <div className="text-center mb-1 z-10 select-none">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Ceiling Rose</span>
        <span className="text-[8px] text-slate-600 font-mono">Loop-in method</span>
      </div>
      <div className="w-full grid grid-cols-3 gap-x-2 gap-y-4 px-2 mt-2 z-10">
        <div className="bg-slate-950/90 p-2 border border-blue-900/50 rounded flex flex-col space-y-2">
          <span className="text-[8px] text-blue-400 font-bold font-mono text-center">NEUTRAL</span>
          <div className="flex justify-around items-center h-4">
            <Handle type="source" position={Position.Top} id={`${id}::N1`} className={`!bg-blue-500 ${HS}`} />
            <Handle type="source" position={Position.Top} id={`${id}::N2`} className={`!bg-blue-500 ${HS}`} />
            <Handle type="source" position={Position.Top} id={`${id}::N3`} className={`!bg-blue-500 ${HS}`} />
          </div>
        </div>
        <div className="bg-slate-950/90 p-2 border border-red-900/50 rounded flex flex-col space-y-2">
          <span className="text-[8px] text-red-400 font-bold font-mono text-center">LOOP-IN</span>
          <div className="flex justify-around items-center h-4">
            <Handle type="source" position={Position.Top} id={`${id}::LOOP1`} className={`!bg-red-600 ${HS}`} />
            <Handle type="source" position={Position.Top} id={`${id}::LOOP2`} className={`!bg-red-600 ${HS}`} />
            <Handle type="source" position={Position.Top} id={`${id}::LOOP3`} className={`!bg-red-600 ${HS}`} />
          </div>
        </div>
        <div className="bg-slate-950/90 p-2 border border-amber-900/50 rounded flex flex-col space-y-2">
          <span className="text-[8px] text-amber-500 font-bold font-mono text-center">SW LIVE</span>
          <div className="flex justify-around items-center h-4">
            <Handle type="source" position={Position.Top} id={`${id}::SL1`} className={`!bg-amber-500 ${HS}`} />
            <Handle type="source" position={Position.Top} id={`${id}::SL2`} className={`!bg-amber-500 ${HS}`} />
          </div>
        </div>
      </div>
      <div className="mt-5 bg-slate-950/90 px-4 py-2 border border-emerald-900/50 rounded flex items-center space-x-3 z-10">
        <span className="text-[8px] text-emerald-400 font-bold font-mono">CPC EARTH</span>
        <Handle type="source" position={Position.Bottom} id={`${id}::E`} className={`!bg-emerald-500 ${HS}`} />
      </div>
      <div className="mt-4 flex items-center space-x-2 bg-black/40 px-3 py-1 rounded-full border border-slate-800">
        <div className={`w-3 h-3 rounded-full transition-all ${isLit ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse' : 'bg-slate-800'}`} />
        <span className="text-[9px] font-mono text-slate-400">Lamp: {isLit ? 'ON — 230V' : 'OFF'}</span>
      </div>
    </div>
  );
};

// Shared visual for the "simple sink light" family — Pendant / Downlight / Batten / Wall.
// They differ only in icon + label; electrically each is just an L / N / E lamp load.
const SimpleLightNode: React.FC<{ id: string; data: { properties: ComponentProperties }; title: string; subtitle: string; icon: React.ReactNode; accent: string }> = ({ id, data, title, subtitle, icon, accent }) => {
  const isLit = data.properties?.isEnergized;
  return (
    <div className={`w-48 bg-slate-900 border-2 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2 transition-all ${isLit ? `${accent} shadow-[0_0_25px_rgba(251,191,36,0.35)]` : 'border-slate-700'}`}>
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isLit ? 'bg-amber-400 text-black' : 'bg-slate-800 text-slate-400'}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-200">{title}</h3>
          <span className="text-[8px] font-mono text-slate-500">{subtitle}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[{ t: 'L', c: 'red' }, { t: 'N', c: 'blue' }, { t: 'E', c: 'emerald' }].map(x => (
          <div key={x.t} className="bg-slate-950 border border-slate-800 rounded p-1.5 flex flex-col items-center relative">
            <span className={`text-[9px] font-bold font-mono ${x.c === 'red' ? 'text-red-400' : x.c === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`}>{x.t}</span>
            <Handle type="target" position={Position.Left} id={`${id}::${x.t}`}
              className={`${x.c === 'red' ? '!bg-red-600' : x.c === 'blue' ? '!bg-blue-500' : '!bg-emerald-500'} ${HS}`} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 bg-black/30 px-2 py-1 rounded-full border border-slate-800">
        <div className={`w-2 h-2 rounded-full ${isLit ? 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.9)]' : 'bg-slate-700'}`} />
        <span className="text-[8px] font-mono text-slate-400">{isLit ? 'ON' : 'OFF'}</span>
      </div>
    </div>
  );
};

const BulbIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7 3 3 0 0 1 1.5 2.3h5A3 3 0 0 1 16 14.7 7 7 0 0 0 12 2Z"/></svg>;
const SpotIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="6"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>;
const BattenIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="4" rx="1"/><path d="M12 14v6"/></svg>;
const WallIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21V9l8-6 8 6v12"/><circle cx="12" cy="14" r="2.5"/></svg>;

export const PendantLightNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => (
  <SimpleLightNode id={id} data={data} title="Pendant Light" subtitle="Flex + lampholder" icon={BulbIcon} accent="border-amber-400" />
);
export const DownlightSpotNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => (
  <SimpleLightNode id={id} data={data} title="Downlight / Spot" subtitle="GU10 recessed" icon={SpotIcon} accent="border-amber-400" />
);
export const BattenHolderNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => (
  <SimpleLightNode id={id} data={data} title="Batten Holder" subtitle="BC lampholder" icon={BattenIcon} accent="border-amber-400" />
);
export const WallLightNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => (
  <SimpleLightNode id={id} data={data} title="Wall Light" subtitle="Wall-mounted fitting" icon={WallIcon} accent="border-amber-400" />
);
