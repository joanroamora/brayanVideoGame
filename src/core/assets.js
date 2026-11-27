/**
 * Centralized 16-bit Asset Manifest & Preloader.
 * Organized by category so adding new worlds, characters or enemies
 * only requires dropping the file in /assets and registering its key here.
 */
export const ASSET_MANIFEST = {
  // Backgrounds
  lobby: './assets/backgrounds/lobby.jpg',
  bg_septima: './assets/backgrounds/world_1_1_septima.jpg',
  transmi_interior: './assets/backgrounds/world_1_2_transmi_interior.png',
  cutscene_calle26: './assets/backgrounds/cutscene_estacion_calle26.jpg',
  bg_portal_sur: './assets/backgrounds/world_1_3_portal_sur.jpg',
  bg_bosa_piamonte: './assets/backgrounds/world_1_4_bosa_piamonte.jpg',
  bg_cancha: './assets/backgrounds/world_1_4_cancha.jpg',
  cutscene_office_sofa: './assets/backgrounds/cutscene_office_sofa.jpg',
  bg_office_corridor: './assets/backgrounds/world_2_1_corridor.jpg',
  cutscene_copy_room: './assets/backgrounds/cutscene_copy_room.jpg',
  bg_office_2_2: './assets/backgrounds/world_2_2_offices.jpg',
  bg_septima_ci_1: './assets/backgrounds/world_2_3_septima_1.jpg',
  bg_septima_ci_2: './assets/backgrounds/world_2_3_septima_2.jpg',
  bg_septima_ci_3: './assets/backgrounds/world_2_3_septima_3.jpg',
  bg_septima_ci_4: './assets/backgrounds/world_2_3_septima_4.jpg',
  bg_septima_ci_5: './assets/backgrounds/world_2_3_septima_5.jpg',
  bg_septima_ci_6: './assets/backgrounds/world_2_3_septima_6.jpg',
  bg_esperanza_1_night: './assets/backgrounds/world_2_4_esperanza_1_night.jpg',
  bg_esperanza_1: './assets/backgrounds/world_2_4_esperanza_1.jpg',
  bg_esperanza_2: './assets/backgrounds/world_2_4_esperanza_2.jpg',
  bg_esperanza_3: './assets/backgrounds/world_2_4_esperanza_3.jpg',
  bg_esperanza_4: './assets/backgrounds/world_2_4_esperanza_4.jpg',
  bg_esperanza_5: './assets/backgrounds/world_2_4_esperanza_5.jpg',
  bg_esperanza_6: './assets/backgrounds/world_2_4_esperanza_6.jpg',

  // Player sprites (Brayan)
  brayan_idle: './assets/sprites/player/brayan_idle.png',
  brayan_walk1: './assets/sprites/player/brayan_walk1.png',
  brayan_walk2: './assets/sprites/player/brayan_walk2.png',
  brayan_trip: './assets/sprites/player/brayan_trip.png',
  brayan_ko: './assets/sprites/player/brayan_ko.png',
  brayan_sofa_sleep: './assets/sprites/player/brayan_sofa_sleep.png',
  brayan_phone: './assets/sprites/player/brayan_phone.png',
  brayan_firm: './assets/sprites/player/brayan_firm.png',
  brayan_briefcase: './assets/sprites/player/brayan_briefcase.png',
  brayan_pintuco_idle: './assets/sprites/player/brayan_pintuco_idle.png',
  brayan_pintuco_walk1: './assets/sprites/player/brayan_pintuco_walk1.png',
  brayan_pintuco_walk2: './assets/sprites/player/brayan_pintuco_walk2.png',
  brayan_pintuco_bag1: './assets/sprites/player/brayan_pintuco_bag1.png',
  brayan_pintuco_bag2: './assets/sprites/player/brayan_pintuco_bag2.png',
  brayan_pintuco_phone: './assets/sprites/player/brayan_pintuco_phone.png',

  // Enemy sprites
  nero_walk: './assets/sprites/enemies/nero_walk.png',
  nero_lunge: './assets/sprites/enemies/nero_lunge.png',
  cosquillero: './assets/sprites/enemies/cosquillero.png',
  fruver_walk: './assets/sprites/enemies/fruver_walk.png',
  fruver_whip: './assets/sprites/enemies/fruver_whip.png',
  colado_1: './assets/sprites/enemies/colado_1.png',
  colado_2_vault: './assets/sprites/enemies/colado_2_vault.png',
  colado_3: './assets/sprites/enemies/colado_3.png',
  capucho_molotov: './assets/sprites/enemies/capucho_molotov.png',
  helicopter_boss: './assets/sprites/enemies/helicopter_boss.png',
  boss_francia: './assets/sprites/enemies/boss_francia.png',
  bodeguero_levy: './assets/sprites/enemies/bodeguero_levy.png',
  bodeguero_wally: './assets/sprites/enemies/bodeguero_wally.png',
  bodeguero_lalis: './assets/sprites/enemies/bodeguero_lalis.png',
  bodeguero_camara: './assets/sprites/enemies/bodeguero_camara.png',
  bodeguero_streamer: './assets/sprites/enemies/bodeguero_streamer.png',
  lagarto_runner: './assets/sprites/enemies/lagarto_runner.png',
  lagarto_sindical: './assets/sprites/enemies/lagarto_sindical.png',
  lagarto_hopper: './assets/sprites/enemies/lagarto_hopper.png',
  moto_rappi: './assets/sprites/enemies/moto_rappi.png',
  moto_callejero: './assets/sprites/enemies/moto_callejero.png',
  nero_runner: './assets/sprites/enemies/nero_runner.png',
  nero_smoker: './assets/sprites/enemies/nero_smoker.png',
  skater_7a: './assets/sprites/enemies/skater_7a.png',
  perro_barrio: './assets/sprites/enemies/perro_barrio.png',
  perro_barrio_2: './assets/sprites/enemies/perro_barrio_2.png',
  bicitaxi_bosa: './assets/sprites/enemies/bicitaxi_bosa.png',
  vecina_barrio: './assets/sprites/enemies/vecina_barrio.png',
  balon_barrio: './assets/sprites/enemies/balon_barrio.png',
  act_walk1: './assets/sprites/enemies/act_walk1.png',
  act_walk2: './assets/sprites/enemies/act_walk2.png',
  act_throw: './assets/sprites/enemies/act_throw.png',
  act_spray_high: './assets/sprites/enemies/act_spray_high.png',
  act_spray_low: './assets/sprites/enemies/act_spray_low.png',
  act_sign_up: './assets/sprites/enemies/act_sign_up.png',

  // NPC & Cutscene cast sprites
  chaza_lady: './assets/sprites/npcs/chaza_lady.png',
  tinto_lady: './assets/sprites/npcs/tinto_lady.png',
  majo_talk: './assets/sprites/npcs/majo_talk.png',
  majo_smile: './assets/sprites/npcs/majo_smile.png',
  majo_demon: './assets/sprites/npcs/majo_demon.png',
  advisor_1: './assets/sprites/npcs/advisor_1.png',
  advisor_2: './assets/sprites/npcs/advisor_2.png',
  chairo_clerk: './assets/sprites/npcs/chairo_clerk.png',
  reporter: './assets/sprites/npcs/reporter.png',
  cameraman: './assets/sprites/npcs/cameraman.png',
  passenger_gas: './assets/sprites/npcs/passenger_gas.png',
  cantante_transmi: './assets/sprites/npcs/cantante_transmi.png'
};

export const IMGS = {};
let _assetsLoaded = false;

export function areAssetsLoaded() {
  return _assetsLoaded;
}

export function loadAllAssets() {
  const keys = Object.keys(ASSET_MANIFEST);
  let loaded = 0;

  return new Promise((resolve) => {
    keys.forEach((key) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === keys.length) {
          _assetsLoaded = true;
          resolve(IMGS);
        }
      };
      img.src = ASSET_MANIFEST[key];
      IMGS[key] = img;
    });
  });
}
