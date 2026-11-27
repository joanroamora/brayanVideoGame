import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { SFX } from '../../core/audio.js';
import { DOM, showOverlay, hideOverlay, renderOverlayContent } from '../../core/ui.js';
import { stageManager } from '../../core/stageManager.js';
import { WORLD_2_3_CONFIG, createWorld2_3Schedule } from './levelData.js';
import { renderWorld2_3 } from './world2_3Renderer.js';

const {
  lanes: LANES,
  totalDistance: TOTAL_DIST,
  chiteCooldownLight: CHITE_CD_LIGHT,
  chiteCooldownHeavy: CHITE_CD_HEAVY,
  chiteRadius: CHITE_RADIUS
} = WORLD_2_3_CONFIG;

const W23 = {
  paused: false,
  status: 'PLAYING', // 'PLAYING' | 'GAMEOVER' | 'VICTORY'
  time: 0,
  fadeIn: 1.0,
  dist: 0,           // Forward walking distance along Carrera 7a (0 .. TOTAL_DIST)
  walkSpeed: 215,
  shakeTime: 0,

  score: 0,
  carryScore: 0,
  chiteCount: 0,
  dodgedCount: 0,
  tintoCount: 0,

  player: {
    x: 210,          // Screen X (95 .. 480)
    lane: 1,         // Target lane 0 | 1 | 2
    y: LANES[1],     // Smoothly interpolated sidewalk Y
    laneHopT: 0,     // Tiny visual hop when switching lanes
    walkTimer: 0,
    walkFrame: 0,
    hp: 5,
    maxHp: 5,
    invuln: 0,
    chiteCd: 0,
    chiteMaxCd: CHITE_CD_LIGHT,
    chiteAnimT: 0    // Active expanding power bubble timer!
  },

  keys: { left: false, right: false },

  scheduleObs: [],
  schedulePickups: [],
  obstacles: [],     // Active sidewalk obstacles (rappi, motero, nero_run, nero_smoke, skater)
  pickups: [],       // Active street pickups (tinto, empanada, coin)
  bubbles: [],       // Expanding "¡CHITE!" shockwave visual bubbles
  smokePuffs: [],    // Billowing smoke clouds from smoking ñeros
  laneWarnings: [0, 0, 0], // Brief right-edge warning flash when fast moto enters a lane
  particles: [],
  floatTexts: []
};

function getOverlayConfig(kind) {
  const L = t();
  const stats = [
    { label: L.statScore, value: W23.score, color: '#facc15' },
    { label: L.w23StatChite, value: W23.chiteCount, color: '#22d3ee' },
    { label: L.w23StatDodged, value: W23.dodgedCount, color: '#4ade80' },
    { label: L.w23StatTintos, value: W23.tintoCount, color: '#fb923c' }
  ];
  if (kind === 'PAUSE') {
    return { title: L.w23PauseTitle, sub: L.w23PauseSub, btnText: L.resumeBtn, stats };
  }
  if (kind === 'GAMEOVER') {
    return { title: L.w23GameOverTitle, sub: L.w23GameOverSub, btnText: L.retryBtn, stats };
  }
  return { title: L.w23VictoryTitle, sub: L.w23VictorySub, btnText: L.nextWorld2_4Btn, stats };
}

function addFloatText(x, y, text, color = '#facc15', life = 1.4) {
  W23.floatTexts.push({ x, y, text, color, life });
}

function spawnParticles(x, y, color, count = 8, spread = 140) {
  for (let i = 0; i < count; i++) {
    W23.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * spread,
      vy: -45 - Math.random() * spread * 0.85,
      size: 3 + Math.random() * 4,
      color,
      life: 0.42 + Math.random() * 0.35
    });
  }
}

function shiftLane(delta) {
  if (W23.paused || W23.status !== 'PLAYING') return;
  const next = Math.max(0, Math.min(2, W23.player.lane + delta));
  if (next !== W23.player.lane) {
    W23.player.lane = next;
    W23.player.laneHopT = 0.16;
    SFX.step();
  }
}

/**
 * Signature World 2-3 Power: "¡CHITE!"
 * Generates an expanding cyan-gold power bubble around Brayan that violently pushes
 * away motos, ñeros & skaters across lanes — with cooldown/downtime management!
 */
