import { useState } from 'react';
import { useCombatStore } from '../../store/combatStore';
import { Button } from './button';
import { Input } from './input';

export function DiceRoller({ characterId }: { characterId?: string }) {
  const { rollDice, diceRolls } = useCombatStore();
  const [description, setDescription] = useState("");

  const handleRoll = () => {
    rollDice(characterId || 'gm', description || "Tirada general");
    setDescription("");
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex flex-col gap-4 max-h-[500px]">
      <h3 className="text-amber-400 font-bold text-lg flex items-center gap-2">
        <span className="text-2xl">🎲</span> Lanzador D100
      </h3>
      
      <div className="flex gap-2">
        <Input 
          placeholder="Motivo (ej: Ataque, Esquiva)..." 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRoll()}
          className="bg-slate-800 border-slate-600 text-slate-200 text-sm flex-grow"
        />
        <Button onClick={handleRoll} className="bg-red-700 hover:bg-red-600 font-bold whitespace-nowrap shadow-[0_0_10px_rgba(185,28,28,0.5)]">
          Tirar
        </Button>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {diceRolls.map((roll, i) => (
          <div key={roll.timestamp + i} className={`p-2 rounded border text-sm transition-all ${roll.isFumble ? 'bg-red-950/50 border-red-800 shadow-[inset_0_0_15px_rgba(220,38,38,0.2)]' : roll.isOpen ? 'bg-amber-950/50 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-800 border-slate-700'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-cyan-400 text-xs">{roll.characterName}</span>
              <span className="text-[10px] text-slate-500">{new Date(roll.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-xs truncate max-w-[120px]" title={roll.description}>{roll.description}</span>
              <div className="flex items-center gap-2">
                {roll.isFumble && <span className="text-red-500 font-black text-xs uppercase animate-pulse">¡Pifia!</span>}
                {roll.isOpen && <span className="text-amber-400 font-black text-xs uppercase animate-pulse">¡Abierta!</span>}
                <span className={`text-2xl font-black ${roll.isFumble ? 'text-red-500' : roll.isOpen ? 'text-amber-400' : 'text-white'}`}>
                  {roll.result}
                </span>
              </div>
            </div>
          </div>
        ))}
        {diceRolls.length === 0 && (
          <p className="text-center text-slate-500 text-xs italic mt-8">No hay tiradas recientes en la mesa.</p>
        )}
      </div>
    </div>
  );
}
