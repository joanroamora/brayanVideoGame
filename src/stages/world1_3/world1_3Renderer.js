import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { IMGS } from '../../core/assets.js';
import { drawGroundShadow, drawFlippedSprite } from '../../core/renderer.js';
import { WORLD_1_3_CONFIG } from './levelData.js';

/**
 * Draws a dynamic passing 16-bit Red Articulated TransMilenio or Green Alimentador
 * cruising along the Portal Sur busway lane behind the boarding platform.
 */
function drawPortalBus(ctx, bus, sx) {
  ctx.save();
  if (bus.type === 'transmi') {
    const y = 374;
    // Articulated red TransMilenio body
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sx - 2, y - 2, 224, 52);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(sx, y, 102, 48);
    ctx.fillRect(sx + 116, y, 104, 48);
    // Black accordion joint
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sx + 102, y + 2, 14, 44);
    ctx.fillStyle = '#475569';
    ctx.fillRect(sx + 106, y + 2, 2, 44);
    ctx.fillRect(sx + 111, y + 2, 2, 44);
    // White roof accent & windows
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(sx, y, 102, 5);
    ctx.fillRect(sx + 116, y, 104, 5);
    ctx.fillStyle = '#bae6fd';
    for (let i = 0; i < 3; i++) ctx.fillRect(sx + 8 + i * 30, y + 10, 22, 16);
    for (let i = 0; i < 3; i++) ctx.fillRect(sx + 124 + i * 30, y + 10, 22, 16);
    // Route LED badge
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 12, y + 30, 38, 12);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(bus.route, sx + 15, y + 39);
    // Wheels
    ctx.fillStyle = '#09090b';
    ctx.fillRect(sx + 20, y + 44, 18, 10);
    ctx.fillRect(sx + 118, y + 44, 18, 10);
    ctx.fillRect(sx + 186, y + 44, 18, 10);
  } else {
    const y = 382;
    // Green Alimentador feeder bus
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sx - 2, y - 2, 134, 44);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(sx, y, 130, 40);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(sx, y + 24, 130, 4);
    ctx.fillStyle = '#e0f2fe';
    for (let i = 0; i < 4; i++) ctx.fillRect(sx + 8 + i * 29, y + 6, 22, 14);
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 8, y + 29, 36, 9);
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 6px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(bus.route, sx + 10, y + 36);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(sx + 18, y + 36, 16, 10);
    ctx.fillRect(sx + 94, y + 36, 16, 10);
  }
  ctx.restore();
}

/**
 * Draws a foreground Portal Sur metal turnstile + yellow safety railing prop.
 */
function drawTurnstileProp(ctx, tx, ty) {
  ctx.save();
  // Yellow side barrier
  ctx.fillStyle = '#000';
  ctx.fillRect(tx - 24, ty + 10, 26, 44);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(tx - 22, ty + 12, 22, 6);
  ctx.fillRect(tx - 20, ty + 18, 4, 34);
  ctx.fillRect(tx - 11, ty + 18, 4, 34);
  ctx.fillRect(tx - 22, ty + 46, 22, 6);

  // Stainless steel turnstile housing
  ctx.fillStyle = '#000';
  ctx.fillRect(tx, ty, 32, 54);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(tx + 2, ty + 2, 28, 50);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(tx + 4, ty + 4, 10, 46);
  // Red/green reader indicator + tripod arm
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(tx + 12, ty + 8, 8, 5);
  ctx.fillStyle = '#334155';
  ctx.fillRect(tx + 26, ty + 18, 16, 5);
  ctx.fillRect(tx + 24, ty + 24, 10, 14);
  ctx.restore();
}

