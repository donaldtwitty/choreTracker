/**
 * Morning Stars — Render Functions
 * Each rXxx() function returns an HTML string that is injected into #app.
 * onclick attributes reference global functions defined in actions.js.
 */

// ── NAV STATE (shared with actions.js) ───────────────────────────
let view          = 'home';
let kidId         = null;
let tab           = 'morning';
let pinBuf        = '';
let pinErr        = false;
let editTarget    = null;   // 'daily' | 'evening' | 'weekly'
let editKidId     = null;
let emojiFor      = null;   // index of chore whose emoji picker is open, or null
let avatarPickerFor = null; // kid id whose avatar picker is open, or null
let reportMonth   = null;
let reportYear    = null;

/** Main render dispatcher */
function render() {
  const renderers = { home: rHome, kid: rKid, pin: rPin, parent: rParent,
                      editChores: rEdit, dashboard: rDashboard, report: rReport };
  document.getElementById('app').innerHTML = (renderers[view] || rHome)();
}

/** Renders the sync panel for the Parent Zone */
function rSyncPanel() {
  if (typeof isSyncEnabled === 'function' && isSyncEnabled()) {
    return `
<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#43A047"></span>
  <span style="font-weight:800;color:#43A047;font-size:14px">Connected</span>
</div>
<div style="font-size:13px;color:#666;font-weight:700;margin-bottom:6px">Family Code: <b style="color:#5C3D99;font-size:18px;letter-spacing:2px;user-select:all">${syncMeta.familyId}</b></div>
<div style="font-size:12px;color:#AAA;font-weight:600;margin-bottom:12px">Use this code to connect another phone or tablet.</div>
<button style="background:none;border:none;color:#CCC;font-size:11px;font-weight:700;cursor:pointer;padding:4px 0;font-family:'Nunito',sans-serif" onclick="confirm2('Reset Family Sync?',doSyncDisconnect,'You can create a new family or join another one after.','\ud83d\udd04',true)">Reset sync</button>`;
  }
  return `
<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#FF9800"></span>
  <span style="font-weight:800;color:#FF9800;font-size:14px">Not connected</span>
</div>
<button class="btn btn-pu" style="font-size:14px;width:100%;margin-bottom:14px" onclick="doSyncCreate()">Create Family</button>
<div style="font-size:12px;font-weight:700;color:#AAA;margin-bottom:10px">Or join an existing family:</div>
<input id="syncCode" class="inp" placeholder="Enter family code" maxlength="8" style="font-size:20px;letter-spacing:3px;text-align:center;margin-bottom:10px" />
<button class="btn btn-gh" style="font-size:15px;font-weight:800" onclick="doSyncJoin()">Join Family</button>`;
}

// ══════════════════════════════════════════════════════════════════
// HOME
// ══════════════════════════════════════════════════════════════════
function rHome() {
  const t = today(), wk = weekKey(), now = nowHHMM();
  const rem = S.reminders;

  const pauseBanner = S.isPaused ? `
<div class="pause-banner">
  <span style="font-size:24px">⏸️</span>
  <div style="flex:1">
    <div style="font-weight:900;color:#3949AB">Pause Mode On</div>
    <div style="font-size:12px;color:#7986CB">Streaks are protected. Resume in Parent Zone.</div>
  </div>
</div>` : '';

  const cards = S.kids.map((kid, i) => {
    const dCh = S.dailyChores[kid.id]  || [];
    const eCh = S.eveningChores[kid.id] || [];
    const wCh = S.weeklyChores[kid.id]  || [];
    const dDone = dCh.filter((c) => isDailyChoreComplete(kid.id, c, t)).length;
    const eDone = eCh.filter((c) => isEveningChoreComplete(kid.id, c, t)).length;
    const wDone = wCh.filter((c) => isWeeklyChoreComplete(kid.id, c, wk)).length;
    const allD  = dDone === dCh.length && dCh.length > 0;
    const pct   = dCh.length ? (dDone / dCh.length) * 100 : 0;
    const lvl   = getLevel(S.totalStars[kid.id] || 0);
    const streak = S.streaks[kid.id] || { current: 0 };

    let remindBadge = '';
    if (rem.enabled && !S.isPaused) {
      if (now >= rem.morningTime && dDone === 0 && dCh.length > 0)
        remindBadge = `<span style="background:#FFD93D;color:#8B6914;font-size:10px;font-weight:900;border-radius:99px;padding:2px 8px;margin-left:8px">⏰ Start chores!</span>`;
      else if (now >= rem.eveningTime && eDone === 0 && eCh.length > 0)
        remindBadge = `<span style="background:#C5CAE9;color:#3949AB;font-size:10px;font-weight:900;border-radius:99px;padding:2px 8px;margin-left:8px">🌙 Evening!</span>`;
    }

    return `
<div class="kid-card" onclick="openKid('${kid.id}')"
  style="border-color:${kid.color}55;box-shadow:0 8px 28px ${kid.color}22;animation-delay:${i * 0.12}s">
  <div class="kid-card-row">
    ${av(kid, 68, 36, `3px solid ${kid.color}`, allD ? 'pulse' : '')}
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;flex-wrap:wrap">
        <span class="kid-name">${esc(kid.name)}</span>${remindBadge}
      </div>
      <div class="level-tag" style="background:${lvl.color}22;color:${lvl.color}">${lvl.emoji} ${lvl.title}</div>
      <div class="kid-sub">☀️ ${dDone}/${dCh.length} &nbsp;🌙 ${eDone}/${eCh.length} &nbsp;📅 ${wDone}/${wCh.length} &nbsp;🔥 ${streak.current}</div>
    </div>
    <div style="text-align:center;flex-shrink:0">
      <div class="star-pill">⭐ ${S.stars[kid.id] || 0}</div>
      <div class="star-pill-lbl">stars</div>
    </div>
  </div>
  <div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:${kid.color}"></div></div>
  ${allD ? `<div class="done-msg" style="color:${kid.color}">🎉 Morning done! 🎉</div>` : ''}
</div>`;
  }).join('');

  return `
<div class="page" style="background:linear-gradient(140deg,#FFF9C4,#FCE4EC,#E3F2FD)">
  <div class="sun-deco"></div><div class="cloud-deco"></div>
  <div class="container">
    <h1 class="app-title">🌟 Morning Stars</h1>
    <p class="app-sub">Complete your routines!</p>
    ${pauseBanner}${cards}
    <div style="display:flex;gap:10px;justify-content:center;margin-top:12px;flex-wrap:wrap">
      <button class="par-btn" onclick="navTo('dashboard')">📊 Dashboard</button>
      <button class="par-btn" onclick="goPin()">🔒 Parent Zone</button>
    </div>
  </div>
</div>`;
}

