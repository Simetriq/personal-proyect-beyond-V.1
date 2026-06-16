import React, { useEffect, useState } from 'react';
import { useCombatStore } from '../store/combatStore';

export const GameMasterDashboard: React.FC<{ socket: any }> = ({ socket }) => {
  const { progressionDrafts, setupGMSocketListeners, approveLevelUp, rejectLevelUp } = useCombatStore();
  const [commandInput, setCommandInput] = useState('');

  // Inicializar la escucha de sockets del GM al montar el componente
  // Note: Since Zustand state and actions can't easily access setupGMSocketListeners if not implemented there, 
  // actually wait, the user's guide added setupGMSocketListeners to combatStore, but I didn't add it in my previous edit!
  // I must add it to the combatStore or implement it here.
  // Wait, I implemented the listeners in connectToCampaign in combatStore!
  // Ah, I put socket.on('gm:update_player_draft') in connectToCampaign. So I don't need setupGMSocketListeners here.

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    
    // Procesamiento básico de comandos rápidos en consola
    const [command, targetId, amount] = commandInput.split(' ');
    if (command === '/give_dp' && targetId && amount) {
      socket.emit('gm:command_give_dp', { playerId: targetId, amount: parseInt(amount, 10) });
    }
    
    setCommandInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 font-mono">
      {/* Cabecera de la Pizarra */}
      <div className="border-b border-cyan-500/30 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-cyan-400">MONITOREO DE PROGRESIÓN EN TIEMPO REAL</h2>
          <p className="text-xs text-slate-400 mt-1">Consola del Director de Juego — Monitoreando transacciones de PD</p>
        </div>
        <div className="px-3 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-xs text-cyan-400 animate-pulse">
          Sincronizado 🟢
        </div>
      </div>

      {/* Cuadrícula de Tarjetas de Jugadores */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2">
        {Object.keys(progressionDrafts).length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg p-12 text-slate-500">
            <span className="text-3xl mb-2">👁️</span>
            <p className="text-sm">No hay jugadores distribuyendo puntos de experiencia en este momento.</p>
          </div>
        ) : (
          Object.values(progressionDrafts).map((draft: any) => {
            const hasChanges = draft.totalSpentDP > 0;
            
            return (
              <div 
                key={draft.playerId}
                className={`flex flex-col h-fit rounded-lg border bg-slate-900 transition-all duration-300 ${
                  draft.isOverLimit 
                    ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-950/10' 
                    : hasChanges 
                      ? 'border-cyan-500/50 bg-slate-900/80' 
                      : 'border-slate-800'
                }`}
              >
                {/* Encabezado de la Tarjeta */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-start bg-slate-950/50 rounded-t-lg">
                  <div>
                    <h3 className="font-bold text-slate-200">{draft.playerName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{draft.clase}</p>
                  </div>
                  <div>
                    {draft.isOverLimit ? (
                      <span className="text-xs font-bold text-red-400 px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40">
                        LÍMITE VIOLADO 🚨
                      </span>
                    ) : hasChanges ? (
                      <span className="text-xs text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 flex items-center gap-1">
                        Modificando ✏️
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Inactivo</span>
                    )}
                  </div>
                </div>

                {/* Desglose de Gastos */}
                <div className="p-4 flex-1 space-y-4 text-xs">
                  {/* Sección Física */}
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold tracking-wide uppercase text-[10px]">Desarrollo Físico</span>
                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                      <div><span className="text-slate-500">ATQ:</span> <strong className="text-slate-300">+{draft.spentPhysical.ataque}</strong></div>
                      <div><span className="text-slate-500">ESQ:</span> <strong className="text-slate-300">+{draft.spentPhysical.esquiva}</strong></div>
                      <div><span className="text-slate-500">PAR:</span> <strong className="text-slate-300">+{draft.spentPhysical.parada}</strong></div>
                    </div>
                  </div>

                  {/* Sección Mágica */}
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold tracking-wide uppercase text-[10px]">Vías Mágicas</span>
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                      <div><span className="text-slate-500">FUEGO:</span> <strong className="text-orange-400">+{draft.spentMagic.vias.FUEGO}</strong></div>
                      <div><span className="text-slate-500">AGUA:</span> <strong className="text-blue-400">+{draft.spentMagic.vias.AGUA}</strong></div>
                    </div>
                  </div>

                  {/* Totalizador */}
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Inversión Estimada:</span>
                    <span className={`font-bold ${draft.isOverLimit ? 'text-red-400' : 'text-cyan-400'}`}>
                      {draft.totalSpentDP} PD
                    </span>
                  </div>
                </div>

                {/* Botonera de Decisiones */}
                <div className="p-3 bg-slate-950/40 border-t border-slate-800 flex gap-2 rounded-b-lg">
                  <button 
                    disabled={draft.isOverLimit || !hasChanges}
                    onClick={() => approveLevelUp(draft.playerId)}
                    className="flex-1 py-1.5 bg-cyan-950 border border-cyan-500/40 hover:bg-cyan-900 active:bg-cyan-950 text-cyan-400 rounded text-xs font-bold transition disabled:opacity-30 disabled:hover:bg-cyan-950"
                  >
                    APROBAR Cambios
                  </button>
                  <button 
                    disabled={!hasChanges}
                    onClick={() => rejectLevelUp(draft.playerId)}
                    className="px-3 py-1.5 bg-slate-900 border border-red-900/60 hover:bg-red-950/30 text-red-400 hover:text-red-300 rounded text-xs transition disabled:opacity-30"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Consola de Comandos Rápidos al pie */}
      <form onSubmit={handleCommandSubmit} className="mt-6 pt-4 border-t border-slate-900">
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded border border-slate-800 focus-within:border-cyan-500/50 transition">
          <span className="text-cyan-500 text-sm font-bold">&gt;_</span>
          <input 
            type="text" 
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Consola GM (Ej: /give_dp id_jugador 50)" 
            className="flex-1 bg-transparent border-none outline-none text-xs text-slate-300 placeholder-slate-600 font-mono"
          />
        </div>
      </form>
    </div>
  );
};
