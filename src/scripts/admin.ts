/**
 * Admin Portal TypeScript
 * Handles all admin functionality for managing affiliates, projects, and software
 */

// ============================================
// Security Configuration
// ============================================
// Hash of the admin password (SHA-256)
// To generate a new hash: create a simple script that runs crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-password'))
// Or use an online SHA-256 generator. Current password hash is for demonstration.
const ADMIN_PASSWORD_HASH = 'adf3862f5831cccd16da7b4b9a5ac73365270622e97e30782bf24db0161e7f68';
const AUTH_KEY = 'nerdOrGeekAdminAuth';
const AUTH_EXPIRY_HOURS = 24;

// GitHub Settings Key
const GITHUB_SETTINGS_KEY = 'nerdOrGeekGithubSettings';
const PREVIEW_MODE_KEY = 'nerdOrGeekPreviewMode';
const LAST_PUBLISHED_HASH_KEY = 'nerdOrGeekLastPublishedHash';

interface GitHubSettings {
    token: string;
    owner: string;
    repo: string;
}

// ============================================
// Authentication Functions
// ============================================
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function isAuthenticated(): boolean {
    const auth = localStorage.getItem(AUTH_KEY);
    if (!auth) return false;
    
    try {
        const authData = JSON.parse(auth);
        const now = Date.now();
        // Check if auth is still valid (not expired)
        if (authData.expiry && authData.expiry > now) {
            return true;
        }
        // Expired - clear it
        localStorage.removeItem(AUTH_KEY);
        return false;
    } catch {
        return false;
    }
}

function setAuthenticated(): void {
    const expiry = Date.now() + (AUTH_EXPIRY_HOURS * 60 * 60 * 1000);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ authenticated: true, expiry }));
}

function logout(): void {
    localStorage.removeItem(AUTH_KEY);
    showLoginOverlay();
}

async function attemptLogin(password: string): Promise<boolean> {
    const hash = await hashPassword(password);
    if (hash === ADMIN_PASSWORD_HASH) {
        setAuthenticated();
        return true;
    }
    return false;
}

function showLoginOverlay(): void {
    const overlay = document.getElementById('loginOverlay');
    const adminMain = document.querySelector('.admin-main');
    if (overlay) overlay.style.display = 'flex';
    if (adminMain) (adminMain as HTMLElement).style.display = 'none';
}

function hideLoginOverlay(): void {
    const overlay = document.getElementById('loginOverlay');
    const adminMain = document.querySelector('.admin-main');
    if (overlay) overlay.style.display = 'none';
    if (adminMain) (adminMain as HTMLElement).style.display = 'block';
}

