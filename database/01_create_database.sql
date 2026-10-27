-- 01_create_database.sql
-- Run this while connected to the default "postgres" database.

CREATE DATABASE islamabad_health_gis;

-- Now connect to the new database (in psql: \c islamabad_health_gis)
-- and run the next line there to enable PostGIS.
CREATE EXTENSION IF NOT EXISTS postgis;

SELECT PostGIS_Version();
