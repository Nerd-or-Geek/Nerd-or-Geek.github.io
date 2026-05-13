const STORE_CONFIG = window.NERD_OR_GEEK_STORE_CONFIG || {};
const EBAY_STORE_URL = STORE_CONFIG.ebayStoreUrl || 'https://www.ebay.com/str/nerdorgeek';
const STORE_DATA_URL = 'data/store-items.json';

const state = {
    items: [],
    query: '',
    category: 'All',
};

const categoryRules = {
    'Raspberry Pi': ['raspberry pi', 'pi zero', 'pi 4', 'pi 5', 'gpio'],
    Modems: ['modem', 'cellular', 'lte', '5g', '4g', 'quectel'],
    'DIY Electronics': ['diy', 'electronics', 'kit', 'sensor', 'module', 'board'],
    'Mystery Boxes': ['mystery', 'box', 'bundle', 'lot'],
    Parts: ['part', 'speaker', 'cable', 'adapter', 'accessory', 'hat'],
};

const grid = document.getElementById('storeGrid');
const statusEl = document.getElementById('storeStatus');
const emptyEl = document.getElementById('storeEmpty');
const searchInput = document.getElementById('storeSearch');
const chips = Array.from(document.querySelectorAll('[data-store-category]'));
const storeLinks = Array.from(document.querySelectorAll('[data-ebay-store-link]'));

storeLinks.forEach(link => {
    link.href = EBAY_STORE_URL;
});

function escapeHtml(text = '') {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function normalize(text = '') {
    return text.toLowerCase();
}

function inferCategory(item) {
    const title = normalize(item.title);
    for (const [category, terms] of Object.entries(categoryRules)) {
        if (terms.some(term => title.includes(term))) {
            return category;
        }
    }
    return 'Parts';
}

function formatDetail(value, fallback) {
    return value && String(value).trim() ? String(value).trim() : fallback;
}

function renderStatus(message, type = 'info') {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.status = type;
}

function showEmpty(message) {
    if (!emptyEl) return;
    emptyEl.innerHTML = `
        <h3>No store items to show yet</h3>
        <p>${escapeHtml(message)}</p>
        <a href="${EBAY_STORE_URL}" class="cta-button" target="_blank" rel="noopener noreferrer">
            Open eBay Store <i class="fas fa-external-link-alt"></i>
        </a>
    `;
    emptyEl.hidden = false;
}

function hideEmpty() {
    if (emptyEl) emptyEl.hidden = true;
}

function itemMatches(item) {
    const matchesQuery = !state.query || normalize(item.title).includes(state.query);
    const category = item.category || inferCategory(item);
    const matchesCategory = state.category === 'All' || category === state.category;
    return matchesQuery && matchesCategory;
}

function renderItems() {
    if (!grid) return;

    const visibleItems = state.items.filter(itemMatches);
    grid.innerHTML = '';

    if (state.items.length === 0) {
        showEmpty('The local store data file is empty. Visit the live eBay store for current listings.');
        return;
    }

    if (visibleItems.length === 0) {
        showEmpty('No listings match that search or filter. Try another term, or open the live eBay store.');
        return;
    }

    hideEmpty();
    visibleItems.forEach(item => {
        const card = document.createElement('article');
        card.className = 'store-product-card';
        card.innerHTML = `
            <a href="${escapeHtml(item.url || EBAY_STORE_URL)}" target="_blank" rel="noopener noreferrer" class="store-product-link">
                <img src="${escapeHtml(item.image || 'assets/img/Logo-With-Name.png')}" alt="${escapeHtml(item.title || 'eBay listing')}" class="store-product-image" loading="lazy">
                <div class="store-product-content">
                    <h3>${escapeHtml(item.title || 'eBay listing')}</h3>
                    <div class="store-product-meta">
                        <span class="store-product-price">${escapeHtml(formatDetail(item.price, 'View price on eBay'))}</span>
                        <span>${escapeHtml(formatDetail(item.condition, 'Condition on eBay'))}</span>
                        <span>${escapeHtml(formatDetail(item.shipping, 'Shipping on eBay'))}</span>
                    </div>
                    <span class="store-product-button">View on eBay <i class="fas fa-arrow-right"></i></span>
                </div>
            </a>
        `;
        grid.appendChild(card);
    });
}

function setCategory(category) {
    state.category = category;
    chips.forEach(chip => {
        const isActive = chip.dataset.storeCategory === category;
        chip.classList.toggle('active', isActive);
        chip.setAttribute('aria-pressed', String(isActive));
    });
    renderItems();
}

async function loadStoreItems() {
    renderStatus('Loading eBay listings from local store data...');
    hideEmpty();

    try {
        const response = await fetch(STORE_DATA_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Store data returned ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Store data is not an array');
        }

        state.items = data.map(item => ({
            ...item,
            category: item.category || inferCategory(item),
        }));

        renderStatus(state.items.length ? `${state.items.length} eBay listings loaded.` : 'Store data loaded, but no listings were found.', state.items.length ? 'success' : 'empty');
        renderItems();
    } catch (error) {
        console.warn('Store data error:', error);
        state.items = [];
        renderStatus('Unable to load local store data.', 'error');
        showEmpty('The store data file could not be loaded. You can still browse and checkout securely on eBay.');
    }
}

searchInput?.addEventListener('input', event => {
    state.query = normalize(event.target.value.trim());
    renderItems();
});

chips.forEach(chip => {
    chip.addEventListener('click', () => setCategory(chip.dataset.storeCategory || 'All'));
});

loadStoreItems();
