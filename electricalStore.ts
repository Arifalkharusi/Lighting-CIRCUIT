import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ComponentType,
  ElectricalComponent,
  FreeConductor,
  Terminal,
  UserMode,
  CoreColor,
  CableCSA,
  Snapshot,
} from '../types';

// ==========================================
// TERMINAL FACTORY
// One entry per component type — defines every physical terminal a
// component exposes. Kept as an explicit table (rather than generated)
// so each terminal's name/purpose is easy to audit against BS 7671 practice.
// ==========================================
function term(id: string, localId: string, name: string, parentComponentId: string): Terminal {
  return { globalId: `${id}::${localId}`, localId, name, parentComponentId, voltage: 0, hasNeutralPath: false, hasEarthPath: false };
}

function buildTerminals(type: ComponentType, id: string): Record<string, Terminal> {
  const t: Record<string, Terminal> = {};
  const add = (localId: string, name: string) => { t[localId] = term(id, localId, name, id); };

  switch (type) {
    case 'ConsumerUnit':
      add('L', 'Live Out'); add('N', 'Neutral Bar'); add('E', 'Earth Rail');
      break;

    case 'CeilingRose':
      add('LOOP1', 'Loop 1'); add('LOOP2', 'Loop 2'); add('LOOP3', 'Loop 3');
      add('N1', 'Neutral 1'); add('N2', 'Neutral 2'); add('N3', 'Neutral 3');
      add('SL1', 'Switched Live 1'); add('SL2', 'Switched Live 2');
      add('E', 'Earth Terminal');
      break;

    case 'OneWaySwitch':
    case 'DimmerSwitch':
      add('COM', 'Common'); add('L1', 'L1 Out'); add('E', 'Earth');
      break;

    case 'TwoWaySwitch':
      add('COM', 'Common'); add('L1', 'L1 (Pos 1)'); add('L2', 'L2 (Pos 2)'); add('E', 'Earth');
      break;

    case 'IntermediateSwitch':
      add('L1', 'L1 In'); add('L2', 'L2 In'); add('L3', 'L3 Out'); add('L4', 'L4 Out'); add('E', 'Earth');
      break;

    case 'PendantLight':
    case 'DownlightSpot':
    case 'BattenHolder':
    case 'WallLight':
    case 'Boiler':
    case 'ImmersionHeater':
    case 'ExtractorFan':
      add('L', 'Live In'); add('N', 'Neutral In'); add('E', 'Earth In');
      break;

    case 'SingleSocket':
    case 'DoubleSocket':
    case 'OutdoorSocket':
    case 'USBSocket':
      add('L1', 'Live 1'); add('L2', 'Live 2');
      add('N1', 'Neutral 1'); add('N2', 'Neutral 2');
      add('E1', 'Earth 1'); add('E2', 'Earth 2');
      break;

    case 'FCUSwitched':
    case 'FCUUnswitched':
      add('L_IN', 'Live In'); add('N_IN', 'Neutral In'); add('E_IN', 'Earth In');
      add('L_OUT', 'Live Out (fused)'); add('N_OUT', 'Neutral Out'); add('E_OUT', 'Earth Out');
      break;

    case 'CookerControlUnit':
      add('L_IN', 'Live In'); add('N_IN', 'Neutral In'); add('E_IN', 'Earth In');
      add('L_OUT', 'Live Out (cooker)'); add('N_OUT', 'Neutral Out'); add('E_OUT', 'Earth Out');
      add('SKT_L', 'Socket Live'); add('SKT_N', 'Socket Neutral'); add('SKT_E', 'Socket Earth');
      break;

    case 'ConnectorBlock':
      ['P1', 'P2', 'P3', 'P4', 'P5'].forEach(p => {
        add(`${p}_L`, `${p} Left`); add(`${p}_R`, `${p} Right`);
      });
      break;

    case 'JunctionBox4T':
      ['L1', 'L2', 'L3', 'L4'].forEach(x => add(x, `Core ${x}`));
      ['N1', 'N2', 'N3', 'N4'].forEach(x => add(x, `Neutral ${x}`));
      ['E1', 'E2', 'E3', 'E4'].forEach(x => add(x, `Earth ${x}`));
      break;
  }
  return t;
}

