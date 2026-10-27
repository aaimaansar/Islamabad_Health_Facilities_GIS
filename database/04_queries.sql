-- 04_queries.sql
-- Queries used to test the database before building the API.

-- 1. Retrieve all records with coordinates
SELECT id, name, facility_type, sector,
       ST_Y(geom) AS latitude, ST_X(geom) AS longitude
FROM health_facilities
ORDER BY id;

-- 2. Filter: public hospitals only
SELECT name, sector, ownership
FROM health_facilities
WHERE facility_type = 'Hospital' AND ownership = 'Public';

-- 3. Filter: facilities with 24 hour emergency in G sectors
SELECT name, sector
FROM health_facilities
WHERE emergency = TRUE AND sector LIKE 'G-%';

-- 4. Count facilities by type
SELECT facility_type, COUNT(*) AS total
FROM health_facilities
GROUP BY facility_type
ORDER BY total DESC;

-- 5. Count facilities by sector
SELECT sector, COUNT(*) AS total
FROM health_facilities
GROUP BY sector
ORDER BY total DESC, sector;

-- 6. Update a record (add a remark)
UPDATE health_facilities
SET remarks = 'Federal teaching hospital on Ibn-e-Sina Road', updated_at = NOW()
WHERE name = 'Pakistan Institute of Medical Sciences (PIMS)';

-- 7. Spatial query: facilities within 3 km of Zero Point
SELECT name, facility_type,
       ROUND(ST_Distance(geom::geography,
             ST_SetSRID(ST_MakePoint(73.0652, 33.6938), 4326)::geography)) AS distance_m
FROM health_facilities
WHERE ST_DWithin(geom::geography,
                 ST_SetSRID(ST_MakePoint(73.0652, 33.6938), 4326)::geography, 3000)
ORDER BY distance_m;

-- 8. Spatial query: the 5 nearest facilities to Faisal Mosque
SELECT name, sector,
       ROUND(ST_Distance(geom::geography,
             ST_SetSRID(ST_MakePoint(73.0380, 33.7295), 4326)::geography)) AS distance_m
FROM health_facilities
ORDER BY distance_m
LIMIT 5;

-- 9. Records as GeoJSON (this is what the API sends to the website)
SELECT id, name, ST_AsGeoJSON(geom) AS geojson
FROM health_facilities
LIMIT 3;

-- 10. Latest edits made from the website
SELECT * FROM facility_log ORDER BY logged_at DESC LIMIT 10;
