/* Original paper plots: interactions change emphasis, never geometry or values. */
(() => {
  'use strict';
  document.querySelectorAll('[data-pi-chart]').forEach(chart => {
    if (chart.dataset.piReady) return;
    chart.dataset.piReady = 'true';
    const svg = chart.querySelector('svg');
    const tooltip = chart.querySelector('.pi-tooltip');
    const marks = [...svg.querySelectorAll('[data-mark]')].filter(n => !n.classList.contains('pi-hit'));
    const hits = [...svg.querySelectorAll('.pi-hit')];
    const selectors = [...chart.querySelectorAll('[data-pi-filter]')];
    let active = null;
    const filters = () => Object.fromEntries(selectors.map(s => [s.dataset.piFilter, s.value]));
    function render() {
      const selected = filters();
      marks.forEach(mark => {
        let dim = Object.entries(selected).some(([key, value]) => value && mark.dataset[key] && mark.dataset[key] !== value);
        if (active) dim ||= ['model', 'panel'].some(key => active.dataset[key] && mark.dataset[key] && active.dataset[key] !== mark.dataset[key]);
        mark.classList.toggle('pi-dim', dim);
      });
      hits.forEach(hit => {
        const eligible = Object.entries(selected).every(([key, value]) => !value || !hit.dataset[key] || hit.dataset[key] === value);
        hit.setAttribute('tabindex', eligible ? '0' : '-1');
        hit.style.pointerEvents = eligible ? '' : 'none';
        hit.setAttribute('aria-hidden', eligible ? 'false' : 'true');
        hit.classList.toggle('pi-selected-point', Boolean(selected.fraction) && eligible);
      });
    }
    function show(hit, event) {
      active = hit;
      tooltip.textContent = hit.dataset.tooltip;
      tooltip.hidden = false;
      const box = chart.getBoundingClientRect();
      const target = hit.getBoundingClientRect();
      const x = event && Number.isFinite(event.clientX) ? event.clientX : (target.left + target.right) / 2;
      const y = event && Number.isFinite(event.clientY) ? event.clientY : target.top;
      tooltip.style.left = Math.max(8, Math.min(x - box.left + 12, box.width - tooltip.offsetWidth - 10)) + 'px';
      tooltip.style.top = Math.max(6, y - box.top - tooltip.offsetHeight - 12) + 'px';
      render();
    }
    function hide() { active = null; tooltip.hidden = true; render(); }
    hits.forEach(hit => {
      hit.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') show(hit, e); });
      hit.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch' && document.activeElement !== hit) hide(); });
      hit.addEventListener('focus', () => show(hit));
      hit.addEventListener('blur', hide);
      hit.addEventListener('click', e => show(hit, e));
      hit.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(hit); }
        if (e.key === 'Escape') { e.preventDefault(); hide(); hit.blur(); }
        if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
          e.preventDefault();
          const visible = hits.filter(n => n.getAttribute('tabindex') === '0');
          const direction = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1;
          visible[(visible.indexOf(hit) + direction + visible.length) % visible.length]?.focus();
        }
      });
    });
    selectors.forEach(select => select.addEventListener('change', hide));
    chart.querySelector('[data-pi-reset]').addEventListener('click', () => { selectors.forEach(s => s.value = ''); hide(); });
    document.addEventListener('pointerdown', e => { if (!chart.contains(e.target)) hide(); });
    chart.querySelector('[data-pi-enlarge]').addEventListener('click', () => {
      if (chart.closest('.pi-zoom-dialog')) return;
      if (chart.closest('dialog')) return;
      const placeholder = document.createComment('paper-chart-position');
      chart.before(placeholder);
      const dialog = document.createElement('dialog');
      dialog.className = 'pi-zoom-dialog';
      dialog.setAttribute('aria-label', 'Expanded paper chart');
      const close = document.createElement('button');
      close.type = 'button'; close.className = 'pi-dialog-close'; close.textContent = 'Close ×';
      dialog.append(close, chart); document.body.append(dialog);
      const originalOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
      dialog.addEventListener('close', () => {
        hide(); placeholder.replaceWith(chart); dialog.remove();
        document.documentElement.style.overflow = originalOverflow;
        chart.querySelector('[data-pi-enlarge]').focus();
      }, { once: true });
      dialog.showModal(); close.focus();
    });
    render();
  });
})();
