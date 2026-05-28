import { Server, Socket } from 'socket.io';

import { PrismaClient } from '@prisma/client';
import { CharacterRepository } from '../repositories/CharacterRepository';
import { ABILITIES_REGISTRY } from '../domain/abilitiesRegistry';
import { BuyKiAbilityCommand, ActivateKiAbilityCommand, DeactivateKiAbilityCommand } from '../domain/ki/KiCommands';
import { resolveAttack } from '../engine/combatResolution';

const prisma = new PrismaClient({ log: ['info'] });

import { getCombatTracker, CombatantInitiativeInfo } from '../engine/combatTracker';
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
    await repo.save(character);
  }
}


// CombatTracker maneja el estado internamente
export function setupSocketEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Une al socket a la sala de la campaña
    socket.on('join_campaign', async (campaignId: string) => {
      socket.join(campaignId);
      console.log(`[Socket] ${socket.id} joined campaign ${campaignId}`);
      
      try {
        const repo = new CharacterRepository(prisma);
        const dbCharacters = await prisma.character.findMany({ where: { campaignId } });
        
        for (const dbChar of dbCharacters) {
          const character = await repo.findById(dbChar.id);
          if (character) {
            socket.emit('character_updated', {
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
              currentInitiative: character.currentInitiative,
              kiAbilities: character.kiAbilities
            });
          }
        }

        const npcs = getCampaignNpcs(campaignId);
        for (const npc of npcs.values()) {
            socket.emit('character_updated', {
              characterId: npc.id,
              name: npc.name,
              hp: npc.currentHp,
              maxHp: npc.maxHp,
              gold: npc.gold,
              state: npc.state,
              resistances: npc.resistances,
              inventory: npc.inventory,
              activeEffects: npc.activeEffects,
              ki: npc.ki,
              zeon: npc.zeon,
              temporaryShield: npc.temporaryShield,
              currentInitiative: npc.currentInitiative,
              kiAbilities: npc.kiAbilities
            });
        }
        
        socket.emit('combat_state_updated', getCombatTracker(campaignId).getPublicState());
      } catch (e) {
        console.error('[Socket] Error on join_campaign sync:', e);
      }
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
            resistances: data.resistances,
            kiAbilities: []
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
        currentInitiative: character.currentInitiative,
        kiAbilities: character.kiAbilities
      });
    };

    const broadcastCombatState = (campaignId: string) => {
      io.to(campaignId).emit('combat_state_updated', getCombatTracker(campaignId).getPublicState());
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

    socket.on('buy_item', async (data: { campaignId: string, characterId: string, item: any, cost: number }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character && character.gold >= data.cost) {
          character.gold -= data.cost;
          // Si el ítem ya existe en el inventario, incrementar cantidad, sino añadirlo
          const existingItem = character.inventory[data.item.id];
          if (existingItem) {
            existingItem.quantity += data.item.quantity;
          } else {
            character.inventory[data.item.id] = data.item;
          }
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

    socket.on('resolve_attack', async (data: { campaignId: string, attackerId: string, defenderId: string, attackRoll: number, defenseRoll: number, baseDamage: number, damageType: string }) => {
      const { campaignId, attackerId, defenderId, attackRoll, defenseRoll, baseDamage, damageType } = data;
      try {
        const attacker = await loadCharacter(campaignId, attackerId);
        const defender = await loadCharacter(campaignId, defenderId);
        if (!attacker || !defender) return;

        const ta = defender.resistances.getResistanceByType(damageType);
        const result = resolveAttack(attackRoll, defenseRoll, baseDamage, ta);
        const tracker = getCombatTracker(campaignId);

        if (result.damage > 0) {
          defender.applyResolvedDamage(result.damage);
          if (tracker.characterStates.has(defenderId)) {
            tracker.characterStates.get(defenderId)!.isDefensive = true;
          }
          await saveCharacter(defender);
          broadcastCharacterUpdate(campaignId, defender);
        }

        io.to(campaignId).emit('attack_resolved', {
          attackerId,
          defenderId,
          result
        });

        // FASE 4: Oportunidad de Contraataque
        if (result.counterAttackBonus > 0) {
          tracker.addPendingCounter(defenderId, () => {
            io.to(campaignId).emit('combat:counter_expired', { defenderId });
          });
          io.to(campaignId).emit('combat:counter_opportunity', {
            defenderId,
            attackerId,
            bonus: result.counterAttackBonus,
            timeoutMs: 15000
          });
        }
      } catch (e) {
        console.error('[Socket] Error resolving attack:', e);
      }
    });

    socket.on('combat:execute_counter', (data: { campaignId: string, defenderId: string, attackerId: string, bonus: number }) => {
      const tracker = getCombatTracker(data.campaignId);
      if (tracker.resolvePendingCounter(data.defenderId)) {
        io.to(data.campaignId).emit('combat:counter_confirmed', data);
      } else {
        socket.emit('combat:error', { message: 'El tiempo para contraatacar ha expirado.' });
      }
    });

    socket.on('roll_dice', (data: { campaignId: string, characterId: string, characterName: string, result: number, isFumble: boolean, isOpen: boolean, description: string }) => {
      io.to(data.campaignId).emit('dice_rolled', {
        ...data,
        timestamp: Date.now()
      });
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
        
        const tracker = getCombatTracker(data.campaignId);

        for (const charId of allCharactersToTick) {
          const character = await loadCharacter(data.campaignId, charId);
          if (character) {
            // Reduce duraciones de efectos (ya lo hacía tickEffects)
            character.tickEffects();
            
            // FASE 5: Recarga de Ki según acción
            const state = tracker.characterStates.get(charId);
            const hasActedOrDefended = state ? (state.hasActed || state.isDefensive) : false;
            
            const baseKiAcc = character.getKiAccumulationBase ? character.getKiAccumulationBase() : 1;
            const kiToRec = hasActedOrDefended ? Math.ceil(baseKiAcc / 2) : baseKiAcc;
            
            character.ki = (character.ki || 0) + kiToRec;

            character.currentInitiative = null; // Limpiamos iniciativa vieja
            await saveCharacter(character);
            broadcastCharacterUpdate(data.campaignId, character);
          }
        }
        
        // FASE 5: Limpieza de Tracker
        tracker.finalizeRound();
        broadcastCombatState(data.campaignId);
        
        io.to(data.campaignId).emit('combat:new_round_ready');

        console.log(`[Socket] Next round tick applied for campaign: ${data.campaignId}`);
      } catch (e) { console.error(e); }
    });

    socket.on('request_initiatives', (data: { campaignId: string }) => {
      const tracker = getCombatTracker(data.campaignId);
      tracker.startRound();
      broadcastCombatState(data.campaignId);
      io.to(data.campaignId).emit('combat:round_started'); // Socket spec
    });

    socket.on('combat:roll_initiative', async (data: { campaignId: string, info: CombatantInitiativeInfo, rollResult: number }) => {
      const tracker = getCombatTracker(data.campaignId);
      
      tracker.submitInitiative(data.info, data.rollResult);
      
      // Update character DB
      try {
        const character = await loadCharacter(data.campaignId, data.info.characterId);
        if (character) {
          // Buscamos cuál fue el resultado final que asignó el tracker
          const finalEntry = tracker.initiativeQueue.find(q => q.characterId === data.info.characterId);
          character.currentInitiative = finalEntry ? finalEntry.initiative : data.rollResult;
          await saveCharacter(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) { console.error(e); }

      broadcastCombatState(data.campaignId);
    });

    socket.on('next_turn', (data: { campaignId: string }) => {
      const tracker = getCombatTracker(data.campaignId);
      const activeChar = tracker.nextTurn();
      broadcastCombatState(data.campaignId);
      
      if (activeChar) {
        io.to(data.campaignId).emit('combat:turn_changed', activeChar);
      }
    });

    socket.on('use_character_ability', async (data: { campaignId: string, sourceId: string, targetId: string, abilityKey: string }) => {
      try {
        const sourceChar = await loadCharacter(data.campaignId, data.sourceId);
        if (!sourceChar) return;

        const ability = ABILITIES_REGISTRY[data.abilityKey];
        if (!ability) return;

        let success = false;

        // Verificar y gastar el recurso
        if (ability.resource === 'KI') {
          success = sourceChar.spendKi(ability.cost);
        } else if (ability.resource === 'ZEON') {
          success = sourceChar.spendZeon(ability.cost);
        }

        if (success) {
          if (ability.type === 'SHIELD') {
            sourceChar.temporaryShield += ability.effect.value;
          } else if (ability.type === 'BUFF_STAT' || ability.type === 'EFFECT') {
            const targetChar = ability.target === 'SELF' ? sourceChar : await loadCharacter(data.campaignId, data.targetId);
            if (targetChar) {
              targetChar.addEffect({
                id: Date.now().toString(),
                name: ability.name,
                type: ability.effect.effectType || 'PENALIZADOR',
                value: ability.effect.value,
                durationRounds: ability.effect.durationRounds || 1,
                statName: ability.effect.statName
              });
              if (ability.target !== 'SELF') {
                await saveCharacter(targetChar);
                broadcastCharacterUpdate(data.campaignId, targetChar);
              }
            }
          } else if (ability.type === 'DAMAGE') {
            const targetChar = await loadCharacter(data.campaignId, data.targetId);
            if (targetChar) {
              targetChar.applyDirectDamage(ability.effect.value, ability.effect.damageType || 'CON');
              await saveCharacter(targetChar);
              broadcastCharacterUpdate(data.campaignId, targetChar);
            }
          }

          // Guardar y emitir el source (quien gasta el recurso o recibe el buff/shield)
          await saveCharacter(sourceChar);
          broadcastCharacterUpdate(data.campaignId, sourceChar);
        }
      } catch (e) { console.error(e); }
    });

    socket.on('buy_ki_ability', async (data: { campaignId: string, characterId: string, abilityId: string }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          const ability = await prisma.kiAbility.findUnique({ where: { id: data.abilityId } });
          if (!ability) return;

          const command = new BuyKiAbilityCommand(character, ability as any);
          if (command.execute()) {
            await saveCharacter(character);
            broadcastCharacterUpdate(data.campaignId, character);
          }
        }
      } catch (e) { console.error('[Socket] Error Buy Ki:', e); }
    });

    socket.on('activate_ki_ability', async (data: { campaignId: string, characterId: string, abilityId: string }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          const ability = await prisma.kiAbility.findUnique({ where: { id: data.abilityId } });
          if (!ability) return;

          const command = new ActivateKiAbilityCommand(character, ability as any);
          if (command.execute()) {
            await saveCharacter(character);
            broadcastCharacterUpdate(data.campaignId, character);
          }
        }
      } catch (e) { console.error('[Socket] Error Activate Ki:', e); }
    });

    socket.on('deactivate_ki_ability', async (data: { campaignId: string, characterId: string, abilityId: string }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          const ability = await prisma.kiAbility.findUnique({ where: { id: data.abilityId } });
          if (!ability) return;

          const command = new DeactivateKiAbilityCommand(character, ability as any);
          if (command.execute()) {
            await saveCharacter(character);
            broadcastCharacterUpdate(data.campaignId, character);
          }
        }
      } catch (e) { console.error('[Socket] Error Deactivate Ki:', e); }
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
        const tracker = getCombatTracker(data.campaignId);
        tracker.initiativeQueue = tracker.initiativeQueue.filter(q => q.characterId !== data.characterId);
        broadcastCombatState(data.campaignId);
        
        io.to(data.campaignId).emit('character_removed', data.characterId);
      }
    });

  socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
