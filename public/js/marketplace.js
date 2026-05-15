/**
 * marketplace.js — FoodIQ Smart Grocery Marketplace
 * ──────────────────────────────────────────────────
 * Real grocery search behavior: empty state on load,
 * products appear only after search or category click.
 */

(function () {
  'use strict';

  if (!getToken()) { window.location.href = 'index.html'; return; }

  // ─── State ──────────────────────────────────
  let currentCategory = '';
  let currentSort = 'score';
  let currentQuery = '';
  let hasSearched = false;

  // ─── Init ───────────────────────────────────
  async function init() {
    setupUserAvatar();
    setupLogout();
    setupMobileMenu();
    bindEvents();

    // Check URL for preloaded search (from recipe "Buy Ingredients" button)
    const urlQ = new URLSearchParams(window.location.search).get('q');
    if (urlQ) {
      currentQuery = urlQ;
      document.getElementById('mpSearch').value = urlQ;
      doSearch();
    }
    // Otherwise show empty landing state — no products loaded
  }

  // ─── User setup ─────────────────────────────
  function setupUserAvatar() {
    const u = getUser();
    const av = document.getElementById('userAvatar');
    if (av && u.name) av.textContent = u.name[0].toUpperCase();
  }
  function setupLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      localStorage.removeItem('foodiq_token');
      localStorage.removeItem('foodiq_user');
      window.location.href = 'index.html';
    });
  }
  function setupMobileMenu() {
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
      document.getElementById('navLinks')?.classList.toggle('mobile-open');
    });
  }

  // ─── Bind events ────────────────────────────
  function bindEvents() {
    // Search button
    document.getElementById('mpSearchBtn')?.addEventListener('click', () => {
      currentQuery = document.getElementById('mpSearch').value.trim();
      currentCategory = '';
      clearActiveChips();
      doSearch();
    });

    // Enter key
    document.getElementById('mpSearch')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        currentQuery = e.target.value.trim();
        currentCategory = '';
        clearActiveChips();
        doSearch();
      }
    });

    // Category chips
    document.getElementById('mpCategories')?.addEventListener('click', (e) => {
      const chip = e.target.closest('.mp-cat-chip');
      if (!chip) return;

      // Toggle: click same chip again → deselect
      if (chip.classList.contains('active')) {
        chip.classList.remove('active');
        currentCategory = '';
        showLanding();
        return;
      }

      clearActiveChips();
      chip.classList.add('active');
      currentCategory = chip.dataset.cat;
      currentQuery = '';
      document.getElementById('mpSearch').value = '';
      doSearch();
    });

    // Trending chips
    document.querySelectorAll('.mp-trending-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        currentQuery = chip.dataset.query;
        currentCategory = '';
        clearActiveChips();
        document.getElementById('mpSearch').value = currentQuery;
        doSearch();
      });
    });

    // Sort
    document.getElementById('mpSort')?.addEventListener('change', (e) => {
      currentSort = e.target.value;
      if (hasSearched) doSearch();
    });
  }

  function clearActiveChips() {
    document.querySelectorAll('.mp-cat-chip').forEach(c => c.classList.remove('active'));
  }

  // ─── Show/hide sections ─────────────────────
  function showLanding() {
    hasSearched = false;
    document.getElementById('mpEmptyState').style.display = '';
    document.getElementById('mpResults').style.display = 'none';
  }

  function showResults() {
    hasSearched = true;
    document.getElementById('mpEmptyState').style.display = 'none';
    document.getElementById('mpResults').style.display = '';
  }

  // ─── Search / Load products ─────────────────
  async function doSearch() {
    if (!currentQuery && !currentCategory) { showLanding(); return; }

    showResults();
    const grid = document.getElementById('mpProductsGrid');
    const countEl = document.getElementById('mpResultCount');

    // Skeleton
    grid.innerHTML = Array(8).fill('<div class="mp-skeleton"></div>').join('');

    try {
      let url = `/marketplace/products?sort=${currentSort}`;
      if (currentQuery) url += `&q=${encodeURIComponent(currentQuery)}`;
      if (currentCategory) url += `&category=${currentCategory}`;

      const data = await apiCall(url);
      const label = currentQuery || currentCategory;
      countEl.textContent = `${data.total} result${data.total !== 1 ? 's' : ''} for "${label}"`;

      if (data.products.length === 0) {
        grid.innerHTML = `
          <div class="mp-empty">
            <i class="fa-solid fa-magnifying-glass"></i>
            <h3>No products found for "${label}"</h3>
            <p>Try a different search term or category</p>
          </div>`;
        return;
      }

      grid.innerHTML = data.products.map(renderCard).join('');
    } catch (err) {
      console.error('Search error:', err);
      grid.innerHTML = `
        <div class="mp-empty">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <h3>Something went wrong</h3>
          <p>Please try again</p>
        </div>`;
    }
  }

  // ─── Render card (minimal) ──────────────────
  function renderCard(p) {
    return `
      <div class="mp-card">
        <div class="mp-card-image">${p.image}</div>
        <div class="mp-card-name">${p.name}</div>
        <div class="mp-card-weight">${p.weight}</div>
        <div class="mp-card-price">₹${p.price}</div>
        <div class="mp-card-platforms">
          <a href="${p.platforms.blinkit}" target="_blank" rel="noopener" class="mp-platform-btn">Blinkit <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
          <a href="${p.platforms.bigbasket}" target="_blank" rel="noopener" class="mp-platform-btn">BigBasket <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
          <a href="${p.platforms.zepto}" target="_blank" rel="noopener" class="mp-platform-btn">Zepto <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
          <a href="${p.platforms.instamart}" target="_blank" rel="noopener" class="mp-platform-btn">Instamart <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        </div>
      </div>
    `;
  }

  // ─── Run ────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
