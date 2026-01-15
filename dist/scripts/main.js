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
function getMainSearchData() {
    const basePath = getBasePath();
    return [
        {
            title: 'Pinecraft',
            url: `${basePath}projects/project-one.html`,
            description: 'Minecraft Java server on Raspberry Pi 4',
            category: 'project',
            icon: 'fa-cube'
        },
        {
            title: 'P4wnP1',
            url: `${basePath}projects/p4wnp1.html`,
            description: 'USB attack platform for Raspberry Pi Zero',
            category: 'project',
            icon: 'fa-usb'
        },
        {
            title: 'Photo Metadata App',
            url: 'https://github.com/michael6gledhill/Photo_Metadata_App_By_Gledhill',
            description: 'Tool to view and manage photo metadata',
            category: 'software',
            icon: 'fa-image'
        },
        {
            title: 'CyberPatriot Runbook',
            url: 'https://github.com/michael6gledhill/cyberpatriot-runbook',
            description: 'Runbook for CyberPatriot competition prep',
            category: 'software',
            icon: 'fa-shield-halved'
        },
        {
            title: 'TransportMod',
            url: 'https://github.com/Nerd-or-Geek/TransportMod',
            description: 'Transportation modification mod for games',
            category: 'software',
            icon: 'fa-car'
        },
        {
            title: 'Raspberry Pi Tips School',
            url: 'https://school.raspberrytips.com/a/v8jsr',
            description: 'Comprehensive Raspberry Pi courses and tutorials',
            category: 'affiliate',
            icon: 'fa-graduation-cap'
        },
        {
            title: 'SunFounder',
            url: 'https://www.sunfounder.com/?ref=ormqdqda',
            description: 'Electronic kits, robotics, and STEM products',
            category: 'affiliate',
            icon: 'fa-robot'
        },
        {
            title: 'Tech Explorations',
            url: 'https://techexplorations.com/pc/?ref=hbwnc9',
            description: 'Electronics, Arduino, and Raspberry Pi courses',
            category: 'affiliate',
            icon: 'fa-microchip'
        }
    ];
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
function init() {
    console.log('Nerd or Geek? Website Initialized');
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