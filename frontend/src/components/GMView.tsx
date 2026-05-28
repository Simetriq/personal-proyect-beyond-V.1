import { useEffect, useState } from "react";
import { Skull, Droplet, FlaskConical, Zap, ArrowRight, FastForward } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { v4 as uuidv4 } from "uuid";
import { useCombatStore } from "../store/combatStore";
import { CombatCalculator } from "./CombatCalculator";
import { DiceRoller } from "./ui/DiceRoller";

function GMCharacterRow({ char, combatStateData, gmUpdateCharacter, applyEffect, isActiveTurn, removeNpc }: { char: any, combatStateData: any, gmUpdateCharacter: any, applyEffect: any, isActiveTurn: boolean, removeNpc: any }) {
  const [hp, setHp] = useState(char.hp);
  const [gold, setGold] = useState(char.gold);
  const [isBleeding, setIsBleeding] = useState(false);
  
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

  const handleApplyEffect = (type: 'SANGRADO' | 'VENENO' | 'PENALIZADOR') => {
    let name = "Corte Profundo";
    let value = 5;
    let durationRounds = 3;

    if (type === 'VENENO') {
      name = "Veneno de Basilisco";
      value = 15;
      durationRounds = 2;
    } else if (type === 'PENALIZADOR') {
      name = "Aturdido / Shock";
      value = -20;
      durationRounds = 1;
    }

    setIsBleeding(true);
    applyEffect(char.id, {
      id: uuidv4(),
      name,
      type,
      value,
      durationRounds
    });
    setTimeout(() => setIsBleeding(false), 500);
  };

  const isUnconscious = char.state === 'INCONSCIENTE';
  const hpPercentage = Math.max(0, Math.min(100, (char.hp / char.maxHp) * 100));

  return (
    <TableRow 
      className={`transition-colors ${isUnconscious ? 'bg-red-950/40 border-red-900 hover:bg-red-900/40' : isActiveTurn ? 'bg-anima-gold/10 border-anima-gold shadow-glass-gold' : 'border-gray-800/50 hover:bg-white/5'}`}
    >
      <TableCell className="font-bold text-lg text-gray-200 font-serif">
        {char.name} {isUnconscious && <span className="text-red-500 text-xs ml-2 uppercase animate-pulse font-sans">(Inconsciente)</span>}
        {combatStateData?.isDefensive && <span className="text-blue-300 bg-[#081a2a] px-2 py-0.5 ml-2 text-[10px] uppercase tracking-wider rounded border border-blue-800 font-serif shadow-inner">A la Defensiva</span>}
        {combatStateData?.hasActed && <span className="text-[#8b7355] bg-[#161411] px-2 py-0.5 ml-2 text-[10px] uppercase tracking-wider rounded border border-[#3a2b1c] font-serif shadow-inner">Actuó</span>}
        {combatStateData?.isSurprised && <span className="text-purple-300 bg-[#1a082a] px-2 py-0.5 ml-2 text-[10px] uppercase tracking-wider rounded border border-purple-800 font-serif shadow-inner">Sorprendido</span>}
        <div className="flex flex-col gap-1 mt-1">
          {char.activeEffects && char.activeEffects.map((eff: any) => (
            <span key={eff.id} className="text-xs text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/50 animate-in fade-in duration-300 zoom-in-95">
              {eff.name} ({eff.value} dmg, {eff.durationRounds} as.)
            </span>
          ))}
        </div>
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
          <div className="text-cyan-400 text-[10px] uppercase tracking-wider font-bold mt-1 bg-[#081a2a] inline-block px-1.5 py-0.5 rounded border border-cyan-800">Escudo: {char.temporaryShield}</div>
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
          <Button onClick={() => removeNpc(char.id)} size="sm" className="w-8 h-8 p-0 btn-piedra-runica bg-gradient-to-b from-red-950 to-[#161411] border border-red-900 hover:from-red-900 hover:to-[#161411] transition-all active:scale-95 duration-100 relative z-10" title="Matar / Remover">
            <Skull className="w-4 h-4 text-red-200" />
          </Button>
        )}
        
        <div className="flex gap-1 mr-2">
          <Button 
            disabled={isBleeding} 
            onClick={() => handleApplyEffect('SANGRADO')}
            size="sm" className="w-8 h-8 p-0 btn-piedra-runica bg-gradient-to-b from-red-950 to-[#161411] border border-red-900 hover:from-red-900 hover:to-[#161411] transition-all active:scale-95 text-red-500 relative z-10"
            title="Aplicar Sangrado"
          >
            <Droplet className="w-4 h-4" />
          </Button>
          <Button 
            disabled={isBleeding} 
            onClick={() => handleApplyEffect('VENENO')}
            size="sm" className="w-8 h-8 p-0 btn-piedra-runica bg-gradient-to-b from-green-950 to-[#161411] border border-green-900 hover:from-green-900 hover:to-[#161411] transition-all active:scale-95 text-green-500 relative z-10"
            title="Aplicar Veneno"
          >
            <FlaskConical className="w-4 h-4" />
          </Button>
          <Button 
            disabled={isBleeding} 
            onClick={() => handleApplyEffect('PENALIZADOR')}
            size="sm" className="w-8 h-8 p-0 btn-piedra-runica bg-gradient-to-b from-yellow-950 to-[#161411] border border-yellow-700 hover:from-yellow-900 hover:to-[#161411] transition-all active:scale-95 text-yellow-500 relative z-10"
            title="Aplicar Penalizador (Shock)"
          >
            <Zap className="w-4 h-4" />
          </Button>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 px-3 btn-piedra-runica bg-gradient-to-b from-[#2a2215] to-[#161411] border border-[#5c4a35] text-[#c5a059] hover:from-[#3a2b1c] hover:to-[#161411] transition-all active:scale-95 duration-100 font-serif uppercase text-[10px] tracking-widest shadow-md relative z-10">Editar</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#161411] border-[2px] border-[#3a2b1c] text-white shadow-[inset_0_0_20px_rgba(0,0,0,1)] font-serif" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-wood.png')" }}>
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
              <div className="flex gap-2 justify-end">
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-gray-700 hover:bg-gray-800 text-white transition-all active:scale-95 duration-100">Cancelar</Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white transition-all active:scale-95 duration-100">Guardar Cambios</Button>
                </DialogTrigger>
              </div>
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
        <Button className="h-10 px-4 btn-piedra-runica bg-gradient-to-b from-red-950 to-[#161411] hover:from-red-900 hover:to-[#161411] border border-red-900 text-red-200 uppercase tracking-widest text-xs shadow-[0_2px_5px_rgba(0,0,0,0.8)] flex items-center gap-2 relative z-10">
          <Skull className="w-4 h-4 text-red-400" />
          Añadir Enemigo
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
            <Button onClick={handleSpawn} className="bg-red-700 hover:bg-red-600 text-white font-bold w-full transition-all active:scale-95 duration-100">¡Invocar!</Button>
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
      <div className="flex justify-between items-center bg-anima-panel/80 p-5 rounded-lg border border-anima-gold/30 shadow-glass-gold backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-serif font-bold text-anima-gold tracking-wide flex items-center gap-3 drop-shadow-md">
            Consola del GM 
            <span className="bg-black/50 text-anima-goldglow px-3 py-1 rounded-md text-sm border border-anima-gold/50 shadow-glow-gold font-sans">
              Asalto {combatState.round}
            </span>
          </h1>
          <p className="text-gray-400 text-sm mt-1 font-serif">Campaña: La Sombra del Omega</p>
        </div>
        <div className="flex gap-3 flex-wrap relative z-10">
          <CombatCalculator />
          <AddEnemyModal spawnNpc={spawnNpc} campaignId={CAMPAIGN_ID} />
          <Button onClick={requestInitiatives} className="h-10 px-4 btn-piedra-runica bg-gradient-to-b from-[#2a2215] to-[#161411] border border-[#5c4a35] text-[#c5a059] hover:from-[#3a2b1c] hover:to-[#161411] text-xs font-serif uppercase tracking-widest shadow-[0_2px_5px_rgba(0,0,0,0.8)] relative z-10">
            {combatState.isRequestingInitiative ? 'Esperando Tiradas...' : 'Pedir Iniciativas'}
          </Button>
          <Button onClick={nextTurn} className="h-10 px-4 flex items-center gap-2 btn-piedra-runica bg-gradient-to-b from-green-950 to-[#161411] hover:from-green-900 hover:to-[#161411] border border-green-900 text-green-200 uppercase tracking-widest text-xs shadow-[0_2px_5px_rgba(0,0,0,0.8)] relative z-10">
            Siguiente Turno <ArrowRight className="w-4 h-4 text-green-400" />
          </Button>
          <Button onClick={nextRoundTick} className="h-10 px-4 flex items-center gap-2 btn-piedra-runica bg-gradient-to-b from-blue-950 to-[#161411] hover:from-blue-900 hover:to-[#161411] border border-blue-900 text-blue-200 shadow-[0_0_15px_rgba(37,99,235,0.3)] font-bold uppercase tracking-widest text-xs transition-all active:scale-95 duration-100 hover:scale-105 relative z-10">
            Siguiente Asalto <FastForward className="w-4 h-4 text-blue-400" />
          </Button>
        </div>
      </div>

      {/* Grid de Jugadores */}
      <Card className="flex-grow bg-[#0a0806] border-[2px] border-[#3a2b1c] rounded shadow-[0_5px_15px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30 pointer-events-none"></div>
        <CardHeader className="border-b border-[#3a2b1c] bg-[#161411] relative z-10 pb-3">
          <CardTitle className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#c5a059] to-[#fcd97b] tracking-wider drop-shadow-md uppercase">Jugadores Conectados</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-0 pt-2">
          <Table>
            <TableHeader>
              <TableRow className="border-[#3a2b1c] hover:bg-transparent text-[#8b7355] font-serif uppercase tracking-widest text-xs">
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
                    combatStateData={combatState.characterStates?.[char.id]}
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

      <div className="mt-4 w-full md:w-1/2">
        <DiceRoller />
      </div>
    </div>
  );
}
