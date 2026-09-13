/* Watershed — a record of what your time was for.
 *
 * No framework, no build step. One state object in localStorage, one render
 * pass, event delegation for everything.
 *
 * Two structural rules keep the app from feeling like a maze:
 *   1. THE RECORD IS HOME. It is the only screen with no back, and the only
 *      one you can reach from the wordmark. The day's question lives inside
 *      it, in the dock, and disappears when the day is answered.
 *   2. EVERY SCREEN IS A BAR, A SCROLLING BODY AND A DOCK. The dock holds
 *      whatever that screen is for. Those three never swap places.
 */

(() => {
  'use strict';

  /* ---- themes ---------------------------------------------------------
     The same three Cadence ships, for the same reason: a theme is only a
     different set of values for the custom properties, written onto :root. */

  const THEMES = [
    {
      id: 'tokyo-night', label: 'TOKYO NIGHT', detail: 'Deep indigo. The original.',
      t: { bg: '#1a1b26', panel: '#1f2335', line: '#2f3549', lineBright: '#3b4261',
           text: '#c0caf5', mid: '#787c99', dim: '#636c97', dimmest: '#4a5178',
           weekend: '#1d1e2a', green: '#9ece6a', teal: '#73daca', orange: '#ff9e64',
           purple: '#bb9af7', job: '#7aa2f7' }
    },
    {
      id: 'slate', label: 'SLATE', detail: 'Neutral grey. Light without the tint.',
      t: { bg: '#d6d6d6', panel: '#c8c8c8', line: '#9c9c9c', lineBright: '#7a7a7a',
           text: '#1c1c1c', mid: '#454545', dim: '#565656', dimmest: '#6e6e6e',
           weekend: '#cacaca', green: '#20702c', teal: '#1e6464', orange: '#8e3518',
           purple: '#6d3d8d', job: '#175098' }
    },
    {
      id: 'catppuccin-latte', label: 'CATPPUCCIN LATTE', detail: 'Light. Readable in daylight.',
      t: { bg: '#eff1f5', panel: '#e6e9ef', line: '#bcc0cc', lineBright: '#9ca0b0',
           text: '#4c4f69', mid: '#6c6f85', dim: '#808395', dimmest: '#9ca0b0',
           weekend: '#e2e5ec', green: '#379720', teal: '#179299', orange: '#e05a0b',
           purple: '#8839ef', job: '#1e66f5' }
    }
  ];
  const VAR = { bg: '--bg', panel: '--panel', line: '--line', lineBright: '--line-bright',
                text: '--text', mid: '--mid', dim: '--dim', dimmest: '--dimmest',
                weekend: '--weekend', green: '--green', teal: '--teal', orange: '--orange',
                purple: '--purple', job: '--job' };

  let theme = THEMES[0];

  function applyTheme(id) {
    theme = THEMES.find(t => t.id === id) || THEMES[0];
    const root = document.documentElement;
    for (const k in VAR) root.style.setProperty(VAR[k], theme.t[k]);
    root.style.colorScheme = theme.id === 'tokyo-night' ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.t.bg);
    try { localStorage.setItem('watershed.theme', theme.id); } catch (e) { /* fine */ }
  }

  /* ---- the model ------------------------------------------------------ */

  const LANES = [
    { id: 'craft',    name: 'CRAFT',    tok: 'green' },
    { id: 'recovery', name: 'RECOVERY', tok: 'teal' },
    { id: 'body',     name: 'BODY',     tok: 'orange' },
    { id: 'love',     name: 'LOVE',     tok: 'purple' }
  ];
  // The job is still a condition rather than a lane — one verdict a day, no
  // size — but it is logged the same way everything else is, from the same
  // screen. Making it a special gesture on one cell only made it invisible.
  const JOBLANE = { id: 'job', name: 'JOB', tok: 'job' };
  const laneColor = id => theme.t[(LANES.find(l => l.id === id) || LANES[0]).tok];
  const JOBC = () => theme.t.job;

  // Half-days, not hours. One working day is MOST OF A DAY, once.
  const SIZES = [
    { id: 'a', label: 'A BIT',         about: '~1h', hours: 1, day: 9,  week: 12, cell: 14 },
    { id: 'b', label: 'HALF A DAY',    about: '~4h', hours: 4, day: 15, week: 20, cell: 26 },
    { id: 'c', label: 'MOST OF A DAY', about: '~8h', hours: 8, day: 21, week: 28, cell: 38 }
  ];
  const size = id => SIZES.find(s => s.id === id) || SIZES[0];

  const FADE_DAY = 0.45;
  const FADE_WEEK = 0.32;
  const alpha = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  };

  // Reach-back: three weeks. Beyond that a day is closed, because an open date
  // picker turns silence into a queue you can always catch up on.
  const REACH = 21;

  /* ---- dates ---------------------------------------------------------- */

  const DOW = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const DOW3 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const pad = n => String(n).padStart(2, '0');
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };

  // The day rolls at 4am: logging at 1am belongs to the day you have been
  // living, not the one the clock just started.
  function today() {
    const n = new Date();
    if (n.getHours() < 4) n.setDate(n.getDate() - 1);
    return keyOf(n);
  }

  const shortDay = k => { const d = parseKey(k); return `${DOW[d.getDay()]} ${d.getDate()}`; };
  const longDay = k => { const d = parseKey(k); return `${DOW3[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const dayMonth = k => { const d = parseKey(k); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const isWeekend = k => { const g = parseKey(k).getDay(); return g === 0 || g === 6; };
  const mondayOf = k => addDays(k, -((parseKey(k).getDay() + 6) % 7));

  /* ---- state ---------------------------------------------------------- */

  const DEMO = new URLSearchParams(location.search).has('demo');
  const KEY = DEMO ? 'watershed.demo.v1' : 'watershed.v1';

  function blank() {
    return { version: 1, opened: today(), blocks: [], job: {}, answered: {},
             lanes: LANES.map(l => ({ id: l.id, why: '', whyHistory: [], goal: null })) };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(blank(), JSON.parse(raw));
    } catch (e) { /* a first run in a private window looks the same as no data */ }
    return DEMO ? demoData() : blank();
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* nothing to do */ }
  }

  let state = load();
  const laneMeta = id => LANES.find(l => l.id === id);
  const laneState = id => state.lanes.find(l => l.id === id);

  /* ---- navigation, and the back button ---------------------------------
     Android's back button and back-swipe are the same popstate event, so one
     history entry per screen is all it takes. Home is the bottom of the
     stack: back from there leaves the app, which is what a phone expects. */

  let view = { screen: 'home' };
  let depth = 0;

  function go(next) {
    view = Object.assign({}, next);
    depth += 1;
    history.pushState({ view, depth }, '');
    render();
  }

  function goHome() {
    if (depth > 0) { const d = depth; depth = 0; history.go(-d); }
    else { view = { screen: 'home' }; render(); }
  }

  window.addEventListener('popstate', e => {
    view = (e.state && e.state.view) || { screen: 'home' };
    depth = (e.state && e.state.depth) || 0;
    render();
  });

  /* ---- what the record shows ------------------------------------------ */

  // One cell per lane per day. Several blocks in a lane on one day add up:
  // the footprint is the total, the fill is whichever way the hours leaned.
  function markFor(laneId, dateKey) {
    const bs = state.blocks.filter(b => b.lane === laneId && b.date === dateKey);
    if (!bs.length) return null;
    const hours = bs.reduce((t, b) => t + size(b.size).hours, 0);
    const dim = bs.filter(b => b.valence === 'diminished').reduce((t, b) => t + size(b.size).hours, 0);
    const bucket = hours < 2.5 ? 'a' : hours < 6 ? 'b' : 'c';
    let valence = 'enlarged';
    if (dim * 2 > hours) valence = 'diminished';
    else if (dim * 2 === hours) valence = bs[bs.length - 1].valence;
    return { size: bucket, valence };
  }

  const isAnswered = k => Boolean(state.answered[k]) || state.blocks.some(b => b.date === k);

  const recordDays = n => Array.from({ length: n }, (_, i) => addDays(today(), -i));

  /* ---- writing -------------------------------------------------------- */

  function logBlock(laneId, sizeId, valence, dateKey) {
    state.blocks.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: dateKey, lane: laneId, size: sizeId, valence, at: new Date().toISOString()
    });
    state.answered[dateKey] = true;
    save();
  }

  function setJob(dateKey, verdict) {
    if (verdict === 'clear') delete state.job[dateKey];
    else state.job[dateKey] = verdict;
    save();
  }

  function setWhy(laneId, text) {
    const l = laneState(laneId);
    const clean = text.trim();
    if (!clean || clean === l.why) return;
    // A changed why is an event, not an edit. The old one keeps the blocks it
    // earned; you find out it stopped being true by reading it and flinching.
    if (l.why) l.whyHistory.push({ text: l.why, from: l.whyFrom || state.opened, to: today() });
    l.why = clean;
    l.whyFrom = today();
    save();
  }

  /* ---- the shell ------------------------------------------------------ */

  const el = document.getElementById('app');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const GEAR = `<svg width="19" height="19" viewBox="0 0 18 18" fill="none" stroke="currentColor"
    stroke-width="1.6" stroke-linecap="square"><path d="M1.5 5h7M13 5h3.5M1.5 13h3.5M9.5 13h7"/>
    <rect x="8.5" y="2.5" width="3.5" height="5"/><rect x="5" y="10.5" width="3.5" height="5"/></svg>`;

  function shell(opts) {
    return `
      <div class="bar">
        ${opts.back ? `<button class="chev" data-a="back" aria-label="Back">‹</button>` : ''}
        <button class="wordmark ${opts.back ? 'tappable' : ''}" data-a="home">WATERSHED</button>
        <span class="grow"></span>
        ${opts.right || ''}
      </div>
      <div class="body">${opts.body}</div>
      ${opts.dock ? `<div class="dock">${opts.dock}</div>` : ''}`;
  }

  const scaleChips = on => `
    <div class="chips">
      <button class="chip ${on === 'weeks' ? 'on' : ''}" data-a="home">3 WEEKS</button>
      <span class="sep">/</span>
      <button class="chip ${on === 'year' ? 'on' : ''}" data-a="go:year">THE YEAR</button>
    </div>`;

  const gearButton = `<button class="icon" data-a="go:settings" aria-label="Settings">${GEAR}</button>`;

  const legend = fadeAt => `
    <div class="legend">
      <span><i class="swatch" style="background:${theme.t.text}"></i>ENLARGED</span>
      <span><i class="swatch" style="background:${alpha(theme.t.text, fadeAt)}"></i>DIMINISHED</span>
    </div>`;

  function render() {
    const screens = { home, pick, log, jobday, goal, year, week, detail, why, settings };
    el.innerHTML = (screens[view.screen] || home)();
    const body = el.querySelector('.body');
    if (body) body.scrollTop = 0;
    const field = el.querySelector('#why-input, #goal-input');
    if (field) { field.focus(); if (field.setSelectionRange) field.setSelectionRange(field.value.length, field.value.length); }
  }

  /* ---- home: the record, and the question in the dock ----------------- */

  function home() {
    const t = today();
    const days = recordDays(REACH);
    const answered = isAnswered(t);
    return shell({
      right: `${scaleChips('weeks')}${gearButton}`,
      body: `
        <div class="date" style="margin-top:14px">${longDay(t)}</div>
        ${laneHeaderRow()}
        ${dayGrid(days, t, { tappable: true })}
        ${legend(FADE_DAY)}`,
      dock: answered
        ? `<div class="label" style="text-align:center">TAP ANY DAY TO LOG TO IT</div>`
        : `<div class="question">What were the last few hours for?</div>
           <button class="btn" style="margin-top:12px" data-a="day:${t}">LOG TODAY</button>`
    });
  }

  function laneHeaderRow() {
    return `
      <div class="label" style="margin-top:20px">TAP A NAME TO SEE WHY THAT LANE EXISTS</div>
      <div class="cols">
        <div class="col-days"></div>
        <div class="col-job"><div class="tag">JOB</div></div>
        <div class="col-gap"></div>
        <div class="col-lanes">
          ${LANES.map(l => `<button data-a="go:detail:${l.id}" style="color:${laneColor(l.id)}"><span>${l.name}</span></button>`).join('')}
        </div>
      </div>`;
  }

  function dayGrid(days, t, opts) {
    const o = opts || {};
    return `
      <div class="grid ${o.week ? 'week-grid' : ''}">
        <div class="bands">
          ${days.map(k => `<div class="band" style="background:${isWeekend(k) ? 'var(--weekend)' : 'transparent'}"></div>`).join('')}
        </div>
        ${o.tappable ? `<div class="hits">${days.map(k => `<button class="hit" data-a="day:${k}" aria-label="Log to ${longDay(k)}"></button>`).join('')}</div>` : ''}
        <div class="grid-body">
          <div class="days">
            ${days.map(k => `<div class="day ${k === t ? 'today' : isWeekend(k) ? 'weekend' : ''}">${shortDay(k)}</div>`).join('')}
          </div>
          <div class="ribbon">
            ${days.map(k => {
              const v = state.job[k];
              const bg = v === 'enlarged' ? JOBC() : v === 'diminished' ? alpha(JOBC(), FADE_DAY) : 'transparent';
              return o.week
                ? `<div class="ribbon-cell"><i style="background:${bg}"></i></div>`
                : `<div class="ribbon-cell" style="background:${bg}"></div>`;
            }).join('')}
          </div>
          <div class="col-gap"></div>
          <div class="marks">
            <div class="rails">
              ${LANES.map(l => `<div style="background:${alpha(laneColor(l.id), 0.055)}"><i style="background:${alpha(laneColor(l.id), 0.3)}"></i></div>`).join('')}
            </div>
            <div class="cells">
              ${days.map(k => LANES.map(l => {
                const m = markFor(l.id, k);
                if (!m) return `<div class="cell"></div>`;
                const px = o.week ? size(m.size).week : size(m.size).day;
                const c = laneColor(l.id);
                return `<div class="cell"><i class="mark" style="width:${px}px;height:${px}px;background:${m.valence === 'enlarged' ? c : alpha(c, FADE_DAY)}"></i></div>`;
              }).join('')).join('')}
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ---- pick: which lane were those hours for ------------------------- */

  function pick() {
    const d = view.when;
    return shell({
      back: true,
      body: `
        <div class="h1" style="margin-top:18px">${longDay(d)}</div>
        <div class="question" style="margin-top:22px">What were those hours for?</div>
        <div style="display:flex;flex-direction:column;gap:9px;margin-top:20px">
          ${LANES.map(l => {
            const m = markFor(l.id, d);
            const c = laneColor(l.id);
            const mark = m ? `<i style="width:${size(m.size).day}px;height:${size(m.size).day}px;background:${m.valence === 'enlarged' ? c : alpha(c, FADE_DAY)}"></i>` : '';
            return `<button class="btn" data-a="lane:${l.id}:${d}" style="justify-content:flex-start">
              <i class="dot" style="background:${c}"></i>
              <span style="color:${c};font-weight:500">${l.name}</span>
              <span class="grow"></span>${mark}
            </button>`;
          }).join('')}
        </div>

        <div class="label" style="margin-top:24px">AND THE DAY ITSELF</div>
        <button class="btn" data-a="go:jobday:${d}" style="justify-content:flex-start;margin-top:9px">
          <i class="dot" style="background:${JOBC()}"></i>
          <span style="color:${JOBC()};font-weight:500">${JOBLANE.name}</span>
          <span class="grow"></span>
          <span class="small">${jobLabel(state.job[d])}</span>
        </button>
        <div class="help">Whether you worked, and whether it enlarged or diminished you. No size — the job's is always the same.</div>
        <div style="height:14px"></div>`,
      dock: `<button class="btn quiet" data-a="nothing:${d}">NOTHING TO LOG FOR THIS DAY</button>`
    });
  }

  const jobLabel = v => v === 'enlarged' ? 'ENLARGED' : v === 'diminished' ? 'DIMINISHED' : 'NOT LOGGED';

  /* ---- the job, for any day ------------------------------------------- */

  function jobday() {
    const d = view.when;
    const c = JOBC();
    return shell({
      back: true,
      body: `
        <div class="lane-head">
          <i class="dot" style="background:${c}"></i>
          <div class="h2" style="color:${c}">${JOBLANE.name}</div>
        </div>
        <div class="why-block" style="border-left-color:${c}">
          <div class="why-text">Did the work day enlarge you, or diminish you?</div>
        </div>
        <div class="band-label"><span>THE DAY</span><i></i></div>
        <div class="choices" style="margin-top:12px">
          <button data-a="setjob:enlarged"><i style="width:34px;height:26px;background:${c}"></i></button>
          <button data-a="setjob:diminished"><i style="width:34px;height:26px;background:${alpha(c, FADE_DAY)}"></i></button>
          <button data-a="setjob:clear"><i style="width:34px;height:26px;border:1px solid ${alpha(c, 0.6)}"></i></button>
        </div>
        <div class="sizes" style="margin-top:10px">
          <div><b>ENLARGED</b></div><div><b>DIMINISHED</b></div><div><b>NO WORK</b></div>
        </div>
        <div class="help">The hours never change, so there is nothing to measure. Only which way they went.</div>`,
      dock: `<div class="row-between"><div class="label">WRITING TO</div><div class="small">${longDay(d)}</div></div>`
    });
  }

  /* ---- log: the lane, its sentence, and the grid ---------------------- */

  function log() {
    const l = laneMeta(view.lane);
    const s = laneState(view.lane);
    const c = laneColor(l.id);
    const why = s.why
      ? `<div class="why-text">${esc(s.why)}</div>
         <div class="label" style="margin-top:10px">YOU WROTE THIS ${dayMonth(s.whyFrom || state.opened)}</div>`
      : `<div class="why-empty">Why does this lane exist? Write it — the sentence is the part that does the work.</div>
         <button class="link" style="margin-top:10px" data-a="go:why:${l.id}">WRITE IT</button>`;
    return shell({
      back: true,
      body: `
        <div class="lane-head">
          <i class="dot" style="background:${c}"></i>
          <div class="h2" style="color:${c}">${l.name}</div>
        </div>
        <div class="why-block" style="border-left-color:${c}">${why}</div>
        <div class="h2" style="margin-top:26px">HOW MUCH, AND HOW</div>
        <div class="sizes">${SIZES.map(z => `<div><b>${z.label}</b><i>${z.about}</i></div>`).join('')}</div>
        ${['enlarged', 'diminished'].map(v => `
          <div class="band-label"><span>${v.toUpperCase()}</span><i></i></div>
          <div class="choices">
            ${SIZES.map(z => `<button data-a="log:${z.id}:${v}">
              <i style="width:${z.cell}px;height:${z.cell}px;background:${v === 'enlarged' ? c : alpha(c, FADE_DAY)}"></i>
            </button>`).join('')}
          </div>`).join('')}
        <div style="height:14px"></div>`,
      dock: `<div class="row-between"><div class="label">WRITING TO</div><div class="small">${longDay(view.when)}</div></div>`
    });
  }

  /* ---- the year ------------------------------------------------------- */

  function weeksOf(y) {
    const out = [];
    let k = mondayOf(`${y}-01-01`);
    for (let i = 0; i < 53; i += 1) {
      if (i > 0 && parseKey(k).getFullYear() > y) break;
      out.push(k);
      k = addDays(k, 7);
    }
    return out;
  }

  const MAX_BAR = 62;
  const MAX_WEEK_HOURS = 20;

  function weekLane(laneId, start) {
    let hours = 0, dim = 0;
    for (let d = 0; d < 7; d += 1) {
      const k = addDays(start, d);
      for (const b of state.blocks) {
        if (b.lane !== laneId || b.date !== k) continue;
        hours += size(b.size).hours;
        if (b.valence === 'diminished') dim += size(b.size).hours;
      }
    }
    if (!hours) return { solid: 0, faded: 0 };
    const total = Math.max(2, Math.round(Math.min(1, hours / MAX_WEEK_HOURS) * MAX_BAR));
    const faded = Math.round(total * (dim / hours));
    return { solid: total - faded, faded };
  }

  function weekJob(start) {
    let e = 0, d = 0;
    for (let i = 0; i < 7; i += 1) {
      const v = state.job[addDays(start, i)];
      if (v === 'enlarged') e += 1;
      if (v === 'diminished') d += 1;
    }
    return { solid: e * 5, faded: d * 5 };
  }

  function year() {
    const y = parseKey(today()).getFullYear();
    const weeks = weeksOf(y);
    const totals = LANES.map(l => Math.round(state.blocks
      .filter(b => b.lane === l.id && parseKey(b.date).getFullYear() === y)
      .reduce((t, b) => t + size(b.size).hours, 0)));
    const jobDays = Object.keys(state.job).filter(k => parseKey(k).getFullYear() === y).length;
    let lastMonth = -1;
    return shell({
      right: `${scaleChips('year')}${gearButton}`,
      body: `
        <div class="row-between" style="margin-top:14px">
          <div class="h1">${y}</div>
          <div class="label">ONE ROW = ONE WEEK</div>
        </div>
        <div class="year-cols">
          <div class="lab"></div>
          <div class="job">JOB<small>${jobDays}d</small></div>
          <div class="lanes4">
            ${LANES.map((l, i) => `<div><span style="color:${laneColor(l.id)}">${l.name}</span><small>~${totals[i]}</small></div>`).join('')}
          </div>
        </div>
        <div class="year">
          <div class="wlab">
            ${weeks.map(w => {
              const mid = parseKey(addDays(w, 3));
              const m = mid.getMonth();
              const lab = (m === lastMonth || mid.getFullYear() !== y) ? '' : MONTHS[m];
              if (mid.getFullYear() === y) lastMonth = m;
              return `<div class="wrow">${lab}</div>`;
            }).join('')}
          </div>
          <div class="wjob">
            ${weeks.map(w => { const j = weekJob(w); return `<button class="wrow" data-a="go:week:${w}">
              <i class="wbar" style="width:${j.solid}px;background:${JOBC()}"></i>
              <i class="wbar" style="width:${j.faded}px;background:${alpha(JOBC(), FADE_WEEK)}"></i></button>`; }).join('')}
          </div>
          <div class="wlanes">
            ${weeks.map(w => LANES.map(l => {
              const b = weekLane(l.id, w), c = laneColor(l.id);
              return `<button class="wrow" data-a="go:week:${w}">
                <i class="wbar" style="width:${b.solid}px;background:${c}"></i>
                <i class="wbar" style="width:${b.faded}px;background:${alpha(c, FADE_WEEK)}"></i></button>`;
            }).join('')).join('')}
          </div>
        </div>
        ${legend(FADE_WEEK)}`,
      dock: `<div class="label">TAP ANY WEEK TO OPEN ITS SEVEN DAYS</div>`
    });
  }

  /* ---- one week ------------------------------------------------------- */

  function week() {
    const start = view.week;
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const wn = Math.round((parseKey(start) - parseKey(mondayOf(`${parseKey(start).getFullYear()}-01-01`))) / 604800000) + 1;
    return shell({
      back: true,
      body: `
        <div class="row-between" style="margin-top:16px">
          <div class="h1">WEEK OF ${dayMonth(start)}</div>
          <div class="label">WEEK ${wn}</div>
        </div>
        ${laneHeaderRow()}
        ${dayGrid(days, today(), { week: true })}
        ${legend(FADE_DAY)}`,
      dock: `<div style="display:flex;gap:8px">
        <button class="btn quiet" data-a="go:week:${addDays(start, -7)}">‹ ${dayMonth(addDays(start, -7))}</button>
        <button class="btn quiet" data-a="go:week:${addDays(start, 7)}">${dayMonth(addDays(start, 7))} ›</button>
      </div>`
    });
  }

  /* ---- a lane, and the goal open on it -------------------------------- */

  function detail() {
    const l = laneMeta(view.lane);
    const s = laneState(view.lane);
    const c = laneColor(l.id);
    const blocks = state.blocks.filter(b => b.lane === l.id).sort((a, b) => a.date < b.date ? 1 : -1);
    const hours = blocks.reduce((t, b) => t + size(b.size).hours, 0);
    const goalHours = s.goal ? blocks.filter(b => b.date >= s.goal.from).reduce((t, b) => t + size(b.size).hours, 0) : 0;
    return shell({
      back: true,
      body: `
        <div class="lane-head">
          <i class="dot" style="background:${c}"></i>
          <div class="h2" style="color:${c}">${l.name}</div>
        </div>

        <div class="spine">
          <div class="gutter"><i style="background:${alpha(c, 0.3)}"></i></div>
          <div class="body-col">
            ${s.why
              ? `<div class="why-text" style="font-size:16px">${esc(s.why)}</div>
                 <button class="link" style="margin-top:12px" data-a="go:why:${l.id}">THE WHY, AND WHAT IT USED TO SAY</button>`
              : `<div class="why-empty">No sentence yet.</div>
                 <button class="link" style="margin-top:12px" data-a="go:why:${l.id}">WRITE ONE</button>`}
          </div>
        </div>

        <div class="spine">
          <div class="gutter">${s.goal ? `<i class="thick" style="background:${c}"></i>` : `<i style="background:${alpha(c, 0.3)}"></i>`}</div>
          <div class="body-col">
            ${s.goal
              ? `<div class="goal-name">${esc(s.goal.name)}</div>
                 <div class="goal-meta">${Math.max(0, Math.round((parseKey(today()) - parseKey(s.goal.from)) / 86400000))} DAYS IN</div>
                 <div class="goal-meta">~${goalHours} HOURS SINCE IT OPENED</div>
                 <button class="link" style="margin-top:12px" data-a="goal:close">CLOSE THIS GOAL</button>`
              : `<button class="link" data-a="goal:new">OPEN A GOAL ON THIS LANE</button>
                 <div class="help" style="margin-top:10px">No goal open. Most lanes never have one — a goal just names a stretch of work so the blocks after it add up.</div>`}
          </div>
        </div>

        <div class="spine">
          <div class="gutter"><i style="background:${alpha(c, 0.3)}"></i></div>
          <div class="body-col">
            <div class="label">${blocks.length} BLOCKS &nbsp;·&nbsp; ~${hours} HOURS</div>
            <div style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:7px;margin-top:14px">
              ${blocks.slice(0, 60).map(b => {
                const px = size(b.size).day;
                return `<i style="width:${px}px;height:${px}px;background:${b.valence === 'enlarged' ? c : alpha(c, FADE_DAY)}"></i>`;
              }).join('') || `<div class="why-empty">Nothing logged yet.</div>`}
            </div>
            ${blocks.length ? `<div class="label" style="margin-top:16px">LAST ${dayMonth(blocks[0].date)}</div>` : ''}
          </div>
        </div>
        <div class="small" style="margin:6px 0 16px 36px">${dayMonth(state.opened)} · LANE OPENED</div>`,
      dock: `<button class="btn" data-a="lane:${l.id}:${today()}" style="color:${c}">LOG TO ${l.name}</button>`
    });
  }

  /* ---- a why, and what it used to say --------------------------------- */

  function why() {
    const l = laneMeta(view.lane);
    const s = laneState(view.lane);
    const c = laneColor(l.id);
    const editing = view.editing || !s.why;
    return shell({
      back: true,
      body: `
        <div class="lane-head">
          <i class="dot" style="background:${c}"></i>
          <div class="h2" style="color:${c}">${l.name}</div>
        </div>` + (editing
        ? `<div class="why-editor">
             <div class="label" style="margin-top:20px">WHY THIS LANE EXISTS</div>
             <div class="actions" style="margin-top:12px">
               <button class="btn" data-a="why:save" style="color:${c};border-color:${c}">SAVE</button>
               <button class="btn quiet" data-a="why:cancel">CANCEL</button>
             </div>
             <textarea id="why-input" rows="4" placeholder="Because…"
               style="border-color:${c}">${esc(s.why)}</textarea>
             <div class="help">One sentence, in your own words. You meet it every time you log to this lane, and you will know it has stopped being true by reading it and flinching.</div>
             <div style="height:20px"></div>
           </div>`
        : `<div class="spine" style="margin-top:18px">
             <div class="gutter"><i class="thick" style="background:${c}"></i><b style="top:8px;background:${c}"></b></div>
             <div class="body-col">
               <div class="why-text">${esc(s.why)}</div>
               <div class="label" style="margin-top:12px">SINCE ${dayMonth(s.whyFrom || state.opened)}</div>
             </div>
           </div>
           ${s.whyHistory.slice().reverse().map(h => `
           <div class="spine">
             <div class="gutter"><i style="background:${alpha(c, 0.4)}"></i><b style="top:16px;background:${alpha(c, 0.4)}"></b></div>
             <div class="body-col">
               <div class="why-text struck" style="font-size:16px">${esc(h.text)}</div>
               <div class="label" style="margin-top:10px">${dayMonth(h.from)} — ${dayMonth(h.to)}</div>
             </div>
           </div>`).join('')}`),
      dock: editing ? '' : `<button class="btn quiet" data-a="why:edit">THIS ISN'T TRUE ANY MORE</button>`
    });
  }

  /* ---- opening a goal --------------------------------------------------- */

  function goal() {
    const l = laneMeta(view.lane);
    const c = laneColor(l.id);
    return shell({
      back: true,
      body: `
        <div class="lane-head">
          <i class="dot" style="background:${c}"></i>
          <div class="h2" style="color:${c}">${l.name}</div>
        </div>
        <div class="why-editor">
          <div class="label" style="margin-top:20px">WHAT ARE YOU IN THE MIDDLE OF?</div>
          <div class="actions" style="margin-top:12px">
            <button class="btn" data-a="goal:save" style="color:${c};border-color:${c}">OPEN IT</button>
            <button class="btn quiet" data-a="goal:cancel">CANCEL</button>
          </div>
          <input id="goal-input" type="text" placeholder="Ship Watershed" style="border-color:${c}">
          <div class="help">A goal is only a name for the stretch of work you are in, and the day it started. It has no target and no deadline: nothing counts down, nothing fills up, and no percentage appears anywhere. All it does is mark a point on the lane so the blocks after it add up to something you can look at.<br><br>Most lanes never need one. Open a goal when you are in the middle of a particular piece of work and you want to see what it actually cost.</div>
          <div style="height:20px"></div>
        </div>`
    });
  }

  /* ---- settings -------------------------------------------------------- */

  function settings() {
    return shell({
      back: true,
      body: `
        <div class="h2" style="margin-top:18px">THEME</div>
        ${THEMES.map(t => `
          <button class="theme-row ${t.id === theme.id ? 'on' : ''}" data-a="theme:${t.id}">
            <span class="swatches">
              <i style="background:${t.t.bg};outline:1px solid ${t.t.line}"></i>
              <i style="background:${t.t.green}"></i><i style="background:${t.t.teal}"></i>
              <i style="background:${t.t.orange}"></i><i style="background:${t.t.purple}"></i>
            </span>
            <span class="grow">
              <span class="name" style="display:block">${t.label}</span>
              <span class="detail" style="display:block">${t.detail}</span>
            </span>
            ${t.id === theme.id ? `<span class="tick">✓</span>` : ''}
          </button>`).join('')}

        <div class="h2" style="margin-top:30px">THE RECORD</div>
        <div class="note">${state.blocks.length} blocks since ${dayMonth(state.opened)}.
          It lives on this device only — no account, no sync, nothing leaves the phone.
          ${DEMO ? '<br><br>You are in demo mode: this is invented data under a separate key.' : ''}</div>
        <div style="height:20px"></div>`
    });
  }

  /* ---- actions --------------------------------------------------------- */

  el.addEventListener('click', ev => {
    const node = ev.target.closest('[data-a]');
    if (!node) return;
    const [verb, a, b] = node.dataset.a.split(':');

    if (verb === 'noop') return;
    if (verb === 'home') return goHome();
    if (verb === 'back') return history.back();

    if (verb === 'go') {
      if (a === 'year') return go({ screen: 'year' });
      if (a === 'week') return go({ screen: 'week', week: b });
      if (a === 'detail') return go({ screen: 'detail', lane: b });
      if (a === 'why') return go({ screen: 'why', lane: b, editing: false, from: view.screen });
      if (a === 'settings') return go({ screen: 'settings' });
      if (a === 'jobday') return go({ screen: 'jobday', when: b });
      return;
    }

    if (verb === 'day') return go({ screen: 'pick', when: a });
    if (verb === 'lane') return go({ screen: 'log', lane: a, when: b });

    if (verb === 'log') {
      logBlock(view.lane, a, b, view.when);
      return goHome();
    }

    if (verb === 'nothing') {
      state.answered[a || today()] = true;
      save();
      return goHome();
    }

    if (verb === 'setjob') {
      setJob(view.when, a);
      if (a !== 'clear') state.answered[view.when] = true;
      save();
      return goHome();
    }

    if (verb === 'why') {
      if (a === 'edit') { view.editing = true; return render(); }
      if (a === 'cancel') { if (!laneState(view.lane).why) return history.back(); view.editing = false; return render(); }
      if (a === 'save') {
        const t = document.getElementById('why-input');
        if (t) setWhy(view.lane, t.value);
        view.editing = false;
        return render();
      }
    }

    if (verb === 'goal') {
      if (a === 'new') return go({ screen: 'goal', lane: view.lane });
      if (a === 'cancel') return history.back();
      if (a === 'save') {
        const t = document.getElementById('goal-input');
        const name = t ? t.value.trim() : '';
        if (name) { laneState(view.lane).goal = { name: name.toUpperCase(), from: today() }; save(); }
        return history.back();
      }
      if (a === 'close') { laneState(view.lane).goal = null; save(); return render(); }
    }

    if (verb === 'theme') { applyTheme(a); return render(); }
  });

  /* ---- demo data ------------------------------------------------------- */

  function demoData() {
    const s = blank();
    const y = parseKey(today()).getFullYear();
    s.opened = `${y}-01-08`;
    const whys = {
      craft: 'Because I want to be good at something, not just employed doing it.',
      recovery: 'Because the hour I give it is the hour that keeps the rest of them.',
      body: 'Because I would like to still be walking up hills at seventy.',
      love: 'Because attention is the only thing I have that nobody else can give them.'
    };
    s.lanes.forEach(l => { l.why = whys[l.id]; l.whyFrom = `${y}-01-08`; });
    s.lanes.find(l => l.id === 'craft').goal = { name: 'SHIP WATERSHED', from: `${y}-07-01` };
    s.lanes.find(l => l.id === 'body').whyHistory = [
      { text: 'Because I should exercise more.', from: `${y}-01-08`, to: `${y}-02-06` }
    ];

    let seed = 7;
    const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const env = points => w => {
      let i = 0;
      while (i < points.length - 2 && points[i + 1][0] < w) i += 1;
      const [x0, y0] = points[i], [x1, y1] = points[i + 1];
      const t = x1 === x0 ? 0 : (w - x0) / (x1 - x0);
      return y0 + (y1 - y0) * Math.max(0, Math.min(1, t));
    };
    const jobGood = env([[0, 0.86], [60, 0.8], [80, 0.14], [280, 0.12], [315, 0.4], [365, 0.55]]);
    const shape = {
      craft:    { vol: env([[0, 0.6], [90, 0.45], [150, 0.14], [215, 0.12], [265, 0.55], [365, 0.8]]), dim: 0.12 },
      recovery: { vol: env([[0, 0.5], [365, 0.5]]), dim: 0.05 },
      body:     { vol: env([[0, 0.55], [65, 0.42], [84, 0.03], [310, 0.02], [335, 0.2], [365, 0.34]]), dim: 0.07 },
      love:     { vol: env([[0, 0.42], [98, 0.3], [196, 0.46], [287, 0.32], [365, 0.48]]), dim: 0.13 }
    };

    const end = today();
    let k = `${y}-01-01`, n = 0;
    while (k <= end) {
      const dow = parseKey(k).getDay();
      if (dow !== 0 && dow !== 6) s.job[k] = rand() < jobGood(n) ? 'enlarged' : 'diminished';
      for (const l of LANES) {
        const sh = shape[l.id];
        if (rand() < sh.vol(n) * 0.8) {
          const r = rand();
          s.blocks.push({ id: `demo-${n}-${l.id}`, date: k, lane: l.id,
            size: r < 0.62 ? 'a' : r < 0.9 ? 'b' : 'c',
            valence: rand() < sh.dim ? 'diminished' : 'enlarged', at: k });
        }
      }
      s.answered[k] = true;
      k = addDays(k, 1); n += 1;
    }
    return s;
  }

  /* ---- boot ------------------------------------------------------------ */

  if (new URLSearchParams(location.search).has('reset')) {
    localStorage.removeItem(KEY);
    location.replace(location.pathname);
  }

  let saved = null;
  try { saved = localStorage.getItem('watershed.theme'); } catch (e) { /* fine */ }
  applyTheme(saved || 'tokyo-night');

  history.replaceState({ view: { screen: 'home' }, depth: 0 }, '');
  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
