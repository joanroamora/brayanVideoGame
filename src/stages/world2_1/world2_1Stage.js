import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { SFX } from '../../core/audio.js';
import { DOM, showOverlay, hideOverlay, renderOverlayContent } from '../../core/ui.js';
import { stageManager } from '../../core/stageManager.js';
import { WORLD_2_1_CONFIG, createWorld2_1Entities } from './levelData.js';
import { renderWorld2_1 } from './world2_1Renderer.js';

const { groundY: GROUND_Y, levelLen: LEVEL_LEN, goalX: GOAL_X } = WORLD_2_1_CONFIG;

const W21 = {
  paused: false,
  status: 'PLAYING', // 'PLAYING' | 'GAMEOVER' | 'VICTORY'
  time: 0,
  fadeIn: 1.0,
  camX: 0,
  shakeTime: 0,
  cameraFlashAlpha: 0,
  copyScanT: 0,
  score: 0,
  carryScore: 0,
  cvCount: 0,
  coinCount: 0,
  tintoCount: 0,
  koCount: 0,

  player: {
    x: 110, y: GROUND_Y - 96, w: 42, h: 96,
    vx: 0, vy: 0, facing: 1, onGround: true,
    crouching: false,
    coyote: 0, jumpBuffer: 0, walkTimer: 0, walkFrame: 0,
    attackTimer: 0, attackCd: 0, throwCd: 0,
    hp: 5, maxHp: 5, invuln: 0
  },

  keys: { left: false, right: false, crouch: false, jump: false, jumpHeld: false },

  platforms: [],
  enemies: [],
  tintoLadies: [],
  items: [],
  projectiles: [], // 'curse' | 'mud' | 'spout' | 'funa' | 'flash_shot' | 'mud_bomb'
  flashCones: [],  // Blinding selfie camera flash cones from Lalis
  puddles: [],     // Stinky toxic puddles left by splattered mud bombs
  briefcases: [],  // Brayan's spinning lawyer briefcases
  particles: [],
  floatTexts: []
};

function getOverlayConfig(kind) {
  const L = t();
  const stats = [
    { label: L.statScore, value: W21.score, color: '#facc15' },
    { label: L.w21StatKo, value: W21.koCount, color: '#f472b6' },
    { label: L.w21StatCoins, value: W21.coinCount, color: '#38bdf8' },
    { label: L.w21StatTintos, value: W21.tintoCount, color: '#4ade80' }
  ];
  if (kind === 'PAUSE') {
    return { title: L.w21PauseTitle, sub: L.w21PauseSub, btnText: L.resumeBtn, stats };
  }
  if (kind === 'GAMEOVER') {
    return { title: L.w21GameOverTitle, sub: L.w21GameOverSub, btnText: L.retryBtn, stats };
  }
  return { title: L.w21VictoryTitle, sub: L.w21VictorySub, btnText: L.nextWorld2_2Btn, stats };
}

function addFloatText(x, y, text, color = '#facc15') {
  W21.floatTexts.push({ x, y, text, color, life: 1.35 });
}

