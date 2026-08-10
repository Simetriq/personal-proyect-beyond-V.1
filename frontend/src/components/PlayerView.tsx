import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

import { useCombatStore, type DamageType } from "../store/combatStore";
import { CreateCharacterForm } from "./CreateCharacterForm";
import { KI_ABILITIES, MAGIC_SPELLS } from "../config/abilitiesRegistry";
import { KiTree } from "./KiTree";
import { KiAccumulator } from "./ui/KiAccumulator";
import { DiceRoller } from './ui/DiceRoller';
import { MagicLevelUpSection } from "./MagicLevelUpSection";
import { PhysicalLevelUpSection } from "./PhysicalLevelUpSection";
import { DefenseReactionModal } from './DefenseReactionModal';
import { CombatTargetPanel, Combatant } from './CombatTargetPanel';
import { MagicConsole } from './MagicConsole';
import { BattleLogPanel } from './BattleLogPanel';
import { TurnOrderTracker } from './TurnOrderTracker';
import { MAGIC_SPELLS_REGISTRY } from "../lib/magicRegistry";
import { CLASSES_CONFIG } from "../lib/classesConfig";
import { CriticalHitModal, FumbleModal, WeaponShatteredModal, InitiativeModal, CounterOpportunityModal } from './modals';


interface LocalProgressionSpend {
  physical: {
    ataque: number;
    esquiva: number;
    parada: number;
  };
  magic: {
    vias: {
      FUEGO: number;
      AGUA: number;
    };
  };
}

const ITEM_ICONS: Record<string, string> = {
  'item-potion-minor': '/assets/icons/gen_potion_minor.webp',
  'item-potion-major': '/assets/icons/gen_potion_major.webp',
  'item-antidote': '/assets/icons/gen_antidote.webp',
  'item-leather-armor': '/assets/icons/gen_leather_armor.webp',
};

