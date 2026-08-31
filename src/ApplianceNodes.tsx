import type { ComponentProperties } from '../../types';
import React from 'react';
import { Handle, Position } from 'reactflow';
import { HS } from './shared';

const ApplianceBase: React.FC<{ id: string; data: { properties: ComponentProperties }; title: string; subtitle: string; icon: React.ReactNode; accent: string }> = ({ id, data, title, subtitle, icon, accent }) => {
  const isOn = data.properties?.isEnergized;
  return (
    <div className={`w-56 bg-slate-900 border-2 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2 ${isOn ? accent : 'border-slate-700'}`}>
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOn ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
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
        <div className={`w-2 h-2 rounded-full ${isOn ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]' : 'bg-slate-700'}`} />
        <span className="text-[8px] font-mono text-slate-400">{isOn ? 'RUNNING' : 'IDLE'}</span>
      </div>
    </div>
  );
};

const BoilerIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>;
const ImmersionIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v6M8 22a4 4 0 0 1-4-4V10h16v8a4 4 0 0 1-4 4Z"/></svg>;
const FanIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M12 10c0-3 2-6 5-6s3 4 0 6M12 14c0 3-2 6-5 6s-3-4 0-6M14 12c3 0 6 2 6 5s-4 3-6 0M10 12c-3 0-6-2-6-5s4-3 6 0"/></svg>;

export const BoilerNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => (
  <ApplianceBase id={id} data={data} title="Combi Boiler" subtitle="Fed via FCU, local isolation" icon={BoilerIcon} accent="border-emerald-500" />
);
export const ImmersionHeaterNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => (
  <ApplianceBase id={id} data={data} title="Immersion Heater" subtitle="Dedicated radial circuit" icon={ImmersionIcon} accent="border-emerald-500" />
);
export const ExtractorFanNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => (
  <ApplianceBase id={id} data={data} title="Extractor Fan" subtitle="Kitchen / bathroom" icon={FanIcon} accent="border-emerald-500" />
);
