import React, { useEffect, useRef } from 'react';
import { CombatLogEntry } from '../types/combatLog';

interface BattleLogPanelProps {
  logs: CombatLogEntry[];
}

export const BattleLogPanel: React.FC<BattleLogPanelProps> = ({ logs }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último evento de combate
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-lg h-80 font-mono text-xs shadow-inner mt-4">
      {/* Cabecera del Log */}
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center text-slate-400">
        <span className="text-[10px] font-bold tracking-widest uppercase">📜 Registro Táctico de Combate</span>
        <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-cyan-400">{logs.length} ev</span>
      </div>

      {/* Cuerpo del Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
        {logs.length === 0 ? (
          <div className="text-slate-600 text-center py-12 italic text-[11px]">
            Esperando declaraciones de hostilidad...
          </div>
        ) : (
          logs.map((log) => {
            const isHit = log.type === 'attack_hit' || log.type === 'critical';
            const isCrit = log.type === 'critical';

            return (
              <div 
                key={log.id} 
                className={`p-2.5 rounded border text-[11px] leading-relaxed transition-all duration-300 animate-slide-up ${
                  isCrit 
                    ? 'bg-red-950/30 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                    : isHit 
                    ? 'bg-slate-900/80 border-amber-600/30' 
                    : 'bg-slate-900/20 border-slate-900 text-slate-400'
                }`}
              >
                {/* Header del Mensaje: Tiempo y Tipo */}
                <div className="flex justify-between items-center text-[9px] text-slate-500 mb-1 border-b border-slate-800/40 pb-0.5">
                  <span>[{log.timestamp}]</span>
                  <span className={`font-bold uppercase ${isCrit ? 'text-red-400' : isHit ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {log.type.replace('_', ' ')}
                  </span>
                </div>

                {/* Narrativa Dinámica */}
                <p className="text-slate-200">
                  <strong className="text-slate-100">{log.attackerName}</strong> atacó a{' '}
                  <strong className="text-slate-100">{log.targetName}</strong>.
                </p>

                {/* Desglose de Fórmulas Matemáticas */}
                <div className="mt-1.5 pl-2 border-l-2 border-slate-800 space-y-0.5 text-slate-400 font-mono text-[10px]">
                  <div>
                    ⚔️ ATK: <span className="text-slate-200 font-bold">{log.payload.attackTotal}</span> vs{' '}
                    {log.payload.defenseType === 'DODGE' ? '💨' : '🛡️'}{' '}
                    DEF: <span className="text-slate-200 font-bold">{log.payload.defenseTotal}</span>
                  </div>
                  
                  {isHit ? (
                    <div className="text-amber-400/90 font-semibold">
                      💥 Impacto: {log.payload.damageDealt} base - Absorción ({log.payload.armorMitigation}) ={' '}
                      <span className="text-red-400 font-bold text-xs">-{log.payload.finalHpMinus} PV</span>
                    </div>
                  ) : (
                    <div className="text-cyan-400/90 font-medium">
                      🛡️ El ataque ha sido completamente evadido o mitigado.
                    </div>
                  )}

                  {/* Alerta de Efecto Crítico */}
                  {isCrit && log.payload.criticalEffect && (
                    <div className="mt-1 text-red-400 font-bold bg-red-950/60 border border-red-500/30 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider animate-pulse">
                      ⚠️ CRÍTICO: {log.payload.criticalEffect}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