// ══════════════════════════════════════════════════════════════════
// KID VIEW
// ══════════════════════════════════════════════════════════════════
function rKid() {
  const kid = S.kids.find((k) => k.id === kidId);
  if (!kid) return rHome();

  const ts     = S.totalStars[kid.id] || 0;
  const lvl    = getLevel(ts);
  const theme  = getTheme(kid.themeId);
  const streak = S.streaks[kid.id] || { current: 0, longest: 0 };

  const header = `
<div class="ph">
  <button class="back-btn" onclick="goHome()" style="background:${kid.bgColor};color:${kid.color}">←</button>
  ${av(kid, 50, 26, `3px solid ${kid.color}`)}
  <div style="flex:1;min-width:0">
    <div style="font-weight:900;font-size:24px;color:#3D2970;line-height:1.1">${esc(kid.name)}</div>
    <div class="level-tag" style="background:${lvl.color}22;color:${lvl.color};font-size:11px">${lvl.emoji} ${lvl.title}</div>
  </div>
  <div style="text-align:center">
    <div style="font-weight:900;font-size:20px;color:#FFB800">⭐ ${S.stars[kid.id] || 0}</div>
    <div style="font-size:10px;color:#CCC;font-weight:700">🔥 ${streak.current} streak</div>
  </div>
</div>`;

  const tabs = `
<div class="tabs" role="tablist">
  <button class="tab-btn ${tab === 'morning'  ? 'on' : ''}" onclick="setTab('morning')"  role="tab">☀️ Morning</button>
  <button class="tab-btn ${tab === 'evening'  ? 'on' : ''}" onclick="setTab('evening')"  role="tab">🌙 Evening</button>
  <button class="tab-btn ${tab === 'weekly'   ? 'on' : ''}" onclick="setTab('weekly')"   role="tab">📅 Weekly</button>
  <button class="tab-btn ${tab === 'history'  ? 'on' : ''}" onclick="setTab('history')"  role="tab">📊 History</button>
  <button class="tab-btn ${tab === 'trophies' ? 'on' : ''}" onclick="setTab('trophies')" role="tab">🏆 Trophies</button>
</div>`;

  const bodyFn = { morning: tMorning, evening: tEvening, weekly: tWeekly,
                   history: tHistory, trophies: tTrophies };
  const body = (bodyFn[tab] || tMorning)(kid);

  return `
<div class="page" style="background:${theme.bg}">
  <div class="container">${header}${tabs}${body}</div>
</div>`;
}

/** Renders a list of chore buttons for any routine type */
function choreListHtml(kid, chores, isDoneFn, tapAction, color) {
  return chores.map((c, i) => {
    const done = isDoneFn(c);
    const note = c.note ? `<div class="c-note">${esc(c.note)}</div>` : '';
    const sharedBadge = c.shared ? `<span class="shared-badge">👥 Shared</span>` : '';
    return `
<button class="chore-btn${done ? ' done' : ''}" ${done ? 'disabled' : ''}
  onclick="${tapAction(c)}"
  style="${done ? `background:linear-gradient(135deg,${color}18,${color}08);border-color:${color}55;` : ''}animation-delay:${i * 0.06}s">
  <span class="c-em">${c.emoji}</span>
  <div class="c-body">
    <div class="c-lbl" style="color:${done ? color : '#3D2970'}">${esc(c.label)}${sharedBadge}</div>
    ${note}
  </div>
  <span class="c-star ${done ? 'f' : 'e'}">⭐</span>
</button>`;
  }).join('');
}

function tMorning(kid) {
  const t = today(), chores = S.dailyChores[kid.id] || [];
  const isDone = (c) => isDailyChoreComplete(kid.id, c, t);
  const n   = chores.filter(isDone).length;
  const all = n === chores.length && chores.length > 0;
  const stars = chores.map((c) => `<span class="si ${isDone(c) ? '' : 'e'}">⭐</span>`).join('');
  const list  = choreListHtml(kid, chores, isDone,
    (c) => `tapChore('morning','${c.id}',event,${c.shared})`, kid.color);

  return `
<div class="sum-card" style="border:2px solid ${kid.color}22">
  <div style="font-weight:900;color:#5C3D99;margin-bottom:8px">Today's Stars</div>
  <div class="stars-row">${stars}</div>
  <div class="prog-bg"><div class="prog-fill" style="width:${chores.length ? (n / chores.length) * 100 : 0}%;background:${kid.color}"></div></div>
  <div style="text-align:center;margin-top:7px;font-weight:800;color:#AAA;font-size:13px">${n} of ${chores.length} done${all ? ' 🎉' : ''}</div>
</div>
${list}
${all ? `<div style="text-align:center;font-weight:900;font-size:22px;color:${kid.color};padding:16px;animation:bounceIn .5s ease">🌟 Morning Superstar! 🌟</div>` : ''}`;
}

function tEvening(kid) {
  const t = today(), chores = S.eveningChores[kid.id] || [];
  const isDone = (c) => isEveningChoreComplete(kid.id, c, t);
  const n   = chores.filter(isDone).length;
  const all = n === chores.length && chores.length > 0;
  const stars = chores.map((c) => `<span class="si ${isDone(c) ? '' : 'e'}">⭐</span>`).join('');
  const list  = choreListHtml(kid, chores, isDone,
    (c) => `tapChore('evening','${c.id}',event,${c.shared})`, kid.color);

  return `
<div class="sum-card" style="border:2px solid ${kid.color}22">
  <div style="font-weight:900;color:#5C3D99;margin-bottom:8px">Tonight's Stars</div>
  <div class="stars-row">${stars}</div>
  <div class="prog-bg"><div class="prog-fill" style="width:${chores.length ? (n / chores.length) * 100 : 0}%;background:${kid.color}"></div></div>
  <div style="text-align:center;margin-top:7px;font-weight:800;color:#AAA;font-size:13px">${n} of ${chores.length} done${all ? ' 🎉' : ''}</div>
</div>
${list}
${all ? `<div style="text-align:center;font-weight:900;font-size:22px;color:${kid.color};padding:16px;animation:bounceIn .5s ease">🌙 Sleep tight, Superstar! 🌙</div>` : ''}`;
}

