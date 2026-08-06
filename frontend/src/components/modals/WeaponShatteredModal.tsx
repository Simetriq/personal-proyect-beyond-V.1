import { Button } from "../ui/button";

interface WeaponShatteredModalProps {
  event: { characterId: string; weaponName: string };
  onDismiss: () => void;
}

export function WeaponShatteredModal({ event, onDismiss }: WeaponShatteredModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border-2 border-orange-700 rounded-lg p-6 max-w-sm w-full shadow-[0_0_40px_rgba(255,165,0,0.3)] transform scale-100 animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-cinzel font-bold text-orange-500 mb-4 text-center">¡ARMA DESTROZADA!</h2>
        
        <div className="space-y-4">
          <div className="bg-orange-950/50 p-4 rounded text-center border border-orange-900/50">
            <div className="text-sm text-gray-400 mb-1">Tu arma ha sido destruida en el impacto:</div>
            <div className="text-xl font-bold text-orange-400">"{event.weaponName}"</div>
          </div>
          
          <div className="p-3 bg-gray-800 text-gray-300 text-sm text-center rounded border border-gray-700">
            El arma ha sido desequipada automáticamente y ya no proporcionará bonificadores.
          </div>
          
          <Button 
            className="w-full mt-4 bg-orange-700 hover:bg-orange-600 text-white font-bold"
            onClick={onDismiss}
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
