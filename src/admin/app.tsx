import type { StrapiApp } from '@strapi/strapi/admin';

const CSS = `
  :root {
    --must-navy:   #0D1B3E;
    --must-green:  #1B8A3D;
    --must-gold:   #C5A55A;
    --must-bg:     #F4F6F9;
    --must-border: #E2E8F0;
  }

  *, *::before, *::after { font-family: 'Poppins', sans-serif !important; }

  /* Admin background */
  html.must-admin, html.must-admin body, html.must-admin #root {
    background-color: #F4F6F9 !important;
  }

  /* Sidebar — left nav only (nav element, NOT aside which is the Document Actions panel) */
  nav {
    background-color: #0D1B3E !important;
    border-right: 1px solid rgba(255,255,255,0.08) !important;
  }
  nav a, nav button, nav li, nav li > * {
    background-color: transparent !important;
  }
  nav svg, nav svg path {
    fill: rgba(255,255,255,0.80) !important;
    color: rgba(255,255,255,0.80) !important;
  }
  nav span, nav p, nav a {
    color: rgba(255,255,255,0.85) !important;
  }
  nav h1, nav h2, nav h3, nav h4 {
    color: #ffffff !important; font-weight: 600 !important;
  }
  nav a[aria-current="page"], nav a[aria-current="true"] {
    background-color: #1B8A3D !important;
    border-radius: 6px !important;
    border-left: 3px solid #C5A55A !important;
  }
  nav a[aria-current="page"] span, nav a[aria-current="page"] svg path,
  nav a[aria-current="true"] span {
    color: #ffffff !important; fill: #ffffff !important;
  }
  /* Strapi v5: active state sets color on inner div via .active class */
  nav a.active > div, nav a[aria-current] > div {
    color: #ffffff !important;
    background-color: transparent !important;
  }
  /* Hover */
  #root nav a:hover, #root nav button:hover {
    background-color: rgba(27, 138, 61, 0.30) !important;
    border-radius: 6px !important;
    color: #ffffff !important;
  }

  /* Header */
  header, [role="banner"] {
    background-color: #ffffff !important;
    border-bottom: 1px solid #E2E8F0 !important;
    box-shadow: 0 1px 4px rgba(13,27,62,0.08) !important;
  }

  /* Content */
  main, [role="main"] { background-color: #F4F6F9 !important; }

  /* Tables */
  table { background-color: #ffffff !important; }
  thead tr { background-color: #0D1B3E !important; }
  thead tr th, thead tr th span, thead tr th button, thead tr th svg {
    color: #ffffff !important; fill: #ffffff !important;
  }

  *:focus-visible { outline-color: #1B8A3D !important; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 9999px; }
  ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
`;

