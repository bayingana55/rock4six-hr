const content = document.querySelector('#content');
const modal = document.querySelector('#modal');
let page = 'dashboard';
let organizations = [];
const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const date = value => value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const inputDate = value => value ? String(value).slice(0, 10) : '';
const badge = value => `<span class="badge ${esc(value)}">${esc(value || '—')}</span>`;
const empty = message => `<div class="card p-10 text-center text-slate-500">${esc(message)}</div>`;
const heading = (title, subtitle, action = '') => `<div class="flex flex-wrap items-center justify-between gap-4 mb-7"><div><h2 class="text-xl font-bold">${title}</h2><p class="text-slate-500 text-sm mt-1">${subtitle}</p></div>${action}</div>`;
const button = (label, action, id = '') => `<button class="btn btn-primary" data-action="${action}" data-id="${esc(id)}">${label}</button>`;
const rowLink = (label, action, id) => `<button class="link text-left" data-action="${action}" data-id="${esc(id)}">${esc(label)}</button>`;

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

function notice(message, error = false) {
  const el = document.querySelector('#notice');
  el.textContent = message;
  el.className = `mx-5 md:mx-10 mt-5 rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`;
  setTimeout(() => el.classList.add('hidden'), 5000);
}

function showModal(title, body) {
  document.querySelector('#modal-title').textContent = title;
  document.querySelector('#modal-body').innerHTML = body;
  modal.classList.remove('hidden');
  modal.querySelector('input,select,textarea,button')?.focus();
}
function closeModal() { modal.classList.add('hidden'); }
document.querySelector('#close-modal').onclick = closeModal;
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });

