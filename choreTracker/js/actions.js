/**
 * Morning Stars — Action Functions
 * Called from onclick/onchange/oninput attributes in render.js.
 */

// ── CONFIRM MODAL ─────────────────────────────────────────────────
let _modalCallback = null;

function confirm2(message, callback, subText, icon, danger) {
  _modalCallback = callback;
  document.getElementById('modal-icon').textContent = icon || '⚠️';
  document.getElementById('modal-msg').textContent  = message;
  document.getElementById('modal-sub').textContent  = subText || 'This cannot be undone.';

  const okBtn = document.getElementById('modal-ok');
  okBtn.className = 'modal-ok' + (danger !== false ? ' danger' : '');

  document.getElementById('modal').style.display = 'flex';
}

function modalConfirm() {
  document.getElementById('modal').style.display = 'none';
  if (_modalCallback) { _modalCallback(); _modalCallback = null; }
}

function modalCancel() {
  document.getElementById('modal').style.display = 'none';
  _modalCallback = null;
}

// ── NAVIGATION ────────────────────────────────────────────────────
function navTo(targetView, targetKidId) {
  view = targetView;
  if (targetKidId !== undefined) kidId = targetKidId;
  if (targetView === 'kid') tab = 'morning';
  avatarPickerFor = null;
  emojiFor = null;
  render();
}

function openKid(id)  { navTo('kid', id); }
function goHome()     { view = 'home'; avatarPickerFor = null; render(); }
function goPin()      { pinBuf = ''; pinErr = false; view = 'pin'; avatarPickerFor = null; render(); }
function setTab(t)    { tab = t; render(); }
function backToParent(){ view = 'parent'; emojiFor = null; render(); }

// ── PIN ───────────────────────────────────────────────────────────
function onPinInput(value) {
  pinBuf = value;
  if (value.length === 4) checkPin();
}

async function checkPin() {
  const val = document.getElementById('pinInp')?.value || pinBuf;
  const hashed = await hashPin(val);
  if (hashed === S.settings.pinHash) {
    pinBuf = ''; pinErr = false; view = 'parent'; render();
  } else {
    pinErr = true; render();
    setTimeout(() => { pinErr = false; render(); }, 1600);
  }
}

// ── TAPPING A CHORE ──────────────────────────────────────────────
function tapChore(type, choreId, event, isShared) {
  const kid = S.kids.find((k) => k.id === kidId);
  if (!kid) return;

  const t  = today();
  const wk = weekKey();

  // Find the chore to get its alarm setting
  const choreSrc = (type === 'morning' ? S.dailyChores : type === 'evening' ? S.eveningChores : S.weeklyChores)[kidId] || [];
  const choreObj = choreSrc.find((c) => c.id === choreId);
  if (choreObj?.alarm && choreObj.alarm !== 'none') playAlarm(choreObj.alarm);

  if (isShared) {
    const bucket = type === 'morning' ? S.completedShared.daily
                 : type === 'evening' ? S.completedShared.evening
                 : S.completedShared.weekly;
    const key    = type === 'weekly' ? wk : t;
    if (!bucket[key]) bucket[key] = {};
    bucket[key][choreId] = true;

    // Award star to every kid that has this shared chore
    S.kids.forEach((k) => {
      const list = (type === 'morning' ? S.dailyChores : type === 'evening' ? S.eveningChores : S.weeklyChores)[k.id] || [];
      if (list.find((c) => c.id === choreId && c.shared)) {
        S.stars[k.id]      = (S.stars[k.id]      || 0) + 1;
        S.totalStars[k.id] = (S.totalStars[k.id] || 0) + 1;
      }
    });
  } else {
    if (type === 'morning') {
      if (!S.completedDaily[t])        S.completedDaily[t] = {};
      if (!S.completedDaily[t][kidId]) S.completedDaily[t][kidId] = {};
      S.completedDaily[t][kidId][choreId] = true;
    } else if (type === 'evening') {
      if (!S.completedEvening[t])        S.completedEvening[t] = {};
      if (!S.completedEvening[t][kidId]) S.completedEvening[t][kidId] = {};
      S.completedEvening[t][kidId][choreId] = true;
    } else {
      if (!S.completedWeekly[wk])        S.completedWeekly[wk] = {};
      if (!S.completedWeekly[wk][kidId]) S.completedWeekly[wk][kidId] = {};
      S.completedWeekly[wk][kidId][choreId] = true;
    }
    S.stars[kidId]      = (S.stars[kidId]      || 0) + 1;
    S.totalStars[kidId] = (S.totalStars[kidId] || 0) + 1;
  }

  burstStar(event);
  checkAllComplete(kidId, type, t, wk);
  save();
  render();
}

