import { STATE } from '../../core/gameState.js';
import { t } from '../../config/i18n.js';
import { IMGS } from '../../core/assets.js';
import { drawGroundShadow, drawFlippedSprite } from '../../core/renderer.js';
import { WORLD_1_4_CONFIG } from './levelData.js';

export function renderWorld1_4(ctx, W4) {
  const L = t();
  const cam = W4.camX;
  const GROUND_Y = WORLD_1_4_CONFIG.groundY;
  const ARENA_X = WORLD_1_4_CONFIG.arenaX;

  ctx.save();
  if (W4.shakeTime > 0) {
    const m = W4.shakeTime * 15;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }

  // =========================================================================
  // 1. BACKGROUND: PHASE 1 BOSA PIAMONTE vs PHASE 2 CANCHA DE MICROFÚTBOL
  // =========================================================================
  if (W4.phase === 'STREET') {
    ctx.fillStyle = '#336b8e';
    ctx.fillRect(0, 0, 960, 540);
    const bg = IMGS[WORLD_1_4_CONFIG.bgStreetKey];
    if (bg && bg.height > 0) {
      const bgY = 44;
      const bgH = GROUND_Y - bgY + 4;
      const bgW = Math.round(bg.width * (bgH / bg.height));
      const scrollX = -((cam * 0.34) % bgW);
      for (let ox = scrollX - bgW; ox < 960 + bgW; ox += bgW) {
        ctx.drawImage(bg, Math.round(ox), bgY, bgW, bgH);
      }
    }
  } else {
    // Locked Boss Arena: 16-bit Cancha de Microfútbol de Bosa Piamonte!
    const arenaBg = IMGS[WORLD_1_4_CONFIG.bgArenaKey];
    if (arenaBg && arenaBg.height > 0) {
      ctx.drawImage(arenaBg, 0, 44, 960, 496);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 960, 540);
    }
  }

  // =========================================================================
  // 2. WORLD SPACE OBJECTS (translate by -cam)
  // =========================================================================
  ctx.save();
  ctx.translate(-Math.round(cam), 0);

  // Phase 1 Asphalt Street & Curb (Phase 2 uses the Cancha's painted concrete floor!)
  if (W4.phase === 'STREET') {
    const startTile = Math.floor((cam - 64) / 64) * 64;
    ctx.fillStyle = '#1e293b'; ctx.fillRect(cam - 20, GROUND_Y - 2, 1000, 4);
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(cam - 20, GROUND_Y, 1000, 10);
    ctx.fillStyle = '#334155'; ctx.fillRect(cam - 20, GROUND_Y + 10, 1000, 78);
    // Dashed street lane line & cracks
    ctx.fillStyle = '#eab308';
    for (let x = startTile; x < cam + 1000; x += 96) {
      ctx.fillRect(x + 12, GROUND_Y + 44, 46, 5);
    }
    ctx.fillStyle = '#1e293b';
    for (let x = startTile; x < cam + 1000; x += 64) {
      ctx.fillRect(x, GROUND_Y, 2, 10);
    }

    // Cancha Entrance Gate Archway at x = ARENA_X
    if (ARENA_X > cam - 100 && ARENA_X < cam + 1040) {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(ARENA_X - 8, 220, 16, GROUND_Y - 220);
      ctx.fillStyle = '#facc15'; ctx.fillRect(ARENA_X - 58, 198, 128, 30);
      ctx.fillStyle = '#0f172a'; ctx.fillRect(ARENA_X - 54, 202, 120, 22);
      ctx.fillStyle = '#facc15'; ctx.font = 'bold 7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
      ctx.fillText('CANCHA BOSS ▶', ARENA_X + 6, 217);
    }
  }

  // Phase 1 Playable Platforms (Stalls, Alimentadores, Bicitaxis, Dumpsters, Breakables & Shelters!)
  if (W4.phase === 'STREET') {
    for (const pl of W4.platforms) {
      if (!pl.alive || pl.x + pl.w < cam - 40 || pl.x > cam + 1000) continue;

      if (pl.style === 'shelter') {
        // Commercial Shop Safe Roof (blocks helicopter fire!)
        // Subtle vertical support posts so it looks like a real shop awning you can duck under!
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.fillRect(pl.x + 8, pl.y + pl.h, 6, GROUND_Y - (pl.y + pl.h));
        ctx.fillRect(pl.x + pl.w - 14, pl.y + pl.h, 6, GROUND_Y - (pl.y + pl.h));

        ctx.fillStyle = '#000'; ctx.fillRect(pl.x - 2, pl.y - 2, pl.w + 4, pl.h + 4);
        for (let sx = 0; sx < pl.w; sx += 18) {
          ctx.fillStyle = (sx / 18) % 2 === 0 ? '#dc2626' : '#fef3c7';
          ctx.fillRect(pl.x + sx, pl.y, Math.min(18, pl.w - sx), pl.h);
        }
        ctx.fillStyle = '#0284c7'; ctx.fillRect(pl.x, pl.y, pl.w, 5);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(pl.x + pl.w / 2 - 58, pl.y + 6, 116, 13);
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 6px "Press Start 2P", monospace'; ctx.textAlign = 'center';
        ctx.fillText(`🛡 ${pl.label || L.w4ShelterTag}`, pl.x + pl.w / 2, pl.y + 15);
      } else if (pl.style === 'breakable') {
        // Green polisombra / wooden construction block DESTROYED by helicopter!
        ctx.fillStyle = '#000'; ctx.fillRect(pl.x - 2, pl.y - 2, pl.w + 4, pl.h + 4);
        ctx.fillStyle = '#b45309'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
        ctx.fillStyle = '#16a34a'; ctx.fillRect(pl.x + 4, pl.y + 3, pl.w - 8, 7);
        ctx.strokeStyle = '#451a03'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pl.x + 4, pl.y + 4); ctx.lineTo(pl.x + pl.w - 4, pl.y + pl.h - 4);
        ctx.moveTo(pl.x + pl.w - 4, pl.y + 4); ctx.lineTo(pl.x + 4, pl.y + pl.h - 4);
        ctx.stroke();
      } else if (pl.style === 'alimentador') {
        // Stranded Green Feeder Bus with blinking orange hazard lights!
        ctx.fillStyle = '#000'; ctx.fillRect(pl.x - 2, pl.y - 2, pl.w + 4, pl.h + 4);
        ctx.fillStyle = '#15803d'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(pl.x, pl.y, pl.w, 5);
        ctx.fillStyle = '#facc15'; ctx.fillRect(pl.x, pl.y + pl.h - 4, pl.w, 4);
        if (Math.floor(W4.time * 4) % 2 === 0) {
          ctx.fillStyle = '#fb923c';
          ctx.fillRect(pl.x + 4, pl.y + 8, 8, 8);
          ctx.fillRect(pl.x + pl.w - 12, pl.y + 8, 8, 8);
        }
        ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P", monospace'; ctx.textAlign = 'center';
        ctx.fillText(`ALIM ${pl.label || '10-3'}`, pl.x + pl.w / 2, pl.y + 17);
      } else if (pl.style === 'bicitaxi') {
        // Classic Bosa covered Bicitaxi canopy!
        ctx.fillStyle = '#000'; ctx.fillRect(pl.x - 2, pl.y - 2, pl.w + 4, pl.h + 4);
        ctx.fillStyle = '#2563eb'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
        ctx.fillStyle = '#facc15'; ctx.fillRect(pl.x, pl.y, pl.w, 6);
        ctx.fillStyle = '#fff'; ctx.font = '6px "Press Start 2P", monospace'; ctx.textAlign = 'center';
        ctx.fillText('BICITAXI', pl.x + pl.w / 2, pl.y + 17);
      } else if (pl.style === 'dumpster') {
        // Street trash container
        ctx.fillStyle = '#000'; ctx.fillRect(pl.x - 2, pl.y - 2, pl.w + 4, pl.h + 4);
        ctx.fillStyle = '#166534'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(pl.x, pl.y, pl.w, 6);
        ctx.fillStyle = '#22c55e'; ctx.fillRect(pl.x + 12, pl.y + 10, pl.w - 24, 4);
      } else {
        // Street vendor stall ('stall')
        ctx.fillStyle = '#000'; ctx.fillRect(pl.x - 2, pl.y - 2, pl.w + 4, pl.h + 4);
        ctx.fillStyle = '#0284c7'; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
        ctx.fillStyle = '#facc15'; ctx.fillRect(pl.x, pl.y, pl.w, 5);
        ctx.fillStyle = '#fff'; ctx.fillRect(pl.x + 6, pl.y + 10, pl.w - 12, 4);
      }
    }
  }

  // Items (Empanadas & CVs)
  for (const it of W4.items) {
    if (it.got || it.x < cam - 30 || it.x > cam + 990) continue;
    const bob = Math.sin(W4.time * 4.5 + it.x * 0.02) * 5;
    if (it.type === 'cv') {
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 11, it.y - 14 + bob, 22, 26);
      ctx.fillStyle = '#fef3c7'; ctx.fillRect(it.x - 9, it.y - 12 + bob, 18, 22);
      ctx.fillStyle = '#2563eb'; ctx.fillRect(it.x - 6, it.y - 7 + bob, 12, 3);
    } else {
      // Golden crispy Colombian Empanada!
      ctx.fillStyle = '#000'; ctx.fillRect(it.x - 14, it.y - 9 + bob, 28, 18);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(it.x - 12, it.y - 7 + bob, 24, 14);
      ctx.fillStyle = '#fef08a'; ctx.fillRect(it.x - 8, it.y - 5 + bob, 16, 5);
    }
  }

  // Ground Airstrike Target Reticles (during Boss Airstrikes)
  for (const tg of W4.airTargets) {
    ctx.save();
    const pulse = Math.floor(W4.time * 16) % 2 === 0;
    ctx.strokeStyle = pulse ? '#ef4444' : '#facc15';
    ctx.lineWidth = 3;
    ctx.strokeRect(tg.x - 18, GROUND_Y - 10, 36, 12);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.fillRect(tg.x - 16, GROUND_Y - 8, 32, 8);
    ctx.restore();
  }

  // Temporary Fire Zones (from Molotovs)
  for (const f of W4.fires) {
    ctx.save();
    for (let fx = 0; fx < f.w; fx += 12) {
      const fh = 14 + Math.abs(Math.sin(W4.time * 16 + fx)) * 16;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(f.x + fx, GROUND_Y - fh, 10, fh);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(f.x + fx + 2, GROUND_Y - fh * 0.72, 6, fh * 0.72);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(f.x + fx + 3, GROUND_Y - fh * 0.38, 4, fh * 0.38);
    }
    ctx.restore();
  }

  // Phase 1 Ground Enemies: Los Capuchos
  if (W4.phase === 'STREET') {
    for (const c of W4.capuchos) {
      if (!c.alive || c.x + c.w < cam - 100 || c.x > cam + 1060) continue;
      const spr = IMGS.capucho_molotov;
      if (spr && spr.height > 0) {
        const th = 102;
        const tw = spr.width * (th / spr.height);
        const yBob = c.throwAnim > 0 ? -4 : Math.abs(Math.sin(c.animT * 8)) * -3;
        const dx = c.x + c.w / 2 - tw / 2;
        const dy = GROUND_Y - th + 2 + yBob;
        drawGroundShadow(ctx, c.x + c.w / 2, GROUND_Y + 2, 24, 6);
        drawFlippedSprite(ctx, spr, dx, dy, tw, th, c.facing);
      }
    }
  }

  // Phase 2 Boss Character (in Cancha de Piamonte!)
  const B = W4.boss;
  if (B.active && B.state !== 'defeated') {
    const spr = IMGS.boss_francia;
    if (spr && spr.height > 0) {
      const bh = 128;
      const bw = spr.width * (bh / spr.height);
      const bob = B.state === 'charge' ? Math.abs(Math.sin(W4.time * 22)) * -5
        : B.state === 'vulnerable' ? Math.sin(W4.time * 10) * 2 : 0;
      const bx = B.x + B.w / 2 - bw / 2;
      const by = B.y + B.h - bh + 2 + bob;

      drawGroundShadow(ctx, B.x + B.w / 2, GROUND_Y + 3, 36, 9);
      ctx.save();
      if (B.hitFlash > 0 && Math.floor(W4.time * 30) % 2 === 0) {
        ctx.filter = 'brightness(2.4)';
      }
      // boss_francia naturally faces LEFT -> flip when facing > 0 (right)!
      drawFlippedSprite(ctx, spr, bx, by, bw, bh, -B.facing);
      ctx.restore();

      // Charge telegraph red ! or Vulnerable sweat mark
      if (B.state === 'charge_warn') {
        ctx.fillStyle = '#ef4444'; ctx.fillRect(B.x + B.w / 2 - 11, by - 26, 22, 22);
        ctx.fillStyle = '#fef08a'; ctx.font = 'bold 14px "Press Start 2P", monospace'; ctx.textAlign = 'center';
        ctx.fillText('!', B.x + B.w / 2 + 1, by - 9);
      } else if (B.state === 'vulnerable') {
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 8px "Press Start 2P", monospace'; ctx.textAlign = 'center';
        ctx.fillText('▼ ¡ATACA! ▼', B.x + B.w / 2, by - 12);
      }

      if (B.shoutT > 0 && B.shoutText) {
        ctx.save();
        ctx.font = 'bold 9px "Press Start 2P", monospace';
        const tw = Math.max(130, ctx.measureText(B.shoutText).width + 20);
        const sx = B.x + B.w / 2;
        ctx.fillStyle = '#fef08a'; ctx.fillRect(sx - tw / 2, by - 40, tw, 24);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeRect(sx - tw / 2, by - 40, tw, 24);
        ctx.fillStyle = '#111'; ctx.textAlign = 'center';
        ctx.fillText(B.shoutText, sx, by - 24);
        ctx.restore();
      }
    }
  }

  // Player: Brayan 16-Bit (Idle / Walk / Crouch-Shield / Briefcase Swing!)
  const P = W4.player;
  if (P.invuln <= 0 || Math.floor(W4.time * 18) % 2 === 0) {
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

      // Golden lawyer briefcase shield aura when crouching!
      if (P.crouching) {
        ctx.fillStyle = '#000'; ctx.fillRect(P.x - 4, P.y - 6, P.w + 8, 12);
        ctx.fillStyle = '#78350f'; ctx.fillRect(P.x - 2, P.y - 4, P.w + 4, 8);
        ctx.fillStyle = '#facc15'; ctx.fillRect(P.x + P.w / 2 - 4, P.y - 2, 8, 4);
      }
      // Golden melee impact slash arc when swinging briefcase!
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
  for (const bc of W4.briefcases) {
    ctx.save();
    ctx.translate(bc.x, bc.y);
    ctx.rotate(bc.rot);
    ctx.fillStyle = '#000'; ctx.fillRect(-16, -12, 32, 24);
    ctx.fillStyle = '#78350f'; ctx.fillRect(-14, -10, 28, 20);
    ctx.fillStyle = '#92400e'; ctx.fillRect(-12, -8, 24, 7);
    ctx.fillStyle = '#facc15'; ctx.fillRect(-4, -2, 8, 5); // brass clasp
    ctx.restore();
  }

  // Flying Molotov Bottles
  for (const m of W4.molotovs) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.rot);
    ctx.fillStyle = '#000'; ctx.fillRect(-7, -11, 14, 22);
    ctx.fillStyle = '#15803d'; ctx.fillRect(-5, -5, 10, 14);
    ctx.fillStyle = '#f97316'; ctx.fillRect(-4, -15, 8, 8);
    ctx.fillStyle = '#fef08a'; ctx.fillRect(-2, -13, 4, 5);
    ctx.restore();
  }

  // Helicopter Aerial Projectiles ("DECRETO" / "SOBRECOSTO" glowing bolts!)
  for (const s of W4.heliShots) {
    ctx.save();
    ctx.fillStyle = '#000'; ctx.fillRect(s.x - 14, s.y - 11, 28, 22);
    ctx.fillStyle = '#dc2626'; ctx.fillRect(s.x - 12, s.y - 9, 24, 18);
    ctx.fillStyle = '#fef08a'; ctx.fillRect(s.x - 9, s.y - 6, 18, 12);
    ctx.fillStyle = '#b91c1c'; ctx.font = 'bold 6px "Press Start 2P", monospace'; ctx.textAlign = 'center';
    ctx.fillText('$$', s.x, s.y + 3);
    ctx.restore();
  }

  // Boss Horizontal Sonic Speech Waves ("¡DE MALAS!")
  for (const sw of W4.speechWaves) {
    ctx.save();
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    const tw = Math.max(96, ctx.measureText(sw.text).width + 20);
    ctx.fillStyle = '#dc2626'; ctx.fillRect(sw.x - tw / 2 - 3, sw.y - 19, tw + 6, 38);
    ctx.fillStyle = '#fef08a'; ctx.fillRect(sw.x - tw / 2, sw.y - 16, tw, 32);
    ctx.fillStyle = '#111'; ctx.textAlign = 'center';
    ctx.fillText(sw.text, sw.x, sw.y + 4);
    ctx.restore();
  }

  // Aerial Helicopter Boss Sprite (drawn above platforms & buildings!)
  const H = W4.heli;
  const hSpr = IMGS.helicopter_boss;
  if (hSpr && hSpr.height > 0 && H.y > -110) {
    const hh = 118;
    const hw = hSpr.width * (hh / hSpr.height);
    const hx = H.x - hw / 2;
    const hy = H.y - hh / 2;
    // helicopter_boss.png naturally faces LEFT -> flip when facing > 0!
    drawFlippedSprite(ctx, hSpr, hx, hy, hw, hh, -H.facing);
  }

  // Particles & Floating Texts
  for (const pt of W4.particles) {
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.font = 'bold 10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  for (const ft of W4.floatTexts) {
    ctx.fillStyle = '#000'; ctx.fillText(ft.text, ft.x + 2, ft.y + 2);
    ctx.fillStyle = ft.color; ctx.fillText(ft.text, ft.x, ft.y);
  }

  ctx.restore(); // end world space

  // =========================================================================
  // 3. BOSS WARNING BANNER (PHASE 2 INTRO)
  // =========================================================================
  if (W4.phase === 'BOSS_INTRO') {
    ctx.save();
    const blink = Math.floor(W4.time * 7) % 2 === 0;
    ctx.fillStyle = blink ? 'rgba(185, 28, 28, 0.92)' : 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(110, 230, 740, 46);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4;
    ctx.strokeRect(110, 230, 740, 46);
    ctx.fillStyle = '#fef08a'; ctx.font = 'bold 13px "Press Start 2P", monospace'; ctx.textAlign = 'center';
    ctx.fillText(L.w4BossWarning, 480, 260);
    ctx.restore();
  }

  // =========================================================================
  // 4. MATCHING 16-BIT SNES HUD BAR + BOSS HP BAR!
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
  const hudTitle = (W4.phase === 'STREET') ? L.w4Hud : L.w4HudBoss;
  ctx.fillText(`${hudTitle} [${STATE.mode === 'light' ? L.modeBadgeLight : L.modeBadgeHeavy}]`, 480, 22);

  if (W4.phase === 'STREET') {
    const prog = Math.max(0, Math.min(1, P.x / ARENA_X));
    ctx.fillStyle = '#1e293b'; ctx.fillRect(340, 32, 280, 12);
    ctx.fillStyle = '#f97316'; ctx.fillRect(342, 34, Math.floor(276 * prog), 8);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(340, 32, 280, 12);
  } else {
    // BOSS HEALTH BAR (with 1/3 and 2/3 airstrike phase ticks!)
    const hpFrac = Math.max(0, Math.min(1, B.hp / B.maxHp));
    ctx.fillStyle = '#1e293b'; ctx.fillRect(310, 31, 340, 15);
    ctx.fillStyle = hpFrac > 0.34 ? '#ef4444' : '#facc15';
    ctx.fillRect(312, 33, Math.floor(336 * hpFrac), 11);
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.strokeRect(310, 31, 340, 15);
    // 1/3 and 2/3 phase divider ticks
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(310 + 113, 31, 2, 15);
    ctx.fillRect(310 + 226, 31, 2, 15);
  }

  ctx.textAlign = 'right'; ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${L.statScore} ${String(W4.score).padStart(6, '0')}`, 944, 24);
  ctx.fillStyle = '#fef08a'; ctx.font = '10px "Press Start 2P", monospace';
  ctx.fillText(W4.phase === 'STREET' ? `KO:${W4.capuchosKo} 💼` : `BOSS HP:${B.hp}/${B.maxHp}`, 944, 45);

  if (W4.fadeIn > 0) {
    ctx.fillStyle = `rgba(18, 12, 46, ${W4.fadeIn})`;
    ctx.fillRect(0, 0, 960, 540);
  }
  ctx.restore();
}
