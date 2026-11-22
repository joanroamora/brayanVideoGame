import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { SFX } from '../../core/audio.js';
import { DOM, showOverlay, hideOverlay, renderOverlayContent } from '../../core/ui.js';
import { WORLD_1_2_CONFIG, getWorld1_2Difficulty, buildTransmiSchedule } from './levelData.js';
import { renderWorld1_2 } from './world1_2Renderer.js';

const W2 = {
  paused: false,
  status: 'PLAYING', // 'PLAYING' | 'GAMEOVER' | 'VICTORY'
  elapsed: 0,
  duration: WORLD_1_2_CONFIG.duration,
  fadeIn: 1.0,
  shakeTime: 0,
  busScrollX: 0,
  busSpeed: 280,
  stopIndex: 0,
  arrivalAnnounced: false,
  bannerText: '',
  bannerTimer: 0,
  crowdTimer: 4.5,

  // Player state
  score: 0,
  carryScore: 0,
  hp: 5,
  maxHp: 5,
  dodgesCount: 0,
  firmsCount: 0,
  ventsCount: 0,

  brayan: {
    xOffset: 0,        // Smooth dodge offset (-78 left .. +78 right)
    targetOffset: 0,
    pose: 'phone',     // 'phone' | 'firm' | 'hurt'
    poseTimer: 0,
    firmAura: 0,
    shoutTimer: 0,
    dodgeTimer: 0,
    invuln: 0
  },

  // Window ventilation animation (0 = closed, 1 = wide open)
  windowOpenAmt: 0,
  windowHoldTimer: 0,
  windTimer: 0,

  // Active hazard channels (allows independent/fair simultaneous threats!)
  snatch: null,       // { side: 'left'|'right', timer, maxTime, state: 'active'|'dodged'|'hit', outT }
  cosquillero: null,  // { side: 'left'|'right', timer, maxTime, state: 'creep'|'scared'|'hit', outT }
  gas: null,          // { side: 'left'|'right', timer, maxTime, state: 'rising'|'clearing'|'hit', outT, cloudAlpha }

  schedule: [],
  nextScheduleIdx: 0,
  diff: null,

  particles: [],
  gasBubbles: [],
  floatTexts: []
};

function getOverlayConfig(kind) {
  const L = t();
  const stats = [
    { label: L.statScore, value: W2.score, color: '#facc15' },
    { label: L.w2StatDodges, value: W2.dodgesCount, color: '#38bdf8' },
    { label: L.w2StatFirms, value: W2.firmsCount, color: '#fb923c' },
    { label: L.w2StatVents, value: W2.ventsCount, color: '#4ade80' }
  ];
  if (kind === 'PAUSE') {
    return { title: L.w2PauseTitle, sub: L.w2PauseSub, btnText: L.resumeBtn, stats };
  }
  if (kind === 'GAMEOVER') {
    return { title: L.w2GameOverTitle, sub: L.w2GameOverSub, btnText: L.retryBtn, stats };
  }
  return { title: L.w2VictoryTitle, sub: L.w2VictorySub, btnText: L.playAgainBtn, stats };
}

function addFloatText(x, y, text, color = '#facc15') {
  W2.floatTexts.push({ x, y, text, color, life: 1.45 });
}

function spawnParticles(x, y, color, count = 10, spread = 150) {
  for (let i = 0; i < count; i++) {
    W2.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * spread,
      vy: -50 - Math.random() * spread * 0.8,
      size: 3 + Math.random() * 4,
      color,
      life: 0.45 + Math.random() * 0.4
    });
  }
}

function hurtBrayan(scorePenalty, msg) {
  W2.hp = Math.max(0, W2.hp - 1);
  if (scorePenalty > 0) {
    W2.score = Math.max(0, W2.score - scorePenalty);
  }
  W2.shakeTime = 0.34;
  W2.brayan.pose = 'hurt';
  W2.brayan.poseTimer = 0.55;
  W2.brayan.invuln = 0.65;
  addFloatText(WORLD_1_2_CONFIG.brayanBaseX + W2.brayan.xOffset, 275, msg, '#ef4444');
  spawnParticles(WORLD_1_2_CONFIG.brayanBaseX + W2.brayan.xOffset, 370, '#ef4444', 12, 180);

  if (W2.hp <= 0) {
    W2.status = 'GAMEOVER';
    SFX.gameover();
    showOverlay('GAMEOVER', getOverlayConfig('GAMEOVER'));
  }
}