function checkAllComplete(kId, type, t, wk) {
  if (type === 'morning' && allDailyDone(kId, t)) {
    updateStreak(kId, t);
    checkBadges(kId);
    setTimeout(() => celebrate(S.kids.find((k) => k.id === kId), 'morning'), 220);
  } else if (type === 'evening' && allEveningDone(kId, t)) {
    checkBadges(kId);
    setTimeout(() => celebrate(S.kids.find((k) => k.id === kId), 'evening'), 220);
  } else if (type === 'weekly' && allWeeklyDone(kId, wk)) {
    checkBadges(kId);
    setTimeout(() => celebrate(S.kids.find((k) => k.id === kId), 'weekly'), 220);
  } else {
    checkBadges(kId);
  }
}

// ── STREAK ────────────────────────────────────────────────────────
function updateStreak(kId, todayStr) {
  if (!S.streaks[kId]) S.streaks[kId] = { current: 0, longest: 0, lastDate: null };
  const st = S.streaks[kId];
  if (st.lastDate === todayStr) return;

  const yesterday = dateKey(-1);
  const prevOk    = allDailyDone(kId, yesterday) || isPaused(yesterday) || (st.lastDate === yesterday && st.current > 0);
  st.current  = prevOk ? st.current + 1 : 1;
  st.longest  = Math.max(st.longest, st.current);
  st.lastDate = todayStr;
}

// ── BADGES ────────────────────────────────────────────────────────
function checkBadges(kId) {
  if (!S.badges[kId]) S.badges[kId] = [];
  const earned    = S.badges[kId];
  const ts        = S.totalStars[kId] || 0;
  const st        = S.streaks[kId]    || { current: 0 };
  const t  = today(), wk = weekKey();
  const newBadges = [];

  const award = (id) => {
    if (!earned.includes(id)) { earned.push(id); newBadges.push(id); }
  };

  if (allDailyDone(kId, t))  award('first_day');
  if (st.current >= 3)        award('streak_3');
  if (st.current >= 7)        award('streak_7');
  if (st.current >= 14)       award('streak_14');
  if (st.current >= 30)       award('streak_30');
  if (ts >= 10)               award('stars_10');
  if (ts >= 25)               award('stars_25');
  if (ts >= 50)               award('stars_50');
  if (ts >= 100)              award('stars_100');
  if (allEveningDone(kId, t)) award('evening_done');
  if (allWeeklyDone(kId, wk)) award('weekly_done');
  if (allDailyDone(kId, t) && allEveningDone(kId, t)) award('both_done');

  // Perfect week — all non-future, non-paused days in the current week
  let perfectWeek = true;
  for (let d = 0; d < 7; d++) {
    const ds = addDays(wk, d).toISOString().split('T')[0];
    if (new Date(ds) > new Date()) break;
    if (!allDailyDone(kId, ds) && !isPaused(ds)) { perfectWeek = false; break; }
  }
  if (perfectWeek) award('perfect_week');

  if (newBadges.length) {
    save();
    const kid   = S.kids.find((k) => k.id === kId);
    const badgeDef = BADGE_DEFS.find((b) => b.id === newBadges[0]);
    if (kid && badgeDef) {
      setTimeout(() => showBadgeToast(badgeDef), 800);
    }
  }
}

