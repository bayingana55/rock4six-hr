-- Two sample postings for each current client. Safe to rerun without duplicates.
WITH samples (organization_name, title, department, location, employment_type, description) AS (
  VALUES
    ('Kigali Construction Ltd', 'Site Supervisor (Demo)', 'Operations', 'Kigali', 'Full-time', 'Sample posting: oversee daily construction site work and safety.'),
    ('Kigali Construction Ltd', 'Procurement Officer (Demo)', 'Procurement', 'Kigali', 'Full-time', 'Sample posting: coordinate purchasing and supplier records.'),
    ('Umuco Hospitality Ltd (Demo)', 'Front Desk Associate (Demo)', 'Guest Services', 'Kigali', 'Full-time', 'Sample posting: welcome guests and manage front desk requests.'),
    ('Umuco Hospitality Ltd (Demo)', 'Housekeeping Supervisor (Demo)', 'Operations', 'Kigali', 'Full-time', 'Sample posting: coordinate housekeeping schedules and standards.'),
    ('Kivu Digital Services Ltd (Demo)', 'Junior Web Developer (Demo)', 'Technology', 'Kigali', 'Full-time', 'Sample posting: build and maintain client-facing web features.'),
    ('Kivu Digital Services Ltd (Demo)', 'Customer Support Specialist (Demo)', 'Client Services', 'Kigali', 'Full-time', 'Sample posting: assist clients and track support requests.')
)
INSERT INTO job_postings (organization_id, title, department, location, employment_type, description)
SELECT o.id, s.title, s.department, s.location, s.employment_type, s.description
FROM samples s JOIN organizations o ON o.name = s.organization_name
WHERE NOT EXISTS (
  SELECT 1 FROM job_postings j WHERE j.organization_id = o.id AND j.title = s.title
);