function defaultProperties(type: ComponentType) {
  if (type === 'OneWaySwitch' || type === 'DimmerSwitch') return { isOpen: true, dimLevel: 100 };
  if (type === 'TwoWaySwitch' || type === 'IntermediateSwitch') return { switchPos: false };
  if (type === 'FCUSwitched') return { isOn: true };
  return { isEnergized: false };
}

// ==========================================
// CIRCUIT SOLVER
// Traces L / N / E continuity from the Consumer Unit through every
// component's internal bridging rules and every manually-drawn conductor.
// ==========================================
export function solveCircuit(
  components: Record<string, ElectricalComponent>,
  conductors: FreeConductor[]
): { components: Record<string, ElectricalComponent> } {
  const next = JSON.parse(JSON.stringify(components)) as Record<string, ElectricalComponent>;

  Object.values(next).forEach((comp) => {
    Object.values(comp.terminals).forEach((t) => {
      if (comp.type !== 'ConsumerUnit') {
        t.voltage = 0; t.hasNeutralPath = false; t.hasEarthPath = false;
      }
    });
    if (comp.type !== 'ConsumerUnit') comp.properties.isEnergized = false;
  });

  const findTerm = (gId: string): Terminal | null => {
    for (const comp of Object.values(next)) {
      for (const t of Object.values(comp.terminals)) if (t.globalId === gId) return t;
    }
    return null;
  };

  const traverse = (compId: string, localTermId: string, visited: Set<string>, mode: 'L' | 'N' | 'E') => {
    const comp = next[compId];
    if (!comp) return;
    const t = comp.terminals[localTermId];
    if (!t) return;

    const key = `${t.globalId}_${mode}`;
    if (visited.has(key)) return;
    visited.add(key);

    if (mode === 'L') t.voltage = 230;
    if (mode === 'N') t.hasNeutralPath = true;
    if (mode === 'E') t.hasEarthPath = true;

    const bridges: string[] = [];

    if (comp.type === 'CeilingRose') {
      if (['N1', 'N2', 'N3'].includes(localTermId)) ['N1', 'N2', 'N3'].forEach(x => { if (x !== localTermId) bridges.push(x); });
      if (['LOOP1', 'LOOP2', 'LOOP3'].includes(localTermId)) ['LOOP1', 'LOOP2', 'LOOP3'].forEach(x => { if (x !== localTermId) bridges.push(x); });
    }

    if (comp.type === 'OneWaySwitch' || comp.type === 'DimmerSwitch') {
      if (!comp.properties.isOpen) {
        if (localTermId === 'COM') bridges.push('L1');
        if (localTermId === 'L1') bridges.push('COM');
      }
    }

    if (comp.type === 'TwoWaySwitch') {
      const pos = comp.properties.switchPos ?? false;
      if (!pos) { if (localTermId === 'COM') bridges.push('L1'); if (localTermId === 'L1') bridges.push('COM'); }
      else { if (localTermId === 'COM') bridges.push('L2'); if (localTermId === 'L2') bridges.push('COM'); }
    }

    if (comp.type === 'IntermediateSwitch') {
      const pos = comp.properties.switchPos ?? false;
      if (!pos) {
        if (localTermId === 'L1') bridges.push('L3'); if (localTermId === 'L3') bridges.push('L1');
        if (localTermId === 'L2') bridges.push('L4'); if (localTermId === 'L4') bridges.push('L2');
      } else {
        if (localTermId === 'L1') bridges.push('L4'); if (localTermId === 'L4') bridges.push('L1');
        if (localTermId === 'L2') bridges.push('L3'); if (localTermId === 'L3') bridges.push('L2');
      }
    }

    if (comp.type === 'ConnectorBlock') {
      ['P1', 'P2', 'P3', 'P4', 'P5'].forEach(p => {
        if (localTermId === `${p}_L`) bridges.push(`${p}_R`);
        if (localTermId === `${p}_R`) bridges.push(`${p}_L`);
      });
    }

    if (comp.type === 'JunctionBox4T') {
      const group = localTermId.startsWith('L') ? ['L1', 'L2', 'L3', 'L4']
        : localTermId.startsWith('N') ? ['N1', 'N2', 'N3', 'N4']
        : ['E1', 'E2', 'E3', 'E4'];
      group.forEach(x => { if (x !== localTermId) bridges.push(x); });
    }

    if (comp.type === 'SingleSocket' || comp.type === 'DoubleSocket' || comp.type === 'OutdoorSocket' || comp.type === 'USBSocket') {
      if (localTermId === 'L1') bridges.push('L2'); if (localTermId === 'L2') bridges.push('L1');
      if (localTermId === 'N1') bridges.push('N2'); if (localTermId === 'N2') bridges.push('N1');
      if (localTermId === 'E1') bridges.push('E2'); if (localTermId === 'E2') bridges.push('E1');
    }

    if (comp.type === 'FCUUnswitched') {
      if (localTermId === 'L_IN') bridges.push('L_OUT'); if (localTermId === 'L_OUT') bridges.push('L_IN');
      if (localTermId === 'N_IN') bridges.push('N_OUT'); if (localTermId === 'N_OUT') bridges.push('N_IN');
      if (localTermId === 'E_IN') bridges.push('E_OUT'); if (localTermId === 'E_OUT') bridges.push('E_IN');
    }

    if (comp.type === 'FCUSwitched') {
      if (localTermId === 'N_IN') bridges.push('N_OUT'); if (localTermId === 'N_OUT') bridges.push('N_IN');
      if (localTermId === 'E_IN') bridges.push('E_OUT'); if (localTermId === 'E_OUT') bridges.push('E_IN');
      if (comp.properties.isOn) {
        if (localTermId === 'L_IN') bridges.push('L_OUT'); if (localTermId === 'L_OUT') bridges.push('L_IN');
      }
    }

    if (comp.type === 'CookerControlUnit') {
      if (localTermId === 'N_IN') bridges.push('N_OUT', 'SKT_N'); if (localTermId === 'N_OUT') bridges.push('N_IN'); if (localTermId === 'SKT_N') bridges.push('N_IN');
      if (localTermId === 'E_IN') bridges.push('E_OUT', 'SKT_E'); if (localTermId === 'E_OUT') bridges.push('E_IN'); if (localTermId === 'SKT_E') bridges.push('E_IN');
      // Socket outlet on a cooker unit is permanently live (unswitched by the cooker switch)
      if (localTermId === 'L_IN') bridges.push('SKT_L'); if (localTermId === 'SKT_L') bridges.push('L_IN');
      if (comp.properties.isOn) { if (localTermId === 'L_IN') bridges.push('L_OUT'); if (localTermId === 'L_OUT') bridges.push('L_IN'); }
    }

    bridges.forEach(tid => traverse(compId, tid, visited, mode));

    conductors.forEach(cond => {
      if (cond.sourceTerminalId === t.globalId) {
        const dest = findTerm(cond.targetTerminalId);
        if (dest) traverse(dest.parentComponentId, dest.localId, visited, mode);
      }
      if (cond.targetTerminalId === t.globalId) {
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

  // Energize sink loads (lamps + appliances)
  Object.values(next).forEach(comp => {
    if (comp.type === 'CeilingRose') {
      const sl1 = comp.terminals['SL1']; const sl2 = comp.terminals['SL2']; const n1 = comp.terminals['N1'];
      comp.properties.isEnergized = !!((sl1?.voltage === 230 || sl2?.voltage === 230) && n1?.hasNeutralPath);
    }
    if (['PendantLight', 'DownlightSpot', 'BattenHolder', 'WallLight', 'Boiler', 'ImmersionHeater', 'ExtractorFan'].includes(comp.type)) {
      const l = comp.terminals['L']; const n = comp.terminals['N'];
      comp.properties.isEnergized = !!(l?.voltage === 230 && n?.hasNeutralPath);
    }
    if (['SingleSocket', 'DoubleSocket', 'OutdoorSocket', 'USBSocket'].includes(comp.type)) {
      const l = comp.terminals['L1']; const n = comp.terminals['N1'];
      comp.properties.isEnergized = !!(l?.voltage === 230 && n?.hasNeutralPath);
    }
    if (comp.type === 'FCUSwitched' || comp.type === 'FCUUnswitched' || comp.type === 'CookerControlUnit') {
      const l = comp.terminals['L_OUT']; const n = comp.terminals['N_OUT'];
      comp.properties.isEnergized = !!(l?.voltage === 230 && n?.hasNeutralPath);
    }
  });

  return { components: next };
}

// ==========================================
// STORE
// ==========================================
interface ElectricalState {
  components: Record<string, ElectricalComponent>;
  conductors: FreeConductor[];
  userMode: UserMode;
  selectedCoreColor: CoreColor;
  selectedCSA: CableCSA;
  past: Snapshot[];
  setCoreColor: (color: CoreColor) => void;
  setCSA: (csa: CableCSA) => void;
  addComponent: (type: ComponentType, x: number, y: number) => void;
  updateComponentPosition: (id: string, x: number, y: number) => void;
  removeComponent: (id: string) => void;
  connectArbitraryTerminals: (sourceTerminalId: string, targetTerminalId: string) => void;
  toggleSwitch: (id: string) => void;
  removeConductor: (id: string) => void;
  setMode: (mode: UserMode) => void;
  clearWorkspace: () => void;
  runSimulation: () => void;
  saveHistory: () => void;
  undo: () => void;
}

export const useElectricalStore = create<ElectricalState>()(
  persist(
    (set, get) => ({
      components: {},
      conductors: [],
      userMode: 'Apprentice',
      selectedCoreColor: 'Brown',
      selectedCSA: 1.5,
      past: [],

      saveHistory: () => {
        const { components, conductors, past } = get();
        const snap: Snapshot = JSON.parse(JSON.stringify({ components, conductors }));
        set({ past: [...past, snap].slice(-50) });
      },

      undo: () => {
        const { past } = get();
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        set({ components: previous.components, conductors: previous.conductors, past: past.slice(0, -1) });
        get().runSimulation();
      },

      setCoreColor: (selectedCoreColor) => set({ selectedCoreColor }),
      setCSA: (selectedCSA) => set({ selectedCSA }),

      addComponent: (type, x, y) => {
        get().saveHistory();
        const id = `node_${Math.random().toString(36).slice(2, 8)}`;
        const terminals = buildTerminals(type, id);
        if (type === 'ConsumerUnit') {
          terminals['L'].voltage = 230;
          terminals['N'].hasNeutralPath = true;
          terminals['E'].hasEarthPath = true;
        }
        const newComp: ElectricalComponent = { id, type, name: type, position: { x, y }, terminals, properties: defaultProperties(type) };
        set(state => ({ components: { ...state.components, [id]: newComp } }));
        get().runSimulation();
      },

      updateComponentPosition: (id, x, y) => {
        set(state => ({
          components: { ...state.components, [id]: { ...state.components[id], position: { x, y } } }
        }));
      },

      removeComponent: (id) => {
        get().saveHistory();
        set(state => {
          const rest = { ...state.components };
          delete rest[id];
          const remainingIds = new Set(Object.keys(rest));
          const conductors = state.conductors.filter(c => {
            const srcOk = remainingIds.has(c.sourceTerminalId.split('::')[0]);
            const tgtOk = remainingIds.has(c.targetTerminalId.split('::')[0]);
            return srcOk && tgtOk;
          });
          return { components: rest, conductors };
        });
        get().runSimulation();
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
        const csa = get().selectedCSA;
        const newCond: FreeConductor = {
          id: `wire_${Math.random().toString(36).slice(2, 7)}`,
          color, csa, sourceTerminalId, targetTerminalId
        };
        set(state => ({ conductors: [...state.conductors, newCond] }));
        get().runSimulation();
      },

      toggleSwitch: (id) => {
        const comp = get().components[id];
        if (!comp) return;
        get().saveHistory();

        if (comp.type === 'OneWaySwitch' || comp.type === 'DimmerSwitch') {
          set(state => ({ components: { ...state.components, [id]: { ...comp, properties: { ...comp.properties, isOpen: !comp.properties.isOpen } } } }));
        } else if (comp.type === 'TwoWaySwitch' || comp.type === 'IntermediateSwitch') {
          set(state => ({ components: { ...state.components, [id]: { ...comp, properties: { ...comp.properties, switchPos: !comp.properties.switchPos } } } }));
        } else if (comp.type === 'FCUSwitched' || comp.type === 'CookerControlUnit') {
          set(state => ({ components: { ...state.components, [id]: { ...comp, properties: { ...comp.properties, isOn: !comp.properties.isOn } } } }));
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
    { name: 'uk-electrical-designer-v2' }
  )
);
