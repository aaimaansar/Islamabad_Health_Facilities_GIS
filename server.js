// Islamabad Health Facilities GIS - backend API
// Node.js + Express, connected to PostgreSQL / PostGIS

require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const pool = require("./db");
const { validateFacility, TYPES, OWNERSHIP, STATUS, SOURCES, LIMITS } = require("./validation");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

// columns sent to the website (geometry is split into lat / lng)
const COLUMNS = `
    id, name, facility_type, specialty, sector, ownership, emergency, status,
    phone, data_source, osm_ref, remarks,
    ROUND(ST_Y(geom)::numeric, 6)::float AS lat,
    ROUND(ST_X(geom)::numeric, 6)::float AS lng,
    TO_CHAR(updated_at, 'DD Mon YYYY HH24:MI') AS updated_at`;

/* ---------- simple editor login ---------- */

// token = expiry time + signature, valid for 8 hours
function makeToken() {
    const expires = String(Date.now() + 8 * 60 * 60 * 1000);
    const sign = crypto.createHmac("sha256", process.env.TOKEN_SECRET).update(expires).digest("hex");
    return expires + "." + sign;
}

function tokenIsValid(token) {
    if (typeof token !== "string" || !token.includes(".")) return false;
    const [expires, sign] = token.split(".");
    if (!(Number(expires) > Date.now())) return false;
    const expected = crypto.createHmac("sha256", process.env.TOKEN_SECRET).update(expires).digest("hex");
    return sign.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(sign), Buffer.from(expected));
}

function requireLogin(req, res, next) {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!tokenIsValid(token)) {
        return res.status(401).json({ error: "Please log in as editor first." });
    }
    next();
}

app.post("/api/login", (req, res) => {
    const password = String((req.body && req.body.password) || "");
    const correct = String(process.env.EDITOR_PASSWORD || "");
    const a = crypto.createHash("sha256").update(password).digest();
    const b = crypto.createHash("sha256").update(correct).digest();
    if (!correct || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json({ error: "Wrong password." });
    }
    res.json({ token: makeToken() });
});

/* ---------- read routes ---------- */

// drop-down values for the filters and the form
app.get("/api/options", async (req, res, next) => {
    try {
        const result = await pool.query("SELECT DISTINCT sector FROM health_facilities ORDER BY sector");
        res.json({
            types: TYPES, ownership: OWNERSHIP, status: STATUS, sources: SOURCES, limits: LIMITS,
            sectors: result.rows.map(r => r.sector)
        });
    } catch (err) { next(err); }
});

// all facilities, with optional filters: ?type=&sector=&ownership=&emergency=&search=
app.get("/api/facilities", async (req, res, next) => {
    try {
        const conditions = [];
        const values = [];
        const { type, sector, ownership, emergency, search } = req.query;

        if (type) {
            if (!TYPES.includes(type)) return res.status(400).json({ error: "Unknown facility type." });
            values.push(type);
            conditions.push("facility_type = $" + values.length);
        }
        if (ownership) {
            if (!OWNERSHIP.includes(ownership)) return res.status(400).json({ error: "Unknown ownership." });
            values.push(ownership);
            conditions.push("ownership = $" + values.length);
        }
        if (sector) {
            values.push(String(sector).slice(0, 30));
            conditions.push("sector = $" + values.length);
        }
        if (emergency === "yes" || emergency === "no") {
            values.push(emergency === "yes");
            conditions.push("emergency = $" + values.length);
        }
        if (search && String(search).trim()) {
            values.push("%" + String(search).trim().slice(0, 60) + "%");
            conditions.push("(name ILIKE $" + values.length + " OR specialty ILIKE $" + values.length + ")");
        }

        const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
        const result = await pool.query(`SELECT ${COLUMNS} FROM health_facilities ${where} ORDER BY name`, values);
        res.json(result.rows);
    } catch (err) { next(err); }
});

app.get("/api/facilities/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid id." });
        const result = await pool.query(`SELECT ${COLUMNS} FROM health_facilities WHERE id = $1`, [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Facility not found." });
        res.json(result.rows[0]);
    } catch (err) { next(err); }
});

// counts for the summary box
app.get("/api/stats", async (req, res, next) => {
    try {
        const total = await pool.query(`
            SELECT COUNT(*)::int AS total,
                   COUNT(*) FILTER (WHERE emergency)::int AS emergency,
                   COUNT(DISTINCT sector)::int AS sectors
            FROM health_facilities`);
        const byType = await pool.query(`
            SELECT facility_type, COUNT(*)::int AS count
            FROM health_facilities GROUP BY facility_type ORDER BY count DESC`);
        res.json({ ...total.rows[0], byType: byType.rows });
    } catch (err) { next(err); }
});

