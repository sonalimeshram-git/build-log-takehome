# Build Log — take-home assignment

Build a small service and UI for recording and reviewing CI builds.

**Effort: ~5 hours. Deadline: 5 calendar days from when you received this.**

We've deliberately given you more calendar time than work, so you can fit it
around your week. Please don't spend more than about five hours on it — see
[Ground rules](#ground-rules).

---

## What to build

### Backend — Django + DRF, SQLite is fine

1. **`POST /api/builds/`** — record a build. Body:

   | Field         | Notes                                      |
   | ------------- | ------------------------------------------ |
   | `service`     | e.g. `checkout-api`                        |
   | `branch`      | e.g. `main`                                |
   | `commit_sha`  | 40-character hex                           |
   | `status`      | `success` \| `failed` \| `cancelled`       |
   | `started_at`  | ISO 8601 timestamp, UTC                    |
   | `duration_ms` | integer, milliseconds                      |

   Returns the created record. Invalid input should come back as a useful,
   field-level error — **we will throw bad data at this.**

2. **`GET /api/builds/`** — paginated list, newest first, filterable by
   `service` and `status`.

3. **`GET /api/services/`** — one row per service: total builds, success rate,
   and the status of its **most recent** build.

4. Load the provided `data/seed_builds.json` (~2,500 records) with a management
   command. A stub lives at `builds/management/commands/load_seed.py`.

### Frontend — React + TypeScript

5. A form that submits a build to #1, surfacing server-side validation errors
   next to the offending fields, and updating the list on success. Note: yes,
   it's not likely a real-world scenario to manually enter build information
   like this.

6. The builds table from #2 with its filters, and the service summary from #3.

### Both

7. Tests on the parts you'd be nervous about a teammate changing. A handful,
   not a suite.

8. A README with exact run steps. **We will follow them literally on a clean
   machine.** (Feel free to edit the one already in this repo.)

9. `DECISIONS.md`, **half a page**: what you traded off, what you'd do with
   another day, anything knowingly left rough.

---

## Out of scope — please don't spend time here

Authentication, user accounts, charts, visual design beyond legible,
deployment, real-time updates, Docker setup (a working `docker-compose.yml` is
already provided — use it or ignore it), exhaustive test coverage.

---

## Ground rules

**Time-box: 5 hours.** We mean it. We'd rather see a thoughtful partial
submission than a rushed complete one — just say what you skipped and why in
`DECISIONS.md`. Running out of time on something is normal; we care much more
about how you reason than about how much you finished.

**Ambiguity.** The spec above is not airtight. Where it's unclear, either ask
us or state your assumption in the README. Both are completely fine. Guessing
silently is the only wrong answer.

**On AI tools.** Use them — we do. Note roughly where you leaned on them in
`DECISIONS.md`. You'll walk us through the code in a follow-up conversation, so
don't submit anything you can't explain or defend.

---

## What's already here

Nothing that would rob you of an interesting decision — just the boring parts.

```
manage.py                    Django entry point
config/                      Settings, URLs, WSGI/ASGI. SQLite, DRF, no auth.
builds/                      The app you'll fill in
  models.py                    empty, with a TODO
  serializers.py               empty, with a TODO
  views.py                     a /api/health/ endpoint proving the stack works
  urls.py                      routes /api/health/, waiting for yours
  management/commands/
    load_seed.py               reads the seed file; saving rows is your part
  tests/test_smoke.py          one passing test, so you know pytest works
data/seed_builds.json        5,000 build records
frontend/                    React + TypeScript, bundled with webpack
  src/api.ts                   fetch helper and one example type
  src/App.tsx                  calls /api/health/; replace it
  webpack.config.js            dev server on :3000, proxies /api to Django
docker-compose.yml           optional, works out of the box
requirements.txt, pytest.ini
```

Run `python manage.py runserver` and open <http://localhost:8000/api/health/>;
run the frontend and you should see it report a healthy backend. If either of
those doesn't work on your machine, tell us — that's our bug, not yours, and
we don't want it eating your time.

### A note on the seed data

`seed_builds.json` carries two fields the POST spec above doesn't mention:
`triggered_by` and `author`. Whether you model them is your call — just be
ready to say why.

---

## How we'll review it

Two of us read the submission independently, then we'll book **45 minutes** to
go through it together. That session is a walkthrough plus a small live
extension to the code — your editor, your tools, screen-shared. It's a
conversation, not a whiteboard test.

## Submitting

Zip the repo (minus `node_modules/`, `.venv/`, and `db.sqlite3`) or send us a
link to a private Git repo. Either is fine.

Thanks for spending the time — we know a take-home is a real ask.
