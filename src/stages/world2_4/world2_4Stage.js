import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { SFX } from '../../core/audio.js';
import { DOM, showOverlay, hideOverlay, renderOverlayContent } from '../../core/ui.js';
import { stageManager } from '../../core/stageManager.js';
import {
  WORLD_2_4_CONFIG,
  createWorld2_4Platforms,
  createWorld2_4Hazards,
  createWorld2_4OutboundEnemies,
  createWorld2_4ReturnEnemies,
  createWorld2_4Pickups
} from './levelData.js';
import { renderWorld2_4 } from './world2_4Renderer.js';

const { worldWidth: WORLD_W, groundY: GROUND_Y, homeDoorX: HOME_X, storeDoorX: STORE_X } = WORLD_2_4_CONFIG;

const W24 = {
  paused: false,
  status: 'PLAYING', // 'PLAYING' | 'GAMEOVER'
  phase: 'TO_STORE', // 'TO_STORE' | 'RETURN_HOME'
  time: 0,
  fadeIn: 1.0,
  camX: 0,
  shakeTime: 0,
  bannerTimer: 0,
  bannerText: '',
  bannerSub: '',

  carryScore: 0,
  score: 0,
  dogsDodged: 0,
  panCount: 0,
  coinCount: 0,

  player: null,
  keys: { left: false, right: false, jump: false },
  platforms: [],
  hazards: [],
  enemies: [],
  pickups: [],
  particles: [],
  floatTexts: []
};

function addFloatText(x, y, text, color = '#facc15') {
  W24.floatTexts.push({ x, y, text, color, life: 1.25 });
}

function spawnParticles(x, y, color, count = 8, speed = 135) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = speed * (0.35 + Math.random() * 0.75);
    W24.particles.push({
      x, y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 55,
      size: 3 + Math.random() * 4,
      color,
      life: 0.35 + Math.random() * 0.32
    });
  }
}

function hydrateEnemies(specs) {
  return specs.map((sp) => ({
    ...sp,
    y: GROUND_Y,
    vy: 0,
    onGround: true,
    w: sp.kind === 'bicitaxi' ? 116 : (sp.kind === 'ball' ? 34 : (sp.kind === 'vecina' ? 56 : 74)),
    h: sp.kind === 'bicitaxi' ? 92 : (sp.kind === 'ball' ? 34 : (sp.kind === 'vecina' ? 98 : 50)),
    aggro: false,
    barkCd: 0.4 + Math.random() * 1.0,
    stunT: 0,
    animT: Math.random() * 4,
    alive: true
  }));
}

function damagePlayer(label) {
  const P = W24.player;
  if (P.invuln > 0 || W24.status !== 'PLAYING') return;
  P.hp--;
  P.invuln = 1.45;
  P.vy = -310;
  P.vx = -P.facing * 200;
  W24.shakeTime = 0.25;
  SFX.hurt();
  spawnParticles(P.x + P.w * 0.5, P.y + P.h * 0.4, '#ef4444', 12, 175);
  addFloatText(P.x + P.w * 0.5, P.y - 14, label, '#f87171');

  if (P.hp <= 0) {
    W24.status = 'GAMEOVER';
    SFX.gameover();
    showOverlay('GAMEOVER', getOverlayConfig('GAMEOVER'));
  }
}

function getOverlayConfig(kind) {
  const L = t();
  const modeLabel = STATE.mode === 'light' ? L.modeBadgeLight : L.modeBadgeHeavy;
  const stats = [
    { label: L.statScore, value: String(W24.score).padStart(6, '0'), color: '#facc15' },
    { label: L.w24StatDogs, value: `${W24.dogsDodged}`, color: '#fb923c' },
    { label: L.w24StatPan, value: `${W24.panCount}`, color: '#4ade80' },
    { label: L.statMode, value: modeLabel, color: '#38bdf8' }
  ];
  if (kind === 'PAUSE') {
    return { title: L.w24PauseTitle, sub: L.w24PauseSub, btnText: L.resumeBtn, stats };
  }
  return { title: L.w24GameOverTitle, sub: L.w24GameOverSub, btnText: L.retryBtn, stats };
}

