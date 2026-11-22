import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { SFX } from '../../core/audio.js';
import { DOM, showOverlay, hideOverlay, renderOverlayContent } from '../../core/ui.js';
import { stageManager } from '../../core/stageManager.js';
import { WORLD_1_1_CONFIG, createWorld1_1Entities } from './levelData.js';
import { renderWorld1_1 } from './world1_1Renderer.js';

const { groundY: GROUND_Y, levelLen: LEVEL_LEN, goalX: GOAL_X } = WORLD_1_1_CONFIG;

const W1 = {
  paused: false,
  status: 'PLAYING',
  time: 0,
  fadeIn: 1.0,
  camX: 0,
  shakeTime: 0,
  score: 0,
  cvCount: 0,
  chicletCount: 0,
  stompedCount: 0,
  player: {
    x: 110, y: GROUND_Y - 96, w: 42, h: 96,
    vx: 0, vy: 0, facing: 1, onGround: true,
    coyote: 0, jumpBuffer: 0, walkTimer: 0, walkFrame: 0,
    hp: 5, maxHp: 5, invuln: 0
  },
  keys: { left: false, right: false, jump: false, jumpHeld: false },
  platforms: [],
  enemies: [],
  projectiles: [],
  chazas: [],
  items: [],
  graffitis: [],
  particles: [],
  floatTexts: [],
  bgCars: []
};

function getOverlayConfig(kind) {
  const L = t();
  const stats = [
    { label: L.statScore, value: W1.score, color: '#facc15' },
    { label: L.statCV, value: W1.cvCount, color: '#38bdf8' },
    { label: L.statChiclets, value: W1.chicletCount, color: '#4ade80' },
    { label: L.statDefeated, value: W1.stompedCount, color: '#f472b6' }
  ];
  if (kind === 'PAUSE') {
    return { title: L.pauseTitle, sub: L.pauseSub, btnText: L.resumeBtn, stats };
  }
  if (kind === 'GAMEOVER') {
    return { title: L.gameOverTitle, sub: L.gameOverSub, btnText: L.retryBtn, stats };
  }
  return { title: L.victoryTitle, sub: L.victorySub, btnText: L.nextWorldBtn, stats };
}

function addFloatText(x, y, text, color = '#facc15') {
  W1.floatTexts.push({ x, y, text, color, life: 1.25 });
}

function spawnParticles(x, y, color, count = 8, spread = 120) {
  for (let i = 0; i < count; i++) {
    W1.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * spread,
      vy: -40 - Math.random() * spread * 0.9,
      size: 3 + Math.random() * 4,
      color,
      life: 0.45 + Math.random() * 0.35
    });
  }
}

function damagePlayer(sourceType = 'hit') {
  const P = W1.player;
  if (P.invuln > 0 || W1.status !== 'PLAYING') return;
  P.hp--;
  P.invuln = STATE.mode === 'heavy' ? 1.15 : 1.55;
  W1.shakeTime = 0.28;
  P.vy = -260;

  if (sourceType === 'nero') {
    SFX.snatch();
    const lost = Math.min(W1.score, STATE.mode === 'heavy' ? 200 : 100);
    W1.score -= lost;
    addFloatText(P.x + 20, P.y - 14, t().stolenTxt + (lost ? ` -${lost}` : ''), '#ef4444');
  } else {
    SFX.hurt();
    addFloatText(P.x + 20, P.y - 10, '-1 ♥', '#ef4444');
  }

  spawnParticles(P.x + P.w / 2, P.y + P.h / 2, '#ef4444', 10, 180);
  if (P.hp <= 0) {
    W1.status = 'GAMEOVER';
    SFX.gameover();
    showOverlay('GAMEOVER', getOverlayConfig('GAMEOVER'));
  }
}

function buildWorld1_1() {
  const hard = (STATE.mode === 'heavy');
  W1.paused = false;
  W1.status = 'PLAYING';
  W1.time = 0;
  W1.fadeIn = 1.0;
  W1.camX = 0;
  W1.shakeTime = 0;
  W1.score = 0;
  W1.cvCount = 0;
  W1.chicletCount = 0;
  W1.stompedCount = 0;

  W1.player = {
    x: 110, y: GROUND_Y - 96, w: 42, h: 96,
    vx: 0, vy: 0, facing: 1, onGround: true,
    coyote: 0, jumpBuffer: 0, walkTimer: 0, walkFrame: 0,
    hp: hard ? 3 : 5, maxHp: hard ? 3 : 5, invuln: 0
  };
  W1.keys = { left: false, right: false, jump: false, jumpHeld: false };
  W1.projectiles = [];
  W1.graffitis = [];
  W1.particles = [];
  W1.floatTexts = [];

  const entities = createWorld1_1Entities(hard);
  W1.platforms = entities.platforms;
  W1.enemies = entities.enemies;
  W1.chazas = entities.chazas;
  W1.items = entities.items;
  W1.bgCars = entities.bgCars;

  hideOverlay();
}

