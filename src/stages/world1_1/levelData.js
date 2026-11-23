/**
 * World 1-1: Carrera 7ª (Bogotá) — Level Blueprint & Entity Spawners.
 * Pure data definitions so future worlds (1-2, 1-3, etc.) can replicate this exact structure.
 */
export const WORLD_1_1_CONFIG = {
  groundY: 456,
  levelLen: 6400,
  goalX: 6160,
  bgKey: 'bg_septima'
};

export function createWorld1_1Entities(hard) {
  const G = WORLD_1_1_CONFIG.groundY;
  const spdMult = hard ? 1.32 : 1.0;
  const cdMult = hard ? 0.68 : 1.0;

  const platforms = [
    { x: 430, y: 365, w: 125, h: 20, style: 'awning' },
    { x: 690, y: 310, w: 145, h: 22, style: 'sitp' },
    { x: 1080, y: 365, w: 110, h: 20, style: 'crate' },
    { x: 1320, y: 300, w: 150, h: 22, style: 'balcony' },
    { x: 1740, y: 360, w: 130, h: 20, style: 'awning' },
    { x: 2020, y: 295, w: 155, h: 22, style: 'sitp' },
    { x: 2450, y: 365, w: 120, h: 20, style: 'crate' },
    { x: 2740, y: 305, w: 150, h: 22, style: 'balcony' },
    { x: 3180, y: 360, w: 130, h: 20, style: 'awning' },
    { x: 3500, y: 290, w: 160, h: 22, style: 'sitp' },
    { x: 3920, y: 365, w: 125, h: 20, style: 'crate' },
    { x: 4220, y: 300, w: 165, h: 22, style: 'balcony' },
    { x: 4650, y: 355, w: 135, h: 20, style: 'awning' },
    { x: 4980, y: 295, w: 160, h: 22, style: 'sitp' },
    { x: 5400, y: 360, w: 125, h: 20, style: 'crate' },
    { x: 5680, y: 305, w: 150, h: 22, style: 'balcony' }
  ];

  const enemies = [
    // Zone 1 (0 - 1850)
    { type: 'cartelera', x: 760, y: G - 98, w: 48, h: 98, minX: 600, maxX: 980, vx: -78 * spdMult, facing: -1, cd: 1.5 * cdMult, motif: 0, state: 'walk', stateT: 0, animT: 0, alive: true },
    { type: 'grafitera', x: 1280, y: G - 96, w: 48, h: 96, minX: 1120, maxX: 1480, vx: 65 * spdMult, facing: 1, cd: 2.0, state: 'walk', stateT: 0, animT: 0, alive: true },
    { type: 'nero', x: 1620, y: G - 98, w: 48, h: 98, minX: 1450, maxX: 1850, vx: -95 * spdMult, facing: -1, cd: 0, state: 'walk', stateT: 0, animT: 0, alive: true },

    // Zone 2 (1950 - 3300)
    { type: 'cartelera', x: 2220, y: G - 98, w: 48, h: 98, minX: 2000, maxX: 2440, vx: -84 * spdMult, facing: -1, cd: 1.4 * cdMult, motif: 1, state: 'walk', stateT: 0, animT: 0, alive: true },
    { type: 'nero', x: 2660, y: G - 98, w: 48, h: 98, minX: 2480, maxX: 2900, vx: -102 * spdMult, facing: -1, cd: 0, state: 'walk', stateT: 0, animT: 0, alive: true },
    { type: 'grafitera', x: 3060, y: G - 96, w: 48, h: 96, minX: 2900, maxX: 3280, vx: 68 * spdMult, facing: 1, cd: 1.8, state: 'walk', stateT: 0, animT: 0, alive: true },

    // Zone 3 (3400 - 4780)
    { type: 'cartelera', x: 3680, y: G - 98, w: 48, h: 98, minX: 3440, maxX: 3900, vx: -90 * spdMult, facing: -1, cd: 1.3 * cdMult, motif: 2, state: 'walk', stateT: 0, animT: 0, alive: true },
    { type: 'nero', x: 4100, y: G - 98, w: 48, h: 98, minX: 3920, maxX: 4360, vx: -108 * spdMult, facing: -1, cd: 0, state: 'walk', stateT: 0, animT: 0, alive: true },
    { type: 'grafitera', x: 4540, y: G - 96, w: 48, h: 96, minX: 4380, maxX: 4760, vx: -70 * spdMult, facing: -1, cd: 1.6, state: 'walk', stateT: 0, animT: 0, alive: true },

    // Zone 4 (4850 - 6040)
    { type: 'nero', x: 5060, y: G - 98, w: 48, h: 98, minX: 4860, maxX: 5280, vx: -115 * spdMult, facing: -1, cd: 0, state: 'walk', stateT: 0, animT: 0, alive: true },
    { type: 'cartelera', x: 5480, y: G - 98, w: 48, h: 98, minX: 5260, maxX: 5700, vx: -94 * spdMult, facing: -1, cd: 1.2 * cdMult, motif: 3, state: 'walk', stateT: 0, animT: 0, alive: true },
    { type: 'nero', x: 5860, y: G - 98, w: 48, h: 98, minX: 5680, maxX: 6040, vx: -118 * spdMult, facing: -1, cd: 0, state: 'walk', stateT: 0, animT: 0, alive: true }
  ];

  if (hard) {
    enemies.push(
      { type: 'cartelera', x: 2880, y: G - 98, w: 48, h: 98, minX: 2700, maxX: 3080, vx: -98, facing: -1, cd: 0.95, motif: 3, state: 'walk', stateT: 0, animT: 0, alive: true },
      { type: 'nero', x: 4780, y: G - 98, w: 48, h: 98, minX: 4600, maxX: 4960, vx: -125, facing: -1, cd: 0, state: 'walk', stateT: 0, animT: 0, alive: true }
    );
  }

  const chazas = [
    { x: 1900, y: G - 110, given: false, smileT: 0, bubbleT: 0 },
    { x: 3360, y: G - 110, given: false, smileT: 0, bubbleT: 0 },
    { x: 4840, y: G - 110, given: false, smileT: 0, bubbleT: 0 }
  ];

  const items = [
    { type: 'cv', x: 480, y: 320, got: false },
    { type: 'cv', x: 750, y: 265, got: false },
    { type: 'cv', x: 1125, y: 320, got: false },
    { type: 'tinto', x: 1385, y: 255, got: false },
    { type: 'cv', x: 1795, y: 315, got: false },
    { type: 'cv', x: 2085, y: 250, got: false },
    { type: 'cv', x: 2500, y: 320, got: false },
    { type: 'cv', x: 2805, y: 260, got: false },
    { type: 'cv', x: 3235, y: 315, got: false },
    { type: 'tinto', x: 3570, y: 245, got: false },
    { type: 'cv', x: 3970, y: 320, got: false },
    { type: 'cv', x: 4290, y: 255, got: false },
    { type: 'cv', x: 4705, y: 310, got: false },
    { type: 'cv', x: 5050, y: 250, got: false },
    { type: 'tinto', x: 5450, y: 315, got: false },
    { type: 'cv', x: 5745, y: 260, got: false }
  ];

  const bgCars = [
    { type: 'transmi', x: 500, speed: 95 },
    { type: 'taxi', x: 1400, speed: -145 },
    { type: 'taxi', x: 3100, speed: 120 },
    { type: 'transmi', x: 4700, speed: -88 }
  ];

  return { platforms, enemies, chazas, items, bgCars };
}