function spawnParticles(x, y, color, count = 8, spread = 140) {
  for (let i = 0; i < count; i++) {
    W21.particles.push({
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
  const P = W21.player;
  if (P.invuln > 0 || W21.status !== 'PLAYING') return;
  const L = t();
  P.hp--;
  P.invuln = STATE.mode === 'heavy' ? 1.1 : 1.5;
  W21.shakeTime = 0.3;
  P.vy = -255;

  let msg = '-1 ♥';
  let col = '#ef4444';
  if (source === 'curse') {
    msg = L.w21CurseHit;
    col = '#f97316';
    SFX.swearBuzz();
  } else if (source === 'flash') {
    msg = L.w21FlashHit;
    col = '#f472b6';
    W21.cameraFlashAlpha = Math.max(W21.cameraFlashAlpha, 0.55);
    SFX.cameraFlash();
  } else if (source === 'mud') {
    msg = L.w21MudHit;
    col = '#a3e635';
    SFX.mudSplat();
  } else if (source === 'whale') {
    msg = L.w21WhaleHit;
    col = '#38bdf8';
    SFX.whaleSpout();
  } else {
    SFX.hurt();
  }

  addFloatText(P.x + 20, P.y - 12, msg, col);
  spawnParticles(P.x + P.w / 2, P.y + P.h / 2, col, 10, 180);

  if (P.hp <= 0) {
    W21.status = 'GAMEOVER';
    SFX.gameover();
    showOverlay('GAMEOVER', getOverlayConfig('GAMEOVER'));
  }
}

function koEnemy(e, bonusLabel = '') {
  e.alive = false;
  W21.koCount++;
  const pts = (e.type === 'wally' || e.type === 'levy') ? 250 : 180;
  W21.score += pts;
  SFX.stomp();
  addFloatText(e.x + e.w / 2, e.y - 8, `+${pts}${bonusLabel ? ' ' + bonusLabel : ''}`, '#4ade80');
  spawnParticles(e.x + e.w / 2, e.y + 34, '#facc15', 12, 185);
}

function performBriefcaseAttack() {
  if (W21.paused || W21.status !== 'PLAYING') return;
  const P = W21.player;
  if (P.attackCd > 0) return;

  P.attackTimer = 0.25;
  P.attackCd = 0.34;
  SFX.briefcase();

  // Melee briefcase hitbox directly in front of Brayan
  const mx0 = P.facing > 0 ? (P.x + P.w - 4) : (P.x - 66);
  const mx1 = P.facing > 0 ? (P.x + P.w + 66) : (P.x + 4);
  const my0 = P.y + 6;
  const my1 = P.y + P.h - 4;

  // Knock out bodegueros in melee range
  for (const e of W21.enemies) {
    if (!e.alive) continue;
    if (e.x + e.w > mx0 && e.x < mx1 && e.y + e.h > my0 && e.y < my1) {
      koEnemy(e, 'KO!');
    }
  }

  // Swat away incoming toxic sludge / curses with melee briefcase!
  for (let i = W21.projectiles.length - 1; i >= 0; i--) {
    const pr = W21.projectiles[i];
    if (pr.x + 18 > mx0 && pr.x - 18 < mx1 && pr.y + 18 > my0 && pr.y - 18 < my1) {
      spawnParticles(pr.x, pr.y, '#fde047', 7, 130);
      W21.projectiles.splice(i, 1);
      W21.score += 50;
      addFloatText(pr.x, pr.y - 10, '+50', '#fde047');
    }
  }

  // Launch spinning thrown briefcase on short cooldown
  if (P.throwCd <= 0) {
    P.throwCd = 0.6;
    W21.briefcases.push({
      x: P.x + (P.facing > 0 ? P.w + 8 : -8),
      y: P.y + (P.crouching ? 24 : 38),
      vx: P.facing * 440,
      rot: 0,
      life: 0.95
    });
  }
}

function buildWorld2_1(carryScore = 0) {
  const hard = (STATE.mode === 'heavy');
  W21.paused = false;
  W21.status = 'PLAYING';
  W21.time = 0;
  W21.fadeIn = 1.0;
  W21.camX = 0;
  W21.shakeTime = 0;
  W21.cameraFlashAlpha = 0;
  W21.copyScanT = 0;
  W21.carryScore = carryScore;
  W21.score = carryScore;
  W21.cvCount = 0;
  W21.coinCount = 0;
  W21.tintoCount = 0;
  W21.koCount = 0;

  W21.player = {
    x: 110, y: GROUND_Y - 96, w: 42, h: 96,
    vx: 0, vy: 0, facing: 1, onGround: true,
    crouching: false,
    coyote: 0, jumpBuffer: 0, walkTimer: 0, walkFrame: 0,
    attackTimer: 0, attackCd: 0, throwCd: 0,
    hp: hard ? 3 : 5, maxHp: hard ? 3 : 5, invuln: 0
  };
  W21.keys = { left: false, right: false, crouch: false, jump: false, jumpHeld: false };

  const entities = createWorld2_1Entities(hard);
  W21.platforms = entities.platforms;
  W21.enemies = entities.enemies;
  W21.tintoLadies = entities.tintoLadies;
  W21.items = entities.items;

  W21.projectiles = [];
  W21.flashCones = [];
  W21.puddles = [];
  W21.briefcases = [];
  W21.particles = [];
  W21.floatTexts = [];

  hideOverlay();
}

export const world2_1Stage = {
  enter(params = {}) {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    DOM.world1Controls.style.display = 'none';
    DOM.world2Controls.style.display = 'none';
    DOM.world4Controls.style.display = 'flex';
    buildWorld2_1(params.carryScore || 0);
  },

  exit() {
    W21.keys = { left: false, right: false, crouch: false, jump: false, jumpHeld: false };
    DOM.world4Controls.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    const L = t();
    DOM.btnW4Pause.textContent = W21.paused ? L.resumeBtn : L.pauseBtn;
    if (W21.paused || W21.status !== 'PLAYING') {
      const kind = DOM.overlay.dataset.kind || (W21.paused ? 'PAUSE' : W21.status);
      renderOverlayContent(getOverlayConfig(kind));
    }
  },

  onAction(action) {
    if (action === 'TOGGLE_PAUSE') {
      if (W21.status !== 'PLAYING') return;
      W21.paused = !W21.paused;
      SFX.blip();
      if (W21.paused) showOverlay('PAUSE', getOverlayConfig('PAUSE'));
      else hideOverlay();
      this.onLocalize();
    } else if (action === 'OVERLAY_PRIMARY') {
      SFX.select();
      const kind = DOM.overlay.dataset.kind;
      if (kind === 'PAUSE') {
        W21.paused = false;
        hideOverlay();
        this.onLocalize();
      } else if (kind === 'VICTORY') {
        SFX.start();
        stageManager.goTo('CUTSCENE_2_1_TO_2_2', { params: { carryScore: W21.score } });
      } else {
        buildWorld2_1(W21.carryScore);
        this.onLocalize();
      }
    }
  },

  onControl(control, pressed) {
    if (control === 'left' || control === 'right' || control === 'crouch') {
      W21.keys[control] = pressed;
    } else if (control === 'jump') {
      W21.keys.jump = pressed;
      if (pressed) {
        W21.keys.jumpHeld = true;
        W21.player.jumpBuffer = 0.14;
      } else {
        W21.keys.jumpHeld = false;
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
    if (k === 'arrowleft' || k === 'a') W21.keys.left = true;
    if (k === 'arrowright' || k === 'd') W21.keys.right = true;
    if (k === 'arrowdown' || k === 's') { e.preventDefault(); W21.keys.crouch = true; }
    if (k === ' ' || k === 'arrowup' || k === 'w') {
      e.preventDefault();
      if (!W21.keys.jumpHeld) W21.player.jumpBuffer = 0.14;
      W21.keys.jumpHeld = true;
    }
    if (k === 'j' || k === 'z' || k === 'f' || k === 'shift' || k === 'k') {
      e.preventDefault();
      performBriefcaseAttack();
    }
  },

  onKeyUp(k) {
    if (k === 'arrowleft' || k === 'a') W21.keys.left = false;
    if (k === 'arrowright' || k === 'd') W21.keys.right = false;
    if (k === 'arrowdown' || k === 's') W21.keys.crouch = false;
    if (k === ' ' || k === 'arrowup' || k === 'w') W21.keys.jumpHeld = false;
  },

  update(dt) {
    if (W21.paused || W21.status !== 'PLAYING') {
      if (W21.status === 'VICTORY') W21.copyScanT += dt;
      return;
    }
    const hard = (STATE.mode === 'heavy');
    const L = t();
    W21.time += dt;
    if (W21.fadeIn > 0) W21.fadeIn = Math.max(0, W21.fadeIn - dt * 0.9);
    if (W21.shakeTime > 0) W21.shakeTime = Math.max(0, W21.shakeTime - dt);
    if (W21.cameraFlashAlpha > 0) W21.cameraFlashAlpha = Math.max(0, W21.cameraFlashAlpha - dt * 2.2);

    const P = W21.player;
    if (P.invuln > 0) P.invuln = Math.max(0, P.invuln - dt);
    if (P.attackTimer > 0) P.attackTimer = Math.max(0, P.attackTimer - dt);
    if (P.attackCd > 0) P.attackCd = Math.max(0, P.attackCd - dt);
    if (P.throwCd > 0) P.throwCd = Math.max(0, P.throwCd - dt);

    // =========================================================================
    // PLAYER PHYSICS (JUMP + CROUCH + ONE-WAY OFFICE PLATFORMS)
    // =========================================================================
    const wantsCrouch = W21.keys.crouch && P.onGround;
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
    if (W21.keys.left) { P.vx = -moveSpd; P.facing = -1; }
    if (W21.keys.right) { P.vx = moveSpd; P.facing = 1; }
    P.x = Math.max(20, Math.min(LEVEL_LEN - 80, P.x + P.vx * dt));

    if (P.vx !== 0 && P.onGround && !P.crouching) {
      P.walkTimer += dt;
      if (P.walkTimer > 0.13) { P.walkTimer = 0; P.walkFrame = 1 - P.walkFrame; }
    }

    if (P.onGround) P.coyote = 0.12;
    else P.coyote = Math.max(0, P.coyote - dt);
    if (P.jumpBuffer > 0) P.jumpBuffer = Math.max(0, P.jumpBuffer - dt);

    if (P.jumpBuffer > 0 && P.coyote > 0) {
      if (P.crouching) { P.crouching = false; P.y -= 38; P.h = 96; }
      P.vy = -625;
      P.onGround = false;
      P.coyote = 0;
      P.jumpBuffer = 0;
      SFX.jump();
      spawnParticles(P.x + P.w / 2, P.y + P.h, '#e2e8f0', 5, 90);
    }
    if (!W21.keys.jumpHeld && P.vy < -240) P.vy *= 0.85;

    const prevBottom = P.y + P.h;
    P.vy = Math.min(820, P.vy + 1480 * dt);
    P.y += P.vy * dt;
    P.onGround = false;

    if (P.vy >= 0) {
      for (const pl of W21.platforms) {
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

    // Smooth camera follow
    const targetCam = Math.max(0, Math.min(LEVEL_LEN - 960, P.x - 320));
    W21.camX += (targetCam - W21.camX) * Math.min(1, dt * 8);

    // =========================================================================
    // ENEMIES AI: HORDAS DE BODEGUEROS YOUTUBERS AMARILLISTAS
    // =========================================================================
    for (const e of W21.enemies) {
      if (!e.alive) continue;
      e.animT += dt;
      const dist = (P.x + P.w / 2) - (e.x + e.w / 2);
      const absDist = Math.abs(dist);
      const onScreen = e.x > W21.camX - 100 && e.x < W21.camX + 1060;

      // 1. LEVY — Furious swearing face of hate + toxic curse waves & mud!
      if (e.type === 'levy') {
        if (e.state === 'walk') {
          e.x += e.vx * dt;
          if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
          if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
          e.facing = e.vx >= 0 ? 1 : -1;
          e.cd -= dt;
          if (e.cd <= 0 && onScreen && absDist < 470) {
            e.facing = dist >= 0 ? 1 : -1;
            e.state = 'rage';
            e.stateT = hard ? 0.30 : 0.42;
            const curse = L.w21LevyCurses[e.shoutIdx % L.w21LevyCurses.length];
            e.shoutIdx++;
            e.activeCurse = curse;
            addFloatText(e.x + e.w / 2, e.y - 16, curse, '#ef4444');
            SFX.swearBuzz();
          }
        } else if (e.state === 'rage') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'attack';
            e.stateT = 0.28;
            const spd = hard ? 330 : 255;
            // Horizontal swearing hate-text shockwave! (Can duck or jump over)
            W21.projectiles.push({
              kind: 'curse',
              x: e.x + (e.facing > 0 ? e.w + 8 : -8),
              y: e.y + 30,
              vx: e.facing * spd,
              vy: 0,
              text: e.activeCurse || '¡#@$%&!',
              life: 2.6
            });
            // Also tosses a toxic brown mud splat in Hard mode (or every other rage)
            if (hard || e.shoutIdx % 2 === 0) {
              W21.projectiles.push({
                kind: 'mud',
                x: e.x + e.w / 2,
                y: e.y + 38,
                vx: e.facing * (hard ? 265 : 210),
                vy: -220,
                rot: 0,
                life: 2.2
              });
            }
            spawnParticles(e.x + (e.facing > 0 ? e.w : 0), e.y + 28, '#ef4444', 8, 140);
          }
        } else if (e.state === 'attack') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'walk';
            e.cd = hard ? 1.35 : 2.15;
          }
        }
      }

      // 2. WALLY BALLENA — Whale-spout clickbait fountain + bouncy belly lunge!
      else if (e.type === 'wally') {
        if (e.state === 'walk') {
          e.x += e.vx * dt;
          if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
          if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
          e.facing = e.vx >= 0 ? 1 : -1;
          e.cd -= dt;
          if (e.cd <= 0 && onScreen && absDist < 480) {
            e.facing = dist >= 0 ? 1 : -1;
            e.state = 'puff';
            e.stateT = hard ? 0.34 : 0.48;
            const shout = L.w21WallyShouts[e.shoutIdx % L.w21WallyShouts.length];
            e.shoutIdx++;
            addFloatText(e.x + e.w / 2, e.y - 18, shout, '#38bdf8');
            SFX.whaleSpout();
          }
        } else if (e.state === 'puff') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            if (e.pattern % 2 === 0 || absDist > 260) {
              // Whale blowhole fountain of 3 clickbait/sludge arcs!
              e.state = 'spout';
              e.stateT = 0.45;
              const spreads = [-145, 0, 145];
              for (const svx of spreads) {
                W21.projectiles.push({
                  kind: 'spout',
                  x: e.x + e.w / 2,
                  y: e.y - 4,
                  vx: e.facing * (hard ? 165 : 130) + svx * 0.72,
                  vy: -370 - Math.random() * 55,
                  rot: 0,
                  life: 2.5
                });
              }
              spawnParticles(e.x + e.w / 2, e.y - 6, '#38bdf8', 12, 160);
            } else {
              // Histrionic bouncy whale-belly lunge!
              e.state = 'charge';
              e.stateT = 0.62;
              e.vx = e.facing * (hard ? 265 : 205);
            }
            e.pattern++;
          }
        } else if (e.state === 'spout') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'walk';
            e.vx = e.facing * (hard ? 92 : 68);
            e.cd = hard ? 1.55 : 2.35;
          }
        } else if (e.state === 'charge') {
          e.x += e.vx * dt;
          e.x = Math.max(e.minX - 50, Math.min(e.maxX + 50, e.x));
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'walk';
            e.vx = e.facing * (hard ? 92 : 68);
            e.cd = hard ? 1.45 : 2.2;
          }
        }
      }

      // 3. LALIS — Ring-Light Selfie Influencer (Blinding Selfie Flash Cone + Funa Orb!)
      else if (e.type === 'lalis') {
        if (e.state === 'walk') {
          e.x += e.vx * dt;
          if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
          if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
          e.facing = e.vx >= 0 ? 1 : -1;
          e.cd -= dt;
          if (e.cd <= 0 && onScreen && absDist < 420) {
            e.facing = dist >= 0 ? 1 : -1;
            e.state = 'pose';
            e.stateT = hard ? 0.36 : 0.48;
            const line = L.w21LalisShouts[e.shoutIdx % L.w21LalisShouts.length];
            e.shoutIdx++;
            addFloatText(e.x + e.w / 2, e.y - 16, line, '#f472b6');
          }
        } else if (e.state === 'pose') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'flash';
            e.stateT = 0.32;
            SFX.cameraFlash();
            W21.cameraFlashAlpha = Math.max(W21.cameraFlashAlpha, 0.22);
            // Blinding Ring-Light Selfie Cone directly ahead!
            W21.flashCones.push({
              x: e.x + (e.facing > 0 ? e.w + 4 : -4),
              y: e.y + 30,
              dir: e.facing,
              reach: hard ? 185 : 155,
              life: 0.28,
              maxLife: 0.28
            });
            // Also fires a pink sensationalist "FUNA / SELFIE" orb!
            W21.projectiles.push({
              kind: 'funa',
              x: e.x + (e.facing > 0 ? e.w + 6 : -6),
              y: e.y + 34,
              vx: e.facing * (hard ? 290 : 225),
              vy: -30,
              life: 2.4
            });
          }
        } else if (e.state === 'flash') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'walk';
            e.cd = hard ? 1.5 : 2.3;
          }
        }
      }

      // 4. PAPARAZZI CÁMARA — Frantic DSLR Photos & Sprinting Chase!
      else if (e.type === 'camara') {
        if (e.state === 'walk') {
          e.x += e.vx * dt;
          if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
          if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
          e.facing = e.vx >= 0 ? 1 : -1;
          e.cd -= dt;
          if (e.cd <= 0 && onScreen && absDist < 430) {
            e.facing = dist >= 0 ? 1 : -1;
            e.state = 'snap_warn';
            e.stateT = hard ? 0.24 : 0.36;
            const line = L.w21CamaraShouts[e.shoutIdx % L.w21CamaraShouts.length];
            e.shoutIdx++;
            addFloatText(e.x + e.w / 2, e.y - 14, line, '#facc15');
          }
        } else if (e.state === 'snap_warn') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'sprint';
            e.stateT = 0.52;
            SFX.cameraFlash();
            // Fires a rapid horizontal Camera Flash Bolt!
            W21.projectiles.push({
              kind: 'flash_shot',
              x: e.x + (e.facing > 0 ? e.w + 8 : -8),
              y: e.y + 42,
              vx: e.facing * (hard ? 360 : 285),
              vy: 0,
              life: 2.1
            });
            spawnParticles(e.x + (e.facing > 0 ? e.w : 0), e.y + 42, '#fef08a', 7, 130);
          }
        } else if (e.state === 'sprint') {
          e.x += e.facing * (hard ? 225 : 170) * dt;
          e.x = Math.max(e.minX - 45, Math.min(e.maxX + 45, e.x));
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'walk';
            e.cd = hard ? 1.25 : 1.95;
          }
        }
      }

      // 5. STREAMER AMARILLISTA — Clickbait Screamer lobbing Toxic "MIERDA" Bombs!
      else if (e.type === 'streamer') {
        if (e.state === 'walk') {
          e.x += e.vx * dt;
          if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
          if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
          e.facing = e.vx >= 0 ? 1 : -1;
          e.cd -= dt;
          if (e.cd <= 0 && onScreen && absDist < 480) {
            e.facing = dist >= 0 ? 1 : -1;
            e.state = 'windup';
            e.stateT = hard ? 0.28 : 0.4;
            const line = L.w21StreamerShouts[e.shoutIdx % L.w21StreamerShouts.length];
            e.shoutIdx++;
            addFloatText(e.x + e.w / 2, e.y - 16, line, '#fb923c');
          }
        } else if (e.state === 'windup') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'throw';
            e.stateT = 0.26;
            const flightT = 0.82;
            const throwVx = Math.max(-330, Math.min(330, dist / flightT));
            W21.projectiles.push({
              kind: 'mud_bomb',
              x: e.x + e.w / 2,
              y: e.y + 24,
              vx: throwVx,
              vy: -335,
              rot: 0,
              life: 3.0
            });
            SFX.throwSign();
          }
        } else if (e.state === 'throw') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'walk';
            e.cd = hard ? 1.6 : 2.45;
          }
        }
      }

      // Player <-> Enemy Body Collision (Stomp from above vs Hurt)
      const pad = 8;
      if (
        P.x + P.w - pad > e.x + pad && P.x + pad < e.x + e.w - pad &&
        P.y + P.h > e.y + 6 && P.y < e.y + e.h
      ) {
        if (P.vy > 40 && (P.y + P.h - P.vy * dt) <= e.y + 40) {
          P.vy = -445;
          koEnemy(e);
        } else {
          damagePlayer(e.type === 'wally' ? 'whale' : 'enemy');
        }
      }
    }

    // =========================================================================
    // UPDATE PROJECTILES (CURSES, WHALE SPOUTS, TOXIC MUD BOMBS, FLASHES, FUNA)
    // =========================================================================
    for (let i = W21.projectiles.length - 1; i >= 0; i--) {
      const pr = W21.projectiles[i];
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
      if (pr.kind === 'mud' || pr.kind === 'spout' || pr.kind === 'mud_bomb') {
        pr.vy += (pr.kind === 'spout' ? 680 : 740) * dt;
        pr.rot = (pr.rot || 0) + 8 * dt;
      } else if (pr.kind === 'funa') {
        pr.y += Math.sin(W21.time * 10 + i) * 55 * dt;
      }

      // Hit Player
      const rX = pr.kind === 'curse' ? 42 : 15;
      const rY = pr.kind === 'curse' ? 14 : 15;
      if (
        P.x + P.w - 6 > pr.x - rX && P.x + 6 < pr.x + rX &&
        P.y + P.h - 4 > pr.y - rY && P.y + 4 < pr.y + rY
      ) {
        W21.projectiles.splice(i, 1);
        const src = pr.kind === 'curse' ? 'curse'
          : (pr.kind === 'flash_shot' || pr.kind === 'funa') ? 'flash'
          : pr.kind === 'spout' ? 'whale' : 'mud';
        damagePlayer(src);
        continue;
      }

      // Floor hit for arcing mud bombs -> temporary stinky toxic puddle!
      if (pr.y >= GROUND_Y - 6 && (pr.kind === 'mud_bomb' || pr.kind === 'mud' || pr.kind === 'spout')) {
        W21.projectiles.splice(i, 1);
        if (pr.kind === 'mud_bomb') {
          SFX.mudSplat();
          W21.puddles.push({ x: pr.x - 34, y: GROUND_Y - 14, w: 68, h: 14, life: hard ? 4.2 : 3.0 });
          spawnParticles(pr.x, GROUND_Y - 6, '#713f12', 10, 145);
          spawnParticles(pr.x, GROUND_Y - 8, '#84cc16', 5, 110);
        } else {
          spawnParticles(pr.x, GROUND_Y - 4, pr.kind === 'spout' ? '#38bdf8' : '#713f12', 6, 110);
        }
        continue;
      }

      if (pr.life <= 0 || pr.x < W21.camX - 180 || pr.x > W21.camX + 1160) {
        W21.projectiles.splice(i, 1);
      }
    }

    // Update Lalis Selfie Flash Cones
    for (let i = W21.flashCones.length - 1; i >= 0; i--) {
      const fc = W21.flashCones[i];
      fc.life -= dt;
      if (fc.life <= 0) { W21.flashCones.splice(i, 1); continue; }
      const x0 = fc.dir > 0 ? fc.x : (fc.x - fc.reach);
      const x1 = fc.dir > 0 ? (fc.x + fc.reach) : fc.x;
      if (P.x + P.w - 6 > x0 && P.x + 6 < x1 && P.y + P.h - 6 > fc.y - 38 && P.y + 6 < fc.y + 42) {
        damagePlayer('flash');
      }
    }

    // Update Temporary Toxic Mud Puddles
    for (let i = W21.puddles.length - 1; i >= 0; i--) {
      const pd = W21.puddles[i];
      pd.life -= dt;
      if (pd.life <= 0) { W21.puddles.splice(i, 1); continue; }
      if (P.x + P.w - 8 > pd.x && P.x + 8 < pd.x + pd.w && P.y + P.h > pd.y && P.y < GROUND_Y) {
        damagePlayer('mud');
      }
    }

    // Update Brayan's Thrown Briefcases
    for (let i = W21.briefcases.length - 1; i >= 0; i--) {
      const bc = W21.briefcases[i];
      bc.x += bc.vx * dt;
      bc.rot += 15 * dt;
      bc.life -= dt;

      let hit = false;
      for (const e of W21.enemies) {
        if (!e.alive) continue;
        if (bc.x + 16 > e.x && bc.x - 16 < e.x + e.w && bc.y + 14 > e.y && bc.y - 14 < e.y + e.h) {
          koEnemy(e, '💼!');
          hit = true;
          break;
        }
      }
      if (hit || bc.life <= 0 || bc.x < W21.camX - 40 || bc.x > W21.camX + 1000) {
        W21.briefcases.splice(i, 1);
      }
    }

    // Allied NPC: Doña Martha — La Señora de los Tintos de la Oficina!
    for (const tl of W21.tintoLadies) {
      if (tl.bubbleT > 0) tl.bubbleT = Math.max(0, tl.bubbleT - dt);
      const dist = Math.abs((P.x + P.w / 2) - (tl.x + 48));
      if (dist < 96) {
        tl.smileT = 0.5;
        if (!tl.given) {
          tl.given = true;
          tl.bubbleT = 3.6;
          const healAmt = hard ? 1 : 2;
          const gained = Math.min(P.maxHp - P.hp, healAmt);
          P.hp = Math.min(P.maxHp, P.hp + healAmt);
          W21.tintoCount++;
          W21.score += 200;
          SFX.heal();
          addFloatText(tl.x + 42, tl.y - 14, gained > 0 ? `TINTO +${gained} ♥` : 'TINTO +200', '#4ade80');
          spawnParticles(tl.x + 48, tl.y + 30, '#fde047', 12, 145);
        }
      } else if (tl.smileT > 0) {
        tl.smileT = Math.max(0, tl.smileT - dt);
      }
    }

    // Collectibles
    for (const it of W21.items) {
      if (it.got) continue;
      if (P.x + P.w > it.x - 16 && P.x < it.x + 16 && P.y + P.h > it.y - 16 && P.y < it.y + 16) {
        it.got = true;
        if (it.type === 'cv') {
          W21.cvCount++;
          W21.score += 100;
          SFX.collect();
          addFloatText(it.x, it.y - 10, '+100 CV', '#38bdf8');
        } else if (it.type === 'coin') {
          W21.coinCount++;
          W21.score += 200;
          SFX.coinGive();
          addFloatText(it.x, it.y - 10, '+200 $500', '#facc15');
        } else {
          W21.tintoCount++;
          W21.score += 250;
          if (P.hp < P.maxHp) {
            P.hp++;
            addFloatText(it.x, it.y - 10, 'TINTO +1 ♥', '#fb923c');
          } else {
            addFloatText(it.x, it.y - 10, 'TINTO +250', '#fb923c');
          }
          SFX.heal();
        }
        spawnParticles(it.x, it.y, '#facc15', 7, 115);
      }
    }

    // Particles & Floating Texts
    for (let i = W21.particles.length - 1; i >= 0; i--) {
      const pt = W21.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 320 * dt;
      pt.life -= dt;
      if (pt.life <= 0) W21.particles.splice(i, 1);
    }
    for (let i = W21.floatTexts.length - 1; i >= 0; i--) {
      const ft = W21.floatTexts[i];
      ft.y -= 34 * dt;
      ft.life -= dt;
      if (ft.life <= 0) W21.floatTexts.splice(i, 1);
    }

    // Reach Goal: LA FOTOCOPIADORA!
    if (P.x + P.w >= GOAL_X) {
      W21.status = 'VICTORY';
      W21.copyScanT = 0.01;
      W21.score += (hard ? 1500 : 850) + P.hp * 200;
      SFX.photocopy();
      setTimeout(() => SFX.victory(), 550);
      showOverlay('VICTORY', getOverlayConfig('VICTORY'));
    }
  },

  render(ctx) {
    renderWorld2_1(ctx, W21);
  }
};
