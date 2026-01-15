/**
 * Main TypeScript file for Nerd or Geek? website
 * Handles sidebar toggling, search functionality, and other interactive elements
 */

// ============================================
// Types
// ============================================
interface SearchResult {
    title: string;
    url: string;
    description: string;
    category: 'project' | 'software' | 'affiliate' | 'section';
    icon: string;
}

// ============================================
// DOM Elements
// ============================================
const sidebarToggleBtn = document.getElementById('sidebarToggle');
const sidebarCloseBtn = document.getElementById('sidebarClose');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const searchButton = document.getElementById('searchButton');
const navLinks = document.querySelectorAll('.nav-link');
let searchDropdown: HTMLElement | null = null;

// ============================================
// Sidebar Functions
// ============================================

/**
 * Toggle sidebar visibility
 */
function toggleSidebar(): void {
    sidebar?.classList.toggle('active');
    sidebarOverlay?.classList.toggle('active');
}

/**
 * Close sidebar
 */
function closeSidebar(): void {
    sidebar?.classList.remove('active');
    sidebarOverlay?.classList.remove('active');
}

/**
 * Open sidebar
 */
function openSidebar(): void {
    sidebar?.classList.add('active');
    sidebarOverlay?.classList.add('active');
}

// ============================================
// Event Listeners - Sidebar
// ============================================
sidebarToggleBtn?.addEventListener('click', toggleSidebar);
sidebarCloseBtn?.addEventListener('click', closeSidebar);
sidebarOverlay?.addEventListener('click', closeSidebar);

// Close sidebar when a nav link is clicked
navLinks.forEach((link) => {
    link.addEventListener('click', () => {
        closeSidebar();
    });
});

// Close sidebar on escape key
document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
        closeSidebar();
    }
});

// ============================================
// Search Functions
// ============================================

/**
 * Detect if we're on a documentation page
 */
function isDocsPage(): boolean {
    return window.location.pathname.includes('/projects/') || 
           document.querySelector('.docs-wrapper') !== null;
}

/**
 * Get the base path for URLs based on current page location
 */
function getBasePath(): string {
    if (window.location.pathname.includes('/projects/')) {
        return '../';
    }
    return '';
}

/**
 * Get project link - all dynamic projects use the docs.html page
 */
function getProjectLinkForSearch(project: any): string {
    const basePath = getBasePath();
    // All projects now use the dynamic docs page
    return `${basePath}projects/docs.html?id=${encodeURIComponent(project.id)}`;
}

/**
 * Get main site search data (projects, software, affiliates)
 * All data now comes from admin portal storage (seeded with defaults on first visit)
 */
