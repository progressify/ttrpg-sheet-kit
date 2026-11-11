// Minimal YAML reader for the tests: stands in for Obsidian's parseYaml.
// Supports what counter blocks use: nested maps by indentation, flow maps
// ({ a: 1, b: { c: x } }), numbers, true/false, null, quoted and plain strings,
// and # comments. Not a general YAML parser.

function scalar(raw) {
  const s = raw.trim();
  if (s === '' || s === 'null' || s === '~') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  return s;
}

// A quote opens a quoted string only at the start of a value
// (so the apostrophe in "Wanderer's Charm" is plain text).
function opensQuote(text, i) {
  const before = text.slice(0, i).trimEnd();
  return before === '' || /[:,{[]$/.test(before);
}

function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if ((ch === '"' || ch === "'") && opensQuote(line, i)) {
      quote = ch;
    } else if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i);
    }
  }
  return line;
}

// Splits "a: 1, b: { c: 2 }" on top-level commas.
function splitFlow(s) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if ((ch === '"' || ch === "'") && opensQuote(s, i)) {
      quote = ch;
    } else if (ch === '{' || ch === '[') {
      depth++;
    } else if (ch === '}' || ch === ']') {
      depth--;
    } else if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

function value(raw) {
  const s = raw.trim();
  if (s.startsWith('{') && s.endsWith('}')) {
    const obj = {};
    for (const part of splitFlow(s.slice(1, -1))) {
      const i = part.indexOf(':');
      obj[scalar(part.slice(0, i))] = value(part.slice(i + 1));
    }
    return obj;
  }
  return scalar(s);
}

function parseYaml(text) {
  // A whole document written as one flow value (JSON is valid YAML).
  if (/^\s*[{[]/.test(text)) return value(text);
  const lines = text
    .split('\n')
    .map(stripComment)
    .filter((l) => l.trim() !== '');
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  for (const line of lines) {
    const indent = line.match(/^\s*/)[0].length;
    while (stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1].obj;
    const i = line.indexOf(':');
    if (i < 0) throw new Error(`yaml-lite: cannot read "${line}"`);
    const key = scalar(line.slice(0, i));
    const rest = line.slice(i + 1);
    if (rest.trim() === '') {
      parent[key] = {};
      stack.push({ indent, obj: parent[key] });
    } else {
      parent[key] = value(rest);
    }
  }
  return root;
}

module.exports = { parseYaml };
