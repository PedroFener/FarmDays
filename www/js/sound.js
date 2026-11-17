/*
 * FarmDays — sons opcionais (DESATIVADOS por padrão).
 * Sintetizados com Web Audio (bipes estilo 8-bit), sem arquivos de áudio.
 */
(function (root) {
  'use strict';
  let ctx = null;
  let enabled = false;

  function ac() {
    if (!ctx) {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when) {
    const a = ac();
    if (!a) return;
    const t = a.currentTime + (when || 0);
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  const SOUNDS = {
    tap: () => tone(660, 0.06, 'square', 0.04),
    page: () => { tone(520, 0.05, 'square', 0.035); tone(780, 0.07, 'square', 0.035, 0.05); },
    open: () => { tone(440, 0.06, 'triangle', 0.06); tone(660, 0.08, 'triangle', 0.06, 0.06); },
    save: () => { tone(523, 0.07, 'square', 0.04); tone(659, 0.07, 'square', 0.04, 0.07); tone(784, 0.12, 'square', 0.04, 0.14); },
    remove: () => { tone(400, 0.08, 'square', 0.04); tone(260, 0.14, 'square', 0.04, 0.08); },
    cluck: () => { tone(900, 0.04, 'sawtooth', 0.02); tone(700, 0.05, 'sawtooth', 0.02, 0.06); },
  };

  root.FarmSound = {
    setEnabled(v) { enabled = !!v; if (enabled) SOUNDS.tap(); },
    isEnabled() { return enabled; },
    play(name) { if (enabled && SOUNDS[name]) { try { SOUNDS[name](); } catch (e) { /* sem áudio */ } } },
  };
})(typeof self !== 'undefined' ? self : this);
