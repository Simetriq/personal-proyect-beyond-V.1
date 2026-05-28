import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BookOpen, Sword, HeartPulse, Skull, Brain, Flame } from "lucide-react";

export function GuideView() {
  return (
    <div className="h-full w-full bg-[#161411] text-gray-200 p-4 md:p-8 overflow-y-auto" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-wood.png')" }}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-anima-gold to-yellow-500 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)] flex items-center justify-center gap-4">
            <BookOpen className="w-12 h-12 text-anima-gold" />
            Códice del VTT
            <BookOpen className="w-12 h-12 text-anima-gold" />
          </h1>
          <p className="text-gray-400 font-serif text-lg tracking-wide max-w-2xl mx-auto">
            Guía oficial de mecánicas y subsistemas del Anima Beyond Fantasy integrados en este Combat Assistant (Core Exxet Fase 10).
          </p>
        </div>

        {/* Sección 1: Creación y Razas */}
        <Card className="bg-[#0a0806]/90 border-[2px] border-[#3a2b1c] shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <CardHeader className="border-b border-[#3a2b1c]">
            <CardTitle className="font-serif text-2xl text-anima-gold uppercase tracking-wider flex items-center gap-3">
              <Brain className="w-6 h-6 text-[#c5a059]" />
              Fisiología y Creación de Personaje
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 font-serif text-gray-300">
            <p>
              El VTT soporta la creación rápida introduciendo las <strong>8 características primarias</strong> (FUE, DES, AGI, CON, INT, POD, VOL, PER) y la Apariencia.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-[#c5a059]">Nephilims:</strong> Puedes seleccionar orígenes raciales como Sylvain, Jayan, Duk'zarist, etc., los cuales aplican pasivas automáticas ocultas en el motor.</li>
              <li><strong className="text-red-400">Inhumanidad y Zen:</strong> Habilitan límites sobrehumanos. Sin Inhumanidad, un personaje jamás podrá tener más de 10 en Movimiento, sin importar su Agilidad.</li>
              <li><strong className="text-anima-ki">Vitalidad (HP):</strong> Determinada por la Constitución y la Vida Base. El motor gestiona el límite de muerte verdadera basado en la estadística (CON * -5).</li>
            </ul>
          </CardContent>
        </Card>

        {/* Sección 2: Motor de Combate y Calculadora */}
        <Card className="bg-[#0a0806]/90 border-[2px] border-[#3a2b1c] shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <CardHeader className="border-b border-[#3a2b1c]">
            <CardTitle className="font-serif text-2xl text-red-500 uppercase tracking-wider flex items-center gap-3">
              <Sword className="w-6 h-6 text-red-500" />
              Resolución de Combate Core Exxet
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 font-serif text-gray-300">
            <p>
              La Calculadora del Game Master automatiza la engorrosa tabla de resolución de combate.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-red-400">Pifias Automáticas:</strong> Si un jugador pifia, el motor calcula el nivel de severidad de la pifia (dependiendo de la tirada) y aplica restricciones a sus defensas.</li>
              <li><strong className="text-[#c5a059]">Armas Enormes:</strong> Los objetos marcados como "Enormes" multiplican el daño base y añaden Entereza/Rotura masiva, pero el motor inyecta un -40 a la Iniciativa si son blandidas por humanos de tamaño medio.</li>
              <li><strong className="text-purple-400">Proyección Mágica:</strong> Ahora se puede declarar un ataque o defensa usando "Proyección Mágica/Psíquica" directamente, lo cual es interpretado por el motor como una maniobra esotérica válida.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Sección 3: Fatiga y Cansancio */}
        <Card className="bg-[#0a0806]/90 border-[2px] border-[#3a2b1c] shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <CardHeader className="border-b border-[#3a2b1c]">
            <CardTitle className="font-serif text-2xl text-yellow-500 uppercase tracking-wider flex items-center gap-3">
              <Flame className="w-6 h-6 text-yellow-500" />
              Gestión de Fatiga Activa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 font-serif text-gray-300">
            <p>
              El cansancio es un recurso valioso. Ahora los jugadores pueden "Quemar" sus puntos de Cansancio en el panel de Combate para obtener impulsos heroicos momentáneos.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Quemar 1 Cansancio:</strong> Otorga +15 a la Habilidad de Ataque o Defensa actual.</li>
              <li><strong>Quemar 2 Cansancio:</strong> Otorga +30 a la Habilidad de Ataque o Defensa actual (Limitado a 1 vez por asalto a menos que se posea Ki).</li>
              <li><strong className="text-red-400">Sobrecarga:</strong> Si los puntos de cansancio de un personaje bajan drásticamente, sufrirá penalizadores pasivos a todas sus acciones que van desde -10 hasta -120.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Sección 4: Agonía, Sangrado y Primeros Auxilios */}
        <Card className="bg-[#0a0806]/90 border-[2px] border-[#3a2b1c] shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <CardHeader className="border-b border-[#3a2b1c]">
            <CardTitle className="font-serif text-2xl text-anima-blood uppercase tracking-wider flex items-center gap-3">
              <HeartPulse className="w-6 h-6 text-anima-blood" />
              Agonía y Medicina
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 font-serif text-gray-300">
            <div className="bg-red-950/20 p-4 border border-red-900/30 rounded">
              <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                <Skull className="w-4 h-4" /> Estados de Daño Severo
              </h4>
              <p className="text-sm">
                Cuando un combatiente entra en valores de vida negativos (0 a límite de CON*-5), colapsará. Además, la pérdida masiva de vida activa el <strong>Desangramiento</strong>. Por cada 5 PV de daño por sangrado, el personaje acumula un penalizador progresivo a todas las acciones físicas.
              </p>
            </div>
            <p>
              Para contrarrestar la muerte inminente, el Game Master cuenta con una herramienta táctica de <strong>Primeros Auxilios</strong> en su panel, capaz de estabilizar la hemorragia de un personaje inconsciente y frenar la pérdida de 1 PV por minuto del motor.
            </p>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center pt-8 pb-12">
          <p className="text-sm text-gray-500 font-serif">
            Desarrollado para el sistema Anima Beyond Fantasy (Core Exxet).<br/>
            Las actualizaciones se registrarán automáticamente en este códice.
          </p>
        </div>

      </div>
    </div>
  );
}
