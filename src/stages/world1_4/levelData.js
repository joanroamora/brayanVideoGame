/**
 * World 1-4: "Asedio en Piamonte: El Vuelo del Helicóptero" (Bosa Piamonte, Bogotá).
 * Phase 1 (x = 0..5800): Side-scrolling siege down Avenida de Piamonte with helicopter fire,
 * destructible blocks, safe commercial roofs, and Molotov-throwing capuchos.
 * Phase 2 (x = 5800..6760): Locked 960px microfútbol court Boss Arena!
 */
export const WORLD_1_4_CONFIG = {
  groundY: 456,
  arenaX: 5800,
  arenaW: 960,
  levelLen: 6760,
  bgStreetKey: 'bg_bosa_piamonte',
  bgArenaKey: 'bg_cancha'
};

export function createWorld1_4Entities(hard) {
  const G = WORLD_1_4_CONFIG.groundY;
  const spdMult = hard ? 1.32 : 1.0;

  // Phase 1 Platforms:
  // 'shelter' = reinforced commercial shop roofs (block helicopter fire so Brayan can take cover!)
  // 'breakable' = temporary construction/polisombra blocks DESTROYED by helicopter projectiles!
  // 'stall' = street vendor stalls | 'alimentador' = stranded feeder buses | 'bicitaxi' | 'dumpster'
  const platforms = [
    // Sector 1: Avenida Entrada (340 - 1520)
    { x: 360, y: 318, w: 175, h: 24, style: 'shelter', label: 'EMPANADAS', alive: true },
    { x: 620, y: 374, w: 118, h: 24, style: 'bicitaxi', alive: true },
    { x: 810, y: 325, w: 96, h: 24, style: 'breakable', alive: true },
    { x: 960, y: 368, w: 120, h: 24, style: 'stall', alive: true },
    { x: 1160, y: 306, w: 185, h: 26, style: 'alimentador', label: '10-3', alive: true },
    { x: 1410, y: 318, w: 170, h: 24, style: 'shelter', label: 'ARROZ CHINO', alive: true },

    // Sector 2: Zona Comercial & Polisombras (1680 - 3050)
    { x: 1710, y: 376, w: 100, h: 26, style: 'dumpster', alive: true },
    { x: 1890, y: 320, w: 98, h: 24, style: 'breakable', alive: true },
    { x: 2050, y: 365, w: 130, h: 24, style: 'stall', alive: true },
    { x: 2260, y: 316, w: 185, h: 24, style: 'shelter', label: 'DROGUERÍA', alive: true },
    { x: 2540, y: 372, w: 122, h: 24, style: 'bicitaxi', alive: true },
    { x: 2740, y: 310, w: 102, h: 24, style: 'breakable', alive: true },
    { x: 2910, y: 304, w: 190, h: 26, style: 'alimentador', label: '10-5', alive: true },

    // Sector 3: Parque del Barrio & Obras (3220 - 4550)
    { x: 3240, y: 318, w: 175, h: 24, style: 'shelter', label: 'FOTOS / LAB', alive: true },
    { x: 3500, y: 376, w: 104, h: 26, style: 'dumpster', alive: true },
    { x: 3680, y: 318, w: 100, h: 24, style: 'breakable', alive: true },
    { x: 3860, y: 368, w: 132, h: 24, style: 'stall', alive: true },
    { x: 4070, y: 314, w: 180, h: 24, style: 'shelter', label: 'PANADERÍA', alive: true },
    { x: 4340, y: 372, w: 124, h: 24, style: 'bicitaxi', alive: true },

    // Sector 4: Acceso a la Cancha de Microfútbol (4600 - 5640)
    { x: 4610, y: 316, w: 100, h: 24, style: 'breakable', alive: true },
    { x: 4780, y: 304, w: 190, h: 26, style: 'alimentador', label: '10-2', alive: true },
    { x: 5050, y: 376, w: 106, h: 26, style: 'dumpster', alive: true },
    { x: 5230, y: 318, w: 185, h: 24, style: 'shelter', label: 'TIENDA SUR', alive: true },
    { x: 5500, y: 368, w: 120, h: 24, style: 'stall', alive: true }
  ];

  // Ground Enemies: Los Capuchos (patrol corners & hurl parabolic Molotov cocktails)
  const makeCapucho = (x, minX, maxX) => ({
    x,
    y: G - 96,
    w: 48,
    h: 96,
    minX,
    maxX,
    vx: -74 * spdMult,
    facing: -1,
    cd: (hard ? 1.55 : 2.35) + Math.random() * 0.6,
    throwAnim: 0,
    animT: Math.random() * 3,
    alive: true
  });

  const capuchos = [
    makeCapucho(760, 620, 940),
    makeCapucho(1320, 1140, 1480),
    makeCapucho(1960, 1780, 2140),
    makeCapucho(2640, 2460, 2820),
    makeCapucho(3160, 3000, 3320),
    makeCapucho(3780, 3600, 3960),
    makeCapucho(4460, 4280, 4620),
    makeCapucho(5120, 4960, 5280),
    makeCapucho(5600, 5440, 5740)
  ];

  if (hard) {
    capuchos.push(
      makeCapucho(1620, 1500, 1760),
      makeCapucho(2420, 2280, 2560),
      makeCapucho(4200, 4050, 4340),
      makeCapucho(5400, 5260, 5540)
    );
  }

  // Healing & Score Pickups (Empanadas & Tintos along shelters and stalls)
  const items = [
    { type: 'cv', x: 445, y: 274, got: false },
    { type: 'empanada', x: 1250, y: 262, got: false },
    { type: 'cv', x: 2110, y: 320, got: false },
    { type: 'empanada', x: 2995, y: 260, got: false },
    { type: 'cv', x: 3925, y: 324, got: false },
    { type: 'empanada', x: 4870, y: 260, got: false },
    { type: 'empanada', x: 5640, y: 416, got: false } // Pre-boss heal right before entering the Cancha!
  ];

  return { platforms, capuchos, items };
}
