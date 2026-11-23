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
  applyTags,
  findListToken,
  formatList,
  parseInput,
  formatMod,
  parseColor,
  barPercent,
  barColor,
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
  assert.deepEqual(items.hp.reset, { on: ['long'], to: 'max' });
  assert.deepEqual(items.stress.reset, { on: ['session'], to: 'min' });
  assert.deepEqual(items.fate.reset, { on: ['session'], to: 3 });
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

test('parseBlock: reset on a list of names', () => {
  const src = [
    'grit: { value: 2, max: 4, reset: { on: [scene, episode, season], to: 0 } }',
    'luck: { value: 1, reset: { on: [episode, episode, " "], to: 0 } }',
    'one: { value: 1, reset: { on: [season], to: 0 } }',
    'none: { value: 1, reset: { on: [], to: 0 } }',
    'conds: { type: tags, options: [a], value: [a], reset: { on: [scene, long], to: none } }',
  ].join('\n');
  const items = Object.fromEntries(parseBlock(src, t)[0].items.map((i) => [i.key, i]));
  assert.deepEqual(items.grit.reset, { on: ['scene', 'episode', 'season'], to: 0 });
  assert.deepEqual(items.luck.reset, { on: ['episode'], to: 0 });
  assert.deepEqual(items.one.reset, { on: ['season'], to: 0 });
  assert.equal(items.none.resetError, 'emptyOn');
  assert.equal(items.none.reset, undefined);
  assert.deepEqual(items.conds.reset, { on: ['scene', 'long'], to: [] });
});

test('countResets and applyReset with lists of reset names', () => {
  const lines = [
    '```ttrpgsk-counters',
    'grit: { value: 2, reset: { on: [scene, episode, season], to: 0 } }',
    'drive: { value: 3, reset: { on: [episode, season], to: 0 } }',
    'legacy: { value: 1, reset: { on: season, to: 0 } }',
    'ki: { value: 1, max: 3, reset: { on: [short], to: max } }',
    '```',
  ];
  const counts = countResets(collectResets(lines, t));
  assert.deepEqual(Object.fromEntries(counts), { scene: 1, episode: 2, season: 3, short: 1 });
  assert.deepEqual(applyReset(lines, 'scene', t).changes.map((c) => c.label), ['grit']);
  assert.deepEqual(applyReset(lines, 'episode', t).changes.map((c) => c.label), ['grit', 'drive']);
  const season = applyReset(lines, 'season', t);
  assert.deepEqual(season.changes.map((c) => c.label), ['grit', 'drive', 'legacy']);
  assert.equal(season.lines[1], 'grit: { value: 0, reset: { on: [scene, episode, season], to: 0 } }');
  // The long rest still covers what resets on a short rest, list or not.
  assert.deepEqual(applyReset(lines, 'long', t).changes.map((c) => c.label), ['ki']);
});

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

// ---------------------------------------------------------------------------
// Tags (conditions)
// ---------------------------------------------------------------------------

test('parseBlock: tags counters', () => {
  const src = [
    'c:',
    '  label: Conditions',
    '  type: tags',
    '  options: [Blinded, Poisoned, Prone]',
    '  value: [Poisoned, Hasted]',
    '  reset: { on: long, to: none }',
    'd: { type: tags, options: [a, b], value: [], reset: { on: short, to: [a] } }',
    'e: { type: tags, options: oops, value: [] }',
    'f: { type: tags, options: [a], value: [], reset: { on: long, to: max } }',
  ].join('\n');
  const items = Object.fromEntries(parseBlock(src, t)[0].items.map((i) => [i.key, i]));
  assert.equal(items.c.type, 'tags');
  assert.deepEqual(items.c.options, ['Blinded', 'Poisoned', 'Prone', 'Hasted']);
  assert.deepEqual(items.c.value, ['Poisoned', 'Hasted']);
  assert.deepEqual(items.c.reset, { on: ['long'], to: [] });
  assert.deepEqual(items.d.reset, { on: ['short'], to: ['a'] });
  assert.equal(items.e.tagsError, 'notList');
  assert.equal(items.f.resetError, 'tagsTo');
  for (const k of Object.keys(t.tagsErrors)) assert.ok(STRINGS.it.tagsErrors[k], k);
});

test('formatList quotes only when needed', () => {
  assert.equal(formatList([]), '[]');
  assert.equal(formatList(['Poisoned', 'Privo di sensi']), '[Poisoned, Privo di sensi]');
  assert.equal(formatList(['Hex: cursed', 'a,b', 'true', '3', "Wanderer's"]), `["Hex: cursed", "a,b", "true", "3", Wanderer's]`);
});

test('findListToken and applyTags: block and flow forms', () => {
  const block = ['c:', '  type: tags', '  options: [Blinded, Poisoned]   # all', '  value: [Poisoned]', 'x: 1'];
  assert.deepEqual(findListToken(block, ['c'], 'value').list, ['Poisoned']);
  const toggled = applyTags(block, ['c'], (cur) => ({ options: cur.options, value: [] }));
  assert.equal(toggled.lines[3], '  value: []');
  assert.equal(toggled.lines[2], block[2]);
  const added = applyTags(block, ['c'], (cur) => ({ options: [...cur.options, 'Hex: cursed'], value: [...cur.value, 'Hex: cursed'] }));
  assert.equal(added.lines[2], '  options: [Blinded, Poisoned, "Hex: cursed"]   # all');
  assert.equal(added.lines[3], '  value: [Poisoned, "Hex: cursed"]');

  const flow = ['d: { type: tags, options: [a, b], value: [b], label: Flags }'];
  const r = applyTags(flow, ['d'], (cur) => ({ options: [...cur.options, 'c'], value: ['a', 'c'] }));
  assert.equal(r.lines[0], 'd: { type: tags, options: [a, b, c], value: [a, c], label: Flags }');

  const dashed = ['e:', '  type: tags', '  options:', '    - a', '  value: []'];
  assert.equal(findListToken(dashed, ['e'], 'options'), null);
  assert.equal(applyTags(dashed, ['e'], (cur) => cur), null);
});

