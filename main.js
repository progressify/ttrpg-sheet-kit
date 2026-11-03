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
          'slot_1: { label: 1st level slots, type: track, max: 4, value: 0 }',
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
          'slot_1: { label: Slot 1° livello, type: track, max: 4, value: 0 }',
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
  } else {
    const parsed = parseValue(raw);
    if (!parsed) return null;
    item.value = parsed.value;
    item.max = parsed.max;
  }

  if (item.type === 'track' && !(item.max > 0)) item.type = 'number';
  return item;
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

// Applies `compute(currentValue)` to the counter. Returns the new lines,
// or null if the counter was not found.
function updateBlockLines(lines, path, compute) {
  const tok = findValueToken(lines, path);
  if (!tok) return null;
  const next = compute(tok.value);
  if (next === tok.value) return lines;
  const out = lines.slice();
  const l = out[tok.line];
  out[tok.line] = l.slice(0, tok.start) + String(next) + l.slice(tok.end);
  return out;
}

const FENCE_RE = /^([> \t]*)(`{3,}|~{3,})\s*([\w-]+)?/;

// Locates the block in the file: first via the lines Obsidian reports,
// then, if they don't match, by searching for a block with the same content.
// Handles blocks inside callouts/blockquotes ("> " prefix).
function locateBlock(lines, info, source) {
  const check = (open) => {
    const m = lines[open]?.match(FENCE_RE);
    if (!m || m[3] !== BLOCK_LANG) return null;
    const prefix = m[1];
    for (let close = open + 1; close < lines.length; close++) {
      const body = lines[close].startsWith(prefix) ? lines[close].slice(prefix.length) : lines[close];
      if (body.trim().startsWith(m[2]) && body.trim().replace(/[`~]/g, '') === '') {
        return { open, close, prefix };
      }
    }
    return null;
  };

  const strip = (r) => lines.slice(r.open + 1, r.close).map((l) => (l.startsWith(r.prefix) ? l.slice(r.prefix.length) : l));
  const same = (r) => strip(r).join('\n').trim() === source.trim();

  if (info) {
    const r = check(info.lineStart);
    if (r && same(r)) return r;
  }
  for (let i = 0; i < lines.length; i++) {
    const r = check(i);
    if (r && same(r)) return r;
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

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

class TtrpgSheetKitPlugin extends Plugin {
  onload() {
    this.t = getStrings();
    this.templates = buildTemplates(this.t);

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
  }

  openTemplates(editor) {
    new TemplateModal(this.app, editor, this.templates, this.t).open();
  }

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
        const path = group.key ? [group.key, 'items', item.key] : [item.key];
        this.renderItem(list, item, (compute) => this.change(el, source, ctx, path, item, compute));
      }
    }
  }

  renderItem(parent, item, change) {
    const row = parent.createDiv({ cls: `tsk-item tsk-type-${item.type}` });
    row.createDiv({ cls: 'tsk-label', text: item.label });

    if (item.type === 'track') {
      const track = row.createDiv({ cls: 'tsk-track' });
      for (let i = 0; i < item.max; i++) {
        const box = track.createEl('button', {
          cls: 'tsk-box' + (i < item.value ? ' is-filled' : ''),
          attr: { 'aria-label': `${item.label} ${i + 1}` },
        });
        bindClick(box, () => change((cur) => (cur === i + 1 ? i : i + 1)));
      }
      return;
    }

    const controls = row.createDiv({ cls: 'tsk-controls' });
    const minus = controls.createEl('button', { cls: 'tsk-btn tsk-minus', text: '−', attr: { 'aria-label': this.t.decrease } });
    const value = controls.createDiv({ cls: 'tsk-value' });
    value.createSpan({ cls: 'tsk-number', text: String(item.value) });
    if (item.max !== null) value.createSpan({ cls: 'tsk-max', text: `/${item.max}` });
    if (item.mod) value.createSpan({ cls: 'tsk-mod', text: `(${formatMod(item.value)})` });
    const plus = controls.createEl('button', { cls: 'tsk-btn tsk-plus', text: '+', attr: { 'aria-label': this.t.increase } });

    // Shift+click = step × 5
    bindClick(minus, (e) => change((cur) => cur - item.step * (e.shiftKey ? 5 : 1)));
    bindClick(plus, (e) => change((cur) => cur + item.step * (e.shiftKey ? 5 : 1)));
  }

  async change(el, source, ctx, path, item, compute) {
    const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
    if (!(file instanceof TFile)) return;
    const info = ctx.getSectionInfo(el);
    let failed = false;

    await this.app.vault.process(file, (data) => {
      const lines = data.split('\n');
      const block = locateBlock(lines, info, source);
      if (!block) {
        failed = true;
        return data;
      }
      const { open, close, prefix } = block;
      const body = lines.slice(open + 1, close).map((l) => (l.startsWith(prefix) ? l.slice(prefix.length) : l));
      const updated = updateBlockLines(body, path, (cur) => clamp(compute(cur), item.min, item.max));
      if (!updated) {
        failed = true;
        return data;
      }
      lines.splice(open + 1, body.length, ...updated.map((l) => prefix + l));
      return lines.join('\n');
    });

    if (failed) new Notice(this.t.notFound(path[path.length - 1]));
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
  locateBlock,
  formatMod,
  columnsCallout,
  buildTemplates,
  STRINGS,
};
