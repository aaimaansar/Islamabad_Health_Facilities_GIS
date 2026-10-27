"use strict";

// 1. Map setup (centre of Islamabad)
const map = L.map("map").setView([33.69, 73.05], 12);

const streets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19,
    attribution: "Imagery &copy; Esri"
});

const facilityLayer = L.layerGroup().addTo(map);
const nearbyLayer = L.layerGroup().addTo(map);

L.control.layers(
    { "Street map": streets, "Satellite": satellite },
    { "Health facilities": facilityLayer }
).addTo(map);
L.control.scale({ imperial: false }).addTo(map);

// marker colour for each facility type
const COLORS = {
    "Hospital": "#c62828",
    "Clinic": "#1565c0",
    "Diagnostic Lab": "#ef8f00",
    "Dispensary": "#2e7d32"
};

const legend = L.control({ position: "bottomright" });
legend.onAdd = function () {
    const div = L.DomUtil.create("div", "legend");
    div.innerHTML = "<strong>Facility type</strong><br>" + Object.keys(COLORS)
        .map(type => `<span class="dot" style="background:${COLORS[type]}"></span>${type}`)
        .join("<br>");
    return div;
};
legend.addTo(map);

// 2. Page elements
const el = id => document.getElementById(id);
const filters = {
    search: el("searchInput"),
    type: el("typeFilter"),
    sector: el("sectorFilter"),
    ownership: el("ownershipFilter"),
    emergency: el("emergencyFilter")
};

let facilities = [];
let markers = {};
let token = sessionStorage.getItem("editorToken");
let pickMarker = null;

// 3. Helpers
function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[c]);
}

function showMessage(text, isError) {
    const box = el("message");
    box.textContent = text;
    box.className = "message" + (isError ? " fail" : "");
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => box.classList.add("hidden"), 5000);
}

function fillSelect(select, values, keepFirst) {
    const first = keepFirst ? select.options[0].outerHTML : "";
    select.innerHTML = first + values.map(v => `<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`).join("");
}

// fetch wrapper that returns the JSON or throws the API error message
async function api(url, options = {}) {
    options.headers = { "Content-Type": "application/json" };
    if (token) options.headers.Authorization = "Bearer " + token;
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.error || "Request failed (" + response.status + ")");
        error.status = response.status;
        error.fields = data.fields;
        throw error;
    }
    return data;
}

// 4. Load drop-down options from the database
async function loadOptions() {
    const options = await api("/api/options");
    fillSelect(filters.type, options.types, true);
    fillSelect(filters.ownership, options.ownership, true);
    fillSelect(filters.sector, options.sectors, true);
    fillSelect(el("f_type"), options.types, true);
    fillSelect(el("f_ownership"), options.ownership, true);
    fillSelect(el("f_status"), options.status, false);
    fillSelect(el("f_source"), options.sources, false);
    el("f_source").value = "User Added";
    el("sectorList").innerHTML = options.sectors.map(s => `<option value="${escapeHTML(s)}">`).join("");
}

// 5. Load facilities (with the selected filters) and draw them
async function loadFacilities() {
    const params = new URLSearchParams();
    for (const key in filters) {
        if (filters[key].value.trim()) params.set(key, filters[key].value.trim());
    }
    try {
        facilities = await api("/api/facilities?" + params.toString());
        drawFacilities();
    } catch (err) {
        el("resultCount").textContent = "Could not load data.";
        showMessage(err.message, true);
    }
}

