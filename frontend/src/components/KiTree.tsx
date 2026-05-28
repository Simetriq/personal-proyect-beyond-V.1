import React, { useMemo, useState, useCallback } from 'react';
import { ReactFlow, Controls, Background, Position, Handle } from 'reactflow';
import type { Edge, Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { useCombatStore } from '../store/combatStore';
import { KI_ABILITIES_DAG } from '../config/kiRegistry';
import type { KiAbilityDef } from '../config/kiRegistry';
import { Button } from './ui/button';

// Custom Node for Ki Abilities (Constellation Style)
const KiAbilityNode = ({ data }: { data: any }) => {
  const { ability, bought, available, active, isSelected } = data;
  
  let ringStyle = "border-gray-700 shadow-none";
  let bgStyle = "bg-[#161224]/50 opacity-40";
  let iconSrc = "/assets/icons/gen_ki_default.png";
  let glowStyle = "";

  if (ability.effectType === 'PASSIVE' || ability.effectType === 'UI_BADGE') iconSrc = "/assets/icons/gen_ki_passive.png";
  else if (ability.effectType === 'DEFENSE') iconSrc = "/assets/icons/gen_ki_defense.png";
  else if (ability.effectType === 'DAMAGE') iconSrc = "/assets/icons/gen_ki_damage.png";
  else if (ability.effectType === 'BUFF') iconSrc = "/assets/icons/gen_ki_buff.png";

  if (bought) {
    ringStyle = "border-anima-gold shadow-[0_0_25px_rgba(197,160,89,0.7)]";
    bgStyle = "bg-gradient-to-br from-[#2a2215] to-[#1a1714] opacity-100";
  } else if (available) {
    ringStyle = "border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]";
    bgStyle = "bg-cyan-950/70 opacity-100";
    glowStyle = "animate-[pulse_3s_ease-in-out_infinite]";
  }

  if (active) {
    ringStyle = "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.9)]";
    bgStyle = "bg-emerald-950/90 opacity-100";
  }

  let selectedOutline = "";
  if (isSelected) {
    selectedOutline = "ring-4 ring-white/80 ring-offset-2 ring-offset-transparent";
  }

  return (
    <div className={`relative flex items-center justify-center w-20 h-20 rounded-full border-4 backdrop-blur-md transition-all duration-500 overflow-hidden ${ringStyle} ${bgStyle} ${glowStyle} ${selectedOutline}`}>
      <Handle type="target" position={Position.Top} className="opacity-0 w-4 h-4" />
      
      <img src={iconSrc} alt={ability.effectType} className="w-[120%] h-[120%] object-cover object-center pointer-events-none drop-shadow-lg" />
      
      <div className="absolute -bottom-7 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded text-xs font-serif text-anima-goldglow border border-[#4a3b2c] shadow-[0_2px_4px_rgba(0,0,0,0.8)] select-none pointer-events-none z-20">
        {ability.name}
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0 w-4 h-4" />
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
  const [selectedAbilityId, setSelectedAbilityId] = useState<string | null>(null);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedAbilityId(node.id);
  }, []);

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

      // Centrado simplificado ajustando el espacio X
      const x = (xOffsetPerDepth[d] - 1) * 200; // -1 to center around 0 for initial view
      const y = d * 180;
      
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
          isSelected: selectedAbilityId === ability.id
        }
      });

      ability.prerequisites.forEach(pre => {
        const preBought = hasAbility(pre);
        edges.push({
          id: `e-${pre}-${ability.id}`,
          source: pre,
          target: ability.id,
          animated: preBought, // Flujo animado si el nodo origen está comprado
          style: { 
            stroke: preBought ? '#c5a059' : '#334155', 
            strokeWidth: preBought ? 3 : 2,
            filter: preBought ? 'drop-shadow(0 0 4px rgba(197,160,89, 0.8))' : 'none',
            transition: 'all 0.5s ease'
          }
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [character, selectedAbilityId]);

  if (!character) return <div>Personaje no encontrado</div>;

  const selectedAbility = selectedAbilityId ? KI_ABILITIES_DAG[selectedAbilityId] : null;
  const isBought = selectedAbility ? character.kiAbilities?.includes(selectedAbility.id) : false;
  const isAvailable = selectedAbility ? selectedAbility.prerequisites.every(p => character.kiAbilities?.includes(p)) && !isBought : false;
  const isActive = selectedAbility ? character.activeEffects?.some((e: any) => e.id === `ki_${selectedAbility.id}`) : false;

  return (
    <div className="flex h-[80vh] w-full bg-[#0a0b0e] border border-[#2a253a] rounded-lg overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] relative">
      
      {/* Fondo Espacial Animado / Mágico */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-screen"></div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-anima-zeon/10 via-transparent to-transparent"></div>

      {/* Árbol Principal */}
      <div className="flex-grow h-full relative z-10">
        <div className="absolute top-4 left-4 z-20 bg-[#161224]/80 backdrop-blur-md p-3 rounded-lg border border-[#3a2b1c] shadow-glass-gold">
          <h2 className="text-lg font-serif font-bold text-anima-gold uppercase tracking-widest drop-shadow-md">Dominios Ki</h2>
          <div className="flex gap-4 text-xs mt-1 font-sans">
            <span className="text-gray-400">Ki Actual: <strong className="text-cyan-400 text-sm">{character.ki}</strong></span>
            <span className="text-gray-400">CM Utilizados: <strong className="text-anima-gold text-sm">
              {character.kiAbilities?.reduce((acc, id) => acc + (KI_ABILITIES_DAG[id]?.cmCost || 0), 0) || 0}
            </strong></span>
          </div>
        </div>

        <ReactFlow 
          nodes={initialNodes} 
          edges={initialEdges} 
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedAbilityId(null)}
          fitView
          className="bg-transparent"
        >
          <Background color="rgba(255,255,255,0.05)" gap={30} size={2} />
          <Controls className="bg-slate-900 border-slate-700 fill-anima-gold text-anima-gold" />
        </ReactFlow>
      </div>

      {/* Panel Lateral de Detalles */}
      {selectedAbility && (
        <div className="w-80 h-full panel-arcano rounded-none border-l border-t-0 border-b-0 border-r-0 z-20 relative transform transition-transform animate-in slide-in-from-right duration-300">
          <div className="p-6 flex flex-col h-full relative z-10">
            <div className="flex justify-between items-start mb-4 border-b border-[#4a3b2c] pb-4">
              <h3 className="font-bold text-2xl leading-tight text-anima-goldglow font-serif">{selectedAbility.name}</h3>
            </div>
            
            <div className="flex gap-2 mb-4 text-xs font-mono">
              <span className="bg-[#1a1714] text-gray-300 px-2 py-1 rounded border border-[#3a2b1c]">
                TIPO: {selectedAbility.effectType}
              </span>
              <span className="bg-[#1a1714] text-gray-300 px-2 py-1 rounded border border-[#3a2b1c]">
                CM: {selectedAbility.cmCost}
              </span>
            </div>

            <p className="text-sm text-gray-300 mb-6 font-serif leading-relaxed flex-grow">
              {selectedAbility.description}
            </p>
            
            <div className="space-y-4 border-t border-[#4a3b2c] pt-4">
              <div className="flex flex-col gap-2 text-sm text-gray-400 font-sans bg-black/40 p-3 rounded">
                {selectedAbility.kiCostActivation > 0 && (
                  <div className="flex justify-between">
                    <span>Costo Activación:</span>
                    <span className="text-cyan-400 font-bold">{selectedAbility.kiCostActivation} Ki</span>
                  </div>
                )}
                {selectedAbility.kiCostMaintenance && (
                  <div className="flex justify-between">
                    <span>Mantenimiento:</span>
                    <span className="text-purple-400 font-bold">{selectedAbility.kiCostMaintenance} Ki/Turno</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-4">
                {!isBought && isAvailable && (
                  <Button 
                    onClick={() => buyKiAbility(characterId, selectedAbility.id)} 
                    className="w-full btn-piedra-runica bg-gradient-to-b from-cyan-900 to-cyan-800 hover:bg-cyan-700 text-white font-bold tracking-widest uppercase border-cyan-500 shadow-glow-ki"
                  >
                    Aprender Habilidad
                  </Button>
                )}
                {!isBought && !isAvailable && (
                  <Button disabled className="w-full bg-gray-900 text-gray-600 font-bold border border-gray-800 cursor-not-allowed">
                    Requisitos no cumplidos
                  </Button>
                )}
                
                {isBought && selectedAbility.effectType !== 'PASSIVE' && selectedAbility.effectType !== 'UI_BADGE' && (
                  <>
                    {!isActive ? (
                      <Button 
                        onClick={() => activateKiAbility(characterId, selectedAbility.id)} 
                        className="w-full btn-piedra-runica bg-gradient-to-b from-amber-800 to-amber-700 hover:bg-amber-600 text-white font-bold tracking-widest uppercase border-amber-500 shadow-glow-gold"
                      >
                        Activar Habilidad
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => deactivateKiAbility(characterId, selectedAbility.id)} 
                        className="w-full btn-piedra-runica bg-gradient-to-b from-emerald-900 to-emerald-800 hover:bg-emerald-700 text-white font-bold tracking-widest uppercase border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      >
                        Desactivar (Activa)
                      </Button>
                    )}
                  </>
                )}
                {isBought && (selectedAbility.effectType === 'PASSIVE' || selectedAbility.effectType === 'UI_BADGE') && (
                  <div className="w-full text-center py-3 bg-[#1a1714] border border-anima-gold text-anima-gold font-bold uppercase tracking-widest rounded">
                    Habilidad Adquirida
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
