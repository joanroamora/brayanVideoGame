import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { IMGS } from '../../core/assets.js';
import { drawGroundShadow, drawFlippedSprite } from '../../core/renderer.js';
import { WORLD_2_3_CONFIG } from './levelData.js';

const {
  lanes: LANES,
  laneScales: LANE_SCALES,
  sidewalkTopY: SW_TOP,
  totalDistance: TOTAL_DIST,
  bgPanels: BG_PANELS
} = WORLD_2_3_CONFIG;

/**
 * Draws the Paradero SITP / TransMilenio destination sign at the end of Carrera 7a
 * ("PARADERO • RUMBO A BOSA LA ESPERANZA").
 */
function drawBusStopGoal(ctx, sx, time, L) {
  ctx.save();
  // Blue SITP bus stop post & shelter
  ctx.fillStyle = '#0f172a'; ctx.fillRect(sx - 4, 244, 12, 118);
  ctx.fillStyle = '#38bdf8'; ctx.fillRect(sx - 2, 246, 8, 114);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(sx - 56, 204, 152, 54);
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.strokeRect(sx - 56, 204, 152, 54);
  ctx.fillStyle = '#2563eb'; ctx.fillRect(sx - 52, 208, 144, 18);
  ctx.font = 'bold 8px "Press Start 2P", monospace';
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText(L.w23GoalTop, sx + 20, 221);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 7px "Press Start 2P", monospace';
  ctx.fillText(L.w23GoalSub, sx + 20, 245);

  const bob = Math.sin(time * 6) * 4;
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 9px "Press Start 2P", monospace';
  ctx.fillText('▼ META 2-3 ▼', sx + 20, 194 + bob);
  ctx.restore();
}

