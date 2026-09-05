(function(){
  const translations = {
    en: {
      siteTitle: 'EAL Weekly — Frontiers of AI for Everyone',
      siteDescription: 'Plain, approachable weekly reports about forefront AI tech. Add episodes as Markdown files in src/episodes/*.md',
      home: 'Home', episodes: 'Episodes', github: 'GitHub', languageToggle: 'Switch language',
      searchPlaceholder: 'Search by title or content...',
      searchEpisodes: 'Search episodes', searchField: 'Search field', titleContent: 'Title + Content',
      title: 'Title', content: 'Content',
      footerBuilt: '© EAL Weekly Team — EAL Weekly. Built with Eleventy.', contribute: 'Contribute on GitHub',
      welcomeContribute: 'Welcome to contribute', englishVersion: 'English Version', chineseVersion: '中文版本',
      archive: 'ARCHIVE', allIssues: 'All issues', chinese: '中文', english: 'English', heroTitle: 'AI, explained for everyone.',
      heroDescription: 'A bilingual weekly journal covering AI news, tools, and ideas in plain language.',
      thisWeek: 'THIS WEEK', featured: 'Featured articles', viewAll: 'View all', explore: 'EXPLORE',
      aiNews: 'AI News', aiExplained: 'AI Explained', tutorials: 'Tutorials', tools: 'Tools', research: 'Research',
      aiEducation: 'AI × Education', learn: 'LEARN', learnAgent: 'What is an AI Agent?', learnLlm: 'What is an LLM?',
      learnRag: 'How does RAG work?', learnOpenSource: 'What does "open source AI" actually mean?',
      noResults: 'No results'
    },
    zh: {
      home: '首页', episodes: '文章', github: 'GitHub', languageToggle: '切换语言',
      siteTitle: 'EAL Weekly —— 面向所有人的 AI 前沿',
      siteDescription: '面向大众、通俗易懂的前沿 AI 技术周报。请将文章 Markdown 文件添加到 src/episodes/*.md',
      searchPlaceholder: '按标题或内容搜索……', searchEpisodes: '搜索文章', searchField: '搜索范围', titleContent: '标题 + 内容',
      title: '标题', content: '内容',
      footerBuilt: '© EAL Weekly Team —— EAL Weekly。使用 Eleventy 构建。', contribute: '在 GitHub 上贡献',
      welcomeContribute: '欢迎参与贡献', englishVersion: 'English Version', chineseVersion: '中文版本',
      archive: '文章归档', allIssues: '全部文章', chinese: '中文', english: 'English', heroTitle: '用人人都能懂的方式解释 AI。',
      heroDescription: '一份用通俗语言介绍 AI 新闻、工具与想法的中英双语周刊。',
      thisWeek: '本周内容', featured: '精选文章', viewAll: '查看全部', explore: '探索主题',
      aiNews: 'AI 新闻', aiExplained: 'AI 解释', tutorials: '教程', tools: '工具', research: '研究',
      aiEducation: 'AI × 教育', learn: '学习', learnAgent: '什么是 AI Agent？', learnLlm: '什么是 LLM？',
      learnRag: 'RAG 是如何工作的？', learnOpenSource: '“开源 AI”到底是什么意思？', noResults: '没有找到结果',
    }
  };
  const languageKey = 'ealweekly:language';
  const languageToggle = document.getElementById('language-toggle');
  const browserLanguage = (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  let language = localStorage.getItem(languageKey) || browserLanguage;

  function translate(key){ return translations[language][key] || translations.en[key] || key; }

  function applyLanguage(){
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = translate(element.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      element.placeholder = translate(element.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
      element.title = translate(element.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
      element.setAttribute('aria-label', translate(element.dataset.i18nAriaLabel));
    });
    document.querySelectorAll('[data-i18n-content]').forEach((element) => {
      element.setAttribute('content', translate(element.dataset.i18nContent));
    });
    document.querySelectorAll('[data-i18n-en][data-i18n-zh]').forEach((element) => {
      const value = language === 'zh' ? element.dataset.i18nZh : element.dataset.i18nEn;
      if (element.tagName === 'META') element.setAttribute('content', value);
      else element.textContent = value;
    });
    if (languageToggle) {
      languageToggle.textContent = language === 'zh' ? 'English' : '中文';
      languageToggle.setAttribute('aria-pressed', language === 'zh' ? 'true' : 'false');
    }
    document.querySelectorAll('.week-label').forEach((element) => {
      const match = element.textContent.trim().match(/^Week (\d+)$/);
      if (match) element.textContent = language === 'zh' ? `第 ${match[1]} 周` : `Week ${match[1]}`;
    });
    const path = window.location.pathname.replace(/\/$/, '');
    if (path === '' || path.endsWith('/index')) {
      document.title = document.querySelector('[data-i18n-en][data-i18n-zh]')?.textContent || translate('siteTitle');
    }
    else if (path.endsWith('/episodes')) document.title = translate('episodes');
  }

  applyLanguage();
  languageToggle?.addEventListener('click', function(){
    language = language === 'zh' ? 'en' : 'zh';
    localStorage.setItem(languageKey, language);
    applyLanguage();
    if (resultsEl) renderResults(lastResults);
  });

  // Search: fetch search.json and wire Fuse
  const searchInput = document.getElementById('search-input');
  const searchTarget = document.getElementById('search-target');
  const resultsEl = document.getElementById('search-results');

  if(!searchInput || !resultsEl) return;

  let items = [];
  let fuseByMode;
  let lastResults = [];

  function renderResults(list){
    lastResults = list || [];
    if(!list || list.length === 0){ resultsEl.innerHTML = `<p class="muted">${translate('noResults')}</p>`; return; }
    resultsEl.innerHTML = list.map(it => `
      <div class="search-hit">
        <h3><a href="${it.url}">${it.title}</a></h3>
        <p class="meta">${it.date} ${it.tags && it.tags.length ? ' • ' + it.tags.join(', ') : ''}</p>
        <p>${(it.summary||'').substring(0,240)}</p>
      </div>
    `).join('');
  }

  const basePath = document.querySelector('meta[name="base-url"]')?.getAttribute('content') || '/';
  const searchIndexUrl = new URL('search.json', `${window.location.origin}${basePath}`).toString();

  fetch(searchIndexUrl).then(r=>r.json()).then(data=>{
    items = data;

    const options = { threshold: 0.38, ignoreLocation: true };
    fuseByMode = {
      all: new Fuse(items, { ...options, keys: ['title', 'content', 'summary', 'tags'] }),
      title: new Fuse(items, { ...options, keys: ['title'] }),
      content: new Fuse(items, { ...options, keys: ['content'] })
    };
  }).catch(err=>{
    console.error(err);
  });

  function applyFiltersAndSearch(){
    const q = searchInput.value.trim();
    if(!q){
      lastResults = [];
      resultsEl.innerHTML = '';
      return;
    }
    if(fuseByMode){
      const mode = searchTarget?.value === 'title' || searchTarget?.value === 'content'
        ? searchTarget.value
        : 'all';
      renderResults(fuseByMode[mode].search(q, { limit: 50 }).map(r=>r.item));
    }
  }

  const debounce = (fn, t=200)=>{let id; return (...a)=>{clearTimeout(id); id=setTimeout(()=>fn(...a), t);} };

  searchInput.addEventListener('input', debounce(applyFiltersAndSearch, 180));
  if(searchTarget) searchTarget.addEventListener('change', applyFiltersAndSearch);

})();
