import React, { useState } from 'react';
import { useCombatStore } from '../store/combatStore';
import type { MagicData, PersistentSpell } from '../types/combat';

interface MagicConsoleProps {
  roomId: string;
  characterId: string;
  magicData?: MagicData;
  persistentSpells: PersistentSpell[];
}

export const MagicConsole: React.FC<MagicConsoleProps> = ({
  roomId,
  characterId,
  magicData,
  persistentSpells,
}) => {
  const { toggleMagicAccumulation, castPersistentSpell } = useCombatStore();
  const [spellName, setSpellName] = useState('');
  const [maintenanceCost, setMaintenanceCost] = useState(0);

  // Si el personaje no tiene magicData inicializado, mostramos placeholder o lo iniciamos al 0
  const mData = magicData || {
    currentZeon: 0,
    maxZeon: 0,
    accumulatedZeon: 0,
    magicAccumulation: 0,
    isAccumulating: false,
  };

  const toggleAccumulation = () => {
    toggleMagicAccumulation(roomId, characterId);
  };

  const handleCastSpell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spellName.trim() || mData.accumulatedZeon <= 0) return;

    castPersistentSpell(roomId, characterId, spellName, mData.accumulatedZeon, maintenanceCost);

    setSpellName('');
    setMaintenanceCost(0);
  };

  const activeRoomSpells = persistentSpells || [];

  return (
    <div className="bg-slate-950 border border-cyan-900/40 rounded-lg p-4 font-mono space-y-4">
      <div className="flex justify-between items-center border-b border-cyan-950 pb-2">
        <span className="text-xs font-bold text-cyan-400 tracking-wider">🔮 MATRIZ DE ZEON & CONJUROS</span>
        <span className="text-[10px] text-cyan-600">ACT NATIVA: +{mData.magicAccumulation}/turno</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-900 p-2 border border-slate-850 rounded">
          <div className="text-[9px] text-slate-500 uppercase">Reserva Total</div>
          <div className="text-sm font-bold text-cyan-300">{mData.currentZeon} / {mData.maxZeon}</div>
        </div>
        <div className="bg-slate-900 p-2 border border-slate-850 rounded animate-pulse">
          <div className="text-[9px] text-purple-400 uppercase font-bold">Pozo Acumulado</div>
          <div className="text-sm font-bold text-purple-400">{mData.accumulatedZeon} Zn</div>
        </div>
        <div className="flex items-center justify-center">
          <button
            onClick={toggleAccumulation}
            className={`w-full h-full text-xs font-bold uppercase py-2 px-1 rounded border transition-all ${
              mData.isAccumulating
                ? 'bg-purple-950 text-purple-400 border-purple-500 animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-cyan-700 hover:text-cyan-400'
            }`}
          >
            {mData.isAccumulating ? '🛑 Detener ACT' : '⚡ Acumular Zeon'}
          </button>
        </div>
      </div>

      {mData.accumulatedZeon > 0 && (
        <form onSubmit={handleCastSpell} className="bg-slate-900/60 p-3 border border-purple-900/30 rounded space-y-2">
          <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Manifestar Matriz de Hechizo</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nombre del Conjuro (ej: Escudo Sacro)"
              value={spellName}
              onChange={(e) => setSpellName(e.target.value)}
              className="bg-slate-950 text-xs border border-slate-800 text-cyan-300 rounded p-1.5 outline-none focus:border-purple-600"
            />
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded px-1.5">
              <span className="text-[9px] text-slate-500 uppercase mr-1">Mant/Turno:</span>
              <input
                type="number"
                value={maintenanceCost}
                onChange={(e) => setMaintenanceCost(Math.max(0, parseInt(e.target.value) || 0))}
                className="bg-transparent text-xs text-cyan-300 outline-none w-full font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-900 hover:bg-purple-700 text-purple-100 text-[10px] uppercase font-bold py-1.5 rounded transition-colors tracking-widest"
          >
            💥 Lanzar Hechizo con {mData.accumulatedZeon} Zeon
          </button>
        </form>
      )}

      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Hechizos Activos en la Sala</div>
        {activeRoomSpells.length === 0 ? (
          <div className="text-[10px] text-slate-600 italic p-2 bg-slate-900/30 border border-slate-900 rounded text-center">
            No hay matrices mágicas alterando el entorno.
          </div>
        ) : (
          <div className="space-y-1">
            {activeRoomSpells.map((spell) => (
              <div key={spell.id} className="bg-slate-900 border border-cyan-950 p-2 rounded flex justify-between items-center text-xs">
                <div>
                  <span className="text-cyan-400 font-bold">✨ {spell.name}</span>
                  <span className="text-[9px] text-slate-500 ml-2">Mantenimiento: {spell.zeonMaintenance} Zn/t</span>
                </div>
                <span className="text-[9px] bg-cyan-950/40 text-cyan-400 border border-cyan-900/50 px-1 rounded font-bold uppercase tracking-tighter">
                  Activo
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
