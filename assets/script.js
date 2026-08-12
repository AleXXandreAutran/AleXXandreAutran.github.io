
(() => {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('portfolio-theme');
  if (saved === 'light') root.dataset.theme = 'light';
  const syncToggle = () => toggle.setAttribute('aria-checked', String(root.dataset.theme === 'dark'));
  syncToggle();
  toggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('portfolio-theme', root.dataset.theme);
    syncToggle();
  });

  const timeline = document.getElementById('researchTimeline');
  const show = document.getElementById('showResearch');
  show.addEventListener('click', () => {
    const expanded = timeline.classList.toggle('expanded');
    show.setAttribute('aria-expanded', String(expanded));
    show.innerHTML = expanded ? 'Show fewer experiences <span aria-hidden="true">↑</span>' : 'Show all 12 experiences <span aria-hidden="true">↓</span>';
  });

  const mobileMenu = document.getElementById('mobileMenu');
  const sidebar = document.getElementById('sidebar');
  mobileMenu.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    mobileMenu.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.side-nav a').forEach(a => a.addEventListener('click', () => { sidebar.classList.remove('open'); mobileMenu.setAttribute('aria-expanded','false'); }));

  const nav = [...document.querySelectorAll('.side-nav a')];
  const sections = nav.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
    if (!visible) return;
    nav.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#'+visible.target.id));
  }, {rootMargin:'-20% 0px -60% 0px',threshold:[0,.2,.6]});
  sections.forEach(s => observer.observe(s));

  const search = document.getElementById('resourceSearch');
  const chips = [...document.querySelectorAll('.filter-chip')];
  const cards = [...document.querySelectorAll('.resource-card')];
  const groups = [...document.querySelectorAll('.resource-group')];
  const noResults = document.getElementById('noResults');
  let filter = 'all';
  const apply = () => {
    const q = search.value.trim().toLowerCase();
    cards.forEach(card => {
      const kind = card.dataset.resourceKind;
      const matchFilter = filter === 'all' || kind === filter;
      const matchSearch = !q || card.dataset.search.includes(q);
      card.classList.toggle('hidden-by-filter', !matchFilter);
      card.classList.toggle('hidden-by-search', !matchSearch);
    });
    groups.forEach(group => {
      const visible = [...group.querySelectorAll('.resource-card')].some(c => !c.classList.contains('hidden-by-filter') && !c.classList.contains('hidden-by-search'));
      group.classList.toggle('hidden-group', !visible);
    });
    const any = cards.some(c => !c.classList.contains('hidden-by-filter') && !c.classList.contains('hidden-by-search'));
    noResults.hidden = any;
  };
  search.addEventListener('input', apply);
  chips.forEach(chip => chip.addEventListener('click', () => {
    filter = chip.dataset.filter;
    chips.forEach(c => c.classList.toggle('active', c === chip));
    apply();
  }));
})();
