import { t } from '../config/i18n.js';
import { SFX } from '../core/audio.js';
import { IMGS } from '../core/assets.js';
import { DOM, hideOverlay } from '../core/ui.js';
import { drawGroundShadow, drawFlippedSprite } from '../core/renderer.js';
import { stageManager } from '../core/stageManager.js';

const CUT5 = {
  carryScore: 0,
  beat: 0,
  beatTime: 0,
  totalTime: 0,
  typedChars: 0,
  charAccum: 0,
  fullyTyped: false,
  autoAdvanceTimer: 0,

  fadeIn: 1.0,
  brayanX: 140,
  brayanState: 'walk', // 'walk' | 'idle'
  walkTimer: 0,
  walkFrame: 0,
  cvDelivered: false,

  // Beat 2: Slow blood-red shift + dramatic zoom into demonic Majo portrait!
  bloodProgress: 0, // 0..1
  dreadPlayed: false,

  // Beat 3: Smooth dissolve to twilight "Es hora de volver a casa... Bosa La Esperanza"
  homeProgress: 0,  // 0..1
  embers: []
};

function spawnEmber() {
  CUT5.embers.push({
    x: 120 + Math.random() * 720,
    y: 540,
    vx: (Math.random() - 0.5) * 45,
    vy: -65 - Math.random() * 95,
    size: 3 + Math.random() * 5,
    color: Math.random() < 0.5 ? '#ef4444' : '#f97316',
    life: 1.2 + Math.random() * 1.1
  });
}

function setupBeat(idx) {
  const L = t();
  const beats = L.beats2_2To2_3;
  CUT5.beat = idx;
  CUT5.beatTime = 0;
  CUT5.typedChars = 0;
  CUT5.charAccum = 0;
  CUT5.fullyTyped = false;
  CUT5.autoAdvanceTimer = 0;

  const beatObj = beats[idx];
  DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
  DOM.dlgStep.textContent = `${idx + 1} / ${beats.length}`;
  DOM.dlgText.textContent = '';

  if (idx === 0) {
    CUT5.brayanX = 135;
    CUT5.brayanState = 'walk';
    CUT5.cvDelivered = false;
    CUT5.bloodProgress = 0;
    CUT5.homeProgress = 0;
  } else if (idx === 1) {
    CUT5.brayanX = 415;
    CUT5.brayanState = 'idle';
    CUT5.cvDelivered = true;
    SFX.collect();
  } else if (idx === 2) {
    CUT5.brayanX = 415;
    CUT5.brayanState = 'idle';
    CUT5.cvDelivered = true;
    CUT5.bloodProgress = 0;
    if (!CUT5.dreadPlayed) {
      CUT5.dreadPlayed = true;
      SFX.evilDread();
    }
  } else if (idx === 3) {
    CUT5.bloodProgress = 1;
    CUT5.homeProgress = 0;
    SFX.dream();
  }
}

function goToWorld2_3() {
  SFX.start();
  stageManager.goTo('WORLD_2_3', { params: { carryScore: CUT5.carryScore } });
}

function advanceCutscene() {
  const beats = t().beats2_2To2_3;
  const fullText = beats[CUT5.beat].text;
  if (!CUT5.fullyTyped) {
    CUT5.typedChars = fullText.length;
    CUT5.fullyTyped = true;
    DOM.dlgText.textContent = fullText;
    SFX.blip();
    return;
  }
  if (CUT5.beat < beats.length - 1) {
    SFX.select();
    setupBeat(CUT5.beat + 1);
  } else {
    goToWorld2_3();
  }
}

