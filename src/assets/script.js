(function(){
  // Theme toggle: respects prefers-color-scheme and persists in localStorage
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const storageKey = 'aiweekly:theme';

  function applyTheme(name){
    if(name === 'dark') root.setAttribute('data-theme','dark');
    else if(name === 'light') root.removeAttribute('data-theme');
    else { // auto
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if(prefersDark) root.setAttribute('data-theme','dark'); else root.removeAttribute('data-theme');
    }
  }

  const saved = localStorage.getItem(storageKey) || 'auto';
  applyTheme(saved);

  toggle.addEventListener('click', function(){
    const next = (localStorage.getItem(storageKey) || 'auto') === 'light' ? 'dark' : 'light';
    localStorage.setItem(storageKey, next);
    applyTheme(next);
  });

  // Search: fetch search.json and wire Fuse
  const searchInput = document.getElementById('search-input');
  const resultsEl = document.getElementById('search-results');
  const filterWeek = document.getElementById('filter-week');
  const filterDate = document.getElementById('filter-date');

  let items = [];
  let fuse;

  function renderResults(list){
    if(!list || list.length === 0){ resultsEl.innerHTML = '<p class="muted">No results</p>'; return; }
    resultsEl.innerHTML = list.map(it => `
      <div class="search-hit">
        <h3><a href="${it.url}">${it.title}</a></h3>
        <p class="meta">${it.date} ${it.tags && it.tags.length ? ' • ' + it.tags.join(', ') : ''}</p>
        <p>${(it.summary||'').substring(0,240)}</p>
      </div>
    `).join('');
  }

  fetch('/search.json').then(r=>r.json()).then(data=>{
    items = data.map(d=>({
      ...d,
      dateObj: d.date ? new Date(d.date + 'T00:00:00') : null
    }));

    fuse = new Fuse(items, { keys: ['title','content','tags','summary'], threshold: 0.35 });
    renderResults(items.slice(0, 10));
  }).catch(err=>{
    resultsEl.innerHTML = '<p class="muted">Search index not available.</p>';
    console.error(err);
  });

  function getWeekRangeFromWeekInput(weekStr){
    // weekStr is like YYYY-Wxx
    if(!weekStr) return null;
    const parts = weekStr.split('-W');
    if(parts.length !== 2) return null;
    const year = parseInt(parts[0],10);
    const week = parseInt(parts[1],10);
    // compute first day of ISO week
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const ISOweekStart = new Date(simple);
    // adjust to Monday
    const diff = (simple.getDay() + 6) % 7; // 0->Mon
    ISOweekStart.setDate(simple.getDate() - diff);
    const ISOweekEnd = new Date(ISOweekStart);
    ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
    return [ISOweekStart, ISOweekEnd];
  }

  function applyFiltersAndSearch(){
    const q = searchInput.value.trim();
    const week = filterWeek.value;
    const date = filterDate.value;

    let candidates = items.slice();

    // apply date/week filters
    if(week){
      const range = getWeekRangeFromWeekInput(week);
      if(range){
        candidates = candidates.filter(it => it.dateObj && it.dateObj >= range[0] && it.dateObj <= range[1]);
      }
    }
    if(date){
      const d = new Date(date + 'T00:00:00');
      candidates = candidates.filter(it => it.dateObj && it.dateObj.getTime() === d.getTime());
    }

    if(q && fuse){
      const res = fuse.search(q, {limit: 50}).map(r=>r.item);
      // if we applied filters, intersect by url
      if(week || date){
        const urls = new Set(candidates.map(c=>c.url));
        renderResults(res.filter(r=>urls.has(r.url)));
      } else {
        renderResults(res);
      }
    } else {
      // no query -> show filtered list (latest first)
      renderResults(candidates.slice(0, 50));
    }
  }

  const debounce = (fn, t=200)=>{let id; return (...a)=>{clearTimeout(id); id=setTimeout(()=>fn(...a), t);} };

  searchInput.addEventListener('input', debounce(applyFiltersAndSearch, 180));
  filterWeek.addEventListener('change', applyFiltersAndSearch);
  filterDate.addEventListener('change', applyFiltersAndSearch);

})();
