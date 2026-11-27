import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { SFX } from '../../core/audio.js';
import { DOM, showOverlay, hideOverlay, renderOverlayContent } from '../../core/ui.js';
import { stageManager } from '../../core/stageManager.js';
import { WORLD_2_2_CONFIG, createWorld2_2Entities } from './levelData.js';
import { renderWorld2_2 } from './world2_2Renderer.js';

const { groundY: GROUND_Y, levelLen: LEVEL_LEN, goalX: GOAL_X } = WORLD_2_2_CONFIG;

const W22 = {
  paused: false,
  status: 'PLAYING', // 'PLAYING' | 'GAMEOVER' | 'VICTORY'
  time: 0,
  fadeIn: 1.0,
  camX: 0,
  shakeTime: 0,
  copyScanT: 0,
  needPapersBannerT: 0,

  score: 0,
  carryScore: 0,
  papers: 0,
  requiredPapers: 10,
  koCount: 0,
  stampedesDodged: 0,
  tintoCount: 0,

  player: {
    x: 110, y: GROUND_Y - 96, w: 42, h: 96,
    vx: 0, vy: 0, facing: 1, onGround: true,
    crouching: false,
    coyote: 0, jumpBuffer: 0, walkTimer: 0, walkFrame: 0,
    attackTimer: 0, attackCd: 0, throwCd: 0,
    hp: 5, maxHp: 5, invuln: 0
  },

  keys: { left: false, right: false, crouch: false, jump: false, jumpHeld: false },

  // Signature World 2-2 Mechanic: Timed High-Speed Union Stampede Waves!
  stampede: {
    cooldown: 5.5,
    warnT: 0,
    dir: -1, // -1 = stampede rushes right-to-left, 1 = left-to-right
    waveIdx: 0
  },

  platforms: [],
  enemies: [],
  tintoLadies: [],
  items: [],
  projectiles: [], // "+25% PRIMA" union flyers & flying folders
  briefcases: [],
  particles: [],
  floatTexts: []
};

function getOverlayConfig(kind) {
  const L = t();
  const stats = [
    { label: L.statScore, value: W22.score, color: '#facc15' },
    { label: L.w22StatPapers, value: `${W22.papers}/${W22.requiredPapers}`, color: '#38bdf8' },
    { label: L.w22StatKo, value: W22.koCount, color: '#4ade80' },
    { label: L.w22StatWaves, value: W22.stampedesDodged, color: '#f472b6' }
  ];
  if (kind === 'PAUSE') {
    return { title: L.w22PauseTitle, sub: L.w22PauseSub, btnText: L.resumeBtn, stats };
  }
  if (kind === 'GAMEOVER') {
    return { title: L.w22GameOverTitle, sub: L.w22GameOverSub, btnText: L.retryBtn, stats };
  }
  return { title: L.w22VictoryTitle, sub: L.w22VictorySub, btnText: L.nextWorld2_3Btn, stats };
}

function addFloatText(x, y, text, color = '#facc15') {
  W22.floatTexts.push({ x, y, text, color, life: 1.35 });
}

