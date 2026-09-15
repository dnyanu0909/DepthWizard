/**
 * Aero3D 2D vs 3D Comparison Engine
 * Synchronized split-slider, coordinate grid lines, dual-view lock,
 * opacity cross-fade, and peak difference-map overlay
 */

class ComparisonEngine {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = Object.assign({
      initialSplit: 50, // percent
      isLocked: true,
      opacity: 1.0,
      showDifference: false
    }, options);

    this.sliderHandle = document.getElementById('compare-slider-handle');
    this.panel3D = document.getElementById('compare-panel-3d');
    this.diffOverlay = document.getElementById('difference-overlay-layer');
    this.gridOverlay = document.getElementById('coord-grid-overlay');

    this.isDragging = false;
    this.zoomLevel = 1.0;
    this.panOffset = { x: 0, y: 0 };

    this.init();
  }

  init() {
    if (!this.container || !this.sliderHandle || !this.panel3D) return;

    this.setupSliderDrag();
    this.setupPanAndZoom();
    this.generateDifferenceMap();
  }

  setupSliderDrag() {
    const handle = this.sliderHandle;
    const panel3D = this.panel3D;
    const container = this.container;

    const onMove = (clientX) => {
      const rect = container.getBoundingClientRect();
      let percent = ((clientX - rect.left) / rect.width) * 100;
      percent = Math.max(5, Math.min(95, percent));

      panel3D.style.width = `${percent}%`;
      handle.style.left = `${percent}%`;
    };

    handle.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        onMove(e.clientX);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch support for tablets/mobile
    handle.addEventListener('touchstart', (e) => {
      this.isDragging = true;
    });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length > 0) {
        onMove(e.touches[0].clientX);
      }
    });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  setupPanAndZoom() {
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    const img2D = document.getElementById('compare-img-2d');
    const img3D = document.getElementById('compare-img-3d');

    const updateTransforms = () => {
      const t = `translate(${this.panOffset.x}px, ${this.panOffset.y}px) scale(${this.zoomLevel})`;
      if (img2D) img2D.style.transform = t;
      if (img3D && this.options.isLocked) img3D.style.transform = t;
    };

    this.container.addEventListener('mousedown', (e) => {
      if (e.target.closest('#compare-slider-handle')) return;
      isPanning = true;
      startX = e.clientX - this.panOffset.x;
      startY = e.clientY - this.panOffset.y;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      this.panOffset.x = e.clientX - startX;
      this.panOffset.y = e.clientY - startY;
      updateTransforms();
    });

    window.addEventListener('mouseup', () => {
      isPanning = false;
    });

    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoomLevel = Math.max(0.8, Math.min(3.5, this.zoomLevel * delta));
      updateTransforms();
    }, { passive: false });
  }

  setLock(isLocked) {
    this.options.isLocked = isLocked;
    const btn = document.getElementById('btn-toggle-lock');
    if (btn) {
      if (isLocked) {
        btn.classList.add('active');
        btn.innerHTML = `<span class="icon">🔒</span> Synchronized View`;
      } else {
        btn.classList.remove('active');
        btn.innerHTML = `<span class="icon">🔓</span> Independent View`;
      }
    }
  }

  setOpacity(val) {
    this.options.opacity = val;
    const img3D = document.getElementById('compare-img-3d');
    if (img3D) {
      img3D.style.opacity = val;
    }
  }

  toggleDifferenceMap() {
    this.options.showDifference = !this.options.showDifference;
    const btn = document.getElementById('btn-toggle-diff');
    if (this.diffOverlay) {
      if (this.options.showDifference) {
        this.diffOverlay.classList.add('visible');
        if (btn) btn.classList.add('active');
      } else {
        this.diffOverlay.classList.remove('visible');
        if (btn) btn.classList.remove('active');
      }
    }
  }

  generateDifferenceMap() {
    const canvas = document.getElementById('difference-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // Draw high-altitude elevation peak heat map overlay
    const gradient = ctx.createRadialGradient(400, 280, 20, 400, 280, 260);
    gradient.addColorStop(0, 'rgba(255, 60, 40, 0.9)');
    gradient.addColorStop(0.35, 'rgba(255, 180, 20, 0.7)');
    gradient.addColorStop(0.7, 'rgba(60, 240, 180, 0.4)');
    gradient.addColorStop(1, 'rgba(30, 80, 220, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Add peak contour rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    for (let r = 30; r < 240; r += 28) {
      ctx.beginPath();
      ctx.arc(400, 280, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

window.ComparisonEngine = ComparisonEngine;
