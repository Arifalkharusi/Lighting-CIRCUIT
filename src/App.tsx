import React, { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';

// ==========================================
// 1. TYPES
// ==========================================
export type ComponentType = 'ConsumerUnit' | 'CeilingRose' | 'OneWaySwitch' | 'TwoWaySwitch' | 'IntermediateSwitch' | 'ConnectorBlock';
export type UserMode = 'Apprentice' | 'Electrician';

export interface Terminal {
  globalId: string;
  localId: string;
  name: string;
  parentComponentId: string;
  voltage: number;
  hasNeutralPath: boolean;
  hasEarthPath: boolean;
}

export interface ElectricalComponent {
  id: string;
  type: ComponentType;
  name: string;
  position: { x: number; y: number };
  terminals: Record<string, Terminal>;
  properties: {
    isOpen?: boolean;       // OneWaySwitch: open = no connection
    switchPos?: boolean;    // Two/Intermediate: false = Pos A, true = Pos B
    isEnergized?: boolean;
  };
}

export interface FreeConductor {
  id: string;
  color: 'Brown' | 'Blue' | 'GreenYellow' | 'Yellow';
  sourceTerminalId: string;
  targetTerminalId: string;
}

interface Snapshot {
  components: Record<string, ElectricalComponent>;
  conductors: FreeConductor[];
}

// ==========================================
// 2. CIRCUIT SOLVER
// ==========================================
export function solveCircuit(
  components: Record<string, ElectricalComponent>,
  conductors: FreeConductor[]
): { components: Record<string, ElectricalComponent> } {

  const next = JSON.parse(JSON.stringify(components)) as Record<string, ElectricalComponent>;

  // Reset all non-source terminals
  Object.values(next).forEach((comp) => {
    Object.values(comp.terminals).forEach((term) => {
      if (comp.type !== 'ConsumerUnit') {
        term.voltage = 0;
        term.hasNeutralPath = false;
        term.hasEarthPath = false;
      }
    });
    if (comp.type === 'CeilingRose') comp.properties.isEnergized = false;
  });

  const findTerm = (gId: string): Terminal | null => {
    for (const comp of Object.values(next)) {
      for (const term of Object.values(comp.terminals)) {
        if (term.globalId === gId) return term;
      }
    }
    return null;
  };

  const traverse = (compId: string, localTermId: string, visited: Set<string>, mode: 'L' | 'N' | 'E') => {
    const comp = next[compId];
    if (!comp) return;
    const term = comp.terminals[localTermId];
    if (!term) return;

    const key = `${term.globalId}_${mode}`;
    if (visited.has(key)) return;
    visited.add(key);

    if (mode === 'L') term.voltage = 230;
    if (mode === 'N') term.hasNeutralPath = true;
    if (mode === 'E') term.hasEarthPath = true;

    // Internal bridges based on component type and state
    const bridges: string[] = [];

    if (comp.type === 'CeilingRose') {
      if (['N1', 'N2', 'N3'].includes(localTermId)) {
        ['N1', 'N2', 'N3'].forEach(t => { if (t !== localTermId) bridges.push(t); });
      }
      if (['LOOP1', 'LOOP2', 'LOOP3'].includes(localTermId)) {
        ['LOOP1', 'LOOP2', 'LOOP3'].forEach(t => { if (t !== localTermId) bridges.push(t); });
      }
    }

    if (comp.type === 'OneWaySwitch') {
      if (!comp.properties.isOpen) {
        if (localTermId === 'COM') bridges.push('L1');
        if (localTermId === 'L1') bridges.push('COM');
      }
    }

    if (comp.type === 'TwoWaySwitch') {
      const pos = comp.properties.switchPos ?? false;
      if (!pos) {
        if (localTermId === 'COM') bridges.push('L1');
        if (localTermId === 'L1') bridges.push('COM');
      } else {
        if (localTermId === 'COM') bridges.push('L2');
        if (localTermId === 'L2') bridges.push('COM');
      }
    }

    if (comp.type === 'IntermediateSwitch') {
      const pos = comp.properties.switchPos ?? false;
      if (!pos) {
        if (localTermId === 'L1') bridges.push('L3');
        if (localTermId === 'L3') bridges.push('L1');
        if (localTermId === 'L2') bridges.push('L4');
        if (localTermId === 'L4') bridges.push('L2');
      } else {
        if (localTermId === 'L1') bridges.push('L4');
        if (localTermId === 'L4') bridges.push('L1');
        if (localTermId === 'L2') bridges.push('L3');
        if (localTermId === 'L3') bridges.push('L2');
      }
    }

    // Connector Block: Straight-through link between Left and Right pairs for each pole
    if (comp.type === 'ConnectorBlock') {
      const poles = ['P1', 'P2', 'P3', 'P4', 'P5'];
      poles.forEach(p => {
        if (localTermId === `${p}_L`) bridges.push(`${p}_R`);
        if (localTermId === `${p}_R`) bridges.push(`${p}_L`);
      });
    }

    bridges.forEach(tid => traverse(compId, tid, visited, mode));

    // Follow conductors
    conductors.forEach(cond => {
      if (cond.sourceTerminalId === term.globalId) {
        const dest = findTerm(cond.targetTerminalId);
        if (dest) traverse(dest.parentComponentId, dest.localId, visited, mode);
      }
      if (cond.targetTerminalId === term.globalId) {
        const dest = findTerm(cond.sourceTerminalId);
        if (dest) traverse(dest.parentComponentId, dest.localId, visited, mode);
      }
    });
  };

  const cu = Object.values(next).find(c => c.type === 'ConsumerUnit');
  if (cu) {
    traverse(cu.id, 'L', new Set(), 'L');
    traverse(cu.id, 'N', new Set(), 'N');
    traverse(cu.id, 'E', new Set(), 'E');
  }

  // Energize ceiling roses
  Object.values(next).forEach(comp => {
    if (comp.type === 'CeilingRose') {
      const sl1 = comp.terminals['SL1'];
      const sl2 = comp.terminals['SL2'];
      const n1 = comp.terminals['N1'];
      const hasLive = sl1?.voltage === 230 || sl2?.voltage === 230;
      const hasNeutral = n1?.hasNeutralPath;
      comp.properties.isEnergized = !!(hasLive && hasNeutral);
    }
  });

  return { components: next };
}

// ==========================================
// 3. ZUSTAND STORE
// ==========================================
interface ElectricalState {
  components: Record<string, ElectricalComponent>;
  conductors: FreeConductor[];
  userMode: UserMode;
  selectedCoreColor: 'Brown' | 'Blue' | 'GreenYellow' | 'Yellow';
  past: Snapshot[];
  setCoreColor: (color: 'Brown' | 'Blue' | 'GreenYellow' | 'Yellow') => void;
  addComponent: (type: ComponentType, x: number, y: number) => void;
  updateComponentPosition: (id: string, x: number, y: number) => void;
  connectArbitraryTerminals: (sourceTerminalId: string, targetTerminalId: string) => void;
  toggleSwitch: (id: string) => void;
  removeConductor: (id: string) => void;
  setMode: (mode: UserMode) => void;
  clearWorkspace: () => void;
  runSimulation: () => void;
  saveHistory: () => void;
  undo: () => void;
}

const useElectricalStore = create<ElectricalState>()(
  persist(
    (set, get) => ({
      components: {},
      conductors: [],
      userMode: 'Apprentice',
      selectedCoreColor: 'Brown',
      past: [],

      saveHistory: () => {
        const { components, conductors, past } = get();
        const newSnapshot: Snapshot = JSON.parse(JSON.stringify({ components, conductors }));
        set({ past: [...past, newSnapshot].slice(-50) }); 
      },

      undo: () => {
        const { past } = get();
        if (past.length === 0) return;
        
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        
        set({
          components: previous.components,
          conductors: previous.conductors,
          past: newPast
        });
        get().runSimulation();
      },

      setCoreColor: (selectedCoreColor) => set({ selectedCoreColor }),

      addComponent: (type, x, y) => {
        get().saveHistory();
        const id = `node_${Math.random().toString(36).slice(2, 8)}`;
        const terminals: Record<string, Terminal> = {};

        if (type === 'ConsumerUnit') {
          terminals['L'] = { globalId: `${id}::L`, localId: 'L', name: 'Live Out', parentComponentId: id, voltage: 230, hasNeutralPath: false, hasEarthPath: false };
          terminals['N'] = { globalId: `${id}::N`, localId: 'N', name: 'Neutral Bar', parentComponentId: id, voltage: 0, hasNeutralPath: true, hasEarthPath: false };
          terminals['E'] = { globalId: `${id}::E`, localId: 'E', name: 'Earth Rail', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: true };
        } else if (type === 'CeilingRose') {
          ['LOOP1','LOOP2','LOOP3'].forEach(t => {
            terminals[t] = { globalId: `${id}::${t}`, localId: t, name: `Loop ${t.slice(-1)}`, parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          });
          ['N1','N2','N3'].forEach(t => {
            terminals[t] = { globalId: `${id}::${t}`, localId: t, name: `Neutral ${t.slice(-1)}`, parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          });
          ['SL1','SL2'].forEach(t => {
            terminals[t] = { globalId: `${id}::${t}`, localId: t, name: `Switched Live ${t.slice(-1)}`, parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          });
          terminals['E'] = { globalId: `${id}::E`, localId: 'E', name: 'Earth Terminal', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
        } else if (type === 'OneWaySwitch') {
          terminals['COM'] = { globalId: `${id}::COM`, localId: 'COM', name: 'Common', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          terminals['L1'] = { globalId: `${id}::L1`, localId: 'L1', name: 'L1 Out', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          terminals['E'] = { globalId: `${id}::E`, localId: 'E', name: 'Earth', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
        } else if (type === 'TwoWaySwitch') {
          terminals['COM'] = { globalId: `${id}::COM`, localId: 'COM', name: 'Common', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          terminals['L1'] = { globalId: `${id}::L1`, localId: 'L1', name: 'L1 (Pos 1)', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          terminals['L2'] = { globalId: `${id}::L2`, localId: 'L2', name: 'L2 (Pos 2)', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          terminals['E'] = { globalId: `${id}::E`, localId: 'E', name: 'Earth', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
        } else if (type === 'IntermediateSwitch') {
          terminals['L1'] = { globalId: `${id}::L1`, localId: 'L1', name: 'L1 In', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          terminals['L2'] = { globalId: `${id}::L2`, localId: 'L2', name: 'L2 In', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          terminals['L3'] = { globalId: `${id}::L3`, localId: 'L3', name: 'L3 Out', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          terminals['L4'] = { globalId: `${id}::L4`, localId: 'L4', name: 'L4 Out', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          terminals['E'] = { globalId: `${id}::E`, localId: 'E', name: 'Earth', parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
        } else if (type === 'ConnectorBlock') {
          ['P1', 'P2', 'P3', 'P4', 'P5'].forEach(p => {
            terminals[`${p}_L`] = { globalId: `${id}::${p}_L`, localId: `${p}_L`, name: `${p} Left`, parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
            terminals[`${p}_R`] = { globalId: `${id}::${p}_R`, localId: `${p}_R`, name: `${p} Right`, parentComponentId: id, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
          });
        }

        const props =
          type === 'OneWaySwitch' ? { isOpen: true } :
          (type === 'TwoWaySwitch' || type === 'IntermediateSwitch') ? { switchPos: false } :
          { isEnergized: false };

        const newComp: ElectricalComponent = { id, type, name: type, position: { x, y }, terminals, properties: props };
        set(state => ({ components: { ...state.components, [id]: newComp } }));
        get().runSimulation();
      },

      updateComponentPosition: (id, x, y) => {
        get().saveHistory();
        set(state => ({
          components: { ...state.components, [id]: { ...state.components[id], position: { x, y } } }
        }));
      },

      connectArbitraryTerminals: (sourceTerminalId, targetTerminalId) => {
        if (sourceTerminalId === targetTerminalId) return;
        const exists = get().conductors.find(
          c => (c.sourceTerminalId === sourceTerminalId && c.targetTerminalId === targetTerminalId) ||
               (c.sourceTerminalId === targetTerminalId && c.targetTerminalId === sourceTerminalId)
        );
        if (exists) return;

        get().saveHistory();
        
        const color = get().selectedCoreColor;
        const newCond: FreeConductor = {
          id: `wire_${Math.random().toString(36).substr(2, 5)}`,
          color, sourceTerminalId, targetTerminalId
        };
        set(state => ({ conductors: [...state.conductors, newCond] }));
        get().runSimulation();
      },

      toggleSwitch: (id) => {
        const comp = get().components[id];
        if (!comp) return;

        get().saveHistory();

        if (comp.type === 'OneWaySwitch') {
          set(state => ({
            components: { ...state.components, [id]: { ...comp, properties: { ...comp.properties, isOpen: !comp.properties.isOpen } } }
          }));
        } else if (comp.type === 'TwoWaySwitch' || comp.type === 'IntermediateSwitch') {
          set(state => ({
            components: { ...state.components, [id]: { ...comp, properties: { ...comp.properties, switchPos: !comp.properties.switchPos } } }
          }));
        }
        get().runSimulation();
      },

      removeConductor: (id) => {
        get().saveHistory();
        set(state => ({ conductors: state.conductors.filter(c => c.id !== id) }));
        get().runSimulation();
      },

      setMode: (userMode) => set({ userMode }),
      
      clearWorkspace: () => {
        get().saveHistory();
        set({ components: {}, conductors: [] });
      },
      
      runSimulation: () => {
        const { components, conductors } = get();
        const solved = solveCircuit(components, conductors);
        set({ components: solved.components });
      }
    }),
    { name: 'uk-wiring-system-v14-connector' }
  )
);

// ==========================================
// 4. SHARED HANDLE STYLE
// ==========================================
const HS = "!w-4 !h-4 !border-2 !border-zinc-950 !shadow-sm !relative !left-0 !top-0 !transform-none cursor-pointer hover:!scale-110 transition-transform z-50";

// ==========================================
// 5. NODE COMPONENTS
// ==========================================

const ConsumerUnitNode: React.FC<{ id: string }> = ({ id }) => (
  <div className="w-56 bg-zinc-950 border-2 border-zinc-700 rounded-lg p-4 shadow-2xl text-white">
    <div className="border-b border-zinc-800 pb-2 mb-3">
      <h3 className="text-xs font-bold tracking-tight text-zinc-100">Main Consumer Board</h3>
      <span className="text-[9px] text-zinc-500 font-mono block">Source Isolation Rail · 230V AC</span>
    </div>
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between bg-zinc-900 p-2 rounded relative">
        <span className="text-red-400 font-bold">L — Live Feed</span>
        <Handle type="source" position={Position.Right} id={`${id}::L`} className={`!bg-red-600 ${HS}`} />
      </div>
      <div className="flex items-center justify-between bg-zinc-900 p-2 rounded relative">
        <span className="text-blue-400 font-bold">N — Neutral Bar</span>
        <Handle type="source" position={Position.Right} id={`${id}::N`} className={`!bg-blue-500 ${HS}`} />
      </div>
      <div className="flex items-center justify-between bg-zinc-900 p-2 rounded relative">
        <span className="text-emerald-400 font-bold">E — CPC Earth</span>
        <Handle type="source" position={Position.Right} id={`${id}::E`} className={`!bg-emerald-500 ${HS}`} />
      </div>
    </div>
  </div>
);

const RealisticCeilingRoseNode: React.FC<{ id: string; data: any }> = ({ id, data }) => {
  const isLit = data.properties?.isEnergized;
  return (
    <div className={`w-72 h-72 rounded-full bg-zinc-900 border-4 transition-all duration-300 relative flex flex-col items-center justify-center p-4 ${isLit ? 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.5)]' : 'border-zinc-700 shadow-2xl'}`}>
      <div className="absolute inset-2 border-2 border-dashed border-zinc-800 rounded-full pointer-events-none" />
      <div className="text-center mb-1 z-10 select-none">
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">UK Ceiling Rose</span>
        <span className="text-[8px] text-zinc-600 font-mono">BS EN 60669-1</span>
      </div>

      <div className="w-full grid grid-cols-3 gap-x-2 gap-y-4 px-2 mt-2 z-10">
        <div className="bg-zinc-950/90 p-2 border border-blue-900/50 rounded flex flex-col space-y-2">
          <span className="text-[8px] text-blue-400 font-bold font-mono text-center">NEUTRAL</span>
          <div className="flex justify-around items-center h-4">
            <Handle type="source" position={Position.Top} id={`${id}::N1`} className={`!bg-blue-500 ${HS}`} />
            <Handle type="source" position={Position.Top} id={`${id}::N2`} className={`!bg-blue-500 ${HS}`} />
            <Handle type="source" position={Position.Top} id={`${id}::N3`} className={`!bg-blue-500 ${HS}`} />
          </div>
        </div>

        <div className="bg-zinc-950/90 p-2 border border-red-900/50 rounded flex flex-col space-y-2">
          <span className="text-[8px] text-red-400 font-bold font-mono text-center">LOOP-IN</span>
          <div className="flex justify-around items-center h-4">
            <Handle type="source" position={Position.Top} id={`${id}::LOOP1`} className={`!bg-red-600 ${HS}`} />
            <Handle type="source" position={Position.Top} id={`${id}::LOOP2`} className={`!bg-red-600 ${HS}`} />
            <Handle type="source" position={Position.Top} id={`${id}::LOOP3`} className={`!bg-red-600 ${HS}`} />
          </div>
        </div>

        <div className="bg-zinc-950/90 p-2 border border-amber-900/50 rounded flex flex-col space-y-2">
          <span className="text-[8px] text-amber-500 font-bold font-mono text-center">SW LIVE</span>
          <div className="flex justify-around items-center h-4">
            <Handle type="source" position={Position.Top} id={`${id}::SL1`} className={`!bg-amber-500 ${HS}`} />
            <Handle type="source" position={Position.Top} id={`${id}::SL2`} className={`!bg-amber-500 ${HS}`} />
          </div>
        </div>
      </div>

      <div className="mt-5 bg-zinc-950/90 px-4 py-2 border border-emerald-900/50 rounded flex items-center space-x-3 z-10">
        <span className="text-[8px] text-emerald-400 font-bold font-mono">CPC EARTH</span>
        <Handle type="source" position={Position.Bottom} id={`${id}::E`} className={`!bg-emerald-500 ${HS}`} />
      </div>

      <div className="mt-4 flex items-center space-x-2 bg-black/40 px-3 py-1 rounded-full border border-zinc-800">
        <div className={`w-3 h-3 rounded-full transition-all ${isLit ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse' : 'bg-zinc-800'}`} />
        <span className="text-[9px] font-mono text-zinc-400">Lamp: {isLit ? 'ON — 230V' : 'OFF'}</span>
      </div>
    </div>
  );
};

const RealisticOneWaySwitchNode: React.FC<{ id: string; data: any }> = ({ id, data }) => {
  const isOpen = data.properties?.isOpen;
  const toggle = useElectricalStore(s => s.toggleSwitch);
  return (
    <div className="w-56 h-72 bg-zinc-900 border-4 border-zinc-700 rounded-xl p-4 shadow-2xl relative flex flex-col justify-between">
      <div className="absolute inset-1 border border-zinc-800 rounded-lg pointer-events-none" />
      <div className="flex justify-between items-start border-b border-zinc-800 pb-2 z-10">
        <div>
          <h3 className="text-xs font-bold text-zinc-200">1-Way Switch</h3>
          <span className="text-[8px] font-mono text-zinc-500">Rear Chassis</span>
        </div>
        <button onClick={() => toggle(id)}
          className={`px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded border transition-all ${isOpen ? 'bg-zinc-950 text-zinc-400 border-zinc-800' : 'bg-amber-500 text-black border-amber-400 shadow-lg'}`}>
          {isOpen ? 'Open' : 'Closed'}
        </button>
      </div>

      <div className="space-y-3 my-auto px-1 z-10">
        {[{ id: 'COM', label: 'COM', sub: 'Common Feed' }, { id: 'L1', label: 'L1', sub: 'Switched Out' }].map(t => (
          <div key={t.id} className="bg-zinc-950 border border-zinc-800 rounded p-2 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-300 font-mono">{t.label}</span>
              <span className="text-[8px] text-zinc-500">{t.sub}</span>
            </div>
            <div className="w-8 h-8 rounded bg-amber-900/40 border border-amber-600/50 flex items-center justify-center relative">
              <Handle type="source" position={Position.Right} id={`${id}::${t.id}`} className={`!bg-amber-500 ${HS}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-950 border border-emerald-900/40 rounded p-2 flex items-center justify-between mt-2 z-10">
        <span className="text-[8px] font-bold font-mono text-emerald-400">EARTH</span>
        <div className="w-8 h-8 rounded bg-emerald-900/30 border border-emerald-600/50 flex items-center justify-center relative">
          <Handle type="source" position={Position.Bottom} id={`${id}::E`} className={`!bg-emerald-500 ${HS}`} />
        </div>
      </div>
    </div>
  );
};

// Two-Way Switch
const RealisticTwoWaySwitchNode: React.FC<{ id: string; data: any }> = ({ id, data }) => {
  const pos = data.properties?.switchPos ?? false;
  const toggle = useElectricalStore(s => s.toggleSwitch);
  return (
    <div className="w-56 bg-zinc-900 border-4 border-indigo-800 rounded-xl p-4 shadow-2xl relative flex flex-col gap-3">
      <div className="absolute inset-1 border border-zinc-800 rounded-lg pointer-events-none" />

      <div className="flex justify-between items-start border-b border-zinc-800 pb-2 z-10">
        <div>
          <h3 className="text-xs font-bold text-indigo-300">2-Way Switch</h3>
          <span className="text-[8px] font-mono text-zinc-500">Strapwire Control</span>
        </div>
        <button onClick={() => toggle(id)}
          className={`px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded border transition-all ${!pos ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-violet-600 text-white border-violet-400'}`}>
          {!pos ? 'Pos A' : 'Pos B'}
        </button>
      </div>

      <div className="z-10 bg-zinc-950 rounded p-2 flex items-center justify-center gap-3 text-[9px] font-mono">
        <span className="text-zinc-400">COM</span>
        <div className="flex flex-col items-center gap-0.5">
          <div className={`w-10 h-0.5 transition-all ${!pos ? 'bg-indigo-400' : 'bg-zinc-700'}`} />
          <span className={`text-[8px] ${!pos ? 'text-indigo-400' : 'text-zinc-600'}`}>→ L1</span>
          <div className={`w-10 h-0.5 transition-all ${pos ? 'bg-violet-400' : 'bg-zinc-700'}`} />
          <span className={`text-[8px] ${pos ? 'text-violet-400' : 'text-zinc-600'}`}>→ L2</span>
        </div>
      </div>

      <div className="space-y-2 z-10">
        {[
          { id: 'COM', label: 'COM', sub: 'Common', color: 'amber' },
          { id: 'L1', label: 'L1', sub: 'Position A', color: 'indigo' },
          { id: 'L2', label: 'L2', sub: 'Position B', color: 'violet' }
        ].map(t => (
          <div key={t.id} className={`bg-zinc-950 border border-zinc-800 rounded p-2 flex items-center justify-between`}>
            <div className="flex flex-col">
              <span className={`text-[10px] font-bold font-mono text-${t.color}-300`}>{t.label}</span>
              <span className="text-[8px] text-zinc-500">{t.sub}</span>
            </div>
            <div className={`w-8 h-8 rounded bg-${t.color}-900/40 border border-${t.color}-600/50 flex items-center justify-center relative`}>
              <Handle type="source" position={Position.Right} id={`${id}::${t.id}`}
                className={`${t.color === 'amber' ? '!bg-amber-500' : t.color === 'indigo' ? '!bg-indigo-500' : '!bg-violet-500'} ${HS}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-950 border border-emerald-900/40 rounded p-2 flex items-center justify-between z-10">
        <span className="text-[8px] font-bold font-mono text-emerald-400">EARTH</span>
        <div className="w-8 h-8 rounded bg-emerald-900/30 border border-emerald-600/50 flex items-center justify-center relative">
          <Handle type="source" position={Position.Bottom} id={`${id}::E`} className={`!bg-emerald-500 ${HS}`} />
        </div>
      </div>
    </div>
  );
};

// Intermediate Switch
const RealisticIntermediateSwitchNode: React.FC<{ id: string; data: any }> = ({ id, data }) => {
  const pos = data.properties?.switchPos ?? false;
  const toggle = useElectricalStore(s => s.toggleSwitch);
  return (
    <div className="w-64 bg-zinc-900 border-4 border-fuchsia-800 rounded-xl p-4 shadow-2xl relative flex flex-col gap-3">
      <div className="absolute inset-1 border border-zinc-800 rounded-lg pointer-events-none" />

      <div className="flex justify-between items-start border-b border-zinc-800 pb-2 z-10">
        <div>
          <h3 className="text-xs font-bold text-fuchsia-300">Intermediate Switch</h3>
          <span className="text-[8px] font-mono text-zinc-500">3-Way Midpoint</span>
        </div>
        <button onClick={() => toggle(id)}
          className={`px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded border transition-all ${!pos ? 'bg-fuchsia-600 text-white border-fuchsia-400' : 'bg-pink-600 text-white border-pink-400'}`}>
          {!pos ? 'Straight' : 'Crossed'}
        </button>
      </div>

      <div className="z-10 bg-zinc-950 rounded p-3 flex flex-col items-center justify-center gap-2 text-[9px] font-mono border border-zinc-800">
        <span className="text-zinc-500 mb-1">Internal Bridge</span>
        <div className="flex items-center gap-4 relative h-8 w-24">
          <span className="absolute left-0 top-0 text-zinc-400">L1</span>
          <span className="absolute left-0 bottom-0 text-zinc-400">L2</span>
          
          {!pos ? (
            <svg className="absolute left-4 top-1 w-16 h-6 stroke-fuchsia-400" viewBox="0 0 64 24" fill="none" strokeWidth="2">
              <path d="M0 2 L64 2" />
              <path d="M0 22 L64 22" />
            </svg>
          ) : (
            <svg className="absolute left-4 top-1 w-16 h-6 stroke-pink-400" viewBox="0 0 64 24" fill="none" strokeWidth="2">
              <path d="M0 2 L64 22" />
              <path d="M0 22 L64 2" />
            </svg>
          )}

          <span className="absolute right-0 top-0 text-zinc-400">L3</span>
          <span className="absolute right-0 bottom-0 text-zinc-400">L4</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 z-10">
        <div className="space-y-2">
          {[{ id: 'L1', label: 'L1', sub: 'In A' }, { id: 'L2', label: 'L2', sub: 'In B' }].map(t => (
            <div key={t.id} className="bg-zinc-950 border border-zinc-800 rounded p-2 flex flex-col items-start relative">
              <span className="text-[10px] font-bold font-mono text-fuchsia-300">{t.label}</span>
              <span className="text-[8px] text-zinc-500">{t.sub}</span>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-fuchsia-900/40 border border-fuchsia-600/50 flex items-center justify-center">
                <Handle type="target" position={Position.Left} id={`${id}::${t.id}`} className={`!bg-fuchsia-500 ${HS}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[{ id: 'L3', label: 'L3', sub: 'Out A' }, { id: 'L4', label: 'L4', sub: 'Out B' }].map(t => (
            <div key={t.id} className="bg-zinc-950 border border-zinc-800 rounded p-2 flex flex-col items-end relative text-right">
              <span className="text-[10px] font-bold font-mono text-pink-300">{t.label}</span>
              <span className="text-[8px] text-zinc-500">{t.sub}</span>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-pink-900/40 border border-pink-600/50 flex items-center justify-center">
                <Handle type="source" position={Position.Right} id={`${id}::${t.id}`} className={`!bg-pink-500 ${HS}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-950 border border-emerald-900/40 rounded p-2 flex items-center justify-between z-10">
        <span className="text-[8px] font-bold font-mono text-emerald-400">EARTH</span>
        <div className="w-8 h-8 rounded bg-emerald-900/30 border border-emerald-600/50 flex items-center justify-center relative">
          <Handle type="source" position={Position.Bottom} id={`${id}::E`} className={`!bg-emerald-500 ${HS}`} />
        </div>
      </div>
    </div>
  );
};

// 5-Pole General Connector Block Component (Junction Box)
const ConnectorBlockNode: React.FC<{ id: string }> = ({ id }) => {
  const poles = [
    { label: 'Pole 1', id: 'P1' },
    { label: 'Pole 2', id: 'P2' },
    { label: 'Pole 3', id: 'P3' },
    { label: 'Pole 4', id: 'P4' },
    { label: 'Pole 5', id: 'P5' },
  ];

  return (
    <div className="w-60 bg-stone-900 border-4 border-stone-700 rounded-lg p-3 shadow-2xl relative flex flex-col gap-2">
      <div className="absolute inset-0.5 border border-stone-800 rounded pointer-events-none" />
      
      <div className="border-b border-stone-800 pb-1.5 z-10">
        <h3 className="text-xs font-bold text-stone-300 tracking-wide">5-Pole Connector Block</h3>
        <span className="text-[8px] font-mono text-stone-500 block">Isolated Junction Terminals</span>
      </div>

      <div className="space-y-1.5 z-10">
        {poles.map(p => (
          <div key={p.id} className="grid grid-cols-5 items-center bg-stone-950 border border-stone-800 rounded p-1.5 relative">
            
            {/* Left Port Handle */}
            <div className="col-span-1 flex justify-start items-center relative">
              <div className="w-5 h-5 bg-stone-800 border border-stone-600 rounded flex items-center justify-center">
                <Handle type="source" position={Position.Left} id={`${id}::${p.id}_L`} className={`!bg-stone-500 ${HS}`} />
              </div>
            </div>

            {/* Internal Brass Bridge Identifier */}
            <div className="col-span-3 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-1 bg-amber-600/70 rounded-full mb-0.5" />
              <span className="text-[9px] font-mono font-bold text-stone-400">{p.label}</span>
            </div>

            {/* Right Port Handle */}
            <div className="col-span-1 flex justify-end items-center relative">
              <div className="w-5 h-5 bg-stone-800 border border-stone-600 rounded flex items-center justify-center">
                <Handle type="source" position={Position.Right} id={`${id}::${p.id}_R`} className={`!bg-stone-500 ${HS}`} />
              </div>
            </div>

          </div>
        ))}
      </div>
      
      <div className="text-[7px] font-mono text-stone-600 text-center select-none uppercase tracking-wider pt-0.5 border-t border-stone-800/60">
        Maintenance Free Choc-Box Strip
      </div>
    </div>
  );
};

const nodeTypes = {
  ConsumerUnit: ConsumerUnitNode,
  CeilingRose: RealisticCeilingRoseNode,
  OneWaySwitch: RealisticOneWaySwitchNode,
  TwoWaySwitch: RealisticTwoWaySwitchNode,
  IntermediateSwitch: RealisticIntermediateSwitchNode,
  ConnectorBlock: ConnectorBlockNode,
};

// ==========================================
// 6. CANVAS
// ==========================================
export const SimulatorCanvas: React.FC = () => {
  const { components, conductors, addComponent, updateComponentPosition, connectArbitraryTerminals, removeConductor } = useElectricalStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    setNodes(Object.values(components).map(comp => ({
      id: comp.id,
      type: comp.type,
      position: comp.position,
      data: { properties: comp.properties },
    })));
  }, [components, setNodes]);

  useEffect(() => {
    const colorMap: Record<string, string> = {
      Brown: '#b45309',
      Blue: '#3b82f6',
      GreenYellow: '#10b981',
      Yellow: '#eab308',
    };
    setEdges(conductors.map(c => ({
      id: c.id,
      source: c.sourceTerminalId.split('::')[0],
      target: c.targetTerminalId.split('::')[0],
      sourceHandle: c.sourceTerminalId,
      targetHandle: c.targetTerminalId,
      animated: true,
      type: 'bezier',
      zIndex: 50,
      deletable: true,
      style: {
        stroke: colorMap[c.color] ?? '#888',
        strokeWidth: 5,
        filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.8))',
      },
    })));
  }, [conductors, setEdges]);

  const onNodeDragStop = useCallback((_: any, node: any) => {
    updateComponentPosition(node.id, node.position.x, node.position.y);
  }, [updateComponentPosition]);

  const onConnect = useCallback((conn: any) => {
    if (conn.sourceHandle && conn.targetHandle) connectArbitraryTerminals(conn.sourceHandle, conn.targetHandle);
  }, [connectArbitraryTerminals]);

  const handleEdgesChange = useCallback((changes: any[]) => {
    changes.forEach(change => {
      if (change.type === 'remove') removeConductor(change.id);
    });
    onEdgesChange(changes);
  }, [onEdgesChange, removeConductor]);

  return (
    <div className="w-full h-full bg-[#0a0a0c]"
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        const type = e.dataTransfer.getData('application/reactflow') as ComponentType;
        if (!type) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        addComponent(type, e.clientX - bounds.left - 100, e.clientY - bounds.top - 100);
      }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={handleEdgesChange}
        onNodeDragStop={onNodeDragStop} onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={() => true}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView>
        <Background color="#1a1a1e" gap={16} size={1} />
        <Controls className="!bg-zinc-900 !border-zinc-800 text-white fill-white shadow-2xl" />
      </ReactFlow>
    </div>
  );
};

// ==========================================
// 7. TOOLBOX SIDEBAR
// ==========================================
export const Toolbox: React.FC = () => {
  const { selectedCoreColor, setCoreColor, clearWorkspace, undo, past } = useElectricalStore();

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-80 bg-[#111114] border-r border-zinc-800/90 p-4 text-zinc-200 flex flex-col justify-between z-50 relative overflow-y-auto">
      <div className="space-y-6">

        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Conductor Colour</span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'Brown', name: 'Live (Brn)', bg: 'bg-amber-700' },
              { id: 'Blue', name: 'Neutral (Blu)', bg: 'bg-blue-500' },
              { id: 'GreenYellow', name: 'Earth (G/Y)', bg: 'bg-emerald-500' },
              { id: 'Yellow', name: 'Strapwire (Ylw)', bg: 'bg-yellow-400' },
            ].map(wire => (
              <button key={wire.id} onClick={() => setCoreColor(wire.id as any)}
                className={`p-2 rounded text-[11px] font-mono font-medium border flex items-center gap-2 transition-all ${selectedCoreColor === wire.id ? 'border-amber-400 bg-zinc-900 text-white' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${wire.bg}`} />
                {wire.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Component Inventory</span>
          <div className="space-y-2">
            {[
              { type: 'ConsumerUnit', name: 'UK Consumer Unit', desc: '230V L/N/E source' },
              { type: 'CeilingRose', name: 'Ceiling Rose', desc: 'Loop-in / SW-live / Neutral' },
              { type: 'OneWaySwitch', name: '1-Way Switch', desc: 'COM → L1 (open/close)' },
              { type: 'TwoWaySwitch', name: '2-Way Switch', desc: 'COM → L1 or L2' },
              { type: 'IntermediateSwitch', name: 'Intermediate Switch', desc: 'Crosses strap wires for 3+ switches' },
              { type: 'ConnectorBlock', name: '5-Pole Connector Block', desc: 'Pass-through inline junction box' },
            ].map(item => (
              <div key={item.type} draggable onDragStart={e => handleDragStart(e, item.type as ComponentType)}
                className={`p-3 bg-zinc-900 border rounded cursor-grab active:cursor-grabbing hover:bg-zinc-800 select-none transition-colors 
                  ${item.type === 'ConnectorBlock' ? 'border-stone-600 hover:border-stone-400' : item.type === 'IntermediateSwitch' ? 'border-fuchsia-800/60 hover:border-fuchsia-600' : 'border-zinc-800/80'}`}>
                <div className="text-xs font-medium text-zinc-200">{item.name}</div>
                <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wiring guide */}
        <div className="bg-zinc-950 border border-zinc-800 rounded p-3 text-[9px] font-mono text-zinc-500 space-y-1">
          <div className="text-amber-400 font-bold text-[10px] mb-2">Component Tips</div>
          <div className="text-zinc-400 font-bold">Connector Block:</div>
          <div>Left ports bridge directly to their corresponding Right ports. Useful for splitting feeds or extending cables cleanly.</div>
        </div>

        {/* Undo and Reset Canvas Actions */}
        <div className="flex gap-2">
          <button 
            onClick={undo} 
            disabled={past.length === 0}
            className={`flex-1 py-2 text-xs rounded border transition-colors flex items-center justify-center gap-2
              ${past.length > 0 
                ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200' 
                : 'bg-zinc-950 border-zinc-900 text-zinc-600 cursor-not-allowed'}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
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

      <div className="mt-4 bg-zinc-950 p-3 rounded border border-zinc-800/80 font-mono text-[10px] text-zinc-500 space-y-1">
        <div className="text-emerald-500 font-bold">✓ Circuit Solver v14</div>
        <div>● 5-Pole pass-through logic active</div>
      </div>
    </aside>
  );
};

// ==========================================
// 8. APP SHELL
// ==========================================
export default function App() {
  const { userMode, setMode } = useElectricalStore();

  return (
    <div className="w-screen h-screen flex flex-col bg-[#08080a] text-zinc-200 select-none overflow-hidden">
      <header className="h-14 bg-[#0f0f12] border-b border-zinc-900 px-5 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 text-black px-2 py-0.5 rounded text-[10px] font-black tracking-tight">UK WIRING</div>
          <h1 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
            Electrical Lighting Simulator
            <span className="text-zinc-600 font-mono text-[11px] font-normal lowercase pl-2">v9.0 — Junction Connector Block</span>
          </h1>
        </div>
        <div className="flex bg-zinc-950 border border-zinc-800 p-0.5 rounded">
          {(['Apprentice', 'Electrician'] as UserMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1 text-xs rounded font-medium transition-all ${userMode === m ? 'bg-amber-500 text-black font-semibold' : 'text-zinc-400 hover:text-zinc-200'}`}>
              {m} Mode
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Toolbox />
        <main className="flex-1 relative overflow-hidden">
          <SimulatorCanvas />
        </main>
      </div>
    </div>
  );
}