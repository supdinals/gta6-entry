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
    this.speaker.textContent = line[0]; this.text.textContent = line[1];
  }
  advance() {
    if (!this.active) return false;
    this.queue.shift();
    if (this.queue.length === 0) { const cb = this.onDone; this.hide(); if (cb) cb(); }
    else this.render();
    return true;
  }
  hide() { this.active = false; this.box.classList.add('hidden'); }
  isOpen() { return this.active; }
}
export const INTRO_LINES = [
  ['Mara Sol', 'Rio! Good, you still answer your phone. I run half the cargo in Palmira Bay and I need a driver nobody knows.'],
  ['Rio Vale', 'I deliver sandwiches, Mara. Legally. Mostly.'],
  ['Mara Sol', 'Today you deliver one sealed crate to Cafe Brisa. No questions, double pay. And Rio — the bay police love new faces.'],
];
