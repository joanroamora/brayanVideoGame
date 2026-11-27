/**
 * Level Blueprint for World 2-4 — Bosa La Esperanza (Ida a la Tienda y Regreso a Interior 92!).
 *
 * Non-repeating 6-panel 1:1 Bogotá neighborhood walk (5,760px long each way = 11,520px round-trip!):
 *   Panel 0 (0..960):     Casa de Brayan — Interior 92 (esperanza1.png)
 *   Panel 1 (960..1920):  Panadería y Cafetería Pau Pan R.D. (esperanza2.png)
 *   Panel 2 (1920..2880): Parque de Bosa La Esperanza (esperanza3.png)
 *   Panel 3 (2880..3840): Cuadra Cra. 78g & Camionetas (esperanza4.png)
 *   Panel 4 (3840..4800): Colegio Cl. 77A Sur & Tenis en los Cables (esperanza5.png)
 *   Panel 5 (4800..5760): Tienda y Fruver La Esperanza (Compra del Almuerzo!)
 */

export const WORLD_2_4_CONFIG = {
  worldWidth: 5760,
  panelW: 960,
  groundY: 468,
  homeDoorX: 482,
  storeDoorX: 5270,
  bgPanels: [
    'bg_esperanza_1',
    'bg_esperanza_2',
    'bg_esperanza_3',
    'bg_esperanza_4',
    'bg_esperanza_5',
    'bg_esperanza_6'
  ]
};

/**
 * Neighborhood safe ledges & jump platforms matching real elements of Bosa La Esperanza!
 * Brayan can hop onto these to dodge chasing packs of stray dogs or speeding bicitaxis!
 */
export function createWorld2_4Platforms() {
  return [
    // Panel 0 (Interior 92): low planter wall & concrete step
    { x: 740, y: 392, w: 118, h: 16, style: 'ledge', label: 'MURETE' },

    // Panel 1 (Panadería Pau Pan R.D.): bakery display bench & awning step
    { x: 1190, y: 390, w: 120, h: 16, style: 'bench', label: 'BANCA' },
    { x: 1610, y: 368, w: 146, h: 18, style: 'awning', label: 'PAU PAN' },

    // Panel 2 (Parque de Bosa La Esperanza): playground fence ledge & park benches
    { x: 2140, y: 392, w: 132, h: 16, style: 'bench', label: 'PARQUE' },
    { x: 2445, y: 360, w: 144, h: 16, style: 'park', label: 'JUEGOS' },
    { x: 2720, y: 392, w: 118, h: 16, style: 'bench', label: 'BANCA' },

    // Panel 3 (Cuadra Cra. 78g): White SUV roof & Black SUV roof (from esperanza4.png!)
    { x: 3128, y: 368, w: 280, h: 16, style: 'suv_white', label: 'CAMIONETA' },
    { x: 3566, y: 368, w: 236, h: 16, style: 'suv_black', label: 'CAMIONETA' },

    // Panel 4 (Colegio Cl. 77A Sur): concrete school benches & low brick planter
    { x: 4160, y: 392, w: 128, h: 16, style: 'bench', label: 'COLEGIO' },
    { x: 4480, y: 376, w: 136, h: 16, style: 'bench', label: 'PORTERÍA' },

    // Panel 5 (Tienda La Esperanza): wooden fruver fruit crates right outside the store!
    { x: 4960, y: 392, w: 126, h: 16, style: 'crate', label: 'HUACALES' }
  ];
}

/**
 * Slippery soap puddles & neighborhood curb obstacles (tires/trash bags).
 */
export function createWorld2_4Hazards() {
  return [
    { x: 1360, w: 72, kind: 'puddle' },
    { x: 2310, w: 68, kind: 'puddle' },
    { x: 3440, w: 74, kind: 'puddle' },
    { x: 4330, w: 70, kind: 'puddle' }
  ];
}

/**
 * Outbound Phase 1 ("IDA A LA TIENDA") enemies:
 * Packs of barking stray dogs actively chasing Brayan, Bosa bicitaxis, sweeping vecinas & bouncing soccer balls!
 */
