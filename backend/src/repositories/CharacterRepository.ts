import { PrismaClient } from '@prisma/client';
import { Character, Item, CharacterData } from '../domain/Character';
import { CharacterMapper } from './CharacterMapper';

export class CharacterRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async findById(id: string): Promise<Character | null> {
    const data = await this.prisma.character.findUnique({
      where: { id },
      include: {
        inventoryItems: {
          include: { item: true }
        },
        techniques: true,
        knownStyles: true
      }
    });

    if (!data) return null;

    // Hidratación
    const inventoryDict: Record<string, Item> = {};
    if (data.inventoryItems) {
      for (const inv of data.inventoryItems) {
        inventoryDict[inv.item.id] = {
          id: inv.item.id,
          name: inv.item.name,
          quantity: inv.quantity,
          type: inv.item.type as Item['type'],
          equipped: inv.equipped,
          modifiers: inv.item.modifiers ? JSON.parse(inv.item.modifiers) : undefined
        };
      }
    }

    const domainData = {
      ...data,
      resistances: typeof data.resistances === 'string' ? JSON.parse(data.resistances) : data.resistances,
      dotes: typeof data.dotes === 'string' ? JSON.parse(data.dotes) : data.dotes,
      kiAbilities: typeof data.kiAbilities === 'string' ? JSON.parse(data.kiAbilities) : data.kiAbilities,
      inventory: inventoryDict,
      kiReserves: typeof data.kiReserves === 'string' ? JSON.parse(data.kiReserves) : data.kiReserves,
      techniques: data.techniques.map(t => ({
        ...t,
        kiCost: typeof t.kiCost === 'string' ? JSON.parse(t.kiCost) : t.kiCost,
        maintenanceCost: typeof t.maintenanceCost === 'string' ? JSON.parse(t.maintenanceCost) : t.maintenanceCost,
        effects: typeof t.effects === 'string' ? JSON.parse(t.effects) : t.effects
      })),
      knownStyles: data.knownStyles.map(s => ({
        styleId: s.styleId,
        isActive: s.isActive
      }))
    };

    return CharacterMapper.toDomain(domainData);
  }

  async create(data: Partial<CharacterData>): Promise<Character> {
    const dbChar = await this.prisma.character.create({
      data: {
        id: data.id,
        name: data.name ?? 'Unknown',
        campaignId: data.campaignId ?? '',
        hp: data.maxHp ?? 10,
        max_hp: data.maxHp ?? 10,
        ki: data.ki ?? 0,
        zeon: data.zeon ?? 0,
        initiative_base: 0,
        gold: data.gold ?? 0,
        resistances: JSON.stringify(data.resistances || {}),
        dotes: JSON.stringify([]),
        kiAbilities: JSON.stringify([]),
        isBleeding: false,
        bleedingDamage: 0,
        currentFatigue: 5,
        maxFatigue: 5,
        isChanneling: false,
        channeledZeon: 0,
        kiReserves: "{}"
      },
      include: {
        inventoryItems: { include: { item: true } }
      }
    });

    const domainData = {
      ...dbChar,
      resistances: typeof dbChar.resistances === 'string' ? JSON.parse(dbChar.resistances) : dbChar.resistances,
      dotes: typeof dbChar.dotes === 'string' ? JSON.parse(dbChar.dotes) : dbChar.dotes,
      kiAbilities: typeof dbChar.kiAbilities === 'string' ? JSON.parse(dbChar.kiAbilities) : dbChar.kiAbilities,
      kiReserves: typeof dbChar.kiReserves === 'string' ? JSON.parse(dbChar.kiReserves) : dbChar.kiReserves,
      inventory: {},
      techniques: [],
      knownStyles: []
    };

    return CharacterMapper.toDomain(domainData);
  }

  async save(character: Character): Promise<void> {
    // Deshidratación con transacción para manejar relaciones de inventario
    await this.prisma.$transaction(async (tx) => {
      const prismaData = CharacterMapper.toPrisma(character);
      
      await tx.character.update({
        where: { id: character.id },
        data: {
          hp: prismaData.hp,
          gold: prismaData.gold,
          ki: prismaData.ki,
          zeon: prismaData.zeon,
          kiAbilities: JSON.stringify(prismaData.kiAbilities),
          resistances: JSON.stringify(prismaData.baseResistances),
          dotes: JSON.stringify(prismaData.dotes),
          isBleeding: prismaData.isBleeding,
          bleedingDamage: prismaData.bleedingDamage,
          currentFatigue: prismaData.currentFatigue,
          maxFatigue: prismaData.maxFatigue,
          isChanneling: prismaData.isChanneling,
          channeledZeon: prismaData.channeledZeon,
          targetSpellId: prismaData.targetSpellId,
          kiReserves: prismaData.kiReserves,
          activeStyleId: prismaData.activeStyleId
        }
      });

      // Actualizar Inventario
      await tx.inventoryItem.deleteMany({
        where: { characterId: character.id }
      });

      const invArray = Object.values(character.inventory);
      for (const item of invArray) {
        // Asegurarse de que el Item exista en la base de datos
        // Prisma upsert por ID fallará si el ID es un auto-generado o si item.id no existe.
        // Pero item.id lo mandamos como string UUID.
        
        // Comprobar si existe primero (upsert en ID no funciona si ID no está marcado como @unique además de @id a veces, pero probemos)
        let dbItem = await tx.item.findUnique({ where: { id: item.id } });
        if (!dbItem) {
          dbItem = await tx.item.create({
            data: {
              id: item.id,
              name: item.name,
              type: item.type,
              modifiers: item.modifiers ? JSON.stringify(item.modifiers) : undefined
            }
          });
        }

        await tx.inventoryItem.create({
          data: {
            characterId: character.id,
            itemId: dbItem.id,
            quantity: item.quantity,
            equipped: item.equipped
          }
        });
      }

      // Actualizar Técnicas
      await tx.technique.deleteMany({
        where: { characterId: character.id }
      });
      for (const tech of character.techniques || []) {
        await tx.technique.create({
          data: {
            id: tech.id, // maintain id if it exists
            characterId: character.id,
            name: tech.name,
            description: tech.description,
            level: tech.level,
            kiCost: JSON.stringify(tech.kiCost),
            maintenanceCost: JSON.stringify(tech.maintenanceCost),
            effects: JSON.stringify(tech.effects),
            isPersistent: tech.isPersistent,
            isActive: tech.isActive
          }
        });
      }

      // Actualizar Estilos
      await tx.characterMartialStyle.deleteMany({
        where: { characterId: character.id }
      });
      for (const style of character.knownStyles || []) {
        await tx.characterMartialStyle.create({
          data: {
            characterId: character.id,
            styleId: style.styleId,
            isActive: style.isActive
          }
        });
      }
    });
  }
}
