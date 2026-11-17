/*
 * FarmDays — lógica do calendário gregoriano.
 * Tudo é calculado com JavaScript Date: nenhum mês tem dias cadastrados à mão.
 * Funciona no navegador (window.FarmCalendar) e no Node (module.exports).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FarmCalendar = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  // Semana começa no domingo, como na referência visual.
  const WEEKDAYS_LETTER = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  const MIN_YEAR = 2026;
  const MAX_YEAR = 2199;

  /** Quantidade de dias do mês (month: 0-11). Dia 0 do mês seguinte = último dia deste mês. */
  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /** Ano bissexto calculado pelo próprio Date (29/02 existe?). */
  function isLeapYear(year) {
    return new Date(year, 1, 29).getDate() === 29;
  }

  /** Dia da semana do dia 1 (0 = domingo). */
  function firstWeekday(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function weekday(year, month, day) {
    return new Date(year, month, day).getDay();
  }

  /** Soma meses tratando a virada de ano (dez/2026 + 1 = jan/2027). */
  function addMonths(year, month, delta) {
    const d = new Date(year, month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }

  function clampMonth(year, month) {
    if (year < MIN_YEAR) return { year: MIN_YEAR, month: 0 };
    if (year > MAX_YEAR) return { year: MAX_YEAR, month: 11 };
    return { year, month };
  }

  function canGo(year, month, delta) {
    const t = addMonths(year, month, delta);
    return t.year >= MIN_YEAR && t.year <= MAX_YEAR;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  /** Chave 'AAAA-MM-DD' (month: 0-11). */
  function key(year, month, day) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }

  function parseKey(k) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k || '');
    if (!m) return null;
    const year = +m[1], month = +m[2] - 1, day = +m[3];
    const d = new Date(year, month, day);
    if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
    return { year, month, day };
  }

  function todayParts(now) {
    const d = now || new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }

  function todayKey(now) {
    const t = todayParts(now);
    return key(t.year, t.month, t.day);
  }

  /**
   * Grade do mês: sempre 42 células (6 semanas x 7 dias, domingo primeiro),
   * para o layout não "pular" entre meses. Células fora do mês têm day = null.
   */
  function monthGrid(year, month) {
    const first = firstWeekday(year, month);
    const total = daysInMonth(year, month);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const day = i - first + 1;
      if (day >= 1 && day <= total) {
        cells.push({ day, key: key(year, month, day), weekday: i % 7 });
      } else {
        cells.push({ day: null, key: null, weekday: i % 7 });
      }
    }
    return cells;
  }

  /** Quantas semanas o mês realmente ocupa (4, 5 ou 6). */
  function weeksInMonth(year, month) {
    return Math.ceil((firstWeekday(year, month) + daysInMonth(year, month)) / 7);
  }

  function formatLong(k) {
    const p = parseKey(k);
    if (!p) return '';
    return `${WEEKDAYS[weekday(p.year, p.month, p.day)]}, ${p.day} de ${MONTHS[p.month].toLowerCase()} de ${p.year}`;
  }

  function formatShort(k) {
    const p = parseKey(k);
    if (!p) return '';
    return `${pad(p.day)}/${pad(p.month + 1)}`;
  }

  /** Milissegundos até a próxima meia-noite local (para atualizar o "hoje"). */
  function msUntilMidnight(now) {
    const d = now || new Date();
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 1);
    return next - d;
  }

  return {
    MONTHS, MONTHS_SHORT, WEEKDAYS, WEEKDAYS_LETTER, MIN_YEAR, MAX_YEAR,
    daysInMonth, isLeapYear, firstWeekday, weekday, addMonths, clampMonth, canGo,
    key, parseKey, pad, todayParts, todayKey, monthGrid, weeksInMonth,
    formatLong, formatShort, msUntilMidnight,
  };
});
