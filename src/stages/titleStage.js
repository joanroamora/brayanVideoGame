import { STATE } from '../core/gameState.js';
import { SFX } from '../core/audio.js';
import { DOM, hideOverlay } from '../core/ui.js';
import { ASSET_MANIFEST } from '../core/assets.js';
import { stageManager } from '../core/stageManager.js';

function selectMode(mode) {
  STATE.mode = mode;
  DOM.cardLight.classList.toggle('selected', mode === 'light');
  DOM.cardHeavy.classList.toggle('selected', mode === 'heavy');
  SFX.select();
}

function pickStartStage(targetStage) {
  STATE.startStage = targetStage;
  DOM.stagePick1_1.classList.toggle('active', targetStage === 'INTRO_CUTSCENE');
  DOM.stagePick1_2.classList.toggle('active', targetStage === 'WORLD_1_2');
  DOM.stagePick1_3.classList.toggle('active', targetStage === 'CUTSCENE_1_2_TO_1_3');
  DOM.stagePick1_4.classList.toggle('active', targetStage === 'WORLD_1_4');
  DOM.stagePick2_1.classList.toggle('active', targetStage === 'CUTSCENE_1_4_TO_2_1');
  DOM.stagePick2_2.classList.toggle('active', targetStage === 'CUTSCENE_2_1_TO_2_2');
  DOM.stagePick2_3.classList.toggle('active', targetStage === 'CUTSCENE_2_2_TO_2_3');
  if (DOM.stagePick2_4) DOM.stagePick2_4.classList.toggle('active', targetStage === 'CUTSCENE_2_3_TO_2_4');
  SFX.blip();
}

export const titleStage = {
  initVisuals() {
    DOM.titleBg.style.backgroundImage = `url(${ASSET_MANIFEST.lobby})`;
    DOM.titleBrayanImg.src = ASSET_MANIFEST.brayan_idle;
    DOM.titleNeroImg.src = ASSET_MANIFEST.nero_lunge;
  },

  enter() {
    DOM.canvasWrap.style.display = 'none';
    DOM.title.style.display = 'flex';
    DOM.world1Controls.style.display = 'none';
    DOM.world2Controls.style.display = 'none';
    DOM.world4Controls.style.display = 'none';
    if (DOM.world23Controls) DOM.world23Controls.style.display = 'none';
    hideOverlay();
  },

  exit() {
    DOM.title.style.display = 'none';
  },

  onAction(action) {
    if (action === 'SELECT_LIGHT') selectMode('light');
    else if (action === 'SELECT_HEAVY') selectMode('heavy');
    else if (action === 'PICK_STAGE_1_1') pickStartStage('INTRO_CUTSCENE');
    else if (action === 'PICK_STAGE_1_2') pickStartStage('WORLD_1_2');
    else if (action === 'PICK_STAGE_1_3') pickStartStage('CUTSCENE_1_2_TO_1_3');
    else if (action === 'PICK_STAGE_1_4') pickStartStage('WORLD_1_4');
    else if (action === 'PICK_STAGE_2_1') pickStartStage('CUTSCENE_1_4_TO_2_1');
    else if (action === 'PICK_STAGE_2_2') pickStartStage('CUTSCENE_2_1_TO_2_2');
    else if (action === 'PICK_STAGE_2_3') pickStartStage('CUTSCENE_2_2_TO_2_3');
    else if (action === 'PICK_STAGE_2_4') pickStartStage('CUTSCENE_2_3_TO_2_4');
    else if (action === 'START_GAME') {
      SFX.start();
      stageManager.goTo(STATE.startStage || 'INTRO_CUTSCENE');
    }
  },

  onKeyDown(k, e) {
    if (k === 'arrowleft' || k === 'a') selectMode('light');
    if (k === 'arrowright' || k === 'd') selectMode('heavy');
    if (k === '1') pickStartStage('INTRO_CUTSCENE');
    if (k === '2') pickStartStage('WORLD_1_2');
    if (k === '3') pickStartStage('CUTSCENE_1_2_TO_1_3');
    if (k === '4') pickStartStage('WORLD_1_4');
    if (k === '5') pickStartStage('CUTSCENE_1_4_TO_2_1');
    if (k === '6') pickStartStage('CUTSCENE_2_1_TO_2_2');
    if (k === '7') pickStartStage('CUTSCENE_2_2_TO_2_3');
    if (k === '8') pickStartStage('CUTSCENE_2_3_TO_2_4');
    if (k === 'enter' || k === ' ') {
      e.preventDefault();
      this.onAction('START_GAME');
    }
  }
};
