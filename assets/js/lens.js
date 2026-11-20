/*
 * Interactive binary-lens microlensing figure for the home page.
 *
 * Part 1 (Lens) is the physics: point-source binary-lens magnification from the
 * fifth-order lens polynomial, finite-source magnification from an integral
 * around the source limb, and the caustics.
 * Part 2 (figure) draws the source-plane map and the light curve on two canvases.
 *
 * Conventions: lengths in Einstein radii of the total mass, time in Einstein
 * crossing times. Both lenses sit on the x axis and the origin is the centre of
 * the central caustic, so a close (s) and a wide (1/s) model share one frame.
 */
var Lens = (function () {
  'use strict';

  // Durand-Kerner iteration on a complex polynomial with coefficients (cr, ci),
  // ascending powers, degree n. (zr, zi) holds the starting guesses and the result.
  var _ar = new Float64Array(6), _ai = new Float64Array(6);
  function solve(cr, ci, n, zr, zi) {
    var lr = cr[n], li = ci[n], d = lr * lr + li * li, k, i, j, it, t;
    for (k = 0; k < n; k++) {
      _ar[k] = (cr[k] * lr + ci[k] * li) / d;
      _ai[k] = (ci[k] * lr - cr[k] * li) / d;
    }
    for (it = 0; it < 120; it++) {
      var delta = 0;
      for (i = 0; i < n; i++) {
        var xr = zr[i], xi = zi[i], pr = 1, pi = 0;
        for (k = n - 1; k >= 0; k--) {
          t = pr * xr - pi * xi + _ar[k];
          pi = pr * xi + pi * xr + _ai[k];
          pr = t;
        }
        var qr = 1, qi = 0;
        for (j = 0; j < n; j++) {
          if (j === i) continue;
          var dr = xr - zr[j], di = xi - zi[j];
          t = qr * dr - qi * di;
          qi = qr * di + qi * dr;
          qr = t;
        }
        var qd = qr * qr + qi * qi;
        if (qd < 1e-300) { zr[i] += 1e-7 * (i + 1); zi[i] += 1e-7; delta = 1; continue; }
        var wr = (pr * qr + pi * qi) / qd, wi = (pi * qr - pr * qi) / qd;
        zr[i] = xr - wr;
        zi[i] = xi - wi;
        var m = Math.abs(wr) + Math.abs(wi);
        if (m > delta) delta = m;
      }
      if (delta < 1e-13) break;
    }
  }

  function seed(zr, zi, n) {
    // Points on a spiral: distinct, not symmetric about the real axis.
    var r = 1, a = 0.4;
    for (var i = 0; i < n; i++) {
      zr[i] = r * Math.cos(a);
      zi[i] = r * Math.sin(a);
      r *= 0.92;
      a += 2.399963;
    }
  }

  // Lens positions. The central caustic sits near the star, shifted towards the
  // planet by m2 * s for a close planet and by m2 / s for a wide one, which is
  // the same point for a close/wide pair. That point is the origin.
  function geometry(s, q) {
    var m2 = q / (1 + q), m1 = 1 - m2, sc = s < 1 ? s : 1 / s;
    var z1 = -m2 * sc;
    return { m1: m1, m2: m2, z1: z1, z2: z1 + s };
  }

  // Scratch buffers for the lens polynomial.
  var _cr = new Float64Array(6), _ci = new Float64Array(6);
  var _pr = new Float64Array(5), _pi = new Float64Array(5);
  var _zr = new Float64Array(5), _zi = new Float64Array(5);

  var img = { n: 0, x: new Float64Array(5), y: new Float64Array(5), det: new Float64Array(5) };

  // Solve the lens equation zeta = z - m1 / (conj(z) - z1) - m2 / (conj(z) - z2)
  // for a point source at zeta = (xs, ys) and store the images in `img`.
  // Eliminating conj(z) with the conjugate equation gives the quintic
  //   (z - zeta) A1 A2 - P (m1 A2 + m2 A1) = 0,
  // where P = (z - z1)(z - z2), Q = m1 (z - z2) + m2 (z - z1) and
  // A_k = (conj(zeta) - z_k) P + Q. Roots that do not satisfy the lens equation
  // are discarded. `state` carries the previous roots so neighbouring calls
  // converge in a few iterations.
  function images(xs, ys, g, state) {
    var m1 = g.m1, m2 = g.m2, z1 = g.z1, z2 = g.z2;
    var a = z1 + z2, b = z1 * z2, gg = m1 * z2 + m2 * z1;
    // c_k = conj(zeta) - z_k
    var c1r = xs - z1, c2r = xs - z2, cim = -ys;
    if (Math.abs(cim) < 1e-12 && (Math.abs(c1r) < 1e-12 || Math.abs(c2r) < 1e-12)) cim = 1e-9;
    // A_k = c_k P + Q, with P = z^2 - a z + b and Q = z - gg
    var A10r = c1r * b - gg, A10i = cim * b, A11r = 1 - c1r * a, A11i = -cim * a, A12r = c1r, A12i = cim;
    var A20r = c2r * b - gg, A20i = cim * b, A21r = 1 - c2r * a, A21i = -cim * a, A22r = c2r, A22i = cim;
    // A1 * A2 (degree 4)
    _pr[0] = A10r * A20r - A10i * A20i;
    _pi[0] = A10r * A20i + A10i * A20r;
    _pr[1] = A10r * A21r - A10i * A21i + A11r * A20r - A11i * A20i;
    _pi[1] = A10r * A21i + A10i * A21r + A11r * A20i + A11i * A20r;
    _pr[2] = A10r * A22r - A10i * A22i + A11r * A21r - A11i * A21i + A12r * A20r - A12i * A20i;
    _pi[2] = A10r * A22i + A10i * A22r + A11r * A21i + A11i * A21r + A12r * A20i + A12i * A20r;
    _pr[3] = A11r * A22r - A11i * A22i + A12r * A21r - A12i * A21i;
    _pi[3] = A11r * A22i + A11i * A22r + A12r * A21i + A12i * A21r;
    _pr[4] = A12r * A22r - A12i * A22i;
    _pi[4] = A12r * A22i + A12i * A22r;
    // (z - zeta) * A1 A2
    var k;
    _cr[0] = -(xs * _pr[0] - ys * _pi[0]);
    _ci[0] = -(xs * _pi[0] + ys * _pr[0]);
    for (k = 1; k <= 4; k++) {
      _cr[k] = _pr[k - 1] - (xs * _pr[k] - ys * _pi[k]);
      _ci[k] = _pi[k - 1] - (xs * _pi[k] + ys * _pr[k]);
    }
    _cr[5] = _pr[4];
    _ci[5] = _pi[4];
    // minus P * (m1 A2 + m2 A1)
    var B0r = m1 * A20r + m2 * A10r, B0i = m1 * A20i + m2 * A10i;
    var B1r = m1 * A21r + m2 * A11r, B1i = m1 * A21i + m2 * A11i;
    var B2r = m1 * A22r + m2 * A12r, B2i = m1 * A22i + m2 * A12i;
    _cr[0] -= b * B0r;             _ci[0] -= b * B0i;
    _cr[1] -= b * B1r - a * B0r;   _ci[1] -= b * B1i - a * B0i;
    _cr[2] -= b * B2r - a * B1r + B0r; _ci[2] -= b * B2i - a * B1i + B0i;
    _cr[3] -= -a * B2r + B1r;      _ci[3] -= -a * B2i + B1i;
    _cr[4] -= B2r;                 _ci[4] -= B2i;

    var zr = state ? state.zr : _zr, zi = state ? state.zi : _zi;
    if (!state || !state.ready) { seed(zr, zi, 5); if (state) state.ready = true; }
    solve(_cr, _ci, 5, zr, zi);

    var count = 0;
    for (k = 0; k < 5; k++) {
      var x = zr[k], y = zi[k];
      if (x !== x || y !== y) { if (state) state.ready = false; continue; }
      var d1r = x - z1, d2r = x - z2;
      var D1 = d1r * d1r + y * y, D2 = d2r * d2r + y * y;
      // residual of the lens equation: zeta = z - sum m_k (z - z_k) / |z - z_k|^2
      var rx = x - m1 * d1r / D1 - m2 * d2r / D2 - xs;
      var ry = y - m1 * y / D1 - m2 * y / D2 - ys;
      if (rx * rx + ry * ry > 1e-10) continue;
      // h = d(zeta)/d(conj z); the Jacobian determinant is 1 - |h|^2
      var hr = m1 * (d1r * d1r - y * y) / (D1 * D1) + m2 * (d2r * d2r - y * y) / (D2 * D2);
      var hi = m1 * 2 * d1r * y / (D1 * D1) + m2 * 2 * d2r * y / (D2 * D2);
      img.x[count] = x; img.y[count] = y;
      img.det[count] = 1 - (hr * hr + hi * hi);
      count++;
    }
    img.n = count;
    return count;
  }

  // Point-source magnification: the sum of 1 / |det J| over the images.
  function pointMag(xs, ys, g, state) {
    var n = images(xs, ys, g, state), total = 0;
    for (var k = 0; k < n; k++) total += 1 / Math.abs(img.det[k]);
    return total;
  }

  var _sub = { zr: new Float64Array(5), zi: new Float64Array(5), ready: true };
  function warm(state) {
    for (var j = 0; j < 5; j++) { _sub.zr[j] = state.zr[j]; _sub.zi[j] = state.zi[j]; }
    _sub.ready = true;
    return _sub;
  }

  // Finite-source magnification without ray shooting. For point lenses the
  // field V(zeta) = sum over images of parity * image position has divergence
  // 2A, and it stays continuous across a caustic because the two new images
  // appear at the same place with opposite parity. The divergence theorem then
  // gives the mean magnification of a uniform disc of radius rho as
  //   A = 1 / (2 pi rho) * closed integral of (V - V_centre) . n dtheta
  // taken around the limb.
  var _vx = 0, _vy = 0;
  function field(xs, ys, g, state) {
    var n = images(xs, ys, g, state);
    _vx = 0; _vy = 0;
    for (var k = 0; k < n; k++) {
      if (img.det[k] > 0) { _vx += img.x[k]; _vy += img.y[k]; }
      else { _vx -= img.x[k]; _vy -= img.y[k]; }
    }
    return n;
  }

  var N0 = 24, _count = new Int8Array(N0), _cross = new Float64Array(N0), _limb = { n: 0 };
  function limb(theta, x0, y0, rho, g, state, cx, cy) {
    var c = Math.cos(theta), s = Math.sin(theta);
    _limb.n = field(x0 + rho * c, y0 + rho * s, g, warm(state));
    return (_vx - cx) * c + (_vy - cy) * s;
  }

  // V has square-root kinks where the limb crosses a caustic, so the limb is
  // split at those crossings and each arc integrated with a cosine substitution.
  function discMag(x0, y0, g, rho, state) {
    var j, k, sum = 0, step = 2 * Math.PI / N0, m = 0;
    field(x0, y0, g, state);
    var cx = _vx, cy = _vy;
    for (j = 0; j < N0; j++) {
      sum += limb((j + 0.5) * step, x0, y0, rho, g, state, cx, cy) * step;
      _count[j] = _limb.n;
    }
    for (j = 0; j < N0; j++) {
      if (_count[j] === _count[(j + 1) % N0]) continue;
      var a = (j + 0.5) * step, b = a + step, na = _count[j];
      for (k = 0; k < 12; k++) {
        var mid = 0.5 * (a + b);
        limb(mid, x0, y0, rho, g, state, cx, cy);
        if (_limb.n === na) a = mid; else b = mid;
      }
      _cross[m++] = 0.5 * (a + b);
    }
    if (m > 0) {
      sum = 0;
      for (j = 0; j < m; j++) {
        var t0 = _cross[j], len = (j + 1 < m ? _cross[j + 1] : _cross[0] + 2 * Math.PI) - t0;
        var M = 6 + Math.ceil(10 * len / Math.PI);
        for (k = 0; k < M; k++) {
          var u = Math.PI * (k + 0.5) / M;
          sum += limb(t0 + len * 0.5 * (1 - Math.cos(u)), x0, y0, rho, g, state, cx, cy) * len * 0.5 * Math.sin(u) * Math.PI / M;
        }
      }
    }
    return sum / (2 * Math.PI * rho);
  }

  // Light curve along a straight path with impact parameter u0 and angle alpha
  // (radians). `near` marks samples close enough to a caustic to need the disc.
  function lightCurve(p, tau0, tau1, nPts, rho, near) {
    var g = geometry(p.s, p.q), ca = Math.cos(p.alpha), sa = Math.sin(p.alpha);
    var out = new Float64Array(nPts), state = { zr: new Float64Array(5), zi: new Float64Array(5), ready: false };
    for (var i = 0; i < nPts; i++) {
      var tau = tau0 + (tau1 - tau0) * i / (nPts - 1);
      var x = tau * ca - p.u0 * sa, y = tau * sa + p.u0 * ca;
      out[i] = rho && (!near || near[i]) ? (pointMag(x, y, g, state), discMag(x, y, g, rho, state)) : pointMag(x, y, g, state);
    }
    return out;
  }

  // Which of nPts samples along the path pass within `reach` of a caustic.
  function nearCaustic(tracks, p, tau0, tau1, nPts, reach) {
    var ca = Math.cos(p.alpha), sa = Math.sin(p.alpha), near = new Uint8Array(nPts);
    var scale = (nPts - 1) / (tau1 - tau0);
    for (var t = 0; t < tracks.length; t++) {
      var X = tracks[t].x, Y = tracks[t].y, pt, pd;
      for (var i = 0; i < X.length; i++) {
        var tau = X[i] * ca + Y[i] * sa, d = -X[i] * sa + Y[i] * ca - p.u0;
        if (i > 0 && Math.abs(tau - pt) < 0.2 && (Math.abs(d) < reach || Math.abs(pd) < reach || d * pd < 0)) {
          var lo = Math.max(0, Math.floor((Math.min(tau, pt) - reach - tau0) * scale));
          var hi = Math.min(nPts - 1, Math.ceil((Math.max(tau, pt) + reach - tau0) * scale));
          for (var j = lo; j <= hi; j++) near[j] = 1;
        }
        pt = tau; pd = d;
      }
    }
    return near;
  }

  // Caustics: map the critical curve |sum m_k / (z - z_k)^2| = 1 to the source plane.
  // Returns four tracks of n + 1 points each.
  function caustics(s, q, n) {
    var g = geometry(s, q), m1 = g.m1, m2 = g.m2, z1 = g.z1, z2 = g.z2;
    var a = z1 + z2, b = z1 * z2, gg = m1 * z2 + m2 * z1, h = m1 * z2 * z2 + m2 * z1 * z1;
    var cr = new Float64Array(5), ci = new Float64Array(5);
    var zr = new Float64Array(4), zi = new Float64Array(4), tracks = [], k;
    for (k = 0; k < 4; k++) tracks.push({ x: new Float64Array(n + 1), y: new Float64Array(n + 1) });
    seed(zr, zi, 4);
    for (var i = 0; i <= n; i++) {
      var phi = 2 * Math.PI * i / n, er = Math.cos(phi), ei = Math.sin(phi);
      cr[0] = -er * b * b + h;          ci[0] = -ei * b * b;
      cr[1] = 2 * er * a * b - 2 * gg;  ci[1] = 2 * ei * a * b;
      cr[2] = -er * (a * a + 2 * b) + 1; ci[2] = -ei * (a * a + 2 * b);
      cr[3] = 2 * er * a;               ci[3] = 2 * ei * a;
      cr[4] = -er;                      ci[4] = -ei;
      solve(cr, ci, 4, zr, zi);
      for (k = 0; k < 4; k++) {
        var x = zr[k], y = zi[k], d1 = x - z1, d2 = x - z2;
        var D1 = d1 * d1 + y * y, D2 = d2 * d2 + y * y;
        tracks[k].x[i] = x - m1 * d1 / D1 - m2 * d2 / D2;
        tracks[k].y[i] = y - m1 * y / D1 - m2 * y / D2;
      }
    }
    return tracks;
  }

  return { geometry: geometry, pointMag: pointMag, discMag: discMag, lightCurve: lightCurve, nearCaustic: nearCaustic, caustics: caustics };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Lens;

/* ---------------------------------------------------------------- figure */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  var root = document.querySelector('[data-lens]');
  if (!root || !root.querySelector('canvas').getContext) return;

  var RHO = 0.003;      // source radius
  var SPAN = 0.1;       // half-width of the map and of the time window

  var mapCanvas = root.querySelector('[data-lens-map]');
  var curveCanvas = root.querySelector('[data-lens-curve]');
  var inputs = {}, outputs = {};
  ['s', 'logq', 'u0', 'alpha'].forEach(function (key) {
    inputs[key] = root.querySelector('[data-lens-input="' + key + '"]');
    outputs[key] = root.querySelector('[data-lens-output="' + key + '"]');
  });
  var twinBox = root.querySelector('[data-lens-twin]');
  var resetButton = root.querySelector('[data-lens-reset]');
  var readout = root.querySelector('[data-lens-readout]');
  var labelClose = root.querySelector('[data-lens-label="close"]');
  var labelWide = root.querySelector('[data-lens-label="wide"]');

  var MINUS = '−';
  var state = { hover: null, progress: 1, drag: null };
  var data = null, colors = {}, sans = 'Archivo, system-ui, sans-serif';

  function params() {
    return {
      s: +inputs.s.value,
      q: Math.pow(10, +inputs.logq.value),
      u0: +inputs.u0.value,
      alpha: +inputs.alpha.value * Math.PI / 180
    };
  }

  function readColors() {
    var cs = getComputedStyle(root);
    ['ink', 'muted', 'rule', 'accent', 'twin', 'paper'].forEach(function (name) {
      colors[name] = cs.getPropertyValue('--' + name).trim() || '#000';
    });
  }

  function fmt(value, digits) {
    var text = Math.abs(value).toFixed(digits);
    return (value < 0 && +text !== 0 ? MINUS : '') + text;
  }

  /* ---- model ---- */
  function compute() {
    var p = params(), twin = { s: 1 / p.s, q: p.q, u0: p.u0, alpha: p.alpha };
    var n = Math.max(240, Math.min(900, Math.round(curveCanvas.clientWidth * 1.5)));
    var cA = Lens.caustics(p.s, p.q, 720), cB = Lens.caustics(twin.s, twin.q, 720);
    var lcA = Lens.lightCurve(p, -SPAN, SPAN, n, RHO, Lens.nearCaustic(cA, p, -SPAN, SPAN, n, 6 * RHO));
    var lcB = Lens.lightCurve(twin, -SPAN, SPAN, n, RHO, Lens.nearCaustic(cB, twin, -SPAN, SPAN, n, 6 * RHO));
    var diff = new Float64Array(n), worst = 0;
    for (var i = 0; i < n; i++) {
      diff[i] = -2.5 * Math.log(lcB[i] / lcA[i]) / Math.LN10;
      if (Math.abs(diff[i]) > worst) worst = Math.abs(diff[i]);
    }
    data = { p: p, twin: twin, n: n, cA: cA, cB: cB, lcA: lcA, lcB: lcB, diff: diff, worst: worst, star: Lens.geometry(p.s, p.q).z1 };

    outputs.s.textContent = p.s.toFixed(2);
    outputs.logq.textContent = p.q < 0.01 ? p.q.toFixed(4) : p.q.toFixed(3);
    outputs.u0.textContent = fmt(p.u0, 3);
    outputs.alpha.textContent = Math.round(p.alpha * 180 / Math.PI) + '°';
    labelClose.textContent = p.s.toFixed(2);
    labelWide.textContent = twin.s.toFixed(2);
    readout.textContent = twinBox.checked
      ? 'Largest difference between the two curves here: ' + (worst < 0.995 ? worst.toFixed(2) : worst.toFixed(1)) + ' mag.'
      : '';
  }

  /* ---- drawing helpers ---- */
  function prepare(canvas, height) {
    var dpr = window.devicePixelRatio || 1, w = canvas.clientWidth;
    if (height) canvas.style.height = height + 'px';
    var h = height || canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    return { ctx: ctx, w: w, h: h };
  }

  function frame(ctx, x, y, w, h) {
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h));
  }

  // Inward ticks on two opposite sides, as in a journal figure.
  function ticksX(ctx, box, toX, values, length) {
    ctx.beginPath();
    values.forEach(function (v) {
      var x = Math.round(toX(v)) + 0.5;
      ctx.moveTo(x, box.y + box.h); ctx.lineTo(x, box.y + box.h - length);
      ctx.moveTo(x, box.y); ctx.lineTo(x, box.y + length);
    });
    ctx.stroke();
  }
  function ticksY(ctx, box, toY, values, length) {
    ctx.beginPath();
    values.forEach(function (v) {
      var y = Math.round(toY(v)) + 0.5;
      ctx.moveTo(box.x, y); ctx.lineTo(box.x + length, y);
      ctx.moveTo(box.x + box.w, y); ctx.lineTo(box.x + box.w - length, y);
    });
    ctx.stroke();
  }

  function label(ctx, text, x, y, align, baseline, color, weight) {
    ctx.font = (weight || 400) + ' 12px ' + sans;
    ctx.fillStyle = color || colors.muted;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = baseline || 'alphabetic';
    ctx.fillText(text, x, y);
  }

  function range(lo, hi, step) {
    var out = [];
    for (var v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(6));
    return out;
  }

  function polyline(ctx, n, xAt, yAt, upTo) {
    ctx.beginPath();
    var started = false;
    for (var i = 0; i < n; i++) {
      var x = xAt(i), y = yAt(i);
      if (upTo !== undefined && x > upTo) break;
      if (y !== y) { started = false; continue; }
      if (started) ctx.lineTo(x, y); else { ctx.moveTo(x, y); started = true; }
    }
    ctx.stroke();
  }

  /* ---- source-plane map ---- */
  var mapBox = null;
  function drawMap() {
    var pad = { l: 46, r: 10, t: 10, b: 42 };
    var side = mapCanvas.clientWidth - pad.l - pad.r;
    var c = prepare(mapCanvas, side + pad.t + pad.b), ctx = c.ctx;
    var box = mapBox = { x: pad.l, y: pad.t, w: side, h: side };
    var toX = function (v) { return box.x + (v + SPAN) / (2 * SPAN) * box.w; };
    var toY = function (v) { return box.y + (SPAN - v) / (2 * SPAN) * box.h; };
    var p = data.p, ca = Math.cos(p.alpha), sa = Math.sin(p.alpha);

    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();

    function caustic(tracks, color, dash, width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      tracks.forEach(function (t) {
        ctx.beginPath();
        var px = null, py = null;
        for (var i = 0; i < t.x.length; i++) {
          var x = toX(t.x[i]), y = toY(t.y[i]);
          if (px !== null && Math.abs(x - px) + Math.abs(y - py) < box.w * 0.25) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          px = x; py = y;
        }
        ctx.stroke();
      });
    }
    if (twinBox.checked) caustic(data.cB, colors.twin, [5, 3], 1.5);
    caustic(data.cA, colors.accent, [], 1.75);

    // host star
    ctx.setLineDash([]);
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.arc(toX(data.star), toY(0), 2.5, 0, 2 * Math.PI);
    ctx.fill();

    // source path
    var far = 3 * SPAN;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(toX(-far * ca - p.u0 * sa), toY(-far * sa + p.u0 * ca));
    ctx.lineTo(toX(far * ca - p.u0 * sa), toY(far * sa + p.u0 * ca));
    ctx.stroke();
    // arrowhead, which is also the handle that turns the path
    var hx = toX(handleTau() * ca - p.u0 * sa), hy = toY(handleTau() * sa + p.u0 * ca);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-p.alpha);
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.moveTo(7, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // source position for the time under the pointer, or during the opening sweep
    var tau = state.hover !== null ? state.hover : (state.progress < 1 ? -SPAN + 2 * SPAN * state.progress : null);
    if (tau !== null) {
      ctx.fillStyle = colors.paper;
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(toX(tau * ca - p.u0 * sa), toY(tau * sa + p.u0 * ca), 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.arc(box.x + 14, box.y + box.h - 15, 2.5, 0, 2 * Math.PI);
    ctx.fill();
    label(ctx, 'host star', box.x + 23, box.y + box.h - 11, 'left', 'alphabetic', colors.ink);

    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ticksX(ctx, box, toX, range(-SPAN, SPAN, 0.05), 6);
    ticksY(ctx, box, toY, range(-SPAN, SPAN, 0.05), 6);
    ticksX(ctx, box, toX, range(-SPAN, SPAN, 0.01), 3);
    ticksY(ctx, box, toY, range(-SPAN, SPAN, 0.01), 3);
    frame(ctx, box.x, box.y, box.w, box.h);
    [-0.05, 0, 0.05].forEach(function (v) {
      label(ctx, fmt(v, v ? 2 : 0), toX(v), box.y + box.h + 16);
      label(ctx, fmt(v, v ? 2 : 0), box.x - 7, toY(v), 'right', 'middle');
    });
    label(ctx, 'Source position (Einstein radii)', box.x + box.w / 2, box.y + box.h + 35, 'center', 'alphabetic', colors.ink);
  }

  function handleTau() { return SPAN * 0.72; }

  /* ---- light curve ---- */
  var curveBox = null;
  function drawCurve() {
    var showTwin = twinBox.checked;
    var pad = { l: 46, r: 10, t: 10, b: 42 };
    var height = mapCanvas.clientHeight || 360;
    if (curveCanvas.clientWidth < 520) height = Math.max(300, Math.round(curveCanvas.clientWidth * 0.78));
    var c = prepare(curveCanvas, height), ctx = c.ctx, n = data.n;
    var resH = showTwin ? Math.round((c.h - pad.t - pad.b) * 0.24) : 0;
    var box = curveBox = { x: pad.l, y: pad.t, w: c.w - pad.l - pad.r, h: c.h - pad.t - pad.b - resH };
    var res = { x: box.x, y: box.y + box.h, w: box.w, h: resH };

    var lo = Infinity, hi = 0, i;
    for (i = 0; i < n; i++) {
      lo = Math.min(lo, data.lcA[i]); hi = Math.max(hi, data.lcA[i]);
      if (showTwin) { lo = Math.min(lo, data.lcB[i]); hi = Math.max(hi, data.lcB[i]); }
    }
    var l0 = Math.log(lo / 1.1), l1 = Math.log(hi * 1.18);
    var toX = function (tau) { return box.x + (tau + SPAN) / (2 * SPAN) * box.w; };
    var toY = function (a) { return box.y + (l1 - Math.log(a)) / (l1 - l0) * box.h; };
    var xAt = function (k) { return box.x + k / (n - 1) * box.w; };
    var upTo = state.progress < 1 ? box.x + state.progress * box.w : undefined;

    // magnification ticks: 1, 2, 5 per decade labelled, the rest minor
    var major = [], minor = [];
    for (var decade = 1; decade < 1e5; decade *= 10) {
      for (var m = 1; m < 10; m++) {
        var v = m * decade;
        if (v <= Math.exp(l0) || v >= Math.exp(l1)) continue;
        (m === 1 || m === 2 || m === 5 ? major : minor).push(v);
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h + resH);
    ctx.clip();
    if (showTwin) {
      ctx.strokeStyle = colors.twin;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      polyline(ctx, n, xAt, function (k) { return toY(data.lcB[k]); }, upTo);
    }
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    polyline(ctx, n, xAt, function (k) { return toY(data.lcA[k]); }, upTo);

    var tick = 0.01;
    if (showTwin) {
      [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2].some(function (t) { tick = t; return t >= 0.8 * data.worst; });
      var limit = 1.6 * tick;
      var resY = function (d) { return res.y + res.h / 2 - Math.max(-1.05, Math.min(1.05, d / limit)) * res.h / 2; };
      ctx.strokeStyle = colors.rule;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(res.x, Math.round(resY(0)) + 0.5);
      ctx.lineTo(res.x + res.w, Math.round(resY(0)) + 0.5);
      ctx.stroke();
      ctx.strokeStyle = colors.twin;
      ctx.lineWidth = 1.5;
      polyline(ctx, n, xAt, function (k) { return resY(data.diff[k]); }, upTo);
    }

    // guide for the time under the pointer
    if (state.hover !== null) {
      var gx = Math.round(toX(state.hover)) + 0.5;
      ctx.strokeStyle = colors.muted;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(gx, box.y); ctx.lineTo(gx, box.y + box.h + resH);
      ctx.stroke();
      ctx.setLineDash([]);
      var idx = Math.round((state.hover + SPAN) / (2 * SPAN) * (n - 1));
      ctx.fillStyle = colors.paper;
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(toX(state.hover), toY(data.lcA[idx]), 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    var whole = { x: box.x, y: box.y, w: box.w, h: box.h + resH };
    ticksX(ctx, whole, toX, range(-SPAN, SPAN, 0.05), 6);
    ticksX(ctx, whole, toX, range(-SPAN, SPAN, 0.01), 3);
    ticksY(ctx, box, toY, major, 6);
    ticksY(ctx, box, toY, minor, 3);
    frame(ctx, box.x, box.y, box.w, box.h);
    if (showTwin) {
      frame(ctx, res.x, res.y, res.w, res.h);
      var ry = function (d) { return res.y + res.h / 2 - d / (1.6 * tick) * res.h / 2; };
      ticksY(ctx, res, ry, [-tick, 0, tick], 6);
      label(ctx, fmt(tick, tick < 0.1 ? 2 : 1), res.x - 7, ry(tick), 'right', 'middle');
      label(ctx, fmt(-tick, tick < 0.1 ? 2 : 1), res.x - 7, ry(-tick), 'right', 'middle');
      label(ctx, 'Difference (mag)', res.x + 8, res.y + 14, 'left', 'alphabetic', colors.ink);
    }
    major.forEach(function (v) { label(ctx, String(v), box.x - 7, toY(v), 'right', 'middle'); });
    [-0.05, 0, 0.05].forEach(function (v) { label(ctx, fmt(v, v ? 2 : 0), toX(v), box.y + box.h + resH + 16); });
    label(ctx, 'Time from peak (Einstein crossing times)', box.x + box.w / 2, box.y + box.h + resH + 35, 'center', 'alphabetic', colors.ink);
    label(ctx, 'Magnification', box.x + 8, box.y + 16, 'left', 'alphabetic', colors.ink);
  }

  function draw() {
    if (!data) return;
    drawMap();
    drawCurve();
  }

  var queued = false;
  function refresh(recompute) {
    if (recompute) data = null;
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      if (!data) compute();
      draw();
    });
  }

  /* ---- interaction ---- */
  Object.keys(inputs).forEach(function (key) {
    inputs[key].addEventListener('input', function () { finishSweep(); refresh(true); });
  });
  twinBox.addEventListener('change', function () { refresh(true); });
  resetButton.addEventListener('click', function () {
    Object.keys(inputs).forEach(function (key) { inputs[key].value = inputs[key].defaultValue; });
    twinBox.checked = true;
    finishSweep();
    refresh(true);
  });

  function sourcePoint(event) {
    var r = mapCanvas.getBoundingClientRect();
    return {
      x: ((event.clientX - r.left - mapBox.x) / mapBox.w * 2 - 1) * SPAN,
      y: (1 - (event.clientY - r.top - mapBox.y) / mapBox.h * 2) * SPAN
    };
  }
  function onHandle(pt) {
    var p = data.p, ca = Math.cos(p.alpha), sa = Math.sin(p.alpha);
    var dx = pt.x - (handleTau() * ca - p.u0 * sa), dy = pt.y - (handleTau() * sa + p.u0 * ca);
    return Math.sqrt(dx * dx + dy * dy) < SPAN * 0.11;
  }
  function clampInput(key, value) {
    var el = inputs[key];
    el.value = Math.max(+el.min, Math.min(+el.max, value));
  }
  mapCanvas.addEventListener('pointerdown', function (event) {
    if (!data || !mapBox) return;
    finishSweep();
    var pt = sourcePoint(event), p = data.p;
    if (onHandle(pt)) state.drag = { turn: true };
    else state.drag = { turn: false, offset: p.u0 - (-pt.x * Math.sin(p.alpha) + pt.y * Math.cos(p.alpha)) };
    mapCanvas.setPointerCapture(event.pointerId);
    mapCanvas.classList.add('is-dragging');
    event.preventDefault();
  });
  mapCanvas.addEventListener('pointermove', function (event) {
    if (!data || !mapBox) return;
    var pt = sourcePoint(event), p = data.p;
    if (!state.drag) {
      mapCanvas.classList.toggle('is-turning', onHandle(pt));
      return;
    }
    if (state.drag.turn) {
      var angle = (Math.atan2(pt.y, pt.x) - Math.atan2(p.u0, handleTau())) * 180 / Math.PI;
      clampInput('alpha', ((Math.round(angle) % 360) + 360) % 360);
    } else {
      clampInput('u0', -pt.x * Math.sin(p.alpha) + pt.y * Math.cos(p.alpha) + state.drag.offset);
    }
    refresh(true);
  });
  ['pointerup', 'pointercancel'].forEach(function (type) {
    mapCanvas.addEventListener(type, function () {
      state.drag = null;
      mapCanvas.classList.remove('is-dragging');
    });
  });

  curveCanvas.addEventListener('pointermove', function (event) {
    if (!curveBox || state.progress < 1) return;
    var r = curveCanvas.getBoundingClientRect();
    var tau = ((event.clientX - r.left - curveBox.x) / curveBox.w * 2 - 1) * SPAN;
    state.hover = Math.abs(tau) <= SPAN ? tau : null;
    refresh(false);
  });
  curveCanvas.addEventListener('pointerleave', function () { state.hover = null; refresh(false); });

  /* ---- opening sweep: the source crosses once while the curve is traced ---- */
  var sweeping = false;
  function finishSweep() { sweeping = false; state.progress = 1; }
  function sweep() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var start = null, duration = 2200;
    sweeping = true;
    state.progress = 0;
    (function step(now) {
      if (!sweeping) { refresh(false); return; }
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      state.progress = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
      if (!data) compute();
      draw();
      if (t < 1) requestAnimationFrame(step); else finishSweep();
    })(performance.now());
  }

  /* ---- start ---- */
  readColors();
  if ('ResizeObserver' in window) new ResizeObserver(function () { refresh(true); }).observe(root.querySelector('[data-lens-panels]'));
  else window.addEventListener('resize', function () { refresh(true); });
  document.addEventListener('themechange', function () { readColors(); refresh(false); });
  if (window.matchMedia) {
    var scheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (scheme.addEventListener) scheme.addEventListener('change', function () { readColors(); refresh(false); });
  }
  root.classList.add('is-live');
  compute();
  draw();
  var fonts = document.fonts;
  if (fonts && fonts.load) fonts.load('12px Archivo').then(function () { sweep(); }, function () { sweep(); });
  else sweep();
})();
