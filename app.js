import { mountStarField } from './starfield.js';

const card = document.querySelector('.card');
const shell = document.querySelector('.card-shell');
const tilt = document.querySelector('.tilt');
const front = document.querySelector('.front');
const background = document.getElementById('background');
const more = document.getElementById('show-background');
const less = document.getElementById('show-front');
const pause = document.querySelector('.motion-toggle');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const lifecycle = new AbortController();
let back = false;
let starsPaused = false;

function turn(reverse) {
  back = reverse;
  card.classList.toggle('is-turned', reverse);
  front.inert = reverse;
  front.setAttribute('aria-hidden', String(reverse));
  background.inert = !reverse;
  background.setAttribute('aria-hidden', String(!reverse));
  more.setAttribute('aria-expanded', String(reverse));
  (reverse ? less : more).focus({ preventScroll: true });
}

more.hidden = false;
more.addEventListener('click', () => turn(true));
less.addEventListener('click', () => turn(false));
card.addEventListener('keydown', event => {
  if (event.key === 'Escape' && back) turn(false);
});
shell.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse') return;
  const rect = shell.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  tilt.style.setProperty('--mx', `${x * 100}%`);
  tilt.style.setProperty('--my', `${y * 100}%`);
  tilt.style.setProperty('--light-x', `${x * 100}%`);
  if (motion.matches) return;
  tilt.style.setProperty('--rx', `${(.5 - y) * 10}deg`);
  tilt.style.setProperty('--ry', `${(x - .5) * 14}deg`);
});
shell.addEventListener('pointerleave', () => {
  tilt.style.setProperty('--rx', '0deg');
  tilt.style.setProperty('--ry', '0deg');
});

const starfield = mountStarField(document.querySelector('.star-field'));
if (starfield) {
  pause.hidden = false;
  pause.addEventListener('click', () => {
    starsPaused = !starsPaused;
    starfield.setPaused(starsPaused);
    pause.setAttribute('aria-pressed', String(starsPaused));
    pause.setAttribute('aria-label', starsPaused ? 'Resume star movement' : 'Pause star movement');
    pause.querySelector('[data-icon="pause"]').hidden = starsPaused;
    pause.querySelector('[data-icon="play"]').hidden = !starsPaused;
  });
}

// Optional browser-agent navigation, using the same actions as the visible buttons.
if (document.modelContext?.registerTool) {
  async function showSide(input, reverse) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) {
      throw new Error('Expected an empty input object.');
    }
    turn(reverse);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { side: back ? 'background' : 'calling_card' };
  }
  for (const tool of [
    { name: 'show_background', description: 'Turn Will Folsom’s calling card over to read his professional background and interests.', reverse: true },
    { name: 'show_calling_card', description: 'Show the front of Will Folsom’s calling card with professional profile links.', reverse: false },
  ]) {
    try {
      Promise.resolve(document.modelContext.registerTool({
        name: tool.name, description: tool.description,
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: input => showSide(input, tool.reverse),
      }, { signal: lifecycle.signal })).catch(() => {});
    } catch { /* The page also works in browsers without WebMCP. */ }
  }
}

window.addEventListener('pagehide', event => {
  if (!event.persisted) { lifecycle.abort(); starfield?.destroy(); }
});
