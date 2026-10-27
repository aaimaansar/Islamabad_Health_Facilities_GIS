// Checks the data sent from the website form before it goes into the database

const TYPES = ["Hospital", "Clinic", "Diagnostic Lab", "Dispensary"];
const OWNERSHIP = ["Public", "Private", "Semi-Government", "Armed Forces"];
const STATUS = ["Operational", "Temporarily Closed", "Not Verified"];
const SOURCES = ["OpenStreetMap", "Field Visit", "User Added"];

// rough box around Islamabad Capital Territory
const LIMITS = { minLat: 33.45, maxLat: 33.85, minLng: 72.75, maxLng: 73.40 };

function cleanText(value) {
    return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function validateFacility(body) {
    const errors = {};
    body = body || {};

    const name = cleanText(body.name);
    const facility_type = cleanText(body.facility_type);
    const specialty = cleanText(body.specialty) || "General";
    const sector = cleanText(body.sector).toUpperCase();
    const ownership = cleanText(body.ownership);
    const status = cleanText(body.status) || "Operational";
    const data_source = cleanText(body.data_source) || "User Added";
    const phone = cleanText(body.phone);
    const remarks = cleanText(body.remarks);
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (name.length < 3 || name.length > 120) {
        errors.name = "Name must be 3 to 120 characters.";
    } else if (!/^[A-Za-z0-9 .,'()&\/-]+$/.test(name)) {
        errors.name = "Name has characters that are not allowed.";
    }
    if (!TYPES.includes(facility_type)) errors.facility_type = "Choose a facility type.";
    if (specialty.length > 40 || !/^[A-Za-z &-]+$/.test(specialty)) {
        errors.specialty = "Specialty can only have letters (max 40).";
    }
    // sectors look like G-8, F-10, I-11 or a place name like Chak Shahzad
    if (!/^[A-Z]-\d{1,2}(\/\d)?$/.test(sector) && !/^[A-Z][A-Z ]{2,29}$/.test(sector)) {
        errors.sector = "Enter a sector like G-8 or F-10, or an area name.";
    }
    if (!OWNERSHIP.includes(ownership)) errors.ownership = "Choose the ownership.";
    if (!STATUS.includes(status)) errors.status = "Choose a valid status.";
    if (!SOURCES.includes(data_source)) errors.data_source = "Choose a valid data source.";
    if (phone && !/^[0-9+\- ]{7,20}$/.test(phone)) errors.phone = "Phone can only have digits, spaces, + and - (7 to 20).";
    if (remarks.length > 300) errors.remarks = "Remarks must be under 300 characters.";
    if (typeof body.emergency !== "boolean") errors.emergency = "Emergency must be yes or no.";

    if (!Number.isFinite(lat) || lat < LIMITS.minLat || lat > LIMITS.maxLat ||
        !Number.isFinite(lng) || lng < LIMITS.minLng || lng > LIMITS.maxLng) {
        errors.location = "Location must be inside Islamabad. Click on the map to set it.";
    }

    // area names are stored in normal case, e.g. "Chak Shahzad"
    const sectorValue = /^[A-Z]-/.test(sector)
        ? sector
        : sector.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    return {
        errors,
        data: {
            name, facility_type, specialty, sector: sectorValue, ownership,
            emergency: body.emergency === true, status, data_source,
            phone: phone || null, remarks: remarks || null, lat, lng
        }
    };
}

module.exports = { validateFacility, TYPES, OWNERSHIP, STATUS, SOURCES, LIMITS };
