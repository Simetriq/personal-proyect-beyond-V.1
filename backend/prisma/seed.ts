import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando inyección de habilidades de Ki...');
  
  const filePath = path.join(__dirname, 'ki_abilities.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const abilities = JSON.parse(rawData);

  for (const ability of abilities) {
    await prisma.kiAbility.upsert({
      where: { id: ability.id },
      update: ability,
      create: ability,
    });
    console.log(`✅ Habilidad inyectada: ${ability.name}`);
  }

  // Inject a default GM user to avoid the error on startup
  const gmUser = await prisma.user.upsert({
    where: { email: 'gm@animacombat.com' },
    update: {},
    create: {
      email: 'gm@animacombat.com',
      name: 'Game Master',
    },
  });
  console.log(`✅ Usuario GM por defecto creado: ${gmUser.email}`);

  console.log('🌳 ¡Inyección de datos completada!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el proceso de inyección:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
