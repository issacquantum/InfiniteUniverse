export function installScienceSearch(store) {
  const container = document.createElement('div'); container.className = 'science-search';
  const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'science-search-toggle';
  const panel = document.createElement('section'); panel.hidden = true; panel.id = 'science-search-panel';
  const label = document.createElement('label'); const input = document.createElement('input'); input.type = 'search'; input.id = 'science-query'; input.autocomplete = 'off'; label.htmlFor = input.id;
  const status = document.createElement('p'); status.setAttribute('role','status');
  const results = document.createElement('ol');
  toggle.setAttribute('aria-controls', panel.id); toggle.setAttribute('aria-expanded','false');
  panel.append(label,input,status,results); container.append(toggle,panel);
  document.querySelector('.site-shell').append(container);
  const cache = new Map(); let request = 0;
  const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase();
  async function search() {
    const token = ++request; const language = store.getState().language;
    results.replaceChildren(); status.textContent = '';
    const words = normalize(input.value.trim()).split(/\s+/).filter(Boolean); if (!words.length) return;
    status.textContent = language === 'es' ? 'Buscando…' : 'Searching…';
    try {
      if (!cache.has(language)) cache.set(language, fetch(`data/search-${language}.json?v=20260916-overhaul`).then(r => { if (!r.ok) throw new Error('Search index unavailable'); return r.json(); }).catch(e => { cache.delete(language); throw e; }));
      const index = await cache.get(language); if (request !== token) return;
      const hits = index.map(entry => ({...entry, score: words.reduce((n,w) => n + (normalize(entry.title).includes(w) ? 10 : 0),0)})).filter(e => words.every(w => normalize(e.title+' '+e.terms).includes(w))).sort((a,b)=>b.score-a.score).slice(0,30);
      for (const hit of hits) {
        const li=document.createElement('li');const a=document.createElement('a');a.href=hit.route;a.textContent=hit.title;
        a.addEventListener('click',()=>{ panel.hidden=true;toggle.setAttribute('aria-expanded','false'); });li.append(a);results.append(li);
      }
      status.textContent = language === 'es' ? `${hits.length} resultados` : `${hits.length} results`;
    } catch { status.textContent = language === 'es' ? 'No se pudo cargar el índice. Intenta de nuevo.' : 'The index could not load. Please try again.'; }
  }
  let timer; input.addEventListener('input',()=>{ clearTimeout(timer); timer=setTimeout(search,120); });
  toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){input.focus();void search();}});
  panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}});
  let previousLanguage = store.getState().language;
  function translate(state){if(state.language!==previousLanguage){++request;results.replaceChildren();status.textContent="";previousLanguage=state.language;}const es=state.language==='es';toggle.textContent=es?'Buscar en ciencia':'Search science';label.textContent=es?'Tema, ecuación, autor o modelo':'Topic, equation, author, or model';if(!panel.hidden)void search();}
  translate(store.getState());store.subscribe(translate);
}