export function renderWorld1_3(ctx, W3) {
  const L = t();
  const cam = W3.camX;
  const GROUND_Y = WORLD_1_3_CONFIG.groundY;
  const GOAL_X = WORLD_1_3_CONFIG.goalX;

  ctx.save();
  if (W3.shakeTime > 0) {
    const m = W3.shakeTime * 14;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }

  // 1. Sky backdrop & 16-Bit Portal Sur Parallax Background
  ctx.fillStyle = '#3482ad';
  ctx.fillRect(0, 0, 960, 540);

  const bg = IMGS[WORLD_1_3_CONFIG.bgKey];
  if (bg && bg.height > 0) {
    const bgY = 44;
    const bgH = GROUND_Y - bgY + 4;
    const bgW = Math.round(bg.width * (bgH / bg.height));
    const scrollX = -((cam * 0.30) % bgW);
    for (let ox = scrollX - bgW; ox < 960 + bgW; ox += bgW) {
      ctx.drawImage(bg, Math.round(ox), bgY, bgW, bgH);
    }
  }

  // 2. Dynamic Red Articulated Buses & Green Alimentadores in Portal Sur Busway
  for (const bus of W3.bgBuses) {
    const sx = bus.x - cam * 0.58;
    if (sx < -260 || sx > 1100) continue;
    drawPortalBus(ctx, bus, Math.round(sx));
  }

  // Subtle lower depth glaze for crystal-clear sprite contrast
  const glaze = ctx.createLinearGradient(0, GROUND_Y - 56, 0, GROUND_Y);
  glaze.addColorStop(0, 'rgba(15, 23, 42, 0)');
  glaze.addColorStop(1, 'rgba(15, 23, 42, 0.25)');
  ctx.fillStyle = glaze;
  ctx.fillRect(0, GROUND_Y - 56, 960, 56);

  // 3. WORLD SPACE OBJECTS (translate by -cam)
  ctx.save();
  ctx.translate(-Math.round(cam), 0);

  // Bilingual hanging "PORTAL SUR" pixel signs spaced along the terminal canopy
  for (let sx = 460; sx < WORLD_1_3_CONFIG.levelLen - 500; sx += 1550) {
    if (sx + 300 < cam || sx - 300 > cam + 960) continue;
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sx - 138, 66, 276, 26);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 138, 66, 276, 26);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(sx - 136, 68, 20, 22);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('T', sx - 126, 84);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.fillText(L.w3SignMain, sx + 10, 82);
    ctx.restore();
  }

  // Portal Sur Boarding Platform Floor (Yellow safety line + tactile dots + slate stone pavers)
  const startTile = Math.floor((cam - 64) / 64) * 64;
  ctx.fillStyle = '#0f172a'; ctx.fillRect(cam - 20, GROUND_Y - 2, 1000, 4);
  ctx.fillStyle = '#facc15'; ctx.fillRect(cam - 20, GROUND_Y, 1000, 6);
  ctx.fillStyle = '#475569'; ctx.fillRect(cam - 20, GROUND_Y + 6, 1000, 14);
  // Tactile safety strip dots
  ctx.fillStyle = '#1e293b';
  for (let x = startTile; x < cam + 1000; x += 12) {
    ctx.fillRect(x + 2, GROUND_Y + 9, 4, 4);
    ctx.fillRect(x + 6, GROUND_Y + 14, 4, 4);
  }
  // Dark slate & warm granite Portal Sur tiles
  ctx.fillStyle = '#1e293b'; ctx.fillRect(cam - 20, GROUND_Y + 20, 1000, 68);
  for (let x = startTile; x < cam + 1000; x += 64) {
    const alt = ((Math.round(x / 64) % 2) === 0);
    ctx.fillStyle = alt ? '#52525b' : '#645c52';
    ctx.fillRect(x + 2, GROUND_Y + 23, 60, 26);
    ctx.fillStyle = alt ? '#645c52' : '#4b5563';
    ctx.fillRect(x - 28, GROUND_Y + 52, 60, 26);
  }

  // Turnstile Props (where Colados leap over!)
  for (const ts of W3.turnstiles) {
    if (ts.x + 60 < cam || ts.x - 60 > cam + 960) continue;
    drawTurnstileProp(ctx, ts.x, ts.y);
  }

  // Playable Mario-style Platforms (Portal Sur themed!)
  for (const pl of W3.platforms) {
    if (pl.x + pl.w < cam - 40 || pl.x > cam + 1000) continue;
    ctx.fillStyle = '#000';
    ctx.fillRect(pl.x - 2, pl.y - 2, pl.w + 4, pl.h + 4);

    if (pl.style === 'alimentador') {
      // Green Alimentador Roof!
      ctx.fillStyle = '#16a34a'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(pl.x, pl.y, pl.w, 5);
      ctx.fillStyle = '#fde047'; ctx.fillRect(pl.x, pl.y + pl.h - 4, pl.w, 4);
      ctx.fillStyle = '#dcfce7'; ctx.fillRect(pl.x + 14, pl.y - 6, 32, 6); // rooftop AC unit
      ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText(`ALIM ${pl.label || '10-4'}`, pl.x + pl.w / 2, pl.y + 16);
    } else if (pl.style === 'troncal') {
      // Red TransMilenio Articulated Bus Roof!
      ctx.fillStyle = '#dc2626'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(pl.x, pl.y, pl.w, 5);
      ctx.fillStyle = '#facc15'; ctx.fillRect(pl.x, pl.y + pl.h - 4, pl.w, 4);
      ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText(`TRANSMI ${pl.label || 'B14'}`, pl.x + pl.w / 2, pl.y + 16);
    } else if (pl.style === 'overpass') {
      // Elevated Steel Pedestrian Bridge Truss
      ctx.fillStyle = '#475569'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#facc15'; ctx.fillRect(pl.x, pl.y, pl.w, 4);
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
      for (let gx = pl.x + 4; gx < pl.x + pl.w - 14; gx += 18) {
        ctx.beginPath();
        ctx.moveTo(gx, pl.y + 5);
        ctx.lineTo(gx + 14, pl.y + pl.h - 2);
        ctx.stroke();
      }
    } else if (pl.style === 'booth') {
      // Exposed concrete & TuLlave booth roof
      ctx.fillStyle = '#9ca3af'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#0ea5e9'; ctx.fillRect(pl.x, pl.y, pl.w, 5);
      ctx.fillStyle = '#1e293b'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText('TULLAVE', pl.x + pl.w / 2, pl.y + 17);
    } else {
      // High turnstile / yellow railing bar
      ctx.fillStyle = '#eab308'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#1e293b';
      for (let sx = 10; sx < pl.w - 8; sx += 20) ctx.fillRect(pl.x + sx, pl.y + 4, 6, pl.h - 8);
    }
  }

  // Goal Archway: META 1-3 — SALIDA PORTAL SUR
  if (GOAL_X > cam - 160 && GOAL_X < cam + 1100) {
    ctx.fillStyle = '#334155'; ctx.fillRect(GOAL_X, 224, 16, GROUND_Y - 224);
    ctx.fillRect(GOAL_X + 132, 224, 16, GROUND_Y - 224);
    ctx.fillStyle = '#dc2626'; ctx.fillRect(GOAL_X - 12, 192, 172, 46);
    ctx.fillStyle = '#0f172a'; ctx.fillRect(GOAL_X - 7, 197, 162, 36);
    ctx.fillStyle = '#facc15'; ctx.font = 'bold 10px "Press Start 2P", monospace'; ctx.textAlign = 'center';
    ctx.fillText(L.w3GoalLabel, GOAL_X + 74, 214);
    ctx.fillStyle = '#4ade80'; ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText(L.w3GoalSub, GOAL_X + 74, 228);

    // Waving Colombia flag on top of Portal Sur exit arch
    const wave = Math.sin(W3.time * 6) * 3;
    ctx.fillStyle = '#FCD116'; ctx.fillRect(GOAL_X + 74, 152 + wave, 46, 12);
    ctx.fillStyle = '#003893'; ctx.fillRect(GOAL_X + 74, 164 + wave, 46, 6);
    ctx.fillStyle = '#CE1126'; ctx.fillRect(GOAL_X + 74, 170 + wave, 46, 6);
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(GOAL_X + 71, 148, 4, 46);
  }

  // Allied NPC: Cantante Callejero de TransMilenio (with pulsing LED speaker & coin toss arc!)
  for (const sg of W3.singers) {
    if (sg.x + 150 < cam || sg.x - 120 > cam + 960) continue;
    const spr = IMGS.cantante_transmi;
    if (spr && spr.height > 0) {
      const sh = 122;
      const sw = spr.width * (sh / spr.height);
      const bob = Math.abs(Math.sin(W3.time * (sg.grooveT > 0 ? 11 : 5))) * (sg.grooveT > 0 ? -5 : -2);
      const dx = sg.x;
      const dy = GROUND_Y - sh + 4 + bob;

      drawGroundShadow(ctx, dx + sw * 0.5, GROUND_Y + 3, sw * 0.46, 8);
      // Pulsing RGB neon speaker glow behind his rolling speaker
      const ledPulse = 0.28 + Math.abs(Math.sin(W3.time * 7)) * 0.35;
      ctx.save();
      ctx.fillStyle = `rgba(56, 189, 248, ${ledPulse})`;
      ctx.beginPath();
      ctx.arc(dx + sw * 0.28, dy + sh * 0.72, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.drawImage(spr, dx, dy, sw, sh);

      // Animated gold coin arcing from Brayan into the singer's cap!
      if (sg.coinArcT > 0) {
        const cf = 1 - sg.coinArcT / 0.65;
        const cx = W3.player.x + 20 + ((dx + 16) - (W3.player.x + 20)) * cf;
        const cy = (W3.player.y + 40) + ((GROUND_Y - 12) - (W3.player.y + 40)) * cf - Math.sin(cf * Math.PI) * 58;
        ctx.fillStyle = '#000'; ctx.fillRect(cx - 6, cy - 6, 12, 12);
        ctx.fillStyle = '#facc15'; ctx.fillRect(cx - 4, cy - 4, 8, 8);
        ctx.fillStyle = '#fef9c3'; ctx.fillRect(cx - 2, cy - 2, 3, 3);
      }

      if (sg.bubbleT > 0) {
        const msg = sg.bubbleT > 1.6 ? L.w3SingerGreet : L.w3SingerThanks;
        ctx.save();
        ctx.font = '8px "Press Start 2P", monospace';
        const tw = Math.max(150, ctx.measureText(msg).width + 20);
        const gx = dx + sw * 0.5;
        const bx = gx - tw / 2;
        const by = dy - 32;
        ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, tw, 24);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(bx, by, tw, 24);
        ctx.fillStyle = '#111'; ctx.textAlign = 'center';
        ctx.fillText(msg, gx, by + 16);
        ctx.restore();
      }
    }
  }

  // Collectibles (Hojas de Vida, Tintos & Golden TuLlave Cards)
  for (const it of W3.items) {
    if (it.got || it.x < cam - 30 || it.x > cam + 990) continue;
    const bob = Math.sin(W3.time * 4.5 + it.x * 0.02) * 5;
    if (it.type === 'cv') {
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 11, it.y - 14 + bob, 22, 26);
      ctx.fillStyle = '#fef3c7'; ctx.fillRect(it.x - 9, it.y - 12 + bob, 18, 22);
      ctx.fillStyle = '#2563eb'; ctx.fillRect(it.x - 6, it.y - 7 + bob, 12, 3);
      ctx.fillStyle = '#64748b'; ctx.fillRect(it.x - 6, it.y - 1 + bob, 10, 2);
      ctx.fillRect(it.x - 6, it.y + 4 + bob, 12, 2);
    } else if (it.type === 'token') {
      // Golden TuLlave Transit Card
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 14, it.y - 10 + bob, 28, 20);
      ctx.fillStyle = '#22c55e'; ctx.fillRect(it.x - 12, it.y - 8 + bob, 24, 16);
      ctx.fillStyle = '#facc15'; ctx.fillRect(it.x - 10, it.y - 5 + bob, 9, 7);
      ctx.fillStyle = '#fff'; ctx.fillRect(it.x + 2, it.y - 4 + bob, 7, 3);
      ctx.fillRect(it.x + 2, it.y + 1 + bob, 5, 3);
    } else {
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 10, it.y - 8 + bob, 20, 20);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(it.x - 8, it.y - 6 + bob, 16, 16);
      ctx.fillStyle = '#451a03'; ctx.fillRect(it.x - 7, it.y - 5 + bob, 14, 5);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(it.x - 4, it.y - 13 + bob, 2, 5);
      ctx.fillRect(it.x + 2, it.y - 15 + bob, 2, 6);
    }
  }

  // Enemies: El Jefe del Fruver & Los 3 Colados Bogotanos!
  for (const e of W3.enemies) {
    if (!e.alive || e.x + e.w < cam - 180 || e.x > cam + 1140) continue;

    if (e.type === 'fruver') {
      const isWhip = (e.state === 'whip');
      const spr = isWhip ? IMGS.fruver_whip : IMGS.fruver_walk;
      if (spr && spr.height > 0) {
        const targetH = isWhip ? 106 : 110;
        const sw = spr.width * (targetH / spr.height);
        const yBob = e.state === 'walk' ? Math.abs(Math.sin(e.animT * 9)) * -4 : 0;
        // Anchor his body cleanly even when wide whip sprite extends forward!
        const dx = isWhip
          ? (e.facing > 0 ? e.x - 10 : e.x + e.w - sw + 10)
          : (e.x + e.w / 2 - sw / 2);
        const dy = e.y + e.h - targetH + 2 + yBob;

        drawGroundShadow(ctx, e.x + e.w / 2, e.y + e.h + 2, 28, 6);
        drawFlippedSprite(ctx, spr, dx, dy, sw, targetH, e.facing);

        // Telegraph warning mark during windup!
        if (e.state === 'windup') {
          ctx.save();
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(e.x + e.w / 2 - 9, dy - 22, 18, 18);
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 12px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('!', e.x + e.w / 2 + 1, dy - 8);
          ctx.restore();
        }
      }
    } else if (e.type === 'colado') {
      if (e.state === 'lurk') continue;
      let spr = IMGS.colado_1;
      if (e.state === 'vault' || e.variant === 2) spr = IMGS.colado_2_vault;
      else if (e.variant === 3) spr = IMGS.colado_3;

      if (spr && spr.height > 0) {
        const targetH = 98;
        const sw = spr.width * (targetH / spr.height);
        const yBob = e.state === 'sprint' ? Math.abs(Math.sin(e.animT * 15)) * -5 : 0;
        const dx = e.x + e.w / 2 - sw / 2;
        const dy = e.y + e.h - targetH + 2 + yBob;

        if (e.y >= GROUND_Y - e.h - 4) {
          drawGroundShadow(ctx, e.x + e.w / 2, GROUND_Y + 2, 26, 6);
        }
        drawFlippedSprite(ctx, spr, dx, dy, sw, targetH, e.facing);
      }
    }
  }

  // Player: Brayan 16-Bit
  const P = W3.player;
  if (P.invuln <= 0 || Math.floor(W3.time * 18) % 2 === 0) {
    let bSpr = IMGS.brayan_idle;
    if (!P.onGround) bSpr = IMGS.brayan_walk2;
    else if (P.vx !== 0) bSpr = P.walkFrame === 0 ? IMGS.brayan_walk1 : IMGS.brayan_walk2;

    if (bSpr && bSpr.height > 0) {
      const bh = 102;
      const bw = bSpr.width * (bh / bSpr.height);
      const bx = P.x + P.w / 2 - bw / 2;
      const by = P.y + P.h - bh + 2;
      if (P.onGround) drawGroundShadow(ctx, P.x + P.w / 2, P.y + P.h + 2, 22, 6);
      drawFlippedSprite(ctx, bSpr, bx, by, bw, bh, P.facing);
    }
  }

  // Particles, Floating Musical Notes & Floating Texts
  for (const pt of W3.particles) {
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.font = 'bold 14px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  for (const n of W3.musicNotes) {
    ctx.fillStyle = '#000'; ctx.fillText(n.glyph, n.x + 2, n.y + 2);
    ctx.fillStyle = n.color; ctx.fillText(n.glyph, n.x, n.y);
  }
  ctx.font = 'bold 10px "Press Start 2P", monospace';
  for (const ft of W3.floatTexts) {
    ctx.fillStyle = '#000'; ctx.fillText(ft.text, ft.x + 2, ft.y + 2);
    ctx.fillStyle = ft.color; ctx.fillText(ft.text, ft.x, ft.y);
  }

  ctx.restore(); // end world space

  // 4. MATCHING 16-BIT SNES HUD BAR
  ctx.fillStyle = 'rgba(10, 8, 24, 0.90)'; ctx.fillRect(0, 0, 960, 56);
  ctx.fillStyle = '#facc15'; ctx.fillRect(0, 54, 960, 3);

  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'left'; ctx.fillStyle = '#facc15';
  ctx.fillText('BRAYAN', 16, 23);
  let hearts = '';
  for (let i = 0; i < P.maxHp; i++) hearts += (i < P.hp ? '♥ ' : '♡ ');
  ctx.fillStyle = '#ef4444'; ctx.fillText(hearts, 16, 45);

  ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.fillText(`${L.w3Hud} [${STATE.mode === 'light' ? L.modeBadgeLight : L.modeBadgeHeavy}]`, 480, 22);
  const prog = Math.max(0, Math.min(1, P.x / GOAL_X));
  ctx.fillStyle = '#1e293b'; ctx.fillRect(340, 32, 280, 12);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(342, 34, Math.floor(276 * prog), 8);
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(340, 32, 280, 12);

  ctx.textAlign = 'right'; ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${L.statScore} ${String(W3.score).padStart(6, '0')}`, 944, 24);
  ctx.fillStyle = '#fef08a'; ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText(`KO:${W3.stompedCount} ♪:${W3.singerCount} ★:${W3.tokenCount}`, 944, 45);

  if (W3.fadeIn > 0) {
    ctx.fillStyle = `rgba(18, 12, 46, ${W3.fadeIn})`;
    ctx.fillRect(0, 0, 960, 540);
  }
  ctx.restore();
}
