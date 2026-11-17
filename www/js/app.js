/*
 * FarmDays — tela principal.
 */
(function (root) {
  'use strict';
  const doc = root.document;
  const C = root.FarmCalendar;
  const S = root.FarmSeasons;
  const H = root.FarmHolidays;
  const Store = root.FarmStore;
  const Panels = root.FarmPanels;
  const Sound = root.FarmSound;
  const Decor = root.FarmDecor;

  const $ = (id) => doc.getElementById(id);
  const state = { year: 0, month: 0, today: C.todayKey() };

  // ---------------------------------------------------------- escala pixel
  function layout() {
    const app = $('app');
    const w = Math.min(root.innerWidth, 600);
    const h = root.innerHeight;
    // 1 "pixel de arte" = u px CSS. Base: 180 px de largura de arte.
    const u = Math.max(1.4, Math.min(w / 180, h / 330));
    doc.documentElement.style.setProperty('--u', u + 'px');
    doc.documentElement.style.setProperty('--u-px', String(u));

    // altura das células: cabe no espaço disponível mantendo o jardim visível
    const scene = $('scene');
    const sceneH = scene.clientHeight;
    const reserved = u * (22 + 14 + 8 + 6) + u * 46; // estação + barra + bordas + jardim mínimo
    const cell = Math.max(u * 15, Math.min(u * 28, (sceneH - reserved) / 6));
    doc.documentElement.style.setProperty('--cell', cell + 'px');
    fitTitle();
    void app;
  }

  /** Mantém o título em escala inteira de pixel (2x, 1.75x...) sem estourar a placa. */
  function fitTitle() {
    const t = $('monthTitle');
    const txt = $('titleText');
    const root2 = doc.documentElement;
    for (const s of [2, 1.75, 1.5, 1.25, 1]) {
      root2.style.setProperty('--title-scale', s);
      const u = parseFloat(root2.style.getPropertyValue('--u-px')) || 2;
      if (txt.offsetWidth <= t.clientWidth - u * 6) break;
    }
  }

  // -------------------------------------------------------------- render
  function buildWeekbar() {
    $('weekbar').innerHTML = C.WEEKDAYS_LETTER.map((l, i) => `<span title="${C.WEEKDAYS[i]}">${l}</span>`).join('');
  }

  function render(direction) {
    const { year, month } = state;
    $('monthName').textContent = C.MONTHS[month];
    $('yearNum').textContent = year;
    $('prevMonth').disabled = !C.canGo(year, month, -1);
    $('nextMonth').disabled = !C.canGo(year, month, 1);

    // estação: do dia de hoje se for o mês atual; senão do dia 1 do mês
    const t = C.todayParts();
    const isCurrent = t.year === year && t.month === month;
    const ref = isCurrent ? t.day : 1;
    const season = S.seasonOf(year, month, ref);
    $('seasonName').textContent = season.name;
    const change = S.changeInMonth(year, month);
    $('seasonNote').textContent = change && change.name !== season.name ? `${change.name} em ${C.pad(change.day)}/${C.pad(month + 1)}` : '';
    Decor.setSeason(season.id);

    const hol = H.byDate(year);
    const counts = Store.countsByDate();
    const cells = C.monthGrid(year, month);
    const html = cells.map((c) => {
      if (!c.day) return '<div class="cell empty" aria-hidden="true"></div>';
      const hs = hol[c.key] || [];
      const nat = hs.some((h) => h.type === 'nacional');
      const fac = hs.some((h) => h.type === 'facultativo');
      const com = hs.some((h) => h.type === 'comemorativa');
      const n = counts[c.key] || 0;
      const cls = ['cell'];
      if (c.weekday === 0) cls.push('sun');
      if (nat) cls.push('holiday');
      if (c.key === state.today) cls.push('today');
      const marks = [];
      if (nat) marks.push('<img src="assets/mark_holiday.png" alt="">');
      else if (fac) marks.push('<img src="assets/mark_optional.png" alt="">');
      else if (com) marks.push('<img src="assets/mark_commem.png" alt="">');
      if (n) marks.push('<img class="ev" src="assets/mark_event.png" alt="">');
      const label = `${c.day} de ${C.MONTHS[month]}${hs.length ? ', ' + hs.map((h) => h.name).join(', ') : ''}${n ? `, ${n} evento(s)` : ''}`;
      return `<button class="${cls.join(' ')}" data-key="${c.key}" role="gridcell" aria-label="${label}">${c.day}${n > 1 ? `<span class="ev-count">${n}</span>` : ''}${marks.length ? `<span class="marks">${marks.join('')}</span>` : ''}</button>`;
    }).join('');
    const grid = $('grid');
    grid.innerHTML = html;
    grid.classList.remove('slide-left', 'slide-right');
    if (direction) { void grid.offsetWidth; grid.classList.add(direction > 0 ? 'slide-left' : 'slide-right'); }
    fitTitle();
  }

  function go(delta) {
    if (!C.canGo(state.year, state.month, delta)) return;
    const t = C.addMonths(state.year, state.month, delta);
    state.year = t.year; state.month = t.month;
    Sound.play('page');
    render(delta);
  }

  function goTo(year, month) {
    const t = C.clampMonth(year, month);
    const dir = (t.year * 12 + t.month) - (state.year * 12 + state.month);
    state.year = t.year; state.month = t.month;
    render(Math.sign(dir));
  }

  function goToday() {
    const t = C.todayParts();
    goTo(t.year, t.month);
  }

  // ----------------------------------------------------- data automática
  /** Verifica se o dia mudou (meia-noite, app voltando do segundo plano, fuso alterado). */
  function checkToday() {
    const k = C.todayKey();
    if (k !== state.today) {
      const old = C.parseKey(state.today);
      state.today = k;
      // se o usuário estava vendo o mês de "hoje", acompanha a virada do mês/ano
      if (old && old.year === state.year && old.month === state.month) {
        const t = C.todayParts();
        state.year = t.year; state.month = t.month;
      }
      render();
    }
  }

  function scheduleMidnight() {
    setTimeout(() => { checkToday(); scheduleMidnight(); }, Math.min(C.msUntilMidnight(), 2 ** 31 - 1));
  }

  // -------------------------------------------------------------- gestos
  function bindSwipe() {
    const el = $('calendar');
    let x0 = null, y0 = null, t0 = 0;
    el.addEventListener('touchstart', (e) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - t0 < 600) {
        el.dataset.swiped = '1';
        go(dx < 0 ? 1 : -1);
        setTimeout(() => { delete el.dataset.swiped; }, 50);
      }
      x0 = null;
    });
  }

  function bind() {
    $('prevMonth').addEventListener('click', () => go(-1));
    $('nextMonth').addEventListener('click', () => go(1));
    $('monthTitle').addEventListener('click', () => Panels.openPicker(state.year, state.month, goTo));
    $('seasonTag').addEventListener('click', () => { goToday(); Sound.play('tap'); });
    $('grid').addEventListener('click', (e) => {
      const b = e.target.closest('.cell[data-key]');
      if (!b || $('calendar').dataset.swiped) return;
      Sound.play('tap');
      Panels.openDay(b.dataset.key);
    });
    $('btnEvents').addEventListener('click', () => Panels.openEvents(state.year, state.month));
    $('btnHolidays').addEventListener('click', () => Panels.openHolidays(state.year, state.month));
    $('btnSound').addEventListener('click', async () => {
      const on = !Sound.isEnabled();
      Sound.setEnabled(on);
      updateSoundIcon();
      await Store.setSetting('sound', on);
      Panels.toast(on ? 'Sons ativados' : 'Sons desativados');
    });
    doc.addEventListener('keydown', (e) => {
      if (Panels.isOpen()) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
    root.addEventListener('resize', () => layout());
    doc.addEventListener('visibilitychange', () => { if (!doc.hidden) checkToday(); });
    root.addEventListener('focus', checkToday);
    setInterval(checkToday, 60 * 1000);
    bindSwipe();
    Store.onChange(() => render());
  }

  function updateSoundIcon() {
    const on = Sound.isEnabled();
    $('btnSound').querySelector('img').src = on ? 'assets/icon_sound.png' : 'assets/icon_sound_off.png';
    $('btnSound').setAttribute('aria-label', on ? 'Desativar sons' : 'Ativar sons');
  }

  async function init() {
    await Store.init();
    Sound.setEnabled(false);
    if (Store.settings().sound) Sound.setEnabled(true);
    updateSoundIcon();
    const t = C.todayParts();
    const start = C.clampMonth(t.year, t.month); // sempre abre no mês/ano atuais
    state.year = start.year; state.month = start.month;
    buildWeekbar();
    bind();
    render();
    // fontes carregadas => medir título de novo
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(layout);
    layout();
    scheduleMidnight();
    Decor.start();
  }

  root.FarmApp = {
    refresh: () => render(),
    flashDate(key) {
      const p = C.parseKey(key);
      if (p && (p.year !== state.year || p.month !== state.month)) goTo(p.year, p.month);
    },
    state,
    goTo,
  };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})(typeof self !== 'undefined' ? self : this);
