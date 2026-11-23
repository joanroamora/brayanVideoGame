import { STATE } from './gameState.js';
import { SFX } from './audio.js';
import { DOM } from './ui.js';
import { stageManager } from './stageManager.js';

function bindTouchHold(btnId, controlName) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const on = (e) => {
    e.preventDefault();
    stageManager.handleControl(controlName, true);
    btn.classList.add('pressed');
  };
  const off = (e) => {
    e.preventDefault();
    stageManager.handleControl(controlName, false);
    btn.classList.remove('pressed');
  };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointerleave', off);
  btn.addEventListener('pointercancel', off);
}

export function initGlobalInputs() {
  // Topbar controls
  DOM.btnEs.addEventListener('click', () => {
    STATE.lang = 'es';
    SFX.blip();
    stageManager.localize();
  });

  DOM.btnEn.addEventListener('click', () => {
    STATE.lang = 'en';
    SFX.blip();
    stageManager.localize();
  });

  DOM.btnSfx.addEventListener('click', (e) => {
    const on = SFX.toggle();
    e.currentTarget.textContent = on ? 'SFX: ON' : 'SFX: OFF';
    e.currentTarget.classList.toggle('muted', !on);
  });

  // Title controls
  DOM.cardLight.addEventListener('click', () => stageManager.handleAction('SELECT_LIGHT'));
  DOM.cardHeavy.addEventListener('click', () => stageManager.handleAction('SELECT_HEAVY'));
  DOM.stagePick1_1.addEventListener('click', () => stageManager.handleAction('PICK_STAGE_1_1'));
  DOM.stagePick1_2.addEventListener('click', () => stageManager.handleAction('PICK_STAGE_1_2'));
  DOM.stagePick1_3.addEventListener('click', () => stageManager.handleAction('PICK_STAGE_1_3'));
  DOM.stagePick1_4.addEventListener('click', () => stageManager.handleAction('PICK_STAGE_1_4'));
  DOM.btnPlay.addEventListener('click', () => stageManager.handleAction('START_GAME'));

  // Cutscene controls
  DOM.dialogue.addEventListener('click', () => stageManager.handleAction('ADVANCE_DIALOGUE'));
  DOM.skipBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    stageManager.handleAction('SKIP_CUTSCENE');
  });

  // World 1-1..1-4 action bar & overlay controls
  DOM.btnPause.addEventListener('click', () => stageManager.handleAction('TOGGLE_PAUSE'));
  DOM.btnW2Pause.addEventListener('click', () => stageManager.handleAction('TOGGLE_PAUSE'));
  DOM.btnW4Pause.addEventListener('click', () => stageManager.handleAction('TOGGLE_PAUSE'));

  DOM.btnReplayIntro.addEventListener('click', () => {
    SFX.select();
    stageManager.goTo(stageManager.activeName === 'WORLD_1_3' ? 'CUTSCENE_1_2_TO_1_3' : 'INTRO_CUTSCENE');
  });

  const goMenu = () => {
    SFX.blip();
    stageManager.goTo('TITLE');
  };
  DOM.btnBackMenu.addEventListener('click', goMenu);
  DOM.btnW2Menu.addEventListener('click', goMenu);
  DOM.btnW4Menu.addEventListener('click', goMenu);
  DOM.ovBtnMenu.addEventListener('click', goMenu);
  DOM.ovBtnPrimary.addEventListener('click', () => stageManager.handleAction('OVERLAY_PRIMARY'));

  // Touch / Pointer Controls — World 1-1 & 1-3
  bindTouchHold('btn-left', 'left');
  bindTouchHold('btn-right', 'right');
  bindTouchHold('btn-jump', 'jump');

  // Touch / Pointer Controls — World 1-2 (TransMilenio)
  bindTouchHold('btn-w2-left', 'left');
  bindTouchHold('btn-w2-right', 'right');
  bindTouchHold('btn-w2-firm', 'firm');
  bindTouchHold('btn-w2-window', 'window');

  // Touch / Pointer Controls — World 1-4 (Piamonte + Boss Fight)
  bindTouchHold('btn-w4-left', 'left');
  bindTouchHold('btn-w4-right', 'right');
  bindTouchHold('btn-w4-crouch', 'crouch');
  bindTouchHold('btn-w4-jump', 'jump');
  bindTouchHold('btn-w4-attack', 'attack');

  // Keyboard routing
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'm') {
      DOM.btnSfx.click();
      return;
    }
    if (k === 'l') {
      STATE.lang = STATE.lang === 'es' ? 'en' : 'es';
      SFX.blip();
      stageManager.localize();
      return;
    }
    stageManager.handleKeyDown(k, e);
  });

  window.addEventListener('keyup', (e) => {
    stageManager.handleKeyUp(e.key.toLowerCase(), e);
  });
}