function triggerEvent(ev) {
  if (ev.type === 'snatch' && !W2.snatch) {
    W2.snatch = {
      side: ev.side,
      timer: W2.diff.snatchWindow,
      maxTime: W2.diff.snatchWindow,
      state: 'active',
      outT: 0
    };
    SFX.blip();
  } else if (ev.type === 'cosquillero' && !W2.cosquillero) {
    W2.cosquillero = {
      side: ev.side,
      timer: W2.diff.cosquilleroWindow,
      maxTime: W2.diff.cosquilleroWindow,
      state: 'creep',
      outT: 0
    };
    SFX.throwSign();
  } else if (ev.type === 'gas' && !W2.gas) {
    W2.gas = {
      side: ev.side,
      timer: W2.diff.gasWindow,
      maxTime: W2.diff.gasWindow,
      state: 'rising',
      outT: 0,
      cloudAlpha: 0.15
    };
    W2.gasBubbles = [];
    const originX = ev.side === 'left' ? 210 : 750;
    for (let i = 0; i < 18; i++) {
      W2.gasBubbles.push({
        x: originX + (Math.random() - 0.5) * 90,
        y: 430 + (Math.random() - 0.5) * 50,
        vx: (ev.side === 'left' ? 1 : -1) * (40 + Math.random() * 85),
        vy: -20 - Math.random() * 45,
        r: 14 + Math.random() * 20
      });
    }
    SFX.fart();
    addFloatText(originX, 295, t().w2GasWarn, '#4ade80');
  }
}

// =========================================================================
// PLAYER ACTIONS (3 INTEGRATED MECHANICS)
// =========================================================================

// 1. CELULAR: Dodge Left or Right
function triggerDodge(dir) {
  if (W2.paused || W2.status !== 'PLAYING') return;
  W2.brayan.targetOffset = dir * 82;
  W2.brayan.dodgeTimer = 0.42;

  if (W2.snatch && W2.snatch.state === 'active') {
    const requiredDir = W2.snatch.side === 'left' ? 1 : -1;
    if (dir === requiredDir) {
      W2.snatch.state = 'dodged';
      W2.snatch.outT = 0.55;
      W2.score += 150;
      W2.dodgesCount++;
      SFX.dodge();
      addFloatText(WORLD_1_2_CONFIG.brayanBaseX + dir * 70, 265, t().w2DodgeOk, '#38bdf8');
      spawnParticles(WORLD_1_2_CONFIG.brayanBaseX + dir * 55, 340, '#38bdf8', 9, 130);
    } else {
      // Dodged directly into the snatching hand!
      W2.snatch.state = 'hit';
      W2.snatch.outT = 0.55;
      SFX.snatch();
      hurtBrayan(W2.diff.snatchPenalty, t().w2DodgeFail);
    }
  } else {
    SFX.step();
  }
}

// 2. COSQUILLERO: Firm Attitude (Presencia Firme)
function triggerFirmPresence() {
  if (W2.paused || W2.status !== 'PLAYING') return;

  W2.brayan.pose = 'firm';
  W2.brayan.poseTimer = 0.85;
  W2.brayan.firmAura = 1.0;
  W2.brayan.shoutTimer = 0.95;

  if (W2.cosquillero && W2.cosquillero.state === 'creep') {
    W2.cosquillero.state = 'scared';
    W2.cosquillero.outT = 0.72;
    W2.score += 200;
    W2.firmsCount++;
    SFX.firm();
    addFloatText(WORLD_1_2_CONFIG.brayanBaseX, 248, t().w2FirmOk, '#facc15');
    spawnParticles(WORLD_1_2_CONFIG.brayanBaseX, 340, '#facc15', 14, 210);
  } else {
    SFX.blip();
  }
}

