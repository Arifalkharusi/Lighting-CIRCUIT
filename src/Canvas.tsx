import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from 'reactflow';
import type { Node, Connection, EdgeChange } from 'reactflow';
import 'reactflow/dist/style.css';
import { useElectricalStore } from '../store/electricalStore';
import type { ComponentType, CoreColor } from '../types';
import { CORE_COLOR_HEX } from './nodes/shared';

import { ConsumerUnitNode } from './nodes/DistributionNodes';
import { OneWaySwitchNode, TwoWaySwitchNode, IntermediateSwitchNode, DimmerSwitchNode } from './nodes/SwitchNodes';
import { CeilingRoseNode, PendantLightNode, DownlightSpotNode, BattenHolderNode, WallLightNode } from './nodes/LightingNodes';
import { SingleSocketNode, DoubleSocketNode, OutdoorSocketNode, USBSocketNode } from './nodes/PowerNodes';
import { FCUSwitchedNode, FCUUnswitchedNode, CookerControlUnitNode } from './nodes/FcuNodes';
import { BoilerNode, ImmersionHeaterNode, ExtractorFanNode } from './nodes/ApplianceNodes';
import { ConnectorBlockNode, JunctionBox4TNode } from './nodes/JunctionNodes';

const nodeTypes = {
  ConsumerUnit: ConsumerUnitNode,
  CeilingRose: CeilingRoseNode,
  PendantLight: PendantLightNode,
  DownlightSpot: DownlightSpotNode,
  BattenHolder: BattenHolderNode,
  WallLight: WallLightNode,
  OneWaySwitch: OneWaySwitchNode,
  TwoWaySwitch: TwoWaySwitchNode,
  IntermediateSwitch: IntermediateSwitchNode,
  DimmerSwitch: DimmerSwitchNode,
  SingleSocket: SingleSocketNode,
  DoubleSocket: DoubleSocketNode,
  OutdoorSocket: OutdoorSocketNode,
  USBSocket: USBSocketNode,
  FCUSwitched: FCUSwitchedNode,
  FCUUnswitched: FCUUnswitchedNode,
  CookerControlUnit: CookerControlUnitNode,
  Boiler: BoilerNode,
  ImmersionHeater: ImmersionHeaterNode,
  ExtractorFan: ExtractorFanNode,
  ConnectorBlock: ConnectorBlockNode,
  JunctionBox4T: JunctionBox4TNode,
};

export const SimulatorCanvas: React.FC = () => {
  const { components, conductors, addComponent, updateComponentPosition, connectArbitraryTerminals, removeConductor, saveHistory } = useElectricalStore();

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
    setEdges(conductors.map(c => {
      const isBlack = c.color === 'Black';
      // Wire thickness on the diagram scales gently with real cable CSA
      const strokeWidth = 2 + Math.min(6, Math.log2(c.csa / 1.0 + 1) * 2.4);
      return {
        id: c.id,
        source: c.sourceTerminalId.split('::')[0],
        target: c.targetTerminalId.split('::')[0],
        sourceHandle: c.sourceTerminalId,
        targetHandle: c.targetTerminalId,
        animated: true,
        type: 'bezier',
        zIndex: 50,
        deletable: true,
        label: `${c.csa}mm²`,
        labelStyle: { fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
        labelBgPadding: [3, 2] as [number, number],
        labelBgBorderRadius: 3,
        style: {
          stroke: CORE_COLOR_HEX[c.color as CoreColor] ?? '#888',
          strokeWidth,
          filter: isBlack
            ? 'drop-shadow(0px 0px 2px rgba(255,255,255,0.35)) drop-shadow(0px 2px 4px rgba(0,0,0,0.9))'
            : 'drop-shadow(0px 3px 5px rgba(0,0,0,0.8))',
        },
      };
    }));
  }, [conductors, setEdges]);

  const onNodeDragStart = useCallback(() => { saveHistory(); }, [saveHistory]);

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    updateComponentPosition(node.id, node.position.x, node.position.y);
  }, [updateComponentPosition]);

  // A manual connection is made by dragging from one terminal handle to
  // another — React Flow's onConnect fires only when the user does this
  // themselves; nothing here auto-wires components.
  const onConnect = useCallback((conn: Connection) => {
    if (conn.sourceHandle && conn.targetHandle) connectArbitraryTerminals(conn.sourceHandle, conn.targetHandle);
  }, [connectArbitraryTerminals]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
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
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop} onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={() => true}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView>
        <Background color="#1a1a1e" gap={16} size={1} />
        <MiniMap
          pannable zoomable
          className="!bg-slate-950 !border !border-slate-800"
          maskColor="rgba(10,10,12,0.75)"
          nodeColor="#374151"
        />
        <Controls className="!bg-slate-900 !border-slate-800 text-white fill-white shadow-2xl" />
      </ReactFlow>

      {Object.keys(components).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-slate-600 font-mono text-xs space-y-1">
            <div className="text-2xl mb-2">⚡</div>
            <div>Drag a component from the left, or click one to drop it here.</div>
            <div>Connect terminals manually by dragging between the pins.</div>
          </div>
        </div>
      )}
    </div>
  );
};
