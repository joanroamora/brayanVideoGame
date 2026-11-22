import { t } from '../config/i18n.js';
import { SFX } from '../core/audio.js';
import { IMGS } from '../core/assets.js';
import { DOM, hideOverlay } from '../core/ui.js';
import { drawGroundShadow } from '../core/renderer.js';
import { stageManager } from '../core/stageManager.js';

const CUT = {
  beat: 0,
  beatTime: 0,
  totalTime: 0,
  typedChars: 0,
  charAccum: 0,
  fullyTyped: false,
  autoAdvanceTimer: 0,
  brayanX: 60,
  brayanState: 'walk',
  walkTimer: 0,
  walkFrame: 0,
  tripProgress: 0,
  shakeTime: 0,
  flashAlpha: 0,
  fogAlpha: 0,
  crashPlayed: false,
  dreamPlayed: false,
  papers: []
};

function setupBeat(idx) {
  const L = t();
  CUT.beat = idx;
  CUT.beatTime = 0;
  CUT.typedChars = 0;
  CUT.charAccum = 0;
  CUT.fullyTyped = false;
  CUT.autoAdvanceTimer = 0;

  const beatObj = L.beats[idx];
  DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
  DOM.dlgStep.textContent = `${idx + 1} / ${L.beats.length}`;
  DOM.dlgText.textContent = '';

  if (idx === 3) {
    CUT.brayanState = 'trip';
    CUT.tripProgress = 0;
    CUT.shakeTime = 0.45;
    CUT.flashAlpha = 0.65;
    if (!CUT.crashPlayed) {
      SFX.crash();
      CUT.crashPlayed = true;
    }
    CUT.papers = [];
    for (let i = 0; i < 8; i++) {
      CUT.papers.push({
        x: CUT.brayanX + 55 + (Math.random() - 0.5) * 30,
        y: 340 + (Math.random() - 0.5) * 40,
        vx: 40 + Math.random() * 140,
        vy: -160 - Math.random() * 120,
        rot: Math.random() * 6.28,
        vrot: (Math.random() - 0.5) * 9,
        w: 14 + Math.random() * 6,
        h: 18 + Math.random() * 6
      });
    }
  } else if (idx === 4) {
    CUT.brayanState = 'ko';
    if (!CUT.dreamPlayed) {
      SFX.dream();
      CUT.dreamPlayed = true;
    }
  }
}

function goToWorld1() {
  SFX.start();
  stageManager.goTo('WORLD_1_1');
}

function advanceCutscene() {
  const L = t();
  const fullText = L.beats[CUT.beat].text;
  if (!CUT.fullyTyped) {
    CUT.typedChars = fullText.length;
    CUT.fullyTyped = true;
    DOM.dlgText.textContent = fullText;
    SFX.blip();
    return;
  }
  if (CUT.beat < L.beats.length - 1) {
    SFX.select();
    setupBeat(CUT.beat + 1);
  } else {
    goToWorld1();
  }
}

