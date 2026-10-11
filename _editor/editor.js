/* The editor runs only in the local Ruby server; this directory is not built by Jekyll. */
import { createMarkdownEditor } from './markdown-editor.js';
import { DraftStore } from './draft-store.js';
import { WritingChecksStore } from './writing-checks-store.js';
import { PreviewPane } from './preview-pane.js';

(() => {
  const $ = id => document.getElementById(id);
  const fields = ['title', 'summary', 'frontmatter', 'note', 'draft'];
  const booleanFields = ['note', 'draft'];
  const recoveredValue = (post, id) => id === 'draft' ? post.draft ?? current.draft ?? true : post[id];
  const fieldValue = id => booleanFields.includes(id) ? $(id).checked : $(id).value;
  const setField = (id, value) => { if (booleanFields.includes(id)) $(id).checked = value === true; else $(id).value = value || ''; };
  const token = document.querySelector('meta[name="editor-token"]').content;
  let storage;
  try { storage = window.localStorage; } catch (_) {}
  const draftStore = new DraftStore(storage);
  const writingChecksStore = new WritingChecksStore(storage);
  let current = null;
  let posts = [];
  let shipping = {};
  let dirty = false;
  let busy = true;
  let filter = 'all';
  let recovery = null;
  let previewVersion = 0;
  let previewTimer;
  let resetPreview = false;
  let writingScroll = 0;
  const previewPane = new PreviewPane($('preview-stage'), $('preview'));
  let editVersion = 0;
  let checksVersion = -1;
  let browserSaved = false;
  const markdownEditor = createMarkdownEditor($('body'), { onChange: changed, onSave: save, onFormat: format });

  async function api(path, data) {
    const response = await fetch(`/editor/api/${path}`, {
      method: data === undefined ? 'GET' : 'POST',
      headers: { 'X-Editor-Token': token, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The editor could not complete that action.');
    return result;
  }

  function message(text, error = false) {
    $('message').textContent = text;
    $('message').classList.toggle('error', error);
    $('message').hidden = !text;
  }

  function payload() {
    return { ...current, ...Object.fromEntries(fields.map(id => [id, fieldValue(id)])), body: markdownEditor.getText() };
  }

  function storeRecovery() {
    browserSaved = draftStore.save(payload());
  }

  function removeRecovery(post = current) {
    draftStore.remove(post);
  }

  function loadRecovery() {
    recovery = null;
    recovery = draftStore.read(current);
    if (recovery && fields.every(id => (booleanFields.includes(id) ? recoveredValue(recovery, id) === true : recovery[id]) === fieldValue(id)) && recovery.body === markdownEditor.getText()) recovery = null;
    // Matching revisions can be restored automatically. Keep stale copies
    // available for explicit recovery without replacing a newer disk version.
    if (recovery && (!current.id || recovery.revision === current.revision)) {
      fields.forEach(id => setField(id, recoveredValue(recovery, id)));
      markdownEditor.setText(recovery.body || '', true);
      dirty = true;
      browserSaved = true;
      recovery = null;
    }
    $('recovery').hidden = !recovery;
  }

  function resize() {
    ['title', 'summary'].forEach(id => {
      const field = $(id);
      field.style.height = 'auto';
      field.style.height = `${field.scrollHeight}px`;
    });
    markdownEditor.requestMeasure();
  }

  function updateState() {
    const words = markdownEditor.getText().trim().match(/\S+/g)?.length || 0;
    $('word-count').textContent = `${words.toLocaleString()} ${words === 1 ? 'word' : 'words'} · ${Math.max(1, Math.ceil(words / 220))} min read`;
    $('save-state').textContent = busy ? 'Working…' : dirty ? browserSaved ? 'Saved in browser · File unsaved' : 'Browser save unavailable · File unsaved' : current?.id ? 'Saved to file' : 'New draft';
    $('state-dot').classList.toggle('dirty', dirty);
    $('save').textContent = 'Save file';
    ['save', 'ship', 'new-post', 'check'].forEach(id => { $(id).disabled = busy; });
    fields.forEach(id => { $(id).readOnly = busy; });
    booleanFields.forEach(id => { $(id).disabled = busy; });
    $('post-kind').textContent = $('draft').checked ? 'Draft' : 'Post';
    markdownEditor.setReadOnly(busy);
    document.querySelectorAll('[data-format]').forEach(button => { button.disabled = busy; });
    $('ship').title = shipping.available ? 'Review, commit and push this post' : shipping.reason || '';
    document.title = `${dirty ? '• ' : ''}${$('title').value || 'New draft'} · Writing room`;
  }

  function clearChecks() {
    $('suggestions').replaceChildren();
    const item = document.createElement('li');
    item.className = 'empty';
    item.textContent = checksVersion >= 0 ? 'Text changed. Run the writing checks again.' : 'Check for repeated words and wordy phrases.';
    $('suggestions').append(item);
  }

  function changed() {
    dirty = true;
    editVersion += 1;
    storeRecovery();
    if (!current.id) renderList();
    updateState();
    resize();
    clearChecks();
    schedulePreview();
  }

  function showPost(post, preserveScroll = false) {
    const differentPost = (current?.id || current?.browserId) !== (post.id || post.browserId);
    if (differentPost && !preserveScroll) {
      resetPreview = true;
      previewPane.resetScroll();
      writingScroll = 0;
      document.querySelector('.paper').scrollTop = 0;
    }
    current = post;
    fields.forEach(id => setField(id, id === 'draft' ? post.draft ?? true : post[id]));
    markdownEditor.setText(post.body || '', differentPost);
    dirty = false;
    browserSaved = false;
    editVersion += 1;
    checksVersion = -1;
    $('post-kind').textContent = post.draft ? 'Draft' : 'Post';
    $('post-date').textContent = new Date(`${post.date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    $('file-path').textContent = post.id || 'A Markdown file will be created when you save.';
    const url = new URL(location.href);
    if (post.id) {
      url.searchParams.set('post', post.id);
      url.searchParams.delete('draft');
    } else {
      url.searchParams.delete('post');
      url.searchParams.set('draft', post.browserId);
    }
    history.replaceState(null, '', url);
    message('');
    loadRecovery();
    renderList();
    updateState();
    resize();
    clearChecks();
    const savedChecks = writingChecksStore.read(payload());
    if (savedChecks) renderChecks(savedChecks);
    schedulePreview();
  }

  function canLeave() {
    return !busy && (!dirty || browserSaved || window.confirm('This post could not be saved in your browser. Leave without saving it to a file?'));
  }

  function newPost(browserId = crypto.randomUUID()) {
    if (!canLeave()) return;
    const date = new Date();
    const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    showPost({ id: null, browserId, revision: null, title: '', summary: '', body: '\n', frontmatter: 'layout: post', date: today, draft: true });
    $('title').focus();
  }

  async function openPost(id) {
    if (!canLeave()) return;
    busy = true;
    updateState();
    try { showPost(await api(`post?id=${encodeURIComponent(id)}`)); }
    catch (error) { message(error.message, true); }
    finally { busy = false; updateState(); }
  }

  function openBrowserPost(browserId) {
    if (!canLeave()) return;
    const draft = draftStore.read({ id: null, browserId });
    if (draft) {
      showPost(draft);
      dirty = true;
      browserSaved = true;
      updateState();
    }
  }

  function renderList() {
    const search = $('search').value.toLowerCase();
    $('post-list').replaceChildren();
    const visible = [...draftStore.list(), ...posts].filter(post => `${post.title} ${post.summary || ''}`.toLowerCase().includes(search) && (filter === 'all' || post.draft === (filter === 'drafts')));
    visible.forEach(post => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'post-item';
      button.setAttribute('aria-current', String((current?.id || current?.browserId) === (post.id || post.browserId)));
      const title = document.createElement('strong');
      title.textContent = post.title || 'Untitled';
      const date = document.createElement('small');
      date.textContent = `${post.browserOnly ? 'Browser draft · ' : post.draft ? 'Draft · ' : ''}${post.date || 'Check front matter'}`;
      if (post.draft) date.className = 'draft-dot';
      button.append(title, date);
      button.addEventListener('click', () => post.browserOnly ? openBrowserPost(post.browserId) : openPost(post.id));
      $('post-list').append(button);
    });
    if (!visible.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'No posts here yet.';
      $('post-list').append(empty);
    }
  }

  async function refreshList() {
    const result = await api('posts');
    posts = result.posts;
    shipping = result.shipping;
    $('branch').textContent = shipping.branch || 'Local checkout';
    renderList();
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    const version = ++previewVersion;
    $('preview-state').textContent = 'Preview updating…';
    previewTimer = setTimeout(async () => {
      try {
        if (!$('title').value.trim()) {
          if (version !== previewVersion) return;
          await previewPane.show('<!doctype html><html><body style="margin:0;padding:70px 35px;color:#65716b;background:#f8f7f1;font:18px/1.7 Georgia,serif"><p>Add a title to preview your post.</p></body></html>', { reset: resetPreview, isCurrent: () => version === previewVersion });
          if (version !== previewVersion) return;
          resetPreview = false;
          $('preview-state').textContent = 'Jekyll preview';
          return;
        }
        const result = await api('preview', payload());
        if (version !== previewVersion) return;
        // Post scripts remain sandboxed. Same-origin access lets the parent
        // wait for fonts and restore scrolling before revealing the new frame.
        await previewPane.show(result.html, { reset: resetPreview, isCurrent: () => version === previewVersion });
        if (version !== previewVersion) return;
        resetPreview = false;
        $('preview-state').textContent = 'Up to date';
      } catch (error) {
        if (version !== previewVersion) return;
        $('preview-state').textContent = 'Preview needs attention';
        message(error.message, true);
      }
    }, 650);
  }

  async function save() {
    if (busy) return false;
    busy = true;
    updateState();
    const previous = current;
    try {
      const post = await api('save', payload());
      removeRecovery(previous);
      showPost(post, true);
      await refreshList();
      return true;
    } catch (error) {
      message(error.message, true);
      return false;
    } finally {
      busy = false;
      updateState();
    }
  }

  async function check() {
    if (busy) return;
    busy = true;
    updateState();
    const version = editVersion;
    try {
      const result = await api('check', payload());
      if (version !== editVersion) return;
      writingChecksStore.save(payload(), result.suggestions);
      renderChecks(result.suggestions);
    } catch (error) { message(error.message, true); }
    finally { busy = false; updateState(); }
  }

  function renderChecks(suggestions) {
    checksVersion = editVersion;
    const version = editVersion;
    $('suggestions').replaceChildren();
    if (!suggestions.length) {
      const item = document.createElement('li');
      item.className = 'empty';
      item.textContent = 'No prose suggestions. Your browser checks spelling.';
      $('suggestions').append(item);
    }
    suggestions.forEach(suggestion => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      const excerpt = document.createElement('strong');
      excerpt.textContent = `“${suggestion.excerpt}” · line ${suggestion.line}`;
      const reason = document.createElement('span');
      reason.textContent = suggestion.reason;
      button.append(excerpt, reason);
      button.addEventListener('click', () => {
        if (version !== editVersion) return;
        markdownEditor.select(suggestion.index, suggestion.index + suggestion.offset);
      });
      item.append(button);
      $('suggestions').append(item);
    });
  }

  function format(kind) {
    if (busy) return;
    const body = markdownEditor.getText();
    const { from: start, to: end } = markdownEditor.getSelection();
    const selection = body.slice(start, end);
    const formats = { bold: ['**', selection || 'bold text', '**'], italic: ['_', selection || 'italic text', '_'], link: ['[', selection || 'link text', '](https://)'], heading: ['## ', selection || 'Heading', '\n'], quote: ['> ', selection || 'A quote', '\n'], list: ['- ', selection || 'An item', '\n'] };
    const [prefix, text, suffix] = formats[kind];
    const leading = ['heading', 'quote', 'list'].includes(kind) && start > 0 && body[start - 1] !== '\n' ? '\n' : '';
    markdownEditor.replaceSelection(leading + prefix + text + suffix, start + leading.length + prefix.length, start + leading.length + prefix.length + text.length);
  }

  $('ship').addEventListener('click', async () => {
    if (busy) return;
    try { await refreshList(); } catch (error) { message(error.message, true); return; }
    $('post-settings').open = false;
    $('ship-heading').textContent = $('draft').checked ? 'Ship this draft?' : 'Publish this post?';
    $('ship-description').textContent = $('draft').checked ? 'This post will stay off the public site. Its source will be committed and pushed to the repository.' : 'The saved changes to this post will go live.';
    $('ship-reason').textContent = shipping.available ? '' : shipping.reason;
    $('confirm-ship').disabled = !shipping.available || !$('title').value.trim();
    $('ship-dialog').showModal();
  });

  $('ship-dialog').addEventListener('close', async () => {
    if ($('ship-dialog').returnValue !== 'ship') return;
    if ((dirty || !current.id) && !(await save())) return;
    busy = true;
    updateState();
    message('Building with Jekyll, then committing and pushing…');
    try {
      const result = await api('ship', payload());
      showPost(result.post, true);
      await refreshList();
      message(result.shipped ? `Pushed ${result.commit.slice(0, 8)}. GitHub Pages is rebuilding your site.` : result.message);
    } catch (error) { message(error.message, true); await refreshList().catch(() => {}); }
    finally { busy = false; updateState(); }
  });

  fields.forEach(id => $(id).addEventListener('input', changed));
  document.addEventListener('click', event => {
    if (!$('post-settings').contains(event.target)) $('post-settings').open = false;
  });
  $('post-settings').addEventListener('keydown', event => {
    if (event.key === 'Escape') { $('post-settings').open = false; $('post-settings').querySelector('summary').focus(); }
  });
  $('save').addEventListener('click', save);
  $('check').addEventListener('click', check);
  $('new-post').addEventListener('click', () => newPost());
  $('search').addEventListener('input', renderList);
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    renderList();
  }));
  document.querySelectorAll('[data-format]').forEach(button => button.addEventListener('click', () => format(button.dataset.format)));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    const view = button.dataset.view;
    const paper = document.querySelector('.paper');
    if (paper.getClientRects().length) writingScroll = paper.scrollTop;
    previewPane.rememberScroll();
    document.body.classList.toggle('focus-mode', view === 'focus');
    document.body.classList.toggle('no-preview', view === 'focus');
    document.body.classList.toggle('preview-only', view === 'preview');
    document.querySelectorAll('[data-view]').forEach(other => other.setAttribute('aria-pressed', String(other.dataset.view === view)));
    resize();
    requestAnimationFrame(() => {
      paper.scrollTop = writingScroll;
      previewPane.changeView(view);
    });
  }));
  $('restore').addEventListener('click', () => {
    // Keep the recovery's original revision so a stale browser copy cannot
    // silently overwrite a newer disk version.
    current.revision = recovery.revision;
    fields.forEach(id => setField(id, recoveredValue(recovery, id)));
    markdownEditor.setText(recovery.body || '', true);
    $('recovery').hidden = true;
    changed();
  });
  $('dismiss-recovery').addEventListener('click', () => { removeRecovery(); $('recovery').hidden = true; recovery = null; });
  window.addEventListener('beforeunload', event => { if ((dirty && !browserSaved) || busy) { event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('resize', resize);
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); }
  });
  updateState();
  (async () => {
    try {
      await refreshList();
      busy = false;
      const params = new URL(location.href).searchParams;
      const id = params.get('post');
      const browserId = params.get('draft') || draftStore.active();
      if (id) await openPost(id);
      else if (browserId && draftStore.read({ id: null, browserId })) openBrowserPost(browserId);
      else newPost(browserId || crypto.randomUUID());
    } catch (error) {
      busy = false;
      if (!current) newPost();
      message(error.message, true);
    } finally { busy = false; updateState(); }
  })();
})();
