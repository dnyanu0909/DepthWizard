/**
 * Aero3D Altitude & Location Analytics Engine
 * Interactive Topographic Map (Contour Lines, Pins, Flight Trajectory),
 * Analytical Side Panel, Elevation Profile 2D Cross-Section Graph,
 * Coordinate Search and Report Export
 */

class AltitudeAnalyticsEngine {
  constructor() {
    this.mapCanvas = document.getElementById('topographic-map-canvas');
    this.profileCanvas = document.getElementById('elevation-profile-canvas');
    
    // Altitude metrics
    this.metrics = {
      location: "Alpine Ridge, Rocky Mountains, Colorado, USA",
      currentAlt: 2134,
      currentAltFt: 7001,
      minAlt: 1245,
      avgAlt: 1890,
      peakAlt: 2542,
      coordsLat: "35° 50' 35.12\" N",
      coordsLon: "120° 16' 47.85\" E",
      coordsUTM: "UTM 11S 275432 3975434",
      distanceKm: 14.6,
      elevationGain: 1289
    };

    this.profileData = [
      { dist: 0.5, alt: 1250 },
      { dist: 1.5, alt: 1380 },
      { dist: 2.0, alt: 1520 },
      { dist: 3.2, alt: 1680 },
      { dist: 4.0, alt: 1710 },
      { dist: 5.5, alt: 1930 },
      { dist: 6.0, alt: 2134 }, // Peak marker
      { dist: 7.2, alt: 2280 },
      { dist: 8.0, alt: 2450 },
      { dist: 9.1, alt: 2542 }, // High summit
      { dist: 10.0, alt: 2360 },
      { dist: 11.5, alt: 2120 },
      { dist: 12.0, alt: 1980 },
      { dist: 13.2, alt: 1840 },
      { dist: 14.0, alt: 1720 },
      { dist: 14.6, alt: 1650 }
    ];

    this.init();
  }

  init() {
    this.drawTopographicMap();
    this.drawElevationProfile();
    this.setupEventListeners();

    window.addEventListener('resize', () => {
      this.drawTopographicMap();
      this.drawElevationProfile();
    });
  }

  drawTopographicMap() {
    if (!this.mapCanvas) return;
    const canvas = this.mapCanvas;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 800);
    const height = (canvas.height = canvas.parentElement.clientHeight || 460);