function triggerChitePower() {
  if (W23.paused || W23.status !== 'PLAYING') return;
  const P = W23.player;
  const L = t();
  if (P.chiteCd > 0) {
    SFX.blip();
    addFloatText(P.x, P.y - 96, L.w23ChiteCooling, '#94a3b8', 0.85);
    return;
  }

  P.chiteCd = P.chiteMaxCd;
  P.chiteAnimT = 0.45;
  W23.shakeTime = 0.24;
  SFX.chiteBlast();

  W23.bubbles.push({
    x: P.x + 8,
    y: P.y - 44,
    r: 28,
    maxR: CHITE_RADIUS,
    life: 0.42,
    maxLife: 0.42
  });

  addFloatText(P.x + 12, P.y - 108, L.w23ChiteShout, '#22d3ee', 1.25);
  spawnParticles(P.x, P.y - 44, '#22d3ee', 16, 260);
  spawnParticles(P.x, P.y - 44, '#fef08a', 10, 210);

  // Blast & push away EVERY obstacle within the expanding power bubble!
  let pushedAny = 0;
  for (const ob of W23.obstacles) {
    if (!ob.alive || ob.pushed) continue;
    const dx = ob.x - P.x;
    const dy = (ob.y - 36) - (P.y - 44);
    const d = Math.hypot(dx, dy);
    if (d <= CHITE_RADIUS + 46) {
      ob.pushed = true;
      ob.pushVx = Math.max(460, 620 - d * 0.4);
      ob.pushVy = -260 - Math.random() * 140;
      ob.pushRot = 0;
      ob.pushVrot = 11 + Math.random() * 6;
      pushedAny++;
      W23.chiteCount++;
      W23.score += 150;

      const react = ob.kind === 'rappi' ? L.w23RappiPushed
        : ob.kind === 'motero' ? L.w23MoteroPushed
        : ob.kind === 'skater' ? L.w23SkaterPushed
        : L.w23NeroPushed;
      addFloatText(ob.x, ob.y - 84, react, '#fde047', 1.25);
      spawnParticles(ob.x, ob.y - 36, '#38bdf8', 10, 200);
    }
  }

  if (pushedAny >= 2) {
    const bonus = pushedAny * 100;
    W23.score += bonus;
    addFloatText(P.x + 10, P.y - 134, `COMBO ¡CHITE! x${pushedAny} +${bonus}`, '#facc15', 1.5);
  }
}

function damagePlayer(ob) {
  const P = W23.player;
  if (P.invuln > 0 || W23.status !== 'PLAYING') return;
  const L = t();
  P.hp--;
  P.invuln = STATE.mode === 'heavy' ? 1.1 : 1.55;
  W23.shakeTime = 0.32;

  const msg = ob.kind === 'rappi' ? L.w23HitRappi
    : ob.kind === 'motero' ? L.w23HitMoto
    : ob.kind === 'skater' ? L.w23HitSkater
    : L.w23HitNero;

  SFX.hurt();
  addFloatText(P.x, P.y - 98, msg, '#ef4444');
  spawnParticles(P.x, P.y - 45, '#ef4444', 12, 190);

  if (P.hp <= 0) {
    W23.status = 'GAMEOVER';
    SFX.gameover();
    showOverlay('GAMEOVER', getOverlayConfig('GAMEOVER'));
  }
}

function spawnObstacle(spec, hard) {
  const L = t();
  const spdMult = hard ? 1.24 : 1.0;
  let speed = 260;
  let shoutList = L.w23NeroLines;
  let shoutColor = '#f472b6';

  if (spec.kind === 'rappi') {
    speed = 420 * spdMult;
    shoutList = L.w23RappiLines;
    shoutColor = '#fb923c';
    W23.laneWarnings[spec.lane] = 0.72;
    SFX.hornBeep();
  } else if (spec.kind === 'motero') {
    speed = 495 * spdMult;
    shoutList = L.w23MoteroLines;
    shoutColor = '#facc15';
    W23.laneWarnings[spec.lane] = 0.8;
    SFX.motoRev();
  } else if (spec.kind === 'nero_run') {
    speed = 335 * spdMult;
    shoutList = L.w23NeroLines;
    shoutColor = '#c084fc';
  } else if (spec.kind === 'nero_smoke') {
    speed = 195 * spdMult;
    shoutList = L.w23SmokerLines;
    shoutColor = '#a3e635';
  } else if (spec.kind === 'skater') {
    speed = 390 * spdMult;
    shoutList = L.w23SkaterLines;
    shoutColor = '#38bdf8';
  }

  const shout = shoutList[Math.floor(Math.random() * shoutList.length)];
  const startX = (spec.kind === 'rappi' || spec.kind === 'motero') ? 1090 : 1030;
  W23.obstacles.push({
    kind: spec.kind,
    lane: spec.lane,
    targetLane: spec.lane,
    x: startX,
    y: LANES[spec.lane],
    speed,
    laneSwitch: spec.laneSwitch,
    switched: false,
    shout,
    shoutColor,
    shoutShown: false,
    animT: Math.random() * 5,
    smokeT: 0,
    pushed: false,
    pushVx: 0,
    pushVy: 0,
    pushRot: 0,
    pushVrot: 0,
    countedDodged: false,
    alive: true
  });
}

