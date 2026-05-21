import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useCombatStore, type DamageType } from "../store/combatStore";
import { CreateCharacterForm } from "./CreateCharacterForm";

export function PlayerView() {
  const { characters, applyDamage, connectToCampaign, equipItem, unequipItem, useItem, useAbility, combatState, submitInitiative } = useCombatStore();
  const [damageAmount, setDamageAmount] = useState("");
  const [selectedType, setSelectedType] = useState<DamageType>("FIL");
  const [initiativeInput, setInitiativeInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use a hardcoded campaign and character for demonstration
  const CAMPAIGN_ID = "camp-1";
  const CHARACTER_ID = "char-1";

  useEffect(() => {
    connectToCampaign(CAMPAIGN_ID);
  }, [connectToCampaign]);

  const character = characters[CHARACTER_ID];

  const handleApplyDamage = () => {
    const parsedAmount = parseInt(damageAmount, 10);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      applyDamage(CHARACTER_ID, parsedAmount, selectedType);
      setDamageAmount(""); // Limpiar
      inputRef.current?.select(); // Auto-seleccionar para el siguiente
    }
  };

  const handleSubmitInitiative = () => {
    const val = parseInt(initiativeInput, 10);
    if (!isNaN(val)) {
      submitInitiative(CHARACTER_ID, val);
      setInitiativeInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyDamage();
    }
  };

  if (!character) {
    return <CreateCharacterForm campaignId={CAMPAIGN_ID} characterId={CHARACTER_ID} />;
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
      
      {/* Overlay INCONSCIENTE */}
      {isUnconscious && (
        <div className="absolute inset-0 bg-red-700/20 z-50 pointer-events-none rounded-xl animate-pulse transition-all"></div>
      )}

      {/* Panel Izquierdo: Estado Vital */}
      <div className="col-span-3 flex flex-col gap-4">
        <Card className={`bg-card/50 ${isUnconscious ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-red-500">
              {isUnconscious ? "¡INCONSCIENTE!" : "Estado Vital"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-gray-300">HP (Vida)</span>
                <span className="text-red-400 font-bold">{hp} / {maxHp}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-red-500 h-3 rounded-full transition-all duration-500" style={{ width: `${hpPercentage}%` }}></div>
              </div>
              
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
            </div>
            <div>
              <div className="flex justify-between mb-1 items-center">
                <span className="font-semibold text-gray-300">Ki</span>
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={() => useAbility(CHARACTER_ID, 'KI', 10)} className="h-6 text-xs bg-blue-900 hover:bg-blue-800 text-blue-100 border border-blue-700">Gastar 10 Ki</Button>
                  <span className="text-blue-400 font-bold">{character.ki || 0}</span>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 items-center">
                <span className="font-semibold text-gray-300">Zeon</span>
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={() => useAbility(CHARACTER_ID, 'ZEON', 30)} className="h-6 text-xs bg-purple-900 hover:bg-purple-800 text-purple-100 border border-purple-700">Lanzar Escudo (30)</Button>
                  <span className="text-purple-400 font-bold">{character.zeon || 0}</span>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-purple-500 h-3 rounded-full transition-all" style={{ width: '100%' }}></div>
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
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Calculadora de Daño</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input 
              ref={inputRef}
              type="number" 
              placeholder="Daño Recibido..." 
              className="text-lg py-6 bg-gray-900 border-gray-700" 
              value={damageAmount}
              onChange={(e) => setDamageAmount(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            
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

            <Button onClick={handleApplyDamage} className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg transition-all active:scale-95 duration-100">
              Aplicar Daño
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-6 h-full z-10">
        <Card className="h-full border-gray-800 flex flex-col bg-card/50">
          <Tabs defaultValue="inventory" className="w-full h-full flex flex-col">
            <CardHeader className="pb-0 pt-4 border-b border-gray-800">
              <TabsList className="w-full grid grid-cols-2 bg-gray-900/80">
                <TabsTrigger value="inventory" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Mi Inventario</TabsTrigger>
                <TabsTrigger value="shop" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">Tienda del Mercader</TabsTrigger>
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
              <TabsContent value="shop" className="h-full m-0 p-4">
                <div className="flex justify-center items-center h-40 text-gray-500 italic">
                  El mercader está preparando sus mercancías...
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Panel Derecho: Alertas */}
      <div className="col-span-3 flex flex-col gap-4 z-10">
        <Card className="border-yellow-500/30 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-500 flex items-center gap-2">
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

    </div>
  );
}