export function createWorld2_4OutboundEnemies(hard) {
  const spd = hard ? 1.24 : 1.0;
  return [
    // Panel 0 -> 1: First barking stray dog chasing Brayan right off the block!
    { kind: 'dog_chaser', dark: false, x: 930, dir: -1, speed: 205 * spd, aggroDist: 440, leapCd: 1.8 },
    { kind: 'vecina', x: 1440, minX: 1290, maxX: 1560, dir: -1, speed: 68 * spd },
    { kind: 'dog_chaser', dark: true, x: 1790, dir: -1, speed: 220 * spd, aggroDist: 460, leapCd: 1.5 },

    // Panel 2 (Parque de Bosa La Esperanza): Bouncing soccer balls + park dogs!
    { kind: 'ball', x: 2180, dir: -1, speed: 245 * spd, bouncePhase: 0 },
    { kind: 'dog_chaser', dark: false, x: 2480, dir: -1, speed: 225 * spd, aggroDist: 470, leapCd: 1.6 },
    { kind: 'bicitaxi', x: 2790, minX: 2050, maxX: 2920, dir: -1, speed: 265 * spd },

    // Panel 3 (Cuadra Cra. 78g): Stray dog pack ambushing between the parked SUVs!
    { kind: 'dog_chaser', dark: true, x: 3260, dir: -1, speed: 230 * spd, aggroDist: 480, leapCd: 1.4 },
    { kind: 'dog_chaser', dark: false, x: 3460, dir: -1, speed: 238 * spd, aggroDist: 490, leapCd: 1.7 },
    { kind: 'vecina', x: 3740, minX: 3610, maxX: 3860, dir: -1, speed: 74 * spd },

    // Panel 4 (Colegio Cl. 77A Sur): Speeding bicitaxi + school-zone dogs + soccer ball!
    { kind: 'bicitaxi', x: 4250, minX: 3920, maxX: 4680, dir: -1, speed: 278 * spd },
    { kind: 'dog_chaser', dark: true, x: 4540, dir: -1, speed: 235 * spd, aggroDist: 490, leapCd: 1.5 },
    { kind: 'ball', x: 4780, dir: -1, speed: 255 * spd, bouncePhase: 1.4 },

    // Panel 5 (Approach to Tienda La Esperanza): One last hungry store-front street dog!
    { kind: 'dog_chaser', dark: false, x: 5060, dir: -1, speed: 228 * spd, aggroDist: 460, leapCd: 1.6 }
  ];
}

/**
 * Return Phase 2 ("REGRESO A INTERIOR 92 CON EL ALMUERZO"):
 * Now Brayan carries the grocery bag smelling of fresh chicken — packs of stray dogs CHASE him all the way home!
 */
export function createWorld2_4ReturnEnemies(hard) {
  const spd = hard ? 1.28 : 1.05;
  return [
    // Immediately behind/near the Tienda: hungry dog smelling the chicken in the bag!
    { kind: 'dog_chaser', dark: true, x: 4910, dir: 1, speed: 232 * spd, aggroDist: 520, leapCd: 1.3 },
    { kind: 'dog_chaser', dark: false, x: 5490, dir: -1, speed: 242 * spd, aggroDist: 650, leapCd: 1.4, relentless: true },

    // Colegio Cl. 77A Sur on the way back
    { kind: 'bicitaxi', x: 4320, minX: 3900, maxX: 4760, dir: 1, speed: 285 * spd },
    { kind: 'dog_chaser', dark: false, x: 4050, dir: 1, speed: 236 * spd, aggroDist: 520, leapCd: 1.4 },

    // Cuadra Cra. 78g — Double dog pack between the SUVs!
    { kind: 'dog_chaser', dark: true, x: 3580, dir: 1, speed: 242 * spd, aggroDist: 520, leapCd: 1.3 },
    { kind: 'vecina', x: 3340, minX: 3180, maxX: 3480, dir: 1, speed: 78 * spd },
    { kind: 'dog_chaser', dark: false, x: 3020, dir: 1, speed: 240 * spd, aggroDist: 520, leapCd: 1.4 },

    // Parque de Bosa La Esperanza — Bouncing microfútbol balls + park stray dogs!
    { kind: 'ball', x: 2560, dir: 1, speed: 265 * spd, bouncePhase: 0.6 },
    { kind: 'dog_chaser', dark: true, x: 2290, dir: 1, speed: 244 * spd, aggroDist: 540, leapCd: 1.3 },
    { kind: 'bicitaxi', x: 1960, minX: 1620, maxX: 2450, dir: 1, speed: 280 * spd },

    // Panadería Pau Pan R.D. -> Final sprint to Interior 92!
    { kind: 'vecina', x: 1480, minX: 1320, maxX: 1620, dir: 1, speed: 78 * spd },
    { kind: 'dog_chaser', dark: false, x: 1120, dir: 1, speed: 245 * spd, aggroDist: 540, leapCd: 1.2 },
    { kind: 'dog_chaser', dark: true, x: 820, dir: 1, speed: 248 * spd, aggroDist: 560, leapCd: 1.2 }
  ];
}

/**
 * Pickups along Bosa La Esperanza (coins $500 + fresh Pau Pan pandebonos/empanadas that heal!).
 */
export function createWorld2_4Pickups() {
  return [
    { x: 800, y: 348, type: 'coin' },
    { x: 1250, y: 344, type: 'coin' },
    { x: 1680, y: 320, type: 'pan' }, // Fresh pan from Panadería Pau Pan R.D.!
    { x: 2200, y: 348, type: 'coin' },
    { x: 2515, y: 314, type: 'coin' },
    { x: 3260, y: 320, type: 'pan' },
    { x: 3680, y: 320, type: 'coin' },
    { x: 4220, y: 348, type: 'coin' },
    { x: 4545, y: 330, type: 'pan' },
    { x: 5020, y: 348, type: 'coin' }
  ];
}
