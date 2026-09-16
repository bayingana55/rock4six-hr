const router = require('express').Router();
const db = require('../db/database');
const h = require('./helpers');

function jobFields(body) {
  return [h.positiveId(body.organization_id, 'organization'), h.text(body.title, 'Title', 150, true),
    h.text(body.department, 'Department', 100), h.text(body.location, 'Location', 150),
    h.text(body.employment_type, 'Employment type', 30), h.text(body.description, 'Description', 10000),
    h.choice(body.status, 'status', ['open', 'closed'], 'open')];
}
const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

router.get('/jobs', async (req, res, next) => {
  try {
    const params = req.query.status === 'open' ? ['open'] : [];
    const result = await db.query(`SELECT j.*, o.name AS organization_name,
      (SELECT COUNT(*) FROM applicants a WHERE a.job_posting_id=j.id) AS applicant_count
      FROM job_postings j JOIN organizations o ON o.id=j.organization_id
      ${params.length ? 'WHERE j.status=$1' : ''} ORDER BY j.created_at DESC, j.id DESC`, params);
    res.json(result.rows);
  } catch (error) { next(error); }
});

router.post('/jobs', async (req, res, next) => {
  try {
    const result = await db.query(`INSERT INTO job_postings
      (organization_id,title,department,location,employment_type,description,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, jobFields(req.body));
    res.status(201).json(result.rows[0]);
  } catch (error) { h.validation(error, res, next); }
});

router.get('/jobs/:id', async (req, res, next) => {
  const id = h.id(req, res); if (!id) return;
  try {
    const result = await db.query(`SELECT j.*, o.name AS organization_name FROM job_postings j
      JOIN organizations o ON o.id=j.organization_id WHERE j.id=$1`, [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Job not found.' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/jobs/:id', async (req, res, next) => {
  const id = h.id(req, res); if (!id) return;
  try {
    const result = await db.query(`UPDATE job_postings SET organization_id=$1,title=$2,department=$3,
      location=$4,employment_type=$5,description=$6,status=$7 WHERE id=$8 RETURNING *`, [...jobFields(req.body), id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Job not found.' });
    res.json(result.rows[0]);
  } catch (error) { h.validation(error, res, next); }
});

router.delete('/jobs/:id', async (req, res, next) => {
  const id = h.id(req, res); if (!id) return;
  const client = await db.connect().catch(next);
  if (!client) return;
  try {
    await client.query('BEGIN');
    const job = await client.query('SELECT id FROM job_postings WHERE id=$1 FOR UPDATE', [id]);
    if (!job.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Job not found.' });
    }
    await client.query('DELETE FROM applicants WHERE job_posting_id=$1', [id]);
    await client.query('DELETE FROM job_postings WHERE id=$1', [id]);
    await client.query('COMMIT');
    res.status(204).end();
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally { client.release(); }
});

router.get('/jobs/:id/applicants', async (req, res, next) => {
  const id = h.id(req, res); if (!id) return;
  try {
    const job = await db.query('SELECT id FROM job_postings WHERE id=$1', [id]);
    if (!job.rowCount) return res.status(404).json({ error: 'Job not found.' });
    const result = await db.query('SELECT * FROM applicants WHERE job_posting_id=$1 ORDER BY applied_at DESC, id DESC', [id]);
    res.json(result.rows);
  } catch (error) { next(error); }
});

router.post('/jobs/:id/applicants', async (req, res, next) => {
  const id = h.id(req, res); if (!id) return;
  try {
    const b = req.body;
    const result = await db.query(`INSERT INTO applicants (job_posting_id,first_name,last_name,email,phone,stage)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [id, h.text(b.first_name, 'First name', 100, true),
      h.text(b.last_name, 'Last name', 100, true), h.email(b.email, true), h.text(b.phone, 'Phone', 30),
      h.choice(b.stage, 'stage', stages, 'Applied')]);
    res.status(201).json(result.rows[0]);
  } catch (error) { h.validation(error, res, next); }
});

router.get('/applicants/:id', async (req, res, next) => {
  const id = h.id(req, res); if (!id) return;
  try {
    const result = await db.query(`SELECT a.*, j.title AS job_title, o.name AS organization_name
      FROM applicants a JOIN job_postings j ON j.id=a.job_posting_id
      JOIN organizations o ON o.id=j.organization_id WHERE a.id=$1`, [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Applicant not found.' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
});

router.put('/applicants/:id', async (req, res, next) => {
  const id = h.id(req, res); if (!id) return;
  try {
    const stage = h.choice(req.body.stage, 'stage', stages);
    const result = await db.query('UPDATE applicants SET stage=$1 WHERE id=$2 RETURNING *', [stage, id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Applicant not found.' });
    res.json(result.rows[0]);
  } catch (error) { h.validation(error, res, next); }
});

module.exports = router;
