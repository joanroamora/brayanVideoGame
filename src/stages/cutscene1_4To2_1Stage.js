import { t } from '../config/i18n.js';
import { SFX } from '../core/audio.js';
import { IMGS } from '../core/assets.js';
import { DOM, hideOverlay } from '../core/ui.js';
import { drawGroundShadow, drawFlippedSprite } from '../core/renderer.js';
import { stageManager } from '../core/stageManager.js';

const CUT3 = {
  carryScore: 0,
  beat: 0,
  beatTime: 0,
  totalTime: 0,
  typedChars: 0,
  charAccum: 0,
  fullyTyped: false,
  autoAdvanceTimer: 0,

  fadeIn: 1.0,
  majoX: 540,
  majoFacing: 1,     // 1 = facing right (advisors), -1 = facing left (sofa/Brayan)
  majoWalking: false,
  brayanStanding: false,
  brayanAlertT: 0,
  walkStepT: 0,
  whisperT: 0,
  corridorPeekAlpha: 0
};

function setupBeat(idx) {
  const L = t();
  const beats = L.beats1_4To2_1;
  CUT3.beat = idx;
  CUT3.beatTime = 0;
  CUT3.typedChars = 0;
  CUT3.charAccum = 0;
  CUT3.fullyTyped = false;
  CUT3.autoAdvanceTimer = 0;

  const beatObj = beats[idx];
  DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
  DOM.dlgStep.textContent = `${idx + 1} / ${beats.length}`;
  DOM.dlgText.textContent = '';

  if (idx === 0) {
    CUT3.majoX = 540;
    CUT3.majoFacing = 1;
    CUT3.majoWalking = false;
    CUT3.brayanStanding = false;
    CUT3.brayanAlertT = 0;
    CUT3.corridorPeekAlpha = 0;
    SFX.dream();
  } else if (idx === 1) {
    CUT3.majoX = 540;
    CUT3.majoFacing = 1;
    CUT3.majoWalking = false;
    SFX.whisper();
  } else if (idx === 2) {
    CUT3.majoX = 540;
    CUT3.majoFacing = 1;
    CUT3.majoWalking = false;
    SFX.whisper();
  } else if (idx === 3) {
    // Majo walks across the office right up to the sofa!
    CUT3.majoFacing = -1;
    CUT3.majoWalking = true;
    CUT3.brayanStanding = false;
    CUT3.brayanAlertT = 0;
    CUT3.walkStepT = 0;
    SFX.select();
  } else if (idx === 4) {
    // Brayan gets up off the sofa ready for the Photocopier mission in World 2-1!
    CUT3.majoX = 335;
    CUT3.majoFacing = -1;
    CUT3.majoWalking = false;
    CUT3.brayanStanding = true;
    CUT3.corridorPeekAlpha = 0;
    SFX.firm();
  }
}

function goToWorld2_1() {
  SFX.start();
  stageManager.goTo('WORLD_2_1', { params: { carryScore: CUT3.carryScore } });
}

function advanceCutscene() {
  const beats = t().beats1_4To2_1;
  const fullText = beats[CUT3.beat].text;
  if (!CUT3.fullyTyped) {
    CUT3.typedChars = fullText.length;
    CUT3.fullyTyped = true;
    DOM.dlgText.textContent = fullText;
    SFX.blip();
    return;
  }
  if (CUT3.beat < beats.length - 1) {
    SFX.select();
    setupBeat(CUT3.beat + 1);
  } else {
    goToWorld2_1();
  }
}

