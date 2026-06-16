import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CombatLogEntry } from '../types/combatLog';

interface BattleLogPanelProps {
  logs: CombatLogEntry[];
  activeCharacterId: string; // ID del PJ que controla este cliente
  isGM: boolean;
}

type LogFilter = 'all' | 'mine' | 'system';

export const BattleLogPanel: React.FC<BattleLogPanelProps> = ({ logs, activeCharacterId, isGM }) => {
  const [activeFilter, setActiveFilter] = useState<LogFilter>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al recibir nuevos logs
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Filtrado reactivo en memoria local
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (activeFilter === 'mine') {
        return log.characterId === activeCharacterId;
      }
      if (activeFilter === 'system') {
        return log.type === 'system';
      }
      return true; // 'all'
    });
  }, [logs, activeFilter, activeCharacterId]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col h-[350px] font-mono shadow-inner">
      {/* Cabecera con Micro-Filtros (Píldoras Cyberpunk) */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
          📜 Registro Táctico
        </span>
        
        {/* Selector de Filtros */}
        <div className="flex space-x-1 bg-slate-900 p-0.5 rounded border border-slate-800">
          {(['all', 'mine', 'system'] as LogFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-tight rounded transition-all ${
                activeFilter === filter
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter === 'all' ? 'Todos' : filter === 'mine' ? 'Mío' : 'Avisos'}
            </button>
          ))}
        </div>
      </div>

      {/* Feed de Eventos */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-900"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center text-slate-600 text-xs py-8 italic">
            Ningún log coincide con el filtro activo.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isCritical = log.type === 'critical';
            const isOwnLog = log.characterId === activeCharacterId;

            return (
              <div
                key={log.id}
                className={`text-xs p-1.5 rounded transition-colors ${
                  isCritical 
                    ? 'bg-red-950/30 border-l-2 border-red-500' 
                    : log.isSecret 
                    ? 'bg-purple-950/20 border-l-2 border-purple-500'
                    : isOwnLog
                    ? 'bg-slate-900/60 border-l-2 border-cyan-500'
                    : 'bg-slate-950 hover:bg-slate-900/30'
                }`}
              >
                {/* Meta de la Tirada (Nombre e Indicadores) */}
                <div className="flex justify-between items-center text-[10px] mb-0.5">
                  <span className={`font-bold ${isOwnLog ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {log.characterName} {log.isSecret && <span className="text-purple-400 text-[9px]">[SECRETO]</span>}
                  </span>
                  <span className="text-slate-600 text-[9px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {/* Cuerpo del Mensaje */}
                <p className={`text-[11px] leading-relaxed ${isCritical ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                  {log.message}
                </p>

                {/* Desglose Matemático Ofuscable */}
                {log.mathDetails && (isGM || !log.isSecret) && (
                  <div className="mt-1 pt-1 border-t border-slate-900/50 text-[10px] text-slate-500 flex flex-wrap gap-x-2">
                    <span>🎲 Dardo: <strong>{log.mathDetails.roll}</strong></span>
                    <span>Mod: <strong>+{log.mathDetails.modifier}</strong></span>
                    <span className="text-amber-500">Total: <strong>{log.mathDetails.total}</strong></span>
                    {log.mathDetails.damageFinal !== undefined && (
                      <span className="text-red-500 font-bold">Daño: {log.mathDetails.damageFinal}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
