import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { IMGS } from '../../core/assets.js';
import { drawGroundShadow, drawFlippedSprite } from '../../core/renderer.js';
import { WORLD_2_1_CONFIG } from './levelData.js';

/**
 * Draws the giant glowing 16-bit Office Photocopier at GOAL_X (Meta 2-1!).
 */
function drawPhotocopierGoal(ctx, gx, groundY, time, scanT, L) {
  ctx.save();
  // Overhead Golden SNES Sign: META 2-1 • FOTOCOPIADORA
  ctx.fillStyle = '#334155';
  ctx.fillRect(gx + 18, 212, 8, groundY - 212);
  ctx.fillRect(gx + 132, 212, 8, groundY - 212);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(gx - 22, 174, 202, 48);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.strokeRect(gx - 22, 174, 202, 48);
  ctx.font = 'bold 10px "Press Start 2P", monospace';
  ctx.fillStyle = '#fde047';
  ctx.textAlign = 'center';
  ctx.fillText(L.w21GoalLabel, gx + 79, 195);
  ctx.font = 'bold 7px "Press Start 2P", monospace';
  ctx.fillStyle = '#4ade80';
  ctx.fillText(L.w21GoalSub, gx + 79, 212);

  // Heavy-duty Office Photocopier Chassis
  const cx = gx + 16;
  const cy = groundY - 122;
  drawGroundShadow(ctx, cx + 64, groundY + 3, 66, 9);

  // Outer pixel border
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - 3, cy - 3, 134, 125);
  // Main off-white & cool-gray copier body
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(cx, cy, 128, 118);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(cx, cy + 56, 128, 62);
  // Lower paper trays
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(cx + 12, cy + 64, 104, 18);
  ctx.fillRect(cx + 12, cy + 88, 104, 20);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx + 48, cy + 71, 32, 4);
  ctx.fillRect(cx + 48, cy + 96, 32, 4);

  // Control panel & blinking READY green LED
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx + 8, cy + 16, 44, 24);
  ctx.fillStyle = Math.floor(time * 4) % 2 === 0 ? '#22c55e' : '#86efac';
  ctx.fillRect(cx + 14, cy + 22, 10, 10);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(cx + 28, cy + 22, 18, 6);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(cx + 28, cy + 31, 18, 4);

  // Glass scanner bed + animated bright green scanning laser beam!
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx + 58, cy + 12, 62, 32);
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(cx + 61, cy + 15, 56, 26);
  // Resume sheet sitting on copier glass
  ctx.fillStyle = '#fefce8';
  ctx.fillRect(cx + 76, cy + 18, 26, 20);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(cx + 80, cy + 23, 18, 2);
  ctx.fillRect(cx + 80, cy + 28, 14, 2);
  ctx.fillRect(cx + 80, cy + 33, 16, 2);

  // Sweeping green laser scan bar!
  const scanPhase = (Math.sin((scanT > 0 ? scanT * 10 : time * 3.2)) + 1) * 0.5;
  const barX = cx + 63 + Math.round(scanPhase * 48);
  ctx.fillStyle = 'rgba(74, 222, 128, 0.85)';
  ctx.fillRect(barX, cy + 15, 5, 26);

  // Top document feeder lid
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - 2, cy - 16, 132, 15);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(cx + 1, cy - 13, 126, 10);

  // Side output tray with freshly printed CV sheet!
  ctx.fillStyle = '#475569';
  ctx.fillRect(cx - 26, cy + 44, 26, 8);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(cx - 22, cy + 36, 20, 8);

  // Pulsing golden "COPIAR AQUÍ ▼" arrow above copier
  const bob = Math.sin(time * 6) * 5;
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('▼ CV ▼', cx + 64, cy - 26 + bob);

  ctx.restore();
}

