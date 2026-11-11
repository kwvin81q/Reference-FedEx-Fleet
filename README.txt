FedEx MX — Spaceship Fleet Usage Dashboard

1. Open build_fleet_usage_spaceship.html in your browser (Safari or Chrome).
2. Tap 'Build complete usage.html'. The builder retrieves the current public GitHub dashboard and creates a replacement usage.html on your device. If the fetch fails, select the current usage.html using the file input, then tap Build.
3. Download/save your existing GitHub usage.html as a backup.
4. On GitHub, open kwvin81q/Reference-FedEx-Fleet, upload replacement usage.html to the repository root, overwriting only the current usage.html. Leave index.html, worker, icons, and other files untouched.
5. Once GitHub Pages deploys, open https://kwvin81q.github.io/Reference-FedEx-Fleet/usage.html?v=spaceship1 and sign in with your existing dashboard key.
6. Confirm World/USA, 30-day heatmap, per-location zoom labels, counters, daily details, and activity feed.

IMPORTANT DATA LIMITATIONS:
- The 3- and 6-month heatmaps require the Cloudflare Worker to honor /analytics?days=90 or days=180 AND return an explicit matching 'days' (or 'window_days', 'period_days', 'range_days') field. Until this is supported, those views show an explanatory message instead of incorrect numbers.
- Existing geolocation filtering (minimum 3 distinct browsers in 30 days) happens in the Worker, not the webpage. This frontend upgrade cannot reveal omitted locations or reconstruct historical ones. All app events may already be counted in your overall counters; the map is a narrower geographic subset.
- The builder only modifies usage.html and never alters your Cloudflare Worker, D1 database, or app tracking instrumentation.
- The geographic heatmap needs Leaflet / Leaflet.heat JS from a CDN; if the heat plugin cannot load, basic translucent location circles are shown as fallback.
- Never embed the dashboard access key in publicly hosted source code.

GitHub connector write attempt returned HTTP 403 (not permitted), so the tool did NOT deploy anything directly.
