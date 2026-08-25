(() => {
  const state = { sites: [], filtered: [], sort: 'dr-desc', query: '', category: 'all' };
  const $ = (id) => document.getElementById(id);
  const number = (n, digits = 0) => n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('ar-DZ', { maximumFractionDigits: digits });
  const date = (value) => {
    if (!value) return 'غير متوفر';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  function classify(site) {
    const text = `${site.name || ''} ${site.category || ''}`.toLowerCase();
    if (site.category) return site.category;
    if (text.includes('aps') || text.includes('وكالة')) return 'وكالة أنباء';
    return 'صحافة مكتوبة / إلكترونية';
  }

  function applyFilters() {
    const q = state.query.trim().toLowerCase();
    state.filtered = state.sites.filter((site) => {
      const matchesQuery = !q || `${site.name} ${site.domain}`.toLowerCase().includes(q);
      const matchesCategory = state.category === 'all' || classify(site) === state.category;
      return matchesQuery && matchesCategory;
    });
    state.filtered.sort((a, b) => {
      if (state.sort === 'name') return (a.name || '').localeCompare(b.name || '', 'ar');
      const av = a.dr == null ? -1 : Number(a.dr);
      const bv = b.dr == null ? -1 : Number(b.dr);
      return state.sort === 'dr-asc' ? av - bv : bv - av;
    });
    renderTable();
  }

  function renderTable() {
    const body = $('leaderboard-body');
    body.innerHTML = '';
    $('empty-state').hidden = state.filtered.length > 0;
    state.filtered.forEach((site, index) => {
      const tr = document.createElement('tr');
      const rank = index + 1;
      const rankClass = rank === 1 ? 'top-one' : rank === 2 ? 'top-two' : rank === 3 ? 'top-three' : '';
      const dr = site.dr == null ? null : Number(site.dr);
      const stale = site.stale ? '<span class="stale-tag">بيانات قديمة</span>' : '';
      tr.innerHTML = `
        <td class="rank-cell"><span class="rank-badge ${rankClass}">${number(rank)}</span></td>
        <td><span class="entity-name">${escapeHtml(site.name || 'جهة غير مسماة')}</span><span class="entity-domain">${escapeHtml(site.domain || '')}</span></td>
        <td><span class="category-pill">${escapeHtml(classify(site))}</span></td>
        <td><a class="domain-link" href="${safeUrl(site.url, site.domain)}" target="_blank" rel="noopener">زيارة الموقع ↗</a></td>
        <td class="dr-cell"><span class="dr-value">${dr == null ? '—' : number(dr, 1)}${dr == null ? '' : `<span class="dr-bar"><i style="width:${Math.max(0, Math.min(100, dr))}%"></i></span>`}</span></td>
        <td class="date-cell">${date(site.last_successful_update || site.last_checked)} ${stale}</td>`;
      body.appendChild(tr);
    });
  }

  function renderSummary() {
    const withDr = state.sites.filter((s) => s.dr != null).map((s) => Number(s.dr));
    const top = [...state.sites].filter((s) => s.dr != null).sort((a, b) => b.dr - a.dr)[0];
    const average = withDr.length ? withDr.reduce((a, b) => a + b, 0) / withDr.length : null;
    const generated = state.sites.find((s) => s.last_checked)?.last_checked || window.__ratingsGeneratedAt;
    $('hero-top-dr').textContent = top ? number(top.dr, 1) : '—';
    $('hero-top-name').textContent = top ? top.name : 'لا توجد بيانات بعد';
    $('hero-sites-count').textContent = number(state.sites.length);
    $('hero-updated').textContent = date(window.__ratingsGeneratedAt);
    $('stat-total').textContent = number(state.sites.length);
    $('stat-over-50').textContent = number(withDr.filter((v) => v >= 50).length);
    $('stat-average').textContent = number(average, 1);
    $('stat-stale').textContent = number(state.sites.filter((s) => s.stale).length);
    $('footer-updated').textContent = `آخر تحديث: ${date(window.__ratingsGeneratedAt)}`;
    $('data-status').textContent = `آخر مزامنة: ${date(window.__ratingsGeneratedAt)} · ${number(state.sites.length)} جهة`;
  }

  function populateCategories() {
    const categories = [...new Set(state.sites.map(classify))].sort((a, b) => a.localeCompare(b, 'ar'));
    const select = $('category-filter');
    categories.forEach((category) => {
      const option = document.createElement('option'); option.value = category; option.textContent = category; select.appendChild(option);
    });
  }

  function safeUrl(url, domain) {
    const candidate = url || `https://${domain}/`;
    try { const u = new URL(candidate); return ['http:', 'https:'].includes(u.protocol) ? u.href : '#'; } catch { return '#'; }
  }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[c])); }

  async function init() {
    try {
      const response = await fetch('./data/ratings.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      window.__ratingsGeneratedAt = payload.generated_at;
      state.sites = Array.isArray(payload.sites) ? payload.sites : [];
      $('data-status').textContent = 'تم تحميل البيانات';
      populateCategories(); renderSummary(); applyFilters();
    } catch (error) {
      $('data-status').textContent = 'تعذر تحميل البيانات الحالية';
      $('empty-state').hidden = false;
      $('empty-state').textContent = 'تعذر تحميل ملف الترتيب. ستتم المحاولة مجددًا في الزيارة القادمة.';
    }
  }

  $('search-input').addEventListener('input', (e) => { state.query = e.target.value; applyFilters(); });
  $('category-filter').addEventListener('change', (e) => { state.category = e.target.value; applyFilters(); });
  $('sort-select').addEventListener('change', (e) => { state.sort = e.target.value; applyFilters(); });
  init();
})();
