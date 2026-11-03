// Run with: npm test  (no dependencies, uses node:test)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

// Minimal stand-in for the `obsidian` module. parseYaml uses JSON.parse:
// JSON is valid YAML, which is enough to test the parsing logic.
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === 'obsidian') {
    return {
      Plugin: class {},
      Notice: class {},
      TFile: class {},
      SuggestModal: class {},
      parseYaml: (s) => JSON.parse(s),
      moment: { locale: () => 'en' },
    };
  }
  return originalLoad.call(this, request, ...args);
};

const {
  parseValue,
  parseBlock,
  updateBlockLines,
  locateBlock,
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
  assert.deepEqual(locateBlock(file, { lineStart: 6 }, 'gold: 7'), { open: 6, close: 8, prefix: '' });
  assert.deepEqual(locateBlock(file, { lineStart: 2 }, 'gold: 7'), { open: 2, close: 4, prefix: '> ' });
  assert.deepEqual(locateBlock(file, null, 'gold: 7'), { open: 2, close: 4, prefix: '> ' });
  assert.deepEqual(locateBlock(file, { lineStart: 0 }, 'gold: 7'), { open: 2, close: 4, prefix: '> ' });
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