export const cutscene2_2To2_3Stage = {
  enter(params = {}) {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'flex';
    DOM.skipBtn.style.display = 'block';
    DOM.world1Controls.style.display = 'none';
    DOM.world2Controls.style.display = 'none';
    DOM.world4Controls.style.display = 'none';
    if (DOM.world23Controls) DOM.world23Controls.style.display = 'none';
    hideOverlay();

    CUT5.carryScore = params.carryScore || 0;
    CUT5.beat = 0;
    CUT5.beatTime = 0;
    CUT5.totalTime = 0;
    CUT5.fadeIn = 1.0;
    CUT5.brayanX = 135;
    CUT5.brayanState = 'walk';
    CUT5.walkTimer = 0;
    CUT5.walkFrame = 0;
    CUT5.cvDelivered = false;
    CUT5.bloodProgress = 0;
    CUT5.dreadPlayed = false;
    CUT5.homeProgress = 0;
    CUT5.embers = [];

    setupBeat(0);
  },

  exit() {
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    const L = t();
    const beats = L.beats2_2To2_3;
    const beatObj = beats[CUT5.beat];
    if (beatObj) {
      DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
      DOM.dlgStep.textContent = `${CUT5.beat + 1} / ${beats.length}`;
      DOM.dlgText.textContent = CUT5.fullyTyped
        ? beatObj.text
        : beatObj.text.slice(0, Math.min(CUT5.typedChars, beatObj.text.length));
    }
  },

  onAction(action) {
    if (action === 'ADVANCE_DIALOGUE') advanceCutscene();
    else if (action === 'SKIP_CUTSCENE') goToWorld2_3();
  },

  onKeyDown(k, e) {
    if (k === 'escape' || k === 's') {
      goToWorld2_3();
    } else if (k === ' ' || k === 'enter' || k === 'arrowright') {
      e.preventDefault();
      advanceCutscene();
    }
  },

  update(dt) {
    CUT5.totalTime += dt;
    CUT5.beatTime += dt;
    if (CUT5.fadeIn > 0) CUT5.fadeIn = Math.max(0, CUT5.fadeIn - dt * 1.15);

    const beats = t().beats2_2To2_3;
    const fullText = beats[CUT5.beat].text;

    if (!CUT5.fullyTyped) {
      CUT5.charAccum += dt * 42;
      const nextCount = Math.floor(CUT5.charAccum);
      if (nextCount > CUT5.typedChars) {
        CUT5.typedChars = Math.min(nextCount, fullText.length);
        DOM.dlgText.textContent = fullText.slice(0, CUT5.typedChars);
        if (CUT5.typedChars % 3 === 0) SFX.type();
        if (CUT5.typedChars >= fullText.length) CUT5.fullyTyped = true;
      }
    } else {
      CUT5.autoAdvanceTimer += dt;
      const wait = CUT5.beat === 2 ? 4.8 : (CUT5.beat === 3 ? 4.4 : 3.6);
      if (CUT5.autoAdvanceTimer >= wait) {
        if (CUT5.beat < beats.length - 1) setupBeat(CUT5.beat + 1);
        else goToWorld2_3();
      }
    }

    // Beat 0: Brayan walks cheerfully up to Majo with his freshly copied resume!
    if (CUT5.beat === 0) {
      if (CUT5.brayanX < 415) {
        CUT5.brayanX = Math.min(415, CUT5.brayanX + 135 * dt);
        CUT5.brayanState = 'walk';
        CUT5.walkTimer += dt;
        if (CUT5.walkTimer > 0.2) {
          CUT5.walkTimer = 0;
          CUT5.walkFrame = 1 - CUT5.walkFrame;
          SFX.step();
        }
      } else {
        CUT5.brayanState = 'idle';
        CUT5.cvDelivered = true;
      }
    }

    // Beat 2: Slow, chilling shift to blood-red + zoom into Majo's demonic face!
    if (CUT5.beat === 2) {
      CUT5.bloodProgress = Math.min(1, CUT5.bloodProgress + dt * 0.34);
      if (CUT5.bloodProgress > 0.22 && Math.random() < dt * 18) {
        spawnEmber();
      }
    }

    // Beat 3: Smooth, calm transition to "Es hora de volver a casa... Bosa La Esperanza"
    if (CUT5.beat === 3) {
      CUT5.homeProgress = Math.min(1, CUT5.homeProgress + dt * 0.65);
    }

    for (let i = CUT5.embers.length - 1; i >= 0; i--) {
      const em = CUT5.embers[i];
      em.x += em.vx * dt;
      em.y += em.vy * dt;
      em.life -= dt;
      if (em.life <= 0) CUT5.embers.splice(i, 1);
    }
  },

  render(ctx) {
    const L = t();
    ctx.save();

    // =========================================================================
    // BEATS 0..2: MAJO'S EXECUTIVE OFFICE -> SLOW BLOOD-RED DEMONIC ZOOM!
    // =========================================================================
    if (CUT5.beat < 3 || CUT5.homeProgress < 0.99) {
      ctx.save();

      // Subtle creeping camera zoom toward Majo (x = 595, y = 325) during Beat 2!
      const bp = CUT5.beat === 2 ? CUT5.bloodProgress : (CUT5.beat === 3 ? 1 : 0);
      if (bp > 0) {
        const zoom = 1 + bp * 0.48;
        const jitter = bp > 0.55 ? (bp - 0.55) * 6 : 0;
        const jx = jitter > 0 ? (Math.random() - 0.5) * jitter : 0;
        const jy = jitter > 0 ? (Math.random() - 0.5) * jitter : 0;
        ctx.translate(480 + jx, 270 + jy);
        ctx.scale(zoom, zoom);
        ctx.translate(-565, -315);
      }

      if (IMGS.cutscene_office_sofa && IMGS.cutscene_office_sofa.height > 0) {
        ctx.drawImage(IMGS.cutscene_office_sofa, 0, 0, 960, 540);
      } else {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, 960, 540);
      }

      const floorY = 474;

      // Majo Piza Romero standing by her executive desk (facing LEFT toward Brayan)
      const mImg = (CUT5.beat === 2)
        ? (IMGS.majo_smile || IMGS.majo_talk)
        : (Math.floor(CUT5.totalTime * 2.5) % 2 === 0 ? IMGS.majo_smile : IMGS.majo_talk);
      if (mImg && mImg.height > 0) {
        const mh = 192;
        const mw = mImg.width * (mh / mImg.height);
        const mx = 535;
        const my = floorY - mh + 4;
        drawGroundShadow(ctx, mx + mw * 0.5, floorY + 4, 34, 8);
        drawFlippedSprite(ctx, mImg, mx, my, mw, mh, -1);
      }

      // Brayan standing in front of her handing over the crisp photocopied resume!
      let bImg = IMGS.brayan_idle;
      let yBob = 0;
      if (CUT5.brayanState === 'walk') {
        bImg = CUT5.walkFrame === 0 ? IMGS.brayan_walk1 : IMGS.brayan_walk2;
        yBob = CUT5.walkFrame === 0 ? -3 : 0;
      }
      if (bImg && bImg.height > 0) {
        const bh = 188;
        const bw = Math.round(bImg.width * (bh / bImg.height));
        const bx = Math.round(CUT5.brayanX);
        const by = Math.round(floorY - bh + 4 + yBob);
        drawGroundShadow(ctx, bx + bw * 0.5, floorY + 4, 34, 8);
        drawFlippedSprite(ctx, bImg, bx, by, bw, bh, 1);
      }

      // Gleaming Photocopied Resume Sheet passing from Brayan's hand to Majo!
      const cvX = CUT5.cvDelivered ? 522 : (CUT5.brayanX + 66);
      const cvY = 368 + Math.sin(CUT5.totalTime * 5) * 2;
      ctx.fillStyle = '#0f172a'; ctx.fillRect(cvX - 13, cvY - 17, 26, 34);
      ctx.fillStyle = '#fefce8'; ctx.fillRect(cvX - 11, cvY - 15, 22, 30);
      ctx.fillStyle = '#2563eb'; ctx.fillRect(cvX - 7, cvY - 9, 14, 4);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cvX - 7, cvY - 1, 14, 2);
      ctx.fillRect(cvX - 7, cvY + 5, 11, 2);
      ctx.fillRect(cvX - 7, cvY + 10, 13, 2);

      ctx.restore();

      // SLOW BLOOD-RED HORROR WASH + ZOOMING DEMONIC MAJO PORTRAIT (Beat 2)!
      if (bp > 0.01) {
        // 1. Slow crimson blood-red atmospheric tint over the office
        ctx.fillStyle = `rgba(145, 8, 16, ${Math.min(0.86, bp * 0.92)})`;
        ctx.fillRect(0, 0, 960, 540);

        // 2. Cross-fade & slowly zoom into the terrifying 16-bit Demonic Majo Portrait!
        if (bp > 0.25 && IMGS.majo_demon && IMGS.majo_demon.height > 0) {
          const dAlpha = Math.min(1, (bp - 0.25) / 0.58);
          const dZoom = 0.88 + dAlpha * 0.34;
          const shakeX = dAlpha > 0.5 ? Math.sin(CUT5.totalTime * 42) * (dAlpha * 3.5) : 0;
          const shakeY = dAlpha > 0.5 ? Math.cos(CUT5.totalTime * 37) * (dAlpha * 2.5) : 0;

          ctx.save();
          ctx.globalAlpha = dAlpha;
          ctx.fillStyle = `rgba(22, 0, 4, ${dAlpha * 0.92})`;
          ctx.fillRect(0, 0, 960, 540);

          const baseH = 490;
          const baseW = Math.round(IMGS.majo_demon.width * (baseH / IMGS.majo_demon.height));
          const dw = Math.round(baseW * dZoom);
          const dh = Math.round(baseH * dZoom);
          ctx.drawImage(IMGS.majo_demon, Math.round(480 - dw / 2 + shakeX), Math.round(270 - dh / 2 + shakeY), dw, dh);

          // Intense pulsing blood-red vignette & horror scanlines
          const grad = ctx.createRadialGradient(480, 250, 90, 480, 270, 520);
          grad.addColorStop(0, 'rgba(220, 38, 38, 0.08)');
          grad.addColorStop(0.65, 'rgba(127, 29, 29, 0.42)');
          grad.addColorStop(1, 'rgba(10, 0, 2, 0.94)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 960, 540);

          // Floating crimson embers rising around demonic Majo
          for (const em of CUT5.embers) {
            ctx.fillStyle = em.color;
            ctx.fillRect(Math.round(em.x), Math.round(em.y), Math.round(em.size), Math.round(em.size));
          }
          ctx.restore();
        }
      }
    }

    // =========================================================================
    // BEAT 3: SMOOTH TRANSITION -> "ES HORA DE VOLVER A CASA... BOSA LA ESPERANZA"
    // =========================================================================
    if (CUT5.beat === 3) {
      const hp = CUT5.homeProgress;
      ctx.save();
      ctx.globalAlpha = hp;

      // Calm twilight Bogotá indigo backdrop
      const sky = ctx.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, '#09071a');
      sky.addColorStop(0.55, '#1e1b4b');
      sky.addColorStop(1, '#312e81');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 960, 540);

      // Soft dimmed preview of Carrera 7a Centro Internacional twilight
      if (IMGS.bg_septima_ci_1 && IMGS.bg_septima_ci_1.height > 0) {
        ctx.save();
        ctx.globalAlpha = hp * 0.34;
        ctx.drawImage(IMGS.bg_septima_ci_1, 0, 0, 960, 540);
        ctx.restore();
      }

      // Soft starry twilight overlay
      for (let i = 0; i < 28; i++) {
        const sx = (i * 113 + 31) % 940;
        const sy = (i * 61 + 19) % 210;
        ctx.fillStyle = (Math.sin(CUT5.totalTime * 3 + i) > 0) ? '#fef08a' : '#93c5fd';
        ctx.fillRect(sx, sy, 3, 3);
      }

      // Poetic Retro SNES Chapter Card: "ES HORA DE VOLVER A CASA... BOSA LA ESPERANZA"
      const cardAlpha = Math.max(0, Math.min(1, (hp - 0.15) / 0.65));
      ctx.globalAlpha = cardAlpha;
      ctx.fillStyle = 'rgba(10, 8, 24, 0.88)';
      ctx.fillRect(120, 152, 720, 198);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.strokeRect(120, 152, 720, 198);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(128, 160, 704, 182);

      ctx.font = 'bold 18px "Press Start 2P", monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(L.cut23HomeLine1, 480, 224);

      ctx.font = 'bold 24px "Press Start 2P", monospace';
      ctx.fillStyle = '#fde047';
      ctx.fillText(L.cut23HomeLine2, 480, 278);

      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(L.cut23HomeSub, 480, 322);

      ctx.restore();
    }

    // Subtle location chyron (hidden during full demonic horror peak & home card)
    if (CUT5.beat < 2) {
      const bannerW = 340;
      const bannerX = 960 - bannerW;
      const bannerY = 468;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(bannerX, bannerY - 30, bannerW, 28);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(bannerX, bannerY - 30, bannerW, 3);
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'right';
      ctx.fillText(L.cut21OfficeLabel, 948, bannerY - 11);

      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(bannerX - 18, bannerY + 34);
      ctx.lineTo(bannerX, bannerY);
      ctx.lineTo(960, bannerY);
      ctx.lineTo(960, bannerY + 34);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(L.cut23ChapterTag, 948, bannerY + 22);
    }

    if (CUT5.fadeIn > 0) {
      ctx.fillStyle = `rgba(12, 8, 28, ${CUT5.fadeIn})`;
      ctx.fillRect(0, 0, 960, 540);
    }

    ctx.restore();
  }
};
