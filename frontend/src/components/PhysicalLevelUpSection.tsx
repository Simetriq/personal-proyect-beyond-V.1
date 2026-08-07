import React from 'react';

export interface ClassPhysicalCosts {
  ataque: number;
  esquiva: number;
  parada: number;
}

export interface LocalPhysicalSpend {
  ataque: number;
  esquiva: number;
  parada: number;
}

export interface PhysicalSectionProps {
  currentStats: { ataque: number; esquiva: number; parada: number };
  localSpend: LocalPhysicalSpend;
  classCosts: ClassPhysicalCosts;
  maxCombatDP: number;
  currentCombatDP: number;
  availableDP: number;
  onChangeStat: (stat: 'ataque' | 'esquiva' | 'parada', newValue: number) => void;
}

export const PhysicalLevelUpSection: React.FC<PhysicalSectionProps> = ({
  currentStats,
  localSpend,
  classCosts,
  maxCombatDP,
  currentCombatDP,
  availableDP,
  onChangeStat
}) => {
  const localCombatCost = 
    (localSpend.ataque * classCosts.ataque) +
    (localSpend.esquiva * classCosts.esquiva) +
    (localSpend.parada * classCosts.parada);

  const totalProvisionalCombatDP = currentCombatDP + localCombatCost;

  return (
    <div className="p-4 bg-slate-900 text-slate-100 rounded-lg border border-amber-900/40">
      <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-amber-500">
        ⚔️ Desarrollo Físico y Habilidades de Combate
      </h3>
      
      {/* Barra de Límite de Categoría de Combate */}
      <div className="mb-6 bg-slate-950 p-3 rounded border border-slate-800">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Límite de Categoría (Combate):</span>
          <span className={totalProvisionalCombatDP > maxCombatDP ? 'text-red-400 font-bold' : 'text-slate-300'}>
            {totalProvisionalCombatDP} / {maxCombatDP} PD
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full transition-all duration-300 ${totalProvisionalCombatDP > maxCombatDP ? 'bg-red-500' : 'bg-amber-600'}`}
            style={{ width: `${Math.min((totalProvisionalCombatDP / maxCombatDP) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* FILA DE ATAQUE */}
        <div className="flex items-center justify-between p-3 bg-slate-850 rounded border border-slate-800">
          <div>
            <div className="font-semibold text-slate-200">Ataque Base</div>
            <div className="text-xs text-slate-400">Coste: {classCosts.ataque} PD por punto</div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded disabled:opacity-30 font-mono text-lg flex items-center justify-center"
              disabled={localSpend.ataque <= 0}
              onClick={() => onChangeStat('ataque', localSpend.ataque - 1)}
            >
              -
            </button>
            <span className="text-lg font-mono w-16 text-center">
              {currentStats.ataque + localSpend.ataque}
            </span>
            <button 
              className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded disabled:opacity-30 font-mono text-lg flex items-center justify-center"
              disabled={availableDP < classCosts.ataque || totalProvisionalCombatDP + classCosts.ataque > maxCombatDP}
              onClick={() => onChangeStat('ataque', localSpend.ataque + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* FILA DE ESQUIVA */}
        <div className="flex items-center justify-between p-3 bg-slate-850 rounded border border-slate-800">
          <div>
            <div className="font-semibold text-slate-200">Esquiva Base</div>
            <div className="text-xs text-slate-400">Coste: {classCosts.esquiva} PD por punto</div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded disabled:opacity-30 font-mono text-lg flex items-center justify-center"
              disabled={localSpend.esquiva <= 0}
              onClick={() => onChangeStat('esquiva', localSpend.esquiva - 1)}
            >
              -
            </button>
            <span className="text-lg font-mono w-16 text-center">
              {currentStats.esquiva + localSpend.esquiva}
            </span>
            <button 
              className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded disabled:opacity-30 font-mono text-lg flex items-center justify-center"
              disabled={availableDP < classCosts.esquiva || totalProvisionalCombatDP + classCosts.esquiva > maxCombatDP}
              onClick={() => onChangeStat('esquiva', localSpend.esquiva + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* FILA DE PARADA */}
        <div className="flex items-center justify-between p-3 bg-slate-850 rounded border border-slate-800">
          <div>
            <div className="font-semibold text-slate-200">Parada Base</div>
            <div className="text-xs text-slate-400">Coste: {classCosts.parada} PD por punto</div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded disabled:opacity-30 font-mono text-lg flex items-center justify-center"
              disabled={localSpend.parada <= 0}
              onClick={() => onChangeStat('parada', localSpend.parada - 1)}
            >
              -
            </button>
            <span className="text-lg font-mono w-16 text-center">
              {currentStats.parada + localSpend.parada}
            </span>
            <button 
              className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded disabled:opacity-30 font-mono text-lg flex items-center justify-center"
              disabled={availableDP < classCosts.parada || totalProvisionalCombatDP + classCosts.parada > maxCombatDP}
              onClick={() => onChangeStat('parada', localSpend.parada + 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Resumen del impacto de coste */}
      {localCombatCost > 0 && (
        <div className="mt-4 text-right text-xs text-amber-400 font-mono animate-pulse">
          Inversión actual en combate: +{localCombatCost} PD
        </div>
      )}
    </div>
  );
};
