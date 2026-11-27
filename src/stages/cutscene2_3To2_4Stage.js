import { t } from '../config/i18n.js';
import { SFX } from '../core/audio.js';
import { IMGS } from '../core/assets.js';
import { DOM, hideOverlay } from '../core/ui.js';
import { drawGroundShadow, drawFlippedSprite } from '../core/renderer.js';
import { stageManager } from '../core/stageManager.js';

const CUT6 = {
  carryScore: 0,
  beat: 0,
  beatTime: 0,
  totalTime: 0,
  typedChars: 0,
  charAccum: 0,
  fullyTyped: false,
  autoAdvanceTimer: 0,

  fadeIn: 1.0,
  brayanX: 110,
  brayanState: 'walk', // 'walk' | 'idle' | 'inside'
  walkTimer: 0,
  walkFrame: 0,
  morningProgress: 0,
  roosterPlayed: false
};

function setupBeat(idx) {
  const L = t();
  const beats = L.beats2_3To2_4;
  CUT6.beat = idx;
  CUT6.beatTime = 0;
  CUT6.typedChars = 0;
  CUT6.charAccum = 0;
  CUT6.fullyTyped = false;
  CUT6.autoAdvanceTimer = 0;

  const beatObj = beats[idx];
  DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
  DOM.dlgStep.textContent = `${idx + 1} / ${beats.length}`;
  DOM.dlgText.textContent = '';

  if (idx === 0) {
    // Night arrival at Bosa La Esperanza — Interior 92 (still in suit, exhausted)
    CUT6.brayanX = 115;
    CUT6.brayanState = 'walk';
    CUT6.morningProgress = 0;
  } else if (idx === 1) {
    // Dissolve to next morning card
    CUT6.brayanX = 468;
    CUT6.brayanState = 'inside';
    CUT6.morningProgress = 0;
    if (!CUT6.roosterPlayed) {
      CUT6.roosterPlayed = true;
      SFX.roosterMorning();
    }
  } else if (idx === 2) {
    // Next morning: Brayan steps out of Interior 92 in Pintuco T-shirt, shorts & chanclas!
    CUT6.brayanX = 468;
    CUT6.brayanState = 'idle';
    CUT6.morningProgress = 1;
    SFX.collect();
  } else if (idx === 3) {
    // Mission briefing: walk to Tienda La Esperanza & back to Interior 92!
    CUT6.brayanX = 468;
    CUT6.brayanState = 'walk';
    SFX.dogBark();
  }
}

function goToWorld2_4() {
  SFX.start();
  stageManager.goTo('WORLD_2_4', { params: { carryScore: CUT6.carryScore } });
}

function advanceCutscene() {
  const beats = t().beats2_3To2_4;
  const fullText = beats[CUT6.beat].text;
  if (!CUT6.fullyTyped) {
    CUT6.typedChars = fullText.length;
    CUT6.fullyTyped = true;
    DOM.dlgText.textContent = fullText;
    SFX.blip();
    return;
  }
  if (CUT6.beat < beats.length - 1) {
    SFX.select();
    setupBeat(CUT6.beat + 1);
  } else {
    goToWorld2_4();
  }
}

