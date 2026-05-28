import { useState, useEffect } from 'react'
import { PlayerView } from './components/PlayerView'
import { GMView } from './components/GMView'
import { Button } from './components/ui/button'

function App() {
  const [role, setRole] = useState<'NONE' | 'PLAYER' | 'GM'>('NONE')

  useEffect(() => {
    // Force dark mode on mount
    document.documentElement.classList.add('dark');
  }, []);

  if (role === 'NONE') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-12 text-foreground p-4 relative overflow-hidden">
        {/* Subtle magical overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-anima-zeon/20 via-background to-background pointer-events-none"></div>
        
        <div className="text-center space-y-6 relative z-10">
          <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-widest text-anima-blood drop-shadow-[0_0_20px_rgba(138,3,3,0.8)] uppercase">
            Anima
          </h1>
          <h2 className="text-3xl md:text-4xl font-serif tracking-wide text-anima-gold drop-shadow-[0_0_10px_rgba(197,160,89,0.5)]">
            Combat Assistant
          </h2>
          <p className="text-xl text-gray-400 font-light mt-8">Selecciona tu rol para comenzar</p>
        </div>
        <div className="flex gap-8 relative z-10">
          <Button 
            onClick={() => setRole('PLAYER')} 
            className="w-48 h-32 text-2xl font-serif font-bold bg-gradient-to-b from-anima-panel to-background border border-anima-gold/30 hover:border-anima-gold hover:shadow-glow-gold hover:bg-anima-gold/10 transition-all text-white"
          >
             Jugador
          </Button>
          <Button 
            onClick={() => setRole('GM')} 
            className="w-48 h-32 text-2xl font-serif font-bold bg-gradient-to-b from-anima-panel to-background border border-anima-zeon/50 hover:border-anima-zeon hover:shadow-glow-zeon hover:bg-anima-zeon/10 transition-all text-white"
          >
             Game Master
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex flex-col font-sans">
      <div className="bg-anima-panel border-b border-anima-gold/20 p-2 flex justify-between items-center px-6 shadow-glass-gold z-10 relative">
        <span className="font-bold font-serif text-anima-gold tracking-widest text-lg drop-shadow-md">ANIMA</span>
        <Button variant="ghost" size="sm" onClick={() => setRole('NONE')} className="text-gray-400">
          Cambiar Rol
        </Button>
      </div>
      <div className="flex-grow overflow-auto relative z-0">
        {role === 'PLAYER' ? <PlayerView /> : <GMView />}
      </div>
    </div>
  )
}

export default App
