-- Optional demo clients. Existing organizations and employees are untouched.
INSERT INTO organizations (name, industry, status)
SELECT 'Umuco Hospitality Ltd (Demo)', 'Hospitality', 'active'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Umuco Hospitality Ltd (Demo)');

INSERT INTO organizations (name, industry, status)
SELECT 'Kivu Digital Services Ltd (Demo)', 'Technology', 'active'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Kivu Digital Services Ltd (Demo)');
