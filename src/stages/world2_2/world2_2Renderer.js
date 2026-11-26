import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { IMGS } from '../../core/assets.js';
import { drawGroundShadow, drawFlippedSprite } from '../../core/renderer.js';
import { WORLD_2_2_CONFIG } from './levelData.js';

/**
 * Draws the loaded Photocopier Goal Station at GOAL_X (ready when Brayan brings the papers!).
 */
function drawCopyStationGoal(ctx, gx, groundY, time, scanT, hasEnough, papers, req, L) {
  ctx.save();
  ctx.fillStyle = '#334155';
  ctx.fillRect(gx + 18, 212, 8, groundY - 212);
  ctx.fillRect(gx + 132, 212, 8, groundY - 212);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(gx - 28, 170, 214, 52);
  ctx.strokeStyle = hasEnough ? '#4ade80' : '#facc15';
  ctx.lineWidth = 3;
  ctx.strokeRect(gx - 28, 170, 214, 52);
  ctx.font = 'bold 10px "Press Start 2P", monospace';
  ctx.fillStyle = hasEnough ? '#4ade80' : '#fde047';
  ctx.textAlign = 'center';
  ctx.fillText(L.w22GoalLabel, gx + 79, 192);
  ctx.font = 'bold 7px "Press Start 2P", monospace';
  ctx.fillStyle = hasEnough ? '#dcfce7' : '#fb923c';
  ctx.fillText(hasEnough ? L.w22GoalReady : `${L.w22PaperCount}: ${papers}/${req}`, gx + 79, 210);

  const cx = gx + 16;
  const cy = groundY - 122;
  drawGroundShadow(ctx, cx + 64, groundY + 3, 66, 9);

  // Heavy-duty Photocopier
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - 3, cy - 3, 134, 125);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(cx, cy, 128, 118);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(cx, cy + 56, 128, 62);
  // Paper trays (glow white when loaded!)
  ctx.fillStyle = hasEnough ? '#fefce8' : '#64748b';
  ctx.fillRect(cx + 12, cy + 64, 104, 18);
  ctx.fillRect(cx + 12, cy + 88, 104, 20);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx + 48, cy + 71, 32, 4);
  ctx.fillRect(cx + 48, cy + 96, 32, 4);

  // Control panel
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx + 8, cy + 16, 44, 24);
  ctx.fillStyle = hasEnough
    ? (Math.floor(time * 5) % 2 === 0 ? '#22c55e' : '#86efac')
    : (Math.floor(time * 4) % 2 === 0 ? '#ef4444' : '#fca5a5');
  ctx.fillRect(cx + 14, cy + 22, 10, 10);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(cx + 28, cy + 22, 18, 6);

  // Glass scanner bed + laser scan sweep
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx + 58, cy + 12, 62, 32);
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(cx + 61, cy + 15, 56, 26);
  ctx.fillStyle = '#fefce8';
  ctx.fillRect(cx + 76, cy + 18, 26, 20);
  const scanPhase = (Math.sin(scanT > 0 ? scanT * 10 : time * 3.5) + 1) * 0.5;
  ctx.fillStyle = hasEnough ? 'rgba(74, 222, 128, 0.9)' : 'rgba(248, 113, 113, 0.65)';
  ctx.fillRect(cx + 63 + Math.round(scanPhase * 48), cy + 15, 5, 26);

  // Lid
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - 2, cy - 16, 132, 15);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(cx + 1, cy - 13, 126, 10);

  const bob = Math.sin(time * 6) * 5;
  ctx.fillStyle = hasEnough ? '#4ade80' : '#facc15';
  ctx.font = 'bold 9px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(hasEnough ? '▼ ¡COPIAR YA! ▼' : '▼ TRAE HOJAS ▼', cx + 64, cy - 26 + bob);

  ctx.restore();
}