// 3. GAS VERDE: Open Bus Window to Ventilate
function triggerWindowVent() {
  if (W2.paused || W2.status !== 'PLAYING') return;

  W2.windowHoldTimer = 1.6;
  W2.windTimer = 1.25;
  SFX.windowOpen();

  if (W2.gas && W2.gas.state === 'rising') {
    W2.gas.state = 'clearing';
    W2.gas.outT = 0.75;
    W2.score += 150;
    W2.ventsCount++;
    addFloatText(480, 215, t().w2GasOk, '#4ade80');
    spawnParticles(480, 185, '#bae6fd', 14, 200);
  }
}

function buildWorld1_2(carryScore = 0) {
  const hard = (STATE.mode === 'heavy');
  W2.diff = getWorld1_2Difficulty(hard);

  W2.paused = false;
  W2.status = 'PLAYING';
  W2.elapsed = 0;
  W2.duration = WORLD_1_2_CONFIG.duration;
  W2.fadeIn = 1.0;
  W2.shakeTime = 0;
  W2.busScrollX = 0;
  W2.busSpeed = 285;
  W2.stopIndex = 0;
  W2.arrivalAnnounced = false;
  W2.bannerText = t().w2IntroCallout;
  W2.bannerTimer = 2.8;
  W2.crowdTimer = 5.5;

  W2.carryScore = carryScore;
  W2.score = carryScore;
  W2.hp = W2.diff.maxHp;
  W2.maxHp = W2.diff.maxHp;
  W2.dodgesCount = 0;
  W2.firmsCount = 0;
  W2.ventsCount = 0;

  W2.brayan = {
    xOffset: 0,
    targetOffset: 0,
    pose: 'phone',
    poseTimer: 0,
    firmAura: 0,
    shoutTimer: 0,
    dodgeTimer: 0,
    invuln: 0
  };

  W2.windowOpenAmt = 0;
  W2.windowHoldTimer = 0;
  W2.windTimer = 0;

  W2.snatch = null;
  W2.cosquillero = null;
  W2.gas = null;

  W2.schedule = buildTransmiSchedule(hard);
  W2.nextScheduleIdx = 0;

  W2.particles = [];
  W2.gasBubbles = [];
  W2.floatTexts = [];

  hideOverlay();
  SFX.busStop();
}

