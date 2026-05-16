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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 text-foreground p-4">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tighter text-red-600 drop-shadow-sm">Anima Combat Assistant</h1>
          <p className="text-xl text-gray-400">Selecciona tu rol para comenzar</p>
        </div>
        <div className="flex gap-6">
          <Button 
            onClick={() => setRole('PLAYER')} 
            className="w-48 h-32 text-2xl font-bold bg-gray-900 border-2 border-gray-700 hover:border-red-500 hover:bg-gray-800 transition-all text-white"
          >
            ⚔️ Jugador
          </Button>
          <Button 
            onClick={() => setRole('GM')} 
            className="w-48 h-32 text-2xl font-bold bg-gray-900 border-2 border-gray-700 hover:border-blue-500 hover:bg-gray-800 transition-all text-white"
          >
            👁️ Game Master
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-[#09090b] overflow-hidden flex flex-col font-sans">
      <div className="bg-black/60 border-b border-gray-800 p-2 flex justify-between items-center px-6 shadow-sm z-10 relative">
        <span className="font-bold text-red-500/90 tracking-wide">Anima Combat Assistant</span>
        <Button variant="ghost" size="sm" onClick={() => setRole('NONE')} className="text-gray-400 hover:text-white hover:bg-gray-800">
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
