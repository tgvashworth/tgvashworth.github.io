// Each browser-only draft gets its own key. File-backed recovery copies retain
// the disk revision so restoration can detect edits made outside this browser.
export class DraftStore {
  constructor(storage) { this.storage = storage; }

  key(post) {
    return post.id ? `writing-room:file:${post.id}` : `writing-room:draft:${post.browserId}`;
  }

  save(post) {
    try {
      this.storage.setItem(this.key(post), JSON.stringify({ ...post, updatedAt: Date.now() }));
      if (!post.id) this.storage.setItem('writing-room:active-draft', post.browserId);
      return true;
    } catch (_) { return false; }
  }

  read(post) {
    try {
      const key = this.key(post);
      const legacyKey = `writing-room:${post.id || 'new'}`;
      const stored = this.storage.getItem(key);
      const text = stored || this.storage.getItem(legacyKey);
      const copy = JSON.parse(text);
      if (!copy || typeof copy.body !== 'string' || typeof copy.title !== 'string') return null;
      if (!stored) {
        const migrated = { ...copy, id: post.id || null, browserId: post.browserId };
        if (this.save(migrated)) this.storage.removeItem(legacyKey);
        return migrated;
      }
      return copy;
    } catch (_) { return null; }
  }

  active() {
    try { return this.storage.getItem('writing-room:active-draft'); } catch (_) { return null; }
  }

  remove(post) {
    try {
      this.storage.removeItem(this.key(post));
      this.storage.removeItem(`writing-room:${post.id || 'new'}`);
      if (!post.id && this.active() === post.browserId) this.storage.removeItem('writing-room:active-draft');
    } catch (_) {}
  }

  list() {
    const drafts = [];
    try {
      for (let index = 0; index < this.storage.length; index += 1) {
        const key = this.storage.key(index);
        if (!key?.startsWith('writing-room:draft:')) continue;
        try {
          const draft = JSON.parse(this.storage.getItem(key));
          if (draft && !draft.id && typeof draft.browserId === 'string' && typeof draft.body === 'string' && typeof draft.title === 'string') drafts.push({ ...draft, draft: true, browserOnly: true });
        } catch (_) { /* Ignore a damaged copy without hiding other drafts. */ }
      }
    } catch (_) {}
    return drafts.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }
}
