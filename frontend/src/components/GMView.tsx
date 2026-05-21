import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { v4 as uuidv4 } from "uuid";
import { useCombatStore } from "../store/combatStore";

function GMCharacterRow({ char, gmUpdateCharacter, applyEffect, isActiveTurn, removeNpc }: { char: any, gmUpdateCharacter: any, applyEffect: any, isActiveTurn: boolean, removeNpc: any }) {
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

  const handleAddBleed = () => {
    const effect = {
      id: uuidv4(),
      name: "Corte Profundo",
      type: "SANGRADO",
      value: 5,
      durationRounds: 3
    };
    applyEffect(char.id, effect);
  };

  const isUnconscious = char.state === 'INCONSCIENTE';
  const hpPercentage = Math.max(0, Math.min(100, (char.hp / char.maxHp) * 100));

  return (
    <TableRow 
      className={`transition-colors ${isUnconscious ? 'bg-red-950/40 border-red-900 hover:bg-red-900/40' : isActiveTurn ? 'bg-yellow-900/20 border-yellow-500 shadow-[inset_0_0_15px_rgba(234,179,8,0.2)]' : 'border-gray-800/50 hover:bg-gray-800/30'}`}
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
        <div className="text-blue-400 text-xs font-semibold">Ki: {char.ki || 0}</div>
        <div className="text-purple-400 text-xs font-semibold mt-1">Zeon: {char.zeon || 0}</div>
        {char.temporaryShield > 0 && (
          <div className="text-cyan-400 text-xs font-bold mt-1">🛡️ Escudo: {char.temporaryShield}</div>
        )}
      </TableCell>
      <TableCell className="text-yellow-500 font-semibold">{char.gold}</TableCell>
      <TableCell>
        <div className="text-white text-lg font-bold">
          {char.currentInitiative !== null ? char.currentInitiative : '-'}
        </div>
      </TableCell>
      <TableCell className="text-right flex justify-end gap-2">
        {char.id.startsWith('npc_') && (
          <Button onClick={() => removeNpc(char.id)} variant="destructive" size="sm" className="bg-red-700 hover:bg-red-600 text-white shadow-sm" title="Matar / Remover">
            🗑️
          </Button>
        )}
        <Button onClick={handleAddBleed} variant="outline" size="sm" className="border-red-900 bg-red-950 hover:bg-red-900 text-red-300 mr-2">Sangrar</Button>
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

function AddEnemyModal({ spawnNpc, campaignId }: { spawnNpc: any, campaignId: string }) {
  const [name, setName] = useState("Orco");
  const [maxHp, setMaxHp] = useState("100");
  const [ta, setTa] = useState({ FIL: "0", CON: "0", PEN: "0", CAL: "0", ELE: "0", FRI: "0", ENE: "0" });

  const handleSpawn = () => {
    spawnNpc({
      campaignId,
      name,
      maxHp: parseInt(maxHp, 10),
      resistances: {
        FIL: parseInt(ta.FIL, 10),
        CON: parseInt(ta.CON, 10),
        PEN: parseInt(ta.PEN, 10),
        CAL: parseInt(ta.CAL, 10),
        ELE: parseInt(ta.ELE, 10),
        FRI: parseInt(ta.FRI, 10),
        ENE: parseInt(ta.ENE, 10)
      }
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-950 hover:text-red-400">
          💀 Añadir Enemigo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-gray-950 border-red-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-red-500">Invocar Enemigo (Memoria)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-gray-400 text-sm">Nombre</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="col-span-3 border-gray-700 bg-gray-900 text-white" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-gray-400 text-sm">HP Máximo</label>
            <Input type="number" value={maxHp} onChange={(e) => setMaxHp(e.target.value)} className="col-span-3 border-gray-700 bg-gray-900 text-white" />
          </div>
          <div className="mt-2 pt-4 border-t border-gray-800">
            <h4 className="text-sm text-gray-400 mb-3 font-semibold text-center">TAs Base (Armadura)</h4>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(ta).map((key) => (
                <div key={key} className="flex flex-col gap-1 items-center">
                  <label className="text-[10px] text-gray-500">{key}</label>
                  <Input type="number" value={(ta as any)[key]} onChange={(e) => setTa({...ta, [key]: e.target.value})} className="h-8 text-center text-xs border-gray-700 bg-gray-900 text-white" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <DialogTrigger asChild>
            <Button onClick={handleSpawn} className="bg-red-700 hover:bg-red-600 text-white font-bold w-full">¡Invocar!</Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GMView() {
  const { characters, connectToCampaign, gmUpdateCharacter, applyEffect, nextRoundTick, combatState, requestInitiatives, nextTurn, spawnNpc, removeNpc } = useCombatStore();
  const CAMPAIGN_ID = "camp-1";

  useEffect(() => {
    connectToCampaign(CAMPAIGN_ID);
  }, [connectToCampaign]);

  // Sort characters based on initiative queue
  const charList = Object.values(characters).sort((a, b) => {
    const idxA = combatState.initiativeQueue.findIndex(q => q.characterId === a.id);
    const idxB = combatState.initiativeQueue.findIndex(q => q.characterId === b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });

  const activeCharId = combatState.initiativeQueue[combatState.turnIndex]?.characterId;

  return (
    <div className="flex flex-col h-full p-4 gap-4 text-white">
      {/* Header de Combate */}
      <div className="flex justify-between items-center bg-card/80 p-5 rounded-lg border border-gray-800 shadow-md backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
            Consola del GM 
            <span className="bg-gray-800 text-yellow-400 px-3 py-1 rounded-md text-sm border border-gray-700">
              Asalto {combatState.round}
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Campaña: La Sombra del Omega</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <AddEnemyModal spawnNpc={spawnNpc} campaignId={CAMPAIGN_ID} />
          <Button onClick={requestInitiatives} variant="outline" className="border-yellow-600 text-yellow-500 hover:bg-yellow-950 hover:text-yellow-400">
            {combatState.isRequestingInitiative ? 'Esperando Tiradas...' : 'Pedir Iniciativas'}
          </Button>
          <Button onClick={nextTurn} className="bg-green-700 hover:bg-green-600 text-white">
            Siguiente Turno ➡️
          </Button>
          <Button onClick={nextRoundTick} className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] font-bold transition-all hover:scale-105">
            Siguiente Asalto ⏩
          </Button>
        </div>
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
                <TableHead>Iniciativa</TableHead>
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
                  <GMCharacterRow 
                    key={char.id} 
                    char={char} 
                    gmUpdateCharacter={gmUpdateCharacter} 
                    applyEffect={applyEffect} 
                    isActiveTurn={char.id === activeCharId} 
                    removeNpc={removeNpc}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
