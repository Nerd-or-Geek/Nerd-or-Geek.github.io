// My Mission setup:
// 1. Create a Google Sheet with columns:
//    Week, PublishDate, ScriptureReference, ScriptureText, Thoughts, MissionUpdate, Google Photos album, Status
// 2. Publish the sheet to the web or connect it through a JSON service like OpenSheet.
// 3. Create one Google Photos album per week.
// 4. Set the album sharing so anyone with the link can view it.
// 5. Paste the shared album URL into the "Google Photos album" column.
// 6. Set Status to Published when a week should appear.
// 7. Future weeks should remain Draft or have a future PublishDate.
//
// OpenSheet endpoint format:
// https://opensheet.elk.sh/YOUR_SHEET_ID/Sheet1
//
// Google Photos note:
// This page links to Google Photos albums. It does not embed or fetch Google Photos
// images directly, which keeps the site simple and compatible with GitHub Pages.
const MISSION_SHEET_URL = "https://opensheet.elk.sh/1sR077VxVyUfXptI_agBSia20KYVH9I8cLHpSWIqc2ec/Sheet1";

const entriesContainer = document.getElementById("missionEntries");
const statusElement = document.getElementById("missionStatus");
const weekSelector = document.getElementById("missionWeekSelector");

let publishedEntries = [];
let selectedWeek = "all";

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

function getTodayEnd() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
}

function getWeekNumber(entry) {
    const week = Number(entry.Week);
    return Number.isFinite(week) ? week : 0;
}

function getSortTime(entry) {
    return parsePublishDate(entry.PublishDate)?.getTime() || 0;
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

function normalizeSheetRows(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.rows)) {
        return data.rows;
    }

    if (Array.isArray(data?.values)) {
        const [headers, ...rows] = data.values;
        return rows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
    }

    return [];
}

function entryIsPublished(entry) {
    const publishDate = parsePublishDate(entry.PublishDate);
    const status = String(entry.Status || "").trim().toLowerCase();
    return status === "published" && publishDate && publishDate.getTime() <= getTodayEnd().getTime();
}

function sortEntriesNewestFirst(a, b) {
    const weekDifference = getWeekNumber(b) - getWeekNumber(a);
    if (weekDifference !== 0) return weekDifference;

    return getSortTime(b) - getSortTime(a);
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

function renderPhotosLink(entry) {
    const albumUrl = getGooglePhotosAlbumUrl(entry);
    if (!albumUrl) return "";

    return `
        <section class="mission-photos-section" aria-label="Week ${escapeHtml(entry.Week)} photos">
            <a href="${escapeHtml(albumUrl)}" class="mission-photos-button" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-images"></i> View Week Photos
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
        setStatus("No published mission updates are available yet. Check back soon.", "empty");
        return;
    }

    const visibleEntries = getVisibleEntries();
    entriesContainer.innerHTML = visibleEntries.map(entry => renderEntry(entry)).join("");
    clearStatus();
}

async function loadMissionEntries() {
    if (!entriesContainer) return;

    setStatus("Loading mission updates...", "info");

    try {
        const response = await fetch(MISSION_SHEET_URL, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Sheet request failed with ${response.status}`);
        }

        const data = await response.json();
        publishedEntries = normalizeSheetRows(data)
            .filter(entryIsPublished)
            .sort(sortEntriesNewestFirst);

        selectedWeek = "all";
        renderMissionView();
    } catch (error) {
        console.error("Mission sheet load failed:", error);
        entriesContainer.innerHTML = "";
        if (weekSelector) weekSelector.innerHTML = "";
        setStatus("Mission updates could not be loaded right now. Please try again later.", "error");
    }
}

loadMissionEntries();
