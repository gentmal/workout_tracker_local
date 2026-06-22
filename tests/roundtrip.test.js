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