export const world1_2Stage = {
  enter(params = {}) {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    DOM.world1Controls.style.display = 'none';
    DOM.world2Controls.style.display = 'flex';
    buildWorld1_2(params.carryScore || 0);
  },

  exit() {
    DOM.world2Controls.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    const L = t();
    DOM.btnW2Pause.textContent = W2.paused ? L.resumeBtn : L.pauseBtn;
    if (W2.paused || W2.status !== 'PLAYING') {
      const kind = DOM.overlay.dataset.kind || (W2.paused ? 'PAUSE' : W2.status);
      renderOverlayContent(getOverlayConfig(kind));
    }
  },

  onAction(action) {
    if (action === 'TOGGLE_PAUSE') {
      if (W2.status !== 'PLAYING') return;
      W2.paused = !W2.paused;
      SFX.blip();
      if (W2.paused) showOverlay('PAUSE', getOverlayConfig('PAUSE'));
      else hideOverlay();
      this.onLocalize();
    } else if (action === 'OVERLAY_PRIMARY') {
      SFX.select();
      const kind = DOM.overlay.dataset.kind;
      if (kind === 'PAUSE') {
        W2.paused = false;
        hideOverlay();
        this.onLocalize();
      } else {
        buildWorld1_2(W2.carryScore);
        this.onLocalize();
      }
    }
  },

  onControl(control, pressed) {
    if (!pressed) return;
    if (control === 'left') triggerDodge(-1);
    else if (control === 'right') triggerDodge(1);
    else if (control === 'firm') triggerFirmPresence();
    else if (control === 'window') triggerWindowVent();
  },

  onKeyDown(k, e) {
    if (k === 'p' || k === 'escape') {
      this.onAction('TOGGLE_PAUSE');
      return;
    }
    if (W2.paused || W2.status !== 'PLAYING') return;

    if (k === 'arrowleft' || k === 'a') {
      e.preventDefault();
      triggerDodge(-1);
    } else if (k === 'arrowright' || k === 'd') {
      e.preventDefault();
      triggerDodge(1);
    } else if (k === ' ' || k === 'e' || k === 'arrowup') {
      e.preventDefault();
      triggerFirmPresence();
    } else if (k === 'w' || k === 'f' || k === 'shift') {
      e.preventDefault();
      triggerWindowVent();
    }
  },

  update(dt) {
    if (W2.paused || W2.status !== 'PLAYING') return;

    W2.elapsed += dt;
    if (W2.fadeIn > 0) W2.fadeIn = Math.max(0, W2.fadeIn - dt * 0.95);
    if (W2.shakeTime > 0) W2.shakeTime = Math.max(0, W2.shakeTime - dt);
    if (W2.bannerTimer > 0) W2.bannerTimer = Math.max(0, W2.bannerTimer - dt);

    // Smooth bus motion & deceleration arriving at Estación Calle 26
    if (W2.elapsed >= WORLD_1_2_CONFIG.arrivalBrakeStart) {
      const brakeFrac = Math.min(1, (W2.elapsed - WORLD_1_2_CONFIG.arrivalBrakeStart) / (W2.duration - WORLD_1_2_CONFIG.arrivalBrakeStart));
      W2.busSpeed = Math.max(0, 285 * (1 - brakeFrac));
      if (!W2.arrivalAnnounced) {
        W2.arrivalAnnounced = true;
        W2.bannerText = t().w2ArrivalCallout;
        W2.bannerTimer = 3.0;
        SFX.busStop();
      }
    } else {
      W2.busSpeed = 285 + Math.sin(W2.elapsed * 0.7) * 35;
    }
    W2.busScrollX += W2.busSpeed * dt;

    // Station milestones announcements
    const milestones = WORLD_1_2_CONFIG.stopMilestones;
    for (let i = W2.stopIndex + 1; i < milestones.length; i++) {
      if (W2.elapsed >= milestones[i]) {
        W2.stopIndex = i;
        if (i < milestones.length - 1) {
          W2.bannerText = `${t().w2NextStop}: ${t().w2Stops[i]}`;
          W2.bannerTimer = 2.2;
          SFX.busStop();
        }
      }
    }

    // Occasional lively Bogotá commuter chatter
    W2.crowdTimer -= dt;
    if (W2.crowdTimer <= 0 && W2.elapsed < 47) {
      W2.crowdTimer = 6.2 + Math.random() * 4.0;
      const lines = t().w2CrowdLines;
      const msg = lines[Math.floor(Math.random() * lines.length)];
      const cx = Math.random() < 0.5 ? 140 : 820;
      addFloatText(cx, 300, msg, '#cbd5e1');
    }

    // Dispatch scheduled events across the 52s ride
    while (W2.nextScheduleIdx < W2.schedule.length && W2.elapsed >= W2.schedule[W2.nextScheduleIdx].time) {
      triggerEvent(W2.schedule[W2.nextScheduleIdx]);
      W2.nextScheduleIdx++;
    }

    // Update Brayan pose & smooth dodge interpolation
    const B = W2.brayan;
    if (B.dodgeTimer > 0) {
      B.dodgeTimer = Math.max(0, B.dodgeTimer - dt);
      if (B.dodgeTimer === 0) B.targetOffset = 0;
    }
    B.xOffset += (B.targetOffset - B.xOffset) * Math.min(1, dt * 16);

    if (B.poseTimer > 0) {
      B.poseTimer = Math.max(0, B.poseTimer - dt);
      if (B.poseTimer === 0) B.pose = 'phone';
    }
    if (B.firmAura > 0) B.firmAura = Math.max(0, B.firmAura - dt * 1.4);
    if (B.shoutTimer > 0) B.shoutTimer = Math.max(0, B.shoutTimer - dt);
    if (B.invuln > 0) B.invuln = Math.max(0, B.invuln - dt);

    // Update sliding window animation
    if (W2.windowHoldTimer > 0) {
      W2.windowHoldTimer = Math.max(0, W2.windowHoldTimer - dt);
      W2.windowOpenAmt = Math.min(1, W2.windowOpenAmt + dt * 6.5);
    } else {
      W2.windowOpenAmt = Math.max(0, W2.windowOpenAmt - dt * 3.0);
    }
    if (W2.windTimer > 0) W2.windTimer = Math.max(0, W2.windTimer - dt);

    // 1. Update Phone Snatch event
    if (W2.snatch) {
      if (W2.snatch.state === 'active') {
        W2.snatch.timer -= dt;
        if (W2.snatch.timer <= 0) {
          W2.snatch.state = 'hit';
          W2.snatch.outT = 0.55;
          SFX.snatch();
          hurtBrayan(W2.diff.snatchPenalty, t().w2DodgeFail);
        }
      } else {
        W2.snatch.outT -= dt;
        if (W2.snatch.outT <= 0) W2.snatch = null;
      }
    }

    // 2. Update Cosquillero event
    if (W2.cosquillero) {
      if (W2.cosquillero.state === 'creep') {
        W2.cosquillero.timer -= dt;
        if (W2.cosquillero.timer <= 0) {
          W2.cosquillero.state = 'hit';
          W2.cosquillero.outT = 0.65;
          SFX.snatch();
          hurtBrayan(W2.diff.cosquilleroPenalty, t().w2FirmFail);
        }
      } else {
        W2.cosquillero.outT -= dt;
        if (W2.cosquillero.outT <= 0) W2.cosquillero = null;
      }
    }

    // 3. Update Green Gas event
    if (W2.gas) {
      if (W2.gas.state === 'rising') {
        W2.gas.timer -= dt;
        const progress = 1 - Math.max(0, W2.gas.timer / W2.gas.maxTime);
        W2.gas.cloudAlpha = Math.min(0.88, 0.2 + progress * 0.72);
        for (const gb of W2.gasBubbles) {
          gb.x += gb.vx * dt * 0.7;
          gb.y += gb.vy * dt * 0.65;
          gb.r += 4 * dt;
        }
        if (W2.gas.timer <= 0) {
          W2.gas.state = 'hit';
          W2.gas.outT = 0.8;
          SFX.hurt();
          hurtBrayan(0, t().w2GasFail);
        }
      } else if (W2.gas.state === 'clearing') {
        W2.gas.outT -= dt;
        W2.gas.cloudAlpha = Math.max(0, W2.gas.outT / 0.75 * 0.7);
        for (const gb of W2.gasBubbles) {
          gb.x += (480 - gb.x) * dt * 2.5;
          gb.y -= 260 * dt;
        }
        if (W2.gas.outT <= 0) {
          W2.gas = null;
          W2.gasBubbles = [];
        }
      } else {
        W2.gas.outT -= dt;
        W2.gas.cloudAlpha = Math.max(0, W2.gas.outT / 0.8 * 0.65);
        if (W2.gas.outT <= 0) {
          W2.gas = null;
          W2.gasBubbles = [];
        }
      }
    }

    // Particles & Floating Texts
    for (let i = W2.particles.length - 1; i >= 0; i--) {
      const pt = W2.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 300 * dt;
      pt.life -= dt;
      if (pt.life <= 0) W2.particles.splice(i, 1);
    }
    for (let i = W2.floatTexts.length - 1; i >= 0; i--) {
      const ft = W2.floatTexts[i];
      ft.y -= 32 * dt;
      ft.life -= dt;
      if (ft.life <= 0) W2.floatTexts.splice(i, 1);
    }

    // Victory at end of ~52s journey (Estación Calle 26)
    if (W2.elapsed >= W2.duration && W2.status === 'PLAYING') {
      W2.status = 'VICTORY';
      const hard = (STATE.mode === 'heavy');
      W2.score += (hard ? 1200 : 600) + W2.hp * 200;
      SFX.victory();
      showOverlay('VICTORY', getOverlayConfig('VICTORY'));
    }
  },

  render(ctx) {
    renderWorld1_2(ctx, W2);
  }
};
