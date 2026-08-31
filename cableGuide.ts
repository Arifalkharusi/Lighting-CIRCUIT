import type { CableCSA } from '../types';

export interface CableSizeInfo {
  csa: CableCSA;
  label: string;
  typicalUse: string;
  approxRatingA: string;
}

// Indicative only — approximate current-carrying capacity for a typical
// twin & earth cable clipped direct (method C). Real designs must be
// verified against BS 7671 tables (correction factors, grouping, etc).
export const CABLE_SIZES: CableSizeInfo[] = [
  { csa: 1.0, label: '1.0 mm²', typicalUse: 'Lighting circuits (short runs)', approxRatingA: '~11A' },
  { csa: 1.5, label: '1.5 mm²', typicalUse: 'Lighting circuits, standard', approxRatingA: '~15A' },
  { csa: 2.5, label: '2.5 mm²', typicalUse: 'Ring / radial socket circuits, immersion heater', approxRatingA: '~20–27A' },
  { csa: 4.0, label: '4.0 mm²', typicalUse: 'Radial socket circuits, small cooker', approxRatingA: '~30A' },
  { csa: 6.0, label: '6.0 mm²', typicalUse: 'Cooker circuits, electric showers (small)', approxRatingA: '~36A' },
  { csa: 10.0, label: '10.0 mm²', typicalUse: 'Electric showers, large cookers', approxRatingA: '~46A' },
  { csa: 16.0, label: '16.0 mm²', typicalUse: 'Sub-mains, large showers/heaters', approxRatingA: '~60A' },
];

export interface CircuitRefRow {
  circuit: string;
  cable: string;
  protection: string;
  notes: string;
}

export const CIRCUIT_REFERENCE: CircuitRefRow[] = [
  { circuit: 'Lighting (radial)', cable: '1.0 / 1.5 mm²', protection: '6A MCB (Type B)', notes: 'Max ~12 points/outlets as rule of thumb' },
  { circuit: 'Ring final (sockets)', cable: '2.5 mm²', protection: '32A MCB / RCBO', notes: 'Unlimited floor area if design allows' },
  { circuit: 'Radial (sockets, ≤20m²)', cable: '2.5 mm²', protection: '20A MCB / RCBO', notes: 'Kitchens etc.' },
  { circuit: 'Radial (sockets, ≤50m²)', cable: '4.0 mm²', protection: '32A MCB / RCBO', notes: '' },
  { circuit: 'Cooker circuit', cable: '6.0–10.0 mm²', protection: '32–40A MCB', notes: 'Depends on cooker load (diversity applied)' },
  { circuit: 'Electric shower', cable: '6.0–10.0 mm²', protection: '32–45A RCBO', notes: 'Size to shower kW rating' },
  { circuit: 'Immersion heater', cable: '2.5 mm²', protection: '16A MCB', notes: 'Dedicated radial' },
  { circuit: 'Boiler (via FCU)', cable: '1.5 / 2.5 mm²', protection: '3A / 16A fuse in FCU', notes: 'Fed from lighting or dedicated way' },
  { circuit: 'Extractor fan (via FCU)', cable: '1.0 / 1.5 mm²', protection: '3A fuse in FCU', notes: 'Often switched with lighting' },
];
