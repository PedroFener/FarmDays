/*
 * FarmDays — armazenamento local persistente.
 * - No Android (Capacitor): @capacitor/preferences (SharedPreferences nativo),
 *   que não é apagado pelo sistema como o cache do WebView pode ser.
 * - Sempre espelha em localStorage (cópia síncrona e modo navegador).
 */
(function (root) {
  'use strict';
  const EVENTS_KEY = 'farmdays.events.v1';
  const SETTINGS_KEY = 'farmdays.settings.v1';

  function prefs() {
    const cap = root.Capacitor;
    if (cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.Preferences) {
      return cap.Plugins.Preferences;
    }
    return null;
  }

  function readLocal(k, fallback) {
    try {
      const raw = root.localStorage.getItem(k);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function writeLocal(k, v) {
    try { root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* armazenamento cheio/indisponível */ }
  }

  async function read(k, fallback) {
    const p = prefs();
    if (p) {
      try {
        const { value } = await p.get({ key: k });
        if (value != null) {
          const parsed = JSON.parse(value);
          writeLocal(k, parsed);
          return parsed;
        }
        // primeira execução com Preferences: migra o que houver no localStorage
        const local = readLocal(k, fallback);
        if (local !== fallback) await p.set({ key: k, value: JSON.stringify(local) });
        return local;
      } catch (e) { /* cai para localStorage */ }
    }
    return readLocal(k, fallback);
  }

  async function write(k, v) {
    writeLocal(k, v);
    const p = prefs();
    if (p) {
      try { await p.set({ key: k, value: JSON.stringify(v) }); } catch (e) { /* mantém cópia local */ }
    }
  }

  // ---------------------------------------------------------------- eventos
  let events = [];
  let settings = { sound: false };
  const listeners = [];

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function sortEvents(list) {
    return list.slice().sort((a, b) => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99')));
  }

  function emit() { listeners.forEach((fn) => fn(events)); }

  function sanitize(e) {
    return {
      id: e.id || uid(),
      title: String(e.title || '').trim().slice(0, 80),
      date: String(e.date || ''),
      time: /^\d{2}:\d{2}$/.test(e.time || '') ? e.time : '',
      description: String(e.description || '').trim().slice(0, 1000),
      createdAt: e.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const Store = {
    async init() {
      const ev = await read(EVENTS_KEY, []);
      events = Array.isArray(ev) ? sortEvents(ev.filter((e) => e && e.id && e.date)) : [];
      const st = await read(SETTINGS_KEY, null);
      if (st && typeof st === 'object') settings = Object.assign(settings, st);
    },
    onChange(fn) { listeners.push(fn); },
    all() { return events.slice(); },
    get(id) { return events.find((e) => e.id === id) || null; },
    byDate(dateKey) { return events.filter((e) => e.date === dateKey); },
    byMonth(year, month) {
      const p = `${year}-${String(month + 1).padStart(2, '0')}-`;
      return events.filter((e) => e.date.startsWith(p));
    },
    countsByDate() {
      const m = {};
      for (const e of events) m[e.date] = (m[e.date] || 0) + 1;
      return m;
    },
    async save(data) {
      const clean = sanitize(data);
      if (!clean.title) throw new Error('Dê um nome ao evento.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(clean.date)) throw new Error('Escolha uma data válida.');
      const i = events.findIndex((e) => e.id === clean.id);
      if (i >= 0) { clean.createdAt = events[i].createdAt; events[i] = clean; } else events.push(clean);
      events = sortEvents(events);
      await write(EVENTS_KEY, events);
      emit();
      return clean;
    },
    async remove(id) {
      events = events.filter((e) => e.id !== id);
      await write(EVENTS_KEY, events);
      emit();
    },
    settings() { return Object.assign({}, settings); },
    async setSetting(k, v) {
      settings[k] = v;
      await write(SETTINGS_KEY, settings);
    },
  };

  root.FarmStore = Store;
})(typeof self !== 'undefined' ? self : this);
