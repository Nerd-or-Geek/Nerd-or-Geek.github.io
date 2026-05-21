// My Mission setup:
// 1. Create a Google Sheet with columns:
//    Week, PublishDate, ScriptureReference, ScriptureText, Thoughts, MissionUpdate,
//    Google Photos album, Google Photos links, Status, Notes
// 2. Connect the sheet through a JSON service like OpenSheet. The browser
//    fetches this URL at page load, so sheet edits do not require a rebuild.
// 3. Paste the shared Google Photos album URL into the "Google Photos album" column.
// 4. Paste individual Google Photos photo links into the "Google Photos links" column.
//    Separate multiple links with new lines, commas, semicolons, or spaces.
// 5. Set Status to Published when a week should appear.
//
// OpenSheet endpoint format:
// https://opensheet.elk.sh/YOUR_SHEET_ID/Sheet1
//
// Google Photos note:
// Google Photos page links usually cannot be used as direct image files. Regular
// photos.google.com links are shown as clickable photo cards. Direct image URLs
// ending in .jpg, .jpeg, .png, .webp, or .gif, plus googleusercontent.com image
// URLs, are displayed as lazy-loaded embedded images.
const MISSION_SHEET_URL = "https://opensheet.elk.sh/1T5kn9D8VtBvk6cuByWadV8twAH_nAE-QR0q7qUZ7H8Q/MissionData";
const MY_MISSION_PASSWORD_HASH = "__MY_MISSION_PASSWORD_HASH__";
const PASSWORD_HASH_PLACEHOLDER = ["__MY", "MISSION", "PASSWORD", "HASH__"].join("_");
const MISSION_AUTH_STORAGE_KEY = "myMissionAuthenticated";

const passwordPanel = document.getElementById("missionPasswordPanel");
const passwordForm = document.getElementById("missionPasswordForm");
const passwordInput = document.getElementById("missionPasswordInput");
const passwordMessage = document.getElementById("missionPasswordMessage");
const protectedContent = document.getElementById("missionProtectedContent");
const entriesContainer = document.getElementById("missionEntries");
const statusElement = document.getElementById("missionStatus");
const weekSelector = document.getElementById("missionWeekSelector");
const lastUpdatedElement = document.getElementById("missionLastUpdated");
const refreshButton = document.getElementById("missionRefreshButton");
const logoutButton = document.getElementById("missionLogoutButton");

let publishedEntries = [];
let selectedWeek = "all";
let isLoadingMissionEntries = false;
let hasStartedMissionPage = false;

function setStatus(message, type = "info") {
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.dataset.status = type;
    statusElement.hidden = false;
}

function clearStatus() {
    if (!statusElement) return;
    statusElement.textContent = "";
    statusElement.hidden = true;
}

function setPasswordMessage(message, type = "info") {
    if (!passwordMessage) return;
    passwordMessage.textContent = message;
    passwordMessage.dataset.status = type;
}

function passwordHashIsConfigured() {
    return Boolean(MY_MISSION_PASSWORD_HASH) &&
        MY_MISSION_PASSWORD_HASH !== PASSWORD_HASH_PLACEHOLDER;
}

function arrayBufferToHex(buffer) {
    return [...new Uint8Array(buffer)]
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function sha256Hex(value) {
    const encodedValue = new TextEncoder().encode(value);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedValue);
    return arrayBufferToHex(hashBuffer);
}

function missionSessionIsAuthenticated() {
    return sessionStorage.getItem(MISSION_AUTH_STORAGE_KEY) === "true";
}

function showProtectedMissionContent() {
    if (passwordPanel) passwordPanel.hidden = true;
    if (protectedContent) protectedContent.hidden = false;
}

