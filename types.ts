// ==========================================
// CORE DOMAIN TYPES
// ==========================================

export type ComponentType =
  // Distribution
  | 'ConsumerUnit'
  // Lighting control
  | 'OneWaySwitch'
  | 'TwoWaySwitch'
  | 'IntermediateSwitch'
  | 'DimmerSwitch'
  // Lighting loads
  | 'CeilingRose'
  | 'PendantLight'
  | 'DownlightSpot'
  | 'BattenHolder'
  | 'WallLight'
  // Sockets & power
  | 'SingleSocket'
  | 'DoubleSocket'
  | 'OutdoorSocket'
  | 'USBSocket'
  // FCUs & control units
  | 'FCUSwitched'
  | 'FCUUnswitched'
  | 'CookerControlUnit'
  // Appliances
  | 'Boiler'
  | 'ImmersionHeater'
  | 'ExtractorFan'
  // Junctions
  | 'ConnectorBlock'
  | 'JunctionBox4T';

export type ComponentCategory =
  | 'Distribution'
  | 'Lighting Control'
  | 'Lighting Loads'
  | 'Sockets & Power'
  | 'FCUs & Control Units'
  | 'Appliances'
  | 'Junctions';

export type UserMode = 'Apprentice' | 'Electrician';

export type CoreColor = 'Brown' | 'Blue' | 'GreenYellow' | 'Yellow' | 'Black' | 'Grey';

// Cross-sectional area of cable, in mm^2 — the standard UK domestic sizes
export type CableCSA = 1.0 | 1.5 | 2.5 | 4.0 | 6.0 | 10.0 | 16.0;

export interface Terminal {
  globalId: string;
  localId: string;
  name: string;
  parentComponentId: string;
  voltage: number;
  hasNeutralPath: boolean;
  hasEarthPath: boolean;
}

export interface ComponentProperties {
  isOpen?: boolean;
  switchPos?: boolean;
  isEnergized?: boolean;
  isOn?: boolean;
  dimLevel?: number;
  label?: string;
}

export interface ElectricalComponent {
  id: string;
  type: ComponentType;
  name: string;
  position: { x: number; y: number };
  terminals: Record<string, Terminal>;
  properties: ComponentProperties;
}

export interface FreeConductor {
  id: string;
  color: CoreColor;
  csa: CableCSA;
  sourceTerminalId: string;
  targetTerminalId: string;
}

export interface Snapshot {
  components: Record<string, ElectricalComponent>;
  conductors: FreeConductor[];
}

export interface CatalogEntry {
  type: ComponentType;
  category: ComponentCategory;
  name: string;
  desc: string;
}
