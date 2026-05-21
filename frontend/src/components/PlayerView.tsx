import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useCombatStore, DamageType } from "../store/combatStore";

export function PlayerView() {
  const { characters, applyDamage, connectToCampaign } = useCombatStore();
  const [damageAmount, setDamageAmount] = useState("");
  const [selectedType, setSelectedType] = useState<DamageType>("FIL");
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyDamage();
    }
  };

  // Fallbacks if character not loaded yet
  const hp = character ? character.hp : 150;
  const maxHp = character ? character.maxHp : 150;
  const gold = character ? character.gold : 150;
  const isUnconscious = character?.state === 'INCONSCIENTE';

  const hpPercentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div className="grid grid-cols-12 gap-4 h-full p-4 text-white relative">
      
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
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-gray-300">Ki</span>
                <span className="text-blue-400 font-bold">45</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-gray-300">Zeon</span>
                <span className="text-purple-400 font-bold">200</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-purple-500 h-3 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
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

            <Button onClick={handleApplyDamage} className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg">
              Aplicar Daño
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Panel Central: Inventario y Tienda */}
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
                      <TableHead>Cantidad</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <TableCell className="font-medium text-gray-200">Poción de Curación Menor</TableCell>
                      <TableCell className="text-gray-300">3</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="secondary" className="bg-gray-800 hover:bg-gray-700">Consumir</Button>
                      </TableCell>
                    </TableRow>
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
              <h4 className="font-semibold text-gray-400 text-sm mb-2">Efectos Activos</h4>
              <div className="text-sm p-3 bg-gray-900/80 rounded border border-gray-800 text-gray-300 shadow-inner">
                <span className="text-blue-400 font-bold mr-2">Celeridad</span>
                +20 Iniciativa (2 asaltos restantes)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
