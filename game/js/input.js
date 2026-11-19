// input.js — keyboard and mouse state: held keys for movement, one-shot presses for actions, click for combat.
export function createInput() {
  const held = {}, pressed = {};
  let clicked = false;
  // Keys the game owns outright. M is registered here too, as the mute
  // toggle, so main.js can ask for it like any other game key.
  const GAME_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyF', 'KeyH', 'KeyM', 'KeyP'];
  const NO_BROWSER_DEFAULT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
  const down = (e) => {
    if (!held[e.code]) pressed[e.code] = true;
    held[e.code] = true;
    // Space and the arrows would otherwise scroll the page mid-drive; the
    // game takes them over completely so the view never jumps.
    if (NO_BROWSER_DEFAULT.has(e.code)) e.preventDefault();
  };
  const up = (e) => { held[e.code] = false; };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', () => { for (const k in held) held[k] = false; });
  window.addEventListener('mousedown', () => { clicked = true; });
  return {
    held, pressed,
    get up() { return !!(held.KeyW || held.ArrowUp); },
    get down() { return !!(held.KeyS || held.ArrowDown); },
    get left() { return !!(held.KeyA || held.ArrowLeft); },
    get right() { return !!(held.KeyD || held.ArrowRight); },
    get run() { return !!(held.ShiftLeft || held.ShiftRight); },
    get handbrake() { return !!held.Space; },
    get mute() { return !!held.KeyM; },
    isGameKey(code) { return GAME_KEYS.includes(code); },
    wasPressed(code) { return !!pressed[code]; },
    takeClick() { const c = clicked; clicked = false; return c; },
    endFrame() { for (const k in pressed) pressed[k] = false; clicked = false; },
  };
}
export function movementVector(input) {
  return { x: (input.right ? 1 : 0) - (input.left ? 1 : 0), z: (input.down ? 1 : 0) - (input.up ? 1 : 0) };
}
