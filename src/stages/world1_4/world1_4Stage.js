import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { SFX } from '../../core/audio.js';
import { DOM, showOverlay, hideOverlay, renderOverlayContent } from '../../core/ui.js';
import { stageManager } from '../../core/stageManager.js';
import { WORLD_1_4_CONFIG, createWorld1_4Entities } from './levelData.js';
import { renderWorld1_4 } from './world1_4Renderer.js';

const { groundY: GROUND_Y, arenaX: ARENA_X, arenaW: ARENA_W, levelLen: LEVEL_LEN } = WORLD_1_4_CONFIG;

const W4 = {
  paused: false,
  status: 'PLAYING', // 'PLAYING' | 'GAMEOVER' | 'VICTORY'
  phase: 'STREET',   // 'STREET' | 'BOSS_INTRO' | 'BOSS_FIGHT' | 'BOSS_DEFEATED'
  phaseTimer: 0,
  time: 0,
  fadeIn: 1.0,
  camX: 0,
  shakeTime: 0,
  score: 0,
  carryScore: 0,
  capuchosKo: 0,
  bossHits: 0,
  blocksBroken: 0,

  player: {
    x: 110, y: GROUND_Y - 96, w: 42, h: 96,
    vx: 0, vy: 0, facing: 1, onGround: true,
    crouching: false,
    coyote: 0, jumpBuffer: 0, walkTimer: 0, walkFrame: 0,
    attackTimer: 0, attackCd: 0, throwCd: 0,
    hp: 5, maxHp: 5, invuln: 0
  },

  keys: { left: false, right: false, crouch: false, jump: false, jumpHeld: false },

  // Aerial Helicopter Threat (active during Phase 1 & Boss Airstrikes!)
  heli: {
    x: 480, y: 108, targetX: 480, targetY: 108,
    facing: -1, fireCd: 1.8, burstLeft: 0, burstDelay: 0,
    mode: 'stalk', // 'stalk' | 'descend' | 'retreat' | 'airstrike'
    sweepDir: -1
  },

  // Phase 2 Final Boss in Cancha de Piamonte
  boss: {
    active: false,
    x: ARENA_X + 760,
    y: 120,
    w: 66,
    h: 116,
    vx: 0,
    vy: 0,
    facing: -1,
    hp: 15,
    maxHp: 15,
    hitFlash: 0,
    invuln: 0,
    state: 'drop', // 'drop' | 'idle' | 'speech' | 'charge_warn' | 'charge' | 'vulnerable' | 'airstrike_call' | 'airstrike_wait' | 'defeated'
    stateT: 0,
    airstrikesDone: 0, // Triggers at 66% HP (1) and 33% HP (2)
    patternIdx: 0,
    shoutText: '',
    shoutT: 0
  },

  platforms: [],
  capuchos: [],
  items: [],
  heliShots: [],    // Vertical glowing decree/overspend projectiles from chopper
  molotovs: [],     // Parabolic bottles thrown by capuchos
  fires: [],        // Temporary street fire zones from shattered molotovs
  briefcases: [],   // Thrown spinning lawyer briefcases from Brayan!
  speechWaves: [],  // Boss horizontal sonic waves ("¡DE MALAS!")
  airTargets: [],   // Ground warning reticles during Boss Airstrike
  particles: [],
  floatTexts: []
};

function getOverlayConfig(kind) {
  const L = t();
  const stats = [
    { label: L.statScore, value: W4.score, color: '#facc15' },
    { label: L.w4StatCapuchos, value: W4.capuchosKo, color: '#f472b6' },
    { label: L.w4StatHits, value: W4.bossHits, color: '#38bdf8' },
    { label: L.w4StatBlocks, value: W4.blocksBroken, color: '#4ade80' }
  ];
  if (kind === 'PAUSE') {
    return { title: L.w4PauseTitle, sub: L.w4PauseSub, btnText: L.resumeBtn, stats };
  }
  if (kind === 'GAMEOVER') {
    return { title: L.w4GameOverTitle, sub: L.w4GameOverSub, btnText: L.retryBtn, stats };
  }
  return { title: L.w4VictoryTitle, sub: L.w4VictorySub, btnText: L.nextWorld2_1Btn, stats };
}

function addFloatText(x, y, text, color = '#facc15') {
  W4.floatTexts.push({ x, y, text, color, life: 1.35 });
}

function spawnParticles(x, y, color, count = 8, spread = 140) {
  for (let i = 0; i < count; i++) {
    W4.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * spread,
      vy: -45 - Math.random() * spread * 0.9,
      size: 3 + Math.random() * 4,
      color,
      life: 0.4 + Math.random() * 0.35
    });
  }
}

