const sidebarToggleBtn = document.getElementById('sidebarToggle');
const sidebarCloseBtn = document.getElementById('sidebarClose');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const navLinks = document.querySelectorAll('.nav-link');
let searchDropdown = null;
function toggleSidebar() {
    sidebar?.classList.toggle('active');
    sidebarOverlay?.classList.toggle('active');
}
function closeSidebar() {
    sidebar?.classList.remove('active');
    sidebarOverlay?.classList.remove('active');
}
function openSidebar() {
    sidebar?.classList.add('active');
    sidebarOverlay?.classList.add('active');
}
sidebarToggleBtn?.addEventListener('click', toggleSidebar);
sidebarCloseBtn?.addEventListener('click', closeSidebar);
sidebarOverlay?.addEventListener('click', closeSidebar);
navLinks.forEach((link) => {
    link.addEventListener('click', () => {
        closeSidebar();
    });
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeSidebar();
    }
});
function isDocsPage() {
    return window.location.pathname.includes('/projects/') ||
        document.querySelector('.docs-wrapper') !== null;
}
function getBasePath() {
    if (window.location.pathname.includes('/projects/')) {
        return '../';
    }
    return '';
}
function getProjectLinkForSearch(project) {
    const basePath = getBasePath();
    if (project.staticUrl) {
        if (/^https?:\/\//.test(project.staticUrl)) {
            return project.staticUrl;
        }
        return `${basePath}${project.staticUrl}`;
    }
    return `${basePath}projects/docs.html?id=${encodeURIComponent(project.id)}`;
}
function getMainSearchData() {
    const results = [];
    const adminData = getAdminData();
    if (adminData) {
        adminData.projects.forEach(project => {
            results.push({
                title: project.name,
                url: getProjectLinkForSearch(project),
                description: project.description,
                category: 'project',
                icon: project.icon === 'custom' ? 'fa-folder' : project.icon
            });
        });
        adminData.software.forEach(sw => {
            results.push({
                title: sw.name,
                url: sw.link,
                description: sw.description,
                category: 'software',
                icon: sw.icon === 'custom' ? 'fa-code' : sw.icon
            });
        });
        adminData.affiliates.forEach(affiliate => {
            if (!affiliate.comingSoon) {
                results.push({
                    title: affiliate.name,
                    url: affiliate.link,
                    description: affiliate.description,
                    category: 'affiliate',
                    icon: affiliate.icon === 'custom' ? 'fa-link' : affiliate.icon
                });
            }
        });
    }
    return results;
}
function getDocsSearchData() {
    const sections = [];
    const docsSections = document.querySelectorAll('.docs-section');
    docsSections.forEach((section) => {
        const id = section.getAttribute('id');
        const heading = section.querySelector('.docs-heading, h2');
        const headingText = heading?.textContent || id || 'Section';
        const paragraph = section.querySelector('p');
        const description = paragraph?.textContent?.substring(0, 100) || '';
        if (id) {
            sections.push({
                title: headingText,
                url: `#${id}`,
                description: description + (description.length >= 100 ? '...' : ''),
                category: 'section',
                icon: 'fa-bookmark'
            });
        }
        const cards = section.querySelectorAll('.docs-card');
        cards.forEach((card) => {
            const cardTitle = card.querySelector('h3, h4')?.textContent;
            const cardDesc = card.querySelector('p')?.textContent?.substring(0, 80) || '';
            if (cardTitle && id) {
                sections.push({
                    title: cardTitle,
                    url: `#${id}`,
                    description: cardDesc + (cardDesc.length >= 80 ? '...' : ''),
                    category: 'section',
                    icon: 'fa-file-lines'
                });
            }
        });
    });
    return sections;
}
function createSearchDropdown() {
    const existing = document.querySelector('.search-dropdown');
    if (existing)
        existing.remove();
    const dropdown = document.createElement('div');
    dropdown.className = 'search-dropdown';
    dropdown.innerHTML = '<div class="search-dropdown-content"></div>';
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.appendChild(dropdown);
    }
    return dropdown;
}
function renderSearchResults(results, query) {
    if (!searchDropdown) {
        searchDropdown = createSearchDropdown();
    }
    const content = searchDropdown.querySelector('.search-dropdown-content');
    if (!content)
        return;
    if (results.length === 0) {
        content.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <p>No results found for "<strong>${escapeHtml(query)}</strong>"</p>
            </div>
        `;
        searchDropdown.classList.add('active');
        return;
    }
    const grouped = {};
    results.forEach((result) => {
        if (!grouped[result.category]) {
            grouped[result.category] = [];
        }
        grouped[result.category].push(result);
    });
    const categoryLabels = {
        project: 'Projects',
        software: 'Software & Tools',
        affiliate: 'Affiliates',
        section: 'Sections'
    };
    let html = '';
    for (const category of Object.keys(grouped)) {
        html += `<div class="search-category-label">${categoryLabels[category] || category}</div>`;
        grouped[category].forEach((result) => {
            const isExternal = result.url.startsWith('http');
            html += `
                <a href="${result.url}" class="search-result-item" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                    <div class="search-result-icon">
                        <i class="fas ${result.icon}"></i>
                    </div>
                    <div class="search-result-info">
                        <div class="search-result-title">${highlightMatch(result.title, query)}</div>
                        <div class="search-result-desc">${highlightMatch(result.description, query)}</div>
                    </div>
                    ${isExternal ? '<i class="fas fa-external-link-alt search-external-icon"></i>' : ''}
                </a>
            `;
        });
    }
    content.innerHTML = html;
    searchDropdown.classList.add('active');
    const resultItems = content.querySelectorAll('.search-result-item');
    resultItems.forEach((item) => {
        item.addEventListener('click', () => {
            hideSearchDropdown();
            if (searchInput)
                searchInput.value = '';
        });
    });
}
function highlightMatch(text, query) {
    if (!query)
        return escapeHtml(text);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function hideSearchDropdown() {
    searchDropdown?.classList.remove('active');
}
function performSearch(query) {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery)
        return [];
    let searchData;
    if (isDocsPage()) {
        searchData = [...getDocsSearchData(), ...getMainSearchData()];
    }
    else {
        searchData = getMainSearchData();
    }
    return searchData.filter((result) => result.title.toLowerCase().includes(normalizedQuery) ||
        result.description.toLowerCase().includes(normalizedQuery));
}
function handleLiveSearch() {
    const query = searchInput?.value.trim() || '';
    if (query.length < 1) {
        hideSearchDropdown();
        return;
    }
    const results = performSearch(query);
    const topResults = results.slice(0, 5);
    renderSearchResults(topResults, query);
}
function handleSearch() {
    const query = searchInput?.value.trim() || '';
    if (query.length === 0) {
        hideSearchDropdown();
        return;
    }
    const results = performSearch(query);
    if (results.length > 0) {
        const firstResult = results[0];
        if (firstResult.url.startsWith('http')) {
            window.open(firstResult.url, '_blank');
        }
        else if (firstResult.url.startsWith('#')) {
            const element = document.querySelector(firstResult.url);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                element.classList.add('search-highlight');
                setTimeout(() => element.classList.remove('search-highlight'), 2000);
            }
        }
        else {
            window.location.href = firstResult.url;
        }
        hideSearchDropdown();
        searchInput.value = '';
    }
    else {
        renderSearchResults([], query);
    }
}
searchButton?.addEventListener('click', handleSearch);
searchInput?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
});
searchInput?.addEventListener('input', handleLiveSearch);
document.addEventListener('click', (event) => {
    const target = event.target;
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(target)) {
        hideSearchDropdown();
    }
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        hideSearchDropdown();
        searchInput?.blur();
    }
});
searchInput?.addEventListener('keydown', (event) => {
    if (!searchDropdown?.classList.contains('active'))
        return;
    const items = searchDropdown.querySelectorAll('.search-result-item');
    const activeItem = searchDropdown.querySelector('.search-result-item.active');
    let currentIndex = Array.from(items).indexOf(activeItem);
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        currentIndex = Math.min(currentIndex + 1, items.length - 1);
        items.forEach((item, i) => item.classList.toggle('active', i === currentIndex));
        items[currentIndex]?.scrollIntoView({ block: 'nearest' });
    }
    else if (event.key === 'ArrowUp') {
        event.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        items.forEach((item, i) => item.classList.toggle('active', i === currentIndex));
        items[currentIndex]?.scrollIntoView({ block: 'nearest' });
    }
    else if (event.key === 'Enter' && activeItem) {
        event.preventDefault();
        activeItem.click();
    }
});
const logoLink = document.querySelector('.logo-link');
logoLink?.addEventListener('click', (_event) => {
    window.location.href = 'index.html';
});
const ADMIN_STORAGE_KEY = 'nerdOrGeekAdminData';
const PREVIEW_MODE_KEY = 'nerdOrGeekPreviewMode';
let cachedSiteData = null;
function isPreviewMode() {
    return localStorage.getItem(PREVIEW_MODE_KEY) === 'true';
}
async function fetchSiteData() {
    if (cachedSiteData && !isPreviewMode()) {
        return cachedSiteData;
    }
    if (isPreviewMode()) {
        const data = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (data) {
            try {
                cachedSiteData = JSON.parse(data);
                console.log('Preview Mode: Using local data');
                return cachedSiteData;
            }
            catch {
                return null;
            }
        }
    }
    try {
        const basePath = getBasePath();
        const response = await fetch(`${basePath}data/site-data.json`);
        if (response.ok) {
            cachedSiteData = await response.json();
            return cachedSiteData;
        }
    }
    catch (e) {
        console.log('Could not fetch site-data.json, falling back to localStorage');
    }
    const data = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (data) {
        try {
            cachedSiteData = JSON.parse(data);
            return cachedSiteData;
        }
        catch {
            return null;
        }
    }
    return null;
}
function getAdminData() {
    if (cachedSiteData) {
        return cachedSiteData;
    }
    const data = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (data) {
        try {
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    return null;
}
function escapeHtmlForRender(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
async function renderDynamicAffiliates() {
    const data = await fetchSiteData();
    if (!data || data.affiliates.length === 0)
        return;
    const container = document.querySelector('.affiliates-grid');
    if (!container)
        return;
    container.innerHTML = '';
    data.affiliates.forEach(affiliate => {
        const card = document.createElement('div');
        card.className = 'affiliate-card' + (affiliate.comingSoon ? ' affiliate-card-coming' : '');
        card.innerHTML = `
            <div class="affiliate-icon">
                ${affiliate.customImage
            ? `<img src="${affiliate.customImage}" alt="${escapeHtmlForRender(affiliate.name)}" style="width:40px;height:40px;object-fit:contain;">`
            : `<i class="fas ${affiliate.icon}"></i>`}
            </div>
            <h3>${escapeHtmlForRender(affiliate.name)}</h3>
            <p>${escapeHtmlForRender(affiliate.description)}</p>
            ${affiliate.comingSoon
            ? '<span class="coming-soon-badge">Coming Soon</span>'
            : `<a href="${affiliate.link}" class="app-link" target="_blank" rel="noopener noreferrer">Visit ${escapeHtmlForRender(affiliate.name)} <i class="fas fa-arrow-right"></i></a>`}
        `;
        container.appendChild(card);
    });
}
function getProjectLink(project) {
    if (project.staticUrl) {
        if (/^https?:\/\//.test(project.staticUrl)) {
            return project.staticUrl;
        }
        return `${getBasePath()}${project.staticUrl}`;
    }
    return `${getBasePath()}projects/docs.html?id=${encodeURIComponent(project.id)}`;
}
async function renderDynamicProjects() {
    const data = await fetchSiteData();
    if (!data || data.projects.length === 0)
        return;
    const containers = document.querySelectorAll('.projects-grid');
    if (containers.length === 0)
        return;
    containers.forEach(container => {
        container.innerHTML = '';
        data.projects.forEach(project => {
            const projectLink = getProjectLink(project);
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <div class="project-image-container">
                    ${project.customImage
                ? `<img src="${project.customImage}" alt="${escapeHtmlForRender(project.name)}" class="project-image">`
                : `<div class="project-icon-placeholder"><i class="fas ${project.icon}"></i></div>`}
                    ${project.badge ? `<span class="project-badge">${project.badge}</span>` : ''}
                </div>
                <div class="project-content">
                    <h3>${escapeHtmlForRender(project.name)}</h3>
                    <p>${escapeHtmlForRender(project.description)}</p>
                    ${project.tags.length > 0 ? `
                        <div class="project-tags">
                            ${project.tags.map(tag => `<span class="project-tag">${escapeHtmlForRender(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                    <a href="${projectLink}" class="cta-button"><i class="fas fa-book"></i> View Docs</a>
                </div>
            `;
            container.appendChild(card);
        });
    });
}
async function renderDynamicSoftware() {
    const data = await fetchSiteData();
    if (!data || data.software.length === 0)
        return;
    const container = document.querySelector('.apps-grid');
    if (!container)
        return;
    container.innerHTML = '';
    data.software.forEach(software => {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.innerHTML = `
            <div class="app-logo-wrap">
                ${software.customImage
            ? `<img src="${software.customImage}" alt="${escapeHtmlForRender(software.name)}" class="app-logo">`
            : `<div class="app-icon-placeholder"><i class="fas ${software.icon}"></i></div>`}
            </div>
            ${software.underDevelopment ? '<span class="app-badge app-badge-warn">Under Development</span>' : ''}
            <h3>${escapeHtmlForRender(software.name)}</h3>
            <p>${escapeHtmlForRender(software.description)}</p>
            <a href="${software.link}" class="app-link" target="_blank" rel="noopener noreferrer">View on GitHub <i class="fas fa-arrow-right"></i></a>
        `;
        container.appendChild(card);
    });
}
async function showDynamicProjectDocs(projectId) {
    const data = await fetchSiteData();
    if (!data)
        return;
    const project = data.projects.find(p => p.id === projectId);
    if (!project)
        return;
    const basePath = getBasePath();
    if (project.staticUrl) {
        if (/^https?:\/\//.test(project.staticUrl)) {
            window.location.href = project.staticUrl;
        }
        else {
            window.location.href = `${basePath}${project.staticUrl}`;
        }
    }
    else {
        window.location.href = `${basePath}projects/docs.html?id=${encodeURIComponent(projectId)}`;
    }
}
window.showDynamicProjectDocs = showDynamicProjectDocs;
function showPreviewModeBanner() {
    if (!isPreviewMode())
        return;
    if (window.location.pathname.includes('admin'))
        return;
    const banner = document.createElement('div');
    banner.id = 'previewModeBanner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(90deg, #f59e0b, #d97706);
        color: #000;
        text-align: center;
        padding: 8px 16px;
        font-weight: 600;
        font-size: 14px;
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    banner.innerHTML = `
        <span><i class="fas fa-eye"></i> Preview Mode - Showing Local Changes</span>
        <button id="disablePreviewMode" style="background:#000;color:#fff;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:12px;">
            Disable
        </button>
    `;
    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
    document.getElementById('disablePreviewMode')?.addEventListener('click', () => {
        localStorage.removeItem(PREVIEW_MODE_KEY);
        window.location.reload();
    });
}
async function init() {
    console.log('Nerd or Geek? Website Initialized');
    showPreviewModeBanner();
    await Promise.all([
        renderDynamicAffiliates(),
        renderDynamicProjects(),
        renderDynamicSoftware()
    ]);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
}
else {
    init();
}
function copyCode(button) {
    const codeBlock = button.closest('.docs-code-block');
    if (!codeBlock)
        return;
    const codeElement = codeBlock.querySelector('code');
    if (!codeElement)
        return;
    const text = codeElement.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch((err) => {
        console.error('Failed to copy:', err);
        button.textContent = 'Failed';
        setTimeout(() => {
            button.textContent = 'Copy';
        }, 2000);
    });
}
window.copyCode = copyCode;
export { toggleSidebar, closeSidebar, openSidebar, performSearch, handleSearch, handleLiveSearch, copyCode };
//# sourceMappingURL=main.js.map