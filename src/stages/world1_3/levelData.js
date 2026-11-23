/**
 * World 1-3: Portal Sur (Bogotá) — Extensive Vertical Platforming Blueprint (8000px).
 * Features Mario-style vertical routes across alimentador roofs, booths, turnstiles,
 * and steel pedestrian overpasses, with El Jefe del Fruver, 3 Colado variants, and
 * TransMilenio street singers.
 */
export const WORLD_1_3_CONFIG = {
  groundY: 456,
  levelLen: 8000,
  goalX: 7720,
  bgKey: 'bg_portal_sur'
};

export function createWorld1_3Entities(hard) {
  const G = WORLD_1_3_CONFIG.groundY;
  const spdMult = hard ? 1.38 : 1.0;

  // Dynamic passing Red Articulated TransMilenio & Green Alimentadores in background busway
  const bgBuses = [
    { type: 'transmi', route: 'B14', x: 350, speed: 128 },
    { type: 'alimentador', route: '10-4', x: 1450, speed: -110 },
    { type: 'transmi', route: 'G45', x: 2900, speed: 140 },
    { type: 'alimentador', route: '10-1', x: 4300, speed: 105 },
    { type: 'transmi', route: 'H15', x: 5600, speed: -135 },
    { type: 'alimentador', route: '10-6', x: 6900, speed: 118 }
  ];

  // Multi-tier vertical Mario-style platforms across 8000px
  // Styles: 'alimentador' | 'troncal' | 'turnstile' | 'booth' | 'overpass'
  const platforms = [
    // Zone 1: Terminal Entry & Alimentadores (350 - 1950)
    { x: 390, y: 368, w: 135, h: 22, style: 'turnstile' },
    { x: 620, y: 300, w: 175, h: 24, style: 'alimentador', label: '10-4' },
    { x: 890, y: 228, w: 165, h: 20, style: 'overpass' },
    { x: 1170, y: 358, w: 155, h: 24, style: 'booth' },
    { x: 1430, y: 288, w: 185, h: 24, style: 'troncal', label: 'B14' },
    { x: 1710, y: 362, w: 140, h: 22, style: 'turnstile' },

    // Zone 2: Puente Peatonal & Torniquetes (2200 - 4180)
    { x: 2260, y: 362, w: 150, h: 24, style: 'booth' },
    { x: 2510, y: 292, w: 180, h: 24, style: 'alimentador', label: '10-1' },
    { x: 2790, y: 222, w: 220, h: 20, style: 'overpass' },
    { x: 3110, y: 295, w: 170, h: 24, style: 'troncal', label: 'G45' },
    { x: 3390, y: 364, w: 145, h: 22, style: 'turnstile' },
    { x: 3630, y: 290, w: 195, h: 24, style: 'alimentador', label: '10-6' },
    { x: 3920, y: 224, w: 190, h: 20, style: 'overpass' },

    // Zone 3: Plataforma Central & Caseta Elevada (4520 - 6220)
    { x: 4580, y: 360, w: 160, h: 24, style: 'booth' },
    { x: 4840, y: 292, w: 190, h: 24, style: 'troncal', label: 'H15' },
    { x: 5130, y: 220, w: 215, h: 20, style: 'overpass' },
    { x: 5450, y: 358, w: 155, h: 22, style: 'turnstile' },
    { x: 5700, y: 288, w: 185, h: 24, style: 'alimentador', label: '10-4' },
    { x: 5980, y: 224, w: 175, h: 20, style: 'overpass' },

    // Zone 4: Recta Final — Autopista Sur Gauntlet (6560 - 7580)
    { x: 6600, y: 362, w: 155, h: 24, style: 'booth' },
    { x: 6850, y: 292, w: 185, h: 24, style: 'alimentador', label: '10-1' },
    { x: 7130, y: 226, w: 205, h: 20, style: 'overpass' },
    { x: 7420, y: 345, w: 160, h: 24, style: 'troncal', label: 'B14' }
  ];

  // Visual Turnstile / Barrier Gates where Colados vault over into the lane!
  const turnstiles = [
    { x: 1050, y: G - 54 },
    { x: 1840, y: G - 54 },
    { x: 2680, y: G - 54 },
    { x: 3530, y: G - 54 },
    { x: 4720, y: G - 54 },
    { x: 5580, y: G - 54 },
    { x: 6760, y: G - 54 },
    { x: 7340, y: G - 54 }
  ];

  // Helper constructors
  const makeFruver = (x, floorY, minX, maxX, dir = -1) => ({
    type: 'fruver',
    x,
    y: floorY - 102,
    floorY,
    w: 54,
    h: 102,
    minX,
    maxX,
    vx: dir * 92 * spdMult,
    facing: dir,
    state: 'walk', // 'walk' | 'windup' | 'whip' | 'recover'
    stateT: 0,
    cd: hard ? 0.65 : 1.15,
    animT: Math.random() * 4,
    shoutIdx: Math.floor(Math.random() * 3),
    whipSparkSpawned: false,
    alive: true
  });

  const makeColado = (variant, gateX, delay = 0) => ({
    type: 'colado',
    variant, // 1 | 2 | 3
    gateX,
    x: gateX + 26,
    y: G - 94,
    w: 48,
    h: 94,
    vx: 0,
    vy: 0,
    facing: -1,
    state: 'lurk', // 'lurk' | 'vault' | 'sprint'
    stateT: delay,
    vaultT: 0,
    vaultStartX: gateX + 26,
    animT: Math.random() * 4,
    hopCd: 0.7 + Math.random() * 0.7,
    alive: true
  });

  const enemies = [
    // Zone 1
    makeFruver(780, G, 580, 1020, -1),
    makeColado(1, 1050, 0),
    makeFruver(1510, 288, 1435, 1595, -1), // Patrols on top of TransMi roof!
    makeColado(2, 1840, 0),

    // Zone 2
    makeFruver(2430, G, 2240, 2660, -1),
    makeColado(3, 2680, 0),
    makeFruver(2870, 222, 2795, 2985, -1), // Patrols high overpass!
    makeFruver(3280, G, 3080, 3500, 1),
    makeColado(1, 3530, 0),
    makeFruver(3990, G, 3760, 4220, -1),

    // Zone 3
    makeColado(2, 4720, 0),
    makeFruver(4920, 292, 4845, 5005, -1),
    makeFruver(5280, G, 5050, 5530, -1),
    makeColado(3, 5580, 0),
    makeFruver(5960, G, 5740, 6220, -1),

    // Zone 4 (Final Portal Sur Gauntlet)
    makeColado(2, 6760, 0),
    makeFruver(6980, G, 6790, 7250, -1),
    makeFruver(7210, 226, 7135, 7315, -1),
    makeColado(1, 7340, 0),
    makeFruver(7520, G, 7340, 7660, -1)
  ];

  // Modo Pesado: pairs of Fruver bosses in tight spots + packs of sprinting Colados!
  if (hard) {
    enemies.push(
      makeColado(3, 1050, 0.38),
      makeColado(1, 1840, 0.35),
      makeFruver(2590, G, 2320, 2660, 1),
      makeColado(2, 2680, 0.34),
      makeColado(3, 3530, 0.32),
      makeFruver(5420, G, 5120, 5550, 1),
      makeColado(1, 5580, 0.30),
      makeColado(3, 6760, 0.30),
      makeColado(2, 7340, 0.28),
      makeFruver(7430, G, 7300, 7640, 1)
    );
  }

  // Allied Bonus NPCs: Cantante Callejero de TransMilenio con Parlante LED
  const singers = [
    { x: 2020, y: G - 118, given: false, grooveT: 0, bubbleT: 0, coinArcT: 0 },
    { x: 4320, y: G - 118, given: false, grooveT: 0, bubbleT: 0, coinArcT: 0 },
    { x: 6360, y: G - 118, given: false, grooveT: 0, bubbleT: 0, coinArcT: 0 }
  ];

  // Collectibles: Hojas de Vida ('cv'), Tintos ('tinto'), Golden TuLlave Cards ('token')
  const items = [
    { type: 'cv', x: 455, y: 325, got: false },
    { type: 'cv', x: 705, y: 255, got: false },
    { type: 'token', x: 970, y: 182, got: false },
    { type: 'cv', x: 1245, y: 315, got: false },
    { type: 'tinto', x: 1520, y: 242, got: false },
    { type: 'cv', x: 1780, y: 318, got: false },

    { type: 'cv', x: 2335, y: 318, got: false },
    { type: 'cv', x: 2600, y: 248, got: false },
    { type: 'token', x: 2900, y: 176, got: false },
    { type: 'cv', x: 3195, y: 250, got: false },
    { type: 'tinto', x: 3725, y: 244, got: false },
    { type: 'token', x: 4015, y: 178, got: false },

    { type: 'cv', x: 4660, y: 315, got: false },
    { type: 'cv', x: 4935, y: 246, got: false },
    { type: 'token', x: 5235, y: 174, got: false },
    { type: 'cv', x: 5525, y: 312, got: false },
    { type: 'tinto', x: 5790, y: 242, got: false },
    { type: 'token', x: 6065, y: 178, got: false },

    { type: 'cv', x: 6675, y: 316, got: false },
    { type: 'cv', x: 6940, y: 246, got: false },
    { type: 'token', x: 7230, y: 180, got: false },
    { type: 'cv', x: 7500, y: 300, got: false }
  ];

  return { bgBuses, platforms, turnstiles, enemies, singers, items };
}
