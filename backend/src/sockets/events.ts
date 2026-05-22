import { Server, Socket } from 'socket.io';
import { processNextTurn, CharacterState } from '../engine/turn';
import { PrismaClient } from '@prisma/client';
import { CharacterRepository } from '../repositories/CharacterRepository';

const prisma = new PrismaClient({ log: ['info'] });

interface CombatState {
  round: number;
  turnIndex: number;
  initiativeQueue: { characterId: string; initiative: number }[];
  isRequestingInitiative: boolean;
}

const combatManagers = new Map<string, CombatState>();
const npcManagers = new Map<string, Map<string, any>>();
function getCampaignNpcs(campaignId: string) {
  if (!npcManagers.has(campaignId)) npcManagers.set(campaignId, new Map());
  return npcManagers.get(campaignId)!;
}
async function loadCharacter(campaignId: string, characterId: string) {
  if (characterId.startsWith('npc_')) return getCampaignNpcs(campaignId).get(characterId);
  const repo = new CharacterRepository(prisma);
  return await repo.findById(characterId);
}
async function saveCharacter(character: any) {
  if (!character.id.startsWith('npc_')) {
    const repo = new CharacterRepository(prisma);
    await saveCharacter(character);
  }
}


function getCombatState(campaignId: string): CombatState {
  if (!combatManagers.has(campaignId)) {
    combatManagers.set(campaignId, {
      round: 1,
      turnIndex: -1,
      initiativeQueue: [],
      isRequestingInitiative: false
    });
  }
  return combatManagers.get(campaignId)!;
}

