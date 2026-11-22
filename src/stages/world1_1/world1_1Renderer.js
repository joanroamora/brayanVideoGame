import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { IMGS } from '../../core/assets.js';
import { drawGroundShadow, drawFlippedSprite } from '../../core/renderer.js';
import { WORLD_1_1_CONFIG } from './levelData.js';

export function renderWorld1_1(ctx, W1) {
  const L = t();
  const cam = W1.camX;
  const GROUND_Y = WORLD_1_1_CONFIG.groundY;
  const GOAL_X = WORLD_1_1_CONFIG.goalX;

  ctx.save();
  if (W1.shakeTime > 0) {
    const m = W1.shakeTime * 14;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }

  // 1. Sky backdrop behind HUD & 16-Bit Carrera 7ª Panoramic Background Asset
  ctx.fillStyle = '#3482ad';
  ctx.fillRect(0, 0, 960, 540);

  const bg = IMGS[WORLD_1_1_CONFIG.bgKey];
  if (bg && bg.height > 0) {
    const bgY = 46;
    const bgH = GROUND_Y - bgY + 4;
    const bgW = Math.round(bg.width * (bgH / bg.height));
    const scrollX = -((cam * 0.34) % bgW);
    for (let ox = scrollX - bgW; ox < 960 + bgW; ox += bgW) {
      ctx.drawImage(bg, Math.round(ox), bgY, bgW, bgH);
    }
    // Subtle lower-curb depth glaze so foreground sprites & platforms pop cleanly
    const glaze = ctx.createLinearGradient(0, GROUND_Y - 58, 0, GROUND_Y);
    glaze.addColorStop(0, 'rgba(20, 16, 14, 0)');
    glaze.addColorStop(1, 'rgba(20, 16, 14, 0.22)');
    ctx.fillStyle = glaze;
    ctx.fillRect(0, GROUND_Y - 58, 960, 58);
  }

  // 2. WORLD SPACE OBJECTS (translate by -cam)
  ctx.save();
  ctx.translate(-Math.round(cam), 0);

  // Persistent painted graffiti on the Carrera 7ª walls
  for (const gr of W1.graffitis) {
    if (gr.x + 120 < cam || gr.x - 40 > cam + 960) continue;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(gr.x - 4, gr.y - 14, 92, 22);
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.fillStyle = gr.color;
    ctx.textAlign = 'left';
    ctx.fillText(L.graffitiTags[gr.tagIdx % L.graffitiTags.length], gr.x, gr.y);
    ctx.restore();
  }

  // Carrera 7ª ("El Septimazo"): Stone Curb + Ciclorruta + Terracotta Adoquín Promenade
  const startTile = Math.floor((cam - 48) / 48) * 48;
  ctx.fillStyle = '#1e293b'; ctx.fillRect(cam - 20, GROUND_Y - 2, 1000, 4);
  ctx.fillStyle = '#cbd5e1'; ctx.fillRect(cam - 20, GROUND_Y, 1000, 4);

  // Ciclorruta cobblestone strip
  ctx.fillStyle = '#5e736a'; ctx.fillRect(cam - 20, GROUND_Y + 4, 1000, 18);
  ctx.fillStyle = '#4c5f57';
  for (let x = startTile; x < cam + 1000; x += 24) {
    ctx.fillRect(x, GROUND_Y + 4, 2, 18);
  }
  ctx.fillStyle = '#eab308';
  for (let x = startTile; x < cam + 1000; x += 48) {
    ctx.fillRect(x + 8, GROUND_Y + 11, 22, 3);
  }
  ctx.fillStyle = '#e2e8f0'; ctx.fillRect(cam - 20, GROUND_Y + 22, 1000, 3);

  // Terracotta brick adoquín pedestrian promenade
  ctx.fillStyle = '#3b2219'; ctx.fillRect(cam - 20, GROUND_Y + 25, 1000, 65);
  for (let x = startTile; x < cam + 1000; x += 48) {
    const alt = ((Math.round(x / 48) % 2) === 0);
    ctx.fillStyle = alt ? '#a35643' : '#944a39';
    ctx.fillRect(x + 2, GROUND_Y + 28, 44, 16);
    ctx.fillStyle = alt ? '#8f4837' : '#ab5c48';
    ctx.fillRect(x - 20, GROUND_Y + 47, 44, 16);
    ctx.fillStyle = alt ? '#a35643' : '#944a39';
    ctx.fillRect(x + 2, GROUND_Y + 66, 44, 16);
  }

  // Platforms
  for (const pl of W1.platforms) {
    if (pl.x + pl.w < cam - 40 || pl.x > cam + 1000) continue;
    ctx.fillStyle = '#000'; ctx.fillRect(pl.x - 2, pl.y - 2, pl.w + 4, pl.h + 4);
    if (pl.style === 'sitp') {
      ctx.fillStyle = '#2563eb'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#facc15'; ctx.fillRect(pl.x, pl.y, pl.w, 5);
      ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText('SITP', pl.x + pl.w / 2, pl.y + 16);
    } else if (pl.style === 'awning') {
      for (let sx = 0; sx < pl.w; sx += 16) {
        ctx.fillStyle = (sx / 16) % 2 === 0 ? '#dc2626' : '#f8fafc';
        ctx.fillRect(pl.x + sx, pl.y, Math.min(16, pl.w - sx), pl.h);
      }
    } else if (pl.style === 'balcony') {
      ctx.fillStyle = '#78350f'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(pl.x, pl.y, pl.w, 4);
    } else {
      ctx.fillStyle = '#b45309'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.strokeStyle = '#451a03'; ctx.lineWidth = 2; ctx.strokeRect(pl.x + 2, pl.y + 2, pl.w - 4, pl.h - 4);
    }
  }

  // Goal Archway: META 1-1 — PLAZA DE BOLÍVAR
  if (GOAL_X > cam - 160 && GOAL_X < cam + 1100) {
    ctx.fillStyle = '#1e293b'; ctx.fillRect(GOAL_X, 230, 14, GROUND_Y - 230);
    ctx.fillRect(GOAL_X + 120, 230, 14, GROUND_Y - 230);
    ctx.fillStyle = '#facc15'; ctx.fillRect(GOAL_X - 10, 200, 154, 42);
    ctx.fillStyle = '#1e1b4b'; ctx.fillRect(GOAL_X - 6, 204, 146, 34);
    ctx.fillStyle = '#facc15'; ctx.font = 'bold 10px "Press Start 2P", monospace'; ctx.textAlign = 'center';
    ctx.fillText(L.goalLabel, GOAL_X + 67, 220);
    ctx.fillStyle = '#38bdf8'; ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText(L.plazaLabel, GOAL_X + 67, 233);
    const wave = Math.sin(W1.time * 6) * 3;
    ctx.fillStyle = '#FCD116'; ctx.fillRect(GOAL_X + 67, 162 + wave, 44, 12);
    ctx.fillStyle = '#003893'; ctx.fillRect(GOAL_X + 67, 174 + wave, 44, 6);
    ctx.fillStyle = '#CE1126'; ctx.fillRect(GOAL_X + 67, 180 + wave, 44, 6);
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(GOAL_X + 64, 158, 4, 44);
  }

  // Allied NPC: La Señora de la Chaza
  for (const ch of W1.chazas) {
    if (ch.x + 140 < cam || ch.x - 100 > cam + 960) continue;
    const spr = IMGS.chaza_lady;
    if (spr && spr.height > 0) {
      const sh = 122;
      const sw = spr.width * (sh / spr.height);
      const dx = ch.x;
      const dy = GROUND_Y - sh + 4;
      drawGroundShadow(ctx, dx + sw * 0.5, GROUND_Y + 3, sw * 0.48, 8);
      ctx.drawImage(spr, dx, dy, sw, sh);
      if (ch.bubbleT > 0) {
        const msg = ch.bubbleT > 1.2 ? L.chazaGreet : L.chazaThanks;
        ctx.save();
        ctx.font = '8px "Press Start 2P", monospace';
        const tw = Math.max(120, ctx.measureText(msg).width + 18);
        const gx = dx + sw * 0.5;
        const bx = gx - tw / 2;
        const by = dy - 30;
        ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, tw, 24);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(bx, by, tw, 24);
        ctx.fillStyle = '#111'; ctx.textAlign = 'center';
        ctx.fillText(msg, gx, by + 16);
        ctx.restore();
      }
    }
  }

  // Collectibles (Hojas de Vida & Tintos)
  for (const it of W1.items) {
    if (it.got || it.x < cam - 30 || it.x > cam + 990) continue;
    const bob = Math.sin(W1.time * 4.5 + it.x * 0.02) * 5;
    if (it.type === 'cv') {
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 11, it.y - 14 + bob, 22, 26);
      ctx.fillStyle = '#fef3c7'; ctx.fillRect(it.x - 9, it.y - 12 + bob, 18, 22);
      ctx.fillStyle = '#2563eb'; ctx.fillRect(it.x - 6, it.y - 7 + bob, 12, 3);
      ctx.fillStyle = '#64748b'; ctx.fillRect(it.x - 6, it.y - 1 + bob, 10, 2);
      ctx.fillRect(it.x - 6, it.y + 4 + bob, 12, 2);
    } else {
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 10, it.y - 8 + bob, 20, 20);
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(it.x - 8, it.y - 6 + bob, 16, 16);
      ctx.fillStyle = '#451a03'; ctx.fillRect(it.x - 7, it.y - 5 + bob, 14, 5);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(it.x - 4, it.y - 13 + bob, 2, 5);
      ctx.fillRect(it.x + 2, it.y - 15 + bob, 2, 6);
    }
  }

  // Enemies
  for (const e of W1.enemies) {
    if (!e.alive || e.x + e.w < cam - 100 || e.x > cam + 1060) continue;
    let spr = null;
    let targetH = 104;
    let yBob = 0;

    if (e.type === 'nero') {
      spr = (e.state === 'lunge') ? IMGS.nero_lunge : IMGS.nero_walk;
      targetH = (e.state === 'lunge') ? 100 : 106;
      yBob = (e.state === 'lunge') ? 0 : Math.abs(Math.sin(e.animT * 9)) * -4;
    } else if (e.type === 'cartelera') {
      if (e.state === 'throw') spr = IMGS.act_throw;
      else spr = Math.floor(e.animT * 5) % 2 === 0 ? IMGS.act_walk1 : IMGS.act_walk2;
      targetH = 106;
    } else {
      if (e.state === 'shake') spr = Math.floor(e.animT * 14) % 2 === 0 ? IMGS.act_spray_high : IMGS.act_spray_low;
      else if (e.state === 'spray_low') spr = IMGS.act_spray_low;
      else if (e.state === 'spray_high') spr = IMGS.act_spray_high;
      else spr = Math.floor(e.animT * 5) % 2 === 0 ? IMGS.act_walk1 : IMGS.act_walk2;
      targetH = (e.state === 'spray_low' || e.state === 'spray_high') ? 96 : 104;
    }

    if (spr && spr.height > 0) {
      const sw = spr.width * (targetH / spr.height);
      const dx = e.x + e.w / 2 - sw / 2;
      const dy = GROUND_Y - targetH + 2 + yBob;
      drawGroundShadow(ctx, e.x + e.w / 2, GROUND_Y + 2, e.state === 'lunge' ? 32 : 24, 6);
      drawFlippedSprite(ctx, spr, dx, dy, sw, targetH, e.facing);
    }
  }

  // Thrown Protest Signs
  for (const pr of W1.projectiles) {
    ctx.save();
    ctx.translate(pr.x, pr.y);
    ctx.rotate(pr.rot);
    const cols = ['#ec4899', '#a855f7', '#22c55e', '#facc15'];
    ctx.fillStyle = '#000'; ctx.fillRect(-19, -14, 38, 28);
    ctx.fillStyle = '#fef3c7'; ctx.fillRect(-17, -12, 34, 24);
    ctx.fillStyle = cols[pr.motif % 4]; ctx.fillRect(-17, -12, 34, 7);
    ctx.fillStyle = '#111'; ctx.font = 'bold 5px "Press Start 2P", monospace'; ctx.textAlign = 'center';
    ctx.fillText(L.signMotifs[pr.motif % 4], 0, 7);
    ctx.restore();
  }

  // Player: Brayan 16-Bit
  const P = W1.player;
  if (P.invuln <= 0 || Math.floor(W1.time * 18) % 2 === 0) {
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

  // Particles & Floating Texts
  for (const pt of W1.particles) {
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.font = 'bold 10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  for (const ft of W1.floatTexts) {
    ctx.fillStyle = '#000'; ctx.fillText(ft.text, ft.x + 2, ft.y + 2);
    ctx.fillStyle = ft.color; ctx.fillText(ft.text, ft.x, ft.y);
  }

  ctx.restore(); // end world space

  // 3. SNES HUD BAR
  ctx.fillStyle = 'rgba(10, 8, 24, 0.88)'; ctx.fillRect(0, 0, 960, 56);
  ctx.fillStyle = '#facc15'; ctx.fillRect(0, 54, 960, 3);

  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'left'; ctx.fillStyle = '#facc15';
  ctx.fillText('BRAYAN', 16, 23);
  let hearts = '';
  for (let i = 0; i < P.maxHp; i++) hearts += (i < P.hp ? '♥ ' : '♡ ');
  ctx.fillStyle = '#ef4444'; ctx.fillText(hearts, 16, 45);

  ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.fillText(`${L.worldHud} [${STATE.mode === 'light' ? L.modeBadgeLight : L.modeBadgeHeavy}]`, 480, 22);
  const prog = Math.max(0, Math.min(1, P.x / GOAL_X));
  ctx.fillStyle = '#1e293b'; ctx.fillRect(340, 32, 280, 12);
  ctx.fillStyle = '#22c55e'; ctx.fillRect(342, 34, Math.floor(276 * prog), 8);
  ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(340, 32, 280, 12);

  ctx.textAlign = 'right'; ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${L.statScore} ${String(W1.score).padStart(6, '0')}`, 944, 24);
  ctx.fillStyle = '#fef08a'; ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText(`CV:${W1.cvCount} CHIC:${W1.chicletCount}`, 944, 45);

  if (W1.fadeIn > 0) {
    ctx.fillStyle = `rgba(18, 12, 46, ${W1.fadeIn})`;
    ctx.fillRect(0, 0, 960, 540);
  }
  ctx.restore();
}
