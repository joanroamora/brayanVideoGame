import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { IMGS } from '../../core/assets.js';
import { drawGroundShadow, drawFlippedSprite } from '../../core/renderer.js';
import { WORLD_1_2_CONFIG } from './levelData.js';

/**
 * Draws a crisp 16-bit pixel-art snatching hand & jacket sleeve lunging toward Brayan's phone.
 */
function drawSnatchHand(ctx, side, reachFrac, state) {
  ctx.save();
  const y = 322;
  const fromLeft = (side === 'left');
  const startX = fromLeft ? 130 : 830;
  const targetX = fromLeft ? 430 : 530;
  const curX = startX + (targetX - startX) * reachFrac;

  ctx.translate(curX, y);
  if (!fromLeft) ctx.scale(-1, 1);

  // Dark hoodie sleeve reaching in
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-190, -18, 165, 36);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-186, -14, 158, 28);
  ctx.fillStyle = '#15803d'; // cuff accent
  ctx.fillRect(-34, -15, 12, 30);

  // Reaching grabbing hand & fingers (pixel-art style with bold black outline)
  ctx.fillStyle = '#000';
  ctx.fillRect(-24, -16, 46, 32);
  ctx.fillRect(16, -20, 22, 10);
  ctx.fillRect(20, -8, 24, 9);
  ctx.fillRect(18, 4, 22, 9);
  ctx.fillRect(8, 12, 18, 10);

  ctx.fillStyle = state === 'hit' ? '#fca5a5' : '#e09f70';
  ctx.fillRect(-20, -12, 38, 24);
  ctx.fillRect(18, -17, 17, 6);
  ctx.fillRect(22, -6, 19, 5);
  ctx.fillRect(20, 6, 17, 5);
  ctx.fillRect(10, 14, 13, 6);

  ctx.restore();
}

/**
 * Draws a pulsing 16-bit action prompt badge with shrinking danger bar.
 */
function drawPromptBadge(ctx, cx, cy, text, accentColor, fracRemaining) {
  ctx.save();
  ctx.font = 'bold 10px "Press Start 2P", monospace';
  const tw = Math.max(176, ctx.measureText(text).width + 26);
  const bx = Math.max(14, Math.min(960 - tw - 14, cx - tw / 2));
  const by = cy;

  ctx.fillStyle = 'rgba(10, 8, 24, 0.94)';
  ctx.fillRect(bx, by, tw, 36);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, tw, 36);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(text, bx + tw / 2, by + 17);

  // Shrinking timer gauge inside badge
  const barW = tw - 16;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(bx + 8, by + 23, barW, 7);
  ctx.fillStyle = fracRemaining < 0.3 ? '#ef4444' : accentColor;
  ctx.fillRect(bx + 8, by + 23, Math.max(0, Math.floor(barW * fracRemaining)), 7);
  ctx.restore();
}