function damagePlayer(source = 'hit') {
  const P = W4.player;
  if (P.invuln > 0 || W4.status !== 'PLAYING') return;
  const L = t();
  P.hp--;
  P.invuln = STATE.mode === 'heavy' ? 1.1 : 1.5;
  W4.shakeTime = 0.3;
  P.vy = -255;

  const msg = source === 'fire' ? L.w4FireHit
    : source === 'decree' ? L.w4DecreeHit
    : source === 'speech' ? L.w4SpeechHit
    : '-1 ♥';

  SFX.hurt();
  addFloatText(P.x + 20, P.y - 12, msg, '#ef4444');
  spawnParticles(P.x + P.w / 2, P.y + P.h / 2, '#ef4444', 10, 180);

  if (P.hp <= 0) {
    W4.status = 'GAMEOVER';
    SFX.gameover();
    showOverlay('GAMEOVER', getOverlayConfig('GAMEOVER'));
  }
}

function damageBoss(dmg, hitX, hitY) {
  const B = W4.boss;
  if (!B.active || B.invuln > 0 || B.state === 'defeated' || B.state === 'airstrike_wait') return;

  B.hp = Math.max(0, B.hp - dmg);
  B.hitFlash = 0.25;
  B.invuln = 0.34;
  W4.bossHits++;
  W4.score += 120 * dmg;
  W4.shakeTime = 0.16;
  SFX.bossHit();
  addFloatText(B.x + B.w / 2, B.y - 12, `-${dmg} HP!`, '#facc15');
  spawnParticles(hitX, hitY, '#fde047', 12, 185);

  if (B.hp <= 0) {
    B.state = 'defeated';
    B.stateT = 2.2;
    W4.phase = 'BOSS_DEFEATED';
    W4.speechWaves = [];
    W4.heliShots = [];
    W4.airTargets = [];
    SFX.bossDefeat();
    spawnParticles(B.x + B.w / 2, B.y + 45, '#facc15', 28, 280);
    spawnParticles(B.x + B.w / 2, B.y + 45, '#ef4444', 20, 250);
    return;
  }

  // Every 1/3 of HP lost -> Trigger Helicopter Airstrike Call!
  const frac = B.hp / B.maxHp;
  if ((B.airstrikesDone === 0 && frac <= 0.67) || (B.airstrikesDone === 1 && frac <= 0.34)) {
    B.airstrikesDone++;
    B.state = 'airstrike_call';
    B.stateT = 0.95;
    B.vx = 0;
    B.shoutText = t().w4BossAirShout;
    B.shoutT = 1.6;
    SFX.bossWarning();
  }
}

function performBriefcaseAttack() {
  if (W4.paused || W4.status !== 'PLAYING' || W4.phase === 'BOSS_INTRO') return;
  const P = W4.player;
  if (P.attackCd > 0) return;

  P.attackTimer = 0.26;
  P.attackCd = 0.34;
  SFX.briefcase();

  // Melee Briefcase Hitbox directly in front of Brayan!
  const mx0 = P.facing > 0 ? (P.x + P.w - 4) : (P.x - 66);
  const mx1 = P.facing > 0 ? (P.x + P.w + 66) : (P.x + 4);
  const my0 = P.y + 8;
  const my1 = P.y + P.h - 4;

  // Hit Capuchos with melee swing
  for (const c of W4.capuchos) {
    if (!c.alive) continue;
    if (c.x + c.w > mx0 && c.x < mx1 && c.y + c.h > my0 && c.y < my1) {
      c.alive = false;
      W4.capuchosKo++;
      W4.score += 200;
      SFX.stomp();
      addFloatText(c.x + 20, c.y - 8, '+200 KO!', '#4ade80');
      spawnParticles(c.x + c.w / 2, c.y + 38, '#facc15', 12, 180);
    }
  }

  // Hit Boss with melee swing (2 damage!)
  const B = W4.boss;
  if (W4.phase === 'BOSS_FIGHT' && B.active) {
    if (B.x + B.w > mx0 && B.x < mx1 && B.y + B.h > my0 && B.y < my1) {
      damageBoss(2, B.x + B.w / 2, B.y + 45);
    }
  }

  // Also launch a spinning thrown briefcase projectile on a short cooldown!
  if (P.throwCd <= 0) {
    P.throwCd = 0.58;
    W4.briefcases.push({
      x: P.x + (P.facing > 0 ? P.w + 8 : -8),
      y: P.y + (P.crouching ? 24 : 38),
      vx: P.facing * 435,
      rot: 0,
      life: 1.05
    });
  }
}

