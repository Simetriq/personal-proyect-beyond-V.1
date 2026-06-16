import React, { useEffect, useState } from 'react';
import { useCombatStore } from '../store/combatStore';
import { TurnOrderTracker } from './TurnOrderTracker';
import { AlteredState, STATE_MODIFIERS } from '../types/combat';

export const GameMasterDashboard: React.FC<{ socket: any }> = ({ socket }) => {
  const { progressionDrafts, setupGMSocketListeners, approveLevelUp, rejectLevelUp, turnTracker, campaignId } = useCombatStore();
  const [commandInput, setCommandInput] = useState('');
  const combatants = turnTracker?.order || [];

  // Inicializar la escucha de sockets del GM al montar el componente
  // Note: Since Zustand state and actions can't easily access setupGMSocketListeners if not implemented there, 
  // actually wait, the user's guide added setupGMSocketListeners to combatStore, but I didn't add it in my previous edit!
  // I must add it to the combatStore or implement it here.
  // Wait, I implemented the listeners in connectToCampaign in combatStore!
  // Ah, I put socket.on('gm:update_player_draft') in connectToCampaign. So I don't need setupGMSocketListeners here.

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    socket.emit('combat:execute_gm_command', {
      roomId: campaignId || 'camp-1',
      commandString: commandInput
    });
    setCommandInput('');
  };

  const handleApplyState = (characterId: string, state: AlteredState) => {
    socket.emit('combat:toggle_character_state', {
      roomId: campaignId || 'camp-1',
      characterId,
      state
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 font-mono">
      {/* Fase 13: Turn Tracker */}
      <TurnOrderTracker roomId={useCombatStore.getState().campaignId || "camp-1"} isGM={true} />

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

      {/* OMNIPOTENCE INTERFACE // CONTROL PANEL */}
      <div className="bg-slate-950 border border-purple-900/40 rounded-lg p-4 font-mono shadow-2xl mt-6">
        <div className="flex items-center justify-between border-b border-purple-950 pb-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400 animate-pulse">
            🔮 OMNIPOTENCE INTERFACE // CONTROL PANEL
          </span>
          <span className="text-[9px] text-purple-600 font-mono">SYS_AUTH: GAME_MASTER</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Grid de Monitoreo Rápido e Inyección de Estados */}
          <div className="space-y-2">
            <h3 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Inyector Táctico de Estados</h3>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-900">
              {combatants.map((combatant) => (
                <div key={combatant.combatantId} className="bg-slate-900 border border-slate-800 p-2 rounded flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                      {combatant.name}
                    </span>
                    <span className="text-[9px] text-slate-500 bg-slate-950 px-1 rounded">
                      ID: {combatant.combatantId.substring(0, 4)}...
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(Object.keys(STATE_MODIFIERS) as AlteredState[]).map((state) => (
                      <button
                        key={state}
                        onClick={() => handleApplyState(combatant.combatantId, state)}
                        className="text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-tighter bg-purple-950/40 hover:bg-purple-600 hover:text-slate-950 text-purple-400 border border-purple-900/30 rounded transition-all"
                        title={`INI ${STATE_MODIFIERS[state].initMod} | ATK ${STATE_MODIFIERS[state].attackMod}`}
                      >
                        +{STATE_MODIFIERS[state].name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {combatants.length === 0 && (
                <span className="text-xs italic text-slate-600">No hay combatientes en el tracker...</span>
              )}
            </div>
          </div>

          {/* Consola de Comandos CLI */}
          <div className="flex flex-col">
            <h3 className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">Consola de Macros CLI</h3>
            <form onSubmit={handleCommandSubmit} className="flex-1 flex flex-col">
              <div className="flex items-center bg-slate-900 rounded border border-purple-950 p-2 focus-within:border-purple-500/50 transition flex-1">
                <span className="text-purple-500 font-bold px-2 text-sm">&gt;_</span>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="/give_dp [id] 150  u  /damage [id] 40"
                  className="bg-transparent text-xs text-purple-300 placeholder-purple-900/60 flex-1 outline-none font-mono py-1 w-full"
                />
                <button
                  type="submit"
                  className="bg-purple-900 hover:bg-purple-700 text-purple-100 text-[10px] uppercase font-bold px-4 py-2 rounded transition-colors ml-2"
                >
                  Exec
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