export const world1_1Stage = {
  enter() {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    DOM.world1Controls.style.display = 'flex';
    DOM.world2Controls.style.display = 'none';
    buildWorld1_1();
  },

  exit() {
    W1.keys = { left: false, right: false, jump: false, jumpHeld: false };
    DOM.world1Controls.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    const L = t();
    DOM.btnPause.textContent = W1.paused ? L.resumeBtn : L.pauseBtn;
    if (W1.paused || W1.status !== 'PLAYING') {
      const kind = DOM.overlay.dataset.kind || (W1.paused ? 'PAUSE' : W1.status);
      renderOverlayContent(getOverlayConfig(kind));
    }
  },

  onAction(action) {
    if (action === 'TOGGLE_PAUSE') {
      if (W1.status !== 'PLAYING') return;
      W1.paused = !W1.paused;
      SFX.blip();
      if (W1.paused) showOverlay('PAUSE', getOverlayConfig('PAUSE'));
      else hideOverlay();
      this.onLocalize();
    } else if (action === 'OVERLAY_PRIMARY') {
      SFX.select();
      const kind = DOM.overlay.dataset.kind;
      if (kind === 'PAUSE') {
        W1.paused = false;
        hideOverlay();
        this.onLocalize();
      } else if (kind === 'VICTORY') {
        SFX.start();
        stageManager.goTo('WORLD_1_2', { params: { carryScore: W1.score } });
      } else {
        buildWorld1_1();
        this.onLocalize();
      }
    }
  },

  onControl(control, pressed) {
    if (control === 'left' || control === 'right') {
      W1.keys[control] = pressed;
    } else if (control === 'jump') {
      W1.keys.jump = pressed;
      if (pressed) {
        W1.keys.jumpHeld = true;
        W1.player.jumpBuffer = 0.14;
      } else {
        W1.keys.jumpHeld = false;
      }
    }
  },

  onKeyDown(k, e) {
    if (k === 'p' || k === 'escape') {
      this.onAction('TOGGLE_PAUSE');
      return;
    }
    if (k === 'arrowleft' || k === 'a') W1.keys.left = true;
    if (k === 'arrowright' || k === 'd') W1.keys.right = true;
    if (k === ' ' || k === 'arrowup' || k === 'w') {
      e.preventDefault();
      if (!W1.keys.jumpHeld) W1.player.jumpBuffer = 0.14;
      W1.keys.jumpHeld = true;
    }
  },

  onKeyUp(k) {
    if (k === 'arrowleft' || k === 'a') W1.keys.left = false;
    if (k === 'arrowright' || k === 'd') W1.keys.right = false;
    if (k === ' ' || k === 'arrowup' || k === 'w') W1.keys.jumpHeld = false;
  },

  update(dt) {
    if (W1.paused || W1.status !== 'PLAYING') return;
    const hard = (STATE.mode === 'heavy');
    W1.time += dt;
    if (W1.fadeIn > 0) W1.fadeIn = Math.max(0, W1.fadeIn - dt * 0.9);
    if (W1.shakeTime > 0) W1.shakeTime = Math.max(0, W1.shakeTime - dt);

    const P = W1.player;
    if (P.invuln > 0) P.invuln = Math.max(0, P.invuln - dt);

    // Horizontal movement
    const moveSpd = 265;
    P.vx = 0;
    if (W1.keys.left) { P.vx = -moveSpd; P.facing = -1; }
    if (W1.keys.right) { P.vx = moveSpd; P.facing = 1; }
    P.x = Math.max(20, Math.min(LEVEL_LEN - 80, P.x + P.vx * dt));

    if (P.vx !== 0 && P.onGround) {
      P.walkTimer += dt;
      if (P.walkTimer > 0.14) {
        P.walkTimer = 0;
        P.walkFrame = 1 - P.walkFrame;
      }
    }

    // Coyote time & jump buffer
    if (P.onGround) P.coyote = 0.12;
    else P.coyote = Math.max(0, P.coyote - dt);
    if (P.jumpBuffer > 0) P.jumpBuffer = Math.max(0, P.jumpBuffer - dt);

    if (P.jumpBuffer > 0 && P.coyote > 0) {
      P.vy = -610;
      P.onGround = false;
      P.coyote = 0;
      P.jumpBuffer = 0;
      SFX.jump();
      spawnParticles(P.x + P.w / 2, P.y + P.h, '#e2e8f0', 5, 90);
    }

    // Variable jump height
    if (!W1.keys.jumpHeld && P.vy < -240) P.vy *= 0.85;

    // Gravity & one-way platform collisions
    const prevBottom = P.y + P.h;
    P.vy = Math.min(820, P.vy + 1480 * dt);
    P.y += P.vy * dt;
    P.onGround = false;

    if (P.vy >= 0) {
      for (const pl of W1.platforms) {
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
    if (P.y + P.h >= GROUND_Y) {
      P.y = GROUND_Y - P.h;
      P.vy = 0;
      P.onGround = true;
    }

    // Smooth camera follow
    const targetCam = Math.max(0, Math.min(LEVEL_LEN - 960, P.x - 320));
    W1.camX += (targetCam - W1.camX) * Math.min(1, dt * 8);

    // Background cars timers
    W1.bgCars.forEach((c) => {
      c.x += c.speed * dt;
      if (c.x > LEVEL_LEN + 400) c.x = -350;
      if (c.x < -380) c.x = LEVEL_LEN + 350;
    });

    // Enemies AI & Collisions
    for (const e of W1.enemies) {
      if (!e.alive) continue;
      e.animT += dt;
      const dist = (P.x + P.w / 2) - (e.x + e.w / 2);
      const absDist = Math.abs(dist);

      if (e.type === 'cartelera') {
        if (e.state === 'throw') {
          e.stateT -= dt;
          if (e.stateT <= 0) e.state = 'walk';
        } else {
          e.x += e.vx * dt;
          if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
          if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
          e.facing = e.vx >= 0 ? 1 : -1;
          e.cd -= dt;
          if (e.cd <= 0 && absDist < 480) {
            e.facing = dist >= 0 ? 1 : -1;
            e.state = 'throw';
            e.stateT = 0.36;
            e.cd = hard ? 1.55 : 2.35;
            const pSpd = hard ? 275 : 205;
            W1.projectiles.push({
              x: e.x + e.w / 2,
              y: e.y + 34,
              vx: e.facing * pSpd,
              vy: -95,
              rot: 0,
              motif: e.motif,
              life: 3.2
            });
            e.motif = (e.motif + 1) % 4;
            SFX.throwSign();
          }
        }
      } else if (e.type === 'grafitera') {
        if (e.state === 'walk') {
          e.x += e.vx * dt;
          if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
          if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
          e.facing = e.vx >= 0 ? 1 : -1;
          e.cd -= dt;
          if (e.cd <= 0 && absDist < 540) {
            e.state = 'shake';
            e.stateT = 0.55;
          }
        } else if (e.state === 'shake') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'spray_low';
            e.stateT = 0.75;
            SFX.spray();
          }
        } else if (e.state === 'spray_low') {
          e.stateT -= dt;
          if (Math.random() < 0.45) {
            spawnParticles(e.x + (e.facing > 0 ? e.w : 0), e.y + 52, ['#a855f7', '#22c55e', '#ec4899'][Math.floor(Math.random() * 3)], 1, 55);
          }
          if (e.stateT <= 0) {
            e.state = 'spray_high';
            e.stateT = 0.75;
            SFX.spray();
            if (W1.graffitis.length < 36) {
              W1.graffitis.push({
                x: e.x + (e.facing > 0 ? 22 : -46),
                y: GROUND_Y - 125 - Math.random() * 30,
                tagIdx: Math.floor(Math.random() * 4),
                color: ['#d946ef', '#4ade80', '#38bdf8', '#facc15'][Math.floor(Math.random() * 4)]
              });
            }
          }
        } else if (e.state === 'spray_high') {
          e.stateT -= dt;
          if (Math.random() < 0.45) {
            spawnParticles(e.x + (e.facing > 0 ? e.w : 0), e.y + 24, ['#a855f7', '#22c55e', '#38bdf8'][Math.floor(Math.random() * 3)], 1, 60);
          }
          if (e.stateT <= 0) {
            e.state = 'walk';
            e.cd = hard ? 2.2 : 3.2;
          }
        }
      } else if (e.type === 'nero') {
        if (e.state === 'lunge') {
          e.x += e.facing * (hard ? 228 : 172) * dt;
          e.x = Math.max(e.minX - 40, Math.min(e.maxX + 40, e.x));
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'walk';
            e.cd = hard ? 1.15 : 1.85;
          }
        } else {
          e.x += e.vx * dt;
          if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
          if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
          e.facing = e.vx >= 0 ? 1 : -1;
          e.cd = Math.max(0, e.cd - dt);
          if (e.cd <= 0 && absDist < 225 && Math.abs(P.y - e.y) < 90) {
            e.facing = dist >= 0 ? 1 : -1;
            e.state = 'lunge';
            e.stateT = 0.56;
            addFloatText(e.x + 20, e.y - 12, t().neroShout, '#38bdf8');
          }
        }
      }

      // Player <-> Enemy Collision (Stomp vs Hurt)
      const hitPad = 8;
      if (
        P.x + P.w - hitPad > e.x + hitPad && P.x + hitPad < e.x + e.w - hitPad &&
        P.y + P.h > e.y + 6 && P.y < e.y + e.h
      ) {
        if (P.vy > 40 && (P.y + P.h - P.vy * dt) <= e.y + 34) {
          e.alive = false;
          P.vy = -420;
          W1.score += 150;
          W1.stompedCount++;
          SFX.stomp();
          addFloatText(e.x + 20, e.y, '+150', '#4ade80');
          spawnParticles(e.x + e.w / 2, e.y + 30, '#facc15', 10, 160);
        } else {
          damagePlayer(e.type === 'nero' ? 'nero' : 'enemy');
        }
      }
    }

    // Update Projectiles
    for (let i = W1.projectiles.length - 1; i >= 0; i--) {
      const pr = W1.projectiles[i];
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.vy += 210 * dt;
      pr.rot += 7.5 * dt;
      pr.life -= dt;
      if (pr.y > GROUND_Y || pr.life <= 0) {
        W1.projectiles.splice(i, 1);
        continue;
      }
      if (
        P.x + P.w - 6 > pr.x - 16 && P.x + 6 < pr.x + 16 &&
        P.y + P.h - 6 > pr.y - 16 && P.y + 6 < pr.y + 16
      ) {
        W1.projectiles.splice(i, 1);
        damagePlayer('poster');
      }
    }

    // Update La Señora de la Chaza
    for (const ch of W1.chazas) {
      if (ch.bubbleT > 0) ch.bubbleT = Math.max(0, ch.bubbleT - dt);
      const dist = Math.abs((P.x + P.w / 2) - (ch.x + 48));
      if (dist < 92) {
        ch.smileT = 0.5;
        if (!ch.given) {
          ch.given = true;
          ch.bubbleT = 3.2;
          const healAmt = hard ? 1 : 2;
          const gained = Math.min(P.maxHp - P.hp, healAmt);
          P.hp = Math.min(P.maxHp, P.hp + healAmt);
          W1.chicletCount++;
          W1.score += 200;
          SFX.heal();
          addFloatText(ch.x + 42, ch.y - 12, gained > 0 ? `CHICLETS +${gained} ♥` : 'CHICLETS +200', '#4ade80');
          spawnParticles(ch.x + 48, ch.y + 30, '#fde047', 12, 140);
        }
      } else if (ch.smileT > 0) {
        ch.smileT = Math.max(0, ch.smileT - dt);
      }
    }

    // Collectibles
    for (const it of W1.items) {
      if (it.got) continue;
      if (P.x + P.w > it.x - 14 && P.x < it.x + 14 && P.y + P.h > it.y - 16 && P.y < it.y + 16) {
        it.got = true;
        if (it.type === 'cv') {
          W1.cvCount++;
          W1.score += 100;
          SFX.collect();
          addFloatText(it.x, it.y - 10, '+100 CV', '#38bdf8');
        } else {
          W1.score += 250;
          if (P.hp < P.maxHp) {
            P.hp++;
            addFloatText(it.x, it.y - 10, 'TINTO +1 ♥', '#fb923c');
          } else {
            addFloatText(it.x, it.y - 10, 'TINTO +250', '#fb923c');
          }
          SFX.heal();
        }
        spawnParticles(it.x, it.y, '#facc15', 7, 110);
      }
    }

    // Particles & Floating Texts
    for (let i = W1.particles.length - 1; i >= 0; i--) {
      const pt = W1.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 320 * dt;
      pt.life -= dt;
      if (pt.life <= 0) W1.particles.splice(i, 1);
    }
    for (let i = W1.floatTexts.length - 1; i >= 0; i--) {
      const ft = W1.floatTexts[i];
      ft.y -= 34 * dt;
      ft.life -= dt;
      if (ft.life <= 0) W1.floatTexts.splice(i, 1);
    }

    // Reach Goal (Plaza de Bolívar)
    if (P.x + P.w >= GOAL_X) {
      W1.status = 'VICTORY';
      W1.score += (hard ? 1000 : 500) + P.hp * 150;
      SFX.victory();
      showOverlay('VICTORY', getOverlayConfig('VICTORY'));
    }
  },

  render(ctx) {
    renderWorld1_1(ctx, W1);
  }
};