function spawnParticles(x, y, color, count = 8, spread = 140) {
  for (let i = 0; i < count; i++) {
    W22.particles.push({
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

function damagePlayer(source = 'lagarto') {
  const P = W22.player;
  if (P.invuln > 0 || W22.status !== 'PLAYING') return;
  const L = t();
  P.hp--;
  P.invuln = STATE.mode === 'heavy' ? 1.1 : 1.5;
  W22.shakeTime = 0.3;
  P.vy = -260;

  const msg = source === 'stampede' ? L.w22StampedeHit
    : source === 'flyer' ? L.w22FlyerHit
    : L.w22LagartoHit;

  SFX.hurt();
  addFloatText(P.x + 20, P.y - 12, msg, '#ef4444');
  spawnParticles(P.x + P.w / 2, P.y + P.h / 2, '#ef4444', 10, 180);

  if (P.hp <= 0) {
    W22.status = 'GAMEOVER';
    SFX.gameover();
    showOverlay('GAMEOVER', getOverlayConfig('GAMEOVER'));
  }
}

function koEnemy(e, bonusLabel = '') {
  e.alive = false;
  W22.koCount++;
  const pts = e.fromStampede ? 280 : (e.type === 'sindical' ? 220 : 180);
  W22.score += pts;
  SFX.stomp();
  addFloatText(e.x + e.w / 2, e.y - 8, `+${pts}${bonusLabel ? ' ' + bonusLabel : ''}`, '#4ade80');
  spawnParticles(e.x + e.w / 2, e.y + 34, '#4ade80', 10, 175);
  spawnParticles(e.x + e.w / 2, e.y + 34, '#facc15', 6, 155);
}

function spawnStampedePack(dir, hard) {
  const L = t();
  const count = hard ? 3 : 2;
  const baseSpd = hard ? 500 : 415;
  const spawnBaseX = dir < 0 ? (W22.camX + 1020) : (W22.camX - 110);

  for (let i = 0; i < count; i++) {
    const kind = i === 1 ? 'sindical' : (i === 2 ? 'hopper' : 'runner');
    const offset = i * (hard ? 135 : 165);
    const sx = dir < 0 ? (spawnBaseX + offset) : (spawnBaseX - offset);
    W22.enemies.push({
      type: kind,
      x: sx,
      y: GROUND_Y - (kind === 'sindical' ? 104 : 96),
      floorY: GROUND_Y,
      w: kind === 'sindical' ? 58 : 54,
      h: kind === 'sindical' ? 104 : 96,
      minX: -600,
      maxX: LEVEL_LEN + 600,
      vx: dir * (baseSpd + i * 24),
      vy: 0,
      facing: dir,
      state: 'stampede',
      stateT: 0,
      cd: 99,
      hopCd: 0.55 + i * 0.25,
      animT: i * 1.3,
      shoutIdx: (W22.stampede.waveIdx + i) % L.w22StampedeShouts.length,
      fromStampede: true,
      alive: true
    });
  }

  W22.stampedesDodged++;
  W22.stampede.waveIdx++;
  SFX.lizardDash();
  const bannerX = dir < 0 ? (W22.camX + 820) : (W22.camX + 140);
  addFloatText(bannerX, GROUND_Y - 124, L.w22StampedeShouts[W22.stampede.waveIdx % L.w22StampedeShouts.length], '#fde047');
}

function performBriefcaseAttack() {
  if (W22.paused || W22.status !== 'PLAYING') return;
  const P = W22.player;
  if (P.attackCd > 0) return;

  P.attackTimer = 0.25;
  P.attackCd = 0.34;
  SFX.briefcase();

  const mx0 = P.facing > 0 ? (P.x + P.w - 4) : (P.x - 66);
  const mx1 = P.facing > 0 ? (P.x + P.w + 66) : (P.x + 4);
  const my0 = P.y + 6;
  const my1 = P.y + P.h - 4;

  for (const e of W22.enemies) {
    if (!e.alive) continue;
    if (e.x + e.w > mx0 && e.x < mx1 && e.y + e.h > my0 && e.y < my1) {
      koEnemy(e, 'KO!');
    }
  }

  // Swat union flyers away
  for (let i = W22.projectiles.length - 1; i >= 0; i--) {
    const pr = W22.projectiles[i];
    if (pr.x + 22 > mx0 && pr.x - 22 < mx1 && pr.y + 18 > my0 && pr.y - 18 < my1) {
      spawnParticles(pr.x, pr.y, '#fde047', 6, 120);
      W22.projectiles.splice(i, 1);
      W22.score += 50;
    }
  }

  if (P.throwCd <= 0) {
    P.throwCd = 0.58;
    W22.briefcases.push({
      x: P.x + (P.facing > 0 ? P.w + 8 : -8),
      y: P.y + (P.crouching ? 24 : 38),
      vx: P.facing * 450,
      rot: 0,
      life: 0.95
    });
  }
}

function buildWorld2_2(carryScore = 0) {
  const hard = (STATE.mode === 'heavy');
  W22.paused = false;
  W22.status = 'PLAYING';
  W22.time = 0;
  W22.fadeIn = 1.0;
  W22.camX = 0;
  W22.shakeTime = 0;
  W22.copyScanT = 0;
  W22.needPapersBannerT = 0;

  W22.carryScore = carryScore;
  W22.score = carryScore;
  W22.papers = 0;
  W22.requiredPapers = hard ? WORLD_2_2_CONFIG.requiredPapersHeavy : WORLD_2_2_CONFIG.requiredPapersLight;
  W22.koCount = 0;
  W22.stampedesDodged = 0;
  W22.tintoCount = 0;

  W22.player = {
    x: 110, y: GROUND_Y - 96, w: 42, h: 96,
    vx: 0, vy: 0, facing: 1, onGround: true,
    crouching: false,
    coyote: 0, jumpBuffer: 0, walkTimer: 0, walkFrame: 0,
    attackTimer: 0, attackCd: 0, throwCd: 0,
    hp: hard ? 3 : 5, maxHp: hard ? 3 : 5, invuln: 0
  };
  W22.keys = { left: false, right: false, crouch: false, jump: false, jumpHeld: false };

  W22.stampede = {
    cooldown: hard ? 4.4 : 6.0,
    warnT: 0,
    dir: -1,
    waveIdx: 0
  };

  const entities = createWorld2_2Entities(hard);
  W22.platforms = entities.platforms;
  W22.enemies = entities.enemies;
  W22.tintoLadies = entities.tintoLadies;
  W22.items = entities.items;

  W22.projectiles = [];
  W22.briefcases = [];
  W22.particles = [];
  W22.floatTexts = [];

  hideOverlay();
}

export const world2_2Stage = {
  enter(params = {}) {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    DOM.world1Controls.style.display = 'none';
    DOM.world2Controls.style.display = 'none';
    DOM.world4Controls.style.display = 'flex';
    buildWorld2_2(params.carryScore || 0);
  },

  exit() {
    W22.keys = { left: false, right: false, crouch: false, jump: false, jumpHeld: false };
    DOM.world4Controls.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    const L = t();
    DOM.btnW4Pause.textContent = W22.paused ? L.resumeBtn : L.pauseBtn;
    if (W22.paused || W22.status !== 'PLAYING') {
      const kind = DOM.overlay.dataset.kind || (W22.paused ? 'PAUSE' : W22.status);
      renderOverlayContent(getOverlayConfig(kind));
    }
  },

  onAction(action) {
    if (action === 'TOGGLE_PAUSE') {
      if (W22.status !== 'PLAYING') return;
      W22.paused = !W22.paused;
      SFX.blip();
      if (W22.paused) showOverlay('PAUSE', getOverlayConfig('PAUSE'));
      else hideOverlay();
      this.onLocalize();
    } else if (action === 'OVERLAY_PRIMARY') {
      SFX.select();
      const kind = DOM.overlay.dataset.kind;
      if (kind === 'PAUSE') {
        W22.paused = false;
        hideOverlay();
        this.onLocalize();
      } else if (kind === 'VICTORY') {
        SFX.start();
        stageManager.goTo('CUTSCENE_2_2_TO_2_3', { params: { carryScore: W22.score } });
      } else {
        buildWorld2_2(W22.carryScore);
        this.onLocalize();
      }
    }
  },

  onControl(control, pressed) {
    if (control === 'left' || control === 'right' || control === 'crouch') {
      W22.keys[control] = pressed;
    } else if (control === 'jump') {
      W22.keys.jump = pressed;
      if (pressed) {
        W22.keys.jumpHeld = true;
        W22.player.jumpBuffer = 0.14;
      } else {
        W22.keys.jumpHeld = false;
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
    if (k === 'arrowleft' || k === 'a') W22.keys.left = true;
    if (k === 'arrowright' || k === 'd') W22.keys.right = true;
    if (k === 'arrowdown' || k === 's') { e.preventDefault(); W22.keys.crouch = true; }
    if (k === ' ' || k === 'arrowup' || k === 'w') {
      e.preventDefault();
      if (!W22.keys.jumpHeld) W22.player.jumpBuffer = 0.14;
      W22.keys.jumpHeld = true;
    }
    if (k === 'j' || k === 'z' || k === 'f' || k === 'shift' || k === 'k') {
      e.preventDefault();
      performBriefcaseAttack();
    }
  },

  onKeyUp(k) {
    if (k === 'arrowleft' || k === 'a') W22.keys.left = false;
    if (k === 'arrowright' || k === 'd') W22.keys.right = false;
    if (k === 'arrowdown' || k === 's') W22.keys.crouch = false;
    if (k === ' ' || k === 'arrowup' || k === 'w') W22.keys.jumpHeld = false;
  },

  update(dt) {
    if (W22.paused || W22.status !== 'PLAYING') {
      if (W22.status === 'VICTORY') W22.copyScanT += dt;
      return;
    }
    const hard = (STATE.mode === 'heavy');
    const L = t();
    W22.time += dt;
    if (W22.fadeIn > 0) W22.fadeIn = Math.max(0, W22.fadeIn - dt * 0.9);
    if (W22.shakeTime > 0) W22.shakeTime = Math.max(0, W22.shakeTime - dt);
    if (W22.needPapersBannerT > 0) W22.needPapersBannerT = Math.max(0, W22.needPapersBannerT - dt);

    const P = W22.player;
    if (P.invuln > 0) P.invuln = Math.max(0, P.invuln - dt);
    if (P.attackTimer > 0) P.attackTimer = Math.max(0, P.attackTimer - dt);
    if (P.attackCd > 0) P.attackCd = Math.max(0, P.attackCd - dt);
    if (P.throwCd > 0) P.throwCd = Math.max(0, P.throwCd - dt);

    // =========================================================================
    // PLAYER PHYSICS
    // =========================================================================
    const wantsCrouch = W22.keys.crouch && P.onGround;
    if (wantsCrouch && !P.crouching) {
      P.crouching = true;
      P.y += 38;
      P.h = 58;
    } else if (!wantsCrouch && P.crouching) {
      P.crouching = false;
      P.y -= 38;
      P.h = 96;
    }

    const moveSpd = P.crouching ? 95 : 278;
    P.vx = 0;
    if (W22.keys.left) { P.vx = -moveSpd; P.facing = -1; }
    if (W22.keys.right) { P.vx = moveSpd; P.facing = 1; }
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
      P.vy = -630;
      P.onGround = false;
      P.coyote = 0;
      P.jumpBuffer = 0;
      SFX.jump();
      spawnParticles(P.x + P.w / 2, P.y + P.h, '#e2e8f0', 5, 90);
    }
    if (!W22.keys.jumpHeld && P.vy < -240) P.vy *= 0.85;

    const prevBottom = P.y + P.h;
    P.vy = Math.min(820, P.vy + 1480 * dt);
    P.y += P.vy * dt;
    P.onGround = false;

    if (P.vy >= 0) {
      for (const pl of W22.platforms) {
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
    W22.camX += (targetCam - W22.camX) * Math.min(1, dt * 8);

    // =========================================================================
    // SIGNATURE EVENT: HIGH-SPEED UNION STAMPEDE WAVES!
    // =========================================================================
    if (P.x > 460 && P.x < GOAL_X - 420) {
      if (W22.stampede.warnT > 0) {
        W22.stampede.warnT -= dt;
        if (W22.stampede.warnT <= 0) {
          spawnStampedePack(W22.stampede.dir, hard);
          W22.stampede.cooldown = hard ? 5.2 : 7.4;
        }
      } else {
        W22.stampede.cooldown -= dt;
        if (W22.stampede.cooldown <= 0) {
          W22.stampede.dir = (W22.stampede.waveIdx % 3 === 2) ? 1 : -1;
          W22.stampede.warnT = hard ? 0.95 : 1.25;
          SFX.stampedeWarn();
          W22.shakeTime = Math.max(W22.shakeTime, 0.25);
        }
      }
    }

    // =========================================================================
    // ENEMIES AI: HIGH-SPEED OFFICE LAGARTOS (+25% PRIMA MENSUAL UNION RUSH!)
    // =========================================================================
    for (let i = W22.enemies.length - 1; i >= 0; i--) {
      const e = W22.enemies[i];
      if (!e.alive) {
        if (e.fromStampede) W22.enemies.splice(i, 1);
        continue;
      }
      e.animT += dt;
      const dist = (P.x + P.w / 2) - (e.x + e.w / 2);
      const absDist = Math.abs(dist);
      const onScreen = e.x > W22.camX - 140 && e.x < W22.camX + 1100;

      if (e.fromStampede) {
        // Blistering stampede straight through the corridor!
        e.x += e.vx * dt;
        if (e.type === 'hopper') {
          e.hopCd -= dt;
          if (e.y >= e.floorY - e.h && e.hopCd <= 0) {
            e.vy = -420;
            e.hopCd = 0.85;
            spawnParticles(e.x + e.w / 2, e.floorY, '#cbd5e1', 5, 100);
          }
          if (e.vy !== 0 || e.y < e.floorY - e.h) {
            e.vy += 1350 * dt;
            e.y = Math.min(e.floorY - e.h, e.y + e.vy * dt);
            if (e.y >= e.floorY - e.h) e.vy = 0;
          }
        }
        if (Math.random() < dt * 14) {
          spawnParticles(e.x + (e.facing > 0 ? 0 : e.w), e.y + e.h - 4, '#e2e8f0', 1, 70);
        }
        if ((e.facing < 0 && e.x < W22.camX - 420) || (e.facing > 0 && e.x > W22.camX + 1380)) {
          W22.enemies.splice(i, 1);
          continue;
        }
      } else if (e.type === 'runner') {
        if (e.state === 'boost') {
          e.x += e.facing * (hard ? 405 : 330) * dt;
          if (e.x < e.minX) { e.x = e.minX; e.facing = 1; }
          if (e.x > e.maxX) { e.x = e.maxX; e.facing = -1; }
          e.stateT -= dt;
          if (Math.random() < dt * 12) {
            spawnParticles(e.x + (e.facing > 0 ? 0 : e.w), e.y + e.h - 6, '#fef08a', 1, 65);
          }
          if (e.stateT <= 0) {
            e.state = 'sprint';
            e.vx = e.facing * (hard ? 260 : 210);
            e.cd = hard ? 1.25 : 1.95;
          }
        } else {
          e.x += e.vx * dt;
          if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
          if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
          e.facing = e.vx >= 0 ? 1 : -1;
          e.cd -= dt;
          if (e.cd <= 0 && onScreen && absDist < 420) {
            e.facing = dist >= 0 ? 1 : -1;
            e.state = 'boost';
            e.stateT = 0.68;
            SFX.lizardDash();
            const line = L.w22RunnerShouts[e.shoutIdx % L.w22RunnerShouts.length];
            e.shoutIdx++;
            addFloatText(e.x + e.w / 2, e.y - 14, line, '#fde047');
          }
        }
      } else if (e.type === 'sindical') {
        if (e.state === 'chant') {
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'march';
            e.cd = hard ? 1.55 : 2.35;
            // Launch a flying "+25% PRIMA" Union Flyer horizontally!
            W22.projectiles.push({
              x: e.x + (e.facing > 0 ? e.w + 8 : -8),
              y: e.y + 38,
              vx: e.facing * (hard ? 335 : 265),
              vy: 0,
              text: L.w22FlyerLabel,
              life: 2.5
            });
            SFX.throwSign();
          }
        } else {
          e.x += e.vx * dt;
          if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
          if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
          e.facing = e.vx >= 0 ? 1 : -1;
          e.cd -= dt;
          if (e.cd <= 0 && onScreen && absDist < 460) {
            e.facing = dist >= 0 ? 1 : -1;
            e.state = 'chant';
            e.stateT = hard ? 0.30 : 0.44;
            const chant = L.w22SindicalShouts[e.shoutIdx % L.w22SindicalShouts.length];
            e.shoutIdx++;
            addFloatText(e.x + e.w / 2, e.y - 16, chant, '#fb923c');
          }
        }
      } else if (e.type === 'hopper') {
        e.x += e.vx * dt;
        if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
        if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
        e.facing = e.vx >= 0 ? 1 : -1;
        e.hopCd -= dt;
        if (e.y >= e.floorY - e.h && e.hopCd <= 0 && onScreen) {
          e.vy = hard ? -460 : -405;
          e.hopCd = hard ? 0.85 : 1.35;
          spawnParticles(e.x + e.w / 2, e.floorY, '#4ade80', 5, 95);
          if (absDist < 360) {
            const yell = L.w22HopperShouts[e.shoutIdx % L.w22HopperShouts.length];
            e.shoutIdx++;
            addFloatText(e.x + e.w / 2, e.y - 12, yell, '#4ade80');
          }
        }
        if (e.vy !== 0 || e.y < e.floorY - e.h) {
          e.vy += 1320 * dt;
          e.y += e.vy * dt;
          if (e.y >= e.floorY - e.h) {
            e.y = e.floorY - e.h;
            e.vy = 0;
          }
        }
      }

      // Player <-> Lagarto Collision (Stomp from above vs Hurt)
      const pad = 8;
      if (
        P.x + P.w - pad > e.x + pad && P.x + pad < e.x + e.w - pad &&
        P.y + P.h > e.y + 6 && P.y < e.y + e.h
      ) {
        if (P.vy > 40 && (P.y + P.h - P.vy * dt) <= e.y + 42) {
          P.vy = -450;
          koEnemy(e);
        } else {
          damagePlayer(e.fromStampede ? 'stampede' : 'lagarto');
        }
      }
    }

    // Update Union Flyers ("+25% PRIMA")
    for (let i = W22.projectiles.length - 1; i >= 0; i--) {
      const pr = W22.projectiles[i];
      pr.x += pr.vx * dt;
      pr.y += Math.sin(W22.time * 10 + i) * 35 * dt;
      pr.life -= dt;

      if (
        P.x + P.w - 6 > pr.x - 36 && P.x + 6 < pr.x + 36 &&
        P.y + P.h - 4 > pr.y - 14 && P.y + 4 < pr.y + 14
      ) {
        W22.projectiles.splice(i, 1);
        damagePlayer('flyer');
        continue;
      }
      if (pr.life <= 0 || pr.x < W22.camX - 180 || pr.x > W22.camX + 1160) {
        W22.projectiles.splice(i, 1);
      }
    }

    // Update Brayan's Thrown Briefcases
    for (let i = W22.briefcases.length - 1; i >= 0; i--) {
      const bc = W22.briefcases[i];
      bc.x += bc.vx * dt;
      bc.rot += 15 * dt;
      bc.life -= dt;

      let hit = false;
      for (const e of W22.enemies) {
        if (!e.alive) continue;
        if (bc.x + 16 > e.x && bc.x - 16 < e.x + e.w && bc.y + 14 > e.y && bc.y - 14 < e.y + e.h) {
          koEnemy(e, '💼!');
          hit = true;
          break;
        }
      }
      if (hit || bc.life <= 0 || bc.x < W22.camX - 40 || bc.x > W22.camX + 1000) {
        W22.briefcases.splice(i, 1);
      }
    }

    // Allied NPC: Doña Martha de los Tintos
    for (const tl of W22.tintoLadies) {
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
          W22.tintoCount++;
          W22.score += 200;
          SFX.heal();
          addFloatText(tl.x + 42, tl.y - 14, gained > 0 ? `TINTO +${gained} ♥` : 'TINTO +200', '#4ade80');
          spawnParticles(tl.x + 48, tl.y + 30, '#fde047', 12, 145);
        }
      } else if (tl.smileT > 0) {
        tl.smileT = Math.max(0, tl.smileT - dt);
      }
    }

    // Collectibles: Paper Sheets ('paper' +1), Golden Reams ('ream' +2), Tintos ('tinto')
    for (const it of W22.items) {
      if (it.got) continue;
      if (P.x + P.w > it.x - 18 && P.x < it.x + 18 && P.y + P.h > it.y - 18 && P.y < it.y + 18) {
        it.got = true;
        if (it.type === 'paper') {
          W22.papers++;
          W22.score += 120;
          SFX.paperGrab();
          addFloatText(it.x, it.y - 10, `${L.w22PaperGrab} (${W22.papers}/${W22.requiredPapers})`, '#38bdf8');
        } else if (it.type === 'ream') {
          W22.papers += 2;
          W22.score += 300;
          SFX.paperGrab();
          addFloatText(it.x, it.y - 10, `${L.w22ReamGrab} +2!`, '#facc15');
        } else {
          W22.tintoCount++;
          W22.score += 250;
          if (P.hp < P.maxHp) {
            P.hp++;
            addFloatText(it.x, it.y - 10, 'TINTO +1 ♥', '#fb923c');
          } else {
            addFloatText(it.x, it.y - 10, 'TINTO +250', '#fb923c');
          }
          SFX.heal();
        }
        spawnParticles(it.x, it.y, '#facc15', 8, 120);
      }
    }

    // Particles & Floating Texts
    for (let i = W22.particles.length - 1; i >= 0; i--) {
      const pt = W22.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 320 * dt;
      pt.life -= dt;
      if (pt.life <= 0) W22.particles.splice(i, 1);
    }
    for (let i = W22.floatTexts.length - 1; i >= 0; i--) {
      const ft = W22.floatTexts[i];
      ft.y -= 34 * dt;
      ft.life -= dt;
      if (ft.life <= 0) W22.floatTexts.splice(i, 1);
    }

    // Goal: Photocopier Station with Required Paper Sheets!
    if (P.x + P.w >= GOAL_X) {
      if (W22.papers >= W22.requiredPapers) {
        W22.status = 'VICTORY';
        W22.copyScanT = 0.01;
        W22.score += (hard ? 1600 : 950) + P.hp * 200 + (W22.papers - W22.requiredPapers) * 100;
        SFX.photocopy();
        setTimeout(() => SFX.victory(), 550);
        showOverlay('VICTORY', getOverlayConfig('VICTORY'));
      } else if (W22.needPapersBannerT <= 0) {
        W22.needPapersBannerT = 2.4;
        SFX.blip();
      }
    }
  },

  render(ctx) {
    renderWorld2_2(ctx, W22);
  }
};