function setupLoginHandler(): void {
    const loginForm = document.getElementById('adminLoginForm');
    const passwordInput = document.getElementById('adminPassword') as HTMLInputElement;
    const loginError = document.getElementById('loginError');
    
    if (loginForm && passwordInput) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = passwordInput.value;
            
            if (await attemptLogin(password)) {
                hideLoginOverlay();
                initializeAdminPortal(); // Initialize the admin portal after successful login
                passwordInput.value = '';
                if (loginError) loginError.style.display = 'none';
            } else {
                if (loginError) {
                    loginError.textContent = 'Incorrect password. Please try again.';
                    loginError.style.display = 'block';
                }
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// ============================================
// Types
// ============================================
interface Affiliate {
    id: string;
    name: string;
    description: string;
    link: string;
    icon: string;
    customImage?: string;
    comingSoon: boolean;
    createdAt: number;
}

interface ProjectSection {
    id: string;
    title: string;
    type: 'text' | 'cards-2' | 'cards-3' | 'code' | 'callout-info' | 'callout-warning' | 'callout-danger' | 'callout-success' | 'steps' | 'list' | 'video' | 'image' | 'links';
    content: string;
    order: number;
    codeLanguage?: string;
}

interface ProjectTheme {
    preset: 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'custom';
    primaryColor?: string;
    accentColor?: string;
    textColor?: string;
    cardBgColor?: string;
    heroBgColor?: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    badge: string;
    tags: string[];
    icon: string;
    customImage?: string;
    sections: ProjectSection[];
    theme?: ProjectTheme;
    createdAt: number;
}

interface Software {
    id: string;
    name: string;
    description: string;
    link: string;
    icon: string;
    customImage?: string;
    underDevelopment: boolean;
    createdAt: number;
}

interface AdminData {
    affiliates: Affiliate[];
    projects: Project[];
    software: Software[];
    initialized?: boolean;
}

// ============================================
// Storage Keys
// ============================================
const STORAGE_KEY = 'nerdOrGeekAdminData';

// ============================================
// Default/Static Content
// ============================================
const DEFAULT_AFFILIATES: Affiliate[] = [
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

const DEFAULT_PROJECTS: Project[] = [
    {
        id: 'static-project-1',
        name: 'Pinecraft',
        description: 'An automated Minecraft Java server installer for Raspberry Pi, maintained at the cat5tv/Pinecraft GitHub repository.',
        badge: 'Popular',
        tags: ['Raspberry Pi', 'Minecraft'],
        icon: 'fa-cube',
        customImage: 'assets/img/projects/Pinecraft.png',
        theme: {
            preset: 'forest'
        },
        sections: [
            {
                id: 'sec-1',
                title: 'Overview',
                type: 'text',
                content: '**Pinecraft** is an automated Minecraft Java server installer for Raspberry Pi, maintained at the [cat5tv/Pinecraft GitHub repository](https://github.com/cat5tv/Pinecraft).\n\nThis guide is designed for beginner to intermediate Raspberry Pi users. No prior Pi experience is assumed, but commands are shown exactly as they should be entered.\n\nFollow each step in order. Do not skip steps or use alternative methods.',
                codeLanguage: '',
                order: 0
            },
            {
                id: 'sec-1b',
                title: 'Estimated Time',
                type: 'callout-info',
                content: '**30–60 minutes** depending on download speeds and hardware. The process involves flashing an OS, configuration, and server setup.',
                codeLanguage: '',
                order: 1
            },
            {
                id: 'sec-2',
                title: 'Hardware Requirements',
                type: 'text',
                content: '### Required Hardware\n\n- **Raspberry Pi 4** (4GB or 8GB RAM recommended)\n- MicroSD card (32GB+ Class 10/UHS-1) or USB drive\n- Official Raspberry Pi power supply (3A USB-C)\n- Computer for setup (Windows, macOS, or Linux)\n\n### Optional Hardware\n\n- Heatsink and fan for cooling\n- External SSD for improved performance\n- Case with ventilation',
                codeLanguage: '',
                order: 2
            },
            {
                id: 'sec-2b',
                title: 'Important Note',
                type: 'callout-warning',
                content: 'Do **not** use a Raspberry Pi Zero or older Pi models. Pinecraft requires a **Raspberry Pi 4** for adequate performance. Minecraft servers are memory and CPU intensive.',
                codeLanguage: '',
                order: 3
            },
            {
                id: 'sec-3',
                title: 'Step 1: Install Raspberry Pi Imager',
                type: 'text',
                content: '**Raspberry Pi Imager** is the official tool for flashing operating system images to SD cards and USB drives. It is required to install Raspberry Pi OS on your storage device.\n\nDownload Raspberry Pi Imager from the official website:\n\n[https://www.raspberrypi.com/software/](https://www.raspberrypi.com/software/)\n\nRaspberry Pi Imager is available for **Windows**, **macOS**, and **Linux**. Download and install the version for your operating system.',
                codeLanguage: '',
                order: 4
            },
            {
                id: 'sec-4',
                title: 'Step 2: Flash Raspberry Pi OS',
                type: 'steps',
                content: `**Open Raspberry Pi Imager** - Launch the application you installed in the previous step.
---
**Click Choose Device** - Select your Raspberry Pi model from the list.
---
**Click Choose OS** - Navigate to **Other** and select **Raspberry Pi OS Lite (64-bit)**.
---
**Click Choose Storage** - Select your target SD card or USB drive.
---
**Click Next** - You will be prompted to configure settings.
---
**Open Advanced Settings** - Configure the following: **Wi-Fi** (enter your SSID and password), **Username and password** (create your login credentials), **Enable Raspberry Pi Connect** (for remote access).
---
**Apply Settings** - Confirm and begin flashing the image to your storage device.
---
**Safely Eject** - When flashing is complete, safely eject the drive from your computer.`,
                codeLanguage: '',
                order: 5
            },
            {
                id: 'sec-4b',
                title: 'Why Lite 64-bit?',
                type: 'callout-success',
                content: 'We use **Raspberry Pi OS Lite (64-bit)** because it has no desktop environment, freeing up RAM and CPU for the Minecraft server. The 64-bit version provides better Java performance.',
                codeLanguage: '',
                order: 6
            },
            {
                id: 'sec-5',
                title: 'Step 3: First Boot & Remote Access',
                type: 'steps',
                content: `**Insert the flashed drive** - Insert the SD card or USB drive into your Raspberry Pi.
---
**Power on the Raspberry Pi** - Connect the power supply. The Pi will boot automatically.
---
**Open Raspberry Pi Connect** - From another computer, open your web browser and go to: [https://connect.raspberrypi.com](https://connect.raspberrypi.com)
---
**Sign in and connect** - Sign in with your Raspberry Pi account and connect to your Pi remotely.`,
                codeLanguage: '',
                order: 7
            },
            {
                id: 'sec-6',
                title: 'Step 4: Initial Raspberry Pi Configuration',
                type: 'code',
                content: `# Open Raspberry Pi Configuration
sudo raspi-config

# Navigate to: Advanced Options → Expand Filesystem
# Then exit raspi-config

# Update the System
sudo apt update
sudo apt upgrade -y

# Install Git
sudo apt install git -y

# Reboot
sudo reboot`,
                codeLanguage: 'bash',
                order: 8
            },
            {
                id: 'sec-6b',
                title: 'Configuration Steps',
                type: 'text',
                content: 'In raspi-config, navigate to:\n\n1. **Advanced Options**\n2. **Expand Filesystem**\n3. Exit raspi-config\n\nAfter the reboot, reconnect via Raspberry Pi Connect to continue.',
                codeLanguage: '',
                order: 9
            },
            {
                id: 'sec-7',
                title: 'Step 5: Download Pinecraft',
                type: 'code',
                content: `# Clone the Pinecraft repository
git clone https://github.com/cat5tv/Pinecraft.git

# Enter the Pinecraft directory
cd Pinecraft`,
                codeLanguage: 'bash',
                order: 10
            },
            {
                id: 'sec-7b',
                title: 'GitHub Repository',
                type: 'links',
                content: `Pinecraft GitHub|https://github.com/cat5tv/Pinecraft|Official repository with source code and documentation`,
                codeLanguage: '',
                order: 11
            },
            {
                id: 'sec-8',
                title: 'Step 6: Run the Pinecraft Installer',
                type: 'code',
                content: `# Run the installer with sudo
sudo ./install`,
                codeLanguage: 'bash',
                order: 12
            },
            {
                id: 'sec-8b',
                title: 'Installation Flow',
                type: 'steps',
                content: `**Click OK** - When the welcome screen appears, click OK to continue.
---
**Click OK again** - Acknowledge the information prompt.
---
**Select installation location** - Choose **Main / Home directory** for the installation.
---
**Choose Minecraft version** - Select your preferred Minecraft server version.
---
**Enter world seed** - Provide a seed or leave blank for random generation.
---
**Select game mode** - Choose Survival, Creative, or Adventure mode.
---
**Confirm RAM overclocking** - Confirm when prompted about memory settings.
---
**Wait for installation** - The installer handles all dependencies automatically.`,
                codeLanguage: '',
                order: 13
            },
            {
                id: 'sec-9',
                title: 'Step 7: Checking Server Status',
                type: 'callout-warning',
                content: '**Important:** Only these two commands are valid with the init.d script:\n\n`/etc/init.d/pinecraft status` - Check if the server is running\n\n`/etc/init.d/pinecraft stop` - Stop the server\n\n**There is no start or restart command in init.d.** Server control is handled differently (see next section).',
                codeLanguage: '',
                order: 14
            },
            {
                id: 'sec-10',
                title: 'Step 8: Server Control Commands',
                type: 'cards-2',
                content: `Start Server|Navigate to your Minecraft folder and run \`./server\` to start the server.
---
Restart Server|Run \`./restart\` from within the Minecraft directory to restart.
---
Stop Server|Use \`/etc/init.d/pinecraft stop\` to gracefully shut down the server.
---
Check Status|Use \`/etc/init.d/pinecraft status\` to verify if the server is running.`,
                codeLanguage: '',
                order: 15
            },
            {
                id: 'sec-11',
                title: 'Step 9: Updating PaperMC',
                type: 'steps',
                content: `**Download the latest Paper JAR** - Go to [https://papermc.io/downloads](https://papermc.io/downloads) and download the latest Paper JAR file.
---
**Navigate to the Minecraft directory** - Open the Minecraft folder created by Pinecraft.
---
**Delete the existing JAR** - Delete the file named \`Minecraft.jar\`.
---
**Rename the downloaded file** - Rename the new Paper JAR file you downloaded to \`Minecraft.jar\`.
---
**Restart the server** - Run \`./restart\` to start the server with the updated Paper version.`,
                codeLanguage: '',
                order: 16
            },
            {
                id: 'sec-12',
                title: 'Step 10: Installing Plugins',
                type: 'steps',
                content: `**Stop the server** - Run \`/etc/init.d/pinecraft stop\` to shut down the server.
---
**Copy plugin files** - Copy the plugin \`.jar\` files from your computer.
---
**Paste into plugins folder** - Paste the files into the \`plugins\` folder inside the Minecraft directory.
---
**Restart the server** - Run \`./restart\` to start the server with the new plugins loaded.`,
                codeLanguage: '',
                order: 17
            },
            {
                id: 'sec-12b',
                title: 'Plugin Resources',
                type: 'links',
                content: `SpigotMC Resources|https://www.spigotmc.org/resources/|Thousands of free and premium plugins
Hangar (PaperMC)|https://hangar.papermc.io/|Official Paper plugin repository
Modrinth|https://modrinth.com/plugins|Modern plugin and mod platform`,
                codeLanguage: '',
                order: 18
            },
            {
                id: 'sec-13',
                title: 'Networking Guide',
                type: 'text',
                content: '### Local Network Connection\n\nFor players on the same network, use your Pi\'s local IP address. Find it with:\n\n```bash\nhostname -I\n```\n\nIn Minecraft: **Multiplayer** → **Direct Connect** → Enter the local IP.\n\n### Remote Connection\n\nFor players outside your network:\n\n1. Find your public IP: `curl ifconfig.me`\n2. Forward TCP port **25565** in your router settings\n3. Share your public IP with players',
                codeLanguage: '',
                order: 19
            },
            {
                id: 'sec-13b',
                title: 'Security Warning',
                type: 'callout-warning',
                content: 'Opening your server to the internet exposes it to potential attacks. Always:\n\n- Enable whitelist in `server.properties`: set `white-list=true`\n- Only add trusted players to your whitelist\n- Keep your server software updated\n- Consider using a firewall',
                codeLanguage: '',
                order: 20
            },
            {
                id: 'sec-14',
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
                order: 21
            },
            {
                id: 'sec-15',
                title: 'Congratulations!',
                type: 'callout-success',
                content: 'You now have a fully functional Minecraft Java server running on your Raspberry Pi! Invite your friends, explore, build, and have fun. Remember to back up your world files regularly.',
                codeLanguage: '',
                order: 22
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
        theme: {
            preset: 'midnight'
        },
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

const DEFAULT_SOFTWARE: Software[] = [
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

// ============================================
// Data Management
// ============================================
function getAdminData(): AdminData {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        const parsed = JSON.parse(data);
        // Check if initialized with default content
        if (parsed.initialized) {
            return parsed;
        }
    }
    // First time - seed with default content
    return initializeDefaultData();
}

function initializeDefaultData(): AdminData {
    const data: AdminData = {
        affiliates: [...DEFAULT_AFFILIATES],
        projects: [...DEFAULT_PROJECTS],
        software: [...DEFAULT_SOFTWARE],
        initialized: true
    };
    saveAdminData(data);
    return data;
}

function saveAdminData(data: AdminData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Update sync status whenever data changes
    updateSyncStatus();
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================
// GitHub Integration
// ============================================
function getGithubSettings(): GitHubSettings | null {
    const settings = localStorage.getItem(GITHUB_SETTINGS_KEY);
    if (settings) {
        return JSON.parse(settings);
    }
    return null;
}

function saveGithubSettings(settings: GitHubSettings): void {
    localStorage.setItem(GITHUB_SETTINGS_KEY, JSON.stringify(settings));
    updateGithubUI();
}

function updateGithubUI(): void {
    const settings = getGithubSettings();
    const statusElement = document.getElementById('githubConnectionStatus');
    const pushBtn = document.getElementById('pushToGithub') as HTMLButtonElement;
    
    if (settings && settings.token && settings.owner && settings.repo) {
        if (statusElement) {
            statusElement.className = 'status-indicator status-connected';
            statusElement.innerHTML = '<i class="fas fa-check-circle"></i> Connected';
        }
        if (pushBtn) pushBtn.disabled = false;
    } else {
        if (statusElement) {
            statusElement.className = 'status-indicator status-not-connected';
            statusElement.innerHTML = '<i class="fas fa-times-circle"></i> Not configured';
        }
        if (pushBtn) pushBtn.disabled = true;
    }
}

async function testGithubConnection(): Promise<boolean> {
    const settings = getGithubSettings();
    if (!settings) {
        showToast('Please configure GitHub settings first', true);
        return false;
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${settings.owner}/${settings.repo}`, {
            headers: {
                'Authorization': `token ${settings.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.ok) {
            showToast('GitHub connection successful!');
            updateGithubUI();
            return true;
        } else if (response.status === 401) {
            showToast('Invalid GitHub token', true);
            return false;
        } else if (response.status === 404) {
            showToast('Repository not found. Check owner/repo name.', true);
            return false;
        } else {
            showToast('GitHub connection failed', true);
            return false;
        }
    } catch (error) {
        showToast('Network error connecting to GitHub', true);
        return false;
    }
}

async function pushToGithub(): Promise<boolean> {
    const settings = getGithubSettings();
    if (!settings) {
        showToast('Please configure GitHub settings first', true);
        return false;
    }

    const pushBtn = document.getElementById('pushToGithub') as HTMLButtonElement;
    const publishStatus = document.getElementById('publishStatus');
    
    if (pushBtn) {
        pushBtn.disabled = true;
        pushBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Pushing...';
    }
    if (publishStatus) {
        publishStatus.textContent = 'Publishing changes...';
        publishStatus.className = 'publish-status publishing';
    }

    try {
        // Get current file SHA (needed for update)
        const fileResponse = await fetch(
            `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/data/site-data.json`,
            {
                headers: {
                    'Authorization': `token ${settings.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        let sha = '';
        if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            sha = fileData.sha;
        }

        // Prepare the data
        const data = getAdminData();
        const exportData = {
            ...data,
            lastUpdated: Date.now()
        };
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(exportData, null, 2))));

        // Push to GitHub
        const updateResponse = await fetch(
            `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/data/site-data.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${settings.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update site data - ${new Date().toLocaleString()}`,
                    content: content,
                    sha: sha || undefined
                })
            }
        );

        if (updateResponse.ok) {
            // Save hash of current data as "last published"
            localStorage.setItem(LAST_PUBLISHED_HASH_KEY, calculateDataHash());
            updateSyncStatus();
            
            if (publishStatus) {
                publishStatus.textContent = 'Published successfully!';
                publishStatus.className = 'publish-status success';
            }
            showToast('Changes published to GitHub!');
            return true;
        } else {
            const errorData = await updateResponse.json();
            console.error('GitHub push failed:', errorData);
            if (publishStatus) {
                publishStatus.textContent = 'Publish failed';
                publishStatus.className = 'publish-status error';
            }
            showToast('Failed to publish changes', true);
            return false;
        }
    } catch (error) {
        console.error('Error pushing to GitHub:', error);
        if (publishStatus) {
            publishStatus.textContent = 'Network error';
            publishStatus.className = 'publish-status error';
        }
        showToast('Network error while publishing', true);
        return false;
    } finally {
        if (pushBtn) {
            pushBtn.disabled = false;
            pushBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Publish to GitHub';
        }
    }
}

// ============================================
// Sync Status & Preview Mode
// ============================================
function calculateDataHash(): string {
    const data = getAdminData();
    // Simple hash based on stringified data
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

function updateSyncStatus(): void {
    const currentHash = calculateDataHash();
    const lastPublishedHash = localStorage.getItem(LAST_PUBLISHED_HASH_KEY);
    const hasUnpublishedChanges = lastPublishedHash !== null && currentHash !== lastPublishedHash;
    
    // Update sidebar badge
    const settingsBadge = document.getElementById('settingsBadge');
    if (settingsBadge) {
        settingsBadge.style.display = hasUnpublishedChanges ? 'flex' : 'none';
    }
    
    // Update sidebar sync status
    const sidebarSyncStatus = document.getElementById('sidebarSyncStatus');
    if (sidebarSyncStatus) {
        if (hasUnpublishedChanges) {
            sidebarSyncStatus.innerHTML = '<span class="sync-dot unsynced"></span> Unpublished changes';
            sidebarSyncStatus.className = 'sync-status unsynced';
        } else if (lastPublishedHash) {
            sidebarSyncStatus.innerHTML = '<span class="sync-dot synced"></span> All changes published';
            sidebarSyncStatus.className = 'sync-status synced';
        } else {
            sidebarSyncStatus.innerHTML = '<span class="sync-dot"></span> Setup GitHub to sync';
            sidebarSyncStatus.className = 'sync-status';
        }
    }
    
    // Update publish section status
    const publishStatus = document.getElementById('publishStatus');
    if (publishStatus) {
        if (hasUnpublishedChanges) {
            publishStatus.textContent = 'You have unpublished changes';
            publishStatus.className = 'publish-status warning';
        } else if (lastPublishedHash) {
            publishStatus.textContent = 'All changes are published';
            publishStatus.className = 'publish-status success';
        } else {
            publishStatus.textContent = 'Configure GitHub to publish';
            publishStatus.className = 'publish-status';
        }
    }
}

function isPreviewMode(): boolean {
    return localStorage.getItem(PREVIEW_MODE_KEY) === 'true';
}

function setPreviewMode(enabled: boolean): void {
    localStorage.setItem(PREVIEW_MODE_KEY, enabled.toString());
    updatePreviewModeUI();
}

function updatePreviewModeUI(): void {
    const toggle = document.getElementById('previewModeToggle') as HTMLInputElement;
    const previewStatus = document.getElementById('previewModeStatus');
    const enabled = isPreviewMode();
    
    if (toggle) toggle.checked = enabled;
    if (previewStatus) {
        if (enabled) {
            previewStatus.textContent = 'Preview mode is ON - main site shows your local changes';
            previewStatus.className = 'settings-note active';
        } else {
            previewStatus.textContent = 'Preview mode is OFF - main site shows published data';
            previewStatus.className = 'settings-note';
        }
    }
}

function setupGithubHandlers(): void {
    // Save GitHub settings
    const saveBtn = document.getElementById('saveGithubSettings');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const token = (document.getElementById('githubToken') as HTMLInputElement)?.value;
            const owner = (document.getElementById('githubOwner') as HTMLInputElement)?.value;
            const repo = (document.getElementById('githubRepo') as HTMLInputElement)?.value;
            
            if (!token || !owner || !repo) {
                showToast('Please fill in all GitHub fields', true);
                return;
            }
            
            saveGithubSettings({ token, owner, repo });
            showToast('GitHub settings saved!');
        });
    }
    
    // Test connection
    const testBtn = document.getElementById('testGithubConnection');
    if (testBtn) {
        testBtn.addEventListener('click', testGithubConnection);
    }
    
    // Push to GitHub
    const pushBtn = document.getElementById('pushToGithub');
    if (pushBtn) {
        pushBtn.addEventListener('click', pushToGithub);
    }
    
    // Preview mode toggle
    const previewToggle = document.getElementById('previewModeToggle');
    if (previewToggle) {
        previewToggle.addEventListener('change', (e) => {
            setPreviewMode((e.target as HTMLInputElement).checked);
        });
    }
    
    // Load existing settings
    const settings = getGithubSettings();
    if (settings) {
        const tokenInput = document.getElementById('githubToken') as HTMLInputElement;
        const ownerInput = document.getElementById('githubOwner') as HTMLInputElement;
        const repoInput = document.getElementById('githubRepo') as HTMLInputElement;
        
        if (tokenInput) tokenInput.value = settings.token;
        if (ownerInput) ownerInput.value = settings.owner;
        if (repoInput) repoInput.value = settings.repo;
    }
    
    // Initialize UI states
    updateGithubUI();
    updatePreviewModeUI();
    updateSyncStatus();
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message: string, isError: boolean = false): void {
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

// ============================================
// Modal Management
// ============================================
function openModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    modal?.classList.add('active');
}

function closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    modal?.classList.remove('active');
}

function setupModalCloseHandlers(): void {
    // Close buttons
    document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId) {
                closeModal(modalId);
            }
        });
    });
    
    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

// ============================================
// Icon Selector
// ============================================
function setupIconSelectors(): void {
    document.querySelectorAll('.icon-options').forEach(container => {
        container.querySelectorAll('.icon-option').forEach(option => {
            option.addEventListener('click', () => {
                // Remove active from siblings
                container.querySelectorAll('.icon-option').forEach(opt => 
                    opt.classList.remove('active')
                );
                // Add active to clicked
                option.classList.add('active');
                
                // Update hidden input
                const icon = option.getAttribute('data-icon');
                const hiddenInput = container.closest('.icon-selector')?.parentElement?.querySelector('input[type="hidden"]') as HTMLInputElement;
                if (hiddenInput && icon) {
                    hiddenInput.value = icon;
                }
                
                // Clear custom input
                const customInput = container.closest('.icon-selector')?.querySelector('input[type="text"]') as HTMLInputElement;
                if (customInput) {
                    customInput.value = '';
                }
            });
        });
    });
    
    // Custom icon/image input handling
    document.querySelectorAll('.custom-icon-input input').forEach(input => {
        input.addEventListener('input', () => {
            const container = input.closest('.icon-selector');
            if (container) {
                // Deselect preset icons
                container.querySelectorAll('.icon-option').forEach(opt => 
                    opt.classList.remove('active')
                );
            }
        });
    });
}

// ============================================
// Theme Selector
// ============================================
function setupThemeSelectors(): void {
    document.querySelectorAll('.theme-preset').forEach(preset => {
        preset.addEventListener('click', () => {
            const container = preset.closest('.theme-presets');
            if (!container) return;
            
            // Remove active from all presets
            container.querySelectorAll('.theme-preset').forEach(p => p.classList.remove('active'));
            
            // Add active to clicked
            preset.classList.add('active');
            
            // Update hidden input
            const theme = preset.getAttribute('data-theme');
            const themeInput = document.getElementById('projectThemePreset') as HTMLInputElement;
            if (themeInput && theme) {
                themeInput.value = theme;
            }
            
            // Show/hide custom colors
            const customColors = document.getElementById('customThemeColors');
            if (customColors) {
                customColors.style.display = theme === 'custom' ? 'block' : 'none';
            }
        });
    });
}

// ============================================
// Navigation
// ============================================
function setupNavigation(): void {
    const navBtns = document.querySelectorAll('.admin-nav-btn');
    const sections = document.querySelectorAll('.admin-section');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.getAttribute('data-section');
            
            // Update nav buttons
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update sections
            sections.forEach(section => {
                section.classList.toggle('active', section.id === `section-${sectionId}`);
            });
        });
    });
}

// ============================================
// Affiliates
// ============================================
function renderAffiliates(): void {
    const container = document.getElementById('affiliatesList');
    if (!container) return;
    
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
                        : `<i class="fas ${affiliate.icon}"></i>`
                    }
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

function openAffiliateModal(affiliate?: Affiliate): void {
    const modal = document.getElementById('affiliateModal');
    const title = document.getElementById('affiliateModalTitle');
    const form = document.getElementById('affiliateForm') as HTMLFormElement;
    
    if (!modal || !title || !form) return;
    
    // Reset form
    form.reset();
    
    // Reset icon selection
    const iconOptions = modal.querySelectorAll('.icon-option');
    iconOptions.forEach(opt => opt.classList.remove('active'));
    iconOptions[0]?.classList.add('active');
    
    if (affiliate) {
        title.textContent = 'Edit Affiliate';
        (document.getElementById('affiliateId') as HTMLInputElement).value = affiliate.id;
        (document.getElementById('affiliateName') as HTMLInputElement).value = affiliate.name;
        (document.getElementById('affiliateDescription') as HTMLTextAreaElement).value = affiliate.description;
        (document.getElementById('affiliateLink') as HTMLInputElement).value = affiliate.link;
        (document.getElementById('affiliateIcon') as HTMLInputElement).value = affiliate.icon;
        (document.getElementById('affiliateComingSoon') as HTMLInputElement).checked = affiliate.comingSoon;
        
        // Set icon
        if (affiliate.customImage) {
            (document.getElementById('affiliateCustomIcon') as HTMLInputElement).value = affiliate.customImage;
            iconOptions.forEach(opt => opt.classList.remove('active'));
        } else {
            const iconOpt = modal.querySelector(`[data-icon="${affiliate.icon}"]`);
            if (iconOpt) {
                iconOptions.forEach(opt => opt.classList.remove('active'));
                iconOpt.classList.add('active');
            }
        }
    } else {
        title.textContent = 'Add Affiliate';
        (document.getElementById('affiliateId') as HTMLInputElement).value = '';
        (document.getElementById('affiliateIcon') as HTMLInputElement).value = 'fa-graduation-cap';
    }
    
    openModal('affiliateModal');
}

function saveAffiliate(e: Event): void {
    e.preventDefault();
    
    const id = (document.getElementById('affiliateId') as HTMLInputElement).value;
    const name = (document.getElementById('affiliateName') as HTMLInputElement).value.trim();
    const description = (document.getElementById('affiliateDescription') as HTMLTextAreaElement).value.trim();
    const link = (document.getElementById('affiliateLink') as HTMLInputElement).value.trim();
    const icon = (document.getElementById('affiliateIcon') as HTMLInputElement).value;
    const customIcon = (document.getElementById('affiliateCustomIcon') as HTMLInputElement).value.trim();
    const comingSoon = (document.getElementById('affiliateComingSoon') as HTMLInputElement).checked;
    
    const data = getAdminData();
    
    const affiliate: Affiliate = {
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
    } else {
        data.affiliates.push(affiliate);
    }
    
    saveAdminData(data);
    closeModal('affiliateModal');
    renderAffiliates();
    showToast(id ? 'Affiliate updated!' : 'Affiliate added!');
}

// ============================================
// Projects
// ============================================
function renderProjects(): void {
    const container = document.getElementById('projectsList');
    if (!container) return;
    
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
                        : `<i class="fas ${project.icon}"></i>`
                    }
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

function openProjectModal(project?: Project): void {
    const modal = document.getElementById('projectModal');
    const title = document.getElementById('projectModalTitle');
    const form = document.getElementById('projectForm') as HTMLFormElement;
    
    if (!modal || !title || !form) return;
    
    form.reset();
    
    const iconOptions = modal.querySelectorAll('.icon-option');
    iconOptions.forEach(opt => opt.classList.remove('active'));
    iconOptions[0]?.classList.add('active');
    
    // Reset theme options
    const themePresets = modal.querySelectorAll('.theme-preset');
    themePresets.forEach(opt => opt.classList.remove('active'));
    modal.querySelector('[data-theme="default"]')?.classList.add('active');
    (document.getElementById('projectThemePreset') as HTMLInputElement).value = 'default';
    (document.getElementById('customThemeColors') as HTMLElement).style.display = 'none';
    
    if (project) {
        title.textContent = 'Edit Project';
        (document.getElementById('projectId') as HTMLInputElement).value = project.id;
        (document.getElementById('projectName') as HTMLInputElement).value = project.name;
        (document.getElementById('projectDescription') as HTMLTextAreaElement).value = project.description;
        (document.getElementById('projectBadge') as HTMLSelectElement).value = project.badge;
        (document.getElementById('projectTags') as HTMLInputElement).value = project.tags.join(', ');
        (document.getElementById('projectIcon') as HTMLInputElement).value = project.icon;
        
        if (project.customImage) {
            (document.getElementById('projectCustomImage') as HTMLInputElement).value = project.customImage;
            iconOptions.forEach(opt => opt.classList.remove('active'));
        } else {
            const iconOpt = modal.querySelector(`[data-icon="${project.icon}"]`);
            if (iconOpt) {
                iconOptions.forEach(opt => opt.classList.remove('active'));
                iconOpt.classList.add('active');
            }
        }
        
        // Load theme settings
        if (project.theme) {
            const themePreset = project.theme.preset || 'default';
            themePresets.forEach(opt => opt.classList.remove('active'));
            modal.querySelector(`[data-theme="${themePreset}"]`)?.classList.add('active');
            (document.getElementById('projectThemePreset') as HTMLInputElement).value = themePreset;
            
            if (themePreset === 'custom') {
                (document.getElementById('customThemeColors') as HTMLElement).style.display = 'block';
                (document.getElementById('themePrimaryColor') as HTMLInputElement).value = project.theme.primaryColor || '#0ea5e9';
                (document.getElementById('themeAccentColor') as HTMLInputElement).value = project.theme.accentColor || '#38bdf8';
                (document.getElementById('themeTextColor') as HTMLInputElement).value = project.theme.textColor || '#f8fafc';
                (document.getElementById('themeCardBgColor') as HTMLInputElement).value = project.theme.cardBgColor || '#1e293b';
                (document.getElementById('themeHeroBgColor') as HTMLInputElement).value = project.theme.heroBgColor || '#0f172a';
            }
        }
    } else {
        title.textContent = 'Add Project';
        (document.getElementById('projectId') as HTMLInputElement).value = '';
        (document.getElementById('projectIcon') as HTMLInputElement).value = 'fa-cube';
    }
    
    openModal('projectModal');
}

function saveProject(e: Event): void {
    e.preventDefault();
    
    const id = (document.getElementById('projectId') as HTMLInputElement).value;
    const name = (document.getElementById('projectName') as HTMLInputElement).value.trim();
    const description = (document.getElementById('projectDescription') as HTMLTextAreaElement).value.trim();
    const badge = (document.getElementById('projectBadge') as HTMLSelectElement).value;
    const tagsStr = (document.getElementById('projectTags') as HTMLInputElement).value;
    const icon = (document.getElementById('projectIcon') as HTMLInputElement).value;
    const customImage = (document.getElementById('projectCustomImage') as HTMLInputElement).value.trim();
    
    // Get theme settings
    const themePreset = (document.getElementById('projectThemePreset') as HTMLInputElement).value as ProjectTheme['preset'];
    const theme: ProjectTheme = { preset: themePreset };
    
    if (themePreset === 'custom') {
        theme.primaryColor = (document.getElementById('themePrimaryColor') as HTMLInputElement).value;
        theme.accentColor = (document.getElementById('themeAccentColor') as HTMLInputElement).value;
        theme.textColor = (document.getElementById('themeTextColor') as HTMLInputElement).value;
        theme.cardBgColor = (document.getElementById('themeCardBgColor') as HTMLInputElement).value;
        theme.heroBgColor = (document.getElementById('themeHeroBgColor') as HTMLInputElement).value;
    }
    
    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
    
    const data = getAdminData();
    const existingProject = data.projects.find(p => p.id === id);
    
    const project: Project = {
        id: id || generateId(),
        name,
        description,
        badge,
        tags,
        icon: customImage ? 'custom' : icon,
        customImage: customImage || undefined,
        sections: existingProject?.sections || [],
        theme,
        createdAt: existingProject?.createdAt || Date.now()
    };
    
    if (id) {
        const index = data.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            data.projects[index] = project;
        }
    } else {
        data.projects.push(project);
    }
    
    saveAdminData(data);
    closeModal('projectModal');
    renderProjects();
    showToast(id ? 'Project updated!' : 'Project added!');
}

// ============================================
// Documentation Editor
// ============================================
let currentEditingSection: ProjectSection | null = null;

function openDocsEditor(projectId: string): void {
    const data = getAdminData();
    const project = data.projects.find(p => p.id === projectId);
    
    if (!project) {
        showToast('Project not found', true);
        return;
    }
    
    (document.getElementById('docsProjectId') as HTMLInputElement).value = projectId;
    (document.getElementById('docsModalTitle') as HTMLElement).textContent = `Documentation: ${project.name}`;
    
    renderDocsSections(project);
    openModal('docsModal');
}

function renderDocsSections(project: Project): void {
    const container = document.getElementById('docsSectionsList');
    if (!container) return;
    
    if (project.sections.length === 0) {
        container.innerHTML = '<p class="no-section-selected">No sections yet. Add one to get started.</p>';
        return;
    }
    
    const sortedSections = [...project.sections].sort((a, b) => a.order - b.order);
    
    container.innerHTML = sortedSections.map((section, index) => `
        <div class="docs-section-item" data-id="${section.id}" draggable="true">
            <div class="section-drag-handle" title="Drag to reorder">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <span class="section-label">${escapeHtml(section.title)}</span>
            <div class="section-order-controls">
                <button class="move-section-up" data-id="${section.id}" ${index === 0 ? 'disabled' : ''} title="Move up">
                    <i class="fas fa-chevron-up"></i>
                </button>
                <button class="move-section-down" data-id="${section.id}" ${index === sortedSections.length - 1 ? 'disabled' : ''} title="Move down">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="section-actions">
                <button class="edit-section" data-id="${section.id}" title="Edit section"><i class="fas fa-edit"></i></button>
                <button class="delete-section" data-id="${section.id}" title="Delete section"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.docs-section-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.section-actions') || target.closest('.section-order-controls') || target.closest('.section-drag-handle')) return;
            
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
                deleteSection(sectionId!, project.id);
            }
        });
        
        // Move up/down handlers
        item.querySelector('.move-section-up')?.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-id');
            moveSectionOrder(sectionId!, project.id, 'up');
        });
        
        item.querySelector('.move-section-down')?.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-id');
            moveSectionOrder(sectionId!, project.id, 'down');
        });
    });
    
    // Setup drag and drop
    setupSectionDragDrop(project.id);
}

function selectSection(section: ProjectSection, projectId: string): void {
    const container = document.getElementById('currentSectionEditor');
    if (!container) return;
    
    // Update active state
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

function openSectionModal(section?: ProjectSection, projectId?: string): void {
    const form = document.getElementById('sectionForm') as HTMLFormElement;
    const title = document.getElementById('sectionModalTitle');
    const codeOptions = document.getElementById('codeOptions');
    
    if (!form || !title) return;
    
    form.reset();
    
    if (section) {
        title.textContent = 'Edit Section';
        (document.getElementById('sectionId') as HTMLInputElement).value = section.id;
        (document.getElementById('sectionProjectId') as HTMLInputElement).value = projectId || '';
        (document.getElementById('sectionTitle') as HTMLInputElement).value = section.title;
        (document.getElementById('sectionType') as HTMLSelectElement).value = section.type;
        (document.getElementById('sectionContent') as HTMLTextAreaElement).value = section.content;
        
        // Set code language if applicable
        if (section.codeLanguage) {
            (document.getElementById('codeLanguage') as HTMLSelectElement).value = section.codeLanguage;
        }
        
        // Show/hide code options
        if (codeOptions) {
            codeOptions.style.display = section.type === 'code' ? 'block' : 'none';
        }
        
        // Update help text
        updateSectionHelp();
    } else {
        title.textContent = 'Add Section';
        (document.getElementById('sectionId') as HTMLInputElement).value = '';
        (document.getElementById('sectionProjectId') as HTMLInputElement).value = 
            (document.getElementById('docsProjectId') as HTMLInputElement)?.value || '';
        
        // Hide code options by default
        if (codeOptions) {
            codeOptions.style.display = 'none';
        }
    }
    
    openModal('sectionModal');
}

function saveSection(e: Event): void {
    e.preventDefault();
    
    const id = (document.getElementById('sectionId') as HTMLInputElement).value;
    const projectId = (document.getElementById('sectionProjectId') as HTMLInputElement).value;
    const title = (document.getElementById('sectionTitle') as HTMLInputElement).value.trim();
    const type = (document.getElementById('sectionType') as HTMLSelectElement).value as ProjectSection['type'];
    const content = (document.getElementById('sectionContent') as HTMLTextAreaElement).value;
    const codeLanguage = (document.getElementById('codeLanguage') as HTMLSelectElement)?.value || 'bash';
    
    const data = getAdminData();
    const projectIndex = data.projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
        showToast('Project not found', true);
        return;
    }
    
    const project = data.projects[projectIndex];
    
    const section: ProjectSection = {
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
    } else {
        project.sections.push(section);
    }
    
    saveAdminData(data);
    closeModal('sectionModal');
    renderDocsSections(project);
    showToast(id ? 'Section updated!' : 'Section added!');
}

function deleteSection(sectionId: string, projectId: string): void {
    const data = getAdminData();
    const project = data.projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    project.sections = project.sections.filter(s => s.id !== sectionId);
    saveAdminData(data);
    renderDocsSections(project);
    
    // Clear editor
    const editor = document.getElementById('currentSectionEditor');
    if (editor) {
        editor.innerHTML = '<p class="no-section-selected">Select a section to edit or add a new one.</p>';
    }
    
    showToast('Section deleted!');
}

// ============================================
// Section Reordering
// ============================================
function moveSectionOrder(sectionId: string, projectId: string, direction: 'up' | 'down'): void {
    const data = getAdminData();
    const project = data.projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    // Sort sections by order
    const sortedSections = [...project.sections].sort((a, b) => a.order - b.order);
    const currentIndex = sortedSections.findIndex(s => s.id === sectionId);
    
    if (currentIndex === -1) return;
    
    // Calculate new index
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Bounds check
    if (newIndex < 0 || newIndex >= sortedSections.length) return;
    
    // Swap order values
    const currentSection = sortedSections[currentIndex];
    const swapSection = sortedSections[newIndex];
    
    const tempOrder = currentSection.order;
    currentSection.order = swapSection.order;
    swapSection.order = tempOrder;
    
    saveAdminData(data);
    renderDocsSections(project);
    showToast('Section reordered!');
}

function setupSectionDragDrop(projectId: string): void {
    const container = document.getElementById('docsSectionsList');
    if (!container) return;
    
    let draggedItem: HTMLElement | null = null;
    
    container.querySelectorAll('.docs-section-item').forEach((item) => {
        const element = item as HTMLElement;
        
        element.addEventListener('dragstart', (e) => {
            draggedItem = element;
            element.classList.add('dragging');
            (e as DragEvent).dataTransfer!.effectAllowed = 'move';
        });
        
        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
            draggedItem = null;
            
            // Remove all drag-over states
            container.querySelectorAll('.docs-section-item').forEach(el => {
                el.classList.remove('drag-over');
            });
        });
        
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            (e as DragEvent).dataTransfer!.dropEffect = 'move';
            
            if (draggedItem && element !== draggedItem) {
                element.classList.add('drag-over');
            }
        });
        
        element.addEventListener('dragleave', () => {
            element.classList.remove('drag-over');
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            
            if (draggedItem && element !== draggedItem) {
                const draggedId = draggedItem.getAttribute('data-id');
                const targetId = element.getAttribute('data-id');
                
                if (draggedId && targetId) {
                    reorderSectionsByDrag(draggedId, targetId, projectId);
                }
            }
        });
    });
}