function showBadgeToast(badgeDef) {
  const el = document.createElement('div');
  el.className = 'badge-toast';
  el.innerHTML = `
<div style="font-size:32px">${badgeDef.emoji}</div>
<div style="font-weight:900;color:#3D2970;font-size:15px">New Badge!</div>
<div style="font-size:13px;color:#666;font-weight:700">${badgeDef.title}</div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── VISUAL EFFECTS ────────────────────────────────────────────────
function burstStar(event) {
  const fx = document.getElementById('fx');
  const r  = event.currentTarget.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'sfx';
  el.textContent = '⭐';
  el.style.left = `${r.left + r.width  / 2 - 16}px`;
  el.style.top  = `${r.top  + r.height / 2 - 16}px`;
  fx.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function celebrate(kid, type) {
  if (!kid) return;
  const fx   = document.getElementById('fx');
  const cols = [kid.color, '#FFD700', '#FF6B9D', '#4ECDC4', '#A78BFA', '#FFB800'];

  for (let i = 0; i < 50; i++) {
    const p   = document.createElement('div');
    const sz  = 7 + Math.random() * 11;
    const dur = (1.4 + Math.random() * 2).toFixed(2);
    const del = (Math.random() * 0.5).toFixed(2);
    p.className = 'cpx';
    p.style.cssText = `left:${Math.random() * 100}%;width:${sz}px;height:${sz}px;background:${cols[i % cols.length]};border-radius:${Math.random() > 0.5 ? '50%' : '3px'};--dur:${dur}s;--delay:${del}s;`;
    fx.appendChild(p);
    setTimeout(() => p.remove(), (+dur + +del + 0.2) * 1000);
  }

  const msg = type === 'morning' ? 'Morning Done!' : type === 'evening' ? 'Sleep tight!' : 'Week Complete!';
  const cel = document.createElement('div');
  cel.className = 'cel';
  cel.innerHTML = `<div class="cel-box" style="box-shadow:0 20px 60px ${kid.color}55;font-size:36px">🎉<br><span style="color:${kid.color};font-size:26px">${msg}</span></div>`;
  document.getElementById('app').appendChild(cel);
  setTimeout(() => cel.remove(), 2800);
}

// ── PHOTO UPLOAD ──────────────────────────────────────────────────
function triggerUpload(id) {
  document.getElementById('fi_' + id)?.click();
}

function handleFile(id, input) {
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const MAX = 300;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else       { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      await savePhoto(id, dataUrl);
      photoCache[id] = dataUrl;
      render();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function rmPhoto(id) {
  confirm2('Remove photo?', async () => {
    await deletePhoto(id);
    photoCache[id] = null;
    render();
  }, 'Emoji icon will be shown.', '📷');
}

// ── AVATAR PICKER ─────────────────────────────────────────────────
function toggleAvatarPicker(id) {
  avatarPickerFor = avatarPickerFor === id ? null : id;
  render();
}

function closeAvatarPicker() {
  avatarPickerFor = null;
  render();
}

function pickAvatar(id, emoji) {
  const kid = S.kids.find((k) => k.id === id);
  if (kid) { kid.avatar = emoji; save(); }
  avatarPickerFor = null;
  render();
}

// ── NAMES & COLORS ────────────────────────────────────────────────
function updateName(id, val) {
  const kid = S.kids.find((k) => k.id === id);
  if (kid) { kid.name = val; save(); }
}

function updateKidColor(id, hex) {
  const kid = S.kids.find((k) => k.id === id);
  if (!kid) return;
  kid.color   = hex;
  kid.bgColor = lightenColor(hex);
  save(); render();
}

function previewColor(id, hex) {
  const swatch = document.getElementById('sw_' + id);
  if (swatch) swatch.style.background = hex;
}

function onColorChange(id, hex) {
  confirm2('Change theme color?', () => updateKidColor(id, hex), 'The app will update to match.', '🎨', false);
}

function setKidTheme(id, themeId) {
  const kid = S.kids.find((k) => k.id === id);
  if (kid) { kid.themeId = themeId; save(); render(); }
}

// ── MANAGE CHILDREN ───────────────────────────────────────────────
function addKid() {
  const id  = 'kid_' + Date.now();
  const idx = S.kids.length % KID_COLORS.length;
  const color = KID_COLORS[idx];

  const newKid = {
    id,
    name:    'New Child',
    avatar:  KID_AVATARS[idx],
    color,
    bgColor: lightenColor(color),
    photo:   null,
    themeId: 'sunrise',
  };

  S.kids.push(newKid);
  S.stars[id]      = 0;
  S.totalStars[id] = 0;
  S.streaks[id]    = { current: 0, longest: 0, lastDate: null };
  S.badges[id]     = [];
  S.dailyChores[id]   = DEFAULT_MORNING_CHORES.map((c) => ({ ...c }));
  S.eveningChores[id] = DEFAULT_EVENING_CHORES.map((c) => ({ ...c }));
  S.weeklyChores[id]  = DEFAULT_WEEKLY_CHORES.map((c) => ({ ...c }));

  save(); render();
}

function confirmRemoveKid(id, name) {
  confirm2(`Remove ${name}?`, () => removeKid(id), 'All their chores, stars and history will be deleted.', '🗑️');
}

function removeKid(id) {
  S.kids = S.kids.filter((k) => k.id !== id);
  ['stars','totalStars','streaks','badges','dailyChores','eveningChores','weeklyChores'].forEach((key) => {
    delete S[key][id];
  });
  Object.keys(S.completedDaily).forEach((d)   => { delete S.completedDaily[d][id]; });
  Object.keys(S.completedEvening).forEach((d) => { delete S.completedEvening[d][id]; });
  Object.keys(S.completedWeekly).forEach((w)  => { delete S.completedWeekly[w][id]; });
  deletePhoto(id).catch(() => {});
  delete photoCache[id];
  save(); render();
}

// ── EDIT CHORE ACTIONS ────────────────────────────────────────────
function startEdit(type, id) {
  editTarget = type; editKidId = id; emojiFor = null; view = 'editChores'; render();
}

function getEditList() {
  const map = { daily: S.dailyChores, evening: S.eveningChores, weekly: S.weeklyChores };
  return (map[editTarget] || S.dailyChores)[editKidId] || [];
}

function toggleEmojiPicker(i)  { emojiFor = emojiFor === i ? null : i; render(); }
function closeEmojiPicker()    { emojiFor = null; render(); }
function pickEmoji(i, emoji)   { const l = getEditList(); if (l[i]) l[i].emoji = emoji; emojiFor = null; render(); }
function updateLabel(i, val)   { const l = getEditList(); if (l[i]) l[i].label = val; }
function updateNote(i, val)    { const l = getEditList(); if (l[i]) l[i].note  = val; }
function setChoreAlarm(i, snd) { const l = getEditList(); if (l[i]) l[i].alarm = snd; render(); }
function setChoreDay(i, day)   { const l = getEditList(); if (l[i]) l[i].day   = day; render(); }
function toggleShared(i)       { const l = getEditList(); if (l[i]) l[i].shared = !l[i].shared; render(); }

function moveChore(i, dir) {
  const l = getEditList();
  const j = i + dir;
  if (j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]];
  emojiFor = null; render();
}

function addChore() {
  const map    = { daily: S.dailyChores, evening: S.eveningChores, weekly: S.weeklyChores };
  const target = map[editTarget] || S.dailyChores;
  if (!target[editKidId]) target[editKidId] = [];
  const base = { id: 'c' + Date.now(), label: 'New Chore', emoji: '⭐', note: '', shared: false, alarm: 'none' };
  if (editTarget === 'weekly') base.day = 'any';
  target[editKidId].push(base);
  emojiFor = null; render();
}

function confirmDeleteChore(i) {
  confirm2('Delete this chore?', () => removeChore(i), 'It will be removed from the list.', '🗑️');
}

function removeChore(i) {
  const l = getEditList();
  if (l) { l.splice(i, 1); emojiFor = null; render(); }
}

function saveChores() { save(); view = 'parent'; emojiFor = null; render(); }

// ── UNCHECK ───────────────────────────────────────────────────────
function confirmUncheck(type, kId, choreId, isShared) {
  confirm2('Uncheck this chore?', () => uncheckChore(type, kId, choreId, isShared), 'One star will be deducted.', '⭐');
}

function uncheckChore(type, kId, choreId, isShared) {
  const t  = today(), wk = weekKey();
  if (isShared) {
    const bucket = type === 'daily' ? S.completedShared.daily
                 : type === 'evening' ? S.completedShared.evening
                 : S.completedShared.weekly;
    const key = type === 'weekly' ? wk : t;
    if (bucket[key]) delete bucket[key][choreId];
    S.kids.forEach((k) => {
      if (S.stars[k.id] > 0)      S.stars[k.id]--;
      if (S.totalStars[k.id] > 0) S.totalStars[k.id]--;
    });
  } else {
    if (type === 'daily')   { if (S.completedDaily[t]?.[kId])   delete S.completedDaily[t][kId][choreId]; }
    if (type === 'evening') { if (S.completedEvening[t]?.[kId]) delete S.completedEvening[t][kId][choreId]; }
    if (type === 'weekly')  { if (S.completedWeekly[wk]?.[kId]) delete S.completedWeekly[wk][kId][choreId]; }
    if (S.stars[kId] > 0)      S.stars[kId]--;
    if (S.totalStars[kId] > 0) S.totalStars[kId]--;
  }
  save(); render();
}

// ── PARENT CONTROLS ───────────────────────────────────────────────
function clearStars()     { S.kids.forEach((k) => { S.stars[k.id] = 0; }); save(); render(); }
function resetDaily()     { const t = today();  S.completedDaily[t]   = {}; S.completedShared.daily[t]   = {}; save(); render(); }
function resetEvening()   { const t = today();  S.completedEvening[t] = {}; S.completedShared.evening[t] = {}; save(); render(); }
function resetWeekly()    { const wk = weekKey(); S.completedWeekly[wk] = {}; S.completedShared.weekly[wk] = {}; save(); render(); }
function togglePause()    { S.isPaused = !S.isPaused; save(); render(); }
function toggleReminders(){ S.reminders.enabled = !S.reminders.enabled; save(); render(); }

function pauseToday() {
  const t = today();
  if (!S.pausedDays.includes(t)) S.pausedDays.push(t);
  save(); render();
}

function doChangePin() {
  const v = (document.getElementById('newPin')?.value || '').trim();
  if (!/^\d{4}$/.test(v)) {
    confirm2('Invalid PIN', () => {}, 'Please enter exactly 4 digits.', '⚠️', false);
    return;
  }
  confirm2('Change Parent Zone PIN?', async () => {
    S.settings.pinHash = await hashPin(v);
    save(); render();
  }, 'Remember the new PIN.', '🔑', false);
}

// ── BACKUP / RESTORE ──────────────────────────────────────────────
async function exportData() {
  // Include photos in the backup so they can be restored
  const exportState = JSON.parse(JSON.stringify(S));
  for (const kid of exportState.kids) {
    kid.photo = photoCache[kid.id] || null;
  }
  const blob = new Blob([JSON.stringify(exportState, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'morning-stars-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

function validateBackup(data) {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.kids) || data.kids.length === 0) return false;
  if (!data.settings || typeof data.settings !== 'object') return false;
  if (!data.dailyChores || typeof data.dailyChores !== 'object') return false;
  if (!data.stars || typeof data.stars !== 'object') return false;
  for (const kid of data.kids) {
    if (!kid.id || !kid.name) return false;
  }
  return true;
}

function importData(input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!validateBackup(data)) {
        confirm2('Invalid Backup', () => {}, 'The file is missing required data (kids, chores, stars, or settings).', '⚠️', false);
        return;
      }
      confirm2('Restore this backup?', async () => {
        // Migrate photos from backup into IndexedDB
        for (const kid of data.kids) {
          if (kid.photo) {
            await savePhoto(kid.id, kid.photo);
            photoCache[kid.id] = kid.photo;
            kid.photo = null;
          }
        }
        // Migrate plaintext pin if present
        if (data.settings.pin && !data.settings.pinHash) {
          data.settings.pinHash = await hashPin(data.settings.pin);
          delete data.settings.pin;
        }
        S = data;
        pruneOldData(S);
        save();
        photoCache = await loadAllPhotos(S.kids);
        render();
      }, 'This will replace all current data.', '📤');
    } catch {
      confirm2('Read Error', () => {}, 'Could not parse the backup file.', '⚠️', false);
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// ── SYNC ACTIONS ──────────────────────────────────────────────────
async function doSyncJoin() {
  const code = document.getElementById('syncCode')?.value?.trim();
  if (!code) { confirm2('Missing Code', () => {}, 'Enter the family code from the other device.', '⚠️', false); return; }
  try {
    await syncJoinFamily(code);
    confirm2('Joined!', () => { render(); }, 'This device is now synced.', '🌟', false);
  } catch (e) {
    confirm2('Join Failed', () => {}, 'Family not found. Check the code.', '⚠️', false);
  }
}

function doSyncDisconnect() {
  syncDisconnect();
  render();
}

// Wire up the import file input (defined in index.html, outside the render cycle)
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('importInp').addEventListener('change', function () {
    importData(this);
  });
  document.getElementById('modal-cancel').addEventListener('click', modalCancel);
  document.getElementById('modal-ok').addEventListener('click', modalConfirm);
});
