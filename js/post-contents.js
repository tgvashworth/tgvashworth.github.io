(function () {
  var contents = document.querySelector('.post-contents');
  var post = document.querySelector('article.post');
  if (!contents || !post) return;

  var headings = Array.from(post.querySelectorAll('h2, h3')).filter(function (heading) {
    return heading.textContent.trim() && !heading.closest('.footnotes');
  });
  if (!headings.length) return;

  var list = contents.querySelector('.post-toc-list');
  var toggle = contents.querySelector('.post-toc-toggle');
  var desktop = matchMedia('(min-width: 76rem)');
  var hasSections = headings.some(function (heading) { return heading.tagName === 'H2'; });

  var links = headings.map(function (heading) {
    // Keep Jekyll's IDs so existing links into posts continue to work.
    if (!heading.id) {
      var base = heading.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
      var id = base;
      var suffix = 2;
      while (document.getElementById(id)) id = base + '-' + suffix++;
      heading.id = id;
    }

    var item = document.createElement('li');
    if (hasSections && heading.tagName === 'H3') item.className = 'post-toc-subheading';
    var link = document.createElement('a');
    link.href = '#' + encodeURIComponent(heading.id);
    var label = document.createElement('span');
    label.className = 'post-toc-text';
    label.textContent = heading.textContent.trim();
    link.appendChild(label);
    link.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', 'false');
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    });
    item.appendChild(link);
    list.appendChild(item);
    return link;
  });

  contents.hidden = false;
  document.documentElement.classList.add('has-post-contents');

  toggle.addEventListener('click', function () {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
  document.addEventListener('click', function (event) {
    if (!contents.contains(event.target)) toggle.setAttribute('aria-expanded', 'false');
  });
  desktop.addEventListener('change', function () {
    toggle.setAttribute('aria-expanded', 'false');
  });

  var active = -1;
  var scheduled = false;
  function updateActiveHeading() {
    scheduled = false;
    var next = -1;
    var postRect = post.getBoundingClientRect();
    if (postRect.top < window.innerHeight && postRect.bottom > 0) {
      headings.forEach(function (heading, index) {
        if (heading.getBoundingClientRect().top <= 100) next = index;
      });
      // A short final section may never reach the top of the viewport.
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        next = headings.length - 1;
      }
    }
    if (next === active) return;
    if (active >= 0) links[active].removeAttribute('aria-current');
    if (next >= 0) links[next].setAttribute('aria-current', 'location');
    active = next;
  }
  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateActiveHeading);
  }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate);
  updateActiveHeading();
})();
