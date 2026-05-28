import { rollD100, roll1d100 } from './dice';

describe('Core Dice Engine (Anima Beyond Fantasy)', () => {

  describe('Tiradas Normales', () => {
    it('debe sumar el modificador al resultado del dado si no es pifia ni abierta', () => {
      // Modificador 50, saca un 40
      const result = rollD100(50, {}, [40]);
      expect(result.total).toBe(90);
      expect(result.isOpenRoll).toBe(false);
      expect(result.isFumble).toBe(false);
      expect(result.rolls).toEqual([40]);
    });
  });

  describe('Tiradas de Pifia (Fumble)', () => {
    it('debe ser pifia si saca un 3 sin maestría', () => {
      // Modificador 50, saca 3 (pifia), luego saca 50 (nivel de pifia)
      const result = rollD100(50, { mastery: false }, [3, 50]);
      expect(result.isFumble).toBe(true);
      expect(result.isOpenRoll).toBe(false);
      expect(result.fumbleLevel).toBe(50);
      expect(result.total).toBe(0); // 50 - 50 = 0
      expect(result.rolls).toEqual([3, 50]);
    });

    it('no debe ser pifia si saca un 3 con maestría', () => {
      // Modificador 50, saca 3 con maestria (no es pifia)
      const result = rollD100(50, { mastery: true }, [3]);
      expect(result.isFumble).toBe(false);
      expect(result.total).toBe(53);
      expect(result.rolls).toEqual([3]);
    });

    it('debe ser pifia si saca un 2 con maestría', () => {
      // Modificador 50, saca 2 (pifia incluso con maestría), luego 40
      const result = rollD100(50, { mastery: true }, [2, 40]);
      expect(result.isFumble).toBe(true);
      expect(result.fumbleLevel).toBe(40);
      expect(result.total).toBe(10); // 50 - 40 = 10
      expect(result.rolls).toEqual([2, 40]);
    });
  });

  describe('Tiradas Abiertas (Open Rolls)', () => {
    it('debe ser tirada abierta al sacar 90', () => {
      // Saca 90 (abierta), luego saca 10 (no abierta, umbral ahora es 91)
      const result = rollD100(50, {}, [90, 10]);
      expect(result.isOpenRoll).toBe(true);
      expect(result.isFumble).toBe(false);
      // Total: 50 + 90 + 10 = 150
      expect(result.total).toBe(150);
      expect(result.rolls).toEqual([90, 10]);
    });

    it('debe acumular tiradas abiertas consecutivas (umbral incremental)', () => {
      // Saca 90 (abierta, prox umbral 91), luego 91 (abierta, prox 92), luego 92 (abierta, prox 93), luego 10
      const result = rollD100(10, {}, [90, 91, 92, 10]);
      expect(result.isOpenRoll).toBe(true);
      // Total: 10 + 90 + 91 + 92 + 10 = 293
      expect(result.total).toBe(293);
      expect(result.rolls).toEqual([90, 91, 92, 10]);
    });

    it('no debe abrir si la segunda tirada no llega al nuevo umbral', () => {
      // Saca 90 (abierta, prox 91), luego 90 (falla el umbral de 91)
      const result = rollD100(0, {}, [90, 90]);
      expect(result.isOpenRoll).toBe(true);
      // Total: 0 + 90 + 90 = 180
      expect(result.total).toBe(180);
      expect(result.rolls).toEqual([90, 90]);
    });

    it('siempre debe abrir si se saca un 100, independientemente del umbral', () => {
      // Saca 90 (prox 91), luego 100 (abierta porque 100 siempre es abierta, prox 92), luego 5
      const result = rollD100(0, {}, [90, 100, 5]);
      expect(result.isOpenRoll).toBe(true);
      // Total: 90 + 100 + 5 = 195
      expect(result.total).toBe(195);
      expect(result.rolls).toEqual([90, 100, 5]);
    });
  });

  describe('Utilidad de Aleatoriedad Pura', () => {
    it('roll1d100 debe devolver un número entre 1 y 100', () => {
      const result = roll1d100();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('rollD100 sin mockRolls debe funcionar por defecto', () => {
      const result = rollD100(10);
      expect(result.rolls.length).toBeGreaterThanOrEqual(1);
      expect(result.total).not.toBeNaN();
    });
  });
});
