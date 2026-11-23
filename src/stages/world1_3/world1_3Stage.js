import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { SFX } from '../../core/audio.js';
import { DOM, showOverlay, hideOverlay, renderOverlayContent } from '../../core/ui.js';
import { stageManager } from '../../core/stageManager.js';
import { WORLD_1_3_CONFIG, createWorld1_3Entities } from './levelData.js';
import { renderWorld1_3 } from './world1_3Renderer.js';

const { groundY: GROUND_Y, levelLen: LEVEL_LEN, goalX: GOAL_X } = WORLD_1_3_CONFIG;

const W3 = {
  paused: false,
  status: 'PLAYING',
  time: 0,
  fadeIn: 1.0,
  camX: 0,
  shakeTime: 0,
  score: 0,
  carryScore: 0,
  cvCount: 0,
  tokenCount: 0,
  singerCount: 0,
  stompedCount: 0,
  player: {
    x: 110, y: GROUND_Y - 96, w: 42, h: 96,
    vx: 0, vy: 0, facing: 1, onGround: true,
    coyote: 0, jumpBuffer: 0, walkTimer: 0, walkFrame: 0,
    hp: 5, maxHp: 5, invuln: 0
  },
  keys: { left: false, right: false, jump: false, jumpHeld: false },
  bgBuses: [],
  platforms: [],
  turnstiles: [],
  enemies: [],
  singers: [],
  items: [],
  particles: [],
  musicNotes: [],
  floatTexts: []
};

function getOverlayConfig(kind) {
  const L = t();
  const stats = [
    { label: L.statScore, value: W3.score, color: '#facc15' },
    { label: L.w3StatColados, value: W3.stompedCount, color: '#f472b6' },
    { label: L.w3StatSingers, value: W3.singerCount, color: '#4ade80' },
    { label: L.w3StatTokens, value: W3.tokenCount, color: '#38bdf8' }
  ];
  if (kind === 'PAUSE') {
    return { title: L.w3PauseTitle, sub: L.w3PauseSub, btnText: L.resumeBtn, stats };
  }
  if (kind === 'GAMEOVER') {
    return { title: L.w3GameOverTitle, sub: L.w3GameOverSub, btnText: L.retryBtn, stats };
  }
  return { title: L.w3VictoryTitle, sub: L.w3VictorySub, btnText: L.nextWorld1_4Btn, stats };
}

function addFloatText(x, y, text, color = '#facc15') {
  W3.floatTexts.push({ x, y, text, color, life: 1.35 });
}

function spawnParticles(x, y, color, count = 8, spread = 130) {
  for (let i = 0; i < count; i++) {
    W3.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * spread,
      vy: -45 - Math.random() * spread * 0.9,
      size: 3 + Math.random() * 4,
      color,
      life: 0.42 + Math.random() * 0.35
    });
  }
}

function spawnMusicNotes(x, y, count = 10) {
  const glyphs = ['♪', '♫', '♬'];
  const colors = ['#38bdf8', '#facc15', '#f472b6', '#4ade80'];
  for (let i = 0; i < count; i++) {
    W3.musicNotes.push({
      x: x + (Math.random() - 0.5) * 60,
      y: y - Math.random() * 35,
      vx: (Math.random() - 0.5) * 75,
      vy: -65 - Math.random() * 75,
      glyph: glyphs[i % glyphs.length],
      color: colors[i % colors.length],
      life: 1.1 + Math.random() * 0.6
    });
  }
}

function damagePlayer(sourceType = 'hit') {
  const P = W3.player;
  if (P.invuln > 0 || W3.status !== 'PLAYING') return;
  P.hp--;
  P.invuln = STATE.mode === 'heavy' ? 1.1 : 1.5;
  W3.shakeTime = 0.3;
  P.vy = -265;

  if (sourceType === 'whip') {
    SFX.whip();
    addFloatText(P.x + 20, P.y - 14, t().w3WhipHit, '#f97316');
    spawnParticles(P.x + P.w / 2, P.y + 38, '#fef08a', 12, 200);
  } else if (sourceType === 'colado') {
    SFX.snatch();
    addFloatText(P.x + 20, P.y - 12, '-1 ♥', '#ef4444');
    spawnParticles(P.x + P.w / 2, P.y + P.h / 2, '#ef4444', 10, 175);
  } else {
    SFX.hurt();
    addFloatText(P.x + 20, P.y - 10, '-1 ♥', '#ef4444');
    spawnParticles(P.x + P.w / 2, P.y + P.h / 2, '#ef4444', 10, 175);
  }

  if (P.hp <= 0) {
    W3.status = 'GAMEOVER';
    SFX.gameover();
    showOverlay('GAMEOVER', getOverlayConfig('GAMEOVER'));
  }
}

