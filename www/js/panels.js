/*
 * FarmDays — painéis: dia, eventos (lista + formulário), feriados, seletor de mês.
 * Cada painel aberto entra no histórico do navegador, então o botão "voltar"
 * do Android fecha o painel em vez de fechar o app.
 */
(function (root) {
  'use strict';
  const doc = root.document;
  const C = root.FarmCalendar;
  const H = root.FarmHolidays;
  const Store = root.FarmStore;
  const Sound = root.FarmSound;

  const overlay = doc.getElementById('overlay');
  const stack = []; // renderizadores dos painéis abertos

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function toast(msg) {
    const t = doc.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 1800);
  }

  function render() {
    const top = stack[stack.length - 1];
    if (!top) { overlay.hidden = true; overlay.innerHTML = ''; return; }
    overlay.hidden = false;
    overlay.className = 'overlay ' + (top.mode || '');
    overlay.innerHTML = top.html();
    top.bind && top.bind(overlay);
  }

  function open(panel) {
    stack.push(panel);
    try { root.history.pushState({ farmPanel: stack.length }, ''); } catch (e) { /* file:// */ }
    Sound.play('open');
    render();
  }

  /** Substitui o painel do topo (sem novo item de histórico). */
  function replace(panel) {
    stack[stack.length - 1] = panel;
    render();
  }

  function close() {
    if (!stack.length) return;
    root.history.back();
  }

  root.addEventListener('popstate', () => {
    if (stack.length) {
      stack.pop();
      render();
      if (root.FarmApp) root.FarmApp.refresh();
    }
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  function head(title, extra) {
    return `<div class="panel-head">
      <button class="icon-btn" data-act="close" aria-label="Voltar"><img src="assets/arrow_left.png" alt=""></button>
      <h2>${title}</h2>${extra || '<span class="icon-btn"></span>'}</div>`;
  }

  function bindClose(el) {
    el.querySelectorAll('[data-act="close"]').forEach((b) => b.addEventListener('click', close));
  }

  // ------------------------------------------------------------ itens
  function holidayItem(h, showDate) {
    const p = C.parseKey(h.date);
    const label = { nacional: 'Feriado nacional', facultativo: 'Ponto facultativo', comemorativa: 'Data comemorativa', estadual: 'Feriado estadual', municipal: 'Feriado municipal' }[h.type];
    const wd = C.WEEKDAYS[C.weekday(p.year, p.month, p.day)].split('-')[0].toLowerCase();
    return `<div class="item">
      ${showDate ? `<div class="date-badge ${h.type}"><big>${p.day}</big>${C.MONTHS_SHORT[p.month]}</div>` : ''}
      <div class="info">
        <div class="title">${esc(h.name)}</div>
        <div class="desc">${label}${showDate ? ' • ' + wd : ''}${h.note ? ' • ' + esc(h.note) : ''}
        ${h.provisional ? '<span class="tag prev">previsão</span>' : ''}</div>
      </div></div>`;
  }

  function eventItem(e, showDate) {
    const p = C.parseKey(e.date);
    return `<div class="item">
      ${showDate ? `<div class="date-badge"><big>${p.day}</big>${C.MONTHS_SHORT[p.month]}</div>` : ''}
      <div class="info">
        <div class="title">${e.time ? `<span class="muted">${e.time}</span> ` : ''}${esc(e.title)}</div>
        ${e.description ? `<div class="desc">${esc(e.description)}</div>` : ''}
      </div>
      <div class="actions">
        <button class="icon-btn" data-edit="${e.id}" aria-label="Editar"><img src="assets/icon_edit.png" alt=""></button>
        <button class="icon-btn" data-del="${e.id}" aria-label="Excluir"><img src="assets/icon_trash.png" alt=""></button>
      </div></div>`;
  }

  function bindEventActions(el) {
    el.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openEventForm(Store.get(b.dataset.edit))));
    el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => confirmDelete(Store.get(b.dataset.del))));
  }

  // ------------------------------------------------------------ painel do dia
  function openDay(dateKey) {
    const p = C.parseKey(dateKey);
    open({
      html() {
        const hol = H.byDate(p.year)[dateKey] || [];
        const evs = Store.byDate(dateKey);
        return `<div class="panel">${head(`${p.day} de ${C.MONTHS[p.month]}`)}
          <div class="panel-body">
            <div class="muted small" style="text-align:center;margin-bottom:10px">${C.formatLong(dateKey)} • ${root.FarmSeasons.seasonOf(p.year, p.month, p.day).name}</div>
            ${hol.length ? `<div class="section-title"><img src="assets/icon_tent.png" alt="">Feriados e datas</div>${hol.map((h) => holidayItem(h, false)).join('')}` : ''}
            <div class="section-title"><img src="assets/icon_cake.png" alt="">Eventos do dia</div>
            ${evs.length ? evs.map((e) => eventItem(e, false)).join('') : '<div class="empty-msg">Nenhum evento neste dia.</div>'}
          </div>
          <div class="panel-foot"><button class="wood-btn green" data-act="add">+ Novo evento</button></div></div>`;
      },
      bind(el) {
        bindClose(el);
        bindEventActions(el);
        el.querySelector('[data-act="add"]').addEventListener('click', () => openEventForm({ date: dateKey }));
      },
    });
  }

  // ------------------------------------------------------------ eventos
  function openEvents(year, month) {
    let view = 'month';
    let y = year, m = month;
    const panel = {
      mode: 'full',
      html() {
        let list;
        if (view === 'month') list = Store.byMonth(y, m);
        else {
          const today = C.todayKey();
          list = Store.all().filter((e) => e.date >= today);
        }
        const groups = [];
        for (const e of list) {
          const g = groups[groups.length - 1];
          if (g && g.date === e.date) g.items.push(e); else groups.push({ date: e.date, items: [e] });
        }
        return `<div class="panel">${head('Eventos')}
          <div class="panel-body">
            <div class="tabs">
              <button class="wood-btn small ${view === 'month' ? 'on' : ''}" data-view="month">Por mês</button>
              <button class="wood-btn small ${view === 'next' ? 'on' : ''}" data-view="next">Próximos</button>
            </div>
            ${view === 'month' ? `<div class="month-switch">
              <button class="icon-btn" data-m="-1" ${C.canGo(y, m, -1) ? '' : 'disabled'} aria-label="Mês anterior"><img src="assets/arrow_left.png" alt=""></button>
              <strong>${C.MONTHS[m]} ${y}</strong>
              <button class="icon-btn" data-m="1" ${C.canGo(y, m, 1) ? '' : 'disabled'} aria-label="Próximo mês"><img src="assets/arrow_right.png" alt=""></button>
            </div>` : ''}
            ${groups.length ? groups.map((g) => g.items.map((e) => eventItem(e, true)).join('')).join('')
              : `<div class="empty-msg">${view === 'month' ? 'Nenhum evento em ' + C.MONTHS[m].toLowerCase() + '.' : 'Nenhum evento futuro.'}<br>Toque em "+ Adicionar".</div>`}
          </div>
          <div class="panel-foot"><button class="wood-btn green" data-act="add">+ Adicionar evento</button></div></div>`;
      },
      bind(el) {
        bindClose(el);
        bindEventActions(el);
        el.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; Sound.play('tap'); render(); }));
        el.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
          const t = C.addMonths(y, m, +b.dataset.m); y = t.year; m = t.month; Sound.play('page'); render();
        }));
        el.querySelector('[data-act="add"]').addEventListener('click', () => {
          const t = C.todayParts();
          const def = (t.year === y && t.month === m) || view === 'next' ? C.todayKey() : C.key(y, m, 1);
          openEventForm({ date: def });
        });
      },
    };
    open(panel);
  }

  function openEventForm(ev) {
    const editing = !!(ev && ev.id);
    const data = Object.assign({ title: '', date: C.todayKey(), time: '', description: '' }, ev || {});
    open({
      mode: 'center',
      html() {
        return `<div class="panel">${head(editing ? 'Editar evento' : 'Novo evento')}
          <form class="panel-body form" id="evForm" novalidate>
            <label for="fTitle">Nome do evento</label>
            <input id="fTitle" name="title" maxlength="80" autocomplete="off" value="${esc(data.title)}" placeholder="Ex.: Aniversário da vovó">
            <label for="fDate">Data</label>
            <input id="fDate" name="date" type="date" min="${C.MIN_YEAR}-01-01" max="${C.MAX_YEAR}-12-31" value="${esc(data.date)}">
            <label for="fTime">Horário <span class="opt">(opcional)</span></label>
            <input id="fTime" name="time" type="time" value="${esc(data.time)}">
            <label for="fDesc">Descrição <span class="opt">(opcional)</span></label>
            <textarea id="fDesc" name="description" maxlength="1000" placeholder="Detalhes, local, lembretes...">${esc(data.description)}</textarea>
            <div class="error" id="fErr"></div>
          </form>
          <div class="panel-foot">
            <button class="wood-btn" data-act="close">Cancelar</button>
            <button class="wood-btn green" data-act="save">Salvar</button>
          </div></div>`;
      },
      bind(el) {
        bindClose(el);
        const form = el.querySelector('#evForm');
        const submit = async (e) => {
          if (e) e.preventDefault();
          const fd = new FormData(form);
          try {
            const saved = await Store.save({
              id: data.id, createdAt: data.createdAt,
              title: fd.get('title'), date: fd.get('date'), time: fd.get('time'), description: fd.get('description'),
            });
            Sound.play('save');
            toast(editing ? 'Evento atualizado!' : 'Evento salvo!');
            close();
            if (root.FarmApp) root.FarmApp.flashDate(saved.date);
          } catch (err) {
            el.querySelector('#fErr').textContent = err.message;
          }
        };
        form.addEventListener('submit', submit);
        el.querySelector('[data-act="save"]').addEventListener('click', submit);
        if (!editing) setTimeout(() => { const f = doc.getElementById('fTitle'); if (f) f.focus(); }, 250);
      },
    });
  }

  function confirmDelete(ev) {
    if (!ev) return;
    open({
      mode: 'center',
      html() {
        return `<div class="panel">${head('Excluir evento?')}
          <div class="panel-body"><p style="text-align:center;line-height:1.5">"${esc(ev.title)}"<br><span class="muted small">${C.formatLong(ev.date)}${ev.time ? ' às ' + ev.time : ''}</span></p></div>
          <div class="panel-foot">
            <button class="wood-btn" data-act="close">Manter</button>
            <button class="wood-btn red" data-act="del">Excluir</button>
          </div></div>`;
      },
      bind(el) {
        bindClose(el);
        el.querySelector('[data-act="del"]').addEventListener('click', async () => {
          await Store.remove(ev.id);
          Sound.play('remove');
          toast('Evento excluído.');
          close();
        });
      },
    });
  }

  // ------------------------------------------------------------ feriados
  function openHolidays(year, month) {
    let y = year, m = month, all = false;
    open({
      mode: 'full',
      html() {
        const list = all ? H.forYear(y) : H.forMonth(y, m);
        const nat = list.filter((h) => h.type === 'nacional' || h.type === 'estadual' || h.type === 'municipal');
        const fac = list.filter((h) => h.type === 'facultativo');
        const com = list.filter((h) => h.type === 'comemorativa');
        const src = H.sourceFor(y);
        const sec = (title, icon, items, empty) => `<div class="section-title"><img src="assets/${icon}" alt="">${title}</div>
          ${items.length ? items.map((h) => holidayItem(h, true)).join('') : `<div class="empty-msg small">${empty}</div>`}`;
        return `<div class="panel">${head('Feriados')}
          <div class="panel-body">
            <div class="tabs">
              <button class="wood-btn small ${!all ? 'on' : ''}" data-all="0">Por mês</button>
              <button class="wood-btn small ${all ? 'on' : ''}" data-all="1">Ano inteiro</button>
            </div>
            <div class="month-switch">
              <button class="icon-btn" data-m="-1" aria-label="Anterior"><img src="assets/arrow_left.png" alt=""></button>
              <strong>${all ? y : C.MONTHS[m] + ' ' + y}</strong>
              <button class="icon-btn" data-m="1" aria-label="Próximo"><img src="assets/arrow_right.png" alt=""></button>
            </div>
            ${sec('Feriados nacionais', 'mark_holiday.png', nat, 'Nenhum feriado nacional neste período.')}
            ${sec('Pontos facultativos', 'mark_optional.png', fac, 'Nenhum ponto facultativo neste período.')}
            ${sec('Datas comemorativas', 'mark_commem.png', com, 'Nenhuma data comemorativa cadastrada.')}
            <p class="muted small" style="line-height:1.5;margin-top:14px">
              Ponto facultativo não é feriado: vale para órgãos públicos federais e cada empresa decide.
              ${src ? `Calendário de ${y} conforme a ${src}.` : `Os pontos facultativos de ${y} são uma previsão até a publicação da portaria anual do governo federal.`}
              Feriados estaduais e municipais ainda não estão incluídos.
            </p>
          </div></div>`;
      },
      bind(el) {
        bindClose(el);
        el.querySelectorAll('[data-all]').forEach((b) => b.addEventListener('click', () => { all = b.dataset.all === '1'; Sound.play('tap'); render(); }));
        el.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
          const d = +b.dataset.m;
          if (all) y = Math.min(C.MAX_YEAR, Math.max(C.MIN_YEAR, y + d));
          else if (C.canGo(y, m, d)) { const t = C.addMonths(y, m, d); y = t.year; m = t.month; }
          Sound.play('page'); render();
        }));
      },
    });
  }

  // ------------------------------------------------------ seletor mês/ano
  function openPicker(year, month, onPick) {
    let y = year;
    open({
      mode: 'center',
      html() {
        const t = C.todayParts();
        return `<div class="panel">${head('Escolher mês')}
          <div class="panel-body">
            <div class="picker-year">
              <button class="icon-btn" data-y="-1" ${y <= C.MIN_YEAR ? 'disabled' : ''} aria-label="Ano anterior"><img src="assets/arrow_left.png" alt=""></button>
              <strong>${y}</strong>
              <button class="icon-btn" data-y="1" ${y >= C.MAX_YEAR ? 'disabled' : ''} aria-label="Próximo ano"><img src="assets/arrow_right.png" alt=""></button>
            </div>
            <div class="picker-months">
              ${C.MONTHS.map((n, i) => `<button data-month="${i}" class="${y === year && i === month ? 'on' : ''} ${y === t.year && i === t.month ? 'now' : ''}">${n.slice(0, 3)}</button>`).join('')}
            </div>
          </div>
          <div class="panel-foot"><button class="wood-btn green" data-act="today">Ir para hoje</button></div></div>`;
      },
      bind(el) {
        bindClose(el);
        el.querySelectorAll('[data-y]').forEach((b) => b.addEventListener('click', () => {
          y = Math.min(C.MAX_YEAR, Math.max(C.MIN_YEAR, y + +b.dataset.y)); Sound.play('page'); render();
        }));
        el.querySelectorAll('[data-month]').forEach((b) => b.addEventListener('click', () => { onPick(y, +b.dataset.month); close(); }));
        el.querySelector('[data-act="today"]').addEventListener('click', () => { const t = C.todayParts(); onPick(t.year, t.month); close(); });
      },
    });
  }

  Store.onChange(() => { if (stack.length) render(); });

  root.FarmPanels = { openDay, openEvents, openEventForm, openHolidays, openPicker, toast, isOpen: () => stack.length > 0 };
})(typeof self !== 'undefined' ? self : this);