function tWeekly(kid) {
  const wk = weekKey(), chores = S.weeklyChores[kid.id] || [];
  const isDone  = (c) => isWeeklyChoreComplete(kid.id, c, wk);
  const n   = chores.filter(isDone).length;
  const all = n === chores.length && chores.length > 0;
  const todayDOW = new Date().getDay();

  const list = chores.map((c, i) => {
    const done = isDone(c);
    const hasDayTag  = c.day && c.day !== 'any';
    const dayLabel   = hasDayTag ? `<span class="day-badge" style="background:${done ? kid.color + '22' : '#F0F0F0'};color:${done ? kid.color : '#AAA'}">${c.day}</span>` : '';
    const sharedBadge = c.shared ? `<span class="shared-badge">👥 Shared</span>` : '';
    const note       = c.note ? `<div class="c-note">${esc(c.note)}</div>` : '';
    const isToday    = hasDayTag && DOW_MAP[c.day] === todayDOW;
    return `
<button class="chore-btn${done ? ' done' : ''}" ${done ? 'disabled' : ''}
  onclick="tapChore('weekly','${c.id}',event,${c.shared})"
  style="${done ? `background:linear-gradient(135deg,${kid.color}18,${kid.color}08);border-color:${kid.color}55;` : ''}${isToday && !done ? 'border-color:#FFB80077;' : ''}animation-delay:${i * 0.06}s">
  <span class="c-em">${c.emoji}</span>
  <div class="c-body">
    <div class="c-lbl" style="color:${done ? kid.color : '#3D2970'}">${esc(c.label)}${dayLabel}${sharedBadge}</div>
    ${note}
  </div>
  <span class="c-star ${done ? 'f' : 'e'}">⭐</span>
</button>`;
  }).join('');

  return `
<div class="sum-card" style="border:2px solid #FFB80033">
  <span class="wk-badge">📅 ${fmtDate(wk)} – ${fmtDate(addDays(wk, 6))}</span>
  <div class="prog-bg"><div class="prog-fill" style="width:${chores.length ? (n / chores.length) * 100 : 0}%;background:#FFB800"></div></div>
  <div style="text-align:center;margin-top:7px;font-weight:800;color:#AAA;font-size:13px">${n} of ${chores.length} done${all ? ' 🎉' : ''}</div>
</div>
${list}
${all ? `<div style="text-align:center;font-weight:900;font-size:22px;color:#FFB800;padding:16px;animation:bounceIn .5s ease">🏆 All Weekly Chores Done! 🏆</div>` : ''}`;
}

function tHistory(kid) {
  const now = new Date(), nowStr = today(), days = ['M','T','W','T','F','S','S'];
  const streak = S.streaks[kid.id] || { current: 0, longest: 0 };

  let html = `
<div style="font-weight:900;font-size:19px;color:#5C3D99;margin-bottom:14px">📊 Last 4 Weeks</div>
<div class="sum-card" style="display:flex;gap:0;margin-bottom:14px">
  <div style="flex:1;text-align:center;border-right:1px solid #F0F0F0">
    <div style="font-weight:900;font-size:28px;color:#FF6B9D">🔥 ${streak.current}</div>
    <div style="font-size:12px;color:#AAA;font-weight:700">Current Streak</div>
  </div>
  <div style="flex:1;text-align:center">
    <div style="font-weight:900;font-size:28px;color:#9B79D5">⚡ ${streak.longest}</div>
    <div style="font-size:12px;color:#AAA;font-weight:700">Best Streak</div>
  </div>
</div>`;

  for (let w = 0; w < 4; w++) {
    const pivot = new Date(now);
    const dow   = pivot.getDay();
    pivot.setDate(pivot.getDate() - ((dow === 0 ? 6 : dow - 1) + w * 7));
    const wkS = pivot.toISOString().split('T')[0];
    const lbl = w === 0 ? 'This Week' : w === 1 ? 'Last Week' : fmtDate(wkS);
    let dots = '';

    for (let d = 0; d < 7; d++) {
      const dd  = addDays(wkS, d), ds = dd.toISOString().split('T')[0];
      const isT = ds === nowStr, isFut = dd > now, isP = isPaused(ds);
      const ch  = S.dailyChores[kid.id] || [], tot = ch.length;
      const dn  = ch.filter((c) => isDailyChoreComplete(kid.id, c, ds)).length;

      let cls, lbl2;
      if (isFut)       { cls = 'fut';    lbl2 = '·'; }
      else if (isP)    { cls = 'paused'; lbl2 = '⏸'; }
      else if (!tot)   { cls = 'none';   lbl2 = '–'; }
      else if (dn === tot) { cls = 'full'; lbl2 = '⭐'; }
      else if (dn > 0) { cls = 'part';  lbl2 = dn; }
      else             { cls = 'none';  lbl2 = '✗'; }

      dots += `<div class="hday"><div class="hdl">${days[d]}</div><div class="hdd ${cls}${isT ? ' tr' : ''}">${lbl2}</div></div>`;
    }

    const wD = wkChoresDone(kid.id, wkS), wT = (S.weeklyChores[kid.id] || []).length;
    html += `
<div style="background:white;border-radius:20px;padding:14px 16px;margin-bottom:10px;animation:slideUp .35s ease ${w * 0.08}s both">
  <div style="font-weight:900;font-size:16px;color:#5C3D99;margin-bottom:6px">${lbl}</div>
  <div class="hgrid">${dots}</div>
  <div style="margin-top:6px;font-size:12px;font-weight:700;color:#BBB;border-top:1px solid #F5F5F5;padding-top:6px">⭐=all · #=partial · ✗=none · ⏸=paused</div>
  <div style="margin-top:4px;font-size:13px;font-weight:800;color:#DDA520">📅 Weekly: ${wD}/${wT}${wD === wT && wT > 0 ? ' 🏆' : ''}</div>
</div>`;
  }
  return html;
}

