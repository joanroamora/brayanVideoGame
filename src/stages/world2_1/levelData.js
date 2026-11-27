/**
 * World 2-1: "Pasillos del Edificio — La Fotocopiadora" (Bogotá).
 * Brayan's first mission from Majo Piza Romero: cross the chaotic public-office
 * corridors swarming with histrionic political YouTubers & "bodegueros" to reach
 * the Photocopier and duplicate his resume!
 *
 * Enemy cast (5 histrionic archetypes):
 *   - 'levy'     : Furious swearing YouTuber launching censored-curse shockwaves & toxic sludge
 *   - 'wally'    : Chubby whale-allusion YouTuber firing 3-way whale-spout clickbait & belly-lunges
 *   - 'lalis'    : Ring-light selfie-stick influencer unleashing blinding camera flash cones & funa orbs
 *   - 'camara'   : Frantic DSLR paparazzi bodeguero sprinting and firing rapid flash + viral mud shots
 *   - 'streamer' : Sensationalist red-hoodie clickbait streamer lobbing arcing toxic splat bombs (leave puddles)
 */
export const WORLD_2_1_CONFIG = {
  groundY: 456,
  levelLen: 7800,
  goalX: 7460,
  bgKey: 'bg_office_corridor'
};

export function createWorld2_1Entities(hard) {
  const G = WORLD_2_1_CONFIG.groundY;
  const spdMult = hard ? 1.34 : 1.0;

  // Indoor office platforms (Mario-style vertical routes across the building!)
  // Styles: 'desk' | 'cubicle' | 'lighting' | 'sofa' | 'printer'
  const platforms = [
    // Sector 1: Recepción y Pasillo de Prensa (380 - 1960)
    { x: 390, y: 368, w: 145, h: 24, style: 'sofa' },
    { x: 630, y: 300, w: 175, h: 24, style: 'desk', label: 'PRENSA' },
    { x: 900, y: 228, w: 170, h: 20, style: 'lighting', label: 'ARO LED' },
    { x: 1170, y: 356, w: 155, h: 24, style: 'cubicle', label: 'ARCHIVO' },
    { x: 1430, y: 290, w: 185, h: 24, style: 'desk', label: 'ESTUDIO 1' },
    { x: 1710, y: 362, w: 145, h: 24, style: 'printer', label: 'PAPELERÍA' },

    // Sector 2: Ala de Cubículos y Estudios Improvisados (2280 - 4120)
    { x: 2290, y: 364, w: 150, h: 24, style: 'sofa' },
    { x: 2540, y: 292, w: 185, h: 24, style: 'cubicle', label: 'BODEGA A' },
    { x: 2820, y: 222, w: 220, h: 20, style: 'lighting', label: 'LIVE 99K' },
    { x: 3140, y: 294, w: 175, h: 24, style: 'desk', label: 'PODCAST' },
    { x: 3420, y: 362, w: 145, h: 24, style: 'printer', label: 'TÓNER' },
    { x: 3660, y: 288, w: 190, h: 24, style: 'cubicle', label: 'BODEGA B' },
    { x: 3940, y: 224, w: 180, h: 20, style: 'lighting', label: 'SET TV' },

    // Sector 3: Galería de Bodegas "En Vivo" (4440 - 5940)
    { x: 4460, y: 360, w: 155, h: 24, style: 'desk', label: 'REDES' },
    { x: 4720, y: 290, w: 190, h: 24, style: 'cubicle', label: 'TRENDING' },
    { x: 5010, y: 220, w: 215, h: 20, style: 'lighting', label: 'EN VIVO' },
    { x: 5330, y: 358, w: 155, h: 24, style: 'sofa' },
    { x: 5580, y: 288, w: 185, h: 24, style: 'desk', label: 'PAUTA' },
    { x: 5850, y: 226, w: 170, h: 20, style: 'lighting', label: 'CLICS' },

    // Sector 4: Recta Final — Centro de Fotocopiado (6260 - 7340)
    { x: 6280, y: 362, w: 155, h: 24, style: 'printer', label: 'RESMAS' },
    { x: 6530, y: 290, w: 185, h: 24, style: 'cubicle', label: 'SELLO' },
    { x: 6810, y: 224, w: 210, h: 20, style: 'lighting', label: 'VIRAL' },
    { x: 7110, y: 342, w: 165, h: 24, style: 'desk', label: 'COPIAS' }
  ];

  // Enemy factory helpers
  const makeLevy = (x, floorY, minX, maxX, dir = -1) => ({
    type: 'levy',
    x,
    y: floorY - 100,
    floorY,
    w: 52,
    h: 100,
    minX,
    maxX,
    vx: dir * 92 * spdMult,
    facing: dir,
    state: 'walk', // 'walk' | 'rage' | 'attack' | 'recover'
    stateT: 0,
    cd: (hard ? 1.15 : 1.85) + Math.random() * 0.4,
    animT: Math.random() * 4,
    shoutIdx: Math.floor(Math.random() * 6),
    alive: true
  });

  const makeWally = (x, floorY, minX, maxX, dir = -1) => ({
    type: 'wally',
    x,
    y: floorY - 108,
    floorY,
    w: 66,
    h: 108,
    minX,
    maxX,
    vx: dir * 70 * spdMult,
    facing: dir,
    state: 'walk', // 'walk' | 'puff' | 'spout' | 'charge' | 'recover'
    stateT: 0,
    cd: (hard ? 1.45 : 2.25) + Math.random() * 0.5,
    animT: Math.random() * 4,
    shoutIdx: Math.floor(Math.random() * 4),
    pattern: 0,
    alive: true
  });

  const makeLalis = (x, floorY, minX, maxX, dir = -1) => ({
    type: 'lalis',
    x,
    y: floorY - 98,
    floorY,
    w: 50,
    h: 98,
    minX,
    maxX,
    vx: dir * 86 * spdMult,
    facing: dir,
    state: 'walk', // 'walk' | 'pose' | 'flash' | 'recover'
    stateT: 0,
    cd: (hard ? 1.25 : 2.0) + Math.random() * 0.45,
    animT: Math.random() * 4,
    shoutIdx: Math.floor(Math.random() * 4),
    alive: true
  });

  const makeCamara = (x, floorY, minX, maxX, dir = -1) => ({
    type: 'camara',
    x,
    y: floorY - 96,
    floorY,
    w: 50,
    h: 96,
    minX,
    maxX,
    vx: dir * 112 * spdMult,
    facing: dir,
    state: 'walk', // 'walk' | 'snap_warn' | 'snap' | 'sprint'
    stateT: 0,
    cd: (hard ? 1.05 : 1.75) + Math.random() * 0.4,
    animT: Math.random() * 4,
    shoutIdx: Math.floor(Math.random() * 4),
    alive: true
  });

  const makeStreamer = (x, floorY, minX, maxX, dir = -1) => ({
    type: 'streamer',
    x,
    y: floorY - 98,
    floorY,
    w: 50,
    h: 98,
    minX,
    maxX,
    vx: dir * 78 * spdMult,
    facing: dir,
    state: 'walk', // 'walk' | 'windup' | 'throw'
    stateT: 0,
    cd: (hard ? 1.3 : 2.1) + Math.random() * 0.45,
    animT: Math.random() * 4,
    shoutIdx: Math.floor(Math.random() * 4),
    alive: true
  });

  const enemies = [
    // Sector 1: Recepción & Pasillo de Prensa
    makeLalis(690, G, 540, 880, -1),
    makeCamara(1010, G, 880, 1220, -1),
    makeLevy(1360, G, 1180, 1580, -1),
    makeStreamer(1510, 290, 1435, 1595, -1), // Perched on Estudio 1 desk!
    makeWally(1820, G, 1620, 1980, -1),

    // Sector 2: Ala de Cubículos y Estudios Improvisados
    makeCamara(2460, G, 2290, 2660, -1),
    makeLevy(2740, G, 2560, 2960, -1),
    makeLalis(2910, 222, 2825, 3015, -1), // High lighting bridge selfie ambush!
    makeWally(3260, G, 3040, 3460, -1),
    makeStreamer(3610, G, 3440, 3820, -1),
    makeLevy(3960, G, 3760, 4120, -1),

    // Sector 3: Galería de Bodegas "En Vivo"
    makeLalis(4560, G, 4400, 4760, -1),
    makeStreamer(4800, 290, 4725, 4895, -1),
    makeWally(5020, G, 4820, 5240, -1),
    makeCamara(5380, G, 5200, 5580, -1),
    makeLevy(5660, G, 5480, 5880, -1),
    makeLalis(5910, 226, 5855, 6000, -1),

    // Sector 4: Recta Final — Centro de Fotocopiado
    makeCamara(6420, G, 6260, 6620, -1),
    makeWally(6720, G, 6540, 6940, -1),
    makeStreamer(6890, 224, 6815, 7000, -1),
    makeLevy(7060, G, 6880, 7280, -1),
    makeLalis(7320, G, 7140, 7400, -1)
  ];

  // Modo Pesado: extra overlapping hordes of bodegueros!
  if (hard) {
    enemies.push(
      makeStreamer(920, G, 780, 1080, 1),
      makeLevy(1690, G, 1520, 1920, 1),
      makeLalis(2620, G, 2440, 2820, 1),
      makeCamara(3380, G, 3200, 3600, 1),
      makeWally(3820, G, 3640, 4050, 1),
      makeLevy(4880, G, 4700, 5100, 1),
      makeStreamer(5480, G, 5300, 5700, 1),
      makeWally(6980, G, 6780, 7220, 1),
      makeCamara(7240, G, 7060, 7380, -1)
    );
  }

  // Allied Bonus NPCs: Doña Martha — La Señora de los Tintos de la Oficina!
  const tintoLadies = [
    { x: 2050, y: G - 118, given: false, smileT: 0, bubbleT: 0 },
    { x: 4210, y: G - 118, given: false, smileT: 0, bubbleT: 0 },
    { x: 6050, y: G - 118, given: false, smileT: 0, bubbleT: 0 }
  ];

  // Collectibles: Hojas de Vida ('cv'), Monedas de $500 para fotocopias ('coin'), Tintos ('tinto')
  const items = [
    { type: 'cv', x: 460, y: 324, got: false },
    { type: 'cv', x: 715, y: 256, got: false },
    { type: 'coin', x: 985, y: 182, got: false },
    { type: 'cv', x: 1245, y: 312, got: false },
    { type: 'tinto', x: 1520, y: 244, got: false },
    { type: 'coin', x: 1780, y: 318, got: false },

    { type: 'cv', x: 2365, y: 318, got: false },
    { type: 'coin', x: 2630, y: 248, got: false },
    { type: 'coin', x: 2930, y: 176, got: false },
    { type: 'cv', x: 3225, y: 248, got: false },
    { type: 'tinto', x: 3755, y: 242, got: false },
    { type: 'coin', x: 4030, y: 178, got: false },

    { type: 'cv', x: 4535, y: 314, got: false },
    { type: 'cv', x: 4815, y: 244, got: false },
    { type: 'coin', x: 5115, y: 174, got: false },
    { type: 'cv', x: 5405, y: 312, got: false },
    { type: 'tinto', x: 5670, y: 242, got: false },
    { type: 'coin', x: 5935, y: 180, got: false },

    { type: 'cv', x: 6355, y: 316, got: false },
    { type: 'coin', x: 6620, y: 244, got: false },
    { type: 'coin', x: 6915, y: 178, got: false },
    { type: 'tinto', x: 7190, y: 296, got: false }
  ];

  return { platforms, enemies, tintoLadies, items };
}
