import { loadAllAssets, areAssetsLoaded } from './core/assets.js';
import { ctx } from './core/renderer.js';
import { stageManager } from './core/stageManager.js';
import { initGlobalInputs } from './core/input.js';

// Register Stages (add future stages like WORLD_1_3 here!)
import { titleStage } from './stages/titleStage.js';
import { introCutsceneStage } from './stages/introCutsceneStage.js';
import { world1_1Stage } from './stages/world1_1/world1_1Stage.js';
import { world1_2Stage } from './stages/world1_2/world1_2Stage.js';

stageManager.register('TITLE', titleStage);
stageManager.register('INTRO_CUTSCENE', introCutsceneStage);
stageManager.register('WORLD_1_1', world1_1Stage);
stageManager.register('WORLD_1_2', world1_2Stage);

initGlobalInputs();

let lastTime = performance.now();
function gameLoop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (areAssetsLoaded()) {
    stageManager.update(dt);
    stageManager.render(ctx);
  }
  requestAnimationFrame(gameLoop);
}

loadAllAssets().then(() => {
  titleStage.initVisuals();
  stageManager.goTo('TITLE', { transition: false });
  requestAnimationFrame(gameLoop);
});