function buildWorld2_4(carryScore = 0) {
  const hard = (STATE.mode === 'heavy');
  W24.paused = false;
  W24.status = 'PLAYING';
  W24.phase = 'TO_STORE';
  W24.time = 0;
  W24.fadeIn = 1.0;
  W24.camX = 0;
  W24.shakeTime = 0;
  W24.bannerTimer = 3.2;
  W24.bannerText = t().w24StartBanner;
  W24.bannerSub = t().w24StartSub;

  W24.carryScore = carryScore;
  W24.score = carryScore;
  W24.dogsDodged = 0;
  W24.panCount = 0;
  W24.coinCount = 0;

  W24.player = {
    x: HOME_X - 24,
    y: GROUND_Y - 104,
    w: 44,
    h: 104,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: true,
    coyoteT: 0,
    jumpBufT: 0,
    walkTimer: 0,
    walkFrame: 0,
    hp: hard ? 3 : 5,
    maxHp: hard ? 3 : 5,
    invuln: 0,
    slipT: 0
  };
  W24.keys = { left: false, right: false, jump: false };

  W24.platforms = createWorld2_4Platforms();
  W24.hazards = createWorld2_4Hazards();
  W24.enemies = hydrateEnemies(createWorld2_4OutboundEnemies(hard));
  W24.pickups = createWorld2_4Pickups().map((pk) => ({ ...pk, got: false }));
  W24.particles = [];
  W24.floatTexts = [];

  hideOverlay();
}

function triggerShopPurchase() {
  const L = t();
  const hard = (STATE.mode === 'heavy');
  const P = W24.player;

  W24.phase = 'RETURN_HOME';
  W24.score += 600;
  if (P.hp < P.maxHp) P.hp++;
  P.facing = -1;
  P.invuln = Math.max(P.invuln, 1.2);

  SFX.shopBuy();
  spawnParticles(STORE_X, GROUND_Y - 60, '#4ade80', 18, 210);
  spawnParticles(STORE_X, GROUND_Y - 60, '#facc15', 14, 180);
  addFloatText(P.x + 22, P.y - 24, L.w24ShopToast, '#4ade80');

  W24.bannerTimer = 4.2;
  W24.bannerText = L.w24ReturnBanner;
  W24.bannerSub = L.w24ReturnSub;

  // Spawn fresh return-trip obstacles — packs of stray dogs smelling the chicken in the bag!
  W24.enemies = hydrateEnemies(createWorld2_4ReturnEnemies(hard));
  // Refresh Pau Pan & street heals for the return leg!
  W24.pickups = createWorld2_4Pickups().map((pk) => ({ ...pk, got: false }));
}

