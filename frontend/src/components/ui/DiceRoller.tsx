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
    <div className="panel-arcano flex flex-col gap-4 max-h-[500px] mt-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
      <h3 className="text-xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-wider text-center flex items-center justify-center gap-2 relative z-10">
        <span className="text-2xl drop-shadow-md">🎲</span> Lanzador D100
      </h3>
      
      <div className="flex gap-2 relative z-10">
        <Input 
          placeholder="Motivo (ej: Ataque, Esquiva)..." 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRoll()}
          className="bg-[#1a1714] border-[#4a3b2c] shadow-inner text-gray-200 text-sm flex-grow focus:border-anima-gold focus:ring-1 focus:ring-anima-gold"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-scales.png')" }}
        />
        <Button onClick={handleRoll} className="btn-piedra-runica bg-gradient-to-b from-red-900 to-red-800 hover:bg-red-700 font-bold whitespace-nowrap shadow-[0_0_10px_rgba(185,28,28,0.5)] border-red-900 text-white">
          Tirar
        </Button>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent relative z-10">
        {diceRolls.map((roll, i) => (
          <div key={roll.timestamp + i} className={`p-2 rounded border text-sm transition-all shadow-inner ${roll.isFumble ? 'bg-red-950/80 border-red-800 shadow-[inset_0_0_15px_rgba(220,38,38,0.3)]' : roll.isOpen ? 'bg-amber-950/80 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-[#120f1a]/80 border-[#2a253a]'}`} style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-scales.png')" }}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-cyan-400 text-xs tracking-wider">{roll.characterName}</span>
              <span className="text-[10px] text-gray-500 font-serif">{new Date(roll.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-xs truncate max-w-[120px] font-serif" title={roll.description}>{roll.description}</span>
              <div className="flex items-center gap-2">
                {roll.isFumble && <span className="text-red-500 font-black text-xs uppercase animate-pulse">¡Pifia!</span>}
                {roll.isOpen && <span className="text-amber-400 font-black text-xs uppercase animate-pulse">¡Abierta!</span>}
                <span className={`text-2xl font-black font-serif drop-shadow-md ${roll.isFumble ? 'text-red-500' : roll.isOpen ? 'text-amber-400' : 'text-gray-200'}`}>
                  {roll.result}
                </span>
              </div>
            </div>
          </div>
        ))}
        {diceRolls.length === 0 && (
          <p className="text-center text-gray-500 text-xs italic mt-8 font-serif">Las moiras hilan en silencio...</p>
        )}
      </div>
    </div>
  );
}
