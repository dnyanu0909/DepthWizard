/**
 * Aero3D Drone Flight Simulator
 * 100% Edge-to-Edge Canvas, First-Person Flight Dynamics,
 * Minimalist HUD with Artificial Horizon, Telemetry, and Waypoint Recorder
 */

class DroneFlightSimulator {
  constructor(canvasId, hudElements = {}) {
    this.canvas = document.getElementById(canvasId);
    this.hud = hudElements;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.terrainGroup = null;
    this.animationId = null;

    // Flight Dynamics State
    this.position = new THREE.Vector3(0, 35, 120);
    this.velocity = new THREE.Vector3(0, 0, -1);
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.pitch = 0; // up/down tilt
    this.roll = 0;  // banking angle
    this.yaw = 0;   // compass heading
    this.baseSpeed = 54; // km/h
    this.speedMultiplier = 1;
    this.altitudeAGL = 412; // meters above ground
    this.altitudeMSL = 2134;

    // Keyboard state
    this.keys = {
      w: false, s: false, a: false, d: false,
      q: false, e: false, ArrowUp: false, ArrowDown: false,
      ArrowLeft: false, ArrowRight: false
    };

    // Waypoint Recording State
    this.isRecording = false;
    this.isPlaying = false;
    this.recordTime = 0;
    this.waypoints = [];
    this.recordInterval = null;

    // Camera preset
    this.cameraPreset = 'horizon'; // 'nadir', 'oblique', 'horizon'

    this.init();
  }

