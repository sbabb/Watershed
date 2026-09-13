/* Watershed — a record of what your time was for.
 *
 * No framework, no build step. One state object in localStorage, one render
 * pass, event delegation for everything. The whole app is nine screens and
 * two taps; keeping the code the same shape as the design is the point.
 */

(() => {
  'use strict';

  /* ---- the model ------------------------------------------------------ */

  const LANES = [
    { id: 'craft',    name: 'CRAFT',    color: '#9ece6a' },
    { id: 'recovery', name: 'RECOVERY', color: '#73daca' },
    { id: 'body',     name: 'BODY',     color: '#ff9e64' },
    { id: 'love',     name: 'LOVE',     color: '#bb9af7' }
  ];
  const JOB = '#7aa2f7';

  // Half-days, not hours. One working day is MOST OF A DAY, once.
  const SIZES = [
    { id: 'a', label: 'A BIT',         about: '~1h', hours: 1, day: 8,  week: 10, cell: 12 },
    { id: 'b', label: 'HALF A DAY',    about: '~4h', hours: 4, day: 13, week: 16, cell: 22 },
    { id: 'c', label: 'MOST OF A DAY', about: '~8h', hours: 8, day: 18, week: 22, cell: 34 }
  ];
  const size = id => SIZES.find(s => s.id === id) || SIZES[0];

  // Fade is the whole of the diminished encoding: same colour, same footprint.
  const FADE_DAY = 0.45;
  const FADE_WEEK = 0.32;
  const fade = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  };

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

  let state = load();
  let view = { screen: 'home', lane: null, when: today(), week: null,
               editing: false, jobPicker: false, asking: false, peek: false, whyReturn: 'detail' };

  function blank() {
    return {
      version: 1,
      opened: today(),
      lanes: LANES.map(l => ({ id: l.id, why: '', whyHistory: [], goal: null })),
      blocks: [],
      job: {},
      answered: {}
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(blank(), JSON.parse(raw));
    } catch (e) { /* a first run in a private window looks the same as no data */ }
    return DEMO ? demoData() : blank();
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* nothing to do about it */ }
  }

  const laneMeta = id => LANES.find(l => l.id === id);
  const laneState = id => state.lanes.find(l => l.id === id);

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

  function recordDays(n) {
    const out = [];
    for (let i = 0; i < n; i += 1) out.push(addDays(today(), -i));
    return out;
  }

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

  /* ---- rendering ------------------------------------------------------ */

  const el = document.getElementById('app');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function render() {
    const screens = { home, log, year, week, detail, why };
    el.innerHTML = (screens[view.screen] || home)();
    el.scrollTop = 0;
  }

  const head = right => `
    <div class="head">
      <div class="wordmark">WATERSHED</div>
      ${right || ''}
    </div>`;

  const scaleControl = on => `
    <div class="scale">
      <button data-a="go:home" class="${on === 'weeks' ? 'on' : ''}">3 WEEKS</button>
      <div class="sep">/</div>
      <button data-a="go:year" class="${on === 'year' ? 'on' : ''}">THE YEAR</button>
    </div>`;

  const legend = () => `
    <div class="legend">
      <span><i class="swatch" style="background:${'#c0caf5'}"></i>ENLARGED</span>
      <span><i class="swatch" style="background:${fade('#c0caf5', FADE_DAY)}"></i>DIMINISHED</span>
    </div>`;

  /* --- 1 + 3. home, in its two states --- */

  // Home is one screen in two states. The door is what you get while the day
  // is unanswered; ADD ANOTHER asks for it back, and THE RECORD looks without
  // answering. Nothing else can put the question on the screen.
  function home() {
    if (view.asking) return doorScreen();
    return (isAnswered(today()) || view.peek) ? recordScreen() : doorScreen();
  }

  function doorScreen() {
    const t = today();
    return `
      ${head('')}
      <div class="date-big">${longDay(t)}</div>
      <div class="grow"></div>
      <div class="question">What were the last few hours for?</div>
      <div class="lanes">
        ${LANES.map(l => {
          const m = markFor(l.id, t);
          const mark = m
            ? `<i class="mark" style="width:${size(m.size).day}px;height:${size(m.size).day}px;background:${m.valence === 'enlarged' ? l.color : fade(l.color, FADE_DAY)}"></i>`
            : '';
          return `<button class="lane-row" data-a="lane:${l.id}">
                    <i class="dot" style="background:${l.color}"></i>
                    <span class="lane-name" style="color:${l.color}">${l.name}</span>
                    <span class="grow"></span>${mark}
                  </button>`;
        }).join('')}
      </div>
      <button class="nothing" data-a="nothing">NOTHING, IT WAS THE JOB</button>
      <div class="grow"></div>
      <div class="footer">
        <button data-a="go:record">THE RECORD</button>
        <button data-a="go:year">THE YEAR</button>
      </div>`;
  }

  function recordScreen() {
    const days = recordDays(21);
    const t = today();
    const answered = isAnswered(t);
    return `
      ${head(scaleControl('weeks'))}
      <div class="date">${longDay(t)}</div>
      <div class="cols">
        <div class="col-days"></div>
        <div class="col-job"><div class="tag">JOB</div></div>
        <div class="col-gap"></div>
        <div class="col-lanes">
          ${LANES.map(l => `<button data-a="go:detail:${l.id}" style="color:${l.color}">${l.name}</button>`).join('')}
        </div>
      </div>
      ${dayGrid(days, t)}
      ${view.jobPicker ? jobPicker() : ''}
      ${legend()}
      <div class="grow"></div>
      <div class="rule"><i></i><span>${answered ? 'ANSWERED — NO QUESTION TODAY' : 'TODAY IS STILL OPEN'}</span></div>
      <button class="ghost" data-a="add">${answered ? 'ADD ANOTHER' : 'BACK TO THE QUESTION'}</button>`;
  }

  function dayGrid(days, t, klass) {
    return `
      <div class="grid ${klass || ''}">
        <div class="bands">${days.map(k => `<div class="band" style="background:${isWeekend(k) ? 'var(--weekend)' : 'transparent'}"></div>`).join('')}</div>
        <div class="grid-body">
          <div class="days">
            ${days.map(k => `<div class="day ${k === t ? 'today' : isWeekend(k) ? 'weekend' : ''}">${shortDay(k)}</div>`).join('')}
          </div>
          <div class="ribbon">
            ${days.map(k => {
              const v = state.job[k];
              const bg = v === 'enlarged' ? JOB : v === 'diminished' ? fade(JOB, FADE_DAY) : 'transparent';
              return `<button class="ribbon-cell" data-a="${k === t ? 'job:pick' : 'noop'}" style="background:${bg}"></button>`;
            }).join('')}
          </div>
          <div class="col-gap"></div>
          <div class="marks">
            <div class="rails"><div><i></i></div><div><i></i></div><div><i></i></div><div><i></i></div></div>
            <div class="cells">
              ${days.map(k => LANES.map(l => {
                const m = markFor(l.id, k);
                if (!m) return '<div class="cell"></div>';
                const px = size(m.size).day;
                const bg = m.valence === 'enlarged' ? l.color : fade(l.color, FADE_DAY);
                return `<div class="cell"><i class="mark" style="width:${px}px;height:${px}px;background:${bg}"></i></div>`;
              }).join('')).join('')}
            </div>
          </div>
        </div>
      </div>`;
  }

  /* --- 4. the job verdict, logged in place --- */

  function jobPicker() {
    return `
      <div class="verdicts">
        <button data-a="job:enlarged"><i class="fill" style="background:${JOB}"></i>ENLARGED</button>
        <button data-a="job:diminished"><i class="fill" style="background:${fade(JOB, FADE_DAY)}"></i>DIMINISHED</button>
        <button data-a="job:clear"><i class="fill outline"></i>NO WORK</button>
      </div>`;
  }

  /* --- 2. the lane, and the grid --- */

  function log() {
    const l = laneMeta(view.lane);
    const s = laneState(view.lane);
    const t = today();
    const why = s.why
      ? `<div class="why-text">${esc(s.why)}</div>
         <div class="tiny" style="margin-top:9px">YOU WROTE THIS ${dayMonth(s.whyFrom || state.opened)}</div>`
      : `<div class="why-empty">Why does this lane exist? Write it before you log to it — the sentence is the part that does the work.</div>
         <button class="tiny" data-a="go:why:${l.id}" style="margin-top:9px;color:${l.color}">WRITE IT</button>`;
    return `
      ${head(`<button class="back" data-a="go:home">BACK</button>`)}
      <div class="lane-head">
        <i class="dot" style="background:${l.color}"></i>
        <div class="title" style="color:${l.color}">${l.name}</div>
        <span class="grow"></span>
        <div class="tiny">${longDay(view.when)}</div>
      </div>
      <div class="why-block" style="border-left-color:${l.color}">${why}</div>
      <div class="when">
        <button data-a="when:${t}" class="${view.when === t ? 'on' : ''}">TODAY</button>
        <button data-a="when:${addDays(t, -1)}" class="${view.when !== t ? 'on' : ''}">YESTERDAY</button>
      </div>
      <div class="grow"></div>
      <div class="title" style="margin-top:24px">HOW MUCH, AND HOW</div>
      <div class="sizes">${SIZES.map(s2 => `<div><b>${s2.label}</b><i>${s2.about}</i></div>`).join('')}</div>
      ${['enlarged', 'diminished'].map(v => `
        <div class="band-label"><span>${v.toUpperCase()}</span><i></i></div>
        <div class="choices">
          ${SIZES.map(s2 => `<button data-a="log:${s2.id}:${v}">
            <i style="width:${s2.cell}px;height:${s2.cell}px;background:${v === 'enlarged' ? l.color : fade(l.color, FADE_DAY)}"></i>
          </button>`).join('')}
        </div>`).join('')}`;
  }

  /* --- 7. the year --- */

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

  const MAX_BAR = 66;      // px, the widest a lane's week can draw
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
    if (!hours) return { solid: 0, faded: 0, hours: 0 };
    const total = Math.max(2, Math.round(Math.min(1, hours / MAX_WEEK_HOURS) * MAX_BAR));
    const faded = Math.round(total * (dim / hours));
    return { solid: total - faded, faded, hours };
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
    const jobDays = Object.entries(state.job).filter(([k, v]) => parseKey(k).getFullYear() === y && v !== 'off').length;
    let lastMonth = -1;
    return `
      ${head(scaleControl('year'))}
      <div class="lane-head"><div class="title">${y}</div><span class="grow"></span><div class="tiny">ONE ROW = ONE WEEK</div></div>
      <div class="year-cols">
        <div class="lab"></div>
        <div class="job">JOB<small>${jobDays}d</small></div>
        <div class="lanes4">
          ${LANES.map((l, i) => `<div><u style="color:${l.color}">${l.name}</u><small>~${totals[i]}</small></div>`).join('')}
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
          ${weeks.map(w => {
            const j = weekJob(w);
            return `<button class="wrow" data-a="go:week:${w}" style="width:100%">
              <i class="wbar" style="width:${j.solid}px;background:${JOB}"></i>
              <i class="wbar" style="width:${j.faded}px;background:${fade(JOB, FADE_WEEK)}"></i>
            </button>`;
          }).join('')}
        </div>
        <div class="wlanes">
          ${weeks.map(w => LANES.map(l => {
            const b = weekLane(l.id, w);
            return `<button class="wrow" data-a="go:week:${w}" style="width:100%">
              <i class="wbar" style="width:${b.solid}px;background:${l.color}"></i>
              <i class="wbar" style="width:${b.faded}px;background:${fade(l.color, FADE_WEEK)}"></i>
            </button>`;
          }).join('')).join('')}
        </div>
      </div>
      <div class="legend">
        <span><i class="swatch" style="background:#c0caf5"></i>ENLARGED</span>
        <span><i class="swatch" style="background:${fade('#c0caf5', FADE_WEEK)}"></i>DIMINISHED</span>
      </div>
      <div class="note">Tap any week to open its seven days.</div>
      <div class="grow"></div>`;
  }

  /* --- 8. one week --- */

  function week() {
    const start = view.week;
    const days = [];
    for (let i = 0; i < 7; i += 1) days.push(addDays(start, i));
    const wn = Math.floor((parseKey(start) - parseKey(mondayOf(`${parseKey(start).getFullYear()}-01-01`))) / 604800000) + 1;
    return `
      ${head(`<button class="back" data-a="go:year">BACK TO THE YEAR</button>`)}
      <div class="lane-head">
        <div class="title">WEEK OF ${dayMonth(start)}</div>
        <span class="grow"></span>
        <div class="tiny">WEEK ${wn}</div>
      </div>
      <div class="cols">
        <div class="col-days"></div>
        <div class="col-job"><div class="tag">JOB</div></div>
        <div class="col-gap"></div>
        <div class="col-lanes">${LANES.map(l => `<button data-a="go:detail:${l.id}" style="color:${l.color}">${l.name}</button>`).join('')}</div>
      </div>
      <div class="grid week-grid">
        <div class="bands">${days.map(k => `<div class="band" style="background:${isWeekend(k) ? 'var(--weekend)' : 'transparent'}"></div>`).join('')}</div>
        <div class="grid-body">
          <div class="days">${days.map(k => `<div class="day ${isWeekend(k) ? 'weekend' : ''}">${shortDay(k)}</div>`).join('')}</div>
          <div class="ribbon">
            ${days.map(k => {
              const v = state.job[k];
              const bg = v === 'enlarged' ? JOB : v === 'diminished' ? fade(JOB, FADE_DAY) : 'transparent';
              return `<div class="ribbon-cell"><i style="background:${bg}"></i></div>`;
            }).join('')}
          </div>
          <div class="col-gap"></div>
          <div class="marks">
            <div class="rails"><div><i></i></div><div><i></i></div><div><i></i></div><div><i></i></div></div>
            <div class="cells">
              ${days.map(k => LANES.map(l => {
                const m = markFor(l.id, k);
                if (!m) return '<div class="cell"></div>';
                const px = size(m.size).week;
                const bg = m.valence === 'enlarged' ? l.color : fade(l.color, FADE_DAY);
                return `<div class="cell"><i class="mark" style="width:${px}px;height:${px}px;background:${bg}"></i></div>`;
              }).join('')).join('')}
            </div>
          </div>
        </div>
      </div>
      ${legend()}
      <div class="grow"></div>
      <div class="footer">
        <button data-a="go:week:${addDays(start, -7)}">WEEK OF ${dayMonth(addDays(start, -7))}</button>
        <button data-a="go:week:${addDays(start, 7)}">WEEK OF ${dayMonth(addDays(start, 7))}</button>
      </div>`;
  }

  /* --- 5. a lane, and the goal open on it --- */

  function detail() {
    const l = laneMeta(view.lane);
    const s = laneState(view.lane);
    const blocks = state.blocks.filter(b => b.lane === l.id).sort((a, b) => a.date < b.date ? 1 : -1);
    const hours = blocks.reduce((t, b) => t + size(b.size).hours, 0);
    const last = blocks[0];
    const quiet = last ? Math.round((parseKey(today()) - parseKey(last.date)) / 86400000) : null;
    return `
      ${head(`<button class="back" data-a="go:home">BACK</button>`)}
      <div class="lane-head">
        <i class="dot" style="background:${l.color}"></i>
        <div class="title" style="color:${l.color}">${l.name}</div>
      </div>

      <div class="spine">
        <div class="gutter"><i style="background:${fade(l.color, 0.28)}"></i></div>
        <div class="body">
          ${s.why
            ? `<div class="why-text" style="font-size:15px">${esc(s.why)}</div>
               <button class="tiny" data-a="go:why:${l.id}" style="margin-top:8px">THE WHY, AND WHAT IT USED TO SAY</button>`
            : `<div class="why-empty" style="font-size:14px">No sentence yet.</div>
               <button class="tiny" data-a="go:why:${l.id}" style="margin-top:8px;color:${l.color}">WRITE ONE</button>`}
        </div>
      </div>

      ${s.goal ? `
      <div class="spine">
        <div class="gutter"><i class="thick" style="background:${l.color}"></i></div>
        <div class="body">
          <div class="goal-name">${esc(s.goal.name)}</div>
          <div class="goal-meta">${Math.max(0, Math.round((parseKey(today()) - parseKey(s.goal.from)) / 86400000))} DAYS IN</div>
          <div class="goal-meta">~${blocks.filter(b => b.date >= s.goal.from).reduce((t, b) => t + size(b.size).hours, 0)} HOURS SINCE IT OPENED</div>
        </div>
      </div>` : `
      <div class="spine">
        <div class="gutter"><i style="background:${fade(l.color, 0.28)}"></i></div>
        <div class="body"><button class="tiny" data-a="goal:new">OPEN A GOAL ON THIS LANE</button></div>
      </div>`}

      <div class="spine">
        <div class="gutter"><i style="background:${fade(l.color, 0.28)}"></i></div>
        <div class="body">
          <div class="tiny">${blocks.length} BLOCKS &nbsp;·&nbsp; ~${hours} HOURS</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px">
            ${blocks.slice(0, 40).map(b => {
              const px = size(b.size).day;
              return `<i style="width:${px}px;height:${px}px;background:${b.valence === 'enlarged' ? l.color : fade(l.color, FADE_DAY)}"></i>`;
            }).join('') || '<div class="why-empty" style="font-size:13px">Nothing logged yet.</div>'}
          </div>
          ${quiet !== null && quiet > 0 ? `<div class="tiny" style="margin-top:14px">LAST ${dayMonth(last.date)}</div>` : ''}
        </div>
      </div>

      <div class="grow"></div>
      <div class="footer"><span class="small">${dayMonth(state.opened)} · LANE OPENED</span></div>`;
  }

  /* --- 6. a why, and what it used to say --- */

  function why() {
    const l = laneMeta(view.lane);
    const s = laneState(view.lane);
    return `
      ${head(`<button class="back" data-a="go:detail:${l.id}">BACK</button>`)}
      <div class="lane-head">
        <i class="dot" style="background:${l.color}"></i>
        <div class="title" style="color:${l.color};font-size:16px">${l.name}</div>
      </div>

      ${view.editing || !s.why ? `
        <div class="why-editor">
          <div class="tiny">WHY THIS LANE EXISTS</div>
          <textarea id="why-input" placeholder="Because…">${esc(s.why)}</textarea>
          <div class="actions">
            <button data-a="why:save">SAVE</button>
            <button data-a="why:cancel">CANCEL</button>
          </div>
        </div>` : `
        <div class="spine" style="margin-top:16px">
          <div class="gutter"><i class="thick" style="background:${l.color}"></i><b style="top:6px;background:${l.color}"></b></div>
          <div class="body">
            <div class="why-text">${esc(s.why)}</div>
            <div class="tiny" style="margin-top:9px">SINCE ${dayMonth(s.whyFrom || state.opened)}</div>
          </div>
        </div>
        ${s.whyHistory.slice().reverse().map(h => `
        <div class="spine">
          <div class="gutter"><i style="background:${fade(l.color, 0.4)}"></i><b style="top:14px;background:${fade(l.color, 0.4)}"></b></div>
          <div class="body">
            <div class="why-text struck" style="font-size:15px">${esc(h.text)}</div>
            <div class="tiny" style="margin-top:8px">${dayMonth(h.from)} — ${dayMonth(h.to)}</div>
          </div>
        </div>`).join('')}
        <div class="spine">
          <div class="gutter"><i style="background:${fade(l.color, 0.28)}"></i></div>
          <div class="body"><button class="tiny" data-a="why:edit">THIS ISN'T TRUE ANY MORE</button></div>
        </div>`}

      <div class="grow"></div>
      <div class="footer"><span class="small">A CHANGED WHY IS AN EVENT, NOT AN EDIT</span></div>`;
  }

  /* ---- actions -------------------------------------------------------- */

  el.addEventListener('click', ev => {
    const node = ev.target.closest('[data-a]');
    if (!node) return;
    const [verb, a, b] = node.dataset.a.split(':');

    if (verb === 'noop') return;

    if (verb === 'go') {
      const from = view.screen;
      view.jobPicker = false;
      if (a === 'home' || a === 'record') { view.screen = 'home'; view.asking = false; view.peek = (a === 'record'); }
      else if (a === 'year') view.screen = 'year';
      else if (a === 'week') { view.screen = 'week'; view.week = b; }
      else if (a === 'detail') { view.screen = 'detail'; view.lane = b; }
      else if (a === 'why') { view.screen = 'why'; view.lane = b; view.editing = false; view.whyReturn = from === 'log' ? 'log' : 'detail'; }
      return render();
    }

    if (verb === 'lane') { view.screen = 'log'; view.lane = a; view.when = today(); view.asking = false; return render(); }
    if (verb === 'when') { view.when = a + (b ? ':' + b : ''); return render(); }

    if (verb === 'log') {
      logBlock(view.lane, a, b, view.when);
      view.screen = 'home'; view.peek = false; view.asking = false;
      return render();
    }

    if (verb === 'nothing') { state.answered[today()] = true; save(); view.screen = 'home'; view.asking = false; view.peek = false; return render(); }
    if (verb === 'add') { view.asking = true; view.peek = false; view.screen = 'home'; return render(); }

    if (verb === 'job') {
      if (a === 'pick') view.jobPicker = !view.jobPicker;
      else { setJob(today(), a); view.jobPicker = false; }
      return render();
    }

    if (verb === 'why') {
      if (a === 'edit') { view.editing = true; return render(); }
      if (a === 'cancel') { view.editing = false; view.screen = view.whyReturn || 'detail'; return render(); }
      if (a === 'save') {
        const t = document.getElementById('why-input');
        if (t) setWhy(view.lane, t.value);
        view.editing = false; view.screen = view.whyReturn || 'detail';
        return render();
      }
    }

    if (verb === 'goal') {
      const name = prompt('What is the goal? A name, not a target.');
      if (name && name.trim()) { laneState(view.lane).goal = { name: name.trim().toUpperCase(), from: today() }; save(); }
      return render();
    }
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
    // The job stops enlarging him in March and stays grey until November.
    const jobGood = env([[0, 0.86], [60, 0.8], [80, 0.14], [280, 0.12], [315, 0.4], [365, 0.55]]);
    const shape = {
      craft:    { vol: env([[0, 0.6], [90, 0.45], [150, 0.14], [215, 0.12], [265, 0.55], [365, 0.8]]), dim: () => 0.12 },
      recovery: { vol: env([[0, 0.5], [365, 0.5]]), dim: () => 0.05 },
      body:     { vol: env([[0, 0.55], [65, 0.42], [84, 0.03], [310, 0.02], [335, 0.2], [365, 0.34]]), dim: () => 0.07 },
      love:     { vol: env([[0, 0.42], [98, 0.3], [196, 0.46], [287, 0.32], [365, 0.48]]), dim: () => 0.13 }
    };

    const end = today();
    let k = `${y}-01-01`;
    let n = 0;
    while (k <= end) {
      const d = parseKey(k), dow = d.getDay();
      if (dow !== 0 && dow !== 6) s.job[k] = rand() < jobGood(n) ? 'enlarged' : 'diminished';
      for (const l of LANES) {
        const sh = shape[l.id];
        if (rand() < sh.vol(n) * 0.8) {
          const r = rand();
          const sz = r < 0.62 ? 'a' : r < 0.9 ? 'b' : 'c';
          s.blocks.push({
            id: `demo-${n}-${l.id}`, date: k, lane: l.id, size: sz,
            valence: rand() < sh.dim(n) ? 'diminished' : 'enlarged', at: k
          });
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

  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
