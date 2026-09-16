-- Safe to run more than once. Existing organizations and employees are untouched.
CREATE TABLE IF NOT EXISTS job_postings (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  title VARCHAR(150) NOT NULL,
  department VARCHAR(100),
  location VARCHAR(150),
  employment_type VARCHAR(30),
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT job_postings_status_check CHECK (status IN ('open', 'closed'))
);

CREATE TABLE IF NOT EXISTS applicants (
  id SERIAL PRIMARY KEY,
  job_posting_id INTEGER NOT NULL REFERENCES job_postings(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  stage VARCHAR(20) NOT NULL DEFAULT 'Applied',
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT applicants_stage_check CHECK (stage IN ('Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'))
);

CREATE INDEX IF NOT EXISTS job_postings_organization_id_idx ON job_postings(organization_id);
CREATE INDEX IF NOT EXISTS applicants_job_posting_id_idx ON applicants(job_posting_id);
