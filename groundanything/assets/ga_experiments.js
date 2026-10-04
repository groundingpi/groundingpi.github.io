(() => {
  'use strict';
  document.querySelectorAll('[data-ga-chart]').forEach(chart => {
    if (chart.dataset.gaMounted) return;
    chart.dataset.gaMounted = 'true';
    const records = JSON.parse(chart.querySelector('.ga-chart-points').textContent);
    const select = chart.querySelector('select');
    const viewport = chart.querySelector('.ga-chart-viewport');
    const tooltip = chart.querySelector('.ga-chart-tooltip');
    const ink = [...chart.querySelectorAll('[data-ga-ink-series]')];
    const hits = [...chart.querySelectorAll('[data-ga-point]')];
    let current = -1;
    // Nearby curve markers can overlap after enlarging their touch targets.
    // Resolve the nearest marker instead of letting SVG paint order decide.
    function pointAt(event) {
      let best = null, distance = Infinity;
      hits.forEach(hit => {
        const box = hit.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) return;
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        const score = dx * dx + dy * dy;
        if (score < distance) { distance = score; best = hit; }
      });
      return best;
    }
    const highlight = sid => ink.forEach(node => {
      node.classList.toggle('ga-muted', Boolean(sid) && node.dataset.gaInkSeries !== sid);
    });
    function hide() {
      tooltip.hidden = true;
      hits.forEach(node => node.classList.remove('ga-current-point'));
      highlight(select.value);
    }
    function show(index, event) {
      const record = records[index];
      if (!record) return;
      current = index;
      highlight(record.sid);
      hits.forEach(node => node.classList.toggle('ga-current-point', Number(node.dataset.gaPoint) === index));
      const title = document.createElement('strong'); title.textContent = record.series;
      const setting = document.createElement('span'); setting.textContent = `${record.variable}: ${record.parameter}`;
      const result = document.createElement('span');
      result.textContent = record.value === null
        ? `${record.metric}: —`
        : `${record.metric}: ${record.value}${record.unit ? ' ' + record.unit : ''}${record.speedup ? ' · ' + record.speedup + '× vs native PyTorch' : ''}`;
      tooltip.replaceChildren(title, setting, result);
      tooltip.hidden = false;
      const box = chart.getBoundingClientRect();
      const target = hits[index].getBoundingClientRect();
      const x = event?.clientX ?? target.left + target.width / 2;
      const y = event?.clientY ?? target.top;
      const left = Math.max(8, Math.min(x - box.left + 14, box.width - tooltip.offsetWidth - 8));
      const top = Math.max(42, y - box.top - tooltip.offsetHeight - 12);
      tooltip.style.left = `${left}px`; tooltip.style.top = `${top}px`;
    }
    select.addEventListener('change', () => {
      hide();
      chart.querySelectorAll('.ga-chart-data tbody tr').forEach(row => {
        row.hidden = Boolean(select.value) && row.dataset.series !== select.value;
      });
    });
    viewport.addEventListener('pointermove', event => {
      const hit = pointAt(event);
      if (hit) show(Number(hit.dataset.gaPoint), event);
      else if (event.pointerType !== 'touch') hide();
    });
    viewport.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'touch') hide();
    });
    viewport.addEventListener('click', event => {
      const hit = pointAt(event);
      if (hit) show(Number(hit.dataset.gaPoint), event);
    });
    viewport.addEventListener('keydown', event => {
      if (event.key === 'Escape') { hide(); current = -1; return; }
      const next = ['ArrowRight','ArrowDown'].includes(event.key);
      const previous = ['ArrowLeft','ArrowUp'].includes(event.key);
      if (!next && !previous && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const eligible = records.filter(record => !select.value || record.sid === select.value).map(record => record.index);
      if (!eligible.length) return;
      let cursor = eligible.indexOf(current);
      cursor = event.key === 'Home' ? 0 : event.key === 'End' ? eligible.length - 1
        : (cursor + (previous ? -1 : 1) + eligible.length) % eligible.length;
      const index = eligible[cursor];
      hits[index].scrollIntoView({block:'nearest', inline:'nearest', behavior:'instant'});
      show(index);
    });
    viewport.addEventListener('focusout', event => {
      if (!viewport.contains(event.relatedTarget)) hide();
    });
  });
  document.querySelectorAll('.ga-token-efficiency').forEach(root => {
    root.querySelector('select').addEventListener('change', event => {
      root.querySelectorAll('tbody tr').forEach(row => {
        row.hidden = Boolean(event.target.value) && row.dataset.dataset !== event.target.value;
      });
    });
  });
})();
