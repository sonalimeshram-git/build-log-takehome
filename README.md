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