function startMissionPage() {
    if (hasStartedMissionPage) return;

    hasStartedMissionPage = true;
    showProtectedMissionContent();

    if (refreshButton) {
        refreshButton.addEventListener("click", () => {
            loadMissionEntries();
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", handleMissionLogout);
    }

    loadMissionEntries();
}

function handleMissionLogout() {
    sessionStorage.removeItem(MISSION_AUTH_STORAGE_KEY);
    hasStartedMissionPage = false;
    if (passwordPanel) passwordPanel.hidden = false;
    if (protectedContent) protectedContent.hidden = true;
    if (passwordInput) {
        passwordInput.value = "";
        passwordInput.focus();
    }
    if (passwordMessage) passwordMessage.textContent = "";
}

async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (!passwordHashIsConfigured()) {
        setPasswordMessage("Password protection is not configured yet.", "error");
        return;
    }

    const submittedPassword = passwordInput?.value || "";
    if (!submittedPassword) {
        setPasswordMessage("Enter the password to continue.", "error");
        return;
    }

    const submitButton = passwordForm?.querySelector("button[type='submit']");
    if (submitButton) submitButton.disabled = true;
    setPasswordMessage("Checking password...", "info");

    try {
        const submittedHash = await sha256Hex(submittedPassword);
        if (submittedHash.toLowerCase() !== MY_MISSION_PASSWORD_HASH.trim().toLowerCase()) {
            setPasswordMessage("That password did not work. Please try again.", "error");
            if (passwordInput) {
                passwordInput.value = "";
                passwordInput.focus();
            }
            return;
        }

        sessionStorage.setItem(MISSION_AUTH_STORAGE_KEY, "true");
        if (passwordInput) passwordInput.value = "";
        startMissionPage();
    } catch (error) {
        console.error("Mission password check failed:", error);
        setPasswordMessage("This browser could not check the password. Please try again with an updated browser.", "error");
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

function setRefreshButtonLoading(isLoading) {
    if (!refreshButton) return;

    refreshButton.disabled = isLoading;
    refreshButton.innerHTML = isLoading
        ? '<i class="fas fa-rotate-right"></i> Refreshing...'
        : '<i class="fas fa-rotate-right"></i> Refresh updates';
}

function setLastUpdated(date = new Date()) {
    if (!lastUpdatedElement) return;

    lastUpdatedElement.textContent = `Last updated: ${new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(date)}`;
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value || "";
    return div.innerHTML;
}

function formatText(value) {
    return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function parsePublishDate(value) {
    if (!value) return null;
    const normalizedValue = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
        const [year, month, day] = normalizedValue.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    const date = new Date(normalizedValue);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getWeekNumber(entry) {
    const week = Number(entry.Week);
    return Number.isFinite(week) ? week : 0;
}

function formatDate(value) {
    const date = parsePublishDate(value);
    if (!date) return "Publish date not set";

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    }).format(date);
}

function normalizeHeader(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function findHeaderRowIndex(rows) {
    return rows.findIndex(row => {
        const normalizedHeaders = row.map(normalizeHeader);
        return normalizedHeaders.includes("week") &&
            normalizedHeaders.includes("publishdate") &&
            normalizedHeaders.includes("status");
    });
}

function rowsToObjectsFromMatrix(rows) {
    const headerRowIndex = findHeaderRowIndex(rows);
    if (headerRowIndex === -1) return [];

    const headers = rows[headerRowIndex].map((header, index) => String(header || "").trim() || `Column${index + 1}`);
    return rows.slice(headerRowIndex + 1)
        .filter(row => row.some(value => String(value || "").trim() !== ""))
        .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])))
        .filter(entry => String(entry.Week || "").trim() !== "");
}

function getKnownColumnValue(row, columnName) {
    const directValue = row[columnName];
    if (directValue !== undefined) return directValue;

    const normalizedColumnName = normalizeHeader(columnName);
    const matchingKey = Object.keys(row).find(key => normalizeHeader(key) === normalizedColumnName);
    return matchingKey ? row[matchingKey] : undefined;
}

function objectRowsHaveUsableHeaders(rows) {
    return rows.some(row =>
        getKnownColumnValue(row, "Week") !== undefined &&
        getKnownColumnValue(row, "PublishDate") !== undefined &&
        getKnownColumnValue(row, "Status") !== undefined
    );
}

function normalizeSheetRows(data) {
    if (Array.isArray(data)) {
        if (objectRowsHaveUsableHeaders(data)) {
            return data;
        }
        return rowsToObjectsFromMatrix(data.map(row => Object.values(row)));
    }

    if (Array.isArray(data?.rows)) {
        if (objectRowsHaveUsableHeaders(data.rows)) {
            return data.rows;
        }
        return rowsToObjectsFromMatrix(data.rows.map(row => Object.values(row)));
    }

    if (Array.isArray(data?.values)) {
        return rowsToObjectsFromMatrix(data.values);
    }

    return [];
}

