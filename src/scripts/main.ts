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
 * Get main site search data (projects, software, affiliates)
 */
function getMainSearchData(): SearchResult[] {
    const basePath = getBasePath();
    return [
        // Projects
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
        // Software
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
        // Affiliates
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
// Initialization
// ============================================

/**
 * Initialize the application
 */
function init(): void {
    console.log('Nerd or Geek? Website Initialized');

    // Set up any additional initialization here
    // Examples:
    // - Load user preferences from localStorage
    // - Initialize analytics
    // - Fetch initial data from API
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
