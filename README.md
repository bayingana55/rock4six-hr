# ROC 4SIX HR Platform

A small multi-client HR workspace built with Express, PostgreSQL, HTML, Tailwind CSS, and vanilla JavaScript.

## Start locally

1. Make sure PostgreSQL is running and the existing `rock4six_hr` database contains `organizations` and `employees`.
2. Run `npm install`.
3. Copy `.env.example` to `.env`. Set `PGHOST`, `PGPORT`, `PGUSER`, and `PGPASSWORD` there if your PostgreSQL setup needs them. You can also use `DATABASE_URL` instead.
4. Run `npm run db:migrate` once to create `job_postings` and `applicants`. The migration is additive and can be run again safely.
5. Run `npm start` and open `http://localhost:3000`.

For automatic server reload while developing, use `npm run dev`. Tailwind CSS is loaded from its CDN, so the interface needs an internet connection for Tailwind utilities; the local stylesheet supplies core styling.

## How it works

The browser loads `public/index.html` and `public/js/app.js`. JavaScript calls `/api` routes. Express validates requests, runs parameterized SQL through `pg`, and returns JSON. The browser renders that JSON. Foreign keys connect employees and jobs to organizations, and applicants to jobs.

The initial organization and employee records are retained. There is no authentication in Version 1, so run this only in a trusted local environment until access control is added.

Two extra organizations are marked `(Demo)` so they cannot be mistaken for real clients. They were added with `db/002_sample_organizations.sql`; this optional script can be run again without duplicating them.

In Recruitment, set an applicant's stage to **Hired**, then open that applicant and choose **Add as employee**. The employee form copies their contact details and suggests the hiring organization. You can select any client organization before saving. The Employees page also has direct Add, View, and Edit actions, plus search, organization, and status filters. Employee status is changed in the Edit form.

Two demo job postings per organization were added with `db/003_sample_jobs.sql`. The script is safe to rerun. Use **Create job** in Recruitment or **Add job for this client** in an organization's details. Jobs can be edited or deleted from Recruitment. Deleting a job also deletes its applicants after an explicit confirmation showing the applicant count.
