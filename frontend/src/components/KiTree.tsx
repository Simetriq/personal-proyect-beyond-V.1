import React, { useMemo } from 'react';
import { useCombatStore } from '../store/combatStore';
import { KI_ABILITIES_DAG } from '../config/kiRegistry';
import type { KiAbilityDef } from '../config/kiRegistry';

interface KiTreeProps {
  characterId: string;
}

export const KiTree: React.FC<KiTreeProps> = ({ characterId }) => {
  const { characters, buyKiAbility, activateKiAbility, deactivateKiAbility } = useCombatStore();
  const character = characters[characterId];

  // Calcular la profundidad de cada nodo para ordenarlos en el árbol
  const nodesByDepth = useMemo(() => {
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

    const grouped: Record<number, KiAbilityDef[]> = {};
    Object.values(KI_ABILITIES_DAG).forEach(ability => {
      const d = depths[ability.id];
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(ability);
    });

    return grouped;
  }, []);

  if (!character) return <div>Personaje no encontrado</div>;

  const kiAbilities = character.kiAbilities || [];
  const activeEffects = character.activeEffects || [];

  const hasAbility = (id: string) => kiAbilities.includes(id);
  const isAbilityActive = (id: string) => activeEffects.some(e => e.id === `ki_${id}`);

  const canBuy = (ability: KiAbilityDef) => {
    if (hasAbility(ability.id)) return false;
    return ability.prerequisites.every(p => hasAbility(p));
  };

  const depths = Object.keys(nodesByDepth).map(Number).sort((a, b) => a - b);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-200">
      <div className="mb-8 border-b border-slate-700 pb-4">
        <h2 className="text-3xl font-bold text-amber-400 mb-2">Dominios del Ki</h2>
        <div className="flex gap-4 text-sm">
          <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            Ki Actual: <strong className="text-cyan-400">{character.ki}</strong>
          </span>
          <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            Habilidades Aprendidas: <strong className="text-amber-400">{kiAbilities.length} / 23</strong>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-12 overflow-x-auto pb-10">
        {depths.map(depth => (
          <div key={depth} className="flex flex-wrap justify-center gap-6 relative">
            {nodesByDepth[depth]?.map(ability => {
              const bought = hasAbility(ability.id);
              const active = isAbilityActive(ability.id);
              const available = canBuy(ability);

              let cardStyle = "border-slate-700 bg-slate-800/50 opacity-50";
              if (bought) cardStyle = "border-amber-500 bg-amber-900/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
              else if (available) cardStyle = "border-cyan-600 bg-cyan-900/20 cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all";

              if (active) cardStyle = "border-emerald-500 bg-emerald-900/30 shadow-[0_0_20px_rgba(16,185,129,0.4)]";

              return (
                <div 
                  key={ability.id} 
                  className={`w-72 rounded-xl border-2 p-4 flex flex-col backdrop-blur-sm transition-all duration-300 relative group ${cardStyle}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight">{ability.name}</h3>
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
                        <button 
                          onClick={() => buyKiAbility(characterId, ability.id)}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-1.5 rounded font-bold shadow-lg transition-colors"
                        >
                          Aprender
                        </button>
                      )}
                      
                      {bought && ability.effectType !== 'PASSIVE' && ability.effectType !== 'UI_BADGE' && (
                        <>
                          {!active ? (
                            <button 
                              onClick={() => activateKiAbility(characterId, ability.id)}
                              className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-3 py-1.5 rounded font-bold shadow-lg transition-colors"
                            >
                              Activar
                            </button>
                          ) : (
                            <button 
                              onClick={() => deactivateKiAbility(characterId, ability.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded font-bold shadow-lg transition-colors"
                            >
                              Activo
                            </button>
                          )}
                        </>
                      )}
                      {bought && (ability.effectType === 'PASSIVE' || ability.effectType === 'UI_BADGE') && (
                        <span className="text-amber-500 text-xs font-bold uppercase tracking-wider py-1.5">Adquirida</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
