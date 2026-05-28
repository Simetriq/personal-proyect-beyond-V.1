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
          <button 
            onClick={() => setRole('PLAYER')} 
            className="w-48 h-48 rounded-full flex items-center justify-center text-3xl font-serif font-extrabold bg-gradient-to-br from-slate-800 via-gray-900 to-black border-4 border-[#3a352a] hover:border-anima-gold hover:shadow-[0_0_30px_rgba(197,160,89,0.5)] hover:scale-105 transition-all text-gray-300 hover:text-anima-goldglow shadow-[inset_0_10px_20px_rgba(0,0,0,0.8),0_10px_20px_rgba(0,0,0,0.5)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <span className="relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-wider">Jugador</span>
          </button>
          <button 
            onClick={() => setRole('GM')} 
            className="w-48 h-48 rounded-full flex items-center justify-center text-3xl font-serif font-extrabold bg-gradient-to-br from-slate-800 via-[#161224] to-black border-4 border-[#2a253a] hover:border-anima-zeon hover:shadow-[0_0_30px_rgba(75,0,130,0.6)] hover:scale-105 transition-all text-gray-300 hover:text-[#d0b3ff] shadow-[inset_0_10px_20px_rgba(0,0,0,0.8),0_10px_20px_rgba(0,0,0,0.5)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <span className="relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-wider text-center leading-tight">Game<br/>Master</span>
          </button>
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
