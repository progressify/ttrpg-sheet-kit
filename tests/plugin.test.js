// Run with: npm test  (no dependencies, uses node:test)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

// Minimal stand-in for the `obsidian` module, with a small YAML reader
// in place of Obsidian's parseYaml.
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === 'obsidian') {
    return {
      Plugin: class {},
      Notice: class {},
      TFile: class {},
      SuggestModal: class {},
      parseYaml: require('./yaml-lite').parseYaml,
      moment: { locale: () => 'en' },
    };
  }
  return originalLoad.call(this, request, ...args);
};

const {
  parseValue,
  parseBlock,
  updateBlockLines,
  findBlocks,
  locateBlock,
  countResets,
  collectResets,
  applyReset,
  applyUndo,
  parseInput,
  formatMod,
  columnsCallout,
  buildTemplates,
  STRINGS,
} = require(path.join(__dirname, '..', 'main.js'))._internals;

const t = STRINGS.en;
const update = (src, p, fn) => {
  const r = updateBlockLines(src.split('\n'), p, fn);
  return r && r.join('\n');
};

test('parseValue', () => {
  assert.deepEqual(parseValue(7), { value: 7, max: null });
  assert.deepEqual(parseValue('2/3'), { value: 2, max: 3 });
  assert.deepEqual(parseValue(' -1 '), { value: -1, max: null });
  assert.equal(parseValue('hello'), null);
});

test('formatMod', () => {
  assert.equal(formatMod(27), '+8');
  assert.equal(formatMod(14), '+2');
  assert.equal(formatMod(10), '+0');
  assert.equal(formatMod(9), '-1');
});

test('parseBlock: flat block with options', () => {
  const [g] = parseBlock(JSON.stringify({ layout: 'horizontal', mod: true, STR: 14, hp: '2/3' }), t);
  assert.equal(g.layout, 'horizontal');
  assert.deepEqual(
    g.items.map((i) => [i.key, i.value, i.max, i.mod]),
    [
      ['STR', 14, null, true],
      ['hp', 2, 3, true],
    ]
  );
});

test('parseBlock: Italian layout alias and long form', () => {
  const [g] = parseBlock(JSON.stringify({ layout: 'orizzontale', pf: { label: 'PF', value: 5, max: 9, min: null } }), t);
  assert.equal(g.layout, 'horizontal');
  assert.equal(g.items[0].label, 'PF');
  assert.equal(g.items[0].min, null);
});

test('parseBlock: track without max falls back to number', () => {
  const [g] = parseBlock(JSON.stringify({ a: { type: 'track', max: 3, value: 1 }, b: { type: 'track', value: 1 } }), t);
  assert.deepEqual(g.items.map((i) => i.type), ['track', 'number']);
});

test('parseBlock: groups', () => {
  const groups = parseBlock(
    JSON.stringify({ layout: 'horizontal', coins: { label: 'Coins', items: { gold: 1 } }, stats: { layout: 'vertical', items: { str: 10 } } }),
    t
  );
  assert.deepEqual(
    groups.map((g) => [g.key, g.label, g.layout]),
    [
      ['coins', 'Coins', 'horizontal'],
      ['stats', null, 'vertical'],
    ]
  );
});

test('parseBlock: rejects non-map content', () => {
  assert.throws(() => parseBlock('[1, 2]', t), /key: value/);
});

test('update: short forms keep the rest of the line', () => {
  assert.equal(update('gold: 7\nsilver: 2', ['silver'], (c) => c + 1), 'gold: 7\nsilver: 3');
  assert.equal(update('current: 2/3', ['current'], (c) => c - 1), 'current: 1/3');
  assert.equal(update('gold: "7" # comment', ['gold'], (c) => c + 10), 'gold: "17" # comment');
  assert.equal(update('x: -2', ['x'], (c) => c + 1), 'x: -1');
});

