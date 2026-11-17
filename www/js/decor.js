/*
 * FarmDays — decoração animada: estação, borboletas, galinha, folhas.
 */
(function (root) {
  'use strict';
  const doc = root.document;
  const reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentSeason = null;
  const timers = [];

  function u() {
    return parseFloat(getComputedStyle(doc.documentElement).getPropertyValue('--u-px')) || 2;
  }

  /** Troca flores, cores e extras conforme a estação ('primavera'|'verao'|'outono'|'inverno'). */
  function setSeason(id) {
    if (id === currentSeason) return;
    currentSeason = id;
    const app = doc.getElementById('app');
    app.classList.remove('season-primavera', 'season-verao', 'season-outono', 'season-inverno');
    app.classList.add('season-' + id);
    doc.querySelectorAll('img.flowers, img.g-flower').forEach((img) => { img.src = `assets/flowers_${id}.png`; });
    doc.querySelectorAll('.extra-season').forEach((n) => n.remove());
    const garden = doc.getElementById('garden');
    if (id === 'verao') {
      [[20, 6], [60, 10]].forEach(([left, bottom], i) => {
        const s = doc.createElement('img');
        s.src = 'assets/sunflower.png';
        s.className = 'extra-season sunflower-deco sway' + (i ? ' d2' : '');
        s.style.cssText = `left:${left}%;bottom:calc(var(--u) * ${bottom});width:calc(var(--u) * 12);z-index:1`;
        garden.appendChild(s);
      });
    }
  }

  // ------------------------------------------------------------ borboletas
  function spawnButterfly() {
    const layer = doc.getElementById('butterflies');
    if (!layer || doc.hidden) return;
    const b = doc.createElement('div');
    b.className = 'sprite-butterfly' + (Math.random() < 0.4 ? ' blue' : '');
    layer.appendChild(b);
    const w = layer.clientWidth, h = layer.clientHeight;
    const fromLeft = Math.random() < 0.5;
    const y0 = h * (0.15 + Math.random() * 0.6);
    const pts = [];
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const x = fromLeft ? -30 + (w + 60) * (i / steps) : w + 30 - (w + 60) * (i / steps);
      const y = y0 + Math.sin(i * 1.3 + Math.random()) * h * 0.08 - i * h * 0.02;
      pts.push({ transform: `translate(${x}px, ${y}px) scaleX(${fromLeft ? -1 : 1})` });
    }
    const anim = b.animate(pts, { duration: 9000 + Math.random() * 5000, easing: 'linear' });
    anim.onfinish = () => b.remove();
  }

  // --------------------------------------------------------------- galinha
  function chickenLoop() {
    const c = doc.getElementById('chicken');
    if (!c) return;
    const act = Math.random();
    if (act < 0.45) {
      // bicar o chão duas vezes
      let n = 0;
      const peck = () => {
        c.classList.toggle('peck');
        if (++n < 4) setTimeout(peck, 220);
        else c.classList.remove('peck');
      };
      peck();
    } else if (act < 0.8) {
      // andar um pouco
      const garden = doc.getElementById('garden');
      const max = Math.max(10, garden.clientWidth * 0.32);
      const left = 4 + Math.random() * max;
      const cur = c.offsetLeft;
      c.classList.toggle('flip', left < cur);
      c.style.left = left + 'px';
    }
  }

  function onChickenTap() {
    const c = doc.getElementById('chicken');
    c.classList.add('peck');
    setTimeout(() => c.classList.remove('peck'), 300);
    if (root.FarmSound) root.FarmSound.play('cluck');
  }

  // ----------------------------------------------------- folhas (outono)
  function dropLeaf() {
    if (currentSeason !== 'outono' || doc.hidden) return;
    const layer = doc.getElementById('butterflies');
    const l = doc.createElement('img');
    l.src = 'assets/leaf.png';
    l.className = 'leaf-fall';
    l.style.cssText = `left:${Math.random() * 100}%;top:-20px;width:calc(var(--u) * 7)`;
    layer.appendChild(l);
    const a = l.animate([
      { transform: 'translate(0,0) rotate(0deg)' },
      { transform: `translate(${(Math.random() - 0.5) * 120}px, ${layer.clientHeight + 40}px) rotate(${360 + Math.random() * 360}deg)` },
    ], { duration: 7000 + Math.random() * 4000, easing: 'linear' });
    a.onfinish = () => l.remove();
  }

  function start() {
    const c = doc.getElementById('chicken');
    if (c) { c.style.pointerEvents = 'auto'; c.addEventListener('click', onChickenTap); }
    if (reduced) return;
    timers.push(setInterval(chickenLoop, 3500));
    const flyAgain = () => {
      spawnButterfly();
      timers.push(setTimeout(flyAgain, 12000 + Math.random() * 18000));
    };
    timers.push(setTimeout(flyAgain, 4000));
    timers.push(setInterval(dropLeaf, 2500));
  }

  root.FarmDecor = { setSeason, start, spawnButterfly, u };
})(typeof self !== 'undefined' ? self : this);
