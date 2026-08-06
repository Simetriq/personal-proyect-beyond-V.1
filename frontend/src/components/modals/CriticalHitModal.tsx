import { Button } from "../ui/button";

interface CriticalHitModalProps {
  event: { defenderId: string; level: number; location: string; instantKill: boolean };
  onDismiss: () => void;
}

export function CriticalHitModal({ event, onDismiss }: CriticalHitModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border-2 border-red-900 rounded-lg p-6 max-w-md w-full shadow-[0_0_50px_rgba(255,0,0,0.4)] transform scale-100 animate-in fade-in zoom-in duration-300">
        <h2 className="text-3xl font-cinzel font-bold text-red-500 mb-4 text-center">¡IMPACTO CRÍTICO RECIBIDO!</h2>
        
        <div className="space-y-4">
          <div className="bg-red-950/50 p-4 rounded text-center border border-red-900/50">
            <div className="text-sm text-gray-400 mb-1">Nivel de Crítico</div>
            <div className="text-4xl font-bold text-red-400">{event.level}</div>
          </div>
          
          <div className="bg-gray-800/50 p-4 rounded text-center border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Localización</div>
            <div className="text-2xl font-bold text-gray-200 uppercase">{event.location}</div>
            <div className="text-xs text-gray-500 mt-2">
              Se ha aplicado el modificador de estado negativo.
            </div>
          </div>
          
          {event.instantKill && (
            <div className="p-3 bg-red-900 text-white font-bold text-center rounded border border-red-500 animate-pulse">
              ¡GOLPE FATAL! ¡AMPUTACIÓN EN PUNTO VITAL! (MUERTE INSTANTÁNEA)
            </div>
          )}
          
          {!event.instantKill && (
            <div className="p-3 bg-orange-950/50 text-orange-400 text-sm text-center rounded border border-orange-900/50">
              Estás sufriendo desangramiento. Perderás 1 PV por cada asalto.
            </div>
          )}
          
          <Button 
            variant="destructive" 
            className="w-full mt-4"
            onClick={onDismiss}
          >
            Aceptar Destino
          </Button>
        </div>
      </div>
    </div>
  );
}
