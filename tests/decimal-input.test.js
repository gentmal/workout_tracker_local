const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = html.match(/const parseDecimal = ([^;]+);/);
assert.ok(match, 'decimal parser should be present');

const parseDecimal = new Function(`return (${match[1]});`)();
assert.equal(parseDecimal('12.5'), 12.5);
assert.equal(parseDecimal('12,5'), 12.5);
assert.ok(Number.isNaN(parseDecimal('')));

const decimalInputs = [...html.matchAll(/<input\b[^>]*inputmode="decimal"[^>]*>/g)].map(match => match[0]);
assert.ok(decimalInputs.length > 0, 'decimal inputs should be present');
assert.ok(decimalInputs.every(input => /type="text"/.test(input)), 'decimal inputs must allow iOS comma input');

console.log('decimal input tests: ok');
