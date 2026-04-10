/**
 * Morning Stars — Constants
 * Edit these arrays to customise emojis, badges, levels and themes.
 */

const EMOJIS = [
  '🛏️','🚿','🦷','💧','👕','🧹','🧸','👚','🗑️','🌀',
  '📚','🎒','🍽️','🥣','🐕','🪴','🧴','🛁','🧼','🪥',
  '👟','🧦','🧺','📖','✏️','🎨','🎵','🏃','🍎','🥤',
  '🌟','❤️','🐱','🐶','🦋','🌈','🌸','🎯','🏆','🧃',
  '🌙','🌃','⚽','🎮','🧩','🪆','🎪','🏊','🚲','🌺',
];

const AVATARS = [
  '🌸','🌟','⭐','🌈','🦋','🌻','🎀','🎵','🎨','🏆',
  '🚀','🦁','🐯','🐻','🐼','🦊','🐸','🦄','🐬','🦅',
  '🍀','🍉','🍭','🎠','🦸','🧁','🍦','🌺','🍓','🎸',
  '🏅','🦖','🐲','🌙','☀️','🔥','💎','🌊','🧠','🎭',
];

const DAY_NAMES  = ['Any','Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_FULL   = ['Any Day','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_SHORT  = ['Any','M','Tu','W','Th','F','Sa','Su'];

/** DOW_MAP converts three-letter day code to JS getDay() value (0=Sun) */
const DOW_MAP = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 };

/** Badge definitions — id, emoji, title, description */
const BADGE_DEFS = [
  { id:'first_day',    emoji:'🌱', title:'First Steps',    desc:'Completed a full day!' },
  { id:'streak_3',     emoji:'🔥', title:'On Fire',         desc:'3 days in a row!' },
  { id:'streak_7',     emoji:'⚡', title:'Week Warrior',    desc:'7 days in a row!' },
  { id:'streak_14',    emoji:'💪', title:'Fortnight Hero',  desc:'14 days in a row!' },
  { id:'streak_30',    emoji:'👑', title:'Monthly Master',  desc:'30 days in a row!' },
  { id:'stars_10',     emoji:'⭐', title:'Star Collector',  desc:'Earned 10 stars!' },
  { id:'stars_25',     emoji:'🌟', title:'Star Hunter',     desc:'Earned 25 stars!' },
  { id:'stars_50',     emoji:'💫', title:'Star Legend',     desc:'Earned 50 stars!' },
  { id:'stars_100',    emoji:'🌌', title:'Star Galaxy',     desc:'Earned 100 stars!' },
  { id:'evening_done', emoji:'🌙', title:'Night Owl',       desc:'Completed evening routine!' },
  { id:'weekly_done',  emoji:'📅', title:'Weekly Champ',    desc:'All weekly chores done!' },
  { id:'perfect_week', emoji:'🏆', title:'Perfect Week',    desc:'All chores every day for a week!' },
  { id:'both_done',    emoji:'✨', title:'Full Day',        desc:'Morning and evening done!' },
];

/** Level thresholds based on lifetime stars earned */
const LEVELS = [
  { min:0,   title:'Apprentice',   emoji:'🌱', color:'#8BC34A' },
  { min:15,  title:'Helper',       emoji:'⭐', color:'#FFC107' },
  { min:35,  title:'Champion',     emoji:'🏅', color:'#FF9800' },
  { min:75,  title:'Superstar',    emoji:'🚀', color:'#9C27B0' },
  { min:150, title:'Legend',       emoji:'👑', color:'#F44336' },
  { min:300, title:'Hall of Fame', emoji:'🌈', color:'#E91E63' },
];

/** Background theme options available to each child */
const THEMES = [
  { id:'sunrise',  name:'Sunrise',  bg:'linear-gradient(160deg,#FFF9C4,#FCE4EC,#E3F2FD)' },
  { id:'sunshine', name:'Sunshine', bg:'linear-gradient(160deg,#FFF8E1,#FFE082,#FFB300)' },
  { id:'ocean',    name:'Ocean',    bg:'linear-gradient(160deg,#E3F2FD,#90CAF9,#1565C0)' },
  { id:'forest',   name:'Forest',   bg:'linear-gradient(160deg,#F1F8E9,#A5D6A7,#2E7D32)' },
  { id:'sunset',   name:'Sunset',   bg:'linear-gradient(160deg,#FFF3E0,#FFCC80,#F4511E)' },
  { id:'galaxy',   name:'Galaxy',   bg:'linear-gradient(160deg,#E8EAF6,#7986CB,#1A237E)' },
  { id:'candy',    name:'Candy',    bg:'linear-gradient(160deg,#FCE4EC,#F48FB1,#CE93D8)' },
  { id:'mint',     name:'Mint',     bg:'linear-gradient(160deg,#E0F7FA,#80DEEA,#00838F)' },
];

/** Alarm sound options shown in the chore editor */
const ALARM_SOUNDS = [
  { id:'none',    label:'🔇 None' },
  { id:'ding',    label:'🔔 Ding' },
  { id:'chime',   label:'🎵 Chime' },
  { id:'fanfare', label:'🎺 Fanfare' },
  { id:'pop',     label:'🫧 Pop' },
  { id:'star',    label:'⭐ Star' },
];

/** Color palette used when auto-assigning color to a new child */
const KID_COLORS  = ['#FF6B9D','#4ECDC4','#A78BFA','#FFB800','#FF9500','#43A047','#1976D2','#E91E63'];
const KID_AVATARS = ['🌸','🌟','🌈','🦁','🚀','🦋','🐬','🏆'];
