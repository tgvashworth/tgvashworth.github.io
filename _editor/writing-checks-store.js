// Results belong to a post and the exact text checked, so restored suggestion
// offsets can never point into a newer version of its Markdown.
export class WritingChecksStore {
  constructor(storage) { this.storage = storage; }

  key(post) { return `writing-room:checks:${post.id || post.browserId}`; }

  save(post, suggestions) {
    try { this.storage.setItem(this.key(post), JSON.stringify({ body: post.body, suggestions })); }
    catch (_) { /* Checks still work when browser storage is unavailable. */ }
  }

  read(post) {
    try {
      const copy = JSON.parse(this.storage.getItem(this.key(post)));
      if (copy?.body !== post.body || !Array.isArray(copy.suggestions)) return null;
      if (!copy.suggestions.every(item => typeof item.excerpt === 'string' && typeof item.reason === 'string'
        && Number.isInteger(item.line) && item.line > 0
        && Number.isInteger(item.index) && item.index >= 0
        && Number.isInteger(item.offset) && item.offset > 0
        && item.index + item.offset <= post.body.length)) return null;
      return copy.suggestions;
    } catch (_) { return null; }
  }
}
