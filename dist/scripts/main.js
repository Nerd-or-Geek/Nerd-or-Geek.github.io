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
    if (project.id === 'static-project-1') {
        return `${basePath}projects/project-one.html`;
    }
    else if (project.id === 'static-project-2') {
        return `${basePath}projects/p4wnp1.html`;
    }
    return `javascript:showDynamicProjectDocs('${project.id}')`;
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
function getAdminData() {
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
function renderDynamicAffiliates() {
    const data = getAdminData();
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
    const staticProjectPages = {
        'static-project-1': 'projects/project-one.html',
        'static-project-2': 'projects/p4wnp1.html'
    };
    if (staticProjectPages[project.id]) {
        return staticProjectPages[project.id];
    }
    return `javascript:showDynamicProjectDocs('${project.id}')`;
}
function renderDynamicProjects() {
    const data = getAdminData();
    if (!data || data.projects.length === 0)
        return;
    const containers = document.querySelectorAll('.projects-grid');
    if (containers.length === 0)
        return;
    containers.forEach(container => {
        container.innerHTML = '';
        data.projects.forEach(project => {
            const projectLink = getProjectLink(project);
            const isStaticProject = project.id.startsWith('static-project');
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
                    ${isStaticProject
                ? `<a href="${projectLink}" class="cta-button"><i class="fas fa-book"></i> Install Guide</a>`
                : `<a href="#" class="cta-button" onclick="showDynamicProjectDocs('${project.id}'); return false;"><i class="fas fa-book"></i> View Details</a>`}
                </div>
            `;
            container.appendChild(card);
        });
    });
}
function renderDynamicSoftware() {
    const data = getAdminData();
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
function showDynamicProjectDocs(projectId) {
    const data = getAdminData();
    if (!data)
        return;
    const project = data.projects.find(p => p.id === projectId);
    if (!project)
        return;
    const fullData = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!fullData)
        return;
    const parsedData = JSON.parse(fullData);
    const fullProject = parsedData.projects.find((p) => p.id === projectId);
    const overlay = document.createElement('div');
    overlay.className = 'dynamic-docs-overlay';
    overlay.innerHTML = `
        <div class="dynamic-docs-modal">
            <div class="dynamic-docs-header">
                <h2>${escapeHtmlForRender(project.name)}</h2>
                <button class="dynamic-docs-close">&times;</button>
            </div>
            <div class="dynamic-docs-content">
                <div class="docs-hero">
                    <p class="docs-subtitle">${escapeHtmlForRender(project.description)}</p>
                    <div class="docs-meta">
                        ${project.tags.map(tag => `<span class="docs-badge">${escapeHtmlForRender(tag)}</span>`).join('')}
                    </div>
                </div>
                <div class="docs-sections">
                    ${fullProject.sections && fullProject.sections.length > 0
        ? fullProject.sections.map((section) => `
                            <section class="docs-section">
                                <h3 class="docs-heading">${escapeHtmlForRender(section.title)}</h3>
                                <div class="section-content">${formatSectionContent(section)}</div>
                            </section>
                        `).join('')
        : '<p class="no-docs">No documentation available yet.</p>'}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.dynamic-docs-close')?.addEventListener('click', () => {
        overlay.remove();
        document.body.style.overflow = '';
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            document.body.style.overflow = '';
        }
    });
}
function parseMarkdown(text) {
    let html = escapeHtmlForRender(text);
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
        const language = lang || 'text';
        return `<div class="docs-code-block"><div class="code-header"><span>${language}</span><button class="copy-btn" onclick="copyCode(this)">Copy</button></div><pre><code class="language-${language}">${code.trim()}</code></pre></div>`;
    });
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    html = html.replace(/^### (.+)$/gm, '<h3 class="docs-subheading">$1</h3>');
    html = html.split(/\n\n+/).map(para => {
        if (para.startsWith('<div') || para.startsWith('<h3') || para.startsWith('<pre')) {
            return para;
        }
        return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    }).join('');
    return html;
}
function formatSectionContent(section) {
    const content = section.content || '';
    switch (section.type) {
        case 'text':
            return parseMarkdown(content);
        case 'code':
            const lang = section.codeLanguage || 'bash';
            return `
                <div class="docs-code-block">
                    <div class="code-header">
                        <span>${lang}</span>
                        <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                    </div>
                    <pre><code class="language-${lang}">${escapeHtmlForRender(content)}</code></pre>
                </div>
            `;
        case 'callout-info':
            return `
                <div class="docs-callout docs-callout-info">
                    <i class="fas fa-info-circle"></i>
                    <div>${parseMarkdown(content)}</div>
                </div>
            `;
        case 'callout-warning':
            return `
                <div class="docs-callout docs-callout-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>${parseMarkdown(content)}</div>
                </div>
            `;
        case 'callout-danger':
            return `
                <div class="docs-callout docs-callout-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>${parseMarkdown(content)}</div>
                </div>
            `;
        case 'callout-success':
            return `
                <div class="docs-callout docs-callout-success">
                    <i class="fas fa-check-circle"></i>
                    <div>${parseMarkdown(content)}</div>
                </div>
            `;
        case 'cards-2':
        case 'cards-3':
            const cards = content.split('---').map((card) => card.trim()).filter((c) => c);
            const gridClass = section.type === 'cards-2' ? 'docs-grid-2' : 'docs-grid-3';
            return `
                <div class="${gridClass}">
                    ${cards.map((card) => {
                const parts = card.split('|').map((p) => p.trim());
                const title = parts[0] || '';
                const desc = parts[1] || '';
                const code = parts[2] || '';
                return `
                            <div class="docs-card">
                                <h4>${escapeHtmlForRender(title)}</h4>
                                <p>${parseMarkdown(desc)}</p>
                                ${code ? `
                                    <div class="docs-code-block">
                                        <div class="code-header">
                                            <span>bash</span>
                                            <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                                        </div>
                                        <pre><code>${escapeHtmlForRender(code)}</code></pre>
                                    </div>
                                ` : ''}
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        case 'steps':
            const steps = content.split('---').map((s) => s.trim()).filter((s) => s);
            return `
                <div class="docs-steps">
                    ${steps.map((step, i) => `
                        <div class="docs-step">
                            <div class="step-number">${i + 1}</div>
                            <div class="step-content">${parseMarkdown(step)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        case 'list':
            const items = content.split('\n').filter((item) => item.trim());
            return `
                <ul class="docs-list">
                    ${items.map((item) => `<li>${parseMarkdown(item.trim())}</li>`).join('')}
                </ul>
            `;
        case 'video':
            let videoHtml = '';
            const youtubeMatch = content.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
            const vimeoMatch = content.match(/vimeo\.com\/(\d+)/);
            if (youtubeMatch) {
                videoHtml = `<iframe src="https://www.youtube.com/embed/${youtubeMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            }
            else if (vimeoMatch) {
                videoHtml = `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
            }
            else {
                videoHtml = `<p>Invalid video URL</p>`;
            }
            return `<div class="docs-video">${videoHtml}</div>`;
        case 'image':
            const imgParts = content.split('|').map((p) => p.trim());
            const imgSrc = imgParts[0] || '';
            const caption = imgParts[1] || '';
            const alt = imgParts[2] || caption;
            return `
                <figure class="docs-figure">
                    <img src="${escapeHtmlForRender(imgSrc)}" alt="${escapeHtmlForRender(alt)}" class="docs-image">
                    ${caption ? `<figcaption>${escapeHtmlForRender(caption)}</figcaption>` : ''}
                </figure>
            `;
        case 'links':
            const links = content.split('\n').filter((l) => l.trim());
            return `
                <div class="docs-links">
                    ${links.map((link) => {
                const linkParts = link.split('|').map((p) => p.trim());
                const text = linkParts[0] || '';
                const url = linkParts[1] || '#';
                const desc = linkParts[2] || '';
                return `
                            <a href="${escapeHtmlForRender(url)}" target="_blank" rel="noopener" class="docs-link-card">
                                <i class="fas fa-external-link-alt"></i>
                                <div>
                                    <strong>${escapeHtmlForRender(text)}</strong>
                                    ${desc ? `<span>${escapeHtmlForRender(desc)}</span>` : ''}
                                </div>
                            </a>
                        `;
            }).join('')}
                </div>
            `;
        case 'callout':
            return `
                <div class="docs-callout docs-callout-info">
                    <i class="fas fa-info-circle"></i>
                    <div>${parseMarkdown(content)}</div>
                </div>
            `;
        default:
            return parseMarkdown(content);
    }
}
window.showDynamicProjectDocs = showDynamicProjectDocs;
function init() {
    console.log('Nerd or Geek? Website Initialized');
    renderDynamicAffiliates();
    renderDynamicProjects();
    renderDynamicSoftware();
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