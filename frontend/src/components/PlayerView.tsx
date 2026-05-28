import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useCombatStore, type DamageType } from "../store/combatStore";
import { CreateCharacterForm } from "./CreateCharacterForm";
import { KI_ABILITIES, MAGIC_SPELLS } from "../config/abilitiesRegistry";
import { KiTree } from "./KiTree";
import { KiAccumulator } from "./ui/KiAccumulator";
import { DiceRoller } from "./ui/DiceRoller";

export function PlayerView() {
  const { characters, applyDamage, connectToCampaign, equipItem, unequipItem, useItem, useAbility, combatState, submitInitiative, myCharacterId, buyItem, hasSynced, pendingCounterOpportunity, executeCounter, criticalHitEvent, clearCriticalHit, weaponShatteredEvent, clearWeaponShattered } = useCombatStore();
  const [damageAmount, setDamageAmount] = useState("");
  const [selectedType, setSelectedType] = useState<DamageType>("FIL");
  const [initiativeInput, setInitiativeInput] = useState("");
  const [targetId, setTargetId] = useState<string>("");
  const [fatigueToSpend, setFatigueToSpend] = useState(1);
  const [counterTimeLeft, setCounterTimeLeft] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use a hardcoded campaign and character for demonstration
  const CAMPAIGN_ID = "camp-1";
  const CHARACTER_ID = myCharacterId;

  useEffect(() => {
    if (pendingCounterOpportunity) {
      setCounterTimeLeft(pendingCounterOpportunity.timeoutMs);
      const interval = setInterval(() => {
        setCounterTimeLeft(prev => {
          if (prev <= 100) {
            clearInterval(interval);
            return 0;
          }
          return prev - 100;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [pendingCounterOpportunity]);

  useEffect(() => {
    connectToCampaign(CAMPAIGN_ID);
  }, [connectToCampaign]);

  const character = CHARACTER_ID ? characters[CHARACTER_ID] : null;

  const handleApplyDamage = () => {
    const parsedAmount = parseInt(damageAmount, 10);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      applyDamage(targetId, parsedAmount, selectedType);
      setDamageAmount(""); // Limpiar
      inputRef.current?.select(); // Auto-seleccionar para el siguiente
    }
  };

  const handleSubmitInitiative = () => {
    const val = parseInt(initiativeInput, 10);
    if (!isNaN(val) && CHARACTER_ID) {
      submitInitiative(CHARACTER_ID, val);
      setInitiativeInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyDamage();
    }
  };

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

  return (
    <div className="grid grid-cols-12 gap-4 h-full p-4 text-white relative">
      
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
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm rounded-xl">
          <Card className="bg-gray-900 border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.3)] w-[400px]">
            <CardHeader>
              <CardTitle className="text-2xl text-yellow-500 text-center uppercase tracking-wide">¡Tira Iniciativa!</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-gray-300 text-center">El Director de Juego ha solicitado las iniciativas para el Asalto {combatState.round}.</p>
              <Input 
                type="number" 
                placeholder="Resultado de los dados..." 
                className="text-2xl py-6 text-center bg-gray-950 border-gray-700" 
                value={initiativeInput}
                onChange={(e) => setInitiativeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitInitiative()}
                autoFocus
              />
              <Button onClick={handleSubmitInitiative} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-6 text-xl">
                Enviar Resultado
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Modal de Contraataque */}
      {pendingCounterOpportunity && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm rounded-xl">
          <Card className="bg-red-950 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] w-[400px]">
            <CardHeader>
              <CardTitle className="text-2xl text-red-500 text-center uppercase tracking-wide animate-pulse">
                ¡Oportunidad de Contraataque!
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-center">
              <p className="text-gray-200">Has bloqueado/esquivado el ataque con éxito.</p>
              <p className="text-4xl font-black text-yellow-500 drop-shadow-md">
                BONO: +{pendingCounterOpportunity.bonus}
              </p>
              <div className="w-full bg-gray-900 h-4 rounded-full border border-gray-700 overflow-hidden">
                <div 
                  className="bg-red-500 h-full transition-all duration-100 ease-linear" 
                  style={{ width: `${(counterTimeLeft / pendingCounterOpportunity.timeoutMs) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400">
                Tiempo restante: {(counterTimeLeft / 1000).toFixed(1)}s
              </p>
              <Button 
                onClick={() => executeCounter(CHARACTER_ID, pendingCounterOpportunity.attackerId, pendingCounterOpportunity.bonus)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-6 text-xl transition-transform active:scale-95"
              >
                ¡EJECUTAR CONTRAATAQUE!
              </Button>
            </CardContent>
          </Card>
        </div>
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
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-2xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-anima-gold to-yellow-500 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-wider">Estado Vital</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-serif text-gray-300 tracking-wider">HP (Vida)</span>
                <span className="font-bold text-anima-blood drop-shadow-md">{hp} / {maxHp}</span>
              </div>
              <div className="cristal-tubo h-5">
                <div className="bg-gradient-to-r from-red-900 to-anima-blood h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(138,3,3,0.8)] relative" style={{ width: `${hpPercentage}%` }}>
                   <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/20 rounded-t-full"></div>
                </div>
              </div>
              {character.isBleeding && (
                <div className="mt-2 flex items-center justify-between p-2 bg-red-950/40 rounded border border-red-900/50">
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
              <div className="cristal-tubo h-5">
                <div className="bg-gradient-to-r from-cyan-900 to-anima-ki h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,229,255,0.8)] relative" style={{ width: `${Math.min(100, ((character.ki || 0) / 50) * 100)}%` }}>
                  <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/20 rounded-t-full"></div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <KiAccumulator characterId={CHARACTER_ID} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-serif text-gray-300 tracking-wider">Zeon</span>
                <span className="font-bold text-anima-zeon drop-shadow-md">{character.zeon || 0}</span>
              </div>
              <div className="cristal-tubo h-5">
                <div className="bg-gradient-to-r from-purple-900 to-[#8b5cf6] h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.8)] relative" style={{ width: '100%' }}>
                  <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/20 rounded-t-full"></div>
                </div>
              </div>
              
              {/* Canalización Mágica */}
              <div className="mt-3 p-2 bg-purple-950/40 rounded border border-purple-900/50">
                {character.isChanneling ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-purple-400 font-bold animate-pulse">Canalizando Magia...</span>
                      <span className="text-purple-300">{character.channeledZeon} Zeon Acumulado</span>
                    </div>
                    <div className="text-[10px] text-gray-500 text-center">-20 a la Defensa Total</div>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="h-6 text-xs bg-red-900/80 hover:bg-red-800"
                      onClick={() => useCombatStore.getState().stopChanneling(CHARACTER_ID!)}
                    >
                      Detener Canalización
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    className="w-full h-8 text-xs bg-purple-900 hover:bg-purple-800 text-white border border-purple-700"
                    onClick={() => useCombatStore.getState().startChanneling(CHARACTER_ID!, 'spell_custom')}
                  >
                    Empezar a Canalizar
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 bg-black/40 p-3 rounded-lg border border-gray-800/50">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-300">Cansancio</span>
                <span className="text-anima-goldglow font-bold">{character.currentFatigue ?? 5} / {character.maxFatigue ?? 5}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setFatigueToSpend(Math.max(1, fatigueToSpend - 1))} className="h-8 w-8 p-0 border-gray-600 bg-gray-800 hover:bg-gray-700">-</Button>
                <span className="text-white font-bold w-4 text-center">{fatigueToSpend}</span>
                <Button variant="outline" size="sm" onClick={() => setFatigueToSpend(Math.min(character.currentFatigue ?? 5, fatigueToSpend + 1))} className="h-8 w-8 p-0 border-gray-600 bg-gray-800 hover:bg-gray-700">+</Button>
                <Button 
                  size="sm" 
                  className="flex-grow bg-blue-900 hover:bg-blue-800 text-white border border-blue-700"
                  onClick={() => {
                    useCombatStore.getState().spendFatigue(CHARACTER_ID!, fatigueToSpend);
                  }}
                  disabled={(character.currentFatigue ?? 5) < fatigueToSpend}
                >
                  Gastar (+{fatigueToSpend * 15})
                </Button>
              </div>
              {(character.currentFatigue ?? 5) <= 0 && (
                <div className="text-xs text-red-400 text-center font-bold uppercase mt-1">Agotado (-40 Todas las Acciones)</div>
              )}
              
              <div className="mt-2 border-t border-gray-800 pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full h-8 text-xs border-red-900/50 text-red-400 hover:bg-red-950/50 hover:text-red-300"
                  onClick={() => {
                    const level = prompt("Ingresa el nivel de fallo psíquico (Puntos de fatiga a perder):", "1");
                    const parsed = parseInt(level || "0");
                    if (!isNaN(parsed) && parsed > 0) {
                      useCombatStore.getState().reportPsychicFailure(CHARACTER_ID!, parsed);
                    }
                  }}
                >
                  Sufrir Fallo Psíquico
                </Button>
              </div>
            </div>

            {character.temporaryShield > 0 && (
              <div className="mt-4 p-3 bg-cyan-950/80 rounded border border-cyan-500/50 flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛡️</span>
                  <span className="text-cyan-300 font-bold">Escudo Místico Activo</span>
                </div>
                <span className="text-cyan-100 font-bold bg-cyan-900 px-3 py-1 rounded-full">{character.temporaryShield} HP</span>
              </div>
            )}

            {/* Badges de Efectos Activos bajo la vida */}
            {character.activeEffects && character.activeEffects.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {character.activeEffects.map((effect: any) => (
                  <span key={effect.id} className="bg-red-950/80 text-red-300 text-xs px-2 py-1 rounded border border-red-900 shadow-sm flex items-center">
                    {effect.type === 'SANGRADO' ? '🩸' : effect.type === 'VENENO' ? '🤢' : '⚠️'} 
                    <span className="ml-1 font-bold">{effect.name}</span>
                    <span className="ml-1 opacity-80">- {effect.value} PV ({effect.durationRounds} asaltos)</span>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {character.maxZeon > 0 && (
          <Card className="panel-arcano">
            <CardHeader className="pb-2 pt-4 relative z-10">
              <CardTitle className="text-xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#8b5cf6] drop-shadow-md flex items-center gap-2">
                📖 Grimorio Místico
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {Object.values(MAGIC_SPELLS).map(spell => {
                const target = spell.target === 'ENEMY' ? targetId : CHARACTER_ID;
                const isAttack = spell.type === 'DAMAGE' || spell.type === 'EFFECT';
                const borderColor = isAttack ? 'border-red-800' : 'border-purple-800';
                const textColor = isAttack ? 'text-red-400' : 'text-purple-300';
                const hoverBg = isAttack ? 'hover:bg-red-950' : 'hover:bg-purple-950';
                const icon = isAttack ? '🔥' : '🛡️';
                const extraText = spell.target === 'ENEMY' ? ' - Usa Objetivo' : '';
                return (
                  <Button 
                    key={spell.id}
                    onClick={() => useAbility(CHARACTER_ID, target, spell.id)} 
                    variant="outline" 
                    className={`w-full justify-start ${borderColor} ${textColor} ${hoverBg} transition-all active:scale-95 duration-100`}
                  >
                    {icon} {spell.name} ({spell.cost} Zeon){extraText}
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {character.maxKi > 0 && (
          <Card className="panel-arcano">
            <CardHeader className="pb-2 pt-4 relative z-10">
              <CardTitle className="text-xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 drop-shadow-md flex items-center gap-2">
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
                    className={`w-full justify-start ${borderColor} ${textColor} ${hoverBg} transition-all active:scale-95 duration-100`}
                  >
                    {icon} {tech.name} ({tech.cost} Ki){extraText}
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card className="panel-arcano">
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-2xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-anima-gold to-yellow-500 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-wider">
              Calculadora de Daño
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 mt-4 relative z-10">
            <div className="flex flex-col gap-2">
              <label className="text-anima-gold font-serif text-sm tracking-wider">Objetivo:</label>
              <select 
                value={targetId} 
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-[#1a1714] border border-[#4a3b2c] shadow-inner text-gray-200 rounded p-3 text-lg focus:border-anima-gold focus:ring-1 focus:ring-anima-gold outline-none transition-colors"
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-scales.png')" }}
              >
                {Object.values(characters).map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.id.startsWith('npc_') ? '(Enemigo)' : ''}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-grow">
                <Input 
                  ref={inputRef}
                  type="number" 
                  placeholder="Cantidad..." 
                  className="w-full text-lg py-6 bg-[#1a1714] border-[#4a3b2c] shadow-inner text-gray-200 focus:border-anima-gold focus:ring-1 focus:ring-anima-gold" 
                  style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-scales.png')" }}
                  value={damageAmount}
                  onChange={(e) => setDamageAmount(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-400 font-semibold mb-1">Tipo de Daño:</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value as DamageType)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="FIL">Filo [FIL]</option>
                <option value="CON">Contundente [CON]</option>
                <option value="PEN">Penetración [PEN]</option>
                <option value="CAL">Calor [CAL]</option>
                <option value="ELE">Electricidad [ELE]</option>
                <option value="FRI">Frío [FRI]</option>
                <option value="ENE">Energía [ENE]</option>
              </select>
            </div>

            <Button onClick={handleApplyDamage} className="w-full mt-2 text-xl py-6 btn-piedra-runica bg-gradient-to-r from-red-900 to-red-700 text-white border-red-500 shadow-glow-blood hover:bg-red-800 transition-all active:scale-95 duration-100">
              ⚔️ APLICAR DAÑO ⚔️
            </Button>
          </CardContent>
        </Card>

        {/* Lanzador de Dados */}
        <DiceRoller characterId={CHARACTER_ID} />
      </div>

      <div className="col-span-6 h-full z-10">
        <Card className="h-full border-gray-800 flex flex-col bg-[#0a0b0e] relative overflow-hidden shadow-inner-gold">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>
          <Tabs defaultValue="inventory" className="w-full h-full flex flex-col relative z-10">
            <CardHeader className="pb-0 pt-4 border-b border-gray-800/50 bg-[#0a0b0e]/80">
              <TabsList className="w-full grid grid-cols-3 bg-transparent gap-2">
                <TabsTrigger value="inventory" className="btn-piedra-runica data-[state=active]:border-anima-gold data-[state=active]:text-anima-goldglow data-[state=active]:shadow-glow-gold">Mi Inventario</TabsTrigger>
                <TabsTrigger value="shop" className="btn-piedra-runica data-[state=active]:border-anima-gold data-[state=active]:text-anima-goldglow data-[state=active]:shadow-glow-gold">Tienda</TabsTrigger>
                <TabsTrigger value="ki" className="btn-piedra-runica data-[state=active]:border-anima-ki data-[state=active]:text-cyan-300 data-[state=active]:shadow-glow-ki">Dominios Ki</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex-grow p-0 pt-4">
              <TabsContent value="inventory" className="h-full m-0 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Equipamiento</h3>
                  <span className="text-yellow-500 font-bold flex items-center gap-2">
                    💰 {gold} Oro
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead>Ítem</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {character.inventory && Object.values(character.inventory).length > 0 ? (
                      Object.values(character.inventory).map((item: any) => (
                        <TableRow key={item.id} className="border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <TableCell className="font-medium text-gray-200">
                            {item.name} {item.equipped && <span className="text-xs text-green-500 ml-2">(Equipado)</span>}
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">{item.type}</TableCell>
                          <TableCell className="text-gray-300">{item.quantity}</TableCell>
                          <TableCell className="text-right space-x-2">
                            {item.type === 'ARMADURA' && (
                              item.equipped ? (
                                <Button size="sm" variant="outline" onClick={() => unequipItem(CHARACTER_ID, item.id)} className="bg-red-900 hover:bg-red-800 border-red-700 text-white transition-all active:scale-95 duration-100">Desequipar</Button>
                              ) : (
                                <Button size="sm" variant="secondary" onClick={() => equipItem(CHARACTER_ID, item.id)} className="bg-green-900 hover:bg-green-800 text-white transition-all active:scale-95 duration-100">Equipar</Button>
                              )
                            )}
                            {item.type === 'CONSUMIBLE' && (
                              <Button size="sm" variant="secondary" onClick={() => useItem(CHARACTER_ID, item.id)} className="bg-blue-900 hover:bg-blue-800 text-white transition-all active:scale-95 duration-100">Usar</Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-4">Inventario vacío.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="shop" className="h-full m-0 p-6 relative">
                {/* Estrellas de fondo para la tienda completa */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none mix-blend-screen"></div>
                
                <div className="flex justify-between items-center mb-6 relative z-10 border-b border-[#4a3b2c] pb-2">
                  <h3 className="text-2xl font-serif font-bold text-anima-gold tracking-widest drop-shadow-md">Mercader Local</h3>
                  <span className="text-anima-gold font-bold flex items-center gap-2 bg-[#1a1714] px-4 py-1 rounded-full border border-[#4a3b2c] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                    <img src="/assets/icons/gen_gold.png" alt="Oro" className="w-6 h-6 object-contain drop-shadow-md" /> {gold} Oro
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-8 relative z-10">
                  {[
                    { id: 'item-potion-minor', name: 'Poción de Vida Menor', cost: 10, type: 'CONSUMIBLE', icon: '/assets/icons/gen_potion_minor.png', mods: null },
                    { id: 'item-potion-major', name: 'Poción de Vida Mayor', cost: 30, type: 'CONSUMIBLE', icon: '/assets/icons/gen_potion_major.png', mods: null },
                    { id: 'item-antidote', name: 'Antídoto', cost: 15, type: 'CONSUMIBLE', icon: '/assets/icons/gen_antidote.png', mods: null },
                    { id: 'item-leather-armor', name: 'Coraza de Cuero', cost: 90, type: 'ARMADURA', icon: '/assets/icons/gen_leather_armor.png', mods: { FIL: 2, CON: 1, PEN: 1 } },
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
                                  type: shopItem.type as any, 
                                  equipped: false,
                                  modifiers: shopItem.mods 
                                }, shopItem.cost)}
                                disabled={gold < shopItem.cost}
                                className="h-8 btn-piedra-runica bg-gradient-to-b from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 border-2 border-anima-gold text-anima-gold text-xs font-bold rounded shadow-[0_2px_5px_rgba(0,0,0,0.8)] disabled:opacity-50 disabled:border-gray-600 disabled:text-gray-500"
                              >
                                Comprar ({shopItem.cost} <img src="/assets/icons/gen_gold.png" alt="Oro" className="w-3 h-3 object-contain inline-block ml-0.5" />)
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="ki" className="h-full m-0 p-0">
                <KiTree characterId={CHARACTER_ID} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Panel Derecho: Alertas */}
      <div className="col-span-3 flex flex-col gap-4 z-10">
        <Card className="panel-arcano">
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-anima-gold to-yellow-500 drop-shadow-md flex items-center gap-2">
              ⚠️ Recordatorios y Alertas
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
            
            <div>
              <h4 className="font-semibold text-gray-400 text-sm mb-2">Registro de Efectos</h4>
              {character.activeEffects && character.activeEffects.length > 0 ? (
                character.activeEffects.map((effect: any) => (
                  <div key={effect.id} className="text-sm p-3 bg-gray-900/80 rounded border border-red-900/50 text-gray-300 shadow-inner mb-2">
                    <span className="text-red-400 font-bold mr-2">{effect.name}</span>
                    Dañará {effect.value} HP ({effect.durationRounds} asaltos restantes)
                  </div>
                ))
              ) : (
                <div className="text-sm p-3 bg-gray-900/80 rounded border border-gray-800 text-gray-500 shadow-inner italic">
                  No tienes efectos negativos activos.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MODAL DE CRÍTICO RECIBIDO */}
      {criticalHitEvent && criticalHitEvent.defenderId === myCharacterId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border-2 border-red-900 rounded-lg p-6 max-w-md w-full shadow-[0_0_50px_rgba(255,0,0,0.4)] transform scale-100 animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-cinzel font-bold text-red-500 mb-4 text-center">¡IMPACTO CRÍTICO RECIBIDO!</h2>
            
            <div className="space-y-4">
              <div className="bg-red-950/50 p-4 rounded text-center border border-red-900/50">
                <div className="text-sm text-gray-400 mb-1">Nivel de Crítico</div>
                <div className="text-4xl font-bold text-red-400">{criticalHitEvent.level}</div>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded text-center border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Localización (1d100)</div>
                <div className="text-2xl font-bold text-gray-200">{criticalHitEvent.location}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {criticalHitEvent.location >= 10 && criticalHitEvent.location <= 19 ? 'Cabeza' :
                   criticalHitEvent.location >= 20 && criticalHitEvent.location <= 29 ? 'Pecho/Corazón' :
                   criticalHitEvent.location >= 30 && criticalHitEvent.location <= 39 ? 'Estómago' :
                   criticalHitEvent.location >= 40 && criticalHitEvent.location <= 49 ? 'Costado/Abdomen' :
                   criticalHitEvent.location >= 50 && criticalHitEvent.location <= 69 ? 'Brazo' :
                   'Pierna'}
                </div>
              </div>
              
              {criticalHitEvent.instantKill && (
                <div className="p-3 bg-red-900 text-white font-bold text-center rounded border border-red-500 animate-pulse">
                  ¡GOLPE FATAL! ¡AMPUTACIÓN EN PUNTO VITAL! (MUERTE INSTANTÁNEA)
                </div>
              )}
              
              {!criticalHitEvent.instantKill && (
                <div className="p-3 bg-orange-950/50 text-orange-400 text-sm text-center rounded border border-orange-900/50">
                  Estás sufriendo desangramiento. Perderás 1 PV por cada asalto.
                </div>
              )}
              
              <Button 
                variant="destructive" 
                className="w-full mt-4"
                onClick={clearCriticalHit}
              >
                Aceptar Destino
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ARMA ROTA */}
      {weaponShatteredEvent && weaponShatteredEvent.characterId === myCharacterId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border-2 border-orange-700 rounded-lg p-6 max-w-sm w-full shadow-[0_0_40px_rgba(255,165,0,0.3)] transform scale-100 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-cinzel font-bold text-orange-500 mb-4 text-center">¡ARMA DESTROZADA!</h2>
            
            <div className="space-y-4">
              <div className="bg-orange-950/50 p-4 rounded text-center border border-orange-900/50">
                <div className="text-sm text-gray-400 mb-1">Tu arma ha sido destruida en el impacto:</div>
                <div className="text-xl font-bold text-orange-400">"{weaponShatteredEvent.weaponName}"</div>
              </div>
              
              <div className="p-3 bg-gray-800 text-gray-300 text-sm text-center rounded border border-gray-700">
                El arma ha sido desequipada automáticamente y ya no proporcionará bonificadores.
              </div>
              
              <Button 
                className="w-full mt-4 bg-orange-700 hover:bg-orange-600 text-white font-bold"
                onClick={clearWeaponShattered}
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
