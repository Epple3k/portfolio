# Release status

This is an implemented alpha, not a claim that every v1.0 release gate has passed.

Implemented: three seeded cases; full synthetic ledger; Python IsolationForest and graph rules; evidence; real experimentation; PostgreSQL-compatible schema/migrations; background jobs; 3D/SVG/table views; timeline and stepping; search; account/transaction inspectors; share state; exports; measured evaluation; source and deployment configuration.

Local verification: nine automated tests passed covering deterministic generation, integrity, all three rule detections, actual scenario removal, threshold monotonicity, no-future-leakage invariance, window/aggregate arithmetic, temporal rule evidence, API validation, queue lifecycle, cache reuse, pagination and neighborhood extraction. Build passed TypeScript and Vite compilation.

Measured local runs were approximately 0.4–1.0 seconds for typical 14-day cases. These are local observations, not production p95 or standard-hardware measurements. The synthetic hub case detects its central hub but has low recall across all 49 injected endpoint accounts; see the evaluation report. High model false-positive rates remain visible in evaluation.

Browser validation environment has WebGL disabled. The automatic SVG fallback was observed to work. Hardware 3D performance, full WCAG 2.2 AA, cross-browser/mobile-device audit, load testing, independent worker deployment, hard job timeout enforcement, monitoring/uptime and the narrated product film remain unverified or unfinished. Public deployment results are recorded separately after publication.