export function setupSocketEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Une al socket a la sala de la campaña
    socket.on('join_campaign', (campaignId: string) => {
      socket.join(campaignId);
      console.log(`[Socket] ${socket.id} joined campaign ${campaignId}`);
    });

    // Actualiza y retransmite el cambio de una estadística
    socket.on('stat_changed', async (data: { campaignId: string, characterId: string, stat: string, value: number }) => {
      const { campaignId, characterId, stat, value } = data;
      
      try {
        io.to(campaignId).emit('stat_updated', { characterId, stat, value });
        console.log(`[Socket] Stat changed: ${characterId} -> ${stat}: ${value}`);
      } catch (e) {
        console.error(e);
      }
    });

    // Create a new character and broadcast to campaign
    socket.on('create_character', async (data) => {
      try {
        const repo = new CharacterRepository(prisma);
        
        let character = await repo.findById(data.characterId);
        if (!character) {
          character = await repo.create({
            id: data.characterId,
            campaignId: data.campaignId,
            name: data.name,
            maxHp: data.maxHp,
            gold: data.gold,
            ki: data.ki,
            zeon: data.zeon,
            resistances: data.resistances
          });
          console.log(`[Socket] Character created: ${character.name}`);
        } else {
          console.log(`[Socket] Character already exists, returning existing: ${character.name}`);
        }

        broadcastCharacterUpdate(data.campaignId, character);
      } catch (e: any) {
        console.error('[Socket] Error creating character:', e);
        socket.emit('character_error', { message: e.message || 'Error desconocido al crear personaje' });
      }
    });

    const broadcastCharacterUpdate = (campaignId: string, character: any) => {
      io.to(campaignId).emit('character_updated', {
        characterId: character.id,
        name: character.name,
        hp: character.currentHp,
        maxHp: character.maxHp,
        gold: character.gold,
        state: character.state,
        resistances: character.resistances,
        inventory: character.inventory,
        activeEffects: character.activeEffects,
        ki: character.ki,
        zeon: character.zeon,
        temporaryShield: character.temporaryShield,
        currentInitiative: character.currentInitiative
      });
    };

    const broadcastCombatState = (campaignId: string) => {
      io.to(campaignId).emit('combat_state_updated', getCombatState(campaignId));
    };

    socket.on('equip_item', async (data: { campaignId: string, characterId: string, itemId: string }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          character.equipItem(data.itemId);
          await saveCharacter(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) { console.error(e); }
    });

    socket.on('unequip_item', async (data: { campaignId: string, characterId: string, itemId: string }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          character.unequipItem(data.itemId);
          await saveCharacter(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) { console.error(e); }
    });

    socket.on('use_item', async (data: { campaignId: string, characterId: string, itemId: string }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          character.useItem(data.itemId);
          await saveCharacter(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) { console.error(e); }
    });

    socket.on('gm_update_character', async (data: { campaignId: string, characterId: string, updates: any }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        
        if (character) {
          character.gmOverrideStats(data.updates);
          await saveCharacter(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) {
        console.error('[Socket] Error GM Update:', e);
      }
    });

    // Apply damage to a character using the new OOP domain rules
    socket.on('apply_damage', async (data: { campaignId: string, characterId: string, amount: number, type: string }) => {
      const { campaignId, characterId, amount, type } = data;
      
      try {
        const character = await loadCharacter(data.campaignId, characterId);

        if (character) {
          character.applyDirectDamage(amount, type);
          await saveCharacter(character);
          broadcastCharacterUpdate(campaignId, character);
        }
      } catch (e) {
        console.error('[Socket] Error applying damage:', e);
      }
    });

    socket.on('apply_effect', async (data: { campaignId: string, characterId: string, effect: any }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          character.addEffect(data.effect);
          await saveCharacter(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) { console.error(e); }
    });

    socket.on('next_round_tick', async (data: { campaignId: string }) => {
      try {
        const dbCharacters = await prisma.character.findMany({
          where: { campaignId: data.campaignId }
        });

        const npcs = Array.from(getCampaignNpcs(data.campaignId).values());
        const allCharactersToTick = [...dbCharacters.map(d => d.id), ...npcs.map(n => n.id)];
        
        for (const charId of allCharactersToTick) {
          const character = await loadCharacter(data.campaignId, charId);
          if (character) {
            character.tickEffects();
            character.currentInitiative = null; // Limpiamos iniciativa vieja
            await saveCharacter(character);
            broadcastCharacterUpdate(data.campaignId, character);
          }
        }
        
        // Actualizamos estado de combate
        const state = getCombatState(data.campaignId);
        state.round += 1;
        state.turnIndex = -1;
        state.initiativeQueue = [];
        state.isRequestingInitiative = false;
        broadcastCombatState(data.campaignId);

        console.log(`[Socket] Next round tick applied for campaign: ${data.campaignId}`);
      } catch (e) { console.error(e); }
    });

    socket.on('request_initiatives', (data: { campaignId: string }) => {
      const state = getCombatState(data.campaignId);
      state.isRequestingInitiative = true;
      state.initiativeQueue = [];
      state.turnIndex = -1;
      broadcastCombatState(data.campaignId);
      io.to(data.campaignId).emit('initiative_requested');
    });

    socket.on('submit_initiative', async (data: { campaignId: string, characterId: string, initiative: number }) => {
      const state = getCombatState(data.campaignId);
      
      // Save initiative in queue
      const existing = state.initiativeQueue.find(i => i.characterId === data.characterId);
      if (existing) existing.initiative = data.initiative;
      else state.initiativeQueue.push({ characterId: data.characterId, initiative: data.initiative });
      
      // Update character
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          character.currentInitiative = data.initiative;
          await saveCharacter(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) { console.error(e); }

      // Sort queue desc
      state.initiativeQueue.sort((a, b) => b.initiative - a.initiative);
      
      // Auto close request if enough players? No, GM controls it or we just broadcast state.
      broadcastCombatState(data.campaignId);
    });

    socket.on('next_turn', (data: { campaignId: string }) => {
      const state = getCombatState(data.campaignId);
      state.isRequestingInitiative = false;
      if (state.initiativeQueue.length > 0) {
        state.turnIndex++;
        if (state.turnIndex >= state.initiativeQueue.length) {
          state.turnIndex = -1; // Fin de la ronda
        }
      }
      broadcastCombatState(data.campaignId);
    });

    socket.on('use_character_ability', async (data: { campaignId: string, sourceId: string, targetId: string, abilityName: string }) => {
      try {
        const sourceChar = await loadCharacter(data.campaignId, data.sourceId);
        if (!sourceChar) return;

        let success = false;

        if (data.abilityName === 'ESCUDO_MISTICO') {
          if (sourceChar.spendZeon(30)) {
            sourceChar.temporaryShield += 50;
            success = true;
          }
        } else if (data.abilityName === 'PIEL_DE_HIERRO') {
          if (sourceChar.spendKi(15)) {
            sourceChar.addEffect({
              id: Date.now().toString(),
              name: 'Piel de Hierro',
              type: 'BUF_TA',
              value: 2,
              durationRounds: 1
            });
            success = true;
          }
        } else if (data.abilityName === 'FUEGO_DEL_CAOS') {
          if (sourceChar.spendZeon(25)) {
            success = true;
            // Daño directo cruzado
            const targetChar = await loadCharacter(data.campaignId, data.targetId);
            if (targetChar) {
              targetChar.applyDirectDamage(40, 'CAL');
              await saveCharacter(targetChar);
              broadcastCharacterUpdate(data.campaignId, targetChar);
            }
          }
        }

        if (success) {
          await saveCharacter(sourceChar);
          broadcastCharacterUpdate(data.campaignId, sourceChar);
        }
      } catch (e) { console.error(e); }
    });

    // Maneja la desconexión del socket
    
    socket.on('spawn_npc', async (data: { campaignId: string, name: string, maxHp: number, resistances: any }) => {
      try {
        const { Character } = require('../domain/Character');
        const characterId = 'npc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const npcData = {
          id: characterId,
          name: data.name,
          max_hp: data.maxHp,
          hp: data.maxHp,
          gold: 0,
          ki: 0,
          zeon: 0,
          resistances: data.resistances
        };
        const npc = new Character(npcData);
        getCampaignNpcs(data.campaignId).set(characterId, npc);
        broadcastCharacterUpdate(data.campaignId, npc);
      } catch(e) { console.error(e); }
    });

    socket.on('remove_npc', (data: { campaignId: string, characterId: string }) => {
      if (data.characterId.startsWith('npc_')) {
        getCampaignNpcs(data.campaignId).delete(data.characterId);
        
        // Remove from initiative queue
        const state = getCombatState(data.campaignId);
        state.initiativeQueue = state.initiativeQueue.filter(q => q.characterId !== data.characterId);
        broadcastCombatState(data.campaignId);
        
        io.to(data.campaignId).emit('character_removed', data.characterId);
      }
    });

  socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
