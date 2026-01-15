"use strict";
const ADMIN_PASSWORD_HASH = 'adf3862f5831cccd16da7b4b9a5ac73365270622e97e30782bf24db0161e7f68';
const AUTH_KEY = 'nerdOrGeekAdminAuth';
const AUTH_EXPIRY_HOURS = 24;
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
function isAuthenticated() {
    const auth = localStorage.getItem(AUTH_KEY);
    if (!auth)
        return false;
    try {
        const authData = JSON.parse(auth);
        const now = Date.now();
        if (authData.expiry && authData.expiry > now) {
            return true;
        }
        localStorage.removeItem(AUTH_KEY);
        return false;
    }
    catch {
        return false;
    }
}
function setAuthenticated() {
    const expiry = Date.now() + (AUTH_EXPIRY_HOURS * 60 * 60 * 1000);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ authenticated: true, expiry }));
}
function logout() {
    localStorage.removeItem(AUTH_KEY);
    showLoginOverlay();
}
async function attemptLogin(password) {
    const hash = await hashPassword(password);
    if (hash === ADMIN_PASSWORD_HASH) {
        setAuthenticated();
        return true;
    }
    return false;
}
function showLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    const adminMain = document.querySelector('.admin-main');
    if (overlay)
        overlay.style.display = 'flex';
    if (adminMain)
        adminMain.style.display = 'none';
}
function hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    const adminMain = document.querySelector('.admin-main');
    if (overlay)
        overlay.style.display = 'none';
    if (adminMain)
        adminMain.style.display = 'block';
}
function setupLoginHandler() {
    const loginForm = document.getElementById('adminLoginForm');
    const passwordInput = document.getElementById('adminPassword');
    const loginError = document.getElementById('loginError');
    if (loginForm && passwordInput) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = passwordInput.value;
            if (await attemptLogin(password)) {
                hideLoginOverlay();
                initializeAdminPortal();
                passwordInput.value = '';
                if (loginError)
                    loginError.style.display = 'none';
            }
            else {
                if (loginError) {
                    loginError.textContent = 'Incorrect password. Please try again.';
                    loginError.style.display = 'block';
                }
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}
const STORAGE_KEY = 'nerdOrGeekAdminData';
const DEFAULT_AFFILIATES = [
    {
        id: 'static-affiliate-1',
        name: 'Raspberry Pi Tips School',
        description: 'Learn everything about Raspberry Pi with comprehensive courses and tutorials. Perfect for beginners and advanced users!',
        link: 'https://school.raspberrytips.com/a/v8jsr',
        icon: 'fa-graduation-cap',
        comingSoon: false,
        createdAt: Date.now()
    },
    {
        id: 'static-affiliate-2',
        name: 'SunFounder',
        description: 'Explore innovative electronic kits, robotics, and educational STEM products for makers and hobbyists of all levels.',
        link: 'https://www.sunfounder.com/?ref=ormqdqda',
        icon: 'fa-robot',
        comingSoon: false,
        createdAt: Date.now()
    },
    {
        id: 'static-affiliate-3',
        name: 'Tech Explorations',
        description: 'Learn electronics, Arduino, Raspberry Pi, and practical engineering through hands-on courses.',
        link: 'https://techexplorations.com/pc/?ref=hbwnc9',
        icon: 'fa-microchip',
        comingSoon: false,
        createdAt: Date.now()
    },
    {
        id: 'static-affiliate-4',
        name: 'eBay Shop',
        description: 'Coming soon: my eBay store with affordable Raspberry Pis, respeaker hats, speakers, and Pi-ready accessories.',
        link: '',
        icon: 'fa-store',
        comingSoon: true,
        createdAt: Date.now()
    }
];
const DEFAULT_PROJECTS = [
    {
        id: 'static-project-1',
        name: 'Pinecraft',
        description: 'Step-by-step guide to install and run a Minecraft Java server on Raspberry Pi 4.',
        badge: 'Popular',
        tags: ['Raspberry Pi', 'Minecraft'],
        icon: 'fa-cube',
        customImage: 'assets/img/projects/Pinecraft.png',
        sections: [
            {
                id: 'sec-1',
                title: 'Overview',
                type: 'text',
                content: 'Pinecraft is a lightweight Minecraft Java server distribution for Raspberry Pi 4, featuring the Paper server implementation optimized for resource-constrained environments.',
                codeLanguage: '',
                order: 0
            },
            {
                id: 'sec-2',
                title: 'Requirements',
                type: 'cards-2',
                content: `Required Hardware|**Raspberry Pi 4** (4GB or 8GB RAM), MicroSD card (32GB+ Class 10/UHS-1), Official Raspberry Pi power supply (3A USB-C), Ethernet cable or reliable WiFi, Computer for setup (Windows, macOS, Linux)
---
Optional Hardware|Heatsink and fan for cooling, External SSD for improved performance, Case with ventilation`,
                codeLanguage: '',
                order: 1
            },
            {
                id: 'sec-3',
                title: 'Installation',
                type: 'steps',
                content: `**Download Raspberry Pi Imager** - Get the official Raspberry Pi Imager from [raspberrypi.com/software](https://www.raspberrypi.com/software/)
---
**Flash OS** - Use the Imager to flash Raspberry Pi OS Lite (64-bit) to your MicroSD card. In settings, enable SSH, set hostname, username/password, and WiFi if needed.
---
**Expand Filesystem** - Run \`sudo raspi-config\` and select: Advanced Options → Expand Filesystem
---
**Update System** - Run \`sudo apt update && sudo apt upgrade -y\`
---
**Install Git** - Run \`sudo apt install git -y\`
---
**Clone Repository** - Run \`git clone https://github.com/cat5TV/pinecraft.git\`
---
**Run Installer** - Run \`cd pinecraft && sudo ./install.sh\`
---
**Verify Status** - Run \`/etc/init.d/pinecraft status\` to confirm the server is running`,
                codeLanguage: '',
                order: 2
            },
            {
                id: 'sec-4',
                title: 'Server Management',
                type: 'cards-3',
                content: `Start Server|Launch the Minecraft server process|~/minecraft/server
---
Stop Server|Gracefully shut down the server|/etc/init.d/pinecraft stop
---
Restart Server|Stop and restart the server process|~/minecraft/restart
---
Check Status|Verify if the server is currently running|/etc/init.d/pinecraft status
---
View Logs|Monitor server output in real-time|tail -f /var/log/pinecraft.log`,
                codeLanguage: '',
                order: 3
            },
            {
                id: 'sec-5',
                title: 'Customization',
                type: 'cards-3',
                content: `Update Paper|Download the latest Paper build from [PaperMC](https://papermc.io/downloads) for performance and security updates. Replace \`Minecraft.jar\` in the server directory and restart.
---
Install Plugins|Add Paper-compatible plugins to extend server functionality. Place JAR files in the \`plugins/\` directory. Restart the server to apply. [Browse PaperMC Plugins](https://papermc.io/)
---
Add Custom World|Import pre-built or existing Minecraft worlds into your server. Copy world folder to server directory. Edit \`server.properties\` and set \`level-name\` to match.`,
                codeLanguage: '',
                order: 4
            },
            {
                id: 'sec-6',
                title: 'Networking',
                type: 'cards-3',
                content: `Get Local IP|Find your Pi's local IP address for LAN connections|hostname -I
---
Local Connection|Connect from the same network using your Pi's local IP. In Minecraft Java Edition: Multiplayer → Direct Connect → Enter local IP.
---
Get External IP|Find your public IP for remote player connections|curl ifconfig.me
---
Port Forwarding|Enable remote access by forwarding TCP port \`25565\` to your Pi's local IP address in your router admin panel.
---
Remote Connection|Players outside your network connect using your external IP. Share your external IP and players enter it in Direct Connect.
---
Security Tip|Protect your server from unauthorized access. Enable whitelist in \`server.properties\`: set \`white-list=true\` and add trusted players.`,
                codeLanguage: '',
                order: 5
            },
            {
                id: 'sec-7',
                title: 'Troubleshooting',
                type: 'cards-3',
                content: `Server Won't Start|Check logs for startup errors and diagnostics|tail -f /var/log/pinecraft.log
---
Connection Issues|Verify server is running and network is properly configured. LAN: Confirm same network. Remote: Check port 25565 is forwarded to Pi's local IP.
---
Check Disk Space|Low storage can cause crashes and world corruption|df -h
---
Performance Issues|Reduce server load for smoother gameplay. Lower \`view-distance\` in \`server.properties\`. Limit max players. Use Paper for optimizations.
---
Java Errors|Ensure correct Java version is installed|java -version
---
Get Help|Community support for advanced issues. Visit [Pinecraft GitHub Issues](https://github.com/cat5TV/pinecraft/issues)`,
                codeLanguage: '',
                order: 6
            }
        ],
        createdAt: Date.now()
    },
    {
        id: 'static-project-2',
        name: 'P4wnP1',
        description: 'Highly customizable USB attack platform for Raspberry Pi Zero and Zero W.',
        badge: 'Security',
        tags: ['Pi Zero', 'Security'],
        icon: 'fa-usb',
        customImage: 'assets/img/projects/p4wnp1.png',
        sections: [
            {
                id: 'p4-sec-1',
                title: 'Overview',
                type: 'text',
                content: 'P4wnP1 is an open-source, highly customizable USB attack platform for the Raspberry Pi Zero and Zero W. It enables HID attacks, network attacks, and more, all from a tiny, affordable device.\n\n[View the official GitHub repository](https://github.com/RoganDawes/P4wnP1)',
                codeLanguage: '',
                order: 0
            },
            {
                id: 'p4-sec-2',
                title: 'Estimated Time',
                type: 'callout-info',
                content: '**15–30 minutes** (including downloads and flashing)',
                codeLanguage: '',
                order: 1
            },
            {
                id: 'p4-sec-3',
                title: 'Prerequisites',
                type: 'cards-2',
                content: `Required Hardware|Raspberry Pi Zero or Zero W, MicroSD card (8GB+ recommended), Micro USB cable (data & power capable), Computer (Windows, macOS, or Linux)
---
Optional Hardware|USB OTG adapter for additional devices, Compact case for portability`,
                codeLanguage: '',
                order: 2
            },
            {
                id: 'p4-sec-4',
                title: 'Installation Guide',
                type: 'steps',
                content: `**Download Image** - Get the latest P4wnP1 A.L.O.A. image from [GitHub Releases](https://github.com/RoganDawes/P4wnP1/releases)
---
**Flash to SD Card** - Use balenaEtcher to write the image to your microSD card. [Get balenaEtcher](https://www.balena.io/etcher/)
---
**Insert & Connect** - Insert the SD card into Pi Zero. Connect via USB data port (not power-only).
---
**Wait for Boot** - The Pi will boot and appear as a network/HID device on your computer.
---
**Login** - Default credentials: Username: \`pi\`, Password: \`raspberry\`
---
**Access Web UI** - Open browser and navigate to the P4wnP1 web interface for configuration.`,
                codeLanguage: '',
                order: 3
            },
            {
                id: 'p4-sec-5',
                title: 'Resources',
                type: 'links',
                content: `GitHub Repo|https://github.com/RoganDawes/P4wnP1|Source code, issues, and releases
Wiki & Docs|https://github.com/RoganDawes/P4wnP1/wiki|Payloads, customizations, and advanced features
balenaEtcher|https://www.balena.io/etcher/|Cross-platform SD card flasher tool`,
                codeLanguage: '',
                order: 4
            }
        ],
        createdAt: Date.now()
    }
];
const DEFAULT_SOFTWARE = [
    {
        id: 'static-software-1',
        name: 'Photo Metadata App',
        description: 'A clean, self-built tool to view and manage photo metadata quickly. Built by me from scratch.',
        link: 'https://github.com/michael6gledhill/Photo_Metadata_App_By_Gledhill',
        icon: 'fa-image',
        customImage: 'assets/img/projects/photo-metadata.png',
        underDevelopment: false,
        createdAt: Date.now()
    },
    {
        id: 'static-software-2',
        name: 'CyberPatriot Runbook',
        description: 'A practical runbook for CyberPatriot prep with checklists and steps to streamline competition readiness.',
        link: 'https://github.com/michael6gledhill/cyberpatriot-runbook',
        icon: 'fa-shield-halved',
        customImage: 'assets/img/projects/cyberpatriot.png',
        underDevelopment: true,
        createdAt: Date.now()
    },
    {
        id: 'static-software-3',
        name: 'TransportMod',
        description: 'A comprehensive transportation modification mod for enhanced game mechanics.',
        link: 'https://github.com/Nerd-or-Geek/TransportMod',
        icon: 'fa-car',
        customImage: 'assets/img/projects/TransportMod.png',
        underDevelopment: true,
        createdAt: Date.now()
    }
];
function getAdminData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        const parsed = JSON.parse(data);
        if (parsed.initialized) {
            return parsed;
        }
    }
    return initializeDefaultData();
}
function initializeDefaultData() {
    const data = {
        affiliates: [...DEFAULT_AFFILIATES],
        projects: [...DEFAULT_PROJECTS],
        software: [...DEFAULT_SOFTWARE],
        initialized: true
    };
    saveAdminData(data);
    return data;
}
function saveAdminData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.toggle('error', isError);
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }
}
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal?.classList.add('active');
}
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal?.classList.remove('active');
}
function setupModalCloseHandlers() {
    document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId) {
                closeModal(modalId);
            }
        });
    });
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}
function setupIconSelectors() {
    document.querySelectorAll('.icon-options').forEach(container => {
        container.querySelectorAll('.icon-option').forEach(option => {
            option.addEventListener('click', () => {
                container.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                const icon = option.getAttribute('data-icon');
                const hiddenInput = container.closest('.icon-selector')?.parentElement?.querySelector('input[type="hidden"]');
                if (hiddenInput && icon) {
                    hiddenInput.value = icon;
                }
                const customInput = container.closest('.icon-selector')?.querySelector('input[type="text"]');
                if (customInput) {
                    customInput.value = '';
                }
            });
        });
    });
    document.querySelectorAll('.custom-icon-input input').forEach(input => {
        input.addEventListener('input', () => {
            const container = input.closest('.icon-selector');
            if (container) {
                container.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('active'));
            }
        });
    });
}
function setupNavigation() {
    const navBtns = document.querySelectorAll('.admin-nav-btn');
    const sections = document.querySelectorAll('.admin-section');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.getAttribute('data-section');
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sections.forEach(section => {
                section.classList.toggle('active', section.id === `section-${sectionId}`);
            });
        });
    });
}
function renderAffiliates() {
    const container = document.getElementById('affiliatesList');
    if (!container)
        return;
    const data = getAdminData();
    if (data.affiliates.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-handshake"></i>
                <h4>No Affiliates Yet</h4>
                <p>Click "Add Affiliate" to create your first affiliate partner.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = data.affiliates.map(affiliate => `
        <div class="item-card" data-id="${affiliate.id}">
            <div class="item-card-header">
                <div class="item-icon">
                    ${affiliate.customImage
        ? `<img src="${affiliate.customImage}" alt="${affiliate.name}">`
        : `<i class="fas ${affiliate.icon}"></i>`}
                </div>
                <div class="item-info">
                    <h4>
                        ${escapeHtml(affiliate.name)}
                        ${affiliate.comingSoon ? '<span class="item-badge coming-soon">Coming Soon</span>' : ''}
                    </h4>
                    <p>${escapeHtml(affiliate.description)}</p>
                </div>
            </div>
            <div class="item-actions">
                <button class="item-action-btn edit-btn" data-id="${affiliate.id}" data-type="affiliate">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="item-action-btn delete-btn" data-id="${affiliate.id}" data-type="affiliate">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
    setupItemActions();
}
function openAffiliateModal(affiliate) {
    const modal = document.getElementById('affiliateModal');
    const title = document.getElementById('affiliateModalTitle');
    const form = document.getElementById('affiliateForm');
    if (!modal || !title || !form)
        return;
    form.reset();
    const iconOptions = modal.querySelectorAll('.icon-option');
    iconOptions.forEach(opt => opt.classList.remove('active'));
    iconOptions[0]?.classList.add('active');
    if (affiliate) {
        title.textContent = 'Edit Affiliate';
        document.getElementById('affiliateId').value = affiliate.id;
        document.getElementById('affiliateName').value = affiliate.name;
        document.getElementById('affiliateDescription').value = affiliate.description;
        document.getElementById('affiliateLink').value = affiliate.link;
        document.getElementById('affiliateIcon').value = affiliate.icon;
        document.getElementById('affiliateComingSoon').checked = affiliate.comingSoon;
        if (affiliate.customImage) {
            document.getElementById('affiliateCustomIcon').value = affiliate.customImage;
            iconOptions.forEach(opt => opt.classList.remove('active'));
        }
        else {
            const iconOpt = modal.querySelector(`[data-icon="${affiliate.icon}"]`);
            if (iconOpt) {
                iconOptions.forEach(opt => opt.classList.remove('active'));
                iconOpt.classList.add('active');
            }
        }
    }
    else {
        title.textContent = 'Add Affiliate';
        document.getElementById('affiliateId').value = '';
        document.getElementById('affiliateIcon').value = 'fa-graduation-cap';
    }
    openModal('affiliateModal');
}
function saveAffiliate(e) {
    e.preventDefault();
    const id = document.getElementById('affiliateId').value;
    const name = document.getElementById('affiliateName').value.trim();
    const description = document.getElementById('affiliateDescription').value.trim();
    const link = document.getElementById('affiliateLink').value.trim();
    const icon = document.getElementById('affiliateIcon').value;
    const customIcon = document.getElementById('affiliateCustomIcon').value.trim();
    const comingSoon = document.getElementById('affiliateComingSoon').checked;
    const data = getAdminData();
    const affiliate = {
        id: id || generateId(),
        name,
        description,
        link,
        icon: customIcon ? 'custom' : icon,
        customImage: customIcon || undefined,
        comingSoon,
        createdAt: id ? (data.affiliates.find(a => a.id === id)?.createdAt || Date.now()) : Date.now()
    };
    if (id) {
        const index = data.affiliates.findIndex(a => a.id === id);
        if (index !== -1) {
            data.affiliates[index] = affiliate;
        }
    }
    else {
        data.affiliates.push(affiliate);
    }
    saveAdminData(data);
    closeModal('affiliateModal');
    renderAffiliates();
    showToast(id ? 'Affiliate updated!' : 'Affiliate added!');
}
function renderProjects() {
    const container = document.getElementById('projectsList');
    if (!container)
        return;
    const data = getAdminData();
    if (data.projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h4>No Projects Yet</h4>
                <p>Click "Add Project" to create your first project.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = data.projects.map(project => `
        <div class="item-card" data-id="${project.id}">
            <div class="item-card-header">
                <div class="item-icon">
                    ${project.customImage
        ? `<img src="${project.customImage}" alt="${project.name}">`
        : `<i class="fas ${project.icon}"></i>`}
                </div>
                <div class="item-info">
                    <h4>
                        ${escapeHtml(project.name)}
                        ${project.badge ? `<span class="item-badge">${project.badge}</span>` : ''}
                    </h4>
                    <p>${escapeHtml(project.description)}</p>
                </div>
            </div>
            ${project.tags.length > 0 ? `
                <div class="item-tags">
                    ${project.tags.map(tag => `<span class="item-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="item-actions">
                <button class="item-action-btn edit-btn" data-id="${project.id}" data-type="project">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="item-action-btn docs-btn" data-id="${project.id}" data-type="project">
                    <i class="fas fa-file-alt"></i> Docs
                </button>
                <button class="item-action-btn delete-btn" data-id="${project.id}" data-type="project">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    setupItemActions();
}
function openProjectModal(project) {
    const modal = document.getElementById('projectModal');
    const title = document.getElementById('projectModalTitle');
    const form = document.getElementById('projectForm');
    if (!modal || !title || !form)
        return;
    form.reset();
    const iconOptions = modal.querySelectorAll('.icon-option');
    iconOptions.forEach(opt => opt.classList.remove('active'));
    iconOptions[0]?.classList.add('active');
    if (project) {
        title.textContent = 'Edit Project';
        document.getElementById('projectId').value = project.id;
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectDescription').value = project.description;
        document.getElementById('projectBadge').value = project.badge;
        document.getElementById('projectTags').value = project.tags.join(', ');
        document.getElementById('projectIcon').value = project.icon;
        if (project.customImage) {
            document.getElementById('projectCustomImage').value = project.customImage;
            iconOptions.forEach(opt => opt.classList.remove('active'));
        }
        else {
            const iconOpt = modal.querySelector(`[data-icon="${project.icon}"]`);
            if (iconOpt) {
                iconOptions.forEach(opt => opt.classList.remove('active'));
                iconOpt.classList.add('active');
            }
        }
    }
    else {
        title.textContent = 'Add Project';
        document.getElementById('projectId').value = '';
        document.getElementById('projectIcon').value = 'fa-cube';
    }
    openModal('projectModal');
}
function saveProject(e) {
    e.preventDefault();
    const id = document.getElementById('projectId').value;
    const name = document.getElementById('projectName').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    const badge = document.getElementById('projectBadge').value;
    const tagsStr = document.getElementById('projectTags').value;
    const icon = document.getElementById('projectIcon').value;
    const customImage = document.getElementById('projectCustomImage').value.trim();
    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
    const data = getAdminData();
    const existingProject = data.projects.find(p => p.id === id);
    const project = {
        id: id || generateId(),
        name,
        description,
        badge,
        tags,
        icon: customImage ? 'custom' : icon,
        customImage: customImage || undefined,
        sections: existingProject?.sections || [],
        createdAt: existingProject?.createdAt || Date.now()
    };
    if (id) {
        const index = data.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            data.projects[index] = project;
        }
    }
    else {
        data.projects.push(project);
    }
    saveAdminData(data);
    closeModal('projectModal');
    renderProjects();
    showToast(id ? 'Project updated!' : 'Project added!');
}
let currentEditingSection = null;
function openDocsEditor(projectId) {
    const data = getAdminData();
    const project = data.projects.find(p => p.id === projectId);
    if (!project) {
        showToast('Project not found', true);
        return;
    }
    document.getElementById('docsProjectId').value = projectId;
    document.getElementById('docsModalTitle').textContent = `Documentation: ${project.name}`;
    renderDocsSections(project);
    openModal('docsModal');
}
function renderDocsSections(project) {
    const container = document.getElementById('docsSectionsList');
    if (!container)
        return;
    if (project.sections.length === 0) {
        container.innerHTML = '<p class="no-section-selected">No sections yet. Add one to get started.</p>';
        return;
    }
    const sortedSections = [...project.sections].sort((a, b) => a.order - b.order);
    container.innerHTML = sortedSections.map(section => `
        <div class="docs-section-item" data-id="${section.id}">
            <span>${escapeHtml(section.title)}</span>
            <div class="section-actions">
                <button class="edit-section" data-id="${section.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-section" data-id="${section.id}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
    container.querySelectorAll('.docs-section-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const target = e.target;
            if (target.closest('.section-actions'))
                return;
            const sectionId = item.getAttribute('data-id');
            const section = project.sections.find(s => s.id === sectionId);
            if (section) {
                selectSection(section, project.id);
            }
        });
        item.querySelector('.edit-section')?.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-id');
            const section = project.sections.find(s => s.id === sectionId);
            if (section) {
                openSectionModal(section, project.id);
            }
        });
        item.querySelector('.delete-section')?.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-id');
            if (confirm('Delete this section?')) {
                deleteSection(sectionId, project.id);
            }
        });
    });
}
function selectSection(section, projectId) {
    const container = document.getElementById('currentSectionEditor');
    if (!container)
        return;
    document.querySelectorAll('.docs-section-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-id') === section.id);
    });
    container.innerHTML = `
        <div class="section-preview">
            <h3>${escapeHtml(section.title)}</h3>
            <p class="section-type"><strong>Type:</strong> ${section.type}</p>
            <div class="section-content-preview">
                <strong>Content:</strong>
                <pre>${escapeHtml(section.content)}</pre>
            </div>
            <button class="btn-primary" onclick="openSectionModalById('${section.id}', '${projectId}')">
                <i class="fas fa-edit"></i> Edit Section
            </button>
        </div>
    `;
}
function openSectionModal(section, projectId) {
    const form = document.getElementById('sectionForm');
    const title = document.getElementById('sectionModalTitle');
    const codeOptions = document.getElementById('codeOptions');
    if (!form || !title)
        return;
    form.reset();
    if (section) {
        title.textContent = 'Edit Section';
        document.getElementById('sectionId').value = section.id;
        document.getElementById('sectionProjectId').value = projectId || '';
        document.getElementById('sectionTitle').value = section.title;
        document.getElementById('sectionType').value = section.type;
        document.getElementById('sectionContent').value = section.content;
        if (section.codeLanguage) {
            document.getElementById('codeLanguage').value = section.codeLanguage;
        }
        if (codeOptions) {
            codeOptions.style.display = section.type === 'code' ? 'block' : 'none';
        }
        updateSectionHelp();
    }
    else {
        title.textContent = 'Add Section';
        document.getElementById('sectionId').value = '';
        document.getElementById('sectionProjectId').value =
            document.getElementById('docsProjectId')?.value || '';
        if (codeOptions) {
            codeOptions.style.display = 'none';
        }
    }
    openModal('sectionModal');
}
function saveSection(e) {
    e.preventDefault();
    const id = document.getElementById('sectionId').value;
    const projectId = document.getElementById('sectionProjectId').value;
    const title = document.getElementById('sectionTitle').value.trim();
    const type = document.getElementById('sectionType').value;
    const content = document.getElementById('sectionContent').value;
    const codeLanguage = document.getElementById('codeLanguage')?.value || 'bash';
    const data = getAdminData();
    const projectIndex = data.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
        showToast('Project not found', true);
        return;
    }
    const project = data.projects[projectIndex];
    const section = {
        id: id || generateId(),
        title,
        type,
        content,
        order: id
            ? (project.sections.find(s => s.id === id)?.order || project.sections.length)
            : project.sections.length,
        codeLanguage: type === 'code' ? codeLanguage : undefined
    };
    if (id) {
        const sectionIndex = project.sections.findIndex(s => s.id === id);
        if (sectionIndex !== -1) {
            project.sections[sectionIndex] = section;
        }
    }
    else {
        project.sections.push(section);
    }
    saveAdminData(data);
    closeModal('sectionModal');
    renderDocsSections(project);
    showToast(id ? 'Section updated!' : 'Section added!');
}
function deleteSection(sectionId, projectId) {
    const data = getAdminData();
    const project = data.projects.find(p => p.id === projectId);
    if (!project)
        return;
    project.sections = project.sections.filter(s => s.id !== sectionId);
    saveAdminData(data);
    renderDocsSections(project);
    const editor = document.getElementById('currentSectionEditor');
    if (editor) {
        editor.innerHTML = '<p class="no-section-selected">Select a section to edit or add a new one.</p>';
    }
    showToast('Section deleted!');
}
function renderSoftware() {
    const container = document.getElementById('softwareList');
    if (!container)
        return;
    const data = getAdminData();
    if (data.software.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-code"></i>
                <h4>No Software Yet</h4>
                <p>Click "Add Software" to add your first software or tool.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = data.software.map(sw => `
        <div class="item-card" data-id="${sw.id}">
            <div class="item-card-header">
                <div class="item-icon">
                    ${sw.customImage
        ? `<img src="${sw.customImage}" alt="${sw.name}">`
        : `<i class="fas ${sw.icon}"></i>`}
                </div>
                <div class="item-info">
                    <h4>
                        ${escapeHtml(sw.name)}
                        ${sw.underDevelopment ? '<span class="item-badge under-dev">Under Development</span>' : ''}
                    </h4>
                    <p>${escapeHtml(sw.description)}</p>
                </div>
            </div>
            <div class="item-actions">
                <button class="item-action-btn edit-btn" data-id="${sw.id}" data-type="software">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="item-action-btn delete-btn" data-id="${sw.id}" data-type="software">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
    setupItemActions();
}
function openSoftwareModal(software) {
    const modal = document.getElementById('softwareModal');
    const title = document.getElementById('softwareModalTitle');
    const form = document.getElementById('softwareForm');
    if (!modal || !title || !form)
        return;
    form.reset();
    const iconOptions = modal.querySelectorAll('.icon-option');
    iconOptions.forEach(opt => opt.classList.remove('active'));
    iconOptions[0]?.classList.add('active');
    if (software) {
        title.textContent = 'Edit Software';
        document.getElementById('softwareId').value = software.id;
        document.getElementById('softwareName').value = software.name;
        document.getElementById('softwareDescription').value = software.description;
        document.getElementById('softwareLink').value = software.link;
        document.getElementById('softwareIcon').value = software.icon;
        document.getElementById('softwareUnderDev').checked = software.underDevelopment;
        if (software.customImage) {
            document.getElementById('softwareCustomImage').value = software.customImage;
            iconOptions.forEach(opt => opt.classList.remove('active'));
        }
        else {
            const iconOpt = modal.querySelector(`[data-icon="${software.icon}"]`);
            if (iconOpt) {
                iconOptions.forEach(opt => opt.classList.remove('active'));
                iconOpt.classList.add('active');
            }
        }
    }
    else {
        title.textContent = 'Add Software';
        document.getElementById('softwareId').value = '';
        document.getElementById('softwareIcon').value = 'fa-code';
    }
    openModal('softwareModal');
}
function saveSoftware(e) {
    e.preventDefault();
    const id = document.getElementById('softwareId').value;
    const name = document.getElementById('softwareName').value.trim();
    const description = document.getElementById('softwareDescription').value.trim();
    const link = document.getElementById('softwareLink').value.trim();
    const icon = document.getElementById('softwareIcon').value;
    const customImage = document.getElementById('softwareCustomImage').value.trim();
    const underDevelopment = document.getElementById('softwareUnderDev').checked;
    const data = getAdminData();
    const software = {
        id: id || generateId(),
        name,
        description,
        link,
        icon: customImage ? 'custom' : icon,
        customImage: customImage || undefined,
        underDevelopment,
        createdAt: id ? (data.software.find(s => s.id === id)?.createdAt || Date.now()) : Date.now()
    };
    if (id) {
        const index = data.software.findIndex(s => s.id === id);
        if (index !== -1) {
            data.software[index] = software;
        }
    }
    else {
        data.software.push(software);
    }
    saveAdminData(data);
    closeModal('softwareModal');
    renderSoftware();
    showToast(id ? 'Software updated!' : 'Software added!');
}
function setupItemActions() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const type = btn.getAttribute('data-type');
            const data = getAdminData();
            if (type === 'affiliate') {
                const affiliate = data.affiliates.find(a => a.id === id);
                if (affiliate)
                    openAffiliateModal(affiliate);
            }
            else if (type === 'project') {
                const project = data.projects.find(p => p.id === id);
                if (project)
                    openProjectModal(project);
            }
            else if (type === 'software') {
                const software = data.software.find(s => s.id === id);
                if (software)
                    openSoftwareModal(software);
            }
        });
    });
    document.querySelectorAll('.docs-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (id)
                openDocsEditor(id);
        });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const type = btn.getAttribute('data-type');
            if (!confirm('Are you sure you want to delete this item?'))
                return;
            const data = getAdminData();
            if (type === 'affiliate') {
                data.affiliates = data.affiliates.filter(a => a.id !== id);
                saveAdminData(data);
                renderAffiliates();
            }
            else if (type === 'project') {
                data.projects = data.projects.filter(p => p.id !== id);
                saveAdminData(data);
                renderProjects();
            }
            else if (type === 'software') {
                data.software = data.software.filter(s => s.id !== id);
                saveAdminData(data);
                renderSoftware();
            }
            showToast('Item deleted!');
        });
    });
}
function exportData() {
    const data = getAdminData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nerd-or-geek-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported!');
}
function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result);
            if (!data.affiliates || !data.projects || !data.software) {
                throw new Error('Invalid data structure');
            }
            saveAdminData(data);
            renderAffiliates();
            renderProjects();
            renderSoftware();
            showToast('Data imported successfully!');
        }
        catch (error) {
            showToast('Failed to import data. Invalid file format.', true);
        }
    };
    reader.readAsText(file);
}
function clearAllData() {
    if (!confirm('Are you sure you want to delete ALL data? This cannot be undone!'))
        return;
    if (!confirm('This will permanently delete all affiliates, projects, and software. Continue?'))
        return;
    localStorage.removeItem(STORAGE_KEY);
    renderAffiliates();
    renderProjects();
    renderSoftware();
    showToast('All data cleared!');
}
function resetToDefaults() {
    if (!confirm('Reset all data to defaults? This will replace current data with the default content including comprehensive Pinecraft and P4wnP1 documentation.'))
        return;
    localStorage.removeItem(STORAGE_KEY);
    initializeDefaultData();
    renderAffiliates();
    renderProjects();
    renderSoftware();
    showToast('Data reset to defaults!');
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function insertFormat(formatType) {
    const textarea = document.getElementById('sectionContent');
    if (!textarea)
        return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let insertion = '';
    let cursorOffset = 0;
    switch (formatType) {
        case 'link':
            if (selectedText) {
                insertion = `[${selectedText}](url)`;
                cursorOffset = insertion.length - 1;
            }
            else {
                insertion = '[link text](url)';
                cursorOffset = 1;
            }
            break;
        case 'bold':
            insertion = selectedText ? `**${selectedText}**` : '**bold text**';
            cursorOffset = selectedText ? insertion.length : 2;
            break;
        case 'italic':
            insertion = selectedText ? `*${selectedText}*` : '*italic text*';
            cursorOffset = selectedText ? insertion.length : 1;
            break;
        case 'code':
            insertion = selectedText ? `\`${selectedText}\`` : '`code`';
            cursorOffset = selectedText ? insertion.length : 1;
            break;
        case 'codeblock':
            insertion = selectedText
                ? `\`\`\`bash\n${selectedText}\n\`\`\``
                : '```bash\nyour code here\n```';
            cursorOffset = selectedText ? insertion.length : 8;
            break;
        case 'heading':
            insertion = selectedText ? `\n### ${selectedText}\n` : '\n### Subheading\n';
            cursorOffset = insertion.length;
            break;
        case 'newline':
            insertion = '\n\n';
            cursorOffset = 2;
            break;
    }
    textarea.value = textarea.value.substring(0, start) + insertion + textarea.value.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;
}
function updateSectionHelp() {
    const sectionType = document.getElementById('sectionType')?.value;
    const helpText = document.getElementById('sectionHelpText');
    const codeOptions = document.getElementById('codeOptions');
    if (!helpText)
        return;
    if (codeOptions) {
        codeOptions.style.display = sectionType === 'code' ? 'block' : 'none';
    }
    let helpContent = '';
    switch (sectionType) {
        case 'text':
            helpContent = `
                <strong>Text/Paragraph:</strong><br>
                • Write content naturally with paragraphs<br>
                • Use <code>[link text](url)</code> for links<br>
                • Use <code>**bold**</code> and <code>*italic*</code><br>
                • Use <code>\`code\`</code> for inline code<br>
                • Use <code>### Heading</code> for sub-headings<br>
                • Blank lines create new paragraphs
            `;
            break;
        case 'cards-2':
        case 'cards-3':
            helpContent = `
                <strong>Card Format:</strong><br>
                • Separate each card with <code>---</code> on its own line<br>
                • Card format: <code>Title | Description | Optional Code</code><br>
                • Example:<br>
                <code>Step 1 | Do this first | sudo apt update</code><br>
                <code>---</code><br>
                <code>Step 2 | Then do this | sudo apt upgrade -y</code>
            `;
            break;
        case 'code':
            helpContent = `
                <strong>Code Block:</strong><br>
                • Enter your code directly<br>
                • Select the language below for syntax highlighting<br>
                • The copy button will be added automatically
            `;
            break;
        case 'callout-info':
        case 'callout-warning':
        case 'callout-danger':
        case 'callout-success':
            helpContent = `
                <strong>Callout Box:</strong><br>
                • Enter the message for the callout<br>
                • Supports markdown formatting<br>
                • Use for important notes, warnings, or tips
            `;
            break;
        case 'steps':
            helpContent = `
                <strong>Step-by-Step Instructions:</strong><br>
                • Each line becomes a numbered step<br>
                • Use <code>---</code> to separate multi-line steps<br>
                • Add code with <code>\`\`\`bash</code> and <code>\`\`\`</code>
            `;
            break;
        case 'list':
            helpContent = `
                <strong>Bullet List:</strong><br>
                • Each line becomes a list item<br>
                • Supports markdown formatting within items
            `;
            break;
        case 'video':
            helpContent = `
                <strong>Embedded Video:</strong><br>
                • Enter YouTube URL: <code>https://youtube.com/watch?v=VIDEO_ID</code><br>
                • Or Vimeo URL: <code>https://vimeo.com/VIDEO_ID</code><br>
                • The video will be embedded responsively
            `;
            break;
        case 'image':
            helpContent = `
                <strong>Image with Caption:</strong><br>
                • Format: <code>image_path | caption text | alt text</code><br>
                • Example: <code>assets/img/screenshot.png | Setup complete | Screenshot showing setup</code>
            `;
            break;
        case 'links':
            helpContent = `
                <strong>Link Collection:</strong><br>
                • Each line: <code>Link Text | URL | Optional Description</code><br>
                • Example:<br>
                <code>Official Docs | https://docs.example.com | Complete reference</code>
            `;
            break;
        default:
            helpContent = '<strong>Enter your content below.</strong>';
    }
    helpText.innerHTML = helpContent;
}
window.insertFormat = insertFormat;
window.updateSectionHelp = updateSectionHelp;
window.openSectionModalById = (sectionId, projectId) => {
    const data = getAdminData();
    const project = data.projects.find(p => p.id === projectId);
    const section = project?.sections.find(s => s.id === sectionId);
    if (section) {
        openSectionModal(section, projectId);
    }
};
function init() {
    setupLoginHandler();
    if (!isAuthenticated()) {
        showLoginOverlay();
        return;
    }
    hideLoginOverlay();
    initializeAdminPortal();
}
let adminPortalInitialized = false;
function initializeAdminPortal() {
    if (adminPortalInitialized) {
        renderAffiliates();
        renderProjects();
        renderSoftware();
        return;
    }
    adminPortalInitialized = true;
    setupNavigation();
    setupModalCloseHandlers();
    setupIconSelectors();
    renderAffiliates();
    renderProjects();
    renderSoftware();
    document.getElementById('affiliateForm')?.addEventListener('submit', saveAffiliate);
    document.getElementById('projectForm')?.addEventListener('submit', saveProject);
    document.getElementById('softwareForm')?.addEventListener('submit', saveSoftware);
    document.getElementById('sectionForm')?.addEventListener('submit', saveSection);
    document.getElementById('addAffiliate')?.addEventListener('click', () => openAffiliateModal());
    document.getElementById('addProject')?.addEventListener('click', () => openProjectModal());
    document.getElementById('addSoftware')?.addEventListener('click', () => openSoftwareModal());
    document.getElementById('addDocsSection')?.addEventListener('click', () => openSectionModal());
    document.getElementById('exportData')?.addEventListener('click', exportData);
    document.getElementById('exportAllData')?.addEventListener('click', exportData);
    document.getElementById('importData')?.addEventListener('click', () => {
        document.getElementById('importFile')?.click();
    });
    document.getElementById('importFile')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file)
            importData(file);
    });
    document.getElementById('clearAllData')?.addEventListener('click', clearAllData);
    document.getElementById('resetToDefaults')?.addEventListener('click', resetToDefaults);
    console.log('Admin Portal initialized');
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
}
else {
    init();
}
//# sourceMappingURL=admin.js.map