export function renderWorld2_2(ctx, W22) {
  const L = t();
  const cam = W22.camX;
  const GROUND_Y = WORLD_2_2_CONFIG.groundY;
  const GOAL_X = WORLD_2_2_CONFIG.goalX;
  const hasEnough = W22.papers >= W22.requiredPapers;

  ctx.save();
  if (W22.shakeTime > 0) {
    const m = W22.shakeTime * 14;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }

  // =========================================================================
  // 1. 16-BIT BOGOTÁ PUBLIC OFFICES & UNION HALL PARALLAX BACKGROUND
  // =========================================================================
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 960, 540);

  const bg = IMGS[WORLD_2_2_CONFIG.bgKey];
  if (bg && bg.height > 0) {
    const bgY = 50;
    const bgH = GROUND_Y - bgY + 6;
    const bgW = Math.round(bg.width * (bgH / bg.height));
    const scrollX = -((cam * 0.34) % bgW);
    for (let ox = scrollX - bgW; ox < 960 + bgW; ox += bgW) {
      ctx.drawImage(bg, Math.round(ox), bgY, bgW, bgH);
    }
  }

  const glaze = ctx.createLinearGradient(0, GROUND_Y - 52, 0, GROUND_Y);
  glaze.addColorStop(0, 'rgba(15, 23, 42, 0)');
  glaze.addColorStop(1, 'rgba(15, 23, 42, 0.24)');
  ctx.fillStyle = glaze;
  ctx.fillRect(0, GROUND_Y - 52, 960, 52);

  // =========================================================================
  // 2. WORLD SPACE OBJECTS (translate by -cam)
  // =========================================================================
  ctx.save();
  ctx.translate(-Math.round(cam), 0);

  // Hanging Union Rally Banners along the offices!
  for (let sx = 540; sx < WORLD_2_2_CONFIG.levelLen - 500; sx += 1460) {
    if (sx + 340 < cam || sx - 340 > cam + 960) continue;
    ctx.save();
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(sx - 165, 66, 330, 28);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 165, 66, 330, 28);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(L.w22UnionBanner, sx, 84);
    ctx.restore();
  }

  // Polished Ministry Office Tile Floor
  const startTile = Math.floor((cam - 64) / 64) * 64;
  ctx.fillStyle = '#0f172a'; ctx.fillRect(cam - 20, GROUND_Y - 2, 1000, 4);
  ctx.fillStyle = '#dc2626'; ctx.fillRect(cam - 20, GROUND_Y, 1000, 5); // union red trim!
  ctx.fillStyle = '#334155'; ctx.fillRect(cam - 20, GROUND_Y + 5, 1000, 79);
  for (let x = startTile; x < cam + 1000; x += 64) {
    const alt = ((Math.round(x / 64) % 2) === 0);
    ctx.fillStyle = alt ? '#cbd5e1' : '#94a3b8';
    ctx.fillRect(x + 2, GROUND_Y + 8, 60, 32);
    ctx.fillStyle = alt ? '#94a3b8' : '#64748b';
    ctx.fillRect(x - 28, GROUND_Y + 44, 60, 34);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x + 8, GROUND_Y + 12, 18, 5);
  }

  // Playable Office Refuge Platforms (Safe perches above Lagarto stampedes!)
  for (const pl of W22.platforms) {
    if (pl.x + pl.w < cam - 40 || pl.x > cam + 1000) continue;
    ctx.fillStyle = '#000';
    ctx.fillRect(pl.x - 2, pl.y - 2, pl.w + 4, pl.h + 4);

    if (pl.style === 'desk') {
      ctx.fillStyle = '#78350f'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#b45309'; ctx.fillRect(pl.x, pl.y, pl.w, 6);
      ctx.fillStyle = '#facc15'; ctx.fillRect(pl.x, pl.y + pl.h - 4, pl.w, 4);
      ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText(pl.label || 'OFICINA', pl.x + pl.w / 2, pl.y + 17);
    } else if (pl.style === 'cabinet') {
      ctx.fillStyle = '#475569'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(pl.x, pl.y, pl.w, 5);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(pl.x + 8, pl.y + 9, pl.w - 16, 4);
      ctx.fillStyle = '#fef08a'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText(pl.label || 'ARCHIVO', pl.x + pl.w / 2, pl.y + 20);
    } else if (pl.style === 'conference') {
      ctx.fillStyle = '#991b1b'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#facc15'; ctx.fillRect(pl.x, pl.y, pl.w, 5);
      ctx.fillStyle = '#fef08a'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText(pl.label || 'SINDICATO', pl.x + pl.w / 2, pl.y + 16);
    } else if (pl.style === 'watercooler') {
      ctx.fillStyle = '#0284c7'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#bae6fd'; ctx.fillRect(pl.x, pl.y, pl.w, 6);
      ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText(pl.label || 'AGUA', pl.x + pl.w / 2, pl.y + 17);
    } else {
      ctx.fillStyle = '#0f766e'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#5eead4'; ctx.fillRect(pl.x, pl.y, pl.w, 5);
      ctx.fillStyle = '#f8fafc'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText(pl.label || 'CUBÍCULO', pl.x + pl.w / 2, pl.y + 17);
    }
  }

  // Goal Photocopier Station
  if (GOAL_X > cam - 220 && GOAL_X < cam + 1140) {
    drawCopyStationGoal(ctx, GOAL_X, GROUND_Y, W22.time, W22.copyScanT, hasEnough, W22.papers, W22.requiredPapers, L);
  }

  // Allied NPC: Doña Martha de los Tintos
  for (const tl of W22.tintoLadies) {
    if (tl.x + 150 < cam || tl.x - 120 > cam + 960) continue;
    const spr = IMGS.tinto_lady || IMGS.chaza_lady;
    if (spr && spr.height > 0) {
      const sh = 122;
      const sw = spr.width * (sh / spr.height);
      const bob = Math.sin(W22.time * 4) * (tl.smileT > 0 ? -3 : -1);
      const dx = tl.x;
      const dy = GROUND_Y - sh + 4 + bob;
      drawGroundShadow(ctx, dx + sw * 0.5, GROUND_Y + 3, sw * 0.45, 8);
      ctx.drawImage(spr, dx, dy, sw, sh);

      if (tl.bubbleT > 0) {
        const msg = tl.bubbleT > 1.7 ? L.w22TintoGreet : L.w22TintoThanks;
        ctx.save();
        ctx.font = '8px "Press Start 2P", monospace';
        const tw = Math.max(185, ctx.measureText(msg).width + 20);
        const gx = dx + sw * 0.5;
        const bx = gx - tw / 2;
        const by = dy - 34;
        ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, tw, 24);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(bx, by, tw, 24);
        ctx.fillStyle = '#111'; ctx.textAlign = 'center';
        ctx.fillText(msg, gx, by + 16);
        ctx.restore();
      }
    }
  }

  // Collectibles: Crisp Glowing Bond Paper Sheets ('paper'), Golden Paper Reams ('ream'), Tintos
  for (const it of W22.items) {
    if (it.got || it.x < cam - 35 || it.x > cam + 995) continue;
    const bob = Math.sin(W22.time * 5 + it.x * 0.02) * 5;
    if (it.type === 'paper') {
      // Glowing crisp white bond sheet!
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(it.x - 15, it.y - 18 + bob, 30, 34);
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 12, it.y - 15 + bob, 24, 28);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(it.x - 10, it.y - 13 + bob, 20, 24);
      ctx.fillStyle = '#bae6fd'; ctx.fillRect(it.x + 4, it.y - 13 + bob, 6, 6); // folded corner
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(it.x - 6, it.y - 4 + bob, 12, 2);
      ctx.fillRect(it.x - 6, it.y + 2 + bob, 10, 2);
      ctx.fillRect(it.x - 6, it.y + 7 + bob, 12, 2);
    } else if (it.type === 'ream') {
      // Golden Double-Sheet Resma Pack (+2 papers!)
      ctx.fillStyle = 'rgba(250, 204, 21, 0.38)';
      ctx.fillRect(it.x - 18, it.y - 16 + bob, 36, 30);
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 15, it.y - 12 + bob, 30, 22);
      ctx.fillStyle = '#facc15'; ctx.fillRect(it.x - 13, it.y - 10 + bob, 26, 18);
      ctx.fillStyle = '#fefce8'; ctx.fillRect(it.x - 10, it.y - 7 + bob, 20, 12);
      ctx.fillStyle = '#dc2626'; ctx.font = 'bold 7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText('x2', it.x, it.y + 2 + bob);
    } else {
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 10, it.y - 8 + bob, 20, 20);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(it.x - 8, it.y - 6 + bob, 16, 16);
      ctx.fillStyle = '#451a03'; ctx.fillRect(it.x - 7, it.y - 5 + bob, 14, 5);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(it.x - 4, it.y - 13 + bob, 2, 5);
      ctx.fillRect(it.x + 2, it.y - 15 + bob, 2, 6);
    }
  }

  // =========================================================================
  // ENEMIES: SPEEDY SUITED OFFICE LAGARTOS RUSHING TO THE UNION MEETING!
  // =========================================================================
  for (const e of W22.enemies) {
    if (!e.alive || e.x + e.w < cam - 180 || e.x > cam + 1160) continue;

    let spr = IMGS.lagarto_runner;
    let targetH = 104;
    if (e.type === 'sindical') {
      spr = IMGS.lagarto_sindical;
      targetH = 114;
    } else if (e.type === 'hopper') {
      spr = IMGS.lagarto_hopper;
      targetH = 102;
    }

    if (spr && spr.height > 0) {
      const sw = spr.width * (targetH / spr.height);
      const fast = e.fromStampede || e.state === 'boost';
      const yBob = (e.y < e.floorY - e.h - 2) ? 0 : Math.abs(Math.sin(e.animT * (fast ? 20 : 13))) * -5;
      const dx = e.x + e.w / 2 - sw / 2;
      const dy = e.y + e.h - targetH + 2 + yBob;

      // Retro comic speed-lines streaking behind stampeding / boosting Lagartos!
      if (fast) {
        ctx.save();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.72)';
        const trailDir = -e.facing;
        for (let k = 0; k < 4; k++) {
          const lx = e.x + (trailDir > 0 ? e.w + 4 : -34) + trailDir * (k * 8);
          const ly = e.y + 18 + k * 20;
          ctx.fillRect(lx, ly, 26 - k * 3, 3);
        }
        ctx.restore();
      }

      if (e.y >= e.floorY - e.h - 4) {
        drawGroundShadow(ctx, e.x + e.w / 2, e.floorY + 2, 28, 7);
      }
      // All 3 lagarto sprites naturally face LEFT -> pass -e.facing!
      drawFlippedSprite(ctx, spr, dx, dy, sw, targetH, -e.facing);

      // Union "+25% PRIMA" floating mini-tag above stampeding / chanting Lagartos!
      if (fast || e.state === 'chant') {
        ctx.save();
        const tag = e.fromStampede ? '🐊 +25%!' : (e.type === 'sindical' ? '📢 PRIMA 25%' : '⚡ SINDICATO');
        ctx.font = 'bold 7px "Press Start 2P", monospace';
        const tw = Math.max(66, ctx.measureText(tag).width + 10);
        const tx = e.x + e.w / 2 - tw / 2;
        const ty = dy - 20;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(tx, ty, tw, 15);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, tw, 15);
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText(tag, e.x + e.w / 2, ty + 11);
        ctx.restore();
      }
    }
  }

  // Player: Brayan 16-Bit
  const P = W22.player;
  if (P.invuln <= 0 || Math.floor(W22.time * 18) % 2 === 0) {
    let bSpr = IMGS.brayan_idle;
    let bh = 102;
    if (P.attackTimer > 0 && IMGS.brayan_briefcase) {
      bSpr = IMGS.brayan_briefcase;
      bh = 104;
    } else if (!P.onGround) {
      bSpr = IMGS.brayan_walk2;
    } else if (P.crouching) {
      bSpr = IMGS.brayan_firm || IMGS.brayan_idle;
      bh = 70;
    } else if (P.vx !== 0) {
      bSpr = P.walkFrame === 0 ? IMGS.brayan_walk1 : IMGS.brayan_walk2;
    }

    if (bSpr && bSpr.height > 0) {
      const bw = bSpr.width * (bh / bSpr.height);
      const bx = P.x + P.w / 2 - bw / 2 + (P.attackTimer > 0 ? P.facing * 14 : 0);
      const by = P.y + P.h - bh + 2;
      if (P.onGround) drawGroundShadow(ctx, P.x + P.w / 2, P.y + P.h + 2, P.crouching ? 28 : 22, 6);
      drawFlippedSprite(ctx, bSpr, bx, by, bw, bh, P.facing);

      if (P.attackTimer > 0.08) {
        ctx.save();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const cx = P.x + (P.facing > 0 ? P.w + 26 : -26);
        ctx.arc(cx, P.y + 42, 26, P.facing > 0 ? -0.9 : 2.2, P.facing > 0 ? 0.9 : 4.0);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Spinning Thrown Lawyer Briefcases
  for (const bc of W22.briefcases) {
    ctx.save();
    ctx.translate(bc.x, bc.y);
    ctx.rotate(bc.rot);
    ctx.fillStyle = '#000'; ctx.fillRect(-16, -12, 32, 24);
    ctx.fillStyle = '#78350f'; ctx.fillRect(-14, -10, 28, 20);
    ctx.fillStyle = '#92400e'; ctx.fillRect(-12, -8, 24, 7);
    ctx.fillStyle = '#facc15'; ctx.fillRect(-4, -2, 8, 5);
    ctx.restore();
  }

  // Flying Union Flyers ("+25% PRIMA")
  for (const pr of W22.projectiles) {
    ctx.save();
    ctx.font = 'bold 8px "Press Start 2P", monospace';
    const tw = Math.max(82, ctx.measureText(pr.text).width + 14);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(pr.x - tw / 2 - 3, pr.y - 15, tw + 6, 30);
    ctx.fillStyle = '#dc2626'; ctx.fillRect(pr.x - tw / 2, pr.y - 12, tw, 24);
    ctx.fillStyle = '#fef08a'; ctx.textAlign = 'center';
    ctx.fillText(pr.text, pr.x, pr.y + 4);
    ctx.restore();
  }

  // Particles & Floating Texts
  for (const pt of W22.particles) {
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.font = 'bold 10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  for (const ft of W22.floatTexts) {
    ctx.fillStyle = '#000'; ctx.fillText(ft.text, ft.x + 2, ft.y + 2);
    ctx.fillStyle = ft.color; ctx.fillText(ft.text, ft.x, ft.y);
  }

  ctx.restore(); // end world space

  // =========================================================================
  // 3. STAMPEDE KLAXON WARNING BANNER & MISSING-PAPERS REMINDER
  // =========================================================================
  if (W22.stampede.warnT > 0) {
    ctx.save();
    const blink = Math.floor(W22.time * 12) % 2 === 0;
    ctx.fillStyle = blink ? 'rgba(185, 28, 28, 0.94)' : 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(85, 68, 790, 42);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.strokeRect(85, 68, 790, 42);
    const arrow = W22.stampede.dir < 0 ? '◀◀◀' : '▶▶▶';
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText(`${arrow} ${L.w22StampedeWarn} ${arrow}`, 480, 94);
    ctx.restore();
  }

  if (W22.needPapersBannerT > 0) {
    const missing = Math.max(0, W22.requiredPapers - W22.papers);
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(150, 122, 660, 44);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(150, 122, 660, 44);
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.fillText(L.w22NeedPapers.replace('{n}', String(missing)), 480, 149);
    ctx.restore();
  }

  // =========================================================================
  // 4. MATCHING 16-BIT SNES HUD BAR (WITH LIVE PAPER SHEET COUNTER!)
  // =========================================================================
  ctx.fillStyle = 'rgba(10, 8, 24, 0.92)'; ctx.fillRect(0, 0, 960, 56);
  ctx.fillStyle = '#facc15'; ctx.fillRect(0, 54, 960, 3);

  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'left'; ctx.fillStyle = '#facc15';
  ctx.fillText('BRAYAN', 16, 23);
  let hearts = '';
  for (let i = 0; i < P.maxHp; i++) hearts += (i < P.hp ? '♥ ' : '♡ ');
  ctx.fillStyle = '#ef4444'; ctx.fillText(hearts, 16, 45);

  ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.fillText(`${L.w22Hud} [${STATE.mode === 'light' ? L.modeBadgeLight : L.modeBadgeHeavy}]`, 480, 22);
  const prog = Math.max(0, Math.min(1, P.x / GOAL_X));
  ctx.fillStyle = '#1e293b'; ctx.fillRect(340, 32, 280, 12);
  ctx.fillStyle = hasEnough ? '#22c55e' : '#38bdf8';
  ctx.fillRect(342, 34, Math.floor(276 * prog), 8);
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(340, 32, 280, 12);

  ctx.textAlign = 'right'; ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${L.statScore} ${String(W22.score).padStart(6, '0')}`, 944, 24);
  ctx.fillStyle = hasEnough ? '#4ade80' : '#fef08a';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText(`📄${W22.papers}/${W22.requiredPapers} KO:${W22.koCount}`, 944, 45);

  if (W22.fadeIn > 0) {
    ctx.fillStyle = `rgba(18, 12, 46, ${W22.fadeIn})`;
    ctx.fillRect(0, 0, 960, 540);
  }
  ctx.restore();
}
