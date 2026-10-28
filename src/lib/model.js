// Data model for Teoretik.
//
// Theory { id, title, languages[], blocks[], links[], view{x,y,zoom}, createdAt, updatedAt }
// Block  { id, x, y, kind, image (dataURL|null), expanded, content: { [lang]: {title, summary, body} } }
// Link   { id, from, to, type, label: { [lang]: string } }

export const SCHEMA_VERSION = 1;

export const LANGUAGES = {
  en: 'English',
  et: 'Eesti',
  ru: 'Русский',
  uk: 'Українська',
  fi: 'Suomi',
  lv: 'Latviešu',
  lt: 'Lietuvių',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  pl: 'Polski',
  sv: 'Svenska',
  tr: 'Türkçe',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
};

export const KINDS = {
  claim: { label: 'Claim', hint: 'The theory or a part of it' },
  evidence: { label: 'Evidence', hint: 'A clue, quote, screenshot, fact' },
  question: { label: 'Question', hint: 'Something still unexplained' },
  note: { label: 'Note', hint: 'Anything else' },
};

export const LINK_TYPES = {
  supports: { label: 'Supports', glyph: '+' },
  contradicts: { label: 'Contradicts', glyph: '×' },
  related: { label: 'Related', glyph: '~' },
};

export const SUMMARY_MAX = 200;

export const uid = () =>
  Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const emptyText = () => ({ title: '', summary: '', body: '' });

export function newTheory(title = 'Untitled theory', languages = ['en']) {
  const now = Date.now();
  return {
    id: uid(),
    version: SCHEMA_VERSION,
    title,
    languages: [...languages],
    blocks: [],
    links: [],
    view: { x: 0, y: 0, zoom: 1 },
    createdAt: now,
    updatedAt: now,
  };
}

export function newBlock(x, y, kind = 'claim') {
  return { id: uid(), x, y, kind, image: null, expanded: false, content: {} };
}

export function newLink(from, to, type = 'supports') {
  return { id: uid(), from, to, type, label: {} };
}

const hasText = (t) => !!t && !!(t.title || t.summary || t.body);

export function hasContent(block, lang) {
  return hasText(block.content[lang]);
}

/** Text to show for a block in `lang`, falling back to another language if untranslated. */
export function textFor(block, lang, languages) {
  if (hasText(block.content[lang])) return { text: block.content[lang], lang, fallback: false };
  for (const l of languages) {
    if (hasText(block.content[l])) return { text: block.content[l], lang: l, fallback: true };
  }
  return { text: emptyText(), lang, fallback: false };
}

export function labelFor(link, lang, languages) {
  if (link.label?.[lang]) return { text: link.label[lang], fallback: false };
  for (const l of languages) {
    if (link.label?.[l]) return { text: link.label[l], fallback: true };
  }
  return { text: '', fallback: false };
}

/** Validate + repair an imported/loaded object so the app never crashes on bad data. */
export function normalizeTheory(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Not a theory file');
  if (!Array.isArray(raw.blocks)) throw new Error('Theory has no blocks list');
  const t = newTheory(String(raw.title || 'Imported theory').slice(0, 80));
  t.id = typeof raw.id === 'string' ? raw.id : t.id;
  t.languages = Array.isArray(raw.languages) && raw.languages.length
    ? raw.languages.filter((l) => typeof l === 'string').slice(0, 20)
    : ['en'];
  t.blocks = raw.blocks
    .filter((b) => b && typeof b === 'object')
    .map((b) => ({
      id: typeof b.id === 'string' ? b.id : uid(),
      x: Number(b.x) || 0,
      y: Number(b.y) || 0,
      kind: KINDS[b.kind] ? b.kind : 'note',
      image: typeof b.image === 'string' && b.image.startsWith('data:image/') ? b.image : null,
      expanded: !!b.expanded,
      content: Object.fromEntries(
        Object.entries(b.content || {}).map(([l, v]) => [l, {
          title: String(v?.title || ''),
          summary: String(v?.summary || '').slice(0, SUMMARY_MAX),
          body: String(v?.body || ''),
        }]),
      ),
    }));
  const ids = new Set(t.blocks.map((b) => b.id));
  t.links = (Array.isArray(raw.links) ? raw.links : [])
    .filter((l) => l && ids.has(l.from) && ids.has(l.to) && l.from !== l.to)
    .map((l) => ({
      id: typeof l.id === 'string' ? l.id : uid(),
      from: l.from,
      to: l.to,
      type: LINK_TYPES[l.type] ? l.type : 'related',
      label: typeof l.label === 'object' && l.label ? { ...l.label } : {},
    }));
  if (raw.view && typeof raw.view === 'object') {
    t.view = {
      x: Number(raw.view.x) || 0,
      y: Number(raw.view.y) || 0,
      zoom: Math.min(2.5, Math.max(0.25, Number(raw.view.zoom) || 1)),
    };
  }
  t.createdAt = Number(raw.createdAt) || t.createdAt;
  t.updatedAt = Number(raw.updatedAt) || t.updatedAt;
  return t;
}

/** Returns a copy of `block` with one text field changed in one language. */
export function withText(block, lang, field, value) {
  const current = block.content[lang] || emptyText();
  return { ...block, content: { ...block.content, [lang]: { ...current, [field]: value } } };
}

/** Plain text -> paragraphs (blank line = new paragraph). */
export const splitParagraphs = (text) => String(text).trim().split(/\n\s*\n/);
