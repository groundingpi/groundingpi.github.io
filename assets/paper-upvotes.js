/* Fetch the public paper vote count on load and every minute while visible. */
(() => {
  'use strict';
  const counter = document.querySelector('[data-paper-upvotes]');
  if (!counter) return;
  const paper = counter.dataset.paperUpvotes;
  let pending = false;
  async function refresh() {
    if (pending || document.hidden) return;
    pending = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`https://huggingface.co/api/papers/${encodeURIComponent(paper)}`, {
        cache: 'no-store', credentials: 'omit', signal: controller.signal
      });
      if (!response.ok) throw new Error('Paper lookup failed');
      const data = await response.json();
      if (!Number.isSafeInteger(data.upvotes) || data.upvotes < 0) throw new Error('Invalid vote count');
      counter.textContent = String(data.upvotes);
      counter.dataset.status = 'live';
    } catch {
      // Never present an old count as live if the current lookup fails.
      counter.textContent = '—';
      counter.dataset.status = 'unavailable';
    } finally {
      clearTimeout(timeout);
      pending = false;
    }
  }
  refresh();
  setInterval(refresh, 60000);
  document.addEventListener('visibilitychange', refresh);
})();
