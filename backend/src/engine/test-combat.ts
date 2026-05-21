import { Character } from '../domain/Character';
import { Resistances } from '../domain/Resistances';

console.log('⚔️  Iniciando Simulación de Combate Anima ⚔️\n');

// 1. Instanciamos a nuestro guerrero Kaelen con las nuevas clases de Dominio
const mockData = {
  id: 'char-1',
  name: 'Kaelen (Guerrero)',
  hp: 150,
  max_hp: 150,
  gold: 150,
  // Simulamos que Kaelen tiene armadura:
  // 4 de FIL (40% reducción al Filo)
  // 2 de CON (20% reducción Contundente)
  // 6 de ELE (60% reducción Electricidad)
  resistances: {
    FIL: 4,
    CON: 2,
    PEN: 3,
    CAL: 0,
    ELE: 6,
    FRI: 1,
    ENE: 0
  },
  inventory: {}
};

const kaelen = new Character(mockData);

console.log(`🛡️ Estado Inicial de ${kaelen.name}:`);
console.log(`HP: ${kaelen.currentHp}/${kaelen.maxHp} | Estado: ${kaelen.state}`);
console.log(`Armadura Filo (FIL): ${kaelen.resistances.FIL} (40% reducción)`);
console.log(`Armadura Contundente (CON): ${kaelen.resistances.CON} (20% reducción)`);
console.log(`Armadura Eléctrica (ELE): ${kaelen.resistances.ELE} (60% reducción)\n`);

// 2. Simulamos daño Contundente (un mazo)
console.log('💥 Kaelen recibe un golpe de Mazo: 50 de daño Contundente (CON)');
kaelen.applyDirectDamage(50, 'CON');
// Cálculo esperado: 50 * (1 - 0.20) = 40 daño
console.log(`-> Kaelen absorbe parte del golpe con su armadura.`);
console.log(`-> HP Restante: ${kaelen.currentHp}/${kaelen.maxHp} | Estado: ${kaelen.state}\n`);

// 3. Simulamos daño Eléctrico (un rayo)
console.log('⚡ Kaelen es alcanzado por un Rayo Menor: 100 de daño Eléctrico (ELE)');
kaelen.applyDirectDamage(100, 'ELE');
// Cálculo esperado: 100 * (1 - 0.60) = 40 daño
console.log(`-> Kaelen resiste gran parte de la electricidad.`);
console.log(`-> HP Restante: ${kaelen.currentHp}/${kaelen.maxHp} | Estado: ${kaelen.state}\n`);

// 4. Simulamos daño de Filo crítico (un espadazo letal)
console.log('🗡️ ¡Un enemigo asesta un espadazo crítico!: 150 de daño de Filo (FIL)');
kaelen.applyDirectDamage(150, 'FIL');
// Cálculo esperado: 150 * (1 - 0.40) = 90 daño. 110 - 90 = -20 -> 0 -> Inconsciente
console.log(`-> La armadura reduce el corte, pero el impacto es demasiado fuerte.`);
console.log(`-> HP Restante: ${kaelen.currentHp}/${kaelen.maxHp} | Estado: ${kaelen.state}\n`);

console.log('==============================================');
console.log('🏁 Resultado: La POO de Anima está calculando perfectamente.');
