-- 02_create_tables.sql
-- Main spatial table (points) and a second table that keeps a log of edits.

DROP TABLE IF EXISTS facility_log;
DROP TABLE IF EXISTS health_facilities;

CREATE TABLE health_facilities (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    facility_type VARCHAR(30)  NOT NULL
                  CHECK (facility_type IN ('Hospital', 'Clinic', 'Diagnostic Lab', 'Dispensary')),
    specialty     VARCHAR(40)  NOT NULL DEFAULT 'General',
    sector        VARCHAR(30)  NOT NULL,
    ownership     VARCHAR(20)  NOT NULL
                  CHECK (ownership IN ('Public', 'Private', 'Semi-Government', 'Armed Forces')),
    emergency     BOOLEAN      NOT NULL DEFAULT FALSE,
    status        VARCHAR(20)  NOT NULL DEFAULT 'Operational'
                  CHECK (status IN ('Operational', 'Temporarily Closed', 'Not Verified')),
    phone         VARCHAR(20),
    data_source   VARCHAR(20)  NOT NULL DEFAULT 'User Added'
                  CHECK (data_source IN ('OpenStreetMap', 'Field Visit', 'User Added')),
    osm_ref       VARCHAR(20),
    remarks       VARCHAR(300),
    geom          GEOMETRY(Point, 4326) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- spatial index for faster map and distance queries
CREATE INDEX idx_health_facilities_geom ON health_facilities USING GIST (geom);

-- every add / update / delete from the website is written here
CREATE TABLE facility_log (
    log_id       SERIAL PRIMARY KEY,
    facility_id  INTEGER REFERENCES health_facilities(id) ON DELETE SET NULL,
    action       VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    details      VARCHAR(200),
    logged_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
