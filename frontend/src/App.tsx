import { useState, useEffect } from 'react'
import { Info, BookOpen } from 'lucide-react'
import { PlayerView } from './components/PlayerView'
import { GMView } from './components/GMView'
import { GuideView } from './components/GuideView'
import { Button } from './components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog'

function App() {
  const [role, setRole] = useState<'NONE' | 'PLAYER' | 'GM' | 'GUIDE'>('NONE')

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

        <div className="mt-8 relative z-10">
          <button 
            onClick={() => setRole('GUIDE')}
            className="px-8 py-3 rounded border-[2px] border-[#c5a059] bg-[#161411]/80 hover:bg-[#2a2215] text-[#c5a059] hover:text-[#fcd97b] hover:shadow-[0_0_15px_rgba(197,160,89,0.5)] transition-all font-serif font-bold tracking-widest uppercase flex items-center gap-2 group"
          >
            <BookOpen className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(197,160,89,0.8)]" />
            Códice / Guía
          </button>
        </div>
        
        <div className="absolute top-4 right-4 z-20">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-12 h-12 rounded-full flex items-center justify-center bg-[#2a2215] border-[2px] border-[#c5a059] hover:border-[#fcd97b] hover:bg-[#3a2b1c] text-[#c5a059] hover:text-[#fcd97b] transition-all shadow-[0_0_15px_rgba(0,0,0,0.8)] relative z-10 group" title="Información sobre los Roles">
                <Info className="w-6 h-6 drop-shadow-[0_0_8px_rgba(197,160,89,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(197,160,89,1)]" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto z-50 bg-[#161411] border-[2px] border-[#c5a059] text-gray-200 shadow-[inset_0_0_30px_rgba(0,0,0,1),0_10px_40px_rgba(0,0,0,0.9)]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-wood.png')" }}>
              <div className="absolute inset-0 bg-gradient-to-b from-[#2a2215]/40 to-transparent pointer-events-none"></div>
              <DialogHeader className="border-b border-[#3a2b1c] pb-4 relative z-10">
                <DialogTitle className="font-serif text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#c5a059] to-[#fcd97b] uppercase tracking-widest text-center drop-shadow-md">
                  Roles en el VTT
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4 font-serif relative z-10">
                <div className="bg-[#0a0806]/80 p-4 rounded border border-[#3a2b1c] shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                  <h3 className="text-lg font-bold text-anima-gold mb-2 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-anima-gold drop-shadow-[0_0_5px_rgba(197,160,89,1)]"></span> 
                    Rol de Jugador
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Accede a tu ficha de personaje personal. Podrás gestionar tus puntos de vida, fatiga, oro e inventario. Tendrás la opción de declarar ataques, defensas y tirar iniciativas, así como activar tus Dominios de Ki o Magia. Todo lo que hagas será sincronizado automáticamente con el Game Master.
                  </p>
                </div>

                <div className="bg-[#0a0806]/80 p-4 rounded border border-[#3a2b1c] shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                  <h3 className="text-lg font-bold text-anima-zeon mb-2 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-anima-zeon drop-shadow-[0_0_5px_rgba(139,92,246,1)]"></span> 
                    Rol de Game Master
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Dirige la campaña. Tendrás un panel general donde podrás visualizar a todos los jugadores conectados y añadir NPCs al combate. Usa la Calculadora de Combate para resolver automáticamente los impactos entre personajes, calculando armaduras, pifias, penalizadores y daño crítico en tiempo real.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex flex-col font-sans">
      <div className="bg-[#0a0806] border-b-[2px] border-[#3a2b1c] p-1.5 flex justify-between items-center px-6 shadow-[0_5px_15px_rgba(0,0,0,1)] z-10 relative" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-scales.png')" }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl drop-shadow-md">⚔️</span>
          <span className="font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-[#c5a059] to-[#fcd97b] tracking-[0.3em] text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">ANIMA</span>
        </div>
        <div className="flex gap-2 relative z-10">
          <Button onClick={() => setRole('GUIDE')} className="h-8 px-4 btn-piedra-runica bg-gradient-to-b from-[#161411] to-[#0a0806] border border-[#c5a059]/50 text-[#c5a059] hover:from-[#2a2215] hover:to-[#161411] text-[10px] font-bold font-serif uppercase tracking-widest shadow-[inset_0_0_5px_rgba(0,0,0,0.8)]">
            <BookOpen className="w-3 h-3 mr-2" /> Guía
          </Button>
          <Button onClick={() => setRole('NONE')} className="h-8 px-4 btn-piedra-runica bg-gradient-to-b from-[#2a2215] to-[#161411] border border-[#5c4a35] text-[#c5a059] hover:from-[#3a2b1c] hover:to-[#161411] text-[10px] font-bold font-serif uppercase tracking-widest shadow-[inset_0_0_5px_rgba(0,0,0,0.8),0_2px_5px_rgba(0,0,0,1)]">
            Cambiar Rol
          </Button>
        </div>
      </div>
      <div className="flex-grow overflow-auto relative z-0">
        {role === 'PLAYER' && <PlayerView />}
        {role === 'GM' && <GMView />}
        {role === 'GUIDE' && <GuideView />}
      </div>
    </div>
  )
}

export default App
