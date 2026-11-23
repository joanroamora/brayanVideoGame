import { t } from '../config/i18n.js';
import { SFX } from '../core/audio.js';
import { IMGS } from '../core/assets.js';
import { DOM, hideOverlay } from '../core/ui.js';
import { drawGroundShadow, drawFlippedSprite } from '../core/renderer.js';
import { stageManager } from '../core/stageManager.js';

const CUT2 = {
  carryScore: 0,
  beat: 0,
  beatTime: 0,
  totalTime: 0,
  typedChars: 0,
  charAccum: 0,
  fullyTyped: false,
  autoAdvanceTimer: 0,

  // Brayan animation on Calle 26 platform
  brayanX: 446,
  brayanY: 416,
  brayanScale: 0.78,
  brayanFacing: -1,
  brayanState: 'walk', // 'walk' | 'idle' | 'phone' | 'board' | 'inside'
  brayanAlpha: 1,
  walkTimer: 0,
  walkFrame: 0,

  // Departing bus from World 1-2 (Beat 0)
  prevBusX: 220,
  prevBusDoor: 0.9,
  prevBusStarted: false,

  // Incoming G45 Portal Sur bus (Beats 1-2)
  busX: -620,
  busDoor: 0,
  busArrived: false,
  busDoorClosedSfx: false,
  busDeparted: false,

  // Beat 3 Portal Sur travel view
  portalFade: 0,
  portalScroll: 0,
  travelBusX: -240,

  puffs: []
};

function spawnPuff(x, y, vx = -40, color = '#e2e8f0') {
  CUT2.puffs.push({
    x,
    y,
    vx: vx + (Math.random() - 0.5) * 24,
    vy: -14 - Math.random() * 20,
    size: 5 + Math.random() * 6,
    color,
    life: 0.55 + Math.random() * 0.35
  });
}

function setupBeat(idx) {
  const L = t();
  const beats = L.beats1_2To1_3;
  CUT2.beat = idx;
  CUT2.beatTime = 0;
  CUT2.typedChars = 0;
  CUT2.charAccum = 0;
  CUT2.fullyTyped = false;
  CUT2.autoAdvanceTimer = 0;

  const beatObj = beats[idx];
  DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
  DOM.dlgStep.textContent = `${idx + 1} / ${beats.length}`;
  DOM.dlgText.textContent = '';

  if (idx === 1) {
    // Ensure Brayan is ready on platform looking at route & G45 bus begins rolling in
    CUT2.brayanX = 278;
    CUT2.brayanY = 472;
    CUT2.brayanScale = 1.0;
    CUT2.brayanFacing = 1;
    CUT2.brayanState = 'phone';
    CUT2.brayanAlpha = 1;
    CUT2.busX = -590;
    CUT2.busDoor = 0;
    CUT2.busArrived = false;
  } else if (idx === 2) {
    // Ensure G45 bus is parked with open doors ready for boarding
    CUT2.busX = 210;
    CUT2.busDoor = 1;
    CUT2.busArrived = true;
    CUT2.busDoorClosedSfx = false;
    CUT2.busDeparted = false;
    CUT2.brayanFacing = 1;
    CUT2.brayanState = 'walk';
    CUT2.brayanAlpha = 1;
  } else if (idx === 3) {
    CUT2.brayanState = 'inside';
    CUT2.brayanAlpha = 0;
    CUT2.travelBusX = -180;
    SFX.dream();
  }
}

function goToWorld1_3() {
  SFX.start();
  stageManager.goTo('WORLD_1_3', { params: { carryScore: CUT2.carryScore } });
}

function advanceCutscene() {
  const beats = t().beats1_2To1_3;
  const fullText = beats[CUT2.beat].text;
  if (!CUT2.fullyTyped) {
    CUT2.typedChars = fullText.length;
    CUT2.fullyTyped = true;
    DOM.dlgText.textContent = fullText;
    SFX.blip();
    return;
  }
  if (CUT2.beat < beats.length - 1) {
    SFX.select();
    setupBeat(CUT2.beat + 1);
  } else {
    goToWorld1_3();
  }
}

