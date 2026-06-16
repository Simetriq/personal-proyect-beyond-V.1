import React from 'react';
import { useCombatStore } from '../store/combatStore';
import { socket } from '../store/combatStore'; // Assuming socket is exported or we can just get it from the store if it's there. Actually, the user says `import { socket } from '../services/socket';` but the project uses `useCombatStore.getState().socket` or `socket` emitted. Wait, let me adjust it to just use `useCombatStore().socket` or export it. In this app, socket is inside the store.

interface TurnOrderTrackerProps {
  roomId: string;
  isGM: boolean;
}

export const TurnOrderTracker: React.FC<TurnOrderTrackerProps> = ({ roomId, isGM }) => {
  const turnTracker = useCombatStore((state) => state.turnTracker);
  const socket = useCombatStore((state) => state.socket);

  if (!turnTracker || !turnTracker.isActive || turnTracker.order.length === 0) {
    return (
      <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-4 text-center font-mono text-xs text-slate-500 italic mb-4">
        ⚡ Sistema de Iniciativa en reposo. Esperando declaración de hostilidades...
      </div>
    );
  }

  const { currentRound, currentTurnIndex, order } = turnTracker;

  const handleNextTurn = () => {
    if (socket) {
      socket.emit('combat:next_turn', { roomId });
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-2xl font-mono mb-4 animate-fade-in">
      {/* Encabezado e info global de la ronda */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
            ⏳ Cronología de Asalto
          </span>
          <span className="bg-cyan-950 border border-cyan-500/30 text-cyan-400 text-[11px] px-2 py-0.5 rounded-full font-bold">
            Ronda {currentRound}
          </span>
        </div>
        
        {isGM && (
          <button
            onClick={handleNextTurn}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-[11px] font-bold px-3 py-1 rounded transition-all duration-200 shadow-[0_0_10px_rgba(217,119,6,0.2)] active:scale-95"
          >
            Avanzar Turno ▶
          </button>
        )}
      </div>

      {/* Grid Horizontal Deslizable de Combatientes */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
        {order.map((combatant, index) => {
          const isActive = index === currentTurnIndex;
          const isTargetNPC = combatant.isNPC;
          
          return (
            <div
              key={combatant.combatantId}
              className={`flex-shrink-0 w-44 p-2 rounded border transition-all duration-300 ${
                isActive
                  ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)] scale-105 ring-1 ring-cyan-400'
                  : combatant.hasActed
                  ? 'bg-slate-950/40 border-slate-900 opacity-40 text-slate-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              {/* Posición de iniciativa e indicador de turno activo */}
              <div className="flex justify-between items-center text-[9px] mb-1">
                <span className={`font-bold ${isActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`}>
                  {isActive ? '● ACTIVO' : `#${index + 1}`}
                </span>
                <span className={`font-bold px-1 rounded ${isTargetNPC ? 'bg-purple-950 text-purple-400' : 'bg-emerald-950 text-emerald-400'}`}>
                  INI {combatant.initiativeTotal}
                </span>
              </div>

              {/* Nombre del Personaje */}
              <div className={`text-xs truncate font-bold ${isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                {combatant.name}
              </div>

              {/* Tags de Estado: Acumulaciones de Anima */}
              <div className="mt-1 min-h-[14px]">
                {combatant.accumulatingTurns > 0 ? (
                  <span className="inline-flex items-center text-[8px] font-bold text-amber-400 bg-amber-950/50 border border-amber-500/20 px-1 rounded animate-pulse">
                    ⏳ Zeon/Ki: {combatant.accumulatingTurns}T
                  </span>
                ) : combatant.hasActed ? (
                  <span className="text-[8px] text-slate-600 uppercase tracking-wider">
                    Acción Ejecutada
                  </span>
                ) : (
                  <span className="text-[8px] text-cyan-500/60 uppercase tracking-wider">
                    Pendiente
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
