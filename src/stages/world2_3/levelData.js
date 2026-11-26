/**
 * World 2-3: "Regreso a Casa — Acera de la Carrera 7ª (Centro Internacional)" (Bogotá).
 * 3-Lane Sidewalk Dodger with Brayan's "CHITE!" Shockwave Power Bubble (on cooldown).
 *
 * Non-repeating 6-panel architectural panorama (5,760px unique art, zero tiling!):
 *   Panel 1 (bg_septima_ci_1): Estación Museo Nacional + Edificios de Ladrillo
 *   Panel 2 (bg_septima_ci_2): Torres Tequendama, Torre Seguros & Obras de la 7ª
 *   Panel 3 (bg_septima_ci_3): Museo Nacional de Colombia & Vendedores
 *   Panel 4 (bg_septima_ci_4): Torres San Martín & Centro Comercial San Martín (Cra 7ª #32)
 *   Panel 5 (bg_septima_ci_5): Torre Colpatria & Torre Iluminada en Púrpura Neón (Noche)
 *   Panel 6 (bg_septima_ci_6): Plazoleta Centro Internacional → Paradero a Bosa La Esperanza
 */
export const WORLD_2_3_CONFIG = {
  // 3 Sidewalk Lanes (top -> mid -> bottom, with SNES depth scaling!)
  lanes: [370, 434, 498],
  laneScales: [0.84, 0.96, 1.08],
  sidewalkTopY: 326,
  totalDistance: 10600,
  bgPanels: [
    'bg_septima_ci_1',
    'bg_septima_ci_2',
    'bg_septima_ci_3',
    'bg_septima_ci_4',
    'bg_septima_ci_5',
    'bg_septima_ci_6'
  ],
  chiteCooldownLight: 4.2,
  chiteCooldownHeavy: 5.8,
  chiteRadius: 182
};

/**
 * Generates a rich, long, varied schedule of 3-lane sidewalk obstacles & pickups
 * spanning the entire 7,800px journey down Carrera 7a Centro Internacional.
 *
 * Obstacle kinds:
 *   - 'rappi'      : Orange-backpack Rappi delivery motorcycle ("¡Hasta el apto no entro!")
 *   - 'motero'     : Fast flashy street biker AK R200 on the sidewalk ("¡SONIDO AK R200!")
 *   - 'nero_run'   : Sprinting Bogotá ñero ("¿Qué pasa ome g*norr*a ome?")
 *   - 'nero_smoke' : Strolling smoking ñero trailing a haze cloud ("¡Puro bareto en la 7ª!")
 *   - 'skater'     : Fast weaving Bogotá skater doing ollies ("¡Ollie, parce!")
 */