function reorderSectionsByDrag(draggedId: string, targetId: string, projectId: string): void {
    const data = getAdminData();
    const project = data.projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    // Get current order of sections
    const sortedSections = [...project.sections].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedSections.findIndex(s => s.id === draggedId);
    const targetIndex = sortedSections.findIndex(s => s.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Remove dragged section and insert at target position
    const [draggedSection] = sortedSections.splice(draggedIndex, 1);
    sortedSections.splice(targetIndex, 0, draggedSection);
    
    // Reassign order values
    sortedSections.forEach((section, index) => {
        const originalSection = project.sections.find(s => s.id === section.id);
        if (originalSection) {
            originalSection.order = index;
        }
    });
    
    saveAdminData(data);
    renderDocsSections(project);
    showToast('Sections reordered!');
}

// ============================================
// Software
// ============================================
function renderSoftware(): void {
    const container = document.getElementById('softwareList');
    if (!container) return;
    
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
                        : `<i class="fas ${sw.icon}"></i>`
                    }
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

function openSoftwareModal(software?: Software): void {
    const modal = document.getElementById('softwareModal');
    const title = document.getElementById('softwareModalTitle');
    const form = document.getElementById('softwareForm') as HTMLFormElement;
    
    if (!modal || !title || !form) return;
    
    form.reset();
    
    const iconOptions = modal.querySelectorAll('.icon-option');
    iconOptions.forEach(opt => opt.classList.remove('active'));
    iconOptions[0]?.classList.add('active');
    
    if (software) {
        title.textContent = 'Edit Software';
        (document.getElementById('softwareId') as HTMLInputElement).value = software.id;
        (document.getElementById('softwareName') as HTMLInputElement).value = software.name;
        (document.getElementById('softwareDescription') as HTMLTextAreaElement).value = software.description;
        (document.getElementById('softwareLink') as HTMLInputElement).value = software.link;
        (document.getElementById('softwareIcon') as HTMLInputElement).value = software.icon;
        (document.getElementById('softwareUnderDev') as HTMLInputElement).checked = software.underDevelopment;
        
        if (software.customImage) {
            (document.getElementById('softwareCustomImage') as HTMLInputElement).value = software.customImage;
            iconOptions.forEach(opt => opt.classList.remove('active'));
        } else {
            const iconOpt = modal.querySelector(`[data-icon="${software.icon}"]`);
            if (iconOpt) {
                iconOptions.forEach(opt => opt.classList.remove('active'));
                iconOpt.classList.add('active');
            }
        }
    } else {
        title.textContent = 'Add Software';
        (document.getElementById('softwareId') as HTMLInputElement).value = '';
        (document.getElementById('softwareIcon') as HTMLInputElement).value = 'fa-code';
    }
    
    openModal('softwareModal');
}

function saveSoftware(e: Event): void {
    e.preventDefault();
    
    const id = (document.getElementById('softwareId') as HTMLInputElement).value;
    const name = (document.getElementById('softwareName') as HTMLInputElement).value.trim();
    const description = (document.getElementById('softwareDescription') as HTMLTextAreaElement).value.trim();
    const link = (document.getElementById('softwareLink') as HTMLInputElement).value.trim();
    const icon = (document.getElementById('softwareIcon') as HTMLInputElement).value;
    const customImage = (document.getElementById('softwareCustomImage') as HTMLInputElement).value.trim();
    const underDevelopment = (document.getElementById('softwareUnderDev') as HTMLInputElement).checked;
    
    const data = getAdminData();
    
    const software: Software = {
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
    } else {
        data.software.push(software);
    }
    
    saveAdminData(data);
    closeModal('softwareModal');
    renderSoftware();
    showToast(id ? 'Software updated!' : 'Software added!');
}

// ============================================
// Item Actions (Edit/Delete)
// ============================================
function setupItemActions(): void {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const type = btn.getAttribute('data-type');
            const data = getAdminData();
            
            if (type === 'affiliate') {
                const affiliate = data.affiliates.find(a => a.id === id);
                if (affiliate) openAffiliateModal(affiliate);
            } else if (type === 'project') {
                const project = data.projects.find(p => p.id === id);
                if (project) openProjectModal(project);
            } else if (type === 'software') {
                const software = data.software.find(s => s.id === id);
                if (software) openSoftwareModal(software);
            }
        });
    });
    
    // Docs buttons (projects only)
    document.querySelectorAll('.docs-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (id) openDocsEditor(id);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const type = btn.getAttribute('data-type');
            
            if (!confirm('Are you sure you want to delete this item?')) return;
            
            const data = getAdminData();
            
            if (type === 'affiliate') {
                data.affiliates = data.affiliates.filter(a => a.id !== id);
                saveAdminData(data);
                renderAffiliates();
            } else if (type === 'project') {
                data.projects = data.projects.filter(p => p.id !== id);
                saveAdminData(data);
                renderProjects();
            } else if (type === 'software') {
                data.software = data.software.filter(s => s.id !== id);
                saveAdminData(data);
                renderSoftware();
            }
            
            showToast('Item deleted!');
        });
    });
}

