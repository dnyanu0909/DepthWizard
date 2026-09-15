# DepthWizard (Aero3D)

> Transform satellite imagery and aerial photography into interactive 3D terrain models with sub-meter elevation reconstruction and cinematic flythroughs.

## Overview
DepthWizard provides a full-featured web-based 3D terrain visualization suite powered by Three.js and WebGL:
1. **Landing Showcase** — Interactive sandbox with real-time presets (Mountain Ridges, Urban Grid, River Basins) and split DEM inspection.
2. **Core Workspace** — Interactive 3D mesh orbit controls, real-time elevation extrusion scaling, colormap selection, and local heightmap ingestion.
3. **Drone Flight View** — Real-time WebGL flight simulator with artificial horizon HUD, telemetry readouts, waypoint recorder, and camera presets.
4. **2D vs 3D Comparison** — Clean side-by-side synchronized inspection of source 2D satellite imagery against the real-time interactive 3D WebGL DEM model.
5. **Altitude & Analytics** — Topographic contour visualization, elevation cross-section profiling, and peak metrics.

## Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 Glassmorphism
- **3D Engine**: Three.js WebGL Renderer
- **Deployment**: Static zero-config deployment on Vercel / GitHub Pages

## Project Structure
```
DepthWizard/
+-- assets/                  # Satellite textures and preview imagery
+-- css/
¦   +-- components.css       # Screen HUDs, comparison views, cards
¦   +-- design-tokens.css    # Colors, glassmorphism tokens, fonts
¦   +-- layout.css           # Viewport architecture, responsive grid
+-- js/
¦   +-- altitude-analytics.js# Topographic contouring & elevation charts
¦   +-- app.js               # Master application router & state controller
¦   +-- comparison-engine.js # Dual-viewport synchronizer
¦   +-- drone-flight.js      # 60 FPS WebGL flight simulator with HUD
¦   +-- terrain-engine.js    # Three.js 3D extrusion, shaders, and orbit
¦   +-- three.min.js         # Local offline-ready Three.js library
+-- api-client.js            # Aerial photo ingestion pipeline client
+-- index.html               # Main application entry point
+-- CHANGELOG_MEMBER5.md     # Changelog & component updates
+-- README.md                # Project documentation
```

## Running Locally
Open `index.html` in any modern web browser or serve via a lightweight HTTP server:
```bash
npx serve .
# or
python -m http.server 8000
```

## Deployment on Vercel
This repository is configured for automatic static deployment on [Vercel](https://vercel.com):
1. Connect your GitHub repository `dnyanu0909/DepthWizard`.
2. Keep the Framework Preset as **Other**.
3. Keep the Root Directory as `./`.
4. Deploy!
