import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { IMGS } from '../../core/assets.js';
import { drawGroundShadow, drawFlippedSprite } from '../../core/renderer.js';
import { WORLD_2_4_CONFIG } from './levelData.js';

export function renderWorld2_4(ctx, W24) {
  const {
    panelW: PANEL_W,
    groundY: GROUND_Y,
    homeDoorX: HOME_X,
    storeDoorX: STORE_X,
    bgPanels: BG_PANELS
  } = WORLD_2_4_CONFIG;
  const L = t();
  const P = W24.player;
  const camX = Math.round(W24.camX);

  ctx.save();
  if (W24.shakeTime > 0) {
    const m = W24.shakeTime * 14;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }

  // =========================================================================
  // 1. CONTINUOUS NON-REPEATING 6-PANEL BOSA LA ESPERANZA STREETSCAPE (5,760px!)
  // =========================================================================
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(0, 0, 960, 540);

  for (let idx = 0; idx < BG_PANELS.length; idx++) {
    const drawX = idx * PANEL_W - camX;
    if (drawX + PANEL_W < -10 || drawX > 970) continue;
    const img = IMGS[BG_PANELS[idx]];
    if (img && img.height > 0) {
      // Render cleanly below top HUD bar (y=54..540)
      ctx.drawImage(img, 0, 0, img.width, img.height, drawX, 46, PANEL_W + 2, 494);
    }
    // Soft seamless sidewalk blend between consecutive real Bosa La Esperanza blocks
    if (idx > 0 && drawX > -28 && drawX < 988) {
      const seam = ctx.createLinearGradient(drawX - 20, 0, drawX + 20, 0);
      seam.addColorStop(0, 'rgba(15, 23, 42, 0)');
      seam.addColorStop(0.5, 'rgba(15, 23, 42, 0.22)');
      seam.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = seam;
      ctx.fillRect(drawX - 20, 46, 40, 494);
    }
  }

  // Crisp curb shadow anchoring sidewalk gameplay lane
  ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.fillRect(0, GROUND_Y + 2, 960, 5);

  // =========================================================================
  // 2. GOAL MARKERS (TIENDA LA ESPERANZA ON OUTBOUND / INTERIOR 92 ON RETURN!)
  // =========================================================================
  const bob = Math.sin(W24.time * 6) * 5;
  if (W24.phase === 'TO_STORE') {
    const sx = STORE_X - camX;
    if (sx > -120 && sx < 1080) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(sx - 96, 206 + bob, 192, 34);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx - 96, 206 + bob, 192, 34);
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.fillStyle = '#4ade80';
      ctx.textAlign = 'center';
      ctx.fillText(L.w24StoreMarker, sx, 228 + bob);
    }
  } else {
    const hx = HOME_X - camX;
    if (hx > -120 && hx < 1080) {
      // Glowing green welcome beacon over Interior 92 front door!
      ctx.fillStyle = `rgba(74, 222, 128, ${0.18 + Math.sin(W24.time * 6) * 0.08})`;
      ctx.fillRect(hx - 28, 316, 56, 152);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(hx - 98, 222 + bob, 196, 36);
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.strokeRect(hx - 98, 222 + bob, 196, 36);
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText(L.w24HomeMarker, hx, 245 + bob);
    }
  }

  // =========================================================================
  // 3. PLATFORMS (SAFE LEDGES, PARK BENCHES, SUV ROOFS, FRUVER CRATES!)
  // =========================================================================
  for (const pl of W24.platforms) {
    const sx = pl.x - camX;
    if (sx + pl.w < -20 || sx > 980) continue;

    if (pl.style === 'suv_white' || pl.style === 'suv_black') {
      // Subtle highlight line along top of the real parked SUVs in esperanza4.png so players know they can jump on them!
      ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.fillRect(sx + 10, pl.y, pl.w - 20, 4);
      ctx.font = 'bold 7px "Press Start 2P", monospace';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('▲', sx + pl.w * 0.5, pl.y - 6);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx - 2, pl.y - 2, pl.w + 4, pl.h + 4);
      ctx.fillStyle = pl.style === 'crate' ? '#b45309'
        : pl.style === 'awning' ? '#dc2626'
        : pl.style === 'park' ? '#2563eb'
        : '#64748b';
      ctx.fillRect(sx, pl.y, pl.w, pl.h);
      ctx.fillStyle = pl.style === 'crate' ? '#f59e0b'
        : pl.style === 'awning' ? '#facc15'
        : '#cbd5e1';
      ctx.fillRect(sx + 2, pl.y + 2, pl.w - 4, 4);
      // Support legs down to sidewalk
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx + 10, pl.y + pl.h, 8, GROUND_Y - (pl.y + pl.h));
      ctx.fillRect(sx + pl.w - 18, pl.y + pl.h, 8, GROUND_Y - (pl.y + pl.h));
    }
  }

  // Slippery soap puddles swept by vecinas
  for (const hz of W24.hazards) {
    const sx = hz.x - camX;
    if (sx + hz.w < -20 || sx > 980) continue;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.52)';
    ctx.beginPath();
    ctx.ellipse(sx + hz.w * 0.5, GROUND_Y - 2, hz.w * 0.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
    ctx.fillRect(sx + 14, GROUND_Y - 4, 18, 2);
    ctx.fillRect(sx + hz.w - 28, GROUND_Y - 2, 12, 2);
  }

  // =========================================================================
  // 4. PICKUPS (Coins $500 & Fresh Pan from Panadería Pau Pan R.D.!)
  // =========================================================================
  for (const pk of W24.pickups) {
    if (pk.got) continue;
    const sx = pk.x - camX;
    if (sx < -40 || sx > 1000) continue;
    const py = pk.y + Math.sin(W24.time * 5 + pk.x * 0.03) * 5;
    if (pk.type === 'pan') {
      // Golden Pau Pan pandebono / almojábana healing pickup!
      ctx.fillStyle = '#0f172a'; ctx.fillRect(sx - 14, py - 11, 28, 22);
      ctx.fillStyle = '#d97706'; ctx.fillRect(sx - 12, py - 9, 24, 18);
      ctx.fillStyle = '#fde68a'; ctx.fillRect(sx - 9, py - 6, 18, 8);
      ctx.fillStyle = '#4ade80'; ctx.font = 'bold 7px "Press Start 2P", monospace';
      ctx.textAlign = 'center'; ctx.fillText('+♥', sx, py - 16);
    } else {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(sx - 11, py - 11, 22, 22);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(sx - 9, py - 9, 18, 18);
      ctx.fillStyle = '#eab308'; ctx.fillRect(sx - 6, py - 6, 12, 12);
    }
  }

  // =========================================================================
  // 5. ENEMIES (CHASING STRAY DOGS, BOSA BICITAXIS, VECINAS & SOCCER BALLS!)
  // =========================================================================
  for (const en of W24.enemies) {
    if (!en.alive) continue;
    const sx = en.x - camX;
    if (sx < -160 || sx > 1120) continue;

    let spr = IMGS.perro_barrio;
    let th = 56;
    if (en.kind === 'dog_chaser') {
      spr = en.dark ? IMGS.perro_barrio_2 : IMGS.perro_barrio;
      th = 58;
    } else if (en.kind === 'bicitaxi') {
      spr = IMGS.bicitaxi_bosa;
      th = 104;
    } else if (en.kind === 'vecina') {
      spr = IMGS.vecina_barrio;
      th = 106;
    } else if (en.kind === 'ball') {
      spr = IMGS.balon_barrio;
      th = 38;
    }

    if (spr && spr.height > 0) {
      const tw = Math.round(spr.width * (th / spr.height));
      const runBob = (en.kind === 'dog_chaser' && en.aggro && en.onGround)
        ? -Math.abs(Math.sin(en.animT * 18)) * 8
        : (en.kind === 'bicitaxi' ? Math.sin(en.animT * 24) * 2 : 0);

      drawGroundShadow(ctx, sx, GROUND_Y + 2, tw * 0.36, 6);
      ctx.save();
      if (en.stunT > 0) ctx.globalAlpha = 0.55;
      if (en.kind === 'ball') {
        ctx.translate(Math.round(sx), Math.round(en.y - th * 0.5));
        ctx.rotate(en.animT * 9 * en.dir);
        ctx.drawImage(spr, -tw / 2, -th / 2, tw, th);
      } else {
        // Enemy sprites naturally face LEFT (dir = -1 -> normal; dir = +1 -> flip horizontally!)
        const flipDir = en.dir > 0 ? -1 : 1;
        drawFlippedSprite(ctx, spr, Math.round(sx - tw * 0.5), Math.round(en.y - th + runBob), tw, th, flipDir);
      }

      // Angry "!" chase alert above chasing stray dogs!
      if (en.kind === 'dog_chaser' && en.aggro && en.stunT <= 0) {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(sx - 9, en.y - th - 24 + runBob, 18, 18);
        ctx.font = 'bold 10px "Press Start 2P", monospace';
        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText('!', sx, en.y - th - 11 + runBob);
      }
      ctx.restore();
    }
  }

  // =========================================================================
  // 6. BRAYAN EN CAMISETA DE PINTUCO, PANTALONETA Y CHANCLAS (+ BOLSA DE ALMUERZO!)
  // =========================================================================
  if (P.invuln <= 0 || Math.floor(W24.time * 18) % 2 === 0) {
    const px = Math.round(P.x - camX);
    const py = Math.round(P.y);
    const hasBag = (W24.phase === 'RETURN_HOME');
    let bSpr = IMGS.brayan_pintuco_idle;
    if (hasBag) {
      bSpr = (Math.abs(P.vx) > 20 || !P.onGround)
        ? (P.walkFrame === 0 ? IMGS.brayan_pintuco_bag1 : IMGS.brayan_pintuco_bag2)
        : IMGS.brayan_pintuco_bag1;
    } else if (Math.abs(P.vx) > 20 || !P.onGround) {
      bSpr = P.walkFrame === 0 ? IMGS.brayan_pintuco_walk1 : IMGS.brayan_pintuco_walk2;
    }

    if (bSpr && bSpr.height > 0) {
      const bh = 112;
      const bw = Math.round(bSpr.width * (bh / bSpr.height));
      drawGroundShadow(ctx, px + P.w * 0.5, GROUND_Y + 2, 22, 6);
      drawFlippedSprite(ctx, bSpr, Math.round(px + P.w * 0.5 - bw * 0.5), Math.round(py + P.h - bh + 2), bw, bh, P.facing);
    }
  }

  // Particles & Floating Texts
  for (const pt of W24.particles) {
    ctx.fillStyle = pt.color;
    ctx.fillRect(Math.round(pt.x - camX), Math.round(pt.y), pt.size, pt.size);
  }
  ctx.font = 'bold 9px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  for (const ft of W24.floatTexts) {
    const fx = Math.round(ft.x - camX);
    const fy = Math.round(ft.y);
    ctx.fillStyle = '#000'; ctx.fillText(ft.text, fx + 2, fy + 2);
    ctx.fillStyle = ft.color; ctx.fillText(ft.text, fx, fy);
  }

  // =========================================================================
  // 7. SECTOR PLAQUE + PHASE BANNER + 16-BIT SNES HUD BAR
  // =========================================================================
  const sectorIdx = Math.max(0, Math.min(BG_PANELS.length - 1, Math.floor((P.x + 22) / PANEL_W)));
  const landmarkName = L.w24Landmarks[sectorIdx] || '';
  if (landmarkName) {
    ctx.font = 'bold 8px "Press Start 2P", monospace';
    const tw = ctx.measureText(landmarkName).width + 20;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(14, 66, tw, 22);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 66, tw, 22);
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'left';
    ctx.fillText(landmarkName, 24, 81);
  }

  // Directional Objective Arrow Badge top-right below HUD
  const arrowTxt = W24.phase === 'TO_STORE' ? L.w24ArrowStore : L.w24ArrowHome;
  ctx.font = 'bold 8.5px "Press Start 2P", monospace';
  const aw = ctx.measureText(arrowTxt).width + 22;
  ctx.fillStyle = W24.phase === 'TO_STORE' ? 'rgba(21, 128, 61, 0.92)' : 'rgba(217, 119, 6, 0.94)';
  ctx.fillRect(946 - aw, 66, aw, 24);
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2;
  ctx.strokeRect(946 - aw, 66, aw, 24);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(arrowTxt, 946 - aw * 0.5, 82);

  // Big Phase Transition Toast Banner (Start & Store Purchased!)
  if (W24.bannerTimer > 0) {
    const ba = Math.min(1, W24.bannerTimer * 1.4);
    ctx.save();
    ctx.globalAlpha = ba;
    ctx.fillStyle = 'rgba(10, 14, 34, 0.92)';
    ctx.fillRect(120, 112, 720, 66);
    ctx.strokeStyle = W24.phase === 'RETURN_HOME' ? '#4ade80' : '#facc15';
    ctx.lineWidth = 3;
    ctx.strokeRect(120, 112, 720, 66);
    ctx.textAlign = 'center';
    ctx.font = 'bold 11.5px "Press Start 2P", monospace';
    ctx.fillStyle = '#fde047';
    ctx.fillText(W24.bannerText, 480, 140);
    ctx.font = 'bold 8px "Press Start 2P", monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(W24.bannerSub, 480, 163);
    ctx.restore();
  }

  // Top 16-Bit HUD Bar
  ctx.fillStyle = 'rgba(10, 8, 24, 0.92)'; ctx.fillRect(0, 0, 960, 56);
  ctx.fillStyle = '#facc15'; ctx.fillRect(0, 54, 960, 3);

  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'left'; ctx.fillStyle = '#facc15';
  ctx.fillText('BRAYAN', 16, 23);
  let hearts = '';
  for (let i = 0; i < P.maxHp; i++) hearts += (i < P.hp ? '♥ ' : '♡ ');
  ctx.fillStyle = '#ef4444'; ctx.fillText(hearts, 16, 45);

  // Round-trip Progress Bar (0..50% = Ida a la Tienda, 50..100% = Regreso a Interior 92!)
  const span = Math.max(1, STORE_X - HOME_X);
  const legProg = W24.phase === 'TO_STORE'
    ? Math.max(0, Math.min(1, (P.x - HOME_X) / span)) * 0.5
    : 0.5 + Math.max(0, Math.min(1, (STORE_X - P.x) / span)) * 0.5;

  ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.font = '9.5px "Press Start 2P", monospace';
  ctx.fillText(`${L.w24Hud} [${STATE.mode === 'light' ? L.modeBadgeLight : L.modeBadgeHeavy}]`, 460, 21);
  ctx.fillStyle = '#1e293b'; ctx.fillRect(285, 31, 350, 12);
  ctx.fillStyle = W24.phase === 'RETURN_HOME' ? '#4ade80' : '#facc15';
  ctx.fillRect(287, 33, Math.floor(346 * legProg), 8);
  // Midpoint Tienda tick mark
  ctx.fillStyle = '#ef4444'; ctx.fillRect(459, 29, 3, 16);
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(285, 31, 350, 12);

  // Right: Score + Lunch Bag Status
  ctx.textAlign = 'right'; ctx.fillStyle = '#38bdf8';
  ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText(`${L.statScore} ${String(W24.score).padStart(6, '0')}`, 944, 21);
  ctx.fillStyle = W24.phase === 'RETURN_HOME' ? '#4ade80' : '#fde047';
  ctx.font = '8.5px "Press Start 2P", monospace';
  ctx.fillText(W24.phase === 'RETURN_HOME' ? L.w24BagGot : L.w24BagNeed, 944, 43);

  if (W24.fadeIn > 0) {
    ctx.fillStyle = `rgba(12, 8, 28, ${W24.fadeIn})`;
    ctx.fillRect(0, 0, 960, 540);
  }
  ctx.restore();
}
