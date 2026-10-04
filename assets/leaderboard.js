(() => {
  'use strict';
  const root = document.querySelector('.appendix-explorer');
  if (!root) return;
  const category = root.querySelector('[name=capability]');
  const benchmark = root.querySelector('[name=benchmark]');
  const metric = root.querySelector('[name=metric]');
  const scope = root.querySelector('[name=scope]');
  const search = root.querySelector('[name=model-search]');
  const tbody = root.querySelector('.leaderboard tbody');
  const status = root.querySelector('.leaderboard-status');
  const source = root.querySelector('.appendix-source');
  const full = root.querySelector('.all-metrics');
  const labels = {visual_prompt:'Visual Prompt',grounding:'Grounding',dense:'Dense Grounding',referring:'Referring',ocr:'OCR',layout:'Layout',gui:'GUI',robo_point:'Robo Point',grounding_point:'Grounding Point',dense_point:'Dense Point',referring_point:'Referring Point'};
  let data, pendingCategory = '', requested = false;
  const option = (value,text) => { const el=document.createElement('option'); el.value=value; el.textContent=text; return el; };
  const td = (text,tag='td') => { const el=document.createElement(tag); el.textContent=text; return el; };
  const isEligible = cell => scope.value === 'external' ? cell.formal && cell.external : cell.local;
  const labelColumn = c => [c.dataset,c.split,c.subgroup,c.metric].filter(Boolean).join(' · ');
  function currentTable() { return data.tables.find(t=>t.id === benchmark.value); }
  function fillBenchmarks() {
    const before=benchmark.value;
    benchmark.replaceChildren(...data.tables.filter(t=>!category.value || t.columns.some(c=>c.axis===category.value)).map(t=>option(t.id,t.title)));
    if ([...benchmark.options].some(o=>o.value===before)) benchmark.value=before;
    fillMetrics();
  }
  function fillMetrics() {
    const table=currentTable();
    metric.replaceChildren(...table.columns.map((c,i)=>option(String(i),labelColumn(c))));
    metric.value=String(Math.max(0,table.columns.findIndex(c=>c.primary && (!category.value||c.axis===category.value))));
    render();
  }
  function render() {
    const table=currentTable(), index=Number(metric.value), col=table.columns[index];
    const rows=table.rows.filter(r=>r.model.toLowerCase().includes(search.value.trim().toLowerCase()));
    const scores=table.rows.filter(r=>isEligible(r.cells[index]) && r.cells[index].value!==null);
    scores.sort((a,b)=>(col.direction==='lower'?1:-1)*(a.cells[index].value-b.cells[index].value));
    tbody.replaceChildren();
    let rank=0,shown=0;
    scores.forEach((r,i)=>{
      if(i===0 || r.cells[index].value!==scores[i-1].cells[index].value) rank=i+1;
      if(!rows.includes(r)) return;
      shown++;
      const row=document.createElement('tr');
      if (/^Ground(ingPI|Anything)/.test(r.model)) row.classList.add('own-model');
      row.append(td(String(rank)),td(r.model,'th'));
      row.children[1].scope='row';
      const value=td(r.cells[index].display); value.className='score-cell'; row.append(value);
      const chart=td(''); chart.className='score-visual'; const bar=document.createElement('span');
      bar.style.width=`${Math.max(0,Math.min(100,r.cells[index].value))}%`; bar.setAttribute('aria-hidden','true'); chart.append(bar); row.append(chart);
      row.append(td(r.zero_shot||'—')); tbody.append(row);
    });
    if (!shown) { const row=document.createElement('tr'); const cell=td('No reported scores in this selection.'); cell.colSpan=5; row.append(cell); tbody.append(row); }
    status.textContent=`${shown===scores.length?shown:shown+' / '+scores.length} models · ${labelColumn(col)}${col.unit==='percent'?' (%)':''} · ${col.direction==='lower'?'lower':'higher'} is better`;
    source.href=table.url; source.textContent='Details ↗';
    root.querySelector('.scope-note').textContent=scope.value==='external' ? 'External results use their respective evaluation settings.' : 'Unreported and protocol-mismatched results are excluded.';
    const result=document.createElement('table'); result.className='metrics-table';
    const thead=document.createElement('thead'), header=document.createElement('tr');
    header.append(td('Model','th'),...table.columns.map(c=>td(labelColumn(c),'th'))); thead.append(header); result.append(thead);
    const body=document.createElement('tbody');
    rows.filter(r=>r.cells.some(isEligible)).forEach(r=>{
      const row=document.createElement('tr'); if (/^Ground(ingPI|Anything)/.test(r.model)) row.className='own-model';
      const name=td(r.model,'th');name.scope='row';row.append(name);
      r.cells.forEach(cell=>{const el=td(isEligible(cell)?cell.display:'—'); if(!isEligible(cell)) el.title=cell.reason||'Not reported under the selected evaluation scope.'; row.append(el);});
      body.append(row);
    }); result.append(body); full.replaceChildren(result);
  }
  async function load() {
    if(requested) return;requested=true;
    try {
      const response=await fetch(root.dataset.src);if(!response.ok) throw new Error('Data unavailable');data=await response.json();
      category.replaceChildren(option('','All capabilities'),...Object.keys(labels).filter(k=>data.tables.some(t=>t.columns.some(c=>c.axis===k))).map(k=>option(k,labels[k])));
      category.value=pendingCategory;
      root.querySelectorAll('select,input').forEach(el=>el.disabled=false);
      fillBenchmarks();
      category.addEventListener('change',()=>{fillBenchmarks();window.PaperRadar?.mount(document.querySelector('.paper-radar')).setCategory(category.value||null,false);});benchmark.addEventListener('change',fillMetrics);
      metric.addEventListener('change',render);scope.addEventListener('change',render);search.addEventListener('input',render);
    } catch { status.textContent='Results could not load. Please retry or open the details link.';requested=false; }
  }
  document.addEventListener('radar-category-change',event=>{
    const next=event.detail.category || event.detail.categoryId || '';
    if(!labels[next] && next) return;
    pendingCategory=next;
    if(data){category.value=next;fillBenchmarks();}else load();
  });
  new IntersectionObserver((entries,observer)=>{if(entries.some(e=>e.isIntersecting)){load();observer.disconnect();}},{rootMargin:'500px'}).observe(root.closest('#results')||root);
})();
