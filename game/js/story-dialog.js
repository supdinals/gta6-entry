// story-dialog.js — the story dialog box: a queue of character lines the player clicks through between mission beats.
export class StoryDialog {
  constructor(boxEl, speakerEl, textEl, onDone) {
    this.box = boxEl; this.speaker = speakerEl; this.text = textEl;
    this.queue = []; this.onDone = onDone || null; this.active = false;
    this.box.addEventListener('click', () => this.advance());
  }
  show(lines, onDone) {
    this.queue = [...lines]; this.onDone = onDone || null; this.active = true;
    this.box.classList.remove('hidden'); this.render();
  }
  render() {
    const line = this.queue[0];
    if (!line) { this.hide(); return; }
    this.speaker.textContent = line[0];
    // Typewriter driven by elapsed time, not tick count: a line reveals
    // over about a third of a second however long it is, and however busy
    // the render loop is, because progress is read off the clock.
    this.stopTyping();
    this.fullText = line[1]; this.typed = 0;
    this.typeStart = performance.now(); this.typeDuration = 320;
    this.text.textContent = '';
    this.typeTimer = setInterval(() => {
      const t = Math.min(1, (performance.now() - this.typeStart) / this.typeDuration);
      this.typed = Math.floor(this.fullText.length * t);
      this.text.textContent = this.fullText.slice(0, this.typed);
      if (t >= 1) this.stopTyping();
    }, 25);
  }
  stopTyping() { if (this.typeTimer) { clearInterval(this.typeTimer); this.typeTimer = null; } }
  isTyping() { return !!this.typeTimer; }
  completeLine() { this.stopTyping(); if (this.fullText != null) this.text.textContent = this.fullText; }
  advance() {
    if (!this.active) return false;
    // A click or Enter while a line is still typing only completes that
    // line; the next one moves on, so fast readers never skip text by luck.
    // A line whose time has already run out counts as finished, even if a
    // busy frame has not let the timer notice yet.
    if (this.isTyping() && performance.now() - this.typeStart < this.typeDuration) { this.completeLine(); return true; }
    if (this.isTyping()) this.completeLine();
    this.queue.shift();
    if (this.queue.length === 0) { const cb = this.onDone; this.hide(); if (cb) cb(); }
    else this.render();
    return true;
  }
  hide() { this.stopTyping(); this.active = false; this.box.classList.add('hidden'); }
  isOpen() { return this.active; }
}
export const INTRO_LINES = [
  ['Mara Sol', 'Rio! Good, you still answer your phone. I run half the cargo in Palmira Bay and I need a driver nobody knows.'],
  ['Rio Vale', 'I deliver sandwiches, Mara. Legally. Mostly.'],
  ['Mara Sol', 'Today you deliver one sealed crate to Cafe Brisa. No questions, double pay. And Rio — the bay police love new faces.'],
];
