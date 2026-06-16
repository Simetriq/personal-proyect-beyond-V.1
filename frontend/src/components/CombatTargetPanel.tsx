import React, { useState } from 'react';

export interface Combatant {
  id: string;
  name: string;
  isNPC: boolean;
  currentHp: number;
  maxHp: number;
}

interface CombatTargetPanelProps {
  combatants: Combatant[];
  currentUserId: string;
  onDeclareAttack: (targetId: string, attackRoll: number) => void;
}

export const CombatTargetPanel: React.FC<CombatTargetPanelProps> = ({
  combatants,
  currentUserId,
  onDeclareAttack
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [attackRoll, setAttackRoll] = useState<number | ''>('');
  const [modifier, setModifier] = useState<number>(0);

  // Filtramos para no auto-atacarnos
  const validTargets = combatants.filter(c => c.id !== currentUserId);

  const handleLaunchAttack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId || attackRoll === '') return;

    const totalAttack = Number(attackRoll) + modifier;
    onDeclareAttack(selectedTargetId, totalAttack);
    
    // Limpiamos los inputs tras disparar el evento
    setAttackRoll('');
    setSelectedTargetId(null);
  };

  return (
    <div className="w-80 bg-slate-950 border-l border-slate-800 h-full font-mono flex flex-col text-slate-200">
      {/* Cabecera del Radar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <h3 className="text-xs font-bold tracking-widest text-cyan-400 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          Radar de Objetivos
        </h3>
        <span className="text-[10px] text-slate-500">{validTargets.length} en rango</span>
      </div>

      {/* Lista de Combatientes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {validTargets.map((target) => {
          const isSelected = selectedTargetId === target.id;
          const hpPercentage = (target.currentHp / target.maxHp) * 100;

          return (
            <button
              key={target.id}
              onClick={() => setSelectedTargetId(isSelected ? null : target.id)}
              className={`w-full text-left p-3 rounded border transition flex flex-col gap-1.5 ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/80 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-bold truncate max-w-[140px]">{target.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold border ${
                  target.isNPC 
                    ? 'bg-purple-950/40 text-purple-400 border-purple-500/30' 
                    : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                }`}>
                  {target.isNPC ? 'NPC' : 'PC'}
                </span>
              </div>

              {/* Barra de Vida Compacta */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-300 ${
                    hpPercentage > 50 ? 'bg-emerald-500' : hpPercentage > 20 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>PV: {target.currentHp}/{target.maxHp}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Formulario de Lanzamiento de Ataque (Anclado abajo) */}
      {selectedTargetId && (
        <form 
          onSubmit={handleLaunchAttack} 
          className="p-4 border-t border-slate-800 bg-slate-900/40 space-y-3 animate-slide-up"
        >
          <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] text-slate-400">
            Objetivo fijado: <strong className="text-cyan-400 font-bold">{combatants.find(c => c.id === selectedTargetId)?.name}</strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Tirada (1d100)</label>
              <input
                type="number"
                required
                min="1"
                value={attackRoll}
                onChange={(e) => setAttackRoll(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Dados"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 font-bold outline-none focus:border-red-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 font-bold uppercase">Habilidad + Mod</label>
              <input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(Number(e.target.value))}
                placeholder="+0"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-red-950 border border-red-500 hover:bg-red-900 text-red-200 font-bold text-xs rounded uppercase tracking-wider transition shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse"
          >
            💥 Declarar Ataque
          </button>
        </form>
      )}
    </div>
  );
};