function buildWorld1_3(carryScore = 0) {
  const hard = (STATE.mode === 'heavy');
  W3.paused = false;
  W3.status = 'PLAYING';
  W3.time = 0;
  W3.fadeIn = 1.0;
  W3.camX = 0;
  W3.shakeTime = 0;
  W3.carryScore = carryScore;
  W3.score = carryScore;
  W3.cvCount = 0;
  W3.tokenCount = 0;
  W3.singerCount = 0;
  W3.stompedCount = 0;

  W3.player = {
    x: 110, y: GROUND_Y - 96, w: 42, h: 96,
    vx: 0, vy: 0, facing: 1, onGround: true,
    coyote: 0, jumpBuffer: 0, walkTimer: 0, walkFrame: 0,
    hp: hard ? 3 : 5, maxHp: hard ? 3 : 5, invuln: 0
  };
  W3.keys = { left: false, right: false, jump: false, jumpHeld: false };
  W3.particles = [];
  W3.musicNotes = [];
  W3.floatTexts = [];

  const entities = createWorld1_3Entities(hard);
  W3.bgBuses = entities.bgBuses;
  W3.platforms = entities.platforms;
  W3.turnstiles = entities.turnstiles;
  W3.enemies = entities.enemies;
  W3.singers = entities.singers;
  W3.items = entities.items;

  hideOverlay();
}

