# Member 5 Work Log

## [Current Phase: Integration]
- Target: Replace synthetic placeholder data in app.js with real API calls.
- Files to touch:
  - `api-client.js` (Created new: handles backend fetch & mock fallback)
  - `app.js` (Hook file upload to api-client and pass heightmap to 3D engines)
  - `components.css` / `layout.css` (Style any new upload states or HUD telemetry)
- Preserved:
  - Screen navigation routing (Screens 1 through 5)
  - Three.js rendering loops and animation frames