// input.js — keyboard and mouse state: held keys for movement, one-shot presses for actions, click for combat.
export function createInput() {
  const held = {}, pressed = {};
  let clicked = false;
  const down = (e) => {
    if (!held[e.code]) pressed[e.code] = true;
    held[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
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
    wasPressed(code) { return !!pressed[code]; },
    takeClick() { const c = clicked; clicked = false; return c; },
    endFrame() { for (const k in pressed) pressed[k] = false; clicked = false; },
  };
}
export function movementVector(input) {
  return { x: (input.right ? 1 : 0) - (input.left ? 1 : 0), z: (input.down ? 1 : 0) - (input.up ? 1 : 0) };
}