test('update: flow and block forms', () => {
  assert.equal(
    update('pn: { label: "Platinum (old)", value: 6 }', ['pn'], (c) => c - 1),
    'pn: { label: "Platinum (old)", value: 5 }'
  );
  assert.equal(
    update('str:\n  label: STR\n  value: 10\nint: 3', ['str'], (c) => c + 1),
    'str:\n  label: STR\n  value: 11\nint: 3'
  );
});

test('update: groups resolve the right key', () => {
  const g = [
    'layout: horizontal',
    'coins:',
    '  label: Coins',
    '  items:',
    '    gold: 1',
    'stats:',
    '  items:',
    '    gold: 9',
    '    str:',
    '      value: 10',
  ].join('\n');
  assert.equal(update(g, ['stats', 'items', 'gold'], (c) => c + 1).split('\n')[7], '    gold: 10');
  assert.equal(update(g, ['coins', 'items', 'gold'], (c) => c + 1).split('\n')[4], '    gold: 2');
  assert.equal(update(g, ['stats', 'items', 'str'], (c) => c - 2).split('\n')[9], '      value: 8');
  assert.equal(update(g, ['coins', 'items', 'str'], (c) => c), null);
  assert.equal(update('x: hello', ['x'], (c) => c), null);
});

test('locateBlock: plain and inside a callout', () => {
  const file = ['# title', '> [!ttrpgsk-columns]', '> ```ttrpgsk-counters', '> gold: 7', '> ```', '', '```ttrpgsk-counters', 'gold: 7', '```'];
  assert.deepEqual(locateBlock(file, { lineStart: 6 }, 'gold: 7'), { open: 6, close: 8, prefix: '', index: 1 });
  assert.deepEqual(locateBlock(file, { lineStart: 2 }, 'gold: 7'), { open: 2, close: 4, prefix: '> ', index: 0 });
  assert.deepEqual(locateBlock(file, null, 'gold: 7'), { open: 2, close: 4, prefix: '> ', index: 0 });
  assert.deepEqual(locateBlock(file, { lineStart: 0 }, 'gold: 7'), { open: 2, close: 4, prefix: '> ', index: 0 });
  assert.equal(locateBlock(file, null, 'gold: 8'), null);
});

test('columnsCallout wraps the selection', () => {
  assert.equal(columnsCallout('one\n\ntwo', t), '> [!ttrpgsk-columns] Title\n> one\n>\n> two');
  assert.equal(columnsCallout('', STRINGS.it).split('\n')[0], '> [!ttrpgsk-columns] Titolo');
});

test('templates: same ids and shape in every language', () => {
  const en = buildTemplates(STRINGS.en);
  const it = buildTemplates(STRINGS.it);
  assert.deepEqual(en.map((x) => x.id), it.map((x) => x.id));
  for (const tpl of [...en, ...it]) {
    assert.ok(tpl.name && tpl.desc, tpl.id);
    if (!tpl.columns) assert.match(tpl.text, /^```ttrpgsk-counters\n[\s\S]+\n```$/);
  }
});

// ---------------------------------------------------------------------------
// Direct input, reset, undo
// ---------------------------------------------------------------------------

test('parseInput: absolute, relative and invalid values', () => {
  assert.equal(parseInput('25')(10), 25);
  assert.equal(parseInput(' +5 ')(10), 15);
  assert.equal(parseInput('-17')(37), 20);
  assert.equal(parseInput('=-2')(5), -2);
  assert.equal(parseInput('= 0')(5), 0);
  assert.equal(parseInput('abc'), null);
  assert.equal(parseInput(''), null);
  assert.equal(parseInput('1.5'), null);
  assert.equal(parseInput('--3'), null);
});

