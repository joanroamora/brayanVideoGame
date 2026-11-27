import { STATE } from '../core/gameState.js';
import { t } from '../config/i18n.js';
import { SFX } from '../core/audio.js';
import { IMGS } from '../core/assets.js';
import { DOM, showOverlay, hideOverlay, renderOverlayContent } from '../core/ui.js';
import { drawGroundShadow, drawFlippedSprite } from '../core/renderer.js';
import { stageManager } from '../core/stageManager.js';

const CUT7 = {
  carryScore: 0,
  dogsDodged: 0,
  panCount: 0,
  beat: 0,
  beatTime: 0,
  totalTime: 0,
  typedChars: 0,
  charAccum: 0,
  fullyTyped: false,
  autoAdvanceTimer: 0,
  fadeIn: 1.0,
  phonePop: 0,
  finished: false
};

function getVictoryOverlayConfig() {
  const L = t();
  const modeLabel = STATE.mode === 'light' ? L.modeBadgeLight : L.modeBadgeHeavy;
  return {
    title: L.w24VictoryTitle,
    sub: L.w24VictorySub,
    btnText: L.retryBtn,
    stats: [
      { label: L.statScore, value: String(CUT7.carryScore).padStart(6, '0'), color: '#facc15' },
      { label: L.w24StatDogs, value: `${CUT7.dogsDodged}`, color: '#fb923c' },
      { label: L.w24StatPan, value: `${CUT7.panCount}`, color: '#4ade80' },
      { label: L.statMode, value: modeLabel, color: '#38bdf8' }
    ]
  };
}

function finishCutscene() {
  if (CUT7.finished) return;
  CUT7.finished = true;
  DOM.dialogue.style.display = 'none';
  DOM.skipBtn.style.display = 'none';
  SFX.victory();
  showOverlay('VICTORY', getVictoryOverlayConfig());
}

function setupBeat(idx) {
  const L = t();
  const beats = L.beats2_4To2_5;
  CUT7.beat = idx;
  CUT7.beatTime = 0;
  CUT7.typedChars = 0;
  CUT7.charAccum = 0;
  CUT7.fullyTyped = false;
  CUT7.autoAdvanceTimer = 0;

  const beatObj = beats[idx];
  DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
  DOM.dlgStep.textContent = `${idx + 1} / ${beats.length}`;
  DOM.dlgText.textContent = '';

  if (idx === 1) {
    SFX.phoneMsg();
  } else if (idx === 2) {
    CUT7.phonePop = 0;
    SFX.phoneMsg();
  } else if (idx === 3) {
    SFX.dream();
  }
}

function advanceCutscene() {
  if (CUT7.finished) return;
  const beats = t().beats2_4To2_5;
  const fullText = beats[CUT7.beat].text;
  if (!CUT7.fullyTyped) {
    CUT7.typedChars = fullText.length;
    CUT7.fullyTyped = true;
    DOM.dlgText.textContent = fullText;
    SFX.blip();
    return;
  }
  if (CUT7.beat < beats.length - 1) {
    SFX.select();
    setupBeat(CUT7.beat + 1);
  } else {
    finishCutscene();
  }
}

