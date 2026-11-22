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

  // Player sprites (Brayan)
  brayan_idle: './assets/sprites/player/brayan_idle.png',
  brayan_walk1: './assets/sprites/player/brayan_walk1.png',
  brayan_walk2: './assets/sprites/player/brayan_walk2.png',
  brayan_trip: './assets/sprites/player/brayan_trip.png',
  brayan_ko: './assets/sprites/player/brayan_ko.png',
  brayan_phone: './assets/sprites/player/brayan_phone.png',
  brayan_firm: './assets/sprites/player/brayan_firm.png',

  // Enemy sprites
  nero_walk: './assets/sprites/enemies/nero_walk.png',
  nero_lunge: './assets/sprites/enemies/nero_lunge.png',
  cosquillero: './assets/sprites/enemies/cosquillero.png',
  act_walk1: './assets/sprites/enemies/act_walk1.png',
  act_walk2: './assets/sprites/enemies/act_walk2.png',
  act_throw: './assets/sprites/enemies/act_throw.png',
  act_spray_high: './assets/sprites/enemies/act_spray_high.png',
  act_spray_low: './assets/sprites/enemies/act_spray_low.png',
  act_sign_up: './assets/sprites/enemies/act_sign_up.png',

  // NPC & Cutscene cast sprites
  chaza_lady: './assets/sprites/npcs/chaza_lady.png',
  majo_talk: './assets/sprites/npcs/majo_talk.png',
  majo_smile: './assets/sprites/npcs/majo_smile.png',
  reporter: './assets/sprites/npcs/reporter.png',
  cameraman: './assets/sprites/npcs/cameraman.png',
  passenger_gas: './assets/sprites/npcs/passenger_gas.png'
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
