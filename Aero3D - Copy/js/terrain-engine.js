/**
 * Aero3D Terrain Engine
 * Real-time 3D WebGL extruded terrain mesh generation, shader colormaps, and orbit camera
 */

class TerrainEngine {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = Object.assign({
      elevationScale: 1.2,
      colormap: 'terrain', // 'grayscale', 'turbo', 'terrain'
      wireframe: false,
      width: 256,
      height: 256,
      preset: 'mountain' // 'mountain', 'urban', 'river'
    }, options);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.terrainGeometry = null;
    this.heightData = null;
    this.controls = null;
    this.animationFrameId = null;

    this.init();
  }

  init() {
    if (!this.container) return;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 560;

    // Check for Three.js
    if (typeof THREE === 'undefined') {
      console.warn("Three.js not loaded yet, will re-attempt initialization.");
      setTimeout(() => this.init(), 100);
      return;
    }

    // 1. Scene Setup
    this.scene = new THREE.Scene();

    // 2. Camera Setup (Isometric/Oblique perspective)
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 2000);
    this.camera.position.set(180, 160, 220);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Atmospheric Lights
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.75);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    sunLight.position.set(150, 220, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x90a8e8, 0.45);
    fillLight.position.set(-150, 100, -120);
    this.scene.add(fillLight);

    // 5. Generate Procedural Height Data & Extruded Terrain Block
    this.generateHeightData(this.options.preset);
    this.buildTerrainMesh();

    // 6. Simple Orbit Controls (Drag to rotate, wheel to zoom)
    this.setupOrbitControls();

    // 7. Window resize handling
    window.addEventListener('resize', () => this.onResize());

    // 8. Render Loop
    this.animate();
  }

  generateHeightData(preset = 'mountain') {
    const size = 128;
    this.gridSize = size;
    const data = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size - 0.5;
        const ny = y / size - 0.5;
        let h = 0;

        if (preset === 'mountain') {
          // Sharp alpine ridge with canyon
          const d = Math.sqrt(nx * nx + ny * ny);
          const ridge = Math.abs(Math.sin(nx * 5.0 + ny * 3.5)) * 0.5;
          const noise1 = Math.sin(nx * 12.0) * Math.cos(ny * 12.0) * 0.18;
          const noise2 = Math.sin(nx * 24.0 + 1.2) * Math.cos(ny * 24.0) * 0.08;
          
          // River canyon cut in the middle
          const riverDist = Math.abs(ny - Math.sin(nx * 3.0) * 0.25);
          const riverValley = Math.min(1.0, riverDist * 4.0);

          h = (Math.max(0, 1.0 - d * 1.5) * (ridge + noise1 + noise2 + 0.3)) * riverValley;
        } else if (preset === 'urban') {
          // Coastal bay with stepped urban grid plateaus
          const d = Math.sqrt(nx * nx + ny * ny);
          const stepped = Math.floor((Math.sin(nx * 14.0) + Math.cos(ny * 14.0)) * 3.0) * 0.08;
          const hills = Math.cos(nx * 4.0) * 0.35;
          h = Math.max(0.02, (hills + stepped + 0.3) * (1.1 - d));
        } else if (preset === 'river') {
          // Wide meandering river basin canyon
          const canyon = Math.abs(Math.sin(nx * 2.5 + Math.cos(ny * 4.0) * 0.4));
          const strata = Math.sin(ny * 20.0) * 0.06;
          h = (canyon * 0.6 + strata + 0.2);
        }

        data[y * size + x] = Math.max(0, h);
      }
    }
    this.heightData = data;
  }