function tTrophies(kid) {
  const earned = S.badges[kid.id] || [];
  const ts     = S.totalStars[kid.id] || 0;
  const lvl    = getLevel(ts), nextLvl = getNextLevel(ts);
  const pct    = nextLvl ? Math.min(100, ((ts - lvl.min) / (nextLvl.min - lvl.min)) * 100) : 100;
  const streak = S.streaks[kid.id] || { current: 0, longest: 0 };

  const badgeCards = BADGE_DEFS.map((b) => {
    const e = earned.includes(b.id);
    return `
<div class="badge-card ${e ? 'earned' : 'locked'}">
  <div class="badge-emoji">${b.emoji}</div>
  <div class="badge-title">${b.title}</div>
  <div class="badge-desc">${b.desc}</div>
  ${e ? '<div style="font-size:10px;color:#43A047;font-weight:800;margin-top:3px">✓ Earned</div>' : ''}
</div>`;
  }).join('');

  const themeCards = THEMES.map((th) => `
<div class="theme-swatch ${kid.themeId === th.id ? 'active' : ''}" style="background:${th.bg}"
  onclick="setKidTheme('${kid.id}','${th.id}')">
  ${kid.themeId === th.id ? '✓' : ''}
</div>`).join('');

  return `
<div class="sum-card" style="text-align:center">
  <div style="font-size:36px">${lvl.emoji}</div>
  <div style="font-weight:900;font-size:22px;color:${lvl.color}">${lvl.title}</div>
  <div style="font-size:13px;color:#AAA;font-weight:700;margin:4px 0">${ts} total stars · 🔥 Best: ${streak.longest}</div>
  ${nextLvl ? `
  <div class="level-bar"><div class="level-fill" style="width:${pct}%;background:${lvl.color}"></div></div>
  <div style="font-size:12px;color:#AAA;font-weight:700">${ts - lvl.min} / ${nextLvl.min - lvl.min} to <b>${nextLvl.emoji} ${nextLvl.title}</b></div>
  ` : `<div style="font-size:13px;color:#E91E63;font-weight:800;margin-top:6px">🌈 Max Level!</div>`}
</div>
<div style="font-weight:900;font-size:18px;color:#5C3D99;margin-bottom:12px">🏅 Badges</div>
<div class="badge-grid">${badgeCards}</div>
<div style="font-weight:900;font-size:18px;color:#5C3D99;margin:16px 0 8px">🎨 My Theme</div>
<div style="font-size:13px;color:#AAA;font-weight:700;margin-bottom:10px">Pick your background!</div>
<div class="theme-grid">${themeCards}</div>`;
}

// ══════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════
function rDashboard() {
  const t = today(), wk = weekKey();

  const kidCols = S.kids.map((kid) => {
    const dCh = S.dailyChores[kid.id]  || [];
    const eCh = S.eveningChores[kid.id] || [];
    const wCh = S.weeklyChores[kid.id]  || [];
    const dDone = dCh.filter((c) => isDailyChoreComplete(kid.id, c, t)).length;
    const eDone = eCh.filter((c) => isEveningChoreComplete(kid.id, c, t)).length;
    const wDone = wCh.filter((c) => isWeeklyChoreComplete(kid.id, c, wk)).length;
    const streak = S.streaks[kid.id] || { current: 0, longest: 0 };
    const lvl  = getLevel(S.totalStars[kid.id] || 0);
    const dPct = dCh.length ? Math.round((dDone / dCh.length) * 100) : 0;
    const wPct = wCh.length ? Math.round((wDone / wCh.length) * 100) : 0;

    let weekDaysDone = 0, weekDaysTotal = 0;
    for (let d = 0; d < 7; d++) {
      const ds = addDays(wk, d).toISOString().split('T')[0];
      if (new Date(ds) > new Date()) break;
      weekDaysTotal++;
      if (allDailyDone(kid.id, ds)) weekDaysDone++;
    }
    const weekPct = weekDaysTotal ? Math.round((weekDaysDone / weekDaysTotal) * 100) : 0;

    return `
<div class="dash-sect">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
    ${av(kid, 44, 24, `2px solid ${kid.color}`)}
    <div>
      <div style="font-weight:900;font-size:18px;color:#3D2970">${esc(kid.name)}</div>
      <div style="font-size:11px;font-weight:700;color:${lvl.color}">${lvl.emoji} ${lvl.title}</div>
    </div>
  </div>
  <div class="dash-grid">
    <div class="dash-card" style="border:2px solid ${kid.color}33">
      <div class="dash-num" style="color:${kid.color}">${dPct}%</div>
      <div class="dash-lbl">Today Morning</div>
      <div class="prog-bg" style="margin-top:6px"><div class="prog-fill" style="width:${dPct}%;background:${kid.color}"></div></div>
    </div>
    <div class="dash-card" style="border:2px solid ${kid.color}33">
      <div class="dash-num" style="color:${kid.color}">${wPct}%</div>
      <div class="dash-lbl">Weekly Chores</div>
      <div class="prog-bg" style="margin-top:6px"><div class="prog-fill" style="width:${wPct}%;background:${kid.color}"></div></div>
    </div>
    <div class="dash-card" style="border:2px solid #FF6B9D33">
      <div class="dash-num" style="color:#FF6B9D">🔥 ${streak.current}</div>
      <div class="dash-lbl">Day Streak</div>
    </div>
    <div class="dash-card" style="border:2px solid #9B79D533">
      <div class="dash-num" style="color:#9B79D5">⭐ ${S.stars[kid.id] || 0}</div>
      <div class="dash-lbl">Stars</div>
    </div>
  </div>
  <div style="background:#F8F4FF;border-radius:14px;padding:12px 14px">
    <div style="font-weight:800;font-size:13px;color:#5C3D99;margin-bottom:8px">This Week</div>
    <div class="dash-row"><span style="font-weight:700;color:#666;font-size:14px">Full days done</span><span style="font-weight:900;color:#3D2970">${weekDaysDone}/${weekDaysTotal} (${weekPct}%)</span></div>
    <div class="dash-row"><span style="font-weight:700;color:#666;font-size:14px">Evening chores today</span><span style="font-weight:900;color:#3D2970">${eDone}/${eCh.length}</span></div>
    <div class="dash-row"><span style="font-weight:700;color:#666;font-size:14px">Badges earned</span><span style="font-weight:900;color:#3D2970">${(S.badges[kid.id] || []).length}/${BADGE_DEFS.length}</span></div>
    <div class="dash-row"><span style="font-weight:700;color:#666;font-size:14px">Best streak ever</span><span style="font-weight:900;color:#3D2970">🔥 ${streak.longest} days</span></div>
  </div>
</div>`;
  }).join('');

  return `
<div class="page parent-page">
  <div class="container">
    <div class="ph" style="margin-bottom:20px">
      <button class="back-btn" onclick="goHome()" style="background:rgba(255,255,255,.22);color:white">←</button>
      <h1 style="font-weight:900;font-size:26px;color:white;margin:0;flex:1">📊 Dashboard</h1>
      <button onclick="navTo('report')" style="background:rgba(255,255,255,.2);border:none;color:white;font-weight:800;font-size:13px;border-radius:99px;padding:8px 14px;cursor:pointer">Monthly</button>
    </div>
    ${kidCols}
  </div>
</div>`;
}

