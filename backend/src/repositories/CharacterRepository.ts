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
        inventory: {},
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
        // Guardamos las resistencias de vuelta como JSON
        resistances: {
          FIL: character.resistances.FIL,
          CON: character.resistances.CON,
          PEN: character.resistances.PEN,
          CAL: character.resistances.CAL,
          ELE: character.resistances.ELE,
          FRI: character.resistances.FRI,
          ENE: character.resistances.ENE
        },
        inventory: character.inventory ? JSON.parse(JSON.stringify(character.inventory)) : {}
      }
    });
  }
}