  init() {
    if (!this.canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xc8b5e6, 0.0022);

    // 2. Camera (Drone Eye View)
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.5, 3500);
    this.camera.position.copy(this.position);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Atmospheric Sky Lighting
    const ambientLight = new THREE.AmbientLight(0xf2e8ff, 0.9);
    this.scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xfffaed, 1.4);
    sun.position.set(200, 350, 150);
    this.scene.add(sun);

    // 5. Generate Vast Flight Terrain Mesh
    this.buildFlightTerrain();

    // 6. Setup Controls & Listeners
    this.setupKeyListeners();
    window.addEventListener('resize', () => this.onResize());

    // 7. Start Simulation Loop
    this.animate();
  }

  buildFlightTerrain() {
    const size = 160;
    const geometry = new THREE.PlaneGeometry(1600, 1600, size - 1, size - 1);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      // Multi-octave mountain ridges & river canyon
      const nx = vx / 600;
      const nz = vz / 600;
      
      const ridge = Math.abs(Math.sin(nx * 3.5 + nz * 2.5)) * 95;
      const hills = Math.sin(nx * 8.0) * Math.cos(nz * 8.0) * 28;
      const details = Math.sin(nx * 20.0) * 8;
      
      // Meandering canyon river
      const canyonPath = Math.sin(nx * 2.2) * 140;
      const distFromRiver = Math.abs(vz - canyonPath);
      const canyonCut = Math.min(1.0, distFromRiver / 90);

      const elevation = Math.max(2, (ridge + hills + details) * canyonCut);
      pos.setY(i, elevation);

      // Color shading
      const normH = elevation / 120;
      if (elevation < 6) {
        // Canyon river
        color.setHex(0x19425e);
      } else if (normH < 0.35) {
        // Valleys / pine forest
        color.setHex(0x355436);
      } else if (normH < 0.65) {
        // Rocky scree
        color.setHex(0x6e6256);
      } else {
        // Mountain snow peaks
        color.setHex(0xdedbe8);
      }
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.terrainMesh);
  }

  setupKeyListeners() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) this.keys[key] = true;
      if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = true;
      this.updateWASDDisplay(key, true);
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) this.keys[key] = false;
      if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = false;
      this.updateWASDDisplay(key, false);
    });
  }

  updateWASDDisplay(key, isPressed) {
    const el = document.querySelector(`.key-pill.key-${key}`);
    if (el) {
      if (isPressed) el.classList.add('pressed');
      else el.classList.remove('pressed');
    }
  }

  setSpeedMultiplier(mult) {
    this.speedMultiplier = mult;
  }

  setCameraPreset(preset) {
    this.cameraPreset = preset;
    if (preset === 'nadir') {
      // 90 deg down
      this.pitch = -Math.PI / 2 + 0.05;
    } else if (preset === 'oblique') {
      // 45 deg survey
      this.pitch = -Math.PI / 4;
    } else {
      // 0 deg Horizon
      this.pitch = 0;
    }
  }

  toggleRecording() {
    this.isRecording = !this.isRecording;
    const btn = document.getElementById('record-flight-btn');
    const timerBadge = document.getElementById('rec-timer-badge');

    if (this.isRecording) {
      this.waypoints = [];
      this.recordTime = 0;
      if (btn) {
        btn.classList.add('recording');
        btn.innerHTML = `<span class="rec-dot">●</span> Stop REC`;
      }
      if (timerBadge) timerBadge.style.display = 'inline-block';

      this.recordInterval = setInterval(() => {
        this.recordTime++;
        const mins = String(Math.floor(this.recordTime / 60)).padStart(2, '0');
        const secs = String(this.recordTime % 60).padStart(2, '0');
        if (timerBadge) timerBadge.textContent = `REC 00:${mins}:${secs}`;
      }, 1000);
    } else {
      if (btn) {
        btn.classList.remove('recording');
        btn.innerHTML = `<span class="rec-dot">●</span> Record Flight`;
      }
      if (this.recordInterval) clearInterval(this.recordInterval);
    }
  }

  playFlightPath() {
    this.isPlaying = true;
    this.position.set(0, 45, 180);
    this.yaw = 0;
    this.pitch = -0.15;
    this.roll = 0;
  }

  pauseFlightPath() {
    this.isPlaying = false;
  }

  updateFlightPhysics() {
    const dt = 0.016;
    const forwardSpeed = (this.baseSpeed * this.speedMultiplier) * 0.14;

    // Pitch & Yaw handling
    if (this.keys.w || this.keys.ArrowUp) {
      this.pitch = Math.max(-1.1, this.pitch - 0.02);
    } else if (this.keys.s || this.keys.ArrowDown) {
      this.pitch = Math.min(0.8, this.pitch + 0.02);
    }

    if (this.keys.a || this.keys.ArrowLeft) {
      this.yaw += 0.025;
      this.roll = Math.max(-0.45, this.roll - 0.04);
    } else if (this.keys.d || this.keys.ArrowRight) {
      this.yaw -= 0.025;
      this.roll = Math.min(0.45, this.roll + 0.04);
    } else {
      // Re-center roll
      this.roll *= 0.92;
    }

    // Vertical altitude control
    if (this.keys.q) {
      this.position.y += 0.6 * this.speedMultiplier;
      this.altitudeAGL += 1.5 * this.speedMultiplier;
      this.altitudeMSL += 1.5 * this.speedMultiplier;
    }
    if (this.keys.e) {
      this.position.y = Math.max(12, this.position.y - 0.6 * this.speedMultiplier);
      this.altitudeAGL = Math.max(45, this.altitudeAGL - 1.5 * this.speedMultiplier);
      this.altitudeMSL = Math.max(1750, this.altitudeMSL - 1.5 * this.speedMultiplier);
    }

    // Move forward in current yaw direction
    this.position.x -= Math.sin(this.yaw) * forwardSpeed;
    this.position.z -= Math.cos(this.yaw) * forwardSpeed;

    // Loop terrain bounds
    if (this.position.z < -600) this.position.z = 600;
    if (this.position.z > 600) this.position.z = -600;
    if (this.position.x < -600) this.position.x = 600;
    if (this.position.x > 600) this.position.x = -600;

    // Apply to camera
    this.camera.position.copy(this.position);
    this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');

    // Update HUD telemetry
    this.updateHUD();
  }

  updateHUD() {
    // 1. Airspeed
    const speedEl = document.getElementById('hud-airspeed-val');
    if (speedEl) {
      const liveSpeed = Math.round(this.baseSpeed * this.speedMultiplier + Math.sin(Date.now() * 0.005) * 2);
      speedEl.textContent = liveSpeed;
    }

    // 2. Altitude
    const altEl = document.getElementById('hud-altitude-val');
    if (altEl) {
      altEl.textContent = `${Math.round(this.altitudeAGL)} m`;
    }
    const mslEl = document.getElementById('hud-msl-val');
    if (mslEl) {
      mslEl.textContent = `${Math.round(this.altitudeMSL)} m MSL`;
    }

    // 3. Heading Tape
    let deg = Math.round((-this.yaw * 180 / Math.PI) % 360);
    if (deg < 0) deg += 360;
    const compassEl = document.getElementById('hud-compass-heading');
    if (compassEl) {
      const cardinal = this.getCardinal(deg);
      compassEl.textContent = `${String(deg).padStart(3, '0')}° ${cardinal}`;
    }

    // 4. Artificial Horizon Indicator
    const horizonSvg = document.getElementById('hud-horizon-pitch-group');
    if (horizonSvg) {
      const pitchPixels = (this.pitch * 180 / Math.PI) * 2.2;
      const rollDeg = (this.roll * 180 / Math.PI);
      horizonSvg.setAttribute('transform', `rotate(${-rollDeg}, 160, 160) translate(0, ${pitchPixels})`);
    }
  }

  getCardinal(deg) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(deg / 45) % 8];
  }

  onResize() {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.updateFlightPhysics();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.recordInterval) clearInterval(this.recordInterval);
  }
}

window.DroneFlightSimulator = DroneFlightSimulator;