// spatial query: facilities within a distance of a clicked point
app.get("/api/nearby", async (req, res, next) => {
    try {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        const distance = Number(req.query.distance) || 2000;
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return res.status(400).json({ error: "Invalid coordinates." });
        }
        if (distance < 100 || distance > 10000) {
            return res.status(400).json({ error: "Distance must be between 100 and 10000 m." });
        }
        const result = await pool.query(`
            SELECT ${COLUMNS},
                   ROUND(ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography))::int AS distance_m
            FROM health_facilities
            WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
            ORDER BY distance_m`, [lat, lng, distance]);
        res.json(result.rows);
    } catch (err) { next(err); }
});

/* ---------- add / update / delete (editors only) ---------- */

async function writeLog(client, id, action, details) {
    await client.query(
        "INSERT INTO facility_log (facility_id, action, details) VALUES ($1, $2, $3)",
        [id, action, details.slice(0, 200)]);
}

// same name within 50 m is treated as a duplicate
async function findDuplicate(data, ignoreId) {
    const result = await pool.query(`
        SELECT id FROM health_facilities
        WHERE LOWER(name) = LOWER($1) AND id <> $4
          AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography, 50)`,
        [data.name, data.lat, data.lng, ignoreId || 0]);
    return result.rows.length > 0;
}

app.post("/api/facilities", requireLogin, async (req, res, next) => {
    const { errors, data } = validateFacility(req.body);
    if (Object.keys(errors).length) {
        return res.status(400).json({ error: "Please correct the form.", fields: errors });
    }
    let client;
    try {
        if (await findDuplicate(data)) {
            return res.status(409).json({ error: "This facility is already in the database at that location." });
        }
        client = await pool.connect();
        await client.query("BEGIN");
        const result = await client.query(`
            INSERT INTO health_facilities
                (name, facility_type, specialty, sector, ownership, emergency, status, phone, data_source, remarks, geom)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_SetSRID(ST_MakePoint($11, $12), 4326))
            RETURNING id`,
            [data.name, data.facility_type, data.specialty, data.sector, data.ownership, data.emergency,
             data.status, data.phone, data.data_source, data.remarks, data.lng, data.lat]);
        const id = result.rows[0].id;
        await writeLog(client, id, "INSERT", "Added " + data.name);
        await client.query("COMMIT");
        const saved = await pool.query(`SELECT ${COLUMNS} FROM health_facilities WHERE id = $1`, [id]);
        res.status(201).json(saved.rows[0]);
    } catch (err) {
        if (client) await client.query("ROLLBACK");
        next(err);
    } finally {
        if (client) client.release();
    }
});

app.put("/api/facilities/:id", requireLogin, async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid id." });
    const { errors, data } = validateFacility(req.body);
    if (Object.keys(errors).length) {
        return res.status(400).json({ error: "Please correct the form.", fields: errors });
    }
    let client;
    try {
        if (await findDuplicate(data, id)) {
            return res.status(409).json({ error: "Another record with this name is already at that location." });
        }
        client = await pool.connect();
        await client.query("BEGIN");
        const result = await client.query(`
            UPDATE health_facilities SET
                name = $1, facility_type = $2, specialty = $3, sector = $4, ownership = $5,
                emergency = $6, status = $7, phone = $8, data_source = $9, remarks = $10,
                geom = ST_SetSRID(ST_MakePoint($11, $12), 4326), updated_at = NOW()
            WHERE id = $13`,
            [data.name, data.facility_type, data.specialty, data.sector, data.ownership, data.emergency,
             data.status, data.phone, data.data_source, data.remarks, data.lng, data.lat, id]);
        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Facility not found." });
        }
        await writeLog(client, id, "UPDATE", "Updated " + data.name);
        await client.query("COMMIT");
        const saved = await pool.query(`SELECT ${COLUMNS} FROM health_facilities WHERE id = $1`, [id]);
        res.json(saved.rows[0]);
    } catch (err) {
        if (client) await client.query("ROLLBACK");
        next(err);
    } finally {
        if (client) client.release();
    }
});

app.delete("/api/facilities/:id", requireLogin, async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid id." });
    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        const result = await client.query("DELETE FROM health_facilities WHERE id = $1 RETURNING name", [id]);
        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Facility not found." });
        }
        await writeLog(client, null, "DELETE", "Deleted " + result.rows[0].name + " (id " + id + ")");
        await client.query("COMMIT");
        res.json({ message: "Facility deleted." });
    } catch (err) {
        if (client) await client.query("ROLLBACK");
        next(err);
    } finally {
        if (client) client.release();
    }
});

/* ---------- errors ---------- */

app.use("/api", (req, res) => res.status(404).json({ error: "API route not found." }));

app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON." });
    console.error(err.message);
    res.status(500).json({ error: "Database error, please try again." });
});

app.listen(PORT, () => {
    console.log("Server running at http://localhost:" + PORT);
});