export const cutscene2_4To2_5Stage = {
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

    CUT7.carryScore = params.carryScore || 0;
    CUT7.dogsDodged = params.dogsDodged || 0;
    CUT7.panCount = params.panCount || 0;
    CUT7.beat = 0;
    CUT7.beatTime = 0;
    CUT7.totalTime = 0;
    CUT7.fadeIn = 1.0;
    CUT7.phonePop = 0;
    CUT7.finished = false;

    setupBeat(0);
  },

  exit() {
    DOM.dialogue.style.display = 'none';
    DOM.skipBtn.style.display = 'none';
    hideOverlay();
  },

  onLocalize() {
    if (CUT7.finished) {
      renderOverlayContent(getVictoryOverlayConfig());
      return;
    }
    const L = t();
    const beats = L.beats2_4To2_5;
    const beatObj = beats[CUT7.beat];
    if (beatObj) {
      DOM.dlgSpeaker.textContent = L[beatObj.speakerKey];
      DOM.dlgStep.textContent = `${CUT7.beat + 1} / ${beats.length}`;
      DOM.dlgText.textContent = CUT7.fullyTyped
        ? beatObj.text
        : beatObj.text.slice(0, Math.min(CUT7.typedChars, beatObj.text.length));
    }
  },

  onAction(action) {
    if (action === 'ADVANCE_DIALOGUE') advanceCutscene();
    else if (action === 'SKIP_CUTSCENE') finishCutscene();
    else if (action === 'OVERLAY_PRIMARY' && CUT7.finished) {
      SFX.start();
      stageManager.goTo('WORLD_2_4', { params: { carryScore: 0 } });
    }
  },

  onKeyDown(k, e) {
    if (CUT7.finished) {
      if (k === 'enter' || k === ' ') {
        e.preventDefault();
        this.onAction('OVERLAY_PRIMARY');
      }
      return;
    }
    if (k === 'escape' || k === 's') {
      finishCutscene();
    } else if (k === ' ' || k === 'enter' || k === 'arrowright') {
      e.preventDefault();
      advanceCutscene();
    }
  },

  update(dt) {
    CUT7.totalTime += dt;
    CUT7.beatTime += dt;
    if (CUT7.fadeIn > 0) CUT7.fadeIn = Math.max(0, CUT7.fadeIn - dt * 1.25);
    if (CUT7.finished) return;

    if (CUT7.beat >= 2) {
      CUT7.phonePop = Math.min(1, CUT7.phonePop + dt * 2.6);
    }

    const beats = t().beats2_4To2_5;
    const fullText = beats[CUT7.beat].text;
    if (!CUT7.fullyTyped) {
      CUT7.charAccum += dt * 42;
      const nextCount = Math.floor(CUT7.charAccum);
      if (nextCount > CUT7.typedChars) {
        CUT7.typedChars = Math.min(nextCount, fullText.length);
        DOM.dlgText.textContent = fullText.slice(0, CUT7.typedChars);
        if (CUT7.typedChars % 3 === 0) SFX.type();
        if (CUT7.typedChars >= fullText.length) CUT7.fullyTyped = true;
      }
    } else {
      CUT7.autoAdvanceTimer += dt;
      const wait = CUT7.beat === 2 ? 5.2 : 4.2;
      if (CUT7.autoAdvanceTimer >= wait) {
        if (CUT7.beat < beats.length - 1) setupBeat(CUT7.beat + 1);
        else finishCutscene();
      }
    }
  },

  render(ctx) {
    const L = t();
    ctx.save();

    // Backdrop: Interior 92 in Bosa La Esperanza!
    if (IMGS.bg_esperanza_1 && IMGS.bg_esperanza_1.height > 0) {
      ctx.drawImage(IMGS.bg_esperanza_1, 0, 0, 960, 540);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 960, 540);
    }

    // Brayan standing at Interior 92 in Pintuco shirt, shorts & chanclas (holding grocery bag in beat 0, phone in beats 1..3!)
    const floorY = 474;
    const bImg = CUT7.beat === 0 ? IMGS.brayan_pintuco_bag1 : IMGS.brayan_pintuco_phone;
    if (bImg && bImg.height > 0) {
      const bh = 174;
      const bw = Math.round(bImg.width * (bh / bImg.height));
      const bx = CUT7.beat >= 2 ? 150 : 420;
      const by = floorY - bh;
      drawGroundShadow(ctx, bx + bw * 0.5, floorY + 2, 30, 7);
      drawFlippedSprite(ctx, bImg, bx, by, bw, bh, 1);
    }

    // Beat 1: Notification ping badge above Brayan's phone!
    if (CUT7.beat === 1) {
      const pulse = Math.sin(CUT7.totalTime * 10) * 4;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.fillRect(350, 206 + pulse, 280, 44);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.strokeRect(350, 206 + pulse, 280, 44);
      ctx.font = 'bold 9.5px "Press Start 2P", monospace';
      ctx.fillStyle = '#4ade80';
      ctx.textAlign = 'center';
      ctx.fillText(L.cut25PingTop, 490, 226 + pulse);
      ctx.font = 'bold 8px "Press Start 2P", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(L.cut25PingFrom, 490, 243 + pulse);
    }

    // =========================================================================
    // BEATS 2 & 3: BIG 16-BIT SMARTPHONE CLOSE-UP SHOWING MAJO PIZA'S TEXT MESSAGE!
    // =========================================================================
    if (CUT7.beat >= 2) {
      ctx.fillStyle = `rgba(10, 12, 28, ${0.62 * CUT7.phonePop})`;
      ctx.fillRect(0, 0, 960, 540);

      // Re-draw Brayan cleanly on the left looking at the big phone screen
      if (IMGS.brayan_pintuco_phone && IMGS.brayan_pintuco_phone.height > 0) {
        const bh = 220;
        const bw = Math.round(IMGS.brayan_pintuco_phone.width * (bh / IMGS.brayan_pintuco_phone.height));
        drawFlippedSprite(ctx, IMGS.brayan_pintuco_phone, 96, 265, bw, bh, 1);
      }

      const sc = 0.65 + CUT7.phonePop * 0.35;
      ctx.save();
      ctx.translate(580, 268);
      ctx.scale(sc, sc);

      // Sleek 16-bit Smartphone Frame (460x392)
      ctx.fillStyle = '#020617';
      ctx.fillRect(-234, -198, 468, 396);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.strokeRect(-234, -198, 468, 396);

      // Phone Wallpaper Screen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-220, -182, 440, 360);

      // Status Bar (4G BOSA • 12:42 PM • 86%)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-220, -182, 440, 24);
      ctx.font = 'bold 8px "Press Start 2P", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText('4G • BOSA', -208, -166);
      ctx.textAlign = 'right';
      ctx.fillText('12:42 PM  [86%]', 208, -166);

      // Chat Header Bar (WhatsApp / SMS style): MAJO PIZA ROMERO
      ctx.fillStyle = '#065f46';
      ctx.fillRect(-220, -158, 440, 50);
      // Mini portrait icon of Majo
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-208, -150, 34, 34);
      if (IMGS.majo_smile && IMGS.majo_smile.height > 0) {
        ctx.drawImage(IMGS.majo_smile, 0, 0, IMGS.majo_smile.width, IMGS.majo_smile.height * 0.45, -206, -148, 30, 30);
      }
      ctx.textAlign = 'left';
      ctx.font = 'bold 10.5px "Press Start 2P", monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText('MAJO PIZA ROMERO', -164, -135);
      ctx.font = 'bold 8px "Press Start 2P", monospace';
      ctx.fillStyle = '#86efac';
      ctx.fillText(L.cut25OnlineStatus, -164, -118);

      // Incoming Message Bubble #1 (from Majo Piza Romero!)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-204, -92, 392, 92);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(-204, -92, 392, 92);
      ctx.font = 'bold 9.5px "Press Start 2P", monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(L.cut25SmsLine1, -190, -66);
      ctx.fillText(L.cut25SmsLine2, -190, -44);
      ctx.fillStyle = '#fde047';
      ctx.fillText(L.cut25SmsLine3, -190, -20);

      // Incoming Message Bubble #2 — THE KEY INSTRUCTION FOR WORLD 2-5!
      ctx.fillStyle = '#14532d';
      ctx.fillRect(-204, 14, 392, 86);
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.strokeRect(-204, 14, 392, 86);
      ctx.font = 'bold 9.5px "Press Start 2P", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(L.cut25SmsLine4, -190, 42);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(L.cut25SmsLine5, -190, 66);
      ctx.font = 'bold 8px "Press Start 2P", monospace';
      ctx.fillStyle = '#86efac';
      ctx.textAlign = 'right';
      ctx.fillText('12:42 PM ✓✓', 176, 90);

      // Next World 2-5 Teaser Pill at bottom of phone screen
      if (CUT7.beat === 3) {
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-204, 118, 408, 44);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.strokeRect(-204, 118, 408, 44);
        ctx.textAlign = 'center';
        ctx.font = 'bold 9.5px "Press Start 2P", monospace';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(L.cut25NextWorldTag, 0, 145);
      }

      ctx.restore();
    }

    // Location chyron
    if (CUT7.beat < 2) {
      const bannerW = 350;
      const bannerX = 960 - bannerW;
      const bannerY = 468;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(bannerX, bannerY - 30, bannerW, 28);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(bannerX, bannerY - 30, bannerW, 3);
      ctx.font = 'bold 9.5px "Press Start 2P", monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'right';
      ctx.fillText(L.cut24PlaceLabel, 948, bannerY - 11);

      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.moveTo(bannerX - 18, bannerY + 34);
      ctx.lineTo(bannerX, bannerY);
      ctx.lineTo(960, bannerY);
      ctx.lineTo(960, bannerY + 34);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 9.5px "Press Start 2P", monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(L.cut25ChapterTag, 948, bannerY + 22);
    }

    if (CUT7.fadeIn > 0) {
      ctx.fillStyle = `rgba(10, 12, 28, ${CUT7.fadeIn})`;
      ctx.fillRect(0, 0, 960, 540);
    }
    ctx.restore();
  }
};