function popupHTML(f) {
    let html = `<h3>${escapeHTML(f.name)}</h3>
        <table class="popup-table">
            <tr><td>Type</td><td>${escapeHTML(f.facility_type)}</td></tr>
            <tr><td>Specialty</td><td>${escapeHTML(f.specialty)}</td></tr>
            <tr><td>Sector</td><td>${escapeHTML(f.sector)}</td></tr>
            <tr><td>Ownership</td><td>${escapeHTML(f.ownership)}</td></tr>
            <tr><td>Emergency</td><td>${f.emergency ? "24 hours" : "No"}</td></tr>
            <tr><td>Status</td><td>${escapeHTML(f.status)}</td></tr>`;
    if (f.phone) html += `<tr><td>Phone</td><td>${escapeHTML(f.phone)}</td></tr>`;
    if (f.remarks) html += `<tr><td>Remarks</td><td>${escapeHTML(f.remarks)}</td></tr>`;
    html += `<tr><td>Source</td><td>${escapeHTML(f.data_source)}</td></tr>
            <tr><td>Updated</td><td>${escapeHTML(f.updated_at)}</td></tr>
        </table>`;
    if (token) {
        html += `<div class="popup-actions"><button class="small" onclick="editFacility(${f.id})">Edit this record</button></div>`;
    }
    return html;
}

function drawFacilities() {
    facilityLayer.clearLayers();
    markers = {};
    const list = el("facilityList");
    list.innerHTML = "";

    facilities.forEach(f => {
        const marker = L.circleMarker([f.lat, f.lng], {
            radius: f.facility_type === "Hospital" ? 8 : 6,
            color: "#fff",
            weight: 1.5,
            fillColor: COLORS[f.facility_type] || "#555",
            fillOpacity: 0.95
        }).bindPopup(() => popupHTML(f)).bindTooltip(f.name);
        marker.addTo(facilityLayer);
        markers[f.id] = marker;

        const item = document.createElement("li");
        item.innerHTML = `<strong><span class="dot" style="background:${COLORS[f.facility_type]}"></span>${escapeHTML(f.name)}</strong>
            <span>${escapeHTML(f.facility_type)} | ${escapeHTML(f.sector)} | ${escapeHTML(f.ownership)}</span>`;
        item.addEventListener("click", () => {
            map.setView([f.lat, f.lng], 16);
            setTimeout(() => marker.openPopup(), 400);
        });
        list.appendChild(item);
    });

    el("resultCount").textContent = facilities.length === 0
        ? "No facilities match these filters."
        : `Showing ${facilities.length} facilit${facilities.length === 1 ? "y" : "ies"}.`;
}

// filters reload the data from the API
let searchTimer;
filters.search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadFacilities, 300);
});
["type", "sector", "ownership", "emergency"].forEach(key => {
    filters[key].addEventListener("change", loadFacilities);
});
el("clearFilters").addEventListener("click", () => {
    for (const key in filters) filters[key].value = "";
    nearbyLayer.clearLayers();
    loadFacilities();
    map.setView([33.69, 73.05], 12);
});

// 6. Map click: set location for the form, or find nearby facilities
map.on("click", async e => {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);

    if (token) {
        el("f_lat").value = lat;
        el("f_lng").value = lng;
        clearLocationError();
        setPickMarker(lat, lng);
    }

    nearbyLayer.clearLayers();
    L.circle(e.latlng, { radius: 2000, color: "#23615a", weight: 1, fillOpacity: 0.06 }).addTo(nearbyLayer);
    try {
        const nearby = await api(`/api/nearby?lat=${lat}&lng=${lng}&distance=2000`);
        let html = `<strong>Within 2 km of this point (${nearby.length})</strong>`;
        if (nearby.length) {
            html += "<br>" + nearby.slice(0, 8)
                .map(f => `${escapeHTML(f.name)} - ${(f.distance_m / 1000).toFixed(2)} km`).join("<br>");
            if (nearby.length > 8) html += `<br>and ${nearby.length - 8} more`;
        } else {
            html += "<br>No facility found.";
        }
        if (token) html += `<br><em>Location copied to the form.</em>`;
        L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
    } catch (err) {
        showMessage(err.message, true);
    }
});

