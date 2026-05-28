import { useState } from "react";
import { Swords } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useCombatStore } from "../store/combatStore";
import type { DamageType } from "../store/combatStore";

export function CombatCalculator() {
  const { characters, resolveAttack } = useCombatStore();
  const [attackerId, setAttackerId] = useState<string>("");
  const [defenderId, setDefenderId] = useState<string>("");
  const [attackRoll, setAttackRoll] = useState<number>(0);
  const [defenseRoll, setDefenseRoll] = useState<number>(0);
  const [baseDamage, setBaseDamage] = useState<number>(50);
  const [damageType, setDamageType] = useState<DamageType>("FIL");
  const [defenseType, setDefenseType] = useState<'BLOCK' | 'DODGE'>('DODGE');
  
  // Modifiers
  const [isAreaAttack, setIsAreaAttack] = useState(false);
  const [isDisarm, setIsDisarm] = useState(false);
  const [aimedLocation, setAimedLocation] = useState<string>("");
  const [coverage, setCoverage] = useState<string>("");
  const [burnedFatigueAttack, setBurnedFatigueAttack] = useState<number>(0);
  const [burnedFatigueDefense, setBurnedFatigueDefense] = useState<number>(0);

  const charList = Object.values(characters);

  const handleResolve = () => {
    if (!attackerId || !defenderId) return;
    const modifiers = {
      isAreaAttack,
      isDisarm,
      ...(aimedLocation && { aimedLocation }),
      ...(coverage && { coverage }),
      ...(burnedFatigueAttack > 0 && { burnedFatigueAttack }),
      ...(burnedFatigueDefense > 0 && { burnedFatigueDefense })
    };
    resolveAttack(attackerId, defenderId, attackRoll, defenseRoll, baseDamage, damageType, defenseType, modifiers);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-10 px-4 btn-piedra-runica bg-gradient-to-b from-red-950 to-[#161411] hover:from-red-900 hover:to-[#161411] border border-red-900 text-red-200 uppercase tracking-widest text-xs shadow-[0_2px_5px_rgba(0,0,0,0.8)] flex items-center gap-2 relative z-10">
          <Swords className="w-4 h-4 text-red-400" /> Calculadora de Combate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-gray-950 border-red-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-red-500">Resolución de Ataque</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Atacante</label>
              <select 
                className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded mt-1"
                value={attackerId} 
                onChange={(e) => setAttackerId(e.target.value)}
              >
                <option value="">Selecciona Atacante</option>
                {charList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Defensor</label>
              <select 
                className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded mt-1"
                value={defenderId} 
                onChange={(e) => setDefenderId(e.target.value)}
              >
                <option value="">Selecciona Defensor</option>
                {charList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Tirada de Ataque</label>
              <Input type="number" value={attackRoll} onChange={(e) => setAttackRoll(parseInt(e.target.value) || 0)} className="bg-gray-900 border-gray-700 text-white mt-1" />
            </div>
            <div>
              <label className="text-sm text-gray-400 flex justify-between">
                Tirada de Defensa
                <select 
                  className="bg-transparent border-none text-xs text-anima-gold font-bold focus:outline-none"
                  value={defenseType}
                  onChange={(e) => setDefenseType(e.target.value as 'BLOCK' | 'DODGE')}
                >
                  <option value="DODGE" className="bg-gray-900">ESQUIVA</option>
                  <option value="BLOCK" className="bg-gray-900">PARADA</option>
                </select>
              </label>
              <Input type="number" value={defenseRoll} onChange={(e) => setDefenseRoll(parseInt(e.target.value) || 0)} className="bg-gray-900 border-gray-700 text-white mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Daño Base</label>
              <Input type="number" value={baseDamage} onChange={(e) => setBaseDamage(parseInt(e.target.value) || 0)} className="bg-gray-900 border-gray-700 text-white mt-1" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Tipo de Daño</label>
              <select 
                className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded mt-1"
                value={damageType} 
                onChange={(e) => setDamageType(e.target.value as DamageType)}
              >
                <option value="FIL">Filo (FIL)</option>
                <option value="CON">Contundente (CON)</option>
                <option value="PEN">Penetrante (PEN)</option>
                <option value="CAL">Calor (CAL)</option>
                <option value="FRI">Frío (FRI)</option>
                <option value="ELE">Eléctrico (ELE)</option>
                <option value="ENE">Energía (ENE)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Maniobras Ofensivas</label>
              <div className="flex flex-col gap-2 mt-2">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={isAreaAttack} onChange={(e) => setIsAreaAttack(e.target.checked)} className="bg-gray-900 border-gray-700" />
                  Ataque en Área (-50 HA)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={isDisarm} onChange={(e) => setIsDisarm(e.target.checked)} className="bg-gray-900 border-gray-700" />
                  Desarmar (-40 HA)
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-sm text-gray-400">Ataque Apuntado</label>
                <select className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded mt-1 text-xs" value={aimedLocation} onChange={(e) => setAimedLocation(e.target.value)}>
                  <option value="">Ninguno</option>
                  <option value="CABEZA">Cabeza (-60)</option>
                  <option value="OJOS">Ojos (-100)</option>
                  <option value="CORAZON">Corazón (-60)</option>
                  <option value="ABDOMEN">Abdomen (-20)</option>
                  <option value="BRAZO">Brazo (-20)</option>
                  <option value="MUSLO">Muslo (-20)</option>
                  <option value="PANTORRILLA">Pantorrilla (-10)</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Cobertura del Defensor</label>
                <select className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded mt-1 text-xs" value={coverage} onChange={(e) => setCoverage(e.target.value)}>
                  <option value="">Sin Cobertura</option>
                  <option value="PARTIAL">Parcial (-40)</option>
                  <option value="MILITARY">Militar (-80)</option>
                  <option value="TOTAL">Total (-120)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2 border-t border-[#3a2b1c] pt-2">
            <div>
              <label className="text-sm text-gray-400">Quemar Cansancio (Ataque)</label>
              <select className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded mt-1 text-xs" value={burnedFatigueAttack} onChange={(e) => setBurnedFatigueAttack(Number(e.target.value))}>
                <option value={0}>No quemar (0)</option>
                <option value={1}>Quemar 1 Punto (+15 HA)</option>
                <option value={2}>Quemar 2 Puntos (+30 HA)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Quemar Cansancio (Defensa)</label>
              <select className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded mt-1 text-xs" value={burnedFatigueDefense} onChange={(e) => setBurnedFatigueDefense(Number(e.target.value))}>
                <option value={0}>No quemar (0)</option>
                <option value={1}>Quemar 1 Punto (+15 HD)</option>
                <option value={2}>Quemar 2 Puntos (+30 HD)</option>
              </select>
            </div>
          </div>

        </div>
        <div className="flex justify-end pt-2">
          <DialogTrigger asChild>
            <Button onClick={handleResolve} disabled={!attackerId || !defenderId} className="bg-red-700 hover:bg-red-600 text-white font-bold w-full transition-all active:scale-95 duration-100">
              Resolver Impacto
            </Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
}
