import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { DraftStore } from './draft-store.js';
import { WritingChecksStore } from './writing-checks-store.js';
import { PreviewPane } from './preview-pane.js';
import { markdownBindings } from './markdown-editor.js';

class MemoryStorage {
  entries = new Map();
  get length() { return this.entries.size; }
  key(index) { return [...this.entries.keys()][index]; }
  getItem(key) { return this.entries.get(key) ?? null; }
  setItem(key, value) { this.entries.set(key, String(value)); }
  removeItem(key) { this.entries.delete(key); }
}

const draft = browserId => ({ id: null, browserId, title: 'Unfinished post', body: '- One\n- Two\n', summary: 'A summary', frontmatter: 'layout: post\ntags: [writing]', date: '2026-10-03', note: true, revision: null });

test('multiple drafts survive a new store instance with all their fields', () => {
  const storage = new MemoryStorage();
  const store = new DraftStore(storage);
  const first = draft('first');
  const second = { ...draft('second'), title: 'Another post' };
  assert.equal(store.save(first), true);
  assert.equal(store.save(second), true);
  const reloaded = new DraftStore(storage);
  assert.equal(reloaded.active(), 'second');
  for (const original of [first, second]) {
    const restored = reloaded.read(original);
    for (const key of Object.keys(original)) assert.deepEqual(restored[key], original[key]);
  }
  assert.deepEqual(new Set(reloaded.list().map(post => post.browserId)), new Set(['first', 'second']));
  assert.ok(reloaded.list().every(post => post.browserOnly && post.draft));
});

test('draft status and small note settings survive browser recovery', () => {
  const storage = new MemoryStorage();
  const store = new DraftStore(storage);
  const post = { ...draft('settings'), draft: false, note: true };
  store.save(post);
  const restored = new DraftStore(storage).read(post);
  assert.equal(restored.draft, false);
  assert.equal(restored.note, true);
  const file = { ...post, id: '_posts/2026-10-03-settings.md', draft: true, note: false };
  store.save(file);
  assert.equal(new DraftStore(storage).read(file).draft, true);
  assert.equal(new DraftStore(storage).read(file).note, false);
});

test('writing checks survive reload only for the same post and exact body', () => {
  const storage = new MemoryStorage();
  const post = { ...draft('checked'), body: 'very very easy' };
  const suggestions = [{ excerpt: 'very very', reason: 'repeated word', line: 1, index: 0, offset: 9 }];
  new WritingChecksStore(storage).save(post, suggestions);
  const restored = new WritingChecksStore(storage);
  assert.deepEqual(restored.read(post), suggestions);
  assert.equal(restored.read({ ...post, body: 'Updated text' }), null);
  assert.equal(restored.read({ ...post, browserId: 'another' }), null);
  restored.save(post, []);
  assert.deepEqual(new WritingChecksStore(storage).read(post), []);
});

test('writing check recovery tolerates unavailable and corrupt storage', () => {
  const post = draft('checked');
  const storage = new MemoryStorage();
  const store = new WritingChecksStore(storage);
  storage.setItem(store.key(post), '{');
  assert.equal(store.read(post), null);
  store.save(post, [{ index: -1 }]);
  assert.equal(store.read(post), null);
  const unavailable = new WritingChecksStore(undefined);
  assert.doesNotThrow(() => unavailable.save(post, []));
  assert.equal(unavailable.read(post), null);
});

test('saving a file removes only its browser copy and retains other drafts', () => {
  const store = new DraftStore(new MemoryStorage());
  const first = draft('first');
  const second = draft('second');
  store.save(first);
  store.save(second);
  store.remove(first);
  assert.equal(store.read(first), null);
  assert.deepEqual(store.list().map(post => post.browserId), ['second']);
  assert.equal(store.active(), 'second');
  store.remove(second);
  assert.equal(store.active(), null);
});

test('file recovery retains the original revision and never appears as a new draft', () => {
  const store = new DraftStore(new MemoryStorage());
  const post = { ...draft('first'), id: '_posts/2026-10-03-post.md', revision: 'original-disk-revision' };
  store.save(post);
  assert.equal(store.read({ ...post, revision: 'new-disk-revision' }).revision, 'original-disk-revision');
  assert.deepEqual(store.list(), []);
  store.remove(post);
  assert.equal(store.read(post), null);
});

test('a corrupt copy does not hide later valid drafts', () => {
  const storage = new MemoryStorage();
  storage.setItem('writing-room:draft:broken', '{');
  storage.setItem('writing-room:draft:invalid', JSON.stringify({ browserId: 'invalid', body: 'text' }));
  const store = new DraftStore(storage);
  store.save(draft('valid'));
  assert.deepEqual(store.list().map(post => post.browserId), ['valid']);
  assert.equal(store.read(draft('broken')), null);
});

test('legacy new drafts migrate once to their own browser identity', () => {
  const storage = new MemoryStorage();
  const original = { ...draft('old'), browserId: undefined };
  storage.setItem('writing-room:new', JSON.stringify(original));
  const store = new DraftStore(storage);
  const restored = store.read(draft('new-id'));
  assert.equal(restored.browserId, 'new-id');
  assert.equal(restored.body, original.body);
  assert.equal(storage.getItem('writing-room:new'), null);
  assert.equal(store.read(draft('another')), null);
  assert.equal(store.active(), 'new-id');
});

