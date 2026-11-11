const { Plugin, Notice, TFile, SuggestModal, parseYaml, moment } = require('obsidian');

const BLOCK_LANG = 'ttrpgsk-counters';
// Reserved keys: block/group options, never counters.
const RESERVED = ['label', 'name', 'layout', 'mod'];
const LAYOUTS = {
  vertical: 'vertical',
  verticale: 'vertical',
  horizontal: 'horizontal',
  orizzontale: 'horizontal',
};

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

const fence = (lines) => '```' + BLOCK_LANG + '\n' + lines.join('\n') + '\n```';

const STRINGS = {
  en: {
    insertBlock: 'Insert block…',
    insertPrefix: 'Insert: ',
    menuItem: 'Insert TTRPG Sheet Kit block…',
    placeholder: 'Choose a block to insert…',
    notFound: (key) => `TTRPG Sheet Kit: cannot find "${key}" in the file.`,
    notAMap: 'the block must contain key: value pairs',
    decrease: 'Decrease',
    increase: 'Increase',
    editHint: 'Click to type a value: 25, +5, -17 (=-2 for a negative value)',
    resetCommand: 'Reset…',
    resetPlaceholder: 'Choose what to reset…',
    resetCount: (n) => (n === 1 ? '1 value' : `${n} values`),
    resetTooltip: (on, to) => `Resets on "${on}" → ${to}`,
    resetDone: (name, n) => `Reset "${name}": ${n === 1 ? '1 value' : `${n} values`} restored`,
    resetNothing: (name) => `Reset "${name}": every value is already at its reset point.`,
    resetErrors: {
      invalid: 'reset needs both "on" and "to", e.g. reset: { on: long, to: max }',
      noMax: 'reset to "max" needs a max',
      noMin: 'reset to "min" needs a min (min: null has none)',
    },
    undoCommand: 'Undo last change',
    undoButton: 'Undo',
    undone: (n) => `Undone: ${n === 1 ? '1 value' : `${n} values`} restored.`,
    undoConflict: 'Cannot undo: those values were changed in the meantime.',
    columnsTitle: 'Title',
    columnsSample: ['- first item', '- second item', '- third item'],
    templates: {
      vertical: {
        name: 'Vertical counters',
        desc: 'One counter per row, with −/+',
        lines: ['label: Title             # optional', 'gold: 10', 'arrows: 18', 'hit_dice: 2/3            # value/maximum'],
      },
      horizontal: {
        name: 'Horizontal counters',
        desc: 'Counters side by side, label on top (e.g. coins)',
        lines: ['layout: horizontal', 'platinum: 0', 'gold: 0', 'silver: 0', 'copper: 0'],
      },
      abilities: {
        name: 'D&D ability scores',
        desc: 'STR, DEX, CON, INT, WIS, CHA with modifier',
        lines: [
          'layout: horizontal',
          'mod: true                # show the modifier, e.g. 14 → (+2)',
          'STR: 10',
          'DEX: 10',
          'CON: 10',
          'INT: 10',
          'WIS: 10',
          'CHA: 10',
        ],
      },
      track: {
        name: 'Checkbox track',
        desc: 'Boxes to tick (stress, spell slots, daily uses)',
        lines: [
          'stress: { label: Stress, type: track, max: 3, value: 0 }',
          'slot_1: { label: 1st level slots, type: track, max: 4, value: 0, reset: { on: long, to: min } }',
        ],
      },
      detailed: {
        name: 'Counter with every option',
        desc: 'Example with label, min, max, step and mod',
        lines: [
          'hp:',
          '  label: Hit points      # displayed name',
          '  value: 24',
          '  max: 30                # optional',
          '  min: 0                 # default 0, null = no minimum',
          '  step: 1                # Shift+click = step × 5',
          '  # type: track          # boxes instead of −/+ (needs max)',
          '  # mod: true            # D&D-style modifier',
          '  reset: { on: long, to: max }   # Reset… command: back to max after a long rest',
        ],
      },
      groups: {
        name: 'Several groups in one block',
        desc: 'Groups with their own title and layout',
        lines: [
          'coins:',
          '  label: Coins',
          '  layout: horizontal',
          '  items:',
          '    gold: 0',
          '    silver: 0',
          'resources:',
          '  label: Resources',
          '  items:',
          '    potions: 2',
          '    stress: { type: track, max: 3, value: 0 }',
        ],
      },
      columns: {
        name: 'Columns callout',
        desc: 'Text in two columns (wraps the selected text)',
      },
    },
  },
  it: {
    insertBlock: 'Inserisci blocco…',
    insertPrefix: 'Inserisci: ',
    menuItem: 'Inserisci blocco TTRPG Sheet Kit…',
    placeholder: 'Scegli il blocco da inserire…',
    notFound: (key) => `TTRPG Sheet Kit: non riesco a trovare "${key}" nel file.`,
    notAMap: 'il blocco deve contenere coppie chiave: valore',
    decrease: 'Diminuisci',
    increase: 'Aumenta',
    editHint: 'Clicca per scrivere un valore: 25, +5, -17 (=-2 per un valore negativo)',
    resetCommand: 'Reset…',
    resetPlaceholder: 'Scegli cosa ripristinare…',
    resetCount: (n) => (n === 1 ? '1 valore' : `${n} valori`),
    resetTooltip: (on, to) => `Si ripristina con "${on}" → ${to}`,
    resetDone: (name, n) => `Reset "${name}": ${n === 1 ? '1 valore ripristinato' : `${n} valori ripristinati`}`,
    resetNothing: (name) => `Reset "${name}": tutti i valori sono già al punto di reset.`,
    resetErrors: {
      invalid: 'reset richiede sia "on" sia "to", es. reset: { on: long, to: max }',
      noMax: 'il reset a "max" richiede un max',
      noMin: 'il reset a "min" richiede un min (min: null non ne ha)',
    },
    undoCommand: 'Annulla ultima modifica',
    undoButton: 'Annulla',
    undone: (n) => `Annullato: ${n === 1 ? '1 valore ripristinato' : `${n} valori ripristinati`}.`,
    undoConflict: 'Impossibile annullare: quei valori sono stati cambiati nel frattempo.',
    columnsTitle: 'Titolo',
    columnsSample: ['- prima voce', '- seconda voce', '- terza voce'],
    templates: {
      vertical: {
        name: 'Contatori in verticale',
        desc: 'Un contatore per riga, con −/+',
        lines: ['label: Titolo            # facoltativo', 'oro: 10', 'frecce: 18', 'punti_fato: 2/3          # valore/massimo'],
      },
      horizontal: {
        name: 'Contatori in orizzontale',
        desc: 'Contatori affiancati, etichetta sopra (es. monete)',
        lines: ['layout: horizontal', 'platino: 0', 'oro: 0', 'argento: 0', 'bronzo: 0'],
      },
      abilities: {
        name: 'Caratteristiche D&D',
        desc: 'FOR, DES, COS, INT, SAG, CAR con modificatore',
        lines: [
          'layout: horizontal',
          'mod: true                # mostra il modificatore, es. 14 → (+2)',
          'FOR: 10',
          'DES: 10',
          'COS: 10',
          'INT: 10',
          'SAG: 10',
          'CAR: 10',
        ],
      },
      track: {
        name: 'Traccia di caselle',
        desc: 'Caselle da spuntare (stress, slot, usi giornalieri)',
        lines: [
          'stress: { label: Stress, type: track, max: 3, value: 0 }',
          'slot_1: { label: Slot 1° livello, type: track, max: 4, value: 0, reset: { on: long, to: min } }',
        ],
      },
      detailed: {
        name: 'Contatore con tutte le opzioni',
        desc: 'Esempio con label, min, max, step e mod',
        lines: [
          'pf:',
          '  label: Punti ferita    # nome mostrato',
          '  value: 24',
          '  max: 30                # facoltativo',
          '  min: 0                 # default 0, null = nessun minimo',
          '  step: 1                # Shift+clic = step × 5',
          '  # type: track          # caselle invece di −/+ (serve max)',
          '  # mod: true            # modificatore stile D&D',
          '  reset: { on: long, to: max }   # comando Reset…: torna al massimo col riposo lungo',
        ],
      },
      groups: {
        name: 'Più gruppi in un blocco',
        desc: 'Gruppi con titolo e layout propri',
        lines: [
          'soldi:',
          '  label: Soldi',
          '  layout: horizontal',
          '  items:',
          '    oro: 0',
          '    argento: 0',
          'risorse:',
          '  label: Risorse',
          '  items:',
          '    pozioni: 2',
          '    stress: { type: track, max: 3, value: 0 }',
        ],
      },
      columns: {
        name: 'Callout a colonne',
        desc: 'Testo su due colonne (avvolge il testo selezionato)',
      },
    },
  },
};