function getMainSearchData(): SearchResult[] {
    const results: SearchResult[] = [];
    
    // Get all content from admin portal data
    const adminData = getAdminData();
    if (adminData) {
        // Add projects
        adminData.projects.forEach(project => {
            results.push({
                title: project.name,
                url: getProjectLinkForSearch(project),
                description: project.description,
                category: 'project',
                icon: project.icon === 'custom' ? 'fa-folder' : project.icon
            });
        });
        
        // Add software
        adminData.software.forEach(sw => {
            results.push({
                title: sw.name,
                url: sw.link,
                description: sw.description,
                category: 'software',
                icon: sw.icon === 'custom' ? 'fa-code' : sw.icon
            });
        });
        
        // Add affiliates (excluding coming soon)
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

/**
 * Get documentation page sections for search
 */
function getDocsSearchData(): SearchResult[] {
    const sections: SearchResult[] = [];
    const docsSections = document.querySelectorAll('.docs-section');
    
    docsSections.forEach((section) => {
        const id = section.getAttribute('id');
        const heading = section.querySelector('.docs-heading, h2');
        const headingText = heading?.textContent || id || 'Section';
        
        // Get first paragraph as description
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
        
        // Also index cards within sections
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

/**
 * Create and show search dropdown
 */
function createSearchDropdown(): HTMLElement {
    // Remove existing dropdown if any
    const existing = document.querySelector('.search-dropdown');
    if (existing) existing.remove();
    
    const dropdown = document.createElement('div');
    dropdown.className = 'search-dropdown';
    dropdown.innerHTML = '<div class="search-dropdown-content"></div>';
    
    // Position relative to search container
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        searchContainer.appendChild(dropdown);
    }
    
    return dropdown;
}

/**
 * Render search results in dropdown
 */
function renderSearchResults(results: SearchResult[], query: string): void {
    if (!searchDropdown) {
        searchDropdown = createSearchDropdown();
    }
    
    const content = searchDropdown.querySelector('.search-dropdown-content');
    if (!content) return;
    
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
    
    // Group results by category
    const grouped: { [key: string]: SearchResult[] } = {};
    results.forEach((result) => {
        if (!grouped[result.category]) {
            grouped[result.category] = [];
        }
        grouped[result.category].push(result);
    });
    
    const categoryLabels: { [key: string]: string } = {
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
    
    // Add click handlers to close dropdown after selection
    const resultItems = content.querySelectorAll('.search-result-item');
    resultItems.forEach((item) => {
        item.addEventListener('click', () => {
            hideSearchDropdown();
            if (searchInput) searchInput.value = '';
        });
    });
}

/**
 * Highlight matching text in search results
 */
function highlightMatch(text: string, query: string): string {
    if (!query) return escapeHtml(text);
    
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Hide search dropdown
 */
function hideSearchDropdown(): void {
    searchDropdown?.classList.remove('active');
}

/**
 * Perform search with query
 */
function performSearch(query: string): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return [];
    
    // Get appropriate search data based on page type
    let searchData: SearchResult[];
    
    if (isDocsPage()) {
        // On docs pages, search both sections AND main site content
        searchData = [...getDocsSearchData(), ...getMainSearchData()];
    } else {
        // On main pages, just search main content
        searchData = getMainSearchData();
    }
    
    // Filter results
    return searchData.filter((result) => 
        result.title.toLowerCase().includes(normalizedQuery) ||
        result.description.toLowerCase().includes(normalizedQuery)
    );
}

/**
 * Handle live search as user types
 */
function handleLiveSearch(): void {
    const query = searchInput?.value.trim() || '';
    
    // Show results after first character
    if (query.length < 1) {
        hideSearchDropdown();
        return;
    }
    
    const results = performSearch(query);
    // Limit to top 5 results
    const topResults = results.slice(0, 5);
    renderSearchResults(topResults, query);
}

/**
 * Handle search submission (Enter key or button click)
 */
function handleSearch(): void {
    const query = searchInput?.value.trim() || '';
    
    if (query.length === 0) {
        hideSearchDropdown();
        return;
    }
    
    const results = performSearch(query);
    
    if (results.length > 0) {
        // Navigate to first result
        const firstResult = results[0];
        if (firstResult.url.startsWith('http')) {
            window.open(firstResult.url, '_blank');
        } else if (firstResult.url.startsWith('#')) {
            // Scroll to section
            const element = document.querySelector(firstResult.url);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                // Highlight the section briefly
                element.classList.add('search-highlight');
                setTimeout(() => element.classList.remove('search-highlight'), 2000);
            }
        } else {
            window.location.href = firstResult.url;
        }
        hideSearchDropdown();
        searchInput.value = '';
    } else {
        renderSearchResults([], query);
    }
}

// ============================================
// Event Listeners - Search
// ============================================
searchButton?.addEventListener('click', handleSearch);

searchInput?.addEventListener('keypress', (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

// Live search as user types
searchInput?.addEventListener('input', handleLiveSearch);

// Close dropdown when clicking outside
document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(target)) {
        hideSearchDropdown();
    }
});

// Close dropdown on escape
document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
        hideSearchDropdown();
        searchInput?.blur();
    }
});