// ══════════════════════════════════════════════════════════════════
// MONTHLY REPORT
// ══════════════════════════════════════════════════════════════════
function rReport() {
  const now = new Date();
  if (reportYear === null) { reportYear = now.getFullYear(); reportMonth = now.getMonth(); }
  const y = reportYear, m = reportMonth;
  const lastDay = new Date(y, m + 1, 0);

  // Build week-start dates that cover the whole month
  const weeks = [];
  const cur = new Date(y, m, 1);
  const dow = cur.getDay();
  cur.setDate(cur.getDate() - (dow === 0 ? 6 : dow - 1));
  while (cur <= lastDay) { weeks.push(new Date(cur)); cur.setDate(cur.getDate() + 7); }

  const weekRows = weeks.map((wStart, wi) => {
    const wkStr = wStart.toISOString().split('T')[0];
    const lbl   = wi === 0 && m === now.getMonth() && y === now.getFullYear() ? 'This Week' : fmtDate(wkStr);

    const kidRows = S.kids.map((kid) => {
      const dots = [];
      for (let d = 0; d < 7; d++) {
        const dd  = addDays(wkStr, d);
        const ds  = dd.toISOString().split('T')[0];
        const inM = dd.getMonth() === m, isFut = dd > now, isP = isPaused(ds);
        const ch  = S.dailyChores[kid.id] || [], tot = ch.length;
        const dn  = ch.filter((c) => isDailyChoreComplete(kid.id, c, ds)).length;

        let bg, lbl2, tc;
        if (!inM)         { bg = '#F8F8F8'; lbl2 = '';  tc = '#EEE'; }
        else if (isFut)   { bg = 'white';   lbl2 = '·'; tc = '#DDD'; }
        else if (isP)     { bg = '#E8EAF6'; lbl2 = '⏸'; tc = '#9FA8DA'; }
        else if (!tot)    { bg = '#F0F0F0'; lbl2 = '–'; tc = '#CCC'; }
        else if (dn===tot){ bg = '#FFD700'; lbl2 = '⭐'; tc = '#8B6A00'; }
        else if (dn > 0)  { bg = '#FFE89A'; lbl2 = dn;  tc = '#8B6A00'; }
        else              { bg = '#FFEBEE'; lbl2 = '✗'; tc = '#EF9A9A'; }
        dots.push(`<div class="rdot" style="background:${bg};color:${tc}">${lbl2}</div>`);
      }

      const wkD = wkChoresDone(kid.id, wkStr), wkT = (S.weeklyChores[kid.id] || []).length;
      const dDays  = dots.filter((_, di) => { const dd = addDays(wkStr, di); return dd.getMonth()===m && dd<=now && !isPaused(dd.toISOString().split('T')[0]) && allDailyDone(kid.id, dd.toISOString().split('T')[0]); }).length;
      const totD   = dots.filter((_, di) => { const dd = addDays(wkStr, di); return dd.getMonth()===m && dd<=now && !isPaused(dd.toISOString().split('T')[0]); }).length;

      return `
<div class="report-kid-row">
  ${av(kid, 28, 14, `2px solid ${kid.color}`)}
  <div class="report-dots">${dots.join('')}</div>
  <div style="font-size:12px;font-weight:800;color:#666;margin-left:4px;white-space:nowrap">${dDays}/${totD}d ${wkD}/${wkT}w</div>
</div>`;
    }).join('');

    return `
<div class="report-week">
  <div class="report-week-title">${lbl}</div>
  <div style="display:flex;gap:4px;margin-bottom:8px">
    ${['M','T','W','T','F','S','S'].map((d) => `<div style="width:28px;text-align:center;font-size:10px;font-weight:800;color:#CCC">${d}</div>`).join('')}
  </div>
  ${kidRows}
</div>`;
  }).join('');

  let mDays = {};
  S.kids.forEach((kid) => {
    mDays[kid.id] = 0;
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const ds = new Date(y, m, d).toISOString().split('T')[0];
      if (allDailyDone(kid.id, ds)) mDays[kid.id]++;
    }
  });

  const summary = `
<div style="background:white;border-radius:20px;padding:16px 18px;margin-bottom:12px">
  <div style="font-weight:900;font-size:17px;color:#5C3D99;margin-bottom:12px">Month Summary</div>
  ${S.kids.map((kid) => `
<div class="dash-row">
  <div style="display:flex;align-items:center;gap:8px">
    ${av(kid, 28, 14, `2px solid ${kid.color}`)}
    <span style="font-weight:800;color:#3D2970;font-size:14px">${esc(kid.name)}</span>
  </div>
  <div style="text-align:right">
    <div style="font-weight:900;color:${kid.color};font-size:15px">${mDays[kid.id]} full days</div>
    <div style="font-size:11px;color:#AAA;font-weight:700">⭐ ${S.stars[kid.id] || 0} stars</div>
  </div>
</div>`).join('')}
</div>`;

  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth();
  const prevM = m === 0 ? 11 : m - 1, prevY = m === 0 ? y - 1 : y;
  const nextM = m === 11 ? 0  : m + 1, nextY = m === 11 ? y + 1 : y;

  return `
<div class="page parent-page">
  <div class="container">
    <div class="ph" style="margin-bottom:20px">
      <button class="back-btn" onclick="navTo('dashboard')" style="background:rgba(255,255,255,.22);color:white">←</button>
      <h1 style="font-weight:900;font-size:24px;color:white;margin:0;flex:1">📋 Monthly Report</h1>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <button onclick="reportYear=${prevY};reportMonth=${prevM};render()" style="background:rgba(255,255,255,.2);border:none;color:white;font-weight:900;font-size:18px;border-radius:99px;width:40px;height:40px;cursor:pointer">‹</button>
      <div style="font-weight:900;font-size:18px;color:white">${fmtMonth(y, m)}</div>
      <button onclick="${isCurrentMonth ? '' : `reportYear=${nextY};reportMonth=${nextM};render()`}" style="background:rgba(255,255,255,${isCurrentMonth ? '.1' : '.2'});border:none;color:${isCurrentMonth ? 'rgba(255,255,255,.3)' : 'white'};font-weight:900;font-size:18px;border-radius:99px;width:40px;height:40px;cursor:pointer" ${isCurrentMonth ? 'disabled' : ''}>›</button>
    </div>
    ${summary}${weekRows}
    <div style="text-align:center;color:rgba(255,255,255,.5);font-size:12px;font-weight:700;margin-top:8px">Screenshot this page to save the report</div>
  </div>
</div>`;
}