test('parseBlock: reset needs both on and to', () => {
  const src = [
    'hp: { value: 3, max: 9, reset: { on: long, to: max } }',
    'stress: { value: 2, max: 3, reset: { on: session, to: min } }',
    'fate: { value: 1, reset: { on: session, to: 3 } }',
    'a: { value: 1, reset: long }',
    'b: { value: 1, reset: { on: long } }',
    'c: { value: 1, reset: { to: max } }',
    'd: { value: 1, reset: { on: long, to: max } }',
    'e: { value: 1, min: null, reset: { on: long, to: min } }',
    'f: { value: 1, reset: { on: long, to: lots } }',
  ].join('\n');
  const items = Object.fromEntries(parseBlock(src, t)[0].items.map((i) => [i.key, i]));
  assert.deepEqual(items.hp.reset, { on: 'long', to: 'max' });
  assert.deepEqual(items.stress.reset, { on: 'session', to: 'min' });
  assert.deepEqual(items.fate.reset, { on: 'session', to: 3 });
  assert.equal(items.a.resetError, 'invalid');
  assert.equal(items.b.resetError, 'invalid');
  assert.equal(items.c.resetError, 'invalid');
  assert.equal(items.d.resetError, 'noMax');
  assert.equal(items.e.resetError, 'noMin');
  assert.equal(items.f.resetError, 'invalid');
  for (const k of ['a', 'b', 'c', 'd', 'e', 'f']) assert.equal(items[k].reset, undefined, k);
  for (const k of Object.keys(t.resetErrors)) assert.ok(STRINGS.it.resetErrors[k], k);
});

const sheet = [
  '# Sheet',
  '```ttrpgsk-counters',
  'hp:',
  '  label: HP',
  '  value: 20      # current',
  '  max: 44',
  '  reset: { on: long, to: max }',
  'temp: { value: 5, reset: { on: short, to: 0 } }',
  'broken: { value: 9, reset: long }',
  '```',
  '',
  '> [!ttrpgsk-columns]',
  '> ```ttrpgsk-counters',
  '> slots:',
  '>   items:',
  '>     s1: { type: track, max: 4, value: 3, reset: { on: long, to: min } }',
  '>     fate: { value: 1, reset: { on: session, to: 3 } }',
  '> ```',
];

test('findBlocks and countResets', () => {
  assert.deepEqual(
    findBlocks(sheet).map((b) => [b.open, b.close, b.prefix, b.index]),
    [
      [1, 9, '', 0],
      [12, 17, '> ', 1],
    ]
  );
  const counts = countResets(collectResets(sheet, t));
  assert.deepEqual(Object.fromEntries(counts), { long: 3, short: 1, session: 1 });
});

test('applyReset: long rest also resets short, keeps comments and prefixes', () => {
  const { lines, changes } = applyReset(sheet, 'long', t);
  assert.equal(lines[4], '  value: 44      # current');
  assert.equal(lines[7], 'temp: { value: 0, reset: { on: short, to: 0 } }');
  assert.equal(lines[8], 'broken: { value: 9, reset: long }');
  assert.equal(lines[15], '>     s1: { type: track, max: 4, value: 0, reset: { on: long, to: min } }');
  assert.equal(lines[16], sheet[16]);
  assert.deepEqual(
    changes.map((c) => [c.label, c.from, c.to]),
    [
      ['HP', 20, 44],
      ['temp', 5, 0],
      ['s1', 3, 0],
    ]
  );
  assert.equal(lines.length, sheet.length);
});

test('applyReset: short rest only, and nothing to do', () => {
  const short = applyReset(sheet, 'short', t);
  assert.deepEqual(short.changes.map((c) => c.label), ['temp']);
  const session = applyReset(sheet, 'session', t);
  assert.equal(session.lines[16], '>     fate: { value: 3, reset: { on: session, to: 3 } }');
  const again = applyReset(session.lines, 'session', t);
  assert.equal(again.changes.length, 0);
});

test('applyUndo restores, and refuses when values changed meanwhile', () => {
  const { lines, changes } = applyReset(sheet, 'long', t);
  assert.deepEqual(applyUndo(lines, changes), sheet);
  const edited = lines.slice();
  edited[4] = '  value: 30      # current';
  assert.equal(applyUndo(edited, changes), null);
});
