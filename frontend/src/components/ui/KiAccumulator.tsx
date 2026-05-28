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
    <div className="bg-transparent p-0 rounded-lg border-none shadow-none mt-2">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="text-anima-gold font-serif text-lg tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">Acumulación de Ki</h3>
        <span className="bg-[#0a0b0e] text-cyan-400 px-3 py-1 rounded text-xs border border-cyan-800 shadow-[inset_0_0_10px_rgba(0,229,255,0.2)]">
          Ki Total: {character.ki}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(accumulations).map(([stat, val]) => (
          <div key={stat} className="flex flex-col gap-1 items-center bg-[#1a1714] p-2 rounded-md border-t border-l border-[#4a3b2c] border-b-2 border-r-2 border-black shadow-[inset_0_0_15px_rgba(0,0,0,0.8),0_5px_10px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30 pointer-events-none"></div>
            <span className="text-sm font-serif text-gray-400 uppercase tracking-widest relative z-10 group-hover:text-anima-goldglow transition-colors">{stat}</span>
            <div className="flex items-center gap-1 relative z-10 w-full px-2 justify-between bg-black/40 border border-[#3a2b1c] rounded py-0.5">
              <button 
                onClick={() => setAccumulations({...accumulations, [stat]: Math.max(0, val - 1)})}
                className="text-[#8b7355] hover:text-anima-goldglow text-lg leading-none font-bold outline-none cursor-pointer select-none"
              >
                -
              </button>
              <input 
                type="number" 
                value={val} 
                onChange={(e) => setAccumulations({...accumulations, [stat]: parseInt(e.target.value) || 0})}
                className="w-8 text-center bg-transparent text-anima-goldglow text-lg font-bold outline-none" 
              />
              <button 
                onClick={() => setAccumulations({...accumulations, [stat]: val + 1})}
                className="text-[#8b7355] hover:text-anima-goldglow text-lg leading-none font-bold outline-none cursor-pointer select-none"
              >
                +
              </button>
            </div>
            <Button 
              onClick={() => handleAccumulate(stat as keyof typeof accumulations)}
              size="sm"
              variant="outline"
              className="mt-2 w-full btn-piedra-runica !text-gray-300 hover:!text-anima-goldglow bg-gradient-to-b from-gray-800 to-gray-950 text-[10px] h-6 px-1 relative z-10 border-none"
            >
              Acumular
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
