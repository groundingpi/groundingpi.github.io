(() => {
  'use strict';
  function initPIAnalysis(root = document) {
    root.querySelectorAll('.pi-analysis').forEach(article => {
      if (article.dataset.piReady) return;
      const payload = article.querySelector('.pi-analysis-data');
      if (!payload) return;
      const data = JSON.parse(payload.textContent);
      article.dataset.piReady = 'true';
      const rowSelect = article.querySelector('[data-pi-row]');
      const metricSelect = article.querySelector('[data-pi-metric]');
      const frame = article.querySelector('.pi-analysis-frame');
      const tooltip = article.querySelector('.pi-analysis-tooltip');
      const selection = article.querySelector('.pi-analysis-selection');
      const hits = [...article.querySelectorAll('[data-pi-point]')];
      const lines = [...article.querySelectorAll('[data-pi-line]')];
      const keyOf = (row, col) => `${row},${col}`;
      const pointOf = element => {
        const [row, col] = element.dataset.piPoint.split(',').map(Number);
        return {row, col};
      };
      const selected = () => ({row: rowSelect.value === '' ? null : Number(rowSelect.value), col: metricSelect.value === '' ? null : Number(metricSelect.value)});
      let previewPoint = null;
      function highlight(point = null) {
        const state = point || selected();
        const active = state.row !== null || state.col !== null;
        hits.forEach(hit => {
          const p = pointOf(hit);
          const on = active && (state.row === null || p.row === state.row) && (state.col === null || p.col === state.col);
          hit.classList.toggle('is-active', on);
          const pin = selected();
          hit.setAttribute('aria-pressed', String(pin.row === p.row && pin.col === p.col));
        });
        lines.forEach(line => line.classList.toggle('is-active', state.col !== null && Number(line.dataset.piLine) === state.col));
      }
      function hidePreview() {
        previewPoint = null;
        tooltip.hidden = true;
        highlight();
      }
      function showPreview(point, target) {
        previewPoint = point;
        highlight(point);
        tooltip.replaceChildren();
        const title = document.createElement('strong');
        title.textContent = `${data.headers[0]}: ${data.rows[point.row][0]}`;
        const value = document.createElement('span');
        value.textContent = `${data.headers[point.col + 1]}: ${data.rows[point.row][point.col + 1]}`;
        tooltip.append(title, value);
        tooltip.hidden = false;
        const box = frame.getBoundingClientRect();
        const targetBox = target.getBoundingClientRect();
        const x = targetBox.left + targetBox.width / 2 - box.left;
        const y = targetBox.top - box.top;
        const left = Math.max(8, Math.min(x - tooltip.offsetWidth / 2, box.width - tooltip.offsetWidth - 8));
        const above = y - tooltip.offsetHeight - 10;
        const top = Math.max(8, Math.min(above >= 8 ? above : y + targetBox.height + 10, box.height - tooltip.offsetHeight - 8));
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      }
      function renderSelection() {
        hidePreview();
        const state = selected();
        selection.replaceChildren();
        selection.hidden = state.row === null && state.col === null;
        if (selection.hidden) return;
        const table = document.createElement('table');
        const head = document.createElement('thead');
        const header = document.createElement('tr');
        const cols = [0, ...[1, 2, 3].filter(col => state.col === null || col === state.col + 1)];
        cols.forEach(col => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = data.headers[col]; header.append(th); });
        head.append(header);
        const body = document.createElement('tbody');
        data.rows.forEach((row, index) => {
          if (state.row !== null && index !== state.row) return;
          const tr = document.createElement('tr');
          cols.forEach(col => { const td = document.createElement(col === 0 ? 'th' : 'td'); if (col === 0) td.scope = 'row'; td.textContent = row[col]; tr.append(td); });
          body.append(tr);
        });
        table.append(head, body);
        selection.append(table);
        highlight();
      }
      function pin(point) {
        rowSelect.value = String(point.row);
        metricSelect.value = String(point.col);
        renderSelection();
      }
      function reset() {
        rowSelect.value = '';
        metricSelect.value = '';
        renderSelection();
      }
      hits.forEach(hit => {
        const point = pointOf(hit);
        hit.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') showPreview(point, hit); });
        hit.addEventListener('pointerleave', () => { if (document.activeElement !== hit) hidePreview(); });
        hit.addEventListener('focus', () => showPreview(point, hit));
        hit.addEventListener('blur', hidePreview);
        hit.addEventListener('click', () => { pin(point); hit.focus({preventScroll: true}); showPreview(point, hit); });
        hit.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pin(point); return; }
          if (event.key === 'Escape') { event.preventDefault(); reset(); rowSelect.focus(); return; }
          let row = point.row; let col = point.col;
          if (event.key === 'ArrowLeft') row = (row + data.rows.length - 1) % data.rows.length;
          else if (event.key === 'ArrowRight') row = (row + 1) % data.rows.length;
          else if (event.key === 'ArrowUp') col = (col + 2) % 3;
          else if (event.key === 'ArrowDown') col = (col + 1) % 3;
          else if (event.key === 'Home') row = 0;
          else if (event.key === 'End') row = data.rows.length - 1;
          else return;
          event.preventDefault();
          const target = hits.find(h => h.dataset.piPoint === keyOf(row, col));
          if (target) target.focus({preventScroll: true});
        });
      });
      article.querySelectorAll('[data-pi-cell]').forEach(button => button.addEventListener('click', () => {
        const [row, col] = button.dataset.piCell.split(',').map(Number);
        pin({row, col});
      }));
      rowSelect.addEventListener('change', renderSelection);
      metricSelect.addEventListener('change', renderSelection);
      article.querySelector('[data-pi-reset]').addEventListener('click', reset);
      frame.addEventListener('pointerleave', () => { if (!hits.includes(document.activeElement)) hidePreview(); });
      window.addEventListener('resize', () => {
        if (previewPoint) {
          const hit = hits.find(h => h.dataset.piPoint === keyOf(previewPoint.row, previewPoint.col));
          if (hit) showPreview(previewPoint, hit);
        }
      }, {passive: true});
      highlight();
    });
  }
  window.initPIAnalysis = initPIAnalysis;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initPIAnalysis(), {once: true});
  else initPIAnalysis();
})();
