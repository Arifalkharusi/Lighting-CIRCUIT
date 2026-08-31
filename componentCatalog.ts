import type { CatalogEntry, ComponentCategory } from '../types';

export const CATEGORY_ORDER: ComponentCategory[] = [
  'Distribution',
  'Lighting Control',
  'Lighting Loads',
  'Sockets & Power',
  'FCUs & Control Units',
  'Appliances',
  'Junctions',
];

export const COMPONENT_CATALOG: CatalogEntry[] = [
  // Distribution
  { type: 'ConsumerUnit', category: 'Distribution', name: 'Consumer Unit', desc: '230V L / N / E source' },

  // Lighting control
  { type: 'OneWaySwitch', category: 'Lighting Control', name: '1-Way Switch', desc: 'COM → L1 (open / closed)' },
  { type: 'TwoWaySwitch', category: 'Lighting Control', name: '2-Way Switch', desc: 'COM → L1 or L2' },
  { type: 'IntermediateSwitch', category: 'Lighting Control', name: 'Intermediate Switch', desc: 'Crosses strap wires for 3+ way' },
  { type: 'DimmerSwitch', category: 'Lighting Control', name: 'Dimmer Switch', desc: 'Leading-edge dimmer, COM → L1' },

  // Lighting loads
  { type: 'CeilingRose', category: 'Lighting Loads', name: 'Ceiling Rose', desc: 'Loop-in / SW-live / Neutral' },
  { type: 'PendantLight', category: 'Lighting Loads', name: 'Pendant Light', desc: 'Flex + lampholder fitting' },
  { type: 'DownlightSpot', category: 'Lighting Loads', name: 'Downlight / Spot', desc: 'GU10 recessed downlight' },
  { type: 'BattenHolder', category: 'Lighting Loads', name: 'Batten Holder', desc: 'BC batten lampholder' },
  { type: 'WallLight', category: 'Lighting Loads', name: 'Wall Light', desc: 'Wall-mounted fitting' },

  // Sockets & power
  { type: 'SingleSocket', category: 'Sockets & Power', name: 'Single Socket', desc: '13A single outlet (BS 1363)' },
  { type: 'DoubleSocket', category: 'Sockets & Power', name: 'Double Socket', desc: '13A twin outlet (BS 1363)' },
  { type: 'OutdoorSocket', category: 'Sockets & Power', name: 'Outdoor Socket', desc: 'IP66 weatherproof, RCD required' },
  { type: 'USBSocket', category: 'Sockets & Power', name: 'USB Socket', desc: '13A outlet with USB charging' },

  // FCUs & control units
  { type: 'FCUSwitched', category: 'FCUs & Control Units', name: 'Switched FCU', desc: 'Fused spur with switch + neon' },
  { type: 'FCUUnswitched', category: 'FCUs & Control Units', name: 'Unswitched FCU', desc: 'Fused spur, no isolation' },
  { type: 'CookerControlUnit', category: 'FCUs & Control Units', name: 'Cooker Control Unit', desc: '45A switch + integral socket' },

  // Appliances
  { type: 'Boiler', category: 'Appliances', name: 'Combi Boiler', desc: 'Fed via FCU, needs local isolation' },
  { type: 'ImmersionHeater', category: 'Appliances', name: 'Immersion Heater', desc: 'Dedicated radial, 2.5mm² typical' },
  { type: 'ExtractorFan', category: 'Appliances', name: 'Extractor Fan', desc: 'Switched live, bathroom/kitchen' },

  // Junctions
  { type: 'ConnectorBlock', category: 'Junctions', name: '5-Pole Connector Block', desc: 'Pass-through choc-box strip' },
  { type: 'JunctionBox4T', category: 'Junctions', name: '4-Terminal Junction Box', desc: 'All same-pole cores commoned' },
];
