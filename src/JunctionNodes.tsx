import React from 'react';
import { Handle, Position } from 'reactflow';
import { HS } from './shared';

export const ConnectorBlockNode: React.FC<{ id: string }> = ({ id }) => {
  const poles = ['P1', 'P2', 'P3', 'P4', 'P5'];
  return (
    <div className="w-60 bg-stone-900 border-2 border-stone-700 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2">
      <div className="border-b border-stone-800 pb-1.5">
        <h3 className="text-xs font-bold text-stone-300 tracking-wide">5-Pole Connector Block</h3>
        <span className="text-[8px] font-mono text-stone-500 block">Isolated junction terminals</span>
      </div>
      <div className="space-y-1.5">
        {poles.map(p => (
          <div key={p} className="grid grid-cols-5 items-center bg-stone-950 border border-stone-800 rounded p-1.5 relative">
            <div className="col-span-1 flex justify-start items-center relative">
              <div className="w-5 h-5 bg-stone-800 border border-stone-600 rounded flex items-center justify-center">
                <Handle type="source" position={Position.Left} id={`${id}::${p}_L`} className={`!bg-stone-500 ${HS}`} />
              </div>
            </div>
            <div className="col-span-3 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-1 bg-amber-600/70 rounded-full mb-0.5" />
              <span className="text-[9px] font-mono font-bold text-stone-400">{p}</span>
            </div>
            <div className="col-span-1 flex justify-end items-center relative">
              <div className="w-5 h-5 bg-stone-800 border border-stone-600 rounded flex items-center justify-center">
                <Handle type="source" position={Position.Right} id={`${id}::${p}_R`} className={`!bg-stone-500 ${HS}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-[7px] font-mono text-stone-600 text-center select-none uppercase tracking-wider pt-0.5 border-t border-stone-800/60">
        Maintenance-free choc-box strip
      </div>
    </div>
  );
};

export const JunctionBox4TNode: React.FC<{ id: string }> = ({ id }) => {
  const rows: { key: string; label: string; ids: string[]; color: string }[] = [
    { key: 'L', label: 'LIVE', ids: ['L1', 'L2', 'L3', 'L4'], color: 'red' },
    { key: 'N', label: 'NEUTRAL', ids: ['N1', 'N2', 'N3', 'N4'], color: 'blue' },
    { key: 'E', label: 'EARTH', ids: ['E1', 'E2', 'E3', 'E4'], color: 'emerald' },
  ];
  return (
    <div className="w-64 bg-stone-900 border-2 border-stone-700 rounded-xl p-3 shadow-2xl relative flex flex-col gap-2">
      <div className="border-b border-stone-800 pb-1.5">
        <h3 className="text-xs font-bold text-stone-300 tracking-wide">4-Terminal Junction Box</h3>
        <span className="text-[8px] font-mono text-stone-500 block">All same-pole cores commoned</span>
      </div>
      <div className="space-y-1.5">
        {rows.map(row => (
          <div key={row.key} className="bg-stone-950 border border-stone-800 rounded p-1.5">
            <span className={`text-[8px] font-bold font-mono block mb-1 ${row.color === 'red' ? 'text-red-400' : row.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`}>{row.label}</span>
            <div className="grid grid-cols-4 gap-1">
              {row.ids.map(termId => (
                <div key={termId} className="bg-stone-900 border border-stone-800 rounded h-6 flex items-center justify-center relative">
                  <Handle type="source" position={Position.Bottom} id={`${id}::${termId}`}
                    className={`${row.color === 'red' ? '!bg-red-600' : row.color === 'blue' ? '!bg-blue-500' : '!bg-emerald-500'} ${HS}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
