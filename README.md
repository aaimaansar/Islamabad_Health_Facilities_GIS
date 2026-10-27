# Islamabad Health Facilities GIS

Web GIS Application - Lab Assignment 2
Aaima Ansar (FA23-BRG-005)
Department of Remote Sensing and GIS, COMSATS University Islamabad

A database driven Web GIS of hospitals, clinics, diagnostic labs and dispensaries in Islamabad.
The data is stored in PostgreSQL with PostGIS, served by a Node.js / Express API and shown on a Leaflet map.

## Features

- 29 health facilities stored in a PostGIS point table (`health_facilities`)
- Search by name or specialty, filter by type, sector, ownership and emergency
- Click on the map to list facilities within 2 km (PostGIS `ST_DWithin`)
- Editor login, then add, update and delete records through a form
- Input validation in the browser and on the server, duplicate check (same name within 50 m)
- Every add / update / delete is written to a second table (`facility_log`)

## Folder structure

```
database/
  01_create_database.sql   create database and enable PostGIS
  02_create_tables.sql     health_facilities (geometry Point, 4326) and facility_log
  03_insert_data.sql       29 records
  04_queries.sql           retrieve, filter, count, update and spatial queries
public/
  index.html, style.css, script.js   Leaflet website
server.js        Express API
db.js            PostgreSQL connection
validation.js    form validation rules
.env.example     settings template
```

## How to run

1. Install PostgreSQL with the PostGIS extension (Stack Builder) and Node.js.
2. In pgAdmin or psql run `database/01_create_database.sql`, then connect to `islamabad_health_gis`
   and run `02_create_tables.sql` and `03_insert_data.sql`.
3. Copy `.env.example` to `.env` and enter your PostgreSQL password and an editor password.
4. Install packages and start the server:

```
npm install
npm start
```

5. Open http://localhost:3000

## API

| Method | Route | Description |
|---|---|---|
| GET | /api/facilities | all records, filters: `type`, `sector`, `ownership`, `emergency`, `search` |
| GET | /api/facilities/:id | one record |
| GET | /api/options | values for the drop-down lists |
| GET | /api/stats | counts by type |
| GET | /api/nearby?lat=&lng=&distance= | facilities within a distance (m) |
| POST | /api/login | editor login, returns a token |
| POST | /api/facilities | add a record (editor) |
| PUT | /api/facilities/:id | update a record (editor) |
| DELETE | /api/facilities/:id | delete a record (editor) |

## Data

Facility names and locations are from OpenStreetMap (© OpenStreetMap contributors, ODbL), downloaded
in October 2026 through the Overpass API. Sectors were found with Nominatim reverse geocoding.
Type, specialty, ownership and emergency values were added for this assignment and are not official data.