// Replace buildTerrainMesh() in terrain-engine.js
  buildTerrainMesh() {
    // 1. Properly remove and dispose the previous group to prevent ghosting
    if (this.terrainGroup) {
      this.scene.remove(this.terrainGroup);
      this.terrainGroup.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        }
      });
    }

    const size = this.gridSize;
    const planeWidth = 160;
    const planeHeight = 160;
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, size - 1, size - 1);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const h = this.heightData[i] || 0;
      // Controlled vertical scaling (max 28 units height)
      const elevation = h * 28 * this.options.elevationScale;
      pos.setY(i, elevation);

      this.getColorForHeight(h, color);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: false,
      wireframe: this.options.wireframe
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // 2. Bedrock Base
    const terrainGroup = new THREE.Group();
    terrainGroup.add(this.mesh);

    const baseGeo = new THREE.BoxGeometry(planeWidth, 8, planeHeight);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x5a4634,
      roughness: 0.95
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -4.1;
    terrainGroup.add(baseMesh);

    this.scene.add(terrainGroup);
    this.terrainGroup = terrainGroup;
  }

  getColorForHeight(h, targetColor) {
    const colormap = this.options.colormap;

    if (colormap === 'grayscale') {
      targetColor.setRGB(h, h, h);
    } else if (colormap === 'turbo') {
      // Scientific thermal spectrum
      if (h < 0.2) {
        targetColor.setRGB(0.1, 0.2 + h * 2.0, 0.8);
      } else if (h < 0.5) {
        targetColor.setRGB(0.2, 0.8, 1.0 - (h - 0.2) * 2.0);
      } else if (h < 0.75) {
        targetColor.setRGB(0.9, 0.85, 0.2);
      } else {
        targetColor.setRGB(0.9, 0.25, 0.2);
      }
    } else {
      // Realistic Topographic Natural Palette
      if (h < 0.08) {
        // Water / Lake
        targetColor.setHex(0x1a4868);
      } else if (h < 0.3) {
        // Lush Forest / Valleys
        targetColor.setHex(0x385834);
      } else if (h < 0.55) {
        // Highland Grass & Shrub
        targetColor.setHex(0x606e40);
      } else if (h < 0.75) {
        // Rocky Scree & Ridges
        targetColor.setHex(0x766a5e);
      } else {
        // High Alpine Crags & Snow
        targetColor.setHex(0xd5dadf);
      }
    }
  }

  setElevation(scale) {
    this.options.elevationScale = scale;
    if (!this.mesh || !this.heightData) return;

    const pos = this.mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const h = this.heightData[i] || 0;
      pos.setY(i, h * 45 * this.options.elevationScale);
    }
    pos.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }

  setColormap(type) {
    this.options.colormap = type;
    if (!this.mesh || !this.heightData) return;

    const colors = [];
    const color = new THREE.Color();
    for (let i = 0; i < this.heightData.length; i++) {
      this.getColorForHeight(this.heightData[i], color);
      colors.push(color.r, color.g, color.b);
    }
    this.mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }

  setPreset(presetName) {
    this.options.preset = presetName;
    this.generateHeightData(presetName);
    this.buildTerrainMesh();
  }

  setupOrbitControls() {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    this.container.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging || !this.terrainGroup) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      this.terrainGroup.rotation.y += deltaX * 0.008;
      this.terrainGroup.rotation.x = Math.max(-0.4, Math.min(0.6, this.terrainGroup.rotation.x + deltaY * 0.005));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.15;
      this.camera.position.z = Math.max(90, Math.min(450, this.camera.position.z + zoomFactor));
    }, { passive: false });
  }

  zoomIn() {
    if (this.camera) this.camera.position.z = Math.max(90, this.camera.position.z - 30);
  }

  zoomOut() {
    if (this.camera) this.camera.position.z = Math.min(450, this.camera.position.z + 30);
  }

  resetView() {
    if (this.camera && this.terrainGroup) {
      this.camera.position.set(180, 160, 220);
      this.camera.lookAt(0, 0, 0);
      this.terrainGroup.rotation.set(0, 0, 0);
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Gentle slow rotation when idle
    if (this.terrainGroup && !this.isManualInteracting) {
      this.terrainGroup.rotation.y += 0.0015;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  // Add this inside class TerrainEngine in terrain-engine.js
  loadHeightmapFromImage(imageUrl, colorTextureUrl = null) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const size = 128;
      this.gridSize = size;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const raw = ctx.getImageData(0, 0, size, size).data;
      const rawGrid = new Float32Array(size * size);

      for (let i = 0; i < size * size; i++) {
        // Luminance formula (0.299 R + 0.587 G + 0.114 B)
        const r = raw[i * 4];
        const g = raw[i * 4 + 1];
        const b = raw[i * 4 + 2];
        rawGrid[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
      }

      // --- 3x3 SMOOTHING FILTER TO ELIMINATE NEEDLE SPIKES ---
      this.heightData = new Float32Array(size * size);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          let sum = 0;
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                sum += rawGrid[ny * size + nx];
                count++;
              }
            }
          }
          
          // Softly taper edges toward zero so terrain fits cleanly on the bedrock block
          const edgeDist = Math.min(x, size - 1 - x, y, size - 1 - y);
          const edgeFade = Math.min(1.0, edgeDist / 6.0);

          this.heightData[y * size + x] = (sum / count) * edgeFade;
        }
      }

      this.buildTerrainMesh();

      // Drape texture if provided
      if (colorTextureUrl && this.mesh) {
        new THREE.TextureLoader().load(colorTextureUrl, (tex) => {
          this.mesh.material.map = tex;
          this.mesh.material.vertexColors = false;
          this.mesh.material.needsUpdate = true;
        });
      }
    };
  }
}

window.TerrainEngine = TerrainEngine;
