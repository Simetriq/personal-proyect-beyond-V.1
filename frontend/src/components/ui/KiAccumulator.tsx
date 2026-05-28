import { useState } from 'react';
import { useCombatStore } from '../../store/combatStore';
import { Button } from '../ui/button';

export function KiAccumulator({ characterId }: { characterId: string }) {
  const { characters, gmUpdateCharacter } = useCombatStore();
  const character = characters[characterId];

  // Acumulaciones base por stat (por defecto 1, idealmente vendría del backend según stats del personaje)
  const [accumulations, setAccumulations] = useState({
    AGI: 1, CON: 1, DES: 1, FUE: 1, VOL: 1, PER: 1
  });

  const handleAccumulate = (stat: keyof typeof accumulations) => {
    if (!character) return;
    const newKi = (character.ki || 0) + accumulations[stat];
    gmUpdateCharacter(characterId, { ki: newKi });
  };

  if (!character) return null;

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-amber-400 font-bold">Acumulación de Ki</h3>
        <span className="bg-cyan-900/50 text-cyan-400 px-2 py-0.5 rounded text-xs border border-cyan-800">
          Ki Total: {character.ki}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(accumulations).map(([stat, val]) => (
          <div key={stat} className="flex flex-col gap-1 items-center bg-slate-900 p-2 rounded border border-slate-700">
            <span className="text-[10px] text-slate-400">{stat}</span>
            <div className="flex items-center gap-1">
              <input 
                type="number" 
                value={val} 
                onChange={(e) => setAccumulations({...accumulations, [stat]: parseInt(e.target.value) || 0})}
                className="w-10 text-center bg-transparent border-b border-slate-600 text-slate-200 text-sm outline-none" 
              />
            </div>
            <Button 
              onClick={() => handleAccumulate(stat as keyof typeof accumulations)}
              size="sm"
              className="mt-1 w-full bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] h-6 px-1"
            >
              Acumular
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