// ══════════════════════════════════════════════════════════════════
// PIN
// ══════════════════════════════════════════════════════════════════
function rPin() {
  return `
<div class="pin-page">
  <div class="pin-box">
    <div style="font-size:50px;margin-bottom:12px">🔐</div>
    <div style="font-weight:900;font-size:26px;color:#5C3D99;margin-bottom:5px">Parent Zone</div>
    <p style="color:#BBB;font-weight:700;font-size:13px;margin-bottom:20px">Enter your 4-digit PIN</p>
    <input type="password" id="pinInp" maxlength="4" placeholder="••••" autocomplete="off"
      class="pin-inp${pinErr ? ' err' : ''}"
      oninput="onPinInput(this.value)" />
    ${pinErr ? `<div style="color:#FF4444;font-size:13px;font-weight:800;margin-top:7px">Wrong PIN!</div>` : ''}
    <div style="display:flex;gap:10px;margin-top:18px">
      <button class="btn btn-gh" onclick="goHome()" style="flex:1;font-size:15px">Cancel</button>
      <button class="btn btn-pu" onclick="checkPin()" style="flex:1;font-size:15px">Enter</button>
    </div>
  </div>
</div>`;
}

// ══════════════════════════════════════════════════════════════════
// PARENT ZONE
// ══════════════════════════════════════════════════════════════════
function rParent() {
  const t = today(), wk = weekKey();

  // ── Manage Children ─────────────────────────────────────────────
  const manageKids = S.kids.map((kid) => `
<div class="kid-manage-row">
  ${av(kid, 42, 22, `2px solid ${kid.color}`)}
  <div style="flex:1">
    <div style="font-weight:900;color:#3D2970;font-size:15px">${esc(kid.name)}</div>
    <div style="font-size:11px;color:#AAA;font-weight:700">⭐ ${S.stars[kid.id] || 0} stars · 🔥 ${(S.streaks[kid.id] || {}).current || 0} streak</div>
  </div>
  ${S.kids.length > 1
    ? `<button class="kid-manage-remove" onclick="confirmRemoveKid('${kid.id}','${esc(kid.name)}')">Remove</button>`
    : `<span style="font-size:11px;color:#CCC;font-weight:700">Last child</span>`
  }
</div>`).join('');

  // ── Photos & Icons ───────────────────────────────────────────────
  const photos = S.kids.map((kid) => {
    const hasPhoto = !!photoCache[kid.id];
    const thumb = hasPhoto
      ? `<img class="pu-thumb" src="${photoCache[kid.id]}" alt="${esc(kid.name)}" />`
      : `<div class="pu-emoji">${kid.avatar}</div>`;
    const isOpen = avatarPickerFor === kid.id;
    const picker = isOpen ? `
<div class="emoji-picker-wrap" style="margin-top:10px">
  <div style="font-weight:800;color:#5C3D99;margin-bottom:8px;font-size:13px">Choose an icon:</div>
  <div class="emoji-grid">${AVATARS.map((e) => `<span class="eopt" onclick="pickAvatar('${kid.id}','${e}')">${e}</span>`).join('')}</div>
  <button style="margin-top:8px;background:none;border:2px solid #EEE;border-radius:10px;padding:6px 14px;font-family:'Nunito',sans-serif;font-weight:700;color:#AAA;cursor:pointer" onclick="closeAvatarPicker()">✕ Close</button>
</div>` : '';

    return `
<div class="pu-area" style="flex-direction:column;align-items:stretch">
  <div style="display:flex;align-items:center;gap:12px">
    ${thumb}
    <div style="flex:1">
      <div style="font-weight:900;color:#5C3D99;margin-bottom:6px;font-size:14px">${esc(kid.name)}</div>
      <button class="pu-btn p" onclick="triggerUpload('${kid.id}')">📷 Upload Photo</button>
      <button class="pu-btn g" style="margin-top:4px" onclick="toggleAvatarPicker('${kid.id}')">${kid.avatar} Change Icon</button>
      ${hasPhoto ? `<button class="pu-btn g" style="margin-top:4px" onclick="rmPhoto('${kid.id}')">✕ Remove Photo</button>` : ''}
    </div>
  </div>${picker}
</div>
<input type="file" accept="image/*" id="fi_${kid.id}" class="file-inp" onchange="handleFile('${kid.id}',this)" />`;
  }).join('');

  // ── Names & Colors ───────────────────────────────────────────────
  const names = S.kids.map((kid) => `
<div style="margin-bottom:14px">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px">
    ${av(kid, 38, 20, `2px solid ${kid.color}`)}
    <input class="inp" value="${esc(kid.name)}" style="border-color:${kid.color};flex:1" onchange="updateName('${kid.id}',this.value)" />
  </div>
  <div class="color-row">
    <div id="sw_${kid.id}" class="color-swatch" style="background:${kid.color}">
      <input type="color" value="${kid.color}"
        oninput="previewColor('${kid.id}',this.value)"
        onchange="onColorChange('${kid.id}',this.value)" />
    </div>
    <span style="font-size:12px;font-weight:700;color:#AAA">Tap swatch to change color</span>
  </div>
</div>`).join('');

  // ── Chore editor buttons ─────────────────────────────────────────
  const choreEd = S.kids.map((kid) => `
<div style="margin-bottom:14px">
  <div style="font-weight:800;color:#5C3D99;margin-bottom:7px">${kid.avatar} ${esc(kid.name)}</div>
  <div style="display:flex;gap:6px;flex-wrap:wrap">
    <button class="btn btn-gh btn-sm" onclick="startEdit('daily','${kid.id}')">☀️ Morning</button>
    <button class="btn btn-gh btn-sm" onclick="startEdit('evening','${kid.id}')">🌙 Evening</button>
    <button class="btn btn-gh btn-sm" onclick="startEdit('weekly','${kid.id}')">📅 Weekly</button>
  </div>
</div>`).join('');

  // ── Uncheck completed ────────────────────────────────────────────
  const uncheckSect = S.kids.map((kid) => {
    const dDone = (S.dailyChores[kid.id]  || []).filter((c) => isDailyChoreComplete(kid.id, c, t));
    const eDone = (S.eveningChores[kid.id] || []).filter((c) => isEveningChoreComplete(kid.id, c, t));
    const wDone = (S.weeklyChores[kid.id]  || []).filter((c) => isWeeklyChoreComplete(kid.id, c, wk));
    if (!dDone.length && !eDone.length && !wDone.length)
      return `<div style="color:#CCC;font-weight:700;font-size:13px;padding:6px 0">${kid.avatar} ${esc(kid.name)} — nothing completed yet</div>`;

    const rows = [
      ...dDone.map((c) => `<div class="unchk-row"><span class="unchk-em">${c.emoji}</span><span class="unchk-lbl">${esc(c.label)} <span style="color:#AAA;font-size:10px">(morning)</span></span><button class="unchk-btn" onclick="confirmUncheck('daily','${kid.id}','${c.id}',${c.shared})">✕ Undo</button></div>`),
      ...eDone.map((c) => `<div class="unchk-row"><span class="unchk-em">${c.emoji}</span><span class="unchk-lbl">${esc(c.label)} <span style="color:#AAA;font-size:10px">(evening)</span></span><button class="unchk-btn" onclick="confirmUncheck('evening','${kid.id}','${c.id}',${c.shared})">✕ Undo</button></div>`),
      ...wDone.map((c) => `<div class="unchk-row"><span class="unchk-em">${c.emoji}</span><span class="unchk-lbl">${esc(c.label)} <span style="color:#AAA;font-size:10px">(weekly)</span></span><button class="unchk-btn" onclick="confirmUncheck('weekly','${kid.id}','${c.id}',${c.shared})">✕ Undo</button></div>`),
    ];
    return `<div style="margin-bottom:10px"><div style="font-weight:800;color:#5C3D99;font-size:13px;margin-bottom:4px">${kid.avatar} ${esc(kid.name)}</div>${rows.join('')}</div>`;
  }).join('');

  // ── Star totals ──────────────────────────────────────────────────
  const starR = S.kids.map((kid) => `
<div class="dash-row">
  <span style="font-weight:800;color:#5C3D99;font-size:15px">${kid.avatar} ${esc(kid.name)}</span>
  <div style="text-align:right">
    <div style="font-weight:900;color:#FFB800;font-size:18px">⭐ ${S.stars[kid.id] || 0}</div>
    <div style="font-size:11px;color:#AAA;font-weight:700">🌟 ${S.totalStars[kid.id] || 0} lifetime</div>
  </div>
</div>`).join('');

  const pausedList = S.pausedDays.length
    ? `<div style="font-size:12px;color:#7986CB;font-weight:700;margin-top:8px">Paused days: ${S.pausedDays.slice(-5).join(', ')}${S.pausedDays.length > 5 ? ' …' : ''}</div>`
    : '';

  return `
<div class="page parent-page">
  <div class="container">
    <div class="ph" style="margin-bottom:20px">
      <button class="back-btn" onclick="goHome()" style="background:rgba(255,255,255,.22);color:white">←</button>
      <h1 style="font-weight:900;font-size:28px;color:white;margin:0">🔐 Parent Zone</h1>
    </div>

    <div class="p-card">
      <div class="p-title">👶 Manage Children</div>
      ${manageKids}
      <button class="btn btn-da" style="margin-top:12px;font-size:16px" onclick="addKid()">+ Add Child</button>
    </div>

    <div class="p-card">
      <div class="p-title">📷 Kid Photos &amp; Icons</div>
      ${photos}
    </div>

    <div class="p-card">
      <div class="p-title">✏️ Names &amp; Colors</div>
      ${names}
    </div>

    <div class="p-card">
      <div class="p-title">📝 Edit Chores</div>
      ${choreEd}
    </div>

    <div class="p-card">
      <div class="p-title">⏸️ Pause Mode</div>
      <div class="toggle-row">
        <div>
          <div style="font-weight:800;color:#3D2970;font-size:15px">Pause Active</div>
          <div style="font-size:12px;color:#AAA;font-weight:600">Protects streaks on vacation or sick days</div>
        </div>
        <button class="toggle ${S.isPaused ? 'on' : 'off'}" onclick="togglePause()"></button>
      </div>
      <button class="btn btn-gh" style="margin-top:10px;font-size:14px;font-weight:800"
        onclick="confirm2('Pause today only?',pauseToday,'Today will be marked as paused.','⏸️')">⏸️ Pause Just Today</button>
      ${pausedList}
    </div>

    <div class="p-card">
      <div class="p-title">⏰ Reminders</div>
      <div class="toggle-row">
        <span style="font-weight:800;color:#3D2970;font-size:15px">Show Reminder Badges</span>
        <button class="toggle ${S.reminders.enabled ? 'on' : 'off'}" onclick="toggleReminders()"></button>
      </div>
      <div style="display:flex;gap:10px;margin-top:12px">
        <div style="flex:1">
          <div style="font-size:12px;font-weight:800;color:#AAA;margin-bottom:4px">Morning time</div>
          <input type="time" class="inp inp-sm" value="${S.reminders.morningTime}" onchange="S.reminders.morningTime=this.value;save()" />
        </div>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:800;color:#AAA;margin-bottom:4px">Evening time</div>
          <input type="time" class="inp inp-sm" value="${S.reminders.eveningTime}" onchange="S.reminders.eveningTime=this.value;save()" />
        </div>
      </div>
    </div>

    <div class="p-card">
      <div class="p-title">✕ Uncheck Completed Chores</div>
      ${uncheckSect}
    </div>

    <div class="p-card">
      <div class="p-title">⭐ Stars &amp; Progress</div>
      ${starR}
      <button class="btn btn-gh" style="margin-top:10px;font-size:15px;font-weight:800"
        onclick="confirm2('Clear all stars for everyone?',clearStars,'Every star will be erased.','🗑️')">🗑️ Clear All Stars</button>
    </div>

    <div class="p-card">
      <div class="p-title">🔧 Reset Chores</div>
      <button class="btn btn-re" style="margin-bottom:10px;font-size:16px"
        onclick="confirm2('Reset morning chores for everyone?',resetDaily,'All morning progress for today will be cleared.','🔄')">🔄 Reset Morning Chores</button>
      <button class="btn btn-re" style="margin-bottom:10px;font-size:16px"
        onclick="confirm2('Reset evening chores for everyone?',resetEvening,'All evening progress for today will be cleared.','🌙')">🌙 Reset Evening Chores</button>
      <button class="btn btn-or" style="font-size:16px"
        onclick="confirm2('Reset weekly chores for everyone?',resetWeekly,'All weekly progress for this week will be cleared.','📅')">📅 Reset Weekly Chores</button>
    </div>

    <div class="p-card">
      <div class="p-title">💾 Backup &amp; Restore</div>
      <button class="btn btn-gr" style="margin-bottom:10px;font-size:16px" onclick="exportData()">📥 Download Backup</button>
      <button class="btn btn-gh" style="font-size:15px;font-weight:800" onclick="document.getElementById('importInp').click()">📤 Restore from Backup</button>
      <div style="font-size:12px;color:#AAA;font-weight:600;margin-top:8px">Backup saves all chores, stars, history and settings.</div>
    </div>

    <div class="p-card">
      <div class="p-title">🔄 Family Sync</div>
      ${rSyncPanel()}
    </div>

    <div class="p-card">
      <div class="p-title">🔑 Change PIN</div>
      <input type="password" id="newPin" maxlength="4" placeholder="New 4-digit PIN" class="inp" style="margin-bottom:10px" />
      <button class="btn btn-pu" style="font-size:16px" onclick="doChangePin()">Save New PIN</button>
    </div>
  </div>
</div>`;
}

