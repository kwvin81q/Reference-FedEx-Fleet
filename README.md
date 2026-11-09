# FedEx MX — Live release candidate v1.7

This package contains **only index.html** for replacement of the root of the existing `Reference-FedEx-Fleet` repository. It is based on the standalone v1.7 test design and keeps the **new test background**: dark aircraft wallpaper + large faded FEDEX MX wordmark + luminous outlines.

## IMPORTANT — before publishing

- Confirm the directory and manager list are approved for public GitHub Pages hosting. Public source contains names, employee numbers, phone numbers, and some other reference values; anyone can inspect these even if the UI hides them.
- Verify the latest airport temperature widget on target devices; weather comes from airport observations and is **not** official ATIS.
- Compare maintenance reference values with your approved current documents before release.
- Export any personal notes from the test app first if you wish to transfer them; localStorage is separate for each domain and cannot automatically migrate from a test repo URL. Import the JSON backup on the live site after deployment.

## Deployment (reversible)

1. In the live GitHub repository, save a copy of current `index.html` (or note the current commit SHA).
2. Upload the included `index.html` to the **root**, replacing only the existing `index.html`.
3. Do **not** delete `aircraft-wallpaper.webp`, icon PNGs, `manifest.webmanifest`, `usage.html` or other repository files.
4. Wait for GitHub Pages deployment and visit the original URL with `?v=17` to bypass stale cached HTML.
5. Test A300/MD-11/757/767/777, notes, backups, contacts, manager list, ATIS timeout, and sitewide usage counters.

## Technical notes

- Existing live wallpaper is referenced using `./aircraft-wallpaper.webp` rather than a remote test asset.
- Existing live `manifest.webmanifest` and app icon names are preserved.
- Existing production usage event endpoint / visitor key and local usage key are restored; only `open` and `aircraft` events are posted as before.
- User-created notes, favorites, contacts, and managers remain browser-local. No personal note data is included in analytics events.
- No external build tools are required.
- If something goes wrong, revert `index.html` to the saved version.