function setPickMarker(lat, lng) {
    if (pickMarker) pickMarker.setLatLng([lat, lng]);
    else pickMarker = L.marker([lat, lng], { draggable: true }).addTo(map);
    pickMarker.off("dragend").on("dragend", () => {
        const p = pickMarker.getLatLng();
        el("f_lat").value = p.lat.toFixed(6);
        el("f_lng").value = p.lng.toFixed(6);
    });
}

// 7. Editor login
function updateLoginView() {
    const loggedIn = Boolean(token);
    el("loginState").textContent = loggedIn ? "Logged in as editor" : "Viewing as guest";
    el("logoutButton").classList.toggle("hidden", !loggedIn);
    el("loginPanel").classList.toggle("hidden", loggedIn);
    el("editorPanel").classList.toggle("hidden", !loggedIn);
    if (!loggedIn && pickMarker) {
        map.removeLayer(pickMarker);
        pickMarker = null;
    }
}

el("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    el("loginError").textContent = "";
    const password = el("passwordInput").value;
    if (!password) {
        el("loginError").textContent = "Enter the password.";
        return;
    }
    try {
        const result = await api("/api/login", { method: "POST", body: JSON.stringify({ password }) });
        token = result.token;
        sessionStorage.setItem("editorToken", token);
        el("passwordInput").value = "";
        updateLoginView();
        showMessage("Logged in. You can now add and edit records.");
    } catch (err) {
        el("loginError").textContent = err.message;
    }
});

el("logoutButton").addEventListener("click", () => {
    token = null;
    sessionStorage.removeItem("editorToken");
    resetForm();
    updateLoginView();
    map.closePopup();
});

// 8. Add / edit form
const formFields = {
    name: "f_name", facility_type: "f_type", specialty: "f_specialty", sector: "f_sector",
    ownership: "f_ownership", status: "f_status", data_source: "f_source", phone: "f_phone",
    remarks: "f_remarks"
};

function clearErrors() {
    document.querySelectorAll("#facilityForm .error").forEach(e => e.textContent = "");
    document.querySelectorAll("#facilityForm .invalid").forEach(e => e.classList.remove("invalid"));
    el("formError").textContent = "";
}

function showFieldErrors(errors) {
    for (const key in errors) {
        const box = document.querySelector(`#facilityForm .error[data-for="${key}"]`);
        if (box) box.textContent = errors[key];
        if (formFields[key]) el(formFields[key]).classList.add("invalid");
        if (key === "location") {
            el("f_lat").classList.add("invalid");
            el("f_lng").classList.add("invalid");
        }
    }
}

// remove a field's error message as soon as the user changes it
for (const key in formFields) {
    const input = el(formFields[key]);
    const clear = () => {
        input.classList.remove("invalid");
        el("formError").textContent = "";
        const box = document.querySelector(`#facilityForm .error[data-for="${key}"]`);
        if (box) box.textContent = "";
    };
    input.addEventListener("input", clear);
    input.addEventListener("change", clear);
}
["f_lat", "f_lng"].forEach(id => el(id).addEventListener("input", clearLocationError));

function clearLocationError() {
    el("f_lat").classList.remove("invalid");
    el("f_lng").classList.remove("invalid");
    document.querySelector('#facilityForm .error[data-for="location"]').textContent = "";
}

function resetForm() {
    el("facilityForm").reset();
    el("facilityId").value = "";
    el("f_source").value = "User Added";
    el("formTitle").textContent = "Add a new facility";
    el("formHint").textContent = "Fill in the form and click on the map to set the location.";
    el("saveButton").textContent = "Save record";
    el("deleteButton").classList.add("hidden");
    clearErrors();
    if (pickMarker) {
        map.removeLayer(pickMarker);
        pickMarker = null;
    }
}

el("newButton").addEventListener("click", resetForm);

