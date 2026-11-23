/**
 * 16-Bit WebAudio Chiptune Synthesizer (zero external audio files needed).
 */
export const SFX = (() => {
  let ctx = null;
  let enabled = true;

  function ensure() {
    if (!enabled) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'square', vol = 0.07, delay = 0, slideTo = null) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.015);
  }

  function noise(dur, vol = 0.04) {
    const c = ensure();
    if (!c) return;
    const bufSize = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const flt = c.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = 3200;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(c.destination);
    src.start();
  }

  return {
    toggle() {
      enabled = !enabled;
      if (enabled) this.blip();
      return enabled;
    },
    blip() { tone(660, 0.055, 'square', 0.06); },
    select() { tone(520, 0.05, 'square', 0.06); tone(780, 0.08, 'square', 0.07, 0.05); },
    start() {
      tone(392, 0.08, 'square', 0.08, 0);
      tone(523, 0.08, 'square', 0.08, 0.08);
      tone(659, 0.08, 'square', 0.08, 0.16);
      tone(784, 0.18, 'square', 0.09, 0.24);
    },
    type() { tone(420 + Math.random() * 140, 0.022, 'triangle', 0.03); },
    step() { tone(110, 0.035, 'triangle', 0.045, 0, 65); },
    jump() { tone(260, 0.14, 'square', 0.07, 0, 560); },
    stomp() { tone(320, 0.07, 'square', 0.09, 0, 120); tone(540, 0.09, 'triangle', 0.07, 0.06, 760); },
    collect() { tone(659, 0.06, 'square', 0.07, 0); tone(987, 0.11, 'square', 0.07, 0.06); },
    heal() {
      tone(523, 0.07, 'triangle', 0.08, 0);
      tone(659, 0.07, 'triangle', 0.08, 0.07);
      tone(784, 0.07, 'triangle', 0.08, 0.14);
      tone(1046, 0.16, 'triangle', 0.09, 0.21);
    },
    hurt() { tone(240, 0.16, 'sawtooth', 0.10, 0, 75); tone(160, 0.18, 'square', 0.08, 0.06, 55); },
    spray() { noise(0.11, 0.035); },
    throwSign() { tone(480, 0.09, 'triangle', 0.06, 0, 260); },
    snatch() { tone(340, 0.07, 'sawtooth', 0.08, 0, 600); tone(200, 0.12, 'square', 0.07, 0.07, 110); },
    crash() {
      tone(220, 0.14, 'sawtooth', 0.11, 0, 55);
      tone(150, 0.22, 'square', 0.09, 0.04, 40);
      tone(880, 0.07, 'triangle', 0.06, 0.18, 620);
    },
    dream() {
      tone(330, 0.35, 'sine', 0.07, 0, 440);
      tone(440, 0.45, 'sine', 0.06, 0.15, 587);
      tone(523, 0.60, 'triangle', 0.05, 0.30, 659);
    },
    victory() {
      [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, i === 5 ? 0.35 : 0.1, 'square', 0.08, i * 0.11));
    },
    gameover() {
      [392, 349, 330, 262].forEach((f, i) => tone(f, i === 3 ? 0.42 : 0.16, 'sawtooth', 0.08, i * 0.17));
    },
    dodge() {
      tone(440, 0.06, 'triangle', 0.07, 0, 760);
      tone(760, 0.07, 'square', 0.05, 0.05, 980);
    },
    firm() {
      tone(196, 0.10, 'square', 0.09, 0, 294);
      tone(294, 0.12, 'square', 0.09, 0.07, 392);
      tone(587, 0.18, 'triangle', 0.08, 0.13);
    },
    fart() {
      tone(135, 0.24, 'sawtooth', 0.085, 0, 62);
      tone(98, 0.22, 'square', 0.05, 0.06, 48);
      noise(0.18, 0.045);
    },
    windowOpen() {
      noise(0.22, 0.055);
      tone(520, 0.10, 'sine', 0.06, 0.02, 880);
      tone(784, 0.12, 'triangle', 0.06, 0.09, 1046);
    },
    busStop() {
      tone(659, 0.14, 'triangle', 0.08, 0);
      tone(523, 0.24, 'triangle', 0.08, 0.16);
    },
    whip() {
      // Sharp 16-bit bullwhip snap: fast upward zip + crisp noise crack!
      tone(220, 0.06, 'sawtooth', 0.08, 0, 1180);
      noise(0.11, 0.09);
      tone(980, 0.05, 'square', 0.06, 0.05, 190);
    },
    vault() {
      // Quick parkour turnstile vault hop
      tone(310, 0.07, 'square', 0.06, 0, 620);
      tone(480, 0.06, 'triangle', 0.05, 0.05, 290);
    },
    coinGive() {
      tone(987, 0.05, 'square', 0.06, 0);
      tone(1318, 0.10, 'square', 0.06, 0.05);
    },
    singerGroove() {
      // Upbeat 16-bit Bogotá urban musical riff when singer heals Brayan!
      const notes = [392, 493, 587, 784, 659, 784, 987];
      notes.forEach((f, i) => tone(f, i === notes.length - 1 ? 0.24 : 0.075, 'triangle', 0.08, i * 0.065));
    },
    briefcase() {
      tone(320, 0.07, 'square', 0.08, 0, 140);
      noise(0.06, 0.05);
    },
    chopperFire() {
      tone(520, 0.06, 'sawtooth', 0.065, 0, 190);
      tone(460, 0.06, 'square', 0.05, 0.06, 150);
    },
    blockBreak() {
      tone(180, 0.08, 'square', 0.09, 0, 65);
      noise(0.12, 0.08);
    },
    molotovBreak() {
      tone(840, 0.05, 'triangle', 0.06, 0, 320);
      noise(0.18, 0.075);
      tone(140, 0.14, 'sawtooth', 0.07, 0.04, 60);
    },
    bossWarning() {
      [440, 587, 440, 587, 659].forEach((f, i) => tone(f, 0.13, 'sawtooth', 0.085, i * 0.16));
    },
    speechWave() {
      tone(280, 0.16, 'sawtooth', 0.09, 0, 110);
      tone(420, 0.14, 'square', 0.07, 0.04, 180);
    },
    bossHit() {
      tone(200, 0.09, 'square', 0.10, 0, 480);
      noise(0.07, 0.07);
    },
    bossDefeat() {
      [523, 392, 659, 523, 784, 659, 1046].forEach((f, i) => tone(f, i === 6 ? 0.45 : 0.11, 'square', 0.09, i * 0.12));
    }
  };
})();
