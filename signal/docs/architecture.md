# Technical decisions

## Data and correctness

The ledger uses integer cents, foreign keys, positive-amount constraints, and unique identifiers. The generator fixes NumPy's seed and sorts by (day, transaction ID). Queries preserve chronological order. Each analysis uses `window_start < timestamp <= as_of`. No future transactions enter features or rules; the model does not publish scores until its training/calibration period is available.

The visual network represents three local communities, 300 accounts per case, out of 5,000 analyzed accounts. Account features include all counterparties, while the rendered edges include only both-visible endpoints. This distinction is disclosed to avoid misleading totals. Coordinates are stable simulated community positions, not inferred causal or geographic relationships.

## Inference

The model operates on eight log1p-transformed account features. A separate rolling-window model is trained for each permitted window (7, 14, 30 days), using only baseline records. Raw anomaly score is negative `score_samples`; percentiles use the empirical day-29 calibration distribution. Highest anomalies are not automatically crimes.

The rule engine detects rapid pass-through, abrupt counterparty concentration, and repeated time-respecting cycles. Cycle search is restricted to repeated high-value edges and length 3–4. Evidence includes the actual transaction IDs used to meet a rule. The combined queue is a set union; changing the model threshold does not loosen rule criteria.

## Jobs and state

Public requests have a 2 KB body limit, enum/range validation, a 24-analysis/minute client limit, and three bounded active/queued slots. The execution worker is a single bounded thread in the API process, not an independently scaled worker service. Failed/interrupted jobs are explicit; no simulated results are returned. The frontend gives a timeout/retry path after 120 seconds. Durable process-enforced execution timeouts and distributed limits remain release work.

Identical configurations produce deterministic IDs and reuse persisted results. Camera movement never calls the API. Analysis transitions do not show old scores with a new timestamp: the viewport shows a pending state until the requested snapshot completes.

## Presentation

3D uses instanced spheres, batched line geometry, capped device pixel ratio, and OrbitControls. Rendering does not drive simulation time. Recent actual transactions can be replayed as directional pulses. SVG and table fallback use the same API response. Tab visibility pauses playback.

## Operations and rollback

Alembic migrations are non-destructive. The initial migration creates new namespaced tables. Roll back application commits only if they are compatible with the database schema. Recreate ephemeral model artifacts deterministically after restart; retain database seed metadata. Back up PostgreSQL before any future schema migration.

The free database has a provider expiry. Monitoring and scheduled health checks should be provisioned before claiming the full release gates.
