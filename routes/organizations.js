const router = require('express').Router();
const db = require('../db/database');
const h = require('./helpers');

function fields(body) {
  return [
    h.text(body.name, 'Name', 150, true), h.text(body.industry, 'Industry', 100),
    h.email(body.email), h.text(body.phone, 'Phone', 30), h.text(body.address, 'Address', 255),
    h.choice(body.status, 'status', ['active', 'inactive'], 'active')
  ];
}

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT o.*, (SELECT COUNT(*) FROM employees e WHERE e.organization_id = o.id) AS employee_count
      FROM organizations o ORDER BY o.name`);
    res.json(result.rows);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const result = await db.query(`INSERT INTO organizations (name, industry, email, phone, address, status)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, fields(req.body));
    res.status(201).json(result.rows[0]);
  } catch (error) { h.validation(error, res, next); }
});

router.get('/:id', async (req, res, next) => {
  const id = h.id(req, res); if (!id) return;
  try {
    const [organization, employees, jobs] = await Promise.all([
      db.query('SELECT * FROM organizations WHERE id = $1', [id]),
      db.query('SELECT id, first_name, last_name, position, department, status FROM employees WHERE organization_id = $1 ORDER BY first_name, last_name', [id]),
      db.query('SELECT id, title, department, status, created_at FROM job_postings WHERE organization_id = $1 ORDER BY created_at DESC', [id])
    ]);
    if (!organization.rowCount) return res.status(404).json({ error: 'Organization not found.' });
    res.json({ ...organization.rows[0], employees: employees.rows, jobs: jobs.rows });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  const id = h.id(req, res); if (!id) return;
  try {
    const result = await db.query(`UPDATE organizations SET name=$1, industry=$2, email=$3, phone=$4, address=$5, status=$6
      WHERE id=$7 RETURNING *`, [...fields(req.body), id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Organization not found.' });
    res.json(result.rows[0]);
  } catch (error) { h.validation(error, res, next); }
});

module.exports = router;
