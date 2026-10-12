# Build Log

Scaffold for the Build Log take-home. **Start with [ASSIGNMENT.md](ASSIGNMENT.md).**

This file documents how to get the scaffold running. Once you start building,
edit it to describe *your* project — item 8 of the assignment asks for exact
run steps, and we will follow them literally on a clean machine.

## Prerequisites

Python 3.11+ and Node 20+. Or just Docker — see the bottom of this file.

## Backend

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```

Check it: <http://localhost:8000/api/health/> should return

```json
{"status": "ok", "database": "ok"}
```

### Seed data

```bash
python manage.py load_seed
```

Reads `data/seed_builds.json` (5,000 records) and currently saves nothing —
implementing that is assignment item 4.

### Tests

```bash
pytest
```

One smoke test ships with the scaffold and should pass immediately.

## Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>. Requests to `/api` are proxied to Django on port
8000 (see `frontend/webpack.config.js`), so there's no CORS to configure.

Type checking:

```bash
npm run typecheck
```

## Docker (optional)

```bash
docker compose up --build
```

Brings up the API on <http://localhost:8000> and the frontend on
<http://localhost:3000>. Both mount your working tree, so edits reload without
a rebuild. Use it or ignore it — whichever gets you building faster.

## Layout

| Path                   | What's in it                                        |
| ---------------------- | --------------------------------------------------- |
| `config/`              | Django settings, root URLconf                       |
| `builds/`              | The app to fill in — models, serializers, views     |
| `builds/management/`   | `load_seed` command stub                            |
| `data/`                | `seed_builds.json`                                  |
| `frontend/`            | React + TypeScript, bundled with webpack            |

Settings are in `config/settings.py`: SQLite, DRF with page-size 50, no auth,
`USE_TZ = True`. Change anything you like; note it in `DECISIONS.md`.


### Run in Virtual Env

# 1. Create the virtual environment (once)
py -3.12 -m venv .venv

# 2. Activate it (every new terminal)
.venv\Scripts\Activate.ps1

# 3 If PowerShell says "running scripts is disabled on this system", run this once, then activate again:
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

# 3. Install Python packages (once, or when requirements.txt changes)
pip install -r requirements.txt

# 4. Create the database tables
python manage.py migrate

# 5. Load the seed data (safe to run again)
python manage.py load_seed
### Should shw- Inserted 2503, skipped 0 already present, rejected 0 invalid (0.77s). Total builds: 2504.

# 6. Run the tests
pytest

# 7. Start the API -> http://localhost:8000/api/health/
python manage.py runserver

# 8. In another terminal start the webpack dev server (nodejs) -> 
cd frontend
npm run dev

## Project layout
builds/
  models.py                     Build model: fields, indexes, database constraints
  serializers.py                Validation for POST, and the service summary output
  views.py                      The three endpoints
  urls.py                       DRF mapping
  management/commands/load_seed.py  Load Seed data
  tests/                        pytest tests with DB and API tests
config/                         Django settings and root URLs (unchanged from the starter)
data/seed_builds.json           Seed data (2,500 builds)
frontend/src/
  types.ts                      TypeScript types that mirror the API
  api.ts                        The only module that calls the API
  format.ts                     Display helpers (duration, UTC time, %)
  components/                   Create form, builds table, service summary
  App.tsx                       Main entry file
  index.css                     css data