async function fetchMissionRows() {
    const response = await fetch(MISSION_SHEET_URL, {
        cache: "no-store",
        headers: {
            "Cache-Control": "no-cache"
        }
    });

    if (!response.ok) {
        throw new Error(`Sheet request failed with ${response.status}`);
    }

    const data = await response.json();
    return normalizeSheetRows(data);
}

function entryIsPublished(entry) {
    return String(entry.Status || "").trim().toLowerCase() === "published";
}

function sortEntriesNewestFirst(a, b) {
    return getWeekNumber(b) - getWeekNumber(a);
}

function getWeekId(entry) {
    return String(entry.Week || "").trim();
}

function getUniquePublishedWeeks(entries) {
    const seen = new Set();
    return entries.filter(entry => {
        const weekId = getWeekId(entry);
        if (!weekId || seen.has(weekId)) return false;
        seen.add(weekId);
        return true;
    });
}

function renderWeekSelector(entries) {
    if (!weekSelector) return;

    const weeks = getUniquePublishedWeeks(entries);
    if (weeks.length === 0) {
        weekSelector.innerHTML = "";
        return;
    }

    const buttons = [
        `<button type="button" class="mission-week-button${selectedWeek === "all" ? " active" : ""}" data-week="all" aria-pressed="${selectedWeek === "all"}">All Weeks</button>`,
        ...weeks.map(entry => {
            const weekId = getWeekId(entry);
            const isActive = selectedWeek === weekId;
            return `<button type="button" class="mission-week-button${isActive ? " active" : ""}" data-week="${escapeHtml(weekId)}" aria-pressed="${isActive}">Week ${escapeHtml(weekId)}</button>`;
        })
    ];

    weekSelector.innerHTML = buttons.join("");
    weekSelector.querySelectorAll("[data-week]").forEach(button => {
        button.addEventListener("click", () => {
            selectedWeek = button.dataset.week || "all";
            renderMissionView();
        });
    });
}

function getGooglePhotosAlbumUrl(entry) {
    return String(entry["Google Photos album"] || "").trim();
}

function getGooglePhotosLinks(entry) {
    const rawLinks = String(entry["Google Photos links"] || "");
    const extractedLinks = rawLinks.match(/https?:\/\/[^\s,;]+/g);

    if (extractedLinks) {
        return extractedLinks.map(link => link.trim()).filter(Boolean);
    }

    return rawLinks
        .split(/[\s,;]+/)
        .map(link => link.trim())
        .filter(Boolean);
}

