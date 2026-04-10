/**
 * Morning Stars — Utility Functions
 */

// ── STRING HELPERS ────────────────────────────────────────────────
/** HTML-escape a value so it is safe to embed in template strings */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── DATE HELPERS ──────────────────────────────────────────────────
/** Returns today's date as YYYY-MM-DD in local time */
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Returns the Monday of the week containing the given date (or today) as YYYY-MM-DD */
function weekKey(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const dow = d.getDay();
  d.setDate(d.getDate() - dow + (dow === 0 ? -6 : 1));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Returns a new Date object offset by n days from the given YYYY-MM-DD string */
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d;
}

/** Returns today offset by n days as a YYYY-MM-DD string */
function dateKey(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const pad = (v) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Formats a Date or YYYY-MM-DD string as "Jan 1" */
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Formats a year + zero-based month as "January 2025" */
function fmtMonth(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Returns current time as "HH:MM" */
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Returns today's day-of-week (0=Sun … 6=Sat) */
function todayDow() {
  return new Date().getDay();
}

// ── COLOUR HELPERS ────────────────────────────────────────────────
/** Creates a very light tint of the given hex colour (12% colour, 88% white) */
function lightenColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r * 0.12 + 255 * 0.88);
  const lg = Math.round(g * 0.12 + 255 * 0.88);
  const lb = Math.round(b * 0.12 + 255 * 0.88);
  return '#' + [lr, lg, lb].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ── LEVEL / THEME ─────────────────────────────────────────────────
/** Returns the current Level object for the given lifetime-star count */
function getLevel(stars) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (stars >= l.min) level = l;
  }
  return level;
}

/** Returns the next Level object (or null if max level) */
function getNextLevel(stars) {
  for (const l of LEVELS) {
    if (stars < l.min) return l;
  }
  return null;
}

/** Looks up a Theme by id, falling back to the first theme */
function getTheme(themeId) {
  return THEMES.find((t) => t.id === themeId) || THEMES[0];
}

// ── AVATAR HTML ───────────────────────────────────────────────────
/**
 * Returns HTML for a kid's avatar circle.
 * Renders a photo if one is saved, otherwise the emoji avatar.
 */
function av(kid, size = 72, fontSize = 38, border = '3px solid #EEE', extraClass = '') {
  const cls = ['av', extraClass].filter(Boolean).join(' ');
  const style = `width:${size}px;height:${size}px;border:${border}`;
  const photo = photoCache[kid.id];
  if (photo) {
    return `<div class="${cls}" style="${style}"><img src="${esc(photo)}" alt="${esc(kid.name)}" /></div>`;
  }
  return `<div class="${cls}" style="${style};font-size:${fontSize}px">${kid.avatar}</div>`;
}

// ── COMPLETION CHECKS ─────────────────────────────────────────────
/** True if a single daily chore is marked done (handles shared chores) */
function isDailyChoreComplete(kidId, chore, dateStr) {
  if (chore.shared) return !!S.completedShared.daily[dateStr]?.[chore.id];
  return !!S.completedDaily[dateStr]?.[kidId]?.[chore.id];
}

/** True if a single evening chore is marked done */
function isEveningChoreComplete(kidId, chore, dateStr) {
  if (chore.shared) return !!S.completedShared.evening[dateStr]?.[chore.id];
  return !!S.completedEvening[dateStr]?.[kidId]?.[chore.id];
}

/** True if a single weekly chore is marked done */
function isWeeklyChoreComplete(kidId, chore, wkStr) {
  if (chore.shared) return !!S.completedShared.weekly[wkStr]?.[chore.id];
  return !!S.completedWeekly[wkStr]?.[kidId]?.[chore.id];
}

/** True if every morning chore for the given kid/date is complete */
function allDailyDone(kidId, dateStr) {
  const chores = S.dailyChores[kidId] || [];
  return chores.length > 0 && chores.every((c) => isDailyChoreComplete(kidId, c, dateStr));
}

/** True if every evening chore for the given kid/date is complete */
function allEveningDone(kidId, dateStr) {
  const chores = S.eveningChores[kidId] || [];
  return chores.length > 0 && chores.every((c) => isEveningChoreComplete(kidId, c, dateStr));
}

/** True if every weekly chore for the given kid/week is complete */
function allWeeklyDone(kidId, wkStr) {
  const chores = S.weeklyChores[kidId] || [];
  return chores.length > 0 && chores.every((c) => isWeeklyChoreComplete(kidId, c, wkStr));
}

/** True if today (or the given date) is flagged as paused */
function isPaused(dateStr) {
  return S.isPaused || S.pausedDays.includes(dateStr || today());
}

/** Returns the number of weekly chores completed for kid/week */
function wkChoresDone(kidId, wkStr) {
  return (S.weeklyChores[kidId] || []).filter((c) => isWeeklyChoreComplete(kidId, c, wkStr)).length;
}
