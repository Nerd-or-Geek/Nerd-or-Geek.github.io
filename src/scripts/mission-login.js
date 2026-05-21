const MY_MISSION_PASSWORD_HASH = "__MY_MISSION_PASSWORD_HASH__";
const MISSION_AUTH_STORAGE_KEY = "myMissionAuthenticated";

if (localStorage.getItem(MISSION_AUTH_STORAGE_KEY) === "true") {
    window.location.replace("my-mission.html");
}

function arrayBufferToHex(buffer) {
    return [...new Uint8Array(buffer)]
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function handleLoginSubmit(event) {
    event.preventDefault();

    const input = document.getElementById("missionPasswordInput");
    const message = document.getElementById("missionPasswordMessage");
    const submitButton = event.currentTarget.querySelector("button[type='submit']");

    const password = input?.value || "";
    if (!password) {
        if (message) { message.textContent = "Enter the password to continue."; message.dataset.status = "error"; }
        return;
    }

    if (submitButton) submitButton.disabled = true;
    if (message) { message.textContent = "Checking..."; message.dataset.status = "info"; }

    try {
        const encoded = new TextEncoder().encode(password);
        const buffer = await crypto.subtle.digest("SHA-256", encoded);
        const hash = arrayBufferToHex(buffer);

        if (hash.toLowerCase() !== MY_MISSION_PASSWORD_HASH.trim().toLowerCase()) {
            if (message) { message.textContent = "That password did not work. Please try again."; message.dataset.status = "error"; }
            if (input) { input.value = ""; input.focus(); }
            return;
        }

        localStorage.setItem(MISSION_AUTH_STORAGE_KEY, "true");
        window.location.replace("my-mission.html");
    } catch {
        if (message) { message.textContent = "Could not verify password. Please try an updated browser."; message.dataset.status = "error"; }
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

const form = document.getElementById("missionLoginForm");
if (form) {
    form.addEventListener("submit", handleLoginSubmit);
}

document.getElementById("missionPasswordInput")?.focus();
