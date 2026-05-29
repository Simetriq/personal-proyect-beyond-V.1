import { PrismaClient } from '@prisma/client';
import { Character, Item } from '../domain/Character';

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

    return new Character(domainData);
  }

  async create(data: any): Promise<Character> {
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

    return new Character({ ...dbChar, inventory: {} });
  }

  async save(character: Character): Promise<void> {
    // Deshidratación con transacción para manejar relaciones de inventario
    await this.prisma.$transaction(async (tx) => {
      await tx.character.update({
        where: { id: character.id },
        data: {
          hp: character.currentHp,
          gold: character.gold,
          ki: character.ki,
          zeon: character.zeon,
          kiAbilities: JSON.stringify(character.kiAbilities || []),
          resistances: JSON.stringify({
            FIL: character.baseResistances.FIL,
            CON: character.baseResistances.CON,
            PEN: character.baseResistances.PEN,
            CAL: character.baseResistances.CAL,
            ELE: character.baseResistances.ELE,
            FRI: character.baseResistances.FRI,
            ENE: character.baseResistances.ENE
          }),
          dotes: JSON.stringify(character.activeEffects || []),
          isBleeding: character.isBleeding,
          bleedingDamage: character.bleedingDamage,
          currentFatigue: character.currentFatigue,
          maxFatigue: character.maxFatigue,
          isChanneling: character.isChanneling,
          channeledZeon: character.channeledZeon,
          targetSpellId: character.targetSpellId
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