function buildWorld2_3(carryScore = 0) {
  const hard = (STATE.mode === 'heavy');
  W23.paused = false;
  W23.status = 'PLAYING';
  W23.time = 0;
  W23.fadeIn = 1.0;
  W23.dist = 0;
  W23.walkSpeed = hard ? 245 : 210;
  W23.shakeTime = 0;

  W23.carryScore = carryScore;
  W23.score = carryScore;
  W23.chiteCount = 0;
  W23.dodgedCount = 0;
  W23.tintoCount = 0;

  W23.player = {
    x: 205,
    lane: 1,
    y: LANES[1],
    laneHopT: 0,
    walkTimer: 0,
    walkFrame: 0,
    hp: hard ? 3 : 5,
    maxHp: hard ? 3 : 5,
    invuln: 0,
    chiteCd: 0,
    chiteMaxCd: hard ? CHITE_CD_HEAVY : CHITE_CD_LIGHT,
    chiteAnimT: 0
  };
  W23.keys = { left: false, right: false };

  const sched = createWorld2_3Schedule(hard);
  W23.scheduleObs = sched.obstacles;
  W23.schedulePickups = sched.pickups;

  W23.obstacles = [];
  W23.pickups = [];
  W23.bubbles = [];
  W23.smokePuffs = [];
  W23.laneWarnings = [0, 0, 0];
  W23.particles = [];
  W23.floatTexts = [];

  hideOverlay();
}

