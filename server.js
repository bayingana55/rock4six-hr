require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db/database');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api', require('./routes/recruitment'));

app.get('/api/dashboard', async (req, res, next) => {
  try {
    const [counts, employees, applicants, jobs] = await Promise.all([
      db.query(`SELECT
        (SELECT COUNT(*) FROM organizations WHERE status = 'active') AS organizations,
        (SELECT COUNT(*) FROM employees) AS employees,
        (SELECT COUNT(*) FROM job_postings WHERE status = 'open') AS jobs,
        (SELECT COUNT(*) FROM applicants) AS applicants`),
      db.query(`SELECT e.id, e.first_name, e.last_name, e.position, e.created_at, o.name AS organization_name
        FROM employees e JOIN organizations o ON o.id = e.organization_id ORDER BY e.created_at DESC, e.id DESC LIMIT 5`),
      db.query(`SELECT a.id, a.first_name, a.last_name, a.stage, a.applied_at, j.title AS job_title
        FROM applicants a JOIN job_postings j ON j.id = a.job_posting_id ORDER BY a.applied_at DESC, a.id DESC LIMIT 5`),
      db.query(`SELECT j.id, j.title, j.created_at, o.name AS organization_name,
        (SELECT COUNT(*) FROM applicants a WHERE a.job_posting_id = j.id) AS applicant_count
        FROM job_postings j JOIN organizations o ON o.id = j.organization_id WHERE j.status = 'open'
        ORDER BY j.created_at DESC, j.id DESC LIMIT 5`)
    ]);
    res.json({ counts: counts.rows[0], employees: employees.rows, applicants: applicants.rows, jobs: jobs.rows });
  } catch (error) { next(error); }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((error, req, res, next) => {
  console.error(error);
  if (error.code === '23505') return res.status(409).json({ error: 'That value is already in use.' });
  if (error.code === '23503') return res.status(400).json({ error: 'The related record does not exist.' });
  if (error.code === '22P02') return res.status(400).json({ error: 'Invalid value supplied.' });
  res.status(500).json({ error: 'A server error occurred. Please try again.' });
});

const port = Number(process.env.PORT) || 3000;
if (require.main === module) app.listen(port, () => console.log(`ROC 4SIX HR running at http://localhost:${port}`));
module.exports = app;
