import { PrismaClient } from '@prisma/client';
import { Character } from '../domain/Character';

export class CharacterRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async findById(id: string): Promise<Character | null> {
    const data = await this.prisma.character.findUnique({
      where: { id }
    });

    if (!data) return null;

    // Hidratación
    return new Character(data);
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
        resistances: data.resistances,
        inventory: {
          'item-1': {
            id: 'item-1',
            name: 'Poción de Vida Menor',
            quantity: 3,
            type: 'CONSUMIBLE',
            equipped: false
          },
          'item-2': {
            id: 'item-2',
            name: 'Coraza de Cuero',
            quantity: 1,
            type: 'ARMADURA',
            equipped: false,
            modifiers: { FIL: 2, CON: 1, PEN: 1 }
          }
        },
        dotes: []
      }
    });

    return new Character(dbChar);
  }

  async save(character: Character): Promise<void> {
    // Deshidratación
    await this.prisma.character.update({
      where: { id: character.id },
      data: {
        hp: character.currentHp,
        gold: character.gold,
        // Guardamos las resistencias BASE de vuelta como JSON
        resistances: {
          FIL: character.baseResistances.FIL,
          CON: character.baseResistances.CON,
          PEN: character.baseResistances.PEN,
          CAL: character.baseResistances.CAL,
          ELE: character.baseResistances.ELE,
          FRI: character.baseResistances.FRI,
          ENE: character.baseResistances.ENE
        },
        inventory: character.inventory ? JSON.parse(JSON.stringify(character.inventory)) : {},
        dotes: character.activeEffects ? JSON.parse(JSON.stringify(character.activeEffects)) : []
      }
    });
  }
}
