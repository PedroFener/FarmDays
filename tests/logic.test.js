/* Testes da lógica de datas. Rodar: node --test tests/ (TZ=America/Sao_Paulo) */
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../www/js/calendar.js');
const S = require('../www/js/seasons.js');
const H = require('../www/js/holidays.js');

test('fevereiro 2026/2027 tem 28 dias e 2028 tem 29 (bissexto)', () => {
  assert.equal(C.daysInMonth(2026, 1), 28);
  assert.equal(C.daysInMonth(2027, 1), 28);
  assert.equal(C.daysInMonth(2028, 1), 29);
  assert.equal(C.isLeapYear(2028), true);
  assert.equal(C.isLeapYear(2027), false);
  assert.equal(C.isLeapYear(2100), false); // regra secular
  assert.equal(C.isLeapYear(2400), true);
});

test('meses com 30 e 31 dias', () => {
  const expected = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  expected.forEach((n, m) => assert.equal(C.daysInMonth(2026, m), n, `mês ${m + 1}`));
});

test('dias da semana corretos (semana começa no domingo)', () => {
  assert.equal(C.firstWeekday(2026, 0), 4);   // 1/1/2026 quinta
  assert.equal(C.firstWeekday(2026, 3), 3);   // 1/4/2026 quarta (igual à referência)
  assert.equal(C.firstWeekday(2027, 1), 1);   // 1/2/2027 segunda
  assert.equal(C.firstWeekday(2028, 1), 2);   // 1/2/2028 terça
  assert.equal(C.weekday(2028, 1, 29), 2);    // 29/2/2028 terça
  assert.equal(C.weekday(2026, 10, 17), 2);   // 17/11/2026 terça
  assert.deepEqual(C.WEEKDAYS_LETTER, ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']);
});

test('grade do mês: 42 células, posição do dia 1 e último dia', () => {
  const g = C.monthGrid(2028, 1);
  assert.equal(g.length, 42);
  assert.equal(g.findIndex((c) => c.day === 1), 2);
  assert.equal(g.filter((c) => c.day).length, 29);
  assert.equal(g.find((c) => c.day === 29).key, '2028-02-29');
  const g27 = C.monthGrid(2027, 1);
  assert.equal(g27.filter((c) => c.day).length, 28);
  assert.equal(C.weeksInMonth(2026, 1), 4); // fev/2026 começa no domingo: 4 semanas exatas
});

test('virada dezembro/2026 -> janeiro/2027 e volta', () => {
  assert.deepEqual(C.addMonths(2026, 11, 1), { year: 2027, month: 0 });
  assert.deepEqual(C.addMonths(2027, 0, -1), { year: 2026, month: 11 });
  assert.deepEqual(C.addMonths(2026, 10, 14), { year: 2028, month: 0 });
  assert.equal(C.canGo(2026, 0, -1), false); // não antes de 2026
  assert.equal(C.canGo(2026, 11, 1), true);
});

test('chaves de data e validação', () => {
  assert.equal(C.key(2027, 0, 5), '2027-01-05');
  assert.deepEqual(C.parseKey('2028-02-29'), { year: 2028, month: 1, day: 29 });
  assert.equal(C.parseKey('2027-02-29'), null);
  assert.equal(C.formatLong('2026-12-31'), 'Quinta-feira, 31 de dezembro de 2026');
});

test('hoje é calculado automaticamente', () => {
  assert.equal(C.todayKey(new Date(2027, 0, 1, 0, 0, 5)), '2027-01-01');
  assert.equal(C.todayKey(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
  const ms = C.msUntilMidnight(new Date(2026, 11, 31, 23, 59, 0));
  assert.ok(ms > 59000 && ms < 62000);
});

test('Páscoa', () => {
  const k = (d) => C.key(d.getFullYear(), d.getMonth(), d.getDate());
  assert.equal(k(H.easter(2026)), '2026-04-05');
  assert.equal(k(H.easter(2027)), '2027-03-28');
  assert.equal(k(H.easter(2028)), '2028-04-16');
  assert.equal(k(H.easter(2030)), '2030-04-21');
});

test('feriados nacionais 2026 batem com a portaria (10 feriados)', () => {
  const nat = H.forYear(2026).filter((h) => h.type === 'nacional').map((h) => h.date);
  assert.deepEqual(nat, ['2026-01-01', '2026-04-03', '2026-04-21', '2026-05-01', '2026-09-07',
    '2026-10-12', '2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25']);
  const fac = H.forYear(2026).filter((h) => h.type === 'facultativo');
  assert.equal(fac.length, 9);
  assert.ok(fac.every((h) => !h.provisional));
});

test('pontos facultativos nunca aparecem como feriado nacional', () => {
  for (const y of [2026, 2027, 2028]) {
    const list = H.forYear(y);
    for (const name of ['Carnaval', 'Corpus Christi', 'Quarta-feira de Cinzas']) {
      assert.ok(list.filter((h) => h.name === name).every((h) => h.type === 'facultativo'), `${name} ${y}`);
    }
  }
  const c27 = H.forYear(2027).filter((h) => h.name === 'Carnaval').map((h) => h.date);
  assert.deepEqual(c27, ['2027-02-08', '2027-02-09']);
  assert.ok(H.forYear(2027).filter((h) => h.type === 'facultativo').every((h) => h.provisional));
});

test('datas comemorativas móveis', () => {
  const d = (y, n) => H.forYear(y).find((h) => h.name === n).date;
  assert.equal(d(2026, 'Dia das Mães'), '2026-05-10');
  assert.equal(d(2026, 'Dia dos Pais'), '2026-08-09');
  assert.equal(d(2027, 'Dia das Mães'), '2027-05-09');
});

test('estações do hemisfério sul (datas locais de Brasília)', () => {
  const s = S.starts(2026).map((x) => C.key(x.date.getFullYear(), x.date.getMonth(), x.date.getDate()));
  assert.deepEqual(s, ['2026-03-20', '2026-06-21', '2026-09-22', '2026-12-21']);
  assert.equal(S.seasonOf(2026, 10, 17).name, 'Primavera');
  assert.equal(S.seasonOf(2026, 11, 20).name, 'Primavera');
  assert.equal(S.seasonOf(2026, 11, 21).name, 'Verão');
  assert.equal(S.seasonOf(2027, 0, 15).name, 'Verão');
  assert.equal(S.seasonOf(2027, 3, 1).name, 'Outono');
  assert.equal(S.seasonOf(2027, 6, 1).name, 'Inverno');
  assert.equal(S.changeInMonth(2026, 11).day, 21);
  assert.equal(S.changeInMonth(2026, 10), null);
  // instante do equinócio de março/2026: 20/03 14:46 UTC (±5 min)
  const t = S.eventInstant(2026, 0).getTime();
  assert.ok(Math.abs(t - Date.UTC(2026, 2, 20, 14, 46)) < 5 * 60000);
});