test('blocked or full browser storage reports failure without throwing', () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('full'); }, removeItem() { throw Error('blocked'); }, get length() { throw Error('blocked'); } };
  for (const storage of [undefined, blocked]) {
    const store = new DraftStore(storage);
    assert.equal(store.save(draft('one')), false);
    assert.equal(store.read(draft('one')), null);
    assert.equal(store.active(), null);
    assert.deepEqual(store.list(), []);
    assert.doesNotThrow(() => store.remove(draft('one')));
  }
});

for (const [before, after] of [
  ['- First', '- First\n- '],
  ['1. First', '1. First\n2. '],
  ['- [x] Done', '- [x] Done\n- [ ] '],
  ['> Quote', '> Quote\n> '],
  ['- Parent\n  - Child', '- Parent\n  - Child\n  - '],
  ['- ', ''],
]) {
  test(`the configured Markdown Enter binding handles ${JSON.stringify(before)}`, () => {
    let state = EditorState.create({ doc: before, selection: { anchor: before.length }, extensions: [markdown({ base: markdownLanguage, addKeymap: false })] });
    const target = { get state() { return state; }, dispatch(transaction) { state = state.update(transaction).state; } };
    assert.equal(markdownBindings.find(binding => binding.key === 'Enter').run(target), true);
    assert.equal(state.doc.toString(), after);
  });
}

test('ordinary prose falls through to the normal Enter binding', () => {
  const state = EditorState.create({ doc: 'A paragraph', extensions: [markdown({ base: markdownLanguage, addKeymap: false })] });
  assert.equal(markdownBindings[0].run({ state, dispatch() { assert.fail('Unexpected edit'); } }), false);
});

function previewFixture() {
  const children = [];
  const stage = { append(frame) { children.push(frame); } };
  const makeFrame = () => {
    const events = {};
    const classes = new Set();
    const frame = {
      visible: true, id: 'preview', removed: false,
      attributes: new Map(),
      contentDocument: { scrollingElement: { scrollLeft: 0, scrollTop: 0 }, fonts: { ready: Promise.resolve() }, images: [] },
      contentWindow: { scrollTo({ left, top }) { frame.contentDocument.scrollingElement.scrollLeft = left; frame.contentDocument.scrollingElement.scrollTop = top; } },
      classList: { add(...values) { values.forEach(value => classes.add(value)); }, remove(...values) { values.forEach(value => classes.delete(value)); } },
      setAttribute(key, value) { this.attributes.set(key, value); },
      removeAttribute(key) { this.attributes.delete(key); if (key === 'id') this.id = ''; },
      addEventListener(key, callback) { events[key] = callback; },
      load() { events.load(); },
      remove() { this.removed = true; },
      cloneNode: makeFrame,
      getClientRects() { return this.visible ? [{}] : []; },
    };
    return frame;
  };
  const frame = makeFrame();
  children.push(frame);
  return { pane: new PreviewPane(stage, frame), frame, children };
}

test('preview scroll survives hidden panes and keeps separate Split and Preview positions', () => {
  const { pane, frame } = previewFixture();
  frame.contentDocument.scrollingElement.scrollTop = 750;
  pane.rememberScroll();
  pane.changeView('preview');
  assert.equal(frame.contentDocument.scrollingElement.scrollTop, 750);
  frame.contentDocument.scrollingElement.scrollTop = 1200;
  pane.rememberScroll();
  frame.visible = false;
  frame.contentDocument.scrollingElement.scrollTop = 0;
  pane.rememberScroll();
  frame.visible = true;
  pane.changeView('split');
  assert.equal(frame.contentDocument.scrollingElement.scrollTop, 750);
  pane.changeView('preview');
  assert.equal(frame.contentDocument.scrollingElement.scrollTop, 1200);
  pane.resetScroll();
  pane.changeView('split');
  assert.equal(frame.contentDocument.scrollingElement.scrollTop, 0);
});

test('preview waits for fonts, preserves the latest scroll, and discards superseded renders', async () => {
  const originalRAF = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = callback => queueMicrotask(callback);
  try {
    const { pane, frame, children } = previewFixture();
    const obsolete = pane.show('obsolete');
    const first = children.at(-1);
    const latest = pane.show('latest');
    const second = children.at(-1);
    assert.equal(second.inert, undefined);
    assert.equal(second.attributes.get('aria-hidden'), 'true');
    assert.equal(second.attributes.get('tabindex'), '-1');
    let fontsReady;
    second.contentDocument.fonts.ready = new Promise(resolve => { fontsReady = resolve; });
    second.load();
    await Promise.resolve();
    assert.equal(pane.frame, frame);
    assert.equal(frame.removed, false);
    frame.contentDocument.scrollingElement.scrollTop = 980;
    fontsReady();
    assert.equal(await obsolete, false);
    assert.equal(first.removed, true);
    assert.equal(await latest, true);
    assert.equal(pane.frame, second);
    assert.equal(second.inert, undefined);
    assert.equal(second.attributes.has('aria-hidden'), false);
    assert.equal(second.attributes.has('tabindex'), false);
    assert.equal(second.contentDocument.scrollingElement.scrollTop, 980);
    const stale = pane.show('stale', { isCurrent: () => false });
    const third = children.at(-1);
    third.load();
    assert.equal(await stale, false);
    assert.equal(third.removed, true);
    assert.equal(pane.frame, second);
  } finally { globalThis.requestAnimationFrame = originalRAF; }
});
