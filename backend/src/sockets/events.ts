import { Server, Socket } from 'socket.io';

import { PrismaClient } from '@prisma/client';
import { CharacterRepository } from '../repositories/CharacterRepository';
import { ABILITIES_REGISTRY } from '../domain/abilitiesRegistry';
import { BuyKiAbilityCommand, ActivateKiAbilityCommand, DeactivateKiAbilityCommand } from '../domain/ki/KiCommands';
import { resolveAttack } from '../engine/combatResolution';
import { roll1d100 } from '../engine/dice';
import { isAgony, evaluateDeathState } from '../engine/health';
import { tickBleeding } from '../engine/bleeding';
import { CombatLogEntry } from '../types/combatLog';

const prisma = new PrismaClient({ log: ['info'] });

import { getCombatTracker, CombatantInitiativeInfo } from '../engine/combatTracker';
import { TurnTracker } from '../types/combat';
import crypto from 'crypto';

const npcManagers = new Map<string, Map<string, any>>();
const activeProgressionDrafts: Record<string, any> = {};
const activeCombats: Record<string, any> = {};
const activeTurnTrackers: Record<string, TurnTracker> = {};
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
              kiAbilities: character.kiAbilities,
              reloadTurnsLeft: character.reloadTurnsLeft,
              martialStyles: character.martialStyles,
              activeMartialBonuses: character.activeMartialBonuses,
              strength: character.strength,
              dexterity: character.dexterity,
              agility: character.agility,
              constitution: character.constitution,
              intelligence: character.intelligence,
              power: character.power,
              willpower: character.willpower,
              perception: character.perception,
              appearance: character.appearance,
              nephilimType: character.nephilimType,
              hasInhumanity: character.hasInhumanity,
              hasZen: character.hasZen,
              isDead: character.isDead
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
              kiAbilities: npc.kiAbilities,
              reloadTurnsLeft: npc.reloadTurnsLeft,
              martialStyles: npc.martialStyles,
              activeMartialBonuses: npc.activeMartialBonuses,
              strength: npc.strength,
              dexterity: npc.dexterity,
              agility: npc.agility,
              constitution: npc.constitution,
              intelligence: npc.intelligence,
              power: npc.power,
              willpower: npc.willpower,
              perception: npc.perception,
              appearance: npc.appearance,
              nephilimType: npc.nephilimType,
              hasInhumanity: npc.hasInhumanity,
              hasZen: npc.hasZen,
              isDead: npc.isDead
            });
        }
        
        socket.emit('combat_state_updated', getCombatTracker(campaignId).getPublicState());
      } catch (e) {
        console.error('[Socket] Error on join_campaign sync:', e);
      }
    });

    socket.on('join_gm_room', () => {
      socket.join('gm_room');
      console.log(`[Socket] ${socket.id} joined gm_room`);
    });

    // --- Fase 10: Borradores de Progresión ---
    socket.on('player:progression_draft', (payload: any) => {
      activeProgressionDrafts[payload.playerId] = payload;
      socket.to('gm_room').emit('gm:update_player_draft', payload);
    });

    socket.on('gm:approve_level_up', async (playerId: string) => {
      const draft = activeProgressionDrafts[playerId];
      if (!draft || draft.isOverLimit) return;
      try {
        io.to(playerId).emit('player:progression_approved');
        delete activeProgressionDrafts[playerId];
        io.to('gm_room').emit('gm:remove_player_draft', playerId);
      } catch (error) {
        console.error('Error al consolidar los PD en Prisma:', error);
      }
    });

    socket.on('gm:reject_level_up', (playerId: string) => {
      if (activeProgressionDrafts[playerId]) {
        delete activeProgressionDrafts[playerId];
      }
      io.to(playerId).emit('player:progression_rejected');
      io.to('gm_room').emit('gm:remove_player_draft', playerId);
    });

    // Escucha del comando rápido para otorgar Puntos de Desarrollo (PD)
    socket.on('gm:command_give_dp', async (payload: { playerId: string; amount: number }) => {
      const { playerId, amount } = payload;

      // 1. Sanitización rápida de los datos de entrada
      if (!playerId || isNaN(amount) || amount <= 0) {
        socket.emit('gm:console_error', 'Error: Datos inválidos. Uso: /give_dp [id] [cantidad]');
        return;
      }

      try {
        // 2. Transacción directa en la base de datos con Prisma
        // Usamos totalDP de acuerdo al esquema
        const characterActualizado = await prisma.character.update({
          where: { id: playerId },
          data: {
            totalDP: {
              increment: amount
            }
          },
          select: {
            id: true,
            name: true,
            totalDP: true,
            spentDP: true
          }
        });

        // 3. Notificar al jugador afectado en tiempo real (si está conectado)
        const availableDP = characterActualizado.totalDP - characterActualizado.spentDP;
        io.to(playerId).emit('player:dp_received', {
          amount,
          newTotalDP: characterActualizado.totalDP,
          availableDP
        });

        // 4. Feedback de éxito para la consola del Dashboard del GM
        socket.emit('gm:console_success', `Inyectados ${amount} PD a ${characterActualizado.name} con éxito.`);

        // Actualizamos al resto también
        const repo = new CharacterRepository(prisma);
        const fullChar = await repo.findById(playerId);
        if (fullChar) {
          // Si sabemos el campaignId, emitimos character_updated
          // asumiendo que el char tiene campaignId
        }

      } catch (error) {
        console.error('Error crítico al procesar gm:command_give_dp con Prisma:', error);
        socket.emit('gm:console_error', 'Error interno del servidor al actualizar los PD en Prisma.');
      }
    });

    // --- Fase 10 (Subfase C): Ciclo de Agonía y Desangramiento ---
    socket.on('combat:tick_minute', async (campaignId: string) => {
      try {
        const repo = new CharacterRepository(prisma);
        const dbCharacters = await prisma.character.findMany({ where: { campaignId } });
        
        // PCs
        for (const dbChar of dbCharacters) {
          const character = await repo.findById(dbChar.id);
          if (character && character.isBleeding && !character.isDead) {
            tickBleeding(character);
            await saveCharacter(character);
            broadcastCharacterUpdate(campaignId, character);
          }
        }
        
        // NPCs
        const npcs = getCampaignNpcs(campaignId);
        for (const character of npcs.values()) {
          if (character.isBleeding && !character.isDead) {
            tickBleeding(character);
            broadcastCharacterUpdate(campaignId, character);
          }
        }
      } catch (e) {
        console.error('[Socket] Error on tick_minute:', e);
      }
    });

    socket.on('combat:tick_hour', async (campaignId: string) => {
      try {
        const repo = new CharacterRepository(prisma);
        const dbCharacters = await prisma.character.findMany({ where: { campaignId } });
        
        const processHour = async (character: any) => {
          if (character.isDead) return false;
          
          let changed = false;
          if (isAgony(character.currentHp, character.constitution)) {
            // RF contra 120
            const rfTotal = character.resistances.RF + roll1d100();
            if (rfTotal >= 120) {
              // Estabilizado
              character.currentHp = 0;
              character.state = 'INCONSCIENTE';
              character.isBleeding = false;
              // Add a -60 stabilization debuff
              character.activeEffects.push({
                id: Math.random().toString(36).substring(7),
                name: 'Estabilizado (Heridas graves)',
                characterId: character.id,
                modifiers: { HA: -60, HD: -60, ACCION: -60 },
                duration_rounds: 9999,
                createdAt: new Date()
              });
              changed = true;
            } else {
              // Si falla por > 60 muere
              if (120 - rfTotal > 60) {
                character.isDead = true;
                character.state = 'MUERTO';
                changed = true;
              }
            }
          }
          return changed;
        };

        // PCs
        for (const dbChar of dbCharacters) {
          const character = await repo.findById(dbChar.id);
          if (character && await processHour(character)) {
            await saveCharacter(character);
            broadcastCharacterUpdate(campaignId, character);
          }
        }
        
        // NPCs
        const npcs = getCampaignNpcs(campaignId);
        for (const character of npcs.values()) {
          if (await processHour(character)) {
            broadcastCharacterUpdate(campaignId, character);
          }
        }
      } catch (e) {
        console.error('[Socket] Error on tick_hour:', e);
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
        kiAbilities: character.kiAbilities,
        reloadTurnsLeft: character.reloadTurnsLeft,
        martialStyles: character.martialStyles,
        activeMartialBonuses: character.activeMartialBonuses
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

    // Phase 11: Combate Asíncrono
    socket.on('combat:declare_attack', async (data: { campaignId: string, attackerId: string, targetId: string, attackRoll: number, baseDamage: number, damageType: string, modifiers?: any, weaponCard?: any }) => {
      try {
        const attacker = await loadCharacter(data.campaignId, data.attackerId);
        if (!attacker) return;
        
        const combatInstanceId = `combat_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
        
        activeCombats[combatInstanceId] = {
          ...data,
          attackerName: attacker.name
        };

        io.to(data.targetId).emit('combat:defend_requested', {
          combatInstanceId,
          attackerName: attacker.name,
          attackRoll: data.attackRoll
        });

        io.to('gm_room').emit('gm:console_success', `${attacker.name} está atacando a ID:${data.targetId} (Tirada: ${data.attackRoll})`);
      } catch (e) {
        console.error('[Socket] Error declaring attack:', e);
      }
    });

    socket.on('combat:submit_defense', async (data: { combatInstanceId: string, defenseType: 'BLOCK' | 'DODGE', defenseRoll: number }) => {
      try {
        const combat = activeCombats[data.combatInstanceId];
        if (!combat) return;

        const { campaignId, attackerId, targetId, attackRoll, baseDamage, damageType, modifiers } = combat;
        delete activeCombats[data.combatInstanceId];

        const attacker = await loadCharacter(campaignId, attackerId);
        const defender = await loadCharacter(campaignId, targetId);
        if (!attacker || !defender) return;

        // FASE 6.2: Aplicar penalizadores físicos (Agotamiento / Sangrado)
        const attackerPenalty = attacker.getPhysicalPenalty();
        const defenderPenalty = defender.getPhysicalPenalty();
        
        let finalAttackRoll = attackRoll + attackerPenalty;
        let finalDefenseRoll = data.defenseRoll + defenderPenalty;

        // FASE 6.4: Penalizador Defensivo por Canalización Mágica
        if (defender.isChanneling) {
          finalDefenseRoll -= 20; 
        }

        // FASE 6.5: Acrobacias
        let acrobaticsBonus = 0;
        if (attacker.currentInitiative !== null && defender.currentInitiative !== null) {
          if (attacker.currentInitiative - defender.currentInitiative > 50 && (attacker.secondarySkills?.acrobacias || 0) >= 50) {
            acrobaticsBonus = 10;
            finalAttackRoll += acrobaticsBonus;
          }
        }

        const ta = defender.resistances.getResistanceByType(damageType);
        
        // FASE 6.3: Choque de Armas
        const attackerWeapon = attacker.getEquippedWeapon();
        const defenderWeapon = defender.getEquippedWeapon();
        const attackerWeaponROT = attackerWeapon ? (attackerWeapon.breakage || 0) : 0;
        const defenderWeaponENT = defenderWeapon ? (defenderWeapon.fortitude || 0) : 0;

        const result = resolveAttack(
          finalAttackRoll, 
          finalDefenseRoll, 
          baseDamage, 
          ta,
          defender.currentHp,
          data.defenseType,
          attackerWeaponROT,
          defenderWeaponENT,
          modifiers
        );
        
        if (result.weaponClash && result.weaponClash.broken && defenderWeapon) {
          defenderWeapon.isBroken = true;
          defender.unequipItem(defenderWeapon.id);
          io.to(campaignId).emit('combat:weapon_shattered', {
            characterId: targetId,
            weaponName: defenderWeapon.name
          });
        }
        
        if (acrobaticsBonus > 0) result.message += ` [Acrobacias: +${acrobaticsBonus} Ataque]`;
        if (attackerPenalty < 0) result.message += ` [Atacante Penalizado: ${attackerPenalty}]`;
        if (defenderPenalty < 0) result.message += ` [Defensor Penalizado: ${defenderPenalty}]`;
        
        const tracker = getCombatTracker(campaignId);

        if (result.damage > 0) {
          defender.applyResolvedDamage(result.damage);
          if (tracker.characterStates.has(targetId)) {
            tracker.characterStates.get(targetId)!.isDefensive = true;
          }

          if (result.isCritical) {
            let instantKill = false;
            if (result.criticalLocation! >= 10 && result.criticalLocation! <= 29 && result.criticalLevel! >= 50) {
              instantKill = true;
              defender.currentHp = 0; 
              result.message += " ¡GOLPE FATAL (Amputación)!";
            }

            let ignoreCritical = false;
            if ((defender.secondarySkills?.resistir_dolor || 0) >= 50) {
              ignoreCritical = true;
              result.message += ` [Resistir el Dolor: El defensor ignora el penalizador de crítico]`;
            } else {
              defender.activeEffects.push({
                id: `crit_${Date.now()}`,
                name: `Herida Crítica (Nvl ${result.criticalLevel})`,
                type: 'PENALIZADOR',
                value: result.criticalLevel || 10,
                durationRounds: 5
              });
            }
            
            if (!instantKill && defender.currentHp > 0) {
              defender.isBleeding = true;
              io.to(campaignId).emit('combat:bleeding_applied', { defenderId: targetId });
            }
            
            io.to(campaignId).emit('combat:critical_hit', {
              defenderId: targetId,
              level: result.criticalLevel,
              location: result.criticalLocation,
              instantKill
            });
          }

          await saveCharacter(defender);
          broadcastCharacterUpdate(campaignId, defender);
        }

        // Emitir a toda la mesa la resolución
        io.to(campaignId).emit('attack_resolved', {
          attackerId,
          defenderId: targetId,
          result
        });

        // Fase 12: Battle Log
        const logEntry: CombatLogEntry = {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: result.damage > 0 ? (result.isCritical ? 'critical' : 'attack_hit') : 'attack_miss',
          attackerName: attacker.name,
          targetName: defender.name,
          payload: {
            attackTotal: finalAttackRoll,
            defenseTotal: finalDefenseRoll,
            defenseType: data.defenseType,
            damageDealt: Math.floor((baseDamage * Math.max(10, Math.floor((finalAttackRoll - finalDefenseRoll - (result.armorAbsorbed || 0)) / 10) * 10)) / 100), // Approximate base damage dealt before mitigations or just raw calculation if needed, using result.damage
            armorMitigation: result.armorAbsorbed || 0,
            finalHpMinus: result.damage,
            isCritical: result.isCritical || false,
            criticalEffect: result.isCritical ? `Crítico Nvl ${result.criticalLevel} (Loc: ${result.criticalLocation})` : undefined
          }
        };
        
        io.to(campaignId).emit('combat:new_log', logEntry);

        // FASE 4: Oportunidad de Contraataque
        if (result.counterAttackBonus > 0) {
          tracker.addPendingCounter(targetId, () => {
            io.to(campaignId).emit('combat:counter_expired', { defenderId: targetId });
          });
          io.to(campaignId).emit('combat:counter_opportunity', {
            defenderId: targetId,
            attackerId,
            bonus: result.counterAttackBonus,
            timeoutMs: 15000
          });
        }
      } catch (e) {
        console.error('[Socket] Error in combat:submit_defense:', e);
      }
    });

    // Fase 13: Sockets de Control de Ronda
    socket.on('combat:submit_initiative_v2', ({ roomId, combatantId, name, roll, baseModifier, isNPC, accumulatingTurns }) => {
      if (!activeTurnTrackers[roomId]) {
        activeTurnTrackers[roomId] = { isActive: true, currentRound: 1, currentTurnIndex: 0, order: [] };
      }

      const tracker = activeTurnTrackers[roomId];
      const initiativeTotal = roll + baseModifier;

      // Evitar duplicados
      tracker.order = tracker.order.filter(c => c.combatantId !== combatantId);

      tracker.order.push({
        combatantId,
        name,
        initiativeTotal,
        isNPC,
        hasActed: false,
        accumulatingTurns: accumulatingTurns || 0
      });

      tracker.order.sort((a, b) => b.initiativeTotal - a.initiativeTotal);
      io.to(roomId).emit('combat:turn_order_updated', tracker);
    });

    socket.on('combat:next_turn', ({ roomId }) => {
      const tracker = activeTurnTrackers[roomId];
      if (!tracker || !tracker.isActive) return;

      if (tracker.order[tracker.currentTurnIndex]) {
        tracker.order[tracker.currentTurnIndex].hasActed = true;
      }

      tracker.currentTurnIndex += 1;

      const emitSystemLog = (rId: string, msg: string) => {
        io.to(rId).emit('combat:new_log', {
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: 'attack_miss', // Reusing this for system message format
          attackerName: 'Sistema',
          targetName: 'Mesa',
          payload: {
            attackTotal: 0, defenseTotal: 0, defenseType: 'DODGE', damageDealt: 0, armorMitigation: 0, finalHpMinus: 0, isCritical: true, criticalEffect: msg
          }
        });
      };

      if (tracker.currentTurnIndex >= tracker.order.length) {
        tracker.currentRound += 1;
        tracker.currentTurnIndex = 0;
        tracker.order.forEach(c => c.hasActed = false);
        
        io.to(roomId).emit('combat:new_round_started', tracker);
        emitSystemLog(roomId, `✨ ¡Comienza la Ronda ${tracker.currentRound}! Revisen sus estados.`);
        return;
      }

      const activeCombatant = tracker.order[tracker.currentTurnIndex];
      if (activeCombatant && activeCombatant.accumulatingTurns > 0) {
        activeCombatant.accumulatingTurns -= 1;
        emitSystemLog(roomId, `⏳ ${activeCombatant.name} continúa acumulando energía. Quedan ${activeCombatant.accumulatingTurns} turnos de concentración.`);
      }

      io.to(roomId).emit('combat:turn_order_updated', tracker);
    });

    // Old synchronous fallback or to be deprecated
    socket.on('resolve_attack', async (data: { campaignId: string, attackerId: string, defenderId: string, attackRoll: number, defenseRoll: number, baseDamage: number, damageType: string, defenseType?: 'BLOCK' | 'DODGE', modifiers?: any }) => {
      const { campaignId, attackerId, defenderId, attackRoll, defenseRoll, baseDamage, damageType, defenseType = 'DODGE', modifiers } = data;
      try {
        const attacker = await loadCharacter(campaignId, attackerId);
        const defender = await loadCharacter(campaignId, defenderId);
        if (!attacker || !defender) return;

        // FASE 6.2: Aplicar penalizadores físicos (Agotamiento / Sangrado)
        const attackerPenalty = attacker.getPhysicalPenalty();
        const defenderPenalty = defender.getPhysicalPenalty();
        
        let finalAttackRoll = attackRoll + attackerPenalty;
        let finalDefenseRoll = defenseRoll + defenderPenalty;

        // FASE 6.4: Penalizador Defensivo por Canalización Mágica
        if (defender.isChanneling) {
          finalDefenseRoll -= 20; // Penalizador fijo por canalizar
        }

        // FASE 6.5: Acrobacias (Si iniciativa > 50 de diferencia)
        let acrobaticsBonus = 0;
        if (attacker.currentInitiative !== null && defender.currentInitiative !== null) {
          if (attacker.currentInitiative - defender.currentInitiative > 50 && (attacker.secondarySkills?.acrobacias || 0) >= 50) {
            acrobaticsBonus = 10;
            finalAttackRoll += acrobaticsBonus;
          }
        }

        const ta = defender.resistances.getResistanceByType(damageType);
        
        // FASE 6.3: Choque de Armas
        const attackerWeapon = attacker.getEquippedWeapon();
        const defenderWeapon = defender.getEquippedWeapon();
        const attackerWeaponROT = attackerWeapon ? (attackerWeapon.breakage || 0) : 0;
        const defenderWeaponENT = defenderWeapon ? (defenderWeapon.fortitude || 0) : 0;

        const result = resolveAttack(
          finalAttackRoll, 
          finalDefenseRoll, 
          baseDamage, 
          ta,
          defender.currentHp,
          defenseType,
          attackerWeaponROT,
          defenderWeaponENT,
          modifiers
        );
        
        if (result.weaponClash && result.weaponClash.broken && defenderWeapon) {
          defenderWeapon.isBroken = true;
          // Se rompe el arma, la desequipamos y marcamos rota
          defender.unequipItem(defenderWeapon.id);
          io.to(campaignId).emit('combat:weapon_shattered', {
            characterId: defenderId,
            weaponName: defenderWeapon.name
          });
        }
        
        // Agregar información de habilidades secundarias y penalizadores
        if (acrobaticsBonus > 0) result.message += ` [Acrobacias: +${acrobaticsBonus} Ataque]`;
        if (attackerPenalty < 0) result.message += ` [Atacante Penalizado: ${attackerPenalty}]`;
        if (defenderPenalty < 0) result.message += ` [Defensor Penalizado: ${defenderPenalty}]`;
        
        const tracker = getCombatTracker(campaignId);

        if (result.damage > 0) {
          defender.applyResolvedDamage(result.damage);
          if (tracker.characterStates.has(defenderId)) {
            tracker.characterStates.get(defenderId)!.isDefensive = true;
          }

          // FASE 6.1 y 6.5: Crítico y Resistir Dolor
          if (result.isCritical) {
            let instantKill = false;
            // 10-19 Cabeza, 20-29 Pecho/Corazón. Amputación si nivel >= 50
            if (result.criticalLocation! >= 10 && result.criticalLocation! <= 29 && result.criticalLevel! >= 50) {
              instantKill = true;
              defender.currentHp = 0; // Muerte instantánea
              result.message += " ¡GOLPE FATAL (Amputación)!";
            }

            let ignoreCritical = false;
            if ((defender.secondarySkills?.resistir_dolor || 0) >= 50) {
              ignoreCritical = true;
              result.message += ` [Resistir el Dolor: El defensor ignora el penalizador de crítico]`;
            } else {
              // Aplica un efecto de penalizador por crítico
              defender.activeEffects.push({
                id: `crit_${Date.now()}`,
                name: `Herida Crítica (Nvl ${result.criticalLevel})`,
                type: 'PENALIZADOR',
                value: result.criticalLevel || 10,
                durationRounds: 5
              });
            }
            
            if (!instantKill && defender.currentHp > 0) {
              defender.isBleeding = true;
              io.to(campaignId).emit('combat:bleeding_applied', { defenderId });
            }
            
            io.to(campaignId).emit('combat:critical_hit', {
              defenderId,
              level: result.criticalLevel,
              location: result.criticalLocation,
              instantKill
            });
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

    // FASE 6.2: Gasto de Cansancio
    socket.on('combat:spend_fatigue', async (data: { campaignId: string, characterId: string, amount: number }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character && character.currentFatigue >= data.amount) {
          character.currentFatigue -= data.amount;
          await saveCharacter(character);
          broadcastCharacterUpdate(data.campaignId, character);
          
          io.to(data.campaignId).emit('combat:fatigue_spent', {
            characterId: data.characterId,
            amount: data.amount,
            bonus: data.amount * 15
          });
        }
      } catch (e) {
        console.error('[Socket] Error spending fatigue:', e);
      }
    });

    // FASE 6.4: Canalización Mágica
    socket.on('combat:start_channeling', async (data: { campaignId: string, characterId: string, targetSpellId: string }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          character.isChanneling = true;
          character.channeledZeon = 0;
          character.targetSpellId = data.targetSpellId;
          await saveCharacter(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) {
        console.error('[Socket] Error starting channeling:', e);
      }
    });

    socket.on('combat:stop_channeling', async (data: { campaignId: string, characterId: string }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          character.isChanneling = false;
          character.channeledZeon = 0;
          character.targetSpellId = null;
          await saveCharacter(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) {
        console.error('[Socket] Error stopping channeling:', e);
      }
    });

    // FASE 6.4: Falla de Proyección Psíquica
    socket.on('combat:psychic_failure', async (data: { campaignId: string, characterId: string, failureLevel: number }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          character.applyPsychicFailure(data.failureLevel);
          await saveCharacter(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) {
        console.error('[Socket] Error in psychic failure:', e);
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

    socket.on('delete_dice_roll', (data: { campaignId: string, timestamp: number }) => {
      io.to(data.campaignId).emit('dice_roll_deleted', { timestamp: data.timestamp });
    });

    // FASE 7: Maniobras y Artes Marciales
    socket.on('combat:set_full_defense', async (data: { campaignId: string, characterId: string, isFullDefense: boolean }) => {
      const tracker = getCombatTracker(data.campaignId);
      const state = tracker.characterStates.get(data.characterId) || { isSurprised: false, isDefensive: false, hasActed: false };
      state.isDefensive = data.isFullDefense;
      tracker.characterStates.set(data.characterId, state);
      broadcastCombatState(data.campaignId);
    });

    socket.on('equip_martial_style', async (data: { campaignId: string, characterId: string, styleId: string }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          if (!character.martialStyles.includes(data.styleId)) {
            character.martialStyles.push(data.styleId);
            character.recalculateMartialArts();
            await saveCharacter(character);
            broadcastCharacterUpdate(data.campaignId, character);
          }
        }
      } catch (e) { console.error(e); }
    });

    socket.on('unequip_martial_style', async (data: { campaignId: string, characterId: string, styleId: string }) => {
      try {
        const character = await loadCharacter(data.campaignId, data.characterId);
        if (character) {
          character.martialStyles = character.martialStyles.filter((s: string) => s !== data.styleId);
          character.recalculateMartialArts();
          await saveCharacter(character);
          broadcastCharacterUpdate(data.campaignId, character);
        }
      } catch (e) { console.error(e); }
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
