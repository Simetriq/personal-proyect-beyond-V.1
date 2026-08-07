import { Swords } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface InitiativeModalProps {
  round: number;
  initiativeInput: string;
  setInitiativeInput: (val: string) => void;
  onSubmit: () => void;
}

export function InitiativeModal({ round, initiativeInput, setInitiativeInput, onSubmit }: InitiativeModalProps) {
  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm rounded-xl">
      <div className="w-[420px] bg-[#161411] border-[2px] border-[#c5a059] rounded-lg shadow-[0_0_50px_rgba(197,160,89,0.3),inset_0_0_20px_rgba(0,0,0,1)] relative overflow-hidden" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-wood.png')" }}>
        {/* Decorative top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#c5a059] to-transparent"></div>
        
        <div className="p-6">
          {/* Title */}
          <div className="text-center mb-5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Swords className="w-6 h-6 text-anima-gold animate-pulse drop-shadow-[0_0_8px_rgba(197,160,89,0.8)]" />
              <h2 className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#c5a059] to-[#fcd97b] uppercase tracking-[0.2em] drop-shadow-md">
                ¡Tira Iniciativa!
              </h2>
              <Swords className="w-6 h-6 text-anima-gold animate-pulse drop-shadow-[0_0_8px_rgba(197,160,89,0.8)]" />
            </div>
            <p className="text-[#8b7355] font-serif italic text-sm">
              El Director de Juego ha solicitado las iniciativas para el <span className="text-[#c5a059] font-bold not-italic">Asalto {round}</span>.
            </p>
          </div>

          {/* Separator */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#3a2b1c] to-transparent mb-5"></div>

          {/* Input */}
          <div className="mb-4">
            <label className="block text-[#8b7355] text-[10px] uppercase tracking-widest font-serif mb-2 text-center">Resultado de los dados</label>
            <Input 
              type="number" 
              placeholder="..." 
              className="text-3xl py-6 text-center bg-[#0a0806] border-[2px] border-[#3a2b1c] text-[#fcd97b] font-serif placeholder:text-[#3a2b1c] shadow-[inset_0_0_15px_rgba(0,0,0,1)] focus:border-[#c5a059] focus:shadow-[inset_0_0_15px_rgba(0,0,0,1),0_0_10px_rgba(197,160,89,0.3)]" 
              value={initiativeInput}
              onChange={(e) => setInitiativeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              autoFocus
            />
          </div>

          {/* Button */}
          <Button 
            onClick={onSubmit} 
            className="w-full h-12 btn-piedra-runica bg-gradient-to-b from-[#2a2215] to-[#161411] border-[2px] border-[#c5a059] text-[#fcd97b] font-bold font-serif py-6 text-lg uppercase tracking-widest shadow-[0_4px_15px_rgba(0,0,0,0.8)] hover:from-[#3a2b1c] hover:to-[#161411] transition-all active:scale-95 duration-100 relative z-10"
          >
            Enviar Resultado
          </Button>
        </div>

        {/* Decorative bottom bar */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#c5a059] to-transparent"></div>
      </div>
    </div>
  );
}
