(() => {
  // sticky header shadow
  const hdr = document.querySelector('.header');
  if (hdr) {
    const on = () => hdr.classList.toggle('scrolled', scrollY > 10);
    addEventListener('scroll', on, { passive: true }); on();
  }

  // mobile menu
  const burger = document.querySelector('.burger'), mm = document.getElementById('mmenu');
  const setMenu = o => {
    if (!burger) return;
    burger.setAttribute('aria-expanded', o);
    burger.setAttribute('aria-label', o ? 'Закрити меню' : 'Відкрити меню');
    mm.classList.toggle('open', o);
    document.body.style.overflow = o ? 'hidden' : '';
  };
  burger && burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  mm && mm.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  // desktop dropdowns (click / keyboard)
  const dropBtns = [...document.querySelectorAll('.menu > li > button')];
  const closeAll = except => dropBtns.forEach(b => { if (b !== except) { b.setAttribute('aria-expanded', 'false'); b.nextElementSibling.classList.remove('open'); } });
  dropBtns.forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const o = b.getAttribute('aria-expanded') !== 'true';
    closeAll(b); b.setAttribute('aria-expanded', o); b.nextElementSibling.classList.toggle('open', o);
  }));
  document.addEventListener('click', e => { if (!e.target.closest('.menu')) closeAll(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeAll(); setMenu(false); } });

  // tabs
  const tabs = [...document.querySelectorAll('[role=tab]')];
  const sel = t => tabs.forEach(x => { const s = x === t; x.setAttribute('aria-selected', s); x.tabIndex = s ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !s; });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => sel(t));
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; sel(n); n.focus();
      }
    });
  });

  // news helpers
  const NEWS = window.NEWS || [];
  const HIDE = new Set(['Без категорії', 'Інформаційні сторінки', 'Новини']);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = d => { const [y, m, dd] = d.split('-'); return `${dd}.${m}.${y}`; };
  const card = (n, feature) => {
    const tag = (n.c.find(c => !HIDE.has(c)) || n.c[0] || 'Новини');
    const img = n.i
      ? `<div class="news-img"><img src="${esc(n.i)}" alt="" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('empty');this.src='img/logo.jpg'"></div>`
      : `<div class="news-img empty"><img src="img/logo.jpg" alt="" loading="lazy"></div>`;
    return `<a class="news-card${feature ? ' news-feature' : ''}" href="${esc(n.u)}">${img}<div class="news-body"><div class="news-meta"><time datetime="${n.d}">${fmt(n.d)}</time><span class="tag">${esc(tag)}</span></div><h3>${esc(n.t)}</h3>${n.e ? `<p>${esc(n.e)}</p>` : ''}<span class="more">Читати новину →</span></div></a>`;
  };

  // latest news on home
  const latest = document.getElementById('latest');
  if (latest && NEWS.length) {
    const items = NEWS.filter(n => n.c.includes('Новини') || n.c.includes('Оголошення') || n.c.includes('Успіхи студентів') || n.c.includes('Спорт')).slice(0, 5);
    latest.innerHTML = items.map((n, i) => card(n, i === 0)).join('');
    const c = document.getElementById('news-total'); if (c) c.textContent = NEWS.length;
  }

  // news archive page
  const grid = document.getElementById('news-grid');
  if (grid) {
    const PER = 12;
    const q = document.getElementById('q'), yearSel = document.getElementById('year'), catSel = document.getElementById('cat');
    const chipsBox = document.getElementById('chips'), countEl = document.getElementById('count'), pager = document.getElementById('pager');
    const counts = {};
    NEWS.forEach(n => n.c.forEach(c => { if (c) counts[c] = (counts[c] || 0) + 1; }));
    const cats = Object.entries(counts).filter(([c]) => c !== 'Без категорії').sort((a, b) => b[1] - a[1]);
    catSel.innerHTML = '<option value="">Усі категорії</option>' + cats.map(([c, k]) => `<option value="${esc(c)}">${esc(c)} (${k})</option>`).join('');
    const years = [...new Set(NEWS.map(n => n.d.slice(0, 4)))].sort().reverse();
    yearSel.innerHTML = '<option value="">Усі роки</option>' + years.map(y => `<option>${y}</option>`).join('');
    const quick = ['', 'Новини', 'Оголошення', 'Успіхи студентів', 'Спорт', 'Культурні заходи', 'Можливості', 'Важливе'];
    chipsBox.innerHTML = quick.map(c => `<button type="button" data-cat="${esc(c)}" aria-pressed="${c === '' ? 'true' : 'false'}">${c || 'Усі'}</button>`).join('');

    const params = new URLSearchParams(location.search);
    let state = { q: params.get('q') || '', cat: params.get('cat') || '', year: params.get('year') || '', page: +params.get('page') || 1 };
    q.value = state.q; catSel.value = state.cat; yearSel.value = state.year;

    const norm = s => s.toLowerCase().replace(/[’'`ʼ]/g, "'");
    const sync = () => {
      const p = new URLSearchParams();
      Object.entries(state).forEach(([k, v]) => { if (v && !(k === 'page' && v === 1)) p.set(k, v); });
      history.replaceState(null, '', p.toString() ? '?' + p : location.pathname);
    };
    const render = scroll => {
      const nq = norm(state.q.trim());
      const list = NEWS.filter(n => (!state.cat || n.c.includes(state.cat)) && (!state.year || n.d.startsWith(state.year)) && (!nq || norm(n.t + ' ' + n.e).includes(nq)));
      const pages = Math.max(1, Math.ceil(list.length / PER));
      state.page = Math.min(Math.max(1, state.page), pages);
      const slice = list.slice((state.page - 1) * PER, state.page * PER);
      grid.innerHTML = slice.length ? slice.map(n => card(n)).join('') : '';
      document.getElementById('empty').hidden = !!slice.length;
      countEl.textContent = `Знайдено публікацій: ${list.length}` + (pages > 1 ? ` · сторінка ${state.page} з ${pages}` : '');
      chipsBox.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === state.cat));
      // pager
      const btn = (p, label, cur, dis, aria) => `<button type="button" data-p="${p}"${cur ? ' aria-current="page"' : ''}${dis ? ' disabled' : ''}${aria ? ` aria-label="${aria}"` : ''}>${label}</button>`;
      let h = btn(state.page - 1, '←', false, state.page === 1, 'Попередня сторінка');
      const set = new Set([1, pages, state.page - 1, state.page, state.page + 1, state.page - 2, state.page + 2].filter(p => p >= 1 && p <= pages));
      let prev = 0;
      [...set].sort((a, b) => a - b).forEach(p => { if (p - prev > 1) h += '<span class="dots">…</span>'; h += btn(p, p, p === state.page, false, `Сторінка ${p}`); prev = p; });
      h += btn(state.page + 1, '→', false, state.page === pages, 'Наступна сторінка');
      pager.innerHTML = pages > 1 ? h : '';
      sync();
      if (scroll) document.getElementById('archive').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };
    let t;
    q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = q.value; state.page = 1; render(); }, 200); });
    catSel.addEventListener('change', () => { state.cat = catSel.value; state.page = 1; render(); });
    yearSel.addEventListener('change', () => { state.year = yearSel.value; state.page = 1; render(); });
    chipsBox.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.cat = b.dataset.cat; catSel.value = state.cat; state.page = 1; render(); });
    pager.addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b || b.disabled) return; state.page = +b.dataset.p; render(true); });
    document.getElementById('reset').addEventListener('click', () => { state = { q: '', cat: '', year: '', page: 1 }; q.value = ''; catSel.value = ''; yearSel.value = ''; render(); });
    render();
  }
})();