export function renderWorld1_2(ctx, W2) {
  const L = t();
  const floorY = WORLD_1_2_CONFIG.floorY;

  ctx.save();
  // Subtle bus engine vibration + impact screen shake
  const engineVib = W2.busSpeed > 20 ? Math.sin(W2.elapsed * 32) * 1.15 : 0;
  let sx = 0;
  let sy = engineVib;
  if (W2.shakeTime > 0) {
    const m = W2.shakeTime * 16;
    sx += (Math.random() - 0.5) * m;
    sy += (Math.random() - 0.5) * m;
  }
  ctx.translate(sx, sy);

  // =========================================================================
  // LAYER 1: BOGOTÁ CITYSCAPE RUSHING BY OUTSIDE THE TRANSMILENIO WINDOWS!
  // =========================================================================
  ctx.fillStyle = '#3482ad';
  ctx.fillRect(0, 48, 960, 492);

  const cityBg = IMGS.bg_septima;
  if (cityBg && cityBg.height > 0) {
    const bgY = 82;
    const bgH = 290;
    const bgW = Math.round(cityBg.width * (bgH / cityBg.height));
    const scrollX = -((W2.busScrollX) % bgW);
    for (let ox = scrollX - bgW; ox < 960 + bgW; ox += bgW) {
      ctx.drawImage(cityBg, Math.round(ox), bgY, bgW, bgH);
    }
  }

  // Passing red TransMilenio station trusses & speed streaks outside windows
  const pillarOffset = -((W2.busScrollX * 2.1) % 680);
  ctx.fillStyle = 'rgba(185, 28, 28, 0.55)';
  for (let px = pillarOffset; px < 960; px += 680) {
    ctx.fillRect(px, 120, 22, 220);
  }
  if (W2.busSpeed > 60) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 0; i < 6; i++) {
      const lx = ((i * 197 - W2.busScrollX * 3.4) % 960 + 960) % 960;
      const ly = 155 + (i * 27) % 130;
      ctx.fillRect(lx, ly, 42, 2);
    }
  }

  // Sliding upper TransMilenio window glass tint (opens visibly when ventilating!)
  const winOpenPx = Math.round(W2.windowOpenAmt * 96);
  const windows = [115, 370, 625];
  for (const wx of windows) {
    // Closed/sliding glass pane on upper vent section
    ctx.fillStyle = 'rgba(186, 230, 253, 0.22)';
    ctx.fillRect(wx + winOpenPx, 152, Math.max(0, 108 - winOpenPx), 54);
    if (W2.windowOpenAmt > 0.05) {
      // Crisp bright frame edge showing the vent pane slid open
      ctx.fillStyle = '#334155';
      ctx.fillRect(wx + 108 + Math.min(96, winOpenPx) - 4, 152, 5, 54);
    }
  }

  // =========================================================================
  // LAYER 2: 16-BIT TRANSMILENIO CABIN INTERIOR (TRANSPARENT WINDOWS)
  // =========================================================================
  if (IMGS.transmi_interior && IMGS.transmi_interior.height > 0) {
    ctx.drawImage(IMGS.transmi_interior, 0, 48, 960, 492);
  }

  // In-cabin LED Route Display (fits inside the bus's top dark LED box)
  const stopName = L.w2Stops[Math.min(W2.stopIndex, L.w2Stops.length - 1)];
  ctx.save();
  ctx.fillStyle = '#180606';
  ctx.fillRect(360, 61, 240, 22);
  ctx.font = 'bold 9px "Press Start 2P", monospace';
  ctx.fillStyle = Math.floor(W2.elapsed * 3) % 2 === 0 ? '#ef4444' : '#f97316';
  ctx.textAlign = 'center';
  ctx.fillText(`★ ${stopName} ★`, 480, 76);
  ctx.restore();

  // Fresh Andean wind streaks rushing in when window is open!
  if (W2.windTimer > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const wy = 162 + (i * 19) % 120;
      const wx = ((W2.elapsed * 780 + i * 137) % 920) + 20;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx - 58, wy + 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // LAYER 3: GAS PASSENGER & COSQUILLERO NPC/ENEMY SPRITES
  // =========================================================================

  // Embarrassed Gas Passenger peeking in from the side
  if (W2.gas && IMGS.passenger_gas && IMGS.passenger_gas.height > 0) {
    const ph = 186;
    const pw = IMGS.passenger_gas.width * (ph / IMGS.passenger_gas.height);
    const fromLeft = (W2.gas.side === 'left');
    let slide = 1;
    if (W2.gas.state === 'clearing') slide = Math.max(0, W2.gas.outT / 0.75);
    else if (W2.gas.state === 'hit') slide = Math.max(0, W2.gas.outT / 0.8);
    const px = fromLeft ? (95 + slide * 85 - pw / 2) : (865 - slide * 85 - pw / 2);
    const py = floorY - ph - 8 + Math.sin(W2.elapsed * 18) * 1.5;

    drawGroundShadow(ctx, px + pw / 2, floorY - 6, 36, 9);
    drawFlippedSprite(ctx, IMGS.passenger_gas, px, py, pw, ph, fromLeft ? 1 : -1);
  }

  // Sneaky Cosquillero creeping toward Brayan's pocket
  if (W2.cosquillero && IMGS.cosquillero && IMGS.cosquillero.height > 0) {
    const ch = 184;
    const cw = IMGS.cosquillero.width * (ch / IMGS.cosquillero.height);
    const fromRight = (W2.cosquillero.side === 'right');

    let progress = 0;
    if (W2.cosquillero.state === 'creep') {
      progress = 1 - Math.max(0, W2.cosquillero.timer / W2.cosquillero.maxTime);
    } else if (W2.cosquillero.state === 'scared') {
      progress = (W2.cosquillero.outT / 0.72) * 0.6;
    } else {
      progress = 1.0;
    }

    const startX = fromRight ? 835 : 125;
    const closeX = fromRight ? 595 : 365;
    const cx = startX + (closeX - startX) * progress;
    const bob = W2.cosquillero.state === 'scared'
      ? Math.sin(W2.elapsed * 40) * 6
      : Math.abs(Math.sin(W2.elapsed * 9)) * -4;
    const cy = floorY - ch + 2 + bob;

    drawGroundShadow(ctx, cx, floorY + 2, 44, 10);
    // cosquillero.png naturally faces LEFT; flip when coming from left side so he faces Brayan
    const facing = fromRight ? 1 : -1;
    drawFlippedSprite(ctx, IMGS.cosquillero, cx - cw / 2, cy, cw, ch, facing);

    if (W2.cosquillero.state === 'scared') {
      ctx.save();
      ctx.font = 'bold 11px "Press Start 2P", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('¡AY, PERDÓN!', cx, cy - 10);
      ctx.restore();
    }
  }

  // =========================================================================
  // LAYER 4: BRAYAN (PHONE / DODGE / FIRM ATTITUDE WITH AURA!)
  // =========================================================================
  const B = W2.brayan;
  const brayanX = WORLD_1_2_CONFIG.brayanBaseX + B.xOffset;

  // Heroic SNES aura rays when Brayan activates Presencia Firme!
  if (B.firmAura > 0) {
    ctx.save();
    ctx.translate(brayanX, floorY - 105);
    const rad = 70 + (1 - B.firmAura) * 95;
    ctx.strokeStyle = `rgba(250, 204, 21, ${B.firmAura * 0.85})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(249, 115, 22, ${B.firmAura * 0.7})`;
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + W2.elapsed * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 52, Math.sin(a) * 52);
      ctx.lineTo(Math.cos(a) * (rad + 22), Math.sin(a) * (rad + 22));
      ctx.stroke();
    }
    ctx.restore();
  }

  if (B.invuln <= 0 || Math.floor(W2.elapsed * 20) % 2 === 0) {
    const spr = B.pose === 'firm'
      ? (IMGS.brayan_firm || IMGS.brayan_idle)
      : (IMGS.brayan_phone || IMGS.brayan_idle);

    if (spr && spr.height > 0) {
      const bh = B.pose === 'firm' ? 214 : 204;
      const bw = spr.width * (bh / spr.height);
      const bx = brayanX - bw / 2;
      const by = floorY - bh + 2;

      drawGroundShadow(ctx, brayanX, floorY + 2, 38, 10);
      ctx.save();
      if (Math.abs(B.xOffset) > 8) {
        // Dynamic lean angle while dodging snatch hands
        ctx.translate(brayanX, floorY);
        ctx.rotate((B.xOffset / 82) * 0.14);
        ctx.drawImage(spr, -bw / 2, -bh + 2, bw, bh);
      } else {
        ctx.drawImage(spr, bx, by, bw, bh);
      }
      ctx.restore();
    }
  }

  // Brayan's firm shout bubble
  if (B.shoutTimer > 0) {
    const msg = L.w2FirmShout;
    ctx.save();
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    const tw = Math.max(150, ctx.measureText(msg).width + 20);
    const bx = brayanX - tw / 2;
    const by = floorY - 252;
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(bx, by, tw, 26);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, tw, 26);
    ctx.fillStyle = '#111';
    ctx.textAlign = 'center';
    ctx.fillText(msg, brayanX, by + 17);
    ctx.restore();
  }

  // =========================================================================
  // LAYER 5: SNATCH HAND & TOXIC GREEN GAS CLOUD OVERLAY
  // =========================================================================
  if (W2.snatch) {
    let reach = 0;
    if (W2.snatch.state === 'active') {
      const p = 1 - Math.max(0, W2.snatch.timer / W2.snatch.maxTime);
      reach = 0.25 + p * 0.72;
    } else if (W2.snatch.state === 'dodged') {
      reach = 0.85 * (W2.snatch.outT / 0.55);
    } else {
      reach = 1.0;
    }
    drawSnatchHand(ctx, W2.snatch.side, reach, W2.snatch.state);
  }

  // Swirling pixel-art toxic green gas cloud!
  if (W2.gas) {
    ctx.save();
    // Cabin-wide noxious green tint as stink rises
    ctx.fillStyle = `rgba(34, 197, 94, ${W2.gas.cloudAlpha * 0.32})`;
    ctx.fillRect(0, 56, 960, 484);

    // Pixelated green gas puffs
    for (const gb of W2.gasBubbles) {
      const s = Math.round(gb.r);
      ctx.fillStyle = `rgba(74, 222, 128, ${W2.gas.cloudAlpha * 0.75})`;
      ctx.fillRect(Math.round(gb.x - s), Math.round(gb.y - s * 0.7), s * 2, Math.round(s * 1.4));
      ctx.fillStyle = `rgba(134, 239, 172, ${W2.gas.cloudAlpha * 0.65})`;
      ctx.fillRect(Math.round(gb.x - s * 0.6), Math.round(gb.y - s * 0.45), Math.round(s * 1.2), Math.round(s * 0.9));
    }
    ctx.restore();
  }

  // =========================================================================
  // LAYER 6: DIEGETIC ACTION PROMPTS & FEEDBACK
  // =========================================================================
  if (W2.snatch && W2.snatch.state === 'active') {
    const frac = Math.max(0, W2.snatch.timer / W2.snatch.maxTime);
    const label = W2.snatch.side === 'left' ? L.w2DodgeRight : L.w2DodgeLeft;
    drawPromptBadge(ctx, 480, 124, label, '#38bdf8', frac);
  }

  if (W2.cosquillero && W2.cosquillero.state === 'creep') {
    const frac = Math.max(0, W2.cosquillero.timer / W2.cosquillero.maxTime);
    const py = (W2.snatch && W2.snatch.state === 'active') ? 168 : 124;
    drawPromptBadge(ctx, 480, py, L.w2FirmPrompt, '#f97316', frac);
  }

  if (W2.gas && W2.gas.state === 'rising') {
    const frac = Math.max(0, W2.gas.timer / W2.gas.maxTime);
    const py = ((W2.snatch && W2.snatch.state === 'active') || (W2.cosquillero && W2.cosquillero.state === 'creep')) ? 212 : 124;
    drawPromptBadge(ctx, 480, py, L.w2WindowPrompt, '#4ade80', frac);
  }

  // Station arrival / intro announcement toast
  if (W2.bannerTimer > 0 && W2.bannerText) {
    ctx.save();
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    const tw = Math.max(240, ctx.measureText(W2.bannerText).width + 28);
    ctx.fillStyle = 'rgba(185, 28, 28, 0.92)';
    ctx.fillRect(480 - tw / 2, 92, tw, 24);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(480 - tw / 2, 92, tw, 24);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(W2.bannerText, 480, 108);
    ctx.restore();
  }

  // Particles & Floating Texts
  for (const pt of W2.particles) {
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.font = 'bold 10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  for (const ft of W2.floatTexts) {
    ctx.fillStyle = '#000';
    ctx.fillText(ft.text, ft.x + 2, ft.y + 2);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  }

  ctx.restore(); // end shake transform

  // =========================================================================
  // LAYER 7: MATCHING 16-BIT SNES HUD BAR (52s ROUTE PROGRESS + COUNTDOWN)
  // =========================================================================
  ctx.fillStyle = 'rgba(10, 8, 24, 0.92)';
  ctx.fillRect(0, 0, 960, 56);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 54, 960, 3);

  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#facc15';
  ctx.fillText('BRAYAN', 16, 23);

  let hearts = '';
  for (let i = 0; i < W2.maxHp; i++) hearts += (i < W2.hp ? '♥ ' : '♡ ');
  ctx.fillStyle = '#ef4444';
  ctx.fillText(hearts, 16, 45);

  // Center: Stage title & 52s route progress bar to Calle 26
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(`${L.w2Hud} [${STATE.mode === 'light' ? L.modeBadgeLight : L.modeBadgeHeavy}]`, 480, 22);

  const prog = Math.max(0, Math.min(1, W2.elapsed / W2.duration));
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(320, 32, 320, 12);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(322, 34, Math.floor(316 * prog), 8);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2;
  ctx.strokeRect(320, 32, 320, 12);
  // Little pixel bus marker sliding along the route bar
  const busPinX = 322 + Math.floor(306 * prog);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(busPinX, 31, 10, 14);

  // Right: Score & Remaining Time (00:XX)
  const remSec = Math.max(0, Math.ceil(W2.duration - W2.elapsed));
  ctx.textAlign = 'right';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${L.statScore} ${String(W2.score).padStart(6, '0')}`, 944, 24);
  ctx.fillStyle = remSec <= 10 ? '#4ade80' : '#fef08a';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText(`00:${String(remSec).padStart(2, '0')} → CALLE 26`, 944, 45);

  if (W2.fadeIn > 0) {
    ctx.fillStyle = `rgba(18, 12, 46, ${W2.fadeIn})`;
    ctx.fillRect(0, 0, 960, 540);
  }
}
