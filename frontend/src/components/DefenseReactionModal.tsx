import React, { useState } from 'react';

interface DefenseModalProps {
  attackerName: string;
  attackRoll: number;
  combatInstanceId: string;
  onDefenseSubmit: (type: 'BLOCK' | 'DODGE', roll: number) => void;
}

export const DefenseReactionModal: React.FC<DefenseModalProps> = ({
  attackerName,
  attackRoll,
  combatInstanceId,
  onDefenseSubmit
}) => {
  const [defenseType, setDefenseType] = useState<'BLOCK' | 'DODGE'>('DODGE');
  const [diceRoll, setDiceRoll] = useState<number | ''>('');
  const [modifier, setModifier] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (diceRoll === '') return;

    const totalDefense = Number(diceRoll) + modifier;
    onDefenseSubmit(defenseType, totalDefense);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 font-mono p-4">
      <div className="bg-slate-900 border-2 border-red-500 rounded-lg w-full max-w-md shadow-[0_0_25px_rgba(239,68,68,0.25)] animate-fade-in">
        
        {/* Cabecera de Alerta de Combate */}
        <div className="bg-red-950/40 p-4 border-b border-red-500/30 flex justify-between items-center">
          <h3 className="text-red-400 font-bold tracking-wider uppercase text-sm animate-pulse">
            ⚠️ ¡ALERTA DE ATAQUE ENTRANTE!
          </h3>
          <span className="text-[10px] bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-500/40">
            ID: {combatInstanceId.slice(0, 6)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Datos del Atacante */}
          <div className="bg-slate-950 p-4 rounded border border-slate-800 text-center">
            <p className="text-xs text-slate-400">Estás siendo atacado por</p>
            <p className="text-base font-bold text-slate-200 mt-1">{attackerName}</p>
            <div className="mt-3 inline-block bg-red-950 px-4 py-1.5 rounded border border-red-500/20">
              <span className="text-xs text-slate-400">Poder del Ataque:</span>
              <strong className="text-red-400 ml-2 text-lg">{attackRoll}</strong>
            </div>
          </div>

          {/* Selector de Tipo de Defensa */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tipo de Reacción</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDefenseType('DODGE')}
                className={`py-2 text-xs font-bold rounded border transition ${
                  defenseType === 'DODGE'
                    ? 'bg-cyan-950 text-cyan-400 border-cyan-500/60 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                    : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-400'
                }`}
              >
                💨 Esquivar
              </button>
              <button
                type="button"
                onClick={() => setDefenseType('BLOCK')}
                className={`py-2 text-xs font-bold rounded border transition ${
                  defenseType === 'BLOCK'
                    ? 'bg-cyan-950 text-cyan-400 border-cyan-500/60 shadow-[0_0_10px_rgba(34,211,238,0.15)]'
                    : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-400'
                }`}
              >
                🛡️ Parar
              </button>
            </div>
          </div>

          {/* Campos de Dados y Modificadores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tirada (1d100)</label>
              <input
                type="number"
                required
                min="1"
                max="150"
                value={diceRoll}
                onChange={(e) => setDiceRoll(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Resultado"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500/50 font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Habilidad + Mod.</label>
              <input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(Number(e.target.value))}
                placeholder="+0"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Botón de Envío Crítico */}
          <button
            type="submit"
            className="w-full py-2.5 mt-2 bg-red-950 border border-red-500/40 hover:bg-red-900/40 text-red-400 font-bold text-xs rounded uppercase tracking-widest transition shadow-[0_0_15px_rgba(239,68,68,0.05)]"
          >
            Transmitir Defensa 📡
          </button>
        </form>
      </div>
    </div>
  );
};
