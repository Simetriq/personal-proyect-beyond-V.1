import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface Character {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  gold: number;
  inventory: any;
  state: 'ACTIVO' | 'INCONSCIENTE' | 'MUERTO';
}

interface CombatStore {
  socket: Socket | null;
  characters: Record<string, Character>;
  campaignId: string | null;
  
  connectToCampaign: (campaignId: string) => void;
  applyDamage: (characterId: string, amount: number, type: string) => void;
}

const SOCKET_URL = 'http://localhost:3000'; // Ajustar según el entorno

export const useCombatStore = create<CombatStore>((set, get) => ({
  socket: null,
  characters: {},
  campaignId: null,

  connectToCampaign: (campaignId: string) => {
    if (get().socket) return;

    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Conectado al servidor de Anima Combat');
      socket.emit('join_campaign', campaignId);
    });

    socket.on('character_updated', (data: { characterId: string, hp: number, state: string }) => {
      console.log('Personaje actualizado:', data);
      set((state) => ({
        characters: {
          ...state.characters,
          [data.characterId]: {
            ...state.characters[data.characterId],
            hp: data.hp,
            state: data.state as Character['state']
          }
        }
      }));
    });

    set({ socket, campaignId });
  },

  applyDamage: (characterId: string, amount: number, type: string) => {
    const { socket, campaignId } = get();
    if (socket && campaignId) {
      socket.emit('apply_damage', {
        campaignId,
        characterId,
        amount,
        type
      });
    }
  }
}));
