/* Interactive hooks for the unchanged, final-paper radial chart vectors. */
(() => {
  'use strict';

  let instanceCount = 0;
  const instances = new WeakMap();
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  function mount(root) {
    if (instances.has(root)) return instances.get(root);
    const svg = root.querySelector('svg');
    if (!svg) return null;
    const project = root.dataset.project || '';
    const sectors = [...svg.querySelectorAll('.radar-sector[data-radar-category]')];
    const bars = [...svg.querySelectorAll('.radar-bar[data-radar-category]')];
    if (!sectors.length || !bars.length) return null;
    const serial = ++instanceCount;
    const prefix = `paper-radar-${serial}-`;
    const abort = new AbortController();
    const on = (node, event, handler) => node.addEventListener(event, handler, { signal: abort.signal });
    let selectedCategory = null;
    let hovered = null;
    let focused = null;
    let lastPoint = null;
    let destroyed = false;

    // Inline SVG definitions have document-wide IDs. Namespacing prevents two
    // otherwise identical figure exports from resolving each other's glyphs.
    const idMap = new Map([...svg.querySelectorAll('[id]')].map(node => [node.id, prefix + node.id]));
    for (const node of svg.querySelectorAll('*')) {
      if (node.id) node.id = idMap.get(node.id);
      for (const attr of [...node.attributes]) {
        if (attr.name === 'id') continue;
        let value = attr.value;
        if ((attr.localName === 'href') && value.startsWith('#') && idMap.has(value.slice(1))) {
          value = '#' + idMap.get(value.slice(1));
        }
        value = value.replace(/url\(#([^)]+)\)/g, (match, id) => idMap.has(id) ? `url(#${idMap.get(id)})` : match);
        if (value !== attr.value) {
          if (attr.namespaceURI) node.setAttributeNS(attr.namespaceURI, attr.name, value);
          else node.setAttribute(attr.name, value);
        }
      }
    }

    const instructions = create('p', 'radar-sr-only',
      'Tab to a category. Left and right arrows move between categories. Down enters its plotted entries. ' +
      'Up returns to the category. Enter or Space selects a category; Escape clears the selection.');
    instructions.id = prefix + 'instructions';
    const tooltip = root.querySelector('.radar-tooltip') || create('div', 'radar-tooltip');
    tooltip.id = tooltip.id || prefix + 'tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.hidden = true;
    const title = create('strong', 'radar-tooltip-title');
    const series = create('span', 'radar-tooltip-series');
    const score = create('span', 'radar-tooltip-score');
    tooltip.replaceChildren(title, series, score);
    const status = create('p', 'radar-sr-only');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    root.append(instructions, tooltip, status);
    root.classList.add('radar-enhanced');
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', `${project} paper results by category`);
    svg.setAttribute('aria-describedby', instructions.id);

    const category = target => target?.dataset.radarCategory || null;
    const sectorFor = id => sectors.find(node => category(node) === id);
    const categoryName = id => sectorFor(id)?.getAttribute('aria-label') || id || '';
    const barName = bar => {
      if (bar.dataset.modelName) return bar.dataset.modelName;
      const firstBaselineSlot = project === 'GroundAnything' ? 2 : 1;
      const rank = Number(bar.dataset.radarSlot) - firstBaselineSlot + 1;
      return `Baseline rank ${rank} (paper figure)`;
    };
    const label = target => {
      const name = categoryName(category(target));
      return target.classList.contains('radar-bar')
        ? `${name}; ${barName(target)}; paper figure score ${target.dataset.paperScore}`
        : name;
    };
    const targetFrom = node => {
      if (!(node instanceof Element)) return null;
      const target = node.closest('.radar-bar, .radar-sector');
      return target && svg.contains(target) ? target : null;
    };

    for (const sector of sectors) {
      sector.setAttribute('role', 'button');
      sector.setAttribute('tabindex', '0');
      sector.setAttribute('aria-pressed', 'false');
    }
    for (const bar of bars) {
      bar.setAttribute('role', 'button');
      bar.setAttribute('tabindex', '-1');
      bar.setAttribute('aria-label', label(bar));
      bar.setAttribute('aria-pressed', 'false');
    }

    function positionTooltip(target, point) {
      const frame = root.getBoundingClientRect();
      const item = target.getBoundingClientRect();
      const desiredX = point ? point.clientX - frame.left + 14 : item.left - frame.left + item.width / 2 + 12;
      const desiredY = point ? point.clientY - frame.top + 14 : item.top - frame.top + item.height / 2 + 12;
      const maxX = Math.max(8, root.clientWidth - tooltip.offsetWidth - 8);
      const maxY = Math.max(8, root.clientHeight - tooltip.offsetHeight - 8);
      tooltip.style.left = `${Math.max(8, Math.min(desiredX, maxX))}px`;
      tooltip.style.top = `${Math.max(8, Math.min(desiredY, maxY))}px`;
    }

    function update() {
      const active = hovered || focused;
      const id = category(active) || selectedCategory;
      for (const sector of sectors) {
        sector.classList.toggle('is-radar-muted', Boolean(id && category(sector) !== id));
        sector.setAttribute('aria-pressed', String(category(sector) === selectedCategory));
      }
      for (const bar of bars) {
        const sameCategory = category(bar) === id;
        bar.classList.toggle('is-radar-muted', Boolean(active?.classList.contains('radar-bar') && sameCategory && active !== bar));
        bar.classList.toggle('is-radar-active', active === bar);
        bar.setAttribute('aria-pressed', String(category(bar) === selectedCategory));
      }
      if (!active) {
        tooltip.hidden = true;
        return;
      }
      title.textContent = categoryName(category(active));
      const isBar = active.classList.contains('radar-bar');
      series.hidden = !isBar;
      score.hidden = !isBar;
      series.textContent = isBar ? barName(active) : '';
      score.textContent = isBar ? `Paper figure score: ${active.dataset.paperScore}` : '';
      tooltip.hidden = false;
      positionTooltip(active, hovered ? lastPoint : null);
    }

    function selectCategory(id, target = null, emit = true) {
      if (id && !sectorFor(id)) return false;
      selectedCategory = id || null;
      status.textContent = selectedCategory ? `${categoryName(id)} selected.` : 'All categories.';
      update();
      if (emit) {
        root.dispatchEvent(new CustomEvent('radar-category-change', {
          bubbles: true,
          detail: {
            project,
            category: selectedCategory,
            label: selectedCategory ? categoryName(selectedCategory) : null,
            slot: target?.classList.contains('radar-bar') ? Number(target.dataset.radarSlot) : null,
            paperScore: target?.classList.contains('radar-bar') ? target.dataset.paperScore : null,
            modelName: target?.dataset.modelName || null,
            source: 'paper-figure-category-aggregate'
          }
        }));
      }
      return true;
    }

    on(root, 'pointerover', event => {
      const target = targetFrom(event.target);
      hovered = target;
      lastPoint = event;
      update();
    });
    on(root, 'pointermove', event => {
      const target = targetFrom(event.target);
      if (!target && hovered) {
        hovered = null;
        lastPoint = null;
        update();
        return;
      }
      if (!hovered) return;
      lastPoint = event;
      positionTooltip(hovered, event);
    });
    on(root, 'pointerleave', () => {
      hovered = null;
      lastPoint = null;
      update();
    });
    on(root, 'focusin', event => {
      const target = targetFrom(event.target);
      if (!target) return;
      focused = target;
      update();
    });
    on(root, 'focusout', event => {
      focused = targetFrom(event.relatedTarget);
      update();
    });
    on(root, 'click', event => {
      const target = targetFrom(event.target);
      if (!target) return;
      const id = category(target);
      const isBar = target.classList.contains('radar-bar');
      hovered = null;
      focused = target;
      target.focus({ preventScroll: true });
      selectCategory(!isBar && selectedCategory === id ? null : id, target);
    });
    on(root, 'keydown', event => {
      const target = targetFrom(event.target);
      if (!target) return;
      hovered = null;
      if (event.key === 'Escape') {
        event.preventDefault();
        focused = null;
        target.blur();
        selectCategory(null);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return;
      }
      const isBar = target.classList.contains('radar-bar');
      const id = category(target);
      const choices = isBar ? bars.filter(bar => category(bar) === id) : sectors;
      const current = choices.indexOf(target);
      let next = null;
      if (event.key === 'ArrowRight') next = choices[(current + 1) % choices.length];
      if (event.key === 'ArrowLeft') next = choices[(current - 1 + choices.length) % choices.length];
      if (event.key === 'Home') next = choices[0];
      if (event.key === 'End') next = choices[choices.length - 1];
      if (event.key === 'ArrowDown') next = isBar ? choices[(current + 1) % choices.length] : bars.find(bar => category(bar) === id);
      if (event.key === 'ArrowUp') next = isBar ? sectorFor(id) : choices[(current - 1 + choices.length) % choices.length];
      if (next) {
        event.preventDefault();
        next.focus({ preventScroll: true });
      }
    });

    const controller = {
      setCategory: (id, emit = true) => selectCategory(id, null, emit),
      getCategory: () => selectedCategory,
      reset: () => { hovered = focused = null; return selectCategory(null); },
      destroy: () => {
        if (destroyed) return;
        destroyed = true;
        abort.abort();
        hovered = focused = selectedCategory = null;
        update();
        for (const node of [...sectors, ...bars]) {
          node.classList.remove('is-radar-muted', 'is-radar-active');
          node.removeAttribute('tabindex');
          node.removeAttribute('role');
          node.removeAttribute('aria-pressed');
        }
        root.classList.remove('radar-enhanced');
        instructions.remove();
        tooltip.remove();
        status.remove();
        instances.delete(root);
      }
    };
    instances.set(root, controller);
    return controller;
  }

  const mountAll = (scope = document) => [...scope.querySelectorAll('.paper-radar[data-project]')].map(mount).filter(Boolean);
  window.PaperRadar = { mount, mountAll };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountAll(), { once: true });
  else mountAll();
})();
