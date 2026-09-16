function id(req, res) {
  const value = Number(req.params.id);
  if (!Number.isSafeInteger(value) || value < 1) {
    res.status(400).json({ error: 'Invalid ID.' });
    return null;
  }
  return value;
}

function text(value, label, max, required = false) {
  if (value == null || value === '') {
    if (required) throw new Error(`${label} is required.`);
    return null;
  }
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`${label} must be 1–${max} characters.`);
  return value.trim();
}

function choice(value, label, choices, fallback) {
  const result = value == null || value === '' ? fallback : value;
  if (!choices.includes(result)) throw new Error(`Invalid ${label}.`);
  return result;
}

function positiveId(value, label) {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 1) throw new Error(`Invalid ${label}.`);
  return result;
}

function email(value, required = false) {
  const result = text(value, 'Email', 150, required);
  if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new Error('Enter a valid email address.');
  return result;
}

function date(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error('Enter a valid hire date.');
  return value;
}

function validation(error, res, next) {
  if (error instanceof Error && !error.code) return res.status(400).json({ error: error.message });
  next(error);
}

module.exports = { id, text, choice, positiveId, email, date, validation };