export function createWorld2_3Schedule(hard) {
  const obstacles = [];
  const pickups = [];

  // Hand-paced escalating sectors along the 4 real landmarks of Carrera 7a!
  // Each entry spawns when Brayan's worldDist reaches (triggerX)
  const addObs = (triggerX, lane, kind, extra = {}) => {
    obstacles.push({
      triggerX,
      lane,
      kind,
      laneSwitch: extra.laneSwitch || false,
      spawned: false
    });
  };

  const addPickup = (triggerX, lane, type) => {
    pickups.push({
      triggerX,
      lane,
      type, // 'tinto' | 'empanada' | 'coin'
      spawned: false
    });
  };

  // ===========================================================================
  // SECTOR 1 (350..1950): ESTACIÓN MUSEO NACIONAL — Warmup & Intro of Cast!
  // ===========================================================================
  addObs(320, 1, 'nero_smoke');
  addObs(540, 0, 'rappi');
  addObs(740, 2, 'skater');
  addPickup(860, 1, 'coin');
  addObs(960, 1, 'nero_run');
  addObs(1080, 2, 'rappi');
  addObs(1260, 0, 'nero_smoke');
  addObs(1320, 1, 'motero');
  addPickup(1450, 2, 'empanada');
  addObs(1560, 0, 'skater');
  addObs(1640, 2, 'nero_run');
  // Mini 3-lane "¡CHITE!" teaching moment (one slow smoker + two fast riders)
  addObs(1840, 0, 'rappi');
  addObs(1860, 1, 'nero_smoke');
  addObs(1890, 2, 'skater');

  // ===========================================================================
  // SECTOR 2 (2050..3900): TORRES TEQUENDAMA & OBRAS DE LA 7ª — Faster Traffic!
  // ===========================================================================
  addPickup(2050, 0, 'tinto');
  addObs(2160, 1, 'motero');
  addObs(2230, 0, 'nero_run');
  addObs(2420, 2, 'rappi');
  addObs(2480, 1, 'skater', { laneSwitch: true });
  addObs(2680, 0, 'nero_smoke');
  addObs(2740, 2, 'motero');
  addPickup(2860, 1, 'coin');
  addObs(2960, 1, 'rappi');
  addObs(3020, 0, 'nero_run');
  addObs(3210, 2, 'nero_smoke');
  addObs(3250, 1, 'motero');
  addPickup(3390, 0, 'empanada');
  addObs(3500, 0, 'skater');
  addObs(3560, 2, 'rappi');
  addObs(3740, 0, 'motero');
  addObs(3770, 1, 'nero_run');
  addObs(3810, 2, 'nero_smoke');

  // ===========================================================================
  // SECTOR 3 (4000..5800): MUSEO NACIONAL DE COLOMBIA — Dense Sidewalk Rush!
  // ===========================================================================
  addPickup(4020, 2, 'tinto');
  addObs(4120, 1, 'skater', { laneSwitch: true });
  addObs(4190, 0, 'rappi');
  addObs(4370, 2, 'nero_run');
  addObs(4420, 1, 'nero_smoke');
  addObs(4590, 0, 'motero');
  addObs(4650, 2, 'skater');
  addPickup(4780, 1, 'empanada');
  addObs(4870, 1, 'rappi');
  addObs(4920, 0, 'nero_run', { laneSwitch: hard });
  addObs(5090, 2, 'motero');
  addObs(5140, 0, 'nero_smoke');
  addObs(5310, 1, 'skater', { laneSwitch: true });
  addObs(5360, 2, 'rappi');
  addPickup(5480, 0, 'coin');
  addObs(5580, 0, 'rappi');
  addObs(5610, 1, 'motero');
  addObs(5660, 2, 'nero_run');

  // ===========================================================================
  // SECTOR 4 (5850..7450): TORRES & CENTRO COMERCIAL SAN MARTÍN (CRA 7ª #32)
  // ===========================================================================
  addPickup(5880, 1, 'tinto');
  addObs(5990, 0, 'nero_smoke');
  addObs(6040, 2, 'motero');
  addObs(6210, 1, 'rappi');
  addObs(6260, 0, 'skater', { laneSwitch: true });
  addObs(6420, 2, 'nero_run');
  addObs(6470, 1, 'motero');
  addPickup(6590, 0, 'empanada');
  addObs(6690, 0, 'rappi');
  addObs(6740, 2, 'nero_smoke');
  addObs(6900, 1, 'skater', { laneSwitch: true });
  addObs(6950, 0, 'motero');
  addObs(7120, 2, 'rappi');
  addObs(7160, 1, 'nero_run', { laneSwitch: true });
  addObs(7330, 0, 'motero');
  addObs(7360, 1, 'rappi');
  addObs(7400, 2, 'skater');

  // ===========================================================================
  // SECTOR 5 (7550..9050): TORRE COLPATRIA & EDIFICIO PÚRPURA EN LA NOCHE!
  // ===========================================================================
  addPickup(7580, 2, 'tinto');
  addObs(7680, 1, 'motero');
  addObs(7730, 0, 'nero_smoke');
  addObs(7900, 2, 'rappi');
  addObs(7950, 1, 'skater', { laneSwitch: true });
  addPickup(8080, 0, 'coin');
  addObs(8180, 0, 'nero_run', { laneSwitch: true });
  addObs(8230, 2, 'motero');
  addObs(8410, 1, 'rappi');
  addObs(8460, 0, 'nero_smoke');
  addPickup(8590, 2, 'empanada');
  addObs(8680, 2, 'skater', { laneSwitch: true });
  addObs(8730, 1, 'motero');
  addObs(8910, 0, 'rappi');
  addObs(8940, 1, 'nero_run');
  addObs(8980, 2, 'nero_smoke');

  // ===========================================================================
  // SECTOR 6 (9120..10380): PLAZOLETA CENTRO INT. → PARADERO BOSA LA ESPERANZA!
  // ===========================================================================
  addPickup(9140, 1, 'tinto');
  addObs(9250, 0, 'motero');
  addObs(9300, 2, 'rappi');
  addObs(9480, 1, 'skater', { laneSwitch: true });
  addObs(9530, 0, 'nero_run', { laneSwitch: true });
  addPickup(9670, 2, 'empanada');
  addObs(9760, 2, 'motero');
  addObs(9810, 1, 'nero_smoke');
  addObs(9980, 0, 'rappi');
  addObs(10020, 2, 'skater', { laneSwitch: true });
  // Grand night finale right before the Bosa La Esperanza bus stop!
  addObs(10200, 0, 'motero');
  addObs(10235, 1, 'rappi');
  addObs(10275, 2, 'nero_run');

  // Modo Pesado: extra aggressive sidewalk traffic in every sector!
  if (hard) {
    addObs(640, 1, 'motero');
    addObs(1420, 2, 'nero_run');
    addObs(2330, 0, 'rappi');
    addObs(3120, 2, 'skater', { laneSwitch: true });
    addObs(4290, 1, 'motero');
    addObs(5010, 2, 'rappi');
    addObs(5740, 0, 'nero_run', { laneSwitch: true });
    addObs(6340, 1, 'nero_smoke');
    addObs(6830, 2, 'motero');
    addObs(7240, 0, 'rappi');
    addObs(7820, 1, 'nero_run', { laneSwitch: true });
    addObs(8320, 2, 'rappi');
    addObs(8820, 0, 'motero');
    addObs(9400, 1, 'rappi');
    addObs(9900, 2, 'motero');
  }

  obstacles.sort((a, b) => a.triggerX - b.triggerX);
  pickups.sort((a, b) => a.triggerX - b.triggerX);
  return { obstacles, pickups };
}