function isDirectImageUrl(url) {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname.endsWith("googleusercontent.com")) {
            return true;
        }
        return /\.(jpe?g|png|webp|gif)$/i.test(parsedUrl.pathname);
    } catch {
        return /\.(jpe?g|png|webp|gif)(?:[?#].*)?$/i.test(url);
    }
}

function renderIndividualPhotoLinks(entry) {
    const links = getGooglePhotosLinks(entry);
    if (links.length === 0) return "";

    const directImageLinks = links.filter(isDirectImageUrl);
    const photoPageLinks = links.filter(link => !isDirectImageUrl(link));
    const weekLabel = escapeHtml(entry.Week || "");

    return `
        <section class="mission-individual-photos-section" aria-label="Week ${weekLabel} individual photos">
            <h4>Photos</h4>
            ${directImageLinks.length > 0 ? `
                <div class="mission-direct-photo-grid">
                    ${directImageLinks.map((link, index) => `
                        <a href="${escapeHtml(link)}" class="mission-direct-photo-link" target="_blank" rel="noopener noreferrer">
                            <img src="${escapeHtml(link)}" alt="Week ${weekLabel} mission photo ${index + 1}" loading="lazy">
                        </a>
                    `).join("")}
                </div>
            ` : ""}
            ${photoPageLinks.length > 0 ? `
                <div class="mission-photo-card-grid">
                    ${photoPageLinks.map((link, index) => `
                        <a href="${escapeHtml(link)}" class="mission-photo-card-link" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-image"></i>
                            <span>View Photo ${index + 1}</span>
                        </a>
                    `).join("")}
                </div>
            ` : ""}
        </section>
    `;
}

function renderPhotosLink(entry) {
    const albumUrl = getGooglePhotosAlbumUrl(entry);
    if (!albumUrl) return "";

    return `
        <section class="mission-photos-section" aria-label="Week ${escapeHtml(entry.Week)} photos">
            <a href="${escapeHtml(albumUrl)}" class="mission-photos-button" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-images"></i> View Full Google Photos Album
            </a>
        </section>
    `;
}

function renderEntry(entry) {
    const weekLabel = entry.Week ? `Week ${escapeHtml(entry.Week)}` : "Weekly Update";
    const title = escapeHtml(entry.Title || weekLabel);
    const scriptureReference = escapeHtml(entry.ScriptureReference || "Scripture");

    return `
        <article class="mission-card" tabindex="0">
            <div class="mission-card-content">
                <div class="mission-card-meta">
                    <span>${weekLabel}</span>
                    <time datetime="${escapeHtml(entry.PublishDate || "")}">${escapeHtml(formatDate(entry.PublishDate))}</time>
                </div>
                <h3>${title}</h3>
                <p class="mission-scripture-reference">${scriptureReference}</p>
                ${entry.ScriptureText ? `<blockquote>${formatText(entry.ScriptureText)}</blockquote>` : ""}
                ${entry.Thoughts ? `
                    <section class="mission-card-section" aria-label="My thoughts">
                        <h4>My Thoughts</h4>
                        <p>${formatText(entry.Thoughts)}</p>
                    </section>
                ` : ""}
                ${entry.MissionUpdate ? `
                    <section class="mission-card-section" aria-label="Mission update">
                        <h4>Mission Update</h4>
                        <p>${formatText(entry.MissionUpdate)}</p>
                    </section>
                ` : ""}
                ${renderIndividualPhotoLinks(entry)}
                ${renderPhotosLink(entry)}
            </div>
        </article>
    `;
}

function getVisibleEntries() {
    if (selectedWeek === "all") {
        return publishedEntries;
    }

    return publishedEntries.filter(entry => getWeekId(entry) === selectedWeek);
}

function renderMissionView() {
    if (!entriesContainer) return;

    renderWeekSelector(publishedEntries);

    if (publishedEntries.length === 0) {
        entriesContainer.innerHTML = "";
        setStatus("No mission updates have been published yet.", "empty");
        return;
    }

    const visibleEntries = getVisibleEntries();
    entriesContainer.innerHTML = visibleEntries.map(entry => renderEntry(entry)).join("");
    clearStatus();
}

async function loadMissionEntries() {
    if (!entriesContainer || isLoadingMissionEntries) return;

    isLoadingMissionEntries = true;
    const previousSelectedWeek = selectedWeek;
    setRefreshButtonLoading(true);
    setStatus("Loading mission updates...", "info");

    try {
        publishedEntries = (await fetchMissionRows())
            .filter(entryIsPublished)
            .sort(sortEntriesNewestFirst);

        const publishedWeekIds = new Set(publishedEntries.map(getWeekId));
        selectedWeek = previousSelectedWeek === "all" || publishedWeekIds.has(previousSelectedWeek)
            ? previousSelectedWeek
            : "all";

        renderMissionView();
        setLastUpdated();
    } catch (error) {
        console.error("Mission sheet load failed:", error);
        entriesContainer.innerHTML = "";
        if (weekSelector) weekSelector.innerHTML = "";
        setStatus("Mission updates could not be loaded. Check that the Google Sheet is public and the OpenSheet endpoint is available.", "error");
    } finally {
        isLoadingMissionEntries = false;
        setRefreshButtonLoading(false);
    }
}

function initMissionPage() {
    if (passwordForm) {
        passwordForm.addEventListener("submit", handlePasswordSubmit);
    }

    if (!passwordHashIsConfigured()) {
        setPasswordMessage("Password protection is not configured yet.", "error");
        if (passwordInput) passwordInput.disabled = true;
        const submitButton = passwordForm?.querySelector("button[type='submit']");
        if (submitButton) submitButton.disabled = true;
        return;
    }

    if (missionSessionIsAuthenticated()) {
        startMissionPage();
    } else if (passwordInput) {
        passwordInput.focus();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMissionPage);
} else {
    initMissionPage();
}
