/*
 * FarmDays — feriados e datas comemorativas do Brasil.
 *
 * Tipos:
 *   'nacional'     -> feriado nacional (lei federal / portaria anual do governo federal)
 *   'facultativo'  -> ponto facultativo (NÃO é feriado; vale p/ órgãos públicos federais)
 *   'comemorativa' -> data comemorativa (não é feriado nem ponto facultativo)
 *
 * Fontes:
 *   - Lei nº 662/1949 (redação da Lei nº 10.607/2002): 1/1, 21/4, 1/5, 7/9, 2/11, 15/11, 25/12
 *   - Lei nº 6.802/1980: 12/10 (Nossa Senhora Aparecida)
 *   - Lei nº 14.759/2023: 20/11 (Zumbi e Consciência Negra), feriado nacional desde 2024
 *   - Paixão de Cristo: listada como feriado nacional nas portarias anuais do governo federal
 *   - Portaria MGI nº 11.460, de 29/12/2025: calendário oficial de 2026
 *
 * Pontos facultativos dependem de portaria publicada a cada ano. Para anos sem
 * portaria cadastrada, o app mostra apenas os pontos facultativos tradicionais
 * marcados como "previsão" — nunca como feriado.
 *
 * Estrutura para feriados estaduais e municipais: preencher REGIONAL abaixo
 * (ver README). Nada foi inventado: as listas começam vazias.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FarmHolidays = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function pad(n) { return String(n).padStart(2, '0'); }
  function key(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function ymd(y, m, d) { return key(new Date(y, m - 1, d)); }

  /** Domingo de Páscoa (algoritmo gregoriano anônimo / Meeus-Jones-Butcher). */
  function easter(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  function plusDays(date, n) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  }

  /** n-ésimo domingo do mês (month 1-12). */
  function nthSunday(year, month, n) {
    const first = new Date(year, month - 1, 1);
    const offset = (7 - first.getDay()) % 7;
    return new Date(year, month - 1, 1 + offset + 7 * (n - 1));
  }

  // ------------------------------------------------------------ feriados nacionais
  const FIXED_NATIONAL = [
    { m: 1, d: 1, name: 'Confraternização Universal', source: 'Lei nº 662/1949' },
    { m: 4, d: 21, name: 'Tiradentes', source: 'Lei nº 662/1949' },
    { m: 5, d: 1, name: 'Dia do Trabalho', source: 'Lei nº 662/1949' },
    { m: 9, d: 7, name: 'Independência do Brasil', source: 'Lei nº 662/1949' },
    { m: 10, d: 12, name: 'Nossa Senhora Aparecida', source: 'Lei nº 6.802/1980' },
    { m: 11, d: 2, name: 'Finados', source: 'Lei nº 662/1949' },
    { m: 11, d: 15, name: 'Proclamação da República', source: 'Lei nº 662/1949' },
    { m: 11, d: 20, name: 'Dia Nacional de Zumbi e da Consciência Negra', source: 'Lei nº 14.759/2023', since: 2024 },
    { m: 12, d: 25, name: 'Natal', source: 'Lei nº 662/1949' },
  ];

  // --------------------------------------------- portarias anuais já publicadas
  // Calendário oficial do governo federal por ano. Quando existir, substitui a
  // previsão de pontos facultativos daquele ano.
  const OFFICIAL = {
    2026: {
      source: 'Portaria MGI nº 11.460/2025',
      facultativos: [
        ['2026-02-16', 'Carnaval', ''],
        ['2026-02-17', 'Carnaval', ''],
        ['2026-02-18', 'Quarta-feira de Cinzas', 'Ponto facultativo até as 14h'],
        ['2026-04-20', 'Véspera de Tiradentes', 'Emenda do feriado'],
        ['2026-06-04', 'Corpus Christi', ''],
        ['2026-06-05', 'Emenda de Corpus Christi', ''],
        ['2026-10-28', 'Dia do Servidor Público', ''],
        ['2026-12-24', 'Véspera de Natal', 'Ponto facultativo em parte do dia'],
        ['2026-12-31', 'Véspera de Ano Novo', 'Ponto facultativo em parte do dia'],
      ],
    },
  };

  function predictedFacultativos(year) {
    const e = easter(year);
    return [
      [key(plusDays(e, -48)), 'Carnaval', ''],
      [key(plusDays(e, -47)), 'Carnaval', ''],
      [key(plusDays(e, -46)), 'Quarta-feira de Cinzas', 'Tradicionalmente até as 14h'],
      [key(plusDays(e, 60)), 'Corpus Christi', ''],
      [ymd(year, 10, 28), 'Dia do Servidor Público', 'A data pode ser transferida pela portaria'],
      [ymd(year, 12, 24), 'Véspera de Natal', 'Parte do dia'],
      [ymd(year, 12, 31), 'Véspera de Ano Novo', 'Parte do dia'],
    ];
  }

  // ----------------------------------------------------- datas comemorativas
  function commemorative(year) {
    const e = easter(year);
    return [
      [ymd(year, 3, 8), 'Dia Internacional da Mulher'],
      [ymd(year, 4, 19), 'Dia dos Povos Indígenas'],
      [ymd(year, 4, 22), 'Descobrimento do Brasil'],
      [key(e), 'Páscoa'],
      [key(nthSunday(year, 5, 2)), 'Dia das Mães'],
      [ymd(year, 6, 5), 'Dia Mundial do Meio Ambiente'],
      [ymd(year, 6, 12), 'Dia dos Namorados'],
      [ymd(year, 6, 24), 'Dia de São João'],
      [key(nthSunday(year, 8, 2)), 'Dia dos Pais'],
      [ymd(year, 8, 22), 'Dia do Folclore'],
      [ymd(year, 9, 21), 'Dia da Árvore'],
      [ymd(year, 10, 12), 'Dia das Crianças'],
      [ymd(year, 10, 15), 'Dia do Professor'],
      [ymd(year, 11, 19), 'Dia da Bandeira'],
    ];
  }

  // -------------------------------------- estrutura p/ feriados regionais
  // Formato: { 'SP': [ { m: 7, d: 9, name: '...', source: 'Lei estadual nº ...' } ] }
  // Municípios: { 'SP/São Paulo': [ ... ] }
  const REGIONAL = { estados: {}, municipios: {} };

  const cache = {};

  /**
   * Todas as datas do ano, ordenadas.
   * opts: { uf: 'SP', municipio: 'SP/São Paulo' } (opcional, p/ o futuro)
   */
  function forYear(year, opts) {
    const ck = `${year}|${opts ? JSON.stringify(opts) : ''}`;
    if (cache[ck]) return cache[ck];
    const list = [];
    for (const h of FIXED_NATIONAL) {
      if (h.since && year < h.since) continue;
      list.push({ date: ymd(year, h.m, h.d), name: h.name, type: 'nacional', source: h.source, note: '' });
    }
    list.push({
      date: key(plusDays(easter(year), -2)), name: 'Paixão de Cristo', type: 'nacional',
      source: 'Calendário federal anual', note: 'Sexta-feira Santa',
    });

    const official = OFFICIAL[year];
    const fac = official ? official.facultativos : predictedFacultativos(year);
    for (const [date, name, note] of fac) {
      list.push({
        date, name, type: 'facultativo', note,
        source: official ? official.source : 'Previsão — confirmar na portaria do ano',
        provisional: !official,
      });
    }
    for (const [date, name] of commemorative(year)) {
      list.push({ date, name, type: 'comemorativa', source: '', note: '' });
    }

    const regional = [];
    if (opts && opts.uf && REGIONAL.estados[opts.uf]) regional.push(...REGIONAL.estados[opts.uf].map((h) => ({ ...h, type: 'estadual' })));
    if (opts && opts.municipio && REGIONAL.municipios[opts.municipio]) regional.push(...REGIONAL.municipios[opts.municipio].map((h) => ({ ...h, type: 'municipal' })));
    for (const h of regional) list.push({ date: ymd(year, h.m, h.d), name: h.name, type: h.type, source: h.source || '', note: '' });

    const order = { nacional: 0, estadual: 1, municipal: 2, facultativo: 3, comemorativa: 4 };
    list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : order[a.type] - order[b.type]));
    cache[ck] = list;
    return list;
  }

  function forMonth(year, month, opts) {
    const prefix = `${year}-${pad(month + 1)}-`;
    return forYear(year, opts).filter((h) => h.date.startsWith(prefix));
  }

  function byDate(year, opts) {
    const map = {};
    for (const h of forYear(year, opts)) (map[h.date] = map[h.date] || []).push(h);
    return map;
  }

  function sourceFor(year) {
    return OFFICIAL[year] ? OFFICIAL[year].source : null;
  }

  return { easter, forYear, forMonth, byDate, sourceFor, REGIONAL, OFFICIAL };
});