function buildWorld1_4(carryScore = 0) {
  const hard = (STATE.mode === 'heavy');
  W4.paused = false;
  W4.status = 'PLAYING';
  W4.phase = 'STREET';
  W4.phaseTimer = 0;
  W4.time = 0;
  W4.fadeIn = 1.0;
  W4.camX = 0;
  W4.shakeTime = 0;
  W4.carryScore = carryScore;
  W4.score = carryScore;
  W4.capuchosKo = 0;
  W4.bossHits = 0;
  W4.blocksBroken = 0;

  W4.player = {
    x: 110, y: GROUND_Y - 96, w: 42, h: 96,
    vx: 0, vy: 0, facing: 1, onGround: true,
    crouching: false,
    coyote: 0, jumpBuffer: 0, walkTimer: 0, walkFrame: 0,
    attackTimer: 0, attackCd: 0, throwCd: 0,
    hp: hard ? 3 : 5, maxHp: hard ? 3 : 5, invuln: 0
  };
  W4.keys = { left: false, right: false, crouch: false, jump: false, jumpHeld: false };

  W4.heli = {
    x: 420, y: 108, targetX: 420, targetY: 108,
    facing: -1, fireCd: hard ? 1.5 : 2.2, burstLeft: 0, burstDelay: 0,
    mode: 'stalk', sweepDir: -1
  };

  W4.boss = {
    active: false,
    x: ARENA_X + 740, y: 110, w: 68, h: 118,
    vx: 0, vy: 0, facing: -1,
    hp: hard ? 21 : 15, maxHp: hard ? 21 : 15,
    hitFlash: 0, invuln: 0,
    state: 'drop', stateT: 0,
    airstrikesDone: 0, patternIdx: 0,
    shoutText: '', shoutT: 0
  };

  const entities = createWorld1_4Entities(hard);
  W4.platforms = entities.platforms;
  W4.capuchos = entities.capuchos;
  W4.items = entities.items;

  W4.heliShots = [];
  W4.molotovs = [];
  W4.fires = [];
  W4.briefcases = [];
  W4.speechWaves = [];
  W4.airTargets = [];
  W4.particles = [];
  W4.floatTexts = [];

  hideOverlay();
}

