import React from 'react';

export interface LocalMagicSpend {
  actuacion: number;
  zeon: number;
  vias: {
    FUEGO: number;
    AGUA: number;
  };
}

export interface MagicSectionProps {
  currentVias: { FUEGO: number; AGUA: number };
  localSpend: LocalMagicSpend;
  onChangeVia: (viaName: 'FUEGO' | 'AGUA', newValue: number) => void;
  availableDP: number;
}

export const MagicLevelUpSection: React.FC<MagicSectionProps> = ({
  currentVias,
  localSpend,
  onChangeVia,
  availableDP
}) => {
  return (
    <div className="p-4 bg-slate-900 text-slate-100 rounded-lg border border-slate-700">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        🔮 Progresión Mística y Conocimiento de Vías
      </h3>
      
      <p className="text-sm text-slate-400 mb-6">
        Cada punto invertido en una Vía aumenta tu nivel en ella, desbloqueando automáticamente los conjuros del registro místico.
      </p>

      <div className="space-y-6">
        {/* CONTROL DE VÍA DE FUEGO */}
        <div className="bg-slate-800 p-4 rounded border border-orange-900/40">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-orange-400">🔥 Vía del Fuego</span>
            <div className="flex items-center gap-3">
              <button 
                className="px-2 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-30"
                disabled={localSpend.vias.FUEGO <= 0}
                onClick={() => onChangeVia('FUEGO', localSpend.vias.FUEGO - 5)}
              >
                -5
              </button>
              <span className="text-lg font-mono w-12 text-center">
                {currentVias.FUEGO + localSpend.vias.FUEGO}
              </span>
              <button 
                className="px-2 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-30"
                disabled={availableDP < 5 || (currentVias.FUEGO + localSpend.vias.FUEGO) >= 100}
                onClick={() => onChangeVia('FUEGO', localSpend.vias.FUEGO + 5)}
              >
                +5
              </button>
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(currentVias.FUEGO + localSpend.vias.FUEGO, 100)}%` }}
            />
          </div>
        </div>

        {/* CONTROL DE VÍA DE AGUA */}
        <div className="bg-slate-800 p-4 rounded border border-blue-900/40">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-blue-400">💧 Vía del Agua</span>
            <div className="flex items-center gap-3">
              <button 
                className="px-2 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-30"
                disabled={localSpend.vias.AGUA <= 0}
                onClick={() => onChangeVia('AGUA', localSpend.vias.AGUA - 5)}
              >
                -5
              </button>
              <span className="text-lg font-mono w-12 text-center">
                {currentVias.AGUA + localSpend.vias.AGUA}
              </span>
              <button 
                className="px-2 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-30"
                disabled={availableDP < 5 || (currentVias.AGUA + localSpend.vias.AGUA) >= 100}
                onClick={() => onChangeVia('AGUA', localSpend.vias.AGUA + 5)}
              >
                +5
              </button>
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(currentVias.AGUA + localSpend.vias.AGUA, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