// opened from the popup button
window.editFacility = function (id) {
    const f = facilities.find(x => x.id === id);
    if (!f) return;
    resetForm();
    el("facilityId").value = f.id;
    el("f_name").value = f.name;
    el("f_type").value = f.facility_type;
    el("f_specialty").value = f.specialty;
    el("f_sector").value = f.sector;
    el("f_ownership").value = f.ownership;
    el("f_emergency").value = f.emergency ? "yes" : "no";
    el("f_status").value = f.status;
    el("f_source").value = f.data_source;
    el("f_phone").value = f.phone || "";
    el("f_remarks").value = f.remarks || "";
    el("f_lat").value = f.lat;
    el("f_lng").value = f.lng;
    setPickMarker(f.lat, f.lng);
    el("formTitle").textContent = "Edit: " + f.name;
    el("formHint").textContent = "Change the details, or drag the blue marker to move the facility.";
    el("saveButton").textContent = "Update record";
    el("deleteButton").classList.remove("hidden");
    map.closePopup();
    el("editorPanel").scrollIntoView({ behavior: "smooth" });
};

// checks in the browser (the server checks again)
function checkForm(data) {
    const errors = {};
    if (data.name.length < 3) errors.name = "Name must be at least 3 characters.";
    if (!data.facility_type) errors.facility_type = "Choose a facility type.";
    if (!data.sector) errors.sector = "Sector is required.";
    if (!data.ownership) errors.ownership = "Choose the ownership.";
    if (data.phone && !/^[0-9+\- ]{7,20}$/.test(data.phone)) errors.phone = "Phone can only have digits, spaces, + and -.";
    if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng) ||
        data.lat < 33.45 || data.lat > 33.85 || data.lng < 72.75 || data.lng > 73.40) {
        errors.location = "Click on the map to set a location inside Islamabad.";
    }
    return errors;
}

el("facilityForm").addEventListener("submit", async e => {
    e.preventDefault();
    clearErrors();

    const data = {
        name: el("f_name").value.trim(),
        facility_type: el("f_type").value,
        specialty: el("f_specialty").value.trim(),
        sector: el("f_sector").value.trim(),
        ownership: el("f_ownership").value,
        emergency: el("f_emergency").value === "yes",
        status: el("f_status").value,
        data_source: el("f_source").value,
        phone: el("f_phone").value.trim(),
        remarks: el("f_remarks").value.trim(),
        lat: el("f_lat").value.trim() === "" ? NaN : Number(el("f_lat").value),
        lng: el("f_lng").value.trim() === "" ? NaN : Number(el("f_lng").value)
    };

    const errors = checkForm(data);
    if (Object.keys(errors).length) {
        showFieldErrors(errors);
        el("formError").textContent = "Please correct the highlighted fields.";
        return;
    }

    const id = el("facilityId").value;
    try {
        const saved = await api(id ? "/api/facilities/" + id : "/api/facilities", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(data)
        });
        showMessage(id ? `"${saved.name}" updated in the database.` : `"${saved.name}" added to the database (id ${saved.id}).`);
        resetForm();
        await loadOptions();
        await loadFacilities();
        map.setView([saved.lat, saved.lng], 16);
        if (markers[saved.id]) markers[saved.id].openPopup();
    } catch (err) {
        if (err.status === 401) {
            token = null;
            sessionStorage.removeItem("editorToken");
            updateLoginView();
        }
        if (err.fields) showFieldErrors(err.fields);
        el("formError").textContent = err.message;
    }
});

el("deleteButton").addEventListener("click", async () => {
    const id = el("facilityId").value;
    if (!id || !confirm("Delete this facility from the database?")) return;
    try {
        await api("/api/facilities/" + id, { method: "DELETE" });
        showMessage("Record deleted.");
        resetForm();
        await loadFacilities();
    } catch (err) {
        el("formError").textContent = err.message;
    }
});

// 9. Start
updateLoginView();
loadOptions()
    .then(loadFacilities)
    .catch(err => {
        el("resultCount").textContent = "Could not connect to the server.";
        showMessage(err.message, true);
    });