export const world1_4Stage = {
  enter(params = {}) {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    DOM.world1Controls.style.display = 'none';
    DOM.world2Controls.style.display = 'none';
    DOM.world4Controls.style.display = 'flex';
    buildWorld1_4(params.carryScore || 0);
  },

  exit() {
    W4.keys = { left: false, right: false, crouch: false, jump: false, jumpHeld: false };
    DOM.world4Controls.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    const L = t();
    DOM.btnW4Pause.textContent = W4.paused ? L.resumeBtn : L.pauseBtn;
    if (W4.paused || W4.status !== 'PLAYING') {
      const kind = DOM.overlay.dataset.kind || (W4.paused ? 'PAUSE' : W4.status);
      renderOverlayContent(getOverlayConfig(kind));
    }
  },

  onAction(action) {
    if (action === 'TOGGLE_PAUSE') {
      if (W4.status !== 'PLAYING') return;
      W4.paused = !W4.paused;
      SFX.blip();
      if (W4.paused) showOverlay('PAUSE', getOverlayConfig('PAUSE'));
      else hideOverlay();
      this.onLocalize();
    } else if (action === 'OVERLAY_PRIMARY') {
      SFX.select();
      const kind = DOM.overlay.dataset.kind;
      if (kind === 'PAUSE') {
        W4.paused = false;
        hideOverlay();
        this.onLocalize();
      } else if (kind === 'VICTORY') {
        SFX.start();
        stageManager.goTo('CUTSCENE_1_4_TO_2_1', { params: { carryScore: W4.score } });
      } else {
        buildWorld1_4(W4.carryScore);
        this.onLocalize();
      }
    }
  },

  onControl(control, pressed) {
    if (control === 'left' || control === 'right' || control === 'crouch') {
      W4.keys[control] = pressed;
    } else if (control === 'jump') {
      W4.keys.jump = pressed;
      if (pressed) {
        W4.keys.jumpHeld = true;
        W4.player.jumpBuffer = 0.14;
      } else {
        W4.keys.jumpHeld = false;
      }
    } else if (control === 'attack' && pressed) {
      performBriefcaseAttack();
    }
  },

  onKeyDown(k, e) {
    if (k === 'p' || k === 'escape') {
      this.onAction('TOGGLE_PAUSE');
      return;
    }
    if (k === 'arrowleft' || k === 'a') W4.keys.left = true;
    if (k === 'arrowright' || k === 'd') W4.keys.right = true;
    if (k === 'arrowdown' || k === 's') { e.preventDefault(); W4.keys.crouch = true; }
    if (k === ' ' || k === 'arrowup' || k === 'w') {
      e.preventDefault();
      if (!W4.keys.jumpHeld) W4.player.jumpBuffer = 0.14;
      W4.keys.jumpHeld = true;
    }
    if (k === 'j' || k === 'z' || k === 'f' || k === 'shift' || k === 'k') {
      e.preventDefault();
      performBriefcaseAttack();
    }
  },

  onKeyUp(k) {
    if (k === 'arrowleft' || k === 'a') W4.keys.left = false;
    if (k === 'arrowright' || k === 'd') W4.keys.right = false;
    if (k === 'arrowdown' || k === 's') W4.keys.crouch = false;
    if (k === ' ' || k === 'arrowup' || k === 'w') W4.keys.jumpHeld = false;
  },

  update(dt) {
    if (W4.paused || W4.status !== 'PLAYING') return;
    const hard = (STATE.mode === 'heavy');
    const L = t();
    W4.time += dt;
    if (W4.fadeIn > 0) W4.fadeIn = Math.max(0, W4.fadeIn - dt * 0.9);
    if (W4.shakeTime > 0) W4.shakeTime = Math.max(0, W4.shakeTime - dt);

    const P = W4.player;
    if (P.invuln > 0) P.invuln = Math.max(0, P.invuln - dt);
    if (P.attackTimer > 0) P.attackTimer = Math.max(0, P.attackTimer - dt);
    if (P.attackCd > 0) P.attackCd = Math.max(0, P.attackCd - dt);
    if (P.throwCd > 0) P.throwCd = Math.max(0, P.throwCd - dt);

    // =========================================================================
    // PLAYER PHYSICS (JUMP + CROUCH/SHIELD + ARENA BOUNDS)
    // =========================================================================
    const wantsCrouch = W4.keys.crouch && P.onGround && W4.phase !== 'BOSS_INTRO';
    if (wantsCrouch && !P.crouching) {
      P.crouching = true;
      P.y += 38;
      P.h = 58;
    } else if (!wantsCrouch && P.crouching) {
      P.crouching = false;
      P.y -= 38;
      P.h = 96;
    }

    const moveSpd = P.crouching ? 95 : 272;
    P.vx = 0;
    if (W4.phase !== 'BOSS_INTRO') {
      if (W4.keys.left) { P.vx = -moveSpd; P.facing = -1; }
      if (W4.keys.right) { P.vx = moveSpd; P.facing = 1; }
    }

    const minBoundX = (W4.phase === 'STREET') ? 20 : ARENA_X + 26;
    const maxBoundX = (W4.phase === 'STREET') ? (LEVEL_LEN - 80) : (ARENA_X + ARENA_W - 68);
    P.x = Math.max(minBoundX, Math.min(maxBoundX, P.x + P.vx * dt));

    if (P.vx !== 0 && P.onGround && !P.crouching) {
      P.walkTimer += dt;
      if (P.walkTimer > 0.13) { P.walkTimer = 0; P.walkFrame = 1 - P.walkFrame; }
    }

    if (P.onGround) P.coyote = 0.12;
    else P.coyote = Math.max(0, P.coyote - dt);
    if (P.jumpBuffer > 0) P.jumpBuffer = Math.max(0, P.jumpBuffer - dt);

    if (P.jumpBuffer > 0 && P.coyote > 0 && W4.phase !== 'BOSS_INTRO') {
      if (P.crouching) { P.crouching = false; P.y -= 38; P.h = 96; }
      P.vy = -625;
      P.onGround = false;
      P.coyote = 0;
      P.jumpBuffer = 0;
      SFX.jump();
      spawnParticles(P.x + P.w / 2, P.y + P.h, '#e2e8f0', 5, 90);
    }
    if (!W4.keys.jumpHeld && P.vy < -240) P.vy *= 0.85;

    const prevBottom = P.y + P.h;
    P.vy = Math.min(820, P.vy + 1480 * dt);
    P.y += P.vy * dt;
    P.onGround = false;

    if (P.vy >= 0 && W4.phase === 'STREET') {
      for (const pl of W4.platforms) {
        if (!pl.alive) continue;
        if (P.x + P.w - 6 > pl.x && P.x + 6 < pl.x + pl.w) {
          if (prevBottom <= pl.y + 10 && P.y + P.h >= pl.y) {
            P.y = pl.y - P.h;
            P.vy = 0;
            P.onGround = true;
            break;
          }
        }
      }
    }
    if (P.y + P.h >= GROUND_Y) {
      P.y = GROUND_Y - P.h;
      P.vy = 0;
      P.onGround = true;
    }

    // =========================================================================
    // PHASE TRANSITION: STREET -> LOCKED MICROFÚTBOL COURT BOSS ARENA
    // =========================================================================
    if (W4.phase === 'STREET') {
      const targetCam = Math.max(0, Math.min(ARENA_X, P.x - 320));
      W4.camX += (targetCam - W4.camX) * Math.min(1, dt * 8);

      if (P.x >= ARENA_X + 75) {
        W4.phase = 'BOSS_INTRO';
        W4.phaseTimer = 2.6;
        W4.heli.mode = 'descend';
        W4.heli.x = ARENA_X + 740;
        W4.heli.y = 95;
        W4.heliShots = [];
        W4.molotovs = [];
        W4.fires = [];
        W4.boss.active = false;
        W4.boss.x = ARENA_X + 740;
        W4.boss.y = 140;
        SFX.bossWarning();
      }
    } else {
      // Smoothly lock camera strictly onto the 960px Cancha de Piamonte!
      W4.camX += (ARENA_X - W4.camX) * Math.min(1, dt * 9);
    }

    // =========================================================================
    // HELICOPTER AI (PHASE 1 STALKING & PHASE 2 BOSS ENTRANCE / AIRSTRIKES)
    // =========================================================================
    const H = W4.heli;
    if (W4.phase === 'STREET') {
      H.targetX = Math.max(W4.camX + 120, Math.min(ARENA_X - 180, P.x + 55 + Math.sin(W4.time * 1.4) * 110));
      H.targetY = 104 + Math.sin(W4.time * 2.4) * 14;
      H.x += (H.targetX - H.x) * Math.min(1, dt * 2.6);
      H.y += (H.targetY - H.y) * Math.min(1, dt * 3.5);
      H.facing = (P.x < H.x) ? -1 : 1;

      H.fireCd -= dt;
      if (H.fireCd <= 0 && Math.abs(H.x - P.x) < 380) {
        H.burstLeft = hard ? 4 : 3;
        H.burstDelay = 0;
        H.fireCd = hard ? 2.45 : 3.45;
      }
      if (H.burstLeft > 0) {
        H.burstDelay -= dt;
        if (H.burstDelay <= 0) {
          H.burstLeft--;
          H.burstDelay = hard ? 0.22 : 0.30;
          W4.heliShots.push({
            x: H.x + (Math.random() - 0.5) * 44,
            y: H.y + 42,
            vx: (P.x - H.x) * 0.22,
            vy: hard ? 355 : 280,
            labelIdx: Math.floor(Math.random() * 3)
          });
          SFX.chopperFire();
        }
      }
    } else if (W4.phase === 'BOSS_INTRO') {
      W4.phaseTimer -= dt;
      if (W4.phaseTimer > 1.35) {
        // Chopper descends into the Cancha
        H.y += (185 - H.y) * Math.min(1, dt * 4);
      } else {
        // Boss leaps out onto the court while chopper climbs away!
        if (!W4.boss.active) {
          W4.boss.active = true;
          W4.boss.x = H.x - 20;
          W4.boss.y = H.y + 15;
          W4.boss.vy = -120;
          W4.boss.shoutText = L.w4BossIntroShout;
          W4.boss.shoutT = 1.6;
          SFX.firm();
        }
        H.y += (-120 - H.y) * Math.min(1, dt * 3);
      }
      if (W4.boss.active) {
        W4.boss.vy += 1200 * dt;
        W4.boss.y = Math.min(GROUND_Y - W4.boss.h, W4.boss.y + W4.boss.vy * dt);
      }
      if (W4.phaseTimer <= 0) {
        W4.phase = 'BOSS_FIGHT';
        W4.boss.y = GROUND_Y - W4.boss.h;
        W4.boss.state = 'idle';
        W4.boss.stateT = 0.75;
      }
    } else if (W4.phase === 'BOSS_FIGHT' && H.mode === 'airstrike') {
      // Rapid chopper airstrike flyby across the Cancha!
      H.x += H.sweepDir * (hard ? 520 : 410) * dt;
      H.y = 104 + Math.sin(W4.time * 6) * 8;
      H.facing = H.sweepDir;
      H.burstDelay -= dt;
      if (H.burstDelay <= 0 && H.x > ARENA_X + 70 && H.x < ARENA_X + ARENA_W - 70) {
        H.burstDelay = hard ? 0.22 : 0.30;
        const dropX = H.x;
        W4.airTargets.push({ x: dropX, life: 0.75 });
        W4.heliShots.push({
          x: dropX,
          y: H.y + 42,
          vx: 0,
          vy: hard ? 375 : 300,
          labelIdx: Math.floor(Math.random() * 3)
        });
        SFX.chopperFire();
      }
      if ((H.sweepDir < 0 && H.x < ARENA_X - 240) || (H.sweepDir > 0 && H.x > ARENA_X + ARENA_W + 240)) {
        H.mode = 'retreat';
        H.y = -140;
        if (W4.boss.state === 'airstrike_wait') {
          W4.boss.state = 'vulnerable';
          W4.boss.stateT = hard ? 1.0 : 1.55;
        }
      }
    }

    // =========================================================================
    // PHASE 1: CAPUCHOS + MOLOTOVS + FIRES + HELICOPTER PROJECTILES
    // =========================================================================
    if (W4.phase === 'STREET') {
      for (const c of W4.capuchos) {
        if (!c.alive) continue;
        c.animT += dt;
        const dist = (P.x + P.w / 2) - (c.x + c.w / 2);
        const absDist = Math.abs(dist);

        if (c.throwAnim > 0) {
          c.throwAnim = Math.max(0, c.throwAnim - dt);
        } else {
          c.x += c.vx * dt;
          if (c.x < c.minX) { c.x = c.minX; c.vx = Math.abs(c.vx); }
          if (c.x > c.maxX) { c.x = c.maxX; c.vx = -Math.abs(c.vx); }
          c.facing = c.vx >= 0 ? 1 : -1;

          c.cd -= dt;
          if (c.cd <= 0 && absDist < 470) {
            c.facing = dist >= 0 ? 1 : -1;
            c.throwAnim = 0.42;
            c.cd = hard ? 1.85 : 2.75;
            const flightT = 0.85;
            const throwVx = Math.max(-320, Math.min(320, dist / flightT));
            W4.molotovs.push({
              x: c.x + c.w / 2,
              y: c.y + 24,
              vx: throwVx,
              vy: -340,
              rot: 0
            });
            SFX.throwSign();
            addFloatText(c.x + 20, c.y - 10, L.w4CapuchoShout, '#fb923c');
          }
        }

        // Player <-> Capucho Stomp vs Hurt
        const pad = 8;
        if (P.x + P.w - pad > c.x + pad && P.x + pad < c.x + c.w - pad && P.y + P.h > c.y + 6 && P.y < c.y + c.h) {
          if (P.vy > 40 && (P.y + P.h - P.vy * dt) <= c.y + 38) {
            c.alive = false;
            P.vy = -440;
            W4.capuchosKo++;
            W4.score += 180;
            SFX.stomp();
            addFloatText(c.x + 20, c.y, '+180', '#4ade80');
            spawnParticles(c.x + c.w / 2, c.y + 30, '#facc15', 10, 160);
          } else {
            damagePlayer('capucho');
          }
        }
      }
    }

    // Update Molotovs (parabolic arc -> bursts into temporary fire zone!)
    for (let i = W4.molotovs.length - 1; i >= 0; i--) {
      const m = W4.molotovs[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.vy += 760 * dt;
      m.rot += 9 * dt;

      // Direct hit on Brayan
      if (P.x + P.w - 6 > m.x - 12 && P.x + 6 < m.x + 12 && P.y + P.h - 6 > m.y - 12 && P.y + 6 < m.y + 12) {
        W4.molotovs.splice(i, 1);
        SFX.molotovBreak();
        damagePlayer('fire');
        continue;
      }

      if (m.y >= GROUND_Y - 6) {
        W4.molotovs.splice(i, 1);
        SFX.molotovBreak();
        W4.fires.push({ x: m.x - 36, y: GROUND_Y - 26, w: 72, h: 26, life: hard ? 4.4 : 3.2 });
        spawnParticles(m.x, GROUND_Y - 10, '#f97316', 12, 160);
      }
    }

    // Update Temporary Street Fire Zones
    for (let i = W4.fires.length - 1; i >= 0; i--) {
      const f = W4.fires[i];
      f.life -= dt;
      if (f.life <= 0) { W4.fires.splice(i, 1); continue; }
      if (P.x + P.w - 8 > f.x && P.x + 8 < f.x + f.w && P.y + P.h > f.y + 6 && P.y < f.y + f.h) {
        damagePlayer('fire');
      }
    }

    // Update Helicopter Aerial Projectiles (Destroy 'breakable' blocks & blocked by 'shelter' roofs!)
    for (let i = W4.heliShots.length - 1; i >= 0; i--) {
      const s = W4.heliShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      let blocked = false;
      if (W4.phase === 'STREET') {
        for (const pl of W4.platforms) {
          if (!pl.alive) continue;
          if (s.x > pl.x && s.x < pl.x + pl.w && s.y + 12 >= pl.y && s.y - 12 <= pl.y + pl.h) {
            if (pl.style === 'shelter') {
              // Shop roof safely blocks aerial bombardment!
              spawnParticles(s.x, pl.y, '#38bdf8', 7, 110);
              blocked = true;
              break;
            } else if (pl.style === 'breakable') {
              // Destroys temporary block!
              pl.alive = false;
              W4.blocksBroken++;
              SFX.blockBreak();
              spawnParticles(pl.x + pl.w / 2, pl.y + pl.h / 2, '#22c55e', 14, 190);
              spawnParticles(pl.x + pl.w / 2, pl.y + pl.h / 2, '#d97706', 10, 170);
              blocked = true;
              break;
            }
          }
        }
      }
      if (blocked) { W4.heliShots.splice(i, 1); continue; }

      // Hit Player (crouching under a shelter protects you, otherwise direct hit hurts)
      if (P.x + P.w - 6 > s.x - 14 && P.x + 6 < s.x + 14 && P.y + P.h - 4 > s.y - 12 && P.y + 4 < s.y + 12) {
        W4.heliShots.splice(i, 1);
        damagePlayer('decree');
        continue;
      }

      if (s.y >= GROUND_Y) {
        spawnParticles(s.x, GROUND_Y - 4, '#facc15', 8, 120);
        W4.heliShots.splice(i, 1);
      }
    }

    // Update Brayan's Thrown Spinning Briefcases!
    for (let i = W4.briefcases.length - 1; i >= 0; i--) {
      const bc = W4.briefcases[i];
      bc.x += bc.vx * dt;
      bc.rot += 15 * dt;
      bc.life -= dt;

      let hit = false;
      for (const c of W4.capuchos) {
        if (!c.alive) continue;
        if (bc.x + 16 > c.x && bc.x - 16 < c.x + c.w && bc.y + 14 > c.y && bc.y - 14 < c.y + c.h) {
          c.alive = false;
          W4.capuchosKo++;
          W4.score += 200;
          SFX.stomp();
          addFloatText(c.x + 20, c.y - 8, '+200 MALETÍN!', '#4ade80');
          spawnParticles(bc.x, bc.y, '#facc15', 10, 150);
          hit = true;
          break;
        }
      }
      if (!hit && W4.phase === 'BOSS_FIGHT' && W4.boss.active) {
        const B = W4.boss;
        if (bc.x + 16 > B.x && bc.x - 16 < B.x + B.w && bc.y + 14 > B.y && bc.y - 14 < B.y + B.h) {
          damageBoss(1, bc.x, bc.y);
          hit = true;
        }
      }

      if (hit || bc.life <= 0 || bc.x < W4.camX - 40 || bc.x > W4.camX + 1000) {
        W4.briefcases.splice(i, 1);
      }
    }

    // =========================================================================
    // PHASE 2: BOSS AI IN CANCHA DE MICROFÚTBOL (3 PATTERNS!)
    // =========================================================================
    const B = W4.boss;
    if (B.hitFlash > 0) B.hitFlash = Math.max(0, B.hitFlash - dt);
    if (B.invuln > 0) B.invuln = Math.max(0, B.invuln - dt);
    if (B.shoutT > 0) B.shoutT = Math.max(0, B.shoutT - dt);

    if (W4.phase === 'BOSS_FIGHT' && B.active) {
      if (B.state === 'idle') {
        B.facing = (P.x < B.x) ? -1 : 1;
        B.stateT -= dt;
        if (B.stateT <= 0) {
          // Alternate between Sonic Speech Wave & Full-Court Charge!
          if (B.patternIdx % 2 === 0) {
            B.state = 'speech';
            B.stateT = hard ? 0.95 : 1.15;
            const words = L.w4BossSpeechWords;
            const text = words[B.patternIdx % words.length];
            B.shoutText = text;
            B.shoutT = 1.05;
            W4.speechWaves.push({
              x: B.x + (B.facing > 0 ? B.w : -10),
              y: GROUND_Y - 52,
              vx: B.facing * (hard ? 395 : 300),
              text,
              life: 3.2
            });
            SFX.speechWave();
          } else {
            B.state = 'charge_warn';
            B.stateT = hard ? 0.42 : 0.62;
            B.shoutText = L.w4BossChargeShout;
            B.shoutT = 0.9;
            SFX.throwSign();
          }
          B.patternIdx++;
        }
      } else if (B.state === 'speech') {
        B.stateT -= dt;
        if (B.stateT <= 0) {
          B.state = 'vulnerable';
          B.stateT = hard ? 0.72 : 1.2;
        }
      } else if (B.state === 'charge_warn') {
        B.facing = (P.x < B.x) ? -1 : 1;
        B.stateT -= dt;
        if (B.stateT <= 0) {
          B.state = 'charge';
          B.vx = B.facing * (hard ? 490 : 375);
          SFX.firm();
        }
      } else if (B.state === 'charge') {
        B.x += B.vx * dt;
        if (Math.random() < 0.4) spawnParticles(B.x + B.w / 2, GROUND_Y, '#cbd5e1', 1, 70);
        if (B.x <= ARENA_X + 34 || B.x + B.w >= ARENA_X + ARENA_W - 34) {
          B.x = Math.max(ARENA_X + 34, Math.min(ARENA_X + ARENA_W - B.w - 34, B.x));
          B.vx = 0;
          W4.shakeTime = 0.16;
          B.state = 'vulnerable';
          B.stateT = hard ? 0.95 : 1.55;
        }
      } else if (B.state === 'vulnerable') {
        B.stateT -= dt;
        if (B.stateT <= 0) {
          B.state = 'idle';
          B.stateT = hard ? 0.32 : 0.58;
        }
      } else if (B.state === 'airstrike_call') {
        B.stateT -= dt;
        if (B.stateT <= 0) {
          B.state = 'airstrike_wait';
          W4.heli.mode = 'airstrike';
          W4.heli.sweepDir = (B.airstrikesDone % 2 === 1) ? -1 : 1;
          W4.heli.x = W4.heli.sweepDir < 0 ? (ARENA_X + ARENA_W + 160) : (ARENA_X - 160);
          W4.heli.y = 104;
          W4.heli.burstDelay = 0.18;
        }
      }

      // Player <-> Boss Body Collision (Mario Stomp deals 1 dmg + safe bounce, else hurts Brayan)
      if (B.state !== 'defeated') {
        const pad = 10;
        if (P.x + P.w - pad > B.x + pad && P.x + pad < B.x + B.w - pad && P.y + P.h > B.y + 8 && P.y < B.y + B.h) {
          if (P.vy > 40 && (P.y + P.h - P.vy * dt) <= B.y + 42) {
            P.vy = -480;
            P.x += (P.x < B.x ? -28 : 28);
            damageBoss(1, B.x + B.w / 2, B.y + 14);
          } else {
            damagePlayer('boss');
          }
        }
      }
    } else if (W4.phase === 'BOSS_DEFEATED') {
      B.stateT -= dt;
      if (Math.random() < dt * 8) {
        spawnParticles(B.x + Math.random() * B.w, B.y + Math.random() * B.h, '#facc15', 6, 170);
      }
      if (B.stateT <= 0) {
        W4.status = 'VICTORY';
        W4.score += (hard ? 2000 : 1000) + P.hp * 250;
        SFX.victory();
        showOverlay('VICTORY', getOverlayConfig('VICTORY'));
      }
    }

    // Update Boss Sonic Speech Waves ("¡DE MALAS!")
    for (let i = W4.speechWaves.length - 1; i >= 0; i--) {
      const sw = W4.speechWaves[i];
      sw.x += sw.vx * dt;
      sw.life -= dt;
      if (P.x + P.w - 8 > sw.x - 42 && P.x + 8 < sw.x + 42 && P.y + P.h - 4 > sw.y - 22 && P.y + 6 < sw.y + 22) {
        W4.speechWaves.splice(i, 1);
        damagePlayer('speech');
        continue;
      }
      if (sw.life <= 0 || sw.x < ARENA_X - 80 || sw.x > ARENA_X + ARENA_W + 80) {
        W4.speechWaves.splice(i, 1);
      }
    }

    // Update Ground Airstrike Reticles
    for (let i = W4.airTargets.length - 1; i >= 0; i--) {
      W4.airTargets[i].life -= dt;
      if (W4.airTargets[i].life <= 0) W4.airTargets.splice(i, 1);
    }

    // Update Items (CVs & Empanadas)
    for (const it of W4.items) {
      if (it.got) continue;
      if (P.x + P.w > it.x - 16 && P.x < it.x + 16 && P.y + P.h > it.y - 16 && P.y < it.y + 16) {
        it.got = true;
        if (it.type === 'cv') {
          W4.score += 100;
          SFX.collect();
          addFloatText(it.x, it.y - 10, '+100 CV', '#38bdf8');
        } else {
          W4.score += 250;
          if (P.hp < P.maxHp) { P.hp++; addFloatText(it.x, it.y - 10, 'EMPANADA +1 ♥', '#fb923c'); }
          else addFloatText(it.x, it.y - 10, 'EMPANADA +250', '#fb923c');
          SFX.heal();
        }
        spawnParticles(it.x, it.y, '#facc15', 8, 120);
      }
    }

    // Particles & Floating Texts
    for (let i = W4.particles.length - 1; i >= 0; i--) {
      const pt = W4.particles[i];
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 320 * dt; pt.life -= dt;
      if (pt.life <= 0) W4.particles.splice(i, 1);
    }
    for (let i = W4.floatTexts.length - 1; i >= 0; i--) {
      const ft = W4.floatTexts[i];
      ft.y -= 34 * dt; ft.life -= dt;
      if (ft.life <= 0) W4.floatTexts.splice(i, 1);
    }
  },

  render(ctx) {
    renderWorld1_4(ctx, W4);
  }
};