export function renderWorld2_1(ctx, W21) {
  const L = t();
  const cam = W21.camX;
  const GROUND_Y = WORLD_2_1_CONFIG.groundY;
  const GOAL_X = WORLD_2_1_CONFIG.goalX;

  ctx.save();
  if (W21.shakeTime > 0) {
    const m = W21.shakeTime * 14;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }

  // =========================================================================
  // 1. 16-BIT BOGOTÁ PUBLIC BUILDING CORRIDOR PARALLAX BACKGROUND
  // =========================================================================
  ctx.fillStyle = '#272038';
  ctx.fillRect(0, 0, 960, 540);

  const bg = IMGS[WORLD_2_1_CONFIG.bgKey];
  if (bg && bg.height > 0) {
    const bgY = 50;
    const bgH = GROUND_Y - bgY + 6;
    const bgW = Math.round(bg.width * (bgH / bg.height));
    const scrollX = -((cam * 0.36) % bgW);
    for (let ox = scrollX - bgW; ox < 960 + bgW; ox += bgW) {
      ctx.drawImage(bg, Math.round(ox), bgY, bgW, bgH);
    }
  }

  // Subtle depth glaze so histrionic sprites & projectiles pop cleanly
  const glaze = ctx.createLinearGradient(0, GROUND_Y - 52, 0, GROUND_Y);
  glaze.addColorStop(0, 'rgba(15, 23, 42, 0)');
  glaze.addColorStop(1, 'rgba(15, 23, 42, 0.22)');
  ctx.fillStyle = glaze;
  ctx.fillRect(0, GROUND_Y - 52, 960, 52);

  // =========================================================================
  // 2. WORLD SPACE OBJECTS (translate by -cam)
  // =========================================================================
  ctx.save();
  ctx.translate(-Math.round(cam), 0);

  // Hanging Hallway Directional Signs ("PASILLO DE PRENSA • FOTOCOPIAS →")
  for (let sx = 520; sx < WORLD_2_1_CONFIG.levelLen - 500; sx += 1480) {
    if (sx + 320 < cam || sx - 320 > cam + 960) continue;
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sx - 146, 68, 292, 26);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 146, 68, 292, 26);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(sx - 144, 70, 52, 22);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('● LIVE', sx - 118, 84);
    ctx.fillStyle = '#fef08a';
    ctx.fillText(L.w21SignCorridor, sx + 26, 84);
    ctx.restore();
  }

  // Polished Marble/Tile Building Corridor Floor
  const startTile = Math.floor((cam - 64) / 64) * 64;
  ctx.fillStyle = '#1e293b'; ctx.fillRect(cam - 20, GROUND_Y - 2, 1000, 4);
  ctx.fillStyle = '#ca8a04'; ctx.fillRect(cam - 20, GROUND_Y, 1000, 5); // brass corridor trim
  ctx.fillStyle = '#475569'; ctx.fillRect(cam - 20, GROUND_Y + 5, 1000, 79);
  for (let x = startTile; x < cam + 1000; x += 64) {
    const alt = ((Math.round(x / 64) % 2) === 0);
    ctx.fillStyle = alt ? '#cbd5e1' : '#94a3b8';
    ctx.fillRect(x + 2, GROUND_Y + 8, 60, 32);
    ctx.fillStyle = alt ? '#94a3b8' : '#64748b';
    ctx.fillRect(x - 28, GROUND_Y + 44, 60, 34);
    // Subtle glossy marble highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(x + 8, GROUND_Y + 12, 20, 5);
  }

  // Playable Indoor Office Platforms (Desks, Cubicles, Lighting Rigs, Sofas, Printers!)
  for (const pl of W21.platforms) {
    if (pl.x + pl.w < cam - 40 || pl.x > cam + 1000) continue;
    ctx.fillStyle = '#000';
    ctx.fillRect(pl.x - 2, pl.y - 2, pl.w + 4, pl.h + 4);

    if (pl.style === 'desk') {
      // Polished mahogany press/executive desk + mini monitor bump
      ctx.fillStyle = '#78350f'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#b45309'; ctx.fillRect(pl.x, pl.y, pl.w, 6);
      ctx.fillStyle = '#facc15'; ctx.fillRect(pl.x, pl.y + pl.h - 4, pl.w, 4);
      ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText(pl.label || 'PRENSA', pl.x + pl.w / 2, pl.y + 17);
    } else if (pl.style === 'cubicle') {
      // Office cubicle wall & steel file cabinet top
      ctx.fillStyle = '#334155'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(pl.x, pl.y, pl.w, 5);
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(pl.x + 6, pl.y + 8, pl.w - 12, pl.h - 12);
      ctx.fillStyle = '#0f172a'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText(pl.label || 'BODEGA', pl.x + pl.w / 2, pl.y + 17);
    } else if (pl.style === 'lighting') {
      // Elevated Black Aluminum YouTube Lighting Truss with glowing LED bulbs!
      ctx.fillStyle = '#18181b'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#ec4899'; ctx.fillRect(pl.x, pl.y, pl.w, 4);
      for (let lx = pl.x + 12; lx < pl.x + pl.w - 10; lx += 22) {
        ctx.fillStyle = (Math.floor(W21.time * 5 + lx) % 2 === 0) ? '#fef08a' : '#38bdf8';
        ctx.fillRect(lx, pl.y + 8, 8, 6);
      }
      ctx.fillStyle = '#f8fafc'; ctx.font = '6px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText(pl.label || 'LIVE', pl.x + pl.w / 2, pl.y + 16);
    } else if (pl.style === 'printer') {
      // White-gray office paper & toner cart
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(pl.x, pl.y, pl.w, 5);
      ctx.fillStyle = '#1e293b'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText(pl.label || 'COPIAS', pl.x + pl.w / 2, pl.y + 17);
    } else {
      // Leather waiting-room sofa bench
      ctx.fillStyle = '#7f1d1d'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#b91c1c'; ctx.fillRect(pl.x + 4, pl.y + 3, pl.w - 8, 8);
      ctx.fillStyle = '#450a0a';
      for (let sx = 32; sx < pl.w - 16; sx += 44) ctx.fillRect(pl.x + sx, pl.y + 3, 3, pl.h - 6);
    }
  }

  // Goal Station: LA FOTOCOPIADORA GIGANTE
  if (GOAL_X > cam - 220 && GOAL_X < cam + 1140) {
    drawPhotocopierGoal(ctx, GOAL_X, GROUND_Y, W21.time, W21.copyScanT, L);
  }

  // Allied NPC: Doña Martha — La Señora de los Tintos de la Oficina!
  for (const tl of W21.tintoLadies) {
    if (tl.x + 150 < cam || tl.x - 120 > cam + 960) continue;
    const spr = IMGS.tinto_lady || IMGS.chaza_lady;
    if (spr && spr.height > 0) {
      const sh = 122;
      const sw = spr.width * (sh / spr.height);
      const bob = Math.sin(W21.time * 4) * (tl.smileT > 0 ? -3 : -1);
      const dx = tl.x;
      const dy = GROUND_Y - sh + 4 + bob;
      drawGroundShadow(ctx, dx + sw * 0.5, GROUND_Y + 3, sw * 0.45, 8);
      ctx.drawImage(spr, dx, dy, sw, sh);

      if (tl.bubbleT > 0) {
        const msg = tl.bubbleT > 1.7 ? L.w21TintoGreet : L.w21TintoThanks;
        ctx.save();
        ctx.font = '8px "Press Start 2P", monospace';
        const tw = Math.max(175, ctx.measureText(msg).width + 20);
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

  // Collectibles (Hojas de Vida, Monedas de $500 para fotocopias, Tintos)
  for (const it of W21.items) {
    if (it.got || it.x < cam - 30 || it.x > cam + 990) continue;
    const bob = Math.sin(W21.time * 4.5 + it.x * 0.02) * 5;
    if (it.type === 'cv') {
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 11, it.y - 14 + bob, 22, 26);
      ctx.fillStyle = '#fef3c7'; ctx.fillRect(it.x - 9, it.y - 12 + bob, 18, 22);
      ctx.fillStyle = '#2563eb'; ctx.fillRect(it.x - 6, it.y - 7 + bob, 12, 3);
      ctx.fillStyle = '#64748b'; ctx.fillRect(it.x - 6, it.y - 1 + bob, 10, 2);
      ctx.fillRect(it.x - 6, it.y + 4 + bob, 12, 2);
    } else if (it.type === 'coin') {
      // Colombian $500 bi-metallic coin for photocopies!
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 11, it.y - 11 + bob, 22, 22);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(it.x - 9, it.y - 9 + bob, 18, 18);
      ctx.fillStyle = '#eab308'; ctx.fillRect(it.x - 6, it.y - 6 + bob, 12, 12);
      ctx.fillStyle = '#fef08a'; ctx.fillRect(it.x - 3, it.y - 3 + bob, 4, 4);
    } else {
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 10, it.y - 8 + bob, 20, 20);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(it.x - 8, it.y - 6 + bob, 16, 16);
      ctx.fillStyle = '#451a03'; ctx.fillRect(it.x - 7, it.y - 5 + bob, 14, 5);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(it.x - 4, it.y - 13 + bob, 2, 5);
      ctx.fillRect(it.x + 2, it.y - 15 + bob, 2, 6);
    }
  }

  // Temporary Stinky Toxic Mud Puddles on Floor
  for (const pd of W21.puddles) {
    ctx.save();
    ctx.fillStyle = '#451a03';
    ctx.fillRect(pd.x, GROUND_Y - 8, pd.w, 10);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(pd.x + 4, GROUND_Y - 11, pd.w - 8, 8);
    ctx.fillStyle = '#84cc16';
    for (let sx = 6; sx < pd.w - 10; sx += 16) {
      const sy = Math.abs(Math.sin(W21.time * 8 + sx)) * 12;
      ctx.fillRect(pd.x + sx, GROUND_Y - 14 - sy, 4, 6);
    }
    ctx.restore();
  }

  // Blinding Selfie Camera Flash Cones (Lalis!)
  for (const fc of W21.flashCones) {
    ctx.save();
    const alpha = Math.min(0.85, (fc.life / fc.maxLife) * 0.9);
    const tipX = fc.x + fc.dir * fc.reach;
    const grad = ctx.createLinearGradient(fc.x, fc.y, tipX, fc.y);
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(0.55, `rgba(244, 114, 182, ${alpha * 0.65})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(fc.x, fc.y - 10);
    ctx.lineTo(tipX, fc.y - 46);
    ctx.lineTo(tipX, fc.y + 46);
    ctx.lineTo(fc.x, fc.y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // =========================================================================
  // ENEMIES: LEVY, WALLY BALLENA, LALIS SELFIE, PAPARAZZI CÁMARA, STREAMER
  // =========================================================================
  for (const e of W21.enemies) {
    if (!e.alive || e.x + e.w < cam - 160 || e.x > cam + 1140) continue;

    let spr = IMGS.bodeguero_camara;
    let targetH = 104;
    let drawDir = -e.facing; // Most generated sprites naturally face LEFT

    if (e.type === 'levy') {
      spr = IMGS.bodeguero_levy;
      targetH = 108;
      drawDir = e.facing; // bodeguero_levy naturally faces RIGHT!
    } else if (e.type === 'wally') {
      spr = IMGS.bodeguero_wally;
      targetH = e.state === 'puff' ? 124 : 116;
      drawDir = -e.facing;
    } else if (e.type === 'lalis') {
      spr = IMGS.bodeguero_lalis;
      targetH = 110;
      drawDir = -e.facing;
    } else if (e.type === 'streamer') {
      spr = IMGS.bodeguero_streamer;
      targetH = 104;
      drawDir = -e.facing;
    }

    if (spr && spr.height > 0) {
      const sw = spr.width * (targetH / spr.height);
      const isTelegraph = (e.state === 'rage' || e.state === 'puff' || e.state === 'pose' || e.state === 'snap_warn' || e.state === 'windup');
      const jitterX = (e.type === 'levy' && e.state === 'rage') ? Math.sin(W21.time * 55) * 3 : 0;
      const yBob = isTelegraph ? -4 : Math.abs(Math.sin(e.animT * (e.type === 'wally' ? 7 : 10))) * -4;
      const dx = e.x + e.w / 2 - sw / 2 + jitterX;
      const dy = e.y + e.h - targetH + 2 + yBob;

      drawGroundShadow(ctx, e.x + e.w / 2, e.y + e.h + 2, e.type === 'wally' ? 36 : 26, 7);

      ctx.save();
      if (e.type === 'levy' && e.state === 'rage') {
        ctx.filter = 'saturate(1.7) brightness(1.12)';
      }
      drawFlippedSprite(ctx, spr, dx, dy, sw, targetH, drawDir);
      ctx.restore();

      // Tiny sensationalist YouTube/Live badge over each bodeguero when telegraphing/attacking!
      if (isTelegraph || e.state === 'attack' || e.state === 'spout' || e.state === 'flash') {
        ctx.save();
        const tag = e.type === 'levy' ? '🤬 LIVE'
          : e.type === 'wally' ? '🐋 OPINA'
          : e.type === 'lalis' ? '📸 SELFIE'
          : e.type === 'camara' ? '📷 FLASH!' : '🔴 URGENTE';
        ctx.font = 'bold 7px "Press Start 2P", monospace';
        const tw = Math.max(66, ctx.measureText(tag).width + 12);
        const tx = e.x + e.w / 2 - tw / 2;
        const ty = dy - 22;
        ctx.fillStyle = e.type === 'wally' ? '#0284c7' : '#dc2626';
        ctx.fillRect(tx, ty, tw, 16);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, tw, 16);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(tag, e.x + e.w / 2, ty + 11);
        ctx.restore();
      }
    }
  }

  // =========================================================================
  // PLAYER: BRAYAN 16-BIT (IDLE / WALK / CROUCH / BRIEFCASE SWING!)
  // =========================================================================
  const P = W21.player;
  if (P.invuln <= 0 || Math.floor(W21.time * 18) % 2 === 0) {
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

      // Golden melee slash arc when swatting bodegueros / toxic sludge
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
  for (const bc of W21.briefcases) {
    ctx.save();
    ctx.translate(bc.x, bc.y);
    ctx.rotate(bc.rot);
    ctx.fillStyle = '#000'; ctx.fillRect(-16, -12, 32, 24);
    ctx.fillStyle = '#78350f'; ctx.fillRect(-14, -10, 28, 20);
    ctx.fillStyle = '#92400e'; ctx.fillRect(-12, -8, 24, 7);
    ctx.fillStyle = '#facc15'; ctx.fillRect(-4, -2, 8, 5);
    ctx.restore();
  }

  // =========================================================================
  // PROJECTILES (CURSES, WHALE SPOUTS, TOXIC MUD BOMBS, FLASHES, FUNA ORBS)
  // =========================================================================
  for (const pr of W21.projectiles) {
    ctx.save();
    if (pr.kind === 'curse') {
      // Levy's furious red-yellow censored swearing banner!
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      const tw = Math.max(82, ctx.measureText(pr.text).width + 16);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(pr.x - tw / 2 - 3, pr.y - 16, tw + 6, 32);
      ctx.fillStyle = '#dc2626'; ctx.fillRect(pr.x - tw / 2, pr.y - 13, tw, 26);
      ctx.fillStyle = '#fef08a'; ctx.textAlign = 'center';
      ctx.fillText(pr.text, pr.x, pr.y + 4);
    } else if (pr.kind === 'spout') {
      // Wally Ballena's whale blowhole blue-water & clickbait splat!
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.rot || 0);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-13, -13, 26, 26);
      ctx.fillStyle = '#0284c7'; ctx.fillRect(-11, -11, 22, 22);
      ctx.fillStyle = '#bae6fd'; ctx.fillRect(-8, -8, 12, 9);
      ctx.fillStyle = '#78350f'; ctx.fillRect(-3, 0, 10, 8); // sensationalist mud inside spout!
    } else if (pr.kind === 'funa') {
      // Lalis's toxic neon-pink selfie/funa orb!
      ctx.fillStyle = '#0f172a'; ctx.fillRect(pr.x - 14, pr.y - 14, 28, 28);
      ctx.fillStyle = '#ec4899'; ctx.fillRect(pr.x - 12, pr.y - 12, 24, 24);
      ctx.fillStyle = '#fbcfe8'; ctx.fillRect(pr.x - 8, pr.y - 8, 16, 16);
      ctx.fillStyle = '#be185d'; ctx.font = 'bold 9px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText('#!', pr.x, pr.y + 4);
    } else if (pr.kind === 'flash_shot') {
      // Paparazzi blinding white-yellow camera flash starburst!
      ctx.fillStyle = '#facc15';
      ctx.fillRect(pr.x - 16, pr.y - 5, 32, 10);
      ctx.fillRect(pr.x - 5, pr.y - 16, 10, 32);
      ctx.fillStyle = '#fff';
      ctx.fillRect(pr.x - 9, pr.y - 9, 18, 18);
    } else {
      // Messy brown-green toxic "MIERDA" mud bomb!
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.rot || 0);
      ctx.fillStyle = '#1c1917'; ctx.fillRect(-13, -11, 26, 22);
      ctx.fillStyle = '#78350f'; ctx.fillRect(-11, -8, 22, 17);
      ctx.fillStyle = '#92400e'; ctx.fillRect(-7, -11, 14, 7);
      ctx.fillStyle = '#84cc16'; ctx.fillRect(-4, -14, 6, 4); // toxic stink glob
      ctx.fillStyle = '#fef08a'; ctx.fillRect(-5, -3, 3, 3);
      ctx.fillRect(3, -3, 3, 3);
    }
    ctx.restore();
  }

  // Particles & Floating Texts
  for (const pt of W21.particles) {
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.font = 'bold 10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  for (const ft of W21.floatTexts) {
    ctx.fillStyle = '#000'; ctx.fillText(ft.text, ft.x + 2, ft.y + 2);
    ctx.fillStyle = ft.color; ctx.fillText(ft.text, ft.x, ft.y);
  }

  ctx.restore(); // end world space

  // Brief paparazzi camera flash screen tint!
  if (W21.cameraFlashAlpha > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${W21.cameraFlashAlpha})`;
    ctx.fillRect(0, 0, 960, 540);
  }

  // =========================================================================
  // 3. MATCHING 16-BIT SNES HUD BAR
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
  ctx.fillText(`${L.w21Hud} [${STATE.mode === 'light' ? L.modeBadgeLight : L.modeBadgeHeavy}]`, 480, 22);
  const prog = Math.max(0, Math.min(1, P.x / GOAL_X));
  ctx.fillStyle = '#1e293b'; ctx.fillRect(340, 32, 280, 12);
  ctx.fillStyle = '#ec4899'; ctx.fillRect(342, 34, Math.floor(276 * prog), 8);
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(340, 32, 280, 12);

  ctx.textAlign = 'right'; ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${L.statScore} ${String(W21.score).padStart(6, '0')}`, 944, 24);
  ctx.fillStyle = '#fef08a'; ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText(`KO:${W21.koCount} $:${W21.coinCount} ☕:${W21.tintoCount}`, 944, 45);

  if (W21.fadeIn > 0) {
    ctx.fillStyle = `rgba(18, 12, 46, ${W21.fadeIn})`;
    ctx.fillRect(0, 0, 960, 540);
  }
  ctx.restore();
}
