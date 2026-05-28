import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, Position, Handle } from 'reactflow';
import type { Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { useCombatStore } from '../store/combatStore';
import { KI_ABILITIES_DAG } from '../config/kiRegistry';
import type { KiAbilityDef } from '../config/kiRegistry';

// Custom Node for Ki Abilities
const KiAbilityNode = ({ data }: { data: any }) => {
  const { ability, bought, available, active, characterId, buy, activate, deactivate } = data;
  
  let cardStyle = "border-slate-700 bg-slate-800/50 opacity-50";
  if (bought) cardStyle = "border-amber-500 bg-amber-900/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
  else if (available) cardStyle = "border-cyan-600 bg-cyan-900/40 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all";

  if (active) cardStyle = "border-emerald-500 bg-emerald-900/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]";

  return (
    <div className={`w-64 rounded-xl border-2 p-4 flex flex-col backdrop-blur-sm shadow-xl ${cardStyle}`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-md leading-tight text-white">{ability.name}</h3>
        <span className="text-xs font-mono bg-black/40 px-2 py-1 rounded text-slate-300 whitespace-nowrap">CM: {ability.cmCost}</span>
      </div>
      <p className="text-xs text-slate-400 mb-4 flex-grow">{ability.description}</p>
      
      <div className="flex justify-between items-end mt-auto pt-2 border-t border-white/10">
        <div className="flex flex-col gap-1 text-[10px] text-slate-400 font-mono">
          <span>TIPO: {ability.effectType}</span>
          {ability.kiCostActivation > 0 && <span className="text-cyan-300">ACT: {ability.kiCostActivation} Ki</span>}
          {ability.kiCostMaintenance && <span className="text-purple-300">MANT: {ability.kiCostMaintenance} Ki</span>}
        </div>
        <div className="flex gap-2">
          {!bought && available && (
            <button onClick={() => buy(characterId, ability.id)} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-2 py-1 rounded font-bold">Aprender</button>
          )}
          {bought && ability.effectType !== 'PASSIVE' && ability.effectType !== 'UI_BADGE' && (
            <>
              {!active ? (
                <button onClick={() => activate(characterId, ability.id)} className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-2 py-1 rounded font-bold">Activar</button>
              ) : (
                <button onClick={() => deactivate(characterId, ability.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2 py-1 rounded font-bold">Activo</button>
              )}
            </>
          )}
          {bought && (ability.effectType === 'PASSIVE' || ability.effectType === 'UI_BADGE') && (
            <span className="text-amber-500 text-xs font-bold uppercase tracking-wider py-1.5">Adquirida</span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
    </div>
  );
};

const nodeTypes = {
  kiNode: KiAbilityNode,
};

interface KiTreeProps {
  characterId: string;
}

export const KiTree: React.FC<KiTreeProps> = ({ characterId }) => {
  const { characters, buyKiAbility, activateKiAbility, deactivateKiAbility } = useCombatStore();
  const character = characters[characterId];

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!character) return { initialNodes: [], initialEdges: [] };

    const kiAbilities = character.kiAbilities || [];
    const activeEffects = character.activeEffects || [];
    const hasAbility = (id: string) => kiAbilities.includes(id);
    const isAbilityActive = (id: string) => activeEffects.some((e: any) => e.id === `ki_${id}`);
    const canBuy = (ability: KiAbilityDef) => {
      if (hasAbility(ability.id)) return false;
      return ability.prerequisites.every(p => hasAbility(p));
    };

    const depths: Record<string, number> = {};
    const getDepth = (id: string): number => {
      if (depths[id] !== undefined) return depths[id];
      const ability = KI_ABILITIES_DAG[id];
      if (!ability || ability.prerequisites.length === 0) {
        depths[id] = 0;
        return 0;
      }
      const maxPreReqDepth = Math.max(...ability.prerequisites.map(p => getDepth(p)));
      depths[id] = maxPreReqDepth + 1;
      return depths[id];
    };

    Object.keys(KI_ABILITIES_DAG).forEach(id => getDepth(id));

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const xOffsetPerDepth: Record<number, number> = {};

    Object.values(KI_ABILITIES_DAG).forEach(ability => {
      const d = depths[ability.id];
      if (xOffsetPerDepth[d] === undefined) xOffsetPerDepth[d] = 0;

      // Intentar centrar un poco dependiendo de la cantidad de nodos en la profundidad
      // Simplificado: X = offset * 300
      const x = xOffsetPerDepth[d] * 320;
      const y = d * 250;
      
      xOffsetPerDepth[d] += 1;

      nodes.push({
        id: ability.id,
        type: 'kiNode',
        position: { x, y },
        data: {
          ability,
          bought: hasAbility(ability.id),
          available: canBuy(ability),
          active: isAbilityActive(ability.id),
          characterId,
          buy: buyKiAbility,
          activate: activateKiAbility,
          deactivate: deactivateKiAbility
        }
      });

      ability.prerequisites.forEach(pre => {
        edges.push({
          id: `e-${pre}-${ability.id}`,
          source: pre,
          target: ability.id,
          animated: hasAbility(pre), // animar si el prerequisito está comprado
          style: { stroke: hasAbility(pre) ? '#f59e0b' : '#334155', strokeWidth: 2 }
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [character, characters, buyKiAbility, activateKiAbility, deactivateKiAbility, characterId]);

  if (!character) return <div>Personaje no encontrado</div>;

  return (
    <div className="flex flex-col h-[80vh] bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <h2 className="text-xl font-bold text-amber-400">Árbol de Habilidades de Ki</h2>
        <div className="flex gap-4 text-sm mt-2">
          <span className="text-slate-300">Ki Actual: <strong className="text-cyan-400">{character.ki}</strong></span>
          <span className="text-slate-300">CM Utilizados: <strong className="text-amber-400">
            {character.kiAbilities.reduce((acc, id) => acc + (KI_ABILITIES_DAG[id]?.cmCost || 0), 0)}
          </strong></span>
        </div>
      </div>
      <div className="flex-grow w-full h-full">
        <ReactFlow 
          nodes={initialNodes} 
          edges={initialEdges} 
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-950"
        >
          <Background color="#475569" gap={16} />
          <Controls className="bg-slate-800 border-slate-700 fill-white text-white" />
        </ReactFlow>
      </div>
    </div>
  );
};
