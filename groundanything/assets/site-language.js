/* Bilingual copy only; chart geometry, model names and numeric data stay intact. */
(() => {
  'use strict';
  const dictionaries = window.PROJECT_TRANSLATIONS || {text:{},html:{}};
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  const textMap = new Map(Object.entries(dictionaries.text).map(([key,value])=>[normalize(key),value]));
  const htmlMap = new Map();
  Object.entries(dictionaries.html).forEach(([key,value])=>{
    const template = document.createElement('template'); template.innerHTML=key;
    htmlMap.set(template.innerHTML,value);
  });
  const originals=new WeakMap(), attributes=new WeakMap(), blocks=new Map();
  document.querySelectorAll('p,h1,h2,h3,h4,figcaption').forEach(element=>{
    if(htmlMap.has(element.innerHTML)) blocks.set(element,{en:element.innerHTML,zh:htmlMap.get(element.innerHTML)});
  });
  let language='en', queued=false;
  try { if(localStorage.getItem('grounding-language')==='zh') language='zh'; } catch {}
  function translate(value) {
    const normalized=normalize(value);
    if(textMap.has(normalized)) return value.replace(/\S[\s\S]*\S|\S/,()=>textMap.get(normalized));
    const ranked=normalized.match(/^(\d+(?: \/ \d+)?) models · (.+) · (higher|lower) is better$/);
    if(ranked) return `${ranked[1]} 个模型 · ${ranked[2]} · ${ranked[3]==='higher'?'越高越好':'越低越好'}`;
    // Tooltip fields retain their exact numbers, units, model and benchmark names.
    const parts=normalized.split(/( · |; |: )/);
    if(parts.length>1) return parts.map(part=>textMap.get(part)||part).join('');
    return value;
  }
  function excluded(element) { return !element || element.closest('script,style,pre,code,svg,math,[data-no-translate]'); }
  function apply() {
    queued=false;observer.disconnect();
    blocks.forEach((copy,element)=>{
      if(element.innerHTML!==copy[language]) element.innerHTML=copy[language];
    });
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())) {
      if(excluded(node.parentElement)||[...blocks.keys()].some(block=>block.contains(node))) continue;
      const previous=originals.get(node);
      const source=previous && node.nodeValue===previous.rendered ? previous.en : node.nodeValue;
      const rendered=language==='zh'?translate(source):source;
      originals.set(node,{en:source,rendered});
      if(node.nodeValue!==rendered) node.nodeValue=rendered;
    }
    document.querySelectorAll('[placeholder],[title],[aria-label]').forEach(element=>{
      if(excluded(element)) return;
      const saved=attributes.get(element)||{};
      ['placeholder','title','aria-label'].forEach(name=>{
        if(!element.hasAttribute(name))return;
        const current=element.getAttribute(name), old=saved[name];
        const source=old && old.rendered===current?old.en:current;
        const rendered=language==='zh'?translate(source):source;
        saved[name]={en:source,rendered};
        if(current!==rendered) element.setAttribute(name,rendered);
      });
      attributes.set(element,saved);
    });
    document.documentElement.lang=language==='zh'?'zh-CN':'en';
    document.querySelectorAll('[data-set-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.setLanguage===language)));
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  }
  const observer=new MutationObserver(records=>{
    if(!queued && records.some(record=>!excluded(record.target.nodeType===1?record.target:record.target.parentElement))) {
      queued=true;queueMicrotask(apply);
    }
  });
  document.querySelectorAll('[data-set-language]').forEach(button=>button.addEventListener('click',()=>{
    language=button.dataset.setLanguage;
    try { localStorage.setItem('grounding-language',language); } catch {}
    apply();document.dispatchEvent(new CustomEvent('site-language-change',{detail:{language}}));
  }));
  window.SiteI18n={t:value=>language==='zh'?translate(value):value,get language(){return language;},refresh:apply};
  const switcher=document.querySelector('.language-switch');
  const hero=document.querySelector('.hero'), chapter=document.querySelector('.chapter-inner');
  if(switcher && hero && chapter) {
    const home=document.createComment('language-switch-home');switcher.before(home);
    new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting) home.after(switcher);
      else chapter.append(switcher);
    }).observe(hero);
  }
  apply();
})();
