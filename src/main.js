import { loadAllAssets, areAssetsLoaded } from './core/assets.js';
import { ctx } from './core/renderer.js';
import { stageManager } from './core/stageManager.js';
import { initGlobalInputs } from './core/input.js';

// Register Stages (add Chapter 2 stages like WORLD_2_1 here!)
import { titleStage } from './stages/titleStage.js';
import { introCutsceneStage } from './stages/introCutsceneStage.js';
import { world1_1Stage } from './stages/world1_1/world1_1Stage.js';
import { world1_2Stage } from './stages/world1_2/world1_2Stage.js';
import { cutscene1_2To1_3Stage } from './stages/cutscene1_2To1_3Stage.js';
import { world1_3Stage } from './stages/world1_3/world1_3Stage.js';
import { world1_4Stage } from './stages/world1_4/world1_4Stage.js';

stageManager.register('TITLE', titleStage);
stageManager.register('INTRO_CUTSCENE', introCutsceneStage);
stageManager.register('WORLD_1_1', world1_1Stage);
stageManager.register('WORLD_1_2', world1_2Stage);
stageManager.register('CUTSCENE_1_2_TO_1_3', cutscene1_2To1_3Stage);
stageManager.register('WORLD_1_3', world1_3Stage);
stageManager.register('WORLD_1_4', world1_4Stage);

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