// Keyboard navigation in search results
searchInput?.addEventListener('keydown', (event: KeyboardEvent) => {
    if (!searchDropdown?.classList.contains('active')) return;
    
    const items = searchDropdown.querySelectorAll('.search-result-item');
    const activeItem = searchDropdown.querySelector('.search-result-item.active');
    let currentIndex = Array.from(items).indexOf(activeItem as Element);
    
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        currentIndex = Math.min(currentIndex + 1, items.length - 1);
        items.forEach((item, i) => item.classList.toggle('active', i === currentIndex));
        items[currentIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        items.forEach((item, i) => item.classList.toggle('active', i === currentIndex));
        items[currentIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && activeItem) {
        event.preventDefault();
        (activeItem as HTMLAnchorElement).click();
    }
});

// ============================================
// Logo Link Handler
// ============================================
const logoLink = document.querySelector('.logo-link');
logoLink?.addEventListener('click', (_event: Event) => {
    // Navigate to homepage
    window.location.href = 'index.html';
});

// ============================================
// Dynamic Content from Admin Portal
// ============================================

interface AdminAffiliate {
    id: string;
    name: string;
    description: string;
    link: string;
    icon: string;
    customImage?: string;
    comingSoon: boolean;
}

interface AdminProject {
    id: string;
    name: string;
    description: string;
    badge: string;
    tags: string[];
    icon: string;
    customImage?: string;
}

interface AdminSoftware {
    id: string;
    name: string;
    description: string;
    link: string;
    icon: string;
    customImage?: string;
    underDevelopment: boolean;
}

interface AdminData {
    affiliates: AdminAffiliate[];
    projects: AdminProject[];
    software: AdminSoftware[];
}

const ADMIN_STORAGE_KEY = 'nerdOrGeekAdminData';
const PREVIEW_MODE_KEY = 'nerdOrGeekPreviewMode';

// Cache for site data to avoid multiple fetches
let cachedSiteData: AdminData | null = null;

/**
 * Check if preview mode is enabled (set in admin portal)
 */
function isPreviewMode(): boolean {
    return localStorage.getItem(PREVIEW_MODE_KEY) === 'true';
}

/**
 * Get admin data - first tries to fetch from static JSON, falls back to localStorage
 * If preview mode is ON, uses localStorage directly to show local changes
 */
async function fetchSiteData(): Promise<AdminData | null> {
    // Return cached data if available (and not in preview mode)
    if (cachedSiteData && !isPreviewMode()) {
        return cachedSiteData;
    }
    
    // If preview mode is enabled, use localStorage directly
    if (isPreviewMode()) {
        const data = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (data) {
            try {
                cachedSiteData = JSON.parse(data);
                console.log('Preview Mode: Using local data');
                return cachedSiteData;
            } catch {
                return null;
            }
        }
    }
    
    // Try to fetch from static JSON file (works on GitHub Pages)
    try {
        const basePath = getBasePath();
        const response = await fetch(`${basePath}data/site-data.json`);
        if (response.ok) {
            cachedSiteData = await response.json();
            return cachedSiteData;
        }
    } catch (e) {
        console.log('Could not fetch site-data.json, falling back to localStorage');
    }
    
    // Fallback to localStorage for local development
    const data = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (data) {
        try {
            cachedSiteData = JSON.parse(data);
            return cachedSiteData;
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Synchronous getter for admin data (for search - uses cached data)
 */
function getAdminData(): AdminData | null {
    // First check cache
    if (cachedSiteData) {
        return cachedSiteData;
    }
    // Fallback to localStorage for immediate access
    const data = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (data) {
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }
    return null;
}

function escapeHtmlForRender(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Render dynamic affiliates from admin portal
 */
async function renderDynamicAffiliates(): Promise<void> {
    const data = await fetchSiteData();
    if (!data || data.affiliates.length === 0) return;
    
    const container = document.querySelector('.affiliates-grid');
    if (!container) return;
    
    // Clear existing static content and replace with admin data
    container.innerHTML = '';
    
    data.affiliates.forEach(affiliate => {
        const card = document.createElement('div');
        card.className = 'affiliate-card' + (affiliate.comingSoon ? ' affiliate-card-coming' : '');
        card.innerHTML = `
            <div class="affiliate-icon">
                ${affiliate.customImage 
                    ? `<img src="${affiliate.customImage}" alt="${escapeHtmlForRender(affiliate.name)}" style="width:40px;height:40px;object-fit:contain;">`
                    : `<i class="fas ${affiliate.icon}"></i>`
                }
            </div>
            <h3>${escapeHtmlForRender(affiliate.name)}</h3>
            <p>${escapeHtmlForRender(affiliate.description)}</p>
            ${affiliate.comingSoon 
                ? '<span class="coming-soon-badge">Coming Soon</span>'
                : `<a href="${affiliate.link}" class="app-link" target="_blank" rel="noopener noreferrer">Visit ${escapeHtmlForRender(affiliate.name)} <i class="fas fa-arrow-right"></i></a>`
            }
        `;
        container.appendChild(card);
    });
}

/**
 * Get the correct link for a project - all projects use dynamic docs page
 */
function getProjectLink(project: AdminProject): string {
    // All projects now use the dynamic docs page
    return `projects/docs.html?id=${encodeURIComponent(project.id)}`;
}

/**
 * Render dynamic projects from admin portal
 */
async function renderDynamicProjects(): Promise<void> {
    const data = await fetchSiteData();
    if (!data || data.projects.length === 0) return;
    
    // Find project grids on the page
    const containers = document.querySelectorAll('.projects-grid');
    if (containers.length === 0) return;
    
    // Update all project grids on the page
    containers.forEach(container => {
        // Clear existing static content and replace with admin data
        container.innerHTML = '';
        
        data.projects.forEach(project => {
            const projectLink = getProjectLink(project);
            
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <div class="project-image-container">
                    ${project.customImage 
                        ? `<img src="${project.customImage}" alt="${escapeHtmlForRender(project.name)}" class="project-image">`
                        : `<div class="project-icon-placeholder"><i class="fas ${project.icon}"></i></div>`
                    }
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

/**
 * Render dynamic software from admin portal
 */
async function renderDynamicSoftware(): Promise<void> {
    const data = await fetchSiteData();
    if (!data || data.software.length === 0) return;
    
    const container = document.querySelector('.apps-grid');
    if (!container) return;
    
    // Clear existing static content and replace with admin data
    container.innerHTML = '';
    
    data.software.forEach(software => {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.innerHTML = `
            <div class="app-logo-wrap">
                ${software.customImage 
                    ? `<img src="${software.customImage}" alt="${escapeHtmlForRender(software.name)}" class="app-logo">`
                    : `<div class="app-icon-placeholder"><i class="fas ${software.icon}"></i></div>`
                }
            </div>
            ${software.underDevelopment ? '<span class="app-badge app-badge-warn">Under Development</span>' : ''}
            <h3>${escapeHtmlForRender(software.name)}</h3>
            <p>${escapeHtmlForRender(software.description)}</p>
            <a href="${software.link}" class="app-link" target="_blank" rel="noopener noreferrer">View on GitHub <i class="fas fa-arrow-right"></i></a>
        `;
        container.appendChild(card);
    });
}

/**
 * Navigate to dynamic project documentation page
 */
function showDynamicProjectDocs(projectId: string): void {
    const data = getAdminData();
    if (!data) return;
    
    const project = data.projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Navigate to the dynamic documentation page
    const basePath = getBasePath();
    window.location.href = `${basePath}projects/docs.html?id=${encodeURIComponent(projectId)}`;
}

// Make showDynamicProjectDocs available globally
(window as any).showDynamicProjectDocs = showDynamicProjectDocs;

/**
 * Show preview mode banner if enabled
 */
function showPreviewModeBanner(): void {
    if (!isPreviewMode()) return;
    
    // Don't show on admin page
    if (window.location.pathname.includes('admin')) return;
    
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
    
    // Add padding to body to account for banner
    document.body.style.paddingTop = '40px';
    
    // Handle disable button
    document.getElementById('disablePreviewMode')?.addEventListener('click', () => {
        localStorage.removeItem(PREVIEW_MODE_KEY);
        window.location.reload();
    });
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
async function init(): Promise<void> {
    console.log('Nerd or Geek? Website Initialized');
    
    // Show preview mode banner if enabled
    showPreviewModeBanner();

    // Load dynamic content from site data (fetches from JSON file)
    await Promise.all([
        renderDynamicAffiliates(),
        renderDynamicProjects(),
        renderDynamicSoftware()
    ]);
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ============================================
// Copy Code Function (for documentation pages)
// ============================================

/**
 * Copy code block content to clipboard
 */
function copyCode(button: HTMLButtonElement): void {
    const codeBlock = button.closest('.docs-code-block');
    if (!codeBlock) return;

    const codeElement = codeBlock.querySelector('code');
    if (!codeElement) return;

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

// Make copyCode available globally for onclick handlers
(window as unknown as { copyCode: typeof copyCode }).copyCode = copyCode;

// ============================================
// Export for module usage
// ============================================
export { toggleSidebar, closeSidebar, openSidebar, performSearch, handleSearch, handleLiveSearch, copyCode };
