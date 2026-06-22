const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('const DEFAULT_PROGRAM');
const end = html.indexOf('function saveDB()', start);
assert.ok(start >= 0 && end > start, 'store source should be present');

const loadStore = new Function(`${html.slice(start, end)}; return { DEFAULT_PROGRAM, freshDB, normalizeDB };`);
const { DEFAULT_PROGRAM, freshDB, normalizeDB } = loadStore();

assert.equal(DEFAULT_PROGRAM.id, 'fbabc');
assert.equal(DEFAULT_PROGRAM.name, 'Full Body A / B / C');
assert.deepEqual(DEFAULT_PROGRAM.days.map(day=>day.id), ['fba', 'fbb', 'fbc']);
assert.ok(DEFAULT_PROGRAM.days.every(day=>day.type === 'full'));
assert.deepEqual(DEFAULT_PROGRAM.days.map(day=>day.ex.length), [6, 6, 7]);
assert.equal(DEFAULT_PROGRAM.days.find(day=>day.id === 'fbb').warmup, '<strong>Warm-up (5–7 min):</strong> 5 min incline walk or bike · Band straight-arm pulldown ×15 · Hip hinge drill ×10 · Face pull ×15');
assert.equal(DEFAULT_PROGRAM.days.find(day=>day.id === 'fbc').warmup, '<strong>Warm-up (5–7 min):</strong> 5 min incline walk or bike · Band pull-aparts ×15 · Glute bridge ×12 · Bodyweight squat ×10');

const exercises = DEFAULT_PROGRAM.days.flatMap(day=>day.ex);
assert.deepEqual(exercises.find(ex=>ex.id === 'mcp').ramp, ['Light set × 12', 'Moderate set × 6–8']);
assert.deepEqual(exercises.find(ex=>ex.id === 'hsq').ramp, ['Empty sled / very light × 12–15', '~50–60% working weight × 8', '~75–80% working weight × 4–5']);
assert.deepEqual(exercises.find(ex=>ex.id === 'lpd').ramp, ['Light set × 12', 'Moderate set × 6–8']);
assert.deepEqual(exercises.find(ex=>ex.id === 'rdl').ramp, ['Empty bar / very light × 10', '~50–60% working weight × 6', '~75–80% working weight × 3–4']);
assert.deepEqual(exercises.find(ex=>ex.id === 'pdf').ramp, ['Light set × 15']);
assert.deepEqual(exercises.find(ex=>ex.id === 'lpr').ramp, ['Empty sled / very light × 12–15', '~50–60% working weight × 8', '~75–80% working weight × 4–5']);
assert.deepEqual(exercises.filter(ex=>Object.hasOwn(ex, 'ramp')).map(ex=>ex.id), ['mcp', 'hsq', 'lpd', 'rdl', 'pdf', 'lpr']);

const custom = freshDB();
custom.settings = { ...custom.settings, sound:false, customSetting:'kept' };
custom.logs = { orphan:[], broken:null };
custom.programs[0].days[0].ex.push({
  id:'custom:any/id', name:'Custom', muscle:'Other', sets:1, reps:'1', rest:1, why:''
});
const payload = { app:'overload', version:4, exported:new Date().toISOString(), db:custom, photos:[] };
const roundTripped = normalizeDB(JSON.parse(JSON.stringify(payload)).db);

assert.equal(roundTripped.settings.sound, false);
assert.equal(roundTripped.settings.customSetting, 'kept');
assert.equal(roundTripped.programs[0].days[0].ex.at(-1).id, 'custom:any/id');
assert.deepEqual(roundTripped.programs[0].days[0].ex.find(ex=>ex.id === 'mcp').ramp, ['Light set × 12', 'Moderate set × 6–8']);
assert.deepEqual(roundTripped.logs.orphan, []);
assert.ok(!('broken' in roundTripped.logs));
assert.deepEqual(normalizeDB({ ...freshDB(), logs:{} }).logs, {});

const legacy = {
  ...freshDB(),
  programs:[{
    id:'ppl', name:'Push / Pull / Legs',
    days:[
      {id:'push', ex:'mcp,clr,msp,ctp,pd'.split(',').map(id=>({id}))},
      {id:'pull', ex:'scr,lpd,cfp,mpc,sap'.split(',').map(id=>({id}))},
      {id:'legs', ex:'lpr,llc,hab,scr2,cc'.split(',').map(id=>({id}))},
      {id:'opt', ex:'clrb,idc,oct,cfp2,plk'.split(',').map(id=>({id}))}
    ]
  }],
  activeProgramId:'ppl'
};
const migrated = normalizeDB(legacy);
assert.equal(migrated.programs[0].id, 'fbabc');
assert.equal(migrated.activeProgramId, 'fbabc');

const editedLegacy = { ...legacy, programs:[{ ...legacy.programs[0], name:'My PPL' }] };
assert.equal(normalizeDB(editedLegacy).programs[0].id, 'ppl');
const customizedLegacy = structuredClone(legacy);
customizedLegacy.programs[0].days[0].ex.push({id:'my-custom-exercise'});
assert.equal(normalizeDB(customizedLegacy).programs[0].id, 'ppl');

console.log('round-trip and migration tests: ok');
