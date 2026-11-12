# SIGNAL

Financial intelligence, made visible. A working public synthetic-finance investigation environment by Emit Rice.

## Run locally

Python 3.11 and Node 20+ recommended.

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
npm ci
alembic upgrade head
npm run dev
```

The dev launcher starts FastAPI on 127.0.0.1:8000 and Vite on its default port. SQLite is the development default. Set `DATABASE_URL` to a PostgreSQL connection string for PostgreSQL; the deployment obtains its internal connection from Render without checking secrets into source. The seed is transactional and runs only once per dataset version. Never run more than one startup seeder against an empty database.

```sh
python -m unittest discover -s tests -v
python -m scripts.evaluate
npm run build
```

Set `VITE_API_URL` to the deployed API origin before building the frontend. Keep database URLs out of Vite variables. Frontend output is `dist/`; static hosting must rewrite `/case/*`, `/methodology`, and `/about` to `index.html`.

## Architecture

- React/TypeScript + Three.js through React Three Fiber; instanced nodes and batched edges.
- Zustand controls case, selection, timeline, presentation, and camera state. TanStack Query handles analysis jobs and caching.
- FastAPI validates permitted configurations. A bounded single-worker executor computes authoritative results and persists them through SQLAlchemy.
- PostgreSQL stores the ledger, dataset metadata, separate evaluation truth, and analysis results. Alembic supplies schema migration.
- A deterministic Python generator creates 5,000 accounts, 120,000 background transfers, and 133 scenario transfers. USD values are integer cents.
- IsolationForest: 80 trees, fixed seed, 256 samples/tree. Training snapshot ends: days 14, 21, 28. Disjoint day-29 reference distribution. Scoring withheld until day 30. Scenario injections begin on day 62 or later.
- Rule detectors use only bounded observed records and retain evidence IDs. The application never treats labels as predictions.

See `docs/architecture.md`, `/methodology`, `public/evaluation.json`, and `docs/release-status.md` for limitations and verification.

## Deployment

`render.yaml` creates a free API and references the separately created `signal-intelligence-db` PostgreSQL database in the same Oregon workspace. Source is isolated in the `signal-public-v1` branch under `signal/`; the portfolio's main branch is not changed. The frontend is independently deployed through Sites.

Render free database expiry: **December 11, 2026**. Upgrade or migrate before that date to retain service. Free APIs can sleep; cold starts can take longer than ordinary cached requests. No uptime or throughput target is claimed.

`GET /api/v1/health` reports the actual database dialect. API documentation: `/api/docs`; OpenAPI: `/openapi.json`.

## Reproduction and evidence

Share links encode dataset version, case, timestamp, observation window, threshold, detector, injection setting, selected account, view, and camera. Computation hashes include dataset/model versions and the complete configuration. JSON evidence exports include account features, baseline comparisons, detector rules, supporting records, and run/version metadata.

## Disclaimer

All data are synthetic. SIGNAL is an experimental visualization and analytical sandbox, not a production AML tool or a basis for regulatory decisions. Model percentiles are not probabilities of wrongdoing. Synthetic evaluation does not establish real-world effectiveness.