export const world1_3Stage = {
  enter(params = {}) {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    DOM.world1Controls.style.display = 'flex';
    DOM.world2Controls.style.display = 'none';
    buildWorld1_3(params.carryScore || 0);
  },

  exit() {
    W3.keys = { left: false, right: false, jump: false, jumpHeld: false };
    DOM.world1Controls.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    const L = t();
    DOM.btnPause.textContent = W3.paused ? L.resumeBtn : L.pauseBtn;
    if (W3.paused || W3.status !== 'PLAYING') {
      const kind = DOM.overlay.dataset.kind || (W3.paused ? 'PAUSE' : W3.status);
      renderOverlayContent(getOverlayConfig(kind));
    }
  },

  onAction(action) {
    if (action === 'TOGGLE_PAUSE') {
      if (W3.status !== 'PLAYING') return;
      W3.paused = !W3.paused;
      SFX.blip();
      if (W3.paused) showOverlay('PAUSE', getOverlayConfig('PAUSE'));
      else hideOverlay();
      this.onLocalize();
    } else if (action === 'OVERLAY_PRIMARY') {
      SFX.select();
      if (DOM.overlay.dataset.kind === 'PAUSE') {
        W3.paused = false;
        hideOverlay();
        this.onLocalize();
      } else if (DOM.overlay.dataset.kind === 'VICTORY') {
        SFX.start();
        stageManager.goTo('WORLD_1_4', { params: { carryScore: W3.score } });
      } else {
        buildWorld1_3(W3.carryScore);
        this.onLocalize();
      }
    }
  },

  onControl(control, pressed) {
    if (control === 'left' || control === 'right') {
      W3.keys[control] = pressed;
    } else if (control === 'jump') {
      W3.keys.jump = pressed;
      if (pressed) {
        W3.keys.jumpHeld = true;
        W3.player.jumpBuffer = 0.14;
      } else {
        W3.keys.jumpHeld = false;
      }
    }
  },

  onKeyDown(k, e) {
    if (k === 'p' || k === 'escape') {
      this.onAction('TOGGLE_PAUSE');
      return;
    }
    if (k === 'arrowleft' || k === 'a') W3.keys.left = true;
    if (k === 'arrowright' || k === 'd') W3.keys.right = true;
    if (k === ' ' || k === 'arrowup' || k === 'w') {
      e.preventDefault();
      if (!W3.keys.jumpHeld) W3.player.jumpBuffer = 0.14;
      W3.keys.jumpHeld = true;
    }
  },

  onKeyUp(k) {
    if (k === 'arrowleft' || k === 'a') W3.keys.left = false;
    if (k === 'arrowright' || k === 'd') W3.keys.right = false;
    if (k === ' ' || k === 'arrowup' || k === 'w') W3.keys.jumpHeld = false;
  },

  update(dt) {
    if (W3.paused || W3.status !== 'PLAYING') return;
    const hard = (STATE.mode === 'heavy');
    const L = t();
    W3.time += dt;
    if (W3.fadeIn > 0) W3.fadeIn = Math.max(0, W3.fadeIn - dt * 0.9);
    if (W3.shakeTime > 0) W3.shakeTime = Math.max(0, W3.shakeTime - dt);

    const P = W3.player;
    if (P.invuln > 0) P.invuln = Math.max(0, P.invuln - dt);

    // Player movement (identical Mario-style feel to World 1-1)
    const moveSpd = 270;
    P.vx = 0;
    if (W3.keys.left) { P.vx = -moveSpd; P.facing = -1; }
    if (W3.keys.right) { P.vx = moveSpd; P.facing = 1; }
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
      P.vy = -620;
      P.onGround = false;
      P.coyote = 0;
      P.jumpBuffer = 0;
      SFX.jump();
      spawnParticles(P.x + P.w / 2, P.y + P.h, '#e2e8f0', 5, 95);
    }

    if (!W3.keys.jumpHeld && P.vy < -240) P.vy *= 0.85;

    // Gravity & One-way vertical platforms
    const prevBottom = P.y + P.h;
    P.vy = Math.min(820, P.vy + 1480 * dt);
    P.y += P.vy * dt;
    P.onGround = false;

    if (P.vy >= 0) {
      for (const pl of W3.platforms) {
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
    W3.camX += (targetCam - W3.camX) * Math.min(1, dt * 8);

    // Dynamic Passing Red Articulated Buses & Green Alimentadores
    for (const bus of W3.bgBuses) {
      bus.x += bus.speed * dt;
      if (bus.x > LEVEL_LEN + 500) bus.x = -420;
      if (bus.x < -460) bus.x = LEVEL_LEN + 420;
    }

    // Update Enemies: El Jefe del Fruver & Los Colados
    for (const e of W3.enemies) {
      if (!e.alive) continue;
      e.animT += dt;
      const dist = (P.x + P.w / 2) - (e.x + e.w / 2);
      const absDist = Math.abs(dist);
      const sameBand = Math.abs((P.y + P.h) - (e.y + e.h)) < 115;

      if (e.type === 'fruver') {
        const triggerRange = hard ? 275 : 225;
        const whipReach = hard ? 114 : 88;

        if (e.state === 'walk') {
          e.x += e.vx * dt;
          if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
          if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
          e.facing = e.vx >= 0 ? 1 : -1;
          e.cd = Math.max(0, e.cd - dt);

          if (e.cd <= 0 && absDist < triggerRange && sameBand) {
            e.facing = dist >= 0 ? 1 : -1;
            e.state = 'windup';
            e.stateT = hard ? 0.24 : 0.38;
            e.whipSparkSpawned = false;
            addFloatText(e.x + e.w / 2, e.y - 12, L.w3FruverShouts[e.shoutIdx % L.w3FruverShouts.length], '#f97316');
            e.shoutIdx++;
          }
        } else if (e.state === 'windup') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'whip';
            e.stateT = hard ? 0.44 : 0.38;
            SFX.whip();
            W3.shakeTime = Math.max(W3.shakeTime, 0.12);
          }
        } else if (e.state === 'whip') {
          e.stateT -= dt;
          if (!e.whipSparkSpawned) {
            e.whipSparkSpawned = true;
            const tipX = e.facing > 0 ? (e.x + e.w + whipReach - 10) : (e.x - whipReach + 10);
            spawnParticles(tipX, e.y + 42, '#fef08a', 9, 145);
          }
          // Check extended whip-crack hitbox!
          const whipX0 = e.facing > 0 ? (e.x + e.w - 8) : (e.x - whipReach);
          const whipX1 = e.facing > 0 ? (e.x + e.w + whipReach) : (e.x + 8);
          const whipY0 = e.y + 18;
          const whipY1 = e.y + 72;
          if (P.x + P.w - 6 > whipX0 && P.x + 6 < whipX1 && P.y + P.h - 6 > whipY0 && P.y + 8 < whipY1) {
            damagePlayer('whip');
          }
          if (e.stateT <= 0) {
            e.state = 'recover';
            e.stateT = hard ? 0.42 : 0.85;
          }
        } else if (e.state === 'recover') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'walk';
            e.cd = hard ? 0.55 : 1.25;
            e.vx = e.facing * (hard ? 132 : 95);
          }
        }
      } else if (e.type === 'colado') {
        if (e.state === 'lurk') {
          const detectRange = hard ? 540 : 465;
          if (absDist < detectRange && e.x > W3.camX - 40 && e.x < W3.camX + 990) {
            e.stateT -= dt;
            if (e.stateT <= 0) {
              e.state = 'vault';
              e.vaultT = 0;
              e.facing = dist >= 0 ? 1 : -1;
              e.vaultStartX = e.x;
              SFX.vault();
              addFloatText(e.gateX + 18, GROUND_Y - 115, L.w3ColadoShouts[e.variant % L.w3ColadoShouts.length], '#4ade80');
            }
          }
        } else if (e.state === 'vault') {
          // Clear athletic parkour vault over the turnstile bar!
          e.vaultT += dt / 0.46;
          const tFrac = Math.min(1, e.vaultT);
          e.x = e.vaultStartX + e.facing * (tFrac * 78);
          e.y = (GROUND_Y - e.h) - Math.sin(tFrac * Math.PI) * 76;
          if (tFrac >= 1) {
            e.y = GROUND_Y - e.h;
            e.state = 'sprint';
            e.vx = e.facing * (hard ? 310 : 235);
            spawnParticles(e.x + e.w / 2, GROUND_Y, '#cbd5e1', 7, 110);
          }
        } else if (e.state === 'sprint') {
          e.x += e.vx * dt;
          // Occasional agile street hop while sprinting!
          e.hopCd -= dt;
          if (e.y >= GROUND_Y - e.h && e.hopCd <= 0 && absDist < 240) {
            e.vy = -340;
            e.hopCd = hard ? 1.15 : 1.7;
            spawnParticles(e.x + e.w / 2, GROUND_Y, '#94a3b8', 4, 80);
          }
          if (e.vy !== 0 || e.y < GROUND_Y - e.h) {
            e.vy += 1280 * dt;
            e.y += e.vy * dt;
            if (e.y >= GROUND_Y - e.h) {
              e.y = GROUND_Y - e.h;
              e.vy = 0;
            }
          }
          // Despawn cleanly if dashed far off screen
          if (e.x < W3.camX - 360 || e.x > W3.camX + 1320) {
            e.alive = false;
          }
        }
      }

      // Skip body collision while colado is still hidden behind turnstile
      if (e.type === 'colado' && e.state === 'lurk') continue;

      // Player <-> Enemy Collision (Stomp vs Hurt)
      const hitPad = 8;
      if (
        P.x + P.w - hitPad > e.x + hitPad && P.x + hitPad < e.x + e.w - hitPad &&
        P.y + P.h > e.y + 6 && P.y < e.y + e.h
      ) {
        if (P.vy > 40 && (P.y + P.h - P.vy * dt) <= e.y + 38) {
          e.alive = false;
          P.vy = -440;
          const pts = e.type === 'fruver' ? 250 : 180;
          W3.score += pts;
          W3.stompedCount++;
          SFX.stomp();
          addFloatText(e.x + 20, e.y, `+${pts}`, '#4ade80');
          spawnParticles(e.x + e.w / 2, e.y + 30, '#facc15', 12, 175);
        } else {
          damagePlayer(e.type === 'colado' ? 'colado' : 'enemy');
        }
      }
    }

    // Allied NPC: Cantante Callejero de TransMilenio (Brayan gives coin -> heals hearts with music!)
    for (const sg of W3.singers) {
      if (sg.bubbleT > 0) sg.bubbleT = Math.max(0, sg.bubbleT - dt);
      if (sg.grooveT > 0) sg.grooveT = Math.max(0, sg.grooveT - dt);
      if (sg.coinArcT > 0) sg.coinArcT = Math.max(0, sg.coinArcT - dt);

      // Ambient musical note while player is nearby
      const dist = Math.abs((P.x + P.w / 2) - (sg.x + 48));
      if (dist < 320 && Math.random() < dt * 1.6) {
        spawnMusicNotes(sg.x + 38, sg.y + 24, 1);
      }

      if (dist < 102 && !sg.given) {
        sg.given = true;
        sg.bubbleT = 3.6;
        sg.grooveT = 2.6;
        sg.coinArcT = 0.65;
        W3.singerCount++;

        // Symbolic coin tip from Brayan
        const coinCost = Math.min(W3.score, 25);
        W3.score -= coinCost;
        SFX.coinGive();
        if (coinCost > 0) {
          addFloatText(P.x + 20, P.y - 10, L.w3CoinTip, '#fde047');
        }

        // Reciprocal musical healing! (+2 ♥ Light, +1 ♥ Heavy)
        const healAmt = hard ? 1 : 2;
        const gained = Math.min(P.maxHp - P.hp, healAmt);
        P.hp = Math.min(P.maxHp, P.hp + healAmt);
        if (gained === 0) W3.score += 250;
        SFX.singerGroove();
        addFloatText(
          sg.x + 48,
          sg.y - 18,
          gained > 0 ? `${L.w3MusicHeal} +${gained} ♥ ♪` : `${L.w3MusicHeal} +250 ♪`,
          '#4ade80'
        );
        spawnMusicNotes(sg.x + 45, sg.y + 18, 12);
        spawnParticles(sg.x + 45, sg.y + 60, '#38bdf8', 10, 150);
      }
    }

    // Collectibles (CV, Tintos, Golden TuLlave Cards)
    for (const it of W3.items) {
      if (it.got) continue;
      if (P.x + P.w > it.x - 16 && P.x < it.x + 16 && P.y + P.h > it.y - 16 && P.y < it.y + 16) {
        it.got = true;
        if (it.type === 'cv') {
          W3.cvCount++;
          W3.score += 100;
          SFX.collect();
          addFloatText(it.x, it.y - 10, '+100 CV', '#38bdf8');
        } else if (it.type === 'token') {
          W3.tokenCount++;
          W3.score += 200;
          SFX.collect();
          addFloatText(it.x, it.y - 10, '+200 TULLAVE', '#facc15');
        } else {
          W3.score += 250;
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

    // Particles, Music Notes & Floating Texts
    for (let i = W3.particles.length - 1; i >= 0; i--) {
      const pt = W3.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 320 * dt;
      pt.life -= dt;
      if (pt.life <= 0) W3.particles.splice(i, 1);
    }
    for (let i = W3.musicNotes.length - 1; i >= 0; i--) {
      const n = W3.musicNotes[i];
      n.x += n.vx * dt + Math.sin(W3.time * 6 + i) * 18 * dt;
      n.y += n.vy * dt;
      n.life -= dt;
      if (n.life <= 0) W3.musicNotes.splice(i, 1);
    }
    for (let i = W3.floatTexts.length - 1; i >= 0; i--) {
      const ft = W3.floatTexts[i];
      ft.y -= 34 * dt;
      ft.life -= dt;
      if (ft.life <= 0) W3.floatTexts.splice(i, 1);
    }

    // Reach Goal (Portal Sur Exit)
    if (P.x + P.w >= GOAL_X) {
      W3.status = 'VICTORY';
      W3.score += (hard ? 1500 : 750) + P.hp * 200;
      SFX.victory();
      showOverlay('VICTORY', getOverlayConfig('VICTORY'));
    }
  },

  render(ctx) {
    renderWorld1_3(ctx, W3);
  }
};