// ============================================
// Import/Export
// ============================================
function exportData(): void {
    const data = getAdminData();
    // Add timestamp for tracking
    const exportData = {
        ...data,
        lastUpdated: Date.now()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Name it site-data.json so it can be directly placed in the data folder
    a.download = 'site-data.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported! Place this file in the data/ folder and push to GitHub.');
}

function importData(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string) as AdminData;
            
            // Validate structure
            if (!data.affiliates || !data.projects || !data.software) {
                throw new Error('Invalid data structure');
            }
            
            saveAdminData(data);
            renderAffiliates();
            renderProjects();
            renderSoftware();
            showToast('Data imported successfully!');
        } catch (error) {
            showToast('Failed to import data. Invalid file format.', true);
        }
    };
    reader.readAsText(file);
}

function clearAllData(): void {
    if (!confirm('Are you sure you want to delete ALL data? This cannot be undone!')) return;
    if (!confirm('This will permanently delete all affiliates, projects, and software. Continue?')) return;
    
    localStorage.removeItem(STORAGE_KEY);
    renderAffiliates();
    renderProjects();
    renderSoftware();
    showToast('All data cleared!');
}

function resetToDefaults(): void {
    if (!confirm('Reset all data to defaults? This will replace current data with the default content including comprehensive Pinecraft and P4wnP1 documentation.')) return;
    
    localStorage.removeItem(STORAGE_KEY);
    initializeDefaultData();
    renderAffiliates();
    renderProjects();
    renderSoftware();
    showToast('Data reset to defaults!');
}

