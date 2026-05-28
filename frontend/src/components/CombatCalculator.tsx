import { useState } from "react";
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

  const charList = Object.values(characters);

  const handleResolve = () => {
    if (!attackerId || !defenderId) return;
    resolveAttack(attackerId, defenderId, attackRoll, defenseRoll, baseDamage, damageType, defenseType);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-950 hover:text-red-400 transition-all active:scale-95 duration-100">
          ⚔️ Calculadora de Combate
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
