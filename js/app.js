/**
 * Aero3D Master Application Controller
 * Routes between all 5 Screens, manages state, initializes 3D engines, and handles interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global Engine instances
  let studioTerrain = null;
  let droneSim = null;
  let compareEngine = null;
  let compareTerrain = null; // Screen 4 3D viewer
  let altitudeEngine = null;

  // Track active screen
  let activeScreenId = 'screen-1';

  // Screen Switching Logic
  const switchScreen = (targetScreenId) => {
    // Hide current screen
    const currentScreen = document.querySelector('.screen-view.active');
    if (currentScreen) {
      currentScreen.classList.remove('active');
    }

    // Show target screen
    const targetScreen = document.getElementById(targetScreenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
      activeScreenId = targetScreenId;
    }

    // Update top prototype switcher pills
    document.querySelectorAll('.screen-pill-btn').forEach(btn => {
      if (btn.dataset.target === targetScreenId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update nav links active state
    document.querySelectorAll('.nav-link').forEach(link => {
      if (
        (targetScreenId === 'screen-1' && link.dataset.target === 'screen-1') ||
        (targetScreenId === 'screen-5' && link.dataset.target === 'screen-5') ||
        (targetScreenId === 'screen-2' && link.dataset.target === 'screen-2')
      ) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Initialize or resize respective engine on switch
    onScreenActivated(targetScreenId);
  };

  const onScreenActivated = (screenId) => {
    setTimeout(() => {
      if (screenId === 'screen-2') {
        if (!studioTerrain) {
          studioTerrain = new TerrainEngine('studio-webgl-container', {
            elevationScale: 1.2,
            colormap: 'terrain',
            preset: 'mountain'
          });
        } else {
          studioTerrain.onResize();
        }
      } else if (screenId === 'screen-3') {
        if (!droneSim) {
          droneSim = new DroneFlightSimulator('drone-canvas');
        } else {
          droneSim.onResize();
        }
      } else if (screenId === 'screen-4') {
        if (!compareTerrain) {
          compareTerrain = new TerrainEngine('compare-webgl-container', {
            elevationScale: 1.2,
            colormap: 'terrain',
            preset: 'mountain'
          });
        } else {
          compareTerrain.onResize();
        }

        // Agar user pehle image upload kar chuka hai, toh 3D model yahan bhi update ho jaye
        if (selectedFile && compareTerrain) {
          const localUrl = URL.createObjectURL(selectedFile);
          const img2D = document.getElementById('compare-img-2d');
          if (img2D) img2D.src = localUrl;
          compareTerrain.loadHeightmapFromImage(localUrl, localUrl);
        }
      } else if (screenId === 'screen-5') {
        if (!altitudeEngine) {
          altitudeEngine = new AltitudeAnalyticsEngine();
        } else {
          altitudeEngine.drawTopographicMap();
          altitudeEngine.drawElevationProfile();
        }
      }
    }, 50);
  };

  // Wire Prototype Switcher Bar
  document.querySelectorAll('.screen-pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.target;
      if (target) switchScreen(target);
    });
  });

  // Wire In-App Navigation Links
  document.querySelectorAll('[data-nav-target]').forEach(elem => {
    elem.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.currentTarget.dataset.navTarget;
      if (target) switchScreen(target);
    });
  });

  // =========================================================
  // Screen 1: Landing Page Demo Sandbox Interactions
  // =========================================================
  const presetChips = document.querySelectorAll('.preset-chip');
  const demoPreviewBtn = document.getElementById('btn-generate-demo');
  const landingSplitHandle = document.getElementById('landing-split-handle');
  const landing3DPanel = document.getElementById('landing-3d-panel');
  const landingShowcaseWrapper = document.getElementById('landing-showcase-stage');

  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const preset = chip.dataset.preset;
      updateLandingDemoPreset(preset);
    });
  });

  // Preset photo datasets for Screen 1 Landing Stage
  const LANDING_PRESETS = {
    mountain: {
      time: '384 ms',
      vertices: '1.44M Vertices',
      img2d: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80', // High-contrast Alpine Peak
      img3d: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80'  // Or high-pass / DEM texture
    },
    urban: {
      time: '412 ms',
      vertices: '2.10M Vertices',
      img2d: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1400&q=80', // Direct top-down urban grid orthophoto
      img3d: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1400&q=80'
    },
    river: {
      time: '350 ms',
      vertices: '1.18M Vertices',
      img2d: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80', // River Canyon
      img3d: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80'
    }
  };

  const updateLandingDemoPreset = (preset) => {
    const statsTime = document.getElementById('stat-render-time');
    const statsPoints = document.getElementById('stat-elevation-points');
    const landingImg2D = document.getElementById('landing-img-2d');
    const landingImg3D = document.getElementById('landing-img-3d');

    const config = LANDING_PRESETS[preset] || LANDING_PRESETS.mountain;

    if (statsTime) statsTime.textContent = config.time;
    if (statsPoints) statsPoints.textContent = config.vertices;
    if (landingImg2D) landingImg2D.src = config.img2d;
    if (landingImg3D) landingImg3D.src = config.img3d;
  };

  if (demoPreviewBtn) {
    demoPreviewBtn.addEventListener('click', () => {
      demoPreviewBtn.innerHTML = `<span>⟳</span> Rendering 3D...`;
      setTimeout(() => {
        demoPreviewBtn.innerHTML = `<span>✔</span> 3D Ready (Open Studio)`;
        setTimeout(() => switchScreen('screen-2'), 400);
      }, 600);
    });
  }

  // Landing Page Interactive Split Slider Dragging
  if (landingSplitHandle && landing3DPanel && landingShowcaseWrapper) {
    let isLandingDragging = false;

    const onLandingMove = (clientX) => {
      const rect = landingShowcaseWrapper.getBoundingClientRect();
      let percent = ((clientX - rect.left) / rect.width) * 100;
      percent = Math.max(5, Math.min(95, percent));
      landing3DPanel.style.width = `${percent}%`;
      landingSplitHandle.style.left = `${percent}%`;
    };

    landingSplitHandle.addEventListener('mousedown', () => {
      isLandingDragging = true;
    });

    window.addEventListener('mousemove', (e) => {
      if (isLandingDragging) onLandingMove(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isLandingDragging = false;
    });
  }

  // =========================================================
  // Screen 2: Studio Workspace Controls
  // =========================================================
  // Elevation Slider
  const elevSlider = document.getElementById('studio-elevation-slider');
  const elevValBadge = document.getElementById('elevation-val-badge');
  if (elevSlider) {
    elevSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (elevValBadge) elevValBadge.textContent = `${val.toFixed(1)}x`;
      if (studioTerrain) studioTerrain.setElevation(val);
    });
  }

  // Colormap Pills (Grayscale, Turbo, Terrain)
  const colormapPills = document.querySelectorAll('.colormap-pill-btn');
  colormapPills.forEach(pill => {
    pill.addEventListener('click', () => {
      colormapPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const cmap = pill.dataset.colormap;
      if (studioTerrain) studioTerrain.setColormap(cmap);
    });
  });

  // Map Option Cards (Grayscale, Depth Map)
  const mapOptionCards = document.querySelectorAll('.map-option-card');
  mapOptionCards.forEach(card => {
    card.addEventListener('click', () => {
      mapOptionCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const type = card.dataset.type;
      if (type === 'grayscale') {
        if (studioTerrain) studioTerrain.setColormap('grayscale');
      } else if (type === 'depth') {
        if (studioTerrain) studioTerrain.setColormap('turbo');
      }
    });
  });

  // Drag and Drop Image Upload Simulation
  // Real Ingestion pipeline with API Client
// --- STUDIO UPLOAD & PROCESSING PIPELINE ---
  const dropArea = document.getElementById('studio-drop-area');
  const fileInput = document.getElementById('studio-file-input');
  const processBtn = document.getElementById('btn-process-image') || document.querySelector('.sidebar-card .btn-primary');
  let selectedFile = null;
  let isProcessing = false;

  async function handleFileProcess(file) {
    if (!file || isProcessing) return;
    selectedFile = file;
    isProcessing = true;

    if (processBtn) {
      processBtn.disabled = true;
      processBtn.style.opacity = '0.6';
      processBtn.innerHTML = `<span>⏳</span> Analyzing Contours...`;
    }

    // 1. Immediately update upload box UI to show preview badge
    if (dropArea) {
      const localPreview = URL.createObjectURL(file);
      dropArea.innerHTML = `
        <div class="uploaded-preview-badge" style="width: 100%; justify-content: flex-start; display: flex; align-items: center; gap: 12px; padding: 8px 12px;">
          <img src="${localPreview}" class="preview-thumb" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;" />
          <div style="text-align: left;">
            <p style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 0;">${file.name}</p>
            <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0 0;">${(file.size / 1024).toFixed(1)} KB • Processing...</p>
          </div>
        </div>
      `;
    }

    showToast(`Uploading ${file.name} to Vision Pipeline...`);

    try {
      const res = await window.AeroApiClient.uploadImage(file);
      const result = res.data;

      showToast("Elevation mesh generated!");

      // 2. Load smoothed heightmap into Studio 3D view
      if (studioTerrain) {
        studioTerrain.loadHeightmapFromImage(result.heightmap_url, result.original_url);
      }

      // 3. Update Drone flight mesh (instantiate safely if not created yet)
      if (!droneSim) {
        const droneCanvas = document.getElementById('drone-canvas');
        if (droneCanvas) {
          droneSim = new DroneFlightSimulator('drone-canvas');
        }
      }
      if (droneSim) {
        droneSim.loadHeightmapFromImage(result.heightmap_url, result.original_url);
      }

      // 4. Update Screen 4 2D Image & 3D Model
      const img2D = document.getElementById('compare-img-2d');
      if (img2D) img2D.src = result.original_url;

      if (compareTerrain) {
        compareTerrain.loadHeightmapFromImage(result.heightmap_url, result.original_url);
      }

      // 5. Update Screen 5 Telemetry cards
      const peakVal = document.querySelector('.metric-primary-val');
      if (peakVal && result.peak_alt) {
        peakVal.textContent = `${result.peak_alt.toLocaleString()} m`;
      }

    } catch (err) {
      console.error("[Aero3D Upload Error]", err);
      showToast("Upload failed. Check console for details.");
    } finally {
      isProcessing = false;
      if (processBtn) {
        processBtn.disabled = false;
        processBtn.style.opacity = '1';
        processBtn.innerHTML = `Process Image`;
      }
    }
  }

  // --- DROP ZONE & FILE INPUT LISTENERS ---
  if (dropArea && fileInput) {
    dropArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileProcess(e.target.files[0]);
      }
    });

    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.style.borderColor = 'var(--accent-purple)';
    });

    dropArea.addEventListener('dragleave', () => {
      dropArea.style.borderColor = '';
    });

    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileProcess(e.dataTransfer.files[0]);
      }
    });
  }

  // --- PROCESS IMAGE BUTTON ---
  if (processBtn) {
    processBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (selectedFile) {
        handleFileProcess(selectedFile);
      } else if (fileInput) {
        fileInput.click();
      }
    });
  }

  // --- EXPORT CONTROLS (OBJ, GLTF, GeoTIFF) ---
  document.querySelectorAll('.btn-export').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const format = e.currentTarget.dataset.format || 'Mesh';
      if (format === 'OBJ') return;
      showToast(`Exporting ${format} terrain package... File generated.`);
    });
  });

  const btnExportOBJ = document.querySelector('[data-format="OBJ"]') || document.getElementById('btn-export-obj');
  if (btnExportOBJ) {
    btnExportOBJ.addEventListener('click', () => {
      if (!studioTerrain || !studioTerrain.mesh) {
        showToast("No active terrain to export!");
        return;
      }

      showToast("Packaging Wavefront 3D OBJ file...");

      const geom = studioTerrain.mesh.geometry;
      const pos = geom.attributes.position;
      let objContent = "# Aero3D Extruded Digital Elevation Model\n";

      for (let i = 0; i < pos.count; i++) {
        objContent += `v ${pos.getX(i).toFixed(3)} ${pos.getY(i).toFixed(3)} ${pos.getZ(i).toFixed(3)}\n`;
      }

      if (geom.index) {
        const idx = geom.index;
        for (let i = 0; i < idx.count; i += 3) {
          objContent += `f ${idx.getX(i) + 1} ${idx.getX(i + 1) + 1} ${idx.getX(i + 2) + 1}\n`;
        }
      }

      const blob = new Blob([objContent], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Aero3D_Terrain_Mesh_${Date.now()}.obj`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  // --- ZOOM & CAMERA CONTROLS ---
  const btnZoomIn = document.getElementById('stage-zoom-in');
  const btnZoomOut = document.getElementById('stage-zoom-out');
  const btnReset = document.getElementById('stage-reset-view');

  if (btnZoomIn) btnZoomIn.addEventListener('click', () => studioTerrain && studioTerrain.zoomIn());
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => studioTerrain && studioTerrain.zoomOut());
  if (btnReset) btnReset.addEventListener('click', () => studioTerrain && studioTerrain.resetView());

  // =========================================================
  // Screen 3: Drone Flight View Controls
  // =========================================================
  // Speed multipliers
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mult = parseInt(btn.dataset.speed, 10) || 1;
      if (droneSim) droneSim.setSpeedMultiplier(mult);
    });
  });

  // Camera presets (Nadir 90, Oblique 45, Horizon 0)
  document.querySelectorAll('.camera-preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.camera-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.dataset.preset;
      if (droneSim) droneSim.setCameraPreset(preset);
    });
  });

  // Waypoint Record/Play
  const recordBtn = document.getElementById('record-flight-btn');
  const playBtn = document.getElementById('play-flight-btn');
  const pauseBtn = document.getElementById('pause-flight-btn');

  if (recordBtn) {
    recordBtn.addEventListener('click', () => {
      if (droneSim) droneSim.toggleRecording();
    });
  }
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (droneSim) droneSim.playFlightPath();
      showToast('Replaying recorded waypoint flight path...');
    });
  }
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (droneSim) droneSim.pauseFlightPath();
      showToast('Flight path paused.');
    });
  }

  // =========================================================
  // Screen 4: 2D vs 3D Comparison Window Controls
  // =========================================================
  const lockBtn = document.getElementById('btn-toggle-lock');
  const diffBtn = document.getElementById('btn-toggle-diff');
  const opacitySlider = document.getElementById('compare-opacity-slider');

  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      if (compareEngine) {
        const nextState = !compareEngine.options.isLocked;
        compareEngine.setLock(nextState);
      }
    });
  }

  if (diffBtn) {
    diffBtn.addEventListener('click', () => {
      if (compareEngine) compareEngine.toggleDifferenceMap();
    });
  }

  if (opacitySlider) {
    opacitySlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (compareEngine) compareEngine.setOpacity(val);
    });
  }

  // Simple Notification Toast
  function showToast(msg) {
    let toast = document.getElementById('aero-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'aero-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '28px';
      toast.style.background = 'rgba(24, 32, 76, 0.9)';
      toast.style.color = '#fff';
      toast.style.backdropFilter = 'blur(12px)';
      toast.style.padding = '12px 22px';
      toast.style.borderRadius = '30px';
      toast.style.fontFamily = '"Times New Roman", Times, serif';
      toast.style.fontSize = '14px';
      toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
      toast.style.zIndex = '100000';
      toast.style.border = '1px solid rgba(255,255,255,0.3)';
      toast.style.transition = 'all 0.3s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
    }, 2800);
  }

  // Render realistic sidebar thumbnails
  function renderSidebarThumbnails() {
    const cvsGray = document.getElementById('thumb-grayscale');
    if (cvsGray) {
      const ctx = cvsGray.getContext('2d');
      const w = cvsGray.width;
      const h = cvsGray.height;
      const imgData = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = x / w - 0.5;
          const ny = y / h - 0.5;
          const ridge = Math.abs(Math.sin(nx * 8.0 + ny * 5.0));
          const noise = Math.sin(nx * 20.0) * Math.cos(ny * 20.0) * 0.2;
          const val = Math.floor(Math.max(0, Math.min(255, (ridge + noise) * 220)));
          const idx = (y * w + x) * 4;
          imgData.data[idx] = val;
          imgData.data[idx + 1] = val;
          imgData.data[idx + 2] = val;
          imgData.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const cvsDepth = document.getElementById('thumb-depth');
    if (cvsDepth) {
      const ctx = cvsDepth.getContext('2d');
      const w = cvsDepth.width;
      const h = cvsDepth.height;
      const grad = ctx.createRadialGradient(w * 0.55, h * 0.45, 4, w * 0.5, h * 0.5, w * 0.6);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, '#aaaaaa');
      grad.addColorStop(0.7, '#444444');
      grad.addColorStop(1, '#080808');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }
  renderSidebarThumbnails();

  // Initial screen setup
  switchScreen('screen-1');

  // Screen 1 initialization
  updateLandingDemoPreset('mountain');
});
