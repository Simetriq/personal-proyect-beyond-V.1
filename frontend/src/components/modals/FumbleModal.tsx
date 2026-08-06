import { Button } from "../ui/button";

interface FumbleModalProps {
  event: { characterId: string; level: number; type: string };
  onDismiss: () => void;
}

export function FumbleModal({ event, onDismiss }: FumbleModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-6 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.3)] transform scale-100 animate-in fade-in zoom-in duration-300">
        <h2 className="text-3xl font-cinzel font-bold text-red-500 mb-4 text-center">¡PIFIA!</h2>
        
        <div className="space-y-4">
          <div className="bg-red-950/50 p-4 rounded text-center border border-red-900/50">
            <div className="text-sm text-gray-400 mb-1">Nivel de Pifia</div>
            <div className="text-4xl font-bold text-red-400">{event.level}</div>
          </div>
          
          <div className="p-3 bg-red-900 text-white font-bold text-center rounded border border-red-500">
            Has sufrido {event.type === 'fumble_major' ? 'un desastre táctico' : 'un tropiezo grave'}.
            Se han aplicado penalizadores automáticos.
          </div>
          
          <Button 
            variant="destructive" 
            className="w-full mt-4"
            onClick={onDismiss}
          >
            Aceptar Error
          </Button>
        </div>
      </div>
    </div>
  );
}