export function renderWorld2_3(ctx, W23) {
  const L = t();
  const P = W23.player;
  const prog = Math.max(0, Math.min(1, W23.dist / TOTAL_DIST));

  ctx.save();
  if (W23.shakeTime > 0) {
    const m = W23.shakeTime * 15;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }

  // =========================================================================
  // 1. NON-REPEATING 4-PANEL REALISTIC CARRERA 7a CENTRO INTERNACIONAL PANORAMA!
  //    Each panel is 960px wide -> 3,840px continuous unique Bogotá streetscape!
  // =========================================================================
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(0, 0, 960, 540);

  const panelW = 960;
  const panelY = 52;
  const panelH = SW_TOP - panelY + 8; // 282px tall upper street skyline & facades
  const maxPanScroll = (BG_PANELS.length - 1) * panelW; // 2880px unique scroll
  const panX = prog * maxPanScroll;

  for (let idx = 0; idx < BG_PANELS.length; idx++) {
    const drawX = Math.round(idx * panelW - panX);
    if (drawX + panelW < -10 || drawX > 970) continue;
    const img = IMGS[BG_PANELS[idx]];
    if (img && img.height > 0) {
      // Crop the upper ~84% of each 16:9 Carrera 7a mural cleanly above the 3-lane sidewalk!
      const srcH = Math.round(img.height * 0.84);
      ctx.drawImage(img, 0, 0, img.width, srcH, drawX, panelY, panelW + 2, panelH);
    }
    // Live shimmering purple/violet LED night glow pulsing over Torre Colpatria & Purple Tower (Panel 5)!
    if (idx === 4) {
      const pulse = 0.14 + Math.sin(W23.time * 4.2) * 0.10;
      const sweepY = panelY + Math.round(((Math.sin(W23.time * 2.2) + 1) * 0.5) * (panelH - 54));
      ctx.save();
      ctx.fillStyle = `rgba(217, 70, 239, ${pulse})`;
      ctx.fillRect(drawX + 228, panelY + 8, 168, panelH - 20);
      ctx.fillRect(drawX + 564, panelY + 26, 188, panelH - 38);
      ctx.fillStyle = `rgba(245, 208, 254, ${pulse + 0.12})`;
      ctx.fillRect(drawX + 232, sweepY, 160, 7);
      ctx.fillRect(drawX + 568, panelY + panelH - (sweepY - panelY) - 24, 180, 7);
      ctx.restore();
    }
    // Soft seamless dusk blend seam between consecutive unique architectural panels
    if (idx > 0 && drawX > -32 && drawX < 992) {
      const seam = ctx.createLinearGradient(drawX - 24, 0, drawX + 24, 0);
      seam.addColorStop(0, 'rgba(24, 18, 44, 0)');
      seam.addColorStop(0.5, 'rgba(24, 18, 44, 0.32)');
      seam.addColorStop(1, 'rgba(24, 18, 44, 0)');
      ctx.fillStyle = seam;
      ctx.fillRect(drawX - 24, panelY, 48, panelH);
    }
  }

  // Soft twilight horizon glaze anchoring buildings to the brick sidewalk
  const baseGlaze = ctx.createLinearGradient(0, SW_TOP - 32, 0, SW_TOP + 6);
  baseGlaze.addColorStop(0, 'rgba(15, 23, 42, 0)');
  baseGlaze.addColorStop(1, 'rgba(15, 23, 42, 0.45)');
  ctx.fillStyle = baseGlaze;
  ctx.fillRect(0, SW_TOP - 32, 960, 38);

  // Subtle Landmark Sector Plaque showing where Brayan is along Carrera 7a!
  const sectorIdx = Math.min(BG_PANELS.length - 1, Math.floor(prog * BG_PANELS.length));
  const landmarkName = L.w23Landmarks[sectorIdx] || '';
  if (landmarkName) {
    ctx.save();
    ctx.font = 'bold 8px "Press Start 2P", monospace';
    const tw = ctx.measureText(landmarkName).width + 20;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
    ctx.fillRect(14, 64, tw, 22);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 64, tw, 22);
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.fillText(landmarkName, 24, 79);
    ctx.restore();
  }

  // =========================================================================
  // 2. WIDE 3-LANE BOGOTÁ RED-BRICK SIDEWALK ("ACERA DE LA CARRERA 7ª")
  // =========================================================================
  // Curb wall separating buildings from sidewalk
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, SW_TOP - 3, 960, 4);
  ctx.fillStyle = '#64748b'; ctx.fillRect(0, SW_TOP, 960, 8);

  // 3 Distinct Brick Sidewalk Lanes with subtle tone differentiation for crystal-clear lane readability!
  const laneBands = [
    { y0: SW_TOP + 8, h: 64, base: '#9a4f3f', brick: '#b25d4a' }, // Lane 0 (top)
    { y0: SW_TOP + 72, h: 64, base: '#a65745', brick: '#bf6852' }, // Lane 1 (mid)
    { y0: SW_TOP + 136, h: 62, base: '#964c3d', brick: '#ae5a48' } // Lane 2 (bottom)
  ];
  const brickScroll = Math.round(W23.dist % 48);
  for (let bIdx = 0; bIdx < laneBands.length; bIdx++) {
    const band = laneBands[bIdx];
    ctx.fillStyle = band.base;
    ctx.fillRect(0, band.y0, 960, band.h);

    // Repeating Bogotá terracotta sidewalk paver tiles scrolling at full speed!
    ctx.fillStyle = band.brick;
    for (let row = 0; row < 2; row++) {
      const rowOff = (row * 24 + brickScroll) % 48;
      for (let bx = -rowOff; bx < 980; bx += 48) {
        ctx.fillRect(bx + 2, band.y0 + 5 + row * 29, 42, 22);
      }
    }

    // Highlight active player lane very subtly so lane alignment is effortless!
    if (P.lane === bIdx) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.08)';
      ctx.fillRect(0, band.y0, 960, band.h);
    }

    // Crisp tactile yellow/slate lane guide line between sidewalk lanes
    if (bIdx < 2) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
      ctx.fillRect(0, band.y0 + band.h - 2, 960, 3);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.28)';
      for (let dx = -(Math.round(W23.dist) % 72); dx < 980; dx += 72) {
        ctx.fillRect(dx, band.y0 + band.h - 1, 34, 2);
      }
    }
  }

  // Bottom street curb & classic Bogotá metal bollards along Carrera 7a!
  ctx.fillStyle = '#eab308'; ctx.fillRect(0, 524, 960, 6); // yellow curb paint
  ctx.fillStyle = '#334155'; ctx.fillRect(0, 530, 960, 10); // edge of Carrera 7a asphalt
  const bolScroll = Math.round(W23.dist % 140);
  for (let bx = 140 - bolScroll; bx < 1000; bx += 140) {
    ctx.fillStyle = '#0f172a'; ctx.fillRect(bx - 5, 504, 10, 26);
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(bx - 3, 506, 6, 22);
    ctx.fillStyle = '#fef08a'; ctx.fillRect(bx - 3, 510, 6, 3); // reflective collar
  }

  // Goal Bus Stop appearing as Brayan nears the end of Carrera 7a!
  const goalScreenX = (TOTAL_DIST - W23.dist) + P.x + 80;
  if (goalScreenX < 1060) {
    drawBusStopGoal(ctx, Math.round(goalScreenX), W23.time, L);
  }

  // Lane Warning Indicators on right edge when fast motos enter a lane!
  for (let l = 0; l < 3; l++) {
    if (W23.laneWarnings[l] > 0 && Math.floor(W23.time * 16) % 2 === 0) {
      const wy = LANES[l] - 32;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(910, wy - 16, 40, 32);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.strokeRect(910, wy - 16, 40, 32);
      ctx.font = 'bold 14px "Press Start 2P", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('!', 930, wy + 6);
    }
  }

  // =========================================================================
  // 3. DEPTH-SORTED ACTORS ON THE 3 SIDEWALK LANES (Top lane -> Bottom lane!)
  // =========================================================================
  const drawList = [];

  // Add Pickups
  for (const pk of W23.pickups) {
    if (!pk.got) drawList.push({ y: pk.y - 2, kind: 'pickup', obj: pk });
  }
  // Add Obstacles
  for (const ob of W23.obstacles) {
    if (ob.alive) drawList.push({ y: ob.y, kind: 'obstacle', obj: ob });
  }
  // Add Brayan
  drawList.push({ y: P.y + 1, kind: 'player', obj: P });

  // Painter's algorithm Y-sort so lower-lane characters naturally overlap upper-lane characters!
  drawList.sort((a, b) => a.y - b.y);

  for (const item of drawList) {
    if (item.kind === 'pickup') {
      const pk = item.obj;
      const sc = LANE_SCALES[pk.lane] || 1;
      const bob = Math.sin(W23.time * 6 + pk.x * 0.04) * 5;
      ctx.save();
      ctx.translate(Math.round(pk.x), Math.round(pk.y - 24 * sc + bob));
      ctx.scale(sc, sc);
      if (pk.type === 'tinto') {
        ctx.fillStyle = '#000'; ctx.fillRect(-11, -10, 22, 22);
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(-9, -8, 18, 18);
        ctx.fillStyle = '#451a03'; ctx.fillRect(-7, -6, 14, 5);
        ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-4, -15, 2, 5);
        ctx.fillRect(2, -16, 2, 6);
      } else if (pk.type === 'empanada') {
        // Golden Empanada = "¡CHITE! Cooldown Boost!"
        ctx.fillStyle = 'rgba(34, 211, 238, 0.35)'; ctx.fillRect(-18, -14, 36, 26);
        ctx.fillStyle = '#000'; ctx.fillRect(-14, -9, 28, 18);
        ctx.fillStyle = '#f59e0b'; ctx.fillRect(-12, -7, 24, 14);
        ctx.fillStyle = '#fef08a'; ctx.fillRect(-8, -5, 16, 5);
      } else {
        ctx.fillStyle = '#000'; ctx.fillRect(-11, -11, 22, 22);
        ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-9, -9, 18, 18);
        ctx.fillStyle = '#eab308'; ctx.fillRect(-6, -6, 12, 12);
      }
      ctx.restore();
    } else if (item.kind === 'obstacle') {
      const ob = item.obj;
      const sc = LANE_SCALES[ob.lane] || 1;
      let spr = IMGS.nero_runner;
      let baseH = 98;
      if (ob.kind === 'rappi') { spr = IMGS.moto_rappi; baseH = 98; }
      else if (ob.kind === 'motero') { spr = IMGS.moto_callejero; baseH = 98; }
      else if (ob.kind === 'nero_smoke') { spr = IMGS.nero_smoker; baseH = 96; }
      else if (ob.kind === 'skater') { spr = IMGS.skater_7a; baseH = 100; }

      if (spr && spr.height > 0) {
        const th = Math.round(baseH * sc);
        const tw = Math.round(spr.width * (th / spr.height));
        const bob = ob.pushed ? 0
          : (ob.kind === 'rappi' || ob.kind === 'motero') ? Math.sin(ob.animT * 26) * 2
          : (ob.kind === 'skater') ? -Math.abs(Math.sin(ob.animT * 7)) * 10
          : Math.abs(Math.sin(ob.animT * (ob.kind === 'nero_smoke' ? 5 : 13))) * -4;

        if (!ob.pushed) {
          const shW = (ob.kind === 'rappi' || ob.kind === 'motero') ? tw * 0.44 : tw * 0.38;
          drawGroundShadow(ctx, ob.x, ob.y + 3, shW, 7 * sc);
        }

        ctx.save();
        ctx.translate(Math.round(ob.x), Math.round(ob.y - th * 0.5 + bob));
        if (ob.pushed) ctx.rotate(ob.pushRot);
        // All 5 World 2-3 obstacle sprites naturally face LEFT (approaching Brayan!)
        ctx.drawImage(spr, -tw / 2, -th / 2, tw, th);
        ctx.restore();
      }
    } else if (item.kind === 'player') {
      const sc = LANE_SCALES[P.lane] || 1;
      const hop = P.laneHopT > 0 ? -Math.sin((P.laneHopT / 0.16) * Math.PI) * 14 : 0;

      // Subtle "¡CHITE! READY" ring aura at Brayan's feet when power is charged!
      if (P.chiteCd <= 0) {
        const pulse = 0.25 + Math.sin(W23.time * 6) * 0.12;
        ctx.save();
        ctx.strokeStyle = `rgba(34, 211, 238, ${pulse + 0.2})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(P.x, P.y + 3, 28 * sc, 9 * sc, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (P.invuln <= 0 || Math.floor(W23.time * 18) % 2 === 0) {
        let bSpr = P.walkFrame === 0 ? IMGS.brayan_walk1 : IMGS.brayan_walk2;
        if (P.chiteAnimT > 0 && IMGS.brayan_firm) bSpr = IMGS.brayan_firm;
        if (bSpr && bSpr.height > 0) {
          const bh = Math.round(102 * sc);
          const bw = Math.round(bSpr.width * (bh / bSpr.height));
          drawGroundShadow(ctx, P.x, P.y + 3, 24 * sc, 7 * sc);
          drawFlippedSprite(ctx, bSpr, Math.round(P.x - bw / 2), Math.round(P.y - bh + 2 + hop), bw, bh, 1);
        }
      }
    }
  }

  // Smoking Ñero Haze Puffs
  for (const s of W23.smokePuffs) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, s.life * 0.62);
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Expanding "¡CHITE!" Shockwave Power Bubbles!
  for (const b of W23.bubbles) {
    const a = Math.max(0, b.life / b.maxLife);
    ctx.save();
    const grad = ctx.createRadialGradient(b.x, b.y, b.r * 0.25, b.x, b.y, b.r);
    grad.addColorStop(0, `rgba(254, 240, 138, ${a * 0.16})`);
    grad.addColorStop(0.7, `rgba(34, 211, 238, ${a * 0.36})`);
    grad.addColorStop(1, `rgba(56, 189, 248, ${a * 0.88})`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(254, 240, 138, ${a})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${a * 0.85})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, Math.max(4, b.r - 12), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Particles & Floating Bogotá Street Dialogue Texts
  for (const pt of W23.particles) {
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.font = 'bold 9px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  for (const ft of W23.floatTexts) {
    ctx.fillStyle = '#000'; ctx.fillText(ft.text, ft.x + 2, ft.y + 2);
    ctx.fillStyle = ft.color; ctx.fillText(ft.text, ft.x, ft.y);
  }

  // =========================================================================
  // 4. MATCHING 16-BIT SNES HUD BAR + "¡CHITE!" POWER METER!
  // =========================================================================
  ctx.fillStyle = 'rgba(10, 8, 24, 0.92)'; ctx.fillRect(0, 0, 960, 56);
  ctx.fillStyle = '#facc15'; ctx.fillRect(0, 54, 960, 3);

  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'left'; ctx.fillStyle = '#facc15';
  ctx.fillText('BRAYAN', 16, 23);
  let hearts = '';
  for (let i = 0; i < P.maxHp; i++) hearts += (i < P.hp ? '♥ ' : '♡ ');
  ctx.fillStyle = '#ef4444'; ctx.fillText(hearts, 16, 45);

  // Center: Route Progress toward Bosa La Esperanza
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText(`${L.w23Hud} [${STATE.mode === 'light' ? L.modeBadgeLight : L.modeBadgeHeavy}]`, 450, 21);
  ctx.fillStyle = '#1e293b'; ctx.fillRect(295, 31, 310, 12);
  ctx.fillStyle = '#38bdf8'; ctx.fillRect(297, 33, Math.floor(306 * prog), 8);
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(295, 31, 310, 12);

  // Right: Score + Glowing "¡CHITE!" Cooldown Bar!
  ctx.textAlign = 'right'; ctx.fillStyle = '#38bdf8';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText(`${L.statScore} ${String(W23.score).padStart(6, '0')}`, 944, 21);

  const chiteReady = P.chiteCd <= 0;
  const chiteFill = chiteReady ? 1 : (1 - P.chiteCd / P.chiteMaxCd);
  ctx.fillStyle = '#1e293b'; ctx.fillRect(720, 30, 224, 16);
  ctx.fillStyle = chiteReady ? '#22d3ee' : '#64748b';
  ctx.fillRect(722, 32, Math.floor(220 * chiteFill), 12);
  ctx.strokeStyle = chiteReady ? '#fef08a' : '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(720, 30, 224, 16);

  ctx.textAlign = 'center';
  ctx.font = 'bold 7.5px "Press Start 2P", monospace';
  ctx.fillStyle = chiteReady ? '#082f49' : '#f8fafc';
  ctx.fillText(chiteReady ? L.w23ChiteReady : `${L.w23ChiteBar} ${P.chiteCd.toFixed(1)}s`, 832, 41);

  if (W23.fadeIn > 0) {
    ctx.fillStyle = `rgba(12, 8, 28, ${W23.fadeIn})`;
    ctx.fillRect(0, 0, 960, 540);
  }
  ctx.restore();
}