export const world2_3Stage = {
  enter(params = {}) {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    DOM.world1Controls.style.display = 'none';
    DOM.world2Controls.style.display = 'none';
    DOM.world4Controls.style.display = 'none';
    if (DOM.world23Controls) DOM.world23Controls.style.display = 'flex';
    buildWorld2_3(params.carryScore || 0);
  },

  exit() {
    W23.keys = { left: false, right: false };
    if (DOM.world23Controls) DOM.world23Controls.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    const L = t();
    if (DOM.btnW23Pause) DOM.btnW23Pause.textContent = W23.paused ? L.resumeBtn : L.pauseBtn;
    if (W23.paused || W23.status !== 'PLAYING') {
      const kind = DOM.overlay.dataset.kind || (W23.paused ? 'PAUSE' : W23.status);
      renderOverlayContent(getOverlayConfig(kind));
    }
  },

  onAction(action) {
    if (action === 'TOGGLE_PAUSE') {
      if (W23.status !== 'PLAYING') return;
      W23.paused = !W23.paused;
      SFX.blip();
      if (W23.paused) showOverlay('PAUSE', getOverlayConfig('PAUSE'));
      else hideOverlay();
      this.onLocalize();
    } else if (action === 'OVERLAY_PRIMARY') {
      SFX.select();
      const kind = DOM.overlay.dataset.kind;
      if (kind === 'PAUSE') {
        W23.paused = false;
        hideOverlay();
        this.onLocalize();
      } else if (kind === 'VICTORY') {
        stageManager.goTo('CUTSCENE_2_3_TO_2_4', { params: { carryScore: W23.score } });
      } else {
        buildWorld2_3(W23.carryScore);
        this.onLocalize();
      }
    }
  },

  onControl(control, pressed) {
    if (control === 'left' || control === 'right') {
      W23.keys[control] = pressed;
    } else if (control === 'up' && pressed) {
      shiftLane(-1);
    } else if (control === 'down' && pressed) {
      shiftLane(1);
    } else if (control === 'chite' && pressed) {
      triggerChitePower();
    }
  },

  onKeyDown(k, e) {
    if (k === 'p' || k === 'escape') {
      this.onAction('TOGGLE_PAUSE');
      return;
    }
    if (k === 'arrowup' || k === 'w') {
      e.preventDefault();
      shiftLane(-1);
    } else if (k === 'arrowdown' || k === 's') {
      e.preventDefault();
      shiftLane(1);
    } else if (k === 'arrowleft' || k === 'a') {
      W23.keys.left = true;
    } else if (k === 'arrowright' || k === 'd') {
      W23.keys.right = true;
    } else if (k === ' ' || k === 'e' || k === 'j' || k === 'f') {
      e.preventDefault();
      triggerChitePower();
    }
  },

  onKeyUp(k) {
    if (k === 'arrowleft' || k === 'a') W23.keys.left = false;
    if (k === 'arrowright' || k === 'd') W23.keys.right = false;
  },

  update(dt) {
    if (W23.paused || W23.status !== 'PLAYING') return;
    const hard = (STATE.mode === 'heavy');
    const L = t();
    W23.time += dt;
    if (W23.fadeIn > 0) W23.fadeIn = Math.max(0, W23.fadeIn - dt * 0.9);
    if (W23.shakeTime > 0) W23.shakeTime = Math.max(0, W23.shakeTime - dt);
    for (let l = 0; l < 3; l++) {
      if (W23.laneWarnings[l] > 0) W23.laneWarnings[l] = Math.max(0, W23.laneWarnings[l] - dt);
    }

    // Advance forward along the 4-panel Carrera 7a Centro Internacional sidewalk!
    W23.dist = Math.min(TOTAL_DIST, W23.dist + W23.walkSpeed * dt);

    const P = W23.player;
    if (P.invuln > 0) P.invuln = Math.max(0, P.invuln - dt);
    if (P.chiteCd > 0) P.chiteCd = Math.max(0, P.chiteCd - dt);
    if (P.chiteAnimT > 0) P.chiteAnimT = Math.max(0, P.chiteAnimT - dt);
    if (P.laneHopT > 0) P.laneHopT = Math.max(0, P.laneHopT - dt);

    // Optional left/right micro-reposition on the sidewalk (x in 95..460)
    const hSpd = 245;
    if (W23.keys.left) P.x = Math.max(95, P.x - hSpd * dt);
    if (W23.keys.right) P.x = Math.min(460, P.x + hSpd * dt);

    // Crisp smooth lane interpolation
    const targetY = LANES[P.lane];
    P.y += (targetY - P.y) * Math.min(1, dt * 18);

    // Brisk walking cycle
    P.walkTimer += dt;
    if (P.walkTimer > 0.14) {
      P.walkTimer = 0;
      P.walkFrame = 1 - P.walkFrame;
    }

    // =========================================================================
    // SPAWN SCHEDULED OBSTACLES & PICKUPS
    // =========================================================================
    for (const spec of W23.scheduleObs) {
      if (!spec.spawned && W23.dist >= spec.triggerX) {
        spec.spawned = true;
        spawnObstacle(spec, hard);
      }
    }
    for (const pk of W23.schedulePickups) {
      if (!pk.spawned && W23.dist >= pk.triggerX) {
        pk.spawned = true;
        W23.pickups.push({
          type: pk.type,
          lane: pk.lane,
          x: 1010,
          y: LANES[pk.lane],
          got: false
        });
      }
    }

    // =========================================================================
    // UPDATE OBSTACLES (MOTOS RAPPI, AK R200, ÑEROS CORRIENDO/FUMANDO, SKATERS)
    // =========================================================================
    for (let i = W23.obstacles.length - 1; i >= 0; i--) {
      const ob = W23.obstacles[i];
      if (!ob.alive) { W23.obstacles.splice(i, 1); continue; }
      ob.animT += dt;

      if (ob.pushed) {
        // Blasted flying away by Brayan's "¡CHITE!" power bubble!
        ob.x += ob.pushVx * dt;
        ob.y += ob.pushVy * dt;
        ob.pushVy += 880 * dt;
        ob.pushRot += ob.pushVrot * dt;
        if (ob.x > 1180 || ob.y > 680) {
          W23.obstacles.splice(i, 1);
        }
        continue;
      }

      ob.x -= ob.speed * dt;

      // Show iconic Bogotá street speech callout as obstacle enters right side of screen!
      if (!ob.shoutShown && ob.x < 910) {
        ob.shoutShown = true;
        addFloatText(Math.min(820, ob.x - 10), ob.y - 94, ob.shout, ob.shoutColor, 1.55);
      }

      // Dynamic weaving for marked skaters / heavy ñeros
      if (ob.laneSwitch && !ob.switched && ob.x < 680 && ob.x > 420) {
        ob.switched = true;
        const nextLane = ob.lane === 1 ? (Math.random() < 0.5 ? 0 : 2) : 1;
        ob.targetLane = nextLane;
        ob.lane = nextLane;
      }
      ob.y += (LANES[ob.targetLane] - ob.y) * Math.min(1, dt * 8);

      // Smoking ñero emits lingering smoke puffs behind him!
      if (ob.kind === 'nero_smoke') {
        ob.smokeT -= dt;
        if (ob.smokeT <= 0) {
          ob.smokeT = 0.16;
          W23.smokePuffs.push({
            x: ob.x + 12,
            y: ob.y - 68 + (Math.random() - 0.5) * 10,
            vx: -40 + Math.random() * 25,
            vy: -24 - Math.random() * 18,
            r: 8 + Math.random() * 6,
            life: 0.95
          });
        }
      }

      // Count clean dodges when passing safely behind Brayan
      if (!ob.countedDodged && ob.x < P.x - 62) {
        ob.countedDodged = true;
        W23.dodgedCount++;
        W23.score += 75;
      }

      // Lane-accurate collision check with Brayan
      const sameLane = Math.abs(ob.y - P.y) < 34;
      const halfW = (ob.kind === 'rappi' || ob.kind === 'motero') ? 46 : 28;
      if (sameLane && Math.abs(ob.x - P.x) < halfW + 14) {
        damagePlayer(ob);
      }

      if (ob.x < -160) W23.obstacles.splice(i, 1);
    }

    // Update Pickups
    for (let i = W23.pickups.length - 1; i >= 0; i--) {
      const pk = W23.pickups[i];
      pk.x -= W23.walkSpeed * dt;
      if (!pk.got && Math.abs(pk.y - P.y) < 36 && Math.abs(pk.x - P.x) < 38) {
        pk.got = true;
        if (pk.type === 'tinto') {
          W23.tintoCount++;
          W23.score += 200;
          if (P.hp < P.maxHp) {
            P.hp++;
            addFloatText(pk.x, pk.y - 54, 'TINTO +1 ♥', '#fb923c');
          } else {
            addFloatText(pk.x, pk.y - 54, 'TINTO +200', '#fb923c');
          }
          SFX.heal();
        } else if (pk.type === 'empanada') {
          W23.score += 150;
          P.chiteCd = Math.max(0, P.chiteCd - 2.0);
          addFloatText(pk.x, pk.y - 54, L.w23ChiteBoost, '#22d3ee');
          SFX.collect();
        } else {
          W23.score += 150;
          addFloatText(pk.x, pk.y - 54, '+150 $500', '#facc15');
          SFX.coinGive();
        }
        spawnParticles(pk.x, pk.y - 24, '#fde047', 8, 125);
      }
      if (pk.got || pk.x < -80) W23.pickups.splice(i, 1);
    }

    // Update "¡CHITE!" Power Bubbles
    for (let i = W23.bubbles.length - 1; i >= 0; i--) {
      const b = W23.bubbles[i];
      b.life -= dt;
      const frac = 1 - Math.max(0, b.life / b.maxLife);
      b.r = 28 + (b.maxR - 28) * Math.min(1, frac * 1.35);
      if (b.life <= 0) W23.bubbles.splice(i, 1);
    }

    // Update Smoke Puffs, Particles & Floating Texts
    for (let i = W23.smokePuffs.length - 1; i >= 0; i--) {
      const s = W23.smokePuffs[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.r += 10 * dt;
      s.life -= dt;
      if (s.life <= 0) W23.smokePuffs.splice(i, 1);
    }
    for (let i = W23.particles.length - 1; i >= 0; i--) {
      const pt = W23.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 320 * dt;
      pt.life -= dt;
      if (pt.life <= 0) W23.particles.splice(i, 1);
    }
    for (let i = W23.floatTexts.length - 1; i >= 0; i--) {
      const ft = W23.floatTexts[i];
      ft.y -= 32 * dt;
      ft.life -= dt;
      if (ft.life <= 0) W23.floatTexts.splice(i, 1);
    }

    // Victory: Reached the Paradero / Bus Stop heading home to Bosa La Esperanza!
    if (W23.dist >= TOTAL_DIST) {
      W23.status = 'VICTORY';
      W23.score += (hard ? 1600 : 1000) + P.hp * 200;
      SFX.victory();
      showOverlay('VICTORY', getOverlayConfig('VICTORY'));
    }
  },

  render(ctx) {
    renderWorld2_3(ctx, W23);
  }
};
