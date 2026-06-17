"use strict";

/* ============================================================
   PENASCO BEAUTY CENTER -- "The Blowout" animated hero
   A canvas-driven beauty-salon scene: rose-gold hair dryer
   blowing an air stream of white wisps, gold sparkles, and
   hair strands across a deep plum-to-rose gradient.
   Pure 2D canvas. Honors prefers-reduced-motion.
   ============================================================ */

(function () {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || !canvas.getContext) return;
  const ctx    = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Palette ───────────────────────────────────────────────
  const ROSE    = [184, 92,  114];
  const ROSE_LT = [224, 148, 168];
  const ROSE_DK = [92,  43,  68 ];
  const GOLD    = [201, 169, 110];
  const GOLD_LT = [240, 212, 155];
  const PLUM    = [26,  11,  21 ];
  const PLUM_MD = [58,  26,  48 ];
  const WHITE   = [255, 248, 244];
  const BLUSH   = [238, 180, 196];

  // ── State ─────────────────────────────────────────────────
  let W = 0, H = 0, DPR = 1;
  let airParts = [], stars = [], hairStrands = [];

  // ── Utils ─────────────────────────────────────────────────
  const lerp  = (a, b, t) => a + (b - a) * t;
  const mix   = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb   = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  const rgba  = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, a).toFixed(3)})`;
  const rand  = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ── Dryer geometry (re-computed each frame, cheap) ────────
  function geom() {
    const mobile = W < 700;
    const u  = clamp(Math.min(W, H) * 0.155, 38, 118);
    const cx = mobile ? W * 0.62 : W * 0.74;
    const cy = mobile ? H * 0.40 : H * 0.44;
    const bw = u * 2.1;    // barrel width
    const bh = u * 0.70;   // barrel height
    const nr = u * 0.72;   // nozzle reach (extends left from barrel left)
    const nh = u * 0.36;   // nozzle half-height at tip
    const hw = u * 0.40;   // handle width
    const hh = u * 1.15;   // handle height
    const nozzleX = cx - bw / 2 - nr;
    return { u, cx, cy, bw, bh, nr, nh, hw, hh, nozzleX };
  }

  // ── Spawners ──────────────────────────────────────────────
  function spawnAir(g, fy) {
    const spread = g.nh * 0.82;
    return {
      x:     g.nozzleX,
      y:     g.cy + fy + rand(-spread, spread),
      age:   0,
      life:  rand(0.7, 1.9),
      vx:    -rand(2.4, 5.2) * (W / 1300),
      vy:    rand(-0.12, 0.12),
      wb:    rand(0, Math.PI * 2),
      wbAmp: rand(0.06, 0.28),
      wbFq:  rand(1.4, 3.6),
      size:  rand(1.2, 4.4),
      type:  rand(0, 1) < 0.62 ? 'air' : (rand(0, 1) < 0.52 ? 'gold' : 'blush'),
    };
  }

  function spawnStar() {
    return {
      x:   rand(0, W),
      y:   rand(0, H),
      sz:  rand(1.6, 4.2),
      vx:  rand(-0.14, 0.14),
      vy:  -rand(0.1, 0.44),
      ph:  rand(0, Math.PI * 2),
      rot: rand(0, Math.PI),
      col: rand(0, 1) < 0.55 ? GOLD : ROSE_LT,
    };
  }

  function spawnStrand(g, fy) {
    return {
      x:    g.nozzleX + rand(-16, 8),
      y:    g.cy + fy + rand(-g.nh * 0.85, g.nh * 0.85),
      len:  rand(W * 0.08, W * 0.42),
      sweep: rand(-60, 60),
      prog:  rand(0, 0.35),
      spd:   rand(0.005, 0.013),
      alph:  rand(0.12, 0.4),
      lw:    rand(0.5, 1.5),
      col:   rand(0, 1) < 0.6 ? BLUSH : GOLD_LT,
    };
  }

  function build() {
    const g  = geom();
    airParts = [];
    for (let i = 0; i < 72; i++) {
      const p = spawnAir(g, 0);
      p.age   = rand(0, p.life);
      p.x     = g.nozzleX - (p.age / p.life) * W * 0.52;
      airParts.push(p);
    }
    stars = [];
    for (let i = 0; i < 38; i++) stars.push(spawnStar());
    hairStrands = [];
    for (let i = 0; i < 14; i++) hairStrands.push(spawnStrand(g, 0));
  }

  // ── Draw helpers ──────────────────────────────────────────
  function rrect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function star4(x, y, ro, ri, a) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const ang = a + (i * Math.PI) / 4;
      const r   = i % 2 === 0 ? ro : ri;
      if (i === 0) ctx.moveTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
      else ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
    }
    ctx.closePath();
  }

  // ── Air cone + wisps (drawn behind dryer) ─────────────────
  function drawAir(g, fy, t) {
    const nx    = g.nozzleX;
    const ny    = g.cy + fy;
    const nh    = g.nh;
    const cLen  = Math.min(W * 0.60, nx - 12);
    const x2    = nx - cLen;
    const spread = cLen * 0.40;

    // Soft air cone
    const cg = ctx.createLinearGradient(nx, ny, x2, ny);
    cg.addColorStop(0,    rgba(WHITE, 0.22));
    cg.addColorStop(0.28, rgba(BLUSH, 0.09));
    cg.addColorStop(1,    rgba(WHITE, 0));
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(nx, ny - nh);
    ctx.lineTo(x2, ny - spread);
    ctx.lineTo(x2, ny + spread);
    ctx.lineTo(nx, ny + nh);
    ctx.closePath();
    ctx.fill();

    // Wavy wisps
    for (let i = 0; i < 8; i++) {
      const fi    = i / 7;
      const yOff  = (fi - 0.5) * nh * 2.6;
      const ph    = t * 2.6 + i * 0.92;
      const alpha = 0.10 + 0.08 * Math.sin(t * 1.4 + i * 0.7);
      const wLen  = cLen * (0.5 + 0.38 * (0.5 + 0.5 * Math.sin(t + i)));

      ctx.save();
      ctx.strokeStyle = rgba(WHITE, alpha);
      ctx.lineWidth   = 0.9 + fi * 0.7;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(nx, ny + yOff);
      const steps = 10;
      for (let j = 1; j <= steps; j++) {
        const p  = j / steps;
        const wx = nx - p * wLen;
        const wy = ny + yOff
                    + yOff * p * 0.38
                    + Math.sin(ph + p * 4.2) * nh * 0.95 * p;
        ctx.lineTo(wx, wy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Nozzle burst glow (pulses with fan speed)
    const burst = ctx.createRadialGradient(nx, ny, 0, nx, ny, nh * 2.8);
    burst.addColorStop(0, rgba(WHITE, 0.55));
    burst.addColorStop(0.35, rgba(BLUSH, 0.18));
    burst.addColorStop(1, rgba(WHITE, 0));
    ctx.fillStyle = burst;
    ctx.fillRect(nx - nh * 2.8, ny - nh * 2.8, nh * 5.6, nh * 5.6);
  }

  // ── Hair Dryer body ───────────────────────────────────────
  function drawDryer(g, fy, t) {
    const { cx, cy, u, bw, bh, nr, nh, hw, hh, nozzleX } = g;
    const fcy = cy + fy;

    const bLeft  = cx - bw / 2;
    const bRight = cx + bw / 2;
    const bTop   = fcy - bh / 2;
    const bBot   = fcy + bh / 2;

    // Nozzle points
    const ntX   = nozzleX;
    const nbTop = fcy - bh * 0.44;
    const nbBot = fcy + bh * 0.44;
    const ntTop = fcy - nh;
    const ntBot = fcy + nh;

    // -- Dryer glow / drop shadow --
    const dsh = ctx.createRadialGradient(cx, fcy + u * 0.05, 0, cx, fcy + u * 0.05, u * 2.1);
    dsh.addColorStop(0, rgba(ROSE_DK, 0.52));
    dsh.addColorStop(1, rgba(ROSE_DK, 0));
    ctx.fillStyle = dsh;
    ctx.fillRect(cx - u * 2.2, fcy - u * 1.6, u * 4.4, u * 3.2);

    // -- Handle --
    const hx = cx - hw / 2;
    const hy = fcy + bh / 2 - u * 0.06;
    const hg = ctx.createLinearGradient(hx, 0, hx + hw, 0);
    hg.addColorStop(0,    rgb(ROSE_DK));
    hg.addColorStop(0.45, rgb(ROSE));
    hg.addColorStop(1,    rgb(ROSE_DK));
    ctx.fillStyle = hg;
    rrect(hx, hy, hw, hh, u * 0.10);
    ctx.fill();
    // Handle highlight
    ctx.fillStyle = rgba(WHITE, 0.09);
    rrect(hx + u * 0.04, hy + u * 0.05, hw * 0.30, hh * 0.62, u * 0.06);
    ctx.fill();
    // Power button
    ctx.fillStyle = rgb(GOLD);
    ctx.beginPath();
    ctx.arc(cx, hy + hh * 0.36, u * 0.078, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgb(GOLD_LT);
    ctx.lineWidth = u * 0.022;
    ctx.beginPath();
    ctx.arc(cx, hy + hh * 0.36, u * 0.078, 0, Math.PI * 2);
    ctx.stroke();
    // Cord (coiled)
    ctx.strokeStyle = rgba(ROSE_DK, 0.72);
    ctx.lineWidth   = u * 0.056;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, hy + hh);
    for (let i = 0; i < 5; i++) {
      const s = i % 2 === 0 ? 1 : -1;
      ctx.bezierCurveTo(
        cx + s * u * 0.26,  hy + hh + (i + 0.5) * u * 0.22,
        cx - s * u * 0.26,  hy + hh + (i + 0.5) * u * 0.22,
        cx,                  hy + hh + (i + 1)   * u * 0.22
      );
    }
    ctx.stroke();

    // -- Barrel --
    const bg = ctx.createLinearGradient(bLeft, bTop, bLeft, bBot);
    bg.addColorStop(0,    rgb(mix(ROSE_LT, WHITE, 0.22)));
    bg.addColorStop(0.38, rgb(ROSE));
    bg.addColorStop(1,    rgb(ROSE_DK));
    ctx.fillStyle = bg;
    rrect(bLeft, bTop, bw, bh, u * 0.15);
    ctx.fill();
    // Barrel gloss stripe
    ctx.fillStyle = rgba(WHITE, 0.15);
    rrect(bLeft + u * 0.08, bTop + u * 0.06, bw * 0.68, bh * 0.21, u * 0.06);
    ctx.fill();
    // Gold seam (barrel-nozzle junction)
    ctx.strokeStyle = rgb(GOLD);
    ctx.lineWidth   = u * 0.056;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(bLeft + u * 0.13, bTop + u * 0.06);
    ctx.lineTo(bLeft + u * 0.13, bBot - u * 0.06);
    ctx.stroke();

    // -- Vent grille (back / right end) --
    const vx  = bRight - u * 0.05;
    const vgw = u * 0.28;
    ctx.strokeStyle = rgba(ROSE_DK, 0.62);
    ctx.lineWidth   = u * 0.024;
    ctx.lineCap     = 'butt';
    for (let i = 0; i < 5; i++) {
      const vy = bTop + (bh / 5) * (i + 0.5);
      ctx.beginPath();
      ctx.moveTo(vx - vgw, vy);
      ctx.lineTo(vx - u * 0.01, vy);
      ctx.stroke();
    }
    // Fan glow pulsing
    const pulse = (Math.sin(t * 9.5) + 1) * 0.5;
    const vg = ctx.createRadialGradient(vx - vgw * 0.5, fcy, 0, vx - vgw * 0.5, fcy, u * 0.52);
    vg.addColorStop(0, rgba(GOLD, 0.26 + 0.24 * pulse));
    vg.addColorStop(1, rgba(GOLD, 0));
    ctx.fillStyle = vg;
    ctx.fillRect(vx - u * 0.75, fcy - u * 0.52, u * 0.75, u * 1.04);

    // -- Nozzle / concentrator --
    ctx.beginPath();
    ctx.moveTo(bLeft, nbTop);
    ctx.lineTo(ntX,   ntTop);
    ctx.lineTo(ntX,   ntBot);
    ctx.lineTo(bLeft, nbBot);
    ctx.closePath();
    const ng = ctx.createLinearGradient(ntX, ntTop, ntX, ntBot);
    ng.addColorStop(0,   rgb(mix(ROSE, WHITE, 0.20)));
    ng.addColorStop(0.5, rgb(ROSE));
    ng.addColorStop(1,   rgb(ROSE_DK));
    ctx.fillStyle = ng;
    ctx.fill();
    // Nozzle tip gold rim
    ctx.strokeStyle = rgb(GOLD);
    ctx.lineWidth   = u * 0.046;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(ntX, ntTop);
    ctx.lineTo(ntX, ntBot);
    ctx.stroke();
  }

  // ── Main frame ────────────────────────────────────────────
  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    const g   = geom();
    const fy  = Math.sin(t * 0.82) * g.u * 0.055;  // gentle float

    // -- Background gradient --
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   rgb(PLUM));
    bg.addColorStop(0.48, rgb(PLUM_MD));
    bg.addColorStop(1,   rgb([70, 24, 46]));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Ambient glow behind dryer
    const amb = ctx.createRadialGradient(g.cx + g.u * 0.2, g.cy, 0, g.cx + g.u * 0.2, g.cy, W * 0.48);
    amb.addColorStop(0, rgba(ROSE, 0.22));
    amb.addColorStop(1, rgba(ROSE, 0));
    ctx.fillStyle = amb;
    ctx.fillRect(0, 0, W, H);

    // -- Hair strands (very back, blown from nozzle) --
    for (const s of hairStrands) {
      s.prog += s.spd;
      if (s.prog >= 1) { Object.assign(s, spawnStrand(g, fy)); continue; }
      const p  = s.prog;
      const x2 = s.x - s.len * p;
      const cp = { x: s.x - s.len * p * 0.38, y: s.y + s.sweep * p * 0.55 };
      const a  = s.alph * Math.sin(Math.PI * p);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = rgba(s.col, 1);
      ctx.lineWidth   = s.lw;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.quadraticCurveTo(cp.x, cp.y, x2, s.y + s.sweep * p);
      ctx.stroke();
      ctx.restore();
    }

    // -- Air stream (behind dryer) --
    drawAir(g, fy, t);

    // -- Dryer body --
    drawDryer(g, fy, t);

    // -- Air particles --
    const nx = g.nozzleX;
    const ny = g.cy + fy;
    for (const p of airParts) {
      p.age += 0.013;
      p.x   += p.vx;
      p.y   += p.vy + Math.sin(t * p.wbFq + p.wb) * p.wbAmp;
      if (p.age >= p.life || p.x < -24) {
        Object.assign(p, spawnAir(g, fy));
        continue;
      }
      const prog = p.age / p.life;
      const a    = Math.sin(prog * Math.PI) * 0.88;

      ctx.save();
      if (p.type === 'air') {
        // Horizontal streak
        const trail = Math.abs(p.vx) * 3.8;
        ctx.globalAlpha   = a * 0.62;
        ctx.strokeStyle   = rgba(WHITE, 1);
        ctx.lineWidth     = Math.max(0.4, p.size * 0.32);
        ctx.lineCap       = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + trail, p.y);
        ctx.stroke();
      } else {
        // Glowing bead (gold or blush)
        const col = p.type === 'gold' ? GOLD : BLUSH;
        const gr  = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.6);
        gr.addColorStop(0, rgba(col, a * 0.92));
        gr.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = gr;
        ctx.fillRect(p.x - p.size * 2.6, p.y - p.size * 2.6, p.size * 5.2, p.size * 5.2);
        ctx.fillStyle = rgba(col, a);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.52, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // -- Floating sparkle stars --
    for (const s of stars) {
      s.x += s.vx;
      s.y += s.vy;
      if (s.y < -10) { s.y = H + 10; s.x = rand(0, W); }
      if (s.x < -10) s.x = W + 10;
      if (s.x > W + 10) s.x = -10;
      const pulse = 0.42 + 0.58 * Math.sin(t * 2.1 + s.ph);
      const sz    = s.sz * (0.62 + 0.38 * Math.sin(t * 1.3 + s.ph));
      const a     = pulse * 0.92;
      ctx.save();
      // Star glow
      const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, sz * 4.5);
      sg.addColorStop(0, rgba(s.col, a * 0.38));
      sg.addColorStop(1, rgba(s.col, 0));
      ctx.fillStyle = sg;
      ctx.fillRect(s.x - sz * 4.5, s.y - sz * 4.5, sz * 9, sz * 9);
      // Star shape
      ctx.fillStyle = rgba(s.col, a);
      star4(s.x, s.y, sz, sz * 0.30, s.rot + t * 0.28);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Resize ────────────────────────────────────────────────
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W   = canvas.clientWidth;
    H   = canvas.clientHeight;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  // ── Loop ──────────────────────────────────────────────────
  let raf = 0;
  function loop(now) {
    frame(now * 0.001);
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  if (reduce) {
    frame(0);
  } else {
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) raf = requestAnimationFrame(loop);
    });
  }
})();
