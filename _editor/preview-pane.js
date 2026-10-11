// Load a fresh render over the previous frame without exposing an unstyled or
// blank document. Post scripts stay disabled by the iframe sandbox.
export class PreviewPane {
  constructor(stage, frame) {
    this.stage = stage;
    this.frame = frame;
    this.pending = null;
    this.view = 'split';
    this.positions = new Map();
    this.position = { x: 0, y: 0 };
  }

  rememberScroll() {
    if (!this.frame.getClientRects().length) return;
    const doc = this.frame.contentDocument;
    if (!doc?.scrollingElement) return;
    this.position = { x: doc.scrollingElement.scrollLeft, y: doc.scrollingElement.scrollTop };
    this.positions.set(this.view, this.position);
  }

  restoreScroll(frame = this.frame, position = this.position) {
    if (frame.contentDocument) frame.contentWindow?.scrollTo({ left: position.x, top: position.y, behavior: 'instant' });
  }

  resetScroll() {
    this.positions.clear();
    this.position = { x: 0, y: 0 };
  }

  changeView(view) {
    this.view = view;
    this.position = this.positions.get(view) || this.position;
    this.restoreScroll();
  }

  async show(html, { reset = false, isCurrent = () => true } = {}) {
    this.pending?.cancel();
    const next = this.frame.cloneNode(false);
    next.removeAttribute('id');
    next.className = 'preview-incoming';
    next.setAttribute('aria-hidden', 'true');
    next.inert = true;
    let cancel;
    const cancelled = new Promise(resolve => { cancel = resolve; });
    const pending = { cancel };
    this.pending = pending;
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('The preview is taking too long to load. Your previous preview is still visible.')), 20000);
    });
    try {
      const loaded = new Promise((resolve, reject) => {
        next.addEventListener('load', resolve, { once: true });
        next.addEventListener('error', () => reject(new Error('The preview could not load.')), { once: true });
        next.srcdoc = html;
        this.stage.append(next);
      });
      const ready = loaded.then(async () => {
        const doc = next.contentDocument;
        if (doc?.fonts) await doc.fonts.ready;
        if (doc) await Promise.allSettled([...doc.images].map(img => img.decode()));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const completed = await Promise.race([ready.then(() => true), cancelled.then(() => false), timeout]);
      if (!completed || !isCurrent()) return false;
      if (reset) this.resetScroll();
      else this.rememberScroll();
      this.restoreScroll(next, reset ? { x: 0, y: 0 } : this.position);
      const previous = this.frame;
      previous.removeAttribute('id');
      previous.setAttribute('aria-hidden', 'true');
      previous.inert = true;
      next.id = 'preview';
      next.removeAttribute('aria-hidden');
      next.inert = false;
      this.frame = next;
      // Start the fade only after the invisible frame has been laid out at the
      // restored scroll position. Keep the old frame underneath until it ends.
      next.classList.add('preview-ready');
      setTimeout(() => {
        previous.remove();
        next.classList.remove('preview-incoming', 'preview-ready');
      }, 200);
      return true;
    } finally {
      clearTimeout(timer);
      if (this.frame !== next) next.remove();
      if (this.pending === pending) this.pending = null;
    }
  }
}
