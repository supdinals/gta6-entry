// audio-synth.js — all sound is synthesized live with WebAudio: engine hum, horn, siren, punches, shots and jingles.
export class AudioSynth {
  constructor() { this.ctx = null; this.engineOsc = null; this.engineGain = null; this.sirenTimer = 0; this.master = null; }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5; this.master.connect(this.ctx.destination);
      this.engineOsc = this.ctx.createOscillator(); this.engineOsc.type = 'sawtooth'; this.engineOsc.frequency.value = 55;
      const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 420;
      this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0;
      this.engineOsc.connect(filter); filter.connect(this.engineGain); this.engineGain.connect(this.master);
      this.engineOsc.start();
    } catch { this.ctx = null; }
  }
  tone(freq, dur, type = 'sine', vol = 0.25, slide = 0) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), this.ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.master); o.start(); o.stop(this.ctx.currentTime + dur);
  }
  noise(dur, vol = 0.3) {
    if (!this.ctx) return;
    const len = Math.floor(this.ctx.sampleRate * dur), buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const g = this.ctx.createGain(); g.gain.value = vol;
    src.connect(g); g.connect(this.master); src.start();
  }
  setEngine(amount) { if (this.engineGain) { this.engineGain.gain.value = amount * 0.14; this.engineOsc.frequency.value = 55 + amount * 130; } }
  horn() { this.tone(370, 0.35, 'square', 0.2); this.tone(466, 0.35, 'square', 0.15); }
  punch() { this.noise(0.08, 0.35); this.tone(120, 0.09, 'sine', 0.3, -60); }
  shoot() { this.noise(0.12, 0.5); this.tone(900, 0.08, 'square', 0.12, -700); }
  crash() { this.noise(0.3, 0.55); this.tone(80, 0.3, 'sawtooth', 0.25, -40); }
  coin() { this.tone(880, 0.09, 'sine', 0.22); setTimeout(() => this.tone(1320, 0.14, 'sine', 0.22), 80); }
  missionDone() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.28), i * 110)); }
  sirenTick(dt, active) {
    if (!active || !this.ctx) return;
    this.sirenTimer -= dt;
    if (this.sirenTimer <= 0) { this.sirenTimer = 0.75; this.tone(Math.sin(performance.now() / 200) > 0 ? 720 : 540, 0.32, 'triangle', 0.07); }
  }
}