export const cutscene1_4To2_1Stage = {
  enter(params = {}) {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'flex';
    DOM.skipBtn.style.display = 'block';
    DOM.world1Controls.style.display = 'none';
    DOM.world2Controls.style.display = 'none';
    DOM.world4Controls.style.display = 'none';
    hideOverlay();

    CUT3.carryScore = params.carryScore || 0;
    CUT3.beat = 0;
    CUT3.beatTime = 0;
    CUT3.totalTime = 0;
    CUT3.fadeIn = 1.0;
    CUT3.majoX = 540;
    CUT3.majoFacing = 1;
    CUT3.majoWalking = false;
    CUT3.brayanStanding = false;
    CUT3.brayanAlertT = 0;
    CUT3.walkStepT = 0;
    CUT3.whisperT = 0;
    CUT3.corridorPeekAlpha = 0;

    setupBeat(0);
  },

  exit() {
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    const L = t();
    const beats = L.beats1_4To2_1;
    const beatObj = beats[CUT3.beat];
    if (beatObj) {
      DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
      DOM.dlgStep.textContent = `${CUT3.beat + 1} / ${beats.length}`;
      DOM.dlgText.textContent = CUT3.fullyTyped
        ? beatObj.text
        : beatObj.text.slice(0, Math.min(CUT3.typedChars, beatObj.text.length));
    }
  },

  onAction(action) {
    if (action === 'ADVANCE_DIALOGUE') advanceCutscene();
    else if (action === 'SKIP_CUTSCENE') goToWorld2_1();
  },

  onKeyDown(k, e) {
    if (k === 'escape' || k === 's') {
      goToWorld2_1();
    } else if (k === ' ' || k === 'enter' || k === 'arrowright') {
      e.preventDefault();
      advanceCutscene();
    }
  },

  update(dt) {
    CUT3.totalTime += dt;
    CUT3.beatTime += dt;
    if (CUT3.fadeIn > 0) CUT3.fadeIn = Math.max(0, CUT3.fadeIn - dt * 1.15);

    const beats = t().beats1_4To2_1;
    const fullText = beats[CUT3.beat].text;

    if (!CUT3.fullyTyped) {
      CUT3.charAccum += dt * 42;
      const nextCount = Math.floor(CUT3.charAccum);
      if (nextCount > CUT3.typedChars) {
        CUT3.typedChars = Math.min(nextCount, fullText.length);
        DOM.dlgText.textContent = fullText.slice(0, CUT3.typedChars);
        if (CUT3.typedChars % 3 === 0) SFX.type();
        if (CUT3.typedChars >= fullText.length) CUT3.fullyTyped = true;
      }
    } else {
      CUT3.autoAdvanceTimer += dt;
      const holdSecs = CUT3.beat === 1 || CUT3.beat === 2 ? 4.4 : 3.6;
      if (CUT3.autoAdvanceTimer >= holdSecs) {
        if (CUT3.beat < beats.length - 1) setupBeat(CUT3.beat + 1);
        else goToWorld2_1();
      }
    }

    // Beat 3: Majo walks smoothly from advisors right up to Brayan's sofa!
    if (CUT3.beat === 3) {
      if (CUT3.majoX > 312) {
        CUT3.majoX = Math.max(312, CUT3.majoX - 150 * dt);
        CUT3.majoWalking = true;
        CUT3.walkStepT += dt;
        if (CUT3.walkStepT > 0.24) {
          CUT3.walkStepT = 0;
          SFX.step();
        }
      } else {
        if (CUT3.majoWalking) {
          CUT3.majoWalking = false;
          CUT3.brayanAlertT = 1.6;
          SFX.blip();
        }
      }
    }

    if (CUT3.brayanAlertT > 0) CUT3.brayanAlertT = Math.max(0, CUT3.brayanAlertT - dt);

    // Beat 4: Show World 2-1 mission briefing card!
    if (CUT3.beat === 4) {
      CUT3.corridorPeekAlpha = Math.min(1, CUT3.corridorPeekAlpha + dt * 2.2);
    }
  },

  render(ctx) {
    const L = t();
    ctx.save();

    // 1. 16-bit Executive Bogotá Office Background (Leather Sofa on Left, Monserrate Sunset, Desk on Right)
    if (IMGS.cutscene_office_sofa && IMGS.cutscene_office_sofa.height > 0) {
      ctx.drawImage(IMGS.cutscene_office_sofa, 0, 0, 960, 540);
    } else {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, 960, 540);
    }

    const floorY = 474;
    const talkBob = Math.sin(CUT3.totalTime * 6) * 1.8;

    // 2. Advisors huddled by the office desk (right midground)
    if (IMGS.advisor_2 && IMGS.advisor_2.height > 0) {
      const h2 = 176;
      const w2 = IMGS.advisor_2.width * (h2 / IMGS.advisor_2.height);
      const ax2 = 672;
      const ay2 = floorY - h2 - 8 + (CUT3.beat === 1 ? Math.sin(CUT3.totalTime * 5 + 1) * 1.4 : 0);
      drawGroundShadow(ctx, ax2 + w2 * 0.5, floorY - 6, 30, 7);
      ctx.drawImage(IMGS.advisor_2, ax2, ay2, w2, h2);
    }
    if (IMGS.advisor_1 && IMGS.advisor_1.height > 0) {
      const h1 = 182;
      const w1 = IMGS.advisor_1.width * (h1 / IMGS.advisor_1.height);
      const ax1 = 616;
      const ay1 = floorY - h1 + (CUT3.beat === 1 ? talkBob * 0.6 : 0);
      drawGroundShadow(ctx, ax1 + w1 * 0.5, floorY + 2, 30, 7);
      ctx.drawImage(IMGS.advisor_1, ax1, ay1, w1, h1);
    }

    // 3. Majo Piza Romero (Talking to advisors in Beats 0-2 -> Walking up to sofa in Beat 3-4!)
    const majoTalking = (CUT3.beat === 1 || CUT3.beat === 3 || CUT3.beat === 4) && (Math.floor(CUT3.totalTime * 3.0) % 2 === 0);
    const mImg = (CUT3.beat === 3 && !CUT3.majoWalking)
      ? (majoTalking ? IMGS.majo_talk : IMGS.majo_smile)
      : (majoTalking ? IMGS.majo_talk : IMGS.majo_smile);
    if (mImg && mImg.height > 0) {
      const mh = 188;
      const mw = mImg.width * (mh / mImg.height);
      const stepBob = CUT3.majoWalking ? Math.abs(Math.sin(CUT3.totalTime * 11)) * -5 : (majoTalking ? -Math.abs(talkBob) : 0);
      const mx = Math.round(CUT3.majoX);
      const my = Math.round(floorY - mh + 4 + stepBob);
      drawGroundShadow(ctx, mx + mw * 0.5, floorY + 4, 34, 8);
      drawFlippedSprite(ctx, mImg, mx, my, mw, mh, CUT3.majoFacing);
    }

    // Subtle whispering speech indicator between Majo & advisors during Beat 1
    if (CUT3.beat === 1) {
      ctx.save();
      const pulse = 0.72 + Math.sin(CUT3.totalTime * 7) * 0.25;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(508, 224, 212, 34);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(508, 224, 212, 34);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(518, 236, 10, 10);
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'left';
      ctx.fillText(L.cut21WhisperTag, 536, 245);
      ctx.restore();
    }

    // 4. Brayan — Lying on the Leather Sofa (eyes closed!) in Beats 0-3, standing up in Beat 4!
    if (!CUT3.brayanStanding) {
      const bSleep = IMGS.brayan_sofa_sleep || IMGS.brayan_ko;
      if (bSleep && bSleep.height > 0) {
        const bw = 188;
        const bh = Math.round(bSleep.height * (bw / bSleep.width));
        ctx.save();
        // Position naturally along the dark leather sofa cushions on the left
        ctx.translate(154, 360);
        ctx.rotate(-0.07);
        ctx.drawImage(bSleep, -bw / 2, -bh / 2, bw, bh);
        ctx.restore();
      }

      // Beat 0: Soft "..." eavesdropping cue above sofa
      if (CUT3.beat === 0) {
        const dots = '.'.repeat(1 + (Math.floor(CUT3.totalTime * 2.5) % 3));
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(156, 268, 62, 26);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(156, 268, 62, 26);
        ctx.font = 'bold 11px "Press Start 2P", monospace';
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText(dots, 187, 286);
      }

      // Beat 2: Dramatic vignette + SNES Pixel Thought Cloud above Brayan (eyes still shut!)
      if (CUT3.beat === 2) {
        const vig = ctx.createRadialGradient(175, 345, 70, 320, 310, 520);
        vig.addColorStop(0, 'rgba(15, 23, 42, 0)');
        vig.addColorStop(1, 'rgba(8, 6, 22, 0.62)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, 960, 540);

        const floatY = Math.sin(CUT3.totalTime * 4) * 4;
        // Trailing small thought circles leading up from Brayan's head
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        [[205, 304, 6], [218, 284, 9]].forEach(([cx, cy, r]) => {
          ctx.beginPath();
          ctx.arc(cx, cy + floatY * 0.5, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
        // Main thought cloud box
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(108, 198 + floatY, 240, 68);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.strokeRect(108, 198 + floatY, 240, 68);
        ctx.font = 'bold 10px "Press Start 2P", monospace';
        ctx.fillStyle = '#dc2626';
        ctx.textAlign = 'center';
        ctx.fillText(L.cut21ThoughtLine1, 228, 226 + floatY);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 8px "Press Start 2P", monospace';
        ctx.fillText(L.cut21ThoughtLine2, 228, 248 + floatY);
      }

      // Beat 3: Alert "!" pops over Brayan when Majo leans in beside the sofa!
      if (CUT3.beat === 3 && !CUT3.majoWalking) {
        const popY = Math.sin(CUT3.totalTime * 12) * 3;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(212, 266 + popY, 28, 28);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.strokeRect(212, 266 + popY, 28, 28);
        ctx.font = 'bold 16px "Press Start 2P", monospace';
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText('!', 226, 287 + popY);
      }
    } else {
      // Beat 4: Brayan stands up beside the sofa gripping his folder, ready for World 2-1!
      const bStand = IMGS.brayan_firm || IMGS.brayan_idle;
      if (bStand && bStand.height > 0) {
        const bh = 186;
        const bw = Math.round(bStand.width * (bh / bStand.height));
        const bx = 210;
        const by = floorY - bh + 4;
        drawGroundShadow(ctx, bx + bw * 0.5, floorY + 4, 32, 8);
        drawFlippedSprite(ctx, bStand, bx, by, bw, bh, 1);
      }

      // Dramatic "MISIÓN: FOTOCOPIA • MUNDO 2-1" SNES Briefing Card on upper center!
      if (CUT3.corridorPeekAlpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = CUT3.corridorPeekAlpha;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.fillRect(210, 44, 540, 82);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.strokeRect(210, 44, 540, 82);
        ctx.font = 'bold 14px "Press Start 2P", monospace';
        ctx.fillStyle = '#fde047';
        ctx.textAlign = 'center';
        ctx.fillText(L.cut21MissionTitle, 480, 78);
        ctx.font = 'bold 9px "Press Start 2P", monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(L.cut21MissionSub, 480, 106);
        ctx.restore();
      }
    }

    // 5. Lower-third location chyron (matching existing cutscene style)
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

    if (Math.floor(CUT3.totalTime * 2.4) % 2 === 0) {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(bannerX + 12, bannerY + 11, 10, 10);
    }
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(L.cut21ChapterTag, 948, bannerY + 22);

    // Gentle fade-in from dream awakening
    if (CUT3.fadeIn > 0) {
      ctx.fillStyle = `rgba(12, 8, 28, ${CUT3.fadeIn})`;
      ctx.fillRect(0, 0, 960, 540);
    }

    ctx.restore();
  }
};
