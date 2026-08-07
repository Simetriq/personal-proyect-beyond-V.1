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
        }
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
          type: inv.item.type as any,
          equipped: inv.equipped,
          modifiers: inv.item.modifiers ? JSON.parse(inv.item.modifiers as string) : undefined
        };
      }
    }

    const domainData = {
      ...data,
      resistances: typeof data.resistances === 'string' ? JSON.parse(data.resistances) : data.resistances,
      dotes: typeof data.dotes === 'string' ? JSON.parse(data.dotes) : data.dotes,
      kiAbilities: typeof data.kiAbilities === 'string' ? JSON.parse(data.kiAbilities) : data.kiAbilities,
      inventory: inventoryDict
    };

    return CharacterMapper.toDomain(domainData);
  }

  async create(data: Partial<CharacterData>): Promise<Character> {
    const dbChar = await this.prisma.character.create({
      data: {
        id: data.id,
        name: data.name,
        campaignId: data.campaignId,
        hp: data.maxHp,
        max_hp: data.maxHp,
        ki: data.ki,
        zeon: data.zeon,
        initiative_base: 0,
        gold: data.gold,
        resistances: JSON.stringify(data.resistances || {}),
        dotes: JSON.stringify([]),
        kiAbilities: JSON.stringify([]),
        isBleeding: false,
        bleedingDamage: 0,
        currentFatigue: 5,
        maxFatigue: 5,
        isChanneling: false,
        channeledZeon: 0
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
      inventory: {}
    };

    return CharacterMapper.toDomain(domainData);
  }

  async save(character: Character): Promise<void> {
    // Deshidratación con transacción para manejar relaciones de inventario
    await this.prisma.$transaction(async (tx) => {
      const prismaData = CharacterMapper.toPrisma(character);
      const pData = prismaData as any;
      
      await tx.character.update({
        where: { id: character.id },
        data: {
          hp: pData.hp as number,
          gold: pData.gold as number,
          ki: pData.ki as number,
          zeon: pData.zeon as number,
          kiAbilities: JSON.stringify(pData.kiAbilities || []),
          resistances: JSON.stringify({
            FIL: pData.baseResistances?.FIL || 0,
            CON: pData.baseResistances?.CON || 0,
            PEN: pData.baseResistances?.PEN || 0,
            CAL: pData.baseResistances?.CAL || 0,
            ELE: pData.baseResistances?.ELE || 0,
            FRI: pData.baseResistances?.FRI || 0,
            ENE: pData.baseResistances?.ENE || 0
          }),
          dotes: JSON.stringify(pData.dotes || []),
          isBleeding: pData.isBleeding as boolean,
          bleedingDamage: pData.bleedingDamage as number,
          currentFatigue: pData.currentFatigue as number,
          maxFatigue: pData.maxFatigue as number,
          isChanneling: pData.isChanneling as boolean,
          channeledZeon: pData.channeledZeon as number,
          targetSpellId: pData.targetSpellId as string | null
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
    });
  }
}
