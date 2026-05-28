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
    <div className="p-3 bg-[#161411] border-[2px] border-[#3a2b1c] rounded shadow-[inset_0_0_10px_rgba(0,0,0,1)] flex flex-col gap-3 max-h-[400px] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
      <div className="flex items-center gap-2 border-b border-[#3a2b1c] pb-2 relative z-10">
        <span className="text-xl drop-shadow-md">🎲</span>
        <h3 className="font-bold text-gray-300 text-xs uppercase tracking-widest font-serif drop-shadow-md">
          Lanzador D100
        </h3>
      </div>
      
      <div className="flex gap-2 relative z-10">
        <Input 
          placeholder="Motivo (ej: Ataque, Esquiva)..." 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRoll()}
          className="bg-[#0a0806] border border-[#3a2b1c] shadow-inner text-gray-200 text-sm flex-grow focus:border-anima-gold font-serif"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-scales.png')" }}
        />
        <Button onClick={handleRoll} className="h-10 px-4 btn-piedra-runica bg-gradient-to-b from-red-950 to-red-900 hover:from-red-900 hover:to-red-800 border border-red-900 text-red-200 uppercase tracking-widest text-xs shadow-[0_2px_5px_rgba(0,0,0,0.8)]">
          Tirar
        </Button>
      </div>

      <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-[#4a3b2c] scrollbar-track-transparent relative z-10">
        {diceRolls.map((roll, i) => (
          <div key={roll.timestamp + i} className={`p-2 rounded border-[2px] text-sm transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] ${roll.isFumble ? 'bg-red-950/80 border-red-900 text-red-200' : roll.isOpen ? 'bg-amber-950/80 border-amber-600 text-amber-200' : 'bg-[#1a1714] border-[#3a2b1c] text-gray-300'}`} style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-scales.png')" }}>
            <div className="flex justify-between items-center mb-1 border-b border-opacity-30 border-current pb-1">
              <span className="font-bold font-serif text-xs tracking-wider uppercase">{roll.characterName}</span>
              <span className="text-[10px] opacity-70 font-serif">{new Date(roll.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs truncate max-w-[120px] font-serif italic" title={roll.description}>{roll.description || "Tirada del destino..."}</span>
              <div className="flex items-center gap-2">
                {roll.isFumble && <span className="font-black text-[10px] uppercase animate-pulse">¡Pifia!</span>}
                {roll.isOpen && <span className="font-black text-[10px] uppercase animate-pulse">¡Abierta!</span>}
                <span className={`text-2xl font-black font-serif drop-shadow-md`}>
                  {roll.result}
                </span>
              </div>
            </div>
          </div>
        ))}
        {diceRolls.length === 0 && (
          <p className="text-center text-[#5c4a35] text-xs italic mt-8 font-serif">Las moiras hilan en silencio...</p>
        )}
      </div>
    </div>
  );
}
