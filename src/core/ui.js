import { STATE } from './gameState.js';
import { t } from '../config/i18n.js';

export const DOM = {
  title: document.getElementById('screen-title'),
  titleBg: document.getElementById('title-bg'),
  titleBrayanImg: document.getElementById('title-brayan-img'),
  titleNeroImg: document.getElementById('title-nero-img'),
  canvasWrap: document.getElementById('screen-canvas-wrap'),
  dialogue: document.getElementById('dialogue-box'),
  dlgSpeaker: document.getElementById('dlg-speaker'),
  dlgStep: document.getElementById('dlg-step'),
  dlgText: document.getElementById('dlg-text'),
  dlgNext: document.getElementById('dlg-next'),
  skipBtn: document.getElementById('btn-skip'),
  world1Controls: document.getElementById('world1-controls'),
  world2Controls: document.getElementById('world2-controls'),
  world4Controls: document.getElementById('world4-controls'),
  world23Controls: document.getElementById('world23-controls'),
  overlay: document.getElementById('game-overlay'),
  curtain: document.getElementById('transition-curtain'),
  btnEs: document.getElementById('btn-es'),
  btnEn: document.getElementById('btn-en'),
  btnSfx: document.getElementById('btn-sfx'),
  cardLight: document.getElementById('card-light'),
  cardHeavy: document.getElementById('card-heavy'),
  stagePick1_1: document.getElementById('stage-pick-1-1'),
  stagePick1_2: document.getElementById('stage-pick-1-2'),
  stagePick1_3: document.getElementById('stage-pick-1-3'),
  stagePick1_4: document.getElementById('stage-pick-1-4'),
  stagePick2_1: document.getElementById('stage-pick-2-1'),
  stagePick2_2: document.getElementById('stage-pick-2-2'),
  stagePick2_3: document.getElementById('stage-pick-2-3'),
  quizOverlay: document.getElementById('quiz-overlay'),
  quizTitle: document.getElementById('quiz-title'),
  quizQuestion: document.getElementById('quiz-question'),
  quizBtns: [
    document.getElementById('quiz-opt-0'),
    document.getElementById('quiz-opt-1'),
    document.getElementById('quiz-opt-2'),
    document.getElementById('quiz-opt-3')
  ],
  btnPlay: document.getElementById('btn-play'),
  btnPause: document.getElementById('btn-pause'),
  btnReplayIntro: document.getElementById('btn-replay-intro'),
  btnBackMenu: document.getElementById('btn-back-menu'),
  btnW2Pause: document.getElementById('btn-w2-pause'),
  btnW2Menu: document.getElementById('btn-w2-menu'),
  btnW4Pause: document.getElementById('btn-w4-pause'),
  btnW4Menu: document.getElementById('btn-w4-menu'),
  btnW23Pause: document.getElementById('btn-w23-pause'),
  btnW23Menu: document.getElementById('btn-w23-menu'),
  ovBtnPrimary: document.getElementById('ov-btn-primary'),
  ovBtnMenu: document.getElementById('ov-btn-menu'),
  ovTitle: document.getElementById('ov-title'),
  ovSub: document.getElementById('ov-sub'),
  ovStats: document.getElementById('ov-stats')
};

export function transitionWithCurtain(callback) {
  DOM.curtain.style.opacity = '1';
  setTimeout(() => {
    callback();
    setTimeout(() => {
      DOM.curtain.style.opacity = '0';
    }, 70);
  }, 240);
}

export function showOverlay(kind, config) {
  DOM.overlay.dataset.kind = kind;
  DOM.overlay.style.display = 'flex';
  renderOverlayContent(config);
}

export function hideOverlay() {
  DOM.overlay.style.display = 'none';
  DOM.overlay.dataset.kind = '';
}

export function renderOverlayContent({ title, sub, btnText, stats = [] }) {
  DOM.ovTitle.textContent = title;
  DOM.ovSub.textContent = sub;
  DOM.ovBtnPrimary.textContent = btnText;
  DOM.ovStats.innerHTML = stats
    .map((s) => `<div>${s.label}: <span style="color:${s.color}">${s.value}</span></div>`)
    .join('');
}

export function applySharedLocalization() {
  const L = t();
  document.getElementById('t-subtitle').textContent = L.subtitle;
  document.getElementById('t-select-mode').textContent = L.selectMode;
  document.getElementById('t-light-tag').textContent = L.lightTag;
  document.getElementById('t-light-name').textContent = L.lightName;
  document.getElementById('t-light-desc').textContent = L.lightDesc;
  document.getElementById('t-heavy-tag').textContent = L.heavyTag;
  document.getElementById('t-heavy-name').textContent = L.heavyName;
  document.getElementById('t-heavy-desc').textContent = L.heavyDesc;
  document.getElementById('t-stage-label').textContent = L.stageSelectLabel;
  DOM.stagePick1_1.textContent = L.stage1_1Label;
  DOM.stagePick1_2.textContent = L.stage1_2Label;
  DOM.stagePick1_3.textContent = L.stage1_3Label;
  DOM.stagePick1_4.textContent = L.stage1_4Label;
  DOM.stagePick2_1.textContent = L.stage2_1Label;
  DOM.stagePick2_2.textContent = L.stage2_2Label;
  DOM.stagePick2_3.textContent = L.stage2_3Label;
  DOM.btnPlay.textContent = L.playBtn;
  document.getElementById('t-controls-hint').textContent = STATE.isMobile ? L.hintMobile : L.hintDesktop;
  DOM.skipBtn.textContent = L.skipBtn;
  DOM.dlgNext.textContent = L.nextHint;
  document.getElementById('btn-jump').textContent = L.jumpBtn;
  document.getElementById('btn-w4-jump').textContent = L.jumpBtn;
  document.getElementById('t-w2-firm').textContent = L.w2FirmBtn;
  document.getElementById('t-w2-window').textContent = L.w2WindowBtn;
  document.getElementById('t-w4-attack').textContent = L.w4AttackBtn;
  const w23ChiteEl = document.getElementById('t-w23-chite');
  if (w23ChiteEl) w23ChiteEl.textContent = L.w23ChiteBtn;
  DOM.btnReplayIntro.textContent = L.replayIntro;
  DOM.btnBackMenu.textContent = L.backMenu;
  DOM.btnW2Menu.textContent = L.backMenu;
  DOM.btnW4Menu.textContent = L.backMenu;
  if (DOM.btnW23Menu) DOM.btnW23Menu.textContent = L.backMenu;
  DOM.ovBtnMenu.textContent = L.backMenu;

  DOM.btnEs.classList.toggle('active', STATE.lang === 'es');
  DOM.btnEn.classList.toggle('active', STATE.lang === 'en');
}