export const cutscene2_3To2_4Stage = {
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

    CUT6.carryScore = params.carryScore || 0;
    CUT6.beat = 0;
    CUT6.beatTime = 0;
    CUT6.totalTime = 0;
    CUT6.fadeIn = 1.0;
    CUT6.brayanX = 115;
    CUT6.brayanState = 'walk';
    CUT6.walkTimer = 0;
    CUT6.walkFrame = 0;
    CUT6.morningProgress = 0;
    CUT6.roosterPlayed = false;

    setupBeat(0);
  },

  exit() {
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    const L = t();
    const beats = L.beats2_3To2_4;
    const beatObj = beats[CUT6.beat];
    if (beatObj) {
      DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
      DOM.dlgStep.textContent = `${CUT6.beat + 1} / ${beats.length}`;
      DOM.dlgText.textContent = CUT6.fullyTyped
        ? beatObj.text
        : beatObj.text.slice(0, Math.min(CUT6.typedChars, beatObj.text.length));
    }
  },

  onAction(action) {
    if (action === 'ADVANCE_DIALOGUE') advanceCutscene();
    else if (action === 'SKIP_CUTSCENE') goToWorld2_4();
  },

  onKeyDown(k, e) {
    if (k === 'escape' || k === 's') {
      goToWorld2_4();
    } else if (k === ' ' || k === 'enter' || k === 'arrowright') {
      e.preventDefault();
      advanceCutscene();
    }
  },

  update(dt) {
    CUT6.totalTime += dt;
    CUT6.beatTime += dt;
    if (CUT6.fadeIn > 0) CUT6.fadeIn = Math.max(0, CUT6.fadeIn - dt * 1.15);

    const beats = t().beats2_3To2_4;
    const fullText = beats[CUT6.beat].text;

    if (!CUT6.fullyTyped) {
      CUT6.charAccum += dt * 44;
      const nextCount = Math.floor(CUT6.charAccum);
      if (nextCount > CUT6.typedChars) {
        CUT6.typedChars = Math.min(nextCount, fullText.length);
        DOM.dlgText.textContent = fullText.slice(0, CUT6.typedChars);
        if (CUT6.typedChars % 3 === 0) SFX.type();
        if (CUT6.typedChars >= fullText.length) CUT6.fullyTyped = true;
      }
    } else {
      CUT6.autoAdvanceTimer += dt;
      const wait = CUT6.beat === 1 ? 3.5 : 4.2;
      if (CUT6.autoAdvanceTimer >= wait) {
        if (CUT6.beat < beats.length - 1) setupBeat(CUT6.beat + 1);
        else goToWorld2_4();
      }
    }

    // Beat 0: Tired Brayan walks up to Interior 92 door at night
    if (CUT6.beat === 0) {
      if (CUT6.brayanX < 462) {
        CUT6.brayanX = Math.min(462, CUT6.brayanX + 115 * dt);
        CUT6.walkTimer += dt;
        if (CUT6.walkTimer > 0.24) {
          CUT6.walkTimer = 0;
          CUT6.walkFrame = 1 - CUT6.walkFrame;
          SFX.step();
        }
      } else {
        CUT6.brayanState = 'idle';
      }
    }

    // Beat 1: Smooth transition into next morning card
    if (CUT6.beat === 1) {
      CUT6.morningProgress = Math.min(1, CUT6.morningProgress + dt * 0.72);
    }

    // Beat 3: Brayan in Pintuco + shorts + chanclas walks toward right edge to start errands!
    if (CUT6.beat === 3) {
      if (CUT6.brayanX < 610) {
        CUT6.brayanX = Math.min(610, CUT6.brayanX + 110 * dt);
        CUT6.walkTimer += dt;
        if (CUT6.walkTimer > 0.19) {
          CUT6.walkTimer = 0;
          CUT6.walkFrame = 1 - CUT6.walkFrame;
          SFX.step();
        }
      } else {
        CUT6.brayanState = 'idle';
      }
    }
  },

  render(ctx) {
    const L = t();
    ctx.save();

    // =========================================================================
    // BEAT 0: NIGHT ARRIVAL AT BOSA LA ESPERANZA — INTERIOR 92!
    // =========================================================================
    if (CUT6.beat === 0) {
      if (IMGS.bg_esperanza_1_night && IMGS.bg_esperanza_1_night.height > 0) {
        ctx.drawImage(IMGS.bg_esperanza_1_night, 0, 0, 960, 540);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 960, 540);
      }

      const floorY = 474;
      const bImg = (CUT6.brayanState === 'walk')
        ? (CUT6.walkFrame === 0 ? IMGS.brayan_walk1 : IMGS.brayan_walk2)
        : IMGS.brayan_idle;
      if (bImg && bImg.height > 0) {
        const bh = 166;
        const bw = Math.round(bImg.width * (bh / bImg.height));
        const bx = Math.round(CUT6.brayanX);
        const by = Math.round(floorY - bh + (CUT6.brayanState === 'walk' && CUT6.walkFrame === 0 ? -3 : 0));
        drawGroundShadow(ctx, bx + bw * 0.5, floorY + 2, 28, 7);
        drawFlippedSprite(ctx, bImg, bx, by, bw, bh, 1);
      }

      // Tired Zzz / sigh bubble once Brayan arrives at Interior 92
      if (CUT6.brayanState === 'idle') {
        const bob = Math.sin(CUT6.totalTime * 4) * 4;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(462, 256 + bob, 146, 26);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.strokeRect(462, 256 + bob, 146, 26);
        ctx.font = 'bold 8px "Press Start 2P", monospace';
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText('ZZZ... INT. 92', 535, 273 + bob);
      }
    }

    // =========================================================================
    // BEAT 1: "AL DÍA SIGUIENTE..." SUNRISE TRANSITION CARD
    // =========================================================================
    if (CUT6.beat === 1) {
      const p = CUT6.morningProgress;
      const sky = ctx.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, '#0f172a');
      sky.addColorStop(0.55, '#1d4ed8');
      sky.addColorStop(1, '#f59e0b');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 960, 540);

      if (IMGS.bg_esperanza_1 && IMGS.bg_esperanza_1.height > 0) {
        ctx.save();
        ctx.globalAlpha = p * 0.42;
        ctx.drawImage(IMGS.bg_esperanza_1, 0, 0, 960, 540);
        ctx.restore();
      }

      // Rising Andean morning sun
      ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.beginPath();
      ctx.arc(480, 320 - p * 140, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(480, 320 - p * 140, 52, 0, Math.PI * 2);
      ctx.fill();

      // Retro Morning Chapter Card
      ctx.fillStyle = 'rgba(10, 14, 34, 0.88)';
      ctx.fillRect(120, 162, 720, 186);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.strokeRect(120, 162, 720, 186);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(128, 170, 704, 170);

      ctx.textAlign = 'center';
      ctx.font = 'bold 20px "Press Start 2P", monospace';
      ctx.fillStyle = '#fde047';
      ctx.fillText(L.cut24NextDayTitle, 480, 232);

      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(L.cut24NextDaySub, 480, 278);

      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.fillStyle = '#4ade80';
      ctx.fillText(L.cut24OutfitHint, 480, 318);
    }

    // =========================================================================
    // BEATS 2 & 3: NEXT MORNING AT INTERIOR 92 — PINTUCO SHIRT, SHORTS & CHANCLAS!
    // =========================================================================
    if (CUT6.beat >= 2) {
      if (IMGS.bg_esperanza_1 && IMGS.bg_esperanza_1.height > 0) {
        ctx.drawImage(IMGS.bg_esperanza_1, 0, 0, 960, 540);
      } else {
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(0, 0, 960, 540);
      }

      const floorY = 474;
      const bImg = (CUT6.brayanState === 'walk')
        ? (CUT6.walkFrame === 0 ? IMGS.brayan_pintuco_walk1 : IMGS.brayan_pintuco_walk2)
        : IMGS.brayan_pintuco_idle;
      if (bImg && bImg.height > 0) {
        const bh = 166;
        const bw = Math.round(bImg.width * (bh / bImg.height));
        const bx = Math.round(CUT6.brayanX);
        const by = Math.round(floorY - bh + (CUT6.brayanState === 'walk' && CUT6.walkFrame === 0 ? -3 : 0));
        drawGroundShadow(ctx, bx + bw * 0.5, floorY + 2, 28, 7);
        drawFlippedSprite(ctx, bImg, bx, by, bw, bh, 1);
      }

      // Peeking barking street dog on right edge during Beat 3 foreshadowing World 2-4!
      if (CUT6.beat === 3 && IMGS.perro_barrio && IMGS.perro_barrio.height > 0) {
        const dx = 820 - Math.sin(CUT6.totalTime * 5) * 14;
        const dh = 66;
        const dw = Math.round(IMGS.perro_barrio.width * (dh / IMGS.perro_barrio.height));
        drawGroundShadow(ctx, dx + dw * 0.5, floorY + 2, 24, 6);
        ctx.drawImage(IMGS.perro_barrio, Math.round(dx), floorY - dh, dw, dh);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(dx - 8, floorY - dh - 28, 108, 22);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(dx - 8, floorY - dh - 28, 108, 22);
        ctx.font = 'bold 8px "Press Start 2P", monospace';
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText('¡GUAU! ¡GUAU!', dx + 46, floorY - dh - 13);
      }

      // Mission banner in Beat 3
      if (CUT6.beat === 3) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(150, 26, 660, 68);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.strokeRect(150, 26, 660, 68);
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px "Press Start 2P", monospace';
        ctx.fillStyle = '#fde047';
        ctx.fillText(L.cut24MissionTitle, 480, 54);
        ctx.font = 'bold 8.5px "Press Start 2P", monospace';
        ctx.fillStyle = '#4ade80';
        ctx.fillText(L.cut24MissionSub, 480, 78);
      }
    }

    // Location chyron tag
    if (CUT6.beat !== 1) {
      const bannerW = 350;
      const bannerX = 960 - bannerW;
      const bannerY = 468;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(bannerX, bannerY - 30, bannerW, 28);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(bannerX, bannerY - 30, bannerW, 3);
      ctx.font = 'bold 9.5px "Press Start 2P", monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'right';
      ctx.fillText(L.cut24PlaceLabel, 948, bannerY - 11);

      ctx.fillStyle = CUT6.beat === 0 ? '#1e3a8a' : '#15803d';
      ctx.beginPath();
      ctx.moveTo(bannerX - 18, bannerY + 34);
      ctx.lineTo(bannerX, bannerY);
      ctx.lineTo(960, bannerY);
      ctx.lineTo(960, bannerY + 34);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 9.5px "Press Start 2P", monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(CUT6.beat === 0 ? L.cut24NightTag : L.cut24MorningTag, 948, bannerY + 22);
    }

    if (CUT6.fadeIn > 0) {
      ctx.fillStyle = `rgba(10, 12, 28, ${CUT6.fadeIn})`;
      ctx.fillRect(0, 0, 960, 540);
    }
    ctx.restore();
  }
};
