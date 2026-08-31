import type { ComponentProperties } from '../../types';
import React from 'react';
import { Handle, Position } from 'reactflow';
import { HS } from './shared';

const TERM_ROWS = [
  { pair: ['L1', 'L2'], label: 'LIVE', color: 'red' },
  { pair: ['N1', 'N2'], label: 'NEUTRAL', color: 'blue' },
  { pair: ['E1', 'E2'], label: 'EARTH', color: 'emerald' },
] as const;

const colorClasses: Record<string, { text: string; box: string; handle: string }> = {
  red: { text: 'text-red-400', box: 'border-red-900/50', handle: '!bg-red-600' },
  blue: { text: 'text-blue-400', box: 'border-blue-900/50', handle: '!bg-blue-500' },
  emerald: { text: 'text-emerald-400', box: 'border-emerald-900/50', handle: '!bg-emerald-500' },
};

const SocketBase: React.FC<{ id: string; data: { properties: ComponentProperties }; title: string; subtitle: string; gangs: number; hasUSB?: boolean; outdoor?: boolean }> = ({ id, data, title, subtitle, gangs, hasUSB, outdoor }) => {
  const isLive = data.properties?.isEnergized;
  return (
    <div className={`w-60 bg-slate-900 border-2 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2 ${outdoor ? 'border-cyan-700' : 'border-slate-700'}`}>
      <div className="flex items-start justify-between border-b border-slate-800 pb-2">
        <div>
          <h3 className="text-xs font-bold text-slate-200">{title}</h3>
          <span className="text-[8px] font-mono text-slate-500">{subtitle}</span>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${isLive ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]' : 'bg-slate-700'}`} />
      </div>

      <div className="flex gap-1.5">
        {Array.from({ length: gangs }).map((_, i) => (
          <div key={i} className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-1.5 flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full border-2 border-slate-700 relative flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            </div>
            {hasUSB && <span className="text-[7px] font-mono text-cyan-400">USB</span>}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {TERM_ROWS.map(row => {
          const c = colorClasses[row.color];
          return (
            <div key={row.label} className={`bg-slate-950 border rounded p-1.5 flex items-center justify-between ${c.box}`}>
              <span className={`text-[8px] font-bold font-mono ${c.text}`}>{row.label}</span>
              <div className="flex items-center gap-3 relative">
                <Handle type="source" position={Position.Left} id={`${id}::${row.pair[0]}`} className={`${c.handle} ${HS}`} style={{ left: -6 }} />
                <span className="text-[8px] text-slate-600 font-mono">loop</span>
                <Handle type="source" position={Position.Right} id={`${id}::${row.pair[1]}`} className={`${c.handle} ${HS}`} style={{ right: -6 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SingleSocketNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => (
  <SocketBase id={id} data={data} title="Single Socket" subtitle="13A · BS 1363" gangs={1} />
);
export const DoubleSocketNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => (
  <SocketBase id={id} data={data} title="Double Socket" subtitle="13A twin · BS 1363" gangs={2} />
);
export const OutdoorSocketNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => (
  <SocketBase id={id} data={data} title="Outdoor Socket" subtitle="IP66 · RCD required" gangs={1} outdoor />
);
export const USBSocketNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => (
  <SocketBase id={id} data={data} title="USB Socket" subtitle="13A + USB-A/C" gangs={2} hasUSB />
);