export const world2_4Stage = {
  enter(params = {}) {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    DOM.world1Controls.style.display = 'flex';
    DOM.world2Controls.style.display = 'none';
    DOM.world4Controls.style.display = 'none';
    if (DOM.world23Controls) DOM.world23Controls.style.display = 'none';
    buildWorld2_4(params.carryScore || 0);
  },

  exit() {
    W24.keys = { left: false, right: false, jump: false };
    DOM.world1Controls.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    if (W24.paused) renderOverlayContent(getOverlayConfig('PAUSE'));
    else if (W24.status === 'GAMEOVER') renderOverlayContent(getOverlayConfig('GAMEOVER'));
  },

  onAction(action) {
    if (action === 'TOGGLE_PAUSE') {
      if (W24.status !== 'PLAYING') return;
      W24.paused = !W24.paused;
      SFX.blip();
      if (W24.paused) showOverlay('PAUSE', getOverlayConfig('PAUSE'));
      else hideOverlay();
    } else if (action === 'OVERLAY_PRIMARY') {
      if (W24.paused) {
        W24.paused = false;
        hideOverlay();
        SFX.blip();
      } else {
        SFX.start();
        buildWorld2_4(W24.carryScore);
      }
    }
  },

  onControl(ctrl, pressed) {
    if (ctrl === 'left') W24.keys.left = pressed;
    else if (ctrl === 'right') W24.keys.right = pressed;
    else if (ctrl === 'jump') {
      if (pressed && !W24.keys.jump && W24.player) W24.player.jumpBufT = 0.14;
      W24.keys.jump = pressed;
    }
  },

  onKeyDown(k, e) {
    if (k === 'p' || k === 'escape') {
      this.onAction('TOGGLE_PAUSE');
      return;
    }
    if (W24.paused || W24.status !== 'PLAYING') {
      if (k === 'enter' || k === ' ') {
        e.preventDefault();
        this.onAction('OVERLAY_PRIMARY');
      }
      return;
    }
    if (k === 'arrowleft' || k === 'a') W24.keys.left = true;
    if (k === 'arrowright' || k === 'd') W24.keys.right = true;
    if (k === ' ' || k === 'arrowup' || k === 'w') {
      e.preventDefault();
      if (!W24.keys.jump) W24.player.jumpBufT = 0.14;
      W24.keys.jump = true;
    }
  },

  onKeyUp(k) {
    if (k === 'arrowleft' || k === 'a') W24.keys.left = false;
    if (k === 'arrowright' || k === 'd') W24.keys.right = false;
    if (k === ' ' || k === 'arrowup' || k === 'w') W24.keys.jump = false;
  },

  update(dt) {
    if (W24.paused || W24.status !== 'PLAYING') return;

    const L = t();
    const P = W24.player;
    const hard = (STATE.mode === 'heavy');

    W24.time += dt;
    if (W24.fadeIn > 0) W24.fadeIn = Math.max(0, W24.fadeIn - dt * 1.4);
    if (W24.shakeTime > 0) W24.shakeTime = Math.max(0, W24.shakeTime - dt);
    if (W24.bannerTimer > 0) W24.bannerTimer = Math.max(0, W24.bannerTimer - dt);
    if (P.invuln > 0) P.invuln = Math.max(0, P.invuln - dt);
    if (P.slipT > 0) P.slipT = Math.max(0, P.slipT - dt);
    if (P.jumpBufT > 0) P.jumpBufT = Math.max(0, P.jumpBufT - dt);

    // =========================================================================
    // 1. BRAYAN MOVEMENT (in Pintuco T-shirt, Shorts & Chanclas!)
    // =========================================================================
    const moveSpd = (P.slipT > 0 ? 150 : 288);
    let ax = 0;
    if (W24.keys.left) { ax -= 1; P.facing = -1; }
    if (W24.keys.right) { ax += 1; P.facing = 1; }

    if (ax !== 0) {
      P.vx += (ax * moveSpd - P.vx) * Math.min(1, dt * 15);
    } else {
      P.vx *= Math.pow(0.001, dt);
      if (Math.abs(P.vx) < 8) P.vx = 0;
    }

    if (P.onGround) P.coyoteT = 0.11;
    else P.coyoteT = Math.max(0, P.coyoteT - dt);

    if (P.jumpBufT > 0 && P.coyoteT > 0) {
      P.vy = -595;
      P.onGround = false;
      P.coyoteT = 0;
      P.jumpBufT = 0;
      SFX.jump();
      spawnParticles(P.x + P.w * 0.5, P.y + P.h, '#cbd5e1', 5, 85);
    }

    // Gravity
    const prevBottom = P.y + P.h;
    P.vy += 1480 * dt;
    P.x = Math.max(36, Math.min(WORLD_W - P.w - 36, P.x + P.vx * dt));
    P.y += P.vy * dt;

    // Platform one-way top landings (SUV roofs, benches, Pau Pan awning, fruver crates!)
    P.onGround = false;
    if (P.vy >= 0) {
      for (const pl of W24.platforms) {
        if (P.x + P.w - 6 > pl.x && P.x + 6 < pl.x + pl.w) {
          if (prevBottom <= pl.y + 8 && P.y + P.h >= pl.y) {
            P.y = pl.y - P.h;
            P.vy = 0;
            P.onGround = true;
            break;
          }
        }
      }
    }

    // Main Bosa La Esperanza sidewalk ground
    if (P.y + P.h >= GROUND_Y) {
      P.y = GROUND_Y - P.h;
      P.vy = 0;
      P.onGround = true;
    }

    // Walking chancla stride cycle
    if (P.onGround && Math.abs(P.vx) > 25) {
      P.walkTimer += dt * (Math.abs(P.vx) / 240);
      if (P.walkTimer > 0.16) {
        P.walkTimer = 0;
        P.walkFrame = 1 - P.walkFrame;
        if (Math.random() < 0.35) SFX.step();
      }
    } else {
      P.walkFrame = 0;
    }

    // Slippery soap puddles swept by vecinas
    if (P.onGround && P.slipT <= 0) {
      for (const hz of W24.hazards) {
        if (P.x + P.w - 8 > hz.x && P.x + 8 < hz.x + hz.w) {
          P.slipT = 0.65;
          addFloatText(P.x + 22, P.y - 12, L.w24SlipToast, '#38bdf8');
          spawnParticles(P.x + 22, GROUND_Y - 4, '#7dd3fc', 6, 90);
          SFX.spray();
          break;
        }
      }
    }

    // Smooth camera tracking
    const targetCam = Math.max(0, Math.min(WORLD_W - 960, P.x - (P.facing > 0 ? 340 : 540)));
    W24.camX += (targetCam - W24.camX) * Math.min(1, dt * 8.5);

    // =========================================================================
    // 2. UPDATE NEIGHBORHOOD OBSTACLES & CHASING STRAY DOGS!
    // =========================================================================
    const pcx = P.x + P.w * 0.5;
    const pcy = P.y + P.h * 0.5;

    for (const en of W24.enemies) {
      if (!en.alive) continue;
      en.animT += dt;
      if (en.stunT > 0) {
        en.stunT -= dt;
        continue;
      }

      if (en.kind === 'dog_chaser') {
        const dist = pcx - en.x;
        const absD = Math.abs(dist);
        if (!en.aggro && absD < en.aggroDist) {
          en.aggro = true;
          en.dir = dist >= 0 ? 1 : -1;
          SFX.dogBark();
          const line = (W24.phase === 'RETURN_HOME')
            ? L.w24DogChickenLines[Math.floor(Math.random() * L.w24DogChickenLines.length)]
            : L.w24DogLines[Math.floor(Math.random() * L.w24DogLines.length)];
          addFloatText(en.x, en.y - en.h - 14, line, '#fb923c');
        }

        if (en.aggro) {
          // Actively CHASE Brayan along Bosa La Esperanza!
          const desiredDir = dist >= 0 ? 1 : -1;
          if (absD > 32) en.dir = desiredDir;
          const chaseSpd = en.speed * (W24.phase === 'RETURN_HOME' ? 1.07 : 1.0);
          en.x += en.dir * chaseSpd * dt;
          en.x = Math.max(90, Math.min(WORLD_W - 90, en.x));

          // Energetic dog bark & occasional low lunge hop while chasing!
          en.barkCd -= dt;
          if (en.barkCd <= 0 && absD < 440) {
            en.barkCd = 1.9 + Math.random() * 1.4;
            SFX.dogBark();
            spawnParticles(en.x, en.y - 6, '#d6d3d1', 3, 60);
          }
          en.leapCd -= dt;
          if (en.leapCd <= 0 && en.onGround && absD < 210 && absD > 75) {
            en.leapCd = hard ? 1.5 : 2.1;
            en.vy = -310;
            en.onGround = false;
          }
          // If Brayan outruns a non-relentless dog by > 620px, it stops panting
          if (!en.relentless && absD > 620) en.aggro = false;
        } else {
          // Patrols near its corner sniffing around
          en.x += en.dir * 52 * dt;
          if (Math.sin(en.animT * 1.1) > 0.96) en.dir *= -1;
        }

        // Dog gravity
        if (!en.onGround) {
          en.vy += 1200 * dt;
          en.y += en.vy * dt;
          if (en.y >= GROUND_Y) {
            en.y = GROUND_Y;
            en.vy = 0;
            en.onGround = true;
          }
        }
      } else if (en.kind === 'bicitaxi') {
        en.x += en.dir * en.speed * dt;
        if (en.x < en.minX) { en.x = en.minX; en.dir = 1; }
        if (en.x > en.maxX) { en.x = en.maxX; en.dir = -1; }
        en.barkCd -= dt;
        if (en.barkCd <= 0 && Math.abs(pcx - en.x) < 380) {
          en.barkCd = 2.6;
          SFX.biciBell();
          addFloatText(en.x, en.y - en.h - 16, L.w24BiciShout, '#38bdf8');
        }
      } else if (en.kind === 'vecina') {
        en.x += en.dir * en.speed * dt;
        if (en.x < en.minX) { en.x = en.minX; en.dir = 1; }
        if (en.x > en.maxX) { en.x = en.maxX; en.dir = -1; }
        en.barkCd -= dt;
        if (en.barkCd <= 0 && Math.abs(pcx - en.x) < 280) {
          en.barkCd = 3.2;
          addFloatText(en.x, en.y - en.h - 12, L.w24VecinaShout, '#f472b6');
        }
      } else if (en.kind === 'ball') {
        en.x += en.dir * en.speed * dt;
        if (en.x < 1920) en.dir = 1;
        if (en.x > 4980) en.dir = -1;
        en.y = GROUND_Y - Math.abs(Math.sin(en.animT * 5.2 + en.bouncePhase)) * 102;
      }

      // Collision check with Brayan
      const ex0 = en.x - en.w * 0.42;
      const ex1 = en.x + en.w * 0.42;
      const ey0 = en.y - en.h + 8;
      const ey1 = en.y;

      if (P.x + P.w - 6 > ex0 && P.x + 6 < ex1 && P.y + P.h > ey0 && P.y + 10 < ey1) {
        const stomping = (P.vy > 85 && (P.y + P.h) < (ey0 + en.h * 0.52));
        if (stomping && (en.kind === 'dog_chaser' || en.kind === 'ball')) {
          // Bounce cleanly off a soccer ball OR hop/shoo a chasing stray dog ("¡SHOO! ¡CHITE!")
          P.vy = -460;
          W24.score += 150;
          if (en.kind === 'dog_chaser') {
            en.stunT = 2.0;
            en.aggro = false;
            W24.dogsDodged++;
            addFloatText(en.x, en.y - en.h - 14, L.w24DogShoo, '#4ade80');
          } else {
            addFloatText(en.x, en.y - 44, L.w24BallBounce, '#facc15');
          }
          SFX.stomp();
          spawnParticles(en.x, ey0, '#fde047', 8, 120);
        } else {
          const hitLbl = (en.kind === 'dog_chaser') ? L.w24HitDog
            : (en.kind === 'bicitaxi') ? L.w24HitBici
            : (en.kind === 'vecina') ? L.w24HitVecina
            : L.w24HitBall;
          damagePlayer(hitLbl);
        }
      }
    }

    // =========================================================================
    // 3. PICKUPS (Coins $500 & Fresh Pan from Panadería Pau Pan R.D.!)
    // =========================================================================
    for (const pk of W24.pickups) {
      if (pk.got) continue;
      if (Math.abs(pcx - pk.x) < 34 && Math.abs(pcy - pk.y) < 52) {
        pk.got = true;
        if (pk.type === 'pan') {
          W24.panCount++;
          W24.score += 200;
          if (P.hp < P.maxHp) {
            P.hp++;
            addFloatText(pk.x, pk.y - 26, 'PAU PAN +1 ♥', '#4ade80');
          } else {
            addFloatText(pk.x, pk.y - 26, 'PAU PAN +200', '#4ade80');
          }
          SFX.heal();
        } else {
          W24.coinCount++;
          W24.score += 120;
          addFloatText(pk.x, pk.y - 24, '+120 $500', '#facc15');
          SFX.coinGive();
        }
        spawnParticles(pk.x, pk.y, '#fde047', 7, 110);
      }
    }

    // =========================================================================
    // 4. PHASE 1 GOAL (TIENDA LA ESPERANZA) & PHASE 2 GOAL (REGRESO A INTERIOR 92!)
    // =========================================================================
    if (W24.phase === 'TO_STORE' && pcx >= STORE_X - 48) {
      triggerShopPurchase();
    } else if (W24.phase === 'RETURN_HOME' && pcx <= HOME_X + 36) {
      // Arrived safely back home at Interior 92 with the lunch bag -> Trigger Cutscene 2-4 -> 2-5!
      const finalScore = W24.score + (hard ? 1800 : 1200) + P.hp * 220;
      SFX.victory();
      stageManager.goTo('CUTSCENE_2_4_TO_2_5', {
        params: {
          carryScore: finalScore,
          dogsDodged: W24.dogsDodged,
          panCount: W24.panCount
        }
      });
      return;
    }

    // Update particles & floating texts
    for (let i = W24.particles.length - 1; i >= 0; i--) {
      const pt = W24.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 380 * dt;
      pt.life -= dt;
      if (pt.life <= 0) W24.particles.splice(i, 1);
    }
    for (let i = W24.floatTexts.length - 1; i >= 0; i--) {
      const ft = W24.floatTexts[i];
      ft.y -= 30 * dt;
      ft.life -= dt;
      if (ft.life <= 0) W24.floatTexts.splice(i, 1);
    }
  },

  render(ctx) {
    renderWorld2_4(ctx, W24);
  }
};
