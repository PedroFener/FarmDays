/*
 * FarmDays — estações do ano no HEMISFÉRIO SUL.
 * As datas de início vêm dos equinócios e solstícios calculados pelo algoritmo
 * de Jean Meeus (Astronomical Algorithms, cap. 27), precisão de minutos.
 * O instante astronômico é convertido para a data LOCAL do aparelho
 * (ex.: equinócio de set/2026 = 23/09 00:05 UTC = 22/09 21:05 em Brasília).
 *
 * Hemisfério sul:
 *   equinócio de março   -> Outono
 *   solstício de junho   -> Inverno
 *   equinócio de setembro-> Primavera
 *   solstício de dezembro-> Verão
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FarmSeasons = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TERMS = [
    [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186],
    [182, 27.85, 445267.112], [156, 73.14, 45036.886], [136, 171.52, 22518.443],
    [77, 222.54, 65928.934], [74, 296.72, 3034.906], [70, 243.58, 9037.513],
    [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
    [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417],
    [18, 155.12, 67555.328], [17, 288.79, 4562.452], [16, 198.04, 62894.029],
    [14, 199.76, 31436.921], [12, 95.39, 14577.848], [12, 287.11, 31931.756],
    [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074],
  ];

  const RAD = Math.PI / 180;

  /** which: 0=março, 1=junho, 2=setembro, 3=dezembro. Retorna Date (instante UTC). */
  function eventInstant(year, which) {
    const Y = (year - 2000) / 1000;
    let jde0;
    switch (which) {
      case 0: jde0 = 2451623.80984 + 365242.37404 * Y + 0.05169 * Y * Y - 0.00411 * Y ** 3 - 0.00057 * Y ** 4; break;
      case 1: jde0 = 2451716.56767 + 365241.62603 * Y + 0.00325 * Y * Y + 0.00888 * Y ** 3 - 0.00030 * Y ** 4; break;
      case 2: jde0 = 2451810.21715 + 365242.01767 * Y - 0.11575 * Y * Y + 0.00337 * Y ** 3 + 0.00078 * Y ** 4; break;
      default: jde0 = 2451900.05952 + 365242.74049 * Y - 0.06223 * Y * Y - 0.00823 * Y ** 3 + 0.00032 * Y ** 4;
    }
    const T = (jde0 - 2451545.0) / 36525;
    const W = (35999.373 * T - 2.47) * RAD;
    const dL = 1 + 0.0334 * Math.cos(W) + 0.0007 * Math.cos(2 * W);
    let S = 0;
    for (const [A, B, C] of TERMS) S += A * Math.cos((B + C * T) * RAD);
    const jde = jde0 + (0.00001 * S) / dL;
    // JDE está em Tempo Terrestre; ΔT ≈ 69 s nesta época (desprezível p/ a data).
    const deltaT = 69 / 86400;
    return new Date((jde - deltaT - 2440587.5) * 86400000);
  }

  const NAMES = ['Outono', 'Inverno', 'Primavera', 'Verão'];
  const IDS = ['outono', 'inverno', 'primavera', 'verao'];

  const cache = {};
  /** Datas locais (Date à meia-noite) de início das 4 estações do ano. */
  function starts(year) {
    if (cache[year]) return cache[year];
    const res = [0, 1, 2, 3].map((w) => {
      const t = eventInstant(year, w);
      return {
        id: IDS[w],
        name: NAMES[w],
        instant: t,
        date: new Date(t.getFullYear(), t.getMonth(), t.getDate()),
      };
    });
    cache[year] = res;
    return res;
  }

  /** Estação em uma data (year, month 0-11, day). */
  function seasonOf(year, month, day) {
    const d = new Date(year, month, day);
    const s = starts(year);
    let idx = 3; // antes do equinócio de março = Verão
    for (let i = 0; i < 4; i++) if (d >= s[i].date) idx = i;
    return { id: IDS[idx], name: NAMES[idx] };
  }

  /** Se uma estação começa dentro do mês, retorna {id, name, day}. */
  function changeInMonth(year, month) {
    const s = starts(year).find((x) => x.date.getMonth() === month);
    return s ? { id: s.id, name: s.name, day: s.date.getDate(), instant: s.instant } : null;
  }

  return { eventInstant, starts, seasonOf, changeInMonth, NAMES, IDS };
});
