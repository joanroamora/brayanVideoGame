/**
 * World 2-2: "A la Caza del Papel — Estampida de Lagartos" (Oficinas Públicas, Bogotá).
 * After passing the chairo copy clerk's ideological quiz, Brayan discovers the copier is
 * out of paper! He must cross the office floors collecting paper sheets while dodging
 * high-speed stampeding office "Lagartos" rushing to the union assembly negotiating a
 * 25% monthly bonus ("Prima del 25% mensual") for backing supreme leader Petro!
 */
export const WORLD_2_2_CONFIG = {
  groundY: 456,
  levelLen: 7600,
  goalX: 7260,
  bgKey: 'bg_office_2_2',
  requiredPapersLight: 10,
  requiredPapersHeavy: 12
};

export function createWorld2_2Entities(hard) {
  const G = WORLD_2_2_CONFIG.groundY;
  const spdMult = hard ? 1.28 : 1.0;

  // Office platforms: essential refuge above high-speed Lagarto stampedes!
  // Styles: 'desk' | 'cabinet' | 'conference' | 'cubicle' | 'watercooler'
  const platforms = [
    // Sector 1: Recepción de Talento Humano (360 - 1880)
    { x: 360, y: 366, w: 155, h: 24, style: 'desk', label: 'NÓMINA' },
    { x: 610, y: 294, w: 180, h: 24, style: 'cabinet', label: 'ARCHIVO 1' },
    { x: 890, y: 226, w: 175, h: 22, style: 'conference', label: 'SINDICATO' },
    { x: 1160, y: 360, w: 165, h: 24, style: 'desk', label: 'CONTRATOS' },
    { x: 1430, y: 288, w: 185, h: 24, style: 'cubicle', label: 'PRIMA +25%' },
    { x: 1710, y: 356, w: 145, h: 24, style: 'watercooler', label: 'AGUA' },

    // Sector 2: Corredor de Asesores & Reunión Sindical (2160 - 4060)
    { x: 2180, y: 362, w: 160, h: 24, style: 'desk', label: 'TESORERÍA' },
    { x: 2660, y: 296, w: 185, h: 24, style: 'cabinet', label: 'ACTAS' },
    { x: 2940, y: 224, w: 225, h: 22, style: 'conference', label: 'ASAMBLEA' },
    { x: 3260, y: 296, w: 180, h: 24, style: 'cubicle', label: 'CUOTAS' },
    { x: 3540, y: 362, w: 155, h: 24, style: 'desk', label: 'VIÁTICOS' },
    { x: 3790, y: 286, w: 195, h: 24, style: 'cabinet', label: 'ARCHIVO 2' },

    // Sector 3: Ala de Lagartos Express (4340 - 5880)
    { x: 4360, y: 360, w: 165, h: 24, style: 'cubicle', label: 'JURÍDICA' },
    { x: 4620, y: 288, w: 190, h: 24, style: 'conference', label: 'PLIEGO 25%' },
    { x: 5280, y: 356, w: 160, h: 24, style: 'desk', label: 'PRESUPUESTO' },
    { x: 5540, y: 284, w: 195, h: 24, style: 'cabinet', label: 'RESMAS' },
    { x: 5830, y: 224, w: 185, h: 22, style: 'conference', label: 'QUÓRUM' },

    // Sector 4: Recta Final — Vuelta a la Fotocopiadora (6180 - 7140)
    { x: 6200, y: 360, w: 165, h: 24, style: 'desk', label: 'ALMACÉN' },
    { x: 6470, y: 290, w: 190, h: 24, style: 'cubicle', label: 'PAPELERÍA' },
    { x: 6760, y: 226, w: 205, h: 22, style: 'conference', label: 'SINDICATO' },
    { x: 7020, y: 344, w: 155, h: 24, style: 'cabinet', label: 'COPIAS' }
  ];

  // Enemy factory helpers: Speedy Office "Lagartos" rushing to the union meeting!
  // Types: 'runner' | 'sindical' | 'hopper'
  const makeRunner = (x, floorY, minX, maxX, dir = -1) => ({
    type: 'runner',
    x,
    y: floorY - 96,
    floorY,
    w: 54,
    h: 96,
    minX,
    maxX,
    vx: dir * 230 * spdMult,
    vy: 0,
    facing: dir,
    state: 'sprint', // 'sprint' | 'boost'
    stateT: 0,
    cd: (hard ? 1.1 : 1.75) + Math.random() * 0.6,
    animT: Math.random() * 4,
    shoutIdx: Math.floor(Math.random() * 4),
    fromStampede: false,
    alive: true
  });

  const makeSindical = (x, floorY, minX, maxX, dir = -1) => ({
    type: 'sindical',
    x,
    y: floorY - 104,
    floorY,
    w: 58,
    h: 104,
    minX,
    maxX,
    vx: dir * 155 * spdMult,
    vy: 0,
    facing: dir,
    state: 'march', // 'march' | 'chant' | 'rush'
    stateT: 0,
    cd: (hard ? 1.35 : 2.15) + Math.random() * 0.5,
    animT: Math.random() * 4,
    shoutIdx: Math.floor(Math.random() * 4),
    fromStampede: false,
    alive: true
  });

  const makeHopper = (x, floorY, minX, maxX, dir = -1) => ({
    type: 'hopper',
    x,
    y: floorY - 94,
    floorY,
    w: 52,
    h: 94,
    minX,
    maxX,
    vx: dir * 205 * spdMult,
    vy: 0,
    facing: dir,
    state: 'run',
    hopCd: (hard ? 0.65 : 1.05) + Math.random() * 0.5,
    animT: Math.random() * 4,
    shoutIdx: Math.floor(Math.random() * 4),
    fromStampede: false,
    alive: true
  });

  const enemies = [
    // Sector 1
    makeRunner(820, G, 520, 1180, -1),
    makeSindical(1260, G, 1020, 1620, -1),
    makeHopper(1510, 288, 1435, 1605, -1),
    makeRunner(1920, G, 1620, 2240, -1),

    // Sector 2
    makeHopper(2780, G, 2520, 3160, -1),
    makeSindical(3020, 224, 2945, 3150, -1),
    makeRunner(3380, G, 3040, 3760, -1),
    makeSindical(3890, G, 3560, 4240, -1),

    // Sector 3
    makeRunner(4540, G, 4260, 4920, -1),
    makeHopper(4710, 288, 4625, 4800, -1),
    makeSindical(5420, G, 5140, 5820, -1),
    makeHopper(5760, G, 5420, 6100, -1),

    // Sector 4
    makeRunner(6360, G, 6080, 6760, -1),
    makeSindical(6680, G, 6340, 7040, -1),
    makeHopper(6840, 226, 6765, 6950, -1),
    makeRunner(7060, G, 6740, 7200, -1)
  ];

  if (hard) {
    enemies.push(
      makeHopper(1100, G, 820, 1460, 1),
      makeRunner(2960, G, 2600, 3420, 1),
      makeHopper(3720, G, 3380, 4120, 1),
      makeRunner(4880, G, 4520, 5240, 1),
      makeSindical(5980, G, 5620, 6360, -1),
      makeHopper(6940, G, 6580, 7180, 1)
    );
  }

  // Allied NPC: Doña Martha de los Tintos in 2 safe break alcoves!
  const tintoLadies = [
    { x: 2400, y: G - 118, given: false, smileT: 0, bubbleT: 0 },
    { x: 4980, y: G - 118, given: false, smileT: 0, bubbleT: 0 }
  ];

  // Collectibles:
  // 'paper' = Hoja de Papel Bond (+1 sheet toward goal!)
  // 'ream'  = Paquete / Resma Dorada (+2 sheets & +300 pts!)
  // 'tinto' = Hot office coffee (+1 ♥ or +250 pts)
  // Total available sheet value: 20 sheets (easily enough for 10 Light / 12 Heavy!)
  const items = [
    { type: 'paper', x: 435, y: 322, got: false },
    { type: 'paper', x: 700, y: 250, got: false },
    { type: 'ream', x: 975, y: 180, got: false },
    { type: 'paper', x: 1240, y: 316, got: false },
    { type: 'paper', x: 1520, y: 244, got: false },
    { type: 'tinto', x: 1780, y: 312, got: false },

    { type: 'paper', x: 2260, y: 318, got: false },
    { type: 'paper', x: 2750, y: 252, got: false },
    { type: 'ream', x: 3050, y: 178, got: false },
    { type: 'paper', x: 3350, y: 252, got: false },
    { type: 'paper', x: 3615, y: 318, got: false },
    { type: 'tinto', x: 3885, y: 242, got: false },

    { type: 'paper', x: 4440, y: 316, got: false },
    { type: 'ream', x: 4715, y: 242, got: false },
    { type: 'paper', x: 5360, y: 312, got: false },
    { type: 'paper', x: 5635, y: 240, got: false },
    { type: 'paper', x: 5920, y: 180, got: false },

    { type: 'paper', x: 6280, y: 316, got: false },
    { type: 'paper', x: 6565, y: 246, got: false },
    { type: 'ream', x: 6860, y: 180, got: false },
    { type: 'tinto', x: 7095, y: 300, got: false }
  ];

  return { platforms, enemies, tintoLadies, items };
}
