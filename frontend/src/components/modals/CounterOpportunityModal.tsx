import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface CounterOpportunityModalProps {
  bonus: number;
  timeoutMs: number;
  onExecute: () => void;
}

export function CounterOpportunityModal({ bonus, timeoutMs, onExecute }: CounterOpportunityModalProps) {
  const [counterTimeLeft, setCounterTimeLeft] = useState<number>(timeoutMs);

  useEffect(() => {
    setCounterTimeLeft(timeoutMs);
    const interval = setInterval(() => {
      setCounterTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [timeoutMs]);

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm rounded-xl">
      <Card className="bg-red-950 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] w-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl text-red-500 text-center uppercase tracking-wide animate-pulse">
            ¡Oportunidad de Contraataque!
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-center">
          <p className="text-gray-200">Has bloqueado/esquivado el ataque con éxito.</p>
          <p className="text-4xl font-black text-yellow-500 drop-shadow-md">
            BONO: +{bonus}
          </p>
          <div className="w-full bg-gray-900 h-4 rounded-full border border-gray-700 overflow-hidden">
            <div 
              className="bg-red-500 h-full transition-all duration-100 ease-linear" 
              style={{ width: `${(counterTimeLeft / timeoutMs) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400">
            Tiempo restante: {(counterTimeLeft / 1000).toFixed(1)}s
          </p>
          <Button 
            onClick={onExecute}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-6 text-xl transition-transform active:scale-95"
          >
            ¡EJECUTAR CONTRAATAQUE!
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
