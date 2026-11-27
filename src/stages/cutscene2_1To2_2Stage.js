import { t } from '../config/i18n.js';
import { SFX } from '../core/audio.js';
import { IMGS } from '../core/assets.js';
import { DOM, hideOverlay } from '../core/ui.js';
import { drawGroundShadow, drawFlippedSprite } from '../core/renderer.js';
import { stageManager } from '../core/stageManager.js';

const CUT4 = {
  carryScore: 0,
  beat: 0,
  beatTime: 0,
  totalTime: 0,
  typedChars: 0,
  charAccum: 0,
  fullyTyped: false,
  autoAdvanceTimer: 0,

  fadeIn: 1.0,
  brayanX: 90,
  brayanState: 'walk', // 'walk' | 'idle' | 'firm'
  walkTimer: 0,
  walkFrame: 0,

  // Quiz state during Beat 2
  quizActive: false,
  quizSolved: false,
  selectedIdx: 0,
  wrongPicked: [false, false, false, false],
  wrongFeedbackT: 0,
  shakeTime: 0,
  flashAlpha: 0,
  clerkAngryT: 0
};

function renderQuizOptions() {
  const L = t();
  DOM.quizTitle.textContent = L.cut22QuizHeader;
  DOM.quizQuestion.textContent = L.cut22QuizQuestion;
  const opts = L.cut22QuizOptions;
  const btns = DOM.quizBtns;
  btns.forEach((btn, idx) => {
    const opt = opts[idx];
    if (!opt) return;
    btn.textContent = `${['A', 'B', 'C', 'D'][idx]}) ${opt.label}`;
    btn.classList.toggle('selected', idx === CUT4.selectedIdx);
    btn.classList.toggle('wrong', CUT4.wrongPicked[idx]);
    btn.classList.toggle('correct', CUT4.quizSolved && opt.correct);
  });
}

function showQuiz() {
  CUT4.quizActive = true;
  CUT4.quizSolved = false;
  CUT4.selectedIdx = 0;
  CUT4.wrongPicked = [false, false, false, false];
  CUT4.wrongFeedbackT = 0;
  DOM.quizOverlay.style.display = 'flex';
  renderQuizOptions();
}

function hideQuiz() {
  CUT4.quizActive = false;
  DOM.quizOverlay.style.display = 'none';
}

function submitQuizAnswer(idx) {
  if (!CUT4.quizActive || CUT4.quizSolved) return;
  const L = t();
  const opt = L.cut22QuizOptions[idx];
  if (!opt) return;
  CUT4.selectedIdx = idx;

  if (opt.correct) {
    CUT4.quizSolved = true;
    CUT4.flashAlpha = 0.55;
    SFX.victory();
    renderQuizOptions();
    setTimeout(() => {
      if (stageManager.activeName === 'CUTSCENE_2_1_TO_2_2') {
        hideQuiz();
        setupBeat(3);
      }
    }, 650);
  } else {
    CUT4.wrongPicked[idx] = true;
    CUT4.shakeTime = 0.35;
    CUT4.clerkAngryT = 1.6;
    CUT4.wrongFeedbackT = 2.6;
    SFX.swearBuzz();
    DOM.dlgSpeaker.textContent = L.speakerChairo;
    DOM.dlgText.textContent = L.cut22QuizWrong;
    CUT4.fullyTyped = true;
    renderQuizOptions();
  }
}

function setupBeat(idx) {
  const L = t();
  const beats = L.beats2_1To2_2;
  CUT4.beat = idx;
  CUT4.beatTime = 0;
  CUT4.typedChars = 0;
  CUT4.charAccum = 0;
  CUT4.fullyTyped = false;
  CUT4.autoAdvanceTimer = 0;

  const beatObj = beats[idx];
  DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
  DOM.dlgStep.textContent = `${idx + 1} / ${beats.length}`;
  DOM.dlgText.textContent = '';

  if (idx === 0) {
    hideQuiz();
    CUT4.brayanX = 85;
    CUT4.brayanState = 'walk';
  } else if (idx === 1) {
    hideQuiz();
    CUT4.brayanX = 250;
    CUT4.brayanState = 'idle';
    CUT4.clerkAngryT = 1.1;
    SFX.whisper();
  } else if (idx === 2) {
    CUT4.brayanX = 250;
    CUT4.brayanState = 'idle';
    SFX.select();
    showQuiz();
  } else if (idx === 3) {
    hideQuiz();
    CUT4.brayanX = 255;
    CUT4.brayanState = 'idle';
    SFX.blip();
  } else if (idx === 4) {
    hideQuiz();
    CUT4.brayanX = 260;
    CUT4.brayanState = 'firm';
    SFX.stampedeWarn();
  }
}

