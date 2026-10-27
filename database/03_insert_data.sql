-- 03_insert_data.sql
-- Inserts 29 health facilities in Islamabad.
-- Names and locations: OpenStreetMap (downloaded in October 2026 through the Overpass API).
-- Sector: found by reverse geocoding each point with Nominatim.
-- Type, specialty, ownership and emergency were filled in from the facility
-- names and general public information, so they should be checked before real use.

INSERT INTO health_facilities
    (name, facility_type, specialty, sector, ownership, emergency, status, data_source, osm_ref, geom)
VALUES
('Pakistan Institute of Medical Sciences (PIMS)', 'Hospital', 'General', 'G-8', 'Public', TRUE, 'Operational', 'OpenStreetMap', 'w22328601', ST_SetSRID(ST_MakePoint(73.05264, 33.70221), 4326)),
('Federal Government Polyclinic Hospital', 'Hospital', 'General', 'G-6', 'Public', TRUE, 'Operational', 'OpenStreetMap', 'n253018400', ST_SetSRID(ST_MakePoint(73.08281, 33.7211), 4326)),
('Shifa International Hospital', 'Hospital', 'General', 'H-8', 'Private', TRUE, 'Operational', 'OpenStreetMap', 'w23040333', ST_SetSRID(ST_MakePoint(73.0668, 33.67592), 4326)),
('Kulsum International Hospital', 'Hospital', 'General', 'F-6', 'Private', TRUE, 'Operational', 'OpenStreetMap', 'n4954775564', ST_SetSRID(ST_MakePoint(73.07275, 33.71809), 4326)),
('Ali Medical Centre', 'Hospital', 'General', 'F-8', 'Private', TRUE, 'Operational', 'OpenStreetMap', 'n240218764', ST_SetSRID(ST_MakePoint(73.04176, 33.71047), 4326)),
('CDA Hospital', 'Hospital', 'General', 'G-6', 'Public', TRUE, 'Operational', 'OpenStreetMap', 'w23635809', ST_SetSRID(ST_MakePoint(73.08, 33.71663), 4326)),
('PAF Hospital', 'Hospital', 'General', 'E-9', 'Armed Forces', TRUE, 'Operational', 'OpenStreetMap', 'n312719028', ST_SetSRID(ST_MakePoint(73.01704, 33.71562), 4326)),
('NESCOM Hospital', 'Hospital', 'General', 'H-11', 'Semi-Government', TRUE, 'Operational', 'OpenStreetMap', 'n2656259979', ST_SetSRID(ST_MakePoint(73.01741, 33.64904), 4326)),
('PAEC General Hospital', 'Hospital', 'General', 'H-11', 'Semi-Government', TRUE, 'Operational', 'OpenStreetMap', 'n4715980289', ST_SetSRID(ST_MakePoint(73.01587, 33.65222), 4326)),
('KRL General Hospital', 'Hospital', 'General', 'G-9', 'Semi-Government', TRUE, 'Operational', 'OpenStreetMap', 'n4889677811', ST_SetSRID(ST_MakePoint(73.03183, 33.67764), 4326)),
('Al Ain International Specialist Eye Hospital', 'Hospital', 'Eye', 'G-9', 'Private', FALSE, 'Operational', 'OpenStreetMap', 'n4889677808', ST_SetSRID(ST_MakePoint(73.02081, 33.6863), 4326)),
('National Institute of Rehabilitation Medicine', 'Hospital', 'Rehabilitation', 'G-9', 'Public', FALSE, 'Operational', 'OpenStreetMap', 'n4899052824', ST_SetSRID(ST_MakePoint(73.04191, 33.69633), 4326)),
('IHS Hospital for Children', 'Hospital', 'Children', 'F-10', 'Private', FALSE, 'Operational', 'OpenStreetMap', 'n4961843228', ST_SetSRID(ST_MakePoint(73.00565, 33.68625), 4326)),
('Chohan Eye Hospital', 'Hospital', 'Eye', 'F-8', 'Private', FALSE, 'Operational', 'OpenStreetMap', 'n4963977785', ST_SetSRID(ST_MakePoint(73.05038, 33.70907), 4326)),
('Advanced International Hospital', 'Hospital', 'General', 'G-8', 'Private', TRUE, 'Operational', 'OpenStreetMap', 'n11217189672', ST_SetSRID(ST_MakePoint(73.05029, 33.69638), 4326)),
('Max Health Hospital', 'Hospital', 'General', 'G-8', 'Private', TRUE, 'Operational', 'OpenStreetMap', 'n8841662156', ST_SetSRID(ST_MakePoint(73.0492, 33.69768), 4326)),
('Islamabad Private Hospital', 'Hospital', 'General', 'F-5', 'Private', FALSE, 'Operational', 'OpenStreetMap', 'n4954380782', ST_SetSRID(ST_MakePoint(73.08828, 33.72639), 4326)),
('Islamabad International Dental Hospital', 'Hospital', 'Dental', 'G-7', 'Private', FALSE, 'Operational', 'OpenStreetMap', 'n297648462', ST_SetSRID(ST_MakePoint(73.07944, 33.70544), 4326)),
('Quaid-e-Azam International Hospital', 'Hospital', 'General', 'H-13', 'Private', TRUE, 'Operational', 'OpenStreetMap', 'w235084098', ST_SetSRID(ST_MakePoint(72.97303, 33.62508), 4326)),
('Social Security Hospital', 'Hospital', 'General', 'I-11', 'Public', TRUE, 'Operational', 'OpenStreetMap', 'w432916133', ST_SetSRID(ST_MakePoint(73.0017, 33.62081), 4326)),
('Life Care International Hospital', 'Hospital', 'General', 'G-10', 'Private', FALSE, 'Operational', 'OpenStreetMap', 'n4958569728', ST_SetSRID(ST_MakePoint(73.01531, 33.6768), 4326)),
('NUST Medical Center', 'Clinic', 'General', 'H-12', 'Public', FALSE, 'Operational', 'OpenStreetMap', 'w209859224', ST_SetSRID(ST_MakePoint(72.99787, 33.64412), 4326)),
('IIUI Medical Centre', 'Clinic', 'General', 'H-10', 'Public', FALSE, 'Operational', 'OpenStreetMap', 'n12229985624', ST_SetSRID(ST_MakePoint(73.02157, 33.66219), 4326)),
('Haider Clinic', 'Clinic', 'General', 'G-5', 'Private', FALSE, 'Operational', 'OpenStreetMap', 'n4956663343', ST_SetSRID(ST_MakePoint(73.09411, 33.71884), 4326)),
('Aga Khan Laboratory Blue Area', 'Diagnostic Lab', 'Pathology', 'G-8', 'Private', FALSE, 'Operational', 'OpenStreetMap', 'n5183626221', ST_SetSRID(ST_MakePoint(73.06204, 33.71174), 4326)),
('Islamabad Diagnostics Center', 'Diagnostic Lab', 'Radiology', 'G-11', 'Private', FALSE, 'Operational', 'OpenStreetMap', 'n5595279927', ST_SetSRID(ST_MakePoint(72.9972, 33.66857), 4326)),
('National Institute of Health (NIH)', 'Diagnostic Lab', 'Public Health', 'Chak Shahzad', 'Public', FALSE, 'Operational', 'OpenStreetMap', 'w260274365', ST_SetSRID(ST_MakePoint(73.13865, 33.6869), 4326)),
('Federal Government Dispensary P Block', 'Dispensary', 'General', 'F-5', 'Public', FALSE, 'Operational', 'OpenStreetMap', 'n4943934765', ST_SetSRID(ST_MakePoint(73.09371, 33.73509), 4326)),
('CDA Dispensary', 'Dispensary', 'General', 'I-10', 'Public', FALSE, 'Operational', 'OpenStreetMap', 'w439835000', ST_SetSRID(ST_MakePoint(73.04161, 33.64309), 4326));

-- check
SELECT COUNT(*) AS total_records FROM health_facilities;