// Obsidian sets moment's locale to the app language.
function getStrings() {
  const locale = (moment && moment.locale && moment.locale()) || 'en';
  return locale.startsWith('it') ? STRINGS.it : STRINGS.en;
}

// Command ids stay the same in every language, so hotkeys survive a language change.
const TEMPLATE_IDS = ['vertical', 'horizontal', 'abilities', 'track', 'detailed', 'groups', 'columns'];

function buildTemplates(t) {
  return TEMPLATE_IDS.map((id) => {
    const tpl = t.templates[id];
    return {
      id: `insert-${id}`,
      name: tpl.name,
      desc: tpl.desc,
      text: tpl.lines ? fence(tpl.lines) : null,
      columns: id === 'columns',
    };
  });
}

// ---------------------------------------------------------------------------
// Block parsing
// ---------------------------------------------------------------------------

// Accepts 7, "7", "2/3". Returns { value, max } or null.
function parseValue(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return { value: raw, max: null };
  if (typeof raw !== 'string') return null;
  const m = raw.trim().match(/^(-?\d+)(?:\s*\/\s*(-?\d+))?$/);
  if (!m) return null;
  return { value: Number(m[1]), max: m[2] !== undefined ? Number(m[2]) : null };
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function normalizeItem(key, raw, groupMod) {
  const item = {
    key,
    label: key,
    value: 0,
    min: 0,
    max: null,
    step: 1,
    type: 'number',
    mod: !!groupMod,
  };

  if (isPlainObject(raw)) {
    const parsed = parseValue(raw.value ?? 0);
    if (!parsed) return null;
    item.label = String(raw.label ?? raw.name ?? key);
    item.value = parsed.value;
    item.max = raw.max !== undefined ? Number(raw.max) : parsed.max;
    if (raw.min !== undefined) item.min = raw.min === null ? null : Number(raw.min);
    if (raw.step !== undefined) item.step = Number(raw.step) || 1;
    if (raw.type === 'track') item.type = 'track';
    if (raw.mod !== undefined) item.mod = !!raw.mod;
    if (raw.reset !== undefined) parseReset(item, raw.reset);
  } else {
    const parsed = parseValue(raw);
    if (!parsed) return null;
    item.value = parsed.value;
    item.max = parsed.max;
  }

  if (item.type === 'track' && !(item.max > 0)) item.type = 'number';
  return item;
}

// reset: { on: <moment>, to: max | min | <number> }. Both fields are required.
// Sets item.reset, or item.resetError with a key of STRINGS.*.resetErrors.
function parseReset(item, raw) {
  const on = isPlainObject(raw) ? raw.on : undefined;
  const to = isPlainObject(raw) ? raw.to : undefined;
  if (on === undefined || on === null || String(on).trim() === '' || to === undefined || to === null) {
    item.resetError = 'invalid';
  } else if (to === 'max' && item.max === null) {
    item.resetError = 'noMax';
  } else if (to === 'min' && item.min === null) {
    item.resetError = 'noMin';
  } else if (to !== 'max' && to !== 'min' && !Number.isFinite(Number(to))) {
    item.resetError = 'invalid';
  } else {
    item.reset = { on: String(on).trim(), to: to === 'max' || to === 'min' ? to : Number(to) };
  }
}

// The long rest also resets what resets on a short rest.
function resetMatches(on, name) {
  return on === name || (name === 'long' && on === 'short');
}

function resetTarget(item) {
  if (item.reset.to === 'max') return item.max;
  if (item.reset.to === 'min') return item.min;
  return clamp(item.reset.to, item.min, item.max);
}

function itemPath(group, item) {
  return group.key ? [group.key, 'items', item.key] : [item.key];
}

function normalizeItems(obj, mod) {
  const items = [];
  for (const [key, raw] of Object.entries(obj)) {
    const item = normalizeItem(key, raw, mod);
    if (item) items.push(item);
  }
  return items;
}

function isGroup(v) {
  return isPlainObject(v) && isPlainObject(v.items);
}

// Two shapes:
//  - counters directly in the block  -> a single group
//  - groups with `items:`            -> several groups
function parseBlock(source, t) {
  const data = parseYaml(source);
  if (!isPlainObject(data)) throw new Error(t.notAMap);

  const blockLabel = data.label ?? data.name ?? null;
  const blockLayout = LAYOUTS[data.layout] ?? 'vertical';
  const blockMod = !!data.mod;
  const keys = Object.keys(data).filter((k) => !RESERVED.includes(k));

  if (keys.some((k) => isGroup(data[k]))) {
    return keys
      .filter((k) => isGroup(data[k]))
      .map((k) => {
        const g = data[k];
        const mod = g.mod !== undefined ? !!g.mod : blockMod;
        return {
          key: k,
          label: g.label ?? g.name ?? null,
          layout: LAYOUTS[g.layout] ?? blockLayout,
          items: normalizeItems(g.items, mod),
        };
      });
  }

  const flat = {};
  for (const k of keys) flat[k] = data[k];
  return [{ key: null, label: blockLabel, layout: blockLayout, items: normalizeItems(flat, blockMod) }];
}

// ---------------------------------------------------------------------------
// Editing the block text line by line, so YAML formatting and comments
// are preserved
// ---------------------------------------------------------------------------

function indentOf(line) {
  return line.match(/^\s*/)[0].length;
}

function isSkippable(line) {
  const t = line.trim();
  return t === '' || t.startsWith('#');
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Finds the direct child `key:` of the node starting after `start`,
// indented deeper than `parentIndent`. Returns the line index or -1.
function findChild(lines, start, parentIndent, key) {
  const re = new RegExp(`^\\s*(["']?)${escapeRegex(key)}\\1\\s*:`);
  let childIndent = null;
  for (let i = start; i < lines.length; i++) {
    if (isSkippable(lines[i])) continue;
    const ind = indentOf(lines[i]);
    if (ind <= parentIndent) return -1;
    if (childIndent === null) childIndent = ind;
    if (ind === childIndent && re.test(lines[i])) return i;
  }
  return -1;
}

// Finds the number to change for the counter at `path`.
// Returns { line, start, end, value } or null.
function findValueToken(lines, path) {
  let idx = -1;
  let parentIndent = -1;
  let start = 0;
  for (const key of path) {
    idx = findChild(lines, start, parentIndent, key);
    if (idx < 0) return null;
    parentIndent = indentOf(lines[idx]);
    start = idx + 1;
  }

  const line = lines[idx];
  const colon = line.indexOf(':', indentOf(line));
  const restStart = colon + 1;
  const rest = line.slice(restStart);

  // gold: 7   |   current: 2/3   |   gold: "7"
  let m = rest.match(/^(\s*["']?)(-?\d+)/);
  if (m) {
    const s = restStart + m[1].length;
    return { line: idx, start: s, end: s + m[2].length, value: Number(m[2]) };
  }

  // gold: { label: "Gold", value: 7 }
  if (rest.trim().startsWith('{')) {
    m = rest.match(/^(.*?\bvalue\s*:\s*["']?)(-?\d+)/);
    if (!m) return null;
    const s = restStart + m[1].length;
    return { line: idx, start: s, end: s + m[2].length, value: Number(m[2]) };
  }

  // gold:
  //   label: Gold
  //   value: 7
  if (rest.trim() === '' || rest.trim().startsWith('#')) {
    const v = findChild(lines, idx + 1, parentIndent, 'value');
    if (v < 0) return null;
    const vl = lines[v];
    m = vl.match(/^(\s*["']?value["']?\s*:\s*["']?)(-?\d+)/);
    if (!m) return null;
    return { line: v, start: m[1].length, end: m[1].length + m[2].length, value: Number(m[2]) };
  }

  return null;
}

// Applies `compute(currentValue)` to the counter.
// Returns { lines, from, to }, or null if the counter was not found.
function applyToBlock(lines, path, compute) {
  const tok = findValueToken(lines, path);
  if (!tok) return null;
  const next = compute(tok.value);
  const out = lines.slice();
  if (next !== tok.value) {
    const l = out[tok.line];
    out[tok.line] = l.slice(0, tok.start) + String(next) + l.slice(tok.end);
  }
  return { lines: out, from: tok.value, to: next };
}

// Same as applyToBlock, returning only the new lines (or null).
function updateBlockLines(lines, path, compute) {
  const r = applyToBlock(lines, path, compute);
  return r && r.lines;
}

const FENCE_RE = /^([> \t]*)(`{3,}|~{3,})\s*([\w-]+)?/;

// Every counters block in the file, in order: { open, close, prefix, index }.
// Handles blocks inside callouts/blockquotes ("> " prefix).
function findBlocks(lines) {
  const blocks = [];
  for (let open = 0; open < lines.length; open++) {
    const m = lines[open].match(FENCE_RE);
    if (!m || m[3] !== BLOCK_LANG) continue;
    const prefix = m[1];
    for (let close = open + 1; close < lines.length; close++) {
      const body = lines[close].startsWith(prefix) ? lines[close].slice(prefix.length) : lines[close];
      if (body.trim().startsWith(m[2]) && body.trim().replace(/[`~]/g, '') === '') {
        blocks.push({ open, close, prefix, index: blocks.length });
        open = close;
        break;
      }
    }
  }
  return blocks;
}

function blockBody(lines, block) {
  return lines.slice(block.open + 1, block.close).map((l) => (l.startsWith(block.prefix) ? l.slice(block.prefix.length) : l));
}

// Writes back a body with the same number of lines.
function writeBody(lines, block, body) {
  lines.splice(block.open + 1, body.length, ...body.map((l) => block.prefix + l));
}

// Locates the block in the file: first via the lines Obsidian reports,
// then, if they don't match, by searching for a block with the same content.
function locateBlock(lines, info, source) {
  const same = (b) => blockBody(lines, b).join('\n').trim() === source.trim();
  const blocks = findBlocks(lines);
  if (info) {
    const b = blocks.find((x) => x.open === info.lineStart);
    if (b && same(b)) return b;
  }
  return blocks.find(same) || null;
}

// Every counter with a valid reset in the file: { block, path, item }.
function collectResets(lines, t) {
  const out = [];
  for (const block of findBlocks(lines)) {
    let groups;
    try {
      groups = parseBlock(blockBody(lines, block).join('\n'), t);
    } catch (e) {
      continue;
    }
    for (const group of groups) {
      for (const item of group.items) {
        if (item.reset) out.push({ block: block.index, path: itemPath(group, item), item });
      }
    }
  }
  return out;
}

// Reset moments found in the file, with how many counters each one resets.
function countResets(entries) {
  const names = new Map();
  for (const e of entries) names.set(e.item.reset.on, 0);
  // "long" is listed only when the note uses it, but then also counts "short".
  for (const name of names.keys()) {
    names.set(name, entries.filter((e) => resetMatches(e.item.reset.on, name)).length);
  }
  return names;
}

// Applies the reset `name` to the file lines.
// Returns { lines, changes: [{ block, path, label, from, to }] }.
function applyReset(lines, name, t) {
  const out = lines.slice();
  const blocks = findBlocks(out);
  const changes = [];
  for (const e of collectResets(out, t)) {
    if (!resetMatches(e.item.reset.on, name)) continue;
    const block = blocks[e.block];
    const target = resetTarget(e.item);
    const r = applyToBlock(blockBody(out, block), e.path, () => target);
    if (!r || r.from === r.to) continue;
    writeBody(out, block, r.lines);
    changes.push({ block: e.block, path: e.path, label: e.item.label, from: r.from, to: r.to });
  }
  return { lines: out, changes };
}

// Puts back the `from` values of `changes`, newest first. Returns the new
// lines, or null if any counter no longer holds the value we wrote.
function applyUndo(lines, changes) {
  const out = lines.slice();
  const blocks = findBlocks(out);
  for (const c of changes) {
    const block = blocks[c.block];
    if (!block) return null;
    const tok = findValueToken(blockBody(out, block), c.path);
    if (!tok || tok.value !== c.to) return null;
  }
  for (const c of [...changes].reverse()) {
    const block = blocks[c.block];
    const r = applyToBlock(blockBody(out, block), c.path, () => c.from);
    writeBody(out, block, r.lines);
  }
  return out;
}

// Text typed in a counter: "25" sets it, "+5" / "-17" add or subtract,
// "=-2" sets a negative value. Returns compute(current) or null if invalid.
function parseInput(text) {
  const s = text.trim();
  let m = s.match(/^=\s*(-?\d+)$/);
  if (m) {
    const v = Number(m[1]);
    return () => v;
  }
  m = s.match(/^([+-])\s*(\d+)$/);
  if (m) {
    const d = Number(m[2]) * (m[1] === '-' ? -1 : 1);
    return (cur) => cur + d;
  }
  m = s.match(/^\d+$/);
  if (m) {
    const v = Number(s);
    return () => v;
  }
  return null;
}

function clamp(v, min, max) {
  if (min !== null && min !== undefined && v < min) v = min;
  if (max !== null && max !== undefined && v > max) v = max;
  return v;
}

function formatMod(v) {
  const m = Math.floor((v - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

// ---------------------------------------------------------------------------
// Inserting templates
// ---------------------------------------------------------------------------

function columnsCallout(selection, t) {
  const body = selection.trim() === '' ? t.columnsSample : selection.split('\n');
  const lines = body.map((l) => (l === '' ? '>' : '> ' + l));
  // [!ttrpgsk-columns|3] = three columns, [!ttrpgsk-columns|plain] = no border and title
  return [`> [!ttrpgsk-columns] ${t.columnsTitle}`, ...lines].join('\n');
}

function insertTemplate(editor, tpl, t) {
  const text = tpl.columns ? columnsCallout(editor.getSelection(), t) : tpl.text;
  const from = editor.getCursor('from');
  const lineText = editor.getLine(from.line);
  // Blocks must start on their own line
  const before = from.ch > 0 && lineText.slice(0, from.ch).trim() !== '' ? '\n\n' : '';
  editor.replaceSelection(before + text + '\n');
}

class TemplateModal extends SuggestModal {
  constructor(app, editor, templates, t) {
    super(app);
    this.editor = editor;
    this.templates = templates;
    this.t = t;
    this.setPlaceholder(t.placeholder);
  }

  getSuggestions(query) {
    const q = query.toLowerCase();
    return this.templates.filter((tpl) => (tpl.name + ' ' + tpl.desc).toLowerCase().includes(q));
  }

  renderSuggestion(tpl, el) {
    el.createDiv({ text: tpl.name });
    el.createEl('small', { text: tpl.desc, cls: 'tsk-suggest-desc' });
  }

  onChooseSuggestion(tpl) {
    insertTemplate(this.editor, tpl, this.t);
  }
}

class ResetModal extends SuggestModal {
  constructor(plugin, file, names) {
    super(plugin.app);
    this.plugin = plugin;
    this.file = file;
    this.names = names;
    this.setPlaceholder(plugin.t.resetPlaceholder);
  }

  getSuggestions(query) {
    const q = query.toLowerCase();
    return [...this.names.entries()].filter(([name]) => name.toLowerCase().includes(q)).map(([name, count]) => ({ name, count }));
  }

  renderSuggestion(s, el) {
    el.createDiv({ text: s.name });
    el.createEl('small', { text: this.plugin.t.resetCount(s.count), cls: 'tsk-suggest-desc' });
  }

  onChooseSuggestion(s) {
    this.plugin.runReset(this.file, s.name);
  }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

// Undo entries kept in memory (all notes together); lost when Obsidian closes.
const HISTORY_LIMIT = 100;
const NOTICE_MS = 10000;

class TtrpgSheetKitPlugin extends Plugin {
  onload() {
    this.t = getStrings();
    this.templates = buildTemplates(this.t);
    // [{ path, changes: [{ block, path, label, from, to }] }], oldest first
    this.history = [];
    // note path -> Map(reset moment -> number of counters)
    this.resetIndex = new Map();

    this.registerMarkdownCodeBlockProcessor(BLOCK_LANG, (source, el, ctx) => this.render(source, el, ctx));

    // One command that lists every template, plus one per template
    // (so each can get its own hotkey).
    this.addCommand({
      id: 'insert-block',
      name: this.t.insertBlock,
      editorCallback: (editor) => this.openTemplates(editor),
    });
    for (const tpl of this.templates) {
      this.addCommand({
        id: tpl.id,
        name: this.t.insertPrefix + tpl.name,
        editorCallback: (editor) => insertTemplate(editor, tpl, this.t),
      });
    }

    // Listed only when the open note has counters with a reset.
    this.addCommand({
      id: 'reset',
      name: this.t.resetCommand,
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const names = file && this.resetIndex.get(file.path);
        if (!names || names.size === 0) return false;
        if (!checking) new ResetModal(this, file, names).open();
        return true;
      },
    });

    // Listed only when there is something to undo in the open note.
    this.addCommand({
      id: 'undo',
      name: this.t.undoCommand,
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const entry = file && this.lastEntry(file.path);
        if (!entry) return false;
        if (!checking) this.undo(file, entry);
        return true;
      },
    });

    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor) => {
        menu.addItem((item) =>
          item
            .setTitle(this.t.menuItem)
            .setIcon('plus-square')
            .onClick(() => this.openTemplates(editor))
        );
      })
    );

    // Keep the reset index of the open note up to date.
    this.registerEvent(this.app.workspace.on('file-open', (file) => this.indexResets(file)));
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file === this.app.workspace.getActiveFile()) this.indexResets(file);
      })
    );
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        for (const entry of this.history) if (entry.path === oldPath) entry.path = file.path;
        if (this.resetIndex.has(oldPath)) {
          this.resetIndex.set(file.path, this.resetIndex.get(oldPath));
          this.resetIndex.delete(oldPath);
        }
      })
    );
    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        this.history = this.history.filter((e) => e.path !== file.path);
        this.resetIndex.delete(file.path);
      })
    );
    this.app.workspace.onLayoutReady(() => this.indexResets(this.app.workspace.getActiveFile()));
  }

  openTemplates(editor) {
    new TemplateModal(this.app, editor, this.templates, this.t).open();
  }

  async indexResets(file) {
    if (!(file instanceof TFile) || file.extension !== 'md') return;
    const data = await this.app.vault.cachedRead(file);
    this.resetIndex.set(file.path, countResets(collectResets(data.split('\n'), this.t)));
  }

  // --- history -------------------------------------------------------------

  record(file, changes) {
    if (changes.length === 0) return null;
    const entry = { path: file.path, changes };
    this.history.push(entry);
    if (this.history.length > HISTORY_LIMIT) this.history.shift();
    return entry;
  }

  lastEntry(path) {
    for (let i = this.history.length - 1; i >= 0; i--) if (this.history[i].path === path) return this.history[i];
    return null;
  }

  async undo(file, entry) {
    let lines = null;
    await this.app.vault.process(file, (data) => {
      lines = applyUndo(data.split('\n'), entry.changes);
      return lines ? lines.join('\n') : data;
    });
    // Either way the entry can't be undone again.
    this.history = this.history.filter((e) => e !== entry);
    new Notice(lines ? this.t.undone(entry.changes.length) : this.t.undoConflict);
  }

  // --- reset ---------------------------------------------------------------

  async runReset(file, name) {
    let changes = [];
    await this.app.vault.process(file, (data) => {
      const r = applyReset(data.split('\n'), name, this.t);
      changes = r.changes;
      return changes.length ? r.lines.join('\n') : data;
    });
    if (changes.length === 0) {
      new Notice(this.t.resetNothing(name));
      return;
    }
    const entry = this.record(file, changes);
    const summary = changes
      .slice(0, 4)
      .map((c) => `${c.label} ${c.from}→${c.to}`)
      .join(' · ');
    let notice;
    const content = createFragment((f) => {
      f.createDiv({ text: this.t.resetDone(name, changes.length) });
      f.createDiv({ cls: 'tsk-notice-detail', text: summary + (changes.length > 4 ? ' · …' : '') });
      const btn = f.createEl('button', { cls: 'tsk-notice-undo', text: this.t.undoButton });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        notice.hide();
        this.undo(file, entry);
      });
    });
    notice = new Notice(content, NOTICE_MS);
  }

  // --- rendering -----------------------------------------------------------

  render(source, el, ctx) {
    let groups;
    try {
      groups = parseBlock(source, this.t);
    } catch (e) {
      el.createEl('pre', { cls: 'tsk-error', text: `${BLOCK_LANG}: ${e.message}` });
      return;
    }

    const root = el.createDiv({ cls: 'tsk-counters' });
    for (const group of groups) {
      const g = root.createDiv({ cls: `tsk-group tsk-layout-${group.layout}` });
      if (group.items.some((i) => i.mod)) g.addClass('tsk-has-mod');
      if (group.label) g.createDiv({ cls: 'tsk-group-title', text: String(group.label) });
      const list = g.createDiv({ cls: 'tsk-items' });
      for (const item of group.items) {
        const path = itemPath(group, item);
        this.renderItem(list, item, (compute) => this.change(el, source, ctx, path, item, compute));
      }
    }
  }

  renderItem(parent, item, change) {
    const row = parent.createDiv({ cls: `tsk-item tsk-type-${item.type}` });
    const label = row.createDiv({ cls: 'tsk-label', text: item.label });
    if (item.reset) {
      label.createSpan({ cls: 'tsk-reset-icon', text: '↺', attr: { 'aria-label': this.t.resetTooltip(item.reset.on, item.reset.to) } });
    }

    if (item.type === 'track') {
      const track = row.createDiv({ cls: 'tsk-track' });
      for (let i = 0; i < item.max; i++) {
        const box = track.createEl('button', {
          cls: 'tsk-box' + (i < item.value ? ' is-filled' : ''),
          attr: { 'aria-label': `${item.label} ${i + 1}` },
        });
        bindClick(box, () => change((cur) => (cur === i + 1 ? i : i + 1)));
      }
    } else {
      const controls = row.createDiv({ cls: 'tsk-controls' });
      const minus = controls.createEl('button', { cls: 'tsk-btn tsk-minus', text: '−', attr: { 'aria-label': this.t.decrease } });
      const value = controls.createDiv({ cls: 'tsk-value is-editable', attr: { 'aria-label': this.t.editHint } });
      value.createSpan({ cls: 'tsk-number', text: String(item.value) });
      if (item.max !== null) value.createSpan({ cls: 'tsk-max', text: `/${item.max}` });
      if (item.mod) value.createSpan({ cls: 'tsk-mod', text: `(${formatMod(item.value)})` });
      const plus = controls.createEl('button', { cls: 'tsk-btn tsk-plus', text: '+', attr: { 'aria-label': this.t.increase } });

      // Shift+click = step × 5
      bindClick(minus, (e) => change((cur) => cur - item.step * (e.shiftKey ? 5 : 1)));
      bindClick(plus, (e) => change((cur) => cur + item.step * (e.shiftKey ? 5 : 1)));
      bindClick(value, () => this.startEdit(value, item, change));
    }

    if (item.resetError) row.createDiv({ cls: 'tsk-warning', text: this.t.resetErrors[item.resetError] });
  }

  // Turns the number into a text field: Enter saves, Esc or clicking away cancels.
  startEdit(valueEl, item, change) {
    if (valueEl.hasClass('is-editing')) return;
    valueEl.addClass('is-editing');
    const input = valueEl.createEl('input', { cls: 'tsk-input', type: 'text', value: String(item.value) });
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      input.remove();
      valueEl.removeClass('is-editing');
    };
    // Let the field take the cursor; keep keys away from the editor and hotkeys.
    for (const ev of ['mousedown', 'click']) input.addEventListener(ev, (e) => e.stopPropagation());
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        const compute = parseInput(input.value);
        if (!compute) {
          input.addClass('is-invalid');
          return;
        }
        close();
        change(compute);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else {
        input.removeClass('is-invalid');
      }
    });
    input.addEventListener('blur', close);
    input.focus();
    input.select();
  }

  async change(el, source, ctx, path, item, compute) {
    const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
    if (!(file instanceof TFile)) return;
    const info = ctx.getSectionInfo(el);
    let failed = false;
    let changed = null;

    await this.app.vault.process(file, (data) => {
      const lines = data.split('\n');
      const block = locateBlock(lines, info, source);
      if (!block) {
        failed = true;
        return data;
      }
      const r = applyToBlock(blockBody(lines, block), path, (cur) => clamp(compute(cur), item.min, item.max));
      if (!r) {
        failed = true;
        return data;
      }
      if (r.from === r.to) return data;
      writeBody(lines, block, r.lines);
      changed = { block: block.index, path, label: item.label, from: r.from, to: r.to };
      return lines.join('\n');
    });

    if (failed) new Notice(this.t.notFound(path[path.length - 1]));
    if (changed) this.record(file, [changed]);
  }
}

// Keeps a click in Live Preview from moving the cursor into the block
// (which would reveal the source) instead of pressing the button.
function bindClick(btn, handler) {
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handler(e);
  });
}

module.exports = TtrpgSheetKitPlugin;
// Exposed for the tests in tests/.
module.exports._internals = {
  parseValue,
  normalizeItem,
  parseBlock,
  findValueToken,
  updateBlockLines,
  findBlocks,
  locateBlock,
  collectResets,
  countResets,
  applyReset,
  applyUndo,
  parseInput,
  formatMod,
  columnsCallout,
  buildTemplates,
  STRINGS,
};