// ══════════════════════════════════════════════════════════════════
// EDIT CHORES
// ══════════════════════════════════════════════════════════════════
function rEdit() {
  const kid = S.kids.find((k) => k.id === editKidId);
  if (!kid) return rParent();

  const isWeekly = editTarget === 'weekly';
  const chores   = getEditList();
  const lbl      = editTarget === 'daily' ? '☀️ Morning' : editTarget === 'evening' ? '🌙 Evening' : '📅 Weekly';

  const picker = emojiFor !== null ? `
<div class="emoji-picker-wrap">
  <div style="font-weight:800;color:#5C3D99;margin-bottom:8px;font-size:13px">Choose an emoji:</div>
  <div class="emoji-grid">${EMOJIS.map((e) => `<span class="eopt" onclick="pickEmoji(${emojiFor},'${e}')">${e}</span>`).join('')}</div>
  <button style="margin-top:8px;background:none;border:2px solid #EEE;border-radius:10px;padding:6px 14px;font-family:'Nunito',sans-serif;font-weight:700;color:#AAA;cursor:pointer" onclick="closeEmojiPicker()">✕ Close</button>
</div>` : '';

  const rows = chores.map((c, i) => {
    const dayPicker = isWeekly ? `
<div class="day-btns">
  ${DAY_NAMES.map((d) => {
    const val    = d === 'Any' ? 'any' : d;
    const isOn   = (c.day || 'any') === val;
    return `<button class="day-btn ${isOn ? 'on' : ''}" onclick="setChoreDay(${i},'${val}')">${d}</button>`;
  }).join('')}
</div>` : '';

    const alarmPicker = `
<div class="alarm-row">
  <span style="font-size:11px;font-weight:800;color:#AAA">🔔 Sound:</span>
  ${ALARM_SOUNDS.map((a) => `<button class="alarm-chip ${(c.alarm || 'none') === a.id ? 'on' : ''}" onclick="setChoreAlarm(${i},'${a.id}')">${a.label}</button>`).join('')}
</div>`;

    return `
<div class="edit-row" style="animation-delay:${i * 0.05}s">
  <div class="ord-col">
    <button class="ord-btn" onclick="moveChore(${i},-1)" ${i === 0 ? 'disabled' : ''}>↑</button>
    <button class="ord-btn" onclick="moveChore(${i},1)"  ${i === chores.length - 1 ? 'disabled' : ''}>↓</button>
  </div>
  <span class="etap" onclick="toggleEmojiPicker(${i})">${c.emoji}</span>
  <div style="flex:1;min-width:0">
    <input class="inp" value="${esc(c.label)}" placeholder="Chore name" onchange="updateLabel(${i},this.value)" />
    <input class="inp note-inp" value="${esc(c.note || '')}" placeholder="Add a note (optional)" onchange="updateNote(${i},this.value)" />
    ${alarmPicker}
    ${dayPicker}
    <div class="shared-toggle" onclick="toggleShared(${i})">
      <div style="width:20px;height:20px;border-radius:4px;border:2px solid ${c.shared ? '#9B79D5' : '#DDD'};background:${c.shared ? '#9B79D5' : 'white'};display:flex;align-items:center;justify-content:center;color:white;font-size:12px">${c.shared ? '✓' : ''}</div>
      👥 Shared chore (both kids complete it together)
    </div>
  </div>
  <button class="del-btn" onclick="confirmDeleteChore(${i})">✕</button>
</div>`;
  }).join('');

  return `
<div class="page parent-page">
  <div class="container">
    <div class="ph" style="margin-bottom:16px">
      <button class="back-btn" onclick="backToParent()" style="background:rgba(255,255,255,.22);color:white">←</button>
      <div>
        <div style="font-weight:900;font-size:22px;color:white">${kid.avatar} ${lbl} Chores</div>
        <div style="color:rgba(255,255,255,.7);font-size:12px;font-weight:700">${esc(kid.name)}</div>
      </div>
    </div>
    ${picker}
    <div class="p-card">
      <div style="color:#BBB;font-size:12px;font-weight:700;margin-bottom:12px">↑↓ reorder · tap emoji to change · add notes &amp; sounds · ✕ delete</div>
      ${rows || '<div style="text-align:center;color:#DDD;padding:16px;font-weight:700">No chores yet</div>'}
    </div>
    <button class="btn btn-da" style="margin-bottom:12px;font-size:18px" onclick="addChore()">+ Add Chore</button>
    <button class="btn btn-pu" style="font-size:18px" onclick="saveChores()">✅ Save Changes</button>
  </div>
</div>`;
}