function goToWorld2_2() {
  hideQuiz();
  SFX.start();
  stageManager.goTo('WORLD_2_2', { params: { carryScore: CUT4.carryScore } });
}

function advanceCutscene() {
  // During Beat 2, player MUST answer the Chairo Clerk's ideological quiz!
  if (CUT4.beat === 2 && CUT4.quizActive) {
    const beats = t().beats2_1To2_2;
    const fullText = beats[2].text;
    if (!CUT4.fullyTyped) {
      CUT4.typedChars = fullText.length;
      CUT4.fullyTyped = true;
      DOM.dlgText.textContent = fullText;
      SFX.blip();
    }
    return;
  }

  const beats = t().beats2_1To2_2;
  const fullText = beats[CUT4.beat].text;
  if (!CUT4.fullyTyped) {
    CUT4.typedChars = fullText.length;
    CUT4.fullyTyped = true;
    DOM.dlgText.textContent = fullText;
    SFX.blip();
    return;
  }
  if (CUT4.beat < beats.length - 1) {
    SFX.select();
    setupBeat(CUT4.beat + 1);
  } else {
    goToWorld2_2();
  }
}

export const cutscene2_1To2_2Stage = {
  enter(params = {}) {
    DOM.title.style.display = 'none';
    DOM.canvasWrap.style.display = 'flex';
    DOM.dialogue.style.display = 'flex';
    DOM.skipBtn.style.display = 'block';
    DOM.world1Controls.style.display = 'none';
    DOM.world2Controls.style.display = 'none';
    DOM.world4Controls.style.display = 'none';
    hideOverlay();
    hideQuiz();

    CUT4.carryScore = params.carryScore || 0;
    CUT4.beat = 0;
    CUT4.beatTime = 0;
    CUT4.totalTime = 0;
    CUT4.fadeIn = 1.0;
    CUT4.brayanX = 85;
    CUT4.brayanState = 'walk';
    CUT4.walkTimer = 0;
    CUT4.walkFrame = 0;
    CUT4.quizActive = false;
    CUT4.quizSolved = false;
    CUT4.selectedIdx = 0;
    CUT4.wrongPicked = [false, false, false, false];
    CUT4.wrongFeedbackT = 0;
    CUT4.shakeTime = 0;
    CUT4.flashAlpha = 0;
    CUT4.clerkAngryT = 0;

    setupBeat(0);
  },

  exit() {
    hideQuiz();
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    const L = t();
    const beats = L.beats2_1To2_2;
    const beatObj = beats[CUT4.beat];
    if (beatObj) {
      DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
      DOM.dlgStep.textContent = `${CUT4.beat + 1} / ${beats.length}`;
      if (CUT4.beat === 2 && CUT4.wrongFeedbackT > 0) {
        DOM.dlgText.textContent = L.cut22QuizWrong;
      } else {
        DOM.dlgText.textContent = CUT4.fullyTyped
          ? beatObj.text
          : beatObj.text.slice(0, Math.min(CUT4.typedChars, beatObj.text.length));
      }
    }
    if (CUT4.quizActive) renderQuizOptions();
  },

  onAction(action) {
    if (action === 'ADVANCE_DIALOGUE') {
      advanceCutscene();
    } else if (action === 'SKIP_CUTSCENE') {
      goToWorld2_2();
    } else if (action && action.startsWith('QUIZ_OPT_')) {
      const idx = parseInt(action.replace('QUIZ_OPT_', ''), 10);
      if (!Number.isNaN(idx)) submitQuizAnswer(idx);
    }
  },

  onKeyDown(k, e) {
    if (k === 'escape' || k === 's') {
      goToWorld2_2();
      return;
    }
    if (CUT4.beat === 2 && CUT4.quizActive) {
      if (k === '1' || k === 'a') { e.preventDefault(); submitQuizAnswer(0); return; }
      if (k === '2' || k === 'b') { e.preventDefault(); submitQuizAnswer(1); return; }
      if (k === '3' || k === 'c') { e.preventDefault(); submitQuizAnswer(2); return; }
      if (k === '4' || k === 'd') { e.preventDefault(); submitQuizAnswer(3); return; }
      if (k === 'arrowup' || k === 'arrowleft') {
        e.preventDefault();
        CUT4.selectedIdx = (CUT4.selectedIdx + 3) % 4;
        SFX.blip();
        renderQuizOptions();
        return;
      }
      if (k === 'arrowdown' || k === 'arrowright') {
        e.preventDefault();
        CUT4.selectedIdx = (CUT4.selectedIdx + 1) % 4;
        SFX.blip();
        renderQuizOptions();
        return;
      }
      if (k === 'enter' || k === ' ') {
        e.preventDefault();
        submitQuizAnswer(CUT4.selectedIdx);
        return;
      }
      return;
    }

    if (k === ' ' || k === 'enter' || k === 'arrowright') {
      e.preventDefault();
      advanceCutscene();
    }
  },

  update(dt) {
    CUT4.totalTime += dt;
    CUT4.beatTime += dt;
    if (CUT4.fadeIn > 0) CUT4.fadeIn = Math.max(0, CUT4.fadeIn - dt * 1.15);
    if (CUT4.shakeTime > 0) CUT4.shakeTime = Math.max(0, CUT4.shakeTime - dt);
    if (CUT4.flashAlpha > 0) CUT4.flashAlpha = Math.max(0, CUT4.flashAlpha - dt * 1.9);
    if (CUT4.clerkAngryT > 0) CUT4.clerkAngryT = Math.max(0, CUT4.clerkAngryT - dt);
    if (CUT4.wrongFeedbackT > 0) CUT4.wrongFeedbackT = Math.max(0, CUT4.wrongFeedbackT - dt);

    const beats = t().beats2_1To2_2;
    const fullText = beats[CUT4.beat].text;

    if (!CUT4.fullyTyped) {
      CUT4.charAccum += dt * 44;
      const nextCount = Math.floor(CUT4.charAccum);
      if (nextCount > CUT4.typedChars) {
        CUT4.typedChars = Math.min(nextCount, fullText.length);
        DOM.dlgText.textContent = fullText.slice(0, CUT4.typedChars);
        if (CUT4.typedChars % 3 === 0) SFX.type();
        if (CUT4.typedChars >= fullText.length) CUT4.fullyTyped = true;
      }
    } else if (CUT4.beat !== 2) {
      // Never auto-advance past Beat 2 — wait for player's quiz answer!
      CUT4.autoAdvanceTimer += dt;
      if (CUT4.autoAdvanceTimer >= (CUT4.beat === 4 ? 3.8 : 4.2)) {
        if (CUT4.beat < beats.length - 1) setupBeat(CUT4.beat + 1);
        else goToWorld2_2();
      }
    }

    // Beat 0: Brayan walks up to the copy room counter
    if (CUT4.beat === 0) {
      if (CUT4.brayanX < 250) {
        CUT4.brayanX += 110 * dt;
        CUT4.brayanState = 'walk';
        CUT4.walkTimer += dt;
        if (CUT4.walkTimer > 0.2) {
          CUT4.walkTimer = 0;
          CUT4.walkFrame = 1 - CUT4.walkFrame;
          SFX.step();
        }
      } else {
        CUT4.brayanState = 'idle';
      }
    }
  },

  render(ctx) {
    const L = t();
    ctx.save();
    if (CUT4.shakeTime > 0) {
      const m = CUT4.shakeTime * 16;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }

    // 1. 16-bit Photocopy Room Background
    if (IMGS.cutscene_copy_room && IMGS.cutscene_copy_room.height > 0) {
      ctx.drawImage(IMGS.cutscene_copy_room, 0, 0, 960, 540);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 960, 540);
    }

    const floorY = 474;

    // 2. Chairo / Perroflauta Copy Room Clerk guarding the Photocopier (right-center)
    const clerk = IMGS.chairo_clerk;
    if (clerk && clerk.height > 0) {
      const ch = 192;
      const cw = clerk.width * (ch / clerk.height);
      const jitter = CUT4.clerkAngryT > 0 ? Math.sin(CUT4.totalTime * 48) * 3 : 0;
      const bob = Math.sin(CUT4.totalTime * 4.5) * 1.8;
      const cx = 560 + jitter;
      const cy = floorY - ch + 4 + bob;
      drawGroundShadow(ctx, cx + cw * 0.5, floorY + 4, 38, 9);
      ctx.drawImage(clerk, cx, cy, cw, ch);

      // Revolutionary badge / "SIN PAPEL" callout above him on Beats 1 & 3
      if (CUT4.beat === 1 || CUT4.clerkAngryT > 0) {
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(cx - 10, cy - 34, 152, 24);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 10, cy - 34, 152, 24);
        ctx.font = 'bold 8px "Press Start 2P", monospace';
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText(CUT4.clerkAngryT > 0 && CUT4.beat === 2 ? '★ ¡FACHO! ★' : L.cut22ClerkTag, cx + 66, cy - 18);
      } else if (CUT4.beat === 3) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 4, cy - 34, 144, 24);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 4, cy - 34, 144, 24);
        ctx.font = 'bold 8px "Press Start 2P", monospace';
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText(L.cut22NoPaperTag, cx + 68, cy - 18);
      }
    }

    // 3. Brayan standing on the left facing the Chairo Clerk
    let bImg = IMGS.brayan_idle;
    let yBob = 0;
    if (CUT4.brayanState === 'walk') {
      bImg = CUT4.walkFrame === 0 ? IMGS.brayan_walk1 : IMGS.brayan_walk2;
      yBob = CUT4.walkFrame === 0 ? -3 : 0;
    } else if (CUT4.brayanState === 'firm') {
      bImg = IMGS.brayan_firm || IMGS.brayan_idle;
    }
    if (bImg && bImg.height > 0) {
      const bh = 188;
      const bw = Math.round(bImg.width * (bh / bImg.height));
      const bx = Math.round(CUT4.brayanX);
      const by = Math.round(floorY - bh + 4 + yBob);
      drawGroundShadow(ctx, bx + bw * 0.5, floorY + 4, 34, 8);
      drawFlippedSprite(ctx, bImg, bx, by, bw, bh, 1);
    }

    // Beat 4: Distant Union Stampede Alert Banner across top of screen!
    if (CUT4.beat === 4) {
      const blink = Math.floor(CUT4.totalTime * 6) % 2 === 0;
      ctx.fillStyle = blink ? 'rgba(185, 28, 28, 0.92)' : 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(150, 44, 660, 62);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.strokeRect(150, 44, 660, 62);
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText(L.cut22MissionTitle, 480, 72);
      ctx.font = 'bold 8px "Press Start 2P", monospace';
      ctx.fillStyle = '#4ade80';
      ctx.fillText(L.cut22MissionSub, 480, 94);
    }

    // 4. Lower-third location chyron
    const bannerW = 350;
    const bannerX = 960 - bannerW;
    const bannerY = 468;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(bannerX, bannerY - 30, bannerW, 28);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(bannerX, bannerY - 30, bannerW, 3);
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'right';
    ctx.fillText(L.cut22RoomLabel, 948, bannerY - 11);

    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(bannerX - 18, bannerY + 34);
    ctx.lineTo(bannerX, bannerY);
    ctx.lineTo(960, bannerY);
    ctx.lineTo(960, bannerY + 34);
    ctx.closePath();
    ctx.fill();

    if (Math.floor(CUT4.totalTime * 2.4) % 2 === 0) {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(bannerX + 12, bannerY + 11, 10, 10);
    }
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(L.cut22ChapterTag, 948, bannerY + 22);

    if (CUT4.flashAlpha > 0) {
      ctx.fillStyle = `rgba(250, 204, 21, ${CUT4.flashAlpha})`;
      ctx.fillRect(0, 0, 960, 540);
    }
    if (CUT4.fadeIn > 0) {
      ctx.fillStyle = `rgba(12, 8, 28, ${CUT4.fadeIn})`;
      ctx.fillRect(0, 0, 960, 540);
    }

    ctx.restore();
  }
};
