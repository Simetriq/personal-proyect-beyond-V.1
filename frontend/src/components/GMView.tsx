import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { useCombatStore } from "../store/combatStore";

function GMCharacterRow({ char, gmUpdateCharacter }: { char: any, gmUpdateCharacter: any }) {
  const [hp, setHp] = useState(char.hp);
  const [gold, setGold] = useState(char.gold);
  
  // Sincronizar estado local si el backend manda actualización externa
  useEffect(() => {
    setHp(char.hp);
    setGold(char.gold);
  }, [char.hp, char.gold]);

  const handleSave = () => {
    gmUpdateCharacter(char.id, { 
      hp: parseInt(hp, 10), 
      gold: parseInt(gold, 10) 
    });
  };

  const isUnconscious = char.state === 'INCONSCIENTE';
  const hpPercentage = Math.max(0, Math.min(100, (char.hp / char.maxHp) * 100));

  return (
    <TableRow 
      className={`transition-colors ${isUnconscious ? 'bg-red-950/40 border-red-900 hover:bg-red-900/40' : 'border-gray-800/50 hover:bg-gray-800/30'}`}
    >
      <TableCell className="font-bold text-lg text-gray-200">
        {char.name} {isUnconscious && <span className="text-red-500 text-xs ml-2 uppercase animate-pulse">(Inconsciente)</span>}
      </TableCell>
      <TableCell>
        <div className="flex justify-between text-xs mb-1">
          <span className={`font-bold ${isUnconscious ? 'text-red-500' : 'text-red-400'}`}>{char.hp} / {char.maxHp}</span>
        </div>
        <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-gray-800">
          <div className={`h-2 rounded-full transition-all duration-500 ${isUnconscious ? 'bg-red-600' : 'bg-red-500'}`} style={{ width: `${hpPercentage}%` }}></div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-blue-400 text-xs font-semibold">Ki: 0</div>
        <div className="text-purple-400 text-xs font-semibold mt-1">Zeon: 0</div>
      </TableCell>
      <TableCell className="text-yellow-500 font-semibold">{char.gold}</TableCell>
      <TableCell>
        {isUnconscious && (
          <span className="bg-red-950/60 text-red-300 text-xs px-2 py-1 rounded border border-red-900/50 shadow-sm">Caído</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-gray-700 bg-gray-900 hover:bg-gray-800 text-gray-300">Editar</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-950 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Editar a {char.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-gray-400">HP Actual</label>
                <Input type="number" value={hp} onChange={(e) => setHp(e.target.value)} className="col-span-3 border-gray-700 bg-gray-900 text-white" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-gray-400">Oro</label>
                <Input type="number" value={gold} onChange={(e) => setGold(e.target.value)} className="col-span-3 border-gray-700 bg-gray-900 text-white" />
              </div>
            </div>
            <div className="flex justify-end">
              <DialogTrigger asChild>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">Guardar Cambios</Button>
              </DialogTrigger>
            </div>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}

export function GMView() {
  const { characters, connectToCampaign, gmUpdateCharacter } = useCombatStore();
  const CAMPAIGN_ID = "camp-1";

  useEffect(() => {
    connectToCampaign(CAMPAIGN_ID);
  }, [connectToCampaign]);

  const charList = Object.values(characters);

  return (
    <div className="flex flex-col h-full p-4 gap-4 text-white">
      {/* Header */}
      <div className="flex justify-between items-center bg-card/80 p-5 rounded-lg border border-gray-800 shadow-md backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Consola de Director de Juego</h1>
          <p className="text-gray-400 text-sm mt-1">Campaña: La Sombra del Omega</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] font-bold transition-all hover:scale-105">
          Siguiente Asalto ⏩
        </Button>
      </div>

      {/* Grid de Jugadores */}
      <Card className="flex-grow border-gray-800 bg-card/50">
        <CardHeader>
          <CardTitle>Jugadores Conectados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead>Personaje</TableHead>
                <TableHead className="w-[200px]">Vida (HP)</TableHead>
                <TableHead>Ki / Zeon</TableHead>
                <TableHead>Oro</TableHead>
                <TableHead>Efectos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 italic">
                    Esperando a que los jugadores se conecten...
                  </TableCell>
                </TableRow>
              ) : (
                charList.map(char => (
                  <GMCharacterRow key={char.id} char={char} gmUpdateCharacter={gmUpdateCharacter} />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
