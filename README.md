# Carrowmont Compound Interest Calculator

Production repository for the global Carrowmont Compound Interest Calculator.

Canonical URL: `https://carrowmont.com/compound-interest-calculator/`

The tool models deterministic compound growth from a starting principal, nominal annual rate, compounding frequency and time horizon, with optional recurring contributions and an optional inflation-adjusted view. It is educational and does not guarantee investment returns.

Primary files:

- `index.html` — public calculator UI
- `core.js` — deterministic calculation engine
- `app.js` — locale-aware UI, chart, table, CSV and summary behavior
- `compound-interest-pdf-renderer.js` — downloadable report
- `report-standard.js` — byte-identical shared CORE8 Continue Planning standard
- `locale.js` — country/currency formatting and cadence metadata
- `shared-plan-state.js` / `shared-plan-bridge.js` — same-origin Carrowmont plan context helpers
