(() => {
  const root = document.documentElement;

  /* =========================
     DARK / LIGHT MODE
     ========================= */

  const toggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('portfolio-theme');

  if (savedTheme === 'light' || savedTheme === 'dark') {
    root.dataset.theme = savedTheme;
  }

  const syncToggle = () => {
    if (!toggle) return;

    const isDark = root.dataset.theme === 'dark';

    toggle.setAttribute('aria-checked', String(isDark));
    toggle.setAttribute(
      'aria-label',
      isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );
  };

  if (toggle) {
    syncToggle();

    toggle.addEventListener('click', () => {
      root.dataset.theme =
        root.dataset.theme === 'dark' ? 'light' : 'dark';

      localStorage.setItem(
        'portfolio-theme',
        root.dataset.theme
      );

      syncToggle();
    });
  }


  /* =========================
     RESEARCH — SHOW MORE
     ========================= */

  const timeline = document.getElementById('researchTimeline');
  const show = document.getElementById('showResearch');

  if (timeline && show) {
    show.addEventListener('click', () => {
      const expanded = timeline.classList.toggle('expanded');

      show.setAttribute(
        'aria-expanded',
        String(expanded)
      );

      show.innerHTML = expanded
        ? 'Show fewer experiences <span aria-hidden="true">↑</span>'
        : 'Show all 12 experiences <span aria-hidden="true">↓</span>';
    });
  }


  /* =========================
     MOBILE MENU
     ========================= */

  const mobileMenu = document.getElementById('mobileMenu');
  const sidebar = document.getElementById('sidebar');

  if (mobileMenu && sidebar) {
    mobileMenu.addEventListener('click', () => {
      const open = sidebar.classList.toggle('open');

      mobileMenu.setAttribute(
        'aria-expanded',
        String(open)
      );
    });

    document.querySelectorAll('.side-nav a').forEach(link => {
      link.addEventListener('click', () => {
        sidebar.classList.remove('open');
        mobileMenu.setAttribute('aria-expanded', 'false');
      });
    });
  }


  /* =========================
     ACTIVE NAVIGATION SECTION
     ========================= */

  const nav = [
    ...document.querySelectorAll('.side-nav a')
  ];

  const sections = nav
    .map(link =>
      document.querySelector(
        link.getAttribute('href')
      )
    )
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio -
              a.intersectionRatio
          )[0];

        if (!visible) return;

        nav.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') ===
              '#' + visible.target.id
          );
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.2, 0.6]
      }
    );

    sections.forEach(section => {
      observer.observe(section);
    });
  }
})();