export default {
  config: {
    head:  { favicon: '/must_logo.png' },
    auth:  { logo: '/must_logo.png' },
    menu:  { logo: '/must_logo.png' },
    translations: {
      en: {
        'app.components.LeftMenu.navbrand.title':     'MUST Portal',
        'app.components.LeftMenu.navbrand.workplace': 'Admin Dashboard',
        'Auth.form.welcome.title':    'International Student Platform',
        'Auth.form.welcome.subtitle': 'Admin Dashboard — Log in to continue',
      },
    },
    theme: {
      light: {
        colors: {
          primary100: '#E8F5EE', primary200: '#C3E6D0',
          primary500: '#1B8A3D', primary600: '#1B8A3D', primary700: '#166B30',
          danger100: '#FDECEA',  danger200: '#FCA5A5',
          danger500: '#DC2626',  danger600: '#DC2626',  danger700: '#B91C1C',
          warning100: '#FEF3C7', warning200: '#FDE68A',
          warning500: '#F59E0B', warning600: '#D97706', warning700: '#B45309',
          success100: '#E8F5EE', success200: '#C3E6D0',
          success500: '#1B8A3D', success600: '#1B8A3D', success700: '#166B30',
          alternative100: '#FAF4E8', alternative200: '#EDD9A3',
          alternative500: '#C5A55A', alternative600: '#C5A55A', alternative700: '#A8853C',
          neutral0: '#FFFFFF',   neutral100: '#F4F6F9',  neutral150: '#EEF1F5',
          neutral200: '#E2E8F0', neutral300: '#CBD5E1',  neutral400: '#94A3B8',
          neutral500: '#64748B', neutral600: '#475569',  neutral700: '#334155',
          neutral800: '#1E293B', neutral900: '#0D1B3E',  neutral1000: '#0A1428',
          buttonNeutral0: '#FFFFFF',
        },
        shadows: {
          filterShadow: '0 1px 4px rgba(13,27,62,0.10)',
          tableShadow:  '0 1px 4px rgba(13,27,62,0.10)',
          popupShadow:  '0 4px 20px rgba(13,27,62,0.15)',
        },
      },
      dark: {
        colors: {
          primary500: '#22C55E', primary600: '#1B8A3D', primary700: '#166B30',
          neutral0: '#111827',   neutral100: '#1F2937', neutral200: '#374151',
          neutral300: '#4B5563', neutral400: '#6B7280', neutral500: '#9CA3AF',
          neutral600: '#D1D5DB', neutral700: '#E5E7EB', neutral800: '#F3F4F6',
          neutral900: '#F9FAFB', neutral1000: '#FFFFFF', buttonNeutral0: '#1F2937',
        },
      },
    },
  },

  bootstrap(_app: StrapiApp) {
    // Force light mode
    localStorage.setItem('STRAPI_THEME', 'light');

    // Load Poppins
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);

    // ── Inject CSS — always keep our tag LAST in <head> so it wins cascade ───
    const injectCSS = () => {
      const old = document.getElementById('must-brand');
      if (old) old.remove();
      const s = document.createElement('style');
      s.id = 'must-brand';
      s.textContent = CSS;
      document.head.appendChild(s);
    };

    // Re-inject whenever styled-components adds a new <style> after ours
    const headObserver = new MutationObserver((mutations) => {
      const added = mutations.some(m =>
        Array.from(m.addedNodes).some(n => (n as Element).id !== 'must-brand' && n.nodeName === 'STYLE')
      );
      if (!added) return;
      const ours = document.getElementById('must-brand');
      if (ours && ours !== document.head.lastElementChild) injectCSS();
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        injectCSS();
        headObserver.observe(document.head, { childList: true });
      });
    });

    // ── Auth page: set navy gradient directly via inline styles ──────────────
    const NAVY = 'linear-gradient(160deg, #0D1B3E 0%, #1a3a6e 100%)';

    const applyPage = () => {
      const isAuth = !document.querySelector('nav[aria-label], nav > ul');
      document.documentElement.classList.toggle('must-auth', isAuth);
      document.documentElement.classList.toggle('must-admin', !isAuth);

      if (!isAuth) return;

      // Force navy on every ancestor div of the form (inline beats styled-components)
      const root = document.getElementById('root');
      if (!root) return;

      const walk = (el: Element) => {
        if (el.tagName === 'FORM') return;
        (el as HTMLElement).style.setProperty('background', NAVY, 'important');
        (el as HTMLElement).style.setProperty('min-height', '100vh', 'important');
        Array.from(el.children).forEach(walk);
      };
      walk(root);

      // Card stays white
      document.querySelectorAll('form').forEach((f) => {
        const el = f as HTMLElement;
        el.style.setProperty('background', '#ffffff', 'important');
        el.style.setProperty('min-height', 'auto', 'important');
        el.style.setProperty('border-radius', '12px', 'important');
        el.style.setProperty('border-top', '4px solid #1B8A3D', 'important');
        el.style.setProperty('box-shadow', '0 8px 40px rgba(0,0,0,0.25)', 'important');
      });
    };

    requestAnimationFrame(() => requestAnimationFrame(applyPage));
    setTimeout(applyPage, 300);

    // Re-run on SPA navigation
    new MutationObserver(() => {
      requestAnimationFrame(() => requestAnimationFrame(applyPage));
    }).observe(document.body, { childList: true, subtree: false });

    // ── Fix nav white boxes + hover via JS inline styles ─────────────────────
    // Inline setProperty('...', 'important') is the absolute highest CSS priority.
    // Only targets nav — aside is the Document Actions panel (Publish/Save), not the sidebar.

    const GREEN_ACTIVE = '#1B8A3D';
    const GREEN_HOVER  = 'rgba(27,138,61,0.35)';

    const fixSidebar = () => {
      document.querySelectorAll('nav *').forEach((el) => {
        const tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        const htmlEl = el as HTMLElement;
        if (htmlEl.getAttribute('aria-current')) return;
        if ((htmlEl as Element).matches(':hover')) return;
        htmlEl.style.setProperty('background-color', 'transparent', 'important');
        htmlEl.style.setProperty('background-image', 'none', 'important');
        htmlEl.style.setProperty('box-shadow', 'none', 'important');
        if (tag === 'A' || tag === 'BUTTON') {
          htmlEl.style.setProperty('border-left', 'none', 'important');
        }
      });

      // Re-apply active item green
      document.querySelectorAll('nav a[aria-current], nav a.active').forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.setProperty('background-color', GREEN_ACTIVE, 'important');
        htmlEl.style.setProperty('border-radius', '6px', 'important');
        htmlEl.style.setProperty('border-left', '3px solid #C5A55A', 'important');
        htmlEl.style.setProperty('color', '#ffffff', 'important');
        el.querySelectorAll('div, span, p').forEach(child => {
          (child as HTMLElement).style.setProperty('color', '#ffffff', 'important');
          (child as HTMLElement).style.setProperty('background-color', 'transparent', 'important');
        });
      });
    };

    // Run after paint and after a short delay for lazy-mounted components
    requestAnimationFrame(() => requestAnimationFrame(fixSidebar));
    setTimeout(fixSidebar, 300);
    setTimeout(fixSidebar, 800);

    // Re-run whenever new sidebar elements mount
    new MutationObserver(() => {
      requestAnimationFrame(fixSidebar);
    }).observe(document.body, { childList: true, subtree: true });

    // Hover
    document.addEventListener('mouseover', (e) => {
      const el = (e.target as Element).closest?.('nav a, nav button');
      if (!el || el.getAttribute('aria-current')) return;
      (el as HTMLElement).style.setProperty('background-color', GREEN_HOVER, 'important');
      (el as HTMLElement).style.setProperty('border-radius', '6px', 'important');
      (el as HTMLElement).style.setProperty('color', '#ffffff', 'important');
      el.querySelectorAll('span, p').forEach(child => {
        (child as HTMLElement).style.setProperty('color', '#ffffff', 'important');
      });
    });

    document.addEventListener('mouseout', (e) => {
      const el = (e.target as Element).closest?.('nav a, nav button');
      if (!el || el.getAttribute('aria-current')) return;
      (el as HTMLElement).style.setProperty('background-color', 'transparent', 'important');
      (el as HTMLElement).style.setProperty('color', 'rgba(255,255,255,0.85)', 'important');
      el.querySelectorAll('span, p').forEach(child => {
        (child as HTMLElement).style.setProperty('color', 'rgba(255,255,255,0.85)', 'important');
      });
    });
  },
};