export const introCutsceneStage = {
  enter() {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'flex';
    DOM.skipBtn.style.display = 'block';
    DOM.world1Controls.style.display = 'none';
    hideOverlay();

    CUT.beat = 0;
    CUT.beatTime = 0;
    CUT.totalTime = 0;
    CUT.brayanX = 60;
    CUT.brayanState = 'walk';
    CUT.walkTimer = 0;
    CUT.walkFrame = 0;
    CUT.tripProgress = 0;
    CUT.shakeTime = 0;
    CUT.flashAlpha = 0;
    CUT.fogAlpha = 0;
    CUT.crashPlayed = false;
    CUT.dreamPlayed = false;
    CUT.papers = [];
    setupBeat(0);
  },

  exit() {
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
  },

  onLocalize() {
    const L = t();
    const beatObj = L.beats[CUT.beat];
    if (beatObj) {
      DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
      DOM.dlgStep.textContent = `${CUT.beat + 1} / ${L.beats.length}`;
      DOM.dlgText.textContent = CUT.fullyTyped
        ? beatObj.text
        : beatObj.text.slice(0, Math.min(CUT.typedChars, beatObj.text.length));
    }
  },

  onAction(action) {
    if (action === 'ADVANCE_DIALOGUE') advanceCutscene();
    else if (action === 'SKIP_CUTSCENE') goToWorld1();
  },

  onKeyDown(k, e) {
    if (k === 'escape' || k === 's') {
      goToWorld1();
    } else if (k === ' ' || k === 'enter' || k === 'arrowright') {
      e.preventDefault();
      advanceCutscene();
    }
  },

  update(dt) {
    CUT.totalTime += dt;
    CUT.beatTime += dt;
    const fullText = t().beats[CUT.beat].text;

    if (!CUT.fullyTyped) {
      CUT.charAccum += dt * 40;
      const nextCount = Math.floor(CUT.charAccum);
      if (nextCount > CUT.typedChars) {
        CUT.typedChars = Math.min(nextCount, fullText.length);
        DOM.dlgText.textContent = fullText.slice(0, CUT.typedChars);
        if (CUT.typedChars % 3 === 0) SFX.type();
        if (CUT.typedChars >= fullText.length) CUT.fullyTyped = true;
      }
    } else {
      CUT.autoAdvanceTimer += dt;
      if (CUT.autoAdvanceTimer >= (CUT.beat === 4 ? 3.0 : 3.6)) {
        if (CUT.beat < t().beats.length - 1) setupBeat(CUT.beat + 1);
        else goToWorld1();
      }
    }

    if (CUT.beat === 0) {
      if (CUT.brayanX < 250) {
        CUT.brayanX += 72 * dt;
        CUT.brayanState = 'walk';
        CUT.walkTimer += dt;
        if (CUT.walkTimer > 0.22) {
          CUT.walkTimer = 0;
          CUT.walkFrame = 1 - CUT.walkFrame;
          SFX.step();
        }
      } else {
        CUT.brayanState = 'idle';
      }
    } else if (CUT.beat === 1) {
      if (CUT.brayanX < 320) {
        CUT.brayanX += 38 * dt;
        CUT.brayanState = 'walk';
        CUT.walkTimer += dt;
        if (CUT.walkTimer > 0.28) {
          CUT.walkTimer = 0;
          CUT.walkFrame = 1 - CUT.walkFrame;
        }
      } else {
        CUT.brayanState = 'idle';
      }
    } else if (CUT.beat === 2) {
      if (CUT.brayanX < 415) {
        CUT.brayanX += 58 * dt;
        CUT.brayanState = 'walk';
        CUT.walkTimer += dt;
        if (CUT.walkTimer > 0.22) {
          CUT.walkTimer = 0;
          CUT.walkFrame = 1 - CUT.walkFrame;
          SFX.step();
        }
      }
    } else if (CUT.beat === 3) {
      CUT.tripProgress += dt;
      if (CUT.tripProgress < 0.72) {
        CUT.brayanState = 'trip';
        CUT.brayanX += 95 * dt;
      } else {
        CUT.brayanState = 'ko';
      }
    } else if (CUT.beat === 4) {
      CUT.brayanState = 'ko';
      CUT.fogAlpha = Math.min(0.92, CUT.fogAlpha + dt * 0.34);
    }

    if (CUT.shakeTime > 0) CUT.shakeTime = Math.max(0, CUT.shakeTime - dt);
    if (CUT.flashAlpha > 0) CUT.flashAlpha = Math.max(0, CUT.flashAlpha - dt * 2.2);

    CUT.papers.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt;
      p.vx *= 0.99;
      p.rot += p.vrot * dt;
      if (p.y > 465) {
        p.y = 465;
        p.vy = 0;
        p.vx *= 0.7;
        p.vrot = 0;
      }
    });
  },

  render(ctx) {
    ctx.save();
    if (CUT.shakeTime > 0) {
      const m = CUT.shakeTime * 18;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    if (IMGS.lobby) ctx.drawImage(IMGS.lobby, 0, 0, 960, 540);
    const floorY = 472;

    // Camera cable across the floor
    ctx.save();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(415, 466);
    ctx.bezierCurveTo(475, 456, 520, 478, 585, 468);
    ctx.bezierCurveTo(625, 462, 650, 456, 685, 454);
    ctx.stroke();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(408, 462, 9, 7);
    ctx.restore();

    const bob = Math.sin(CUT.totalTime * 5) * 1.5;

    // Cameraman
    if (IMGS.cameraman && IMGS.cameraman.height > 0) {
      const ch = 192;
      const cw = IMGS.cameraman.width * (ch / IMGS.cameraman.height);
      const camX = 635;
      const camY = floorY - ch + 4;
      drawGroundShadow(ctx, camX + cw * 0.5, floorY + 2, 40, 9);
      ctx.save();
      ctx.translate(camX + cw, camY);
      ctx.scale(-1, 1);
      ctx.drawImage(IMGS.cameraman, 0, 0, cw, ch);
      ctx.restore();
      if (Math.floor(CUT.totalTime * 2.5) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(camX + cw - 28, camY + 34, 6, 6);
      }
    }

    // Reporter
    if (IMGS.reporter && IMGS.reporter.height > 0) {
      const rh = 190;
      const rw = IMGS.reporter.width * (rh / IMGS.reporter.height);
      drawGroundShadow(ctx, 724 + rw * 0.5, floorY + 2, 34, 8);
      ctx.drawImage(IMGS.reporter, 724, floorY - rh + 4 + (CUT.beat === 1 ? bob * 0.6 : 0), rw, rh);
    }

    // Majo Piza Romero
    const majoTalk = (CUT.beat === 1 || CUT.beat === 2)
      ? (Math.floor(CUT.totalTime * 2.4) % 2 === 0)
      : (Math.floor(CUT.totalTime * 1.2) % 2 === 0);
    const mImg = majoTalk ? IMGS.majo_talk : IMGS.majo_smile;
    if (mImg && mImg.height > 0) {
      const mh = 194;
      const mw = mImg.width * (mh / mImg.height);
      drawGroundShadow(ctx, 865, floorY + 2, 38, 9);
      ctx.drawImage(mImg, 865 - mw / 2, floorY - mh + 4 + (majoTalk ? -Math.abs(bob) : 0), mw, mh);
    }

    // Brayan
    let bImg = IMGS.brayan_idle;
    let byOff = 0;
    let targetBH = 190;
    if (CUT.brayanState === 'walk') {
      bImg = CUT.walkFrame === 0 ? IMGS.brayan_walk1 : IMGS.brayan_walk2;
      byOff = CUT.walkFrame === 0 ? -2 : 0;
    } else if (CUT.brayanState === 'trip') {
      bImg = IMGS.brayan_trip;
      targetBH = 175;
      byOff = -12 + Math.sin(CUT.tripProgress * Math.PI) * -18;
    } else if (CUT.brayanState === 'ko') {
      bImg = IMGS.brayan_ko;
      targetBH = 88;
      byOff = 8;
    }

    if (bImg && bImg.height > 0) {
      const bh = targetBH;
      const bw = bImg.width * (bh / bImg.height);
      const by = floorY - bh + byOff;
      drawGroundShadow(ctx, CUT.brayanX + bw * 0.5, floorY + 4, CUT.brayanState === 'ko' ? 78 : 34, 9);
      ctx.drawImage(bImg, CUT.brayanX, by, bw, bh);
      if (CUT.brayanState === 'ko') {
        for (let i = 0; i < 3; i++) {
          const ang = CUT.totalTime * 4 + i * 2.09;
          ctx.fillStyle = '#fde047';
          ctx.fillRect(CUT.brayanX + bw * 0.82 + Math.cos(ang) * 24 - 3, by + 8 + Math.sin(ang) * 9 - 3, 6, 6);
        }
      }
    }

    // Flying resume papers
    CUT.papers.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    // Live TV Lower-third Banner
    const bannerW = 305;
    const bannerX = 960 - bannerW;
    const bannerY = 468;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(bannerX, bannerY - 30, bannerW, 28);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(bannerX, bannerY - 30, bannerW, 3);
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText('MAJO PIZA ROMERO', 948, bannerY - 10);

    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(bannerX - 18, bannerY + 34);
    ctx.lineTo(bannerX, bannerY);
    ctx.lineTo(960, bannerY);
    ctx.lineTo(960, bannerY + 34);
    ctx.closePath();
    ctx.fill();

    if (Math.floor(CUT.totalTime * 2) % 2 === 0) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(bannerX + 12, bannerY + 11, 10, 10);
    }
    ctx.font = 'bold 13px "Press Start 2P", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(t().tvLive, 948, bannerY + 23);

    if (CUT.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${CUT.flashAlpha})`;
      ctx.fillRect(0, 0, 960, 540);
    }
    if (CUT.fogAlpha > 0) {
      const grad = ctx.createRadialGradient(480, 270, 60, 480, 270, 560);
      grad.addColorStop(0, `rgba(124,58,237,${CUT.fogAlpha * 0.65})`);
      grad.addColorStop(1, `rgba(15,10,42,${CUT.fogAlpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 960, 540);
    }
    ctx.restore();
  }
};
