import React from 'react';
import { Handle, Position } from 'reactflow';
import { HS } from './shared';

export const ConsumerUnitNode: React.FC<{ id: string }> = ({ id }) => (
  <div className="w-60 bg-slate-950 border-2 border-amber-700/60 rounded-xl p-4 shadow-2xl text-white">
    <div className="border-b border-slate-800 pb-2 mb-3 flex items-center justify-between">
      <div>
        <h3 className="text-xs font-bold tracking-tight text-slate-100">Consumer Unit</h3>
        <span className="text-[9px] text-amber-500/80 font-mono block">Main isolation rail · 230V AC</span>
      </div>
      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
    </div>
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between bg-slate-900 p-2 rounded relative">
        <span className="text-red-400 font-bold">L — Live Feed</span>
        <Handle type="source" position={Position.Right} id={`${id}::L`} className={`!bg-red-600 ${HS}`} />
      </div>
      <div className="flex items-center justify-between bg-slate-900 p-2 rounded relative">
        <span className="text-blue-400 font-bold">N — Neutral Bar</span>
        <Handle type="source" position={Position.Right} id={`${id}::N`} className={`!bg-blue-500 ${HS}`} />
      </div>
      <div className="flex items-center justify-between bg-slate-900 p-2 rounded relative">
        <span className="text-emerald-400 font-bold">E — CPC Earth</span>
        <Handle type="source" position={Position.Right} id={`${id}::E`} className={`!bg-emerald-500 ${HS}`} />
      </div>
    </div>
  </div>
);
