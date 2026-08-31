import type { ComponentProperties } from '../../types';
import React from 'react';
import { Handle, Position } from 'reactflow';
import { HS } from './shared';
import { useElectricalStore } from '../../store/electricalStore';

const IOTerminals: React.FC<{ id: string; side: 'IN' | 'OUT' }> = ({ id, side }) => {
  const rows = [
    { key: `L_${side}`, label: 'L', color: 'red' },
    { key: `N_${side}`, label: 'N', color: 'blue' },
    { key: `E_${side}`, label: 'E', color: 'emerald' },
  ];
  const pos = side === 'IN' ? Position.Left : Position.Right;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[8px] font-mono text-slate-500 text-center">{side === 'IN' ? 'FEED IN' : 'LOAD OUT'}</span>
      {rows.map(r => (
        <div key={r.key} className="bg-slate-950 border border-slate-800 rounded p-1 flex items-center justify-between relative">
          <span className={`text-[9px] font-bold font-mono ${r.color === 'red' ? 'text-red-400' : r.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`}>{r.label}</span>
          <Handle type={side === 'IN' ? 'target' : 'source'} position={pos} id={`${id}::${r.key}`}
            className={`${r.color === 'red' ? '!bg-red-600' : r.color === 'blue' ? '!bg-blue-500' : '!bg-emerald-500'} ${HS}`} />
        </div>
      ))}
    </div>
  );
};

export const FCUSwitchedNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => {
  const isOn = data.properties?.isOn;
  const isLive = data.properties?.isEnergized;
  const toggle = useElectricalStore(s => s.toggleSwitch);
  return (
    <div className="w-64 bg-slate-900 border-2 border-teal-800 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2">
      <div className="flex justify-between items-start border-b border-slate-800 pb-2">
        <div>
          <h3 className="text-xs font-bold text-teal-300">Switched FCU</h3>
          <span className="text-[8px] font-mono text-slate-500">Fused spur · 3A/13A</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse' : 'bg-slate-700'}`} title="Neon indicator" />
          <button onClick={() => toggle(id)}
            className={`px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded border transition-all ${isOn ? 'bg-teal-500 text-black border-teal-300' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
            {isOn ? 'On' : 'Off'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <IOTerminals id={id} side="IN" />
        <IOTerminals id={id} side="OUT" />
      </div>
    </div>
  );
};

export const FCUUnswitchedNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => {
  const isLive = data.properties?.isEnergized;
  return (
    <div className="w-64 bg-slate-900 border-2 border-slate-700 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2">
      <div className="flex justify-between items-start border-b border-slate-800 pb-2">
        <div>
          <h3 className="text-xs font-bold text-slate-200">Unswitched FCU</h3>
          <span className="text-[8px] font-mono text-slate-500">Fused spur · no isolation</span>
        </div>
        <div className={`w-2 h-2 rounded-full mt-1 ${isLive ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]' : 'bg-slate-700'}`} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <IOTerminals id={id} side="IN" />
        <IOTerminals id={id} side="OUT" />
      </div>
    </div>
  );
};

export const CookerControlUnitNode: React.FC<{ id: string; data: { properties: ComponentProperties } }> = ({ id, data }) => {
  const isOn = data.properties?.isOn;
  const isLive = data.properties?.isEnergized;
  const toggle = useElectricalStore(s => s.toggleSwitch);
  return (
    <div className="w-72 bg-slate-900 border-2 border-rose-800 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2">
      <div className="flex justify-between items-start border-b border-slate-800 pb-2">
        <div>
          <h3 className="text-xs font-bold text-rose-300">Cooker Control Unit</h3>
          <span className="text-[8px] font-mono text-slate-500">45A DP switch + socket</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse' : 'bg-slate-700'}`} />
          <button onClick={() => toggle(id)}
            className={`px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded border transition-all ${isOn ? 'bg-rose-500 text-black border-rose-300' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
            {isOn ? 'On' : 'Off'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <IOTerminals id={id} side="IN" />
        <IOTerminals id={id} side="OUT" />
      </div>
      <div className="bg-slate-950 border border-slate-800 rounded p-2 flex flex-col gap-1">
        <span className="text-[8px] font-mono text-slate-500 text-center">INTEGRAL SOCKET (always live)</span>
        <div className="flex justify-around">
          {[{ k: 'SKT_L', c: 'red' }, { k: 'SKT_N', c: 'blue' }, { k: 'SKT_E', c: 'emerald' }].map(t => (
            <div key={t.k} className="relative flex flex-col items-center">
              <span className={`text-[8px] font-mono font-bold ${t.c === 'red' ? 'text-red-400' : t.c === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`}>{t.k.split('_')[1]}</span>
              <Handle type="source" position={Position.Bottom} id={`${id}::${t.k}`}
                className={`${t.c === 'red' ? '!bg-red-600' : t.c === 'blue' ? '!bg-blue-500' : '!bg-emerald-500'} ${HS}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
