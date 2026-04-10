/**
 * Morning Stars — Default State
 *
 * Edit DEFAULT_MORNING_CHORES, DEFAULT_EVENING_CHORES and
 * DEFAULT_WEEKLY_CHORES to change what new children start with.
 * Each chore object has: id, label, emoji, note, shared, alarm.
 * Weekly chores also have: day  ('any'|'Mon'|'Tue'|...).
 */

const DEFAULT_MORNING_CHORES = [
  { id:'bed',         label:'Make Bed',     emoji:'🛏️', note:'',               shared:false, alarm:'none' },
  { id:'face',        label:'Wash Face',    emoji:'🚿', note:'',               shared:false, alarm:'none' },
  { id:'teeth',       label:'Brush Teeth',  emoji:'🦷', note:'',               shared:false, alarm:'none' },
  { id:'moisturize',  label:'Moisturize',   emoji:'💧', note:'',               shared:false, alarm:'none' },
  { id:'dressed',     label:'Get Dressed',  emoji:'👕', note:'',               shared:false, alarm:'none' },
];

const DEFAULT_EVENING_CHORES = [
  { id:'pjs',         label:'Put on PJs',       emoji:'🌙', note:'',                  shared:false, alarm:'none' },
  { id:'teeth2',      label:'Brush Teeth',      emoji:'🦷', note:'',                  shared:false, alarm:'none' },
  { id:'read',        label:'Reading Time',     emoji:'📖', note:'10 minutes',        shared:false, alarm:'none' },
];

const DEFAULT_WEEKLY_CHORES = [
  { id:'room',        label:'Clean Room',        emoji:'🧹', note:'', day:'any', shared:false, alarm:'none' },
  { id:'toys',        label:'Put Away Toys',     emoji:'🧸', note:'', day:'any', shared:false, alarm:'none' },
  { id:'laundry',     label:'Put Laundry Away',  emoji:'👚', note:'', day:'any', shared:false, alarm:'none' },
];

/**
 * Deep-clones the default chore arrays so each child gets independent copies.
 * Assigns fresh unique IDs so two children's chores never share IDs.
 */
function cloneDefaultChores(type) {
  const src =
    type === 'morning' ? DEFAULT_MORNING_CHORES :
    type === 'evening' ? DEFAULT_EVENING_CHORES :
    DEFAULT_WEEKLY_CHORES;

  return src.map((c) => ({
    ...c,
    id: c.id + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
  }));
}

/** Generates a unique chore ID */
function _uid(base) {
  return base + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

/** Full application state shape — used as the baseline for new installs */
const DEFAULT_STATE = {
  kids: [
    {
      id: 'kid1',
      name: 'Child 1',
      avatar: '🌸',
      color: '#FF6B9D',
      bgColor: '#FFF0F5',
      photo: null,
      themeId: 'sunrise',
    },
    {
      id: 'kid2',
      name: 'Child 2',
      avatar: '🌟',
      color: '#4ECDC4',
      bgColor: '#F0FFFE',
      photo: null,
      themeId: 'sunrise',
    },
  ],

  dailyChores: {
    kid1: cloneDefaultChores('morning'),
    kid2: cloneDefaultChores('morning'),
  },

  eveningChores: {
    kid1: cloneDefaultChores('evening'),
    kid2: [
      ...cloneDefaultChores('evening'),
      { id:_uid('bag'),     label:'Pack School Bag',  emoji:'🎒', note:'',          shared:false, alarm:'none' },
      { id:_uid('clothes'), label:'Lay Out Clothes',  emoji:'👚', note:'For tomorrow', shared:false, alarm:'none' },
    ],
  },

  weeklyChores: {
    kid1: cloneDefaultChores('weekly'),
    kid2: [
      { id:_uid('room'),    label:'Clean Room',        emoji:'🧹', note:'', day:'any', shared:false, alarm:'none' },
      { id:_uid('trash'),   label:'Take Out Trash',    emoji:'🗑️', note:'', day:'Wed', shared:false, alarm:'none' },
      { id:_uid('vacuum'),  label:'Vacuum',            emoji:'🌀', note:'', day:'Sat', shared:false, alarm:'none' },
      { id:_uid('laundry'), label:'Put Laundry Away',  emoji:'👚', note:'', day:'any', shared:false, alarm:'none' },
    ],
  },

  completedDaily:   {},
  completedEvening: {},
  completedWeekly:  {},

  completedShared: {
    daily:   {},
    evening: {},
    weekly:  {},
  },

  stars:      { kid1: 0, kid2: 0 },
  totalStars: { kid1: 0, kid2: 0 },

  streaks: {
    kid1: { current: 0, longest: 0, lastDate: null },
    kid2: { current: 0, longest: 0, lastDate: null },
  },

  badges: { kid1: [], kid2: [] },

  pausedDays: [],
  isPaused:   false,

  reminders: {
    morningTime: '09:00',
    eveningTime: '20:00',
    enabled:     true,
  },

  settings: { pinHash: null },
};