export function PlayerView() {
  const characters = useCombatStore(s => s.characters);
  const combatState = useCombatStore(s => s.combatState);
  const myCharacterId = useCombatStore(s => s.myCharacterId);
  const hasSynced = useCombatStore(s => s.hasSynced);
  const pendingCounterOpportunity = useCombatStore(s => s.pendingCounterOpportunity);
  const criticalHitEvent = useCombatStore(s => s.criticalHitEvent);
  const fumbleEvent = useCombatStore(s => s.fumbleEvent);
  const weaponShatteredEvent = useCombatStore(s => s.weaponShatteredEvent);
  const incomingAttack = useCombatStore(s => s.incomingAttack);
  const logs = useCombatStore(s => s.logs);
  const persistentSpells = useCombatStore(s => s.persistentSpells);

  const applyDamage = useCombatStore(s => s.applyDamage);
  const connectToCampaign = useCombatStore(s => s.connectToCampaign);
  const equipItem = useCombatStore(s => s.equipItem);
  const unequipItem = useCombatStore(s => s.unequipItem);
  const useItem = useCombatStore(s => s.useItem);
  const useAbility = useCombatStore(s => s.useAbility);
  const submitInitiative = useCombatStore(s => s.submitInitiative);
  const buyItem = useCombatStore(s => s.buyItem);
  const executeCounter = useCombatStore(s => s.executeCounter);
  const clearCriticalHit = useCombatStore(s => s.clearCriticalHit);
  const clearFumbleEvent = useCombatStore(s => s.clearFumbleEvent);
  const clearWeaponShattered = useCombatStore(s => s.clearWeaponShattered);
  const sendProgressionDraft = useCombatStore(s => s.sendProgressionDraft);
  const submitDefense = useCombatStore(s => s.submitDefense);
  const declareAttack = useCombatStore(s => s.declareAttack);

  const [damageAmount, setDamageAmount] = useState("");
  const [selectedType, setSelectedType] = useState<DamageType>("FIL");
  const [initiativeInput, setInitiativeInput] = useState("");
  const [targetId, setTargetId] = useState<string>("");
  const [fatigueToSpend, setFatigueToSpend] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const [localSpend, setLocalSpend] = useState<LocalProgressionSpend>({
    physical: { ataque: 0, esquiva: 0, parada: 0 },
    magic: { vias: { FUEGO: 0, AGUA: 0 } }
  });

  // [OPTIMIZACIÓN]: useCallback para evitar re-crear la función en cada render.
  // Dependencias: ninguna (vacío []), usa el callback updater de setLocalSpend.
  const handleViaChange = useCallback((viaName: 'FUEGO' | 'AGUA', newValue: number) => {
    setLocalSpend(prev => ({
      ...prev,
      magic: { ...prev.magic, vias: { ...prev.magic.vias, [viaName]: newValue } }
    }));
  }, []);

  // [OPTIMIZACIÓN]: useCallback para prevenir re-renders de hijos.
  // Dependencias: ninguna, ya que usa la versión funcional de setState.
  const handleStatChange = useCallback((stat: 'ataque' | 'esquiva' | 'parada', newValue: number) => {
    setLocalSpend(prev => ({
      ...prev,
      physical: { ...prev.physical, [stat]: newValue }
    }));
  }, []);
  
  // Use a hardcoded campaign and character for demonstration
  const CAMPAIGN_ID = "camp-1";
  const CHARACTER_ID = myCharacterId;



  useEffect(() => {
    connectToCampaign(CAMPAIGN_ID);
  }, [connectToCampaign]);

  const character = CHARACTER_ID ? characters[CHARACTER_ID] : null;

  // [OPTIMIZACIÓN]: useCallback para la función de aplicar daño.
  // Dependencias: damageAmount, targetId, selectedType (valores del UI local) y applyDamage (del store).
  const handleApplyDamage = useCallback(() => {
    const parsedAmount = parseInt(damageAmount, 10);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      applyDamage(targetId, parsedAmount, selectedType);
      setDamageAmount(""); // Limpiar
      inputRef.current?.select(); // Auto-seleccionar para el siguiente
    }
  }, [damageAmount, targetId, selectedType, applyDamage]);

  // [OPTIMIZACIÓN]: useCallback para enviar iniciativa.
  // Dependencias: initiativeInput, CHARACTER_ID (contexto local) y submitInitiative (del store).
  const handleSubmitInitiative = useCallback(() => {
    const val = parseInt(initiativeInput, 10);
    if (!isNaN(val) && CHARACTER_ID) {
      submitInitiative(CHARACTER_ID, val);
      setInitiativeInput("");
    }
  }, [initiativeInput, CHARACTER_ID, submitInitiative]);

  // [OPTIMIZACIÓN]: useCallback para manejar eventos del teclado.
  // Dependencias: handleApplyDamage (ya memorizado).
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyDamage();
    }
  }, [handleApplyDamage]);

  if (!hasSynced) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-amber-500 text-xl font-bold animate-pulse tracking-widest">Sincronizando Anima...</span>
        </div>
      </div>
    );
  }

  if (!character || !CHARACTER_ID) {
    return <CreateCharacterForm campaignId={CAMPAIGN_ID} />;
  }

  // Fallbacks if character not loaded yet
  const hp = character.hp;
  const maxHp = character.maxHp;
  const gold = character.gold;
  const isUnconscious = character.state === 'INCONSCIENTE';

  const hpPercentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  const isActiveTurn = combatState.initiativeQueue[combatState.turnIndex]?.characterId === CHARACTER_ID;
  const showInitiativeModal = combatState.isRequestingInitiative && character.currentInitiative === null;

  // Fase 9: Filtrado Dinámico de Vías Mágicas y Progresión
  let parsedDp = { vias: { FUEGO: 0, AGUA: 0 }, stats: { ataque: 0, esquiva: 0, parada: 0 } };
  try {
    if (character.dpDistribution) {
      parsedDp = JSON.parse(character.dpDistribution);
      if (!parsedDp.vias) parsedDp.vias = { FUEGO: 0, AGUA: 0 };
      if (!parsedDp.stats) parsedDp.stats = { ataque: 0, esquiva: 0, parada: 0 };
    }
  } catch(e) { 
    console.error('Error parsing dpDistribution', e); 
  }

  // [OPTIMIZACIÓN]: useMemo para derivar las vías mágicas del DP.
  // Dependencias: parsedDp.vias.FUEGO, parsedDp.vias.AGUA (evita re-evaluación si el DP general cambia pero no las vías).
  const currentVias = useMemo(() => ({
    FUEGO: parsedDp.vias.FUEGO || 0,
    AGUA: parsedDp.vias.AGUA || 0
  }), [parsedDp.vias.FUEGO, parsedDp.vias.AGUA]);
  
  // [OPTIMIZACIÓN]: useMemo para derivar stats físicas actuales.
  // Dependencias: los valores atómicos de stats.
  const currentStats = useMemo(() => ({
    ataque: parsedDp.stats.ataque || 0,
    esquiva: parsedDp.stats.esquiva || 0,
    parada: parsedDp.stats.parada || 0
  }), [parsedDp.stats.ataque, parsedDp.stats.esquiva, parsedDp.stats.parada]);

  // [OPTIMIZACIÓN]: useMemo para filtrar hechizos costosos.
  // Dependencias: currentVias (solo se recalcula si cambian las vías mágicas).
  const unlockedSpells = useMemo(() => Object.values(MAGIC_SPELLS_REGISTRY).filter(spell => {
    const reqLevel = spell.requiredLevel;
    // @ts-expect-error: Dynamic indexing by via
    return currentVias[spell.via] >= reqLevel;
  }), [currentVias]);

  // [OPTIMIZACIÓN]: useMemo para la configuración de la clase actual.
  // Dependencias: character.category (solo recalcula si el personaje cambia de clase).
  const classConfig = useMemo(() => CLASSES_CONFIG[character.category] || CLASSES_CONFIG['Freelancer'], [character.category]);
  
  // [OPTIMIZACIÓN]: useMemo para costos y límites máximos.
  // Dependencias: character.totalDP y los límites de la clase.
  const maxCombatDP = useMemo(() => character.totalDP * classConfig.limits.combat, [character.totalDP, classConfig.limits.combat]);
  
  const currentCombatDP = useMemo(() => 
    (currentStats.ataque * classConfig.costs.attack) + 
    (currentStats.esquiva * classConfig.costs.dodge) + 
    (currentStats.parada * classConfig.costs.block),
  [currentStats, classConfig.costs]);

  // [OPTIMIZACIÓN]: useMemo para totalizador de costos locales físicos.
  // Dependencias: el estado de gasto físico local y los costos de clase.
  const totalPhysicalCost = useMemo(() => 
    (localSpend.physical.ataque * classConfig.costs.attack) +
    (localSpend.physical.esquiva * classConfig.costs.dodge) +
    (localSpend.physical.parada * classConfig.costs.block),
  [localSpend.physical, classConfig.costs]);

  // [OPTIMIZACIÓN]: useMemo para sumar costos mágicos.
  const totalMagicCost = useMemo(() => localSpend.magic.vias.FUEGO + localSpend.magic.vias.AGUA, [localSpend.magic.vias]);
  
  // [OPTIMIZACIÓN]: Derivaciones simples envueltas en useMemo.
  // Dependencias: los costos totales y DP actual.
  const totalSpentThisLevel = useMemo(() => totalPhysicalCost + totalMagicCost, [totalPhysicalCost, totalMagicCost]);
  const projectedAvailableDP = useMemo(() => (character.totalDP - character.spentDP) - totalSpentThisLevel, [character.totalDP, character.spentDP, totalSpentThisLevel]);
  
  // FASE 9: Impacto real en estadísticas bases
  const effectiveAttack = useMemo(() => 50 + currentStats.ataque, [currentStats.ataque]); // Assuming base 50
  const effectiveDodge = useMemo(() => 50 + currentStats.esquiva, [currentStats.esquiva]);
  const effectiveBlock = useMemo(() => 50 + currentStats.parada, [currentStats.parada]);

  // Fase 10: Emitir Borrador al DJ
  useEffect(() => {
    if (!character) return;
    
    sendProgressionDraft({
      playerId: character.id,
      playerName: character.name,
      clase: character.category,
      spentPhysical: localSpend.physical,
      spentMagic: localSpend.magic,
      totalSpentDP: totalSpentThisLevel,
      isOverLimit: currentCombatDP + totalPhysicalCost > maxCombatDP || projectedAvailableDP < 0
    });
  }, [
    localSpend, 
    totalSpentThisLevel, 
    currentCombatDP, 
    totalPhysicalCost, 
    maxCombatDP, 
    projectedAvailableDP, 
    character, 
    sendProgressionDraft
  ]);

  // Construir la lista de combatientes para el Radar
  // [OPTIMIZACIÓN]: useMemo para transformar la lista de personajes.
  // Dependencias: el objeto dict de characters y characterStates (actualiza al recibir daño).
  const combatants: Combatant[] = useMemo(() => Object.values(characters).map(c => ({
    id: c.id,
    name: c.name,
    isNPC: c.category === 'NPC' || c.category === 'Enemigo' || c.hp === undefined, // Simulación rápida de flag NPC
    currentHp: combatState.characterStates[c.id]?.hp ?? c.hp ?? c.currentHp,
    maxHp: c.max_hp ?? c.hp ?? c.maxHp ?? 100
  })), [characters, combatState.characterStates]);

  // [OPTIMIZACIÓN]: useCallback para la declaración de ataque.
  // Dependencias: character.inventoryItems (para extraer el arma) y el action de declareAttack del store.
  const handleDeclareAttack = useCallback((targetId: string, totalAttack: number) => {
    // Tomamos el daño base del arma equipada o puño
    const equippedWeapon = character.inventoryItems?.find((i: Record<string, unknown>) => i.equipped && i.item?.type === 'WEAPON')?.item;
    const baseDamage = equippedWeapon?.baseDamage || 10;
    const damageType = equippedWeapon?.modifiers ? Object.keys(JSON.parse(equippedWeapon.modifiers))[0] : 'CON';

    declareAttack(targetId, totalAttack, baseDamage, damageType, {});
  }, [character.inventoryItems, declareAttack]);

  return (
    <div className="flex flex-col h-full text-white relative">
      {/* Fase 13: Turn Tracker */}
      <TurnOrderTracker roomId={CAMPAIGN_ID} isGM={false} />
      
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Columna Principal (Izquierda + Centro) */}
        <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-y-auto">
        {/* Fase 11: Modal de Defensa */}
      {incomingAttack && (
        <DefenseReactionModal
          combatInstanceId={incomingAttack.combatInstanceId}
          attackerName={incomingAttack.attackerName}
          attackRoll={incomingAttack.attackRoll}
          onDefenseSubmit={(type, roll) => submitDefense(incomingAttack.combatInstanceId, type, roll)}
        />
      )}
      
      {/* Banner de Turno Activo */}
      {isActiveTurn && !isUnconscious && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 mt-6 animate-bounce">
          <div className="bg-green-600 border-2 border-green-400 text-white font-black text-2xl px-12 py-4 rounded-full shadow-[0_0_30px_rgba(74,222,128,0.6)] uppercase tracking-widest">
            🌟 ¡ES TU TURNO DE ACTUAR! 🌟
          </div>
        </div>
      )}

      {/* Modal de Iniciativa */}
      {showInitiativeModal && (
        <InitiativeModal 
          round={combatState.round} 
          initiativeInput={initiativeInput} 
          setInitiativeInput={setInitiativeInput} 
          onSubmit={handleSubmitInitiative} 
        />
      )}
      
      {/* Modal de Contraataque */}
      {pendingCounterOpportunity && CHARACTER_ID && (
        <CounterOpportunityModal 
          bonus={pendingCounterOpportunity.bonus} 
          timeoutMs={pendingCounterOpportunity.timeoutMs} 
          onExecute={() => executeCounter(CHARACTER_ID, pendingCounterOpportunity.attackerId, pendingCounterOpportunity.bonus)} 
        />
      )}
      
      {/* Cola de Iniciativa */}
      {combatState.initiativeQueue.length > 0 && (
        <div className="col-span-12 bg-anima-panel/80 p-3 rounded-lg border border-anima-gold/20 flex items-center gap-4 overflow-x-auto shadow-glass-gold backdrop-blur-md">
          <span className="text-anima-gold font-serif font-bold whitespace-nowrap drop-shadow-md">⏳ Orden de Asalto ({combatState.round}):</span>
          <div className="flex gap-2">
            {combatState.initiativeQueue.map((entry, index) => {
              const c = characters[entry.characterId];
              if (!c) return null;
              const isCurrent = index === combatState.turnIndex;
              return (
                <div key={entry.characterId} className={`px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${isCurrent ? 'bg-gradient-to-r from-anima-gold to-yellow-600 text-black shadow-glow-gold border-yellow-300 border' : 'bg-black/50 text-gray-400 border border-gray-700'}`}>
                  <span>{c.name}</span>
                  <span className="bg-black/50 px-2 rounded text-xs text-anima-gold">{entry.initiative}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overlay INCONSCIENTE */}
      {isUnconscious && (
        <div className="absolute inset-0 bg-red-700/20 z-50 pointer-events-none rounded-xl animate-pulse transition-all"></div>
      )}

      {/* Columna Izquierda: Estado Vital */}
      <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
        <Card className="panel-arcano">
          <CardHeader className="pb-0 pt-3 relative z-10">
            <CardTitle className="text-xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-anima-gold to-yellow-500 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-wider flex items-center justify-between">
              <span>{character.name || 'Estado Vital'}</span>
            </CardTitle>
            <div className="flex flex-wrap gap-1 mt-1">
              {character.nephilimType && (
                <span className="bg-purple-900/60 border border-purple-500/50 text-purple-200 text-[9px] uppercase px-1.5 py-0.5 rounded shadow-[0_0_5px_rgba(168,85,247,0.4)]">Nephilim: {character.nephilimType}</span>
              )}
              {character.hasInhumanity && (
                <span className="bg-red-900/60 border border-red-500/50 text-red-200 text-[9px] uppercase px-1.5 py-0.5 rounded shadow-[0_0_5px_rgba(239,68,68,0.4)]">Inhumanidad</span>
              )}
              {character.hasZen && (
                <span className="bg-blue-900/60 border border-blue-500/50 text-blue-200 text-[9px] uppercase px-1.5 py-0.5 rounded shadow-[0_0_5px_rgba(59,130,246,0.4)]">Zen</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-2 relative z-10">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-serif text-gray-300 tracking-wider">HP (Vida)</span>
                <span className="font-bold text-anima-blood drop-shadow-md">{hp} / {maxHp}</span>
              </div>
              <div className="cristal-tubo h-4">
                <div className="bg-gradient-to-r from-red-900 to-anima-blood h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(138,3,3,0.8)] relative" style={{ width: `${hpPercentage}%` }}>
                   <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/20 rounded-t-full"></div>
                </div>
              </div>
              {character.isBleeding && (
                <div className="mt-1 flex items-center justify-between p-1 px-2 bg-red-950/40 rounded border border-red-900/50">
                  <span className="text-red-400 text-xs font-bold uppercase tracking-wider animate-pulse">Sangrando</span>
                  <span className="text-gray-400 text-xs">Daño base acum: {character.bleedingDamage}</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-serif text-gray-300 tracking-wider">Ki</span>
                <span className="font-bold text-anima-ki drop-shadow-md">{character.ki || 0}</span>
              </div>
              <div className="cristal-tubo h-4">
                <div className="bg-gradient-to-r from-cyan-900 to-anima-ki h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,229,255,0.8)] relative" style={{ width: `${Math.min(100, ((character.ki || 0) / 50) * 100)}%` }}>
                  <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/20 rounded-t-full"></div>
                </div>
              </div>
            </div>

            <div>
              <KiAccumulator characterId={CHARACTER_ID} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-serif text-gray-300 tracking-wider">Zeon</span>
                <span className="font-bold text-anima-zeon drop-shadow-md">{character.zeon || 0}</span>
              </div>
              <div className="cristal-tubo h-4">
                <div className="bg-gradient-to-r from-purple-900 to-[#8b5cf6] h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.8)] relative" style={{ width: '100%' }}>
                  <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/20 rounded-t-full"></div>
                </div>
              </div>
              
              {/* Canalización Mágica */}
              <div className="mt-2 p-1.5 bg-purple-950/40 rounded border border-purple-900/50">
                {character.isChanneling ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-purple-400 font-bold animate-pulse">Canalizando Magia...</span>
                      <span className="text-purple-300">{character.channeledZeon} Zeon</span>
                    </div>
                    <div className="text-[10px] text-gray-500 text-center">-20 a la Defensa Total</div>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="h-6 text-[10px] bg-red-900/80 hover:bg-red-800 btn-piedra-runica text-red-200 border-red-900"
                      onClick={() => useCombatStore.getState().stopChanneling(CHARACTER_ID)}
                    >
                      Detener Canalización
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    className="w-full h-7 text-[10px] btn-piedra-runica bg-gradient-to-b from-purple-950 to-black hover:from-purple-900 hover:to-black text-purple-200 border border-purple-900 uppercase tracking-widest shadow-[0_2px_5px_rgba(0,0,0,0.8)] relative z-10"
                    onClick={() => useCombatStore.getState().startChanneling(CHARACTER_ID, 'spell_custom')}
                  >
                    Empezar a Canalizar
                  </Button>
                )}
              </div>

              {/* Fase 7: Recarga de Arma */}
              {(character.reloadTurnsLeft ?? 0) > 0 && (
                <div className="mt-2 p-1.5 bg-yellow-950/40 rounded border border-yellow-900/50 flex flex-col gap-1 items-center justify-center">
                  <div className="flex items-center gap-2 text-yellow-500 font-bold animate-pulse text-xs uppercase tracking-wider">
                    <span>⏳ Recargando Arma</span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Turnos restantes: <span className="text-white font-black">{character.reloadTurnsLeft}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 p-2.5 bg-[#161411] border-[2px] border-[#3a2b1c] rounded shadow-[inset_0_0_10px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center border-b border-[#3a2b1c] pb-1">
                <span className="font-serif font-bold text-[#c5a059] tracking-wider uppercase text-xs">Cansancio</span>
                <span className="text-anima-goldglow font-bold bg-[#0a0806] px-2 rounded border border-[#2a2215] text-xs shadow-inner">
                  {character.currentFatigue ?? 5} / {character.maxFatigue ?? 5}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Button variant="outline" size="sm" onClick={() => setFatigueToSpend(Math.max(1, fatigueToSpend - 1))} className="h-6 w-6 p-0 btn-piedra-runica bg-gradient-to-b from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 border border-[#4a3b2c] text-[#8b7355] text-xs shadow-md">-</Button>
                <span className="text-anima-gold font-bold w-5 text-center text-xs">{fatigueToSpend}</span>
                <Button variant="outline" size="sm" onClick={() => setFatigueToSpend(Math.min(character.currentFatigue ?? 5, fatigueToSpend + 1))} className="h-6 w-6 p-0 btn-piedra-runica bg-gradient-to-b from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 border border-[#4a3b2c] text-[#8b7355] text-xs shadow-md">+</Button>
                <Button 
                  size="sm" 
                  className="flex-grow h-6 text-[9px] btn-piedra-runica bg-gradient-to-b from-blue-950 to-black hover:from-blue-900 hover:to-black border border-blue-900 text-blue-200 uppercase tracking-widest rounded shadow-[0_2px_5px_rgba(0,0,0,0.8)] relative z-10"
                  onClick={() => {
                    useCombatStore.getState().spendFatigue(CHARACTER_ID, fatigueToSpend);
                  }}
                  disabled={(character.currentFatigue ?? 5) < fatigueToSpend}
                >
                  Gastar (+{fatigueToSpend * 15})
                </Button>
              </div>
              {(character.currentFatigue ?? 5) <= 0 && (
                <div className="text-[9px] text-red-400 text-center font-bold uppercase mt-0.5">Agotado (-40 a la Acción)</div>
              )}
              
              <div className="mt-1">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full h-6 text-[9px] btn-piedra-runica bg-gradient-to-b from-red-950 to-black hover:from-red-900 hover:to-black border border-red-900 text-red-300 uppercase tracking-widest shadow-[0_2px_5px_rgba(0,0,0,0.8)]"
                  onClick={() => {
                    const level = prompt("Ingresa el nivel de fallo psíquico (Puntos de fatiga a perder):", "1");
                    const parsed = parseInt(level || "0");
                    if (!isNaN(parsed) && parsed > 0) {
                      useCombatStore.getState().reportPsychicFailure(CHARACTER_ID, parsed);
                    }
                  }}
                >
                  Sufrir Fallo Psíquico
                </Button>
              </div>
            </div>

            {character.temporaryShield > 0 && (
              <div className="mt-2 p-2 bg-cyan-950/80 rounded border border-cyan-500/50 flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛡️</span>
                  <span className="text-cyan-300 font-bold text-xs">Escudo Místico</span>
                </div>
                <span className="text-cyan-100 font-bold bg-cyan-900 px-2 py-0.5 text-xs rounded-full">{character.temporaryShield} HP</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="col-span-6 h-full z-10">
        <Card className="h-full border-gray-800 flex flex-col bg-[#0a0b0e] relative overflow-hidden shadow-inner-gold">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>
          <Tabs defaultValue="inventory" className="w-full h-full flex flex-col relative z-10">
            <CardHeader className="pb-0 pt-4 border-b border-gray-800/50 bg-[#0a0b0e]/80">
              <TabsList className="w-full grid grid-cols-4 bg-transparent gap-2">
                <TabsTrigger value="inventory" className="btn-piedra-runica data-[state=active]:border-anima-gold data-[state=active]:text-anima-goldglow data-[state=active]:shadow-glow-gold">Mi Inventario</TabsTrigger>
                <TabsTrigger value="shop" className="btn-piedra-runica data-[state=active]:border-anima-gold data-[state=active]:text-anima-goldglow data-[state=active]:shadow-glow-gold">Tienda</TabsTrigger>
                <TabsTrigger value="ki" className="btn-piedra-runica data-[state=active]:border-anima-ki data-[state=active]:text-cyan-300 data-[state=active]:shadow-glow-ki">Dominios Ki</TabsTrigger>
                <TabsTrigger value="progression" className="btn-piedra-runica data-[state=active]:border-purple-500 data-[state=active]:text-purple-300 data-[state=active]:shadow-glow-purple">Progresión</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex-grow p-0 pt-4">
              <TabsContent value="inventory" className="h-full m-0 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Equipamiento</h3>
                  <span className="text-anima-gold font-bold flex items-center gap-2 bg-[#1a1714] px-3 py-1 rounded-full border border-[#4a3b2c] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                    <img src="/assets/icons/gen_gold.webp" alt="Oro" className="w-5 h-5 object-contain drop-shadow-md" /> {gold} Oro
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  {character.inventory && Object.values(character.inventory).length > 0 ? (
                    Object.values(character.inventory).map((item: Record<string, unknown>) => (
                      <div key={item.id} className="relative bg-[#161411] p-1.5 rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.9)] border border-[#111]">
                        {/* Marco exterior metálico */}
                        <div className="border-[3px] border-[#3a2b1c] rounded-sm p-1 shadow-[inset_0_0_10px_rgba(0,0,0,1)] bg-[#2a2215]">
                          {/* Papel interior (Pergamino) */}
                          <div className="relative bg-[#d4cbb8] flex h-[90px] shadow-[inset_0_0_20px_rgba(139,115,85,0.4)]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-mathematics.png')" }}>
                            
                            {/* Icono a la izquierda */}
                            <div className="w-[90px] h-full flex-shrink-0 bg-[#2a2215] border-r-[3px] border-[#3a2b1c] flex items-center justify-center p-2">
                              <div className="w-14 h-14 rounded-full bg-[#161411] border-2 border-[#111] shadow-[inset_0_0_15px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                                <img src={ITEM_ICONS[item.id] || '/assets/icons/gen_ki_default.webp'} alt={item.name} className="w-[150%] h-[150%] object-cover object-center drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                              </div>
                            </div>

                            {/* Detalles a la derecha */}
                            <div className="flex-grow p-3 flex flex-col justify-between">
                              <div>
                                <div className="font-bold text-[#1a1714] font-serif text-md leading-tight tracking-wide">
                                  {item.name} {item.equipped && <span className="text-xs text-green-800 ml-1 font-sans font-bold bg-green-900/10 px-1 rounded-sm border border-green-800/30">(Equipado)</span>}
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <div className="text-xs text-[#5c4a35] font-bold uppercase tracking-widest">{item.type}</div>
                                  <div className="text-xs text-[#1a1714] font-bold">Cant: {item.quantity}</div>
                                </div>
                              </div>
                              
                              <div className="self-end flex gap-2">
                                {item.type === 'ARMADURA' && (
                                  item.equipped ? (
                                    <Button size="sm" onClick={() => unequipItem(CHARACTER_ID, item.id)} className="h-7 text-[10px] btn-piedra-runica bg-gradient-to-b from-red-900 to-black hover:from-red-800 hover:to-red-900 border-2 border-red-900 text-red-200 uppercase tracking-wider rounded shadow-[0_2px_5px_rgba(0,0,0,0.8)]">Desequipar</Button>
                                  ) : (
                                    <Button size="sm" onClick={() => equipItem(CHARACTER_ID, item.id)} className="h-7 text-[10px] btn-piedra-runica bg-gradient-to-b from-green-900 to-black hover:from-green-800 hover:to-green-900 border-2 border-green-900 text-green-200 uppercase tracking-wider rounded shadow-[0_2px_5px_rgba(0,0,0,0.8)]">Equipar</Button>
                                  )
                                )}
                                {item.type === 'CONSUMIBLE' && (
                                  <Button size="sm" onClick={() => useItem(CHARACTER_ID, item.id)} className="h-7 text-[10px] btn-piedra-runica bg-gradient-to-b from-blue-900 to-black hover:from-blue-800 hover:to-blue-900 border-2 border-blue-900 text-blue-200 uppercase tracking-wider rounded shadow-[0_2px_5px_rgba(0,0,0,0.8)]">Usar</Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 bg-[#161411]/80 border border-[#3a2b1c] rounded shadow-inner-gold">
                      <span className="text-4xl mb-4 opacity-50">📜</span>
                      <p className="text-[#8b7355] font-serif text-lg tracking-wider text-center">Tu inventario está vacío.</p>
                      <p className="text-gray-500 text-sm mt-2 text-center">Visita el Mercader Local para adquirir equipamiento y provisiones.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="shop" className="h-full m-0 p-6 relative">
                {/* Estrellas de fondo para la tienda completa */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none mix-blend-screen"></div>
                
                <div className="flex justify-between items-center mb-6 relative z-10 border-b border-[#4a3b2c] pb-2">
                  <h3 className="text-2xl font-serif font-bold text-anima-gold tracking-widest drop-shadow-md">Mercader Local</h3>
                  <span className="text-anima-gold font-bold flex items-center gap-2 bg-[#1a1714] px-4 py-1 rounded-full border border-[#4a3b2c] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                    <img src="/assets/icons/gen_gold.webp" alt="Oro" className="w-6 h-6 object-contain drop-shadow-md" /> {gold} Oro
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-8 relative z-10">
                  {[
                    { id: 'item-potion-minor', name: 'Poción de Vida Menor', cost: 10, type: 'CONSUMIBLE', icon: '/assets/icons/gen_potion_minor.webp', mods: null },
                    { id: 'item-potion-major', name: 'Poción de Vida Mayor', cost: 30, type: 'CONSUMIBLE', icon: '/assets/icons/gen_potion_major.webp', mods: null },
                    { id: 'item-antidote', name: 'Antídoto', cost: 15, type: 'CONSUMIBLE', icon: '/assets/icons/gen_antidote.webp', mods: null },
                    { id: 'item-leather-armor', name: 'Coraza de Cuero', cost: 90, type: 'ARMADURA', icon: '/assets/icons/gen_leather_armor.webp', mods: { FIL: 2, CON: 1, PEN: 1 } },
                  ].map(shopItem => (
                    <div key={shopItem.id} className="relative bg-[#161411] p-1.5 rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.9)] border border-[#111]">
                      {/* Marco exterior metálico */}
                      <div className="border-[3px] border-[#3a2b1c] rounded-sm p-1 shadow-[inset_0_0_10px_rgba(0,0,0,1)] bg-[#2a2215]">
                        {/* Papel interior (Pergamino) */}
                        <div className="relative bg-[#d4cbb8] flex h-[100px] shadow-[inset_0_0_20px_rgba(139,115,85,0.4)]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/old-mathematics.png')" }}>
                          
                          {/* Icono a la izquierda */}
                          <div className="w-[100px] h-full flex-shrink-0 bg-[#2a2215] border-r-[3px] border-[#3a2b1c] flex items-center justify-center p-2">
                            <div className="w-16 h-16 rounded-full bg-[#161411] border-2 border-[#111] shadow-[inset_0_0_15px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                              <img src={shopItem.icon} alt={shopItem.name} className="w-[150%] h-[150%] object-cover object-center drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                            </div>
                          </div>

                          {/* Detalles a la derecha */}
                          <div className="flex-grow p-3 flex flex-col justify-between">
                            <div>
                              <div className="font-bold text-[#1a1714] font-serif text-lg leading-tight tracking-wide">{shopItem.name}</div>
                              <div className="text-xs text-[#5c4a35] font-bold mt-1 uppercase tracking-widest">{shopItem.type}</div>
                            </div>
                            
                            <div className="self-end">
                              <Button 
                                onClick={() => buyItem(CHARACTER_ID, { 
                                  id: shopItem.id, 
                                  name: shopItem.name, 
                                  quantity: 1, 
                                  type: shopItem.type, 
                                  equipped: false,
                                  modifiers: shopItem.mods 
                                }, shopItem.cost)}
                                disabled={gold < shopItem.cost}
                                className="h-8 btn-piedra-runica bg-gradient-to-b from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 border-2 border-anima-gold text-anima-gold text-xs font-bold rounded shadow-[0_2px_5px_rgba(0,0,0,0.8)] disabled:opacity-50 disabled:border-gray-600 disabled:text-gray-500"
                              >
                                Comprar ({shopItem.cost} <img src="/assets/icons/gen_gold.webp" alt="Oro" className="w-3 h-3 object-contain inline-block ml-0.5" />)
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="ki" className="h-full m-0 p-0 flex flex-col gap-4 overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-[#4a3b2c] scrollbar-track-transparent">
                <KiTree characterId={CHARACTER_ID} />
                
                {/* FASE 7: Artes Marciales */}
                <div className="bg-[#161411] border-[2px] border-[#3a2b1c] p-4 rounded shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative mt-4">
                  <h3 className="text-xl font-serif text-anima-gold font-bold uppercase tracking-widest border-b border-[#3a2b1c] pb-2 mb-3 flex items-center gap-2">
                    <span>🥋</span> Artes Marciales Conocidas
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {character.martialStyles && character.martialStyles.length > 0 ? (
                      character.martialStyles.map((styleId: string) => (
                        <div key={styleId} className="bg-[#2a2215] border border-[#5c4a35] rounded p-2 flex justify-between items-center shadow-[0_2px_5px_rgba(0,0,0,0.8)]">
                          <span className="font-serif text-[#fcd97b] font-bold uppercase tracking-wide text-sm">{styleId.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] bg-[#161411] px-2 py-1 rounded text-gray-400 border border-[#3a2b1c]">Equipado</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center text-[#8b7355] text-sm italic font-serif py-4">
                        Aún no dominas ningún estilo de combate marcial.
                      </div>
                    )}
                  </div>
                  {character.activeMartialBonuses && character.martialStyles?.length > 0 && (
                    <div className="mt-3 p-2 bg-[#0a0806] rounded border border-[#3a2b1c] text-xs text-gray-300 font-serif flex justify-between">
                      <span>Daño Base: <span className="text-white font-bold">{character.activeMartialBonuses.damage}</span></span>
                      <span>Bono Ataque: <span className="text-anima-blood font-bold">+{character.activeMartialBonuses.attackBonus}</span></span>
                      <span>Bono Defensa: <span className="text-green-500 font-bold">+{character.activeMartialBonuses.defenseBonus}</span></span>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="progression" className="h-full m-0 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-[#4a3b2c] scrollbar-track-transparent">
                {/* Cabecera Global */}
                <div className="mb-6 p-4 bg-slate-950 border border-slate-700 rounded-lg flex justify-between items-center shadow-lg">
                  <div>
                    <h2 className="text-2xl font-serif text-anima-gold font-bold">Distribución de PD</h2>
                    <div className="text-slate-400 text-sm">Clase: <span className="text-slate-200 font-bold">{character.category}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-mono font-black text-white drop-shadow-md">
                      {projectedAvailableDP} <span className="text-lg text-slate-500 font-normal">/ {character.totalDP}</span>
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">PD Disponibles</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columna Izquierda: Físico */}
                  <PhysicalLevelUpSection 
                    currentStats={currentStats}
                    localSpend={localSpend.physical}
                    classCosts={{
                      ataque: classConfig.costs.attack,
                      esquiva: classConfig.costs.dodge,
                      parada: classConfig.costs.block
                    }}
                    maxCombatDP={maxCombatDP}
                    currentCombatDP={currentCombatDP}
                    availableDP={projectedAvailableDP + totalPhysicalCost} // Available for physical is total free + what physical already took
                    onChangeStat={handleStatChange}
                  />

                  {/* Columna Derecha: Mágico */}
                  <MagicLevelUpSection 
                    currentVias={currentVias}
                    localSpend={{ actuacion: 0, zeon: 0, vias: localSpend.magic.vias }}
                    onChangeVia={handleViaChange}
                    availableDP={projectedAvailableDP + totalMagicCost}
                  />
                </div>
                
                <div className="mt-6 flex justify-end pb-10">
                  <Button 
                    className="bg-green-700 hover:bg-green-600 text-white font-bold px-8 py-6 text-lg border-2 border-green-500 shadow-[0_0_15px_rgba(22,163,74,0.5)] transition-all disabled:opacity-50 disabled:bg-gray-800 disabled:border-gray-700" 
                    disabled={totalSpentThisLevel <= 0 || projectedAvailableDP < 0 || (currentCombatDP + totalPhysicalCost > maxCombatDP)}
                    onClick={() => {
                     const mergedDp = {
                       ...parsedDp,
                       vias: {
                         FUEGO: currentVias.FUEGO + localSpend.magic.vias.FUEGO,
                         AGUA: currentVias.AGUA + localSpend.magic.vias.AGUA
                       },
                       stats: {
                         ataque: currentStats.ataque + localSpend.physical.ataque,
                         esquiva: currentStats.esquiva + localSpend.physical.esquiva,
                         parada: currentStats.parada + localSpend.physical.parada
                       }
                     };
                     useCombatStore.getState().gmOverrideStats(CHARACTER_ID, {
                       dpDistribution: JSON.stringify(mergedDp),
                       spentDP: character.spentDP + totalSpentThisLevel
                     });
                     setLocalSpend({ physical: { ataque: 0, esquiva: 0, parada: 0 }, magic: { vias: { FUEGO: 0, AGUA: 0 } } });
                  }}>
                    Confirmar Transacción de PD
                  </Button>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Panel Derecho: Acciones y Alertas */}
      <div className="col-span-3 flex flex-col gap-4 h-full z-10">
        
        {/* Recordatorios y Alertas */}
        <Card className="panel-arcano shrink-0">
          <CardHeader className="relative z-10 pb-2 pt-4">
            <CardTitle className="text-lg font-serif text-transparent bg-clip-text bg-gradient-to-r from-anima-gold to-yellow-500 drop-shadow-md flex items-center gap-2 uppercase tracking-wider">
              <span className="text-yellow-500 text-xl">🔔</span> Recordatorios y Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isUnconscious && (
              <div className="p-3 bg-red-950/80 border border-red-500/80 rounded-md animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <p className="text-red-300 font-bold text-sm">
                  ¡ESTÁS INCONSCIENTE! Tus puntos de vida han llegado a 0. No puedes realizar acciones hasta ser curado.
                </p>
              </div>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full h-10 btn-piedra-runica bg-gradient-to-b from-[#2a2215] to-[#161411] border border-[#5c4a35] text-[#c5a059] hover:from-[#3a2b1c] hover:to-[#161411] flex items-center justify-between shadow-[0_2px_5px_rgba(0,0,0,0.8)] px-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-xl drop-shadow-md">📜</span>
                    <span className="font-bold font-serif uppercase tracking-widest text-xs">Registro de Efectos</span>
                  </div>
                  {character.activeEffects && character.activeEffects.length > 0 && (
                    <span className="bg-red-900 text-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                      {character.activeEffects.length}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] bg-[#161411] border-[2px] border-[#3a2b1c] text-gray-200 shadow-[inset_0_0_20px_rgba(0,0,0,1),0_10px_30px_rgba(0,0,0,0.9)]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-wood.png')" }}>
                <DialogHeader className="border-b border-[#3a2b1c] pb-3">
                  <DialogTitle className="font-serif text-[#c5a059] flex items-center gap-2 uppercase tracking-widest text-lg drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                    <span className="text-2xl">📜</span> Registro de Efectos
                  </DialogTitle>
                </DialogHeader>
                
                <div className="py-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#4a3b2c] scrollbar-track-transparent pr-2">
                  {character.activeEffects && character.activeEffects.length > 0 ? (
                    character.activeEffects.map((effect: Record<string, unknown>) => (
                      <div key={effect.id} className="text-sm p-3 bg-gradient-to-r from-[#2a0808] to-[#1a0505] rounded border border-red-900/80 text-red-200 shadow-[inset_0_0_8px_rgba(0,0,0,0.8)] mb-3 flex flex-col gap-2 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30 pointer-events-none"></div>
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="text-red-400 font-bold uppercase tracking-wider font-serif text-base drop-shadow-md">{effect.name}</span>
                          <span className="text-[10px] font-bold text-red-200 bg-red-950 px-2 py-1 rounded border border-red-900/50 shadow-inner uppercase tracking-wider">
                            {effect.durationRounds} turnos
                          </span>
                        </div>
                        <div className="relative z-10 text-xs text-red-300/80 italic font-serif">
                          Recibes {effect.value} puntos de daño vital al final del asalto.
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm p-4 bg-[#0a0806] rounded border border-[#2a2215] text-[#5c4a35] shadow-inner italic font-serif text-center mt-2">
                      Ningún mal acecha tu cuerpo. Escribes tu propio destino.
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Habilidades Activas */}
        {character.maxZeon > 0 && (
          <Card className="panel-arcano shrink-0">
            <CardHeader className="pb-2 pt-4 relative z-10">
              <CardTitle className="text-lg font-serif text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#8b5cf6] drop-shadow-md flex items-center gap-2">
                📖 Grimorio Místico
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {unlockedSpells.map(spell => {
                const target = 'ENEMY'; // Simplified target logic for magic registry
                const isAttack = true;
                const borderColor = 'border-purple-800';
                const textColor = 'text-purple-300';
                const hoverBg = 'hover:bg-purple-950';
                const icon = '🔮';
                
                return (
                  <Button 
                    key={spell.id}
                    onClick={() => useAbility(CHARACTER_ID, targetId, spell.id)} 
                    variant="outline" 
                    className={`w-full justify-start ${borderColor} ${textColor} ${hoverBg} transition-all active:scale-95 duration-100 text-xs text-left h-auto py-2 flex flex-col items-start gap-1`}
                  >
                    <div className="flex w-full justify-between items-center font-bold">
                      <span>{icon} {spell.name}</span>
                      <span className="text-[10px] text-purple-400 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-800">
                        {spell.zeonCostBase} Zeon
                      </span>
                    </div>
                    <div className="text-[9px] text-gray-400 font-serif whitespace-normal">
                      Vía: {spell.via} Nvl {spell.requiredLevel} - {spell.description}
                    </div>
                  </Button>
                );
              })}
              {unlockedSpells.length === 0 && (
                 <div className="text-xs text-center text-purple-500/50 italic p-4">
                   No tienes nivel suficiente en las vías mágicas para lanzar conjuros.
                 </div>
              )}
            </CardContent>
          </Card>
        )}

        {character.maxKi > 0 && (
          <Card className="panel-arcano shrink-0">
            <CardHeader className="pb-2 pt-4 relative z-10">
              <CardTitle className="text-lg font-serif text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 drop-shadow-md flex items-center gap-2">
                🥋 Técnicas de Ki
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {Object.values(KI_ABILITIES).map(tech => {
                const target = tech.target === 'ENEMY' ? targetId : CHARACTER_ID;
                const isAttack = tech.type === 'DAMAGE' || tech.type === 'EFFECT';
                const borderColor = isAttack ? 'border-red-800' : 'border-blue-800';
                const textColor = isAttack ? 'text-red-400' : 'text-blue-300';
                const hoverBg = isAttack ? 'hover:bg-red-950' : 'hover:bg-blue-950';
                const icon = isAttack ? '💥' : '💪';
                const extraText = tech.target === 'ENEMY' ? ' - Usa Objetivo' : '';
                return (
                  <Button 
                    key={tech.id}
                    onClick={() => useAbility(CHARACTER_ID, target, tech.id)} 
                    variant="outline" 
                    className={`w-full justify-start ${borderColor} ${textColor} ${hoverBg} transition-all active:scale-95 duration-100 text-xs`}
                  >
                    {icon} {tech.name} ({tech.cost} Ki){extraText}
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Acciones de Combate */}
        <Card className="panel-arcano flex-grow flex flex-col min-h-0">
          <CardHeader className="pb-2 pt-3 relative z-10 shrink-0 border-b border-[#3a2b1c]">
            <CardTitle className="text-lg font-serif text-transparent bg-clip-text bg-gradient-to-r from-anima-gold to-yellow-500 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-widest flex items-center gap-2 justify-center">
              ⚔️ Acciones de Combate ⚔️
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 relative z-10 overflow-y-auto p-3 pt-3">
            {/* Lanzador de Dados */}
            <DiceRoller characterId={CHARACTER_ID} />

            {/* Calculadora de Daño */}
            <div className="flex flex-col gap-3 p-3 bg-[#161411] border-[2px] border-[#3a2b1c] rounded shadow-[inset_0_0_10px_rgba(0,0,0,1)] relative overflow-hidden mt-1">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-20 pointer-events-none"></div>
              
              <div className="flex items-center gap-2 border-b border-[#3a2b1c] pb-2 relative z-10">
                <span className="text-xl text-red-700 drop-shadow-md">🩸</span>
                <h4 className="font-bold text-red-500 text-xs uppercase tracking-widest font-serif drop-shadow-md">Ejecutar Daño</h4>
              </div>

              <div className="flex flex-col gap-2 relative z-10">
                <select 
                  value={targetId} 
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-[#0a0806] border border-[#3a2b1c] shadow-inner text-[#c5a059] rounded p-2 text-sm focus:border-red-900 focus:ring-1 focus:ring-red-900 outline-none transition-colors font-serif italic"
                  style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-scales.png')" }}
                >
                  <option value="">Seleccionar Víctima...</option>
                  {Object.values(characters).map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.id.startsWith('npc_') ? '(Enemigo)' : ''}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2 relative z-10">
                <div className="flex-grow">
                  <Input 
                    ref={inputRef}
                    type="number" 
                    placeholder="Cantidad..." 
                    value={damageAmount} 
                    onChange={(e) => setDamageAmount(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-[#0a0806] border-[#3a2b1c] text-red-500 text-center font-bold text-lg h-9 shadow-inner focus:border-red-900 font-serif"
                    style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-scales.png')" }}
                  />
                </div>
                <select 
                  value={selectedType} 
                  onChange={(e) => setSelectedType(e.target.value as DamageType)}
                  className="bg-[#0a0806] border border-[#3a2b1c] text-[#8b7355] rounded p-1.5 focus:border-red-900 outline-none text-xs font-serif uppercase tracking-wider"
                >
                  <option value="FIL">Filo</option>
                  <option value="CON">Contundente</option>
                  <option value="PEN">Penetración</option>
                  <option value="CAL">Calor</option>
                  <option value="ELE">Electricidad</option>
                  <option value="FRI">Frío</option>
                  <option value="ENE">Energía</option>
                </select>
              </div>

              <Button onClick={handleApplyDamage} className="w-full mt-1 h-9 text-xs btn-piedra-runica bg-gradient-to-b from-red-950 to-black hover:from-red-900 hover:to-black border border-red-900 text-red-200 uppercase tracking-widest shadow-[0_2px_5px_rgba(0,0,0,0.8)] relative z-10">
                Aplicar Daño
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FASE 7: Maniobras de Combate */}
        <Card className="panel-arcano shrink-0 mt-2">
          <CardHeader className="relative z-10 pb-2 pt-4">
            <CardTitle className="text-lg font-serif text-transparent bg-clip-text bg-gradient-to-r from-[#c5a059] to-[#fcd97b] drop-shadow-md flex items-center gap-2 uppercase tracking-wider">
              <span>⚔️</span> Actitud de Combate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-[#0a0806] rounded border border-[#3a2b1c] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
              <div className="text-sm font-serif text-[#8b7355] mb-2 uppercase tracking-widest text-center border-b border-[#3a2b1c] pb-1">Defensa Total</div>
              <Button 
                onClick={() => {
                  const state = combatState.characterStates[CHARACTER_ID] || { isDefensive: false };
                  useCombatStore.getState().setFullDefense(CHARACTER_ID, !state.isDefensive);
                }}
                className={`w-full h-10 font-bold font-serif uppercase tracking-widest border-2 transition-all shadow-[0_2px_5px_rgba(0,0,0,0.8)] relative z-10 ${combatState.characterStates[CHARACTER_ID]?.isDefensive ? 'bg-gradient-to-b from-blue-900 to-black text-blue-300 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gradient-to-b from-[#2a2215] to-[#161411] text-[#5c4a35] border-[#3a2b1c] hover:border-[#c5a059] hover:text-[#c5a059]'}`}
              >
                {combatState.characterStates[CHARACTER_ID]?.isDefensive ? '🛡️ Defensa Total Activa' : 'Activar Defensa Total (+30)'}
              </Button>
              <div className="text-[10px] text-gray-500 text-center mt-2 font-serif italic leading-tight">
                Decláralo antes de que el asalto se resuelva. Renuncias a todas tus acciones activas para enfocarte solo en defender.
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* MODAL DE CRÍTICO RECIBIDO */}
      {criticalHitEvent && criticalHitEvent.defenderId === myCharacterId && (
        <CriticalHitModal event={criticalHitEvent} onDismiss={clearCriticalHit} />
      )}

      {/* MODAL DE PIFIA */}
      {fumbleEvent && fumbleEvent.characterId === myCharacterId && (
        <FumbleModal event={fumbleEvent} onDismiss={clearFumbleEvent} />
      )}

      {/* MODAL DE ARMA ROTA */}
      {weaponShatteredEvent && weaponShatteredEvent.characterId === myCharacterId && (
        <WeaponShatteredModal event={weaponShatteredEvent} onDismiss={clearWeaponShattered} />
      )}

      </div>
      
      {/* Fase 11, 12 y 17: Radar de Objetivos, Log y Magia (Panel Derecho) */}
      <div className="w-80 border-l border-[#3a2b1c] bg-[#0a0806] shrink-0 flex flex-col h-full overflow-y-auto">
        <div className="p-2 border-b border-slate-800">
          <MagicConsole 
            roomId={CAMPAIGN_ID} 
            characterId={character.id} 
            magicData={character.magicData} 
            persistentSpells={persistentSpells} 
          />
        </div>
        <CombatTargetPanel 
          combatants={combatants} 
          currentUserId={character.id} 
          onDeclareAttack={handleDeclareAttack} 
        />
        <div className="p-4 border-t border-slate-800 flex-1">
          <BattleLogPanel logs={logs} activeCharacterId={character.id} isGM={false} />
        </div>
      </div>
      </div>
    </div>
  );
}