    // 1. Background Hillshade Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#c2d2ee');
    bgGrad.addColorStop(0.4, '#d8cbe8');
    bgGrad.addColorStop(0.7, '#e8cbdc');
    bgGrad.addColorStop(1, '#bcd0ec');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Alpine Lake
    ctx.fillStyle = 'rgba(85, 142, 196, 0.7)';
    ctx.beginPath();
    ctx.ellipse(width * 0.18, height * 0.65, 34, 18, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // 3. Topographic Contour Lines
    ctx.lineWidth = 1;
    const centerX = width * 0.48;
    const centerY = height * 0.42;

    for (let r = 24; r < Math.max(width, height); r += 16) {
      ctx.beginPath();
      const isIndexLine = (r % 64 === 0);
      ctx.strokeStyle = isIndexLine ? 'rgba(70, 60, 120, 0.42)' : 'rgba(70, 60, 120, 0.18)';
      ctx.lineWidth = isIndexLine ? 1.5 : 0.8;

      for (let angle = 0; angle <= Math.PI * 2 + 0.1; angle += 0.1) {
        // Perturb radius with organic mountain noise
        const perturbation = 
          Math.sin(angle * 4) * (r * 0.15) + 
          Math.cos(angle * 7) * (r * 0.08) +
          Math.sin(angle * 2.5 + 1.2) * 12;
        
        const radius = r + perturbation;
        const x = centerX + Math.cos(angle) * radius * 1.35;
        const y = centerY + Math.sin(angle) * radius * 0.95;

        if (angle === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Contour elevation labels on index lines
      if (isIndexLine && r < 280) {
        ctx.fillStyle = 'rgba(70, 60, 120, 0.65)';
        ctx.font = '10px "Times New Roman"';
        ctx.fillText(`${1400 + r * 3} m`, centerX + r * 1.1, centerY - 6);
      }
    }

    // 4. Cartographic Lat/Long Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const numCols = 6;
    for (let i = 1; i < numCols; i++) {
      const gx = (width / numCols) * i;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }

    const numRows = 5;
    for (let j = 1; j < numRows; j++) {
      const gy = (height / numRows) * j;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 5. Dotted Flight Path Trajectory Line
    ctx.strokeStyle = '#5c41c7';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(width * 0.12, height * 0.85);
    ctx.quadraticCurveTo(width * 0.28, height * 0.72, width * 0.36, height * 0.52);
    ctx.bezierCurveTo(width * 0.40, height * 0.44, width * 0.44, height * 0.42, centerX, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Waypoint dots along flight path
    const waypoints = [
      { x: width * 0.12, y: height * 0.85 },
      { x: width * 0.24, y: height * 0.73 },
      { x: width * 0.35, y: height * 0.54 },
      { x: centerX, y: centerY }
    ];

    waypoints.forEach(wp => {
      ctx.fillStyle = '#5c41c7';
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  drawElevationProfile() {
    if (!this.profileCanvas) return;
    const canvas = this.profileCanvas;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.parentElement.clientWidth || 900);
    const height = (canvas.height = canvas.parentElement.clientHeight || 140);

    const padLeft = 45;
    const padRight = 30;
    const padTop = 15;
    const padBottom = 28;

    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    ctx.clearRect(0, 0, width, height);

    const minAlt = 1000;
    const maxAlt = 2800;
    const maxDist = 14.6;

    const getX = (dist) => padLeft + (dist / maxDist) * plotWidth;
    const getY = (alt) => padTop + plotHeight - ((alt - minAlt) / (maxAlt - minAlt)) * plotHeight;

    // Grid lines
    ctx.strokeStyle = 'rgba(70, 60, 120, 0.12)';
    ctx.lineWidth = 1;
    for (let alt = 1200; alt <= 2600; alt += 400) {
      const gy = getY(alt);
      ctx.beginPath();
      ctx.moveTo(padLeft, gy);
      ctx.lineTo(width - padRight, gy);
      ctx.stroke();

      ctx.fillStyle = 'rgba(70, 60, 120, 0.55)';
      ctx.font = '10px "Times New Roman"';
      ctx.fillText(`${alt}m`, 8, gy + 3);
    }

    // Gradient fill under profile curve
    const fillGrad = ctx.createLinearGradient(0, padTop, 0, padTop + plotHeight);
    fillGrad.addColorStop(0, 'rgba(123, 98, 219, 0.45)');
    fillGrad.addColorStop(0.7, 'rgba(230, 174, 202, 0.25)');
    fillGrad.addColorStop(1, 'rgba(164, 183, 232, 0.05)');

    ctx.beginPath();
    ctx.moveTo(getX(this.profileData[0].dist), padTop + plotHeight);

    this.profileData.forEach((pt, i) => {
      const px = getX(pt.dist);
      const py = getY(pt.alt);
      if (i === 0) ctx.lineTo(px, py);
      else ctx.lineTo(px, py);
    });

    ctx.lineTo(getX(this.profileData[this.profileData.length - 1].dist), padTop + plotHeight);
    ctx.closePath();
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Elevation Profile Line Stroke
    ctx.strokeStyle = '#5c41c7';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    this.profileData.forEach((pt, i) => {
      const px = getX(pt.dist);
      const py = getY(pt.alt);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Active Pin Point (2,134 m summit)
    const summitPt = this.profileData[5];
    const sx = getX(summitPt.dist);
    const sy = getY(summitPt.alt);

    ctx.fillStyle = '#5c41c7';
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Distance Axis Labels (500m, 2km, 4km, 6km, 8km, 10km, 12km, 14km)
    const distTicks = [0.5, 2, 4, 6, 8, 10, 12, 14];
    ctx.fillStyle = 'rgba(70, 60, 120, 0.7)';
    ctx.font = '11px "Times New Roman"';
    distTicks.forEach(d => {
      const dx = getX(d);
      const label = d === 0.5 ? '500 m' : `${d} km`;
      ctx.fillText(label, dx - 14, height - 8);
    });
  }

  setupEventListeners() {
    // Coordinate search bar
    const searchInput = document.getElementById('coord-search-input');
    const searchBtn = document.getElementById('coord-search-btn');

    const handleSearch = () => {
      const query = searchInput ? searchInput.value.trim() : '';
      if (!query) return;
      alert(`Locating coordinates: "${query}"\nBounding Box re-centered on Alpine Summit.`);
    };

    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSearch();
      });
    }

    // Export Summary Report Button
    const exportBtn = document.getElementById('export-summary-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.generateSummaryReport();
      });
    }
  }

  generateSummaryReport() {
    const reportText = `=====================================================
Aero3D GEOSPATIAL TERRAIN & ELEVATION SUMMARY REPORT
Generated: ${new Date().toLocaleString()}
EPSG: 4326 (WGS 84)
=====================================================

LOCATION:
  Region: Alpine Ridge, Rocky Mountains, Colorado, USA
  Latitude: 35° 50' 35.12" N
  Longitude: 120° 16' 47.85" E
  UTM Grid: 11S 275432 3975434

ELEVATION ANALYTICS:
  Current Survey Point: 2,134 m (7,001 ft)
  Minimum Elevation: 1,245 m
  Average Elevation: 1,890 m
  Peak Elevation: 2,542 m
  Total Flight Survey Distance: 14.6 km
  Net Elevation Gain: 1,289 m

DATA INTEGRITY:
  Source: 16-bit GeoTIFF Orthophoto & Monocular DEM Extrusion
  Horizontal Resolution: 0.5m GSD
  Vertical Accuracy: ±0.35m RMSE
=====================================================
Aero3D Cartographic Analytics Engine © 2024`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aero3D_Elevation_Report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

window.AltitudeAnalyticsEngine = AltitudeAnalyticsEngine;