// ============================================
// Utility Functions
// ============================================
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Editor Toolbar Functions
// ============================================
function insertFormat(formatType: string): void {
    const textarea = document.getElementById('sectionContent') as HTMLTextAreaElement;
    if (!textarea) return;
    
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
            } else {
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

function updateSectionHelp(): void {
    const sectionType = (document.getElementById('sectionType') as HTMLSelectElement)?.value;
    const helpText = document.getElementById('sectionHelpText');
    const codeOptions = document.getElementById('codeOptions');
    
    if (!helpText) return;
    
    // Show/hide code language selector
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

// Make functions available globally for onclick handlers
(window as any).insertFormat = insertFormat;
(window as any).updateSectionHelp = updateSectionHelp;

// Global function for inline onclick
(window as any).openSectionModalById = (sectionId: string, projectId: string) => {
    const data = getAdminData();
    const project = data.projects.find(p => p.id === projectId);
    const section = project?.sections.find(s => s.id === sectionId);
    if (section) {
        openSectionModal(section, projectId);
    }
};

// ============================================
// Initialization
// ============================================
function init(): void {
    // Setup login handler first
    setupLoginHandler();
    
    // Check authentication
    if (!isAuthenticated()) {
        showLoginOverlay();
        return;
    }
    
    // User is authenticated - initialize admin portal
    hideLoginOverlay();
    initializeAdminPortal();
}

// Track initialization state to prevent duplicate event listeners
let adminPortalInitialized = false;

function initializeAdminPortal(): void {
    // Prevent double initialization
    if (adminPortalInitialized) {
        // Just re-render data if already initialized
        renderAffiliates();
        renderProjects();
        renderSoftware();
        return;
    }
    adminPortalInitialized = true;
    
    setupNavigation();
    setupModalCloseHandlers();
    setupIconSelectors();
    setupThemeSelectors();
    setupGithubHandlers();
    
    // Render initial data
    renderAffiliates();
    renderProjects();
    renderSoftware();
    
    // Form submissions
    document.getElementById('affiliateForm')?.addEventListener('submit', saveAffiliate);
    document.getElementById('projectForm')?.addEventListener('submit', saveProject);
    document.getElementById('softwareForm')?.addEventListener('submit', saveSoftware);
    document.getElementById('sectionForm')?.addEventListener('submit', saveSection);
    
    // Add buttons
    document.getElementById('addAffiliate')?.addEventListener('click', () => openAffiliateModal());
    document.getElementById('addProject')?.addEventListener('click', () => openProjectModal());
    document.getElementById('addSoftware')?.addEventListener('click', () => openSoftwareModal());
    document.getElementById('addDocsSection')?.addEventListener('click', () => openSectionModal());
    
    // Import/Export
    document.getElementById('exportData')?.addEventListener('click', exportData);
    document.getElementById('exportSiteData')?.addEventListener('click', exportData);
    document.getElementById('importData')?.addEventListener('click', () => {
        document.getElementById('importFile')?.click();
    });
    document.getElementById('importFile')?.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) importData(file);
    });
    document.getElementById('clearAllData')?.addEventListener('click', clearAllData);
    document.getElementById('resetToDefaults')?.addEventListener('click', resetToDefaults);
    
    console.log('Admin Portal initialized');
}

// Run initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
