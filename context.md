# Contexto del Proyecto: Anima Beyond Fantasy - VTT

Este documento resume el estado actual del proyecto, la arquitectura utilizada y las funcionalidades implementadas hasta la fecha. Su objetivo es servir como contexto base para cualquier IA o desarrollador que se una al proyecto.

## 1. Stack Tecnológico

### Backend
- **Node.js** con **Express**.
- **Socket.IO** para comunicación en tiempo real (estado de combate, tiradas de dados, sincronización de personajes).
- **Prisma ORM** con una base de datos local **SQLite** para persistencia de datos.
- Arquitectura Modular separada en dominios:
  - `src/domain`: Lógica de entidades de negocio (e.g. `Character.ts`).
  - `src/engine`: Lógica pura y matemática del sistema de juego (calculadora de combate, maniobras, artes marciales).
  - `src/sockets`: Controladores de eventos de WebSocket (`events.ts`).
  - `src/repositories`: Abstracción de acceso a Prisma.

### Frontend
- **React** (empaquetado con **Vite**).
- **Zustand** para la gestión del estado global del cliente (`combatStore.ts`).
- **Tailwind CSS** para los estilos, con una fuerte estética *medieval* (fondos de madera oscura, acentos dorados/runas, componentes oscuros/rojos para combate).
- **shadcn/ui** (Radix UI) para modales, botones, inputs y tablas.
- **Lucide React** para los iconos.

---

## 2. Estado de Funcionalidades (Hasta la Fase 7)

El proyecto está diseñado para automatizar las complejas reglas de combate del sistema de rol *Anima Beyond Fantasy*. Hasta ahora se han completado 7 fases de desarrollo iterativo.

### Gestión de Personajes y NPCs
- **Personajes Jugadores (PCs):** Se persisten en la base de datos (Prisma). Poseen HP, Ki, Zeon, Oro, Resistencias (RM, RF, RP, RE, RV), Inventario (Armas, Armaduras) y Efectos Activos.
- **NPCs (Non-Player Characters):** Son efímeros (solo existen en memoria y en el estado de la campaña) y son generados por el Game Master.

### Motor de Resolución de Combate (`engine/combatResolution.ts`)
- **Cálculo de Daño Base:** Diferencia entre HA (Habilidad de Ataque) y HD (Habilidad de Defensa). 
- **Modificadores de Armadura (AT):** Absorción de daño basada en la tabla del manual (AT).
- **Tiradas Abiertas y Pifias:** Sistema automatizado de control de dados.
- **Críticos y Rotura:** Cálculo automático del nivel de crítico, la pérdida de extremidades y la rotura de armas cuando hay un impacto devastador o bloqueo excesivo.
- **Calculadora de Daño:** Interfaz dedicada para el Game Master que calcula instantáneamente los resultados de los choques y emite los cambios de estado (restar HP, aplicar estados) a todos los clientes.

### Subsistemas Avanzados (Fase 6 y 7)
- **Ki y Habilidades Marciales:** 
  - Gestión de Puntos de Ki y Fatiga.
  - Habilidades de Ki (Extrusión de Presencia, Uso de Energía, etc.) activables desde la vista del jugador.
- **Magia (Zeon):**
  - Sistema para canalizar (acumular) Zeon turno a turno para castear hechizos de alta complejidad.
- **Maniobras de Combate (`engine/maneuvers.ts`):**
  - Penalizadores automáticos por: *Ataque en Área*, *Desarme*, *Ataques Apuntados* a localizaciones específicas, y modificadores de *Cobertura* frente a proyectiles.
- **Actitudes y Artes Marciales:**
  - *Defensa Total:* Los personajes pueden declarar defensa total para recibir un bono de +30 a esquiva/parada durante ese asalto.
  - *Armas a Distancia:* Sistema de recarga de armas (ballestas, arcabuces) controlando el tiempo de bloqueo entre disparos.
  - *Estilos Marciales:* Los personajes pueden equipar múltiples artes marciales sumando bonos al ataque, defensa y daño base (con límites matemáticos regulados por el engine).

---

## 3. UI/UX Principal

1. **Player View (`PlayerView.tsx`):**
   - Vista móvil/responsiva donde el jugador ve a su personaje.
   - Pestañas para: *Stats (HP/Zeon/Ki)*, *Inventario*, *Combate* y *Ki/Magia*.
   - Lanzador de dados 3D integrado (o panel de tiradas).
   - Botones rápidos para declarar maniobras antes de que el GM calcule los daños, botones para recargar el arma, y panel para gestionar los estilos marciales.

2. **Game Master View (`GMView.tsx`):**
   - Panel de control masivo (Dashboard).
   - Tabla con la lista de todos los combatientes (Jugadores y NPCs) con acceso rápido a sus HP, Iniciativas, botones de efectos (Sangrado, Veneno, Shock), y alternadores de estado (Defensa Total).
   - Calculadora de Daño: Un modal interactivo donde el GM selecciona un Atacante, un Defensor, ingresa los resultados crudos de los dados, y el sistema cruza los datos de las hojas de personaje para devolver el daño y los estados resultantes.

---

## 4. Próximos Pasos (Pendiente Fase 8 en adelante)

El proyecto está por iniciar la **Fase 8**, que incluye:
- Implementación del Capítulo 14 (Reglas Avanzadas de Estados).
- Sistema de **Venenos y Toxinas** (Control de Resistencias y ticks de daño).
- Sistema de **Barreras de Daño** y Puntos Térmicos.
- Sistema de **Capas de Armadura** (Uso de ropa + armadura, sumando penalizadores naturales y modificando el tipo de movimiento).
- Posteriormente, la **Fase 9**, enfocada en la Hoja de Personaje 100% persistente, árbol de PD (Puntos de Desarrollo) y sistema de subida de nivel validado por reglas (límites de clase).
