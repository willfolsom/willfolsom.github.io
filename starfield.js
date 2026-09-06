// Two independent depth layers. Random values are sampled separately for each property.
export function seededRandom(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeStars(count, near, random) {
  return Array.from({ length: count }, () => ({
    x: random(), y: random(),
    radius: near ? .65 + random() * .65 : .3 + random() * .45,
    alpha: near ? .38 + random() * .46 : .13 + random() * .4,
    vx: (random() - .5) * (near ? .65 : .2),
    vy: -(near ? 3 + random() * 3.5 : .8 + random() * 1.4),
  }));
}

export function mountStarField(container) {
  const canvases = [...container.querySelectorAll('canvas')];
  const contexts = canvases.map(canvas => canvas.getContext('2d'));
  if (canvases.length !== 2 || contexts.some(context => !context)) return null;
  const random = seededRandom(crypto.getRandomValues(new Uint32Array(1))[0]);
  const layers = [makeStars(340, false, random), makeStars(180, true, random)];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 1, height = 1, frame = 0, previous = 0, paused = false;
  let targetX = 0, targetY = 0, offsetX = 0, offsetY = 0;
  const active = () => !paused && !motion.matches && !document.hidden;

  function draw(time) {
    frame = 0;
    const dt = active() && previous ? Math.min((time - previous) / 1000, .05) : 0;
    previous = time;
    const ease = 1 - Math.exp(-dt * 5);
    offsetX += (targetX - offsetX) * ease;
    offsetY += (targetY - offsetY) * ease;
    layers.forEach((stars, depth) => {
      const ctx = contexts[depth];
      ctx.clearRect(0, 0, width, height);
      const parallax = depth ? 27 : 9;
      for (const star of stars) {
        star.x += star.vx * dt / (width + 80);
        star.y += star.vy * dt / (height + 80);
        if (star.y < 0) { star.y = 1; star.x = random(); }
        if (star.x < 0) star.x = 1;
        if (star.x > 1) star.x = 0;
        const x = star.x * (width + 80) - 40 + offsetX * parallax;
        const y = star.y * (height + 80) - 40 + offsetY * parallax;
        ctx.beginPath();
        ctx.arc(x, y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(222,232,238,${star.alpha})`;
        ctx.fill();
      }
    });
    if (active()) frame = requestAnimationFrame(draw);
  }

  function start() {
    cancelAnimationFrame(frame);
    previous = 0;
    frame = requestAnimationFrame(draw);
  }
  function resize() {
    const rect = container.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvases.forEach((canvas, i) => {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      contexts[i].setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    start();
  }
  function pointer(event) {
    if (event.pointerType !== 'mouse' || motion.matches || paused) return;
    targetX = (event.clientX / innerWidth - .5) * 2;
    targetY = (event.clientY / innerHeight - .5) * 2;
  }
  function reset() { targetX = 0; targetY = 0; }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  window.addEventListener('pointermove', pointer, { passive: true });
  document.documentElement.addEventListener('pointerleave', reset);
  document.addEventListener('visibilitychange', start);
  motion.addEventListener('change', start);
  resize();

  return {
    setPaused(value) { paused = value; start(); },
    destroy() {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener('pointermove', pointer);
      document.documentElement.removeEventListener('pointerleave', reset);
      document.removeEventListener('visibilitychange', start);
      motion.removeEventListener('change', start);
    },
  };
}
