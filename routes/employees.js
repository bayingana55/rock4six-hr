const router = require('express').Router();
const db = require('../db/database');
const h = require('./helpers');

function fields(body) {
  return [
    h.positiveId(body.organization_id, 'organization'),
    h.text(body.first_name, 'First name', 100, true), h.text(body.last_name, 'Last name', 100, true),
    h.email(body.email), h.text(body.phone, 'Phone', 30), h.text(body.position, 'Position', 100),
    h.text(body.department, 'Department', 100), h.date(body.hire_date),
    h.choice(body.status, 'status', ['active', 'inactive'], 'active')
  ];
}

router.get('/', async (req, res, next) => {
  try {
    const params = [];
    const conditions = [];
    if (req.query.search) {
      params.push(`%${String(req.query.search).slice(0, 100)}%`);
      conditions.push(`(e.first_name ILIKE $${params.length} OR e.last_name ILIKE $${params.length} OR e.position ILIKE $${params.length} OR e.department ILIKE $${params.length} OR o.name ILIKE $${params.length})`);
    }
    if (req.query.organization_id) {
      params.push(h.positiveId(req.query.organization_id, 'organization'));
      conditions.push(`e.organization_id = $${params.length}`);
    }
    if (req.query.status) {
      params.push(h.choice(req.query.status, 'status', ['active', 'inactive']));
      conditions.push(`e.status = $${params.length}`);
    }
    const result = await db.query(`SELECT e.*, o.name AS organization_name FROM employees e
      JOIN organizations o ON o.id = e.organization_id ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY e.created_at DESC, e.id DESC`, params);
    res.json(result.rows);
  } catch (error) { h.validation(error, res, next); }
});

router.post('/', async (req, res, next) => {
  try {
    const result = await db.query(`INSERT INTO employees
      (organization_id, first_name, last_name, email, phone, position, department, hire_date, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, fields(req.body));
    res.status(201).json(result.rows[0]);
  } catch (error) { h.validation(error, res, next); }
});

router.get('/:id', async (req, res, next) => {
  const id = h.id(req, res); if (!id) return;
  try {
    const result = await db.query(`SELECT e.*, o.name AS organization_name FROM employees e
      JOIN organizations o ON o.id=e.organization_id WHERE e.id=$1`, [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Employee not found.' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  const id = h.id(req, res); if (!id) return;
  try {
    const result = await db.query(`UPDATE employees SET organization_id=$1, first_name=$2, last_name=$3,
      email=$4, phone=$5, position=$6, department=$7, hire_date=$8, status=$9 WHERE id=$10 RETURNING *`,
      [...fields(req.body), id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Employee not found.' });
    res.json(result.rows[0]);
  } catch (error) { h.validation(error, res, next); }
});

module.exports = router;