test('reset and undo with tags', () => {
  const lines = [
    '```ttrpgsk-counters',
    'hp: { value: 3, max: 9, reset: { on: long, to: max } }',
    'c: { type: tags, options: [Poisoned, Prone], value: [Poisoned, Prone], reset: { on: long, to: none } }',
    'd: { type: tags, options: [a], value: [], reset: { on: long, to: [a, z] } }',
    '```',
  ];
  const { lines: out, changes } = applyReset(lines, 'long', t);
  assert.equal(out[2], 'c: { type: tags, options: [Poisoned, Prone], value: [], reset: { on: long, to: none } }');
  assert.equal(out[3], 'd: { type: tags, options: [a, z], value: [a, z], reset: { on: long, to: [a, z] } }');
  assert.deepEqual(changes.map((c) => [c.label, c.kind || 'number']), [['hp', 'number'], ['c', 'tags'], ['d', 'tags']]);
  assert.deepEqual(applyUndo(out, changes), lines);
  const edited = out.slice();
  edited[2] = edited[2].replace('value: []', 'value: [Prone]');
  assert.equal(applyUndo(edited, changes), null);
  assert.equal(applyReset(out, 'long', t).changes.length, 0);
});

// ---------------------------------------------------------------------------
// Bars
// ---------------------------------------------------------------------------

test('parseBlock: bars need a max above min', () => {
  const [g] = parseBlock(
    [
      'hp: { type: bar, value: 23/40 }',
      'nomax: { type: bar, value: 5 }',
      'flat: { type: bar, value: 3, min: 5, max: 5 }',
    ].join('\n'),
    t
  );
  assert.deepEqual(g.items.map((i) => i.type), ['bar', 'number', 'number']);
  assert.equal(g.items[0].max, 40);
});

test('parseColor: palette names and hex codes', () => {
  assert.equal(parseColor('red'), 'var(--color-red)');
  assert.equal(parseColor(' Green '), 'var(--color-green)');
  assert.equal(parseColor('#C33'), '#c33');
  assert.equal(parseColor('#12345678'), '#12345678');
  assert.equal(parseColor('crimson'), null);
  assert.equal(parseColor('#12'), null);
});

test('bars: fill and threshold colours', () => {
  const src = [
    'hp:',
    '  type: bar',
    '  value: 10/40',
    '  color: green',
    '  colors: { 50%: yellow, 25%: red }',
    'rep:',
    '  type: bar',
    '  value: 15/100',
    '  min: -100',
    '  colors: { 0: red }',
  ].join('\n');
  const [g] = parseBlock(src, t);
  const [hp, rep] = g.items;
  assert.equal(barPercent(hp), 25);
  // At or below a threshold: the lowest one that applies wins.
  assert.equal(barColor(hp), 'var(--color-red)');
  assert.equal(barColor({ ...hp, value: 11 }), 'var(--color-yellow)');
  assert.equal(barColor({ ...hp, value: 20 }), 'var(--color-yellow)');
  assert.equal(barColor({ ...hp, value: 21 }), 'var(--color-green)');
  // Fill is clamped to 0–100.
  assert.equal(barPercent({ ...hp, value: 50 }), 100);
  assert.equal(barPercent({ ...hp, value: -3 }), 0);
  // Absolute thresholds and a negative min.
  assert.ok(Math.abs(barPercent(rep) - 57.5) < 1e-9);
  assert.equal(barColor(rep), null);
  assert.equal(barColor({ ...rep, value: -20 }), 'var(--color-red)');
});

test('bars: bad colours and thresholds give a warning', () => {
  const [g] = parseBlock(
    [
      'a: { type: bar, value: 1/2, color: crimson }',
      'b: { type: bar, value: 1/2, colors: { half: red } }',
      'c: { type: bar, value: 1/2, colors: { 50%: blu } }',
      'd: { type: bar, value: 1/2, colors: red }',
      'e: { type: bar, value: 1/2, colors: { 50%: red } }',
    ].join('\n'),
    t
  );
  assert.deepEqual(
    g.items.map((i) => i.barError),
    [{ key: 'color', arg: 'crimson' }, { key: 'threshold', arg: 'half' }, { key: 'color', arg: 'blu' }, { key: 'colors' }, undefined]
  );
});

test('bars: the templates parse in both languages', () => {
  for (const lang of [STRINGS.en, STRINGS.it]) {
    const tpl = buildTemplates(lang).find((x) => x.id === 'insert-bar');
    const body = tpl.text.split('\n').slice(1, -1).join('\n');
    const [g] = parseBlock(body, lang);
    assert.deepEqual(g.items.map((i) => i.type), ['bar', 'bar']);
    assert.ok(g.items.every((i) => !i.barError));
    assert.equal(barColor(g.items[0]), null);
    assert.equal(barColor(g.items[1]), 'var(--color-green)');
  }
});
