declare const ADMIN_PASSWORD_HASH = "adf3862f5831cccd16da7b4b9a5ac73365270622e97e30782bf24db0161e7f68";
declare const AUTH_KEY = "nerdOrGeekAdminAuth";
declare const AUTH_EXPIRY_HOURS = 24;
declare function hashPassword(password: string): Promise<string>;
declare function isAuthenticated(): boolean;
declare function setAuthenticated(): void;
declare function logout(): void;
declare function attemptLogin(password: string): Promise<boolean>;
declare function showLoginOverlay(): void;
declare function hideLoginOverlay(): void;
declare function setupLoginHandler(): void;
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
interface Project {
    id: string;
    name: string;
    description: string;
    badge: string;
    tags: string[];
    icon: string;
    customImage?: string;
    sections: ProjectSection[];
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
declare const STORAGE_KEY = "nerdOrGeekAdminData";
declare const DEFAULT_AFFILIATES: Affiliate[];
declare const DEFAULT_PROJECTS: Project[];
declare const DEFAULT_SOFTWARE: Software[];
declare function getAdminData(): AdminData;
declare function initializeDefaultData(): AdminData;
declare function saveAdminData(data: AdminData): void;
declare function generateId(): string;
declare function showToast(message: string, isError?: boolean): void;
declare function openModal(modalId: string): void;
declare function closeModal(modalId: string): void;
declare function setupModalCloseHandlers(): void;
declare function setupIconSelectors(): void;
declare function setupNavigation(): void;
declare function renderAffiliates(): void;
declare function openAffiliateModal(affiliate?: Affiliate): void;
declare function saveAffiliate(e: Event): void;
declare function renderProjects(): void;
declare function openProjectModal(project?: Project): void;
declare function saveProject(e: Event): void;
declare let currentEditingSection: ProjectSection | null;
declare function openDocsEditor(projectId: string): void;
declare function renderDocsSections(project: Project): void;
declare function selectSection(section: ProjectSection, projectId: string): void;
declare function openSectionModal(section?: ProjectSection, projectId?: string): void;
declare function saveSection(e: Event): void;
declare function deleteSection(sectionId: string, projectId: string): void;
declare function renderSoftware(): void;
declare function openSoftwareModal(software?: Software): void;
declare function saveSoftware(e: Event): void;
declare function setupItemActions(): void;
declare function exportData(): void;
declare function importData(file: File): void;
declare function clearAllData(): void;
declare function escapeHtml(text: string): string;
declare function insertFormat(formatType: string): void;
declare function updateSectionHelp(): void;
declare function init(): void;
declare let adminPortalInitialized: boolean;
declare function initializeAdminPortal(): void;
//# sourceMappingURL=admin.d.ts.map