function field(label, name, value = '', type = 'text', required = false) {
  return `<label><span class="field-label">${label}${required ? ' *' : ''}</span><input class="field" name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''}></label>`;
}
function select(label, name, options, value = '') {
  return `<label><span class="field-label">${label}</span><select class="field" name="${name}">${options.map(([key, text]) => `<option value="${esc(key)}" ${String(key) === String(value) ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select></label>`;
}
function form(id, fields, submit = 'Save') {
  return `<form id="${id}" class="space-y-5"><div class="grid sm:grid-cols-2 gap-4">${fields}</div><div class="flex justify-end gap-2 pt-3"><button type="button" class="btn btn-light" data-action="close">Cancel</button><button class="btn btn-primary" type="submit">${submit}</button></div></form>`;
}
const orgOptions = () => organizations.map(org => [org.id, org.name]);

async function navigate(next) {
  page = next;
  document.querySelector('#page-title').textContent = ({ dashboard: 'Dashboard', organizations: 'Organizations', employees: 'Employees', recruitment: 'Recruitment' })[page];
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  content.innerHTML = '<div class="text-slate-500">Loading…</div>';
  try {
    if (page === 'dashboard') await dashboard();
    if (page === 'organizations') await organizationList();
    if (page === 'employees') await employeeList();
    if (page === 'recruitment') await recruitmentList();
  } catch (error) { content.innerHTML = empty(error.message); }
}
document.querySelectorAll('.nav-link').forEach(el => el.onclick = () => navigate(el.dataset.page));

async function dashboard() {
  const data = await api('/dashboard');
  const metrics = [['Active clients', data.counts.organizations], ['Employees managed', data.counts.employees], ['Open positions', data.counts.jobs], ['Total applicants', data.counts.applicants]];
  content.innerHTML = `<div class="mb-8"><p class="eyebrow text-sm font-bold uppercase tracking-widest">Overview</p><h2 class="text-3xl font-bold mt-2">People operations, in one place.</h2><p class="text-slate-500 mt-2">A live view across your client organizations.</p></div>
    <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">${metrics.map(([label, count]) => `<div class="card p-6"><div class="text-sm text-slate-500">${label}</div><div class="text-4xl font-bold mt-3">${esc(count)}</div></div>`).join('')}</div>
    <div class="grid xl:grid-cols-2 gap-6"><section class="card p-6"><h3 class="font-bold text-lg mb-4">Recently added employees</h3>${data.employees.length ? data.employees.map(e => `<div class="py-3 border-t border-slate-100 flex justify-between gap-3"><div>${rowLink(`${e.first_name} ${e.last_name}`, 'view-employee', e.id)}<p class="text-sm text-slate-500">${esc(e.position || 'Position not set')} · ${esc(e.organization_name)}</p></div><span class="text-xs text-slate-400">${date(e.created_at)}</span></div>`).join('') : '<p class="text-slate-500 text-sm">No employees yet.</p>'}</section>
    <section class="card p-6"><h3 class="font-bold text-lg mb-4">Recent applicants</h3>${data.applicants.length ? data.applicants.map(a => `<div class="py-3 border-t border-slate-100 flex justify-between gap-3"><div>${rowLink(`${a.first_name} ${a.last_name}`, 'view-applicant', a.id)}<p class="text-sm text-slate-500">${esc(a.job_title)}</p></div>${badge(a.stage)}</div>`).join('') : '<p class="text-slate-500 text-sm">No applicants yet.</p>'}</section>
    <section class="card p-6 xl:col-span-2"><h3 class="font-bold text-lg mb-4">Active recruitment</h3>${data.jobs.length ? data.jobs.map(j => `<div class="py-3 border-t border-slate-100 flex justify-between gap-3"><div>${rowLink(j.title, 'view-job', j.id)}<p class="text-sm text-slate-500">${esc(j.organization_name)}</p></div><span class="text-sm text-slate-500">${esc(j.applicant_count)} applicants</span></div>`).join('') : '<p class="text-slate-500 text-sm">No open jobs yet.</p>'}</section></div>`;
}

async function loadOrganizations() { organizations = await api('/organizations'); }
async function organizationList() {
  await loadOrganizations();
  content.innerHTML = heading('Client organizations', 'Manage the businesses served by ROC 4SIX HR.', button('+ Add organization', 'new-org')) +
    (organizations.length ? `<div class="card table-wrap"><table class="data-table"><thead><tr><th>Organization</th><th>Industry</th><th>Employees</th><th>Status</th><th>Date added</th></tr></thead><tbody>${organizations.map(o => `<tr><td>${rowLink(o.name, 'view-org', o.id)}<div class="text-xs text-slate-500">${esc(o.email || '')}</div></td><td>${esc(o.industry || '—')}</td><td>${esc(o.employee_count)}</td><td>${badge(o.status)}</td><td>${date(o.created_at)}</td></tr>`).join('')}</tbody></table></div>` : empty('No client organizations yet. Add your first organization to begin.'));
}

async function employeeList(filters = {}) {
  await loadOrganizations();
  const query = new URLSearchParams();
  if (filters.search) query.set('search', filters.search);
  if (filters.organization_id) query.set('organization_id', filters.organization_id);
  if (filters.status) query.set('status', filters.status);
  const employees = await api(`/employees?${query}`);
  content.innerHTML = heading('Employees', 'Search and manage staff across client organizations.', button('+ Add employee', 'new-employee')) +
    `<form id="search-form" class="grid sm:grid-cols-2 lg:grid-cols-[minmax(200px,1fr)_minmax(150px,220px)_minmax(130px,180px)_auto] gap-2 mb-5"><input class="field" name="search" aria-label="Search employees" placeholder="Search name, role, department or client" value="${esc(filters.search || '')}">${select('Organization', 'organization_id', [['', 'All organizations'], ...orgOptions()], filters.organization_id || '')}${select('Status', 'status', [['', 'All statuses'], ['active', 'Active'], ['inactive', 'Inactive']], filters.status || '')}<button class="btn btn-light self-end">Apply filters</button></form>` +
    (employees.length ? `<div class="card table-wrap"><table class="data-table"><thead><tr><th>Employee</th><th>Organization</th><th>Position</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead><tbody>${employees.map(e => `<tr><td>${rowLink(`${e.first_name} ${e.last_name}`, 'view-employee', e.id)}<div class="text-xs text-slate-500">${esc(e.email || '')}</div></td><td>${esc(e.organization_name)}</td><td>${esc(e.position || '—')}</td><td>${esc(e.department || '—')}</td><td>${badge(e.status)}</td><td class="whitespace-nowrap">${rowLink('View', 'view-employee', e.id)} <span class="text-slate-300 mx-1">·</span> ${rowLink('Edit', 'edit-employee', e.id)}</td></tr>`).join('')}</tbody></table></div>` : empty(Object.values(filters).some(Boolean) ? 'No employees match these filters.' : 'No employees yet. Add one to begin.'));
}

async function recruitmentList() {
  const [jobs] = await Promise.all([api('/jobs'), loadOrganizations()]);
  content.innerHTML = heading('Recruitment', 'Track openings and move applicants through the hiring pipeline.', button('+ Create job', 'new-job')) +
    (jobs.length ? `<div class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">${jobs.map(j => `<article class="card p-6"><div class="flex justify-between gap-3 mb-4">${badge(j.status)}<span class="text-xs text-slate-400">${date(j.created_at)}</span></div><h3 class="font-bold text-lg">${rowLink(j.title, 'view-job', j.id)}</h3><p class="text-sm text-slate-500 mt-1">${esc(j.organization_name)}</p><div class="border-t border-slate-100 mt-5 pt-4 flex justify-between text-sm text-slate-500"><span>${esc(j.location || 'Location not set')}</span><span>${esc(j.applicant_count)} applicants</span></div><div class="flex gap-4 mt-4 text-sm">${rowLink('View', 'view-job', j.id)}${rowLink('Edit', 'edit-job', j.id)}${rowLink('Delete', 'delete-job', j.id)}</div></article>`).join('')}</div>` : empty('No jobs yet. Create the first opening to start recruiting.'));
}

function organizationForm(o = {}) {
  showModal(o.id ? 'Edit organization' : 'Add organization', form('organization-form',
    field('Name', 'name', o.name, 'text', true) + field('Industry', 'industry', o.industry) + field('Email', 'email', o.email, 'email') + field('Phone', 'phone', o.phone) +
    `<div class="sm:col-span-2">${field('Address', 'address', o.address)}</div>` + select('Status', 'status', [['active', 'Active'], ['inactive', 'Inactive']], o.status || 'active')));
  modal.dataset.id = o.id || '';
}
function employeeForm(e = {}) {
  if (!organizations.length) return notice('Add a client organization first.', true);
  showModal(e.id ? 'Edit employee' : 'Add employee', form('employee-form',
    select('Client organization', 'organization_id', orgOptions(), e.organization_id || organizations[0].id) +
    field('First name', 'first_name', e.first_name, 'text', true) + field('Last name', 'last_name', e.last_name, 'text', true) +
    field('Email', 'email', e.email, 'email') + field('Phone', 'phone', e.phone) + field('Position', 'position', e.position) +
    field('Department', 'department', e.department) + field('Hire date', 'hire_date', inputDate(e.hire_date), 'date') +
    select('Status', 'status', [['active', 'Active'], ['inactive', 'Inactive']], e.status || 'active')));
  modal.dataset.id = e.id || '';
}
function jobForm(j = {}) {
  if (!organizations.length) return notice('Add a client organization first.', true);
  showModal(j.id ? 'Edit job posting' : 'Create job posting', form('job-form',
    select('Organization', 'organization_id', orgOptions(), j.organization_id || organizations[0].id) +
    field('Job title', 'title', j.title, 'text', true) + field('Department', 'department', j.department) +
    field('Location', 'location', j.location) + field('Employment type', 'employment_type', j.employment_type) +
    select('Status', 'status', [['open', 'Open'], ['closed', 'Closed']], j.status || 'open') +
    `<label class="sm:col-span-2"><span class="field-label">Description</span><textarea class="field min-h-32" name="description">${esc(j.description)}</textarea></label>`));
  modal.dataset.id = j.id || '';
}

async function deleteJob(id) {
  const [job, applicants] = await Promise.all([api(`/jobs/${id}`), api(`/jobs/${id}/applicants`)]);
  const warning = applicants.length
    ? `This will also permanently delete ${applicants.length} applicant record${applicants.length === 1 ? '' : 's'} for this job.`
    : 'This job has no applicants.';
  if (!window.confirm(`Delete “${job.title}” from ${job.organization_name}?\n\n${warning}\n\nThis cannot be undone.`)) return;
  await api(`/jobs/${id}`, { method: 'DELETE' });
  closeModal();
  notice('Job posting deleted.');
  await navigate(page);
}
function applicantForm(jobId) {
  showModal('Add applicant', form('applicant-form', field('First name', 'first_name', '', 'text', true) +
    field('Last name', 'last_name', '', 'text', true) + field('Email', 'email', '', 'email', true) + field('Phone', 'phone') +
    select('Stage', 'stage', stages.map(s => [s, s]), 'Applied')));
  modal.dataset.id = jobId;
}

async function organizationDetail(id) {
  const o = await api(`/organizations/${id}`);
  showModal(o.name, `<div class="grid sm:grid-cols-2 gap-4 text-sm mb-6"><div><b>Industry</b><p>${esc(o.industry || '—')}</p></div><div><b>Status</b><p>${badge(o.status)}</p></div><div><b>Email</b><p>${esc(o.email || '—')}</p></div><div><b>Phone</b><p>${esc(o.phone || '—')}</p></div><div><b>Address</b><p>${esc(o.address || '—')}</p></div><div><b>Date added</b><p>${date(o.created_at)}</p></div></div>
    <h3 class="font-bold border-t pt-5">Employees (${o.employees.length})</h3><div class="space-y-2 my-3">${o.employees.map(e => `<div>${rowLink(`${e.first_name} ${e.last_name}`, 'view-employee', e.id)} <span class="text-sm text-slate-500">· ${esc(e.position || 'No position')}</span></div>`).join('') || '<p class="text-sm text-slate-500">No employees yet.</p>'}</div>
    <h3 class="font-bold border-t pt-5">Job postings (${o.jobs.length})</h3><div class="space-y-2 my-3">${o.jobs.map(j => `<div>${rowLink(j.title, 'view-job', j.id)} ${badge(j.status)}</div>`).join('') || '<p class="text-sm text-slate-500">No jobs yet.</p>'}</div>
    <div class="pt-4 flex flex-wrap gap-2">${button('Edit organization', 'edit-org', o.id)} ${button('+ Add employee to this client', 'add-employee-org', o.id)} ${button('+ Add job for this client', 'add-job-org', o.id)}</div>`);
}
async function employeeDetail(id) {
  const e = await api(`/employees/${id}`);
  showModal(`${e.first_name} ${e.last_name}`, `<div class="grid sm:grid-cols-2 gap-4 text-sm">${[['Organization', e.organization_name], ['Position', e.position], ['Department', e.department], ['Email', e.email], ['Phone', e.phone], ['Hire date', date(e.hire_date)], ['Status', e.status]].map(([label, value]) => `<div><b>${label}</b><p class="text-slate-600 mt-1">${esc(value || '—')}</p></div>`).join('')}</div><div class="pt-7">${button('Edit employee', 'edit-employee', e.id)}</div>`);
}
async function jobDetail(id) {
  const [j, applicants] = await Promise.all([api(`/jobs/${id}`), api(`/jobs/${id}/applicants`)]);
  showModal(j.title, `<div class="text-sm text-slate-600 space-y-2"><p><b>Client:</b> ${esc(j.organization_name)}</p><p><b>Department:</b> ${esc(j.department || '—')} · <b>Location:</b> ${esc(j.location || '—')}</p><p><b>Employment:</b> ${esc(j.employment_type || '—')} · ${badge(j.status)}</p><p class="whitespace-pre-wrap">${esc(j.description || 'No description provided.')}</p></div>
    <div class="flex gap-2 flex-wrap mt-5">${button('Edit job', 'edit-job', j.id)} ${button('+ Add applicant', 'new-applicant', j.id)}<button class="btn btn-light text-red-700" data-action="delete-job" data-id="${esc(j.id)}">Delete job</button></div>
    <h3 class="font-bold border-t pt-5 mt-6">Applicants (${applicants.length})</h3><div class="space-y-3 mt-3">${applicants.map(a => `<div class="flex justify-between gap-2 border-b pb-3"><div>${rowLink(`${a.first_name} ${a.last_name}`, 'view-applicant', a.id)}<p class="text-xs text-slate-500">${esc(a.email)}</p></div>${badge(a.stage)}</div>`).join('') || '<p class="text-sm text-slate-500">No applicants for this job yet.</p>'}</div>`);
}
async function applicantDetail(id) {
  const a = await api(`/applicants/${id}`);
  showModal(`${a.first_name} ${a.last_name}`, `<div class="space-y-3 text-sm"><p><b>Job:</b> ${esc(a.job_title)} · ${esc(a.organization_name)}</p><p><b>Email:</b> ${esc(a.email)}</p><p><b>Phone:</b> ${esc(a.phone || '—')}</p><p><b>Applied:</b> ${date(a.applied_at)}</p><p><b>Current stage:</b> ${badge(a.stage)}</p></div>
    <form id="stage-form" class="flex flex-wrap gap-3 items-end mt-6">${select('Move to stage', 'stage', stages.map(s => [s, s]), a.stage)}<button class="btn btn-primary">Update stage</button></form>
    ${a.stage === 'Hired' ? `<div class="border-t mt-6 pt-5"><p class="text-sm text-slate-500 mb-3">Create an employee record after hiring. You can choose any client organization before saving.</p>${button('+ Add as employee', 'hire-applicant', a.id)}</div>` : ''}`);
  modal.dataset.id = a.id;
}

document.addEventListener('click', async event => {
  const el = event.target.closest('[data-action]'); if (!el) return;
  const { action, id } = el.dataset;
  try {
    if (action === 'close') return closeModal();
    if (action === 'new-org') organizationForm();
    if (action === 'new-employee') employeeForm();
    if (action === 'add-employee-org') employeeForm({ organization_id: Number(id) });
    if (action === 'hire-applicant') {
      const applicant = await api(`/applicants/${id}`);
      if (applicant.stage !== 'Hired') throw new Error('Move the applicant to Hired first.');
      await loadOrganizations();
      const job = await api(`/jobs/${applicant.job_posting_id}`);
      employeeForm({ organization_id: job.organization_id, first_name: applicant.first_name,
        last_name: applicant.last_name, email: applicant.email, phone: applicant.phone,
        position: job.title, department: job.department, hire_date: new Date().toISOString().slice(0, 10) });
    }
    if (action === 'new-job') jobForm();
    if (action === 'add-job-org') jobForm({ organization_id: Number(id) });
    if (action === 'delete-job') await deleteJob(id);
    if (action === 'new-applicant') applicantForm(id);
    if (action === 'view-org') await organizationDetail(id);
    if (action === 'view-employee') await employeeDetail(id);
    if (action === 'view-job') await jobDetail(id);
    if (action === 'view-applicant') await applicantDetail(id);
    if (action === 'edit-org') organizationForm(await api(`/organizations/${id}`));
    if (action === 'edit-employee') employeeForm(await api(`/employees/${id}`));
    if (action === 'edit-job') jobForm(await api(`/jobs/${id}`));
  } catch (error) { notice(error.message, true); }
});

document.addEventListener('submit', async event => {
  const formEl = event.target;
  if (formEl.id === 'search-form') { event.preventDefault(); return employeeList(Object.fromEntries(new FormData(formEl))).catch(error => notice(error.message, true)); }
  if (!['organization-form', 'employee-form', 'job-form', 'applicant-form', 'stage-form'].includes(formEl.id)) return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(formEl));
  const id = modal.dataset.id;
  let path, method;
  if (formEl.id === 'organization-form') { path = `/organizations${id ? `/${id}` : ''}`; method = id ? 'PUT' : 'POST'; }
  if (formEl.id === 'employee-form') { path = `/employees${id ? `/${id}` : ''}`; method = id ? 'PUT' : 'POST'; }
  if (formEl.id === 'job-form') { path = `/jobs${id ? `/${id}` : ''}`; method = id ? 'PUT' : 'POST'; }
  if (formEl.id === 'applicant-form') { path = `/jobs/${id}/applicants`; method = 'POST'; }
  if (formEl.id === 'stage-form') { path = `/applicants/${id}`; method = 'PUT'; }
  const submit = formEl.querySelector('[type=submit],button:not([type])');
  if (submit) submit.disabled = true;
  try {
    await api(path, { method, body: JSON.stringify(data) });
    if (formEl.id === 'stage-form') {
      notice('Recruitment stage updated.');
      await applicantDetail(id);
    } else {
      closeModal(); notice('Saved successfully.');
      await navigate(formEl.id === 'employee-form' ? 'employees' : page);
    }
  } catch (error) { notice(error.message, true); }
  finally { if (submit) submit.disabled = false; }
});

navigate('dashboard');