/**
 * Draws a detailed 16-bit Red Articulated TransMilenio bus on the station bus lane.
 * Door center is located around (bx + 270), aligning with the Calle 26 doorway (x = 480) at bx = 210.
 */
function drawArticulatedBus(ctx, bx, by, routeLabel, doorOpen, showBrayanInside) {
  ctx.save();
  const totalW = 540;
  const bodyH = 148;

  // Ground / road shadow under bus
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.fillRect(bx + 12, by + bodyH + 2, totalW - 24, 12);

  // Outer pixel border & main two-section red chassis
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(bx - 3, by - 3, 212, bodyH + 6);
  ctx.fillRect(bx + 235, by - 3, 308, bodyH + 6);

  // Rear articulated section
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(bx, by, 206, bodyH);
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(bx, by + 114, 206, 34);

  // Black pleated accordion joint
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(bx + 206, by + 6, 32, bodyH - 12);
  ctx.fillStyle = '#334155';
  for (let px = 0; px < 4; px++) {
    ctx.fillRect(bx + 210 + px * 7, by + 10, 3, bodyH - 20);
  }

  // Front articulated section (contains boarding doorway + driver cab)
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(bx + 238, by, 302, bodyH);
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(bx + 238, by + 114, 302, 34);

  // Iconic white roof strip + yellow/silver accent band
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(bx, by, 206, 12);
  ctx.fillRect(bx + 238, by, 302, 12);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(bx, by + 108, 206, 5);
  ctx.fillRect(bx + 238, by + 108, 302, 5);

  // Rear section tinted windows + grab rails
  for (let i = 0; i < 3; i++) {
    const wx = bx + 14 + i * 62;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(wx - 2, by + 22, 54, 56);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(wx, by + 24, 50, 52);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(wx + 4, by + 28, 12, 44);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(wx + 24, by + 24, 3, 52);
  }

  // Boarding Doorway (aligned with station doors when parked at bx = 210 -> doorway at x = 448..516)
  const doorX = bx + 248;
  const doorY = by + 20;
  const doorW = 68;
  const doorH = 118;

  // Warm lit interior behind doors
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(doorX - 2, doorY - 2, doorW + 4, doorH + 4);
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(doorX, doorY + 92, doorW, 26);
  // Interior yellow handrail
  ctx.fillStyle = '#eab308';
  ctx.fillRect(doorX + 32, doorY + 4, 4, 92);

  // Sliding red bus doors (open smoothly to left & right)
  const slide = Math.round(doorOpen * 30);
  const leafW = Math.max(4, 34 - slide);
  // Left leaf
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(doorX, doorY, leafW, doorH);
  ctx.fillStyle = '#e0f2fe';
  if (leafW > 10) ctx.fillRect(doorX + 4, doorY + 8, leafW - 8, 56);
  // Right leaf
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(doorX + doorW - leafW, doorY, leafW, doorH);
  ctx.fillStyle = '#e0f2fe';
  if (leafW > 10) ctx.fillRect(doorX + doorW - leafW + 4, doorY + 8, leafW - 8, 56);

  // Passenger window right next to door (shows Brayan inside after boarding!)
  const winX = bx + 332;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(winX - 2, by + 22, 92, 56);
  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(winX, by + 24, 88, 52);
  if (showBrayanInside && IMGS.brayan_idle && IMGS.brayan_idle.height > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(winX, by + 24, 88, 52);
    ctx.clip();
    const spr = IMGS.brayan_idle;
    const bh = 96;
    const bw = spr.width * (bh / spr.height);
    ctx.drawImage(spr, winX + 44 - bw / 2, by + 24, bw, bh);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.fillRect(winX + 6, by + 26, 16, 48);

  // Driver windshield & front cab
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(bx + 436, by + 22, 96, 60);
  ctx.fillStyle = '#7dd3fc';
  ctx.fillRect(bx + 438, by + 24, 92, 56);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(bx + 444, by + 28, 18, 48);

  // Glowing LED Route Sign on bus side/front
  ctx.fillStyle = '#09090b';
  ctx.fillRect(bx + 332, by + 84, 146, 20);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + 332, by + 84, 146, 20);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 9px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(routeLabel, bx + 405, by + 98);

  // Headlight & taillight
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(bx + 530, by + 116, 10, 12);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(bx, by + 116, 8, 12);

  // Wheels
  const wheels = [bx + 52, bx + 158, bx + 356, bx + 482];
  for (const wx of wheels) {
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(wx, by + bodyH + 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(wx, by + bodyH + 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(wx - 2, by + bodyH, 4, 4);
  }

  ctx.restore();
}

/**
 * Smaller traveling red articulated bus for Beat 3 highway shot heading into Portal Sur.
 */
function drawTravelBus(ctx, sx, y, routeLabel) {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.fillRect(sx + 8, y + 72, 294, 10);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(sx - 2, y - 2, 314, 72);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(sx, y, 138, 68);
  ctx.fillRect(sx + 158, y, 152, 68);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(sx + 138, y + 3, 20, 62);
  ctx.fillStyle = '#475569';
  ctx.fillRect(sx + 143, y + 4, 3, 60);
  ctx.fillRect(sx + 150, y + 4, 3, 60);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(sx, y, 138, 7);
  ctx.fillRect(sx + 158, y, 152, 7);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(sx, y + 50, 138, 3);
  ctx.fillRect(sx + 158, y + 50, 152, 3);
  ctx.fillStyle = '#bae6fd';
  for (let i = 0; i < 3; i++) ctx.fillRect(sx + 10 + i * 42, y + 14, 32, 24);
  for (let i = 0; i < 3; i++) ctx.fillRect(sx + 168 + i * 44, y + 14, 34, 24);
  ctx.fillStyle = '#000';
  ctx.fillRect(sx + 170, y + 42, 92, 16);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 7px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(routeLabel, sx + 216, y + 53);
  ctx.fillStyle = '#09090b';
  [sx + 34, sx + 114, sx + 206, sx + 278].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, y + 68, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(wx, y + 68, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#09090b';
  });
  ctx.restore();
}

export const cutscene1_2To1_3Stage = {
  enter(params = {}) {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'flex';
    DOM.skipBtn.style.display = 'block';
    DOM.world1Controls.style.display = 'none';
    DOM.world2Controls.style.display = 'none';
    DOM.world4Controls.style.display = 'none';
    hideOverlay();

    CUT2.carryScore = params.carryScore || 0;
    CUT2.beat = 0;
    CUT2.beatTime = 0;
    CUT2.totalTime = 0;

    CUT2.brayanX = 458;
    CUT2.brayanY = 412;
    CUT2.brayanScale = 0.78;
    CUT2.brayanFacing = -1;
    CUT2.brayanState = 'walk';
    CUT2.brayanAlpha = 1;
    CUT2.walkTimer = 0;
    CUT2.walkFrame = 0;

    CUT2.prevBusX = 210;
    CUT2.prevBusDoor = 0.95;
    CUT2.prevBusStarted = false;

    CUT2.busX = -620;
    CUT2.busDoor = 0;
    CUT2.busArrived = false;
    CUT2.busDoorClosedSfx = false;
    CUT2.busDeparted = false;

    CUT2.portalFade = 0;
    CUT2.portalScroll = 0;
    CUT2.travelBusX = -180;
    CUT2.puffs = [];

    SFX.busStop();
    setupBeat(0);
  },

  exit() {
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
  },

  onLocalize() {
    const L = t();
    const beats = L.beats1_2To1_3;
    const beatObj = beats[CUT2.beat];
    if (beatObj) {
      DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
      DOM.dlgStep.textContent = `${CUT2.beat + 1} / ${beats.length}`;
      DOM.dlgText.textContent = CUT2.fullyTyped
        ? beatObj.text
        : beatObj.text.slice(0, Math.min(CUT2.typedChars, beatObj.text.length));
    }
  },

  onAction(action) {
    if (action === 'ADVANCE_DIALOGUE') advanceCutscene();
    else if (action === 'SKIP_CUTSCENE') goToWorld1_3();
  },

  onKeyDown(k, e) {
    if (k === 'escape' || k === 's') {
      goToWorld1_3();
    } else if (k === ' ' || k === 'enter' || k === 'arrowright') {
      e.preventDefault();
      advanceCutscene();
    }
  },

  update(dt) {
    CUT2.totalTime += dt;
    CUT2.beatTime += dt;
    const beats = t().beats1_2To1_3;
    const fullText = beats[CUT2.beat].text;

    if (!CUT2.fullyTyped) {
      CUT2.charAccum += dt * 42;
      const nextCount = Math.floor(CUT2.charAccum);
      if (nextCount > CUT2.typedChars) {
        CUT2.typedChars = Math.min(nextCount, fullText.length);
        DOM.dlgText.textContent = fullText.slice(0, CUT2.typedChars);
        if (CUT2.typedChars % 3 === 0) SFX.type();
        if (CUT2.typedChars >= fullText.length) CUT2.fullyTyped = true;
      }
    } else {
      CUT2.autoAdvanceTimer += dt;
      if (CUT2.autoAdvanceTimer >= (CUT2.beat === 3 ? 2.8 : 3.4)) {
        if (CUT2.beat < beats.length - 1) setupBeat(CUT2.beat + 1);
        else goToWorld1_3();
      }
    }

    // Beat 0: Brayan steps off the Calle 26 bus onto the platform while previous bus departs
    if (CUT2.beat === 0) {
      if (CUT2.beatTime < 1.55) {
        const p = Math.min(1, CUT2.beatTime / 1.55);
        CUT2.brayanX = 458 - p * 180;
        CUT2.brayanY = 412 + p * 60;
        CUT2.brayanScale = 0.78 + p * 0.22;
        CUT2.brayanFacing = -1;
        CUT2.brayanState = 'walk';
        CUT2.walkTimer += dt;
        if (CUT2.walkTimer > 0.2) {
          CUT2.walkTimer = 0;
          CUT2.walkFrame = 1 - CUT2.walkFrame;
          SFX.step();
        }
      } else {
        CUT2.brayanX = 278;
        CUT2.brayanY = 472;
        CUT2.brayanScale = 1.0;
        CUT2.brayanFacing = 1;
        CUT2.brayanState = 'idle';
      }

      if (CUT2.beatTime > 0.8) {
        CUT2.prevBusDoor = Math.max(0, CUT2.prevBusDoor - dt * 2.2);
      }
      if (CUT2.beatTime > 1.35) {
        if (!CUT2.prevBusStarted) {
          CUT2.prevBusStarted = true;
          SFX.windowOpen();
        }
        CUT2.prevBusX += 380 * dt;
        if (Math.random() < dt * 10 && CUT2.prevBusX < 980) {
          spawnPuff(CUT2.prevBusX + 10, 370, -60, '#cbd5e1');
        }
      }
    }

    // Beat 1: Brayan checks phone/route while the G45 Portal Sur bus pulls in and opens doors
    if (CUT2.beat === 1) {
      CUT2.brayanState = 'phone';
      CUT2.brayanFacing = 1;
      if (CUT2.busX < 210) {
        const dist = 210 - CUT2.busX;
        const spd = Math.max(120, Math.min(460, dist * 2.4));
        CUT2.busX = Math.min(210, CUT2.busX + spd * dt);
        if (Math.random() < dt * 8) {
          spawnPuff(CUT2.busX + 12, 372, -50, '#e2e8f0');
        }
      } else {
        if (!CUT2.busArrived) {
          CUT2.busArrived = true;
          SFX.busStop();
        }
        CUT2.busDoor = Math.min(1, CUT2.busDoor + dt * 2.0);
      }
    }

    // Beat 2: Brayan walks straight into the open G45 bus doors, doors shut, bus accelerates away
    if (CUT2.beat === 2) {
      if (CUT2.beatTime < 1.35) {
        const p = Math.min(1, CUT2.beatTime / 1.35);
        CUT2.brayanX = 278 + p * 182;
        CUT2.brayanY = 472 - p * 60;
        CUT2.brayanScale = 1.0 - p * 0.24;
        CUT2.brayanFacing = 1;
        CUT2.brayanState = 'walk';
        CUT2.brayanAlpha = p > 0.82 ? Math.max(0, 1 - (p - 0.82) / 0.18) : 1;
        CUT2.walkTimer += dt;
        if (CUT2.walkTimer > 0.18) {
          CUT2.walkTimer = 0;
          CUT2.walkFrame = 1 - CUT2.walkFrame;
          SFX.step();
        }
      } else {
        CUT2.brayanState = 'inside';
        CUT2.brayanAlpha = 0;
        if (!CUT2.busDoorClosedSfx) {
          CUT2.busDoorClosedSfx = true;
          SFX.windowOpen();
        }
        CUT2.busDoor = Math.max(0, CUT2.busDoor - dt * 2.4);
        if (CUT2.busDoor <= 0.05) {
          CUT2.busDeparted = true;
          CUT2.busX += (280 + (CUT2.beatTime - 1.7) * 260) * dt;
          if (Math.random() < dt * 14 && CUT2.busX < 1000) {
            spawnPuff(CUT2.busX + 12, 372, -80, '#cbd5e1');
          }
        }
      }
    }

    // Beat 3: Travel dissolve showing G45 articulated bus racing toward Portal Sur
    if (CUT2.beat === 3) {
      CUT2.portalFade = Math.min(1, CUT2.portalFade + dt * 1.6);
      CUT2.portalScroll += 135 * dt;
      CUT2.travelBusX += 265 * dt;
      if (CUT2.travelBusX > 1060) CUT2.travelBusX = -320;
      if (Math.random() < dt * 12) {
        spawnPuff(CUT2.travelBusX + 4, 418, -95, '#e2e8f0');
      }
    }

    // Update exhaust/dust puffs
    for (let i = CUT2.puffs.length - 1; i >= 0; i--) {
      const pf = CUT2.puffs[i];
      pf.x += pf.vx * dt;
      pf.y += pf.vy * dt;
      pf.life -= dt;
      if (pf.life <= 0) CUT2.puffs.splice(i, 1);
    }
  },

  render(ctx) {
    const L = t();
    ctx.save();

    // 1. Base 16-bit Estación Calle 26 platform background
    const stationBg = IMGS.cutscene_calle26;
    if (stationBg && stationBg.height > 0) {
      ctx.drawImage(stationBg, 0, 0, 960, 540);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 960, 540);
    }

    // 2. Articulated TransMilenio bus on the bus bay behind the station glass & pillars
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 212, 960, 186);
    ctx.clip();
    if (CUT2.beat === 0 && CUT2.prevBusX < 1020) {
      drawArticulatedBus(ctx, Math.round(CUT2.prevBusX), 234, 'B12 CALLE 26', CUT2.prevBusDoor, false);
    } else if (CUT2.beat === 1 || CUT2.beat === 2) {
      drawArticulatedBus(
        ctx,
        Math.round(CUT2.busX),
        234,
        L.cut12To13BusRoute,
        CUT2.busDoor,
        CUT2.brayanState === 'inside'
      );
    }
    ctx.restore();

    // Re-layer station glass tint (outside center open doorway), silver door mullions & opaque steel pillars over the bus!
    if (stationBg && stationBg.height > 0 && CUT2.beat < 3) {
      ctx.save();
      // Subtle reflective glass sheen on side glass panels & open glass door leaves (bus stays visible behind glass!)
      ctx.fillStyle = 'rgba(186, 230, 253, 0.16)';
      ctx.fillRect(0, 214, 398, 182);
      ctx.fillRect(562, 214, 398, 182);
      // Crisp silver sliding-door frames (hollow rectangles so bus shines cleanly through the glass!)
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.strokeRect(290, 216, 108, 178);
      ctx.strokeRect(562, 216, 108, 178);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(288, 214, 112, 182);
      ctx.strokeRect(560, 214, 112, 182);
      // Re-draw opaque left & right vertical steel columns directly on top of the bus
      ctx.drawImage(stationBg, 134, 196, 36, 224, 134, 196, 36, 224);
      ctx.drawImage(stationBg, 790, 196, 36, 224, 790, 196, 36, 224);
      ctx.restore();
    }

    // 3. Exhaust puffs
    for (const pf of CUT2.puffs) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(0.75, pf.life));
      ctx.fillStyle = pf.color;
      ctx.fillRect(Math.round(pf.x), Math.round(pf.y), Math.round(pf.size), Math.round(pf.size));
      ctx.restore();
    }

    // 4. Brayan on the Calle 26 boarding platform
    if (CUT2.brayanAlpha > 0.01 && CUT2.brayanState !== 'inside') {
      let bImg = IMGS.brayan_idle;
      let yBob = 0;
      if (CUT2.brayanState === 'walk') {
        bImg = CUT2.walkFrame === 0 ? IMGS.brayan_walk1 : IMGS.brayan_walk2;
        yBob = CUT2.walkFrame === 0 ? -3 : 0;
      } else if (CUT2.brayanState === 'phone') {
        bImg = IMGS.brayan_phone || IMGS.brayan_idle;
        yBob = Math.sin(CUT2.totalTime * 3.5) * 1.5;
      }

      if (bImg && bImg.height > 0) {
        const bh = Math.round(186 * CUT2.brayanScale);
        const bw = Math.round(bImg.width * (bh / bImg.height));
        const bx = Math.round(CUT2.brayanX);
        const by = Math.round(CUT2.brayanY - bh + yBob);
        ctx.save();
        ctx.globalAlpha = CUT2.brayanAlpha;
        drawGroundShadow(ctx, bx + bw * 0.5, CUT2.brayanY + 3, Math.round(34 * CUT2.brayanScale), 8);
        drawFlippedSprite(ctx, bImg, bx, by, bw, bh, CUT2.brayanFacing);
        ctx.restore();
      }
    }

    // 5. Beat 3: Travel transition toward Portal Sur (16-bit bg_portal_sur + zooming G45 bus)
    if (CUT2.portalFade > 0.01) {
      ctx.save();
      ctx.globalAlpha = CUT2.portalFade;
      ctx.fillStyle = '#3482ad';
      ctx.fillRect(0, 0, 960, 540);

      const pbg = IMGS.bg_portal_sur;
      if (pbg && pbg.height > 0) {
        const bgH = 448;
        const bgW = Math.round(pbg.width * (bgH / pbg.height));
        const scrollX = -((CUT2.portalScroll) % bgW);
        for (let ox = scrollX - bgW; ox < 960 + bgW; ox += bgW) {
          ctx.drawImage(pbg, Math.round(ox), 0, bgW, bgH);
        }
      }

      // Asphalt trunk road at bottom
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 424, 960, 116);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 424, 960, 6);
      ctx.fillStyle = '#fde047';
      const dashOff = -Math.round((CUT2.portalScroll * 2.4) % 88);
      for (let dx = dashOff; dx < 960; dx += 88) {
        ctx.fillRect(dx, 464, 44, 6);
      }

      drawTravelBus(ctx, Math.round(CUT2.travelBusX), 368, L.cut12To13BusRoute);

      // Subtle dream vignette
      const grad = ctx.createRadialGradient(480, 260, 120, 480, 260, 560);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0)');
      grad.addColorStop(1, 'rgba(15, 10, 42, 0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 960, 540);
      ctx.restore();
    }

    // 6. Retro Transit Lower-Third Route Badge (matching introCutsceneStage TV banner style!)
    const bannerW = 336;
    const bannerX = 960 - bannerW;
    const bannerY = 468;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(bannerX, bannerY - 30, bannerW, 28);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(bannerX, bannerY - 30, bannerW, 3);
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'right';
    ctx.fillText(L.cut12To13BannerTitle, 948, bannerY - 11);

    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(bannerX - 18, bannerY + 34);
    ctx.lineTo(bannerX, bannerY);
    ctx.lineTo(960, bannerY);
    ctx.lineTo(960, bannerY + 34);
    ctx.closePath();
    ctx.fill();

    if (Math.floor(CUT2.totalTime * 2.4) % 2 === 0) {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(bannerX + 12, bannerY + 11, 10, 10);
    }
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(CUT2.beat >= 2 ? L.cut12To13NextStop : L.cut12To13BusRoute, 948, bannerY + 22);

    ctx.restore();
  }
};
